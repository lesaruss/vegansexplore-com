/* The Vegan Theme Park Guide (LOCKED by Sean 2026-11-04, playbook ve-theme-park-guide, canon canon-ve-theme-park-guide).
 *
 * Copied from the Stadium & Arena Guide (guide-scripts/stadium-arena-guide.js, the venue Guides' engine ve-venues): a park is a
 * venue of kind theme_park, each restaurant a spot with a pin (ve_venue_spots.latitude, longitude), each dish an item labelled Vegan,
 * Vegan on request or Ask before you order with a source and a last-confirmed date. The tabs are the tour, River stays on the right
 * of every tab, the content sits on the left. The address bar carries the view (#/venues, #/venue/magic-kingdom,
 * #/venue/magic-kingdom/report/confirm/<item>).
 *
 *   Overview            what the Guide is, how to use it, the parks
 *   Parks               every park we cover, then one park: our own map with a you-are-here dot and the distance to each
 *                       restaurant (public/ve-park-map.js), and its restaurants with their Vegan items. Magic Kingdom is free.
 *   Help keep it right  how members keep it accurate from inside the park, the points, and their own reports
 *   My list             Guide owners: the parks and items they saved
 *   Get access          visitors: $11 or 1,100 points, like every Guide
 *
 * Vegan items only, never the whole menu, with a link to the park's own menu when we hold one. No park logos or characters, no
 * generated pictures of named dishes, no crawler on park sites. Park names are plain text with a not-affiliated line. The phone's
 * location drives the dot and the distances in this page only; a report checks it separately on the server (ve-venues `report`).
 * Who sees what is decided in ve-venues: a park's restaurants and items go to the Guide's owners, super admins and anyone on the
 * free park. Buying goes through ve-guide-unlock with slug theme-park-guide; until that row is published the offer reads Coming soon.
 * River's words are drafts for Sean; nothing is recorded (CLIPS stays empty). No counts in anything River says.
 */
