const prisma = require('../utils/prisma');
const { logger } = require('../utils/logger');

/**
 * Intelligent category classifier based on bid titles and departments
 */
function classifyCategory(title = '', dept = '', catMap = {}) {
  const text = `${title} ${dept}`.toLowerCase();

  if (text.match(/software|computer|laptop|printer|cctv|server|network|ups|scanner|display|led monitor|it |hardware/i)) {
    return catMap['it-technology'];
  }
  if (text.match(/medical|hospital|medicine|drug|infusion|ventilator|doctor|health|pharma|tablet|capsule|surgical/i)) {
    return catMap['medical'];
  }
  if (text.match(/defence|military|army|navy|air force|police|security|bollard|weapon|ammunition|uniform/i)) {
    return catMap['defence'];
  }
  if (text.match(/solar|power|transformer|cable|electric|energy|generator|battery|lighting|luminaire/i)) {
    return catMap['energy'];
  }
  if (text.match(/road|bridge|drainage|civil|building|construction|concrete|pipe|asphalt|rcc/i)) {
    return catMap['construction'] || catMap['civil'];
  }
  if (text.match(/vehicle|bus|transport|truck|car|cng|lease|fuel|tyre/i)) {
    return catMap['transportation'];
  }
  if (text.match(/print|paper|stationery|booklet|answer sheet|cartridge/i)) {
    return catMap['printing'];
  }
  if (text.match(/agriculture|fertilizer|seed|irrigation|crop/i)) {
    return catMap['agriculture'];
  }
  if (text.match(/consult|audit|facility management|housekeeping|manpower|counsel/i)) {
    return catMap['consultancy'];
  }

  return catMap['supply'] || null;
}

/**
 * Fetch real ongoing bids directly from GeM Portal (bidplus.gem.gov.in)
 */
