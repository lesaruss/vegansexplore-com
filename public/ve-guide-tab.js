/* The Resources tab (the Guide tab until 2026-11-03) on every listing (LOCKED by Sean 2026-10-31, canon canon-ve-listing-guide-tab, playbook ve-listing-guide-tab):
 * "this is how we can continue to put those guides in front of people's faces. And if they already purchased it, it's right there
 * in front of them."
 *
 *   VEGuideTab.pick(listing)               {primary, extra}: the Guide slug for this listing, and for a food place the Vegan
 *                                          Restaurant Guide as the owner's and super admin's second card
 *   VEGuideTab.mount(listing, opts)        adds the tab (named for its Guide) before Partner Dashboard and its panel, draws the
 *                                          short squeeze page there; opts {owner, admin, preview}
 *
 * Everyone sees it, signed in or not. The page is short: the Guide's banner, its one line, what is inside, and Open the Guide, which
 * goes to the full Guide page in the same window (never framed). Someone who owns the Guide (ve-guide-unlock status: purchase,
 * Diplomat, Ambassador, super admin) sees Open your Guide and no price.
 * The map is MAP below: a new Guide is one GUIDES entry and its categories in MAP. A Guide not in GUIDES yet falls back to the one
 * named in its row. Views and clicks go to ve_promo_track as promo 'gt-<guide slug>' with the listing, so they read
 * per Guide per listing (ve_promo_funnel). Sections with no real match yet (Products, Services, Studios) open the
 * Welcome Guide until their own Guide exists. The Nutrition Guide launched 2026-10-31. */
