import { Router } from 'express';
import OpenAI from 'openai';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';
import { getStoreContext } from '../lib/storeContext.js';
import { getBestSlots, DEFAULT_WEEKDAY } from '../lib/scheduling.js';
import { db } from '../../db/index.js';
import { metricsSnapshots, contentPosts } from '../../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const router = Router();

const SYSTEM_PROMPT =
  'Eres un experto en marketing digital especializado en tiendas y concesionarios de motos. ' +
  'Respondes siempre en español y únicamente con JSON válido, sin texto adicional.';

const VALID_NETWORKS = ['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'X', 'YOUTUBE'];

const FORMAT_GUIDE: Record<string, string> = {
  REEL: 'Formato Reel: guion hablado breve, hook potente en los primeros 3 segundos, frases listas para texto en pantalla, ritmo dinámico y cierre con CTA.',
  SHORT: 'Formato Short (vertical): muy directo, hook inmediato, máximo impacto en pocos segundos.',
  STORY: 'Formato Story: una sola frase corta y directa + sugiere un sticker o encuesta para interacción.',
  POST: 'Formato Post/Carrusel: estructura problema → beneficio → CTA, párrafos cortos y escaneables.',
};

// Heurística temporal de hora por red (la Fase 3 la refina con datos).
const DEFAULT_HOUR: Record<string, string> = {
  INSTAGRAM: '19:00',
  TIKTOK: '20:00',
  FACEBOOK: '12:00',
  X: '13:00',
  YOUTUBE: '18:00',
};

function groqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  // Groq expone una API compatible con OpenAI.
  return new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' });
}

const MODEL = () => process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

