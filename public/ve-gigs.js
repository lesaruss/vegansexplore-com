/* ve-gigs.js: the Gig Board (Sean, 2026-10-30: "the actual mechanism for them to find gigs... like Casting Networks or Backstage
   where they can go on daily and see what opportunities are available... whatever we create, I want become the way the bounties
   work as well"). One board for every way we pay a creator or member: paid campaigns, collaborations (perks), hosting, events and
   points (the old Bounties). A gig is applied to, auditioned for or claimed; it may ask for proof (a pitch, examples, an audition,
   a rate); it may require followers on given platforms, a level or a city. Small creators rise by results (How you rise).

   One view at a time, the address carries it: #dashboard, #board, #gig/<id>, #apply/<id>/<step>, #mine[/<status>], #profile, #how.

   The creator pathway (Sean, 2026-10-30: "this really should be the guide itself... the overview explains the opportunity... a
   video with one of our guides to the right... it should be a next, next, next... the last step is the intake"): with guide: true
   (/gigs/sample) the page is a walkthrough. #overview is the landing (the opportunity, how it works, how to use the page, Kai on
   the right), then Your dashboard, Open gigs, My gigs, Your media kit (each of its four views), How you rise and Apply (#join/<n>,
   the creator application, one step per view, sent to ve-ambassador creator_apply). Back / Step N of M / Next sit at the top and
   the bottom of every step, with Kai's line on what you are looking at.

   Usage:
     VEGigs.mount(el, { demo: true, data: window.VE_GIGS_DEMO })   // /gigs/sample: nothing is sent, applying is kept for the visit
     VEGigs.mount(el, { live: true })                              // /gigs: today's bounties as points gigs (ve-bounties list)
*/
(function () {
  if (window.VEGigs) return;
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var CHEV = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23525252' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E\")";
  var CSS = [
    '.vg{font-family:Montserrat,sans-serif;color:#1a1a1a;--g:var(--vb-go-hover,#1f5f22);--gl:var(--vb-soft,#e8f5e9);--gm:var(--vb-line,#b8ddb9);--ink75:rgba(26,26,26,.75);--line:rgba(0,0,0,.1);}',
    '.vg *{box-sizing:border-box;}',
    '.vg-note{background:#fff7e8;border:1px solid #f2d7a6;border-radius:6px;padding:10px 14px;font-size:13px;line-height:1.5;margin:0 0 14px;}',
    '.vg-me{display:flex;align-items:center;gap:14px;flex-wrap:wrap;border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:0 0 12px;}',
    '.vg-av{width:56px;height:56px;border-radius:12px;background:#eef3ee center/cover no-repeat;flex:0 0 56px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px;color:var(--g);}',
    '.vg-me-main{flex:1 1 220px;min-width:0;}.vg-me-main b{font-size:16px;font-weight:900;}.vg-me-main span{display:block;font-size:12.5px;color:var(--ink75);margin-top:2px;}',
    '.vg-stats{display:flex;gap:18px;flex-wrap:wrap;}.vg-stat b{display:block;font-size:17px;font-weight:900;}.vg-stat span{font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--ink75);}',
    '.vg-tools{display:grid;grid-template-columns:minmax(200px,2fr) repeat(4,minmax(130px,1fr));gap:10px;margin:0 0 10px;}',
    '.vg input[type=search],.vg input[type=text],.vg input[type=url],.vg input[type=email],.vg input[type=tel],.vg textarea,.vg select{font:inherit;font-size:14px;padding:10px 12px;border:1px solid rgba(0,0,0,.22);border-radius:6px;background:#fff;color:#1a1a1a;width:100%;}',
    '.vg select{appearance:none;-webkit-appearance:none;background:#fff ' + CHEV + ' no-repeat right 16px center;padding-right:44px;}',
    '.vg textarea{min-height:120px;resize:vertical;line-height:1.5;}',
    '.vg-check{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:700;margin:0 0 14px;cursor:pointer;}',
    '.vg-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;}',
    '.vg-grid2{grid-template-columns:repeat(2,minmax(0,1fr));}',
    '.vg-next{font-size:13px;font-weight:700;line-height:1.4;}.vg-next.warn{color:#7a4b00;}',
    '.vg-plat.vg-sum{margin:0 0 14px;grid-template-columns:repeat(auto-fit,minmax(min(150px,100%),1fr));}',
    '.vg-chips{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px;}',
    '.vg-chips a{font-size:12px;font-weight:800;padding:8px 12px;border-radius:6px;border:1px solid var(--line);color:#1a1a1a;text-decoration:none;}',
    '.vg-chips a em{font-style:normal;color:var(--ink75);margin-left:4px;}',
    '.vg-chips a[aria-current]{background:var(--g);border-color:var(--g);color:#fff;}.vg-chips a[aria-current] em{color:#e6f4e7;}',
    '.vg-seg{display:inline-flex;flex-wrap:wrap;border:1px solid var(--line);border-radius:6px;overflow:hidden;margin:0 0 8px;}',
    '.vg-seg a{padding:9px 14px;font-size:12px;font-weight:800;color:#1a1a1a;text-decoration:none;border-right:1px solid var(--line);}',
    '.vg-seg a:last-child{border-right:0;}.vg-seg a[aria-selected=true]{background:var(--g);color:#fff;}',
    '.vg-res{display:flex;flex-direction:column;gap:8px;}.vg-res div{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 10px;align-items:center;border:1px solid var(--line);border-radius:10px;padding:10px 12px;}',
    '.vg-res b{font-size:14px;font-weight:900;}.vg-res span{grid-column:1;font-size:12.5px;color:var(--ink75);}.vg-res em{grid-column:2;grid-row:1/3;font-style:normal;}',
    '.vg-pub-head{display:flex;gap:16px;align-items:center;flex-wrap:wrap;border:1px solid var(--line);border-radius:12px;padding:16px;margin:0 0 12px;}',
    '.vg-pub-av{width:96px;height:96px;border-radius:14px;background:#eef3ee center/cover no-repeat;flex:0 0 96px;}',
    '.vg-pub-head>div:nth-child(2){flex:1 1 240px;min-width:0;}',
    '.vg-pub-vote{border:1px solid var(--gm);background:var(--gl);border-radius:10px;padding:10px 14px;text-align:center;}.vg-pub-vote b{display:block;color:var(--g);font-size:15px;}.vg-pub-vote span{font-size:11.5px;color:var(--ink75);}',
    '.vg-grid4{grid-template-columns:repeat(4,minmax(0,1fr));}',
    '.vg-go{gap:4px;}.vg-big{font-size:28px;font-weight:900;color:var(--g);line-height:1.1;}',
    '.vg-sec{font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:var(--g);margin:20px 0 10px;}',
    '.vg-n{font-style:normal;width:28px;height:28px;border-radius:6px;background:var(--g);color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center;}',
    '.vg-kit-hero{display:flex;gap:20px;align-items:center;flex-wrap:wrap;border-radius:14px;padding:28px;background:#14301c center/cover no-repeat;color:#fff;margin:0 0 12px;}',
    '.vg-kit-av{width:120px;height:120px;border-radius:16px;background:#eef3ee center/cover no-repeat;flex:0 0 120px;border:3px solid #fff;}',
    '.vg-kit-id{flex:1 1 280px;min-width:0;}.vg-kit-id span{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#c5f2c7;}',
    '.vg-kit-id h2{font-size:clamp(26px,3vw,38px);font-weight:900;margin:4px 0 6px;}.vg-kit-id p{font-size:15px;line-height:1.5;margin:0 0 10px;max-width:620px;color:#f0f5f0;}',
    '.vg-kit-hero .vg-tag{background:rgba(0,0,0,.45);color:#fff;border:1px solid rgba(255,255,255,.35);}.vg-kit-hero .vg-tag.ok{background:var(--vb-go,#2d7d31);border-color:var(--vb-go,#2d7d31);}.vg-kit-hero .vg-tag.dark{background:#fff;color:#1a1a1a;}',
    '.vg-kit-cta{display:flex;flex-direction:column;gap:8px;}.vg-kit-hero .vg-btn.ghost{background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.5);}',
    '.vg-pillars{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;}.vg-pillars div{border:1px solid var(--gm);background:var(--gl);border-radius:10px;padding:12px;}.vg-pillars b{display:block;font-size:14px;font-weight:900;}.vg-pillars span{font-size:12.5px;color:var(--ink75);}',
    '.vg-q{margin:0 0 10px;padding:10px 14px;border-left:3px solid var(--g);background:#f7faf7;font-size:14px;line-height:1.5;}.vg-q cite{display:block;font-style:normal;font-size:12px;font-weight:700;color:var(--ink75);margin-top:4px;}',
    '.vg-bars div{display:grid;grid-template-columns:110px minmax(0,1fr) 40px;gap:8px;align-items:center;font-size:12.5px;margin:4px 0;}.vg-bars i{height:8px;border-radius:6px;background:#eef3ee;overflow:hidden;}.vg-bars i b{display:block;height:100%;background:var(--g);}.vg-bars em{font-style:normal;font-weight:800;text-align:right;}',
    '.vg-sub{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin:12px 0 4px;color:var(--ink75);}',
    '.vg-hero{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(220px,1fr);gap:24px;align-items:center;margin:0 0 6px;}',
    '.vg-hero figure{margin:0;}.vg-hero img{width:100%;max-height:260px;object-fit:cover;object-position:center 30%;border-radius:12px;display:block;}',
    '.vg-hero figcaption{font-size:12px;color:var(--ink75);margin-top:6px;}',
    '.vg-card{border:1px solid var(--line);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:8px;text-decoration:none;color:inherit;background:#fff;transition:box-shadow .12s,transform .12s;}',
    '.vg-card:hover{box-shadow:0 6px 22px rgba(0,0,0,.08);transform:translateY(-1px);}',
    '.vg-card.no{opacity:.72;}',
    '.vg-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;}',
    '.vg-partner{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--ink75);}',
    '.vg-title{font-size:16px;font-weight:900;line-height:1.25;}',
    '.vg-pay{font-size:14px;font-weight:900;color:var(--g);}',
    '.vg-line{font-size:12.5px;color:var(--ink75);line-height:1.45;}',
    '.vg-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:auto;}',
    '.vg-tag{font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 8px;border-radius:6px;background:#f2f4f2;color:var(--ink75);white-space:nowrap;}',
    '.vg-tag.ok{background:var(--gl);color:var(--g);}.vg-tag.no{background:#fde8e8;color:#9b1c1c;}.vg-tag.warn{background:#fff4e0;color:#7a4b00;}.vg-tag.dark{background:#1a1a1a;color:#fff;}',
    '.vg-crumb{font-size:12.5px;font-weight:700;margin:0 0 10px;}.vg-crumb a{color:var(--g);}',
    '.vg-h{font-size:clamp(22px,2.4vw,30px);font-weight:900;line-height:1.15;margin:4px 0 8px;}',
    '.vg-two{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(280px,1fr);gap:20px;align-items:start;}',
    '.vg-box{border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin:0 0 12px;}',
    '.vg-box h3{margin:0 0 8px;font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:var(--g);}',
    '.vg-box p,.vg-box li{font-size:14px;line-height:1.55;color:var(--ink75);margin:0 0 6px;}.vg-box ul{margin:0;padding-left:18px;}',
    '.vg-req{list-style:none;padding:0 !important;}.vg-req li{display:flex;gap:10px;align-items:flex-start;}',
    '.vg-req i{flex:0 0 20px;height:20px;border-radius:6px;font-style:normal;font-weight:900;font-size:12px;display:flex;align-items:center;justify-content:center;background:var(--gl);color:var(--g);}',
    '.vg-req i.no{background:#fde8e8;color:#9b1c1c;}',
    '.vg-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:11px 20px;border-radius:6px;font:inherit;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border:none;cursor:pointer;background:var(--vb-go,#2d7d31);color:#fff;}',
    '.vg-btn:hover{background:var(--g);}.vg-btn.ghost{background:#fff;color:#1a1a1a;border:1.5px solid var(--line);}.vg-btn[disabled]{opacity:.5;cursor:default;}',
    '.vg-btns{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:12px;}',
    '.vg-steps{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px;}.vg-steps span{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:6px 10px;border-radius:6px;background:#f2f4f2;color:var(--ink75);}',
    '.vg-steps span.on{background:var(--g);color:#fff;}',
    '.vg-nav{display:flex;justify-content:space-between;align-items:center;gap:10px;border-top:1px solid var(--line);padding-top:14px;margin-top:16px;font-size:12px;font-weight:800;color:var(--ink75);}',
    '.vg-label{display:block;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;margin:12px 0 6px;}',
    '.vg-help{font-size:12.5px;color:var(--ink75);margin:6px 0 0;line-height:1.45;}',
    '.vg-claimnote{background:#f1f8f3;border:1px solid #cfe6d6;border-radius:6px;padding:10px 14px;font-size:13.5px;line-height:1.5;margin:0 0 16px;max-width:760px}',
    '.vg-claimnote button{background:none;border:0;padding:0;margin-left:6px;font:inherit;font-weight:800;color:#14532d;text-decoration:underline;cursor:pointer}',
    '.vg-err{color:#9b1c1c;font-size:13px;font-weight:700;min-height:18px;margin-top:8px;}',
    '.vg-folio{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(130px,100%),1fr));gap:10px;}',
    '.vg-folio button{border:0;padding:0;background:none;cursor:zoom-in;text-align:left;font:inherit;}',
    '.vg-folio img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:10px;display:block;background:#eef3ee;}',
    '.vg-folio small{display:block;font-size:12px;font-weight:700;margin-top:6px;line-height:1.35;}.vg-folio em{display:block;font-style:normal;font-size:11.5px;color:var(--ink75);}',
    '.vg-plat{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(160px,100%),1fr));gap:10px;}',
    '.vg-plat div{border:1px solid var(--gm);background:var(--gl);border-radius:10px;padding:12px;}.vg-plat b{display:block;font-size:20px;font-weight:900;}.vg-plat span{font-size:12px;color:var(--ink75);}',
    '.vg-tiers{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;}',
    '.vg-tier{border:1px solid var(--line);border-radius:12px;padding:14px;}.vg-tier.on{border-color:var(--g);background:var(--gl);}.vg-tier b{display:block;font-size:15px;font-weight:900;margin-bottom:4px;}.vg-tier p{font-size:13px;line-height:1.5;color:var(--ink75);margin:0;}',
    '.vg-empty{padding:30px;text-align:center;color:var(--ink75);border:1px dashed var(--line);border-radius:12px;}',
    '.vg-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1a1a1a;color:#fff;padding:12px 18px;border-radius:6px;font-size:13.5px;font-weight:700;z-index:2000;max-width:calc(100% - 32px);}',
    '.vg-lb{position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:2000;padding:16px;cursor:zoom-out;}',
    '.vg-lb img{max-width:100%;max-height:88vh;border-radius:10px;}',
    '@media (max-width:1100px){.vg-grid,.vg-tiers,.vg-grid4{grid-template-columns:repeat(2,minmax(0,1fr));}}',
    '@media (max-width:700px){.vg-grid,.vg-grid2,.vg-tiers,.vg-grid4,.vg-pillars{grid-template-columns:minmax(0,1fr);}.vg-hero{grid-template-columns:minmax(0,1fr);}}',
    '@media (max-width:1100px){.vg-tools{grid-template-columns:repeat(2,minmax(0,1fr));}.vg-tools .vg-q{grid-column:1/-1;}}',
    '@media (max-width:820px){.vg-two{grid-template-columns:minmax(0,1fr);}}',
    '.vg-tour{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;border:1px solid var(--gm);background:var(--gl);border-radius:12px;padding:10px 12px;margin:0 0 14px;}',
    '.vg-tour.bottom{margin:22px 0 0;}',
    '.vg-tour-at{flex:1 1 220px;text-align:center;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--g);}',
    '.vg-tour-at em{font-style:normal;color:#1a1a1a;}',
    '.vg-tour .vg-btn{min-height:40px;padding:9px 16px;}',
    '.vg-kai-line{display:flex;gap:12px;align-items:flex-start;margin:0 0 14px;}',
    '.vg-kai-line i{flex:0 0 48px;height:48px;border-radius:10px;background:#f2f4f2 center/cover no-repeat;}',
    '.vg-kai-line p{margin:0;background:#fff;border:1px solid var(--gm);border-radius:12px;padding:10px 14px;font-size:14px;line-height:1.5;}',
    '.vg-kai-line b{color:var(--g);}',
    '.vg-land{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(280px,1fr);gap:28px;align-items:start;}',
    '.vg-land-l>p{font-size:15.5px;line-height:1.65;color:var(--ink75);margin:0 0 12px;max-width:860px;}',
    '.vg-kick{font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:var(--g);margin:0 0 4px;}',
    '.vg-land .vg-h{font-size:clamp(26px,3vw,40px);}',
    '.vg-gets{list-style:none;padding:0;margin:0 0 6px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}',
    '.vg-gets li{border:1px solid var(--line);border-radius:12px;padding:12px 14px;font-size:13.5px;line-height:1.5;color:var(--ink75);}.vg-gets b{display:block;color:#1a1a1a;font-size:14.5px;font-weight:900;margin-bottom:2px;}',
    '.vg-use{counter-reset:u;list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;}',
    '.vg-use li{counter-increment:u;display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.5;color:var(--ink75);}',
    '.vg-use li::before{content:counter(u);flex:0 0 26px;height:26px;border-radius:6px;background:var(--g);color:#fff;font-weight:900;font-size:12px;display:flex;align-items:center;justify-content:center;}',
    '.vg-kai{position:sticky;top:calc(var(--ve-nav-h,72px) + 16px);border:1px solid var(--gm);border-radius:16px;overflow:hidden;background:#fff;}',
    '.vg-kai figure{margin:0;aspect-ratio:1/1;background:#fff center 20%/cover no-repeat;}',
    '.vg-kai-say{padding:14px 16px;border-top:1px solid var(--gm);background:var(--gl);}',
    '.vg-kai-say b{display:block;font-size:12px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:var(--g);margin-bottom:4px;}',
    '.vg-kai-say p{margin:0;font-size:14.5px;line-height:1.55;}',
    '.vg-form{max-width:900px;}',
    '.vg-field{margin:0 0 14px;}.vg-field>label,.vg-field>span{display:block;font-size:13px;font-weight:800;margin:0 0 6px;}',
    '.vg-field small{display:block;font-size:12px;color:var(--ink75);margin-top:4px;line-height:1.4;}',
    '.vg-field .req{color:#9b1c1c;}',
    '.vg-opts{display:flex;flex-wrap:wrap;gap:8px;}',
    '.vg-opts label{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:700;padding:8px 12px;border:1px solid var(--line);border-radius:6px;cursor:pointer;}',
    '.vg-opts label:has(input:checked){border-color:var(--g);background:var(--gl);}',
    '.vg-plats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 16px;}',
    '.vg-plat-row{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:8px;}',
    '.vg-err{color:#9b1c1c;font-size:13px;font-weight:700;min-height:18px;margin:6px 0 0;}',
    '.vg-pager{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:14px;margin-top:8px;}',
    '.vg-pager span{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--ink75);}',
    '@media (max-width:900px){.vg-land{grid-template-columns:minmax(0,1fr);}.vg-kai{position:static;display:grid;grid-template-columns:120px minmax(0,1fr);}.vg-kai figure{aspect-ratio:auto;min-height:120px;}.vg-kai-say{border-top:0;border-left:1px solid var(--gm);}.vg-gets,.vg-plats{grid-template-columns:minmax(0,1fr);}}',
    '@media (max-width:600px){.vg-tour-at{order:-1;flex-basis:100%;}.vg-tour{justify-content:space-between;}}',
    '.vg-thumb{flex:0 0 56px;width:56px;height:56px;border-radius:10px;background:var(--gl) center/cover no-repeat;color:var(--g);display:flex;align-items:center;justify-content:center;}',
    '.vg-tt{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:3px;}',
    '.vg-tile{gap:12px;}',
    '.vg-tile-h{display:grid;grid-template-columns:104px minmax(0,1fr);gap:14px;align-items:start;}',
    '.vg-tile-h>.vg-thumb{width:104px;height:104px;border-radius:12px;}.vg-tile-h>.vg-thumb svg{width:36px;height:36px;}',
    '.vg-tile-r{min-width:0;display:flex;flex-direction:column;gap:4px;}',
    '.vg-tile-r .vg-title{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
    '.vg-tile-r .vg-line,.vg-tile-r .vg-next{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
    '.vg-tile .vg-tags{margin-top:auto;padding-top:10px;border-top:1px solid var(--line);}',
    '.vg-tag.mode{background:#1a1a1a;color:#fff;}.vg-tag.mode.aud{background:#7a4b00;}',
    '.vg-tag.kind{background:#e9eefb;color:#2f4a8a;}',
    '.vg-tag.place{background:#fff;color:#1a1a1a;box-shadow:inset 0 0 0 1px var(--line);}',
    '@media (max-width:700px){.vg-tile-h{grid-template-columns:84px minmax(0,1fr);}.vg-tile-h>.vg-thumb{width:84px;height:84px;}}',
    '.vg-ico{flex:0 0 44px;width:44px;height:44px;border-radius:10px;background:var(--gl);color:var(--g);display:flex;align-items:center;justify-content:center;}',
    '.vg-go-top{display:flex;align-items:center;justify-content:space-between;gap:10px;}',
    '.vg-gbar{display:grid;grid-template-columns:104px minmax(0,1fr) auto;gap:8px 28px;align-items:center;border:1px solid var(--gm);background:var(--gl);border-radius:14px;padding:12px 18px 0;margin:0 0 16px;overflow:hidden;}',
    '.vg-gbar-kai{position:relative;width:104px;height:104px;}',
    '.vg-gbar-kai>i{position:absolute;inset:0;border-radius:12px;background:#fff center 15%/cover no-repeat;}',
    '.vg-gbar-kai .vg-kai-play{white-space:nowrap;position:absolute;left:6px;right:6px;bottom:6px;justify-content:center;min-height:28px;padding:4px 6px;font-size:10px;background:rgba(255,255,255,.94);box-shadow:0 2px 8px rgba(0,0,0,.15);}',
    '.vg-gbar-kai .vg-kai-play[aria-pressed=true]{background:var(--g);}',
    '.vg-gbar-at{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--g);margin:0 0 4px;}.vg-gbar-at em{font-style:normal;color:#1a1a1a;}',
    '.vg-gbar-t p{margin:0;font-size:14px;line-height:1.5;max-width:760px;}.vg-gbar-t p b{color:var(--g);}',
    '.vg-gbar-nav{display:flex;gap:12px;align-items:center;}.vg-gbar-nav .vg-btn{min-height:40px;padding:9px 16px;white-space:nowrap;}',
    '.vg-gbar-prog{grid-column:1/-1;display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:4px;margin:4px -18px 0;}',
    '.vg-gbar-prog span{height:5px;background:var(--gm);}.vg-gbar-prog span.on{background:var(--g);}',
    '@media (max-width:760px){.vg-gbar{grid-template-columns:88px minmax(0,1fr);gap:10px 12px;padding:10px 12px 0;}.vg-gbar-kai{width:88px;height:88px;}.vg-gbar-kai .vg-kai-play{left:4px;right:4px;bottom:4px;min-height:24px;padding:3px 4px;font-size:9px;letter-spacing:.04em;gap:4px;}.vg-gbar-t p{font-size:13px;line-height:1.45;}.vg-gbar-nav{grid-column:1/-1;justify-content:space-between;}.vg-gbar-nav .vg-btn{min-height:38px;padding:8px 14px;}.vg-gbar-prog{margin:2px -12px 0;}}',
    '.vg-kai-play{display:inline-flex;align-items:center;gap:6px;font:inherit;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:7px 12px;min-height:34px;border-radius:6px;border:1.5px solid var(--g);background:#fff;color:var(--g);cursor:pointer;}',
    '.vg-kai-play[aria-pressed=true]{background:var(--g);color:#fff;}',
    '.vg-kai .vg-kai-play{margin-top:10px;}',
    '.vg :focus-visible{outline:3px solid #F69820;outline-offset:2px;}'
  ].join('');

  var KIND = { campaign: 'Paid campaign', collab: 'Collaboration', hosting: 'Hosting', event: 'Event', content: 'Content', bounty: 'Bounty' };
  var MODE = { apply: 'Apply', audition: 'Audition', claim: 'Claim it' };
  var STATUS = { applied: ['Applied', ''], shortlisted: ['Shortlisted', 'ok'], audition: ['Audition requested', 'warn'], booked: ['Booked', 'ok'],
    delivered: ['Delivered, results counting', 'ok'], paid: ['Paid', 'dark'], not_selected: ['Not selected', ''] };
  var MINE_TABS = [['all', 'All'], ['applied', 'Applied'], ['shortlisted', 'Shortlisted'], ['audition', 'Audition'], ['booked', 'Booked'], ['delivered', 'Delivered'], ['paid', 'Paid'], ['not_selected', 'Not selected']];
  var ASK = {
    pitch: { name: 'Your pitch', label: 'Why you, for this one', help: 'Two or three lines: who your audience is and the angle you would take. Up to 600 characters.' },
    examples: { name: 'Examples', label: 'Links to two or three posts like this', help: 'Posts you made that show the kind of work this asks for. One link a line.' },
    audition: { name: 'Audition', label: 'Your audition video', help: 'A link to the video (unlisted YouTube, Google Drive, Dropbox or an Instagram post). One take is fine.' },
    rate: { name: 'Rate and dates', label: 'Your rate and when you can do it', help: 'The fee is the brand\'s; say if you need more and why, and the dates that work.' }
  };
  var CHAPTER_NAMES = { 'south-florida': 'South Florida', 'central-florida': 'Central Florida', 'north-florida': 'North Florida', atlanta: 'Atlanta', dc: 'Washington, D.C.',
    maryland: 'Maryland', virginia: 'Virginia', delaware: 'Delaware', 'west-virginia': 'West Virginia', philadelphia: 'Philadelphia', 'new-york': 'New York', 'los-angeles': 'Los Angeles', london: 'London' };
  var PLAT = { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', facebook: 'Facebook', podcast: 'a podcast' };

  var SVG = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var ICON = {
    campaign: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>',
    collab: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M12 8S10 3 7.5 4.5 9 8 12 8zm0 0s2-5 4.5-3.5S15 8 12 8z"/>',
    hosting: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    event: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    content: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/>',
    bounty: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    board: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    mine: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 13l2 2 4-4"/>',
    kit: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 16.5c.8-1.6 2-2.5 3.5-2.5s2.7.9 3.5 2.5M15 10h4M15 13h3"/>',
    how: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>'
  };
  function icon(k) { return SVG + (ICON[k] || ICON.bounty) + '</svg>'; }
  // A gig's picture: the partner's art when the gig has one, else the flat icon of its kind (Sean, 2026-10-30: "each one should have a
  // little square with rounded corner image... We want this to be inviting and visual").
  function thumb(img, kind) { return img ? '<span class="vg-thumb" style="background-image:url(\'' + esc(img) + '\')" aria-hidden="true"></span>' : '<span class="vg-thumb" aria-hidden="true">' + icon(kind) + '</span>'; }

  // Kai's lines (Sean, 2026-10-30), one per view of the walkthrough and one per step of the application, and her voice. Each text must
  // match its recording, voices/creator-guide/kai-<key>-v1.mp3 in vegan-media; change a line and record it again (the next -v2). Her
  // voice is a stand-in until Sean picks hers.
  var LINES = {
    overview: 'Hi, I\'m Kai. I make Vegan food and fitness videos in Miami, and this is my Creator Dashboard. Press Start the walkthrough and I\'ll show you around: the gigs, the ones I\'m in, my media kit and how you rise. At the end, you can apply.',
    dashboard: 'This is what I see when I sign in: the gigs open to me, the ones I\'m in, how complete my media kit is and where I stand. Tap any tile to jump in.',
    board: 'Every gig our partners post lands here. Filter by pay, kind and city, open one to see what it asks, and check whether you qualify. Try applying. Nothing is sent in the demo.',
    mine: 'Everything I applied to, auditioned for or got booked on is right here, by status, with what happens next. Anything you tried on Open gigs shows up here too.',
    'profile-you': 'My media kit is the page partners judge me by. This is how I see it, with what would make it stronger. Press Next to see it the way others do.',
    'profile-partner': 'This is what a brand sees once I\'m shortlisted. No rates and no contact details. They book me through Vegans Explore.',
    'profile-public': 'This is my page in the People directory, my link in bio. No rates, results or audience numbers.',
    'profile-team': 'And this is what the Vegans Explore team sees: everything, so they can match me to the right gigs.',
    how: 'Followers get you noticed. Results get you booked. Deliver on time, and your record opens bigger, better paid gigs.',
    join: 'That\'s the tour. If this is for you, tell us about yourself. The more we know, the better the gigs we can match you with.',
    'form-1': 'Start with the basics. Your home chapter, and every place you can show up in person, is how we match you to gigs near you.',
    'form-2': 'Add every platform you post on, with your real numbers today. Partners see your results later, so honest numbers always win.',
    'form-3': 'Pick everything you post about and every format you make, then drop links to two or three posts you\'re proud of.',
    'form-4': 'Tell us the kinds of gigs you want. Your rates are optional, and only our team ever sees them.',
    'form-5': 'Tell us about you in your own words, tick the box, and send it. Our team reads every application.'
  };
  // One player for the page. The first Play turns Kai's voice on for the visit (sessionStorage ve_kai_voice); from then on every new
  // view plays its line by itself (cue), and Pause turns it off. Any button with data-kai-voice="<key>" plays or pauses that line.
  var VOICE_URL = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/voices/creator-guide/kai-';
  // A line recorded again plays its newer take (Sean, 2026-10-31: "lives here" was read as the verb, so those lines say "is right here").
  var VOICE_VER = { mine: 2, 'tab-mylist': 2, overview: 2 };
  var voice = (function () {
    var a = null, cur = '', cued = '';
    function isOn() { try { return sessionStorage.getItem('ve_kai_voice') === '1'; } catch (e) { return false; } }
    function setOn(v) { try { sessionStorage.setItem('ve_kai_voice', v ? '1' : '0'); } catch (e) {} }
    function playing() { return !!(a && !a.paused && !a.ended); }
    function sync() {
      Array.prototype.forEach.call(document.querySelectorAll('[data-kai-voice]'), function (b) {
        var on = playing() && b.getAttribute('data-kai-voice') === cur;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.innerHTML = (on ? '&#10074;&#10074; Pause Kai' : '&#9654; Play Kai');
      });
    }
    function play(key) {
      if (!a) { a = new Audio(); a.preload = 'auto'; ['play', 'pause', 'ended'].forEach(function (ev) { a.addEventListener(ev, sync); }); }
      if (cur !== key) { cur = key; a.src = VOICE_URL + key + '-v' + (VOICE_VER[key] || 1) + '.mp3'; } else if (a.ended) a.currentTime = 0;
      var pr = a.play(); if (pr && pr.catch) pr.catch(function () { sync(); });
    }
    function stop() { if (a && !a.paused) a.pause(); }
    function toggle(key) {
      if (playing() && cur === key) { setOn(false); stop(); return; }
      setOn(true); cued = key; if (cur === key && a) a.currentTime = a.ended ? 0 : a.currentTime; play(key);
    }
    // A new view: play its line when the voice is on (once per view, so a redraw of the same view does not restart her).
    function cue(key) {
      if (key === cued) { sync(); return; }
      cued = key;
      if (!key) { stop(); sync(); return; }
      if (isOn()) { if (a) a.currentTime = 0; cur = ''; play(key); } else { stop(); sync(); }
    }
    document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-kai-voice]'); if (b) { e.preventDefault(); toggle(b.getAttribute('data-kai-voice')); } });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });
    return { cue: cue, toggle: toggle, stop: stop, sync: sync, isOn: isOn,
      button: function (key) { css(); return '<button type="button" class="vg-kai-play" data-kai-voice="' + key + '" aria-pressed="false">&#9654; Play Kai</button>'; } };
  })();

  function css() { if (!document.getElementById('ve-gigs-css')) { var st = document.createElement('style'); st.id = 've-gigs-css'; st.textContent = CSS; document.head.appendChild(st); } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(n) { return Number(n || 0).toLocaleString('en-US'); }
  function money(c) { return '$' + (c / 100).toLocaleString('en-US', { maximumFractionDigits: c % 100 ? 2 : 0 }); }
  function short(n) { return n >= 1000 ? (Math.round(n / 100) / 10).toString().replace(/\.0$/, '') + 'K' : String(n); }
  function payText(p) {
    var bits = [];
    if (p.cents) bits.push(money(p.cents));
    if (p.perk) bits.push(p.perk);
    if (p.points) bits.push(num(p.points) + ' points' + (p.each ? ' ' + p.each.replace(/^/, 'a ').replace(/^a a /, 'a ') : ''));
    return bits.join(' + ') || 'On us';
  }
  function closesText(g) {
    if (g.evergreen || !g.closes) return 'Always open';
    var d = Math.ceil((new Date(g.closes) - Date.now()) / 864e5);
    return d <= 0 ? 'Closes today' : d === 1 ? 'Closes tomorrow' : 'Closes in ' + d + ' days';
  }
  function where(g) { return g.remote ? 'From anywhere' : (g.chapters || []).length ? g.chapters.map(function (c) { return CHAPTER_NAMES[c] || c; }).join(', ') : 'Any chapter'; }

  // What a gig asks of this creator, each line checked against their profile.
  function checks(g, c) {
    var r = g.req || {}, out = [];
    if (r.min_followers) {
      var plats = (r.platforms && r.platforms.length) ? r.platforms : null, best = null;
      (c.platforms || []).forEach(function (p) { if ((!plats || plats.indexOf(p.k) > -1) && (!best || p.followers > best.followers)) best = p; });
      out.push({ ok: !!best && best.followers >= r.min_followers,
        label: num(r.min_followers) + '+ followers' + (plats ? ' on ' + plats.map(function (k) { return PLAT[k] || k; }).join(' or ') : ''),
        you: best ? 'You: ' + num(best.followers) + ' on ' + best.label : 'Add your platforms', need: 'Needs ' + short(r.min_followers) + ' followers' });
    }
    if (r.level) out.push({ ok: (c.level || 1) >= r.level, label: 'Level ' + r.level + ' or up', you: 'You: Level ' + (c.level || 1), need: 'Needs Level ' + r.level });
    if (!g.remote && (g.chapters || []).length) {
      var inCity = (c.chapters || []).some(function (x) { return g.chapters.indexOf(x) > -1; });
      out.push({ ok: inCity, label: 'Shows up in ' + where(g), you: inCity ? 'You show up there' : 'Not one of your cities', need: 'Not in your cities' });
    }
    return out;
  }
  function qualifies(g, c) { return checks(g, c).every(function (x) { return x.ok; }); }
  function standing(c) {
    var r = c.reliability || {}, d = r.delivered || 0, best = Math.max.apply(null, (c.results || []).map(function (x) { return x.per_k || 0; }).concat([0]));
    if (d >= 5 && r.strikes === 0 && r.on_time / d >= 0.9 && (c.level || 1) >= 3 && best >= 2 * (c.board_per_k || 18)) return 'Featured';
    if (d >= 5 && r.strikes === 0 && r.on_time / d >= 0.9) return 'Reliable';
    if (d >= 1) return 'Rising';
    return 'New';
  }

  function mount(el, opts) {
    opts = opts || {};
    css();
    el.classList.add('vg');
    var D = opts.data || { creator: {}, gigs: [], mine: [] };
    var demo = !!opts.demo, guide = !!opts.guide, KEY = 've_gigs_demo';
    // Where the board's views live in the address: '#' on its own page (#board, #mine/applied), or a Guide's own path (the Creator
    // Guide mounts it at '#/overview/' and '#/next/', and drives it with the returned draw(): opts.external).
    var BASE = opts.base || '#';
    function here() { var raw = location.hash || ''; return raw.indexOf(BASE) === 0 ? raw.slice(BASE.length) : ''; }
    function go(h) { location.hash = BASE + String(h).replace(/^#/, ''); }
    var state = { q: '', pay: 'all', kind: 'all', wherePick: 'mine', sort: 'new', fit: false, form: {} };
    // In the sample, what a visitor applies to or claims is kept for the visit, so My gigs follows them.
    if (demo) { try { var kept = JSON.parse(sessionStorage.getItem(KEY) || '[]'); kept.forEach(function (m) { D.mine = D.mine.filter(function (x) { return x.gig !== m.gig; }); D.mine.unshift(m); }); } catch (e) {} }
    function keep(m) {
      D.mine = D.mine.filter(function (x) { return x.gig !== m.gig; }); D.mine.unshift(m);
      if (!demo) return;
      try { var k = JSON.parse(sessionStorage.getItem(KEY) || '[]').filter(function (x) { return x.gig !== m.gig; }); k.unshift(m); sessionStorage.setItem(KEY, JSON.stringify(k)); } catch (e) {}
    }
    function toast(t) { var d = document.createElement('div'); d.className = 'vg-toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 3200); }
    function gig(id) { return D.gigs.filter(function (g) { return g.id === id; })[0] || null; }
    function mineOf(id) { return D.mine.filter(function (m) { return m.gig === id; })[0] || null; }
    var C = D.creator || {};
    function total() { return (C.platforms || []).reduce(function (n, p) { return n + (p.followers || 0); }, 0); }

    // No menu inside the page (Sean, 2026-10-30: "train our audience to know that the drop-down menu at the top navigates this particular
    // section"): the banner's dropdown moves between Overview, Open gigs, My gigs, Your media kit and How you rise. The creator strip
    // shows on the Overview and the open gigs only.
    function strip() {
      return '<div class="vg-me"><div class="vg-av" style="' + (C.avatar ? "background-image:url('" + esc(C.avatar) + "')" : '') + '">' + (C.avatar ? '' : esc((C.name || '?').charAt(0))) + '</div>' +
        '<div class="vg-me-main"><b>' + esc(C.name || 'You') + '</b><span>' + esc([C.handle, C.city].filter(Boolean).join(' · ')) + '</span></div>' +
        '<div class="vg-stats">' + (C.platforms && C.platforms.length ? '<div class="vg-stat"><b>' + short(total()) + '</b><span>Followers</span></div>' : '') +
        '<div class="vg-stat"><b>Level ' + (C.level || 1) + '</b><span>' + num(C.points || 0) + ' points</span></div>' +
        (C.reliability ? '<div class="vg-stat"><b>' + standing(C) + '</b><span>Your standing</span></div>' : '') + '</div></div>';
    }
    // The page's title comes first and Kai's strip under it (Sean, 2026-10-30: "Shouldn't the your creator dashboard be above where it
    // says Kai Monroe... It will also work to kind of break up the fact that her thumbnail is listed twice").
    function head(active, title) {
      return (demo && !guide ? '<p class="vg-note"><b>Demo.</b> Kai Monroe is invented and drawn in our style, every brand here is illustrative, and nothing you do is sent. This is the dashboard an official creator opens every day.</p>' : '') +
        (title || '') + (active === 'dashboard' || active === 'board' ? strip() : '');
    }

    function modeTag(g) { return '<span class="vg-tag mode' + (g.mode === 'audition' ? ' aud' : '') + '">' + esc(MODE[g.mode]) + '</span>'; }
    function kindTag(g) { return '<span class="vg-tag kind">' + esc(KIND[g.kind] || g.kind) + '</span>'; }
    function card(g) {
      var ch = checks(g, C), ok = ch.every(function (x) { return x.ok; }), m = mineOf(g.id), miss = ch.filter(function (x) { return !x.ok; })[0];
      // The tile (Sean, 2026-10-30: "clean... compact and not busy and uniformed"): the picture with the partner, title, pay and what it asks
      // beside it, then every pill in one row under both, in one order, colored by what it is: how you get it, the kind, where, you, then facts.
      var reqs = ch.map(function (x) { return x.label; }).filter(function (l) { return !/^Shows up/.test(l); });
      return '<a class="vg-card vg-tile' + (ok ? '' : ' no') + '" href="#gig/' + esc(g.id) + '"><div class="vg-tile-h">' + thumb(g.img, g.kind) + '<div class="vg-tile-r">' +
        '<span class="vg-partner">' + esc(g.partner.name) + '</span><div class="vg-title">' + esc(g.title) + '</div><div class="vg-pay">' + esc(payText(g.pay)) + '</div>' +
        (reqs.length ? '<div class="vg-line">' + esc(reqs.join(' · ')) + '</div>' : '') + '</div></div>' +
        '<div class="vg-tags">' + modeTag(g) + kindTag(g) + '<span class="vg-tag place">' + esc(where(g)) + '</span>' +
        (m ? '<span class="vg-tag ' + STATUS[m.status][1] + '">' + STATUS[m.status][0] + '</span>' : ok ? '<span class="vg-tag ok">You qualify</span>' : '<span class="vg-tag no">' + esc(miss.need) + '</span>') +
        '<span class="vg-tag">' + esc(closesText(g)) + '</span>' + (g.spots ? '<span class="vg-tag">' + g.spots + (g.spots === 1 ? ' spot' : ' spots') + '</span>' : '') +
        (g.applicants ? '<span class="vg-tag">' + num(g.applicants) + ' applied</span>' : '') + '</div></a>';
    }

    // My gigs wear the board's tile (Sean, 2026-10-30: "my gigs should look the same way... three columns"), with where it stands.
    function mineCard(m) {
      var g = gig(m.gig), s = STATUS[m.status], aud = g && m.status === 'audition' && (g.asks || []).indexOf('audition') > -1;
      // Where it stands is the first pill at the bottom (Sean, 2026-10-30: "we could put the booked as the first thing in the bottom pills").
      var inner = '<div class="vg-tile-h">' + thumb(g ? g.img : m.img, g ? g.kind : 'content') + '<div class="vg-tile-r"><span class="vg-partner">' + esc(g ? g.partner.name : 'Past gig') + '</span><div class="vg-title">' + esc(g ? g.title : m.title) + '</div>' +
        (g ? '<div class="vg-pay">' + esc(payText(g.pay)) + '</div>' : '') +
        (m.next ? '<div class="vg-next' + (aud ? ' warn' : '') + '">' + esc(m.next) + '</div>' : '') + '</div></div>' +
        '<div class="vg-tags"><span class="vg-tag ' + s[1] + '">' + s[0] + '</span>' + (g ? kindTag(g) + '<span class="vg-tag place">' + esc(where(g)) + '</span>' : '') + (aud ? '<span class="vg-tag warn">Record your audition</span>' : '') +
        (m.at ? '<span class="vg-tag">' + (m.status === 'applied' ? 'Applied ' : 'Updated ') + new Date(m.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + '</span>' : '') + '</div>';
      var href = aud ? '#apply/' + g.id + '/' + ((g.asks || []).indexOf('audition') + 1) : g ? '#gig/' + g.id : '';
      return href ? '<a class="vg-card vg-tile" href="' + esc(href) + '">' + inner + '</a>' : '<div class="vg-card vg-tile">' + inner + '</div>';
    }

    // Your media kit (Sean, 2026-10-30: "it's essentially their media kits... she gets to be the prototype of what a media kit profile
    // will look like... that's essentially what the directory listing is as well"). One kit, seen four ways: you (with what would make it
    // stronger), partners (no rates, no contact: they book through us), the public (their People directory page) and our team.
    var PVIEWS = [
      ['you', 'You', 'Your kit as you see it, with what would make it stronger. We help you keep it current.'],
      ['partner', 'Partners', 'What a brand or organizer sees once you are shortlisted. No rates and no contact details: they book you through us.'],
      ['public', 'The public', 'Your page in the People directory: your link in bio. No rates, results or audience numbers.'],
      ['team', 'Our team', 'Everything, rates and strikes included, so we can match you to the right gigs.']
    ];
    function box(h, body, cls) { return '<div class="vg-box' + (cls ? ' ' + cls : '') + '"><h3>' + h + '</h3>' + body + '</div>'; }
    function folio(caps) { return (C.portfolio || []).length ? '<div class="vg-folio">' + C.portfolio.map(function (p) { return '<button type="button" data-lb="' + esc(p.img) + '"><img src="' + esc(p.img) + '" alt="' + esc(p.caption) + '" loading="lazy"><small>' + esc(p.caption) + '</small>' + (caps ? '<em>' + esc(p.partner) + '</em>' : '') + '</button>'; }).join('') + '</div>' : '<p>Add your best posts.</p>'; }
    function results() { return (C.results || []).length ? '<div class="vg-res">' + C.results.map(function (x) { return '<div><b>' + esc(x.gig) + '</b><span>' + num(x.clicks) + ' clicks · ' + x.joins + ' joined · ' + x.posts + (x.posts === 1 ? ' post' : ' posts') + '</span><em class="vg-tag ' + (x.per_k >= (C.board_per_k || 18) ? 'ok' : '') + '">' + x.per_k + ' per 1K followers</em></div>'; }).join('') + '</div><p class="vg-help">Counted from their own tracked link. The board average is ' + (C.board_per_k || 18) + ' clicks per 1,000 followers.</p>' : '<p>The first gig starts the record.</p>'; }
    function relLine(withStrikes) { var r = C.reliability || {}; return '<p><b>' + standing(C) + '</b></p><p>' + (r.delivered || 0) + ' of ' + (r.booked || 0) + ' booked gigs delivered, ' + (r.on_time || 0) + ' on time, ' + (r.first_try || 0) + ' approved the first time' + (withStrikes ? ', ' + (r.strikes || 0) + (r.strikes === 1 ? ' strike' : ' strikes') : '') + '.</p>'; }
    function rates() { return (C.rates || []).length ? C.rates.map(function (x) { return '<p>' + esc(x[0]) + ': <b>' + esc(x[1]) + '</b></p>'; }).join('') : '<p>Not set yet.</p>'; }
    function bars(rows, unit) { return '<div class="vg-bars">' + rows.map(function (r) { return '<div><span>' + esc(r[0]) + '</span><i><b style="width:' + Math.min(100, r[1]) + '%"></b></i><em>' + r[1] + (unit || '%') + '</em></div>'; }).join('') + '</div>'; }
    function eng() { var p = C.platforms || [], t = total(); return t ? Math.round(p.reduce(function (n, x) { return n + (x.eng || 0) * x.followers; }, 0) / t * 10) / 10 : 0; }
    function bestPerK() { return Math.max.apply(null, (C.results || []).map(function (x) { return x.per_k || 0; }).concat([0])); }
    var NEXT_TIER = { New: 'Deliver your first gig to be Rising.', Rising: 'Deliver five, on time, to be Reliable.', Reliable: 'Reach Level 3 and keep your clicks per 1,000 followers at twice the board\'s average to be Featured.', Featured: 'You are at the top. You see new paid gigs a day early.' };
    function kit(as) {
      var pro = as !== 'public', first = (C.name || '').split(' ')[0] || 'them', a = C.audience || {};
      var done = (C.kit_done || []).filter(function (x) { return x[1]; }).length, all = (C.kit_done || []).length;
      var cta = as === 'you' ? '<a class="vg-btn" href="/ambassadors/door">Edit your kit</a>' : as === 'public' ? '<span class="vg-btn ghost">+ Vote</span><span class="vg-btn">Book ' + esc(first) + ' through us</span>' : as === 'partner' ? '<span class="vg-btn">Book ' + esc(first) + '</span>' : '<span class="vg-tag ok">Ambassador · Creator profile</span>';
      var hero = '<div class="vg-kit-hero" style="background-image:linear-gradient(90deg,rgba(0,0,0,.86) 0%,rgba(0,0,0,.7) 45%,rgba(0,0,0,.25) 100%),url(\'' + esc(C.cover || '') + '\')">' +
        '<div class="vg-kit-av" style="background-image:url(\'' + esc(C.avatar || '') + '\')"></div><div class="vg-kit-id"><span>Content creator · ' + esc(C.city || '') + '</span><h2>' + esc(C.name || '') + '</h2><p>' + esc(C.tagline || C.line || '') + '</p>' +
        '<div class="vg-tags"><span class="vg-tag ok">Official creator</span>' + (pro ? '<span class="vg-tag dark">' + standing(C) + '</span>' : '') + (C.platforms || []).map(function (p) { return '<span class="vg-tag">' + esc(p.label) + '</span>'; }).join('') + '</div></div>' +
        '<div class="vg-kit-cta">' + cta + '</div></div>';
      var stats = '<div class="vg-plat vg-sum"><div><b>' + short(total()) + '</b><span>Total reach</span></div>' + (C.platforms || []).map(function (p) { return '<div><b>' + short(p.followers) + '</b><span>' + esc(p.label) + (pro && p.eng ? ' · ' + p.eng + '% engagement' : '') + '</span></div>'; }).join('') +
        (pro ? '<div><b>' + eng() + '%</b><span>Average engagement</span></div><div><b>' + bestPerK() + '</b><span>Best clicks per 1K followers</span></div>' : '') + '</div>';
      var left = box('About', '<p>' + esc(C.line || '') + '</p>') +
        ((C.pillars || []).length ? box('What ' + (as === 'you' ? 'you make' : first + ' makes'), '<div class="vg-pillars">' + C.pillars.map(function (x) { return '<div><b>' + esc(x[0]) + '</b><span>' + esc(x[1]) + '</span></div>'; }).join('') + '</div>') : '') +
        box('Featured work', folio(pro)) + (pro ? box('Results on past gigs', results()) : '') +
        ((C.quotes || []).length && as !== 'public' ? box('What partners say', C.quotes.map(function (q) { return '<blockquote class="vg-q">' + esc(q[0]) + '<cite>' + esc(q[1]) + '</cite></blockquote>'; }).join('')) : '');
      var right = (as === 'you' ? box('Make it shine', '<p><b>' + done + ' of ' + all + '</b> done. Kits that are complete get booked first.</p><ul class="vg-req">' + (C.kit_done || []).map(function (x) { return '<li><i class="' + (x[1] ? '' : 'no') + '">' + (x[1] ? '&#10003;' : '+') + '</i><span>' + esc(x[0]) + '</span></li>'; }).join('') + '</ul><p class="vg-help">Your Community Manager can help: a fresh photo, your best posts picked, your numbers checked.</p>') : '') +
        (pro && a.ages ? box('Audience', '<p><b>' + a.women + '%</b> women · <b>' + a.vegan + '%</b> Vegan or plant-curious</p><h4 class="vg-sub">Ages</h4>' + bars(a.ages) + '<h4 class="vg-sub">Top cities</h4>' + bars(a.cities)) : '') +
        ((C.brands || []).length ? box('Worked with', '<div class="vg-tags">' + C.brands.map(function (x) { return '<span class="vg-tag">' + esc(x) + '</span>'; }).join('') + '</div>') : '') +
        (pro ? box('Reliability', relLine(as !== 'partner') + (as === 'you' ? '<p>' + NEXT_TIER[standing(C)] + ' <a href="#how">How you rise</a></p>' : '')) : box('With Vegans Explore', '<p>Hosted the night market stage<br>Wynwood restaurant crawl<br>Oat-milk latte tour</p>')) +
        (as === 'you' || as === 'team' ? box(as === 'you' ? 'Your rates (our team only)' : 'Rates', rates()) : as === 'partner' ? box('Rates', '<p>Quoted by us for your campaign. Creators are paid their full rate.</p>') : '') +
        box('Where ' + (as === 'you' ? 'you show' : first + ' shows') + ' up', '<p>' + esc((C.chapters || []).map(function (c) { return CHAPTER_NAMES[c] || c; }).join(', ')) + (C.handle ? '<br>' + esc(C.handle) : '') + '</p>') +
        (as === 'team' ? box('On file', '<p>Checklist: Active, payouts on<br>Profile set by the team: Creator</p>') : '');
      return hero + stats + '<div class="vg-two"><div>' + left + '</div><div>' + right + '</div></div>';
    }

    var V = {
      dashboard: function () {
        var open = D.gigs.filter(function (g) { return qualifies(g, C) && !mineOf(g.id); }).length;
        var play = D.mine.filter(function (m) { return ['applied', 'shortlisted', 'audition', 'booked'].indexOf(m.status) > -1; });
        var todo = D.mine.filter(function (m) { return m.status === 'audition' || m.status === 'booked'; });
        var done = (C.kit_done || []).filter(function (x) { return x[1]; }).length, all = (C.kit_done || []).length;
        var tile = function (href, n, t, d) { return '<a class="vg-card vg-go" href="' + href + '"><div class="vg-go-top"><b class="vg-big">' + n + '</b><span class="vg-ico">' + icon({ '#board': 'board', '#mine': 'mine', '#profile': 'kit', '#how': 'how' }[href]) + '</span></div><div class="vg-title">' + t + '</div><div class="vg-line">' + d + '</div></a>'; };
        return head('dashboard', '<h2 class="vg-h">Your Creator Dashboard</h2><p class="vg-help" style="font-size:14.5px;max-width:860px;margin:0 0 14px">Everything you do with us, in one place: the gigs open to you, the ones you are in, your media kit and where you stand.</p>') +
          '<div class="vg-grid vg-grid4">' + tile('#board', open, 'Open gigs', 'Gigs you qualify for and have not applied to yet.') + tile('#mine', play.length, 'My gigs', 'Applied, shortlisted, auditioning or booked.') +
          tile('#profile', all ? Math.round(done / all * 100) + '%' : '-', 'Your media kit', 'Your page partners and the public see. Complete kits get booked first.') + tile('#how', standing(C), 'How you rise', NEXT_TIER[standing(C)]) + '</div>' +
          (todo.length ? '<h3 class="vg-sec">Up next</h3><div class="vg-grid">' + todo.map(mineCard).join('') + '</div>' : '') +
          '<h3 class="vg-sec">How it works</h3><div class="vg-grid vg-grid4 vg-steps4">' +
          [['Find a gig', 'New gigs land every week: paid campaigns, collaborations, hosting and points gigs.'], ['Apply or audition', 'Send what it asks for: a pitch, examples, an audition link.'], ['Get booked and deliver', 'Half your fee when you are booked. Post with your own tracked link.'], ['Get paid and rise', 'The other half when it is live. Your results build your record.']]
            .map(function (x, i) { return '<div class="vg-card"><em class="vg-n">' + (i + 1) + '</em><div class="vg-title">' + x[0] + '</div><div class="vg-line">' + x[1] + '</div></div>'; }).join('') + '</div>';
      },
      board: function () {
        var list = D.gigs.filter(function (g) {
          if (state.pay !== 'all' && g.pay.type !== state.pay) return false;
          if (state.kind !== 'all' && g.kind !== state.kind) return false;
          if (state.wherePick === 'mine' && !g.remote && (g.chapters || []).length && !(C.chapters || []).some(function (x) { return g.chapters.indexOf(x) > -1; })) return false;
          if (state.fit && !qualifies(g, C)) return false;
          var q = state.q.trim().toLowerCase();
          return !q || q.split(/\s+/).every(function (w) { return (g.title + ' ' + g.partner.name + ' ' + (g.brief || '') + ' ' + (KIND[g.kind] || '')).toLowerCase().indexOf(w) > -1; });
        });
        var val = function (g) { return (g.pay.cents || 0) + (g.pay.points || 0) * 1; };
        list.sort(state.sort === 'closing' ? function (a, b) { return (a.closes ? +new Date(a.closes) : 9e15) - (b.closes ? +new Date(b.closes) : 9e15); }
          : state.sort === 'pay' ? function (a, b) { return val(b) - val(a); } : function (a, b) { return +new Date(b.posted) - +new Date(a.posted); });
        var sel = function (k, opts2) { return '<select data-f="' + k + '" aria-label="' + k + '">' + opts2.map(function (o) { return '<option value="' + o[0] + '"' + (state[k] === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'; };
        return head('board', '<h2 class="vg-h">Open gigs</h2>') +
          '<div class="vg-tools"><input class="vg-q" type="search" data-f="q" placeholder="Search gigs, brands, kinds..." value="' + esc(state.q) + '" aria-label="Search gigs">' +
          sel('pay', [['all', 'Any pay'], ['paid', 'Paid'], ['perk', 'Perks'], ['points', 'Points']]) +
          sel('kind', [['all', 'Every kind']].concat(Object.keys(KIND).map(function (k) { return [k, KIND[k]]; }))) +
          sel('wherePick', [['mine', 'My cities and remote'], ['any', 'Every city']]) +
          sel('sort', [['new', 'Newest'], ['closing', 'Closing soon'], ['pay', 'Highest pay']]) + '</div>' +
          '<label class="vg-check"><input type="checkbox" data-f="fit"' + (state.fit ? ' checked' : '') + '> Only gigs I qualify for</label>' +
          (list.length ? '<div class="vg-grid">' + list.map(card).join('') + '</div>' : '<div class="vg-empty">No gigs match. Try Every city or clear the search.</div>') +
          (opts.live ? '<p class="vg-help" style="margin-top:14px">Paid campaigns, collaborations and hosting open here as they are booked. Today the board holds our bounties, paid in points.</p>' : '');
      },
      gig: function (id) {
        var g = gig(id); if (!g) return head('board') + '<div class="vg-empty">That gig is not on the board any more. <a href="#board">See every gig</a></div>';
        var ch = checks(g, C), ok = ch.every(function (x) { return x.ok; }), m = mineOf(g.id);
        var audStep = (g.asks || []).indexOf('audition') + 1;
        var act = m && m.status === 'audition' && audStep ? '<span class="vg-tag warn">Audition requested</span> <a class="vg-btn" href="#apply/' + esc(g.id) + '/' + audStep + '">Record your audition</a>'
          : m ? '<span class="vg-tag ' + STATUS[m.status][1] + '">' + STATUS[m.status][0] + '</span> <a class="vg-btn ghost" href="#mine">My gigs</a>'
          : !ok ? '<button class="vg-btn" disabled>' + esc(MODE[g.mode]) + '</button><p class="vg-help">You do not meet every requirement yet. Grow where it says, or watch for gigs with no minimum.</p>'
          : g.mode === 'claim' ? (g.href && !demo ? '<a class="vg-btn" href="' + esc(g.href) + '">Claim it</a>' : '<button class="vg-btn" data-claim="' + esc(g.id) + '">Claim it</button>')
          : '<a class="vg-btn" href="#apply/' + esc(g.id) + '/1">' + (g.mode === 'audition' ? 'Apply and audition' : 'Apply') + '</a>';
        var steps = (g.asks || []).map(function (a) { return '<li>' + esc(ASK[a].name) + (a === 'audition' && g.audition ? ': ' + esc(g.audition) : '') + '</li>'; }).join('');
        return head('board') + '<div class="vg-crumb"><a href="#board">Gigs</a> &rsaquo; ' + esc(g.title) + '</div>' +
          '<div class="vg-partner">' + esc(g.partner.name) + ' · ' + esc(g.partner.kind) + '</div><h2 class="vg-h">' + esc(g.title) + '</h2>' +
          '<div class="vg-two"><div>' +
          '<div class="vg-box"><h3>The brief</h3><p>' + esc(g.brief) + '</p></div>' +
          '<div class="vg-box"><h3>What you deliver</h3><ul>' + (g.deliverables || []).map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul><p style="margin-top:8px"><b>When:</b> ' + esc(g.timeline || '') + '</p></div>' +
          (steps ? '<div class="vg-box"><h3>What you send to apply</h3><ul>' + steps + '</ul></div>' : '<div class="vg-box"><h3>How it works</h3><p>No application: claim it, do it, send it in. Points land once the team approves it.</p></div>') +
          '</div><div>' +
          '<div class="vg-box"><h3>Pay</h3><p class="vg-pay" style="font-size:18px">' + esc(payText(g.pay)) + '</p><p>' + (g.pay.type === 'paid' ? 'Your full fee: half when you are booked, half when your posts are live. Our fee is the brand\'s, on top, never taken from you.' : g.pay.type === 'points' ? 'Points once the team approves what you send.' : 'Perks on the day, and any points once it is delivered.') + '</p></div>' +
          '<div class="vg-box"><h3>Who it is for</h3>' + (ch.length ? '<ul class="vg-req">' + ch.map(function (x) { return '<li><i class="' + (x.ok ? '' : 'no') + '">' + (x.ok ? '&#10003;' : '&times;') + '</i><span><b>' + esc(x.label) + '</b><br>' + esc(x.you) + '</span></li>'; }).join('') + '</ul>' : '<p>Open to everyone. No following needed.</p>') + '</div>' +
          '<div class="vg-box"><h3>Details</h3><p>' + esc(where(g)) + '<br>' + esc(closesText(g)) + (g.spots ? '<br>' + g.spots + (g.spots === 1 ? ' spot' : ' spots') : '') + (g.applicants ? '<br>' + num(g.applicants) + ' applied so far' : '') + '</p></div>' +
          '<div class="vg-btns">' + act + '</div></div></div>';
      },
      apply: function (id, n) {
        var g = gig(id); if (!g || g.mode === 'claim') return V.board();
        var asks = (g.asks || []).concat(['send']), i = Math.min(Math.max(1, +n || 1), asks.length), a = asks[i - 1], f = state.form[id] = state.form[id] || {};
        var stepsBar = '<div class="vg-steps">' + asks.map(function (k, j) { return '<span class="' + (j === i - 1 ? 'on' : '') + '">' + (k === 'send' ? 'Send' : ASK[k].name) + '</span>'; }).join('') + '</div>';
        var body;
        if (a === 'send') body = '<div class="vg-box"><h3>Check and send</h3>' + (g.asks || []).map(function (k) { return '<p><b>' + esc(ASK[k].name) + ':</b> ' + esc(f[k] || 'Not filled in') + '</p>'; }).join('') +
          '<p class="vg-help">Your rates and numbers stay with our team. The partner sees your name and profile only once you are shortlisted.</p></div>';
        else body = '<label class="vg-label" for="vg-in">' + esc(ASK[a].label) + '</label>' + (a === 'audition' && g.audition ? '<p class="vg-help" style="margin:0 0 8px"><b>The prompt:</b> ' + esc(g.audition) + '</p>' : '') +
          (a === 'pitch' || a === 'rate' || a === 'examples' ? '<textarea id="vg-in" maxlength="' + (a === 'pitch' ? 600 : 1200) + '">' + esc(f[a] || (a === 'rate' && g.pay.cents ? money(g.pay.cents) + ' works for me. Available ' : '')) + '</textarea>' : '<input id="vg-in" type="url" placeholder="https://" value="' + esc(f[a] || '') + '">') +
          '<p class="vg-help">' + esc(ASK[a].help) + '</p>';
        return head('board') + '<div class="vg-crumb"><a href="#board">Gigs</a> &rsaquo; <a href="#gig/' + esc(id) + '">' + esc(g.title) + '</a> &rsaquo; Apply</div>' +
          '<h2 class="vg-h">' + (g.mode === 'audition' ? 'Apply and audition' : 'Apply') + '</h2>' + stepsBar + body + '<div class="vg-err" id="vg-err"></div>' +
          '<div class="vg-nav"><a class="vg-btn ghost" href="' + (i > 1 ? '#apply/' + id + '/' + (i - 1) : '#gig/' + id) + '">Back</a><span>Step ' + i + ' of ' + asks.length + '</span>' +
          (a === 'send' ? '<button class="vg-btn" data-send="' + esc(id) + '">Send my application</button>' : '<button class="vg-btn" data-next="' + esc(id) + '|' + i + '|' + a + '">Next</button>') + '</div>';
      },
      mine: function (tab) {
        tab = tab || 'all';
        var rows = D.mine.filter(function (m) { return tab === 'all' || m.status === tab; });
        return head('mine') + '<h2 class="vg-h">My gigs</h2>' +
          (C.earned_cents != null ? '<div class="vg-plat vg-sum"><div><b>' + money(C.earned_cents) + '</b><span>Paid this year</span></div><div><b>' + num(C.earned_points) + '</b><span>Points from gigs</span></div><div><b>' + (C.reliability ? C.reliability.delivered : 0) + '</b><span>Gigs delivered</span></div></div>' : '') +
          '<div class="vg-chips">' + MINE_TABS.map(function (t) {
            var n = t[0] === 'all' ? D.mine.length : D.mine.filter(function (m) { return m.status === t[0]; }).length;
            return n || t[0] === 'all' ? '<a href="#mine/' + t[0] + '"' + (t[0] === tab ? ' aria-current="page"' : '') + '>' + t[1] + ' <em>' + n + '</em></a>' : '';
          }).join('') + '</div>' +
          (rows.length ? '<div class="vg-grid">' + rows.map(mineCard).join('') + '</div>' : '<div class="vg-empty">Nothing here yet. <a href="#board">Find a gig</a></div>');
      },
      profile: function (as) {
        as = PVIEWS.some(function (v) { return v[0] === as; }) ? as : 'you';
        var bar = '<div class="vg-seg" role="tablist" aria-label="See your media kit as">' + PVIEWS.map(function (v) {
          return '<a role="tab" href="#profile/' + v[0] + '" aria-selected="' + (v[0] === as) + '">' + v[1] + '</a>';
        }).join('') + '</div><p class="vg-help" style="margin:0 0 14px">See it as: ' + PVIEWS.filter(function (v) { return v[0] === as; })[0][2] + '</p>';
        return head('profile') + '<h2 class="vg-h">Your media kit</h2>' + bar + kit(as);
      },
      how: function () {
        var s = standing(C), T = [
          ['New', 'Registered, profile done. Points gigs and gigs with no minimum are open to you from day one.'],
          ['Rising', 'One gig delivered. Your results start counting.'],
          ['Reliable', 'Five gigs delivered, 9 in 10 on time, no open strikes. Partners see the Reliable mark on your profile.'],
          ['Featured', 'Reliable, Level 3, and your clicks per 1,000 followers at least twice the board\'s average. Featured creators see new paid gigs a day before everyone else.']
        ];
        return head('how') + '<div class="vg-hero"><div><h2 class="vg-h">Rise by results, not just followers</h2>' +
          '<p class="vg-help" style="font-size:14.5px">A partner can only judge a stranger by followers at first. Once you have done a gig, we know: every booked creator shares their own tracked link, so we count the clicks and the people who joined. A small audience that shows up beats a big one that scrolls past, and your record says so. Be honest about your numbers; the results show where you stand either way.</p></div>' +
          (C.portfolio && C.portfolio.length ? '<figure><img src="' + esc((C.portfolio[C.portfolio.length - 1] || {}).img) + '" alt="' + esc(C.name || 'A creator') + ' hosting a festival stage"><figcaption>' + esc(C.name ? C.name.split(' ')[0] + ' started on points gigs and hosting. Now she is Reliable.' : '') + '</figcaption></figure>' : '') + '</div>' +
          '<div class="vg-tiers" style="margin-top:14px">' + T.map(function (t) { return '<div class="vg-tier' + (t[0] === s ? ' on' : '') + '"><b>' + t[0] + (t[0] === s ? ' · you' : '') + '</b><p>' + t[1] + '</p></div>'; }).join('') + '</div>' +
          '<div class="vg-two" style="margin-top:14px"><div class="vg-box"><h3>What counts</h3><ul><li>Delivered, on time, approved the first time</li><li>Clicks and joins through your link, per 1,000 followers</li><li>Your level, from the points you earn taking part</li></ul></div>' +
          '<div class="vg-box"><h3>What costs you</h3><ul><li>A no-show or a late cancel is a strike</li><li>Numbers that do not match what you told us</li><li>Strikes clear after a run of clean gigs</li></ul></div></div>' +
          '<div class="vg-box"><h3>Start small</h3><p>Points gigs and gigs with no minimum (content for a brand\'s own pages, hosting, first reviews) are open to everyone. They are how a small creator builds a record partners can trust.</p></div>';
      },
      // The landing (Sean, 2026-10-30): the opportunity, how it works and how to use the page on the left, Kai on the right.
      overview: function () {
        return '<div class="vg-land"><div class="vg-land-l">' +
          '<p class="vg-kick">For content creators</p><h2 class="vg-h">Looking for paid work that fits what you already make?</h2>' +
          '<p>Over the next few months we are bringing local businesses, national brands and events onto Vegans Explore in all thirteen of our chapters, and their campaigns need creators. Register to be considered, and the opportunities that fit you come straight to your own Creator Dashboard.</p>' +
          '<h3 class="vg-sec">What you get</h3><ul class="vg-gets">' +
          [['Gigs delivered to you', 'Paid campaigns, product collaborations, hosting and events, matched to your city, your topics and your audience.'],
           ['A media kit partners trust', 'Your platforms, your best work and your results in one page, shown to a partner only once you are shortlisted.'],
           ['Paid fairly, on time', 'Half your fee when you are booked, the other half when your posts are live. You set your rates.'],
           ['Room to rise', 'Points gigs and gigs with no follower minimum let a small creator build a record. Results count more than followers.']]
            .map(function (x) { return '<li><b>' + x[0] + '</b>' + x[1] + '</li>'; }).join('') + '</ul>' +
          '<h3 class="vg-sec">How it works</h3><div class="vg-grid vg-grid4 vg-steps4">' +
          [['Apply to be considered', 'Tell us who you are, where you post and what you make.'], ['Get approved', 'Our team reads every application and sets up your dashboard.'], ['Gigs come to you', 'Apply, audition or claim the ones you want.'], ['Deliver and rise', 'Get paid, and let your results open bigger gigs.']]
            .map(function (x, i) { return '<div class="vg-card"><em class="vg-n">' + (i + 1) + '</em><div class="vg-title">' + x[0] + '</div><div class="vg-line">' + x[1] + '</div></div>'; }).join('') + '</div>' +
          '<h3 class="vg-sec">How to use this page</h3><ol class="vg-use">' +
          '<li>Press Next, at the top or the bottom of any step, to walk through the Creator Dashboard as Kai sees it.</li>' +
          '<li>Click around as you go. Apply to a gig or claim one: in this demo nothing is sent.</li>' +
          '<li>When you are ready, the last step is the application. You can also jump straight to it.</li></ol>' +
          '<div class="vg-btns"><a class="vg-btn" href="#dashboard">Start the walkthrough</a><a class="vg-btn ghost" href="#join/1">Skip to the application</a></div>' +
          '</div><aside class="vg-kai" aria-label="Kai, your guide"><figure style="background-image:url(\'' + esc(KAI_IMG) + '\')" role="img" aria-label="Kai Monroe waving"></figure>' +
          '<div class="vg-kai-say"><b>Kai</b><p>' + esc(LINES.overview) + '</p>' + voice.button('overview') + '</div></aside></div>';
      },
      join: function (n) {
        if (n === 'done') return '<div class="vg-form"><p class="vg-kick">Application sent</p><h2 class="vg-h">Thank you. We have it.</h2><p class="vg-help" style="font-size:15px;max-width:760px">Our team reads every application and will write back by email, usually within a few days. When you are approved, your Creator Dashboard opens and the gigs that fit you start landing in it.</p>' +
          '<div class="vg-btns"><a class="vg-btn ghost" href="' + (opts.demoHref || '#dashboard') + '">Look around the demo again</a><a class="vg-btn ghost" href="/creators/welcome">Read the Official Creator Guide</a></div></div>';
        var i = Math.min(Math.max(parseInt(n, 10) || 1, 1), FORM.length), step = FORM[i - 1], A = state.app;
        var val = function (k) { return A[k] == null ? '' : A[k]; };
        var field = function (f) {
          var lab = esc(f.label) + (f.req ? ' <span class="req">*</span>' : ''), help = f.help ? '<small>' + esc(f.help) + '</small>' : '';
          if (f.type === 'checks' || f.type === 'radio') {
            var on = f.type === 'checks' ? (A[f.k] || []) : [A[f.k]];
            return '<div class="vg-field"><span>' + lab + '</span><div class="vg-opts" role="group" aria-label="' + esc(f.label) + '">' + f.opts.map(function (o) {
              var v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o;
              return '<label><input type="' + (f.type === 'checks' ? 'checkbox' : 'radio') + '" name="' + f.k + '" data-a="' + f.k + '" value="' + esc(v) + '"' + (on.indexOf(v) > -1 ? ' checked' : '') + '>' + esc(t) + '</label>';
            }).join('') + '</div>' + help + '</div>';
          }
          if (f.type === 'select') return '<div class="vg-field"><label for="a-' + f.k + '">' + lab + '</label><select id="a-' + f.k + '" data-a="' + f.k + '"><option value="">Choose one</option>' + f.opts.map(function (o) {
            var v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(v) + '"' + (val(f.k) === v ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select>' + help + '</div>';
          if (f.type === 'plats') return '<div class="vg-field"><span>' + lab + '</span><div class="vg-plats">' + PLATS.map(function (p) {
            return '<div><label for="a-' + p[0] + '" style="font-size:12.5px;font-weight:800;display:block;margin:0 0 4px">' + p[1] + '</label><div class="vg-plat-row"><input type="text" id="a-' + p[0] + '" data-a="' + p[0] + '" value="' + esc(val(p[0])) + '" placeholder="' + esc(p[2]) + '" autocomplete="off">' +
              (p[3] ? '<input type="text" inputmode="numeric" data-a="' + p[0] + '_n" value="' + esc(val(p[0] + '_n')) + '" placeholder="' + p[3] + '" aria-label="' + esc(p[1] + ' ' + p[3]) + '">' : '<span></span>') + '</div></div>';
          }).join('') + '</div>' + help + '</div>';
          if (f.type === 'textarea') return '<div class="vg-field"><label for="a-' + f.k + '">' + lab + '</label><textarea id="a-' + f.k + '" data-a="' + f.k + '" maxlength="' + (f.max || 1200) + '">' + esc(val(f.k)) + '</textarea>' + help + '</div>';
          if (f.type === 'confirm') return '<div class="vg-field"><label class="vg-check"><input type="checkbox" data-a="' + f.k + '"' + (A[f.k] ? ' checked' : '') + '> ' + esc(f.label) + ' <span class="req">*</span></label></div>';
          return '<div class="vg-field"><label for="a-' + f.k + '">' + lab + '</label><input type="' + (f.type || 'text') + '" id="a-' + f.k + '" data-a="' + f.k + '" value="' + esc(val(f.k)) + '"' + (f.ph ? ' placeholder="' + esc(f.ph) + '"' : '') + (f.ac ? ' autocomplete="' + f.ac + '"' : '') + '>' + help + '</div>';
        };
        return '<div class="vg-form"><p class="vg-kick">Apply to be an official creator</p><h2 class="vg-h">' + esc(step.title) + '</h2>' +
          '<div class="vg-steps">' + FORM.map(function (x, j) { return '<span class="' + (j === i - 1 ? 'on' : '') + '">' + esc(x.short) + '</span>'; }).join('') + '</div>' +
          (CLAIM ? '<p class="vg-claimnote">You are claiming ' + (claimName() ? '<b>' + esc(claimName()) + '</b>' + (/s$/i.test(claimName()) ? '\'' : '\'s') + ' profile' : 'the profile at <b>/directory/' + esc(CLAIM) + '</b>') +
            '. Our team confirms it is you before it is yours. <button type="button" data-unclaim>Not me</button></p>' : '') +
          (step.lede ? '<p class="vg-help" style="font-size:14.5px;margin:0 0 16px;max-width:760px">' + esc(step.lede) + '</p>' : '') +
          step.fields.map(field).join('') +
          '<p class="vg-err" id="vg-join-err" role="alert"></p>' +
          '<div class="vg-pager">' + (i > 1 ? '<a class="vg-btn ghost" href="#join/' + (i - 1) + '">Back</a>' : opts.tour === false ? '<span></span>' : '<a class="vg-btn ghost" href="#how">Back</a>') +
          '<span>Step ' + i + ' of ' + FORM.length + '</span>' +
          (i < FORM.length ? '<button type="button" class="vg-btn" data-join-next="' + i + '">Next</button>' : '<button type="button" class="vg-btn" data-join-send>Send my application</button>') + '</div></div>';
      }
    };

    // The walkthrough (guide: true): each step's address and its name; Kai's line on each is LINES[lineKey(h)].
    var TOUR = [
      { v: 'overview', name: 'Overview' }, { v: 'dashboard', name: 'Your dashboard' }, { v: 'board', name: 'Open gigs' }, { v: 'mine', name: 'My gigs' },
      { v: 'profile', name: 'Your media kit', subs: ['you', 'partner', 'public', 'team'] }, { v: 'how', name: 'How you rise' }, { v: 'join', name: 'Apply' }
    ];
    var KAI_IMG = C.avatar || '/gigs/sample/img/kai-avatar.webp';
    function tourAt(h) {
      var v = h[0] === 'gig' || h[0] === 'apply' ? 'board' : h[0] || 'overview';
      var i = 0; TOUR.forEach(function (t, j) { if (t.v === v) i = j; });
      var sub = TOUR[i].subs ? Math.max(0, TOUR[i].subs.indexOf(h[1] || 'you')) : -1;
      return { i: i, sub: sub };
    }
    function tourHash(i, sub, dir) {
      var t = TOUR[i];
      if (t.subs && sub > -1) { var s2 = sub + dir; if (s2 >= 0 && s2 < t.subs.length) return '#profile/' + t.subs[s2]; }
      var j = i + dir; if (j < 0 || j >= TOUR.length) return '';
      var n = TOUR[j]; return '#' + (n.subs ? 'profile/' + n.subs[dir > 0 ? 0 : n.subs.length - 1] : n.v === 'join' ? 'join/1' : n.v);
    }
    function tourNav(h) {
      var at = tourAt(h), t = TOUR[at.i], back = tourHash(at.i, at.sub, -1), next = t.v === 'join' ? '' : tourHash(at.i, at.sub, 1);
      var nextName = next ? (t.subs && at.sub < t.subs.length - 1 ? 'Next view' : 'Next: ' + TOUR[at.i + 1].name) : '';
      return { at: at, t: t, bk: back ? '<a class="vg-btn ghost" href="' + back + '">Back</a>' : '<span></span>', nx: next ? '<a class="vg-btn" href="' + next + '">' + esc(nextName) + '</a>' : '<span></span>',
        label: 'Step ' + (at.i + 1) + ' of ' + TOUR.length + ' <em>· ' + esc(t.name) + (t.subs ? ' (' + (at.sub + 1) + ' of ' + t.subs.length + ')' : '') + '</em>' };
    }
    function tourBar(h) {
      var n = tourNav(h);
      return '<nav class="vg-tour bottom" aria-label="Walkthrough">' + n.bk + '<span class="vg-tour-at">' + n.label + '</span>' + n.nx + '</nav>';
    }
    // Which of Kai's lines goes with a view: the step of the walkthrough, or a step of the application ('' when she has nothing to say).
    function lineKey(h) {
      var v = h[0] || (guide ? 'overview' : 'dashboard');
      if (v === 'gig' || v === 'apply') return 'board';
      if (v === 'profile') return 'profile-' + (TOUR[4].subs.indexOf(h[1]) > -1 ? h[1] : 'you');
      if (v === 'join') { var n = parseInt(h[1], 10) || 1; return h[1] === 'done' ? '' : n === 1 && opts.tour !== false ? 'join' : 'form-' + Math.min(n, FORM.length); }
      return LINES[v] ? v : '';
    }
    // After the landing, Kai sits at the top so the demo below has the full width (Sean, 2026-10-30). One guide bar, not two boxes (Sean,
    // the same day: "it doesn't look solid like the other ones... what if we put it in the same section where Kai is"): Kai, the step
    // and her line, Back and Next, and a progress line of the seven steps along its foot.
    function topRow(h) {
      var key = lineKey(h), n = tourNav(h), prog = '';
      for (var i = 0; i < TOUR.length; i++) prog += '<span class="' + (i <= n.at.i ? 'on' : '') + '"></span>';
      // Play sits on the bottom of Kai's picture (Sean, 2026-10-30: "put the button at the bottom of the photo... condense it").
      return '<nav class="vg-gbar" aria-label="Walkthrough"><div class="vg-gbar-kai"><i style="background-image:url(\'' + esc(KAI_IMG) + '\')" role="img" aria-label="Kai Monroe"></i>' + (key ? voice.button(key) : '') + '</div>' +
        '<div class="vg-gbar-t"><div class="vg-gbar-at">' + n.label + '</div><p><b>Kai:</b> ' + esc(LINES[key] || '') + '</p></div>' +
        '<div class="vg-gbar-nav">' + n.bk + n.nx + '</div><div class="vg-gbar-prog" aria-hidden="true">' + prog + '</div></nav>';
    }

    // The creator application (Sean, 2026-10-30: "We want to know as much as we can about them to see the scope of what we can apply them
    // to... when we run a campaign, it can automatically pull in... content creators... specific to a certain city interest"). One step per
    // view, Next checks the step, answers kept in the browser until sent (localStorage vg_creator_apply). Keep the keys in step with
    // APPLY_KEYS in ve-ambassador.
    var CH_OPTS = Object.keys(CHAPTER_NAMES).map(function (k) { return [k, CHAPTER_NAMES[k]]; });
    var PLATS = [['instagram', 'Instagram', '@yourhandle', 'Followers'], ['tiktok', 'TikTok', '@yourhandle', 'Followers'], ['youtube', 'YouTube', '@yourchannel', 'Subscribers'],
      ['facebook', 'Facebook', 'Page name or link', 'Followers'], ['podcast', 'Podcast', 'Link to your show', 'Monthly listens'], ['website', 'Website or blog', 'https://', 'Monthly visitors']];
    var FORM = [
      { short: 'You', title: 'About you', lede: 'Who you are and where you are. We match gigs city by city.', fields: [
        { k: 'name', label: 'Your name', req: true, ac: 'name' }, { k: 'email', label: 'Email', type: 'email', req: true, ac: 'email' },
        { k: 'phone', label: 'Phone', type: 'tel', ac: 'tel', help: 'Optional. Only for booking you.' },
        { k: 'chapter', label: 'Your home chapter', type: 'select', req: true, opts: CH_OPTS.concat([['other', 'Somewhere else']]) },
        { k: 'city', label: 'Your city', req: true, ac: 'address-level2' },
        { k: 'chapters', label: 'Where you can show up in person', type: 'checks', opts: CH_OPTS, help: 'Pick every chapter you could get to for an event or a shoot.' },
        { k: 'travel', label: 'Would you travel for the right gig?', type: 'radio', opts: ['Yes', 'Sometimes', 'No'] }] },
      { short: 'Platforms', title: 'Where you post', lede: 'Your handles and your numbers as they are today. Be honest: your results show where you stand either way.', fields: [
        { k: 'plats', label: 'Your platforms', type: 'plats', req: true, help: 'At least one. Leave the rest empty.' },
        { k: 'main', label: 'Your main platform', type: 'select', req: true, opts: PLATS.map(function (p) { return [p[0], p[1]]; }) },
        { k: 'engagement', label: 'Your usual engagement rate, if you know it', ph: 'For example 5%' }] },
      { short: 'Your work', title: 'What you make', lede: 'Your topics and formats, and your best work, are how we match you to a gig.', fields: [
        { k: 'topics', label: 'What you post about', type: 'checks', req: true, opts: ['Recipes and cooking', 'Restaurants and food spots', 'Fitness and sport', 'Health and nutrition', 'Fashion and beauty', 'Travel', 'Animals and advocacy', 'Family and parenting', 'Comedy and entertainment', 'Lifestyle', 'Business and money', 'Music and art'] },
        { k: 'formats', label: 'What you make', type: 'checks', req: true, opts: ['Short videos (Reels, TikTok, Shorts)', 'Photos and carousels', 'Long video', 'Livestreams', 'Podcast', 'Writing and blogs', 'Content for a brand\'s own page (UGC)', 'Hosting and on camera', 'Event coverage'] },
        { k: 'best_work', label: 'Links to your best work', type: 'textarea', req: true, max: 1000, help: 'Two or three posts you are proud of, one link a line.' },
        { k: 'vegan_since', label: 'How long you have been Vegan', type: 'select', opts: ['Less than a year', '1 to 3 years', '3 to 10 years', 'More than 10 years', 'Plant-based, not fully Vegan yet'] },
        { k: 'audience', label: 'Who your audience is', type: 'textarea', max: 600, help: 'Where they are, their ages, what they come to you for. Whatever you know.' }] },
      { short: 'Working together', title: 'Working together', lede: 'What you want to do, and what you have done.', fields: [
        { k: 'gig_kinds', label: 'The kinds of gigs you want', type: 'checks', req: true, opts: ['Paid campaigns', 'Product collaborations', 'Hosting and events', 'Content for brands\' own pages', 'Points gigs (to build a record)', 'Speaking and panels'] },
        { k: 'brands', label: 'Brands or events you have worked with', type: 'textarea', max: 800, help: 'Optional. Paid or not.' },
        { k: 'rates', label: 'Your rates, if you have them', type: 'textarea', max: 600, help: 'A post, a Reel or TikTok, hosting for half a day. Only our team sees them.' },
        { k: 'skills', label: 'Other things you do well', type: 'checks', opts: ['Video editing', 'Photography', 'Design', 'Writing', 'Social media management', 'Recipe development', 'Outreach'] },
        { k: 'availability', label: 'When you are usually free', type: 'checks', opts: ['Weekdays', 'Weeknights', 'Weekends'] }] },
      { short: 'Send', title: 'Last thing', lede: 'In your own words.', fields: [
        { k: 'bio', label: 'Tell us about you and what you make', type: 'textarea', req: true, max: 1200 },
        { k: 'why', label: 'What would make this worth it for you?', type: 'textarea', max: 800 },
        { k: 'heard', label: 'How you heard about us', ph: 'A friend, Instagram, an event...' },
        { k: 'anything', label: 'Anything else', type: 'textarea', max: 800 },
        { k: 'confirm', label: 'My numbers are true as of today, and Vegans Explore may contact me about gigs.', type: 'confirm', req: true }] }
    ];
    var APP_KEY = 'vg_creator_apply';
    state.app = {}; try { state.app = JSON.parse(localStorage.getItem(APP_KEY) || '{}') || {}; } catch (e) {}
    function keepApp() { try { localStorage.setItem(APP_KEY, JSON.stringify(state.app)); } catch (e) {} }
    // Where they came from (Sean, 2026-10-30: "see that somebody signed up because they went through Brooke's page"). The People page's
    // creator ad and "Is this you?" (/public/ve-promo.js) keep the page they clicked on; the walkthrough and the application's first step
    // count as landed and started, and the application carries the page, the channel and, from "Is this you?", the profile it claims
    // (?claim=<slug>). Depot > Ambassadors > Where they came from.
    var CLAIM = ''; try { CLAIM = (new URLSearchParams(location.search).get('claim') || '').toLowerCase(); } catch (e) {}
    if (!/^[a-z0-9-]{2,120}$/.test(CLAIM)) CLAIM = '';
    var tracks = guide || opts.start === 'join/1';
    function promoSrc() { return window.VEPromo ? VEPromo.source('creator-register') : null; }
    function claimName() { var s2 = promoSrc(); return s2 && s2.claim === CLAIM ? s2.claim_name : ''; }
    if (CLAIM && !state.app.name && claimName()) { state.app.name = claimName(); keepApp(); }
    function promoStep(h) {
      if (!tracks || !window.VEPromo) return;
      if (h[0] === 'overview' && guide) VEPromo.step('creator-register', 'landed');
      if (h[0] === 'join' && h[1] === '1') VEPromo.step('creator-register', 'started');
    }
    if (tracks && !window.VEPromo) {
      var ps = document.createElement('script'); ps.src = '/public/ve-promo.js';
      ps.onload = function () {
        var h0 = (here() || opts.start || (guide ? 'overview' : 'dashboard')).split('/');
        if (CLAIM && !state.app.name && claimName()) { state.app.name = claimName(); keepApp(); if (h0[0] === 'join') draw(); }
        promoStep(h0);
      };
      document.head.appendChild(ps);
    }
    function stepMissing(i) {
      var A = state.app, miss = [];
      FORM[i - 1].fields.forEach(function (f) {
        if (!f.req) return;
        if (f.type === 'plats') { if (!PLATS.some(function (p) { return String(A[p[0]] || '').trim(); })) miss.push('at least one platform'); return; }
        var v = A[f.k];
        if (f.type === 'checks' ? !(v && v.length) : f.type === 'confirm' ? !v : !String(v || '').trim()) miss.push(f.label.toLowerCase());
      });
      if (i === 1 && A.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(A.email)) miss.push('an email that looks right');
      return miss;
    }

    function draw() {
      var h = (here() || opts.start || (guide ? 'overview' : 'dashboard')).split('/');
      if (!guide && (h[0] === 'overview' || h[0] === 'join')) h = ['dashboard'];
      var html = h[0] === 'gig' ? V.gig(h[1]) : h[0] === 'apply' ? V.apply(h[1], h[2]) : h[0] === 'mine' ? V.mine(h[1]) : h[0] === 'profile' ? V.profile(h[1]) : h[0] === 'how' ? V.how() : h[0] === 'board' ? V.board()
        : h[0] === 'join' ? V.join(h[1]) : h[0] === 'dashboard' ? V.dashboard() : guide ? V.overview() : V.dashboard();
      if (guide && opts.tour !== false && !(h[0] === 'join' && h[1] === 'done')) {
        var land = h[0] === 'overview' || !h[0], fin = h[0] === 'join' || land;
        html = (land ? '' : topRow(h)) + html + (fin ? '' : tourBar(h));
      }
      el.innerHTML = BASE === '#' ? html : html.replace(/href="#(?!\/)/g, 'href="' + BASE);
      promoStep(h);
      // Her line plays by itself on each new view once the visitor has pressed Play (a Guide's own rail cues it when the walkthrough is off).
      if (guide && opts.tour !== false) voice.cue(lineKey(h)); else voice.sync();
      if (opts.onView) opts.onView(h[0] || (guide ? 'overview' : 'dashboard'), h, lineKey(h));
    }
    el.addEventListener('input', function (e) { if (e.target.hasAttribute('data-a')) appInput(e.target); });
    el.addEventListener('change', function (e) { if (e.target.hasAttribute('data-a')) appInput(e.target); });
    function appInput(t) {
      var k = t.getAttribute('data-a');
      if (t.type === 'checkbox' && t.name === k) { state.app[k] = Array.prototype.map.call(el.querySelectorAll('input[name="' + k + '"]:checked'), function (x) { return x.value; }); }
      else if (t.type === 'checkbox') state.app[k] = t.checked;
      else state.app[k] = t.value;
      keepApp();
    }
    el.addEventListener('input', function (e) {
      var k = e.target.getAttribute('data-f'); if (!k) return;
      state[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      if (k !== 'q') draw(); else { var pos = e.target.selectionStart; draw(); var q = el.querySelector('[data-f=q]'); if (q) { q.focus(); q.setSelectionRange(pos, pos); } }
    });
    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-unclaim]')) { CLAIM = ''; draw(); return; }
      var j = e.target.closest('[data-join-next],[data-join-send]');
      if (j) {
        var at = +(j.getAttribute('data-join-next') || FORM.length), miss = stepMissing(at), err = el.querySelector('#vg-join-err');
        if (miss.length) { err.textContent = 'Still needed: ' + miss.join(', ') + '.'; return; }
        if (j.hasAttribute('data-join-next')) { go('#join/' + (at + 1)); return; }
        for (var s = 1; s <= FORM.length; s++) if (stepMissing(s).length) { go('#join/' + s); return; }
        j.disabled = true; j.textContent = 'Sending...';
        fetch(SB + '/functions/v1/ve-ambassador', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'creator_apply', answers: state.app, source: location.pathname, attribution: promoSrc(), claim: CLAIM || null }) })
          .then(function (r) { return r.json(); }).then(function (d) {
            if (!d || !d.ok) { j.disabled = false; j.textContent = 'Send my application'; err.textContent = (d && d.message) || 'That did not go through. Try again in a minute.'; return; }
            state.app = {}; try { localStorage.removeItem(APP_KEY); } catch (x) {}
            go('#join/done');
          }, function () { j.disabled = false; j.textContent = 'Send my application'; err.textContent = 'That did not go through. Check your connection and try again.'; });
        return;
      }
      var t = e.target.closest('[data-next],[data-send],[data-claim],[data-lb]'); if (!t) return;
      if (t.hasAttribute('data-lb')) { var lb = document.createElement('div'); lb.className = 'vg-lb'; lb.innerHTML = '<img src="' + esc(t.getAttribute('data-lb')) + '" alt="">'; lb.onclick = function () { lb.remove(); }; document.body.appendChild(lb); return; }
      if (t.hasAttribute('data-next')) {
        var p = t.getAttribute('data-next').split('|'), inp = el.querySelector('#vg-in'), v = (inp && inp.value || '').trim();
        if (!v) { el.querySelector('#vg-err').textContent = 'Fill this in to go on.'; return; }
        if (inp.type === 'url' && !/^https?:\/\/\S+\.\S+/.test(v)) { el.querySelector('#vg-err').textContent = 'That needs to be a full link, starting with https://'; return; }
        state.form[p[0]][p[2]] = v; go('#apply/' + p[0] + '/' + (+p[1] + 1)); return;
      }
      var id = t.getAttribute('data-send') || t.getAttribute('data-claim'), g = gig(id);
      if (t.hasAttribute('data-send') && !demo && opts.send) {
        t.disabled = true;
        opts.send(id, state.form[id] || {}).then(function (r) {
          if (!r || !r.ok) { t.disabled = false; toast((r && r.message) || 'That did not go through.'); return; }
          keep({ gig: id, status: r.status || 'applied', at: new Date().toISOString(), next: 'Waiting for the team' }); toast('Application sent.'); go('#mine/' + (r.status || 'applied'));
        });
        return;
      }
      if (t.hasAttribute('data-send')) {
        keep({ gig: id, status: mineOf(id) && mineOf(id).status === 'audition' ? 'shortlisted' : 'applied', at: new Date().toISOString(), next: demo ? 'Sample: in the real board the partner reviews it' : 'Waiting for the partner' });
        toast(demo ? 'Sent in the sample. Nothing left this page.' : 'Application sent.'); go('#mine/applied');
      } else {
        keep({ gig: id, status: 'booked', at: new Date().toISOString(), next: 'Claimed: do it and send it in' });
        toast(demo ? 'Claimed in the sample. Nothing left this page.' : 'Claimed.'); go('#mine/booked');
      }
    });
    if (!opts.external) window.addEventListener('hashchange', function () { draw(); var top = el.getBoundingClientRect().top; if (top < 0) el.scrollIntoView({ block: 'start' }); });
    draw();
    return { draw: draw, data: D, lineKey: function () { return lineKey((here() || opts.start || (guide ? 'overview' : 'dashboard')).split('/')); } };
  }

  // The live board: today's bounties, as points gigs, until paid gigs are posted here (ve-bounties list).
  function live(el, opts) {
    opts = opts || {};
    var m = window.VEAuth && VEAuth.getMember ? VEAuth.getMember() : null;
    var city = opts.city || (m && m.home_community) || 'south-florida';
    var tok = window.VEAuth && VEAuth.getToken ? VEAuth.getToken() : '';
    return fetch(SB + '/functions/v1/ve-bounties', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok }, body: JSON.stringify({ action: 'list', community: city }) })
      .then(function (r) { return r.json(); }).then(function (d) {
        var camps = {}; (d.campaigns || []).forEach(function (c) { camps[c.id] = c; });
        var gigs = (d.bounties || []).filter(function (b) { return b.claims_open || b.mine; }).map(function (b) {
          var c = camps[b.campaign_id];
          var kind = b.gig_kind || 'bounty', mode = b.apply_mode || 'claim';
          return { id: b.id, title: String(b.title || '').replace(/^[^:]+:\s*/, ''), partner: { name: b.partner_name || (c ? c.title : 'Vegans Explore'), kind: KIND[kind] || 'Bounty' }, kind: kind,
            pay: { type: b.cash_cents ? 'paid' : b.perk ? 'perk' : 'points', cents: b.cash_cents || 0, perk: b.perk || '', points: b.points }, mode: mode,
            chapters: [city], remote: !!b.remote, posted: b.created_at || new Date().toISOString(), closes: b.apply_by || b.claims_close_at || b.due_at, spots: b.spots_left,
            brief: b.brief, deliverables: [b.deliverable].filter(Boolean), timeline: b.due_at ? 'Due ' + new Date(b.due_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Open',
            href: mode === 'claim' ? '/bounties?community=' + encodeURIComponent(city) + (c ? '&campaign=' + encodeURIComponent(c.slug) : '') + '&id=' + b.id : '',
            asks: b.asks || [], audition: b.audition_prompt || '', req: { min_followers: b.req_min_followers || 0, platforms: b.req_platforms || [], level: b.req_level || 0 } };
        });
        var mine = (d.bounties || []).filter(function (b) { return b.mine && b.mine.status !== 'released'; }).map(function (b) {
          var s = b.mine.status, map = { applied: 'applied', shortlisted: 'shortlisted', audition: 'audition', not_selected: 'not_selected', approved: 'paid', submitted: 'delivered' };
          return { gig: b.id, status: map[s] || 'booked', next: s === 'approved' ? num(b.mine.points_awarded || b.points) + ' points' : map[s] ? '' : 'Open it in Bounties' };
        });
        var creator = { name: m && m.name, avatar: m && (m.avatar_url || m.photo_url), city: CHAPTER_NAMES[city], chapters: [city], level: m && m.level || 1, points: m && m.points || 0 };
        return mount(el, { live: true, onView: opts.onView, send: function (id, app) {
          return fetch(SB + '/functions/v1/ve-bounties', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok }, body: JSON.stringify({ action: 'apply', bounty_id: id, application: app }) }).then(function (r) { return r.json(); });
        }, data: { creator: creator, gigs: gigs, mine: mine } });
      });
  }

  window.VEGigs = { mount: mount, live: live, checks: checks, standing: standing, voice: voice, LINES: LINES, KAI: '/gigs/sample/img/kai-avatar.webp' };
})();
