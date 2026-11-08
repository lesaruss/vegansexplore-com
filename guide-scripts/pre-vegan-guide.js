/* The Pre-Vegan Guide (playbook ve-pre-vegan-guide, canon canon-ve-pre-vegan-guide v1, locked by Sean 2026-11-08).
 *
 * For people ready to go Vegan who do not know where to start. Copied from the Vegan Dairy Guide (the template gate): the tabs
 * are the tour, Maya stays on the right of every tab with her words in the bubble, Back / N of M / Next under her.
 *
 *   Start here         what the Guide is, the nine phases of 111 Days (titles only), what is free
 *   111 Days           the phase map; Day 1 in full (the free example); Days 2 to 7 for members (ve_guides.content_html)
 *   Is it Vegan?       the barcode scan (VEScan, then ve-products lookup), free
 *   Near me            100% Vegan places near the phone (the ve-search engine), free
 *   Swap of the week   one everyday swap, a new one each week, free
 *   Get in             visitors and accounts that have not finished it: the Pre-Vegan survey (Explorer + 5, 250 points)
 *
 * Access: a door Guide (ve_guides.door, survey_slug pre-vegan). ve-guide-unlock ?action=open returns the members-only text once
 * the member has finished the Pre-Vegan survey (via 'door'). That text is never in this repo; Vercel serves everything here.
 * The course itself (enrolling, the daily drop at 5 AM, challenges and points) runs on the course engine (course_* tables,
 * migration 20261108_course_engine.sql); the page wires to it in step 3 with the daily drop. Until then members read Days 1 to 7.
 * Maya's lines are text drafts until Sean approves them; then they are recorded and AUDIO gets the files.
 */
