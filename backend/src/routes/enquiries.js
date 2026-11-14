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

  const enquiry = await prisma.enquiry.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      service: service?.trim() || null,
      subject: subject?.trim() || null,
      message: message.trim(),
      status: 'NEW',
    }
  });

  sendEnquiryNotificationToAdmin(enquiry).catch(() => {});

  res.status(201).json({ message: 'Enquiry submitted successfully. We will contact you shortly.', enquiry: { id: enquiry.id } });
}));

module.exports = router;
