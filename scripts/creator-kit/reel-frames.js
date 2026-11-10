// Reel in two layers (Sean, 2026-11-10: "the bottom bar should stay fixed... the text should stay fixed as well. So it's just the background that's moving").
// For each shot: bg-<k>.png, the picture alone (1080x1650, the area above the bar), and ov-<k>.png, the shade, words and bar on a clear background.
const { chromium } = require('playwright'); const fs = require('fs');
const S = '/tmp/claude-0/-home-user/d2fb880b-f90e-58ab-8cdb-46b4bcdc6101/scratchpad';
const R = '/home/user/vegansexplore-com', FR = S + '/frames', SC = FR + '/scenes/', W = R + '/public/guides/welcome/';
const b64 = f => fs.readFileSync(f).toString('base64');
const img = f => 'data:image/' + (f.endsWith('.png') ? 'png' : 'jpeg') + ';base64,' + b64(f);
const lan = fs.readFileSync(R + '/public/logo-ve-landscape-v1.svg', 'utf8');
const font = b64('/tmp/claude-0/-home-user-vegansexplore-com/d2fb880b-f90e-58ab-8cdb-46b4bcdc6101/scratchpad/fonts/Montserrat.ttf');
const IG = '<svg viewBox="0 0 24 24" width="1em" height="1em" style="vertical-align:-0.14em;margin-right:.3em"><rect x="2" y="2" width="20" height="20" rx="6" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="4.6" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="17.6" cy="6.4" r="1.4" fill="currentColor"/></svg>';
const css = `@font-face{font-family:M;src:url(data:font/ttf;base64,${font})}*{box-sizing:border-box;margin:0}html,body{background:transparent;font-family:M,sans-serif}
.f{position:relative;overflow:hidden;width:1080px;height:1920px}.lg svg{width:100%;height:auto;display:block}
.bar{position:absolute;left:0;right:0;bottom:0;height:270px;background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 48px;gap:24px}
.bar .lg{width:440px;flex:none}.bar .t{text-align:right;white-space:nowrap}.bar b{display:block;font-size:50px;font-weight:900;color:#141414}.bar span{font-size:34px;font-weight:600;color:#555}
.tx{text-shadow:0 3px 16px rgba(0,0,0,.6)}
.pc{position:absolute;background:#fff;padding:20px;box-shadow:0 20px 44px rgba(0,0,0,.4);border-radius:4px}.pc img{display:block;width:100%;height:100%;object-fit:cover}`;
const BAR = `<div class="bar"><div class="lg">${lan}</div><div class="t"><b>${IG}KJ (@keyz60)</b><span>Philadelphia</span></div></div>`;
const ov = title => `<div class="f"><div style="position:absolute;left:0;right:0;bottom:270px;height:700px;background:linear-gradient(0deg,rgba(0,0,0,.82),rgba(0,0,0,.45) 55%,transparent)"></div>
  <div class="tx" style="position:absolute;left:64px;right:64px;bottom:330px;color:#fff;font-size:92px;font-weight:900;line-height:1.04">${title}</div>${BAR}</div>`;
const ovCover = `<div class="f"><div style="position:absolute;inset:0 0 270px 0;background:linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,0) 40%,rgba(0,0,0,.6))"></div>
  <div class="pc" style="left:170px;width:740px;top:190px;height:790px;transform:rotate(-2.5deg)"><img src="${img(FR + '/av.jpg')}"></div>
  <div style="position:absolute;left:50px;right:50px;top:1050px;text-align:center;color:#fff">
    <div style="font-size:46px;font-weight:800;letter-spacing:.06em">MEET YOUR OFFICIAL</div>
    <div style="font-size:90px;font-weight:900;line-height:1.02;margin-top:8px;text-shadow:0 3px 10px rgba(0,0,0,.45)">VEGANS EXPLORE<br>CONTENT CREATOR</div>
    <div style="font-size:60px;font-weight:800;margin-top:26px">${IG}KJ (@keyz60)</div></div>${BAR}</div>`;
const bg = (pic, pos) => `<div style="width:1080px;height:1650px;background:url(${img(pic)}) ${pos || 'center'}/cover"></div>`;
const GROUP = process.env.GROUP || SC + 'b02-cast.jpg';
const shots = [
  ['a-kai', SC + 'b23-kai-studio.jpg', 0, "Hey, it's Kai from Vegans Explore"],
  ['b-philly', R + '/communities/philadelphia/banner.jpg', 0, 'Big news for Philadelphia'],
  ['c-cover', R + '/communities/philadelphia/banner.jpg', 0, null],
  ['d-kj', FR + '/story-bg.jpg', 'center top', 'Our newest official content creator'],
  ['e-market', SC + 'b10-market-walk.jpg', 0, 'Where Vegan Philadelphia comes together'],
  ['f-river', SC + 'b07-river-market.jpg', 0, 'Every Vegan place, person and group'],
  ['g-potluck', SC + 'b06-potluck.jpg', 0, 'Events near you'],
  ['h-shows', W + 'liz-media.jpg', 0, 'Our shows'],
  ['i-cast', GROUP, 0, 'Guides that walk you through it'],
  ['j-points', W + 'liz-points.jpg', 0, 'Earn points for taking part'],
  ['k-founding', SC + 'b44-celebrate.jpg', 0, 'Become a Founding Member by January 1'],
];
(async () => {
  const b = await chromium.launch();
  for (const [k, pic, pos, title] of shots) {
    let p = await b.newPage({ viewport: { width: 1080, height: 1650 } });
    await p.setContent(`<style>${css}</style>${bg(pic, pos)}`); await p.waitForTimeout(200); await p.screenshot({ path: `bg-${k}.png` }); await p.close();
    p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    await p.setContent(`<style>${css}</style>${title ? ov(title) : ovCover}`); await p.waitForTimeout(250); await p.screenshot({ path: `ov-${k}.png`, omitBackground: true }); await p.close();
  }
  await b.close();
})();
