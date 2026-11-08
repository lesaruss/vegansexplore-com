// v3 captures: phone viewport 390x703 (screen minus status bar), 3x, clock at Tue 12:30 PM Eastern, the Sample bar hidden.
const {chromium}=require('playwright');
const S='https://vegansexplore.com/business/sample/site', W='https://vegansexplore.com';
const txt=(p,t)=>p.getByText(t,{exact:false}).first();
async function at(p,t,off=90){const el=txt(p,t);await el.scrollIntoViewIfNeeded();await p.evaluate(([y,off])=>window.scrollBy(0,y-off),[ (await el.boundingBox()).y, off]);}
const SH={
 hero:{u:S+'#/'},
 today:{u:S+'#/',f:async p=>at(p,'Open now',96)},
 fav:{u:S+'?as=member#/',f:async p=>{const h=p.locator('#favRail button').first();await h.click().catch(()=>{});await p.waitForTimeout(500);await at(p,'What people come back',116);}},
 story:{u:S+'#/',f:async p=>at(p,'Our story',96)},
 dish:{u:S+'#/menu/0-0',f:async p=>p.evaluate(()=>scrollTo(0,95))},
 ing:{u:S+'#/menu/0-0',f:async p=>at(p,"What's in it, and where",96)},
 signin:{u:S+'#/signin'},
 msaved:{u:S+'?as=member#/menu/0-0',f:async p=>{await at(p,'Breakfast, all day',330);const v=p.locator('main button, #site button').filter({hasText:/^\s*\d+\s*$/}).first();await v.click().catch(e=>console.log('novote'));await p.getByRole('button',{name:/^Save/}).first().click().catch(e=>console.log('nosave'));}},
 obar:{u:S+'?as=owner#/menu/0-0'},
 osearch:{u:S+'?as=owner#/menu/0-0',f:async p=>{const i=p.getByPlaceholder(/Search brands/);await i.scrollIntoViewIfNeeded();await i.fill('tofu');await p.waitForTimeout(1500);await at(p,'Add a brand',96).catch(async()=>{const bb=await i.boundingBox();await p.evaluate(y=>scrollBy(0,y-200),bb.y);});}},
 order:{u:S+'#/order',f:async p=>{const a=p.getByRole('button',{name:'Add'});await a.nth(0).click();await a.nth(0).click();await a.nth(1).click();await at(p,'Order for pickup',110);}},
 cart:{u:S+'#/order',f:async p=>{const a=p.getByRole('button',{name:'Add'});await a.nth(0).click();await a.nth(1).click();await at(p,'Your order',30);}},
 brand:{u:W+'/business/sample/brand#colors'},
 listing:{u:W+'/business/sample'},
 ctop:{u:S+'?as=member#/community',f:async p=>p.evaluate(()=>scrollTo(0,80))},
 cookie:{u:S+'?as=member#/community',f:async p=>at(p,'A free cookie with any bowl',260)},
 chef:{u:S+'?as=member#/community',f:async p=>at(p,"A seat at the chef",280)},
 code:{u:S+'?as=member#/community',f:async p=>{await at(p,'A free cookie with any bowl',260);await p.getByRole('button',{name:/Unlock for 250/}).first().click();await p.waitForTimeout(800);await at(p,'A free cookie with any bowl',260);}},
 club:{u:S+'?as=member#/community',f:async p=>at(p,'A Guide on Vegans Explore',96)},
 tour:{u:W+'/business/sample/tour'},
 hero_island:{u:S+'?look=island#/'}, hero_night:{u:S+'?look=night#/'},
};
(async()=>{const b=await chromium.launch();const only=process.argv.slice(2);
for(const [n,s] of Object.entries(SH)){ if(only.length&&!only.includes(n))continue;
 const c=await b.newContext({viewport:{width:390,height:703},deviceScaleFactor:3,isMobile:true,hasTouch:true});const p=await c.newPage();
 await p.clock.setFixedTime(new Date('2026-11-10T17:30:00Z'));
 p.on('pageerror',e=>console.log(n,'ERR',e.message));
 try{await p.goto(s.u,{waitUntil:'networkidle'});await p.addStyleTag({content:'#sampleBar{display:none!important}'});await p.waitForTimeout(900);
 if(s.f)await s.f(p);
 await p.waitForTimeout(700);await p.evaluate(async()=>{for(const i of document.images){i.loading='eager';}await Promise.all([...document.images].filter(i=>!i.complete).map(i=>new Promise(r=>{i.onload=i.onerror=r;setTimeout(r,4000)})))});
 await p.waitForTimeout(1200);await p.screenshot({path:'cap/'+n+'.png'});console.log('ok',n);}catch(e){console.log('FAIL',n,e.message.split('\n')[0]);}
 await c.close();}
await b.close()})();
