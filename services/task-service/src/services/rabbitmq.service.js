const amqp = require('amqplib');

let channel;

const connect = async () => {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672');
    channel = await conn.createChannel();
    console.log('RabbitMQ connected in task-service');
  } catch (err) {
    console.error('RabbitMQ connection error:', err.message);
    setTimeout(connect, 5000);
  }
};

const publish = async (queue, message) => {
  if (!channel) await connect();
  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
};

module.exports = { connect, publish };