import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import api from './lib/api.js';
import Onboarding from './components/Onboarding.tsx';
import MainLayout from './layouts/MainLayout.tsx';
import Dashboard from './components/Dashboard.tsx';
import CalendarView from './components/CalendarView.tsx';
import AIGenerator from './components/AIGenerator.tsx';
import ContentAssistant from './components/ContentAssistant.tsx';
import MediaLibrary from './components/MediaLibrary.tsx';
import PostsView from './components/PostsView.tsx';
import SeoView from './components/SeoView.tsx';
import Notifications from './components/Notifications.tsx';
import MetricsView from './components/MetricsView.tsx';
import SettingsView from './components/SettingsView.tsx';
import AuthView from './components/AuthView.tsx';
import PostModal from './components/PostModal.tsx';
import { PlusCircle } from 'lucide-react';

const TAB_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  calendar: 'Calendario',
  posts: 'Publicaciones',
  assistant: 'Plan de contenido',
  ai: 'Post rápido',
  seo: 'Slogans & SEO',
  media: 'Multimedia',
  analytics: 'Métricas',
  settings: 'Configuración',
};

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const { user, loading } = useAuth();
  const [profileState, setProfileState] = useState<'checking' | 'needed' | 'ok'>('checking');

  useEffect(() => {
    if (!user) {
      setProfileState('checking');
      return;
    }
    let active = true;
    api
      .get('/api/store-profile')
      .then(({ data }) => active && setProfileState(data ? 'ok' : 'needed'))
      .catch(() => active && setProfileState('ok')); // si falla, no bloquear el acceso
    return () => {
      active = false;
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-zinc-500 font-medium animate-pulse">Iniciando MotoSocial...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView onLogin={() => {}} />; // useAuth handles the user state
  }

  if (profileState === 'checking') {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (profileState === 'needed') {
    return <Onboarding onDone={() => setProfileState('ok')} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'calendar': return <CalendarView />;
      case 'posts': return <PostsView />;
      case 'assistant': return <ContentAssistant />;
      case 'ai': return <AIGenerator />;
      case 'seo': return <SeoView />;
      case 'media': return <MediaLibrary />;
      case 'analytics': return <MetricsView />;
      case 'settings': return <SettingsView />;
      default: return (
        <div className="flex h-[60vh] items-center justify-center text-zinc-500 border border-zinc-800 border-dashed rounded-3xl">
          Módulo "{activeTab}" en desarrollo
        </div>
      );
    }
  };

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2 font-display">
            {TAB_TITLES[activeTab] || activeTab}
          </h1>
          <p className="text-zinc-400 font-medium italic opacity-70">
            Optimizando la presencia social de {user.dealerName}
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('ai')}
            className="group relative flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-xl shadow-orange-900/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>Nueva Publicación</span>
            <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </header>

      <Notifications setActiveTab={setActiveTab} />

      {renderContent()}

      <PostModal
        isOpen={isPostModalOpen} 
        onClose={() => setIsPostModalOpen(false)} 
      />
    </MainLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
