/**
 * GeM and nProcure block non-Indian IPs. When PORTAL_PROXY_URL is set (the Supabase Edge Function
 * supabase/functions/portal-proxy, running in Mumbai), portal requests are relayed through it.
 * Unset = requests go direct, which works from India and in local dev.
 */
const proxyEnabled = () => Boolean(process.env.PORTAL_PROXY_URL);

/** Returns { status, setCookies, text } like a direct request would. */
async function proxyRequest(url, { method = 'GET', headers = {}, body } = {}) {
  const res = await fetch(process.env.PORTAL_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-proxy-secret': (process.env.PORTAL_PROXY_SECRET || '').trim() },
    body: JSON.stringify({ url, method, headers, body }),
    signal: AbortSignal.timeout(45000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(`Portal proxy: ${data.error || `HTTP ${res.status}`}`);
  return { status: data.status, setCookies: data.setCookies || [], text: data.body };
}

module.exports = { proxyEnabled, proxyRequest };
