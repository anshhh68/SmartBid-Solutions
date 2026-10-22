const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const prisma = new PrismaClient();

// GET /api/users/dashboard — User dashboard stats
router.get('/dashboard', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const [savedCount, alertCount, enquiryCount] = await Promise.all([
    prisma.savedTender.count({ where: { userId } }),
    prisma.tenderAlert.count({ where: { userId, isActive: true } }),
    prisma.enquiry.count({ where: { userId } }),
  ]);

  // Upcoming deadlines from saved tenders
  const upcomingDeadlines = await prisma.savedTender.findMany({
    where: {
      userId,
      tender: { closingDate: { gte: new Date() }, status: 'ACTIVE' }
    },
    include: { tender: { select: { id: true, title: true, closingDate: true, department: true, status: true } } },
    orderBy: { tender: { closingDate: 'asc' } },
    take: 5,
  });

  res.json({
    stats: { savedTenders: savedCount, activeAlerts: alertCount, enquiries: enquiryCount },
    upcomingDeadlines: upcomingDeadlines.map(s => s.tender),
  });
}));

// GET /api/users/alerts
router.get('/alerts', authenticate, asyncHandler(async (req, res) => {
  const alerts = await prisma.tenderAlert.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ alerts });
}));

// POST /api/users/alerts
router.post('/alerts', authenticate, asyncHandler(async (req, res) => {
  const { keywords, categories, locations } = req.body;
  const alert = await prisma.tenderAlert.create({
    data: {
      userId: req.user.id,
      keywords: keywords || [],
      categories: categories || [],
      locations: locations || [],
    }
  });
  res.status(201).json({ alert });
}));

// DELETE /api/users/alerts/:id
router.delete('/alerts/:id', authenticate, asyncHandler(async (req, res) => {
  await prisma.tenderAlert.deleteMany({
    where: { id: req.params.id, userId: req.user.id }
  });
  res.json({ message: 'Alert deleted' });
}));

module.exports = router;
