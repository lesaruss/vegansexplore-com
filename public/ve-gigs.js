/* ve-gigs.js: the Gig Board (Sean, 2026-10-30: "the actual mechanism for them to find gigs... like Casting Networks or Backstage
   where they can go on daily and see what opportunities are available... whatever we create, I want become the way the bounties
   work as well"). One board for every way we pay a creator or member: paid campaigns, collaborations (perks), hosting, events and
   points (the old Bounties). A gig is applied to, auditioned for or claimed; it may ask for proof (a pitch, examples, an audition,
   a rate); it may require followers on given platforms, a level or a city. Small creators rise by results (How you rise).

   One view at a time, the address carries it: #board, #gig/<id>, #apply/<id>/<step>, #mine[/<status>], #profile, #how.

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
    '.vg input[type=search],.vg input[type=text],.vg input[type=url],.vg textarea,.vg select{font:inherit;font-size:14px;padding:10px 12px;border:1px solid rgba(0,0,0,.22);border-radius:6px;background:#fff;color:#1a1a1a;width:100%;}',
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
    if (!document.getElementById('ve-gigs-css')) { var st = document.createElement('style'); st.id = 've-gigs-css'; st.textContent = CSS; document.head.appendChild(st); }
    el.classList.add('vg');
    var D = opts.data || { creator: {}, gigs: [], mine: [] };
    var demo = !!opts.demo, KEY = 've_gigs_demo';
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
    function head(active) {
      return (demo ? '<p class="vg-note"><b>Demo.</b> Kai Monroe is invented and drawn in our style, every brand here is illustrative, and nothing you do is sent. This is the dashboard an official creator opens every day.</p>' : '') +
        (active === 'overview' || active === 'board' ? strip() : '');
    }

    function card(g) {
      var ch = checks(g, C), ok = ch.every(function (x) { return x.ok; }), m = mineOf(g.id), miss = ch.filter(function (x) { return !x.ok; })[0];
      return '<a class="vg-card' + (ok ? '' : ' no') + '" href="#gig/' + esc(g.id) + '">' +
        '<div class="vg-top"><span class="vg-partner">' + esc(g.partner.name) + ' · ' + esc(KIND[g.kind] || g.kind) + '</span><span class="vg-tag ' + (g.mode === 'audition' ? 'warn' : '') + '">' + esc(MODE[g.mode]) + '</span></div>' +
        '<div class="vg-title">' + esc(g.title) + '</div><div class="vg-pay">' + esc(payText(g.pay)) + '</div>' +
        '<div class="vg-line">' + esc(where(g)) + (ch.length ? ' · ' + esc(ch.map(function (x) { return x.label; }).filter(function (l) { return !/^Shows up/.test(l); }).join(' · ')) : '') + '</div>' +
        '<div class="vg-tags">' + (m ? '<span class="vg-tag ' + STATUS[m.status][1] + '">' + STATUS[m.status][0] + '</span>' : ok ? '<span class="vg-tag ok">You qualify</span>' : '<span class="vg-tag no">' + esc(miss.need) + '</span>') +
        '<span class="vg-tag">' + esc(closesText(g)) + '</span>' + (g.spots ? '<span class="vg-tag">' + g.spots + (g.spots === 1 ? ' spot' : ' spots') + '</span>' : '') +
        (g.applicants ? '<span class="vg-tag">' + num(g.applicants) + ' applied</span>' : '') + '</div></a>';
    }

    // My gigs wear the board's tile (Sean, 2026-10-30: "my gigs should look the same way... three columns"), with where it stands.
    function mineCard(m) {
      var g = gig(m.gig), s = STATUS[m.status], aud = g && m.status === 'audition' && (g.asks || []).indexOf('audition') > -1;
      var inner = '<div class="vg-top"><span class="vg-partner">' + esc(g ? g.partner.name + ' · ' + (KIND[g.kind] || g.kind) : 'Past gig') + '</span><span class="vg-tag ' + s[1] + '">' + s[0] + '</span></div>' +
        '<div class="vg-title">' + esc(g ? g.title : m.title) + '</div>' + (g ? '<div class="vg-pay">' + esc(payText(g.pay)) + '</div>' : '') +
        (m.next ? '<div class="vg-next' + (aud ? ' warn' : '') + '">' + esc(m.next) + '</div>' : '') +
        '<div class="vg-tags">' + (aud ? '<span class="vg-tag warn">Record your audition</span>' : '') + (g ? '<span class="vg-tag">' + esc(where(g)) + '</span>' : '') +
        (m.at ? '<span class="vg-tag">' + (m.status === 'applied' ? 'Applied ' : 'Updated ') + new Date(m.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + '</span>' : '') + '</div>';
      var href = aud ? '#apply/' + g.id + '/' + ((g.asks || []).indexOf('audition') + 1) : g ? '#gig/' + g.id : '';
      return href ? '<a class="vg-card" href="' + esc(href) + '">' + inner + '</a>' : '<div class="vg-card">' + inner + '</div>';
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
      overview: function () {
        var open = D.gigs.filter(function (g) { return qualifies(g, C) && !mineOf(g.id); }).length;
        var play = D.mine.filter(function (m) { return ['applied', 'shortlisted', 'audition', 'booked'].indexOf(m.status) > -1; });
        var todo = D.mine.filter(function (m) { return m.status === 'audition' || m.status === 'booked'; });
        var done = (C.kit_done || []).filter(function (x) { return x[1]; }).length, all = (C.kit_done || []).length;
        var tile = function (href, n, t, d) { return '<a class="vg-card vg-go" href="' + href + '"><b class="vg-big">' + n + '</b><div class="vg-title">' + t + '</div><div class="vg-line">' + d + '</div></a>'; };
        return head('overview') + '<h2 class="vg-h">Your Creator Dashboard</h2><p class="vg-help" style="font-size:14.5px;max-width:860px;margin:0 0 14px">Everything you do with us, in one place. Use the menu at the top to move between its parts: find gigs, follow the ones you are in, keep your media kit sharp, and see how you rise.</p>' +
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
        return head('board') + '<h2 class="vg-h">Open gigs</h2>' +
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
      }
    };

    function draw() {
      var h = (location.hash || '#overview').slice(1).split('/');
      var html = h[0] === 'gig' ? V.gig(h[1]) : h[0] === 'apply' ? V.apply(h[1], h[2]) : h[0] === 'mine' ? V.mine(h[1]) : h[0] === 'profile' ? V.profile(h[1]) : h[0] === 'how' ? V.how() : h[0] === 'board' ? V.board() : V.overview();
      el.innerHTML = html;
      if (opts.onView) opts.onView(h[0]);
    }
    el.addEventListener('input', function (e) {
      var k = e.target.getAttribute('data-f'); if (!k) return;
      state[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      if (k !== 'q') draw(); else { var pos = e.target.selectionStart; draw(); var q = el.querySelector('[data-f=q]'); if (q) { q.focus(); q.setSelectionRange(pos, pos); } }
    });
    el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-next],[data-send],[data-claim],[data-lb]'); if (!t) return;
      if (t.hasAttribute('data-lb')) { var lb = document.createElement('div'); lb.className = 'vg-lb'; lb.innerHTML = '<img src="' + esc(t.getAttribute('data-lb')) + '" alt="">'; lb.onclick = function () { lb.remove(); }; document.body.appendChild(lb); return; }
      if (t.hasAttribute('data-next')) {
        var p = t.getAttribute('data-next').split('|'), inp = el.querySelector('#vg-in'), v = (inp && inp.value || '').trim();
        if (!v) { el.querySelector('#vg-err').textContent = 'Fill this in to go on.'; return; }
        if (inp.type === 'url' && !/^https?:\/\/\S+\.\S+/.test(v)) { el.querySelector('#vg-err').textContent = 'That needs to be a full link, starting with https://'; return; }
        state.form[p[0]][p[2]] = v; location.hash = '#apply/' + p[0] + '/' + (+p[1] + 1); return;
      }
      var id = t.getAttribute('data-send') || t.getAttribute('data-claim'), g = gig(id);
      if (t.hasAttribute('data-send') && !demo && opts.send) {
        t.disabled = true;
        opts.send(id, state.form[id] || {}).then(function (r) {
          if (!r || !r.ok) { t.disabled = false; toast((r && r.message) || 'That did not go through.'); return; }
          keep({ gig: id, status: r.status || 'applied', at: new Date().toISOString(), next: 'Waiting for the team' }); toast('Application sent.'); location.hash = '#mine/' + (r.status || 'applied');
        });
        return;
      }
      if (t.hasAttribute('data-send')) {
        keep({ gig: id, status: mineOf(id) && mineOf(id).status === 'audition' ? 'shortlisted' : 'applied', at: new Date().toISOString(), next: demo ? 'Sample: in the real board the partner reviews it' : 'Waiting for the partner' });
        toast(demo ? 'Sent in the sample. Nothing left this page.' : 'Application sent.'); location.hash = '#mine/applied';
      } else {
        keep({ gig: id, status: 'booked', at: new Date().toISOString(), next: 'Claimed: do it and send it in' });
        toast(demo ? 'Claimed in the sample. Nothing left this page.' : 'Claimed.'); location.hash = '#mine/booked';
      }
    });
    window.addEventListener('hashchange', function () { draw(); var top = el.getBoundingClientRect().top; if (top < 0) el.scrollIntoView({ block: 'start' }); });
    draw();
    return { draw: draw, data: D };
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

  window.VEGigs = { mount: mount, live: live, checks: checks, standing: standing };
})();
