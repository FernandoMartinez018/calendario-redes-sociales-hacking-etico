import { Router } from 'express';
import { db } from '../../db/index.js';
import { metricsSnapshots, contentPosts } from '../../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();

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

export default router;
