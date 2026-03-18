const amqp = require('amqplib');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const startConsumer = async () => {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672');
    const channel = await conn.createChannel();

    // Слушаем user.registered
    await channel.assertQueue('user.registered', { durable: true });
    channel.consume('user.registered', async (msg) => {
      if (!msg) return;
      try {
        const { userId, email, name } = JSON.parse(msg.content.toString());
        console.log(`Creating profile for user: ${userId}`);

        // Создать профиль автоматически
        await prisma.profile.upsert({
          where: { user_id: userId },
          update: {},
          create: {
            user_id: userId,
            name: name || email,
          },
        });

        channel.ack(msg);
        console.log(`Profile created for user: ${userId}`);
      } catch (err) {
        console.error('Error processing user.registered:', err);
        channel.nack(msg);
      }
    });

    // Слушаем user.deleted
    await channel.assertQueue('user.deleted', { durable: true });
    channel.consume('user.deleted', async (msg) => {
      if (!msg) return;
      try {
        const { userId } = JSON.parse(msg.content.toString());
        await prisma.profile.deleteMany({ where: { user_id: userId } });
        channel.ack(msg);
        console.log(`Profile deleted for user: ${userId}`);
      } catch (err) {
        console.error('Error processing user.deleted:', err);
        channel.nack(msg);
      }
    });

    console.log('User consumer started');
  } catch (err) {
    console.error('RabbitMQ connection error:', err.message);
    setTimeout(startConsumer, 5000); // retry через 5 сек
  }
};

module.exports = { startConsumer };