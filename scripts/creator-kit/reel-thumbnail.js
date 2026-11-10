// Reel thumbnail (Sean, 2026-11-10: "a clean thumbnail that she can use"). 1080x1920, no bar; everything sits inside the middle
// 1080x1350, so the profile grid's 4:5 crop keeps the whole picture and title.
const { chromium } = require('playwright'); const fs = require('fs');
const R = '/home/user/vegansexplore-com';
const b64 = f => fs.readFileSync(f).toString('base64');
const img = f => 'data:image/jpeg;base64,' + b64(f);
const font = b64('/tmp/claude-0/-home-user-vegansexplore-com/d2fb880b-f90e-58ab-8cdb-46b4bcdc6101/scratchpad/fonts/Montserrat.ttf');
const IG = '<svg viewBox="0 0 24 24" width="1em" height="1em" style="vertical-align:-0.14em;margin-right:.3em"><rect x="2" y="2" width="20" height="20" rx="6" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="4.6" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="17.6" cy="6.4" r="1.4" fill="currentColor"/></svg>';
const NAME = process.env.NAME || 'KJ', HANDLE = process.env.HANDLE || '@keyz60';
const BANNER = img(process.env.BANNER || R + '/communities/philadelphia/banner.jpg'), AV = img(process.env.AVATAR || 'av.jpg');
const html = `<style>@font-face{font-family:M;src:url(data:font/ttf;base64,${font})}*{box-sizing:border-box;margin:0}body{font-family:M,sans-serif}
.pc{position:absolute;background:#fff;padding:20px;box-shadow:0 20px 44px rgba(0,0,0,.4);border-radius:4px}.pc img{display:block;width:100%;height:100%;object-fit:cover}</style>
<div style="position:relative;overflow:hidden;width:1080px;height:1920px;background:url(${BANNER}) center/cover">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,0) 30%,rgba(0,0,0,.35) 60%,rgba(0,0,0,.55))"></div>
  <div class="pc" style="left:220px;width:640px;top:330px;height:700px;transform:rotate(-2.5deg)"><img src="${AV}"></div>
  <div style="position:absolute;left:50px;right:50px;top:1090px;text-align:center;color:#fff">
    <div style="font-size:44px;font-weight:800;letter-spacing:.06em">MEET YOUR OFFICIAL</div>
    <div style="font-size:88px;font-weight:900;line-height:1.02;margin-top:8px;text-shadow:0 3px 10px rgba(0,0,0,.45)">VEGANS EXPLORE<br>CONTENT CREATOR</div>
    <div style="font-size:58px;font-weight:800;margin-top:24px">${IG}${NAME} (${HANDLE})</div></div></div>`;
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.setContent(html); await p.waitForTimeout(300); await p.screenshot({ path: process.env.OUT || 'reel-thumb.png' }); await b.close(); })();
