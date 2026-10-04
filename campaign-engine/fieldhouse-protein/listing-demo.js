/* Illustrative listing data for the Campaign Engine demo (playbook ve-campaign-engine).
 * Fieldhouse Protein is an invented brand. This file feeds the real Directory listing page
 * (/directory/listing.html) through its demo mode, so the demo is the actual listing template
 * with a campaign running on it. Nothing here is written to the database.
 *
 * The campaign can be stepped week by week (1 to 10, then Final): campaignAt(week) returns the
 * campaign as it stood that week. The weekly series match the sponsor dashboard exactly.
 * Images were made with Nano Banana Pro (Higgsfield) on 2026-10-04 and are served from its CDN.
 */
(function () {
  var IMG = 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDGnUNmLloVUBJsrfOxR8cZFdv/';
  var P = {
    pb: IMG + 'hf_20261004_223504_1a0d641f-c7c4-411d-af6d-e098f7bbfd6b.png',
    cocoa: IMG + 'hf_20261004_223504_6c53070a-f1dc-42d7-9076-209433d893d2.png',
    maple: IMG + 'hf_20261004_223504_8fd45de1-8d23-4f6f-b79f-bcf2eb708b20.png',
    lemon: IMG + 'hf_20261004_223504_60637abb-9365-4107-a8e0-63a58b3fdb69.png',
    choc: IMG + 'hf_20261004_223504_13c9a58f-80f8-4afe-b169-0813c9ee996c.png',
    vanilla: IMG + 'hf_20261004_223505_1ce55de7-8cc1-454b-b3f9-57ff58f2e561.png',
    coldbrew: IMG + 'hf_20261004_223504_c3050fc7-80a8-4fd4-b2aa-88a85dd25a5a.png',
    maya: IMG + 'hf_20261004_223505_829259cd-16f6-475a-88be-97e73aae24ab.png',
    dani: IMG + 'hf_20261004_223504_c6a1bd5a-b0e7-46ca-9f52-1c2d31e5127d.png',
    priya: IMG + 'hf_20261004_223505_0afbc150-1a48-48ca-ad03-cf1a02757060.png',
    jordan: IMG + 'hf_20261004_223505_2c73144d-dff4-4576-beb5-3f1040b16781.png',
    andre: IMG + 'hf_20261004_223505_85e956f9-0b41-4627-bc5e-e53e61ab7671.png',
    film: IMG + 'hf_20261004_223509_64c80604-8a8e-4c91-9037-cada0957c6e6.png',
    booth: IMG + 'hf_20261004_223509_c31f8db9-3f8f-4f74-8ac8-3c24605f0b4b.png',
    sampling: IMG + 'hf_20261004_223509_4180eabb-d14d-4ad3-ba0a-86ec63dae85e.png',
    volunteers: IMG + 'hf_20261004_223509_acfd5ce6-dd34-408e-be33-02312cea7c65.png'
  };

  // Season series, cumulative by week 1..10 (index 0 = week 1). Same numbers as the dashboard.
  var S = {
    clicks: [310, 770, 1380, 2100, 2910, 3800, 4750, 5695, 6635, 7450],
    members: [180, 350, 500, 640, 770, 890, 1000, 1090, 1170, 1240],
    tasks: [150, 380, 670, 990, 2250, 2500, 2690, 2850, 2990, 3100],
    posts: [20, 55, 100, 150, 212, 260, 312, 357, 399, 436],
    placed: [3500, 7700, 12000, 16500, 30700, 35300, 39700, 43700, 47500, 51000]
  };
  // Final task totals; the festival booth task happens in week 5 only.
  var TASKS = [
    { id: 'run', title: 'Run-club check-in', points: 30, max: 10, verify: 'checkin', cap: 'Once a week, up to 10', desc: 'Check in at a partner run club with the Passport.', total: 1420,
      how: ['Go to a partner run club on a Saturday.', 'Show your member QR code to the Community Manager when you arrive.', 'Once they mark you on the roster, it counts: 30 points.'] },
    { id: 'shake', title: 'Post-workout shake post', points: 50, max: 10, verify: 'link', cap: 'Once a week, up to 10', desc: 'Post your post-workout shake, labeled #ad.', total: 330,
      how: ['Post a photo or short video of your post-workout shake.', 'Label it #ad and add #HowDoYouFieldhouse.', 'Paste the link here. A Community Manager checks it, then the 50 points land.'] },
    { id: 'friend', title: 'Bring a friend', points: 75, max: 4, verify: 'referral', cap: 'Up to 4 friends', desc: 'A friend joins Vegans Explore through your link.', total: 290,
      how: ['Share your personal referral link. Every member has one.', 'When a friend joins Vegans Explore through it, it counts on its own: 75 points each, up to 4.'] },
    { id: 'prep', title: 'Meal-prep video', points: 100, max: 4, verify: 'link', cap: 'Up to 4 videos', desc: 'A training-week meal prep with Fieldhouse, labeled #ad.', total: 80,
      how: ['Film a training-week meal prep that uses Fieldhouse.', 'Post it labeled #ad and add #HowDoYouFieldhouse.', 'Paste the link here. A Community Manager reviews it, then you get 100 points.'] },
    { id: 'booth', title: 'Visit the festival booth', points: 40, max: 1, verify: 'checkin', cap: 'Once, festival weekend', desc: 'Check in at the Fieldhouse booth at the South Florida spring festival.', total: 980, week: 5,
      how: ['Visit the Fieldhouse booth at the South Florida spring festival.', 'Show your member QR code at the booth.', 'Once you are checked in, it counts: 40 points.'] }
  ];
  var BOOTH = 980;
  // Final leaderboard (top 5 per city); earlier weeks scale with tasks done.
  var BOARD = {
    'Atlanta': [['Tasha W.', 1450], ['Devon K.', 1370], ['Luis M.', 1215], ['Ari P.', 1165], ['Kim B.', 1120]],
    'South Florida': [['Nia H.', 1465], ['Carlos R.', 1315], ['Jess T.', 1230], ['Omar F.', 1130], ['Bri L.', 1080]],
    'DMV': [['Sam O.', 1190], ['Rae J.', 1090], ['Theo N.', 1010], ['Ivy C.', 940], ['Marc D.', 895]]
  };
  var PULSE = [
    { week: 1, type: 'announcement', published_at: '2027-03-02', headline: '"How do you Fieldhouse?" starts today',
      subhead: 'Ten weeks, three cities, five ways to earn points.',
      body: 'Show us how plant protein fits your training: a post-workout shake, a run-club check-in, a meal-prep video. Join from this listing, pick your tasks, and earn points toward the grand prize, sampler boxes and digital rewards.\n\nEveryone starts at zero. Every post made for points is labeled #ad.' },
    { week: 3, type: 'collab', published_at: '2027-03-16', headline: 'Meet the six creators',
      subhead: 'Two in each city, all approved Vegans Explore creators.',
      body: 'Maya R. and Jordan K. in Atlanta, Dani M. and Andre L. in South Florida, Priya S. and Marcus T. in the DMV. Their collab videos are on the Video tab, labeled #ad.' },
    { week: 5, type: 'event', published_at: '2027-04-06', headline: 'Festival recap: 9,800 samples in two days',
      subhead: 'Thank you to everyone who stopped by the booth in South Florida.',
      body: 'Our first festival booth with Vegans Explore handed out 9,800 samples over two days. 980 members checked in with the Passport for 40 points each, and 24 members worked volunteer shifts.' },
    { week: 6, type: 'update', published_at: '2027-04-13', headline: 'Week 6: Atlanta run clubs lead the challenge',
      subhead: 'More than half of all run-club check-ins this season come from Atlanta.',
      body: 'Atlanta run clubs are carrying the challenge into its second half. This week we are adding two Atlanta creator posts and a run-club bounty worth double points on Saturday mornings.' },
    { week: 8, type: 'update', published_at: '2027-04-27', headline: 'The DMV meal-prep workshop sold out',
      subhead: '30 seats, gone in a day. A second date is coming.',
      body: 'Priya S. walked 30 members through a training week of plant-based meals. Meal-prep videos count for 100 points each, up to four this season.' },
    { week: 11, type: 'announcement', published_at: '2027-05-11', headline: 'Season wrap: the winners',
      subhead: 'Nia H. takes the grand prize with 1,465 points.',
      body: 'Thank you to 1,240 members in three cities. The grand prize goes to Nia H. in South Florida. The top 10 in each city get a Fieldhouse sampler box, and everyone who passed 300 points has a digital coupon in their dashboard.' }
  ];

  function at(arr, w) { return arr[Math.min(w, 10) - 1]; }
  function fmt(n) { return Number(n).toLocaleString('en-US'); }

  function campaignAt(week) {
    var w = Math.max(1, Math.min(11, week | 0)), fin = w === 11, k = Math.min(w, 10);
    var nonBoothNow = at(S.tasks, k) - (k >= 5 ? BOOTH : 0), nonBoothEnd = 3100 - BOOTH;
    var tasks = TASKS.map(function (t) {
      var count = t.id === 'booth' ? (k >= 5 ? BOOTH : 0) : Math.round(t.total * nonBoothNow / nonBoothEnd);
      var ended = fin || (t.week && k > t.week), upcoming = t.week && k < t.week;
      return { id: t.id, title: t.title, points: t.points, max: t.max, verify: t.verify, how: t.how, cap: t.cap, desc: t.desc, count: count, ended: ended, upcoming: upcoming };
    });
    var scale = at(S.tasks, k) / 3100, board = {}, all = [];
    Object.keys(BOARD).forEach(function (c) {
      board[c] = BOARD[c].map(function (r) { return [r[0], Math.round(r[1] * scale / 5) * 5]; });
      board[c].forEach(function (r) { all.push([r[0] + ' · ' + c, r[1]]); });
    });
    all.sort(function (a, b) { return b[1] - a[1]; });
    var leaderboard = { 'All cities': all.slice(0, 5) };
    Object.keys(board).forEach(function (c) { leaderboard[c] = board[c]; });
    var events = [
      { when: 'Every Saturday', day: 'SAT', title: 'Atlanta run-club shakeout', place: 'Partner run clubs, Atlanta', desc: 'Cold Chocolate shakes at the finish. Check in with the Passport for 30 points.', status: fin ? 'Happened' : 'Coming up' },
      { when: 'Apr 25', day: '25', title: 'Meal-prep workshop with Priya S.', place: 'Community kitchen, Washington DC', desc: k >= 8 ? 'Sold out: 30 members built a training week of plant-based meals.' : 'Build a training week of plant-based meals. Members only, 30 seats.', status: k >= 8 ? 'Happened' : 'Coming up' },
      { when: 'Apr 4 to 5', day: '4', title: 'South Florida spring festival booth', place: 'South Florida', desc: k >= 5 ? '9,800 samples, 980 Passport check-ins and 24 volunteer shifts.' : 'Our booth at the spring festival: free samples, and 40 points for checking in.', status: k >= 5 ? 'Happened' : 'Coming up', img: k >= 5 ? P.booth : null }
    ];
    var moved = k >= 6;
    var note = fin
      ? 'Season complete. $51,000 placed, nothing added. Atlanta finished with the most retailer clicks of any city after the week-6 move.'
      : moved ? 'Week 6: we moved $3,000 from the DMV ad rail to Atlanta, where run-club check-ins are turning into retailer clicks at twice the rate of the other cities.'
      : 'Running as planned. When one part works better than another, we move money there and the reason shows up here the same day.';
    return {
      title: 'How do you Fieldhouse?',
      week: k, weeks: 10, final: fin,
      level: 'Season Sponsor',
      cities: ['South Florida', 'Atlanta', 'DMV'],
      dates: 'Mar 2 to May 10',
      story: 'Show how plant protein fits your training: a post-workout shake, a run-club check-in or a meal-prep video. Join here, pick the tasks that fit your routine, and earn points toward real prizes. Everyone starts at zero, and every post made for points is labeled #ad.',
      entry: 'Members only: joining Vegans Explore is how you enter.',
      maxPoints: 1540,
      tasks: tasks,
      prizes: [
        { kind: 'Grand prize', label: 'Most points at the end of the season', detail: 'A year of Fieldhouse and a festival VIP pass' },
        { kind: 'Top 10 in each city', label: 'Fieldhouse sampler box', detail: '30 boxes in all' },
        { kind: 'Digital reward', label: '$1 off coupon', detail: 'Reach 300 points' },
        { kind: 'Digital reward', label: 'Free shake coupon', detail: 'Reach 750 points' }
      ],
      prizeIdeas: ['Product boxes or bundles', 'Free-product or dollar-off coupon codes', 'Early access to a new flavor', 'Branded merch', 'Event VIP passes', 'A workout or meal with a creator', 'Meet the founders'],
      leaderboard: leaderboard,
      creators: [
        { n: 'Maya R.', c: 'Atlanta', bg: '#1b6b4a' }, { n: 'Jordan K.', c: 'Atlanta', bg: '#2f8a5f' },
        { n: 'Dani M.', c: 'South Florida', bg: '#b0562a' }, { n: 'Andre L.', c: 'South Florida', bg: '#8a4b1f' },
        { n: 'Priya S.', c: 'DMV', bg: '#4b3a8a' }, { n: 'Marcus T.', c: 'DMV', bg: '#6a58b0' }
      ],
      events: events,
      owner: {
        tiles: [[fmt(at(S.clicks, k)), 'retailer clicks'], [fmt(at(S.members, k)), 'members in the challenge'], [fmt(at(S.tasks, k)), 'tasks completed'], [fmt(at(S.posts, k)), 'posts labeled #ad'], ['$' + fmt(at(S.placed, k)), 'placed of $51,000']],
        note: note
      },
      pulse: PULSE.filter(function (p) { return p.week <= w; }).reverse()
    };
  }

  window.VE_DEMO = {
    label: 'Fieldhouse Protein is an invented brand, shown on the real Directory listing page with a campaign running on it. The numbers are realistic examples.',
    reportUrl: '/campaign-engine/fieldhouse-protein/report',
    dashboardUrl: '/campaign-engine/fieldhouse-protein/dashboard',
    socialUrl: '/campaign-engine/fieldhouse-protein/social',
    hubUrl: '/campaign-engine',
    startWeek: 6,
    campaignAt: campaignAt,

    listing: {
      id: 'demo-fieldhouse-protein',
      slug: 'fieldhouse-protein',
      name: 'Fieldhouse Protein',
      initials: 'FH',
      color: '#1d2f4f',
      category: 'Food Brands',
      vegan_status: 'fully_vegan',
      tagline: 'Plant protein for people who train. Pea and pumpkin-seed protein bars and ready-to-drink shakes.',
      description: 'Fieldhouse started in a college locker room. Two sprinters went plant-based in their junior year and could not find a protein bar that held up to real training, so after graduating they made their own in a shared kitchen. Today Fieldhouse makes four bars and three ready-to-drink shakes, all plant-based, sold online and in regional grocery stores across the Southeast and Mid-Atlantic.',
      website: 'https://example.com/fieldhouse-protein',
      email: 'hello@example.com',
      instagram: 'fieldhouseprotein',
      tiktok: 'fieldhouseprotein',
      youtube: 'fieldhouseprotein',
      claimed_by_member_id: 'demo',
      claim_status: 'verified',
      vote_count: 412,
      collaboration_open: true,
      media_opportunities_open: true,
      gallery_urls: [P.booth, P.pb, P.choc, P.sampling, P.cocoa, P.volunteers, P.coldbrew, P.maple]
    },

    // Products use the listing's Menu tab (ve_menu_items shape), shown as "Products" for Food Brands.
    menu: [
      { category: 'Protein bars', name: 'Peanut Butter Sprint', image: P.pb, description: 'The original. Roasted peanut butter, pumpkin seeds and a soft-baked middle that holds together in a gym bag.', price_display: '$2.99 · $32.99 for 12', is_featured: true, buy: '/go/fh-store', nutrition: 'bar' },
      { category: 'Protein bars', name: 'Cocoa Recovery', image: P.cocoa, description: 'Dark cocoa and sea salt with tart cherry, built for the hour after a hard session.', price_display: '$2.99 · $32.99 for 12', is_featured: true, buy: '/go/fh-store', nutrition: 'bar' },
      { category: 'Protein bars', name: 'Salted Maple Oat', image: P.maple, description: 'Toasted oats, maple and a pinch of salt. Breakfast for early runs.', price_display: '$2.99 · $32.99 for 12', is_gluten_free: true, buy: '/go/fh-store', nutrition: 'bar' },
      { category: 'Protein bars', name: 'Lemon Seed Crunch', image: P.lemon, description: 'Bright lemon with a pumpkin and sunflower seed crunch. The lightest bar in the line.', price_display: '$2.99 · $32.99 for 12', is_gluten_free: true, buy: '/go/fh-store', nutrition: 'bar' },
      { category: 'Ready-to-drink shakes', name: 'Chocolate', image: P.choc, description: '25g of pea and pumpkin-seed protein, cold from the fridge. The best seller at run-club pickups.', price_display: '$3.99 · $44.99 for 12', is_featured: true, buy: '/go/fh-store', nutrition: 'shake' },
      { category: 'Ready-to-drink shakes', name: 'Vanilla Bean', image: P.vanilla, description: 'Smooth vanilla that works on its own or blended with fruit.', price_display: '$3.99 · $44.99 for 12', buy: '/go/fh-store', nutrition: 'shake' },
      { category: 'Ready-to-drink shakes', name: 'Cold Brew', image: P.coldbrew, description: 'Protein and real cold brew coffee in one bottle, for mornings before the gym.', price_display: '$3.99 · $44.99 for 12', buy: '/go/fh-store', nutrition: 'shake' }
    ],
    nutrition: {
      bar: 'Per bar (60g): 230 calories · 20g protein · 9g fat (1.5g saturated) · 22g carbs · 7g fiber · 6g sugars (5g added) · 190mg sodium. Vegan, gluten-free, soy-free. Supplied and approved by Fieldhouse.',
      shake: 'Per bottle (330ml): 170 calories · 25g protein · 5g fat (1g saturated) · 9g carbs · 3g fiber · 4g sugars (4g added) · 220mg sodium · 30% calcium. Vegan, soy-free. Supplied and approved by Fieldhouse.'
    },

    videos: [
      { t: 'Saturday long run, then a shake', m: 'Maya R. · Atlanta · Creator collab #ad', len: '0:58', img: P.maya, kind: 'Creator collab' },
      { t: 'Meal prep for a training week', m: 'Dani M. · South Florida · Creator collab #ad', len: '1:42', img: P.dani, kind: 'Creator collab' },
      { t: 'Run-club check-in at sunrise', m: 'Priya S. · DMV · Creator collab #ad', len: '0:45', img: P.priya, kind: 'Creator collab' },
      { t: 'Trail day, three bars deep', m: 'Jordan K. · Atlanta · Creator collab #ad', len: '0:52', img: P.jordan, kind: 'Creator collab' },
      { t: 'Strength day with Cocoa Recovery', m: 'Andre L. · South Florida · Creator collab #ad', len: '1:05', img: P.andre, kind: 'Creator collab' },
      { t: 'The locker room where it started', m: 'Fieldhouse Protein · Brand film', len: '2:14', img: P.film, kind: 'Brand film' }
    ],
    images: P
  };
})();
