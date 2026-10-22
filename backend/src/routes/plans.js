const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler');

const prisma = new PrismaClient();

// GET /api/plans
router.get('/', asyncHandler(async (req, res) => {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' }
  });
  res.json({ plans });
}));

module.exports = router;
