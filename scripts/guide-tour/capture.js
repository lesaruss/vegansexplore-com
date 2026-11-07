const { chromium } = require('playwright');
// [file, url hash, selector to outline (inside #dgMain), index]
const S=[
 ['f05-home','', '.rg-steps',0],
 ['f06-tips','tips','.dg-srow',0],
 ['f07-pulse','pulse','.vep-list, .rg-eps, .dg-blur',0],
 ['f08-directory','directory','.vrd-root',0],
 ['f09-found','found','.rg-find',0],
 ['f10-businesses','businesses','.dg-blur',0],
 ['f11-events','events','.rg-steps',0],
 ['f13-support','support','.dg-blur',0],
 ['f14-partner','partner','.rg-steps',0],
 ['f15-start','join','.dg-pricebox',0]];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});
for(const [f,h,sel,i] of S){await p.goto('https://vegansexplore.com/guides/nonprofit-guide#/'+h,{waitUntil:'networkidle'}).catch(()=>{});await p.waitForTimeout(4000);
await p.addStyleTag({content:'.dg-blur{filter:none!important;opacity:1!important}.dg-gate{display:none!important}'});
await p.evaluate(([sel,i])=>{const el=document.querySelectorAll('#dgMain '+sel)[i];if(el){el.style.outline='4px solid #F69820';el.style.outlineOffset='4px';el.style.borderRadius=el.style.borderRadius||'10px';}},[sel,i]);
await p.waitForTimeout(300);await (await p.$('#dgMain')).screenshot({path:'sb/'+f+'.png'});}
await p.goto('https://vegansexplore.com/pulse/fosters?city=central-florida',{waitUntil:'networkidle'}).catch(()=>{});await p.waitForTimeout(4000);
await p.screenshot({path:'sb/f12-fosters.png'});
await b.close();})();
