const router = require('express').Router();
const { getMe, updateMe, uploadAvatar, deleteMe } = require('../controllers/user.controller');
const upload = require('../middleware/upload');

router.get('/me', getMe);
router.put('/me', updateMe);
router.post('/me/avatar', upload.single('avatar'), deleteMe);
router.delete('/me', deleteMe);

module.exports = router;