// Vercel Serverless Function: /api/chapter (vegansexplore.com/communities/<slug>, rewritten in vercel.json)
// Signal (Sean, 2026-11-07, playbook signal: "fix the page templates"). Every chapter is one page, communities/hub.html,
// so all 13 went out with the same title ("Community Hub"), the same description, no canonical address, no share picture
// and no main heading in the HTML (the banner draws it later). This serves the same page with the chapter's own title,
// description, canonical, share picture and an <h1> inside the banner's box, which the banner replaces as it draws, so the
// page still has one main heading. The chapter's details come from public/ve-hubs.js (VE_HUBS[].page), the same file the
// page reads, so a new chapter needs nothing here. If anything goes wrong the page goes out as it is.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SITE = 'https://vegansexplore.com';

let template = null, hubs = null, sample = null;
function load() {
  if (!template) template = fs.readFileSync(path.join(process.cwd(), 'communities', 'hub.html'), 'utf8');
  if (!hubs) {
    const sandbox = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(process.cwd(), 'public', 've-hubs.js'), 'utf8'), sandbox, { timeout: 500 });
    hubs = sandbox.window.VE_HUBS || [];
    // The sample community (Marisol Bay, VE_SAMPLE_HUB) is kept out of VE_HUBS; it is served here noindex, with no canonical.
    if (sandbox.window.VE_SAMPLE_HUB) sample = sandbox.window.VE_SAMPLE_HUB;
  }
}

const attr = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const text = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const plain = (s) => String(s || '').replace(/&middot;/g, '·').replace(/&amp;/g, '&').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

function headFor(h) {
  const p = h.page || {};
  const url = SITE + '/communities/' + h.slug;
  const title = 'Vegan ' + h.name + ' Community — Vegans Explore';
  let desc = 'Vegan ' + h.name + ' on Vegans Explore: Vegan restaurants, events, the Daily Pulse and the local community' +
    (p.area ? ' across ' + plain(p.area) : '') + '.';
  if (desc.length > 158) desc = 'Vegan ' + h.name + ' on Vegans Explore: Vegan restaurants, events, the Daily Pulse and the local community.';
  const img = p.banner ? (/^https?:\/\//.test(p.banner) ? p.banner : SITE + p.banner) : SITE + '/public/og-default.jpg';
  return { url, title, desc, img, h1: 'Vegan ' + h.name };
}

module.exports = (req, res) => {
  let html = '';
  try {
    load();
    html = template;
    const slug = String((req.query && req.query.slug) || '').toLowerCase().replace(/[^a-z-]/g, '');
    const hub = hubs.filter((x) => x.slug === slug)[0];
    if (!hub && sample && slug === sample.slug) {
      const h = headFor(sample);
      html = html
        .replace(/<title>[^<]*<\/title>/, '<title>' + text('Vegan ' + sample.name + ' Community (Sample) — Vegans Explore') + '</title>')
        .replace(/(<meta name="description" content=")[^"]*(")/, '$1' + attr('A sample Vegans Explore community: Marisol Bay is a made-up city, here to show what a community hub and its sponsors look like.') + '$2')
        .replace('</head>', '<meta name="robots" content="noindex, nofollow"/>\n</head>')
        .replace('<section id="hero-section"></section>', '<section id="hero-section"><h1 class="vcb-ssr" style="margin:0;padding:28px 16px;font:900 26px Montserrat,sans-serif">' + text(h.h1) + '</h1></section>');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    } else if (hub) {
      const h = headFor(hub);
      html = html
        .replace(/<title>[^<]*<\/title>/, '<title>' + text(h.title) + '</title>')
        .replace(/(<meta name="description" content=")[^"]*(")/, '$1' + attr(h.desc) + '$2')
        .replace('</head>', [
          '<link rel="canonical" href="' + attr(h.url) + '"/>',
          '<meta property="og:type" content="website"/>',
          '<meta property="og:site_name" content="Vegans Explore"/>',
          '<meta property="og:url" content="' + attr(h.url) + '"/>',
          '<meta property="og:title" content="' + attr(h.title) + '"/>',
          '<meta property="og:description" content="' + attr(h.desc) + '"/>',
          '<meta property="og:image" content="' + attr(h.img) + '"/>',
          '<meta name="twitter:card" content="summary_large_image"/>',
          '<meta name="twitter:image" content="' + attr(h.img) + '"/>',
          '</head>'
        ].join('\n'))
        .replace('<section id="hero-section"></section>', '<section id="hero-section"><h1 class="vcb-ssr" style="margin:0;padding:28px 16px;font:900 26px Montserrat,sans-serif">' + text(h.h1) + '</h1></section>');
    }
  } catch (e) {
    if (!html) { res.statusCode = 302; res.setHeader('Location', '/communities'); return res.end(); }
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
  res.statusCode = 200;
  res.end(html);
};
