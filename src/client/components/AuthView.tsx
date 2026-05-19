import React, { useState, useEffect } from 'react';
import api from '../lib/api.js';
import { LogIn, UserPlus, Bike, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

export default function AuthView({ onLogin }: { onLogin: (user: any) => void }) {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [dealerName, setDealerName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if we just returned from Supabase OAuth redirect
    const checkSession = async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        handleSupabaseUser(session.user);
      }
    };
    checkSession();
  }, []);

  const handleSupabaseUser = async (user: any) => {
    try {
      setLoading(true);
      const { data } = await api.post('/api/auth/supabase-sync', {
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        picture: user.user_metadata?.avatar_url
      });
      login(data.token, data.user);
      onLogin(data.user);
    } catch (err) {
      console.error('Error syncing Supabase user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!supabase) {
      alert('El login con Google no está configurado (faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).');
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const { data } = await api.post(endpoint, {
        email,
        password,
        name,
        dealerName
      });
      
      login(data.token, data.user);
      onLogin(data.user);
    } catch (err) {
      alert('Error: Datos inválidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex font-sans selection:bg-orange-500/30 text-white">
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 items-center justify-center p-12 overflow-hidden border-r border-zinc-800">
        <div className="z-10 max-w-lg text-center">
          <div className="w-20 h-20 bg-orange-600 rounded-3xl mx-auto flex items-center justify-center text-white mb-8 shadow-2xl shadow-orange-900/50">
            <Bike size={40} />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
            La potencia de tu concesionario en <span className="text-orange-500">un solo lugar.</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Gestiona redes sociales, crea campañas de ads y genera contenido con IA específicamente diseñado para el mundo de las motos.
          </p>
        </div>
        
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-600/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
             <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold">M</div>
              <span className="text-xl font-bold tracking-tight text-white">MotoSocial</span>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2 font-display">
            {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </h2>
          <p className="text-zinc-500 mb-8 font-medium font-sans">
            Ingresa los detalles para gestionar tu inventario social.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-white"
                    placeholder="Juan Pérez"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Nombre del Concesionario</label>
                  <input 
                    type="text" 
                    value={dealerName}
                    onChange={(e) => setDealerName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-white"
                    placeholder="Yamaha Motors Center"
                  />
                </div>
              </>
            )}
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block text-zinc-500">Email Institucional</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-white"
                placeholder="concesionario@ejemplo.com"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block text-zinc-500">Contraseña</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-white"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-6 transition-all shadow-lg shadow-orange-900/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                  {isLogin ? 'Iniciar Sesión' : 'Registrar Concesionario'}
                  <ArrowRight size={18} className="ml-1" />
                </>
              )}
            </button>
          </form>

          {isSupabaseConfigured && (<>
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-950 px-3 text-zinc-500 font-bold tracking-widest">O continúa con</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" />
            </svg>
            Entrar con Google (Supabase)
          </button>
          </>)}

          <footer className="mt-8 text-center text-white">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-zinc-400 hover:text-white text-sm font-medium transition-colors"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
