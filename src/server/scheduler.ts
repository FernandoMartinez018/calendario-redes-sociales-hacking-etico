import cron from 'node-cron';
import { db } from '../db/index.js';
import { contentPosts } from '../db/schema.js';
import { and, eq, lte } from 'drizzle-orm';

/**
 * NOTA: la publicación es SIMULADA. Las APIs oficiales de redes (Meta, TikTok,
 * X) requieren aprobación de negocio o planes de pago, fuera del alcance del
 * proyecto. Este cron solo marca en la BD los posts SCHEDULED vencidos como
 * PUBLISHED; NO postea a ninguna red real.
 */
export const initScheduler = () => {
  console.log('📅 Initializing Backend Scheduler (publicación SIMULADA)...');

  // 1. Post Publisher: Every minute
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    try {
      const pendingPosts = await db.select().from(contentPosts).where(
        and(
          eq(contentPosts.status, 'SCHEDULED'),
          lte(contentPosts.scheduledAt, now)
        )
      );

      for (const post of pendingPosts) {
        console.log(`🚀 Publishing post ${post.id} to ${post.type}...`);
        
        try {
          // Simulation logic
          await db.update(contentPosts)
            .set({ status: 'PUBLISHED', publishedAt: new Date() })
            .where(eq(contentPosts.id, post.id));
        } catch (err) {
          await db.update(contentPosts)
            .set({ status: 'FAILED' })
            .where(eq(contentPosts.id, post.id));
        }
      }
    } catch (err) {
      console.error('Scheduler Error:', err);
    }
  });

  cron.schedule('0 * * * *', async () => {
    console.log('📊 Syncing social metrics...');
  });

  cron.schedule('0 0 * * *', async () => {
    console.log('🧹 Cleaning up temporary files...');
  });
};
