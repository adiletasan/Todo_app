require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { verifyToken } = require('./middleware/jwt');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('combined'));

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { message: 'Too many requests' },
});
app.use(globalLimiter);

const publicRoutes = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/refresh',
  '/health',
];

app.use((req, res, next) => {
  const isPublic = publicRoutes.some(route => req.path.startsWith(route));
  if (isPublic) return next();
  return verifyToken(req, res, next);
});

// /api/auth/* → auth-service:3001
app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req) => {
      const newPath = '/auth' + req.path;
      proxyReq.path = newPath;
    },
  },
}));

// /api/users/* → user-service:3002
app.use('/api/users', createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://user-service:3002',
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req) => {
      const newPath = '/users' + req.path;
      proxyReq.path = newPath;
    },
  },
}));

// /api/tasks/* → task-service:3003
app.use('/api/tasks', createProxyMiddleware({
  target: process.env.TASK_SERVICE_URL || 'http://task-service:3003',
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req) => {
      const newPath = '/tasks' + req.path;
      proxyReq.path = newPath;
    },
  },
}));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`gateway running on port ${PORT}`));