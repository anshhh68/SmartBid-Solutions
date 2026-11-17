const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { syncLiveTendersExclusive } = require('../services/tenderSyncService');
const { captureTenders } = require('../services/tenderCapture');

// Keep only fields the Prisma model knows about, so stray form fields can't crash a save
const pick = (obj = {}, keys) => Object.fromEntries(keys.filter(k => obj[k] !== undefined).map(k => [k, obj[k]]));
const slugify = (s = '') => s.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const toInt = (v, d = 0) => (v === undefined || v === '' || isNaN(parseInt(v)) ? d : parseInt(v));

const CATEGORY_FIELDS = ['name', 'slug', 'description', 'icon'];
const SERVICE_FIELDS = ['title', 'slug', 'shortDesc', 'description', 'icon', 'features', 'isActive', 'order'];
const PLAN_FIELDS = ['name', 'slug', 'price', 'period', 'description', 'features', 'isPopular', 'isActive', 'order'];
const TESTIMONIAL_FIELDS = ['name', 'company', 'designation', 'rating', 'content', 'avatar', 'isPublished', 'order'];
const FAQ_FIELDS = ['question', 'answer', 'category', 'order', 'isActive'];
const PAGE_FIELDS = ['title', 'content', 'metaTitle', 'metaDesc', 'isPublished'];
const TENDER_FIELDS = ['title', 'refNo', 'department', 'location', 'state', 'value', 'valueCurrency', 'emd', 'fee',
  'status', 'openingDate', 'closingDate', 'preBidDate', 'tenderType', 'eligibility', 'description', 'sourceUrl',
  'source', 'isPublished'];

function serviceData(body, isCreate) {
  const data = pick(body, SERVICE_FIELDS);
  if (data.order !== undefined) data.order = toInt(data.order);
  if (data.slug !== undefined || isCreate) data.slug = slugify(data.slug || data.title);
  if (isCreate) {
    data.description = data.description || '';
    data.shortDesc = data.shortDesc || data.description.split(/(?<=\.)\s/)[0].slice(0, 200) || data.title;
    data.icon = data.icon || 'ShieldCheck';
    data.features = Array.isArray(data.features) ? data.features : [];
  }
  return data;
}

function planData(body, isCreate) {
  // Frontend sends billingPeriod; Prisma field is period
  const data = pick({ ...body, period: body.billingPeriod || body.period }, PLAN_FIELDS);
  if (data.price !== undefined) data.price = parseFloat(data.price) || 0;
  if (data.order !== undefined) data.order = toInt(data.order);
  if (data.features !== undefined && !Array.isArray(data.features)) data.features = [];
  if (isCreate) {
    data.slug = slugify(data.slug || data.name);
    data.period = data.period || 'monthly';
    data.features = data.features || [];
  }
  return data;
}

function testimonialData(body) {
  // Frontend historically sent `role`; Prisma field is designation
  const data = pick({ ...body, designation: body.designation ?? body.role }, TESTIMONIAL_FIELDS);
  if (data.rating !== undefined) data.rating = Math.min(5, Math.max(1, toInt(data.rating, 5)));
  if (data.order !== undefined) data.order = toInt(data.order);
  return data;
}

function categoryData(body, isCreate) {
  const data = pick(body, CATEGORY_FIELDS);
  if (data.slug !== undefined || isCreate) data.slug = slugify(data.slug || data.name);
  return data;
}

function faqData(body) {
  const data = pick(body, FAQ_FIELDS);
  if (data.order !== undefined) data.order = toInt(data.order);
  return data;
}

