/* The Creator Guide (Sean 2026-10-29, canon canon-ve-ambassadors-talent-shop, playbook ve-ambassadors-talent-shop; built on the
 * Nonprofit Guide's files, docs/guides/BUILD-A-GUIDE.md).
 *
 * For Vegan content creators going from hobbyist to professional. The knowledge is Sean's Vegan Content Creator Survival Guide (Canva
 * DAGx86FyHyw, "Top 10 Moves to Evolve From Hobbyist to Professional Vegan Creator"); the creators in our Directory and our creator
 * episodes are built in, and it ends on the next step: the Ambassador program. The tabs are the tour; River stays on the right of
 * every tab (his lines show as text, no clips). The address bar carries the view (#/tips/flow, #/people/youtube, #/pulse/craft).
 *
 *   Overview       what the Guide is and what each tab holds
 *   The 10 tips    one per view: the principle, In Action (a real creator), This week (the three action items, ticked in the
 *                  browser), On Vegans Explore and an episode. Tip 1 (purpose) is open to everyone, the free example
 *   People         People > Content Creators and the Directory's YouTube channels, with the Directory's own card
 *   Pulse          our episodes with creators, played in place (PULSE_PICKS, ve-podcast)
 *   Your next step become an Ambassador: invitation only, one program by results (canon-ve-ambassadors-talent-shop)
 *   My list        members: saved tips, episodes and creators (ve_guide_saves through ve-cookbook: fix, episode, listing)
 *   Get access     visitors: $11 or 1,100 points
 *
 * Access is every Guide's: ve-guide-unlock for this slug decides; an active Ambassador has it (via 'ambassador').
 * The members-only text (tips 2 to 10) is ve_guides.content_html, handed out only to its owners. Never add it to this repo.
 * Two changes from the Canva: tip 3's example is Pick Up Limes (Gaz Oakley is no longer Vegan), and its closing survey and
 * free-trial offer are left out.
 */
