import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, X, Camera, Wand2, Copy, Upload, Loader2 } from 'lucide-react';
import api from '../lib/api.js';

interface MediaPickerProps {
  value: string;
  onChange: (url: string) => void;
  photoIdea?: string;
  aiImagePrompt?: string;
}

export default function MediaPicker({ value, onChange, photoIdea, aiImagePrompt }: MediaPickerProps) {
  const [assets, setAssets] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadAssets = async () => {
    try {
      const { data } = await api.get('/api/uploads');
      setAssets(Array.isArray(data) ? data : []);
    } catch {
      setAssets([]);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post('/api/uploads', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAssets((prev) => [data, ...prev]);
      onChange(data.url);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Error al subir. ¿Configuraste Cloudinary y reiniciaste el servidor?');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const copyPrompt = () => {
    if (!aiImagePrompt) return;
    navigator.clipboard.writeText(aiImagePrompt);
    alert('Prompt copiado. Pégalo en una IA de imágenes (DALL·E, Midjourney, Leonardo...).');
  };

  // Con imagen seleccionada: solo miniatura + quitar.
  if (value) {
    return (
      <div>
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block flex items-center gap-1">
          <ImageIcon size={11} /> Imagen
        </label>
        <div className="relative w-full h-32 rounded-xl overflow-hidden border border-zinc-800">
          <img src={value} className="w-full h-full object-cover" alt="" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1.5 bg-zinc-950/80 hover:bg-rose-600 text-white rounded-lg transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  const hasSuggestions = Boolean(photoIdea || aiImagePrompt);

  return (
    <div>
      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block flex items-center gap-1">
        <ImageIcon size={11} /> Imagen
      </label>

      <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleUpload} className="hidden" />

      <div className="grid grid-cols-2 gap-2">
        {/* Subir nueva */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="py-3 rounded-xl border border-dashed border-zinc-800 text-zinc-500 hover:text-orange-500 hover:border-orange-500/50 text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? 'Subiendo...' : 'Subir imagen'}
        </button>

        {/* Usar guardada */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="py-3 rounded-xl border border-dashed border-zinc-800 text-zinc-500 hover:text-orange-500 hover:border-orange-500/50 text-xs font-bold transition-all flex items-center justify-center gap-2"
        >
          <ImageIcon size={16} /> De la galería
        </button>
      </div>

      {open && (
        <div className="mt-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
          {!loaded ? (
            <p className="text-[10px] text-zinc-600 text-center py-4">Cargando galería...</p>
          ) : assets.length === 0 ? (
            <p className="text-[10px] text-zinc-600 text-center py-4">
              No hay imágenes aún. Sube una con el botón de arriba.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto">
              {assets.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    onChange(a.url);
                    setOpen(false);
                  }}
                  className="aspect-square rounded-lg overflow-hidden border border-zinc-800 hover:border-orange-500 transition-all"
                >
                  {a.type === 'IMAGE' ? (
                    <img src={a.url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600 text-[8px] font-black">
                      VIDEO
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Si no hay imagen: las dos sugerencias */}
      {hasSuggestions && (
        <div className="mt-4 space-y-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
            ¿No tienes imagen? Tienes dos opciones:
          </p>

          {photoIdea && (
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-orange-500">
                <Camera size={15} />
                <span className="text-[10px] font-black uppercase tracking-widest">Opción 1 · Tomar foto</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">{photoIdea}</p>
            </div>
          )}

          {aiImagePrompt && (
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-blue-400">
                  <Wand2 size={15} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Opción 2 · Crear con IA</span>
                </div>
                <button
                  type="button"
                  onClick={copyPrompt}
                  className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-800 transition-colors"
                >
                  <Copy size={12} /> Copiar prompt
                </button>
              </div>
              <p className="text-xs text-zinc-400 font-mono leading-relaxed break-words">{aiImagePrompt}</p>
              <p className="text-[9px] text-zinc-600 mt-2 italic">
                Pégalo en una IA de imágenes (DALL·E, Midjourney, Leonardo...) y sube el resultado con "Subir imagen".
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
