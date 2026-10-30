// Vercel Serverless Function: /api/listing (vegansexplore.com/directory/<slug>, rewritten in vercel.json)
// Search and share previews (Sean, 2026-10-30: "When we're building stuff, we're doing it for search
// and discoverability"). directory/listing.html builds a listing with client-side JavaScript, so the
// raw page said "Loading..." with a generic description, which is what link-preview crawlers
// (Facebook, iMessage, Slack, LinkedIn) and a first pass by search engines see. This serves the same
// page with the listing's own title, description, picture, canonical address and schema.org data
// written into the head. The page's JavaScript still runs exactly as before and keeps these tags in
// step (it updates #og-title, #og-description, #og-image, #meta-description and #schema-ld).
//
// The head here mirrors the SEO block in directory/listing.html (search "SEO: title, OG tags"):
// change both together. A slug with no approved listing (a merged copy, a typo) gets the page as it
// is, and the page handles it. If Supabase is slow or down, the page goes out unchanged.

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://fwbhwfxpncrsfhttimna.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
const SITE = 'https://vegansexplore.com';
const OG_DEFAULT = SITE + '/public/og-default.jpg';
const FIELDS = 'slug,name,description,tagline,category,address_street,address_city,address_state,address_zip,address_country,phone,website,instagram,facebook,twitter,tiktok,youtube,logo_url,latitude,longitude,tags';

// Same lists as PEOPLE, listingKind() and MEDIA in directory/listing.html.
const PEOPLE = ['Activists', 'Content Creators', 'Athletes', 'Physicians', 'Health Experts', 'Chefs', 'Founders'];
const SHOWS = ['Podcasts', 'YouTube', 'News Outlets', 'Media'];
const WORKS = ['Documentaries & Films', 'Books'];
const BRANDS = ['Food Brands', 'Nutrition & Supplements', 'Fitness and Athletics', 'Clothing and Fashion', 'Beauty and Personal Care', 'E-Commerce & Marketplaces'];
const ORGS = /Nonprofit|Rescue|Sanctuar|Advocacy|Organization|Groups|Events/i;

let template = null;
async function getTemplate(host) {
  if (template) return template;
  try {
    template = fs.readFileSync(path.join(process.cwd(), 'directory', 'listing.html'), 'utf8');
  } catch (e) {
    // Not bundled: read the static file from this deployment (a file, so no rewrite loop).
    const r = await fetch('https://' + host + '/directory/listing');
    template = await r.text();
  }
  return template;
}

