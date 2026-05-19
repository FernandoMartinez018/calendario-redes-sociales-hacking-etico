import { Router } from 'express';
import { db } from '../../db/index.js';
import { contentPosts } from '../../db/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middlewares/auth.ts';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const { start, end } = req.query;
  const userId = req.user!.userId;
  
  try {
    const results = await db.select().from(contentPosts).where(
      and(
        eq(contentPosts.userId, userId),
        gte(contentPosts.scheduledAt, new Date(start as string)),
        lte(contentPosts.scheduledAt, new Date(end as string))
      )
    );
    res.json(results);
  } catch (error) {
    console.error('Fetch posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const postData = {
      ...req.body,
      userId: userId, // Force the userId from the token
    };
    
    console.log('Creating post with data:', postData);
    
    const [newPost] = await db.insert(contentPosts).values(postData).returning();
    res.json(newPost);
  } catch (error: any) {
    console.error('Create post error:', error);
    res.status(500).json({ error: error.message || 'Failed to create post' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const [updatedPost] = await db.update(contentPosts)
      .set(req.body)
      .where(eq(contentPosts.id, req.params.id))
      .returning();
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

export default router;
