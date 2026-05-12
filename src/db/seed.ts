import { db } from './index.js';
import { 
  users, 
  socialAccounts, 
  contentPosts, 
  campaigns, 
  metricsSnapshots, 
  mediaAssets, 
  promptTemplates 
} from './schema.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Iniciando el semillado de la base de datos...');

  // 1. Limpiar tablas (Opcional, ten cuidado en producción)
  // await db.delete(metricsSnapshots);
  // await db.delete(contentPosts);
  // ...

  // 2. Crear un usuario de prueba
  const hashedPassword = await bcrypt.hash('password123', 10);
  const [user] = await db.insert(users).values({
    name: 'Fernando Motos',
    email: 'fercho.2003.lol@gmail.com',
    password: hashedPassword,
    dealerName: 'Yamaha Central MX',
    role: 'ADMIN',
  }).returning();

  console.log(`✅ Usuario creado: ${user.email}`);

  // 3. Crear cuentas sociales
  const [insta] = await db.insert(socialAccounts).values({
    platform: 'INSTAGRAM',
    handle: '@yamaha_central_mx',
    accessToken: 'mock_token_123',
    userId: user.id,
  }).returning();

  const [tiktok] = await db.insert(socialAccounts).values({
    platform: 'TIKTOK',
    handle: '@yamaha_rides',
    accessToken: 'mock_token_456',
    userId: user.id,
  }).returning();

  console.log('✅ Cuentas sociales vinculadas');

  // 4. Crear Campañas
  const [campaign] = await db.insert(campaigns).values({
    name: 'Lanzamiento MT-09 2024',
    platform: 'INSTAGRAM',
    budget: '5000.00',
    userId: user.id,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }).returning();

  console.log('✅ Campaña de marketing creada');

  // 5. Crear Publicaciones
  const postsData = [
    {
      type: 'REEL',
      copy: 'La adrenalina pura de la nueva MT-09. #Yamaha #DarkSideOfJapan',
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      userId: user.id,
      socialAccountId: insta.id,
      campaignId: campaign.id,
    },
    {
      type: 'POST',
      copy: '¿Listos para la rodada del domingo? 🏍️',
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      userId: user.id,
      socialAccountId: insta.id,
    },
    {
      type: 'POST',
      copy: 'Review rápida de la TMAX 560.',
      status: 'DRAFT',
      userId: user.id,
      socialAccountId: tiktok.id,
    }
  ];

  const createdPosts = await db.insert(contentPosts).values(postsData as any).returning();
  console.log(`✅ ${createdPosts.length} publicaciones creadas`);

  // 6. Crear Métricas para el primer post
  await db.insert(metricsSnapshots).values([
    {
      postId: createdPosts[0].id,
      likes: 1250,
      comments: 45,
      shares: 89,
      views: 15400,
      engagement: '4.2',
    },
    {
      postId: createdPosts[0].id,
      likes: 1400,
      comments: 52,
      shares: 95,
      views: 18000,
      engagement: '4.5',
      recordedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    }
  ]);

  // 7. Crear Assets
  await db.insert(mediaAssets).values({
    url: 'https://images.unsplash.com/photo-1558981403-c5f91cbba527',
    type: 'IMAGE',
    size: 1024 * 500,
    userId: user.id,
  });

  // 8. Templates de IA
  await db.insert(promptTemplates).values([
    {
      name: 'Venta Técnica',
      content: 'Genera un post técnico resaltando el torque, ABS y suspensión de la motocicleta: ',
      category: 'Technical',
    },
    {
      name: 'Lifestyle/Aventura',
      content: 'Genera un caption inspirador sobre la libertad de viajar en moto para: ',
      category: 'Adventure',
    }
  ]);

  console.log('✨ Semillado completado con éxito.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error en el semillado:', err);
  process.exit(1);
});
