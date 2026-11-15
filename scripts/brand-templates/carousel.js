// Carousels on the locked brand kit template ("Posts and carousels", /mocks/brand-kit/templates, canon canon-ve-brand-kit-templates).
// Copied from featured.js: the CSS is read from the template page itself, so the slides change when the template does.
// 4:5, 1080 x 1350. Cover and inside slides: a square scene drawn square on top, the section-color band with the mark left of a two-row
// headline (white mark on dark, ink on light), the slide number right on inside slides, the stripe along the bottom. End card: a city
// drawn 16:9 on top, the white landscape logo, a two-row headline (second row bright green), one line, a big button. Words never on a picture.
//
// Usage (the site served at BASE, e.g. python3 -m http.server 8766 from the repo root):
//   node scripts/brand-templates/carousel.js --spec spec.json --out dir
// spec.json: { "slides": [ { "kind": "cover"|"inside", "art": "path.jpg", "color": "dk|br|or|pink|md|peach|tint", "head": "Row one<br>row two" },
//                          { "kind": "end", "city": "path-16x9.jpg", "head": "Row one<br><span>row two</span>", "line": "...", "button": "Join free" } ] }
// Writes <out>/slide-01.jpg ... Exits 2 (writes nothing) if any headline runs past two rows or out of its band.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const SPEC = JSON.parse(fs.readFileSync(arg('spec'), 'utf8')), OUT = arg('out', '.'), BASE = arg('base', 'http://localhost:8766');
const DIR = path.dirname(path.resolve(arg('spec')));
const ROOT = path.join(__dirname, '../..');
const file = (f) => { for (const p of [path.resolve(DIR, f), path.join(ROOT, f)]) if (fs.existsSync(p)) return p; throw new Error('no file ' + f); };
const data = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(file(f)).toString('base64');

const tpl = fs.readFileSync(path.join(ROOT, 'mocks/brand-kit/templates.html'), 'utf8');
const css = [...tpl.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
const STRIPE = '<div class="stp"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>';
const DARK = { dk: 1 };                       // bands that take white type and the white mark
const N = SPEC.slides.length;

const slide = (s, i) => {
  const id = 's' + (i + 1);
  if (s.kind === 'end') return `<div class="tf s45 fx" id="${id}"><div class="endc2"><div class="city"><img src="${data(s.city)}" alt=""></div>
    <div class="lo"><img class="lg" src="/public/logo-ve-landscape-v2-white.svg" alt=""><h5>${s.head}</h5><p>${s.line || ''}</p>
    ${s.button ? `<span class="b">${s.button}</span>` : ''}</div></div>${STRIPE}</div>`;
  const dark = DARK[s.color];
  return `<div class="tf s45 fx" id="${id}"><div class="art"><img src="${data(s.art)}" alt=""></div>
    <div class="band" style="--c:var(--${s.color});--t:${dark ? '#fff' : 'var(--ink)'}"><img class="bmark" src="/public/logo-ve-mark-${dark ? 'white' : 'ink'}.svg" alt="">
    <h5>${s.head}</h5>${s.kind === 'inside' ? `<span class="n">${i + 1} / ${N}</span>` : ''}</div>${STRIPE}</div>`;
};

const html = `<!doctype html><html><head><meta charset="utf-8"><base href="${BASE}/"><style>${css}
  body{background:#fff;padding:0;margin:0} .fx{width:1080px;border-radius:0!important;box-shadow:none!important;margin-bottom:40px}
  .endc2 p{max-width:none}
  </style></head><body>${SPEC.slides.map(slide).join('\n')}</body></html>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1400 }, deviceScaleFactor: 1 });
  await p.goto(BASE + '/mocks/brand-kit/templates', { waitUntil: 'domcontentloaded' });   // same origin, so the fonts and logos load
  await p.setContent(html, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const bad = await p.evaluate(() => [...document.querySelectorAll('.fx')].flatMap((f) => [...f.querySelectorAll('h5')].filter((h) => {
    const lh = parseFloat(getComputedStyle(h).lineHeight) || parseFloat(getComputedStyle(h).fontSize) * 1.02;
    const box = h.closest('.band, .lo').getBoundingClientRect(), r = h.getBoundingClientRect();
    return h.scrollWidth > h.clientWidth + 1 || r.height > lh * 2.2 || r.bottom > box.bottom + 1 || r.right > box.right + 1;
  }).map((h) => f.id + ': ' + h.textContent)));
  if (bad.length) { console.error('headline runs over, not written:', bad.join(' | ')); await b.close(); process.exit(2); }
  for (let i = 0; i < N; i++) await (await p.$('#s' + (i + 1))).screenshot({ path: path.join(OUT, `slide-${String(i + 1).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 88 });
  await b.close();
  console.log('wrote', N, 'slides to', OUT);
})();
