/* The Nutrition Guide (2026-10-31, Sean: "build the Nutrition Guide"; the Guide the listing Guide tab names for Nutrition &
 * Supplements, Physicians and Health Experts, playbook ve-listing-guide-tab). Built on the Nonprofit Guide's files, which follow
 * docs/guides/BUILD-A-GUIDE.md.
 *
 * What a Vegan plate needs, nutrient by nutrient, every number from the source named under it, with our physicians and health experts
 * on the podcast and the Directory's supplement brands and experts built in. The tabs are the tour; Theo stays on the right of every
 * tab (his lines show as text, no recordings). The address bar carries the view (#/nutrients/iron, #/pulse/experts, #/experts/pros).
 *
 *   Overview       what the Guide is and what each tab holds
 *   Nutrients      one per view: why it matters, how much (by who), where to get it from food, supplements, a tip, This week (kept
 *                  in the browser, nt_checks) and an episode. Vitamin B12 is open to everyone, the free example
 *   Your plate     the Healthy Eating Plate made Vegan, and the every-day checklist (members)
 *   Supplements    the Directory's Nutrition & Supplements brands (open) and what to look for in a supplement (members)
 *   Experts        People > Physicians and Health Experts, and Services > Health Professionals by chapter; a listing opens in the Guide
 *   Pulse          our episodes with physicians and health experts, played in place (PULSE_PICKS, ve-podcast)
 *   My list        members: saved nutrients, episodes and listings (ve_guide_saves through ve-cookbook: fix, episode, listing)
 *   Get access     visitors: $11 or 1,100 points
 *
 * Access is every Guide's: ve-guide-unlock for this slug decides. The members-only text (the other seven nutrients, the plate, what to
 * look for in a supplement) is ve_guides.content_html, handed out only to its owners. Never add it to this repo.
 */
