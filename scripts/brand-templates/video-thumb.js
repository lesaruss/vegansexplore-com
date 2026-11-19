// Video thumbnail (Sean, 2026-11-19: "What about thumbnails?"), the locked YouTube thumbnail in /mocks/brand-kit/templates. Copied from meetup-cover.js.
// Broward... Palm Beach and the Miami version... use the city artwork"). Copied from the locked YouTube thumbnail in
// /mocks/brand-kit/templates (canon canon-ve-brand-kit-templates): 16:9, words in blocks on the section color, the logo block, the
// mosaic, the 4:5 city art whole on the right, the stripe. Communities mid green. Words never on the picture.
//
// Usage (the site served at BASE, e.g. python3 -m http.server 8766 from the repo root):
//   node scripts/brand-templates/meetup-cover.js --label 'Vegans Explore' --l1 'Your Vegan world,' --l2 'in one place' --art art-4x5.jpg --out thumb.jpg
// Writes a 1920 x 1080 JPEG (Meetup asks for at least 1200 x 675).
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const LABEL = arg('label'), L1 = arg('l1'), L2 = arg('l2'), ART = arg('art'), C = arg('color', 'pink'), AREA = L2, OUT = arg('out', 'cover.jpg'), BASE = arg('base', 'http://localhost:8766');
if (!LABEL || !L1 || !L2 || !ART) { console.error('need --label --l1 --l2 --art'); process.exit(1); }
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const art = 'data:image/jpeg;base64,' + fs.readFileSync(ART).toString('base64');
const tpl = fs.readFileSync(path.join(__dirname, '../../mocks/brand-kit/templates.html'), 'utf8');
const css = [...tpl.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
const MOS = '<span class="mos2"><i style="background:var(--dk)"></i><i style="background:var(--or)"></i><i style="background:#fff"></i><i style="background:var(--peach)"></i><i style="background:var(--br);border-radius:50%"></i><i style="background:var(--tint)"></i><i style="background:var(--md)"></i><i style="border:.35cqw solid var(--ink)"></i><i style="background:var(--or);border-radius:50% 20% 20% 20%"></i></span>';
const html = `<!doctype html><html><head><meta charset="utf-8"><base href="${BASE}/"><style>${css}
  body{background:#fff;margin:0;padding:0;font-family:Montserrat,sans-serif} #c{width:1920px;border-radius:0!important;box-shadow:none!important}</style></head><body>
  <div class="tf s169" id="c"><div class="dr" style="--c:var(--${C})${';--hs:' + Math.min(8, 86 / Math.max(L1.length, L2.length)).toFixed(2) + 'cqw'}"><div class="dt"><span class="dl">${esc(LABEL)}</span>
  <h5><span class="blk wh">${esc(L1)}</span><br><span class="blk ik">${esc(L2)}</span></h5>
  <span class="blk lgb"><img src="/public/logo-ve-landscape-v2.svg" alt="Vegans Explore"></span>${MOS}</div>
  <div class="dp" style="--k:.8"><img src="${art}" alt=""></div></div><div class="stp" style="--sth:1.3cqw"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div></body></html>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto(BASE + '/mocks/brand-kit/templates', { waitUntil: 'domcontentloaded' });   // same origin, so the fonts and logos load
  await p.setContent(html, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  await (await p.$('#c')).screenshot({ path: OUT, type: 'jpeg', quality: 88 }); await b.close(); console.log('wrote', OUT);
})();