// Devuelve "YYYY-MM-DDTHH:mm" (compatible con <input type="datetime-local">).
function toLocalInput(date: Date, hhmm: string): string {
  const [h, m] = hhmm.split(':');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${h}:${m}`;
}

function mapGroqError(error: any, res: any) {
  console.error('Groq Error:', error);
  if (error?.status === 401) {
    return res.status(401).json({ error: 'La GROQ_API_KEY no es válida. Revísala en tu archivo .env.' });
  }
  if (error?.status === 429) {
    return res.status(429).json({ error: 'Límite de uso de Groq alcanzado. Espera un momento e intenta de nuevo.' });
  }
  return res.status(500).json({ error: error?.message || 'Falló la generación con IA.' });
}

/* ───────────────────────── Generador de post individual ───────────────────────── */

router.post('/generate-post', authMiddleware, async (req: AuthRequest, res) => {
  const { contentType, topic, tone, platform } = req.body;

  if (!topic || typeof topic !== 'string' || !topic.trim()) {
    return res.status(400).json({ error: 'Falta el detalle / tema del contenido.' });
  }

  const net = VALID_NETWORKS.includes(platform) ? platform : 'INSTAGRAM';

  const groq = groqClient();
  if (!groq) {
    return res.status(400).json({ error: 'GROQ_API_KEY no configurada. Agrégala a tu archivo .env.' });
  }

  let storeContext = '';
  try {
    storeContext = await getStoreContext(req.user!.userId);
  } catch (err) {
    console.error('No se pudo cargar el perfil de tienda:', err);
  }

  const subjectMap: Record<string, string> = {
    MOTO: `la moto ${topic}`,
    PROMO: `esta promoción o descuento del concesionario: ${topic}`,
    EVENTO: `este evento o rodada: ${topic}`,
    GENERAL: `${topic}`,
  };
  const subject = subjectMap[contentType] || `${topic}`;

  const userPrompt = `${storeContext ? storeContext + '\n\n' : ''}Crea un post para ${net} sobre ${subject}.
Tono: ${tone || 'ENTUSIASTA'}.
Incluye un copy persuasivo con un llamado a la acción claro y 5 hashtags relevantes (mezcla generales y locales si aplica).
Además sugiere la imagen de DOS formas: "photoIdea" = qué FOTO REAL tomar (si es una moto concreta, recomienda fotografiar la unidad real); "aiImagePrompt" = prompt en INGLÉS listo para un generador de imágenes IA (ideal para banners, promos o lifestyle).
Devuelve estrictamente este JSON: {"content": "texto del post", "hashtags": "#moto ...", "title": "título corto", "photoIdea": "...", "aiImagePrompt": "..."}`;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL(),
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) return res.status(502).json({ error: 'La IA no devolvió contenido. Intenta de nuevo.' });

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: 'La IA devolvió una respuesta con formato inválido. Intenta de nuevo.' });
    }

    if (!parsed || typeof parsed.content !== 'string' || !parsed.content.trim()) {
      return res.status(502).json({ error: 'La IA no generó un copy válido. Intenta de nuevo.' });
    }

    // Fecha sugerida: mañana, a la hora típica de la red.
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const suggestedAt = toLocalInput(d, DEFAULT_HOUR[net] || '18:00');

    return res.json({
      content: parsed.content,
      hashtags: typeof parsed.hashtags === 'string' ? parsed.hashtags : '',
      title: typeof parsed.title === 'string' ? parsed.title : '',
      photoIdea: typeof parsed.photoIdea === 'string' ? parsed.photoIdea : '',
      aiImagePrompt: typeof parsed.aiImagePrompt === 'string' ? parsed.aiImagePrompt : '',
      suggestedAt,
    });
  } catch (error: any) {
    return mapGroqError(error, res);
  }
});

/* ───────────────────────── Ideas de contenido (Fase 2.2) ───────────────────────── */

router.post('/content-ideas', authMiddleware, async (req: AuthRequest, res) => {
  let { networks, count, periodStart, periodDays, goal } = req.body;

  networks = Array.isArray(networks) ? networks.filter((n: any) => VALID_NETWORKS.includes(n)) : [];
  if (networks.length === 0) {
    return res.status(400).json({ error: 'Selecciona al menos una red social.' });
  }

  count = Math.max(1, Math.min(30, Number(count) || 8));
  periodDays = Math.max(1, Math.min(90, Number(periodDays) || 30));
  const start = periodStart ? new Date(periodStart) : new Date();
  if (Number.isNaN(start.getTime())) {
    return res.status(400).json({ error: 'Fecha de inicio inválida.' });
  }

  // Hora preferida configurable ('' = automática: usa métricas o heurística).
  const preferredHour =
    typeof req.body.preferredHour === 'string' && /^\d{2}:\d{2}$/.test(req.body.preferredHour)
      ? req.body.preferredHour
      : '';

  const groq = groqClient();
  if (!groq) {
    return res.status(400).json({ error: 'GROQ_API_KEY no configurada. Agrégala a tu archivo .env.' });
  }

  let storeContext = '';
  try {
    storeContext = await getStoreContext(req.user!.userId);
  } catch (err) {
    console.error('No se pudo cargar el perfil de tienda:', err);
  }

  const userPrompt = `${storeContext ? storeContext + '\n\n' : ''}Genera exactamente ${count} ideas de contenido para redes sociales de esta tienda de motos.
Redes disponibles (usa solo estas): ${networks.join(', ')}.
${goal ? `Objetivo de la campaña: ${goal}.` : ''}
Varía los pilares de contenido: educativo, venta, testimonio/prueba social, oferta, evento/rodada, mantenimiento/tips, detrás de cámaras.
Para cada idea define el formato según la red: REEL, STORY, POST o SHORT.
Devuelve estrictamente este JSON:
{"ideas":[{"pillar":"...","topic":"...","network":"UNA de las redes dadas","format":"REEL|STORY|POST|SHORT","hook":"gancho corto","cta":"llamado a la acción"}]}`;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL(),
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9,
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) return res.status(502).json({ error: 'La IA no devolvió ideas. Intenta de nuevo.' });

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: 'La IA devolvió un formato inválido. Intenta de nuevo.' });
    }

    const rawIdeas: any[] = Array.isArray(parsed?.ideas) ? parsed.ideas : [];
    if (rawIdeas.length === 0) {
      return res.status(502).json({ error: 'La IA no generó ideas válidas. Intenta de nuevo.' });
    }

    // Mejores slots por red según TUS métricas (fallback heurístico).
    const slots = await getBestSlots(req.user!.userId);

    // Reordenar: evitar pilar/formato repetidos en publicaciones seguidas.
    const pool = rawIdeas.slice(0, count);
    const ordered: any[] = [];
    while (pool.length) {
      const prev = ordered[ordered.length - 1];
      let idx = pool.findIndex(
        (x) =>
          !prev ||
          (String(x?.pillar) !== String(prev?.pillar) &&
            String(x?.format) !== String(prev?.format))
      );
      if (idx === -1)
        idx = pool.findIndex((x) => !prev || String(x?.pillar) !== String(prev?.pillar));
      if (idx === -1) idx = 0;
      ordered.push(pool.splice(idx, 1)[0]);
    }

    const step = periodDays / Math.max(1, ordered.length);
    const ideas = ordered.map((it, i) => {
      // Balance de redes: round-robin sobre las elegidas.
      const network = networks[i % networks.length];
      const slot = slots[network] || { hour: null, weekday: null };
      const weekday = slot.weekday ?? DEFAULT_WEEKDAY[network] ?? null;
      const hour = preferredHour || slot.hour || DEFAULT_HOUR[network] || '18:00';

      const base = new Date(start);
      base.setDate(base.getDate() + Math.round(i * step));
      // Acercar al mejor día de la semana (±3 días, sin salir del inicio).
      if (weekday != null) {
        for (let off = 0; off <= 3; off++) {
          const fwd = new Date(base);
          fwd.setDate(fwd.getDate() + off);
          if (fwd.getDay() === weekday) {
            base.setTime(fwd.getTime());
            break;
          }
          const bwd = new Date(base);
          bwd.setDate(bwd.getDate() - off);
          if (off > 0 && bwd >= start && bwd.getDay() === weekday) {
            base.setTime(bwd.getTime());
            break;
          }
        }
      }

      return {
        pillar: String(it?.pillar || 'General'),
        topic: String(it?.topic || 'Idea de contenido'),
        network,
        format: ['REEL', 'STORY', 'POST', 'SHORT'].includes(it?.format) ? it.format : 'POST',
        hook: String(it?.hook || ''),
        cta: String(it?.cta || ''),
        suggestedAt: toLocalInput(base, hour),
      };
    });

    return res.json({ ideas });
  } catch (error: any) {
    return mapGroqError(error, res);
  }
});

/* ───────────────────────── Expandir idea → publicación (Fase 2.4) ───────────────────────── */

router.post('/expand-idea', authMiddleware, async (req: AuthRequest, res) => {
  const { idea } = req.body;

  if (!idea || typeof idea !== 'object' || !idea.topic) {
    return res.status(400).json({ error: 'Falta la idea a expandir.' });
  }

  const groq = groqClient();
  if (!groq) {
    return res.status(400).json({ error: 'GROQ_API_KEY no configurada. Agrégala a tu archivo .env.' });
  }

  let storeContext = '';
  try {
    storeContext = await getStoreContext(req.user!.userId);
  } catch (err) {
    console.error('No se pudo cargar el perfil de tienda:', err);
  }

  const network = VALID_NETWORKS.includes(idea.network) ? idea.network : 'INSTAGRAM';
  const format = ['REEL', 'STORY', 'POST', 'SHORT'].includes(idea.format) ? idea.format : 'POST';

  const userPrompt = `${storeContext ? storeContext + '\n\n' : ''}Convierte esta idea en la publicación final para ${network}, formato ${format}.
Tema: ${idea.topic}.
${idea.hook ? `Gancho: ${idea.hook}.` : ''}
${idea.cta ? `Llamado a la acción: ${idea.cta}.` : ''}
${FORMAT_GUIDE[format] || ''}
Incluye 5 hashtags relevantes (mezcla generales y locales si aplica).
Además sugiere la imagen de DOS formas: "photoIdea" = qué FOTO REAL tomar (si es una moto concreta, recomienda fotografiar la unidad real); "aiImagePrompt" = prompt en INGLÉS listo para un generador de imágenes IA (ideal para banners, promos o lifestyle).
Devuelve estrictamente este JSON: {"content": "texto de la publicación", "hashtags": "#moto ...", "title": "título corto", "photoIdea": "...", "aiImagePrompt": "..."}`;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL(),
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) return res.status(502).json({ error: 'La IA no devolvió contenido. Intenta de nuevo.' });

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: 'La IA devolvió un formato inválido. Intenta de nuevo.' });
    }

    if (!parsed || typeof parsed.content !== 'string' || !parsed.content.trim()) {
      return res.status(502).json({ error: 'La IA no generó un copy válido. Intenta de nuevo.' });
    }

    return res.json({
      content: parsed.content,
      hashtags: typeof parsed.hashtags === 'string' ? parsed.hashtags : '',
      title: typeof parsed.title === 'string' ? parsed.title : '',
      photoIdea: typeof parsed.photoIdea === 'string' ? parsed.photoIdea : '',
      aiImagePrompt: typeof parsed.aiImagePrompt === 'string' ? parsed.aiImagePrompt : '',
    });
  } catch (error: any) {
    return mapGroqError(error, res);
  }
});

/* ───────────────────────── Variantes A/B del copy (Fase 4) ───────────────────────── */

router.post('/variants', authMiddleware, async (req: AuthRequest, res) => {
  const { base, network, format } = req.body;

  if (!base || typeof base !== 'string' || !base.trim()) {
    return res.status(400).json({ error: 'Falta el texto base.' });
  }

  const groq = groqClient();
  if (!groq) {
    return res.status(400).json({ error: 'GROQ_API_KEY no configurada. Agrégala a tu archivo .env.' });
  }

  let storeContext = '';
  try {
    storeContext = await getStoreContext(req.user!.userId);
  } catch (err) {
    console.error('No se pudo cargar el perfil de tienda:', err);
  }

  const net = VALID_NETWORKS.includes(network) ? network : 'INSTAGRAM';
  const fmt = ['REEL', 'STORY', 'POST', 'SHORT'].includes(format) ? format : 'POST';

  const userPrompt = `${storeContext ? storeContext + '\n\n' : ''}Reescribe este copy en 3 variantes A/B DISTINTAS para ${net}.
${FORMAT_GUIDE[fmt] || ''}
Cada variante con un ángulo diferente: 1) emocional/aspiracional, 2) directo/oferta, 3) informativo/beneficios. Cada una con CTA.
Copy base: "${base}"
Devuelve estrictamente este JSON: {"variants":["...","...","..."]}`;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL(),
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.95,
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) return res.status(502).json({ error: 'La IA no devolvió contenido. Intenta de nuevo.' });

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: 'La IA devolvió un formato inválido. Intenta de nuevo.' });
    }

    const variants = Array.isArray(parsed?.variants)
      ? parsed.variants.map((x: any) => String(x)).filter((s: string) => s.trim()).slice(0, 3)
      : [];

    if (variants.length === 0) {
      return res.status(502).json({ error: 'La IA no generó variantes. Intenta de nuevo.' });
    }

    return res.json({ variants });
  } catch (error: any) {
    return mapGroqError(error, res);
  }
});

/* ───────────────────────── Slogans + Hashtags/SEO (Fase 5) ───────────────────────── */

router.post('/slogans-seo', authMiddleware, async (req: AuthRequest, res) => {
  const { topic } = req.body;

  if (!topic || typeof topic !== 'string' || !topic.trim()) {
    return res.status(400).json({ error: 'Falta el tema / modelo / campaña.' });
  }

  const groq = groqClient();
  if (!groq) {
    return res.status(400).json({ error: 'GROQ_API_KEY no configurada. Agrégala a tu archivo .env.' });
  }

  let storeContext = '';
  try {
    storeContext = await getStoreContext(req.user!.userId);
  } catch (err) {
    console.error('No se pudo cargar el perfil de tienda:', err);
  }

  const userPrompt = `${storeContext ? storeContext + '\n\n' : ''}Para esta tienda de motos y el tema "${topic}", genera:
