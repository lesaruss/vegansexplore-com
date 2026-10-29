/* The Stadium & Arena Guide (LOCKED by Sean 2026-10-28, playbook ve-venue-guides; built the same day on his "go").
 *
 * The Dairy Guide's layout (docs/guides/BUILD-A-GUIDE.md): the tabs are the tour, River stays on the right of every tab
 * and talks about it, the content sits on the left. The address bar carries the view (#/venues/arenas,
 * #/venue/hard-rock-stadium, #/venue/hard-rock-stadium/report/confirm/<item>).
 *
 *   Overview            what the Guide is and what each tab holds
 *   Venues              every stadium and arena in our cities (Stadiums / Arenas), then one venue: its stands, where
 *                       they are, what is Vegan, and when a member last checked it. Hard Rock Stadium is the free example.
 *   Help keep it right  how members keep it accurate from inside the venue, the points, and their own reports
 *   My list             Guide owners: the venues and items they saved
 *   Get access          visitors: $11 or 1,100 points, like every Guide
 *
 * Data: the edge function ve-venues (list, venue, report_start, report, mine, saves, save). Who sees what is decided
 * there: the stands and items of a venue go to the Guide's owners, super admins, and anyone on the free example. Buying
 * goes through ve-guide-unlock (status, unlock, checkout) with slug stadium-arena-guide; until that row is published the
 * offer reads Coming soon.
 *
 * Reports: a Passport holder who owns the Guide (bounties unlock with it), inside the venue (the browser's location, checked on the server against the
 * venue's circle), with a photo (shrunk to 1600 px JPEG here, which drops its location data). The team accepts them in
 * Depot > Venues. The points are ve_venue_report_points: Still here pays a bounty to the first member to confirm an item no member
 * has checked in 35 days (Sean, 2026-10-29: "you want to be first to action"), then its usual amount; the limits are
 * ve_site_settings venue_bounties (migration 20261029_venue_bounties.sql).
 *
 * River's words: `say` for visitors, `sayMember` for owners. They are drafts until Sean approves them; nothing is recorded
 * before that (CLIPS stays empty, and the bubble carries the words). No counts in anything River says.
 */
