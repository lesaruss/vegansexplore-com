const {chromium}=require('playwright');const W='https://vegansexplore.com';
async function down(p,y){await p.waitForTimeout(2200);await p.evaluate(y=>scrollBy(0,y),y);}
const SH={
 guides_top:{u:W+'/guides'},
 guides_list:{u:W+'/guides',f:p=>down(p,380)},
 guides_food:{u:W+'/guides?interest=food',f:p=>down(p,300)},
 guides_more:{u:W+'/guides',f:p=>down(p,1400)},
 rest_guide:{u:W+'/guides/vegan-restaurant-guide'},
 events_guide:{u:W+'/guides/vegan-events-guide'},
 dairy:{u:W+'/guides/vegan-dairy-guide'},
 dairy_free:{u:W+'/guides/vegan-dairy-guide',f:p=>down(p,500)},
 airport:{u:W+'/guides/airport-guide'},
 talk:{u:W+'/guides/nutrition-guide',f:async p=>{await p.waitForTimeout(2500);const t=p.getByText(/Talk to Theo/).first();await t.click().catch(e=>console.log(' notalk'));await p.waitForTimeout(1500);}},
 holiday:{u:W+'/guides/holiday-guide'},
 feedback:{u:W+'/guides',f:async p=>{await p.waitForTimeout(1500);await p.evaluate(()=>window.VEFeedback&&VEFeedback.open&&VEFeedback.open({form:true}));}},
 survey:{u:W+'/survey?s=explorer'},
 points_page:{u:W+'/passport#/points',f:p=>down(p,480)},
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
