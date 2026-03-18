const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { publish } = require('../services/rabbitmq.service');

const prisma = new PrismaClient();

const startReminderJob = () => {
  // Каждые 15 минут — задачи со скорым дедлайном
  cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('Checking due soon tasks...');

      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

      const tasks = await prisma.task.findMany({
        where: {
          status: { not: 'done' },
          due_date: {
            gte: fifteenMinutesAgo,
            lte: oneHourLater,
          },
        },
      });

      console.log(`Found ${tasks.length} due soon tasks`);

      for (const task of tasks) {
        await publish('task.due_soon', {
          taskId: task.id,
          userId: task.user_id,
          taskTitle: task.title,
          dueDate: task.due_date,
        });
        console.log(`Published task.due_soon: ${task.title}`);
      }
    } catch (err) {
      console.error('Error in due soon job:', err.message);
    }
  });

  // Каждый час — просроченные задачи
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Checking overdue tasks...');

      const now = new Date();

      const tasks = await prisma.task.findMany({
        where: {
          status: { not: 'done' },
          due_date: { lt: now },
        },
      });

      console.log(`Found ${tasks.length} overdue tasks`);

      for (const task of tasks) {
        await publish('task.overdue', {
          taskId: task.id,
          userId: task.user_id,
          taskTitle: task.title,
          dueDate: task.due_date,
        });
        console.log(`Published task.overdue: ${task.title}`);
      }
    } catch (err) {
      console.error('Error in overdue job:', err.message);
    }
  });

  console.log('Task reminder job started');
};

module.exports = { startReminderJob };