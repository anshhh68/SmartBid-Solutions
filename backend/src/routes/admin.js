const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { syncLiveTenders } = require('../services/tenderSyncService');

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.xlsx', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('File type not allowed'));
  }
});

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// ═══════════════════ DASHBOARD ═══════════════════
router.get('/dashboard', asyncHandler(async (req, res) => {
  const [totalUsers, totalTenders, activeTenders, totalEnquiries, newEnquiries, recentEnquiries] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.tender.count(),
    prisma.tender.count({ where: { status: 'ACTIVE', isPublished: true } }),
    prisma.enquiry.count(),
    prisma.enquiry.count({ where: { status: 'NEW' } }),
    prisma.enquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
  ]);

  const closingSoon = await prisma.tender.count({
    where: {
      status: 'ACTIVE',
      isPublished: true,
      closingDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    }
  });

  res.json({
    stats: { totalUsers, totalTenders, activeTenders, totalEnquiries, newEnquiries, closingSoon },
    recentEnquiries,
  });
}));

// ═══════════════════ TENDER MANAGEMENT ═══════════════════
router.get('/tenders', asyncHandler(async (req, res) => {
  const { search, status, category, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const where = {
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { refNo: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ]
    }),
    ...(status && { status }),
    ...(category && { category: { slug: category } }),
  };

  const [tenders, total] = await Promise.all([
    prisma.tender.findMany({
      where,
      include: { category: { select: { name: true } }, _count: { select: { savedBy: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.tender.count({ where }),
  ]);

  res.json({ tenders, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
}));

router.post('/tenders', asyncHandler(async (req, res) => {
  const { categoryId, documents, ...rest } = req.body;
  delete rest.id;
  delete rest.createdAt;
  delete rest.updatedAt;
  delete rest.viewCount;
  delete rest.category;
  delete rest._count;
  delete rest.savedBy;

  const tender = await prisma.tender.create({
    data: {
      ...rest,
      categoryId: categoryId || null,
      documents: documents || [],
      publishedAt: rest.isPublished ? new Date() : null,
    }
  });

  await prisma.auditLog.create({
    data: { userId: req.user.id, action: 'CREATE', entity: 'Tender', entityId: tender.id }
  });

  res.status(201).json({ tender });
}));

router.get('/tenders/:id', asyncHandler(async (req, res) => {
  const tender = await prisma.tender.findUnique({
    where: { id: req.params.id },
    include: { category: true }
  });
  if (!tender) return res.status(404).json({ error: 'Not found' });
  res.json({ tender });
}));

router.put('/tenders/:id', asyncHandler(async (req, res) => {
  const { categoryId, documents, ...rest } = req.body;
  delete rest.id;
  delete rest.createdAt;
  delete rest.updatedAt;
  delete rest.viewCount;
  delete rest.category;
  delete rest._count;
  delete rest.savedBy;

  const tender = await prisma.tender.update({
    where: { id: req.params.id },
    data: {
      ...rest,
      categoryId: categoryId || null,
      documents: documents || [],
      publishedAt: rest.isPublished ? (rest.publishedAt || new Date()) : null,
    }
  });

  await prisma.auditLog.create({
    data: { userId: req.user.id, action: 'UPDATE', entity: 'Tender', entityId: tender.id }
  });

  res.json({ tender });
}));

router.delete('/tenders/:id', asyncHandler(async (req, res) => {
  await prisma.tender.delete({ where: { id: req.params.id } });
  await prisma.auditLog.create({
    data: { userId: req.user.id, action: 'DELETE', entity: 'Tender', entityId: req.params.id }
  });
  res.json({ message: 'Tender deleted' });
}));

// Bulk publish/unpublish
router.post('/tenders/bulk-publish', asyncHandler(async (req, res) => {
  const { ids, publish } = req.body;
  await prisma.tender.updateMany({
    where: { id: { in: ids } },
    data: { isPublished: publish, publishedAt: publish ? new Date() : null }
  });
  res.json({ message: `${ids.length} tender(s) ${publish ? 'published' : 'unpublished'}` });
}));

// On-demand sync of live GeM & State portal tenders
router.post('/tenders/sync-live', asyncHandler(async (req, res) => {
  const result = await syncLiveTenders();
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'SYNC',
      entity: 'Tender',
      metadata: { synced: result.synced, skipped: result.skipped }
    }
  });
  res.json({ message: `Successfully synced ${result.synced} live tenders from GeM & State portals`, ...result });
}));

// Import tenders from JSON body (CSV processing done client-side)
router.post('/tenders/import', asyncHandler(async (req, res) => {
  const { tenders } = req.body;
  if (!tenders || !Array.isArray(tenders)) {
    return res.status(400).json({ error: 'tenders array required' });
  }

  let created = 0, skipped = 0;
  for (const t of tenders) {
    try {
      await prisma.tender.create({ data: { ...t, source: t.source || 'Import' } });
      created++;
    } catch {
      skipped++;
    }
  }

  res.json({ message: `Imported ${created} tenders, skipped ${skipped} duplicates` });
}));

// ═══════════════════ ENQUIRY MANAGEMENT ═══════════════════
router.get('/enquiries', asyncHandler(async (req, res) => {
  const { status, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const where = { ...(status && { status }) };
  const [enquiries, total] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.enquiry.count({ where }),
  ]);

  res.json({ enquiries, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
}));

router.put('/enquiries/:id', asyncHandler(async (req, res) => {
  const { status, assignedTo, notes } = req.body;
  const enquiry = await prisma.enquiry.update({
    where: { id: req.params.id },
    data: { status, assignedTo, notes }
  });
  res.json({ enquiry });
}));

// ═══════════════════ USER MANAGEMENT ═══════════════════
router.get('/users', asyncHandler(async (req, res) => {
  const { search, role, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }),
    ...(role && { role }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        isActive: true, createdAt: true,
        _count: { select: { savedTenders: true, enquiries: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ users, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
}));

router.patch('/users/:id/status', asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive },
    select: { id: true, name: true, email: true, isActive: true }
  });
  res.json({ user });
}));

// ═══════════════════ CONTENT MANAGEMENT ═══════════════════
router.get('/settings', asyncHandler(async (req, res) => {
  const settings = await prisma.siteSetting.findMany();
  const obj = {};
  for (const s of settings) obj[s.key] = s.value;
  res.json({ settings: obj });
}));

router.put('/settings', asyncHandler(async (req, res) => {
  const updates = req.body; // { key: value }
  for (const [key, value] of Object.entries(updates)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) }
    });
  }
  await prisma.auditLog.create({
    data: { userId: req.user.id, action: 'UPDATE', entity: 'SiteSettings' }
  });
  res.json({ message: 'Settings updated' });
}));

