/**
 * Runs as a bookmark ("Send to SmartBid") on a tender portal page the staff member has already
 * opened (after their own login/captcha). Reads the tender tables on screen and hands the rows
 * to the SmartBid admin capture page, which does the saving. Must stay self-contained:
 * it is stringified into a javascript: URL, so it can't use imports or outer variables.
 */
export function capturePortalTenders(appOrigin: string) {
  const clean = (s: string | null | undefined) => (s || '').replace(/\s+/g, ' ').trim();
  const rows: Record<string, string>[] = [];
  const seen: Record<string, boolean> = {};

  document.querySelectorAll('table').forEach((table) => {
    const trs = Array.from(table.rows);
    // Find a header row with a title-like and a closing-date-like column (short cells only,
    // so layout tables that wrap the whole page are ignored)
    let headerIndex = -1;
    let headers: string[] = [];
    for (let i = 0; i < Math.min(trs.length, 5); i++) {
      const cells = Array.from(trs[i].cells).map((c) => clean(c.textContent).toLowerCase());
      if (cells.length < 2 || cells.some((c) => c.length > 60)) continue;
      if (cells.some((c) => /clos|due date|end date|last date/.test(c)) && cells.some((c) => /title|description|name of work|subject|item/.test(c))) {
        headerIndex = i;
        headers = cells;
        break;
      }
    }
    // Corrigendum lists repeat existing tenders' references; they aren't new tenders
    if (headerIndex < 0 || headers.some((h) => /corrigendum/.test(h))) return;

    const col = (re: RegExp) => headers.findIndex((h) => re.test(h));
    const cTitle = col(/title|description|name of work|subject|item/);
    const cClose = col(/clos|due date|end date|last date/);
    if (cTitle === cClose) return;
    const cPub = col(/publish/);
    const cOrg = col(/organi[sz]ation|department|railway|zone|division|unit/);
    const cRef = col(/ref|tender no|tender id|notice no/);
    const cVal = col(/value|estimated|cost/);

    // Include rows of nested tables too: portal home pages put the rows in an inner table
    const allTrs = Array.from(table.querySelectorAll('tr'));
    allTrs.slice(allTrs.indexOf(trs[headerIndex]) + 1).forEach((tr) => {
      if (tr.cells.length !== headers.length) return;
      const cell = (i: number) => (i < 0 ? '' : clean(tr.cells[i].textContent));
      let title = cell(cTitle);
      let ref = cTitle === cRef ? '' : cell(cRef);
      let tenderId = '';
      // NIC/GePNIC portals pack "[Title] [Ref No][Tender ID]" into one cell
      const parts = (title.match(/\[[^\]]*\]/g) || []).map((b) => b.slice(1, -1).trim());
      if (parts.length >= 2) {
        title = parts[0];
        ref = parts[parts.length >= 3 ? parts.length - 2 : 1];
        if (parts.length >= 3) tenderId = parts[parts.length - 1];
      }
      title = title.replace(/^\d+\.\s*/, ''); // "1. Title" numbering on portal home pages
      const closing = cell(cClose);
      const key = tenderId || ref || title;
      if (!title || !closing || seen[key]) return;
      seen[key] = true;
      rows.push({ title, ref, tenderId, closing, published: cell(cPub), org: cell(cOrg), value: cell(cVal) });
    });
  });

  if (rows.length === 0) {
    alert('SmartBid: no tender table found on this page. Open a tender list (e.g. Active Tenders or Tenders by Organisation) and try again.');
    return;
  }

  const payload = { type: 'smartbid-capture', pageUrl: location.href, rows };
  const popup = window.open(`${appOrigin}/admin/tenders/capture`, 'smartbid-capture');
  // The capture page announces when it's ready; reply with the rows to that window only
  window.addEventListener('message', (e) => {
    if (popup && e.source === popup && e.data === 'smartbid-capture-ready') popup.postMessage(payload, appOrigin);
  });
  // Fallback if the portal blocks the popup link: the admin can paste instead
  navigator.clipboard?.writeText(JSON.stringify(payload)).catch(() => {});
  if (!popup) alert(`SmartBid: popup blocked. ${rows.length} tenders were copied — paste them on the SmartBid capture page.`);
}

export function buildCaptureBookmarklet(appOrigin: string) {
  return `javascript:${encodeURIComponent(`(${capturePortalTenders.toString()})(${JSON.stringify(appOrigin)})`)}`;
}