(function () {
  var SLUG = 'pre-vegan-guide', SURVEY = 'pre-vegan';
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var UNLOCK_URL = SB + '/functions/v1/ve-guide-unlock';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var SEARCH_FN = SB + '/functions/v1/ve-search', PRODUCTS_FN = SB + '/functions/v1/ve-products';

  // The tabs, in tour order, and Maya's words on each (text drafts). `say` is for a visitor, `sayMember` for a member.
  var TABS = [
    { k: 'overview', label: 'Start here',
      say: 'Hi, I\'m Maya. If you\'re ready to go Vegan and don\'t know where to start, you\'re in the right place. One small step a day, for 111 days, and I\'ll be with you for every one.',
      sayMember: 'Welcome in. Your 111 days are right here. One small thing a day, no catching up, no falling behind. Press Next and I\'ll show you around.' },
    { k: 'days', label: '111 Days',
      say: 'Nine phases, from your first swap to staying Vegan for good. Day 1 is free, so read it now. The rest open one day at a time once you\'re in.',
      sayMember: 'Here\'s your first week. Each day brings one thing to learn and one thing to do. A new day opens at 5 in the morning, once you\'ve opened the day before.' },
    { k: 'scan', label: 'Is it Vegan?',
      say: 'Not sure about something in the aisle? Scan the barcode and I\'ll tell you what the package says. Five words do most of the hiding: whey, casein, gelatin, carmine and honey.' },
    { k: 'near', label: 'Near me',
      say: 'Vegan food is closer than you think. Let your phone share where you are and I\'ll show you the 100% Vegan places nearby.' },
    { k: 'swap', label: 'Swap of the week',
      say: 'One easy swap a week. You don\'t have to change everything at once. Start with this one.' },
    { k: 'join', label: 'Get in', guest: true,
      say: 'Getting in is free. Answer a short survey about you and where you\'re starting from, and the whole Guide opens, plus 250 points to start.' }
  ];
  var AUDIO = {}; // tab -> mp3, once Sean approves Maya's lines and they are recorded

  var main = document.getElementById('dgMain');
  var menuEl = document.getElementById('dgMenu'), menuSel = document.getElementById('dgMenuSelect');
  var PUB = JSON.parse(document.getElementById('dg-public').textContent);
  var access = 'checking';   // checking | guest | pending | member
  var MEM = null;            // members-only payload: { days: [...] }
  var curTab = 'overview';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function auth() { return window.VEAuth || null; }
  function member() { return access === 'member'; }
  function tabs() { return TABS.filter(function (t) { return !(t.guest && member()); }); }
  function tab(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i].k === k) return TABS[i]; return TABS[0]; }
  function href(k) { return '#/' + (k === 'overview' ? '' : k); }
  function surveyHref() { return '/survey?s=' + SURVEY; }
  var LOCK_SVG = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';

  function drawMenu(cur) {
    menuEl.innerHTML = tabs().map(function (t) {
      return '<a href="' + href(t.k) + '"' + (t.k === cur ? ' aria-current="page"' : '') + (t.guest ? ' class="dg-join-tab"' : '') + '>' + esc(t.label) + '</a>';
    }).join('');
    menuSel.innerHTML = tabs().map(function (t) { return '<option value="' + t.k + '"' + (t.k === cur ? ' selected' : '') + '>' + esc(t.label) + '</option>'; }).join('');
  }
  menuSel.addEventListener('change', function () { location.hash = href(menuSel.value); });

  function head(k, h, lede, right) {
    return '<div class="dg-head"><div><div class="dg-k">' + esc(k) + '</div><h2 class="dg-h1">' + h + '</h2></div>' + (right || '') + '</div>' + (lede ? '<p class="dg-lede">' + lede + '</p>' : '');
  }
  function crumb(parts) {
    return '<div class="dg-crumb"><a href="#/">Pre-Vegan Guide</a>' + parts.map(function (p) { return ' &rsaquo; ' + (p[1] ? '<a href="' + p[1] + '">' + esc(p[0]) + '</a>' : esc(p[0])); }).join('') + '</div>';
  }
  function surveyBtn(label) { return '<a class="dg-btn" href="' + surveyHref() + '" data-survey>' + esc(label || 'Take the survey, free') + '</a>'; }
  function gateCard(title, text) {
    return '<div class="dg-card" style="border-color:var(--gm);background:var(--gl)"><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p><div class="dg-btns">' + surveyBtn() +
      (access === 'guest' || access === 'checking' ? '<a href="#" data-signin style="font-size:12.5px;font-weight:800;color:var(--g)">Member? Sign in</a>' : '') + '</div></div>';
  }
  function phaseMap() {
    return '<div class="pv-phases">' + PUB.phases.map(function (p) {
      return '<div class="pv-phase"><small>Phase ' + p[0] + '</small><b>' + esc(p[1]) + '</b><span>Days ' + p[2] + ' to ' + p[3] + '</span></div>';
    }).join('') + '</div>';
  }
  function dayCard(d, free) {
    return '<div class="pv-day"><div class="dg-k">Day ' + d.day + (free ? '<span class="pv-free">Free</span>' : '') + '</div><h3>' + esc(d.title) + '</h3>' +
      '<p class="pv-say">' + esc(d.maya) + '</p><dl>' + (d.learn ? '<dt>Learn</dt><dd>' + esc(d.learn) + '</dd>' : '') + '<dt>Do</dt><dd>' + esc(d.do) + '</dd>' +
      (d.points ? '<dt>Points</dt><dd>' + esc(d.points) + '</dd>' : '') + '</dl></div>';
  }

  // ---------- views ----------
  function viewOverview() {
    var tiles = [
      ['days', '111 Days', 'One small thing a day, in nine phases, from your first swap to staying Vegan for good. Day 1 is free.'],
      ['scan', 'Is it Vegan?', 'Scan a barcode in the aisle and see what the package says. Free.'],
      ['near', 'Near me', 'The 100% Vegan places close to you. Free.'],
      ['swap', 'Swap of the week', 'One easy swap, a new one every week. Free.']
    ];
    main.innerHTML = head('For people ready to start', 'Going Vegan, one day at a time',
      'You don\'t need to change everything at once. Maya brings you one thing a day for 111 days: something to learn and something to do, with points as you go. ' +
      'You can\'t fall behind and you can\'t rush ahead; you show up, and the next day opens.') +
      '<div class="dg-tiles">' + tiles.map(function (t) {
        return '<a class="dg-tile" href="' + href(t[0]) + '"><div><b>' + esc(t[1]) + '</b><span>' + esc(t[2]) + '</span></div></a>';
      }).join('') + '</div>' +
      '<h3 style="margin:26px 0 0">111 Days to Going and Staying Vegan</h3>' + phaseMap() +
      '<p class="dg-lede" style="margin-top:10px">Day 111 is yours to call. You choose: "I\'m Vegan", or "Still Pre-Vegan, still going". Both are honored, and we never hand anyone a Vegan badge.</p>' +
      (member() ? '<div class="dg-start"><a class="dg-btn" href="#/days">See your first week</a></div>'
        : '<div class="dg-start">' + surveyBtn('Get in free with a short survey') + '</div>');
  }

  function viewDays() {
    var weekRows = PUB.week1.map(function (t, i) {
      var open = i === 0 || member();
      return '<a class="pv-drow" href="#/days/' + (i + 1) + '"><i>Day ' + (i + 1) + '</i><b>' + esc(t) + '</b>' +
        (i === 0 ? '<span class="pv-free">Free</span>' : open ? '' : '<small>' + LOCK_SVG + ' Members</small>') + '</a>';
    }).join('');
    main.innerHTML = head('111 Days to Going and Staying Vegan', 'The nine phases',
      'Each phase ends on a capstone day that opens the next. Unlocks along the way: the Pre-Vegan badge on Day 7, the full Swap Library on Day 14, and the Library of all 111 days at the end.') +
      phaseMap() + '<h3 style="margin:22px 0 0">Week one: Start here</h3><div class="pv-days">' + weekRows + '</div>' +
      (member() ? '<div class="dg-note" style="margin-top:14px">Your daily drop starts soon: once it opens, Day 1 begins the moment you press Start, and a new day opens each morning after you open the one before.</div>'
        : '<div style="margin-top:16px">' + gateCard('Days 2 to 111 come with the Guide', 'Getting in is free: a short survey about you and where you are starting from. Finishing it makes you a member, with 250 points.') + '</div>');
  }
  function viewDay(n) {
    n = parseInt(n, 10);
    if (!(n >= 1 && n <= 7)) { location.hash = '#/days'; return; }
    var d = n === 1 ? PUB.day1 : (MEM && MEM.days || []).filter(function (x) { return x.day === n; })[0];
    var title = PUB.week1[n - 1];
    var nav = '<div class="dg-btns" style="margin-top:14px">' + (n > 1 ? '<a class="dg-btn dg-ghost" href="#/days/' + (n - 1) + '">Day ' + (n - 1) + '</a>' : '') +
      (n < 7 ? '<a class="dg-btn dg-ghost" href="#/days/' + (n + 1) + '">Day ' + (n + 1) + '</a>' : '') + '<a class="dg-btn dg-ghost" href="#/days">All phases</a></div>';
    if (d) { main.innerHTML = crumb([['111 Days', '#/days'], ['Day ' + n, '']]) + dayCard(d, n === 1) + nav; return; }
    main.innerHTML = crumb([['111 Days', '#/days'], ['Day ' + n, '']]) +
      '<div class="pv-day"><div class="dg-k">Day ' + n + '</div><h3>' + esc(title) + '</h3><p class="dg-lede">' + LOCK_SVG + ' This day comes with the Guide.</p></div>' +
      gateCard('Get in free', 'Answer the short Pre-Vegan survey and every day opens to you, one at a time.') + nav;
  }

  // Is it Vegan?: VEScan reads the barcode (camera, or type the numbers); ve-products says what it is.
  var SCANS = {};
  function viewScan(code) {
    if (!code) {
      main.innerHTML = head('Is it Vegan?', 'Scan anything in the aisle',
        'Point your phone at the barcode. If it is in our Vegan registry we say so; if not, you see what the package says, as Open Food Facts lists it. No camera? Type the numbers under the barcode.') +
        '<p><button type="button" class="dg-btn" id="pvScanGo">Scan a barcode</button></p>' +
        '<div class="dg-card"><h3>Five words do most of the hiding</h3><p><b>Whey</b> and <b>casein</b> come from milk, <b>gelatin</b> from animal bones and skin, <b>carmine</b> (also called cochineal) is a red color made from insects, and <b>honey</b> comes from bees. Learn those and most labels open up.</p></div>' +
        '<p style="font-size:12px;color:var(--ink55);margin-top:12px">Nothing is recorded when you scan; the picture never leaves your phone.</p>';
      var b = document.getElementById('pvScanGo');
      if (b) b.addEventListener('click', function () { if (window.VEScan) VEScan.open({ title: 'Scan a product', onCode: function (c) { location.hash = '#/scan/' + c; } }); });
      return;
    }
    if (!/^\d{6,14}$/.test(code)) { location.hash = '#/scan'; return; }
    main.innerHTML = crumb([['Is it Vegan?', '#/scan'], [code, '']]) + '<div class="dg-loading">Looking it up...</div>';
    var h = { 'Content-Type': 'application/json', apikey: ANON_KEY }, t = auth() && auth().getToken && auth().getToken();
    if (t) h.Authorization = 'Bearer ' + t;
    var go = SCANS[code] ? Promise.resolve(SCANS[code]) : fetch(PRODUCTS_FN, { method: 'POST', headers: h, body: JSON.stringify({ action: 'lookup', code: code }) }).then(function (r) { return r.json(); }).then(function (d) { SCANS[code] = d; return d; });
    go.then(function (d) {
      if (location.hash !== '#/scan/' + code) return;
      var again = '<div class="dg-btns" style="margin-top:14px"><button type="button" class="dg-btn" id="pvScanGo">Scan another</button><a class="dg-btn dg-ghost" href="/guides/supermarket-guide#/scan/' + esc(code) + '">More about it</a></div>';
      var body;
      if (!d || d.error) body = '<p class="dg-empty">' + esc((d && d.message) || 'That did not load. Try again.') + '</p>';
      else if (d.found && d.product) {
        var p = d.product;
        body = '<div class="pv-day"><div class="dg-k">In our Vegan registry</div><h3>' + esc(p.name || 'Vegan product') + '</h3><p class="pv-say">Vegan. This one is in our registry of Vegan products' + (d.brand && d.brand.name ? ', by ' + esc(d.brand.name) : '') + '.</p></div>';
      } else {
        var o = d.off || {}, v = o.vegan;
        var say = v === 'yes' ? 'The package says Vegan.' : v === 'no' ? 'The package says it is not Vegan.' : v === 'maybe' ? 'It may not be Vegan. Check the ingredients for the five words below.' : 'The package does not say. That does not mean it is not; check the ingredients.';
        body = '<div class="pv-day"><div class="dg-k">Not in our registry yet</div><h3>' + esc(o.name || 'Unknown item') + '</h3>' + (o.brand ? '<div class="dg-k" style="margin:-4px 0 8px">' + esc(o.brand) + '</div>' : '') + '<p class="pv-say">' + esc(say) + '</p>' +
          '<p style="font-size:12px;color:var(--ink55);margin:10px 0 0">As Open Food Facts lists it from the package (CC BY-SA).</p></div>';
      }
      main.innerHTML = crumb([['Is it Vegan?', '#/scan'], [code, '']]) + body + again;
      var b = document.getElementById('pvScanGo');
      if (b) b.addEventListener('click', function () { if (window.VEScan) VEScan.open({ title: 'Scan a product', onCode: function (c) { location.hash = '#/scan/' + c; } }); });
    }).catch(function () { main.innerHTML = '<p class="dg-empty">That did not load. Refresh to try again.</p>'; });
  }

  // Near me: the universal search engine with the phone's place, 100% Vegan first.
  var NEAR = null;
  function placeRow(r) {
    var mi = r.km != null ? (r.km * 0.621371) : null;
    return '<a class="pv-place" href="/directory/' + encodeURIComponent(r.slug) + '">' + (r.logo_url ? '<img src="' + esc(r.logo_url) + '" alt="" loading="lazy" decoding="async">' : '<span class="pv-ltr">' + esc((r.name || '?').charAt(0)) + '</span>') +
      '<div><b>' + esc(r.name) + '</b><span>' + esc([r.category, r.city].filter(Boolean).join(' · ')) + (mi != null ? ' · about ' + (mi < 10 ? mi.toFixed(1) : Math.round(mi)) + ' miles' : '') +
      (r.vegan_status === 'fully_vegan' ? ' · 100% Vegan' : '') + '</span></div></a>';
  }
  function viewNear() {
    main.innerHTML = head('Near me', 'Vegan food near you',
      'Share where you are and see the 100% Vegan places close by, the way the Directory lists them. Your location is used for this search only.') +
      '<p><button type="button" class="dg-btn" id="pvNear">' + (NEAR ? 'Look again' : 'Show places near me') + '</button></p><div id="pvNearOut">' +
      (NEAR ? (NEAR.length ? '<div class="pv-list">' + NEAR.map(placeRow).join('') + '</div>' : '<p class="dg-empty">Nothing close yet. The Directory grows city by city.</p>') : '') + '</div>' +
      '<p style="margin-top:14px"><a href="/directory?tab=food" style="font-weight:800;color:var(--g)">Open the whole Directory</a></p>';
    var b = document.getElementById('pvNear');
    b.addEventListener('click', function () {
      var out = document.getElementById('pvNearOut');
      if (!navigator.geolocation) { out.innerHTML = '<p class="dg-empty">This browser cannot share your location.</p>'; return; }
      b.disabled = true; b.textContent = 'Finding you...';
      navigator.geolocation.getCurrentPosition(function (p) {
        fetch(SEARCH_FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q: '100% vegan restaurants near me', limit: 24, content_limit: 0, lat: p.coords.latitude, lng: p.coords.longitude }) })
          .then(function (r) { return r.json(); }).then(function (d) {
            var list = (d && d.results) || [];
            list.sort(function (a, c) { return (a.vegan_status === 'fully_vegan' ? 0 : 1) - (c.vegan_status === 'fully_vegan' ? 0 : 1) || (a.km || 999) - (c.km || 999); });
            NEAR = list.slice(0, 12); if (curTab === 'near') viewNear();
          }).catch(function () { b.disabled = false; b.textContent = 'Show places near me'; out.innerHTML = '<p class="dg-empty">That did not load. Try again.</p>'; });
      }, function () { b.disabled = false; b.textContent = 'Show places near me'; out.innerHTML = '<p class="dg-empty">We could not get your location. Allow it for this page and try again.</p>'; },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
    });
  }

  // Swap of the week: a new one each Monday (Eastern), cycling through the list.
  function weekIndex() {
    var now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
    var start = new Date(2026, 0, 5); // a Monday
    return Math.floor((now - start) / 6048e5);
  }
  function viewSwap() {
    var list = PUB.swaps, i = ((weekIndex() % list.length) + list.length) % list.length, s = list[i];
    main.innerHTML = head('Swap of the week', esc(s.swap) + ' &rarr; ' + esc(s.for), 'One easy swap a week. Try it for seven days and see how it sits.') +
      '<div class="pv-day"><div class="dg-k">This week<span class="pv-free">Free</span></div><h3>Instead of ' + esc(s.swap.toLowerCase()) + ': ' + esc(s.for.toLowerCase()) + '</h3><p class="pv-say">' + esc(s.how) + '</p></div>' +
      '<p class="dg-lede">The full Swap Library opens on Day 14 of your 111 days. For dairy, the <a href="/guides/vegan-dairy-guide" style="color:var(--g);font-weight:800">Vegan Dairy Guide</a> has every swap.</p>';
  }

  function viewJoin() {
    var pending = access === 'pending';
    main.innerHTML = head('Get in', 'Free with a short survey',
      'Tell us a little about you and where you are starting from. Finishing the survey makes you a Vegans Explore member, opens the whole Guide and its 111 days, and gives you 250 points.') +
      '<div class="dg-card"><h3>What you get</h3><ul style="margin:6px 0 0;padding-left:18px;line-height:1.7">' +
      '<li>111 Days to Going and Staying Vegan, one day at a time</li><li>Challenges with points, and unlocks along the way</li>' +
      '<li>The full Swap Library from Day 14, and the Library of all 111 days at the end</li><li>Everything a member can do on Vegans Explore</li></ul></div>' +
      '<div class="dg-btns" style="margin-top:14px">' + surveyBtn(pending ? 'Finish the Pre-Vegan survey' : 'Take the survey, free') +
      (pending ? '' : '<a href="#" data-signin style="font-size:12.5px;font-weight:800;color:var(--g)">Member? Sign in</a>') + '</div>' +
      (pending ? '<p class="dg-lede" style="margin-top:10px">Already took the Explorer survey? Those answers carry over, so only the new questions are left.</p>' : '') +
      '<p style="font-size:12px;color:var(--ink55);margin-top:10px">Founding Membership closes at midnight Eastern on January 1, 2027. Join before then and Founding Member stays on your profile for good.</p>';
  }

  // ---------- Maya ----------
  var mayaBox = document.getElementById('dgMaya'), bubble = document.getElementById('dgBubble'), tourEl = document.getElementById('dgTour');
  var tourM = document.getElementById('dgTourM'), foldBtn = document.getElementById('dgFold'), railEl = document.getElementById('dgRail');
  function setFold(folded) {
    railEl.classList.toggle('dg-folded', folded);
    foldBtn.textContent = folded ? 'Show Maya' : 'Hide Maya'; foldBtn.setAttribute('aria-expanded', String(!folded));
    try { sessionStorage.setItem('pv_maya_folded', folded ? '1' : ''); } catch (e) {}
  }
  foldBtn.addEventListener('click', function () { setFold(!railEl.classList.contains('dg-folded')); });
  try { if (sessionStorage.getItem('pv_maya_folded')) setFold(true); } catch (e) {}
  function drawMaya() {
    var t = tab(curTab), list = tabs(), i = 0;
    list.forEach(function (x, n) { if (x.k === curTab) i = n; });
    bubble.textContent = member() && t.sayMember ? t.sayMember : t.say;
    tourEl.innerHTML = tourM.innerHTML = '<a class="dg-tnav" href="' + href(list[Math.max(0, i - 1)].k) + '"' + (i ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Back</a><span>' + (i + 1) + ' of ' + list.length + '</span>' +
      '<a class="dg-tnav next" href="' + href(list[Math.min(list.length - 1, i + 1)].k) + '"' + (i < list.length - 1 ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Next</a>';
  }

  // ---------- router ----------
  function route() {
    var parts = (location.hash || '').replace(/^#\/?/, '').split('/');
    var view = parts[0] || 'overview', sub = parts.slice(1).join('/');
    var known = { overview: 1, days: 1, scan: 1, near: 1, swap: 1, join: 1 };
    if (!known[view]) view = 'overview';
    if (view === 'join' && member()) view = 'overview';
    document.body.classList.toggle('dg-member', member());
    drawMenu(view);
    ({ overview: viewOverview, days: function () { sub ? viewDay(sub) : viewDays(); }, scan: function () { viewScan(sub); }, near: viewNear, swap: viewSwap, join: viewJoin })[view]();
    curTab = view;
    drawMaya();
    main.scrollTop = 0; if (!document.documentElement.classList.contains('dg-fit') || window.innerWidth <= 900) window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  // ---------- access ----------
  function api(action, tok) {
    return fetch(UNLOCK_URL + '?action=' + action, { method: 'POST', headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: SLUG, token: tok || undefined }) })
      .then(function (r) { return r.json(); });
  }
  function takeHtml(html) {
    var box = document.createElement('div'); box.innerHTML = html;
    var data = box.querySelector('#pv-data');
    try { MEM = data ? JSON.parse(data.textContent) : { days: [] }; } catch (e) { MEM = { days: [] }; }
  }
  document.addEventListener('click', function (e) {
    var a = auth();
    if (e.target.closest('[data-signin]')) {
      e.preventDefault();
      if (a) a.showAuthModal('Sign in and the Pre-Vegan Guide opens once you have taken its survey.', function () { location.reload(); }, 'login');
      return;
    }
    // On the way to the survey, remember where to come back to (survey.html's pageBack).
    if (e.target.closest('[data-survey]')) { try { sessionStorage.setItem('ve_after_survey', '/guides/pre-vegan-guide#/days'); } catch (x) {} }
  });

  function init() {
    document.documentElement.classList.add('dg-fit');
    if (window.VEGuideArt) { var art = VEGuideArt('maya', 'square'); if (art) mayaBox.style.backgroundImage = "url('" + art + "')"; }
    var a = auth();
    var viewAs = a && a.getViewAs ? a.getViewAs() : null;
    var tok = a && a.isLoggedIn() && !viewAs ? a.getToken() : null;
    if (!tok) { access = 'guest'; route(); return; }
    route();
    api('open', tok).then(function (d) {
      if (d && d.unlocked) { takeHtml(d.html || ''); access = 'member'; }
      else access = 'pending';
      route();
    }).catch(function () { access = 'pending'; route(); });
  }
  if (window.VEAuth) init(); else window.addEventListener('load', init);
})();
