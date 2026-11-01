/* The Supermarket Guide (LOCKED by Sean 2026-11-01, canon canon-ve-supermarket-guide, playbook ve-supermarket-guide; built the same
 * day, "hand it to Logan, build it"). Find the Vegan items in your supermarket, aisle by aisle, store by store, mapped and kept current
 * by members. It runs on the venue Guides' engine, the edge function ve-venues with guide 'supermarket-guide': a store is a venue of
 * kind 'supermarket' tied to its chain's Directory listing, its departments are spots, and the Vegan sections a shopper looks for are
 * items, each "Aisle not mapped yet" until a member maps it (a photo, a location check inside the store, the team accepts, the first
 * to confirm earns the bounty). Free to everyone while a supermarket sponsors it (ve_guides.access_rule 'free'); else $11 or 1,100
 * points. Pascal is the Guide on the right; his lines are text until they are approved and recorded.
 * The address bar carries the view: #/stores, #/store/<slug>, #/store/<slug>/report/choose/<item>, #/list, #/produce, #/report.
 */
(function () {
  var SLUG = 'supermarket-guide', FREE = 'publix-miami-cjalb8';
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var API = SB + '/functions/v1/ve-venues';
  var UNLOCK_URL = SB + '/functions/v1/ve-guide-unlock';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';

  // The tabs, in tour order, and what Pascal says on each (drafts for Sean's approval, 2026-11-01).
  var TABS = [
    { k: 'overview', label: 'Overview', say: 'Hi, I\'m Pascal. Pick your supermarket and I\'ll show you where the Vegan items are, aisle by aisle, the way our members mapped it.',
      sayMember: 'It\'s all yours. Pick your store, save what you need to your shopping list, and tell us where things are to earn points.' },
    { k: 'stores', label: 'Stores', say: 'Find your store by city or by where you are. Each one opens by what it is, dairy-free, plant-based meat, meals, pantry, snacks and produce, with every product together and the aisle members found it in. Brickell Village in Miami is open to everyone.',
      sayMember: 'Find your store, then tap Save on what you need. If an aisle is not mapped yet, you can be the first to tell us.' },
    { k: 'scan', label: 'Scan', say: 'Holding something in the aisle? Scan its barcode and I\'ll show you what it is, its macros, and which stores carry it. Open to everyone.',
      sayMember: 'Scan anything on the shelf. If we know it, you get its macros and its page. If we do not, add it and earn your place on the map.' },
    { k: 'list', label: 'Shopping list', mine: 1, say: 'Everything you save lands here as a shopping list, by store and aisle, with a box to tick as you go.' },
    { k: 'produce', label: 'Produce', say: 'The produce section is where a Vegan basket starts. Here is what is worth buying and why.' },
    { k: 'report', label: 'Help keep it right', say: 'Members map the aisles. Snap a photo in the store, tell us where something is, and earn points when the team accepts it.',
      sayMember: 'In the store? Tell us the aisle, confirm what is still there, or add what is missing. The first to map a section earns the bounty.' },
    { k: 'join', label: 'Get access', guest: 1, say: 'The Supermarket Guide is free while a supermarket sponsors it. Otherwise it is eleven dollars, or 1,100 points, and yours to keep.' }
  ];

  var REPORT = {
    confirm: ['Still here', 'It is still in the aisle written here.', 'Still here'],
    wrong: ['Update', 'The aisle it is in, or what is there now.', 'Tell us the aisle'],
    gone: ['Update', 'This store does not carry it anymore.', 'Not there anymore'],
    comment: ['Comment', 'A tip for other shoppers: a product worth trying, a deal, where the good stuff is. A photo makes it better.', 'Comment'],
    missing: ['Add something missing', 'A Vegan product or section that is not in the Guide for this store yet.', 'Something missing']
  };
  var STATUS = { pending: ['Waiting for the team', 'wait'], accepted: ['Accepted', 'live'], agreed: ['Accepted', 'live'], declined: ['Not accepted', 'off'] };

  // The produce section (general advice, no claims about any store): what to buy and why.
  var PRODUCE = [
    ['Leafy greens', 'Spinach, kale, collards and romaine go in salads, smoothies, soups and pastas. Buy what you will use within a few days, or take the frozen bags.'],
    ['Beans and lentils, the produce of the pantry', 'Not in produce, but they belong in the same basket: canned or dried, they are the protein most Vegan meals are built on.'],
    ['Potatoes and sweet potatoes', 'Filling, cheap and they keep for weeks somewhere cool and dark. Roast, mash or bake them.'],
    ['Onions, garlic and ginger', 'The start of almost every savory dish. They keep for weeks outside the fridge.'],
    ['Bananas and frozen fruit', 'Bananas for breakfast and smoothies (freeze the spotty ones), and frozen berries and mango, picked ripe and good all year.'],
    ['Avocados', 'Creamy where you would use butter or mayo. Buy some firm and some soft so they are not all ripe on the same day.'],
    ['Mushrooms', 'They bring a savory, meaty bite to tacos, pasta and stir-fries. Keep them in a paper bag in the fridge.'],
    ['Fresh herbs and lemons', 'A handful of cilantro, parsley or basil and a squeeze of lemon make simple food taste finished.'],
    ['What is in season', 'In season means cheaper and tastier. Look at what the store has the most of and what is on sale this week.']
  ];

  var S = 'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"';
  var ICON = {
    store: '<svg width="26" height="26" viewBox="0 0 24 24" ' + S + '><path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9h18"/><path d="M9 20v-6h6v6"/></svg>',
    cart: '<svg width="26" height="26" viewBox="0 0 24 24" ' + S + '><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.5 12h12l2-8H6.5"/></svg>',
    pin: '<svg width="13" height="13" viewBox="0 0 24 24" ' + S + '><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    camera: '<svg width="26" height="26" viewBox="0 0 24 24" ' + S + '><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    list: '<svg width="26" height="26" viewBox="0 0 24 24" ' + S + '><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/></svg>',
    leaf: '<svg width="26" height="26" viewBox="0 0 24 24" ' + S + '><path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19c3-4 6-7 10-9"/></svg>',
    star: '<svg width="26" height="26" viewBox="0 0 24 24" ' + S + '><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>'
  };
  var LOCK_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f5f22" stroke-width="2.6" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';
  var BOOKMARK = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 3h12a1 1 0 011 1v17l-7-4.5L5 21V4a1 1 0 011-1z"/></svg>';

  var main = document.getElementById('dgMain');
  var menuEl = document.getElementById('dgMenu'), menuSel = document.getElementById('dgMenuSelect');

  var ME = { signed_in: false, active: false, owns: false, admin: false, free: false };
  var ST = { published: true, cost: 1100, balance: 0, active: false };
  var STORES = null, VENUE = {}, curTab = 'overview', POINTS = {}, LIMITS = {}, HERE = null, SHOWN = 24;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function auth() { return window.VEAuth || null; }
  function token() { var a = auth(); return a && a.isLoggedIn() && !(a.getViewAs && a.getViewAs()) ? a.getToken() : null; }
  function owner() { return !!ME.owns; }
  function tabs() { return TABS.filter(function (t) { return !(t.guest && owner()) && !(t.mine && !(owner() && token())); }); }
  function tab(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i].k === k) return TABS[i]; return TABS[0]; }
  function href(k) { return '#/' + (k === 'overview' ? '' : k); }
  function pts(n) { return Number(n || 0).toLocaleString('en-US'); }
  function papi(body) {
    var h = { 'Content-Type': 'application/json', apikey: ANON_KEY }, t = token();
    if (t) h.Authorization = 'Bearer ' + t;
    return fetch(SB + '/functions/v1/ve-products', { method: 'POST', headers: h, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  function api(body) {
    var h = { 'Content-Type': 'application/json', apikey: ANON_KEY }, t = token();
    if (t) h.Authorization = 'Bearer ' + t;
    return fetch(API, { method: 'POST', headers: h, body: JSON.stringify(Object.assign({ guide: SLUG }, body)) }).then(function (r) { return r.json(); });
  }
  function unlockApi(action) {
    return fetch(UNLOCK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
      body: JSON.stringify({ action: action, slug: SLUG, token: token() || undefined }) }).then(function (r) { return r.json(); });
  }
  function fmtDate(iso) { try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch (e) { return ''; } }
  function tagHtml(text, cls) { return '<span class="dg-tag ' + cls + '">' + esc(text) + '</span>'; }
  function hubName(h) { var x = (window.VE_HUBS || []).filter(function (v) { return v.slug === h; })[0]; return x ? x.name : h; }

  function drawMenu(cur) {
    menuEl.innerHTML = tabs().map(function (t) {
      return '<a href="' + href(t.k) + '"' + (t.k === cur ? ' aria-current="page"' : '') + (t.k === 'join' ? ' class="dg-join-tab"' : '') + '>' + esc(t.label) + '</a>';
    }).join('');
    menuSel.innerHTML = tabs().map(function (t) { return '<option value="' + t.k + '"' + (t.k === cur ? ' selected' : '') + '>' + esc(t.label) + '</option>'; }).join('');
  }
  menuSel.addEventListener('change', function () { location.hash = href(menuSel.value); });
  function crumb(parts) {
    return '<div class="dg-crumb"><a href="#/">Supermarket Guide</a>' + parts.map(function (p) { return ' &rsaquo; ' + (p[1] ? '<a href="' + p[1] + '">' + esc(p[0]) + '</a>' : esc(p[0])); }).join('') + '</div>';
  }
  function head(k, h, lede, right) {
    return '<div class="dg-head"><div><div class="dg-k">' + esc(k) + '</div><h2 class="dg-h1">' + h + '</h2></div>' + (right || '') + '</div>' + (lede ? '<p class="dg-lede">' + lede + '</p>' : '');
  }

  // ---------- the offer ----------
  function mode() {
    if (ME.free) return 'free';
    if (!ST.published) return 'soon';
    if (!token()) return 'join';
    return ST.balance >= ST.cost ? 'points' : 'buy';
  }
  function ctaLabel() { return { free: 'Free right now', soon: 'Coming soon', join: 'Get it for $11', points: 'Unlock with ' + pts(ST.cost) + ' points', buy: 'Get it for $11' }[mode()]; }
  function offerLine() {
    var m = mode();
    if (m === 'free') return 'It is free right now, thanks to our sponsors.';
    if (m === 'soon') return 'The full Guide opens soon. Publix at Brickell Village in Miami is open to everyone now.';
    if (m === 'points') return 'Unlock it with ' + pts(ST.cost) + ' points: you have ' + pts(ST.balance) + '. Or get it for $11.';
    return 'It is free while a supermarket sponsors it. Until then it is $11, or ' + pts(ST.cost) + ' points, and yours to keep.';
  }
  function ctaBtns() {
    var m = mode();
    return '<div class="dg-btns"><button type="button" class="dg-btn" data-join' + (m === 'soon' || m === 'free' ? ' disabled style="opacity:.6;cursor:default"' : '') + '>' + esc(ctaLabel()) + '</button>' +
      (m === 'join' ? '<a href="#" data-signin style="font-size:12.5px;font-weight:800;color:var(--g)">Already a member? Sign in</a>' : '') +
      (m === 'points' ? '<a href="#" data-buy style="font-size:12.5px;font-weight:800;color:var(--g)">Or get it for $11</a>' : '') + '</div>';
  }
  function gated(inner, title, text) {
    return '<div class="dg-gated"><div class="dg-blur" aria-hidden="true">' + inner + '</div><div class="dg-gate"><span class="dg-lockic">' + LOCK_SVG + '</span>' +
      '<b>' + esc(title) + '</b><p>' + esc(text) + ' ' + esc(offerLine()) + '</p>' + ctaBtns() + '</div></div>';
  }
  function drawJoinbox() {
    var box = document.querySelector('.dg-joinbox'); if (!box) return;
    var btn = box.querySelector('[data-join]'), signin = box.querySelector('.dg-jb-in'), price = box.querySelector('.dg-jb-price');
    var m = mode();
    btn.textContent = ctaLabel(); btn.disabled = m === 'soon' || m === 'free'; btn.style.opacity = btn.disabled ? '.6' : '';
    if (price) price.innerHTML = m === 'free' ? '<b>Free</b><small>while<br>sponsored</small>' : '<b>$11</b><small>one time<br>purchase</small>';
    signin.style.display = m === 'join' || m === 'soon' ? '' : 'none';
  }

  // ---------- stores ----------
  function km(a, b) {
    var R = 6371, dLa = (b.lat - a.lat) * Math.PI / 180, dLo = (b.lng - a.lng) * Math.PI / 180;
    var x = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  function miles(k) { var m = k * 0.621371; return m < 0.1 ? 'here' : (m < 10 ? m.toFixed(1) : Math.round(m)) + ' mi'; }
  function chapters() { var seen = {}, out = []; (STORES || []).forEach(function (v) { if (v.hub && !seen[v.hub]) { seen[v.hub] = 1; out.push(v.hub); } }); return out; }
  function chains() { var seen = {}, out = []; (STORES || []).forEach(function (v) { var c = v.chain; if (c && !seen[c.slug]) { seen[c.slug] = 1; out.push(c); } }); return out; }
  function pref(k, d) { try { return sessionStorage.getItem('sg_' + k) || d; } catch (e) { return d; } }
  function setPref(k, v) { try { sessionStorage.setItem('sg_' + k, v); } catch (e) {} }
  function mapped(v) { return v.confirmed || 0; }
  function storeCard(v) {
    var locked = !owner() && !v.free;
    var badge = v.free && !owner() ? tagHtml('Free to everyone', 'sa-tag-free') : locked ? tagHtml('Members', 'sa-tag-lock') : '';
    var dist = HERE && v.lat != null ? '<span class="sg-dist">' + esc(miles(km(HERE, v))) + '</span>' : '';
    var tags = tagHtml(mapped(v) ? mapped(v) + ' of ' + v.items + ' sections mapped' : 'Aisles not mapped yet', mapped(v) ? 'sa-tag-fresh' : 'sa-tag-new') +
      (v.bounties && owner() ? tagHtml(v.bounties + (v.bounties === 1 ? ' bounty' : ' bounties') + ' open', 'sa-tag-bounty') : '');
    var logo = v.chain && v.chain.logo_url ? '<img src="' + esc(v.chain.logo_url) + '" alt="" loading="lazy">' : ICON.store;
    return '<a class="sg-store" href="#/store/' + esc(v.slug) + '"><span class="sg-logo">' + logo + '</span><span class="sg-sbody"><b>' + esc(v.name) + '</b>' +
      '<span class="sa-vmeta">' + ICON.pin + ' ' + esc(v.address || v.city || '') + '</span><span class="sa-vtags">' + badge + tags + '</span></span>' + dist + '</a>';
  }
  function filtered() {
    var ch = pref('chain', 'all'), hub = pref('hub', 'all'), q = (pref('q', '') || '').toLowerCase();
    var list = (STORES || []).filter(function (v) {
      return (ch === 'all' || (v.chain && v.chain.slug === ch)) && (hub === 'all' || v.hub === hub) &&
        (!q || (v.name + ' ' + (v.address || '') + ' ' + (v.city || '')).toLowerCase().indexOf(q) >= 0);
    });
    if (HERE) list.sort(function (a, b) { return (a.lat == null ? 1e9 : km(HERE, a)) - (b.lat == null ? 1e9 : km(HERE, b)); });
    else list.sort(function (a, b) { return (b.free ? 1 : 0) - (a.free ? 1 : 0) || String(a.city).localeCompare(String(b.city)) || String(a.name).localeCompare(String(b.name)); });
    return list;
  }
  function viewStores() {
    if (!STORES) { main.innerHTML = head('Stores', 'Find your store', '') + '<div class="dg-loading">Loading the stores...</div>'; return; }
    var hub = pref('hub', 'all'), ch = pref('chain', 'all'), list = filtered();
    var sel = function (id, label, opts, cur) {
      return '<label class="sa-city"><span>' + label + '</span><select id="' + id + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === cur ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
    };
    main.innerHTML = head('Stores', 'Find your store', 'Pick your supermarket by city or by where you are. Each store lists its Vegan sections and the aisle our members found them in.') +
      '<div class="sg-tools">' + sel('sgChain', 'Supermarket', [['all', 'Every supermarket']].concat(chains().map(function (c) { return [c.slug, c.name]; })), ch) +
      sel('sgHub', 'Chapter', [['all', 'Every chapter']].concat(chapters().map(function (h) { return [h, hubName(h)]; })), hub) +
      '<label class="sa-city sg-q"><span>Search</span><input id="sgQ" type="search" placeholder="City, street or store" value="' + esc(pref('q', '')) + '"></label>' +
      '<button type="button" class="dg-btn dg-ghost" id="sgNear">' + (HERE ? 'Nearest first' : 'Near me') + '</button></div>' +
      '<p class="sg-count">' + list.length + (list.length === 1 ? ' store' : ' stores') + (HERE ? ', nearest first' : '') + '</p>' +
      (list.length ? '<div class="sg-stores">' + list.slice(0, SHOWN).map(storeCard).join('') + '</div>' +
        (list.length > SHOWN ? '<div class="dg-btns" style="justify-content:center;margin-top:14px"><button type="button" class="dg-btn dg-ghost" id="sgMore">Show more stores</button></div>' : '')
        : '<p class="dg-empty">No stores match. Try another city or every chapter.</p>');
    var on = function (id, ev, fn) { var el = document.getElementById(id); if (el) el.addEventListener(ev, fn); };
    on('sgChain', 'change', function (e) { setPref('chain', e.target.value); SHOWN = 24; route(); });
    on('sgHub', 'change', function (e) { setPref('hub', e.target.value); SHOWN = 24; route(); });
    on('sgQ', 'input', function (e) { setPref('q', e.target.value); SHOWN = 24; clearTimeout(viewStores.t); viewStores.t = setTimeout(function () { var p = e.target.selectionStart; route(); var i = document.getElementById('sgQ'); if (i) { i.focus(); try { i.setSelectionRange(p, p); } catch (er) {} } }, 250); });
    on('sgMore', 'click', function () { SHOWN += 48; route(); });
    on('sgNear', 'click', function (e) {
      if (!navigator.geolocation) return;
      var b = e.target; b.disabled = true; b.textContent = 'Finding you...';
      navigator.geolocation.getCurrentPosition(function (p) { HERE = { lat: p.coords.latitude, lng: p.coords.longitude }; setPref('hub', 'all'); SHOWN = 24; route(); },
        function () { b.disabled = false; b.textContent = 'Near me'; }, { timeout: 15000, maximumAge: 300000 });
    });
  }

  // ---------- one store ----------
  function freshTag(it) {
    if (it.freshness === 'fresh') return tagHtml('Checked ' + fmtDate(it.last_confirmed_at), 'sa-tag-fresh');
    return tagHtml(it.freshness === 'stale' ? 'Needs a fresh check' : 'Not mapped by a member yet', it.freshness === 'stale' ? 'sa-tag-stale' : 'sa-tag-new') + bountyTag(it);
  }
  function firstPts() { var p = POINTS.confirm; return p && p.first_with_photo ? p.first_with_photo : 0; }
  function bountyTag(it) { return owner() && token() && it && it.bounty && firstPts() ? tagHtml('Bounty: first to map, ' + pts(firstPts()) + ' points', 'sa-tag-bounty') : ''; }
  function saveBtn(kind, key, on) {
    if (!owner() || !token()) return '';
    return '<button type="button" class="dg-save' + (on ? ' on' : '') + '" data-save="' + kind + '" data-key="' + esc(key) + '" aria-pressed="' + !!on + '">' + BOOKMARK + '<span>' + (on ? 'On my list' : 'Add to list') + '</span></button>';
  }
  // ---------- the store, by what it is (Sean, 2026-11-01) ----------
  // "Put dairy, meat. And then when you click on that, we have all the products together... sort it by the type. Almond, oat,
  // whatever, even banana... the type of dairy product, milk, butter, cream cheese, coffee creamer... then you go into the brand";
  // and "refrigerated, frozen, aisles or shelves, and produce to show where things are in the store". A store's spots are six
  // categories and its items the types inside them (ve_supermarket_seed_store, the same template at every store); a type is what
  // members map, its aisle at this store in the item's description. CATS and TYPES below are keyed by those names.
  var CATS = [
    { k: 'dairy-free', name: 'Dairy-free', img: 'milk', icon: 'cart', kinds: ['dairy'], line: 'Milk, creamer, yogurt, butter, cheese and ice cream' },
    { k: 'protein', name: 'Plant-based meat and protein', img: 'meat', icon: 'cart', kinds: ['meat', 'tofu', 'seafood', 'egg'], line: 'Burgers, chicken, sausage, tofu and tempeh' },
    { k: 'meals', name: 'Ready meals', img: 'frozen-meals', icon: 'cart', kinds: ['meals'], line: 'Frozen and fresh meals, ready to heat' },
    { k: 'pantry', name: 'Pantry', img: 'beans', icon: 'cart', kinds: ['pantry', 'protein'], line: 'Beans, lentils, nut butters and protein powder' },
    { k: 'snacks', name: 'Snacks and sweets', img: 'snacks', icon: 'cart', kinds: ['snacks', 'baked', 'dips', 'drinks'], line: 'Chips, cookies, treats, hummus and dips' },
    { k: 'produce', name: 'Produce', img: '', icon: 'leaf', kinds: [], line: 'Fruit, vegetables, greens and herbs' }
  ];
  // Each type: where it usually sits (cold, frozen, shelf, produce), its picture, and what fills it: the Guides' products by
  // product_type (ve_products) or the Directory's Food Brands by what they make (listings.product_kinds).
  var TYPES = {
    'Milk': { zone: 'cold', img: 'milk', types: ['Milk'] }, 'Coffee creamer': { zone: 'cold', img: 'milk', types: ['Coffee Creamer'] },
    'Yogurt': { zone: 'cold', img: 'yogurt', types: ['Yogurt'] }, 'Sour cream': { zone: 'cold', img: 'yogurt', types: ['Sour Cream'] },
    'Butter': { zone: 'cold', img: 'butter', types: ['Butter'] },
    'Cheese': { zone: 'cold', img: 'cheese', types: ['Shredded Cheese', 'Cheese Slices', 'Cheese Blocks', 'Cheese Spreads', 'Parmesan', 'Feta'] },
    'Cream cheese': { zone: 'cold', img: 'cheese', types: ['Cream Cheese'] }, 'Ice cream': { zone: 'frozen', img: 'ice-cream', types: ['Ice Cream'] },
    'Fresh plant-based meat': { zone: 'cold', img: 'meat', kinds: ['meat'] }, 'Frozen plant-based meat': { zone: 'frozen', img: 'frozen-meat', kinds: ['meat'] },
    'Tofu and tempeh': { zone: 'cold', img: 'tofu', kinds: ['tofu'] },
    'Frozen meals': { zone: 'frozen', img: 'frozen-meals', kinds: ['meals'] }, 'Refrigerated meals': { zone: 'cold', img: 'frozen-meals', kinds: ['meals'] },
    'Beans and lentils': { zone: 'shelf', img: 'beans', kinds: ['pantry'] }, 'Nut butters': { zone: 'shelf', img: 'nut-butter', kinds: ['pantry'] },
    'Protein powder': { zone: 'shelf', img: 'protein', kinds: ['protein'] },
    'Chips and snacks': { zone: 'shelf', img: 'snacks', kinds: ['snacks'] }, 'Cookies and treats': { zone: 'shelf', img: 'cookies', kinds: ['baked'] },
    'Hummus and dips': { zone: 'cold', img: 'dips', kinds: ['dips'] },
    'Fruit': { zone: 'produce' }, 'Vegetables': { zone: 'produce' }, 'Leafy greens and herbs': { zone: 'produce' }
  };
  var ZONES = [['cold', 'Refrigerated'], ['frozen', 'Frozen'], ['shelf', 'Aisles and shelves'], ['produce', 'Produce']];
  function zoneName(z) { for (var i = 0; i < ZONES.length; i++) if (ZONES[i][0] === z) return ZONES[i][1]; return ''; }
  // Finer cheese kinds, and the plain words for a product_type.
  var SUBTYPE = { 'Shredded Cheese': 'Shreds', 'Cheese Slices': 'Slices', 'Cheese Blocks': 'Blocks', 'Cheese Spreads': 'Spreads', 'Parmesan': 'Parmesan', 'Feta': 'Feta' };
  // What a product is made from, read from ve_products.made_from. A base shows as a filter only once a product carries it, so a
  // banana milk adds Banana by itself.
  var BASES = [['Oat', /\boats?\b/i], ['Almond', /almond/i], ['Soy', /\bsoy/i], ['Coconut', /coconut/i], ['Cashew', /cashew/i], ['Macadamia', /macadamia/i],
    ['Hazelnut', /hazelnut/i], ['Walnut', /walnut/i], ['Pistachio', /pistachio/i], ['Pili nut', /\bpili/i], ['Pea protein', /\bpea\b/i], ['Flax', /flax/i],
    ['Hemp', /hemp/i], ['Rice', /\brice\b/i], ['Banana', /banana/i], ['Potato', /potato/i], ['Beans', /\bbeans?\b|chickpea|lupin/i],
    ['Sunflower', /sunflower/i], ['Sesame', /sesame/i], ['Quinoa', /quinoa/i], ['Plant oils', /\boils?\b|olive|avocado/i], ['Tofu', /tofu/i]];
  function basesOf(s) { return BASES.filter(function (b) { return b[1].test(s || ''); }).map(function (b) { return b[0]; }); }
  function catOf(k) { for (var i = 0; i < CATS.length; i++) if (CATS[i].k === k) return CATS[i]; return null; }
  function catByName(n) { for (var i = 0; i < CATS.length; i++) if (CATS[i].name === n) return CATS[i]; return null; }
  function typeOfProduct(pt) { for (var n in TYPES) if ((TYPES[n].types || []).indexOf(pt) >= 0) return n; return null; }

  function secThumb(it) {
    var t = TYPES[it.name], k = t && t.img, src = it.photo_url || (k ? '/public/guides/supermarket/' + k + '.jpg' : '');
    if (!src) return '<span class="sg-thumb sg-thumb-x" aria-hidden="true"><span class="sg-thumb-i">' + ICON.leaf + '</span></span>';
    return '<span class="sg-thumb"><img src="' + esc(src) + '" alt="" width="64" height="64" loading="lazy" decoding="async"></span>';
  }
  function catThumb(c) {
    if (!c.img) return '<span class="sg-thumb sg-thumb-x" aria-hidden="true"><span class="sg-thumb-i">' + ICON[c.icon] + '</span></span>';
    return '<span class="sg-thumb"><img src="/public/guides/supermarket/' + c.img + '.jpg" alt="" width="64" height="64" loading="lazy" decoding="async"></span>';
  }
  function commentsHtml(it) {
    var cs = it.comments || [];
    if (!cs.length) return '';
    return '<div class="sa-cmts">' + cs.map(function (c) {
      return '<div class="sa-cmt">' + (c.photo ? '<a href="' + esc(c.photo) + '" target="_blank" rel="noopener"><img alt="A member\'s photo" src="' + esc(c.photo) + '" loading="lazy"></a>' : '') +
        '<p>&ldquo;' + esc(c.note || '') + '&rdquo;<span>' + esc(c.member || 'A member') + ' &middot; ' + esc(fmtDate(c.at)) + '</span></p></div>';
    }).join('') + '</div>';
  }
  // One type at this store: where it usually is, the aisle members mapped (the item's description), and Update.
  function aisleRow(v, it, catName, link) {
    var t = TYPES[it.name] || {}, z = zoneName(t.zone);
    return '<div class="sa-item sg-aisle">' + (link ? '<a class="sg-ilink" href="' + link + '">' + secThumb(it) + '</a>' : secThumb(it)) +
      '<div class="sa-item-b">' + (link ? '<a class="sg-iname" href="' + link + '"><b>' + esc(it.name) + '</b></a>' : '<b>' + esc(it.name) + '</b>') +
      '<p class="sg-zline">' + esc(z) + (catName ? ' &middot; ' + esc(catName) : '') + '</p>' + (it.description ? '<p>' + esc(it.description) + '</p>' : '') +
      '<div class="sa-vtags" style="margin:0">' + freshTag(it) + '</div></div>' +
      '<div class="sa-acts">' + saveBtn('venue_item', it.id, it.saved) + '<a class="sa-mini" href="#/store/' + esc(v.slug) + '/report/choose/' + it.id + '">Update</a></div>' + commentsHtml(it) + '</div>';
  }

  // The same, one line each, above a category's products: the type, where it usually sits, the aisle, Update.
  var NOT_MAPPED = 'Aisle not mapped yet. Be the first to tell us where it is in this store.';
  function aisleMini(v, it) {
    var t = TYPES[it.name] || {}, mapped = it.description && it.description !== NOT_MAPPED;
    return '<div class="sg-amini"><span class="sg-amini-b"><b>' + esc(it.name) + '</b><span>' + esc(zoneName(t.zone)) + ' &middot; ' +
      (mapped ? esc(it.description) : 'Aisle not mapped yet') + (it.freshness === 'fresh' ? ' &middot; checked ' + esc(fmtDate(it.last_confirmed_at)) : '') + '</span></span>' +
      (bountyTag(it) || '') + '<a class="sa-mini" href="#/store/' + esc(v.slug) + '/report/choose/' + it.id + '">Update</a></div>';
  }
  var PROD = null, PROD_WAIT = null, CHAIN_HAS = {};
  function rest(path) { return fetch(SB + '/rest/v1/' + path, { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }); }
  function loadProducts() {
    if (PROD) return Promise.resolve(PROD);
    if (PROD_WAIT) return PROD_WAIT;
    PROD_WAIT = Promise.all([
      rest('ve_products?select=id,slug,name,product_type,made_from,image_url,macros,listings!ve_products_brand_listing_id_fkey(slug,name,status,logo_url,vote_count)&limit=1000'),
      rest('listings?select=id,slug,name,logo_url,vote_count,product_kinds,tags&status=eq.approved&category=eq.Food%20Brands&limit=500')
    ]).then(function (x) {
      PROD = {
        products: (x[0] || []).filter(function (p) { return p.listings && p.listings.status === 'approved'; }),
        brands: (x[1] || []).filter(function (b) { return (b.tags || []).indexOf('lesaruss-ai-directory-candidate') < 0 && (b.product_kinds || []).length; })
      };
      return PROD;
    });
    return PROD_WAIT;
  }
  function chainHas(chain) {
    if (!chain || !chain.slug) return Promise.resolve({});
    if (CHAIN_HAS[chain.slug]) return Promise.resolve(CHAIN_HAS[chain.slug]);
    return rest('listings?select=id&slug=eq.' + encodeURIComponent(chain.slug) + '&status=eq.approved&limit=1').then(function (r) {
      if (!r[0]) return {};
      return rest('ve_product_stores?select=product_id&removed_at=is.null&store_listing_id=eq.' + r[0].id);
    }).then(function (rows) { var m = {}; (rows || []).forEach(function (x) { m[x.product_id] = 1; }); CHAIN_HAS[chain.slug] = m; return m; });
  }
  function pTitle(p) { var b = p.listings ? p.listings.name : ''; return p.name ? p.name : (b + ' ' + (p.product_type || '')).trim(); }

  // Everything in a category as one list of rows, products and brands alike, each with the same facets: its store types, where it
  // sits, what it is made from, its brand. The filters then work the same on both.
  function catRows(cat, typeNames) {
    if (!PROD) return { products: [], brands: [] };
    var products = [], byBrand = {};
    PROD.products.forEach(function (p) {
      var tn = typeOfProduct(p.product_type);
      if (!tn || typeNames.indexOf(tn) < 0) return;
      var b = p.listings || {};
      var row = { kind: 'p', p: p, title: pTitle(p), brand: b.slug, brandName: b.name || '', types: [tn], sub: SUBTYPE[p.product_type] || '', zones: [TYPES[tn].zone],
        bases: basesOf(p.made_from), votes: b.vote_count || 0, macros: p.macros || null, text: [pTitle(p), b.name, p.product_type, p.made_from, tn].join(' ') };
      products.push(row);
      var bb = byBrand[b.slug] || (byBrand[b.slug] = { types: [], zones: [], bases: [] });
      [['types', row.types], ['zones', row.zones], ['bases', row.bases]].forEach(function (f) { f[1].forEach(function (x) { if (bb[f[0]].indexOf(x) < 0) bb[f[0]].push(x); }); });
    });
    var brands = [];
    PROD.brands.forEach(function (b) {
      var own = byBrand[b.slug];
      var kts = typeNames.filter(function (tn) { return (TYPES[tn].kinds || []).some(function (k) { return (b.product_kinds || []).indexOf(k) >= 0; }); });
      var inCat = own || kts.length || (cat.kinds || []).some(function (k) { return (b.product_kinds || []).indexOf(k) >= 0; });
      if (!inCat) return;
      var types = own ? own.types : kts;
      brands.push({ kind: 'b', b: b, title: b.name, brand: b.slug, brandName: b.name, types: types, sub: '', zones: own ? own.zones : types.map(function (t) { return TYPES[t].zone; }),
        bases: own ? own.bases : [], votes: b.vote_count || 0, n: own ? products.filter(function (r) { return r.brand === b.slug; }).length : 0,
        text: [b.name].concat(types, (b.product_kinds || [])).join(' ') });
    });
    return { products: products, brands: brands };
  }
  function prodTile(r, has, chainName) {
    var p = r.p, b = p.listings || {}, pic = p.image_url || b.logo_url;
    return '<a class="sg-ptile" href="/products/' + esc(p.slug) + '"><span class="sg-thumb">' + (pic ? '<img src="' + esc(pic) + '" alt="" loading="lazy" decoding="async">' : '<i class="sg-letter">' + esc((b.name || '?').charAt(0)) + '</i>') + '</span>' +
      '<span class="sg-pb"><b>' + esc(r.title) + '</b><em>' + esc(b.name || '') + ' &middot; ' + esc(r.sub || r.types[0]) + (r.bases.length ? ' &middot; ' + esc(r.bases.join(', ')) : '') + '</em>' +
      (p.macros && window.VEMacros || has ? '<span class="sg-pmeta">' + (p.macros && window.VEMacros ? '<span class="sg-mac">' + esc(VEMacros.line(p.macros)) + '</span>' : '') +
        (has ? '<span class="dg-tag sa-tag-fresh">Seen at ' + esc(chainName) + '</span>' : '') + '</span>' : '') + '</span></a>';
  }
  // Sort products by their macros per serving (Sean, 2026-11-01: people "working out and watching their nutrition"). Products with
  // no macros yet go last.
  var SORTS = [['protein', 'Most protein'], ['p100', 'Most protein per calorie'], ['cal', 'Fewest calories']];
  function macroSort(o) {
    var val = function (r) {
      var m = r.macros; if (!m || m.cal == null) return null;
      return o === 'protein' ? -Number(m.protein || 0) : o === 'cal' ? Number(m.cal) : -(window.VEMacros ? VEMacros.per100(m) || 0 : 0);
    };
    return function (a, b) { var x = val(a), y = val(b); if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return x - y; };
  }
  function brandTile(r) {
    var b = r.b;
    return '<a class="sg-ptile" href="/directory/' + esc(b.slug) + '"><span class="sg-thumb">' + (b.logo_url ? '<img src="' + esc(b.logo_url) + '" alt="" loading="lazy" decoding="async">' : '<i class="sg-letter">' + esc((b.name || '?').charAt(0)) + '</i>') + '</span>' +
      '<span class="sg-pb"><b>' + esc(b.name) + '</b><em>' + (r.n ? r.n + (r.n === 1 ? ' product' : ' products') + ' here' : esc(r.types.join(', ') || 'Brand on Vegans Explore')) + (r.votes ? ' &middot; ' + r.votes + (r.votes === 1 ? ' vote' : ' votes') : '') + '</em></span></a>';
  }

  // The filters live in the address (#/store/<slug>/c/<category>?t=<type>&s=<cheese kind>&m=<made from>&b=<brand>&w=<where>&q=),
  // so a link from a brand's page opens the category already on that brand.
  function qs() { var h = location.hash || '', i = h.indexOf('?'), o = {}; if (i < 0) return o; h.slice(i + 1).split('&').forEach(function (kv) { var p = kv.split('='); if (p[0]) o[decodeURIComponent(p[0])] = decodeURIComponent((p[1] || '').replace(/\+/g, ' ')); }); return o; }
  function setQs(o) {
    var h = (location.hash || '').split('?')[0], q = Object.keys(o).filter(function (k) { return o[k]; }).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(o[k]); }).join('&');
    try { history.replaceState(null, '', h + (q ? '?' + q : '')); } catch (e) {}
  }
  function catLink(slug, ck, t) { return '#/store/' + slug + '/c/' + ck + (t ? '?t=' + encodeURIComponent(t) : ''); }
  function rememberStore(slug) { try { localStorage.setItem('sg_store', slug); } catch (e) {} }

  function viewCategory(slug, ck) {
    var d = VENUE[slug], v = d.venue, cat = catOf(ck);
    var spot = cat && d.spots.filter(function (s) { return s.name === cat.name; })[0];
    if (!cat || !spot) { location.hash = '#/store/' + slug; return; }
    var chainName = v.chain ? v.chain.name : 'this store', items = spot.items || [], typeNames = items.map(function (i) { return i.name; });
    var tabsHtml = '<div class="sg-cattabs" role="tablist" aria-label="Categories">' + CATS.map(function (c) {
      return '<a role="tab" href="' + catLink(v.slug, c.k) + '" class="sg-cattab' + (c.k === ck ? ' on' : '') + '" aria-selected="' + (c.k === ck) + '">' + esc(c.name) + '</a>'; }).join('') + '</div>';
    tabsHtml += '<label class="sa-city sg-catsel"><span class="sr-only">Category</span><select id="sgCatSel">' + CATS.map(function (c) {
      return '<option value="' + c.k + '"' + (c.k === ck ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select></label>';
    var head1 = '<div class="sg-sechead">' + catThumb(cat).replace('sg-thumb', 'sg-thumb sg-thumb-lg') + '<div><div class="dg-k">' + esc(v.name) + '</div><h2 class="dg-h1">' + esc(cat.name) + '</h2>' +
      '<p class="dg-lede" style="margin:0">' + esc(cat.line) + '. Every product together: narrow it by type, what it is made from, the brand and where it sits in the store.</p></div></div>';
    main.innerHTML = crumb([['Stores', '#/stores'], [v.name, '#/store/' + v.slug], [cat.name, '']]) + tabsHtml + head1 + '<div id="sgCat"><div class="dg-loading">Loading products...</div></div>';
    var cs = document.getElementById('sgCatSel'); if (cs) cs.addEventListener('change', function () { location.hash = catLink(v.slug, cs.value); });
    if (!d.open) { document.getElementById('sgCat').innerHTML = gated('<div class="dg-skel"><i></i><i style="width:70%"></i></div>', v.name + ' is in the full Guide', 'Every product, filtered your way, and the aisle members found it in at this store.'); return; }
    Promise.all([loadProducts(), chainHas(v.chain)]).then(function (x) {
      var box = document.getElementById('sgCat'); if (!box) return;
      var has = x[1] || {}, R = catRows(cat, typeNames), all = R.products.concat(R.brands), st = qs();
      var count = function (rows, f) { var m = {}; rows.forEach(function (r) { f(r).forEach(function (k) { if (k) m[k] = (m[k] || 0) + 1; }); }); return m; };
      var counted = R.products.length ? R.products : R.brands, tc = count(counted, function (r) { return r.types; });
      var types = typeNames.filter(function (t) { return tc[t]; });
      var sel = function (id, label, opts, cur, allLabel) {
        return '<label class="sa-city"><span>' + label + '</span><select id="' + id + '"><option value="">' + allLabel + '</option>' + opts.map(function (o) {
          return '<option value="' + esc(o[0]) + '"' + (o[0] === cur ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
      };
      function draw() {
        var t = st.t || '', s = st.s || '', m = st.m || '', b = st.b || '', w = st.w || '', q = st.q || '', o = st.o || '';
        var ok = function (r, skip) {
          return (skip === 't' || !t || r.types.indexOf(t) >= 0) && (skip === 's' || !s || r.sub === s || (r.kind === 'b' && !t)) &&
            (skip === 'm' || !m || r.bases.indexOf(m) >= 0) && (skip === 'b' || !b || r.brand === b) && (skip === 'w' || !w || r.zones.indexOf(w) >= 0) &&
            (!q || q.toLowerCase().split(/\s+/).every(function (word) { return !word || r.text.toLowerCase().indexOf(word) >= 0; }));
        };
        var P = R.products.filter(function (r) { return ok(r); }).sort(function (a, b2) { return (o ? macroSort(o)(a, b2) : 0) || (has[b2.p.id] ? 1 : 0) - (has[a.p.id] ? 1 : 0) || b2.votes - a.votes || a.title.localeCompare(b2.title); });
        var B = R.brands.filter(function (r) { return ok(r, s ? 's' : '') && (!s || R.products.some(function (p) { return p.brand === r.brand && p.sub === s; })); })
          .sort(function (a, b2) { return b2.n - a.n || b2.votes - a.votes || a.title.localeCompare(b2.title); });
        // Facet choices come from what is left under the other filters, so a choice never leads to nothing.
        var mc = count(all.filter(function (r) { return ok(r, 'm'); }), function (r) { return r.bases; });
        var bc = {}; all.filter(function (r) { return ok(r, 'b'); }).forEach(function (r) { if (r.brand) bc[r.brand] = r.brandName; });
        var wc = count(all.filter(function (r) { return ok(r, 'w'); }), function (r) { return r.zones; });
        var subs = t === 'Cheese' ? count(R.products.filter(function (r) { return r.types[0] === 'Cheese' && ok(r, 's'); }), function (r) { return [r.sub]; }) : {};
        var mOpts = BASES.map(function (x) { return x[0]; }).filter(function (k) { return mc[k] || k === m; }).map(function (k) { return [k, k + ' (' + (mc[k] || 0) + ')']; });
        var bOpts = Object.keys(bc).map(function (k) { return [k, bc[k]]; }).sort(function (a, b2) { return a[1].localeCompare(b2[1]); });
        if (b && !bc[b]) bOpts.unshift([b, b]);
        var wOpts = ZONES.filter(function (z) { return wc[z[0]] || z[0] === w; }).map(function (z) { return [z[0], z[1]]; });
        var chips = types.length > 1 ? '<div class="sg-chips" role="group" aria-label="Type">' + [['', 'All', counted.length]].concat(types.map(function (n) { return [n, n, tc[n]]; })).map(function (c) {
          return '<button type="button" class="sg-chip' + (t === c[0] ? ' on' : '') + '" data-t="' + esc(c[0]) + '" aria-pressed="' + (t === c[0]) + '">' + esc(c[1]) + ' <i>' + c[2] + '</i></button>'; }).join('') + '</div>' : '';
        var subChips = Object.keys(subs).length > 1 ? '<div class="sg-chips sg-subchips" role="group" aria-label="Kind of cheese">' +
          [['', 'All cheese', 0]].concat(Object.keys(SUBTYPE).map(function (k) { return [SUBTYPE[k], SUBTYPE[k], subs[SUBTYPE[k]]]; }).filter(function (x) { return x[2]; })).map(function (c) {
            return '<button type="button" class="sg-chip' + (s === c[0] ? ' on' : '') + '" data-s="' + esc(c[0]) + '" aria-pressed="' + (s === c[0]) + '">' + esc(c[1]) + (c[0] ? ' <i>' + c[2] + '</i>' : '') + '</button>'; }).join('') + '</div>' : '';
        var selects = (mOpts.length ? sel('sgM', 'Made from', mOpts, m, 'Anything') : '') + (bOpts.length > 1 ? sel('sgB', 'Brand', bOpts, b, 'Every brand') : '') +
          (wOpts.length > 1 || w ? sel('sgW', 'Where in the store', wOpts, w, 'Anywhere') : '') +
          (R.products.some(function (r) { return r.macros; }) ? sel('sgO', 'Sort products', SORTS, o, 'Best match') : '');
        var active = [t, s, m, b, w, q, o].some(Boolean);
        // The aisle at this store for each type in view.
        var aisleItems = items.filter(function (it) { return !t || it.name === t; });
        var aisles = '<h3 class="sg-ph">Where it is at ' + esc(v.name) + '</h3><div class="sg-aminis">' + aisleItems.map(function (it) { return aisleMini(v, it); }).join('') + '</div>';
        var lists = '';
        if (R.products.length) lists += '<h3 class="sg-ph sg-ph2">Products <i>' + P.length + '</i></h3>' +
          (P.length ? '<div class="sg-pgrid sg-pbox">' + P.map(function (r) { return prodTile(r, has[r.p.id], chainName); }).join('') + '</div>' : '<p class="dg-empty">No products match. Try another filter.</p>');
        if (R.brands.length) lists += '<h3 class="sg-ph sg-ph2">Brands <i>' + B.length + '</i></h3>' +
          (B.length ? '<div class="sg-pgrid sg-pbox">' + B.map(brandTile).join('') + '</div>' : '<p class="dg-empty">No brands match. Try another filter.</p>');
        if (!R.products.length && !R.brands.length) lists += ck === 'produce'
          ? '<h3 class="sg-ph">What to buy and why</h3><div class="sg-tips">' + PRODUCE.map(function (p) { return '<div class="sg-tip"><span class="sg-tip-i">' + ICON.leaf + '</span><div><b>' + esc(p[0]) + '</b><p>' + esc(p[1]) + '</p></div></div>'; }).join('') + '</div>'
          : '<p class="dg-empty">We have no products listed here yet. Seen one in this store? Tap Update on its type above, add a photo, and it goes on this page once the team checks it.</p>';
        var filters = all.length ? '<div class="sg-pfilter"><label class="sg-psearch"><span class="sr-only">Search ' + esc(cat.name) + '</span><input type="search" id="sgPQ" placeholder="Search ' + esc(cat.name === 'Dairy-free' ? 'dairy-free' : cat.name.charAt(0).toLowerCase() + cat.name.slice(1)) + '..." value="' + esc(q) + '" autocomplete="off"></label>' +
          chips + subChips + (selects ? '<div class="sg-fsel">' + selects + '</div>' : '') + (active ? '<button type="button" class="sg-reset" id="sgReset">Clear filters</button>' : '') + '</div>' : '';
        var focus = document.activeElement && document.activeElement.id === 'sgPQ', pos = focus ? document.activeElement.selectionStart : 0;
        // One type picked: its aisle line sits right above its products; all types: the eight lines follow the products, so they stay in view.
        box.innerHTML = filters + (t ? aisles : '') + '<div id="sgPLists">' + lists + '</div>' + (t ? '' : aisles);
        if (focus) { var qi = document.getElementById('sgPQ'); qi.focus(); try { qi.setSelectionRange(pos, pos); } catch (e) {} }
        bind();
      }
      function upd(k, val) { st[k] = val; if (k === 't') st.s = ''; setQs(st); draw(); }
      function bind() {
        box.querySelectorAll('[data-t]').forEach(function (el) { el.addEventListener('click', function () { upd('t', el.getAttribute('data-t')); }); });
        box.querySelectorAll('[data-s]').forEach(function (el) { el.addEventListener('click', function () { upd('s', el.getAttribute('data-s')); }); });
        [['sgM', 'm'], ['sgB', 'b'], ['sgW', 'w'], ['sgO', 'o']].forEach(function (x) { var el = document.getElementById(x[0]); if (el) el.addEventListener('change', function () { upd(x[1], el.value); }); });
        var qi = document.getElementById('sgPQ'); if (qi) qi.addEventListener('input', function () { clearTimeout(bind.t); bind.t = setTimeout(function () { upd('q', qi.value); }, 200); });
        var rs = document.getElementById('sgReset'); if (rs) rs.addEventListener('click', function () { st = {}; setQs(st); draw(); });
      }
      draw();
    });
  }

  // The store page: the six categories (by what it is), or the same types laid out by where they sit (by where it is).
  function viewStore(slug, rest) {
    var r = (rest || '').split('?')[0].split('/');
    if (r[0] === 'report') return viewReport(slug, r[1], r[2]);
    var d = VENUE[slug];
    if (!d) {
      main.innerHTML = crumb([['Stores', '#/stores'], ['...', '']]) + '<div class="dg-loading">Loading the store...</div>';
      api({ action: 'venue', slug: slug }).then(function (x) { VENUE[slug] = x; if (curView().indexOf('store/' + slug) === 0) route(); }).catch(function () { main.innerHTML = '<p class="dg-empty">That did not load. Refresh to try again.</p>'; });
      return;
    }
    if (d.error) { main.innerHTML = crumb([['Stores', '#/stores']]) + '<p class="dg-empty">We could not find that store.</p>'; return; }
    rememberStore(slug);
    if (r[0] === 'c' && r[1]) { viewCategory(slug, r[1]); wrapRail(); return; }
    if (r[0] === 's') { location.replace('#/store/' + slug); return; }
    var byWhere = r[0] === 'where';
    var v = d.venue;
    var lede = ICON.pin + ' ' + esc(v.address || v.city || '');
    var meta = '<div class="sa-vhead">' + (v.maps ? '<a href="' + esc(v.maps) + '" target="_blank" rel="noopener">Directions</a>' : '') +
      (v.chain ? '<a href="/directory/' + esc(v.chain.slug) + '">' + esc(v.chain.name) + ' on Vegans Explore</a>' : '') + '</div>';
    var acts = '<div class="dg-btns">' + saveBtn('venue', v.slug, d.saved).replace('Add to list', 'Save store').replace('On my list', 'Saved') +
      '<a class="dg-btn dg-ghost" href="#/store/' + esc(v.slug) + '/report/missing">Add something missing</a></div>';
    var sw = '<div class="sg-switch" role="tablist" aria-label="How to see this store"><a role="tab" href="#/store/' + esc(v.slug) + '" class="' + (byWhere ? '' : 'on') + '" aria-selected="' + !byWhere + '">By what it is</a>' +
      '<a role="tab" href="#/store/' + esc(v.slug) + '/where" class="' + (byWhere ? 'on' : '') + '" aria-selected="' + byWhere + '">By where it is</a></div>';
    if (!PROD) loadProducts().then(function () { if (curView().split('?')[0] === 'store/' + slug) route(); });
    var body;
    if (!byWhere) {
      body = '<div class="sg-cats">' + CATS.map(function (c) {
        var sp = d.spots.filter(function (s) { return s.name === c.name; })[0];
        var its = sp ? (sp.items || []) : [], mapped = its.filter(function (i) { return i.freshness === 'fresh'; }).length;
        var R = PROD && d.open ? catRows(c, its.map(function (i) { return i.name; })) : null;
        var cnt = R ? (R.products.length ? R.products.length + ' products' : '') + (R.brands.length ? (R.products.length ? ' &middot; ' : '') + R.brands.length + ' brands' : '') : '';
        return '<a class="sg-cat" href="' + catLink(v.slug, c.k) + '">' + catThumb(c) + '<span class="sg-catb"><b>' + esc(c.name) + '</b><span>' + esc(c.line) + '</span>' +
          '<em>' + (cnt ? cnt + ' &middot; ' : '') + (sp ? (d.open ? mapped + ' of ' + (sp.item_count || its.length) + ' aisles mapped' : (sp.item_count || 0) + ' types') : '') + '</em></span></a>';
      }).join('') + '</div>';
    } else {
      var all = [];
      d.spots.forEach(function (s) { (s.items || []).forEach(function (it) { all.push({ it: it, cat: catByName(s.name) }); }); });
      body = d.open ? '<div class="sg-depts">' + ZONES.map(function (z) {
        var here = all.filter(function (x) { return (TYPES[x.it.name] || {}).zone === z[0]; });
        if (!here.length) return '';
        return '<div class="sa-stand"><div class="sa-stand-h"><div class="sg-dh"><span class="sg-dicon">' + (z[0] === 'produce' ? ICON.leaf : z[0] === 'shelf' ? ICON.list : ICON.store) + '</span><div><h3>' + esc(z[1]) + '</h3></div></div></div>' +
          here.map(function (x) { return aisleRow(v, x.it, x.cat ? x.cat.name : '', x.cat ? catLink(v.slug, x.cat.k, x.it.name) : ''); }).join('') + '</div>';
      }).join('') + '</div>' : '';
    }
    var note = '<p class="dg-lede" style="font-size:13px;margin-top:4px">Stores move things around, so an aisle can change. Every type says when a member last checked it. Something not where it says? Tap Update and tell us.</p>';
    main.innerHTML = crumb([['Stores', '#/stores'], [v.name, '']]) + head(v.free && !owner() ? 'Free to everyone' : (v.chain ? v.chain.name : 'Supermarket'), esc(v.name), lede, acts) + meta + sw +
      (d.open || !byWhere ? body + (d.open ? note : '') : gated('<div class="dg-skel"><i></i><i style="width:70%"></i></div>', v.name + ' is in the full Guide', 'Every Vegan type in this store and the aisle members found it in.'));
    wrapRail();
  }
  // Three-fourths content, one-fourth our sponsors' space (Sean, 2026-11-01): the rail is ve-ad-rail.js, page /guides/supermarket-guide,
  // a Guide in slot 1 and Humble Cabbage's still image in slot 2 until a supermarket or brand sponsor takes them.
  function wrapRail() {
    if (!window.VEAdRail) return;
    var inner = main.innerHTML;
    main.innerHTML = '<div class="vear-layout"><div class="vear-main">' + inner + '</div><aside class="vear-rail" data-ad-page="/guides/supermarket-guide" aria-label="Sponsors"></aside></div>';
    try { window.VEAdRail.mountAll(main); } catch (e) {}
  }


  // ---------- Help keep it right ----------
  // What a report pays (Sean, 2026-11-01): the full amounts and the first-to-confirm bounty at a store whose chain is sponsored
  // (venue.sponsored from ve-venues), the standard amounts (std_*) and no bounty everywhere else.
  function ptsLine(kind, it, v) {
    var p = POINTS[kind]; if (!p) return '';
    if (v && v.sponsored === false && p.std_with_photo != null) return pts(p.std_with_photo) + ' points with a photo, ' + pts(p.std_no_photo) + ' without';
    if (kind === 'confirm' && it && it.bounty && p.first_with_photo) return 'Bounty, be first: ' + pts(p.first_with_photo) + ' points with a photo, ' + pts(p.first_no_photo) + ' without';
    return pts(p.with_photo) + ' points with a photo, ' + pts(p.no_photo) + ' without';
  }
  function viewReportTab() {
    var signedIn = !!token();
    var P = function (k, f, d) { return POINTS[k] ? POINTS[k][f] : d; };
    // Each row: the full amounts (stores of a sponsored chain), then the standard ones (every other store); null = no bounty there.
    var rows = [
      ['Tell us the aisle', 'Where a section is in your store, the first accepted report', P('wrong', 'with_photo', 100), P('wrong', 'no_photo', 50), P('wrong', 'std_with_photo', 40), P('wrong', 'std_no_photo', 20)],
      ['Something missing', 'A Vegan product or section not in the Guide for this store yet', P('missing', 'with_photo', 100), P('missing', 'no_photo', 50), P('missing', 'std_with_photo', 40), P('missing', 'std_no_photo', 20)],
      ['Agrees with the first', 'An aisle the team already accepted from someone else', P('wrong', 'agree_with_photo', 25), P('wrong', 'agree_no_photo', 15), P('wrong', 'std_agree_with_photo', 10), P('wrong', 'std_agree_no_photo', 5)],
      ['Still here, first to confirm', 'The bounty: the first member to confirm a section no one has checked in ' + (LIMITS.fresh_days || 35) + ' days', P('confirm', 'first_with_photo', 50), P('confirm', 'first_no_photo', 25), null, null],
      ['Still here', 'After someone has confirmed it', P('confirm', 'with_photo', 10), P('confirm', 'no_photo', 5), P('confirm', 'std_with_photo', 5), P('confirm', 'std_no_photo', 2)],
      ['Comment', 'A tip for other shoppers', P('comment', 'with_photo', 10), P('comment', 'no_photo', 5), P('comment', 'std_with_photo', 5), P('comment', 'std_no_photo', 2)]
    ];
    var pair = function (a, b) { return a == null ? '<span role="cell" class="sa-pnone">No bounty</span>' : '<span role="cell"><b>' + pts(a) + '</b> / <b>' + pts(b) + '</b></span>'; };
    main.innerHTML = head('Help keep it right', 'Members map the aisles', 'Stores move things around. When you are shopping, tell us which aisle a Vegan section is in, what is still there, and what is missing. A photo earns more, and every report is checked by the team before it pays. Stores of a supermarket that sponsors the Guide pay the most and carry the bounties; every other store earns the standard points.') +
      '<div class="sa-ptable" role="table" aria-label="Points for each kind of report, with a photo and without"><div class="sa-ptr sa-pth" role="row"><span role="columnheader">What you send</span><span role="columnheader"><span class="sa-long">Sponsored supermarkets</span><span class="sa-short">Sponsored</span><i>photo / none</i></span><span role="columnheader"><span class="sa-long">Every other store</span><span class="sa-short">Other stores</span><i>photo / none</i></span></div>' +
      rows.map(function (r) { return '<div class="sa-ptr" role="row"><span role="cell"><b>' + esc(r[0]) + '</b><i>' + esc(r[1]) + '</i></span>' + pair(r[2], r[3]) + pair(r[4], r[5]) + '</div>'; }).join('') + '</div>' +
      '<ol class="sa-steps"><li>Open your store while you are there and tap <b>Update</b> on a section, or <b>Add something missing</b>.</li>' +
      '<li>Add a photo of the shelf or the aisle sign if you can. Your phone shares your location once, to show you are in the store.</li>' +
      '<li>The team checks every one. Points land when it is accepted, up to ' + (LIMITS.daily_paid_cap || 40) + ' paid a day. Look for <b>Bounty</b> at sponsored supermarkets: the first to confirm a section earns the most.</li></ol>' +
      '<div class="dg-btns" style="margin-bottom:18px"><a class="dg-btn" href="#/stores">Find your store</a></div>' +
      (signedIn ? '<h3 class="dg-k" style="margin:6px 0 10px">Your reports</h3><div id="saMine"><div class="dg-loading">Loading your reports...</div></div>' : '');
    if (signedIn) api({ action: 'mine' }).then(function (d) {
      var el = document.getElementById('saMine'); if (!el) return;
      var list = ((d && d.reports) || []).filter(function (r) { return /supermarket|publix/i.test(r.venue_slug || '') || true; });
      el.innerHTML = list.length ? '<div class="dg-rows">' + list.map(function (r) {
        var st = STATUS[r.status] || STATUS.pending;
        return '<div class="dg-row" style="grid-template-columns:minmax(0,1fr) auto"><div class="dg-row-main"><b>' + esc((REPORT[r.kind] || [r.kind])[0]) + ': ' + esc(r.item || r.spot || r.note || '') + '</b><span>' + esc(r.venue || '') + ' &middot; ' + esc(fmtDate(r.at)) +
          (r.points ? ' &middot; ' + r.points + ' points' : '') + (r.review_note ? ' &middot; ' + esc(r.review_note) : '') + '</span></div>' + tagHtml(st[0], 'dg-tag-' + st[1]) + '</div>';
      }).join('') + '</div>' : '<p class="dg-empty">No reports yet. Your first one is waiting on your next shop.</p>';
    });
  }
  function viewChoose(v, item, back) {
    main.innerHTML = crumb([['Stores', '#/stores'], [v.name, back], ['Update', '']]) +
      head('Update', esc(item.it.name), esc(item.spot.name) + '. What would you like to tell us? Each one earns points once the team accepts it, more with a photo.') +
      '<div class="sa-choose">' + ['wrong', 'confirm', 'gone', 'comment'].map(function (k) {
        return '<a class="sa-choice" href="#/store/' + esc(v.slug) + '/report/' + k + '/' + item.it.id + '"><b>' + esc(REPORT[k][2]) + '</b><span>' + esc(REPORT[k][1]) + '</span>' +
          (ptsLine(k, item.it, v) ? '<i>' + esc(ptsLine(k, item.it, v)) + '</i>' : '') + '</a>';
      }).join('') + '</div><div class="dg-formnav"><a class="dg-tnav" href="' + back + '">Back</a></div>';
  }
  var PHOTO = null;
  function viewReport(slug, kind, itemId) {
    var d = VENUE[slug];
    if (!d) { viewStore(slug); return; }
    var v = d.venue, item = null;
    d.spots.forEach(function (s) { (s.items || []).forEach(function (it) { if (it.id === itemId) item = { it: it, spot: s }; }); });
    var back = '#/store/' + v.slug;
    if (kind === 'choose' && item) return viewChoose(v, item, back);
    if (!REPORT[kind]) kind = 'missing';
    var gate = !token() ? '<div class="dg-door"><p>Sign in to send a report. Reports are for Passport holders.</p><div class="dg-btns"><button type="button" class="dg-btn" data-signin>Sign in</button><a href="/passport" style="font-weight:800;color:var(--g)">Get your Passport</a></div></div>'
      : !ME.active ? '<div class="dg-door"><p>Reports are for Passport holders. Your Passport is $11, one time, with 1,100 welcome points.</p><a class="dg-btn" href="/passport">Get your Passport</a></div>'
      : !owner() ? '<div class="dg-door"><p>Bounties unlock with the Guide. Once it is yours, every report you send from the store earns points, and the first to map a section earns the bounty.</p><a class="dg-btn" href="#/join">Get the Guide</a></div>' : '';
    if (!v.can_report) gate = '<div class="dg-door"><p>Reports for ' + esc(v.name) + ' open soon.</p></div>';
    var what = item ? '<p class="dg-sharenote"><b>' + esc(item.it.name) + '</b> &middot; ' + esc(item.spot.name) + '</p>' : '';
    var kinds = item ? '<div class="sa-kinds">' + ['wrong', 'confirm', 'gone', 'comment'].map(function (k) {
      return '<a class="dg-chip" aria-pressed="' + (k === kind) + '" href="#/store/' + esc(v.slug) + '/report/' + k + '/' + item.it.id + '">' + esc(REPORT[k][2]) + '</a>'; }).join('') + '</div>' : '';
    var noteLabel = kind === 'missing' ? 'What is missing? <i>The product or section, and the aisle it is in</i>' : kind === 'confirm' ? 'Anything to add? <i>(optional)</i>'
      : kind === 'comment' ? 'Your comment <i>(a tip for other shoppers)</i>' : kind === 'gone' ? 'Anything to add? <i>(optional)</i>' : 'Which aisle is it in? <i>(the number on the sign, and anything that helps: left side, end cap, near the dairy)</i>';
    var earn = ptsLine(kind, item && item.it, v);
    main.innerHTML = crumb([['Stores', '#/stores'], [v.name, back]].concat(item ? [['Update', '#/store/' + v.slug + '/report/choose/' + item.it.id]] : []).concat([[REPORT[kind][2], '']])) + head('Report', esc(REPORT[kind][2]), esc(REPORT[kind][1])) +
      (gate || ('<div class="dg-form">' + what + kinds +
        '<label class="dg-field"><span>' + noteLabel + '</span><textarea id="saNote" rows="3" maxlength="600"></textarea></label>' +
        (earn ? '<p class="sa-earn">' + esc(earn) + ', once the team accepts it.</p>' : '') +
        '<div class="dg-field"><span>A photo <i>(optional: the shelf or the aisle sign, and it earns more)</i></span><div class="sa-photo"><label class="dg-btn dg-ghost" style="cursor:pointer">Take or choose a photo<input type="file" id="saPhoto" accept="image/*" capture="environment" hidden></label><span id="saPrev"></span></div></div>' +
        '<span class="dg-status" id="saStatus" role="status"></span>' +
        '<div class="dg-formnav"><a class="dg-tnav" href="' + back + '">Back</a><button type="button" class="dg-btn" id="saSend">Send report</button></div>' +
        '<p class="dg-lede" style="font-size:12.5px;margin-top:12px">Sending asks for your location once, to check you are at ' + esc(v.name) + '. The team checks every report; a comment they accept shows on the section with your first name and photo.</p></div>'));
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
    too_far: function (d, v) { return 'You need to be at ' + v.name + ' to send this. You look to be about ' + (d.distance_m >= 1000 ? (d.distance_m / 1000).toFixed(1) + ' km' : d.distance_m + ' m') + ' away.'; },
    not_precise: function () { return 'Your location is not precise enough right now. Step near a window or the entrance for a moment and try again.'; },
    no_position: function () { return 'We need your location once to check you are in the store.'; },
    no_location: function (d, v) { return 'Reports for ' + v.name + ' open soon.'; },
    already_today: function () { return 'You already sent this report today. Thank you!'; },
    guide_required: function () { return 'Bounties unlock with the Guide. Get it under Get access.'; },
    daily_limit: function () { return 'That is the most reports for one day. Thank you, and come back next shop.'; },
    note_required: function () { return 'Add a few words first.'; },
    bad_photo: function (d) { return (d && d.message) || 'The photo did not upload. Try again, or send it without one.'; }
  };
  function sendReport(v, kind, item) {
    var note = (document.getElementById('saNote') || {}).value || '';
    if ((kind === 'missing' || kind === 'wrong' || kind === 'comment') && note.trim().length < 2) { setStatus(kind === 'wrong' ? 'Tell us which aisle it is in.' : kind === 'missing' ? 'Tell us what is missing and the aisle.' : 'Write your comment first.'); return; }
    if (!navigator.geolocation) { setStatus('This browser cannot share your location, which the report needs.'); return; }
    var btn = document.getElementById('saSend'); btn.disabled = true; btn.textContent = 'Finding you...';
    var fail = function (msg) { btn.disabled = false; btn.textContent = 'Send report'; setStatus(msg); };
    navigator.geolocation.getCurrentPosition(function (pos) {
      btn.textContent = 'Sending...';
      var send = function (path) {
        return api({ action: 'report', venue: v.slug, kind: kind, item: item ? item.it.id : undefined, spot: item ? item.spot.id : undefined,
          note: note, path: path || undefined, lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
      };
      (PHOTO ? api({ action: 'report_start' }).then(function (s) {
        if (!s || !s.upload_url) throw s || {};
        return fetch(s.upload_url, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: PHOTO }).then(function (r) { if (!r.ok) throw {}; return send(s.path); });
      }) : send(null)).then(function (d) {
        if (d && d.ok) {
          main.innerHTML = crumb([['Stores', '#/stores'], [v.name, '#/store/' + v.slug], ['Sent', '']]) +
            '<div class="dg-done"><div class="dg-k">Sent</div><h2 class="dg-h1">Thank you!</h2><p class="dg-lede">The team checks every report. ' + (d.bounty ? 'You are first on this one: when the team accepts it, it pays the bounty. ' : '') + 'Points land when yours is accepted, and you can follow it under Help keep it right.</p>' +
            '<div class="dg-btns"><a class="dg-btn" href="#/store/' + esc(v.slug) + '">Back to the store</a><a class="dg-btn dg-ghost" href="#/report">Your reports</a></div></div>';
          return;
        }
        var f = d && WHY[d.why]; fail(f ? f(d, v) : (d && d.message) || 'That did not go through. Try again in a minute.');
      }).catch(function (e) { fail((e && e.message) || 'That did not go through. Try again in a minute.'); });
    }, function () { fail(WHY.no_position()); }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 });
  }

  // ---------- shopping list ----------
  function ticks() { try { return JSON.parse(localStorage.getItem('sg_ticks') || '{}'); } catch (e) { return {}; } }
  function viewList() {
    main.innerHTML = head('Shopping list', 'Your shopping list', 'What you added from your stores, by store and aisle. Tick things off as you go; the ticks stay in this browser.') + '<div id="sgList"><div class="dg-loading">Loading your list...</div></div>';
    api({ action: 'saves' }).then(function (d) {
      var el = document.getElementById('sgList'); if (!el) return;
      var its = (d && d.items) || [], vs = (d && d.venues) || [];
      if (!its.length && !vs.length) { el.innerHTML = '<p class="dg-empty">Nothing on your list yet. Open your store and tap Add to list on what you need.</p><a class="dg-btn" href="#/stores">Find your store</a>'; return; }
      var by = {}, order = [];
      its.forEach(function (i) { if (!by[i.venue_slug]) { by[i.venue_slug] = { name: i.venue, items: [] }; order.push(i.venue_slug); } by[i.venue_slug].items.push(i); });
      var t = ticks();
      el.innerHTML = order.map(function (slug) {
        var g = by[slug];
        return '<div class="sa-stand"><div class="sa-stand-h"><div><h3><a href="#/store/' + esc(slug) + '" style="color:inherit">' + esc(g.name) + '</a></h3></div></div>' + g.items.map(function (i) {
          return '<label class="sg-tick"><input type="checkbox" data-tick="' + esc(i.id) + '"' + (t[i.id] ? ' checked' : '') + '><span><b>' + esc(i.name) + '</b><i>' + esc(i.spot || '') + '</i></span></label>';
        }).join('') + '</div>';
      }).join('') + (vs.length ? '<h3 class="dg-k" style="margin:14px 0 8px">Saved stores</h3><div class="sg-stores">' + vs.map(function (v) { return '<a class="sg-store" href="#/store/' + esc(v.slug) + '"><span class="sg-logo">' + ICON.store + '</span><span class="sg-sbody"><b>' + esc(v.name) + '</b><span class="sa-vmeta">' + esc(v.city || '') + '</span></span></a>'; }).join('') + '</div>' : '') +
        '<div class="dg-btns" style="margin-top:14px"><button type="button" class="dg-btn dg-ghost" id="sgClear">Clear the ticks</button><button type="button" class="dg-btn dg-ghost" id="sgCopy">Copy the list</button></div>';
      el.addEventListener('change', function (e) { var c = e.target.closest('[data-tick]'); if (!c) return; var tt = ticks(); if (c.checked) tt[c.getAttribute('data-tick')] = 1; else delete tt[c.getAttribute('data-tick')]; try { localStorage.setItem('sg_ticks', JSON.stringify(tt)); } catch (er) {} });
      document.getElementById('sgClear').addEventListener('click', function () { try { localStorage.removeItem('sg_ticks'); } catch (er) {} viewList(); });
      document.getElementById('sgCopy').addEventListener('click', function (e) {
        var txt = order.map(function (slug) { return by[slug].name + '\n' + by[slug].items.map(function (i) { return '- ' + i.name; }).join('\n'); }).join('\n\n');
        (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { e.target.textContent = 'Copied'; }).catch(function () { e.target.textContent = 'Could not copy'; });
      });
    });
  }

  // ---------- produce ----------
  // ---------- Scan (Sean, 2026-11-01: "a tab where they can scan an item... it should take them to its profile") ----------
  // #/scan opens the camera; #/scan/<barcode> shows what it is: ours (its macros, its page, the stores that carry its line), or what Open
  // Food Facts says with Add it for the team to check.
  var SCANS = {};
  function scanBtn(label) { return '<button type="button" class="dg-btn" id="sgScanGo" style="display:inline-flex;align-items:center;gap:8px">' + ICON.camera.replace(/26/g, '20') + esc(label) + '</button>'; }
  function bindScan() {
    var b = document.getElementById('sgScanGo');
    if (b) b.addEventListener('click', function () {
      if (!window.VEScan) return;
      VEScan.open({ title: 'Scan a product', onCode: function (code) { location.hash = '#/scan/' + code; } });
    });
  }
  function viewScan(code) {
    if (!code) {
      main.innerHTML = crumb([['Scan', '']]) + '<div class="dg-k">Scan</div><h2 class="dg-h1">Scan a product</h2>' +
        '<p class="dg-lede">Point your phone at the barcode on anything in the aisle. You will see what it is, its macros per serving, and which supermarkets carry it. No camera? Type the numbers under the barcode.</p>' +
        '<p>' + scanBtn('Scan a barcode') + '</p>' +
        '<div class="sg-tips" style="margin-top:22px"><div class="sg-tip"><span class="sg-tip-i">' + ICON.star + '</span><div><b>Its macros, right there</b><p>Calories, protein, carbs and fat per serving, and protein per 100 calories for anyone watching their training.</p></div></div>' +
        '<div class="sg-tip"><span class="sg-tip-i">' + ICON.store + '</span><div><b>Where to find it</b><p>The supermarkets that carry it, and the aisle members found it in at your store.</p></div></div>' +
        '<div class="sg-tip"><span class="sg-tip-i">' + ICON.leaf + '</span><div><b>Not in the Guide yet?</b><p>Add it. The team checks it is Vegan, and it joins the Guide for everyone.</p></div></div></div>' +
        '<p class="sg-small" style="margin-top:16px">Nothing is recorded when you scan; the picture never leaves your phone.</p>';
      bindScan(); return;
    }
    main.innerHTML = crumb([['Scan', '#/scan'], [code, '']]) + '<div class="dg-loading">Looking it up...</div>';
    var go = SCANS[code] ? Promise.resolve(SCANS[code]) : papi({ action: 'lookup', code: code }).then(function (d) { SCANS[code] = d; return d; });
    go.then(function (d) {
      if (curView().split('?')[0] !== 'scan/' + code) return;
      if (!d || d.error) { main.innerHTML = crumb([['Scan', '#/scan'], [code, '']]) + '<p class="dg-empty">' + esc((d && d.message) || 'That did not load. Try again.') + '</p><p>' + scanBtn('Scan again') + '</p>'; bindScan(); return; }
      if (d.found && d.product) return drawScanOurs(code, d);
      drawScanOther(code, d);
    }).catch(function () { main.innerHTML = '<p class="dg-empty">That did not load. Refresh to try again.</p>'; });
  }
  function scanHead(code, pic, name, sub) {
    return crumb([['Scan', '#/scan'], [name || code, '']]) + '<div class="sg-scanhead"><span class="sg-thumb sg-thumb-lg">' + (pic ? '<img src="' + esc(pic) + '" alt="" decoding="async">' : '<i class="sg-letter">?</i>') + '</span>' +
      '<div><div class="dg-k">Barcode ' + esc(code.replace(/^0+(?=\d{12})/, '')) + '</div><h2 class="dg-h1" style="margin:2px 0 4px">' + esc(name || 'Unknown item') + '</h2>' + (sub || '') + '</div></div>';
  }
  function drawScanOurs(code, d) {
    var p = d.product, b = d.brand || {}, page = '/directory/' + encodeURIComponent(b.slug || '') + '?tab=products&product=' + encodeURIComponent(p.slug);
    // The Guides' products are all dairy-free today, so their shelf is the Dairy-free category.
    var tn = typeOfProduct(p.product_type), cat = tn ? catOf('dairy-free') : null;
    var last = ''; try { last = localStorage.getItem('sg_store') || ''; } catch (e) {}
    var shelf = cat ? '#/store/' + (last || FREE) + '/c/' + cat.k + '?t=' + encodeURIComponent(tn) + '&b=' + encodeURIComponent(b.slug || '') : '';
    var pending = d.status === 'pending';
    // The line's name as the title ("Oatly Milk"); the barcode's own item ("Original") under it.
    var lineName = p.name || ((b.name || '') + ' ' + (p.product_type || '')).trim();
    main.innerHTML = scanHead(code, d.image_url || p.image_url, lineName, '<p class="dg-lede" style="margin:0">' + (d.name && d.name !== lineName ? esc(d.name) + ' &middot; ' : '') + esc(b.name || '') +
      (pending ? ' &middot; <span class="dg-tag sa-tag-ask">Waiting for the team</span>' : '') + '</p>') +
      (window.VEMacros ? VEMacros.strip(d.macros) || '<p class="sg-small">Macros for this one are not added yet.</p>' : '') +
      '<div class="sg-scanacts"><a class="dg-btn" href="' + esc(page) + '">Open its page</a>' + (shelf ? '<a class="dg-btn dg-ghost" href="' + esc(shelf) + '">Every ' + esc(tn.toLowerCase()) + ' like it</a>' : '') + '</div>' +
      '<h3 class="sg-ph">Carried at</h3><div id="sgCarried"><div class="dg-loading">Loading...</div></div>' +
      (d.ingredients ? '<p class="sg-small" style="margin-top:18px"><b>Ingredients:</b> ' + esc(d.ingredients) + '</p>' : '') +
      '<p class="sg-small">From ' + (d.source === 'usda' ? 'the USDA\'s record of the label' : 'what members and Open Food Facts reported') + '. Recipes change, so check the package.</p><p>' + scanBtn('Scan another') + '</p>';
    bindScan();
    rest('ve_product_stores?select=store_listing_id,removed_at,listings!ve_product_stores_store_listing_id_fkey(slug,name,logo_url,status)&product_id=eq.' + p.id).then(function (rows) {
      var box = document.getElementById('sgCarried'); if (!box) return;
      var st = (rows || []).filter(function (r) { return !r.removed_at && r.listings && r.listings.status === 'approved'; }).map(function (r) { return r.listings; })
        .sort(function (x, y) { return x.name.localeCompare(y.name); });
      box.innerHTML = st.length ? '<div class="sg-carried">' + st.map(function (l) {
        return '<a class="sg-ptile" style="height:auto" href="/directory/' + esc(l.slug) + '"><span class="sg-thumb">' + (l.logo_url ? '<img src="' + esc(l.logo_url) + '" alt="" loading="lazy">' : '<i class="sg-letter">' + esc(l.name.charAt(0)) + '</i>') + '</span><span class="sg-pb"><b>' + esc(l.name) + '</b><em>Its Vegan aisle</em></span></a>';
      }).join('') + '</div><p class="sg-small">The supermarkets our Guides place this line at. Stock changes by store.</p>' : '<p class="sg-small">No supermarket is mapped for it yet. Seen it somewhere? Tell us on that store\'s page.</p>';
    });
  }
  function drawScanOther(code, d) {
    var o = d.off, b = d.brand;
    var vegan = o ? { yes: ['Open Food Facts lists it as Vegan.', 'sa-tag-fresh'], no: ['Open Food Facts lists something non-Vegan in it.', 'sa-tag-stale'], maybe: ['Open Food Facts is not sure it is Vegan.', 'sa-tag-ask'], unknown: ['Not checked for Vegan yet.', 'sa-tag-ask'] }[o.vegan] : null;
    var html = scanHead(code, o && o.image, o ? o.name : '', '<p class="dg-lede" style="margin:0">' + (o && o.brand ? esc(o.brand) : 'We do not know this one yet') +
      (vegan ? ' &middot; <span class="dg-tag ' + vegan[1] + '">' + esc(vegan[0]) + '</span>' : '') + '</p>');
    if (o && o.macros && window.VEMacros) html += VEMacros.strip(o.macros, { title: 'Macros ' + (o.serving === 'per 100 g' ? 'per 100 g' : 'per serving') });
    if (b) html += '<p class="sg-small" style="margin-top:12px">' + esc(b.name) + ' is in our Directory. <a href="/directory/' + esc(b.slug) + '?tab=products">See its products</a>.</p>';
    html += '<div class="sg-addit"><h3 class="sg-ph" style="margin-top:0">Not in the Guide yet</h3><p class="sg-small" style="margin:0 0 10px">' +
      (o ? 'Add it and the team checks it is Vegan and puts it in the Guide for everyone.' : 'Nobody has listed this barcode yet. Add it and tell us what it is; the team checks it before it goes in.') + '</p>' +
      (token() ? '<label class="sa-city" style="display:block;margin-bottom:10px"><span>What is it? (optional)</span><input id="sgAddNote" maxlength="400" placeholder="' + (o ? 'Anything we should know' : 'The brand and product name') + '" style="width:100%"></label>' +
        '<button type="button" class="dg-btn" id="sgAddIt">Add it</button>' : '<button type="button" class="dg-btn" data-signin>Sign in to add it</button>') + '<p class="sa-msg" id="sgAddMsg" aria-live="polite"></p></div>';
    if (o) html += '<p class="sg-small">Product details from <a href="https://world.openfoodfacts.org/product/' + esc(code.replace(/^0+(?=\d{12})/, '')) + '" target="_blank" rel="noopener">Open Food Facts</a> (CC BY-SA), as its contributors entered them. Check the package.</p>';
    html += '<p>' + scanBtn('Scan another') + '</p>';
    main.innerHTML = html; bindScan();
    var add = document.getElementById('sgAddIt');
    if (add) add.addEventListener('click', function () {
      add.disabled = true; add.textContent = 'Sending...';
      papi({ action: 'add', code: code, note: (document.getElementById('sgAddNote') || {}).value || '' }).then(function (x) {
        var m = document.getElementById('sgAddMsg');
        if (x && x.ok) { add.textContent = 'Sent'; m.textContent = x.already === 'live' ? 'It is already in the Guide.' : 'Thank you. The team checks it and adds it to the Guide.'; delete SCANS[code]; }
        else { add.disabled = false; add.textContent = 'Add it'; m.textContent = (x && x.message) || 'That did not send. Try again.'; }
      }).catch(function () { add.disabled = false; add.textContent = 'Add it'; });
    });
  }

  function viewProduce() {
    main.innerHTML = head('Produce', 'Start with the produce section', 'A Vegan basket is mostly whole food. Here is what is worth buying and why. General advice; the store has the final word on what is in season and on sale.') +
      '<div class="sg-tips">' + PRODUCE.map(function (p) { return '<div class="sg-tip"><span class="sg-tip-i">' + ICON.leaf + '</span><div><b>' + esc(p[0]) + '</b><p>' + esc(p[1]) + '</p></div></div>'; }).join('') + '</div>' +
      '<div class="dg-btns" style="margin-top:16px"><a class="dg-btn" href="#/stores">Find your store</a></div>';
  }

  // ---------- overview ----------
  function viewOverview() {
    var free = (STORES || []).filter(function (v) { return v.free; })[0];
    var n = (STORES || []).length, chs = chapters().length;
    main.innerHTML = head('The Supermarket Guide', 'Every Vegan item in your store, aisle by aisle', 'Pick your supermarket, then what you need: dairy-free, plant-based meat, ready meals, pantry, snacks or produce. Every product is together, narrowed by type, what it is made from, the brand and where it sits, with the aisle our members mapped in that store. ' + (ME.free ? 'Free right now, thanks to our sponsors.' : 'Free while a supermarket sponsors it.'),
      '<a class="dg-btn" href="#/stores">Find your store</a>') +
      '<div class="sg-ovgrid">' +
        '<a class="sg-ov" href="#/stores"><span class="sg-tip-i">' + ICON.store + '</span><b>' + (n ? n + ' stores' : 'Your stores') + (chs ? ' in ' + chs + (chs === 1 ? ' chapter' : ' chapters') : '') + '</b><p>Find yours by city or by where you are. More supermarkets join as they come on board.</p></a>' +
        '<a class="sg-ov" href="#/list"><span class="sg-tip-i">' + ICON.list + '</span><b>Your shopping list</b><p>Add what you need from your store; it waits for you by aisle, with boxes to tick.</p></a>' +
        '<a class="sg-ov" href="#/produce"><span class="sg-tip-i">' + ICON.leaf + '</span><b>The produce section</b><p>What to buy and why, where a Vegan basket starts.</p></a>' +
        '<a class="sg-ov" href="#/report"><span class="sg-tip-i">' + ICON.camera + '</span><b>Mapped by members</b><p>Tell us the aisle with a photo from the store and earn points. At a sponsoring supermarket, the first to confirm a section earns the bounty.</p></a>' +
      '</div>' +
      '<div class="sa-stand" style="margin-top:16px"><div class="sa-stand-h"><div><h3>Coming with our sponsors</h3></div>' + tagHtml('Coming', 'sa-tag-new') + '</div>' +
        '<p class="dg-lede" style="margin:0">Weekly Vegan specials from the supermarkets that sponsor the Guide, Vegan products spotlighted with the aisle to find them in, and snack breakdowns.</p></div>' +
      (free && !owner() ? '<div class="dg-btns" style="margin-top:16px"><a class="dg-btn dg-ghost" href="#/store/' + esc(free.slug) + '">Try it: ' + esc(free.name) + '</a></div>' : '');
  }

  function viewJoin() {
    if (owner()) { main.innerHTML = head('Your Guide', ME.free ? 'The whole Guide is free right now' : 'The whole Guide is yours', ME.free ? 'Thanks to the supermarkets that sponsor it.' : 'Thank you for being here.') + '<a class="dg-btn" href="#/stores">Find your store</a>'; return; }
    var m = mode();
    var list = '<div class="dg-access"><ul>' +
      '<li><b>Every store:</b> the supermarkets in our chapters, each with its Vegan sections and the aisle members found them in.</li>' +
      '<li><b>Your shopping list:</b> add what you need and tick it off in the aisle.</li><li><b>The produce section:</b> what to buy and why.</li>' +
      '<li><b>Bounties:</b> earn points for mapping aisles, and be first at a sponsoring supermarket for the bounty.</li>' +
      '<li><b>The community:</b> your member dashboard, Directory votes, the Daily Pulse and points.</li></ul></div>';
    var status = '<span class="dg-status" role="status" style="display:block;margin-top:10px;color:#8a5a00"></span>';
    var box = m === 'soon' ? '<div class="dg-big">Soon</div><p>The full Guide opens soon. Publix at Brickell Village is open to everyone now.</p><a class="dg-btn" href="#/store/' + FREE + '">Open Brickell Village</a>'
      : m === 'points' ? '<div class="dg-big">' + pts(ST.cost) + '<small>points</small></div><p>You have ' + pts(ST.balance) + ' points. Unlock the Guide with ' + pts(ST.cost) + ' of them and it is yours to keep.</p>' +
        '<button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button><button type="button" class="dg-btn dg-ghost" data-buy style="margin-top:8px">Or get it for $11</button>' + status
      : '<div class="dg-big">$11<small>yours to keep</small></div><p>' + (m === 'join' ? 'Create your account and get the Guide for $11, one time. Buying it makes you a member of Vegans Explore. Already a member? <a href="#" data-signin>Sign in</a>.'
        : 'Get the Guide for $11, one time, and it is yours to keep.') + '</p><button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button>' + status +
        '<p class="dg-pp">It is free whenever a supermarket sponsors it. Or get your <a href="/passport">Passport</a>: $11, one time, with 1,100 welcome points, enough for this Guide.</p>';
    main.innerHTML = head('Get access', 'Open every store', 'The Supermarket Guide is free while a supermarket sponsors it. Otherwise it is $11, or 1,100 points, like every Vegans Explore Guide.') + list;
    main.querySelector('.dg-access').insertAdjacentHTML('beforeend', '<div class="dg-pricebox">' + box + '</div>');
  }

  // ---------- Pascal, on the right of every tab ----------
  var guideBox = document.getElementById('dgMaya'), bubble = document.getElementById('dgBubble'), tourEl = document.getElementById('dgTour'), tourM = document.getElementById('dgTourM');
  var foldBtn = document.getElementById('dgFold'), railEl = document.getElementById('dgRail');
  function setFold(folded) {
    railEl.classList.toggle('dg-folded', folded);
    foldBtn.textContent = folded ? 'Show Pascal' : 'Hide Pascal'; foldBtn.setAttribute('aria-expanded', String(!folded));
    try { sessionStorage.setItem('sg_pascal_folded', folded ? '1' : ''); } catch (e) {}
  }
  foldBtn.addEventListener('click', function () { setFold(!railEl.classList.contains('dg-folded')); });
  try { if (sessionStorage.getItem('sg_pascal_folded')) setFold(true); } catch (e) {}
  function drawGuide() {
    var t = tab(curTab), list = tabs(), i = 0;
    list.forEach(function (x, n) { if (x.k === curTab) i = n; });
    bubble.textContent = owner() && t.sayMember ? t.sayMember : t.say;
    tourEl.innerHTML = tourM.innerHTML = '<a class="dg-tnav" href="' + href(list[Math.max(0, i - 1)].k) + '"' + (i ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Back</a><span>' + (i + 1) + ' of ' + list.length + '</span>' +
      '<a class="dg-tnav next" href="' + href(list[Math.min(list.length - 1, i + 1)].k) + '"' + (i < list.length - 1 ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Next</a>';
  }

  // ---------- router ----------
  function curView() { return (location.hash || '').replace(/^#\/?/, ''); }
  function route() {
    // #/c/<category>?<filters> (a brand's Guide tab links here): your last store, else Brickell Village, on that category.
    var cv = curView();
    if (/^c\//.test(cv)) { var last = ''; try { last = localStorage.getItem('sg_store') || ''; } catch (e) {} location.replace('#/store/' + (last || FREE) + '/' + cv); return; }
    var parts = cv.split('?')[0].split('/');
    var view = parts[0] || 'overview', sub = cv.split('/').slice(1).join('/');
    var known = { overview: 1, stores: 1, store: 1, scan: 1, list: 1, produce: 1, report: 1, join: 1 };
    if (!known[view]) view = 'overview';
    if (view === 'list' && !(owner() && token())) view = 'overview';
    document.body.classList.toggle('dg-member', owner());
    drawJoinbox();
    if ((view === 'stores' || view === 'store') && !railEl.classList.contains('dg-folded')) {
      var auto = ''; try { auto = sessionStorage.getItem('sg_pascal_auto') || ''; } catch (e) {}
      if (!auto) { try { sessionStorage.setItem('sg_pascal_auto', '1'); } catch (e) {} setFold(true); }
    }
    var key = view === 'store' ? 'stores' : view === 'join' && owner() ? 'overview' : view;
    drawMenu(key);
    if (view === 'store') { var s = sub.split('/'); viewStore(s[0], s.slice(1).join('/')); }
    else if (view === 'scan') viewScan(sub.split('?')[0]);
    else ({ overview: viewOverview, stores: viewStores, list: viewList, produce: viewProduce, report: viewReportTab, join: viewJoin })[view]();
    curTab = key;
    drawGuide();
    main.scrollTop = 0; if (!document.documentElement.classList.contains('dg-fit') || window.innerWidth <= 900) window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  document.addEventListener('click', function (e) {
    var a = auth();
    if (e.target.closest('[data-signin]')) {
      e.preventDefault();
      if (a) a.showAuthModal('Sign in to open the Supermarket Guide and send reports.', function () { location.reload(); }, 'login');
      return;
    }
    var sv = e.target.closest('[data-save]');
    if (sv) {
      e.preventDefault();
      var on = sv.getAttribute('aria-pressed') !== 'true', isStore = sv.getAttribute('data-save') === 'venue';
      sv.disabled = true;
      api({ action: 'save', kind: sv.getAttribute('data-save'), key: sv.getAttribute('data-key'), on: on }).then(function (d) {
        sv.disabled = false;
        if (!d || !d.ok) return;
        sv.classList.toggle('on', d.saved); sv.setAttribute('aria-pressed', String(d.saved));
        sv.querySelector('span').textContent = isStore ? (d.saved ? 'Saved' : 'Save store') : (d.saved ? 'On my list' : 'Add to list');
      }).catch(function () { sv.disabled = false; });
      return;
    }
    var by = e.target.closest('[data-buy]');
    if (by) { e.preventDefault(); if (token()) buyNow(by); return; }
    var jb = e.target.closest('[data-join]');
    if (jb && !jb.disabled && a) {
      var m = mode();
      if (m === 'soon' || m === 'free') return;
      if (m === 'join') {
        var go = function () { delete window.VE_ACTIVATE_HANDLER; buyNow(jb); };
        window.VE_ACTIVATE_HANDLER = go;
        a.showAuthModal('Create your account, then get the Supermarket Guide for $11. Buying it makes you a member.', go, 'signup');
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
      STORES = (d && d.venues) || [];
      ((d && d.points) || []).forEach(function (p) { POINTS[p.kind] = p; });
      if (d && d.limits) LIMITS = d.limits;
      route();
    }).catch(function () { STORES = []; route(); });
    unlockApi('status').then(function (d) {
      if (d && d.error === 'guide_not_found') ST.published = false;
      else if (d) { ST.cost = d.cost || ST.cost; ST.balance = d.balance || 0; ST.active = d.membership_status === 'active'; }
      route();
    }).catch(function () {});
  }
  function init() {
    document.documentElement.classList.add('dg-fit');
    if (window.VEGuideArt) { var art = VEGuideArt('pascal', 'square'); if (art) guideBox.style.backgroundImage = "url('" + art + "')"; }
    var css = document.createElement('style');
    css.textContent = '.sg-depts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start}.sg-depts .sa-stand{margin:0}@media(max-width:1100px){.sg-depts{grid-template-columns:1fr}}' +
      '.sg-ilink{flex:0 0 auto;display:block}.sg-iname{color:inherit;text-decoration:none}.sg-iname:hover b{text-decoration:underline}.sg-see{display:inline-block;font-size:12px;font-weight:800;color:var(--vb-go-hover,#1f5f22);text-decoration:none;margin-top:2px}.sg-see:hover{text-decoration:underline}' +
      '.sg-sechead{display:flex;gap:18px;align-items:flex-start;margin:4px 0 18px}.sg-thumb-lg{width:132px!important;height:132px!important;border-radius:14px!important}@media(max-width:560px){.sg-sechead{flex-direction:column}}' +
      '.sg-ph{font-size:15px;font-weight:900;margin:18px 0 6px}.sg-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr));gap:10px}' +
      '.sg-scanhead{display:flex;gap:16px;align-items:center;margin:6px 0 4px}.sg-scanhead .sg-thumb-lg img{object-fit:contain;background:#fff}.sg-scanacts{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0 6px}' +
      '.sg-carried{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(220px,100%),1fr));gap:10px}.sg-small{font-size:12.5px;line-height:1.55;color:var(--ink75);margin:8px 0}.sg-small a{color:var(--vb-accent-ink,#1f5f22);font-weight:700}' +
      '.sg-addit{border:1px solid var(--line);border-radius:8px;padding:16px;margin:20px 0 8px;background:#fafbfa}.sg-addit input{padding:10px 12px;border:1.5px solid var(--line);border-radius:6px;font:inherit;font-size:15px;box-sizing:border-box}' +
      '.sg-ptile{display:flex;gap:12px;align-items:center;padding:10px;height:94px;box-sizing:border-box;overflow:hidden;border:1px solid var(--line);border-radius:12px;background:#fff;color:inherit;text-decoration:none}.sg-ptile:hover{border-color:var(--vb-go-hover,#1f5f22)}' +
      '.sg-ptile .sg-thumb{width:56px;height:56px;background:#fff;border:1px solid var(--line)}.sg-ptile .sg-thumb img{object-fit:contain}.sg-pb{min-width:0;display:flex;flex-direction:column;gap:2px}.sg-pb b{font-size:13.5px;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.sg-pb em{font-style:normal;font-size:12px;color:var(--ink75);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sg-pb .dg-tag{align-self:flex-start}.sg-pmeta{display:flex;align-items:center;gap:6px;min-width:0;white-space:nowrap;overflow:hidden}.sg-mac{font-size:11.5px;font-weight:800;color:var(--vb-accent-ink,#1f5f22)}.sg-pmeta .dg-tag{flex:0 1 auto;overflow:hidden;text-overflow:ellipsis}' +
      '.sg-pbox{max-height:304px;overflow-y:auto;overscroll-behavior:contain;padding:1px 6px 1px 1px;align-content:start}.sg-ph2 i{font-style:normal;font-weight:700;font-size:12px;color:var(--ink75);margin-left:4px}' +
      '.sg-pfilter{display:flex;flex-direction:column;gap:10px;margin:4px 0 6px}.sg-psearch input{width:100%;box-sizing:border-box;height:42px;padding:0 14px;border:1px solid var(--line);border-radius:6px;font:inherit;font-size:14px;background:#fff}' +
      '.sg-chips{display:flex;flex-wrap:wrap;gap:8px}.sg-chip{font:inherit;font-size:13px;font-weight:700;padding:7px 12px;border:1px solid var(--line);border-radius:6px;background:#fff;color:inherit;cursor:pointer}.sg-chip i{font-style:normal;font-weight:600;color:var(--ink75);margin-left:2px}' +
      '.sg-chip.on{background:var(--vb-go,#2D5C27);border-color:var(--vb-go,#2D5C27);color:#fff}.sg-chip.on i{color:#e8f5e9}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}' +
      '.sg-cats{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr));gap:12px;margin:6px 0 14px}' +
      '.sg-cat{display:flex;gap:14px;align-items:center;padding:14px;border:1px solid var(--line);border-radius:12px;background:#fff;color:inherit;text-decoration:none}.sg-cat:hover{border-color:var(--vb-go-hover,#1f5f22)}' +
      '.sg-cat .sg-thumb{width:84px;height:84px;border-radius:12px}.sg-catb{display:flex;flex-direction:column;gap:3px;min-width:0}.sg-catb b{font-size:16px;font-weight:900}.sg-catb span{font-size:13px;color:var(--ink75);line-height:1.35}.sg-catb em{font-style:normal;font-size:12px;font-weight:700;color:var(--vb-go-hover,#1f5f22)}' +
      '.sg-thumb-x{display:flex!important;align-items:center;justify-content:center}.sg-thumb-i{color:var(--vb-go-hover,#1f5f22);display:flex}' +
      '.sg-switch{display:inline-flex;border:1px solid var(--line);border-radius:6px;overflow:hidden;margin:4px 0 14px}.sg-switch a{padding:9px 16px;font-size:13px;font-weight:800;color:inherit;text-decoration:none;background:#fff}.sg-switch a.on{background:var(--vb-go,#2D5C27);color:#fff}' +
      '.sg-cattabs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 14px}.sg-cattab{padding:8px 12px;border:1px solid var(--line);border-radius:6px;font-size:13px;font-weight:800;color:inherit;text-decoration:none;background:#fff}.sg-cattab.on{background:var(--vb-go,#2D5C27);border-color:var(--vb-go,#2D5C27);color:#fff}' +
      '.sg-catsel{display:none!important;margin:0 0 14px!important}.sg-catsel select{width:100%}@media(max-width:768px){.sg-cattabs{display:none}.sg-catsel{display:flex!important}}' +
      '.sg-aisles{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(380px,100%),1fr));gap:8px 12px}.sg-aisles .sg-aisle{border:1px solid var(--line);border-radius:12px;padding:10px;margin:0}.sg-zline{font-size:12px!important;font-weight:800;color:var(--vb-go-hover,#1f5f22)!important;margin:1px 0 2px!important}' +
      '.sg-aminis{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(380px,100%),1fr));gap:8px 12px}.sg-amini{display:flex;align-items:center;gap:10px;padding:9px 12px;border:1px solid var(--line);border-radius:10px;background:#fff}.sg-amini-b{flex:1;min-width:0;display:flex;flex-direction:column}.sg-amini-b b{font-size:14px}.sg-amini-b span{font-size:12px;color:var(--ink75)}.sg-amini .dg-tag{flex:0 0 auto}' +
      '@media(max-width:560px){.sg-sechead{flex-direction:row!important;gap:12px}.sg-sechead .sg-thumb-lg{width:72px!important;height:72px!important}.sg-sechead .dg-h1{font-size:24px}}' +
      '.sg-fsel{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(220px,100%),1fr));gap:10px}.sg-fsel .sa-city{margin:0;display:flex;flex-direction:column;align-items:stretch;gap:6px;min-width:0}.sg-fsel select{width:100%;min-width:0}' +
      '.sg-subchips .sg-chip{font-size:12px;padding:5px 10px}.sg-reset{align-self:flex-start;font:inherit;font-size:12.5px;font-weight:800;color:var(--vb-go-hover,#1f5f22);background:none;border:0;padding:0;cursor:pointer;text-decoration:underline}' +
      '.sg-letter{display:flex;width:100%;height:100%;align-items:center;justify-content:center;font-style:normal;font-weight:900;font-size:20px;color:var(--vb-go-hover,#1f5f22);background:#e8f5e9}' +
      '.sg-dh{display:flex;align-items:center;gap:12px}.sg-dicon{flex:0 0 auto;width:44px;height:44px;border-radius:10px;background:#e8f5e9;color:var(--vb-go-hover,#1f5f22);display:flex;align-items:center;justify-content:center}' +
      '.sg-thumb{flex:0 0 auto;width:64px;height:64px;border-radius:10px;overflow:hidden;background:#f1f4f1;display:block}.sg-thumb img{width:100%;height:100%;object-fit:cover;display:block}.sg-thumb-x{background:#eef3ee}' +
      '@media(max-width:480px){.sg-thumb{width:56px;height:56px}}' +
      '.sg-tools{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) auto;gap:10px;align-items:end;margin:0 0 10px}' +
      '.sg-tools .sa-city{margin:0;display:flex;flex-direction:column;align-items:stretch;gap:6px;min-width:0}.sg-tools .sa-city select{min-width:0;width:100%}.sg-q input{width:100%;height:42px;border:1px solid rgba(0,0,0,.18);border-radius:6px;padding:0 12px;font:500 14px Montserrat,sans-serif}' +
      '.sg-count{font-size:13px;color:rgba(26,26,26,.66);margin:6px 0 10px}' +
      '.sg-stores{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(340px,100%),1fr));gap:10px}' +
      '.sg-store{display:flex;gap:12px;align-items:flex-start;border:1px solid rgba(0,0,0,.1);border-radius:10px;padding:12px;text-decoration:none;color:inherit;background:#fff;position:relative}' +
      '.sg-store:hover{border-color:var(--g,#1f5f22)}.sg-store b{display:block;font-size:14.5px;line-height:1.25;margin-bottom:3px}' +
      '.sg-logo{flex:0 0 44px;width:44px;height:44px;border-radius:8px;overflow:hidden;background:#f2f5f2;display:flex;align-items:center;justify-content:center;color:var(--g,#1f5f22)}.sg-logo img{width:100%;height:100%;object-fit:cover}' +
      '.sg-sbody{min-width:0;flex:1}.sg-sbody .sa-vmeta{display:flex;gap:4px;align-items:flex-start;font-size:12.5px}.sg-dist{font-size:12px;font-weight:800;color:var(--g,#1f5f22);white-space:nowrap}' +
      '.sg-ovgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.sg-ov{border:1px solid rgba(0,0,0,.1);border-radius:10px;padding:16px;text-decoration:none;color:inherit;background:#fff}' +
      '.sg-ov:hover{border-color:var(--g,#1f5f22)}.sg-ov b{display:block;font-size:15px;margin:8px 0 4px}.sg-ov p{margin:0;font-size:13px;color:rgba(26,26,26,.72);line-height:1.5}' +
      '.sg-tip-i{display:inline-flex;width:40px;height:40px;border-radius:8px;background:#e8f5e9;color:var(--g,#1f5f22);align-items:center;justify-content:center}' +
      '.sg-tips{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.sg-tip{display:flex;gap:12px;border:1px solid rgba(0,0,0,.1);border-radius:10px;padding:14px;background:#fff}' +
      '.sg-tip b{display:block;font-size:14.5px;margin-bottom:4px}.sg-tip p{margin:0;font-size:13px;line-height:1.55;color:rgba(26,26,26,.75)}' +
      '.sg-tick{display:flex;gap:10px;align-items:flex-start;padding:10px 4px;border-top:1px solid rgba(0,0,0,.07);cursor:pointer}.sg-tick input{width:20px;height:20px;margin-top:2px;accent-color:#1f5f22}' +
      '.sg-tick b{display:block;font-size:14px}.sg-tick i{font-style:normal;font-size:12.5px;color:rgba(26,26,26,.6)}.sg-tick input:checked+span b{text-decoration:line-through;opacity:.55}' +
      '@media(max-width:900px){.sg-tools{grid-template-columns:1fr}.sg-tools .dg-btn{grid-column:1/-1}.sg-ovgrid,.sg-tips{grid-template-columns:1fr}}';
    document.head.appendChild(css);
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
