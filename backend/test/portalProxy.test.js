const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { proxyRequest } = require('../src/services/tenderSources/portalProxy');

// Fake relay: records the request it got and answers with the given status + JSON body
async function withFakeRelay(status, reply, fn) {
  let seen;
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      seen = { headers: req.headers, body: JSON.parse(body) };
      res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(reply));
    });
  });
  await new Promise((r) => server.listen(0, r));
  process.env.PORTAL_PROXY_URL = `http://127.0.0.1:${server.address().port}/`;
  process.env.PORTAL_PROXY_SECRET = 'abc123\n'; // dashboards add trailing newlines
  try {
    return await fn(() => seen);
  } finally {
    server.close();
    delete process.env.PORTAL_PROXY_URL;
    delete process.env.PORTAL_PROXY_SECRET;
  }
}

test('proxyRequest pins Mumbai, trims the secret and maps the reply', async () => {
  await withFakeRelay(200, { status: 200, setCookies: ['a=1; Path=/'], body: '<html>' }, async (seen) => {
    const res = await proxyRequest('https://bidplus.gem.gov.in/all-bids', { headers: { Cookie: 'x=1' } });
    assert.deepEqual(res, { status: 200, setCookies: ['a=1; Path=/'], text: '<html>' });
    assert.equal(seen().headers['x-region'], 'ap-south-1');
    assert.equal(seen().headers['x-proxy-secret'], 'abc123');
    assert.equal(seen().body.url, 'https://bidplus.gem.gov.in/all-bids');
    assert.equal(seen().body.headers.Cookie, 'x=1');
  });
});

test('proxyRequest throws the relay error instead of returning an empty page', async () => {
  await withFakeRelay(502, { error: 'TypeError: error sending request' }, async () => {
    await assert.rejects(proxyRequest('https://tender.nprocure.com/'), /Portal proxy: TypeError: error sending request/);
  });
  await withFakeRelay(403, { error: 'forbidden' }, async () => {
    await assert.rejects(proxyRequest('https://tender.nprocure.com/'), /forbidden/);
  });
});
