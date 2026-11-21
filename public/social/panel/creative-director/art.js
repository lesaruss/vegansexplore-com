// Creative director picture-area compositor (1080 x 1080). One screen, big and cropped in, bleeding off an edge; one Guide scene card
// overlapping a quiet corner of it. Kit craft: tint of the section color, 6px-family radii, ink offset shadow. No words added.
// screen: { shot, kind: phone|browser, crop:[x,y,w] in capture px (height runs to the capture bottom), x, y, w (display px) }
// card:   { src, x, y, s }  (a square scene shown whole, never cropped)
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '../../../..');
const SPEC = JSON.parse(fs.readFileSync(path.join(__dirname, 'art.json'), 'utf8'));
const uri = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(ROOT, f)).toString('base64');
const vars = (fs.readFileSync(path.join(ROOT, 'mocks/brand-kit/templates.html'), 'utf8').match(/:root\s*\{[^}]*\}/) || [''])[0];
const { execSync } = require('child_process');
const size = (f) => execSync(`python3 -c "from PIL import Image;print(*Image.open('${path.join(ROOT, f)}').size)"`).toString().trim().split(' ').map(Number);
const screen = (s) => { const [cw, ch] = size(s.shot); const [cx, cy, w] = s.crop; const k = s.w / w;
  const bar = s.kind === 'browser' ? 46 : 0, pad = s.kind === 'phone' ? 16 : 0;
  const vh = Math.round((ch - cy) * k);
  return `<div class="sc ${s.kind}" style="left:${s.x}px;top:${s.y}px;width:${s.w + 2 * pad}px;height:${vh + bar + 2 * pad}px">
    ${s.kind === 'browser' ? '<b><i></i><i></i><i></i></b>' : ''}<div class="vw" style="height:${vh}px">
    <img src="${uri(s.shot)}" style="width:${Math.round(cw * k)}px;left:${-Math.round(cx * k)}px;top:${-Math.round(cy * k)}px"></div></div>`; };
const card = (c) => `<div class="gd" style="left:${c.x}px;top:${c.y}px;width:${c.s}px;height:${c.s}px"><img src="${uri(c.src)}"></div>`;
const html = `<!doctype html><html><head><style>${vars}
 body{margin:0} .a{position:relative;width:1080px;height:1080px;overflow:hidden;background:color-mix(in srgb,var(--c) 24%,#fff);margin-bottom:10px}
 .sc{position:absolute;box-sizing:border-box;box-shadow:16px 16px 0 var(--ink)}
 .sc.phone{background:#111;border-radius:56px;padding:16px} .sc.phone .vw{border-radius:42px}
 .sc.browser{background:#fff;border:4px solid var(--ink);border-radius:22px;padding-top:46px}
 .sc.browser b{position:absolute;top:0;left:0;right:0;height:42px;border-bottom:4px solid var(--ink)}
 .sc.browser b i{position:absolute;top:13px;width:16px;height:16px;border-radius:50%} .sc.browser b i:nth-child(1){left:20px;background:var(--pink)}
 .sc.browser b i:nth-child(2){left:46px;background:var(--or)} .sc.browser b i:nth-child(3){left:72px;background:var(--br)}
 .vw{position:relative;overflow:hidden} .vw img{position:absolute;display:block}
 .gd{position:absolute;box-sizing:border-box;background:#fff;border:12px solid #fff;border-radius:34px;box-shadow:14px 14px 0 var(--ink);overflow:hidden}
 .gd img{width:100%;height:100%;display:block;border-radius:22px}
 </style></head><body>${SPEC.map((a) => `<div class="a" id="${a.name}" style="--c:var(--${a.color})">${screen(a.screen)}${a.card ? card(a.card) : ''}</div>`).join('')}</body></html>`;
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1100 } });
  await p.setContent(html, { waitUntil: 'networkidle' }); fs.mkdirSync(path.join(__dirname, 'art'), { recursive: true });
  for (const a of SPEC) await (await p.$('#' + a.name)).screenshot({ path: path.join(__dirname, 'art', a.name + '.jpg'), type: 'jpeg', quality: 90 });
  await b.close(); console.log('ok', SPEC.length); })();
