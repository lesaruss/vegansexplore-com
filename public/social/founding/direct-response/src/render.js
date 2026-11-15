// Direct-response Founding Member carousel. Copied from scripts/brand-templates/carousel.js: reads the template CSS from
// mocks/brand-kit/templates.html, same band, mark, stripe and end card. The picture area (top 1080 x 1080) is a color field:
// a running deadline ticker, a "you" kicker on color, then the proof (a cropped live-site capture or a Guide scene) as a framed card.
// Words never sit on a picture. Run: node public/social/founding/direct-response/src/render.js
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '../../../../..'), HERE = __dirname, OUT = path.join(HERE, '..'), BASE = 'http://localhost:8766';
const data = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(fs.existsSync(path.join(HERE, f)) ? path.join(HERE, f) : path.join(ROOT, f)).toString('base64');
const tpl = fs.readFileSync(path.join(ROOT, 'mocks/brand-kit/templates.html'), 'utf8');
const css = [...tpl.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
const STRIPE = '<div class="stp"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>';
const SPEC = JSON.parse(fs.readFileSync(path.join(HERE, 'spec.json'), 'utf8')).slides, N = SPEC.length;
const DARK = { dk: 1, md: 1 };
const TICK = '<div class="tick"><b>Founding Member</b><i></i><span>Free until Jan 1</span></div>';

const pic = (s) => {
  const bg = `background:var(--${s.bg})`, ink = DARK[s.bg] ? '#fff' : 'var(--ink)';
  if (s.type) return `<div class="art pa" style="${bg};color:${ink}">${s.tick === false ? '' : TICK}<div class="ty">${s.type}</div></div>`;
  return `<div class="art pa" style="${bg};color:${ink}">${TICK}<div class="kk">${s.kicker}</div>
    <div class="cardw"><div class="card"><img style="width:${s.w}cqw" src="${data(s.img)}" alt=""></div></div></div>`;
};
const slide = (s, i) => {
  const id = 's' + (i + 1);
  if (s.kind === 'end') return `<div class="tf s45 fx" id="${id}"><div class="endc2"><div class="city"><img src="${data(s.city)}" alt=""></div>
    <div class="lo"><img class="lg" src="/public/logo-ve-landscape-v2-white.svg" alt=""><h5>${s.head}</h5><p>${s.line}</p>
    <span class="b">${s.button}</span></div></div>${STRIPE}</div>`;
  const dark = DARK[s.color];
  return `<div class="tf s45 fx" id="${id}">${pic(s)}
    <div class="band" style="--c:var(--${s.color});--t:${dark ? '#fff' : 'var(--ink)'}"><img class="bmark" src="/public/logo-ve-mark-${dark ? 'white' : 'ink'}.svg" alt="">
    <h5>${s.head}</h5>${i ? `<span class="n">${i + 1} / ${N}</span>` : ''}</div>${STRIPE}</div>`;
};
const extra = `
  body{background:#fff;padding:0;margin:0} .fx{width:1080px;border-radius:0!important;box-shadow:none!important;margin-bottom:40px}
  .endc2 p{max-width:none;font-size:3.6cqw}
  .pa{display:flex;flex-direction:column;overflow:hidden}
  .tick{flex:none;height:8.4cqw;background:var(--ink);color:#fff;display:flex;align-items:center;justify-content:center;gap:2.4cqw;
    font-size:3.5cqw;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
  .tick b{color:var(--br)} .tick i{width:1.4cqw;height:1.4cqw;border-radius:50%;background:var(--pink)}
  .kk{flex:none;padding:4.6cqw 6cqw 0;font-size:7.4cqw;font-weight:900;line-height:1.02;letter-spacing:-.03em}
  .pa[style*="pink"] .kk em{background:var(--ink);color:var(--pink)}
  .kk em{font-style:normal;background:var(--pink);color:var(--ink);padding:0 1.2cqw;border-radius:.6cqw;box-decoration-break:clone;-webkit-box-decoration-break:clone}
  .cardw{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:4.2cqw 6cqw 6.4cqw}
  .card{max-width:100%;max-height:100%;border:1cqw solid var(--ink);border-radius:2.2cqw;overflow:hidden;box-shadow:1.8cqw 1.8cqw 0 var(--ink);background:#fff}
  .s45 .pa .card img{display:block;height:auto}
  .ty{flex:1;display:flex;flex-direction:column;justify-content:center;padding:6cqw 7cqw}
  .ty .big{font-size:13.4cqw;font-weight:900;line-height:.98;letter-spacing:-.04em}
  .ty .big em{font-style:normal;background:var(--ink);color:var(--pink);padding:0 1.6cqw;border-radius:1cqw;box-decoration-break:clone;-webkit-box-decoration-break:clone}
  .ty .sub{font-size:4.6cqw;font-weight:800;margin-top:5cqw;line-height:1.2}
  .ty .swipe{display:inline-block;margin-top:5cqw;font-size:3.6cqw;font-weight:900;letter-spacing:.14em;text-transform:uppercase;border-bottom:.8cqw solid currentColor;align-self:flex-start;padding-bottom:.6cqw}
  .ty .eb{font-size:3.4cqw;font-weight:900;letter-spacing:.16em;text-transform:uppercase;margin-bottom:3cqw;opacity:.9}
  .cities{display:flex;flex-wrap:wrap;gap:1.5cqw 1.5cqw;margin-top:3.4cqw}
  .cities span{font-size:3.1cqw;font-weight:900;background:#fff;color:var(--ink);padding:1cqw 1.7cqw;border-radius:.6cqw}
  .badge{align-self:flex-start;background:var(--dk);color:#fff;border-radius:1.4cqw;padding:3cqw 4.4cqw;display:flex;align-items:center;gap:3cqw;box-shadow:1.8cqw 1.8cqw 0 var(--ink);border:.8cqw solid var(--ink)}
  .s45 .pa .badge img{height:10cqw;width:auto} .badge b{font-size:6cqw;font-weight:900;letter-spacing:-.02em;line-height:1}
  .badge small{display:block;font-size:2.8cqw;letter-spacing:.16em;text-transform:uppercase;color:var(--br);margin-bottom:1cqw}
  .facts{margin-top:6cqw;display:grid;gap:2.4cqw}
  .facts div{font-size:4.5cqw;font-weight:900;line-height:1.1;display:flex;gap:2.4cqw;align-items:baseline}
  .facts div::before{content:"";flex:none;width:2.4cqw;height:2.4cqw;background:var(--br);border-radius:.4cqw;transform:translateY(-.4cqw)}
  .clock{display:grid;grid-template-columns:1fr 1fr;gap:2.4cqw;margin-top:4cqw}
  .clock div{background:#fff;color:var(--ink);border:.8cqw solid var(--ink);border-radius:1.4cqw;padding:3cqw 3.4cqw;box-shadow:1.4cqw 1.4cqw 0 var(--ink)}
  .clock b{display:block;font-size:8cqw;font-weight:900;line-height:1;letter-spacing:-.03em} .clock small{font-size:2.9cqw;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
`;
const html = `<!doctype html><html><head><meta charset="utf-8"><base href="${BASE}/"><style>${css}${extra}</style></head><body>${SPEC.map(slide).join('\n')}</body></html>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1400 }, deviceScaleFactor: 1 });
  await p.goto(BASE + '/mocks/brand-kit/templates', { waitUntil: 'domcontentloaded' });
  await p.setContent(html, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const bad = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('.fx').forEach((f) => {
      f.querySelectorAll('h5').forEach((h) => {
        const lh = parseFloat(getComputedStyle(h).lineHeight) || parseFloat(getComputedStyle(h).fontSize) * 1.02;
        const box = h.closest('.band, .lo').getBoundingClientRect(), r = h.getBoundingClientRect();
        if (h.scrollWidth > h.clientWidth + 1 || r.height > lh * 2.2 || r.bottom > box.bottom + 1 || r.right > box.right + 1) out.push(f.id + ' head: ' + h.textContent);
      });
      const pa = f.querySelector('.pa'); if (!pa) return; const pr = pa.getBoundingClientRect();
      pa.querySelectorAll('.kk, .ty > *, .card, .tick').forEach((e) => { const r = e.getBoundingClientRect();
        if (r.bottom > pr.bottom + 1 || r.right > pr.right + 1 || e.scrollWidth > e.clientWidth + 1) out.push(f.id + ' pic: ' + e.className + ' ' + e.textContent.slice(0, 40)); });
    });
    return out;
  });
  if (bad.length && !process.env.FORCE) { console.error('overflow, not written:\n' + bad.join('\n')); await b.close(); process.exit(2); }
  for (let i = 0; i < N; i++) await (await p.$('#s' + (i + 1))).screenshot({ path: path.join(OUT, `slide-${String(i + 1).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 88 });
  await b.close();
  console.log('wrote', N);
})();
