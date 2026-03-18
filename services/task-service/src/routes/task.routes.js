const router = require('express').Router();
const { getTasks, createTask, getTask, updateTask, deleteTask, updateStatus } = require('../controllers/task.controller');
const { getCategories, createCategory, deleteCategory } = require('../controllers/category.controller');

router.get('/', getTasks);
router.post('/', createTask);

router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/:id', getTask);
router.put('/:id', updateTask);
router.patch('/:id/status', updateStatus);
router.delete('/:id', deleteTask);

module.exports = router;