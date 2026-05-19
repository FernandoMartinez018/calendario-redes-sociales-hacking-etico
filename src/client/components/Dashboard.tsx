import React, { useEffect, useState } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  CalendarDays,
  Instagram,
  Facebook,
  PlayCircle,
  Twitter,
  Youtube,
  Loader2,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  startOfDay,
  addDays,
} from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../lib/api.js';

const platformIcon = (p: string, size = 12) => {
  switch ((p || '').toUpperCase()) {
    case 'INSTAGRAM':
      return <Instagram size={size} className="text-pink-500" />;
    case 'TIKTOK':
      return <PlayCircle size={size} className="text-cyan-400" />;
    case 'FACEBOOK':
      return <Facebook size={size} className="text-blue-500" />;
    case 'X':
      return <Twitter size={size} className="text-sky-400" />;
    case 'YOUTUBE':
      return <Youtube size={size} className="text-red-500" />;
    default:
      return <CalendarDays size={size} className="text-orange-500" />;
  }
};

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-zinc-950 border border-zinc-800/60 p-5 rounded-2xl">
    <div className={`p-2 w-fit rounded-lg bg-zinc-900 border border-zinc-800 ${color} mb-3`}>
      <Icon size={20} />
    </div>
    <h3 className="text-3xl font-black text-white tabular-nums leading-none">{value}</h3>
    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.15em] mt-2">{label}</p>
  </div>
);

