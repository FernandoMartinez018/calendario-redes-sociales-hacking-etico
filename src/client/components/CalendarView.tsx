import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Instagram, 
  Facebook, 
  PlayCircle, 
  Twitter,
  Clock,
  LayoutGrid,
  List as ListIcon,
  CalendarDays,
  Loader2,
  MoreVertical,
  ExternalLink,
  Download
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addDays, subDays, startOfDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../lib/api.js';
import PostModal from './PostModal.jsx';
import PostEditModal from './PostEditModal.tsx';
import { motion, AnimatePresence } from 'motion/react';

type ViewType = 'Mes' | 'Semana' | 'Lista';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('Mes');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<string | undefined>(undefined);
  const [editingPost, setEditingPost] = useState<any>(null);
  const draggedRef = useRef<any>(null);

  const fetchPosts = async () => {
    try {
      const { data } = await api.get('/api/posts');
      setPosts(data);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const rescheduleTo = async (post: any, day: Date) => {
    if (!post) return;
    const old = post.scheduledAt ? new Date(post.scheduledAt) : new Date();
    const nd = new Date(day);
    nd.setHours(old.getHours(), old.getMinutes(), 0, 0);
    try {
      await api.patch(`/api/posts/${post.id}`, { scheduledAt: nd, status: 'SCHEDULED' });
      fetchPosts();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'No se pudo reprogramar.');
    }
  };

  const handleDropOnDay = (day: Date) => (e: React.DragEvent) => {
    e.preventDefault();
    const p = draggedRef.current;
    draggedRef.current = null;
    if (p) rescheduleTo(p, day);
  };

  const exportCalendarCSV = () => {
    const rows: any[] = [['Fecha', 'Hora', 'Red', 'Formato', 'Estado', 'Copy', 'Hashtags', 'URL']];
    posts
      .filter((p) => p.scheduledAt)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .forEach((p) => {
        const d = new Date(p.scheduledAt);
        rows.push([
          d.toLocaleDateString(),
          d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          p.platform || '',
          p.type || '',
          p.status || '',
          p.copy || '',
          p.hashtags || '',
          p.postUrl || '',
        ]);
      });
    const csv = rows
      .map((r) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendario_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const nextDate = () => {
    if (view === 'Mes') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'Semana') setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const prevDate = () => {
    if (view === 'Mes') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'Semana') setCurrentDate(subDays(currentDate, 7));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const goToToday = () => setCurrentDate(new Date());

  const handleOpenModal = (date?: Date) => {
    if (date) {
      // Format for datetime-local: YYYY-MM-DDTHH:mm
      const formattedDate = format(date, "yyyy-MM-dd'T'HH:mm");
      setSelectedDateForModal(formattedDate);
    } else {
      setSelectedDateForModal(undefined);
    }
    setIsModalOpen(true);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toUpperCase()) {
      case 'INSTAGRAM': return <Instagram size={12} className="text-pink-500" />;
      case 'TIKTOK': return <PlayCircle size={12} className="text-cyan-400" />;
      case 'FACEBOOK': return <Facebook size={12} className="text-blue-500" />;
      case 'X': return <Twitter size={12} className="text-sky-400" />;
      default: return <CalendarIcon size={12} className="text-orange-500" />;
    }
  };

  // Month View Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Week View Logic
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="bg-zinc-950 border border-zinc-800/60 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in duration-700 text-white flex flex-col min-h-[800px]">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black font-display text-white capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h2>
            <button 
              onClick={goToToday}
              className={`px-3 py-1 border border-zinc-800 rounded-lg text-[10px] uppercase font-black transition-all ${
                isToday(currentDate) ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-zinc-900 text-zinc-500 hover:text-white'
              }`}
            >
              Hoy
            </button>
          </div>
          <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden h-9">
            <button onClick={prevDate} className="px-3 hover:bg-zinc-800 text-zinc-400 transition-colors border-r border-zinc-800">
              <ChevronLeft size={16} />
            </button>
            <button onClick={nextDate} className="px-3 hover:bg-zinc-800 text-zinc-400 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            {(['Mes', 'Semana', 'Lista'] as ViewType[]).map((v) => (
              <button 
                key={v} 
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  view === v ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {v === 'Mes' && <LayoutGrid size={12} />}
                {v === 'Semana' && <CalendarDays size={12} />}
                {v === 'Lista' && <ListIcon size={12} />}
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={exportCalendarCSV}
            className="bg-zinc-800 hover:bg-zinc-700 text-[10px] font-black uppercase tracking-widest h-9 px-4 rounded-lg flex items-center gap-2 text-white transition-all"
          >
            <Download size={14} /> Exportar
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="bg-orange-600 hover:bg-orange-700 text-[10px] font-black uppercase tracking-widest h-9 px-6 rounded-lg flex items-center gap-2 text-white transition-all shadow-lg shadow-orange-900/20 hover:scale-[1.02] active:scale-95"
          >
            <Plus size={16} /> Nuevo Post
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center py-40 gap-4">
              <Loader2 className="text-orange-500 animate-spin" size={32} />
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Cargando Agenda...</p>
            </div>
          ) : view === 'Mes' ? (
            <motion.div 
              key="month"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="min-w-[800px]"
            >
              <div className="grid grid-cols-7 border-b border-zinc-800/60 bg-zinc-950/50">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                  <div key={d} className="py-4 text-center text-[10px] font-black uppercase text-zinc-500 tracking-widest border-r border-zinc-800/40 last:border-0">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 auto-rows-[140px]">
                {calendarDays.map((day, i) => {
                  const dayPosts = posts.filter(p => p.scheduledAt && isSameDay(new Date(p.scheduledAt), day));
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  
                  return (
                    <div
                      key={day.toString()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDropOnDay(day)}
                      className={`p-3 border-r border-b border-zinc-800/40 group hover:bg-zinc-900/40 transition-colors relative flex flex-col ${
                        i % 7 === 6 ? 'border-r-0' : ''
                      } ${!isCurrentMonth ? 'bg-zinc-950/40' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-black tabular-nums transition-colors ${
                          isToday(day) 
                            ? 'w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-900/40' 
                            : isCurrentMonth ? 'text-zinc-400 group-hover:text-white' : 'text-zinc-700'
                        }`}>
                          {format(day, 'd')}
                        </span>
                        <button 
                          onClick={() => handleOpenModal(day)}
                          className="opacity-0 group-hover:opacity-100 p-1 bg-zinc-800 hover:bg-orange-600 hover:text-white rounded-md text-zinc-500 transition-all scale-90 group-hover:scale-100 border border-zinc-700"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1">
                        {dayPosts.map((post) => (
                          <div
                            key={post.id}
                            draggable
                            onDragStart={() => { draggedRef.current = post; }}
                            onClick={() => setEditingPost(post)}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800/60 group/event hover:border-orange-500/50 transition-all shadow-sm cursor-pointer active:cursor-grabbing"
                          >
                            <div className="flex items-center justify-between mb-1">
                              {getPlatformIcon(post.platform || 'INSTAGRAM')}
                              <span className="text-[7px] font-black text-zinc-500 uppercase tabular-nums">
                                {format(new Date(post.scheduledAt!), 'HH:mm')}
                              </span>
                            </div>
                            <p className="text-[9px] font-bold text-zinc-300 leading-tight line-clamp-1 uppercase tracking-tighter">
                              {post.copy}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : view === 'Semana' ? (
            <motion.div 
              key="week"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-7 h-[600px] min-w-[800px]"
            >
              {weekDays.map((day, i) => {
                const dayPosts = posts.filter(p => p.scheduledAt && isSameDay(new Date(p.scheduledAt), day));
                return (
                  <div key={day.toString()} onDragOver={(e) => e.preventDefault()} onDrop={handleDropOnDay(day)} className={`border-r border-zinc-800/40 last:border-0 flex flex-col bg-zinc-950/20 group ${isToday(day) ? 'bg-orange-500/[0.02]' : ''}`}>
                    <div className={`p-4 border-b border-zinc-800/40 text-center space-y-1 ${isToday(day) ? 'bg-orange-500/5' : ''}`}>
                      <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{format(day, 'EEE', { locale: es })}</p>
                      <p className={`text-xl font-black tabular-nums ${isToday(day) ? 'text-orange-500' : 'text-white'}`}>{format(day, 'd')}</p>
                    </div>
                    <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                      <button 
                        onClick={() => handleOpenModal(day)}
                        className="w-full py-3 order-dashed border border-zinc-800 text-zinc-600 hover:text-orange-500 hover:border-orange-500/50 rounded-xl transition-all flex flex-col items-center justify-center gap-1 opacity-40 hover:opacity-100 group-hover:opacity-60"
                      >
                        <Plus size={16} />
                        <span className="text-[8px] font-black uppercase tracking-widest">Agendar</span>
                      </button>

                      {dayPosts.map((post) => (
                        <div
                          key={post.id}
                          draggable
                          onDragStart={() => { draggedRef.current = post; }}
                          onClick={() => setEditingPost(post)}
                          className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-3 group/item hover:border-orange-500/30 transition-all shadow-xl cursor-pointer active:cursor-grabbing"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon(post.platform || 'INSTAGRAM')}
                              <span className="text-[10px] font-black text-zinc-500 uppercase">{post.platform || 'INSTAGRAM'}</span>
                            </div>
                            <span className="text-[10px] font-black text-orange-500 tabular-nums bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                              {format(new Date(post.scheduledAt!), 'HH:mm')}
                            </span>
                          </div>
                          <p className="text-[11px] font-bold text-zinc-100 leading-relaxed uppercase tracking-tight line-clamp-3">
                            {post.copy}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                             <div className="flex -space-x-2">
                                <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-900" />
                                <div className="w-5 h-5 rounded-full bg-zinc-700 border border-zinc-900" />
                             </div>
                             <MoreVertical size={14} className="text-zinc-600 group-hover/item:text-zinc-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="p-8 max-w-4xl mx-auto space-y-12"
            >
              {posts.filter(p => p.status === 'DRAFT' || !p.scheduledAt).length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <CalendarDays size={14} className="text-zinc-600" />
                    Borradores sin fecha — clic para editar / agendar
                  </p>
                  {posts.filter(p => p.status === 'DRAFT' || !p.scheduledAt).map(p => (
                    <div key={p.id} onClick={() => setEditingPost(p)} className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 border-dashed cursor-pointer hover:border-orange-500/40 transition-colors">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 shrink-0">Borrador</span>
                      <p className="text-sm text-zinc-300 truncate flex-1 font-bold uppercase tracking-tight">{p.copy}</p>
                    </div>
                  ))}
                </div>
              )}

              {posts.filter(p => p.scheduledAt && new Date(p.scheduledAt) >= startOfDay(new Date()))
                .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
                .length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                     <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-700 mx-auto">
                        <CalendarDays size={32} />
                     </div>
                     <div>
                        <p className="text-zinc-400 font-bold">No hay publicaciones próximas</p>
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-1 italic">Empieza a programar para ver tu contenido aquí</p>
                     </div>
                  </div>
                ) : (
                  posts
                    .filter(p => p.scheduledAt && new Date(p.scheduledAt) >= startOfDay(new Date()))
                    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
                    .map((post, i) => (
                      <div key={post.id} className="flex gap-8 group">
                         <div className="flex flex-col items-center">
                            <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center shadow-xl group-hover:border-orange-500/50 transition-all">
                               <span className="text-sm font-black text-white tabular-nums">{format(new Date(post.scheduledAt!), 'd')}</span>
                               <span className="text-[8px] font-black text-orange-500 uppercase tracking-tighter">{format(new Date(post.scheduledAt!), 'MMM', { locale: es })}</span>
                            </div>
                            <div className="w-px flex-1 bg-zinc-800 my-4 group-last:hidden" />
                         </div>
                         <div onClick={() => setEditingPost(post)} className="flex-1 bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 hover:shadow-2xl hover:border-zinc-700 transition-all translate-y-[-2px] cursor-pointer">
                            <div className="flex items-center justify-between mb-4">
                               <div className="flex items-center gap-3">
                                  <div className="p-2 bg-zinc-900 rounded-lg text-orange-500 border border-zinc-800">
                                    {getPlatformIcon(post.platform || 'INSTAGRAM')}
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-black text-white uppercase tracking-tight">{post.platform || 'INSTAGRAM'}</p>
                                    <p className="text-[9px] text-orange-500 font-black uppercase flex items-center gap-1 tabular-nums mt-0.5">
                                      <Clock size={10} /> {format(new Date(post.scheduledAt!), 'HH:mm')}
                                    </p>
                                  </div>
                               </div>
                               <button className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-[9px] font-black uppercase text-zinc-500 hover:text-white rounded-lg border border-zinc-800 transition-all">
                                  Ver Canal <ExternalLink size={10} />
                               </button>
                            </div>
                            <p className="text-sm font-bold text-zinc-300 leading-relaxed uppercase tracking-tight">
                              {post.copy}
                            </p>
                            {post.mediaUrl && (
                              <div className="mt-4 aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                                <img src={post.mediaUrl} className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" alt="Preview" />
                              </div>
                            )}
                         </div>
                      </div>
                    ))
                )
              }
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PostModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          fetchPosts(); // Refresh on close
        } }
        initialScheduledAt={selectedDateForModal}
      />

      <PostEditModal
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onSaved={fetchPosts}
      />
    </div>
  );
}
