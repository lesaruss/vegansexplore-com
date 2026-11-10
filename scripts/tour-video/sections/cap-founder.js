const {chromium}=require('playwright');const W='https://vegansexplore.com';
async function down(p,y){await p.waitForTimeout(2200);await p.evaluate(y=>scrollBy(0,y),y);}
async function to(p,re,off){await p.waitForTimeout(2500);const b=await p.getByText(re).first().boundingBox().catch(()=>null);if(b)await p.evaluate(([y,o])=>scrollBy(0,y-o),[b.y,off||150]);}
const SH={
 wg_founder:{u:W+'/passport#/founder'},
 wg_count:{u:W+'/passport#/founder',f:p=>to(p,/You Are Early/i,60)},
 wg_card:{u:W+'/passport#/founder',f:p=>down(p,900)},
 survey:{u:W+'/survey?s=explorer'},
 survey_q:{u:W+'/survey?s=explorer',f:async p=>{await p.waitForTimeout(2000);await p.getByText(/^Vegan$/).first().click().catch(()=>{});await p.waitForTimeout(800);}},
 home_count:{u:W+'/',f:p=>down(p,700)},
 policies:{u:W+'/policies#membership'},
 directory:{u:W+'/directory?city=philadelphia'},
 checkin:{u:W+'/directory/love-life-cafe'},
 fb:{u:W+'/directory',f:async p=>{await p.waitForTimeout(1500);await p.evaluate(()=>window.VEFeedback&&VEFeedback.open&&VEFeedback.open({form:true}));}},
 paths:{u:W+'/paths',f:p=>down(p,1500)},
 explore:{u:W+'/explore',f:p=>down(p,1900)},
 hub:{u:W+'/communities/new-york'},
 events:{u:W+'/events?city=philadelphia'},
 media:{u:W+'/media'},
 dairy:{u:W+'/guides/vegan-dairy-guide'},
 points:{u:W+'/passport#/points',f:p=>to(p,/^Your Link$/,300)},
 guides:{u:W+'/guides',f:p=>down(p,700)},
};
(async()=>{const b=await chromium.launch();const only=process.argv.slice(2);
for(const [n,s] of Object.entries(SH)){ if(only.length&&!only.includes(n))continue;
 const c=await b.newContext({viewport:{width:390,height:703},deviceScaleFactor:3,isMobile:true,hasTouch:true});const p=await c.newPage();
 try{await p.goto(s.u,{waitUntil:'networkidle',timeout:45000});await p.addStyleTag({content:'#ve-install,.vei{display:none!important}'});await p.waitForTimeout(1800);
 if(s.f)await s.f(p);await p.waitForTimeout(1200);
 await p.screenshot({path:`cap/${n}.png`});console.log('ok',n);}catch(e){console.log('ERR',n,e.message.slice(0,120));}
 await c.close();}
await b.close();})();
