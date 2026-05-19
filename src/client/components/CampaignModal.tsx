import React, { useState } from 'react';
import { X, Target, DollarSign, Calendar, MessageSquare, Loader2 } from 'lucide-react';
import api from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.tsx';
import { motion, AnimatePresence } from 'motion/react';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CampaignModal({ isOpen, onClose, onSuccess }: CampaignModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('FACEBOOK');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      await api.post('/api/campaigns', {
        name,
        platform,
        budget: parseFloat(budget),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
      onSuccess();
      onClose();
      // Reset
      setName('');
      setBudget('');
      setStartDate('');
      setEndDate('');
    } catch (err) {
      console.error(err);
      alert('Error al crear la campaña');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Target className="text-orange-500" size={20} />
              Configurar Campaña Ads
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Nombre de la Campaña</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                  placeholder="Ej: Lanzamiento Yamaha YZF-R3 2024"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Plataforma</label>
                  <select 
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm appearance-none"
                  >
                    <option value="FACEBOOK">Facebook / Instagram</option>
                    <option value="TIKTOK">TikTok Ads</option>
                    <option value="YOUTUBE">YouTube / Google Ads</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block flex items-center gap-1">
                    <DollarSign size={10} /> Presupuesto Diario (USD)
                  </label>
                  <input 
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                    placeholder="25.00"
                    required
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block flex items-center gap-1">
                    <Calendar size={10} /> Fecha Inicio
                  </label>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm text-zinc-300"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block flex items-center gap-1">
                    <Calendar size={10} /> Fecha Fin
                  </label>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm text-zinc-300"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl">
              <div className="flex gap-3">
                <Target className="text-orange-500 shrink-0" size={18} />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-widest">Optimización MotoSocial</p>
                  <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                    Nuestra IA ajustará automáticamente el targeting para encontrar clientes interesados en motos similares a las de tu inventario.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
              >
                Cerrar
              </button>
              <button 
                type="submit"
                disabled={loading || !name || !budget}
                className="flex-[2] py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <>
                    <Target size={18} />
                    Activar Campaña
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
