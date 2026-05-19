import { Router } from 'express';
import { db } from '../../db/index.js';
import { storeProfiles } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();

// Devuelve el perfil de la tienda del usuario, o null si aún no lo creó.
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const [profile] = await db
      .select()
      .from(storeProfiles)
      .where(eq(storeProfiles.userId, userId))
      .limit(1);

    res.json(profile || null);
  } catch (error) {
    console.error('Fetch store profile error:', error);
    res.status(500).json({ error: 'No se pudo obtener el perfil de la tienda' });
  }
});

// Crea o actualiza el perfil (upsert por userId).
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const {
      brands,
      motoTypes,
      targetAudience,
      city,
      brandTone,
      valueProposition,
      activePromotions,
      season,
    } = req.body;

    const values = {
      brands,
      motoTypes,
      targetAudience,
      city,
      brandTone,
      valueProposition,
      activePromotions,
      season,
    };

    const [profile] = await db
      .insert(storeProfiles)
      .values({ userId, ...values })
      .onConflictDoUpdate({
        target: storeProfiles.userId,
        set: { ...values, updatedAt: new Date() },
      })
      .returning();

    res.json(profile);
  } catch (error: any) {
    console.error('Save store profile error:', error);
    res.status(500).json({ error: error.message || 'No se pudo guardar el perfil de la tienda' });
  }
});

export default router;
