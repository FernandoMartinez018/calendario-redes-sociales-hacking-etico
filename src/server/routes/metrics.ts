import { Router } from 'express';
import axios from 'axios';
import { db } from '../../db/index.js';
import { metricsSnapshots, contentPosts } from '../../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();

const eng = (l: number, c: number, s: number, v: number) =>
  v > 0 ? (((l + c + s) / v) * 100).toFixed(2) : '0.00';

const youtubeId = (url?: string | null): string | null => {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
};

router.get('/summary', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  try {
    const results = await db.select({
      snapshot: metricsSnapshots,
      post: contentPosts
    })
    .from(metricsSnapshots)
    .innerJoin(contentPosts, eq(metricsSnapshots.postId, contentPosts.id))
    .where(eq(contentPosts.userId, userId))
    .orderBy(desc(metricsSnapshots.recordedAt))
    .limit(50);
    
    // Aggregate data for overall stats
    const totalEngagement = results.reduce((acc, curr) => acc + parseFloat(curr.snapshot.engagement), 0);
    const totalLikes = results.reduce((acc, curr) => acc + curr.snapshot.likes, 0);
    const totalViews = results.reduce((acc, curr) => acc + curr.snapshot.views, 0);
    
    res.json({
      history: results,
      stats: {
        avgEngagement: results.length ? (totalEngagement / results.length).toFixed(2) : 0,
        totalLikes,
        totalViews,
      }
    });
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Registrar métricas manuales de una publicación del usuario.
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { postId } = req.body;

  if (!postId) return res.status(400).json({ error: 'Falta el postId.' });

  try {
    const [post] = await db
      .select()
      .from(contentPosts)
      .where(and(eq(contentPosts.id, postId), eq(contentPosts.userId, userId)))
      .limit(1);

    if (!post) return res.status(404).json({ error: 'Publicación no encontrada.' });

    const likes = Math.max(0, Math.round(Number(req.body.likes) || 0));
    const comments = Math.max(0, Math.round(Number(req.body.comments) || 0));
    const shares = Math.max(0, Math.round(Number(req.body.shares) || 0));
    const views = Math.max(0, Math.round(Number(req.body.views) || 0));
    const engagement = views > 0 ? (((likes + comments + shares) / views) * 100).toFixed(2) : '0.00';

    const [snapshot] = await db
      .insert(metricsSnapshots)
      .values({ postId, likes, comments, shares, views, engagement })
      .returning();

    res.json(snapshot);
  } catch (error) {
    console.error('Record metrics error:', error);
    res.status(500).json({ error: 'No se pudieron registrar las métricas' });
  }
});

// Sincroniza métricas REALES desde la YouTube Data API (usa la URL del post).
router.post('/youtube-sync', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { postId } = req.body;
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: 'Falta YOUTUBE_API_KEY en el .env.' });
  }
  if (!postId) return res.status(400).json({ error: 'Falta el postId.' });

  try {
    const [post] = await db
      .select()
      .from(contentPosts)
      .where(and(eq(contentPosts.id, postId), eq(contentPosts.userId, userId)))
      .limit(1);

    if (!post) return res.status(404).json({ error: 'Publicación no encontrada.' });

    const videoId = youtubeId(post.postUrl);
    if (!videoId) {
      return res.status(400).json({ error: 'La URL del post no es un video de YouTube válido.' });
    }

    const { data } = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: { part: 'statistics', id: videoId, key: apiKey },
    });
    const stats = data?.items?.[0]?.statistics;
    if (!stats) {
      return res.status(404).json({ error: 'YouTube no devolvió datos para ese video.' });
    }

    const likes = Math.max(0, Number(stats.likeCount) || 0);
    const comments = Math.max(0, Number(stats.commentCount) || 0);
    const views = Math.max(0, Number(stats.viewCount) || 0);
    const shares = 0; // YouTube API no expone "compartidos"

    const [snapshot] = await db
      .insert(metricsSnapshots)
      .values({ postId, likes, comments, shares, views, engagement: eng(likes, comments, shares, views) })
      .returning();

    res.json(snapshot);
  } catch (error: any) {
    console.error('YouTube sync error:', error?.response?.data || error?.message);
    res.status(500).json({ error: 'No se pudo sincronizar con YouTube. Revisa la API key y la URL.' });
  }
});

// Importa métricas en lote (export oficial Meta/TikTok adaptado a CSV).
router.post('/import', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];

  if (rows.length === 0) return res.status(400).json({ error: 'No hay filas para importar.' });

  let imported = 0;
  let skipped = 0;

  try {
    for (const r of rows) {
      const conditions = [eq(contentPosts.userId, userId)];
      if (r.postId) conditions.push(eq(contentPosts.id, String(r.postId)));
      else if (r.postUrl) conditions.push(eq(contentPosts.postUrl, String(r.postUrl)));
      else {
        skipped++;
        continue;
      }

      const [post] = await db
        .select()
        .from(contentPosts)
        .where(and(...conditions))
        .limit(1);

      if (!post) {
        skipped++;
        continue;
      }

      const likes = Math.max(0, Math.round(Number(r.likes) || 0));
      const comments = Math.max(0, Math.round(Number(r.comments) || 0));
      const shares = Math.max(0, Math.round(Number(r.shares) || 0));
      const views = Math.max(0, Math.round(Number(r.views) || 0));

      await db.insert(metricsSnapshots).values({
        postId: post.id,
        likes,
        comments,
        shares,
        views,
        engagement: eng(likes, comments, shares, views),
      });
      imported++;
    }

    res.json({ imported, skipped });
  } catch (error) {
    console.error('Import metrics error:', error);
    res.status(500).json({ error: 'Falló la importación.' });
  }
});

export default router;
