/* The Holiday Guide (canon-ve-holiday-guide, LOCKED by Sean 2026-11-07, playbook ve-holiday-guide). Built on the Nutrition Guide's
 * files (the Dairy Guide family, docs/guides/BUILD-A-GUIDE.md).
 *
 * One Guide that grows holiday by holiday, the holidays at hand first. Free and public. Theo stays on the right of every tab; his lines
 * are text drafts for Sean (docs/proposals/holiday-guide-theo-lines.md) and are recorded only once approved. The address bar carries the
 * view (#/menus, #/menus/<chapter>, #/giveback/listing/<slug>).
 *
 *   Overview       what the Guide is, the holidays coming up with their countdowns, what each tab holds
 *   ThanksLiving   the five ways to celebrate (canon), the word is shared, the National Day of Mourning
 *   Menus          live holiday menus from ve-holiday `live`, by chapter, 100% Vegan first; Save keeps the place in My Saves
 *   Events         ThanksLiving, Thanksgiving and Friendsgiving events on our calendar; Submit an event
 *   Give back      Nonprofit Partners first, then the Directory's nonprofits, rescues and sanctuaries (Giving Tuesday, December 1)
 *   Businesses     how a business sends its holiday menu (/business/holiday-menu), with the deadline
 *
 * Join prompts only at a moment of intent (Save, Join free): one short window, what they tapped is kept (localStorage hg_pending) and
 * saved once they are back in as a member (the Explorer survey sends them back through sessionStorage ve_after_survey).
 */
