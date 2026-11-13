const prisma = require('../utils/prisma');
const { logger } = require('../utils/logger');
const { fetchNprocureRows, NPROCURE_BASE } = require('./tenderSources/nprocure');

const GEM_BASE = 'https://bidplus.gem.gov.in';
const GEM_SOURCE = 'GeM Portal';
const NPROCURE_SOURCE = 'nProcure (Gujarat)';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const REQUEST_TIMEOUT = 20000;
const MAX_RETRIES = 3;

// Ordered by priority; word boundaries avoid false hits like "car" in "cartridge"
const CATEGORY_RULES = [
  ['it-technology', /\b(software|computers?|laptops?|desktops?|printers?|cctv|servers?|network(ing)?|ups|scanners?|monitors?|hardware|hard disk|ssd|nvr|surveillance|camera|network switch|router|tablet pc|operating system|windows \d+|ms office|antivirus|it)\b/i],
  ['medical', /\b(medical|hospital|medicines?|drugs?|infusion|ventilators?|health|pharma\w*|tablets?|capsules?|injections?|surgical|syrup|drops|diagnostic|reagents?)\b/i],
  ['printing', /\b(printing|paper|stationery|booklets?|answer sheets?|cartridges?|toner)\b/i],
  ['energy', /\b(solar|power|transformers?|cables?|electric\w*|energy|generators?|dg set|batter(y|ies)|lighting|luminaires?|led lights?)\b/i],
  ['construction', /\b(roads?|bridges?|drainage|civil|buildings?|construction|concrete|pipes?|asphalt|rcc|cement|painting|paint|repair works?)\b/i],
  ['transportation', /\b(vehicles?|bus(es)?|transport\w*|trucks?|cars?|cng|taxi|hiring of vehicles?|fuel|tyres?)\b/i],
  ['agriculture', /\b(agricultur\w*|fertili[sz]ers?|seeds?|irrigation|crops?|pesticides?)\b/i],
  ['consultancy', /\b(consult\w*|audit|facility management|housekeeping|manpower|counsel\w*|outsourc\w*)\b/i],
  ['defence', /\b(defence|military|army|navy|air force|ammunition|weapons?|bollards?|bullet ?proof)\b/i],
];

/**
 * Intelligent category classifier: the bid title decides first, the department only as a fallback
 * (otherwise everything bought by e.g. the Department of Military Affairs becomes "defence").
 */
function classifyCategory(title = '', dept = '', catMap = {}) {
  for (const text of [title, dept]) {
    for (const [slug, re] of CATEGORY_RULES) {
      if (re.test(text) && catMap[slug]) return catMap[slug];
    }
  }
  return catMap['supply'] || null;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar', 'Chandigarh',
  'Dadra and Nagar Haveli', 'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

// State-government buyers carry the state name in the department, e.g. "Revenue Department Gujarat"
function detectState(...texts) {
  const text = texts.join(' ').toLowerCase().replace(/&/g, 'and');
  return INDIAN_STATES.find(s => text.includes(s.toLowerCase())) || null;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// GeM returns IST wall-clock times labelled as UTC ("...Z"); shift to real UTC
const IST_OFFSET_MS = 330 * 60000;
const gemDate = (v) => (v ? new Date(new Date(v).getTime() - IST_OFFSET_MS) : null);

/**
 * Run fn with retries and linear backoff
 */
async function withRetry(label, fn) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      logger.warn(`⚠️ ${label} failed (attempt ${attempt}/${MAX_RETRIES}): ${err.message}`);
      if (attempt < MAX_RETRIES) await sleep(1500 * attempt);
    }
  }
  throw lastErr;
}

/**
 * Open a GeM session: returns cookie header + CSRF token
 */
