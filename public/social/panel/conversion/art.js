// Conversion panel: picture-area compositor (1080 x 1080). Zoom INTO the screenshot so the part that matters reads at feed size.
// Layouts: crop (a cropped region of a phone or desktop capture as a big screen card, cut off by the band), phone (a big phone whose
// screen starts at a scroll offset, cut off by the band) and an optional square Guide scene card that never overlaps the screen.
// Usage: node art.js  (writes art/<name>.jpg)
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '../../../..'); const P = (f) => path.join(ROOT, f);
const uri = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(P(f)).toString('base64');
const C = { dk: '#2D5C27', or: '#F69820', pink: '#FF9EC4', md: '#3A9B3E', peach: '#FFEBD1' };
// crop card: shot, source rect [sx,sy,sw,sh] (source px), box x,y,w (height follows the crop's shape)
const crop = (o) => { const [sx, sy, sw, sh] = o.src, [W0] = o.size, h = Math.round(o.w * sh / sw), k = o.w / sw;
  return `<div class="cc" style="left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${h}px"><img src="${uri(o.shot)}"
    style="width:${Math.round(W0 * k)}px;left:${-Math.round(sx * k)}px;top:${-Math.round(sy * k)}px"></div>`; };
const phone = (o) => { const sw = o.w - 36, k = sw / 1170;
  return `<div class="ph" style="left:${o.x}px;top:${o.y}px;width:${o.w}px;height:1400px"><div class="scr"><img src="${uri(o.shot)}"
    style="width:${sw}px;top:${-Math.round((o.from || 0) * k)}px"></div></div>`; };
const scene = (o) => `<div class="gd" style="left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.w}px"><img src="${uri(o.card)}"></div>`;
const PH = [1170, 2532], DT = [2560, 1600];
const ART = [
  { name: 'cover', color: 'dk', parts: [
    phone({ shot: 'public/social/pinned/cap/directory.jpg', x: 450, y: 56, w: 580, from: 300 }),
    scene({ card: 'public/social/pinned/scenes/liz-share.jpg', x: 50, y: 300, w: 360 }) ] },
  { name: 'directory', color: 'dk', parts: [
    crop({ shot: 'public/social/pinned/cap/directory.jpg', size: PH, src: [0, 1090, 1170, 1440], x: 90, y: 60, w: 900 }) ] },
  { name: 'listing', color: 'dk', parts: [
    phone({ shot: 'public/social/pinned/cap/listing.jpg', x: 56, y: 56, w: 660, from: 150 }),
    scene({ card: 'public/social/pinned/scenes/maya-menu.jpg', x: 756, y: 420, w: 274 }) ] },
  { name: 'events', color: 'or', parts: [
    crop({ shot: 'public/social/panel/conversion/cap/events-2.jpg', size: PH, src: [0, 580, 1170, 1700], x: 60, y: 60, w: 620 }),
    scene({ card: 'public/social/pinned/scenes/river-festival.jpg', x: 720, y: 330, w: 310 }) ] },
  { name: 'community', color: 'md', parts: [
    crop({ shot: 'public/social/pinned/cap/d-seattle.jpg', size: DT, src: [0, 0, 1400, 1400], x: 60, y: 60, w: 960 }) ] },
];
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
 body{margin:0;background:#fff}.a{position:relative;width:1080px;height:1080px;overflow:hidden;margin-bottom:20px}
 .cc{position:absolute;overflow:hidden;border-radius:28px;border:6px solid #1a1a1a;box-shadow:14px 14px 0 #1a1a1a;background:#fff;box-sizing:content-box}
 .cc img{position:absolute;display:block}
 .ph{position:absolute;box-sizing:border-box;background:#111;border-radius:64px;padding:18px;box-shadow:16px 16px 0 #1a1a1a}
 .scr{position:relative;width:100%;height:100%;overflow:hidden;border-radius:48px;background:#fff}.scr img{position:absolute;left:0;display:block}
 .gd{position:absolute;background:#fff;padding:12px;box-shadow:12px 12px 0 #1a1a1a;border-radius:6px}.gd img{width:100%;height:100%;object-fit:cover;display:block;border-radius:4px}
</style></head><body>${ART.map((a) => `<div class="a" id="${a.name}" style="background:color-mix(in srgb, ${C[a.color]} 26%, #fff)">${a.parts.join('')}</div>`).join('')}</body></html>`;
(async () => { fs.mkdirSync(path.join(__dirname, 'art'), { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1100 } });
  await p.setContent(html, { waitUntil: 'load' });
  for (const a of ART) await (await p.$('#' + a.name)).screenshot({ path: path.join(__dirname, 'art', a.name + '.jpg'), type: 'jpeg', quality: 90 });
  await b.close(); console.log('ok'); })();
