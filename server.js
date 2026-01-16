import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from './backend/node_modules/mongoose/index.js';
import fs from 'fs';
import path from 'path';

import authRoutes from './backend/routes/authRoutes.js';
import topicRoutes from './backend/routes/topicRoutes.js';
import taskRoutes from './backend/routes/taskRoutes.js';
import submissionRoutes from './backend/routes/submissionRoutes.js';
import examRoutes from './backend/routes/examRoutes.js';
import resultRoutes from './backend/routes/resultRoutes.js';
import performanceRoutes from './backend/routes/performanceRoutes.js';
import attendanceRoutes from './backend/routes/attendanceRoutes.js';
import researchRoutes from './backend/routes/researchRoutes.js';
import aiRoutes from './backend/routes/aiRoutes.js';
import mockExamRoutes from './backend/routes/mockExamRoutes.js';
import statsRoutes from './backend/routes/statsRoutes.js';

dotenv.config({ override: true });

const app = express();

const requireEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

const parseNumberEnv = (key, fallback) => {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid numeric env var: ${key}`);
  }
  return n;
};

const validateEnv = () => {
  requireEnv('MONGO_URI');
  requireEnv('JWT_SECRET');

  requireEnv('EMAIL_HOST');
  requireEnv('EMAIL_PORT');
  requireEnv('EMAIL_SECURE');
  requireEnv('EMAIL_USER');
  requireEnv('EMAIL_PASS');
  requireEnv('EMAIL_FROM');

  parseNumberEnv('EMAIL_PORT');
  parseNumberEnv('PORT', 5001);
};

validateEnv();

const PORT = parseNumberEnv('PORT', 5001);

mongoose.set('strictQuery', true);
mongoose.set('autoIndex', process.env.NODE_ENV !== 'production');

const normalizeOrigin = (value) => {
  if (!value) return '';
  let v = String(value).trim();
  v = v.replace(/['"`]/g, '');
  v = v.replace(/\s+/g, '');
  v = v.replace(/\/$/, '');
  return v;
};

const frontendOrigin = normalizeOrigin(process.env.FRONTEND_URL);
const allowedOrigins = new Set(
  [
    frontendOrigin,
    'https://dashboard.spheronixtechnology.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ].filter(Boolean)
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalized = normalizeOrigin(origin);
      if (allowedOrigins.has(normalized)) return callback(null, true);
      return callback(new Error('CORS not allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'dashboard-backend',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    aiEnabled: Boolean(process.env.API_KEY || process.env.GEMINI_API_KEY),
  });
});

app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (mongoose.connection.readyState === 1) return next();
  return res.status(503).json({
    success: false,
    message: 'Database is not ready. Check MongoDB Atlas IP whitelist / MONGO_URI and try again.',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/exam-submissions', resultRoutes);
app.use('/api/student-performance', performanceRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/generate-questions', aiRoutes);
app.use('/api/mock-exams', mockExamRoutes);
app.use('/api/stats', statsRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  const status = err?.message === 'CORS not allowed' ? 403 : 500;
  res.status(status).json({ success: false, message: err?.message || 'Server error' });
});

const connectMongo = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing');
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      autoIndex: process.env.NODE_ENV !== 'production',
      family: 4, // Force IPv4 to avoid IP issues
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected!');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected!');
});


const ensureUploadsDir = async () => {
  const uploadsPath = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
};

const start = async () => {
  await connectMongo();
  await ensureUploadsDir();
  const host = process.env.NODE_ENV === 'production' ? '127.0.0.1' : undefined;
  app.listen(PORT, host, () => {
    console.log(`Backend listening on ${host || '0.0.0.0'}:${PORT}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err?.message || err);
  process.exit(1);
});
