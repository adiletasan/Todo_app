const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendWelcomeEmail = async (email, name) => {
  await transporter.sendMail({
    from: `"Todo App" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Добро пожаловать в Todo App!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #00d4aa;">Привет, ${name}!</h1>
        <p>Добро пожаловать в Todo App. Ваш аккаунт успешно создан.</p>
        <p>Начните управлять своими задачами прямо сейчас.</p>
      </div>
    `,
  });
};

const sendDueSoonEmail = async (email, taskTitle, dueDate) => {
  await transporter.sendMail({
    from: `"Todo App" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `⏰ Задача скоро истекает: ${taskTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #fbbf24;">Напоминание о задаче</h2>
        <p>Задача <strong>${taskTitle}</strong> истекает через 1 час.</p>
        <p>Дедлайн: <strong>${new Date(dueDate).toLocaleString('ru-RU')}</strong></p>
      </div>
    `,
  });
};

const sendOverdueEmail = async (email, taskTitle, dueDate) => {
  await transporter.sendMail({
    from: `"Todo App" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `❌ Просроченная задача: ${taskTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6b6b;">Задача просрочена</h2>
        <p>Задача <strong>${taskTitle}</strong> просрочена.</p>
        <p>Дедлайн был: <strong>${new Date(dueDate).toLocaleString('ru-RU')}</strong></p>
      </div>
    `,
  });
};

module.exports = { sendWelcomeEmail, sendDueSoonEmail, sendOverdueEmail };