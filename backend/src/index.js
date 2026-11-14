const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const tenderRoutes = require('./routes/tenders');
const enquiryRoutes = require('./routes/enquiries');
const serviceRoutes = require('./routes/services');
const planRoutes = require('./routes/plans');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');
const internalRoutes = require('./routes/internal');

const { errorHandler } = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

const app = express();
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
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

// Body parsing: only admin bulk import/capture needs big bodies; public routes keep the 100kb default
app.use('/api/admin', express.json({ limit: '10mb' }));
app.use(express.json());

// Logging
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) }
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenders', tenderRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/internal', internalRoutes);

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
const { syncLiveTendersExclusive } = require('./services/tenderSyncService');

app.listen(PORT, () => {
  logger.info(`SmartBid API running on port ${PORT}`);

  // Hosts that sleep (e.g. Render free) set DISABLE_INTERNAL_CRON=true and trigger /api/internal/sync-tenders instead
  if (process.env.DISABLE_INTERNAL_CRON === 'true') {
    logger.info('📅 Internal tender cron disabled (DISABLE_INTERNAL_CRON=true)');
    return;
  }

  // Auto-sync live GeM & State portal tenders every morning at 06:00 (server time, or CRON_TZ if set)
  cron.schedule('0 6 * * *', async () => {
    try {
      logger.info('⏰ Running scheduled morning tender synchronization...');
      await syncLiveTendersExclusive();
    } catch (e) {
      logger.error('Error during scheduled tender sync: ' + e.message);
    }
  }, process.env.CRON_TZ ? { timezone: process.env.CRON_TZ } : undefined);
  logger.info('📅 Live tender cron job scheduled for daily 06:00 AM execution');
});

module.exports = app;
