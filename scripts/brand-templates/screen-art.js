// Platform art for social slides. Sean, 2026-11-15: "the real point of this is to show off the platform, not our guides, but the guides will
// anchor it"; then "let's show them in a scene... doing something other than just waving"; "some that are the full image cut off by the bottom
// part, the full phone image that's sliced off. Some of it doesn't even need to be the phone. It looks a little repetitive."
// Real screenshots of the live site on a light tint of the section color, in one of three layouts, drawn natively in each shape
// (1:1 for carousels, 4:5 for stories and reels), never cropped from another:
//   side     the phone screenshot whole in a phone frame, beside a Guide scene in the kit's white frame with an ink shadow
//   slice    a big phone from the top, sliced off by the bottom edge (the band covers it on the slide); a Guide scene optional
//   browser  a desktop screenshot whole in a browser frame, no phone, no Guide
// Nothing overlaps a screenshot; no words are added. A Guide card is a scene ("card": path), or the roster picture ("guide": slug).
// Usage: node scripts/brand-templates/screen-art.js --spec art.json --out dir
// "cardShape": "45" shows a 4:5 scene whole in a 4:5 card (never cropped to a square).
// art.json: [ { "name": "events", "layout": "side", "shot": "cap/events.jpg", "card": "scenes/river-festival.jpg", "color": "or", "shapes": ["sq"] } ]
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const SPEC = JSON.parse(fs.readFileSync(arg('spec'), 'utf8')), OUT = arg('out', '.');
const ROOT = path.join(__dirname, '../..'), DIR = path.dirname(path.resolve(arg('spec')));
const file = (f) => { for (const p of [path.resolve(DIR, f), path.join(ROOT, f)]) if (fs.existsSync(p)) return p; throw new Error('no file ' + f); };
const uri = (f) => 'data:image/' + (f.endsWith('.png') ? 'png' : 'jpeg') + ';base64,' + fs.readFileSync(file(f)).toString('base64');
const footer = fs.readFileSync(path.join(ROOT, 'public/footer.js'), 'utf8');
const guideArt = (slug) => { const m = footer.match(new RegExp(slug + ":\\s*\\{\\s*square:\\s*'([^']+)'")); if (!m) throw new Error('no art for ' + slug); return m[1].replace(/^\//, ''); };
const tpl = fs.readFileSync(path.join(ROOT, 'mocks/brand-kit/templates.html'), 'utf8');
const vars = (tpl.match(/:root\s*\{[^}]*\}/) || [''])[0];
const SH = { sq: [1080, 1080], '45': [1080, 1350] };
const phone = (shot, x, y, w) => { const h = Math.round((w - 36) * 844 / 390) + 36;
  return `<div class="ph" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><img src="${uri(shot)}" alt=""></div>`; };
const card = (s, x, y, w, h0) => { const h = s.cardShape === '45' ? Math.round(w * 1.25) : h0; y = s.cardShape === '45' && y + h > 1350 ? y : y; return `<div class="gd" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><img src="${uri(s.card || guideArt(s.guide))}" alt=""></div>`; };
const layouts = {
  side: (s, W, H) => { const ph = H - 140, pw = Math.round((ph - 36) * 390 / 844) + 36, g = W - pw - 80 - 110;
    const gh = s.cardShape === '45' ? Math.round(g * 1.25) : g; return phone(s.shot, 64, 70, pw) + card(s, 64 + pw + 46, H - 70 - gh, g, g); },
  slice: (s, W, H) => { const pw = s.card ? 560 : 640, x = s.card ? 70 : Math.round((W - pw) / 2);
    return phone(s.shot, x, 80, pw) + (s.card ? card(s, x + pw + 40, Math.round(H * 0.18), W - x - pw - 110, W - x - pw - 110) : ''); },
  browser: (s, W, H) => { const bw = W - 120, bh = Math.round(bw * 800 / 1280) + 44;
    return `<div class="br" style="left:60px;top:${Math.round((H - bh) / 2) - 10}px;width:${bw}px;height:${bh}px"><i></i><i></i><i></i><img src="${uri(s.shot)}" alt=""></div>`; },
};
const art = (s, k) => { const [W, H] = SH[k];
  return `<div class="a" id="${s.name}-${k}" style="width:${W}px;height:${H}px;--c:var(--${s.color})">${layouts[s.layout || 'side'](s, W, H)}</div>`; };
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${vars}
  body{margin:0;background:#fff} .a{position:relative;overflow:hidden;background:color-mix(in srgb, var(--c) 26%, #fff);margin-bottom:20px}
  .ph{position:absolute;box-sizing:border-box;background:#111;border-radius:64px;padding:18px;box-shadow:16px 16px 0 var(--ink)}
  .ph img{width:100%;height:100%;display:block;border-radius:48px;object-fit:fill}
  .gd{position:absolute;box-sizing:border-box;background:#fff;border:12px solid #fff;border-radius:36px;box-shadow:14px 14px 0 var(--ink);overflow:hidden}
  .gd img{width:100%;height:100%;object-fit:cover;display:block;border-radius:24px}
  .br{position:absolute;box-sizing:border-box;background:#fff;border:4px solid var(--ink);border-radius:22px;padding-top:40px;box-shadow:16px 16px 0 var(--ink);overflow:hidden}
  .br i{position:absolute;top:13px;width:14px;height:14px;border-radius:50%;background:var(--line)} .br i:nth-child(1){left:18px;background:var(--pink)} .br i:nth-child(2){left:42px;background:var(--or)} .br i:nth-child(3){left:66px;background:var(--br)}
  .br img{width:100%;height:calc(100% - 0px);display:block;object-fit:fill;border-top:3px solid var(--ink)}
  </style></head><body>${SPEC.flatMap((s) => (s.shapes || ['sq']).map((k) => art(s, k))).join('')}</body></html>`;
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1400 } });
  await p.setContent(html, { waitUntil: 'networkidle' });
  for (const s of SPEC) for (const k of s.shapes || ['sq']) await (await p.$(`#${s.name}-${k}`)).screenshot({ path: path.join(OUT, `${s.name}-${k}.jpg`), type: 'jpeg', quality: 90 });
  await b.close(); console.log('wrote', SPEC.reduce((n, s) => n + (s.shapes || ['sq']).length, 0), 'pictures to', OUT);
})();
