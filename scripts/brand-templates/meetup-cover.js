// Meetup group cover (Sean, 2026-11-19: "work on the branding for this page so it fits the current branding of Vegans Explore...
// Broward... Palm Beach and the Miami version... use the city artwork"). Copied from the locked YouTube thumbnail in
// /mocks/brand-kit/templates (canon canon-ve-brand-kit-templates): 16:9, words in blocks on the section color, the logo block, the
// mosaic, the 4:5 city art whole on the right, the stripe. Communities mid green. Words never on the picture.
//
// Usage (the site served at BASE, e.g. python3 -m http.server 8766 from the repo root):
//   node scripts/brand-templates/meetup-cover.js --area Broward --art art-4x5.jpg --out cover.jpg
// Writes a 1920 x 1080 JPEG (Meetup asks for at least 1200 x 675).
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const AREA = arg('area'), ART = arg('art'), OUT = arg('out', 'cover.jpg'), BASE = arg('base', 'http://localhost:8766');
if (!AREA || !ART) { console.error('need --area --art'); process.exit(1); }
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const art = 'data:image/jpeg;base64,' + fs.readFileSync(ART).toString('base64');
const tpl = fs.readFileSync(path.join(__dirname, '../../mocks/brand-kit/templates.html'), 'utf8');
const css = [...tpl.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
const MOS = '<span class="mos2"><i style="background:var(--dk)"></i><i style="background:var(--or)"></i><i style="background:#fff"></i><i style="background:var(--peach)"></i><i style="background:var(--br);border-radius:50%"></i><i style="background:var(--tint)"></i><i style="background:var(--md)"></i><i style="border:.35cqw solid var(--ink)"></i><i style="background:var(--or);border-radius:50% 20% 20% 20%"></i></span>';
const html = `<!doctype html><html><head><meta charset="utf-8"><base href="${BASE}/"><style>${css}
  body{background:#fff;margin:0;padding:0;font-family:Montserrat,sans-serif} #c{width:1920px;border-radius:0!important;box-shadow:none!important}</style></head><body>
  <div class="tf s169" id="c"><div class="dr" style="--c:var(--md)"><div class="dt"><span class="dl">Meetup &middot; ${esc(AREA)}</span>
  <h5><span class="blk wh">Vegan</span><br><span class="blk ik">${esc(AREA)}</span></h5>
  <span class="blk lgb"><img src="/public/logo-ve-landscape-v2.svg" alt="Vegans Explore"></span>${MOS}</div>
  <div class="dp" style="--k:.8"><img src="${art}" alt=""></div></div><div class="stp" style="--sth:1.3cqw"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div></body></html>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto(BASE + '/mocks/brand-kit/templates', { waitUntil: 'domcontentloaded' });   // same origin, so the fonts and logos load
  await p.setContent(html, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  await (await p.$('#c')).screenshot({ path: OUT, type: 'jpeg', quality: 88 }); await b.close(); console.log('wrote', OUT);
})();