(function () {
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var HOLIDAY_FN = SB + '/functions/v1/ve-holiday';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var VE_TENANT = '00000000-0000-4000-a000-000000000002';
  var HOLIDAY = 'thanksliving';
  var FIELDS = window.VERegionDirectory ? VERegionDirectory.FIELDS : 'id,slug,name,category,logo_url,vote_count,address_city,address_state,color,vegan_status,communities,tags,extra_categories';
  var GIVE_CATS = ['Nonprofits', 'Rescues', 'Sanctuaries'];
  var GIVE_URL = SB + '/rest/v1/listings?select=' + FIELDS + '&status=eq.approved&or=(category.in.(' + GIVE_CATS.join(',') + '),extra_categories.ov.{' + GIVE_CATS.join(',') + '})&order=vote_count.desc.nullslast,name.asc&limit=600';
  var EVENTS_URL = SB + '/rest/v1/events?select=id,title,starts_at,timezone,location_name,city,state,country,event_type,time_set&status=eq.approved&tenant_id=eq.' + VE_TENANT +
    '&starts_at=gte.' + new Date(Date.now() - 864e5).toISOString() + '&starts_at=lte.2026-12-02T05:00:00Z' +
    '&or=(title.ilike.*thanksliving*,title.ilike.*thanksgiving*,title.ilike.*friendsgiving*,title.ilike.*turkeys*,description.ilike.*thanksliving*)&order=starts_at.asc&limit=200';
  var LR_TAGS = ['lesaruss-ai-directory', 'lesaruss-ai-directory-candidate', 'lesaruss-ai-business-member'];
  function ours(list) { return (Array.isArray(list) ? list : []).filter(function (l) { return !(l.tags || []).some(function (t) { return LR_TAGS.indexOf(t) >= 0; }); }); }

  // Theo's lines, text drafts for Sean (no recordings yet). `say` for visitors, `sayMember` for members.
  var TABS = [
    { k: 'overview', label: 'Overview', say: 'I\'m Theo. The holidays are about the people at the table. This Guide helps you find Vegan holiday menus near you, celebrate in a way that feels good, and give back. It\'s free, and it grows with every holiday.',
      sayMember: 'Welcome back. Start with ThanksLiving, find a holiday menu near you, and save the places you want to order from.' },
    { k: 'thanksliving', label: 'ThanksLiving', pic: '/public/guides/holiday/theo-thanksliving.jpg', say: 'ThanksLiving is Thanksgiving with a full plant-based table. Five simple ways to make it yours, whether you host or you\'re a guest.' },
    { k: 'menus', label: 'Holiday menus', say: 'Vegan places near you are cooking for the holiday. Pick your chapter, see what they\'re offering and when to order by. Save one to find it again.' },
    { k: 'events', label: 'Events', say: 'Sanctuary dinners, potlucks and Friendsgivings. If you\'re hosting one, add it to our calendar so people can find it.' },
    { k: 'giveback', label: 'Give back', say: 'Giving is part of the season. Here are the nonprofits, rescues and sanctuaries in our Directory. Giving Tuesday is December first.' },
    { k: 'business', label: 'For businesses', say: 'Cooking for the holidays? Send us your menu and we feature it here, free for members. ThanksLiving menus close November eighteenth.' }
  ];
  var RULE_ICON = [
    '<path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/>',
    '<path d="M3 11h18M5 11a7 5 0 0114 0M12 4v2M4 15h16l-1.5 4h-13z"/>',
    '<path d="M4 5h16v10H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
    '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M12 8v13M5 13v8h14v-8M12 8c-2-4-6-4-6-1s6 1 6 1zm0 0c2-4 6-4 6-1s-6 1-6 1z"/>',
    '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h5"/>'
  ];
  var RULES = [
    ['Three thanks', 'Before you eat, everyone names three things they are thankful for: a person, a place, and a thing on the table.'],
    ['The Gratitude Table', 'Share a plant-based meal with the people you love. Hosting or bringing one dish, every plate on the table is kind to the animals.'],
    ['Say it out loud', 'Tell someone what they mean to you, at the table or by a call or a message. Thanks said out loud lands differently.'],
    ['Give back', 'Give a little to a sanctuary, rescue or nonprofit doing the work, or give your time. Our Give back tab lists them.'],
    ['Start your reflection', 'Write down what this year taught you and what you want next year to hold. Keep it, and read it again next ThanksLiving.']
  ];

  var S = 'stroke="#1f5f22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  function ic(path) { return '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + '>' + path + '</svg>'; }
  var ICON = {
    thanksliving: ic('<path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/>'),
    menus: ic('<path d="M7 3v8a2 2 0 002 2v8M5 3v5M9 3v5M16 3c-1.7 0-3 2-3 5s1.3 4 3 4v9"/>'),
    events: ic('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    giveback: ic('<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M12 8v13M5 13v8h14v-8M12 8c-2-4-6-4-6-1s6 1 6 1zm0 0c2-4 6-4 6-1s-6 1-6 1z"/>'),
    business: ic('<path d="M3 9l1.5-5h15L21 9M3 9h18v2a3 3 0 01-6 0 3 3 0 01-6 0 3 3 0 01-6 0zM5 13v8h14v-8"/>')
  };

  var main = document.getElementById('dgMain');
  var menuEl = document.getElementById('dgMenu'), menuSel = document.getElementById('dgMenuSelect');
  var HOLS = null, MENUS = null, EVENTS = null, GIVE = null, SAVED = {};
  var curTab = 'overview';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function auth() { return window.VEAuth || null; }
  function member() { var a = auth(); return !!(a && a.isLoggedIn && a.isLoggedIn()); }
  function tab(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i].k === k) return TABS[i]; return TABS[0]; }
  function href(k) { return '#/' + (k === 'overview' ? '' : k); }
  function store(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function recall(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function rest(url) { return fetch(url, { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } }).then(function (r) { return r.json(); }); }
  function hol(action, extra) {
    return fetch(HOLIDAY_FN, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: ANON_KEY }, body: JSON.stringify(Object.assign({ action: action }, extra || {})) })
      .then(function (r) { return r.json(); });
  }

  // ---------- dates (Eastern) ----------
  function dayFmt(d, o) { return new Date(d).toLocaleDateString('en-US', Object.assign({ timeZone: 'America/New_York' }, o || { weekday: 'long', month: 'long', day: 'numeric' })); }
  function daysUntil(iso) { var ms = new Date(iso).getTime() - Date.now(); return ms <= 0 ? 0 : Math.ceil(ms / 864e5); }
  function thanks() { return (HOLS || []).filter(function (h) { return h.slug === HOLIDAY; })[0] || { slug: HOLIDAY, name: 'ThanksLiving (Thanksgiving)', holiday_on: '2026-11-26', submit_close: '2026-11-19T05:00:00Z' }; }
  // A date-only value (holiday_on) is a day in Eastern time; noon keeps it on the right day.
  function onDay(d) { return d.length === 10 ? d + 'T17:00:00Z' : d; }
  // submit_close is the moment menus are refused; the last day to send is the day before, in Eastern time.
  function lastDay(close) { return dayFmt(new Date(new Date(close).getTime() - 60000), { month: 'long', day: 'numeric' }); }

  // ---------- tabs ----------
  function drawMenu(cur) {
    menuEl.innerHTML = TABS.map(function (t) { return '<a href="' + href(t.k) + '"' + (t.k === cur ? ' aria-current="page"' : '') + '>' + esc(t.label) + '</a>'; }).join('');
    menuSel.innerHTML = TABS.map(function (t) { return '<option value="' + t.k + '"' + (t.k === cur ? ' selected' : '') + '>' + esc(t.label) + '</option>'; }).join('');
  }
  menuSel.addEventListener('change', function () { location.hash = href(menuSel.value); });
  function crumb(parts) {
    return '<div class="dg-crumb"><a href="#/">Holiday Guide</a>' + parts.map(function (p) { return ' &rsaquo; ' + (p[1] ? '<a href="' + p[1] + '">' + esc(p[0]) + '</a>' : esc(p[0])); }).join('') + '</div>';
  }
  function head(k, h, lede, right) {
    return '<div class="dg-head"><div><div class="dg-k">' + esc(k) + '</div><h2 class="dg-h1">' + h + '</h2></div>' + (right || '') + '</div>' + (lede ? '<p class="dg-lede">' + lede + '</p>' : '');
  }
  function row(o) {
    return '<div class="dg-srow"' + (o.href ? ' data-href="' + o.href + '"' : '') + '>' +
      '<div class="dg-srow-b"><h3>' + (o.href ? '<a href="' + o.href + '">' + esc(o.title) + '</a>' : esc(o.title)) + '</h3>' + (o.body || '') + '</div></div>';
  }
  function countdown() {
    var t = thanks();
    return '<div class="hg-count"><div><b>' + daysUntil(onDay(t.holiday_on)) + '</b><small>days to ThanksLiving</small></div>' +
      (daysUntil(t.submit_close) ? '<div><b>' + daysUntil(t.submit_close) + '</b><small>days to send a menu</small></div>' : '') + '</div>';
  }

  // ---------- chapters (VE_HUBS) ----------
  function chapters() { return window.VE_HUBS || []; }
  function chapterOk(c) { return c === 'all' || chapters().some(function (h) { return h.slug === c; }); }
  function chapter(fromUrl) {
    if (fromUrl && chapterOk(fromUrl)) { store('hg_chapter', fromUrl); return fromUrl; }
    var c = recall('hg_chapter'); return c && chapterOk(c) ? c : 'all';
  }
  function inChapter(l, slug) {
    if (slug === 'all') return true;
    var c = l.communities || [];
    if (c.indexOf('all') >= 0 || c.indexOf(slug) >= 0) return true;
    var h = chapters().filter(function (x) { return x.slug === slug; })[0];
    if (!h || !h.match || (!h.match.cities && !h.match.states) || (!l.address_city && !l.address_state)) return false;
    if (h.match.cities && h.match.cities.indexOf(l.address_city) < 0) return false;
    if (h.match.states && h.match.states.indexOf(l.address_state) < 0) return false;
    return true;
  }
  function chapterPick(id, cur) {
    return '<select class="dg-sort ng-pick" id="' + id + '" aria-label="Chapter"><option value="all"' + (cur === 'all' ? ' selected' : '') + '>Every chapter</option>' +
      chapters().map(function (h) { return '<option value="' + h.slug + '"' + (h.slug === cur ? ' selected' : '') + '>' + esc(h.name) + '</option>'; }).join('') + '</select>';
  }
  function chapterName(slug) { var h = chapters().filter(function (x) { return x.slug === slug; })[0]; return h ? h.name : 'every chapter'; }

  // ---------- Overview ----------
  // The Overview (Sean, 2026-11-07): the video, then the Restaurant Guide's look under it: Start here (public/ve-guide-intro.js), one
  // button with a short note, then the Guide's sections as headings with a line and picture pills.
  var PIC = '/public/guides/holiday/';
  var GROUPS = [
    { label: 'Celebrate', line: 'Five simple ways to make ThanksLiving yours, and where people are gathering.', kids: ['thanksliving', 'events'] },
    { label: 'Order your table', line: 'What Vegan places near you are cooking, and when to order by.', kids: ['menus'] },
    { label: 'Give back', line: 'The nonprofits, rescues and sanctuaries doing the work. Giving Tuesday is December 1.', kids: ['giveback'] },
    { label: 'Run a business?', line: 'Send your holiday menu and we feature it here, free for members.', kids: ['business'] }
  ];
  var PILL_PIC = { thanksliving: 'p-thanks.jpg', events: 'p-events.jpg', menus: 'p-menus.jpg', giveback: 'p-giveback.jpg', business: 'p-business.jpg' };
  function groupRows() {
    return GROUPS.map(function (g) {
      return '<section class="rg-grow"><h3>' + esc(g.label) + '</h3><p>' + esc(g.line) + '</p><div class="rg-pills">' + g.kids.map(function (k) {
        return '<a class="rg-pill" href="' + href(k) + '"><span class="rg-pill-pic"><img src="' + PIC + PILL_PIC[k] + '" alt="" loading="lazy" width="60" height="60"></span><span>' + esc(tab(k).label) + '</span></a>';
      }).join('') + '</div></section>';
    }).join('');
  }
  function viewOverview() {
    var t = thanks(), d = daysUntil(onDay(t.holiday_on)), c = daysUntil(t.submit_close);
    var start = window.VEGuideIntro ? VEGuideIntro.html({
      place: 'This Guide is for anyone celebrating the holidays the Vegan way, whether you host, bring a dish or order your table.',
      why: ['The holidays are about the people at the table.', 'Vegans Explore has covered the Vegan community since 2016, city by city, so we know the places cooking near you and the groups doing good.'],
      change: 'you will have a plan for ' + t.name + ', a place to order from if you want one, and a way to give back.',
      how: member() ? 'pick a section below. Save the places you want to order from and find them in My Saves.' : 'watch the video, then pick a section below. Everything is free to read; join free to save places.',
      pic: PIC + 'start.jpg' }) : '';
    main.innerHTML = head('Free for everyone', 'Welcome to the Holiday Guide', '') + videoCard() + start +
      '<div class="dg-start" style="margin:18px 0 6px"><a class="dg-btn" href="#/menus">Find a holiday menu</a><p>' +
      (d ? d + ' days to ThanksLiving.' : 'Happy ThanksLiving.') + (c ? ' Businesses can send a menu for ' + c + ' more days.' : '') + '</p></div>' +
      groupRows();
  }

  // The Overview is a video (canon-ve-guide-tour-standard v3): Theo walks them through the Guide. Until it is made this is its
  // placeholder: the frame it will play in and its chapters, so everyone can see what is coming (Sean, 2026-11-07).
  var VIDEO_CHAPTERS = ['Welcome, I\'m Theo', 'Why this Guide, and what it does for you', 'ThanksLiving', 'Holiday menus near you', 'Events',
    'Give back', 'For businesses', 'A living Guide: what is new, and share it'];
  function videoCard() {
    var art = window.VEGuideArt ? VEGuideArt('theo', 'square') : '';
    return '<div class="hg-video"><div class="hg-vframe"' + (art ? ' style="background-image:url(\'' + esc(art) + '\')"' : '') + '>' +
      '<button type="button" class="hg-vplay" data-hg-video aria-label="Play the overview video"><svg width="30" height="30" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button>' +
      '<span class="hg-vbadge">Video in production</span></div>' +
      '<div class="hg-vside"><div class="dg-k">Watch first</div><h3>How to use the Holiday Guide</h3>' +
      '<p>Theo walks you through it in about two minutes. Until the video is ready, everything below works.</p>' +
      '<ol class="hg-vch">' + VIDEO_CHAPTERS.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ol>' +
      '<button type="button" class="dg-btn dg-ghost" data-ve-share>Share this Guide</button></div></div>';
  }

  // ---------- ThanksLiving ----------
  function viewThanksLiving() {
    var t = thanks();
    main.innerHTML = head('November 26', 'ThanksLiving', 'Thanksgiving with a full plant-based table, on ' + esc(dayFmt(onDay(t.holiday_on))) + '. Host it, bring a dish, or order from a Vegan place near you. Five ways to make it yours:') +
      '<div class="hg-rules">' + RULES.map(function (r, i) { return '<div class="hg-rule"><div class="hg-ric">' + ic(RULE_ICON[i]).replace('width="26" height="26"', 'width="30" height="30"') + '<span class="n">' + (i + 1) + '</span></div><h3>' + esc(r[0]) + '</h3><p>' + esc(r[1]) + '</p></div>'; }).join('') + '</div>' +
      '<div class="dg-btns" style="margin-top:16px"><a class="dg-btn" href="#/menus">Find a holiday menu</a><a class="dg-btn dg-ghost" href="#/events">See events</a></div>' +
      '<div class="hg-note"><b>A shared word.</b> Sanctuaries and Vegan groups have called it ThanksLiving for years, and many hold ThanksLiving dinners for the animals. We are glad to be one more place people find it.</div>' +
      '<div class="hg-note" style="background:#f6f4ef"><b>The same day is the National Day of Mourning.</b> Since 1970, United American Indians of New England have gathered in Plymouth on this day. To learn more, start with Indigenous-led voices like <a href="https://www.uaine.org/" target="_blank" rel="noopener">uaine.org</a>.</div>';
  }

  // ---------- Holiday menus ----------
  function money(s) { return s ? esc(s) : ''; }
  function menuCard(m) {
    var l = m.listing || {}, vegan = l.vegan_status === 'fully_vegan';
    var items = (m.items || []).slice(0, 20);
    var where = [l.address_city, l.address_state].filter(Boolean).join(', ');
    var saved = !!SAVED[l.id];
    return '<div class="hg-menu">' +
      '<div class="hg-mh"><div class="hg-logo"' + (l.logo_url ? ' style="background-image:url(\'' + esc(l.logo_url) + '\')"' : '') + '>' + (l.logo_url ? '' : esc((l.name || '?').charAt(0))) + '</div>' +
      '<div><h3><a href="#/menus/listing/' + encodeURIComponent(l.slug) + '">' + esc(l.name) + '</a></h3><small>' + esc(where || 'Online') + '</small></div></div>' +
      '<div><span class="hg-tag' + (vegan ? '' : ' pv') + '">' + (vegan ? '100% Vegan' : 'Plant-based (Pre-Vegan) menu') + '</span></div>' +
      (m.summary ? '<p class="hg-sum">' + esc(m.summary) + '</p>' : '') +
      (items.length ? '<div class="hg-items">' + items.map(function (it) {
        return '<div class="hg-item">' + (it.photo ? '<img src="' + esc(it.photo) + '" alt="" loading="lazy">' : '') + '<div><b>' + esc(it.name) + '</b>' + (it.desc ? '<div style="color:var(--ink55);font-size:13px">' + esc(it.desc) + '</div>' : '') + '</div>' + (it.price ? '<span>' + money(it.price) + '</span>' : '') + '</div>';
      }).join('') + '</div>' : '') +
      '<div class="hg-facts">' + (m.order_by ? '<span><b>Order by</b> ' + esc(dayFmt(onDay(m.order_by), { month: 'long', day: 'numeric' })) + '</span>' : '') +
      (m.pickup ? '<span><b>Pickup</b> ' + esc(m.pickup) + '</span>' : '') + (m.price_range ? '<span><b>Price</b> ' + esc(m.price_range) + '</span>' : '') +
      (m.holiday_hours ? '<span><b>Holiday hours</b> ' + esc(m.holiday_hours) + '</span>' : '') + '</div>' +
      '<div class="hg-acts">' + (m.order_url ? '<a class="dg-btn" href="' + esc(m.order_url) + '" target="_blank" rel="noopener">Order</a>' : '') +
      '<a class="dg-btn dg-ghost" href="/directory/' + encodeURIComponent(l.slug) + '">Their page</a>' +
      '<button type="button" class="dg-save' + (saved ? ' on' : '') + '" data-hg-save="' + esc(l.id) + '" aria-pressed="' + saved + '">' + (saved ? 'Saved' : 'Save') + '</button></div></div>';
  }
  // Search, then Filters to the right of it (the Directory and Events way): chapter, kind of menu, ordering and sort; each filter set
  // shows as a pill with an x. The chapter is kept (hg_chapter) and in the address (#/menus/<chapter>); the rest is for the visit.
  var MF = { q: '', type: 'all', order: 'all', sort: 'vegan' };
  var MF_LABEL = { type: { vegan: '100% Vegan', pv: 'Plant-based (Pre-Vegan)' }, order: { open: 'Still taking orders', online: 'Order online' }, sort: { az: 'A to Z', soon: 'Order by soonest' } };
  function today() { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  function menuText(m) { var l = m.listing || {}; return [l.name, l.address_city, l.address_state, m.summary, m.pickup].concat((m.items || []).map(function (x) { return x.name + ' ' + (x.desc || ''); })).join(' ').toLowerCase(); }
  function filtered(ch) {
    var q = MF.q.trim().toLowerCase(), t = today();
    var list = (MENUS || []).filter(function (m) {
      var l = m.listing || {}, vegan = l.vegan_status === 'fully_vegan';
      if (!inChapter(l, ch)) return false;
      if (MF.type === 'vegan' && !vegan) return false;
      if (MF.type === 'pv' && vegan) return false;
      if (MF.order === 'open' && m.order_by && m.order_by < t) return false;
      if (MF.order === 'online' && !m.order_url) return false;
      if (q && q.split(/\s+/).some(function (w) { return menuText(m).indexOf(w) < 0; })) return false;
      return true;
    });
    if (MF.sort === 'az') list.sort(function (a, b) { return String(a.listing.name).localeCompare(String(b.listing.name)); });
    if (MF.sort === 'soon') list.sort(function (a, b) { return String(a.order_by || '9999').localeCompare(String(b.order_by || '9999')); });
    return list;
  }
  function sel(id, label, cur, opts) {
    return '<label class="hg-pf"><span>' + esc(label) + '</span><select class="dg-sort" id="' + id + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === cur ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
  }
  function pills(ch) {
    var out = [];
    if (ch !== 'all') out.push(['ch', chapterName(ch)]);
    ['type', 'order', 'sort'].forEach(function (k) { var v = MF[k]; if (MF_LABEL[k][v]) out.push([k, MF_LABEL[k][v]]); });
    return out;
  }
  function viewMenus(sub) {
    if (/^listing\//.test(sub)) return viewListing(decodeURIComponent(sub.slice(8)), ['Holiday menus', '#/menus']);
    var ch = chapter(sub), t = thanks(), n = pills(ch).length;
    main.innerHTML = head(t.name, 'Holiday menus near you', 'What Vegan places are cooking for ' + esc(t.name) + '. Every menu is checked by our team before it shows.') +
      '<div class="hg-tools2"><div class="hg-search"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#525252" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
      '<input type="search" id="hgQ" placeholder="Search places, dishes, cities..." aria-label="Search holiday menus" value="' + esc(MF.q) + '" autocomplete="off" data-dictate="off"></div>' +
      '<button type="button" class="hg-fbtn" id="hgFbtn" aria-expanded="false" aria-controls="hgPop">Filters<span class="hg-fcount"' + (n ? '' : ' hidden') + '>' + n + '</span></button>' +
      '<div class="hg-pop" id="hgPop" hidden><div class="hg-pgrid">' +
        '<label class="hg-pf"><span>Chapter</span>' + chapterPick('hgChapter', ch) + '</label>' +
        sel('hgType', 'Menu', MF.type, [['all', 'Every menu'], ['vegan', '100% Vegan'], ['pv', 'Plant-based (Pre-Vegan)']]) +
        sel('hgOrder', 'Ordering', MF.order, [['all', 'Any'], ['open', 'Still taking orders'], ['online', 'Order online']]) +
        sel('hgSort', 'Sort by', MF.sort, [['vegan', '100% Vegan first'], ['az', 'A to Z'], ['soon', 'Order by soonest']]) +
      '</div><div class="hg-pfoot"><button type="button" class="dg-btn dg-ghost" data-hg-reset>Reset filters</button><button type="button" class="dg-btn" data-hg-done>Done</button></div></div></div>' +
      '<div class="hg-pills">' + pills(ch).map(function (p) { return '<button type="button" class="hg-pill" data-hg-unpill="' + p[0] + '">' + esc(p[1]) + ' <span aria-hidden="true">&times;</span></button>'; }).join('') + '</div>' +
      '<div id="hgMenuList"></div>';
    drawMenuList(ch);
    wireMenuTools(ch);
  }
  function drawMenuList(ch) {
    var box = document.getElementById('hgMenuList'); if (!box) return;
    if (MENUS === null) { box.innerHTML = '<div class="dg-loading">Loading the menus...</div>'; return; }
    var t = thanks(), open = daysUntil(t.submit_close) > 0, list = filtered(ch), any = MF.q || pills(ch).length;
    box.innerHTML = list.length ? '<div class="hg-menus">' + list.map(menuCard).join('') + '</div>' :
      (MENUS.length && any ? '<div class="hg-empty"><h3>Nothing matches</h3><p>Try fewer words or reset the filters.</p><button type="button" class="dg-btn dg-ghost" data-hg-reset>Reset filters</button></div>' :
      '<div class="hg-empty"><h3>No holiday menus ' + (ch === 'all' ? '' : 'in ' + esc(chapterName(ch)) + ' ') + 'yet</h3><p>' + (open ? 'Menus are coming in now, and each one shows here once our team has checked it. Know a place cooking for the holiday? Send them this Guide.' : 'Menus for this holiday are closed.') + '</p>' +
        (open ? '<a class="dg-btn dg-ghost" href="#/business">Run a business? Send your menu</a>' : '') + '</div>');
  }
  function wireMenuTools(ch) {
    var q = document.getElementById('hgQ'), btn = document.getElementById('hgFbtn'), pop = document.getElementById('hgPop');
    var tq; q.addEventListener('input', function () { MF.q = q.value; clearTimeout(tq); tq = setTimeout(function () { drawMenuList(ch); }, 120); });
    function show(on) { pop.hidden = !on; btn.setAttribute('aria-expanded', String(on)); }
    btn.addEventListener('click', function () { show(pop.hidden); });
    document.getElementById('hgChapter').addEventListener('change', function (e) { store('hg_chapter', e.target.value); location.hash = '#/menus/' + e.target.value; });
    [['hgType', 'type'], ['hgOrder', 'order'], ['hgSort', 'sort']].forEach(function (x) {
      document.getElementById(x[0]).addEventListener('change', function (e) { MF[x[1]] = e.target.value; viewMenus(ch); var p2 = document.getElementById('hgPop'), b2 = document.getElementById('hgFbtn'); p2.hidden = false; b2.setAttribute('aria-expanded', 'true'); });
    });
  }
  function wireChapter(view) {
    var s = document.getElementById('hgChapter');
    if (s) s.addEventListener('change', function () { store('hg_chapter', s.value); location.hash = '#/' + view + '/' + s.value; });
  }

  // ---------- Events ----------
  function viewEvents() {
    var lede = 'ThanksLiving dinners at sanctuaries, Vegan potlucks and Friendsgivings on our calendar.';
    if (EVENTS === null) { main.innerHTML = head('Events', 'Holiday events', lede) + '<div class="dg-loading">Loading events...</div>'; return; }
    main.innerHTML = head('Events', 'Holiday events', lede) +
      (EVENTS.length ? '<div class="dg-srows">' + EVENTS.map(function (e) {
        var when = e.time_set === false ? dayFmt(e.starts_at, { weekday: 'short', month: 'long', day: 'numeric' }) + ', time to be announced'
          : new Date(e.starts_at).toLocaleString('en-US', { timeZone: e.timezone || 'America/New_York', weekday: 'short', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
        var where = e.event_type === 'virtual' ? 'Online' : [e.location_name, e.city, e.state].filter(Boolean).join(', ');
        return row({ title: e.title, href: '/events?event=' + e.id, body: '<p class="dg-srow-p">' + esc(when) + (where ? ' &middot; ' + esc(where) : '') + '</p>' });
      }).join('') + '</div>' : '<div class="hg-empty"><h3>No holiday events on the calendar yet</h3><p>Hosting a ThanksLiving dinner, a potluck or a Friendsgiving? Add it to our calendar and people near you can find it.</p></div>') +
      '<div class="dg-btns" style="margin-top:16px"><a class="dg-btn" href="/events#submit/1">Add your event</a><a class="dg-btn dg-ghost" href="/events">The whole calendar</a></div>';
  }

  // ---------- Give back ----------
  function viewGiveBack(sub) {
    if (/^listing\//.test(sub)) return viewListing(decodeURIComponent(sub.slice(8)), ['Give back', '#/giveback']);
    var ch = chapter(sub && !/\//.test(sub) ? sub : null);
    var lede = 'The nonprofits, rescues and sanctuaries in our Directory. Give a little, give your time, or share them. Giving Tuesday is December 1.';
    var tools = '<div class="hg-tools">' + chapterPick('hgChapter', ch) + '</div>';
    if (GIVE === null) { main.innerHTML = head('Give back', 'Give where it counts', lede) + tools + '<div class="dg-loading">Loading...</div>'; wireChapter('giveback'); return; }
    var list = GIVE.filter(function (l) { return inChapter(l, ch); });
    var partners = list.filter(function (l) { return (l.tags || []).indexOf('ve-nonprofit-partner') >= 0; });
    var rest2 = list.filter(function (l) { return partners.indexOf(l) < 0; });
    main.innerHTML = head('Give back', 'Give where it counts', lede) + tools +
      (partners.length ? '<h3 style="margin:6px 0 10px;font-size:16px">Our Nonprofit Partners</h3>' + cards(partners, 'hgGiveP') : '') +
      (rest2.length ? '<h3 style="margin:18px 0 10px;font-size:16px">In our Directory</h3>' + cards(rest2.slice(0, 60), 'hgGive') : '<div class="hg-empty"><h3>None ' + (ch === 'all' ? '' : 'in ' + esc(chapterName(ch)) + ' ') + 'yet</h3></div>') +
      '<div class="hg-note">Each organization takes gifts on its own site. We never handle donations. Run a nonprofit? <a href="/guides/nonprofit-guide">The Nonprofit Guide</a> shows how to become a Nonprofit Partner and be featured here.</div>';
    wireChapter('giveback'); wireCards('hgGiveP'); wireCards('hgGive');
  }
  function cards(list, id) { return '<div class="vrd-root"><div class="rank-grid" id="' + id + '">' + list.map(function (l, i) { return window.VERegionDirectory ? VERegionDirectory.card(l, i) : ''; }).join('') + '</div></div>'; }
  function wireCards(id) { var g = document.getElementById(id); if (g && window.VERegionDirectory) VERegionDirectory.wire(g, function (slug) { location.hash = '#/giveback/listing/' + encodeURIComponent(slug); }); }

  // A Directory page inside the Guide, framed and sized to fit (the Nutrition Guide's way).
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

  // ---------- For businesses ----------
  function viewBusiness() {
    var t = thanks(), open = daysUntil(t.submit_close) > 0;
    var others = (HOLS || []).filter(function (h) { return h.slug !== HOLIDAY && daysUntil(h.submit_close) > 0; });
    main.innerHTML = head('For businesses', 'Feature your holiday menu',
      'Cooking for the holidays? Send us your menu, your order-by date and your holiday hours, and we feature it in this Guide, free for members. Our team checks every menu before it shows.') +
      '<div class="dg-srows">' +
      row({ title: '1. Join free', body: '<p class="dg-srow-p">A short survey makes you a member. No charge.</p>' }) +
      row({ title: '2. Claim your page', body: '<p class="dg-srow-p">Claiming your Directory page is free for members. Not listed yet? Add it free.</p>' }) +
      row({ title: '3. Send your menu', body: '<p class="dg-srow-p">Type your dishes, add photos, or drop a photo or PDF of your menu and we read it for you.</p>' }) +
      '</div>' +
      '<div class="hg-facts" style="margin-top:14px">' + (open ? '<span><b>' + esc(t.name) + '</b> menus close at the end of ' + esc(lastDay(t.submit_close)) + '</span>' : '<span><b>' + esc(t.name) + '</b> menus are closed</span>') +
      others.map(function (h) { return '<span><b>' + esc(h.name) + '</b> menus close at the end of ' + esc(lastDay(h.submit_close)) + '</span>'; }).join('') + '</div>' +
      '<div class="dg-btns" style="margin-top:16px"><a class="dg-btn" href="/business/holiday-menu">Send my holiday menu</a></div>' +
      '<div class="hg-note">A business that is not 100% Vegan can send its plant-based dishes. They show as a Plant-based (Pre-Vegan) menu.</div>';
  }

  // ---------- Theo ----------
  var tourM = document.getElementById('dgTourM'), foldBtn = document.getElementById('dgFold'), railEl = document.getElementById('dgRail');
  function setFold(folded) {
    railEl.classList.toggle('dg-folded', folded);
    foldBtn.textContent = folded ? 'Show Theo' : 'Hide Theo'; foldBtn.setAttribute('aria-expanded', String(!folded));
    try { sessionStorage.setItem('hg_theo_folded', folded ? '1' : ''); } catch (e) {}
  }
  foldBtn.addEventListener('click', function () { setFold(!railEl.classList.contains('dg-folded')); });
  try { if (sessionStorage.getItem('hg_theo_folded')) setFold(true); } catch (e) {}
  var bubble = document.getElementById('dgBubble'), tourEl = document.getElementById('dgTour');
  function drawTheo() {
    var t = tab(curTab), i = 0;
    TABS.forEach(function (x, n) { if (x.k === curTab) i = n; });
    bubble.textContent = member() && t.sayMember ? t.sayMember : t.say;
    // Theo dresses for the page he is on (Sean, 2026-11-07): a holiday tab carries its own picture, every other tab his usual one.
    var box = document.getElementById('dgMaya'), art = t.pic || (window.VEGuideArt ? VEGuideArt('theo', 'square') : '');
    if (art && box.getAttribute('data-art') !== art) { box.style.backgroundImage = "url('" + art + "')"; box.setAttribute('data-art', art); }
    tourEl.innerHTML = tourM.innerHTML = '<a class="dg-tnav" href="' + href(TABS[Math.max(0, i - 1)].k) + '"' + (i ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Back</a><span>' + (i + 1) + ' of ' + TABS.length + '</span>' +
      '<a class="dg-tnav next" href="' + href(TABS[Math.min(TABS.length - 1, i + 1)].k) + '"' + (i < TABS.length - 1 ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Next</a>';
  }

  // ---------- the header box ----------
  function drawJoinbox() {
    var btn = document.querySelector('[data-hg-join]'), jin = document.getElementById('hgJbIn');
    if (member()) { btn.textContent = 'My Saves'; jin.innerHTML = 'You\'re<br>a member'; }
    else { btn.textContent = 'Join free'; jin.innerHTML = 'Member?<br><a href="#" data-signin>Sign in</a>'; }
  }

  // ---------- router ----------
  function route() {
    var parts = (location.hash || '').replace(/^#\/?/, '').split('/');
    var view = parts[0] || 'overview', sub = parts.slice(1).join('/');
    var V = { overview: viewOverview, thanksliving: viewThanksLiving, menus: function () { viewMenus(sub); }, events: viewEvents, giveback: function () { viewGiveBack(sub); }, business: viewBusiness };
    if (!V[view]) view = 'overview';
    document.body.classList.toggle('dg-member', member());
    drawJoinbox(); drawMenu(view);
    V[view]();
    curTab = view; drawTheo();
    main.scrollTop = 0; if (!document.documentElement.classList.contains('dg-fit') || window.innerWidth <= 900) window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  // ---------- joining at a moment of intent ----------
  function goSurvey() {
    try { sessionStorage.setItem('ve_after_survey', '/guides/holiday-guide'); } catch (e) {}
    location.href = '/survey?s=explorer';
  }
  function joinWindow(title, text) {
    var w = document.getElementById('hgJoin');
    if (!w) {
      w = document.createElement('div'); w.id = 'hgJoin';
      w.setAttribute('style', 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px');
      document.body.appendChild(w);
    }
    w.innerHTML = '<div role="dialog" aria-modal="true" aria-labelledby="hgJoinT" style="background:#fff;border-radius:14px;max-width:440px;width:100%;padding:24px;font-family:Montserrat,sans-serif">' +
      '<h3 id="hgJoinT" style="margin:0 0 8px;font-size:20px">' + esc(title) + '</h3><p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:rgba(26,26,26,.78)">' + esc(text) + '</p>' +
      '<div class="dg-btns"><button type="button" class="dg-btn" data-hg-survey>Join free</button><button type="button" class="dg-btn dg-ghost" data-hg-close>Not now</button></div>' +
      '<p style="margin:14px 0 0;font-size:13px">Already a member? <a href="#" data-signin>Sign in</a></p></div>';
    w.style.display = 'flex';
    w.querySelector('[data-hg-survey]').focus();
  }
  function closeJoin() { var w = document.getElementById('hgJoin'); if (w) w.style.display = 'none'; }
  function saveListing(id, btn) {
    var a = auth(); if (!a) return;
    var on = !SAVED[id];
    if (btn) btn.disabled = true;
    (on ? a.saveListing(id) : a.unsaveListing(id)).then(function (r) {
      if (r && r.error) throw r;
      if (on) SAVED[id] = 1; else delete SAVED[id];
      [].forEach.call(document.querySelectorAll('[data-hg-save="' + id + '"]'), function (b) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.textContent = on ? 'Saved' : 'Save'; });
    }).catch(function () {}).then(function () { if (btn) btn.disabled = false; });
  }

  document.addEventListener('click', function (e) {
    var el, a = auth();
    if (e.target.closest('[data-hg-close]') || e.target.id === 'hgJoin') { closeJoin(); return; }
    if (e.target.closest('[data-hg-survey]')) { goSurvey(); return; }
    if (e.target.closest('[data-hg-video]')) { var vb = document.querySelector('.hg-vbadge'); if (vb) vb.textContent = 'The video is being made. Start below for now.'; return; }
    if (e.target.closest('[data-hg-done]')) { var pp = document.getElementById('hgPop'); if (pp) { pp.hidden = true; document.getElementById('hgFbtn').setAttribute('aria-expanded', 'false'); } return; }
    if (e.target.closest('[data-hg-reset]')) { MF = { q: '', type: 'all', order: 'all', sort: 'vegan' }; store('hg_chapter', 'all'); if (location.hash === '#/menus/all') viewMenus('all'); else location.hash = '#/menus/all'; return; }
    if ((el = e.target.closest('[data-hg-unpill]'))) {
      var k = el.getAttribute('data-hg-unpill');
      if (k === 'ch') { store('hg_chapter', 'all'); location.hash = '#/menus/all'; return; }
      MF[k] = k === 'sort' ? 'vegan' : 'all'; viewMenus(chapter(null)); return;
    }
    if ((el = e.target.closest('[data-hg-save]'))) {
      e.preventDefault();
      var id = el.getAttribute('data-hg-save');
      if (member()) { saveListing(id, el); return; }
      store('hg_pending', JSON.stringify({ save: id, at: Date.now() }));
      joinWindow('Save this place', 'Join free with a short survey and this place goes into My Saves, so you can find it again when it is time to order.');
      return;
    }
    if (e.target.closest('[data-hg-join]')) {
      if (member()) { location.href = '/dashboard/saves'; return; }
      joinWindow('Join Vegans Explore, free', 'A short survey makes you a member. Save holiday menus, vote for the places you love, and open the Guides.');
      return;
    }
    if (e.target.closest('[data-signin]')) {
      e.preventDefault(); closeJoin();
      if (a) a.showAuthModal('Sign in to save holiday menus.', function () { location.reload(); }, 'login');
      return;
    }
    if ((el = e.target.closest('.dg-srow[data-href]')) && !e.target.closest('a,button')) { location.href = el.getAttribute('data-href'); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeJoin(); });

  // ---------- data ----------
  function loadAll() {
    var again = function (re) { return function () { if (re.test(curTab)) route(); }; };
    hol('holidays').then(function (d) { HOLS = (d && d.holidays) || []; }).catch(function () { HOLS = []; }).then(function () { route(); });
    hol('live', { holiday: HOLIDAY }).then(function (d) { MENUS = (d && d.menus) || []; }).catch(function () { MENUS = []; }).then(function () { if (curTab === 'menus') drawMenuList(chapter(null)); });
    rest(EVENTS_URL).then(function (d) { EVENTS = Array.isArray(d) ? d : []; }).catch(function () { EVENTS = []; }).then(again(/^events$/));
    rest(GIVE_URL).then(function (d) { GIVE = ours(d); }).catch(function () { GIVE = []; }).then(again(/^giveback$/));
    var a = auth();
    if (member() && a.listSavedListings) {
      a.listSavedListings().then(function (d) {
        ((d && d.items) || []).forEach(function (x) { SAVED[x.id] = 1; });
        // What they tapped before joining is saved now that they are in.
        var p = null; try { p = JSON.parse(recall('hg_pending') || 'null'); } catch (e) {}
        store('hg_pending', null);
        if (p && p.save && !SAVED[p.save] && Date.now() - (p.at || 0) < 864e5) saveListing(p.save, null);
        if (curTab === 'menus') drawMenuList(chapter(null));
      }).catch(function () {});
    }
  }

  function init() {
    if (window.VERegionDirectory) VERegionDirectory.css();
    document.documentElement.classList.add('dg-fit');
    var box = document.getElementById('dgMaya');
    if (window.VEGuideArt) { var art = VEGuideArt('theo', 'square'); if (art) box.style.backgroundImage = "url('" + art + "')"; }
    route();
    loadAll();
  }
  if (window.VEAuth) init(); else window.addEventListener('load', init);
})();
