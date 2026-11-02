const crypto = require('crypto');
const { saveTenders, refreshStatuses, getCategoryMap, classifyCategory, detectState } = require('./tenderSyncService');

/**
 * Tenders captured by staff from portals that can't be scraped automatically (captcha/login):
 * the "Send to SmartBid" bookmark reads the table on screen and the admin page posts it here.
 */

// Known portals by hostname; anything else is labelled by its hostname
const PORTALS = {
  'eprocure.gov.in': { source: 'CPPP' },
  'etenders.gov.in': { source: 'CPPP (eTenders)' },
  'www.ireps.gov.in': { source: 'Railway (IREPS)' },
  'ireps.gov.in': { source: 'Railway (IREPS)' },
  'mahatenders.gov.in': { source: 'Maharashtra e-Procurement', state: 'Maharashtra' },
  'eproc.rajasthan.gov.in': { source: 'Rajasthan e-Procurement', state: 'Rajasthan' },
  'etender.up.nic.in': { source: 'Uttar Pradesh e-Procurement', state: 'Uttar Pradesh' },
  'mptenders.gov.in': { source: 'Madhya Pradesh e-Procurement', state: 'Madhya Pradesh' },
  'tntenders.gov.in': { source: 'Tamil Nadu e-Procurement', state: 'Tamil Nadu' },
};

// Railway bodies that publish on CPPP; tagging them lets the site's Railway filter find them
const RAILWAY_ORGS = /railway|\brvnl\b|\bircon\b|railtel|\brites\b|dfccil|metro rail/i;

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
const IST_OFFSET_MS = 330 * 60000;

/**
 * Portal dates are IST: "17-Nov-2026 04:00 PM", "20-11-2026 18:00:00", "17/11/2026 15:00".
 * Without a time, assume end of day so a tender isn't closed early.
 */
function parsePortalDate(text = '') {
  const m = text.match(/(\d{1,2})[-/. ]([A-Za-z]{3}|\d{1,2})[-/. ](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)?)?/i);
  if (!m) return null;
  const [, d, mon, y, h, min, ampm] = m;
  const month = /\d/.test(mon) ? Number(mon) - 1 : MONTHS[mon.toLowerCase()];
  if (month === undefined || month < 0 || month > 11) return null;
  let hour = h === undefined ? 23 : Number(h);
  if (ampm) hour = (hour % 12) + (/pm/i.test(ampm) ? 12 : 0);
  const date = new Date(Date.UTC(Number(y), month, Number(d), hour, h === undefined ? 59 : Number(min)) - IST_OFFSET_MS);
  return isNaN(date) ? null : date;
}

const clean = (s, max = 500) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

function mapCapturedRow(row, portal, host, origin, catMap) {
  if (!row || typeof row !== 'object') return { error: 'invalid row' };
  const title = clean(row.title);
  // Reference numbers can be shared by several tenders; without the portal's unique Tender ID,
  // add a short title hash so they stay separate (and stable across re-captures)
  const refNo = row.tenderId
    ? clean(row.tenderId, 190)
    : row.ref && `${clean(row.ref, 180)}#${crypto.createHash('sha1').update(title).digest('hex').slice(0, 6)}`;
  const closingDate = parsePortalDate(row.closing);
  if (!title || !refNo || !closingDate) return { error: 'missing title, reference or closing date' };
  if (closingDate < new Date()) return { error: 'already closed' };

  // GePNIC organisation chains look like "Ministry||Department||Office"
  const orgParts = clean(row.org, 1000).split('||').map(s => s.trim()).filter(Boolean);
  const department = orgParts.slice(0, 2).join(' / ') || portal.source;
  const state = portal.state || detectState(orgParts.join(' '));
  const source = !/railway/i.test(portal.source) && RAILWAY_ORGS.test(orgParts.join(' '))
    ? `Railway · ${portal.source}`
    : portal.source;
  const value = parseFloat(String(row.value || '').replace(/[^\d.]/g, '')) || null;
  const ref = clean(row.ref, 190);

  return {
    tender: {
      refNo,
      title,
      department,
      location: state || 'Pan India',
      state: state || 'All India',
      value,
      status: 'ACTIVE',
      openingDate: parsePortalDate(row.published),
      closingDate,
      isPublished: true,
      source,
      // Portal links are tied to the browsing session, so point at the portal itself
      sourceUrl: `${origin}/`,
      tenderType: `${portal.source} e-Tender`,
      description: [
        `${title.replace(/[.\s]+$/, '')}.`,
        ref && ref !== refNo && `Reference No: ${ref}.`,
        `Buyer: ${orgParts.join(' / ') || department}.`,
        row.tenderId
          ? `For the full notice, EMD and documents, search Tender ID ${row.tenderId} on ${host}.`
          : `For the full notice, EMD and documents, search reference ${ref} on ${host}.`,
      ].filter(Boolean).join(' '),
      categoryId: classifyCategory(title, department, catMap) || null,
      documents: [],
      eligibility: 'As per tender document on the portal',
    },
  };
}

async function captureTenders(pageUrl, rows) {
  let url;
  try {
    url = new URL(pageUrl);
  } catch {
    const err = new Error('Invalid portal page address');
    err.status = 400;
    throw err;
  }
  const host = url.hostname.toLowerCase();
  const portal = PORTALS[host] || { source: `e-Procurement (${host})` };
  const catMap = await getCategoryMap();

  const tenders = [];
  const reasons = {};
  for (const row of rows) {
    const { tender, error } = mapCapturedRow(row, portal, host, url.origin, catMap);
    if (tender) tenders.push(tender);
    else reasons[error] = (reasons[error] || 0) + 1;
  }

  const { created, updated, skipped: duplicates } = tenders.length
    ? await saveTenders(tenders)
    : { created: 0, updated: 0, skipped: 0 };
  if (duplicates) reasons['duplicate in capture'] = duplicates;
  await refreshStatuses();

  return { source: portal.source, received: rows.length, created, updated, skipped: reasons };
}

module.exports = { captureTenders, parsePortalDate, mapCapturedRow };
