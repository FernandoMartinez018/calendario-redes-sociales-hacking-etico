import cron from 'node-cron';

/**
 * NOTA: MotoSocial NO publica a redes ni marca posts como publicados solo.
 * La publicación es MANUAL: el usuario publica el contenido en la red y luego,
 * desde la app, lo marca como "Publicada" (pegando su URL). Este scheduler queda
 * para tareas periódicas auxiliares (sincronización/limpieza); no toca estados.
 */
export const initScheduler = () => {
  console.log('📅 Initializing Backend Scheduler (publicación manual)...');

  // Sincronización de métricas (placeholder para futuras integraciones).
  cron.schedule('0 * * * *', async () => {
    console.log('📊 Syncing social metrics...');
  });

  // Limpieza diaria (placeholder).
  cron.schedule('0 0 * * *', async () => {
    console.log('🧹 Cleaning up temporary files...');
  });
};
