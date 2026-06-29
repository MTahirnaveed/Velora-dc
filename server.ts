import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Database boot functions and seed
import { runDatabaseSeed } from './src/db/seed.ts';
import { UserRepository } from './server/repositories/user.repository.ts';
import { TaskRepository } from './server/repositories/task.repository.ts';
import { SettingsRepository } from './server/repositories/settings.repository.ts';

// Middleware
import { rateLimiterMiddleware } from './server/middleware/rateLimiter.ts';

// Routes
import authRoutes from './server/routes/auth.routes.ts';
import userRoutes from './server/routes/user.routes.ts';
import taskRoutes from './server/routes/task.routes.ts';
import adminRoutes from './server/routes/admin.routes.ts';
import geminiRoutes from './server/routes/gemini.routes.ts';
import telegramRoutes from './server/routes/telegram.routes.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// API Versioning Rewriter (/api/v1/* -> /api/*)
app.use((req, res, next) => {
  if (req.url.startsWith('/api/v1/')) {
    req.url = req.url.replace('/api/v1/', '/api/');
  }
  next();
});

// Use Global Rate Limiter
app.use(rateLimiterMiddleware);

// Public Assets / Metadata Routes
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send("User-agent: *\nDisallow: /api/admin/\nSitemap: https://velora.io/sitemap.xml");
});

app.get('/sitemap.xml', async (req, res) => {
  res.type('application/xml');
  try {
    const usersList = await UserRepository.getAllUsers();
    let usersXml = '';
    usersList.slice(0, 100).forEach(u => {
      usersXml += `  <url>\n    <loc>https://velora.io/u/${u.username}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
    });

    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://velora.io/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${usersXml}</urlset>`);
  } catch (error) {
    res.status(500).send("Error compiling sitemap.");
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const settings = await SettingsRepository.getSettings();
    const allUsers = await UserRepository.getAllUsers();
    const allTasks = await TaskRepository.getAllTasks();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "2.0.0",
      memory: process.memoryUsage(),
      database: "PostgreSQL (Cloud SQL)",
      system: {
        appName: settings.appName,
        usersCount: allUsers.length,
        tasksCount: allTasks.length,
        pointMultiplier: settings.pointMultiplier
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: "degraded", error: error.message });
  }
});

// Public Settings Retrieval
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await SettingsRepository.getSettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mount modular sub-routers
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', taskRoutes);
app.use('/api', adminRoutes);
app.use('/api', geminiRoutes);
app.use('/api', telegramRoutes);

const PORT = 3000;
const isProd = fs.existsSync(path.join(__dirname, 'dist'));

async function startServer() {
  console.log("Initializing PostgreSQL Database Seeding on boot...");
  await runDatabaseSeed();

  if (!isProd) {
    console.log("Starting server in DEVELOPMENT mode with Vite middleware...");
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    
    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const htmlPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(htmlPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    console.log("Starting server in PRODUCTION mode, serving static files...");
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[Global Error Handler]', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
      message: 'An unexpected server-side anomaly was intercepted by security monitoring layers.'
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
