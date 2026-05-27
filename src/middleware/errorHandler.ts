import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { GreenApiTransportError } from '../greenApi/client.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: 'Validation failed',
        details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      },
    });
    return;
  }

  if (err instanceof GreenApiTransportError) {
    res.status(502).json({ error: { message: err.message } });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: { message: 'Internal server error' } });
}
