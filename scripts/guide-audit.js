#!/usr/bin/env node
/*
  Guide content inventory and audit (2026-11-17).

  Why: every Guide is moving onto one shared frame plus a Finder or Handbook template
  (mocks/guide-templates/BRIEF.md). Sean wants proof after each move that "nothing is broken and
  all the content's still listed". This takes a BEFORE inventory of every Guide, every part and
  every sub-view on the live site, and compares any later snapshot against it.

  Usage
    node scripts/guide-audit.js snapshot <outDir> [--only=holiday-guide,airport-guide] [--base=https://vegansexplore.com]
                                         [--shots=<dir>] [--concurrency=4] [--depth=2] [--no-linkcheck] [--local=<repoDir>]
    node scripts/guide-audit.js compare <beforeDir> <afterDir>

  --local=<repoDir>: proof before a push. The live site is visited as usual, but the Guide pages (/guides/*), their scripts
  (/guide-scripts/*), the Welcome Guide (/passport), the shared frame (/public/ve-guide-frame.css and .js) and the kit (/public/ve-kit.css) are served from the
  files in <repoDir> (Playwright route), so a change can be compared against the BEFORE inventory without deploying it.

  snapshot: visits each Guide (signed out) at 1440x900 and 390x844. Parts come from the Guide's own
  TABS list in its script (read from the repo) plus whatever the live menu shows; sub-views are found
  by following the Guide's own hash links (#/part/sub) from each part, up to --depth levels, skipping
  data views (listing, product, search, menu, tell, new, edit, report, scan) that are not part of the
  Guide's fixed content. Writes <outDir>/<guide>.json, <outDir>/SUMMARY.md and one first-screen JPEG
  per view and width to <shots>/<guide>/<view>-<w>.jpg (default <outDir>/shots).

  compare: per Guide and per part, lists items, links, buttons, gate texts and audio/video that were
  in BEFORE and are missing in AFTER (normalized text; links without query strings), plus new console
  errors, new broken images and new inner scroll. Content missing from a part but present elsewhere in
  the same Guide is reported as "moved", not missing. Exit code 1 if anything is missing.
  Writes <afterDir>/COMPARE.md.

  Read-only against the site: signed out, no forms submitted, no clicks that write.
*/
'use strict';
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');

// ---------- the Guides ----------
// url: the live address (path + query). script: where its TABS list lives (relative to the repo).
const GUIDES = [
  { id: 'holiday-guide', url: '/guides/holiday-guide', script: 'guide-scripts/holiday-guide.js' },
  { id: 'airport-guide', url: '/guides/airport-guide', script: 'guide-scripts/airport-guide.js' },
  { id: 'stadium-arena-guide', url: '/guides/stadium-arena-guide', script: 'guide-scripts/stadium-arena-guide.js' },
  { id: 'theme-park-guide', url: '/guides/theme-park-guide', script: 'guide-scripts/theme-park-guide.js' },
  { id: 'supermarket-guide', url: '/guides/supermarket-guide', script: 'guide-scripts/supermarket-guide.js' },
  { id: 'vegan-dairy-guide', url: '/guides/vegan-dairy-guide', script: 'guide-scripts/vegan-dairy-guide.js' },
  { id: 'nutrition-guide', url: '/guides/nutrition-guide', script: 'guide-scripts/nutrition-guide.js' },
  { id: 'food-photographer-guide', url: '/guides/food-photographer-guide', script: 'guide-scripts/food-photographer-guide.js' },
  { id: 'vegan-events-guide', url: '/guides/vegan-events-guide', script: 'guide-scripts/vegan-events-guide.js' },
  { id: 'vegan-activism-guide', url: '/guides/vegan-activism-guide', script: 'guide-scripts/activism-guide.js' },
  { id: 'creator-guide', url: '/guides/creator-guide', script: 'guide-scripts/creator-guide.js' },
  { id: 'nonprofit-guide', url: '/guides/nonprofit-guide', script: 'guide-scripts/nonprofit-guide.js' },
  // /guides/taste redirects to /passport (vercel.json) unless an unsub key is present; an empty key
  // opens the page without calling the unsubscribe API.
  { id: 'taste', url: '/guides/taste?unsub=', script: 'guides/taste.html', note: 'Public /guides/taste redirects to /passport; audited at /guides/taste?unsub=' },
  { id: 'pre-vegan-business-guide', url: '/guides/pre-vegan-business-guide', script: 'guide-scripts/pre-vegan-business-guide.js' },
  { id: 'pre-vegan-restaurant-guide', url: '/guides/pre-vegan-restaurant-guide', script: 'guide-scripts/pre-vegan-restaurant-guide.js' },
  { id: 'vegan-restaurant-guide', url: '/guides/vegan-restaurant-guide', script: 'guide-scripts/vegan-restaurant-guide.js' },
  { id: 'welcome-guide', url: '/passport?guide=welcome', script: 'guide-scripts/welcome-guide.js' }
];

// Sub-views that are data or actions, not fixed Guide content.
const SKIP_SUB = /(^|\/)(listing|product|search|menu|tell|new|edit|report|scan|r)(\/|$)/;
const IGNORE_REQ = /google-analytics\.com|googletagmanager\.com|analytics\.google\.com|doubleclick\.net/;
const WIDTHS = [{ w: 1440, h: 900 }, { w: 390, h: 844 }];
const PHONE_LINE = 760;

// ---------- args ----------
function parseArgs(argv) {
  const o = { _: [] };
  argv.forEach(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); if (m) o[m[1]] = m[2] === undefined ? true : m[2]; else o._.push(a); });
  return o;
}

