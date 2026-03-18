const amqp = require('amqplib');

let channel;

const connect = async () => {
  const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672');
  channel = await conn.createChannel();
  console.log('RabbitMQ connected in auth-service');
};

const publish = async (queue, message) => {
  if (!channel) await connect();
  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
};

module.exports = { connect, publish };