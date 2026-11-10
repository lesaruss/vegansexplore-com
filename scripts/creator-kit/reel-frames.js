// Reel stills, 1080x1920, in the carousel's look: picture full bleed, headline low over a shade, the white bar with the logo and the creator.
const { chromium } = require('playwright'); const fs = require('fs');
const R = '/home/user/vegansexplore-com', FR = '/tmp/claude-0/-home-user/d2fb880b-f90e-58ab-8cdb-46b4bcdc6101/scratchpad/frames';
const b64 = f => fs.readFileSync(f).toString('base64');
const img = f => 'data:image/' + (f.endsWith('.png') ? 'png' : 'jpeg') + ';base64,' + b64(f);
const lan = fs.readFileSync(R + '/public/logo-ve-landscape-v1.svg', 'utf8');
const font = b64('/tmp/claude-0/-home-user-vegansexplore-com/d2fb880b-f90e-58ab-8cdb-46b4bcdc6101/scratchpad/fonts/Montserrat.ttf');
const IG = '<svg viewBox="0 0 24 24" width="1em" height="1em" style="vertical-align:-0.14em;margin-right:.3em"><rect x="2" y="2" width="20" height="20" rx="6" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="4.6" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="17.6" cy="6.4" r="1.4" fill="currentColor"/></svg>';
const css = `@font-face{font-family:M;src:url(data:font/ttf;base64,${font})}*{box-sizing:border-box;margin:0}body{font-family:M,sans-serif}
.f{position:relative;overflow:hidden;width:1080px;height:1920px}.lg svg{width:100%;height:auto;display:block}
.bar{position:absolute;left:0;right:0;bottom:0;height:220px;background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 48px;gap:24px}
.bar .lg{width:320px;flex:none}.bar .t{text-align:right}.bar b{display:block;font-size:44px;font-weight:900;color:#141414}.bar span{font-size:30px;font-weight:600;color:#555}
.tx{text-shadow:0 3px 16px rgba(0,0,0,.6)}`;
const SC = FR + '/scenes/', W = R + '/public/guides/welcome/';
const shot = (pic, title, pos) => `<div class="f"><div style="position:absolute;inset:0 0 220px 0;background:url(${img(pic)}) ${pos || 'center'}/cover"></div>
  <div style="position:absolute;left:0;right:0;bottom:220px;height:700px;background:linear-gradient(0deg,rgba(0,0,0,.82),rgba(0,0,0,.45) 55%,transparent)"></div>
  <div class="tx" style="position:absolute;left:64px;right:64px;bottom:280px;color:#fff;font-size:92px;font-weight:900;line-height:1.04">${title}</div>
  <div class="bar"><div class="lg">${lan}</div><div class="t"><b>${IG}KJ (@keyz60)</b><span>Philadelphia</span></div></div></div>`;
const raw = (pic) => `<div class="f"><div style="position:absolute;inset:0;background:url(${img(pic)}) center/cover"></div></div>`;
const shots = [
  ['a-kai', shot(SC + 'b23-kai-studio.jpg', 'Hey, it\'s Kai from Vegans Explore')],
  ['b-philly', shot(R + '/communities/philadelphia/banner.jpg', 'Big news for Philadelphia')],
  ['c-cover', raw(FR + '/c-story.png')],
  ['d-kj', shot(FR + '/story-bg.jpg', 'Our newest official content creator', 'center top')],
  ['e-market', shot(SC + 'b10-market-walk.jpg', 'Where Vegan Philadelphia comes together')],
  ['f-river', shot(SC + 'b07-river-market.jpg', 'Every Vegan place, person and group')],
  ['g-potluck', shot(SC + 'b06-potluck.jpg', 'Events near you')],
  ['h-shows', shot(W + 'liz-media.jpg', 'Our shows')],
  ['i-cast', shot(SC + 'b02-cast.jpg', 'Guides that walk you through it')],
  ['j-points', shot(W + 'liz-points.jpg', 'Earn points for taking part')],
  ['k-founding', shot(SC + 'b44-celebrate.jpg', 'Become a Founding Member by January 1')],
];
(async () => {
  const b = await chromium.launch();
  for (const [k, h] of shots) { const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); await p.setContent(`<style>${css}</style>${h}`); await p.waitForTimeout(250); await p.screenshot({ path: `${k}.png` }); await p.close(); }
  await b.close();
})();
