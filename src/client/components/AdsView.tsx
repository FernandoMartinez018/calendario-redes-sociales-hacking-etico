import React, { useState, useEffect } from 'react';
import { 
  Target, 
  PlusCircle, 
  TrendingUp, 
  Users, 
  BarChart3, 
  ArrowUpRight,
  Search,
  Calendar,
  DollarSign,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import api from '../lib/api.js';
import { motion, AnimatePresence } from 'motion/react';
import CampaignModal from './CampaignModal.js';

export default function AdsView() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCampaigns = async () => {
    try {
      const { data } = await api.get('/api/campaigns');
      setCampaigns(data);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const stats = [
    { label: 'Presupuesto Total', value: '$12,400', icon: DollarSign, change: '+12%', color: 'orange' },
    { label: 'Conversiones', value: '482', icon: TrendingUp, change: '+8%', color: 'emerald' },
    { label: 'Costo por Lead', value: '$25.7', icon: Target, change: '-4%', color: 'blue' },
    { label: 'Reach', value: '145k', icon: Users, change: '+15%', color: 'rose' },
  ];

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-${stat.color}-500`}>
                <stat.icon size={20} />
              </div>
              <span className={`text-[10px] font-black tabular-nums border px-1.5 py-0.5 rounded ${
                stat.change.startsWith('+') ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-rose-500/20 text-rose-500 bg-rose-500/5'
              }`}>
                {stat.change}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-white font-display tabular-nums tracking-tight">{stat.value}</h3>
            </div>
            <div className={`absolute bottom-0 left-0 h-1 bg-${stat.color}-500 opacity-20 w-0 group-hover:w-full transition-all duration-700`} />
          </motion.div>
        ))}
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">Gestión de Campañas</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 italic">Monitorea y optimiza tu pauta publicitaria</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text"
                placeholder="Buscar campaña..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all w-full md:w-64"
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-orange-900/20"
            >
              <PlusCircle size={16} />
              <span>Nueva Campaña</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse">Cargando Campañas...</p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="p-20 text-center space-y-4">
              <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-700 mx-auto">
                <Target size={32} />
              </div>
              <div>
                <p className="text-zinc-400 font-bold">No hay campañas activas</p>
                <p className="text-zinc-600 text-xs">Crea tu primera campaña para empezar a generar leads.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-orange-500 text-xs font-bold uppercase tracking-widest hover:text-orange-400 transition-colors"
              >
                + Crear Campaña ahora
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/50">
                  <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 italic">Nombre</th>
                  <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 italic">Plataforma</th>
                  <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 italic">Presupuesto</th>
                  <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 italic">Estado</th>
                  <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 italic">Periodo</th>
                  <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 italic text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-zinc-900/50 transition-colors group">
                    <td className="p-4 border-b border-zinc-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-orange-500 font-bold text-xs">
                          {campaign.name.substring(0, 1)}
                        </div>
                        <span className="text-sm font-bold text-white leading-none">{campaign.name}</span>
                      </div>
                    </td>
                    <td className="p-4 border-b border-zinc-800/50">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                        {campaign.platform}
                      </span>
                    </td>
                    <td className="p-4 border-b border-zinc-800/50">
                      <div className="space-y-0.5">
                        <p className="text-sm font-black text-white tabular-nums">${campaign.budget}</p>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase">DIARIO</p>
                      </div>
                    </td>
                    <td className="p-4 border-b border-zinc-800/50">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase">Activa</span>
                      </div>
                    </td>
                    <td className="p-4 border-b border-zinc-800/50">
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Calendar size={12} />
                        <span className="text-[10px] font-bold tracking-tight">
                          {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 border-b border-zinc-800/50 text-right">
                      <button className="text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-colors">
                        Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CampaignModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCampaigns}
      />
    </div>
  );
}
