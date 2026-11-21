// scarcity-identity carousel renderer. Reads the locked template CSS from mocks/brand-kit/templates.html (like
// scripts/brand-templates/carousel.js) and adds one thing on top: a "clock rail" on the right of the picture area of
// every slide but the end card, so the January 1 deadline is visible from the first slide to the last. The picture
// beside it is drawn 4:5 (864 x 1080) and shown whole; words sit on color only.
// Usage: node render.js  (site served at http://localhost:8766 from the repo root)
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '../../../..'), OUT = __dirname, BASE = 'http://localhost:8766';
const data = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(ROOT, f)).toString('base64');
const tpl = fs.readFileSync(path.join(ROOT, 'mocks/brand-kit/templates.html'), 'utf8');
const css = [...tpl.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
const STRIPE = '<div class="stp"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>';

const SLIDES = [
  { panel: 'card', color: 'pink', head: 'This title ends<br>January 1.' },
  { art: 'public/social/founding/scenes/a-maya-badge.jpg', pos: 'center 30%', color: 'dk', head: 'Yours for good,<br>if you\'re early.' },
  { art: 'public/social/founding/scenes/a-pascal-find.jpg', color: 'br', head: 'Find Vegan food<br>near you.' },
  { art: 'public/social/founding/scenes/a-dani-checkin.jpg', color: 'tint', head: 'Earn points<br>just by going.' },
  { panel: 'cities', color: 'md', head: 'Your city is<br>already here.' },
  { art: 'public/social/founding/scenes/a-nori-festival.jpg', color: 'dk', head: 'Vegan events,<br>near you.' },
  { art: 'public/social/founding/scenes/a-kai-guide.jpg', color: 'pink', head: 'A free Guide<br>for every step.' },
  { art: 'public/social/founding/scenes/a-river-bus.jpg', color: 'peach', head: 'Free shows,<br>every week.' },
  { panel: 'loss', color: 'dk', head: 'After January 1,<br>it\'s gone.' },
  { end: true, city: 'communities/south-florida/wide.jpg', head: 'Become a<br><span>Founding Member</span>',
    line: 'Free, with a short survey. Ends midnight Eastern, January 1, 2027. Tap the link in bio.', button: 'Join free' },
];
const N = SLIDES.length, CL = N - 1;   // slides that carry the clock

const CITIES = ['South Florida', 'Central Florida', 'North Florida', 'Atlanta', 'Washington, D.C.', 'Maryland', 'Virginia',
  'West Virginia', 'Delaware', 'New York', 'Philadelphia', 'Boston', 'Los Angeles', 'San Francisco', 'Seattle', 'Portland',
  'Austin', 'Denver', 'London'];

const panel = (s) => {
  if (s.art) return `<div class="pic"><img src="${data(s.art)}" style="object-position:${s.pos || 'center top'}" alt=""></div>`;
  if (s.panel === 'card') return `<div class="tp tp-card"><p class="kick">A title you can<br>only claim now</p>
    <div class="fcard"><div class="fc-top"><img src="/public/logo-ve-mark-white.svg" alt=""><span>Vegans Explore</span></div>
    <div class="fc-t">Founding<br>Member</div><div class="fc-b"><span>Since 2026</span><span>Yours for good</span></div>
    <div class="stamp">Closes Jan 1</div></div><p class="free">Free to join</p></div>`;
  if (s.panel === 'cities') return `<div class="tp tp-cities"><p class="eb">Vegans Explore is in</p><p class="cl">${CITIES.map((c, k) => `<b>${c}${k < CITIES.length - 1 ? '<i></i>' : ''}</b>`).join(' ')}</p></div>`;
  if (s.panel === 'loss') return `<div class="tp tp-loss">
    <div class="lc now"><span class="w">Join now</span><span class="t">Founding<br>Member</span><span class="s">On your profile for good</span></div>
    <div class="lc late"><span class="w">Join after Jan 1</span><span class="t">Member</span><span class="s"><s>Founding Member</s> gone</span></div></div>`;
};

const rail = (i) => {
  const left = CL - i;   // the window empties as you swipe
  const bars = Array.from({ length: CL }, (_, k) => `<i class="${k < left ? 'on' : ''}"></i>`).join('');
  return `<div class="rail"><span class="rl">Ends</span><div class="cal"><span class="m">Jan</span><span class="d">1</span></div>
    <span class="rt">Midnight<br>Eastern</span><div class="bars">${bars}</div><span class="cnt">${i + 1}/${N}</span></div>`;
};

const slide = (s, i) => {
  const id = 's' + (i + 1);
  if (s.end) return `<div class="tf s45 fx" id="${id}"><div class="endc2"><div class="city"><img src="${data(s.city)}" alt=""></div>
    <div class="lo"><img class="lg" src="/public/logo-ve-landscape-v2-white.svg" alt=""><h5>${s.head}</h5><p>${s.line}</p>
    <span class="b">${s.button}</span></div></div>${STRIPE}</div>`;
  const dark = s.color === 'dk';
  return `<div class="tf s45 fx" id="${id}"><div class="art pa">${panel(s)}${rail(i)}</div>
    <div class="band" style="--c:var(--${s.color});--t:${dark ? '#fff' : 'var(--ink)'}"><img class="bmark" src="/public/logo-ve-mark-${dark ? 'white' : 'ink'}.svg" alt="">
    <h5>${s.head}</h5></div>${STRIPE}</div>`;
};

const extra = `
  body{background:#fff;padding:0;margin:0} .fx{width:1080px;border-radius:0!important;box-shadow:none!important;margin-bottom:40px}
  .endc2 p{max-width:none}
  .pa{display:grid;grid-template-columns:864px 216px}
  .pa .pic{width:864px;height:1080px;overflow:hidden} .pa .pic img{width:100%;height:100%;object-fit:cover}
  .rail{background:var(--dk);color:#fff;display:flex;flex-direction:column;align-items:center;padding:44px 18px 40px;border-left:10px solid #fff}
  .rail .rl{font-size:34px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:var(--pink)}
  .rail .cal{margin-top:14px;width:156px;background:#fff;border-radius:6px;overflow:hidden;text-align:center;color:var(--ink)}
  .rail .cal .m{display:block;background:var(--pink);font-size:40px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;padding:6px 0}
  .rail .cal .d{display:block;font-size:118px;font-weight:900;line-height:1.05;letter-spacing:-.04em}
  .rail .rt{margin-top:16px;font-size:30px;font-weight:900;line-height:1.1;text-align:center;letter-spacing:-.01em}
  .rail .bars{margin-top:28px;flex:1;width:84px;display:flex;flex-direction:column;gap:9px}
  .rail .bars i{flex:1;border-radius:4px;background:rgba(255,255,255,.16)} .rail .bars i.on{background:var(--br)}
  .rail .cnt{margin-top:22px;font-size:34px;font-weight:900;letter-spacing:.06em}
  .tp{width:864px;height:1080px;position:relative;display:flex;flex-direction:column;justify-content:center;padding:60px 64px}
  .tp-card{background:var(--peach);align-items:center;text-align:center}
  .tp-card .kick{font-size:52px;font-weight:900;line-height:1.08;letter-spacing:-.02em;color:var(--ink)}
  .fcard{position:relative;margin:110px 0 60px;width:660px;background:var(--dk);color:#fff;border-radius:22px;padding:40px 46px 36px;text-align:left;transform:rotate(-3deg);box-shadow:16px 16px 0 var(--ink)}
  .fc-top{display:flex;align-items:center;gap:16px;font-size:30px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
  .pa .fc-top img{width:auto;height:64px}
  .fc-t{font-size:112px;font-weight:900;line-height:.95;letter-spacing:-.04em;margin:30px 0 30px;color:#fff}
  .fc-b{display:flex;justify-content:space-between;border-top:4px solid var(--br);padding-top:20px;font-size:30px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:var(--br)}
  .stamp{position:absolute;right:-40px;top:-46px;background:var(--pink);color:var(--ink);border:6px solid var(--ink);border-radius:6px;font-size:38px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;padding:12px 20px;transform:rotate(9deg);box-shadow:8px 8px 0 var(--ink)}
  .tp-card .free{font-size:50px;font-weight:900;color:var(--dk);letter-spacing:-.01em}
  .tp-cities{background:var(--tint)}
  .tp-cities .eb{align-self:flex-start;background:var(--dk);color:#fff;font-size:30px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;padding:12px 18px;border-radius:6px;margin-bottom:34px}
  .tp-cities .cl{font-size:54px;font-weight:900;line-height:1.28;letter-spacing:-.02em;color:var(--dk)}
  .tp-cities .cl b{white-space:nowrap} .tp-cities .cl i{display:inline-block;width:16px;height:16px;border-radius:50%;background:var(--pinkd);margin:0 4px 0 18px;vertical-align:middle}
  .tp-loss{background:#fff;gap:56px;padding:60px 56px}
  .lc{border-radius:22px;padding:40px 48px;display:flex;flex-direction:column}
  .lc .w{font-size:36px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
  .lc .t{font-size:108px;font-weight:900;line-height:.98;letter-spacing:-.04em;margin:18px 0 20px}
  .lc .s{font-size:40px;font-weight:800}
  .lc.now{background:var(--dk);color:#fff;box-shadow:16px 16px 0 var(--pink)} .lc.now .w{color:var(--pink)} .lc.now .s{color:var(--br);font-weight:900}
  .lc.late{background:#f1f1f1;color:#6b6b6b;border:5px dashed #b9b9b9} .lc.late .t{color:#8a8a8a}
`;

const html = `<!doctype html><html><head><meta charset="utf-8"><base href="${BASE}/"><style>${css}${extra}</style></head><body>${SLIDES.map(slide).join('\n')}</body></html>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1400 }, deviceScaleFactor: 1 });
  await p.goto(BASE + '/mocks/brand-kit/templates.html', { waitUntil: 'domcontentloaded' });
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
      f.querySelectorAll('.tp, .rail').forEach((el) => { if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) out.push(f.id + ' panel overflow ' + el.className); });
    });
    return out;
  });
  if (bad.length) console.error('OVERFLOW:', bad.join(' | '));
  for (let i = 0; i < N; i++) await (await p.$('#s' + (i + 1))).screenshot({ path: path.join(OUT, `slide-${String(i + 1).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 88 });
  await b.close();
  console.log('wrote', N, bad.length ? 'WITH OVERFLOW' : 'clean');
})();
