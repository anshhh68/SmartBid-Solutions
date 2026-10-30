const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/plans
router.get('/', asyncHandler(async (req, res) => {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' }
  });
  res.json({ plans });
}));

module.exports = router;
