import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { seedAdminUser } from './store/userStore.js';
import { verifyDatabaseConnection } from './config/database.js';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
dotenv.config({ path: path.resolve(currentDir, '../.env') });

const app = express();
const port = Number(process.env.PORT || 4000);

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'development-only-secret-change-before-production';
  console.warn('WARNING: JWT_SECRET is not set. Using an insecure development fallback.');
}

app.disable('x-powered-by');
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '20kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'novaauth-api', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const statusCode = Number(error.statusCode) || 500;
  const message = statusCode >= 500 ? 'An unexpected server error occurred.' : error.message;
  res.status(statusCode).json({ message });
});

async function startServer() {
  await verifyDatabaseConnection();
  await seedAdminUser();
  app.listen(port, '0.0.0.0', () => {
    console.log(`NovaAuth API running at http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
