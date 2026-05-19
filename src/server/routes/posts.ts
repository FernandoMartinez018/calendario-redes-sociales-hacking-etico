import { Router } from 'express';
import { db } from '../../db/index.js';
import { contentPosts } from '../../db/schema.js';
import { eq, and, gte, lte, ne, SQL } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();

const isValidDate = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(new Date(value).getTime());

// El front manda fechas como string (JSON); Drizzle (timestamp) espera Date.
const toDate = (v: unknown): Date | null => {
  if (!v) return null;
  const d = new Date(v as any);
  return Number.isNaN(d.getTime()) ? null : d;
};

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const { start, end } = req.query;
  const userId = req.user!.userId;

  try {
    // start/end son opcionales: sin ellos devolvemos todos los posts del usuario.
    const conditions: SQL[] = [eq(contentPosts.userId, userId)];

    if (isValidDate(start)) {
      conditions.push(gte(contentPosts.scheduledAt, new Date(start)));
    }
    if (isValidDate(end)) {
      conditions.push(lte(contentPosts.scheduledAt, new Date(end)));
    }

    const results = await db.select().from(contentPosts).where(and(...conditions));
    res.json(results);
  } catch (error) {
    console.error('Fetch posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const postData: any = {
      ...req.body,
      userId, // forzamos el userId del token
      scheduledAt: toDate(req.body.scheduledAt),
      publishedAt: toDate(req.body.publishedAt),
    };

    const [newPost] = await db.insert(contentPosts).values(postData).returning();
    res.json(newPost);
  } catch (error: any) {
    console.error('Create post error:', error);
    res.status(500).json({ error: error.message || 'Failed to create post' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const updateData: any = { ...req.body };
    if ('scheduledAt' in updateData) updateData.scheduledAt = toDate(updateData.scheduledAt);
    if ('publishedAt' in updateData) updateData.publishedAt = toDate(updateData.publishedAt);

    const [updatedPost] = await db.update(contentPosts)
      .set(updateData)
      .where(eq(contentPosts.id, req.params.id))
      .returning();
    res.json(updatedPost);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Eliminar una publicación del usuario, solo si NO está publicada.
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const deleted = await db
      .delete(contentPosts)
      .where(
        and(
          eq(contentPosts.id, req.params.id),
          eq(contentPosts.userId, userId),
          ne(contentPosts.status, 'PUBLISHED')
        )
      )
      .returning({ id: contentPosts.id });

    if (deleted.length === 0) {
      return res
        .status(400)
        .json({ error: 'No se pudo eliminar: no existe, no es tuya o ya está publicada.' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'No se pudo eliminar la publicación' });
  }
});

export default router;