// ---------- static parts from the script ----------
function staticParts(g) {
  try {
    const src = fs.readFileSync(path.join(REPO, g.script), 'utf8');
    const i = src.indexOf('var TABS = [');
    if (i < 0) return [];
    // Walk brackets to the end of the array.
    let d = 0, j = src.indexOf('[', i), end = -1, q = null;
    for (let k = j; k < src.length; k++) {
      const c = src[k];
      if (q) { if (c === '\\') { k++; continue; } if (c === q) q = null; continue; }
      if (c === '\'' || c === '"' || c === '`') { q = c; continue; }
      if (c === '/' && src[k + 1] === '/') { k = src.indexOf('\n', k); continue; }
      if (c === '[') d++; else if (c === ']') { d--; if (!d) { end = k; break; } }
    }
    const block = src.slice(j, end + 1);
    const out = []; const re = /\{\s*k:\s*['"]([^'"]+)['"]([^}]*)/g; let m;
    while ((m = re.exec(block))) {
      const rest = m[2];
      const flags = [];
      if (/\bmine:\s*1/.test(rest)) flags.push('mine');
      if (/\bguest:\s*1/.test(rest)) flags.push('guest');
      if (/\block:\s*1/.test(rest)) flags.push('lock');
      if (/\bafter:\s*1/.test(rest)) flags.push('after');
      const lab = rest.match(/label:\s*'((?:[^'\\]|\\.)*)'/);
      const par = rest.match(/parent:\s*'([^']+)'/);
      out.push({ k: m[1], label: lab ? lab[1].replace(/\\'/g, '\'') : '', parent: par ? par[1] : null, flags });
    }
    return out;
  } catch (e) { return []; }
}

// ---------- helpers ----------
const norm = s => String(s || '').toLowerCase().replace(/[\u2018\u2019]/g, '\'').replace(/[\u201c\u201d]/g, '"').replace(/\s+/g, ' ').replace(/^[\s.,:;!?\-|·•>]+|[\s.,:;!?\-|·•>]+$/g, '').trim();
function normHref(h) {
  if (!h) return '';
  try {
    const u = new URL(h, 'https://vegansexplore.com');
    let hash = u.hash.replace(/\?.*$/, '').replace(/\/+$/, '');
    if (hash === '#' || hash === '#/') hash = '';
    const host = /(^|\.)vegansexplore\.com$/.test(u.hostname) ? '' : u.hostname.replace(/^www\./, '');
    const p = u.pathname.replace(/\/+$/, '').replace(/\.html$/, '') || '/';
    if (u.protocol === 'mailto:' || u.protocol === 'tel:') return u.protocol + u.pathname.toLowerCase();
    return (host + p + hash).toLowerCase();
  } catch (e) { return String(h).toLowerCase(); }
}
const viewName = h => (h || 'overview').replace(/[^a-z0-9-]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 90) || 'overview';
const hashPath = h => String(h || '').replace(/^#\/?/, '').replace(/\?.*$/, '').replace(/\/+$/, '');
const sleep = ms => new Promise(r => setTimeout(r, ms));
function withTimeout(p, ms, label) {
  let t; return Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej(new Error('timeout ' + ms + 'ms: ' + label)), ms); })]).finally(() => clearTimeout(t));
}

// Network errors that mean "this sandbox could not reach the host", not "the page is broken".
const BLOCKED = /ERR_TUNNEL_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED|ERR_PROXY|ERR_CONNECTION_REFUSED|ENOTFOUND|EAI_AGAIN|getaddrinfo|ERR_CERT/;
function blockedUrls(r) { return new Set((r.failedRequests || []).filter(f => BLOCKED.test(f.error || '')).map(f => f.url)); }
function realBroken(r) { const b = blockedUrls(r); return (r.brokenImages || []).filter(u => !b.has(u)); }
function realConsole(r) { return (r.consoleErrors || []).filter(m => !BLOCKED.test(m)); }
function linkDead(st) { if (!st) return false; if (st.status) return st.status === 404 || st.status === 410 || (st.internal && st.status >= 500); return !!st.internal && !BLOCKED.test(st.error || ''); }
function linkUnreachable(st) { return !!st && !st.status && !linkDead(st); }