function tenderData(body) {
  const data = pick(body, TENDER_FIELDS);
  for (const k of ['value', 'emd', 'fee']) {
    if (data[k] !== undefined) data[k] = data[k] === '' || data[k] === null ? null : parseFloat(data[k]);
  }
  for (const k of ['openingDate', 'closingDate', 'preBidDate']) {
    if (data[k] !== undefined) data[k] = data[k] ? new Date(data[k]) : null;
  }
  if (data.refNo === '') data.refNo = null;
  return data;
}

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
  const { categoryId, documents } = req.body;
  const rest = tenderData(req.body);
  if (!rest.title || !rest.closingDate) {
    return res.status(400).json({ error: 'Tender title and closing date are required' });
  }

  const tender = await prisma.tender.create({
    data: {
      ...rest,
      department: rest.department || 'Not specified',
      location: rest.location || 'Pan India',
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
  const { categoryId, documents } = req.body;
  const rest = tenderData(req.body);
  const existing = await prisma.tender.findUnique({ where: { id: req.params.id }, select: { publishedAt: true } });
  if (!existing) return res.status(404).json({ error: 'Tender not found' });

  const tender = await prisma.tender.update({
    where: { id: req.params.id },
    data: {
      ...rest,
      ...(categoryId !== undefined && { categoryId: categoryId || null }),
      ...(documents !== undefined && { documents: documents || [] }),
      ...(rest.isPublished !== undefined && {
        publishedAt: rest.isPublished ? (existing.publishedAt || new Date()) : null,
      }),
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
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Select at least one tender' });
  }
  await prisma.tender.updateMany({
    where: { id: { in: ids } },
    data: { isPublished: publish, publishedAt: publish ? new Date() : null }
  });
  res.json({ message: `${ids.length} tender(s) ${publish ? 'published' : 'unpublished'}` });
}));

// On-demand sync of live GeM & State portal tenders
router.post('/tenders/sync-live', asyncHandler(async (req, res) => {
  const result = await syncLiveTendersExclusive();
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'SYNC',
      entity: 'Tender',
      metadata: { synced: result.synced, skipped: result.skipped, sources: result.sources }
    }
  });
  const perSource = Object.entries(result.sources)
    .map(([name, r]) => `${name}: ${typeof r === 'number' ? r : 'failed'}`)
    .join(', ');
  res.json({ message: `Synced ${result.synced} live tenders (${result.created} new, ${result.updated} updated) — ${perSource}`, ...result });
}));

// Tenders captured by staff from captcha/login-protected portals via the "Send to SmartBid" bookmark
router.post('/tenders/capture', asyncHandler(async (req, res) => {
  const { pageUrl, rows } = req.body;
  if (!pageUrl || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No captured tenders received' });
  }
  if (rows.length > 2000) {
    return res.status(400).json({ error: 'Too many rows in one capture (max 2000)' });
  }

  const result = await captureTenders(pageUrl, rows);
  await prisma.auditLog.create({
    data: { userId: req.user.id, action: 'CAPTURE', entity: 'Tender', metadata: result }
  });
  res.json({
    message: `Saved ${result.created + result.updated} tenders from ${result.source} (${result.created} new, ${result.updated} updated)`,
    ...result,
  });
}));

// Import tenders from JSON body (CSV processing done client-side)
router.post('/tenders/import', asyncHandler(async (req, res) => {
  const { tenders } = req.body;
  if (!tenders || !Array.isArray(tenders)) {
    return res.status(400).json({ error: 'tenders array required' });
  }

  // Validate every row first, then insert in one query (one insert per row timed out at ~500 rows)
  const errors = [];
  const data = [];
  // An unknown categoryId would fail the whole batch insert; save such rows uncategorised instead
  const categoryIds = new Set((await prisma.tenderCategory.findMany({ select: { id: true } })).map(c => c.id));
  for (const [i, t] of tenders.entries()) {
    const row = tenderData(t);
    if (!row.title || !row.closingDate || isNaN(row.closingDate)) {
      if (errors.length < 5) errors.push(`#${i + 1}: title and a valid closingDate are required`);
      continue;
    }
    data.push({
      ...row,
      department: row.department || 'Not specified',
      location: row.location || 'Pan India',
      categoryId: categoryIds.has(t.categoryId) ? t.categoryId : null,
      documents: Array.isArray(t.documents) ? t.documents : [],
      source: row.source || 'Import',
      isPublished: row.isPublished ?? true,
      publishedAt: row.isPublished === false ? null : new Date(),
    });
  }

  const { count: created } = data.length
    ? await prisma.tender.createMany({ data, skipDuplicates: true })
    : { count: 0 };
  const skipped = tenders.length - created;
  const duplicates = data.length - created;
  if (duplicates) errors.push(`${duplicates} duplicate refNo`);

  res.json({
    message: `Imported ${created} tenders${skipped ? `, skipped ${skipped} (${errors.join('; ')})` : ''}`,
    created, skipped,
  });
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
    data: {
      ...(status && { status }),
      ...(assignedTo !== undefined && { assignedTo: assignedTo || null }),
      ...(notes !== undefined && { notes: notes || null }),
    }
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

// Public registration is closed, so staff accounts are created here. Only ADMIN accounts can log in.
router.post('/users', asyncHandler(async (req, res) => {
  const { name, email, phone, password, role = 'ADMIN' } = req.body;
  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (!['ADMIN', 'USER'].includes(role)) {
    return res.status(400).json({ error: 'Role must be ADMIN or USER' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } })) {
    return res.status(409).json({ error: 'A user with this email already exists' });
  }

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || null,
      role,
      password: await bcrypt.hash(password, 12),
    },
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
  });
  await prisma.auditLog.create({
    data: { userId: req.user.id, action: 'CREATE', entity: 'User', entityId: user.id }
  });
  res.status(201).json({ user });
}));

