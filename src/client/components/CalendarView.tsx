import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Instagram, Facebook, PlayCircle, Twitter } from 'lucide-react';
import { Button } from './ui/button.tsx';
import { Badge } from './ui/badge.tsx';

export default function CalendarView() {
  const days = Array.from({ length: 35 }, (_, i) => ({
    day: (i % 31) + 1,
    hasEvent: Math.random() > 0.7,
    platform: ['instagram', 'tiktok', 'facebook', 'youtube'][Math.floor(Math.random() * 4)]
  }));

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram size={12} className="text-pink-500" />;
      case 'tiktok': return <PlayCircle size={12} className="text-cyan-400" />;
      case 'facebook': return <Facebook size={12} className="text-blue-500" />;
      default: return <Twitter size={12} className="text-sky-400" />;
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800/60 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in duration-700">
      <div className="p-6 border-b border-zinc-800/60 flex items-center justify-between bg-zinc-900/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black font-display">Octubre 2024</h2>
            <Badge variant="outline" className="text-[10px] uppercase font-black bg-zinc-900 border-zinc-800">Hoy</Badge>
          </div>
          <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden h-9">
            <button className="px-3 hover:bg-zinc-800 text-zinc-400 transition-colors border-r border-zinc-800">
              <ChevronLeft size={16} />
            </button>
            <button className="px-3 hover:bg-zinc-800 text-zinc-400 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            {['Mes', 'Semana', 'Lista'].map((v) => (
              <button key={v} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${v === 'Mes' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {v}
              </button>
            ))}
          </div>
          <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-[10px] font-bold uppercase h-9">
            <Plus size={14} className="mr-1" /> Nuevo Evento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-zinc-800/60 bg-zinc-950/50">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
          <div key={d} className="py-4 text-center text-[10px] font-black uppercase text-zinc-500 tracking-widest border-r border-zinc-800/40 last:border-0">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-5 h-[650px] bg-zinc-950/20">
        {days.map((d, i) => (
          <div key={i} className={`p-3 border-r border-b border-zinc-800/40 group hover:bg-zinc-900/40 transition-colors relative cursor-pointer ${i % 7 === 6 ? 'border-r-0' : ''}`}>
            <span className={`text-xs font-bold ${d.day > 25 && i < 7 ? 'text-zinc-800' : 'text-zinc-500'} group-hover:text-white transition-colors`}>
              {d.day}
            </span>
            
            {d.hasEvent && (
              <div className="mt-2 space-y-1.5">
                <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/60 group/event hover:border-orange-500/50 transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    {getPlatformIcon(d.platform)}
                    <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-tighter tabular-nums">09:00</span>
                  </div>
                  <p className="text-[9px] font-bold text-zinc-300 leading-tight line-clamp-1 uppercase tracking-tight">Moto Event {d.day}</p>
                </div>
              </div>
            )}
            
            <button className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-zinc-800 rounded-md text-zinc-400 hover:text-orange-500 transition-all scale-75 group-hover:scale-100 border border-zinc-700">
              <Plus size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
