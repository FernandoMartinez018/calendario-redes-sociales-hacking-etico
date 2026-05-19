import React, { useState } from 'react';
import { Megaphone, Sparkles, Copy, Loader2, Hash, Search } from 'lucide-react';
import api from '../lib/api.js';

const copy = (text: string) => {
  navigator.clipboard.writeText(text);
  alert('Copiado al portapapeles');
};

const HASHTAG_GROUPS = [
  { key: 'grandes', label: 'Grandes (volumen alto)' },
  { key: 'medianos', label: 'Medianos' },
  { key: 'nicho', label: 'Nicho (moto)' },
  { key: 'locales', label: 'Locales (tu ciudad)' },
] as const;

export default function SeoView() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/api/ai/slogans-seo', { topic });
      setData(data);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Error al generar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
        <div className="flex items-center gap-3 mb-2">
          <Megaphone className="text-orange-500" size={22} />
          <h3 className="text-xl font-bold text-white">Slogans & SEO</h3>
        </div>
        <p className="text-sm text-zinc-400 mb-5">
          Slogans, estrategia de hashtags y SEO local — usa el contexto de tu Perfil de Tienda.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Tema / modelo / campaña — ej: Yamaha MT-09, promo de scooters..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={generate}
            disabled={loading || !topic.trim()}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Generar
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Slogans */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Slogans</h4>
            <div className="space-y-2">
              {data.slogans?.map((s: string, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl group"
                >
                  <p className="text-sm text-zinc-200 font-medium">{s}</p>
                  <button
                    onClick={() => copy(s)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-white transition-all"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Hashtags */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Hash size={15} className="text-orange-500" />
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">
                Estrategia de hashtags
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {HASHTAG_GROUPS.map((g) => {
                const tags: string[] = data.hashtags?.[g.key] || [];
                return (
                  <div key={g.key} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        {g.label}
                      </span>
                      {tags.length > 0 && (
                        <button
                          onClick={() => copy(tags.join(' '))}
                          className="text-[10px] font-bold text-zinc-500 hover:text-white flex items-center gap-1"
                        >
                          <Copy size={11} /> Copiar
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.length === 0 ? (
                        <span className="text-[10px] text-zinc-700 italic">—</span>
                      ) : (
                        tags.map((t, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-zinc-800 rounded-full text-[10px] font-medium text-zinc-300"
                          >
                            {t}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEO local */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Search size={15} className="text-orange-500" />
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">SEO local</h4>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Descripción Google Business
                </p>
                <button
                  onClick={() => copy(data.seo?.googleBusiness || '')}
                  className="text-[10px] font-bold text-zinc-500 hover:text-white flex items-center gap-1"
                >
                  <Copy size={11} /> Copiar
                </button>
              </div>
              <p className="text-sm text-zinc-300 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 leading-relaxed">
                {data.seo?.googleBusiness}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                Meta description
              </p>
              <p className="text-xs text-zinc-400 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 font-mono">
                {data.seo?.metaDescription}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Palabras clave
                </p>
                <button
                  onClick={() => copy((data.seo?.keywords || []).join(', '))}
                  className="text-[10px] font-bold text-zinc-500 hover:text-white flex items-center gap-1"
                >
                  <Copy size={11} /> Copiar
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(data.seo?.keywords || []).map((k: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-[10px] font-medium text-orange-400"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {!data && !loading && (
        <div className="text-center py-16 opacity-30">
          <Megaphone size={44} className="mx-auto mb-3" />
          <p className="text-sm text-white font-medium">
            Escribe un tema y la IA te da slogans, hashtags y SEO local de tu tienda.
          </p>
        </div>
      )}
    </div>
  );
}
