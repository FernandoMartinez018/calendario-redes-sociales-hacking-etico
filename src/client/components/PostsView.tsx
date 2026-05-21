import React, { useEffect, useState, useRef } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  Loader2,
  Save,
  X,
  Trash2,
  BarChart3,
  ExternalLink,
  Heart,
  Eye,
  MessageCircle,
  Share2,
  TrendingUp,
  Download,
  Upload,
  Youtube as YoutubeIcon,
  Calendar as CalendarIcon,
  Instagram,
  Facebook,
  PlayCircle,
  Twitter,
  Youtube,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../lib/api.js';
import MediaPicker from './MediaPicker.tsx';

const FILTERS = [
  { id: 'ALL', label: 'Todas' },
  { id: 'DRAFT', label: 'Borradores' },
  { id: 'SCHEDULED', label: 'Programadas' },
  { id: 'PUBLISHED', label: 'Publicadas' },
];

const NETWORKS = ['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'X', 'YOUTUBE'];

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-zinc-800 text-zinc-400',
  SCHEDULED: 'bg-orange-500/10 text-orange-500 border border-orange-500/20',
  PUBLISHING: 'bg-blue-500/10 text-blue-400',
  PUBLISHED: 'bg-emerald-500/10 text-emerald-500',
  FAILED: 'bg-rose-500/10 text-rose-500',
};

const platformIcon = (p: string) => {
  switch ((p || '').toUpperCase()) {
    case 'INSTAGRAM':
      return <Instagram size={14} className="text-pink-500" />;
    case 'TIKTOK':
      return <PlayCircle size={14} className="text-cyan-400" />;
    case 'FACEBOOK':
      return <Facebook size={14} className="text-blue-500" />;
    case 'X':
      return <Twitter size={14} className="text-sky-400" />;
    case 'YOUTUBE':
      return <Youtube size={14} className="text-red-500" />;
    default:
      return <FileText size={14} className="text-zinc-500" />;
  }
};

