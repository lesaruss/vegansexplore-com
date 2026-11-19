// The trailer's 16:9 cut (Sean, 2026-11-19: "using shots that are 16 by 9, using screenshots that are from the desktop"). The same pages as
// cap-trailer.js, captured on a desktop at 1600 x 900, 2x. Run beside a capw/ folder: node cap-trailer-wide.js [names...]
const {chromium}=require('playwright');const W='https://vegansexplore.com';
const txt=(p,t)=>p.getByText(t,{exact:false}).first();
async function at(p,t,off=120){try{const el=txt(p,t);await el.scrollIntoViewIfNeeded({timeout:8000});const b=await el.boundingBox();await p.evaluate(([y,o])=>scrollBy(0,y-o),[b.y,off]);}catch(e){console.log('  noat',t)}}
const SH={
 doors:{u:W+'/directory'},
 near:{u:W+'/directory/restaurants?city=south-florida'},
 events:{u:W+'/events?city=south-florida',f:async p=>{await p.waitForTimeout(2500);await p.evaluate(()=>scrollBy(0,300));}},
 pulse:{u:W+'/pulse?city=south-florida',f:async p=>{await p.waitForTimeout(2500);await p.evaluate(()=>scrollBy(0,500));}},
 guides:{u:W+'/guides',f:async p=>{await p.waitForTimeout(2500);await p.evaluate(()=>scrollBy(0,250));}},
 guides2:{u:W+'/guides',f:async p=>{await p.waitForTimeout(2500);await p.evaluate(()=>scrollBy(0,560));await p.waitForTimeout(4000);await p.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r;})))});}},
 directory2:{u:W+'/directory/restaurants?city=south-florida',f:async p=>{await p.waitForTimeout(2500);await p.evaluate(()=>scrollBy(0,700));}},
 directory:{u:W+'/directory/restaurants?city=south-florida',f:async p=>{await p.waitForTimeout(2500);await p.evaluate(()=>scrollBy(0,350));}},
 founding2:{u:W+'/',f:p=>at(p,/Free with a short survey/,200)},
 passport:{u:W+'/passport'},
};
(async()=>{const b=await chromium.launch();const only=process.argv.slice(2);
for(const [n,s] of Object.entries(SH)){ if(only.length&&!only.includes(n))continue;
 const c=await b.newContext({viewport:{width:1600,height:900},deviceScaleFactor:2});const p=await c.newPage();
 try{await p.goto(s.u,{waitUntil:'networkidle',timeout:45000});await p.addStyleTag({content:'#ve-install,.vei{display:none!important}'});await p.waitForTimeout(1800);
 if(s.f)await s.f(p);await p.waitForTimeout(1200);
 await p.screenshot({path:`capw/${n}.png`});console.log('ok',n);}catch(e){console.log('ERR',n,e.message.slice(0,120));}
 await c.close();}
await b.close();})();
