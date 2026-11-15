// The episode rundown card for a story's 4:5 picture area (Sean, 2026-11-15, on the SoFlo 112 story: "Is it just a thing that says new episode?
// And then no details in it, nothing. I don't like that at all."). A white card on the show's brand green: "On this episode", one row per segment
// (the business's real logo or the person's own photo on a white square, or a small tile), with the lower part left clear for the story's link sticker (the bottom of a story sits under the reply bar). Words sit on
// color, never on a picture. The story itself stays the locked pack story (render.js kind story, art type img = this card).
// Usage: node scripts/brand-templates/podcast-pack/episode-card.js <card.json> <out.jpg>   (site served at localhost:8765)
// card.json: { "eyebrow": "On this episode", "rows": [ { "pic": "url or /path", "fit": "contain|cover", "tile": "Dec 11", "text": "..." } ], "foot": "..." }
const fs = require('fs'); const { chromium } = require('playwright');
const [specPath, out, base = 'http://localhost:8765'] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const row = (r) => `<div class="r"><div class="p">${r.tile ? `<b>${esc(r.tile)}</b>` : `<img src="${esc(r.pic)}" style="object-fit:${r.fit || 'contain'}">`}</div><div class="t">${esc(r.text)}</div></div>`;
const BG = C.bg || '#2D5C27';
const html = `<!doctype html><html><head><meta charset="utf-8"><base href="${base}/">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;800;900&display=swap" rel="stylesheet"><style>
*{box-sizing:border-box;margin:0} body{width:1080px;height:1350px;background:${BG};font-family:Montserrat,sans-serif;padding:70px 64px}
.c{background:#fff;border:7px solid #1a1a1a;border-radius:36px;box-shadow:16px 16px 0 #F69820;height:100%;padding:56px 54px;display:flex;flex-direction:column}
.e{align-self:flex-start;background:#1a1a1a;color:#fff;font-weight:900;font-size:30px;letter-spacing:.16em;text-transform:uppercase;padding:12px 20px;border-radius:12px}
.rs{display:flex;flex-direction:column;gap:30px;margin-top:44px;flex:1}
.r{display:flex;align-items:center;gap:30px}
.p{width:150px;height:150px;flex:none;border:5px solid #1a1a1a;border-radius:24px;overflow:hidden;background:#fff;display:grid;place-items:center}
.p img{width:100%;height:100%;padding:8px} .p img[style*=cover]{padding:0}
.p b{font-weight:900;font-size:40px;line-height:1;text-align:center;color:#1a1a1a;background:#E8F5E9;width:100%;height:100%;display:grid;place-items:center;padding:10px}
.t{font-weight:800;font-size:40px;line-height:1.15;color:#1a1a1a}
.f{margin-top:auto;align-self:flex-start;background:#F69820;color:#1a1a1a;border:5px solid #1a1a1a;border-radius:14px;font-weight:900;font-size:34px;letter-spacing:.1em;text-transform:uppercase;padding:16px 24px}
</style></head><body><div class="c"><span class="e">${esc(C.eyebrow || 'On this episode')}</span><div class="rs">${C.rows.map(row).join('')}</div>${C.foot ? `<span class="f">${esc(C.foot)}</span>` : ''}</div></body></html>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await p.goto(base + '/index.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
  await p.setContent(html, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
  const over = await p.evaluate(() => { const rs = document.querySelector('.rs'); return rs.scrollHeight > rs.clientHeight + 1; });
  if (over) { console.error('rows run over the card, not written'); await b.close(); process.exit(2); }
  await p.screenshot({ path: out, type: 'jpeg', quality: 90 }); await b.close(); console.log('wrote', out);
})();
