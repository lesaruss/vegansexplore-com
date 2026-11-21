// Podcast spotlight reel: a horizontal clip from one of our interviews, inside a 9:16 reel on the brand kit (Sean, 2026-11-19: "a reel
// using our branding where we can fit in those clips in the horizontal format on the page, and then have some context at the end... incorporate
// elements of their city"). Copied from city-open.js on the locked templates (/mocks/brand-kit/templates, canon canon-ve-brand-kit-templates):
// "Stories and reels" (the section color on top with its label, the mark and a two-row headline; top 250 px color only, nothing that matters
// in the bottom 340 px), the KJ reel rule (the band and logo stay still, only the picture moves), the lower third (the picture as tall as the
// words) and the close. The city art is the city's own 16:9 drawing, shown whole at the bottom, never cropped. Directory brand green.
//
// Usage (the site served at BASE, e.g. python3 -m http.server 8766 from the repo root):
//   node scripts/brand-templates/podcast-spotlight-reel.js --spec spec.json --out dir [--clip still.jpg]
//   --layers (for the real cut, scripts/brand-templates/podcast-spotlight-cut.sh): bg.png (the frame, the window empty), end.png,
//   cap-<n>.png (each caption alone on transparency, spec.captions [{text}]) and win.json (the window's inner box for the video).
// spec: {label, head:[row1,row2], name, biz, sub, logo, city_art, caption, end_head:[row1,row2], end_line, url}
//   band: the section color (default the Directory's brand green); band_ink: true on a light color (Guides pink for a doctor's tip):
//   ink words and the ink mark, the label as a white-on-ink block (the brand kit's fixed type color per color).
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
const STRIPE = '<div class="stp" style="position:absolute;left:0;right:0;top:612px;bottom:auto;height:18px"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>';
const city = data(S.city_art), logo = data(S.logo);

const BANDC = S.band ? `background:${S.band}` : '', INK = !!S.band_ink;
const TS = S.title_style === undefined ? 'a' : S.title_style;   // 'a' full-width type is LOCKED (Sean, 2026-11-19: "A"); 'b' sticker blocks, 'c' one big line, '' the first layout
const MARK = `/public/logo-ve-mark-${INK ? 'ink' : 'white'}.svg`;
const band = (rows, label) => TS
  ? `<div class="sr-rb ts-${TS}${INK ? ' sr-ink' : ''}" style="${BANDC}"><div class="sr-top"><img src="${MARK}" alt=""><span class="sr-rl">${esc(label || S.label)}</span></div>
     <h5 class="sr-ht"><span class="r1">${esc(rows[0])}</span><span class="r2">${esc(rows[1])}</span></h5></div>${STRIPE}`
  : `<div class="sr-rb${INK ? ' sr-ink' : ''}" style="${BANDC}"><span class="sr-rl">${esc(label || S.label)}</span>
  <div class="sr-rh"><img src="${MARK}" alt=""><h5>${esc(rows[0])}<br>${esc(rows[1])}</h5></div></div>${STRIPE}`;
const LAYERS = process.argv.includes('--layers');
const window_ = LAYERS ? `<div class="sr-win"></div>` : CLIP
  ? `<div class="sr-win"><img src="${data(CLIP)}" alt=""></div>`
  : `<div class="sr-win sr-ph"><div class="sr-pl"></div><b>${esc(S.name)}'s clip plays here</b><span>${esc(S.sub)}</span></div>`;
const lower = `<div class="sr-lt"><img src="${logo}" alt=""><div><b>${esc(S.name)} &middot; ${esc(S.biz)}</b><span>${esc(S.sub)}</span></div></div>`;
const cityArt = (cap) => `<div class="sr-city"><img src="${city}" alt="">${cap ? `<div class="sr-cap">${esc(cap)}</div>` : ''}</div>`;

const GUIDES = process.argv.includes('--guides') ? `<div class="sr-g4"></div><div class="sr-gt">Instagram bar</div><div class="sr-gb">Instagram caption and reply bar</div><div class="sr-gr">Buttons</div><div class="sr-gs"></div>` : '';
// end_cta rows are split on '|' (Sean, 2026-11-20: "Vegans Explore on its own row"), e.g. "Find Dr. Michael Klaper on|Vegans Explore".
const ctaPlate = () => `<div class="sr-city"><img src="${city}" alt=""><div class="sr-cap sr-cta"><span>${String(S.end_cta || '').split('|').map(esc).join('<br>')}</span><span class="sr-btn">${esc(S.url)}</span></div></div>`;
const frame = (id, inner) => `<div class="sr-rf" id="${id}">${inner}${GUIDES}</div>`;
const open = frame('open', band(S.head) + window_ + lower + cityArt(''));
const clip = frame('clip', band(S.head) + window_ + lower + cityArt(S.caption));
const endbg = frame('endbg', band(S.end_head, S.end_label) + `<div class="sr-win"></div>` + lower + ctaPlate());
// end_guide (Sean, 2026-11-20: the profile page "doesn't make me want to go see his page... maybe it's us promoting the guide"):
// the Guide's own 4:5 scene, who walks you through it and one line, the call to action on the plate. Without it, the old text end.
const G = S.end_guide;
const end = G
  ? frame('end', band(S.end_head, S.end_label) + `<div class="sr-eg"><img src="${data(G.img)}" alt=""><div class="sr-egt"><span class="sr-egtag">${esc(G.tag)}</span><p>${esc(G.line)}</p></div></div>` + ctaPlate())
  : frame('end', band(S.end_head) + `<div class="sr-endc"><p>${esc(S.end_line)}</p><span class="sr-btn">${esc(S.url)}</span>
  <img class="sr-lgo" src="/public/logo-ve-landscape-v2.svg" alt="Vegans Explore"></div>` + cityArt(''));

