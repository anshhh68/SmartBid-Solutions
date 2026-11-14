const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/tenders — Public list with filters
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const {
    search, category, location, state, status, source, minValue, maxValue,
    sortBy = 'closingDate', sortOrder = 'asc',
    page = '1', limit = '12'
  } = req.query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const where = {
    isPublished: true,
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { refNo: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }),
    ...(category && { category: { slug: category } }),
    ...(location && { location: { contains: location, mode: 'insensitive' } }),
    ...(state && { state: { contains: state, mode: 'insensitive' } }),
    ...(status && { status }),
    ...(source && { source: { contains: source, mode: 'insensitive' } }),
    ...(minValue && { value: { gte: parseFloat(minValue) } }),
    ...(maxValue && { value: { ...((minValue && { gte: parseFloat(minValue) }) || {}), lte: parseFloat(maxValue) } }),
  };

  const validSortFields = ['closingDate', 'value', 'createdAt', 'title'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'closingDate';
  const orderBy = { [sortField]: sortOrder === 'desc' ? 'desc' : 'asc' };

  const [tenders, total] = await Promise.all([
    prisma.tender.findMany({
      where,
      include: { category: { select: { name: true, slug: true, icon: true } } },
      orderBy,
      skip,
      take: limitNum,
    }),
    prisma.tender.count({ where }),
  ]);

  const isAdmin = req.user && req.user.role === 'ADMIN';

  // Role-based filtering for listings:
  // Admins get full object; customers receive essential tender info without leaking documents or sourceUrl
  const sanitizedTenders = tenders.map(t => {
    if (isAdmin) return t;
    const { documents, sourceUrl, ...essential } = t;
    return {
      ...essential,
      hasDocuments: Array.isArray(documents) && documents.length > 0,
      documentsCount: Array.isArray(documents) ? documents.length : 0,
      documents: null,
      sourceUrl: null,
    };
  });

  res.json({
    tenders: sanitizedTenders,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasNext: pageNum < Math.ceil(total / limitNum),
      hasPrev: pageNum > 1,
    }
  });
}));

// GET /api/tenders/stats — Quick stats for home page
router.get('/stats', asyncHandler(async (req, res) => {
  const [total, active, closing] = await Promise.all([
    prisma.tender.count({ where: { isPublished: true } }),
    prisma.tender.count({ where: { isPublished: true, status: 'ACTIVE' } }),
    prisma.tender.count({
      where: {
        isPublished: true, status: 'ACTIVE',
        closingDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
      }
    }),
  ]);
  res.json({ total, active, closingSoon: closing });
}));

// GET /api/tenders/categories — All categories with counts
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await prisma.tenderCategory.findMany({
    include: {
      _count: { select: { tenders: { where: { isPublished: true, status: 'ACTIVE' } } } }
    },
    orderBy: { name: 'asc' }
  });
  res.json({ categories });
}));

// GET /api/tenders/:id — Single tender detail (RBAC: Admins get complete data & docs; Customers get essential info)
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const tender = await prisma.tender.findFirst({
    where: {
      id: req.params.id,
      isPublished: true,
    },
    include: { category: true }
  });

  if (!tender) {
    return res.status(404).json({ error: 'Tender not found' });
  }

  // Increment view count
  await prisma.tender.update({ where: { id: tender.id }, data: { viewCount: { increment: 1 } } });

  const isAdmin = req.user && req.user.role === 'ADMIN';

  // Admin access: Full tender details, official documents with download URLs, and sourceUrl
  if (isAdmin) {
    return res.json({
      tender: {
        ...tender,
        accessLevel: 'ADMIN',
        hasDocuments: Array.isArray(tender.documents) && tender.documents.length > 0,
        documentsCount: Array.isArray(tender.documents) ? tender.documents.length : 0,
      }
    });
  }

  // Customer access: Essential tender information ONLY
  // Strictly withholding documents download URLs and raw sourceUrl at API level
  const { documents, sourceUrl, ...essentialTender } = tender;

  res.json({
    tender: {
      ...essentialTender,
      accessLevel: 'CUSTOMER',
      hasDocuments: Array.isArray(documents) && documents.length > 0,
      documentsCount: Array.isArray(documents) ? documents.length : 0,
      documents: null,
      sourceUrl: null,
    }
  });
}));

// GET /api/tenders/:id/documents — Strictly protected: Admins only
router.get('/:id/documents', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const tender = await prisma.tender.findUnique({
    where: { id: req.params.id },
    select: { id: true, refNo: true, documents: true, sourceUrl: true }
  });
  if (!tender) return res.status(404).json({ error: 'Tender not found' });
  res.json({
    documents: tender.documents || [],
    sourceUrl: tender.sourceUrl,
    accessLevel: 'ADMIN'
  });
}));

module.exports = router;
