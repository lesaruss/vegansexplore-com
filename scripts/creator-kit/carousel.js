// KJ carousel prototype (10 slides, 1080x1350) and story (1080x1920). Template: swap CITY, BANNER, AVATAR, NAME, HANDLE.
const { chromium } = require('playwright'); const fs = require('fs');
const R = '/home/user/vegansexplore-com';
const b64 = f => fs.readFileSync(f).toString('base64');
const img = f => 'data:image/jpeg;base64,' + b64(f);
const CITY = 'Philadelphia', NAME = 'KJ', HANDLE = '@keyz60';
const BANNER = img(R + '/communities/philadelphia/banner.jpg'), AVATAR = img('av.jpg');
const lan = fs.readFileSync(R + '/public/logo-ve-landscape-v1.svg', 'utf8');
const font = b64('/tmp/claude-0/-home-user-vegansexplore-com/d2fb880b-f90e-58ab-8cdb-46b4bcdc6101/scratchpad/fonts/Montserrat.ttf');
const IG = '<svg viewBox="0 0 24 24" width="1em" height="1em" style="vertical-align:-0.14em;margin-right:.3em"><rect x="2" y="2" width="20" height="20" rx="6" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="4.6" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="17.6" cy="6.4" r="1.4" fill="currentColor"/></svg>';
const css = `@font-face{font-family:M;src:url(data:font/ttf;base64,${font})}*{box-sizing:border-box;margin:0}body{font-family:M,sans-serif}
.f{position:relative;overflow:hidden;width:1080px}.lg svg{width:100%;height:auto;display:block}
.pc{position:absolute;background:#fff;padding:20px;box-shadow:0 20px 44px rgba(0,0,0,.4);border-radius:4px}
.pc img{display:block;width:100%;height:100%;object-fit:cover}
.bar{position:absolute;left:0;right:0;bottom:0;height:160px;background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 48px;gap:24px}
.bar .lg{width:290px;flex:none}.bar .t{text-align:right}.bar b{display:block;font-size:42px;font-weight:900;color:#141414;line-height:1.1}.bar span{font-size:28px;font-weight:600;color:#555}
.tx{text-shadow:0 3px 16px rgba(0,0,0,.6)}`;
const bar = (right) => `<div class="bar"><div class="lg">${lan}</div><div class="t">${right}</div></div>`;
const who = `<b style="font-size:38px">${IG}${NAME} (${HANDLE})</b><span>${CITY}</span>`;
const slide = (pic, title, sub, right) => `<div class="f" style="height:1350px">
  <div style="position:absolute;inset:0 0 160px 0;background:url(${img(pic.startsWith('/') ? pic : R + '/public/guides/welcome/' + pic)}) center/cover"></div>
  <div style="position:absolute;left:0;right:0;bottom:160px;height:560px;background:linear-gradient(0deg,rgba(0,0,0,.82),rgba(0,0,0,.5) 55%,transparent)"></div>
  <div class="tx" style="position:absolute;left:60px;right:60px;bottom:200px;color:#fff"><div style="font-size:78px;font-weight:900;line-height:1.04">${title}</div><div style="font-size:42px;font-weight:600;margin-top:18px;line-height:1.25">${sub}</div></div>
  ${bar(right || who)}</div>`;
const cover = `<div class="f" style="height:1350px;background:url(${BANNER}) center/cover">
  <div style="position:absolute;inset:0 0 160px 0;background:linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,0) 40%,rgba(0,0,0,.6))"></div>
  <div class="pc" style="left:230px;width:620px;top:70px;height:680px;transform:rotate(-2.5deg)"><img src="${AVATAR}"></div>
  <div style="position:absolute;left:50px;right:50px;top:790px;text-align:center;color:#fff">
    <div style="font-size:40px;font-weight:800;letter-spacing:.06em">MEET YOUR OFFICIAL</div>
    <div style="font-size:80px;font-weight:900;line-height:1.02;margin-top:6px;text-shadow:0 3px 10px rgba(0,0,0,.45)">VEGANS EXPLORE<br>CONTENT CREATOR</div>
    <div style="font-size:52px;font-weight:800;margin-top:18px">${IG}${NAME} (${HANDLE})</div></div>
  ${bar('<b>Become a Member</b><span>Swipe to see why ›</span>')}</div>`;
