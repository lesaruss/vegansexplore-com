/* Illustrative listing data for the Campaign Engine demo (playbook ve-campaign-engine).
 * Fieldhouse Protein is an invented brand. This file feeds the real Directory listing page
 * (/directory/listing.html) through its demo mode, so the demo is the actual listing template
 * with a campaign running on it. Nothing here is written to the database.
 * The campaign is shown at week 6 of 10; numbers match the sponsor dashboard's week-6 view.
 */
window.VE_DEMO = {
  label: 'Fieldhouse Protein is an invented brand, shown on the real Directory listing page with a campaign running on it. The numbers are realistic examples.',
  reportUrl: '/campaign-engine/fieldhouse-protein/report',
  dashboardUrl: '/campaign-engine/fieldhouse-protein/dashboard',
  hubUrl: '/campaign-engine',

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
    gallery_urls: []
  },

  // Products use the listing's Menu tab (ve_menu_items shape), shown as "Products" for Food Brands.
  menu: [
    { category: 'Protein bars', name: 'Peanut Butter Sprint', description: 'The original. Roasted peanut butter, pumpkin seeds and a soft-baked middle that holds together in a gym bag.', price_display: '$2.99 · $32.99 for 12', is_featured: true, buy: '/go/fh-store', nutrition: 'bar' },
    { category: 'Protein bars', name: 'Cocoa Recovery', description: 'Dark cocoa and sea salt with tart cherry, built for the hour after a hard session.', price_display: '$2.99 · $32.99 for 12', is_featured: true, buy: '/go/fh-store', nutrition: 'bar' },
    { category: 'Protein bars', name: 'Salted Maple Oat', description: 'Toasted oats, maple and a pinch of salt. Breakfast for early runs.', price_display: '$2.99 · $32.99 for 12', is_gluten_free: true, buy: '/go/fh-store', nutrition: 'bar' },
    { category: 'Protein bars', name: 'Lemon Seed Crunch', description: 'Bright lemon with a pumpkin and sunflower seed crunch. The lightest bar in the line.', price_display: '$2.99 · $32.99 for 12', is_gluten_free: true, buy: '/go/fh-store', nutrition: 'bar' },
    { category: 'Ready-to-drink shakes', name: 'Chocolate', description: '25g of pea and pumpkin-seed protein, cold from the fridge. The best seller at run-club pickups.', price_display: '$3.99 · $44.99 for 12', is_featured: true, buy: '/go/fh-store', nutrition: 'shake' },
    { category: 'Ready-to-drink shakes', name: 'Vanilla Bean', description: 'Smooth vanilla that works on its own or blended with fruit.', price_display: '$3.99 · $44.99 for 12', buy: '/go/fh-store', nutrition: 'shake' },
    { category: 'Ready-to-drink shakes', name: 'Cold Brew', description: 'Protein and real cold brew coffee in one bottle, for mornings before the gym.', price_display: '$3.99 · $44.99 for 12', buy: '/go/fh-store', nutrition: 'shake' }
  ],
  nutrition: {
    bar: 'Per bar (60g): 230 calories · 20g protein · 9g fat (1.5g saturated) · 22g carbs · 7g fiber · 6g sugars (5g added) · 190mg sodium. Vegan, gluten-free, soy-free. Supplied and approved by Fieldhouse.',
    shake: 'Per bottle (330ml): 170 calories · 25g protein · 5g fat (1g saturated) · 9g carbs · 3g fiber · 4g sugars (4g added) · 220mg sodium · 30% calcium. Vegan, soy-free. Supplied and approved by Fieldhouse.'
  },

  videos: [
    { t: 'Saturday long run, then a shake', m: 'Maya R. · Atlanta · Creator collab #ad', len: '0:58', grad: '#1b6b4a,#2fa36f', kind: 'Creator collab' },
    { t: 'Meal prep for a training week', m: 'Dani M. · South Florida · Creator collab #ad', len: '1:42', grad: '#b0562a,#e08a4f', kind: 'Creator collab' },
    { t: 'Run-club check-in at sunrise', m: 'Priya S. · DMV · Creator collab #ad', len: '0:45', grad: '#4b3a8a,#7a66c4', kind: 'Creator collab' },
    { t: 'Trail day, three bars deep', m: 'Jordan K. · Atlanta · Creator collab #ad', len: '0:52', grad: '#2f6a3a,#4f9a5e', kind: 'Creator collab' },
    { t: 'Strength day with Cocoa Recovery', m: 'Andre L. · South Florida · Creator collab #ad', len: '1:05', grad: '#6b3b1f,#a0582b', kind: 'Creator collab' },
    { t: 'The locker room where it started', m: 'Fieldhouse Protein · Brand film', len: '2:14', grad: '#1d2f4f,#3d6aa8', kind: 'Brand film' }
  ],

  pulse: [
    { type: 'update', is_pinned: true, published_at: '2027-04-13', headline: 'Week 6: Atlanta run clubs lead the challenge',
      subhead: 'More than half of all run-club check-ins this season have come from Atlanta.',
      body: 'Atlanta run clubs are carrying "How do you Fieldhouse?" into its second half. This week we are adding two new Atlanta creator posts and a run-club bounty worth double points on Saturday mornings.\n\nSouth Florida and the DMV: the shake post and meal-prep video tasks are still open, and the city leaderboards reset the top 10 prize count at week 8.' },
    { type: 'event', published_at: '2027-04-06', headline: 'Festival recap: 9,800 samples in two days',
      subhead: 'Thank you to everyone who stopped by the booth in South Florida.',
      body: 'Our first festival booth with Vegans Explore handed out 9,800 samples over two days. 980 members checked in with the Passport for 40 points each, and 24 members worked volunteer shifts.\n\nIf you missed us, the Chocolate shake is at every run-club pickup spot on the map.' },
    { type: 'announcement', published_at: '2027-03-02', headline: '"How do you Fieldhouse?" starts Monday',
      subhead: 'Ten weeks, three cities, five ways to earn points.',
      body: 'Show us how plant protein fits your training: a post-workout shake, a run-club check-in, a meal-prep video. Join from this listing, pick your tasks, and earn points toward sampler boxes, a free Passport and festival VIP passes.\n\nEvery post made for points is labeled #ad.' }
  ],

  campaign: {
    title: 'How do you Fieldhouse?',
    week: 6, weeks: 10,
    level: 'Season Sponsor',
    cities: ['South Florida', 'Atlanta', 'DMV'],
    dates: 'Mar 2 to May 10',
    story: 'Show how plant protein fits your training: a post-workout shake, a run-club check-in or a meal-prep video. Join here, pick the tasks that fit your routine, and earn points toward real perks. Every post made for points is labeled #ad.',
    tasks: [
      { id: 'run', title: 'Run-club check-in', points: 30, desc: 'Check in at a partner run club with the Passport.', count: 1080 },
      { id: 'shake', title: 'Post-workout shake post', points: 50, desc: 'Post your post-workout shake, labeled #ad.', count: 205 },
      { id: 'friend', title: 'Bring a friend', points: 75, desc: 'A friend joins Vegans Explore through your link.', count: 180 },
      { id: 'prep', title: 'Meal-prep video', points: 100, desc: 'A training-week meal prep with Fieldhouse, labeled #ad.', count: 55 },
      { id: 'booth', title: 'Visit the festival booth', points: 40, desc: 'Checked in at the South Florida festival booth.', count: 980, ended: true }
    ],
    perks: [
      { pts: 500, label: 'Fieldhouse sampler box' },
      { pts: 800, label: 'A free Passport' },
      { pts: 1500, label: 'Festival VIP pass' }
    ],
    leaderboard: {
      'Atlanta': [['Tasha W.', 1240], ['Devon K.', 1105], ['Luis M.', 980], ['Ari P.', 940], ['Kim B.', 905]],
      'South Florida': [['Nia H.', 1180], ['Carlos R.', 1060], ['Jess T.', 990], ['Omar F.', 910], ['Bri L.', 870]],
      'DMV': [['Sam O.', 960], ['Rae J.', 880], ['Theo N.', 815], ['Ivy C.', 760], ['Marc D.', 720]]
    },
    creators: [
      { n: 'Maya R.', c: 'Atlanta', bg: '#1b6b4a' }, { n: 'Jordan K.', c: 'Atlanta', bg: '#2f8a5f' },
      { n: 'Dani M.', c: 'South Florida', bg: '#b0562a' }, { n: 'Andre L.', c: 'South Florida', bg: '#8a4b1f' },
      { n: 'Priya S.', c: 'DMV', bg: '#4b3a8a' }, { n: 'Marcus T.', c: 'DMV', bg: '#6a58b0' }
    ],
    events: [
      { when: 'Every Saturday', day: 'SAT', title: 'Atlanta run-club shakeout', place: 'Partner run clubs, Atlanta', desc: 'Cold Chocolate shakes at the finish. Check in with the Passport for 30 points, double this week.', status: 'Coming up' },
      { when: 'Apr 25', day: '25', title: 'Meal-prep workshop with Priya S.', place: 'Community kitchen, Washington DC', desc: 'Build a training week of plant-based meals. Members only, 30 seats.', status: 'Coming up' },
      { when: 'Apr 4 to 5', day: '4', title: 'South Florida spring festival booth', place: 'South Florida', desc: '9,800 samples, 980 Passport check-ins and 24 volunteer shifts.', status: 'Happened' }
    ],
    // What the brand sees on its own listing (season to date, week 6).
    owner: {
      tiles: [['3,800', 'retailer clicks'], ['890', 'members in the challenge'], ['2,500', 'tasks completed'], ['260', 'posts labeled #ad'], ['$35,300', 'placed of $51,000']],
      note: 'Week 6: we moved $3,000 from the DMV ad rail to Atlanta, where run-club check-ins are turning into retailer clicks at twice the rate of the other cities.'
    }
  }
};