1) 7 slogans cortos y memorables (máx 8 palabras).
2) Hashtags clasificados: "grandes" (alto volumen), "medianos", "nicho" (específicos de moto) y "locales" (con la ciudad de la tienda).
3) SEO local: "googleBusiness" (descripción optimizada de 2-3 frases para Google Business), "metaDescription" (máx 155 caracteres) y "keywords" (8-12 palabras clave locales para posicionar).
Devuelve estrictamente este JSON:
{"slogans":["..."],"hashtags":{"grandes":["#..."],"medianos":["#..."],"nicho":["#..."],"locales":["#..."]},"seo":{"googleBusiness":"...","metaDescription":"...","keywords":["..."]}}`;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL(),
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.85,
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) return res.status(502).json({ error: 'La IA no devolvió contenido. Intenta de nuevo.' });

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: 'La IA devolvió un formato inválido. Intenta de nuevo.' });
    }

    const arr = (v: any): string[] => (Array.isArray(v) ? v.map((x) => String(x)) : []);
    const h = parsed?.hashtags || {};
    const s = parsed?.seo || {};

    return res.json({
      slogans: arr(parsed?.slogans),
      hashtags: {
        grandes: arr(h.grandes),
        medianos: arr(h.medianos),
        nicho: arr(h.nicho),
        locales: arr(h.locales),
      },
      seo: {
        googleBusiness: typeof s.googleBusiness === 'string' ? s.googleBusiness : '',
        metaDescription: typeof s.metaDescription === 'string' ? s.metaDescription : '',
        keywords: arr(s.keywords),
      },
    });
  } catch (error: any) {
    return mapGroqError(error, res);
  }
});

/* ───────────────────────── Análisis IA de rendimiento (Dashboard) ───────────────────────── */

router.post('/analyze-performance', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;

  const groq = groqClient();
  if (!groq) {
    return res.status(400).json({ error: 'GROQ_API_KEY no configurada. Agrégala a tu archivo .env.' });
  }

  try {
    const rows = await db
      .select({ snap: metricsSnapshots, post: contentPosts })
      .from(metricsSnapshots)
      .innerJoin(contentPosts, eq(metricsSnapshots.postId, contentPosts.id))
      .where(eq(contentPosts.userId, userId))
      .orderBy(desc(metricsSnapshots.recordedAt))
      .limit(300);

    const latest: Record<string, any> = {};
    for (const r of rows) if (!latest[r.post.id]) latest[r.post.id] = r;
    const items = Object.values(latest) as any[];

    if (items.length === 0) {
      return res.json({
        resumen: 'Aún no hay métricas registradas. Registra métricas en Publicaciones para obtener un análisis.',
        loMejor: [],
        recomendaciones: [],
      });
    }

    const agg = (keyFn: (x: any) => any) => {
      const g: Record<string, number[]> = {};
      for (const it of items) {
        const k = keyFn(it);
        if (!k) continue;
        (g[k] ||= []).push(parseFloat(it.snap.engagement) || 0);
      }
      return Object.entries(g)
        .map(([k, a]) => `${k}: ${(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2)}% (${a.length})`)
        .join(', ');
    };

    let storeContext = '';
    try {
      storeContext = await getStoreContext(userId);
    } catch {
      /* ignore */
    }

    const userPrompt = `${storeContext ? storeContext + '\n\n' : ''}Analiza el rendimiento GENERAL del contenido de esta tienda de motos (${items.length} publicaciones con métricas).
