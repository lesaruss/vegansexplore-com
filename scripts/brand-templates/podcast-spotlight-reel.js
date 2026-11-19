// Podcast spotlight reel: a horizontal clip from one of our interviews, inside a 9:16 reel on the brand kit (Sean, 2026-11-19: "a reel
// using our branding where we can fit in those clips in the horizontal format on the page, and then have some context at the end... incorporate
// elements of their city"). Copied from city-open.js on the locked templates (/mocks/brand-kit/templates, canon canon-ve-brand-kit-templates):
// "Stories and reels" (the section color on top with its label, the mark and a two-row headline; top 250 px color only, nothing that matters
// in the bottom 340 px), the KJ reel rule (the band and logo stay still, only the picture moves), the lower third (the picture as tall as the
// words) and the close. The city art is the city's own 16:9 drawing, shown whole at the bottom, never cropped. Directory brand green.
//
// Usage (the site served at BASE, e.g. python3 -m http.server 8766 from the repo root):
//   node scripts/brand-templates/podcast-spotlight-reel.js --spec spec.json --out dir [--clip still.jpg]
// spec: {label, head:[row1,row2], name, biz, sub, logo, city_art, caption, end_head:[row1,row2], end_line, url}
// Writes <out>/open.jpg, <out>/clip.jpg and <out>/end.jpg (1080 x 1920 each). Without --clip the window shows where the clip plays (mock).
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const S = JSON.parse(fs.readFileSync(arg('spec'), 'utf8')), OUT = arg('out', '.'), CLIP = arg('clip');
const BASE = arg('base', 'http://localhost:8766');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const data = (f) => 'data:image/' + (/\.png$/i.test(f) ? 'png' : /\.webp$/i.test(f) ? 'webp' : 'jpeg') + ';base64,' + fs.readFileSync(f).toString('base64');

