/* The sample community (Sean, 2026-11-09, playbook community-sponsorship: "This is where we use our demo, and we can show them what
 * it would look like if they were one of our sponsors. So we can make up a presenting sponsor, a fictitious city"). Marisol Bay is a
 * made-up coastal city. /communities/sample is the real hub page (communities/hub.html) with the hub from public/ve-hubs.js
 * (VE_SAMPLE_HUB); hub.html loads this file first on that page only. It does three things, all in the page's memory:
 *   1. Calls. Every call the hub makes for its sections (listings, events, the Daily Pulse, stories, votes, signature dishes, the
 *      Passport Challenge, opportunities, rewards, the billboard) is answered here from the fixtures below. Nothing is read from or
 *      written to the database, and the sample never depends on the network. Calls the hub does not make for its sections (the
 *      menu, sign-in) go through as usual.
 *   2. Clicks. Anything that would open a real page for a made-up item (a listing, a Pulse topic, a sponsor's site, an RSVP) or save
 *      something (a vote, a save) says so in a toast instead. Green Leaf Kitchen opens the sample business, /business/sample.
 *   3. The stamp. A Sample tag sits on the page at all times (canon: demos are stamped Sample, never passed off as real).
 * Every business, sponsor, person and number here is made up. Pictures are the sample business's own (business/sample/img/).
 * Dates are counted from today, so the sample never goes stale.
 */
