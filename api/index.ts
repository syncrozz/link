import { createApp } from '../server/app.ts';
import type { Request, Response } from 'express';

const app = createApp();

export default function handler(req: Request, res: Response) {
  return app(req, res);
}
