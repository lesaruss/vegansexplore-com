// Vercel Serverless Function: /api/event (vegansexplore.com/events?event=<id>, rewritten in vercel.json)
// Search and share previews for an event's own page (Sean, 2026-11-02: make our event pages better than
// Eventbrite's). events/index.html draws an event with client-side JavaScript, so search engines and link
// previews saw the calendar's generic title. This serves the same page with the event's title, description,
// picture, canonical address and schema.org Event data written into the head, and the event's details as
// plain HTML inside #ev-cal, which the page's JavaScript replaces with the full view as it loads.
// An id that is not a live Vegans Explore event gets the page as it is. If Supabase is slow, the page goes
// out unchanged.

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://fwbhwfxpncrsfhttimna.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
const SITE = 'https://vegansexplore.com';
const OG_DEFAULT = SITE + '/public/og-default.jpg';
const VE_TENANT = '00000000-0000-4000-a000-000000000002';
const LISTING = 'slug,name,logo_url,address_street,address_city,address_state,address_zip,address_country,website';
const FIELDS = 'id,title,description,starts_at,ends_at,timezone,time_set,location_name,address,city,state,country,event_type,' +
  'ticket_url,virtual_url,category,image_url,status,organizer_name,organizer_url,is_free,' +
  'host:listings!events_host_listing_id_fkey(' + LISTING + '),venue:listings!events_venue_listing_id_fkey(' + LISTING + ')';