(function () {
  if (window.VE_SAMPLE_COMMUNITY) return;
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var IMG = '/business/sample/img/';
  var DAY = 864e5, NOW = Date.now();
  function at(days, hour, min) { var d = new Date(NOW + days * DAY); d.setHours(hour == null ? 12 : hour, min || 0, 0, 0); return d.toISOString(); }
  function plus(iso, hours) { return new Date(Date.parse(iso) + hours * 36e5).toISOString(); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // ---- The Directory: places, a brand, a studio, a sanctuary, a group, a podcast and a chef in Marisol Bay ----------------------
  // [slug, name, category, city, color, votes, logo, extra]
  var L = [
    ['sample', 'Green Leaf Kitchen', 'Restaurants', 'Marisol Bay', '#1f5f22', 412, IMG + 'logo.jpg', { claim_status: 'verified', cuisines: ['american', 'caribbean'] }],
    ['saltwater-bakehouse-sample', 'Saltwater Bakehouse', 'Bakeries & Cafes', 'Marisol Bay', '#7c2d12', 351, '', { claim_status: 'verified' }],
    ['tidepool-tacos-sample', 'Tidepool Tacos', 'Food Trucks', 'Marisol Beach', '#0e7490', 288, '', { claim_status: 'verified', cuisines: ['mexican'] }],
    ['mangrove-and-mint-sample', 'Mangrove & Mint', 'Restaurants', 'Port Marisol', '#166534', 263, '', { cuisines: ['thai', 'caribbean'] }],
    ['harbor-lights-pizza-sample', 'Harbor Lights Pizza', 'Restaurants', 'Port Marisol', '#b91c1c', 221, '', { cuisines: ['italian'] }],
    ['bayfront-greens-market-sample', 'Bayfront Greens Market', 'Markets', 'Marisol Bay', '#4d7c0f', 197, '', {}],
    ['sunrise-smoothie-shack-sample', 'Sunrise Smoothie Shack', 'Bakeries & Cafes', 'Seagrape Key', '#c2410c', 154, '', {}],
    ['seagrape-supper-club-sample', 'Seagrape Supper Club', 'Catering', 'Seagrape Key', '#6b21a8', 96, '', {}],
    ['marisol-pepper-co-sample', 'Marisol Pepper Co.', 'Food Brands', 'Port Marisol', '#9a3412', 132, '', { product_kinds: ['pantry'] }],
    ['low-tide-yoga-sample', 'Low Tide Yoga', 'Health and Wellness', 'Marisol Beach', '#0369a1', 88, '', {}],
    ['bay-paws-sanctuary-sample', 'Bay Paws Sanctuary', 'Sanctuaries', 'Marisol Bay', '#92400e', 176, '', {}],
    ['marisol-bay-vegans-meetup-sample', 'Marisol Bay Vegans Meetup', 'Groups', 'Marisol Bay', '#15803d', 143, '', {}],
    ['plant-talk-on-the-bay-sample', 'Plant Talk on the Bay', 'Podcasts', '', '#1e3a8a', 74, '', {}],
    ['chef-alana-reyes-sample', 'Chef Alana Reyes', 'Chefs', '', '#be185d', 119, '', { person_title: 'Chef and owner, Mangrove & Mint' }]
  ];
  var LISTINGS = L.map(function (r, i) {
    var x = { id: 'sample-mb-' + i, slug: r[0], name: r[1], category: r[2], logo_url: r[6] || null, vote_count: r[5], voter_count: Math.round(r[5] * 0.8),
      claim_status: 'unclaimed', extra_categories: [], business_status: 'OPERATIONAL', is_featured: false, ve_verified: false, address_city: r[3] || null,
      address_state: r[3] ? 'FL' : null, color: r[4], vegan_status: 'fully_vegan', tags: [], communities: r[3] ? [] : ['sample'], product_kinds: [], cuisines: [],
      vetted_at: at(-60), release_year: null, book_type: null, health_type: null, shared_kitchen: null, person_title: null, specialty: null };
    Object.keys(r[7]).forEach(function (k) { x[k] = r[7][k]; });
    return x;
  });
  var BY = {}; LISTINGS.forEach(function (l) { BY[l.slug] = l; });

  // ---- Events, upcoming and past, at the sample places. The presenting sponsor's festival leads. ---------------------------------
  // [days from today, hour, title, venue, city, category, going]
  var EV = [
    [5, 11, 'Plant-Based Weekend on the Bay, presented by Visit Marisol Bay', 'Bayfront Park', 'Marisol Bay', 'Festival', 640],
    [2, 19, 'Marisol Bay Vegans Monthly Meetup', 'Harbor Lights Pizza', 'Port Marisol', 'Meetup', 46],
    [9, 9, 'Beach Cleanup and Smoothies', 'Sunrise Smoothie Shack', 'Seagrape Key', 'Volunteer', 58],
    [12, 18, 'Chamber Mixer: Plant-Forward Menus, with the Marisol Bay Chamber of Commerce', 'Chamber Hall', 'Marisol Bay', 'Networking', 72],
    [16, 10, 'Sourdough on Saturday: a Bread Class', 'Saltwater Bakehouse', 'Marisol Bay', 'Class', 18],
    [23, 19, 'Sunset Supper Club: Five Courses on the Water', 'Seagrape Supper Club', 'Seagrape Key', 'Dinner', 32],
    [-4, 19, 'Taco Tuesday Takeover', 'Tidepool Tacos', 'Marisol Beach', 'Meetup', 51],
    [-11, 8, 'Yoga on the Sand', 'Low Tide Yoga', 'Marisol Beach', 'Wellness', 37],
    [-18, 10, 'Sanctuary Open Day', 'Bay Paws Sanctuary', 'Marisol Bay', 'Community', 120]
  ];
  var EVENTS = EV.map(function (e, i) {
    var s = at(e[0], e[1]);
    return { id: 'sample-ev-' + i, title: e[2], starts_at: s, ends_at: plus(s, e[5] === 'Festival' ? 8 : 2.5), location_name: e[3], city: e[4], state: 'FL',
      category: e[5], event_type: 'in_person', ticket_url: '#sample-rsvp', rsvp_count: e[6], time_set: true, host: null };
  });

  // ---- The Daily Pulse: three Marisol Bay topics and the national one. The first is the presenting sponsor's feature. -------------
  function topic(id, community, daysAgo, title, body, question, replies, briefing) {
    return { id: id, community: community, title: title, body: body, question: question, published_at: at(-daysAgo, 7), reply_count: replies, briefing: briefing };
  }
  var POSTS = [
    topic('sample-pulse-1', 'sample', 0, 'The Plant-Based Weekend on the Bay is five days out',
      'Visit Marisol Bay, this community\'s presenting sponsor, brings forty Vegan vendors, a chef stage and a sunset market to Bayfront Park this weekend. Green Leaf Kitchen and Tidepool Tacos are on the lineup.',
      'Which vendor are you hitting first?', 38,
      { stories: [{ title: 'Forty vendors confirmed for the Plant-Based Weekend' }, { title: 'Visit Marisol Bay adds a free shuttle from Port Marisol' }, { title: 'Chef Alana Reyes headlines the chef stage' }],
        events: [{ title: 'Plant-Based Weekend on the Bay', when: '', where: 'Bayfront Park' }], action: { title: 'Plan your weekend' } }),
    topic('sample-pulse-2', 'sample', 1, 'Port Marisol gets its first all-Vegan pizza counter',
      'Harbor Lights Pizza opened a slice window on the waterfront, with cashew mozzarella made in house. Members have voted it into the Directory\'s top five in a week.',
      'What should be on the next special?', 24,
      { stories: [{ title: 'Harbor Lights Pizza opens a slice window' }, { title: 'Bayfront Greens Market stocks three new local brands' }], events: [], action: { title: 'Vote for your favorite slice' } }),
    topic('sample-pulse-3', 'sample', 2, 'The chamber wants more plant-based dishes on Main Street',
      'The Marisol Bay Chamber of Commerce, a community sponsor, is helping restaurants add plant-based (Pre-Vegan) options, starting with a mixer on the calendar.',
      'Which Main Street spot should go first?', 17,
      { stories: [{ title: 'Chamber mixer on plant-forward menus set for next week' }], events: [{ title: 'Chamber Mixer: Plant-Forward Menus', when: '', where: 'Chamber Hall' }], action: { title: 'Nominate a restaurant' } }),
    topic('sample-pulse-4', 'national', 0, 'Plant-based menus keep growing in beach towns',
      'Coastal cities are adding Vegan dishes faster than the national average, and visitors are planning trips around them.',
      'Would a Vegan food weekend bring you to a new city?', 61,
      { stories: [{ title: 'Beach towns lead on new Vegan menus' }, { title: 'Food festivals draw more first-time visitors' }], events: [], action: { title: 'Share a city you would visit' } })
  ];

  // ---- Featured stories: sponsor articles only (hub.html: "an article only when it is a sponsor") -------------------------------
  var STORIES = [
    { id: 'sample-story-1', headline: 'Visit Marisol Bay: a plant-based weekend on the bay', summary: 'Two days, forty Vegan vendors, a sunset market and a free shuttle. Here is how to plan the weekend, from the first coffee to the last slice.',
      body: '1', url: null, image_url: IMG + 's-window-bar.webp', is_pinned: true, published_at: at(-1, 9), source_name: 'Sponsor story: Visit Marisol Bay' },
    { id: 'sample-story-2', headline: 'Visit Marisol Bay: five sunset spots with a Vegan menu', summary: 'From a taco truck on Marisol Beach to a supper club on Seagrape Key, the tourism bureau picks five places to watch the sun go down.',
      body: '1', url: null, image_url: IMG + 's-outside-day.webp', is_pinned: false, published_at: at(-6, 9), source_name: 'Sponsor story: Visit Marisol Bay' },
    { id: 'sample-story-3', headline: 'The chamber\'s plan for plant-forward Main Street', summary: 'The Marisol Bay Chamber of Commerce on why more restaurants are adding plant-based (Pre-Vegan) options, and how it helps them start.',
      body: '1', url: null, image_url: IMG + 's-counter.webp', is_pinned: false, published_at: at(-9, 9), source_name: 'Sponsor story: Marisol Bay Chamber of Commerce' }
  ];

  // ---- Signature dishes: the places' own picks, with the sample business's food photos ----------------------------------------
  function dish(name, price, slug, line, votes, pic) { var l = BY[slug]; return { name: name, price_display: price, line: line, votes: votes, photo_url: IMG + pic,
    listing: { slug: l.slug, name: l.name, city: l.address_city, state: l.address_state, vegan_status: l.vegan_status, communities: l.communities } }; }
  var DISHES = [
    dish('Key Lime Cheesecake', '$9', 'sample', 'The slice people drive across the county for, on a graham and coconut crust.', 86, 'm-cheesecake.webp'),
    dish('Jackfruit Burrito', '$13', 'tidepool-tacos-sample', 'Citrus jackfruit, black beans and mango salsa, wrapped and griddled.', 71, 'm-burrito.webp'),
    dish('Banana Bread French Toast', '$12', 'saltwater-bakehouse-sample', 'Thick slices of the house banana bread, griddled with cinnamon and maple.', 64, 'm-bananabread.webp'),
    dish('Coconut Curry Noodles', '$15', 'mangrove-and-mint-sample', 'Rice noodles in a red coconut curry with Thai basil and lime.', 58, 'm-noodles.webp'),
    dish('Sunrise Acai Bowl', '$11', 'sunrise-smoothie-shack-sample', 'Acai, banana and pineapple under house granola and toasted coconut.', 47, 'm-acai.webp'),
    dish('BBQ Melt', '$14', 'harbor-lights-pizza-sample', 'Smoky pulled mushrooms and cashew cheese on grilled sourdough.', 39, 'm-bbq.webp')
  ];

  var STATS = { chapter: 'sample', places: LISTINGS.length, events: EV.filter(function (e) { return e[0] > 0; }).length, members: 1284, votes: 3412 };
  var HUNT = { hunt: { name: 'The Bay Brunch Trail', area_name: 'Marisol Bay', ends_on: at(26).slice(0, 10), goal: 'three of the four stops', badge_name: 'Bay Brunch Trail', points_reward: 500 },
    stops: [{ name: 'Green Leaf Kitchen', offer_text: 'A free cold brew with any brunch plate' }, { name: 'Saltwater Bakehouse', offer_text: '10% off a loaf' },
      { name: 'Sunrise Smoothie Shack', offer_text: 'A free granola topping' }, { name: 'Tidepool Tacos', offer_text: 'Two tacos for the price of one, Sunday mornings' }] };
  var OPPS = [
    { id: 'sample-opp-1', title: 'Community Manager, Marisol Bay', description: '', opportunity_type: 'community_manager', city_slug: 'sample' },
    { id: 'sample-opp-2', title: 'Vegan Explorer, Marisol Bay', description: '', opportunity_type: 'vegan_explorer', city_slug: 'sample' },
    { id: 'sample-opp-3', title: 'Festival Crew: Plant-Based Weekend', description: 'Help run the info booth at the Plant-Based Weekend on the Bay and earn points for every shift.', opportunity_type: 'event_volunteer', city_slug: 'sample' },
    { id: 'sample-opp-4', title: 'Event Host, Port Marisol', description: 'Host a monthly meetup at a Port Marisol restaurant. We bring the members and the flyer.', opportunity_type: 'event_host', city_slug: 'sample' }
  ];
  var REWARDS = [
    { id: 'sample-rw-1', name: 'Cold brew at Green Leaf Kitchen', description: 'A large cold brew on us.', points_price: 400, image_url: IMG + 'm-coldbrew.webp', stock_quantity: 40 },
    { id: 'sample-rw-2', name: 'A loaf from Saltwater Bakehouse', description: 'Any loaf from the morning bake.', points_price: 650, image_url: IMG + 'm-bananabread.webp', stock_quantity: 25 },
    { id: 'sample-rw-3', name: 'Festival VIP pass', description: 'Skip the line at the Plant-Based Weekend on the Bay.', points_price: 1500, image_url: IMG + 's-outside-day.webp', stock_quantity: 12 }
  ];
  var NONPROFITS = [{ id: 'sample-np-1', name: 'Bay Paws Sanctuary', description: 'A sample sanctuary caring for rescued farm animals in Marisol Bay.', website: '' }];
  var LEADERS = ['Sam R.', 'Maria L.', 'Andre T.', 'Priya K.', 'Jordan B.', 'Nia H.', 'Carlos R.', 'Jess T.'].map(function (n, i) {
    return { rank: i + 1, name: n, initials: n.charAt(0) + n.split(' ')[1].charAt(0), color: ['#1f5f22', '#0e7490', '#7c2d12', '#6b21a8'][i % 4], location: ['Marisol Bay', 'Port Marisol', 'Marisol Beach', 'Seagrape Key'][i % 4], points: 9400 - i * 870 };
  });

  // ---- The billboard: the presenting sponsor's 300 x 600, drawn as text on a solid plate (no picture, no real brand) -------------
  var AD = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600" viewBox="0 0 300 600">' +
    '<rect width="300" height="600" fill="#0b4f6c"/><circle cx="150" cy="250" r="88" fill="#ffd166"/><rect y="300" width="300" height="300" fill="#08394e"/>' +
    '<path d="M0 312 Q75 290 150 312 T300 312 V330 H0Z" fill="#1d7ea3"/><path d="M0 346 Q75 324 150 346 T300 346 V362 H0Z" fill="#14678a"/>' +
    '<text x="150" y="70" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-size="13" font-weight="800" letter-spacing="3" fill="#ffd166">VISIT</text>' +
    '<text x="150" y="108" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-size="34" font-weight="900" fill="#ffffff">Marisol Bay</text>' +
    '<text x="150" y="420" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-size="21" font-weight="900" fill="#ffffff">A plant-based</text>' +
    '<text x="150" y="448" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-size="21" font-weight="900" fill="#ffffff">weekend on the bay</text>' +
    '<rect x="70" y="482" width="160" height="44" rx="6" fill="#ffd166"/><text x="150" y="510" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-size="13" font-weight="800" letter-spacing="1" fill="#08394e">PLAN YOUR TRIP</text>' +
    '<text x="150" y="575" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-size="10" font-weight="800" letter-spacing="2" fill="#9cc9db">SAMPLE AD</text></svg>');

  // ---- The Board and Bounties, drawn here in place of the live pages hub.html frames ------------------------------------------
  var BOUNTIES = [
    [50, 'Is it still open? Three cafes on Marisol Beach', 'Visit, take a photo of the door and the hours, and confirm each is open.', '3 jobs open'],
    [75, 'Menu photos at the Plant-Based Weekend', 'Photograph five vendor menus at Bayfront Park for the Directory.', '5 jobs open'],
    [40, 'Check in at a Bay Brunch Trail stop', 'Visit a trail stop, scan the card at the register and leave a shout-out.', '6 jobs open'],
    [100, 'Film a 30-second tour of Harbor Lights Pizza', 'A short vertical clip for the Directory listing, with the owner\'s okay.', '1 job open']
  ];
  var BOARD = [
    ['Jobs', 'Saltwater Bakehouse is hiring a weekend baker', 'Early mornings, Saturday and Sunday. Bread experience helps; they will teach the rest.', 12],
    ['Rescues', 'Bay Paws Sanctuary needs fosters for two goats', 'A fenced yard and a few weeks. The sanctuary covers food and vet care.', 9],
    ['Classifieds', 'Selling a two-burner market stand, barely used', 'Perfect for a pop-up at the Bayfront Greens Market. Pick up in Port Marisol.', 4],
    ['Conversations', 'Best Vegan brunch on Seagrape Key?', 'Visiting for the Plant-Based Weekend and staying an extra day. Where should we eat?', 27]
  ];
  function rows(list, side, label) {
    return '<div class="events-list" style="padding:22px 22px 0">' + list.map(function (r) {
      return '<article class="event-row"><div class="event-date-col' + (side === 'board' ? ' orange' : '') + '" aria-hidden="true"><span class="event-day" style="font-size:' + (side === 'board' ? '18' : '24') + 'px">' + (side === 'board' ? r[3] : r[0]) + '</span><span class="event-mon">' + (side === 'board' ? 'Replies' : 'Points') + '</span></div>' +
        '<div class="event-body"><p class="event-type-badge' + (side === 'board' ? ' orange' : '') + '">' + esc(side === 'board' ? r[0] : r[3]) + '</p><h3 class="event-name">' + esc(r[1]) + '</h3>' +
        '<div class="event-details"><span>' + esc(r[2]) + '</span></div></div>' +
        '<div class="event-cta-col"><a href="#sample-' + side + '" class="btn-rsvp">' + esc(label) + '</a></div></article>';
    }).join('') + '</div>';
  }

  window.VE_SAMPLE_COMMUNITY = {
    listings: LISTINGS, events: EVENTS, posts: POSTS, stories: STORIES, dishes: DISHES,
    frames: { bounties: function () { return rows(BOUNTIES, 'bounties', 'See jobs'); }, board: function () { return rows(BOARD, 'board', 'Open'); } }
  };

  // ---- The sponsor's benefits in place and its campaign card (hub.html renderSponsors reads VE_HUBS[].sponsors.showcase) --------
  if (window.VE_SAMPLE_HUB && window.VE_SAMPLE_HUB.sponsors) window.VE_SAMPLE_HUB.sponsors.showcase = {
    benefitsTitle: 'What Visit Marisol Bay gets, and where it shows',
    benefits: [
      { name: 'Name and logo on the hub', where: 'The Overview leads with the sponsors, right under the community\'s card.', tab: 'overview', anchor: 'hub-ov-sponsors' },
      { name: 'A sponsor story', where: 'Featured stories under the Daily Pulse: "A plant-based weekend on the bay".', tab: 'news', anchor: 'hub-stories' },
      { name: 'A Daily Pulse feature', where: 'Today\'s Marisol Bay topic is the sponsor\'s festival, with the conversation around it.', tab: 'news', anchor: 'hub-pulse-grid' },
      { name: 'The hub\'s billboard', where: 'The tall 300 x 600 beside every section of the hub.', tab: 'news', anchor: 'hub-ad-rail' },
      { name: 'Its festival on the calendar', where: 'Plant-Based Weekend on the Bay, presented by Visit Marisol Bay, at the top of Events.', tab: 'events', anchor: 'hub-events-list' },
      { name: 'Tracked links and a quarterly report', where: 'Every link we post for the sponsor is tracked; the results are below and in a report each quarter.', tab: 'sponsors', anchor: 'hub-sponsor-campaign' },
      { name: 'Guide placement', where: 'The community\'s Guide points visitors to the sponsor\'s picks when they ask what to do in Marisol Bay.', status: 'coming' },
      { name: 'Find Visit Marisol Bay at our booth in Atlanta', where: 'The sponsor at our booth in a feeder city, where its next visitors live.', status: 'coming' }
    ],
    campaign: { title: 'Your campaign: Visit Marisol Bay', sub: 'What the presenting sponsor sees for this quarter. Every number here is made up for the sample.', tag: 'Sample numbers',
      nums: [{ v: '2,486', label: 'Tracked link clicks', note: 'Up 18% on last quarter' }, { v: '318', label: 'Check-ins at featured places', note: 'From the Bay Brunch Trail' },
        { v: '4,120', label: 'Sponsor story reads', note: 'Two stories this quarter' }, { v: '38,900', label: 'Billboard views', note: 'Across every section' }],
      report: { label: 'Open the quarterly report', href: '#sample-report' } },
    cta: { text: 'This is a sample. A tourism bureau, a chamber or a local business can present its own community for a year.', label: 'Talk to us', href: '/contact' }
  };

  // ---- 1. The calls ----------------------------------------------------------------------------------------------------------
  var realFetch = window.fetch.bind(window);
  function json(data) { return Promise.resolve(new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })); }
  function rest(table, q) {
    if (table === 'listings') {
      if (/status=eq\.closed/.test(q) || /offset=[1-9]/.test(q)) return [];
      if (/select=address_city/.test(q)) return LISTINGS.filter(function (l) { return l.address_city; }).map(function (l) { return { address_city: l.address_city }; });
      if (/vote_count=gt\.0/.test(q)) return LISTINGS.slice().sort(function (a, b) { return b.vote_count - a.vote_count; });
      var m = q.match(/slug=(?:in\.\(([^)]*)\)|eq\.([^&]*))/);
      if (m) { var want = decodeURIComponent(m[1] || m[2]).split(','); return LISTINGS.filter(function (l) { return want.indexOf(l.slug) >= 0; }); }
      return LISTINGS;
    }
    if (table === 'events') return EVENTS;
    if (table === 've_community_news') return STORIES;
    if (table === 'opportunities') return OPPS;
    if (table === 'store_products') return REWARDS;
    if (table === 'registered_nonprofits') return NONPROFITS;
    return [];
  }
  var FN = {
    've-votes': function (b) { if (b.action === 'chapter_stats') return { chapters: [STATS] }; if (b.action === 'chapter_today') return { next: {} }; return null; },
    've-board': function (b) { return b.action === 'list' ? { posts: POSTS } : null; },
    've-signature-dishes': function (b) { return b.action === 'top' ? { dishes: DISHES } : null; },
    've-hunt': function (b) { return b.action === 'current' ? HUNT : null; },
    'ad-resolve': function () { return { slots: [{ slot_id: 've-sample-hub-skyscraper', image_url: AD, link_url: '#sample-ad' }] }; },
    've-rewards': function (b, q) { return q.get('action') === 'leaderboard' ? { ok: true, leaderboard: LEADERS } : null; }
  };
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (url.indexOf(SB) !== 0) return realFetch(input, init);
    var path = url.slice(SB.length), qi = path.indexOf('?'), q = qi >= 0 ? path.slice(qi + 1) : '', base = qi >= 0 ? path.slice(0, qi) : path;
    if (base.indexOf('/rest/v1/') === 0) {
      var table = base.slice(9);
      // The listing and the sign-in calls the hub does not make for its sections go through; everything the hub draws is answered here.
      if (['listings', 'events', 've_community_news', 've_pulse_city_tags', 'opportunities', 'store_products', 'registered_nonprofits', 've_site_settings'].indexOf(table) >= 0) return json(rest(table, decodeURIComponent(q)));
      return realFetch(input, init);
    }
    if (base.indexOf('/functions/v1/') === 0) {
      var fn = base.slice(14).split('/')[0], h = FN[fn];
      if (h) {
        var body = {}; try { body = init && init.body ? JSON.parse(init.body) : {}; } catch (e) {}
        var out = h(body, new URLSearchParams(q));
        if (out) return json(out);
        toast('This is the sample community: nothing is saved.');
        return json({ ok: false, sample: true, error: 'sample' });
      }
    }
    return realFetch(input, init);
  };

  // ---- 2. The clicks -----------------------------------------------------------------------------------------------------------
  var SAY = [
    [/^#sample-sponsor/, 'Sample: a sponsor\'s button opens its own site through a tracked link, so every click is counted.'],
    [/^#sample-ad/, 'Sample: the billboard opens the sponsor\'s site through a tracked link, and the click shows in its results.'],
    [/^#sample-rsvp/, 'Sample: RSVP opens the event\'s own page. Nothing is saved in the sample.'],
    [/^#sample-report/, 'Sample: the quarterly report goes to the sponsor each quarter, with these numbers and where they came from.'],
    [/^#sample-bounties/, 'Sample: each bounty opens its jobs. Members earn points for the work.'],
    [/^#sample-board/, 'Sample: each post opens its conversation on the Community Board.'],
    [/^\/pulse\?/, 'Sample: each Daily Pulse topic opens its conversation on the Community Board.'],
    [/^\/news\/local/, 'Sample: the sponsor story opens as a full article.'],
    [/^\/events\?/, 'Sample: in a real community this opens the event or the event form.'],
    [/^\/passport\/challenge/, 'Sample: the Passport Challenge map shows every stop and its offer.'],
    [/^\/bounties/, 'Sample: this opens the community\'s bounties.'],
    [/^\/directory\//, 'Sample: this is a made-up listing. Green Leaf Kitchen opens the full sample business page.']
  ];
  function openListing(slug) { if (slug === 'sample') { location.href = '/business/sample'; return; } toast(SAY[SAY.length - 1][1]); }
  document.addEventListener('click', function (e) {
    var t = e.target; if (!t.closest) return;
    if (!t.closest('#hub-content-grid, #hero-section')) return;
    var stop = function () { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); };
    if (t.closest('.vote-btn, .vrd-save, [data-vch-vote], [data-vch-save], [data-hov-vote], .hub-opp-apply-btn, [data-redeem-id], [data-donate-id]')) { stop(); toast('Sample: votes, saves and applications are not counted in the sample community.'); return; }
    var a = t.closest('a[href]'), h = a ? a.getAttribute('href') : '';
    var card = t.closest('.rank-card[data-slug]');
    if (card && !a) { stop(); openListing(card.getAttribute('data-slug')); return; }
    if (!a) return;
    var d = h.match(/^\/directory\/([a-z0-9-]+)$/);
    if (d) { stop(); openListing(d[1]); return; }
    for (var i = 0; i < SAY.length; i++) if (SAY[i][0].test(h)) { stop(); toast(SAY[i][1]); return; }
  }, true);

  // ---- 3. The stamp, and a toast for what the sample does not do -----------------------------------------------------------
  var tt;
  function toast(msg) {
    var el = document.getElementById('ve-sample-toast'); if (!el) return;
    el.textContent = msg; el.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { el.classList.remove('on'); }, 3600);
  }
  function stamp() {
    if (document.getElementById('ve-sample-stamp')) return;
    var st = document.createElement('style');
    st.textContent = '#ve-sample-stamp{position:fixed;left:12px;bottom:12px;z-index:2147483000;display:flex;align-items:center;gap:8px;background:#9a3412;color:#fff;font:800 11px/1 Montserrat,sans-serif;letter-spacing:.14em;text-transform:uppercase;padding:9px 12px;border-radius:6px;box-shadow:0 6px 18px rgba(0,0,0,.25)}' +
      '#ve-sample-stamp span{font-weight:600;letter-spacing:0;text-transform:none;font-size:12px;opacity:.9}' +
      '#ve-sample-toast{position:fixed;left:50%;bottom:64px;transform:translateX(-50%) translateY(20px);opacity:0;transition:all .2s;z-index:2147483001;background:#1a1a1a;color:#fff;font:600 13px/1.4 Montserrat,sans-serif;padding:11px 16px;border-radius:6px;max-width:calc(100% - 32px);pointer-events:none}' +
      '#ve-sample-toast.on{opacity:1;transform:translateX(-50%)}' +
      '@media (max-width:600px){#ve-sample-stamp span{display:none}}';
    document.head.appendChild(st);
    var s = document.createElement('div'); s.id = 've-sample-stamp'; s.setAttribute('role', 'note');
    s.innerHTML = 'Sample <span>Marisol Bay and its sponsors are made up. Nothing here is real or saved.</span>';
    document.body.appendChild(s);
    var t = document.createElement('div'); t.id = 've-sample-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', stamp); else stamp();
})();
