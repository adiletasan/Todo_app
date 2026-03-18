const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('ioredis');
const { publish } = require('../services/rabbitmq.service');

const prisma = new PrismaClient();
const redis = new (require('ioredis'))(process.env.REDIS_URL);

const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password_hash },
    });

    await publish('user.registered', {
      userId: user.id,
      email: user.email,
      name: name,
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, email: user.email },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Найти пользователя
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Проверить пароль
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Сгенерировать access token (15 мин)
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Сгенерировать refresh token (30 дней)
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    // Сохранить refresh token в Redis (30 дней = 2592000 секунд)
    await redis.set(
      `refresh:${user.id}`,
      refreshToken,
      'EX',
      2592000
    );

    // Отправить refresh token в httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней в мс
    });

    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: { id: user.id, email: user.email },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
const refresh = async (req, res) => {
  try {
    // Взять refresh token из cookie
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }

    // Проверить подпись токена
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Проверить что токен есть в Redis
    const storedToken = await redis.get(`refresh:${payload.userId}`);
    if (!storedToken || storedToken !== refreshToken) {
      return res.status(401).json({ message: 'Refresh token expired or revoked' });
    }

    // Найти пользователя
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Сгенерировать новый access token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.status(200).json({
      message: 'Token refreshed',
      accessToken,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ message: 'No refresh token found' });
    }

    // Проверить токен и получить userId
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Удалить из Redis
    await redis.del(`refresh:${payload.userId}`);

    // Очистить cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.status(200).json({ message: 'Logged out successfully' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
const verify = async (req, res) => {
  try {
    // Взять токен из заголовка Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Проверить токен
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Проверить что пользователь существует
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    return res.status(200).json({
      valid: true,
      userId: user.id,
      email: user.email,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { register, login, refresh, logout, verify };


