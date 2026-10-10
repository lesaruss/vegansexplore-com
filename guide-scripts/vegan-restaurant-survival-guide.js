/* The Vegan Restaurant Survival Guide (rebuilt 2026-10-10 on the Dairy Guide playbook, docs/guides/BUILD-A-GUIDE.md).
 *
 * The tabs are the tour. Liz stays on the right of every tab and talks about it; the tab's content sits on the left, on
 * one screen. Back / N of M / Next under Liz walks the tabs in order. The address bar carries the view (#/audit/r/<id>,
 * #/fixes/info, #/quiz/3).
 *
 *   Overview      what the Guide is and what each tab holds
 *   Your audit    the free check (ve-restaurant-audit `free`, open to everyone): pick your business, get the list of what
 *                 to fix right away; then the full audit, $49, or $149 with a Secret Shopper visit (Sean, 2026-10-10)
 *   The fixes     the mistakes that close Vegan restaurants, one per view; members get them in the order their audit puts
 *                 them. "Outdated or hard-to-find information" is open to everyone (the free example)
 *   Pulse         the research (sourced facts) and our interviews with business owners (ve_pulse_content, PULSE_PICKS)
 *   Get featured  how the Directory works and how a restaurant gets featured: listed, claimed, the Partner plan
 *   Promotions    what we run that brings members through the door, each marked Live or Coming
 *   Test yourself the quiz; 80% or better earns the Entrepreneur Track badge
 *   My list       members: saved fixes, interviews and promotions (ve_guide_saves through ve-cookbook)
 *   Get access    visitors: $11 or 1 Guide credit
 *
 * Access is the Dairy Guide's (canon-ve-guide-pricing v3): ve-guide-unlock for this slug decides; the members-only text (the
 * other fixes, two facts, the quiz) is ve_guides.content_html, handed out only to its owners. Never add it to this repo.
 * The full audit is its own add-on, never part of the Guide (Sean, 2026-10-10): it is bought here, but anyone can buy it.
 */