async function fetchDirectFromGeM(maxPages = 3) {
  try {
    logger.info('📡 Connecting to GeM portal (bidplus.gem.gov.in)...');
    
    // Step 1: Initial GET to acquire session cookies and CSRF token
    const initialRes = await fetch('https://bidplus.gem.gov.in/all-bids', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!initialRes.ok) {
      throw new Error(`GeM portal responded with HTTP ${initialRes.status}`);
    }

    const html = await initialRes.text();
    const cookies = initialRes.headers.getSetCookie 
      ? initialRes.headers.getSetCookie().join('; ') 
      : (initialRes.headers.get('set-cookie') || '');

    const csrfMatch = html.match(/['"]csrf_bd_gem_nk['"]\s*:\s*['"]([a-f0-9]+)['"]/i)
      || html.match(/name=['"]csrf_bd_gem_nk['"]\s+value=['"]([a-f0-9]+)['"]/i);

    if (!csrfMatch) {
      throw new Error('Could not extract CSRF security token from GeM portal');
    }

    const csrfToken = csrfMatch[1];
    logger.info('🔐 Acquired GeM portal session & security token.');

    const allDocs = [];

    // Step 2: Fetch pages of ongoing bids (both latest and active)
    for (let page = 1; page <= maxPages; page++) {
      const postData = {
        page,
        param: { searchBid: "", searchType: "fullText" },
        filter: {
          bidStatusType: "ongoing_bids",
          byType: "all",
          highBidValue: "",
          byEndDate: { from: "", to: "" },
          sort: page === 1 ? "Bid-End-Date-Latest" : "Bid-End-Date-Oldest"
        }
      };

      const body = new URLSearchParams();
      body.append('payload', JSON.stringify(postData));
      body.append('csrf_bd_gem_nk', csrfToken);

      const apiRes = await fetch('https://bidplus.gem.gov.in/all-bids-data', {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'https://bidplus.gem.gov.in/all-bids',
          'Cookie': cookies,
        },
        body: body.toString(),
        signal: AbortSignal.timeout(10000)
      });

      if (!apiRes.ok) continue;

      const data = await apiRes.json();
      const docs = data?.response?.response?.docs || [];
      allDocs.push(...docs);
    }

    logger.info(`📥 Retrieved ${allDocs.length} genuine ongoing bids directly from GeM.`);
    return allDocs;
  } catch (err) {
    logger.warn(`⚠️ Direct GeM fetch encountered an issue: ${err.message}.`);
    return [];
  }
}

/**
 * Synchronize live tenders:
 * Extracts real ongoing bids directly from official GeM portal (bidplus.gem.gov.in)
 * along with real NIT PDF documents and authentic reference IDs.
 */
async function syncLiveTenders() {
  logger.info('🚀 Initiating Live Tender Sync...');
  let synced = 0;
  let skipped = 0;

  try {
    // 1. Fetch available categories
    const categories = await prisma.tenderCategory.findMany();
    const catMap = {};
    categories.forEach(c => { catMap[c.slug] = c.id; });

    // 2. Fetch genuine live bids directly from GeM Portal
    const gemDocs = await fetchDirectFromGeM(5);

    for (const doc of gemDocs) {
      const bidNo = doc.b_bid_number?.[0];
      const bidId = doc.b_id?.[0];
      const title = doc.b_category_name?.[0] || 'Government Procurement Notice';
      const ministry = doc.ba_official_details_minName?.[0] || '';
      const deptName = doc.ba_official_details_deptName?.[0] || '';
      const department = deptName && deptName !== 'NA' ? deptName : (ministry || 'Government of India');
      
      const isGujarat = (title + department + ministry).toLowerCase().includes('gujarat');
      const location = isGujarat ? 'Gujarat' : 'Pan India';
      const state = isGujarat ? 'Gujarat' : 'All India';

      const openingDate = doc.final_start_date_sort?.[0] ? new Date(doc.final_start_date_sort[0]) : new Date();
      const closingDate = doc.final_end_date_sort?.[0] ? new Date(doc.final_end_date_sort[0]) : new Date(Date.now() + 7 * 86400000);
      
      const quantity = doc.b_total_quantity?.[0] ? doc.b_total_quantity[0] : 1;
      const categoryId = classifyCategory(title, department, catMap);
      
      const docUrl = bidId ? `https://bidplus.gem.gov.in/showbidDocument/${bidId}` : 'https://bidplus.gem.gov.in/all-bids';
      const tenderType = doc.b_is_bunch?.[0] ? 'Bunch Bid' : (doc.b_bid_type?.[0] === 5 ? 'Reverse Auction (RA)' : 'GeM Open Bid');

      if (!bidNo) continue;

      try {
        await prisma.tender.upsert({
          where: { refNo: bidNo },
          update: {
            title,
            department,
            location,
            state,
            status: 'ACTIVE',
            openingDate,
            closingDate,
            isPublished: true,
            source: 'GeM Portal',
            sourceUrl: docUrl,
            tenderType,
            description: `Official GeM Procurement: ${title}. Total quantity: ${quantity}. Procured by ${department} (${ministry}). Notice published on Government e-Marketplace (GeM) public procurement portal.`,
            categoryId,
            documents: [
              { name: 'Official_GeM_NIT_Document.pdf', url: docUrl }
            ],
          },
          create: {
            refNo: bidNo,
            title,
            department,
            location,
            state,
            value: null,
            status: 'ACTIVE',
            openingDate,
            closingDate,
            isPublished: true,
            source: 'GeM Portal',
            sourceUrl: docUrl,
            tenderType,
            eligibility: 'Registered GeM Vendors / OEMs conforming to technical specifications',
            description: `Official GeM Procurement: ${title}. Total quantity: ${quantity}. Procured by ${department} (${ministry}). Notice published on Government e-Marketplace (GeM) public procurement portal.`,
            categoryId,
            documents: [
              { name: 'Official_GeM_NIT_Document.pdf', url: docUrl }
            ],
          }
        });
        synced++;
      } catch (err) {
        logger.error(`Failed to upsert GeM bid ${bidNo}: ${err.message}`);
        skipped++;
      }
    }

    logger.info(`✅ Live Tender Sync completed: ${synced} genuine tenders synced, ${skipped} skipped.`);
    return { success: true, synced, skipped, total: synced + skipped };
  } catch (err) {
    logger.error(`❌ Live Tender Sync error: ${err.message}`);
    throw err;
  }
}

module.exports = { syncLiveTenders };
