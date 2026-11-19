// The 30-second trailer's site shots (Sean approved the script 2026-11-19; playbook ve-meetup-groups). Copied from cap-city.js:
// live pages at 390 x 703, 3x, as phone stills. Run beside a cap/ folder: node cap-trailer.js [names...]
const {chromium}=require('playwright');const W='https://vegansexplore.com';
const txt=(p,t)=>p.getByText(t,{exact:false}).first();
async function at(p,t,off=120){try{const el=txt(p,t);await el.scrollIntoViewIfNeeded({timeout:8000});const b=await el.boundingBox();await p.evaluate(([y,o])=>scrollBy(0,y-o),[b.y,off]);}catch(e){console.log('  noat',t)}}
const SH={
 home:{u:W+'/'},
 directory:{u:W+'/directory/restaurants?city=south-florida',f:async p=>{await p.waitForTimeout(2500);await p.evaluate(()=>scrollBy(0,380));}},
 events:{u:W+'/events?city=south-florida',f:async p=>{await p.waitForTimeout(2500);await p.evaluate(()=>scrollBy(0,330));}},
 pulse:{u:W+'/pulse?city=south-florida',f:async p=>{await p.waitForTimeout(2500);await p.evaluate(()=>scrollBy(0,720));}},
 guides:{u:W+'/guides',f:async p=>{await p.waitForTimeout(2500);await p.evaluate(()=>scrollBy(0,300));}},
 vouch:{u:W+'/directory/restaurants?city=south-florida',f:p=>at(p,/Vouch/,260)},
};
(async()=>{const b=await chromium.launch();const only=process.argv.slice(2);
for(const [n,s] of Object.entries(SH)){ if(only.length&&!only.includes(n))continue;
 const c=await b.newContext({viewport:{width:390,height:703},deviceScaleFactor:3,isMobile:true,hasTouch:true});const p=await c.newPage();
 try{await p.goto(s.u,{waitUntil:'networkidle',timeout:45000});await p.addStyleTag({content:'#ve-install,.vei{display:none!important}'});await p.waitForTimeout(1800);
 if(s.f)await s.f(p);await p.waitForTimeout(1200);
 await p.screenshot({path:`cap/${n}.png`});console.log('ok',n);}catch(e){console.log('ERR',n,e.message.slice(0,120));}
 await c.close();}
await b.close();})();