(function () {
  var SLUG = 'vegan-restaurant-survival-guide';
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var UNLOCK_URL = SB + '/functions/v1/ve-guide-unlock';
  var AUDIT_URL = SB + '/functions/v1/ve-restaurant-audit';
  var COOK_URL = SB + '/functions/v1/ve-cookbook';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var LISTING_FIELDS = (window.VERegionDirectory ? VERegionDirectory.FIELDS : 'id,slug,name,category,logo_url,vote_count,address_city,address_state,color,vegan_status') + ',initials,website';
  // Restaurants members vote for, shown on Get featured as the Directory's own cards.
  var TOP_URL = SB + '/rest/v1/listings?select=' + LISTING_FIELDS + '&status=eq.approved&category=eq.Restaurants&vegan_status=eq.fully_vegan&order=vote_count.desc.nullslast&limit=6';
  // Our interviews with business owners, in this order. A new one is its ve_pulse_content slug here.
  var PULSE_PICKS = [
    'why-some-vegan-businesses-struggle-while-others-thrive',
    'the-business-of-being-vegan-who-actually-profits',
    'vegan-restaurants-adding-meat-death-spiral',
    'sen-saigon-vegan-vietnamese-nyc',
    'love-life-cafe-and-the-long-game-of-vegan-community',
    'allen-zelden-changing-the-game-for-vegan-entrepreneurs-soflo-vegans-podcast',
    'chef-babette-stuff-i-eat-healing-purpose',
    'conscious-business-and-compassion-with-veronica-menin-e108-soflo-vegans-podcast',
    'chef-robyn-corporate-chef-of-future-foods-paow-soflo-vegans-podcast',
    'ingrid-newkirk-peta-green-bar-kitchen-ep003-soflo-vegans-podcast',
    'susan-hargraves-animal-hero-kids-charles-grippo-ep007-soflo-vegans-podcast',
    'top-vegan-restaurants-in-broward-e107-soflo-vegans-podcast'
  ];
  var PULSE_URL = SB + '/rest/v1/ve_pulse_content?select=slug,title,podcast_show,youtube_id,thumbnail_url,summary,published_at&status=eq.published&slug=in.(' + PULSE_PICKS.join(',') + ')';

  // The tabs, in tour order, and what Liz says on each. A tab's `say` must match its recording (Sean approved every line,
  // 2026-10-10). `say` is for visitors (why get it), `sayMember` walks an owner of the Guide through what they have.
  var TABS = [
    { k: 'overview', label: 'Overview', say: 'Hi, I\'m Liz. This Guide shows what may be quietly hurting your restaurant, and how to fix it. Start with a free check of your business.',
      sayMember: 'Welcome in. Start with your free check. The fixes, the interviews and the promotions all line up around what it finds.' },
    { k: 'audit', label: 'Your audit', say: 'Pick your business and I\'ll check your Google listing, website, search and social, then list what you can fix right away. Free.',
      sayMember: 'Your free check lives here. Run it anytime. When you want us to go deeper, the full audit is an add-on.' },
    { k: 'fixes', label: 'The fixes', lock: 1, say: 'These are the mistakes that close Vegan restaurants, from location to burnout, each with what to do instead. One is open for you to try.',
      sayMember: 'Here are your fixes, in the order your audit puts them. Each shows what to do this week. Save the ones you\'re working on.' },
    { k: 'pulse', label: 'Pulse', lock: 1, say: 'Here are our interviews with Vegan business owners: what worked, what didn\'t, and the research behind it. New ones keep coming.',
      sayMember: 'Every business interview we\'ve recorded lives here, with the research. Play any of them right here. We keep adding more.' },
    { k: 'featured', label: 'Get featured', say: 'Being great isn\'t enough if no one can find you. Here\'s how the Directory works, and how restaurants get featured.',
      sayMember: 'Here\'s your Directory page. Claim it, keep your hours and photos fresh, and see who\'s finding you on your Partner Dashboard.' },
    { k: 'promos', label: 'Promotions', say: 'We run campaigns, events, features and ads that bring members through your door. Here\'s what each one does for a restaurant.',
      sayMember: 'These are the promotions open to you, from events to features to campaigns. Pick what fits, or ask our team to plan it with you.' },
    { k: 'quiz', label: 'Test yourself', lock: 1, say: 'When you\'ve worked through the fixes, take the quiz. Pass it and you earn the Entrepreneur Track badge.',
      sayMember: 'Ready? Take the quiz. Score eighty percent or better and the Entrepreneur Track badge is yours.' },
    { k: 'mylist', label: 'My list', mine: 1, say: 'Everything you saved lives here: fixes, interviews and promotions, so you can pick up where you left off.' },
    { k: 'join', label: 'Get access', guest: 1, say: 'Get the whole Guide for eleven dollars, or one Guide credit. It\'s yours to keep, and it keeps growing.',
      sayCredit: 'You have a Guide credit. Use it here and the whole Guide is yours to keep.' }
  ];
  // Liz on camera (recorded 2026-10-10): el-media voice, Wan 2.7 from one pose per tab, cut by hand where her mouth closes.
  var CLIP_BASE = SB + '/storage/v1/object/public/vegan-media/media/liz/restaurant-guide/';
  var CLIPS = {}, CLIPS_M = {};
  ['overview', 'audit', 'fixes', 'pulse', 'featured', 'promos', 'quiz', 'join'].forEach(function (k) { CLIPS[k] = { video: CLIP_BASE + 'rg-' + k + '.mp4?v=1', poster: CLIP_BASE + 'rg-poster-' + k + '.jpg?v=1' }; });
  ['overview', 'audit', 'fixes', 'pulse', 'featured', 'promos', 'quiz', 'mylist'].forEach(function (k) { CLIPS_M[k] = { video: CLIP_BASE + 'rg-m-' + k + '.mp4?v=1', poster: CLIP_BASE + 'rg-poster-m-' + k + '.jpg?v=1' }; });
  CLIPS.join_credit = { video: CLIP_BASE + 'rg-join-c.mp4?v=1', poster: CLIP_BASE + 'rg-poster-join-c.jpg?v=1' };
  // The first page shows her arms folded with an open smile (the playbook), before the tour starts.
  CLIPS.overview.poster = CLIP_BASE + 'rg-poster-first.jpg?v=1';

  // What we run for restaurants (Sean, 2026-10-10). Never show a planned thing as live: each says Live or Coming.
  var PROMOS = [
    { k: 'directory-page', t: 'Your Directory page', live: 1, href: '#/featured', what: 'A page on Vegans Explore that members find by city, search and votes, with your menu, hours, photos and links.', why: 'Free to be listed. Claim it to keep it current and see who finds you.' },
    { k: 'pulse-sponsor', t: 'A sponsored Daily Pulse story', live: 1, what: 'Your news written up and shared in your city\'s Daily Pulse, the topic members read every morning.', why: 'Sponsors give us the pictures; we write it and put it in front of your city.' },
    { k: 'bounties', t: 'Creator bounties', live: 1, what: 'Members and local creators make posts, reels and reviews about you, and earn points for it.', why: 'Real people showing your food, on their own accounts.' },
    { k: 'community-nights', t: 'Community nights', what: 'A members\' night at your restaurant: a set menu, a full room, photos and posts after.', why: 'A slow night turned into a full one, and regulars who came because of the community.' },
    { k: 'showcase', t: 'The Plant-Based Showcase', what: 'Sampling at events that are not Vegan, starting with Miami Dolphins game day at Hard Rock Stadium on November 29, 2026.', why: 'Your food in front of people who would never walk into a Vegan restaurant.' },
    { k: 'campaigns', t: 'Points campaigns', what: 'Members earn points for visiting, trying a dish or posting, with a leaderboard in your city.', why: 'A reason to come in this month, and to come back. Our Q1 2027 campaigns are being planned now.' },
    { k: 'ads', t: 'Ads on Vegans Explore', what: 'Your ad beside the Daily Pulse, events and Guides, on the pages your customers read.', why: 'Reach Vegans in your city where they are already looking for food.' },
    { k: 'guide-spot', t: 'A spot in a Guide', what: 'Your restaurant featured inside one of our Guides, walked through by its Guide.', why: 'A recommendation, not an ad, in front of people learning to eat Vegan.' }
  ];
  // Each fix's picture: an icon on the tile until we have photos.
  var S = 'stroke="#1f5f22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  var FIX_ICON = {
    location: '<path d="M12 21s-7-6.5-7-12a7 7 0 0114 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    branding: '<path d="M4 7l8-4 8 4-8 4z"/><path d="M4 12l8 4 8-4"/><path d="M4 17l8 4 8-4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    seo: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    social: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17" cy="7" r=".8"/>',
    visuals: '<rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l2-3h4l2 3"/>',
    feedback: '<path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12h5"/>',
    menu: '<path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
    community: '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2 20c1-3.5 3.5-5 6-5s5 1.5 6 5M12 20c.6-2.4 2-4 4-5 2.5 0 5 1.5 6 5"/>',
    burnout: '<path d="M12 3c2 4 6 5 6 10a6 6 0 01-12 0c0-3 2-4 2-7 2 1 3 3 3 5 1-2 1-5 1-8z"/>'
  };
  function fixIcon(id, size) { return '<svg width="' + (size || 34) + '" height="' + (size || 34) + '" viewBox="0 0 24 24" fill="none" ' + S + ' aria-hidden="true">' + (FIX_ICON[id] || FIX_ICON.info) + '</svg>'; }
  var ICON = {
    audit: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + '><path d="M9 4h6v3H9z"/><path d="M7 5H5v16h14V5h-2"/><path d="M8 13l3 3 5-6"/></svg>',
    fixes: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + '><path d="M14 6a4 4 0 00-5 5l-6 6 3 3 6-6a4 4 0 005-5l-3 3-3-3z"/></svg>',
    pulse: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + '><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>',
    featured: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + '><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/></svg>',
    promos: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + '><path d="M3 10v4h3l7 5V5L6 10z"/><path d="M17 9a4 4 0 010 6"/></svg>',
    quiz: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + '><circle cx="12" cy="9" r="6"/><path d="M9 14l-2 7 5-3 5 3-2-7"/></svg>'
  };
  var LOCK_SVG = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';
  var HEART = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>';
  var BOOKMARK = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 3h12a1 1 0 011 1v17l-7-4.5L5 21V4a1 1 0 011-1z"/></svg>';
  var AREA = { google: 'Google', seo: 'Search', web: 'Website', social: 'Social' };
  var STATE = { fix: 'Fix', good: 'Good', review: 'Check', skip: 'Could not check' };

  var main = document.getElementById('dgMain');
  var menuEl = document.getElementById('dgMenu'), menuSel = document.getElementById('dgMenuSelect');
  var qEl = document.getElementById('dgQ');
  var PUB = JSON.parse(document.getElementById('rg-public').textContent);

  var access = 'checking';       // checking | guest | pending | member
  var MEM = null;                // members-only payload (fixes, quiz, why)
  var ST = { rule: 'credit', cost: 1100, balance: 0, credits: 0, rate: 2500, cap: 3, active: false, via: null };
  var PODS = null, TOP = null, CRIT = null;
  var curTab = 'overview';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function auth() { return window.VEAuth || null; }
  function token() { var a = auth(); return a && a.isLoggedIn && a.isLoggedIn() ? a.getToken() : null; }
  function member() { return access === 'member'; }
  function sources(list) { return list && list.length ? '<span class="dg-src">' + list.map(function (s) { return '<a href="' + esc(s[1]) + '" target="_blank" rel="noopener">' + esc(s[0]) + '</a>'; }).join('') + '</span>' : ''; }
  function tabs() { return TABS.filter(function (t) { return !(t.guest && member()) && !(t.mine && !member()); }); }
  function tab(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i].k === k) return TABS[i]; return TABS[0]; }
  function href(k) { return '#/' + (k === 'overview' ? '' : k); }
  function store(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function recall(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  // ---------- tabs ----------
  function drawMenu(cur) {
    var locked = !member();
    menuEl.innerHTML = tabs().map(function (t) {
      return '<a href="' + href(t.k) + '"' + (t.k === cur ? ' aria-current="page"' : '') + (t.guest ? ' class="dg-join-tab"' : '') + '>' + esc(t.label) +
        (locked && t.lock ? ' <span class="dg-lk" aria-label="locked">' + LOCK_SVG + '</span>' : '') + '</a>';
    }).join('');
    menuSel.innerHTML = tabs().map(function (t) { return '<option value="' + t.k + '"' + (t.k === cur ? ' selected' : '') + '>' + esc(t.label) + (locked && t.lock ? ' (locked)' : '') + '</option>'; }).join('') +
      (cur === 'search' ? '<option value="search" selected>Search results</option>' : '');
  }
  menuSel.addEventListener('change', function () { location.hash = href(menuSel.value); });

  // ---------- pieces ----------
  function crumb(parts) {
    return '<div class="dg-crumb"><a href="#/">Restaurant Guide</a>' + parts.map(function (p) { return ' &rsaquo; ' + (p[1] ? '<a href="' + p[1] + '">' + esc(p[0]) + '</a>' : esc(p[0])); }).join('') + '</div>';
  }
  function head(k, h, lede, right) {
    return '<div class="dg-head"><div><div class="dg-k">' + esc(k) + '</div><h2 class="dg-h1">' + h + '</h2></div>' + (right || '') + '</div>' + (lede ? '<p class="dg-lede">' + lede + '</p>' : '');
  }
  function toggles(list, cur) {
    return '<div class="dg-toggles" role="group">' + list.map(function (x) { return '<a href="' + x[1] + '" aria-pressed="' + (x[0] === cur) + '">' + esc(x[0]) + '</a>'; }).join('') + '</div>';
  }
  function skel(title, lines) { var h = '<div class="dg-skel">' + (title ? '<h3>' + esc(title) + '</h3>' : '<i></i>'); for (var i = 0; i < (lines || 3); i++) h += '<i style="width:' + (92 - i * 9) + '%"></i>'; return h + '</div>'; }
  function gated(inner, title, text) {
    return '<div class="dg-gated"><div class="dg-blur" aria-hidden="true">' + inner + '</div><div class="dg-gate"><span class="dg-lockic">' + LOCK_SVG.replace(/width="11" height="11"/, 'width="16" height="16"').replace('currentColor', '#1f5f22') + '</span>' +
      '<b>' + esc(title) + '</b><p>' + esc(text) + ' ' + esc(offerLine()) + '</p>' + ctaBtns() + '</div></div>';
  }
  // One tile for everything that is not a Directory listing: the picture on the left, the words, the actions top right.
  function row(o) {
    return '<div class="dg-srow"' + (o.href ? ' data-href="' + o.href + '"' : '') + '>' + (o.icon ? '<span class="dg-th rg-th" aria-hidden="true">' + o.icon + '</span>' : '') +
      '<div class="dg-srow-b">' + (o.pre || '') + '<h3>' + (o.href ? '<a href="' + o.href + '">' + esc(o.title) + '</a>' : esc(o.title)) + '</h3>' + (o.body || '') + '</div>' +
      (o.acts ? '<div class="dg-acts">' + o.acts + '</div>' : '') + '</div>';
  }

  // ---------- the offer (the Guide: $11 or 1 Guide credit) ----------
  function priced() { return ST.rule === 'credit'; }
  function pts(n) { return Number(n || 0).toLocaleString('en-US'); }
  function credits(n) { return n + ' Guide credit' + (n === 1 ? '' : 's'); }
  function mode() {
    if (access === 'guest' || access === 'checking') return 'join';
    if (!priced()) return 'activate';
    if (ST.credits >= 1) return 'unlock';
    return ST.active ? 'buy' : 'activate';
  }
  function canExchange() { return ST.balance >= ST.rate && ST.credits < ST.cap; }
  function ctaLabel() { return { join: 'Join for $11', activate: 'Become a Founding Member', unlock: 'Unlock with 1 credit', buy: 'Get it now for $11' }[mode()]; }
  function offerLine() {
    var m = mode();
    if (m === 'unlock') return 'Unlock it with 1 Guide credit. You have ' + ST.credits + '.';
    if (m === 'buy') return 'Get it now for $11, or use a Guide credit: Passport gives you one every month.';
    return 'Joining is $11, one time, and comes with a Guide credit: unlock this Guide or any other.';
  }
  function ctaBtns() {
    var m = mode();
    return '<div class="dg-btns"><button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button>' +
      (m === 'join' ? '<a href="#" data-signin>Already a member? Sign in</a>' : '') +
      (m === 'buy' ? (canExchange() ? '<a href="#" data-exchange>Use ' + pts(ST.rate) + ' points for a credit</a>' : '<a href="/passport">Passport: a credit every month</a>') : '') + '</div>';
  }
  function take(d) {
    if (!d || d.error) return;
    if (d.access_rule && d.access_rule !== ST.rule) { ST.rule = d.access_rule; if (TOUR.shown === 'join') TOUR.shown = null; }
    if (d.points_per_credit) ST.rate = d.points_per_credit;
    if (d.credit_cap) ST.cap = d.credit_cap;
    ST.balance = d.balance || 0; ST.credits = d.credits || 0; ST.active = d.membership_status === 'active'; ST.via = d.via || null;
  }
  function drawJoinbox() {
    var box = document.querySelector('.dg-joinbox'); if (!box || member()) return;
    var m = mode(), price = box.querySelector('.dg-jb-price'), btn = box.querySelector('[data-join]'), signin = box.querySelector('.dg-jb-in');
    price.innerHTML = m === 'unlock' || m === 'buy' ? '<b>' + ST.credits + '</b><small>Guide credit' + (ST.credits === 1 ? '' : 's') + '<br>this Guide: 1</small>'
      : '<b>$11</b><small>one time<br>purchase</small>';
    btn.textContent = ctaLabel();
    signin.style.display = m === 'join' ? '' : 'none';
  }

  // ---------- saves and votes (ve-cookbook, the Guide's own lists) ----------
  function cookApi(body) {
    var tok = token(), h = { 'Content-Type': 'application/json' };
    if (tok) h.Authorization = 'Bearer ' + tok;
    body.guide = SLUG;
    return fetch(COOK_URL, { method: 'POST', headers: h, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  var SV = { fix: {}, episode: {}, promo: {} }, SV_ORDER = [], svState = '', svWait = [];
  function loadSaves(then) {
    if (then) svWait.push(then);
    if (svState === 'loading') return;
    if (!member() || svState === 'loaded') { var w0 = svWait; svWait = []; w0.forEach(function (f) { f(); }); return; }
    svState = 'loading';
    var finish = function () { paintSaves(); var w = svWait; svWait = []; w.forEach(function (f) { f(); }); };
    cookApi({ action: 'saves' }).then(function (d) {
      if (d && d.saves) { SV_ORDER = d.saves; d.saves.forEach(function (x) { if (SV[x.kind]) SV[x.kind][x.key] = 1; }); svState = 'loaded'; } else svState = '';
      finish();
    }).catch(function () { svState = ''; finish(); });
  }
  function saveBtn(kind, key) {
    var on = !!SV[kind][key];
    return '<button type="button" class="dg-save' + (on ? ' on' : '') + '" data-save="' + kind + ':' + esc(key) + '" aria-pressed="' + on + '" title="' + (on ? 'Saved to My list' : 'Save to My list') + '">' + BOOKMARK + '<span>' + (on ? 'Saved' : 'Save') + '</span></button>';
  }
  function paintSaves() {
    [].forEach.call(document.querySelectorAll('[data-save]'), function (b) {
      var kk = b.getAttribute('data-save'), i = kk.indexOf(':'), on = !!(SV[kk.slice(0, i)] || {})[kk.slice(i + 1)];
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.title = on ? 'Saved to My list' : 'Save to My list';
      b.querySelector('span').textContent = on ? 'Saved' : 'Save';
    });
  }
  var GV = { counts: { episode: {} }, mine: { episode: {} } }, gvLoaded = false;
  function loadGVotes(then) {
    cookApi({ action: 'gvotes' }).then(function (d) {
      if (d && d.counts) { GV.counts = d.counts; GV.mine = { episode: {} }; (d.mine.episode || []).forEach(function (x) { GV.mine.episode[x] = 1; }); gvLoaded = true; }
      if (then) then();
    }).catch(function () { if (then) then(); });
  }
  function gvCount(key) { return (GV.counts.episode || {})[key] || 0; }
  function gvoteBtn(key) {
    var on = !!GV.mine.episode[key];
    return '<button type="button" class="dg-vote dg-vote-s' + (on ? ' on' : '') + '" data-gvote="episode:' + esc(key) + '" aria-pressed="' + on + '" title="' + (on ? 'You voted for this' : 'Vote for this') + '">' + HEART + '<b>' + gvCount(key) + '</b></button>';
  }

  // ---------- the audit (ve-restaurant-audit) ----------
  function auditApi(body) {
    var tok = token(), h = { 'Content-Type': 'application/json' };
    if (tok) h.Authorization = 'Bearer ' + tok;
    return fetch(AUDIT_URL, { method: 'POST', headers: h, body: JSON.stringify(body) }).then(function (r) { return r.json().then(function (d) { d._status = r.status; return d; }); });
  }
  // Each check belongs to one of the fixes (ve_audit_criteria.chapter), so an audit puts the fixes in order.
  function loadCriteria(then) {
    if (CRIT) return then && then();
    auditApi({ action: 'criteria' }).then(function (d) { CRIT = {}; (d.criteria || []).forEach(function (c) { CRIT[c.key] = c; }); if (then) then(); }).catch(function () { CRIT = {}; if (then) then(); });
  }
  var LAST = null; // the latest audit this browser ran or opened: {id, items or todo}
  function flagged() {
    var w = {};
    if (!LAST || !CRIT) return w;
    (LAST.items || []).forEach(function (it) { if (it.state === 'fix' && it.chapter) w[it.chapter] = (w[it.chapter] || 0) + (it.weight || 1); });
    (LAST.todo || []).forEach(function (it) { var c = CRIT[it.key]; if (c && c.chapter) w[c.chapter] = (w[c.chapter] || 0) + 1; });
    return w;
  }
  function loadLast(then) {
    var id = recall('rg_last_audit');
    if (!id || LAST) return then && then();
    auditApi({ action: 'get', id: id }).then(function (d) { if (d && d.status === 'done') LAST = d; if (then) then(); }).catch(function () { if (then) then(); });
  }
  var auditView = 0; // bumps on every view, so an old poll stops drawing
  var PICK = null;
  function viewAudit(sub) {
    var parts = String(sub || '').split('/');
    if (parts[0] === 'r' && parts[1]) return viewAuditResult(parts[1]);
    if (parts[0] === 'shopper' && parts[1]) return viewShopper(parts[1]);
    var v = ++auditView;
    main.innerHTML = head('Your audit', 'A free check of your restaurant',
      'We look at your Google listing, your website, how you show up in search, and your Instagram, then list what you can fix right away. It takes about a minute.') +
      '<div class="rg-find"><input type="search" id="rgFind" placeholder="Your restaurant\'s name" aria-label="Find your restaurant" autocomplete="off"></div>' +
      '<div class="rg-hits" id="rgHits"></div>' +
      '<details class="rg-manual"><summary>Not in our Directory? Enter your details</summary><form id="rgManual" class="dg-form">' +
      '<div class="dg-two"><label class="dg-field"><span>Restaurant name</span><input name="name" required maxlength="120"></label>' +
      '<label class="dg-field"><span>City</span><input name="city" required maxlength="80"></label></div>' +
      '<div class="dg-two"><label class="dg-field"><span>Website <i>(optional)</i></span><input name="website" maxlength="300" placeholder="example.com"></label>' +
      '<label class="dg-field"><span>Instagram <i>(optional)</i></span><input name="instagram" maxlength="120" placeholder="@yourrestaurant"></label></div>' +
      '<button type="submit" class="dg-btn">Run my free check</button></form></details>' +
      '<span class="dg-status" role="status" style="display:block;margin-top:8px;color:#8a1c12"></span>' +
      '<div id="rgMine"></div>';
    var input = document.getElementById('rgFind'), hits = document.getElementById('rgHits'), t;
    input.addEventListener('input', function () {
      clearTimeout(t);
      var q = input.value.trim();
      if (q.length < 2) { hits.innerHTML = ''; return; }
      t = setTimeout(function () {
        auditApi({ action: 'find', q: q }).then(function (d) {
          if (v !== auditView) return;
          var ls = d.listings || [];
          hits.innerHTML = ls.length ? ls.map(function (l) { return '<button type="button" class="rg-hit" data-pick="' + esc(l.slug) + '">' + esc(l.name) + '<span>' + esc(l.city || '') + ' &middot; Check it</span></button>'; }).join('')
            : '<p class="dg-empty">No match in the Directory. Enter your details below instead.</p>';
        });
      }, 220);
    });
    document.getElementById('rgManual').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      runFree({ name: f.name.value.trim(), city: f.city.value.trim(), website: f.website.value.trim(), instagram: f.instagram.value.trim() });
    });
    if (token()) drawMine(v);
  }
  function runFree(target) {
    setStatus('');
    var body = { action: 'free' }; for (var k in target) body[k] = target[k];
    main.querySelector('.rg-find') && (main.querySelector('.rg-find').innerHTML = '<div class="rg-waiting"><span class="rg-spin"></span>Starting your check...</div>');
    auditApi(body).then(function (d) {
      if (d && d.id) { store('rg_last_audit', d.id); LAST = null; location.hash = '#/audit/r/' + d.id; return; }
      viewAudit(''); setStatus((d && d.message) || 'That did not start. Try again in a minute.');
    }).catch(function () { viewAudit(''); setStatus('That did not start. Try again in a minute.'); });
  }
  // A member's audits: what they bought (and its re-check) and their free checks.
  function drawMine(v) {
    auditApi({ action: 'mine' }).then(function (d) {
      var el = document.getElementById('rgMine'); if (!el || v !== auditView) return;
      var orders = d.orders || [], audits = (d.audits || []).filter(function (a) { return a.status === 'done'; });
      if (!orders.length && !audits.length) return;
      var date = function (s) { return s ? new Date(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''; };
      el.innerHTML = '<h3 class="dg-k" style="margin:24px 0 10px">Your audits</h3><div class="dg-rows">' +
        orders.map(function (o) {
          var re = o.recheck_audit_id ? 'Re-check ready' : 'Re-check ' + date(o.recheck_at);
          var shop = o.tier === 'shopper' ? (o.shopper_status === 'reported' ? ' &middot; <a href="#/audit/shopper/' + esc(o.id) + '" style="color:var(--g);font-weight:800">Secret Shopper report</a>' : ' &middot; Secret Shopper visit coming') : '';
          return '<div class="dg-row"><div class="dg-row-main"><b>' + esc(o.business || 'Your restaurant') + '</b><span>' + (o.tier === 'shopper' ? 'Full audit with Secret Shopper' : 'Full audit') + ' &middot; ' + esc(date(o.paid_at)) + ' &middot; ' + esc(re) + shop + '</span></div>' +
            '<span class="dg-tag dg-tag-live">Paid</span><a class="dg-btn dg-ghost" href="#/audit/r/' + esc(o.recheck_audit_id || o.audit_id || '') + '">Open</a></div>';
        }).join('') +
        audits.slice(0, 6).map(function (a) {
          return '<div class="dg-row"><div class="dg-row-main"><b>' + esc(a.business || 'Your restaurant') + '</b><span>' + (a.tier === 'full' ? 'Full audit' : 'Free check') + ' &middot; ' + esc(date(a.created_at)) + '</span></div>' +
            '<span class="dg-tag dg-tag-off">' + (a.tier === 'full' ? 'Full' : 'Free') + '</span><a class="dg-btn dg-ghost" href="#/audit/r/' + esc(a.id) + '">Open</a></div>';
        }).join('') + '</div>';
    }).catch(function () {});
  }
  // The Secret Shopper report, for the owner who bought it (ve-restaurant-audit shopper_get answers them once it is sent).
  function viewShopper(id) {
    var v = ++auditView;
    main.innerHTML = crumb([['Your audit', '#/audit'], ['Secret Shopper report']]) + '<div class="dg-loading">Loading your report...</div>';
    if (!token()) { main.innerHTML = crumb([['Your audit', '#/audit'], ['Secret Shopper report']]) + '<p class="dg-empty">Sign in to read your Secret Shopper report.</p><button type="button" class="dg-btn" data-signin>Sign in</button>'; return; }
    auditApi({ action: 'shopper_get', order_id: id }).then(function (d) {
      if (v !== auditView) return;
      if (!d.id) { main.innerHTML = crumb([['Your audit', '#/audit'], ['Secret Shopper report']]) + '<p class="dg-empty">' + (d._status === 403 ? 'Your report shows here once our shopper sends it.' : 'We could not find that report.') + '</p>'; return; }
      var r = d.report || {}, rate = function (x) { return x ? '<span class="rg-st rg-st-' + (x >= 4 ? 'good' : x === 3 ? 'review' : 'fix') + '">' + x + ' of 5</span>' : ''; };
      var part = function (title, rating, lines) {
        var body = lines.filter(function (l) { return l[1] != null && l[1] !== ''; }).map(function (l) { return '<p><strong>' + esc(l[0]) + ':</strong> ' + esc(l[1]) + '</p>'; }).join('');
        return '<div class="rg-item">' + (rating ? rate(rating) : '<span></span>') + '<div><b>' + esc(title) + '</b></div>' + body + '</div>';
      };
      var g = function (sec, k) { return (r[sec] || {})[k]; };
      var KN = { food: 'The food', room: 'The dining room', menu: 'The menu', restroom: 'The restroom', outside: 'Outside', receipt: 'Receipt', other: 'Photo' };
      main.innerHTML = crumb([['Your audit', '#/audit'], ['Secret Shopper report']]) +
        head('Secret Shopper report', esc(d.place.name), 'Our shopper visited as a normal guest' + (g('visit', 'date') ? ' on ' + esc(new Date(g('visit', 'date') + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })) : '') + '. Here is what they found.') +
        '<div class="rg-score rg-score7"><div class="rg-main"><b>' + (g('summary', 'overall') || '&ndash;') + '<small style="font-size:16px"> of 5</small></b><span>Overall</span></div>' +
        [['welcome', 'Welcome'], ['wait', 'Wait'], ['menu', 'Menu'], ['food', 'Food'], ['clean', 'Clean'], ['staff', 'Staff']].map(function (x) { return '<div><b>' + (g(x[0], 'rating') || '&ndash;') + '</b><span>' + x[1] + '</span></div>'; }).join('') + '</div>' +
        '<div class="rg-todo">' +
        part('What went well', 0, [['', g('summary', 'went_well')]]).replace('<strong>:</strong> ', '') +
        part('What to fix first', 0, [['', g('summary', 'to_fix')]]).replace('<strong>:</strong> ', '') +
        part('The welcome', g('welcome', 'rating'), [['Greeted', g('welcome', 'greeted')], ['What happened', g('welcome', 'notes')]]) +
        part('The wait', g('wait', 'rating'), [['Minutes until they ordered', g('wait', 'order_min')], ['Minutes until the food came', g('wait', 'food_min')], ['Notes', g('wait', 'notes')]]) +
        part('The menu and Vegan labels', g('menu', 'rating'), [['Vegan labels', g('menu', 'labeled')], ['Notes', g('menu', 'notes')]]) +
        part('The food', g('food', 'rating'), [['What they ordered', g('visit', 'ordered')], ['Notes', g('food', 'notes')]]) +
        part('Cleanliness', g('clean', 'rating'), [['Notes', g('clean', 'notes')]]) +
        part('The staff', g('staff', 'rating'), [['They asked', g('staff', 'question')], ['The answer', g('staff', 'answer')], ['Notes', g('staff', 'notes')]]) +
        part('Would they go back?', 0, [['', g('summary', 'return')]]).replace('<strong>:</strong> ', '') +
        '</div>' +
        ((r.photos || []).filter(function (p) { return p.kind !== 'receipt'; }).length ? '<h3 class="dg-k" style="margin:18px 0 8px">Photos</h3><div class="dg-gallery">' + r.photos.filter(function (p) { return p.kind !== 'receipt'; }).map(function (p) {
          return '<figure class="dg-gp"><a href="' + esc(p.url || '') + '" target="_blank" rel="noopener"><span style="background-image:url(\'' + esc(p.url || '') + '\')"></span></a><figcaption>' + esc(KN[p.kind] || 'Photo') + (p.caption ? ': ' + esc(p.caption) : '') + '</figcaption></figure>';
        }).join('') + '</div>' : '') +
        '<p class="rg-fine">Want help with what it found? <a href="mailto:contact@lesaruss.com?subject=' + encodeURIComponent('Secret Shopper report: ' + d.place.name) + '">Write to our team</a>. What you paid counts toward our managed services within 30 days of your order.</p>';
    }).catch(function () { if (v === auditView) main.innerHTML = crumb([['Your audit', '#/audit']]) + '<p class="dg-empty">We could not load your report just now. Refresh to try again.</p>'; });
  }
  function viewAuditResult(id) {
    var v = ++auditView, tries = 0;
    main.innerHTML = crumb([['Your audit', '#/audit'], ['Your results']]) + '<div class="rg-waiting"><span class="rg-spin"></span>Checking your Google listing, website, search and Instagram. This takes about a minute.</div>';
    (function poll() {
      auditApi({ action: 'get', id: id }).then(function (d) {
        if (v !== auditView) return;
        if (d.status === 'running' || d.status === 'queued') { if (++tries < 40) setTimeout(poll, 3000); else main.querySelector('.rg-waiting').textContent = 'This is taking longer than usual. Refresh in a minute.'; return; }
        if (d.error || d.status !== 'done') { main.innerHTML = crumb([['Your audit', '#/audit'], ['Your results']]) + '<p class="dg-empty">' + esc(d.error || 'We could not find that audit.') + ' <a href="#/audit">Run a new check</a></p>'; return; }
        LAST = d; store('rg_last_audit', d.id);
        loadCriteria(function () { if (v === auditView) (d.full ? drawFull(d) : drawFree(d)); });
      }).catch(function () { if (v === auditView && ++tries < 40) setTimeout(poll, 4000); });
    })();
  }
  function itemRow(it, full) {
    var c = CRIT && CRIT[it.key] || {};
    var ch = it.chapter || c.chapter;
    return '<div class="rg-item"><span class="rg-st rg-st-' + esc(it.state || 'fix') + '">' + esc(STATE[it.state || 'fix']) + '</span><div><span class="rg-area">' + esc(AREA[it.area || c.area] || '') + '</span><br><b>' + esc(it.label || c.label || it.key) + '</b></div>' +
      (it.found ? '<p>' + esc(it.found) + '</p>' : '') +
      (full && it.why ? '<p>' + esc(it.why) + '</p>' : '') + (full && it.how && it.state !== 'good' ? '<p class="rg-how"><strong>How to fix it:</strong> ' + esc(it.how) + '</p>' : '') +
      (ch && it.state === 'fix' ? '<a href="#/fixes/' + esc(ch) + '">Read the fix in the Guide &rsaquo;</a>' : '') + '</div>';
  }
  function drawFree(d) {
    var n = (d.todo || []).length;
    main.innerHTML = crumb([['Your audit', '#/audit'], [d.business || 'Your results']]) +
      head('Your free check', esc(d.business || 'Your restaurant') + ': ' + (n ? n + ' thing' + (n === 1 ? '' : 's') + ' to fix right away' : 'nothing urgent on the free list'),
        n ? 'Most important first, each with what we found. Fix these and you are already ahead of most restaurants.' : 'The free checks came back clean. The full audit looks at much more.') +
      (n ? '<div class="rg-todo">' + d.todo.map(function (it) { return itemRow({ key: it.key, label: it.label, area: it.area, found: it.found, state: 'fix' }, false); }).join('') + '</div>' : '') +
      (d.more_fix ? '<p class="dg-lede"><strong>' + d.more_fix + ' more</strong> to fix in the full audit, each with why it matters and how to fix it.</p>' : '') +
      '<div id="rgOffer"></div>';
    drawOffer(d);
  }
  function drawFull(d) {
    var items = d.items || [], fix = items.filter(function (i) { return i.state === 'fix'; }), rest = items.filter(function (i) { return i.state !== 'fix'; });
    var areas = d.areas || {};
    var pctOf = function (a) { return a && a.max ? Math.round(100 * a.score / a.max) + '%' : '&ndash;'; };
    main.innerHTML = crumb([['Your audit', '#/audit'], [d.business || 'Your results']]) +
      head('Your full audit', esc(d.business || 'Your restaurant'), 'Every check, with why it matters and how to fix it. Fix first, then the rest.') +
      '<div class="rg-score"><div class="rg-main"><b>' + (d.max_score ? Math.round(100 * d.score / d.max_score) + '%' : '&ndash;') + '</b><span>Overall</span></div>' +
      ['google', 'seo', 'web', 'social'].map(function (k) { return '<div><b>' + pctOf(areas[k]) + '</b><span>' + esc(AREA[k]) + '</span></div>'; }).join('') + '</div>' +
      (fix.length ? '<h3 class="dg-k" style="margin:0 0 8px">To fix (' + fix.length + ')</h3><div class="rg-todo">' + fix.sort(function (a, b) { return (b.weight || 0) - (a.weight || 0); }).map(function (i) { return itemRow(i, true); }).join('') + '</div>' : '') +
      '<h3 class="dg-k" style="margin:18px 0 8px">Everything else</h3><div class="rg-todo">' + rest.map(function (i) { return itemRow(i, true); }).join('') + '</div>' +
      '<p class="rg-fine">Want us to take care of it? Our managed services handle your Google listing, website and social for you. Reply to your audit email, or <a href="mailto:contact@lesaruss.com?subject=' + encodeURIComponent('Managed services for ' + (d.business || 'my restaurant')) + '">write to our team</a>.</p>';
  }
  // The full audit (Sean, 2026-10-10: "Go with $49 and $149"): its own add-on, never part of the Guide.
  function drawOffer(d) {
    var el = document.getElementById('rgOffer'); if (!el) return;
    var t = d.target || {}, body = { action: 'offer' };
    if (t.listing_slug) body.listing_slug = t.listing_slug; else { body.name = t.name; body.city = t.city; }
    auditApi(body).then(function (o) {
      el = document.getElementById('rgOffer'); if (!el) return;
      var plan = function (tier, title, price, lines, hot) {
        return '<div class="rg-plan' + (hot ? ' rg-hot' : '') + '"><h3>' + esc(title) + '</h3><div class="rg-price">$' + price + '<small>one time</small></div><ul>' + lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' +
          '<button type="button" class="dg-btn" data-buy="' + tier + '" data-audit="' + esc(d.id) + '">Get the ' + (tier === 'shopper' ? 'audit and visit' : 'full audit') + '</button></div>';
      };
      PICK = t;
      el.innerHTML = '<h3 class="dg-k" style="margin:22px 0 10px">Go deeper</h3><div class="rg-offer">' +
        plan('full', 'The full audit', 49, ['Every check: Google, search, your website and social', 'Why each one matters and how to fix it', 'Your score, and where it is lowest', 'We run it again in 90 days so you can see what changed']) +
        (o.shopper ? plan('shopper', 'The full audit and a Secret Shopper', 149, ['Everything in the full audit', 'A visit from our ' + (o.city ? o.city + ' ' : '') + 'team: they order, eat and report', 'The welcome, the wait, the menu, Vegan labeling, cleanliness and how well your staff know the menu', 'A written report with photos. You will not know the day'], 1) : '') +
        '</div><p class="rg-fine">If you sign up for our managed services within 30 days, what you paid counts toward it. The full audit is separate from this Guide.</p>' +
        '<span class="dg-status" role="status" style="display:block;margin-top:8px;color:#8a1c12"></span>';
    }).catch(function () {});
  }
  function buyAudit(btn) {
    var tier = btn.getAttribute('data-buy'), a = auth();
    if (!token()) {
      if (a) a.showAuthModal('Create your free account, or sign in, to buy the full audit. It is $' + (tier === 'shopper' ? '149' : '49') + ', one time.', function () { location.reload(); }, 'signup');
      return;
    }
    var t = PICK || {}, body = { action: 'checkout', tier: tier };
    if (t.listing_slug) body.listing_slug = t.listing_slug; else { body.name = t.name; body.city = t.city; body.website = t.website; body.instagram = t.instagram; }
    btn.disabled = true; btn.textContent = 'Opening checkout...';
    auditApi(body).then(function (d) {
      if (d && d.url) { (window.top || window).location.href = d.url; return; }
      throw d;
    }).catch(function (d) { btn.disabled = false; btn.textContent = tier === 'shopper' ? 'Get the audit and visit' : 'Get the full audit'; setStatus((d && d.message) || 'Checkout did not open. Try again in a minute.'); });
  }

  // ---------- the fixes ----------
  // Every fix in the Guide's order; a member's own order puts what their audit flagged first.
  function allFixes() {
    var byId = {}; (MEM ? MEM.fixes : []).forEach(function (f) { byId[f.id] = f; }); byId[PUB.fix_example.id] = PUB.fix_example;
    return PUB.titles.map(function (t) { return byId[t[0]] || { id: t[0], title: t[1], locked: 1 }; });
  }
  function orderedFixes() {
    var list = allFixes(), w = flagged();
    if (!member()) return list;
    return list.map(function (f, i) { return [f, i]; }).sort(function (a, b) { return (w[b[0].id] || 0) - (w[a[0].id] || 0) || a[1] - b[1]; }).map(function (x) { return x[0]; });
  }
  function doneSet() { try { return JSON.parse(recall('rg_fixes_done') || '{}'); } catch (e) { return {}; } }
  function viewFixes(id) {
    var go = function () { if (curTab === 'fixes') draw(); };
    if (member() && (!CRIT || (!LAST && recall('rg_last_audit')))) { loadCriteria(function () { loadLast(go); }); }
    function draw() {
      if (id) return viewFix(id);
      var list = orderedFixes(), w = flagged(), done = doneSet(), fromAudit = member() && Object.keys(w).length;
      var tiles = list.map(function (f) {
        var open = !f.locked;
        return row({ icon: fixIcon(f.id), title: f.title, href: open ? '#/fixes/' + f.id : '',
          pre: (w[f.id] ? '<span class="rg-flag">From your audit</span>' : '') + (done[f.id] ? '<span class="rg-done">Done</span>' : '') + (!member() && f.id === PUB.fix_example.id ? '<span class="dg-free">Free to try</span>' : ''),
          body: open ? '<p class="dg-srow-p">' + esc(f.problem) + '</p>' : '<p class="dg-srow-p">' + LOCK_SVG + ' In the full Guide</p>',
          acts: member() ? saveBtn('fix', f.id) : '' });
      }).join('');
      main.innerHTML = head('The fixes', 'What closes Vegan restaurants, and what to do instead',
        fromAudit ? 'In the order your audit puts them: what it flagged comes first.' : member() ? 'Run your free check in Your audit and these line up in your order.' : 'Each one with what goes wrong and what to do this week. One is open for you to try.') +
        (member() ? '<div class="dg-srows">' + tiles + '</div>'
          : '<div class="dg-srows">' + tiles + '</div><div style="margin-top:16px">' + gated(skel('Every fix, in your order', 4), 'Every fix, in your order', 'All ten, lined up by your audit, each with what to do this week.') + '</div>');
    }
    draw();
  }
  function viewFix(id) {
    var list = orderedFixes(), i = -1;
    list.forEach(function (f, n) { if (f.id === id) i = n; });
    var f = list[i];
    if (!f || f.locked) {
      main.innerHTML = crumb([['The fixes', '#/fixes'], [f ? f.title : 'Fix']]) + gated(skel(f ? f.title : '', 6), f ? f.title : 'This fix', 'It opens with the full Guide, with every other fix.');
      return;
    }
    var done = doneSet(), w = flagged();
    var nextOpen = null; for (var n = i + 1; n < list.length; n++) if (!list[n].locked) { nextOpen = list[n]; break; }
    main.innerHTML = crumb([['The fixes', '#/fixes'], [f.title]]) +
      '<div class="rg-fix">' + (w[f.id] ? '<span class="rg-flag">From your audit</span>' : '') +
      '<div class="dg-head"><div><div class="dg-k">Fix ' + (i + 1) + ' of ' + list.length + '</div><h2 class="dg-h1">' + esc(f.title) + '</h2></div>' + (member() ? '<div class="dg-acts" style="flex-direction:row">' + saveBtn('fix', f.id) + '</div>' : '') + '</div>' +
      '<p class="rg-problem">' + esc(f.problem) + '</p><h3>What you can do</h3><ul>' + f.list.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<h3>This week</h3><div class="rg-week"><b>Your action</b>' + esc(f.action) + '</div>' +
      '<div class="rg-fixnav"><button type="button" class="dg-btn' + (done[f.id] ? ' dg-ghost' : '') + '" data-done="' + esc(f.id) + '">' + (done[f.id] ? 'Done. Mark not done' : 'Mark it done') + '</button>' +
      (nextOpen ? '<a class="dg-tnav next" href="#/fixes/' + nextOpen.id + '">Next fix &rsaquo;</a>' : member() ? '<a class="dg-tnav next" href="#/quiz">Take the quiz &rsaquo;</a>' : '<a class="dg-tnav next" href="#/join">Get every fix &rsaquo;</a>') + '</div></div>' +
      (!member() ? '<div style="margin-top:22px">' + gated(skel('The other nine fixes', 3), 'The other nine fixes', 'Location, branding, search, social, photos, reviews, the menu, community and burnout, in your order.') + '</div>' : '');
  }

  // ---------- the Pulse: research and our interviews ----------
  var LOCKED_FACTS = ['Replying to reviews wins customers', 'Restaurants last longer than the myth says'];
  function podCard(p) {
    return '<div class="dg-pod-w"><a class="dg-pod" href="#/pulse/watch/' + encodeURIComponent(p.slug) + '"><div class="dg-pod-img" style="background-image:url(\'' + esc(p.thumbnail_url || '') + '\')"></div>' +
      '<div class="dg-pod-b"><div class="dg-pod-show">' + esc(p.podcast_show || 'Vegans Explore') + '</div><div class="dg-pod-t">' + esc(p.title) + '</div><div class="dg-pod-s">' + esc(p.summary || '') + '</div></div></a>' +
      (member() ? '<div class="dg-acts dg-pod-acts">' + gvoteBtn(p.slug) + saveBtn('episode', p.slug) + '</div>' : '') + '</div>';
  }
  function viewPulse(sub) {
    var parts = String(sub || '').split('/'), m = parts[0] === 'research' || parts[0] === 'fact' ? 'research' : 'listen';
    if (parts[0] === 'watch' && parts[1]) return viewWatch(decodeURIComponent(parts[1]));
    var t = toggles([['Interviews', '#/pulse'], ['The research', '#/pulse/research']], m === 'research' ? 'The research' : 'Interviews');
    var html = head('The Restaurant Pulse', m === 'research' ? 'What the research says' : 'Interviews with business owners',
      m === 'research' ? 'Every fact with its source linked.' : 'Owners and founders on what worked, what did not, and what they would do again. New ones keep coming.', t);
    if (m === 'research') {
      var facts = PUB.why.concat(MEM ? MEM.why : LOCKED_FACTS.map(function (x) { return { title: x, locked: 1 }; }));
      var n = Math.max(0, Math.min(facts.length - 1, parseInt(parts[0] === 'fact' ? parts[1] : 0, 10) || 0)), f = facts[n];
      html += '<div class="dg-facts2"><div class="dg-fact-list" role="list">' + facts.map(function (x, i) {
        return '<a role="listitem" href="#/pulse/fact/' + i + '" aria-current="' + (i === n) + '"><span>' + (i + 1) + '</span>' + esc(x.title) + (x.locked ? ' ' + LOCK_SVG : '') + '</a>';
      }).join('') + '</div><div class="dg-fact">' + (f.locked
        ? gated(skel(f.title, 5), 'More facts, every one sourced', 'Reviews, how long restaurants last, and what keeps them open, each with its study linked.')
        : '<h3>' + esc(f.title) + '</h3><p>' + esc(f.text) + '</p>' + sources(f.sources) +
          (n < facts.length - 1 ? '<a class="dg-fact-next" href="#/pulse/fact/' + (n + 1) + '">Next fact &rsaquo;</a>' : '')) + '</div></div>';
    } else {
      var pods = PODS ? PODS.map(function (x, i) { return [x, i]; }).sort(function (a, b) { return gvCount(b[0].slug) - gvCount(a[0].slug) || a[1] - b[1]; }).map(function (x) { return x[0]; }) : null;
      var grid = pods ? (pods.map(podCard).join('') || '<p class="dg-empty">No interviews yet.</p>') : '<div class="dg-loading">Loading...</div>';
      if (member() && !gvLoaded) loadGVotes(function () { if (curTab === 'pulse' && !/research|fact/.test(location.hash)) viewPulse(''); });
      html += member() ? '<div class="dg-pods">' + grid + '</div>' : gated('<div class="dg-pods">' + grid + '</div>', 'Every interview with business owners', 'Watch them right here in the Guide.');
    }
    main.innerHTML = html;
  }
  function viewWatch(slug) {
    if (access === 'checking') { main.innerHTML = '<div class="dg-loading">Loading...</div>'; return; }
    if (!member()) { location.replace('#/pulse'); return; }
    var p = null; (PODS || []).forEach(function (x) { if (x.slug === slug) p = x; });
    if (!p) { main.innerHTML = crumb([['Pulse', '#/pulse']]) + '<div class="dg-loading">' + (PODS ? 'That interview is not in the Guide.' : 'Loading...') + '</div>'; return; }
    var date = p.published_at ? new Date(p.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
    main.innerHTML = crumb([['Pulse', '#/pulse'], [p.title]]) +
      '<div class="dg-watch"><div>' + (p.youtube_id
        ? '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(p.youtube_id) + '?rel=0" title="' + esc(p.title) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe>'
        : '<div class="dg-pod-img" style="border-radius:12px;background-image:url(\'' + esc(p.thumbnail_url || '') + '\')"></div>') + '</div>' +
      '<div><div class="dg-pod-show">' + esc(p.podcast_show || 'Vegans Explore') + (date ? ' &middot; ' + esc(date) : '') + '</div><h2 class="dg-h1" style="font-size:22px">' + esc(p.title) + '</h2><p>' + esc(p.summary || '') + '</p>' +
      '<div class="dg-btns">' + gvoteBtn(p.slug) + saveBtn('episode', p.slug) + '<a class="dg-btn dg-ghost" href="/pulse/' + encodeURIComponent(p.slug) + '" target="_blank" rel="noopener">' + (p.youtube_id ? 'Episode notes' : 'Listen to the episode') + '</a></div></div></div>';
  }

  // ---------- Get featured: the Directory ----------
  function viewFeatured(sub) {
    if (sub && sub.indexOf('listing/') === 0) return viewListing(decodeURIComponent(sub.slice(8)));
    var steps = [
      ['Get listed', 'Every Vegan restaurant can be in the Directory, free. Members find you by city, search and category.', '/claim?add=1', 'Add your restaurant'],
      ['Claim your page', 'Make the page yours: your hours, menu, photos and links, changed whenever you like.', '/claim', 'Claim your page'],
      ['Get votes', 'Members vote for the places they love. The most voted rise to the top of your city.', '/directory', 'See the Directory'],
      ['Become a Partner', 'The Partner Dashboard shows who finds you, and Partners get a front-row seat on our campaigns. Join before January 1, 2027 and the rest of 2026 is on us.', '/claim', 'See the Partner plan']
    ];
    main.innerHTML = head('Get featured', member() ? 'Your Directory page' : 'How restaurants get found on Vegans Explore',
      member() ? 'Find your restaurant, claim it, and keep it fresh. Your Partner Dashboard shows who is finding you.' : 'The Directory is where members look for somewhere to eat. Here is how a restaurant gets on it, and to the top of it.') +
      '<div class="rg-steps">' + steps.map(function (s, i) { return '<div class="rg-step"><em>' + (i + 1) + '</em><b>' + esc(s[0]) + '</b><p>' + esc(s[1]) + '</p><a href="' + s[2] + '">' + esc(s[3]) + ' &rsaquo;</a></div>'; }).join('') + '</div>' +
      '<h3 class="dg-k" style="margin:0 0 8px">Find your restaurant</h3><div class="rg-find"><input type="search" id="rgPage" placeholder="Your restaurant\'s name" aria-label="Find your restaurant\'s page" autocomplete="off"></div><div class="rg-hits" id="rgPageHits"></div>' +
      '<h3 class="dg-k" style="margin:18px 0 8px">Restaurants members vote for</h3>' + (TOP ? '<div class="vrd-root"><div class="rank-grid" id="rgTop">' + TOP.map(function (l, i) { return window.VERegionDirectory ? VERegionDirectory.card(l, i) : ''; }).join('') + '</div></div>' : '<div class="dg-loading">Loading...</div>');
    var input = document.getElementById('rgPage'), hits = document.getElementById('rgPageHits'), t;
    input.addEventListener('input', function () {
      clearTimeout(t); var q = input.value.trim();
      if (q.length < 2) { hits.innerHTML = ''; return; }
      t = setTimeout(function () {
        auditApi({ action: 'find', q: q }).then(function (d) {
          var ls = d.listings || [];
          hits.innerHTML = ls.length ? ls.map(function (l) { return '<a class="rg-hit" href="#/featured/listing/' + encodeURIComponent(l.slug) + '">' + esc(l.name) + '<span>' + esc(l.city || '') + ' &middot; Open the page</span></a>'; }).join('')
            : '<p class="dg-empty">Not in the Directory yet. <a href="/claim?add=1">Add your restaurant</a>, it is free.</p>';
        });
      }, 220);
    });
    var top = document.getElementById('rgTop');
    if (top && window.VERegionDirectory) VERegionDirectory.wire(top, function (slug) { location.hash = '#/featured/listing/' + encodeURIComponent(slug); });
  }
  // A Directory page inside the Guide, framed and sized to fit; its own links go through the Guide's address bar.
  function viewListing(slug) {
    main.innerHTML = crumb([['Get featured', '#/featured'], ['Directory page']]) +
      '<div class="dg-btns" style="margin-bottom:12px"><a class="dg-btn" href="/directory/' + encodeURIComponent(slug) + '?tab=brand">Partner Dashboard</a><a class="dg-btn dg-ghost" href="/claim?listing=' + encodeURIComponent(slug) + '">Claim this page</a></div>' +
      '<div class="dg-lframe"><iframe id="dgListingFrame" title="Directory page" src="/directory/' + encodeURIComponent(slug) + '"></iframe></div>';
    var f = document.getElementById('dgListingFrame');
    f.addEventListener('load', function () {
      var d; try { d = f.contentDocument; } catch (e) { return; }
      if (!d || !d.body) return;
      var last = 0;
      function fit() { var h = d.body.scrollHeight; if (Math.abs(h - last) < 2) return; last = h; f.style.height = Math.max(600, Math.min(20000, h)) + 'px'; f.setAttribute('scrolling', 'no'); }
      fit();
      if (window.ResizeObserver) new ResizeObserver(fit).observe(d.body);
    });
  }

  // ---------- Promotions ----------
  function viewPromos(k) {
    if (k) {
      var p = PROMOS.filter(function (x) { return x.k === k; })[0];
      if (p) {
        main.innerHTML = crumb([['Promotions', '#/promos'], [p.t]]) +
          '<span class="rg-promo-tag ' + (p.live ? 'rg-live' : 'rg-soon') + '">' + (p.live ? 'Live' : 'Coming') + '</span>' + head('Promotion', esc(p.t), esc(p.what)) +
          '<div class="rg-week" style="margin-bottom:16px"><b>What it does for a restaurant</b>' + esc(p.why) + '</div>' +
          '<div class="dg-btns">' + (p.href ? '<a class="dg-btn" href="' + p.href + '">Get started</a>' : '<a class="dg-btn" href="mailto:contact@lesaruss.com?subject=' + encodeURIComponent(p.t + (p.live ? '' : ': count me in')) + '">' + (p.live ? 'Ask our team' : 'Tell me when it opens') + '</a>') +
          (member() ? saveBtn('promo', p.k) : '') + '<a class="dg-btn dg-ghost" href="#/promos">All promotions</a></div>';
        return;
      }
    }
    main.innerHTML = head('Promotions', 'What we run that brings members through your door',
      'Each one marked Live or Coming. Pick what fits, or ask our team to plan it with you.') +
      '<div class="dg-srows">' + PROMOS.map(function (p) {
        return row({ icon: ICON.promos, title: p.t, href: '#/promos/' + p.k, pre: '<span class="rg-promo-tag ' + (p.live ? 'rg-live' : 'rg-soon') + '">' + (p.live ? 'Live' : 'Coming') + '</span>',
          body: '<p class="dg-srow-p">' + esc(p.what) + '</p>', acts: member() ? saveBtn('promo', p.k) : '' });
      }).join('') + '</div>';
  }

  // ---------- Test yourself: the quiz, one question at a time ----------
  var ANS = {};
  try { ANS = JSON.parse(sessionStorage.getItem('rg_quiz') || '{}'); } catch (e) { ANS = {}; }
  function keepAns() { try { sessionStorage.setItem('rg_quiz', JSON.stringify(ANS)); } catch (e) {} }
  function badge() { return recall('rg_badge'); }
  function viewQuiz(sub) {
    if (!member()) {
      main.innerHTML = head('Test yourself', 'The Entrepreneur Track quiz', 'Ten questions on the fixes. Score 80% or better and the badge is yours.') +
        gated(skel('Question 1 of 10', 4), 'The quiz and the badge', 'Ten questions, one at a time, and the Entrepreneur Track badge when you pass.');
      return;
    }
    var Q = MEM.quiz, n = parseInt(sub, 10);
    if (sub === 'result') {
      var right = 0; Q.forEach(function (q, i) { if (ANS[i] === q[2]) right++; });
      var pct = Math.round(100 * right / Q.length), pass = pct >= 80;
      if (pass && !badge()) store('rg_badge', new Date().toISOString());
      main.innerHTML = crumb([['Test yourself', '#/quiz'], ['Your score']]) + head('Your score', pct + '%', pass ? 'You passed. The Entrepreneur Track badge is yours.' : 'You need 80% for the badge. Look over the fixes and try again.') +
        (pass ? '<div class="rg-badge"><i>' + ICON.quiz.replace(/#1f5f22/g, '#ffffff') + '</i><div><b>Entrepreneur Track</b><span>The Vegan Restaurant Survival Guide</span></div></div>' : '') +
        '<div class="dg-btns" style="margin-top:16px"><a class="dg-btn" href="#/quiz/1" data-retake>Take it again</a><a class="dg-btn dg-ghost" href="#/fixes">Back to the fixes</a></div>';
      return;
    }
    if (!n) {
      main.innerHTML = head('Test yourself', 'The Entrepreneur Track quiz', 'Ten questions on the fixes, one at a time. Score 80% or better and the badge is yours. Take it as often as you like.') +
        (badge() ? '<div class="rg-badge" style="margin-bottom:16px"><i>' + ICON.quiz.replace(/#1f5f22/g, '#ffffff') + '</i><div><b>Entrepreneur Track</b><span>Earned ' + esc(new Date(badge()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })) + '</span></div></div>' : '') +
        '<a class="dg-btn" href="#/quiz/1" data-retake>Start the quiz</a>';
      return;
    }
    n = Math.max(1, Math.min(Q.length, n));
    var q = Q[n - 1];
    main.innerHTML = crumb([['Test yourself', '#/quiz'], ['Question ' + n]]) + '<div class="rg-q"><div class="dg-k">Question ' + n + ' of ' + Q.length + '</div><h3>' + esc(q[0]) + '</h3>' +
      q[1].map(function (o, i) { return '<button type="button" class="rg-opt" data-ans="' + (n - 1) + ':' + i + '" aria-pressed="' + (ANS[n - 1] === i) + '"><i></i>' + esc(o) + '</button>'; }).join('') +
      '<div class="dg-formnav"><a class="dg-tnav" href="' + (n > 1 ? '#/quiz/' + (n - 1) : '#/quiz') + '">Back</a><span>' + n + ' of ' + Q.length + '</span>' +
      '<a class="dg-tnav next" id="rgQNext" href="' + (n < Q.length ? '#/quiz/' + (n + 1) : '#/quiz/result') + '"' + (ANS[n - 1] == null ? ' aria-disabled="true" style="opacity:.35;pointer-events:none"' : '') + '>' + (n < Q.length ? 'Next' : 'See my score') + '</a></div></div>';
  }

  // ---------- My list ----------
  var LIST_SECS = [['Fixes', 'fixes', 'fix', '#/fixes'], ['Interviews', 'interviews', 'episode', '#/pulse'], ['Promotions', 'promotions', 'promo', '#/promos']];
  function viewMyList(sub) {
    var sec = LIST_SECS.filter(function (x) { return x[1] === String(sub || '').split('/')[0]; })[0] || LIST_SECS[0];
    main.innerHTML = head('My list', 'My list', 'Everything you save in the Guide, in one place. Tap Save on any fix, interview or promotion.', toggles(LIST_SECS.map(function (x) { return [x[0], '#/mylist/' + x[1]]; }), sec[0])) +
      '<div id="dgML"><div class="dg-loading">Loading your list...</div></div>';
    var draw = function () {
      var el = document.getElementById('dgML'); if (!el) return;
      var keys = SV_ORDER.filter(function (x) { return x.kind === sec[2]; }).map(function (x) { return x.key; }), html = '', items = [];
      if (sec[2] === 'fix') { var all = allFixes(); items = keys.map(function (k) { return all.filter(function (f) { return f.id === k; })[0]; }).filter(Boolean);
        html = '<div class="dg-srows">' + items.map(function (f) { return row({ icon: fixIcon(f.id), title: f.title, href: '#/fixes/' + f.id, body: '<p class="dg-srow-p">' + esc(f.problem || '') + '</p>', acts: saveBtn('fix', f.id) }); }).join('') + '</div>'; }
      else if (sec[2] === 'episode') { items = keys.map(function (k) { return (PODS || []).filter(function (p) { return p.slug === k; })[0]; }).filter(Boolean); html = '<div class="dg-pods">' + items.map(podCard).join('') + '</div>'; }
      else { items = keys.map(function (k) { return PROMOS.filter(function (p) { return p.k === k; })[0]; }).filter(Boolean);
        html = '<div class="dg-srows">' + items.map(function (p) { return row({ icon: ICON.promos, title: p.t, href: '#/promos/' + p.k, body: '<p class="dg-srow-p">' + esc(p.what) + '</p>', acts: saveBtn('promo', p.k) }); }).join('') + '</div>'; }
      el.innerHTML = items.length ? html : '<p class="dg-empty">Nothing saved here yet. Tap Save on any of the <a href="' + sec[3] + '">' + esc(sec[0].toLowerCase()) + '</a> and it shows up here.</p>';
    };
    var waits = 0, done = function () { if (--waits <= 0) draw(); };
    if (svState !== 'loaded') { waits++; loadSaves(done); }
    if (sec[2] === 'episode' && !gvLoaded) { waits++; loadGVotes(done); }
    if (!waits) draw();
  }

  // ---------- Get access ----------
  function viewJoin() {
    if (member()) {
      main.innerHTML = head('Your Guide', 'The whole Guide is yours', (ST.via === 'purchase' ? 'You unlocked it, and it is yours to keep.' : 'It is yours to keep.') + ' Thank you for being here.') + '<a class="dg-btn" href="#/">Back to the overview</a>'; return;
    }
    var m = mode(), status = '<span class="dg-status" role="status" style="display:block;margin-top:10px;color:#8a5a00"></span>', box;
    var list = '<div class="dg-access"><ul>' +
      '<li><b>The fixes</b>, every one with what to do this week, in the order your audit puts them.</li>' +
      '<li><b>The Restaurant Pulse:</b> our interviews with business owners, and the research, every fact sourced.</li>' +
      '<li><b>Get featured and Promotions:</b> how to get to the top of the Directory, and what we run that brings members in.</li>' +
      '<li><b>The quiz</b> and the Entrepreneur Track badge, and My list to keep your place.</li></ul></div>';
    var passport = '<p class="dg-pp">Or get <a href="/passport">Passport</a>: a new Guide credit every month.</p>';
    if (m === 'unlock') box = '<div class="dg-big">1<small>credit</small></div><p>You have ' + credits(ST.credits) + '. Unlock the Guide and it is yours to keep.</p><button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button>' + status;
    else if (m === 'buy') box = '<div class="dg-big">$11<small>yours to keep</small></div><p>You have no Guide credits right now. Get it now for $11, one time.</p><button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button>' +
      (canExchange() ? '<button type="button" class="dg-btn dg-ghost" data-exchange style="margin-top:8px">Use ' + pts(ST.rate) + ' points for a credit</button><p class="dg-pp">You have ' + pts(ST.balance) + ' points.</p>' : '') + status + passport;
    else box = '<div class="dg-big">$11<small>one time</small></div><p>' + (m === 'activate' ? 'Your account is not a Founding Member yet. Become one: $11, one time, and your first Guide credit comes with it.'
      : 'Join for $11, one time, and your first Guide credit comes with it: unlock this Guide or any other. Already a member? <a href="#" data-signin>Sign in</a>.') + '</p><button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button>' + status + passport;
    main.innerHTML = head('Get access', 'Open the whole Restaurant Guide', 'Every Vegans Explore Guide is $11 or 1 Guide credit, and yours to keep. The free check in Your audit stays free for everyone.') + list;
    main.querySelector('.dg-access').insertAdjacentHTML('beforeend', '<div class="dg-pricebox">' + box + '</div>');
  }

  // ---------- Overview ----------
  function viewOverview() {
    var tiles = [
      ['audit', 'Your audit', 'A free check of your Google listing, website, search and social, and a list of what to fix right away.', 1],
      ['fixes', 'The fixes', 'What closes Vegan restaurants, and what to do instead, in the order your audit puts them.'],
      ['pulse', 'Pulse', 'Our interviews with business owners, and the research behind them.'],
      ['featured', 'Get featured', 'How the Directory works, and how a restaurant gets to the top of it.', 1],
      ['promos', 'Promotions', 'The campaigns, events, features and ads that bring members through your door.', 1],
      ['quiz', 'Test yourself', 'The quiz, and the Entrepreneur Track badge.']
    ];
    main.innerHTML = head('Vegans Explore Guides for business', 'Keep your Vegan restaurant open, and full',
      'What may be quietly hurting your restaurant, and how to fix it. Start with the free check: everything else lines up around what it finds.') +
      '<div class="dg-tiles">' + tiles.map(function (t) {
        return '<a class="dg-tile' + (t[0] === 'audit' ? ' dg-warm' : '') + '" href="' + href(t[0]) + '"><div class="dg-ic">' + ICON[t[0]] + '</div><div><b>' + esc(t[1]) + '</b><span>' + esc(t[2]) + '</span>' +
          (!member() && !t[3] ? '<span class="dg-mlock">' + LOCK_SVG + ' In the full Guide</span>' : !member() && t[0] === 'audit' ? '<span class="dg-mlock" style="color:#1f5f22 !important">Free</span>' : '') + '</div></a>';
      }).join('') + '</div>' +
      '<div class="dg-start">' + (TOUR.started ? '' : '<button type="button" class="dg-btn" data-tour-start>&#9654; Start the tour</button>') + '<a class="dg-btn dg-ghost" href="#/audit">Run my free check</a>' +
      (member() ? '<p>The whole Guide is yours. Pick a tab, or let Liz walk you through it.</p>' : '<p>The full Guide is $11 or 1 Guide credit. <a href="#/join" style="color:var(--g);font-weight:800">How to get access</a></p>') + '</div>';
  }

  // ---------- search (members) ----------
  function index() {
    var out = [];
    PUB.why.concat(MEM ? MEM.why : []).forEach(function (w) { out.push({ t: 'Pulse', title: w.title, text: w.text, href: '#/pulse/research' }); });
    if (!MEM) return out;
    allFixes().forEach(function (f) { out.push({ t: 'The fixes', title: f.title, text: [f.problem].concat(f.list || []).concat([f.action]).join(' '), href: '#/fixes/' + f.id }); });
    (PODS || []).forEach(function (p) { out.push({ t: 'Pulse', title: p.title, text: (p.podcast_show || '') + '. ' + (p.summary || ''), href: '#/pulse/watch/' + encodeURIComponent(p.slug) }); });
    PROMOS.forEach(function (p) { out.push({ t: 'Promotions', title: p.t, text: p.what + ' ' + p.why, href: '#/promos/' + p.k }); });
    return out;
  }
  function viewSearch(q) {
    if (qEl.value !== q) qEl.value = q;
    var words = q.toLowerCase().split(/\s+/).filter(Boolean);
    var hits = index().filter(function (h) { var hay = (h.title + ' ' + h.text).toLowerCase(); return words.every(function (w) { return hay.indexOf(w) >= 0; }); });
    var groups = {}; hits.forEach(function (h) { (groups[h.t] = groups[h.t] || []).push(h); });
    var html = crumb([['Search']]) + '<h2 class="dg-h1">' + hits.length + (hits.length === 1 ? ' result' : ' results') + ' for &ldquo;' + esc(q) + '&rdquo;</h2><div class="dg-res">';
    ['The fixes', 'Pulse', 'Promotions'].forEach(function (g) {
      if (!groups[g]) return;
      html += '<h2>' + esc(g) + ' (' + groups[g].length + ')</h2><div class="dg-grid">' + groups[g].slice(0, 24).map(function (h) {
        return '<a class="dg-card dg-hit" href="' + h.href + '"><h3>' + esc(h.title) + '</h3><p>' + esc(h.text.length > 160 ? h.text.slice(0, 157) + '...' : h.text) + '</p></a>';
      }).join('') + '</div>';
    });
    if (!hits.length) html += '<p class="dg-empty">Nothing matched. Try reviews, photos, hours or Instagram.</p>';
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

  // ---------- Liz, on the right of every tab ----------
  var TOUR = { started: false, playing: false, paused: false, shown: null };
  var tourM = document.getElementById('dgTourM'), foldBtn = document.getElementById('dgFold'), railEl = document.getElementById('dgRail');
  function setFold(folded) {
    railEl.classList.toggle('dg-folded', folded);
    foldBtn.textContent = folded ? 'Show Liz' : 'Hide Liz'; foldBtn.setAttribute('aria-expanded', String(!folded));
    try { sessionStorage.setItem('rg_liz_folded', folded ? '1' : ''); } catch (e) {}
  }
  foldBtn.addEventListener('click', function () {
    var folded = !railEl.classList.contains('dg-folded');
    if (folded && TOUR.playing) { TOUR.paused = true; stopLiz(); drawLiz(); }
    setFold(folded);
  });
  try { if (sessionStorage.getItem('rg_liz_folded')) setFold(true); } catch (e) {}
  var lizBox = document.getElementById('dgMaya'), bubble = document.getElementById('dgBubble'), playBtn = document.getElementById('dgPlay'), tourEl = document.getElementById('dgTour');
  var vid = document.createElement('video');
  vid.preload = 'metadata'; vid.playsInline = true; vid.setAttribute('playsinline', '');
  vid.setAttribute('aria-label', 'Liz, your Guide');
  function clip(k) { if (member() && CLIPS_M[k]) return CLIPS_M[k]; return k === 'join' && mode() === 'unlock' ? CLIPS.join_credit : CLIPS[k] || null; }
  function cueLiz(k) {
    var c = clip(k), key = k + (member() ? ':m' : '') + (k === 'join' && mode() === 'unlock' ? ':c' : '');
    if (TOUR.shown === key) return;
    TOUR.shown = key; stopLiz();
    if (c) {
      vid.poster = c.poster; vid.src = c.video;
      if (!vid.parentNode) lizBox.appendChild(vid);
      vid.style.display = '';
    } else { vid.removeAttribute('src'); vid.load(); vid.style.display = 'none'; }
    lizBox.classList.remove('dg-shift'); void lizBox.offsetWidth; lizBox.classList.add('dg-shift');
  }
  function playLiz() {
    if (!clip(curTab)) { drawLiz(); return; }
    // The first page's poster is the open smile; once she talks, the clip starts from her own first frame.
    vid.play().then(function () { TOUR.playing = true; drawLiz(); }).catch(function () { TOUR.playing = false; drawLiz(); });
  }
  function stopLiz() { vid.pause(); TOUR.playing = false; }
  function startTour() {
    TOUR.started = true; TOUR.paused = false;
    [].forEach.call(document.querySelectorAll('[data-tour-start]'), function (b) { b.remove(); });
    playLiz();
  }
  vid.addEventListener('ended', function () { TOUR.playing = false; drawLiz(); });
  vid.addEventListener('click', function () { if (!TOUR.started) return startTour(); if (TOUR.playing) { TOUR.paused = true; stopLiz(); drawLiz(); } else { TOUR.paused = false; playLiz(); } });
  playBtn.addEventListener('click', function () { if (!TOUR.started) return startTour(); if (TOUR.playing) { TOUR.paused = true; stopLiz(); } else { TOUR.paused = false; playLiz(); } drawLiz(); });
  function drawLiz() {
    var t = tab(curTab), list = tabs(), i = 0;
    list.forEach(function (x, n) { if (x.k === curTab) i = n; });
    bubble.textContent = member() && t.sayMember ? t.sayMember : t.k === 'join' && mode() === 'unlock' ? t.sayCredit : t.say;
    var has = !!clip(curTab);
    playBtn.hidden = TOUR.started && !has;
    playBtn.classList.toggle('go', !TOUR.started);
    playBtn.innerHTML = !TOUR.started ? '&#9654; Start the tour' : TOUR.playing ? 'Pause Liz' : '&#9654; Watch Liz';
    tourEl.innerHTML = tourM.innerHTML = '<a class="dg-tnav" href="' + href(list[Math.max(0, i - 1)].k) + '"' + (i ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Back</a><span>' + (i + 1) + ' of ' + list.length + '</span>' +
      '<a class="dg-tnav next" href="' + href(list[Math.min(list.length - 1, i + 1)].k) + '"' + (i < list.length - 1 ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Next</a>';
  }

  // ---------- router ----------
  function route() {
    var parts = (location.hash || '').replace(/^#\/?/, '').split('/');
    var view = parts[0] || 'overview', sub = parts.slice(1).join('/');
    if (view === 'search' && (!sub || !member())) view = 'overview';
    var known = { overview: 1, audit: 1, fixes: 1, pulse: 1, featured: 1, promos: 1, quiz: 1, mylist: 1, join: 1, search: 1 };
    if (!known[view]) view = 'overview';
    document.body.classList.toggle('dg-member', member());
    drawJoinbox();
    var key = view;
    if (view === 'search') key = curTab;
    if (view === 'join' && member()) key = 'overview';
    if (view === 'mylist' && !member()) { view = 'overview'; key = 'overview'; }
    if (member() && !svState) loadSaves();
    drawMenu(view === 'search' ? 'search' : key);
    if (view !== 'search' && qEl.value && document.activeElement !== qEl) qEl.value = '';
    if (view !== 'audit') auditView++;
    ({ overview: viewOverview, audit: function () { viewAudit(sub); }, fixes: function () { viewFixes(sub); }, pulse: function () { viewPulse(sub); },
       featured: function () { viewFeatured(sub); }, promos: function () { viewPromos(sub); }, quiz: function () { viewQuiz(sub); },
       mylist: function () { viewMyList(sub); }, join: viewJoin, search: function () { viewSearch(decodeURIComponent(sub)); } })[view]();
    var moved = key !== curTab;
    curTab = key;
    cueLiz(key);
    if (moved && TOUR.started && !TOUR.paused) playLiz();
    drawLiz();
    if (view !== 'search') { main.scrollTop = 0; if (!document.documentElement.classList.contains('dg-fit') || window.innerWidth <= 900) window.scrollTo(0, 0); }
  }
  window.addEventListener('hashchange', route);

  // ---------- access ----------
  function api(action, tok) {
    return fetch(UNLOCK_URL + '?action=' + action, { method: 'POST', headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: SLUG, token: tok || undefined }) })
      .then(function (r) { return r.json(); });
  }
  function rest(url) { return fetch(url, { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } }).then(function (r) { return r.json(); }); }
  function becomeMember(html) {
    var t = document.createElement('template'); t.innerHTML = html;
    var el = t.content.getElementById('rg-data');
    MEM = el ? JSON.parse(el.textContent) : null;
    access = MEM ? 'member' : 'pending';
    route();
  }
  function loadPublic() {
    Promise.all([rest(PULSE_URL).catch(function () { return []; }), rest(TOP_URL).catch(function () { return []; })]).then(function (r) {
      var pods = Array.isArray(r[0]) ? r[0] : [];
      PODS = PULSE_PICKS.map(function (s) { return pods.filter(function (p) { return p.slug === s; })[0]; }).filter(Boolean);
      TOP = Array.isArray(r[1]) ? r[1] : [];
      if (curTab === 'pulse' || curTab === 'featured') route();
    });
  }
  function setStatus(msg) { [].forEach.call(document.querySelectorAll('.dg-status'), function (e) { e.textContent = msg; }); }

  document.addEventListener('click', function (e) {
    var a = auth(), el;
    if (e.target.closest('[data-tour-start]')) { startTour(); drawLiz(); return; }
    if ((el = e.target.closest('[data-pick]'))) { runFree({ listing_slug: el.getAttribute('data-pick') }); return; }
    if ((el = e.target.closest('[data-buy]'))) { buyAudit(el); return; }
    if ((el = e.target.closest('[data-ans]'))) {
      var p = el.getAttribute('data-ans').split(':'); ANS[+p[0]] = +p[1]; keepAns();
      [].forEach.call(el.parentNode.querySelectorAll('[data-ans]'), function (b) { b.setAttribute('aria-pressed', String(b === el)); });
      var nx = document.getElementById('rgQNext'); if (nx) { nx.removeAttribute('aria-disabled'); nx.style.opacity = ''; nx.style.pointerEvents = ''; }
      return;
    }
    if (e.target.closest('[data-retake]')) { ANS = {}; keepAns(); return; }
    if ((el = e.target.closest('[data-done]'))) {
      var d = doneSet(), id = el.getAttribute('data-done'); if (d[id]) delete d[id]; else d[id] = 1; store('rg_fixes_done', JSON.stringify(d)); route(); return;
    }
    if ((el = e.target.closest('[data-save]'))) {
      e.preventDefault(); e.stopPropagation();
      var kk = el.getAttribute('data-save'), i = kk.indexOf(':'), kind = kk.slice(0, i), key = kk.slice(i + 1), on = !SV[kind][key];
      if (on) { SV[kind][key] = 1; SV_ORDER.unshift({ kind: kind, key: key }); } else { delete SV[kind][key]; SV_ORDER = SV_ORDER.filter(function (x) { return !(x.kind === kind && x.key === key); }); }
      paintSaves();
      cookApi({ action: 'save', kind: kind, key: key, on: on }).then(function (r) { if (!r || !r.ok) throw r; }).catch(function () {
        if (on) delete SV[kind][key]; else SV[kind][key] = 1; paintSaves();
      });
      return;
    }
    if ((el = e.target.closest('[data-gvote]'))) {
      e.preventDefault(); e.stopPropagation();
      var key2 = el.getAttribute('data-gvote').split(':')[1], on2 = !GV.mine.episode[key2];
      cookApi({ action: 'gvote', kind: 'episode', key: key2, on: on2 }).then(function (r) {
        if (!r || !r.ok) return;
        if (on2) GV.mine.episode[key2] = 1; else delete GV.mine.episode[key2];
        GV.counts.episode[key2] = r.count;
        el.classList.toggle('on', on2); el.setAttribute('aria-pressed', String(on2)); el.querySelector('b').textContent = r.count;
      });
      return;
    }
    if ((el = e.target.closest('.dg-srow[data-href]')) && !e.target.closest('a,button')) { location.hash = el.getAttribute('data-href'); return; }
    if (e.target.closest('[data-signin]')) {
      e.preventDefault();
      if (a) a.showAuthModal('Sign in and the Restaurant Guide opens if it is yours.', function () { location.reload(); }, 'login');
      return;
    }
    if ((el = e.target.closest('[data-exchange]'))) { e.preventDefault(); exchange(el); return; }
    var jb = e.target.closest('[data-join]');
    if (jb) {
      if (!a || access === 'checking' || jb.disabled) return;
      stopLiz(); drawLiz();
      var m = mode();
      if (m === 'join') a.showAuthModal('Create your account. Then become a Founding Member: $11, and your first Guide credit comes with it.', function () { location.reload(); }, 'signup');
      else if (m === 'activate') a.showActivateModal('Become a Founding Member: $11, one time. Your first Guide credit comes with it, and the full community.');
      else if (m === 'unlock') unlock(jb);
      else buyNow(jb);
    }
  });
  function unlock(btn) {
    var tok = token(); if (!tok) return;
    btn.disabled = true; btn.textContent = 'Unlocking...';
    api('unlock', tok).then(function (d) {
      if (d && d.unlocked) return api('open', tok).then(function (o) { take(o); if (o && o.unlocked && o.html) becomeMember(o.html); else throw 0; });
      if (d && d.error === 'no_credit') { ST.credits = 0; route(); return; }
      throw 0;
    }).catch(function () { btn.disabled = false; btn.textContent = ctaLabel(); setStatus('That did not go through, and no credit was used. Try again in a minute.'); });
  }
  function exchange(el) {
    var tok = token(); if (!tok || el.getAttribute('aria-busy')) return;
    el.setAttribute('aria-busy', 'true'); el.textContent = 'Turning points into a credit...';
    api('exchange', tok).then(function (d) {
      if (d && d.ok) { ST.credits = d.credits; ST.balance = d.balance; location.hash = '#/join'; route(); setStatus('You have a Guide credit now. Unlock the Guide with it.'); return; }
      throw 0;
    }).catch(function () { el.removeAttribute('aria-busy'); route(); setStatus('That did not go through, and no points were spent. Try again in a minute.'); });
  }
  function buyNow(btn) {
    var tok = token(); if (!tok) return;
    btn.disabled = true; btn.textContent = 'Opening checkout...';
    fetch(UNLOCK_URL + '?action=checkout', { method: 'POST', headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, token: tok, return_url: location.origin + location.pathname }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.url) { (window.top || window).location.href = d.url; return; } if (d && d.already) { location.reload(); return; } throw 0; })
      .catch(function () { btn.disabled = false; btn.textContent = ctaLabel(); setStatus('Checkout did not open. Try again in a minute.'); });
  }
  function confirmAfterCheckout(tok, tries, what) {
    setStatus(what === 'guide' ? 'Opening your Guide...' : 'Confirming your membership...');
    access = 'pending';
    api('open', tok).then(function (d) {
      take(d);
      if (d && d.unlocked && d.html) { setStatus(''); becomeMember(d.html); return; }
      if (what === 'activate' && ST.active && ST.credits >= 1) { location.hash = '#/join'; route(); setStatus('Welcome in! Your Guide credit is here. Unlock the Guide with it.'); return; }
      if (tries > 0) { setTimeout(function () { confirmAfterCheckout(tok, tries - 1, what); }, 2500); return; }
      route(); setStatus('Your payment went through. It can take a minute to show here: refresh this page shortly.');
    }).catch(function () { if (tries > 0) setTimeout(function () { confirmAfterCheckout(tok, tries - 1, what); }, 2500); else route(); });
  }

  function init() {
    if (window.VERegionDirectory) VERegionDirectory.css();
    document.documentElement.classList.add('dg-fit');
    if (window.VEGuideArt) { var art = VEGuideArt('liz', 'square'); if (art) lizBox.style.backgroundImage = "url('" + art + "')"; }
    var params = new URLSearchParams(location.search), auditBack = params.get('audit');
    if (auditBack) {
      params.delete('audit'); history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash);
      setTimeout(function () { setStatus(auditBack === 'paid' ? 'Thank you. Your full audit is running, and we emailed you a copy of the link.' : auditBack === 'cancelled' ? 'Checkout was cancelled. Nothing was charged.' : ''); }, 1200);
    }
    route();
    loadPublic();
    var a = auth(), viewAs = a && a.getViewAs ? a.getViewAs() : null;
    var tok = a && a.isLoggedIn() && !viewAs ? a.getToken() : null;
    if (!tok) { access = viewAs && viewAs.mode !== 'public' ? 'pending' : 'guest'; route(); api('status').then(function (d) { take(d); route(); }).catch(function () {}); return; }
    var back = params.get('activate') ? 'activate' : params.get('guide') ? 'guide' : null, val = back && params.get(back);
    if (back) { params.delete(back); history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash); }
    if (val === 'success' || val === 'bought') { confirmAfterCheckout(tok, 8, back); return; }
    if (back === 'guide' && val === 'cancelled') setTimeout(function () { setStatus('Checkout was cancelled. Nothing was charged.'); }, 1500);
    api('open', tok).then(function (d) {
      take(d);
      if (d && d.unlocked && d.html) becomeMember(d.html);
      else { access = d && d.loggedIn ? 'pending' : 'guest'; route(); }
    }).catch(function () { access = 'pending'; route(); setStatus('We could not check your access just now. Refresh to try again.'); });
  }

  if (window.VEAuth) init(); else window.addEventListener('load', init);
})();
