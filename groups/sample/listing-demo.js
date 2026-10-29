/* The sample group (Sean, 2026-10-29: "create our own mock club so people can go through it... demo it... the same way we did the
 * business... they can click around... see what the back end looks like... a general username and password... what it would be like
 * from a user perspective... from the owner's perspective"). Sprout Social Society is invented, never a database row. This file feeds the
 * real Directory listing page (/directory/listing.html) through its demo mode at /groups/sample: a member's view of a Group Partner's
 * page (its events, the guest pass, tickets, joining, its board) and, signed in with the demo login, the organizer's dashboard
 * (/public/ve-partner-dashboard.js) with the Group Partner views (members, events, earnings) on the numbers below. Every rate and rule
 * here is canon-ve-group-partners (LOCKED 2026-10-29). Nothing is read from or written to the database, and nothing is charged.
 */
(function () {
  var DAY = 864e5;
  function rnd(seed) { var x = Math.sin(seed) * 10000; return x - Math.floor(x); }
  // Dates relative to today, so the sample always has upcoming and past events. Times are Eastern.
  function at(daysFromNow, hour, min) {
    var d = new Date(Date.now() + daysFromNow * DAY);
    var ymd = d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    var off = (function () { var m = new Date(ymd + 'T12:00:00Z'); var s = m.toLocaleString('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' }); return /EDT/.test(s) ? '-04:00' : '-05:00'; })();
    return ymd + 'T' + String(hour).padStart(2, '0') + ':' + String(min || 0).padStart(2, '0') + ':00' + off;
  }
  function plus(iso, hours) { return new Date(Date.parse(iso) + hours * 36e5).toISOString(); }

  // [days from today, hour, title, venue, neighborhood/city, price in cents (0 free), capacity, going, guest passes, description]
  var UP = [
    [3, 19, 'Taco Tuesday Takeover', 'Rosa\'s Plant Cantina', 'Fort Lauderdale', 0, 40, 31, 6, 'We fill the back patio at a 100% Vegan taquera. Order at the counter, sit with the group, meet whoever sits next to you.'],
    [9, 11, 'Sunday Brunch in the Park', 'Holiday Park pavilion', 'Fort Lauderdale', 0, 60, 44, 9, 'Bring a dish to share. Coffee and oat milk on us. Kids and dogs welcome.'],
    [16, 19, 'Supper Club: Five Courses at Seedling', 'Seedling Kitchen', 'Wilton Manors', 4500, 32, 28, 0, 'A five-course Vegan tasting menu with the chef at the pass. Ticket covers dinner and tip; drinks are your own.'],
    [23, 18, 'Game Night', 'The Board Room cafe', 'Fort Lauderdale', 0, 30, 17, 4, 'Board games, Vegan snacks and a lot of laughing. First-timers always welcome.'],
    [30, 9, 'Beach Cleanup and Smoothies', 'Las Olas beach entrance', 'Fort Lauderdale', 0, 80, 52, 12, 'An hour of cleanup with gloves and bags provided, then smoothies on the sand.'],
    [44, 19, 'Holiday Potluck', 'Community room, Riverwalk', 'Fort Lauderdale', 1500, 70, 39, 0, 'Our end-of-year potluck. The ticket covers the room and the drinks; bring a dish if you can.']
  ];
  var PAST = [
    [-6, 19, 'Halloween Costume Potluck', 'Community room, Riverwalk', 'Fort Lauderdale', 0, 60, 54, 11],
    [-13, 11, 'Farmers Market Walk', 'Saturday market, Las Olas', 'Fort Lauderdale', 0, 40, 26, 7],
    [-20, 19, 'Supper Club: Caribbean Night', 'Island Roots Vegan', 'Lauderhill', 4000, 32, 32, 0],
    [-27, 18, 'Game Night', 'The Board Room cafe', 'Fort Lauderdale', 0, 30, 22, 5],
    [-41, 9, 'Sanctuary Day', 'A farm sanctuary', 'Loxahatchee', 2000, 40, 37, 0],
    [-55, 19, 'Taco Tuesday Takeover', 'Rosa\'s Plant Cantina', 'Fort Lauderdale', 0, 40, 35, 8],
    [-69, 11, 'Sunday Brunch in the Park', 'Holiday Park pavilion', 'Fort Lauderdale', 0, 60, 41, 10],
    [-83, 19, 'Vegan Comedy Night', 'The Laugh Room', 'Fort Lauderdale', 1800, 80, 71, 0],
    [-97, 9, 'Beach Cleanup and Smoothies', 'Las Olas beach entrance', 'Fort Lauderdale', 0, 80, 48, 13],
    [-118, 19, 'Supper Club: Summer Menu', 'Seedling Kitchen', 'Wilton Manors', 4500, 32, 30, 0],
    [-139, 18, 'Rooftop Mixer', 'Skyline rooftop', 'Fort Lauderdale', 1200, 90, 77, 0],
    [-160, 11, 'Sunday Brunch in the Park', 'Holiday Park pavilion', 'Fort Lauderdale', 0, 60, 38, 9],
    [-181, 19, 'Taco Tuesday Takeover', 'Rosa\'s Plant Cantina', 'Fort Lauderdale', 0, 40, 33, 7],
    [-209, 10, 'Kayak and Picnic', 'Hugh Taylor Birch State Park', 'Fort Lauderdale', 2500, 24, 24, 0],
    [-237, 19, 'Valentine\'s Singles Mixer', 'Garden bar', 'Fort Lauderdale', 1500, 60, 58, 0],
    [-265, 11, 'New Year Brunch', 'Holiday Park pavilion', 'Fort Lauderdale', 0, 60, 46, 12]
  ];
  function ev(row, i, past) {
    var s = at(row[0], row[1]);
    return { id: (past ? 'p' : 'u') + i, title: row[2], starts_at: s, ends_at: plus(s, 2.5), timezone: 'America/New_York', time_set: true,
      location_name: row[3], city: row[4], state: 'FL', country: 'US', event_type: 'in_person', ticket_url: '', virtual_url: '',
      price_cents: row[5], capacity: row[6], going: row[7], guest_passes: row[8], description: row[9] || '' };
  }
  var EVENTS = UP.map(function (r, i) { return ev(r, i, false); }).concat(PAST.map(function (r, i) { return ev(r, i, true); }));

  var FIRST = ['Sam', 'Maria', 'Andre', 'Priya', 'Jordan', 'Nia', 'Carlos', 'Jess', 'Omar', 'Bri', 'Theo', 'Ivy', 'Luis', 'Ana', 'Kofi', 'Mei', 'Dev', 'Rosa', 'Eli', 'Zoe'];
  var LAST = 'RLTKBHRTFLNCPSAMDGWY';
  var MEMBERS = [];
  for (var i = 0; i < 40; i++) {
    var r = rnd(i + 3);
    MEMBERS.push({ name: FIRST[i % FIRST.length] + ' ' + LAST.charAt((i * 7) % LAST.length) + '.', joined: new Date(Date.now() - Math.floor(r * 300 + 2) * DAY).toISOString(),
      via: r < 0.45 ? 'Your link' : r < 0.75 ? 'A guest pass' : 'Already a member', events: 1 + Math.floor(rnd(i + 9) * 11),
      chapter: rnd(i + 11) < 0.82 ? 'South Florida' : rnd(i + 13) < 0.5 ? 'Central Florida' : 'New York' });
  }
  MEMBERS.sort(function (a, b) { return Date.parse(b.joined) - Date.parse(a.joined); });

  // The ladder (canon-ve-group-partners): lifetime members brought in, the share of each Passport from the day reached.
  var LADDER = [[0, 20], [25, 25], [75, 30], [150, 35], [300, 40], [600, 45], [1000, 50]];
  var BROUGHT = 112;
  var paidTickets = EVENTS.filter(function (e) { return e.price_cents > 0 && Date.parse(e.starts_at) < Date.now(); });
  var ticketGross = paidTickets.reduce(function (a, e) { return a + e.price_cents * e.going; }, 0);
  var RECENT = [
    [-1, 'passport', 'Jordan B. joined with your link', 330], [-2, 'ticket', '2 tickets, Supper Club: Five Courses at Seedling', 8550],
    [-4, 'passport', 'Nia H. joined after her guest pass', 330], [-6, 'ticket', '1 ticket, Holiday Potluck', 1425],
    [-8, 'passport', 'Omar F. joined with your link', 330], [-9, 'ticket', '3 tickets, Supper Club: Five Courses at Seedling', 12825]
  ].map(function (x) { return { at: new Date(Date.now() + x[0] * DAY).toISOString(), kind: x[1], what: x[2], cents: x[3] }; });

  var GROUP = {
    name: 'Sprout Social Society', status: 'active', code: 'SPROUT-SOCIAL-SOCIETY', link: 'vegansexplore.com/r/SPROUT-SOCIAL-SOCIETY',
    members_total: 214, brought: BROUGHT, new_this_month: 14, ladder: LADDER, rate_pct: 30,
    guest_passes: { used: 96, joined_after: 51 },
    members: MEMBERS, events: EVENTS,
    earnings: {
      // Commissions: the group's share of each $11 Passport bought through it, at the rate on the day. Tickets: what buyers paid, less our 5%.
      passports_cents: 25 * 220 + 50 * 275 + 37 * 330, tickets_cents: Math.round(ticketGross * 0.95), fee_cents: Math.round(ticketGross * 0.05),
      ready_cents: 18240, holding_cents: 6380, w9: true,
      payouts: [],
      recent: RECENT
    }
  };

  // Paid to date is what was earned less what is ready and what is held, paid out monthly (the 30-day hold, $25 minimum).
  (function (E) {
    var paid = E.passports_cents + E.tickets_cents - E.ready_cents - E.holding_cents, months = 9, left = paid, w = [], tot = 0;
    for (var m = 1; m <= months; m++) { w.push(0.7 + rnd(m) * 0.6); tot += w[m - 1]; }
    for (var j = 1; j <= months; j++) {
      var c = j === months ? left : Math.round(paid * w[j - 1] / tot); left -= c;
      E.payouts.push({ at: new Date(Date.now() - (j * 30 + 2) * DAY).toISOString(), cents: c });
    }
  })(GROUP.earnings);

  // The organizer's dashboard: the same server shape as ve-claims owner_dashboard, plus the Group Partner block.
  function stats(days) {
    var now = [], before = [];
    for (var d = days - 1; d >= 0; d--) {
      var t = Date.now() - d * DAY, k = Math.floor(t / DAY), v = Math.round(18 + rnd(k) * 16);
      now.push({ day: new Date(t).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }), views: v, visitors: Math.round(v * 0.7), actions: Math.round(v * 0.3) });
      before.push(Math.round(14 + rnd(k - days) * 12));
    }
    var views = now.reduce(function (a, x) { return a + x.views; }, 0), acts = now.reduce(function (a, x) { return a + x.actions; }, 0);
    return { days: days, totals: { view: views, website: Math.round(acts * 0.4), social: Math.round(acts * 0.45), photos: Math.round(acts * 0.15) },
      visitors: Math.round(views * 0.62), previous: { views: before.reduce(function (a, x) { return a + x; }, 0), visitors: 0, actions: Math.round(acts * 0.8) },
      daily: now, via: { page: Math.round(views * 0.6), guide: Math.round(views * 0.1), link: Math.round(views * 0.3) } };
  }
  var D = {
    ok: true,
    listing: { id: 'sample-sprout-social-society', name: 'Sprout Social Society', slug: 'sample', category: 'Groups', food: false, kind: 'group', hub: 'south-florida', claim_status: 'verified' },
    open: true, owner: true, admin: false, member_active: true,
    checklist: [{ k: 'logo', done: true }, { k: 'description', done: true }, { k: 'photos', done: false }],
    cards: [
      { kind: 'new', title: 'Your next supper club is 87% sold', body: 'Seedling holds 32. Share the event from Events so the last seats go to your people.', cta_label: 'Open Events', cta_url: '?pd=gevents' },
      { kind: 'offer', title: '38 members to 35%', body: 'At 150 members brought in, every new Passport through your link pays you 35%.', cta_label: 'See your members', cta_url: '?pd=gmembers' },
      { kind: 'tip', title: 'Guest passes turn into members', body: 'Over half the newcomers who used a guest pass joined. Invite friends to your free events.', cta_label: 'See your members', cta_url: '?pd=gmembers' }
    ],
    menu_count: 0, plan: null, ads: [],
    spots: [{ page_slug: '/events', page_name: 'Events', views: 6100, slots: 1 }, { page_slug: '/communities/south-florida', page_name: 'South Florida community', views: 9200, slots: 1 }],
    audits: [], orders: [],
    guides: [{ slug: 'nonprofit-guide', title: 'The Nonprofit Guide', description: 'Ten tips for running a Vegan organization: getting found, events, partners and avoiding burnout.', access_rule: 'points', owned: true }],
    opportunities: [], interests: ['community-groups'],
    group: GROUP
  };

  window.VE_DEMO = {
    business: true,
    group: true,
    tour: false,
    label: 'Sprout Social Society is a made-up group. Everything around it is the real page and the real dashboard, so you can see what a Group Partner gets. Nothing is charged or saved.',
    // The demo sign-in (Sean: "a general username and password that they can use"). It only opens the organizer's side of this sample,
    // in this browser; it is not an account.
    login: { email: 'demo@vegansexplore.com', password: 'explore11' },
    guideUrl: '/groups/welcome',
    events: EVENTS,
    group: GROUP,
    board: [
      { who: 'Nia H.', when: 2, text: 'Who is carpooling to the beach cleanup from Plantation? I have three seats.' },
      { who: 'Andre T.', when: 4, text: 'Seedling just posted the supper club menu. The mushroom course looks unreal.' },
      { who: 'Sprout Social Society', when: 6, text: 'Thank you for 54 costumes on Halloween! Photos are in the group album.', host: true }
    ],
    listing: {
      id: 'sample-sprout-social-society',
      slug: 'sample',
      name: 'Sprout Social Society',
      initials: 'SS',
      color: '#2d7d31',
      category: 'Groups',
      vegan_status: null,
      tagline: 'Fort Lauderdale\'s Vegan social club: dinners, brunches, game nights and good people.',
      description: 'Sprout Social Society is a sample group made up for this page. Picture a few hundred Vegans and Vegan-curious friends in Broward who get together every week: taco nights, park brunches, a monthly supper club with a local chef, game nights and beach cleanups. Anyone can come to their first free event on a guest pass.',
      website: '',
      instagram: '',
      address_city: 'Fort Lauderdale',
      address_state: 'FL',
      communities: ['south-florida'],
      business_status: 'OPERATIONAL',
      claimed_by_member_id: 'sample',
      owner_member_id: 'sample',
      claim_status: 'verified',
      vote_count: 412,
      voter_count: 133,
      tags: ['ve-group-partner']
    },
    dashboard: function (body, toast) {
      var a = body && body.action;
      if (a === 'owner_dashboard') { var days = Math.min(365, Math.max(1, Number(body.days) || 30)); return Promise.resolve(Object.assign({}, D, { days: days, stats: stats(days), saves: { total: 96, last_30_days: 18 } })); }
      if (a === 'demo_only') { toast('Sample: ' + (body.note || '') + ' Nothing is saved or charged here.'); return Promise.resolve({ ok: true }); }
      toast('Sample dashboard: nothing is saved or charged here. As a Group Partner this happens for real.');
      return Promise.resolve({ ok: true });
    }
  };
})();
