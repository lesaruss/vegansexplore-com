/* The Media Room: a mock in the Explorer Guide's shape (Sean, 2026-11-15, on the first Media Room mock: "This is lacking our style... look at how
 * we're doing our guides now and how this could follow suit"). Copied from mocks/nominate/guide.js, which follows guide-scripts/welcome-guide.js
 * (head, crumb, the Getting started card, artRow, the .vxc call to action, the rail's Back / N of M / Next). Liz hosts it: the main face, the
 * bridge to businesses (canon-ve-guide-roster). Her lines are text drafts for Sean; nothing is recorded, so there is no Play. Illustrative,
 * nothing saves. Playbook ve-newsroom.
 */
(function () {
  var PIC = '/public/guides/', SAMPLE = '/business/sample/img/';
  var CSS = [
    '.nm-mock{margin:0;background:#FFF7EC;color:#5a3a00;border-bottom:1px solid #f5d9b0;font-size:12px;font-weight:600;padding:8px 40px;}',
    '.nm-mock b{font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#b45309;border:2px solid #b45309;border-radius:6px;padding:1px 7px;margin-right:8px;}',
    '.dg-joinbox a.dg-btn{text-decoration:none;}',
    '.nm-quote{border-left:4px solid #F69820;background:var(--warm);border-radius:0 12px 12px 0;padding:12px 16px;margin:12px 0 4px;font-size:15px;line-height:1.55;}',
    '.nm-quote small{display:flex;align-items:center;gap:8px;margin-top:6px;font-size:12px;font-weight:800;color:#8a5a00;flex-wrap:wrap;}',
    '.nm-play{display:inline-flex;align-items:center;gap:6px;color:var(--g);font-weight:800;}',
    '.nm-play i{width:22px;height:22px;border-radius:50%;background:var(--g);display:grid;place-items:center;}',
    '.nm-play i::after{content:"";border-left:7px solid #fff;border-top:4px solid transparent;border-bottom:4px solid transparent;margin-left:2px;}',
    '.nm-f{display:block;font-size:12px;font-weight:800;margin:10px 0 4px;color:var(--ink);}',
    '.nm-f small{font-weight:600;color:var(--ink55);}',
    '.nm-in{width:100%;border:1px solid #cfcfcf;border-radius:6px;padding:11px 12px;font:inherit;font-size:14px;background:#fff;color:var(--ink);}',
    '.nm-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 14px;}',
    '.nm-chips{display:flex;flex-wrap:wrap;gap:6px;}',
    '.nm-chip{border:1px solid #cfcfcf;border-radius:6px;padding:8px 12px;font-size:13px;font-weight:700;background:#fff;cursor:pointer;font-family:inherit;}',
    '.nm-chip[aria-pressed=true]{background:var(--g);border-color:var(--g);color:#fff;}',
    '.nm-modes{display:grid;grid-template-columns:1.25fr 1fr 1fr;gap:8px;margin:4px 0 12px;}',
    '.nm-mode{border:1px solid #cfcfcf;border-radius:8px;padding:10px 12px;font-size:12.5px;line-height:1.4;color:var(--ink75);background:#fff;text-align:left;font-family:inherit;cursor:pointer;}',
    '.nm-mode b{display:flex;align-items:center;gap:6px;font-size:14px;color:var(--ink);margin-bottom:2px;}',
    '.nm-mode[aria-pressed=true]{border:2px solid var(--g);background:var(--gl);}',
    '.nm-best{margin-left:auto;font-size:9.5px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;background:#F69820;color:#1a1a1a;border-radius:5px;padding:2px 6px;}',
    '.nm-rec{display:flex;align-items:center;gap:12px;border:1px dashed var(--gm);border-radius:12px;padding:12px;background:#f6fbf6;flex-wrap:wrap;}',
    '.nm-dot{width:44px;height:44px;border-radius:50%;background:#dc2626;display:grid;place-items:center;flex:none;box-shadow:0 0 0 6px rgba(220,38,38,.12);border:0;cursor:pointer;}',
    '.nm-dot i{width:14px;height:14px;border-radius:3px;background:#fff;}',
    '.nm-wave{flex:1 1 140px;height:26px;border-radius:4px;background:repeating-linear-gradient(90deg,var(--g) 0 3px,transparent 3px 7px);-webkit-mask:linear-gradient(90deg,#000 0 58%,rgba(0,0,0,.18) 58%);mask:linear-gradient(90deg,#000 0 58%,rgba(0,0,0,.18) 58%);}',
    '.nm-rec small{flex:1 1 260px;font-size:12.5px;font-weight:700;color:var(--ink75);}',
    '.nm-check{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;line-height:1.5;margin:10px 0;color:var(--ink75);}',
    '.nm-check input{margin-top:4px;accent-color:var(--g);}',
    '.nm-check b{color:var(--ink);}',
    '.nm-rv{display:grid;grid-template-columns:150px minmax(0,1fr);gap:6px 14px;font-size:14px;margin:6px 0 10px;}',
    '.nm-rv dt{font-weight:800;color:var(--ink55);font-size:12px;letter-spacing:.06em;text-transform:uppercase;padding-top:2px;}',
    '.nm-prog{height:6px;border-radius:3px;background:#eee;margin:6px 0 4px;overflow:hidden;}',
    '.nm-prog i{display:block;height:100%;background:var(--g);}',
    '.nm-form .wg-gs-b{height:auto !important;overflow:visible !important;}',
    '.nm-steps{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 0;}.nm-steps span{font-size:12px;font-weight:800;border-radius:6px;padding:6px 11px;border:1px solid #cfcfcf;color:var(--ink55);}.nm-steps span.on{background:var(--g);border-color:var(--g);color:#fff;}.nm-steps span.dn{background:var(--gl);border-color:var(--gm);color:var(--g);}',
    '.nm-google{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:44px;border:1px solid #dadce0;border-radius:6px;background:#fff;font:700 14px Montserrat,sans-serif;cursor:pointer;color:var(--ink);}.nm-google span{font-weight:900;color:#4285F4;font-size:16px;}',
    '.nm-apple{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:44px;border:0;border-radius:6px;background:#000;color:#fff;font:700 14px Montserrat,sans-serif;cursor:pointer;margin-bottom:8px;}.nm-apple svg{width:16px;height:16px;fill:#fff;}',
    '.dg-maya.nm-vid::after{content:"\\25B6  Play Kai\'s welcome for you";position:absolute;left:12px;bottom:12px;background:rgba(0,0,0,.72);color:#fff;font:800 12px Montserrat,sans-serif;letter-spacing:.04em;padding:9px 12px;border-radius:6px;}',
    '.nm-gi{margin:0;display:flex;flex-direction:column;gap:8px;align-items:flex-start;}.nm-gi img{display:block;width:100%;border-radius:10px;border:1px solid var(--line);}.nm-gi.p{width:min(300px,100%);}.nm-gi.s{width:min(210px,100%);}.nm-gi figcaption{font-size:12.5px;font-weight:800;color:var(--ink55);}',
    '.nm-gfx{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;margin:8px 0 18px;}',
    '.nm-g{position:relative;border-radius:12px;overflow:hidden;background:#14301c;color:#fff;display:flex;flex-direction:column;}',
    '.nm-g.sq{width:min(340px,100%);aspect-ratio:1;}.nm-g.st{width:min(220px,100%);aspect-ratio:9/16;}',
    '.nm-g-pic{flex:1 1 auto;min-height:0;background:#fff center bottom/contain no-repeat;}',
    '.nm-g-t{padding:12px 14px 40px;background:#14301c;position:relative;}',
    '.nm-g-t small{display:block;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#c5f2c7;}',
    '.nm-g-t b{display:block;font-size:19px;font-weight:900;line-height:1.15;margin:4px 0;}',
    '.nm-g.st .nm-g-t b{font-size:17px;}',
    '.nm-g-t span{font-size:12px;font-weight:600;color:#e8f5e9;}',
    '.nm-g-logo{position:absolute;right:12px;bottom:10px;height:20px;}',
    '.nm-stamp{position:absolute;top:10px;right:10px;z-index:2;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#b45309;background:#fff;border:2px solid #b45309;border-radius:6px;padding:1px 7px;}',
    '.nm-me{position:relative;width:min(260px,100%);aspect-ratio:1;border-radius:12px;overflow:hidden;border:1px solid var(--line);}.nm-me img{width:100%;height:100%;object-fit:cover;display:block;}',
    '.nm-me-b{flex:1 1 280px;min-width:0;font-size:15px;line-height:1.55;color:var(--ink75);}.nm-me-b b{display:block;font-size:20px;font-weight:900;color:var(--ink);margin-bottom:4px;}',
    '.nm-q .wg-gs-pic{position:relative;}',
    '.nm-kq-btn{position:absolute;left:10px;bottom:16px;display:inline-flex;align-items:center;gap:8px;border:0;border-radius:6px;background:rgba(0,0,0,.78);color:#fff;font:800 12px Montserrat,sans-serif;letter-spacing:.04em;padding:9px 12px;cursor:pointer;}',
    '.nm-kq-ic{width:0;height:0;border-left:9px solid #fff;border-top:6px solid transparent;border-bottom:6px solid transparent;}',
    '.nm-kq.on .nm-kq-ic{width:10px;height:12px;border:0;border-left:3px solid #fff;border-right:3px solid #fff;}',
    '.nm-kq-bar{position:absolute;left:0;right:0;bottom:0;height:6px;background:rgba(0,0,0,.25);}',
    '.nm-kq-bar b{display:block;height:100%;width:0;background:#22C55E;}',
    '.nm-kq video{display:block;width:100%;height:100%;object-fit:cover;}',
    '.nm-hint{font-size:12.5px;color:var(--ink55);margin:8px 0 0;}',
    '.nm-sel{appearance:none;-webkit-appearance:none;padding-right:44px;background:#fff url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%278%27%3E%3Cpath d=%27M1 1l5 5 5-5%27 stroke=%27%231a1a1a%27 stroke-width=%272%27 fill=%27none%27/%3E%3C/svg%3E") no-repeat right 16px center;}',
    '.nm-spots{list-style:none;padding:0;margin:0;display:grid;gap:8px;}',
    '.nm-spots li{border:1px solid var(--line);border-radius:10px;padding:10px 12px;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;}',
    '.nm-spots li>b{font-size:14px;}',
    '.nm-spots li.done{background:var(--gl);border-color:var(--gm);}',
    '.nm-spots li.done a{margin-left:auto;font-size:12px;font-weight:800;color:var(--g);}',
    '.nm-spots li.now{display:block;}.nm-spots li.now>b{display:block;margin-bottom:6px;}.nm-spots li.now .dg-btn{margin-top:8px;}',
    '@media (max-width:900px){.nm-form.nm-q .wg-gs-pic{display:block;width:100%;height:auto;aspect-ratio:1;max-width:240px;flex:none;}}',
    '.nm-or{text-align:center;font-size:12px;font-weight:700;color:var(--ink55);margin:12px 0 2px;}',
    '@media (max-width:900px){.nm-mock{padding:8px 16px;}.nm-form .wg-gs-pic{display:none;}.nm-grid,.nm-modes{grid-template-columns:1fr;}.nm-rv{grid-template-columns:1fr;gap:2px;}.nm-rv dd{margin-bottom:8px;}}',
    '.mr-tag{display:inline-block;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;border-radius:6px;padding:2px 7px;margin-right:6px;vertical-align:2px;border:2px solid #1a1a1a;}',
    '.mr-tag.pitch{background:#FFEBD1;}.mr-tag.research{background:#E8F5E9;}.mr-tag.lead{background:#FFE3EE;}.mr-tag.ours{background:#fff;}.mr-tag.guest{background:#F69820;}',
    '.mr-meta{font-size:12.5px;font-weight:800;color:#5c5c5c;margin:2px 0 4px;}',
    '.mr-facts{display:grid;grid-template-columns:120px minmax(0,1fr);gap:6px 14px;font-size:14px;margin:8px 0 12px;}.mr-facts dt{font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#5c5c5c;padding-top:2px;}.mr-facts dd{margin:0;}',
    '@media (max-width:600px){.mr-facts{grid-template-columns:1fr;gap:2px;}.mr-facts dd{margin-bottom:6px;}}',
    '.mr-kit{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:6px 0 10px;}.mr-kit i{display:block;aspect-ratio:1;border-radius:10px;border:2px solid #1a1a1a;background:#eee center/cover no-repeat;}',
    '.mr-link{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border:2px solid #1a1a1a;border-radius:10px;padding:10px 12px;background:#FFEBD1;margin:6px 0 10px;}.mr-link code{flex:1 1 220px;font:800 15px Montserrat,sans-serif;}',
  ].join('');
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pic(p) { return PIC + p; }
  function art(slug) { return window.VEGuideArt ? VEGuideArt(slug, 'square') : ''; }

  // ---------- content ----------
  var CONF = {
    root: 'The Media Room',
    tabs: [
      { k: 'overview', label: 'Overview', say: 'Hi, I\'m Liz. This is the Media Room: stories, data and people from inside the Vegan community, for the people who tell them.' },
      { k: 'feed', label: 'Your Feed', say: 'Only your beats, and every item says what it is, what it is tied to, and whether anyone else has it.' },
      { k: 'cover', label: 'A Story Kit', say: 'Opening a kit is private: nobody is told. When you want to go ahead, request the interview and our press desk answers the same day.' },
      { k: 'settings', label: 'Your Settings', say: 'Your beats, how far ahead you plan, and how often you hear from us. Nothing outside your beats ever reaches you.' },
      { k: 'join', label: 'Join', say: 'Joining is free for press. Journalists use their work email; podcasters add a link to their show.' }
    ]
  };
  var TABS = CONF.tabs;

  // ---------- shared pieces, from welcome-guide.js ----------
  var main = document.getElementById('dgMain');
  var menuEl = document.getElementById('dgMenu'), menuSel = document.getElementById('dgMenuSelect');
  var bubble = document.getElementById('dgBubble'), tourEl = document.getElementById('dgTour'), tourM = document.getElementById('dgTourM');
  var foldBtn = document.getElementById('dgFold'), railEl = document.getElementById('dgRail');
  var curTab = 'overview';
  function tab(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i].k === k) return TABS[i]; return TABS[0]; }
  function idx(k) { return TABS.indexOf(tab(k)); }
  function href(k) { return '#/' + (k === 'overview' ? '' : k); }
  function head(k, h, lede) {
    return '<div class="dg-head"><div><div class="dg-k">' + esc(k) + '</div><h2 class="dg-h1">' + esc(h) + '</h2></div></div>' + (lede ? '<p class="dg-lede">' + lede + '</p>' : '');
  }
  function crumb(label) { return '<div class="dg-crumb"><a href="#/">' + esc(CONF.root) + '</a> &rsaquo; ' + esc(label) + '</div>'; }
  function card(kicker, title, picUrl, body, btns, cls) {
    return '<section class="wg-gs' + (cls ? ' ' + cls : '') + '"><span class="wg-gs-pic"><img src="' + esc(picUrl) + '" alt="" decoding="async" width="640" height="640"></span>' +
      '<div class="wg-gs-b"><div class="vgi-k">' + esc(kicker) + '</div><h3 class="wg-gs-t">' + esc(title) + '</h3>' + body +
      (btns ? '<div class="wg-gs-btns">' + btns + '</div>' : '') + '</div></section>';
  }
  function lines(ps) { return ps.map(function (x) { return '<p>' + x + '</p>'; }).join(''); }
  function artRow(picUrl, title, txt, link, more) {
    if (!link) return '<li class="wg-art"><span class="wg-art-img" style="background-image:url(&quot;' + esc(picUrl) + '&quot;)"></span><div><span class="wg-art-t">' + esc(title) + '</span><p>' + esc(txt) + '</p></div></li>';
    return '<li class="wg-art"><a href="' + esc(link) + '" tabindex="-1" aria-hidden="true"><span class="wg-art-img" style="background-image:url(&quot;' + esc(picUrl) + '&quot;)"></span></a>' +
      '<div><a class="wg-art-t" href="' + esc(link) + '">' + esc(title) + '</a><p>' + esc(txt) + '</p><a class="wg-art-more" href="' + esc(link) + '">' + esc(more || 'Read more') + ' &rsaquo;</a></div></li>';
  }
  function group(label, rows) { return '<div class="wg-grp"><h5>' + esc(label) + '</h5><ol>' + rows.join('') + '</ol></div>'; }
  function cta(k, title, text, go) {
    if (window.VEExplorerCard) VEExplorerCard.html({}); // loads the card's styles, as welcome-guide.js does
    return '<section class="vxc" aria-label="' + esc(go[0]) + '"><div class="vxc-b"><div class="vxc-k">' + esc(k) + '</div><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p></div>' +
      '<a class="vxc-go" href="' + esc(go[1]) + '">' + esc(go[0]) + '</a></section>';
  }
  function next(k) { var i = idx(k); return TABS[Math.min(TABS.length - 1, i + 1)]; }
  function tag(kind) { var t = { pitch: 'Pitch', research: 'Research', lead: 'Community lead', ours: 'Our news', guest: 'Guest' }[kind]; return '<span class="mr-tag ' + kind + '">' + t + '</span>'; }
  // Every item carries the facts its kind of outlet runs on (the Pitch Gate's type checks) and its ties to us (panel, 2026-11-15).
  function facts(list) { return '<dl class="mr-facts">' + list.map(function (f) { return '<dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd>'; }).join('') + '</dl>'; }
  function feedRow(kind, picUrl, title, txt, meta, sample) {
    return '<li class="wg-art"><a href="#/cover" tabindex="-1" aria-hidden="true"><span class="wg-art-img" style="background-image:url(&quot;' + esc(picUrl) + '&quot;)"></span></a>' +
      '<div>' + tag(kind) + (sample ? '<span class="mr-tag ours">Sample</span>' : '') + '<a class="wg-art-t" href="#/cover">' + esc(title) + '</a><p>' + esc(txt) + '</p>' +
      '<p class="mr-meta">' + esc(meta) + '</p><a class="wg-art-more" href="#/cover">Open the kit &rsaquo;</a></div></li>';
  }
  function chips(list, on) { return '<div class="nm-chips">' + list.map(function (c) { return '<button type="button" class="nm-chip" aria-pressed="' + (on.indexOf(c) >= 0) + '">' + esc(c) + '</button>'; }).join('') + '</div>'; }
  var RESEARCH_T = 'How the Press Covered Vegan Life in 2026';
  var RESEARCH_X = '3,600 articles from 980 outlets, by topic and tone, at outlet level. The method, the codebook and the data come with it. No reporter is named or scored.';

  var VIEWS = {
    overview: function () {
      return head('New this week', RESEARCH_T, '') +
        card('Research', 'Our own data, with the method attached', pic('restaurant-guide/t-pulse.jpg'),
          '<p>' + esc(RESEARCH_X) + '</p>' +
          facts([['Data', 'Download, spreadsheet'], ['Method', 'How we did it, two pages'], ['Window', 'Early January, before Veganuary'], ['Exclusive', 'No, every member'], ['Contact', 'Our press desk, same-day reply']]),
          '<a class="dg-btn" href="#/cover">Open the kit</a><a class="dg-btn dg-ghost" href="#/feed">See your feed</a>') +
        '<div class="wg-arts">' +
        group('How the Media Room works', [
          artRow(pic('holiday/w-say.jpg'), 'Tell Us What You Cover', 'A short survey sets your beats, how far ahead you plan, and how often you hear from us.', '#/settings', 'Your settings'),
          artRow(pic('thumb-community.jpg'), 'Get Stories, Data and People', 'Our own pitches, our research, guests for your show and people to interview. Never someone else\'s story passed along.', '#/feed', 'See a sample feed'),
          artRow(pic('partner-community-manager.jpg'), 'Open the Kit, Privately', 'Read everything first. Nobody is told until you request an interview or book a guest.', '#/cover', 'See a kit')]) +
        group('Our promise', [
          artRow(pic('thumb-passport.jpg'), 'Every Item Labelled', 'Pitch, Research, Community lead, Guest or Our news. Anything about us says so.'),
          artRow(pic('creator-guide.jpg'), 'Ties Shown on Every Item', 'Whether a business or person pays us, and whether a story is exclusive or offered to every member.'),
          artRow(pic('welcome-ensemble.jpg'), 'Only Your Beats, One Click to Leave', 'Nothing outside your beats reaches you, and every email has a one-click way out.'),
          artRow(pic('partner-official-creator.jpg'), 'Who Funds Us', 'Vegans Explore is part of LESARUSS. Our funding and partners, on one page. (Coming)')]) +
        '</div>' + cta('Covering Vegan life?', 'Join the Media Room.', 'Free for verified press: journalists, podcasters and publicists.', ['Join the Media Room', '#/join']);
    },
    feed: function () {
      return crumb('Your Feed') + head('A sample feed', 'New for Your Beats', 'Food and dining, local business. Planning: now. Newest first.') +
        '<div class="wg-arts">' +
        group('This week', [
          feedRow('research', pic('restaurant-guide/t-pulse.jpg'), RESEARCH_T, RESEARCH_X, 'Data and method attached · Not exclusive · No ties to us'),
          feedRow('pitch', SAMPLE + 'photo-1.jpg', 'A Fort Lauderdale Kitchen Turns Its ThanksLiving Menu Into a Food Drive', 'One holiday meal to a neighbor for every menu ordered. Orders close November 22.', 'Thu Nov 20, 10:30 am · Fort Lauderdale · Owner on camera · Shots: the line packing meals · Not exclusive · Not a paying partner', true),
          feedRow('lead', pic('partner-community-manager.jpg'), 'Three Families Going Vegan for the Holidays', 'Members happy to be interviewed about their first Vegan ThanksLiving.', 'Free Nov 18 to 24 · South Florida · Members of Vegans Explore', true),
          feedRow('guest', pic('creator-guide.jpg'), 'A Chef Who Turned a Food Truck Into Three Restaurants', 'For podcasts: a 60-second clip, three episode ideas, and dates over the next eight weeks.', 'Evergreen · Free to record from December · Not a paying partner', true),
          feedRow('ours', pic('welcome-guide.jpg'), 'Vegans Explore Opens Its Next Chapter', 'News about us: a new city hub, with local businesses and members ready to talk.', 'Our news · About us', true)]) +
        '</div>' + cta('Want this in your inbox?', 'Join the Media Room.', 'Pick your beats and how often. Free for verified press.', ['Join the Media Room', '#/join']);
    },
    cover: function () {
      return crumb('A Story Kit') + head('Pitch · Sample', 'A Fort Lauderdale Kitchen Turns Its ThanksLiving Menu Into a Food Drive', 'Opening this kit is private. Nobody is told.') +
        card('The kit', 'Everything you need to tell it', SAMPLE + 'logo.jpg',
          '<p>Green Leaf Kitchen gives one holiday meal to a neighbor for every ThanksLiving menu ordered. Orders close November 22.</p>' +
          facts([['When', 'Thursday, November 20, 10:30 am'], ['Where', 'The kitchen, Fort Lauderdale'], ['On camera', 'The owner, and a family receiving a meal'], ['Shots', 'The line packing meals; the hand-off at the door'], ['Lead time', 'Now. A follow-up is possible in the spring'], ['Exclusive', 'No, offered to every member on this beat'], ['Ties to us', 'Not a paying partner'], ['Facts', 'One page, sources linked']]) +
          '<div class="vgi-k">Pictures, with their rights</div><div class="mr-kit"><i style="background-image:url(\'' + SAMPLE + 'photo-1.jpg\')"></i><i style="background-image:url(\'' + SAMPLE + 'photo-2.jpg\')"></i><i style="background-image:url(\'' + SAMPLE + 'photo-3.jpg\')"></i></div>' +
          '<p class="nm-hint">Photos by the restaurant. Editorial use, print and web, credit: Green Leaf Kitchen. Full size on download. Rights unclear? Ask the press desk.</p>',
          '<a class="dg-btn" href="#/cover">Request an interview</a><a class="dg-btn dg-ghost" href="#/feed">Back to your feed</a>') +
        '<div class="wg-arts">' + group('If you go ahead', [
          artRow(pic('thumb-passport.jpg'), 'Our Press Desk Answers the Same Day', 'A named person with a direct phone sets up the interview, and nothing else.'),
          artRow(pic('creator-guide.jpg'), 'For Podcasts: Book This Guest', 'A guest kit instead: a 60-second clip, three episode ideas, questions they answer well, and open dates.')]) +
        '</div>';
    },
    settings: function () {
      return crumb('Your Settings') + head('Yours to change', 'Your Beats, Your Planning, How Often', '') +
        card('Your settings', 'What reaches you, and when', pic('thumb-passport.jpg'),
          '<span class="nm-f">Your beats</span>' + chips(['Food and dining', 'Local business', 'Health', 'Travel', 'Culture', 'Research and data', 'Industry and funding', 'Retail and grocery', 'Restaurant business', 'Alt-protein'], ['Food and dining', 'Local business']) +
          '<span class="nm-f">How far ahead you plan</span>' + chips(['Now', 'About a month', '3 to 6 months'], ['Now']) +
          '<span class="nm-f">Timely or evergreen</span>' + chips(['Timely', 'Evergreen'], ['Timely', 'Evergreen']) +
          '<span class="nm-f">How often</span>' + chips(['As it is posted', 'Daily digest', 'Weekly digest'], ['Weekly digest']) +
          '<span class="nm-f">Desks</span>' + chips(['Vegans Explore', 'More desks (Coming)'], ['Vegans Explore']) +
          '<p class="nm-hint">Nothing outside your beats reaches you. One click to leave, on every email.</p>',
          '<a class="dg-btn" href="#/settings">Save my settings</a>', 'nm-form');
    },
    join: function () {
      return crumb('Join') + head('Free for verified press', 'Join the Media Room', 'A short survey, then how we know you are press.') +
        '<div class="nm-steps"><span class="dn">1 &middot; Who you are</span><span class="dn">2 &middot; What you cover</span><span class="dn">3 &middot; How often</span><span class="on">4 &middot; How we know you</span></div>' +
        card('Step 4 of 4', 'How we know you are press', pic('partner-group-partner.jpg'),
          '<div class="nm-grid"><div><label class="nm-f">Your name</label><input class="nm-in" value="Jordan Lee" data-dictate="off"></div>' +
          '<div><label class="nm-f">Your outlet or show</label><input class="nm-in" value="Your Paper" data-dictate="off"></div></div>' +
          '<span class="nm-f">You are a</span>' + chips(['Journalist', 'Podcaster', 'Publicist'], ['Journalist']) +
          '<label class="nm-f">Journalists: your work email <small>(at your outlet)</small></label><input class="nm-in" type="email" value="jordan@yourpaper.com">' +
          '<label class="nm-f">Podcasters: a link to your show <small>(Apple, Spotify or RSS; checked on the spot)</small></label><input class="nm-in" placeholder="https://podcasts.apple.com/...">' +
          '<p class="nm-hint">Freelancers and publicists without either are checked by our press desk, usually the same day.</p>',
          '<a class="dg-btn dg-ghost" href="#/settings">Back</a><a class="dg-btn" href="#/join">Join</a>', 'nm-form') +
        '<div class="wg-arts">' + group('Pass it on', [
          artRow(pic('welcome-ensemble.jpg'), 'Recommend a Colleague', 'Every member gets a link to share with a colleague, who joins the same way.')]) + '</div>';
    }
  };
  // ---------- menu and Liz, from welcome-guide.js ----------
  function drawMenu(cur) {
    menuEl.innerHTML = TABS.map(function (t) { return '<a href="' + href(t.k) + '"' + (t.k === cur ? ' aria-current="page"' : '') + '>' + esc(t.label) + '</a>'; }).join('');
    menuSel.innerHTML = TABS.map(function (t, n) { return '<option value="' + t.k + '"' + (t.k === cur ? ' selected' : '') + '>' + (n + 1) + '. ' + esc(t.label) + '</option>'; }).join('');
  }
  document.documentElement.classList.toggle('dg-dd', TABS.length > 5);
  menuSel.addEventListener('change', function () { location.hash = href(menuSel.value); });
  function setFold(folded) {
    railEl.classList.toggle('dg-folded', folded);
    foldBtn.textContent = folded ? 'Show Liz' : 'Hide Liz'; foldBtn.setAttribute('aria-expanded', String(!folded));
  }
  foldBtn.addEventListener('click', function () { setFold(!railEl.classList.contains('dg-folded')); });
  // Liz's own scene for each page comes once Sean locks the mock (the Guide scenes recipe); the mock shows her square.
  function drawLiz() {
    var t = tab(curTab), i = TABS.indexOf(t);
    bubble.textContent = t.say;
    var a = art('liz'); if (a) document.getElementById('dgMaya').style.backgroundImage = "url('" + a + "')";
    tourEl.innerHTML = tourM.innerHTML = '<a class="dg-tnav" href="' + href(TABS[Math.max(0, i - 1)].k) + '"' + (i ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Back</a><span>' + (i + 1) + ' of ' + TABS.length + '</span>' +
      '<a class="dg-tnav next" href="' + href(TABS[Math.min(TABS.length - 1, i + 1)].k) + '"' + (i < TABS.length - 1 ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Next</a>';
  }
  function route() {
    var k = (location.hash.replace(/^#\/?/, '') || 'overview').split(/[?\/]/)[0] || 'overview';
    if (!VIEWS[k]) k = 'overview';
    curTab = k;
    main.innerHTML = VIEWS[k]();
    drawMenu(curTab); drawLiz();
    window.scrollTo(0, 0);
  }
  document.addEventListener('click', function (e) {
    var c = e.target.closest('.nm-chip');
    if (c) { c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true')); }
  });
  window.addEventListener('hashchange', route);
  tourM.addEventListener('click', function (e) { if (e.target.closest('.dg-tnav')) setTimeout(function () { railEl.scrollIntoView({ block: 'start' }); }, 0); });
  // Press-first (Sean, 2026-11-15, after the journalist panel): Liz starts folded on the Media Room; one tap shows her.
  function start() { if (!window.VEGuideArt) return setTimeout(start, 60); route(); setFold(true); }
  start();
})();
