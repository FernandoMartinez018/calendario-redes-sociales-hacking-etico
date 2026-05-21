import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as dotenv from 'dotenv';

// Load env before anything else
dotenv.config();

import authRoutes from './src/server/routes/auth.js';
import postRoutes from './src/server/routes/posts.js';
import aiRoutes from './src/server/routes/ai.js';
import metricRoutes from './src/server/routes/metrics.js';
import campaignRoutes from './src/server/routes/campaigns.js';
import uploadRoutes from './src/server/routes/uploads.js';
import settingsRoutes from './src/server/routes/settings.js';
import storeProfileRoutes from './src/server/routes/storeProfile.js';
import { errorHandler } from './src/server/middlewares/errorHandler.js';
import { initScheduler } from './src/server/scheduler.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security Middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Vite handles this in dev
    frameguard: false, // permite embeber la app en un <iframe> (quita X-Frame-Options)
    // El popup de Google (signInWithPopup) necesita comunicarse con la app que lo
    // abrió. El COOP por defecto de helmet ('same-origin') lo bloquea y el popup
    // se cierra solo sin mensaje. 'same-origin-allow-popups' lo permite.
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  }));
  app.use(cors());
  app.use(express.json());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000 // amplio para desarrollo/uso normal
  });
  app.use('/api/', limiter);

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/metrics', metricRoutes);
  app.use('/api/campaigns', campaignRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/store-profile', storeProfileRoutes);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", version: "1.0.0", timestamp: new Date() });
  });

  // Global Error Handler
  app.use(errorHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 MotoSocial Monolith running on http://localhost:${PORT}`);
    initScheduler();
  });
}

startServer();
