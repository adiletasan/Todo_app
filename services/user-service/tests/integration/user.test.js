const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    profile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

jest.mock('amqplib', () => ({
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({
      assertQueue: jest.fn(),
      sendToQueue: jest.fn(),
      consume: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn(),
    }),
  }),
}));

jest.mock('minio', () => ({
  Client: jest.fn().mockImplementation(() => ({
    bucketExists: jest.fn().mockResolvedValue(true),
    putObject: jest.fn().mockResolvedValue({}),
  })),
}));


const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

process.env.NODE_ENV = 'test';
process.env.MINIO_ENDPOINT = 'localhost';
process.env.MINIO_PORT = '9000';
process.env.MINIO_USER = 'minioadmin';
process.env.MINIO_PASS = 'minioadmin123';
process.env.MINIO_BUCKET = 'avatars';

const userRoutes = require('../../src/routes/user.routes');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/users', userRoutes);

const mockProfile = {
  id: 'profile-uuid-123',
  user_id: 'user-uuid-123',
  name: 'Test User',
  avatar_url: null,
  timezone: 'UTC',
  created_at: new Date(),
  updated_at: new Date(),
};

describe('GET /users/me', () => {
  beforeEach(() => jest.clearAllMocks());

  test('успешно получить профиль', async () => {
    prisma.profile.findUnique.mockResolvedValue(mockProfile);

    const res = await request(app)
      .get('/users/me')
      .set('x-user-id', 'user-uuid-123');

    expect(res.status).toBe(200);
    expect(res.body.profile.user_id).toBe('user-uuid-123');
    expect(res.body.profile.name).toBe('Test User');
  });

  test('профиль не существует — создать автоматически', async () => {
    prisma.profile.findUnique.mockResolvedValue(null);
    prisma.profile.create.mockResolvedValue({
      ...mockProfile,
      name: 'test@test.com',
    });

    const res = await request(app)
      .get('/users/me')
      .set('x-user-id', 'user-uuid-123')
      .set('x-user-email', 'test@test.com');

    expect(res.status).toBe(200);
    expect(res.body.profile).toBeDefined();
  });

  test('нет x-user-id — 401', async () => {
    const res = await request(app).get('/users/me');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Unauthorized');
  });
});

describe('PUT /users/me', () => {
  beforeEach(() => jest.clearAllMocks());

  test('успешно обновить профиль', async () => {
    prisma.profile.upsert.mockResolvedValue({
      ...mockProfile,
      name: 'Updated Name',
      timezone: 'Asia/Almaty',
    });

    const res = await request(app)
      .put('/users/me')
      .set('x-user-id', 'user-uuid-123')
      .send({ name: 'Updated Name', timezone: 'Asia/Almaty' });

    expect(res.status).toBe(200);
    expect(res.body.profile.name).toBe('Updated Name');
    expect(res.body.profile.timezone).toBe('Asia/Almaty');
  });

  test('нет x-user-id — 401', async () => {
    const res = await request(app)
      .put('/users/me')
      .send({ name: 'Test' });

    expect(res.status).toBe(401);
  });
});

describe('POST /users/me/avatar', () => {
  beforeEach(() => jest.clearAllMocks());

  test('успешно загрузить аватар', async () => {
    prisma.profile.upsert.mockResolvedValue({
      ...mockProfile,
      avatar_url: 'http://localhost:9000/avatars/test.jpg',
    });

    const res = await request(app)
      .post('/users/me/avatar')
      .set('x-user-id', 'user-uuid-123');

    expect(res.status).toBe(200);
  });

  test('нет x-user-id — 401', async () => {
    const res = await request(app)
      .post('/users/me/avatar');

    expect(res.status).toBe(401);
  });
});

describe('DELETE /users/me', () => {
  beforeEach(() => jest.clearAllMocks());

  test('успешно удалить аккаунт', async () => {
    prisma.profile.deleteMany.mockResolvedValue({ count: 1 });

    const res = await request(app)
      .delete('/users/me')
      .set('x-user-id', 'user-uuid-123');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Account deleted successfully');
  });

  test('нет x-user-id — 401', async () => {
    const res = await request(app).delete('/users/me');
    expect(res.status).toBe(401);
  });
});