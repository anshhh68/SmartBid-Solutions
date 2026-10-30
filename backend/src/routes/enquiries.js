const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendEnquiryNotificationToAdmin } = require('../services/emailService');

// POST /api/enquiries — Submit enquiry (public)
router.post('/', asyncHandler(async (req, res) => {
  const { name, email, phone, service, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (e) {}
  }

  const enquiry = await prisma.enquiry.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      service: service?.trim() || null,
      subject: subject?.trim() || null,
      message: message.trim(),
      status: 'NEW',
      ...(userId && { userId }),
    }
  });

  // Dispatch email notification to Kinjal Modi
  sendEnquiryNotificationToAdmin(enquiry).catch(() => {});

  res.status(201).json({ message: 'Enquiry submitted successfully. We will contact you shortly.', enquiry: { id: enquiry.id } });
}));

// GET /api/enquiries/mine — User's own enquiries
router.get('/mine', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Not authenticated' });

  const jwt = require('jsonwebtoken');
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

  const enquiries = await prisma.enquiry.findMany({
    where: {
      OR: [
        { userId: decoded.userId },
        ...(user?.email ? [{ email: user.email.toLowerCase() }] : [])
      ]
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ enquiries });
}));

module.exports = router;