router.patch('/users/:id/status', asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (req.params.id === req.user.id && isActive === false) {
    return res.status(400).json({ error: 'You cannot deactivate your own account' });
  }
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: Boolean(isActive) },
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
  const updates = req.body || {}; // { key: value }
  await prisma.$transaction(
    Object.entries(updates).map(([key, value]) => prisma.siteSetting.upsert({
      where: { key },
      update: { value: String(value ?? '') },
      create: { key, value: String(value ?? '') }
    }))
  );
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
  if (!req.body.title) return res.status(400).json({ error: 'Service title is required' });
  const service = await prisma.service.create({ data: serviceData(req.body, true) });
  res.status(201).json({ service });
}));

router.put('/services/:id', asyncHandler(async (req, res) => {
  const service = await prisma.service.update({ where: { id: req.params.id }, data: serviceData(req.body, false) });
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
  if (!req.body.name) return res.status(400).json({ error: 'Plan name is required' });
  const plan = await prisma.plan.create({ data: planData(req.body, true) });
  res.status(201).json({ plan });
}));

router.put('/plans/:id', asyncHandler(async (req, res) => {
  const plan = await prisma.plan.update({
    where: { id: req.params.id },
    data: planData(req.body, false)
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
  if (!req.body.name || !req.body.content) return res.status(400).json({ error: 'Name and content are required' });
  const t = await prisma.testimonial.create({ data: testimonialData(req.body) });
  res.status(201).json({ testimonial: t });
}));

router.put('/testimonials/:id', asyncHandler(async (req, res) => {
  const t = await prisma.testimonial.update({ where: { id: req.params.id }, data: testimonialData(req.body) });
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
  if (!req.body.question || !req.body.answer) return res.status(400).json({ error: 'Question and answer are required' });
  const faq = await prisma.faq.create({ data: faqData(req.body) });
  res.status(201).json({ faq });
}));

router.put('/faqs/:id', asyncHandler(async (req, res) => {
  const faq = await prisma.faq.update({ where: { id: req.params.id }, data: faqData(req.body) });
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
  if (!req.body.name) return res.status(400).json({ error: 'Category name is required' });
  const cat = await prisma.tenderCategory.create({ data: categoryData(req.body, true) });
  res.status(201).json({ category: cat });
}));

router.put('/categories/:id', asyncHandler(async (req, res) => {
  const cat = await prisma.tenderCategory.update({ where: { id: req.params.id }, data: categoryData(req.body, false) });
  res.json({ category: cat });
}));

router.delete('/categories/:id', asyncHandler(async (req, res) => {
  // Detach tenders first so the category can be removed without a foreign-key error
  await prisma.tender.updateMany({ where: { categoryId: req.params.id }, data: { categoryId: null } });
  await prisma.tenderCategory.delete({ where: { id: req.params.id } });
  res.json({ message: 'Category deleted' });
}));

// Pages
router.get('/pages', asyncHandler(async (req, res) => {
  const pages = await prisma.page.findMany({ orderBy: { slug: 'asc' } });
  res.json({ pages });
}));

router.put('/pages/:id', asyncHandler(async (req, res) => {
  const page = await prisma.page.update({ where: { id: req.params.id }, data: pick(req.body, PAGE_FIELDS) });
  res.json({ page });
}));

module.exports = router;
