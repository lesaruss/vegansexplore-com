// "Your week" carousel. Copied from scripts/brand-templates/carousel.js: the CSS is read from the locked template page
// (mocks/brand-kit/templates.html), so the band, mark, stripe and end card are the kit's own. Added here: the day rail (a dark column
// on the left of the picture area with the day, the time and seven week squares) beside a 4:5 scene drawn whole at 864 x 1080,
// and type slides (words on color, no picture) for the cover, the cities and the deadline.
// Usage (site served at localhost:8766): node render.js   (writes slide-01.jpg ... beside this file)
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');

const HERE = __dirname, ROOT = path.join(HERE, '../../../..'), BASE = 'http://localhost:8766';
const data = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(ROOT, f)).toString('base64');
const tpl = fs.readFileSync(path.join(ROOT, 'mocks/brand-kit/templates.html'), 'utf8');
const css = [...tpl.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
const STRIPE = '<div class="stp"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>';
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const S = [
  { kind: 'type', color: 'dk', head: 'Your Vegan week,<br>made easy',
    body: `<div class="ty" style="background:var(--peach)"><span class="tg">A week in your life</span>
      <div class="big">Monday.<br>6:47 PM.<br><em>Nothing<br>to eat.</em></div>
      <div class="wrow">${DAYS.map((d,i)=>`<i class="${i?'':'now'}">${d}</i>`).join('')}</div><div class="swipe">Swipe through your week <b>&rarr;</b></div></div>` },
  { kind: 'day', day: 0, time: '6:48 PM', art: 'public/guides/welcome/liz-directory.jpg', color: 'br', head: 'Tap Near me.<br>Dinner, found.' },
  { kind: 'day', day: 1, time: '12:30 PM', art: 'public/guides/welcome/liz-pts-checkin.jpg', color: 'tint', head: 'Check in.<br>Plus 10 points.' },
  { kind: 'day', day: 2, time: '6:15 PM', art: 'public/guides/welcome/liz-media-sofa.jpg', color: 'peach', head: 'Wednesday:<br>a free show' },
  { kind: 'day', day: 4, time: '5:00 PM', art: 'public/guides/welcome/liz-pts-friends.jpg', color: 'pink', head: 'Friday plans,<br>already saved' },
  { kind: 'day', day: 5, time: '11:00 AM', art: 'public/guides/welcome/liz-events.jpg', color: 'br', head: 'A Vegan event<br>near you' },
  { kind: 'day', day: 6, time: '2:00 PM', art: 'public/guides/welcome/liz-pts-give-v2.jpg', color: 'tint', head: 'Give back<br>with points' },
  { kind: 'type', color: 'dk', head: 'Wherever<br>you live',
    body: `<div class="ty" style="background:var(--tint)"><span class="tg">Every week, in</span><div class="cities">${
      ['South Florida', 'Central Florida', 'North Florida', 'Atlanta', 'Washington, D.C.', 'Maryland', 'Virginia', 'West Virginia', 'Delaware',
       'New York', 'Philadelphia', 'Boston', 'Austin', 'Denver', 'Los Angeles', 'San Francisco', 'Portland', 'Seattle', 'London']
        .map((c, i) => `<span style="--c:var(--${['dk', 'br', 'pink', 'peach', 'md'][i % 5]});--t:${[0, 4].includes(i % 5) ? '#fff' : 'var(--ink)'}">${c}</span>`).join('')
    }</div><div class="foot">Near me works anywhere: a ZIP or a city.</div></div>` },
  { kind: 'type', color: 'pink', head: 'Gone after<br>January 1',
    body: `<div class="ty dline" style="background:var(--dk);color:#fff"><span class="tg pk">The catch</span>
      <div class="cal"><div class="m">JAN</div><div class="d">1</div><div class="t">12:00 AM ET</div></div>
      <div class="big sm">That whole week?<br>Free. Always.</div>
      <p>Founding Member is not forever. Join before midnight Eastern, January 1, 2027, and it stays on your profile for good. After that, it is gone.</p></div>` },
  { kind: 'end', city: 'communities/new-york/wide.jpg', head: 'Become a<br><span>Founding Member</span>',
    line: 'Free to join. Tap the link in bio.<br>Ends midnight Eastern, January 1.', button: 'Join free' },
];
const N = S.length;

const rail = (s) => `<div class="rail"><div class="dy">${DAYS[s.day]}</div><div class="tm">${s.time}</div>
  <div class="wk">${DAYS.map((d, i) => `<i class="${i < s.day ? 'past' : i === s.day ? 'now' : ''}"><b>${d[0]}</b></i>`).join('')}</div></div>`;

const slide = (s, i) => {
  const id = 's' + (i + 1);
  if (s.kind === 'end') return `<div class="tf s45 fx" id="${id}"><div class="endc2"><div class="city"><img src="${data(s.city)}" alt=""></div>
    <div class="lo"><img class="lg" src="/public/logo-ve-landscape-v2-white.svg" alt=""><h5>${s.head}</h5><p>${s.line}</p>
    <span class="b">${s.button}</span></div></div>${STRIPE}</div>`;
  const dark = s.color === 'dk';
  const art = s.kind === 'day' ? `<div class="art wkart">${rail(s)}<div class="pic"><img src="${data(s.art)}" alt=""></div></div>` : `<div class="art">${s.body}</div>`;
  return `<div class="tf s45 fx" id="${id}">${art}
    <div class="band" style="--c:var(--${s.color});--t:${dark ? '#fff' : 'var(--ink)'}"><img class="bmark" src="/public/logo-ve-mark-${dark ? 'white' : 'ink'}.svg" alt="">
    <h5>${s.head}</h5>${i > 0 ? `<span class="n">${i + 1} / ${N}</span>` : ''}</div>${STRIPE}</div>`;
};

const extra = `
  body{background:#fff;padding:0;margin:0} .fx{width:1080px;border-radius:0!important;box-shadow:none!important;margin-bottom:40px}
  .endc2 p{max-width:none;font-size:3.7cqw!important;line-height:1.3}
  .wkart{display:flex;background:var(--dk)}
  .wkart .rail{width:20cqw;flex:none;background:var(--dk);color:#fff;display:flex;flex-direction:column;align-items:center;padding:5cqw 0 4cqw}
  .rail .dy{font-size:6.4cqw;font-weight:900;letter-spacing:-.02em;line-height:1}
  .rail .tm{font-size:3.4cqw;font-weight:900;letter-spacing:.02em;text-align:center;margin-top:1.6cqw;color:var(--br);line-height:1.2;padding:0 1.5cqw}
  .rail .wk{margin-top:auto;display:flex;flex-direction:column;gap:1.3cqw}
  .rail .wk i{width:6.4cqw;height:6.4cqw;border-radius:.6cqw;border:.4cqw solid rgba(255,255,255,.45);display:grid;place-items:center}
  .rail .wk i b{font-style:normal;font-size:2.4cqw;font-weight:900;color:rgba(255,255,255,.6)}
  .rail .wk i.past{background:var(--md);border-color:var(--md)} .rail .wk i.past b{color:#fff}
  .rail .wk i.now{background:var(--pink);border-color:var(--pink)} .rail .wk i.now b{color:var(--ink)}
  .wkart .pic{width:80cqw;height:100cqw;flex:none} .wkart .pic img{width:100%;height:100%;object-fit:cover;display:block}
  .ty{position:absolute;inset:0;padding:7cqw 7cqw 6cqw;display:flex;flex-direction:column;color:var(--ink)}
  .ty .tg{align-self:flex-start;background:var(--dk);color:#fff;font-size:2.6cqw;font-weight:900;letter-spacing:.16em;text-transform:uppercase;padding:1.3cqw 2cqw;border-radius:.6cqw}
  .ty .tg.pk{background:var(--pink);color:var(--ink)}
  .ty .big{font-size:11cqw;font-weight:900;line-height:1;letter-spacing:-.04em;margin-top:auto}
  .ty .big em{font-style:normal;color:var(--pinkd)}
  .ty .big.sm{font-size:8.4cqw;margin-top:4cqw}
  .ty .swipe{margin-top:auto;font-size:3.4cqw;font-weight:900;letter-spacing:.06em;text-transform:uppercase;display:flex;align-items:center;gap:2cqw}
  .ty .swipe b{display:inline-grid;place-items:center;width:8cqw;height:8cqw;background:var(--dk);color:#fff;border-radius:.6cqw;font-size:5cqw}
  .ty .wrow{display:flex;gap:1.4cqw;margin-top:5cqw} .ty .wrow i{font-style:normal;flex:1;text-align:center;font-size:2.8cqw;font-weight:900;letter-spacing:.06em;padding:1.6cqw 0;border-radius:.6cqw;border:.35cqw solid var(--ink);background:#fff}
  .ty .wrow i.now{background:var(--pink)}
  .ty .swipe{margin-top:4cqw!important}
  .ty .cities{display:flex;flex-wrap:wrap;gap:1.6cqw;margin-top:4.5cqw}
  .ty .cities span{background:var(--c);color:var(--t);font-size:3.5cqw;font-weight:900;letter-spacing:-.01em;padding:1.2cqw 2cqw;border-radius:.6cqw;border:.35cqw solid var(--ink)}
  .ty .foot{margin-top:auto;font-size:3.4cqw;font-weight:700}
  .ty.dline .cal{position:absolute;right:7cqw;top:7cqw;width:30cqw;background:#fff;color:var(--ink);border-radius:1.2cqw;overflow:hidden;text-align:center;border:.6cqw solid var(--ink);box-shadow:1.4cqw 1.4cqw 0 var(--pink)}
  .ty.dline .cal .m{background:var(--pink);font-size:5cqw;font-weight:900;letter-spacing:.14em;padding:1.4cqw 0}
  .ty.dline .cal .d{font-size:19cqw;font-weight:900;line-height:1;padding:1.4cqw 0 0}
  .ty.dline .cal .t{font-size:2.6cqw;font-weight:900;letter-spacing:.1em;padding:0 0 2.2cqw}
  .ty.dline .big.sm{margin-top:auto}
  .ty.dline p{font-size:3.6cqw;font-weight:600;line-height:1.3;margin:2.6cqw 0 0;max-width:86%;opacity:.95}
`;

const html = `<!doctype html><html><head><meta charset="utf-8"><base href="${BASE}/"><style>${css}${extra}</style></head><body>${S.map(slide).join('\n')}</body></html>`;

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
        const lh = parseFloat(getComputedStyle(h).fontSize) * 1.02, box = h.closest('.band, .lo').getBoundingClientRect(), r = h.getBoundingClientRect();
        if (h.scrollWidth > h.clientWidth + 1 || r.height > lh * 2.2 || r.bottom > box.bottom + 1 || r.right > box.right + 1) out.push(f.id + ' head: ' + h.textContent);
      });
      const fr = f.getBoundingClientRect();
      f.querySelectorAll('.ty *, .lo *').forEach((e) => { const r = e.getBoundingClientRect(); if (r.width && (r.right > fr.right + 1 || r.bottom > fr.bottom - 15)) out.push(f.id + ' overflow: ' + e.className + ' ' + e.textContent.slice(0, 30)); });
      f.querySelectorAll('.ty').forEach((t) => { if (t.scrollHeight > t.clientHeight + 1) out.push(f.id + ' type slide overflows'); });
    });
    return out;
  });
  if (bad.length) console.error('PROBLEMS:\n' + bad.join('\n'));
  for (let i = 0; i < N; i++) await (await p.$('#s' + (i + 1))).screenshot({ path: path.join(HERE, `slide-${String(i + 1).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 88 });
  await b.close();
  console.log('wrote', N, 'slides', bad.length ? 'WITH PROBLEMS' : 'clean');
})();
