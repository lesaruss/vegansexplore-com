/* The Vegan Dairy Guide (Sean, 2026-10-07, rebuilt 2026-10-09 on the Oatly page's layout).
 *
 * The tabs are the tour. Maya stays on the right of every tab and talks about it; the tab's content sits on the
 * left, on one screen, and a section with parts has toggles instead of a longer page. Back / N of M / Next under
 * Maya walks the tabs in order. The address bar carries the view (#/brands/milk, #/pulse/listen, #/search/oat).
 *
 *   Overview          what the Guide is and what each tab holds; Maya's welcome video
 *   Pulse             the Dairy-Free Pulse: the research (six sourced facts, three public) and our podcasts and
 *                     interviews on dairy (ve_pulse_content rows in PULSE_PICKS, played inside the Guide)
 *   Brands            Directory listings tagged vegan-dairy-guide (Food Brands), filter, search, sort, vote
 *   Swaps             how to replace each dairy item, from the shelf or the pantry (Buttermilk is free)
 *   Cookbook          recipes, What can I make?, cookbooks (Directory listings tagged dairy-guide-book), chefs
 *   See for yourself  how milk is made, behind a warning
 *   Get access        visitors only: the $11 Founding Membership, and sign in for members
 *
 * Visitors see every locked tab as the real section, blurred, with a membership note on top, while Maya explains it
 * (Sean, 2026-10-09). Nothing plays until Start the tour; from then every tab plays its clip unless she was paused.
 *
 * Access (Sean, 2026-10-10, canon-ve-guide-pricing): every paid Guide is $11 or 1,100 points. ve_guides.access_rule
 * decides the offer: 'membership' (the old rule) comes with the $11 Founding Membership; 'points' means a member
 * unlocks it with 1,100 points (ve-guide-unlock unlock), adds points if short (ve-entry-checkout, ?topup=success), or
 * has Passport; joining for $11 credits 1,100 points. ST holds what the server says. The members-only text (research 4-6, See for yourself,
 * swaps, recipes, resources) is ve_guides.content_html for slug vegan-dairy-guide-site, handed out by
 * ve-guide-unlock ?action=open only to active members. Never add it to this repo: Vercel serves it, so anything here
 * is public. Joining reuses VEAuth.showAuthModal and the Founding Membership window (ve-entry-checkout); checkout
 * returns with ?activate=success and the page re-checks.
 * To add a brand or a cookbook: list it in the Directory with the tag. To add an episode: its slug in PULSE_PICKS.
 */
