const {chromium}=require('playwright');const W='https://vegansexplore.com';
async function down(p,y){await p.waitForTimeout(2200);await p.evaluate(y=>scrollBy(0,y),y);}
const SH={
 points_top:{u:W+'/passport#/points'},
 points_parts:{u:W+'/passport#/points',f:p=>down(p,640)},
 survey:{u:W+'/survey?s=explorer'},
 checkin:{u:W+'/directory/love-life-cafe'},
 listing_give:{u:W+'/directory/love-life-cafe',f:async p=>{await p.waitForTimeout(2500);const t=p.getByText(/Give points/i).first();const b=await t.boundingBox().catch(()=>null);if(b)await p.evaluate(y=>scrollBy(0,y-180),b.y);else await p.evaluate(()=>scrollBy(0,1600));}},
 nonprofit:{u:W+'/directory?tab=community&city=south-florida',f:async p=>{await p.waitForSelector('.rank-card',{timeout:15000}).catch(()=>{});const b=await p.locator('.rank-card').first().boundingBox().catch(()=>null);if(b)await p.evaluate(y=>scrollBy(0,y-150),b.y);}},
 dairy:{u:W+'/guides/vegan-dairy-guide'},
 talk:{u:W+'/guides/nutrition-guide',f:async p=>{await p.waitForTimeout(2500);await p.getByText(/Talk to Theo/).first().click().catch(()=>{});await p.waitForTimeout(1500);}},
 vault:{u:W+'/vault'},
 vault2:{u:W+'/vault',f:p=>down(p,500)},
 bounties:{u:W+'/bounties'},
 profile:{u:W+'/survey?s=explorer',f:p=>down(p,0)},
 feedback:{u:W+'/passport#/points',f:async p=>{await p.waitForTimeout(1500);await p.evaluate(()=>window.VEFeedback&&VEFeedback.open&&VEFeedback.open({form:true}));}},
 paths:{u:W+'/paths',f:p=>down(p,420)},
};
(async()=>{const b=await chromium.launch();const only=process.argv.slice(2);
for(const [n,s] of Object.entries(SH)){ if(only.length&&!only.includes(n))continue;
 const c=await b.newContext({viewport:{width:390,height:703},deviceScaleFactor:3,isMobile:true,hasTouch:true});const p=await c.newPage();
 try{await p.goto(s.u,{waitUntil:'networkidle',timeout:45000});await p.addStyleTag({content:'#ve-install,.vei{display:none!important}'});await p.waitForTimeout(1800);
 if(s.f)await s.f(p);await p.waitForTimeout(1200);
 await p.screenshot({path:`cap/${n}.png`});console.log('ok',n);}catch(e){console.log('ERR',n,e.message.slice(0,120));}
 await c.close();}
await b.close();})();
