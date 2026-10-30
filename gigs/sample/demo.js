/* The sample Gig Board (Sean, 2026-10-30: "make up an influencer, make up their stats... examples of their images with
   products... an animated one so it doesn't look like we're trying to create a fake person"). /gigs/sample loads this file
   before /public/ve-gigs.js, which then draws the real board from it in demo mode: nothing here is a database row, nothing is
   sent, every brand is invented and marked Illustrative. Kai Monroe is drawn in our illustration style (gigs/sample/img/).
   Dates are counted from today so the sample never goes stale. */
(function () {
  var DAY = 864e5, now = Date.now();
  function at(days, hour) { var d = new Date(now + days * DAY); d.setHours(hour == null ? 23 : hour, hour == null ? 59 : 0, 0, 0); return d.toISOString(); }
  var IMG = '/gigs/sample/img/';

  var creator = {
    name: 'Kai Monroe', handle: '@kaieatsplants', avatar: IMG + 'kai-avatar.webp', city: 'South Florida',
    chapters: ['south-florida', 'central-florida'], level: 2, points: 3450, profile: 'creator',
    line: 'Vegan food and fitness, Miami. Easy plant-based meals, gym days and the spots worth the drive.',
    platforms: [
      { k: 'instagram', label: 'Instagram', followers: 8400, eng: 6.1 },
      { k: 'tiktok', label: 'TikTok', followers: 12900, eng: 8.4 },
      { k: 'youtube', label: 'YouTube', followers: 1150, eng: 4.2 }
    ],
    rates: [['A post', '$150'], ['A Reel or TikTok', '$250'], ['Hosting, a half day', '$400']],
    reliability: { booked: 7, delivered: 7, on_time: 7, first_try: 6, strikes: 0 },
    earned_cents: 132000, earned_points: 2350,
    results: [
      { gig: 'Wynwood restaurant crawl', posts: 3, clicks: 412, joins: 9, per_k: 49 },
      { gig: 'Oat-milk latte tour', posts: 2, clicks: 188, joins: 4, per_k: 22 },
      { gig: 'Night market recap', posts: 1, clicks: 141, joins: 3, per_k: 17 }
    ],
    board_per_k: 18,
    // The media kit (Sean, 2026-10-30: "it's essentially their media kits... she gets to be the prototype").
    tagline: 'Plant-based food and fitness for people who are busy, broke-ish and hungry.',
    cover: IMG + 'post-market.webp',
    pillars: [['Fast plant-based meals', '15-minute recipes from one pan'], ['Gym days', 'What a Vegan athlete eats around training'], ['Spots worth the drive', 'Honest reviews of Vegan places in South Florida']],
    audience: { women: 64, ages: [['18 to 24', 31], ['25 to 34', 46], ['35 to 44', 16], ['45 and up', 7]], cities: [['Miami', 38], ['Fort Lauderdale', 17], ['Orlando', 9], ['New York', 6]], vegan: 58 },
    brands: ['Fieldhouse Protein', 'Meadowline Oat', 'Crunchwell Snacks', 'Three Wynwood restaurants'],
    quotes: [['The Wynwood crawl brought in more people than any creator we have worked with this year.', 'A Wynwood restaurant owner (illustrative)'], ['On time, on brief, and the comments were full of people asking where to buy it.', 'Fieldhouse Protein (illustrative)']],
    kit_done: [['Photo and cover', true], ['A tagline and an about', true], ['Your platforms, with numbers', true], ['Three content pillars', true], ['Five pieces of your best work', true], ['Your audience: ages and cities', true], ['A partner quote', true], ['A short intro video', false]],
    portfolio: [
      { img: IMG + 'post-latte.webp', caption: 'Oat-milk latte tour, post 1 of 2', partner: 'Meadowline Oat (Illustrative)' },
      { img: IMG + 'post-protein.webp', caption: 'Post-workout shake, a sponsored Reel', partner: 'Fieldhouse Protein (Illustrative)' },
      { img: IMG + 'post-market.webp', caption: 'Vendor spotlight at the Sunday market', partner: 'Collaboration' },
      { img: IMG + 'post-kitchen.webp', caption: 'Recipe Reel: 15-minute creamy pasta', partner: 'Kai\'s own' },
      { img: IMG + 'post-event.webp', caption: 'Hosting the festival main stage', partner: 'Hosting gig' }
    ]
  };

  var gigs = [
    { id: 'g1', img: IMG + 'gig-g1.webp', title: 'Plant-protein launch: three Reels', partner: { name: 'Fieldhouse Protein', kind: 'Nutrition brand' }, kind: 'campaign',
      pay: { type: 'paid', cents: 45000, perk: 'Product for a month' }, mode: 'audition', chapters: ['south-florida'], posted: at(-1, 9), closes: at(5), spots: 3, applicants: 41,
      req: { min_followers: 5000, platforms: ['instagram', 'tiktok'], level: 2 },
      brief: 'Fieldhouse is launching its chocolate protein in South Florida. Three creators each make three short videos over two weeks: the first taste, a gym day, and a recipe. Your take, your voice; we send the talking points.',
      deliverables: ['3 Reels or TikToks, 30 to 60 seconds', 'Your tracked link in your bio for 14 days', 'Raw files for the brand to reuse for 90 days'],
      timeline: 'Product ships the week you are booked. Posts go live over two weeks.',
      audition: 'Record 30 seconds as if it were the first Reel: open with the hook you would use and show us how you talk to your audience. One take is fine.',
      asks: ['pitch', 'examples', 'audition', 'rate'] },
    { id: 'g2', img: IMG + 'gig-g2.webp', title: 'Oat-milk latte tour: two posts', partner: { name: 'Meadowline Oat', kind: 'Plant-based milk' }, kind: 'campaign',
      pay: { type: 'paid', cents: 25000 }, mode: 'apply', chapters: [], posted: at(-2, 11), closes: at(9), spots: 6, applicants: 58,
      req: { min_followers: 2500, platforms: ['instagram'] },
      brief: 'Visit two Vegan cafes in your city that pour Meadowline and post about your favorite drink at each. We pick the cafes with you.',
      deliverables: ['2 Instagram posts or Reels', 'Tag the cafe and the brand', 'Your tracked link in your bio for 7 days'],
      timeline: 'Within three weeks of booking.', asks: ['pitch', 'examples', 'rate'] },
    { id: 'g3', img: IMG + 'gig-g3.webp', title: 'Host the night market stage', partner: { name: 'Vegans Explore', kind: 'Our event' }, kind: 'hosting',
      pay: { type: 'perk', cents: 15000, perk: 'Two tickets and dinner' }, mode: 'audition', chapters: ['south-florida'], posted: at(0, 8), closes: at(12), spots: 1, applicants: 17,
      req: {},
      brief: 'Be the voice of the evening: open the night, introduce six vendors and run the giveaway. No following needed; we want someone warm on a microphone.',
      deliverables: ['Host from 6 to 9 PM', 'Two short videos from the night for our channels'],
      timeline: 'One evening, the date in the brief.', audition: 'Record 60 seconds introducing a vendor you love as if you were on stage.',
      asks: ['pitch', 'audition'] },
    { id: 'g4', img: IMG + 'gig-g4.webp', title: 'Wynwood restaurant crawl', partner: { name: 'Three Wynwood restaurants', kind: 'Collaboration' }, kind: 'collab',
      pay: { type: 'perk', perk: 'Dinner for two at each stop', points: 300 }, mode: 'apply', chapters: ['south-florida'], posted: at(-3, 10), closes: at(3), spots: 4, applicants: 26,
      req: { min_followers: 1000 },
      brief: 'Three stops, one night. Eat, film, and share the night with your audience. Good for building your work in a new part of town.',
      deliverables: ['A carousel or Reel covering all three stops', 'Stories on the night'], timeline: 'Any night in the next month.', asks: ['pitch', 'examples'] },
    { id: 'g5', img: IMG + 'gig-g5.webp', title: 'Snack brand videos, no posting needed', partner: { name: 'Crunchwell Snacks', kind: 'Snack brand' }, kind: 'content',
      pay: { type: 'paid', cents: 12000 }, mode: 'apply', chapters: [], remote: true, posted: at(-1, 15), closes: at(7), spots: 10, applicants: 33,
      req: {},
      brief: 'The brand wants real people talking about its chips in their own kitchens. You film, they post on their own pages. Your following does not matter here; your camera presence does.',
      deliverables: ['2 videos, 20 to 40 seconds, filmed vertically', 'The brand may use them for 6 months'], timeline: 'Within ten days of the product arriving.', asks: ['pitch', 'examples', 'rate'] },
    { id: 'g6', img: IMG + 'gig-g6.webp', title: 'First review of a new Vegan bakery', partner: { name: 'Vegans Explore', kind: 'Bounty' }, kind: 'bounty',
      pay: { type: 'points', points: 150 }, mode: 'claim', chapters: ['south-florida'], posted: at(0, 7), closes: at(14), spots: 1, applicants: 0,
      req: {}, brief: 'A new bakery opened in Fort Lauderdale. Be the first member to visit, take three photos and write what you ordered and what you thought.',
      deliverables: ['3 photos', 'A short write-up for its Directory page'], timeline: 'Two weeks from claiming.', asks: [] },
    { id: 'g7', img: IMG + 'gig-g7.webp', title: 'Guest host one podcast episode', partner: { name: 'Vegans Explore Podcast', kind: 'Our show' }, kind: 'hosting',
      pay: { type: 'perk', perk: 'Your episode, and promotion on our channels', points: 500 }, mode: 'audition', chapters: [], remote: true, posted: at(-4, 12), closes: at(16), spots: 2, applicants: 12,
      req: {}, brief: 'Interview a guest you bring us, on a topic you know. We record remotely and do the edit.',
      deliverables: ['A 40-minute recorded interview', 'Two clips shared from your accounts'], timeline: 'Recorded within a month.',
      audition: 'Send 60 seconds: who you would bring on, and the first question you would ask them.', asks: ['pitch', 'audition'] },
    { id: 'g8', img: IMG + 'gig-g8.webp', title: 'Check in where you go', partner: { name: 'Vegans Explore', kind: 'Always open' }, kind: 'bounty',
      pay: { type: 'points', points: 10, each: 'a visit' }, mode: 'claim', chapters: [], posted: at(-30, 9), closes: null, spots: null, applicants: 0, evergreen: true,
      req: {}, brief: 'Tap Check in on a Vegan place\'s page while you are there. Every visit helps keep the Directory honest.', deliverables: ['A check-in, up to five places a day'], timeline: 'Always open.', asks: [] },
    { id: 'g9', img: IMG + 'gig-g9.webp', title: 'Potluck recap Reel', partner: { name: 'Philly Vegan Social Club', kind: 'Group Partner' }, kind: 'event',
      pay: { type: 'points', points: 400 }, mode: 'apply', chapters: ['philadelphia'], posted: at(-1, 13), closes: at(6), spots: 1, applicants: 5,
      req: {}, brief: 'Film the group\'s fall potluck and cut a 45-second recap.', deliverables: ['1 Reel, edited', 'Raw clips to the group'], timeline: 'The night of the potluck.', asks: ['pitch', 'examples'] },
    { id: 'g10', img: IMG + 'gig-g10.webp', title: 'New York brand launch, lead creator', partner: { name: 'Verdant Kitchen', kind: 'Restaurant group' }, kind: 'campaign',
      pay: { type: 'paid', cents: 180000 }, mode: 'audition', chapters: ['new-york'], posted: at(-2, 10), closes: at(10), spots: 1, applicants: 64,
      req: { min_followers: 25000, platforms: ['instagram', 'tiktok'], level: 3 },
      brief: 'The face of a three-location launch: opening night, a recipe series and a month of posts.', deliverables: ['6 posts over a month', 'Opening night appearance'],
      timeline: 'One month.', audition: 'Record 60 seconds pitching the opening night to your audience.', asks: ['pitch', 'examples', 'audition', 'rate'] }
  ];

  var mine = [
    { gig: 'g1', status: 'audition', at: at(-1, 14), next: 'Record your audition by ' + new Date(now + 3 * DAY).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
    { gig: 'g2', status: 'shortlisted', at: at(-2, 16), next: 'The brand picks this week' },
    { gig: 'g4', status: 'booked', at: at(-5, 10), next: 'Your night is set: posts due in 9 days' },
    { gig: 'g5', status: 'applied', at: at(0, 9), next: 'Waiting for the brand' },
    { gig: 'g9', status: 'not_selected', at: at(-6, 9), next: 'The group chose a creator in Philadelphia' },
    { gig: 'p1', img: IMG + 'gig-g3.webp', title: 'Night market recap', status: 'paid', at: at(-20, 9), next: 'Paid $150 and 200 points' },
    { gig: 'p2', img: IMG + 'gig-g2.webp', title: 'Oat-milk latte tour (spring)', status: 'delivered', at: at(-8, 9), next: 'Results counting: 188 clicks so far' }
  ];

  window.VE_GIGS_DEMO = { creator: creator, gigs: gigs, mine: mine };
})();
