import React, { useState } from 'react';
import { Store, Loader2, ArrowRight } from 'lucide-react';
import api from '../lib/api.js';

const FIELDS: { key: string; label: string; ph: string; area?: boolean }[] = [
  { key: 'brands', label: 'Marcas que vendes', ph: 'Yamaha, Honda, Bajaj...' },
  { key: 'motoTypes', label: 'Tipos de moto', ph: 'Deportiva, scooter, trabajo, aventura' },
  { key: 'city', label: 'Ciudad / zona', ph: 'Bogotá, Colombia' },
  { key: 'brandTone', label: 'Tono de marca', ph: 'Cercano, aventurero, técnico...' },
  { key: 'targetAudience', label: 'Público objetivo', ph: 'Jóvenes 20-35, primera moto...', area: true },
  { key: 'valueProposition', label: 'Qué te diferencia', ph: 'Taller propio, financiación...', area: true },
  { key: 'activePromotions', label: 'Promociones vigentes', ph: 'Casco gratis, 0% interés...', area: true },
  { key: 'season', label: 'Temporada / contexto', ph: 'Temporada de lluvias, fin de año...', area: true },
];

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [v, setV] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/api/store-profile', v);
      onDone();
    } catch {
      alert('No se pudo guardar el perfil. Puedes completarlo luego en Configuración.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
            <Store size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Paso 2 de 2</p>
            <h1 className="text-2xl font-black">Cuéntanos de tu tienda</h1>
          </div>
        </div>
        <p className="text-sm text-zinc-400 mb-6">
          Esto alimenta a la IA: mientras más completo, mejores ideas, copies y estrategia. Puedes
          omitirlo y completarlo luego en Configuración.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[55vh] overflow-y-auto pr-1">
          {FIELDS.map((f) => (
            <div key={f.key} className={f.area ? 'md:col-span-2' : ''}>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 block">
                {f.label}
              </label>
              {f.area ? (
                <textarea
                  value={v[f.key] || ''}
                  onChange={(e) => setV({ ...v, [f.key]: e.target.value })}
                  placeholder={f.ph}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm min-h-[60px] resize-none focus:outline-none focus:border-orange-500"
                />
              ) : (
                <input
                  type="text"
                  value={v[f.key] || ''}
                  onChange={(e) => setV({ ...v, [f.key]: e.target.value })}
                  placeholder={f.ph}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onDone}
            className="px-5 py-3 text-zinc-400 hover:text-white text-sm font-bold transition-colors"
          >
            Omitir por ahora
          </button>
          <div className="flex-1" />
          <button
            onClick={save}
            disabled={saving}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-7 py-3 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
            Guardar y empezar
          </button>
        </div>
      </div>
    </div>
  );
}