// ---------- in-page collector (runs in the browser) ----------
function collect(args) {
  const PHONE_LINE = args.phoneLine;
  const vis = el => { if (!el || !el.getClientRects().length) return false; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return false; const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
  const txt = el => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
  const chrome = el => !!el.closest('.ve-nav, #ve-burger-menu, .ve-footer, footer.ve-footer, #ve-hs');
  const uniq = arr => Array.from(new Set(arr.filter(Boolean)));
  const main = document.getElementById('dgMain') || document.querySelector('main') || document.body;

  const h = sel => uniq(Array.from(document.querySelectorAll(sel)).filter(e => !chrome(e) && vis(e)).map(txt));
  const out = { title: document.title, url: location.href, hash: location.hash };
  out.h1 = h('h1'); out.h2 = h('h2'); out.h3 = h('h3');

  // Items: be generous. Card/row/tile/item/box/article containers and list items, titled by their
  // first heading-like child, else their first line.
  const itemSel = '[class*="card"],[class*="row"],[class*="tile"],[class*="item"],[class*="box"],[class*="art"],[class*="ve-rd"],li,article,details>summary';
  const items = [];
  Array.from(main.querySelectorAll(itemSel)).forEach(el => {
    if (chrome(el) || !vis(el)) return;
    const cls = typeof el.className === 'string' ? el.className : '';
    if (/(rows|tiles|cards|items|arts|grid|wrap|joinbox|pricebox|start)\b/.test(cls) && el.children.length > 1 && !/\b(dg-srow|dg-row|dg-card|dg-tile)\b/.test(cls)) return;
    if (/dg-srow-p|dg-srow-b|row-main|art-img|art-more|art-go|-t\b/.test(cls)) return;
    const t = el.querySelector('h2,h3,h4,h5,[class*="title"],[class*="name"],[class*="-t "],[class$="-t"],b,strong');
    let s = t && vis(t) ? txt(t) : '';
    if (!s) s = (el.innerText || '').split('\n').map(x => x.trim()).filter(Boolean)[0] || '';
    s = s.slice(0, 140);
    if (s.length >= 2) items.push(s);
  });
  Array.from(main.querySelectorAll('h3,h4')).forEach(e => { if (vis(e)) items.push(txt(e).slice(0, 140)); });
  out.items = uniq(items);

  // Links (site nav and footer counted separately).
  const links = new Map(); let chromeLinks = 0;
  Array.from(document.querySelectorAll('a[href]')).forEach(a => {
    if (chrome(a)) { chromeLinks++; return; }
    const href = a.getAttribute('href'); if (!href || href === '#' || /^javascript:/i.test(href)) return;
    const t = (txt(a) || a.getAttribute('aria-label') || a.getAttribute('title') || (a.querySelector('img') ? 'img:' + (a.querySelector('img').alt || '') : '')).slice(0, 120);
    const key = a.href + '|' + t; if (!links.has(key)) links.set(key, { href: a.href, raw: href, text: t, visible: vis(a) });
  });
  Array.from(document.querySelectorAll('[data-href]')).forEach(e => {
    if (chrome(e)) return; const href = e.getAttribute('data-href'); const abs = new URL(href, location.href).href;
    const t = (txt(e).split(' ').slice(0, 12).join(' ')).slice(0, 120); const key = abs + '|' + t;
    if (!links.has(key)) links.set(key, { href: abs, raw: href, text: t, visible: vis(e), dataHref: true });
  });
  out.links = Array.from(links.values()); out.chromeLinks = chromeLinks;

  out.buttons = uniq(Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]')).filter(b => !chrome(b) && vis(b)).map(b => (txt(b) || b.value || b.getAttribute('aria-label') || '').slice(0, 100)));

  out.images = Array.from(document.querySelectorAll('img')).filter(i => !chrome(i)).map(i => ({ src: i.currentSrc || i.src || i.getAttribute('data-src') || '', alt: i.alt || '', loaded: i.complete && i.naturalWidth > 0, complete: i.complete, visible: vis(i) })).filter(i => i.src);
  out.media = Array.from(document.querySelectorAll('audio, video, audio source, video source, iframe')).map(m => ({ tag: m.tagName.toLowerCase(), src: m.currentSrc || m.src || m.getAttribute('src') || m.getAttribute('data-src') || '' })).filter(m => m.src);
  // Audio wired through data attributes (Play buttons).
  Array.from(document.querySelectorAll('[data-audio],[data-src$=".mp3"],[data-clip],[data-ep-audio]')).forEach(e => {
    const s = e.getAttribute('data-audio') || e.getAttribute('data-src') || e.getAttribute('data-clip') || e.getAttribute('data-ep-audio'); if (s) out.media.push({ tag: 'data-audio', src: s });
  });

  // Gate texts: the smallest visible element whose text has a price, points or a gate word.
  const GATE = /\$\s?\d[\d,.]*|\b\d[\d,]*\s*points\b|\bjoin free\b|\bsign in\b|\bget access\b|\bget in\b|\bcoming( soon)?\b|\bmembers only\b|\bunlock\b|\btake the (short )?survey\b|\bfree for (members|everyone)\b|\bbecome a member\b|\bstart free\b/i;
  const gates = [];
  Array.from(document.querySelectorAll('body *')).forEach(e => {
    if (chrome(e) || /^(SCRIPT|STYLE|NOSCRIPT|SVG|PATH|OPTION|SELECT)$/i.test(e.tagName)) return;
    const t = txt(e); if (!t || t.length > 180 || !GATE.test(t) || !vis(e)) return;
    if (Array.from(e.children).some(c => GATE.test(txt(c)))) return;
    gates.push(t);
  });
  out.gates = uniq(gates);

  // The Guide: name and picture.
  const rail = document.getElementById('dgRail');
  // The new frame (ve-guide-frame.js, 2026-11-17) shows the Guide once as .gf-guide (.gf-gpic, .gf-name); the old rail stays hidden in the DOM.
  const gf = document.getElementById('gfGuide') || document.querySelector('.gf-guide');
  const gfPic = gf && gf.querySelector('.gf-gpic');
  const pic = (gfPic && vis(gfPic) ? gfPic : null) || document.getElementById('dgMaya') || document.getElementById('dgGuide') || (rail && rail.querySelector('[class*="maya"],[class*="guide-pic"],img'));
  let picSrc = '';
  if (pic) { if (pic.tagName === 'IMG') picSrc = pic.currentSrc || pic.src; else { const bg = getComputedStyle(pic).backgroundImage; const m = bg && bg.match(/url\(["']?([^"')]+)/); picSrc = m ? m[1] : ''; if (!picSrc) { const im = pic.querySelector('img'); if (im) picSrc = im.currentSrc || im.src; } } }
  const gfName = gf && gf.querySelector('.gf-name');
  const nameEl = (gfName && vis(gfName) ? gfName : null) || document.getElementById('dgGuideName') || (rail && rail.querySelector('.dg-maya-name b, .dg-name, [class*="name"] b, b'));
  out.frame = document.body.classList.contains('ve-gf') ? (document.body.classList.contains('gf-hb') ? 'handbook' : 'finder') : 'old';
  const toc = document.getElementById('gfToc');
  out.toc = toc ? Array.from(toc.querySelectorAll('a[href], button')).map(a => ({ href: a.getAttribute('href') || a.getAttribute('data-k') || '', label: txt(a).slice(0, 100) })) : [];
  out.guide = { slug: rail ? rail.getAttribute('data-guide') || '' : '', label: rail ? rail.getAttribute('aria-label') || '' : '', name: nameEl ? txt(nameEl).slice(0, 80) : '', picture: picSrc, railVisible: rail ? vis(rail) : false };

  // Parts the live menu offers.
  const sel = document.getElementById('dgMenuSelect');
  out.menu = sel ? Array.from(sel.options).map(o => ({ k: o.value, label: o.textContent.trim(), selected: o.selected })) : [];
  const menuLinks = document.getElementById('dgMenu');
  out.menuLinks = menuLinks ? Array.from(menuLinks.querySelectorAll('a[href]')).map(a => ({ href: a.getAttribute('href'), label: txt(a), current: a.getAttribute('aria-current') === 'page' })) : [];
  const cur = out.menu.find(o => o.selected) || {}; const curL = out.menuLinks.find(l => l.current) || {};
  out.activePart = cur.k || hashOf(curL.href) || '';
  function hashOf(h) { return h ? h.replace(/^#\/?/, '').split('/')[0] : ''; }

  // Layout checks.
  const de = document.documentElement;
  out.hScroll = de.scrollWidth > de.clientWidth + 1 ? { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth } : null;
  if (out.hScroll) {
    const wide = []; Array.from(document.querySelectorAll('body *')).forEach(e => { const r = e.getBoundingClientRect(); if (r.right > de.clientWidth + 1 && r.width > 0 && vis(e) && !e.closest('[style*="overflow"]')) wide.push((e.id ? '#' + e.id : e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '')) + ' right=' + Math.round(r.right)); });
    out.hScroll.culprits = wide.slice(0, 8);
  }
  const inner = [];
  Array.from(document.querySelectorAll('body *')).forEach(e => {
    if (e.closest('.ve-nav, #ve-burger-menu') || /^(SELECT|TEXTAREA|OPTION)$/i.test(e.tagName)) return;
    const cs = getComputedStyle(e); if (!/(auto|scroll)/.test(cs.overflowY)) return;
    if (e.scrollHeight > e.clientHeight + 4 && e.clientHeight > 0 && vis(e)) inner.push({ el: (e.id ? '#' + e.id : e.tagName.toLowerCase()) + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 3).join('.') : ''), scrollHeight: e.scrollHeight, clientHeight: e.clientHeight });
  });
  out.innerScroll = inner;

  // Phone: the title and the first orange action vs the fold line.
  const h1 = Array.from(document.querySelectorAll('h1')).find(e => vis(e) && !chrome(e));
  out.h1Bottom = h1 ? Math.round(h1.getBoundingClientRect().bottom + scrollY) : null;
  const orange = c => { const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/); if (!m) return false; const r = +m[1], g = +m[2], b = +m[3]; return r > 200 && g > 70 && g < 175 && b < 100; };
  const cands = Array.from(document.querySelectorAll('.k-cta, .gf-cta, .dg-cta, #dgCta, a, button')).filter(e => !chrome(e) && vis(e));
  let act = cands.find(e => e.matches('.k-cta, .gf-cta')) || cands.find(e => orange(getComputedStyle(e).backgroundColor));
  if (act) {
    // The first in reading order, not the first matched class.
    const all = cands.filter(e => e.matches('.k-cta, .gf-cta') || orange(getComputedStyle(e).backgroundColor));
    all.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top); act = all[0];
  }
  out.action = act ? { text: txt(act).slice(0, 80), bottom: Math.round(act.getBoundingClientRect().bottom + scrollY), cls: (typeof act.className === 'string' ? act.className : '').slice(0, 60) } : null;
  out.mainTextLength = txt(main).length;
  return out;
}

// ---------- --local: serve the Guide files from a working copy ----------
// /passport is the Welcome Guide's page (passport.html).
const LOCAL_PATHS = /^\/(guides\/[a-z0-9-]+(\.html)?|passport|guide-scripts\/[a-z0-9-]+\.js|public\/ve-guide-frame\.(css|js)|public\/ve-kit\.css)$/;
async function routeLocal(ctx, base, dir) {
  const host = new URL(base).host;
  await ctx.route(u => u.host === host && LOCAL_PATHS.test(u.pathname), async r => {
    const p = new URL(r.request().url()).pathname.slice(1);
    let f = path.join(dir, p);
    if (p.startsWith('guides/') && !p.endsWith('.html')) f += '.html';
    if (p === 'passport') f = path.join(dir, 'passport.html');
    if (!fs.existsSync(f)) return r.continue();
    const ct = f.endsWith('.css') ? 'text/css' : f.endsWith('.js') ? 'application/javascript' : 'text/html';
    return r.fulfill({ status: 200, contentType: ct + '; charset=utf-8', body: fs.readFileSync(f) });
  });
}

// ---------- snapshot ----------
async function snapshot(outDir, opts) {
  const { chromium, request } = require('playwright');
  const base = (opts.base || 'https://vegansexplore.com').replace(/\/+$/, '');
  const only = opts.only ? String(opts.only).split(',') : null;
  const shots = path.resolve(opts.shots || path.join(outDir, 'shots'));
  const conc = +opts.concurrency || 4;
  const maxDepth = opts.depth === undefined ? 2 : +opts.depth;
  const PER_PARENT = +opts.perParent || 40, PER_GUIDE = +opts.perGuide || 160;
  fs.mkdirSync(outDir, { recursive: true }); fs.mkdirSync(shots, { recursive: true });
  const guides = GUIDES.filter(g => !only || only.includes(g.id));
  const t0 = Date.now();
  const browser = await chromium.launch();

  const state = {};
  const queue = [];
  guides.forEach(g => {
    const sp = staticParts(g);
    state[g.id] = { guide: g, staticParts: sp, views: new Map(), seen: new Set(), order: [] };
    const parts = ['overview'].concat(sp.map(p => p.k).filter(k => k !== 'overview'));
    parts.forEach(k => enqueue(g.id, k, 0, null, true));
  });
  function enqueue(gid, hp, depth, parent, isPart) {
    const S = state[gid]; hp = hashPath(hp) || 'overview';
    if (S.seen.has(hp)) return false;
    if (!isPart && S.seen.size >= PER_GUIDE) return false;
    S.seen.add(hp); S.order.push(hp);
    S.views.set(hp, { view: hp, depth, parent, isPart: !!isPart, widths: {} });
    WIDTHS.forEach(W => queue.push({ gid, hp, W, depth }));
    return true;
  }

  async function runOne(task) {
    const S = state[task.gid], g = S.guide, V = S.views.get(task.hp);
    const url = base + g.url + '#/' + (task.hp === 'overview' ? 'overview' : task.hp);
    const rec = { url, capturedAt: new Date().toISOString(), consoleErrors: [], failedRequests: [], errors: [] };
    const ctx = await browser.newContext({ viewport: { width: task.W.w, height: task.W.h }, deviceScaleFactor: 1, isMobile: task.W.w < 600, hasTouch: task.W.w < 600, userAgent: task.W.w < 600 ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 VEGuideAudit' : undefined });
    await ctx.route(IGNORE_REQ, r => r.abort());
    if (opts.local) await routeLocal(ctx, base, path.resolve(String(opts.local)));
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type() === 'error') { const loc = m.location() || {}; if (!IGNORE_REQ.test(loc.url || '') && !IGNORE_REQ.test(m.text())) rec.consoleErrors.push(m.text().slice(0, 300)); } });
    page.on('pageerror', e => rec.consoleErrors.push('pageerror: ' + String(e.message || e).slice(0, 300)));
    page.on('requestfailed', r => { const u = r.url(); if (IGNORE_REQ.test(u)) return; const f = (r.failure() || {}).errorText || ''; rec.failedRequests.push({ url: u.slice(0, 300), type: r.resourceType(), error: f, aborted: /ERR_ABORTED/.test(f) }); });
    page.on('response', r => { const u = r.url(); if (r.status() >= 400 && !IGNORE_REQ.test(u)) rec.failedRequests.push({ url: u.slice(0, 300), type: r.request().resourceType(), status: r.status() }); });
    try {
      await withTimeout((async () => {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
        // Wait for the view to render and settle: main text stable, no "Loading..." left.
        let last = -1, stable = 0;
        for (let i = 0; i < 30 && stable < 3; i++) {
          await sleep(400);
          const st = await page.evaluate(() => { const m = document.getElementById('dgMain') || document.querySelector('main') || document.body; const t = (m.innerText || ''); return { n: t.length, loading: /\bLoading\.\.\.|Loading…/.test(t) }; }).catch(() => ({ n: -2, loading: false }));
          if (st.n === last && !st.loading && st.n > 0) stable++; else stable = 0;
          last = st.n;
        }
        await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
        rec.finalUrl = page.url();
        const dir = path.join(shots, g.id); fs.mkdirSync(dir, { recursive: true });
        const shot = path.join(dir, viewName(task.hp) + '-' + task.W.w + '.jpg');
        await page.screenshot({ path: shot, type: 'jpeg', quality: 70 }).catch(e => rec.errors.push('screenshot: ' + e.message));
        rec.screenshot = path.relative(process.cwd(), shot);
        const top = await page.evaluate(collect, { phoneLine: PHONE_LINE });
        // Scroll through so lazy pictures and rows load, then collect again and merge.
        await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += Math.max(600, innerHeight)) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); }).catch(() => {});
        await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
        const all = await page.evaluate(collect, { phoneLine: PHONE_LINE });
        Object.assign(rec, all);
        // Keep first-screen measures from the unscrolled pass.
        rec.h1Bottom = top.h1Bottom; rec.action = top.action;
        const u = a => Array.from(new Set(a));
        rec.items = u(top.items.concat(all.items));
        rec.h2 = u(top.h2.concat(all.h2)); rec.h3 = u(top.h3.concat(all.h3));
        rec.buttons = u(top.buttons.concat(all.buttons)); rec.gates = u(top.gates.concat(all.gates));
        const lk = new Map(); top.links.concat(all.links).forEach(l => lk.set(l.href + '|' + l.text, l)); rec.links = Array.from(lk.values());
        rec.innerScroll = top.innerScroll.concat(all.innerScroll.filter(x => !top.innerScroll.some(y => y.el === x.el)));
      })(), +opts.viewTimeout || 75000, url);
    } catch (e) { rec.errors.push(String(e.message || e).slice(0, 300)); }
    await ctx.close().catch(() => {});

    // Image failures from the network count as broken even when lazy.
    const failedImg = new Set(rec.failedRequests.filter(f => f.type === 'image' && !f.aborted).map(f => f.url));
    (rec.images || []).forEach(i => { i.broken = (i.complete && !i.loaded) || failedImg.has(i.src); });
    rec.brokenImages = (rec.images || []).filter(i => i.broken).map(i => i.src).concat(Array.from(failedImg).filter(u => !(rec.images || []).some(i => i.src === u)));
    rec.brokenImages = Array.from(new Set(rec.brokenImages));
    rec.realFailedRequests = rec.failedRequests.filter(f => !f.aborted);
    if (task.W.w < 600) {
      rec.phone = {
        h1Bottom: rec.h1Bottom, actionBottom: rec.action ? rec.action.bottom : null,
        titlePass: rec.h1Bottom != null && rec.h1Bottom <= PHONE_LINE,
        actionPass: !!rec.action && rec.action.bottom <= PHONE_LINE
      };
    }
    V.widths[task.W.w] = rec;

    // Discover sub-views from the desktop pass.
    if (task.W.w === 1440 && task.depth < maxDepth && rec.links) {
      const own = new URL(base + g.url).pathname.replace(/\.html$/, '');
      let added = 0;
      rec.links.forEach(l => {
        let u; try { u = new URL(l.href); } catch (e) { return; }
        if (u.pathname.replace(/\.html$/, '') !== own || !/^#\//.test(u.hash)) return;
        const hp = hashPath(u.hash); if (!hp || hp === task.hp) return;
        const top = hp.split('/')[0];
        if (hp.indexOf('/') < 0) { // a part link the menu did not list (e.g. a group)
          if (added < PER_PARENT && enqueue(task.gid, hp, task.depth + 1, task.hp, false)) added++;
          return;
        }
        if (SKIP_SUB.test(hp.slice(top.length))) return;
        if (added < PER_PARENT && enqueue(task.gid, hp, task.depth + 1, task.hp, false)) added++;
      });
    }
    done++;
    if (done % 20 === 0 || process.env.AUDIT_VERBOSE) process.stdout.write(`  ${done}/${done + queue.length + active - 1} views (${Math.round((Date.now() - t0) / 1000)}s)\n`);
  }

  let done = 0, active = 0;
  await new Promise(resolve => {
    function pump() {
      while (active < conc && queue.length) {
        const t = queue.shift(); active++;
        runOne(t).catch(e => { console.error('task failed', t.gid, t.hp, e.message); }).finally(() => { active--; if (!queue.length && !active) resolve(); else pump(); });
      }
      if (!queue.length && !active) resolve();
    }
    pump();
  });
  await browser.close();

  // ---------- link check ----------
  let linkStatus = {};
  if (!opts['no-linkcheck']) {
    const all = new Set();
    Object.values(state).forEach(S => S.views.forEach(V => Object.values(V.widths).forEach(r => (r.links || []).forEach(l => {
      try { const u = new URL(l.href); if (!/^https?:$/.test(u.protocol)) return; u.hash = ''; all.add(u.href); } catch (e) {}
    }))));
    const rc = await request.newContext({ ignoreHTTPSErrors: false, timeout: 15000, extraHTTPHeaders: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' } });
    const list = Array.from(all); let i = 0;
    process.stdout.write(`  checking ${list.length} links\n`);
    await Promise.all(Array.from({ length: 8 }, async () => {
      while (i < list.length) {
        const u = list[i++];
        let st = null, err = '';
        try { const r = await rc.fetch(u, { method: 'GET', maxRedirects: 8, timeout: 15000 }); st = r.status(); await r.dispose(); } catch (e) { err = String(e.message || e).split('\n')[0].slice(0, 160); }
        const internal = /(^|\.)vegansexplore\.com$/.test(new URL(u).hostname);
        const dead = err ? (internal || /ENOTFOUND|EAI_AGAIN|ERR_NAME|getaddrinfo/.test(err)) : (st === 404 || st === 410 || (internal && st >= 500));
        linkStatus[u] = { status: st, error: err || undefined, internal, dead };
      }
    }));
    await rc.dispose();
  }

  // ---------- write ----------
  const summaries = [];
  for (const gid of Object.keys(state)) {
    const S = state[gid], g = S.guide;
    const views = S.order.map(hp => S.views.get(hp));
    const live = new Set();
    views.forEach(V => Object.values(V.widths).forEach(r => (r.menu || []).forEach(o => live.add(o.k))));
    const json = {
      guide: g.id, url: base + g.url, script: g.script, note: g.note, state: opts.state && opts.state !== true ? String(opts.state) : undefined, takenAt: new Date().toISOString(), base, local: opts.local ? String(opts.local) : undefined,
      staticParts: S.staticParts, liveMenuParts: Array.from(live),
      partsMissingFromLiveMenu: S.staticParts.map(p => p.k).filter(k => !live.has(k)),
      views: views.map(V => ({ view: V.view, depth: V.depth, parent: V.parent, isPart: V.isPart, widths: V.widths }))
    };
    json.linkStatus = {};
    views.forEach(V => Object.values(V.widths).forEach(r => (r.links || []).forEach(l => { try { const u = new URL(l.href); u.hash = ''; if (linkStatus[u.href]) json.linkStatus[u.href] = linkStatus[u.href]; } catch (e) {} })));
    fs.writeFileSync(path.join(outDir, gid + '.json'), JSON.stringify(json, null, 1));
    summaries.push(summarize(json));
  }
  // The summary covers every Guide JSON in the folder, so a --only re-run keeps the others in it.
  const ran = new Set(summaries.map(x => x.guide));
  const L0 = load(outDir); GUIDES.forEach(g => { if (!ran.has(g.id) && L0[g.id]) summaries.push(summarize(L0[g.id])); });
  const ord = GUIDES.map(g => g.id); summaries.sort((a, b) => ord.indexOf(a.guide) - ord.indexOf(b.guide));
  writeSummary(outDir, summaries, { base, took: Math.round((Date.now() - t0) / 1000), shots });
  console.log(`Done: ${summaries.length} Guides, ${summaries.reduce((a, s) => a + s.views, 0)} views in ${Math.round((Date.now() - t0) / 1000)}s. ${path.join(outDir, 'SUMMARY.md')}`);
}

function summarize(json) {
  const childParts = new Set((json.staticParts || []).filter(p => p.parent).map(p => p.k));
  const s = { guide: json.guide, frames: new Set(), capturedFrom: null, capturedTo: null, parts: 0, views: json.views.length, items: new Set(), links: new Set(), broken: [], console: [], inner: [], hscroll: [], phone: { pass: 0, total: 0, fails: [] }, errors: [], dead: [], partsMissingFromLiveMenu: (json.partsMissingFromLiveMenu || []).filter(k => !childParts.has(k)), redirects: [] };
  json.views.forEach(V => {
    if (V.isPart) s.parts++;
    Object.entries(V.widths).forEach(([w, r]) => {
      if (r.frame) s.frames.add(r.frame);
      if (r.capturedAt) { if (!s.capturedFrom || r.capturedAt < s.capturedFrom) s.capturedFrom = r.capturedAt; if (!s.capturedTo || r.capturedAt > s.capturedTo) s.capturedTo = r.capturedAt; }
      (r.items || []).forEach(t => s.items.add(norm(t)));
      (r.links || []).forEach(l => s.links.add(normHref(l.href)));
      realBroken(r).forEach(u => s.broken.push({ view: V.view, w, src: u }));
      realConsole(r).forEach(m => s.console.push({ view: V.view, w, msg: m }));
      (r.realFailedRequests || []).filter(f => f.type !== 'image' && !BLOCKED.test(f.error || '')).forEach(f => s.console.push({ view: V.view, w, msg: 'request ' + (f.status || f.error) + ' ' + f.type + ' ' + f.url }));
      if ((r.innerScroll || []).length) s.inner.push({ view: V.view, w, els: r.innerScroll.map(x => x.el + ' (' + x.scrollHeight + '/' + x.clientHeight + ')') });
      if (r.hScroll) s.hscroll.push({ view: V.view, w, sw: r.hScroll.scrollWidth, culprits: r.hScroll.culprits });
      if ((r.errors || []).length) s.errors.push({ view: V.view, w, msg: r.errors.join('; ') });
      if (r.phone) { s.phone.total++; if (r.phone.titlePass && r.phone.actionPass) s.phone.pass++; else s.phone.fails.push({ view: V.view, h1: r.phone.h1Bottom, action: r.phone.actionBottom }); }
      const sp = (json.staticParts || []).find(p => p.k === V.view);
      if (w === '1440' && V.isPart && r.activePart && r.activePart !== V.view.split('/')[0] && !(sp && sp.parent === r.activePart)) s.redirects.push(V.view + ' -> ' + r.activePart);
    });
  });
  s.unreachable = 0;
  Object.entries(json.linkStatus || {}).forEach(([u, st]) => { if (linkDead(st)) s.dead.push({ url: u, status: st.status || st.error }); else if (linkUnreachable(st)) s.unreachable++; });
  const occ = {}; json.views.forEach(V => Object.values(V.widths).forEach(r => (r.links || []).forEach(l => { try { const u = new URL(l.href); u.hash = ''; if (linkDead(json.linkStatus[u.href])) (occ[u.href] = occ[u.href] || new Set()).add(V.view); } catch (e) {} })));
  s.dead.forEach(d => { d.views = Array.from(occ[d.url] || []).slice(0, 5); });
  s.items = s.items.size; s.links = s.links.size;
  s.frame = s.frames.size ? Array.from(s.frames).join('+') : 'old'; delete s.frames;
  s.state = json.state || (s.frame === 'old' ? 'before' : 'after move (' + s.frame + ' frame)');
  return s;
}

function writeSummary(outDir, sums, meta) {
  const L = [];
  L.push('# Guide inventory', '', `Base ${meta.base}, signed out, 1440x900 and 390x844. Written ${new Date().toISOString()}${meta.took ? ' after a ' + meta.took + 's run' : ''}. Screenshots: ${meta.shots}`, '');
  L.push('| Guide | State | Parts | Views | Items | Links | Broken images | Console/request errors | Inner-scroll views | Horizontal scroll | Phone title+action pass | Dead links |');
  L.push('|---|---|---|---|---|---|---|---|---|---|---|---|');
  sums.forEach(s => L.push(`| ${s.guide} | ${s.state} | ${s.parts} | ${s.views} | ${s.items} | ${s.links} | ${new Set(s.broken.map(b => b.src)).size} | ${new Set(s.console.map(c => c.msg)).size} | ${new Set(s.inner.map(i => i.view)).size} | ${new Set(s.hscroll.map(i => i.view + '@' + i.w)).size} | ${s.phone.pass}/${s.phone.total} | ${s.dead.length} |`));
  const t = k => sums.reduce((a, s) => a + s[k], 0);
  L.push(`| **Total** | | ${t('parts')} | ${t('views')} | ${t('items')} | ${t('links')} | | | | | ${sums.reduce((a, s) => a + s.phone.pass, 0)}/${sums.reduce((a, s) => a + s.phone.total, 0)} | ${sums.reduce((a, s) => a + s.dead.length, 0)} |`, '');
  const unr = sums.reduce((a, s) => a + (s.unreachable || 0), 0);
  L.push('Not counted as problems: requests and links this machine could not reach (proxy or DNS: ' + unr + ' outside links unchecked, plus blocked image hosts such as i.ytimg.com). Sub-parts listed under a parent part (the Holiday Guide\'s ThanksLiving, Hanukkah, Christmas and New Year\'s Eve parts) are reached from their parent\'s sub-menu, not the top menu.', '');
  L.push('## Problems', '');
  sums.forEach(s => {
    const P = [];
    const byKey = (arr, key) => { const m = {}; arr.forEach(x => { const k = key(x); (m[k] = m[k] || []).push(x.view + '@' + x.w); }); return m; };
    Object.entries(byKey(s.broken, b => b.src)).forEach(([src, v]) => P.push(`Broken image \`${src}\` on ${Array.from(new Set(v)).slice(0, 6).join(', ')}`));
    Object.entries(byKey(s.console, c => c.msg)).forEach(([m, v]) => P.push(`Error: ${m.replace(/\|/g, '/')} on ${Array.from(new Set(v)).slice(0, 6).join(', ')}${v.length > 6 ? ' and ' + (v.length - 6) + ' more' : ''}`));
    const innerBy = {}; s.inner.forEach(i => i.els.forEach(e => { const k = e.replace(/ \(.*$/, '') + ' @' + i.w; (innerBy[k] = innerBy[k] || []).push(i.view); }));
    Object.entries(innerBy).forEach(([k, v]) => P.push(`Inner scroll ${k} on ${v.length} view(s): ${v.slice(0, 8).join(', ')}${v.length > 8 ? ' ...' : ''}`));
    s.hscroll.forEach(i => P.push(`Horizontal scroll on ${i.view}@${i.w} (${i.sw}px)${i.culprits && i.culprits.length ? ': ' + i.culprits.slice(0, 3).join('; ') : ''}`));
    s.phone.fails.forEach(f => P.push(`Phone 390: ${f.view} h1 bottom ${f.h1 == null ? 'no h1' : f.h1}, orange action bottom ${f.action == null ? 'none' : f.action} (line ${PHONE_LINE})`));
    s.dead.forEach(d => P.push(`Dead link ${d.url} (${d.status}) on ${d.views.join(', ')}`));
    s.errors.forEach(e => P.push(`Capture error on ${e.view}@${e.w}: ${e.msg}`));
    if (s.partsMissingFromLiveMenu.length) P.push(`Parts in the script not in the signed-out menu: ${s.partsMissingFromLiveMenu.join(', ')}`);
    if (s.redirects.length) P.push(`Parts that open another part signed out: ${s.redirects.join(', ')}`);
    if (s.capturedFrom) P.unshift(`Captured ${s.capturedFrom} to ${s.capturedTo}, frame: ${s.frame}`);
    L.push(`### ${s.guide}`, '', P.length ? P.map(p => '- ' + p).join('\n') : '- None', '');
  });
  fs.writeFileSync(path.join(outDir, 'SUMMARY.md'), L.join('\n'));
}

// ---------- compare ----------
function load(dir) {
  const o = {};
  fs.readdirSync(dir).filter(f => f.endsWith('.json')).forEach(f => { try { const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); if (j.guide && j.views) o[j.guide] = j; } catch (e) {} });
  return o;
}
function viewSets(V) {
  const s = { items: new Map(), links: new Map(), buttons: new Map(), gates: new Map(), media: new Map(), console: new Set(), broken: new Set(), inner: new Set() };
  Object.entries(V.widths || {}).forEach(([w, r]) => {
    (r.items || []).concat(r.h1 || [], r.h2 || [], r.h3 || []).forEach(t => { const n = norm(t); if (n) s.items.set(n, t); });
    (r.links || []).forEach(l => { const n = normHref(l.href); if (n) s.links.set(n, l.href + (l.text ? ' "' + l.text + '"' : '')); });
    (r.buttons || []).forEach(t => { const n = norm(t); if (n) s.buttons.set(n, t); });
    (r.gates || []).forEach(t => { const n = norm(t); if (n) s.gates.set(n, t); });
    (r.media || []).forEach(m => { const n = normHref(m.src); if (n) s.media.set(n, m.tag + ' ' + m.src); });
    realConsole(r).forEach(m => s.console.add(m.replace(/\d+/g, '#')));
    realBroken(r).forEach(u => s.broken.add(normHref(u)));
    (r.innerScroll || []).forEach(x => s.inner.add(w + ' ' + x.el));
  });
  return s;
}
function compare(beforeDir, afterDir) {
  const B = load(beforeDir), A = load(afterDir);
  const L = ['# Guide compare', '', `Before: ${beforeDir}`, `After: ${afterDir}`, `Run ${new Date().toISOString()}`, ''];
  const KINDS = ['items', 'links', 'buttons', 'gates', 'media'];
  let missingTotal = 0; const table = [];
  Object.keys(B).sort().forEach(gid => {
    const b = B[gid], a = A[gid];
    if (!a) { L.push(`## ${gid}`, '', '**Missing from AFTER entirely.**', ''); missingTotal++; table.push([gid, 'MISSING', '', '', '']); return; }
    // Guide-wide sets, to tell moved from missing.
    const aAll = {}; KINDS.forEach(k => aAll[k] = new Set());
    const aViews = {}; a.views.forEach(V => { const s = viewSets(V); aViews[V.view] = s; KINDS.forEach(k => s[k].forEach((_, n) => aAll[k].add(n))); });
    const out = []; let gMissing = 0, gMoved = 0, gNew = 0;
    b.views.forEach(V => {
      const bs = viewSets(V), as = aViews[V.view];
      const lines = [];
      if (!as) lines.push(`- View not in AFTER (looked for #/${V.view}); its content is checked against the whole Guide.`);
      KINDS.forEach(k => {
        const miss = [], moved = [];
        bs[k].forEach((orig, n) => { if (as && as[k].has(n)) return; if (aAll[k].has(n)) moved.push(orig); else miss.push(orig); });
        if (miss.length) { gMissing += miss.length; lines.push(`- Missing ${k} (${miss.length}): ` + miss.slice(0, 60).map(x => '`' + String(x).replace(/`/g, '\'').slice(0, 140) + '`').join(', ') + (miss.length > 60 ? ` and ${miss.length - 60} more` : '')); }
        if (moved.length) { gMoved += moved.length; lines.push(`- Moved ${k} (in another view now, ${moved.length}): ` + moved.slice(0, 15).map(x => '`' + String(x).slice(0, 80) + '`').join(', ') + (moved.length > 15 ? ' ...' : '')); }
      });
      if (as) {
        const nc = Array.from(as.console).filter(m => !bs.console.has(m)); if (nc.length) { gNew += nc.length; lines.push('- New console errors: ' + nc.slice(0, 10).map(x => '`' + x.slice(0, 160) + '`').join(', ')); }
        const nb = Array.from(as.broken).filter(m => !bs.broken.has(m)); if (nb.length) { gNew += nb.length; lines.push('- New broken images: ' + nb.slice(0, 10).map(x => '`' + x + '`').join(', ')); }
        const ni = Array.from(as.inner).filter(m => !bs.inner.has(m)); if (ni.length) { gNew += ni.length; lines.push('- New inner scroll: ' + ni.map(x => '`' + x + '`').join(', ')); }
      }
      if (lines.length) out.push(`### #/${V.view}`, '', ...lines, '');
    });
    const newViews = a.views.filter(V => !b.views.some(x => x.view === V.view)).map(V => V.view);
    missingTotal += gMissing;
    table.push([gid, String(gMissing), String(gMoved), String(gNew), newViews.length ? newViews.slice(0, 8).join(', ') : '']);
    L.push(`## ${gid}`, '', gMissing ? `**${gMissing} missing**, ${gMoved} moved, ${gNew} new problems.` : `Nothing missing. ${gMoved} moved, ${gNew} new problems.`, '');
    if (newViews.length) L.push('New views in AFTER: ' + newViews.join(', '), '');
    L.push(...out);
  });
  Object.keys(A).filter(g => !B[g]).forEach(g => L.push(`## ${g}`, '', 'New in AFTER (no BEFORE to compare).', ''));
  const head = ['| Guide | Missing | Moved | New problems | New views |', '|---|---|---|---|---|'].concat(table.map(r => '| ' + r.join(' | ') + ' |'));
  L.splice(5, 0, ...head, '', missingTotal ? `**Result: ${missingTotal} missing. Exit 1.**` : '**Result: nothing missing. Exit 0.**', '');
  fs.writeFileSync(path.join(afterDir, 'COMPARE.md'), L.join('\n'));
  console.log(head.join('\n'));
  console.log(missingTotal ? `\n${missingTotal} missing (see ${path.join(afterDir, 'COMPARE.md')})` : `\nNothing missing (${path.join(afterDir, 'COMPARE.md')})`);
  return missingTotal ? 1 : 0;
}

// ---------- main ----------
(async () => {
  const o = parseArgs(process.argv.slice(2));
  const cmd = o._[0];
  if (cmd === 'snapshot' && o._[1]) { await snapshot(path.resolve(o._[1]), o); process.exit(0); }
  if (cmd === 'summary' && o._[1]) { const d = path.resolve(o._[1]), L0 = load(d); writeSummary(d, GUIDES.filter(g => L0[g.id]).map(g => summarize(L0[g.id])), { base: (Object.values(L0)[0] || {}).base || '', took: 0, shots: o.shots || '(see snapshot run)' }); console.log('Wrote ' + path.join(d, 'SUMMARY.md')); process.exit(0); }
  if (cmd === 'compare' && o._[1] && o._[2]) process.exit(compare(path.resolve(o._[1]), path.resolve(o._[2])));
  console.log('Usage:\n  node scripts/guide-audit.js snapshot <outDir> [--only=<guide>[,<guide>]] [--base=https://vegansexplore.com] [--shots=<dir>] [--concurrency=4] [--depth=2] [--no-linkcheck] [--state="after move"] [--local=<repoDir>]\n  node scripts/guide-audit.js compare <beforeDir> <afterDir>\n  node scripts/guide-audit.js summary <dir>   (rewrite SUMMARY.md from the JSONs)\nGuides: ' + GUIDES.map(g => g.id).join(', '));
  process.exit(2);
})().catch(e => { console.error(e); process.exit(3); });
