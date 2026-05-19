import { Router } from 'express';
import { db } from '../../db/index.js';
import { users, socialAccounts } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();

// Get profile
router.get('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const [user] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      dealerName: users.dealerName,
    }).from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile
router.post('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { name, dealerName } = req.body;
    
    const [updatedUser] = await db.update(users)
      .set({ name, dealerName, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        dealerName: users.dealerName,
      });
      
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Social Accounts management
router.get('/social-accounts', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const accounts = await db.select({
      id: socialAccounts.id,
      platform: socialAccounts.platform,
      handle: socialAccounts.handle,
      createdAt: socialAccounts.createdAt,
    }).from(socialAccounts).where(eq(socialAccounts.userId, userId));
    
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch social accounts' });
  }
});

router.post('/social-accounts', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { platform, handle, accessToken } = req.body;
    
    const [newAccount] = await db.insert(socialAccounts).values({
      platform,
      handle,
      accessToken,
      userId,
    }).returning();
    
    res.json(newAccount);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to link account' });
  }
});

router.delete('/social-accounts/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const accountId = req.params.id;
    
    await db.delete(socialAccounts)
      .where(and(eq(socialAccounts.id, accountId), eq(socialAccounts.userId, userId)));
      
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
});

export default router;