(function () {
  if (window.VEGuideTab) return;
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var BANNERS = SB + '/storage/v1/object/public/vegan-media/media/guides/banners/';
  var PRICE = '$11 or 1,100 points, yours to keep';

  // paid: a ve_guides row sold at $11 or 1,100 points (ownership read from ve-guide-unlock). Words never count items.
  var GUIDES = {
    'vegan-dairy-guide': { tab: 'Dairy Guide', title: 'The Vegan Dairy Guide', guide: 'Maya', paid: true, href: '/guides/vegan-dairy-guide',
      banner: '/public/guides/vegan-dairy-guide.jpg?v=3',
      line: 'Everything you need to go dairy-free: the brands to buy and where to find them, swaps for every kind of dairy, and recipes, with Maya walking you through it.',
      items: ['The brands worth buying, and the stores that carry them', 'Swaps for milk, butter, cheese, cream and more', 'Recipes and cookbooks from our community', 'The research, and our interviews on dairy'] },
    'vegan-restaurant-guide': { tab: 'Restaurant Guide', title: 'The Vegan Restaurant Guide', guide: 'Liz', paid: true, href: '/guides/vegan-restaurant-guide',
      banner: '/public/guides/vegan-restaurant-guide.jpg?v=3', kicker: 'For your business',
      line: 'What may be quietly hurting a Vegan restaurant, and how to fix it, with Liz walking you through it.',
      items: ['A free check of your Google listing, website and social', 'The fixes, in the order that matters for you', 'Our interviews with Vegan business owners', 'How to get featured on Vegans Explore'], free: 'The check is free' },
    'creator-guide': { tab: 'Creator Guide', title: 'The Creator Guide', guide: 'Kai', paid: true, href: '/guides/creator-guide',
      banner: '/public/guides/creator-guide.jpg?v=3',
      line: 'For Vegan creators going from hobby to professional, with Kai walking you through it.',
      items: ['Ten moves, each with a real creator doing it', 'The creators and channels in our Directory', 'Our conversations with creators', 'Your next step as an official creator'], free: 'Tip 1 free' },
    'nonprofit-guide': { tab: 'Nonprofit Guide', title: 'The Nonprofit Guide', guide: 'Dani', paid: true, href: '/guides/nonprofit-guide',
      banner: '/public/guides/nonprofit-guide.jpg?v=3',
      line: 'For the people who keep Vegan nonprofits, rescues and sanctuaries going, with Dani walking you through it.',
      items: ['Ten ways to fundraise and stay relevant', 'Our nonprofit series and interviews', 'Businesses near you that fit a tie-in', 'How to get found, and becoming a Nonprofit Partner'], free: 'Tip 1 free' },
    'nutrition-guide': { tab: 'Nutrition Guide', title: 'The Nutrition Guide', guide: 'Theo', paid: true, href: '/guides/nutrition-guide',
      banner: '/public/guides/nutrition-guide.jpg',
      line: 'What a Vegan plate needs, nutrient by nutrient, sourced, with Theo walking you through it.',
      items: ['B12, protein, iron, calcium, vitamin D, omega-3s, iodine and zinc', 'How much, where to get it, and when to supplement', 'The physicians and health experts in our Directory', 'Our conversations with physicians on the podcast'], free: 'B12 free' },
    'supermarket-guide': { tab: 'Supermarket Guide', title: 'The Supermarket Guide', guide: 'Pascal', paid: true, href: '/guides/supermarket-guide',
      banner: '/public/guides/supermarket-guide.jpg?v=2', kicker: 'Find it in the store',
      line: 'Every Vegan product in your supermarket, by what it is, and the aisle members found it in at your store, with Pascal walking you through it.',
      items: ['Dairy-free, plant-based meat, meals, pantry and snacks, every product together', 'Narrow it by type, what it is made from, the brand and where it sits', 'The aisle at your store, mapped and kept current by members', 'Publix at Brickell Village free to everyone'] },
    'group-partner': { tab: 'Group Guide', title: 'The Group Partner Guide', guide: 'Dani', paid: false, href: '/groups/welcome',
      banner: '/groups/sample/img/brunch-1.jpg', bannerFallback: '/public/guides/welcome-guide.jpg?v=3',
      line: 'Host your group\'s community and events on Vegans Explore, and earn as it grows.',
      items: ['Your group\'s page, events and members in one place', 'Tickets, guest passes and check-in at the door', 'Earnings that grow with the members you bring in', 'A sample club to try as a member or as the organizer'] },
    'welcome': { tab: 'Welcome Guide', title: 'The Welcome Guide', guide: 'Dani', paid: false, href: '/passport',
      banner: '/public/guides/welcome-guide.jpg?v=3',
      line: 'Start here: what Vegans Explore is, your community, the Directory, the Guides and how points work.',
      items: ['Find your places in the Directory', 'Your community, in every chapter', 'The Guides, points and levels', 'What your $11 supports'] }
  };
  // Category to Guide. A row's third slug stands in only while its Guide is not in GUIDES.
  var MAP = [
    [['Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Markets', 'Catering', 'Meal Prep', 'Food Brands'], 'vegan-dairy-guide'],
    [['Nutrition & Supplements', 'Physicians', 'Health Experts'], 'nutrition-guide', 'vegan-dairy-guide'],
    [['Content Creators', 'YouTube', 'Podcasts'], 'creator-guide'],
    [['Activists', 'Nonprofits', 'Rescues', 'Sanctuaries'], 'nonprofit-guide'],
    [['Groups'], 'group-partner']
  ];
  // The Supermarket Guide is the second card on a product brand's Guide tab (opening the category its products are in, filtered to
  // the brand) and on a supermarket chain's (opening its stores) (Sean, 2026-11-01: "the supermarket guide should be referenced in
  // its guide section. So everything kind of works back to each other"). Category keys are CATS in guide-scripts/supermarket-guide.js.
  var SHELF_OF = [['dairy', 'dairy-free'], ['meat', 'protein'], ['tofu', 'protein'], ['seafood', 'protein'], ['egg', 'protein'], ['meals', 'meals'],
    ['pantry', 'pantry'], ['protein', 'pantry'], ['snacks', 'snacks'], ['baked', 'snacks'], ['dips', 'snacks'], ['drinks', 'snacks']];
  function shelfHref(l) {
    var cats = [l.category].concat(l.extra_categories || []);
    if ((l.tags || []).indexOf('ve-grocery-store') >= 0) return '/guides/supermarket-guide#/stores';
    if (cats.indexOf('Food Brands') < 0 && cats.indexOf('Nutrition & Supplements') < 0) return null;
    var ks = l.product_kinds || [], c = null;
    SHELF_OF.some(function (x) { if (ks.indexOf(x[0]) >= 0) { c = x[1]; return true; } return false; });
    if (!c) c = cats.indexOf('Nutrition & Supplements') >= 0 ? 'pantry' : 'dairy-free';
    return '/guides/supermarket-guide#/c/' + c + '?b=' + encodeURIComponent(l.slug || '');
  }
  var RESTAURANT_CATS = ['Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Catering', 'Meal Prep'];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function slugFor(cat) {
    for (var i = 0; i < MAP.length; i++) if (MAP[i][0].indexOf(cat) >= 0) return GUIDES[MAP[i][1]] ? MAP[i][1] : (MAP[i][2] || 'welcome');
    return null;
  }
  // The main category decides; a second category is read only when the main one has no Guide.
  function pick(l) {
    l = l || {};
    var slug = slugFor(l.category);
    if (!slug) (l.extra_categories || []).some(function (c) { return !!(slug = slugFor(c)); });
    slug = slug || 'welcome';
    return { primary: slug, extra: RESTAURANT_CATS.indexOf(l.category) >= 0 ? 'vegan-restaurant-guide' : null, shelf: shelfHref(l) };
  }

  // ---------- tracking (ve_promo_track, the same table as the house banners and the creator ad) ----------
  var BOT = /bot|crawl|spider|preview|HeadlessChrome|Lighthouse/i.test(navigator.userAgent || '');
  function visitor() {
    try {
      var v = localStorage.getItem('ve_visitor');
      if (!v || !/^[A-Za-z0-9-]{8,64}$/.test(v)) { v = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2, 12); localStorage.setItem('ve_visitor', v); }
      return v;
    } catch (e) { return ''; }
  }
  function track(slug, step, l) {
    var v = visitor(); if (BOT || !v) return;
    var L = {}; try { L = JSON.parse(sessionStorage.getItem('ve_landing') || '{}') || {}; } catch (e) {}
    try {
      fetch(SB + '/rest/v1/rpc/ve_promo_track', { method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: 'Bearer ' + ANON },
        body: JSON.stringify({ p_promo: ('gt-' + slug).slice(0, 40), p_step: step, p_visitor: v, p_page: '/directory/' + (l.slug || ''),
          p_listing: l.id || null, p_cta: 'tab', p_channel: L.channel || null, p_vl: L.vl || null }) }).catch(function () {});
    } catch (e) {}
  }
  function onScreen(el, fn) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); fn(); } }, { threshold: 0.3 });
    io.observe(el);
  }

  // ---------- who owns the Guide ----------
  function owns(slug) {
    var g = GUIDES[slug];
    if (!g || !g.paid) return Promise.resolve(false);
    var A = window.VEAuth, t = null;
    try { t = A && A.isLoggedIn && A.isLoggedIn() && A.getToken ? A.getToken() : null; } catch (e) {}
    if (!t) return Promise.resolve(false);
    return fetch(SB + '/functions/v1/ve-guide-unlock?action=status', { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: slug, token: t }) })
      .then(function (r) { return r.ok ? r.json() : {}; }).then(function (d) { return !!(d && d.unlocked); }).catch(function () { return false; });
  }

  var CSS = '' +
    '.gt-pad{padding:32px 40px 44px}' +
    '.gt-card{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:32px;align-items:center}' +
    '.gt-card+.gt-card{margin-top:36px;padding-top:36px;border-top:1px solid rgba(0,0,0,.09)}' +
    '.gt-pic{display:block;aspect-ratio:8/5;border-radius:10px;overflow:hidden;background:#f4f6f4}' +
    '.gt-pic img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .25s}' +
    '.gt-pic:hover img{transform:scale(1.02)}' +
    '.gt-k{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--vb-accent-ink,#1f5f22);margin:0 0 6px}' +
    '.gt-h{font-size:26px;line-height:1.2;font-weight:900;color:#111;margin:0 0 10px}' +
    '.gt-line{font-size:15px;line-height:1.6;color:rgba(0,0,0,.72);margin:0 0 14px}' +
    '.gt-list{list-style:none;margin:0 0 18px;padding:0;display:grid;gap:8px}' +
    '.gt-list li{position:relative;padding-left:26px;font-size:14px;line-height:1.5;color:#222}' +
    '.gt-list li:before{content:"";position:absolute;left:0;top:3px;width:16px;height:16px;border-radius:50%;background:var(--vb-soft,#e8f5ec) url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%231f5f22%27 stroke-width=%273.2%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M5 12l5 5L19 7%27/%3E%3C/svg%3E") center/10px no-repeat}' +
    '.gt-chips{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 16px}' +
    '.gt-chip{font-size:11px;font-weight:700;border-radius:6px;padding:5px 10px;background:#f2f5f2;color:#1f5f22}' +
    '.gt-chip.own{background:var(--vb-go,#22c55e);color:#062b14}' +
    '.gt-go{display:inline-block;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;border-radius:6px;padding:13px 22px;background:var(--vb-go,#22c55e);color:#062b14}' +
    '.gt-go:hover{background:var(--vb-go-hover,#16a34a);color:#fff}' +
    '.gt-go:focus-visible,.gt-pic:focus-visible{outline:3px solid var(--vb-accent,#16a34a);outline-offset:2px}' +
    '.gt-note{font-size:12px;color:rgba(0,0,0,.6);margin:10px 0 0}' +
    '@media(max-width:900px){.gt-card{grid-template-columns:1fr;gap:18px}}' +
    '@media(max-width:768px){.gt-pad{padding:24px 16px 32px}.gt-h{font-size:22px}}';

  function card(slug, own, primary, href) {
    var g = GUIDES[slug];
    if (href) g = Object.assign({}, g, { href: href });
    var chips = own ? '<span class="gt-chip own">In your Guides</span>'
      : (g.paid ? '<span class="gt-chip">' + esc(PRICE) + '</span>' : '<span class="gt-chip">Free</span>') + (g.free && !own ? '<span class="gt-chip">' + esc(g.free) + '</span>' : '');
    var cta = own ? 'Open your Guide' : g.paid ? 'Open the Guide' : 'Start the ' + g.tab;
    var img = '<img src="' + esc(g.banner) + '" alt="" width="800" height="500" loading="lazy"' +
      (g.bannerFallback ? ' onerror="this.onerror=null;this.src=\'' + esc(g.bannerFallback) + '\'"' : '') + '>';
    var H = primary ? 'h2' : 'h3';
    return '<section class="gt-card" data-gt="' + esc(slug) + '" aria-label="' + esc(g.title) + '">' +
      '<a class="gt-pic" href="' + esc(g.href) + '" data-gt-go tabindex="-1" aria-hidden="true">' + img + '</a>' +
      '<div><p class="gt-k">' + esc(g.kicker || 'From Vegans Explore') + '</p><' + H + ' class="gt-h">' + esc(g.title) + '</' + H + '>' +
      '<p class="gt-line">' + esc(g.line) + '</p>' +
      '<ul class="gt-list">' + g.items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<div class="gt-chips">' + chips + '</div>' +
      '<a class="gt-go" href="' + esc(g.href) + '" data-gt-go>' + esc(cta) + '</a>' +
      (g.paid && !own ? '<p class="gt-note">Buying any Guide makes you a member. Already have it? Sign in and it opens.</p>' : '') +
      '</div></section>';
  }

  function draw(panel, l, slugs, owned, preview) {
    var sh = pick(l).shelf;
    panel.innerHTML = '<div class="gt-pad">' + slugs.map(function (s, i) { return card(s, !!owned[s], i === 0, s === 'supermarket-guide' ? sh : null); }).join('') + '</div>';
    if (preview) return;
    [].forEach.call(panel.querySelectorAll('[data-gt]'), function (c) {
      var s = c.getAttribute('data-gt');
      onScreen(c, function () { track(s, 'view', l); });
      [].forEach.call(c.querySelectorAll('[data-gt-go]'), function (a) { a.addEventListener('click', function () { track(s, 'click', l); }); });
    });
  }

  function mount(l, opts) {
    opts = opts || {};
    var nav = document.querySelector('.listing-tabs'), main = document.querySelector('.listing-page-main');
    if (!nav || !main || document.getElementById('tab-guide')) return null;
    if (!document.getElementById('gt-css')) { var st = document.createElement('style'); st.id = 'gt-css'; st.textContent = CSS; document.head.appendChild(st); }
    var p = pick(l), slugs = [p.primary];
    if (p.extra && (opts.owner || opts.admin)) slugs.push(p.extra);
    if (p.shelf && p.primary !== 'supermarket-guide') slugs.push('supermarket-guide');
    var g = GUIDES[p.primary];
    var btn = document.createElement('button');
    btn.className = 'tab-btn'; btn.type = 'button'; btn.setAttribute('data-tab', 'guide'); btn.setAttribute('role', 'tab'); btn.setAttribute('aria-selected', 'false');
    // Renamed Resources (Sean, 2026-11-03: "so we can put whatever we want on it later"). The Guide is still what it holds; its tab key,
    // address (?tab=guide) and tracking (promo gt-<guide slug>, cta tab) are unchanged.
    btn.textContent = 'Resources';
    var pd = nav.querySelector('.tab-btn[data-tab="brand"]');
    if (pd) nav.insertBefore(btn, pd); else nav.appendChild(btn);
    var panel = document.createElement('div');
    panel.className = 'tab-panel'; panel.id = 'tab-guide'; panel.setAttribute('role', 'tabpanel');
    main.appendChild(panel);
    btn.addEventListener('click', function () { if (window.veListingTab) window.veListingTab('guide'); });
    draw(panel, l, slugs, {}, opts.preview);
    Promise.all(slugs.map(owns)).then(function (r) {
      var o = {}; slugs.forEach(function (s, i) { o[s] = r[i]; });
      if (r.some(Boolean)) draw(panel, l, slugs, o, opts.preview);
    });
    if (new URLSearchParams(location.search).get('tab') === 'guide' && window.veListingTab) window.veListingTab('guide');
    return p;
  }

  window.VEGuideTab = { pick: pick, mount: mount, guides: GUIDES };
})();
