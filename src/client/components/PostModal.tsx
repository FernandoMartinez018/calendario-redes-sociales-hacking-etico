import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Image as ImageIcon, Calendar as CalendarIcon, Hash, Loader2 } from 'lucide-react';
import api from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { motion, AnimatePresence } from 'motion/react';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  initialScheduledAt?: string;
}

export default function PostModal({ isOpen, onClose, initialData, initialScheduledAt }: PostModalProps) {
  const { user } = useAuth();
  const [copy, setCopy] = useState(initialData?.content || '');
  const [hashtags, setHashtags] = useState(initialData?.hashtags || '');
  const [platform, setPlatform] = useState('INSTAGRAM');
  const [scheduledAt, setScheduledAt] = useState(initialScheduledAt || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialScheduledAt) {
      setScheduledAt(initialScheduledAt);
    }
  }, [initialScheduledAt]);
  const [uploading, setUploading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/api/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMediaUrl(data.url);
    } catch (err) {
      console.error(err);
      alert('Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      await api.post('/api/posts', {
        copy,
        hashtags,
        type: 'POST',
        mediaUrl,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        userId: user.id,
        // socialAccountId is optional now
      });
      onClose();
      // Reset form
      setCopy('');
      setHashtags('');
      setScheduledAt('');
      setMediaUrl('');
    } catch (err) {
      console.error(err);
      alert('Error al crear la publicación');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Send className="text-orange-500" size={20} />
              Nueva Publicación
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Copy de la publicación</label>
                  <textarea 
                    value={copy}
                    onChange={(e) => setCopy(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none text-sm leading-relaxed"
                    placeholder="Describe tu moto o promoción..."
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block flex items-center gap-1">
                    <Hash size={12} /> Hashtags
                  </label>
                  <input 
                    type="text"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                    placeholder="#yamaha #motos #ventas"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Plataforma Destino</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'X'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlatform(p)}
                        className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-all ${
                          platform === p 
                            ? 'bg-orange-500/10 border-orange-500 text-orange-500' 
                            : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-zinc-900 transition-colors relative h-32 overflow-hidden"
                >
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,video/*"
                  />
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  ) : mediaUrl ? (
                    <img src={mediaUrl} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500">
                        <ImageIcon size={20} />
                      </div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase">Subir Multimedia</p>
                    </>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block flex items-center gap-1">
                    <CalendarIcon size={12} /> Programar (Opcional)
                  </label>
                  <input 
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm text-zinc-300"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={loading || !copy}
                className="flex-[2] py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    {scheduledAt ? 'Programar Publicación' : 'Guardar como Borrador'}
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
