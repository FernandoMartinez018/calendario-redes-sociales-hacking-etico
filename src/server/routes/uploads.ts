import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';
import { db } from '../../db/index.js';
import { mediaAssets } from '../../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import os from 'os';

const router = Router();
const upload = multer({ dest: os.tmpdir() });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post('/', authMiddleware, upload.single('file'), async (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary not configured. Please set Cloudinary variables in Settings.');
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'motosocial',
      resource_type: 'auto'
    });

    const [mediaAsset] = await db.insert(mediaAssets).values({
      url: result.secure_url,
      type: result.resource_type === 'video' ? 'VIDEO' : 'IMAGE',
      size: result.bytes,
      userId: req.user!.userId
    }).returning();

    res.json(mediaAsset);
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const assets = await db.select().from(mediaAssets)
      .where(eq(mediaAssets.userId, userId))
      .orderBy(desc(mediaAssets.createdAt));
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch media assets' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const assetId = req.params.id;
    
    // We should ideally also delete from Cloudinary, but for now we'll just remove from DB
    // to keep it simple unless public_id is stored.
    await db.delete(mediaAssets)
      .where(and(eq(mediaAssets.id, assetId), eq(mediaAssets.userId, userId)));
      
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

export default router;
