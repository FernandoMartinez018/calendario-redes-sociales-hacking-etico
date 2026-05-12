import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authMiddleware, AuthRequest } from '../middlewares/auth.ts';
import { db } from '../../db/index.ts';
import { mediaAssets } from '../../db/schema.ts';

const router = Router();
const upload = multer({ dest: 'uploads/' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post('/', authMiddleware, upload.single('file'), async (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Upload to Cloudinary failed' });
  }
});

export default router;
