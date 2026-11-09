const {chromium}=require('playwright');const W='https://vegansexplore.com';
const txt=(p,t)=>p.getByText(t,{exact:false}).first();
async function at(p,t,off=120){try{const el=txt(p,t);await el.scrollIntoViewIfNeeded({timeout:8000});const b=await el.boundingBox();await p.evaluate(([y,o])=>scrollBy(0,y-o),[b.y,off]);}catch(e){console.log('  noat',t)}}
const SH={
 communities:{u:W+'/communities'},
 hub:{u:W+'/communities/south-florida'},
 pulse:{u:W+'/pulse?city=south-florida',f:async p=>{await p.waitForTimeout(2500);await p.evaluate(()=>scrollBy(0,720));}},
 pulse2:{u:W+'/pulse?city=south-florida',f:async p=>{await p.waitForTimeout(2500);const a=p.locator('.vep-card a, a.vep-title, .vep-topic a').first();const h=await a.getAttribute('href').catch(()=>null);console.log('  href',h);if(h){await p.goto(new URL(h,'https://vegansexplore.com').href,{waitUntil:'networkidle'});await p.waitForTimeout(2500);await p.evaluate(()=>scrollBy(0,250));}}},
 pulse_top:{u:W+'/pulse?city=south-florida'},
 boards:{u:W+'/pulse/fosters?city=south-florida'},
 jobs:{u:W+'/pulse/jobs?city=south-florida'},
 hub_events:{u:W+'/communities/south-florida?tab=events'},
 most_voted:{u:W+'/communities/south-florida',f:p=>at(p,'Most voted in',120)},
 suggest:{u:W+'/pulse/suggest?city=south-florida'},
 feedback:{u:W+'/communities/south-florida',f:async p=>{await p.evaluate(()=>window.VEFeedback&&VEFeedback.open&&VEFeedback.open({form:true}));}},
 vote_chapter:{u:W+'/communities',f:p=>at(p,'South Florida',160)},
 next:{u:W+'/communities',f:p=>at(p,'Where should we go next',90)},
 survey:{u:W+'/survey?s=explorer'},
 share:{u:W+'/communities/south-florida',f:async p=>{await p.evaluate(()=>scrollTo(0,0));}},
};
(async()=>{const b=await chromium.launch();const only=process.argv.slice(2);
for(const [n,s] of Object.entries(SH)){ if(only.length&&!only.includes(n))continue;
 const c=await b.newContext({viewport:{width:390,height:703},deviceScaleFactor:3,isMobile:true,hasTouch:true});const p=await c.newPage();
 try{await p.goto(s.u,{waitUntil:'networkidle',timeout:45000});await p.addStyleTag({content:'#ve-install,.vei{display:none!important}'});await p.waitForTimeout(1800);
 if(s.f)await s.f(p);await p.waitForTimeout(1200);
 await p.screenshot({path:`cap/${n}.png`});console.log('ok',n);}catch(e){console.log('ERR',n,e.message.slice(0,120));}
 await c.close();}
await b.close();})();
