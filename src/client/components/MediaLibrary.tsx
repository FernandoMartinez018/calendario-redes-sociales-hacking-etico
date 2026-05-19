import React, { useState, useEffect, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Video, 
  Upload, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  CheckCircle2,
  X,
  Calendar,
  FileIcon,
  Download,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react';
import api from '../lib/api.js';
import { motion, AnimatePresence } from 'motion/react';

export default function MediaLibrary() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = async () => {
    try {
      const { data } = await api.get('/api/uploads');
      setAssets(data);
    } catch (err) {
      console.error('Error fetching media:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

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
      setAssets([data, ...assets]);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al subir el archivo. Verifica tu configuración de Cloudinary.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de eliminar este archivo?')) return;

    try {
      await api.delete(`/api/uploads/${id}`);
      setAssets(assets.filter(a => a.id !== id));
      if (selectedAsset?.id === id) setSelectedAsset(null);
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'ALL' || a.type === filter;
    return matchesSearch && matchesFilter;
  });

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <ImageIcon className="text-orange-500" />
            Librería Multimedia
          </h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.15em] mt-1 italic">
            Gestiona tus fotos y videos para pautas y contenido orgánico
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,video/*"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-orange-900/40 disabled:opacity-50"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Subir Archivo
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input 
            type="text"
            placeholder="Buscar por nombre o URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          {(['ALL', 'IMAGE', 'VIDEO'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f ? 'bg-zinc-800 text-orange-500 shadow-inner' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {f === 'ALL' ? 'Todo' : f === 'IMAGE' ? 'Fotos' : 'Videos'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="text-orange-500 animate-spin" size={32} />
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Sincronizando Galería...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 border-2 border-zinc-900 border-dashed rounded-3xl gap-4">
          <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-full text-zinc-700">
            <Filter size={40} />
          </div>
          <div className="text-center">
            <p className="text-zinc-400 font-bold">No se encontraron archivos</p>
            <p className="text-zinc-600 text-xs">Sube tu primer recurso multimedia para empezar.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <AnimatePresence>
            {filteredAssets.map((asset) => (
              <motion.div
                key={asset.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setSelectedAsset(asset)}
                className={`group relative aspect-square bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden cursor-pointer hover:border-orange-500/50 transition-all ${
                  selectedAsset?.id === asset.id ? 'ring-2 ring-orange-500 border-orange-500' : ''
                }`}
              >
                {asset.type === 'IMAGE' ? (
                  <img src={asset.url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-600 group-hover:text-orange-500 transition-colors">
                    <Video size={32} />
                    <span className="text-[9px] font-black mt-2 uppercase tracking-tighter">VIDEO REEL</span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold text-white tabular-nums opacity-80">{formatSize(asset.size)}</span>
                    <button 
                      onClick={(e) => handleDelete(asset.id, e)}
                      className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-lg"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="absolute top-2 right-2">
                   {asset.type === 'VIDEO' ? (
                      <div className="p-1 bg-black/60 backdrop-blur-md rounded border border-white/10">
                        <Video size={10} className="text-white" />
                      </div>
                   ) : (
                      <div className="p-1 bg-black/60 backdrop-blur-md rounded border border-white/10">
                        <ImageIcon size={10} className="text-white" />
                      </div>
                   )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Asset Preview Modal */}
      <AnimatePresence>
        {selectedAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-zinc-950/90 backdrop-blur-md">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="bg-zinc-900 border border-zinc-800 w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-full max-h-[85vh]"
             >
                <div className="flex-1 bg-zinc-950 flex items-center justify-center p-4 relative min-h-[300px]">
                   <button 
                    onClick={() => setSelectedAsset(null)}
                    className="absolute top-4 right-4 z-10 p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-all backdrop-blur-md border border-zinc-700/50"
                   >
                     <X size={20} />
                   </button>

                   {selectedAsset.type === 'IMAGE' ? (
                    <img 
                      src={selectedAsset.url} 
                      className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" 
                      alt="Preview" 
                    />
                   ) : (
                    <video 
                      src={selectedAsset.url} 
                      controls 
                      className="max-w-full max-h-full rounded-lg shadow-2xl"
                    />
                   )}
                </div>

                <div className="w-full md:w-80 p-8 flex flex-col border-t md:border-t-0 md:border-l border-zinc-800">
                  <div className="space-y-6 flex-1">
                    <div>
                      <h3 className="text-xs font-black uppercase text-zinc-500 tracking-widest mb-1">Detalles del Archivo</h3>
                      <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-[10px] text-zinc-400 break-all">
                        {selectedAsset.url}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl">
                         <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 italic">Tipo</p>
                         <p className="text-xs font-black text-white">{selectedAsset.type}</p>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl">
                         <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 italic">Tamaño</p>
                         <p className="text-xs font-black text-white tabular-nums">{formatSize(selectedAsset.size)}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 italic">Subido en</p>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Calendar size={14} className="text-zinc-600" />
                        <span className="text-xs font-bold">{new Date(selectedAsset.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-6 border-t border-zinc-800">
                    <a 
                      href={selectedAsset.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl text-xs font-bold transition-all"
                    >
                      <Download size={16} /> Descargar Original
                    </a>
                    <button 
                      onClick={(e) => handleDelete(selectedAsset.id, e)}
                      className="w-full flex items-center justify-center gap-2 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white py-3 rounded-xl text-xs font-bold border border-rose-500/20 transition-all"
                    >
                      <Trash2 size={16} /> Eliminar Asset
                    </button>
                  </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
