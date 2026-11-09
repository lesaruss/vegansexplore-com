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
    '.nm-rec small{font-size:12.5px;font-weight:700;color:var(--ink75);}',
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
    '.nm-or{text-align:center;font-size:12px;font-weight:700;color:var(--ink55);margin:12px 0 2px;}',
    '@media (max-width:900px){.nm-mock{padding:8px 16px;}.nm-form .wg-gs-pic{display:none;}.nm-grid,.nm-modes{grid-template-columns:1fr;}.nm-rv{grid-template-columns:1fr;gap:2px;}.nm-rv dd{margin-bottom:8px;}}'
  ].join('');
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pic(p) { return PIC + p; }
  function art(slug) { return window.VEGuideArt ? VEGuideArt(slug, 'square') : ''; }

  // ---------- content ----------
  var Q = [
    ['q1', 'Who You Are', 'Tell me who you are and what you do in your community.', 'Let\'s start easy. Who are you, and what do you do where you live? Talk to me like a friend.', 'thumb-community.jpg'],
    ['q2', 'Where You Are', 'Where are you, and how long have you been part of it?', 'Where do you call home, and how long have you been part of the Vegan community there?', 'vegan-abroad.jpg'],
    ['q3', 'Your Vegan Story', 'What\'s your Vegan story? Take me back to the moment it started.', 'This is the one I love most. Take me back to the moment it started for you.', 'prevegan.jpg'],
    ['q4', 'What You\'re Building', 'What are you building or working on right now?', 'What are you working on right now? Big or small, I want to hear it.', 'entrepreneur.jpg'],
    ['q5', 'Your Shout-Out', 'Who in your community has your back? Give them a shout-out.', 'Nobody does it alone. Who has your back? Give them their flowers too.', 'partner-group-partner.jpg'],
    ['q6', 'Your Favorite Spot', 'Your favorite Vegan spot nearby, and why.', 'Where do you love to eat? Start typing and pick it from the Directory.', 'eating-out.jpg'],
    ['q7', 'Your Advice', 'What would you tell someone just starting out?', 'Someone is listening who is right where you once were. What would you tell them?', 'kids-and-family.jpg'],
    ['q8', 'What\'s Next', 'What\'s next for you, and how can people support it?', 'Last one. What\'s next for you, and how can people show up for it?', 'partner-official-creator.jpg']
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
        { k: 'overview', label: 'Overview', say: 'Hey Maria! I\'m Kai. People don\'t get nominated by accident. Here is everything that happens from here, start to finish.' },
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
    if (sel === 'rec') return '<div class="nm-rec"><button type="button" class="nm-dot" aria-label="Stop recording"><i></i></button><span class="nm-wave"></span><small>Recording 1:08 of 2:00 &middot; Listen back &middot; Record again</small></div>';
    return '<textarea class="nm-in" rows="5" placeholder="' + (sel === 'say' ? 'Tap the mic and talk; your words appear here.' : 'Write it in your own words.') + '"></textarea>';
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
          '<label class="nm-f">They are</label><div class="nm-chips">' + ['A person', 'A business', 'A nonprofit', 'An activist', 'Me'].map(function (c, i) { return '<button type="button" class="nm-chip" aria-pressed="' + (i === 0) + '">' + c + '</button>'; }).join('') + '</div>',
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
          '<b>Why you.</b> Your neighbors say you make Vegan life better where you live.',
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
            '<dl class="nm-rv">' + Q.map(function (q, i) { return '<dt>' + (i + 1) + '. ' + esc(q[1]) + '</dt><dd>' + (i === 1 ? 'South Florida, eleven years' : '<span class="nm-play"><i></i>Your recording</span>') + ' <a href="#/interview/' + (i + 1) + '" style="color:var(--g);font-weight:800;font-size:12px">Edit</a></dd>'; }).join('') + '</dl>' +
            '<label class="nm-check"><input type="checkbox" checked> <span><b>You may use my interview.</b> Vegans Explore may play or quote my answers on the podcast, in the Daily Pulse, on social and on my city\'s page.</span></label>',
            '<a class="dg-btn dg-ghost" href="#/interview/8">Back</a><a class="dg-btn" href="#/nominate/1">Send my interview</a>', 'nm-form');
      }
      var q = Q[s - 1];
      return crumb('The Interview') + head('Question ' + s + ' of 8', q[2], '') +
        '<div class="nm-prog" aria-hidden="true"><i style="width:' + Math.round(s / 8 * 100) + '%"></i></div>' +
        card('Your answer', 'Answer however is easiest', pic(q[4]),
          (s === 6 ? '<label class="nm-f">Find the place</label><input class="nm-in" value="Sample: Green Leaf Kitchen" data-dictate="off"><label class="nm-f">And why</label>' : '') + modes(s === 2 ? 'write' : 'rec'),
          '<a class="dg-btn dg-ghost" href="' + (s === 1 ? '#/' : '#/interview/' + (s - 1)) + '">Back</a><a class="dg-btn" href="#/interview/' + (s + 1) + '">' + (s === 8 ? 'Save and review' : 'Save and next') + '</a><a class="dg-btn dg-ghost" href="#/">Save and exit</a>', 'nm-form');
    },
    nominate: function () {
      var s = stepOf() === 2 ? 2 : 1, skip = '<a class="dg-btn dg-ghost" href="#/member">Skip this</a>';
      if (s === 1) return crumb('Nominate Someone') + head('Optional', 'Who Else Deserves Their Flowers?', 'Your interview is in. Now pass it on, or skip this step.') + steps(['Who', 'Why them'], 1) +
        card('Who', 'Someone in your community', pic('partner-group-partner.jpg'),
          '<div class="nm-grid"><div><label class="nm-f">Their name</label><input class="nm-in" placeholder="Their name" data-dictate="off"></div>' +
          '<div><label class="nm-f">Their email <small>(so we can reach them)</small></label><input class="nm-in" type="email" placeholder="name@example.com"></div></div>' +
          '<label class="nm-f">They are</label><div class="nm-chips">' + ['A person', 'A business', 'A nonprofit', 'An activist'].map(function (c, i) { return '<button type="button" class="nm-chip" aria-pressed="' + (i === 0) + '">' + c + '</button>'; }).join('') + '</div>',
          '<a class="dg-btn" href="#/nominate/2">Next: Why them</a>' + skip, 'nm-form');
      return crumb('Nominate Someone') + head('Optional', 'Why Do They Deserve Their Flowers?', 'In your own words. If you record it, we may play it when we tell their story.') + steps(['Who', 'Why them'], 2) +
        card('Why them', 'Say it however is easiest', pic('holiday/w-say.jpg'), modes('rec'),
          '<a class="dg-btn dg-ghost" href="#/nominate/1">Back</a><a class="dg-btn" href="#/member?sent=1">Send my nomination</a>' + skip, 'nm-form');
    },
    member: function () {
      var sent = /sent=1/.test(location.hash);
      return crumb('You\'re a Member') + head('Welcome, Founding Member', 'You\'re a Member, Maria', '') +
        card('What you have now', 'Your story is with our team', pic('welcome-ensemble.jpg'), lines([
          '<b>You are a Founding Member.</b> Free, with your Explorer and Nominee badges and 250 points to start.' + (sent ? ' Thank you for passing it on, too.' : ''),
          '<b>We listen to every interview.</b> If yours is picked, you hear from us first, with the date.',
          '<b>One last step.</b> Choose how you sign in, so you can come back any time.']),
          '<a class="dg-btn" href="#/account">Set up my account</a>') +
        '<div class="wg-arts">' + group('What your membership opens up', [
          artRow(pic('partner-community-manager.jpg'), 'Your City', 'The South Florida Daily Pulse each morning, its boards and its events.'),
          artRow(pic('thumb-bounties.jpg'), 'Points', 'Earn them by taking part, spend them on Guides, give them to the places and causes you love.'),
          artRow(pic('welcome-guide.jpg'), 'Your Guides', 'Ask your Guide anything, and open topic Guides with your points.')]) + '</div>';
    },
    account: function () {
      return crumb('Set Up Your Account') + head('Last step', 'How Do You Want to Sign In?', '') +
        card('Your account', 'Maria Rodriguez, South Florida', pic('thumb-passport.jpg'),
          '<button type="button" class="nm-google"><span>G</span>Continue with Google</button>' +
          '<div class="nm-or">or use your email</div>' +
          '<div class="nm-grid"><div><label class="nm-f">Email</label><input class="nm-in" type="email" value="maria@example.com"></div>' +
          '<div><label class="nm-f">Choose a password</label><input class="nm-in" type="password" value="samplepass"></div></div>' +
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
  function drawKai(sayOverride) {
    var t = tab(curTab), i = TABS.indexOf(t);
    bubble.textContent = sayOverride || t.say;
    var box = document.getElementById('dgMaya'), a = art('kai');
    if (a) box.style.backgroundImage = "url('" + a + "')";
    tourEl.innerHTML = tourM.innerHTML = '<a class="dg-tnav" href="' + href(TABS[Math.max(0, i - 1)].k) + '"' + (i ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Back</a><span>' + (i + 1) + ' of ' + TABS.length + '</span>' +
      '<a class="dg-tnav next" href="' + href(TABS[Math.min(TABS.length - 1, i + 1)].k) + '"' + (i < TABS.length - 1 ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Next</a>';
  }
  function route() {
    var k = (location.hash.replace(/^#\/?/, '') || 'overview').split(/[?\/]/)[0] || 'overview';
    var sent = MODE === 'nominate' && k === 'sent';
    if (!VIEWS[k]) k = 'overview';
    curTab = sent ? 'send' : k;
    main.innerHTML = VIEWS[k]();
    var say = sent ? 'Thank you! You just made someone\'s week, even if they don\'t know it yet.' : '';
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
    if (c) { c.parentNode.querySelectorAll('.nm-chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b === c)); }); return; }
    if (e.target.closest('[data-sent]')) location.hash = '#/sent';
  });
  window.addEventListener('hashchange', route);
  tourM.addEventListener('click', function (e) { if (e.target.closest('.dg-tnav')) setTimeout(function () { railEl.scrollIntoView({ block: 'start' }); }, 0); });
  function start() { if (!window.VEGuideArt) return setTimeout(start, 60); route(); }
  start();
})();
