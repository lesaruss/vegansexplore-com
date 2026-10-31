// BrandDesk client websites (canon canon-ve-front-of-house; built 2026-10-31). One function serves every client of the shared hosting
// project (Vercel branddesk-sites):
//   <their domain>/[menu|order|about|visit]   their approved site (ve-branddesk site_public {host}: the Cartridge the owner approved)
//   <this project's own host>/p/<token>/...   the private preview (site_public {preview}: their brand kit as it is now), never indexed
// Each page is drawn on the frame (frame.js, business/site.html copied in at build) with window.VE_SITE, and written for search on the
// server: its title, description, canonical address, share picture, schema.org Restaurant with the menu, and a plain-text version of the
// page inside #site for anything that does not run JavaScript. robots.txt and sitemap.xml per domain. Nothing here holds a secret.
const FRAME = require('./frame.js');
const FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-branddesk';
const PAGES = { '': 'home', menu: 'menu', order: 'order', about: 'about', visit: 'visit' };
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const cache = new Map();

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
const price = (p) => parseFloat(String(p).replace(/[^\d.]/g, '')) || 0;

async function lookup(key, body, fresh) {
  const hit = cache.get(key);
  if (hit && !fresh && Date.now() - hit.at < 30000) return hit.d;
  let d;
  try {
    const r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(9000) });
    d = await r.json();
  } catch (e) { if (hit) return hit.d; return { ok: false, error: 'unreachable' }; }
  if (d && (d.ok || d.error === 'not_found' || d.error === 'offline')) cache.set(key, { at: Date.now(), d });
  return d;
}

function send(res, status, body, headers) {
  res.statusCode = status;
  Object.entries(Object.assign({ 'Content-Type': 'text/html; charset=utf-8' }, headers || {})).forEach(([k, v]) => res.setHeader(k, v));
  res.end(body);
}
function plainPage(title, line) {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>' + esc(title) + '</title>' +
    '<style>body{margin:0;font-family:system-ui,sans-serif;background:#f7f5ef;color:#1d2a20;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;text-align:center}h1{font-size:26px;margin:0 0 10px}p{margin:0;opacity:.75}</style></head>' +
    '<body><main><h1>' + esc(title) + '</h1><p>' + line + '</p></main></body></html>';
}

function heroOf(C) {
  const sp = (C.photos && C.photos.space) || [];
  const pick = sp.find((p) => p.set === 'outside') || sp.find((p) => p.set === 'inside') || sp[0];
  if (pick && pick.src) return pick.src;
  for (const s of (C.menu && C.menu.sections) || []) for (const i of s.items || []) if (i.photo && i.photo.src) return i.photo.src;
  return (C.brand && C.brand.logo && C.brand.logo.primary && C.brand.logo.primary.src) || '';
}

