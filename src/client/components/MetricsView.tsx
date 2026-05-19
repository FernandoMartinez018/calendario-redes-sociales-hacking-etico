import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Eye, Heart, FileBarChart } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../lib/api.js';

const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function MetricsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/metrics/summary');
        setData(data);
      } catch (err) {
        console.error('Error fetching metrics:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const history: any[] = data?.history || [];

  // Última métrica por publicación (history viene desc por fecha).
  const latestByPost: Record<string, any> = {};
  for (const h of history) {
    if (!latestByPost[h.post.id]) latestByPost[h.post.id] = h;
  }
  const latest = Object.values(latestByPost);

  const avgEngBy = (keyFn: (h: any) => string | null | undefined) => {
    const groups: Record<string, number[]> = {};
    for (const h of latest) {
      const k = keyFn(h);
      if (!k) continue;
      (groups[k] ||= []).push(parseFloat(h.snapshot.engagement) || 0);
    }
    return Object.entries(groups)
      .map(([name, arr]) => ({
        name,
        value: +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2),
        count: arr.length,
      }))
      .sort((a, b) => b.value - a.value);
  };

  const byPlatform = avgEngBy((h) => h.post.platform);
  const byFormat = avgEngBy((h) => h.post.type);
  const byPillar = avgEngBy((h) => h.post.pillar);
  const byDay = avgEngBy((h) => (h.post.scheduledAt ? DOW[new Date(h.post.scheduledAt).getDay()] : null));

  const chartData = [...history]
    .reverse()
    .map((item) => ({
      date: new Date(item.snapshot.recordedAt).toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
      }),
      engagement: parseFloat(item.snapshot.engagement) || 0,
      vistas: item.snapshot.views,
    }));

  const maxBar = (arr: any[]) => Math.max(1, ...arr.map((x) => x.value));

  const Breakdown = ({ title, rows }: { title: string; rows: any[] }) => (
    <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-3xl">
      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-5">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-[11px] text-zinc-700 italic">Sin datos aún</p>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.name} className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-zinc-300 uppercase tracking-tight">{r.name}</span>
                <span className="text-orange-500 tabular-nums">
                  {r.value}% <span className="text-zinc-600">· {r.count}</span>
                </span>
              </div>
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${(r.value / maxBar(rows)) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
          Analizando datos...
        </p>
      </div>
    );
  }

  const stats = data?.stats || { avgEngagement: 0, totalLikes: 0, totalViews: 0 };

  return (
    <div className="space-y-6 pb-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Engagement prom.', value: `${stats.avgEngagement || 0}%`, icon: TrendingUp, color: 'text-orange-500' },
          { label: 'Vistas totales', value: (stats.totalViews || 0).toLocaleString(), icon: Eye, color: 'text-blue-400' },
          { label: 'Likes totales', value: (stats.totalLikes || 0).toLocaleString(), icon: Heart, color: 'text-rose-500' },
          { label: 'Publicaciones medidas', value: latest.length, icon: FileBarChart, color: 'text-emerald-500' },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl">
            <div className={`p-2 w-fit rounded-lg bg-zinc-900 border border-zinc-800 ${s.color} mb-3`}>
              <s.icon size={20} />
            </div>
            <h3 className="text-2xl font-black text-white tabular-nums leading-none">{s.value}</h3>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.15em] mt-2">{s.label}</p>
          </div>
        ))}
      </div>

      {latest.length === 0 ? (
        <div className="py-24 text-center border border-zinc-800 border-dashed rounded-3xl">
          <BarChart3 size={40} className="mx-auto text-zinc-700 mb-4" />
          <p className="text-zinc-400 font-bold">Aún no registras métricas</p>
          <p className="text-zinc-600 text-xs mt-1">
            Ve a <b>Publicaciones</b> → filtro <b>Publicadas</b> → botón de gráfica → <b>Registrar
            métricas</b>.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800 bg-zinc-900/20">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">
                Rendimiento en el tiempo
              </h3>
            </div>
            <div className="p-6 h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="ce" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.3} />
                  <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    name="Engagement %"
                    dataKey="engagement"
                    stroke="#f97316"
                    fill="url(#ce)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Breakdown title="Engagement por red" rows={byPlatform} />
            <Breakdown title="Por formato" rows={byFormat} />
            <Breakdown title="Por pilar" rows={byPillar} />
            <Breakdown title="Mejor día" rows={byDay} />
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800 bg-zinc-900/20">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">
                Publicaciones con mejor rendimiento
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-900/50 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <th className="p-4 border-b border-zinc-800">Contenido</th>
                    <th className="p-4 border-b border-zinc-800">Red</th>
                    <th className="p-4 border-b border-zinc-800">Likes</th>
                    <th className="p-4 border-b border-zinc-800">Vistas</th>
                    <th className="p-4 border-b border-zinc-800">Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {(latest as any[])
                    .sort(
                      (a, b) => parseFloat(b.snapshot.engagement) - parseFloat(a.snapshot.engagement)
                    )
                    .slice(0, 8)
                    .map((h) => (
                      <tr key={h.snapshot.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="p-4 border-b border-zinc-800/50 max-w-[280px]">
                          <p className="text-xs font-bold text-white truncate">{h.post.copy}</p>
                        </td>
                        <td className="p-4 border-b border-zinc-800/50 text-[10px] font-black text-zinc-400 uppercase">
                          {h.post.platform || '—'}
                        </td>
                        <td className="p-4 border-b border-zinc-800/50 text-[11px] font-black text-white tabular-nums">
                          {h.snapshot.likes.toLocaleString()}
                        </td>
                        <td className="p-4 border-b border-zinc-800/50 text-[11px] font-black text-white tabular-nums">
                          {h.snapshot.views.toLocaleString()}
                        </td>
                        <td className="p-4 border-b border-zinc-800/50 text-[11px] font-black text-orange-500 tabular-nums">
                          {h.snapshot.engagement}%
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
