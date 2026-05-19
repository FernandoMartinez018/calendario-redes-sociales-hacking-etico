/**
 * Sube imágenes a Cloudinary (cuenta del .env), las registra en media_assets
 * para Fernando Motos y actualiza sus publicaciones para usar esas imágenes.
 *   npx tsx upload-images.ts
 */
import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { db } from '../src/db/index.ts';
import { users, contentPosts, mediaAssets } from '../src/db/schema.ts';
import { eq, and, inArray } from 'drizzle-orm';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Fuentes (motos). Si alguna falla, se usa un fallback que siempre responde.
const SOURCES = [
  'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1200',
  'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200',
  'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=1200',
  'https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=1200',
  'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200',
  'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1200',
];

async function uploadOne(src: string, i: number): Promise<{ url: string; bytes: number } | null> {
  for (const url of [src, `https://picsum.photos/seed/moto${i}/1200/900`]) {
    try {
      const r = await cloudinary.uploader.upload(url, {
        folder: 'motosocial',
        resource_type: 'image',
      });
      return { url: r.secure_url, bytes: r.bytes };
    } catch (e: any) {
      console.warn(`  ⚠️  Falló ${url.slice(0, 50)}... (${e?.error?.message || e?.message})`);
    }
  }
  return null;
}

async function main() {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, 'fercho.2003.lol@gmail.com'))
    .limit(1);
  if (!user) {
    console.error('❌ No se encontró Fernando Motos.');
    process.exit(1);
  }
  console.log(`👤 ${user.name} — ${user.dealerName}`);

  if (!process.env.CLOUDINARY_API_KEY) {
    console.error('❌ Falta CLOUDINARY_API_KEY en .env');
    process.exit(1);
  }

  const uploaded: { url: string; bytes: number }[] = [];
  for (let i = 0; i < SOURCES.length; i++) {
    console.log(`⬆️  Subiendo imagen ${i + 1}/${SOURCES.length}...`);
    const r = await uploadOne(SOURCES[i], i);
    if (r) uploaded.push(r);
  }
  if (uploaded.length === 0) {
    console.error('❌ No se subió ninguna imagen.');
    process.exit(1);
  }
  console.log(`✅ ${uploaded.length} imágenes en Cloudinary (carpeta motosocial)`);

  // Registrar en la galería (media_assets)
  await db.insert(mediaAssets).values(
    uploaded.map((u) => ({
      url: u.url,
      type: 'IMAGE',
      size: u.bytes,
      userId: user.id,
    }))
  );
  console.log(`✅ ${uploaded.length} assets registrados en la galería del usuario`);

  // Asignar imágenes a las publicaciones publicadas/programadas del usuario
  const posts = await db
    .select({ id: contentPosts.id, status: contentPosts.status })
    .from(contentPosts)
    .where(
      and(
        eq(contentPosts.userId, user.id),
        inArray(contentPosts.status, ['PUBLISHED', 'SCHEDULED'])
      )
    );

  let updated = 0;
  for (const p of posts) {
    const url = uploaded[Math.floor(Math.random() * uploaded.length)].url;
    await db.update(contentPosts).set({ mediaUrl: url }).where(eq(contentPosts.id, p.id));
    updated++;
  }
  console.log(`✅ ${updated} publicaciones ahora usan imágenes de Cloudinary`);
  console.log('✨ Listo. Revisa Multimedia, Publicaciones y el Calendario.');
  process.exit(0);
}

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
