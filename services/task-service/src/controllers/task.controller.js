const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { publish } = require('../services/rabbitmq.service');

const getTasks = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const { status, priority, due_date, sortBy, sortOrder } = req.query;

    // Фильтры
    const where = { user_id: userId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (due_date) where.due_date = { lte: new Date(due_date) };

    // Сортировка
    const validSortFields = ['created_at', 'due_date', 'title', 'priority'];
    const validSortOrders = ['asc', 'desc'];

    const sort = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = validSortOrders.includes(sortOrder) ? sortOrder : 'desc';

    // Приоритет сортируется вручную: high → medium → low
    let orderBy;
    if (sort === 'priority') {
      orderBy = [
        { priority: order },
      ];
    } else {
      orderBy = [{ [sort]: order }];
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.task.count({ where }),
    ]);

    return res.status(200).json({
      tasks,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const createTask = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { title, description, priority, due_date } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const task = await prisma.task.create({
      data: {
        user_id: userId,
        title,
        description,
        priority: priority || 'medium',
        due_date: due_date ? new Date(due_date) : null,
      },
    });

    return res.status(201).json({ task });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getTask = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    
    const { status, priority, due_date, category_id } = req.query;
    const where = { user_id: userId };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (due_date) where.due_date = { lte: new Date(due_date) };
    if (category_id) {
      where.task_categories = {
        some: { category_id },
      };
    }

    const task = await prisma.task.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        task_categories: {
          include: { category: true },
        },
      },
    });

    return res.status(200).json({ task });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const updateTask = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, user_id: userId },
    });
    if (!existing) return res.status(404).json({ message: 'Task not found' });

    const { title, description, status, priority, due_date } = req.body;

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { title, description, status, priority, due_date: due_date ? new Date(due_date) : null },
    });

    return res.status(200).json({ task });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, user_id: userId },
    });
    if (!existing) return res.status(404).json({ message: 'Task not found' });

    await prisma.task.delete({ where: { id: req.params.id } });

    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
const updateStatus = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { status } = req.body;
    const validStatuses = ['todo', 'in_progress', 'done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be: todo, in_progress, done',
      });
    }

    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, user_id: userId },
    });
    if (!existing) return res.status(404).json({ message: 'Task not found' });

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { status },
    });

    // Публикуем событие в RabbitMQ
    await publish('task.updated', {
      taskId: task.id,
      userId: task.user_id,
      title: task.title,
      status: task.status,
      updatedAt: task.updated_at,
    });

    return res.status(200).json({ task });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getTasks, createTask, getTask, updateTask, deleteTask, updateStatus };
