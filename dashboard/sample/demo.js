/* The sample member (Sean, 2026-11-08, playbook ve-explorer-path: "like Kai"). /dashboard/sample is the real member dashboard
   (dashboard/center-console.html, a rewrite in vercel.json) run as Jordan Ellis, an invented South Florida member at Level 2.
   This file loads before /public/ve-auth.js and does three things, all in the page's memory only:
   1. Session. The visitor's own session keys (ve_token, ve_member, ve_view_as, ve_switch_from) are swapped for Jordan's on read and
      never written or removed, so a real signed-in visitor is never signed out or overwritten by the sample.
   2. Calls. Every call to our edge functions is answered here from SAMPLE (below). Public reads the dashboard needs to draw the
      Directory, Events and the Pulse go through to the live site without a token. Anything that would save says so in a toast
      and saves nothing.
   3. The stamp. A Sample tag sits on the page at all times (canon: demos are stamped Sample, never passed off as a real member).
   Framed pages that load this file (the Guide, Points and levels) run the same way while their parent is /dashboard/sample.
   Nothing here is a database row. Dates are counted from today so the sample never goes stale. */
(function () {
  var inSample = /^\/dashboard\/sample/.test(location.pathname);
  try { if (!inSample && window.parent !== window && /^\/dashboard\/sample/.test(window.parent.location.pathname)) inSample = true; } catch (e) {}
  try { if (!inSample && new URLSearchParams(location.search).get('sample') === 'member') inSample = true; } catch (e) {}
  if (!inSample) return;
  window.VE_SAMPLE_MEMBER = true;

  var DAY = 864e5, NOW = Date.now();
  function ago(days, hour) { var d = new Date(NOW - days * DAY); d.setHours(hour == null ? 12 : hour, 0, 0, 0); return d.toISOString(); }
  function ahead(days, hour) { return ago(-days, hour); }
  var LOG = window.VE_SAMPLE_LOG = [];

  // ---- the member -------------------------------------------------------------------------------------------------
  var MEMBER = {
    id: '00000000-5a3e-4e3b-9000-00000000a11e', name: 'Jordan Ellis', initials: 'JE', username: 'jordaneatsmiami', email: 'jordan@example.com',
    avatar_url: '/dashboard/sample/img/jordan.jpg', membership_status: 'active', membership_tier: 'member', ve_tier: 'passport', ve_role: null, is_superadmin: false,
    founding_member: true, entry_via: 'passport', entry_paid_at: null, created_at: ago(18), member_since: ago(18),
    home_community: 'south-florida', communities: ['south-florida', 'central-florida'], lesars_balance: 1420, total_points: 3180,
    level: 2, level_override: null, guide_slug: 'liz', guide_setup_at: ago(17), referral_code: 'JORDAN-E', mission_survey_completed_at: ago(18),
    show_checkins: true, member_class: 'member', dashboard_version: 'member', standing: 'good', trailblazer_at: null
  };
  var TOKEN = 'sample-member-token';
  var SESSION = { ve_token: TOKEN, ve_member: JSON.stringify(MEMBER), ve_view_as: null, ve_switch_from: null };

  // ---- 1. the session, in memory only -----------------------------------------------------------------------------
  var P = Storage.prototype, gi = P.getItem, si = P.setItem, ri = P.removeItem;
  P.getItem = function (k) { if (this === window.localStorage && Object.prototype.hasOwnProperty.call(SESSION, k)) return SESSION[k]; return gi.apply(this, arguments); };
  P.setItem = function (k, v) { if (this === window.localStorage && Object.prototype.hasOwnProperty.call(SESSION, k)) { if (k === 've_member') SESSION[k] = String(v); return; } return si.apply(this, arguments); };
  P.removeItem = function (k) { if (this === window.localStorage && Object.prototype.hasOwnProperty.call(SESSION, k)) return; return ri.apply(this, arguments); };

  // ---- 2. the calls ---------------------------------------------------------------------------------------------------
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/';
  var realFetch = window.fetch.bind(window);
  function json(data, status) { return Promise.resolve(new Response(JSON.stringify(data), { status: status || 200, headers: { 'Content-Type': 'application/json' } })); }
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (url.indexOf(FN) !== 0) return realFetch(input, init);
    var path = url.slice(FN.length), fn = path.split(/[?/]/)[0], q = path.indexOf('?') >= 0 ? new URLSearchParams(path.slice(path.indexOf('?') + 1)) : new URLSearchParams();
    var body = {}; try { body = init && init.body ? JSON.parse(init.body) : {}; } catch (e) {}
    var action = body.action || q.get('action') || '';
    var h = (SAMPLE[fn] || {})[action] || (SAMPLE[fn] || {})['*'];
    LOG.push(fn + ' ' + action + (h ? '' : ' (no sample)'));
    if (h) { var out = typeof h === 'function' ? h(body) : h; return json(out); }
    if (PUBLIC[fn] && (PUBLIC[fn] === true || PUBLIC[fn].indexOf(action) >= 0)) {
      var b2 = Object.assign({}, body); delete b2.token;
      var hd = Object.assign({}, (init && init.headers) || {}); if (hd.Authorization && /sample/.test(hd.Authorization)) delete hd.Authorization;
      return realFetch(input, Object.assign({}, init, { body: JSON.stringify(b2), headers: hd }));
    }
    toast();
    return json({ ok: false, sample: true, error: 'sample', message: 'This is the sample member: nothing is saved.' });
  };

  // Public reads that may go to the live site (no token, nothing written).
  var PUBLIC = {
    've-events': ['list', 'event', 'kinds'], 've-board': ['list', 'topic', 'post'], 've-podcast': ['episodes', 'episode'],
    've-votes': ['stats', 'chapter_stats', 'points'], 've-search': ['search'], 've-guide-unlock': [], 've-media': true
  };

  // ---- the sample's own data ----------------------------------------------------------------------------------------
  // Real Directory places Jordan saved and checked in at (public listings; nothing is written to them).
  var P_ = function (id, slug, name, city, logo) { return { id: id, slug: slug, name: name, category: 'Restaurants', address_city: city, logo_url: 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/' + logo }; };
  var LOVE = P_('630dbf6f-e9ea-4218-b560-ee9448276df9', 'love-life-cafe', 'Love Life Cafe', 'Miami', 'library/475f0758124c4e3b8481.webp');
  var HONEST = P_('4f737d4e-e118-46e4-aca4-6639bea26aaa', 'vegan-cuban-cuisine', 'Honest Cuban by VCC', 'Miami', 'media/listings/vegan-cuban-cuisine/logo-2026-11-08-b3bab7a7.jpg');
  var RABBIT = P_('cf9d2ed0-d0a5-4059-92dc-d52d849aff4c', 'the-rabbit-hole', 'The Rabbit Hole', 'Pompano Beach', 'library/d109d6db2db59180d828.webp');
  var BLUE = P_('979240dd-dc94-420f-93c6-49ab876411f0', 'blue-tree-vegan-cafe', 'Blue Tree Vegan Cafe', 'Fort Lauderdale', 'library/9411d421e3ab9697f35f.webp');
  var STEPH = P_('df195025-9ce5-4354-9cb4-6ab82907960d', 'stephanies-vegan-bakery', "Stephanie's Vegan Bakery", 'Fort Lauderdale', 'library/bba1c4128b13dccb627f.webp');
  var COCINITA = P_('555a976a-d134-40cc-9591-fe9bb790c591', 'the-cocinita-miami', 'The Cocinita Miami', 'Miami', 'library/ff0d03097239beb45f84.webp');
  var SAVES = [HONEST, LOVE, RABBIT, BLUE, STEPH];

  var SHOW = { id: 'fdcf4960-0ead-4a85-9433-b555d7674730', name: 'Vegans Explore Podcast', slug: 'vegans-explore-podcast', logo: 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/podcast/brand/cover-b-v1.jpg' };
  function EP(guid, title, dur, img) { return { guid: guid, title: title, duration: dur, image: img, audio: 'https://episodes.captivate.fm/episode/' + guid + '.mp3', show: SHOW, saved_at: ago(3) }; }
  var EPISODES = [
    EP('902d9d96-bfd3-49b6-ab13-31e91b1365f3', 'Ballots, Marathons and Jane Velez-Mitchell Unchained', 799, 'https://artwork.captivate.fm/7a6dedbb-e4ae-45df-b0a8-26d416116c39/cover-b-v1.jpg'),
    EP('73510abf-12fa-40c1-a35e-ebd638d10827', "Founder's Report: Back and Ready for Duty", 886, 'https://artwork.captivate.fm/c3cde4f5-16f0-4d65-814b-77f98f23593f/ep144-art-v1.jpg'),
    EP('e6947d49-f039-4040-92d4-fdc36b83b557', 'Top 10 Recent Wins for Animals That Show Real Momentum', 317, 'https://artwork.captivate.fm/de0868b6-dfc1-4044-af2e-11d0028fbb19/23-26-9-55-PM.jpg')
  ];

  // Points history, newest first. Lifetime and balance below are worked out from it, so they always agree.
  var H = [];
  function pt(days, delta, reason, label, note) { H.push({ created_at: ago(days, 9 + (H.length % 9)), delta: delta, reason: reason, label: label, note: note || '' }); }
  pt(0, 10, 'checkin', 'Checked in at The Cocinita Miami', '64 m away');
  pt(1, -4, 'guide_chat_spend', 'Talked to Liz', 'A question about Level 3');
  pt(1, -4, 'guide_chat_spend', 'Talked to Liz', 'Where to find a Vegan Cuban sandwich');
  pt(2, 15, 'checkin', 'Menu photo approved', 'Honest Cuban by VCC');
  pt(2, 10, 'checkin', 'Checked in at Honest Cuban by VCC', '38 m away');
  pt(3, 50, 'bounty', 'Bounty paid: Is it still open?', 'A Fort Lauderdale cafe, photos approved');
  pt(4, 111, 'referral_signup', 'A friend joined with your link', 'Sam R. finished the Explorer survey');
  pt(5, -600, 'points_contribution', 'Gave points to The Rabbit Hole', 'A boost, never money');
  pt(6, 10, 'checkin', 'Shout-out approved', 'Love Life Cafe');
  pt(6, 15, 'checkin', 'Menu photo approved', 'Love Life Cafe');
  pt(6, 10, 'checkin', 'Checked in at Love Life Cafe', '22 m away');
  pt(8, 25, 'partner_optin', 'Said yes to hear from Love Life Cafe', 'During its campaigns only');
  pt(9, 100, 'venue_report', 'Stadium report accepted', 'A new plant-based item at Hard Rock Stadium');
  pt(11, 25, 'checkin', 'Receipt approved', "Stephanie's Vegan Bakery");
  pt(11, 10, 'checkin', "Checked in at Stephanie's Vegan Bakery", '15 m away');
  pt(13, 50, 'recipe_approved', 'Recipe approved', 'Mango black bean bowl, in the Cookbook');
  pt(15, 210, 'profile_answer', 'Answered profile questions', '14 answers, in your own words');
  pt(17, 111, 'referral_signup', 'A friend joined with your link', 'Taylor M. finished the Explorer survey');
  pt(19, 10, 'checkin', 'Checked in at Blue Tree Vegan Cafe', '41 m away');
  pt(20, 250, 'survey_answer', 'Finished the event survey', 'Registered event host');
  pt(22, -1100, 'guide_unlock', 'Opened the Vegan Dairy Guide', 'Yours to keep');
  pt(24, 100, 'bounty', 'Bounty paid: Is it still open?', 'Two Miami places checked');
  pt(26, 10, 'checkin', 'Checked in at The Rabbit Hole', '30 m away');
  pt(30, 250, 'survey_answer', 'Finished the Explorer survey', 'The Explorer badge');
  pt(31, 111, 'referral_signup', 'A friend joined with your link', 'Chris P. finished the Explorer survey');
  pt(38, 1100, 'welcome', 'Welcome points', 'Joined with the $11 Passport, a Founding Member');
  var life = 0, bal = 0; H.forEach(function (r) { if (r.delta > 0) life += r.delta; bal += r.delta; });
  MEMBER.total_points = life; MEMBER.lesars_balance = bal; MEMBER.points = bal; MEMBER.created_at = MEMBER.member_since = MEMBER.entry_paid_at = ago(38);
  SESSION.ve_member = JSON.stringify(MEMBER);

  var LADDER = [[1, 0, 0, []], [2, 2500, 20, ['passport']], [3, 10000, 25, ['passport', 'guide']], [4, 25000, 30, ['passport', 'guide']]]
    .map(function (l) { return { level: l[0], min_lifetime: l[1], rate_pct: l[2], products: l[3] }; });

  // The sample's toast: anything that would save says so.
  function toast(msg) {
    if (!document.body) return;
    var t = document.getElementById('ve-sample-toast');
    if (!t) { t = document.createElement('div'); t.id = 've-sample-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg || 'This is the sample member: nothing is saved.'; t.className = 'on'; clearTimeout(toast._t); toast._t = setTimeout(function () { t.className = ''; }, 3200);
  }
  function saved(extra) { return function () { toast(); return Object.assign({ ok: true, sample: true }, extra || {}); }; }

  var SAMPLE = {
    'lr-shell': { me: { ok: false } },
    've-auth': {
      me: function () { return { member: MEMBER }; },
      list_saved_listings: { items: SAVES },
      save_listing: saved(), unsave_listing: saved(), vote_listing: saved(), join_community: saved({ communities: MEMBER.communities }), leave_community: saved({ communities: MEMBER.communities }),
      set_home_community: saved({ member: MEMBER }),
      referrals: { ok: true, referrals: [{ name: 'Sam R.', status: 'active', at: ago(4) }, { name: 'Taylor M.', status: 'active', at: ago(17) }, { name: 'Chris P.', status: 'active', at: ago(31) }] },
      guide_topics: { topics: [{ question: 'Where can I eat near me?' }, { question: 'What is happening in South Florida this week?' }, { question: 'How do I get to Level 3?' }, { question: 'How do points work?' }] },
      guide_ask: { answer: null, related: [{ question: 'How do points work?' }, { question: 'Where can I eat near me?' }] },
      guide_chat_send: function () { toast('This is the sample member: Liz is not really answering.'); return { reply: 'This is the sample member, so I am not really answering. As a member, I reply here in a few seconds, and each question uses 4 points.', memory: { used: 6, max: 20 }, balance: bal }; },
      guide_ask_person: saved({ to_cm: false })
    },
    've-guide': { status: { ok: true, guide_slug: 'liz', setup_at: ago(29), can_choose: true, survey: { eligible: true, completed: true } }, setup: saved({ guide_slug: 'liz', setup_at: ago(29) }) },
    've-hunt': { badges: { badges: [] } },
    've-community-manager': { '*': { ok: true } },
    've-rewards': {
      leaderboard: function () {
        var rows = [['Ana Torres', 'AT', 6240, '#2d7d31'], ['Marcus Bell', 'MB', 4815, '#1f5f22'], ['Priya Natarajan', 'PN', 3990, '#3a9b3e'], ['Jordan Ellis', 'JE', life, '#f69820', true],
          ['Dee Okafor', 'DO', 2730, '#2d5c27'], ['Luis Ramirez', 'LR', 2215, '#2d7d31'], ['Kim Vo', 'KV', 1890, '#1f5f22'], ['Sam Rivera', 'SR', 1140, '#3a9b3e']];
        return { leaderboard: rows.sort(function (a, b) { return b[2] - a[2]; }).map(function (r, i) { return { rank: i + 1, name: r[0] + (r[4] ? ' (you)' : ''), initials: r[1], points: r[2], color: r[3], is_you: !!r[4] }; }) };
      },
      list_my_campaigns: { campaigns: [] }, my_applications: { applications: [] }, '*': { ok: true, items: [], rewards: [], opportunities: [] }
    },
    've-votes': { today: { ok: true, votes: [] }, chapter_today: { ok: true, voted: [] } },
    've-dashboard': {
      home: function () {
        return { ok: true, member_id: MEMBER.id, founding_member: true, survey_prompt: false, version: 'member', listings: [],
          badges: [{ badge: 'Explorer', role: 'Finished the Explorer survey' }, { badge: 'Registered event host', role: 'Hosts a monthly potluck' }],
          survey: { active: true, completed: false, earned: 210, total: 250 },
          cards: [
            { kind: 'new', title: 'ThanksLiving is in the Holiday Guide', body: 'Menus, recipes and events for November 26, free with Theo.', cta_url: '/guides/holiday-guide' },
            { kind: 'new', title: 'Is it still open? 50 points a stop', body: 'Check a place in your city and send two photos. Paid once the team approves it.', cta_url: '/bounties' },
            { kind: 'new', title: 'Check in where you go', body: '10 points a visit, plus more for a menu photo, a receipt or a shout-out.', cta_url: '/directory' },
            { kind: 'new', title: "Today's Daily Pulse for South Florida", body: 'The stories and the conversation in your chapter.', cta_url: '/pulse?city=south-florida' }
          ] };
      },
      '*': { ok: true }
    },
    've-affiliate': {
      me: function () {
        return { ok: true, live: false, can_see: false, member: true, referral_code: MEMBER.referral_code, link: 'https://vegansexplore.com/r/' + MEMBER.referral_code,
          level: { level: 2, lifetime: life, next_at: 10000, rate_pct: 20, products: ['passport'], set_by_team: false }, ladder: LADDER,
          joined: 3, joined_members: 3, referral_points: 333, totals: {}, commissions: [], program: {}, route: 'self', history: H };
      },
      orgs: { ok: true, orgs: [] }, route: saved({ route: 'self' })
    },
    've-podcast': { saves: { ok: true, episodes: EPISODES }, save: saved({ saved: true }) },
    've-campaign-window': { mine: { ok: true, optins: [LOVE.id], claimed: [LOVE.id] }, optin_set: saved() },
    've-checkin': { mine: { ok: true, checkins: [
      { listing: COCINITA, at: ago(0, 13), points: 10, actions: [] },
      { listing: HONEST, at: ago(2, 12), points: 25, actions: [{ kind: 'meal', status: 'approved', photo: '/business/sample/img/m-panini.webp' }] },
      { listing: LOVE, at: ago(6, 11), points: 35, actions: [{ kind: 'meal', status: 'approved' }, { kind: 'shoutout', status: 'approved', text: 'The jackfruit tacos are worth the drive.' }] },
      { listing: STEPH, at: ago(11, 15), points: 35, actions: [{ kind: 'receipt', status: 'approved' }] }
    ] } }
  };
  // Liz's earlier conversation with Jordan, drawn into the Guide's chat in the sample (guide.html reads VE_SAMPLE.conversation).
  var CONVERSATION = [
    ['user', 'Where can I get a Vegan Cuban sandwich near Miami?'],
    ['guide', 'Honest Cuban by VCC in Miami is 100% Vegan and in our Directory. Open its page for the hours and the menu, and check in when you go: that is 10 points, and a menu photo adds 15.'],
    ['user', 'How do I get to Level 3?'],
    ['guide', 'You have ' + life.toLocaleString('en-US') + ' lifetime points, and Level 3 starts at 10,000. Check-ins, bounties, your profile answers and friends who join with your link all count. Spending points never lowers your level.']
  ];

  // ---- 3. the stamp, and staying on /dashboard/sample ---------------------------------------------------------------
  function stamp() {
    if (document.getElementById('ve-sample-stamp')) return;
    var st = document.createElement('style');
    st.textContent = '#ve-sample-stamp{position:fixed;left:12px;bottom:12px;z-index:2147483000;display:flex;align-items:center;gap:8px;background:#9a3412;color:#fff;font:800 11px/1 Montserrat,sans-serif;letter-spacing:.14em;text-transform:uppercase;padding:9px 12px;border-radius:6px;box-shadow:0 6px 18px rgba(0,0,0,.25)}' +
      '#ve-sample-stamp span{font-weight:600;letter-spacing:0;text-transform:none;font-size:12px;opacity:.9}' +
      '#ve-sample-toast{position:fixed;left:50%;bottom:64px;transform:translateX(-50%) translateY(20px);opacity:0;transition:all .2s;z-index:2147483001;background:#1a1a1a;color:#fff;font:600 13px/1.4 Montserrat,sans-serif;padding:11px 16px;border-radius:6px;max-width:calc(100% - 32px);pointer-events:none}' +
      '#ve-sample-toast.on{opacity:1;transform:translateX(-50%)}' +
      '@media (max-width:600px){#ve-sample-stamp span{display:none}}';
    document.head.appendChild(st);
    var top = window.top === window;
    var s = document.createElement('div'); s.id = 've-sample-stamp';
    s.innerHTML = 'Sample' + (top ? ' <span>Jordan Ellis is made up. Nothing here is saved.</span>' : '');
    document.body.appendChild(s);
  }
  // The stamp sits on the top page only (the framed Guide and Points and levels sit inside it).
  if (window.top === window) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', stamp); else stamp(); }
  else { var css = function () { stamp(); var x = document.getElementById('ve-sample-stamp'); if (x) x.remove(); }; if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', css); else css(); }
  // The dashboard moves the address as you go (/dashboard/levels...). In the sample it stays on /dashboard/sample.
  if (window.top === window) ['pushState', 'replaceState'].forEach(function (k) {
    var orig = history[k].bind(history);
    history[k] = function (state, title, url) { if (typeof url === 'string' && /^\/dashboard(\/|$|\?|#)/.test(url) && !/^\/dashboard\/sample/.test(url)) url = '/dashboard/sample'; return orig(state, title, url); };
  });

  window.VE_SAMPLE = { member: MEMBER, data: SAMPLE, log: LOG, history: H, conversation: CONVERSATION, toast: toast };
})();