function attr(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function text(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function clip(s, n) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  if (s.length <= n) return s;
  const cut = s.slice(0, n - 1);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), n - 30)).replace(/[\s,.;:]+$/, '') + '…';
}
function handleUrl(base, h) {
  if (!h) return null;
  h = String(h).trim();
  if (/^https?:\/\//i.test(h)) return h;
  return base + h.replace(/^@/, '');
}

async function fetchListing(slug) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2500);
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/listings?select=' + FIELDS + '&status=eq.approved&slug=eq.' + encodeURIComponent(slug) + '&limit=1', {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY },
      signal: ctrl.signal
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function headFor(l) {
  const c = l.category || '';
  const person = PEOPLE.includes(c);
  const media = SHOWS.includes(c) || WORKS.includes(c);
  const place = !person && !media && !BRANDS.includes(c);
  const tags = Array.isArray(l.tags) ? l.tags : [];
  // Listings only in the LESARUSS.ai Directory live at lesaruss.ai (VE_BRAND.ownsListing hides them here).
  const base = tags.includes('lesaruss-ai-directory-candidate') ? 'https://lesaruss.ai' : SITE;
  const url = base + '/directory/' + l.slug;

  const where = l.address_city && !media && !person ? l.address_city + (l.address_state ? ', ' + l.address_state : '') : '';
  // "in <city>" only for a local business; an organization's address is its headquarters, not its reach.
  const title = l.name + (where && place && !ORGS.test(c) ? ' in ' + where : '') + ' — Vegans Explore';
  const desc = clip((l.description || l.tagline || '') + (where ? ' · ' + where : ''), 200) || 'Find the best Vegan-friendly businesses on Vegans Explore.';
  const img = l.logo_url || OG_DEFAULT;

  const type = person ? 'Person' : c === 'Restaurants' ? 'Restaurant' : c === 'Bakeries & Cafes' ? 'CafeOrCoffeeShop'
    : c === 'Podcasts' ? 'PodcastSeries' : c === 'Books' ? 'Book' : c === 'Documentaries & Films' ? 'Movie'
    : place && !ORGS.test(c) ? 'LocalBusiness' : 'Organization';
  const schema = {
    '@context': 'https://schema.org',
    '@type': type,
    name: l.name,
    description: l.description || l.tagline || undefined,
    url: url,
    image: l.logo_url || undefined,
    telephone: place ? l.phone || undefined : undefined,
    address: place && l.address_city ? {
      '@type': 'PostalAddress',
      streetAddress: l.address_street || undefined,
      addressLocality: l.address_city,
      addressRegion: l.address_state || undefined,
      postalCode: l.address_zip || undefined,
      addressCountry: l.address_country || 'US'
    } : undefined,
    geo: place && l.latitude != null && l.longitude != null ? { '@type': 'GeoCoordinates', latitude: Number(l.latitude), longitude: Number(l.longitude) } : undefined,
    servesCuisine: undefined,
    sameAs: [
      l.website && /^https?:\/\//i.test(l.website) ? l.website : null,
      handleUrl('https://instagram.com/', l.instagram),
      l.facebook && /^https?:\/\//i.test(l.facebook) ? l.facebook : null,
      handleUrl('https://twitter.com/', l.twitter),
      handleUrl('https://www.tiktok.com/@', l.tiktok),
      l.youtube && /^https?:\/\//i.test(l.youtube) ? l.youtube : null
    ].filter(Boolean)
  };
  if (!schema.sameAs.length) delete schema.sameAs;
  // </script> inside a JSON value would end the tag early.
  const json = JSON.stringify(schema).replace(/</g, '\\u003c');

  return {
    title,
    tags: [
      '<link rel="canonical" href="' + attr(url) + '"/>',
      '<meta property="og:url" content="' + attr(url) + '"/>',
      '<meta name="twitter:title" content="' + attr(title) + '"/>',
      '<meta name="twitter:description" content="' + attr(desc) + '"/>',
      '<meta name="twitter:image" content="' + attr(img) + '"/>',
      '<script id="schema-ld" type="application/ld+json">' + json + '</script>'
    ].join('\n'),
    desc,
    img
  };
}

module.exports = async (req, res) => {
  const slug = String((req.query && req.query.slug) || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 200);
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'vegansexplore.com');
  let html = await getTemplate(host);

  const l = slug ? await fetchListing(slug) : null;
  if (l) {
    const h = headFor(l);
    html = html
      .replace(/<title>[^<]*<\/title>/, '<title>' + text(h.title) + '</title>')
      .replace(/(<meta id="og-title" property="og:title" content=")[^"]*(")/, '$1' + attr(h.title) + '$2')
      .replace(/(<meta id="og-description" property="og:description" content=")[^"]*(")/, '$1' + attr(h.desc) + '$2')
      .replace(/(<meta id="og-image" property="og:image" content=")[^"]*(")/, '$1' + attr(h.img) + '$2')
      .replace(/(<meta id="meta-description" name="description" content=")[^"]*(")/, '$1' + attr(h.desc) + '$2')
      .replace('</head>', h.tags + '\n</head>');
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Edge-cached for 10 minutes, then served stale while it refreshes, so a listing's page stays fast
  // and an edit shows within about 10 minutes.
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400');
  res.statusCode = 200;
  res.end(html);
};
