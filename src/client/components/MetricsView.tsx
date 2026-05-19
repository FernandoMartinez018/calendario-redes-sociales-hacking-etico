import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, Eye, Heart, FileBarChart, Download } from 'lucide-react';
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

  const [fNet, setFNet] = useState('ALL');
  const [fFmt, setFFmt] = useState('ALL');
  const [fPil, setFPil] = useState('ALL');
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');

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

  const opts = useMemo(() => {
    const u = (k: (h: any) => any) =>
      Array.from(new Set(history.map(k).filter(Boolean))).sort();
    return {
      nets: u((h) => h.post.platform),
      fmts: u((h) => h.post.type),
      pils: u((h) => h.post.pillar),
    };
  }, [history]);

  const filtered = useMemo(() => {
    const from = fFrom ? new Date(fFrom).getTime() : -Infinity;
    const to = fTo ? new Date(fTo).getTime() + 86400000 : Infinity;
    return history.filter((h) => {
      if (fNet !== 'ALL' && h.post.platform !== fNet) return false;
      if (fFmt !== 'ALL' && h.post.type !== fFmt) return false;
      if (fPil !== 'ALL' && h.post.pillar !== fPil) return false;
      const t = new Date(h.snapshot.recordedAt).getTime();
      return t >= from && t <= to;
    });
  }, [history, fNet, fFmt, fPil, fFrom, fTo]);

  // Última métrica por publicación dentro del filtro.
  const latest = useMemo(() => {
    const by: Record<string, any> = {};
    for (const h of filtered) if (!by[h.post.id]) by[h.post.id] = h;
    return Object.values(by) as any[];
  }, [filtered]);

  const avgEngBy = (keyFn: (h: any) => any) => {
    const g: Record<string, number[]> = {};
    for (const h of latest) {
      const k = keyFn(h);
      if (!k) continue;
      (g[k] ||= []).push(parseFloat(h.snapshot.engagement) || 0);
    }
    return Object.entries(g)
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
  const byDay = avgEngBy((h) =>
    h.post.scheduledAt ? DOW[new Date(h.post.scheduledAt).getDay()] : null
  );

  const chartData = [...filtered].reverse().map((item) => ({
    date: new Date(item.snapshot.recordedAt).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
    }),
    engagement: parseFloat(item.snapshot.engagement) || 0,
  }));

  const stats = useMemo(() => {
    const likes = latest.reduce((a, h) => a + (h.snapshot.likes || 0), 0);
    const views = latest.reduce((a, h) => a + (h.snapshot.views || 0), 0);
    const eng = latest.length
      ? (
          latest.reduce((a, h) => a + (parseFloat(h.snapshot.engagement) || 0), 0) /
          latest.length
        ).toFixed(2)
      : 0;
    return { likes, views, eng, n: latest.length };
  }, [latest]);

  const exportCSV = () => {
    const head = ['Copy', 'Red', 'Formato', 'Pilar', 'Fecha', 'Likes', 'Comentarios', 'Compartidos', 'Vistas', 'Engagement'];
    const lines = [head];
    for (const h of latest) {
      lines.push([
        h.post.copy || '',
        h.post.platform || '',
        h.post.type || '',
        h.post.pillar || '',
        new Date(h.snapshot.recordedAt).toLocaleString(),
        h.snapshot.likes,
        h.snapshot.comments,
        h.snapshot.shares,
        h.snapshot.views,
        `${h.snapshot.engagement}%`,
      ]);
    }
    const csv = lines
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metricas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxBar = (arr: any[]) => Math.max(1, ...arr.map((x) => x.value));
  const Breakdown = ({ title, rows }: { title: string; rows: any[] }) => (
    <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-3xl">
      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-5">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-[11px] text-zinc-700 italic">Sin datos</p>
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

  const sel =
    'bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-orange-500';

  return (
    <div className="space-y-6 pb-10">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
        <select value={fNet} onChange={(e) => setFNet(e.target.value)} className={sel}>
          <option value="ALL">Todas las redes</option>
          {opts.nets.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select value={fFmt} onChange={(e) => setFFmt(e.target.value)} className={sel}>
          <option value="ALL">Todo formato</option>
          {opts.fmts.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select value={fPil} onChange={(e) => setFPil(e.target.value)} className={sel}>
          <option value="ALL">Todo pilar</option>
          {opts.pils.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} className={sel} />
        <span className="text-zinc-600 text-xs">→</span>
        <input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} className={sel} />
        <div className="flex-1" />
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-colors"
        >
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Engagement prom.', value: `${stats.eng || 0}%`, icon: TrendingUp, color: 'text-orange-500' },
          { label: 'Vistas', value: stats.views.toLocaleString(), icon: Eye, color: 'text-blue-400' },
          { label: 'Likes', value: stats.likes.toLocaleString(), icon: Heart, color: 'text-rose-500' },
          { label: 'Publicaciones', value: stats.n, icon: FileBarChart, color: 'text-emerald-500' },
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
          <p className="text-zinc-400 font-bold">Sin métricas para este filtro</p>
          <p className="text-zinc-600 text-xs mt-1">
            Registra métricas en Publicaciones o ajusta los filtros.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800 bg-zinc-900/20">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">
                Engagement en el tiempo
              </h3>
            </div>
            <div className="p-6 h-[300px] w-full">
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
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" name="Engagement %" dataKey="engagement" stroke="#f97316" fill="url(#ce)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Breakdown title="Por red" rows={byPlatform} />
            <Breakdown title="Por formato" rows={byFormat} />
            <Breakdown title="Por pilar" rows={byPillar} />
            <Breakdown title="Mejor día" rows={byDay} />
          </div>
        </>
      )}
    </div>
  );
}
