const {chromium}=require('playwright');const W='https://vegansexplore.com';
async function down(p,y){await p.waitForTimeout(2200);await p.evaluate(y=>scrollBy(0,y),y);}
async function to(p,re,off){await p.waitForTimeout(2500);const b=await p.getByText(re).first().boundingBox().catch(()=>null);if(b)await p.evaluate(([y,o])=>scrollBy(0,y-o),[b.y,off||150]);}
const SH={
 wg_paths:{u:W+'/passport#/paths'},
 wg_rows:{u:W+'/passport#/paths',f:p=>to(p,/The paths and their badges/i,120)},
 paths_top:{u:W+'/paths'},
 paths_list:{u:W+'/paths',f:p=>down(p,560)},
 paths_more:{u:W+'/paths',f:p=>down(p,1250)},
 paths_group:{u:W+'/paths',f:async p=>{await p.waitForTimeout(3000);const n=await p.evaluate(()=>{const e=[...document.querySelectorAll('b,h3,h4,strong,span')].find(x=>/group leader/i.test(x.textContent)&&x.textContent.length<40);if(e){e.scrollIntoView({block:'center'});return e.textContent}return null});console.log('group:',n);}},
 link:{u:W+'/passport#/points',f:p=>to(p,/^Your Link$/,260)},
 survey:{u:W+'/survey?s=explorer'},
 rest:{u:W+'/guides/vegan-restaurant-guide'},
 events:{u:W+'/guides/vegan-events-guide'},
 creator:{u:W+'/guides/creator-guide'},
 nonprofit:{u:W+'/guides/nonprofit-guide'},
 business:{u:W+'/guides/pre-vegan-business-guide'},
 bounties:{u:W+'/bounties'},
 feedback:{u:W+'/passport#/paths',f:async p=>{await p.waitForTimeout(1500);await p.evaluate(()=>window.VEFeedback&&VEFeedback.open&&VEFeedback.open({form:true}));}},
 home2:{u:W+'/',f:p=>down(p,700)},
 explore:{u:W+'/explore'},
 people:{u:W+'/people'},
 sample_biz:{u:W+'/business/sample'},
 community:{u:W+'/communities'},
};
(async()=>{const b=await chromium.launch();const only=process.argv.slice(2);
for(const [n,s] of Object.entries(SH)){ if(only.length&&!only.includes(n))continue;
 const c=await b.newContext({viewport:{width:390,height:703},deviceScaleFactor:3,isMobile:true,hasTouch:true});const p=await c.newPage();
 try{await p.goto(s.u,{waitUntil:'networkidle',timeout:45000});await p.addStyleTag({content:'#ve-install,.vei{display:none!important}'});await p.waitForTimeout(1800);
 if(s.f)await s.f(p);await p.waitForTimeout(1200);
 await p.screenshot({path:`cap/${n}.png`});console.log('ok',n);}catch(e){console.log('ERR',n,e.message.slice(0,120));}
 await c.close();}
await b.close();})();
