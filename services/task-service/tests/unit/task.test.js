const request = require('supertest');
const express = require('express');

jest.mock('express-rate-limit', () => () => (req, res, next) => next());

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    task: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

jest.mock('amqplib', () => ({
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({
      assertQueue: jest.fn(),
      sendToQueue: jest.fn(),
    }),
  }),
}));

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

process.env.NODE_ENV = 'test';

const taskRoutes = require('../../src/routes/task.routes');

const app = express();
app.use(express.json());
app.use('/tasks', taskRoutes);

const mockTask = {
  id: 'task-uuid-123',
  user_id: 'user-uuid-123',
  title: 'Test task',
  description: 'Test description',
  status: 'todo',
  priority: 'high',
  due_date: null,
  created_at: new Date(),
  updated_at: new Date(),
  task_categories: [],
};

const mockCategory = {
  id: 'category-uuid-123',
  user_id: 'user-uuid-123',
  name: 'Работа',
  color: '#ff6b6b',
  created_at: new Date(),
};

// ─────────────────────────────────────────
// GET /tasks
// ─────────────────────────────────────────
describe('GET /tasks', () => {
  beforeEach(() => jest.clearAllMocks());

  test('успешно получить список задач', async () => {
    prisma.task.findMany.mockResolvedValue([mockTask]);
    prisma.task.count.mockResolvedValue(1);

    const res = await request(app)
      .get('/tasks')
      .set('x-user-id', 'user-uuid-123');

    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.pagination.total).toBe(1);
  });

  test('фильтр по статусу', async () => {
    prisma.task.findMany.mockResolvedValue([mockTask]);
    prisma.task.count.mockResolvedValue(1);

    const res = await request(app)
      .get('/tasks?status=todo')
      .set('x-user-id', 'user-uuid-123');

    expect(res.status).toBe(200);
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'todo' }),
      })
    );
  });

  test('пагинация', async () => {
    prisma.task.findMany.mockResolvedValue([mockTask]);
    prisma.task.count.mockResolvedValue(10);

    const res = await request(app)
      .get('/tasks?limit=1&offset=0')
      .set('x-user-id', 'user-uuid-123');

    expect(res.status).toBe(200);
    expect(res.body.pagination.hasMore).toBe(true);
    expect(res.body.pagination.limit).toBe(1);
  });

  test('нет x-user-id — 401', async () => {
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────
// POST /tasks
// ─────────────────────────────────────────
describe('POST /tasks', () => {
  beforeEach(() => jest.clearAllMocks());

  test('успешно создать задачу', async () => {
    prisma.task.create.mockResolvedValue(mockTask);

    const res = await request(app)
      .post('/tasks')
      .set('x-user-id', 'user-uuid-123')
      .send({ title: 'Test task', priority: 'high' });

    expect(res.status).toBe(201);
    expect(res.body.task.title).toBe('Test task');
  });

  test('нет title — 400', async () => {
    const res = await request(app)
      .post('/tasks')
      .set('x-user-id', 'user-uuid-123')
      .send({ priority: 'high' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Title is required');
  });

  test('нет x-user-id — 401', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Test' });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────
// GET /tasks/:id
// ─────────────────────────────────────────
describe('GET /tasks/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('успешно получить задачу', async () => {
    prisma.task.findFirst.mockResolvedValue(mockTask);

    const res = await request(app)
      .get('/tasks/task-uuid-123')
      .set('x-user-id', 'user-uuid-123');

    expect(res.status).toBe(200);
    expect(res.body.task).toBeDefined();
  });

  test('задача не найдена — 404', async () => {
    prisma.task.findFirst.mockResolvedValue(null);
    prisma.task.findMany.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(0);

    const res = await request(app)
      .get('/tasks/nonexistent-id')
      .set('x-user-id', 'user-uuid-123');

    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────
// PUT /tasks/:id
// ─────────────────────────────────────────
describe('PUT /tasks/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('успешно обновить задачу', async () => {
    prisma.task.findFirst.mockResolvedValue(mockTask);
    prisma.task.update.mockResolvedValue({ ...mockTask, title: 'Updated' });

    const res = await request(app)
      .put('/tasks/task-uuid-123')
      .set('x-user-id', 'user-uuid-123')
      .send({ title: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.task.title).toBe('Updated');
  });

  test('задача не найдена — 404', async () => {
    prisma.task.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .put('/tasks/wrong-id')
      .set('x-user-id', 'user-uuid-123')
      .send({ title: 'Updated' });

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────
// PATCH /tasks/:id/status
// ─────────────────────────────────────────
describe('PATCH /tasks/:id/status', () => {
  beforeEach(() => jest.clearAllMocks());

  test('успешно изменить статус', async () => {
    prisma.task.findFirst.mockResolvedValue(mockTask);
    prisma.task.update.mockResolvedValue({ ...mockTask, status: 'done' });

    const res = await request(app)
      .patch('/tasks/task-uuid-123/status')
      .set('x-user-id', 'user-uuid-123')
      .send({ status: 'done' });

    expect(res.status).toBe(200);
    expect(res.body.task.status).toBe('done');
  });

  test('неверный статус — 400', async () => {
    const res = await request(app)
      .patch('/tasks/task-uuid-123/status')
      .set('x-user-id', 'user-uuid-123')
      .send({ status: 'invalid' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid status. Must be: todo, in_progress, done');
  });
});

// ─────────────────────────────────────────
// DELETE /tasks/:id
// ─────────────────────────────────────────
describe('DELETE /tasks/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('успешно удалить задачу', async () => {
    prisma.task.findFirst.mockResolvedValue(mockTask);
    prisma.task.delete.mockResolvedValue(mockTask);

    const res = await request(app)
      .delete('/tasks/task-uuid-123')
      .set('x-user-id', 'user-uuid-123');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Task deleted successfully');
  });

  test('задача не найдена — 404', async () => {
    prisma.task.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .delete('/tasks/wrong-id')
      .set('x-user-id', 'user-uuid-123');

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────
// GET /tasks/categories
// ─────────────────────────────────────────
describe('GET /tasks/categories', () => {
  beforeEach(() => jest.clearAllMocks());

  test('успешно получить категории', async () => {
    prisma.category.findMany.mockResolvedValue([mockCategory]);

    const res = await request(app)
      .get('/tasks/categories')
      .set('x-user-id', 'user-uuid-123');

    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(1);
  });

  test('нет x-user-id — 401', async () => {
    const res = await request(app).get('/tasks/categories');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────
// POST /tasks/categories
// ─────────────────────────────────────────
describe('POST /tasks/categories', () => {
  beforeEach(() => jest.clearAllMocks());

  test('успешно создать категорию', async () => {
    prisma.category.create.mockResolvedValue(mockCategory);

    const res = await request(app)
      .post('/tasks/categories')
      .set('x-user-id', 'user-uuid-123')
      .send({ name: 'Работа', color: '#ff6b6b' });

    expect(res.status).toBe(201);
    expect(res.body.category.name).toBe('Работа');
  });

  test('нет name — 400', async () => {
    const res = await request(app)
      .post('/tasks/categories')
      .set('x-user-id', 'user-uuid-123')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Name is required');
  });
});

// ─────────────────────────────────────────
// DELETE /tasks/categories/:id
// ─────────────────────────────────────────
describe('DELETE /tasks/categories/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('успешно удалить категорию', async () => {
    prisma.category.findFirst.mockResolvedValue(mockCategory);
    prisma.category.delete.mockResolvedValue(mockCategory);

    const res = await request(app)
      .delete('/tasks/categories/category-uuid-123')
      .set('x-user-id', 'user-uuid-123');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Category deleted successfully');
  });

  test('категория не найдена — 404', async () => {
    prisma.category.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .delete('/tasks/categories/wrong-id')
      .set('x-user-id', 'user-uuid-123');

    expect(res.status).toBe(404);
  });
});