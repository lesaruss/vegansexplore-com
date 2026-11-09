const {chromium}=require('playwright');const W='https://vegansexplore.com';
async function cards(p,off=150){await p.waitForSelector('.rank-card',{timeout:15000}).catch(()=>{});const b=await p.locator('.rank-card').first().boundingBox().catch(()=>null);if(b)await p.evaluate(([y,o])=>scrollBy(0,y-o),[b.y,off]);}
async function down(p,y){await p.waitForTimeout(2000);await p.evaluate(y=>scrollBy(0,y),y);}
const SH={
 media_top:{u:W+'/media'},
 media_feat:{u:W+'/media',f:p=>cards(p,160)},
 media_top12:{u:W+'/media',f:async p=>{await p.waitForTimeout(2500);const t=p.getByText(/top 12|Voted by members|Most voted/i).first();const b=await t.boundingBox().catch(()=>null);if(b)await p.evaluate(y=>scrollBy(0,y-140),b.y);else await p.evaluate(()=>scrollBy(0,1400));}},
 show:{u:W+'/directory/vegans-explore-podcast'},
 episodes:{u:W+'/directory/vegans-explore-podcast',f:async p=>{await p.waitForTimeout(3000);const t=p.getByText(/^Episodes$/).first();const b=await t.boundingBox().catch(()=>null);if(b)await p.evaluate(y=>scrollBy(0,y-120),b.y);else await p.evaluate(()=>scrollBy(0,900));}},
 playing:{u:W+'/directory/vegans-explore-podcast',f:async p=>{await p.waitForTimeout(3000);const pl=p.getByRole('button',{name:/^Play/}).first();await pl.scrollIntoViewIfNeeded().catch(()=>{});await pl.click().catch(e=>console.log(' noplay'));await p.waitForTimeout(1500);const d=p.locator('.vep-dock').first();const b=await d.boundingBox().catch(()=>null);if(b)await p.evaluate(y=>scrollBy(0,y-120),b.y);}},
 docs:{u:W+'/media?type=documentaries',f:p=>cards(p,160)},
 doc_page:{u:W+'/directory/dominion'},
 books:{u:W+'/media?type=books',f:p=>cards(p,160)},
 book_page:{u:W+'/directory/pre-vegans-by-sean-russell',f:p=>down(p,200)},
 network:{u:W+'/media/network'},
 saves_vote:{u:W+'/media',f:p=>cards(p,60)},
 feedback:{u:W+'/media',f:async p=>{await p.waitForTimeout(1500);await p.evaluate(()=>window.VEFeedback&&VEFeedback.open&&VEFeedback.open({form:true}));}},
 survey:{u:W+'/survey?s=explorer'},
 passport_over:{u:W+'/passport',f:p=>down(p,560)},
 points_page:{u:W+'/passport#/points',f:p=>down(p,480)},
 points2:{u:W+'/passport#/points',f:p=>down(p,1100)},
 paths:{u:W+'/paths',f:p=>down(p,420)},
 guides:{u:W+'/guides',f:p=>down(p,380)},
};
(async()=>{const b=await chromium.launch();const only=process.argv.slice(2);
for(const [n,s] of Object.entries(SH)){ if(only.length&&!only.includes(n))continue;
 const c=await b.newContext({viewport:{width:390,height:703},deviceScaleFactor:3,isMobile:true,hasTouch:true});const p=await c.newPage();
 try{await p.goto(s.u,{waitUntil:'networkidle',timeout:45000});await p.addStyleTag({content:'#ve-install,.vei{display:none!important}'});await p.waitForTimeout(1800);
 if(s.f)await s.f(p);await p.waitForTimeout(1200);
 await p.screenshot({path:`cap/${n}.png`});console.log('ok',n);}catch(e){console.log('ERR',n,e.message.slice(0,120));}
 await c.close();}
await b.close();})();