function render(d, page) {
  const C = d.cartridge, biz = C.business || {}, I = C.info || {}, A = I.address || {}, st = C.story || {};
  const name = biz.name || d.name, addr = [A.street, A.city, [A.state, A.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const path = page === 'home' ? '' : page, url = d.origin + d.base + path;
  const items = []; ((C.menu && C.menu.sections) || []).forEach((s) => (s.items || []).forEach((i) => items.push(Object.assign({ section: s.name }, i))));
  const titles = { home: name + (st.tagline ? ' · ' + clip(st.tagline, 70) : biz.city ? ' · ' + biz.city : ''), menu: 'Menu · ' + name, order: 'Order for pickup · ' + name, about: 'About · ' + name, visit: 'Hours and directions · ' + name };
  const descs = {
    home: st.short || st.tagline || name + (biz.city ? ' in ' + biz.city : ''),
    menu: 'The menu at ' + name + (items.length ? ': ' + items.slice(0, 6).map((i) => i.name).join(', ') + '.' : '.') + (biz.vegan === '100% Vegan' ? ' Everything is Vegan.' : ''),
    order: 'Order from ' + name + ' for pickup' + (addr ? ' at ' + addr : '') + '.',
    about: (st.long && st.long[0]) || st.short || name,
    visit: name + (addr ? ', ' + addr : '') + (I.phone ? '. ' + I.phone : '') + '. Hours, directions and what to know before you come.',
  };
  const title = titles[page], desc = clip(descs[page], 158), hero = heroOf(C), logo = (C.brand && C.brand.logo && C.brand.logo.primary && C.brand.logo.primary.src) || '';
  const ld = { '@context': 'https://schema.org', '@type': 'Restaurant', '@id': d.origin + '/#restaurant', name, url: d.origin + d.base, description: st.short || st.tagline || undefined,
    image: hero ? [hero] : undefined, logo: logo || undefined, telephone: I.phone || undefined, servesCuisine: (biz.cuisines || []).length ? biz.cuisines : undefined,
    address: addr ? { '@type': 'PostalAddress', streetAddress: A.street, addressLocality: A.city, addressRegion: A.state, postalCode: A.zip, addressCountry: 'US' } : undefined,
    openingHours: DAYS.filter((x) => I.hours && I.hours[x] && !/closed/i.test(I.hours[x])).map((x) => x.slice(0, 2) + ' ' + I.hours[x]),
    sameAs: Object.entries(I.links || {}).filter(([k, v]) => /^https:\/\//.test(v) && k !== 'directory').map(([, v]) => v),
    hasMenu: items.length ? { '@type': 'Menu', url: d.origin + d.base + 'menu', hasMenuSection: ((C.menu && C.menu.sections) || []).map((s) => ({ '@type': 'MenuSection', name: s.name,
      hasMenuItem: (s.items || []).map((i) => ({ '@type': 'MenuItem', name: i.name, description: i.copy || i.was || undefined, offers: price(i.price) ? { '@type': 'Offer', price: String(price(i.price)), priceCurrency: 'USD' } : undefined })) })) } : undefined };
  const head = '<title>' + esc(title) + '</title>\n  <link rel="canonical" href="' + esc(url) + '">\n' +
    (d.mode === 'preview' ? '' : '  <meta property="og:type" content="website">\n') +
    '  <meta property="og:title" content="' + esc(title) + '">\n  <meta property="og:description" content="' + esc(desc) + '">\n  <meta property="og:url" content="' + esc(url) + '">\n' +
    (hero ? '  <meta property="og:image" content="' + esc(hero) + '">\n' : '') + '  <meta name="twitter:card" content="' + (hero ? 'summary_large_image' : 'summary') + '">\n' +
    (logo ? '  <link rel="icon" href="' + esc(logo) + '">\n' : '') +
    '  <script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>';
  // The page in plain words, for anything that does not run JavaScript; the frame draws over it.
  const plain = '<header><h1>' + esc(page === 'home' ? name : titles[page]) + '</h1>' + (st.tagline ? '<p>' + esc(st.tagline) + '</p>' : '') + '</header>' +
    '<nav>' + Object.keys(PAGES).map((p) => '<a href="' + esc(d.base + p) + '">' + esc(p ? p[0].toUpperCase() + p.slice(1) : 'Home') + '</a>').join(' ') + '</nav>' +
    (page === 'menu' || page === 'order' ? ((C.menu && C.menu.sections) || []).map((s) => '<h2>' + esc(s.name) + '</h2><ul>' + (s.items || []).map((i) => '<li><b>' + esc(i.name) + '</b> ' + esc(i.price || '') + (i.copy || i.was ? ' · ' + esc(i.copy || i.was) : '') + '</li>').join('') + '</ul>').join('') :
      page === 'about' ? [].concat(st.long || []).map((p) => '<p>' + esc(p) + '</p>').join('') : '<p>' + esc(st.short || '') + '</p>') +
    '<address>' + esc(addr) + (I.phone ? ' · <a href="tel:' + esc(String(I.phone).replace(/[^\d+]/g, '')) + '">' + esc(I.phone) + '</a>' : '') + '</address>' +
    '<p>' + DAYS.map((x) => esc(x) + ': ' + esc((I.hours && I.hours[x]) || 'Closed')).join(' · ') + '</p>';
  const site = { cartridge: C, mode: d.mode, base: d.base, page, origin: d.origin, dashboard: d.mode === 'preview' ? d.dashboard : null };
  let html = FRAME
    .replace(/<title>[\s\S]*?<\/title>/, head)
    .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + esc(desc) + '">')
    .replace('<script src="/business/sample/cartridge.js"></script>', '<script>window.VE_SITE = ' + JSON.stringify(site).replace(/</g, '\\u003c') + ';</script>')
    .replace('<div id="site"></div>', '<div id="site">' + plain + '</div>');
  if (d.mode !== 'preview') html = html.replace('<meta name="robots" content="noindex">', '<meta name="robots" content="index, follow">');
  return html;
}

module.exports = async (req, res) => {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase().split(':')[0];
  const u = new URL(req.url, 'https://' + host);
  let path = u.pathname, token = null;
  const own = /\.vercel\.app$/.test(host);
  if (own) {
    const m = path.match(/^\/p\/([a-z0-9]{12,40})(\/.*)?$/);
    if (!m) return send(res, path === '/robots.txt' ? 200 : 404, path === '/robots.txt' ? 'User-agent: *\nDisallow: /\n' : plainPage('BrandDesk websites', 'Managed by <a href="https://vegansexplore.com/business">Vegans Explore BrandDesk</a>.'),
      path === '/robots.txt' ? { 'Content-Type': 'text/plain; charset=utf-8' } : { 'X-Robots-Tag': 'noindex' });
    token = m[1]; path = m[2] || '/';
    if (!m[2]) return send(res, 308, '', { Location: '/p/' + token + '/' + u.search });
  }
  const fresh = u.searchParams.has('fresh');
  const d = await lookup(token ? 'p:' + token : 'h:' + host, token ? { action: 'site_public', preview: token } : { action: 'site_public', host }, fresh || !!token);
  const noStore = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };
  if (!d || !d.ok) {
    if (d && d.error === 'unreachable') return send(res, 503, plainPage('Back in a moment', 'This website could not load just now. Please try again in a minute.'), Object.assign({ 'Retry-After': '60' }, noStore));
    return send(res, 404, plainPage('This website is not here', 'There is no website at this address right now.'), noStore);
  }
  if (d.redirect) return send(res, 308, '', { Location: d.redirect + path + u.search });
  const rel = path.replace(/^\/+|\/+$/g, '');
  const cacheLive = d.mode === 'preview' ? noStore : { 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=30' };
  if (rel === 'robots.txt') {
    return send(res, 200, d.mode === 'preview' ? '# BrandDesk preview\nUser-agent: *\nDisallow: /\n' : '# ' + d.name + ', managed by Vegans Explore BrandDesk\nUser-agent: *\nAllow: /\n\nSitemap: ' + d.origin + '/sitemap.xml\n',
      Object.assign({ 'Content-Type': 'text/plain; charset=utf-8' }, cacheLive));
  }
  if (rel === 'sitemap.xml') {
    if (d.mode === 'preview') return send(res, 404, '', noStore);
    return send(res, 200, '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      Object.keys(PAGES).map((p) => '  <url><loc>' + d.origin + '/' + p + '</loc></url>').join('\n') + '\n</urlset>\n', Object.assign({ 'Content-Type': 'application/xml; charset=utf-8' }, cacheLive));
  }
  if (rel === 'favicon.ico') {
    const logo = d.cartridge.brand && d.cartridge.brand.logo && d.cartridge.brand.logo.primary && d.cartridge.brand.logo.primary.src;
    return logo ? send(res, 302, '', Object.assign({ Location: logo }, cacheLive)) : send(res, 404, '', cacheLive);
  }
  if (!(rel in PAGES)) return send(res, 404, plainPage('Page not found', '<a href="' + esc(d.base) + '">Go to the home page of ' + esc(d.name) + '</a>'), cacheLive);
  return send(res, 200, render(d, PAGES[rel]), cacheLive);
};
