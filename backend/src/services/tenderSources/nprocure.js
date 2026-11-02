const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const path = require('path');
const tls = require('tls');

/**
 * nProcure (tender.nprocure.com) — Gujarat state e-procurement.
 * Reads the public "Tenders In Progress" table shown on the home page (no login, no captcha).
 */
const NPROCURE_BASE = 'https://tender.nprocure.com';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const PAGE_SIZE = 150; // largest page size the portal's own table offers

// The server omits its intermediate certificate. Supply that public Sectigo intermediate
// (downloaded from the certificate's own AIA link) so Node can still fully verify the chain.
const CA = [
  ...tls.rootCertificates,
  fs.readFileSync(path.join(__dirname, 'certs/sectigo-public-server-ca-ov-r36.pem'), 'utf8'),
];

function request(url, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method,
      ca: CA,
      timeout: 30000,
      headers: { 'User-Agent': USER_AGENT, ...headers, ...(body && { 'Content-Length': Buffer.byteLength(body) }) },
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, text: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('nProcure request timed out')));
    if (body) req.write(body);
    req.end();
  });
}

// The page wraps table requests in AES with a key it generates and sends along (AesUtil.js):
// PBKDF2-SHA1(passphrase, salt, 1000 iterations, 128-bit) + AES-128-CBC.
function encodeRequest(payload) {
  const passphrase = crypto.randomBytes(4).toString('hex').slice(0, 5);
  const salt = crypto.randomBytes(16).toString('hex');
  const iv = crypto.randomBytes(16).toString('hex');
  const key = crypto.pbkdf2Sync(passphrase, Buffer.from(salt, 'hex'), 1000, 16, 'sha1');
  const cipher = crypto.createCipheriv('aes-128-cbc', key, Buffer.from(iv, 'hex'));
  const jsonData = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]).toString('base64');
  return JSON.stringify({ jsonData, iv, salt, key: Buffer.from(passphrase).toString('base64') });
}

const decode = (s = '') => s
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// One table row → plain fields. Column "2" is an HTML blob with the details.
function parseRow(row) {
  const html = row['2'] || '';
  const tenderId = html.match(/tenderid_(\d+)/)?.[1];
  const closing = html.match(/Last Date & Time For Submission :\s*(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})/);
  if (!tenderId || !closing) return null;

  const [, d, m, y, hh, mm] = closing.map(Number);
  return {
    tenderId,
    noticeNo: decode(row['1']),
    department: decode(html.match(/<span[^>]*>([^<]*)<form/)?.[1]),
    title: decode(html.match(/Name Of Work :<\/strong>([\s\S]*?)<\/a>/)?.[1]),
    value: parseFloat(html.match(/Estimated Contract Value :\s*([\d.]+)/)?.[1]) || null,
    // Portal times are IST
    closingDate: new Date(Date.UTC(y, m - 1, d, hh, mm) - 330 * 60000),
  };
}

/**
 * Fetch the newest tenders in progress. Throws if the portal returns nothing usable.
 */
async function fetchNprocureRows(maxTenders = 450) {
  const home = await request(`${NPROCURE_BASE}/`);
  if (home.status !== 200) throw new Error(`nProcure responded with HTTP ${home.status}`);
  const cookies = (home.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');

  const rows = [];
  for (let start = 0; start < maxTenders; start += PAGE_SIZE) {
    const reqData = [
      { name: 'sEcho', value: 1 },
      { name: 'iColumns', value: 3 },
      { name: 'iDisplayStart', value: start },
      { name: 'iDisplayLength', value: PAGE_SIZE },
    ];
    const res = await request(`${NPROCURE_BASE}/beforeLoginTenderTableList`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', Cookie: cookies, Referer: `${NPROCURE_BASE}/` },
      // The public page's CSRF meta tag is empty, so the browser sends an empty token too
      body: encodeRequest({ reqData, _csrf: '', idList: '0', id: 'Tenders In Progress' }),
    });
    if (res.status !== 200) throw new Error(`nProcure tender list responded with HTTP ${res.status}`);

    const page = JSON.parse(res.text).data || [];
    rows.push(...page.map(parseRow).filter(Boolean));
    if (page.length < PAGE_SIZE) break;
  }

  if (rows.length === 0) throw new Error('nProcure returned no tenders');
  return rows;
}

module.exports = { fetchNprocureRows, parseRow, NPROCURE_BASE };
