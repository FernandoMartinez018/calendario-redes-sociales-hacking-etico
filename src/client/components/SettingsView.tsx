import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings as SettingsIcon, 
  Shield, 
  Link2, 
  Plus, 
  Trash2, 
  AtSign, 
  Briefcase, 
  Save, 
  LogOut, 
  CheckCircle2, 
  Loader2,
  Instagram,
  Facebook,
  Twitter,
  Youtube
} from 'lucide-react';
import api from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.tsx';
import { motion, AnimatePresence } from 'motion/react';

export default function SettingsView() {
  const { user, logout, updateUser } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'social' | 'security'>('profile');
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    dealerName: user?.dealerName || '',
    email: user?.email || '',
  });
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (activeSubTab === 'social') {
      fetchSocialAccounts();
    }
  }, [activeSubTab]);

  const fetchSocialAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const { data } = await api.get('/api/settings/social-accounts');
      setSocialAccounts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { data } = await api.post('/api/settings/profile', {
        name: profileData.name,
        dealerName: profileData.dealerName
      });
      updateUser(data);
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al actualizar el perfil' });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    try {
      await api.delete(`/api/settings/social-accounts/${id}`);
      setSocialAccounts(socialAccounts.filter(acc => acc.id !== id));
    } catch (err) {
      alert('Error al desconectar la cuenta');
    }
  };

  // Dummy link account for demo purposes
  const handleLinkAccount = async (platform: string) => {
    try {
      const handle = prompt(`Ingrese su usuario de ${platform}:`);
      if (!handle) return;
      
      const { data } = await api.post('/api/settings/social-accounts', {
        platform,
        handle,
        accessToken: 'dummy-token-' + Math.random()
      });
      setSocialAccounts([...socialAccounts, data]);
    } catch (err) {
      alert('Error al vincular la cuenta');
    }
  };

  const menuItems = [
    { id: 'profile', label: 'Mi Perfil', icon: User },
    { id: 'social', label: 'Cuentas Vinculadas', icon: Link2 },
    { id: 'security', label: 'Seguridad', icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl">
           <SettingsIcon className="text-orange-500" size={24} />
        </div>
        <div>
           <h2 className="text-2xl font-black tracking-tight">Configuración</h2>
           <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic mt-0.5">Personaliza tu experiencia y gestiona integraciones</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Nav */}
        <div className="lg:col-span-3 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === item.id 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' 
                  : 'bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-all mt-10"
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSubTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              {activeSubTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-black uppercase text-zinc-400">Información del Perfil</h3>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase mb-6 tracking-widest italic">Actualiza tus datos públicos y del concesionario</p>
                  </div>
                  
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 block">Nombre Completo</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                          <input 
                            type="text"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                            placeholder="Tu nombre"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 block">Nombre del Concesionario</label>
                        <div className="relative">
                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                          <input 
                            type="text"
                            value={profileData.dealerName}
                            onChange={(e) => setProfileData({ ...profileData, dealerName: e.target.value })}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                            placeholder="Ej: Suzuki Motors Official"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 block opacity-50">Correo Electrónico (No modificable)</label>
                        <div className="relative">
                          <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-800" size={16} />
                          <input 
                            type="email"
                            value={profileData.email}
                            disabled
                            className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-xl pl-12 pr-4 py-3 text-sm text-zinc-600 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      {message && (
                        <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${
                          message.type === 'success' ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          {message.type === 'success' && <CheckCircle2 size={14} />}
                          {message.text}
                        </div>
                      )}
                      <div className="flex-1" />
                      <button 
                        type="submit"
                        disabled={saving}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-orange-900/20 disabled:opacity-50"
                      >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Guardar Cambios
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeSubTab === 'social' && (
                <div className="space-y-6">
                   <div>
                    <h3 className="text-lg font-black uppercase text-zinc-400">Canales Vinculados</h3>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase mb-6 tracking-widest italic">Gestiona las conexiones a tus redes sociales</p>
                  </div>

                  <div className="space-y-4">
                    {loadingAccounts ? (
                      <div className="py-10 flex justify-center">
                         <Loader2 className="text-orange-500 animate-spin" />
                      </div>
                    ) : socialAccounts.length === 0 ? (
                      <div className="p-10 border border-zinc-800 border-dashed rounded-2xl text-center space-y-3">
                         <Link2 className="mx-auto text-zinc-700" size={32} />
                         <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">No hay cuentas vinculadas</p>
                      </div>
                    ) : (
                      socialAccounts.map((acc) => (
                        <div key={acc.id} className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-2xl group hover:border-zinc-700 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-orange-500 border border-zinc-800 group-hover:scale-110 transition-transform">
                              {acc.platform === 'INSTAGRAM' && <Instagram size={20} />}
                              {acc.platform === 'FACEBOOK' && <Facebook size={20} />}
                              {acc.platform === 'TIKTOK' && <Twitter size={20} />}
                              {acc.platform === 'YOUTUBE' && <Youtube size={20} />}
                            </div>
                            <div>
                               <p className="text-sm font-black text-white leading-none">{acc.handle}</p>
                               <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1 italic">{acc.platform}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDisconnect(acc.id)}
                            className="p-2 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-6 border-t border-zinc-900">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-4 italic">Agregar nueva plataforma</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { name: 'INSTAGRAM', icon: Instagram, color: 'rose' },
                        { name: 'FACEBOOK', icon: Facebook, color: 'blue' },
                        { name: 'TIKTOK', icon: Twitter, color: 'white' },
                        { name: 'YOUTUBE', icon: Youtube, color: 'red' },
                      ].map((plat) => (
                        <button
                          key={plat.name}
                          onClick={() => handleLinkAccount(plat.name)}
                          className={`flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all gap-2 group`}
                        >
                          <plat.icon size={20} className="text-zinc-500 group-hover:text-orange-500 transition-colors" />
                          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter">{plat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === 'security' && (
                <div className="space-y-6">
                   <div>
                    <h3 className="text-lg font-black uppercase text-zinc-400">Seguridad & Privacidad</h3>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase mb-6 tracking-widest italic">Protege tu acceso y datos sensibles</p>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Shield className="text-emerald-500" />
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-tight">Autenticación de Dos Pasos</p>
                          <p className="text-[10px] text-zinc-500 font-medium">Añade una capa extra de seguridad a tu cuenta.</p>
                        </div>
                      </div>
                      <div className="w-10 h-5 bg-zinc-800 rounded-full relative cursor-not-allowed opacity-50">
                        <div className="absolute left-1 top-1 w-3 h-3 bg-zinc-600 rounded-full" />
                      </div>
                    </div>

                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                      <p className="text-xs font-black text-white uppercase tracking-tight mb-2">Cambiar Contraseña</p>
                      <p className="text-[10px] text-zinc-500 mb-6 font-medium italic">Se recomienda usar una mezcla de letras, números y símbolos.</p>
                      <button className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-colors">
                        Iniciar proceso de cambio &rarr;
                      </button>
                    </div>

                    <div className="p-6 border border-rose-500/20 bg-rose-500/5 rounded-2xl">
                      <p className="text-xs font-black text-rose-500 uppercase tracking-tight mb-1">Zona de Peligro</p>
                      <p className="text-[10px] text-zinc-500 mb-4 italic">Al eliminar tu cuenta, todos los datos se borrarán permanentemente.</p>
                      <button className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all">
                        Eliminar Mi Cuenta
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
