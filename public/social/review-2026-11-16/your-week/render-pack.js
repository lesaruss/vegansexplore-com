// Drives the locked pack renderer (scripts/brand-templates/podcast-pack/render.html) with a spec kept in this folder.
// node render-pack.js <spec-name> <outdir>   (repo root served at localhost:8765)
const { chromium } = require('playwright'); const fs = require('fs');
const [spec, out] = process.argv.slice(2);
const S = JSON.parse(fs.readFileSync(`${__dirname}/specs/${spec}.json`, 'utf8'));
const rel = `../../../../public/social/review-2026-11-16/your-week/specs/${spec}`;
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 3100, height: 3100 } });
  for (const a of S.assets) {
    await p.goto(`http://localhost:8765/scripts/brand-templates/podcast-pack/render.html?spec=${encodeURIComponent(rel)}&asset=${a.id}`, { waitUntil: 'networkidle' });
    await p.waitForSelector('body[data-ready="1"]', { timeout: 30000 });
    await (await p.$('#a .tf')).screenshot({ path: `${out}/${a.id}.jpg`, type: 'jpeg', quality: 90 });
    process.stdout.write(a.id + ' ');
  }
  await b.close(); console.log('done');
})();
