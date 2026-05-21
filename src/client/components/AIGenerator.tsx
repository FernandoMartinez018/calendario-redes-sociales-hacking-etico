import React, { useState } from 'react';
import { Sparkles, Copy, RefreshCw, Layers, Send, Calendar as CalendarIcon, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../lib/api.js';
import MediaPicker from './MediaPicker.tsx';

const CONTENT_TYPES = [
  { id: 'MOTO', label: 'Moto específica', ph: 'Ej: Yamaha MT-09, Honda CB190R...' },
  { id: 'PROMO', label: 'Promoción / descuento', ph: 'Ej: 0% interés a 12 meses, casco gratis en la compra...' },
  { id: 'EVENTO', label: 'Evento / rodada', ph: 'Ej: Rodada del domingo, feria de motos...' },
  { id: 'GENERAL', label: 'General', ph: 'Ej: tips de mantenimiento, por qué elegirnos...' },
];

export default function AIGenerator() {
  const [loading, setLoading] = useState(false);
  const [contentType, setContentType] = useState('MOTO');
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('INSTAGRAM');
  const [tone, setTone] = useState('ENTUSIASTA');

  const [generated, setGenerated] = useState<any>(null);
  const [copy, setCopy] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [done, setDone] = useState(false);
  const [variants, setVariants] = useState<string[]>([]);
  const [loadingVar, setLoadingVar] = useState(false);

  const placeholder = CONTENT_TYPES.find((c) => c.id === contentType)?.ph || '';

  const generate = async () => {
    setLoading(true);
    setDone(false);
    try {
      const { data } = await api.post('/api/ai/generate-post', {
        contentType,
        topic,
        platform,
        tone,
      });
      setGenerated(data);
      setCopy(data.content || '');
      setHashtags(data.hashtags || '');
      setScheduledAt(data.suggestedAt || '');
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || 'Error al generar contenido.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${copy}\n\n${hashtags}`);
    alert('¡Copiado al portapapeles!');
  };

  const genVariants = async () => {
    if (!copy.trim()) return;
    setLoadingVar(true);
    try {
      const { data } = await api.post('/api/ai/variants', {
        base: copy,
        network: platform,
        format: 'POST',
      });
      setVariants(data.variants || []);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Error al generar variantes.');
    } finally {
      setLoadingVar(false);
    }
  };

  const schedule = async () => {
    if (!copy.trim()) {
      alert('El copy está vacío.');
      return;
    }
    setScheduling(true);
    try {
      await api.post('/api/posts', {
        copy,
        hashtags,
        type: 'POST',
        platform,
        mediaUrl,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      });
      setDone(true);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || 'Error al agendar la publicación.');
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Configuración */}
      <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Layers className="text-orange-500" size={20} />
          Post rápido
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
              Tipo de contenido
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CONTENT_TYPES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setContentType(c.id)}
                  className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                    contentType === c.id
                      ? 'bg-orange-500/10 border-orange-500 text-orange-500'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
              Detalle
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                Plataforma
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-all appearance-none text-white"
              >
                <option value="INSTAGRAM">Instagram</option>
                <option value="TIKTOK">TikTok</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="X">X / Twitter</option>
                <option value="YOUTUBE">YouTube</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                Tono
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-all appearance-none text-white"
              >
                <option value="ENTUSIASTA">Entusiasta</option>
                <option value="PROFESIONAL">Profesional</option>
                <option value="AVENTURERO">Aventurero</option>
                <option value="TÉCNICO">Técnico</option>
              </select>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading || !topic.trim()}
            className="w-full bg-white text-zinc-950 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
            Generar publicación completa
          </button>

          <div className="pt-4 border-t border-zinc-800">
            <MediaPicker
              value={mediaUrl}
              onChange={setMediaUrl}
              photoIdea={generated?.photoIdea}
              aiImagePrompt={generated?.aiImagePrompt}
            />
          </div>
        </div>
      </div>

      {/* Resultado */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-sm flex flex-col">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Send className="text-blue-500" size={18} />
            Resultado
          </h3>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {done ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <CheckCircle2 size={28} />
              </div>
              <p className="font-bold text-white">¡Publicación agendada!</p>
              <p className="text-xs text-zinc-500">Revísala en el Calendario.</p>
              <button
                onClick={() => {
                  setGenerated(null);
                  setDone(false);
                  setTopic('');
                  setMediaUrl('');
                }}
                className="mt-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-xl transition-colors"
              >
                Crear otra
              </button>
            </div>
          ) : generated ? (
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                  Copy
                </label>
                <textarea
                  value={copy}
                  onChange={(e) => setCopy(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 min-h-[140px] text-sm text-zinc-200 leading-relaxed resize-none focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={genVariants}
                  disabled={loadingVar || !copy.trim()}
                  className="mt-2 text-[11px] font-bold text-zinc-400 hover:text-orange-500 flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  {loadingVar ? <RefreshCw className="animate-spin" size={12} /> : <Sparkles size={12} />}
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

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block flex items-center gap-1">
                  <CalendarIcon size={11} /> Fecha y hora sugeridas
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors text-white"
                >
                  <Copy size={16} /> Copiar
                </button>
                <button
                  onClick={schedule}
                  disabled={scheduling}
                  className="flex-[2] py-3 px-4 bg-orange-600 hover:bg-orange-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors text-white disabled:opacity-50"
                >
                  {scheduling ? <Loader2 className="animate-spin" size={16} /> : <CalendarIcon size={16} />}
                  Agendar al calendario
                </button>
              </div>

              <p className="text-[11px] text-zinc-500 leading-relaxed pt-1">
                💡 Se guarda en tu <b className="text-zinc-300">calendario</b>. MotoSocial no publica por ti:
                cuando llegue la hora te avisamos para que la publiques en la red y pegues el enlace para medir.
              </p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-10 py-16">
              <Sparkles size={48} className="mb-4" />
              <p className="font-medium text-white">
                Elige el tipo de contenido y la IA te arma el post completo: copy, hashtags y la fecha/hora
                sugerida.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
