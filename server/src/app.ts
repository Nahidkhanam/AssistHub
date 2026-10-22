import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import type { Pool } from './db.js';
import { errorHandler, notFound } from './lib/errors.js';
import { adminRoutes } from './routes/admin.js';
import { authRoutes } from './routes/auth.js';
import { meRoutes } from './routes/me.js';
import { publicRoutes } from './routes/public.js';
import { toolRoutes } from './routes/tools.js';

export function createApp(pool: Pool, opts: { rateLimits?: boolean } = {}) {
  const limits = opts.rateLimits ?? true;
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.clientOrigins, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
  app.use(express.json({ limit: '20kb' }));
  if (limits) app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false }));

  const authLimit = limits ? rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts. Please wait and try again.' } }) : (_q: unknown, _s: unknown, n: () => void) => n();
  app.use('/api/auth', authLimit, authRoutes(pool));
  app.use('/api/tools', toolRoutes(pool));
  app.use('/api/me', meRoutes(pool));
  app.use('/api/admin', adminRoutes(pool));
  app.use('/api', publicRoutes(pool, limits));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
