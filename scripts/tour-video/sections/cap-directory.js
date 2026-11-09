const {chromium}=require('playwright');const W='https://vegansexplore.com';
async function cards(p,off=150){await p.waitForSelector('.rank-card',{timeout:15000}).catch(()=>{});const b=await p.locator('.rank-card').first().boundingBox().catch(()=>null);if(b)await p.evaluate(([y,o])=>scrollBy(0,y-o),[b.y,off]);}
const SH={
 dir_top:{u:W+'/directory'},
 dir_city:{u:W+'/directory?city=south-florida'},
 food:{u:W+'/directory?tab=food&city=south-florida',f:p=>cards(p)},
 products:{u:W+'/directory?tab=products',f:p=>cards(p)},
 services:{u:W+'/directory?tab=services',f:p=>cards(p)},
 health:{u:W+'/directory?tab=services&sub=health-professionals',f:p=>cards(p)},
 media_dir:{u:W+'/directory?tab=media',f:p=>cards(p)},
 media:{u:W+'/media'},
 community:{u:W+'/directory?tab=community&city=south-florida',f:p=>cards(p)},
 people:{u:W+'/directory?tab=people',f:p=>cards(p)},
 listing:{u:W+'/directory/love-life-cafe'},
 submit:{u:W+'/claim?add=1'},
 feedback:{u:W+'/directory?city=south-florida',f:async p=>{await p.evaluate(()=>window.VEFeedback&&VEFeedback.open&&VEFeedback.open({form:true}));}},
 vote:{u:W+'/directory?tab=food&city=south-florida',f:p=>cards(p,60)},
 listing_vote:{u:W+'/directory/love-life-cafe',f:async p=>{await p.evaluate(()=>scrollBy(0,330));}},
 survey:{u:W+'/survey?s=explorer'},
 communities:{u:W+'/communities'},
};
(async()=>{const b=await chromium.launch();const only=process.argv.slice(2);
for(const [n,s] of Object.entries(SH)){ if(only.length&&!only.includes(n))continue;
 const c=await b.newContext({viewport:{width:390,height:703},deviceScaleFactor:3,isMobile:true,hasTouch:true});const p=await c.newPage();
 try{await p.goto(s.u,{waitUntil:'networkidle',timeout:45000});await p.addStyleTag({content:'#ve-install,.vei,.ve-fb-tab,[class*="install"]{display:none!important}'});await p.waitForTimeout(1500);
 if(s.f)await s.f(p);await p.waitForTimeout(1200);
 await p.screenshot({path:`cap/${n}.png`});console.log('ok',n);}catch(e){console.log('ERR',n,e.message.slice(0,120));}
 await c.close();}
await b.close();})();
