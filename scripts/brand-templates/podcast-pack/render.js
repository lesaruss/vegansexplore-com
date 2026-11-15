// Renders every asset in a spec at its true size: node render.js <spec> <outdir> [baseUrl]
// The repo root must be served (python3 -m http.server 8765 from the repo root). Locked frames: /mocks/podcast-pack.
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [spec, out, base = 'http://localhost:8765'] = process.argv.slice(2);
  const S = JSON.parse(fs.readFileSync(`${__dirname}/specs/${spec}.json`, 'utf8'));
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 3100, height: 3100 }, deviceScaleFactor: 1 });
  for (const a of S.assets) {
    await p.goto(`${base}/scripts/brand-templates/podcast-pack/render.html?spec=${spec}&asset=${a.id}`, { waitUntil: 'networkidle' });
    await p.waitForSelector('body[data-ready="1"]', { timeout: 30000 });
    const el = await p.$('#a .tf');
    await el.screenshot({ path: `${out}/${a.id}.png` });
    process.stdout.write(a.id + ' ');
  }
  await b.close();
  console.log('\ndone', S.assets.length);
})();