(function () {
  var SLUG = 'theme-park-guide', FREE = 'magic-kingdom';
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var API = SB + '/functions/v1/ve-venues';
  var COOK_URL = SB + '/functions/v1/ve-cookbook';
  var UNLOCK_URL = SB + '/functions/v1/ve-guide-unlock';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';

  // The tabs, in tour order, and what River says on each (drafts for Sean's approval, 2026-10-28).
  // The tabs, in tour order, and what River says on each (drafts for Sean's approval, 2026-11-04).
  var TABS = [
    { k: 'overview', label: 'Overview', say: 'Hey, I\'m River. Pick a park and I\'ll show you where the Vegan food is. Turn on your location and I\'ll tell you how far each restaurant is. Magic Kingdom is free to try.',
      sayMember: 'It\'s all yours. Save the restaurants you want to try, and if something changed, tell us and earn points.' },
    { k: 'venues', label: 'Parks', say: 'Open a park to see every restaurant on our map. Turn on your location and I\'ll show you the closest ones. Magic Kingdom is free.',
      sayMember: 'Open your park before you go. Allow your location and the closest restaurants come first.' },
    { k: 'report', label: 'Help keep it right', say: 'Members keep this Guide right from inside the park. Snap a photo of the item and the sign, tell us what you found, and earn points.',
      sayMember: 'In the park? Tell us what is still there or what changed, with a photo. Accepted reports earn points.' },
    { k: 'mylist', label: 'My list', mine: 1, say: 'Everything you save lands here: the parks you go to and the items you want to find.' },
    { k: 'join', label: 'Get access', guest: 1, say: 'The Vegan Theme Park Guide is eleven dollars, or 1,100 points, and it\'s yours to keep. Come join us!' }
  ];
  // River on camera, once his lines are approved and recorded (el-media voice, Wan 2.7, assemble_r5.py).
  var CLIPS = {}, CLIPS_M = {};

  var KIND = { theme_park: 'Theme park' };
  var VEGAN = { vegan: ['Vegan', 'vegan'], on_request: ['Vegan on request', 'ask'], ask: ['Ask before you order', 'ask'] };
  // What a member can send about an item (Sean, 2026-10-29: "maybe it's update... maybe it's comment... leave a photo, leave a
  // comment. And each thing could have its own amount of points"). Update is two kinds underneath: it changed, or it is gone.
  var REPORT = {
    confirm: ['Still here', 'It is still sold, as written here.', 'Still here'],
    wrong: ['Update', 'The name, the price, where it is, or whether it is Vegan.', 'Something changed'],
    gone: ['Update', 'This restaurant or item is not there anymore.', 'Not there anymore'],
    comment: ['Comment', 'Tell other fans what you thought of it. A photo makes it even better.', 'Comment'],
    missing: ['Add something missing', 'A Vegan item or a restaurant that is not in the Guide yet. A photo of the item and one of the sign earn the most.', 'Something missing'],
    shop_confirm: ['Still on the shelf', 'It is still sold here.', 'Still on the shelf']
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
    return fetch(API, { method: 'POST', headers: h, body: JSON.stringify(Object.assign({ guide: SLUG }, body)) }).then(function (r) { return r.json(); });
  }
  function unlockApi(action) {
    return fetch(UNLOCK_URL + '?action=' + action, { method: 'POST', headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, token: token() || undefined, return_url: action === 'checkout' ? location.origin + location.pathname : undefined }) })
      .then(function (r) { return r.json(); });
  }
  function fmtDate(iso) { try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch (e) { return ''; } }
  function monthOf(d) { if (!d) return ''; var p = String(d).split('-'); if (p.length < 2) return p[0]; var dt = new Date(+p[0], +p[1] - 1, 1); return isNaN(dt) ? '' : dt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); }
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
    return '<div class="dg-crumb"><a href="#/">Vegan Theme Park Guide</a>' + parts.map(function (p) { return ' &rsaquo; ' + (p[1] ? '<a href="' + p[1] + '">' + esc(p[0]) + '</a>' : esc(p[0])); }).join('') + '</div>';
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
    if (m === 'soon') return 'The full Guide opens soon. Magic Kingdom is open to everyone now.';
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
  // ---------- Overview and the parks ----------
  ICON.theme_park = '<svg width="34" height="34" viewBox="0 0 24 24" ' + S + '><circle cx="12" cy="10" r="6"/><path d="M12 4v12M6 10h12M7.8 5.8l8.4 8.4M16.2 5.8l-8.4 8.4"/><path d="M8 22l4-6 4 6"/></svg>';
  var OV_ICON = {
    pick: '<svg width="26" height="26" viewBox="0 0 24 24" ' + S + '><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    go: '<svg width="26" height="26" viewBox="0 0 24 24" ' + S + '><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>',
    save: '<svg width="26" height="26" viewBox="0 0 24 24" ' + S + '><path d="M6 3h12v18l-6-4-6 4z"/></svg>'
  };
  var NOTE = 'The Vegan Theme Park Guide is not affiliated with, endorsed by or sponsored by any park or resort. Park names are used only to say where a restaurant is.';
  function viewOverview() {
    var own = owner();
    var cta = own ? '<div class="dg-btns"><a class="dg-btn" href="#/venues">Choose your park</a><a class="dg-btn dg-ghost" href="#/mylist">My list</a></div>'
      : '<div class="dg-btns"><a class="dg-btn" href="#/join">Get the Guide: $11 or ' + pts(ST.cost) + ' points</a><a class="dg-btn dg-ghost" href="#/venue/' + FREE + '">Try Magic Kingdom free</a></div>';
    var parks = !VENUES ? '<div class="dg-loading">Loading...</div>' : VENUES.length ? '<div class="sa-vgrid ov-new">' + VENUES.map(venueCard).join('') + '</div>' : '<p class="dg-empty">The first park is on its way.</p>';
    var steps = [['pick', 'Pick your park', 'Every restaurant and counter we know of is pinned on our own map.'], ['go', 'Turn on your location', 'See a dot for where you are and how far each restaurant is, in feet and miles.'], ['save', 'Save it for later', 'Save the restaurants you want to try, and tell us what you find to earn points.']];
    main.innerHTML =
      '<section class="ov-hero"><div class="dg-k">The Vegan Theme Park Guide</div><h2 class="dg-h1">Find the Vegan food inside the park.</h2><p class="dg-lede">Every restaurant and counter, pinned on our own map. Turn on your location and see how far each one is. Members confirm what is Vegan, with a photo, and the Guide shows when it was last checked.</p>' + cta + '</section>' +
      '<section class="ov-sec"><div class="dg-k">How to use it</div><h3 class="ov-h">Three steps, wherever you are in the park</h3><div class="ov-steps">' +
        steps.map(function (s, i) { return '<div class="ov-step"><span class="ov-ic">' + OV_ICON[s[0]] + '</span><b><span class="ov-n">' + (i + 1) + '</span>' + esc(s[1]) + '</b><p>' + esc(s[2]) + '</p></div>'; }).join('') + '</div></section>' +
      (own ? '' : '<section class="ov-sec ov-join"><div><div class="dg-k">Get access</div><h3 class="ov-h">One Guide for every park</h3><p>Every park we add, the map with your location, My list, and the way to earn points by keeping it right. $11 or ' + pts(ST.cost) + ' points, yours to keep. Magic Kingdom is free to try. Buying a Guide makes you a member of Vegans Explore.</p></div><a class="dg-btn" href="#/join">Get the Guide</a></section>') +
      '<section class="ov-sec ov-built"><div><div class="dg-k">Built with you</div><h3 class="ov-h">The map comes first, the menu follows</h3><p>We started with where every restaurant is. The Vegan items come next, from the park&rsquo;s own published menus and from members who confirm them with a photo. Until an item says a member checked it, ask before you order.</p>' +
        '<ul class="ov-list"><li><b>Still here:</b> it is still sold, as written.</li><li><b>Something changed:</b> a new name, a new spot, or it is gone.</li><li><b>Something missing:</b> a Vegan item that is not in the Guide yet.</li></ul>' +
        '<p class="ov-small">Every item says where it came from and when a member last checked it, so you know what is fresh.</p></div></section>' +
      '<section class="ov-sec"><div class="dg-k">The parks</div><h3 class="ov-h">Where we are</h3>' + parks + '<p class="ov-small"><a href="#/venues">See every park</a></p></section>' +
      '<p class="ov-small" style="margin-top:18px">' + esc(NOTE) + '</p>';
  }

  // A park is its name, its resort and what we know. Park names are plain text; no park logos or characters anywhere.
  function venueCard(v) {
    var locked = !owner() && !v.free;
    var badge = v.free && !owner() ? tagHtml('Free to everyone', 'sa-tag-free') : locked ? tagHtml('Members', 'sa-tag-lock') : '';
    var tags = tagHtml(v.items ? v.items + ' Vegan item' + (v.items === 1 ? '' : 's') + ' listed' : 'Restaurants on the map', v.items ? 'sa-tag-new' : 'sa-tag-stale') +
      (v.last ? tagHtml('Checked ' + fmtDate(v.last), 'sa-tag-fresh') : '');
    return '<a class="sa-vcard" href="#/venue/' + esc(v.slug) + '"><span class="sa-vimg sa-vimg-none">' + ICON.theme_park + (badge ? '<span class="sa-vbadge">' + badge + '</span>' : '') + '</span><span class="sa-vbody"><h3>' + esc(v.name) + '</h3>' +
      '<span class="sa-vmeta">' + esc(v.resort || 'Theme park') + (v.hub ? ' &middot; ' + esc(hubName(v.hub)) : '') + '</span><span class="sa-vtags">' + tags + '</span></span></a>';
  }
  function viewVenues() {
    if (!VENUES) { main.innerHTML = head('Parks', 'Choose your park', '') + '<div class="dg-loading">Loading the parks...</div>'; return; }
    var list = VENUES.filter(inCity);
    main.innerHTML = head('Parks', 'Choose your park', 'Pick a park to see every restaurant on our map, how far each is from you, and what is Vegan.') +
      cityPicker() + (list.length ? '<div class="sa-vgrid">' + list.map(venueCard).join('') + '</div>' : '<p class="dg-empty">No parks here yet. Magic Kingdom is the first, and more are coming.</p>') +
      '<p class="ov-small" style="margin-top:18px">' + esc(NOTE) + '</p>';
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
    return '<div class="sa-srcs">From ' + s.map(function (x) { return x.url ? '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.label) + (x.date && monthOf(x.date) ? ', ' + esc(monthOf(x.date)) : '') + '</a>' : esc(x.label); }).join(' ') + '</div>';
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
    if (p.with_photo === p.no_photo) return pts(p.with_photo) + ' points';
    if (kind === 'missing') return pts(p.with_photo) + ' points with both photos, ' + pts(p.no_photo) + ' without';
    return pts(p.with_photo) + ' points with a photo, ' + pts(p.no_photo) + ' without';
  }
  // A shop item (one scanned by its barcode) is checked with Still on the shelf; it has no bounty.
  function itemKinds(it) { return it && it.gtin ? ['shop_confirm', 'gone', 'comment'] : ['confirm', 'wrong', 'gone', 'comment']; }
  // ---------- one park: the map with your location, then its restaurants ----------
  // Sean, 2026-11-04: "put pins where the restaurants are... whatever restaurant they're in, they can do the location thing, put where
  // they are on the map and see the distance". The pins are Google's placement of each restaurant, checked by Sean; a restaurant Google
  // could not place sits in the list as Not pinned yet. The phone's location stays in this page (never sent) and drives only the dot and
  // the distances, "about N on foot" (the straight line times about 1.3, not turn by turn).
  var YOU = null, STOP = null, LAND = '', ON = '', CUR = null;
  // The restaurant list (Sean, 2026-11-05: "everything is collapsed. With the voting, so you see them clearly. And it's not the super long
  // scroll... when you click it... it brings it to the top... as you click the other one, it just replaces the one that's at the top...
  // a clear button... that puts it back to one, two, three, four, five"). OPEN is the one restaurant opened, drawn first; SORT is Map order,
  // Most votes or Nearest; Clear puts everything back. Votes are ve-cookbook gvote kind park_spot: counts for everyone, a vote for the
  // Guide's owners (canon-ve-theme-park-guide).
  var CUR_SLUG = '', OPEN = '', SORT = 'num', GV = { counts: {}, mine: {} }, GV_FOR = '', REPAINT = null;
  var HEART = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>';
  function cookApi(body) {
    var t = token(), h = { 'Content-Type': 'application/json' };
    if (t) h.Authorization = 'Bearer ' + t;
    return fetch(COOK_URL, { method: 'POST', headers: h, body: JSON.stringify(Object.assign({ guide: SLUG }, body)) }).then(function (r) { return r.json(); });
  }
  function votesOf(id) { return (GV.counts.park_spot || {})[id] || 0; }
  function votedFor(id) { return (GV.mine.park_spot || []).indexOf(id) >= 0; }
  function loadVotes(slug) {
    if (GV_FOR === slug) return;
    GV_FOR = slug;
    cookApi({ action: 'gvotes' }).then(function (d) { if (d && d.counts) { GV = { counts: d.counts, mine: d.mine || {} }; if (REPAINT) REPAINT(); } }).catch(function () {});
  }
  function repaint() { if (REPAINT) REPAINT(); else route(); }
  function hasPin(s) { return s.lat != null && s.lng != null; }
  function distOf(s) { return YOU && hasPin(s) ? VEParkMap.metres(YOU, s) : null; }
  function standCard(v, s, open) {
    var dm = distOf(s), dist = dm == null ? '' : VEParkMap.walk(dm).text;
    var num = s.num ? '<span class="sa-pinno' + (hasPin(s) ? '' : ' q') + '" aria-label="' + (hasPin(s) ? 'Pin ' + s.num + ' on the map' : 'Number ' + s.num + ', not on the map yet') + '">' + s.num + '</span>' : '';
    var tag = !hasPin(s) ? tagHtml('Not pinned yet', 'sa-tag-ask') : dist ? tagHtml(dist, 'sa-tag-new') : '';
    var body = open ? (s.items.length ? s.items.map(function (it) { return itemRow(v, it); }).join('') :
        '<p class="dg-empty">No Vegan item confirmed here yet. <a href="#/venue/' + esc(v.slug) + '/report/missing" style="color:var(--g);font-weight:800">Tell us what you find</a>, with a photo, and earn points when the team accepts it. Until then, ask before you order.</p>')
      : '<div class="sa-item"><div class="sa-item-b"><div class="dg-skel" style="border:0;padding:0"><i></i><i style="width:70%"></i></div></div></div>';
    var isOpen = OPEN === s.id, voted = votedFor(s.id);
    var vote = '<button type="button" class="dg-vote dg-vote-s' + (voted ? ' on' : '') + '" data-spotvote="' + esc(s.id) + '" aria-pressed="' + voted + '" title="' + (voted ? 'You voted for this' : 'Vote for this') + '">' + HEART + '<b>' + votesOf(s.id) + '</b></button>';
    var tog = '<button type="button" class="sa-tog" data-spot="' + esc(s.id) + '" aria-expanded="' + isOpen + '" aria-controls="sa-sb-' + esc(s.id) + '" aria-label="' + (isOpen ? 'Close ' : 'Open ') + esc(s.name) + '">' + (isOpen ? '&minus;' : '+') + '</button>';
    return '<div class="sa-stand sa-fold' + (isOpen ? ' open' : '') + (ON === s.id ? ' on' : '') + '" id="sa-st-' + esc(s.id) + '"><div class="sa-stand-h" data-spot="' + esc(s.id) + '"><div class="sa-stand-t"><h3>' + num + esc(s.name) + '</h3><span class="sa-where">' + ICON.pin + esc(s.land || s.where || '') + '</span>' + tag +
      '</div><div class="sa-stand-a">' + vote + tog + '</div></div>' +
      (isOpen ? '<div class="sa-stand-b" id="sa-sb-' + esc(s.id) + '">' + (s.note ? '<p class="sa-snote">' + esc(s.note) + '</p>' : '') + body + '</div>' : '') + '</div>';
  }
  function standsOf(v, d) {
    var list = d.spots.filter(function (s) { return !LAND || s.land === LAND; }).slice();
    if (SORT === 'near' && !YOU) SORT = 'num';
    if (SORT === 'near') list.sort(function (a, b) { var x = distOf(a), y = distOf(b); return (x == null ? 1e9 : x) - (y == null ? 1e9 : y); });
    else if (SORT === 'votes') list.sort(function (a, b) { return votesOf(b.id) - votesOf(a.id) || a.num - b.num; });
    else list.sort(function (a, b) { return a.num - b.num; });
    var top = list.filter(function (s) { return s.id === OPEN; });
    if (top.length) list = top.concat(list.filter(function (s) { return s.id !== OPEN; }));
    var opt = function (k, l) { return '<option value="' + k + '"' + (SORT === k ? ' selected' : '') + '>' + l + '</option>'; };
    var bar = '<div class="sa-listbar"><label class="sa-sort"><span>Sort</span><select data-spotsort aria-label="Sort the restaurants">' + opt('num', 'Map order') + opt('votes', 'Most votes') + (YOU ? opt('near', 'Nearest to you') : '') + '</select></label>' +
      '<button type="button" class="sa-mini" data-spotclear' + (OPEN || SORT !== 'num' || LAND ? '' : ' disabled') + '>Clear</button><span class="sa-listnote" id="vpVoteNote" role="status" aria-live="polite"></span></div>';
    return bar + (list.length ? list.map(function (s) { return standCard(v, s, d.open); }).join('') : '<p class="dg-empty">No restaurants listed in this land yet.</p>');
  }
  function viewVenue(slug, rest) {
    var r = (rest || '').split('/');
    if (r[0] === 'report') return viewReport(slug, r[1], r[2]);
    var d = VENUE[slug];
    if (!d) {
      main.innerHTML = crumb([['Parks', '#/venues'], ['...', '']]) + '<div class="dg-loading">Loading the park...</div>';
      api({ action: 'venue', slug: slug }).then(function (x) { VENUE[slug] = x; if (curView().indexOf('venue/' + slug) === 0) route(); }).catch(function () { main.innerHTML = '<p class="dg-empty">That did not load. Refresh to try again.</p>'; });
      return;
    }
    if (d.error) { main.innerHTML = crumb([['Parks', '#/venues']]) + '<p class="dg-empty">We could not find that park.</p>'; return; }
    var v = d.venue; CUR = d;
    if (!YOU) ON = '';
    if (CUR_SLUG !== v.slug) { CUR_SLUG = v.slug; OPEN = ''; SORT = 'num'; LAND = ''; }
    REPAINT = null; loadVotes(v.slug);
    d.spots.forEach(function (s, i) { s.num = i + 1; });
    var lede = esc(v.resort || 'Theme park') + ' &middot; ' + esc(v.city || '') + (v.state ? ', ' + esc(v.state) : '');
    var acts = '<div class="dg-btns">' + saveBtn('venue', v.slug, d.saved) + '<a class="dg-btn dg-ghost" href="#/venue/' + esc(v.slug) + '/report/missing">Add something missing</a>' +
      (v.menu_url ? '<a class="dg-btn dg-ghost" href="' + esc(v.menu_url) + '" target="_blank" rel="noopener">The park\'s full menu</a>' : '') + '</div>';
    var note = '<p class="dg-lede" style="font-size:13px;margin-top:4px">Menus change, so ask at the counter when it matters. Every item says where it came from and when a member last checked it. ' + esc(NOTE) + '</p>';
    main.innerHTML = crumb([['Parks', '#/venues'], [v.name, '']]) + head(v.free && !owner() ? 'Free to everyone' : 'Park', esc(v.name), lede, acts) +
      (d.open && window.VEParkMap && v.lat != null ? parkPanel(v, d, standsOf(v, d) + note) : d.open ? standsOf(v, d) + note
        : gated(standsOf(v, d), v.name + ' is in the full Guide', 'Every restaurant with Vegan food here, how far each is from you, and when a member last checked it.'));
    if (d.open && window.VEParkMap && v.lat != null) { VEParkMap.css(); wirePark(v, d); }
  }
  function parkPanel(v, d, standsHtml) {
    var lands = []; d.spots.forEach(function (s) { if (s.land && lands.indexOf(s.land) < 0) lands.push(s.land); });
    var chips = lands.length > 1 ? '<div class="sa-vtags" id="vpLands" style="margin-top:10px"><button type="button" class="sa-mini" data-land="" aria-pressed="' + !LAND + '">All</button>' +
      lands.map(function (l) { return '<button type="button" class="sa-mini" data-land="' + esc(l) + '" aria-pressed="' + (LAND === l) + '">' + esc(l) + '</button>'; }).join('') + '</div>' : '';
    return '<section class="sa-vgrid2" aria-label="Map of ' + esc(v.name) + '">' +
      '<div class="sa-g-form"><div class="sa-map-h"><div><h2>Where you are</h2><p>Turn on your location to see a dot on the map and how far each restaurant is. It stays on your phone and is not sent or saved.</p></div>' +
      '<div class="sa-seat"><button class="dg-btn" type="button" id="vpLoc">Show where I am</button></div></div>' + chips + '<p class="sa-snote" id="vpAcc" role="status" aria-live="polite"></p></div>' +
      '<div class="sa-g-map"><div class="sa-map-box" id="saMapBox"></div><div class="sa-map-foot"><button type="button" class="sa-mini" id="saZoom" aria-pressed="false">Bigger map</button><span>' + (v.layout && v.layout.base ? 'Our own drawing of the park from OpenStreetMap, with each restaurant at its coordinates. Not an official park map. ' : 'Our own drawing, from each restaurant\'s coordinates. ') + 'Distances are the straight line times about 1.3, not turn by turn. Accuracy drops under trees and indoors.</span></div></div>' +
      '<div class="sa-g-dirs" id="saDirs" aria-live="polite"></div>' +
      '<div class="sa-g-stands" id="vpStands">' + standsHtml + '</div></section>';
  }
  function wirePark(v, d) {
    var box = document.getElementById('saMapBox'), dirs = document.getElementById('saDirs'), acc = document.getElementById('vpAcc'), btn = document.getElementById('vpLoc'), stands = document.getElementById('vpStands');
    var noteHtml = stands.querySelector('p.dg-lede') ? stands.querySelector('p.dg-lede').outerHTML : '';
    var pins = d.spots.filter(hasPin).map(function (s) { return { n: s.num, id: s.id, name: s.name, lat: s.lat, lng: s.lng, land: s.land }; });
    function paint() {
      box.innerHTML = VEParkMap.svg(pins, { you: YOU, on: ON, title: 'Map of ' + v.name, base: v.layout && v.layout.base });
      stands.innerHTML = standsOf(v, d) + noteHtml;
      var near = YOU ? d.spots.filter(function (s) { return hasPin(s) && (!LAND || s.land === LAND); }).sort(function (a, b) { return distOf(a) - distOf(b); }).slice(0, 3) : [];
      dirs.innerHTML = near.length ? '<div class="sa-lost"><b>Closest to you:</b><ol class="sa-dirs">' + near.map(function (s) {
        return '<li><a class="sa-dir-go" href="#" data-focus="' + esc(s.id) + '"><span class="sa-pinno">' + s.num + '</span><span><b>' + esc(s.name) + '</b> <span class="sa-dir-meta">' + esc(VEParkMap.walk(distOf(s)).text) + (s.land ? ' &middot; ' + esc(s.land) : '') + '</span></span></a></li>'; }).join('') + '</ol></div>' : '';
      if (YOU) {
        var far = VEParkMap.metres(YOU, { lat: v.lat, lng: v.lng });
        var ft = Math.round((YOU.acc || 0) * 3.28084);
        acc.textContent = far > 2500 ? 'You look to be about ' + (far / 1609.344).toFixed(0) + ' miles from ' + v.name + '. The distances will make sense once you are inside.'
          : 'Your location is accurate to about ' + ft + ' ft.' + (YOU.acc > 50 ? ' That is rough, so the distances are too. Step out from under cover for a better fix.' : '');
      }
    }
    function focus(id) {
      ON = id; OPEN = id; paint();
      var el = document.getElementById('sa-st-' + id); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.classList.add('on'); }
    }
    REPAINT = paint;
    paint();
    box.addEventListener('click', function (e) { var p = e.target.closest('.vvm-pin'); if (p) focus(p.getAttribute('data-id')); });
    box.addEventListener('keydown', function (e) { var p = e.target.closest('.vvm-pin'); if (p && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); focus(p.getAttribute('data-id')); } });
    dirs.addEventListener('click', function (e) { var a = e.target.closest('[data-focus]'); if (a) { e.preventDefault(); focus(a.getAttribute('data-focus')); } });
    var lp = document.getElementById('vpLands');
    if (lp) lp.addEventListener('click', function (e) { var b = e.target.closest('[data-land]'); if (!b) return; LAND = b.getAttribute('data-land');
      [].forEach.call(lp.querySelectorAll('[data-land]'), function (x) { x.setAttribute('aria-pressed', String(x === b)); }); paint(); });
    document.getElementById('saZoom').addEventListener('click', function () { var on = box.classList.toggle('zoom'); this.setAttribute('aria-pressed', String(on)); this.textContent = on ? 'Smaller map' : 'Bigger map'; });
    function stopWatch() { if (STOP) { STOP(); STOP = null; } YOU = null; btn.textContent = 'Show where I am'; acc.textContent = ''; paint(); }
    btn.addEventListener('click', function () {
      if (STOP) { stopWatch(); return; }
      btn.textContent = 'Finding you...';
      STOP = VEParkMap.watch(function (p) { if (!YOU && SORT === 'num') SORT = 'near'; YOU = p; btn.textContent = 'Hide my location'; paint(); }, function (e) {
        STOP = null; btn.textContent = 'Show where I am';
        acc.textContent = e && e.code === 1 ? 'Your browser said no. Allow location for this site in its settings, then try again.' : 'We could not find you just now. Try again in a moment, outside if you can.';
      });
    });
    // Leaving the page stops the phone's location.
    window.addEventListener('hashchange', function once() { if (curView().indexOf('venue/' + v.slug) !== 0 || curView().indexOf('/report') > 0) { if (STOP) { STOP(); STOP = null; } YOU = null; window.removeEventListener('hashchange', once); } });
  }

  function viewReportTab() {
    var signedIn = !!token();
    // The points come from ve_venue_report_points (Sean's to change), so this table never disagrees with what is paid.
    var P = function (k, f, d) { return POINTS[k] ? POINTS[k][f] : d; };
    var rows = [
      ['Update', 'Something changed or is gone, the first accepted report', P('wrong', 'with_photo', 100), P('wrong', 'no_photo', 50)],
      ['Something missing', 'A Vegan item or restaurant that is not in the Guide yet. With a photo means both: the item and the sign', P('missing', 'with_photo', 100), P('missing', 'no_photo', 50)],
      ['Agrees with the first', 'An update the team already accepted from someone else', P('wrong', 'agree_with_photo', 25), P('wrong', 'agree_no_photo', 15)],
      ['Still here, first to confirm', 'The bounty: the first member to confirm an item no one has checked in ' + (LIMITS.fresh_days || 35) + ' days', P('confirm', 'first_with_photo', 50), P('confirm', 'first_no_photo', 25)],
      ['Still here', 'After someone has confirmed it', P('confirm', 'with_photo', 10), P('confirm', 'no_photo', 5)],
      ['Comment', 'What you thought, a tip for other fans', P('comment', 'with_photo', 10), P('comment', 'no_photo', 5)]
    ];
    main.innerHTML = head('Help keep it right', 'Members keep this Guide right', 'Menus in the parks change all year. When you are in a park, tell us what is still there, what changed and what you thought. A photo earns more. Bounties are part of the Guide: once it is yours, every report you send from inside earns points.') +
      '<div class="sa-ptable" role="table" aria-label="Points for each kind of report"><div class="sa-ptr sa-pth" role="row"><span role="columnheader">What you send</span><span role="columnheader">With a photo</span><span role="columnheader">Without</span></div>' +
      rows.map(function (r) { return '<div class="sa-ptr" role="row"><span role="cell"><b>' + esc(r[0]) + '</b><i>' + esc(r[1]) + '</i></span><span role="cell"><b>' + pts(r[2]) + '</b> points</span><span role="cell"><b>' + pts(r[3]) + '</b> points</span></div>'; }).join('') + '</div>' +
      '<ol class="sa-steps"><li>Open the park while you are there and tap <b>Still here</b>, <b>Update</b> or <b>Comment</b> on an item, or <b>Add something missing</b>.</li>' +
      '<li>Add a photo of the menu board or the food if you can. Your phone shares your location once, to show you are inside the park.</li>' +
      '<li>The team checks every one, so a photo that does not help is not paid. Points land when it is accepted, up to ' + (LIMITS.daily_paid_cap || 40) + ' paid a day. Look for <b>Bounty</b> on an item or a venue: the first to confirm it earns the most.</li></ol>' +
      '<div class="dg-btns" style="margin-bottom:18px"><a class="dg-btn" href="#/venues">Pick a park</a></div>' +
      (signedIn ? '<h3 class="dg-k" style="margin:6px 0 10px">Your reports</h3><div id="saMine"><div class="dg-loading">Loading your reports...</div></div>' : '');
    if (signedIn) api({ action: 'mine' }).then(function (d) {
      var el = document.getElementById('saMine'); if (!el) return;
      var list = (d && d.reports) || [];
      el.innerHTML = list.length ? '<div class="dg-rows">' + list.map(function (r) {
        var st = STATUS[r.status] || STATUS.pending;
        return '<div class="dg-row" style="grid-template-columns:minmax(0,1fr) auto"><div class="dg-row-main"><b>' + esc((REPORT[r.kind] || [r.kind])[0]) + ': ' + esc(r.item || r.spot || r.note || '') + '</b><span>' + esc(r.venue || '') + ' &middot; ' + esc(fmtDate(r.at)) +
          (r.points ? ' &middot; ' + r.points + ' points' : '') + (r.review_note ? ' &middot; ' + esc(r.review_note) : '') + '</span></div>' + tagHtml(st[0], 'dg-tag-' + st[1]) + '</div>';
      }).join('') + '</div>' : '<p class="dg-empty">No reports yet. Your first one is waiting on your next visit.</p>';
    });
  }

  // Update: what they can tell us about one item, each with its points, then its form.
  function viewChoose(v, item, back) {
    main.innerHTML = crumb([['Parks', '#/venues'], [v.name, back], ['Update', '']]) +
      head('Update', esc(item.it.name), esc(item.spot.name) + (item.spot.where ? ', ' + esc(item.spot.where) : '') + '. What would you like to tell us? Each one earns points once the team accepts it, more with a photo.') +
      '<div class="sa-choose">' + itemKinds(item.it).map(function (k) {
        return '<a class="sa-choice" href="#/venue/' + esc(v.slug) + '/report/' + k + '/' + item.it.id + '"><b>' + esc(REPORT[k][2]) + '</b><span>' + esc(REPORT[k][1]) + '</span>' +
          (ptsLine(k, item.it) ? '<i>' + esc(ptsLine(k, item.it)) + '</i>' : '') + '</a>';
      }).join('') + '</div>' +
      '<div class="dg-formnav"><a class="dg-tnav" href="' + back + '">Back</a></div>';
  }

  // The report form: one view, the photo, a note, and Send (which asks for the location once).
  // Photos for the report: 'item' (the food, package or menu) and 'place' (the sign). Each shrunk in the browser.
  var PHOTOS = {};
  function photoSlot(key, label, hint) {
    return '<div class="dg-field"><span>' + label + ' <i>(' + hint + ')</i></span><div class="sa-photo"><label class="dg-btn dg-ghost" style="cursor:pointer">Take or choose a photo' +
      '<input type="file" data-photo="' + key + '" accept="image/*" capture="environment" hidden></label><span id="saPrev-' + key + '"></span></div></div>';
  }
  function bindPhotos() {
    [].forEach.call(document.querySelectorAll('[data-photo]'), function (inp) {
      inp.addEventListener('change', function () {
        var f = inp.files && inp.files[0], k = inp.getAttribute('data-photo'); if (!f) return;
        shrink(f).then(function (b) { PHOTOS[k] = b; document.getElementById('saPrev-' + k).innerHTML = '<img alt="Your photo" src="' + URL.createObjectURL(b) + '">'; })
          .catch(function () { setStatus('That photo could not be read. Try another one.'); });
      });
    });
  }
  function uploadPhoto(b) {
    if (!b) return Promise.resolve(null);
    return api({ action: 'report_start' }).then(function (s) {
      if (!s || !s.upload_url) throw s || {};
      return fetch(s.upload_url, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: b }).then(function (r) { if (!r.ok) throw {}; return s.path; });
    });
  }
  function viewReport(slug, kind, itemId) {
    if (!REPORT[kind] || kind === 'scan' || kind === 'locate') kind = 'missing';
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
    if (item && item.it.gtin && (kind === 'confirm' || kind === 'wrong')) kind = 'shop_confirm';
    if (!item && kind !== 'missing') kind = 'missing';
    var kinds = item ? '<div class="sa-kinds">' + itemKinds(item.it).map(function (k) {
      return '<a class="dg-chip" aria-pressed="' + (k === kind) + '" href="#/venue/' + esc(v.slug) + '/report/' + k + '/' + item.it.id + '">' + esc(REPORT[k][2]) + '</a>'; }).join('') + '</div>' : '';
    var noteLabel = kind === 'missing' ? 'Anything else? <i>(optional: the price, the hours, what is in it)</i>' : kind === 'shop_confirm' ? 'Anything to add? <i>(optional)</i>' : kind === 'confirm' ? 'Anything to add? <i>(optional)</i>'
      : kind === 'comment' ? 'Your comment <i>(what you thought, a tip for other fans)</i>' : kind === 'gone' ? 'Anything to add? <i>(optional)</i>' : 'What needs to be updated?';
    var earn = ptsLine(kind, item && item.it);
    main.innerHTML = crumb([['Parks', '#/venues'], [v.name, back]].concat(item ? [['Update', '#/venue/' + v.slug + '/report/choose/' + item.it.id]] : []).concat([[REPORT[kind][2], '']])) + head('Report', esc(REPORT[kind][0]), esc(REPORT[kind][1])) +
      (gate || ('<div class="dg-form">' + what + kinds +
        (kind === 'missing' ? '<label class="dg-field"><span>The Vegan item</span><input id="saItem" maxlength="160" placeholder="a plant-based burger, a veggie wrap, a pretzel"></label>' +
        '<label class="dg-field"><span>The place <i>(the restaurant or counter name on the sign)</i></span><input id="saPlace" maxlength="120" placeholder="Casey&#39;s Corner"></label>' +
        '<label class="dg-field"><span>Where is it? <i>(the land, and what it is near)</i></span><input id="saWhere" maxlength="160" placeholder="Tomorrowland, across from the Carousel of Progress"></label>' : '') +
        '<label class="dg-field"><span>' + noteLabel + '</span><textarea id="saNote" rows="3" maxlength="600"></textarea></label>' +
        (earn ? '<p class="sa-earn">' + esc(earn) + ', once the team accepts it.</p>' : '') +
        (kind === 'missing' ? photoSlot('item', 'A photo of the item', 'the food, the package or the menu board') + photoSlot('place', 'A photo of the sign', 'the name of the restaurant or counter')
          : photoSlot('item', 'A photo', 'optional: the menu board, the shelf or the food, and it earns more')) +
        '<span class="dg-status" id="saStatus" role="status"></span>' +
        '<div class="dg-formnav"><a class="dg-tnav" href="' + back + '">Back</a><button type="button" class="dg-btn" id="saSend">Send report</button></div>' +
        '<p class="dg-lede" style="font-size:12.5px;margin-top:12px">Sending asks for your location once, to check you are inside ' + esc(v.name) + '. We keep where you were, rounded, with the report. The team checks every one; a comment they accept shows on the item with your first name and photo.</p></div>'));
    PHOTOS = {}; bindPhotos();
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
    no_position: function () { return 'We need your location once to check you are inside the park.'; },
    no_location: function (d, v) { return 'Reports for ' + v.name + ' open soon.'; },
    already_today: function () { return 'You already sent this report today. Thank you!'; },
    guide_required: function () { return 'Bounties unlock with the Guide. Get it under Get access.'; },
    daily_limit: function () { return 'That is the most reports for one day. Thank you, and come back next visit.'; },
    note_required: function () { return 'Add a few words first.'; },
    name_required: function () { return 'Tell us what the item is.'; },
    where_required: function () { return 'Tell us where it is first.'; },
    spot_required: function () { return 'Pick the restaurant first.'; },
    already_pending: function () { return 'Someone already logged this item here. It is waiting for the team.'; },
    bad_photo: function (d) { return (d && d.message) || 'The photo did not upload. Try again, or send it without one.'; }
  };
  function sendReport(v, kind, item) {
    var note = (document.getElementById('saNote') || {}).value || '';
    var val = function (id) { return ((document.getElementById(id) || {}).value || '').trim(); };
    var extra = kind === 'missing' ? { item_name: val('saItem'), place_name: val('saPlace'), place_zone: val('saZone') || undefined, place_where: val('saWhere') } : {};
    if (kind === 'missing' && extra.item_name.length < 2) { setStatus('Tell us the Vegan item first.'); return; }
    if (kind === 'missing' && extra.place_name.length < 2) { setStatus('Tell us the name of the place on its sign.'); return; }
    if (kind === 'wrong' && note.trim().length < 3) { setStatus('Tell us what needs to be updated.'); return; }
    if (kind === 'comment' && note.trim().length < 3) { setStatus('Write your comment first.'); return; }
    if (!navigator.geolocation) { setStatus('This browser cannot share your location, which the report needs.'); return; }
    var btn = document.getElementById('saSend'); btn.disabled = true; btn.textContent = 'Finding you...';
    var fail = function (msg) { btn.disabled = false; btn.textContent = 'Send report'; setStatus(msg); };
    navigator.geolocation.getCurrentPosition(function (pos) {
      btn.textContent = 'Sending...';
      // The photo is optional: upload it first when there is one.
      var send = function (path, placePath) {
        return api(Object.assign({ action: 'report', venue: v.slug, kind: kind, item: item ? item.it.id : undefined, spot: item ? item.spot.id : undefined,
          note: note, path: path || undefined, place_path: placePath || undefined, lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }, extra));
      };
      uploadPhoto(PHOTOS.item).then(function (p1) { return uploadPhoto(PHOTOS.place).then(function (p2) { return send(p1, p2); }); }).then(function (d) {
        if (d && d.ok) {
          main.innerHTML = crumb([['Parks', '#/venues'], [v.name, '#/venue/' + v.slug], ['Sent', '']]) +
            '<div class="dg-done"><div class="dg-k">Sent</div><h2 class="dg-h1">Thank you!</h2><p class="dg-lede">The team checks every report. ' + (d.bounty ? 'You are first on this one: when the team accepts it, it pays the bounty. ' : '') + 'Points land when yours is accepted, and you can follow it under Help keep it right.</p>' +
            '<div class="dg-btns"><a class="dg-btn" href="#/venue/' + esc(v.slug) + '">Back to ' + esc(v.name) + '</a><a class="dg-btn dg-ghost" href="#/report">Your reports</a></div></div>';
          return;
        }
        var f = d && WHY[d.why]; fail(f ? f(d, v) : (d && d.message) || 'That did not go through. Try again in a minute.');
      }).catch(function (e) { fail((e && e.message) || 'That did not go through. Try again in a minute.'); });
    }, function () { fail(WHY.no_position()); }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 });
  }

  // Scan a Vegan item (Sean, 2026-11-01: convenience stores and gift shops; "10 points per item... 5 points for confirming... it'll
  // just let them know that this item has already been logged"). Pick the shop (or add one with its sign), scan the barcode; a
  // new item is logged for the team to accept (10 points, once), one already there offers Still on the shelf (5 points).
  function papi(body) {
    var h = { 'Content-Type': 'application/json', apikey: ANON_KEY }, t = token();
    if (t) h.Authorization = 'Bearer ' + t;
    return fetch(SB + '/functions/v1/ve-products', { method: 'POST', headers: h, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  function viewMyList() {
    main.innerHTML = head('My list', 'My list', 'The parks and items you saved. Tap Save on a park or any item.') + '<div id="saML"><div class="dg-loading">Loading your list...</div></div>';
    api({ action: 'saves' }).then(function (d) {
      var el = document.getElementById('saML'); if (!el) return;
      var vs = (d && d.venues) || [], its = (d && d.items) || [];
      if (!vs.length && !its.length) { el.innerHTML = '<p class="dg-empty">Nothing saved yet. Open a park and tap Save.</p>'; return; }
      el.innerHTML = (vs.length ? '<h3 class="dg-k" style="margin:0 0 10px">Parks</h3><div class="sa-vgrid" style="margin-bottom:18px">' + vs.map(function (v) {
        return '<a class="sa-vcard" href="#/venue/' + esc(v.slug) + '">' + (v.image_url ? '<span class="sa-vimg" style="background-image:url(\'' + esc(v.image_url) + '\')"></span>' : '<span class="sa-vimg sa-vimg-none">' + ICON.theme_park + '</span>') +
          '<span class="sa-vbody"><h3>' + esc(v.name) + '</h3><span class="sa-vmeta">' + esc(v.resort || v.city || '') + '</span></span></a>'; }).join('') + '</div>' : '') +
        (its.length ? '<h3 class="dg-k" style="margin:0 0 10px">Items</h3><div class="dg-rows">' + its.map(function (i) {
          return '<a class="dg-row" style="grid-template-columns:minmax(0,1fr) auto;text-decoration:none;color:inherit" href="#/venue/' + esc(i.venue_slug) + '"><div class="dg-row-main"><b>' + esc(i.name) + '</b><span>' + esc(i.spot || '') + (i.where ? ', ' + esc(i.where) : '') + ' &middot; ' + esc(i.venue || '') + '</span></div>' +
            tagHtml((VEGAN[i.vegan] || VEGAN.vegan)[0], 'sa-tag-' + (VEGAN[i.vegan] || VEGAN.vegan)[1]) + '</a>'; }).join('') + '</div>' : '');
    });
  }

  function viewJoin() {
    if (owner()) { main.innerHTML = head('Your Guide', 'The whole Guide is yours', 'Thank you for being here.') + '<a class="dg-btn" href="#/venues">Pick a park</a>'; return; }
    var m = mode();
    var list = '<div class="dg-access"><ul>' +
      '<li><b>Every park:</b> each restaurant pinned on our own map, with how far it is from you and what is Vegan.</li>' +
      '<li><b>Points:</b> earn them for checking what is still there, and be first to confirm an item for the bounty.</li><li><b>Checked by members:</b> every item says when a member last confirmed it from inside, and where it came from.</li>' +
      '<li><b>My list:</b> save the parks you go to and the items you want to find.</li>' +
      '<li><b>The community:</b> your member dashboard, Directory votes, the Daily Pulse and points.</li></ul></div>';
    var status = '<span class="dg-status" role="status" style="display:block;margin-top:10px;color:#8a5a00"></span>';
    var box = m === 'soon' ? '<div class="dg-big">Soon</div><p>The full Guide opens soon. Magic Kingdom is open to everyone now.</p><a class="dg-btn" href="#/venue/magic-kingdom">Open Magic Kingdom</a>'
      : m === 'points' ? '<div class="dg-big">' + pts(ST.cost) + '<small>points</small></div><p>You have ' + pts(ST.balance) + ' points. Unlock the Guide with ' + pts(ST.cost) + ' of them and it is yours to keep.</p>' +
        '<button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button><button type="button" class="dg-btn dg-ghost" data-buy style="margin-top:8px">Or get it for $11</button>' + status
      : '<div class="dg-big">$11<small>yours to keep</small></div><p>' + (m === 'join' ? 'Create your account and get the Guide for $11, one time. Buying it makes you a member of Vegans Explore. Already a member? <a href="#" data-signin>Sign in</a>.'
        : 'Get the Guide for $11, one time, and it is yours to keep.') + '</p><button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button>' + status +
        '<p class="dg-pp">Or get your <a href="/passport">Passport</a>: $11, one time, with 1,100 welcome points, enough for this Guide.</p>';
    main.innerHTML = head('Get access', 'Open every park', 'Every Vegans Explore Guide is $11, or 1,100 points. Buying a Guide makes you a member, and the Passport comes with 1,100 welcome points.') + list;
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
    else ({ overview: viewOverview, venues: viewVenues, report: viewReportTab, mylist: viewMyList, join: viewJoin })[view]();
    curTab = key;
    drawRiver();
    main.scrollTop = 0; if (!document.documentElement.classList.contains('dg-fit') || window.innerWidth <= 900) window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  document.addEventListener('click', function (e) {
    var a = auth();
    if (e.target.closest('[data-signin]')) {
      e.preventDefault();
      if (a) a.showAuthModal('Sign in to open the Vegan Theme Park Guide and send reports.', function () { location.reload(); }, 'login');
      return;
    }
    var vb = e.target.closest('[data-spotvote]');
    if (vb) { e.preventDefault(); spotVote(vb); return; }
    var cl = e.target.closest('[data-spotclear]');
    if (cl) {
      e.preventDefault(); OPEN = ''; ON = ''; SORT = 'num'; LAND = '';
      [].forEach.call(document.querySelectorAll('#vpLands [data-land]'), function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-land') === '')); });
      repaint(); var st = document.getElementById('vpStands'); if (st) st.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    var sp = e.target.closest('[data-spot]');
    if (sp && !e.target.closest('a')) {
      e.preventDefault();
      var id = sp.getAttribute('data-spot'), wasOpen = OPEN === id;
      OPEN = wasOpen ? '' : id; ON = wasOpen ? '' : id;
      repaint();
      var card = document.getElementById('sa-st-' + id);
      if (card) { if (!wasOpen) card.scrollIntoView({ behavior: 'smooth', block: 'start' }); var t = card.querySelector('.sa-tog'); if (t) t.focus({ preventScroll: true }); }
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
        a.showAuthModal('Create your account, then get the Vegan Theme Park Guide for $11. Buying it makes you a member.', go, 'signup');
        return;
      }
      if (m === 'points') unlockPoints(jb); else buyNow(jb);
    }
  });
  document.addEventListener('change', function (e) {
    var sel = e.target.closest('[data-spotsort]');
    if (sel) { SORT = sel.value; repaint(); }
  });
  // A vote on a restaurant: the Guide's owners vote; everyone sees the counts.
  function spotVote(btn) {
    var id = btn.getAttribute('data-spotvote'), note = document.getElementById('vpVoteNote');
    var say = function (m) { if (note) note.textContent = m; };
    if (!token()) { var a = auth(); if (a) a.showAuthModal('Sign in to vote for your favorite park restaurants.', function () { location.reload(); }, 'login'); return; }
    if (!owner()) { say('Voting comes with the Guide. Get it in Get access.'); return; }
    var on = !votedFor(id);
    btn.disabled = true;
    cookApi({ action: 'gvote', kind: 'park_spot', key: id, on: on }).then(function (d) {
      btn.disabled = false;
      if (!d || !d.ok) { say(d && d.message ? d.message : 'That vote did not go through. Try again.'); return; }
      GV.counts.park_spot = GV.counts.park_spot || {}; GV.mine.park_spot = GV.mine.park_spot || [];
      GV.counts.park_spot[id] = d.count;
      GV.mine.park_spot = GV.mine.park_spot.filter(function (k) { return k !== id; }); if (d.voted) GV.mine.park_spot.push(id);
      repaint();
    }).catch(function () { btn.disabled = false; say('That vote did not go through. Try again.'); });
  }
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
