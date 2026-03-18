const amqp = require('amqplib');
const { sendWelcomeEmail, sendDueSoonEmail, sendOverdueEmail } = require('../services/email.service');

const QUEUES = ['user.registered', 'task.due_soon', 'task.overdue'];

const startConsumers = async () => {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672');
    const channel = await conn.createChannel();

    // Создать все очереди
    for (const queue of QUEUES) {
      await channel.assertQueue(queue, { durable: true });
      console.log(`Queue created: ${queue}`);
    }

    // user.registered → приветственное письмо
    channel.consume('user.registered', async (msg) => {
      if (!msg) return;
      try {
        const { userId, email, name } = JSON.parse(msg.content.toString());
        console.log(`user.registered: ${email}`);
        await sendWelcomeEmail(email, name);
        channel.ack(msg);
      } catch (err) {
        console.error('Error processing user.registered:', err.message);
        channel.nack(msg);
      }
    });

    // task.due_soon → напоминание за 1 час
    channel.consume('task.due_soon', async (msg) => {
      if (!msg) return;
      try {
        const { email, taskTitle, dueDate } = JSON.parse(msg.content.toString());
        console.log(`task.due_soon: ${taskTitle}`);
        await sendDueSoonEmail(email, taskTitle, dueDate);
        channel.ack(msg);
      } catch (err) {
        console.error('Error processing task.due_soon:', err.message);
        channel.nack(msg);
      }
    });

    // task.overdue → просроченная задача
    channel.consume('task.overdue', async (msg) => {
      if (!msg) return;
      try {
        const { email, taskTitle, dueDate } = JSON.parse(msg.content.toString());
        console.log(`task.overdue: ${taskTitle}`);
        await sendOverdueEmail(email, taskTitle, dueDate);
        channel.ack(msg);
      } catch (err) {
        console.error('Error processing task.overdue:', err.message);
        channel.nack(msg);
      }
    });

    console.log('All consumers started');
  } catch (err) {
    console.error('RabbitMQ connection error:', err.message);
    setTimeout(startConsumers, 5000);
  }
};

module.exports = { startConsumers };