const tpl = fs.readFileSync(path.join(__dirname, '../../mocks/brand-kit/templates.html'), 'utf8');
const css = [...tpl.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
const STRIPE = '<div class="stp" style="position:absolute;left:0;right:0;top:560px;bottom:auto;height:18px"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>';
const city = data(S.city_art), logo = data(S.logo);

const band = (rows) => `<div class="sr-rb"><span class="sr-rl">${esc(S.label)}</span>
  <div class="sr-rh"><img src="/public/logo-ve-mark-white.svg" alt=""><h5>${esc(rows[0])}<br>${esc(rows[1])}</h5></div></div>${STRIPE}`;
const window_ = CLIP
  ? `<div class="sr-win"><img src="${data(CLIP)}" alt=""></div>`
  : `<div class="sr-win sr-ph"><div class="sr-pl"></div><b>${esc(S.name)}'s clip plays here</b><span>${esc(S.sub)}</span></div>`;
const lower = `<div class="sr-lt"><img src="${logo}" alt=""><div><b>${esc(S.name)} &middot; ${esc(S.biz)}</b><span>${esc(S.sub)}</span></div></div>`;
const cityArt = (cap) => `<div class="sr-city"><img src="${city}" alt="">${cap ? `<div class="sr-cap">${esc(cap)}</div>` : ''}</div>`;

const frame = (id, inner) => `<div class="sr-rf" id="${id}">${inner}</div>`;
const open = frame('open', band(S.head) + window_ + lower + cityArt(''));
const clip = frame('clip', band(S.head) + window_ + lower + cityArt(S.caption));
const end = frame('end', band(S.end_head) + `<div class="sr-endc"><p>${esc(S.end_line)}</p><span class="sr-btn">${esc(S.url)}</span>
  <img class="sr-lgo" src="/public/logo-ve-landscape-v2.svg" alt="Vegans Explore"></div>` + cityArt(''));

const html = `<!doctype html><html><head><meta charset="utf-8"><base href="${BASE}/"><style>${css}
  body{margin:0;background:#fff;font-family:Montserrat,sans-serif}
  .sr-rf{position:relative;width:1080px;height:1920px;overflow:hidden;background:#fff;margin-bottom:40px}
  .sr-rb{position:absolute;left:0;right:0;top:0;height:560px;background:var(--dk);color:#fff}
  .sr-rl{position:absolute;left:64px;top:262px;font:900 26px/1 Montserrat;letter-spacing:.16em;text-transform:uppercase;background:#fff;color:var(--dk);padding:12px 18px;border-radius:8px;white-space:nowrap}
  .sr-rh{position:absolute;left:64px;right:56px;top:330px;display:flex;gap:28px;align-items:center}
  .sr-rh img{width:120px;flex:none}
  .sr-rh h5{margin:0;font:900 76px/1.02 Montserrat;letter-spacing:-.03em}
  .sr-win{position:absolute;left:60px;top:626px;width:960px;height:540px;border:6px solid var(--ink);border-radius:16px;box-shadow:14px 14px 0 var(--ink);overflow:hidden;background:#111}
  .sr-win img{width:100%;height:100%;object-fit:cover}
  .sr-win.sr-ph{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#fff;background:linear-gradient(135deg,#2b2b2b,#141414)}
  .sr-win.sr-ph .sr-pl{width:0;height:0;border-left:70px solid var(--or);border-top:42px solid transparent;border-bottom:42px solid transparent;margin-bottom:10px}
  .sr-win.sr-ph b{font:900 38px/1.1 Montserrat}.sr-win.sr-ph span{font:700 24px/1.2 Montserrat;opacity:.75}
  .sr-lt{position:absolute;left:60px;right:60px;top:1196px;display:flex;gap:22px;align-items:center}
  .sr-lt img{width:96px;height:96px;border-radius:16px;object-fit:cover;border:3px solid var(--ink);background:#fff}
  .sr-lt b{display:block;font:900 38px/1.1 Montserrat;color:var(--ink)}.sr-lt span{display:block;font:700 24px/1.3 Montserrat;color:var(--mute,#5c5c5c);margin-top:6px}
  .sr-city{position:absolute;left:0;right:0;bottom:0;height:603px}
  .sr-city img{width:1080px;height:603px;display:block}
  .sr-cap{position:absolute;left:60px;right:60px;top:40px;background:#fff;color:var(--ink);font:900 40px/1.25 Montserrat;padding:22px 28px;border-radius:14px;border:4px solid var(--ink);box-shadow:8px 8px 0 var(--ink);text-align:center}
  .sr-endc{position:absolute;left:60px;right:60px;top:640px;height:640px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:34px}
  .sr-endc p{margin:0;font:900 56px/1.1 Montserrat;color:var(--ink);letter-spacing:-.02em}
  .sr-endc .sr-btn{background:var(--or);color:var(--ink);font:900 40px/1 Montserrat;padding:26px 34px;border-radius:10px;letter-spacing:.02em}
  .sr-endc .sr-lgo{width:420px;margin-top:10px}
  </style></head><body>${open}${clip}${end}</body></html>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await p.goto(BASE + '/mocks/brand-kit/templates', { waitUntil: 'domcontentloaded' });   // same origin, so the fonts and logos load
  await p.setContent(html, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  // Headlines are always two rows (Sean, 2026-11-10): shrink to 70 percent at most until each row fits on one line.
  await p.evaluate(() => document.querySelectorAll('.sr-rh h5').forEach((h) => { const f0 = parseFloat(getComputedStyle(h).fontSize); let k = 1;
    const lines = () => { const c = h.cloneNode(); c.textContent = 'X'; h.parentNode.appendChild(c); const one = c.offsetHeight; c.remove(); return Math.round(h.offsetHeight / one); };
    while (lines() > 2 && k > 0.7) { k -= 0.04; h.style.fontSize = (f0 * k) + 'px'; } }));
  for (const id of ['open', 'clip', 'end']) {
    await p.locator('#' + id).screenshot({ path: path.join(OUT, id + '.jpg'), type: 'jpeg', quality: 88 });
  }
  await b.close();
  console.log('wrote', OUT);
})();
