import { createApp } from './server/app.ts';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import express, { Request, Response } from 'express';

async function startServer() {
  const app = createApp();
  const PORT = 3000;

  // ==========================================
  // VITE MIDDLEWARE (Dev) / STATIC (Prod)
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`SYNCROZZ Link running at http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is in use, retrying...`);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer();
