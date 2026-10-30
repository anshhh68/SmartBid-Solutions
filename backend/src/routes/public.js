const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/public/settings — Site settings for frontend
router.get('/settings', asyncHandler(async (req, res) => {
  const settings = await prisma.siteSetting.findMany();
  const obj = {};
  for (const s of settings) obj[s.key] = s.value;
  res.json({ settings: obj });
}));

// GET /api/public/testimonials
router.get('/testimonials', asyncHandler(async (req, res) => {
  const testimonials = await prisma.testimonial.findMany({
    where: { isPublished: true },
    orderBy: { order: 'asc' }
  });
  res.json({ testimonials });
}));

// GET /api/public/faqs
router.get('/faqs', asyncHandler(async (req, res) => {
  const { category } = req.query;
  const faqs = await prisma.faq.findMany({
    where: { isActive: true, ...(category && { category }) },
    orderBy: [{ category: 'asc' }, { order: 'asc' }]
  });
  res.json({ faqs });
}));

// GET /api/public/pages/:slug
router.get('/pages/:slug', asyncHandler(async (req, res) => {
  const page = await prisma.page.findUnique({
    where: { slug: req.params.slug }
  });
  if (!page || !page.isPublished) {
    return res.status(404).json({ error: 'Page not found' });
  }
  res.json({ page });
}));

// GET /api/public/banners
router.get('/banners', asyncHandler(async (req, res) => {
  const banners = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' }
  });
  res.json({ banners });
}));

module.exports = router;
