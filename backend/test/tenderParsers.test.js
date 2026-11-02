const test = require('node:test');
const assert = require('node:assert');
const { parsePortalDate, mapCapturedRow } = require('../src/services/tenderCapture');
const { parseRow } = require('../src/services/tenderSources/nprocure');

// Portal times are IST (UTC+5:30); stored dates must be real UTC
test('parsePortalDate reads every portal format as IST', () => {
  assert.strictEqual(parsePortalDate('17-Nov-2026 04:00 PM').toISOString(), '2026-11-17T10:30:00.000Z');
  assert.strictEqual(parsePortalDate('20-11-2026 18:00:00').toISOString(), '2026-11-20T12:30:00.000Z');
  assert.strictEqual(parsePortalDate('17/11/2026 15:00').toISOString(), '2026-11-17T09:30:00.000Z');
  assert.strictEqual(parsePortalDate('12-Nov-2026 12:30 AM').toISOString(), '2026-11-11T19:00:00.000Z');
  // No time: end of day, so a tender isn't closed early
  assert.strictEqual(parsePortalDate('01-Dec-2026').toISOString(), '2026-12-01T18:29:00.000Z');
  assert.strictEqual(parsePortalDate('garbage'), null);
});

const portal = { source: 'CPPP' };
const base = { title: 'Supply of Laptops', closing: '17-Nov-2099 04:00 PM', org: 'Ministry of Railways||RVNL||Office' };

test('mapCapturedRow keeps tenders that share a reference number apart', () => {
  const a = mapCapturedRow({ ...base, ref: 'ENHD/805' }, portal, 'eprocure.gov.in', 'https://eprocure.gov.in', {}).tender;
  const b = mapCapturedRow({ ...base, title: 'Road work', ref: 'ENHD/805' }, portal, 'eprocure.gov.in', 'https://eprocure.gov.in', {}).tender;
  assert.match(a.refNo, /^ENHD\/805#[0-9a-f]{6}$/);
  assert.notStrictEqual(a.refNo, b.refNo);
  // Same row captured again → same refNo, so it updates instead of duplicating
  assert.strictEqual(mapCapturedRow({ ...base, ref: 'ENHD/805' }, portal, 'x', 'https://x', {}).tender.refNo, a.refNo);
});

test('mapCapturedRow prefers the Tender ID and tags railway buyers', () => {
  const { tender } = mapCapturedRow({ ...base, ref: 'R1', tenderId: '2026_RVNL_1_1' }, portal, 'eprocure.gov.in', 'https://eprocure.gov.in', {});
  assert.strictEqual(tender.refNo, '2026_RVNL_1_1');
  assert.strictEqual(tender.source, 'Railway · CPPP');
  assert.strictEqual(tender.department, 'Ministry of Railways / RVNL');
});

test('mapCapturedRow rejects bad rows instead of crashing', () => {
  assert.deepStrictEqual(mapCapturedRow(null, portal, 'x', 'https://x', {}), { error: 'invalid row' });
  assert.ok(mapCapturedRow({ ...base, ref: 'X', closing: '01-Jan-2020 10:00 AM' }, portal, 'x', 'https://x', {}).error);
  assert.ok(mapCapturedRow({ title: 'No ref', closing: base.closing }, portal, 'x', 'https://x', {}).error);
});

test('nProcure parseRow reads a real table row', () => {
  const row = parseRow({
    1: 'RMC /ENGG/EZ/26-27/98',
    2: "<html><body><span style=color:#f44336; >RMC-Rajkot Municipal Corporation<form action='/view-nit-home' method='POST'><input type='hidden' name='tenderid' id='tenderid_361995' value='361995'/>\n<a href='#'>Tender Id :361995</a></form></span><span><form><a href='#'><strong style='color: maroon;'>Name Of Work :</strong>DISPOSAL OF DRAINAGE &amp; COMPLAINS</a></form></span>\n<p> Estimated Contract Value : 3300000.00\n<p> Last Date & Time For Submission : 20-11-2026 18:00:00</body></html>",
  });
  assert.deepStrictEqual(row, {
    tenderId: '361995',
    noticeNo: 'RMC /ENGG/EZ/26-27/98',
    department: 'RMC-Rajkot Municipal Corporation',
    title: 'DISPOSAL OF DRAINAGE & COMPLAINS',
    value: 3300000,
    closingDate: new Date('2026-11-20T12:30:00.000Z'),
  });
});
