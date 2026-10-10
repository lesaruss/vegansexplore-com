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
 * Access: the Guide comes with the $11 Founding Membership. The members-only text (research 4-6, See for yourself,
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
    { k: 'join', label: 'Get access', guest: 1, say: 'The Guide comes with the eleven dollar Founding Membership, one time. Already a member? Sign in and it opens. Come join us!' }
  ];
  // Maya on camera. Overview is her welcome; every other tab gets a clip under 10 seconds (el-media voice, Wan 2.7,
  // scripts/brand-door/assemble_r5.py), stored in vegan-media/media/maya/dairy-guide/. Until a tab has one, she shows
  // her picture and the bubble carries her words.
  var CLIP_BASE = SB + '/storage/v1/object/public/vegan-media/media/maya/dairy-guide/';
  var CLIPS = {
    overview: { video: '/public/guides/maya-dairy-welcome.mp4', webm: '/public/guides/maya-dairy-welcome.webm', captions: '/public/guides/maya-dairy-welcome.vtt' }
  };
  // Recorded 2026-10-10 (Sean approved the lines): one pose per tab, from her round 5 Oatly start pictures.
  ['pulse', 'brands', 'swaps', 'cookbook', 'look', 'join'].forEach(function (k) {
    CLIPS[k] = { video: CLIP_BASE + 'dg-' + k + '.mp4', poster: CLIP_BASE + 'dg-poster-' + k + '.jpg' };
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
        (locked && t.lock ? ' <span class="dg-lk" aria-label="with membership">' + LOCK_SVG + '</span>' : '') + '</a>';
    }).join('');
    menuSel.innerHTML = tabs().map(function (t) { return '<option value="' + t.k + '"' + (t.k === cur ? ' selected' : '') + '>' + esc(t.label) + (locked && t.lock ? ' (members)' : '') + '</option>'; }).join('') +
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
    var pending = access === 'pending';
    return '<div class="dg-gated"><div class="dg-blur" aria-hidden="true">' + inner + '</div><div class="dg-gate"><span class="dg-lockic">' + LOCK_SVG.replace(/width="11" height="11"/, 'width="16" height="16"').replace('currentColor', '#1f5f22') + '</span>' +
      '<b>' + esc(title) + '</b><p>' + esc(text) + ' It comes with the $11 Founding Membership, one time.</p>' +
      '<div class="dg-btns"><button type="button" class="dg-btn" data-join>' + (pending ? 'Become a Founding Member' : 'Join for $11') + '</button>' +
      (pending ? '' : '<a href="#" data-signin>Already a member? Sign in</a>') + '</div></div></div>';
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
  function recipeCard(r, sub) {
    return '<div class="dg-card dg-recipe"><h3>' + esc(r.title) + '</h3><div class="dg-bcat">' + esc(sub) + '</div>' +
      (r.steps.length > 1 ? '<ol>' + r.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' : '<p style="margin-top:8px">' + esc(r.steps[0]) + '</p>') +
      (r.tip ? '<div class="dg-note">Tip: ' + esc(r.tip) + '</div>' : '') + '</div>';
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
          (!member() ? '<span class="dg-mlock">' + LOCK_SVG + ' With membership</span>' : '') + '</div></a>';
      }).join('') + '</div>' +
      '<div class="dg-start">' + (TOUR.started ? '' : '<button type="button" class="dg-btn" data-tour-start>&#9654; Start the tour</button>') +
      (member() ? '<p>The whole Guide is yours. Pick a tab, or let Maya walk you through it.</p>' : '<p>The Guide comes with the $11 Founding Membership. <a href="#/join" style="color:var(--g);font-weight:800">How to get access</a></p>') + '</div>';
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
        '<div class="dg-more"><h4>More swaps with membership</h4>' + SWAP_NAMES.map(function (g) {
          return '<div class="dg-more-g"><b>' + esc(g[0]) + '</b>' + g[1].map(function (x) { return '<span>' + LOCK_SVG + esc(x) + '</span>'; }).join('') + '</div>';
        }).join('') + '<div class="dg-btns" style="margin-top:6px"><button type="button" class="dg-btn" data-join>' + (access === 'pending' ? 'Become a Founding Member' : 'Join for $11') + '</button>' +
        (access === 'pending' ? '' : '<a href="#" data-signin style="font-size:12.5px;font-weight:800;color:var(--g)">Already a member? Sign in</a>') + '</div></div></div>';
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

  // The Cookbook (Sean, 2026-10-07): recipes, cookbooks and chefs, plus "What can I make?" from what is in the kitchen.
  function cookRecipes() {
    var ours = MEM.recipes.map(function (r) { return { title: r.title, from: 'Vegans Explore kitchen', time: r.time, steps: r.steps, tip: r.tip }; });
    var pantry = MEM.swaps.filter(function (s) { return /blend|pulse|simmer|whip|stir|warm|tbsp|cup/i.test(s.pantry) && s.pantry.length > 40; })
      .map(function (s) { return { title: 'Homemade ' + s.replace.toLowerCase().replace(/, (cooking|baking)$/, ''), from: 'From the swap list', time: '', steps: [s.pantry], tip: s.tip }; });
    return ours.concat(pantry);
  }
  var pantryPick = {};
  function viewCookbook(sub) {
    if (!member()) {
      main.innerHTML = head('Cookbook', 'The Cookbook', 'An ongoing list of recipes you can make at home, and the dairy-free cookbooks people love most. The list keeps growing.') +
        '<div class="dg-cookpv"><div>' + gated('<div class="dg-grid">' + RECIPE_NAMES.slice(0, 4).map(function (r) { return skel(r, 3); }).join('') + '</div>', 'Recipes and cookbooks', 'Dairy-free staples you can make from your pantry, and the cookbooks members rank highest.') + '</div>' +
        '<div><div class="dg-k" style="margin-bottom:10px">Cookbooks, voted on by members</div><div class="dg-books">' + COVERS.map(function (c) {
          return '<img src="https://covers.openlibrary.org/b/id/' + c[1] + '-M.jpg" alt="' + esc(c[0]) + ' cover" loading="lazy">'; }).join('') + '</div></div></div>';
      return;
    }
    var subs = [['Recipes', ''], ['What can I make?', 'make'], ['Cookbooks', 'books'], ['Chefs', 'chefs']];
    var cur = { make: 1, books: 1, chefs: 1 }[sub] ? sub : '';
    var t = toggles(subs.map(function (x) { return [x[0], '#/cookbook' + (x[1] ? '/' + x[1] : '')]; }), subs.filter(function (x) { return x[1] === cur; })[0][0]);
    var ledes = { '': 'Dairy-free staples you can make at home.', make: 'Tick what you have. Recipes that use the most of it come first.', books: 'Cookbooks from the Vegans Explore Directory, most voted first.', chefs: 'Chefs who cook dairy-free, with their recipes and what they offer.' };
    var body = '';
    if (cur === '') body = '<div class="dg-grid">' + cookRecipes().map(function (r) { return recipeCard(r, r.from + (r.time ? ' · ' + r.time : '')); }).join('') + '</div>';
    else if (cur === 'make') body = '<div class="dg-chips" id="dgPantry">' + PANTRY.map(function (p, i) { return '<button type="button" class="dg-chip" data-p="' + i + '" aria-pressed="' + !!pantryPick[i] + '">' + esc(p[0]) + '</button>'; }).join('') + '</div><div class="dg-grid" id="dgMake"></div>';
    else if (cur === 'books') body = dirTools([], 'Search cookbooks (cheese, ice cream...)', 'Search cookbooks') + dirGrid('dgList', BOOKS ? '' : '<div class="dg-loading">Loading cookbooks...</div>') +
      '<div class="dg-k" style="margin:22px 0 10px">Resources</div><div class="dg-grid">' + MEM.resources.map(function (r) {
        return '<div class="dg-card"><h3>' + esc(r.title) + '</h3><p>' + esc(r.text) + '</p>' + sources([[r.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''), r.url]]) + '</div>'; }).join('') + '</div>';
    else body = '<div class="dg-chef-empty"><div><h3>Chefs are coming to the Cookbook</h3><p>We are partnering with chefs who specialize in dairy-free cooking. Each one shares recipes here, linked to their profile with their classes, books and services.</p></div>' +
      '<a class="dg-btn" href="/partners">Are you a chef? Get featured</a></div>';
    main.innerHTML = head('Cookbook', 'The Cookbook', ledes[cur], t) + body;
    if (cur === 'make') {
      var grid = document.getElementById('dgMake'), all = cookRecipes();
      var draw = function () {
        var picked = Object.keys(pantryPick).filter(function (k) { return pantryPick[k]; }).map(Number);
        if (!picked.length) { grid.innerHTML = all.map(function (r) { return recipeCard({ title: r.title, steps: r.steps }, r.from); }).join(''); return; }
        var rows = all.map(function (r) { var txt = r.title + ' ' + r.steps.join(' '); return { r: r, uses: picked.filter(function (i) { return PANTRY[i][1].test(txt); }) }; })
          .filter(function (x) { return x.uses.length; }).sort(function (a, b) { return b.uses.length - a.uses.length; });
        grid.innerHTML = rows.map(function (x) { return recipeCard({ title: x.r.title, steps: x.r.steps }, 'Uses ' + x.uses.map(function (i) { return PANTRY[i][0].toLowerCase(); }).join(', ')); }).join('') ||
          '<p class="dg-empty">Nothing uses those yet. Try adding another ingredient.</p>';
      };
      document.getElementById('dgPantry').addEventListener('click', function (e) {
        var c = e.target.closest('[data-p]'); if (!c) return;
        var i = c.getAttribute('data-p'); pantryPick[i] = !pantryPick[i]; c.setAttribute('aria-pressed', String(!!pantryPick[i])); draw();
      });
      draw();
    }
    if (cur === 'books' && BOOKS) {
      var sortEl = document.getElementById('dgSort'), fEl = document.getElementById('dgFilter');
      sortEl.value = sortPref;
      var drawB = function () {
        var q = fEl.value.trim().toLowerCase();
        var rows = sortBy(BOOKS, sortPref).filter(function (l) { return !q || (l.name + ' ' + JSON.stringify(l.details || {})).toLowerCase().indexOf(q) >= 0; });
        document.getElementById('dgCount').textContent = rows.length + (rows.length === 1 ? ' cookbook' : ' cookbooks');
        var listEl = document.getElementById('dgList');
        listEl.innerHTML = rows.map(dirCard).join('') || '<p class="vrd-empty">No match. Try another word.</p>';
        wireCards(listEl);
      };
      sortEl.addEventListener('change', function () { sortPref = sortEl.value; drawB(); });
      fEl.addEventListener('input', drawB);
      drawB();
    }
  }

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
    if (member()) { main.innerHTML = head('Your membership', 'The whole Guide is yours', 'It came with your Founding Membership. Thank you for being here.') + '<a class="dg-btn" href="#/">Back to the overview</a>'; return; }
    var pending = access === 'pending';
    main.innerHTML = head('Get access', 'The Dairy Guide comes with membership', 'One $11 Founding Membership, one time, opens this Guide and the whole Vegans Explore community.') +
      '<div class="dg-access"><ul>' +
      '<li><b>The Dairy-Free Pulse:</b> every research fact with its source, and our podcasts and interviews on dairy.</li>' +
      '<li><b>The brands to buy</b>, sorted by what you are replacing, with the stores that carry them.</li>' +
      '<li><b>Swaps</b> from the shelf or your pantry, and the Cookbook: recipes, cookbooks and chefs.</li>' +
      '<li><b>The community:</b> your member dashboard, Directory votes, the Community Board and points.</li></ul></div>';
    main.querySelector('.dg-access').insertAdjacentHTML('beforeend',
      '<div class="dg-pricebox"><div class="dg-big">$11<small>one time</small></div><p>' + (pending ? 'Your account is not a Founding Member yet. Become one and the Guide opens right away.' :
        'Already a Vegans Explore member? It is already yours: <a href="#" data-signin>sign in</a> and the Guide opens.') + '</p>' +
      '<button type="button" class="dg-btn" data-join>' + (pending ? 'Become a Founding Member' : 'Join for $11') + '</button><span class="dg-status" role="status" style="display:block;margin-top:10px;color:#8a5a00"></span></div>');
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
    MEM.recipes.forEach(function (r) { out.push({ t: 'Cookbook', title: r.title, text: r.steps.join(' '), href: '#/cookbook' }); });
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
  function clip(k) { return CLIPS[k] || null; }
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
    bubble.textContent = TOUR.started && t.playing ? t.playing : t.say; // the welcome carries its own captions
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
  window.addEventListener('hashchange', route);

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
    if (e.target.closest('[data-join]')) {
      if (!a || access === 'checking') return;
      stopMaya(); drawMaya();
      if (access === 'guest') a.showAuthModal('Create your account. Then become a Founding Member and the Dairy Guide opens.', function () { location.reload(); }, 'signup');
      else a.showActivateModal('The Dairy Guide comes with the $11 Founding Membership, one time. It also opens the full community.');
    }
  });

  function confirmAfterCheckout(tok, tries) {
    setStatus('Confirming your membership...');
    api('open', tok).then(function (d) {
      if (d && d.unlocked && d.html) { setStatus(''); becomeMember(d.html); return; }
      if (tries > 0) { setTimeout(function () { confirmAfterCheckout(tok, tries - 1); }, 2500); return; }
      access = 'pending'; route();
      setStatus('Your payment went through. Confirming can take a minute: refresh this page shortly and the Guide opens.');
    }).catch(function () { if (tries > 0) setTimeout(function () { confirmAfterCheckout(tok, tries - 1); }, 2500); else { access = 'pending'; route(); } });
  }

  function init() {
    if (window.VERegionDirectory) VERegionDirectory.css(); // the Directory card's own styles
    document.documentElement.classList.add('dg-fit');
    if (window.VEGuideArt) { var art = VEGuideArt('maya', 'square'); if (art) mayaBox.style.backgroundImage = "url('" + art + "')"; }
    route();
    loadPublic();
    var a = auth();
    var viewAs = a && a.getViewAs ? a.getViewAs() : null;
    if (viewAs) { access = viewAs.mode === 'public' ? 'guest' : 'pending'; route(); return; }
    var tok = a && a.isLoggedIn() ? a.getToken() : null;
    if (!tok) { access = 'guest'; route(); return; }
    var params = new URLSearchParams(location.search), back = params.get('activate');
    if (back) { params.delete('activate'); history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash); }
    if (back === 'success') { confirmAfterCheckout(tok, 8); return; }
    api('open', tok).then(function (d) {
      if (d && d.unlocked && d.html) becomeMember(d.html);
      else { access = d && d.loggedIn ? 'pending' : 'guest'; route(); }
    }).catch(function () { access = 'pending'; route(); setStatus('We could not check your membership just now. Refresh to try again.'); });
  }

  if (window.VEAuth) init(); else window.addEventListener('load', init);
})();
