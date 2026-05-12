import { Router } from 'express';
import { db } from '../../db/index.js';
import { metricsSnapshots, contentPosts } from '../../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const router = Router();

router.get('/summary', async (req, res) => {
  const { userId } = req.query;
  try {
    // Drizzle joins are explicit
    const results = await db.select({
      snapshot: metricsSnapshots,
      post: contentPosts
    })
    .from(metricsSnapshots)
    .innerJoin(contentPosts, eq(metricsSnapshots.postId, contentPosts.id))
    .where(eq(contentPosts.userId, userId as string))
    .orderBy(desc(metricsSnapshots.recordedAt))
    .limit(30);
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

export default router;