// Services admin CRUD
router.get('/services', asyncHandler(async (req, res) => {
  const services = await prisma.service.findMany({ orderBy: { order: 'asc' } });
  res.json({ services });
}));

router.post('/services', asyncHandler(async (req, res) => {
  const service = await prisma.service.create({ data: req.body });
  res.status(201).json({ service });
}));

router.put('/services/:id', asyncHandler(async (req, res) => {
  const service = await prisma.service.update({ where: { id: req.params.id }, data: req.body });
  res.json({ service });
}));

router.delete('/services/:id', asyncHandler(async (req, res) => {
  await prisma.service.delete({ where: { id: req.params.id } });
  res.json({ message: 'Service deleted' });
}));

// Plans admin CRUD
router.get('/plans', asyncHandler(async (req, res) => {
  const plans = await prisma.plan.findMany({ orderBy: { order: 'asc' } });
  res.json({ plans });
}));

router.post('/plans', asyncHandler(async (req, res) => {
  // Normalize billingPeriod (sent by frontend) → period (Prisma field name)
  const { billingPeriod, ...rest } = req.body;
  const plan = await prisma.plan.create({
    data: { ...rest, period: billingPeriod || rest.period || 'monthly' }
  });
  res.status(201).json({ plan });
}));

router.put('/plans/:id', asyncHandler(async (req, res) => {
  const { billingPeriod, ...rest } = req.body;
  const plan = await prisma.plan.update({
    where: { id: req.params.id },
    data: { ...rest, ...(billingPeriod && { period: billingPeriod }) }
  });
  res.json({ plan });
}));

