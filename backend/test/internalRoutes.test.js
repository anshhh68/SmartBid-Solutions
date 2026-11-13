const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const internalRoutes = require('../src/routes/internal');

// Only the paths that never reach the real sync (no network, no DB)
async function post(headers = {}) {
  const app = express();
  app.use('/api/internal', internalRoutes);
  app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
  const server = app.listen(0);
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/internal/sync-tenders`, { method: 'POST', headers });
    return res.status;
  } finally {
    server.close();
  }
}

test('sync-tenders is 404 when CRON_SECRET is unset', async () => {
  delete process.env.CRON_SECRET;
  assert.equal(await post({ 'x-cron-secret': 'anything' }), 404);
});

test('sync-tenders rejects missing or wrong secret with 401', async () => {
  process.env.CRON_SECRET = 'test-secret';
  try {
    assert.equal(await post(), 401);
    assert.equal(await post({ 'x-cron-secret': 'wrong' }), 401);
    assert.equal(await post({ 'x-cron-secret': 'test-secreX' }), 401); // same length
  } finally {
    delete process.env.CRON_SECRET;
  }
});
