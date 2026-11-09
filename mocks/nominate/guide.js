/* Nominate Someone and Your Interview: mocks in the Explorer Guide's shape (Sean, 2026-11-09: "I want this done in the style of the
 * Explorer guide... That's now the template for guides moving forward"). The page is a copy of passport.html; this file follows
 * guide-scripts/welcome-guide.js (head, crumb, the Getting started card, artRow, the .vxc call to action, the rail's Back / N of M / Next).
 * <body data-mode="nominate"> is the nomination (index.html), data-mode="interview" is Kai's interview (interview.html).
 * Kai hosts both. Her lines are text drafts for Sean; nothing is recorded, so there is no Play. Illustrative, nothing saves.
 */
(function () {
  var PIC = '/public/guides/';
  var MODE = document.body.getAttribute('data-mode') || 'nominate';

  var MIC = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
  var APPLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.4 12.6c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.3.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.8-1.1-2.8-4.2zM14 5.1c.7-.9 1.2-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z"/></svg>';
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
    '.nm-kq.on .nm-kq-bar b{width:100%;transition:width 7s linear;}',
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
    '@media (max-width:900px){.nm-mock{padding:8px 16px;}.nm-form .wg-gs-pic{display:none;}.nm-grid,.nm-modes{grid-template-columns:1fr;}.nm-rv{grid-template-columns:1fr;gap:2px;}.nm-rv dd{margin-bottom:8px;}}'
  ].join('');
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pic(p) { return PIC + p; }
  function art(slug) { return window.VEGuideArt ? VEGuideArt(slug, 'square') : ''; }

  // ---------- content ----------
  // Kai's questions (Sean, 2026-11-09 notes). [key, short name, the question on the page, Kai's spoken line (a draft: the question plus a
  // little help or an example), answer kind]. Kai's lines become her recorded clips once Sean approves them.
  var Q = [
    ['q1', 'Who You Are', 'Tell me who you are and what you do in your community.', 'Let\'s start easy. Tell me who you are, and what you do in your community. Your work, your passions, what people know you for.', 'rec'],
    ['q2', 'Where You Live', 'Where do you live, and how long have you lived there?', 'Where do you live? South Florida, Central Florida, wherever home is. And how long have you lived there?', 'place'],
    ['q3', 'Your Vegan Origin Story', 'What\'s your Vegan origin story? Take me back to the moment it started.', 'What\'s your Vegan origin story? Take me back to the moment it started. Maybe a documentary, a friend, a meal, or an animal you met.', 'rec'],
    ['q4', 'What You\'re Building', 'What are you building or working on right now for the Vegan movement?', 'What are you building or working on right now for the Vegan movement? A business, an event, a page, a project. Big or small.', 'rec'],
    ['q5', 'Your Shout-Out', 'Who in your community has your back? Give them a shout-out.', 'Nobody does it alone. Who in your community has your back? Give them a shout-out.', 'rec'],
    ['q6', 'Your Favorite Spots', 'Your favorite Vegan spots nearby, and why. Up to three.', 'What are your favorite Vegan spots nearby? Pick up to three, and tell me why you love each one.', 'spots'],
    ['q7', 'Your Advice', 'What would you tell someone just starting out?', 'Someone listening is right where you once were. What would you tell someone just starting out?', 'rec'],
    ['q8', 'What\'s Next', 'What\'s next for you, and how can people support it?', 'Last one. What\'s next for you, and how can people support it?', 'rec']
  ];

  var CONF = {
    nominate: {
      root: 'Nominate Someone',
      tabs: [
        { k: 'overview', label: 'Overview', say: 'Hi, I\'m Kai. Somebody in your community deserves their flowers. Tell us who, and why, in your own words.' },
        { k: 'who', label: 'Who', say: 'Who deserves their flowers? Their name and email are all we need to reach them.' },
        { k: 'why', label: 'Why Them', say: 'Now tell us why. Record it if you can. Your voice might be what we play when we tell their story.' },
        { k: 'you', label: 'About You', say: 'Just so we know who to thank. You choose whether we say it was you.' },
        { k: 'send', label: 'Send', say: 'Read it over, then send. We review every nomination, and we let you know when we reach out to them.' }
      ]
    },
    interview: {
      root: 'Your Interview',
      tabs: [
        { k: 'overview', label: 'Overview', say: 'Congratulations, Maria! I\'m Kai. You\'re getting this because your friend Dana P. nominated you. Press Play and hear why, in Dana\'s own words.' },
        { k: 'interview', label: 'The Interview', say: 'Eight questions, one at a time. Talk to me like a friend. Record if you can.' },
        { k: 'nominate', label: 'Nominate Someone', say: 'Who else deserves their flowers? Pass it on. This one is optional, so skip it if no one comes to mind.' },
        { k: 'member', label: 'You\'re a Member', say: 'That was amazing. Thank you for trusting me with your story. You\'re a member now, and a Founding Member at that.' },
        { k: 'account', label: 'Set Up Your Account', say: 'Last thing: choose how you sign in. Then Liz shows you everything your membership opens up.' }
      ]
    }
  }[MODE];
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
  function modes(sel) {
    var m = [['rec', 'Record your voice', 'Up to 2 minutes. Listen back first.', true], ['say', 'Speak, we type', 'Talk and watch it turn into words.'], ['write', 'Write it out', 'Prefer typing? We can read it for you.']];
    return '<div class="nm-modes" role="group" aria-label="How to answer">' + m.map(function (x) {
      return '<button type="button" class="nm-mode" data-mode="' + x[0] + '" aria-pressed="' + (x[0] === sel) + '"><b>' + (x[0] === 'rec' ? MIC : '') + esc(x[1]) + (x[3] ? '<span class="nm-best">Best</span>' : '') + '</b>' + esc(x[2]) + '</button>';
    }).join('') + '</div><div class="nm-ans">' + answer(sel) + '</div>';
  }
  function answer(sel) {
    if (sel === 'rec') return '<div class="nm-rec"><button type="button" class="nm-dot" aria-label="Stop recording"><i></i></button><span class="nm-wave"></span><small><b>0:52</b> recorded &middot; <b>1:08 left</b> of 2:00 &middot; Listen back &middot; Record again</small></div>';
    return '<textarea class="nm-in" rows="5" placeholder="' + (sel === 'say' ? 'Tap the mic and talk; your words appear here.' : 'Write it in your own words.') + '"></textarea>';
  }

  // Kai asks each question on the picture to the left (Sean, 2026-11-09): Play once and the next questions play on their own after Save and
  // next; Pause stops that. In the mock a bar stands in for her clip (nothing is recorded yet).
  function kaiAsk(s) {
    return '<span class="wg-gs-pic nm-kq" data-kq="' + s + '"><img src="/mocks/nominate/img/kai-ask.jpg" alt="Kai, your interviewer" width="640" height="640">' +
      '<button type="button" class="nm-kq-btn" aria-label="Play Kai asking this question"><span class="nm-kq-ic"></span><span class="nm-kq-l">Play Kai</span></button><i class="nm-kq-bar"><b></b></i></span>';
  }
  function placeAns() {
    return '<div class="nm-grid"><div><label class="nm-f">Where you live</label><select class="nm-in nm-sel"><option>South Florida</option><option>Central Florida</option><option>Tampa Bay</option><option>Somewhere else</option></select></div>' +
      '<div><label class="nm-f">How long you have lived there</label><select class="nm-in nm-sel"><option>Less than a year</option><option>1 to 5 years</option><option>5 to 10 years</option><option selected>10 years or more</option></select></div></div>' +
      '<p class="nm-hint">Two quick picks for your city page, then tell Kai about home in your own words.</p>' + modes('rec');
  }
  function spotsAns() {
    return '<ol class="nm-spots">' +
      '<li class="done"><b>1. Sample: Green Leaf Kitchen</b><span class="nm-play"><i></i>Your 0:41 recording</span><a href="#/interview/6">Redo</a></li>' +
      '<li class="done"><b>2. Sample: Sunflower Cafe</b><span class="nm-play"><i></i>Your 0:33 recording</span><a href="#/interview/6">Redo</a></li>' +
      '<li class="now"><b>3. Your third spot</b><input class="nm-in" placeholder="Start typing a place name" data-dictate="off">' + modes('rec') + '<a class="dg-btn" href="#/interview/6">Save this spot</a></li></ol>' +
      '<p class="nm-hint">Up to three, each with its own recording. After your third, they lock in; Redo one to change it.</p>';
  }
  // ---------- the nomination ----------
  var NOM = {
    overview: function () {
      return head('Free for everyone', 'Give Someone Their Flowers', '') +
        card('Getting started', 'How to nominate someone', pic('thumb-community.jpg'), lines([
          '<b>Think of someone.</b> A person, business, nonprofit or activist who makes Vegan life better near you.',
          '<b>Tell us why.</b> Record it if you can; it may play on the podcast. Typing works too.',
          '<b>We take it from there.</b> If we agree, Kai invites them to an interview.']),
          '<a class="dg-btn" href="#/who">Nominate someone</a>') +
        '<div class="wg-arts">' +
        group('Where their story could go', [
          artRow(pic('holiday/p-listen.jpg'), 'The Podcast', 'Our city shows feature a Local voice every week: the nomination, then their story in their own words.'),
          artRow(pic('partner-community-manager.jpg'), 'Your City\'s Page', 'Community Voices on every city hub, where their answer plays in their own voice.'),
          artRow(pic('restaurant-guide/t-pulse.jpg'), 'The Daily Pulse', 'A story in your city\'s morning briefing the week they are featured.')]) +
        group('How it works', [
          artRow(pic('holiday/w-say.jpg'), 'You Nominate', 'Their name, their email so we can reach them, and why, in about two minutes.'),
          artRow(pic('thumb-passport.jpg'), 'We Review', 'Our team reads and listens to every one. Nothing goes to them until we agree.'),
          artRow(pic('creator-guide.jpg'), 'Kai Interviews Them', 'They get an invitation and a short interview with Kai. It is an audition: every nominee is considered.')]) +
        '</div>' + cta('Know someone?', 'Nominate them today.', 'It takes about two minutes, and it could be the best news they get all week.', ['Nominate someone', '#/who']);
    },
    who: function () {
      return crumb('Who') + head('Step 1 of 4', 'Who Are You Nominating?', '') +
        card('Who', 'Tell us who deserves their flowers', pic('thumb-community.jpg'),
          '<div class="nm-grid"><div><label class="nm-f">Their name</label><input class="nm-in" value="Maria Rodriguez" data-dictate="off"></div>' +
          '<div><label class="nm-f">Their email <small>(so we can reach them)</small></label><input class="nm-in" type="email" value="maria@example.com"></div></div>' +
          '<label class="nm-f">Their city</label><input class="nm-in" value="South Florida" data-dictate="off">' +
          '<label class="nm-f">What they do <small>(pick any that fit)</small></label><div class="nm-chips">' + ['Business owner', 'Content creator', 'Works for a nonprofit', 'Activist'].map(function (c, i) { return '<button type="button" class="nm-chip" aria-pressed="' + (i === 0 || i === 3) + '">' + c + '</button>'; }).join('') + '</div>' +
          '<label class="nm-check"><input type="checkbox"> <span><b>This is me.</b> Self-nominations are welcome.</span></label>',
          '<a class="dg-btn" href="#/why">Next: Why them</a>', 'nm-form');
    },
    why: function () {
      return crumb('Why Them') + head('Step 2 of 4', 'Why Do They Deserve Their Flowers?', 'In your own words. If you record it, we may play it on the show when we tell their story.') +
        card('Why them', 'Say it however is easiest', pic('holiday/w-say.jpg'), modes('rec'),
          '<a class="dg-btn dg-ghost" href="#/who">Back</a><a class="dg-btn" href="#/you">Next: About you</a>', 'nm-form');
    },
    you: function () {
      return crumb('About You') + head('Step 3 of 4', 'Who Is Nominating Them?', 'Members skip this step: we already know you.') +
        card('About you', 'So we know who to thank', pic('welcome-ensemble.jpg'),
          '<div class="nm-grid"><div><label class="nm-f">Your name</label><input class="nm-in" value="Dana P." data-dictate="off"></div>' +
          '<div><label class="nm-f">Your email</label><input class="nm-in" type="email" value="dana@example.com"></div></div>' +
          '<label class="nm-check"><input type="checkbox" checked> <span><b>You may say I nominated them.</b> We tell them who put their name forward, and we may say it on the show.</span></label>',
          '<a class="dg-btn dg-ghost" href="#/why">Back</a><a class="dg-btn" href="#/send">Next: Send</a>', 'nm-form');
    },
    send: function () {
      return crumb('Send') + head('Step 4 of 4', 'Read It Over, Then Send', '') +
        card('Your nomination', 'Maria Rodriguez, South Florida', pic('partner-community-manager.jpg'),
          '<dl class="nm-rv"><dt>Who</dt><dd>Maria Rodriguez, a person, maria@example.com</dd><dt>Why</dt><dd><span class="nm-play"><i></i>Your 1:08 recording</span></dd><dt>From</dt><dd>Dana P., you may say so</dd></dl>' +
          '<label class="nm-check"><input type="checkbox" checked> <span><b>You may use my nomination.</b> Vegans Explore may play or read it on our shows, in the Daily Pulse, on social and on city pages.</span></label>',
          '<a class="dg-btn dg-ghost" href="#/you">Back</a><button type="button" class="dg-btn" data-sent>Send my nomination</button>', 'nm-form');
    },
    sent: function () {
      return crumb('Sent') + head('Thank you', 'Your Nomination Is In', '') +
        card('What happens next', 'We review every one', pic('thumb-passport.jpg'), lines([
          '<b>We listen to it.</b> Our team reviews every nomination, usually within a week.',
          '<b>If we agree,</b> Kai invites Maria to a short interview, and we email you that we reached out.',
          '<b>If she is featured,</b> you hear about it first, with a link to share.']),
          '<a class="dg-btn" href="#/who">Nominate someone else</a>') +
        cta('Not a member yet?', 'Become a Founder.', 'Free, about two minutes, with 250 points. Members earn points when their nominee finishes the interview.', ['Become a Founder', '/passport#/founder']);
    }
  };

  // ---------- the interview (Sean, 2026-11-09): Overview (Kai explains it A to Z), The Interview (step by step), Nominate Someone
  // (optional, Skip), You're a Member (confirmation), Set Up Your Account (sign-in), then the members' Welcome Guide. ----------
  function stepOf() { var m = location.hash.match(/^#\/[a-z]+\/(\d+)/); return m ? +m[1] : 1; }
  function steps(names, on) {
    return '<div class="nm-steps">' + names.map(function (n, i) { return '<span class="' + (i + 1 === on ? 'on' : i + 1 < on ? 'dn' : '') + '">' + (i + 1) + ' &middot; ' + esc(n) + '</span>'; }).join('') + '</div>';
  }
  var INT = {
    overview: function () {
      return head('You were nominated', 'Maria, Your Community Put Your Name Forward', '') +
        '<div class="nm-quote">"She feeds the whole block every Thursday and never asks for anything back. Half of us tried Vegan food for the first time at her table."' +
        '<small>Dana P. nominated you <span class="nm-play"><i></i>Hear it in Dana\'s voice</span></small></div>' +
        card('Getting started', 'How this works', pic('creator-guide.jpg'), lines([
          '<b>Watch Kai\'s welcome.</b> Press Play beside this page: why you were picked, in Dana\'s words.',
          '<b>Read the steps below.</b> About fifteen minutes from start to finish.',
          '<b>It is an audition.</b> Every nominee is considered, and we tell you either way.']),
          '<a class="dg-btn" href="#/interview/1">Start my interview</a>') +
        '<div class="wg-arts">' +
        group('Start to finish', [
          artRow(pic('holiday/w-say.jpg'), '1. The Interview', 'Eight questions from Kai, one a page, about ten minutes. Record your answers if you can; speaking or typing works too.', '#/interview/1', 'Start'),
          artRow(pic('partner-group-partner.jpg'), '2. Nominate Someone', 'Optional. Pass it on: name someone else who deserves their flowers, or skip it.'),
          artRow(pic('welcome-ensemble.jpg'), '3. You\'re a Member', 'Finishing the interview makes you a member: free, a Founding Member, with your Explorer badge and 250 points.'),
          artRow(pic('thumb-passport.jpg'), '4. Set Up Your Account', 'Sign in with Google or with your email and a password, and choose what you hear from us.'),
          artRow(pic('welcome-guide.jpg'), '5. Your Welcome Guide', 'Liz walks you through everything your membership opens up: your city, the Directory, events, Guides and points.')]) +
        group('Where your story could live', [
          artRow(pic('holiday/p-listen.jpg'), 'The Podcast', 'Your city\'s show, in your own voice: the nomination, then your story.'),
          artRow(pic('partner-community-manager.jpg'), 'Your City\'s Page', 'Community Voices on the South Florida hub, where neighbors press Play on your answer.'),
          artRow(pic('restaurant-guide/t-pulse.jpg'), 'The Daily Pulse', 'A story in your city\'s morning briefing the week you are featured.'),
          artRow(pic('partner-official-creator.jpg'), 'Our Social', 'A card from your interview, with Dana tagged for putting you forward.')]) +
        '</div>' + cta('Ready when you are', 'Let\'s tell your story.', 'Eight questions, about ten minutes. Kai is with you the whole way.', ['Start my interview', '#/interview/1']);
    },
    interview: function () {
      var s = Math.min(9, Math.max(1, stepOf()));
      if (s === 9) {
        return crumb('The Interview') + head('All eight answered', 'Send Your Interview', '') +
          '<div class="nm-prog" aria-hidden="true"><i style="width:100%"></i></div>' +
          card('Your answers', 'Read them over, then send', pic('holiday/w-say.jpg'),
            '<dl class="nm-rv">' + Q.map(function (q, i) { return '<dt>' + (i + 1) + '. ' + esc(q[1]) + '</dt><dd>' + (i === 1 ? 'South Florida, 10 years or more, and <span class="nm-play"><i></i>your recording</span>' : i === 5 ? 'Green Leaf Kitchen, Sunflower Cafe (two recordings)' : '<span class="nm-play"><i></i>Your recording</span>') + ' <a href="#/interview/' + (i + 1) + '" style="color:var(--g);font-weight:800;font-size:12px">Edit</a></dd>'; }).join('') + '</dl>' +
            '<label class="nm-check"><input type="checkbox" checked> <span><b>You may use my interview.</b> Vegans Explore may play or quote my answers on the podcast, in the Daily Pulse, on social and on my city\'s page.</span></label>',
            '<a class="dg-btn dg-ghost" href="#/interview/8">Back</a><a class="dg-btn" href="#/nominate/1">Send my interview</a>', 'nm-form');
      }
      var q = Q[s - 1];
      var body = q[4] === 'place' ? placeAns() : q[4] === 'spots' ? spotsAns() : modes('rec');
      return crumb('The Interview') + head('Question ' + s + ' of 8', q[2], '') +
        '<div class="nm-prog" aria-hidden="true"><i style="width:' + Math.round(s / 8 * 100) + '%"></i></div>' +
        '<section class="wg-gs nm-form nm-q">' + kaiAsk(s) + '<div class="wg-gs-b"><div class="vgi-k">Your answer</div><h3 class="wg-gs-t">' + esc(q[1]) + '</h3>' + body +
          '<div class="wg-gs-btns"><a class="dg-btn dg-ghost" href="' + (s === 1 ? '#/' : '#/interview/' + (s - 1)) + '">Back</a><a class="dg-btn" href="#/interview/' + (s + 1) + '">' + (s === 8 ? 'Save and review' : 'Save and next') + '</a><a class="dg-btn dg-ghost" href="#/">Save and exit</a></div></div></section>';
    },
    nominate: function () {
      var s = stepOf() === 2 ? 2 : 1, skip = '<a class="dg-btn dg-ghost" href="#/member">Skip this</a>';
      if (s === 1) return crumb('Nominate Someone') + head('Optional', 'Who Else Deserves Their Flowers?', 'Your interview is in. Now pass it on, or skip this step.') + steps(['Who', 'Why them'], 1) +
        card('Who', 'Someone in your community', pic('partner-group-partner.jpg'),
          '<div class="nm-grid"><div><label class="nm-f">Their name</label><input class="nm-in" placeholder="Their name" data-dictate="off"></div>' +
          '<div><label class="nm-f">Their email <small>(so we can reach them)</small></label><input class="nm-in" type="email" placeholder="name@example.com"></div></div>' +
          '<label class="nm-f">What they do <small>(pick any that fit)</small></label><div class="nm-chips">' + ['Business owner', 'Content creator', 'Works for a nonprofit', 'Activist'].map(function (c, i) { return '<button type="button" class="nm-chip" aria-pressed="' + (i === 0 || i === 3) + '">' + c + '</button>'; }).join('') + '</div>',
          '<a class="dg-btn" href="#/nominate/2">Next: Why them</a>' + skip, 'nm-form');
      return crumb('Nominate Someone') + head('Optional', 'Why Do They Deserve Their Flowers?', 'In your own words. If you record it, we may play it when we tell their story.') + steps(['Who', 'Why them'], 2) +
        card('Why them', 'Say it however is easiest', pic('holiday/w-say.jpg'), modes('rec'),
          '<a class="dg-btn dg-ghost" href="#/nominate/1">Back</a><a class="dg-btn" href="#/member?sent=1">Send my nomination</a>' + skip, 'nm-form');
    },
    member: function () {
      var sent = /sent=1/.test(location.hash);
      return crumb('You\'re a Member') + head('Welcome, Founding Member', 'You\'re a Member, Maria', '') +
        card('What you have now', 'Your story is with our team', pic('welcome-ensemble.jpg'), lines([
          '<b>You are a Founding Member.</b> Free, with your Explorer and Nominee badges and 250 points to start. Featured members also get a drawn Vegans Explore portrait.' + (sent ? ' Thank you for passing it on, too.' : ''),
          '<b>We listen to every interview.</b> If yours is picked, you hear from us first, with the date.',
          '<b>One last step.</b> Choose how you sign in, so you can come back any time.']),
          '<a class="dg-btn" href="#/account">Set up my account</a>') +
        '<div class="wg-arts">' + group('What your membership opens up', [
          artRow(pic('partner-community-manager.jpg'), 'Your City', 'The South Florida Daily Pulse each morning, its boards and its events.'),
          artRow(pic('thumb-bounties.jpg'), 'Points', 'Earn them by taking part, spend them on Guides, give them to the places and causes you love.'),
          artRow(pic('welcome-guide.jpg'), 'Your Guides', 'Ask your Guide anything, and open topic Guides with your points.')]) + '</div>';
    },
    featured: function () {
      return crumb('You\'ve Been Featured') + head('Your story is live', 'Maria, You\'ve Been Featured', '') +
        card('Where you are', 'Your story is on Vegans Explore', pic('partner-community-manager.jpg'), lines([
          '<b>Meet the Vegans Explore you.</b> We drew you in our style, in our tee: your badge of honor, for your profile and your socials.',
          '<b>Share it.</b> Your graphics are below, ready for Instagram, Facebook and stories.',
          '<b>Tag us</b> @vegansexplore and Dana, so she sees it too.',
          '<b>Your link</b> is made for you, so we know your post brought people in.']),
          '<a class="dg-btn" href="#/featured">Download my graphics</a><a class="dg-btn dg-ghost" href="#/featured">Copy my link</a>') +
        '<div class="wg-arts">' + group('Where you are featured', [
          artRow(pic('partner-community-manager.jpg'), 'South Florida: Community Voices', 'Your card on the city hub, playing your answer in your own voice.', '#/featured', 'See it'),
          artRow(pic('holiday/p-listen.jpg'), 'SoFlo Vegans, Episode 118', 'The Local voice segment: Dana\'s nomination, then your Vegan story.', '#/featured', 'Listen'),
          artRow(pic('restaurant-guide/t-pulse.jpg'), 'The South Florida Daily Pulse', 'Wednesday\'s briefing tells your story to everyone in your city.', '#/featured', 'Read it')]) + '</div>' +
        '<div class="wg-grp"><h5>The Vegans Explore you</h5></div><div class="nm-gfx"><div class="nm-me"><span class="nm-stamp">Sample</span><img src="/mocks/nominate/img/maria-drawn.jpg" alt="Sample: Maria, drawn in the Vegans Explore style"></div>' +
          '<div class="nm-me-b"><b>Your badge of honor</b><p>Only people we feature get one. It is yours to keep: use it as your profile picture here and on your socials.</p><div class="wg-gs-btns"><a class="dg-btn" href="#/featured">Use as my profile picture</a><a class="dg-btn dg-ghost" href="#/featured">Download</a></div><p style="font-size:12.5px;color:var(--ink55);margin-top:8px">Not quite you? Tell us and we redraw it.</p></div></div>' +
        '<div class="wg-grp"><h5>Your graphics</h5></div><div class="nm-gfx">' +
          '<div class="nm-g sq"><span class="nm-stamp">Sample</span><span class="nm-g-pic" style="background-image:url(\'' + '/mocks/nominate/img/maria-drawn.jpg' + '\')"></span><div class="nm-g-t"><small>Community Voices &middot; South Florida</small><b>I\'ve been featured on Vegans Explore</b><span>Maria Rodriguez, Thursday Table</span></div><img class="nm-g-logo" src="/public/logo-ve-landscape-v1-inverted.svg" alt=""></div>' +
          '<div class="nm-g st"><span class="nm-stamp">Sample</span><span class="nm-g-pic" style="background-image:url(\'' + '/mocks/nominate/img/maria-drawn.jpg' + '\')"></span><div class="nm-g-t"><small>Nominated by my community</small><b>I\'ve been featured on Vegans Explore</b><span>Hear my story on SoFlo Vegans</span></div><img class="nm-g-logo" src="/public/logo-ve-landscape-v1-inverted.svg" alt=""></div>' +
        '</div>' + cta('Pay it forward', 'Who else deserves their flowers?', 'Nominate someone in your community, and their story could be next.', ['Nominate someone', '/mocks/nominate/']);
    },
    account: function () {
      return crumb('Set Up Your Account') + head('Last step', 'How Do You Want to Sign In?', '') +
        card('Your account', 'Maria Rodriguez, South Florida', pic('thumb-passport.jpg'),
          '<button type="button" class="nm-apple">' + APPLE + 'Continue with Apple</button>' +
          '<button type="button" class="nm-google"><span>G</span>Continue with Google</button>' +
          '<div class="nm-or">or use your email</div>' +
          '<div class="nm-grid"><div><label class="nm-f">Email</label><input class="nm-in" type="email" value="maria@example.com"></div>' +
          '<div><label class="nm-f">Choose a password</label><input class="nm-in" type="password" value="samplepass"></div></div>' +
          '<label class="nm-f">A recent photo of you <small>(for future features)</small></label><div class="nm-in" style="color:var(--ink55)">Add a photo: a clear, recent shot of your face works best</div>' +
          '<label class="nm-check"><input type="checkbox" checked> <span><b>You may use my photo.</b> Vegans Explore may use it in features, and if I am featured, draw me in its illustrated style, wearing a Vegans Explore tee. I can ask for either to come down at any time.</span></label>' +
          '<span class="nm-f">What you hear from us</span>' +
          '<label class="nm-check"><input type="checkbox" checked> <span><b>The South Florida Daily Pulse</b>, a short briefing each morning.</span></label>' +
          '<label class="nm-check"><input type="checkbox" checked> <span><b>News about my interview</b>, including if it is picked.</span></label>',
          '<a class="dg-btn" href="/passport?guide=welcome&amp;from=nominee">Open my Welcome Guide</a>', 'nm-form') +
        cta('Next: your Welcome Guide', 'Liz shows you around.', 'The members\' version: everything your membership opens up, and how to use it today.', ['Open my Welcome Guide', '/passport?guide=welcome&from=nominee']);
    }
  };

  var VIEWS = MODE === 'interview' ? INT : NOM;

  // ---------- menu and Kai, from welcome-guide.js ----------
  function drawMenu(cur) {
    menuEl.innerHTML = TABS.map(function (t) { return '<a href="' + href(t.k) + '"' + (t.k === cur ? ' aria-current="page"' : '') + '>' + esc(t.label) + '</a>'; }).join('');
    menuSel.innerHTML = TABS.map(function (t, n) { return '<option value="' + t.k + '"' + (t.k === cur ? ' selected' : '') + '>' + (n + 1) + '. ' + esc(t.label) + '</option>'; }).join('');
  }
  document.documentElement.classList.toggle('dg-dd', TABS.length > 5);
  menuSel.addEventListener('change', function () { location.hash = href(menuSel.value); });
  function setFold(folded) {
    railEl.classList.toggle('dg-folded', folded);
    foldBtn.textContent = folded ? 'Show Kai' : 'Hide Kai'; foldBtn.setAttribute('aria-expanded', String(!folded));
  }
  foldBtn.addEventListener('click', function () { setFold(!railEl.classList.contains('dg-folded')); });
  // Kai in a different outfit on every page, always in a Vegans Explore tee (Sean, 2026-11-09). Drawn with the locked scene recipe.
  var KAI = { interview: { overview: 'welcome', interview: 'listen', nominate: 'flowers', member: 'cheer', account: 'phone', featured: 'cheer' },
              nominate: { overview: 'flowers', who: 'welcome', why: 'listen', you: 'phone', send: 'cheer' } };
  function drawKai(sayOverride) {
    var t = tab(curTab), i = TABS.indexOf(t);
    bubble.textContent = sayOverride || t.say;
    var box = document.getElementById('dgMaya'), a = KAI[MODE][curTab] ? '/mocks/nominate/img/kai-' + KAI[MODE][curTab] + '.jpg' : art('kai');
    box.classList.toggle('nm-vid', MODE === 'interview' && curTab === 'overview');
    if (a) box.style.backgroundImage = "url('" + a + "')";
    tourEl.innerHTML = tourM.innerHTML = '<a class="dg-tnav" href="' + href(TABS[Math.max(0, i - 1)].k) + '"' + (i ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Back</a><span>' + (i + 1) + ' of ' + TABS.length + '</span>' +
      '<a class="dg-tnav next" href="' + href(TABS[Math.min(TABS.length - 1, i + 1)].k) + '"' + (i < TABS.length - 1 ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Next</a>';
  }
  function route() {
    var k = (location.hash.replace(/^#\/?/, '') || 'overview').split(/[?\/]/)[0] || 'overview';
    var sent = MODE === 'nominate' && k === 'sent', feat = MODE === 'interview' && k === 'featured';
    if (!VIEWS[k]) k = 'overview';
    curTab = sent ? 'send' : k;
    if (feat) curTab = 'member';
    main.innerHTML = VIEWS[k]();
    var say = sent ? 'Thank you! You just made someone\'s week, even if they don\'t know it yet.' : '';
    if (feat) say = 'Maria, you\'re featured! I told you people don\'t get nominated by accident. Go share it, and tag Dana.';
    if (MODE === 'interview' && k === 'interview') { var n = stepOf(); say = n >= 9 ? 'That\'s all eight. Read them over, then send it to our team.' : Q[n - 1][3]; }
    drawMenu(curTab); drawKai(say);
    window.scrollTo(0, 0);
  }
  document.addEventListener('click', function (e) {
    var m = e.target.closest('.nm-mode');
    if (m) {
      var wrap = m.parentNode; wrap.querySelectorAll('.nm-mode').forEach(function (b) { b.setAttribute('aria-pressed', String(b === m)); });
      wrap.nextElementSibling.innerHTML = answer(m.getAttribute('data-mode')); return;
    }
    var c = e.target.closest('.nm-chip');
    if (c) { c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true')); return; } // pick any that fit
    if (e.target.closest('[data-sent]')) location.hash = '#/sent';
  });
  window.addEventListener('hashchange', route);
  // Play gives consent for the next questions to play on their own; Pause takes it back (Sean, 2026-11-09).
  function kaiPlay(el, on) {
    if (!el) return;
    el.classList.toggle('on', on);
    el.querySelector('.nm-kq-l').textContent = on ? 'Pause' : 'Play Kai';
    try { sessionStorage.setItem('nm_kai_auto', on ? '1' : '0'); } catch (e) {}
    clearTimeout(kaiPlay.t);
    if (on) kaiPlay.t = setTimeout(function () { el.classList.remove('on'); el.querySelector('.nm-kq-l').textContent = 'Play again'; }, 7100);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.nm-kq-btn'); if (!b) return;
    var el = b.closest('.nm-kq'); kaiPlay(el, !el.classList.contains('on'));
  });
  window.addEventListener('hashchange', function () {
    setTimeout(function () { var el = document.querySelector('.nm-kq'); var auto = ''; try { auto = sessionStorage.getItem('nm_kai_auto'); } catch (e) {}
      if (el && auto === '1') { el.offsetWidth; kaiPlay(el, true); } }, 60);
  });

  tourM.addEventListener('click', function (e) { if (e.target.closest('.dg-tnav')) setTimeout(function () { railEl.scrollIntoView({ block: 'start' }); }, 0); });
  function start() { if (!window.VEGuideArt) return setTimeout(start, 60); route(); }
  start();
})();