export default function PostsView() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const [editing, setEditing] = useState<any>(null);
  const [copy, setCopy] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [platform, setPlatform] = useState('INSTAGRAM');
  const [mediaUrl, setMediaUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const [metricsByPost, setMetricsByPost] = useState<Record<string, any>>({});
  const [historyByPost, setHistoryByPost] = useState<Record<string, any[]>>({});
  const [metricsFor, setMetricsFor] = useState<any>(null);
  const [mLikes, setMLikes] = useState('');
  const [mComments, setMComments] = useState('');
  const [mShares, setMShares] = useState('');
  const [mViews, setMViews] = useState('');
  const [savingMetrics, setSavingMetrics] = useState(false);
  const [netFilter, setNetFilter] = useState('ALL');
  const [order, setOrder] = useState('recent');

  const [publishFor, setPublishFor] = useState<any>(null);
  const [publishUrl, setPublishUrl] = useState('');
  const [publishing, setPublishing] = useState(false);

  const fetchPosts = async () => {
    try {
      const [pRes, mRes] = await Promise.all([
        api.get('/api/posts'),
        api.get('/api/metrics/summary').catch(() => ({ data: { history: [] } })),
      ]);
      setPosts(Array.isArray(pRes.data) ? pRes.data : []);
      const map: Record<string, any> = {};
      const hist: Record<string, any[]> = {};
      for (const h of mRes.data?.history || []) {
        // history viene ordenada desc por fecha → la primera por post es la más reciente.
        if (!map[h.snapshot.postId]) map[h.snapshot.postId] = h.snapshot;
        if (!hist[h.snapshot.postId]) hist[h.snapshot.postId] = [];
        hist[h.snapshot.postId].push(h.snapshot);
      }
      setMetricsByPost(map);
      setHistoryByPost(hist);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const openPublish = (p: any) => {
    setPublishFor(p);
    setPublishUrl(p.postUrl || '');
  };

  const markPublished = async () => {
    if (!publishUrl.trim()) {
      alert('Pega el enlace de la publicación para marcarla como publicada.');
      return;
    }
    setPublishing(true);
    try {
      await api.patch(`/api/posts/${publishFor.id}`, {
        status: 'PUBLISHED',
        postUrl: publishUrl.trim(),
        publishedAt: new Date().toISOString(),
      });
      setPublishFor(null);
      setPublishUrl('');
      await fetchPosts();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'No se pudo marcar como publicada.');
    } finally {
      setPublishing(false);
    }
  };

  const openMetrics = (p: any) => {
    setMetricsFor(p);
    const m = metricsByPost[p.id];
    setMLikes(m ? String(m.likes) : '');
    setMComments(m ? String(m.comments) : '');
    setMShares(m ? String(m.shares) : '');
    setMViews(m ? String(m.views) : '');
  };

  const saveMetrics = async () => {
    setSavingMetrics(true);
    try {
      await api.post('/api/metrics', {
        postId: metricsFor.id,
        likes: Number(mLikes) || 0,
        comments: Number(mComments) || 0,
        shares: Number(mShares) || 0,
        views: Number(mViews) || 0,
      });
      setMetricsFor(null);
      await fetchPosts();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Error al registrar métricas.');
    } finally {
      setSavingMetrics(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const openEdit = (p: any) => {
    if (p.status === 'PUBLISHED') return; // ya publicada, no se edita
    setEditing(p);
    setCopy(p.copy || '');
    setHashtags(p.hashtags || '');
    setPlatform(p.platform || 'INSTAGRAM');
    setMediaUrl(p.mediaUrl || '');
    setScheduledAt(p.scheduledAt ? format(new Date(p.scheduledAt), "yyyy-MM-dd'T'HH:mm") : '');
    setPostUrl(p.postUrl || '');
  };

  const save = async () => {
    if (!copy.trim()) {
      alert('El copy está vacío.');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/api/posts/${editing.id}`, {
        copy,
        hashtags,
        platform,
        mediaUrl,
        postUrl,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      });
      setEditing(null);
      await fetchPosts();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const fileRef = useRef<HTMLInputElement>(null);

  const syncYoutube = async (p: any) => {
    try {
      await api.post('/api/metrics/youtube-sync', { postId: p.id });
      await fetchPosts();
      alert('Métricas reales sincronizadas desde YouTube ✅');
    } catch (err: any) {
      alert(err?.response?.data?.error || 'No se pudo sincronizar con YouTube.');
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const parseLine = (line: string) => {
      const out: string[] = [];
      let cur = '';
      let q = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (q) {
          if (ch === '"') {
            if (line[i + 1] === '"') {
              cur += '"';
              i++;
            } else q = false;
          } else cur += ch;
        } else if (ch === '"') q = true;
        else if (ch === ',') {
          out.push(cur);
          cur = '';
        } else cur += ch;
      }
      out.push(cur);
      return out;
    };
    if (lines.length < 2) return [];
    const header = parseLine(lines[0]).map((h) => h.trim().toLowerCase());
    return lines.slice(1).map((l) => {
      const c = parseLine(l);
      const o: any = {};
      header.forEach((h, i) => (o[h] = c[i]));
      return o;
    });
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = parseCSV(String(reader.result || ''));
        const rows = parsed
          .map((r) => ({
            postUrl: r['url'] || r['posturl'] || '',
            likes: r['likes'] || 0,
            comments: r['comentarios'] || r['comments'] || 0,
            shares: r['compartidos'] || r['shares'] || 0,
            views: r['vistas'] || r['views'] || 0,
          }))
          .filter((r) => r.postUrl);
        if (rows.length === 0) {
          alert('No se hallaron filas con columna URL. Usa el CSV exportado como plantilla.');
          return;
        }
        const { data } = await api.post('/api/metrics/import', { rows });
        alert(`Importadas: ${data.imported} · Omitidas: ${data.skipped}`);
        await fetchPosts();
      } catch (err: any) {
        alert(err?.response?.data?.error || 'Error al importar.');
      } finally {
        if (fileRef.current) fileRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const del = async (p: any) => {
    if (!confirm('¿Eliminar esta publicación? No se puede deshacer.')) return;
    try {
      await api.delete(`/api/posts/${p.id}`);
      setPosts((prev) => prev.filter((x) => x.id !== p.id));
    } catch (err: any) {
      alert(err?.response?.data?.error || 'No se pudo eliminar.');
    }
  };

  const counts: Record<string, number> = {
    ALL: posts.length,
    DRAFT: posts.filter((p) => p.status === 'DRAFT').length,
    SCHEDULED: posts.filter((p) => p.status === 'SCHEDULED').length,
    PUBLISHED: posts.filter((p) => p.status === 'PUBLISHED').length,
  };

  const filtered = posts
    .filter((p) => (filter === 'ALL' ? true : p.status === filter))
    .filter((p) => (netFilter === 'ALL' ? true : (p.platform || '') === netFilter))
    .sort((a, b) => {
      const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
      const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
      return order === 'old' ? ta - tb : tb - ta;
    });

  const exportCSV = () => {
    const head = ['Estado', 'Red', 'Formato', 'Fecha', 'Copy', 'Hashtags', 'URL', 'Likes', 'Vistas', 'Engagement'];
    const lines = [head];
    for (const p of filtered) {
      const m = metricsByPost[p.id] || {};
      lines.push([
        p.status,
        p.platform || '',
        p.type || '',
        p.scheduledAt ? new Date(p.scheduledAt).toLocaleString() : '',
        p.copy || '',
        p.hashtags || '',
        p.postUrl || '',
        m.likes ?? '',
        m.views ?? '',
        m.engagement ? `${m.engagement}%` : '',
      ]);
    }
    const csv = lines
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `publicaciones_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="text-orange-500 animate-spin" size={32} />
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
          Cargando publicaciones...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              filter === f.id
                ? 'bg-orange-500/10 border-orange-500 text-orange-500'
                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {f.label}{' '}
            <span className="opacity-60 tabular-nums">({counts[f.id] ?? 0})</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={netFilter}
          onChange={(e) => setNetFilter(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
        >
          <option value="ALL">Todas las redes</option>
          {NETWORKS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <select
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
        >
          <option value="recent">Más recientes</option>
          <option value="old">Más antiguas</option>
        </select>
        <div className="flex-1" />
        <span className="text-[10px] font-bold text-zinc-600 uppercase tabular-nums">
          {filtered.length} resultado(s)
        </span>
        <input ref={fileRef} type="file" accept=".csv" onChange={importCSV} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-colors"
        >
          <Upload size={14} /> Importar CSV
        </button>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-colors"
        >
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center border border-zinc-800 border-dashed rounded-3xl">
          <p className="text-zinc-400 font-bold">No hay publicaciones aquí</p>
          <p className="text-zinc-600 text-xs mt-1">Genera contenido en el Plan de contenido o Post rápido.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="group w-full flex items-center gap-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800/60 hover:border-orange-500/40 transition-colors"
            >
              <div
                onClick={() => openEdit(p)}
                title={p.status === 'PUBLISHED' ? 'Ya publicada — no editable' : 'Editar'}
                className={`flex items-center gap-4 flex-1 min-w-0 text-left ${
                  p.status === 'PUBLISHED' ? 'cursor-default' : 'cursor-pointer'
                }`}
              >
                {p.mediaUrl ? (
                  <img
                    src={p.mediaUrl}
                    className="w-12 h-12 rounded-xl object-cover border border-zinc-800 shrink-0"
                    alt=""
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 shrink-0">
                    {platformIcon(p.platform)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        STATUS_BADGE[p.status] || 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {p.status}
                    </span>
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                      {p.platform || 'SIN RED'} · {p.type}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-500 tabular-nums">
                      {p.scheduledAt
                        ? format(new Date(p.scheduledAt), "d MMM yyyy · HH:mm", { locale: es })
                        : 'sin fecha'}
                    </span>
                    {p.status === 'SCHEDULED' &&
                      p.scheduledAt &&
                      new Date(p.scheduledAt).getTime() <= Date.now() && (
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                          ⏰ toca publicar
                        </span>
                      )}
                  </div>
                  <p className="text-xs text-zinc-300 truncate">{p.copy}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.status === 'PUBLISHED' && metricsByPost[p.id] && (
                  <div className="hidden sm:flex items-center gap-3 text-[10px] font-bold text-zinc-500 mr-1">
                    <span className="flex items-center gap-1">
                      <Heart size={11} className="text-rose-500" />
                      {metricsByPost[p.id].likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={11} className="text-blue-400" />
                      {metricsByPost[p.id].views}
                    </span>
                    <span className="text-orange-500 tabular-nums">{metricsByPost[p.id].engagement}%</span>
                  </div>
                )}
                {p.postUrl && (
                  <a
                    href={p.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Abrir publicación"
                    className="p-2 rounded-lg text-zinc-600 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <ExternalLink size={15} />
                  </a>
                )}
                {p.status === 'PUBLISHED' && (
                  <button
                    onClick={() => openMetrics(p)}
                    title="Ver / registrar métricas"
                    className="p-2 rounded-lg text-zinc-600 hover:text-orange-500 hover:bg-orange-500/10 transition-colors"
                  >
                    <BarChart3 size={16} />
                  </button>
                )}
                {(p.status === 'DRAFT' || p.status === 'SCHEDULED') && (
                  <button
                    onClick={() => openPublish(p)}
                    title="Marcar como publicada"
                    className="p-2 rounded-lg text-zinc-600 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                )}
                {p.status !== 'PUBLISHED' && (
                  <button
                    onClick={() => del(p)}
                    title="Eliminar"
                    className="p-2 rounded-lg text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-white">Editar publicación</h2>
              <button
                onClick={() => setEditing(null)}
                className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                  Copy
                </label>
                <textarea
                  value={copy}
                  onChange={(e) => setCopy(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 min-h-[140px] text-sm text-zinc-200 resize-none focus:outline-none focus:border-orange-500"
                />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                    Red
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
                  >
                    {['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'X', 'YOUTUBE'].map((n) => (
                      <option key={n} value={n}>
                        {n}
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

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                  Enlace a la publicación ya posteada
                </label>
                <input
                  type="url"
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  placeholder="https://instagram.com/p/..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-orange-500"
                />
                <p className="mt-1.5 text-[11px] text-zinc-500 leading-relaxed">
                  MotoSocial no publica por ti: publica en la red y pega aquí el enlace para traer y medir sus métricas.
                </p>
              </div>

              <MediaPicker value={mediaUrl} onChange={setMediaUrl} />

              <p className="text-[10px] text-zinc-600 italic">
                Con fecha → queda <b>Programada</b> y aparece en el calendario. Sin fecha → sigue como{' '}
                <b>Borrador</b>.
              </p>
            </div>

            <div className="p-5 border-t border-zinc-800 flex gap-3">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-[2] py-3 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {metricsFor && (() => {
        const current = metricsByPost[metricsFor.id];
        const history = historyByPost[metricsFor.id] || [];
        const views = Number(mViews) || 0;
        const liveEng =
          views > 0
            ? ((((Number(mLikes) || 0) + (Number(mComments) || 0) + (Number(mShares) || 0)) / views) * 100).toFixed(2)
            : '0.00';
        const isYoutube = /youtu\.?be/.test(metricsFor.postUrl || '');
        const cards = [
          { l: 'Likes', v: current?.likes, icon: <Heart size={14} className="text-rose-500" /> },
          { l: 'Comentarios', v: current?.comments, icon: <MessageCircle size={14} className="text-sky-400" /> },
          { l: 'Compartidos', v: current?.shares, icon: <Share2 size={14} className="text-emerald-400" /> },
          { l: 'Vistas', v: current?.views, icon: <Eye size={14} className="text-blue-400" /> },
        ];
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 size={18} className="text-orange-500" /> Métricas de la publicación
              </h2>
              <button
                onClick={() => setMetricsFor(null)}
                className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <p className="text-[11px] text-zinc-500 line-clamp-2">{metricsFor.copy}</p>

              {/* Estado actual */}
              {current ? (
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Estado actual</span>
                    <span className="text-[10px] text-zinc-600">
                      actualizado {format(new Date(current.recordedAt), "d MMM · HH:mm", { locale: es })}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {cards.map((c) => (
                      <div key={c.l} className="text-center">
                        <div className="flex items-center justify-center mb-1">{c.icon}</div>
                        <p className="text-base font-black text-white tabular-nums">{Number(c.v || 0).toLocaleString()}</p>
                        <p className="text-[9px] uppercase tracking-widest text-zinc-600">{c.l}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-3 border-t border-zinc-800">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500">Engagement</span>
                    <span className="text-xl font-black text-orange-500 tabular-nums">{current.engagement}%</span>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-950 border border-dashed border-zinc-800 rounded-2xl p-4 text-center text-[11px] text-zinc-500">
                  Aún no has registrado métricas para esta publicación. Ingrésalas abajo 👇
                </div>
              )}

              {/* Sincronizar YouTube */}
              {isYoutube && (
                <button
                  onClick={() => syncYoutube(metricsFor)}
                  className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <YoutubeIcon size={15} /> Traer métricas reales desde YouTube
                </button>
              )}

              {/* Evolución */}
              {history.length > 1 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={13} className="text-orange-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      Evolución ({history.length} registros)
                    </span>
                  </div>
                  <div className="space-y-1">
                    {history.slice(0, 5).map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-[11px] bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-1.5"
                      >
                        <span className="text-zinc-500 tabular-nums">
                          {format(new Date(s.recordedAt), "d MMM · HH:mm", { locale: es })}
                        </span>
                        <span className="flex items-center gap-3 text-zinc-400 tabular-nums">
                          <span className="flex items-center gap-1">
                            <Eye size={11} className="text-blue-400" />
                            {Number(s.views).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart size={11} className="text-rose-500" />
                            {Number(s.likes).toLocaleString()}
                          </span>
                          <span className="text-orange-500 font-bold">{s.engagement}%</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Registrar nuevo dato */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 block">
                  {current ? 'Actualizar / registrar nuevo dato' : 'Registrar métricas'}
                </span>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { l: 'Likes', v: mLikes, s: setMLikes },
                    { l: 'Comentarios', v: mComments, s: setMComments },
                    { l: 'Compartidos', v: mShares, s: setMShares },
                    { l: 'Vistas', v: mViews, s: setMViews },
                  ].map((f) => (
                    <div key={f.l}>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                        {f.l}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={f.v}
                        onChange={(e) => f.s(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 px-1 gap-3">
                  <span className="text-[10px] text-zinc-600 italic">
                    Engagement = (likes + comentarios + compartidos) / vistas
                  </span>
                  <span className="text-[11px] font-bold text-zinc-400 whitespace-nowrap">
                    ≈ <span className="text-orange-500">{liveEng}%</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-zinc-800 flex gap-3">
              <button
                onClick={() => setMetricsFor(null)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={saveMetrics}
                disabled={savingMetrics}
                className="flex-[2] py-3 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {savingMetrics ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Guardar
                métricas
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Marcar como publicada */}
      {publishFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500" /> Marcar como publicada
              </h2>
              <button
                onClick={() => setPublishFor(null)}
                className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-[11px] text-zinc-500 line-clamp-2">{publishFor.copy}</p>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[11px] text-zinc-400 leading-relaxed">
                Primero publica este contenido en{' '}
                <b className="text-zinc-200">{publishFor.platform || 'la red'}</b>. Luego pega aquí el
                enlace de la publicación — es <b className="text-zinc-200">obligatorio</b> para poder medir
                sus métricas.
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                  Enlace de la publicación *
                </label>
                <input
                  type="url"
                  value={publishUrl}
                  onChange={(e) => setPublishUrl(e.target.value)}
                  placeholder="https://instagram.com/p/..."
                  autoFocus
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
            <div className="p-5 border-t border-zinc-800 flex gap-3">
              <button
                onClick={() => setPublishFor(null)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={markPublished}
                disabled={publishing || !publishUrl.trim()}
                className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {publishing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}{' '}
                Confirmar publicación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
