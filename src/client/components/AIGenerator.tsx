import React, { useState } from 'react';
import { Sparkles, Send, Copy, RefreshCw, Layers, CheckCircle2, PlusCircle } from 'lucide-react';
import api from '../lib/api.js';
import PostModal from './PostModal.tsx';

export default function AIGenerator() {
  const [loading, setLoading] = useState(false);
  const [motoModel, setMotoModel] = useState('');
  const [platform, setPlatform] = useState('INSTAGRAM');
  const [tone, setTone] = useState('ENTUSIASTA');
  const [generated, setGenerated] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/ai/generate-post', {
        motoModel,
        platform,
        tone,
        category: 'VENTA'
      });
      setGenerated(data);
    } catch (err) {
      console.error(err);
      alert('Error al generar contenido. Verifique su conexión y configuración.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generated) return;
    navigator.clipboard.writeText(`${generated.content}\n\n${generated.hashtags}`);
    alert('¡Copiado al portapapeles!');
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Layers className="text-orange-500" size={20} />
              Parámetros de Generación
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Modelo de Moto</label>
                <input 
                  type="text" 
                  value={motoModel}
                  onChange={(e) => setMotoModel(e.target.value)}
                  placeholder="Ej: BMW R 1250 GS, Yamaha R1..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Plataforma</label>
                  <select 
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none text-white"
                  >
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="TIKTOK">TikTok</option>
                    <option value="FACEBOOK">Facebook</option>
                    <option value="X">X / Twitter</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Tono</label>
                  <select 
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none text-white"
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
                disabled={loading || !motoModel}
                className="w-full bg-white text-zinc-950 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-50 shadow-xl shadow-white/5"
              >
                {loading ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
                Generar Copy y Estrategia
              </button>
            </div>
          </div>

          <div className="bg-orange-500/5 border border-orange-500/10 p-6 rounded-2xl">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="font-bold text-white mb-1">Generación por Lotes</p>
                <p className="text-sm text-zinc-400">¿Quieres generar los 20 posts del mes de una sola vez? Usa la función "Batch Creator" en configuración.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-sm flex flex-col">
          <div className="p-8 border-b border-zinc-800">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Send className="text-blue-500" size={20} />
              Vista Previa del Resultado
            </h3>
          </div>
          
          <div className="flex-1 p-8 overflow-y-auto">
            {generated ? (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Copy Sugerido</p>
                  <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 text-zinc-200 leading-relaxed italic">
                    {generated.content}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Etiquetas Recomendadas</p>
                  <div className="flex flex-wrap gap-2">
                    {generated.hashtags?.split(' ').map((tag: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-medium text-zinc-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={copyToClipboard}
                    className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors text-white"
                  >
                    <Copy size={16} />
                    Copiar Texto
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors text-white"
                  >
                    <PlusCircle size={16} />
                    Programar Post
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-10">
                <Sparkles size={48} className="mb-4" />
                <p className="font-medium text-white">Define los parámetros a la izquierda para que la IA diseñe tu contenido de hoy.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <PostModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={generated}
      />
    </>
  );
}