const html = `<!doctype html><html><head><meta charset="utf-8"><base href="${BASE}/"><style>${css}
  body{margin:0;background:#fff;font-family:Montserrat,sans-serif}
  .sr-rf{position:relative;width:1080px;height:1920px;overflow:hidden;background:#fff;margin-bottom:40px}
  .sr-rb{position:absolute;left:0;right:0;top:0;height:612px;background:var(--dk);color:#fff}
  .sr-rl{position:absolute;left:90px;top:318px;font:900 26px/1 Montserrat;letter-spacing:.16em;text-transform:uppercase;background:#fff;color:var(--dk);padding:12px 18px;border-radius:8px;white-space:nowrap}
  .sr-rh{position:absolute;left:90px;right:120px;top:388px;display:flex;gap:28px;align-items:center}
  .sr-rh img{width:110px;flex:none}
  .sr-top{position:absolute;left:90px;right:120px;top:312px;display:flex;align-items:center;gap:20px}
  .sr-top img{width:62px;flex:none}
  .ts-a .sr-top .sr-rl,.ts-b .sr-top .sr-rl,.ts-c .sr-top .sr-rl{position:static}
  .sr-ht{position:absolute;left:90px;right:120px;top:392px;margin:0;display:flex;flex-direction:column;align-items:flex-start}
  .ts-a .sr-ht{top:368px}
  .ts-a .sr-ht span{display:block;font:900 96px/0.98 Montserrat;letter-spacing:-.035em;white-space:nowrap}
  .ts-b .sr-ht{top:378px;gap:14px}
  .ts-b .sr-ht span{display:block;font:900 64px/1.0 Montserrat;letter-spacing:-.03em;white-space:nowrap;padding:10px 22px 12px;border:5px solid var(--ink);box-shadow:10px 10px 0 var(--ink);border-radius:10px}
  .ts-b .sr-ht .r1{background:#fff;color:var(--ink)} .ts-b .sr-ht .r2{background:var(--ink);color:#fff}
  .ts-c .sr-ht{top:384px;gap:10px;right:120px}
  .ts-c .sr-ht .r1{display:block;font:900 120px/0.95 Montserrat;letter-spacing:-.04em;white-space:nowrap}
  .ts-c .sr-ht .r2{display:block;font:800 52px/1.05 Montserrat;letter-spacing:-.01em;white-space:nowrap;opacity:.92}
  .sr-rb.sr-ink{color:var(--ink)} .sr-rb.sr-ink .sr-rl{background:var(--ink);color:#fff}
  .sr-rh h5{margin:0;font:900 72px/1.02 Montserrat;letter-spacing:-.03em}
  .sr-win{position:absolute;left:90px;top:662px;width:870px;height:489px;border:6px solid var(--ink);border-radius:16px;box-shadow:14px 14px 0 var(--ink);overflow:hidden;background:#111}
  .sr-win img{width:100%;height:100%;object-fit:cover}
  .sr-win.sr-ph{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#fff;background:linear-gradient(135deg,#2b2b2b,#141414)}
  .sr-win.sr-ph .sr-pl{width:0;height:0;border-left:70px solid var(--or);border-top:42px solid transparent;border-bottom:42px solid transparent;margin-bottom:10px}
  .sr-win.sr-ph b{font:900 38px/1.1 Montserrat}.sr-win.sr-ph span{font:700 24px/1.2 Montserrat;opacity:.75}
  .sr-lt{position:absolute;left:90px;right:120px;top:1186px;display:flex;gap:22px;align-items:center}
  .sr-lt img{width:96px;height:96px;border-radius:16px;object-fit:cover;border:3px solid var(--ink);background:#fff}
  .sr-lt b{display:block;font:900 38px/1.1 Montserrat;color:var(--ink)}.sr-lt span{display:block;font:700 24px/1.3 Montserrat;color:var(--mute,#5c5c5c);margin-top:6px}
  .sr-city{position:absolute;left:0;right:0;bottom:0;height:603px}
  .sr-city img{width:1080px;height:603px;display:block}
  .sr-cap{position:absolute;left:90px;right:120px;top:36px;background:#fff;color:var(--ink);font:900 40px/1.25 Montserrat;padding:22px 28px;border-radius:14px;border:4px solid var(--ink);box-shadow:8px 8px 0 var(--ink);text-align:center}
  .sr-cta{display:flex;flex-direction:column;align-items:center;gap:20px}
  .sr-cta .sr-btn{background:var(--or);color:var(--ink);font:900 38px/1 Montserrat;padding:22px 30px;border-radius:10px}
  .sr-endc{position:absolute;left:90px;right:120px;top:660px;height:620px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:34px}
  .sr-endc p{margin:0;font:900 56px/1.1 Montserrat;color:var(--ink);letter-spacing:-.02em}
  .sr-endc .sr-btn{background:var(--or);color:var(--ink);font:900 40px/1 Montserrat;padding:26px 34px;border-radius:10px;letter-spacing:.02em}
  .sr-endc .sr-lgo{width:420px;margin-top:10px}
  .sr-eg{position:absolute;left:90px;right:120px;top:668px;height:610px;display:flex;gap:40px;align-items:center}
  .sr-eg img{height:600px;width:480px;object-fit:cover;flex:none;border:6px solid var(--ink);border-radius:16px;box-shadow:14px 14px 0 var(--ink);background:#fff}
  .sr-egt{display:flex;flex-direction:column;gap:22px}
  .sr-egtag{align-self:flex-start;background:var(--ink);color:#fff;font:900 19px/1.2 Montserrat;letter-spacing:.06em;text-transform:uppercase;padding:10px 14px;border-radius:8px;white-space:nowrap}
  .sr-egt p{margin:0;font:900 44px/1.12 Montserrat;color:var(--ink);letter-spacing:-.02em}
  .sr-g4{position:absolute;left:0;right:0;top:285px;height:1350px;border-top:6px dashed #e11;border-bottom:6px dashed #e11;z-index:9}
  .sr-gs{position:absolute;left:90px;right:120px;top:300px;bottom:300px;border:4px solid #08f;z-index:9}
  .sr-gt,.sr-gb,.sr-gr{position:absolute;background:rgba(225,17,17,.28);color:#fff;font:900 26px/1 Montserrat;display:flex;align-items:center;justify-content:center;z-index:8}
  .sr-gt{left:0;right:0;top:0;height:250px}.sr-gb{left:0;right:0;bottom:0;height:340px}.sr-gr{right:0;width:120px;top:1000px;bottom:340px;writing-mode:vertical-rl}
  </style></head><body>${open}${clip}${end}${endbg}</body></html>`;

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
  // New title styles: each row fits the band's width (870 px) without wrapping, never past its base size.
  // Style A: both rows grow together until the longer one spans the band (at most 120 px). Write the two rows about the same length so both reach across (Sean, 2026-11-20: "I like it when it's all the way across").
  await p.evaluate(() => document.querySelectorAll('.ts-a .sr-ht').forEach((h) => { const W = h.clientWidth, sp = [...h.querySelectorAll('span')];
    let f = 96; const wid = () => Math.max(...sp.map((x) => x.offsetWidth));
    while (wid() < W - 6 && f < 120) { f += 2; sp.forEach((x) => x.style.fontSize = f + 'px'); }
    while (wid() > W && f > 40) { f -= 2; sp.forEach((x) => x.style.fontSize = f + 'px'); } }));
  await p.evaluate(() => document.querySelectorAll('.sr-ht').forEach((h) => { const W = h.clientWidth;
    h.querySelectorAll('span').forEach((sp) => { let f = parseFloat(getComputedStyle(sp).fontSize); while (sp.offsetWidth > W && f > 30) { f -= 2; sp.style.fontSize = f + 'px'; } }); }));
  if (LAYERS) {
    await p.locator('#open').screenshot({ path: path.join(OUT, 'bg.png') });
    await p.locator('#end').screenshot({ path: path.join(OUT, 'end.png') });
    await p.locator('#endbg').screenshot({ path: path.join(OUT, 'endbg.png') });
    const win = await p.evaluate(() => { const w = document.querySelector('#open .sr-win'), f = document.querySelector('#open').getBoundingClientRect(), r = w.getBoundingClientRect();
      return { x: Math.round(r.left - f.left + w.clientLeft), y: Math.round(r.top - f.top + w.clientTop), w: w.clientWidth, h: w.clientHeight }; });
    fs.writeFileSync(path.join(OUT, 'win.json'), JSON.stringify(win));
    const caps = S.captions || [];
    for (let i = 0; i < caps.length; i++) {
      await p.evaluate(([t]) => { document.body.style.background = 'transparent'; document.querySelectorAll('.sr-rf').forEach((f) => f.style.display = 'none');
        let f = document.getElementById('capf'); if (!f) { f = document.createElement('div'); f.id = 'capf'; f.className = 'sr-rf'; f.style.background = 'transparent';
          f.innerHTML = '<div class="sr-city"><div class="sr-cap"></div></div>'; document.body.appendChild(f); }
        f.style.display = 'block'; f.querySelector('.sr-cap').textContent = t; }, [caps[i].text]);
      await p.locator('#capf').screenshot({ path: path.join(OUT, 'cap-' + i + '.png'), omitBackground: true });
    }
  } else for (const id of ['open', 'clip', 'end']) {
    await p.locator('#' + id).screenshot({ path: path.join(OUT, id + '.jpg'), type: 'jpeg', quality: 88 });
  }
  await b.close();
  console.log('wrote', OUT);
})();
