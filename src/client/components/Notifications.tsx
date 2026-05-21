import React, { useEffect, useState } from 'react';
import { Bell, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import api from '../lib/api.js';

interface Props {
  setActiveTab: (t: string) => void;
}

export default function Notifications({ setActiveTab }: Props) {
  const [items, setItems] = useState<{ label: string; tab: string }[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, mRes] = await Promise.all([
          api.get('/api/posts'),
          api.get('/api/metrics/summary').catch(() => ({ data: { history: [] } })),
        ]);
        const posts: any[] = Array.isArray(pRes.data) ? pRes.data : [];
        const withMetrics = new Set(
          (mRes.data?.history || []).map((h: any) => h.snapshot.postId)
        );

        const now = Date.now();
        const drafts = posts.filter((p) => p.status === 'DRAFT' || !p.scheduledAt).length;
        const noMetrics = posts.filter(
          (p) => p.status === 'PUBLISHED' && !withMetrics.has(p.id)
        ).length;
        const noUrl = posts.filter((p) => p.status === 'PUBLISHED' && !p.postUrl).length;
        const soon = posts.filter(
          (p) =>
            p.status === 'SCHEDULED' &&
            p.scheduledAt &&
            new Date(p.scheduledAt).getTime() - now > 0 &&
            new Date(p.scheduledAt).getTime() - now < 86400000
        ).length;
        const duePublish = posts.filter(
          (p) =>
            p.status === 'SCHEDULED' &&
            p.scheduledAt &&
            new Date(p.scheduledAt).getTime() <= now
        ).length;

        const list: { label: string; tab: string }[] = [];
        if (duePublish)
          list.push({
            label: `${duePublish} lista(s) para publicar — ya pasó su hora, publícala y márcala como publicada`,
            tab: 'posts',
          });
        if (soon)
          list.push({ label: `${soon} publicación(es) programadas en las próximas 24 h`, tab: 'calendar' });
        if (noMetrics)
          list.push({ label: `${noMetrics} publicada(s) sin métricas registradas`, tab: 'posts' });
        if (noUrl)
          list.push({ label: `${noUrl} publicada(s) sin URL (necesaria para sincronizar)`, tab: 'posts' });
        if (drafts)
          list.push({ label: `${drafts} borrador(es) sin agendar`, tab: 'posts' });

        setItems(list);
      } catch {
        /* silencioso */
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready || dismissed) return null;

  if (items.length === 0) {
    return (
      <div className="mb-6 flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-5 py-3">
        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
        <p className="text-sm text-zinc-300 font-medium">Todo al día — no hay tareas pendientes.</p>
        <button
          onClick={() => setDismissed(true)}
          className="ml-auto text-zinc-600 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-zinc-900/60 border border-orange-500/20 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800 bg-orange-500/5">
        <Bell size={16} className="text-orange-500" />
        <p className="text-xs font-black uppercase tracking-widest text-orange-500">
          Tareas pendientes ({items.length})
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="ml-auto text-zinc-600 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      <div className="divide-y divide-zinc-800/60">
        {items.map((it, i) => (
          <button
            key={i}
            onClick={() => {
              setActiveTab(it.tab);
              setDismissed(true);
            }}
            className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-zinc-800/40 transition-colors group"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
            <span className="text-sm text-zinc-300 flex-1">{it.label}</span>
            <ChevronRight size={15} className="text-zinc-600 group-hover:text-white transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
