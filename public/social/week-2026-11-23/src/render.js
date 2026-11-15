// The week of Nov 23 carousels and posts with platform art. Copied from public/social/review-2026-11-16/your-city/render.js (the
// renderer of last week's shipped Holiday Guide carousel, week-2026-11-16/holiday), itself copied from public/social/founding/your-city/render.js (itself from scripts/brand-templates/carousel.js): the CSS is read from the locked
// template page (/mocks/brand-kit/templates), so band, mark, stripe and end card are the kit's own. Picture area: a cropped live phone
// capture in a big card on top (about 0.83 of the phone's pixels, body text about 13 px at feed size), under it the Guide's scene in the
// kit's white frame and a dark plate naming where it is on the site. Nothing overlaps a screenshot or a scene; words sit on color.
// Usage: node render.js spec.json outdir   (site served at http://localhost:8766). Writes outdir/slide-NN.jpg.
// A slide's art may also be { "type": "scene", "scene": "square.jpg" }: a square scene drawn square, filling the picture area.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const BASE = 'http://localhost:8766', ROOT = path.join(__dirname, '../../../..');
const SPECF = path.resolve(process.argv[2]), HERE = path.dirname(SPECF); const SPEC = JSON.parse(fs.readFileSync(SPECF, 'utf8')).slides;
const file = (f) => [path.join(HERE, f), path.join(ROOT, f)].find((p) => fs.existsSync(p));
const data = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(file(f)).toString('base64');
const tpl = fs.readFileSync(path.join(ROOT, 'mocks/brand-kit/templates.html'), 'utf8');
const css = [...tpl.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
const STRIPE = '<div class="stp"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>';
const DARK = { dk: 1, md: 1 };
const N = SPEC.length;

const art = (a) => {
  if (a.type === 'scene') return `<img src="${data(a.scene)}" alt="">`;
  if (a.type === 'hero') return `<div class="pa hero" style="--c:var(--${a.tint})"><div class="gd hgd"${a.cardw ? ` style="width:${a.cardw}px"` : ''}><img src="${data(a.scene)}" alt=""></div>
    <div class="hcol"><span class="pill">${a.pill}</span>${a.list.map((x) => `<b>${x}</b>`).join('')}</div></div>`;
  return `<div class="pa" style="--c:var(--${a.tint})"><div class="crop"><img src="${data(a.crop)}" alt=""></div>
    <div class="row">${a.scene ? `<div class="gd ${a.sq ? 'sq' : ''}"><img src="${data(a.scene)}" alt=""></div>` : ''}
    <div class="plate" style="--pc:var(--${a.plate || 'dk'})"><div class="tag">${a.tag || 'On vegansexplore.com'}</div>${a.path.map((p, i) => `<div class="p">${i && !a.plain ? '<i>›</i>&nbsp;' : ''}${p}</div>`).join('')}</div></div></div>`;
};

const slide = (s, i) => {
  const id = 's' + (i + 1);
  if (s.kind === 'end') return `<div class="tf s45 fx" id="${id}"><div class="endc2"><div class="city"><img src="${data(s.city)}" alt=""></div>
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
  .pa{position:absolute;inset:0;background:color-mix(in srgb, var(--c) 30%, #fff);padding:44px 48px 48px;display:flex;flex-direction:column;gap:34px}
  .crop{flex:none;background:#fff;border:6px solid var(--ink);border-radius:24px;overflow:hidden;box-shadow:14px 14px 0 var(--ink)}
  .s45 .art .crop img{width:100%;height:auto;object-fit:fill}
  .pa .row{flex:1;min-height:0;display:flex;gap:34px;align-items:stretch;margin:0;padding:0}
  .pa .plate{align-self:stretch}
  .gd{flex:none;height:100%;aspect-ratio:4/5;background:#fff;border:10px solid #fff;border-radius:24px;box-shadow:12px 12px 0 var(--ink);overflow:hidden;box-sizing:border-box}
  .gd.sq{aspect-ratio:1/1}
  .s45 .art .gd img{width:100%;height:100%;object-fit:cover;border-radius:14px}
  .plate{flex:1;background:var(--pc);color:#fff;border:6px solid var(--ink);border-radius:24px;box-shadow:12px 12px 0 var(--ink);padding:26px 30px;display:flex;flex-direction:column;justify-content:center;gap:4px;margin-right:12px}
  .plate .tag{font-size:22px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:var(--br);margin-bottom:10px}
  .plate .p{font-size:var(--pf,42px);font-weight:900;line-height:1.08;letter-spacing:-.02em}
  .plate .p i{font-style:normal;color:var(--pink)}
  .hero{flex-direction:row;align-items:center;gap:40px;padding:48px}
  .hgd{height:auto;width:620px;aspect-ratio:4/5}
  .hcol{flex:1;display:flex;flex-direction:column;gap:14px;align-items:flex-start}
  .hcol .pill{background:var(--dk);color:#fff;font-size:24px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;padding:14px 18px;border-radius:8px;margin-bottom:14px;line-height:1.2}
  .hcol b{font-size:var(--hf,50px);font-weight:900;line-height:1;letter-spacing:-.03em;color:var(--ink);background:#fff;border:5px solid var(--ink);border-radius:10px;padding:14px 18px;box-shadow:8px 8px 0 var(--ink)}
`;
const html = `<!doctype html><html><head><meta charset="utf-8"><base href="${BASE}/"><style>${css}${extra}</style></head><body>${SPEC.map(slide).join('\n')}</body></html>`;

(async () => {
  const OUT = path.resolve(process.argv[3]); fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1400 }, deviceScaleFactor: 1 });
  await p.goto(BASE + '/mocks/brand-kit/templates', { waitUntil: 'domcontentloaded' });
  await p.setContent(html, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => {
    document.querySelectorAll('.plate').forEach((pl) => { let f = 46; const fits = () => [...pl.querySelectorAll('.p')].every((e) => e.scrollWidth <= e.clientWidth + 1) && pl.scrollHeight <= pl.clientHeight + 1;
      pl.style.setProperty('--pf', f + 'px'); while (f > 24 && !fits()) { f -= 1; pl.style.setProperty('--pf', f + 'px'); } });
    document.querySelectorAll('.hcol').forEach((c) => { let f = 54; const fits = () => [...c.querySelectorAll('b')].every((e) => e.getBoundingClientRect().right <= c.closest('.pa').getBoundingClientRect().right - 58);
      c.style.setProperty('--hf', f + 'px'); while (f > 28 && !fits()) { f -= 1; c.style.setProperty('--hf', f + 'px'); } });
  });
  const bad = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('.fx').forEach((f) => {
      f.querySelectorAll('h5').forEach((h) => {
        const lh = parseFloat(getComputedStyle(h).lineHeight) || parseFloat(getComputedStyle(h).fontSize) * 1.02;
        const box = h.closest('.band, .lo').getBoundingClientRect(), r = h.getBoundingClientRect();
        if (h.scrollWidth > h.clientWidth + 1 || r.height > lh * 2.2 || r.bottom > box.bottom + 1 || r.right > box.right + 1) out.push(f.id + ' head: ' + h.textContent);
      });
      const pa = f.querySelector('.pa'); if (pa) { const ar = pa.getBoundingClientRect();
        pa.querySelectorAll('*').forEach((e) => { const r = e.getBoundingClientRect(); if (r.width && (r.right > ar.right + 1 || r.bottom > ar.bottom + 1)) out.push(f.id + ' overflow: ' + e.className); });
        const g = pa.querySelector('.row .gd'); if (g && g.getBoundingClientRect().height < 300) out.push(f.id + ' guide too small ' + g.getBoundingClientRect().height); }
      const lo = f.querySelector('.lo'); if (lo && lo.scrollHeight > lo.clientHeight + 1) out.push(f.id + ' end too tall');
    });
    return out;
  });
  if (bad.length) { console.error('not written:\n' + bad.join('\n')); await b.close(); process.exit(2); }
  for (let i = 0; i < N; i++) await (await p.$('#s' + (i + 1))).screenshot({ path: path.join(OUT, `slide-${String(i + 1).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 88 });
  await b.close();
  console.log('wrote', N, 'slides to', OUT);
})();