(function () {
  var SLUG = 'creator-guide';
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var UNLOCK_URL = SB + '/functions/v1/ve-guide-unlock';
  var COOK_URL = SB + '/functions/v1/ve-cookbook';
  var PODCAST_FN = SB + '/functions/v1/ve-podcast';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var FIELDS = window.VERegionDirectory ? VERegionDirectory.FIELDS : 'id,slug,name,category,logo_url,vote_count,address_city,address_state,color,vegan_status,communities,tags,extra_categories';
  var CR_CATS = ['Content Creators', 'YouTube'];
  var CREATORS_URL = SB + '/rest/v1/listings?select=' + FIELDS + '&status=eq.approved&or=(category.in.(' + CR_CATS.map(encodeURIComponent).join(',') + '),extra_categories.ov.{' + CR_CATS.map(function (c) { return '"' + encodeURIComponent(c) + '"'; }).join(',') + '})&order=vote_count.desc.nullslast,name.asc&limit=1000';

  // Our episodes with creators, in this order, as their podcast episodes: [ve_pulse_content slug, the show's Directory slug, the
  // episode's guid in that show's feed (ve_podcast_feeds), group]. Matched to the feed 2026-10-29. A new one is a row here.
  var PULSE_PICKS = [
    ['jason-kartalian-vegan-hacks-content', 'vegans-explore-podcast', '370b293c-61ee-45f8-8f0d-e12aaa8f67b6', 'building'],
    ['from-zero-to-youtube-star-alex-yabonks-path-in-veganism-and-animal-advocacy-vegans-who-lift-podcast', 'vegans-who-lift-podcast', '08d4dded-ea4b-4322-9e56-ae49a524a3af', 'building'],
    ['vegan-kween-keya-philly-guide', 'vegans-explore-podcast', '6b69fb7d-da34-43ce-8837-adcb40da4a39', 'building'],
    ['john-lewis-badass-vegan-book-natureaid', 'vegans-explore-podcast', '9b87c237-6b29-42f9-8002-2dae81dcaada', 'building'],
    ['john-lewis-badass-vegan-returns-soflo-vegans-podcast', 'soflo-vegans-podcast', 'e9ea10f9-ef41-4425-9ea6-06705ef38816', 'building'],
    ['jane-velez-mitchell-unchained-broadcast-animal-activism', 'vegans-explore-podcast', '3d36a143-e014-4059-915d-d61c70e6cb04', 'building'],
    ['plant-chicks-marcia-prince-jackie-tarleton-ep016-soflo-vegans-podcast', 'soflo-vegans-podcast', 'tag:soundcloud,2010:tracks/611830473', 'building'],
    ['vegan-documentary-directors-panel-films-change-world', 'vegans-explore-podcast', '3cdcbc52-8cd0-4b0e-9327-202fd8d47039', 'craft'],
    ['how-feldi-uses-music-to-fight-for-animal-rights-veganism-s5e5-vegans-who-lift-podcast', 'vegans-who-lift-podcast', '36360d68-51a0-445f-97b0-e0666c3831ec', 'craft'],
    ['plantbased-in-the-burbs-with-sherri-and-paige-soflo-vegans-podcast', 'soflo-vegans-podcast', '30115d30-ca1a-4e39-8b0e-ff0d0794e057', 'craft'],
    ['sustainable-duo-zero-waste-living-ep010-soflo-vegans-podcast', 'soflo-vegans-podcast', 'tag:soundcloud,2010:tracks/575602338', 'craft'],
    ['alex-lenghel-massive-vegan-and-making-the-ethical-choice-soflo-vegans-podcast', 'soflo-vegans-podcast', '68a5452a-dd85-4ab4-831e-9ac905175f5a', 'craft'],
    ['jonny-juicer-raw-vegan-lifestyle-ep019-soflo-vegans-podcast', 'soflo-vegans-podcast', 'tag:soundcloud,2010:tracks/705551881', 'craft']
  ];
  var SHOW_SLUGS = PULSE_PICKS.map(function (x) { return x[1]; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
  var SHOWS_URL = SB + '/rest/v1/listings?select=id,slug,name,logo_url&status=eq.approved&slug=in.(' + SHOW_SLUGS.join(',') + ')';
  var PULSE_URL = SB + '/rest/v1/ve_pulse_content?select=slug,title,podcast_show,summary,published_at&status=eq.published&slug=in.(' + PULSE_PICKS.map(function (x) { return x[0]; }).join(',') + ')';

  // The tabs, in tour order, and what River says on each (text drafts for Sean; no recordings yet). `say` is for visitors (why get
  // it), `sayMember` walks an owner through what they have.
  var TABS = [
    { k: 'overview', label: 'Overview', say: 'Hey, I\'m River. This Guide is for Vegan creators ready to go from hobby to professional: ten moves, the people doing it, and where it can take you.',
      sayMember: 'Welcome in. Start with the ten tips, one this week, then look at who\'s doing it and where you go next.' },
    { k: 'tips', label: 'The 10 tips', lock: 1, say: 'Ten moves, each with a real Vegan creator doing it and three things you can start today. Your purpose and niche is open for you to try.',
      sayMember: 'Here are all ten. Each has three action items for this week. Tick them off as you go, and save the ones you\'re working on.' },
    { k: 'people', label: 'People doing it', say: 'These are the creators and channels in our Directory. See how they show up, and vote for the ones you watch.',
      sayMember: 'Study the creators in your lane: how they title things, how often they post, who they work with. Save the ones you learn from.' },
    { k: 'pulse', label: 'Pulse', lock: 1, say: 'Our conversations with creators: how they built a following, made a living and kept going. Play them right here.',
      sayMember: 'Every creator conversation we\'ve recorded lives here. Start with how they built it, then the craft.' },
    { k: 'next', label: 'Your next step', say: 'When you\'re ready, the next step is becoming an Ambassador. It\'s by invitation, and you grow by what you do.',
      sayMember: 'When you\'re ready, the next step is becoming an Ambassador. Tell us about you, and we\'ll be in touch.' },
    { k: 'mylist', label: 'My list', mine: 1, say: 'Everything you saved lives here: tips, episodes and creators.' },
    { k: 'join', label: 'Get access', guest: 1, say: 'The Creator Guide is eleven dollars, or 1,100 points, and it\'s yours to keep. Buying it makes you a member of Vegans Explore.' }
  ];
  var S = 'stroke="#1f5f22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  var TIP_ICON = {
    purpose: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    story: '<path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12h5"/>',
    flow: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h2M12 14h2M16 14h2"/>',
    grow: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    money: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5v1.5M12 16v1.5"/>',
    community: '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2 20c1-3.5 3.5-5 6-5s5 1.5 6 5M12 20c.6-2.4 2-4 4-5 2.5 0 5 1.5 6 5"/>',
    data: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    energy: '<path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/>',
    scale: '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9h18M9 20v-6h6v6"/>',
    movement: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>'
  };
  function tipIcon(id, size) { return '<svg width="' + (size || 34) + '" height="' + (size || 34) + '" viewBox="0 0 24 24" fill="none" ' + S + ' aria-hidden="true">' + (TIP_ICON[id] || TIP_ICON.purpose) + '</svg>'; }
  function ic(path) { return '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + '>' + path + '</svg>'; }
  var ICON = {
    tips: ic('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/>'),
    people: ic('<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>'),
    pulse: ic('<path d="M3 12h4l2-6 4 12 2-6h6"/>'),
    next: ic('<path d="M3 10v4h3l7 5V5L6 10z"/><path d="M17 9a4 4 0 010 6"/>')
  };
  var LOCK_SVG = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';
  var HEART = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>';
  var BOOKMARK = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 3h12a1 1 0 011 1v17l-7-4.5L5 21V4a1 1 0 011-1z"/></svg>';

  var main = document.getElementById('dgMain');
  var menuEl = document.getElementById('dgMenu'), menuSel = document.getElementById('dgMenuSelect');
  var qEl = document.getElementById('dgQ');
  var PUB = JSON.parse(document.getElementById('cg-public').textContent);

  var access = 'checking';       // checking | guest | pending | member
  var MEM = null;                // members-only payload (tips 2 to 10)
  var ST = { rule: 'points', cost: 1100, balance: 0, active: false, via: null };
  var PODS = null, CREATORS = null;
  var curTab = 'overview';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function auth() { return window.VEAuth || null; }
  function token() { var a = auth(); return a && a.isLoggedIn && a.isLoggedIn() ? a.getToken() : null; }
  function member() { return access === 'member'; }
  function tabs() { return TABS.filter(function (t) { return !(t.guest && member()) && !(t.mine && !member()); }); }
  function tab(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i].k === k) return TABS[i]; return TABS[0]; }
  function href(k) { return '#/' + (k === 'overview' ? '' : k); }
  function store(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function recall(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function pts(n) { return Number(n || 0).toLocaleString('en-US'); }
  function rest(url) { return fetch(url, { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } }).then(function (r) { return r.json(); }); }

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
    return '<div class="dg-crumb"><a href="#/">Creator Guide</a>' + parts.map(function (p) { return ' &rsaquo; ' + (p[1] ? '<a href="' + p[1] + '">' + esc(p[0]) + '</a>' : esc(p[0])); }).join('') + '</div>';
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
  function row(o) {
    return '<div class="dg-srow"' + (o.href ? ' data-href="' + o.href + '"' : '') + '>' + (o.icon ? '<span class="dg-th rg-th" aria-hidden="true">' + o.icon + '</span>' : '') +
      '<div class="dg-srow-b">' + (o.pre || '') + '<h3>' + (o.href ? '<a href="' + o.href + '">' + esc(o.title) + '</a>' : esc(o.title)) + '</h3>' + (o.body || '') + '</div>' +
      (o.acts ? '<div class="dg-acts">' + o.acts + '</div>' : '') + '</div>';
  }

  // ---------- the offer: $11 or 1,100 points ----------
  function mode() {
    if (access === 'guest' || access === 'checking') return 'join';
    return ST.balance >= ST.cost ? 'points' : 'buy';
  }
  function ctaLabel() { return { join: 'Get it for $11', points: 'Unlock with ' + pts(ST.cost) + ' points', buy: 'Get it for $11' }[mode()]; }
  function offerLine() {
    if (mode() === 'points') return 'Unlock it with ' + pts(ST.cost) + ' points: you have ' + pts(ST.balance) + '. Or get it for $11.';
    return 'It is $11, or ' + pts(ST.cost) + ' points, and yours to keep. Buying it makes you a member of Vegans Explore.';
  }
  function ctaBtns() {
    var m = mode();
    return '<div class="dg-btns"><button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button>' +
      (m === 'join' ? '<a href="#" data-signin>Already a member? Sign in</a>' : '') +
      (m === 'points' ? '<a href="#" data-buy>Or get it for $11</a>' : '') +
      (m === 'buy' ? '<a href="/passport">Or get your Passport: $11 with 1,100 points</a>' : '') + '</div>';
  }
  function take(d) {
    if (!d || d.error) return;
    if (d.access_rule) ST.rule = d.access_rule;
    if (d.cost) ST.cost = d.cost;
    ST.balance = d.balance || 0; ST.active = d.membership_status === 'active'; ST.via = d.via || null;
  }
  function drawJoinbox() {
    var box = document.querySelector('.dg-joinbox'); if (!box || member()) return;
    box.querySelector('[data-join]').textContent = ctaLabel();
    box.querySelector('.dg-jb-in').style.display = mode() === 'join' ? '' : 'none';
  }

  // ---------- saves and votes (ve-cookbook, the Guide's own lists) ----------
  function cookApi(body) {
    var tok = token(), h = { 'Content-Type': 'application/json' };
    if (tok) h.Authorization = 'Bearer ' + tok;
    body.guide = SLUG;
    return fetch(COOK_URL, { method: 'POST', headers: h, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  // Saves: a tip is kind fix (a move to work on), an episode, a Directory listing (a creator or channel).
  var SV = { fix: {}, episode: {}, listing: {} }, SV_ORDER = [], svState = '', svWait = [];
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
      if (d && d.counts) { GV.counts = d.counts; GV.mine = { episode: {} }; (d.mine.episode || []).forEach(function (x) { GV.mine.episode[x] = 1; }); }
      // Tried once, even when it failed: the view redraws after this, and must not ask again (a redraw drops a playing episode).
      gvLoaded = true;
      if (then) then();
    }).catch(function () { gvLoaded = true; if (then) then(); });
  }
  function gvCount(key) { return (GV.counts.episode || {})[key] || 0; }
  function gvoteBtn(key) {
    var on = !!GV.mine.episode[key];
    return '<button type="button" class="dg-vote dg-vote-s' + (on ? ' on' : '') + '" data-gvote="episode:' + esc(key) + '" aria-pressed="' + on + '" title="' + (on ? 'You voted for this' : 'Vote for this') + '">' + HEART + '<b>' + gvCount(key) + '</b></button>';
  }

  // ---------- Directory cards ----------
  function cards(list, gridId) {
    return '<div class="vrd-root"><div class="rank-grid" id="' + gridId + '">' + list.map(function (l, i) { return window.VERegionDirectory ? VERegionDirectory.card(l, i) : ''; }).join('') + '</div></div>';
  }
  function wireCards(gridId, back) {
    var g = document.getElementById(gridId);
    if (!g || !window.VERegionDirectory) return;
    VERegionDirectory.wire(g, function (slug) { location.hash = back + '/listing/' + encodeURIComponent(slug); });
    if (member()) [].forEach.call(g.querySelectorAll('.rank-card[data-slug]'), function (card) {
      var right = card.querySelector('.rank-right'); if (!right || right.querySelector('[data-save]')) return;
      right.insertAdjacentHTML('beforeend', saveBtn('listing', card.getAttribute('data-slug')));
    });
  }
  // A Directory page inside the Guide, framed and sized to fit.
  function viewListing(slug, back) {
    main.innerHTML = crumb([[back[0], back[1]], ['Directory page']]) +
      '<div class="dg-btns" style="margin-bottom:12px"><a class="dg-btn dg-ghost" href="/directory/' + encodeURIComponent(slug) + '">Open the page</a></div>' +
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

  // ---------- the 10 tips ----------
  function allTips() {
    var byId = {}; (MEM ? MEM.tips : []).forEach(function (t) { byId[t.id] = t; }); byId[PUB.tip_example.id] = PUB.tip_example;
    return PUB.titles.map(function (t) { return byId[t[0]] || { id: t[0], title: t[1], locked: 1 }; });
  }
  function checks() { try { return JSON.parse(recall('cg_checks') || '{}'); } catch (e) { return {}; } }
  function tipDone(t, c) { return t.week && t.week.length && t.week.every(function (x, i) { return c[t.id + ':' + i]; }); }
  var LOCKED_LINE = 'Storytelling, a steady content flow, smart marketing, earning without selling out, community, data, protecting your energy, going full time and staying true to the movement.';
  function viewTips(id) {
    if (id) return viewTip(id);
    var list = allTips(), c = checks();
    var tiles = list.map(function (t, i) {
      var open = !t.locked;
      return row({ icon: tipIcon(t.id), title: (i + 1) + '. ' + t.title, href: open ? '#/tips/' + t.id : '',
        pre: (tipDone(t, c) ? '<span class="rg-done" style="margin-left:0">Done this week</span>' : '') + (!member() && t.id === PUB.tip_example.id ? '<span class="dg-free">Free to try</span>' : ''),
        body: open ? '<p class="dg-srow-p">' + esc(t.lesson) + '</p>' : '<p class="dg-srow-p">' + LOCK_SVG + ' In the full Guide</p>',
        acts: member() ? saveBtn('fix', t.id) : '' });
    }).join('');
    main.innerHTML = head('The 10 tips', 'From hobbyist to professional Vegan creator',
      esc(PUB.intro) + (member() ? '' : ' One is open for you to try.')) +
      '<div class="dg-srows">' + tiles + '</div>' +
      (member() ? '' : '<div style="margin-top:16px">' + gated(skel('Every tip, with what to do this week', 4), 'All ten tips', LOCKED_LINE) + '</div>');
  }
  function pod(slug) { return (PODS || []).filter(function (p) { return p.slug === slug; })[0] || null; }
  function viewTip(id) {
    var list = allTips(), i = -1;
    list.forEach(function (t, n) { if (t.id === id) i = n; });
    var t = list[i];
    if (!t || t.locked) {
      main.innerHTML = crumb([['The 10 tips', '#/tips'], [t ? t.title : 'Tip']]) + gated(skel(t ? t.title : '', 6), t ? t.title : 'This tip', 'It opens with the full Guide, with every other tip.');
      return;
    }
    var c = checks(), p = t.episode ? pod(t.episode) : null;
    var nextOpen = null; for (var n = i + 1; n < list.length; n++) if (!list[n].locked) { nextOpen = list[n]; break; }
    var who = t.extra && t.extra.who ? ' <a href="#/people/listing/' + encodeURIComponent(t.extra.who) + '">See their page &rsaquo;</a>' : '';
    main.innerHTML = crumb([['The 10 tips', '#/tips'], [t.title]]) +
      '<div class="rg-fix"><div class="dg-head"><div><div class="dg-k">Tip ' + (i + 1) + ' of ' + list.length + '</div><h2 class="dg-h1">' + esc(t.title) + '</h2></div>' + (member() ? '<div class="dg-acts" style="flex-direction:row">' + saveBtn('fix', t.id) + '</div>' : '') + '</div>' +
      '<p class="rg-problem">' + esc(t.lesson) + '</p>' +
      (t.extra ? '<div class="ng-extra"><b>In Action</b>' + esc(t.extra.text) + who + '</div>' : '') +
      '<h3>This week: your action items</h3><div class="ng-week">' + t.week.map(function (w, k) {
        var on = !!c[t.id + ':' + k];
        return '<label><input type="checkbox" data-check="' + esc(t.id) + ':' + k + '"' + (on ? ' checked' : '') + '><span>' + esc(w) + '</span></label>';
      }).join('') + '</div>' +
      (t.ours ? '<div class="ng-ours"><b>On Vegans Explore</b>' + esc(t.ours.text) + ' <a href="' + esc(t.ours.href) + '">' + esc(t.ours.cta) + ' &rsaquo;</a></div>' : '') +
      (p ? '<h3>Listen</h3><div class="vep-dock" data-vep-always></div><div class="rg-eps ng-one"><div class="vep-list">' + podCard(p) + '</div></div>' : '') +
      '<div class="rg-fixnav"><a class="dg-tnav" href="#/tips">All tips</a>' +
      (nextOpen ? '<a class="dg-tnav next" href="#/tips/' + nextOpen.id + '">Next tip &rsaquo;</a>' : member() ? '<a class="dg-tnav next" href="#/people">People doing it &rsaquo;</a>' : '<a class="dg-tnav next" href="#/join">Get every tip &rsaquo;</a>') + '</div></div>' +
      (!member() ? '<div style="margin-top:22px">' + gated(skel('The other nine tips', 3), 'The other nine tips', LOCKED_LINE) + '</div>' : '');
  }

  // ---------- the Pulse: our episodes with creators ----------
  function podCard(p) {
    var ep = p.ep;
    if (!ep || !window.VEEpisodes) return '';
    var show = { name: p.show.name, image: p.show.logo_url || '' };
    return VEEpisodes.row(Object.assign({}, ep, { summary: '', image: show.image || ep.image || '' }), show,
      { showName: true, acts: member() ? gvoteBtn(p.slug) + saveBtn('episode', p.slug) : '' });
  }
  function podKey(p) { return '|' + p.ep.guid; }
  function playPod(slug) {
    var p = pod(slug);
    if (p && p.ep && window.VEEpisodes) VEEpisodes.play(Object.assign({}, p.ep, { image: p.show.logo_url || p.ep.image || '' }), { name: p.show.name, image: p.show.logo_url || '' });
  }
  function keepPlayer(bar) {
    if (!bar) return;
    var dock = main.querySelector('.vep-dock[data-vep-always]');
    if (dock) { bar.classList.add('docked'); document.body.classList.remove('vep-on'); dock.appendChild(bar); }
    else { bar.classList.remove('docked'); document.body.classList.add('vep-on'); document.body.appendChild(bar); }
  }
  function viewPulse(sub) {
    var parts = String(sub || '').split('/'), m = parts[0] === 'craft' ? 'craft' : 'building';
    if (parts[0] === 'listen' && parts[1]) { viewPulse(''); playPod(decodeURIComponent(parts[1])); return; }
    var t = toggles([['Building a platform', '#/pulse'], ['The craft', '#/pulse/craft']], m === 'craft' ? 'The craft' : 'Building a platform');
    var html = head('The Creator Pulse', m === 'craft' ? 'The craft' : 'Building a platform',
      m === 'craft' ? 'Filmmakers, a musician, podcasters and educators on making the work.'
        : 'Creators, authors and broadcasters on how they built a following and kept going.', t);
    var pods = PODS ? PODS.filter(function (p) { return p.group === m; }) : null;
    if (pods) pods = pods.map(function (x, i) { return [x, i]; }).sort(function (a, b) { return gvCount(b[0].slug) - gvCount(a[0].slug) || a[1] - b[1]; }).map(function (x) { return x[0]; });
    var grid = pods ? (pods.length ? '<div class="vep-list">' + pods.map(podCard).join('') + '</div>' : '<p class="dg-empty">No episodes yet.</p>') : '<div class="dg-loading">Loading...</div>';
    if (member() && !gvLoaded) loadGVotes(function () { if (curTab === 'pulse') viewPulse(sub); });
    html += member() ? '<div class="vep-dock" data-vep-always></div><div class="rg-eps">' + grid + '</div>' : gated('<div class="rg-eps">' + grid + '</div>', 'Every creator conversation', 'Listen to our conversations with creators right here in the Guide.');
    main.innerHTML = html;
  }

  // ---------- People doing it: content creators and YouTube channels ----------
  var PEOPLE_SUBS = [['All', ''], ['Content creators', 'creators', 'Content Creators'], ['YouTube channels', 'youtube', 'YouTube']];
  var shown = 24;
  function inCat(l, cat) { return l.category === cat || (l.extra_categories || []).indexOf(cat) >= 0; }
  function viewPeople(sub) {
    if (sub && sub.indexOf('listing/') >= 0) return viewListing(decodeURIComponent(sub.split('listing/')[1]), ['People doing it', '#/people']);
    var key = (sub || '').split('/')[0], s = PEOPLE_SUBS.filter(function (x) { return x[1] === key; })[0] || PEOPLE_SUBS[0];
    var q = (document.getElementById('cgQ') || {}).value || '';
    var list = (CREATORS || []).filter(function (l) { return (!s[2] || inCat(l, s[2])) && (!q || (l.name || '').toLowerCase().indexOf(q.toLowerCase()) >= 0); });
    main.innerHTML = head('People doing it', 'Vegan creators and channels',
      'The content creators and YouTube channels in our Directory, the most voted first. Study how they show up, and vote for the ones you watch.',
      toggles(PEOPLE_SUBS.map(function (x) { return [x[0], '#/people' + (x[1] ? '/' + x[1] : '')]; }), s[0])) +
      '<div class="dg-tools"><input type="search" id="cgQ" placeholder="Search ' + esc(s[1] ? s[0].toLowerCase() : 'creators') + '..." value="' + esc(q) + '" aria-label="Search creators"><span class="dg-count">' + (CREATORS ? list.length + ' shown' : '') + '</span></div>' +
      (CREATORS ? (list.length ? cards(list.slice(0, shown), 'cgPeople') + (list.length > shown ? '<div class="dg-btns" style="margin-top:14px"><button type="button" class="dg-btn dg-ghost" data-more>Show more</button></div>' : '')
        : '<p class="dg-empty">None here yet.</p>') : '<div class="dg-loading">Loading...</div>') +
      '<p class="dg-pp" style="margin-top:16px">Are you a creator we should know? <a href="#/next">Your next step</a></p>';
    wireCards('cgPeople', '#/people');
    var inp = document.getElementById('cgQ'), tm;
    if (inp) inp.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(function () { shown = 24; viewPeople(sub); var i2 = document.getElementById('cgQ'); if (i2) { i2.focus(); i2.setSelectionRange(i2.value.length, i2.value.length); } }, 200); });
  }

  // ---------- Your next step: the Ambassador program (canon-ve-ambassadors-talent-shop) ----------
  function viewNext() {
    var steps = [
      ['One program, by results', 'There is one Ambassador program for everyone. You climb by what you do: your level, the jobs you take, the campaigns you finish. Doing a little is fine.', 'Live'],
      ['Your own link', 'Every Ambassador shares their own link. A friend who joins through it earns you points, and from Level 2 a commission on their Passport.', 'Live'],
      ['Points jobs', 'Open to every Ambassador: post, share your link, show up. They pay in points.', 'Live'],
      ['Perk jobs', 'A dinner, a ticket, often for a cause, plus points.', 'Coming'],
      ['Paid jobs', 'By invitation, for active Ambassadors with a rate card. From Level 2, professional work too: managing a social account, editing, design, outreach, starting with a small paid trial job.', 'Coming'],
      ['Ready for paid work', 'A checklist that keeps itself up to date: your profile, your platforms, your rates (seen only by our team) and how you get paid. When it is done, you are active. Ambassadors find it on their dashboard as Paid work: your checklist.', 'Live'],
      ['Services, one at a time', 'What we offer creators and the brands they work with opens one service at a time, each announced in the Daily Pulse.', 'Coming']
    ];
    var ask = 'mailto:contact@lesaruss.com?subject=' + encodeURIComponent('Becoming an Ambassador') + '&body=' + encodeURIComponent('Hi Sean,\n\nI am a Vegan creator and I would like to be considered as an Ambassador.\n\nMy name:\nWhere I create (links):\nWhat I make:\nMy city:\n');
    main.innerHTML = head('Your next step', 'Become an Ambassador',
      'Ambassadors bring people into the community, for the animals and for their city, and grow with us as they do. It is by invitation: tell us about you and what you make, and our team will be in touch. Ambassadors get this Guide with it.') +
      '<div class="rg-steps">' + steps.map(function (w, i) {
        return '<div class="rg-step"><em>' + (i + 1) + '</em><b>' + esc(w[0]) + ' <span class="dg-free" style="margin-left:6px' + (w[2] === 'Coming' ? ';background:#fff7e8;color:#8a5a00' : '') + '">' + esc(w[2]) + '</span></b><p>' + esc(w[1]) + '</p></div>';
      }).join('') + '</div>' +
      '<div class="dg-btns"><a class="dg-btn" href="/gigs/sample" target="_blank" rel="noopener">See the Creator Dashboard demo</a><a class="dg-btn dg-ghost" href="/creators/welcome#/board">The Official Creator Guide</a></div>' +
      '<div class="dg-btns"><a class="dg-btn" href="' + ask + '">Tell us about you</a><a class="dg-btn dg-ghost" href="/ambassadors/welcome">Already an Ambassador? Open your Guide</a></div>' +
      '<p class="dg-pp" style="margin-top:12px">Sponsored posts always carry the disclosure the FTC asks for. <a href="/policies#membership">The terms</a></p>';
  }

  // ---------- My list ----------
  var LIST_SECS = [['Tips', 'tips', 'fix', '#/tips'], ['Episodes', 'episodes', 'episode', '#/pulse'], ['Creators', 'creators', 'listing', '#/people']];
  function viewMyList(sub) {
    var sec = LIST_SECS.filter(function (x) { return x[1] === String(sub || '').split('/')[0]; })[0] || LIST_SECS[0];
    main.innerHTML = head('My list', 'My list', 'Everything you save in the Guide, in one place. Tap Save on any tip, episode or creator.', toggles(LIST_SECS.map(function (x) { return [x[0], '#/mylist/' + x[1]]; }), sec[0])) +
      '<div id="dgML"><div class="dg-loading">Loading your list...</div></div>';
    var draw = function () {
      var el = document.getElementById('dgML'); if (!el) return;
      var keys = SV_ORDER.filter(function (x) { return x.kind === sec[2]; }).map(function (x) { return x.key; }), html = '', items = [];
      if (sec[2] === 'fix') { var all = allTips(); items = keys.map(function (k) { return all.filter(function (t) { return t.id === k; })[0]; }).filter(Boolean);
        html = '<div class="dg-srows">' + items.map(function (t) { return row({ icon: tipIcon(t.id), title: t.title, href: '#/tips/' + t.id, body: '<p class="dg-srow-p">' + esc(t.lesson || '') + '</p>', acts: saveBtn('fix', t.id) }); }).join('') + '</div>'; }
      else if (sec[2] === 'episode') { items = keys.map(pod).filter(Boolean); html = '<div class="vep-dock" data-vep-always></div><div class="rg-eps"><div class="vep-list">' + items.map(podCard).join('') + '</div></div>'; }
      else { items = keys.map(function (k) { return (CREATORS || []).filter(function (l) { return l.slug === k; })[0]; }).filter(Boolean); html = cards(items, 'cgML'); }
      el.innerHTML = items.length ? html : '<p class="dg-empty">Nothing saved here yet. Tap Save on any of the <a href="' + sec[3] + '">' + esc(sec[0].toLowerCase()) + '</a> and it shows up here.</p>';
      if (sec[2] === 'listing') wireCards('cgML', '#/people');
    };
    var waits = 0, done = function () { if (--waits <= 0) draw(); };
    if (svState !== 'loaded') { waits++; loadSaves(done); }
    if (sec[2] === 'episode' && !gvLoaded) { waits++; loadGVotes(done); }
    if (!waits) draw();
  }

  // ---------- Get access ----------
  function viewJoin() {
    if (member()) { main.innerHTML = head('Your Guide', 'The whole Guide is yours', 'It is yours to keep. Make something good.') + '<a class="dg-btn" href="#/">Back to the overview</a>'; return; }
    var m = mode(), status = '<span class="dg-status" role="status" style="display:block;margin-top:10px;color:#8a5a00"></span>';
    var list = '<div class="dg-access"><ul>' +
      '<li><b>All ten tips</b>, each with a real Vegan creator doing it and three action items for this week.</li>' +
      '<li><b>The Creator Pulse:</b> our conversations with creators, played right here.</li>' +
      '<li><b>My list</b>, to keep the tips, episodes and creators you are working from.</li></ul></div>';
    var box = m === 'points'
      ? '<div class="dg-big">' + pts(ST.cost) + '<small>points</small></div><p>You have ' + pts(ST.balance) + ' points. Unlock the Guide with ' + pts(ST.cost) + ' of them and it is yours to keep.</p>' +
        '<button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button><button type="button" class="dg-btn dg-ghost" data-buy style="margin-top:8px">Or get it for $11</button>' + status
      : '<div class="dg-big">$11<small>yours to keep</small></div><p>' + (m === 'join' ? 'Create your account and get the Guide for $11, one time. Buying it makes you a member of Vegans Explore. Already a member? <a href="#" data-signin>Sign in</a>.'
          : 'Get the Guide for $11, one time, and it is yours to keep' + (ST.active ? '.' : '. Buying it also makes you a member of Vegans Explore.')) + '</p>' +
        '<button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button>' + status +
        '<p class="dg-pp">Or get your <a href="/passport">Passport</a>: $11, one time, with 1,100 welcome points, enough for this Guide.</p>';
    main.innerHTML = head('Get access', 'Open the whole Creator Guide', 'Every Vegans Explore Guide is $11, or 1,100 points, and yours to keep. Ambassadors get it included. People doing it and Your next step stay open to everyone.') + list;
    main.querySelector('.dg-access').insertAdjacentHTML('beforeend', '<div class="dg-pricebox">' + box + '</div>');
  }

  // ---------- Overview ----------
  function viewOverview() {
    var tiles = [
      ['tips', 'The 10 tips', 'Ten moves from hobbyist to professional, each with a real creator and three action items.'],
      ['people', 'People doing it', 'The content creators and YouTube channels in our Directory.', 1],
      ['pulse', 'Pulse', 'Our conversations with creators, filmmakers and podcasters, played right here.'],
      ['next', 'Your next step', 'Become an Ambassador: one program, and you grow by what you do.', 1]
    ];
    main.innerHTML = head('Vegans Explore Guides for creators', 'From hobbyist to professional Vegan creator',
      'For Vegan creators ready to grow with intention. Based on The Vegan Content Creator Survival Guide by Sean A. Russell, with the creators in our Directory and our conversations built in.') +
      '<div class="dg-tiles">' + tiles.map(function (t) {
        return '<a class="dg-tile' + (t[0] === 'next' ? ' dg-warm' : '') + '" href="' + href(t[0]) + '"><div class="dg-ic">' + ICON[t[0]] + '</div><div><b>' + esc(t[1]) + '</b><span>' + esc(t[2]) + '</span>' +
          (!member() && !t[3] ? '<span class="dg-mlock">' + LOCK_SVG + ' In the full Guide</span>' : !member() && t[3] ? '<span class="dg-mlock" style="color:#1f5f22 !important">Open to everyone</span>' : '') + '</div></a>';
      }).join('') + '</div>' +
      '<div class="dg-start"><a class="dg-btn" href="#/tips/' + PUB.tip_example.id + '">' + (member() ? 'Start with tip 1' : 'Try tip 1, free') + '</a><a class="dg-btn dg-ghost" href="#/people">See who\'s doing it</a>' +
      (member() ? '<p>The whole Guide is yours. Pick a tab, or follow River with Next.</p>' : '<p>The full Guide is $11 or 1,100 points. <a href="#/join" style="color:var(--g);font-weight:800">How to get access</a></p>') + '</div>';
  }

  // ---------- search (members) ----------
  function index() {
    var out = [];
    if (!MEM) return out;
    allTips().forEach(function (t) { out.push({ t: 'The 10 tips', title: t.title, text: [t.lesson, t.extra && t.extra.text].concat(t.week || []).filter(Boolean).join(' '), href: '#/tips/' + t.id }); });
    (PODS || []).forEach(function (p) { out.push({ t: 'Pulse', title: p.title, text: (p.podcast_show || '') + '. ' + (p.summary || ''), href: '#/pulse/listen/' + encodeURIComponent(p.slug) }); });
    (CREATORS || []).forEach(function (l) { out.push({ t: 'People doing it', title: l.name, text: l.category || '', href: '#/people/listing/' + encodeURIComponent(l.slug) }); });
    return out;
  }
  function viewSearch(q) {
    if (qEl.value !== q) qEl.value = q;
    var words = q.toLowerCase().split(/\s+/).filter(Boolean);
    var hits = index().filter(function (h) { var hay = (h.title + ' ' + h.text).toLowerCase(); return words.every(function (w) { return hay.indexOf(w) >= 0; }); });
    var groups = {}; hits.forEach(function (h) { (groups[h.t] = groups[h.t] || []).push(h); });
    var html = crumb([['Search']]) + '<h2 class="dg-h1">' + hits.length + (hits.length === 1 ? ' result' : ' results') + ' for &ldquo;' + esc(q) + '&rdquo;</h2><div class="dg-res">';
    ['The 10 tips', 'Pulse', 'People doing it'].forEach(function (g) {
      if (!groups[g]) return;
      html += '<h2>' + esc(g) + ' (' + groups[g].length + ')</h2><div class="dg-grid">' + groups[g].slice(0, 24).map(function (h) {
        return '<a class="dg-card dg-hit" href="' + h.href + '"><h3>' + esc(h.title) + '</h3><p>' + esc(h.text.length > 160 ? h.text.slice(0, 157) + '...' : h.text) + '</p></a>';
      }).join('') + '</div>';
    });
    if (!hits.length) html += '<p class="dg-empty">Nothing matched. Try burnout, collaborate, YouTube or a creator\'s name.</p>';
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

  // ---------- River, on the right of every tab (his words as text; no clips yet) ----------
  var tourM = document.getElementById('dgTourM'), foldBtn = document.getElementById('dgFold'), railEl = document.getElementById('dgRail');
  function setFold(folded) {
    railEl.classList.toggle('dg-folded', folded);
    foldBtn.textContent = folded ? 'Show River' : 'Hide River'; foldBtn.setAttribute('aria-expanded', String(!folded));
    try { sessionStorage.setItem('cg_river_folded', folded ? '1' : ''); } catch (e) {}
  }
  foldBtn.addEventListener('click', function () { setFold(!railEl.classList.contains('dg-folded')); });
  try { if (sessionStorage.getItem('cg_river_folded')) setFold(true); } catch (e) {}
  var bubble = document.getElementById('dgBubble'), tourEl = document.getElementById('dgTour');
  function drawRiver() {
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
    if (view === 'search' && (!sub || !member())) view = 'overview';
    var known = { overview: 1, tips: 1, people: 1, pulse: 1, next: 1, mylist: 1, join: 1, search: 1 };
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
    var bar = document.getElementById('vep-player');
    ({ overview: viewOverview, tips: function () { viewTips(sub); }, people: function () { viewPeople(sub); }, pulse: function () { viewPulse(sub); },
       next: viewNext, mylist: function () { viewMyList(sub); }, join: viewJoin, search: function () { viewSearch(decodeURIComponent(sub)); } })[view]();
    keepPlayer(bar);
    curTab = key;
    drawRiver();
    if (view !== 'search') { main.scrollTop = 0; if (!document.documentElement.classList.contains('dg-fit') || window.innerWidth <= 900) window.scrollTo(0, 0); }
  }
  window.addEventListener('hashchange', function () { shown = 24; route(); });

  // ---------- access ----------
  function api(action, tok) {
    return fetch(UNLOCK_URL + '?action=' + action, { method: 'POST', headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: SLUG, token: tok || undefined }) })
      .then(function (r) { return r.json(); });
  }
  function becomeMember(html) {
    var t = document.createElement('template'); t.innerHTML = html;
    var el = t.content.getElementById('cg-data');
    MEM = el ? JSON.parse(el.textContent) : null;
    access = MEM ? 'member' : 'pending';
    route();
  }
  function feedEp(show, guid) {
    return fetch(PODCAST_FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'episode', slug: show, guid: guid }) })
      .then(function (r) { return r.json(); }).then(function (d) { return d && d.episode; }).catch(function () { return null; });
  }
  function loadPublic() {
    if (window.VEEpisodes) VEEpisodes.css();
    rest(CREATORS_URL).then(function (d) { CREATORS = Array.isArray(d) ? d : []; if (/^(people|search|mylist)$/.test(curTab) || /^#\/search/.test(location.hash)) route(); }).catch(function () { CREATORS = []; });
    var eps = Promise.all(PULSE_PICKS.map(function (x) { return feedEp(x[1], x[2]); }));
    Promise.all([rest(PULSE_URL).catch(function () { return []; }), rest(SHOWS_URL).catch(function () { return []; }), eps]).then(function (r) {
      var pods = Array.isArray(r[0]) ? r[0] : [], shows = Array.isArray(r[1]) ? r[1] : [];
      PODS = PULSE_PICKS.map(function (x, i) {
        var p = pods.filter(function (y) { return y.slug === x[0]; })[0], show = shows.filter(function (y) { return y.slug === x[1]; })[0], ep = r[2][i];
        return p && show && ep && ep.audio ? Object.assign({}, p, { show: show, ep: ep, group: x[3] }) : null;
      }).filter(Boolean);
      if (/^(pulse|tips|mylist)$/.test(curTab)) route();
    });
  }
  function setStatus(msg) { [].forEach.call(document.querySelectorAll('.dg-status'), function (e) { e.textContent = msg; }); }

  document.addEventListener('click', function (e) {
    var a = auth(), el;
    if ((el = e.target.closest('[data-vep-play]'))) {
      var pp = (PODS || []).filter(function (x) { return x.ep && podKey(x) === el.getAttribute('data-vep-play'); })[0];
      if (pp) playPod(pp.slug); return;
    }
    if (e.target.closest('[data-more]')) { shown += 24; viewPeople((location.hash.split('#/people/')[1] || '')); return; }
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
      if (a) a.showAuthModal('Sign in and the Creator Guide opens if it is yours.', function () { location.reload(); }, 'login');
      return;
    }
    if ((el = e.target.closest('[data-buy]'))) { e.preventDefault(); if (token()) buyNow(el); return; }
    var jb = e.target.closest('[data-join]');
    if (jb) {
      if (!a || access === 'checking' || jb.disabled) return;
      var m = mode();
      // A new account goes straight on to the Guide's own $11 checkout, since buying the Guide is what makes them a member.
      if (m === 'join') {
        var go = function () { delete window.VE_ACTIVATE_HANDLER; buyNow(jb); };
        window.VE_ACTIVATE_HANDLER = go;
        a.showAuthModal('Create your account, then get the Creator Guide for $11. Buying it makes you a member.', go, 'signup');
        return;
      }
      if (m === 'points') unlockPoints(jb); else buyNow(jb);
    }
  });
  document.addEventListener('change', function (e) {
    var el = e.target.closest && e.target.closest('[data-check]'); if (!el) return;
    var c = checks(), k = el.getAttribute('data-check');
    if (el.checked) c[k] = 1; else delete c[k];
    store('cg_checks', JSON.stringify(c));
  });
  function unlockPoints(btn) {
    var tok = token(); if (!tok) return;
    btn.disabled = true; btn.textContent = 'Unlocking...';
    api('unlock', tok).then(function (d) {
      if (d && d.unlocked) return api('open', tok).then(function (o) { take(o); if (o && o.unlocked && o.html) becomeMember(o.html); else throw 0; });
      if (d && d.error === 'insufficient_points') { ST.balance = d.balance || 0; route(); return; }
      throw 0;
    }).catch(function () { btn.disabled = false; btn.textContent = ctaLabel(); setStatus('That did not go through, and no points were spent. Try again in a minute.'); });
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
  function confirmAfterCheckout(tok, tries) {
    setStatus('Opening your Guide...');
    access = 'pending';
    api('open', tok).then(function (d) {
      take(d);
      if (d && d.unlocked && d.html) { setStatus(''); becomeMember(d.html); return; }
      if (tries > 0) { setTimeout(function () { confirmAfterCheckout(tok, tries - 1); }, 2500); return; }
      route(); setStatus('Your payment went through. It can take a minute to show here: refresh this page shortly.');
    }).catch(function () { if (tries > 0) setTimeout(function () { confirmAfterCheckout(tok, tries - 1); }, 2500); else route(); });
  }

  function init() {
    if (window.VERegionDirectory) VERegionDirectory.css();
    document.documentElement.classList.add('dg-fit');
    var box = document.getElementById('dgMaya');
    if (window.VEGuideArt) { var art = VEGuideArt('river', 'square'); if (art) box.style.backgroundImage = "url('" + art + "')"; }
    var params = new URLSearchParams(location.search);
    route();
    loadPublic();
    var a = auth(), viewAs = a && a.getViewAs ? a.getViewAs() : null;
    var tok = a && a.isLoggedIn() && !viewAs ? a.getToken() : null;
    if (!tok) { access = viewAs && viewAs.mode !== 'public' ? 'pending' : 'guest'; route(); api('status').then(function (d) { take(d); route(); }).catch(function () {}); return; }
    var val = params.get('guide');
    if (val) { params.delete('guide'); history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash); }
    if (val === 'success' || val === 'bought') { confirmAfterCheckout(tok, 8); return; }
    if (val === 'cancelled') setTimeout(function () { setStatus('Checkout was cancelled. Nothing was charged.'); }, 1500);
    api('open', tok).then(function (d) {
      take(d);
      if (d && d.unlocked && d.html) becomeMember(d.html);
      else { access = d && d.loggedIn ? 'pending' : 'guest'; route(); }
    }).catch(function () { access = 'pending'; route(); setStatus('We could not check your access just now. Refresh to try again.'); });
  }

  if (window.VEAuth) init(); else window.addEventListener('load', init);
})();
