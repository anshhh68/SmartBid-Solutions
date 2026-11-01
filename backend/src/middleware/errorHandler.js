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

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  // Deleting a record that other records still point to (e.g. a category with tenders)
  if (err.code === 'P2003') {
    return res.status(409).json({ error: 'This record is in use by other records and cannot be deleted' });
  }

  // Bad/missing fields sent to Prisma — say so instead of a generic 500
  if (err.name === 'PrismaClientValidationError') {
    const missing = err.message.match(/Argument `(\w+)` is missing/);
    return res.status(400).json({
      error: missing ? `Missing required field: ${missing[1]}` : 'Invalid data submitted. Please check the form fields.',
    });
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