(function () {
  var SLUG = 'vegan-dairy-guide-site';
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var UNLOCK_URL = SB + '/functions/v1/ve-guide-unlock';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  // The Directory's own fields, so every card is the Directory card (VERegionDirectory.card).
  var LISTING_FIELDS = (window.VERegionDirectory ? VERegionDirectory.FIELDS : 'id,slug,name,category,logo_url,vote_count,address_city,address_state,color,vegan_status') + ',initials,website,details';
  var BRANDS_URL = SB + '/rest/v1/listings?select=' + LISTING_FIELDS + '&status=eq.approved&category=eq.Food%20Brands&tags=cs.%7Bvegan-dairy-guide%7D';
  // Stores (Sean, 2026-10-08): every product in the Guide is mapped to the grocery stores that carry it, and each store
  // is a Directory listing with a Vegan aisle. A store named in the Guide links to that aisle with the product picked out.
  var PRODUCTS_URL = SB + '/rest/v1/ve_products?select=id,slug,brand_listing_id,product_type,name&guides=cs.%7Bvegan-dairy-guide%7D';
  var ALIASES_URL = SB + '/rest/v1/ve_store_aliases?select=alias,listings(slug,name,status)';
  var BOOKS_URL = SB + '/rest/v1/listings?select=' + LISTING_FIELDS + '&status=eq.approved&category=eq.Books&tags=cs.%7Bdairy-guide-book%7D';
  // The Dairy-Free Pulse (Sean, 2026-10-09: "it's literally the pulse but just on dairy free food"): our published
  // episodes and interviews about dairy, in this order. A new one is its ve_pulse_content slug here.
  var PULSE_PICKS = [
    'why-ditching-dairy-is-so-hard-ep-5-pre-vegans-podcast',
    'dotsie-bausch-switch4good-adsoy-act',
    'dr-neal-barnard-pcrm-cheese-trap-ep018-soflo-vegans-podcast',
    'maizly-worlds-first-corn-milk-tim-leclercq',
    'plant-based-milk-schools-dairy-monopoly-bill',
    'eu-ban-vegan-words-burger-milk-labeling',
    'top-vegan-alternatives-for-eggs-cheese-more-vegans-who-lift-podcast-season-3-finale',
    'simple-plant-based-swaps-that-make-life-easier'
  ];
  var PULSE_URL = SB + '/rest/v1/ve_pulse_content?select=slug,title,podcast_show,youtube_id,thumbnail_url,summary,published_at&status=eq.published&slug=in.(' + PULSE_PICKS.join(',') + ')';
  var CATS = ['Milk', 'Coffee Creamer', 'Butter', 'Cheese Slices', 'Cheese Spreads', 'Shredded Cheese', 'Parmesan', 'Sour Cream', 'Feta', 'Cream Cheese', 'Yogurt', 'Ice Cream'];
  var SWAP_GROUPS = ['Milk & cream', 'Butter', 'Cheese', 'Yogurt & sour cream'];
  // What visitors see listed under the free swap (names only; the how-to comes with membership).
  var SWAP_NAMES = [['Milk & cream', ['Milk', 'Milk in coffee', 'Heavy cream', 'Whipped cream', 'Evaporated milk', 'Sweetened condensed milk']],
    ['Butter', ['Butter for baking', 'Butter for cooking', 'Ghee']], ['Cheese', ['Cream cheese', 'Parmesan', 'Cheese sauce', 'Ricotta']], ['Yogurt & sour cream', ['Yogurt', 'Sour cream']]];
  var RECIPE_NAMES = ['Make your own nut milk', 'Banana ice cream', 'Cashew sour cream', 'Cashew cream cheese', 'Potato cheese sauce', 'Tofu ricotta'];

  // The tabs, in tour order, and what Maya says on each. A tab's `say` must match its recording.
  var TABS = [
    { k: 'overview', label: 'Overview', say: 'Hi, I\'m Maya! Press Start the tour and I\'ll walk you through the Dairy Guide, one tab at a time.', playing: 'Hi, I\'m Maya, and welcome to the Vegan Dairy Guide! Press Next when you\'re ready for the next tab.' },
    { k: 'pulse', label: 'Pulse', lock: 1, say: 'This is the Dairy-Free Pulse: what the research says, every fact sourced, plus our podcasts and interviews on dairy.' },
    { k: 'brands', label: 'Brands', lock: 1, say: 'Stop guessing in the dairy aisle. Here are the brands to buy, sorted by what you\'re replacing, and voted on by members.' },
    { k: 'swaps', label: 'Swaps', lock: 1, say: 'Swaps show you how to replace dairy when you cook, from the shelf or your pantry. Buttermilk is free to try, so start there.' },
    { k: 'cookbook', label: 'Cookbook', lock: 1, say: 'The Cookbook keeps growing: recipes you can make at home, and the dairy-free cookbooks people love most.' },
    { k: 'look', label: 'See for yourself', lock: 1, say: 'See for yourself is how milk is made, in plain facts. No graphic images. Open it when you\'re ready, or skip it.' },
    { k: 'join', label: 'Get access', guest: 1, say: 'The Guide comes with the eleven dollar Founding Membership, one time. Already a member? Sign in and it opens. Come join us!',
      // Once the Guide is priced in points (canon-ve-guide-pricing). Waiting for Sean's OK and a recording (CLIPS.join_points).
      sayPoints: 'Every Guide is eleven dollars or eleven hundred points. Join for eleven dollars and you get eleven hundred points, enough for this one. Come join us!' }
  ];
  // Maya on camera. Overview is her welcome; every other tab gets a clip under 10 seconds (el-media voice, Wan 2.7,
  // scripts/brand-door/assemble_r5.py), stored in vegan-media/media/maya/dairy-guide/. Until a tab has one, she shows
  // her picture and the bubble carries her words.
  var CLIP_BASE = SB + '/storage/v1/object/public/vegan-media/media/maya/dairy-guide/';
  var CLIPS = {
    overview: { video: '/public/guides/maya-dairy-welcome.mp4?v=2', webm: '/public/guides/maya-dairy-welcome.webm?v=2', captions: '/public/guides/maya-dairy-welcome.vtt?v=2' }
  };
  // Recorded 2026-10-10 (Sean approved the lines): one pose per tab, from her round 5 Oatly start pictures.
  ['pulse', 'brands', 'swaps', 'cookbook', 'look', 'join'].forEach(function (k) {
    // ?v= changes when a clip is re-recorded, so no one is served the old one from cache (Brands, 2026-10-10: no counts).
    CLIPS[k] = { video: CLIP_BASE + 'dg-' + k + '.mp4?v=2', poster: CLIP_BASE + 'dg-poster-' + k + '.jpg?v=2' };
  });

  var PANTRY = [
    ['Cashews', /cashew/i], ['Soy milk', /soy milk/i], ['Plant milk', /plant milk/i], ['Coconut milk or cream', /coconut (milk|cream)/i],
    ['Coconut oil', /coconut oil/i], ['Lemon juice', /lemon/i], ['Vinegar', /vinegar/i], ['Nutritional yeast', /nutritional yeast/i],
    ['Tofu', /tofu/i], ['Raw nuts', /raw nuts|almond/i], ['Potatoes and carrots', /potato|carrot/i], ['Bananas', /banana/i],
    ['Dates', /dates/i], ['Chickpeas (aquafaba)', /aquafaba|chickpea/i]
  ];
  // Cookbook covers from Open Library, for the four with a cover on file.
  var COVERS = [['Super Easy Vegan Cheese Cookbook', '12087441'], ['One-Hour Dairy-Free Cheese', '9165674'], ['Breaking Up with Dairy', '14849260'], ['Incredible Vegan Ice Cream', '10254059']];

  var S = 'stroke="#1f5f22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  var ICON = {
    pulse: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + '><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>',
    brands: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + '><path d="M8 2h8l-1 3h-6z"/><path d="M9 5h6l3 4v12a1 1 0 01-1 1H7a1 1 0 01-1-1V9z"/><path d="M6 12h12"/></svg>',
    swaps: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + '><path d="M4 8h13l-3-3"/><path d="M20 16H7l3 3"/></svg>',
    cookbook: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + '><path d="M4 4h6a2 2 0 012 2v14a2 2 0 00-2-2H4z"/><path d="M20 4h-6a2 2 0 00-2 2v14a2 2 0 012-2h6z"/></svg>',
    look: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8a5a00" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>'
  };
  var LOCK_SVG = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';

  var main = document.getElementById('dgMain');
  var menuEl = document.getElementById('dgMenu'), menuSel = document.getElementById('dgMenuSelect');
  var qEl = document.getElementById('dgQ');
  var PUB = JSON.parse(document.getElementById('dg-public').textContent);

  var access = 'checking';       // checking | guest | pending | member
  var MEM = null;                // members-only payload
  // What ve-guide-unlock says about this visitor and this Guide. Pricing (Sean, 2026-10-10, canon-ve-guide-pricing):
  // once access_rule is 'points', the Guide is $11 or 1,100 points; the $11 Founding Membership credits 1,100 points;
  // Passport opens every Guide. While it still says 'membership', the page keeps the old offer, so flipping the row
  // switches the whole page at once.
  var ST = { rule: 'membership', cost: 1100, balance: 0, active: false, via: null };
  var BRANDS = null, BOOKS = null, PODS = null, PRODUCTS = {}, PRODUCT_BY_SLUG = {}, STORES = {};
  var lookOpen = false, curTab = 'overview';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function slugify(s) { return String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function catBySlug(s) { for (var i = 0; i < CATS.length; i++) if (slugify(CATS[i]) === s) return CATS[i]; return null; }
  function groupBySlug(s) { for (var i = 0; i < SWAP_GROUPS.length; i++) if (slugify(SWAP_GROUPS[i]) === s) return SWAP_GROUPS[i]; return null; }
  function auth() { return window.VEAuth || null; }
  function member() { return access === 'member'; }
  function sources(list) { return list && list.length ? '<span class="dg-src">' + list.map(function (s) { return '<a href="' + esc(s[1]) + '" target="_blank" rel="noopener">' + esc(s[0]) + '</a>'; }).join('') + '</span>' : ''; }
  function tabs() { return TABS.filter(function (t) { return !(t.guest && member()); }); }
  function tab(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i].k === k) return TABS[i]; return TABS[0]; }
  function href(k) { return '#/' + (k === 'overview' ? '' : k); }

  // ---------- tabs ----------
  function drawMenu(cur) {
    var locked = !member();
    menuEl.innerHTML = tabs().map(function (t) {
      return '<a href="' + href(t.k) + '"' + (t.k === cur ? ' aria-current="page"' : '') + (t.guest ? ' class="dg-join-tab"' : '') + '>' + esc(t.label) +
        (locked && t.lock ? ' <span class="dg-lk" aria-label="locked">' + LOCK_SVG + '</span>' : '') + '</a>';
    }).join('');
    menuSel.innerHTML = tabs().map(function (t) { return '<option value="' + t.k + '"' + (t.k === cur ? ' selected' : '') + '>' + esc(t.label) + (locked && t.lock ? (priced() ? ' (locked)' : ' (members)') : '') + '</option>'; }).join('') +
      (cur === 'search' ? '<option value="search" selected>Search results</option>' : '');
  }
  menuSel.addEventListener('change', function () { location.hash = href(menuSel.value); });

  // ---------- pieces ----------
  function crumb(parts) {
    return '<div class="dg-crumb"><a href="#/">Dairy Guide</a>' + parts.map(function (p) { return ' &rsaquo; ' + (p[1] ? '<a href="' + p[1] + '">' + esc(p[0]) + '</a>' : esc(p[0])); }).join('') + '</div>';
  }
  // A tab's heading: kicker and title on the left, its toggles on the right, then one line on what it is.
  function head(k, h, lede, right) {
    return '<div class="dg-head"><div><div class="dg-k">' + esc(k) + '</div><h2 class="dg-h1">' + h + '</h2></div>' + (right || '') + '</div>' + (lede ? '<p class="dg-lede">' + lede + '</p>' : '');
  }
  function toggles(list, cur) {
    return '<div class="dg-toggles" role="group">' + list.map(function (x) { return '<a href="' + x[1] + '" aria-pressed="' + (x[0] === cur) + '">' + esc(x[0]) + '</a>'; }).join('') + '</div>';
  }
  function whyCard(w) { return '<div class="dg-card"><h3>' + esc(w.title) + '</h3><p>' + esc(w.text) + '</p>' + sources(w.sources) + '</div>'; }
  function skel(title, lines) { var h = '<div class="dg-skel">' + (title ? '<h3>' + esc(title) + '</h3>' : '<i></i>'); for (var i = 0; i < (lines || 3); i++) h += '<i style="width:' + (92 - i * 9) + '%"></i>'; return h + '</div>'; }

  // A locked section: the real thing, blurred, with the note on top (Sean, 2026-10-09: "they'll just show you that
  // you have to be logged in and maybe you see what the actual section is, but there's like a blur over it").
  function gated(inner, title, text) {
    return '<div class="dg-gated"><div class="dg-blur" aria-hidden="true">' + inner + '</div><div class="dg-gate"><span class="dg-lockic">' + LOCK_SVG.replace(/width="11" height="11"/, 'width="16" height="16"').replace('currentColor', '#1f5f22') + '</span>' +
      '<b>' + esc(title) + '</b><p>' + esc(text) + ' ' + esc(offerLine()) + '</p>' + ctaBtns() + '</div></div>';
  }

  // ---------- the offer ----------
  function priced() { return ST.rule === 'points'; }
  function pts(n) { return Number(n || 0).toLocaleString('en-US'); }
  // The next step for someone without the Guide: join (signed out), activate (an account that is not a Founding
  // Member yet), unlock (enough points), topup (an active member short on points).
  function mode() {
    if (access === 'guest' || access === 'checking') return 'join';
    if (!priced()) return 'activate';
    if (ST.balance >= ST.cost) return 'unlock';
    return ST.active ? 'topup' : 'activate';
  }
  function ctaLabel() {
    return { join: 'Join for $11', activate: 'Become a Founding Member', unlock: 'Unlock with ' + pts(ST.cost) + ' points', topup: 'Add points' }[mode()];
  }
  function offerLine() {
    if (!priced()) return 'It comes with the $11 Founding Membership, one time.';
    var m = mode();
    if (m === 'unlock') return 'Unlock it with ' + pts(ST.cost) + ' points. You have ' + pts(ST.balance) + '.';
    if (m === 'topup') return 'It is ' + pts(ST.cost) + ' points and you have ' + pts(ST.balance) + '. Add points, or get Passport: it opens every Guide.';
    return 'Joining is $11, one time, and gives you ' + pts(ST.cost) + ' points: enough for this Guide.';
  }
  function ctaBtns(small) {
    var m = mode(), link = small ? ' style="font-size:12.5px;font-weight:800;color:var(--g)"' : '';
    return '<div class="dg-btns"' + (small ? ' style="margin-top:6px"' : '') + '><button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button>' +
      (m === 'join' ? '<a href="#" data-signin' + link + '>Already a member? Sign in</a>' : '') +
      (m === 'topup' ? '<a href="/passport"' + link + '>Passport opens every Guide</a>' : '') + '</div>';
  }
  function take(d) {
    if (!d || d.error) return;
    if (d.access_rule && d.access_rule !== ST.rule) { ST.rule = d.access_rule; if (TOUR.shown === 'join') TOUR.shown = null; }
    if (d.cost) ST.cost = d.cost;
    ST.balance = d.balance || 0; ST.active = d.membership_status === 'active'; ST.via = d.via || null;
  }
  // The header box: the $11 offer for visitors; once signed in, their points and the next step.
  function drawJoinbox() {
    var box = document.querySelector('.dg-joinbox'); if (!box || member()) return;
    var m = mode(), price = box.querySelector('.dg-jb-price'), btn = box.querySelector('[data-join]'), signin = box.querySelector('.dg-jb-in');
    price.innerHTML = priced() && (m === 'unlock' || m === 'topup') ? '<b>' + pts(ST.balance) + '</b><small>your points<br>this Guide: ' + pts(ST.cost) + '</small>'
      : '<b>$11</b><small>one time<br>' + (priced() ? 'with ' + pts(ST.cost) + ' points' : 'Founding Membership') + '</small>';
    btn.textContent = ctaLabel();
    signin.style.display = m === 'join' ? '' : 'none';
  }

  // Brands and cookbooks are Directory listings, so they look exactly like the Directory, and opening one keeps the
  // visitor in the Guide (#/listing/<slug>).
  function dirCard(l, i) { return window.VERegionDirectory ? VERegionDirectory.card(l, i) : ''; }
  function dirGrid(id, html) { return '<div class="vrd-root"><div class="rank-grid"' + (id ? ' id="' + id + '"' : '') + '>' + html + '</div></div>'; }
  function wireCards(el) {
    if (window.VERegionDirectory) VERegionDirectory.wire(el, function (slug) { location.hash = '#/listing/' + encodeURIComponent(slug); });
    else if (window.VEVotes) VEVotes.wire(el);
  }
  function dirTools(pills, searchPh, searchLabel) {
    return '<div class="vrd-root"><div class="subcat-pills">' + pills.map(function (p) { return '<a class="subcat-pill' + (p[2] ? ' sc-active' : '') + '" href="' + p[1] + '">' + esc(p[0]) + '</a>'; }).join('') +
      '<div class="vrd-search-wrap"><svg class="vrd-search-icon" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' +
      '<input type="text" class="vrd-search-input" id="dgFilter" placeholder="' + esc(searchPh) + '" aria-label="' + esc(searchLabel) + '"></div></div>' +
      '<div class="sort-bar"><span class="sort-label">Sort by</span><select class="sort-select" id="dgSort" aria-label="Sort listings"><option value="votes">Most Votes</option><option value="az">A to Z</option></select><span class="geo-label" id="dgCount"></span></div></div>';
  }
  function sortBy(list, how) {
    return list.slice().sort(function (a, b) { return how === 'az' ? a.name.localeCompare(b.name) : (b.vote_count || 0) - (a.vote_count || 0) || a.name.localeCompare(b.name); });
  }
  var sortPref = 'votes';

  function swapCard(s) {
    return '<div class="dg-swap"><h3>' + esc(s.replace) + '</h3><dl><dt>Shelf</dt><dd>' + esc(s.shelf) + '</dd><dt>Pantry</dt><dd>' + esc(s.pantry) + '</dd></dl>' +
      (s.tip ? '<div class="dg-tip">' + esc(s.tip) + '</div>' : '') + '</div>';
  }
  function podCard(p) {
    return '<a class="dg-pod" href="#/pulse/watch/' + encodeURIComponent(p.slug) + '"><div class="dg-pod-img" style="background-image:url(\'' + esc(p.thumbnail_url || '') + '\')"></div>' +
      '<div class="dg-pod-b"><div class="dg-pod-show">' + esc(p.podcast_show || 'Vegans Explore') + '</div><div class="dg-pod-t">' + esc(p.title) + '</div><div class="dg-pod-s">' + esc(p.summary || '') + '</div></div></a>';
  }

  // ---------- views ----------
  function viewOverview() {
    var tiles = [
      ['pulse', 'Pulse', 'What the research says, with sources, and our podcasts and interviews on dairy.'],
      ['brands', 'Brands', 'The brands to buy, sorted by what you are replacing, with the stores that carry them.'],
      ['swaps', 'Swaps', 'How to replace dairy when you cook, from the shelf or your pantry. One is free.'],
      ['cookbook', 'Cookbook', 'Recipes to make at home and the cookbooks members love. It keeps growing.'],
      ['look', 'See for yourself', 'How milk is made, in plain facts. Optional.']
    ];
    main.innerHTML = head('Everything dairy, made Vegan', 'Going dairy-free, without the guesswork',
      'Dropping dairy is one of the hardest parts of going Vegan. This Guide puts it all in one place, and Maya walks you through every tab.') +
      '<div class="dg-tiles">' + tiles.map(function (t) {
        return '<a class="dg-tile' + (t[0] === 'look' ? ' dg-warm' : '') + '" href="' + href(t[0]) + '"><div class="dg-ic">' + ICON[t[0]] + '</div><div><b>' + esc(t[1]) + '</b><span>' + esc(t[2]) + '</span>' +
          (!member() ? '<span class="dg-mlock">' + LOCK_SVG + (priced() ? ' In the full Guide' : ' With membership') + '</span>' : '') + '</div></a>';
      }).join('') + '</div>' +
      '<div class="dg-start">' + (TOUR.started ? '' : '<button type="button" class="dg-btn" data-tour-start>&#9654; Start the tour</button>') +
      (member() ? '<p>The whole Guide is yours. Pick a tab, or let Maya walk you through it.</p>' : '<p>' + esc(priced() ? 'The full Guide is $11 or ' + pts(ST.cost) + ' points.' : 'The Guide comes with the $11 Founding Membership.') + ' <a href="#/join" style="color:var(--g);font-weight:800">How to get access</a></p>') + '</div>';
  }

  // The research is one fact at a time: the titles down the left, the chosen fact on the right (#/pulse/fact/<n>),
  // so all six fit on one screen. The last three are named for visitors and open with membership.
  var LOCKED_FACTS = ['What the cancer research shows', 'Plants cover the nutrients', 'Better for the planet'];
  function viewPulse(sub) {
    var parts = String(sub || '').split('/'), mode = parts[0] === 'listen' || parts[0] === 'watch' ? 'listen' : 'research';
    if (parts[0] === 'watch' && parts[1]) return viewWatch(decodeURIComponent(parts[1]));
    var t = toggles([['The research', '#/pulse'], ['Podcasts and interviews', '#/pulse/listen']], mode === 'research' ? 'The research' : 'Podcasts and interviews');
    var html = head('The Dairy-Free Pulse', mode === 'research' ? 'What the research says' : 'Podcasts and interviews',
      mode === 'research' ? 'Every fact with its source linked. Links, not proof, where the research says so.' : 'Our conversations about dairy: athletes, doctors, founders and the fight over the word milk.', t);
    if (mode === 'research') {
      var facts = PUB.why.concat(MEM ? MEM.why : LOCKED_FACTS.map(function (x) { return { title: x, locked: 1 }; }));
      var n = Math.max(0, Math.min(facts.length - 1, parseInt(parts[0] === 'fact' ? parts[1] : 0, 10) || 0)), f = facts[n];
      html += '<div class="dg-facts2"><div class="dg-fact-list" role="list">' + facts.map(function (x, i) {
        return '<a role="listitem" href="#/pulse/fact/' + i + '" aria-current="' + (i === n) + '"><span>' + (i + 1) + '</span>' + esc(x.title) + (x.locked ? ' ' + LOCK_SVG : '') + '</a>';
      }).join('') + '</div><div class="dg-fact">' + (f.locked
        ? gated(skel(f.title, 5), 'More facts, every one sourced', 'Cancer research, nutrients and the planet, each with its studies linked, plus our podcasts and interviews.')
        : '<h3>' + esc(f.title) + '</h3><p>' + esc(f.text) + '</p>' + sources(f.sources) +
          (n < facts.length - 1 ? '<a class="dg-fact-next" href="#/pulse/fact/' + (n + 1) + '">Next fact &rsaquo;</a>' : '')) + '</div></div>';
    } else {
      var grid = PODS ? (PODS.map(podCard).join('') || '<p class="dg-empty">No episodes yet.</p>') : '<div class="dg-loading">Loading...</div>';
      html += member() ? '<div class="dg-pods">' + grid + '</div>' : gated('<div class="dg-pods">' + grid + '</div>', 'Every episode on dairy', 'Watch our podcasts and interviews on dairy right here in the Guide.');
    }
    main.innerHTML = html;
  }
  function viewWatch(slug) {
    if (access === 'checking') { main.innerHTML = '<div class="dg-loading">Loading...</div>'; return; }
    if (!member()) { location.replace('#/pulse/listen'); return; }
    var p = null; (PODS || []).forEach(function (x) { if (x.slug === slug) p = x; });
    if (!p) { main.innerHTML = crumb([['Pulse', '#/pulse'], ['Podcasts and interviews', '#/pulse/listen']]) + '<div class="dg-loading">' + (PODS ? 'That episode is not in the Guide.' : 'Loading...') + '</div>'; return; }
    var date = p.published_at ? new Date(p.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
    main.innerHTML = crumb([['Pulse', '#/pulse'], ['Podcasts and interviews', '#/pulse/listen'], [p.title]]) +
      '<div class="dg-watch"><div>' + (p.youtube_id
        ? '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(p.youtube_id) + '?rel=0" title="' + esc(p.title) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe>'
        : '<div class="dg-pod-img" style="border-radius:12px;background-image:url(\'' + esc(p.thumbnail_url || '') + '\')"></div>') + '</div>' +
      '<div><div class="dg-pod-show">' + esc(p.podcast_show || 'Vegans Explore') + (date ? ' &middot; ' + esc(date) : '') + '</div><h2 class="dg-h1" style="font-size:22px">' + esc(p.title) + '</h2><p>' + esc(p.summary || '') + '</p>' +
      '<a class="dg-btn dg-ghost" href="/pulse/' + encodeURIComponent(p.slug) + '" target="_blank" rel="noopener">' + (p.youtube_id ? 'Episode notes' : 'Open the episode') + '</a></div></div>';
  }

  function viewBrands(catSlug) {
    var cat = catSlug ? catBySlug(catSlug) : null;
    var h = (cat ? crumb([['Brands', '#/brands'], [cat]]) : '') + head('Brands', cat ? esc(cat) : 'The brands to buy',
      'Every brand is a listing in the Vegans Explore Directory. Vote for the ones you love, and open one to see where to buy it.');
    if (!BRANDS) { main.innerHTML = h + '<div class="dg-loading">Loading brands...</div>'; return; }
    if (!member()) {
      main.innerHTML = h + '<div class="dg-chips">' + CATS.map(function (c) { return '<span class="dg-chip" style="cursor:default">' + esc(c) + '</span>'; }).join('') + '</div>' +
        gated(dirGrid('', sortBy(BRANDS, 'votes').slice(0, 6).map(dirCard).join('')), 'Every brand, sorted by what you are replacing', 'With where to buy each one. Members vote, so the best rise to the top.');
      return;
    }
    var list = cat ? BRANDS.filter(function (l) { return ((l.details && l.details.dairy_guide) || []).some(function (i) { return i.cat === cat; }); }) : BRANDS;
    var pills = ['All'].concat(CATS).map(function (c) { return [c, '#/brands' + (c === 'All' ? '' : '/' + slugify(c)), (c === 'All' && !cat) || c === cat]; });
    main.innerHTML = h + dirTools(pills, 'Search brands (oat, cashew...)', 'Search brands') + dirGrid('dgList', '');
    var sortEl = document.getElementById('dgSort'), fEl = document.getElementById('dgFilter');
    sortEl.value = sortPref;
    function draw() {
      var q = fEl.value.trim().toLowerCase();
      var rows = sortBy(list, sortPref).filter(function (l) { return !q || (l.name + ' ' + JSON.stringify((l.details && l.details.dairy_guide) || [])).toLowerCase().indexOf(q) >= 0; });
      document.getElementById('dgCount').textContent = rows.length + (rows.length === 1 ? ' brand' : ' brands');
      var listEl = document.getElementById('dgList');
      listEl.innerHTML = rows.map(dirCard).join('') || '<p class="vrd-empty">No match. Try another word.</p>';
      wireCards(listEl);
    }
    sortEl.addEventListener('change', function () { sortPref = sortEl.value; draw(); });
    fEl.addEventListener('input', draw);
    draw();
  }

  function viewSwaps(groupSlug) {
    var group = groupSlug ? groupBySlug(groupSlug) : null, ex = PUB.swap_example;
    if (!member()) {
      main.innerHTML = head('Swaps', 'Swap it out', 'How to replace each dairy item: grab one from the shelf, or make it from what is already in your pantry.') +
        '<div class="dg-swappv"><div><span class="dg-free">Free to try</span>' + swapCard(ex) + '</div>' +
        '<div class="dg-more"><h4>More swaps ' + (priced() ? 'in the full Guide' : 'with membership') + '</h4>' + SWAP_NAMES.map(function (g) {
          return '<div class="dg-more-g"><b>' + esc(g[0]) + '</b>' + g[1].map(function (x) { return '<span>' + LOCK_SVG + esc(x) + '</span>'; }).join('') + '</div>';
        }).join('') + ctaBtns(true) + '</div></div>';
      return;
    }
    var t = toggles([['All', '#/swaps']].concat(SWAP_GROUPS.map(function (g) { return [g, '#/swaps/' + slugify(g)]; })), group || 'All');
    main.innerHTML = head('Swaps', group ? esc(group) : 'Swap it out', 'Grab one from the shelf, or make it from what is already in your pantry.', t) +
      '<div class="dg-tools"><input type="search" id="dgFilter" placeholder="Search swaps (buttermilk, cream cheese...)" aria-label="Search swaps"><span class="dg-count" id="dgCountS"></span></div>' +
      '<div class="dg-grid" id="dgList"></div><div style="margin-top:14px">' + sources(MEM.swap_sources) + '</div>';
    var fEl = document.getElementById('dgFilter');
    function draw() {
      var q = fEl.value.trim().toLowerCase();
      var rows = MEM.swaps.filter(function (s) { return (!group || s.group === group) && (!q || JSON.stringify(s).toLowerCase().indexOf(q) >= 0); });
      document.getElementById('dgCountS').textContent = rows.length + (rows.length === 1 ? ' swap' : ' swaps');
      document.getElementById('dgList').innerHTML = rows.map(swapCard).join('') || '<p class="dg-empty">No match. Try another word.</p>';
    }
    fEl.addEventListener('input', draw);
    draw();
  }

  // The Cookbook (Sean, 2026-10-07; Phase 1 built 2026-10-10). Recipes come from ve-cookbook: Maya's (Guide badge) and
  // the ones members share (Waiting for approval until Sean approves them in Depot > Cookbook; 50 points when they go in).
  // Members vote for a recipe and can say "didn't work for me"; three different members pull it for retesting.
  // One thing per view: #/cookbook (the list), #/cookbook/r/<slug> (one recipe), #/cookbook/new/<step> (share one),
  // #/cookbook/mine (yours, with where each one stands).
  var COOK_URL = SB + '/functions/v1/ve-cookbook';
  var COOK = null, COOK_TITLES = null, VOTED = {}, REPORTED = {}, MINE = null, cookFilter = '';
  function cookApi(body) {
    var a = auth(), tok = a && a.isLoggedIn && a.isLoggedIn() ? a.getToken() : null, h = { 'Content-Type': 'application/json' };
    if (tok) h.Authorization = 'Bearer ' + tok;
    return fetch(COOK_URL, { method: 'POST', headers: h, body: JSON.stringify(body) }).then(function (r) { return r.json().then(function (d) { d._status = r.status; return d; }); });
  }
  function loadCookbook(then) {
    cookApi({ action: 'list', guide: 'vegan-dairy-guide' }).then(function (d) {
      if (d.member) {
        COOK = d.recipes || []; VOTED = {}; REPORTED = {};
        (d.voted || []).forEach(function (id) { VOTED[id] = 1; }); (d.reported || []).forEach(function (id) { REPORTED[id] = 1; });
      } else COOK_TITLES = (d.recipes || []).map(function (r) { return r.title; });
      if (then) then();
    }).catch(function () { if (COOK == null) COOK = member() ? [] : null; if (then) then(); });
  }
  function recipeBySlug(slug) { var f = null; (COOK || []).forEach(function (r) { if (r.slug === slug) f = r; }); return f; }
  var STATUS_TAG = { pending: ['Waiting for approval', 'wait'], live: ['Live', 'live'], retesting: ['Being retested', 'retest'], rejected: ['Needs a change', 'change'], retired: ['Not live', 'off'] };
  function tag(st) { var t = STATUS_TAG[st]; return t ? '<span class="dg-tag dg-tag-' + t[1] + '">' + esc(t[0]) + '</span>' : ''; }
  function byline(r) {
    if (r.author.kind === 'guide') {
      var art = window.VEGuideArt ? VEGuideArt(r.author.guide || 'maya', 'square') : '';
      return '<span class="dg-by">' + (art ? '<i style="background-image:url(\'' + esc(art) + '\')"></i>' : '') + '<b>' + esc(r.author.name) + '</b><span class="dg-badge">Guide</span></span>';
    }
    return '<span class="dg-by"><b>' + esc(r.author.name) + '</b><span class="dg-badge dg-badge-m">' + (r.author.kind === 'chef' ? 'Chef' : 'Member') + '</span></span>';
  }
  function recipeTile(r) {
    return '<a class="dg-rcp" href="#/cookbook/r/' + encodeURIComponent(r.slug) + '"><div class="dg-rcp-top">' + byline(r) + (r.status === 'retesting' ? tag('retesting') : '') + '</div>' +
      '<h3>' + esc(r.title) + '</h3><div class="dg-rcp-meta">' + [r.time, r.steps.length > 1 ? r.steps.length + ' steps' : 'One step'].filter(Boolean).map(esc).join(' &middot; ') +
      '<span class="dg-votes' + (VOTED[r.id] ? ' on' : '') + '">' + HEART + (r.votes || 0) + '</span></div></a>';
  }
  var HEART = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>';

  // What can I make? reads the same recipes.
  function cookRecipes() { return (COOK || []).map(function (r) { return { title: r.title, slug: r.slug, from: r.author.name, steps: r.steps, ingredients: r.ingredients }; }); }
  var pantryPick = {};
  var COOK_SUBS = [['Recipes', ''], ['What can I make?', 'make'], ['Cookbooks', 'books'], ['Chefs', 'chefs'], ['My recipes', 'mine']];
  function viewCookbook(sub) {
    var parts = String(sub || '').split('/');
    if (!member()) {
      var names = (COOK_TITLES && COOK_TITLES.length ? COOK_TITLES : RECIPE_NAMES).slice(0, 4);
      main.innerHTML = head('Cookbook', 'The Cookbook', 'An ongoing list of recipes you can make at home, and the dairy-free cookbooks people love most. Members share their own, too. The list keeps growing.') +
        '<div class="dg-cookpv"><div>' + gated('<div class="dg-grid">' + names.map(function (r) { return skel(r, 3); }).join('') + '</div>', 'Recipes and cookbooks', 'Dairy-free recipes from Maya and members, and the cookbooks members rank highest.') + '</div>' +
        '<div><div class="dg-k" style="margin-bottom:10px">Cookbooks, voted on by members</div><div class="dg-books">' + COVERS.map(function (c) {
          return '<img src="https://covers.openlibrary.org/b/id/' + c[1] + '-M.jpg" alt="' + esc(c[0]) + ' cover" loading="lazy">'; }).join('') + '</div></div></div>';
      if (COOK_TITLES == null) loadCookbook(function () { if (curTab === 'cookbook' && !member()) viewCookbook(sub); });
      return;
    }
    if (parts[0] === 'r' && parts[1]) return viewRecipe(decodeURIComponent(parts[1]));
    if (parts[0] === 'new') return viewShare(+parts[1] || 1);
    if (parts[0] === 'sent') return viewSent();
    var cur = { make: 1, books: 1, chefs: 1, mine: 1 }[parts[0]] ? parts[0] : '';
    var t = toggles(COOK_SUBS.map(function (x) { return [x[0], '#/cookbook' + (x[1] ? '/' + x[1] : '')]; }), COOK_SUBS.filter(function (x) { return x[1] === cur; })[0][0]);
    var ledes = { '': 'Recipes from Maya and members, most loved first. Made one of your own? Share it.', make: 'Tick what you have. Recipes that use the most of it come first.',
      books: 'Cookbooks from the Vegans Explore Directory, most voted first.', chefs: 'Chefs who cook dairy-free, with their recipes and what they offer.', mine: 'The recipes you shared, and where each one stands.' };
    var share = '<a class="dg-btn" href="#/cookbook/new/1">Share a recipe</a>';
    var body = '';
    if (cur === '') {
      body = '<div class="dg-tools"><input type="search" id="dgFilter" placeholder="Search recipes (cashew, ice cream...)" aria-label="Search recipes" value="' + esc(cookFilter) + '">' + share + '</div>' +
        '<div class="dg-grid" id="dgList">' + (COOK ? '' : '<div class="dg-loading">Loading recipes...</div>') + '</div>';
    } else if (cur === 'make') body = '<div class="dg-chips" id="dgPantry">' + PANTRY.map(function (p, i) { return '<button type="button" class="dg-chip" data-p="' + i + '" aria-pressed="' + !!pantryPick[i] + '">' + esc(p[0]) + '</button>'; }).join('') + '</div><div class="dg-grid" id="dgMake"></div>';
    else if (cur === 'books') body = dirTools([], 'Search cookbooks (cheese, ice cream...)', 'Search cookbooks') + dirGrid('dgList', BOOKS ? '' : '<div class="dg-loading">Loading cookbooks...</div>') +
      '<div class="dg-k" style="margin:22px 0 10px">Resources</div><div class="dg-grid">' + MEM.resources.map(function (r) {
        return '<div class="dg-card"><h3>' + esc(r.title) + '</h3><p>' + esc(r.text) + '</p>' + sources([[r.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''), r.url]]) + '</div>'; }).join('') + '</div>';
    else if (cur === 'mine') body = '<div class="dg-tools">' + share + '<span class="dg-count">50 points for every recipe that goes into the Cookbook.</span></div><div id="dgMine"><div class="dg-loading">Loading your recipes...</div></div>';
    else body = '<div class="dg-chef-empty"><div><h3>Chefs are coming to the Cookbook</h3><p>We are partnering with chefs who specialize in dairy-free cooking. Each one shares recipes here, linked to their profile with their classes, books and services.</p></div>' +
      '<a class="dg-btn" href="/partners">Are you a chef? Get featured</a></div>';
    main.innerHTML = head('Cookbook', 'The Cookbook', ledes[cur], t) + body;
    if (cur === '') {
      var fEl = document.getElementById('dgFilter');
      var drawR = function () {
        if (!COOK) return;
        var q = cookFilter.trim().toLowerCase();
        var rows = COOK.filter(function (r) { return !q || (r.title + ' ' + r.ingredients.join(' ') + ' ' + r.steps.join(' ') + ' ' + r.author.name).toLowerCase().indexOf(q) >= 0; });
        document.getElementById('dgList').innerHTML = rows.map(recipeTile).join('') || '<p class="dg-empty">' + (COOK.length ? 'No match. Try another word.' : 'No recipes yet. Be the first to share one.') + '</p>';
      };
      fEl.addEventListener('input', function () { cookFilter = fEl.value; drawR(); });
      if (COOK) drawR(); else loadCookbook(function () { if (location.hash.replace(/^#\/?/, '') === 'cookbook' || location.hash === '#/cookbook/') drawR(); });
    }
    if (cur === 'make') {
      var grid = document.getElementById('dgMake');
      var draw = function () {
        var all = cookRecipes(), picked = Object.keys(pantryPick).filter(function (k) { return pantryPick[k]; }).map(Number);
        var tile = function (r, sub) { return '<a class="dg-rcp" href="#/cookbook/r/' + encodeURIComponent(r.slug) + '"><h3>' + esc(r.title) + '</h3><div class="dg-rcp-meta">' + esc(sub) + '</div></a>'; };
        if (!picked.length) { grid.innerHTML = all.map(function (r) { return tile(r, r.from); }).join(''); return; }
        var rows = all.map(function (r) { var txt = r.title + ' ' + r.ingredients.join(' ') + ' ' + r.steps.join(' '); return { r: r, uses: picked.filter(function (i) { return PANTRY[i][1].test(txt); }) }; })
          .filter(function (x) { return x.uses.length; }).sort(function (a, b) { return b.uses.length - a.uses.length; });
        grid.innerHTML = rows.map(function (x) { return tile(x.r, 'Uses ' + x.uses.map(function (i) { return PANTRY[i][0].toLowerCase(); }).join(', ')); }).join('') ||
          '<p class="dg-empty">Nothing uses those yet. Try adding another ingredient.</p>';
      };
      document.getElementById('dgPantry').addEventListener('click', function (e) {
        var c = e.target.closest('[data-p]'); if (!c) return;
        var i = c.getAttribute('data-p'); pantryPick[i] = !pantryPick[i]; c.setAttribute('aria-pressed', String(!!pantryPick[i])); draw();
      });
      if (COOK) draw(); else loadCookbook(draw);
    }
    if (cur === 'mine') {
      cookApi({ action: 'mine' }).then(function (d) {
        MINE = d.recipes || [];
        var el = document.getElementById('dgMine'); if (!el) return;
        el.innerHTML = MINE.length ? '<div class="dg-rows">' + MINE.map(function (r) {
          return '<div class="dg-row"><div class="dg-row-main"><b>' + esc(r.title) + '</b><span>' + (r.submitted_at ? 'Sent ' + esc(new Date(r.submitted_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })) : '') +
            (r.status === 'rejected' && r.review_note ? ' &middot; ' + esc(r.review_note) : '') + '</span></div>' + tag(r.status) +
            (r.status === 'live' || r.status === 'retesting' ? '<a class="dg-btn dg-ghost" href="#/cookbook/r/' + encodeURIComponent(r.slug) + '">Open</a>' : r.status === 'rejected' ? '<a class="dg-btn dg-ghost" href="#/cookbook/new/1" data-again="' + esc(r.id) + '">Send again</a>' : '<span class="dg-btn dg-ghost" aria-disabled="true" style="opacity:.45">Open</span>') + '</div>';
        }).join('') + '</div>' : '<p class="dg-empty">You have not shared a recipe yet. It takes two minutes, and it is 50 points once it is in.</p>';
      }).catch(function () { var el = document.getElementById('dgMine'); if (el) el.innerHTML = '<p class="dg-empty">We could not load your recipes just now. Try again in a moment.</p>'; });
    }
    if (cur === 'books' && BOOKS) {
      var sortEl = document.getElementById('dgSort'), fB = document.getElementById('dgFilter');
      sortEl.value = sortPref;
      var drawB = function () {
        var q = fB.value.trim().toLowerCase();
        var rows = sortBy(BOOKS, sortPref).filter(function (l) { return !q || (l.name + ' ' + JSON.stringify(l.details || {})).toLowerCase().indexOf(q) >= 0; });
        document.getElementById('dgCount').textContent = rows.length + (rows.length === 1 ? ' cookbook' : ' cookbooks');
        var listEl = document.getElementById('dgList');
        listEl.innerHTML = rows.map(dirCard).join('') || '<p class="vrd-empty">No match. Try another word.</p>';
        wireCards(listEl);
      };
      sortEl.addEventListener('change', function () { sortPref = sortEl.value; drawB(); });
      fB.addEventListener('input', drawB);
      drawB();
    }
  }

  // One recipe on its own: who made it, what goes in, the steps, a vote and "didn't work for me".
  var reportOpen = false;
  function viewRecipe(slug) {
    var crumbs = crumb([['Cookbook', '#/cookbook'], ['Recipes', '#/cookbook']]);
    if (!COOK) { main.innerHTML = crumbs + '<div class="dg-loading">Loading...</div>'; loadCookbook(function () { if (location.hash.indexOf('#/cookbook/r/') === 0) viewRecipe(slug); }); return; }
    var r = recipeBySlug(slug);
    if (!r) { main.innerHTML = crumbs + '<p class="dg-empty">That recipe is not in the Cookbook.</p>'; return; }
    var voted = !!VOTED[r.id], reported = !!REPORTED[r.id];
    main.innerHTML = crumb([['Cookbook', '#/cookbook'], ['Recipes', '#/cookbook'], [r.title]]) +
      '<div class="dg-recipe-v"><div class="dg-recipe-h"><div>' + byline(r) + '<h2 class="dg-h1">' + esc(r.title) + '</h2>' +
      (r.summary ? '<p class="dg-lede" style="margin-bottom:6px">' + esc(r.summary) + '</p>' : '') +
      '<div class="dg-rcp-meta">' + [r.time, r.servings ? 'Serves ' + r.servings : ''].filter(Boolean).map(esc).join(' &middot; ') + '</div></div>' +
      '<div class="dg-recipe-acts">' + (r.status === 'retesting' ? tag('retesting') : '') +
      '<button type="button" class="dg-vote' + (voted ? ' on' : '') + '" data-vote="' + esc(r.id) + '" aria-pressed="' + voted + '">' + HEART + '<span>' + (voted ? 'You love this' : 'Vote') + '</span><b>' + (r.votes || 0) + '</b></button></div></div>' +
      (r.status === 'retesting' ? '<p class="dg-note" style="margin:0 0 14px">A few members said this one did not work for them, so we are making it again. It stays here while we do.</p>' : '') +
      '<div class="dg-recipe-b">' + (r.ingredients.length ? '<div><div class="dg-k">What you need</div><ul class="dg-ing">' + r.ingredients.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul></div>' : '') +
      '<div><div class="dg-k">' + (r.steps.length > 1 ? 'Steps' : 'How to make it') + '</div><ol class="dg-steps">' + r.steps.map(function (st) { return '<li>' + esc(st) + '</li>'; }).join('') + '</ol>' +
      (r.tip ? '<div class="dg-note">Tip: ' + esc(r.tip) + '</div>' : '') + '</div></div>' +
      '<div class="dg-report" id="dgReport">' + (reported ? '<p>Thank you for telling us it did not work for you. We read every note.</p>'
        : reportOpen ? '<label for="dgRepNote"><b>What went wrong?</b> (optional)</label><textarea id="dgRepNote" rows="2" maxlength="600" placeholder="Too thin, split when heated, the timing was off..."></textarea><div class="dg-btns"><button type="button" class="dg-btn dg-ghost" data-report="' + esc(r.id) + '">Send it</button><button type="button" class="dg-link" data-report-cancel>Never mind</button></div><span class="dg-status" role="status"></span>'
        : '<button type="button" class="dg-link" data-report-open>Didn\'t work for me</button>') + '</div></div>';
  }

  // Share a recipe: three steps, one view each (paginated forms, canon rule 14). The draft stays while they move between steps.
  var DRAFT = { title: '', summary: '', time_text: '', servings: '', ingredients: '', steps: '', tip: '' };
  try { var saved = JSON.parse(sessionStorage.getItem('dg_recipe_draft') || 'null'); if (saved) DRAFT = saved; } catch (e) {}
  function keepDraft() { try { sessionStorage.setItem('dg_recipe_draft', JSON.stringify(DRAFT)); } catch (e) {} }
  var SHARE_STEPS = ['About it', 'What you need', 'How to make it'];
  function field(id, label, value, opts) {
    opts = opts || {};
    return '<label class="dg-field" for="' + id + '"><span>' + esc(label) + (opts.optional ? ' <i>(optional)</i>' : '') + '</span>' + (opts.hint ? '<small>' + esc(opts.hint) + '</small>' : '') +
      (opts.rows ? '<textarea id="' + id + '" rows="' + opts.rows + '" maxlength="' + (opts.max || 4000) + '" placeholder="' + esc(opts.ph || '') + '">' + esc(value) + '</textarea>'
        : '<input id="' + id + '" type="text" maxlength="' + (opts.max || 120) + '" value="' + esc(value) + '" placeholder="' + esc(opts.ph || '') + '">') + '</label>';
  }
  function viewShare(step) {
    step = Math.max(1, Math.min(3, step));
    var steps = '<ol class="dg-stepnames">' + SHARE_STEPS.map(function (n, i) { return '<li' + (i + 1 === step ? ' aria-current="step"' : i + 1 < step ? ' class="done"' : '') + '><span>' + (i + 1) + '</span>' + esc(n) + '</li>'; }).join('') + '</ol>';
    var body = step === 1
      ? field('dgT', 'Name of the recipe', DRAFT.title, { max: 80, ph: 'Cashew queso' }) + field('dgS', 'In one line', DRAFT.summary, { optional: 1, max: 240, ph: 'A creamy dip that sets up in 15 minutes' }) +
        '<div class="dg-two">' + field('dgTm', 'How long it takes', DRAFT.time_text, { optional: 1, max: 40, ph: '15 minutes' }) + field('dgSv', 'Serves', DRAFT.servings, { optional: 1, max: 40, ph: '4' }) + '</div>'
      : step === 2
      ? field('dgI', 'Ingredients', DRAFT.ingredients, { rows: 9, hint: 'One per line, with the amount: 1 cup soaked cashews', ph: '1 cup soaked cashews\n1/2 cup salsa\n2 tbsp nutritional yeast' })
      : field('dgSt', 'Steps', DRAFT.steps, { rows: 7, hint: 'One step per line', ph: 'Blend everything until smooth.\nWarm gently and serve.' }) + field('dgTp', 'A tip', DRAFT.tip, { optional: 1, max: 300, ph: 'Add a jalapeno for heat.' }) +
        '<p class="dg-sharenote">We read every recipe before it goes in. Once it is in the Cookbook, it shows with your first name and last initial, and 50 points go into your account.</p>';
    main.innerHTML = crumb([['Cookbook', '#/cookbook'], ['Share a recipe']]) + '<h2 class="dg-h1">Share a recipe</h2>' + steps +
      '<form class="dg-form" id="dgShare" novalidate>' + body + '<span class="dg-status" role="status" id="dgShareMsg"></span>' +
      '<div class="dg-formnav"><a class="dg-btn dg-ghost" href="' + (step > 1 ? '#/cookbook/new/' + (step - 1) : '#/cookbook') + '">Back</a><span>Step ' + step + ' of 3</span>' +
      '<button type="submit" class="dg-btn">' + (step < 3 ? 'Next' : 'Send it in') + '</button></div></form>';
    var form = document.getElementById('dgShare'), msg = document.getElementById('dgShareMsg');
    function grab() {
      var v = function (id) { var el = document.getElementById(id); return el ? el.value : null; };
      if (step === 1) { DRAFT.title = v('dgT'); DRAFT.summary = v('dgS'); DRAFT.time_text = v('dgTm'); DRAFT.servings = v('dgSv'); }
      if (step === 2) DRAFT.ingredients = v('dgI');
      if (step === 3) { DRAFT.steps = v('dgSt'); DRAFT.tip = v('dgTp'); }
      keepDraft();
    }
    form.addEventListener('input', grab);
    form.addEventListener('submit', function (e) {
      e.preventDefault(); grab(); msg.textContent = '';
      var count = function (t) { return String(t || '').split(/\n+/).filter(function (x) { return x.trim(); }).length; };
      if (step === 1 && String(DRAFT.title).trim().length < 3) { msg.textContent = 'Give your recipe a name.'; return; }
      if (step === 2 && count(DRAFT.ingredients) < 2) { msg.textContent = 'List at least two ingredients, one per line.'; return; }
      if (step < 3) { location.hash = '#/cookbook/new/' + (step + 1); return; }
      if (!count(DRAFT.steps)) { msg.textContent = 'Add the steps, one per line.'; return; }
      var btn = form.querySelector('button[type="submit"]'); btn.disabled = true; btn.textContent = 'Sending...';
      cookApi({ action: 'submit', guide: 'vegan-dairy-guide', title: DRAFT.title, summary: DRAFT.summary, time_text: DRAFT.time_text, servings: DRAFT.servings, ingredients: DRAFT.ingredients, steps: DRAFT.steps, tip: DRAFT.tip }).then(function (d) {
        if (!d.ok) { msg.textContent = d.message || 'We could not send it just now. Try again in a moment.'; btn.disabled = false; btn.textContent = 'Send it in'; return; }
        DRAFT = { title: '', summary: '', time_text: '', servings: '', ingredients: '', steps: '', tip: '' }; keepDraft(); MINE = null;
        location.hash = '#/cookbook/sent';
      }).catch(function () { msg.textContent = 'We could not send it just now. Try again in a moment.'; btn.disabled = false; btn.textContent = 'Send it in'; });
    });
  }
  function viewSent() {
    main.innerHTML = crumb([['Cookbook', '#/cookbook'], ['Share a recipe']]) + '<div class="dg-done"><div class="dg-k">Sent</div><h2 class="dg-h1">Thank you. Your recipe is waiting for approval.</h2>' +
      '<p class="dg-lede">We read every recipe before it goes into the Cookbook, and we will email you when it is in. That is when 50 points go into your account.</p>' +
      '<div class="dg-btns"><a class="dg-btn" href="#/cookbook/mine">See my recipes</a><a class="dg-btn dg-ghost" href="#/cookbook">Back to the Cookbook</a></div></div>';
  }
  document.addEventListener('click', function (e) {
    var el;
    if ((el = e.target.closest('[data-again]'))) {
      (MINE || []).forEach(function (r) {
        if (r.id !== el.getAttribute('data-again')) return;
        DRAFT = { title: r.title, summary: r.summary || '', time_text: r.time || '', servings: r.servings || '', ingredients: r.ingredients.join('\n'), steps: r.steps.join('\n'), tip: r.tip || '' }; keepDraft();
      });
      return;
    }
    if (e.target.closest('[data-report-open]')) { reportOpen = true; route(); return; }
    if (e.target.closest('[data-report-cancel]')) { reportOpen = false; route(); return; }
    if ((el = e.target.closest('[data-report]'))) {
      var id = el.getAttribute('data-report'), note = (document.getElementById('dgRepNote') || {}).value || '';
      el.disabled = true;
      cookApi({ action: 'report', recipe_id: id, note: note }).then(function (d) {
        if (!d.ok) { var m = document.querySelector('#dgReport .dg-status'); if (m) m.textContent = d.message || 'We could not send it just now.'; el.disabled = false; return; }
        REPORTED[id] = 1; reportOpen = false;
        (COOK || []).forEach(function (r) { if (r.id === id && d.status) r.status = d.status; });
        route();
      }).catch(function () { el.disabled = false; });
      return;
    }
    if ((el = e.target.closest('[data-vote]'))) {
      var rid = el.getAttribute('data-vote'), on = !VOTED[rid];
      el.disabled = true;
      cookApi({ action: 'vote', recipe_id: rid, on: on }).then(function (d) {
        el.disabled = false;
        if (!d.ok) { el.title = d.message || ''; return; }
        if (on) VOTED[rid] = 1; else delete VOTED[rid];
        (COOK || []).forEach(function (r) { if (r.id === rid) r.votes = d.vote_count; });
        route();
      }).catch(function () { el.disabled = false; });
    }
  });

  function viewLook() {
    var h = head('See for yourself', 'How milk is made', 'Plain facts from USDA and dairy-industry sources about how milk is produced on US farms. No graphic images, and always behind a clear warning.');
    if (!member()) { main.innerHTML = h + gated('<div class="dg-grid">' + skel('', 3) + skel('', 3) + skel('', 3) + skel('', 3) + '</div>', 'When you\'re ready, the plain facts', 'Seven sourced points on how US dairy farms work, and where to go further.'); return; }
    var L = MEM.look;
    if (!lookOpen) {
      main.innerHTML = h + '<div class="dg-door"><p>' + esc(L.door) + '</p><div class="dg-btns"><button type="button" class="dg-btn" id="dgLookGo">Read on</button><a class="dg-btn dg-ghost" href="#/brands">Skip to the brands</a></div></div>';
      document.getElementById('dgLookGo').addEventListener('click', function () { lookOpen = true; viewLook(); });
      return;
    }
    main.innerHTML = head('See for yourself', 'How milk is made') + '<ol class="dg-facts">' + L.facts.map(function (f) { return '<li><strong>' + esc(f[0]) + '</strong> ' + esc(f[1]) + '</li>'; }).join('') + '</ol>' + sources(L.sources) +
      '<p class="dg-lede" style="margin-top:16px"><strong>Go further:</strong> ' + esc(L.further) + '</p>';
  }

  // The last stop of the tour (Sean, 2026-10-09: "how to get access, why you should get access, that it automatically
  // comes if you're already a Vegans Explore member... a one-time founding membership of $11").
  function viewJoin() {
    if (member()) {
      var how = ST.via === 'passport' ? 'Passport opens every Guide, this one included.' : ST.via === 'purchase' && priced() ? 'You unlocked it, and it is yours to keep.'
        : 'It came with your Founding Membership.';
      main.innerHTML = head('Your Guide', 'The whole Guide is yours', how + ' Thank you for being here.') + '<a class="dg-btn" href="#/">Back to the overview</a>'; return;
    }
    var m = mode(), list = '<div class="dg-access"><ul>' +
      '<li><b>The Dairy-Free Pulse:</b> every research fact with its source, and our podcasts and interviews on dairy.</li>' +
      '<li><b>The brands to buy</b>, sorted by what you are replacing, with the stores that carry them.</li>' +
      '<li><b>Swaps</b> from the shelf or your pantry, and the Cookbook: recipes, cookbooks and chefs.</li>' +
      '<li><b>The community:</b> your member dashboard, Directory votes, the Community Board and points.</li></ul></div>';
    var status = '<span class="dg-status" role="status" style="display:block;margin-top:10px;color:#8a5a00"></span>';
    if (!priced()) {
      main.innerHTML = head('Get access', 'The Dairy Guide comes with membership', 'One $11 Founding Membership, one time, opens this Guide and the whole Vegans Explore community.') + list;
      main.querySelector('.dg-access').insertAdjacentHTML('beforeend',
        '<div class="dg-pricebox"><div class="dg-big">$11<small>one time</small></div><p>' + (m === 'activate' ? 'Your account is not a Founding Member yet. Become one and the Guide opens right away.' :
          'Already a Vegans Explore member? It is already yours: <a href="#" data-signin>sign in</a> and the Guide opens.') + '</p>' +
        '<button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button>' + status + '</div>');
      return;
    }
    var passport = '<p class="dg-pp">Or get <a href="/passport">Passport</a>: it opens every Guide.</p>', box;
    if (m === 'unlock') {
      box = '<div class="dg-big">' + pts(ST.cost) + '<small>points</small></div><p>You have ' + pts(ST.balance) + ' points. Unlock the Guide and it is yours to keep.</p>' +
        '<button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button>' + status;
    } else if (m === 'topup') {
      box = '<div class="dg-big">' + pts(ST.cost) + '<small>points</small></div><p>You have ' + pts(ST.balance) + '. Add points: every dollar becomes 100 points. A contribution to our community, not a tax-deductible donation.</p>' +
        '<div class="dg-topups">' + [11, 25, 50].map(function (n) { return '<button type="button" class="dg-btn' + (n === 11 ? '' : ' dg-ghost') + '" data-topup="' + n + '">$' + n + ' <small>' + pts(n * 100) + ' points</small></button>'; }).join('') + '</div>' + status + passport;
    } else {
      box = '<div class="dg-big">$11<small>one time</small></div><p>' + (m === 'activate' ? 'Your account is not a Founding Member yet. Become one: $11, one time, gives you ' + pts(ST.cost) + ' points, enough for this Guide.' :
          'Join for $11, one time, and you get ' + pts(ST.cost) + ' points: enough for this Guide. Already a member? <a href="#" data-signin>Sign in</a>.') + '</p>' +
        '<button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button>' + status + passport;
    }
    main.innerHTML = head('Get access', 'Open the whole Dairy Guide', 'Every Vegans Explore Guide is $11 or ' + pts(ST.cost) + ' points. The $11 Founding Membership, one time, gives you ' + pts(ST.cost) + ' points and the whole community.') + list;
    main.querySelector('.dg-access').insertAdjacentHTML('beforeend', '<div class="dg-pricebox">' + box + '</div>');
  }

  // A Directory listing inside the Guide (Sean, 2026-10-08: "when we click on one of the listings, we need to stay in
  // this environment"). "Walmart, Target, Kroger": each store we have a page for links to its Vegan aisle.
  function whereLinks(where, productId) {
    return String(where || '').split(/(\s*,\s*|\s+and\s+|;\s*)/).map(function (part) {
      var st = STORES[part.trim().toLowerCase()];
      if (!st) return esc(part);
      return '<a class="dg-store" href="#/listing/' + encodeURIComponent(st.slug) + (productId ? '/' + encodeURIComponent(productId) : '') + '">' + esc(part.trim()) + '</a>';
    }).join('');
  }
  function storeOf(slug) { for (var k in STORES) if (STORES[k].slug === slug) return STORES[k]; return null; }
  function isBook(slug) { var b = false; (BOOKS || []).forEach(function (x) { if (x.slug === slug) b = true; }); return b; }
  function viewListing(slug) {
    var parts = String(slug).split('/'); slug = parts[0];
    var productId = parts[1] || '', store = storeOf(slug);
    if (!BRANDS && !BOOKS) { main.innerHTML = crumb([['Brands', '#/brands'], ['Loading']]) + '<div class="dg-loading">Loading...</div>'; return; }
    var l = null, book = false;
    (BRANDS || []).forEach(function (b) { if (b.slug === slug) l = b; });
    if (!l) (BOOKS || []).forEach(function (b) { if (b.slug === slug) { l = b; book = true; } });
    var name = l ? (book && ((l.details || {}).dairy_guide_book || {}).title) || l.name : store ? store.name : 'Listing';
    var from = null;
    if (store && productId) (BRANDS || []).forEach(function (b) { ((b.details || {}).dairy_guide || []).forEach(function (i) { if (PRODUCTS[b.id + '|' + i.cat] === productId) from = [b, i]; }); });
    var html = crumb(book ? [['Cookbook', '#/cookbook'], ['Cookbooks', '#/cookbook/books'], [name]]
      : from ? [['Brands', '#/brands'], [from[0].name, '#/listing/' + encodeURIComponent(from[0].slug)], [name]] : [['Brands', '#/brands'], [name]]);
    if (from) html += '<div class="dg-inguide"><div class="dg-inguide-k">At ' + esc(name) + '</div><div class="dg-inguide-i"><b>' + esc(from[0].name + ' ' + from[1].cat) + '</b><span>Picked out in ' + esc(name) + '\'s Vegan aisle below, with everything else from our Guides that ' + esc(name) + ' carries.</span></div></div>';
    if (l && !book && ((l.details || {}).dairy_guide || []).length) {
      html += '<div class="dg-inguide"><div class="dg-inguide-k">In the Dairy Guide</div><div class="dg-inguide-row">' + l.details.dairy_guide.map(function (i) {
        var pid = PRODUCTS[l.id + '|' + i.cat], ps = null; for (var k in PRODUCT_BY_SLUG) if (PRODUCT_BY_SLUG[k].id === pid) ps = k;
        return '<div class="dg-inguide-i"><b>' + (ps ? '<a class="dg-store" href="#/product/' + encodeURIComponent(ps) + '">' + esc(i.cat) + '</a>' : esc(i.cat)) + '</b><span>Made from ' + esc(String(i.base || '').charAt(0).toLowerCase() + String(i.base || '').slice(1)) + (i.where ? '. Find it at ' + whereLinks(i.where, pid) : '') + '.</span>' + (i.note ? '<em>' + esc(i.note) + '</em>' : '') + '</div>';
      }).join('') + '</div></div>';
    } else if (l && book) {
      var bk = (l.details || {}).dairy_guide_book || {};
      html += '<div class="dg-inguide"><div class="dg-inguide-k">In the Dairy Guide</div><div class="dg-inguide-row"><div class="dg-inguide-i"><b>' + esc(bk.title || l.name) + '</b><span>' +
        esc([bk.author, [bk.publisher, bk.year].filter(Boolean).join(', '), bk.topic].filter(Boolean).join(' · ')) + '</span>' + (bk.note ? '<em>' + esc(bk.note) + '</em>' : '') + '</div></div></div>';
    }
    main.innerHTML = html;
    mountFrame('/directory/' + encodeURIComponent(slug) + (productId ? '?product=' + encodeURIComponent(productId) : ''), name);
  }
  // A product inside the Guide (#/product/<slug>): its brand's page opened on the Products tab with that product.
  function viewProduct(slug) {
    if (!BRANDS) { main.innerHTML = crumb([['Brands', '#/brands'], ['Loading']]) + '<div class="dg-loading">Loading...</div>'; return; }
    var p = PRODUCT_BY_SLUG[slug], b = null;
    if (p) (BRANDS || []).forEach(function (x) { if (x.id === p.brand_listing_id) b = x; });
    var label = p ? (p.name || p.product_type) : 'Product';
    main.innerHTML = crumb(b ? [['Brands', '#/brands'], [b.name, '#/listing/' + encodeURIComponent(b.slug)], [label]] : [['Brands', '#/brands'], [label]]);
    mountFrame(b ? '/directory/' + encodeURIComponent(b.slug) + '?tab=products&product=' + encodeURIComponent(slug) : '/products/' + encodeURIComponent(slug), (b ? b.name + ' ' : '') + label);
  }
  // The framed Directory page, sized to fit; its links to a listing or a product go through the Guide's address bar.
  function mountFrame(src, title) {
    main.insertAdjacentHTML('beforeend', '<div class="dg-lframe"><iframe id="dgListingFrame" title="' + esc(title) + '" src="' + esc(src) + '"></iframe></div>');
    var f = document.getElementById('dgListingFrame');
    f.addEventListener('load', function () {
      var d; try { d = f.contentDocument; } catch (e) { return; }
      if (!d || !d.body) return;
      var last = 0;
      function fit() { var h = d.body.scrollHeight; if (Math.abs(h - last) < 2) return; last = h; f.style.height = Math.max(600, Math.min(20000, h)) + 'px'; f.setAttribute('scrolling', 'no'); }
      fit();
      if (window.ResizeObserver) new ResizeObserver(fit).observe(d.body);
      d.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href]'); if (!a || a.target || e.defaultPrevented) return;
        var u; try { u = new URL(a.href, d.baseURI); } catch (x) { return; }
        if (u.origin !== location.origin || /^#/.test(a.getAttribute('href') || '')) return;
        var m;
        e.preventDefault();
        if ((m = u.pathname.match(/^\/products\/([a-z0-9-]+)\/?$/))) location.hash = '#/product/' + m[1];
        else if ((m = u.pathname.match(/^\/directory\/([a-z0-9-]+)\/?$/))) location.hash = '#/listing/' + m[1] + (u.searchParams.get('product') ? '/' + encodeURIComponent(u.searchParams.get('product')) : '');
        else location.href = u.href;
      });
    });
  }

  // ---------- search (members) ----------
  function index() {
    var out = [];
    PUB.why.concat(MEM ? MEM.why : []).forEach(function (w) { out.push({ t: 'Pulse', title: w.title, text: w.text, href: '#/pulse' }); });
    if (!MEM) return out;
    (PODS || []).forEach(function (p) { out.push({ t: 'Pulse', title: p.title, text: (p.podcast_show || '') + '. ' + (p.summary || ''), href: '#/pulse/watch/' + encodeURIComponent(p.slug) }); });
    (BRANDS || []).forEach(function (l) {
      ((l.details && l.details.dairy_guide) || []).forEach(function (i) { out.push({ t: 'Brands', title: l.name + ', ' + i.cat, text: 'Made from ' + i.base + '. Where: ' + i.where + (i.note ? '. ' + i.note : ''), href: '#/listing/' + encodeURIComponent(l.slug) }); });
    });
    MEM.swaps.forEach(function (s) { out.push({ t: 'Swaps', title: s.replace, text: 'Shelf: ' + s.shelf + ' Pantry: ' + s.pantry + (s.tip ? ' ' + s.tip : ''), href: '#/swaps/' + slugify(s.group) }); });
    (COOK || []).forEach(function (r) { out.push({ t: 'Cookbook', title: r.title, text: 'By ' + r.author.name + ': ' + r.ingredients.join(', ') + ' ' + r.steps.join(' '), href: '#/cookbook/r/' + encodeURIComponent(r.slug) }); });
    (BOOKS || []).forEach(function (l) { var b = (l.details && l.details.dairy_guide_book) || {}; out.push({ t: 'Cookbook', title: b.title || l.name, text: 'Cookbook by ' + [b.author, b.topic].filter(Boolean).join(', '), href: '#/listing/' + encodeURIComponent(l.slug) }); });
    MEM.look.facts.forEach(function (f) { out.push({ t: 'See for yourself', title: f[0], text: f[1], href: '#/look' }); });
    return out;
  }
  function viewSearch(q) {
    if (qEl.value !== q) qEl.value = q;
    var words = q.toLowerCase().split(/\s+/).filter(Boolean);
    var hits = index().filter(function (h) { var hay = (h.title + ' ' + h.text).toLowerCase(); return words.every(function (w) { return hay.indexOf(w) >= 0; }); });
    var groups = {};
    hits.forEach(function (h) { (groups[h.t] = groups[h.t] || []).push(h); });
    var html = crumb([['Search']]) + '<h2 class="dg-h1">' + hits.length + (hits.length === 1 ? ' result' : ' results') + ' for &ldquo;' + esc(q) + '&rdquo;</h2><div class="dg-res">';
    ['Brands', 'Swaps', 'Cookbook', 'Pulse', 'See for yourself'].forEach(function (g) {
      if (!groups[g]) return;
      html += '<h2>' + esc(g) + ' (' + groups[g].length + ')</h2><div class="dg-grid">' + groups[g].slice(0, 24).map(function (h) {
        return '<a class="dg-card dg-hit" href="' + h.href + '"><h3>' + esc(h.title) + '</h3><p>' + esc(h.text.length > 160 ? h.text.slice(0, 157) + '...' : h.text) + '</p></a>';
      }).join('') + '</div>';
    });
    if (!hits.length) html += '<p class="dg-empty">Nothing matched. Try a brand (Oatly), an item (cream cheese) or an ingredient (cashew).</p>';
    main.innerHTML = html + '</div>';
  }
  var tSearch;
  qEl.addEventListener('input', function () {
    clearTimeout(tSearch);
    tSearch = setTimeout(function () {
      var q = qEl.value.trim(), h = q ? '#/search/' + encodeURIComponent(q) : '#/';
      if (/^#\/search\//.test(location.hash) && q) { history.replaceState(null, '', location.pathname + location.search + h); route(); } else location.hash = h;
    }, 180);
  });
  document.getElementById('dgSearchForm').addEventListener('submit', function (e) { e.preventDefault(); var q = qEl.value.trim(); if (q) location.hash = '#/search/' + encodeURIComponent(q); });

  // ---------- Maya, on the right of every tab ----------
  var TOUR = { started: false, playing: false, paused: false, shown: null };
  var mayaBox = document.getElementById('dgMaya'), bubble = document.getElementById('dgBubble'), playBtn = document.getElementById('dgPlay'), tourEl = document.getElementById('dgTour');
  var vid = document.createElement('video');
  vid.preload = 'metadata'; vid.playsInline = true; vid.setAttribute('playsinline', '');
  vid.setAttribute('aria-label', 'Maya, your Guide');
  function clip(k) { return k === 'join' && priced() ? CLIPS.join_points || null : CLIPS[k] || null; }
  function cueMaya(k) {
    var c = clip(k);
    if (TOUR.shown === k) return;
    TOUR.shown = k; stopMaya();
    [].forEach.call(vid.querySelectorAll('track'), function (t) { t.remove(); });
    if (c) {
      if (c.poster) vid.poster = c.poster; else vid.removeAttribute('poster');
      vid.src = c.webm && !vid.canPlayType('video/mp4') ? c.webm : c.video;
      if (c.captions) { var tr = document.createElement('track'); tr.kind = 'captions'; tr.src = c.captions; tr.srclang = 'en'; tr.label = 'English'; tr.default = true; vid.appendChild(tr); }
      if (!vid.parentNode) mayaBox.appendChild(vid);
      vid.style.display = '';
    } else { vid.removeAttribute('src'); vid.load(); vid.style.display = 'none'; }
    mayaBox.classList.remove('dg-shift'); void mayaBox.offsetWidth; mayaBox.classList.add('dg-shift');
  }
  function playMaya() {
    if (!clip(TOUR.shown)) { drawMaya(); return; }
    vid.play().then(function () { TOUR.playing = true; drawMaya(); }).catch(function () { TOUR.playing = false; drawMaya(); });
  }
  function stopMaya() { vid.pause(); TOUR.playing = false; }
  function startTour() {
    TOUR.started = true; TOUR.paused = false;
    [].forEach.call(document.querySelectorAll('[data-tour-start]'), function (b) { b.remove(); });
    playMaya();
  }
  vid.addEventListener('ended', function () { TOUR.playing = false; drawMaya(); });
  // A browser that says it can play MP4 but cannot decode it gets the WebM copy instead.
  vid.addEventListener('error', function () {
    var c = clip(TOUR.shown);
    if (c && c.webm && vid.getAttribute('src') !== c.webm) { vid.src = c.webm; if (TOUR.started && !TOUR.paused) playMaya(); }
  });
  vid.addEventListener('click', function () { if (!TOUR.started) return startTour(); if (TOUR.playing) { TOUR.paused = true; stopMaya(); drawMaya(); } else { TOUR.paused = false; playMaya(); } });
  playBtn.addEventListener('click', function () { if (!TOUR.started) return startTour(); if (TOUR.playing) { TOUR.paused = true; stopMaya(); } else { TOUR.paused = false; playMaya(); } drawMaya(); });
  function drawMaya() {
    var t = tab(curTab), list = tabs(), i = 0;
    list.forEach(function (x, n) { if (x.k === curTab) i = n; });
    bubble.textContent = TOUR.started && t.playing ? t.playing : priced() && t.sayPoints ? t.sayPoints : t.say; // the welcome carries its own captions
    var has = !!clip(curTab);
    playBtn.hidden = TOUR.started && !has;
    playBtn.classList.toggle('go', !TOUR.started);
    playBtn.innerHTML = !TOUR.started ? '&#9654; Start the tour' : TOUR.playing ? 'Pause Maya' : '&#9654; Watch Maya';
    tourEl.innerHTML = '<a class="dg-tnav" href="' + href(list[Math.max(0, i - 1)].k) + '"' + (i ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Back</a><span>' + (i + 1) + ' of ' + list.length + '</span>' +
      '<a class="dg-tnav next" href="' + href(list[Math.min(list.length - 1, i + 1)].k) + '"' + (i < list.length - 1 ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Next</a>';
  }

  // ---------- router ----------
  function route() {
    var parts = (location.hash || '').replace(/^#\/?/, '').split('/');
    var view = parts[0] || 'overview', sub = parts.slice(1).join('/');
    if (view === 'home') view = 'overview';
    if (view === 'why') view = 'pulse';
    if (view === 'search' && !sub) view = 'overview';
    if (view === 'search' && !member()) view = 'overview';
    if (view === 'recipes') view = 'cookbook';
    if (view === 'books') { view = 'cookbook'; sub = 'books'; }
    var known = { overview: 1, pulse: 1, brands: 1, swaps: 1, cookbook: 1, look: 1, join: 1, search: 1, listing: 1, product: 1 };
    if (!known[view]) view = 'overview';
    document.body.classList.toggle('dg-member', member());
    drawJoinbox();
    var key = view;
    if (view === 'product') key = 'brands';
    if (view === 'listing') key = isBook(decodeURIComponent(sub).split('/')[0]) ? 'cookbook' : 'brands';
    if (view === 'search') key = curTab;
    if (view === 'join' && member()) key = 'overview';
    drawMenu(view === 'search' ? 'search' : key);
    if (view !== 'search' && qEl.value && document.activeElement !== qEl) qEl.value = '';
    ({ overview: viewOverview, pulse: function () { viewPulse(sub); }, brands: function () { viewBrands(sub); }, swaps: function () { viewSwaps(sub); },
       cookbook: function () { viewCookbook(sub); }, look: viewLook, join: viewJoin, search: function () { viewSearch(decodeURIComponent(sub)); },
       listing: function () { viewListing(decodeURIComponent(sub)); }, product: function () { viewProduct(decodeURIComponent(sub)); } })[view]();
    var moved = key !== curTab;
    curTab = key;
    cueMaya(key);
    if (moved && TOUR.started && !TOUR.paused) playMaya();
    drawMaya();
    if (view !== 'search') { main.scrollTop = 0; if (!document.documentElement.classList.contains('dg-fit') || window.innerWidth <= 900) window.scrollTo(0, 0); }
  }
  window.addEventListener('hashchange', function () { reportOpen = false; route(); });

  // ---------- access ----------
  function api(action, tok) {
    return fetch(UNLOCK_URL + '?action=' + action, {
      method: 'POST', headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, token: tok || undefined })
    }).then(function (r) { return r.json(); });
  }
  function rest(url) { return fetch(url, { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } }).then(function (r) { return r.json(); }); }
  function becomeMember(html) {
    var t = document.createElement('template'); t.innerHTML = html;
    var el = t.content.getElementById('dg-data');
    MEM = el ? JSON.parse(el.textContent) : null;
    access = MEM ? 'member' : 'pending';
    route();
    if (MEM) loadCookbook(function () { if (curTab === 'cookbook' || /^#\/search\//.test(location.hash)) route(); });
  }
  // Brands, cookbooks and the Pulse episodes are public rows, so everyone loads them: members use them, and the blurred
  // previews show the real thing to everyone else.
  function loadPublic() {
    Promise.all([rest(BRANDS_URL), rest(BOOKS_URL), rest(PRODUCTS_URL).catch(function () { return []; }), rest(ALIASES_URL).catch(function () { return []; }), rest(PULSE_URL).catch(function () { return []; })]).then(function (r) {
      BRANDS = Array.isArray(r[0]) ? r[0] : []; BOOKS = Array.isArray(r[1]) ? r[1] : [];
      (Array.isArray(r[2]) ? r[2] : []).forEach(function (p) { PRODUCTS[p.brand_listing_id + '|' + p.product_type] = p.id; PRODUCT_BY_SLUG[p.slug] = p; });
      (Array.isArray(r[3]) ? r[3] : []).forEach(function (a) { if (a.listings && a.listings.status === 'approved') STORES[a.alias] = a.listings; });
      var pods = Array.isArray(r[4]) ? r[4] : [];
      PODS = PULSE_PICKS.map(function (s) { return pods.filter(function (p) { return p.slug === s; })[0]; }).filter(Boolean);
      route();
    }).catch(function () { BRANDS = BRANDS || []; BOOKS = BOOKS || []; PODS = PODS || []; route(); });
  }
  function setStatus(msg) { [].forEach.call(document.querySelectorAll('.dg-status'), function (e) { e.textContent = msg; }); }

  document.addEventListener('click', function (e) {
    var a = auth();
    if (e.target.closest('[data-tour-start]')) { startTour(); drawMaya(); return; }
    if (e.target.closest('[data-signin]')) {
      e.preventDefault();
      if (a) a.showAuthModal('Sign in and the Dairy Guide opens if you are a member.', function () { location.reload(); }, 'login');
      return;
    }
    var tu = e.target.closest('[data-topup]');
    if (tu) { topUp(+tu.getAttribute('data-topup'), tu); return; }
    var jb = e.target.closest('[data-join]');
    if (jb) {
      if (!a || access === 'checking' || jb.disabled) return;
      stopMaya(); drawMaya();
      var m = mode();
      if (m === 'join') a.showAuthModal(priced() ? 'Create your account. Then become a Founding Member: $11 gives you ' + pts(ST.cost) + ' points, enough for the Dairy Guide.'
        : 'Create your account. Then become a Founding Member and the Dairy Guide opens.', function () { location.reload(); }, 'signup');
      else if (m === 'activate') a.showActivateModal(priced() ? 'Become a Founding Member: $11, one time, gives you ' + pts(ST.cost) + ' points, enough for the Dairy Guide, and opens the full community.'
        : 'The Dairy Guide comes with the $11 Founding Membership, one time. It also opens the full community.');
      else if (m === 'unlock') unlock(jb);
      else location.hash = '#/join';
    }
  });

  // Spend the points (ve-guide-unlock unlock, spend_points_for_guide), then open the Guide.
  function unlock(btn) {
    var tok = auth() && auth().getToken();
    if (!tok) return;
    btn.disabled = true; btn.textContent = 'Unlocking...';
    api('unlock', tok).then(function (d) {
      if (d && d.unlocked) return api('open', tok).then(function (o) { take(o); if (o && o.unlocked && o.html) becomeMember(o.html); else throw 0; });
      if (d && d.error === 'insufficient_points') { ST.balance = d.balance || 0; route(); return; }
      throw 0;
    }).catch(function () { btn.disabled = false; btn.textContent = ctaLabel(); setStatus('That did not go through, and no points were spent. Try again in a minute.'); });
  }
  // Add points (Sean, 2026-10-10): the same contribution as the dashboard's Contribute and Your Guide's top-up
  // (ve-entry-checkout, $11 or more, every dollar becomes 100 points), back here with ?topup=success.
  function topUp(dollars, btn) {
    var tok = auth() && auth().getToken();
    if (!tok) return;
    btn.disabled = true; var was = btn.innerHTML; btn.textContent = 'Opening checkout...';
    var back = location.origin + location.pathname + '?topup=';
    fetch(SB + '/functions/v1/ve-entry-checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
      body: JSON.stringify({ amount_cents: dollars * 100, success_url: back + 'success', cancel_url: back + 'cancelled' }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.url) { (window.top || window).location.href = d.url; return; } throw 0; })
      .catch(function () { btn.disabled = false; btn.innerHTML = was; setStatus('Checkout did not open. Try again in a minute.'); });
  }

  // Back from checkout. A membership on the old rule, or Passport, opens the Guide; on points, the new points open
  // the unlock button. Stripe's webhook can take a few seconds, so this asks again for about 20 seconds.
  function confirmAfterCheckout(tok, tries, what) {
    setStatus(what === 'topup' ? 'Adding your points...' : 'Confirming your membership...');
    access = 'pending';
    api('open', tok).then(function (d) {
      take(d);
      if (d && d.unlocked && d.html) { setStatus(''); becomeMember(d.html); return; }
      if (priced() && ST.balance >= ST.cost && (what === 'topup' || ST.active)) {
        location.hash = '#/join'; route();
        setStatus('Your points are in. Unlock the Guide with them.'); return;
      }
      if (tries > 0) { setTimeout(function () { confirmAfterCheckout(tok, tries - 1, what); }, 2500); return; }
      route();
      setStatus('Your payment went through. It can take a minute to show here: refresh this page shortly.');
    }).catch(function () { if (tries > 0) setTimeout(function () { confirmAfterCheckout(tok, tries - 1, what); }, 2500); else route(); });
  }

  function init() {
    if (window.VERegionDirectory) VERegionDirectory.css(); // the Directory card's own styles
    document.documentElement.classList.add('dg-fit');
    if (window.VEGuideArt) { var art = VEGuideArt('maya', 'square'); if (art) mayaBox.style.backgroundImage = "url('" + art + "')"; }
    route();
    loadPublic();
    var a = auth();
    var viewAs = a && a.getViewAs ? a.getViewAs() : null;
    var tok = a && a.isLoggedIn() && !viewAs ? a.getToken() : null;
    // Visitors ask too: the price (access_rule, cost) decides the offer they see.
    if (!tok) { access = viewAs && viewAs.mode !== 'public' ? 'pending' : 'guest'; route(); api('status').then(function (d) { take(d); route(); }).catch(function () {}); return; }
    var params = new URLSearchParams(location.search), back = params.get('activate') ? 'activate' : params.get('topup') ? 'topup' : null, ok = params.get(back) === 'success';
    if (back) { params.delete(back); history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash); }
    if (ok) { confirmAfterCheckout(tok, 8, back); return; }
    api('open', tok).then(function (d) {
      take(d);
      if (d && d.unlocked && d.html) becomeMember(d.html);
      else { access = d && d.loggedIn ? 'pending' : 'guest'; route(); }
    }).catch(function () { access = 'pending'; route(); setStatus('We could not check your membership just now. Refresh to try again.'); });
  }

  if (window.VEAuth) init(); else window.addEventListener('load', init);
})();
