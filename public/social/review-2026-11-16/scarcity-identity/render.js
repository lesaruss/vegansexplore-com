// "A city is open" share graphics: the post and story for a new Vegans Explore community (Sean, 2026-11-13: "approved, draft the Seattle
// post"; the first city opened because a business is there, Next Level Veggie Grill). Copied from find-us.js (the locked brand kit
// templates, /mocks/brand-kit/templates, canon canon-ve-brand-kit-templates): the post is "Posts and carousels" (4:5, the city art square on
// top, the mark beside a two-row headline on the band, the stripe), the story is "Stories and reels" (9:16, the section color on top with its
// label, the mark and a two-row headline, the 4:5 city art whole below). Communities mid green. The city art is made in each shape (square
// for the post, 4:5 for the story), never cropped. Words never on the picture; who is tagged goes in the caption.
//
// Usage (the site served at BASE, e.g. python3 -m http.server 8766 from the repo root):
//   node scripts/brand-templates/city-open.js --city Seattle --square square.jpg --tall45 tall45.jpg --out dir
// Writes <out>/post.jpg (1080 x 1350) and <out>/story.jpg (1080 x 1920).
// scarcity-identity review fix (2026-11-15): city-open.js plus the call to action. The post band trades the 9 px "A new community"
// kicker for a full-width row: one orange "Join free" button and "Founding Member ends January 1". The story's ink label carries
// the deadline and a line under the headline points to the link sticker. Usage: node render.js --city Seattle --square ... --tall45 ... --out dir
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const CITY = arg('city'), SQ = arg('square'), T45 = arg('tall45'), OUT = arg('out', '.');
const BASE = arg('base', 'http://localhost:8766'), SAMPLE = process.argv.includes('--sample');
if (!CITY || !SQ || !T45) { console.error('need --city --square --tall45'); process.exit(1); }
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const data = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(f).toString('base64');
const square = data(SQ), tall45 = data(T45);

