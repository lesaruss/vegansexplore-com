// Renders every Guide wardrobe reference sheet from garments.html to out/<name>.jpg (1600 x 2000, 4:5, JPEG q86).
// Usage: node scripts/guide-wardrobe/render.js [outDir]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || path.join(__dirname, 'out');
  require('fs').mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1600, height: 2000 }, deviceScaleFactor: 1 });
  const url = 'file://' + path.join(__dirname, 'garments.html');
  await p.goto(url + '?g=white-tee');
  const names = await p.evaluate(() => window.SHEETS);
  for (const n of names) {
    await p.goto(url + '?g=' + n);
    await p.waitForTimeout(250);
    await p.screenshot({ path: path.join(out, n + '.jpg'), type: 'jpeg', quality: 86, clip: { x: 0, y: 0, width: 1600, height: 2000 } });
    console.log(n);
  }
  await b.close();
})();
