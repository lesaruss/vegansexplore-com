// Featured-in story frames (1080x1920), one per place a Guide features (Sean, 2026-11-10: the Featured in the Holiday Guide program's
// step 1, a story tagging each brand before the DM). Parent: the creator kit's story (scripts/creator-kit/carousel.js, locked 2026-11-10):
// a picture behind, the white postcard, the words in two rows, their Instagram handle, the white bar with the landscape logo v1 at 420 px.
// Here the postcard holds what we feature (their gift's photo, their dish, else their logo on white) and the picture behind is the
// Guide's own illustration for that feature (no faces, so the card never covers one).
// usage: node render.js rows.tsv outdir   (rows: slug, kind, name, handle, picture, logo; kind gift | menu | kosher)
const { chromium } = require('playwright'); const fs = require('fs');
const R = '/home/user/vegansexplore-com';
const [rowsFile, out] = [process.argv[2], process.argv[3]];
const b64 = (f) => fs.readFileSync(f).toString('base64');
const local = (p) => 'data:image/jpeg;base64,' + b64(R + p);
const lan = fs.readFileSync(R + '/public/logo-ve-landscape-v1.svg', 'utf8');
const KIND = {
  gift: { bg: '/public/guides/holiday/r-gingerbread.jpg', what: 'In our Christmas Gift Guide' },
  menu: { bg: '/public/guides/holiday/p-menus.jpg', what: 'In our Holiday Menus' },
  kosher: { bg: '/public/guides/holiday/r-sufganiyot.jpg', what: 'In Kosher Places for Hanukkah' },
};
const IG = '<svg viewBox="0 0 24 24" width="1em" height="1em" style="vertical-align:-0.14em;margin-right:.3em"><rect x="2" y="2" width="20" height="20" rx="6" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="4.6" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="17.6" cy="6.4" r="1.4" fill="currentColor"/></svg>';
const css = `*{box-sizing:border-box;margin:0}body{font-family:Montserrat,sans-serif}
.f{position:relative;overflow:hidden;width:1080px;height:1920px}.lg svg{width:100%;height:auto;display:block}
.pc{position:absolute;background:#fff;padding:20px;box-shadow:0 20px 44px rgba(0,0,0,.4);border-radius:4px}
.pc .im{width:100%;height:100%;background:#fff center/cover no-repeat}.pc .im.logo{background-size:72%}
.bar{position:absolute;left:0;right:0;bottom:0;height:300px;background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 48px;gap:24px}
.bar .lg{width:420px;flex:none}.bar .t{text-align:right;white-space:nowrap}.bar b{display:block;font-size:50px;font-weight:900;color:#141414;line-height:1.1}.bar span{font-size:32px;font-weight:600;color:#555}`;
const frame = (r) => {
  const k = KIND[r.kind], pic = r.picture !== '-' ? r.picture : r.logo, isLogo = r.picture === '-';
  const src = pic.startsWith('/') ? 'https://vegansexplore.com' + pic : pic;
  const name = r.name.length > 26 ? r.name.replace(/ (-|&|Vegan Mexican|Gluten-free).*$/, '') : r.name;
  return `<div class="f" style="background:url(${local(k.bg)}) center/cover">
  <div style="position:absolute;inset:0 0 300px 0;background:linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.05) 35%,rgba(0,0,0,.72))"></div>
  <div class="pc" style="left:170px;width:740px;top:200px;height:740px;transform:rotate(-2.5deg)"><div class="im${isLogo ? ' logo' : ''}" style="background-image:url('${src}')"></div></div>
  <div style="position:absolute;left:50px;right:50px;top:1030px;text-align:center;color:#fff;text-shadow:0 3px 12px rgba(0,0,0,.5)">
    <div style="font-size:46px;font-weight:800;letter-spacing:.06em">FEATURED IN THE</div>
    <div style="font-size:90px;font-weight:900;line-height:1.02;margin-top:8px">VEGANS EXPLORE<br>HOLIDAY GUIDE</div>
    <div style="font-size:${name.length > 22 ? 52 : 62}px;font-weight:900;margin-top:30px;white-space:nowrap">${name}</div>
    ${r.handle !== '-' ? '<div style="font-size:44px;font-weight:800;margin-top:6px">' + IG + '@' + r.handle + '</div>' : ''}
    <div style="font-size:38px;font-weight:700;margin-top:14px;opacity:.95">${k.what}</div></div>
  <div class="bar"><div class="lg">${lan}</div><div class="t"><b>Free Holiday Guide</b><span>Link in our bio</span></div></div></div>`;
};
(async () => {
  const rows = fs.readFileSync(rowsFile, 'utf8').trim().split('\n').map((l) => { const [slug, kind, name, handle, picture, logo] = l.split('|'); return { slug, kind, name, handle, picture, logo }; });
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const r of rows) {
    await p.setContent(`<html><head><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&display=swap" rel="stylesheet"><style>${css}</style></head><body>${frame(r)}</body></html>`, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
    await p.screenshot({ path: `${out}/${r.slug}.jpg`, type: 'jpeg', quality: 88 }); console.log('ok', r.slug);
  }
  await b.close();
})();