const tpl = fs.readFileSync(path.join(__dirname, '../../../../mocks/brand-kit/templates.html'), 'utf8');
const css = [...tpl.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
const STRIPE = '<div class="stp"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>';
const STAMP = SAMPLE ? '<span class="smp">Sample</span>' : '';
const HEAD = 'Vegan ' + esc(CITY) + '<br>is open';
const C = '--c:var(--md);--t:#fff';

const post = `<div class="tf s45 fx" id="post"><div class="art"><img src="${square}" alt=""></div>
  <div class="band" style="${C}"><img class="bmark" src="/public/logo-ve-mark-white.svg" alt=""><h5>${HEAD}</h5><div class="cta"><span class="jb">Join free</span><span class="fm">Founding Member ends January 1</span></div></div>${STRIPE}${STAMP}</div>`;
const story = `<div class="tf s916 fx" id="story"><div class="top" style="${C}"><span class="sl">Founding Member ends Jan 1</span>
  <div class="tl2"><img src="/public/logo-ve-mark-white.svg" alt=""><h5>${HEAD}</h5></div></div>
  <div class="art"><img src="${tall45}" alt=""></div>${STAMP}</div>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><base href="${BASE}/"><style>${css}
  body{background:#fff;padding:0;margin:0} .fx{width:1080px;border-radius:0!important;box-shadow:none!important}
  .s916 .top h5{font-size:7.2cqw!important}
  .s916 .top{padding-top:17cqw!important} /* headroom between the label and the headline, matched to the bounty story (Sean, 2026-11-15) */
  .s45 .band{display:grid!important;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:3.4cqw;row-gap:2.2cqw;
    align-content:center;padding:2.6cqw 5cqw 3.8cqw!important}
  .s45 .band .bmark{height:12cqw!important;grid-row:1;align-self:center}
  .s45 .band h5{font-size:6.2cqw!important;grid-row:1;align-self:center}
  .s45 .band .cta{grid-column:1 / -1;display:flex;align-items:center;gap:3cqw}
  .s45 .band .jb{background:var(--or);color:var(--ink);font:900 3.6cqw/1 Montserrat,sans-serif;padding:1.5cqw 3cqw;border-radius:.6cqw;white-space:nowrap}
  .s45 .band .fm{font:800 3.6cqw/1.1 Montserrat,sans-serif;white-space:nowrap}
  .s916 .top .sl{font-size:3.6cqw!important}
  .s916 .top .sl{white-space:nowrap;max-width:100%;overflow:hidden}
  .art.lgo{background:#fff;display:grid;place-items:center}
  .art.lgo img{width:78%!important;height:78%!important;object-fit:contain!important;object-position:center!important}
  .smp{position:absolute;top:3cqw;right:3cqw;background:var(--ink);color:#fff;font:900 2.6cqw/1 Montserrat,sans-serif;letter-spacing:.16em;
    text-transform:uppercase;padding:1.4cqw 2cqw;border-radius:.9cqw;z-index:5}
  </style></head><body>${post}<div style="height:40px"></div>${story}</body></html>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1400 }, deviceScaleFactor: 1 });
  await p.goto(BASE + '/mocks/brand-kit/templates.html', { waitUntil: 'domcontentloaded' });   // same origin, so the fonts and logos load
  await p.setContent(html, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  // Headlines are always two rows (Sean, 2026-11-10): a long city ("Vegan San Francisco is open") shrinks to 70 percent at most until it
  // fits in two; a headline still on three rows is refused below.
  const rows = () => p.evaluate(() => [...document.querySelectorAll('h5')].map((h) => { const c = h.cloneNode(); c.textContent = 'X';
    h.parentNode.appendChild(c); const one = c.offsetHeight; c.remove(); return Math.round(h.offsetHeight / one); }));
  await p.evaluate(() => document.querySelectorAll('h5').forEach((h) => { const f0 = parseFloat(getComputedStyle(h).fontSize); let k = 1;
    const lines = () => { const c = h.cloneNode(); c.textContent = 'X'; h.parentNode.appendChild(c); const one = c.offsetHeight; c.remove(); return Math.round(h.offsetHeight / one); };
    while (lines() > 2 && k > 0.7) { k -= 0.04; h.style.setProperty('font-size', (f0 * k) + 'px', 'important'); } }));
  // A long name or city: the small type shrinks (to 60 percent at most) until the headline and it fit side by side.
  await p.evaluate(() => {
    const fits = (e) => e.scrollWidth <= e.clientWidth + 1 && e.getBoundingClientRect().right <= e.closest('.fx').getBoundingClientRect().right
      && [...e.parentNode.querySelectorAll('h5')].every((h) => h.scrollWidth <= h.clientWidth + 1 && h.offsetHeight < h.offsetWidth);
    document.querySelectorAll('.n,.sl').forEach((e) => { const f0 = parseFloat(getComputedStyle(e).fontSize); let k = 1;
      while (!fits(e) && k > 0.6) { k -= 0.05; e.style.fontSize = (f0 * k) + 'px'; } });
  });
  const over = await p.evaluate(() => [...document.querySelectorAll('h5,.n,.sl,.fb,.fm,.jb')].filter((e) => e.scrollWidth > e.clientWidth + 1
    || e.getBoundingClientRect().right > e.closest('.fx').getBoundingClientRect().right).map((e) => e.className || e.tagName));
  if ((await rows()).some((n) => n > 2)) { console.error('headline over two rows, not written'); await b.close(); process.exit(2); }
  if (over.length) { console.error('text runs over, not written:', over.join(', ')); await b.close(); process.exit(2); }
  await (await p.$('#post')).screenshot({ path: path.join(OUT, 'post.jpg'), type: 'jpeg', quality: 88 });
  await (await p.$('#story')).screenshot({ path: path.join(OUT, 'story.jpg'), type: 'jpeg', quality: 88 });
  await b.close();
  console.log('wrote', path.join(OUT, 'post.jpg'), path.join(OUT, 'story.jpg'));
})();
