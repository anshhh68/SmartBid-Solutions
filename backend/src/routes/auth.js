const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

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

  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

  const { password: _, ...safeUser } = user;
  logger.info(`Admin logged in: ${user.email}`);
  res.json({ message: 'Login successful', user: safeUser, token });
}));

// GET /api/auth/me
router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, isActive: true }
  });

  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  res.json({ user });
}));

// PUT /api/auth/profile
router.put('/profile', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const { name, phone } = req.body;
  const user = await prisma.user.update({
    where: { id: decoded.userId },
    data: { name: name?.trim(), phone: phone?.trim() },
    select: { id: true, name: true, email: true, phone: true, role: true }
  });
  res.json({ message: 'Profile updated', user });
}));

// POST /api/auth/change-password
router.post('/change-password', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Invalid password data' });
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: decoded.userId }, data: { password: hashed } });
  res.json({ message: 'Password changed successfully' });
}));

module.exports = router;
