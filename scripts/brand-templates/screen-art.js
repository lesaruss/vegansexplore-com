// Platform art for social slides (Sean, 2026-11-15: "the real point of this is to show off the platform, not our guides, but the guides will
// anchor it"). A real phone screenshot of the live site, whole, in a phone frame, beside the section's Guide (the square mid shot from
// VE_GUIDE_ART) in the brand kit's white frame with an ink shadow, on a light tint of the section color. Drawn natively in each shape
// (1:1 for carousels, 4:5 for stories and reels), never cropped from another. Nothing overlaps the screenshot; no words are added.
//
// Usage: node scripts/brand-templates/screen-art.js --spec art.json --out dir
// art.json: [ { "name": "directory", "shot": "cap/directory.png", "guide": "pascal", "color": "dk", "shapes": ["sq", "45"] } ]
// Writes <out>/<name>-sq.jpg (1080 x 1080) and/or <out>/<name>-45.jpg (1080 x 1350).
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const SPEC = JSON.parse(fs.readFileSync(arg('spec'), 'utf8')), OUT = arg('out', '.'), BASE = arg('base', 'http://localhost:8766');
const ROOT = path.join(__dirname, '../..'), DIR = path.dirname(path.resolve(arg('spec')));
const file = (f) => { for (const p of [path.resolve(DIR, f), path.join(ROOT, f)]) if (fs.existsSync(p)) return p; throw new Error('no file ' + f); };
const uri = (f) => 'data:image/' + (f.endsWith('.png') ? 'png' : 'jpeg') + ';base64,' + fs.readFileSync(file(f)).toString('base64');
const footer = fs.readFileSync(path.join(ROOT, 'public/footer.js'), 'utf8');
const guideArt = (slug) => { const m = footer.match(new RegExp(slug + ":\\s*\\{\\s*square:\\s*'([^']+)'")); if (!m) throw new Error('no art for ' + slug); return m[1].replace(/^\//, ''); };
const tpl = fs.readFileSync(path.join(ROOT, 'mocks/brand-kit/templates.html'), 'utf8');
const vars = (tpl.match(/:root\s*\{[^}]*\}/) || [''])[0];
// Layout per shape (px): phone height, phone left, Guide card size and its top-left.
const L = { sq: { w: 1080, h: 1080, ph: 940, px: 110, g: 380, gx: 610, gy: 560 }, '45': { w: 1080, h: 1350, ph: 1190, px: 56, g: 370, gx: 668, gy: 840 } };
const art = (s, k) => { const l = L[k], pw = Math.round((l.ph - 36) * 390 / 844) + 36;
  return `<div class="a" id="${s.name}-${k}" style="width:${l.w}px;height:${l.h}px;--c:var(--${s.color})">
    <div class="ph" style="left:${l.px}px;top:${(l.h - l.ph) / 2}px;width:${pw}px;height:${l.ph}px"><img src="${uri(s.shot)}" alt=""></div>
    <div class="gd" style="left:${l.gx}px;top:${l.gy}px;width:${l.g}px;height:${l.g}px"><img src="${uri(guideArt(s.guide))}" alt=""></div></div>`; };
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${vars}
  body{margin:0;background:#fff} .a{position:relative;overflow:hidden;background:color-mix(in srgb, var(--c) 26%, #fff);margin-bottom:20px}
  .ph{position:absolute;box-sizing:border-box;background:#111;border-radius:64px;padding:18px;box-shadow:16px 16px 0 var(--ink, #1a1a1a)}
  .ph img{width:100%;height:100%;display:block;border-radius:48px;object-fit:fill}
  .gd{position:absolute;box-sizing:border-box;background:#fff;border:12px solid #fff;border-radius:36px;box-shadow:14px 14px 0 var(--ink, #1a1a1a);overflow:hidden}
  .gd img{width:100%;height:100%;object-fit:cover;display:block;border-radius:24px}
  </style></head><body>${SPEC.flatMap((s) => (s.shapes || ['sq']).map((k) => art(s, k))).join('')}</body></html>`;
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1400 } });
  await p.setContent(html, { waitUntil: 'networkidle' });
  for (const s of SPEC) for (const k of s.shapes || ['sq']) await (await p.$(`#${s.name}-${k}`)).screenshot({ path: path.join(OUT, `${s.name}-${k}.jpg`), type: 'jpeg', quality: 90 });
  await b.close(); console.log('wrote', SPEC.reduce((n, s) => n + (s.shapes || ['sq']).length, 0), 'pictures to', OUT);
})();
