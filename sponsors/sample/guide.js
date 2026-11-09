/* The Sample sponsor's 2027 End of Year Report (Sean, 2026-11-09: "They need to see what a campaign looks like. I would want to take
 * them to a 2027 End of Year Report. A simulation of what a demo sponsor did with Vegans Explore... So we set it up as a Guide in the
 * style of the Welcome Guide so they are walked through how to use it and then can walk through each opportunity").
 * Template gate: the page is a copy of /mocks/nominate/index.html (the first standalone copy of passport.html?guide=welcome) and this file
 * follows /mocks/nominate/guide.js and guide-scripts/welcome-guide.js: head, crumb, the Getting started card, artRow, sectionPage (How to
 * use this page, the parts as rows, one See it for yourself call to action), the rail's Back / N of M / Next, the numbered dropdown menu
 * when there are more than 5 tabs (html.dg-dd).
 * The sponsor is the made-up Visit Marisol Bay, the presenting sponsor of the sample hub (/communities/sample, public/ve-hubs.js
 * VE_SAMPLE_HUB). Every number below is a made-up sample result for 2027, and every total on the page is added up from these rows, so
 * the numbers always agree with each other. Real places (Orlando, Tampa, St. Petersburg, Atlanta) appear only as places.
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
    '@media (max-width:560px){.sr-pod{padding-top:40px;}.sr-t{font-size:12.5px;}.sr-t th,.sr-t td{padding:8px;}.sr-stat b{font-size:22px;}.sr-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}.sr-stat{padding:12px;}.sr-stat span{font-size:10px;letter-spacing:.06em;}}'
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

  // ---------- the 2027 sample data (made up; every total on the page is added up from here) ----------
  // Community Nights in Marisol Bay: date, host, area, theme, attended, businesses featured, check-ins in the 30 days after, tracked clicks.
  var NIGHTS = [
    { d: '2027-02-18', host: 'Green Leaf Kitchen', area: 'Marisol Bay', theme: 'The Bay Brunch Trail kickoff', att: 142, biz: 6, chk: 211, clk: 262, pic: BIZ + 's-room-wide.webp' },
    { d: '2027-05-20', host: 'Tidepool Tacos', area: 'Marisol Beach', theme: 'Tacos at sundown', att: 168, biz: 7, chk: 248, clk: 296, pic: BIZ + 's-outside-day.webp' },
    { d: '2027-08-19', host: 'Mangrove & Mint', area: 'Port Marisol', theme: 'Summer supper on the harbor', att: 186, biz: 8, chk: 276, clk: 318, pic: BIZ + 's-banquette.webp' },
    { d: '2027-11-11', host: 'Seagrape Supper Club', area: 'Seagrape Key', theme: 'A ThanksLiving preview', att: 214, biz: 9, chk: 323, clk: 360, pic: BIZ + 's-outside-dusk.webp' }
  ];
  // Feeder-city Community Nights: where Marisol Bay's next visitors live. vis = attendees who then visited Marisol Bay (a trip code or a
  // check-in at a Marisol Bay business within six months), chk = their check-ins there.
  var FEEDER = [
    { d: '2027-03-25', city: 'Orlando', hub: 'Central Florida', venue: 'a Vegan restaurant downtown', att: 156, vis: 29, chk: 68, clk: 214, pic: '/communities/central-florida/banner.jpg' },
    { d: '2027-06-17', city: 'Tampa', hub: 'Central Florida', venue: 'a Vegan cafe in Seminole Heights', att: 134, vis: 24, chk: 55, clk: 188, pic: '/communities/central-florida/banner.jpg' },
    { d: '2027-09-09', city: 'St. Petersburg', hub: 'Central Florida', venue: 'a Vegan bar on Central Avenue', att: 118, vis: 19, chk: 44, clk: 162, pic: '/communities/central-florida/banner.jpg' },
    { d: '2027-10-14', city: 'Atlanta', hub: 'Atlanta', venue: 'a Vegan restaurant in Old Fourth Ward', att: 198, vis: 44, chk: 107, clk: 296, pic: '/communities/atlanta/banner.jpg' }
  ];
  // The World Vegan Expo, a Vegans Explore event. Its city and dates are set for this simulation only.
  var EXPO = { d: '2027-10-16', end: '2027-10-17', city: 'Atlanta', att: 12400, booth: 2860, leads: 1140, vis: 212, clk: 1450, stage: 4 };
  // VegFest Media Corners in Marisol Bay: interviews and clips captured, views of those clips, tracked clicks from them.
  var VEGFEST = [
    { d: '2027-03-13', name: 'Marisol Bay VegFest, spring', att: 8200, iv: 16, clips: 38, views: 96000, clk: 780 },
    { d: '2027-10-30', name: 'Marisol Bay VegFest, fall', att: 9600, iv: 21, clips: 46, views: 128000, clk: 942 }
  ];
  // Daily Pulse sponsorship posts: date, the city's Pulse it ran in, title, reads, tracked clicks.
  var PULSE = [
    ['2027-01-07', 'Marisol Bay', 'Visit Marisol Bay\'s 2027 plant-based calendar is out', 3420, 128],
    ['2027-01-21', 'Central Florida', 'Two hours south: a Vegan weekend in Marisol Bay', 2610, 104],
    ['2027-02-04', 'Marisol Bay', 'The Bay Brunch Trail opens with a Community Night', 3880, 151],
    ['2027-02-25', 'Atlanta', 'Trade the cold for the bay: a February escape', 2240, 92],
    ['2027-03-08', 'Marisol Bay', 'VegFest returns to Bayfront Park this Saturday', 4610, 186],
    ['2027-03-18', 'Central Florida', 'Orlando, meet Marisol Bay: a Community Night next week', 2930, 109],
    ['2027-04-08', 'South Florida', 'Five Marisol Bay patios for spring evenings', 3150, 117],
    ['2027-04-29', 'Marisol Bay', 'A free shuttle for the plant-based weekend', 3560, 132],
    ['2027-05-13', 'Marisol Bay', 'Tacos at sundown: May\'s Community Night', 3720, 140],
    ['2027-05-27', 'Atlanta', 'A long weekend on the bay, planned for you', 2380, 96],
    ['2027-06-10', 'Central Florida', 'Tampa\'s Community Night, presented by Visit Marisol Bay', 2710, 101],
    ['2027-06-24', 'South Florida', 'Summer on the bay: where to eat after the beach', 3040, 113],
    ['2027-07-15', 'Marisol Bay', 'Three new plant-based menus in Port Marisol', 3290, 121],
    ['2027-07-29', 'Central Florida', 'The drive is worth it: Marisol Bay in July', 2460, 90],
    ['2027-08-12', 'Marisol Bay', 'Summer supper on the harbor, Thursday', 3610, 135],
    ['2027-08-26', 'South Florida', 'Back-to-school breakfasts on Seagrape Key', 2870, 104],
    ['2027-09-02', 'Central Florida', 'St. Petersburg\'s Community Night is next week', 2520, 94],
    ['2027-09-23', 'Atlanta', 'Meet Visit Marisol Bay at the World Vegan Expo', 3060, 118],
    ['2027-10-07', 'Atlanta', 'Community Night in Atlanta, then the Expo', 3340, 127],
    ['2027-10-21', 'Marisol Bay', 'Fall VegFest: the Media Corner lineup', 4180, 162],
    ['2027-10-28', 'South Florida', 'Marisol Bay\'s fall weekend, in one plan', 3480, 131],
    ['2027-11-04', 'Marisol Bay', 'ThanksLiving preview at Seagrape Supper Club', 3950, 149],
    ['2027-11-18', 'Central Florida', 'Holiday travel: a plant-based Thanksgiving on the bay', 2690, 99],
    ['2027-12-02', 'Marisol Bay', 'Holiday lights and Vegan bites in Marisol Bay', 3770, 141],
    ['2027-12-16', 'South Florida', 'Your 2028 Marisol Bay plan starts here', 3010, 110]
  ].map(function (r) { return { d: r[0], hub: r[1], t: r[2], reads: r[3], clk: r[4] }; });
  // SoFlo Vegans Podcast episodes with a sponsor read: episode, date, title, downloads (first 30 days), tracked clicks from the show notes.
  var POD = [
    [124, '2027-01-14', 'Planning a Vegan getaway for the new year', 2640, 54],
    [128, '2027-02-11', 'Brunch culture and the Bay Brunch Trail', 2810, 58],
    [132, '2027-03-11', 'Inside VegFest: the vendors behind the tents', 3120, 66],
    [137, '2027-04-15', 'Restaurants adding plant-based dishes', 2730, 55],
    [141, '2027-05-13', 'Food trucks of South Florida', 2960, 61],
    [146, '2027-06-17', 'Summer travel without the stress', 2880, 59],
    [151, '2027-07-22', 'Chefs on the harbor', 2790, 57],
    [156, '2027-08-26', 'The road trip episode: Orlando to the bay', 3010, 63],
    [162, '2027-10-07', 'Live from Expo week in Atlanta', 3540, 74],
    [168, '2027-11-18', 'A plant-based ThanksLiving on the bay', 3320, 69]
  ].map(function (r) { return { ep: r[0], d: r[1], t: r[2], dl: r[3], clk: r[4] }; });
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
  // Visitors from feeder cities the banners and Pulse sent (a trip code or a check-in), and check-ins on the Bay Brunch Trail from
  // people who came through the Pulse and the banners, by month.
  var BAN_FEEDV = [30, 34, 38, 38, 40, 40, 38, 42, 42, 52, 48, 44];
  var TRAIL_CHK = [18, 21, 25, 24, 27, 27, 22, 25, 25, 34, 33, 29];
  var REACH = 386000; // estimated unique people reached across every channel (sample)

  // ---------- totals, added up ----------
  var T = {
    nightsAtt: sum(NIGHTS, 'att'), nightsChk: sum(NIGHTS, 'chk'), nightsBiz: sum(NIGHTS, 'biz'), nightsClk: sum(NIGHTS, 'clk'),
    feedAtt: sum(FEEDER, 'att'), feedVis: sum(FEEDER, 'vis'), feedChk: sum(FEEDER, 'chk'), feedClk: sum(FEEDER, 'clk'),
    vfAtt: sum(VEGFEST, 'att'), vfIv: sum(VEGFEST, 'iv'), vfClips: sum(VEGFEST, 'clips'), vfViews: sum(VEGFEST, 'views'), vfClk: sum(VEGFEST, 'clk'),
    pReads: sum(PULSE, 'reads'), pClk: sum(PULSE, 'clk'), podDl: sum(POD, 'dl'), podClk: sum(POD, 'clk'),
    banImp: sum(BAN_IMP), banClk: sum(BAN_CLK), banFeedV: sum(BAN_FEEDV), trailChk: sum(TRAIL_CHK)
  };
  T.att = T.nightsAtt + T.feedAtt + EXPO.att + T.vfAtt;
  T.clk = T.nightsClk + T.feedClk + EXPO.clk + T.vfClk + T.pClk + T.podClk + T.banClk;
  T.chk = T.nightsChk + T.feedChk + T.trailChk;
  T.feedVisitors = T.feedVis + EXPO.vis + T.banFeedV;

  // One month's numbers (0 to 11), from the rows above; a quarter or the year adds months up.
  function month(m) {
    function inM(x) { return mOf(x.d) === m; }
    var nights = NIGHTS.filter(inM), feeder = FEEDER.filter(inM), vf = VEGFEST.filter(inM), pulse = PULSE.filter(inM), pod = POD.filter(inM), expo = mOf(EXPO.d) === m ? [EXPO] : [];
    var ch = {
      'Community Nights': sum(nights, 'clk'), 'Feeder-City Nights': sum(feeder, 'clk'), 'World Vegan Expo': sum(expo, 'clk'), 'VegFest Media Corners': sum(vf, 'clk'),
      'Daily Pulse posts': sum(pulse, 'clk'), 'SoFlo Vegans Podcast': sum(pod, 'clk'), 'Banner advertising': BAN_CLK[m]
    };
    return {
      nights: nights, feeder: feeder, vf: vf, pulse: pulse, pod: pod, expo: expo, ch: ch,
      clk: sum(Object.keys(ch), function (k) { return ch[k]; }), imp: BAN_IMP[m],
      att: sum(nights, 'att') + sum(feeder, 'att') + sum(vf, 'att') + sum(expo, 'att'),
      chk: sum(nights, 'chk') + sum(feeder, 'chk') + TRAIL_CHK[m],
      vis: sum(feeder, 'vis') + sum(expo, 'vis') + BAN_FEEDV[m],
      reads: sum(pulse, 'reads'), dl: sum(pod, 'dl')
    };
  }
  function span(ms) {
    var parts = ms.map(month), out = { nights: [], feeder: [], vf: [], pulse: [], pod: [], expo: [], ch: {}, clk: 0, imp: 0, att: 0, chk: 0, vis: 0, reads: 0, dl: 0 };
    parts.forEach(function (p) {
      ['nights', 'feeder', 'vf', 'pulse', 'pod', 'expo'].forEach(function (k) { out[k] = out[k].concat(p[k]); });
      ['clk', 'imp', 'att', 'chk', 'vis', 'reads', 'dl'].forEach(function (k) { out[k] += p[k]; });
      Object.keys(p.ch).forEach(function (k) { out.ch[k] = (out.ch[k] || 0) + p.ch[k]; });
    });
    return out;
  }
  var MONTHS = MON.map(function (x, i) { return month(i); });

  // ---------- tabs, and V's lines ----------
  // V's lines below (say) are TEXT DRAFTS for Sean to approve. Nothing is recorded, nothing plays.
  var TABS = [
    { k: 'overview', label: 'Overview', say: 'Hi, I\'m V. This is a simulation: what a sample sponsor, Visit Marisol Bay, did with Vegans Explore in 2027. I\'ll show you how to read it, then walk you through each campaign.' }, // DRAFT line, not recorded
    { k: 'nights', label: 'Community Nights', say: 'Four nights in Marisol Bay, one a season. Each one fills a local Vegan spot, and the check-ins keep coming for a month after.' }, // DRAFT line, not recorded
    { k: 'expo', label: 'World Vegan Expo', say: 'Our biggest weekend. The sponsor\'s booth is where Marisol Bay meets thousands of people planning their next trip.' }, // DRAFT line, not recorded
    { k: 'vegfest', label: 'VegFest Media Corners', say: 'Two Media Corners at VegFest in Marisol Bay. We interview the people there, and the clips keep working long after the tents come down.' }, // DRAFT line, not recorded
    { k: 'feeder', label: 'Feeder-City Nights', say: 'Visitors come from somewhere. These four nights went to the cities that send Marisol Bay its weekend crowd, and we tracked who came.' }, // DRAFT line, not recorded
    { k: 'pulse', label: 'Daily Pulse Posts', say: 'Twenty-five posts in the Daily Pulse, the morning briefing in each city. Every one is listed here with its reads and clicks.' }, // DRAFT line, not recorded
    { k: 'podcast', label: 'SoFlo Vegans Podcast', say: 'Ten sponsor reads on SoFlo Vegans. Here is what the host said, and how many people downloaded each episode.' }, // DRAFT line, not recorded
    { k: 'banners', label: 'Banner Advertising', say: 'A quarter of a million banner impressions across three community hubs. Here is where they ran and who clicked.' }, // DRAFT line, not recorded
    { k: 'dashboard', label: 'Marketing Dashboard', say: 'This is the dashboard the sponsor opens any day of the year: traffic by month, every channel, and a report for every month and quarter.' } // DRAFT line, not recorded
  ];
  var ROOT = '2027 Report';

  var main = document.getElementById('dgMain');
  var menuEl = document.getElementById('dgMenu'), menuSel = document.getElementById('dgMenuSelect');
  var bubble = document.getElementById('dgBubble'), tourEl = document.getElementById('dgTour'), tourM = document.getElementById('dgTourM');
  var foldBtn = document.getElementById('dgFold'), railEl = document.getElementById('dgRail');
  var curTab = 'overview';
  function tab(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i].k === k) return TABS[i]; return TABS[0]; }
  function href(k) { return '#/' + (k === 'overview' ? '' : k); }

  // ---------- shared pieces, from welcome-guide.js ----------
  function head(k, h) {
    return '<div class="dg-head"><div><div class="dg-k">' + esc(k) + '<span class="sr-tag">Sample results</span></div><h2 class="dg-h1">' + esc(h) + '</h2></div></div>';
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

  // ---------- the Overview ----------
  function overview() {
    var rows = [
      [BIZ + 's-outside-dusk.webp', 'Community Nights in Marisol Bay', n(NIGHTS.length) + ' nights, ' + n(T.nightsAtt) + ' people, ' + n(T.nightsBiz) + ' local business features and ' + n(T.nightsChk) + ' check-ins in the month after.', 'nights'],
      [PIC + 'vegan-events-guide.jpg', 'World Vegan Expo', 'The sponsor\'s booth in ' + EXPO.city + ': ' + n(EXPO.booth) + ' booth visitors and ' + n(EXPO.leads) + ' trip-planner sign-ups from ' + n(EXPO.att) + ' people at the Expo.', 'expo'],
      [PIC + 'creator-guide.jpg', 'VegFest Media Corners', n(VEGFEST.length) + ' Media Corners at VegFest in Marisol Bay: ' + n(T.vfIv) + ' interviews, ' + n(T.vfClips) + ' clips and ' + n(T.vfViews) + ' views.', 'vegfest'],
      ['/communities/central-florida/banner.jpg', 'Feeder-City Community Nights', 'Orlando, Tampa, St. Petersburg and Atlanta: ' + n(T.feedAtt) + ' people, and ' + n(T.feedVis) + ' of them visited Marisol Bay afterward (tracked).', 'feeder'],
      [PIC + 'restaurant-guide/t-pulse.jpg', 'Daily Pulse Sponsorship Posts', n(PULSE.length) + ' posts in four cities\' morning briefings: ' + n(T.pReads) + ' reads and ' + n(T.pClk) + ' clicks.', 'pulse'],
      [PIC + 'holiday/p-listen.jpg', 'SoFlo Vegans Podcast', n(POD.length) + ' sponsor mentions, read by the host: ' + n(T.podDl) + ' downloads and ' + n(T.podClk) + ' clicks from the show notes.', 'podcast'],
      [IMG + 'snap-billboard.jpg', 'Programmatic Banner Advertising', n(T.banImp) + ' impressions on the South Florida, Central Florida and Atlanta hubs: ' + n(T.banClk) + ' clicks, a ' + pct(T.banClk, T.banImp) + ' click rate.', 'banners'],
      [PIC + 'restaurant-guide/t-dashboard.jpg', 'Marketing Dashboard', 'Traffic by month, every channel in one place, and a report for every month and quarter of 2027.', 'dashboard']
    ];
    return head('A simulation of 2027', 'Visit Marisol Bay, Your Year With Vegans Explore') +
      card('Getting started', 'How to use your report', V_PIC, [
        '<b>Start with the year at a glance,</b> then open any campaign for its dates, numbers and a snapshot of each ad.',
        '<b>Every click is tracked.</b> Reads, downloads, check-ins and visitors are people.',
        '<b>Monthly and quarterly reports</b> are in the Marketing Dashboard.'
      ], '<a class="dg-btn" href="#/nights">Start the walk-through</a><a class="dg-btn dg-ghost" href="#/dashboard">Open the dashboard</a>') +
      h5('2027 at a glance') +
      stats([
        [n(REACH), 'People reached', 'Estimated, unique, every channel', true],
        [n(T.att), 'Event attendance', 'At the ' + (NIGHTS.length + FEEDER.length + VEGFEST.length + 1) + ' events the sponsor was part of'],
        [n(T.banImp), 'Ad impressions', 'Banners on three community hubs'],
        [n(T.clk), 'Tracked clicks', 'To the sponsor, from every channel'],
        [n(T.chk), 'Check-ins at local businesses', 'At Vegan places in Marisol Bay'],
        [n(T.feedVisitors), 'Visitors from feeder cities', 'Tracked by trip code or check-in'],
        [n(T.pReads), 'Daily Pulse reads', PULSE.length + ' sponsorship posts'],
        [n(T.podDl), 'Podcast downloads', POD.length + ' episodes with a sponsor read']
      ]) +
      '<p class="sr-note">Sample results: Visit Marisol Bay and every number on this report are made up to show what a year of sponsorship looks like. The campaigns are ones Vegans Explore plans to run.</p>' +
      group('The campaigns, one at a time', rows.map(function (r) { return artRow(r[0], r[1], esc(r[2]), href(r[3]), 'See the results'); })) +
      cta('Walk the year with V.', 'Eight campaigns, one page each, with the numbers and a snapshot of every placement.', ['Start with Community Nights', '#/nights']);
  }

  // ---------- the eight campaigns ----------
  var VIEWS = {
    nights: function () {
      return sectionPage('nights', { kicker: 'Campaign 1 of 8', title: 'Four nights, presented by Visit Marisol Bay', pic: BIZ + 's-room-wide.webp',
        how: ['<b>Read the numbers first,</b> then each night below: where it was, who came and what happened after.', '<b>Check-ins</b> count members who checked in at a featured business in the 30 days after the night.'],
        go: ['See the sample hub\'s events', HUB + '?tab=events'], ctaTitle: 'See where the nights are listed.', ctaText: 'Every Community Night is on the city hub\'s calendar, with the sponsor\'s name on it.',
        body: stats([[n(NIGHTS.length), 'Community Nights', 'One a season', true], [n(T.nightsAtt), 'People attended'], [n(T.nightsBiz), 'Local business features'], [n(T.nightsChk), 'Check-ins after', 'Within 30 days of each night'], [n(T.nightsClk), 'Tracked clicks', 'From the night\'s QR code and RSVP page']]) +
          group('The nights', NIGHTS.map(function (x) {
            return artRow(x.pic, day(x.d, true) + ': ' + x.theme, '<b>' + esc(x.host) + ', ' + esc(x.area) + '.</b> ' + n(x.att) + ' people, ' + x.biz + ' local businesses featured, ' + n(x.chk) + ' check-ins in the 30 days after, ' + n(x.clk) + ' tracked clicks.');
          })) +
          h5('Where people saw it') +
          '<div class="sr-snaps">' + snap(IMG + 'snap-calendar-event.jpg', 'On the hub\'s calendar', 'The sponsor\'s events lead the calendar, with "presented by Visit Marisol Bay" in the title.', ['Open the calendar', HUB + '?tab=events'], 'wide') +
          snap(IMG + 'snap-sponsor-strip.jpg', 'On the hub\'s Overview', 'Presented by Visit Marisol Bay, right under the community\'s card.', ['Open the Overview', HUB], 'wide') + '</div>'
      });
    },
    expo: function () {
      var booth = '<div class="sr-mk sr-booth"><span class="sr-stamp">Sample</span><span class="sun"></span><div class="bk"><small>Visit</small><b>Marisol Bay</b><span>Sun, sand, plant-based</span></div><div class="tb"><span class="qr"></span>Plan your trip</div><span class="ve">World Vegan Expo &middot; Booth 112</span></div>';
      return sectionPage('expo', { kicker: 'Campaign 2 of 8', title: 'The sponsor\'s booth at our biggest weekend', pic: PIC + 'vegan-events-guide.jpg',
        how: ['<b>The Expo is a Vegans Explore event.</b> For this simulation it is in ' + EXPO.city + ', ' + day(EXPO.d) + ' and ' + dt(EXPO.end).getDate() + ', 2027; its real city and dates are not set yet.', '<b>Leads</b> are people who signed up at the booth for the Marisol Bay trip planner.'],
        go: ['See Vegans Explore events', '/events'], ctaTitle: 'See our events calendar.', ctaText: 'The Expo goes on the calendar like every event, with the sponsor named on its page.',
        body: stats([[n(EXPO.att), 'People at the Expo', 'Two days', true], [n(EXPO.booth), 'Booth visitors'], [n(EXPO.leads), 'Leads', 'Trip-planner sign-ups'], [n(EXPO.vis), 'Visited Marisol Bay', 'Within six months, tracked'], [n(EXPO.clk), 'Tracked clicks', 'From the booth\'s QR code']]) +
          group('What the sponsor had', [
            artRow(PIC + 'vegan-events-guide.jpg', 'A booth on the floor', 'Booth 112, by the food court: a Marisol Bay backdrop, a trip-planner sign-up and a QR code to the sponsor\'s page. ' + n(EXPO.booth) + ' visitors over two days.'),
            artRow(PIC + 'holiday/p-events.jpg', 'Named from the main stage', 'The host thanked Visit Marisol Bay from the main stage ' + EXPO.stage + ' times, between the talks people came for.'),
            artRow(PIC + 'restaurant-guide/t-promos.jpg', 'In the program and on the map', 'The sponsor\'s logo on the Expo map and in the printed and online program, with its booth marked.'),
            artRow('/communities/atlanta/banner.jpg', 'Followed by visits', n(EXPO.leads) + ' leads, and ' + n(EXPO.vis) + ' of them visited Marisol Bay within six months, by trip code or check-in.')
          ]) +
          h5('The booth') + '<div class="sr-snaps">' + mock(booth, 'Drawn mock: the sponsor\'s booth', 'A drawing, not a photo. The Expo has not happened yet; this is how the booth is laid out.', 'wide') + '</div>'
      });
    },
    vegfest: function () {
      var wall = ''; for (var i = 0; i < 12; i++) wall += i % 2 ? '<i class="b">Visit<br>Marisol Bay</i>' : '<i class="a">Vegans<br>Explore</i>';
      var corner = '<div class="sr-mk sr-corner"><span class="sr-stamp">Sample</span><div class="wall">' + wall + '</div><div class="floor"></div><span class="st l"></span><span class="st r"></span><span class="sign">Media Corner, presented by Visit Marisol Bay</span></div>';
      return sectionPage('vegfest', { kicker: 'Campaign 3 of 8', title: 'Two Media Corners at VegFest in Marisol Bay', pic: PIC + 'creator-guide.jpg',
        how: ['<b>A Media Corner</b> is our interview spot at the festival, with the sponsor\'s name on the backdrop and in every clip.', '<b>Views</b> count the clips on our social, the city hub and the podcast\'s video, through December 31.'],
        go: ['See the sample hub', HUB + '?tab=news'], ctaTitle: 'See where the clips live.', ctaText: 'Clips run on the city hub and in its Daily Pulse, beside the sponsor\'s story.',
        body: stats([[n(VEGFEST.length), 'Media Corners', 'Spring and fall', true], [n(T.vfAtt), 'People at VegFest', 'Both days together'], [n(T.vfIv), 'Interviews recorded'], [n(T.vfClips), 'Clips made'], [n(T.vfViews), 'Clip views'], [n(T.vfClk), 'Tracked clicks']]) +
          group('The festivals', VEGFEST.map(function (x) {
            return artRow(PIC + (x.d < '2027-06' ? 'creator-guide.jpg' : 'partner-official-creator.jpg'), day(x.d, true) + ': ' + x.name, n(x.att) + ' people at Bayfront Park. ' + x.iv + ' interviews with vendors, chefs and visitors, cut into ' + x.clips + ' clips with ' + n(x.views) + ' views and ' + n(x.clk) + ' tracked clicks.');
          })) +
          h5('The Media Corner') + '<div class="sr-snaps">' + mock(corner, 'Drawn mock: the Media Corner', 'A drawing, not a photo: the backdrop with both names, and two seats for the interviews.') +
          snap(IMG + 'snap-sponsor-story.jpg', 'The story on the hub', 'The sponsor\'s stories sit under the Daily Pulse on the city hub.', ['Open it', HUB + '?tab=news']) + '</div>'
      });
    },
    feeder: function () {
      return sectionPage('feeder', { kicker: 'Campaign 4 of 8', title: 'Four nights where Marisol Bay\'s visitors live', pic: '/communities/central-florida/banner.jpg',
        how: ['<b>Feeder cities</b> are the places Marisol Bay\'s weekend visitors drive or fly in from.', '<b>Visited</b> counts attendees who used their trip code or checked in at a Marisol Bay business within six months.'],
        go: ['See the sample hub', HUB], ctaTitle: 'See a city hub.', ctaText: 'Each feeder city has its own hub, where these nights, the banners and the Pulse posts run.',
        body: stats([[n(FEEDER.length), 'Feeder-city nights', 'Orlando, Tampa, St. Petersburg, Atlanta', true], [n(T.feedAtt), 'People attended'], [n(T.feedVis), 'Visited Marisol Bay', pct(T.feedVis, T.feedAtt).replace(/\.\d+/, '') + ' of attendees'], [n(T.feedChk), 'Their check-ins', 'At Marisol Bay businesses'], [n(T.feedClk), 'Tracked clicks']]) +
          group('The nights', FEEDER.map(function (x) {
            return artRow(x.pic, day(x.d, true) + ': ' + x.city, 'At ' + esc(x.venue) + ' (' + esc(x.hub) + ' hub). ' + n(x.att) + ' people; ' + x.vis + ' visited Marisol Bay afterward, with ' + x.chk + ' check-ins there, and ' + n(x.clk) + ' tracked clicks.');
          })) +
          table([['City'], ['Date'], ['Attended', 1], ['Visited Marisol Bay', 1], ['Rate', 1], ['Check-ins', 1]], FEEDER.map(function (x) {
            return ['<b>' + esc(x.city) + '</b>', day(x.d), n(x.att), n(x.vis), pct(x.vis, x.att).replace(/\.\d+/, ''), n(x.chk)];
          }), ['Total', '', n(T.feedAtt), n(T.feedVis), pct(T.feedVis, T.feedAtt).replace(/\.\d+/, ''), n(T.feedChk)])
      });
    },
    pulse: function () {
      return sectionPage('pulse', { kicker: 'Campaign 5 of 8', title: 'Twenty-five posts in the morning briefing', pic: PIC + 'restaurant-guide/t-pulse.jpg',
        how: ['<b>The Daily Pulse</b> is each city\'s short morning briefing. A sponsorship post is one of its topics for the day, marked as the sponsor\'s.', '<b>Every post is listed</b> below with the city it ran in, its reads and its tracked clicks.'],
        go: ['See the Pulse on the sample hub', HUB + '?tab=news'], ctaTitle: 'See a sponsor post in the Pulse.', ctaText: 'Today\'s Marisol Bay topic on the sample hub is the sponsor\'s festival.',
        body: stats([[n(PULSE.length), 'Sponsorship posts', 'Two a month, three in October', true], [n(T.pReads), 'Reads'], [n(Math.round(T.pReads / PULSE.length)), 'Reads a post', 'On average'], [n(T.pClk), 'Tracked clicks', pct(T.pClk, T.pReads) + ' of reads']]) +
          h5('Where people saw it') + '<div class="sr-snaps">' + snap(IMG + 'snap-pulse-feature.jpg', 'A sponsor topic in the Daily Pulse', 'The sponsor\'s festival as the day\'s Marisol Bay topic, with the conversation under it.', ['Open the Pulse', HUB + '?tab=news']) + '</div>' +
          h5('All ' + PULSE.length + ' posts') +
          table([['Date'], ['City\'s Pulse'], ['Post'], ['Reads', 1], ['Clicks', 1]], PULSE.map(function (x) {
            return [day(x.d), esc(x.hub), '<b>' + esc(x.t) + '</b>', n(x.reads), n(x.clk)];
          }), ['Total', '', PULSE.length + ' posts', n(T.pReads), n(T.pClk)])
      });
    },
    podcast: function () {
      var ep = POD[1];
      var card2 = '<div class="sr-mk sr-pod"><span class="sr-stamp">Sample</span><div class="art"><b>SoFlo<br>Vegans</b><small>Podcast</small></div><div><h4>Episode ' + ep.ep + ': ' + esc(ep.t) + '</h4><p>' + day(ep.d, true) + ', 2027 &middot; ' + n(ep.dl) + ' downloads</p>' +
        '<div class="sr-read"><small>Sponsor read, 30 seconds</small>"This episode of SoFlo Vegans is brought to you by Visit Marisol Bay. Sun, sand, plant-based. Brunch on the water, tacos on the beach and a supper club on Seagrape Key, all on the Bay Brunch Trail. Plan your weekend at vegansexplore.com/go/marisol-bay."</div>' +
        '<span class="sr-soon">Listen: Coming</span></div></div>';
      return sectionPage('podcast', { kicker: 'Campaign 6 of 8', title: 'Ten sponsor reads on SoFlo Vegans', pic: PIC + 'holiday/p-listen.jpg',
        how: ['<b>The host reads it.</b> A 30-second sponsor read in the episode, and a tracked link in the show notes.', '<b>Downloads</b> count each episode\'s first 30 days. The read is shown as text; the audio is Coming.'],
        go: ['See our shows in Media', '/media'], ctaTitle: 'See our shows.', ctaText: 'SoFlo Vegans is one of the Vegans Explore shows in Media, every episode playable on the page.',
        body: stats([[n(POD.length), 'Sponsor mentions', 'One per episode', true], [n(T.podDl), 'Downloads', 'First 30 days of each episode'], [n(Math.round(T.podDl / POD.length)), 'Downloads an episode', 'On average'], [n(T.podClk), 'Tracked clicks', 'From the show notes']]) +
          h5('The read') + '<div class="sr-snaps">' + mock(card2, 'Drawn mock: an episode with its sponsor read', 'The text the host reads, as it appears in the show notes. The audio is Coming.', 'wide') + '</div>' +
          h5('The ten episodes') +
          table([['Episode'], ['Date'], ['Title'], ['Downloads', 1], ['Clicks', 1]], POD.map(function (x) {
            return [String(x.ep), day(x.d), '<b>' + esc(x.t) + '</b>', n(x.dl), n(x.clk)];
          }), ['Total', '', POD.length + ' episodes', n(T.podDl), n(T.podClk)])
      });
    },
    banners: function () {
      return sectionPage('banners', { kicker: 'Campaign 7 of 8', title: '250,000 impressions on three community hubs', pic: IMG + 'snap-billboard.jpg',
        how: ['<b>Programmatic</b> means the banners are placed for you: the right size on the right screen, across the hubs you chose.', '<b>Click rate</b> is clicks divided by impressions. Read the table by hub, then by size.'],
        go: ['See the billboard on the sample hub', HUB + '?tab=news'], ctaTitle: 'See the billboard where it runs.', ctaText: 'The tall 300 x 600 sits beside every section of the hub.',
        body: stats([[n(T.banImp), 'Impressions', 'January to December', true], [n(T.banClk), 'Clicks'], [pct(T.banClk, T.banImp), 'Click rate'], [n(T.banFeedV), 'Feeder-city visitors', 'From the Central Florida and Atlanta hubs, tracked']]) +
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
      var year = span([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
      var chRows = Object.keys(year.ch).sort(function (a, b) { return year.ch[b] - year.ch[a]; }).map(function (k) { return ['<b>' + esc(k) + '</b>', n(year.ch[k]), pct(year.ch[k], year.clk).replace(/(\.\d)\d/, '$1')]; });
      var quarters = [0, 1, 2, 3].map(function (q) {
        var s = span([q * 3, q * 3 + 1, q * 3 + 2]);
        return '<a class="sr-rep" href="#/dashboard/q' + (q + 1) + '"><small>Quarterly report</small><b>Q' + (q + 1) + ' 2027</b><span>' + MON[q * 3] + ' to ' + MON[q * 3 + 2] + ': ' + n(s.clk) + ' clicks, ' + n(s.imp) + ' impressions, ' + n(s.att) + ' at events.</span></a>';
      }).join('');
      var months = MONTHS.map(function (m, i) { return '<a href="#/dashboard/m' + (i + 1) + '"' + (i === 11 ? ' class="hi"' : '') + '>' + MON[i] + '<span>' + n(m.clk) + ' clicks</span></a>'; }).join('');
      return sectionPage('dashboard', { kicker: 'Campaign 8 of 8', title: 'Your traffic, any day of the year', pic: PIC + 'restaurant-guide/t-dashboard.jpg',
        how: ['<b>The chart</b> is the traffic Vegans Explore sent you each month. Every click went through a tracked link, so each one is counted once.', '<b>The reports</b> are below: one for each quarter and each month. December\'s closes the year.'],
        go: ['See the sponsor\'s results on the hub', HUB + '?tab=sponsors'], ctaTitle: 'See the sponsor\'s view on the hub.', ctaText: 'The sample hub\'s Sponsors tab shows the campaign card the sponsor sees, with its quarterly report.',
        body: stats([[n(year.clk), 'Tracked clicks', 'All of 2027', true], [MON[top], 'Busiest month', n(max) + ' clicks: the Expo and fall VegFest'], [n(year.vis), 'Visitors from feeder cities', 'Tracked'], [n(year.chk), 'Check-ins at local businesses']]) +
          bars + h5('Clicks by channel') + table([['Channel'], ['Clicks', 1], ['Share', 1]], chRows, ['Total', n(year.clk), '100%']) +
          h5('Quarterly reports') + '<div class="sr-reps">' + quarters + '</div>' +
          h5('Monthly reports') + '<div class="sr-months">' + months + '</div>' +
          h5('What the sponsor sees on the hub') + '<div class="sr-snaps">' + snap(IMG + 'snap-sponsor-results.jpg', 'The campaign card on the hub', 'The quarter\'s headline numbers on the hub\'s Sponsors tab, with the report a click away.', ['Open it', HUB + '?tab=sponsors'], 'wide') + '</div>'
      });
    }
  };

  // One report (a quarter or a month), its own view: #/dashboard/q1 to q4, #/dashboard/m1 to m12.
  function report(key) {
    var q = /^q([1-4])$/.exec(key), m = /^m([1-9]|1[0-2])$/.exec(key);
    if (!q && !m) return null;
    var ms = q ? [0, 1, 2].map(function (i) { return (q[1] - 1) * 3 + i; }) : [m[1] - 1];
    var s = span(ms), name = q ? 'Q' + q[1] + ' 2027' : MON[ms[0]] + ' 2027', range = q ? MON[ms[0]] + ' to ' + MON[ms[2]] + ' 2027' : MON[ms[0]] + ' 2027';
    var ran = [];
    s.nights.forEach(function (x) { ran.push([x.d, 'Community Night', x.theme + ', ' + x.host + ', ' + x.area, n(x.att) + ' people, ' + n(x.chk) + ' check-ins after']); });
    s.feeder.forEach(function (x) { ran.push([x.d, 'Feeder-City Night', x.city, n(x.att) + ' people, ' + x.vis + ' visited Marisol Bay']); });
    s.expo.forEach(function (x) { ran.push([x.d, 'World Vegan Expo', x.city + ' (simulation)', n(x.booth) + ' booth visitors, ' + n(x.leads) + ' leads']); });
    s.vf.forEach(function (x) { ran.push([x.d, 'VegFest Media Corner', x.name, x.iv + ' interviews, ' + n(x.views) + ' clip views']); });
    s.pulse.forEach(function (x) { ran.push([x.d, 'Daily Pulse post', x.t + ' (' + x.hub + ')', n(x.reads) + ' reads, ' + n(x.clk) + ' clicks']); });
    s.pod.forEach(function (x) { ran.push([x.d, 'SoFlo Vegans read', 'Episode ' + x.ep + ': ' + x.t, n(x.dl) + ' downloads']); });
    ran.sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
    var chRows = Object.keys(s.ch).filter(function (k) { return s.ch[k]; }).sort(function (a, b) { return s.ch[b] - s.ch[a]; }).map(function (k) { return ['<b>' + esc(k) + '</b>', n(s.ch[k])]; });
    var i = q ? +q[1] : +m[1], prev = q ? (i > 1 ? 'q' + (i - 1) : '') : (i > 1 ? 'm' + (i - 1) : ''), nxt = q ? (i < 4 ? 'q' + (i + 1) : '') : (i < 12 ? 'm' + (i + 1) : '');
    var nav = (prev ? '<a class="dg-btn dg-ghost" href="#/dashboard/' + prev + '">Previous</a>' : '') + '<a class="dg-btn" href="#/dashboard">Back to the dashboard</a>' + (nxt ? '<a class="dg-btn dg-ghost" href="#/dashboard/' + nxt + '">Next</a>' : '');
    return crumb([['Marketing Dashboard', '#/dashboard'], [name]]) + head(q ? 'Quarterly report' : 'Monthly report', 'Visit Marisol Bay: ' + name) +
      card('Your report', range, PIC + 'restaurant-guide/t-dashboard.jpg', [
        '<b>What ran</b> this ' + (q ? 'quarter' : 'month') + ' is listed below by date, then the clicks each channel sent.',
        '<b>Sample results.</b> Every number is made up for the simulation, and adds up to the year on the dashboard.'
      ], nav + '<span class="sr-soon">PDF: Coming</span>') +
      stats([[n(s.clk), 'Tracked clicks', '', true], [n(s.imp), 'Banner impressions'], [n(s.att), 'Event attendance'], [n(s.chk), 'Check-ins'], [n(s.vis), 'Feeder-city visitors'], [n(s.reads), 'Pulse reads'], [n(s.dl), 'Podcast downloads']]) +
      h5('What ran') + table([['Date'], ['Campaign'], ['What'], ['Result']], ran.map(function (r) { return [day(r[0]), esc(r[1]), '<b>' + esc(r[2]) + '</b>', esc(r[3])]; })) +
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
  function route() {
    var parts = location.hash.replace(/^#\/?/, '').split(/[?\/]/), k = parts[0] || 'overview', html = null, say = '';
    if (k === 'dashboard' && parts[1]) {
      html = report(parts[1]);
      if (html) say = 'This is one report on its own page. Share its link, or step to the previous or next one with the buttons.'; // DRAFT line, not recorded
    }
    if (!html) { if (k !== 'overview' && !VIEWS[k]) k = 'overview'; html = k === 'overview' ? overview() : VIEWS[k](); }
    curTab = k;
    main.innerHTML = html;
    drawMenu(curTab); drawV(say);
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  tourM.addEventListener('click', function (e) { if (e.target.closest('.dg-tnav')) setTimeout(function () { railEl.scrollIntoView({ block: 'start' }); }, 0); });
  // V has no entry in VE_GUIDE_ART: the Show me button (ve-guide-min.js) gets her scene picture.
  function miniPic() { var i = document.querySelector('.dg-mini i'); if (i) i.style.backgroundImage = "url('" + V_PIC + "')"; else setTimeout(miniPic, 200); }
  route(); miniPic();
})();
