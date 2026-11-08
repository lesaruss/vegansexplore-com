/* The Holiday Guide (canon-ve-holiday-guide, LOCKED by Sean 2026-11-07, playbook ve-holiday-guide). Built on the Nutrition Guide's
 * files (the Dairy Guide family, docs/guides/BUILD-A-GUIDE.md).
 *
 * One Guide that grows holiday by holiday, the holidays at hand first. Free and public. Theo stays on the right of every tab; his lines
 * are text drafts for Sean (docs/proposals/holiday-guide-theo-lines.md) and are recorded only once approved. The address bar carries the
 * view (#/menus, #/menus/<chapter>, #/giveback/listing/<slug>).
 *
 *   Overview       what the Guide is, the holidays coming up with their countdowns, what each tab holds
 *   ThanksLiving   the five ways to celebrate (canon), the word is shared, the National Day of Mourning
 *   Recipes        a full ThanksLiving table to cook at home (#/recipes/<key>), drafts for Sean
 *   At the store   plant-based roasts, gravy, butter, cream and desserts on shelves this season, by brand (Directory links)
 *   Listen         the family panel (Victoria Moran, Renee King-Sonnen, Susan Hargreaves), our holiday episodes, then
 *                  other shows' holiday episodes from their feeds (ve_topic_episodes 'holiday')
 *   Menus          live holiday menus from ve-holiday `live`, by chapter, 100% Vegan first; Save keeps the place in My Saves
 *   Events         ThanksLiving and Thanksgiving events, sanctuary dinners and potlucks on our calendar; Submit an event
 *                  (organizers' own event titles show as written, Friendsgiving included; our own copy,
 *                   lines, emails and video never use the word: Sean, 2026-11-08)
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
    '&or=(title.ilike.*thanksliving*,title.ilike.*thanksgiving*,title.ilike.*turkeys*,title.ilike.*friendsgiving*,description.ilike.*thanksliving*)&order=starts_at.asc&limit=200';
  var LR_TAGS = ['lesaruss-ai-directory', 'lesaruss-ai-directory-candidate', 'lesaruss-ai-business-member'];
  function ours(list) { return (Array.isArray(list) ? list : []).filter(function (l) { return !(l.tags || []).some(function (t) { return LR_TAGS.indexOf(t) >= 0; }); }); }

  // Theo's lines, text drafts for Sean (no recordings yet). `say` for visitors, `sayMember` for members.
  var TABS = [
    { k: 'overview', label: 'Overview', say: 'Welcome to the Holiday Guide. I\'m Theo. You\'re the one setting the table this year, and I\'m here to help you do it your way.',
      sayMember: 'Welcome back. Start with ThanksLiving, find a holiday menu near you, and save the places you want to order from.' },
    { k: 'thanksliving', label: 'ThanksLiving', pic: '/public/guides/holiday/theo-thanksliving.jpg', say: 'ThanksLiving is Thanksgiving with a fully plant-based table. Same family, same gratitude, nobody harmed. On this page you\'ll find a few easy ideas to make it yours, whether you host or bring one dish.' },
    { k: 'recipes', parent: 'thanksliving', label: 'Recipes', say: 'Cooking this year? Here is a full ThanksLiving table you can make at home: a savory loaf, gravy, mashed potatoes, stuffing, cranberry sauce, green beans and pumpkin pie.' },
    { k: 'store', parent: 'thanksliving', label: 'At the Store', say: 'Short on time? These are the plant-based roasts, gravies, butters, creams and desserts you can find at the store this season. Read the label, and check your store before you go.' },
    { k: 'menus', parent: 'thanksliving', label: 'Holiday Menus', say: 'Don\'t want to cook it all? Pick your chapter and see which Vegan places are cooking for the holiday, what they\'re offering, and when to order by. Our team checks every menu before it shows. Save one to find it again. Know a place we missed? Tell us, and we\'ll check it.' },
    { k: 'events', parent: 'thanksliving', label: 'Events', say: 'Rather be at someone else\'s table? Find sanctuary dinners, potlucks and Thanksgiving events on our calendar. Hosting one? Add it, so people can find you.' },
    { k: 'listen', parent: 'thanksliving', label: 'Listen', say: 'Going home for the holidays? Listen to Victoria Moran, Renee King-Sonnen and Susan Hargreaves on talking with family, and more from our shows and others.' },
    { k: 'giveback', label: 'Give Back', say: 'Giving is part of the season. Here are the nonprofits, rescues and sanctuaries doing the work, in your city and beyond. Giving Tuesday is December first.' },
    { k: 'business', label: 'For Businesses', say: 'Run a Vegan business? Send us your holiday menu and we\'ll feature it here, free for members. ThanksLiving menus close at the end of November eighteenth.' }
  ];
  // Theo's recordings (Sean approved the script v2, 2026-11-08): one per video chapter, roster voice aFyw0oiXW7dzKF4o7woX, each checked with stt.
  // The Overview plays the whole tour back to back; every other tab plays its own chapter (canon-ve-guide-tour-standard: Summarize this page).
  var AUDIO_BASE = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/voices/holiday-guide/theo-tour-';
  var CHAPTER_LINES = ["Welcome to the Holiday Guide. I'm Theo. You're the one setting the table this year, and I'm here to help you do it your way.", "Vegans Explore has been bringing the Vegan community together since 2016, city by city. We know the places cooking near you and the groups doing good. This Guide puts all of it in one spot for the holidays, free.", "ThanksLiving is Thanksgiving with a fully plant-based table. Same family, same gratitude, nobody harmed. On this page you'll find a few easy ideas to make it yours, whether you host or bring one dish.", "Don't want to cook it all? Pick your chapter and see which Vegan places are cooking for the holiday, what they're offering, and when to order by. Our team checks every menu before it shows. Save one to find it again. Know a place we missed? Tell us, and we'll check it.", "Rather be at someone else's table? Find sanctuary dinners, potlucks and Thanksgiving events on our calendar. Hosting one? Add it, so people can find you.", "Giving is part of the season. Here are the nonprofits, rescues and sanctuaries doing the work, in your city and beyond. Giving Tuesday is December first.", "Run a Vegan business? Send us your holiday menu and we'll feature it here, free for members. ThanksLiving menus close at the end of November eighteenth.", "This Guide keeps growing. Each holiday opens here as it gets close, so be on the lookout for the next one. Come back often, and share it with whoever's at your table this year. Happy holidays."];
  var TAB_CH = { overview: [1, 2, 3, 4, 5, 6, 7, 8], thanksliving: [3], menus: [4], events: [5], giveback: [6], business: [7] };
  // Each ThanksLiving page has its own summary video in Theo's frame (Sean, 2026-11-08): his voice for that page, b-roll of what is on it,
  // music under it, 4:5. Play plays the video in place of the voice alone; captions are on. A new video is a row here.
  var VIDEO_BASE = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/guides/holiday/video/theo-';
  var VIDEO = { thanksliving: 'v1', recipes: 'v1', store: 'v1', menus: 'v1', events: 'v1', listen: 'v1' };
  var RULE_ICON = [
    '<path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/>',
    '<path d="M3 11h18M5 11a7 5 0 0114 0M12 4v2M4 15h16l-1.5 4h-13z"/>',
    '<path d="M4 5h16v10H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
    '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M12 8v13M5 13v8h14v-8M12 8c-2-4-6-4-6-1s6 1 6 1zm0 0c2-4 6-4 6-1s-6 1-6 1z"/>',
    '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h5"/>'
  ];
  var RULE_PIC = ['w-thanks.jpg', 'w-table.jpg', 'w-say.jpg', 'w-give.jpg', 'w-reflect.jpg'];
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
  var HOLS = null, MENUS = null, TIPS = null, EVENTS = null, GIVE = null, SAVED = {};
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
  // Every tab about one holiday sits under it (Sean, 2026-11-08: "most of the items in the navigation belong under Thanksgiving"):
  // the top row shows the holidays and the Guide-wide tabs; a holiday's own sections open from its page, the phone menu groups them.
  function topOf(k) { return tab(k).parent || k; }
  function drawMenu(cur) {
    var top = topOf(cur);
    menuEl.innerHTML = TABS.filter(function (t) { return !t.parent; }).map(function (t) { return '<a href="' + href(t.k) + '"' + (t.k === top ? ' aria-current="page"' : '') + '>' + esc(t.label) + '</a>'; }).join('');
    menuSel.innerHTML = TABS.filter(function (t) { return !t.parent; }).map(function (t) {
      var kids = TABS.filter(function (c) { return c.parent === t.k; });
      function opt(o, label) { return '<option value="' + o.k + '"' + (o.k === cur ? ' selected' : '') + '>' + esc(label || o.label) + '</option>'; }
      if (!kids.length) return opt(t);
      return '<optgroup label="' + esc(t.label) + '">' + opt(t, t.label + ' Ideas') + kids.map(function (c) { return opt(c); }).join('') + '</optgroup>';
    }).join('');
  }
  menuSel.addEventListener('change', function () { location.hash = href(menuSel.value); });
  var curView = 'overview';
  function crumb(parts) {
    var par = tab(curView).parent;
    if (par && curView !== par && !(parts[0] && parts[0][0] === tab(par).label)) parts = [[tab(par).label, href(par)]].concat(parts);
    return '<div class="dg-crumb"><a href="#/">Holiday Guide</a>' + parts.map(function (p) { return ' &rsaquo; ' + (p[1] ? '<a href="' + p[1] + '">' + esc(tc(p[0])) + '</a>' : esc(tc(p[0]))); }).join('') + '</div>';
  }
  // ThanksLiving's own row (Sean, 2026-11-08: "keep the recipes, at the store, holiday menus, events, and listen button visible... so people
  // can easily navigate between the ThanksLiving pages"): on the holiday's page and each of its sections, under the crumb. A dropdown since
  // 2026-11-08 (Sean: the picture pills were hard to read and competed with At the Store's shelf chips).
  function subnav(cur) {
    var par = tab(cur).parent || cur, kids = TABS.filter(function (c) { return c.parent === par; });
    if (!kids.length) return '';
    var items = [tab(par)].concat(kids);
    return '<div class="hg-sub"><label class="hg-sub-l" for="hgSubSel">' + esc(tab(par).label) + '</label><select id="hgSubSel" class="dg-sort hg-subsel">' + items.map(function (c) {
      return '<option value="' + c.k + '"' + (c.k === cur ? ' selected' : '') + '>' + esc(c.k === par ? 'Ideas' : c.label) + '</option>';
    }).join('') + '</select></div>';
  }
  // Every title in this Guide has a capital on each word (Sean, 2026-11-08: "Holiday Menus Near You"); small joining words stay lower case.
  var SMALL = /^(a|an|the|and|or|of|to|at|in|on|for|by|with|from|as)$/i;
  function tc(t) {
    return String(t).split(' ').map(function (w, i) {
      if (i && SMALL.test(w)) return w.toLowerCase();
      return w.split('-').map(function (x) { return x ? x.charAt(0).toUpperCase() + x.slice(1) : x; }).join('-');
    }).join(' ');
  }
  function head(k, h, lede, right) {
    return '<div class="dg-head"><div><div class="dg-k">' + esc(k) + '</div><h2 class="dg-h1">' + (/</.test(h) ? h : tc(h)) + '</h2></div>' + (right || '') + '</div>' + (lede ? '<p class="dg-lede">' + lede + '</p>' : '');
  }
  function row(o) {
    return '<div class="dg-srow"' + (o.href ? ' data-href="' + o.href + '"' : '') + '>' +
      '<div class="dg-srow-b"><h3>' + (o.href ? '<a href="' + o.href + '">' + esc(tc(o.title)) + '</a>' : esc(tc(o.title))) + '</h3>' + (o.body || '') + '</div></div>';
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
    { label: 'ThanksLiving · November 26', line: 'Easy ideas for the table, recipes, what to pick up at the store, a Vegan place to order from, events, and what to listen to on the way.', kids: ['thanksliving', 'recipes', 'store', 'menus', 'events', 'listen'] },
    { label: 'Give Back', line: 'The nonprofits, rescues and sanctuaries doing the work. Giving Tuesday is December 1.', kids: ['giveback'] },
    { label: 'Run a Business?', line: 'Send your holiday menu and we feature it here, free for members.', kids: ['business'] }
  ];
  var PILL_PIC = { recipes: 'r-loaf.jpg', store: 'p-store.jpg', listen: 'p-listen.jpg', thanksliving: 'p-thanks.jpg', events: 'p-events.jpg', menus: 'p-menus.jpg', giveback: 'p-giveback.jpg', business: 'p-business.jpg' };
  function groupRows() {
    return GROUPS.map(function (g) {
      return '<section class="rg-grow"><h3>' + esc(g.label) + '</h3><p>' + esc(g.line) + '</p><div class="rg-pills">' + g.kids.map(function (k) {
        return '<a class="rg-pill" href="' + href(k) + '"><span class="rg-pill-pic"><img src="' + PIC + PILL_PIC[k] + '" alt="" loading="lazy" width="60" height="60"></span><span>' + esc(k === 'thanksliving' ? 'Ideas for the Table' : tab(k).label) + '</span></a>';
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
    var art = '/public/guides/holiday/theo-thanksliving.jpg';
    return '<div class="hg-video"><div class="hg-vframe"' + (art ? ' style="background-image:url(\'' + esc(art) + '\')"' : '') + '>' +
      '<div class="hg-vtitle"><div class="dg-k">Watch first</div><h3>How to Use the Holiday Guide</h3><p>Theo, about a minute and a half</p></div>' +
      '<button type="button" class="hg-vplay" data-hg-video aria-label="Play the overview video"><svg width="30" height="30" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button>' +
      '<span class="hg-vbadge">Video in production</span><span class="hg-vnow" aria-live="polite"></span></div></div>';
  }

  // ---------- ThanksLiving ----------
  function viewThanksLiving() {
    var t = thanks();
    main.innerHTML = head('November 26', 'ThanksLiving', 'Thanksgiving with a full plant-based table, on ' + esc(dayFmt(onDay(t.holiday_on))) + '. Host it, bring a dish, or order from a Vegan place near you. Everything for the day is here.') +
      '<h3 class="hg-sh" style="margin:4px 0 10px">A Few Easy Ideas for Your Table</h3>' +
      '<div class="hg-rules">' + RULES.map(function (r, i) { return '<div class="hg-rule hg-pic"><div class="hg-rpic"><img src="' + PIC + RULE_PIC[i] + '" alt="" loading="lazy" width="320" height="320"><span class="n">' + (i + 1) + '</span></div><div class="hg-rb"><h3>' + esc(tc(r[0])) + '</h3><p>' + esc(r[1]) + '</p></div></div>'; }).join('') + '</div>' +
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
    if (sub === 'tell') return viewTell();
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
      adminUpload() + '<div id="hgMenuList"></div>';
    drawMenuList(ch);
    wireMenuTools(ch);
    wireAdminUpload();
  }
  // Super admins upload any place's menu from here (Sean, 2026-11-08: "processed the same way as ideas"): pick the place, then the menu
  // form opens on it, where a photo or PDF of the menu is read for us, and it waits in Depot > Holiday menus for a check like any other.
  function isAdmin() { var a = auth(), m = a && a.getMember && a.getMember(); return !!(m && m.is_superadmin); }
  function adminUpload() {
    if (!isAdmin()) return '';
    return '<details class="hg-admin"><summary>Upload a Menu <span>Team only</span></summary><p>Pick the place, then drop a photo or PDF of its menu. We read it, you check the dishes, and it waits in <a href="/admin/depot/holiday-menus">Depot &rsaquo; Holiday menus</a> for approval.</p>' +
      '<div class="hg-search"><input type="search" id="hgAq" placeholder="Find the place in the Directory..." aria-label="Find the place" autocomplete="off" data-dictate="off"></div><div id="hgAres" class="hg-ares"></div></details>';
  }
  function wireAdminUpload() {
    var q = document.getElementById('hgAq'), out = document.getElementById('hgAres'), tq;
    if (!q) return;
    q.addEventListener('input', function () {
      clearTimeout(tq);
      var v = q.value.trim().replace(/[%*,()]/g, ' ').trim();
      if (v.length < 2) { out.innerHTML = ''; return; }
      tq = setTimeout(function () {
        rest(SB + '/rest/v1/listings?select=slug,name,address_city,address_state,logo_url&status=eq.approved&name=ilike.*' + encodeURIComponent(v) + '*&order=voter_count.desc.nullslast&limit=8')
          .then(function (rows) {
            out.innerHTML = (Array.isArray(rows) && rows.length ? rows : []).map(function (l) {
              return '<a class="hg-ares-r" href="/business/holiday-menu?listing=' + encodeURIComponent(l.slug) + '&holiday=' + HOLIDAY + '&step=menu"><b>' + esc(l.name) + '</b><span>' + esc([l.address_city, l.address_state].filter(Boolean).join(', ') || 'Online') + '</span><em>Upload its menu</em></a>';
            }).join('') || '<p class="dg-srow-p">Nothing by that name. Add the place in Directory review first.</p>';
          }).catch(function () { out.innerHTML = '<p class="dg-srow-p">That did not load. Try again.</p>'; });
      }, 200);
    });
  }
  function drawMenuList(ch) {
    var box = document.getElementById('hgMenuList'); if (!box) return;
    if (MENUS === null) { box.innerHTML = '<div class="dg-loading">Loading the menus...</div>'; return; }
    var t = thanks(), open = daysUntil(t.submit_close) > 0, list = filtered(ch), any = MF.q || pills(ch).length, tips = tipsFiltered(ch);
    box.innerHTML = (list.length ? '<div class="hg-menus">' + list.map(menuCard).join('') + '</div>' :
      (MENUS.length && any ? '<div class="hg-empty"><h3>Nothing Matches</h3><p>Try fewer words or reset the filters.</p><button type="button" class="dg-btn dg-ghost" data-hg-reset>Reset filters</button></div>' :
      '<div class="hg-empty"><h3>No Holiday Menus ' + (ch === 'all' ? '' : 'in ' + esc(chapterName(ch)) + ' ') + 'Yet</h3><p>' + (open ? 'Menus are coming in now, and each one shows here once our team has checked it.' : 'Menus for this holiday are closed.') + '</p>' +
        (open ? '<a class="dg-btn dg-ghost" href="#/business">Run a business? Send your menu</a>' : '') + '</div>')) +
      (tips.length ? '<h3 style="margin:22px 0 4px;font-size:17px">Spotted by Members</h3><p class="dg-srow-p" style="margin:0 0 10px">Holiday menus our members found. Our team checked each link; order from the place directly.</p><div class="hg-menus">' + tips.map(tipCard).join('') + '</div>' : '') +
      (daysUntil(onDay(t.holiday_on)) ? '<div class="hg-tell"><div><b>Know a place cooking for ' + esc(t.name) + '?</b><p>Send us the link to its holiday menu. Our team checks it, then it shows here for everyone.</p></div><a class="dg-btn dg-ghost" href="#/menus/tell" data-hg-tell>Tell us about a menu</a></div>' : '');
  }
  // Menus members spotted (Sean, 2026-11-08): a place and a link to its own holiday menu, checked by our team, never copied.
  function tipPlace(x) { return x.listing || { address_city: x.city, address_state: x.state, communities: [] }; }
  function tipsFiltered(ch) {
    var q = MF.q.trim().toLowerCase();
    if (MF.type === 'vegan' || MF.order === 'open') return [];
    return (TIPS || []).filter(function (x) {
      if (!inChapter(tipPlace(x), ch)) return false;
      var txt = [x.place_name, x.city, x.state, x.note].join(' ').toLowerCase();
      return !q || !q.split(/\s+/).some(function (w) { return txt.indexOf(w) < 0; });
    });
  }
  function tipCard(x) {
    var l = x.listing, where = [x.city || (l && l.address_city), x.state || (l && l.address_state)].filter(Boolean).join(', ');
    var name = l ? '<a href="#/menus/listing/' + encodeURIComponent(l.slug) + '">' + esc(l.name) + '</a>' : esc(x.place_name);
    return '<div class="hg-menu"><div class="hg-mh"><div class="hg-logo"' + (l && l.logo_url ? ' style="background-image:url(\'' + esc(l.logo_url) + '\')"' : '') + '>' + (l && l.logo_url ? '' : esc(String(x.place_name || '?').charAt(0))) + '</div>' +
      '<div><h3>' + name + '</h3><small>' + esc(where || 'Online') + '</small></div></div>' +
      '<div><span class="hg-tag pv">Spotted by a member</span></div>' + (x.note ? '<p class="hg-sum">' + esc(x.note) + '</p>' : '') +
      '<div class="hg-acts"><a class="dg-btn" href="' + esc(x.link) + '" target="_blank" rel="noopener">See their holiday menu</a>' +
      (l ? '<a class="dg-btn dg-ghost" href="/directory/' + encodeURIComponent(l.slug) + '">Their page</a><button type="button" class="dg-save' + (SAVED[l.id] ? ' on' : '') + '" data-hg-save="' + esc(l.id) + '" aria-pressed="' + !!SAVED[l.id] + '">' + (SAVED[l.id] ? 'Saved' : 'Save') + '</button>' : '') + '</div></div>';
  }
  // Tell us about a menu: members only (a join window first), checked by our team before it shows.
  function viewTell() {
    var t = thanks();
    main.innerHTML = crumb([['Holiday menus', '#/menus'], ['Tell us about a menu']]) + head(t.name, 'Tell us about a holiday menu',
      'Found a place near you cooking for ' + esc(t.name) + '? Send us where to see its menu. Our team checks the link, and then it shows on Holiday menus for everyone.');
    if (!member()) {
      main.innerHTML += '<div class="hg-empty"><h3>Members Tell Us About Menus</h3><p>Join free with a short survey, then send it. It comes back here when you are done.</p><button type="button" class="dg-btn" data-hg-tell>Join free</button></div>';
      return;
    }
    main.innerHTML += '<form class="hg-form" id="hgTell" novalidate>' +
      '<label><span>The place</span><input id="tPlace" maxlength="120" required autocomplete="off" placeholder="Its name" list="tPlaceList"><datalist id="tPlaceList"></datalist></label>' +
      '<div class="hg-f2"><label><span>City</span><input id="tCity" maxlength="80" autocomplete="off"></label><label><span>State</span><input id="tState" maxlength="40" autocomplete="off"></label></div>' +
      '<label><span>Link to the holiday menu</span><input id="tLink" type="url" inputmode="url" maxlength="500" required placeholder="https://"><small>Their website, an order page or the post where they shared it.</small></label>' +
      '<label><span>Anything we should know? (optional)</span><textarea id="tNote" maxlength="400" rows="3" placeholder="Order by date, pickup only, 100% Vegan..."></textarea></label>' +
      '<div class="dg-btns"><button type="submit" class="dg-btn" id="tSend">Send it to our team</button><a class="dg-btn dg-ghost" href="#/menus">Back to menus</a></div><p class="hg-fmsg" id="tMsg" role="status"></p></form>';
    wireTell(t);
  }
  var TELL_PLACES = {};
  function wireTell(t) {
    var f = document.getElementById('hgTell'), place = document.getElementById('tPlace'), dl = document.getElementById('tPlaceList'), tq;
    place.addEventListener('input', function () {
      clearTimeout(tq); var q = place.value.trim(); if (q.length < 3) return;
      tq = setTimeout(function () {
        rest(SB + '/rest/v1/listings?select=id,name,address_city,address_state&status=eq.approved&name=ilike.*' + encodeURIComponent(q.replace(/[*,()]/g, ' ')) + '*&limit=8').then(function (d) {
          TELL_PLACES = {};
          dl.innerHTML = (Array.isArray(d) ? d : []).map(function (l) { TELL_PLACES[l.name] = l; return '<option value="' + esc(l.name) + '">' + esc([l.address_city, l.address_state].filter(Boolean).join(', ')) + '</option>'; }).join('');
        }).catch(function () {});
      }, 220);
    });
    place.addEventListener('change', function () { var l = TELL_PLACES[place.value]; if (l) { document.getElementById('tCity').value = l.address_city || ''; document.getElementById('tState').value = l.address_state || ''; } });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.getElementById('tMsg'), btn = document.getElementById('tSend'), link = document.getElementById('tLink').value.trim();
      if (place.value.trim().length < 2) { msg.textContent = 'Add the name of the place.'; return; }
      if (!/^(https?:\/\/)?[^\s.]+\.[^\s]+$/i.test(link)) { msg.textContent = 'Add the link to its holiday menu.'; return; }
      var l = TELL_PLACES[place.value];
      btn.disabled = true; msg.textContent = 'Sending...';
      var a = auth();
      fetch(HOLIDAY_FN, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: 'Bearer ' + (a && a.getToken ? a.getToken() : '') },
        body: JSON.stringify({ action: 'tip', holiday: HOLIDAY, place_name: place.value.trim(), city: document.getElementById('tCity').value.trim(), state: document.getElementById('tState').value.trim(),
          link: link, note: document.getElementById('tNote').value.trim(), listing_id: l ? l.id : null }) })
        .then(function (r) { return r.json(); }).then(function (d) {
          if (d && d.ok) {
            main.innerHTML = crumb([['Holiday menus', '#/menus'], ['Tell us about a menu']]) + '<div class="hg-empty"><h3>' + (d.already ? 'We Already Have That One' : d.status === 'live' ? 'It Is on Holiday Menus Now' : 'Thank You. Our Team Will Check It') + '</h3><p>' +
              (d.already ? 'Someone sent that menu already, so it is in our team\'s hands.' : d.status === 'live' ? 'You are on the team, so it went live at once.' : 'Once it is checked it shows on Holiday menus for everyone.') + '</p><div class="dg-btns" style="justify-content:center"><a class="dg-btn" href="#/menus/tell" onclick="setTimeout(function(){window.dispatchEvent(new HashChangeEvent(\'hashchange\'))},0)">Tell us about another</a><a class="dg-btn dg-ghost" href="#/menus">Back to menus</a></div></div>';
            if (d.status === 'live') hol('live', { holiday: HOLIDAY }).then(function (x) { MENUS = (x && x.menus) || MENUS; TIPS = (x && x.tips) || TIPS; });
            return;
          }
          var E = { rate_limited: 'That is plenty for today. Thank you! Try again tomorrow.', link_needed: 'That link did not work. Check it and try again.', place_needed: 'Add the name of the place.', member_needed: 'Join free first, then send it.', closed: 'This holiday has passed.', not_authenticated: 'Sign in again, then send it.' };
          msg.textContent = E[d && d.error] || 'That did not go through. Try again.'; btn.disabled = false;
        }).catch(function () { msg.textContent = 'That did not go through. Try again.'; btn.disabled = false; });
    });
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

  // ---------- Recipes ----------
  // A full ThanksLiving table to cook at home (Sean, 2026-11-08: "come up with some recipes"). Drafts written for this Guide, not yet
  // kitchen-tested by our team; Sean reads them before the branch goes to main. Pictures are illustrations (public/guides/holiday/r-*.jpg).
  var RECIPES = [
    { k: 'loaf', name: 'Lentil and mushroom loaf', course: 'The main', pic: 'r-loaf.jpg', serves: 'Serves 6', time: '1 hour 30 minutes',
      line: 'A savory centerpiece you can slice at the table, with a sweet and tangy glaze.',
      ing: ['1 cup dry brown or green lentils (or 2 1/2 cups cooked)', '2 tbsp ground flaxseed and 5 tbsp water', '2 tbsp olive oil', '1 onion, diced', '2 carrots, diced', '2 celery stalks, diced', '8 oz cremini mushrooms, chopped', '3 garlic cloves, minced', '1 tsp dried thyme', '1 tsp dried sage', '2 tbsp soy sauce or tamari', '1 cup rolled oats', '1/2 cup breadcrumbs', 'Salt and pepper', 'Glaze: 1/3 cup ketchup, 1 tbsp maple syrup, 1 tbsp balsamic vinegar'],
      steps: ['Simmer the lentils in 3 cups of water for 20 to 25 minutes, until tender. Drain.', 'Stir the flaxseed into the water and let it sit 10 minutes to thicken.', 'Heat the oven to 375°F and line a 9 by 5 inch loaf pan with parchment.', 'Cook the onion, carrots and celery in the oil for 6 to 8 minutes. Add the mushrooms and cook until their liquid is gone, about 8 minutes. Add the garlic, thyme and sage for 1 minute, then the soy sauce.', 'Pulse half the lentils with the oats in a food processor until coarse. Mix with the vegetables, the rest of the lentils, the flax and the breadcrumbs. Season to taste.', 'Press firmly into the pan. Stir the glaze together and spread it on top.', 'Bake 45 to 50 minutes, until firm. Rest 15 minutes before lifting it out and slicing.'] },
    { k: 'gravy', name: 'Mushroom gravy', course: 'Gravy', pic: 'r-gravy.jpg', serves: 'About 3 cups', time: '25 minutes',
      line: 'Rich and savory, for the loaf, the potatoes and everything else.',
      ing: ['3 tbsp plant butter or olive oil', '1 small onion, minced', '8 oz mushrooms, finely chopped', '2 garlic cloves, minced', '1/4 cup all-purpose flour', '2 1/2 cups vegetable broth', '2 tbsp soy sauce or tamari', '1 tsp fresh thyme (or 1/2 tsp dried)', 'Black pepper'],
      steps: ['Melt the butter and cook the onion for 4 minutes.', 'Add the mushrooms and cook until browned, 6 to 8 minutes. Add the garlic for 1 minute.', 'Stir in the flour and cook 1 to 2 minutes.', 'Whisk in the broth a little at a time, then the soy sauce and thyme.', 'Simmer 5 to 8 minutes, stirring, until thick. Add pepper. Blend some or all of it if you like it smooth.'] },
    { k: 'mash', name: 'Garlic mashed potatoes', course: 'Side', pic: 'r-mash.jpg', serves: 'Serves 6', time: '30 minutes',
      line: 'Creamy and buttery, with no dairy in sight.',
      ing: ['3 lb Yukon Gold potatoes, peeled and cubed', '4 garlic cloves, peeled', '4 tbsp plant butter', '3/4 to 1 cup unsweetened plain oat or soy milk, warmed', 'Salt', 'Chopped chives'],
      steps: ['Cover the potatoes and garlic with cold salted water and bring to a boil.', 'Simmer 15 to 20 minutes, until a fork slides in easily. Drain.', 'Mash with the garlic, butter and warm milk, adding milk until it is as creamy as you like.', 'Season with salt and top with chives.'] },
    { k: 'stuffing', name: 'Herb bread stuffing', course: 'Side', pic: 'r-stuffing.jpg', serves: 'Serves 8', time: '1 hour',
      line: 'Crisp on top, soft underneath, full of sage and thyme.',
      ing: ['1 lb day-old bread, cut in cubes (about 12 cups; check the label for milk, eggs or honey)', '6 tbsp plant butter', '1 large onion, diced', '3 celery stalks, diced', '2 tbsp fresh sage, chopped (or 2 tsp dried)', '1 tbsp fresh thyme (or 1 tsp dried)', '1/4 cup parsley, chopped', '2 to 2 1/2 cups vegetable broth', 'Salt and pepper'],
      steps: ['If the bread is fresh, dry the cubes in a 300°F oven for 15 to 20 minutes.', 'Heat the oven to 375°F and grease a 9 by 13 inch dish.', 'Melt the butter and cook the onion and celery 8 to 10 minutes. Add the herbs for 1 minute.', 'Toss with the bread. Pour in broth until moist but not soggy. Season.', 'Bake covered for 20 minutes, then uncovered 20 to 25 minutes, until golden.'] },
    { k: 'cranberry', name: 'Orange cranberry sauce', course: 'Side', pic: 'r-cranberry.jpg', serves: 'About 2 cups', time: '15 minutes, plus cooling',
      line: 'Bright and tart. Make it a day ahead.',
      ing: ['12 oz fresh or frozen cranberries', '3/4 cup sugar or maple syrup (organic or beet sugar is never filtered with bone char)', '1/2 cup orange juice', '1/4 cup water', 'Zest of 1 orange', 'A pinch of salt'],
      steps: ['Bring the juice, water and sugar to a boil.', 'Add the cranberries and simmer about 10 minutes, until most have burst.', 'Stir in the zest and salt. It thickens as it cools.'] },
    { k: 'beans', name: 'Green beans with crispy onions', course: 'Side', pic: 'r-beans.jpg', serves: 'Serves 6', time: '25 minutes',
      line: 'All the crunch of the casserole, fresher and faster.',
      ing: ['1 1/2 lb green beans, trimmed', '2 tbsp olive oil', '3 garlic cloves, sliced', '1 tbsp lemon juice', '1/3 cup sliced almonds, toasted', '1 cup crispy fried onions (many are plant-based; check the label)', 'Salt and pepper'],
      steps: ['Boil the beans 3 to 4 minutes, then cool them in ice water and drain.', 'Warm the oil and cook the garlic for 1 minute. Add the beans and toss 3 to 4 minutes.', 'Add the lemon juice, salt and pepper.', 'Top with the almonds and crispy onions just before serving.'] },
    { k: 'pie', name: 'Pumpkin pie', course: 'Dessert', pic: 'r-pie.jpg', serves: 'One 9 inch pie', time: '1 hour 15 minutes, plus 4 hours to chill',
      line: 'Silky and spiced, set with silken tofu instead of eggs.',
      ing: ['1 plant-based 9 inch pie crust (many store crusts use lard or butter; check the label)', '15 oz can pumpkin purée', '12 oz firm silken tofu, drained', '2/3 cup brown sugar or maple syrup', '2 tbsp cornstarch', '2 tsp pumpkin pie spice', '1 tsp vanilla', '1/4 tsp salt', 'Dairy-free whipped topping, to serve'],
      steps: ['Heat the oven to 350°F.', 'Blend everything but the crust until completely smooth.', 'Pour into the crust and bake 55 to 65 minutes, until the edges are set and the center still wobbles a little. Cover the crust edge with foil if it browns too fast.', 'Cool completely, then chill at least 4 hours. Serve with whipped topping.'] }
  ];
  function viewRecipes(sub) {
    var r = RECIPES.filter(function (x) { return x.k === sub; })[0];
    if (r) {
      var i = RECIPES.indexOf(r), next = RECIPES[(i + 1) % RECIPES.length];
      main.innerHTML = crumb([['Recipes', '#/recipes'], [r.name]]) +
        '<div class="hg-rcp1"><div class="hg-rcp1-b"><div class="dg-k">' + esc(r.course) + '</div><h2 class="dg-h1">' + esc(tc(r.name)) + '</h2>' +
        '<p class="dg-lede">' + esc(r.line) + '</p><div class="hg-facts"><span><b>' + esc(r.serves) + '</b></span><span><b>Time</b> ' + esc(r.time) + '</span></div>' +
        '<h3 class="hg-sh">What You Need</h3><ul class="hg-ing">' + r.ing.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
        '<h3 class="hg-sh">How to Make It</h3><ol class="hg-steps">' + r.steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol></div>' +
        '<div class="hg-rcp1-p"><img src="' + PIC + r.pic + '" alt="" width="640" height="640"><small>Illustration</small></div></div>' +
        '<div class="dg-btns" style="margin-top:18px"><a class="dg-btn" href="#/recipes/' + next.k + '">Next: ' + esc(next.name) + '</a><a class="dg-btn dg-ghost" href="#/recipes">Every recipe</a><a class="dg-btn dg-ghost" href="#/store">Buy it instead</a></div>';
      return;
    }
    main.innerHTML = head('Cook it yourself', 'A ThanksLiving table to make at home', 'A main, gravy, four sides and a pie. Every one is plant-based, and most can be made a day ahead.') +
      '<div class="hg-rcps">' + RECIPES.map(function (x) {
        return '<a class="hg-rcp" href="#/recipes/' + x.k + '"><span class="hg-rcp-pic"><img src="' + PIC + x.pic + '" alt="" loading="lazy" width="320" height="320"></span>' +
          '<span class="hg-rcp-b"><span class="dg-k">' + esc(x.course) + '</span><b>' + esc(tc(x.name)) + '</b><span>' + esc(x.line) + '</span><small>' + esc(x.serves) + ' &middot; ' + esc(x.time) + '</small></span></a>';
      }).join('') + '</div>' +
      '<div class="hg-note"><b>Short on time?</b> Pick up a roast, a gravy or a pie <a href="#/store">at the store</a>, or <a href="#/menus">order from a Vegan place near you</a>.</div>';
  }

  // ---------- At the store ----------
  // What is on supermarket shelves this season, by brand (Sean, 2026-11-08: "do a scan of... Thanksgiving options for vegans in the
  // supermarkets"). Read from 2026 reviews and guides (VegNews, PETA's 2026 roast list, Big Box Vegan, store and brand pages); stock
  // varies by store, so the page says check before you go. `slug` is the brand's Directory listing when we have one.
  var BRAND_SLUGS = ['tofurky', 'fieldroast', 'gardein', 'country-crock-plant-butter', 'miyokos', 'earth-balance', 'silk', 'so-delicious', 'whole-foods-market'];
  var BRAND_URL = SB + '/rest/v1/listings?select=slug,name,logo_url&status=eq.approved&slug=in.(' + BRAND_SLUGS.join(',') + ')';
  var BRANDS = {};
  var STORE = [
    { h: 'The Main', pic: 'r-loaf.jpg', items: [
      ['Tofurky', 'Plant-Based Roast & Gravy', 'tofurky', 'The most widely stocked roast, with gravy in the box.'],
      ['Field Roast', 'Celebration Roast', 'fieldroast', 'A stuffed roast that slices like a holiday centerpiece.'],
      ['Field Roast', 'Hazelnut & Cranberry Roast en Croûte', 'fieldroast', 'Wrapped in puff pastry. No gravy in the box.'],
      ['Gardein', 'Turk\'y Roast', 'gardein', 'Stuffed with brown and wild rice, cranberries and kale, with gravy.']] },
    { h: 'Gravy and Stuffing', pic: 'r-gravy.jpg', items: [
      ['Imagine', 'Organic Vegan Wild Mushroom Gravy', '', 'A carton gravy, in the soup and broth aisle.'],
      ['Primal Kitchen', 'No Dairy Mushroom Gravy', '', 'Look for it at Whole Foods and other stores.'],
      ['Stuffing mixes', 'Boxed and bagged stuffing', '', 'Many are plant-based once made with plant butter and vegetable broth. Read the label for milk, butter or chicken fat.']] },
    { h: 'Butter and Cream', pic: 'r-mash.jpg', items: [
      ['Country Crock', 'Plant Butter', 'country-crock-plant-butter', 'Sticks and tubs for mashing and baking.'],
      ['Miyoko\'s', 'Cultured Vegan Butter', 'miyokos', 'A rich cultured butter for the table.'],
      ['Earth Balance', 'Buttery Sticks', 'earth-balance', 'A classic for pie crusts and stuffing.'],
      ['Country Crock', 'Dairy Free Heavy Whipping Cream', 'country-crock-plant-butter', 'Swaps one for one; it whips best very cold.'],
      ['Silk', 'Dairy-Free Heavy Whipping Cream Alternative', 'silk', 'For cooking, baking and whipping.']] },
    { h: 'Dessert', pic: 'r-pie.jpg', items: [
      ['So Delicious', 'CocoWhip', 'so-delicious', 'A coconut whipped topping for the pie.'],
      ['Reddi-wip', 'Dairy-free whipped topping', '', 'The can, made with almond or coconut. Check that the can says dairy-free.'],
      ['Wholly Wholesome', 'Dairy-free pumpkin pie', '', 'In some stores\' freezers.'],
      ['Whole Foods Market', 'Bakery pies marked vegan', 'whole-foods-market', 'Look for the pies marked vegan in the bakery.']] }
  ];
  function brandLogo(slug, name) {
    // Field Roast's Directory logo is a Chao cheese picture (set 2026-11-01), so it shows its letter here until the logo is fixed.
    var l = slug && slug !== 'fieldroast' && BRANDS[slug];
    return '<span class="hg-blogo"' + (l && l.logo_url ? ' style="background-image:url(\'' + esc(l.logo_url) + '\')"' : '') + '>' + (l && l.logo_url ? '' : esc(name.charAt(0))) + '</span>';
  }
  // At the Store (Sean, 2026-11-08: "a filter system where people can choose the categories... and search for items. They can also
  // suggest items as feedback"): a search, the shelves as chips (any number on, none means every shelf), and Suggest an item, sent to
  // ve-feedback as kind "missing" (Depot > Feedback and the Inbox), the Events Guide's Gear way.
  var SF = { q: '', cats: {} };
  function viewStore() {
    main.innerHTML = head('At the store', 'Plant-based at the supermarket', 'Roasts, gravy, butter, cream and dessert you can pick up this season. Stock changes by store and by week, so check before you go and read the label.') +
      '<div class="hg-tools2"><div class="hg-search"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#525252" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
      '<input type="search" id="hgSq" placeholder="Search brands and items..." aria-label="Search the store list" value="' + esc(SF.q) + '" autocomplete="off" data-dictate="off"></div></div>' +
      '<div class="hg-chips" role="group" aria-label="Shelves"><button type="button" class="hg-chip" data-hg-cat=""' + (Object.keys(SF.cats).length ? '' : ' aria-pressed="true"') + '>All</button>' +
      STORE.map(function (g) { return '<button type="button" class="hg-chip" data-hg-cat="' + esc(g.h) + '" aria-pressed="' + (SF.cats[g.h] ? 'true' : 'false') + '"><img src="' + PIC + g.pic + '" alt="" width="40" height="40">' + esc(g.h) + '</button>'; }).join('') + '</div>' +
      '<div id="hgStoreList"></div>' +
      '<div class="hg-note"><b>Not back this year:</b> Trader Joe\'s Breaded Turkey-less Stuffed Roast. The chain told VegNews in October 2026 that it has no plans to bring it back.</div>' +
      storeSuggest() +
      '<div class="dg-btns"><a class="dg-btn" href="#/recipes">Or cook it yourself</a><a class="dg-btn dg-ghost" href="#/menus">Order from a Vegan place</a></div>';
    drawStoreList();
    var q = document.getElementById('hgSq'), tq;
    q.addEventListener('input', function () { SF.q = q.value; clearTimeout(tq); tq = setTimeout(drawStoreList, 120); });
    Array.prototype.forEach.call(main.querySelectorAll('[data-hg-cat]'), function (b) {
      b.addEventListener('click', function () {
        var c = b.getAttribute('data-hg-cat');
        if (!c) SF.cats = {}; else if (SF.cats[c]) delete SF.cats[c]; else SF.cats[c] = 1;
        var none = !Object.keys(SF.cats).length;
        Array.prototype.forEach.call(main.querySelectorAll('[data-hg-cat]'), function (x) { var k = x.getAttribute('data-hg-cat'); x.setAttribute('aria-pressed', String(k ? !!SF.cats[k] : none)); });
        drawStoreList();
      });
    });
    wireStoreSuggest();
  }
  function drawStoreList() {
    var box = document.getElementById('hgStoreList'); if (!box) return;
    var words = SF.q.trim().toLowerCase().split(/\s+/).filter(Boolean), any = Object.keys(SF.cats).length;
    var html = STORE.filter(function (g) { return !any || SF.cats[g.h]; }).map(function (g) {
      var items = g.items.filter(function (it) { var t = (it[0] + ' ' + it[1] + ' ' + it[3] + ' ' + g.h).toLowerCase(); return !words.some(function (w) { return t.indexOf(w) < 0; }); });
      if (!items.length) return '';
      return '<section class="hg-shelf"><div class="hg-shelf-h"><img src="' + PIC + g.pic + '" alt="" loading="lazy" width="64" height="64"><h3>' + esc(g.h) + '</h3></div><div class="hg-prods">' +
        items.map(function (it) {
          var link = it[2] && BRANDS[it[2]] ? '<a href="/directory/' + encodeURIComponent(it[2]) + '">Their page</a>' : '';
          return '<div class="hg-prod">' + brandLogo(it[2], it[0]) + '<div><small>' + esc(it[0]) + '</small><b>' + esc(it[1]) + '</b><p>' + esc(it[3]) + '</p>' + link + '</div></div>';
        }).join('') + '</div></section>';
    }).join('');
    box.innerHTML = html || '<div class="hg-empty"><h3>Nothing Matches</h3><p>Try fewer words or another shelf. Know one we are missing? Suggest it below.</p></div>';
  }
  function storeSuggest() {
    return '<section class="hg-sug"><h3>Suggest an Item</h3><p>Found a plant-based roast, gravy or pie on a shelf near you that is not here? Tell us. Our team checks it, and the good ones go on the list for everyone.</p>' +
      '<form class="hg-sugf" novalidate><label>What is it? (brand and item)<input name="item" maxlength="160" required placeholder="Brand and item"></label>' +
      '<label>Where you saw it (optional)<input name="where" maxlength="160" placeholder="Store and city"></label>' +
      '<label>Your email, if you want a reply (optional)<input name="email" type="email" maxlength="200"></label>' +
      '<div class="dg-btns" style="margin:0"><button class="dg-btn" type="submit">Send it</button></div><p class="dg-srow-p" data-smsg style="margin:0"></p></form></section>';
  }
  function wireStoreSuggest() {
    var f = main.querySelector('.hg-sugf'); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var item = f.item.value.trim(), msg = f.querySelector('[data-smsg]'), btn = f.querySelector('button');
      if (!item) { msg.textContent = 'Tell us the brand and the item.'; return; }
      var text = '[Holiday Guide store suggestion] ' + item + (f.where.value.trim() ? '\nWhere: ' + f.where.value.trim() : '');
      var vid = ''; try { vid = localStorage.getItem('ve_visitor') || ''; } catch (x) {}
      btn.disabled = true; msg.textContent = 'Sending...';
      fetch(SB + '/functions/v1/ve-feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_url: location.origin + '/guides/holiday-guide#/store', page_label: 'Holiday Guide: At the Store', kind: 'missing', message: text, email: f.email.value.trim(), visitor: vid, viewport: innerWidth + 'x' + innerHeight }) })
        .then(function (r) { return r.json(); }).then(function (d) {
          if (!d || !d.ok) throw d;
          f.reset(); msg.textContent = 'Thank you. It is with our team.';
        }).catch(function () { msg.textContent = 'That did not send. Try again in a minute.'; }).then(function () { btn.disabled = false; });
    });
  }

  // ---------- Listen ----------
  // Our episodes on family and the holidays, played in place (the Dairy and Restaurant Guides' way: VEEpisodes.row, the player docked
  // above the list), then the newest holiday episodes from other podcasts in our Directory (ve_topic_episodes 'holiday',
  // migration 20261108_topic_episodes_holiday.sql). [show's Directory slug, the episode's guid in that show's feed, why it is here]
  var FAMILY = [
    ['vegans-explore-podcast', 'a0952840-5a66-40ac-9906-086eb987b91b', 'Victoria Moran, Renee King-Sonnen and Susan Hargreaves on family pressure, patience and confidence.'],
    ['soflo-vegans-podcast', '9a20c9c7-ca50-4119-ba17-02435718c5a8', 'The same three on talking with family and friends after going Vegan.']
  ];
  var MORE = [
    ['vegans-who-lift-podcast', '6dc3bdeb-9afb-4fe0-add5-1d6fb789a9dc'],
    ['vegans-who-lift-podcast', '31b055d0-6254-439d-ba87-e983c39a57d4'],
    ['vegans-explore-podcast', '779f25d1-b411-4985-bde4-6a59deba0589'],
    ['vegans-who-lift-podcast', 'a5abef33-bf9e-401e-bb4a-4f83d95df330'],
    ['soflo-vegans-podcast', 'tag:soundcloud,2010:tracks/748790878'],
    ['vegans-explore-podcast', '0fd66432-82e8-4afc-9f1f-3cabaa3ecaff']
  ];
  // Matched on a title word, so a few are not about the holidays (a guest named Holiday, a show's break notice); those stay out.
  var OTHER_SKIP = /ryan holiday|holiday pause|podcast break|gaz oakley/i;
  var PODCAST_FN = SB + '/functions/v1/ve-podcast';
  var SHOWS_URL = SB + '/rest/v1/listings?select=id,slug,name,logo_url&status=eq.approved&slug=in.(vegans-explore-podcast,soflo-vegans-podcast,vegans-who-lift-podcast)';
  var LISTEN = null, OTHERS = null;
  function feedEp(show, guid) {
    return fetch(PODCAST_FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'episode', slug: show, guid: guid }) })
      .then(function (r) { return r.json(); }).then(function (d) { return d && d.episode; }).catch(function () { return null; });
  }
  function loadListen(then) {
    var picks = FAMILY.concat(MORE);
    Promise.all([rest(SHOWS_URL).catch(function () { return []; }), Promise.all(picks.map(function (x) { return feedEp(x[0], x[1]); })),
      fetch(SB + '/rest/v1/rpc/ve_topic_episodes', { method: 'POST', headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_topic: 'holiday', p_limit: 24 }) })
        .then(function (r) { return r.json(); }).catch(function () { return []; })]).then(function (r) {
      var shows = Array.isArray(r[0]) ? r[0] : [];
      LISTEN = picks.map(function (x, i) {
        var show = shows.filter(function (y) { return y.slug === x[0]; })[0], ep = r[1][i];
        return show && ep && ep.audio ? { show: show, ep: ep, why: x[2] || '', family: i < FAMILY.length } : null;
      }).filter(Boolean);
      OTHERS = (Array.isArray(r[2]) ? r[2] : []).filter(function (o) { return o && o.show && o.episode && o.episode.audio && !OTHER_SKIP.test(o.episode.title || ''); });
      then();
    });
  }
  function epRow(p) {
    if (!window.VEEpisodes) return '';
    var show = { name: p.show.name, slug: p.show.slug, image: p.show.logo_url || '' };
    return VEEpisodes.row(Object.assign({}, p.ep, { summary: '', image: show.image || p.ep.image || '' }), show, { showName: true });
  }
  function otherRow(o) {
    if (!window.VEEpisodes) return '';
    var show = { name: o.show.name, slug: o.show.slug, image: o.show.image || '' };
    return VEEpisodes.row(Object.assign({}, o.episode, { summary: '', image: show.image || o.episode.image || '' }), show,
      { showName: true, acts: '<a class="vep-btn" href="/directory/' + encodeURIComponent(o.show.slug) + '" target="_blank" rel="noopener">The show</a>' });
  }
  function playEp(key) {
    var g = String(key).split('|').slice(1).join('|');
    var p = (LISTEN || []).filter(function (x) { return x.ep.guid === g; })[0];
    if (p) { VEEpisodes.play(Object.assign({}, p.ep, { image: p.show.logo_url || p.ep.image || '' }), { name: p.show.name, image: p.show.logo_url || '' }); return; }
    var o = (OTHERS || []).filter(function (x) { return x.episode.guid === g; })[0];
    if (o) VEEpisodes.play(Object.assign({}, o.episode, { image: o.show.image || o.episode.image || '' }), { name: o.show.name, image: o.show.image || '' });
  }
  // A redraw would drop a playing episode: the player moves into the new dock, or to the foot of the window (the Dairy Guide's way).
  function keepPlayer(bar) {
    if (!bar) return;
    var cur = document.getElementById('vep-player');
    if (cur && cur !== bar) { var old = bar.querySelector('audio'); if (old) old.pause(); return; }
    var dock = main.querySelector('.vep-dock[data-vep-always]');
    if (dock) { bar.classList.add('docked'); document.body.classList.remove('vep-on'); dock.appendChild(bar); }
    else { bar.classList.remove('docked'); document.body.classList.add('vep-on'); document.body.appendChild(bar); }
  }
  // Listen (Sean, 2026-11-08): the picture sits beside the title and the line, and the episodes start right under it (no Start here card).
  function listenHead(lede) {
    return '<div class="hg-lhead"><div>' + head('Listen', 'Holiday Listening', lede) + '</div><img src="' + PIC + 'p-listen.jpg" alt="" width="320" height="320"></div>';
  }
  function viewListen() {
    var lede = 'Going home for the holidays? Victoria Moran of Main Street Vegan, Renee King-Sonnen of Rowdy Girl Sanctuary and Susan Hargreaves of Animal Hero Kids on family, friends and the holiday table, then more from our shows. Press Play to listen right here.';
    if (LISTEN === null) { main.innerHTML = listenHead(lede) + '<div class="dg-loading">Loading episodes...</div>'; return; }
    var fam = LISTEN.filter(function (x) { return x.family; }), more = LISTEN.filter(function (x) { return !x.family; });
    main.innerHTML = listenHead(lede) + '<div class="vep-dock" data-vep-always></div>' +
      (fam.length ? '<h3 class="dg-eps-h">Talking With Family</h3><div class="dg-eps"><div class="vep-list">' + fam.map(epRow).join('') + '</div></div>' : '') +
      (more.length ? '<h3 class="dg-eps-h">More From Our Shows</h3><div class="dg-eps"><div class="vep-list">' + more.map(epRow).join('') + '</div></div>' : '') +
      (OTHERS && OTHERS.length ? '<h3 class="dg-eps-h">From Other Shows</h3><p class="dg-eps-sub">The newest holiday episodes from the podcasts in our Directory.</p><div class="dg-eps"><div class="vep-list">' + OTHERS.map(otherRow).join('') + '</div></div>' : '');
  }

  // ---------- Events ----------
  // Each event wears the calendar's date tile in front (Sean, 2026-11-08: "just like we have on the events"; .vev-date in public/ve-events.js).
  function dayMonth(e) {
    var d = new Date(e.starts_at), tz = e.timezone || 'America/New_York';
    try { return [d.toLocaleString('en-US', { day: 'numeric', timeZone: tz }), d.toLocaleString('en-US', { month: 'short', timeZone: tz })]; }
    catch (x) { return [d.getDate(), d.toLocaleString('en-US', { month: 'short' })]; }
  }
  // Events are every Vegan event we know of, chapter or not (Sean, 2026-11-08), so the region list is built from the events
  // themselves: a US state, else the country, else Online. Only regions with an event show. The pick is in the address (#/events/<region>).
  var US_STATES = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'Washington, D.C.', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming' };
  function evRegion(e) {
    if (e.event_type === 'virtual' && !e.city) return 'Online';
    var c = (e.country || '').trim(), st = (e.state || '').trim();
    var us = !c || /^(us|usa|u\.s\.a?\.?|united states( of america)?)$/i.test(c);
    if (us && st) return US_STATES[st.toUpperCase()] || st;
    if (c && !us) return c === 'GB' || /^uk$/i.test(c) ? 'United Kingdom' : c;
    return e.event_type === 'virtual' ? 'Online' : 'Other places';
  }
  function slugify(t) { return String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function viewEvents(sub) {
    var lede = 'Sanctuary dinners, Vegan potlucks and Thanksgiving events on our calendar.';
    var btns = '<div class="hg-evtop"><a class="dg-btn hg-sm" href="/events#submit/1">Add your event</a><a class="dg-btn dg-ghost hg-sm" href="/events">The whole calendar</a></div>';
    if (EVENTS === null) { main.innerHTML = head('Events', 'Holiday Events', lede) + btns + '<div class="dg-loading">Loading events...</div>'; return; }
    var counts = {};
    EVENTS.forEach(function (e) { var r = evRegion(e); counts[r] = (counts[r] || 0) + 1; });
    var regions = Object.keys(counts).sort(function (x, y) { var o = function (r) { return r === 'Online' || r === 'Other places' ? 1 : 0; }; return o(x) - o(y) || x.localeCompare(y); });
    var cur = sub && regions.filter(function (r) { return slugify(r) === sub; })[0] || '';
    var list = cur ? EVENTS.filter(function (e) { return evRegion(e) === cur; }) : EVENTS;
    var pick = regions.length > 1 ? '<select class="dg-sort hg-evsel" id="hgEvRegion" aria-label="Region"><option value="">Everywhere (' + EVENTS.length + ')</option>' +
      regions.map(function (r) { return '<option value="' + slugify(r) + '"' + (r === cur ? ' selected' : '') + '>' + esc(r) + ' (' + counts[r] + ')</option>'; }).join('') + '</select>' : '';
    main.innerHTML = head('Events', 'Holiday Events', lede) +
      '<div class="hg-evbar">' + pick + btns + '</div>' +
      (list.length ? '<div class="hg-evs">' + list.map(function (e) {
        var when = e.time_set === false ? dayFmt(e.starts_at, { weekday: 'short', month: 'long', day: 'numeric' }) + ', time to be announced'
          : new Date(e.starts_at).toLocaleString('en-US', { timeZone: e.timezone || 'America/New_York', weekday: 'short', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
        var where = e.event_type === 'virtual' ? 'Online' : [e.location_name, e.city, e.state].filter(Boolean).join(', '), dm = dayMonth(e), url = '/events?event=' + e.id;
        return '<a class="hg-ev" href="' + url + '"><span class="hg-evd" aria-hidden="true"><b>' + esc(dm[0]) + '</b><small>' + esc(dm[1]) + '</small></span>' +
          '<span class="hg-evb"><b>' + esc(e.title) + '</b><span>' + esc(when) + (where ? ' &middot; ' + esc(where) : '') + '</span></span></a>';
      }).join('') + '</div>' : '<div class="hg-empty"><h3>No Holiday Events on the Calendar Yet</h3><p>Hosting a ThanksLiving dinner or a potluck? Add it to our calendar and people near you can find it.</p></div>');
    var sel = document.getElementById('hgEvRegion');
    if (sel) sel.addEventListener('change', function () { location.hash = '#/events' + (sel.value ? '/' + sel.value : ''); });
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
      (rest2.length ? '<h3 style="margin:18px 0 10px;font-size:16px">In Our Directory</h3>' + cards(rest2.slice(0, 60), 'hgGive') : '<div class="hg-empty"><h3>None ' + (ch === 'all' ? '' : 'in ' + esc(chapterName(ch)) + ' ') + 'Yet</h3></div>') +
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
  var playBtn = document.getElementById('dgPlay'), aud = new Audio(), PLAY = { tab: null, list: [], at: 0, playing: false, started: false };
  aud.preload = 'none';
  function playAt() {
    var n = PLAY.list[PLAY.at];
    aud.src = AUDIO_BASE + n + '-v1.mp3';
    bubble.textContent = CHAPTER_LINES[n - 1];
    var now = document.querySelector('.hg-vnow');
    if (now) now.textContent = curTab === 'overview' ? 'Chapter ' + n + ' of 8: ' + VIDEO_CHAPTERS[n - 1] : '';
    aud.play().then(function () { PLAY.playing = true; paintPlay(); }).catch(function () { PLAY.playing = false; paintPlay(); });
  }
  aud.addEventListener('ended', function () {
    if (PLAY.at < PLAY.list.length - 1) { PLAY.at++; playAt(); return; }
    PLAY.playing = false; PLAY.at = 0; paintPlay();
  });
  var vid = null;
  function stopTheo() { try { aud.pause(); } catch (e) {} try { if (vid) vid.pause(); } catch (e) {} PLAY.playing = false; }
  // The page's video sits in Theo's frame; his still picture is its poster until Play.
  function setVideo(box) {
    var v = VIDEO[curTab];
    if (!v) { if (vid) { vid.pause(); vid.remove(); vid = null; box.removeAttribute('data-vid'); } return; }
    if (box.getAttribute('data-vid') === curTab && vid) return;
    if (vid) { vid.pause(); vid.remove(); }
    vid = document.createElement('video');
    vid.playsInline = true; vid.preload = 'none'; vid.setAttribute('playsinline', '');
    vid.poster = '/public/guides/holiday/theo-thanksliving.jpg';
    vid.src = VIDEO_BASE + curTab + '-' + v + '.mp4';
    vid.setAttribute('aria-label', 'Theo summarizes the ' + tab(curTab).label + ' page');
    vid.innerHTML = '<track kind="captions" srclang="en" label="English" default src="/public/guides/holiday/video/theo-' + curTab + '-' + v + '.vtt">';
    vid.addEventListener('play', function () { PLAY.tab = curTab; PLAY.playing = true; paintPlay(); try { gtag('event', 'video_start', { video: 'holiday_' + curTab }); } catch (e) {} });
    vid.addEventListener('pause', function () { PLAY.playing = false; paintPlay(); });
    vid.addEventListener('ended', function () { PLAY.playing = false; paintPlay(); try { gtag('event', 'video_complete', { video: 'holiday_' + curTab }); } catch (e) {} });
    vid.addEventListener('click', function () { if (vid.paused) { PLAY.started = true; vid.play().catch(function () {}); } else vid.pause(); });
    // On phones the card is small and Theo's words already show beside it, so captions show from tablet width up.
    try { vid.textTracks[0].mode = window.innerWidth > 900 ? 'showing' : 'hidden'; } catch (e) {}
    box.appendChild(vid); box.setAttribute('data-vid', curTab);
  }
  function paintPlay() {
    var list = TAB_CH[curTab] || (VIDEO[curTab] ? [0] : null);
    playBtn.hidden = !list;
    playBtn.classList.toggle('go', !PLAY.started);
    playBtn.innerHTML = PLAY.playing ? 'Pause Theo' : '&#9654; ' + (curTab === 'overview' ? 'Play the tour' : 'Play Theo');
  }
  playBtn.addEventListener('click', function () {
    if (PLAY.playing) { stopTheo(); paintPlay(); return; }
    PLAY.started = true;
    if (VIDEO[curTab] && vid) { try { aud.pause(); } catch (e) {} vid.play().catch(function () {}); return; }
    if (PLAY.tab !== curTab || !PLAY.list.length) { PLAY.tab = curTab; PLAY.list = TAB_CH[curTab] || []; PLAY.at = 0; }
    if (!PLAY.list.length) return;
    if (aud.src && PLAY.tab === curTab && aud.currentTime > 0 && !aud.ended) aud.play().then(function () { PLAY.playing = true; paintPlay(); }).catch(function () {});
    else playAt();
  });
  function drawTheo() {
    var t = tab(curTab), i = 0;
    TABS.forEach(function (x, n) { if (x.k === curTab) i = n; });
    // Nothing plays on its own; a new tab stops what was playing, and Play starts that tab's chapter.
    if (PLAY.tab !== curTab) { stopTheo(); PLAY.tab = null; PLAY.list = []; PLAY.at = 0; aud.removeAttribute('src'); }
    paintPlay();
    if (PLAY.playing && PLAY.tab === curTab) return;
    bubble.textContent = member() && t.sayMember ? t.sayMember : t.say;
    // Theo dresses for the page he is on (Sean, 2026-11-07): a holiday tab carries its own picture, every other tab his usual one.
    var box = document.getElementById('dgMaya'), art = t.pic || (window.VEGuideArt ? VEGuideArt('theo', 'square') : '');
    if (art && box.getAttribute('data-art') !== art) { box.style.backgroundImage = "url('" + art + "')"; box.setAttribute('data-art', art); }
    setVideo(box);
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
    var V = { overview: viewOverview, thanksliving: viewThanksLiving, recipes: function () { viewRecipes(sub); }, store: viewStore, listen: viewListen, menus: function () { viewMenus(sub); }, events: function () { viewEvents(sub); }, giveback: function () { viewGiveBack(sub); }, business: viewBusiness };
    if (!V[view]) view = 'overview';
    document.body.classList.toggle('dg-member', member());
    drawJoinbox(); drawMenu(view);
    var bar = document.getElementById('vep-player');
    curView = view;
    V[view]();
    if (tab(view).parent && !main.querySelector('.dg-crumb')) main.insertAdjacentHTML('afterbegin', crumb([[tab(view).label]]));
    var sub = subnav(view);
    if (sub) { var cr = main.querySelector('.dg-crumb'); if (cr && cr.parentNode === main) cr.insertAdjacentHTML('afterend', sub); else main.insertAdjacentHTML('afterbegin', sub); var ss = main.querySelector('#hgSubSel'); if (ss) ss.addEventListener('change', function () { location.hash = href(ss.value); }); }
    keepPlayer(bar);
    curTab = view; drawTheo();
    main.scrollTop = 0; if (!document.documentElement.classList.contains('dg-fit') || window.innerWidth <= 900) window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  // ---------- joining at a moment of intent ----------
  function goSurvey() {
    var p = null; try { p = JSON.parse(recall('hg_pending') || 'null'); } catch (e) {}
    try { sessionStorage.setItem('ve_after_survey', '/guides/holiday-guide' + (p && p.tell ? '#/menus/tell' : '')); } catch (e) {}
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
      '<h3 id="hgJoinT" style="margin:0 0 8px;font-size:20px">' + esc(tc(title)) + '</h3><p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:rgba(26,26,26,.78)">' + esc(text) + '</p>' +
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
    if (e.target.closest('[data-hg-tell]') && !member()) {
      e.preventDefault();
      store('hg_pending', JSON.stringify({ tell: 1, at: Date.now() }));
      joinWindow('Tell us about a menu', 'Join free with a short survey, then send us the menu. You come right back here.');
      return;
    }
    // Until the video is made, its Play runs Theo's recorded tour (the same chapters) from the rail.
    if (e.target.closest('[data-hg-video]')) { var vb = document.querySelector('.hg-vbadge'); if (vb) vb.textContent = 'Video coming. Theo is reading it to you now.'; if (!PLAY.playing) playBtn.click(); return; }
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
    if ((el = e.target.closest('[data-vep-play]')) && el.closest('#dgMain')) { e.preventDefault(); e.stopPropagation(); playEp(el.getAttribute('data-vep-play')); return; }
    if ((el = e.target.closest('.dg-srow[data-href]')) && !e.target.closest('a,button')) { location.href = el.getAttribute('data-href'); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeJoin(); });

  // ---------- data ----------
  function loadAll() {
    var again = function (re) { return function () { if (re.test(curTab)) route(); }; };
    hol('holidays').then(function (d) { HOLS = (d && d.holidays) || []; }).catch(function () { HOLS = []; }).then(function () { route(); });
    hol('live', { holiday: HOLIDAY }).then(function (d) { MENUS = (d && d.menus) || []; TIPS = (d && d.tips) || []; }).catch(function () { MENUS = []; TIPS = []; }).then(function () { if (curTab === 'menus') drawMenuList(chapter(null)); });
    rest(EVENTS_URL).then(function (d) { EVENTS = Array.isArray(d) ? d : []; }).catch(function () { EVENTS = []; }).then(again(/^events$/));
    rest(GIVE_URL).then(function (d) { GIVE = ours(d); }).catch(function () { GIVE = []; }).then(again(/^giveback$/));
    rest(BRAND_URL).then(function (d) { (Array.isArray(d) ? d : []).forEach(function (l) { BRANDS[l.slug] = l; }); }).catch(function () {}).then(again(/^store$/));
    loadListen(again(/^listen$/));
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
    if (window.VEEpisodes) VEEpisodes.css();
    document.documentElement.classList.add('dg-fit');
    var box = document.getElementById('dgMaya');
    if (window.VEGuideArt) { var art = VEGuideArt('theo', 'square'); if (art) box.style.backgroundImage = "url('" + art + "')"; }
    route();
    loadAll();
  }
  if (window.VEAuth) init(); else window.addEventListener('load', init);
})();
