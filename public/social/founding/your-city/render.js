// "Your city" Founding Member carousel. Copied from scripts/brand-templates/carousel.js: the CSS is read from the locked template page
// (/mocks/brand-kit/templates, "Posts and carousels"), so the band, mark, stripe and end card are the kit's own. Added here: picture areas
// that are not a single square scene (a city-name wall on color, a 16:9 city drawn whole with its name on a color plate under it, a cropped
// phone capture in a card, a Founding Member type card, a 2x2 city mosaic of 16:9 tiles on the end card). Words never sit on a picture.
// Usage: node render.js   (site served at http://localhost:8766 from the repo root). Writes slide-01.jpg ... next to this file.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const BASE = 'http://localhost:8766', HERE = __dirname, ROOT = path.join(HERE, '../../../..');
const SPEC = JSON.parse(fs.readFileSync(path.join(HERE, 'spec.json'), 'utf8'));
const data = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(ROOT, f)).toString('base64');
const tpl = fs.readFileSync(path.join(ROOT, 'mocks/brand-kit/templates.html'), 'utf8');
const css = [...tpl.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
const STRIPE = '<div class="stp"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>';
const DARK = { dk: 1, md: 1 };
const N = SPEC.slides.length;

const art = (a) => {
  if (a.type === 'scene') return `<img src="${data(a.src)}" alt="">`;
  if (a.type === 'wall') return `<div class="wall"><div class="eb">${a.eyebrow}</div><div class="names">${a.names.map((n, i) =>
    `<b class="${a.hi.includes(n) ? 'hi' : ''}">${n}</b>`).join('')}</div><div class="foot">${a.foot}</div></div>`;
  if (a.type === 'city') return `<div class="cityart"><img src="${data(a.src)}" alt=""><div class="plate" style="--c:var(--${a.color});--t:${DARK[a.color] ? '#fff' : 'var(--ink)'}">
    <div class="tag">${a.tag}</div><div class="nm">${a.name}</div><div class="ln">${a.line}</div></div></div>`;
  if (a.type === 'shot') return `<div class="shot" style="--c:var(--${a.color})"><div class="tag2">${a.tag}</div><div class="card"><img src="${data(a.src)}" alt=""></div><div class="ln2">${a.line}</div></div>`;
  if (a.type === 'badge') return `<div class="badge"><div class="bcard"><img class="bm" src="/public/logo-ve-mark-white.svg" alt=""><div class="k">Founding Member</div>
    <div class="s">${a.sub}</div></div><div class="when">${a.when}</div><div class="cities">${a.cities}</div></div>`;
};

const slide = (s, i) => {
  const id = 's' + (i + 1);
  if (s.kind === 'end') return `<div class="tf s45 fx" id="${id}"><div class="endc2"><div class="city mosaic">${s.cities.map((c) =>
    `<img src="${data(c)}" alt="">`).join('')}</div>
    <div class="lo"><img class="lg" src="/public/logo-ve-landscape-v2-white.svg" alt=""><h5>${s.head}</h5><p>${s.line}</p>
    <span class="b">${s.button}</span></div></div>${STRIPE}</div>`;
  const dark = DARK[s.color];
  return `<div class="tf s45 fx" id="${id}"><div class="art">${art(s.art)}</div>
    <div class="band" style="--c:var(--${s.color});--t:${dark ? '#fff' : 'var(--ink)'}"><img class="bmark" src="/public/logo-ve-mark-${dark ? 'white' : 'ink'}.svg" alt="">
    <h5>${s.head}</h5>${s.kind === 'inside' ? `<span class="n">${i + 1} / ${N}</span>` : ''}</div>${STRIPE}</div>`;
};

const extra = `
  body{background:#fff;padding:0;margin:0} .fx{width:1080px;border-radius:0!important;box-shadow:none!important;margin-bottom:40px}
  .endc2 p{max-width:none}
  .wall{position:absolute;inset:0;background:var(--dk);color:#fff;padding:6cqw 6cqw 5cqw;display:flex;flex-direction:column}
  .wall .eb{align-self:flex-start;background:var(--br);color:var(--ink);font-size:2.8cqw;font-weight:900;letter-spacing:.16em;text-transform:uppercase;padding:1.2cqw 2cqw;border-radius:.6cqw}
  .wall .names{flex:1;display:flex;flex-wrap:wrap;align-content:center;gap:1.4cqw 2.6cqw;margin:3cqw 0}
  .wall .names b{font-size:var(--fs,5.6cqw);font-weight:900;line-height:1.05;letter-spacing:-.025em;text-transform:uppercase;color:#fff;opacity:.92}
  .wall .names b.hi{color:var(--pink);opacity:1}
  .wall .foot{font-size:3.6cqw;font-weight:800;color:var(--br)}
  .cityart{position:absolute;inset:0;display:flex;flex-direction:column}
  .s45 .art .cityart img{width:100cqw;height:56.25cqw;object-fit:cover;flex:none;border-bottom:1.2cqw solid #fff}
  .cityart .plate{flex:1;background:var(--c);color:var(--t);padding:3.2cqw 5cqw 3cqw;display:flex;flex-direction:column;justify-content:center}
  .plate .tag{font-size:2.6cqw;font-weight:900;letter-spacing:.18em;text-transform:uppercase;opacity:.85}
  .plate .nm{font-size:12cqw;font-weight:900;line-height:.95;letter-spacing:-.045em;text-transform:uppercase;margin:.8cqw 0 1.4cqw}
  .plate .ln{font-size:3.6cqw;font-weight:700;line-height:1.25}
  .shot{position:absolute;inset:0;background:var(--c);padding:5cqw 6cqw;display:flex;flex-direction:column;gap:3cqw}
  .shot .tag2{align-self:flex-start;background:var(--dk);color:#fff;font-size:2.8cqw;font-weight:900;letter-spacing:.16em;text-transform:uppercase;padding:1.2cqw 2cqw;border-radius:.6cqw}
  .shot .card{border:.6cqw solid var(--ink);border-radius:2cqw;overflow:hidden;box-shadow:1.6cqw 1.6cqw 0 var(--dk);background:#fff}
  .s45 .art .shot .card img{width:100%;height:auto}
  .shot .ln2{font-size:3.8cqw;font-weight:800;line-height:1.25;color:var(--ink);margin-top:auto}
  .badge{position:absolute;inset:0;background:var(--pink);padding:6cqw 7cqw 5.4cqw;display:flex;flex-direction:column}
  .bcard{background:var(--dk);color:#fff;border:.7cqw solid var(--ink);border-radius:2cqw;box-shadow:1.8cqw 1.8cqw 0 var(--ink);padding:6cqw 6cqw 5.4cqw}
  .s45 .art .bcard .bm{height:13cqw;width:auto}
  .bcard .k{font-size:10.4cqw;font-weight:900;line-height:.98;letter-spacing:-.04em;text-transform:uppercase;margin-top:3.4cqw;color:var(--br)}
  .bcard .s{font-size:4.2cqw;font-weight:800;margin-top:2.4cqw}
  .badge .when{font-size:5.2cqw;padding-top:5cqw;font-weight:900;line-height:1.08;letter-spacing:-.02em;color:var(--ink);margin-top:auto}
  .badge .cities{font-size:3.2cqw;font-weight:700;color:var(--ink);margin-top:1.6cqw;line-height:1.3}
  .mosaic{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:.8cqw;background:#fff}
  .endc2 .mosaic img{width:100%;height:100%;object-fit:cover;aspect-ratio:16/9}
`;
const html = `<!doctype html><html><head><meta charset="utf-8"><base href="${BASE}/"><style>${css}${extra}</style></head><body>${SPEC.slides.map(slide).join('\n')}</body></html>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1400 }, deviceScaleFactor: 1 });
  await p.goto(BASE + '/mocks/brand-kit/templates', { waitUntil: 'domcontentloaded' });
  await p.setContent(html, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  // fit the city wall's names to its box
  await p.evaluate(() => document.querySelectorAll('.wall .names').forEach((n) => {
    let fs = 9; n.style.setProperty('--fs', fs + 'cqw');
    while (fs > 3 && n.scrollHeight > n.clientHeight + 1) { fs -= 0.1; n.style.setProperty('--fs', fs.toFixed(2) + 'cqw'); }
  }));
  const bad = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('.fx').forEach((f) => {
      f.querySelectorAll('h5').forEach((h) => {
        const lh = parseFloat(getComputedStyle(h).lineHeight) || parseFloat(getComputedStyle(h).fontSize) * 1.02;
        const box = h.closest('.band, .lo').getBoundingClientRect(), r = h.getBoundingClientRect();
        if (h.scrollWidth > h.clientWidth + 1 || r.height > lh * 2.2 || r.bottom > box.bottom + 1 || r.right > box.right + 1) out.push(f.id + ' head: ' + h.textContent);
      });
      const fr = f.getBoundingClientRect();
      f.querySelectorAll('.art *, .lo *').forEach((e) => { const r = e.getBoundingClientRect();
        if (r.width && (r.right > fr.right + 1 || r.bottom > fr.bottom + 1)) out.push(f.id + ' overflow: ' + e.className); });
      const a = f.querySelector('.art'); if (a && a.scrollHeight > a.clientHeight + 1) out.push(f.id + ' art too tall');
      const lo = f.querySelector('.lo'); if (lo && lo.scrollHeight > lo.clientHeight + 1) out.push(f.id + ' end too tall');
    });
    return out;
  });
  if (bad.length) { console.error('not written:\n' + bad.join('\n')); await b.close(); process.exit(2); }
  for (let i = 0; i < N; i++) await (await p.$('#s' + (i + 1))).screenshot({ path: path.join(HERE, `slide-${String(i + 1).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 88 });
  await b.close();
  console.log('wrote', N, 'slides');
})();
