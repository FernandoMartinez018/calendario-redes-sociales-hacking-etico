import React, { useState, useEffect } from 'react';
import api from '../lib/api.js';
import { LogIn, UserPlus, Bike, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { signInWithGoogle, signOutGoogle, isFirebaseConfigured } from '../lib/firebase.js';
import { sendResetEmailJS, sendWelcomeEmailJS } from '../lib/emailjs.js';
import { toast } from 'sonner';

export default function AuthView({ onLogin }: { onLogin: (user: any) => void }) {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [dealerName, setDealerName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Si llegamos desde el enlace del correo (?token=...), modo "definir contraseña".
    const t = new URLSearchParams(window.location.search).get('token');
    if (t) setResetToken(t);
  }, []);

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) {
      toast.error('El login con Google no está configurado.');
      return;
    }
    try {
      setLoading(true);
      const profile = await signInWithGoogle();
      const { data } = await api.post('/api/auth/supabase-sync', profile);
      login(data.token, data.user);
      onLogin(data.user);
    } catch (err: any) {
      // El usuario cerró el popup → no es un error que mostrar.
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') return;
      // El backend rechazó (cuenta no registrada u otro): cerramos la sesión de
      // Firebase para no dejarla colgada y mostramos el mensaje del servidor.
      await signOutGoogle().catch(() => {});
      const msg = err?.response?.data?.error || 'No se pudo iniciar sesión con Google.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => {
    setIsForgot(false);
    setResetToken(null);
    setPassword('');
    window.history.replaceState({}, '', window.location.pathname);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (resetToken) {
        await api.post('/api/auth/reset-password', { token: resetToken, newPassword: password });
        toast.success('Contraseña actualizada. Inicia sesión con la nueva.');
        backToLogin();
        return;
      }
      if (isForgot) {
        const { data } = await api.post('/api/auth/forgot-password', { email });
        if (data.link) {
          const ok = await sendResetEmailJS(data.email, data.link);
          if (ok) {
            toast.success('Te enviamos un correo con el enlace para restablecer tu contraseña. Revisa tu bandeja (y spam).');
          } else {
            toast.error('No se pudo enviar el correo (revisa la config de EmailJS).', {
              description: `Enlace de reseteo (válido 1 h): ${data.link}`,
              duration: 15000,
            });
          }
        } else {
          toast.info(data.message);
        }
        setIsForgot(false);
        return;
      }
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const { data } = await api.post(endpoint, { email, password, name, dealerName });
      if (!isLogin) {
        // Registro exitoso → correo de bienvenida (best-effort, no bloquea).
        try {
          await sendWelcomeEmailJS(email, name);
        } catch {
          /* ignorar */
        }
      }
      login(data.token, data.user);
      onLogin(data.user);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error: revisa los datos.');
    } finally {
      setLoading(false);
    }
  };

  const title = resetToken
    ? 'Define tu nueva contraseña'
    : isForgot
    ? 'Recuperar contraseña'
    : isLogin
    ? 'Bienvenido de nuevo'
    : 'Crea tu cuenta';

  const subtitle = resetToken
    ? 'Escribe tu nueva contraseña (mínimo 6 caracteres).'
    : isForgot
    ? 'Te enviaremos un enlace para restablecerla.'
    : 'Ingresa los detalles para gestionar tu inventario social.';

  const showRegisterFields = !isLogin && !isForgot && !resetToken;
  const showEmail = !resetToken;
  const showPassword = !isForgot;
  const showGoogle = isFirebaseConfigured && !isForgot && !resetToken;

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
            Gestiona redes sociales y genera contenido con IA específicamente diseñado para el mundo de las motos.
          </p>
        </div>
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

          <h2 className="text-3xl font-bold text-white mb-2 font-display">{title}</h2>
          <p className="text-zinc-500 mb-8 font-medium font-sans">{subtitle}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {showRegisterFields && (
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

            {showEmail && (
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Email </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-white"
                  placeholder="concesionario@ejemplo.com"
                />
              </div>
            )}

            {showPassword && (
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">
                  {resetToken ? 'Nueva contraseña' : 'Contraseña'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-white"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-6 transition-all shadow-lg shadow-orange-900/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {resetToken || isForgot ? <KeyRound size={20} /> : isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                  {resetToken
                    ? 'Guardar contraseña'
                    : isForgot
                    ? 'Enviar enlace'
                    : isLogin
                    ? 'Iniciar Sesión'
                    : 'Registrar Concesionario'}
                  <ArrowRight size={18} className="ml-1" />
                </>
              )}
            </button>
          </form>

          {showGoogle && (
            <>
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
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Entrar con Google
              </button>
            </>
          )}

          <footer className="mt-8 text-center text-white space-y-2">
            {isForgot || resetToken ? (
              <button
                onClick={backToLogin}
                className="block w-full text-zinc-400 hover:text-white text-sm font-medium transition-colors"
              >
                ← Volver a iniciar sesión
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="block w-full text-zinc-400 hover:text-white text-sm font-medium transition-colors"
                >
                  {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
                </button>
                <button
                  onClick={() => { setIsForgot(true); setIsLogin(true); }}
                  className="block w-full text-zinc-500 hover:text-orange-500 text-xs font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}
