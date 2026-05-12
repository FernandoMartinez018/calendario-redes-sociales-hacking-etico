import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

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

export default router;
