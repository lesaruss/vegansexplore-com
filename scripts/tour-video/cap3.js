const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({proxy:{server:process.env.HTTPS_PROXY}});
const c=await b.newContext({viewport:{width:390,height:488},deviceScaleFactor:3});const p=await c.newPage();
await p.goto('https://vegansexplore.com/business/sample/tour',{waitUntil:'networkidle'});await p.waitForTimeout(1500);
const bg=await p.evaluate(()=>{const m=document.querySelector('#dgMaya');const r=m.getBoundingClientRect();window.scrollTo(0,r.top+scrollY-200);return getComputedStyle(m).backgroundImage});
console.log(bg);await p.waitForTimeout(4000);await p.screenshot({path:'cap/tour_talk.png'});await b.close()})();
