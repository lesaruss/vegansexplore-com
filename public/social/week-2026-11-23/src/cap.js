// Element captures of the live Holiday Guide at phone size (390 wide, 3x), copied from scripts/brand-templates/capture.js.
// Usage: node cap.js outdir name=URL^selector^index^maxHeight ...
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const OUT = process.argv[2], jobs = process.argv.slice(3);
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 VEsocialcapture' });
  await ctx.addInitScript(() => { try { localStorage.setItem('ve_pwa_dismissed', String(Date.now())); } catch (e) {} });
  for (const j of jobs) {
    const [name, ...u] = j.split('='); const [url, sel, idx, maxh] = u.join('=').split('^');
    const p = await ctx.newPage();
    await p.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
    await p.waitForTimeout(3000);
    const el = (await p.$$(sel))[+idx || 0];
    if (!el) { console.log('fail', name); await p.close(); continue; }
    // The fixed bottom bar would sit over the element in a full-page clip: hide fixed and sticky bars first.
    await p.evaluate(() => { document.querySelectorAll('body *').forEach((e) => { const s = getComputedStyle(e).position; if (s === 'fixed' || s === 'sticky') e.style.visibility = 'hidden'; }); });
    const bb = await el.boundingBox();
    const sy = await p.evaluate(() => window.scrollY);
    const h = Math.min(bb.height, +maxh || bb.height);
    await p.screenshot({ path: path.join(OUT, name + '.png'), clip: { x: Math.max(0, bb.x - 8), y: bb.y + sy - 8, width: Math.min(390 - Math.max(0, bb.x - 8), bb.width + 16), height: h + 16 }, fullPage: true });
    console.log('ok', name, Math.round(bb.width), Math.round(h)); await p.close();
  }
  await b.close();
})();
