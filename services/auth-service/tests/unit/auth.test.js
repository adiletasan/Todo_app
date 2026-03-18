const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');

jest.mock('express-rate-limit', () => () => (req, res, next) => next());

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

const store = {};
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    set: jest.fn().mockImplementation((key, val) => {
      store[key] = val;
      return Promise.resolve('OK');
    }),
    get: jest.fn().mockImplementation((key) => {
      return Promise.resolve(store[key] || null);
    }),
    del: jest.fn().mockImplementation((key) => {
      delete store[key];
      return Promise.resolve(1);
    }),
  }));
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

process.env.JWT_SECRET = 'test_secret_key_minimum_32_chars!!';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_minimum_32!!';
process.env.NODE_ENV = 'test';

const authRoutes = require('../../src/routes/auth.routes');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/auth', authRoutes);

describe('POST /auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  test('успешная регистрация', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'uuid-123',
      email: 'test@test.com',
    });

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@test.com', password: '123456', name: 'Test' });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('User registered successfully');
    expect(res.body.user.email).toBe('test@test.com');
  });

  test('email уже занят', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'uuid-123', email: 'test@test.com' });

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@test.com', password: '123456', name: 'Test' });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Email already in use');
  });

  test('пустые поля — ошибка валидации', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation error');
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test('неверный email формат', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'notanemail', password: '123456', name: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.errors[0]).toBe('Invalid email format');
  });
});

describe('POST /auth/login', () => {
  const bcrypt = require('bcryptjs');

  beforeEach(() => jest.clearAllMocks());

  test('успешный логин', async () => {
    const password_hash = await bcrypt.hash('123456', 12);
    prisma.user.findUnique.mockResolvedValue({
      id: 'uuid-123',
      email: 'test@test.com',
      password_hash,
    });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@test.com', password: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Login successful');
    expect(res.body.accessToken).toBeDefined();
  });

  test('неверный пароль', async () => {
    const password_hash = await bcrypt.hash('correctpassword', 12);
    prisma.user.findUnique.mockResolvedValue({
      id: 'uuid-123',
      email: 'test@test.com',
      password_hash,
    });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  test('пользователь не найден', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'noone@test.com', password: '123456' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });
});

describe('POST /auth/refresh', () => {
  const jwt = require('jsonwebtoken');

  beforeEach(() => jest.clearAllMocks());

  test('успешный refresh', async () => {
    const refreshToken = jwt.sign(
      { userId: 'uuid-123' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    store[`refresh:uuid-123`] = refreshToken;

    prisma.user.findUnique.mockResolvedValue({
      id: 'uuid-123',
      email: 'test@test.com',
    });

    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', `refreshToken=${refreshToken}`);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  test('нет refresh token', async () => {
    const res = await request(app).post('/auth/refresh');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Refresh token not found');
  });

  test('неверный refresh token', async () => {
    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', 'refreshToken=invalidtoken');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid refresh token');
  });
});

describe('POST /auth/logout', () => {
  const jwt = require('jsonwebtoken');

  beforeEach(() => jest.clearAllMocks());

  test('успешный logout', async () => {
    const refreshToken = jwt.sign(
      { userId: 'uuid-123' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    const res = await request(app)
      .post('/auth/logout')
      .set('Cookie', `refreshToken=${refreshToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');
  });

  test('нет refresh token', async () => {
    const res = await request(app).post('/auth/logout');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('No refresh token found');
  });
});