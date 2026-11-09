/* The Sample sponsor's 2027 End of Year Report, rebuilt (Sean, 2026-11-09: "could we have it sorted by quarter and show the events listed
 * in each quarter? ... they need to be real events that we have so they can see the sponsorship opportunity instead of it being bullets ...
 * a sponsor that decided to go and do the full package of everything that we can do ... customized to what we've known about the client ...
 * it's end of 2027 and it never happened, but this is what we are positioned to do").
 * Template gate: the page is a copy of /mocks/nominate/index.html (the first standalone copy of passport.html?guide=welcome) and this file
 * follows /mocks/nominate/guide.js and guide-scripts/welcome-guide.js: head, crumb, the Getting started card, artRow, sectionPage (How to
 * use this page, the parts as rows, one See it for yourself call to action), the rail's Back / N of M / Next, the numbered dropdown menu
 * when there are more than 5 tabs (html.dg-dd).
 * Views (every view is a link): #/ Overview, #/goals, #/campaigns(/all|q1..q4), #/event/<id>(/results|seen|presented|opportunity),
 * #/pulse, #/podcast, #/banners, #/dashboard(/year|q1..q4|m1..m12), #/package.
 * The sponsor is the made-up Visit Marisol Bay, the presenting sponsor of the sample hub (/communities/sample, public/ve-hubs.js
 * VE_SAMPLE_HUB). The last section, "What we can do for you", speaks to the visitor, not the sample sponsor (the brief
 * lesaruss-hq docs/research/briefs/2026-visit-lauderdale-alignment.md); no real organization is named. Every number is a made-up sample
 * result for 2027, and every total on the page is added up from the rows below, so the numbers always agree. Prices are our rate card
 * (canon canon-ve-sponsor-rate-card v1); outside market rates are not shown (not confirmed yet). Real cities appear only as places.
 * V walks it (canon: V narrates BrandDesk). Her lines are TEXT DRAFTS for Sean: nothing is recorded and nothing plays.
 */
