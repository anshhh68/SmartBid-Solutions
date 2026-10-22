const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.status || 500} — ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'A record with this information already exists',
      field: err.meta?.target?.[0],
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message, details: err.details });
  }

  const status = err.status || err.statusCode || 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  res.status(status).json({ error: message });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };
