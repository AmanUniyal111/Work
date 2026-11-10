import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOrigin } from './config/env.js';
import { alertRoutes } from './routes/alertRoutes.js';
import { analyticsRoutes } from './routes/analyticsRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { intelligenceRoutes } from './routes/intelligenceRoutes.js';
import { reportRoutes } from './routes/reportRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/intelligence', intelligenceRoutes);
  app.use('/api/alerts', alertRoutes);

  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'), (error) => {
      if (error) next();
    });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
