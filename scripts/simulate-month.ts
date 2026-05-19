/**
 * Simula ~1 mes de uso real de la app para Fernando Motos / Yamaha Central MX.
 * Inserta: perfil de tienda, publicaciones (publicadas/programadas/borradores)
 * y métricas con tendencia. Es ADITIVO: si lo corres 2 veces, duplica datos.
 *
 *   npx tsx simulate-month.ts
 */
import { db } from '../src/db/index.ts';
import { users, storeProfiles, contentPosts, metricsSnapshots } from '../src/db/schema.ts';
import { eq, or } from 'drizzle-orm';

const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const MODELS = [
  'Yamaha MT-09', 'Yamaha MT-07', 'Yamaha R3', 'Yamaha R15', 'Yamaha FZ-15',
  'Yamaha NMAX 155', 'Yamaha XMAX 300', 'Yamaha Ténéré 700', 'Yamaha FZ25', 'Yamaha Crypton 110',
];
const NETWORKS = ['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'X', 'YOUTUBE'];
const FORMATS = ['REEL', 'POST', 'STORY', 'SHORT'];
const PILLARS = ['venta', 'educativo', 'testimonio', 'oferta', 'evento', 'mantenimiento', 'detras_camaras'];

const COPY_BY_PILLAR: Record<string, (m: string) => string> = {
  venta: (m) => `🔥 La ${m} ya está en Yamaha Central MX. Potencia, diseño y la confianza Yamaha. Agenda tu prueba de manejo hoy.`,
  educativo: (m) => `¿Sabías que la ${m} tiene el motor más eficiente de su categoría? Te contamos 3 razones para elegirla.`,
  testimonio: (m) => `"La mejor compra de mi vida." Así describe Carlos su ${m}. Gracias por confiar en Yamaha Central MX 🙌`,
  oferta: (m) => `🚨 PROMO DEL MES: llévate tu ${m} con 0% de interés a 12 meses + casco de regalo. Solo en mayo.`,
  evento: (m) => `🏍️ Rodada Yamaha este domingo 7am. Trae tu ${m} y vente con la familia Yamaha Central MX.`,
  mantenimiento: (m) => `Tip de taller: revisa la cadena de tu ${m} cada 500 km. Agenda tu servicio con nosotros.`,
  detras_camaras: (m) => `Así preparamos cada ${m} antes de entregarla. Calidad Yamaha Central MX de principio a fin.`,
};

const HASHTAGS = '#Yamaha #YamahaCentralMX #Motos #MotosMexico #RideYamaha #DarkSideOfJapan';
const IMG = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc';

async function main() {
  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.email, 'fercho.2003.lol@gmail.com'), eq(users.name, 'Fernando Motos')))
    .limit(1);

  if (!user) {
    console.error('❌ No se encontró el usuario Fernando Motos.');
    process.exit(1);
  }
  console.log(`👤 Usuario: ${user.name} (${user.email}) — ${user.dealerName}`);

  // 1) Perfil de tienda
  const profileValues = {
    brands: 'Yamaha',
    motoTypes: 'Deportiva, naked, scooter, aventura',
    targetAudience: 'Jóvenes 20-40 que buscan su primera moto deportiva o scooter urbano; aventureros de fin de semana.',
    city: 'Ciudad de México, México',
    brandTone: 'Entusiasta, cercano y aspiracional',
    valueProposition: 'Taller Yamaha certificado, financiación 0% interés y pruebas de manejo el mismo día.',
    activePromotions: '0% interés a 12 meses + casco de regalo en mayo.',
    season: 'Temporada de lluvias en CDMX; impulso de scooters y equipo impermeable.',
  };
  await db
    .insert(storeProfiles)
    .values({ userId: user.id, ...profileValues })
    .onConflictDoUpdate({ target: storeProfiles.userId, set: { ...profileValues, updatedAt: new Date() } });
  console.log('✅ Perfil de tienda actualizado');

  const now = new Date();
  const postsToInsert: any[] = [];

  // 2) ~24 publicaciones PUBLICADAS en los últimos 30 días
  let publishedCount = 0;
  for (let dayAgo = 30; dayAgo >= 1; dayAgo--) {
    if (Math.random() < 0.2) continue; // ~día libre
    const date = new Date(now);
    date.setDate(date.getDate() - dayAgo);
    date.setHours(rnd(9, 21), pick([0, 15, 30, 45]), 0, 0);
    const network = pick(NETWORKS);
    const format = network === 'YOUTUBE' ? 'SHORT' : pick(FORMATS);
    const pillar = pick(PILLARS);
    const model = pick(MODELS);
    postsToInsert.push({
      type: format,
      platform: network,
      copy: COPY_BY_PILLAR[pillar](model),
      hashtags: HASHTAGS,
      status: 'PUBLISHED',
      scheduledAt: date,
      publishedAt: date,
      pillar,
      mediaUrl: Math.random() < 0.7 ? IMG : null,
      postUrl: `https://www.instagram.com/p/Sim${Math.random().toString(36).slice(2, 9)}/`,
      userId: user.id,
      createdAt: date,
      updatedAt: date,
    });
    publishedCount++;
  }

  // 3) 6 PROGRAMADAS futuras
  for (let i = 1; i <= 6; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i * 2);
    date.setHours(pick([12, 18, 19, 20]), 0, 0, 0);
    const network = pick(NETWORKS);
    const pillar = pick(PILLARS);
    postsToInsert.push({
      type: pick(FORMATS),
      platform: network,
      copy: COPY_BY_PILLAR[pillar](pick(MODELS)),
      hashtags: HASHTAGS,
      status: 'SCHEDULED',
      scheduledAt: date,
      pillar,
      mediaUrl: Math.random() < 0.5 ? IMG : null,
      userId: user.id,
    });
  }

  // 4) 5 BORRADORES sin fecha
  for (let i = 0; i < 5; i++) {
    const pillar = pick(PILLARS);
    postsToInsert.push({
      type: pick(FORMATS),
      platform: pick(NETWORKS),
      copy: COPY_BY_PILLAR[pillar](pick(MODELS)),
      hashtags: HASHTAGS,
      status: 'DRAFT',
      pillar,
      userId: user.id,
    });
  }

  const inserted = await db.insert(contentPosts).values(postsToInsert).returning();
  console.log(`✅ ${inserted.length} publicaciones creadas (${publishedCount} publicadas, 6 programadas, 5 borradores)`);

  // 5) Métricas para las PUBLICADAS (2 snapshots = tendencia)
  const snaps: any[] = [];
  for (const p of inserted) {
    if (p.status !== 'PUBLISHED' || !p.publishedAt) continue;
    const isVideo = p.type === 'REEL' || p.type === 'SHORT';
    const baseViews = isVideo ? rnd(3000, 22000) : rnd(700, 6000);

    const mk = (views: number, when: Date) => {
      const likes = Math.round(views * (rnd(40, 95) / 1000));
      const comments = Math.round(views * (rnd(3, 12) / 1000));
      const shares = Math.round(views * (rnd(2, 9) / 1000));
      const engagement = views > 0 ? (((likes + comments + shares) / views) * 100).toFixed(2) : '0.00';
      return { postId: p.id, likes, comments, shares, views, engagement, recordedAt: when };
    };

    const d1 = new Date(p.publishedAt);
    d1.setDate(d1.getDate() + 1);
    const d2 = new Date(p.publishedAt);
    d2.setDate(d2.getDate() + 5);
    if (d1 <= now) snaps.push(mk(Math.round(baseViews * 0.65), d1));
    snaps.push(mk(baseViews, d2 <= now ? d2 : now));
  }
  if (snaps.length) await db.insert(metricsSnapshots).values(snaps);
  console.log(`✅ ${snaps.length} snapshots de métricas creados`);

  console.log('✨ Simulación de 1 mes completada para Yamaha Central MX.');
  process.exit(0);
}

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