router.delete('/plans/:id', asyncHandler(async (req, res) => {
  await prisma.plan.delete({ where: { id: req.params.id } });
  await prisma.auditLog.create({
    data: { userId: req.user.id, action: 'DELETE', entity: 'Plan', entityId: req.params.id }
  });
  res.json({ message: 'Plan deleted' });
}));

// Testimonials
router.get('/testimonials', asyncHandler(async (req, res) => {
  const testimonials = await prisma.testimonial.findMany({ orderBy: { order: 'asc' } });
  res.json({ testimonials });
}));

router.post('/testimonials', asyncHandler(async (req, res) => {
  const t = await prisma.testimonial.create({ data: req.body });
  res.status(201).json({ testimonial: t });
}));

router.put('/testimonials/:id', asyncHandler(async (req, res) => {
  const t = await prisma.testimonial.update({ where: { id: req.params.id }, data: req.body });
  res.json({ testimonial: t });
}));

router.delete('/testimonials/:id', asyncHandler(async (req, res) => {
  await prisma.testimonial.delete({ where: { id: req.params.id } });
  res.json({ message: 'Testimonial deleted' });
}));

// FAQs
router.get('/faqs', asyncHandler(async (req, res) => {
  const faqs = await prisma.faq.findMany({ orderBy: [{ category: 'asc' }, { order: 'asc' }] });
  res.json({ faqs });
}));

router.post('/faqs', asyncHandler(async (req, res) => {
  const faq = await prisma.faq.create({ data: req.body });
  res.status(201).json({ faq });
}));

router.put('/faqs/:id', asyncHandler(async (req, res) => {
  const faq = await prisma.faq.update({ where: { id: req.params.id }, data: req.body });
  res.json({ faq });
}));

router.delete('/faqs/:id', asyncHandler(async (req, res) => {
  await prisma.faq.delete({ where: { id: req.params.id } });
  res.json({ message: 'FAQ deleted' });
}));

// Audit Logs
router.get('/audit-logs', asyncHandler(async (req, res) => {
  const logs = await prisma.auditLog.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ logs });
}));

// Tender Categories admin
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await prisma.tenderCategory.findMany({
    include: { _count: { select: { tenders: true } } },
    orderBy: { name: 'asc' }
  });
  res.json({ categories });
}));

router.post('/categories', asyncHandler(async (req, res) => {
  const cat = await prisma.tenderCategory.create({ data: req.body });
  res.status(201).json({ category: cat });
}));

router.put('/categories/:id', asyncHandler(async (req, res) => {
  const cat = await prisma.tenderCategory.update({ where: { id: req.params.id }, data: req.body });
  res.json({ category: cat });
}));

router.delete('/categories/:id', asyncHandler(async (req, res) => {
  await prisma.tenderCategory.delete({ where: { id: req.params.id } });
  res.json({ message: 'Category deleted' });
}));

// Pages
router.get('/pages', asyncHandler(async (req, res) => {
  const pages = await prisma.page.findMany({ orderBy: { slug: 'asc' } });
  res.json({ pages });
}));

router.put('/pages/:id', asyncHandler(async (req, res) => {
  const page = await prisma.page.update({ where: { id: req.params.id }, data: req.body });
  res.json({ page });
}));

// File upload
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.originalname, size: req.file.size });
});

module.exports = router;
