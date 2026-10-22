const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const tenderRoutes = require('./routes/tenders');
const enquiryRoutes = require('./routes/enquiries');
const serviceRoutes = require('./routes/services');
const planRoutes = require('./routes/plans');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');

const { errorHandler } = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again later' }
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) }
}));

// Static file serving (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenders', tenderRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const cron = require('node-cron');
const { syncLiveTenders } = require('./services/tenderSyncService');

app.listen(PORT, () => {
  logger.info(`SmartBid API running on port ${PORT}`);

  // Auto-sync live GeM & State portal tenders every morning at 06:00 AM IST
  cron.schedule('0 6 * * *', async () => {
    try {
      logger.info('⏰ Running scheduled morning tender synchronization...');
      await syncLiveTenders();
    } catch (e) {
      logger.error('Error during scheduled tender sync: ' + e.message);
    }
  });
  logger.info('📅 Live tender cron job scheduled for daily 06:00 AM execution');
});

module.exports = app;