(function () {
  var SLUG = 'nutrition-guide';
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var UNLOCK_URL = SB + '/functions/v1/ve-guide-unlock';
  var COOK_URL = SB + '/functions/v1/ve-cookbook';
  var PODCAST_FN = SB + '/functions/v1/ve-podcast';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var FIELDS = window.VERegionDirectory ? VERegionDirectory.FIELDS : 'id,slug,name,category,logo_url,vote_count,address_city,address_state,color,vegan_status,communities,tags,extra_categories';
  function catUrl(cats, limit) {
    return SB + '/rest/v1/listings?select=' + FIELDS + '&status=eq.approved&or=(category.in.(' + cats.map(encodeURIComponent).join(',') + '),extra_categories.ov.{' + cats.map(function (c) { return '"' + encodeURIComponent(c) + '"'; }).join(',') + '})&order=vote_count.desc.nullslast,name.asc&limit=' + (limit || 500);
  }
  var SUPP_URL = catUrl(['Nutrition & Supplements']);
  var PEOPLE_URL = catUrl(['Physicians', 'Health Experts']);
  var PROS_URL = catUrl(['Health Professionals']);
  // LESARUSS.ai's own listings share the table; they never show here.
  var LR_TAGS = ['lesaruss-ai-directory', 'lesaruss-ai-directory-candidate', 'lesaruss-ai-business-member'];
  function ours(list) { return (Array.isArray(list) ? list : []).filter(function (l) { return !(l.tags || []).some(function (t) { return LR_TAGS.indexOf(t) >= 0; }); }); }

  // Our episodes, in this order, as their podcast episodes: [ve_pulse_content slug, the show's Directory slug, the episode's guid in that
  // show's feed (ve_podcast_feeds), group]. Matched through ve_content_feed_episode, or by title and episode order, 2026-10-31.
  var PULSE_PICKS = [
    ['neal-barnard-plant-based-questions-answered', 'vegans-explore-podcast', 'b8615f03-7837-443c-aa43-7e98cf83cda3', 'doctors'],
    ['dr-michael-klaper-moving-medicine-forward', 'vegans-explore-podcast', '3a286bfd-97f9-4c27-85b8-099556740015', 'doctors'],
    ['dr-will-bulsiewicz-fiber-fueled-cookbook-microbiome', 'vegans-explore-podcast', 'e29ba716-4350-40b3-8692-17d718ecfb41', 'doctors'],
    ['klaper-ai-chatgpt-food-pyramid', 'vegans-explore-podcast', '05119b80-c7fc-4c95-ac1d-b4fbaab76f69', 'doctors'],
    ['klaper-family-conversations-health-equity', 'vegans-explore-podcast', '779f25d1-b411-4985-bde4-6a59deba0589', 'doctors'],
    ['dr-joel-kahn-americas-healthy-heart-md-ep029-soflo-vegans-podcast', 'soflo-vegans-podcast', 'tag:soundcloud,2010:tracks/760841980', 'doctors'],
    ['dr-angie-sadeghi-gut-health-gastroenterology-ep023-soflo-vegans-podcast', 'soflo-vegans-podcast', 'tag:soundcloud,2010:tracks/737619079', 'doctors'],
    ['dr-will-bulsiewicz-the-fiber-fueled-cookbook-soflo-vegans-podcast', 'soflo-vegans-podcast', '49953dea-e361-40d8-a2f6-625ea281d417', 'doctors'],
    ['dr-neal-barnard-pcrm-cheese-trap-ep018-soflo-vegans-podcast', 'soflo-vegans-podcast', 'tag:soundcloud,2010:tracks/640629552', 'doctors'],
    ['dr-michael-klaper-plant-based-medicine-ep013-soflo-vegans-podcast', 'soflo-vegans-podcast', 'tag:soundcloud,2010:tracks/601615119', 'doctors'],
    ['dr-aaron-spitz-penis-book-vegan-mens-health-ep021-soflo-vegans-podcast', 'soflo-vegans-podcast', 'tag:soundcloud,2010:tracks/723868189', 'doctors'],
    ['dr-lakshman-lucky-mulpuri-plant-based-medical-curriculum-soflo-vegans-podcast', 'soflo-vegans-podcast', 'e785931d-fd62-4561-acc1-fd7f267e36af', 'doctors'],
    ['desiree-nielsen-good-for-your-gut-soflo-vegans-podcast', 'soflo-vegans-podcast', '3ba0e1db-1cf1-4996-b1be-ccf18000f222', 'experts'],
    ['mastering-diabetes-cyrus-khambatta-robby-barbaro-ep030-soflo-vegans-podcast', 'soflo-vegans-podcast', 'tag:soundcloud,2010:tracks/764641816', 'experts'],
    ['james-dahlia-marin-married-to-health-gut-connection-ep020-soflo-vegans-podcast', 'soflo-vegans-podcast', 'tag:soundcloud,2010:tracks/709014490', 'experts'],
    ['maxime-sigouin-forever-fit-blueprint', 'vegans-explore-podcast', '2673ab03-156f-4a99-9181-63d3c88e4541', 'experts']
  ];
  var SHOW_SLUGS = PULSE_PICKS.map(function (x) { return x[1]; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
  var SHOWS_URL = SB + '/rest/v1/listings?select=id,slug,name,logo_url&status=eq.approved&slug=in.(' + SHOW_SLUGS.join(',') + ')';
  var PULSE_URL = SB + '/rest/v1/ve_pulse_content?select=slug,title,podcast_show,summary,published_at&status=eq.published&slug=in.(' + PULSE_PICKS.map(function (x) { return x[0]; }).join(',') + ')';

  // The tabs, in tour order, and what Theo says on each (text drafts for Sean; no recordings yet). `say` is for visitors (why get it),
  // `sayMember` walks an owner through what they have.
  var TABS = [
    { k: 'overview', label: 'Overview', say: 'I\'m Theo. I\'ve been Vegan a long time, and here\'s what I wish someone had told me on day one: what your plate needs, and where to get it.',
      sayMember: 'Welcome in. Start with the nutrients, build your plate, then check what you take against the supplement list.' },
    { k: 'nutrients', label: 'Nutrients', lock: 1, say: 'Eight nutrients, one at a time: how much you need, where to get it from food, and when a supplement makes sense. B12 is open for you to try.',
      sayMember: 'Here are all eight. Each has a short checklist for this week. Tick it off as you go, and save the ones you\'re working on.' },
    { k: 'plate', label: 'Your plate', lock: 1, say: 'A simple way to build a Vegan plate at every meal, and a short list to check off every day.',
      sayMember: 'Use the plate at every meal, and the every-day list to cover the basics without counting anything.' },
    { k: 'supplements', label: 'Supplements', say: 'The supplement brands in our Directory, and in the full Guide, what to look for on the label before you buy.',
      sayMember: 'Here\'s what to look for before you buy, and the brands in our Directory. Members vote for the ones they trust.' },
    { k: 'experts', label: 'Experts', say: 'The physicians and health experts we\'ve had on our shows, and the health professionals near you in our Directory.',
      sayMember: 'Find a physician, a dietitian or a health expert, and hear them on the podcast first.' },
    { k: 'pulse', label: 'Pulse', lock: 1, say: 'Our episodes with Dr. Barnard, Dr. Klaper, Dr. Bulsiewicz and more, on food and health. Play them right here.',
      sayMember: 'Every health episode we\'ve recorded is right here. Start with Dr. Barnard\'s answers to the questions beginners ask.' },
    { k: 'mylist', label: 'My list', mine: 1, say: 'Everything you saved is here: nutrients, episodes and experts.' },
    { k: 'join', label: 'Get access', guest: 1, say: 'The Nutrition Guide is eleven dollars, or 1,100 points, and it\'s yours to keep. Buying it makes you a member of Vegans Explore.' }
  ];
  var S = 'stroke="#1f5f22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  var NUT_ICON = {
    b12: '<path d="M12 3c-3 4-6 7-6 11a6 6 0 0012 0c0-4-3-7-6-11z"/><path d="M10 14h4"/>',
    protein: '<path d="M7 4c-2 4-2 12 0 16M17 4c2 4 2 12 0 16"/><path d="M7 12h10"/>',
    iron: '<circle cx="12" cy="12" r="8"/><path d="M12 7v10M9 9h6M9 15h6"/>',
    calcium: '<path d="M8 3h8l-1 4H9z"/><path d="M9 7v13a1 1 0 001 1h4a1 1 0 001-1V7"/>',
    'vitamin-d': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    'omega-3': '<path d="M12 3c4 4 6 7 6 10a6 6 0 01-12 0c0-3 2-6 6-10z"/><path d="M9.5 14a2.5 2.5 0 002.5 2.5"/>',
    iodine: '<path d="M3 14c3-3 6-3 9 0s6 3 9 0"/><path d="M3 9c3-3 6-3 9 0s6 3 9 0"/>',
    zinc: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M9 10h6l-6 5h6"/>'
  };
  function nutIcon(id, size) { return '<svg width="' + (size || 34) + '" height="' + (size || 34) + '" viewBox="0 0 24 24" fill="none" ' + S + ' aria-hidden="true">' + (NUT_ICON[id] || NUT_ICON.b12) + '</svg>'; }
  function ic(path) { return '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + '>' + path + '</svg>'; }
  var ICON = {
    nutrients: ic(NUT_ICON.b12),
    plate: ic('<circle cx="12" cy="12" r="8"/><path d="M12 4v16M12 12h8"/>'),
    supplements: ic('<rect x="4" y="9" width="16" height="7" rx="3.5"/><path d="M12 9v7"/>'),
    experts: ic('<path d="M6 4v5a4 4 0 008 0V4"/><path d="M10 13v3a4 4 0 008 0v-2"/><circle cx="18" cy="12" r="2"/>'),
    pulse: ic('<path d="M3 12h4l2-6 4 12 2-6h6"/>')
  };
  var LOCK_SVG = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';
  var HEART = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>';
  var BOOKMARK = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 3h12a1 1 0 011 1v17l-7-4.5L5 21V4a1 1 0 011-1z"/></svg>';

  var main = document.getElementById('dgMain');
  var menuEl = document.getElementById('dgMenu'), menuSel = document.getElementById('dgMenuSelect');
  var qEl = document.getElementById('dgQ');
  var PUB = JSON.parse(document.getElementById('nt-public').textContent);

  var access = 'checking';       // checking | guest | pending | member
  var MEM = null;                // members-only payload (nutrients, plate, supplements)
  var ST = { rule: 'points', cost: 1100, balance: 0, active: false, via: null };
  var PODS = null, SUPP = null, PEOPLE = null, PROS = null;
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
  function pts(n) { return Number(n || 0).toLocaleString('en-US'); }
  function rest(url) { return fetch(url, { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } }).then(function (r) { return r.json(); }); }
  function note() { return '<p class="nt-note">' + esc(PUB.disclaimer) + '</p>'; }

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
    return '<div class="dg-crumb"><a href="#/">Nutrition Guide</a>' + parts.map(function (p) { return ' &rsaquo; ' + (p[1] ? '<a href="' + p[1] + '">' + esc(p[0]) + '</a>' : esc(p[0])); }).join('') + '</div>';
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
  // Saves: a nutrient is kind fix (something to work on), an episode, a Directory listing.
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

  // ---------- chapters (VE_HUBS), for health professionals near you ----------
  function chapters() { return window.VE_HUBS || []; }
  function chapter() { var c = recall('nt_chapter'); return c && (c === 'all' || chapters().some(function (h) { return h.slug === c; })) ? c : 'all'; }
  function inChapter(l, slug) {
    if (slug === 'all') return true;
    var c = l.communities || [];
    if (c.indexOf('all') >= 0 || c.indexOf(slug) >= 0) return true;
    if (!l.address_city && !l.address_state) return true;
    var h = chapters().filter(function (x) { return x.slug === slug; })[0];
    if (!h || (!h.match.cities && !h.match.states)) return false;
    if (h.match.cities && h.match.cities.indexOf(l.address_city) < 0) return false;
    if (h.match.states && h.match.states.indexOf(l.address_state) < 0) return false;
    return true;
  }
  function chapterPick(id, cur) {
    return '<select class="dg-sort ng-pick" id="' + id + '" aria-label="Chapter"><option value="all"' + (cur === 'all' ? ' selected' : '') + '>All chapters</option>' +
      chapters().map(function (h) { return '<option value="' + h.slug + '"' + (h.slug === cur ? ' selected' : '') + '>' + esc(h.name) + '</option>'; }).join('') + '</select>';
  }
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

  // ---------- Nutrients ----------
  function allNutrients() {
    var byId = {}; (MEM ? MEM.nutrients : []).forEach(function (t) { byId[t.id] = t; }); byId[PUB.example.id] = PUB.example;
    return PUB.titles.map(function (t) { return byId[t[0]] || { id: t[0], title: t[1], locked: 1 }; });
  }
  function checks() { try { return JSON.parse(recall('nt_checks') || '{}'); } catch (e) { return {}; } }
  function nutDone(t, c) { return t.week && t.week.length && t.week.every(function (x, i) { return c[t.id + ':' + i]; }); }
  function viewNutrients(id) {
    if (id) return viewNutrient(id);
    var list = allNutrients(), c = checks();
    var tiles = list.map(function (t) {
      var open = !t.locked;
      return row({ icon: nutIcon(t.id), title: t.title, href: open ? '#/nutrients/' + t.id : '',
        pre: (nutDone(t, c) ? '<span class="rg-done" style="margin-left:0">Done this week</span>' : '') + (!member() && t.id === PUB.example.id ? '<span class="dg-free">Free to try</span>' : ''),
        body: open ? '<p class="dg-srow-p">' + esc(t.short) + '</p>' : '<p class="dg-srow-p">' + LOCK_SVG + ' In the full Guide</p>',
        acts: member() ? saveBtn('fix', t.id) : '' });
    }).join('');
    main.innerHTML = head('Nutrients', 'What a Vegan plate needs', esc(PUB.intro) + (member() ? '' : ' Vitamin B12 is open for you to try.')) +
      '<div class="dg-srows">' + tiles + '</div>' +
      (member() ? '' : '<div style="margin-top:16px">' + gated(skel('Every nutrient, with what to do this week', 4), 'All eight nutrients', 'Protein, iron, calcium, vitamin D, omega-3s, iodine and zinc: how much, where to get them, and when to supplement.') + '</div>') + note();
  }
  function pod(slug) { return (PODS || []).filter(function (p) { return p.slug === slug; })[0] || null; }
  function viewNutrient(id) {
    var list = allNutrients(), i = -1;
    list.forEach(function (t, n) { if (t.id === id) i = n; });
    var t = list[i];
    if (!t || t.locked) {
      main.innerHTML = crumb([['Nutrients', '#/nutrients'], [t ? t.title : 'Nutrient']]) + gated(skel(t ? t.title : '', 6), t ? t.title : 'This nutrient', 'It opens with the full Guide, with every other nutrient.');
      return;
    }
    var c = checks(), p = t.episode ? pod(t.episode) : null;
    var nextOpen = null; for (var n = i + 1; n < list.length; n++) if (!list[n].locked) { nextOpen = list[n]; break; }
    main.innerHTML = crumb([['Nutrients', '#/nutrients'], [t.title]]) +
      '<div class="rg-fix"><div class="dg-head"><div><div class="dg-k">' + (i + 1) + ' of ' + list.length + '</div><h2 class="dg-h1">' + esc(t.title) + '</h2></div>' + (member() ? '<div class="dg-acts" style="flex-direction:row">' + saveBtn('fix', t.id) + '</div>' : '') + '</div>' +
      '<p class="rg-problem">' + esc(t.why) + '</p>' +
      '<h3>How much</h3><table class="nt-amt"><tbody>' + t.amount.map(function (a) { return '<tr><td>' + esc(a[0]) + '</td><td>' + esc(a[1]) + '</td></tr>'; }).join('') + '</tbody></table>' +
      (t.amount_note ? '<p class="dg-lede" style="margin:8px 0 0;font-size:14px">' + esc(t.amount_note) + '</p>' : '') +
      '<h3>Where to get it</h3><div class="nt-foods">' + t.foods.map(function (f) { return '<span>' + esc(f) + '</span>'; }).join('') + '</div>' +
      '<h3>Supplements</h3><p class="rg-problem" style="font-size:15px">' + esc(t.supplement) + '</p>' +
      (t.tip ? '<div class="ng-extra"><b>Theo\'s tip</b>' + esc(t.tip) + '</div>' : '') +
      '<h3>This week</h3><div class="ng-week">' + t.week.map(function (w, k) {
        var on = !!c[t.id + ':' + k];
        return '<label><input type="checkbox" data-check="' + esc(t.id) + ':' + k + '"' + (on ? ' checked' : '') + '><span>' + esc(w) + '</span></label>';
      }).join('') + '</div>' +
      '<h3>Sources</h3>' + sources(t.refs) +
      (p ? '<h3>Listen</h3><div class="vep-dock" data-vep-always></div><div class="rg-eps ng-one"><div class="vep-list">' + podCard(p) + '</div></div>' : '') +
      '<div class="rg-fixnav"><a class="dg-tnav" href="#/nutrients">All nutrients</a>' +
      (nextOpen ? '<a class="dg-tnav next" href="#/nutrients/' + nextOpen.id + '">Next: ' + esc(nextOpen.title) + ' &rsaquo;</a>' : member() ? '<a class="dg-tnav next" href="#/plate">Your plate &rsaquo;</a>' : '<a class="dg-tnav next" href="#/join">Get every nutrient &rsaquo;</a>') + '</div></div>' +
      (!member() ? '<div style="margin-top:22px">' + gated(skel('The other seven nutrients', 3), 'The other seven nutrients', 'Protein, iron, calcium, vitamin D, omega-3s, iodine and zinc.') + '</div>' : '') + note();
  }

  // ---------- Your plate ----------
  var PLATE_SVG = '<svg viewBox="0 0 200 200" role="img" aria-label="A plate: half vegetables and fruits, a quarter whole grains, a quarter plant protein">' +
    '<circle cx="100" cy="100" r="96" fill="#f3f6f3" stroke="#d6dcd6" stroke-width="2"/>' +
    '<path d="M100 100 L100 12 A88 88 0 0 0 100 188 Z" fill="#7cc576"/>' +
    '<path d="M100 100 L100 12 A88 88 0 0 1 188 100 Z" fill="#e8b04a"/>' +
    '<path d="M100 100 L188 100 A88 88 0 0 1 100 188 Z" fill="#a0673d"/>' +
    '<text x="56" y="104" font-family="Montserrat,sans-serif" font-size="11" font-weight="800" fill="#123d18" text-anchor="middle">Vegetables</text><text x="56" y="118" font-family="Montserrat,sans-serif" font-size="11" font-weight="800" fill="#123d18" text-anchor="middle">and fruits</text>' +
    '<text x="143" y="66" font-family="Montserrat,sans-serif" font-size="9.5" font-weight="800" fill="#3d2a00" text-anchor="middle">Whole grains</text>' +
    '<text x="143" y="140" font-family="Montserrat,sans-serif" font-size="9.5" font-weight="800" fill="#fff" text-anchor="middle">Plant protein</text></svg>';
  function viewPlate() {
    var html = head('Your plate', 'Build a Vegan plate at every meal', 'No counting: a picture of the plate, and a short list to check off every day.');
    if (!member()) {
      main.innerHTML = html + gated('<div class="nt-plate">' + PLATE_SVG + '<div>' + skel('Half: vegetables and fruits', 2) + skel('A quarter: whole grains', 2) + skel('A quarter: plant protein', 2) + '</div></div>', 'Your plate, and the every-day list', 'The plate at every meal, and the basics to cover every day.') + note();
      return;
    }
    var pl = MEM.plate, c = checks();
    main.innerHTML = html +
      '<div class="nt-plate">' + PLATE_SVG + '<div class="nt-key">' + pl.parts.map(function (x) { return '<div><i style="background:' + esc(x[0]) + '"></i><div><b>' + esc(x[1]) + '</b><p>' + esc(x[2]) + '</p></div></div>'; }).join('') + '</div></div>' +
      '<p class="dg-lede" style="margin-top:14px">' + esc(pl.intro) + '</p>' + sources(pl.refs) +
      '<h3 class="dg-k" style="margin:22px 0 8px">Every day</h3><div class="ng-week">' + pl.every_day.map(function (w, k) {
        return '<label><input type="checkbox" data-check="day:' + k + '"' + (c['day:' + k] ? ' checked' : '') + '><span>' + esc(w) + '</span></label>';
      }).join('') + '</div>' +
      '<div class="dg-btns" style="margin-top:14px"><button type="button" class="dg-btn dg-ghost" data-clear-day>Start a new day</button></div>' + note();
  }

  // ---------- Supplements ----------
  function viewSupplements(sub) {
    if (sub && sub.indexOf('listing/') >= 0) return viewListing(decodeURIComponent(sub.split('listing/')[1]), ['Supplements', '#/supplements']);
    var look = member() && MEM.supplements
      ? '<h3 class="dg-k" style="margin:0 0 8px">Before you buy</h3><p class="dg-lede" style="margin-bottom:10px">' + esc(MEM.supplements.intro) + '</p>' +
        '<div class="rg-steps">' + MEM.supplements.look.map(function (s, i) { return '<div class="rg-step"><em>' + (i + 1) + '</em><b>' + esc(s[0]) + '</b><p>' + esc(s[1]) + '</p></div>'; }).join('') + '</div>' + sources(MEM.supplements.refs)
      : gated(skel('Before you buy', 4), 'What to look for in a supplement', 'Independent test seals, whether it is really Vegan, how much is too much, and what to tell your doctor.');
    main.innerHTML = head('Supplements', 'Supplements, and what to look for',
      'Most Vegans take B12, and many take vitamin D, an algae omega-3 or iodine. Here is what to check on the label, and the brands in our Directory.') +
      look +
      '<h3 class="dg-k" style="margin:22px 0 8px">Brands in our Directory</h3><p class="dg-lede" style="margin-bottom:10px">Members vote for the ones they trust. A listing here is not a recommendation for your health.</p>' +
      (SUPP ? (SUPP.length ? cards(SUPP, 'ntSupp') : '<p class="dg-empty">None listed yet.</p>') : '<div class="dg-loading">Loading...</div>') +
      '<div class="dg-btns" style="margin-top:14px"><a class="dg-btn dg-ghost" href="/directory?tab=food&sub=nutrition-and-supplements">See them in the Directory</a><a class="dg-btn dg-ghost" href="/claim?add=1">Add a brand</a></div>' + note();
    wireCards('ntSupp', '#/supplements');
  }

  // ---------- Experts: physicians, health experts, health professionals ----------
  var EXP_SUBS = [['On our shows', ''], ['Near you', 'pros']];
  var expShown = 24;
  function viewExperts(sub) {
    if (sub && sub.indexOf('listing/') >= 0) return viewListing(decodeURIComponent(sub.split('listing/')[1]), ['Experts', '#/experts']);
    var near = String(sub || '').split('/')[0] === 'pros';
    var t = toggles(EXP_SUBS.map(function (x) { return [x[0], '#/experts' + (x[1] ? '/' + x[1] : '')]; }), near ? 'Near you' : 'On our shows');
    if (!near) {
      main.innerHTML = head('Experts', 'Physicians and health experts', 'The doctors, dietitians and health experts in our People directory, most of them guests on our shows. Members vote for the ones they trust.', t) +
        (PEOPLE ? (PEOPLE.length ? cards(PEOPLE.slice(0, expShown), 'ntPeople') + (PEOPLE.length > expShown ? '<div class="dg-btns" style="margin-top:14px"><button type="button" class="dg-btn dg-ghost" data-more>Show more</button></div>' : '') : '<p class="dg-empty">None listed yet.</p>') : '<div class="dg-loading">Loading...</div>') +
        '<div class="dg-btns" style="margin-top:14px"><a class="dg-btn dg-ghost" href="#/pulse">Hear them on the podcast</a></div>' + note();
      wireCards('ntPeople', '#/experts');
      return;
    }
    var ch = chapter(), list = (PROS || []).filter(function (l) { return inChapter(l, ch); });
    main.innerHTML = head('Experts', 'Health professionals near you', 'Doctors, dietitians, chiropractors and other practices in our Directory, by chapter. Not listed yet? Add the practice you trust.', t) +
      '<div class="dg-tools">' + chapterPick('ntProCh', ch) + '<span class="dg-count">' + (PROS ? list.length + ' shown' : '') + '</span></div>' +
      (PROS ? (list.length ? cards(list, 'ntPros') : '<p class="dg-empty">None listed in this chapter yet.</p>') : '<div class="dg-loading">Loading...</div>') +
      '<div class="dg-btns" style="margin-top:14px"><a class="dg-btn dg-ghost" href="/claim?add=1">Add a practice</a><a class="dg-btn dg-ghost" href="https://www.eatright.org/find-a-nutrition-expert" target="_blank" rel="noopener" title="The directory of the Academy of Nutrition and Dietetics, eatright.org">Find a dietitian</a></div>' + note();
    wireCards('ntPros', '#/experts');
    var sel = document.getElementById('ntProCh'); if (sel) sel.addEventListener('change', function () { store('nt_chapter', sel.value); viewExperts('pros'); });
  }

  // ---------- the Pulse: our physicians and health experts ----------
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
    var parts = String(sub || '').split('/'), m = parts[0] === 'experts' ? 'experts' : 'doctors';
    if (parts[0] === 'listen' && parts[1]) { viewPulse(''); playPod(decodeURIComponent(parts[1])); return; }
    var t = toggles([['Physicians', '#/pulse'], ['Health experts', '#/pulse/experts']], m === 'experts' ? 'Health experts' : 'Physicians');
    var html = head('The Nutrition Pulse', m === 'experts' ? 'Health experts on our shows' : 'Physicians on our shows',
      m === 'experts' ? 'A dietitian on gut health, the Mastering Diabetes founders, Married to Health and a plant-based trainer.'
        : 'Dr. Neal Barnard, Dr. Michael Klaper, Dr. Will Bulsiewicz, Dr. Joel Kahn, Dr. Angie Sadeghi and more, on food and health.', t);
    var pods = PODS ? PODS.filter(function (p) { return p.group === m; }) : null;
    if (pods) pods = pods.map(function (x, i) { return [x, i]; }).sort(function (a, b) { return gvCount(b[0].slug) - gvCount(a[0].slug) || a[1] - b[1]; }).map(function (x) { return x[0]; });
    var grid = pods ? (pods.length ? '<div class="vep-list">' + pods.map(podCard).join('') + '</div>' : '<p class="dg-empty">No episodes yet.</p>') : '<div class="dg-loading">Loading...</div>';
    if (member() && !gvLoaded) loadGVotes(function () { if (curTab === 'pulse') viewPulse(sub); });
    html += member() ? '<div class="vep-dock" data-vep-always></div><div class="rg-eps">' + grid + '</div>' : gated('<div class="rg-eps">' + grid + '</div>', 'Every health episode', 'Listen to our physicians and health experts right here in the Guide.');
    main.innerHTML = html;
  }

  // ---------- My list ----------
  var LIST_SECS = [['Nutrients', 'nutrients', 'fix', '#/nutrients'], ['Episodes', 'episodes', 'episode', '#/pulse'], ['Brands and experts', 'listings', 'listing', '#/experts']];
  function viewMyList(sub) {
    var sec = LIST_SECS.filter(function (x) { return x[1] === String(sub || '').split('/')[0]; })[0] || LIST_SECS[0];
    main.innerHTML = head('My list', 'My list', 'Everything you save in the Guide, in one place. Tap Save on any nutrient, episode, brand or expert.', toggles(LIST_SECS.map(function (x) { return [x[0], '#/mylist/' + x[1]]; }), sec[0])) +
      '<div id="dgML"><div class="dg-loading">Loading your list...</div></div>';
    var draw = function () {
      var el = document.getElementById('dgML'); if (!el) return;
      var keys = SV_ORDER.filter(function (x) { return x.kind === sec[2]; }).map(function (x) { return x.key; }), html = '', items = [];
      if (sec[2] === 'fix') { var all = allNutrients(); items = keys.map(function (k) { return all.filter(function (t) { return t.id === k; })[0]; }).filter(Boolean);
        html = '<div class="dg-srows">' + items.map(function (t) { return row({ icon: nutIcon(t.id), title: t.title, href: '#/nutrients/' + t.id, body: '<p class="dg-srow-p">' + esc(t.short || '') + '</p>', acts: saveBtn('fix', t.id) }); }).join('') + '</div>'; }
      else if (sec[2] === 'episode') { items = keys.map(pod).filter(Boolean); html = '<div class="vep-dock" data-vep-always></div><div class="rg-eps"><div class="vep-list">' + items.map(podCard).join('') + '</div></div>'; }
      else { items = keys.map(function (k) { return (SUPP || []).concat(PEOPLE || [], PROS || []).filter(function (l) { return l.slug === k; })[0]; }).filter(Boolean); html = cards(items, 'ntML'); }
      el.innerHTML = items.length ? html : '<p class="dg-empty">Nothing saved here yet. Tap Save on any of the <a href="' + sec[3] + '">' + esc(sec[0].toLowerCase()) + '</a> and it shows up here.</p>';
      if (sec[2] === 'listing') wireCards('ntML', '#/experts');
    };
    var waits = 0, done = function () { if (--waits <= 0) draw(); };
    if (svState !== 'loaded') { waits++; loadSaves(done); }
    if (sec[2] === 'episode' && !gvLoaded) { waits++; loadGVotes(done); }
    if (!waits) draw();
  }

  // ---------- Get access ----------
  function viewJoin() {
    if (member()) { main.innerHTML = head('Your Guide', 'The whole Guide is yours', 'It is yours to keep.') + '<a class="dg-btn" href="#/">Back to the overview</a>'; return; }
    var m = mode(), status = '<span class="dg-status" role="status" style="display:block;margin-top:10px;color:#8a5a00"></span>';
    var list = '<div class="dg-access"><ul>' +
      '<li><b>All eight nutrients</b>, each with how much, where to get it, when to supplement and what to do this week.</li>' +
      '<li><b>Your plate</b> at every meal, and the every-day list.</li>' +
      '<li><b>What to look for in a supplement</b> before you buy.</li>' +
      '<li><b>The Nutrition Pulse:</b> our physicians and health experts, played right here, and My list to keep your place.</li></ul></div>';
    var box = m === 'points'
      ? '<div class="dg-big">' + pts(ST.cost) + '<small>points</small></div><p>You have ' + pts(ST.balance) + ' points. Unlock the Guide with ' + pts(ST.cost) + ' of them and it is yours to keep.</p>' +
        '<button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button><button type="button" class="dg-btn dg-ghost" data-buy style="margin-top:8px">Or get it for $11</button>' + status
      : '<div class="dg-big">$11<small>yours to keep</small></div><p>' + (m === 'join' ? 'Create your account and get the Guide for $11, one time. Buying it makes you a member of Vegans Explore. Already a member? <a href="#" data-signin>Sign in</a>.'
          : 'Get the Guide for $11, one time, and it is yours to keep' + (ST.active ? '.' : '. Buying it also makes you a member of Vegans Explore.')) + '</p>' +
        '<button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button>' + status +
        '<p class="dg-pp">Or get your <a href="/passport">Passport</a>: $11, one time, with 1,100 welcome points, enough for this Guide.</p>';
    main.innerHTML = head('Get access', 'Open the whole Nutrition Guide', 'Every Vegans Explore Guide is $11, or 1,100 points, and yours to keep. Vitamin B12, the supplement brands and the experts stay open to everyone.') + list;
    main.querySelector('.dg-access').insertAdjacentHTML('beforeend', '<div class="dg-pricebox">' + box + '</div>');
  }

  // ---------- Overview ----------
  function viewOverview() {
    var tiles = [
      ['nutrients', 'Nutrients', 'B12, protein, iron, calcium, vitamin D, omega-3s, iodine and zinc: how much, and where to get it.'],
      ['plate', 'Your plate', 'Build a Vegan plate at every meal, and check off the basics every day.'],
      ['supplements', 'Supplements', 'What to look for on the label, and the brands in our Directory.', 1],
      ['experts', 'Experts', 'Physicians and health experts from our shows, and health professionals near you.', 1],
      ['pulse', 'Pulse', 'Our episodes with Dr. Barnard, Dr. Klaper, Dr. Bulsiewicz and more.']
    ];
    main.innerHTML = head('Vegans Explore Guides for your health', 'Eat Vegan, and cover the basics',
      'What a Vegan plate needs, nutrient by nutrient, every number from the source named under it, with our physicians and the experts in our Directory built in.') +
      '<div class="dg-tiles">' + tiles.map(function (t) {
        return '<a class="dg-tile" href="' + href(t[0]) + '"><div class="dg-ic">' + ICON[t[0]] + '</div><div><b>' + esc(t[1]) + '</b><span>' + esc(t[2]) + '</span>' +
          (!member() && !t[3] ? '<span class="dg-mlock">' + LOCK_SVG + ' In the full Guide</span>' : !member() && t[3] ? '<span class="dg-mlock" style="color:#1f5f22 !important">Open to everyone</span>' : '') + '</div></a>';
      }).join('') + '</div>' +
      '<div class="dg-start"><a class="dg-btn" href="#/nutrients/' + PUB.example.id + '">' + (member() ? 'Start with B12' : 'Try B12, free') + '</a><a class="dg-btn dg-ghost" href="#/experts">Meet the experts</a>' +
      (member() ? '<p>The whole Guide is yours. Pick a tab, or follow Theo with Next.</p>' : '<p>The full Guide is $11 or 1,100 points. <a href="#/join" style="color:var(--g);font-weight:800">How to get access</a></p>') + '</div>' + note();
  }

  // ---------- search (members) ----------
  function index() {
    var out = [];
    if (!MEM) return out;
    allNutrients().forEach(function (t) { out.push({ t: 'Nutrients', title: t.title, text: [t.short, t.why, t.supplement, t.tip].concat(t.foods || []).concat(t.week || []).join(' '), href: '#/nutrients/' + t.id }); });
    (PODS || []).forEach(function (p) { out.push({ t: 'Pulse', title: p.title, text: (p.podcast_show || '') + '. ' + (p.summary || ''), href: '#/pulse/listen/' + encodeURIComponent(p.slug) }); });
    (PEOPLE || []).concat(PROS || []).forEach(function (l) { out.push({ t: 'Experts', title: l.name, text: [l.category, l.address_city, l.address_state].filter(Boolean).join(', '), href: '#/experts/listing/' + encodeURIComponent(l.slug) }); });
    (SUPP || []).forEach(function (l) { out.push({ t: 'Supplements', title: l.name, text: l.category || '', href: '#/supplements/listing/' + encodeURIComponent(l.slug) }); });
    return out;
  }
  function viewSearch(q) {
    if (qEl.value !== q) qEl.value = q;
    var words = q.toLowerCase().split(/\s+/).filter(Boolean);
    var hits = index().filter(function (h) { var hay = (h.title + ' ' + h.text).toLowerCase(); return words.every(function (w) { return hay.indexOf(w) >= 0; }); });
    var groups = {}; hits.forEach(function (h) { (groups[h.t] = groups[h.t] || []).push(h); });
    var html = crumb([['Search']]) + '<h2 class="dg-h1">' + hits.length + (hits.length === 1 ? ' result' : ' results') + ' for &ldquo;' + esc(q) + '&rdquo;</h2><div class="dg-res">';
    ['Nutrients', 'Pulse', 'Experts', 'Supplements'].forEach(function (g) {
      if (!groups[g]) return;
      html += '<h2>' + esc(g) + ' (' + groups[g].length + ')</h2><div class="dg-grid">' + groups[g].slice(0, 24).map(function (h) {
        return '<a class="dg-card dg-hit" href="' + h.href + '"><h3>' + esc(h.title) + '</h3><p>' + esc(h.text.length > 160 ? h.text.slice(0, 157) + '...' : h.text) + '</p></a>';
      }).join('') + '</div>';
    });
    if (!hits.length) html += '<p class="dg-empty">Nothing matched. Try iron, lentils, vitamin D or a doctor\'s name.</p>';
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

  // ---------- Theo, on the right of every tab (his words as text; no recordings yet) ----------
  var tourM = document.getElementById('dgTourM'), foldBtn = document.getElementById('dgFold'), railEl = document.getElementById('dgRail');
  function setFold(folded) {
    railEl.classList.toggle('dg-folded', folded);
    foldBtn.textContent = folded ? 'Show Theo' : 'Hide Theo'; foldBtn.setAttribute('aria-expanded', String(!folded));
    try { sessionStorage.setItem('nt_theo_folded', folded ? '1' : ''); } catch (e) {}
  }
  foldBtn.addEventListener('click', function () { setFold(!railEl.classList.contains('dg-folded')); });
  try { if (sessionStorage.getItem('nt_theo_folded')) setFold(true); } catch (e) {}
  var bubble = document.getElementById('dgBubble'), tourEl = document.getElementById('dgTour');
  function drawTheo() {
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
    var known = { overview: 1, nutrients: 1, plate: 1, supplements: 1, experts: 1, pulse: 1, mylist: 1, join: 1, search: 1 };
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
    ({ overview: viewOverview, nutrients: function () { viewNutrients(sub); }, plate: viewPlate, supplements: function () { viewSupplements(sub); },
       experts: function () { viewExperts(sub); }, pulse: function () { viewPulse(sub); }, mylist: function () { viewMyList(sub); }, join: viewJoin,
       search: function () { viewSearch(decodeURIComponent(sub)); } })[view]();
    keepPlayer(bar);
    curTab = key;
    drawTheo();
    if (view !== 'search') { main.scrollTop = 0; if (!document.documentElement.classList.contains('dg-fit') || window.innerWidth <= 900) window.scrollTo(0, 0); }
  }
  window.addEventListener('hashchange', function () { expShown = 24; route(); });

  // ---------- access ----------
  function api(action, tok) {
    return fetch(UNLOCK_URL + '?action=' + action, { method: 'POST', headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: SLUG, token: tok || undefined }) })
      .then(function (r) { return r.json(); });
  }
  function becomeMember(html) {
    var t = document.createElement('template'); t.innerHTML = html;
    var el = t.content.getElementById('nt-data');
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
    var again = function (re) { return function () { if (re.test(curTab) || /^#\/search/.test(location.hash)) route(); }; };
    rest(SUPP_URL).then(function (d) { SUPP = ours(d); }).catch(function () { SUPP = []; }).then(again(/^(supplements|mylist)$/));
    rest(PEOPLE_URL).then(function (d) { PEOPLE = ours(d); }).catch(function () { PEOPLE = []; }).then(again(/^(experts|mylist)$/));
    rest(PROS_URL).then(function (d) { PROS = ours(d); }).catch(function () { PROS = []; }).then(again(/^(experts|mylist)$/));
    var eps = Promise.all(PULSE_PICKS.map(function (x) { return feedEp(x[1], x[2]); }));
    Promise.all([rest(PULSE_URL).catch(function () { return []; }), rest(SHOWS_URL).catch(function () { return []; }), eps]).then(function (r) {
      var pods = Array.isArray(r[0]) ? r[0] : [], shows = Array.isArray(r[1]) ? r[1] : [];
      PODS = PULSE_PICKS.map(function (x, i) {
        var p = pods.filter(function (y) { return y.slug === x[0]; })[0], show = shows.filter(function (y) { return y.slug === x[1]; })[0], ep = r[2][i];
        return p && show && ep && ep.audio ? Object.assign({}, p, { show: show, ep: ep, group: x[3] }) : null;
      }).filter(Boolean);
      if (/^(pulse|nutrients|mylist)$/.test(curTab)) route();
    });
  }
  function setStatus(msg) { [].forEach.call(document.querySelectorAll('.dg-status'), function (e) { e.textContent = msg; }); }

  document.addEventListener('click', function (e) {
    var a = auth(), el;
    if ((el = e.target.closest('[data-vep-play]'))) {
      var pp = (PODS || []).filter(function (x) { return x.ep && podKey(x) === el.getAttribute('data-vep-play'); })[0];
      if (pp) playPod(pp.slug); return;
    }
    if (e.target.closest('[data-more]')) { expShown += 24; viewExperts(''); return; }
    if (e.target.closest('[data-clear-day]')) {
      var cc = checks(); Object.keys(cc).forEach(function (k) { if (k.indexOf('day:') === 0) delete cc[k]; });
      store('nt_checks', JSON.stringify(cc)); viewPlate(); return;
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
      if (a) a.showAuthModal('Sign in and the Nutrition Guide opens if it is yours.', function () { location.reload(); }, 'login');
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
        a.showAuthModal('Create your account, then get the Nutrition Guide for $11. Buying it makes you a member.', go, 'signup');
        return;
      }
      if (m === 'points') unlockPoints(jb); else buyNow(jb);
    }
  });
  document.addEventListener('change', function (e) {
    var el = e.target.closest && e.target.closest('[data-check]'); if (!el) return;
    var c = checks(), k = el.getAttribute('data-check');
    if (el.checked) c[k] = 1; else delete c[k];
    store('nt_checks', JSON.stringify(c));
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
    if (window.VEGuideArt) { var art = VEGuideArt('theo', 'square'); if (art) box.style.backgroundImage = "url('" + art + "')"; }
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