export default function Dashboard() {
  const [posts, setPosts] = useState<any[]>([]);
  const [metricsByPost, setMetricsByPost] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, mRes] = await Promise.all([
          api.get('/api/posts'),
          api.get('/api/metrics/summary').catch(() => ({ data: { history: [] } })),
        ]);
        setPosts(Array.isArray(pRes.data) ? pRes.data : []);
        const map: Record<string, any> = {};
        for (const h of mRes.data?.history || []) {
          if (!map[h.snapshot.postId]) map[h.snapshot.postId] = h.snapshot;
        }
        setMetricsByPost(map);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const { data } = await api.post('/api/ai/analyze-performance', {});
      setAnalysis(data);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'No se pudo generar el análisis.');
    } finally {
      setAnalyzing(false);
    }
  };

  const now = new Date();
  const drafts = posts.filter((p) => p.status === 'DRAFT');
  const scheduled = posts.filter((p) => p.status === 'SCHEDULED' && p.scheduledAt);
  const published = posts.filter((p) => p.status === 'PUBLISHED');

  const upcoming = scheduled
    .filter((p) => new Date(p.scheduledAt) >= startOfDay(now))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const next7 = upcoming.filter((p) => new Date(p.scheduledAt) <= addDays(now, 7));

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const NETWORKS = ['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'X', 'YOUTUBE'];
  const byNetwork = NETWORKS.map((net) => {
    const np = posts.filter((p) => (p.platform || '') === net);
    const pub = np.filter((p) => p.status === 'PUBLISHED');
    const sch = np.filter((p) => p.status === 'SCHEDULED');
    const engs = pub
      .map((p) => metricsByPost[p.id])
      .filter(Boolean)
      .map((m) => parseFloat(m.engagement) || 0);
    const avgEng = engs.length
      ? +(engs.reduce((a, b) => a + b, 0) / engs.length).toFixed(2)
      : null;
    return { net, total: np.length, pub: pub.length, sch: sch.length, avgEng };
  }).filter((x) => x.total > 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="text-orange-500 animate-spin" size={32} />
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
          Cargando tu agenda...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Resumen operativo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Borradores" value={drafts.length} icon={FileText} color="text-zinc-400" />
        <StatCard label="Programados" value={scheduled.length} icon={Clock} color="text-orange-500" />
        <StatCard label="Próx. 7 días" value={next7.length} icon={CalendarDays} color="text-blue-400" />
        <StatCard label="Publicados" value={published.length} icon={CheckCircle2} color="text-emerald-500" />
      </div>

      {/* Análisis IA de rendimiento */}
      <div className="bg-zinc-950 border border-zinc-800/60 rounded-3xl p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Análisis IA de rendimiento</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                Qué ha funcionado mejor y qué seguir haciendo
              </p>
            </div>
          </div>
          <button
            onClick={analyze}
            disabled={analyzing}
            className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 shrink-0"
          >
            {analyzing ? <Loader2 className="animate-spin" size={15} /> : <Sparkles size={15} />}
            {analysis ? 'Re-analizar' : 'Analizar'}
          </button>
        </div>
        {analysis ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
              {analysis.resumen}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">
                  Lo que funciona
                </p>
                <ul className="space-y-1.5">
                  {(analysis.loMejor || []).map((s: string, i: number) => (
                    <li key={i} className="text-xs text-zinc-300 flex gap-2">
                      <span className="text-emerald-500 shrink-0">▲</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">
                  Recomendaciones
                </p>
                <ul className="space-y-1.5">
                  {(analysis.recomendaciones || []).map((s: string, i: number) => (
                    <li key={i} className="text-xs text-zinc-300 flex gap-2">
                      <span className="text-orange-500 shrink-0">→</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-600">
            Pulsa "Analizar" y la IA revisa tus métricas reales para decirte qué está rindiendo mejor y
            qué deberías seguir haciendo por su impacto.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Próximas publicaciones */}
        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800/60 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800/60 bg-zinc-900/30">
            <h3 className="text-lg font-bold text-white">Próximas a publicar</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 italic">
              Lo que sigue en tu calendario
            </p>
          </div>
          <div className="p-4 space-y-2 max-h-[420px] overflow-y-auto">
            {upcoming.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-zinc-400 font-bold text-sm">No hay publicaciones programadas</p>
                <p className="text-zinc-600 text-xs mt-1">
                  Usa el Asistente IA o Post rápido para llenar tu calendario.
                </p>
              </div>
            ) : (
              upcoming.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 hover:border-orange-500/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center shrink-0">
                    <span className="text-sm font-black text-white tabular-nums leading-none">
                      {format(new Date(p.scheduledAt), 'd')}
                    </span>
                    <span className="text-[8px] font-black text-orange-500 uppercase">
                      {format(new Date(p.scheduledAt), 'MMM', { locale: es })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {platformIcon(p.platform)}
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                        {p.platform || 'SIN RED'} · {p.type}
                      </span>
                      <span className="text-[9px] font-bold text-orange-500 tabular-nums">
                        {format(new Date(p.scheduledAt), 'HH:mm')}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 truncate">{p.copy}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Esta semana */}
        <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800/60 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800/60 bg-zinc-900/30">
            <h3 className="text-lg font-bold text-white">Esta semana</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 italic">
              {format(weekStart, "d 'de' MMM", { locale: es })} —{' '}
              {format(weekEnd, "d 'de' MMM", { locale: es })}
            </p>
          </div>
          <div className="p-4 space-y-1">
            {weekDays.map((day) => {
              const dayPosts = scheduled.filter((p) => isSameDay(new Date(p.scheduledAt), day));
              return (
                <div
                  key={day.toString()}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    isToday(day)
                      ? 'bg-orange-500/5 border-orange-500/20'
                      : 'bg-zinc-900/30 border-zinc-800/50'
                  }`}
                >
                  <div className="w-10 text-center shrink-0">
                    <p
                      className={`text-[9px] font-black uppercase ${
                        isToday(day) ? 'text-orange-500' : 'text-zinc-600'
                      }`}
                    >
                      {format(day, 'EEE', { locale: es })}
                    </p>
                    <p
                      className={`text-base font-black tabular-nums ${
                        isToday(day) ? 'text-orange-500' : 'text-white'
                      }`}
                    >
                      {format(day, 'd')}
                    </p>
                  </div>
                  <div className="flex-1 flex flex-wrap gap-1">
                    {dayPosts.length === 0 ? (
                      <span className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest">
                        Libre
                      </span>
                    ) : (
                      dayPosts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-1 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg"
                          title={p.copy}
                        >
                          {platformIcon(p.platform, 10)}
                          <span className="text-[9px] font-bold text-zinc-400 tabular-nums">
                            {format(new Date(p.scheduledAt), 'HH:mm')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Borradores por terminar */}
      {drafts.length > 0 && (
        <div className="bg-zinc-950 border border-zinc-800/60 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800/60 bg-zinc-900/30">
            <h3 className="text-lg font-bold text-white">Borradores sin agendar</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 italic">
              Tienen contenido pero no fecha — termínalos
            </p>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {drafts.slice(0, 6).map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/60"
              >
                <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-500 shrink-0">
                  <FileText size={16} />
                </div>
                <p className="text-xs text-zinc-300 truncate flex-1">{p.copy}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seguimiento por red social */}
      <div className="bg-zinc-950 border border-zinc-800/60 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800/60 bg-zinc-900/30">
          <h3 className="text-lg font-bold text-white">Seguimiento por red social</h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 italic">
            Publicaciones y engagement por canal
          </p>
        </div>
        {byNetwork.length === 0 ? (
          <p className="p-8 text-center text-zinc-600 text-xs">
            Aún no hay publicaciones con red asignada.
          </p>
        ) : (
          <div className="p-4 grid grid-cols-2 lg:grid-cols-5 gap-3">
            {byNetwork.map((n) => (
              <div key={n.net} className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  {platformIcon(n.net, 16)}
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tight">
                    {n.net}
                  </span>
                </div>
                <p className="text-2xl font-black text-white tabular-nums leading-none">{n.total}</p>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                  publicaciones
                </p>
                <div className="mt-3 pt-3 border-t border-zinc-800/60 space-y-1 text-[10px] font-bold">
                  <div className="flex justify-between text-zinc-500">
                    <span>Publicadas</span>
                    <span className="text-emerald-500 tabular-nums">{n.pub}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Programadas</span>
                    <span className="text-orange-500 tabular-nums">{n.sch}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Engagement</span>
                    <span className="text-white tabular-nums">
                      {n.avgEng != null ? `${n.avgEng}%` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
