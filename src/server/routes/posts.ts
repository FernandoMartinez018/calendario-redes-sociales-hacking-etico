import { Router } from 'express';
import { db } from '../../db/index.js';
import { contentPosts } from '../../db/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';

const router = Router();

router.get('/', async (req, res) => {
  const { userId, start, end } = req.query;
  try {
    const results = await db.select().from(contentPosts).where(
      and(
        eq(contentPosts.userId, userId as string),
        gte(contentPosts.scheduledAt, new Date(start as string)),
        lte(contentPosts.scheduledAt, new Date(end as string))
      )
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.post('/', async (req, res) => {
  try {
    const [newPost] = await db.insert(contentPosts).values(req.body).returning();
    res.json(newPost);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
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
