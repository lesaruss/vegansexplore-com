const {chromium}=require('playwright');const W='https://vegansexplore.com';
async function tiles(p,off=150){await p.waitForTimeout(2500);const l=p.locator('.vev-tile, .vev-card, .vev-item, [class*="vev-"] a').first();const b=await l.boundingBox().catch(()=>null);if(b)await p.evaluate(([y,o])=>scrollBy(0,y-o),[b.y,off]);else await p.evaluate(()=>scrollBy(0,330));}
const SH={
 events_top:{u:W+'/events'},
 events_list:{u:W+'/events',f:p=>tiles(p)},
 events_sf:{u:W+'/events?city=south-florida',f:p=>tiles(p)},
 events_filter:{u:W+'/events',f:async p=>{await p.waitForTimeout(2000);const f=p.locator('.vev-fbtn').first();await f.click().catch(e=>console.log('nofilter'));await p.waitForTimeout(800);}},
 events_london:{u:W+'/events?city=london',f:p=>tiles(p)},
 event_one:{u:W+'/events',f:async p=>{await p.waitForTimeout(2500);const a=p.locator('a[href*="event="]').first();const h=await a.getAttribute('href').catch(()=>null);console.log(' ev',h);if(h){await p.goto(new URL(h,W).href,{waitUntil:'networkidle'});await p.waitForTimeout(2500);}}},
 event_going:{u:W+'/events',f:async p=>{await p.waitForTimeout(2500);const a=p.locator('a[href*="event="]').first();const h=await a.getAttribute('href').catch(()=>null);if(h){await p.goto(new URL(h,W).href,{waitUntil:'networkidle'});await p.waitForTimeout(2500);const g=p.getByText(/I'm going|Are you running/).first();await g.scrollIntoViewIfNeeded().catch(()=>{});const bb=await g.boundingBox().catch(()=>null);if(bb)await p.evaluate(y=>scrollBy(0,y-200),bb.y);}}},
 tickets:{u:W+'/events?event=3f6a7e2e-efff-4b0e-80ce-580428d3cb52'},
 tickets_rsvp:{u:W+'/events?event=3f6a7e2e-efff-4b0e-80ce-580428d3cb52',f:async p=>{await p.waitForTimeout(2500);const g=p.getByText(/Get tickets|going|Are you running/i).first();await g.scrollIntoViewIfNeeded().catch(()=>{});const bb=await g.boundingBox().catch(()=>null);if(bb)await p.evaluate(y=>scrollBy(0,y-160),bb.y);else await p.evaluate(()=>scrollBy(0,520));}},
 claim:{u:W+'/events?event=3f6a7e2e-efff-4b0e-80ce-580428d3cb52',f:async p=>{await p.waitForTimeout(2500);const g=p.getByText(/Are you running this event/i).first();await g.scrollIntoViewIfNeeded().catch(()=>console.log('noclaim'));const bb=await g.boundingBox().catch(()=>null);if(bb)await p.evaluate(y=>scrollBy(0,y-160),bb.y);}},
 submit:{u:W+'/events#submit/1'},
 events_guide:{u:W+'/guides/vegan-events-guide'},
 feedback:{u:W+'/events',f:async p=>{await p.waitForTimeout(1500);await p.evaluate(()=>window.VEFeedback&&VEFeedback.open&&VEFeedback.open({form:true}));}},
 survey:{u:W+'/survey?s=explorer'},
};
(async()=>{const b=await chromium.launch();const only=process.argv.slice(2);
for(const [n,s] of Object.entries(SH)){ if(only.length&&!only.includes(n))continue;
 const c=await b.newContext({viewport:{width:390,height:703},deviceScaleFactor:3,isMobile:true,hasTouch:true});const p=await c.newPage();
 try{await p.goto(s.u,{waitUntil:'networkidle',timeout:45000});await p.addStyleTag({content:'#ve-install,.vei{display:none!important}'});await p.waitForTimeout(1800);
 if(s.f)await s.f(p);await p.waitForTimeout(1200);
 await p.screenshot({path:`cap/${n}.png`});console.log('ok',n);}catch(e){console.log('ERR',n,e.message.slice(0,120));}
 await c.close();}
await b.close();})();
