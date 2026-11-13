const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { syncLiveTendersExclusive } = require('../services/tenderSyncService');

const secretMatches = (given, secret) => {
  const a = Buffer.from(String(given || ''));
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// POST /api/internal/sync-tenders — for external schedulers (GitHub Actions) when the host sleeps.
// Disabled (falls through to 404) unless CRON_SECRET is set. Runs synchronously and returns the sync result.
router.post('/sync-tenders', asyncHandler(async (req, res, next) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return next();
  if (!secretMatches(req.get('x-cron-secret'), secret)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json(await syncLiveTendersExclusive());
}));

module.exports = router;
