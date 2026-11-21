// Phone screenshots of live pages for social art (the Show the site rule): 390 x 844 at 3x, the top of the page as a visitor sees it.
// Usage: node scripts/brand-templates/capture.js --out dir name=URL[|scrollY] ...  (scrollY in CSS px moves past a header to the content)
// The install prompt is dismissed first (localStorage ve_pwa_dismissed), so it never covers the page.
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const i = process.argv.indexOf('--out'), OUT = process.argv[i + 1];
const jobs = process.argv.slice(2).filter((a, k) => k !== i - 2 && k !== i - 1 && a.includes('='));
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 VEsocialcapture' });
  await ctx.addInitScript(() => { try { localStorage.setItem('ve_pwa_dismissed', String(Date.now())); } catch (e) {} });
  for (const j of jobs) {
    const [name, ...u] = j.split('='); const [url, sy] = u.join('=').split('|');
    const p = await ctx.newPage();
    try {
      await p.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
      await p.waitForTimeout(2500);
      if (sy) { await p.evaluate((y) => window.scrollTo(0, +y), sy); await p.waitForTimeout(1200); }
      await p.screenshot({ path: path.join(OUT, name + '.png') });
      console.log('ok', name);
    } catch (e) { console.log('fail', name, String(e).slice(0, 120)); }
    await p.close();
  }
  await b.close();
})();
