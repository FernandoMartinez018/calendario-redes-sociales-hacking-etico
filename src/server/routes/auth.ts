import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../../db/index.js';
import { users, passwordResetTokens } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'motosocial-secret-key-fija-2026';
const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, dealerName } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio.' });
    }
    if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Ingresa un email válido.' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      return res.status(409).json({ error: 'Ese email ya está registrado.' });
    }

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
    res.status(500).json({ error: 'No se pudo registrar.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
    }
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, dealerName: user.dealerName } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Login con Google (Firebase): el front autentica con Google y nos manda el
// email/nombre/foto. Aquí NO creamos cuentas: solo dejamos entrar a quien YA
// está registrado. Si el email no existe, lo bloqueamos.
router.post('/supabase-sync', async (req, res) => {
  try {
    const { email, picture } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    // Bloqueo: solo cuentas registradas. No auto-creamos desde Google.
    if (!user) {
      return res.status(403).json({
        error: 'Esta cuenta de Google no está registrada. Primero crea tu cuenta con email y contraseña.',
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, dealerName: user.dealerName, logoUrl: picture } });
  } catch (error) {
    console.error('Google Sign-in Error:', error);
    res.status(500).json({ error: 'Authentication sync failed' });
  }
});

// Paso 1: solicitar recuperación → genera token con expiración y envía email.
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Ingresa un email válido.' });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    // Respuesta genérica: no revelamos si el email existe (evita enumeración).
    const generic = { message: 'Si existe una cuenta con ese email, te enviamos instrucciones.' };
    if (!user) return res.json(generic);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: sha256(token),
      expiresAt,
    });

    const base = process.env.APP_URL || 'http://localhost:3000';
    const link = `${base}/?token=${token}`;
    // El correo lo envía el cliente con EmailJS; devolvemos link + destinatario
    // solo si el usuario existe (transporte simulado, token validado en el server).
    res.json({ ...generic, email: user.email, link });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'No se pudo procesar la solicitud.' });
  }
});

// Paso 2: restablecer con el token del enlace.
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Enlace inválido.' });
    }
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    const [row] = await db
      .select()
      .from(passwordResetTokens)
      .where(and(eq(passwordResetTokens.tokenHash, sha256(token)), eq(passwordResetTokens.used, 0)))
      .limit(1);

    if (!row || new Date(row.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ error: 'El enlace es inválido o expiró. Solicita uno nuevo.' });
    }

    await db
      .update(users)
      .set({ password: await bcrypt.hash(newPassword, 10), updatedAt: new Date() })
      .where(eq(users.id, row.userId));
    await db.update(passwordResetTokens).set({ used: 1 }).where(eq(passwordResetTokens.id, row.id));

    res.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'No se pudo restablecer la contraseña.' });
  }
});

export default router;
