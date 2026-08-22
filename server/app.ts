import express, { Request, Response, NextFunction, Router } from 'express';
import { storage } from './storage.ts';

export function createApp() {
  const app = express();

  // JSON & URL-encoded parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS / API header configuration
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Powered-By', 'SYNCROZZ-Link-v1.0');
    next();
  });

  const apiRouter = Router();

  apiRouter.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      product: 'SYNCROZZ Link v1.0',
      database: 'Firebase Cloud Firestore',
      timestamp: new Date().toISOString(),
    });
  });

  // Get all links directly from Firestore
  apiRouter.get('/links', async (req: Request, res: Response) => {
    try {
      const search = (req.query.search as string || '').trim();
      const links = await storage.getAllLinks(search);
      const settings = await storage.getSettings();

      res.json({
        success: true,
        count: links.length,
        links,
        settings: {
          displayDomain: settings.displayDomain,
        },
      });
    } catch (err: any) {
      console.error('API /links error:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  });

  // Create link in Firestore with uniqueness guarantee
  apiRouter.post('/links', async (req: Request, res: Response) => {
    try {
      const { alias, destinationUrl, status, notes, label } = req.body;
      const result = await storage.createLink({
        alias,
        destinationUrl,
        status,
        notes: notes || label,
        label: label || notes,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (err: any) {
      console.error('API POST /links error:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  });

  // Get single link from Firestore
  apiRouter.get('/links/:alias', async (req: Request, res: Response) => {
    try {
      const alias = req.params.alias;
      const link = await storage.getByAlias(alias);

      if (!link) {
        return res.status(404).json({ success: false, error: 'Link tidak ditemui.' });
      }

      res.json({ success: true, link });
    } catch (err: any) {
      console.error(`API GET /links/${req.params.alias} error:`, err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  });

  // Update link in Firestore
  apiRouter.put('/links/:alias', async (req: Request, res: Response) => {
    try {
      const currentAlias = req.params.alias;
      const { newAlias, destinationUrl, status, notes, label } = req.body;

      const result = await storage.updateLink(currentAlias, {
        newAlias,
        destinationUrl,
        status,
        notes: notes || label,
        label: label || notes,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (err: any) {
      console.error(`API PUT /links/${req.params.alias} error:`, err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  });

  // Delete link from Firestore (Deleted = Deleted)
  apiRouter.delete('/links/:alias', async (req: Request, res: Response) => {
    try {
      const alias = req.params.alias;
      const result = await storage.deleteLink(alias);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({ success: true, message: 'Link berjaya dipadam.' });
    } catch (err: any) {
      console.error(`API DELETE /links/${req.params.alias} error:`, err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  });

  // Track click & get destination from Firestore
  apiRouter.post('/links/click/:alias', async (req: Request, res: Response) => {
    try {
      const alias = req.params.alias;
      const link = await storage.getByAlias(alias);

      if (!link) {
        return res.status(404).json({ success: false, error: 'Link tidak ditemui.' });
      }

      if (link.status === 'inactive') {
        return res.status(403).json({ success: false, error: 'Link ini tidak aktif.', link });
      }

      const result = await storage.incrementClick(alias);
      res.json({
        success: true,
        destinationUrl: link.destinationUrl,
        clickCount: result.link?.clickCount ?? (link.clickCount + 1),
      });
    } catch (err: any) {
      console.error(`API POST /links/click/${req.params.alias} error:`, err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  });

  // Auth: Verify Admin PIN
  apiRouter.post('/auth/verify-pin', async (req: Request, res: Response) => {
    try {
      const { pin } = req.body;
      if (!pin) {
        return res.status(400).json({ success: false, error: 'Sila masukkan PIN.' });
      }

      const isValid = await storage.verifyPin(pin);
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'PIN admin tidak tepat.' });
      }

      res.json({ success: true, message: 'Admin access disahkan.' });
    } catch (err: any) {
      console.error('API /auth/verify-pin error:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  });

  // Auth: Change Admin PIN
  apiRouter.post('/auth/change-pin', async (req: Request, res: Response) => {
    try {
      const { oldPin, newPin } = req.body;
      const result = await storage.changePin(oldPin, newPin);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({ success: true, message: 'Admin PIN berjaya ditukar.' });
    } catch (err: any) {
      console.error('API /auth/change-pin error:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  });

  // Settings
  apiRouter.get('/settings', async (req: Request, res: Response) => {
    try {
      const settings = await storage.getSettings();
      res.json({
        success: true,
        settings: {
          displayDomain: settings.displayDomain,
          redirectMode: settings.redirectMode,
        },
      });
    } catch (err: any) {
      console.error('API GET /settings error:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  });

  apiRouter.post('/settings', async (req: Request, res: Response) => {
    try {
      const { displayDomain, redirectMode, adminPin } = req.body;
      const updates: any = {};
      if (displayDomain !== undefined) updates.displayDomain = displayDomain.trim();
      if (redirectMode !== undefined) updates.redirectMode = redirectMode;
      if (adminPin !== undefined && adminPin.trim().length >= 4) updates.adminPin = adminPin.trim();

      const updated = await storage.updateSettings(updates);
      res.json({
        success: true,
        settings: {
          displayDomain: updated.displayDomain,
          redirectMode: updated.redirectMode,
        },
      });
    } catch (err: any) {
      console.error('API POST /settings error:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  });

  // Handler for short link redirects
  const handleRedirect = async (req: Request, res: Response) => {
    const alias = req.params.alias;
    const link = await storage.getByAlias(alias);

    if (!link) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="ms">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Link Tidak Ditemui | SYNCROZZ Link</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0A0A0B; color: #F4F4F5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #18181B; border: 1px solid #27272A; border-radius: 16px; padding: 36px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); }
            .badge { display: inline-block; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
            h1 { font-size: 22px; margin: 0 0 8px 0; color: #fff; }
            p { color: #A1A1AA; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0; }
            .alias-box { background: #101012; border: 1px dashed #3F3F46; padding: 10px; border-radius: 10px; font-family: monospace; color: #34D399; margin-bottom: 24px; font-size: 15px; font-weight: bold; }
            a.btn { display: inline-block; background: #10B981; color: #09090B; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; transition: opacity 0.2s; }
            a.btn:hover { opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="card">
            <img src="https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/logo/Link/android-chrome-192x192.png" alt="SYNCROZZ Link" style="width: 44px; height: 44px; border-radius: 12px; margin: 0 auto 16px auto; display: block;" />
            <span class="badge">404 Not Found</span>
            <h1>Link Tidak Ditemui</h1>
            <p>Pautan pendek yang anda cari tidak wujud atau telah dipadam.</p>
            <div class="alias-box">/${alias}</div>
            <a href="/" class="btn">Kembali ke SYNCROZZ Link</a>
          </div>
        </body>
        </html>
      `);
    }

    if (link.status === 'inactive') {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html lang="ms">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Link Tidak Aktif | SYNCROZZ Link</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0A0A0B; color: #F4F4F5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #18181B; border: 1px solid #27272A; border-radius: 16px; padding: 36px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); }
            .badge { display: inline-block; background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
            h1 { font-size: 22px; margin: 0 0 8px 0; color: #fff; }
            p { color: #A1A1AA; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0; }
            .alias-box { background: #101012; border: 1px dashed #3F3F46; padding: 10px; border-radius: 10px; font-family: monospace; color: #FBBF24; margin-bottom: 24px; font-size: 15px; font-weight: bold; }
            a.btn { display: inline-block; background: #27272A; color: #F4F4F5; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px; border: 1px solid #3F3F46; }
            a.btn:hover { background: #3F3F46; }
          </style>
        </head>
        <body>
          <div class="card">
            <img src="https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/logo/Link/android-chrome-192x192.png" alt="SYNCROZZ Link" style="width: 44px; height: 44px; border-radius: 12px; margin: 0 auto 16px auto; display: block;" />
            <span class="badge">Status: Inactive</span>
            <h1>Link Ini Tidak Aktif</h1>
            <p>Pautan pendek ini telah dinyahaktifkan oleh pentadbir sistem.</p>
            <div class="alias-box">/${alias}</div>
            <a href="/" class="btn">Kembali ke Halaman Utama</a>
          </div>
        </body>
        </html>
      `);
    }

    // Increment click count in Firestore
    await storage.incrementClick(alias);

    // If query ?preview=1, show interstitial, otherwise 302 direct redirect
    if (req.query.preview === '1') {
      return res.send(`
        <!DOCTYPE html>
        <html lang="ms">
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="refresh" content="2;url=${link.destinationUrl}">
          <title>Mengarahkan... | SYNCROZZ Link</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0A0A0B; color: #F4F4F5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #18181B; border: 1px solid #27272A; border-radius: 16px; padding: 36px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); }
            .spinner { width: 38px; height: 38px; border: 3px solid rgba(16, 185, 129, 0.2); border-top-color: #10B981; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 20px auto; }
            @keyframes spin { to { transform: rotate(360deg); } }
            h1 { font-size: 20px; margin: 0 0 8px 0; color: #fff; }
            p { color: #A1A1AA; font-size: 14px; margin: 0 0 20px 0; word-break: break-all; font-family: monospace; }
            a.btn { display: inline-block; background: #10B981; color: #09090B; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="card">
            <img src="https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/logo/Link/android-chrome-192x192.png" alt="SYNCROZZ Link" style="width: 44px; height: 44px; border-radius: 12px; margin: 0 auto 16px auto; display: block;" />
            <div class="spinner"></div>
            <h1>Mengarahkan anda ke destinasi...</h1>
            <p>${link.destinationUrl}</p>
            <a href="${link.destinationUrl}" class="btn">Buka Segera</a>
          </div>
        </body>
        </html>
      `);
    }

    return res.redirect(302, link.destinationUrl);
  };

  // Mount API router under /api AND root (for serverless environments)
  app.use('/api', apiRouter);
  app.use('/', apiRouter);

  // Short link redirect routes
  app.get('/r/:alias', handleRedirect);

  return app;
}

export default createApp();
