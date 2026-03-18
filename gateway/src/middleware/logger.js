const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

module.exports = (req, _res, next) => {
  logger.info({ method: req.method, url: req.url });
  next();
};