(function () {
  var PIC = '/public/guides/', IMG = '/sponsors/sample/img/', BIZ = '/business/sample/img/', V_PIC = '/business/sample/img/v-tour.jpg';
  var HUB = '/communities/sample';

  var CSS = [
    '.dg-top{background-image:linear-gradient(120deg,rgba(6,24,34,0.92) 0%,rgba(11,79,108,0.78) 50%,rgba(11,79,108,0.45) 100%),url("/business/sample/img/s-outside-dusk.webp");background-position:center 55%;}',
    '.nm-mock{margin:0;background:#FFF7EC;color:#5a3a00;border-bottom:1px solid #f5d9b0;font-size:12px;font-weight:600;padding:8px 40px;}',
    '.nm-mock b{font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#b45309;border:2px solid #b45309;border-radius:6px;padding:1px 7px;margin-right:8px;}',
    '.dg-joinbox a.dg-btn{text-decoration:none;}',
    // V's Play slot says Coming (her lines are drafts). Talk to <Guide> (ve-page-guide.js) has no V yet, so it would say Liz: hidden here.
    '.dg-play.sr-coming{background:#fff;border:1.5px dashed rgba(0,0,0,.2);color:rgba(26,26,26,.6);cursor:default;}',
    '#dgRail .vepg-talk{display:none !important;}',
    '.sr-tag{display:inline-block;vertical-align:middle;margin-left:10px;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#b45309;background:#fff;border:2px solid #b45309;border-radius:6px;padding:1px 7px;}',
    // The year at a glance and each page's numbers: tiles four across, full width.
    '.sr-stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(200px,100%),1fr));gap:12px;margin:0 0 22px;}',
    '.sr-stat{border:1px solid var(--line);border-radius:12px;padding:14px 16px;background:#fff;}',
    '.sr-stat b{display:block;font-size:26px;font-weight:900;letter-spacing:-.01em;line-height:1.1;color:var(--ink);}',
    '.sr-stat span{display:block;margin-top:6px;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--ink55);}',
    '.sr-stat small{display:block;margin-top:6px;font-size:12.5px;font-weight:700;color:var(--g);line-height:1.4;}',
    '.sr-stat.hi{background:var(--gl);border-color:var(--gm);}',
    // Tables: dates and numbers, one row each.
    '.sr-tw{overflow-x:auto;border:1px solid var(--line);border-radius:12px;margin:0 0 22px;}',
    '.sr-t{width:100%;border-collapse:collapse;font-size:13.5px;}',
    '.sr-t th{text-align:left;font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--ink55);padding:10px 12px;border-bottom:1px solid var(--line);background:#fafcfa;white-space:nowrap;}',
    '.sr-t td{padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top;color:var(--ink75);}',
    '.sr-t td b{color:var(--ink);}',
    '.sr-t tr:last-child td{border-bottom:0;}',
    '.sr-t .n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;}',
    '.sr-t tfoot td{font-weight:900;color:var(--ink);background:#fafcfa;border-top:1px solid var(--line);}',
    '.sr-t a{color:var(--g);font-weight:800;text-decoration:none;}',
    // Snapshots of the live demo placements, and drawn mocks where there is no live placement.
    '.sr-snaps{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(360px,100%),1fr));gap:16px;margin:0 0 22px;}',
    '.sr-snap{margin:0;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff;display:flex;flex-direction:column;}',
    '.sr-snap.wide{grid-column:1/-1;}',
    '.sr-snap .sr-shot{background:#f6f8f6;display:flex;align-items:center;justify-content:center;padding:14px;flex:1 1 auto;}',
    '.sr-snap img{display:block;max-width:100%;height:auto;border-radius:8px;box-shadow:0 1px 6px rgba(0,0,0,.08);}',
    '.sr-snap.tall img{max-height:420px;width:auto;}',
    '.sr-snap figcaption{padding:10px 14px 12px;font-size:13px;line-height:1.5;color:var(--ink75);border-top:1px solid var(--line);}',
    '.sr-snap figcaption b{display:block;color:var(--ink);font-size:14px;margin-bottom:2px;}',
    '.sr-snap figcaption a{color:var(--g);font-weight:800;text-decoration:none;}',
    '.sr-mk{position:relative;width:100%;border-radius:10px;overflow:hidden;}',
    '.sr-snap.wide .sr-booth{max-width:640px;}',
    '.sr-stamp{position:absolute;top:10px;right:10px;z-index:2;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#b45309;background:#fff;border:2px solid #b45309;border-radius:6px;padding:1px 7px;}',
    // The sponsor's text logo, as on the hub (VE_SAMPLE_HUB.sponsors.presenting.logo).
    '.sr-logo{display:inline-flex;flex-direction:column;background:#0b4f6c;color:#fff;border-radius:6px;padding:8px 14px;line-height:1.05;}',
    '.sr-logo b{font-size:18px;font-weight:900;}.sr-logo i{font-style:normal;font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#ffd166;margin-top:3px;}',
    '.sr-logo.sm b{font-size:13px;}.sr-logo.sm{padding:6px 10px;}',
    // Drawn mock: the Expo booth.
    '.sr-booth{background:linear-gradient(#eaf3f7 0 62%,#d9cbb3 62% 100%);aspect-ratio:16/10;}',
    '.sr-booth .bk{position:absolute;left:8%;right:8%;top:8%;height:52%;background:#0b4f6c;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;}',
    '.sr-booth .bk small{font-size:10px;font-weight:800;letter-spacing:.2em;color:#ffd166;text-transform:uppercase;}',
    '.sr-booth .bk b{font-size:clamp(18px,2.4vw,28px);font-weight:900;margin:4px 0;}',
    '.sr-booth .bk span{font-size:12px;font-weight:700;color:#d8eef6;}',
    '.sr-booth .sun{position:absolute;right:10%;top:16%;width:56px;height:56px;border-radius:50%;background:#ffd166;opacity:.9;}',
    '.sr-booth .tb{position:absolute;left:14%;right:14%;bottom:10%;height:24%;background:#ffd166;border-radius:6px 6px 0 0;display:flex;align-items:center;justify-content:center;gap:12px;font-size:12px;font-weight:900;color:#0b4f6c;text-transform:uppercase;letter-spacing:.08em;}',
    '.sr-booth .qr{width:38px;height:38px;background:repeating-conic-gradient(#0b4f6c 0 25%,#fff 0 50%) 0 0/10px 10px;border:3px solid #fff;border-radius:3px;}',
    '.sr-booth .ve{position:absolute;left:10px;bottom:8px;font-size:9.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#5b4a2e;}',
    // Drawn mock: the VegFest Media Corner backdrop.
    '.sr-corner{background:#f4f1ea;aspect-ratio:16/10;padding:14px;}',
    '.sr-corner .wall{position:absolute;inset:8% 6% 30% 6%;background:#fff;border:1px solid #e3ded2;border-radius:6px;display:grid;grid-template-columns:repeat(4,1fr);align-items:center;justify-items:center;gap:6px;padding:10px;}',
    '.sr-corner .wall i{font-style:normal;font-size:clamp(9px,1vw,11px);font-weight:900;letter-spacing:.04em;text-align:center;line-height:1.1;}',
    '.sr-corner .wall i.a{color:#1f5f22;}.sr-corner .wall i.b{color:#0b4f6c;}',
    '.sr-corner .floor{position:absolute;left:0;right:0;bottom:0;height:30%;background:#cdbf9f;}',
    '.sr-corner .st{position:absolute;bottom:12%;width:44px;height:30%;border-left:4px solid #3b3b3b;border-right:4px solid #3b3b3b;}',
    '.sr-corner .st::before{content:"";position:absolute;left:-10px;right:-10px;top:0;height:8px;border-radius:4px;background:#1f5f22;}',
    '.sr-corner .st.l{left:32%;}.sr-corner .st.r{right:32%;}',
    '.sr-corner .sign{position:absolute;left:50%;transform:translateX(-50%);bottom:6%;background:#1f5f22;color:#fff;font-size:10px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;padding:5px 10px;border-radius:6px;white-space:nowrap;}',
    // Drawn mock: the podcast episode with its sponsor read.
    '.sr-pod{display:grid;grid-template-columns:120px minmax(0,1fr);gap:14px;align-items:start;background:#fff;padding:14px;text-align:left;}',
    '.sr-pod .art{aspect-ratio:1;border-radius:10px;background:linear-gradient(140deg,#1f5f22,#0e7490);color:#fff;display:flex;flex-direction:column;justify-content:flex-end;padding:10px;}',
    '.sr-pod .art b{font-size:17px;font-weight:900;line-height:1;}.sr-pod .art small{font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#c5f2c7;margin-top:4px;}',
    '.sr-pod h4{margin:0 0 4px;font-size:15px;font-weight:900;}',
    '.sr-pod p{margin:0 0 8px;font-size:13px;line-height:1.5;color:var(--ink75);}',
    '.sr-read{overflow-wrap:anywhere;border-left:4px solid #0b4f6c;background:#eef6f9;border-radius:0 10px 10px 0;padding:10px 12px;font-size:13.5px;line-height:1.55;color:#123;}',
    '.sr-read small{display:block;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#0b4f6c;margin-bottom:4px;}',
    '.sr-soon{display:inline-flex;align-items:center;gap:8px;margin-top:10px;font-size:12px;font-weight:800;color:var(--ink55);border:1.5px dashed var(--line);border-radius:6px;padding:7px 12px;}',
    // The traffic chart: one series (tracked clicks a month), bars from the baseline, a label on the top month only, a tooltip on hover.
    '.sr-chart{border:1px solid var(--line);border-radius:12px;padding:16px 16px 10px;margin:0 0 22px;background:#fff;}',
    '.sr-chart h4{margin:0 0 2px;font-size:15px;font-weight:900;}.sr-chart p{margin:0 0 12px;font-size:12.5px;color:var(--ink55);}',
    '.sr-bars{position:relative;display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:2px;align-items:end;height:200px;border-bottom:1px solid #cfd8cf;background:linear-gradient(#eef2ee 1px,transparent 1px) 0 0/100% 50px;}',
    '.sr-bar{position:relative;height:100%;display:flex;align-items:flex-end;justify-content:center;text-decoration:none;}',
    '.sr-bar i{display:block;width:min(36px,70%);background:#2e7d32;border-radius:4px 4px 0 0;min-height:2px;}',
    '.sr-bar:hover i,.sr-bar:focus-visible i{background:#1f5f22;}',
    '.sr-bar em{position:absolute;bottom:calc(var(--h) + 4px);font-style:normal;font-size:11px;font-weight:800;color:var(--ink);white-space:nowrap;}',
    '.sr-bar .tip{display:none;position:absolute;bottom:calc(var(--h) + 8px);left:50%;transform:translateX(-50%);z-index:3;background:#1a1a1a;color:#fff;font-size:11.5px;font-weight:700;line-height:1.35;padding:6px 9px;border-radius:6px;white-space:nowrap;pointer-events:none;}',
    '.sr-bar:hover .tip,.sr-bar:focus-visible .tip{display:block;}.sr-bar:hover em,.sr-bar:focus-visible em{visibility:hidden;}',
    '.sr-xl{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:2px;margin-top:6px;font-size:11px;font-weight:700;color:var(--ink55);text-align:center;}',
    // The report list: quarters four across, then the months.
    '.sr-reps{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(220px,100%),1fr));gap:12px;margin:0 0 14px;}',
    '.sr-rep{display:block;border:1px solid var(--line);border-radius:12px;padding:14px 16px;background:#fff;color:inherit;text-decoration:none;transition:border-color .15s;}',
    '.sr-rep:hover{border-color:var(--g2);}',
    '.sr-rep small{display:block;font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--g);}',
    '.sr-rep b{display:block;font-size:17px;font-weight:900;margin:4px 0;}',
    '.sr-rep span{display:block;font-size:12.5px;color:var(--ink75);line-height:1.45;}',
    '.sr-months{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(150px,100%),1fr));gap:8px;margin:0 0 22px;}',
    '.sr-months a{display:block;border:1px solid var(--line);border-radius:6px;padding:9px 12px;font-size:13px;font-weight:800;color:var(--ink);text-decoration:none;}',
    '.sr-months a span{display:block;font-size:11.5px;font-weight:600;color:var(--ink55);}',
    '.sr-months a:hover{border-color:var(--g2);}',
    '.sr-months a.hi{background:var(--gl);border-color:var(--gm);}',
    '.sr-note{font-size:12.5px;color:var(--ink55);margin:-12px 0 22px;line-height:1.5;}',
    '@media (max-width:900px){.nm-mock{padding:8px 16px;}.sr-bars{height:160px;}.sr-bar em{font-size:9.5px;}.sr-xl{font-size:9.5px;}.sr-pod{grid-template-columns:84px minmax(0,1fr);}.sr-snap.tall img{max-height:340px;}}',
    '@media (max-width:560px){.sr-pod{padding-top:40px;}.sr-t{font-size:12.5px;}.sr-t th,.sr-t td{padding:8px;}.sr-stat b{font-size:22px;}.sr-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}.sr-stat{padding:12px;}.sr-stat span{font-size:10px;letter-spacing:.06em;}}',
    // Tabs inside a page (the quarters on Campaigns, the four tabs on an event): links, so each is its own address. 6px corners.
    '.sr-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 20px;padding:0 0 12px;border-bottom:1px solid var(--line);}',
    '.sr-tabs a{display:inline-flex;align-items:center;min-height:40px;padding:8px 16px;border-radius:6px;border:1.5px solid var(--line);background:#fff;color:var(--ink);font-size:13px;font-weight:800;text-decoration:none;}',
    '.sr-tabs a:hover{border-color:var(--g2);}',
    '.sr-tabs a[aria-current="page"]{background:var(--g);border-color:var(--g);color:#fff;}',
    // The event header: name, date and city on the left, the switcher dropdown in the top right (claim.html's select rule).
    '.sr-evhead{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:12px 24px;margin-bottom:14px;}',
    '.sr-evhead .dg-head{margin-bottom:0;}',
    '.sr-evline{margin:6px 0 0;font-size:14px;font-weight:700;color:var(--ink75);}',
    '.sr-pick{display:flex;flex-direction:column;gap:6px;min-width:min(320px,100%);}',
    '.sr-pick span{font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--ink55);}',
    '.sr-pick select{min-height:46px;-webkit-appearance:none;-moz-appearance:none;appearance:none;padding:10px 46px 10px 14px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:800;color:var(--ink);border:1.5px solid var(--line);border-radius:6px;background:#fff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\' viewBox=\'0 0 10 6\'%3E%3Cpath d=\'M1 1l4 4 4-4\' fill=\'none\' stroke=\'%23525252\' stroke-width=\'1.6\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E") no-repeat right 16px center/10px 6px;}',
    '.sr-pick select::-ms-expand{display:none;}',
    // The campaign cards: two across on desktop, one on phones. A picture, the date and city, the headline result.
    '.sr-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(360px,100%),1fr));gap:16px;margin:0 0 22px;}',
    '.sr-card{position:relative;display:flex;flex-direction:column;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff;color:inherit;text-decoration:none;transition:border-color .15s,box-shadow .15s;}',
    '.sr-card:hover{border-color:var(--g2);box-shadow:0 4px 18px rgba(0,0,0,.06);}',
    '.sr-card .pic{position:relative;aspect-ratio:16/8;background:#eef2ee center/cover no-repeat;}',
    '.sr-card .b{padding:14px 16px 16px;display:flex;flex-direction:column;gap:4px;flex:1 1 auto;}',
    '.sr-card small{font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--g);}',
    '.sr-card b{font-size:17px;font-weight:900;line-height:1.25;}',
    '.sr-card p{margin:2px 0 0;font-size:13.5px;line-height:1.5;color:var(--ink75);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
    '.sr-card em{margin-top:auto;padding-top:8px;font-style:normal;font-size:12px;font-weight:800;color:var(--g);}',
    '.sr-qh{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 14px;margin:6px 0 12px;}',
    '.sr-qh h4{margin:0;font-size:18px;font-weight:900;}.sr-qh span{font-size:13px;font-weight:700;color:var(--ink55);}',
    // The insight line under an event's numbers.
    '.sr-insight{border-left:4px solid var(--g);background:var(--gl);border-radius:0 12px 12px 0;padding:12px 16px;margin:0 0 22px;font-size:14.5px;line-height:1.55;color:var(--ink);}',
    '.sr-insight small{display:block;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:var(--g);margin-bottom:4px;}',
    // The goals: what we learned, then the campaign that answers it.
    '.sr-goals{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(360px,100%),1fr));gap:16px;margin:0 0 22px;}',
    '.sr-goal{border:1px solid var(--line);border-radius:12px;background:#fff;padding:16px 18px;display:flex;flex-direction:column;gap:8px;}',
    '.sr-goal small{font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#b45309;}',
    '.sr-goal b{font-size:16px;font-weight:900;line-height:1.3;}',
    '.sr-goal p{margin:0;font-size:13.5px;line-height:1.55;color:var(--ink75);}',
    '.sr-goal .ans{margin-top:auto;border-top:1px solid var(--line);padding-top:10px;font-size:13.5px;line-height:1.55;color:var(--ink);}',
    '.sr-goal .ans i{display:block;font-style:normal;font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--g);margin-bottom:3px;}',
    '.sr-goal .ans a{color:var(--g);font-weight:800;text-decoration:none;}',
    '.sr-why{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr));gap:12px;margin:0 0 22px;}',
    '.sr-why a,.sr-why div{display:block;border:1px solid var(--line);border-radius:12px;padding:14px 16px;background:#fff;color:inherit;text-decoration:none;}',
    '.sr-why a:hover{border-color:var(--g2);}',
    '.sr-why b{display:block;font-size:15px;font-weight:900;margin-bottom:4px;}.sr-why span{display:block;font-size:13px;line-height:1.5;color:var(--ink75);}',
    '.sr-why cite{display:block;margin-top:6px;font-style:normal;font-size:11px;font-weight:800;color:var(--ink55);}',
    '.sr-why .big{font-size:26px;}',
    // The price box on an event's Opportunity tab, and the package card on the Overview.
    '.sr-price{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 24px;align-items:center;border:1.5px solid var(--gm);background:var(--gl);border-radius:12px;padding:16px 18px;margin:0 0 22px;}',
    '.sr-price b{font-size:17px;font-weight:900;}.sr-price p{margin:2px 0 0;font-size:13.5px;line-height:1.5;color:var(--ink75);}',
    '.sr-price strong{font-size:30px;font-weight:900;color:var(--g);white-space:nowrap;text-align:right;}',
    '.sr-price strong small{display:block;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--ink55);}',
    '.sr-inc{list-style:none;margin:0 0 22px;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(360px,100%),1fr));gap:10px;}',
    '.sr-inc li{border:1px solid var(--line);border-radius:12px;padding:12px 14px 12px 40px;position:relative;font-size:13.5px;line-height:1.5;color:var(--ink75);background:#fff;}',
    '.sr-inc li::before{content:"";position:absolute;left:14px;top:15px;width:14px;height:14px;border-radius:50%;background:var(--g) url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 14 14\'%3E%3Cpath d=\'M3.5 7.2l2.3 2.3 4.7-4.9\' fill=\'none\' stroke=\'%23fff\' stroke-width=\'1.8\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E") center/14px 14px no-repeat;}',
    '.sr-inc li b{color:var(--ink);}',
    '.sr-pkg{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px 24px;align-items:center;border:1.5px solid #0b4f6c;border-radius:12px;padding:16px 18px;margin:0 0 22px;background:#eef6f9;}',
    '.sr-pkg small{display:block;font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#0b4f6c;}',
    '.sr-pkg b{display:block;font-size:19px;font-weight:900;margin:2px 0 4px;}.sr-pkg p{margin:0;font-size:13.5px;line-height:1.5;color:var(--ink75);}',
    '.sr-pkg .dg-btn{background:#0b4f6c;color:#fff;}',
    // Drawn mocks: the sign at a community event, the Gala stage, a social post.
    '.sr-signm{background:linear-gradient(#f3efe6 0 70%,#c9b48f 70% 100%);aspect-ratio:16/10;}',
    '.sr-signm .bd{position:absolute;left:50%;top:10%;transform:translateX(-50%);width:min(78%,440px);background:#1f5f22;color:#fff;border-radius:8px;padding:14px 16px;text-align:center;}',
    '.sr-signm .bd small{display:block;font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#c5f2c7;}',
    '.sr-signm .bd b{display:block;font-size:clamp(16px,2vw,24px);font-weight:900;margin:4px 0 8px;}',
    '.sr-signm .tbl{position:absolute;left:18%;right:18%;bottom:12%;height:22%;background:#fff;border-radius:6px 6px 0 0;display:flex;align-items:center;justify-content:center;gap:10px;font-size:11px;font-weight:900;color:#0b4f6c;text-transform:uppercase;letter-spacing:.08em;}',
    '.sr-signm .qr,.sr-gala .qr{width:34px;height:34px;background:repeating-conic-gradient(#0b4f6c 0 25%,#fff 0 50%) 0 0/9px 9px;border:3px solid #fff;border-radius:3px;}',
    '.sr-gala{background:radial-gradient(ellipse at 50% 0,#3b2a5a 0,#120d1f 70%);aspect-ratio:16/10;}',
    '.sr-gala .st{position:absolute;left:8%;right:8%;top:12%;height:50%;border:2px solid #ffd166;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fff;}',
    '.sr-gala .st small{font-size:10px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:#ffd166;}',
    '.sr-gala .st b{font-size:clamp(18px,2.4vw,30px);font-weight:900;margin:4px 0;}',
    '.sr-gala .st span{font-size:12px;font-weight:700;color:#e9ddff;}',
    '.sr-gala .tb{position:absolute;bottom:10%;width:16%;height:16%;border-radius:50%;background:#2a2040;border:2px solid #ffd166;}',
    '.sr-gala .tb.a{left:12%;}.sr-gala .tb.b{left:42%;}.sr-gala .tb.c{left:72%;}',
    '.sr-ig{background:#fff;width:min(100%,340px);border:1px solid var(--line);border-radius:10px;text-align:left;}',
    '.sr-ig .top{display:flex;align-items:center;gap:8px;padding:10px 12px;font-size:12px;font-weight:800;}',
    '.sr-ig .top i{width:26px;height:26px;border-radius:50%;background:#1f5f22;display:inline-block;}',
    '.sr-ig .top span{display:block;font-size:10.5px;font-weight:600;color:var(--ink55);}',
    '.sr-ig .ph{aspect-ratio:1;background:#eef2ee center/cover no-repeat;}',
    '.sr-ig .cap{padding:10px 12px 12px;font-size:12.5px;line-height:1.45;color:var(--ink75);}',
    '.sr-ig .cap b{color:var(--ink);}',
    '@media (max-width:760px){.sr-evhead{grid-template-columns:1fr;}}','@media (max-width:560px){.sr-pick{width:100%;}.sr-price,.sr-pkg{grid-template-columns:1fr;}.sr-price strong{text-align:left;}.sr-tabs a{padding:8px 12px;font-size:12.5px;}.sr-card .pic{aspect-ratio:16/9;}}'
  ].join('');
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function n(x) { return Math.round(x).toLocaleString('en-US'); }
  function pct(a, b) { return (b ? (a / b * 100) : 0).toFixed(2) + '%'; }
  function sum(arr, f) { return arr.reduce(function (t, x) { return t + (f == null ? x : typeof f === 'function' ? f(x) : x[f]); }, 0); }
  var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function dt(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function mOf(iso) { return +iso.split('-')[1] - 1; }
  function day(iso, long) { var d = dt(iso); return (long ? DOW[d.getDay()] + ', ' : '') + MON[d.getMonth()].slice(0, long ? 99 : 3) + ' ' + d.getDate(); }

  function money(x) { return '$' + Math.round(x).toLocaleString('en-US'); }
  var EG = PIC + 'events-guide/';

  // ---------- the 2027 sample data (made up; every total on the page is added up from here) ----------
  // The 2027 calendar (locked by Sean, 2026-11-09). s = the series: mb (Vegans Explore Marisol Bay community events), feeder (community
  // events in the cities Marisol Bay's visitors come from), vf (VegFest Media Corners at Marisol Bay's own VegFest), expo (the World Vegan
  // Expo in Marisol Bay, with the Vegans Explore Gala). att = attendance, chk = check-ins at Marisol Bay businesses (mb: in the 30 days
  // after; feeder: by attendees within six months; vf and expo: that weekend), mem = new Vegans Explore members, vis = out-of-town visitors
  // (mb, vf, expo: guests who live outside Marisol Bay; feeder: attendees who then visited Marisol Bay, by trip code or check-in),
  // clk = tracked clicks from the event itself (its RSVP page and its QR trip code).
  var EVENTS = [
    { id: 'marisol-bay-1', s: 'mb', d: '2027-01-14', name: 'Vegans Explore Marisol Bay', sub: '#1, the 2027 kickoff', city: 'Marisol Bay', venue: 'Green Leaf Kitchen, Marisol Bay', pic: BIZ + 's-team.webp',
      att: 142, chk: 211, mem: 38, vis: 26, clk: 184,
      ins: 'The kickoff set the year\'s base line: 142 people, and the host\'s team said the 30 days after were their best January.' },
    { id: 'orlando', s: 'feeder', d: '2027-02-18', name: 'Vegans Explore Orlando', sub: 'A feeder-city community event', city: 'Orlando', hub: 'Central Florida', venue: 'a Vegan restaurant downtown', pic: '/communities/central-florida/banner.jpg',
      att: 156, chk: 68, mem: 47, vis: 29, clk: 214,
      ins: '29 Orlando guests made the drive to Marisol Bay within six months, most of them on a long weekend in March or April.' },
    { id: 'vegfest-spring', s: 'vf', d: '2027-03-13', name: 'VegFest Media Corner', sub: '#1, Marisol Bay spring VegFest', city: 'Marisol Bay', venue: 'Bayfront Park', pic: EG + 'still-vendors.jpg',
      att: 8200, chk: 312, mem: 186, vis: 620, clk: 780, iv: 16, clips: 38, views: 96000,
      ins: 'The clips kept working after the tents came down: two out of three views came in the six weeks after the festival.' },
    { id: 'tampa', s: 'feeder', d: '2027-04-22', name: 'Vegans Explore Tampa', sub: 'A feeder-city community event, Earth Day week', city: 'Tampa', hub: 'Central Florida', venue: 'a Vegan cafe in Seminole Heights', pic: EG + 'still-overview.jpg',
      att: 134, chk: 55, mem: 39, vis: 24, clk: 188,
      ins: 'Earth Day week drew a younger crowd: the most new members per guest of any feeder-city event.' },
    { id: 'marisol-bay-2', s: 'mb', d: '2027-05-20', name: 'Vegans Explore Marisol Bay', sub: '#2, the start of the slow season', city: 'Marisol Bay', venue: 'Tidepool Tacos, Marisol Beach', pic: BIZ + 's-outside-day.webp',
      att: 168, chk: 248, mem: 44, vis: 31, clk: 206,
      ins: 'Held as the slow season starts, it brought 248 check-ins to local businesses in the weeks hotels call quiet.' },
    { id: 'st-petersburg', s: 'feeder', d: '2027-06-17', name: 'Vegans Explore St. Petersburg', sub: 'A feeder-city community event', city: 'St. Petersburg', hub: 'Central Florida', venue: 'a Vegan bar on Central Avenue', pic: EG + 'still-join.jpg',
      att: 118, chk: 44, mem: 33, vis: 19, clk: 162,
      ins: 'The smallest room of the year, and still 19 guests came to Marisol Bay: a summer trip, most of them with friends.' },
    { id: 'marisol-bay-3', s: 'mb', d: '2027-07-15', name: 'Vegans Explore Marisol Bay', sub: '#3, summer supper on the harbor', city: 'Marisol Bay', venue: 'Mangrove & Mint, Port Marisol', pic: BIZ + 's-room-wide.webp',
      att: 176, chk: 262, mem: 41, vis: 34, clk: 221,
      ins: 'Summer guests from out of town stayed for the weekend: 34 came for the event, the most of any summer night on the bay.' },
    { id: 'atlanta', s: 'feeder', d: '2027-08-19', name: 'Vegans Explore Atlanta', sub: 'A feeder-city community event', city: 'Atlanta', hub: 'Atlanta', venue: 'a Vegan restaurant in Old Fourth Ward', pic: '/communities/atlanta/banner.jpg',
      att: 198, chk: 107, mem: 61, vis: 44, clk: 296,
      ins: 'Atlanta was the best feeder city of the year: 44 guests visited Marisol Bay, and many came back in October for the Expo.' },
    { id: 'marisol-bay-4', s: 'mb', d: '2027-09-16', name: 'Vegans Explore Marisol Bay', sub: '#4, the slowest month', city: 'Marisol Bay', venue: 'Seagrape Supper Club, Seagrape Key', pic: BIZ + 's-outside-night.webp',
      att: 214, chk: 323, mem: 57, vis: 49, clk: 268,
      ins: 'The biggest community event of the year landed in September, the slowest month: 323 check-ins when local businesses needed them most.' },
    { id: 'expo', s: 'expo', d: '2027-10-15', end: '2027-10-16', name: 'World Vegan Expo in Marisol Bay', sub: 'With the Vegans Explore Gala', city: 'Marisol Bay', venue: 'Marisol Bay Convention Center', pic: PIC + 'vegan-events-guide.jpg',
      att: 12400, chk: 1820, mem: 640, vis: 5210, clk: 1450, booth: 2860, leads: 1140, rooms: 3180, gala: 420, stage: 6,
      ins: '5,210 guests came from out of town for two days in October and booked 3,180 hotel room nights: Marisol Bay\'s biggest plant-based weekend.' },
    { id: 'vegfest-fall', s: 'vf', d: '2027-10-30', name: 'VegFest Media Corner', sub: '#2, Marisol Bay fall VegFest', city: 'Marisol Bay', venue: 'Bayfront Park', pic: EG + 'still-dayof.jpg',
      att: 9600, chk: 365, mem: 214, vis: 740, clk: 942, iv: 21, clips: 46, views: 128000,
      ins: 'Two weeks after the Expo, fall VegFest grew by 1,400 people over spring, and the Media Corner clips drew a third more views.' }
  ];
  var SERIES = {
    mb: { label: 'Vegans Explore Marisol Bay', many: 'Vegans Explore Marisol Bay community events', price: 2500, item: 'Community event, presenting sponsor',
      visL: 'Came from out of town', visS: 'Guests who live outside Marisol Bay', chkS: 'At Marisol Bay businesses, 30 days after' },
    feeder: { label: 'Feeder-city community events', many: 'Feeder-city community events', price: 2000, item: 'Feeder-city community event, presenting sponsor',
      visL: 'Visited Marisol Bay afterward', visS: 'Within six months, by trip code or check-in', chkS: 'Theirs, at Marisol Bay businesses' },
    vf: { label: 'VegFest Media Corners', many: 'VegFest Media Corners', price: 1500, item: 'VegFest Media Corner, presenting sponsor',
      visL: 'Out-of-town guests', visS: 'Who stopped at the Media Corner, by trip code', chkS: 'At Marisol Bay businesses that weekend' },
    expo: { label: 'World Vegan Expo', many: 'World Vegan Expo', price: 15000, item: 'World Vegan Expo presenting sponsor, with the Gala',
      visL: 'Out-of-town guests', visS: 'Who came to Marisol Bay for the Expo', chkS: 'At Marisol Bay businesses that weekend' }
  };
  function ev(id) { for (var i = 0; i < EVENTS.length; i++) if (EVENTS[i].id === id) return EVENTS[i]; return null; }
  function qOf(iso) { return Math.floor(mOf(iso) / 3) + 1; }
  function evTitle(e) { return e.s === 'mb' || e.s === 'vf' ? e.name + ' ' + e.sub.split(',')[0] : e.name; }

  // Daily Pulse sponsorship posts: date, the city's Pulse it ran in, title, reads, tracked clicks, the event it promoted (if any).
  var PULSE = [
    ['2027-01-07', 'Marisol Bay', 'Visit Marisol Bay\'s 2027 plant-based calendar is out', 3420, 128, ''],
    ['2027-01-12', 'Marisol Bay', 'Vegans Explore Marisol Bay kicks off 2027 on Thursday', 3880, 151, 'marisol-bay-1'],
    ['2027-01-28', 'Central Florida', 'Two hours south: a Vegan weekend in Marisol Bay', 2610, 104, ''],
    ['2027-02-11', 'Central Florida', 'Vegans Explore Orlando, presented by Visit Marisol Bay', 2930, 109, 'orlando'],
    ['2027-02-25', 'Atlanta', 'Trade the cold for the bay: a February escape', 2240, 92, ''],
    ['2027-03-08', 'Marisol Bay', 'Spring VegFest at Bayfront Park: meet us at the Media Corner', 4610, 186, 'vegfest-spring'],
    ['2027-03-25', 'South Florida', 'Five Marisol Bay patios for spring evenings', 3150, 117, ''],
    ['2027-04-15', 'Central Florida', 'Earth Day week: Vegans Explore Tampa, presented by Visit Marisol Bay', 2710, 101, 'tampa'],
    ['2027-04-29', 'Marisol Bay', 'A free shuttle for the plant-based weekend', 3560, 132, ''],
    ['2027-05-13', 'Marisol Bay', 'Tacos at sundown: Vegans Explore Marisol Bay opens the summer', 3720, 140, 'marisol-bay-2'],
    ['2027-05-27', 'Atlanta', 'A long weekend on the bay, planned for you', 2380, 96, ''],
    ['2027-06-10', 'Central Florida', 'Vegans Explore St. Petersburg is next Thursday', 2520, 94, 'st-petersburg'],
    ['2027-06-24', 'South Florida', 'Summer on the bay: where to eat after the beach', 3040, 113, ''],
    ['2027-07-08', 'Marisol Bay', 'Summer supper on the harbor, next Thursday', 3610, 135, 'marisol-bay-3'],
    ['2027-07-29', 'Central Florida', 'The drive is worth it: Marisol Bay in July', 2460, 90, ''],
    ['2027-08-12', 'Atlanta', 'Vegans Explore Atlanta, presented by Visit Marisol Bay', 3340, 127, 'atlanta'],
    ['2027-08-26', 'South Florida', 'Back-to-school breakfasts on Seagrape Key', 2870, 104, ''],
    ['2027-09-09', 'Marisol Bay', 'September on the bay: the community event on Seagrape Key', 3950, 149, 'marisol-bay-4'],
    ['2027-09-23', 'Atlanta', 'The World Vegan Expo comes to Marisol Bay in October', 3060, 118, 'expo'],
    ['2027-10-07', 'Central Florida', 'Drive down for the World Vegan Expo and the Gala', 3290, 121, 'expo'],
    ['2027-10-12', 'Marisol Bay', 'This weekend: the World Vegan Expo in Marisol Bay', 4920, 198, 'expo'],
    ['2027-10-26', 'Marisol Bay', 'Fall VegFest: the Media Corner lineup', 4180, 162, 'vegfest-fall'],
    ['2027-11-10', 'Marisol Bay', 'ThanksLiving on the bay: where to book', 3480, 131, ''],
    ['2027-12-02', 'Marisol Bay', 'Holiday lights and Vegan bites in Marisol Bay', 3770, 141, ''],
    ['2027-12-16', 'South Florida', 'Your 2028 Marisol Bay plan starts here', 3010, 110, '']
  ].map(function (r) { return { d: r[0], hub: r[1], t: r[2], reads: r[3], clk: r[4], ev: r[5] }; });
  // SoFlo Vegans Podcast episodes with a sponsor read: episode, date, title, downloads (first 30 days), clicks from the show notes, event.
  var POD = [
    [124, '2027-01-13', 'Planning a Vegan getaway for the new year', 2640, 54, 'marisol-bay-1'],
    [128, '2027-02-10', 'Orlando to the bay: the road trip episode', 2810, 58, 'orlando'],
    [132, '2027-03-10', 'Inside VegFest: the vendors behind the tents', 3120, 66, 'vegfest-spring'],
    [138, '2027-04-21', 'Earth Day, and restaurants adding plant-based dishes', 2730, 55, 'tampa'],
    [142, '2027-05-19', 'Food trucks of South Florida', 2960, 61, 'marisol-bay-2'],
    [150, '2027-07-14', 'Chefs on the harbor', 2790, 57, 'marisol-bay-3'],
    [155, '2027-08-18', 'Atlanta\'s plant-based scene, and the drive south', 3010, 63, 'atlanta'],
    [159, '2027-09-15', 'Why September is the best month on the bay', 2880, 59, 'marisol-bay-4'],
    [163, '2027-10-13', 'Expo week: what to see in Marisol Bay', 3540, 74, 'expo'],
    [165, '2027-10-27', 'Live from the Media Corner', 3320, 69, 'vegfest-fall']
  ].map(function (r) { return { ep: r[0], d: r[1], t: r[2], dl: r[3], clk: r[4], ev: r[5] }; });
  // Sponsor stories on the city hub, one a quarter: date, title, reads, tracked clicks, the event it led into.
  var STORIES = [
    ['2027-01-08', 'The Bay Brunch Trail, by Visit Marisol Bay', 5200, 210, 'marisol-bay-1'],
    ['2027-05-06', 'Summer on the bay: the slow-season plan', 4800, 186, 'marisol-bay-2'],
    ['2027-09-02', 'Why September is Marisol Bay\'s best-kept secret', 6100, 248, 'marisol-bay-4'],
    ['2027-10-01', 'The World Vegan Expo comes to Marisol Bay', 9400, 392, 'expo']
  ].map(function (r) { return { d: r[0], t: r[1], reads: r[2], clk: r[3], ev: r[4] }; });
  // City Guide placement: the sponsor's card in the Marisol Bay city Guide, all four quarters (views, tracked clicks).
  var GUIDE_Q = [{ views: 3800, clk: 96 }, { views: 4200, clk: 104 }, { views: 3900, clk: 98 }, { views: 6100, clk: 162 }];
  // Programmatic banners: impressions and clicks a month, by community hub, by size.
  var BAN_IMP = [17000, 18000, 20000, 20000, 21000, 21000, 20000, 22000, 22000, 25000, 23000, 21000];
  var BAN_CLK = [71, 75, 83, 83, 87, 87, 83, 92, 92, 104, 96, 87];
  var BAN_HUB = [
    { hub: 'South Florida', slug: 'south-florida', imp: 118000, clk: 496 },
    { hub: 'Central Florida', slug: 'central-florida', imp: 78000, clk: 296 },
    { hub: 'Atlanta', slug: 'atlanta', imp: 54000, clk: 248 }
  ];
  var BAN_SIZE = [
    { size: '300 x 600 billboard', where: 'Beside every section of the hub, on desktop', imp: 112000, clk: 528 },
    { size: '728 x 90 leaderboard', where: 'Across the top of the hub\'s lists', imp: 64000, clk: 214 },
    { size: '320 x 50 mobile banner', where: 'Between sections on phones', imp: 74000, clk: 298 }
  ];
  // Feeder-city visitors the banners sent (a trip code or a check-in), by month.
  var BAN_FEEDV = [30, 34, 38, 38, 40, 40, 38, 42, 42, 52, 48, 44];
  var REACH = 418000; // estimated unique people reached across every channel (sample)

  // Social posts: two for each event (the Expo has four), rotating Instagram, TikTok and Facebook. Reach and clicks scale with the event.
  var PLAT = { Instagram: { r: 6400, c: 0.009 }, TikTok: { r: 11200, c: 0.005 }, Facebook: { r: 4100, c: 0.011 } };
  var ROT = [['Instagram', 'TikTok'], ['TikTok', 'Facebook'], ['Facebook', 'Instagram']];
  var SCALE = { mb: 1, feeder: 0.9, vf: 2.2, expo: 3.4 };
  var EMAIL_BASE = { mb: 2400, feeder: 2100, vf: 3100, expo: 9800 };
  EVENTS.forEach(function (e, i) {
    var v = 1 + (((i * 37) % 11) - 5) / 50, f = SCALE[e.s] * v;
    var plats = e.s === 'expo' ? ['Instagram', 'TikTok', 'Facebook', 'Instagram'] : ROT[i % 3];
    e.social = plats.map(function (p, j) { var r = Math.round(PLAT[p].r * f * (j > 2 ? 0.8 : 1) / 10) * 10; return { p: p, reach: r, clk: Math.round(r * PLAT[p].c) }; });
    e.email = { reach: Math.round(EMAIL_BASE[e.s] * v / 10) * 10 }; e.email.clk = Math.round(e.email.reach * 0.058);
    var m = mOf(e.d); e.ban = { imp: Math.round(BAN_IMP[m] * 0.3), clk: Math.round(BAN_CLK[m] * 0.3) };
    e.pulse = PULSE.filter(function (x) { return x.ev === e.id; });
    e.pod = POD.filter(function (x) { return x.ev === e.id; });
    e.story = STORIES.filter(function (x) { return x.ev === e.id; });
    e.q = qOf(e.d);
  });
  var SOCIAL = []; EVENTS.forEach(function (e) { e.social.forEach(function (s) { SOCIAL.push({ d: e.d, ev: e.id, p: s.p, reach: s.reach, clk: s.clk }); }); });
  // Every place an event was seen, as rows: channel, what ran, reach, clicks.
  function seenRows(e) {
    var rows = [];
    var cnt = {}; e.social.forEach(function (s) { cnt[s.p] = cnt[s.p] || { n: 0, reach: 0, clk: 0 }; cnt[s.p].n++; cnt[s.p].reach += s.reach; cnt[s.p].clk += s.clk; });
    ['Instagram', 'TikTok', 'Facebook'].forEach(function (p) { if (cnt[p]) rows.push([p, cnt[p].n + (cnt[p].n > 1 ? ' posts' : ' post') + ', tagged as a paid partnership', cnt[p].reach, cnt[p].clk]); });
    if (e.pulse.length) rows.push(['Daily Pulse', e.pulse.length + (e.pulse.length > 1 ? ' sponsorship posts' : ' sponsorship post') + ' (reads)', sum(e.pulse, 'reads'), sum(e.pulse, 'clk')]);
    if (e.pod.length) rows.push(['SoFlo Vegans Podcast', 'Episode ' + e.pod.map(function (x) { return x.ep; }).join(', ') + ', the host\'s read (downloads)', sum(e.pod, 'dl'), sum(e.pod, 'clk')]);
    if (e.story.length) rows.push(['Sponsor story', e.story[0].t + ' (reads)', sum(e.story, 'reads'), sum(e.story, 'clk')]);
    rows.push(['Banners', 'The event week\'s share of the year\'s banners (impressions)', e.ban.imp, e.ban.clk]);
    rows.push(['Email', 'The invite to members of the hub (opens)', e.email.reach, e.email.clk]);
    return rows;
  }

  // ---------- the rate card (canon canon-ve-sponsor-rate-card v1) and the package ----------
  var RATE = { ban: 12, pulse: 150, pod: 250, social: 150, story: 500, guide: 500, mb: 2500, feeder: 2000, vf: 1500, expo: 15000, galaTitle: 7500, gold: 5000, booth: 350 };
  var PACKAGE = 42000, PACKAGE_Q = 10500;
  function cnt(s) { return EVENTS.filter(function (e) { return e.s === s; }).length; }
  var LINES = [
    ['World Vegan Expo presenting sponsor, with the Gala', 1, RATE.expo, '#/event/expo/opportunity'],
    ['Vegans Explore Marisol Bay community events, presenting', cnt('mb'), RATE.mb, '#/event/marisol-bay-1/opportunity'],
    ['Feeder-city community events, presenting', cnt('feeder'), RATE.feeder, '#/event/orlando/opportunity'],
    ['VegFest Media Corners, presenting', cnt('vf'), RATE.vf, '#/event/vegfest-spring/opportunity'],
    ['Daily Pulse sponsorship posts', PULSE.length, RATE.pulse, '#/pulse'],
    ['SoFlo Vegans Podcast host reads', POD.length, RATE.pod, '#/podcast'],
    ['Social posts (one platform each)', SOCIAL.length, RATE.social, '#/campaigns'],
    ['Sponsor stories on the city hub', STORIES.length, RATE.story, '#/campaigns'],
    ['City Guide placement, a quarter', GUIDE_Q.length, RATE.guide, '#/package'],
    ['Banner impressions (per 1,000)', sum(BAN_IMP) / 1000, RATE.ban, '#/banners']
  ];
  var ALACARTE = sum(LINES, function (l) { return l[1] * l[2]; });
  var SAVE = ALACARTE - PACKAGE;

  // ---------- totals, added up ----------
  function evS(s) { return EVENTS.filter(function (e) { return e.s === s; }); }
  var T = {
    att: sum(EVENTS, 'att'), chk: sum(EVENTS, 'chk'), mem: sum(EVENTS, 'mem'), vis: sum(EVENTS, 'vis'),
    pReads: sum(PULSE, 'reads'), pClk: sum(PULSE, 'clk'), podDl: sum(POD, 'dl'), podClk: sum(POD, 'clk'),
    banImp: sum(BAN_IMP), banClk: sum(BAN_CLK), banFeedV: sum(BAN_FEEDV),
    socReach: sum(SOCIAL, 'reach'), socClk: sum(SOCIAL, 'clk'), stReads: sum(STORIES, 'reads'), stClk: sum(STORIES, 'clk'),
    gViews: sum(GUIDE_Q, 'views'), gClk: sum(GUIDE_Q, 'clk'),
    clips: sum(evS('vf'), 'clips'), views: sum(evS('vf'), 'views'), iv: sum(evS('vf'), 'iv')
  };
  T.content = PULSE.length + SOCIAL.length + STORIES.length + POD.length + T.clips;
  T.visitors = T.vis + T.banFeedV;

  // One month's numbers (0 to 11), from the rows above; a quarter or the year adds months up.
  var CH = ['Community events', 'World Vegan Expo and Gala', 'VegFest Media Corners', 'Social posts', 'Daily Pulse posts', 'SoFlo Vegans Podcast', 'Sponsor stories', 'City Guide placement', 'Banner advertising'];
  function month(m) {
    function inM(x) { return mOf(x.d) === m; }
    var evs = EVENTS.filter(inM), pulse = PULSE.filter(inM), pod = POD.filter(inM), soc = SOCIAL.filter(inM), stor = STORIES.filter(inM);
    function evClk(list) { return sum(list, function (e) { return e.clk + e.email.clk; }); }
    var gq = GUIDE_Q[Math.floor(m / 3)], gShare = m % 3 === 2 ? gq.clk - 2 * Math.floor(gq.clk / 3) : Math.floor(gq.clk / 3);
    var ch = {};
    ch[CH[0]] = evClk(evs.filter(function (e) { return e.s === 'mb' || e.s === 'feeder'; }));
    ch[CH[1]] = evClk(evs.filter(function (e) { return e.s === 'expo'; }));
    ch[CH[2]] = evClk(evs.filter(function (e) { return e.s === 'vf'; }));
    ch[CH[3]] = sum(soc, 'clk'); ch[CH[4]] = sum(pulse, 'clk'); ch[CH[5]] = sum(pod, 'clk'); ch[CH[6]] = sum(stor, 'clk'); ch[CH[7]] = gShare; ch[CH[8]] = BAN_CLK[m];
    return {
      evs: evs, pulse: pulse, pod: pod, stor: stor, ch: ch,
      clk: sum(CH, function (k) { return ch[k]; }), imp: BAN_IMP[m],
      att: sum(evs, 'att'), chk: sum(evs, 'chk'), mem: sum(evs, 'mem'), vis: sum(evs, 'vis') + BAN_FEEDV[m],
      reads: sum(pulse, 'reads'), dl: sum(pod, 'dl')
    };
  }
  function span(ms) {
    var parts = ms.map(month), out = { evs: [], pulse: [], pod: [], stor: [], ch: {}, clk: 0, imp: 0, att: 0, chk: 0, mem: 0, vis: 0, reads: 0, dl: 0 };
    parts.forEach(function (p) {
      ['evs', 'pulse', 'pod', 'stor'].forEach(function (k) { out[k] = out[k].concat(p[k]); });
      ['clk', 'imp', 'att', 'chk', 'mem', 'vis', 'reads', 'dl'].forEach(function (k) { out[k] += p[k]; });
      Object.keys(p.ch).forEach(function (k) { out.ch[k] = (out.ch[k] || 0) + p.ch[k]; });
    });
    return out;
  }
  var MONTHS = MON.map(function (x, i) { return month(i); });
  var YEAR = span([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  function qMonths(q) { return [0, 1, 2].map(function (i) { return (q - 1) * 3 + i; }); }

  // ---------- tabs, and V's lines ----------
  // V's lines below (say) are TEXT DRAFTS for Sean to approve. Nothing is recorded, nothing plays.
  var TABS = [
    { k: 'overview', label: 'Overview', say: 'Hi, I\'m V. It\'s the end of 2027, and this is the year Visit Marisol Bay took the full package with Vegans Explore. It hasn\'t happened yet: it\'s a simulation of what we\'re positioned to do. Let me show you how to read it.' }, // DRAFT line, not recorded
    { k: 'campaigns', label: 'Campaigns', say: 'Here is the year by quarter. Pick All, or Q1 through Q4. Every card is a real kind of event we run, so you can see each sponsorship, not a list of bullets. Open one for its results.' }, // DRAFT line, not recorded
    { k: 'pulse', label: 'Daily Pulse', say: 'Twenty-five posts in the Daily Pulse, the morning briefing in each city. Every one is listed with its reads and clicks.' }, // DRAFT line, not recorded
    { k: 'podcast', label: 'SoFlo Vegans Podcast', say: 'Ten sponsor reads on SoFlo Vegans, each one tied to an event. Here is what the host said, and how many people downloaded each episode.' }, // DRAFT line, not recorded
    { k: 'banners', label: 'Banner Advertising', say: 'A quarter of a million banner impressions across the South Florida, Central Florida and Atlanta hubs. Here is where they ran and who clicked.' }, // DRAFT line, not recorded
    { k: 'dashboard', label: 'Marketing Dashboard', say: 'This is the dashboard the sponsor opens any day of the year: traffic by month, every channel, and a report for every month and quarter.' }, // DRAFT line, not recorded
    { k: 'package', label: 'Your Package', say: 'Everything above is one package: forty-two thousand dollars for the year, or ten thousand five hundred a quarter. Bought one piece at a time, it comes to fifty-two thousand eight hundred fifty.' } , // DRAFT line, not recorded
    { k: 'goals', label: 'What we can do for you', say: 'That was one sponsor\'s year. Yours starts with you. We read your plan and your reports, we sit down and talk about where you\'re going, and we build the year around your goals and your budget. Why us? We built these communities, a Directory of plant-based places and an events calendar without a big budget. A sponsor\'s budget scales what already works.' } // DRAFT line, not recorded
  ];
  var EV_SAY = {
    mb: 'This is a Vegans Explore community event in Marisol Bay, presented by Visit Marisol Bay. Use the dropdown in the corner to switch between the four, and the tabs for results, where people saw it, and where your name was.', // DRAFT line, not recorded
    feeder: 'This event went to a city that sends Marisol Bay its visitors. Switch cities in the corner, and look at how many guests came to the bay afterward.', // DRAFT line, not recorded
    vf: 'A Media Corner at VegFest: we interview the people there, and the clips keep working long after the tents come down. Switch between spring and fall in the corner.', // DRAFT line, not recorded
    expo: 'Our biggest weekend, in Marisol Bay: the World Vegan Expo, and the Vegans Explore Gala on Friday night, both presented by Visit Marisol Bay.' // DRAFT line, not recorded
  };
  var ROOT = '2027 Report';

  var main = document.getElementById('dgMain');
  var menuEl = document.getElementById('dgMenu'), menuSel = document.getElementById('dgMenuSelect');
  var bubble = document.getElementById('dgBubble'), tourEl = document.getElementById('dgTour'), tourM = document.getElementById('dgTourM');
  var foldBtn = document.getElementById('dgFold'), railEl = document.getElementById('dgRail');
  var curTab = 'overview';
  function tab(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i].k === k) return TABS[i]; return TABS[0]; }
  function href(k) { return '#/' + (k === 'overview' ? '' : k); }

  // ---------- shared pieces, from welcome-guide.js ----------
  function head(k, h, noTag) {
    return '<div class="dg-head"><div><div class="dg-k">' + esc(k) + (noTag ? '' : '<span class="sr-tag">Sample results</span>') + '</div><h2 class="dg-h1">' + esc(h) + '</h2></div></div>';
  }
  function crumb(trail) {
    return '<div class="dg-crumb"><a href="#/">' + esc(ROOT) + '</a>' + trail.map(function (x) { return ' &rsaquo; ' + (x[1] ? '<a href="' + esc(x[1]) + '">' + esc(x[0]) + '</a>' : esc(x[0])); }).join('') + '</div>';
  }
  function card(kicker, title, picUrl, ps, btns) {
    return '<section class="wg-gs" aria-label="' + esc(kicker) + '"><span class="wg-gs-pic"><img src="' + esc(picUrl) + '" alt="" decoding="async" width="640" height="640"></span>' +
      '<div class="wg-gs-b"><div class="vgi-k">' + esc(kicker) + '</div><h3 class="wg-gs-t">' + esc(title) + '</h3>' + ps.map(function (x) { return '<p>' + x + '</p>'; }).join('') +
      (btns ? '<div class="wg-gs-btns">' + btns + '</div>' : '') + '</div></section>';
  }
  function artRow(picUrl, title, txt, link, more) {
    if (!link) return '<li class="wg-art"><span class="wg-art-img" style="background-image:url(&quot;' + esc(picUrl) + '&quot;)"></span><div><span class="wg-art-t">' + esc(title) + '</span><p>' + txt + '</p></div></li>';
    return '<li class="wg-art"><a href="' + esc(link) + '" tabindex="-1" aria-hidden="true"><span class="wg-art-img" style="background-image:url(&quot;' + esc(picUrl) + '&quot;)"></span></a>' +
      '<div><a class="wg-art-t" href="' + esc(link) + '">' + esc(title) + '</a><p>' + txt + '</p><a class="wg-art-more" href="' + esc(link) + '">' + esc(more || 'Read more') + ' &rsaquo;</a></div></li>';
  }
  function group(label, rows) { return '<div class="wg-arts"><div class="wg-grp"><h5>' + esc(label) + '</h5><ol>' + rows.join('') + '</ol></div></div>'; }
  function h5(label) { return '<div class="wg-grp" style="margin-bottom:12px"><h5>' + esc(label) + '</h5></div>'; }
  function cta(title, text, go) {
    if (window.VEExplorerCard) VEExplorerCard.html({}); // loads the card's styles, as welcome-guide.js does
    return '<section class="vxc" aria-label="' + esc(go[0]) + '"><div class="vxc-b"><div class="vxc-k">See it for yourself</div><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p></div>' +
      '<a class="vxc-go" href="' + esc(go[1]) + '">' + esc(go[0]) + '</a></section>';
  }
  function stats(list) {
    return '<div class="sr-stats">' + list.map(function (s) { return '<div class="sr-stat' + (s[3] ? ' hi' : '') + '"><b>' + s[0] + '</b><span>' + esc(s[1]) + '</span>' + (s[2] ? '<small>' + esc(s[2]) + '</small>' : '') + '</div>'; }).join('') + '</div>';
  }
  function table(cols, rows, foot) {
    return '<div class="sr-tw"><table class="sr-t"><thead><tr>' + cols.map(function (c) { return '<th' + (c[1] ? ' class="n"' : '') + '>' + esc(c[0]) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (v, i) { return '<td' + (cols[i][1] ? ' class="n"' : '') + '>' + v + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody>' +
      (foot ? '<tfoot><tr>' + foot.map(function (v, i) { return '<td' + (cols[i][1] ? ' class="n"' : '') + '>' + v + '</td>'; }).join('') + '</tr></tfoot>' : '') + '</table></div>';
  }
  function snap(src, title, text, link, cls) {
    return '<figure class="sr-snap' + (cls ? ' ' + cls : '') + '"><div class="sr-shot"><img src="' + esc(src) + '" alt="Sample: ' + esc(title) + '" decoding="async"></div>' +
      '<figcaption><b>' + esc(title) + '</b>' + text + (link ? ' <a href="' + esc(link[1]) + '">' + esc(link[0]) + ' &rsaquo;</a>' : '') + '</figcaption></figure>';
  }
  function mock(inner, title, text, cls) {
    return '<figure class="sr-snap' + (cls ? ' ' + cls : '') + '"><div class="sr-shot">' + inner + '</div><figcaption><b>' + esc(title) + '</b>' + text + '</figcaption></figure>';
  }
  var LOGO = '<span class="sr-logo"><b>Visit Marisol Bay</b><i>Sun, sand, plant-based</i></span>';
  // The sectionPage of welcome-guide.js: How to use this page, then the parts, then one See it for yourself.
  function sectionPage(k, o) {
    var start = card('How to use this page', o.title, o.pic, o.how, '<a class="dg-btn" href="' + esc(o.go[1]) + '">' + esc(o.go[0]) + '</a>');
    return crumb([[tab(k).label]]) + head(o.kicker, tab(k).label) + start + o.body + cta(o.ctaTitle, o.ctaText, o.go);
  }

  function tabs(list, cur) { return '<nav class="sr-tabs" aria-label="Views">' + list.map(function (t) { return '<a href="' + esc(t[1]) + '"' + (t[0] === cur ? ' aria-current="page"' : '') + '>' + esc(t[2]) + '</a>'; }).join('') + '</nav>'; }
  function insight(txt) { return '<div class="sr-insight"><small>What it tells you</small>' + esc(txt) + '</div>'; }
  function evDate(e) { return day(e.d, true) + (e.end ? ' and ' + day(e.end, true) : '') + ', 2027'; }
  function headline(e) {
    if (e.s === 'feeder') return n(e.att) + ' people; ' + n(e.vis) + ' visited Marisol Bay afterward.';
    if (e.s === 'vf') return n(e.iv) + ' interviews, ' + n(e.clips) + ' clips and ' + n(e.views) + ' views.';
    if (e.s === 'expo') return n(e.att) + ' people, ' + n(e.rooms) + ' hotel room nights and ' + n(e.gala) + ' guests at the Gala.';
    return n(e.att) + ' people and ' + n(e.chk) + ' check-ins at local businesses in the 30 days after.';
  }
  function evCard(e) {
    return '<a class="sr-card" href="#/event/' + e.id + '"><span class="pic" style="background-image:url(&quot;' + esc(e.pic) + '&quot;)"><span class="sr-stamp">Sample</span></span><span class="b">' +
      '<small>' + esc(day(e.d, true) + (e.end ? ' and ' + dt(e.end).getDate() : '')) + ' &middot; ' + esc(e.city) + '</small><b>' + esc(evTitle(e)) + '</b><p>' + esc(headline(e)) + '</p><em>See the results &rsaquo;</em></span></a>';
  }
  function yearEndCard() {
    return '<a class="sr-card" href="#/dashboard/year"><span class="pic" style="background-image:url(&quot;' + PIC + 'restaurant-guide/t-dashboard.jpg&quot;)"><span class="sr-stamp">Sample</span></span><span class="b">' +
      '<small>December &middot; Marketing Dashboard</small><b>The year-end report</b><p>' + esc(n(YEAR.clk) + ' tracked clicks and ' + n(T.att) + ' people at events, with every month and quarter.') + '</p><em>Open the report &rsaquo;</em></span></a>';
  }

  // ---------- the Overview ----------
  function overview() {
    var qs = [1, 2, 3, 4].map(function (q) { var s = span(qMonths(q)); return s; });
    var rows = [
      [BIZ + 's-team.webp', 'Q1: January to March', qs[0].evs.map(evTitle).join(', ') + '. ' + n(qs[0].att) + ' people at events.', 'campaigns/q1', 'See Q1'],
      [EG + 'still-overview.jpg', 'Q2: April to June', qs[1].evs.map(evTitle).join(', ') + '. ' + n(qs[1].att) + ' people at events.', 'campaigns/q2', 'See Q2'],
      [BIZ + 's-outside-night.webp', 'Q3: July to September', qs[2].evs.map(evTitle).join(', ') + '. ' + n(qs[2].att) + ' people at events.', 'campaigns/q3', 'See Q3'],
      [PIC + 'vegan-events-guide.jpg', 'Q4: October to December', qs[3].evs.map(evTitle).join(', ') + ', then the year-end report. ' + n(qs[3].att) + ' people at events.', 'campaigns/q4', 'See Q4'],
      [PIC + 'restaurant-guide/t-pulse.jpg', 'Daily Pulse', n(PULSE.length) + ' sponsorship posts in the morning briefings: ' + n(T.pReads) + ' reads and ' + n(T.pClk) + ' clicks.', 'pulse', 'See the posts'],
      [PIC + 'holiday/p-listen.jpg', 'SoFlo Vegans Podcast', n(POD.length) + ' host reads: ' + n(T.podDl) + ' downloads and ' + n(T.podClk) + ' clicks from the show notes.', 'podcast', 'See the episodes'],
      [IMG + 'snap-billboard.jpg', 'Banner Advertising', n(T.banImp) + ' impressions on the South Florida, Central Florida and Atlanta hubs: ' + n(T.banClk) + ' clicks.', 'banners', 'See the banners'],
      [PIC + 'restaurant-guide/t-dashboard.jpg', 'Marketing Dashboard', 'Traffic by month, every channel in one place, and a report for every month and quarter.', 'dashboard', 'Open the dashboard'],
      [PIC + 'restaurant-guide/t-audit.jpg', 'What we can do for you', 'How we build your year: your plan, a conversation, your goals matched to campaigns, and your budget.', 'goals', 'See how']
    ];
    return head('The end of 2027, a simulation', 'Visit Marisol Bay, Your Year With Vegans Explore') +
      card('Getting started', 'How to use your report', V_PIC, [
        '<b>Start with the campaigns,</b> by quarter. Every card is an event, with its results, where people saw it and where the sponsor\'s name was.',
        '<b>Every click is tracked.</b> Reads, downloads, check-ins and visitors are people.',
        '<b>It never happened.</b> It is the year Vegans Explore is positioned to run for a sponsor, with made-up results.'
      ], '<a class="dg-btn" href="#/campaigns">Start the walk-through</a><a class="dg-btn dg-ghost" href="#/campaigns">See the campaigns</a>') +
      '<section class="sr-pkg" aria-label="Your package"><div><small>Your package</small><b>The full package, ' + money(PACKAGE) + ' for 2027</b><p>Every campaign on this report, in one sponsorship: ' + money(PACKAGE_Q) + ' a quarter. Bought one at a time from our rate card, it comes to ' + money(ALACARTE) + '; the package saves ' + money(SAVE) + ', about ' + Math.floor(SAVE / ALACARTE * 100) + '%.</p></div><a class="dg-btn" href="#/package">See what is in it</a></section>' +
      h5('2027 at a glance') +
      stats([
        [n(REACH), 'People reached', 'Estimated, unique, every channel', true],
        [n(T.att), 'Event attendance', 'At the ' + EVENTS.length + ' events the sponsor presented'],
        [n(T.visitors), 'Out-of-town visitors', 'Tracked by trip code or check-in'],
        [n(EVENTS[9].rooms), 'Hotel room nights', 'From the World Vegan Expo'],
        [n(T.chk), 'Check-ins at local businesses', 'At plant-based places in Marisol Bay'],
        [n(T.mem), 'New members', 'Who joined at an event'],
        [n(YEAR.clk), 'Tracked clicks', 'To the sponsor, from every channel'],
        [n(T.content), 'Pieces of content', 'About ' + Math.round(T.content / 52) + ' a week']
      ]) +
      '<p class="sr-note">Sample results: Visit Marisol Bay and every number on this report are made up to show what a year of sponsorship looks like. The campaigns are ones Vegans Explore runs or is set up to run.</p>' +
      group('Your year, one page at a time', rows.map(function (r) { return artRow(r[0], r[1], esc(r[2]), href(r[3]), r[4]); })) +
      cta('Walk the year with V.', 'Start with the campaigns, then see what we can do for you.', ['Start with the campaigns', '#/campaigns']);
  }

  // ---------- What we can do for you (Sean, 2026-11-09: the last section, about the visitor, no Marisol Bay) ----------
  function goals() {
    var g = [
      ['We read your plan and your reports', 'Your strategy, your visitor data and your results: where you are as an organization and where you are going.',
        'You get back a short brief: your goals in your words, and where Vegans Explore fits.'],
      ['We sit down and talk', 'A discovery conversation: which travelers are hard to reach, what a good year looks like, and what your board measures.',
        'Nothing is priced before we listen.'],
      ['We match your goals to campaigns', 'The goals destinations bring us are often things like new markets, slower months, steady content and partners who share their values.',
        'Each goal gets the campaigns that answer it, from the ones in this report: community events, feeder-city events, Media Corners, the Expo, the Daily Pulse, the podcast and banners.'],
      ['You set the budget, we build the year', 'A full year, one quarter, or one event: the package is shaped to your budget from our rate card.',
        'The budget planner that builds it with you: Coming. Until then, we build it together.']
    ];
    var why = [
      ['/communities', 'Communities and hubs', 'A hub for each community, city by city, with its own calendar, Daily Pulse and sponsors.'],
      ['/directory', 'The Directory', 'Vegan and plant-based places, vetted and checked in at by members.'],
      ['/events', 'The events calendar', 'Every community event and festival, with the sponsor named on its page.'],
      ['/media', 'Our shows', 'SoFlo Vegans and the Vegans Explore shows, with host reads and show notes.']
    ];
    var facts = [
      ['60%', 'of US households bought plant-based foods in 2025.', 'GFI'],
      ['59%', 'of diners look for dietary information on menus.', 'DoorDash and SevenRooms']
    ];
    return crumb([['What we can do for you']]) + head('After the walk-through', 'What we can do for you', true) +
      card('How to use this page', 'Your year starts with you', PIC + 'restaurant-guide/t-audit.jpg', [
        '<b>That was one sponsor\'s year,</b> made up to show the kind of campaigns we run.',
        '<b>Yours is built around you:</b> your plan, a conversation, your goals and your budget. Here is how.'
      ], '<a class="dg-btn" href="/contact">Talk to us</a><a class="dg-btn dg-ghost" href="#/package">See the full package</a>') +
      h5('How we build your year') +
      '<div class="sr-goals">' + g.map(function (x, i) { return '<div class="sr-goal"><small>Step ' + (i + 1) + '</small><b>' + esc(x[0]) + '</b><p>' + esc(x[1]) + '</p><div class="ans"><i>What you get</i>' + esc(x[2]) + '</div></div>'; }).join('') + '</div>' +
      h5('Why we are positioned to do this') +
      '<div class="sr-why">' + why.map(function (x) { return '<a href="' + x[0] + '"><b>' + esc(x[1]) + '</b><span>' + esc(x[2]) + '</span></a>'; }).join('') +
      '<div><b>The Research Library</b><span>The studies behind every number we quote, kept current for sponsors and partners.</span></div>' +
      facts.map(function (x) { return '<div><b class="big">' + x[0] + '</b><span>' + esc(x[1]) + '</span><cite>Source: ' + esc(x[2]) + '</cite></div>'; }).join('') +
      '<div><b>Built without a big budget</b><span>We grew this audience on our own. A sponsor\'s budget scales it: more events, more cities, more people.</span></div></div>' +
      cta('Ready when you are.', 'Tell us where you are going, and we will build your year around it.', ['Talk to us', '/contact']);
  }

  // ---------- Campaigns, by quarter ----------
  var QN = ['', 'January to March', 'April to June', 'July to September', 'October to December'];
  function campaigns(sub) {
    var q = /^q([1-4])$/.exec(sub || ''), qi = q ? +q[1] : 0;
    var tabsHtml = tabs([['all', '#/campaigns', 'All']].concat([1, 2, 3, 4].map(function (i) { return ['q' + i, '#/campaigns/q' + i, 'Q' + i]; })), qi ? 'q' + qi : 'all');
    function quarter(i, withHead) {
      var s = span(qMonths(i)), evs = EVENTS.filter(function (e) { return e.q === i; });
      return (withHead ? '<div class="sr-qh"><h4>Q' + i + ': ' + QN[i] + '</h4><span>' + n(s.att) + ' people at events &middot; ' + n(s.clk) + ' tracked clicks &middot; <a href="#/dashboard/q' + i + '" style="color:var(--g);font-weight:800;text-decoration:none">Q' + i + ' report &rsaquo;</a></span></div>' : '') +
        '<div class="sr-cards">' + evs.map(evCard).join('') + (i === 4 ? yearEndCard() : '') + '</div>';
    }
    var body;
    if (qi) {
      var s = span(qMonths(qi));
      body = stats([[n(s.evs.length), 'Events', QN[qi], true], [n(s.att), 'People attended'], [n(s.vis), 'Out-of-town visitors', 'Tracked'], [n(s.chk), 'Check-ins'], [n(s.clk), 'Tracked clicks', 'Every channel']]) + quarter(qi, false) +
        '<p class="sr-note" style="margin-top:0">All quarter: Daily Pulse posts, host reads, banners, social posts and the city Guide placement. <a href="#/dashboard/q' + qi + '" style="color:var(--g);font-weight:800;text-decoration:none">Open the Q' + qi + ' report &rsaquo;</a></p>';
    } else {
      var allYear = [
        ['#/pulse', 'Daily Pulse', n(PULSE.length) + ' sponsorship posts'], ['#/podcast', 'SoFlo Vegans Podcast', n(POD.length) + ' host reads'],
        ['#/banners', 'Banner Advertising', n(T.banImp) + ' impressions'], ['#/package', 'City Guide placement', 'All four quarters'],
        ['#/event/expo/seen', 'Social posts', n(SOCIAL.length) + ' posts, two for each event'], ['#/package', 'Sponsor stories', n(STORIES.length) + ' stories, one a quarter'],
        ['#/package', 'Airport Guide placement', 'Coming'], ['#/dashboard', 'Marketing Dashboard', 'Monthly and quarterly reports']
      ];
      body = [1, 2, 3, 4].map(function (i) { return quarter(i, true); }).join('') +
        h5('All year') + '<div class="sr-reps">' + allYear.map(function (x) { return '<a class="sr-rep" href="' + x[0] + '"><small>All year</small><b>' + esc(x[1]) + '</b><span>' + esc(x[2]) + '</span></a>'; }).join('') + '</div>';
    }
    return crumb(qi ? [['Campaigns', '#/campaigns'], ['Q' + qi]] : [['Campaigns']]) + head('The 2027 calendar', qi ? 'Campaigns, Q' + qi : 'Campaigns') +
      card('How to use this page', 'The year by quarter', EG + 'still-plan.jpg', [
        '<b>Pick All, or a quarter.</b> Each card is an event the sponsor presented: its date, its city and its headline result.',
        '<b>Open a card</b> for its results, where people saw it, where Visit Marisol Bay appeared, and what the sponsorship costs.'
      ], '<a class="dg-btn" href="#/event/marisol-bay-1">Open the first event</a>') +
      tabsHtml + body +
      cta('See the whole year in one report.', 'The year-end report adds up every event and every channel.', ['Open the year-end report', '#/dashboard/year']);
  }

  // ---------- one event, its own page ----------
  var EVT = [['results', 'Results'], ['seen', 'Where people saw it'], ['presented', 'Presented by Visit Marisol Bay'], ['opportunity', 'The opportunity']];
  function signMock(e) {
    return '<div class="sr-mk sr-signm"><span class="sr-stamp">Sample</span><div class="bd"><small>Welcome to</small><b>' + esc(e.name) + '</b>' + LOGO.replace('sr-logo', 'sr-logo sm') + '</div><div class="tbl"><span class="qr"></span>Plan your trip</div></div>';
  }
  function boothMock() {
    return '<div class="sr-mk sr-booth"><span class="sr-stamp">Sample</span><span class="sun"></span><div class="bk"><small>Visit</small><b>Marisol Bay</b><span>Sun, sand, plant-based</span></div><div class="tb"><span class="qr"></span>Plan your trip</div><span class="ve">World Vegan Expo &middot; Booth 1</span></div>';
  }
  function galaMock() {
    return '<div class="sr-mk sr-gala"><span class="sr-stamp">Sample</span><div class="st"><small>Friday, October 15</small><b>The Vegans Explore Gala</b><span>Presented by Visit Marisol Bay</span></div><span class="tb a"></span><span class="tb b"></span><span class="tb c"></span></div>';
  }
  function cornerMock() {
    var wall = ''; for (var i = 0; i < 12; i++) wall += i % 2 ? '<i class="b">Visit<br>Marisol Bay</i>' : '<i class="a">Vegans<br>Explore</i>';
    return '<div class="sr-mk sr-corner"><span class="sr-stamp">Sample</span><div class="wall">' + wall + '</div><div class="floor"></div><span class="st l"></span><span class="st r"></span><span class="sign">Media Corner, presented by Visit Marisol Bay</span></div>';
  }
  function socialMock(e) {
    var s = e.social[0];
    return '<div class="sr-mk sr-ig"><span class="sr-stamp">Sample</span><div class="top"><i></i><div>vegansexplore<span>Paid partnership with Visit Marisol Bay</span></div></div><div class="ph" style="background-image:url(&quot;' + esc(e.pic) + '&quot;)"></div>' +
      '<div class="cap"><b>vegansexplore</b> ' + esc(evTitle(e)) + ', ' + esc(day(e.d)) + '. Presented by Visit Marisol Bay. RSVP at the link in our bio.</div></div>';
  }
  function podMock(e) {
    var ep = e.pod[0];
    return '<div class="sr-mk sr-pod"><span class="sr-stamp">Sample</span><div class="art"><b>SoFlo<br>Vegans</b><small>Podcast</small></div><div><h4>Episode ' + ep.ep + ': ' + esc(ep.t) + '</h4><p>' + day(ep.d, true) + ', 2027 &middot; ' + n(ep.dl) + ' downloads</p>' +
      '<div class="sr-read"><small>Sponsor read, 30 seconds</small>"This episode is brought to you by Visit Marisol Bay. Sun, sand, plant-based. Join us at ' + esc(evTitle(e)) + ' on ' + esc(day(e.d, true)) + ', and plan your weekend at vegansexplore.com/go/marisol-bay."</div>' +
      '<span class="sr-soon">Listen: Coming</span></div></div>';
  }
  function presented(e) {
    var calRow = ['On the events calendar', 'Listed as "' + evTitle(e) + ', presented by Visit Marisol Bay" on the ' + (e.hub || 'Marisol Bay') + ' hub\'s calendar and the event\'s RSVP page.'];
    if (e.s === 'expo') return [
      ['Presenting sponsor of the Expo', 'Visit Marisol Bay on the Expo\'s name, tickets, map and program, printed and online.'],
      ['The Vegans Explore Gala, presented by Visit Marisol Bay', 'Friday evening: the sponsor\'s name on the stage, a welcome from the sponsor and ' + n(e.gala) + ' guests at the tables.'],
      ['Booth 1, by the main doors', 'A Marisol Bay backdrop, a trip planner sign-up and a QR trip code: ' + n(e.booth) + ' booth visitors and ' + n(e.leads) + ' sign-ups.'],
      ['Named from the main stage', 'The host thanked Visit Marisol Bay from the main stage ' + e.stage + ' times over the two days.'],
      ['The hotel room block', 'Rooms booked through the Expo\'s block, counted for the sponsor: ' + n(e.rooms) + ' room nights.'],
      calRow
    ];
    if (e.s === 'vf') return [
      ['The Media Corner backdrop', 'Visit Marisol Bay and Vegans Explore on the wall behind every interview.'],
      ['In every clip', 'Each of the ' + e.clips + ' clips ends with "presented by Visit Marisol Bay" and a tracked link.'],
      ['A trip code at the corner', 'Out-of-town festivalgoers scanned it for the sponsor\'s weekend plan: ' + n(e.vis) + ' of them.'],
      calRow
    ];
    return [
      ['In the event\'s name', '"' + e.name + ', presented by Visit Marisol Bay" on the RSVP page, the invite email and every post.'],
      ['The welcome sign and the sponsor\'s table', 'The sponsor\'s logo at the door, and a table with a QR trip code to its weekend plan.'],
      ['A welcome from the host', 'The host thanks Visit Marisol Bay at the start of the event' + (e.s === 'feeder' ? ', and tells the room how to plan a trip to the bay.' : '.')],
      calRow
    ];
  }
  function opportunity(e) {
    var S = SERIES[e.s];
    var inc = e.s === 'expo' ? [
      '<b>Presenting sponsor</b> of the World Vegan Expo, on its name, tickets, map and program',
      '<b>The Vegans Explore Gala, presented by Visit Marisol Bay</b>, with a welcome from the stage',
      '<b>Booth 1</b> by the main doors, with a trip planner sign-up and a QR trip code',
      '<b>Main stage mentions</b> over both days',
      '<b>The hotel room block</b> counted for you, room night by room night',
      '<b>Results in your Marketing Dashboard</b>, the same week'
    ] : e.s === 'vf' ? [
      '<b>Your name on the Media Corner backdrop</b>, behind every interview',
      '<b>Every clip</b> credited to you, with a tracked link',
      '<b>A trip code</b> at the corner for out-of-town festivalgoers',
      '<b>Results in your Marketing Dashboard</b>: interviews, clips, views and clicks'
    ] : [
      '<b>"Presented by Visit Marisol Bay"</b> in the event\'s name, on the calendar, the RSVP page and the invite email',
      '<b>The welcome sign and a table</b> with your QR trip code',
      '<b>A welcome from the host</b>, naming you to the room',
      e.s === 'feeder' ? '<b>Trip codes for every guest</b>, so visits to Marisol Bay afterward are counted' : '<b>Check-ins counted</b> at local businesses for 30 days after',
      '<b>Results in your Marketing Dashboard</b>, the same week'
    ];
    var extra = [];
    var socN = e.social.length; extra.push(['Social posts', socN, RATE.social]);
    if (e.pulse.length) extra.push(['Daily Pulse sponsorship posts', e.pulse.length, RATE.pulse]);
    if (e.pod.length) extra.push(['SoFlo Vegans Podcast host reads', e.pod.length, RATE.pod]);
    if (e.story.length) extra.push(['Sponsor story', e.story.length, RATE.story]);
    var evVal = S.price + sum(extra, function (x) { return x[1] * x[2]; });
    var tiers = e.s === 'expo' ? h5('Other ways to sponsor the Expo') + table([['Tier'], ['Price', 1]], [['<b>Presenting sponsor, with the Gala</b> (this one)', money(RATE.expo)], ['<b>Gala title sponsor</b>', money(RATE.galaTitle)], ['<b>Gold sponsor</b>', money(RATE.gold)], ['<b>Booth</b>', money(RATE.booth)]]) : '';
    return '<div class="sr-price"><div><b>' + esc(S.item) + '</b><p>Our rate card price for one ' + (e.s === 'expo' ? 'Expo' : 'event') + '. In the full package, it is one part of ' + money(PACKAGE) + ' for the year.</p></div><strong>' + money(S.price) + '<small>a la carte</small></strong></div>' +
      h5('What this sponsorship includes') + '<ul class="sr-inc">' + inc.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' + tiers +
      h5('Also around this event, in your package') +
      table([['Item'], ['Quantity', 1], ['Rate', 1], ['Value', 1]], [['<b>' + esc(S.item) + '</b>', '1', money(S.price), money(S.price)]].concat(extra.map(function (x) { return ['<b>' + esc(x[0]) + '</b>', n(x[1]), money(x[2]), money(x[1] * x[2])]; })), ['This event, a la carte', '', '', money(evVal)]) +
      '<p class="sr-note">Prices are our rate card. Banners, the city Guide placement and the Marketing Dashboard run all year and are on <a href="#/package" style="color:var(--g);font-weight:800;text-decoration:none">Your Package</a>.</p>';
  }
  function eventPage(id, sub) {
    var e = ev(id); if (!e) return null;
    if (!EVT.some(function (t) { return t[0] === sub; })) sub = 'results';
    var S = SERIES[e.s], sib = EVENTS.filter(function (x) { return x.s === e.s; });
    var pick = sib.length > 1 ? '<label class="sr-pick"><span>Switch ' + (e.s === 'feeder' ? 'city' : 'event') + '</span><select id="srPick" aria-label="Switch between ' + esc(S.many) + '">' +
      sib.map(function (x, i) { return '<option value="' + x.id + '"' + (x.id === e.id ? ' selected' : '') + '>' + (i + 1) + '. ' + esc(day(x.d) + ': ' + (e.s === 'feeder' ? x.city : e.s === 'mb' ? 'Marisol Bay ' + x.sub.split(',')[0] : x.sub.split(', ')[1])) + '</option>'; }).join('') + '</select></label>' : '';
    var top = '<div class="sr-evhead"><div>' + head(S.label + ', Q' + e.q, evTitle(e)) +
      '<p class="sr-evline">' + esc(evDate(e)) + ' &middot; ' + esc(e.city) + ' &middot; ' + esc(e.venue) + (e.sub ? ' &middot; ' + esc(e.sub.replace(/^#\d+, /, '')) : '') + '</p></div>' + pick + '</div>';
    var tb = tabs(EVT.map(function (t) { return [t[0], '#/event/' + e.id + '/' + t[0], t[1]]; }), sub);
    var body = '';
    if (sub === 'results') {
      var list = [[n(e.att), e.s === 'vf' ? 'People at VegFest' : 'People attended', e.s === 'expo' ? 'Two days' : '', true], [n(e.chk), 'Check-ins', S.chkS], [n(e.mem), 'New members', 'Joined at the event'], [n(e.vis), S.visL, S.visS]];
      if (e.s === 'vf') list = list.concat([[n(e.iv), 'Interviews'], [n(e.clips), 'Clips'], [n(e.views), 'Clip views', 'Through December 31']]);
      if (e.s === 'expo') list = list.concat([[n(e.rooms), 'Hotel room nights', 'Through the Expo\'s block'], [n(e.gala), 'Guests at the Gala', 'Friday evening'], [n(e.booth), 'Booth visitors'], [n(e.leads), 'Trip planner sign-ups']]);
      list.push([n(e.clk + e.email.clk), 'Tracked clicks', 'RSVP page, QR trip code and invite email']);
      body = card('How to use this page', 'How to read this event', e.pic, [
        '<b>Results</b> are the numbers from the event. <b>Where people saw it</b> is every channel that promoted it.',
        '<b>Presented by Visit Marisol Bay</b> shows every place your name appeared, and <b>The opportunity</b> what it costs.' + (pick ? ' Switch events with the dropdown in the corner.' : '')
      ]) + stats(list) + insight(e.ins);
    } else if (sub === 'seen') {
      var rows = seenRows(e);
      body = table([['Channel'], ['What ran'], ['Reach', 1], ['Clicks', 1]], rows.map(function (r) { return ['<b>' + esc(r[0]) + '</b>', esc(r[1]), n(r[2]), n(r[3])]; }), ['Total', '', n(sum(rows, 2)), n(sum(rows, 3))]) +
        '<p class="sr-note">Reach is the people each channel showed it to: posts and banners count views, the Pulse and stories count reads, the podcast counts downloads, email counts opens. Pulse, podcast and banner rows also count on their own pages.</p>' +
        h5('Snapshots') + '<div class="sr-snaps">' + mock(socialMock(e), 'Drawn mock: the ' + e.social[0].p + ' post', 'A drawing of the post, marked as a paid partnership with Visit Marisol Bay.') +
        (e.pulse.length ? snap(IMG + 'snap-pulse-feature.jpg', 'A sponsor topic in the Daily Pulse', 'How a sponsorship post sits in the city\'s morning briefing.', ['See all the posts', '#/pulse']) : '') +
        (e.pod.length ? mock(podMock(e), 'Drawn mock: the host read', 'The read for this event, as it appears in the show notes. The audio is Coming.', 'wide') : '') + '</div>';
    } else if (sub === 'presented') {
      var snaps = e.s === 'expo' ? mock(boothMock(), 'Drawn mock: Booth 1', 'A drawing, not a photo: the booth by the main doors.') + mock(galaMock(), 'Drawn mock: the Gala stage', 'A drawing, not a photo: the Vegans Explore Gala, presented by Visit Marisol Bay.') + snap(IMG + 'snap-calendar-event.jpg', 'On the hub\'s calendar', 'The sponsor\'s events lead the calendar, with its name in the title.', ['Open the calendar', HUB + '?tab=events'], 'wide')
        : e.s === 'vf' ? mock(cornerMock(), 'Drawn mock: the Media Corner', 'A drawing, not a photo: the backdrop with both names, and two seats for the interviews.') + snap(IMG + 'snap-sponsor-story.jpg', 'The sponsor\'s story on the hub', 'The sponsor\'s stories sit under the Daily Pulse on the city hub.', ['Open it', HUB + '?tab=news'])
        : mock(signMock(e), 'Drawn mock: the welcome sign', 'A drawing, not a photo: the sign at the door and the sponsor\'s table.') + snap(IMG + (e.s === 'mb' ? 'snap-sponsor-strip.jpg' : 'snap-calendar-event.jpg'), e.s === 'mb' ? 'On the hub\'s Overview' : 'On the calendar', e.s === 'mb' ? 'Presented by Visit Marisol Bay, right under the community\'s card.' : 'The event leads the calendar, with the sponsor in its title.', ['Open the sample hub', HUB + (e.s === 'mb' ? '' : '?tab=events')]);
      body = '<ul class="sr-inc">' + presented(e).map(function (x) { return '<li><b>' + esc(x[0]) + '.</b> ' + esc(x[1]) + '</li>'; }).join('') + '</ul>' + h5('Snapshots') + '<div class="sr-snaps">' + snaps + '</div>';
    } else {
      body = opportunity(e);
    }
    var i = EVENTS.indexOf(e), prev = EVENTS[i - 1], nxt = EVENTS[i + 1];
    var pn = '<div class="wg-gs-btns" style="margin:4px 0 22px">' + (prev ? '<a class="dg-btn dg-ghost" href="#/event/' + prev.id + '">Previous event</a>' : '') + '<a class="dg-btn" href="#/campaigns/q' + e.q + '">Back to Q' + e.q + '</a>' + (nxt ? '<a class="dg-btn dg-ghost" href="#/event/' + nxt.id + '">Next event</a>' : '') + '</div>';
    return crumb([['Campaigns', '#/campaigns'], ['Q' + e.q, '#/campaigns/q' + e.q], [evTitle(e)]]) + top + tb + body + pn;
  }

  // ---------- the channel pages ----------
  var VIEWS = {
    goals: goals,
    pulse: function () {
      return sectionPage('pulse', { kicker: 'All year', title: 'Twenty-five posts in the morning briefing', pic: PIC + 'restaurant-guide/t-pulse.jpg',
        how: ['<b>The Daily Pulse</b> is each city\'s short morning briefing. A sponsorship post is one of its topics for the day, marked as the sponsor\'s.', '<b>Every post is listed</b> below with the city it ran in, the event it promoted, its reads and its tracked clicks.'],
        go: ['See the Pulse on the sample hub', HUB + '?tab=news'], ctaTitle: 'See a sponsor post in the Pulse.', ctaText: 'Today\'s Marisol Bay topic on the sample hub is the sponsor\'s festival.',
        body: stats([[n(PULSE.length), 'Sponsorship posts', 'Two a month, more around the Expo', true], [n(T.pReads), 'Reads'], [n(Math.round(T.pReads / PULSE.length)), 'Reads a post', 'On average'], [n(T.pClk), 'Tracked clicks', pct(T.pClk, T.pReads) + ' of reads']]) +
          h5('Where people saw it') + '<div class="sr-snaps">' + snap(IMG + 'snap-pulse-feature.jpg', 'A sponsor topic in the Daily Pulse', 'The sponsor\'s festival as the day\'s Marisol Bay topic, with the conversation under it.', ['Open the Pulse', HUB + '?tab=news']) + '</div>' +
          h5('All ' + PULSE.length + ' posts') +
          table([['Date'], ['City\'s Pulse'], ['Post'], ['Event'], ['Reads', 1], ['Clicks', 1]], PULSE.map(function (x) {
            var e = ev(x.ev); return [day(x.d), esc(x.hub), '<b>' + esc(x.t) + '</b>', e ? '<a href="#/event/' + e.id + '/seen">' + esc(evTitle(e)) + '</a>' : '', n(x.reads), n(x.clk)];
          }), ['Total', '', PULSE.length + ' posts', '', n(T.pReads), n(T.pClk)])
      });
    },
    podcast: function () {
      var e = ev('marisol-bay-1');
      return sectionPage('podcast', { kicker: 'All year', title: 'Ten host reads on SoFlo Vegans', pic: PIC + 'holiday/p-listen.jpg',
        how: ['<b>The host reads it.</b> A 30-second sponsor read in the episode, and a tracked link in the show notes.', '<b>Downloads</b> count each episode\'s first 30 days. The read is shown as text; the audio is Coming.'],
        go: ['See our shows in Media', '/media'], ctaTitle: 'See our shows.', ctaText: 'SoFlo Vegans is one of the Vegans Explore shows in Media, every episode playable on the page.',
        body: stats([[n(POD.length), 'Host reads', 'One per episode', true], [n(T.podDl), 'Downloads', 'First 30 days of each episode'], [n(Math.round(T.podDl / POD.length)), 'Downloads an episode', 'On average'], [n(T.podClk), 'Tracked clicks', 'From the show notes']]) +
          h5('The read') + '<div class="sr-snaps">' + mock(podMock(e), 'Drawn mock: an episode with its sponsor read', 'The text the host reads, as it appears in the show notes. The audio is Coming.', 'wide') + '</div>' +
          h5('The ten episodes') +
          table([['Episode'], ['Date'], ['Title'], ['Event'], ['Downloads', 1], ['Clicks', 1]], POD.map(function (x) {
            var v = ev(x.ev); return [String(x.ep), day(x.d), '<b>' + esc(x.t) + '</b>', v ? '<a href="#/event/' + v.id + '/seen">' + esc(evTitle(v)) + '</a>' : '', n(x.dl), n(x.clk)];
          }), ['Total', '', POD.length + ' episodes', '', n(T.podDl), n(T.podClk)])
      });
    },
    banners: function () {
      return sectionPage('banners', { kicker: 'All year', title: '250,000 impressions on the South Florida, Central Florida and Atlanta hubs', pic: IMG + 'snap-billboard.jpg',
        how: ['<b>Programmatic</b> means the banners are placed for you: the right size on the right screen, across the hubs you chose.', '<b>Click rate</b> is clicks divided by impressions. Read the table by hub, then by size.'],
        go: ['See the billboard on the sample hub', HUB + '?tab=news'], ctaTitle: 'See the billboard where it runs.', ctaText: 'The tall 300 x 600 sits beside every section of the hub.',
        body: stats([[n(T.banImp), 'Impressions', 'January to December', true], [n(T.banClk), 'Clicks'], [pct(T.banClk, T.banImp), 'Click rate'], [n(T.banFeedV), 'Feeder-city visitors', 'From the Central Florida and Atlanta hubs, tracked'], [money(RATE.ban), 'Per 1,000 impressions', 'Our rate card']]) +
          h5('By community hub') +
          table([['Hub'], ['Impressions', 1], ['Clicks', 1], ['Click rate', 1]], BAN_HUB.map(function (x) {
            return ['<b>' + esc(x.hub) + '</b>', n(x.imp), n(x.clk), pct(x.clk, x.imp)];
          }), ['Total', n(sum(BAN_HUB, 'imp')), n(sum(BAN_HUB, 'clk')), pct(sum(BAN_HUB, 'clk'), sum(BAN_HUB, 'imp'))]) +
          h5('By size') +
          table([['Size'], ['Where it shows'], ['Impressions', 1], ['Clicks', 1], ['Click rate', 1]], BAN_SIZE.map(function (x) {
            return ['<b>' + esc(x.size) + '</b>', esc(x.where), n(x.imp), n(x.clk), pct(x.clk, x.imp)];
          }), ['Total', '', n(sum(BAN_SIZE, 'imp')), n(sum(BAN_SIZE, 'clk')), pct(sum(BAN_SIZE, 'clk'), sum(BAN_SIZE, 'imp'))]) +
          h5('Where people saw it') + '<div class="sr-snaps">' + snap(IMG + 'snap-billboard.jpg', 'The billboard, 300 x 600', 'Beside every section of the hub, on desktop.', ['Open the hub', HUB + '?tab=news'], 'tall') + '</div>'
      });
    },
    dashboard: function () {
      var max = Math.max.apply(null, MONTHS.map(function (m) { return m.clk; })), top = MONTHS.map(function (m) { return m.clk; }).indexOf(max);
      var bars = '<div class="sr-chart"><h4>Tracked clicks to Visit Marisol Bay, by month</h4><p>Every channel together. Hover a month for its number; open it for that month\'s report.</p>' +
        '<div class="sr-bars" role="img" aria-label="Tracked clicks by month in 2027, highest in ' + MON[top] + ' with ' + n(max) + '">' + MONTHS.map(function (m, i) {
          var h = Math.round(m.clk / max * 100) + '%';
          return '<a class="sr-bar" style="--h:' + h + '" href="#/dashboard/m' + (i + 1) + '" aria-label="' + MON[i] + ': ' + n(m.clk) + ' clicks"><i style="height:' + h + '"></i>' + (i === top ? '<em>' + n(m.clk) + '</em>' : '') + '<span class="tip">' + MON[i] + ': ' + n(m.clk) + ' clicks</span></a>';
        }).join('') + '</div><div class="sr-xl">' + MON.map(function (x) { return '<span>' + x.slice(0, 3) + '</span>'; }).join('') + '</div></div>';
      var chRows = CH.slice().sort(function (a, b) { return YEAR.ch[b] - YEAR.ch[a]; }).map(function (k) { return ['<b>' + esc(k) + '</b>', n(YEAR.ch[k]), pct(YEAR.ch[k], YEAR.clk).replace(/(\.\d)\d/, '$1')]; });
      var quarters = '<a class="sr-rep" href="#/dashboard/year" style="background:var(--gl);border-color:var(--gm)"><small>Year-end report</small><b>2027</b><span>' + n(YEAR.clk) + ' clicks, ' + n(YEAR.att) + ' at events, ' + n(YEAR.vis) + ' out-of-town visitors.</span></a>' + [1, 2, 3, 4].map(function (q) {
        var s = span(qMonths(q));
        return '<a class="sr-rep" href="#/dashboard/q' + q + '"><small>Quarterly report</small><b>Q' + q + ' 2027</b><span>' + QN[q] + ': ' + n(s.clk) + ' clicks, ' + n(s.imp) + ' impressions, ' + n(s.att) + ' at events.</span></a>';
      }).join('');
      var months = MONTHS.map(function (m, i) { return '<a href="#/dashboard/m' + (i + 1) + '"' + (i === 11 ? ' class="hi"' : '') + '>' + MON[i] + '<span>' + n(m.clk) + ' clicks</span></a>'; }).join('');
      return sectionPage('dashboard', { kicker: 'Included', title: 'Your traffic, any day of the year', pic: PIC + 'restaurant-guide/t-dashboard.jpg',
        how: ['<b>The chart</b> is the traffic Vegans Explore sent you each month. Every click went through a tracked link, so each one is counted once.', '<b>The reports</b> are below: the year, each quarter and each month. December closes the year.'],
        go: ['See the sponsor\'s results on the hub', HUB + '?tab=sponsors'], ctaTitle: 'See the sponsor\'s view on the hub.', ctaText: 'The sample hub\'s Sponsors tab shows the campaign card the sponsor sees, with its quarterly report.',
        body: stats([[n(YEAR.clk), 'Tracked clicks', 'All of 2027', true], [MON[top], 'Busiest month', n(max) + ' clicks: the Expo and fall VegFest'], [n(YEAR.vis), 'Out-of-town visitors', 'Tracked'], [n(YEAR.chk), 'Check-ins at local businesses']]) +
          bars + h5('Clicks by channel') + table([['Channel'], ['Clicks', 1], ['Share', 1]], chRows, ['Total', n(YEAR.clk), '100%']) +
          h5('Year-end and quarterly reports') + '<div class="sr-reps">' + quarters + '</div>' +
          h5('Monthly reports') + '<div class="sr-months">' + months + '</div>' +
          h5('What the sponsor sees on the hub') + '<div class="sr-snaps">' + snap(IMG + 'snap-sponsor-results.jpg', 'The campaign card on the hub', 'The quarter\'s headline numbers on the hub\'s Sponsors tab, with the report a click away.', ['Open it', HUB + '?tab=sponsors'], 'wide') + '</div>'
      });
    },
    package: function () {
      var rows = LINES.map(function (l) { return ['<a href="' + l[3] + '">' + esc(l[0]) + '</a>', n(l[1]), money(l[2]), money(l[1] * l[2])]; });
      rows.push(['<b>Marketing Dashboard</b>, monthly and quarterly reports', '1', 'Included', 'Included']);
      rows.push(['<b>Airport Guide placement</b>', '', 'Coming', 'Coming']);
      return sectionPage('package', { kicker: 'The full package', title: 'Everything on this report, in one sponsorship', pic: PIC + 'restaurant-guide/t-promos.jpg',
        how: ['<b>Every line</b> is a campaign on this report, priced from our rate card. Open one to see it.', '<b>The package</b> is everything together for the year, at about ' + Math.floor(SAVE / ALACARTE * 100) + '% off buying each one on its own.'],
        go: ['See the campaigns', '#/campaigns'], ctaTitle: 'See what the package delivered.', ctaText: 'Every event in the package, quarter by quarter, with results.',
        body: '<div class="sr-price"><div><b>The full package, 2027</b><p>' + money(PACKAGE_Q) + ' a quarter. Bought one at a time, the same campaigns come to ' + money(ALACARTE) + '.</p></div><strong>' + money(PACKAGE) + '<small>for the year</small></strong></div>' +
          stats([[money(PACKAGE), 'The package', 'For 2027', true], [money(PACKAGE_Q), 'A quarter'], [money(ALACARTE), 'A la carte', 'Our rate card'], [money(SAVE), 'You save', 'About ' + Math.floor(SAVE / ALACARTE * 100) + '%']]) +
          h5('What is in it') + table([['Item'], ['Quantity', 1], ['Rate', 1], ['Value', 1]], rows, ['A la carte total', '', '', money(ALACARTE)]) +
          '<p class="sr-note">Rates are our rate card. The city Guide placement puts the sponsor\'s card in the Marisol Bay city Guide each quarter: ' + n(T.gViews) + ' views and ' + n(T.gClk) + ' clicks in 2027 (sample).</p>'
      });
    }
  };

  // One report (the year, a quarter or a month), its own view: #/dashboard/year, #/dashboard/q1 to q4, #/dashboard/m1 to m12.
  function report(key) {
    var y = key === 'year', q = /^q([1-4])$/.exec(key), m = /^m([1-9]|1[0-2])$/.exec(key);
    if (!y && !q && !m) return null;
    var ms = y ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : q ? qMonths(+q[1]) : [m[1] - 1];
    var s = span(ms), name = y ? 'Year-end 2027' : q ? 'Q' + q[1] + ' 2027' : MON[ms[0]] + ' 2027', range = y ? 'January to December 2027' : q ? MON[ms[0]] + ' to ' + MON[ms[2]] + ' 2027' : MON[ms[0]] + ' 2027';
    var ran = [];
    s.evs.forEach(function (x) { ran.push([x.d, SERIES[x.s].label, '<a href="#/event/' + x.id + '">' + esc(evTitle(x)) + '</a>', headline(x)]); });
    s.stor.forEach(function (x) { ran.push([x.d, 'Sponsor story', esc(x.t), n(x.reads) + ' reads, ' + n(x.clk) + ' clicks']); });
    s.pulse.forEach(function (x) { ran.push([x.d, 'Daily Pulse post', esc(x.t + ' (' + x.hub + ')'), n(x.reads) + ' reads, ' + n(x.clk) + ' clicks']); });
    s.pod.forEach(function (x) { ran.push([x.d, 'SoFlo Vegans read', esc('Episode ' + x.ep + ': ' + x.t), n(x.dl) + ' downloads']); });
    ran.sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
    var chRows = CH.filter(function (k) { return s.ch[k]; }).sort(function (a, b) { return s.ch[b] - s.ch[a]; }).map(function (k) { return ['<b>' + esc(k) + '</b>', n(s.ch[k])]; });
    var nav;
    if (y) nav = '<a class="dg-btn" href="#/dashboard">Back to the dashboard</a>';
    else {
      var i = q ? +q[1] : +m[1], prev = q ? (i > 1 ? 'q' + (i - 1) : '') : (i > 1 ? 'm' + (i - 1) : ''), nxt = q ? (i < 4 ? 'q' + (i + 1) : 'year') : (i < 12 ? 'm' + (i + 1) : '');
      nav = (prev ? '<a class="dg-btn dg-ghost" href="#/dashboard/' + prev + '">Previous</a>' : '') + '<a class="dg-btn" href="#/dashboard">Back to the dashboard</a>' + (nxt ? '<a class="dg-btn dg-ghost" href="#/dashboard/' + nxt + '">Next</a>' : '');
    }
    return crumb([['Marketing Dashboard', '#/dashboard'], [name]]) + head(y ? 'Year-end report' : q ? 'Quarterly report' : 'Monthly report', 'Visit Marisol Bay: ' + name) +
      card('Your report', range, PIC + 'restaurant-guide/t-dashboard.jpg', [
        '<b>What ran</b> is listed below by date, then the clicks each channel sent.',
        '<b>Sample results.</b> Every number is made up for the simulation, and adds up to the year on the dashboard.'
      ], nav + '<span class="sr-soon">PDF: Coming</span>') +
      stats([[n(s.clk), 'Tracked clicks', '', true], [n(s.imp), 'Banner impressions'], [n(s.att), 'Event attendance'], [n(s.vis), 'Out-of-town visitors'], [n(s.chk), 'Check-ins'], [n(s.mem), 'New members'], [n(s.reads), 'Pulse reads'], [n(s.dl), 'Podcast downloads']]) +
      h5('What ran') + table([['Date'], ['Campaign'], ['What'], ['Result']], ran.map(function (r) { return [day(r[0]), esc(r[1]), '<b>' + r[2] + '</b>', esc(r[3])]; })) +
      h5('Clicks by channel') + table([['Channel'], ['Clicks', 1]], chRows, ['Total', n(s.clk)]);
  }

  // ---------- menu and V, from welcome-guide.js ----------
  function drawMenu(cur) {
    menuEl.innerHTML = TABS.map(function (t) { return '<a href="' + href(t.k) + '"' + (t.k === cur ? ' aria-current="page"' : '') + '>' + esc(t.label) + '</a>'; }).join('');
    menuSel.innerHTML = TABS.map(function (t, i) { return '<option value="' + t.k + '"' + (t.k === cur ? ' selected' : '') + '>' + (i + 1) + '. ' + esc(t.label) + '</option>'; }).join('');
  }
  document.documentElement.classList.toggle('dg-dd', TABS.length > 5);
  menuSel.addEventListener('change', function () { location.hash = href(menuSel.value); });
  function setFold(folded) {
    railEl.classList.toggle('dg-folded', folded);
    foldBtn.textContent = folded ? 'Show V' : 'Hide V'; foldBtn.setAttribute('aria-expanded', String(!folded));
  }
  foldBtn.addEventListener('click', function () { setFold(!railEl.classList.contains('dg-folded')); });
  function drawV(say) {
    var t = tab(curTab), i = TABS.indexOf(t);
    bubble.textContent = say || t.say;
    tourEl.innerHTML = tourM.innerHTML = '<a class="dg-tnav" href="' + href(TABS[Math.max(0, i - 1)].k) + '"' + (i ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Back</a><span>' + (i + 1) + ' of ' + TABS.length + '</span>' +
      '<a class="dg-tnav next" href="' + href(TABS[Math.min(TABS.length - 1, i + 1)].k) + '"' + (i < TABS.length - 1 ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Next</a>';
  }
  var lastEvent = '';
  function route() {
    var parts = location.hash.replace(/^#\/?/, '').split(/[?\/]/), k = parts[0] || 'overview', html = null, say = '', keep = false;
    if (k === 'dashboard' && parts[1]) {
      html = report(parts[1]);
      if (html) say = 'This is one report on its own page. Share its link, or step to the previous or next one with the buttons.'; // DRAFT line, not recorded
    }
    if (k === 'event' && parts[1]) {
      html = eventPage(parts[1], parts[2]);
      if (html) { var e = ev(parts[1]); say = EV_SAY[e.s]; keep = lastEvent && ev(lastEvent) && ev(lastEvent).s === e.s; lastEvent = e.id; k = 'campaigns'; }
    } else lastEvent = '';
    if (k === 'campaigns' && !html) html = campaigns(parts[1]);
    if (!html) { if (k !== 'overview' && !VIEWS[k]) k = 'overview'; html = k === 'overview' ? overview() : VIEWS[k](); }
    curTab = k;
    main.innerHTML = html;
    var pk = document.getElementById('srPick');
    if (pk) pk.addEventListener('change', function () { var cur = location.hash.split('/')[3] || 'results'; location.hash = '#/event/' + pk.value + '/' + cur; });
    drawMenu(curTab); drawV(say);
    if (!keep) window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  tourM.addEventListener('click', function (e) { if (e.target.closest('.dg-tnav')) setTimeout(function () { railEl.scrollIntoView({ block: 'start' }); }, 0); });
  // V has no entry in VE_GUIDE_ART: the Show me button (ve-guide-min.js) gets her scene picture.
  function miniPic() { var i = document.querySelector('.dg-mini i'); if (i) i.style.backgroundImage = "url('" + V_PIC + "')"; else setTimeout(miniPic, 200); }
  route(); miniPic();
})();