Engagement promedio por red: ${agg((x) => x.post.platform)}.
Por formato: ${agg((x) => x.post.type)}.
Por pilar de contenido: ${agg((x) => x.post.pillar)}.

Da un análisis GENERAL y estratégico: habla por PATRONES (qué tipos de contenido, redes y pilares funcionan mejor en conjunto). NO menciones publicaciones individuales, nombres propios ni cifras exactas; resúmelo en tendencias y consejos amplios.
Devuelve estrictamente este JSON en español:
{"resumen":"2-3 frases con la conclusión general","loMejor":["tendencias que funcionan, en general (3-5 puntos)"],"recomendaciones":["qué seguir haciendo, recomendaciones generales y accionables (3-5 puntos)"]}`;

    const completion = await groq.chat.completions.create({
      model: MODEL(),
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) return res.status(502).json({ error: 'La IA no devolvió análisis. Intenta de nuevo.' });

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: 'La IA devolvió un formato inválido. Intenta de nuevo.' });
    }

    const arr = (v: any): string[] => (Array.isArray(v) ? v.map((x) => String(x)) : []);
    return res.json({
      resumen: typeof parsed?.resumen === 'string' ? parsed.resumen : '',
      loMejor: arr(parsed?.loMejor),
      recomendaciones: arr(parsed?.recomendaciones),
    });
  } catch (error: any) {
    return mapGroqError(error, res);
  }
});

export default router;
