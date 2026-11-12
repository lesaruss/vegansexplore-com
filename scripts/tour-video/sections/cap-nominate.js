const {chromium}=require('playwright');const U='https://vegansexplore.com/nominate?preview=1';
const go=async(p,sel)=>{const el=await p.$(sel);const b=await el.boundingBox();await p.evaluate(y=>scrollBy(0,y-150),b.y);};
const SH={
 overview:{h:'',f:async p=>{const el=await p.$('.dg-head');const b=await el.boundingBox();await p.evaluate(y=>scrollBy(0,y-126),b.y);}},
 who:{h:'#/who',f:p=>go(p,'.dg-head')},
 why:{h:'#/why',f:async p=>{await p.click('.nm-mode[data-mode="rec"]');await p.waitForTimeout(300);await go(p,'.dg-head');}},
 send:{h:'#/send',f:p=>go(p,'.wg-gs-t')},
 sent:{h:'#/send',f:async p=>{await p.click('#nmSend');await p.waitForTimeout(800);await go(p,'.dg-head');}},
};
(async()=>{const b=await chromium.launch();
for(const [n,s] of Object.entries(SH)){const c=await b.newContext({viewport:{width:390,height:703},deviceScaleFactor:3,isMobile:true,hasTouch:true});const p=await c.newPage();
 await p.goto(U+s.h,{waitUntil:'networkidle'});await p.addStyleTag({content:'#ve-install,.vei{display:none!important} .dg-note{display:none!important}'});await p.waitForTimeout(1500);
 await s.f(p);await p.waitForTimeout(800);await p.screenshot({path:`cap/${n}.png`});console.log('ok',n);await c.close();}
await b.close();})();
