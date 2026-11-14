const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');
const { logger } = require('../utils/logger');

// JWT_EXPIRES_IN like "7d" or "12h"; anything else (e.g. a bare "7", which would mean 7 ms) falls back to 7 days
const SESSION_LENGTH = /^\d+[smhd]$/.test(process.env.JWT_EXPIRES_IN || '') ? process.env.JWT_EXPIRES_IN : '7d';

// Public customer registration is disabled. Staff accounts are created internally.
router.post('/register', asyncHandler(async (_req, res) => {
  return res.status(403).json({
    error: 'Public registration is closed. Call or WhatsApp SmartBid Solutions to work with us.',
  });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'Your account has been deactivated. Contact support.' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Staff access only' });
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: SESSION_LENGTH });

  const { password: _, ...safeUser } = user;
  logger.info(`Admin logged in: ${user.email}`);
  res.json({ message: 'Login successful', user: safeUser, token });
}));

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { password: true } });
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: await bcrypt.hash(newPassword, 12) },
  });
  res.json({ message: 'Password changed successfully' });
}));

module.exports = router;
