require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({
  contentSecurityPolicy: true,      // защита от XSS
  crossOriginEmbedderPolicy: true,  // защита от Spectre атак
  crossOriginOpenerPolicy: true,    // изоляция окон браузера
  crossOriginResourcePolicy: true,  // защита ресурсов
  dnsPrefetchControl: true,         // отключить DNS prefetch
  frameguard: true,                 // защита от clickjacking
  hidePoweredBy: true,              // скрыть X-Powered-By: Express
  hsts: true,                       // принудительный HTTPS
  ieNoOpen: true,                   // защита для IE
  noSniff: true,                    // отключить MIME sniffing
  referrerPolicy: true,             // контроль Referer заголовка
  xssFilter: true,                  // защита от XSS (старые браузеры)
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // разрешить cookies
}));

app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`auth-service running on port ${PORT}`));