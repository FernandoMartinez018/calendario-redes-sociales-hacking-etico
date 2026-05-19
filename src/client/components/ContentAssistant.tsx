import React, { useState, useEffect } from 'react';
import {
  Wand2,
  Sparkles,
  Loader2,
  RefreshCw,
  Check,
  X as XIcon,
  ArrowRight,
  Calendar as CalendarIcon,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import api from '../lib/api.js';
import MediaPicker from './MediaPicker.tsx';

const ALL_NETWORKS = ['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'X', 'YOUTUBE'];
const FORMATS = ['REEL', 'STORY', 'POST', 'SHORT'];

type Idea = {
  pillar: string;
  topic: string;
  network: string;
  format: string;
  hook: string;
  cta: string;
  suggestedAt: string;
};

export default function ContentAssistant() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Paso 1 — configuración
  const [networks, setNetworks] = useState<string[]>([]);
  const [count, setCount] = useState(8);
  const [periodStart, setPeriodStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [periodDays, setPeriodDays] = useState(30);
  const [goal, setGoal] = useState('');
  const [preferredHour, setPreferredHour] = useState('');

  // Paso 2 — ideas
  const [ideas, setIdeas] = useState<Idea[]>([]);

  // Paso 3 — revisión una por una
  const [index, setIndex] = useState(0);
  const [copy, setCopy] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [platform, setPlatform] = useState('INSTAGRAM');
  const [format, setFormat] = useState('POST');
  const [scheduledAt, setScheduledAt] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [photoIdea, setPhotoIdea] = useState('');
  const [aiImagePrompt, setAiImagePrompt] = useState('');
  const [variants, setVariants] = useState<string[]>([]);
  const [loadingVar, setLoadingVar] = useState(false);

  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [loadingExpand, setLoadingExpand] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approved, setApproved] = useState(0);
  const [discarded, setDiscarded] = useState(0);

  useEffect(() => {
    // Prerellenar redes desde las cuentas vinculadas.
    (async () => {
      try {
        const { data } = await api.get('/api/settings/social-accounts');
        const linked = Array.from(
          new Set((data || []).map((a: any) => a.platform).filter((p: string) => ALL_NETWORKS.includes(p)))
        ) as string[];
        setNetworks(linked.length ? linked : ['INSTAGRAM']);
      } catch {
        setNetworks(['INSTAGRAM']);
      }
    })();
  }, []);

  const toggleNetwork = (n: string) =>
    setNetworks((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));

  const generateIdeas = async () => {
    if (networks.length === 0) {
      alert('Selecciona al menos una red social.');
      return;
    }
    setLoadingIdeas(true);
    try {
      const { data } = await api.post('/api/ai/content-ideas', {
        networks,
        count,
        periodStart,
        periodDays,
        goal,
        preferredHour,
      });
      setIdeas(data.ideas || []);
      setStep(2);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Error al generar ideas.');
    } finally {
      setLoadingIdeas(false);
    }
  };

  const expandIdea = async (i: number) => {
    const idea = ideas[i];
    if (!idea) return;
    setLoadingExpand(true);
    setPlatform(idea.network);
    setFormat(idea.format);
    setScheduledAt(idea.suggestedAt);
    setMediaUrl('');
    setPhotoIdea('');
    setAiImagePrompt('');
    setVariants([]);
    try {
      const { data } = await api.post('/api/ai/expand-idea', { idea });
      setCopy(data.content || '');
      setHashtags(data.hashtags || '');
      setPhotoIdea(data.photoIdea || '');
      setAiImagePrompt(data.aiImagePrompt || '');
    } catch (err: any) {
      setCopy('');
      setHashtags('');
      alert(err?.response?.data?.error || 'Error al generar la publicación.');
    } finally {
      setLoadingExpand(false);
    }
  };

  const genVariants = async () => {
    if (!copy.trim()) return;
    setLoadingVar(true);
    try {
      const { data } = await api.post('/api/ai/variants', {
        base: copy,
        network: platform,
        format,
      });
      setVariants(data.variants || []);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Error al generar variantes.');
    } finally {
      setLoadingVar(false);
    }
  };

  const startReview = async () => {
    setStep(3);
    setIndex(0);
    setApproved(0);
    setDiscarded(0);
    await expandIdea(0);
  };

  const goNext = async (wasApproved: boolean) => {
    if (wasApproved) setApproved((n) => n + 1);
    else setDiscarded((n) => n + 1);

    const next = index + 1;
    if (next >= ideas.length) {
      setStep(4);
      return;
    }
    setIndex(next);
    await expandIdea(next);
  };

  const approveAndSchedule = async () => {
    if (!copy.trim()) {
      alert('El copy está vacío.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/posts', {
        copy,
        hashtags,
        type: format,
        platform,
        pillar: ideas[index]?.pillar,
        mediaUrl,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      });
      await goNext(true);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Error al agendar la publicación.');
    } finally {
      setSaving(false);
    }
  };

  const resetAll = () => {
    setStep(1);
    setIdeas([]);
    setIndex(0);
    setApproved(0);
    setDiscarded(0);
  };

  /* ───────── Paso 1: Configuración ───────── */
  if (step === 1) {
    return (
      <div className="max-w-3xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <Wand2 className="text-orange-500" size={22} />
          <h3 className="text-xl font-bold text-white">Asistente de Contenido</h3>
        </div>
        <p className="text-sm text-zinc-400 mb-8">
          Configura el contexto y la IA generará ideas; luego revisas cada publicación una por una.
        </p>

        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">
              ¿Para qué redes generamos?
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_NETWORKS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => toggleNetwork(n)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    networks.includes(n)
                      ? 'bg-orange-500/10 border-orange-500 text-orange-500'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                Nº de publicaciones
              </label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
              >
                {[5, 8, 10, 15, 20].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                Desde
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                Periodo
              </label>
              <select
                value={periodDays}
                onChange={(e) => setPeriodDays(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
              >
                <option value={7}>1 semana</option>
                <option value={15}>2 semanas</option>
                <option value={30}>1 mes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
              Hora preferida
            </label>
            <select
              value={preferredHour}
              onChange={(e) => setPreferredHour(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="">Automática (según tus métricas)</option>
              <option value="09:00">Mañana — 09:00</option>
              <option value="12:00">Mediodía — 12:00</option>
              <option value="18:00">Tarde — 18:00</option>
              <option value="20:00">Noche — 20:00</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
              Objetivo (opcional)
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Ej: liquidar inventario 2024, atraer clientes nuevos..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <button
            onClick={generateIdeas}
            disabled={loadingIdeas}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loadingIdeas ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            Generar Ideas
          </button>
        </div>
      </div>
    );
  }

  /* ───────── Paso 2: Lista de ideas ───────── */
  if (step === 2) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Layers className="text-orange-500" size={22} />
            <h3 className="text-xl font-bold text-white">{ideas.length} ideas generadas</h3>
          </div>
          <button
            onClick={resetAll}
            className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
          >
            ← Reconfigurar
          </button>
        </div>

        <div className="space-y-3 mb-8">
          {ideas.map((idea, i) => (
            <div
              key={i}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex items-start gap-4"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-orange-500 font-black text-xs shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                    {idea.pillar}
                  </span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                    {idea.network}
                  </span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                    {idea.format}
                  </span>
                  <span className="text-[9px] font-bold text-zinc-500 tabular-nums">
                    {idea.suggestedAt.replace('T', ' ')}
                  </span>
                </div>
                <p className="text-sm font-bold text-white">{idea.topic}</p>
                {idea.hook && <p className="text-xs text-zinc-500 mt-1 italic">"{idea.hook}"</p>}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={startReview}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          Revisar y crear publicaciones <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  /* ───────── Paso 4: Resumen ───────── */
  if (step === 4) {
    return (
      <div className="max-w-xl mx-auto text-center bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-2xl font-black text-white mb-2">¡Listo!</h3>
        <p className="text-zinc-400 mb-8">
          <span className="text-emerald-500 font-bold">{approved} agendadas</span> ·{' '}
          <span className="text-zinc-500 font-bold">{discarded} descartadas</span>. Revísalas en el
          Calendario.
        </p>
        <button
          onClick={resetAll}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-3 rounded-xl transition-colors"
        >
          Generar más contenido
        </button>
      </div>
    );
  }

  /* ───────── Paso 3: Revisión una por una ───────── */
  const idea = ideas[index];
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">
          Publicación {index + 1} de {ideas.length}
        </h3>
        <div className="flex gap-1">
          {ideas.map((_, i) => (
            <div
              key={i}
              className={`w-6 h-1 rounded-full ${
                i < index ? 'bg-emerald-500' : i === index ? 'bg-orange-500' : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex flex-wrap items-center gap-2 bg-zinc-950/40">
          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
            {idea?.pillar}
          </span>
          <span className="text-sm font-bold text-white">{idea?.topic}</span>
        </div>

        <div className="p-6 space-y-5">
          {loadingExpand ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <Loader2 className="text-orange-500 animate-spin" size={28} />
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                Escribiendo la publicación...
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                  Copy
                </label>
                <textarea
                  value={copy}
                  onChange={(e) => setCopy(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 min-h-[160px] text-sm text-zinc-200 leading-relaxed resize-none focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={genVariants}
                  disabled={loadingVar || !copy.trim()}
                  className="mt-2 text-[11px] font-bold text-zinc-400 hover:text-orange-500 flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  {loadingVar ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                  Generar 3 variantes A/B
                </button>
                {variants.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {variants.map((v, i) => (
                      <div key={i} className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                        <p className="text-xs text-zinc-300 leading-relaxed mb-2">{v}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setCopy(v);
                            setVariants([]);
                          }}
                          className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-400"
                        >
                          Usar esta
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                  Hashtags
                </label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-orange-500"
                />
              </div>

              <MediaPicker
                value={mediaUrl}
                onChange={setMediaUrl}
                photoIdea={photoIdea}
                aiImagePrompt={aiImagePrompt}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                    Red
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
                  >
                    {ALL_NETWORKS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                    Formato
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
                  >
                    {FORMATS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block flex items-center gap-1">
                    <CalendarIcon size={11} /> Agendar
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-zinc-300 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-5 border-t border-zinc-800 flex flex-wrap gap-3 bg-zinc-950/40">
          <button
            onClick={() => expandIdea(index)}
            disabled={loadingExpand || saving}
            className="flex items-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} /> Regenerar
          </button>
          <button
            onClick={() => goNext(false)}
            disabled={loadingExpand || saving}
            className="flex items-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            <XIcon size={16} /> Descartar
          </button>
          <div className="flex-1" />
          <button
            onClick={approveAndSchedule}
            disabled={loadingExpand || saving}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
            Aprobar y agendar
          </button>
        </div>
      </div>
    </div>
  );
}
