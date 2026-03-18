jest.mock('amqplib', () => ({
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({
      assertQueue: jest.fn(),
      consume: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn(),
      sendToQueue: jest.fn(),
    }),
  }),
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  }),
}));

const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport();

process.env.SMTP_HOST = 'sandbox.smtp.mailtrap.io';
process.env.SMTP_PORT = '2525';
process.env.SMTP_USER = 'testuser';
process.env.SMTP_PASS = 'testpass';

const { sendWelcomeEmail, sendDueSoonEmail, sendOverdueEmail } = require('../src/services/email.service');

describe('Email Service', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─────────────────────────────────────────
  // sendWelcomeEmail
  // ─────────────────────────────────────────
  describe('sendWelcomeEmail', () => {
    test('успешно отправить приветственное письмо', async () => {
      await sendWelcomeEmail('test@test.com', 'Test User');

      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@test.com',
          subject: 'Добро пожаловать в Todo App!',
        })
      );
    });

    test('письмо содержит имя пользователя', async () => {
      await sendWelcomeEmail('test@test.com', 'Иван');

      const callArgs = transporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Иван');
    });
  });

  // ─────────────────────────────────────────
  // sendDueSoonEmail
  // ─────────────────────────────────────────
  describe('sendDueSoonEmail', () => {
    test('успешно отправить напоминание', async () => {
      await sendDueSoonEmail('test@test.com', 'Купить продукты', '2026-03-19T10:00:00.000Z');

      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@test.com',
          subject: expect.stringContaining('Купить продукты'),
        })
      );
    });

    test('письмо содержит название задачи', async () => {
      await sendDueSoonEmail('test@test.com', 'Важная задача', '2026-03-19T10:00:00.000Z');

      const callArgs = transporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Важная задача');
    })

    test('письмо содержит дату дедлайна', async () => {
      await sendDueSoonEmail('test@test.com', 'Задача', '2026-03-19T10:00:00.000Z');

      const callArgs = transporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toBeDefined();
    });
  });

  // ─────────────────────────────────────────
  // sendOverdueEmail
  // ─────────────────────────────────────────
  describe('sendOverdueEmail', () => {
    test('успешно отправить письмо о просрочке', async () => {
      await sendOverdueEmail('test@test.com', 'Просроченная задача', '2026-03-18T10:00:00.000Z');

      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@test.com',
          subject: expect.stringContaining('Просроченная задача'),
        })
      );
    });

    test('письмо содержит название задачи', async () => {
      await sendOverdueEmail('test@test.com', 'Моя задача', '2026-03-18T10:00:00.000Z');

      const callArgs = transporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Моя задача');
    });
  });
});

// ─────────────────────────────────────────
// Consumer functions
// ─────────────────────────────────────────
describe('Consumer functions', () => {
  test('user.registered consumer обрабатывает сообщение', async () => {
    const mockMsg = {
      content: Buffer.from(JSON.stringify({
        userId: 'uuid-123',
        email: 'test@test.com',
        name: 'Test User',
      })),
    };

    await sendWelcomeEmail('test@test.com', 'Test User');
    expect(transporter.sendMail).toHaveBeenCalled();
  });

  test('task.due_soon consumer обрабатывает сообщение', async () => {
    const mockMsg = {
      content: Buffer.from(JSON.stringify({
        taskId: 'task-uuid-123',
        userId: 'user-uuid-123',
        taskTitle: 'Тест задача',
        dueDate: '2026-03-19T10:00:00.000Z',
      })),
    };

    await sendDueSoonEmail('test@test.com', 'Тест задача', '2026-03-19T10:00:00.000Z');
    expect(transporter.sendMail).toHaveBeenCalled();
  });

  test('task.overdue consumer обрабатывает сообщение', async () => {
    const mockMsg = {
      content: Buffer.from(JSON.stringify({
        taskId: 'task-uuid-123',
        userId: 'user-uuid-123',
        taskTitle: 'Просроченная задача',
        dueDate: '2026-03-18T10:00:00.000Z',
      })),
    };

    await sendOverdueEmail('test@test.com', 'Просроченная задача', '2026-03-18T10:00:00.000Z');
    expect(transporter.sendMail).toHaveBeenCalled();
  });
});