(function () {
  var SLUG = 'stadium-arena-guide', FREE = 'hard-rock-stadium';
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var API = SB + '/functions/v1/ve-venues';
  var UNLOCK_URL = SB + '/functions/v1/ve-guide-unlock';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';

  // The tabs, in tour order, and what River says on each (drafts for Sean's approval, 2026-10-28).
  var TABS = [
    { k: 'overview', label: 'Overview', say: 'Hey, I\'m River. Type your section and I\'ll show you the closest Vegan food in the building. Try it right here at Hard Rock Stadium.',
      sayMember: 'It\'s all yours. Save the stands for game day, and if something changed, tell us and earn points.' },
    { k: 'venues', label: 'Venues', say: 'Pick a venue to see every stand with Vegan food, where it is, and when a member last checked it. Hard Rock Stadium is free.',
      sayMember: 'Open a venue before you go. Every item shows where it is and when a member last checked it.' },
    { k: 'report', label: 'Help keep it right', say: 'Members keep this Guide right from their seats. Snap a photo inside the venue, tell us what changed, and earn points.',
      sayMember: 'At the game? Confirm what\'s still there, or tell us what changed, with a photo. Accepted reports earn points.' },
    { k: 'mylist', label: 'My list', mine: 1, say: 'Everything you save lands here: the venues you go to and the items you want to find.' },
    { k: 'join', label: 'Get access', guest: 1, say: 'The Stadium and Arena Guide is eleven dollars, or 1,100 points, and it\'s yours to keep. Come join us!' }
  ];
  // River on camera, once his lines are approved and recorded (el-media voice, Wan 2.7, assemble_r5.py).
  var CLIPS = {}, CLIPS_M = {};

  var KIND = { stadium: 'Stadium', arena: 'Arena', airport: 'Airport' };
  var VEGAN = { vegan: ['Vegan', 'vegan'], on_request: ['Vegan on request', 'ask'], ask: ['Ask before you order', 'ask'] };
  // What a member can send about an item (Sean, 2026-10-29: "maybe it's update... maybe it's comment... leave a photo, leave a
  // comment. And each thing could have its own amount of points"). Update is two kinds underneath: it changed, or it is gone.
  var REPORT = {
    confirm: ['Still here', 'It is still sold, as written here.', 'Still here'],
    wrong: ['Update', 'The name, the price, where it is, or whether it is Vegan.', 'Something changed'],
    gone: ['Update', 'This stand or item is not there anymore.', 'Not there anymore'],
    comment: ['Comment', 'Tell other fans what you thought of it. A photo makes it even better.', 'Comment'],
    missing: ['Add something missing', 'A Vegan item or a stand that is not in the Guide yet.', 'Something missing']
  };
  var STATUS = { pending: ['Waiting for the team', 'wait'], accepted: ['Accepted', 'live'], agreed: ['Accepted', 'live'], declined: ['Not accepted', 'off'] };

  var S = 'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"';
  var ICON = {
    stadium: '<svg width="26" height="26" viewBox="0 0 24 24" ' + S + '><ellipse cx="12" cy="12" rx="9" ry="5"/><path d="M3 12v4c0 2.8 4 5 9 5s9-2.2 9-5v-4"/><ellipse cx="12" cy="12" rx="4" ry="2"/></svg>',
    arena: '<svg width="26" height="26" viewBox="0 0 24 24" ' + S + '><path d="M3 10l9-6 9 6v9H3z"/><path d="M8 19v-5h8v5"/></svg>',
    pin: '<svg width="13" height="13" viewBox="0 0 24 24" ' + S + '><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    camera: '<svg width="26" height="26" viewBox="0 0 24 24" ' + S + '><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    list: '<svg width="26" height="26" viewBox="0 0 24 24" ' + S + '><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
    food: '<svg width="22" height="22" viewBox="0 0 24 24" ' + S + '><path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19c3-4 6-7 10-9"/></svg>'
  };
  var LOCK_SVG = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';
  var BOOKMARK = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 3h12a1 1 0 011 1v17l-7-4.5L5 21V4a1 1 0 011-1z"/></svg>';

  var main = document.getElementById('dgMain');
  var menuEl = document.getElementById('dgMenu'), menuSel = document.getElementById('dgMenuSelect');

  var ME = { signed_in: false, active: false, owns: false, admin: false };
  var ST = { published: true, cost: 1100, balance: 0, active: false };
  var VENUES = null, VENUE = {}, curTab = 'overview', checked = false, POINTS = {}, LIMITS = {};

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function auth() { return window.VEAuth || null; }
  function token() { var a = auth(); return a && a.isLoggedIn() && !(a.getViewAs && a.getViewAs()) ? a.getToken() : null; }
  function owner() { return !!ME.owns; }
  function tabs() { return TABS.filter(function (t) { return !(t.guest && owner()) && !(t.mine && !owner()); }); }
  function tab(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i].k === k) return TABS[i]; return TABS[0]; }
  function href(k) { return '#/' + (k === 'overview' ? '' : k); }
  function pts(n) { return Number(n || 0).toLocaleString('en-US'); }
  function api(body) {
    var t = token(), h = { 'Content-Type': 'application/json' };
    if (t) h.Authorization = 'Bearer ' + t;
    return fetch(API, { method: 'POST', headers: h, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  function unlockApi(action) {
    return fetch(UNLOCK_URL + '?action=' + action, { method: 'POST', headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, token: token() || undefined, return_url: action === 'checkout' ? location.origin + location.pathname : undefined }) })
      .then(function (r) { return r.json(); });
  }
  function fmtDate(iso) { try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch (e) { return ''; } }
  function monthOf(d) { if (!d) return ''; var p = String(d).split('-'); if (p.length < 2) return p[0]; return new Date(+p[0], +p[1] - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); }
  function tagHtml(text, cls) { return '<span class="dg-tag ' + cls + '">' + esc(text) + '</span>'; }

  // ---------- tabs ----------
  function drawMenu(cur) {
    menuEl.innerHTML = tabs().map(function (t) {
      return '<a href="' + href(t.k) + '"' + (t.k === cur ? ' aria-current="page"' : '') + (t.guest ? ' class="dg-join-tab"' : '') + '>' + esc(t.label) + '</a>';
    }).join('');
    menuSel.innerHTML = tabs().map(function (t) { return '<option value="' + t.k + '"' + (t.k === cur ? ' selected' : '') + '>' + esc(t.label) + '</option>'; }).join('');
  }
  menuSel.addEventListener('change', function () { location.hash = href(menuSel.value); });
  function crumb(parts) {
    return '<div class="dg-crumb"><a href="#/">Stadium &amp; Arena Guide</a>' + parts.map(function (p) { return ' &rsaquo; ' + (p[1] ? '<a href="' + p[1] + '">' + esc(p[0]) + '</a>' : esc(p[0])); }).join('') + '</div>';
  }
  function head(k, h, lede, right) {
    return '<div class="dg-head"><div><div class="dg-k">' + esc(k) + '</div><h2 class="dg-h1">' + h + '</h2></div>' + (right || '') + '</div>' + (lede ? '<p class="dg-lede">' + lede + '</p>' : '');
  }
  function toggles(list, cur) {
    return '<div class="dg-toggles" role="group">' + list.map(function (x) { return '<a href="' + x[1] + '" aria-pressed="' + (x[0] === cur) + '">' + esc(x[0]) + '</a>'; }).join('') + '</div>';
  }

  // ---------- the offer ----------
  function mode() {
    if (!ST.published) return 'soon';
    if (!token()) return 'join';
    return ST.balance >= ST.cost ? 'points' : 'buy';
  }
  function ctaLabel() { return { soon: 'Coming soon', join: 'Get it for $11', points: 'Unlock with ' + pts(ST.cost) + ' points', buy: 'Get it for $11' }[mode()]; }
  function offerLine() {
    var m = mode();
    if (m === 'soon') return 'The full Guide opens soon. Hard Rock Stadium is open to everyone now.';
    if (m === 'points') return 'Unlock it with ' + pts(ST.cost) + ' points: you have ' + pts(ST.balance) + '. Or get it for $11.';
    return 'It is $11, or ' + pts(ST.cost) + ' points, and yours to keep. Buying it makes you a member of Vegans Explore.';
  }
  function ctaBtns() {
    var m = mode();
    return '<div class="dg-btns"><button type="button" class="dg-btn" data-join' + (m === 'soon' ? ' disabled style="opacity:.6;cursor:default"' : '') + '>' + esc(ctaLabel()) + '</button>' +
      (m === 'join' ? '<a href="#" data-signin style="font-size:12.5px;font-weight:800;color:var(--g)">Already a member? Sign in</a>' : '') +
      (m === 'points' ? '<a href="#" data-buy style="font-size:12.5px;font-weight:800;color:var(--g)">Or get it for $11</a>' : '') + '</div>';
  }
  function gated(inner, title, text) {
    return '<div class="dg-gated"><div class="dg-blur" aria-hidden="true">' + inner + '</div><div class="dg-gate"><span class="dg-lockic">' + LOCK_SVG.replace(/width="11" height="11"/, 'width="16" height="16"').replace('currentColor', '#1f5f22') + '</span>' +
      '<b>' + esc(title) + '</b><p>' + esc(text) + ' ' + esc(offerLine()) + '</p>' + ctaBtns() + '</div></div>';
  }
  function drawJoinbox() {
    var box = document.querySelector('.dg-joinbox'); if (!box) return;
    var btn = box.querySelector('[data-join]'), signin = box.querySelector('.dg-jb-in');
    btn.textContent = ctaLabel(); btn.disabled = mode() === 'soon'; btn.style.opacity = mode() === 'soon' ? '.6' : '';
    signin.style.display = mode() === 'join' || mode() === 'soon' ? '' : 'none';
  }

  // ---------- views ----------
  // The front page leads with the venues (Sean, 2026-10-29: "they need to see that visual of these are the different stadiums...
  // Choose your stadium"): one line on what it is for, the venue pictures, then what else is in the Guide, each with a picture.
  // Choose the city (Sean, 2026-10-29: "the drop down underneath choose your stadium... they can choose their next city"): the
  // chapters that have venues, kept for the visit, South Florida first.
  var HUB_NAMES = { 'south-florida': 'South Florida', 'central-florida': 'Central Florida', 'atlanta': 'Atlanta', 'philadelphia': 'Philadelphia', 'new-york': 'New York' };
  function hubName(h) { var x = (window.VE_HUBS || []).filter(function (v) { return v.slug === h; })[0]; return x ? x.name : HUB_NAMES[h] || h; }
  function cities() {
    var seen = {}, out = [];
    (VENUES || []).forEach(function (v) { if (v.hub && !seen[v.hub]) { seen[v.hub] = 1; out.push(v.hub); } });
    return out;
  }
  function city() {
    var c = ''; try { c = sessionStorage.getItem('sa_city') || ''; } catch (e) {}
    var list = cities();
    return c === 'all' || list.indexOf(c) >= 0 ? c : (list.indexOf('south-florida') >= 0 ? 'south-florida' : list[0] || 'all');
  }
  function cityPicker() {
    var list = cities(); if (list.length < 2) return '';
    var c = city();
    return '<label class="sa-city"><span>City</span><select id="saCity">' + list.map(function (h) { return '<option value="' + esc(h) + '"' + (h === c ? ' selected' : '') + '>' + esc(hubName(h)) + '</option>'; }).join('') +
      '<option value="all"' + (c === 'all' ? ' selected' : '') + '>All cities</option></select></label>';
  }
  function inCity(v) { var c = city(); return c === 'all' || v.hub === c; }
  function wireCity() {
    var el = document.getElementById('saCity'); if (!el) return;
    el.addEventListener('change', function () { try { sessionStorage.setItem('sa_city', el.value); } catch (e) {} route(); });
  }
  // The Overview (Sean, 2026-10-29: "lay out a little bit more of what this is... the four most recent... how to use it... stress
  // the idea that they can save the listings... the members help keep it accurate... make them excited about getting into it"):
  // the promise, a working Get me there on the free venue, how to use it, built with members, bounties, newly added, and the way in.
  // The list of every venue with its city filter lives on its own tab.
  var OV = {"lib": "VEVenueMap", "demo": "124", "freeName": "Hard Rock Stadium", "place": "venue", "listHash": "#/venues", "venueHash": "#/venue/", "kicker": "The Stadium & Arena Guide", "choose": "Choose your venue", "promise": "Vegan food at the game, section by section.", "lede": "Every stand with Vegan food at the stadiums and arenas in our cities, and where it is. Type the section on your ticket and see the closest one, with the walk.", "tryTitle": "You are in section 124 at Hard Rock Stadium", "tryLede": "Here is what Get me there shows you: the closest Vegan food, the walk and the minutes. Open it to see the map of the bowl.", "step1": ["Pick your venue", "Choose your stadium or arena, before the game or once you are in your seat."], "step2": ["Type your section", "Enter the section on your ticket and press Get me there for the closest Vegan food, with the walk."], "step3": "Tap Save on a venue or an item and it waits in My list, ready on game day.", "built": "We started with what we could find: venue and team pages, menus and news from the last two years. From here it is our members who keep it right and fill in what is missing, every game they go to.", "newTitle": "The latest venues in the Guide", "joinTitle": "Get every venue", "getThere": "Get me there from your seat"};
  var OV_ICON = {
    pick: '<svg width="26" height="26" viewBox="0 0 24 24" ' + S + '><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    go: '<svg width="26" height="26" viewBox="0 0 24 24" ' + S + '><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>',
    save: '<svg width="26" height="26" viewBox="0 0 24 24" ' + S + '><path d="M6 3h12v18l-6-4-6 4z"/></svg>'
  };
  function viewOverview() {
    var own = owner();
    var cta = own ? '<div class="dg-btns"><a class="dg-btn" href="' + OV.listHash + '">' + esc(OV.choose) + '</a><a class="dg-btn dg-ghost" href="#/mylist">My list</a></div>'
      : '<div class="dg-btns"><a class="dg-btn" href="#/join">Get the Guide: $11 or ' + pts(ST.cost) + ' points</a><a class="dg-btn dg-ghost" href="' + OV.venueHash + FREE + '">Try ' + esc(OV.freeName) + ' free</a></div>';
    var newest = !VENUES ? '<div class="dg-loading">Loading...</div>'
      : '<div class="sa-vgrid ov-new">' + VENUES.slice().sort(function (a, b) { return String(b.added || '').localeCompare(String(a.added || '')) || (b.sort_order || 0) - (a.sort_order || 0); }).slice(0, 6).map(venueCard).join('') + '</div>';
    main.innerHTML =
      '<section class="ov-hero"><div class="dg-k">' + esc(OV.kicker) + '</div><h2 class="dg-h1">' + esc(OV.promise) + '</h2><p class="dg-lede">' + OV.lede + '</p>' + cta + '</section>' +
      '<section class="ov-sec ov-try" aria-label="Try Get me there"><div class="ov-try-l"><div class="dg-k">Try it</div><h3>' + OV.tryTitle + '</h3><p>' + OV.tryLede + '</p><div id="ovDirs"><div class="dg-loading">Finding the closest Vegan food...</div></div>' +
        '<a class="dg-btn" href="' + OV.venueHash + FREE + '">Open ' + esc(OV.freeName) + '</a></div>' +
        '<a class="ov-try-img" href="' + OV.venueHash + FREE + '" aria-label="Open ' + esc(OV.freeName) + '"' + (freeImg() ? ' style="background-image:url(\'' + esc(freeImg()) + '\')"' : '') + '><span>Open ' + esc(OV.freeName) + '</span></a></section>' +
      '<section class="ov-sec"><div class="dg-k">How to use it</div><h3 class="ov-h">Three steps, wherever you are</h3><div class="ov-steps">' +
        [['pick', OV.step1[0], OV.step1[1]], ['go', OV.step2[0], OV.step2[1]], ['save', 'Save it for later', OV.step3]].map(function (s, i) {
          return '<div class="ov-step"><span class="ov-ic">' + OV_ICON[s[0]] + '</span><b><span class="ov-n">' + (i + 1) + '</span>' + esc(s[1]) + '</b><p>' + esc(s[2]) + '</p></div>'; }).join('') + '</div></section>' +
      (own ? '' : '<section class="ov-sec ov-join"><div><div class="dg-k">Get access</div><h3 class="ov-h">' + esc(OV.joinTitle) + '</h3><p>Every ' + esc(OV.place) + ' with ' + esc(OV.getThere) + ', My list, and the bounties. $11 or ' + pts(ST.cost) + ' points, yours to keep. Buying a Guide makes you a member of Vegans Explore.</p></div><a class="dg-btn" href="#/join">Get the Guide</a></section>') +
      '<section class="ov-sec ov-built"><div><div class="dg-k">Built with you</div><h3 class="ov-h">Members keep it right</h3><p>' + OV.built + '</p>' +
        '<ul class="ov-list"><li><b>Still here:</b> it is still sold, as written.</li><li><b>Something changed:</b> a new price, a new name, or it is gone.</li><li><b>Something missing:</b> a Vegan item or a spot that is not in the Guide yet.</li></ul>' +
        '<p class="ov-small">Every item says where it came from and when a member last checked it, so you know what is fresh.</p></div>' +
        '<a class="ov-bounty" href="' + (own ? '#/report' : '#/join') + '"><span class="ov-bk">Bounties</span><b>Be first to confirm an item and earn the bounty</b><span id="ovBounty">' + (own ? 'Every report you send from inside earns points, and the first to confirm an item earns the most.' : 'Bounties unlock with the Guide. Every report you send from inside earns points, and the first to confirm an item earns the most.') + '</span><i>' + (own ? 'How it works' : 'Get the Guide') + '</i></a></section>' +
      '<section class="ov-sec"><div class="dg-k">Newly added</div><h3 class="ov-h">' + esc(OV.newTitle) + '</h3>' + newest + '<p class="ov-small"><a href="' + OV.listHash + '">See every ' + esc(OV.place) + ', by city</a></p></section>';
    tryIt();
    bountyLine(own);
    // Opening the free one from Try it starts it where the demo stood, so the directions are already there.
    [].forEach.call(main.querySelectorAll('.ov-try a'), function (l) { l.addEventListener('click', function () {
      try { if (!localStorage.getItem(seatKey(FREE))) localStorage.setItem(seatKey(FREE), OV.demo); } catch (e) {}
    }); });
  }
  function freeImg() { var v = (VENUES || []).filter(function (x) { return x.slug === FREE; })[0]; return v && v.image; }
  // A working Get me there on the free one, from a set starting point, with the two closest spots.
  function tryIt() {
    var d = VENUE[FREE];
    if (!d) { api({ action: 'venue', slug: FREE }).then(function (x) { VENUE[FREE] = x; if (!curView() || curView() === 'overview') tryIt(); }); return; }
    var dirs = document.getElementById('ovDirs'); if (!dirs || !d.venue || !d.venue.layout || !window[OV.lib]) return;
    var L = window[OV.lib];
    var stands = d.spots.map(function (s, i) { return { n: i + 1, id: s.id, name: s.name, sections: s.map_sections, level: s.map_level, zone: s.zone }; })
      .filter(function (s) { return (s.sections || []).length || s.level; });
    var you = L.find(d.venue.layout, OV.demo), r = you ? L.route(d.venue.layout, you, stands) : null;
    var best = r ? r.routes.filter(function (x) { return !x.rescreen; }).slice(0, 2) : [];
    dirs.innerHTML = best.length ? '<ol class="sa-dirs">' + best.map(function (x) {
      return '<li><span class="sa-dir-go" style="cursor:default"><span class="sa-pinno">' + x.stand.n + '</span><span><b>' + esc(x.stand.name) + '</b> <span class="sa-dir-meta">about ' + x.minutes + ' min</span></span></span><p>' + x.steps.map(esc).join(' ') + '</p></li>'; }).join('') + '</ol>' : '';
  }
  // What the bounties hold right now: an owner's open points, or what is waiting for anyone who gets the Guide.
  function bountyLine(own) {
    api({ action: 'bounties', hub: 'all' }).then(function (d) {
      var el = document.getElementById('ovBounty'); if (!el || !d) return;
      var mine = (d.venues || []).filter(function (v) { return v.guide === SLUG; }).reduce(function (n, v) { return n + (v.points || 0); }, 0);
      var lock = (d.locked || []).filter(function (g) { return g.guide === SLUG; })[0];
      if (own && mine) el.textContent = pts(mine) + ' points of bounties are open right now. The first to confirm an item earns the most.';
      else if (!own && lock && lock.points) el.textContent = pts(lock.points) + ' points of bounties are waiting. They unlock with the Guide.';
    }).catch(function () {});
  }

  // A venue is its picture (our own illustration, ve_venues.image_url), then its name, teams and what we know.
  function venueCard(v) {
    var locked = !owner() && !v.free;
    var badge = v.free && !owner() ? tagHtml('Free to everyone', 'sa-tag-free') : locked ? tagHtml('Members', 'sa-tag-lock') : '';
    var tags = tagHtml(v.items ? v.items + ' Vegan item' + (v.items === 1 ? '' : 's') : 'Nothing listed yet', v.items ? 'sa-tag-new' : 'sa-tag-stale') +
      (v.last ? tagHtml('Checked ' + fmtDate(v.last), 'sa-tag-fresh') : '') +
      (v.bounties && owner() ? tagHtml(v.bounties + (v.bounties === 1 ? ' bounty' : ' bounties') + ' open', 'sa-tag-bounty') : '');
    var pic = v.image ? '<span class="sa-vimg" style="background-image:url(\'' + esc(v.image) + '\')" role="img" aria-label="' + esc(v.name) + ', illustrated">' + (badge ? '<span class="sa-vbadge">' + badge + '</span>' : '') + '</span>'
      : '<span class="sa-vimg sa-vimg-none">' + (ICON[v.kind] || ICON.stadium) + (badge ? '<span class="sa-vbadge">' + badge + '</span>' : '') + '</span>';
    return '<a class="sa-vcard" href="#/venue/' + esc(v.slug) + '">' + pic + '<span class="sa-vbody"><h3>' + esc(v.name) + '</h3>' +
      '<span class="sa-vmeta">' + esc(KIND[v.kind] || '') + ' &middot; ' + esc(v.city || '') + (v.state ? ', ' + esc(v.state) : '') + (v.teams && v.teams.length ? ' &middot; ' + esc(v.teams.join(', ')) : '') + '</span>' +
      '<span class="sa-vtags">' + tags + '</span></span></a>';
  }
  function viewVenues(sub) {
    var f = sub === 'stadiums' ? 'stadium' : sub === 'arenas' ? 'arena' : '';
    var t = toggles([['All', '#/venues'], ['Stadiums', '#/venues/stadiums'], ['Arenas', '#/venues/arenas']], f === 'stadium' ? 'Stadiums' : f === 'arena' ? 'Arenas' : 'All');
    if (!VENUES) { main.innerHTML = head('Venues', 'Pick your venue', '', t) + '<div class="dg-loading">Loading the venues...</div>'; return; }
    var list = VENUES.filter(function (v) { return (!f || v.kind === f) && inCity(v); });
    main.innerHTML = head('Venues', 'Choose your stadium', 'Pick your city, then your venue. Each one lists its stands with Vegan food and where to find them.', t) +
      cityPicker() + (list.length ? '<div class="sa-vgrid">' + list.map(venueCard).join('') + '</div>' : '<p class="dg-empty">No venues here yet.</p>');
    wireCity();
  }

  function freshTag(it) {
    if (it.freshness === 'fresh') return tagHtml('Checked ' + fmtDate(it.last_confirmed_at), 'sa-tag-fresh');
    return tagHtml(it.freshness === 'stale' ? 'Needs a fresh check' : 'Not checked by a member yet', it.freshness === 'stale' ? 'sa-tag-stale' : 'sa-tag-new') + bountyTag(it);
  }
  // The first member to confirm an item no one has checked lately earns the bounty; after that Still here pays its usual amount.
  function firstPts() { var p = POINTS.confirm; return p && p.first_with_photo ? p.first_with_photo : 0; }
  function bountyTag(it) { return owner() && it && it.bounty && firstPts() ? tagHtml('Bounty: first to confirm, ' + pts(firstPts()) + ' points', 'sa-tag-bounty') : ''; }
  function srcLine(it) {
    var s = it.sources || [];
    if (!s.length) return '';
    return '<div class="sa-srcs">From ' + s.map(function (x) { return x.url ? '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.label) + (x.date ? ', ' + esc(monthOf(x.date)) : '') + '</a>' : esc(x.label); }).join(' ') + '</div>';
  }
  function saveBtn(kind, key, on) {
    if (!owner()) return '';
    return '<button type="button" class="dg-save' + (on ? ' on' : '') + '" data-save="' + kind + '" data-key="' + esc(key) + '" aria-pressed="' + !!on + '">' + BOOKMARK + '<span>' + (on ? 'Saved' : 'Save') + '</span></button>';
  }
  function itemRow(v, it) {
    var vg = VEGAN[it.vegan] || VEGAN.vegan;
    return '<div class="sa-item"><div class="sa-item-b"><b>' + esc(it.name) + '</b>' + (it.description ? '<p>' + esc(it.description) + '</p>' : '') +
      '<div class="sa-vtags" style="margin:0 0 6px">' + tagHtml(vg[0], 'sa-tag-' + vg[1]) + freshTag(it) + '</div>' + srcLine(it) + '</div>' +
      '<div class="sa-acts">' + saveBtn('venue_item', it.id, it.saved) +
      // One Update button (Sean, 2026-10-29: "just save and update... when they click update, it takes them to... that page"): it
      // opens the choices, Still here, Something changed, Not there anymore and Comment, each with its points.
      '<a class="sa-mini" href="#/venue/' + esc(v.slug) + '/report/choose/' + it.id + '">Update</a></div>' + commentsHtml(it) + '</div>';
  }
  // What members said: comments the team accepted, with the photo when there is one.
  function commentsHtml(it) {
    var cs = it.comments || [];
    if (!cs.length) return '';
    return '<div class="sa-cmts">' + cs.map(function (c) {
      return '<div class="sa-cmt">' + (c.photo ? '<a href="' + esc(c.photo) + '" target="_blank" rel="noopener"><img alt="A member\'s photo" src="' + esc(c.photo) + '" loading="lazy"></a>' : '') +
        '<p>&ldquo;' + esc(c.note || '') + '&rdquo;<span>' + esc(c.member || 'A member') + ' &middot; ' + esc(fmtDate(c.at)) + '</span></p></div>';
    }).join('') + '</div>';
  }
  function ptsLine(kind, it) {
    var p = POINTS[kind]; if (!p) return '';
    if (kind === 'confirm' && it && it.bounty && p.first_with_photo) return 'Bounty, be first: ' + pts(p.first_with_photo) + ' points with a photo, ' + pts(p.first_no_photo) + ' without';
    return pts(p.with_photo) + ' points with a photo, ' + pts(p.no_photo) + ' without';
  }
  function standCard(v, s, open) {
    var zone = s.zone === 'suites' ? tagHtml('Suites only', 'sa-tag-ask') : s.zone === 'club' ? tagHtml('Club level', 'sa-tag-ask') : '';
    var dir = s.listing ? ' &middot; <a href="/directory/' + esc(s.listing.slug) + '" style="color:var(--g);font-weight:800;font-size:13px">Their Directory page</a>' : '';
    var body = open ? (s.items.length ? s.items.map(function (it) { return itemRow(v, it); }).join('') : '<p class="dg-empty">Nothing listed here yet.</p>')
      : Array.apply(null, Array(s.item_count || 1)).map(function () { return '<div class="sa-item"><div class="sa-item-b"><div class="dg-skel" style="border:0;padding:0"><i></i><i style="width:70%"></i></div></div></div>'; }).join('');
    // Every stand has its number (Sean, 2026-10-29: "there are no numbers next to the other locations"). A stand with known
    // sections is pinned on the map under that number, once per spot it sells from; one we only know the level of says so.
    var num = s.num ? '<span class="sa-pinno' + (s.pin ? '' : ' off') + '" aria-label="' + (s.pin ? 'Pin ' + s.pin + ' on the map' : 'Stand ' + s.num + ', not on the map yet') + '">' + s.num + '</span>' : '';
    var spots = (s.map_sections || []).length;
    var onMap = !open || !v.layout ? '' : s.pin ? (spots > 1 ? tagHtml(spots + ' spots on the map', 'sa-tag-new') : '') : s.zone === 'suites' ? '' : tagHtml('Not on the map yet', 'sa-tag-stale');
    return '<div class="sa-stand" id="sa-st-' + esc(s.id) + '"><div class="sa-stand-h"><div><h3>' + num + esc(s.name) + '</h3><span class="sa-where">' + ICON.pin + esc(s.where || '') + '</span>' + dir +
      (s.note ? '<p class="sa-snote">' + esc(s.note) + '</p>' : '') + '</div><span class="sa-vtags" style="margin:0">' + zone + onMap + '</span></div>' + body + '</div>';
  }
  function viewVenue(slug, rest) {
    var r = (rest || '').split('/');
    if (r[0] === 'report') return viewReport(slug, r[1], r[2]);
    var d = VENUE[slug];
    if (!d) {
      main.innerHTML = crumb([['Venues', '#/venues'], ['...', '']]) + '<div class="dg-loading">Loading the venue...</div>';
      api({ action: 'venue', slug: slug }).then(function (x) { VENUE[slug] = x; if (curView() === 'venue/' + slug) route(); }).catch(function () { main.innerHTML = '<p class="dg-empty">That did not load. Refresh to try again.</p>'; });
      return;
    }
    if (d.error) { main.innerHTML = crumb([['Venues', '#/venues']]) + '<p class="dg-empty">We could not find that venue.</p>'; return; }
    var v = d.venue;
    var lede = esc(KIND[v.kind] || '') + ' &middot; ' + esc(v.city || '') + (v.state ? ', ' + esc(v.state) : '') + ' &middot; ' + esc((v.teams || []).join(', '));
    var meta = '<div class="sa-vhead">' + (v.maps ? '<a href="' + esc(v.maps) + '" target="_blank" rel="noopener">Map</a>' : '') +
      (v.note ? '<span>' + esc(v.note) + (v.note_source_url ? ' <a href="' + esc(v.note_source_url) + '" target="_blank" rel="noopener">Source</a>' : '') + '</span>' : '') + '</div>';
    var acts = '<div class="dg-btns">' + saveBtn('venue', v.slug, d.saved) + '<a class="dg-btn dg-ghost" href="#/venue/' + esc(v.slug) + '/report/missing">Add something missing</a></div>';
    var pins = 0;
    d.spots.forEach(function (s, i) { s.num = d.open ? i + 1 : 0; s.pin = d.open && v.layout && (s.map_sections || []).length ? s.num : 0; if (s.pin) pins++; });
    var stands = d.spots.length ? d.spots.map(function (s) { return standCard(v, s, d.open); }).join('')
      : '<div class="dg-chef-empty"><div><h3>Nothing Vegan is listed here yet</h3><p>Be the first: tell us what you find at ' + esc(v.name) + ', with a photo from inside, and earn points when the team accepts it.</p></div><a class="dg-btn" href="#/venue/' + esc(v.slug) + '/report/missing">Add what you find</a></div>';
    var note = '<p class="dg-lede" style="font-size:13px;margin-top:4px">Menus change, so ask at the stand when it matters. Every item says where it came from and when a member last checked it.</p>';
    main.innerHTML = crumb([['Venues', '#/venues'], [v.name, '']]) + head(v.free && !owner() ? 'Free to everyone' : 'Venue', esc(v.name), lede, acts) + meta +
      (d.open && v.layout && window.VEVenueMap ? mapPanel(v, d, stands + note) : d.open ? stands + note : gated(stands, v.name + ' is in the full Guide', 'Every stand with Vegan food here, where it is, and when a member last checked it.'));
    if (d.open && v.layout && window.VEVenueMap) { VEVenueMap.css(); drawMap(v, d); }
  }

  // The map and Get me there (Sean, 2026-10-28). Pins are the stands we know the sections of; directions start from the section on
  // the member's ticket (public/ve-venue-map.js), kept for the next visit in this browser.
  function seatKey(slug) { return 've_sa_seat_' + slug; }
  function mapStands(d) { return d.spots.filter(function (s) { return s.pin; }).map(function (s) { return { n: s.pin, id: s.id, name: s.name, sections: s.map_sections }; }); }
  // Desktop (Sean, 2026-10-28: "put the image to the right and the information to the left... a half situation"): the map stays
  // on the right while the left holds Your section, the directions and the stands, so a pin's stand shows beside it. Phones keep
  // one column: Your section, the map, the directions, then the stands.
  function mapPanel(v, d, standsHtml) {
    var seat = ''; try { seat = localStorage.getItem(seatKey(v.slug)) || ''; } catch (e) {}
    return '<section class="sa-vgrid2" aria-label="Map of ' + esc(v.name) + '">' +
      '<div class="sa-g-form"><div class="sa-map-h"><div><h2>Get me there</h2><p>Type the section on your ticket. The pins on the map are the stands.</p></div>' +
      '<form class="sa-seat" id="saSeat"><label for="saSeatIn">Your section</label><div><input id="saSeatIn" inputmode="text" autocomplete="off" maxlength="12" placeholder="142" value="' + esc(seat) + '">' +
      '<button class="dg-btn" type="submit">Get me there</button></div></form></div></div>' +
      '<div class="sa-g-map"><div class="sa-map-box" id="saMapBox"></div><div class="sa-map-foot"><button type="button" class="sa-mini" id="saZoom" aria-pressed="false">Bigger map</button><span>Our own drawing, from the section numbers. Phone GPS is not accurate inside a stadium.</span></div></div>' +
      '<div class="sa-g-dirs" id="saDirs" aria-live="polite"></div>' +
      '<div class="sa-g-stands">' + standsHtml + '</div></section>';
  }
  function drawMap(v, d) {
    var box = document.getElementById('saMapBox'); if (!box) return;
    var form = document.getElementById('saSeat'), inp = document.getElementById('saSeatIn'), dirs = document.getElementById('saDirs');
    var stands = mapStands(d);
    var levelOnly = d.spots.filter(function (s) { return !s.pin && s.map_level && s.zone !== 'suites'; });
    var levelName = function (lv) { var L = VEVenueMap.levels(v.layout), i = VEVenueMap.levelOf(v.layout, lv); return i >= 0 ? L[i].name : lv + ' level'; };
    var paint = function () {
      var seat = inp.value.trim(), you = seat ? VEVenueMap.find(v.layout, seat) : null, r = you ? VEVenueMap.route(v.layout, you, stands) : null;
      box.innerHTML = VEVenueMap.svg(v.layout, stands, { you: you, route: r, title: 'Map of ' + v.name });
      var html = '';
      if (seat && !you) html = '<p class="sa-dir-miss">We could not find section ' + esc(seat) + ' at ' + esc(v.name) + '. Check the number on your ticket.</p>';
      else if (r && !r.routes.length) html = '<p class="sa-dir-hint">You are marked on the map. No stand with Vegan food here is on the map yet: add one with Add something missing when you find it.</p>';
      else if (r) {
        html = '<ol class="sa-dirs">' + r.routes.map(function (x) {
          return '<li><button type="button" class="sa-dir-go" data-st="' + esc(x.stand.id) + '"><span class="sa-pinno">' + x.stand.n + '</span><span><b>' + esc(x.stand.name) + '</b> <span class="sa-dir-meta">section ' + esc(x.section) +
            ' &middot; about ' + x.minutes + ' min</span></span></button><p>' + x.steps.map(esc).join(' ') + '</p></li>';
        }).join('') + '</ol>';
        if (!you.exact && you.exact !== undefined) html = '<p class="sa-dir-miss">Section ' + esc(seat) + ' is not on our map yet, so this starts from the nearest one we have.</p>' + html;
      } else html = '<p class="sa-dir-hint">Type the section on your ticket and press Get me there.</p>';
      if (levelOnly.length) html += '<p class="sa-dir-hint">' + levelOnly.map(function (s) { return '<b>' + esc(s.name) + '</b> is on the ' + esc(levelName(s.map_level)) + '; we do not know the section yet, so ask a stadium worker there.'; }).join(' ') + '</p>';
      dirs.innerHTML = html;
    };
    form.addEventListener('submit', function (e) { e.preventDefault(); try { localStorage.setItem(seatKey(v.slug), inp.value.trim()); } catch (er) {} paint(); });
    box.addEventListener('click', function (e) {
      var g = e.target.closest && e.target.closest('[data-pin]'); if (!g) return;
      var st = stands.filter(function (x) { return String(x.n) === g.getAttribute('data-pin'); })[0];
      [].forEach.call(box.querySelectorAll('.vvm-pin'), function (x) { x.classList.toggle('on', x === g); });
      var el = st && document.getElementById('sa-st-' + st.id); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.classList.add('sa-flash'); setTimeout(function () { el.classList.remove('sa-flash'); }, 1600); }
    });
    dirs.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-st]'); if (!b) return;
      var el = document.getElementById('sa-st-' + b.getAttribute('data-st')); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    var z = document.getElementById('saZoom');
    z.addEventListener('click', function () { var on = box.classList.toggle('zoom'); z.setAttribute('aria-pressed', on); z.textContent = on ? 'Smaller map' : 'Bigger map'; });
    paint();
  }

  function viewReportTab() {
    var signedIn = !!token();
    // The points come from ve_venue_report_points (Sean's to change), so this table never disagrees with what is paid.
    var P = function (k, f, d) { return POINTS[k] ? POINTS[k][f] : d; };
    var rows = [
      ['Update', 'Something changed or is gone, the first accepted report', P('wrong', 'with_photo', 100), P('wrong', 'no_photo', 50)],
      ['Something missing', 'A Vegan item or stand that is not in the Guide yet', P('missing', 'with_photo', 100), P('missing', 'no_photo', 50)],
      ['Agrees with the first', 'An update the team already accepted from someone else', P('wrong', 'agree_with_photo', 25), P('wrong', 'agree_no_photo', 15)],
      ['Still here, first to confirm', 'The bounty: the first member to confirm an item no one has checked in ' + (LIMITS.fresh_days || 35) + ' days', P('confirm', 'first_with_photo', 50), P('confirm', 'first_no_photo', 25)],
      ['Still here', 'After someone has confirmed it', P('confirm', 'with_photo', 10), P('confirm', 'no_photo', 5)],
      ['Comment', 'What you thought, a tip for other fans', P('comment', 'with_photo', 10), P('comment', 'no_photo', 5)]
    ];
    main.innerHTML = head('Help keep it right', 'Members keep this Guide right', 'Menus at the game change all season. When you are at a venue, tell us what is still there, what changed and what you thought. A photo earns more. Bounties are part of the Guide: once it is yours, every report you send from inside earns points.') +
      '<div class="sa-ptable" role="table" aria-label="Points for each kind of report"><div class="sa-ptr sa-pth" role="row"><span role="columnheader">What you send</span><span role="columnheader">With a photo</span><span role="columnheader">Without</span></div>' +
      rows.map(function (r) { return '<div class="sa-ptr" role="row"><span role="cell"><b>' + esc(r[0]) + '</b><i>' + esc(r[1]) + '</i></span><span role="cell"><b>' + pts(r[2]) + '</b> points</span><span role="cell"><b>' + pts(r[3]) + '</b> points</span></div>'; }).join('') + '</div>' +
      '<ol class="sa-steps"><li>Open the venue while you are there and tap <b>Still here</b>, <b>Update</b> or <b>Comment</b> on an item, or <b>Add something missing</b>.</li>' +
      '<li>Add a photo of the menu board or the food if you can. Your phone shares your location once, to show you are inside the venue.</li>' +
      '<li>The team checks every one, so a photo that does not help is not paid. Points land when it is accepted, up to ' + (LIMITS.daily_paid_cap || 40) + ' paid a day. Look for <b>Bounty</b> on an item or a venue: the first to confirm it earns the most.</li></ol>' +
      '<div class="dg-btns" style="margin-bottom:18px"><a class="dg-btn" href="#/venues">Pick a venue</a></div>' +
      (signedIn ? '<h3 class="dg-k" style="margin:6px 0 10px">Your reports</h3><div id="saMine"><div class="dg-loading">Loading your reports...</div></div>' : '');
    if (signedIn) api({ action: 'mine' }).then(function (d) {
      var el = document.getElementById('saMine'); if (!el) return;
      var list = (d && d.reports) || [];
      el.innerHTML = list.length ? '<div class="dg-rows">' + list.map(function (r) {
        var st = STATUS[r.status] || STATUS.pending;
        return '<div class="dg-row" style="grid-template-columns:minmax(0,1fr) auto"><div class="dg-row-main"><b>' + esc((REPORT[r.kind] || [r.kind])[0]) + ': ' + esc(r.item || r.spot || r.note || '') + '</b><span>' + esc(r.venue || '') + ' &middot; ' + esc(fmtDate(r.at)) +
          (r.points ? ' &middot; ' + r.points + ' points' : '') + (r.review_note ? ' &middot; ' + esc(r.review_note) : '') + '</span></div>' + tagHtml(st[0], 'dg-tag-' + st[1]) + '</div>';
      }).join('') + '</div>' : '<p class="dg-empty">No reports yet. Your first one is waiting at your next game.</p>';
    });
  }

  // Update: what they can tell us about one item, each with its points, then its form.
  function viewChoose(v, item, back) {
    main.innerHTML = crumb([['Venues', '#/venues'], [v.name, back], ['Update', '']]) +
      head('Update', esc(item.it.name), esc(item.spot.name) + (item.spot.where ? ', ' + esc(item.spot.where) : '') + '. What would you like to tell us? Each one earns points once the team accepts it, more with a photo.') +
      '<div class="sa-choose">' + ['confirm', 'wrong', 'gone', 'comment'].map(function (k) {
        return '<a class="sa-choice" href="#/venue/' + esc(v.slug) + '/report/' + k + '/' + item.it.id + '"><b>' + esc(REPORT[k][2]) + '</b><span>' + esc(REPORT[k][1]) + '</span>' +
          (ptsLine(k, item.it) ? '<i>' + esc(ptsLine(k, item.it)) + '</i>' : '') + '</a>';
      }).join('') + '</div>' +
      '<div class="dg-formnav"><a class="dg-tnav" href="' + back + '">Back</a></div>';
  }

  // The report form: one view, the photo, a note, and Send (which asks for the location once).
  var PHOTO = null;
  function viewReport(slug, kind, itemId) {
    var d = VENUE[slug];
    if (!d) { viewVenue(slug); return; }
    var v = d.venue, item = null;
    d.spots.forEach(function (s) { (s.items || []).forEach(function (it) { if (it.id === itemId) item = { it: it, spot: s }; }); });
    var back = '#/venue/' + v.slug;
    if (kind === 'choose' && item) return viewChoose(v, item, back);
    if (!REPORT[kind]) kind = 'missing';
    var gate = !token() ? '<div class="dg-door"><p>Sign in to send a report. Reports are for Passport holders.</p><div class="dg-btns"><button type="button" class="dg-btn" data-signin>Sign in</button><a href="/passport" style="font-weight:800;color:var(--g)">Get your Passport</a></div></div>'
      : !ME.active ? '<div class="dg-door"><p>Reports are for Passport holders. Your Passport is $11, one time, with 1,100 welcome points.</p><a class="dg-btn" href="/passport">Get your Passport</a></div>'
      // Bounties unlock with the Guide (Sean, 2026-10-29: "once you purchase a guide, you have a new set of bounties that unlock").
      : !owner() ? '<div class="dg-door"><p>Bounties unlock with the Guide. Once it is yours, every report you send from inside earns points, and the first to confirm an item earns the bounty.</p><a class="dg-btn" href="#/join">Get the Guide</a></div>' : '';
    if (!v.can_report) gate = '<div class="dg-door"><p>Reports for ' + esc(v.name) + ' open soon.</p></div>';
    var what = item ? '<p class="dg-sharenote"><b>' + esc(item.it.name) + '</b> &middot; ' + esc(item.spot.name) + ', ' + esc(item.spot.where || '') + '</p>' : '';
    var kinds = item ? '<div class="sa-kinds">' + ['confirm', 'wrong', 'gone', 'comment'].map(function (k) {
      return '<a class="dg-chip" aria-pressed="' + (k === kind) + '" href="#/venue/' + esc(v.slug) + '/report/' + k + '/' + item.it.id + '">' + esc(REPORT[k][2]) + '</a>'; }).join('') + '</div>' : '';
    var noteLabel = kind === 'missing' ? 'What is missing? <i>The item, the stand and where it is (section or gate)</i>' : kind === 'confirm' ? 'Anything to add? <i>(optional)</i>'
      : kind === 'comment' ? 'Your comment <i>(what you thought, a tip for other fans)</i>' : kind === 'gone' ? 'Anything to add? <i>(optional)</i>' : 'What needs to be updated?';
    var earn = ptsLine(kind, item && item.it);
    main.innerHTML = crumb([['Venues', '#/venues'], [v.name, back]].concat(item ? [['Update', '#/venue/' + v.slug + '/report/choose/' + item.it.id]] : []).concat([[REPORT[kind][2], '']])) + head('Report', esc(REPORT[kind][0]), esc(REPORT[kind][1])) +
      (gate || ('<div class="dg-form">' + what + kinds +
        '<label class="dg-field"><span>' + noteLabel + '</span><textarea id="saNote" rows="3" maxlength="600"></textarea></label>' +
        (earn ? '<p class="sa-earn">' + esc(earn) + ', once the team accepts it.</p>' : '') +
        '<div class="dg-field"><span>A photo <i>(optional: the menu board or the food, and it earns more)</i></span><div class="sa-photo"><label class="dg-btn dg-ghost" style="cursor:pointer">Take or choose a photo<input type="file" id="saPhoto" accept="image/*" capture="environment" hidden></label><span id="saPrev"></span></div></div>' +
        '<span class="dg-status" id="saStatus" role="status"></span>' +
        '<div class="dg-formnav"><a class="dg-tnav" href="' + back + '">Back</a><button type="button" class="dg-btn" id="saSend">Send report</button></div>' +
        '<p class="dg-lede" style="font-size:12.5px;margin-top:12px">Sending asks for your location once, to check you are inside ' + esc(v.name) + '. We keep where you were, rounded, with the report. The team checks every one; a comment they accept shows on the item with your first name and photo.</p></div>'));
    PHOTO = null;
    var inp = document.getElementById('saPhoto');
    if (inp) inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0]; if (!f) return;
      shrink(f).then(function (b) { PHOTO = b; document.getElementById('saPrev').innerHTML = '<img alt="Your photo" src="' + URL.createObjectURL(b) + '">'; })
        .catch(function () { setStatus('That photo could not be read. Try another one.'); });
    });
    var send = document.getElementById('saSend');
    if (send) send.addEventListener('click', function () { sendReport(v, kind, item); });
  }
  function setStatus(msg) { var el = document.getElementById('saStatus'); if (el) el.textContent = msg; [].forEach.call(document.querySelectorAll('.dg-joinbox .dg-status'), function (e) { e.textContent = el ? '' : msg; }); }
  // Shrink to 1600 px JPEG in the browser (a new image, so the phone's location data is not sent with it).
  function shrink(file) {
    return new Promise(function (ok, bad) {
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () {
        var s = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
        c.toBlob(function (b) { b ? ok(b) : bad(); }, 'image/jpeg', 0.85);
      };
      img.onerror = function () { URL.revokeObjectURL(u); bad(); };
      img.src = u;
    });
  }
  var WHY = {
    too_far: function (d, v) { return 'You need to be inside ' + v.name + ' to send this. You look to be about ' + (d.distance_m >= 1000 ? (d.distance_m / 1000).toFixed(1) + ' km' : d.distance_m + ' m') + ' away.'; },
    not_precise: function () { return 'Your location is not precise enough right now. Step out from under cover for a moment and try again.'; },
    no_position: function () { return 'We need your location once to check you are inside the venue.'; },
    no_location: function (d, v) { return 'Reports for ' + v.name + ' open soon.'; },
    already_today: function () { return 'You already sent this report today. Thank you!'; },
    guide_required: function () { return 'Bounties unlock with the Guide. Get it under Get access.'; },
    daily_limit: function () { return 'That is the most reports for one day. Thank you, and come back next game.'; },
    note_required: function () { return 'Add a few words first.'; },
    bad_photo: function (d) { return (d && d.message) || 'The photo did not upload. Try again, or send it without one.'; }
  };
  function sendReport(v, kind, item) {
    var note = (document.getElementById('saNote') || {}).value || '';
    if (kind === 'missing' && note.trim().length < 3) { setStatus('Tell us what is missing: the item, the stand and where it is.'); return; }
    if (kind === 'wrong' && note.trim().length < 3) { setStatus('Tell us what needs to be updated.'); return; }
    if (kind === 'comment' && note.trim().length < 3) { setStatus('Write your comment first.'); return; }
    if (!navigator.geolocation) { setStatus('This browser cannot share your location, which the report needs.'); return; }
    var btn = document.getElementById('saSend'); btn.disabled = true; btn.textContent = 'Finding you...';
    var fail = function (msg) { btn.disabled = false; btn.textContent = 'Send report'; setStatus(msg); };
    navigator.geolocation.getCurrentPosition(function (pos) {
      btn.textContent = 'Sending...';
      // The photo is optional: upload it first when there is one.
      var send = function (path) {
        return api({ action: 'report', venue: v.slug, kind: kind, item: item ? item.it.id : undefined, spot: item ? item.spot.id : undefined,
          note: note, path: path || undefined, lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
      };
      (PHOTO ? api({ action: 'report_start' }).then(function (s) {
        if (!s || !s.upload_url) throw s || {};
        return fetch(s.upload_url, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: PHOTO }).then(function (r) {
          if (!r.ok) throw {};
          return send(s.path);
        });
      }) : send(null)).then(function (d) {
        if (d && d.ok) {
          main.innerHTML = crumb([['Venues', '#/venues'], [v.name, '#/venue/' + v.slug], ['Sent', '']]) +
            '<div class="dg-done"><div class="dg-k">Sent</div><h2 class="dg-h1">Thank you!</h2><p class="dg-lede">The team checks every report. ' + (d.bounty ? 'You are first on this one: when the team accepts it, it pays the bounty. ' : '') + 'Points land when yours is accepted, and you can follow it under Help keep it right.</p>' +
            '<div class="dg-btns"><a class="dg-btn" href="#/venue/' + esc(v.slug) + '">Back to ' + esc(v.name) + '</a><a class="dg-btn dg-ghost" href="#/report">Your reports</a></div></div>';
          return;
        }
        var f = d && WHY[d.why]; fail(f ? f(d, v) : (d && d.message) || 'That did not go through. Try again in a minute.');
      }).catch(function (e) { fail((e && e.message) || 'That did not go through. Try again in a minute.'); });
    }, function () { fail(WHY.no_position()); }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 });
  }

  function viewMyList() {
    main.innerHTML = head('My list', 'My list', 'The venues and items you saved. Tap Save on a venue or any item.') + '<div id="saML"><div class="dg-loading">Loading your list...</div></div>';
    api({ action: 'saves' }).then(function (d) {
      var el = document.getElementById('saML'); if (!el) return;
      var vs = (d && d.venues) || [], its = (d && d.items) || [];
      if (!vs.length && !its.length) { el.innerHTML = '<p class="dg-empty">Nothing saved yet. Open a venue and tap Save.</p>'; return; }
      el.innerHTML = (vs.length ? '<h3 class="dg-k" style="margin:0 0 10px">Venues</h3><div class="sa-vgrid" style="margin-bottom:18px">' + vs.map(function (v) {
        return '<a class="sa-vcard" href="#/venue/' + esc(v.slug) + '">' + (v.image_url ? '<span class="sa-vimg" style="background-image:url(\'' + esc(v.image_url) + '\')"></span>' : '<span class="sa-vimg sa-vimg-none">' + (ICON[v.kind] || ICON.stadium) + '</span>') +
          '<span class="sa-vbody"><h3>' + esc(v.name) + '</h3><span class="sa-vmeta">' + esc(v.city || '') + ' &middot; ' + esc((v.teams || []).join(', ')) + '</span></span></a>'; }).join('') + '</div>' : '') +
        (its.length ? '<h3 class="dg-k" style="margin:0 0 10px">Items</h3><div class="dg-rows">' + its.map(function (i) {
          return '<a class="dg-row" style="grid-template-columns:minmax(0,1fr) auto;text-decoration:none;color:inherit" href="#/venue/' + esc(i.venue_slug) + '"><div class="dg-row-main"><b>' + esc(i.name) + '</b><span>' + esc(i.spot || '') + (i.where ? ', ' + esc(i.where) : '') + ' &middot; ' + esc(i.venue || '') + '</span></div>' +
            tagHtml((VEGAN[i.vegan] || VEGAN.vegan)[0], 'sa-tag-' + (VEGAN[i.vegan] || VEGAN.vegan)[1]) + '</a>'; }).join('') + '</div>' : '');
    });
  }

  function viewJoin() {
    if (owner()) { main.innerHTML = head('Your Guide', 'The whole Guide is yours', 'Thank you for being here.') + '<a class="dg-btn" href="#/venues">Pick a venue</a>'; return; }
    var m = mode();
    var list = '<div class="dg-access"><ul>' +
      '<li><b>Every venue:</b> the stadiums and arenas in our cities, each with its stands with Vegan food and where they are.</li>' +
      '<li><b>Bounties:</b> earn points for checking what is still there, and be first to confirm an item for the bounty.</li><li><b>Checked by members:</b> every item says when a member last confirmed it from inside, and where it came from.</li>' +
      '<li><b>My list:</b> save the venues you go to and the items you want to find.</li>' +
      '<li><b>The community:</b> your member dashboard, Directory votes, the Daily Pulse and points.</li></ul></div>';
    var status = '<span class="dg-status" role="status" style="display:block;margin-top:10px;color:#8a5a00"></span>';
    var box = m === 'soon' ? '<div class="dg-big">Soon</div><p>The full Guide opens soon. Hard Rock Stadium is open to everyone now.</p><a class="dg-btn" href="#/venue/hard-rock-stadium">Open Hard Rock Stadium</a>'
      : m === 'points' ? '<div class="dg-big">' + pts(ST.cost) + '<small>points</small></div><p>You have ' + pts(ST.balance) + ' points. Unlock the Guide with ' + pts(ST.cost) + ' of them and it is yours to keep.</p>' +
        '<button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button><button type="button" class="dg-btn dg-ghost" data-buy style="margin-top:8px">Or get it for $11</button>' + status
      : '<div class="dg-big">$11<small>yours to keep</small></div><p>' + (m === 'join' ? 'Create your account and get the Guide for $11, one time. Buying it makes you a member of Vegans Explore. Already a member? <a href="#" data-signin>Sign in</a>.'
        : 'Get the Guide for $11, one time, and it is yours to keep.') + '</p><button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button>' + status +
        '<p class="dg-pp">Or get your <a href="/passport">Passport</a>: $11, one time, with 1,100 welcome points, enough for this Guide.</p>';
    main.innerHTML = head('Get access', 'Open every venue', 'Every Vegans Explore Guide is $11, or 1,100 points. Buying a Guide makes you a member, and the Passport comes with 1,100 welcome points.') + list;
    main.querySelector('.dg-access').insertAdjacentHTML('beforeend', '<div class="dg-pricebox">' + box + '</div>');
  }

  // ---------- River, on the right of every tab ----------
  var mayaBox = document.getElementById('dgMaya'), bubble = document.getElementById('dgBubble'), tourEl = document.getElementById('dgTour'), tourM = document.getElementById('dgTourM');
  var foldBtn = document.getElementById('dgFold'), railEl = document.getElementById('dgRail');
  function setFold(folded) {
    railEl.classList.toggle('dg-folded', folded);
    foldBtn.textContent = folded ? 'Show River' : 'Hide River'; foldBtn.setAttribute('aria-expanded', String(!folded));
    try { sessionStorage.setItem('sa_river_folded', folded ? '1' : ''); } catch (e) {}
  }
  foldBtn.addEventListener('click', function () { setFold(!railEl.classList.contains('dg-folded')); });
  try { if (sessionStorage.getItem('sa_river_folded')) setFold(true); } catch (e) {}
  function drawRiver() {
    var t = tab(curTab), list = tabs(), i = 0;
    list.forEach(function (x, n) { if (x.k === curTab) i = n; });
    bubble.textContent = owner() && t.sayMember ? t.sayMember : t.say;
    tourEl.innerHTML = tourM.innerHTML = '<a class="dg-tnav" href="' + href(list[Math.max(0, i - 1)].k) + '"' + (i ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Back</a><span>' + (i + 1) + ' of ' + list.length + '</span>' +
      '<a class="dg-tnav next" href="' + href(list[Math.min(list.length - 1, i + 1)].k) + '"' + (i < list.length - 1 ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Next</a>';
  }

  // ---------- router ----------
  function curView() { return (location.hash || '').replace(/^#\/?/, ''); }
  function route() {
    var parts = curView().split('/');
    var view = parts[0] || 'overview', sub = parts.slice(1).join('/');
    var known = { overview: 1, venues: 1, venue: 1, report: 1, mylist: 1, join: 1 };
    if (!known[view]) view = 'overview';
    if (view === 'mylist' && !owner()) view = 'overview';
    document.body.classList.toggle('dg-member', owner());
    drawJoinbox();
    // River greets on arrival, then steps aside the first time they head into the venues (Sean, 2026-10-29: "if they're moving around
    // at that point, then they're not interested in the tour. But if they are, they can always click on it"). Once a visit.
    if ((view === 'venues' || view === 'venue') && !railEl.classList.contains('dg-folded')) {
      var auto = ''; try { auto = sessionStorage.getItem('sa_river_auto') || ''; } catch (e) {}
      if (!auto) { try { sessionStorage.setItem('sa_river_auto', '1'); } catch (e) {} setFold(true); }
    }
    var key = view === 'venue' ? 'venues' : view === 'join' && owner() ? 'overview' : view;
    drawMenu(key);
    if (view === 'venue') { var s = sub.split('/'); viewVenue(s[0], s.slice(1).join('/')); }
    else ({ overview: viewOverview, venues: function () { viewVenues(sub); }, report: viewReportTab, mylist: viewMyList, join: viewJoin })[view]();
    curTab = key;
    drawRiver();
    main.scrollTop = 0; if (!document.documentElement.classList.contains('dg-fit') || window.innerWidth <= 900) window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  document.addEventListener('click', function (e) {
    var a = auth();
    if (e.target.closest('[data-signin]')) {
      e.preventDefault();
      if (a) a.showAuthModal('Sign in to open the Stadium & Arena Guide and send reports.', function () { location.reload(); }, 'login');
      return;
    }
    var sv = e.target.closest('[data-save]');
    if (sv) {
      e.preventDefault();
      var on = sv.getAttribute('aria-pressed') !== 'true';
      sv.disabled = true;
      api({ action: 'save', kind: sv.getAttribute('data-save'), key: sv.getAttribute('data-key'), on: on }).then(function (d) {
        sv.disabled = false;
        if (!d || !d.ok) return;
        sv.classList.toggle('on', d.saved); sv.setAttribute('aria-pressed', String(d.saved)); sv.querySelector('span').textContent = d.saved ? 'Saved' : 'Save';
        Object.keys(VENUE).forEach(function (k) { delete VENUE[k].__stale; });
      }).catch(function () { sv.disabled = false; });
      return;
    }
    var by = e.target.closest('[data-buy]');
    if (by) { e.preventDefault(); if (token()) buyNow(by); return; }
    var jb = e.target.closest('[data-join]');
    if (jb && !jb.disabled && a) {
      var m = mode();
      if (m === 'soon') return;
      if (m === 'join') {
        var go = function () { delete window.VE_ACTIVATE_HANDLER; buyNow(jb); };
        window.VE_ACTIVATE_HANDLER = go;
        a.showAuthModal('Create your account, then get the Stadium & Arena Guide for $11. Buying it makes you a member.', go, 'signup');
        return;
      }
      if (m === 'points') unlockPoints(jb); else buyNow(jb);
    }
  });
  function unlockPoints(btn) {
    btn.disabled = true; btn.textContent = 'Unlocking...';
    unlockApi('unlock').then(function (d) {
      if (d && d.unlocked) { location.reload(); return; }
      if (d && d.error === 'insufficient_points') { ST.balance = d.balance || 0; route(); return; }
      throw 0;
    }).catch(function () { btn.disabled = false; btn.textContent = ctaLabel(); setStatus('That did not go through, and no points were spent. Try again in a minute.'); });
  }
  function buyNow(btn) {
    btn.disabled = true; btn.textContent = 'Opening checkout...';
    unlockApi('checkout').then(function (d) {
      if (d && d.url) { (window.top || window).location.href = d.url; return; }
      if (d && d.already) { location.reload(); return; }
      throw 0;
    }).catch(function () { btn.disabled = false; btn.textContent = ctaLabel(); setStatus('Checkout did not open. Try again in a minute.'); });
  }

  function load() {
    api({ action: 'list' }).then(function (d) {
      if (d && d.me) ME = d.me;
      VENUES = (d && d.venues) || [];
      ((d && d.points) || []).forEach(function (p) { POINTS[p.kind] = p; });
      if (d && d.limits) LIMITS = d.limits;
      route();
    }).catch(function () { VENUES = []; route(); });
    unlockApi('status').then(function (d) {
      if (d && d.error === 'guide_not_found') ST.published = false;
      else if (d) { ST.cost = d.cost || ST.cost; ST.balance = d.balance || 0; ST.active = d.membership_status === 'active'; }
      route();
    }).catch(function () {});
  }
  function init() {
    document.documentElement.classList.add('dg-fit');
    if (window.VEGuideArt) { var art = VEGuideArt('river', 'square'); if (art) mayaBox.style.backgroundImage = "url('" + art + "')"; }
    var params = new URLSearchParams(location.search);
    if (params.get('guide')) {
      var val = params.get('guide'); params.delete('guide');
      history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash);
      if (val === 'cancelled') setTimeout(function () { setStatus('Checkout was cancelled. Nothing was charged.'); }, 1500);
    }
    route();
    load();
  }
  if (window.VEAuth) init(); else window.addEventListener('load', init);
})();
