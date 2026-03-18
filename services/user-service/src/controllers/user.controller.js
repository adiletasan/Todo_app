const { PrismaClient } = require('@prisma/client');
const { uploadAvatar: uploadToMinio } = require('../services/minio.service');
const { publish } = require('../services/rabbitmq.service');
const prisma = new PrismaClient();

const getMe = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let profile = await prisma.profile.findUnique({ where: { user_id: userId } });

    if (!profile) {
      profile = await prisma.profile.create({
        data: { user_id: userId, name: req.headers['x-user-email'] || 'User' },
      });
    }

    return res.status(200).json({ profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const updateMe = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, timezone } = req.body;

    const profile = await prisma.profile.upsert({
      where: { user_id: userId },
      update: { name, timezone },
      create: { user_id: userId, name, timezone },
    });

    return res.status(200).json({ profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
const uploadAvatar = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const avatarUrl = await uploadToMinio(userId, req.file.buffer, req.file.mimetype);

    const profile = await prisma.profile.upsert({
      where: { user_id: userId },
      update: { avatar_url: avatarUrl },
      create: { user_id: userId, name: 'User', avatar_url: avatarUrl },
    });

    return res.status(200).json({ avatar_url: avatarUrl, profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
const deleteMe = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Удалить профиль из БД
    await prisma.profile.deleteMany({ where: { user_id: userId } });

    // Опубликовать событие — другие сервисы удалят связанные данные
    await publish('user.deleted', { userId });

    return res.status(200).json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getMe, updateMe, uploadAvatar, deleteMe };