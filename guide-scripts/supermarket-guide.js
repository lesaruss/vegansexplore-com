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
    { k: 'stores', label: 'Stores', say: 'Find your store by city or by where you are. Each one lists its Vegan sections and the aisle members found them in. Brickell Village in Miami is open to everyone.',
      sayMember: 'Find your store, then tap Save on what you need. If an aisle is not mapped yet, you can be the first to tell us.' },
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
  // Department icons and section photos (Sean, 2026-11-01: "icons... square rounded corners... thumbnails with photos of those items").
  // Every store has the same template (ve_supermarket_seed_store), so pictures key off the name; a member's accepted photo wins.
  var DEPT_ICON = {
    'Refrigerated': '<path d="M6 3h12v18H6z"/><path d="M6 10h12M9 6v2M9 13v3"/>',
    'Frozen': '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="M9.5 4.5 12 6l2.5-1.5M9.5 19.5 12 18l2.5 1.5"/>',
    'Pantry': '<path d="M7 7h10v14H7z"/><path d="M8 3h8v4H8zM7 12h10"/>',
    'Snacks': '<path d="M6 3h12l-1 4 1 14H6l1-14z"/><path d="M9 11c1 1.5 5 1.5 6 0"/>'
  };
  function deptIcon(name) {
    var d = DEPT_ICON[name] || '<circle cx="12" cy="12" r="8"/>';
    return '<span class="sg-dicon" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg></span>';
  }
  var SEC_IMG = { 'Plant-based milk': 'milk', 'Plant-based yogurt': 'yogurt', 'Vegan cheese': 'cheese', 'Vegan butter and spreads': 'butter',
    'Tofu and tempeh': 'tofu', 'Fresh plant-based meat': 'meat', 'Hummus and dips': 'dips', 'Frozen plant-based meat': 'frozen-meat',
    'Frozen Vegan meals': 'frozen-meals', 'Non-dairy ice cream': 'ice-cream', 'Beans and lentils': 'beans',
    'Plant-based protein powder': 'protein', 'Nut butters': 'nut-butter', 'Vegan snacks and chips': 'snacks', 'Vegan cookies and treats': 'cookies' };
  function secThumb(it) {
    var k = SEC_IMG[it.name], src = it.photo_url || (k ? '/public/guides/supermarket/' + k + '.jpg' : '');
    if (!src) return '<span class="sg-thumb sg-thumb-x" aria-hidden="true"></span>';
    return '<span class="sg-thumb"><img src="' + esc(src) + '" alt="" width="64" height="64" loading="lazy" decoding="async"></span>';
  }
  function itemRow(v, it) {
    return '<div class="sa-item">' + secThumb(it) + '<div class="sa-item-b"><b>' + esc(it.name) + '</b>' + (it.description ? '<p>' + esc(it.description) + '</p>' : '') +
      '<div class="sa-vtags" style="margin:0 0 6px">' + freshTag(it) + '</div></div>' +
      '<div class="sa-acts">' + saveBtn('venue_item', it.id, it.saved) + '<a class="sa-mini" href="#/store/' + esc(v.slug) + '/report/choose/' + it.id + '">Update</a></div>' + commentsHtml(it) + '</div>';
  }
  function commentsHtml(it) {
    var cs = it.comments || [];
    if (!cs.length) return '';
    return '<div class="sa-cmts">' + cs.map(function (c) {
      return '<div class="sa-cmt">' + (c.photo ? '<a href="' + esc(c.photo) + '" target="_blank" rel="noopener"><img alt="A member\'s photo" src="' + esc(c.photo) + '" loading="lazy"></a>' : '') +
        '<p>&ldquo;' + esc(c.note || '') + '&rdquo;<span>' + esc(c.member || 'A member') + ' &middot; ' + esc(fmtDate(c.at)) + '</span></p></div>';
    }).join('') + '</div>';
  }
  function deptCard(v, s, open) {
    var body = open ? (s.items.length ? s.items.map(function (it) { return itemRow(v, it); }).join('') : '<p class="dg-empty">Nothing listed here yet.</p>')
      : Array.apply(null, Array(s.item_count || 1)).map(function () { return '<div class="sa-item"><div class="sa-item-b"><div class="dg-skel" style="border:0;padding:0"><i></i><i style="width:70%"></i></div></div></div>'; }).join('');
    return '<div class="sa-stand" id="sa-st-' + esc(s.id) + '"><div class="sa-stand-h"><div class="sg-dh">' + deptIcon(s.name) + '<div><h3>' + esc(s.name) + '</h3>' + (s.note ? '<p class="sa-snote">' + esc(s.note) + '</p>' : '') + '</div></div></div>' + body + '</div>';
  }
  function viewStore(slug, rest) {
    var r = (rest || '').split('/');
    if (r[0] === 'report') return viewReport(slug, r[1], r[2]);
    var d = VENUE[slug];
    if (!d) {
      main.innerHTML = crumb([['Stores', '#/stores'], ['...', '']]) + '<div class="dg-loading">Loading the store...</div>';
      api({ action: 'venue', slug: slug }).then(function (x) { VENUE[slug] = x; if (curView().indexOf('store/' + slug) === 0) route(); }).catch(function () { main.innerHTML = '<p class="dg-empty">That did not load. Refresh to try again.</p>'; });
      return;
    }
    if (d.error) { main.innerHTML = crumb([['Stores', '#/stores']]) + '<p class="dg-empty">We could not find that store.</p>'; return; }
    var v = d.venue;
    var lede = ICON.pin + ' ' + esc(v.address || v.city || '');
    var meta = '<div class="sa-vhead">' + (v.maps ? '<a href="' + esc(v.maps) + '" target="_blank" rel="noopener">Directions</a>' : '') +
      (v.chain ? '<a href="/directory/' + esc(v.chain.slug) + '">' + esc(v.chain.name) + ' on Vegans Explore</a>' : '') + '</div>';
    var acts = '<div class="dg-btns">' + saveBtn('venue', v.slug, d.saved).replace('Add to list', 'Save store').replace('On my list', 'Saved') +
      '<a class="dg-btn dg-ghost" href="#/store/' + esc(v.slug) + '/report/missing">Add something missing</a></div>';
    var depts = d.spots.map(function (s) { return deptCard(v, s, d.open); }).join('');
    var note = '<p class="dg-lede" style="font-size:13px;margin-top:4px">Stores move things around, so an aisle can change. Every section says when a member last checked it. Something not where it says? Tap Update and tell us.</p>';
    main.innerHTML = crumb([['Stores', '#/stores'], [v.name, '']]) + head(v.free && !owner() ? 'Free to everyone' : (v.chain ? v.chain.name : 'Supermarket'), esc(v.name), lede, acts) + meta +
      (d.open ? depts + note : gated(depts, v.name + ' is in the full Guide', 'Every Vegan section in this store and the aisle members found it in.'));
  }

  // ---------- Help keep it right ----------
  function ptsLine(kind, it) {
    var p = POINTS[kind]; if (!p) return '';
    if (kind === 'confirm' && it && it.bounty && p.first_with_photo) return 'Bounty, be first: ' + pts(p.first_with_photo) + ' points with a photo, ' + pts(p.first_no_photo) + ' without';
    return pts(p.with_photo) + ' points with a photo, ' + pts(p.no_photo) + ' without';
  }
  function viewReportTab() {
    var signedIn = !!token();
    var P = function (k, f, d) { return POINTS[k] ? POINTS[k][f] : d; };
    var rows = [
      ['Tell us the aisle', 'Where a section is in your store, the first accepted report', P('wrong', 'with_photo', 100), P('wrong', 'no_photo', 50)],
      ['Something missing', 'A Vegan product or section not in the Guide for this store yet', P('missing', 'with_photo', 100), P('missing', 'no_photo', 50)],
      ['Agrees with the first', 'An aisle the team already accepted from someone else', P('wrong', 'agree_with_photo', 25), P('wrong', 'agree_no_photo', 15)],
      ['Still here, first to confirm', 'The bounty: the first member to confirm a section no one has checked in ' + (LIMITS.fresh_days || 35) + ' days', P('confirm', 'first_with_photo', 50), P('confirm', 'first_no_photo', 25)],
      ['Still here', 'After someone has confirmed it', P('confirm', 'with_photo', 10), P('confirm', 'no_photo', 5)],
      ['Comment', 'A tip for other shoppers', P('comment', 'with_photo', 10), P('comment', 'no_photo', 5)]
    ];
    main.innerHTML = head('Help keep it right', 'Members map the aisles', 'Stores move things around. When you are shopping, tell us which aisle a Vegan section is in, what is still there, and what is missing. A photo earns more, and every report is checked by the team before it pays.') +
      '<div class="sa-ptable" role="table" aria-label="Points for each kind of report"><div class="sa-ptr sa-pth" role="row"><span role="columnheader">What you send</span><span role="columnheader">With a photo</span><span role="columnheader">Without</span></div>' +
      rows.map(function (r) { return '<div class="sa-ptr" role="row"><span role="cell"><b>' + esc(r[0]) + '</b><i>' + esc(r[1]) + '</i></span><span role="cell"><b>' + pts(r[2]) + '</b> points</span><span role="cell"><b>' + pts(r[3]) + '</b> points</span></div>'; }).join('') + '</div>' +
      '<ol class="sa-steps"><li>Open your store while you are there and tap <b>Update</b> on a section, or <b>Add something missing</b>.</li>' +
      '<li>Add a photo of the shelf or the aisle sign if you can. Your phone shares your location once, to show you are in the store.</li>' +
      '<li>The team checks every one. Points land when it is accepted, up to ' + (LIMITS.daily_paid_cap || 40) + ' paid a day. Look for <b>Bounty</b>: the first to map a section earns the most.</li></ol>' +
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
          (ptsLine(k, item.it) ? '<i>' + esc(ptsLine(k, item.it)) + '</i>' : '') + '</a>';
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
    var earn = ptsLine(kind, item && item.it);
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
  function viewProduce() {
    main.innerHTML = head('Produce', 'Start with the produce section', 'A Vegan basket is mostly whole food. Here is what is worth buying and why. General advice; the store has the final word on what is in season and on sale.') +
      '<div class="sg-tips">' + PRODUCE.map(function (p) { return '<div class="sg-tip"><span class="sg-tip-i">' + ICON.leaf + '</span><div><b>' + esc(p[0]) + '</b><p>' + esc(p[1]) + '</p></div></div>'; }).join('') + '</div>' +
      '<div class="dg-btns" style="margin-top:16px"><a class="dg-btn" href="#/stores">Find your store</a></div>';
  }

  // ---------- overview ----------
  function viewOverview() {
    var free = (STORES || []).filter(function (v) { return v.free; })[0];
    var n = (STORES || []).length, chs = chapters().length;
    main.innerHTML = head('The Supermarket Guide', 'Every Vegan item in your store, aisle by aisle', 'Pick your supermarket and see where the plant-based milk, the Vegan cheese, the tofu and the rest are, the way our members mapped it in that store. ' + (ME.free ? 'Free right now, thanks to our sponsors.' : 'Free while a supermarket sponsors it.'),
      '<a class="dg-btn" href="#/stores">Find your store</a>') +
      '<div class="sg-ovgrid">' +
        '<a class="sg-ov" href="#/stores"><span class="sg-tip-i">' + ICON.store + '</span><b>' + (n ? n + ' stores' : 'Your stores') + (chs ? ' in ' + chs + (chs === 1 ? ' chapter' : ' chapters') : '') + '</b><p>Find yours by city or by where you are. More supermarkets join as they come on board.</p></a>' +
        '<a class="sg-ov" href="#/list"><span class="sg-tip-i">' + ICON.list + '</span><b>Your shopping list</b><p>Add what you need from your store; it waits for you by aisle, with boxes to tick.</p></a>' +
        '<a class="sg-ov" href="#/produce"><span class="sg-tip-i">' + ICON.leaf + '</span><b>The produce section</b><p>What to buy and why, where a Vegan basket starts.</p></a>' +
        '<a class="sg-ov" href="#/report"><span class="sg-tip-i">' + ICON.camera + '</span><b>Mapped by members</b><p>Tell us the aisle with a photo from the store and earn points. The first to map a section earns the bounty.</p></a>' +
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
      '<li><b>Bounties:</b> earn points for mapping aisles, and be first to map a section for the bounty.</li>' +
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
    var parts = curView().split('/');
    var view = parts[0] || 'overview', sub = parts.slice(1).join('/');
    var known = { overview: 1, stores: 1, store: 1, list: 1, produce: 1, report: 1, join: 1 };
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
    css.textContent = '.sg-dh{display:flex;align-items:center;gap:12px}.sg-dicon{flex:0 0 auto;width:44px;height:44px;border-radius:10px;background:#e8f5e9;color:var(--vb-go-hover,#1f5f22);display:flex;align-items:center;justify-content:center}' +
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
