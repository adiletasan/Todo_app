const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getCategories = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const categories = await prisma.category.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json({ categories });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const createCategory = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { name, color } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const category = await prisma.category.create({
      data: {
        user_id: userId,
        name,
        color: color || '#6b7394',
      },
    });

    return res.status(201).json({ category });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const existing = await prisma.category.findFirst({
      where: { id: req.params.id, user_id: userId },
    });
    if (!existing) return res.status(404).json({ message: 'Category not found' });

    await prisma.category.delete({ where: { id: req.params.id } });

    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getCategories, createCategory, deleteCategory };