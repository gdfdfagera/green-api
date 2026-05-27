import express, { type Express } from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { AppConfig } from './config.js';
import { GreenApiClient } from './greenApi/client.js';
import { createApiRouter } from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(config: AppConfig): Express {
  const app = express();

  app.use(express.json({ limit: '256kb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const client = new GreenApiClient(config.greenApiBaseUrl, config.greenApiTimeoutMs);
  app.use('/api', createApiRouter(client));

  app.use(express.static(path.join(__dirname, 'public')));

  app.use(errorHandler);

  return app;
}