const SC = '/tmp/claude-0/-home-user/d2fb880b-f90e-58ab-8cdb-46b4bcdc6101/scratchpad/frames/scenes/';
const S = [
  [SC + 'b07-river-market.jpg', 'Every Vegan place, person and group', `Restaurants, bakeries, food trucks and the people behind them, in ${CITY}.`],
  [SC + 'b10-market-walk.jpg', 'Your city has its own home', `${CITY}'s page: its places, events, Daily Pulse and Community Board.`],
  [SC + 'b06-potluck.jpg', 'Something to do, near you', 'Meetups, pop-ups, festivals and dinners, every week.'],
  [SC + 'b23-kai-studio.jpg', 'Shows worth your time', 'Our podcasts, films and books the community loves.'],
  [SC + 'b02-cast.jpg', 'Guides walk you through it', 'One topic at a time, and every Guide has a free part to try.'],
  ['liz-points.jpg', 'Earn points by taking part', 'Check in, vote and share. You start with 250.'],
  [SC + 'b39-nori-door.jpg', 'Everyone starts as an Explorer', 'Then find the path that fits what you do, and earn its badge.'],
  [SC + 'b35-dani-cow.jpg', 'The reason we are all here', 'Find the nonprofits, rescues and sanctuaries near you.'],
];
const closing = slide(SC + 'b44-celebrate.jpg', 'Become a Founding Member', 'Register by midnight Eastern on January 1, and Founding Member stays on your profile for good.',
  `<b style="font-size:38px">${IG}${NAME} (${HANDLE})</b><span>Tap the link in my bio</span>`);
const story = `<div class="f" style="height:1920px;background:url(${BANNER}) center/cover">
  <div style="position:absolute;inset:0 0 260px 0;background:linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,0) 40%,rgba(0,0,0,.6))"></div>
  <div class="pc" style="left:170px;width:740px;top:150px;height:810px;transform:rotate(-2.5deg)"><img src="${AVATAR}"></div>
  <div style="position:absolute;left:50px;right:50px;top:1030px;text-align:center;color:#fff">
    <div style="font-size:46px;font-weight:800;letter-spacing:.06em">MEET YOUR OFFICIAL</div>
    <div style="font-size:90px;font-weight:900;line-height:1.02;margin-top:8px;text-shadow:0 3px 10px rgba(0,0,0,.45)">VEGANS EXPLORE<br>CONTENT CREATOR</div>
    <div style="font-size:60px;font-weight:800;margin-top:26px">${IG}${NAME} (${HANDLE})</div></div>
  <div class="bar" style="height:260px"><div class="lg" style="width:340px">${lan}</div><div class="t"><b style="font-size:52px">Become a Member</b><span style="font-size:32px">Link in my bio</span></div></div></div>`;
(async () => {
  const b = await chromium.launch();
  const all = [['01-cover', cover], ...S.map((s, i) => [String(i + 2).padStart(2, '0') + '-' + s[0].split('/').pop().replace('liz-', '').replace('.jpg', ''), slide(...s)]), ['10-founder', closing]];
  for (const [k, h] of all) { const p = await b.newPage({ viewport: { width: 1080, height: 1350 } }); await p.setContent(`<style>${css}</style>${h}`); await p.waitForTimeout(250); await p.screenshot({ path: `c-${k}.png` }); await p.close(); }
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); await p.setContent(`<style>${css}</style>${story}`); await p.waitForTimeout(250); await p.screenshot({ path: 'c-story.png' });
  await b.close();
})();
