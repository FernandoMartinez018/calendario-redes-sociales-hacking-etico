import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Heart, 
  MessageSquare, 
  Share2, 
  Eye, 
  Calendar,
  Filter,
  Download,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import api from '../lib/api.js';
import { motion } from 'motion/react';

export default function MetricsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState('7d');

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/metrics/summary');
      setData(data);
    } catch (err) {
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const chartData = data?.history?.map((item: any) => ({
    date: new Date(item.snapshot.recordedAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }),
    engagement: parseFloat(item.snapshot.engagement),
    likes: item.snapshot.likes,
    views: item.snapshot.views,
  })).reverse() || [
    { date: '12 May', engagement: 4.2, likes: 120, views: 2400 },
    { date: '13 May', engagement: 3.8, likes: 98, views: 2100 },
    { date: '14 May', engagement: 5.1, likes: 145, views: 3200 },
    { date: '15 May', engagement: 4.5, likes: 110, views: 2800 },
    { date: '16 May', engagement: 6.2, likes: 210, views: 4500 },
    { date: '17 May', engagement: 5.8, likes: 180, views: 3800 },
    { date: '18 May', engagement: 6.5, likes: 230, views: 5100 },
  ];

  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f43f5e', '#a855f7'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg shadow-2xl backdrop-blur-md">
          <p className="text-[10px] font-black text-zinc-500 uppercase mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <p className="text-xs font-bold text-white uppercase">
                {entry.name}: <span className="tabular-nums">{entry.value}</span>
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Analizando Datos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950/50 p-6 border border-zinc-800 rounded-3xl backdrop-blur-sm">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <BarChart3 className="text-orange-500" />
            Social Analytics
          </h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.15em] mt-1 italic">
            Visualiza el impacto de tu contenido en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['7d', '30d', '90d'].map((range) => (
            <button 
              key={range}
              onClick={() => setActiveRange(range)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeRange === range 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40 translate-y-[-1px]' 
                  : 'bg-zinc-900 text-zinc-500 hover:text-white border border-zinc-800'
              }`}
            >
              {range}
            </button>
          ))}
          <div className="w-px h-8 bg-zinc-800 mx-2 hidden md:block" />
          <button className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Engagement', value: `${data?.stats?.avgEngagement || '5.4'}%`, icon: TrendingUp, color: 'orange', trend: '+12.4%' },
          { label: 'Total Content Impressions', value: data?.stats?.totalViews?.toLocaleString() || '142,400', icon: Eye, color: 'blue', trend: '+8.2%' },
          { label: 'Total Reactions', value: data?.stats?.totalLikes?.toLocaleString() || '12,850', icon: Heart, color: 'rose', trend: '+15.0%' },
          { label: 'Social Reach', value: '88,200', icon: Users, color: 'emerald', trend: '+5.7%' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition-all"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-${stat.color}-500/10 transition-all`} />
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-${stat.color}-500 group-hover:scale-110 transition-transform duration-500`}>
                <stat.icon size={20} />
              </div>
              <span className="text-[10px] font-black text-emerald-500 flex items-center bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 tabular-nums lowercase italic">
                <ArrowUpRight size={10} className="mr-1" />
                {stat.trend}
              </span>
            </div>
            <div className="space-y-1 relative z-10">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-white font-display tracking-tight tabular-nums">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Engagement Chart */}
        <div className="lg:col-span-8 bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/20">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Rendimiento Temporal</h3>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">Métricas comparativas diario</p>
            </div>
            <div className="flex gap-1.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 rounded-full border border-zinc-800">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-[10px] font-black uppercase text-zinc-400">CTR</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 rounded-full border border-zinc-800">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[10px] font-black uppercase text-zinc-400">Views</span>
              </div>
            </div>
          </div>
          <div className="p-8 h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#52525b" 
                  fontSize={10} 
                  fontWeight="bold"
                  tickLine={false} 
                  axisLine={false} 
                  dy={15}
                />
                <YAxis 
                  stroke="#52525b" 
                  fontSize={10} 
                  fontWeight="bold"
                  tickLine={false} 
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  name="Engagement %"
                  dataKey="engagement" 
                  stroke="#f97316" 
                  fillOpacity={1} 
                  fill="url(#colorEng)" 
                  strokeWidth={3}
                  animationDuration={2000}
                />
                <Area 
                  type="monotone" 
                  name="Vistas"
                  dataKey="views" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Content Breakdown */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-3xl flex-1 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4">
                <Info size={14} className="text-zinc-700" />
             </div>
             <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-6">Eficiencia por Plataforma</h3>
             <div className="space-y-6">
                {[
                  { name: 'Instagram', value: 82, color: 'rose', icon: 'IG' },
                  { name: 'TikTok', value: 64, color: 'white', icon: 'TT' },
                  { name: 'Facebook', value: 45, color: 'blue', icon: 'FB' },
                  { name: 'YouTube', value: 38, color: 'red', icon: 'YT' },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-400 group-hover:text-${item.color}-500`}>
                          {item.icon}
                        </div>
                        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-tight">{item.name}</span>
                      </div>
                      <span className="text-[11px] font-black text-white tabular-nums">{item.value}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-900/50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 1.5, delay: i * 0.1 }}
                        className={`h-full bg-zinc-500 rounded-full`}
                        style={{ backgroundColor: item.color === 'white' ? '#fff' : undefined }}
                      />
                    </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-3xl bg-gradient-to-br from-zinc-950 to-zinc-900">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Peak Performance</h3>
                <div className="text-[9px] font-black px-2 py-0.5 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded">OPTIMIZED</div>
             </div>
             <div className="text-center py-4">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1 italic">Mejor Hora para Publicar</p>
                <h4 className="text-4xl font-black text-white font-display tracking-tight uppercase">19:45</h4>
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-2">MARTES Y JUEVES</p>
             </div>
          </div>
        </div>
      </div>

      {/* Top Performing Posts */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/20">
          <div>
            <h3 className="text-lg font-bold">Top Performing Content</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Contenido con mayor impacto orgánico</p>
          </div>
          <button className="text-[10px] font-black uppercase text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-2">
            Ver todo <TrendingUp size={12} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/50">
                <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">Contenido</th>
                <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">Tipo</th>
                <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">Likes</th>
                <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">Views</th>
                <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">Comentarios</th>
                <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">Engagement</th>
                <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 text-right">Preview</th>
              </tr>
            </thead>
            <tbody>
              {data?.history?.slice(0, 5).map((item: any) => (
                <tr key={item.snapshot.id} className="hover:bg-zinc-900/50 transition-colors group">
                  <td className="p-4 border-b border-zinc-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex-shrink-0 overflow-hidden">
                        {item.post.mediaUrl ? (
                          <img src={item.post.mediaUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-700">
                            <Eye size={16} />
                          </div>
                        )}
                      </div>
                      <div className="max-w-[200px]">
                        <p className="text-xs font-bold text-white truncate">{item.post.copy}</p>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase truncate">{item.post.hashtags}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 border-b border-zinc-800/50">
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase tracking-tighter italic">
                      {item.post.type}
                    </span>
                  </td>
                  <td className="p-4 border-b border-zinc-800/50 text-[11px] font-black text-white tabular-nums">
                    {item.snapshot.likes.toLocaleString()}
                  </td>
                  <td className="p-4 border-b border-zinc-800/50 text-[11px] font-black text-white tabular-nums">
                    {item.snapshot.views.toLocaleString()}
                  </td>
                  <td className="p-4 border-b border-zinc-800/50 text-[11px] font-black text-white tabular-nums">
                    {item.snapshot.comments.toLocaleString()}
                  </td>
                  <td className="p-4 border-b border-zinc-800/50">
                    <div className="flex items-center gap-2">
                       <span className="text-[11px] font-black text-orange-500 tabular-nums italic">
                         {item.snapshot.engagement}%
                       </span>
                       <div className="h-1 w-12 bg-zinc-900 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500" style={{ width: `${item.snapshot.engagement}%` }} />
                       </div>
                    </div>
                  </td>
                  <td className="p-4 border-b border-zinc-800/50 text-right">
                    <button className="text-zinc-600 hover:text-white transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest italic opacity-50">
                    No hay publicaciones registradas para métricas aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
