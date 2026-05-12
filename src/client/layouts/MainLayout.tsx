import React from 'react';
import Sidebar from '../components/Sidebar.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Toaster } from '../components/ui/sonner.tsx';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function MainLayout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { user, logout } = useAuth();

  if (!user) return <>{children}</>;

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-orange-500/30 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user}
        onLogout={logout}
      />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        <div className="max-w-7xl mx-auto h-full">
          {children}
        </div>
        
        {/* Decorative Backgrounds */}
        <div className="absolute top-0 right-0 -z-10 w-full max-w-[600px] h-full max-h-[600px] bg-orange-500/5 blur-[120px] rounded-full pointer-events-none translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 -z-10 w-full max-w-[500px] h-full max-h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none -translate-x-1/4 translate-y-1/4" />
      </main>
      <Toaster richColors closeButton theme="dark" position="top-right" />
    </div>
  );
}