async function openGemSession() {
  const res = await fetch(`${GEM_BASE}/all-bids`, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT)
  });
  if (!res.ok) throw new Error(`GeM portal responded with HTTP ${res.status}`);

  const html = await res.text();
  // Only send back name=value pairs, not cookie attributes (path, domain, expires...)
  const cookies = (res.headers.getSetCookie?.() || [])
    .map(c => c.split(';')[0])
    .join('; ');

  const csrfMatch = html.match(/['"]csrf_bd_gem_nk['"]\s*[:,]\s*['"]([a-f0-9]+)['"]/i)
    || html.match(/name=['"]csrf_bd_gem_nk['"]\s+value=['"]([a-f0-9]+)['"]/i);
  if (!csrfMatch) throw new Error('Could not extract CSRF security token from GeM portal');

  return { cookies, csrfToken: csrfMatch[1] };
}

async function fetchGemPage(session, page) {
  const payload = {
    page,
    param: { searchBid: '', searchType: 'fullText' },
    filter: {
      bidStatusType: 'ongoing_bids',
      byType: 'all',
      highBidValue: '',
      byEndDate: { from: '', to: '' },
      sort: 'Bid-Start-Date-Latest'
    }
  };

  const body = new URLSearchParams();
  body.append('payload', JSON.stringify(payload));
  body.append('csrf_bd_gem_nk', session.csrfToken);

  const res = await fetch(`${GEM_BASE}/all-bids-data`, {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': `${GEM_BASE}/all-bids`,
      'Cookie': session.cookies,
    },
    body: body.toString(),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  if (data?.code !== 200) throw new Error(`GeM API returned code ${data?.code}: ${data?.message || 'unknown'}`);
  return {
    docs: data.response?.response?.docs || [],
    numFound: data.response?.response?.numFound || 0,
  };
}

/**
 * The newest-first listing starts with hundreds of reverse auctions scheduled for the
 * coming days; freshly published, already-open bids only begin after them.
 * Binary search for the first page whose bids have already started.
 */
async function findFirstLivePage(getPage) {
  const isLive = (docs) => {
    const start = gemDate(docs[0]?.final_start_date_sort?.[0]);
    return !start || start <= new Date();
  };

  const first = await getPage(1);
  if (isLive(first.docs)) return 1;

  let lo = 1; // known not live
  let hi = Math.max(2, Math.ceil(first.numFound / 10));
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    const { docs } = await getPage(mid);
    if (docs.length === 0 || isLive(docs)) hi = mid;
    else lo = mid;
  }
  return hi;
}

/**
 * Fetch real ongoing bids directly from GeM Portal (bidplus.gem.gov.in).
 * Throws if no bids could be fetched at all, so callers never report a fake "success".
 */
async function fetchDirectFromGeM(targetBids = 50, maxPages = 30) {
  logger.info('📡 Connecting to GeM portal (bidplus.gem.gov.in)...');
  let session = await withRetry('GeM session', openGemSession);
  logger.info('🔐 Acquired GeM portal session & security token.');

  const getPage = (page) => withRetry(`GeM page ${page}`, async () => {
    try {
      return await fetchGemPage(session, page);
    } catch (err) {
      // Session/CSRF may have expired — refresh before the next attempt
      session = await openGemSession();
      throw err;
    }
  });

  const startPage = await findFirstLivePage(getPage);
  logger.info(`🔎 Newest live bids begin at GeM listing page ${startPage}.`);

  // Keep only regular bids (GEM/yyyy/B/...). Reverse auctions are follow-ups restricted to
  // vendors already qualified in the parent bid, so they are not open opportunities.
  const allDocs = [];
  for (let page = startPage; page < startPage + maxPages && allDocs.length < targetBids; page++) {
    try {
      const { docs } = await getPage(page);
      if (docs.length === 0) break;
      allDocs.push(...docs.filter(d => /\/B\//.test(d.b_bid_number?.[0] || '')));
    } catch (err) {
      logger.warn(`⚠️ Giving up on GeM page ${page}: ${err.message}`);
    }
  }

  if (allDocs.length === 0) {
    throw new Error('GeM portal returned no bids (portal may be down or blocking requests)');
  }

  logger.info(`📥 Retrieved ${allDocs.length} genuine ongoing bids directly from GeM.`);
  return allDocs;
}

/**
 * Document URL logic mirrors GeM's own listing page
 */
function gemDocUrl(doc) {
  const bidId = doc.b_id?.[0];
  if (!bidId) return `${GEM_BASE}/all-bids`;
  const bidType = doc.b_bid_type?.[0];
  let path = 'showbidDocument';
  if (bidType === 5) path = 'showdirectradocumentPdf';
  else if (bidType === 2) path = doc.b_eval_type?.[0] > 0 ? 'list-ra-schedules' : 'showradocumentPdf';
  return `${GEM_BASE}/${path}/${bidId}`;
}

function mapGemDoc(doc, catMap) {
  const refNo = doc.b_bid_number?.[0];
  if (!refNo) return null;

  const title = doc.b_category_name?.[0] || 'Government Procurement Notice';
  const ministry = doc.ba_official_details_minName?.[0] || '';
  const deptName = doc.ba_official_details_deptName?.[0] || '';
  const department = deptName && deptName !== 'NA' ? deptName : (ministry || 'Government of India');

  const state = detectState(department, ministry);
  const quantity = doc.b_total_quantity?.[0] || 1;
  const sourceUrl = gemDocUrl(doc);
  const openingDate = gemDate(doc.final_start_date_sort?.[0]) || new Date();
  const closingDate = gemDate(doc.final_end_date_sort?.[0]) || new Date(Date.now() + 7 * 86400000);

  // Bid numbers encode the type: GEM/2026/B/... = bid, GEM/2026/R/... = reverse auction
  const isRA = /\/R\//.test(refNo);
  const parentBid = doc.b_bid_number_parent?.[0];
  const flags = [
    doc.ba_is_global_tendering?.[0] === 1 && 'Global Tender',
    doc.ba_is_limited_tendering?.[0] === 1 && 'Limited Tender',
    doc.is_rc_bid?.[0] === 1 && 'Rate Contract',
    doc.bd_details_is_boq?.[0] === 1 && 'BOQ',
  ].filter(Boolean);
  const tenderType = [isRA ? 'Reverse Auction (RA)' : 'GeM Bid', ...flags].join(' · ');

  const descParts = [
    `Official GeM procurement: ${title.replace(/[.\s]+$/, '')}.`,
    `Total quantity: ${quantity}.`,
    `Buyer: ${department}${ministry && ministry !== department ? `, ${ministry}` : ''}.`,
    isRA && parentBid && parentBid !== refNo && `Reverse auction arising from bid ${parentBid}; open only to bidders technically qualified in that bid.`,
    doc.is_high_value?.[0] === true && 'High value bid (estimated value ₹2 Cr or more).',
    'Full specifications, EMD and eligibility criteria are in the official bid document.',
  ].filter(Boolean);

  return {
    refNo,
    title,
    department,
    location: state || 'Pan India',
    state: state || 'All India',
    status: openingDate > new Date() ? 'UPCOMING' : 'ACTIVE',
    openingDate,
    closingDate,
    isPublished: true,
    source: GEM_SOURCE,
    sourceUrl,
    tenderType,
    description: descParts.join(' '),
    categoryId: classifyCategory(title, department, catMap) || null,
    documents: [{ name: isRA ? 'Official_GeM_RA_Document.pdf' : 'Official_GeM_Bid_Document.pdf', url: sourceUrl }],
    eligibility: 'Registered GeM Vendors / OEMs conforming to technical specifications',
  };
}

function mapNprocureRow(row, catMap) {
  const valueText = row.value ? ` Estimated contract value: ₹${row.value.toLocaleString('en-IN')}.` : '';
  return {
    // Notice numbers repeat across departments; the portal's Tender ID is unique
    refNo: `NPROCURE/${row.tenderId}`,
    title: row.title || 'Gujarat Government e-Tender',
    department: row.department || 'Government of Gujarat',
    location: 'Gujarat',
    state: 'Gujarat',
    value: row.value,
    status: 'ACTIVE',
    openingDate: null,
    closingDate: row.closingDate,
    isPublished: true,
    source: NPROCURE_SOURCE,
    // Notices open only through a form POST on the portal, so link its home page + Tender ID
    sourceUrl: `${NPROCURE_BASE}/`,
    tenderType: 'nProcure e-Tender',
    description: `Gujarat government e-tender: ${row.title.replace(/[.\s]+$/, '')}. Notice No: ${row.noticeNo}. Buyer: ${row.department}.${valueText} For the full notice, EMD and documents, search Tender ID ${row.tenderId} on tender.nprocure.com.`,
    categoryId: classifyCategory(row.title, row.department, catMap) || null,
    documents: [],
    eligibility: 'As per tender notice on nProcure',
  };
}

// Each source fetches independently; one portal being down doesn't block the others
const SOURCES = [
  { name: GEM_SOURCE, fetch: async (catMap) => (await fetchDirectFromGeM(50)).map(d => mapGemDoc(d, catMap)) },
  { name: NPROCURE_SOURCE, fetch: async (catMap) => (await withRetry('nProcure', () => fetchNprocureRows(450))).map(r => mapNprocureRow(r, catMap)) },
];

/**
 * Synchronize live tenders from every source (GeM + nProcure).
 * DB writes are batched (one insert + one update query) to keep the request fast.
 */
async function syncLiveTenders() {
  logger.info('🚀 Initiating Live Tender Sync...');

  const catMap = await getCategoryMap();
  const results = await Promise.allSettled(SOURCES.map(s => s.fetch(catMap)));
  const fetched = [];
  const sources = {};
  const okSources = [];
  results.forEach((r, i) => {
    const { name } = SOURCES[i];
    if (r.status === 'fulfilled') {
      fetched.push(...r.value.filter(Boolean));
      sources[name] = r.value.length;
      okSources.push(name);
    } else {
      sources[name] = `failed: ${r.reason.message}`;
      logger.error(`❌ ${name} sync failed: ${r.reason.message}`);
    }
  });

  if (okSources.length === 0) {
    const err = new Error(`Tender sync failed: ${Object.entries(sources).map(([n, e]) => `${n} ${e}`).join('; ')}`);
    err.status = 502; // upstream failure — surface the real message to the admin UI
    throw err;
  }

  const { created, updated, skipped } = await saveTenders(fetched);
  const closed = await refreshStatuses();

  const synced = created + updated;
  logger.info(`✅ Live Tender Sync completed: ${created} new, ${updated} updated, ${closed} closed, ${skipped} skipped. Sources: ${JSON.stringify(sources)}`);
  return { success: true, synced, created, updated, closed, skipped, total: fetched.length, sources };
}

async function getCategoryMap() {
  const categories = await prisma.tenderCategory.findMany();
  return Object.fromEntries(categories.map(c => [c.slug, c.id]));
}

/**
 * Insert new tenders and refresh existing ones (matched by refNo) in two batch queries.
 */
async function saveTenders(list) {
  // Dedupe by refNo (pages can overlap while new bids are being published)
  const byRef = new Map(list.map(t => [t.refNo, t]));
  const tenders = [...byRef.values()];
  const skipped = list.length - tenders.length;

  const existing = await prisma.tender.findMany({
    where: { refNo: { in: tenders.map(t => t.refNo) } },
    select: { refNo: true }
  });
  const existingRefs = new Set(existing.map(e => e.refNo));
  const toCreate = tenders.filter(t => !existingRefs.has(t.refNo));
  const toUpdate = tenders.filter(t => existingRefs.has(t.refNo));

  let created = 0;
  if (toCreate.length) {
    const res = await prisma.tender.createMany({
      data: toCreate.map(t => ({ ...t, publishedAt: new Date() })),
      skipDuplicates: true,
    });
    created = res.count;
  }

  let updated = 0;
  if (toUpdate.length) {
    updated = await prisma.$executeRaw`
      UPDATE "tenders" AS t SET
        "title" = x."title",
        "department" = x."department",
        "location" = x."location",
        "state" = x."state",
        "value" = COALESCE(x."value", t."value"),
        -- Keep admin decisions: cancelled/awarded or unpublished tenders stay that way
        "status" = CASE WHEN t."status" IN ('AWARDED', 'CANCELLED') OR NOT t."isPublished"
                        THEN t."status" ELSE x."status"::"TenderStatus" END,
        "openingDate" = x."openingDate"::timestamp,
        "closingDate" = x."closingDate"::timestamp,
        "source" = x."source",
        "sourceUrl" = x."sourceUrl",
        "tenderType" = x."tenderType",
        "description" = x."description",
        "categoryId" = x."categoryId",
        -- Sources without document links must not wipe documents the admin attached
        "documents" = CASE WHEN jsonb_array_length(x."documents") = 0 THEN t."documents" ELSE x."documents" END,
        "updatedAt" = NOW()
      FROM jsonb_to_recordset(${JSON.stringify(toUpdate)}::jsonb) AS x(
        "refNo" text, "title" text, "department" text, "location" text, "state" text, "value" float8, "status" text,
        "openingDate" text, "closingDate" text, "source" text, "sourceUrl" text,
        "tenderType" text, "description" text, "categoryId" text, "documents" jsonb
      )
      WHERE t."refNo" = x."refNo"`;
  }

  return { created, updated, skipped };
}

/**
 * Move tenders along their lifecycle without re-fetching them: past the deadline → CLOSED,
 * started and not yet closed → ACTIVE. Returns how many were closed.
 */
async function refreshStatuses() {
  const now = new Date();
  const closed = await prisma.tender.updateMany({
    where: { status: { in: ['ACTIVE', 'UPCOMING'] }, closingDate: { lt: now } },
    data: { status: 'CLOSED' }
  });
  await prisma.tender.updateMany({
    where: { status: 'UPCOMING', openingDate: { lte: now }, closingDate: { gte: now } },
    data: { status: 'ACTIVE' }
  });
  return closed.count;
}

// Cron + /api/internal/sync-tenders share this lock so overlapping runs get 409 instead of syncing twice
let syncRunning = false;
async function syncLiveTendersExclusive() {
  if (syncRunning) {
    const err = new Error('Tender sync already running');
    err.status = 409;
    throw err;
  }
  syncRunning = true;
  try {
    return await syncLiveTenders();
  } finally {
    syncRunning = false;
  }
}

module.exports = { syncLiveTenders, syncLiveTendersExclusive, saveTenders, refreshStatuses, getCategoryMap, classifyCategory, detectState };
