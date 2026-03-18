const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 5,
  message: { message: 'Too many attempts, please try again after 1 minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter };