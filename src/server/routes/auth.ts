import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'motosocial-secret-key-fija-2026';

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, dealerName } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [user] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      dealerName,
    }).returning();

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, dealerName: user.dealerName } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, dealerName: user.dealerName } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/supabase-sync', async (req, res) => {
  try {
    const { email, name, picture } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Check if user exists
    let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (!user) {
      // Create user if doesn't exist
      [user] = await db.insert(users).values({
        email,
        name: name || 'User',
        password: await bcrypt.hash(Math.random().toString(36), 10),
        dealerName: 'Nuevo Concesionario',
      }).returning();
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, dealerName: user.dealerName, logoUrl: picture } });
  } catch (error) {
    console.error('Supabase Sync Error:', error);
    res.status(500).json({ error: 'Authentication sync failed' });
  }
});

export default router;
