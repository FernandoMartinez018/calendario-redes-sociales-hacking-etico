import React from 'react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Image as ImageIcon,
  BarChart3,
  Settings,
  LogOut,
  Wand2,
  FileText,
  Megaphone
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, user, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendario', icon: CalendarIcon },
    { id: 'posts', label: 'Publicaciones', icon: FileText },
    { id: 'assistant', label: 'Plan de contenido', icon: Wand2 },
    { id: 'ai', label: 'Post rápido', icon: Sparkles },
    { id: 'seo', label: 'Slogans & SEO', icon: Megaphone },
    { id: 'media', label: 'Multimedia', icon: ImageIcon },
    { id: 'analytics', label: 'Métricas', icon: BarChart3 },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950/50 backdrop-blur-xl flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-orange-900/40">
            M
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            MotoSocial
          </span>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-orange-500/10 text-orange-500 shadow-[inset_0_0_12px_rgba(249,115,22,0.1)]' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              {item.label}
              {activeTab === item.id && (
                <div className="ml-auto w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-zinc-800">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
            <img src={user.logoUrl || `https://ui-avatars.com/api/?name=${user.dealerName}`} alt="User" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-zinc-500 truncate">{user.dealerName}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
