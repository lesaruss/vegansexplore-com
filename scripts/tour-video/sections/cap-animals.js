const {chromium}=require('playwright');const W='https://vegansexplore.com';
async function down(p,y){await p.waitForTimeout(2200);await p.evaluate(y=>scrollBy(0,y),y);}
async function to(p,re,off){await p.waitForTimeout(2500);const b=await p.getByText(re).first().boundingBox().catch(()=>null);if(b)await p.evaluate(([y,o])=>scrollBy(0,y-o),[b.y,off||150]);}
const SH={
 wg_animals:{u:W+'/passport#/animals'},
 wg_rows:{u:W+'/passport#/animals',f:p=>to(p,/How to show up for the animals/i,120)},
 dir_comm:{u:W+'/directory?tab=community&city=south-florida'},
 dir_comm2:{u:W+'/directory?tab=community&city=south-florida',f:p=>down(p,650)},
 np_sample:{u:W+'/nonprofits/sample'},
 fosters:{u:W+'/pulse/fosters?city=south-florida'},
 rescues:{u:W+'/pulse/rescues?city=south-florida'},
 events_sanct:{u:W+'/events?q=sanctuary'},
 events_fund:{u:W+'/events?q=fundraiser'},
 pulse_animals:{u:W+'/pulse?city=south-florida',f:p=>to(p,/For the animals/i,140)},
 give:{u:W+'/nonprofits/sample',f:p=>to(p,/Give points/i,200)},
 suggest:{u:W+'/pulse/suggest?city=philadelphia'},
 feedback:{u:W+'/pulse/rescues?city=south-florida',f:async p=>{await p.waitForTimeout(1500);await p.evaluate(()=>window.VEFeedback&&VEFeedback.open&&VEFeedback.open({form:true}));}},
 home:{u:W+'/'},
 guides:{u:W+'/guides'},
 survey:{u:W+'/survey?s=explorer'},
 hub:{u:W+'/communities/philadelphia'},
 npguide:{u:W+'/guides/nonprofit-guide'},
 explore3:{u:W+'/explore',f:p=>down(p,1300)},
 invite_pts:{u:W+'/passport#/points',f:p=>to(p,/^Give Points$/,200)},
};
(async()=>{const b=await chromium.launch();const only=process.argv.slice(2);
for(const [n,s] of Object.entries(SH)){ if(only.length&&!only.includes(n))continue;
 const c=await b.newContext({viewport:{width:390,height:703},deviceScaleFactor:3,isMobile:true,hasTouch:true});const p=await c.newPage();
 try{await p.goto(s.u,{waitUntil:'networkidle',timeout:45000});await p.addStyleTag({content:'#ve-install,.vei{display:none!important}'});await p.waitForTimeout(1800);
 if(s.f)await s.f(p);await p.waitForTimeout(1200);
 await p.screenshot({path:`cap/${n}.png`});console.log('ok',n);}catch(e){console.log('ERR',n,e.message.slice(0,120));}
 await c.close();}
await b.close();})();
