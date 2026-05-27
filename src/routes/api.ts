import { Router } from 'express';
import type { GreenApiClient } from '../greenApi/client.js';
import {
  credentialsSchema,
  sendFileByUrlSchema,
  sendMessageSchema,
} from '../validation.js';

function asyncRoute(
  handler: (req: import('express').Request, res: import('express').Response) => Promise<void>,
) {
  return (
    req: import('express').Request,
    res: import('express').Response,
    next: import('express').NextFunction,
  ) => handler(req, res).catch(next);
}

function fileNameFromUrl(urlFile: string): string {
  try {
    const { pathname } = new URL(urlFile);
    const last = pathname.split('/').filter(Boolean).pop();
    return last && last.length > 0 ? decodeURIComponent(last) : 'file';
  } catch {
    return 'file';
  }
}

export function createApiRouter(client: GreenApiClient): Router {
  const router = Router();

  router.post(
    '/getSettings',
    asyncRoute(async (req, res) => {
      const creds = credentialsSchema.parse(req.body);
      const result = await client.getSettings(creds);
      res.status(result.status).json(result.data);
    }),
  );

  router.post(
    '/getStateInstance',
    asyncRoute(async (req, res) => {
      const creds = credentialsSchema.parse(req.body);
      const result = await client.getStateInstance(creds);
      res.status(result.status).json(result.data);
    }),
  );

  router.post(
    '/sendMessage',
    asyncRoute(async (req, res) => {
      const { idInstance, apiTokenInstance, chatId, message } = sendMessageSchema.parse(req.body);
      const result = await client.sendMessage({ idInstance, apiTokenInstance }, { chatId, message });
      res.status(result.status).json(result.data);
    }),
  );

  router.post(
    '/sendFileByUrl',
    asyncRoute(async (req, res) => {
      const { idInstance, apiTokenInstance, chatId, urlFile, fileName } =
        sendFileByUrlSchema.parse(req.body);
      const result = await client.sendFileByUrl(
        { idInstance, apiTokenInstance },
        { chatId, urlFile, fileName: fileName ?? fileNameFromUrl(urlFile) },
      );
      res.status(result.status).json(result.data);
    }),
  );

  return router;
}
