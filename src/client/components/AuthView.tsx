import React, { useState } from 'react';
import axios from 'axios';
import { LogIn, UserPlus, Bike, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';

export default function AuthView({ onLogin }: { onLogin: (user: any) => void }) {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [dealerName, setDealerName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const { data } = await axios.post(endpoint, {
        email,
        password,
        name,
        dealerName
      });
      
      login(data.token, data.user);
      onLogin(data.user);
    } catch (err) {
      alert('Error: Datos inválidos');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex font-sans selection:bg-orange-500/30">
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

          <h2 className="text-3xl font-bold text-white mb-2">
            {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </h2>
          <p className="text-zinc-500 mb-8 font-medium">
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
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    placeholder="Juan Pérez"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Nombre del Concesionario</label>
                  <input 
                    type="text" 
                    value={dealerName}
                    onChange={(e) => setDealerName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    placeholder="Yamaha Motors Center"
                  />
                </div>
              </>
            )}
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Email Institucional</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                placeholder="concesionario@ejemplo.com"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Contraseña</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-6 transition-all shadow-lg shadow-orange-900/20"
            >
              {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
              {isLogin ? 'Iniciar Sesión' : 'Registrar Concesionario'}
              <ArrowRight size={18} className="ml-1" />
            </button>
          </form>

          <footer className="mt-8 text-center">
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
