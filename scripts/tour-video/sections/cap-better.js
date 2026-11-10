const {chromium}=require('playwright');const W='https://vegansexplore.com';
async function down(p,y){await p.waitForTimeout(2200);await p.evaluate(y=>scrollBy(0,y),y);}
async function to(p,re,off){await p.waitForTimeout(2500);const b=await p.getByText(re).first().boundingBox().catch(()=>null);if(b)await p.evaluate(([y,o])=>scrollBy(0,y-o),[b.y,off||150]);}
const SH={
 wg_better:{u:W+'/passport#/better'},
 wg_ways:{u:W+'/passport#/better',f:p=>to(p,/Ways to tell us/i,120)},
 wg_ways2:{u:W+'/passport#/better',f:p=>to(p,/Search for what is missing/i,120)},
 fb_form:{u:W+'/directory/love-life-cafe',f:async p=>{await p.waitForTimeout(2000);await p.evaluate(()=>window.VEFeedback&&VEFeedback.open&&VEFeedback.open({form:true}));}},
 fb_kinds:{u:W+'/events',f:async p=>{await p.waitForTimeout(2000);await p.evaluate(()=>window.VEFeedback&&VEFeedback.open&&VEFeedback.open({form:true}));await p.waitForTimeout(800);await p.getByText(/^Something is missing$/).first().click().catch(()=>{});}},
 guide_ask:{u:W+'/guides/vegan-dairy-guide',f:async p=>{await p.waitForTimeout(2500);await p.getByText(/Talk to Maya/).first().click().catch(()=>{});await p.waitForTimeout(1500);}},
 search_miss:{u:W+'/search?q=vegan%20sushi%20in%20Boise'},
 search_add:{u:W+'/search?q=vegan%20sushi%20in%20Boise',f:p=>down(p,500)},
 board:{u:W+'/communities/south-florida',f:p=>to(p,/Suggest a Topic/i,250)},
 pulse:{u:W+'/pulse'},
 contact:{u:W+'/contact'},
 fb_broken:{u:W+'/pulse',f:async p=>{await p.waitForTimeout(2000);await p.evaluate(()=>window.VEFeedback&&VEFeedback.open&&VEFeedback.open({form:true}));await p.waitForTimeout(800);await p.getByText(/^Something is broken$/).first().click().catch(()=>{});}},
 nominate:{u:W+'/pulse/suggest?city=south-florida'},
 show_line:{u:W+'/comment/soflo-nominate'},
 home2:{u:W+'/',f:p=>down(p,700)},
 explore2:{u:W+'/explore',f:p=>down(p,600)},
 survey:{u:W+'/survey?s=explorer'},
 communities:{u:W+'/communities'},
 events:{u:W+'/events'},
 directory:{u:W+'/directory'},
 paths:{u:W+'/paths',f:p=>down(p,900)},
};
(async()=>{const b=await chromium.launch();const only=process.argv.slice(2);
for(const [n,s] of Object.entries(SH)){ if(only.length&&!only.includes(n))continue;
 const c=await b.newContext({viewport:{width:390,height:703},deviceScaleFactor:3,isMobile:true,hasTouch:true});const p=await c.newPage();
 try{await p.goto(s.u,{waitUntil:'networkidle',timeout:45000});await p.addStyleTag({content:'#ve-install,.vei{display:none!important}'});await p.waitForTimeout(1800);
 if(s.f)await s.f(p);await p.waitForTimeout(1200);
 await p.screenshot({path:`cap/${n}.png`});console.log('ok',n);}catch(e){console.log('ERR',n,e.message.slice(0,120));}
 await c.close();}
await b.close();})();
