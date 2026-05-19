import { db } from '../../db/index.js';
import { metricsSnapshots, contentPosts } from '../../db/schema.js';
import { eq, desc } from 'drizzle-orm';

// Mejor día por red por defecto (0=Dom .. 6=Sáb) cuando no hay datos.
export const DEFAULT_WEEKDAY: Record<string, number> = {
  INSTAGRAM: 4, // jueves
  TIKTOK: 6, // sábado
  FACEBOOK: 3, // miércoles
  X: 2, // martes
  YOUTUBE: 5, // viernes
};

export type Slot = { hour: string | null; weekday: number | null };

const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

/**
 * Calcula, por red, el mejor día y hora según el engagement real registrado.
 * Si una red tiene menos de 3 publicaciones medidas, devuelve nulls (fallback).
 */
export async function getBestSlots(userId: string): Promise<Record<string, Slot>> {
  const result: Record<string, Slot> = {};
  try {
    const rows = await db
      .select({ snap: metricsSnapshots, post: contentPosts })
      .from(metricsSnapshots)
      .innerJoin(contentPosts, eq(metricsSnapshots.postId, contentPosts.id))
      .where(eq(contentPosts.userId, userId))
      .orderBy(desc(metricsSnapshots.recordedAt))
      .limit(400);

    const latest: Record<string, any> = {};
    for (const r of rows) if (!latest[r.post.id]) latest[r.post.id] = r;

    const byNet: Record<
      string,
      { wd: Record<number, number[]>; hr: Record<number, number[]> }
    > = {};

    for (const r of Object.values(latest) as any[]) {
      const net = r.post.platform;
      const when = r.post.scheduledAt || r.post.publishedAt;
      if (!net || !when) continue;
      const d = new Date(when);
      const eng = parseFloat(r.snap.engagement) || 0;
      byNet[net] ||= { wd: {}, hr: {} };
      (byNet[net].wd[d.getDay()] ||= []).push(eng);
      (byNet[net].hr[d.getHours()] ||= []).push(eng);
    }

    for (const [net, g] of Object.entries(byNet)) {
      const total = Object.values(g.wd).reduce((a, arr) => a + arr.length, 0);
      if (total < 3) {
        result[net] = { hour: null, weekday: null };
        continue;
      }
      const bestWd = Object.entries(g.wd).sort((a, b) => avg(b[1]) - avg(a[1]))[0];
      const bestHr = Object.entries(g.hr).sort((a, b) => avg(b[1]) - avg(a[1]))[0];
      result[net] = {
        weekday: bestWd ? Number(bestWd[0]) : null,
        hour: bestHr ? `${String(Number(bestHr[0])).padStart(2, '0')}:00` : null,
      };
    }
  } catch (e) {
    console.error('getBestSlots error:', e);
  }
  return result;
}
