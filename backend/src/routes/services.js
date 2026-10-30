const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/services — All active services
router.get('/', asyncHandler(async (req, res) => {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' }
  });
  res.json({ services });
}));

// GET /api/services/:slug — Single service
router.get('/:slug', asyncHandler(async (req, res) => {
  const service = await prisma.service.findUnique({
    where: { slug: req.params.slug }
  });
  if (!service || !service.isActive) {
    return res.status(404).json({ error: 'Service not found' });
  }
  res.json({ service });
}));

module.exports = router;
