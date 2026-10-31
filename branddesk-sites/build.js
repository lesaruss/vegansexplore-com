// The BrandDesk hosting project's build (Vercel project branddesk-sites, root directory branddesk-sites/, canon canon-ve-front-of-house).
// It copies the frame (../business/site.html, the one every client site wears) into the function and writes Vercel's Build Output
// (.vercel/output): every request goes to one function, server.js, which serves the client the domain belongs to. Every push that changes
// the frame or this folder rebuilds it, so every client site gets the improved frame at once ("the template improves for every client").
const fs = require('fs');
const path = require('path');
const out = path.join(__dirname, '.vercel', 'output');
const frame = fs.readFileSync(path.join(__dirname, '..', 'business', 'site.html'), 'utf8');
for (const marker of ['<script src="/business/sample/cartridge.js"></script>', '<div id="site"></div>', '<meta name="robots" content="noindex">', 'window.VE_SITE']) {
  if (!frame.includes(marker)) throw new Error('The frame no longer has ' + marker + '; update server.js with it.');
}
fs.rmSync(out, { recursive: true, force: true });
const fn = path.join(out, 'functions', 'site.func');
fs.mkdirSync(fn, { recursive: true });
fs.mkdirSync(path.join(out, 'static'), { recursive: true });
fs.copyFileSync(path.join(__dirname, 'server.js'), path.join(fn, 'index.js'));
fs.writeFileSync(path.join(fn, 'frame.js'), 'module.exports = ' + JSON.stringify(frame) + ';\n');
fs.writeFileSync(path.join(fn, '.vc-config.json'), JSON.stringify({ runtime: 'nodejs20.x', handler: 'index.js', launcherType: 'Nodejs', shouldAddHelpers: false, maxDuration: 15 }));
fs.writeFileSync(path.join(out, 'config.json'), JSON.stringify({ version: 3, routes: [{ src: '/(.*)', dest: '/site' }] }, null, 2));
console.log('branddesk-sites: frame ' + frame.length + ' bytes, output written');
