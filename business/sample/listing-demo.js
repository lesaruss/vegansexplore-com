/* The sample business (Sean, 2026-10-27: "a fictitious listing that shows like the full soup to nuts page... so that way
 * members can see what it looks like to have the dashboard without it actually being a real person"). Green Leaf Kitchen is
 * an invented restaurant, the same sample business /claim's previews use. This file feeds the real Directory listing page
 * (/directory/listing.html) through its demo mode at /business/sample: the visitor's page, and with The owner, the real
 * business dashboard (/public/ve-partner-dashboard.js) on the numbers below. Nothing here is read from or written to the
 * database. Its logo and photos (business/sample/img/, made in Higgsfield 2026-10-28) are illustrative, like the restaurant.
 */
(function () {
  var NAMES = ['Sam R.', 'Maria L.', 'Andre T.', 'Priya K.', 'Jordan B.', 'Nia H.', 'Carlos R.', 'Jess T.', 'Omar F.', 'Bri L.', 'Theo N.', 'Ivy C.'];
  // The same numbers every visit: a small seeded random, so the sample never jumps around.
  function rnd(seed) { var x = Math.sin(seed) * 10000; return x - Math.floor(x); }
  function ymd(t) { return new Date(t).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  function daily(days, offset) {
    var out = [];
    for (var i = days - 1; i >= 0; i--) {
      var t = Date.now() - (i + offset) * 864e5, dow = new Date(t).getDay(), k = Math.floor(t / 864e5);
      var weekend = dow === 0 || dow === 5 || dow === 6;
      var views = Math.round((weekend ? 34 : 21) + rnd(k) * 14), visitors = Math.round(views * (0.62 + rnd(k + 7) * 0.12));
      out.push({ day: ymd(t), views: views, visitors: visitors, actions: Math.round(views * (0.22 + rnd(k + 3) * 0.1)) });
    }
    return out;
  }
  function sum(rows, k) { return rows.reduce(function (a, r) { return a + r[k]; }, 0); }
  function stats(days) {
    var now = daily(days, 0), before = daily(days, days), views = sum(now, 'views'), acts = sum(now, 'actions');
    var split = { call: 0.16, directions: 0.27, website: 0.14, order: 0.17, menu: 0.15, photos: 0.03, social: 0.08 }, totals = { view: views };
    Object.keys(split).forEach(function (k) { totals[k] = Math.round(acts * split[k]); });
    return { days: days, since: '2026-03-02T15:00:00Z', totals: totals, visitors: Math.round(sum(now, 'visitors') * 0.83),
      previous: { views: sum(before, 'views'), visitors: Math.round(sum(before, 'visitors') * 0.83), actions: sum(before, 'actions') },
      daily: now, via: { page: Math.round(views * 0.71), guide: Math.round(views * 0.18), link: Math.round(views * 0.11) } };
  }
  function checkins() {
    var rows = [];
    for (var i = 0; i < 46; i++) {
      var r = rnd(i + 40), who = Math.floor(Math.pow(r, 1.8) * NAMES.length);
      var at = Date.now() - Math.floor(rnd(i + 90) * 330) * 864e5 - Math.floor(rnd(i + 5) * 9 + 11) * 36e5;
      rows.push({ at: new Date(at).toISOString(), member_id: 'sample-' + who, name: NAMES[who] });
    }
    rows.sort(function (a, b) { return Date.parse(b.at) - Date.parse(a.at); });
    // Counts only, the shape ve-claims sends (Sean, 2026-10-28: the business never sees who checked in).
    var since30 = Date.now() - 30 * 864e5, per = {};
    rows.forEach(function (x) { per[x.member_id] = (per[x.member_id] || 0) + 1; });
    var monday = function (d) { var x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.toISOString().slice(0, 10); };
    var weeks = {}; for (var w = 11; w >= 0; w--) weeks[monday(Date.now() - w * 7 * 864e5)] = 0;
    rows.forEach(function (x) { var k = monday(Date.parse(x.at)); if (k in weeks) weeks[k]++; });
    var people = Object.keys(per).length;
    return { verified: true, total: rows.length, last_30_days: rows.filter(function (x) { return Date.parse(x.at) > since30; }).length, people: people,
      returning: Object.keys(per).filter(function (k) { return per[k] > 1; }).length, last_at: rows[0].at,
      by_week: Object.keys(weeks).map(function (k) { return { week: k, n: weeks[k] }; }),
      by_chapter: [{ chapter: 'south-florida', people: Math.round(people * 0.7) }, { chapter: 'central-florida', people: Math.round(people * 0.15) }, { chapter: 'none', people: people - Math.round(people * 0.7) - Math.round(people * 0.15) }] };
  }

  var MENU = [
    { id: 's1', category: 'Breakfast, all day', name: 'Sunrise Plate', description: 'Tofu scramble, crispy potatoes, sauteed greens and sourdough toast.', price_display: '$15', is_vegan: true, is_featured: true, is_available: true, sort_order: 1 },
    { id: 's2', category: 'Breakfast, all day', name: 'Banana Oat Pancakes', description: 'Three pancakes with maple, cinnamon cashew cream and berries.', price_display: '$13', is_vegan: true, is_available: true, sort_order: 2 },
    { id: 's3', category: 'Bowls', name: 'Green Goddess Bowl', description: 'Quinoa, roasted broccoli, chickpeas, avocado and herb tahini.', price_display: '$16', is_vegan: true, is_gluten_free: true, is_featured: true, is_available: true, sort_order: 3 },
    { id: 's4', category: 'Bowls', name: 'Jerk Jackfruit Bowl', description: 'Jerk jackfruit, coconut rice and beans, plantains and mango slaw.', price_display: '$17', is_vegan: true, is_gluten_free: true, is_available: true, sort_order: 4 },
    { id: 's5', category: 'Sandwiches', name: 'Smoky Tempeh Club', description: 'Smoked tempeh, lettuce, tomato and chipotle aioli on toasted sourdough.', price_display: '$15', is_vegan: true, is_available: true, sort_order: 5 },
    { id: 's6', category: 'Sandwiches', name: 'Buffalo Cauliflower Wrap', description: 'Crispy buffalo cauliflower, ranch, celery and greens in a spinach wrap.', price_display: '$14', is_vegan: true, is_available: true, sort_order: 6 },
    { id: 's7', category: 'Drinks', name: 'Oat Milk Latte', description: 'Espresso and steamed oat milk. Hot or iced.', price_display: '$5', is_vegan: true, is_gluten_free: true, is_available: true, sort_order: 7 },
    { id: 's8', category: 'Drinks', name: 'Green Machine Smoothie', description: 'Spinach, mango, banana, ginger and coconut water.', price_display: '$9', is_vegan: true, is_gluten_free: true, is_available: true, sort_order: 8 },
    { id: 's9', category: 'Sweets', name: 'Key Lime Cheesecake', description: 'Cashew key lime cheesecake on a graham crust.', price_display: '$8', is_vegan: true, is_available: true, sort_order: 9 }
  ];

  var D = {
    ok: true,
    listing: { id: 'sample-green-leaf-kitchen', name: 'Green Leaf Kitchen', slug: 'sample', category: 'Restaurants', food: true, hub: 'south-florida', claim_status: 'verified' },
    open: true, owner: true, admin: false, member_active: true,
    checklist: [{ k: 'logo', done: true }, { k: 'description', done: true }, { k: 'photos', done: true }, { k: 'hours', done: true }, { k: 'menu', done: true }, { k: 'audit', done: false }],
    cards: [
      { kind: 'new', title: 'Check-ins are live', body: 'Members check in from your page when they visit. See how many come back under Check-ins.', cta_label: 'See check-ins', cta_url: '?pd=checkins' },
      { kind: 'offer', title: 'Front Row Start', body: 'Become a Partner before January 1: nothing today, the rest of 2026 on us, then $111 a quarter.', cta_label: 'See the plan', cta_url: '?pd=plan' },
      { kind: 'tip', title: 'Menus get opened first', body: 'Keep your menu current and mark your favorites as Featured.', cta_label: 'Open your menu', cta_url: '?pd=menu' }
    ],
    menu_count: MENU.length,
    plan: null,
    ads: [{ name: 'Weekend brunch', status: 'active', start_date: '2026-10-01', end_date: '2026-11-30', creative_url: null, impressions: 8420, clicks: 213 }],
    spots: [
      { page_slug: '/pulse', page_name: 'The Daily Pulse', views: 18000, slots: 1 },
      { page_slug: '/directory', page_name: 'The Directory', views: 14500, slots: 2 },
      { page_slug: '/communities/south-florida', page_name: 'South Florida community', views: 9200, slots: 1 },
      { page_slug: '/events', page_name: 'Events', views: 6100, slots: 1 }
    ],
    audits: [], orders: [],
    // The listing check, shown two ways on the sample (Sean, 2026-11-01: "one that has passed the audit and one that hasn't"):
    // Green Leaf Kitchen passes everything; Corner Sprout Cafe is made up too, a place that has gone quiet online.
    healthSamples: [
      { tab: 'Green Leaf Kitchen: passes', name: 'Green Leaf Kitchen', checked_at: new Date(Date.now() - 3 * 864e5).toISOString(), state: 'live',
        next: 'Nothing to fix. We check again next month, and you see it here the moment anything changes.',
        checks: [
          { area: 'Google', label: 'Open on Google Maps', status: 'pass', found: 'Google lists it as open, with hours for every day.' },
          { area: 'Google', label: 'Google profile complete', status: 'pass', found: 'Phone, hours, website, 42 photos and 318 reviews (4.8 stars).' },
          { area: 'Website', label: 'Website opens', status: 'pass', found: 'greenleafkitchen.com opened in 1.2 seconds.' },
          { area: 'Website', label: 'Secure (https)', status: 'pass', found: 'A working security certificate; every page opens with https.' },
          { area: 'Website', label: 'Menu online', status: 'pass', found: 'A menu page with prices, linked from the home page.' },
          { area: 'Instagram', label: 'Posting on Instagram', status: 'pass', found: '@greenleafkitchen posted 2 days ago, 11 times in the last 30 days.' },
          { area: 'Your Directory page', label: 'Hours, photos and story', status: 'pass', found: 'Logo, four photos, hours and a full description.' },
          { area: 'Your Directory page', label: 'Members are visiting', status: 'pass', found: '23 member check-ins in the last 30 days.' }
        ] },
      { tab: 'Corner Sprout Cafe: needs work', name: 'Corner Sprout Cafe (made up)', checked_at: new Date(Date.now() - 1 * 864e5).toISOString(), state: 'review',
        next: 'It is in review, off the public Directory for now. A member visit is posted to see if it is still open. Fix the website or post on Instagram and it comes back on its own at the next weekly check; if the visit finds it open, it comes back right away and our team reaches out to help.',
        checks: [
          { area: 'Google', label: 'Open on Google Maps', status: 'pass', found: 'Google still lists it as open.' },
          { area: 'Google', label: 'Google profile complete', status: 'warn', found: 'No hours on Google and 4 photos; the newest review is 14 months old.', fix: 'Add your hours and a few new photos to your Google profile.' },
          { area: 'Website', label: 'Website opens', status: 'flag', found: 'cornersproutcafe.com is parked: the domain is for sale.', fix: 'Renew the domain, or tell us your new website.' },
          { area: 'Website', label: 'Secure (https)', status: 'flag', found: 'No working security certificate.', fix: 'Any website host can switch on a free certificate.' },
          { area: 'Website', label: 'Menu online', status: 'flag', found: 'No menu we could find.', fix: 'Add your menu on your dashboard or link it.' },
          { area: 'Instagram', label: 'Posting on Instagram', status: 'flag', found: '@cornersproutcafe last posted 8 months ago.', fix: 'One post this week shows people you are open.' },
          { area: 'Your Directory page', label: 'Hours, photos and story', status: 'warn', found: 'No hours and one photo.', fix: 'Fill in Your page on this dashboard.' },
          { area: 'Your Directory page', label: 'Members are visiting', status: 'warn', found: 'No member check-ins in the last 60 days.' }
        ] }
    ],
    guides: [
      { slug: 'vegan-restaurant-guide', title: 'The Vegan Restaurant Guide', description: 'Your Google listing, website and social, checked and fixed in order, with Liz.', access_rule: 'points', owned: true },
      { slug: 'vegan-dairy-guide', title: 'The Vegan Dairy Guide', description: 'The brands, swaps and recipes members use to leave dairy behind, with Maya.', access_rule: 'points', owned: false }
    ],
    opportunities: [{ id: 'sample-role', title: 'Community Manager', opportunity_type: 'Gig work', commitment: 'A few hours a week', compensation: 'Paid as the community grows', city_slug: 'south-florida' }],
    interests: ['community-nights']
  };

  window.VE_DEMO = {
    business: true,
    tour: false,
    label: 'Green Leaf Kitchen is a made-up restaurant. Everything around it is the real page and the real business dashboard, so you can see what owners get.',
    listing: {
      id: 'sample-green-leaf-kitchen',
      slug: 'sample',
      name: 'Green Leaf Kitchen',
      initials: 'GL',
      color: '#1f5f22',
      category: 'Restaurants',
      vegan_status: 'fully_vegan',
      cuisines: ['american', 'caribbean'],
      tagline: 'A neighborhood Vegan kitchen: all-day breakfast, big bowls and good coffee.',
      description: 'Green Leaf Kitchen is a sample restaurant made up for this page. Picture a corner spot with twelve tables, a patio and a counter that opens at eight: all-day breakfast, big bowls, sandwiches on bread from the bakery down the street, and Key lime cheesecake that people drive across the county for. Everything on the menu is Vegan, and most of it can be made gluten-free.',
      website: 'https://example.com/green-leaf-kitchen',
      phone: '(954) 555-0142',
      address_street: '123 Sample Street',
      address_city: 'Fort Lauderdale',
      address_state: 'FL',
      address_zip: '33301',
      google_hours_json: { Monday: '8 AM to 3 PM', Tuesday: '8 AM to 3 PM', Wednesday: '8 AM to 3 PM', Thursday: '8 AM to 9 PM', Friday: '8 AM to 10 PM', Saturday: '9 AM to 10 PM', Sunday: '9 AM to 3 PM' },
      business_status: 'OPERATIONAL',
      claimed_by_member_id: 'sample',
      owner_member_id: 'sample',
      claim_status: 'verified',
      vote_count: 238,
      voter_count: 61,
      logo_url: '/business/sample/img/logo.jpg',
      logo_alt_text: 'Green Leaf Kitchen logo',
      gallery_urls: ['/business/sample/img/photo-1.jpg', '/business/sample/img/photo-2.jpg', '/business/sample/img/photo-3.jpg', '/business/sample/img/photo-4.jpg']
    },
    menu: MENU,
    // The business dashboard's server calls, answered here. Anything that would save says so instead.
    dashboard: function (body, toast) {
      var a = body && body.action;
      if (a === 'owner_dashboard') { var days = Math.min(365, Math.max(1, Number(body.days) || 30)); return Promise.resolve(Object.assign({}, D, { days: days, stats: stats(days), checkins: checkins() })); }
      if (a === 'menu_list') return Promise.resolve({ ok: true, items: MENU });
      toast('Sample dashboard: nothing is saved here. On your own page this goes live right away.');
      return Promise.resolve({ ok: true });
    }
  };
})();
