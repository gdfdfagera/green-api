import express, { type Express } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { AppConfig } from './config.js';
import { GreenApiClient } from './greenApi/client.js';
import { createApiRouter } from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(config: AppConfig): Express {
  const app = express();

  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
    }),
  );

  app.use(express.json({ limit: '256kb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const apiLimiter = rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { message: 'Too many requests, please slow down.' } },
  });

  const client = new GreenApiClient(config.greenApiBaseUrl, config.greenApiTimeoutMs);
  app.use('/api', apiLimiter, createApiRouter(client));

  app.use(express.static(path.join(__dirname, 'public')));

  app.use(errorHandler);

  return app;
}
