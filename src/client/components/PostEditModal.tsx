import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import api from '../lib/api.js';
import MediaPicker from './MediaPicker.tsx';

const NETWORKS = ['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'X', 'YOUTUBE'];

interface Props {
  post: any | null;
  onClose: () => void;
  onSaved: () => void;
}

// Editor reutilizable de una publicación (usado por Calendario y Publicaciones).
// Si está PUBLISHED: solo lectura, salvo la URL (útil para sync de métricas).
export default function PostEditModal({ post, onClose, onSaved }: Props) {
  const [copy, setCopy] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [platform, setPlatform] = useState('INSTAGRAM');
  const [mediaUrl, setMediaUrl] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!post) return;
    setCopy(post.copy || '');
    setHashtags(post.hashtags || '');
    setPlatform(post.platform || 'INSTAGRAM');
    setMediaUrl(post.mediaUrl || '');
    setPostUrl(post.postUrl || '');
    setScheduledAt(post.scheduledAt ? format(new Date(post.scheduledAt), "yyyy-MM-dd'T'HH:mm") : '');
  }, [post]);

  if (!post) return null;
  const published = post.status === 'PUBLISHED';

  const save = async () => {
    if (!published && !copy.trim()) {
      alert('El copy está vacío.');
      return;
    }
    setSaving(true);
    try {
      const body = published
        ? { postUrl }
        : {
            copy,
            hashtags,
            platform,
            mediaUrl,
            postUrl,
            status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          };
      await api.patch(`/api/posts/${post.id}`, body);
      onSaved();
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!confirm('¿Eliminar esta publicación? No se puede deshacer.')) return;
    try {
      await api.delete(`/api/posts/${post.id}`);
      onSaved();
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'No se pudo eliminar.');
    }
  };

  const lbl = 'text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block';
  const inp =
    'w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-orange-500 disabled:opacity-50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">
            {published ? 'Publicación (publicada — solo lectura)' : 'Editar publicación'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div>
            <label className={lbl}>Copy</label>
            <textarea
              value={copy}
              disabled={published}
              onChange={(e) => setCopy(e.target.value)}
              className={`${inp} min-h-[140px] resize-none leading-relaxed`}
            />
          </div>

          <div>
            <label className={lbl}>Hashtags</label>
            <input
              type="text"
              value={hashtags}
              disabled={published}
              onChange={(e) => setHashtags(e.target.value)}
              className={inp}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Red</label>
              <select
                value={platform}
                disabled={published}
                onChange={(e) => setPlatform(e.target.value)}
                className={inp}
              >
                {NETWORKS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`${lbl} flex items-center gap-1`}>
                <CalendarIcon size={11} /> Agendar
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                disabled={published}
                onChange={(e) => setScheduledAt(e.target.value)}
                className={inp}
              />
            </div>
          </div>

          <div>
            <label className={lbl}>URL de la publicación{published ? ' (editable para sincronizar métricas)' : ''}</label>
            <input
              type="url"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className={inp}
            />
          </div>

          {!published ? (
            <MediaPicker value={mediaUrl} onChange={setMediaUrl} />
          ) : (
            mediaUrl && (
              <img src={mediaUrl} className="w-full max-h-56 object-cover rounded-xl border border-zinc-800" alt="" />
            )
          )}
        </div>

        <div className="p-5 border-t border-zinc-800 flex gap-3">
          {!published && (
            <button
              onClick={del}
              className="flex items-center gap-2 px-4 py-3 text-rose-500 hover:bg-rose-500/10 text-sm font-bold rounded-xl transition-colors"
            >
              <Trash2 size={16} /> Eliminar
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {published ? 'Guardar URL' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
