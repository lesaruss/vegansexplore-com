/* The sample nonprofit (Sean, 2026-11-07: "a fictitious nonprofit organization the same way we did the restaurant and group... show a
 * simulation of an active community... people are posting rescues... 270 members... a couple of comments... 4 different posts... what
 * this may look like after January 1st... so that when they click through it, there's no question in their mind that they want this").
 * Open Gate Sanctuary is invented, never a database row. This file feeds the real Directory listing page (/directory/listing.html)
 * through its demo mode at /nonprofits/sample, on the same machinery as the sample group (DEMO.group), with DEMO.nonprofit for its
 * words: a member's view (follow, events, its board of foster and rescue calls) and, with the demo sign-in, the organization's dashboard
 * (/public/ve-partner-dashboard.js, D.group.nonprofit: members, events, announcements, its page; no earnings while cash commissions are
 * paused). Joining Vegans Explore is free with a short survey (canon-ve-door-guides v12). Nothing is read from or written to the database.
 */
(function () {
  var DAY = 864e5;
  function rnd(seed) { var x = Math.sin(seed) * 10000; return x - Math.floor(x); }
  function at(daysFromNow, hour, min) {
    var d = new Date(Date.now() + daysFromNow * DAY);
    var ymd = d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    var off = (function () { var m = new Date(ymd + 'T12:00:00Z'); var s = m.toLocaleString('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' }); return /EDT/.test(s) ? '-04:00' : '-05:00'; })();
    return ymd + 'T' + String(hour).padStart(2, '0') + ':' + String(min || 0).padStart(2, '0') + ':00' + off;
  }
  function plus(iso, hours) { return new Date(Date.parse(iso) + hours * 36e5).toISOString(); }
  var NAME = 'Open Gate Sanctuary';

  // [days from today, hour, title, venue, city, capacity, going, first-timers, description]. Every event is free.
  var UP = [
    [4, 9, 'Volunteer Saturday', 'Open Gate Sanctuary', 'Loxahatchee Groves', 30, 26, 7, 'Mucking, feeding and fence repair, then lunch with the volunteers. Gloves and boots provided. No experience needed.'],
    [11, 10, 'Sanctuary Open Day', 'Open Gate Sanctuary', 'Loxahatchee Groves', 120, 94, 31, 'Meet the residents: Juniper the cow, the goat gang and our rescued hens. Guided walks every hour, and a Vegan lunch from a local food truck.'],
    [18, 11, 'Adoption Day: hens and ducks', 'A partner Vegan cafe', 'West Palm Beach', 50, 33, 12, 'Six rescued hens and four ducks are ready for their forever homes. Meet them, ask our team anything, and take home a care guide.'],
    [25, 17, 'Five Years of Open Gate', 'Open Gate Sanctuary', 'Loxahatchee Groves', 200, 151, 48, 'Our anniversary: a sunset walk, music, a Vegan dinner and the stories of the 400 animals who found safety here. Bring the family.'],
    [39, 10, 'Kids Day at the Sanctuary', 'Open Gate Sanctuary', 'Loxahatchee Groves', 60, 38, 15, 'Story time with the goats, a scavenger hunt and a craft table. For kids 4 to 12 and their grown-ups.'],
    [52, 12, 'Holiday Feast for the Animals', 'Open Gate Sanctuary', 'Loxahatchee Groves', 150, 87, 22, 'The residents get a feast of pumpkins and greens; you get a Vegan potluck. Bring a dish and a friend.']
  ];
  var PAST = [
    [-3, 9, 'Volunteer Saturday', 'Open Gate Sanctuary', 'Loxahatchee Groves', 30, 28, 9],
    [-10, 10, 'Sanctuary Open Day', 'Open Gate Sanctuary', 'Loxahatchee Groves', 120, 108, 37],
    [-17, 18, 'Fundraiser Dinner', 'A partner Vegan restaurant', 'Delray Beach', 80, 80, 21],
    [-24, 9, 'Volunteer Saturday', 'Open Gate Sanctuary', 'Loxahatchee Groves', 30, 25, 6],
    [-31, 11, 'Adoption Day: kittens', 'A partner Vegan cafe', 'Fort Lauderdale', 50, 44, 18],
    [-45, 10, 'Sanctuary Open Day', 'Open Gate Sanctuary', 'Loxahatchee Groves', 120, 97, 29],
    [-59, 18, 'Movie Night: a rescue documentary', 'Community room', 'Wellington', 70, 61, 19],
    [-73, 9, 'Hurricane prep: shelters and sandbags', 'Open Gate Sanctuary', 'Loxahatchee Groves', 40, 39, 11],
    [-94, 10, 'Sanctuary Open Day', 'Open Gate Sanctuary', 'Loxahatchee Groves', 120, 89, 30],
    [-122, 11, 'Adoption Day: hens', 'A partner Vegan cafe', 'West Palm Beach', 50, 36, 14]
  ];
  function ev(row, i, past) {
    var s = at(row[0], row[1]);
    return { id: (past ? 'p' : 'u') + i, title: row[2], starts_at: s, ends_at: plus(s, 3), timezone: 'America/New_York', time_set: true,
      location_name: row[3], city: row[4], state: 'FL', country: 'US', event_type: 'in_person', ticket_url: '', virtual_url: '',
      price_cents: 0, capacity: row[5], going: row[6], guest_passes: row[7], description: row[8] || '' };
  }
  var EVENTS = UP.map(function (r, i) { return ev(r, i, false); }).concat(PAST.map(function (r, i) { return ev(r, i, true); }));

  var FIRST = ['Maya', 'Carlos', 'Dana', 'Jamal', 'Priya', 'Luis', 'Grace', 'Theo', 'Nina', 'Marcus', 'Ava', 'Omar', 'Keisha', 'Ben', 'Sofia', 'Andre', 'Lena', 'Rafael', 'Hana', 'Tyler'];
  var LAST = 'RLTKBHRTFLNCPSAMDGWY';
  var VIA = ['Your link', 'Your event', 'Found you in the Directory', 'A Fosters post'];
  var MEMBERS = [];
  for (var i = 0; i < 60; i++) {
    var r = rnd(i + 5);
    MEMBERS.push({ name: FIRST[i % FIRST.length] + ' ' + LAST.charAt((i * 7) % LAST.length) + '.', joined: new Date(Date.now() - Math.floor(r * 330 + 1) * DAY).toISOString(),
      via: VIA[Math.floor(rnd(i + 21) * VIA.length)], events: Math.floor(rnd(i + 9) * 9),
      chapter: rnd(i + 11) < 0.78 ? 'South Florida' : rnd(i + 13) < 0.5 ? 'Central Florida' : 'North Florida' });
  }
  MEMBERS.sort(function (a, b) { return Date.parse(b.joined) - Date.parse(a.joined); });

  var ANN = [
    { id: 'a1', at: at(-1, 8), pinned: true, title: 'Foster homes needed this week', body: 'Twelve hens came in from a closed egg farm on Tuesday. Four need a quiet foster home for two weeks while they recover. Supplies and vet care are on us. Reply on the Board or write to us.', sent_to: 270, emailed: true },
    { id: 'a2', at: at(-5, 19), title: 'Five years: our anniversary is on the calendar', body: 'Join us at the sanctuary for a sunset walk, music and dinner. It is free; RSVP so we know how much food to make.', sent_to: 266, emailed: true },
    { id: 'a3', at: at(-12, 12), title: 'Thank you, volunteers', body: 'Twenty-eight of you came out on Saturday and the new goat barn roof is done. Juniper approves.', sent_to: 259, emailed: false }
  ];
  function annAll() {
    var mine = [];
    try { mine = JSON.parse(sessionStorage.getItem('ve_np_ann') || '[]'); } catch (e) {}
    var pinned = mine.some(function (x) { return x.pinned; });
    return mine.concat(ANN.map(function (x) { return pinned ? Object.assign({}, x, { pinned: false }) : x; })).sort(function (a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || Date.parse(b.at) - Date.parse(a.at); });
  }

  var ORG = {
    nonprofit: true,
    name: NAME, status: 'active', code: 'OPEN-GATE-SANCTUARY', link: 'vegansexplore.com/r/OPEN-GATE-SANCTUARY',
    members_total: 270, brought: 96, new_this_month: 22, placed: { homes: 38, open: 3 },
    ladder: [[0, 0]], rate_pct: 0, guest_passes: { used: 0, joined_after: 0 },
    members: MEMBERS, events: EVENTS, earnings: { passports_cents: 0, tickets_cents: 0, ready_cents: 0, holding_cents: 0, payouts: [], recent: [] }
  };

  function stats(days) {
    var now = [], before = [];
    for (var d = days - 1; d >= 0; d--) {
      var t = Date.now() - d * DAY, k = Math.floor(t / DAY), v = Math.round(34 + rnd(k) * 26);
      now.push({ day: new Date(t).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }), views: v, visitors: Math.round(v * 0.7), actions: Math.round(v * 0.32) });
      before.push(Math.round(22 + rnd(k - days) * 18));
    }
    var views = now.reduce(function (a, x) { return a + x.views; }, 0), acts = now.reduce(function (a, x) { return a + x.actions; }, 0);
    return { days: days, totals: { view: views, website: Math.round(acts * 0.35), social: Math.round(acts * 0.4), photos: Math.round(acts * 0.25) },
      visitors: Math.round(views * 0.64), previous: { views: before.reduce(function (a, x) { return a + x; }, 0), visitors: 0, actions: Math.round(acts * 0.74) },
      daily: now, via: { page: Math.round(views * 0.5), guide: Math.round(views * 0.15), link: Math.round(views * 0.35) } };
  }
  var D = {
    ok: true,
    listing: { id: 'sample-open-gate-sanctuary', name: NAME, slug: 'sample', category: 'Sanctuaries', food: false, kind: 'group', hub: 'south-florida', claim_status: 'verified' },
    open: true, owner: true, admin: false, member_active: true,
    checklist: [{ k: 'logo', done: true }, { k: 'description', done: true }, { k: 'photos', done: false }],
    cards: [
      { kind: 'new', title: 'Three foster calls are open', body: 'Your hens post has 9 replies. Two members in Wellington offered a home; reply to them on the Board.', cta_label: 'Open your page', cta_url: '?tab=board' },
      { kind: 'tip', title: 'Your anniversary is 76% full', body: 'Share the event in your next announcement so the last spots go to your members first.', cta_label: 'Open Events', cta_url: '?pd=gevents' },
      { kind: 'offer', title: 'Add photos of your residents', body: 'Pages with photos get more members. Add up to 12 from Your page.', cta_label: 'Open Your page', cta_url: '?pd=page' }
    ],
    menu_count: 0, plan: null, ads: [],
    spots: [{ page_slug: '/events', page_name: 'Events', views: 6100, slots: 1 }, { page_slug: '/communities/south-florida', page_name: 'South Florida community', views: 9200, slots: 1 }],
    audits: [], orders: [],
    guides: [{ slug: 'nonprofit-guide', title: 'The Nonprofit Guide', description: 'Ten tips for running a Vegan organization: getting found, events, partners and avoiding burnout.', access_rule: 'points', owned: true }],
    opportunities: [], interests: [],
    group: ORG
  };

  window.VE_DEMO = {
    business: true,
    group: true,
    nonprofit: true,
    tour: false,
    label: 'This is what an organization\'s home on Vegans Explore can look like in 2027. Open Gate Sanctuary is made up, and so are its numbers. Nothing is saved.',
    login: { email: 'demo@vegansexplore.com', password: 'explore11' },
    guideUrl: '/guides/nonprofit-guide',
    guideName: 'The Nonprofit Guide',
    events: EVENTS,
    group: ORG,
    announcements: annAll,
    galleries: [],
    // The Board: foster and rescue calls, updates and conversations. Newest first, each with its replies.
    board: [
      { who: NAME, when: 0, host: true, pinned: true, text: 'Welcome to our Board. Foster calls, rescue updates and volunteer days are posted here first. Follow us to see them on your dashboard.', replies: [
        { who: 'Dana R.', when: 1, text: 'Just followed. I live ten minutes away in Royal Palm Beach and can help on weekends.' },
        { who: NAME, when: 1, host: true, text: 'Welcome, Dana! Volunteer Saturday is a great first day.' }] },
      { who: NAME, when: 1, host: true, tag: 'Needs a foster', text: 'Foster homes needed: four of the twelve hens from Tuesday\'s rescue need two weeks somewhere quiet while they recover. We cover food, bedding and vet care.', replies: [
        { who: 'Carlos T.', when: 1, text: 'We have a covered yard in Wellington and fostered two hens last spring. Happy to take two.' },
        { who: 'Grace M.', when: 1, text: 'I can take one. First time fostering. What do I need?' },
        { who: NAME, when: 0, host: true, text: 'Carlos, thank you, we will call you tonight. Grace, we will drop off a crate and a care sheet and walk you through it.' },
        { who: 'Grace M.', when: 0, text: 'Perfect. Ready when you are.' }] },
      { who: NAME, when: 3, host: true, tag: 'Rescue update', text: 'Rescue update: the three goats pulled from the flooded property in Belle Glade are eating, walking and very loud. Thank you to everyone who shared the call.', replies: [
        { who: 'Jamal K.', when: 3, text: 'The little brown one is a star. Can we name him?' },
        { who: NAME, when: 2, host: true, text: 'Name ideas in the replies. We pick on Friday.' },
        { who: 'Priya S.', when: 2, text: 'Biscuit. Final answer.' },
        { who: 'Luis G.', when: 2, text: 'Biscuit gets my vote too.' }] },
      { who: 'Nina H.', when: 5, tag: 'Can foster', text: 'Experienced foster in Jupiter with room for a cat or two small dogs. Can any rescue on here use me this month?', replies: [
        { who: 'Marcus L.', when: 5, text: 'Our rescue in Palm Beach Gardens has a bonded pair of cats who need exactly that. Messaging you.' },
        { who: 'Nina H.', when: 4, text: 'Got it, talk soon.' }] },
      { who: 'Ava B.', when: 8, text: 'First Open Day last weekend with my kids. They have not stopped talking about Juniper. Is the Kids Day open to five-year-olds?', replies: [
        { who: NAME, when: 7, host: true, text: 'Yes, 4 to 12. See you there!' }] }
    ],
    listing: {
      id: 'sample-open-gate-sanctuary',
      slug: 'sample',
      name: NAME,
      logo_url: '',
      initials: 'OG',
      color: '#2D5C27',
      category: 'Sanctuaries',
      extra_categories: ['Rescues'],
      vegan_status: null,
      tagline: 'A farm animal sanctuary and rescue in Palm Beach County: safety for the animals, a place for the community.',
      description: 'Open Gate Sanctuary is a sample organization made up for this page. Picture a sanctuary on ten acres west of West Palm Beach that has given more than 400 cows, goats, pigs, hens and ducks a home for life. Its members volunteer on Saturdays, foster birds and small animals after rescues, come to open days and adoption events, and spread the word when an animal needs help.',
      website: '',
      instagram: '',
      address_city: 'Loxahatchee Groves',
      address_state: 'FL',
      communities: ['south-florida'],
      business_status: 'OPERATIONAL',
      claimed_by_member_id: 'sample',
      owner_member_id: 'sample',
      claim_status: 'verified',
      vote_count: 638,
      voter_count: 211,
      tags: ['ve-nonprofit-partner']
    },
    dashboard: function (body, toast) {
      var a = body && body.action;
      if (a === 'group_announce') {
        var t = String(body.title || '').trim().slice(0, 120), m = String(body.body || '').trim().slice(0, 1000);
        if (!t || !m) return Promise.resolve({ ok: false, error: 'missing' });
        var mine = []; try { mine = JSON.parse(sessionStorage.getItem('ve_np_ann') || '[]'); } catch (e) {}
        if (body.pin) mine.forEach(function (x) { x.pinned = false; });
        mine.unshift({ id: 'm' + Date.now(), at: new Date().toISOString(), pinned: !!body.pin, title: t, body: m, sent_to: ORG.members_total, emailed: !!body.email, sample: true });
        try { sessionStorage.setItem('ve_np_ann', JSON.stringify(mine)); } catch (e) {}
        ORG.announcements = annAll(); if (window.gdAnnRender) window.gdAnnRender();
        toast('Sample: posted on your page' + (body.email ? ' and it would be emailed to your ' + ORG.members_total + ' members' : '') + '. Nothing is really sent.');
        return Promise.resolve({ ok: true, announcements: ORG.announcements });
      }
      if (a === 'owner_dashboard') { ORG.announcements = annAll(); var days = Math.min(365, Math.max(1, Number(body.days) || 30)); return Promise.resolve(Object.assign({}, D, { days: days, stats: stats(days), saves: { total: 184, last_30_days: 41 } })); }
      if (a === 'demo_only') { toast('Sample: ' + (body.note || '') + ' Nothing is saved here.'); return Promise.resolve({ ok: true }); }
      toast('Sample dashboard: nothing is saved here. For a real organization this happens for real.');
      return Promise.resolve({ ok: true });
    }
  };
})();
