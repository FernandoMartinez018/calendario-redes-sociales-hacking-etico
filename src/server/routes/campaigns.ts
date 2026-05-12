import { Router } from 'express';
import { db } from '../../db/index';
import { campaigns } from '../../db/schema';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { eq, desc } from 'drizzle-orm';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const results = await db.select().from(campaigns)
      .where(eq(campaigns.userId, req.user?.userId!))
      .orderBy(desc(campaigns.createdAt));
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const [campaign] = await db.insert(campaigns).values({
      ...req.body,
      userId: req.user?.userId
    }).returning();
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

export default router;
