// Featured share graphics: "I've been featured" for a person Vegans Explore features (Nominate Someone, playbook ve-nominate-someone).
// Parent: the locked brand kit templates (/mocks/brand-kit/templates, canon canon-ve-brand-kit-templates, 2026-11-11): the post is
// "Posts and carousels" (4:5, the square picture on top, the mark beside a two-row headline on the band, the stripe), the story is
// "Stories and reels" (9:16, the section color on top with its label, the mark and a two-row headline, the 4:5 picture whole below).
// The CSS is read from the template page itself, so the graphics change when the template does. Words never on the picture.
// The picture is their drawn portrait (the Vegans Explore you), drawn in each shape, never cropped from another.
//
// Usage (the site served at BASE, e.g. python3 -m http.server from the repo root, or https://vegansexplore.com):
//   node scripts/brand-templates/featured.js --name "Maria Rodriguez" --city "South Florida" --square sq.jpg --tall 45.jpg --out dir [--sample]
// Writes <out>/post.jpg (1080 x 1350) and <out>/story.jpg (1080 x 1920). --sample adds the Sample stamp (demos only).
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const NAME = arg('name'), CITY = arg('city'), SQ = arg('square'), TALL = arg('tall'), OUT = arg('out', '.');
const BASE = arg('base', 'http://localhost:8766'), SAMPLE = process.argv.includes('--sample');
if (!NAME || !CITY || !SQ || !TALL) { console.error('need --name --city --square --tall'); process.exit(1); }
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const data = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(f).toString('base64');

const tpl = fs.readFileSync(path.join(__dirname, '../../mocks/brand-kit/templates.html'), 'utf8');
const css = [...tpl.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
const STRIPE = '<div class="stp"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>';
const STAMP = SAMPLE ? '<span class="smp">Sample</span>' : '';
const HEAD = 'I\'ve been<br>featured';

const post = `<div class="tf s45 fx" id="post"><div class="art"><img src="${data(SQ)}" alt=""></div>
  <div class="band" style="--c:var(--pink)"><img class="bmark" src="/public/logo-ve-mark-ink.svg" alt=""><h5>${HEAD}</h5>
  <span class="n">${esc(NAME)}<br>${esc(CITY)}</span></div>${STRIPE}${STAMP}</div>`;
const story = `<div class="tf s916 fx" id="story"><div class="top" style="--c:var(--pink)"><span class="sl">${esc(NAME)} &middot; ${esc(CITY)}</span>
  <div class="tl2"><img src="/public/logo-ve-mark-ink.svg" alt=""><h5>${HEAD}</h5></div></div>
  <div class="art"><img src="${data(TALL)}" alt=""></div>${STAMP}</div>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><base href="${BASE}/"><style>${css}
  body{background:#fff;padding:0;margin:0} .fx{width:1080px;border-radius:0!important;box-shadow:none!important}
  .s45 .band .n{text-align:right;line-height:1.5;white-space:normal;max-width:35cqw;flex:none}
  .s916 .top .sl{white-space:nowrap;max-width:100%;overflow:hidden}
  .smp{position:absolute;top:3cqw;right:3cqw;background:var(--ink);color:#fff;font:900 2.6cqw/1 Montserrat,sans-serif;letter-spacing:.16em;
    text-transform:uppercase;padding:1.4cqw 2cqw;border-radius:.9cqw;z-index:5}
  </style></head><body>${post}<div style="height:40px"></div>${story}</body></html>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1400 }, deviceScaleFactor: 1 });
  await p.goto(BASE + '/mocks/brand-kit/templates', { waitUntil: 'domcontentloaded' });   // same origin, so the fonts and logos load
  await p.setContent(html, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  // A long name or city: the small type shrinks (to 60 percent at most) until the headline and it fit side by side.
  await p.evaluate(() => {
    const fits = (e) => e.scrollWidth <= e.clientWidth + 1 && e.getBoundingClientRect().right <= e.closest('.fx').getBoundingClientRect().right
      && [...e.parentNode.querySelectorAll('h5')].every((h) => h.scrollWidth <= h.clientWidth + 1 && h.offsetHeight < h.offsetWidth);
    document.querySelectorAll('.n,.sl').forEach((e) => { const f0 = parseFloat(getComputedStyle(e).fontSize); let k = 1;
      while (!fits(e) && k > 0.6) { k -= 0.05; e.style.fontSize = (f0 * k) + 'px'; } });
  });
  const over = await p.evaluate(() => [...document.querySelectorAll('h5,.n,.sl')].filter((e) => e.scrollWidth > e.clientWidth + 1 || e.getBoundingClientRect().right > e.closest('.fx').getBoundingClientRect().right || (e.closest('.top') && e.getBoundingClientRect().bottom > e.closest('.top').getBoundingClientRect().bottom)).map((e) => (e.closest('.fx').id) + ':' + (e.className || e.tagName) + ':' + e.offsetWidth + 'x' + e.offsetHeight));
  if (over.length) { console.error('text runs over, not written:', over.join(', ')); await b.close(); process.exit(2); }
  await (await p.$('#post')).screenshot({ path: path.join(OUT, 'post.jpg'), type: 'jpeg', quality: 88 });
  await (await p.$('#story')).screenshot({ path: path.join(OUT, 'story.jpg'), type: 'jpeg', quality: 88 });
  await b.close();
  console.log('wrote', path.join(OUT, 'post.jpg'), path.join(OUT, 'story.jpg'));
})();
