// Vercel Serverless Function: /api/sitemap (vegansexplore.com/sitemap.xml, rewritten in vercel.json)
// Search (Sean, 2026-10-30: "we're doing it for search and discoverability"). The old sitemap.xml was a
// hand-kept file of 25 addresses, most of which redirected (.html paths, trailing slashes, the retired
// DMV chapter), with none of the Directory's listings. This builds it from what is live: the main pages,
// every chapter, every live Guide, every approved listing (places, people, shows, books, films) and
// every published Pulse article. A new page that should be found goes in PAGES or GUIDES; a new chapter
// in CHAPTERS (the same slugs as VE_HUBS in /public/ve-hubs.js and the /communities rewrite).
// Listings only in the LESARUSS.ai Directory (tag lesaruss-ai-directory-candidate) are left out: they
// live at lesaruss.ai.

const SUPABASE_URL = 'https://fwbhwfxpncrsfhttimna.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
const SITE = 'https://vegansexplore.com';

const PAGES = ['/', '/explore', '/passport', '/welcome', '/directory', '/events', '/pulse', '/media', '/guides', '/communities',
  '/business', '/policies', '/contact'];
const CHAPTERS = ['south-florida', 'central-florida', 'north-florida', 'atlanta', 'washington-dc', 'delaware', 'maryland', 'virginia',
  'west-virginia', 'new-york', 'philadelphia', 'los-angeles', 'london'];
const GUIDES = ['vegan-dairy-guide', 'vegan-restaurant-guide', 'stadium-arena-guide', 'airport-guide', 'nonprofit-guide', 'creator-guide'];

async function all(table, query) {
  const out = [];
  for (let offset = 0; offset < 50000; offset += 1000) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + query + '&order=id&limit=1000&offset=' + offset, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY }
    });
    if (!r.ok) throw new Error(table + ' ' + r.status);
    const rows = await r.json();
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}

function day(ts) {
  return ts ? String(ts).slice(0, 10) : null;
}
function url(loc, lastmod) {
  const safe = loc.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return '<url><loc>' + safe + '</loc>' + (lastmod ? '<lastmod>' + lastmod + '</lastmod>' : '') + '</url>';
}

module.exports = async (req, res) => {
  const lines = [];
  PAGES.forEach((p) => lines.push(url(SITE + p)));
  CHAPTERS.forEach((c) => lines.push(url(SITE + '/communities/' + c)));
  GUIDES.forEach((g) => lines.push(url(SITE + '/guides/' + g)));

  let ok = true;
  try {
    const listings = await all('listings', 'select=slug,updated_at,tags&status=eq.approved&slug=not.is.null');
    const seen = new Set();
    listings.forEach((l) => {
      if (!l.slug || seen.has(l.slug)) return;
      if (Array.isArray(l.tags) && l.tags.includes('lesaruss-ai-directory-candidate')) return;
      seen.add(l.slug);
      lines.push(url(SITE + '/directory/' + l.slug, day(l.updated_at)));
    });
    const posts = await all('ve_pulse_content', 'select=slug,published_at&status=eq.published&slug=not.is.null');
    posts.forEach((p) => lines.push(url(SITE + '/pulse/' + encodeURIComponent(p.slug), day(p.published_at))));
  } catch (e) {
    ok = false;
  }

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  // A failed read is not cached for long, so the full list comes back on the next fetch.
  res.setHeader('Cache-Control', ok ? 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' : 'public, max-age=0, s-maxage=60');
  res.statusCode = 200;
  res.end('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + lines.join('\n') + '\n</urlset>\n');
};
