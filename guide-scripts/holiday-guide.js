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
  var GIVE_URL = SB + '/rest/v1/listings?select=' + FIELDS + ',give_url:details->>donation_url&status=eq.approved&or=(category.in.(' + GIVE_CATS.join(',') + '),extra_categories.ov.{' + GIVE_CATS.join(',') + '})&order=vote_count.desc.nullslast,name.asc&limit=600';
  // Each holiday reads its own events from our calendar: words in the title, up to a day after the holiday (organizers' own titles show as written).
  function eventsUrl(h) {
    var cfg = HOLX[h] || HOLX.thanksliving;
    return SB + '/rest/v1/events?select=id,title,starts_at,timezone,location_name,city,state,country,event_type,time_set&status=eq.approved&tenant_id=eq.' + VE_TENANT +
      '&starts_at=gte.' + new Date(Date.now() - 864e5).toISOString() + '&starts_at=lte.' + cfg.evTo + '&or=(' + cfg.evOr + ')&order=starts_at.asc&limit=200';
  }
  var LR_TAGS = ['lesaruss-ai-directory', 'lesaruss-ai-directory-candidate', 'lesaruss-ai-business-member'];
  function ours(list) { return (Array.isArray(list) ? list : []).filter(function (l) { return !(l.tags || []).some(function (t) { return LR_TAGS.indexOf(t) >= 0; }); }); }

  // One section per holiday (Sean, 2026-11-08: "Hanukkah and Christmas"). Each holiday names its own pages; the views below read the
  // holiday of the page they are drawing (curHol), so a new holiday is a row here, its TABS and its content, never a copy of the views.
  var HOLX = {
    thanksliving: { page: 'thanksliving', recipes: 'recipes', store: 'store', menus: 'menus', events: 'events', label: 'ThanksLiving',
      fallback: { slug: 'thanksliving', name: 'ThanksLiving (Thanksgiving)', holiday_on: '2026-11-26', submit_close: '2026-11-19T05:00:00Z' },
      evTo: '2026-11-27T05:00:00Z', evOr: 'title.ilike.*thanksliving*,title.ilike.*thanksgiving*,title.ilike.*turkeys*,title.ilike.*friendsgiving*,description.ilike.*thanksliving*',
      evLede: 'Sanctuary dinners, Vegan potlucks and Thanksgiving events on our calendar.', evEmpty: 'Hosting a ThanksLiving dinner or a potluck?' },
    hanukkah: { page: 'hanukkah', recipes: 'hk-recipes', menus: 'hk-menus', events: 'hk-events', label: 'Hanukkah',
      fallback: { slug: 'hanukkah', name: 'Hanukkah', holiday_on: '2026-12-04', submit_close: '2026-12-01T05:00:00Z' },
      evTo: '2026-12-13T05:00:00Z', evOr: 'title.ilike.*hanukkah*,title.ilike.*chanukah*,title.ilike.*hanukah*,title.ilike.*menorah*,title.ilike.*latke*,description.ilike.*hanukkah*',
      evLede: 'Plant-based Hanukkah parties, latke nights and menorah lightings on our calendar.', evEmpty: 'Hosting a latke night or a Hanukkah party?' },
    christmas: { page: 'christmas', recipes: 'xm-recipes', store: 'xm-store', menus: 'xm-menus', events: 'xm-events', label: 'Christmas',
      fallback: { slug: 'christmas', name: 'Christmas', holiday_on: '2026-12-25', submit_close: '2026-12-15T05:00:00Z' },
      evTo: '2026-12-26T05:00:00Z', evOr: 'title.ilike.*christmas*,title.ilike.*xmas*,title.ilike.*holiday*,title.ilike.*cookie swap*,title.ilike.*cookie exchange*,title.ilike.*sweater*,title.ilike.*winter*',
      evLede: 'Vegan Christmas festivals, cookie swaps, holiday lights and parties on our calendar.', evEmpty: 'Hosting a cookie swap or a holiday party?' }
  };
  // Theo's lines, text drafts for Sean (no recordings yet). `say` for visitors, `sayMember` for members.
  var TABS = [
    { k: 'overview', label: 'Overview', pic: '/public/guides/holiday/theo-overview.jpg', say: 'Welcome to the Holiday Guide. I\'m Theo. You\'re the one setting the table this year, and I\'m here to help you do it your way.',
      sayMember: 'Welcome back. Start with ThanksLiving, find a holiday menu near you, and save the places you want to order from.' },
    { k: 'thanksliving', label: 'ThanksLiving', pic: '/public/guides/holiday/theo-thanksliving.jpg', say: 'ThanksLiving is Thanksgiving with a fully plant-based table. Same family, same gratitude, nobody harmed. Start here, then pick what you need: ideas, recipes, the store, a menu to order, an event or something to listen to.' },
    { k: 'ideas', parent: 'thanksliving', pic: '/public/guides/holiday/theo-thanksliving.jpg', label: 'Ideas for the Table', say: 'ThanksLiving is Thanksgiving with a fully plant-based table. Same family, same gratitude, nobody harmed. Here are a few easy ideas to make it yours, whether you host or bring one dish.' },
    { k: 'recipes', parent: 'thanksliving', pic: '/public/guides/holiday/theo-recipes.jpg', label: 'Recipes', say: 'Cooking this year? Here is a full ThanksLiving table you can make at home: a savory loaf, gravy, mashed potatoes, stuffing, cranberry sauce, green beans and pumpkin pie.' },
    { k: 'store', parent: 'thanksliving', pic: '/public/guides/holiday/theo-store.jpg', label: 'At the Store', say: 'Short on time? These are the plant-based roasts, gravies, butters, creams and desserts you can find at the store this season. Read the label, and check your store before you go.' },
    { k: 'menus', parent: 'thanksliving', pic: '/public/guides/holiday/theo-menus.jpg', label: 'Holiday Menus', say: 'Don\'t want to cook it all? Pick your chapter and see which Vegan places are cooking for the holiday, what they\'re offering, and when to order by. Our team checks every menu before it shows. Save one to find it again. Know a place we missed? Tell us, and we\'ll check it.' },
    { k: 'events', parent: 'thanksliving', pic: '/public/guides/holiday/theo-events.jpg', label: 'Events', say: 'Rather be at someone else\'s table? Find sanctuary dinners, potlucks and Thanksgiving events on our calendar. Hosting one? Add it, so people can find you.' },
    { k: 'listen', parent: 'thanksliving', pic: '/public/guides/holiday/theo-listen.jpg', label: 'Listen', say: 'Going home for the holidays? Listen to Victoria Moran, Renee King-Sonnen and Susan Hargreaves on talking with family, and more from our shows and others.' },
    { k: 'hanukkah', label: 'Hanukkah', hol: 'hanukkah', pic: '/public/guides/holiday/theo-hanukkah.jpg', say: 'Hanukkah starts at sundown on December fourth, eight nights of light. On this page are a few easy ideas for a plant-based Hanukkah: latkes, sufganiyot and the people around the menorah.' },
    { k: 'hk-ideas', parent: 'hanukkah', hol: 'hanukkah', pic: '/public/guides/holiday/theo-hanukkah.jpg', label: 'Ideas', say: 'A few easy ideas for a plant-based Hanukkah: something fried, the candles with the people you love, eight nights of kindness, and gifts that do no harm.' },
    { k: 'hk-recipes', parent: 'hanukkah', hol: 'hanukkah', pic: '/public/guides/holiday/theo-hanukkah.jpg', label: 'Recipes', say: 'Here is a plant-based Hanukkah table you can make at home: crispy latkes with a cashew sour cream, applesauce, carrot tzimmes and jelly doughnuts.' },
    { k: 'hk-kosher', parent: 'hanukkah', hol: 'hanukkah', pic: '/public/guides/holiday/theo-hanukkah.jpg', label: 'Kosher Places', say: 'Keeping kosher this Hanukkah? These Vegan and plant-based places describe themselves as kosher or kosher certified. Ask each one about its certification before you go.' },
    { k: 'hk-menus', parent: 'hanukkah', hol: 'hanukkah', pic: '/public/guides/holiday/theo-hanukkah.jpg', label: 'Holiday Menus', say: 'Rather order in? Pick your chapter and see which Vegan places are cooking for Hanukkah. Our team checks every menu before it shows.' },
    { k: 'hk-events', parent: 'hanukkah', hol: 'hanukkah', pic: '/public/guides/holiday/theo-hanukkah.jpg', label: 'Events', say: 'Looking for a latke night or a party near you? Here are the Hanukkah events on our calendar. Hosting one? Add it, so people can find you.' },
    { k: 'christmas', label: 'Christmas', hol: 'christmas', pic: '/public/guides/holiday/theo-christmas.jpg', say: 'Christmas, the plant-based way. On this page are a few easy ideas: a centerpiece for the table, cookies to share, and gifts that do no harm.' },
    { k: 'xm-ideas', parent: 'christmas', hol: 'christmas', pic: '/public/guides/holiday/theo-christmas.jpg', label: 'Ideas and Gifts', say: 'A few easy ideas for a plant-based Christmas: a centerpiece for the table, cookies to share, and gifts that do no harm.' },
    { k: 'xm-gifts', parent: 'christmas', hol: 'christmas', pic: '/public/guides/holiday/theo-christmas.jpg', label: 'Gift Guide', say: 'Shopping for a Vegan, or for anyone? Here are gifts our team picked. Save the ones you love to your wish list and share it with your family.' },
    { k: 'xm-wish', parent: 'christmas', hol: 'christmas', pic: '/public/guides/holiday/theo-christmas.jpg', label: 'Holiday Wish List', say: 'Not sure what to give the Vegan in your life? Start with the Most Wanted shelf. Making a list? Add what you are wishing for and share it with your family.' },
    { k: 'xm-recipes', parent: 'christmas', hol: 'christmas', pic: '/public/guides/holiday/theo-christmas.jpg', label: 'Recipes', say: 'Cooking Christmas dinner? Here is a mushroom Wellington for the middle of the table, maple Brussels sprouts, a creamy nog and gingerbread cookies.' },
    { k: 'xm-store', parent: 'christmas', hol: 'christmas', pic: '/public/guides/holiday/theo-christmas.jpg', label: 'At the Store', say: 'Short on time? Here are the plant-based roasts, nogs, butters and treats you can pick up this season. Stock changes by store, so check before you go.' },
    { k: 'xm-menus', parent: 'christmas', hol: 'christmas', pic: '/public/guides/holiday/theo-christmas.jpg', label: 'Holiday Menus', say: 'Don\'t want to cook Christmas dinner? Pick your chapter and see which Vegan places are cooking for the holiday and when to order by.' },
    { k: 'xm-events', parent: 'christmas', hol: 'christmas', pic: '/public/guides/holiday/theo-christmas.jpg', label: 'Events', say: 'Vegan Christmas festivals, cookie swaps and holiday lights. Here is what is on our calendar. Hosting one? Add it, so people can find you.' },
    { k: 'giveback', label: 'Give Back', pic: '/public/guides/holiday/theo-giveback.jpg', say: 'Giving is part of the season. Here are the nonprofits, rescues and sanctuaries doing the work, in your city and beyond. Giving Tuesday is December first.' },
    { k: 'business', label: 'For Businesses', pic: '/public/guides/holiday/theo-business.jpg', say: 'Run a Vegan business? Send us your holiday menu and we\'ll feature it here, free for members. ThanksLiving menus close at the end of November eighteenth.' }
  ];
  // Theo's recordings (Sean approved the script v2, 2026-11-08): one per video chapter, roster voice aFyw0oiXW7dzKF4o7woX, each checked with stt.
  // The Overview plays the whole tour back to back; every other tab plays its own chapter (canon-ve-guide-tour-standard: Summarize this page).
  var AUDIO_BASE = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/voices/holiday-guide/theo-tour-';
  var CHAPTER_LINES = ["Welcome to the Holiday Guide. I'm Theo. You're the one setting the table this year, and I'm here to help you do it your way.", "Vegans Explore has been bringing the Vegan community together since 2016, city by city. We know the places cooking near you and the groups doing good. This Guide puts all of it in one spot for the holidays, free.", "ThanksLiving is Thanksgiving with a fully plant-based table. Same family, same gratitude, nobody harmed. On this page you'll find a few easy ideas to make it yours, whether you host or bring one dish.", "Don't want to cook it all? Pick your chapter and see which Vegan places are cooking for the holiday, what they're offering, and when to order by. Our team checks every menu before it shows. Save one to find it again. Know a place we missed? Tell us, and we'll check it.", "Rather be at someone else's table? Find sanctuary dinners, potlucks and Thanksgiving events on our calendar. Hosting one? Add it, so people can find you.", "Giving is part of the season. Here are the nonprofits, rescues and sanctuaries doing the work, in your city and beyond. Giving Tuesday is December first.", "Run a Vegan business? Send us your holiday menu and we'll feature it here, free for members. ThanksLiving menus close at the end of November eighteenth.", "This Guide keeps growing. Each holiday opens here as it gets close, so be on the lookout for the next one. Come back often, and share it with whoever's at your table this year. Happy holidays."];
  var TAB_CH = { overview: [1, 2, 3, 4, 5, 6, 7, 8], thanksliving: [3], ideas: [3], menus: [4], events: [5], giveback: [6], business: [7] };
  // Each ThanksLiving page has its own summary video in Theo's frame (Sean, 2026-11-08): his voice for that page, b-roll of what is on it,
  // music under it, 4:5. Play plays the video in place of the voice alone; captions are on. A new video is a row here.
  var VIDEO_BASE = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/guides/holiday/video/theo-';
  // The Overview's is the whole tour (chapters 1 to 8) and replaced the video card in the page (Sean, 2026-11-08); Give Back and For
  // Businesses follow the same rules (chapters 6 and 7).
  // The ideas pages moved under each holiday's Overview (2026-11-10) and keep the video files made for them (VFILE).
  var VFILE = { ideas: 'thanksliving', 'hk-ideas': 'hanukkah', 'xm-ideas': 'christmas' };
  var VIDEO = { overview: 'v1', thanksliving: 'v1', ideas: 'v1', 'hk-ideas': 'v1', 'xm-ideas': 'v1', recipes: 'v2', store: 'v2', menus: 'v3', events: 'v2', listen: 'v2', giveback: 'v1', business: 'v2',
    hanukkah: 'v1', 'hk-recipes': 'v1', 'hk-menus': 'v1', 'hk-events': 'v1', christmas: 'v1', 'xm-recipes': 'v1', 'xm-store': 'v1', 'xm-menus': 'v1', 'xm-events': 'v1' };
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
  var HOLS = null, MENUS = null, TIPS = null, EVENTS = null, GIVE = null, SAVED = {}, LIVE = {}, EVS = {};
  var curTab = 'overview';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function auth() { return window.VEAuth || null; }
  function member() { var a = auth(); return !!(a && a.isLoggedIn && a.isLoggedIn()); }
  // Registered: has a login, member or not (VEAuth.isLoggedIn is false for an account that has not become a member). Enough to send us
  // menus, recipes, suggestions and wishes (Sean, 2026-11-10: quick registration first); Save and votes still need membership.
  function registered() { var a = auth(); return !!(a && a.getToken && a.getToken()); }
  function tab(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i].k === k) return TABS[i]; return TABS[0]; }
  function href(k) { return '#/' + (k === 'overview' ? '' : k); }
  function store(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function recall(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function rest(url) { return fetch(url, { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } }).then(function (r) { return r.json(); }); }
  function holA(action, extra) {
    var a = auth();
    return fetch(HOLIDAY_FN, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: 'Bearer ' + (a && a.getToken ? a.getToken() : '') }, body: JSON.stringify(Object.assign({ action: action }, extra || {})) })
      .then(function (r) { return r.json(); });
  }
  function hol(action, extra) {
    return fetch(HOLIDAY_FN, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: ANON_KEY }, body: JSON.stringify(Object.assign({ action: action }, extra || {})) })
      .then(function (r) { return r.json(); });
  }

  // ---------- dates (Eastern) ----------
  function dayFmt(d, o) { return new Date(d).toLocaleDateString('en-US', Object.assign({ timeZone: 'America/New_York' }, o || { weekday: 'long', month: 'long', day: 'numeric' })); }
  function daysUntil(iso) { var ms = new Date(iso).getTime() - Date.now(); return ms <= 0 ? 0 : Math.ceil(ms / 864e5); }
  function holRow(slug) { return (HOLS || []).filter(function (h) { return h.slug === slug; })[0] || (HOLX[slug] || HOLX.thanksliving).fallback; }
  function thanks() { return holRow(HOLIDAY); }
  // The holiday the page being drawn belongs to (ThanksLiving for every tab that is not under another holiday).
  function holOf(k) { var t = tab(k); return t.hol || (t.parent && tab(t.parent).hol) || HOLIDAY; }
  function curHol() { return holOf(curView); }
  function hx() { return HOLX[curHol()] || HOLX.thanksliving; }
  function hrow() { return holRow(curHol()); }
  // A holiday is over the day after it (Eastern); its tab leaves the top row but its pages still open by link.
  function holPast(slug) { return Date.now() > new Date(onDay(holRow(slug).holiday_on)).getTime() + 864e5; }
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
    menuEl.innerHTML = TABS.filter(function (t) { return !t.parent && !(t.hol && holPast(t.hol) && t.k !== top); }).map(function (t) { return '<a href="' + href(t.k) + '"' + (t.k === top ? ' aria-current="page"' : '') + '>' + esc(t.label) + '</a>'; }).join('');
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
    // Fewer than 6 sections show as buttons on desktop; 6 or more, and every phone, use the dropdown (Sean, 2026-11-10).
    var row = items.length < 6 ? '<nav class="hg-subrow" aria-label="' + esc(tab(par).label) + '">' + items.map(function (c) {
      return '<a class="hg-subb' + (c.k === cur ? ' on' : '') + '" href="' + href(c.k) + '"' + (c.k === cur ? ' aria-current="page"' : '') + '>' + esc(c.k === par ? 'Overview' : c.label) + '</a>';
    }).join('') + '</nav>' : '';
    return '<div class="hg-sub' + (row ? ' hg-sub-few' : '') + '"><label class="hg-sub-l" for="hgSubSel">' + esc(tab(par).label) + '</label>' + row + '<select id="hgSubSel" class="dg-sort hg-subsel">' + items.map(function (c) {
      return '<option value="' + c.k + '"' + (c.k === cur ? ' selected' : '') + '>' + esc(c.k === par ? 'Overview' : c.label) + '</option>';
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
    return '<div class="dg-srow"' + (o.href ? ' data-href="' + o.href + '"' : '') + '>' + (o.icon ? '<span class="hg-sric" aria-hidden="true">' + ic(o.icon) + '</span>' : '') +
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
    { label: 'Hanukkah · Begins December 4', hol: 'hanukkah', line: 'Latkes, sufganiyot and the people around the menorah: ideas, recipes, a Vegan place to order from, and events.', kids: ['hanukkah', 'hk-recipes', 'hk-menus', 'hk-events'] },
    { label: 'Christmas · December 25', hol: 'christmas', line: 'A centerpiece, cookies to share, nog, and gifts that do no harm: ideas, recipes, the store, menus and events.', kids: ['christmas', 'xm-recipes', 'xm-store', 'xm-menus', 'xm-events'] },
    { label: 'Give Back', line: 'The nonprofits, rescues and sanctuaries doing the work. Giving Tuesday is December 1.', kids: ['giveback'] },
    { label: 'Run a Business?', line: 'Send your holiday menu and we feature it here, free for members.', kids: ['business'] }
  ];
  var PILL_PIC = { hanukkah: 'theo-hanukkah.jpg', 'hk-recipes': 'r-latkes.jpg', 'hk-menus': 'p-menus.jpg', 'hk-events': 'p-events.jpg',
    christmas: 'theo-christmas.jpg', 'xm-recipes': 'r-wellington.jpg', 'xm-store': 'r-nog.jpg', 'xm-menus': 'p-menus.jpg', 'xm-events': 'p-events.jpg', recipes: 'r-loaf.jpg', ideas: 'p-thanks.jpg', 'hk-ideas': 'r-sufganiyot.jpg', 'hk-kosher': 'r-latkes.jpg', 'xm-ideas': 'r-gingerbread.jpg', 'xm-wish': 'w-give.jpg', 'xm-gifts': 'r-gingerbread.jpg', store: 'p-store.jpg', listen: 'p-listen.jpg', thanksliving: 'p-thanks.jpg', events: 'p-events.jpg', menus: 'p-menus.jpg', giveback: 'p-giveback.jpg', business: 'p-business.jpg' };
  function groupRows() {
    return GROUPS.filter(function (g) { return !g.hol || !holPast(g.hol); }).map(function (g) {
      return '<section class="rg-grow"><h3>' + esc(g.label) + '</h3><p>' + esc(g.line) + '</p><div class="rg-pills">' + g.kids.map(function (k) {
        return '<a class="rg-pill" href="' + href(k) + '"><span class="rg-pill-pic"><img src="' + PIC + PILL_PIC[k] + '" alt="" loading="lazy" width="60" height="60"></span><span>' + esc(k === 'thanksliving' ? 'Ideas for the Table' : k === 'hanukkah' || k === 'christmas' ? 'Ideas' : tab(k).label) + '</span></a>';
      }).join('') + '</div></section>';
    }).join('');
  }
  // The Overview in the Welcome Guide's shape (Sean, 2026-11-10: "the more simplified version of the overview page that we've been using
  // lately... that little blurb... then it shows the different sections below with a little blurb and read more"; the Welcome Guide is
  // the template for every Guide): Getting started, then each section as a short article row (a picture, a few lines, Read more).
  // The Guide's home is the hook (Sean, 2026-11-10: "the holidays are around the corner... a free holiday guide... as our gift to you...
  // claim your founding membership before the opportunity disappears"), then one list: each holiday, Give Back and For Businesses.
  // Each holiday's own Overview holds its sections (HOL_OV).
  // Row summaries are about 75 characters (Sean, 2026-11-10, the Welcome Guide's rule: "now do the same for the Holiday Guide").
  var HOME_ROWS = [
    ['thanksliving', 'ThanksLiving · November 26', 'Thanksgiving with a fully plant-based table: ideas, recipes, menus, events.'],
    ['hanukkah', 'Hanukkah · Begins December 4', 'Eight nights of light, plant-based: ideas, recipes, kosher places, menus.'],
    ['christmas', 'Christmas · December 25', 'A centerpiece, cookies to share and gifts that do no harm, plus a wish list.'],
    ['giveback', 'Give Back', 'Nonprofits, rescues and sanctuaries doing the work, each easy to give to.'],
    ['business', 'Run a Business?', 'Send your holiday menu and we feature it here and on your listing, free.']
  ];
  var HOL_OV = {
    thanksliving: { pic: 'p-thanks.jpg', cta: ['Find a holiday menu', '#/menus'],
      intro: '<b>Thanksgiving is the American holiday of gratitude.</b> Sanctuaries and Vegan groups call it ThanksLiving: the same family and gratitude, at a table where nobody is harmed. Here are ideas, recipes, the store, Vegan menus near you, events and more.',
      what: '<b>What it is.</b> Thanksgiving is the American holiday of gratitude, on the fourth Thursday of November: family, friends and a long table.',
      why: '<b>Why it matters.</b> Sanctuaries and Vegan groups have called it ThanksLiving for years: the same gratitude, and a table where nobody is harmed. Many sanctuaries hold a dinner for the turkeys instead of one of them.',
      how: '<b>What you can do here.</b> Pick up an easy idea, cook from our recipes, grab what you need at the store, order from a Vegan place near you, find an event, or listen on the drive.',
      rows: [['ideas', 'Ideas for the Table', 'Easy ideas for a fully plant-based Thanksgiving, hosting or bringing a dish.'],
        ['menus', 'Holiday Menus', 'Vegan places near you cooking for the holiday, with the date to order by.'],
        ['recipes', 'Recipes', 'A loaf, gravy, stuffing, cranberry sauce and pumpkin pie, all plant-based.'],
        ['store', 'At the Store', 'Roasts, gravy, butter, cream and dessert at the supermarket, by brand.'],
        ['events', 'Events', 'Sanctuary dinners, potlucks and gatherings, near you and online.'],
        ['listen', 'Listen', 'Our episodes on family and the holidays, ready to play on the way to dinner.']] },
    hanukkah: { pic: 'r-latkes.jpg', cta: ['Find kosher places', '#/hk-kosher'],
      intro: '<b>Hanukkah is the Jewish Festival of Lights,</b> eight nights from sundown on December 4 to nightfall on December 12: light, family and food fried in oil, all of it plant-based. Here are ideas, recipes, kosher places, Vegan menus and events.',
      what: '<b>What it is.</b> Hanukkah is the Jewish Festival of Lights: eight nights, from sundown on Friday, December 4 to nightfall on Saturday, December 12.',
      why: '<b>Why it matters.</b> It is a holiday of light, family and food fried in oil, and all of it can be plant-based. For its meaning and blessings, start with Jewish voices like My Jewish Learning and Jewish Veg.',
      how: '<b>What you can do here.</b> Pick up a few easy ideas, fry latkes from our recipes, find kosher places, order from a Vegan place cooking for the holiday, or find a latke night near you.',
      rows: [['hk-ideas', 'Ideas', 'Something fried, the candles, eight nights of kindness and kind gifts.'],
        ['hk-recipes', 'Recipes', 'Crispy latkes, applesauce, carrot tzimmes and jelly doughnuts, plant-based.'],
        ['hk-kosher', 'Kosher Places', 'Vegan and plant-based places that describe themselves as kosher.'],
        ['hk-menus', 'Holiday Menus', 'Vegan places cooking for Hanukkah, with the date to order by.'],
        ['hk-events', 'Events', 'Plant-based Hanukkah parties, latke nights and menorah lightings.']] },
    christmas: { pic: 'r-wellington.jpg', cta: ['Gift Guide', '#/xm-gifts'],
      intro: '<b>Christmas, December 25,</b> is the biggest day of family and giving of the year, and the easiest time to give gifts that do no harm. Here are ideas and gifts, a wish list, recipes, the store, Vegan menus and events.',
      what: '<b>What it is.</b> Christmas, on Friday, December 25, is a day of family, giving and a shared table for millions of people.',
      why: '<b>Why it matters.</b> It is also the biggest gift season of the year, so it is the easiest time to give gifts that do no harm and set a table everyone can enjoy.',
      how: '<b>What you can do here.</b> Find ideas and gifts, cook a Wellington from our recipes, pick up nog at the store, order from a Vegan place near you, or find a cookie swap or a holiday party.',
      rows: [['xm-ideas', 'Ideas and Gifts', 'A centerpiece, cookies to share and gifts from Vegan brands we list.'],
        ['xm-gifts', 'Gift Guide', 'Gifts our team picked for the Vegan on your list, from food to style.'],
        ['xm-wish', 'Holiday Wish List', 'Make a wish list and share it with family, or suggest the perfect gift.'],
        ['xm-recipes', 'Recipes', 'A mushroom Wellington, maple Brussels sprouts, a creamy nog and cookies.'],
        ['xm-store', 'At the Store', 'Plant-based roasts, nogs, butters and treats this season, by brand.'],
        ['xm-menus', 'Holiday Menus', 'Vegan places cooking for Christmas, with the date to order by.'],
        ['xm-events', 'Events', 'Vegan Christmas festivals, cookie swaps, holiday lights and parties.']] }
  };
  var FOUNDING = Date.now() < Date.parse('2027-01-01T05:00:00Z');
  function artRow(picUrl, title, txt, link) {
    // Theo's pictures are framed from the top so his head is never cut off (Sean, 2026-11-10).
    var top = /\/theo-[a-z-]+\.jpg$/.test(picUrl) ? ';background-position:center top' : '';
    return '<li class="wg-art"><a href="' + esc(link) + '" tabindex="-1" aria-hidden="true"><span class="wg-art-img" style="background-image:url(&quot;' + esc(picUrl) + '&quot;)' + top + '"></span></a>' +
      '<div><a class="wg-art-t" href="' + esc(link) + '">' + esc(title) + '</a><p>' + esc(txt) + '</p><a class="wg-art-more" href="' + esc(link) + '">Read more &rsaquo;</a></div></li>';
  }
  function viewOverview() {
    var t = thanks(), d = daysUntil(onDay(t.holiday_on));
    // One paragraph, about as long as the gift sentence (Sean, 2026-11-10: "a bit more compact... especially as we start to shrink the site").
    var ps = member()
      ? ['<b>Welcome back.</b> The holidays are around the corner, and this Guide has everything for a Vegan season: holiday menus near you, recipes, the store, events and ways to give back. Start with your holiday below.']
      : ['<b>The holidays are around the corner,</b> and Vegans Explore is back for the busy season with a free Holiday Guide: Vegan holiday menus near you, recipes, what to pick up at the store, events and ways to give back. It is our gift to you.' + (FOUNDING ? ' Founding Membership closes January 1.' : '')];
    var gs = '<section class="wg-gs" aria-label="Getting started"><span class="wg-gs-pic"><img src="' + PIC + 'start.jpg" alt="" decoding="async" width="640" height="640"></span>' +
      '<div class="wg-gs-b"><div class="vgi-k">A gift from Vegans Explore</div><h3 class="wg-gs-t">Your Free Holiday Guide</h3>' + ps.map(function (x) { return '<p>' + x + '</p>'; }).join('') +
      '<div class="wg-gs-btns"><button type="button" class="dg-btn" data-hg-video>&#9654; Play the tour</button>' +
      (member() ? '<a class="dg-btn dg-ghost" href="#/menus">Find a holiday menu</a>' : '<button type="button" class="dg-btn dg-ghost" data-hg-join>Claim membership</button>') + '</div></div></section>';
    var rows = HOME_ROWS.filter(function (r) { return !((r[0] === 'hanukkah' || r[0] === 'christmas') && holPast(r[0])); });
    main.innerHTML = head('Free for everyone', 'Welcome to the Holiday Guide', '') + gs + '<div class="wg-arts"><div class="wg-grp"><h5>Your Holidays</h5><ol>' +
      rows.map(function (r) { return artRow(PIC + PILL_PIC[r[0]], r[1], r[2], href(r[0])); }).join('') + '</ol></div></div>';
  }
  // Each holiday opens on its own Overview (Sean, 2026-11-10: "what is Thanksgiving? why is it important... what they can do in this
  // section"): the Welcome Guide's Getting started card, then the holiday's sections as article rows.
  function viewHolOverview(h) {
    var o = HOL_OV[h], t = holRow(h), left = daysUntil(onDay(t.holiday_on));
    var gs = '<section class="wg-gs" aria-label="About ' + esc(t.name) + '"><span class="wg-gs-pic"><img src="' + PIC + o.pic + '" alt="" decoding="async" width="640" height="640"></span>' +
      '<div class="wg-gs-b"><div class="vgi-k">' + (left ? left + ' days to go' : 'This season') + '</div><h3 class="wg-gs-t">' + esc(tc('About ' + (h === 'thanksliving' ? 'ThanksLiving' : t.name))) + '</h3>' +
      '<p>' + o.intro + '</p>' +
      '<div class="wg-gs-btns"><button type="button" class="dg-btn" data-hg-video>&#9654; Play Theo</button><a class="dg-btn dg-ghost" href="' + o.cta[1] + '">' + esc(o.cta[0]) + '</a></div></div></section>';
    main.innerHTML = head(HOLX[h] && h !== 'thanksliving' ? IDEAS[h].k : 'November 26', h === 'thanksliving' ? 'ThanksLiving' : t.name, '') + gs +
      '<div class="wg-arts"><div class="wg-grp"><h5>In This Section</h5><ol>' + o.rows.map(function (r) { return artRow(PIC + PILL_PIC[r[0]], r[1], r[2], href(r[0])); }).join('') + '</ol></div></div>';
  }
  function others() { return (HOLS || []).some(function (h) { return daysUntil(h.submit_close) > 0; }); }

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
    main.innerHTML = head('ThanksLiving', 'Ideas for the Table', 'Thanksgiving with a full plant-based table, on ' + esc(dayFmt(onDay(t.holiday_on))) + '. Host it, bring a dish, or order from a Vegan place near you.') +
      '<h3 class="hg-sh" style="margin:4px 0 10px">A Few Easy Ideas for Your Table</h3>' +
      '<div class="hg-rules">' + RULES.map(function (r, i) { return '<div class="hg-rule hg-pic"><div class="hg-rpic"><img src="' + PIC + RULE_PIC[i] + '" alt="" loading="lazy" width="320" height="320"><span class="n">' + (i + 1) + '</span></div><div class="hg-rb"><h3>' + esc(tc(r[0])) + '</h3><p>' + esc(r[1]) + '</p></div></div>'; }).join('') + '</div>' +
            '<div class="hg-note"><b>A shared word.</b> Sanctuaries and Vegan groups have called it ThanksLiving for years, and many hold ThanksLiving dinners for the animals. We are glad to be one more place people find it.</div>' +
      '<div class="hg-note" style="background:#f6f4ef"><b>The same day is the National Day of Mourning.</b> Since 1970, United American Indians of New England have gathered in Plymouth on this day. To learn more, start with Indigenous-led voices like <a href="https://www.uaine.org/" target="_blank" rel="noopener">uaine.org</a>.</div>';
  }


  // ---------- Hanukkah and Christmas ----------
  // Each holiday's own page: a few easy ideas (flat icons, the ThanksLiving page's way) and notes. Sean, 2026-11-08: respectful, never a
  // costume of a culture, and for a holiday that is not ours to explain, we point to the community's own voices.
  var IDEAS = {
    hanukkah: { k: 'Begins December 4', lede: 'Eight nights, from sundown on Friday, December 4 to nightfall on Saturday, December 12. Fry the latkes, light the candles, and keep the table plant-based.', ideas: [
      ['Fry something', 'Latkes and jelly doughnuts are fried in oil to remember the oil that lasted eight nights. Both are easy to make plant-based.', '<path d="M12 3c3 4 5 6.5 5 10a5 5 0 01-10 0c0-3.5 2-6 5-10z"/><path d="M12 13c1 1.2 1.6 2 1.6 3a1.6 1.6 0 01-3.2 0c0-1 .6-1.8 1.6-3z"/>'],
      ['Light the candles together', 'Gather around the menorah each night with the people you love, and share a plant-based meal after.', '<path d="M4 20h16M12 20v-6M6 20v-6M18 20v-6M9 20v-6M15 20v-6"/><path d="M12 11c.9-1 1.3-1.8 1.3-2.5a1.3 1.3 0 00-2.6 0c0 .7.4 1.5 1.3 2.5z"/>'],
      ['Eight nights of kindness', 'One small kindness each night: a gift to a sanctuary, an hour of volunteering, a call to someone who needs it.', '<path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/>'],
      ['Gifts that do no harm', 'Many chocolate coins are milk chocolate. Look for dark chocolate gelt marked dairy-free, or give something from a Vegan brand.', '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M12 8v13M5 13v8h14v-8M12 8c-2-4-6-4-6-1s6 1 6 1zm0 0c2-4 6-4 6-1s-6 1-6 1z"/>'],
      ['Share the table', 'Invite a friend to try a plant-based latke. Good food opens more doors than a speech.', '<path d="M3 11h18M5 11a7 5 0 0114 0M12 4v2M4 15h16l-1.5 4h-13z"/>']],
      notes: ['<b>From the community.</b> For the meaning of Hanukkah and its blessings, start with Jewish voices, like <a href="https://www.myjewishlearning.com/" target="_blank" rel="noopener">My Jewish Learning</a>, and <a href="https://www.jewishveg.org/" target="_blank" rel="noopener">Jewish Veg</a> for plant-based Jewish holidays.',
        '<b>Gifts from Vegan brands.</b> Clothing, beauty and food are in <a href="/directory?tab=products">our Directory</a>.'] },
    christmas: { k: 'December 25', lede: 'Friday, December 25. A plant-based centerpiece, cookies to share and gifts that do no harm, whether you host or bring one dish.', ideas: [
      ['A centerpiece for the table', 'A Wellington or a roast in the middle of the table, and everyone gets a slice.', '<path d="M3 11h18M5 11a7 5 0 0114 0M12 4v2M4 15h16l-1.5 4h-13z"/>'],
      ['Bake and share', 'Make a batch of cookies for a neighbor, the office or a cookie swap. Nobody misses the butter.', '<circle cx="12" cy="12" r="8"/><circle cx="9.5" cy="10" r="1"/><circle cx="14" cy="9.5" r="1"/><circle cx="13" cy="14" r="1"/><circle cx="9" cy="14.5" r="1"/>'],
      ['Gifts that do no harm', 'Clothing, beauty and food from Vegan brands, or a gift in someone\'s name to a sanctuary.', '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M12 8v13M5 13v8h14v-8M12 8c-2-4-6-4-6-1s6 1 6 1zm0 0c2-4 6-4 6-1s-6 1-6 1z"/>'],
      ['Make room at the table', 'Someone you know may be alone this season. Invite them, or bring them a plate.', '<path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/>'],
      ['Write it down', 'Before the year ends, write what it taught you and what you want next year to hold.', '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h5"/>']],
      notes: ['<b>Gifts from Vegan brands.</b> Clothing, beauty and food are in <a href="/directory?tab=products">our Directory</a>. A gift in someone\'s name to a sanctuary is on <a href="#/giveback">Give Back</a>.'] }
  };
  function viewHoliday(slug) {
    var d = IDEAS[slug], t = holRow(slug), left = daysUntil(onDay(t.holiday_on));
    main.innerHTML = head(t.name, slug === 'christmas' ? 'Ideas and Gifts' : 'Hanukkah Ideas', d.lede) +
      (left ? '<div class="hg-count"><div><b>' + left + '</b><small>days to ' + esc(t.name) + '</small></div>' + (daysUntil(t.submit_close) ? '<div><b>' + daysUntil(t.submit_close) + '</b><small>days to send a menu</small></div>' : '') + '</div>' : '') +
      '<h3 class="hg-sh" style="margin:22px 0 10px">A Few Easy Ideas</h3>' +
      '<div class="hg-rules">' + d.ideas.map(function (r, i) { return '<div class="hg-rule"><div class="hg-ric">' + ic(r[2]) + '<span class="n">' + (i + 1) + '</span></div><h3>' + esc(tc(r[0])) + '</h3><p>' + esc(r[1]) + '</p></div>'; }).join('') + '</div>' +
      d.notes.map(function (n) { return '<div class="hg-note">' + n + '</div>'; }).join('');
  }

  // ---------- Kosher Places (Hanukkah) ----------
  // Sean, 2026-11-10: "we could show restaurants that are kosher". Listings tagged `kosher` (migration 20261110_kosher_places_tag.sql: their
  // own description says kosher, kosher certified or a kosher kitchen), 100% Vegan first, in the shared Directory card (vote, save), a search,
  // and Suggest a Place to the right of it.
  var KOSHER = null;
  function viewKosher() {
    main.innerHTML = head('Hanukkah', 'Kosher Places', 'Vegan and plant-based places that describe themselves as kosher or kosher certified. Ask each place about its certification before you go.') +
      '<div class="hg-tools2"><div class="hg-search"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#525252" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
      '<input type="search" id="hgKq" placeholder="Search places and cities..." aria-label="Search kosher places" autocomplete="off" data-dictate="off"></div>' +
      '<button type="button" class="hg-subbtn" data-hg-open="hgKosPanel" aria-expanded="false" aria-controls="hgKosPanel">Suggest a Place</button></div>' +
      '<div class="hg-submit" id="hgKosPanel" hidden>' + storeSuggest().replace('Suggest an Item', 'Suggest a Kosher Place').replace('Found a plant-based roast, gravy or pie on a shelf near you that is not here? Tell us. Our team checks it, and the good ones go on the list for everyone.', 'Know a kosher place with Vegan food that is not here? Tell us its name and city. Our team checks it and adds it.').replace('What is it? (brand and item)', 'The place').replace('Brand and item', 'Its name').replace('Where you saw it (optional)', 'City').replace('Store and city', 'City and state') + '</div>' +
      '<div id="hgKosList"><div class="dg-loading">Loading the places...</div></div>';
    wireStoreSuggest();
    var draw = function () {
      var box = document.getElementById('hgKosList'); if (!box) return;
      var w = (document.getElementById('hgKq').value || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
      var list = (KOSHER || []).filter(function (l) { var t = [l.name, l.address_city, l.address_state].join(' ').toLowerCase(); return !w.some(function (x) { return t.indexOf(x) < 0; }); });
      // The shared Directory card, never a copy (CLAUDE.md "Every view is a link", error registry UI-LISTING-CARD-COPIED-NOT-SHARED).
      box.innerHTML = list.length ? cards(list, 'hgKosGrid') : '<div class="hg-empty"><h3>Nothing Matches</h3><p>Try another name or city. Know one we are missing? Suggest a Place.</p></div>';
      if (list.length) wireCards('hgKosGrid');
    };
    document.getElementById('hgKq').addEventListener('input', draw);
    if (KOSHER) { draw(); return; }
    rest(SB + '/rest/v1/listings?select=' + FIELDS + '&status=eq.approved&tags=cs.%7Bkosher%7D&order=vote_count.desc.nullslast&limit=200')
      .then(function (rows) { KOSHER = (Array.isArray(rows) ? rows : []).sort(function (a, b) { return (a.vegan_status === 'fully_vegan' ? 0 : 1) - (b.vegan_status === 'fully_vegan' ? 0 : 1) || (b.vote_count || 0) - (a.vote_count || 0) || a.name.localeCompare(b.name); }); })
      .catch(function () { KOSHER = []; }).then(function () { if (curView === 'hk-kosher') draw(); });
  }

  // ---------- Gift Guide (Christmas) ----------
  // Sean, 2026-11-10: gifts our team picks (ve_holiday_gifts: section, brand listing, where to buy it, Amazon when sold there, our own note,
  // the source credited), by section, with a Plus that lives only in the Holiday Guide (registered accounts, ve-holiday gift_plus).
  var GIFTS = null, GF = { q: '', sec: '' };
  var GIFT_ICO = function () { return GIFT; };
  function giftCard(g) {
    var l = g.listing, brand = l ? '<a class="hg-gbr" href="/directory/' + encodeURIComponent(l.slug) + '">' + (l.logo_url ? '<span class="hg-gbl" style="background-image:url(\'' + esc(l.logo_url) + '\')"></span>' : '') + esc(g.brand || l.name) + '</a>' : '<span class="hg-gbr">' + esc(g.brand || '') + '</span>';
    var shop = g.link || g.amazon_link;
    return '<div class="hg-gift">' + (g.image_url ? '<a class="hg-gpic" href="' + esc(shop || '#') + '" target="_blank" rel="noopener nofollow" style="background-image:url(\'' + esc(g.image_url) + '\')" aria-label="' + esc(g.title) + '"></a>' : '') +
      '<div class="hg-gb"><div class="hg-gtop">' + brand + (g.price ? '<span class="hg-gpr">' + esc(g.price) + '</span>' : '') + '</div><h3>' + esc(g.title) + '</h3>' +
      (g.note ? '<p class="hg-sum">' + esc(g.note) + '</p>' : '') + (g.source_name ? '<small class="hg-gsrc">Found in ' + (g.source_url ? '<a href="' + esc(g.source_url) + '" target="_blank" rel="noopener">' + esc(g.source_name) + '</a>' : esc(g.source_name)) + '</small>' : '') +
      '<div class="hg-acts">' + (g.link ? '<a class="dg-btn" href="' + esc(g.link) + '" target="_blank" rel="noopener nofollow">Shop</a>' : '') +
      (g.amazon_link ? '<a class="dg-btn' + (g.link ? ' dg-ghost' : '') + '" href="' + esc(g.amazon_link) + '" target="_blank" rel="noopener nofollow">Amazon</a>' : '') +
      // Save puts the gift on the member's wish list (Sean, 2026-11-10: "if they save it, it goes to the wish list"); saves rank the gifts.
      '<button type="button" class="dg-save hg-plus' + (g.mine ? ' on' : '') + '" data-gift-plus="' + esc(g.id) + '" aria-pressed="' + !!g.mine + '" aria-label="Save to my wish list">' + (g.mine ? 'Saved' : 'Save') + '</button></div></div></div>';
  }
  function viewGifts() {
    // The page's instructions are its call to action (Sean, 2026-11-10): save to the wish list and share it; suggest what is missing.
    main.innerHTML = head('Christmas', 'Gift Guide', 'Gifts our team picked for the Vegan on your list. Save items to add them to your wish list, so you can share it with the people you love. See a gift that is not here? Press Suggest a Gift so we can consider it.') +
      '<div class="hg-tools2"><div class="hg-search"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#525252" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
      '<input type="search" id="hgGq" placeholder="Search gifts and brands..." aria-label="Search gifts" autocomplete="off" data-dictate="off" value="' + esc(GF.q) + '"></div>' +
      // Sections are a dropdown beside the search, the Events region way (Sean, 2026-11-10: "Keep the titles, use a drop-down... you may
      // want to put more categories in there in the future").
      '<select class="dg-sort hg-evsel" id="hgGsec" aria-label="Category"><option value="">Choose a category</option></select>' +
      '<button type="button" class="hg-subbtn" data-hg-open="hgGiftPanel" aria-expanded="false" aria-controls="hgGiftPanel">Suggest a Gift</button>' +
      (registered() ? '<a class="dg-btn dg-ghost hg-mywl" href="#/xm-wish">My Wish List</a>' : '') + '</div>' +
      // The suggestion goes to the team for a check (ve-holiday wish_add, kind gift). A brand suggesting its own gift gets the soft ask
      // (Sean, 2026-11-10): would they give an item to the December giveaway? Yes or no, both optional.
      '<div class="hg-submit" id="hgGiftPanel" hidden><section class="hg-sug"><h3>Suggest a Gift</h3><form class="hg-sugf hg-giftf" novalidate>' +
        '<label>What is it?<input name="title" maxlength="120" required placeholder="A Vegan leather wallet"></label>' +
        '<label>The brand (optional)<input name="brand" maxlength="120" placeholder="Who makes it"></label>' +
        '<label>A link to where it is sold (optional)<input name="link" maxlength="400" placeholder="https://"></label>' +
        '<label>Why it is a good gift (optional)<input name="note" maxlength="300" placeholder="A line about it"></label>' +
        '<label class="hg-gown"><input type="checkbox" name="owner"> This is my brand</label>' +
        '<div class="hg-gaway" hidden><p class="dg-srow-p" style="margin:0"><b>Our holiday giveaway starts in December.</b> Is there an item you would like to give to it? (optional)</p>' +
          '<div class="hg-wk" role="radiogroup" aria-label="Giveaway"><label><input type="radio" name="giveaway" value="yes"> Yes, I would like to</label><label><input type="radio" name="giveaway" value="no"> Not this time</label></div>' +
          '<label class="hg-gwhat" hidden>What would you give, and how many? (optional)<input name="giveaway_note" maxlength="300" placeholder="Two gift boxes"></label></div>' +
        '<div class="dg-btns" style="margin:0"><button class="dg-btn" type="submit">Send it</button></div><p class="dg-srow-p" data-smsg style="margin:0"></p></form></section></div>' +
      '<div id="hgGiftList"><div class="dg-loading">Loading the gifts...</div></div>' +
      // Amazon's Associates terms ask for this line wherever our tagged Amazon links are.
      '<p class="hg-note">Some links go to Amazon through our tracked links. As an Amazon Associate, Vegans Explore earns from qualifying purchases.</p>';
    var gf = main.querySelector('.hg-giftf');
    gf.addEventListener('change', function () {
      var own = gf.owner.checked, yes = (gf.querySelector('input[name=giveaway]:checked') || {}).value === 'yes';
      gf.querySelector('.hg-gaway').hidden = !own; gf.querySelector('.hg-gwhat').hidden = !(own && yes);
    });
    gf.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = gf.querySelector('[data-smsg]'), btn = gf.querySelector('button[type=submit]'), own = gf.owner.checked, ga = (gf.querySelector('input[name=giveaway]:checked') || {}).value || null;
      if (gf.title.value.trim().length < 2) { msg.textContent = 'Tell us what it is.'; gf.title.focus(); return; }
      btn.disabled = true; msg.textContent = 'Sending...';
      holA('wish_add', { holiday: 'christmas', kind: 'gift', title: gf.title.value.trim(), brand: gf.brand.value.trim(), link: gf.link.value.trim(), note: gf.note.value.trim(),
        brand_owner: own, giveaway: own ? ga : null, giveaway_note: own && ga === 'yes' ? gf.giveaway_note.value.trim() : '' }).then(function (d) {
        if (!d || !d.ok) throw d;
        gf.reset(); gf.querySelector('.hg-gaway').hidden = true; gf.querySelector('.hg-gwhat').hidden = true;
        msg.textContent = own && ga === 'yes' ? 'Thank you. Our team checks every gift, and we will be in touch about the giveaway.' : 'Thank you. Our team checks every gift before it is added.';
      }).catch(function (d) { msg.textContent = d && d.error === 'bad_link' ? 'That link does not look right. Paste the full address.' : d && d.error === 'rate_limited' ? 'That is a lot for one day. Try again tomorrow.' : 'That did not send. Try again in a minute.'; })
        .then(function () { btn.disabled = false; });
    });
    var draw = function () {
      var box = document.getElementById('hgGiftList'), chips = document.getElementById('hgGsec'); if (!box) return;
      var all = GIFTS || [], secs = []; all.forEach(function (g) { if (secs.indexOf(g.section) < 0) secs.push(g.section); });
      chips.innerHTML = '<option value="">Choose a category</option>' + secs.map(function (x) { return '<option value="' + esc(x) + '"' + (GF.sec === x ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('');
      var w = GF.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
      var list = all.filter(function (g) { var t = [g.title, g.brand, g.note, g.section].join(' ').toLowerCase(); return (!GF.sec || g.section === GF.sec) && !w.some(function (x) { return t.indexOf(x) < 0; }); });
      box.innerHTML = list.length ? secs.filter(function (x) { return list.some(function (g) { return g.section === x; }); }).map(function (x) {
        return '<section class="hg-shelf"><h3 class="hg-shelf-h">' + GIFT + esc(x) + '</h3><div class="hg-gifts">' + list.filter(function (g) { return g.section === x; }).sort(function (a, b) { return (b.plus || 0) - (a.plus || 0) || (a.sort || 0) - (b.sort || 0); }).map(giftCard).join('') + '</div></section>';
      }).join('') : '<div class="hg-empty"><h3>' + (all.length ? 'Nothing Matches' : 'Gifts Coming Soon') + '</h3><p>' + (all.length ? 'Try another word or section.' : 'Our team is picking them now.') + '</p></div>';
    };
    document.getElementById('hgGq').addEventListener('input', function (e) { GF.q = e.target.value; draw(); });
    document.getElementById('hgGsec').addEventListener('change', function (e) { GF.sec = e.target.value; draw(); });
    if (main._giftH) main.removeEventListener('click', main._giftH);
    main.addEventListener('click', main._giftH = function (e) {
      if (curView !== 'xm-gifts') return;
      var el;
      if ((el = e.target.closest('[data-gift-plus]'))) {
        var id = el.getAttribute('data-gift-plus'), g = (GIFTS || []).filter(function (x) { return x.id === id; })[0]; if (!g) return;
        var go = function () {
          var on = !g.mine; el.disabled = true;
          holA('gift_plus', { gift_id: id, on: on }).then(function (d) { if (d && d.ok) { g.mine = on; g.plus = d.plus; el.classList.toggle('on', on); el.setAttribute('aria-pressed', String(on)); el.textContent = on ? 'Saved' : 'Save'; } }).catch(function () {}).then(function () { el.disabled = false; });
        };
        if (registered()) go(); else joinWindow('Save to Your Wish List', 'Everything in the Holiday Guide is free to read. Register to save gifts to your wish list and share it with the people you love.', function () { setTimeout(function () { GIFTS = null; viewGifts(); }, 50); });
      }
    });
    if (GIFTS) { draw(); return; }
    holA('gifts', { holiday: 'christmas' }).then(function (d) { GIFTS = (d && d.gifts) || []; }).catch(function () { GIFTS = []; }).then(function () { if (curView === 'xm-gifts') draw(); });
  }

  // ---------- Holiday Wish List (Christmas) ----------
  // Sean, 2026-11-10: "share links to products that you wish... or make suggestions for perfect gifts for vegans... to help family members
  // get ideas". Your list (shared by your own link), Most Wanted and Gift Ideas from the community (team-approved), ve-holiday wish_*.
  var GIFT = '<svg class="hg-sico" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="5" rx="1"/><path d="M12 8v13M5 13v8h14v-8M12 8c-2-4-6-4-6-1s6 1 6 1zm0 0c2-4 6-4 6-1s-6 1-6 1z"/></svg>';
  function wishRow(w, extra) {
    var ln = w.link ? '<a href="' + esc(w.link) + '" target="_blank" rel="noopener nofollow">See it &rsaquo;</a>' : '';
    return '<div class="hg-mrow"><span class="hg-blogo hg-wico">' + GIFT + '</span><div class="hg-mrow-b"><b>' + esc(w.title) + '</b>' + (w.note ? '<p>' + esc(w.note) + '</p>' : '') + '</div><span class="hg-mbrand">' + (extra || '') + ln + '</span></div>';
  }
  function viewWish(sub) {
    var hk = 'christmas';
    if (/^list\//.test(sub || '')) {
      var code = decodeURIComponent(sub.slice(5));
      main.innerHTML = crumb([['Holiday Wish List', '#/xm-wish'], ['A shared list']]) + '<div id="hgWishShared"><div class="dg-loading">Loading the list...</div></div>';
      hol('wish_list', { code: code, holiday: hk }).then(function (d) {
        var box = document.getElementById('hgWishShared'); if (!box) return;
        if (!d || !d.ok) { box.innerHTML = '<div class="hg-empty"><h3>That List Is Not Here</h3><p>Ask them to share it again.</p><a class="dg-btn" href="#/xm-wish">See the Most Wanted gifts</a></div>'; return; }
        box.innerHTML = head('Holiday Wish List', esc(d.first_name) + '’s Wish List', 'What ' + esc(d.first_name) + ' is wishing for this season. Every gift on it does no harm.') +
          (d.items.length ? '<section class="hg-shelf"><div class="hg-mlist">' + d.items.map(function (w) { return wishRow(w); }).join('') + '</div></section>' : '<div class="hg-empty"><h3>Nothing on It Yet</h3><p>Check back soon, or start with Most Wanted.</p></div>') +
          '<div class="dg-btns" style="margin-top:18px"><a class="dg-btn" href="#/xm-wish">Make your own list</a><a class="dg-btn dg-ghost" href="#/xm-ideas">More gift ideas</a></div>';
      }).catch(function () {});
      return;
    }
    main.innerHTML = head('Christmas', 'Holiday Wish List', 'Make a list of what you are wishing for and share it with your family, or suggest the perfect gift for a Vegan. Shopping for someone? Start with Most Wanted.') +
      '<div class="hg-tools2"><p class="dg-srow-p" style="flex:1;margin:0">Every gift here is one that does no harm. Links go to the place that sells it.</p>' +
      '<button type="button" class="hg-subbtn" data-hg-open="hgWishPanel" aria-expanded="false" aria-controls="hgWishPanel">Add to My List</button></div>' +
      '<div class="hg-submit" id="hgWishPanel" hidden><section class="hg-sug"><h3>Add to Your Wish List</h3><form class="hg-sugf hg-wishf" novalidate>' +
        '<div class="hg-wk" role="radiogroup" aria-label="What is it"><label><input type="radio" name="kind" value="wish" checked> A wish for me</label><label><input type="radio" name="kind" value="gift"> A gift idea for any Vegan</label></div>' +
        '<label>What is it?<input name="title" maxlength="120" required placeholder="A Vegan leather wallet"></label>' +
        '<label>A link to where it is sold (optional)<input name="link" maxlength="400" placeholder="https://"></label>' +
        '<label>A note (optional)<input name="note" maxlength="300" placeholder="Size, color, or why it is a good gift"></label>' +
        '<div class="dg-btns" style="margin:0"><button class="dg-btn" type="submit">Add it</button></div><p class="dg-srow-p" data-smsg style="margin:0"></p></form></section></div>' +
      (registered() ? '<div id="hgWishMine"></div>' : '') +
      '<div id="hgWishShelves"><div class="dg-loading">Loading the gifts...</div></div>' + (isAdmin() ? '<div id="hgWishQueue"></div>' : '');
    var f = main.querySelector('.hg-wishf');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = f.querySelector('[data-smsg]'), btn = f.querySelector('button'), kind = (f.querySelector('input[name=kind]:checked') || {}).value || 'wish';
      if (f.title.value.trim().length < 2) { msg.textContent = 'Tell us what it is.'; f.title.focus(); return; }
      btn.disabled = true; msg.textContent = 'Adding...';
      holA('wish_add', { holiday: hk, kind: kind, title: f.title.value.trim(), link: f.link.value.trim(), note: f.note.value.trim() }).then(function (d) {
        if (!d || !d.ok) throw d;
        f.reset(); msg.textContent = kind === 'gift' ? 'Thank you. Your gift idea goes on the shelf once our team checks it.' : 'Added to your list.';
        drawMine();
      }).catch(function (d) { msg.textContent = d && d.error === 'bad_link' ? 'That link does not look right. Paste the full address.' : d && d.error === 'rate_limited' ? 'That is a lot for one day. Try again tomorrow.' : 'That did not save. Try again in a minute.'; })
        .then(function () { btn.disabled = false; });
    });
    var drawMine = function () {
      var box = document.getElementById('hgWishMine'); if (!box) return;
      holA('wish_mine', { holiday: hk }).then(function (d) {
        if (!d || !d.ok) return;
        // Gifts saved in the Gift Guide are on the list too, first (2026-11-10); Remove unsaves them.
        var saved = d.saved || [], mine = d.items.filter(function (w) { return w.kind === 'wish'; }), url = location.origin + '/guides/holiday-guide#/xm-wish/list/' + encodeURIComponent(d.code || '');
        box.innerHTML = '<section class="hg-shelf"><h3 class="hg-shelf-h">' + GIFT + 'My Wish List</h3>' +
          (saved.length || mine.length ? '<div class="hg-mlist">' + saved.map(function (w) { return wishRow(w, '<button type="button" class="hg-wx" data-wish-unsave="' + esc(w.gift_id) + '" aria-label="Remove ' + esc(w.title) + '">Remove</button>'); }).join('') +
            mine.map(function (w) { return wishRow(w, '<button type="button" class="hg-wx" data-wish-rm="' + esc(w.id) + '" aria-label="Remove ' + esc(w.title) + '">Remove</button>'); }).join('') + '</div>' +
            (d.code ? '<div class="dg-btns" style="margin:12px 0 0"><button type="button" class="dg-btn" data-wish-share="' + esc(url) + '">Share my list</button></div>' : '') :
            '<p class="dg-srow-p">Nothing on your list yet. Save gifts in the <a href="#/xm-gifts">Gift Guide</a>, or press Add to My List.</p>') + '</section>';
      }).catch(function () {});
    };
    var drawShelves = function () {
      hol('wishes', { holiday: hk }).then(function (d) {
        var box = document.getElementById('hgWishShelves'); if (!box) return;
        var most = (d && d.most_wanted) || [], gifts = (d && d.gifts) || [];
        box.innerHTML = '<section class="hg-shelf"><h3 class="hg-shelf-h">' + GIFT + 'Most Wanted</h3>' + (most.length ? '<div class="hg-mlist">' + most.map(function (w) { return wishRow(w, w.n > 1 ? '<small>Wished by ' + w.n + '</small> ' : ''); }).join('') + '</div>' : '<p class="dg-srow-p">The shelf fills as people add their wishes. Add yours.</p>') + '</section>' +
          '<section class="hg-shelf"><h3 class="hg-shelf-h">' + GIFT + 'Gift Ideas from the Community</h3>' + (gifts.length ? '<div class="hg-mlist">' + gifts.map(function (w) { return wishRow(w); }).join('') + '</div>' : '<p class="dg-srow-p">No gift ideas yet. Know the perfect gift for a Vegan? Add it.</p>') + '</section>';
      }).catch(function () {});
    };
    var drawQueue = function () {
      var box = document.getElementById('hgWishQueue'); if (!box) return;
      holA('wish_queue', { holiday: hk }).then(function (d) {
        var rows = (d && d.rows) || [];
        box.innerHTML = '<section class="hg-shelf"><h3 class="hg-shelf-h">Waiting for a Check (' + rows.length + ', team only)</h3>' + (rows.length ? '<div class="hg-mlist">' + rows.map(function (w) {
          return wishRow(w, '<small>' + esc(w.kind) + ', ' + esc((w.member && w.member.name) || '') + (w.brand ? ', ' + esc(w.brand) : '') + (w.brand_owner ? ' (their brand)' : '') +
            (w.giveaway ? ', giveaway: ' + (w.giveaway === 'yes' ? 'yes' + (w.giveaway_note ? ' (' + esc(w.giveaway_note) + ')' : '') : 'no') : '') + '</small> <button type="button" class="hg-wx" data-wish-ok="' + esc(w.id) + '">Approve</button> <button type="button" class="hg-wx" data-wish-no="' + esc(w.id) + '">Decline</button> ');
        }).join('') + '</div>' : '<p class="dg-srow-p">Nothing waiting.</p>') + '</section>';
      }).catch(function () {});
    };
    // One click handler for the page at a time (a second visit replaces the first).
    if (main._wishH) main.removeEventListener('click', main._wishH);
    main.addEventListener('click', main._wishH = function (e) {
      if (curView !== 'xm-wish') return;
      var el;
      if ((el = e.target.closest('[data-wish-rm]'))) { holA('wish_remove', { id: el.getAttribute('data-wish-rm'), holiday: hk }).then(drawMine); return; }
      if ((el = e.target.closest('[data-wish-unsave]'))) { GIFTS = null; holA('gift_plus', { gift_id: el.getAttribute('data-wish-unsave'), on: false }).then(drawMine); return; }
      if ((el = e.target.closest('[data-wish-share]'))) {
        var u = el.getAttribute('data-wish-share');
        if (navigator.share) navigator.share({ title: 'My Holiday Wish List', url: u }).catch(function () {});
        else if (navigator.clipboard) navigator.clipboard.writeText(u).then(function () { el.textContent = 'Link copied'; });
        return;
      }
      if ((el = e.target.closest('[data-wish-ok],[data-wish-no]'))) {
        var ok = el.hasAttribute('data-wish-ok');
        holA('wish_review', { id: el.getAttribute(ok ? 'data-wish-ok' : 'data-wish-no'), decision: ok ? 'approve' : 'decline' }).then(function () { drawQueue(); drawShelves(); });
      }
    });
    drawMine(); drawShelves(); drawQueue();
  }

  // ---------- Holiday menus ----------
  function money(s) { return s ? esc(s) : ''; }
  function menuCard(m) {
    var l = m.listing || {}, vegan = l.vegan_status === 'fully_vegan';
    var where = [l.address_city, l.address_state].filter(Boolean).join(', ');
    var saved = !!SAVED[l.id];
    return '<div class="hg-menu">' +
      // Every logo opens the place's listing (Sean, 2026-11-10: "Make all of their logos take them to their listing").
      '<div class="hg-mh"><a class="hg-logo" href="/directory/' + encodeURIComponent(l.slug) + '" aria-label="' + esc(l.name) + ', their listing"' + (l.logo_url ? ' style="background-image:url(\'' + esc(l.logo_url) + '\')"' : '') + '>' + (l.logo_url ? '' : esc((l.name || '?').charAt(0))) + '</a>' +
      '<div><h3><a href="#/' + hx().menus + '/listing/' + encodeURIComponent(l.slug) + '">' + esc(l.name) + '</a></h3><small>' + esc(where || 'Online') + '</small></div>' +
      // The kind of menu sits in the card's top right corner (Sean, 2026-11-10), as it does in the menu window.
      '<span class="hg-tag hg-tr' + (vegan ? '' : ' pv') + '">' + (vegan ? '100% Vegan' : 'Plant-based (Pre-Vegan)') + '</span></div>' +
      (m.summary ? '<p class="hg-sum">' + esc(m.summary) + '</p>' : '') +
      // Past the order-by day the card stays for reference, says so, and its menu has no Order button (Sean, 2026-11-10).
      '<div class="hg-facts">' + (m.order_by ? (m.order_by < today() ? '<span><b>Orders closed</b> ' + esc(dayFmt(onDay(m.order_by), { month: 'long', day: 'numeric' })) + '</span>' : '<span><b>Order by</b> ' + esc(dayFmt(onDay(m.order_by), { month: 'long', day: 'numeric' })) + '</span>') : '') +
      (m.price_range ? '<span><b>Price</b> ' + esc(m.price_range) + '</span>' : '') + '</div>' +
      // One row of three (Sean, 2026-11-10): See Menu opens the menu in a lightbox over the page (/public/ve-holiday-menu.js).
      '<div class="hg-acts">' + menuBtn('m-' + l.slug) +
      '<a class="dg-btn dg-ghost" href="/directory/' + encodeURIComponent(l.slug) + '">Their Listing</a>' +
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
    var mk = hx().menus, hk = curHol();
    // Each holiday keeps its own menus; they load the first time its page opens.
    MENUS = LIVE[hk] ? LIVE[hk].menus : null; TIPS = LIVE[hk] ? LIVE[hk].tips : null;
    if (!LIVE[hk]) loadLive(hk);
    if (/^listing\//.test(sub)) return viewListing(decodeURIComponent(sub.slice(8)), ['Holiday menus', '#/' + mk]);
    if (sub === 'tell') return viewTell();
    if (/^menu\//.test(sub)) { OPEN_MENU = decodeURIComponent(sub.slice(5)); sub = null; }
    var ch = chapter(sub), t = hrow(), n = pills(ch).length, open = daysUntil(t.submit_close) > 0;
    main.innerHTML = head(t.name, 'Holiday menus near you', 'What Vegan places are cooking for ' + esc(t.name) + '. Every menu is checked by our team before it shows.') +
      '<div class="hg-tools2"><div class="hg-search"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#525252" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
      '<input type="search" id="hgQ" placeholder="Search places, dishes, cities..." aria-label="Search holiday menus" value="' + esc(MF.q) + '" autocomplete="off" data-dictate="off"></div>' +
      '<button type="button" class="hg-fbtn" id="hgFbtn" aria-expanded="false" aria-controls="hgPop">Filters<span class="hg-fcount"' + (n ? '' : ' hidden') + '>' + n + '</span></button>' +
      '<button type="button" class="hg-subbtn" id="hgSubBtn" aria-expanded="false" aria-controls="hgSubmit">Submit a Menu</button>' +
      '<div class="hg-pop" id="hgPop" hidden><div class="hg-pgrid">' +
        '<label class="hg-pf"><span>Chapter</span>' + chapterPick('hgChapter', ch) + '</label>' +
        sel('hgType', 'Menu', MF.type, [['all', 'Every menu'], ['vegan', '100% Vegan'], ['pv', 'Plant-based (Pre-Vegan)']]) +
        sel('hgOrder', 'Ordering', MF.order, [['all', 'Any'], ['open', 'Still taking orders'], ['online', 'Order online']]) +
        sel('hgSort', 'Sort by', MF.sort, [['vegan', '100% Vegan first'], ['az', 'A to Z'], ['soon', 'Order by soonest']]) +
      '</div><div class="hg-pfoot"><button type="button" class="dg-btn dg-ghost" data-hg-reset>Reset filters</button><button type="button" class="dg-btn" data-hg-done>Done</button></div></div></div>' +
      '<div class="hg-pills">' + pills(ch).map(function (p) { return '<button type="button" class="hg-pill" data-hg-unpill="' + p[0] + '">' + esc(p[1]) + ' <span aria-hidden="true">&times;</span></button>'; }).join('') + '</div>' +
      // Sending a menu stays out of the way until asked for (Sean, 2026-11-10: "focus on the menus... a green button next to the filter").
      '<div class="hg-submit" id="hgSubmit" hidden><div class="hg-subgrid">' +
        (open ? '<div><b>Run a Vegan business?</b><p>Send us your holiday menu. Free for members, up after a quick check.</p><a class="dg-btn" href="#/business">Send your menu</a></div>' : '') +
        (daysUntil(onDay(t.holiday_on)) ? '<div><b>Found a place cooking for ' + esc(t.name) + '?</b><p>Send us the link to its holiday menu and our team checks it.</p><a class="dg-btn dg-ghost" href="#/' + mk + '/tell" data-hg-tell>Tell us about a menu</a></div>' : '') +
      '</div>' + adminUpload() + '</div>' +
      '<div id="hgMenuList"></div>';
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
              return '<a class="hg-ares-r" href="/business/holiday-menu?listing=' + encodeURIComponent(l.slug) + '&holiday=' + curHol() + '&step=menu"><b>' + esc(l.name) + '</b><span>' + esc([l.address_city, l.address_state].filter(Boolean).join(', ') || 'Online') + '</span><em>Upload its menu</em></a>';
            }).join('') || '<p class="dg-srow-p">Nothing by that name. Add the place in Directory review first.</p>';
          }).catch(function () { out.innerHTML = '<p class="dg-srow-p">That did not load. Try again.</p>'; });
      }, 200);
    });
  }
  function drawMenuList(ch) {
    var box = document.getElementById('hgMenuList'); if (!box) return;
    if (MENUS === null) { box.innerHTML = '<div class="dg-loading">Loading the menus...</div>'; return; }
    var t = hrow(), open = daysUntil(t.submit_close) > 0, list = filtered(ch), any = MF.q || pills(ch).length, tips = tipsFiltered(ch);
    box.innerHTML = (list.length ? '<div class="hg-menus">' + list.map(menuCard).join('') + '</div>' : '') +
      (tips.length ? (list.length ? '<h3 style="margin:22px 0 10px;font-size:17px">Menus We Found</h3>' : '') + '<div class="hg-menus">' + tips.map(tipCard).join('') + '</div>' : '') +
      (list.length || tips.length ? '' : any && (MENUS.length || (TIPS || []).length) ? '<div class="hg-empty"><h3>Nothing Matches</h3><p>Try fewer words or reset the filters.</p><button type="button" class="dg-btn dg-ghost" data-hg-reset>Reset filters</button></div>' :
      '<div class="hg-empty"><h3>No Holiday Menus ' + (ch === 'all' ? '' : 'in ' + esc(chapterName(ch)) + ' ') + 'Yet</h3><p>' + (open ? 'Menus are coming in now, and each one shows here once our team has checked it.' : 'Menus for this holiday are closed.') + '</p></div>');
    openPending();
  }
  // The menu window (Sean, 2026-11-10): a card's Holiday Menu opens the place's menu over the page. The address carries it
  // (#/menus/menu/m-<slug> for a menu a place sent, t-<id> for one we found), so it can be shared; closing goes back to the list.
  var OPEN_MENU = null;
  function menuBtn(key) { return '<a class="dg-btn" href="#/' + hx().menus + '/menu/' + encodeURIComponent(key) + '" data-hg-menu="' + esc(key) + '">See Menu</a>'; }
  function menuData(key) {
    var hn = String(hrow().name || '').replace(/\s*\(.*\)$/, '');
    if (/^m-/.test(key)) {
      var m = (MENUS || []).filter(function (x) { return x.listing && x.listing.slug === key.slice(2); })[0]; if (!m) return null;
      var l = m.listing;
      return { name: l.name, slug: l.slug, logo: l.logo_url, city: l.address_city, state: l.address_state, vegan: l.vegan_status === 'fully_vegan', holiday: hn, summary: m.summary, items: m.items,
        order_by: m.order_by, pickup: m.pickup, price_range: m.price_range, holiday_hours: m.holiday_hours, order_url: m.order_url };
    }
    var t = (TIPS || []).filter(function (x) { return String(x.id) === key.slice(2); })[0]; if (!t) return null;
    var tl = t.listing;
    return { name: tl ? tl.name : t.place_name, slug: tl ? tl.slug : '', logo: tl && tl.logo_url, city: t.city || (tl && tl.address_city), state: t.state || (tl && tl.address_state),
      vegan: tl && tl.vegan_status ? tl.vegan_status === 'fully_vegan' : null, holiday: hn, note: t.note, link: t.link };
  }
  function openMenu(key) {
    var d = menuData(key); if (!d || !window.VEHolidayMenu) return false;
    VEHolidayMenu.open(d, { onClose: function () { if (/\/menu\//.test(location.hash)) history.replaceState(null, '', '#/' + hx().menus); } });
    return true;
  }
  function openPending() { if (OPEN_MENU && MENUS !== null) { var k = OPEN_MENU; OPEN_MENU = null; openMenu(k); } }
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
    var name = l ? '<a href="#/' + hx().menus + '/listing/' + encodeURIComponent(l.slug) + '">' + esc(l.name) + '</a>' : esc(x.place_name);
    var lg = (l && l.logo_url ? ' style="background-image:url(\'' + esc(l.logo_url) + '\')"' : '') + '>' + (l && l.logo_url ? '' : esc(String(x.place_name || '?').charAt(0)));
    return '<div class="hg-menu"><div class="hg-mh">' + (l ? '<a class="hg-logo" href="/directory/' + encodeURIComponent(l.slug) + '" aria-label="' + esc(l.name) + ', their listing"' + lg + '</a>' : '<div class="hg-logo"' + lg + '</div>') +
      '<div><h3>' + name + '</h3><small>' + esc(where || 'Online') + '</small></div>' +
      (l && l.vegan_status ? '<span class="hg-tag hg-tr' + (l.vegan_status === 'fully_vegan' ? '' : ' pv') + '">' + (l.vegan_status === 'fully_vegan' ? '100% Vegan' : 'Plant-based (Pre-Vegan)') + '</span>' : '') + '</div>' + (x.note ? '<p class="hg-sum">' + esc(x.note) + '</p>' : '') +
      '<div class="hg-acts">' + menuBtn('t-' + x.id) +
      (l ? '<a class="dg-btn dg-ghost" href="/directory/' + encodeURIComponent(l.slug) + '">Their Listing</a><button type="button" class="dg-save' + (SAVED[l.id] ? ' on' : '') + '" data-hg-save="' + esc(l.id) + '" aria-pressed="' + !!SAVED[l.id] + '">' + (SAVED[l.id] ? 'Saved' : 'Save') + '</button>' : '') + '</div>' +
      // Menus We Found (Sean, 2026-11-10): every found menu invites the place to claim its listing and post its full menu.
      '<p class="hg-claim">Your place? <a href="' + (l ? '/claim?listing=' + encodeURIComponent(l.slug) : '/claim?add=1') + '">' + (l ? 'Claim it free' : 'Get listed free') + '</a> and post your full menu.</p></div>';
  }
  // Tell us about a menu: members only (a join window first), checked by our team before it shows.
  function viewTell() {
    var t = hrow(), mk = hx().menus;
    main.innerHTML = crumb([['Holiday menus', '#/' + mk], ['Tell us about a menu']]) + head(t.name, 'Tell us about a holiday menu',
      'Found a place near you cooking for ' + esc(t.name) + '? Send us where to see its menu. Our team checks the link, and then it shows on Holiday menus for everyone.');
    if (!registered()) {
      main.innerHTML += '<div class="hg-empty"><h3>Members Tell Us About Menus</h3><p>Join free with a short survey, then send it. It comes back here when you are done.</p><button type="button" class="dg-btn" data-hg-tell>Join free</button></div>';
      return;
    }
    main.innerHTML += '<form class="hg-form" id="hgTell" novalidate>' +
      '<label><span>The place</span><input id="tPlace" maxlength="120" required autocomplete="off" placeholder="Its name" list="tPlaceList"><datalist id="tPlaceList"></datalist></label>' +
      '<div class="hg-f2"><label><span>City</span><input id="tCity" maxlength="80" autocomplete="off"></label><label><span>State</span><input id="tState" maxlength="40" autocomplete="off"></label></div>' +
      '<label><span>Link to the holiday menu</span><input id="tLink" type="url" inputmode="url" maxlength="500" required placeholder="https://"><small>Their website, an order page or the post where they shared it.</small></label>' +
      '<label><span>Anything we should know? (optional)</span><textarea id="tNote" maxlength="400" rows="3" placeholder="Order by date, pickup only, 100% Vegan..."></textarea></label>' +
      '<div class="dg-btns"><button type="submit" class="dg-btn" id="tSend">Send it to our team</button><a class="dg-btn dg-ghost" href="#/' + mk + '">Back to menus</a></div><p class="hg-fmsg" id="tMsg" role="status"></p></form>';
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
        body: JSON.stringify({ action: 'tip', holiday: curHol(), place_name: place.value.trim(), city: document.getElementById('tCity').value.trim(), state: document.getElementById('tState').value.trim(),
          link: link, note: document.getElementById('tNote').value.trim(), listing_id: l ? l.id : null }) })
        .then(function (r) { return r.json(); }).then(function (d) {
          if (d && d.ok) {
            var mk = hx().menus;
            main.innerHTML = crumb([['Holiday menus', '#/' + mk], ['Tell us about a menu']]) + '<div class="hg-empty"><h3>' + (d.already ? 'We Already Have That One' : d.status === 'live' ? 'It Is on Holiday Menus Now' : 'Thank You. Our Team Will Check It') + '</h3><p>' +
              (d.already ? 'Someone sent that menu already, so it is in our team\'s hands.' : d.status === 'live' ? 'You are on the team, so it went live at once.' : 'Once it is checked it shows on Holiday menus for everyone.') + '</p><div class="dg-btns" style="justify-content:center"><a class="dg-btn" href="#/' + mk + '/tell" onclick="setTimeout(function(){window.dispatchEvent(new HashChangeEvent(\'hashchange\'))},0)">Tell us about another</a><a class="dg-btn dg-ghost" href="#/' + mk + '">Back to menus</a></div></div>';
            if (d.status === 'live') loadLive(curHol());
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
    document.getElementById('hgChapter').addEventListener('change', function (e) { store('hg_chapter', e.target.value); location.hash = '#/' + hx().menus + '/' + e.target.value; });
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
  // Hanukkah and Christmas tables (Sean, 2026-11-08). Drafts written for this Guide, not yet kitchen-tested by our team; pictures are
  // illustrations (public/guides/holiday/r-*.jpg).
  var RECIPES_HK = [
    { k: 'latkes', name: 'Crispy potato latkes with cashew sour cream', course: 'The main', pic: 'r-latkes.jpg', serves: 'About 16 latkes', time: '45 minutes',
      line: 'Golden and crisp at the edges, held together with flax instead of eggs.',
      ing: ['2 lb russet potatoes, peeled', '1 onion', '2 tbsp ground flaxseed and 6 tbsp water', '1/3 cup all-purpose flour or matzo meal', '1 tsp salt, plus more to finish', '1/2 tsp baking powder', 'Black pepper', 'Neutral oil for frying', 'Cashew sour cream: 1 cup raw cashews, 1/2 cup water, 2 tbsp lemon juice, 1 tsp apple cider vinegar, 1/2 tsp salt'],
      steps: ['For the sour cream, cover the cashews with boiling water for 15 minutes, drain, then blend with the water, lemon, vinegar and salt until smooth. Chill.', 'Stir the flaxseed into the water and let it sit 10 minutes to thicken.', 'Grate the potatoes and onion. Wrap them in a clean towel and squeeze out as much liquid as you can.', 'Mix the potatoes and onion with the flax, flour, salt, baking powder and pepper.', 'Heat a quarter inch of oil in a heavy pan over medium-high heat. Drop in a quarter cup of the mix and flatten it.', 'Fry 3 to 4 minutes a side, until deep golden. Drain on a rack, salt them, and keep them warm in a 200°F oven while you fry the rest.', 'Serve with the sour cream and applesauce.'] },
    { k: 'applesauce', name: 'Chunky cinnamon applesauce', course: 'Side', pic: 'r-applesauce.jpg', serves: 'About 4 cups', time: '30 minutes',
      line: 'Warm or cold, the other half of every latke.',
      ing: ['3 lb apples (a mix of sweet and tart), peeled and chopped', '1/2 cup water', '1 cinnamon stick', '1 tbsp lemon juice', '1 to 2 tbsp maple syrup, to taste'],
      steps: ['Put everything but the maple syrup in a pot and bring it to a simmer.', 'Cover and cook about 20 minutes, stirring now and then, until the apples are soft.', 'Take out the cinnamon stick and mash to the texture you like. Sweeten with maple syrup if it needs it.'] },
    { k: 'tzimmes', name: 'Carrot and sweet potato tzimmes', course: 'Side', pic: 'r-tzimmes.jpg', serves: 'Serves 6', time: '1 hour',
      line: 'Sweet, glossy and already plant-based at heart.',
      ing: ['2 lb carrots, sliced into coins', '1 lb sweet potatoes, cut in cubes', '1 cup pitted prunes or dried apricots', '1/2 cup orange juice', '1/4 cup maple syrup', '2 tbsp olive oil or plant butter', '1/2 tsp cinnamon', '1/2 tsp salt'],
      steps: ['Heat the oven to 375°F.', 'Toss everything together in a baking dish.', 'Cover with foil and bake 40 minutes.', 'Uncover, stir, and bake 15 to 20 minutes more, until the carrots are tender and glazed.'] },
    { k: 'sufganiyot', name: 'Jelly doughnuts (sufganiyot)', course: 'Dessert', pic: 'r-sufganiyot.jpg', serves: 'About 14 doughnuts', time: '2 hours 30 minutes, with rising',
      line: 'Soft, jam-filled and dusted with sugar, made without eggs or dairy.',
      ing: ['2 1/4 tsp instant yeast', '3/4 cup unsweetened plant milk, warmed', '1/4 cup sugar (organic or beet sugar is never filtered with bone char)', '1 tbsp ground flaxseed and 3 tbsp water', '3 tbsp plant butter, melted', '2 1/2 cups all-purpose flour', '1/2 tsp salt', 'Neutral oil for frying', '1/2 cup strawberry jam', 'Powdered sugar'],
      steps: ['Stir the yeast and a pinch of the sugar into the warm milk and let it sit 5 minutes. Stir the flaxseed into the water.', 'Mix in the rest of the sugar, the flax and the butter, then the flour and salt. Knead 6 to 8 minutes, until smooth.', 'Cover and let it rise in a warm spot for about an hour, until doubled.', 'Roll it half an inch thick and cut 2 1/2 inch rounds. Let them rise 30 minutes.', 'Heat 2 inches of oil to 350°F. Fry a few at a time, 1 to 1 1/2 minutes a side, until golden. Drain.', 'Poke a hole in each side, pipe in the jam, and dust with powdered sugar.'] }
  ];
  var RECIPES_XM = [
    { k: 'wellington', name: 'Mushroom and walnut Wellington', course: 'The main', pic: 'r-wellington.jpg', serves: 'Serves 6', time: '1 hour 45 minutes',
      line: 'A golden pastry centerpiece with a rich, savory filling.',
      ing: ['2 tbsp olive oil', '1 onion, finely diced', '1 1/2 lb cremini mushrooms, finely chopped', '3 garlic cloves, minced', '1 tsp dried thyme', '1 tsp chopped fresh rosemary', '2 tbsp soy sauce or tamari', '1 cup walnuts, toasted and chopped', '1 cup cooked lentils', '1/2 cup breadcrumbs', '1 tbsp Dijon mustard', '1 sheet plant-based puff pastry (many are made with oil; check the label for butter)', '2 tbsp plant milk and 1 tbsp maple syrup, for brushing'],
      steps: ['Cook the onion in the oil for 5 minutes. Add the mushrooms and cook until their liquid is gone, 12 to 15 minutes. Add the garlic, herbs and soy sauce for 1 minute. Let it cool.', 'Mix in the walnuts, lentils, breadcrumbs and mustard. Season to taste.', 'Heat the oven to 400°F and line a baking sheet with parchment.', 'Roll the pastry a little larger. Shape the filling into a log down the middle, fold the pastry over and seal it, seam side down.', 'Score the top, brush with the milk and maple, and bake 35 to 40 minutes, until deep golden.', 'Rest 10 minutes before slicing.'] },
    { k: 'sprouts', name: 'Maple roasted Brussels sprouts with pecans', course: 'Side', pic: 'r-sprouts.jpg', serves: 'Serves 6', time: '35 minutes',
      line: 'Crisp, sweet and tangy, with cranberries for color.',
      ing: ['2 lb Brussels sprouts, trimmed and halved', '3 tbsp olive oil', 'Salt and pepper', '2 tbsp maple syrup', '1 tbsp balsamic vinegar', '1/2 cup pecans', '1/3 cup dried cranberries'],
      steps: ['Heat the oven to 425°F.', 'Toss the sprouts with the oil, salt and pepper and spread them cut side down on a sheet pan.', 'Roast 20 to 25 minutes, adding the pecans for the last 5, until the sprouts are browned and tender.', 'Toss with the maple, balsamic and cranberries and serve warm.'] },
    { k: 'nog', name: 'Creamy cashew nog', course: 'Drink', pic: 'r-nog.jpg', serves: 'About 5 cups', time: '10 minutes, plus chilling',
      line: 'Rich, spiced and made in a blender.',
      ing: ['1 cup raw cashews, soaked 15 minutes in boiling water and drained', '3 cups unsweetened oat or almond milk', '1/3 cup maple syrup', '1 tsp vanilla', '1/2 tsp ground nutmeg, plus more to top', '1/4 tsp cinnamon', 'A pinch of salt'],
      steps: ['Blend everything until completely smooth.', 'Chill at least an hour. It thickens as it chills; add a splash of milk if you like it thinner.', 'Pour and top with a little nutmeg.'] },
    { k: 'gingerbread', name: 'Gingerbread cookies', course: 'Dessert', pic: 'r-gingerbread.jpg', serves: 'About 24 cookies', time: '1 hour 30 minutes, with chilling',
      line: 'Soft, spiced and made for decorating.',
      ing: ['3 cups all-purpose flour', '1 tbsp ground ginger', '1 1/2 tsp cinnamon', '1/4 tsp ground cloves', '1 tsp baking soda', '1/2 tsp salt', '1/2 cup plant butter, softened', '1/2 cup brown sugar (organic or beet sugar)', '1/2 cup molasses', '1 tbsp ground flaxseed and 3 tbsp water', '1 tsp vanilla', 'Icing: 1 cup powdered sugar and 1 to 2 tbsp plant milk'],
      steps: ['Stir the flaxseed into the water and let it sit 10 minutes.', 'Whisk the flour, spices, baking soda and salt.', 'Beat the butter and sugar until fluffy, then the molasses, flax and vanilla. Mix in the dry ingredients.', 'Divide the dough in two, wrap and chill 1 hour.', 'Heat the oven to 350°F. Roll a quarter inch thick, cut your shapes and bake 8 to 10 minutes.', 'Cool, then decorate with the icing.'] }
  ];
  var RECIPE_SETS = { thanksliving: RECIPES, hanukkah: RECIPES_HK, christmas: RECIPES_XM };
  // [title, line under it, the note at the foot of the list]
  var RECIPE_HEAD = {
    thanksliving: ['A ThanksLiving table to make at home', 'A main, gravy, four sides and a pie. Every one is plant-based, and most can be made a day ahead.',
      '<b>Short on time?</b> Pick up a roast, a gravy or a pie <a href="#/store">at the store</a>, or <a href="#/menus">order from a Vegan place near you</a>.'],
    hanukkah: ['A plant-based Hanukkah table', 'Latkes with cashew sour cream, applesauce, carrot tzimmes and jelly doughnuts. Every one is plant-based.',
      '<b>Rather not fry?</b> <a href="#/hk-menus">Order from a Vegan place near you</a>, or find <a href="#/hk-events">a latke night on our calendar</a>.'],
    christmas: ['A plant-based Christmas table', 'A Wellington for the middle of the table, a side, a nog and cookies to share. Every one is plant-based.',
      '<b>Mashed potatoes and gravy?</b> Use <a href="#/recipes/mash">our ThanksLiving ones</a>. Short on time? <a href="#/xm-store">Pick it up at the store</a> or <a href="#/xm-menus">order from a Vegan place</a>.']
  };

  function viewRecipes(sub) {
    var RECIPES = RECIPE_SETS[curHol()] || RECIPE_SETS.thanksliving, rk = hx().recipes, rh = RECIPE_HEAD[curHol()] || RECIPE_HEAD.thanksliving;
    var buy = hx().store ? ['Buy it instead', '#/' + hx().store] : ['Order it instead', '#/' + hx().menus];
    var r = RECIPES.filter(function (x) { return x.k === sub; })[0];
    if (r) {
      var i = RECIPES.indexOf(r), next = RECIPES[(i + 1) % RECIPES.length];
      main.innerHTML = crumb([['Recipes', '#/' + rk], [r.name]]) +
        '<div class="hg-rcp1"><div class="hg-rcp1-b"><div class="dg-k">' + esc(r.course) + '</div><h2 class="dg-h1">' + esc(tc(r.name)) + '</h2>' +
        '<p class="dg-lede">' + esc(r.line) + '</p><div class="hg-facts"><span><b>' + esc(r.serves) + '</b></span><span><b>Time</b> ' + esc(r.time) + '</span></div>' +
        '<h3 class="hg-sh">What You Need</h3><ul class="hg-ing">' + r.ing.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
        '<h3 class="hg-sh">How to Make It</h3><ol class="hg-steps">' + r.steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol></div>' +
        '<div class="hg-rcp1-p"><img src="' + PIC + r.pic + '" alt="" width="640" height="640"><small>Illustration</small></div></div>' +
        '<div class="dg-btns" style="margin-top:18px"><a class="dg-btn" href="#/' + rk + '/' + next.k + '">Next: ' + esc(next.name) + '</a><a class="dg-btn dg-ghost" href="#/' + rk + '">Every recipe</a><a class="dg-btn dg-ghost" href="' + buy[1] + '">' + buy[0] + '</a></div>';
      return;
    }
    main.innerHTML = head('Cook it yourself', rh[0], rh[1]) +
      // Chefs send their own recipes (Sean, 2026-11-10), from the button to the right of the search, the way every page adds.
      '<div class="hg-tools2"><div class="hg-search"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#525252" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
      '<input type="search" id="hgRq" placeholder="Search recipes and ingredients..." aria-label="Search recipes" autocomplete="off" data-dictate="off"></div>' +
      '<button type="button" class="hg-subbtn" data-hg-open="hgRcpPanel" aria-expanded="false" aria-controls="hgRcpPanel">Submit a Recipe</button></div>' +
      '<div class="hg-submit" id="hgRcpPanel" hidden>' + recipeForm() + '</div>' +
      '<div class="hg-rcps">' + RECIPES.map(function (x) {
        return '<a class="hg-rcp" data-rq="' + esc([x.name, x.course, x.line].concat(x.ing || []).join(' ').toLowerCase()) + '" href="#/' + rk + '/' + x.k + '"><span class="hg-rcp-pic"><img src="' + PIC + x.pic + '" alt="" loading="lazy" width="320" height="320"></span>' +
          '<span class="hg-rcp-b"><span class="dg-k">' + esc(x.course) + '</span><b>' + esc(tc(x.name)) + '</b><span>' + esc(x.line) + '</span><small>' + esc(x.serves) + ' &middot; ' + esc(x.time) + '</small></span></a>';
      }).join('') + '</div>' +
      '<div class="hg-empty" id="hgRnone" hidden><h3>Nothing Matches</h3><p>Try another dish or ingredient. Have one to share? Submit a Recipe.</p></div>' +
      '<div class="hg-note">' + rh[2] + '</div>';
    var rq = document.getElementById('hgRq');
    rq.addEventListener('input', function () {
      var w = rq.value.trim().toLowerCase().split(/\s+/).filter(Boolean), n = 0;
      Array.prototype.forEach.call(main.querySelectorAll('.hg-rcp'), function (c) { var t = c.getAttribute('data-rq'), on = !w.some(function (x) { return t.indexOf(x) < 0; }); c.hidden = !on; if (on) n++; });
      document.getElementById('hgRnone').hidden = n > 0;
    });
    wireRecipeForm();
  }
  // Submit a Recipe: sent to ve-feedback as an idea (Depot > Feedback and the Inbox), with who sent it, so the team can try it and credit them.
  function recipeForm() {
    return '<section class="hg-sug"><h3>Submit a Recipe</h3><p>Chefs and home cooks: send us your plant-based ' + esc(hx().label) + ' recipe. Our team reads every one, and a recipe we feature carries your name and a link to you.</p>' +
      '<form class="hg-sugf hg-rcpf" novalidate><label>Recipe name<input name="title" maxlength="120" required placeholder="Maple roasted squash"></label>' +
      '<label>Your name<input name="name" maxlength="120" required></label>' +
      '<label>Your email<input name="email" type="email" maxlength="200" required></label>' +
      '<label>Your website or Instagram (optional)<input name="site" maxlength="200" placeholder="https:// or @handle"></label>' +
      '<label>A link to the recipe (optional)<input name="link" maxlength="400" placeholder="https://"></label>' +
      '<label>Or write it here: what you need and how to make it<textarea name="body" maxlength="2200" rows="7"></textarea></label>' +
      '<div class="dg-btns" style="margin:0"><button class="dg-btn" type="submit">Send my recipe</button></div><p class="dg-srow-p" data-smsg style="margin:0"></p></form></section>';
  }
  function wireRecipeForm() {
    var f = main.querySelector('.hg-rcpf'); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (k) { return f[k].value.trim(); }, msg = f.querySelector('[data-smsg]'), btn = f.querySelector('button');
      if (!v('title')) { msg.textContent = 'Give the recipe a name.'; f.title.focus(); return; }
      if (!v('name')) { msg.textContent = 'Tell us your name, so we can credit you.'; f.name.focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email'))) { msg.textContent = 'Add your email, so we can reach you.'; f.email.focus(); return; }
      if (!v('link') && v('body').length < 40) { msg.textContent = 'Add a link to the recipe, or write it out.'; f.body.focus(); return; }
      var text = ('[Holiday Guide recipe, ' + hx().label + '] ' + v('title') + '\nFrom: ' + v('name') + (v('site') ? ' (' + v('site') + ')' : '') +
        (v('link') ? '\nLink: ' + v('link') : '') + (v('body') ? '\n\n' + v('body') : '')).slice(0, 3000);
      var vid = ''; try { vid = localStorage.getItem('ve_visitor') || ''; } catch (x) {}
      btn.disabled = true; msg.textContent = 'Sending...';
      fetch(SB + '/functions/v1/ve-feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_url: location.origin + '/guides/holiday-guide#/' + hx().recipes, page_label: 'Holiday Guide: Recipes (' + hx().label + ')', kind: 'idea', message: text, email: v('email'), name: v('name'), visitor: vid, viewport: innerWidth + 'x' + innerHeight }) })
        .then(function (r) { return r.json(); }).then(function (d) {
          if (!d || !d.ok) throw d;
          f.reset(); msg.textContent = 'Thank you. Your recipe is with our team.';
        }).catch(function () { msg.textContent = 'That did not send. Try again in a minute.'; }).then(function () { btn.disabled = false; });
    });
  }

  // ---------- At the store ----------
  // What is on supermarket shelves this season, by brand (Sean, 2026-11-08: "do a scan of... Thanksgiving options for vegans in the
  // supermarkets"). Read from 2026 reviews and guides (VegNews, PETA's 2026 roast list, Big Box Vegan, store and brand pages); stock
  // varies by store, so the page says check before you go. `slug` is the brand's Directory listing when we have one.
  var BRAND_SLUGS = ['tofurky', 'fieldroast', 'gardein', 'country-crock-plant-butter', 'miyokos', 'earth-balance', 'silk', 'so-delicious', 'whole-foods-market'];
  var BRAND_URL = SB + '/rest/v1/listings?select=slug,name,logo_url&status=eq.approved&slug=in.(' + BRAND_SLUGS.join(',') + ')';
  var BRANDS = {};
  var STORE_TL = [
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

  // Christmas at the store (Sean, 2026-11-08), read from 2025 and 2026 guides (VegNews's holiday roast guide, Go Dairy Free's nog list, store
  // and brand pages). Nogs are seasonal; stock varies by store, so the page says check before you go.
  var STORE_XM = [
    { h: 'The Main', pic: 'r-wellington.jpg', items: [
      ['Field Roast', 'Celebration Roast', 'fieldroast', 'A stuffed roast that slices like a holiday centerpiece.'],
      ['Field Roast', 'Hazelnut & Cranberry Roast en Croûte', 'fieldroast', 'Wrapped in puff pastry, ready for the middle of the table.'],
      ['Gardein', 'Turk\'y Roast', 'gardein', 'Stuffed with brown and wild rice, cranberries and kale, with gravy.'],
      ['Tofurky', 'Plant-Based Roast & Gravy', 'tofurky', 'The most widely stocked roast, with gravy in the box.'],
      ['Whole Foods Market', '365 Meatless Plant-Based Roast with Gravy', 'whole-foods-market', 'The store brand\'s own roast, sold through the holiday season.']] },
    { h: 'Nog', pic: 'r-nog.jpg', items: [
      ['So Delicious', 'Dairy Free Holiday Nog', 'so-delicious', 'Coconut milk nog in the refrigerated case.'],
      ['Silk', 'Nog', 'silk', 'A soy nog, out from fall into the new year.'],
      ['Califia Farms', 'Holiday Nog', '', 'An almond milk nog in a bottle.'],
      ['Almond Breeze', 'Almondmilk Nog', '', 'Look for it beside the almond milk.'],
      ['Planet Oat', 'Holiday Nog', '', 'An oat milk nog.']] },
    { h: 'Butter and Cream', pic: 'r-mash.jpg', items: [
      ['Country Crock', 'Plant Butter', 'country-crock-plant-butter', 'Sticks and tubs for baking and the table.'],
      ['Miyoko\'s', 'Cultured Vegan Butter', 'miyokos', 'A rich cultured butter for the table.'],
      ['Earth Balance', 'Buttery Sticks', 'earth-balance', 'A classic for cookies and pastry.'],
      ['Country Crock', 'Dairy Free Heavy Whipping Cream', 'country-crock-plant-butter', 'Swaps one for one; it whips best very cold.']] },
    { h: 'Baking and Treats', pic: 'r-gingerbread.jpg', items: [
      ['Puff pastry', 'Frozen puff pastry sheets', '', 'Many are made with oil, not butter. Read the label before you buy it for a Wellington.'],
      ['So Delicious', 'CocoWhip', 'so-delicious', 'A coconut whipped topping.'],
      ['Reddi-wip', 'Dairy-free whipped topping', '', 'The can, made with almond or coconut. Check that the can says dairy-free.']] }
  ];
  var STORE = STORE_TL;
  var STORE_SETS = { thanksliving: STORE_TL, christmas: STORE_XM };
  // [title, line under it, a note under the list]
  var STORE_HEAD = {
    thanksliving: ['Plant-based at the supermarket', 'Roasts, gravy, butter, cream and dessert you can pick up this season. Stock changes by store and by week, so check before you go and read the label.',
      '<b>Not back this year:</b> Trader Joe\'s Breaded Turkey-less Stuffed Roast. The chain told VegNews in October 2026 that it has no plans to bring it back.'],
    christmas: ['Plant-based Christmas at the supermarket', 'Roasts, nog, butter and baking you can pick up this season. Stock changes by store and by week, so check before you go and read the label.',
      '<b>Nog goes fast.</b> It is seasonal, and many stores sell out before Christmas. Or make <a href="#/xm-recipes/nog">our cashew nog</a> in a blender.']
  };
  function brandLogo(slug, name) {
    // Field Roast's Directory logo is a Chao cheese picture (set 2026-11-01), so it shows its letter here until the logo is fixed.
    var l = slug && slug !== 'fieldroast' && BRANDS[slug];
    // Every logo opens its listing (Sean, 2026-11-10: "Anytime we have the logo anywhere, when you click it, it should take you to their profile").
    var tag = slug && BRANDS[slug] ? 'a' : 'span', href = tag === 'a' ? ' href="/directory/' + encodeURIComponent(slug) + '" aria-label="' + esc(name) + ', their listing"' : '';
    return '<' + tag + ' class="hg-blogo"' + href + (l && l.logo_url ? ' style="background-image:url(\'' + esc(l.logo_url) + '\')"' : '') + '>' + (l && l.logo_url ? '' : esc(name.charAt(0))) + '</' + tag + '>';
  }
  // At the Store (Sean, 2026-11-08: "a filter system where people can choose the categories... and search for items. They can also
  // suggest items as feedback"): a search, the shelves as chips (any number on, none means every shelf), and Suggest an item, sent to
  // ve-feedback as kind "missing" (Depot > Feedback and the Inbox), the Events Guide's Gear way.
  var SF = { q: '', cats: {} };
  var STORE_AT = null;
  function viewStore() {
    var h = curHol(), sh = STORE_HEAD[h] || STORE_HEAD.thanksliving;
    if (STORE_AT !== h) { SF = { q: '', cats: {} }; STORE_AT = h; }
    STORE = STORE_SETS[h] || STORE_SETS.thanksliving;
    main.innerHTML = head('At the store', sh[0], sh[1]) +
      '<div class="hg-tools2"><div class="hg-search"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#525252" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
      '<input type="search" id="hgSq" placeholder="Search brands and items..." aria-label="Search the store list" value="' + esc(SF.q) + '" autocomplete="off" data-dictate="off"></div>' +
      // The way to add to a page sits to the right of its search on every page (Sean, 2026-11-10), as Submit a Menu does.
      '<button type="button" class="hg-subbtn" data-hg-open="hgSugPanel" aria-expanded="false" aria-controls="hgSugPanel">Suggest an Item</button></div>' +
      '<div class="hg-submit" id="hgSugPanel" hidden>' + storeSuggest() + '</div>' +
      '<div class="hg-chips" role="group" aria-label="Shelves"><button type="button" class="hg-chip" data-hg-cat=""' + (Object.keys(SF.cats).length ? '' : ' aria-pressed="true"') + '>All</button>' +
      STORE.map(function (g) { return '<button type="button" class="hg-chip" data-hg-cat="' + esc(g.h) + '" aria-pressed="' + (SF.cats[g.h] ? 'true' : 'false') + '">' + shelfIcon(g.h) + esc(g.h) + '</button>'; }).join('') + '</div>' +
      '<div id="hgStoreList"></div>' +
      (sh[2] ? '<div class="hg-note">' + sh[2] + '</div>' : '') +
      '<div class="dg-btns"><a class="dg-btn" href="#/' + hx().recipes + '">Or cook it yourself</a><a class="dg-btn dg-ghost" href="#/' + hx().menus + '">Order from a Vegan place</a></div>';
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
      // Each shelf reads like a section of a menu (Sean, 2026-11-10): a flat icon and the shelf's name, then the item, what it is,
      // and the brand on the right, linked to its listing when we have one.
      return '<section class="hg-shelf"><h3 class="hg-shelf-h">' + shelfIcon(g.h) + esc(g.h) + '</h3><div class="hg-mlist">' +
        items.map(function (it) {
          var brand = it[2] && BRANDS[it[2]] ? '<a href="/directory/' + encodeURIComponent(it[2]) + '">' + esc(it[0]) + '</a>' : esc(it[0]);
          // The brand's logo stays on the left of every row (Sean, 2026-11-10: "Anytime we can have a logo on a page, we want a logo").
          return '<div class="hg-mrow">' + brandLogo(it[2], it[0]) + '<div class="hg-mrow-b"><b>' + esc(it[1]) + '</b><p>' + esc(it[3]) + '</p></div><span class="hg-mbrand">' + brand + '</span></div>';
        }).join('') + '</div></section>';
    }).join('');
    box.innerHTML = html || '<div class="hg-empty"><h3>Nothing Matches</h3><p>Try fewer words or another shelf. Know one we are missing? Suggest it below.</p></div>';
  }
  // Flat icons for the shelves (Sean, 2026-11-10: the pictures read as brown squares at chip size).
  var SHELF_ICON = {
    'The Main': '<path d="M3 17h18"/><path d="M5 17a7 7 0 0 1 14 0"/><path d="M12 10V8"/><circle cx="12" cy="6.5" r="1.3"/><path d="M4 20h16"/>',
    'Gravy and Stuffing': '<path d="M3 10h13l4.5-3"/><path d="M3 10c0 4.2 2.8 7 7 7h1.5c3.2 0 5.5-2.6 5.5-7"/><path d="M7 20h8"/>',
    'Butter and Cream': '<rect x="3" y="10" width="18" height="7" rx="1.5"/><path d="M6 10V7.5h12V10"/><path d="M7 13.5h4"/>',
    'Dessert': '<path d="M3 18L12 6l9 12z"/><path d="M5.6 14.5h12.8"/><path d="M3 18h18"/>',
    'Nog': '<path d="M5 8h11v7a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3.5v2M11 3.5v2M14 3.5v2"/>',
    'Baking and Treats': '<circle cx="12" cy="12" r="8.5"/><circle cx="9" cy="9.5" r="1"/><circle cx="14.5" cy="9" r="1"/><circle cx="14" cy="14.5" r="1"/><circle cx="9.5" cy="14.5" r="1"/>'
  };
  function shelfIcon(h) {
    return '<svg class="hg-sico" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (SHELF_ICON[h] || SHELF_ICON['The Main']) + '</svg>';
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
      var kos = curView === 'hk-kosher';
      var text = '[Holiday Guide ' + (kos ? 'kosher place suggestion' : 'store suggestion') + ', ' + hx().label + '] ' + item + (f.where.value.trim() ? '\nWhere: ' + f.where.value.trim() : '');
      var vid = ''; try { vid = localStorage.getItem('ve_visitor') || ''; } catch (x) {}
      btn.disabled = true; msg.textContent = 'Sending...';
      fetch(SB + '/functions/v1/ve-feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_url: location.origin + '/guides/holiday-guide#/' + (hx().store || 'store'), page_label: 'Holiday Guide: At the Store (' + hx().label + ')', kind: 'missing', message: text, email: f.email.value.trim(), visitor: vid, viewport: innerWidth + 'x' + innerHeight }) })
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
    var h = curHol(), ek = hx().events, lede = hx().evLede;
    EVENTS = EVS[h] === undefined ? null : EVS[h];
    if (EVS[h] === undefined) { EVS[h] = null; rest(eventsUrl(h)).then(function (d) { EVS[h] = Array.isArray(d) ? d : []; }).catch(function () { EVS[h] = []; }).then(function () { if (curView === ek) route(); }); }
    var btns = '<div class="hg-evtop"><a class="dg-btn hg-sm" href="/events#submit/1">Add your event</a><a class="dg-btn dg-ghost hg-sm" href="/events">The whole calendar</a></div>';
    if (!EVENTS) { main.innerHTML = head('Events', 'Holiday Events', lede) + btns + '<div class="dg-loading">Loading events...</div>'; return; }
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
      }).join('') + '</div>' : '<div class="hg-empty"><h3>No ' + esc(hx().label) + ' Events on the Calendar Yet</h3><p>' + esc(hx().evEmpty) + ' Add it to our calendar and people near you can find it.</p></div>');
    var sel = document.getElementById('hgEvRegion');
    if (sel) sel.addEventListener('change', function () { location.hash = '#/' + ek + (sel.value ? '/' + sel.value : ''); });
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
    // Places with a donation link come first (Sean, 2026-11-08): each card opens its Directory page, where the Donate button is.
    rest2 = rest2.filter(function (l) { return l.give_url; }).concat(rest2.filter(function (l) { return !l.give_url; }));
    main.innerHTML = head('Give back', 'Give where it counts', lede) + tools +
      (partners.length ? '<h3 style="margin:6px 0 10px;font-size:16px">Our Nonprofit Partners</h3>' + cards(partners, 'hgGiveP') : '') +
      (rest2.length ? '<h3 style="margin:18px 0 10px;font-size:16px">In Our Directory</h3>' + cards(rest2.slice(0, 60), 'hgGive') : '<div class="hg-empty"><h3>None ' + (ch === 'all' ? '' : 'in ' + esc(chapterName(ch)) + ' ') + 'Yet</h3></div>') +
      '<div class="hg-note">Each organization takes gifts on its own site. We never handle donations. Run a nonprofit? <a href="/guides/nonprofit-guide">The Nonprofit Guide</a> shows how to become a Nonprofit Partner and be featured here.</div>';
    wireChapter('giveback'); wireCards('hgGiveP'); wireCards('hgGive');
  }
  function cards(list, id) { return '<div class="vrd-root"><div class="rank-grid" id="' + id + '">' + list.map(function (l, i) { return window.VERegionDirectory ? VERegionDirectory.card(l, i) : ''; }).join('') + '</div></div>'; }
  // Give Back sends people to the organization's Directory page, where its Donate button and Why support are (Sean, 2026-11-08).
  function wireCards(id) { var g = document.getElementById(id); if (g && window.VERegionDirectory) VERegionDirectory.wire(g, function (slug) { location.href = '/directory/' + encodeURIComponent(slug); }); }

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
      'Cooking for the holidays? Send us your menu, your order-by date and your holiday hours, and we feature it in this Guide, free for members. After a quick check by our team, usually within a day, it goes up right away. Most people order early, so send it as soon as it is set.') +
      '<div class="dg-srows">' +
      row({ icon: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.4-7 8-7s7 2.5 8 7"/>', title: '1. Join free', body: '<p class="dg-srow-p">A short survey makes you a member. No charge.</p>' }) +
      row({ icon: '<path d="M4 10l8-6 8 6v10H4z"/><path d="M9 20v-6h6v6"/>', title: '2. Claim your page', body: '<p class="dg-srow-p">Claiming your Directory page is free for members. Not listed yet? Add it free.</p>' }) +
      row({ icon: '<path d="M7 3h10v18H7z"/><path d="M10 8h4M10 12h4M10 16h2"/>', title: '3. Send your menu', body: '<p class="dg-srow-p">Type your dishes, add photos, or drop a photo or PDF of your menu and we read it for you.</p>' }) +
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
    if (!v) { if (vid) { vid.pause(); vid.remove(); vid = null; box.removeAttribute('data-vid'); } var o0 = box.querySelector('.hg-rplay'); if (o0) o0.hidden = true; return; }
    if (box.getAttribute('data-vid') === curTab && vid) return;
    if (vid) { vid.pause(); vid.remove(); }
    vid = document.createElement('video');
    vid.playsInline = true; vid.preload = 'none'; vid.setAttribute('playsinline', '');
    vid.poster = tab(curTab).pic || '/public/guides/holiday/theo-thanksliving.jpg';
    vid.src = VIDEO_BASE + (VFILE[curTab] || curTab) + '-' + v + '.mp4';
    vid.setAttribute('aria-label', 'Theo summarizes the ' + tab(curTab).label + ' page');
    vid.innerHTML = '<track kind="captions" srclang="en" label="English" default src="/public/guides/holiday/video/theo-' + (VFILE[curTab] || curTab) + '-' + v + '.vtt">';
    vid.addEventListener('play', function () { PLAY.tab = curTab; PLAY.playing = true; paintPlay(); try { gtag('event', 'video_start', { video: 'holiday_' + curTab }); } catch (e) {} });
    vid.addEventListener('pause', function () { PLAY.playing = false; paintPlay(); });
    vid.addEventListener('ended', function () { PLAY.playing = false; paintPlay(); try { gtag('event', 'video_complete', { video: 'holiday_' + curTab }); } catch (e) {} });
    vid.addEventListener('click', function () { if (vid.paused) { PLAY.started = true; vid.play().catch(function () {}); } else vid.pause(); });
    // On phones the card is small and Theo's words already show beside it, so captions show from tablet width up.
    try { vid.textTracks[0].mode = window.innerWidth > 900 ? 'showing' : 'hidden'; } catch (e) {}
    box.appendChild(vid); box.setAttribute('data-vid', curTab);
    // A play button on the frame itself, so Play is in sight even when the rail's own button is below the fold.
    var ov = box.querySelector('.hg-rplay');
    if (!ov) { ov = document.createElement('button'); ov.type = 'button'; ov.className = 'hg-rplay'; ov.setAttribute('aria-label', 'Play Theo'); ov.innerHTML = '&#9654;'; box.appendChild(ov);
      ov.addEventListener('click', function () { if (vid) { PLAY.started = true; vid.play().catch(function () {}); } }); }
    ov.hidden = false;
    vid.addEventListener('play', function () { ov.hidden = true; });
    var me = vid; vid.addEventListener('pause', function () { if (vid === me) ov.hidden = false; });
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
  // Expand (phones): the page's video, or Theo's picture, big in a lightbox; it picks up where the frame's video was.
  function expand() {
    var lb = document.getElementById('hgLb');
    if (!lb) {
      lb = document.createElement('div'); lb.id = 'hgLb'; lb.className = 'hg-lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Theo, bigger');
      document.body.appendChild(lb);
      lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('.hg-lb-x')) closeExpand(); });
    }
    var v = VIDEO[curTab], at = vid && !isNaN(vid.currentTime) ? vid.currentTime : 0;
    stopTheo(); paintPlay();
    lb.innerHTML = '<div class="hg-lb-in"><button type="button" class="hg-lb-x">Close</button>' + (v
      ? '<video controls playsinline autoplay poster="' + esc(tab(curTab).pic || '') + '" src="' + VIDEO_BASE + curTab + '-' + v + '.mp4"><track kind="captions" srclang="en" label="English" default src="/public/guides/holiday/video/theo-' + curTab + '-' + v + '.vtt"></video>'
      : '<img alt="Theo" src="' + esc(tab(curTab).pic || (window.VEGuideArt ? VEGuideArt('theo', 'square') : '')) + '">') + '</div>';
    lb.hidden = false; document.documentElement.style.overflow = 'hidden';
    var lv = lb.querySelector('video');
    if (lv) { try { lv.currentTime = at; lv.textTracks[0].mode = 'showing'; } catch (e) {} lv.play().catch(function () {}); try { gtag('event', 'video_expand', { video: 'holiday_' + curTab }); } catch (e) {} }
    lb.querySelector('.hg-lb-x').focus();
  }
  function closeExpand() {
    var lb = document.getElementById('hgLb'); if (!lb || lb.hidden) return;
    var lv = lb.querySelector('video'); if (lv) lv.pause();
    lb.hidden = true; lb.innerHTML = ''; document.documentElement.style.overflow = '';
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeExpand(); });
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
    if (!box.querySelector('.hg-expand')) {
      box.insertAdjacentHTML('beforeend', '<button type="button" class="hg-expand" aria-label="Expand Theo">Expand</button>');
      box.querySelector('.hg-expand').addEventListener('click', function (e) { e.stopPropagation(); expand(); });
    }
    tourEl.innerHTML = tourM.innerHTML = '<a class="dg-tnav" href="' + href(TABS[Math.max(0, i - 1)].k) + '"' + (i ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Back</a><span>' + (i + 1) + ' of ' + TABS.length + '</span>' +
      '<a class="dg-tnav next" href="' + href(TABS[Math.min(TABS.length - 1, i + 1)].k) + '"' + (i < TABS.length - 1 ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Next</a>';
  }

  // ---------- the header box ----------
  function drawJoinbox() {
    var btn = document.querySelector('[data-hg-join]'), jin = document.getElementById('hgJbIn');
    if (member()) { btn.textContent = 'My Saves'; jin.innerHTML = 'You\'re <br>a member'; }
    else { btn.textContent = 'Join free'; jin.innerHTML = 'Member?<br><a href="#" data-signin>Sign in</a>'; }
  }

  // ---------- router ----------
  function route() {
    var parts = (location.hash || '').replace(/^#\/?/, '').split('/');
    var view = parts[0] || 'overview', sub = parts.slice(1).join('/');
    var V = { overview: viewOverview, thanksliving: function () { viewHolOverview('thanksliving'); }, ideas: viewThanksLiving,
      'hk-ideas': function () { viewHoliday('hanukkah'); }, 'xm-ideas': function () { viewHoliday('christmas'); }, 'hk-kosher': viewKosher, 'xm-wish': function () { viewWish(sub); }, 'xm-gifts': function () { viewGifts(sub); }, recipes: function () { viewRecipes(sub); }, store: viewStore, listen: viewListen, menus: function () { viewMenus(sub); }, events: function () { viewEvents(sub); },
      hanukkah: function () { viewHolOverview('hanukkah'); }, christmas: function () { viewHolOverview('christmas'); },
      'hk-recipes': function () { viewRecipes(sub); }, 'hk-menus': function () { viewMenus(sub); }, 'hk-events': function () { viewEvents(sub); },
      'xm-recipes': function () { viewRecipes(sub); }, 'xm-store': viewStore, 'xm-menus': function () { viewMenus(sub); }, 'xm-events': function () { viewEvents(sub); }, giveback: function () { viewGiveBack(sub); }, business: viewBusiness };
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
    try { sessionStorage.setItem('ve_after_survey', '/guides/holiday-guide' + (p && p.tell ? '#/' + (typeof p.tell === 'string' ? p.tell : 'menus') + '/tell' : '')); } catch (e) {}
    location.href = '/survey?s=explorer';
  }
  // Anything sent to us needs a name on it (Sean, 2026-11-10: "We don't want just blind submissions"): the shared join window
  // (/public/ve-join-box.js) with Theo, quick registration or the survey; after either, what they tapped carries on (onDone).
  // A registered account that is not a member yet gets the window on Become a member (mode 'member'): it already has a login.
  function joinWindow(title, text, onDone) {
    var pic = (tab(curView).pic) || '/public/guides/holiday/theo-thanksliving.jpg';
    if (window.VEJoinBox) { VEJoinBox.open({ guide: 'Holiday Guide', character: 'Theo', pic: pic, reason: title, line: text, mode: registered() && !member() ? 'member' : '', onDone: function () { document.body.classList.toggle('dg-member', member()); drawJoinbox(); if (onDone) onDone(); }, onSurvey: goSurvey }); return; }
    if (auth()) auth().showAuthModal(text, onDone || null, 'signup');
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
    if (e.target.closest('[data-hg-tell]') && !registered()) {
      e.preventDefault();
      store('hg_pending', JSON.stringify({ tell: hx().menus, at: Date.now() }));
      joinWindow('Tell Us About a Menu', 'Everything in the Holiday Guide is free to read. To send us a menu you found, we just need to know who is sending it.', function () { location.hash = '#/' + hx().menus + '/tell'; });
      return;
    }
    // Until the video is made, its Play runs Theo's recorded tour (the same chapters) from the rail.
    if (e.target.closest('[data-hg-video]')) { var vb = document.querySelector('.hg-vbadge'); if (vb) vb.textContent = 'Video coming. Theo is reading it to you now.'; if (!PLAY.playing) playBtn.click(); return; }
    if (e.target.closest('[data-hg-done]')) { var pp = document.getElementById('hgPop'); if (pp) { pp.hidden = true; document.getElementById('hgFbtn').setAttribute('aria-expanded', 'false'); } return; }
    if (e.target.closest('[data-hg-reset]')) { MF = { q: '', type: 'all', order: 'all', sort: 'vegan' }; store('hg_chapter', 'all'); if (location.hash === '#/' + hx().menus + '/all') viewMenus('all'); else location.hash = '#/' + hx().menus + '/all'; return; }
    if ((el = e.target.closest('[data-hg-unpill]'))) {
      var k = el.getAttribute('data-hg-unpill');
      if (k === 'ch') { store('hg_chapter', 'all'); location.hash = '#/' + hx().menus + '/all'; return; }
      MF[k] = k === 'sort' ? 'vegan' : 'all'; viewMenus(chapter(null)); return;
    }
    if ((el = e.target.closest('[data-hg-menu]'))) {
      var key = el.getAttribute('data-hg-menu');
      if (openMenu(key)) { e.preventDefault(); history.pushState(null, '', '#/' + hx().menus + '/menu/' + encodeURIComponent(key)); }
      return;
    }
    if ((el = e.target.closest('[data-hg-open]'))) {
      var pid = el.getAttribute('data-hg-open'), pn = document.getElementById(pid), op = pn.hidden, ob = el;
      var showIt = function () { var p2 = document.getElementById(pid), b2 = main.querySelector('[data-hg-open="' + pid + '"]') || ob; if (!p2) return; p2.hidden = false; b2.setAttribute('aria-expanded', 'true'); p2.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
      if (op && !registered()) {
        var J = { hgRcpPanel: ['Submit a Recipe', 'To send a recipe, we just need to know who you are, so we can credit you.'], hgKosPanel: ['Suggest a Place', 'To suggest a place, we just need to know who is sending it.'],
          hgWishPanel: ['Start Your Wish List', 'Register and your list is yours to share with family, and your gift ideas can help everyone shopping for a Vegan.'], hgSugPanel: ['Suggest an Item', 'To suggest an item, we just need to know who is sending it.'],
          hgGiftPanel: ['Suggest a Gift', 'To suggest a gift, we just need to know who is sending it. Run a brand? Register and tell us about yours.'] }[pid] || ['Join Vegans Explore', ''];
        joinWindow(J[0], 'Everything in the Holiday Guide is free to read. ' + J[1], function () { if (pid === 'hgWishPanel') { route(); setTimeout(function () { var b2 = main.querySelector('[data-hg-open="hgWishPanel"]'); if (b2) b2.click(); }, 400); } else showIt(); });
        return;
      }
      pn.hidden = !op; el.setAttribute('aria-expanded', String(op)); if (op) pn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    if ((el = e.target.closest('#hgSubBtn')) && !registered() && document.getElementById('hgSubmit').hidden) {
      joinWindow('Submit a Menu', 'Everything in the Holiday Guide is free to read. To send a menu, we just need to know who is sending it.', function () { var b = document.getElementById('hgSubBtn'); if (b) b.click(); });
      return;
    }
    if ((el = e.target.closest('#hgSubBtn'))) {
      var sp = document.getElementById('hgSubmit'), on = sp.hidden;
      sp.hidden = !on; el.setAttribute('aria-expanded', String(on)); if (on) sp.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    if ((el = e.target.closest('[data-hg-save]'))) {
      e.preventDefault();
      var id = el.getAttribute('data-hg-save');
      if (member()) { saveListing(id, el); return; }
      store('hg_pending', JSON.stringify({ save: id, at: Date.now() }));
      joinWindow('Save This Place', registered() ? 'Saving places is for members. Take the short survey and this place goes into My Saves.' : 'Register and this place goes into My Saves, so you can find it again when it is time to order.', function () { if (member()) saveListing(id, el); });
      return;
    }
    if (e.target.closest('[data-hg-join]')) {
      if (member()) { location.href = '/dashboard/saves'; return; }
      joinWindow('', registered() ? 'You are registered. Become a member to save places, vote and open every Guide.' : 'Everything in the Holiday Guide is free to read. Register to send menus and recipes and get the Daily Pulse, or become a member and open everything.');
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
  // One holiday's live menus and member tips (ve-holiday `live`), kept per holiday.
  function loadLive(h) {
    return hol('live', { holiday: h }).then(function (d) { LIVE[h] = { menus: (d && d.menus) || [], tips: (d && d.tips) || [] }; })
      .catch(function () { LIVE[h] = { menus: [], tips: [] }; })
      .then(function () { if (curHol() === h && /menus$/.test(curView)) { MENUS = LIVE[h].menus; TIPS = LIVE[h].tips; drawMenuList(chapter(null)); } });
  }
  function loadAll() {
    var again = function (re) { return function () { if (re.test(curTab)) route(); }; };
    hol('holidays').then(function (d) { HOLS = (d && d.holidays) || []; }).catch(function () { HOLS = []; }).then(function () { route(); });
    loadLive(HOLIDAY);
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
        if (/menus$/.test(curTab)) drawMenuList(chapter(null));
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