let template = null;
async function getTemplate(host) {
  if (template) return template;
  try {
    template = fs.readFileSync(path.join(process.cwd(), 'events', 'index.html'), 'utf8');
  } catch (e) {
    const r = await fetch('https://' + host + '/events/index.html');
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
function goodUrl(u) {
  return /^https?:\/\//i.test(String(u || '')) ? String(u) : null;
}

async function fetchEvent(id) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2500);
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/events?select=' + encodeURIComponent(FIELDS) + '&id=eq.' + id +
      '&tenant_id=eq.' + VE_TENANT + '&status=in.(approved,cancelled)&limit=1', {
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

// The event's local date and time, in its own time zone (else Eastern).
function when(e) {
  const tz = e.timezone || 'America/New_York';
  const opt = (o) => { try { return new Intl.DateTimeFormat('en-US', Object.assign({ timeZone: tz }, o)); } catch (x) { return new Intl.DateTimeFormat('en-US', Object.assign({ timeZone: 'America/New_York' }, o)); } };
  const s = new Date(e.starts_at);
  if (isNaN(s)) return '';
  let out = opt({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(s);
  if (e.time_set === false) return out + ', time to be announced';
  out += ', ' + opt({ hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(s);
  return out;
}

function placeOf(e) {
  const v = e.venue || {};
  const name = e.location_name || v.name || '';
  const street = e.address || v.address_street || '';
  const city = e.city || v.address_city || '';
  const region = e.state || v.address_state || '';
  const country = e.country || v.address_country || '';
  return { name, street, city, region, zip: v.address_zip || '', country };
}

function build(e) {
  const p = placeOf(e);
  const online = e.event_type === 'virtual' || (!p.city && !p.street && e.virtual_url);
  const cancelled = e.status === 'cancelled';
  const where = online ? 'Online' : [p.name, p.city, p.region].filter(Boolean).join(', ');
  const date = when(e);
  const title = (cancelled ? 'Cancelled: ' : '') + e.title + (p.city && !online ? ' in ' + p.city : '') + ' — Vegans Explore';
  const desc = clip([date, where].filter(Boolean).join(' · ') + '. ' + (e.description || ''), 158);
  const canonical = SITE + '/events?event=' + e.id;
  const img = goodUrl(e.image_url) || goodUrl(e.host && e.host.logo_url) || goodUrl(e.venue && e.venue.logo_url) || OG_DEFAULT;
  const hostName = (e.host && e.host.name) || e.organizer_name || null;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.title,
    description: clip(e.description || '', 600) || undefined,
    startDate: e.starts_at,
    endDate: e.ends_at || undefined,
    eventStatus: 'https://schema.org/' + (cancelled ? 'EventCancelled' : 'EventScheduled'),
    eventAttendanceMode: 'https://schema.org/' + (online ? 'OnlineEventAttendanceMode' : 'OfflineEventAttendanceMode'),
    image: [img],
    url: canonical,
    location: online
      ? { '@type': 'VirtualLocation', url: goodUrl(e.virtual_url) || goodUrl(e.ticket_url) || canonical }
      : {
          '@type': 'Place',
          name: p.name || p.city || undefined,
          url: e.venue && e.venue.slug ? SITE + '/directory/' + e.venue.slug : undefined,
          address: {
            '@type': 'PostalAddress',
            streetAddress: p.street || undefined,
            addressLocality: p.city || undefined,
            addressRegion: p.region || undefined,
            postalCode: p.zip || undefined,
            addressCountry: p.country || undefined
          }
        }
  };
  if (hostName) {
    ld.organizer = {
      '@type': 'Organization',
      name: hostName,
      url: e.host && e.host.slug ? SITE + '/directory/' + e.host.slug : goodUrl(e.organizer_url) || undefined
    };
  }
  if (goodUrl(e.ticket_url)) {
    ld.offers = { '@type': 'Offer', url: e.ticket_url, availability: 'https://schema.org/' + (cancelled ? 'Discontinued' : 'InStock') };
  }
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Vegan Events', item: SITE + '/events' },
      { '@type': 'ListItem', position: 2, name: e.title, item: canonical }
    ]
  };
  const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

  const tags = [
    '<link rel="canonical" href="' + attr(canonical) + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Vegans Explore">',
    '<meta property="og:url" content="' + attr(canonical) + '">',
    '<meta property="og:title" content="' + attr(title) + '">',
    '<meta property="og:description" content="' + attr(desc) + '">',
    '<meta property="og:image" content="' + attr(img) + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + attr(title) + '">',
    '<meta name="twitter:description" content="' + attr(desc) + '">',
    '<meta name="twitter:image" content="' + attr(img) + '">',
    '<script type="application/ld+json">' + json(ld) + '</script>',
    '<script type="application/ld+json">' + json(crumbs) + '</script>'
  ].join('\n');

  // What a crawler reads in the page itself; the calendar's script replaces it with the full event view.
  const bits = [];
  bits.push('<p><a href="/events">Vegan Events</a> / ' + text(e.title) + '</p>');
  if (cancelled) bits.push('<p><strong>This event is cancelled.</strong></p>');
  bits.push('<h1>' + text(e.title) + '</h1>');
  if (date) bits.push('<p>' + text(date) + '</p>');
  if (online) bits.push('<p>Online</p>');
  else if (p.name || p.city) {
    const venueLink = e.venue && e.venue.slug ? '<a href="/directory/' + attr(e.venue.slug) + '">' + text(p.name || e.venue.name) + '</a>' : text(p.name);
    bits.push('<p>Held at ' + [venueLink, text([p.street, p.city, p.region].filter(Boolean).join(', '))].filter(Boolean).join(', ') + '</p>');
  }
  if (e.host && e.host.slug) bits.push('<p>Hosted by <a href="/directory/' + attr(e.host.slug) + '">' + text(e.host.name) + '</a></p>');
  else if (e.organizer_name) bits.push('<p>Put on by ' + text(e.organizer_name) + '</p>');
  if (e.description) bits.push('<div>' + String(e.description).split(/\n{2,}/).map((x) => '<p>' + text(x.trim()) + '</p>').join('') + '</div>');
  if (goodUrl(e.ticket_url)) bits.push('<p><a href="' + attr(e.ticket_url) + '" rel="noopener">Tickets and info</a></p>');
  const body = '<article class="vev-ssr" style="padding:8px 0;line-height:1.6">' + bits.join('\n') + '</article>';

  return { title, desc, tags, body };
}

module.exports = async (req, res) => {
  const id = String((req.query && (req.query.event || req.query.id)) || '').toLowerCase();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'vegansexplore.com');
  let html = await getTemplate(host);

  const e = /^[0-9a-f-]{36}$/.test(id) ? await fetchEvent(id) : null;
  if (e) {
    const h = build(e);
    html = html
      .replace(/<title>[^<]*<\/title>/, '<title>' + text(h.title) + '</title>')
      .replace(/(<meta name="description" content=")[^"]*(")/, '$1' + attr(h.desc) + '$2')
      .replace('</head>', h.tags + '\n</head>')
      .replace('<div class="vear-main" id="ev-cal"></div>', '<div class="vear-main" id="ev-cal">' + h.body + '</div>');
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400');
  res.statusCode = 200;
  res.end(html);
};
