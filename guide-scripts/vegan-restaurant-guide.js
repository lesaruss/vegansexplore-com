/* The Vegan Restaurant Guide (rebuilt 2026-10-10 on the Dairy Guide playbook, docs/guides/BUILD-A-GUIDE.md).
 *
 * The tabs are the tour. Liz stays on the right of every tab and talks about it; the tab's content sits on the left, on
 * one screen. Back / N of M / Next under Liz walks the tabs in order. The address bar carries the view (#/audit/r/<id>,
 * #/fixes/info, #/quiz/3).
 *
 *   Overview      what the Guide is and what each tab holds
 *   Your audit    the free check (ve-restaurant-audit `free`, open to everyone): pick your business, get the list of what
 *                 to fix right away; then the full audit, $49, or $149 with a Secret Shopper visit (Sean, 2026-10-10)
 *   The fixes     the mistakes that close Vegan restaurants, one per view; members get them in the order their audit puts
 *                 them. "Outdated or hard-to-find information" is open to everyone (the free example)
 *   Pulse         the research (sourced facts) and our interviews with business owners as podcast episodes (PULSE_PICKS, ve-podcast)
 *   Get featured  how the Directory works and how a restaurant gets featured: listed, claimed, the Partner plan
 *   Promotions    what we run that brings members through the door, each marked Live or Coming
 *   Test yourself the quiz; 80% or better earns the Entrepreneur Track badge
 *   My list       members: saved fixes, interviews and promotions (ve_guide_saves through ve-cookbook)
 *   Get access    visitors: $11 or 1,100 points
 *
 * Access is the Dairy Guide's (Sean locked 2026-10-25, playbook ve-pricing-points-passport: $11 or 1,100 points, and buying
 * it makes the buyer a member; 'credit' is retired but still renders): ve-guide-unlock for this slug decides; the members-only text (the
 * other fixes, two facts, the quiz) is ve_guides.content_html, handed out only to its owners. Never add it to this repo.
 * The full audit is its own add-on, never part of the Guide (Sean, 2026-10-10): it is bought here, but anyone can buy it.
 */
(function () {
  var SLUG = 'vegan-restaurant-guide';
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var UNLOCK_URL = SB + '/functions/v1/ve-guide-unlock';
  var AUDIT_URL = SB + '/functions/v1/ve-restaurant-audit';
  var COOK_URL = SB + '/functions/v1/ve-cookbook';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var LISTING_FIELDS = (window.VERegionDirectory ? VERegionDirectory.FIELDS : 'id,slug,name,category,logo_url,vote_count,address_city,address_state,color,vegan_status') + ',initials,website';
  // Restaurants members vote for, shown on Get featured as the Directory's own cards.
  var TOP_URL = SB + '/rest/v1/listings?select=' + LISTING_FIELDS + '&status=eq.approved&category=eq.Restaurants&vegan_status=eq.fully_vegan&order=vote_count.desc.nullslast&limit=6';
  // Our interviews with business owners, in this order, as their podcast episodes (Sean, 2026-10-29: "instead of videos, I want to
  // show the podcast version... the way we're doing it in the people directory listings"). Each is [ve_pulse_content slug, the show's
  // Directory slug, the episode's guid in that show's feed (ve_podcast_feeds)]; a new one is a row here. Matched by title and date
  // 2026-10-29; Ingrid Newkirk's and Susan Hargreaves's feed titles differ from ours, and both feed episodes name Charles Grippo too.
  var PULSE_PICKS = [
    ['why-some-vegan-businesses-struggle-while-others-thrive', 'vegans-explore-podcast', '58240239-2262-4aa3-bfec-a66d187b641e'],
    ['the-business-of-being-vegan-who-actually-profits', 'vegans-explore-podcast', 'd7d6e339-3572-4e2b-b1e1-b0154758f638'],
    ['vegan-restaurants-adding-meat-death-spiral', 'vegans-explore-podcast', '593875f5-772c-4645-b5fb-f29f2ac79774'],
    ['sen-saigon-vegan-vietnamese-nyc', 'vegans-explore-podcast', '3450fd2f-027d-44df-b438-e1f2abea9bce'],
    ['love-life-cafe-and-the-long-game-of-vegan-community', 'vegans-explore-podcast', 'ba6387fb-db3f-467a-ab17-f8b777822f50'],
    ['allen-zelden-changing-the-game-for-vegan-entrepreneurs-soflo-vegans-podcast', 'soflo-vegans-podcast', '2332e733-f95b-4613-be93-99510014bbab'],
    ['chef-babette-stuff-i-eat-healing-purpose', 'vegans-explore-podcast', '18c20ea8-3712-4bb6-9bf8-5b7399656cb1'],
    ['conscious-business-and-compassion-with-veronica-menin-e108-soflo-vegans-podcast', 'soflo-vegans-podcast', '03c7a387-a57f-443a-af64-1d7fa92d0938'],
    ['chef-robyn-corporate-chef-of-future-foods-paow-soflo-vegans-podcast', 'soflo-vegans-podcast', '2ba64e18-29e0-41bb-89b6-c97165e7ff09'],
    ['ingrid-newkirk-peta-green-bar-kitchen-ep003-soflo-vegans-podcast', 'soflo-vegans-podcast', 'tag:soundcloud,2010:tracks/473962515'],
    ['susan-hargraves-animal-hero-kids-charles-grippo-ep007-soflo-vegans-podcast', 'soflo-vegans-podcast', 'tag:soundcloud,2010:tracks/486535308'],
    ['top-vegan-restaurants-in-broward-e107-soflo-vegans-podcast', 'soflo-vegans-podcast', '01c7986a-a00a-4538-8102-ccc319ecefd9']
  ];
  var PODCAST_FN = SB + '/functions/v1/ve-podcast';
  var SHOW_SLUGS = PULSE_PICKS.map(function (x) { return x[1]; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
  var SHOWS_URL = SB + '/rest/v1/listings?select=id,slug,name,logo_url&status=eq.approved&slug=in.(' + SHOW_SLUGS.join(',') + ')';
  var PULSE_URL = SB + '/rest/v1/ve_pulse_content?select=slug,title,podcast_show,youtube_id,thumbnail_url,summary,published_at&status=eq.published&slug=in.(' + PULSE_PICKS.map(function (x) { return x[0]; }).join(',') + ')';

  // The tabs, in tour order, and what Liz says on each. A tab's `say` must match its recording (Sean approved every line,
  // 2026-10-10). `say` is for visitors (why get it), `sayMember` walks an owner of the Guide through what they have.
  var TABS = [
    { k: 'overview', label: 'Overview', show: 'Hi, I\'m Liz. Press play and I\'ll walk you through it. Start with Run my free check.', say: 'Hi, I\'m Liz, and welcome to the Vegan Restaurant Guide. You feed people, and that\'s the most direct way anyone meets Vegan food, so thank you. Most owners are great at the food and stretched thin on everything else: your Google listing, your hours, your photos, your menu online. Customers decide from what they find before they ever walk in. This Guide shows you what they find, and what to fix first. Start with Run my free check. Then take the short survey. It\'s free, it makes you a member, and the rest of the Guide opens. And this Guide is built with you. If something isn\'t clear, ask me. If I can\'t help, our team will.',
      sayMember: 'Welcome in. You run a Vegan restaurant, and we\'re here to help people find it. Pick a topic below: start with Your restaurant if you\'re not sure. Save anything to My list and come back any time.' },
    { k: 'audit', label: 'Your audit', say: 'This is your restaurant, and we\'ve already checked it. We looked at your Google listing, your website, how you show up in search, and your social. Here\'s what we found, and the first things to work on. It\'s free, and this check is just for you.',
      sayMember: 'Your free check is right here. Run it anytime. When you want us to go deeper, the full audit is an add-on.' },
    { k: 'expect', label: 'What to expect', pre: 1, show: 'Here\'s what opens when you\'re in. Press play and I\'ll explain.', say: 'Here\'s what opens when you\'re in. The top challenges: the things Vegan business owners run into, so you can tick the ones that sound like you. Your page: it already exists, and you can claim it. Your dashboard: how many people look at your page. Our interviews with other owners. And the campaigns and events that bring people to your door. Some of this is live now and some is coming, and each one tells you which. When you\'re ready, take the short survey.' },
    { k: 'fixes', label: 'Top challenges', after: 1, say: 'These are the top ten things Vegan businesses run into. This isn\'t a review of your restaurant. It\'s a checklist of the most common ones. Tick the ones you relate to, and you\'ll see which come up most for owners. Open any one to see what to do this week.',
      sayMember: 'These are the top ten things Vegan businesses run into. This isn\'t a review of your restaurant. It\'s a checklist of the most common ones. Tick the ones you relate to, and you\'ll see which come up most for owners. Open any one to see what to do this week.' },
    { k: 'pulse', label: 'Pulse', after: 1, say: 'Every business interview we\'ve recorded is here, with the research. Play any of them right here. We keep adding more.',
      sayMember: 'Every business interview we\'ve recorded is here, with the research. Play any of them right here. We keep adding more.' },
    // Sourcing (Sean, 2026-11-04): members only, so a visitor never sees an empty tab. Text drafts for Sean until approved.
    { k: 'sourcing', label: 'Sourcing', mine: 1, say: 'Not everything has to come out of your kitchen. Here is who to buy it from, and every supplier wears an honest label.',
      showMember: 'Who to buy it from, so it doesn\'t all come out of your kitchen.',
      sayMember: 'Not everything has to come out of your kitchen. This is who to buy it from: ready-made food, ingredients, packaging, people who can make your recipe for you, even machines, distributors and certifiers. Every supplier wears one label. A fully Vegan company is Vegan all the way through. Offers Vegan options means check each product with them. Plant-based material and Equipment are about what something is made of or what it does, not a Vegan promise. And under Buy or make, every item has a supplier right beside a recipe you can make yourself.' },
    { k: 'featured', label: 'Claim your page', after: 1, say: 'This is your page, just as members see it. It\'s already in the Directory. Click around. When you claim it, it\'s yours: your hours, your photos and your menu link, changed whenever you like.',
      sayMember: 'This is your page, just as members see it. It\'s already in the Directory. Click around. When you claim it, it\'s yours: your hours, your photos and your menu link, changed whenever you like.' },
    { k: 'dashboard', label: 'Your dashboard', after: 1, say: 'This is your dashboard. It shows how many people look at your page, where they come from, and what they do next. It opens fully once you claim your page.',
      sayMember: 'This is your dashboard. It shows how many people look at your page, where they come from, and what they do next. It opens fully once you claim your page.' },
    { k: 'demo', label: 'Try the demo', after: 1, show: 'A sample restaurant to look around. Pick a step. Press play for the tour.', say: 'This is Green Leaf Kitchen, a sample restaurant, so you can look around without touching anything real. Pick a step and it opens full screen: the page as visitors see it, your dashboard, your Insights, your page, your menu, your ads and opportunities, and your audit. Close it whenever you\'re done. Yours starts with your own page.',
      sayMember: 'This is Green Leaf Kitchen, a sample restaurant, so you can look around without touching anything real. Pick a step and it opens full screen: the page as visitors see it, your dashboard, your Insights, your page, your menu, your ads and opportunities, and your audit. Close it whenever you\'re done. Yours starts with your own page.' },
    { k: 'promos', label: 'Promotions', after: 1, say: 'These are the promotions open to you, from events to features to campaigns. Pick what fits, or ask our team to plan it with you.',
      sayMember: 'These are the promotions open to you, from events to features to campaigns. Pick what fits, or ask our team to plan it with you.' },
    { k: 'mylist', label: 'My list', mine: 1, say: 'Everything you saved is right here: top challenges, interviews and promotions, so you can pick up where you left off.' },
    { k: 'next', label: 'What\'s next', mine: 1, say: 'You are in. Thank you. Here is what you can do next. Claim your page, open your dashboard, and follow us so we can follow you back.',
      sayMember: 'You are in. Thank you. Here is what you can do next. Claim your page, open your dashboard, and follow us so we can follow you back.' },
    { k: 'join', label: 'Get in', guest: 1, say: 'There is one way in, and it is free. Take the short survey. When you finish, you are a member.',
      // A member who has not taken this Guide's survey yet (Sean approved 2026-11-06). Text until it is recorded.
      sayActive: 'You\'re already a member, thank you. This Guide opens with its own short survey about your restaurant. Finish it and every tab is yours.',
      sayCredit: 'You have a Guide credit. Use it here and the whole Guide is yours to keep.',
      // On points (Sean locked 2026-10-25). Not recorded yet, so this tab shows her picture and the bubble carries the words.
      sayPoints: 'There is one way in, and it is free. Take the short survey. When you finish, you are a member.' }
  ];
  // Liz's voice over her still picture, one pose per tab (Sean, 2026-10-31: "I don't like the animations. It's inconsistent...
  // I don't want to see her animated at the beginning either"). Each file is an MP4 of the sharp still with the line she recorded
  // on 2026-10-10 (Your audit, Pulse and My list re-recorded 2026-10-31 without "lives here"), so the player is unchanged. Maya's
  // Dairy Guide clips stay animated. Raise CLIP_V when the files change.
  var CLIP_BASE = SB + '/storage/v1/object/public/vegan-media/media/liz/restaurant-guide/';
  var CLIP_V = 4, CLIPS = {}, CLIPS_M = {};
  function lizClip(name) { return { video: CLIP_BASE + 'rg-' + name + '.mp4?v=' + CLIP_V, poster: CLIP_BASE + 'rg-poster-' + name + '.jpg?v=' + CLIP_V }; }
  ['overview', 'audit', 'fixes', 'pulse', 'featured', 'promos', 'quiz', 'join'].forEach(function (k) { CLIPS[k] = lizClip(k); });
  ['overview', 'audit', 'fixes', 'pulse', 'featured', 'promos', 'quiz', 'mylist'].forEach(function (k) { CLIPS_M[k] = lizClip('m-' + k); });
  CLIPS.join_credit = lizClip('join-c');
  // The first page shows her arms folded with an open smile (the playbook), before the tour starts.
  CLIPS.overview.poster = CLIP_BASE + 'rg-poster-first.jpg?v=' + CLIP_V;
  // The door copy (2026-11-04) changed these lines, so their old recordings no longer match: text only until new ones are recorded.
  ['overview', 'audit', 'featured', 'join'].forEach(function (k) { CLIPS[k] = null; CLIPS_M[k] = null; });
  CLIPS.join_credit = null;
  // Her voice over her picture (door copy, 2026-11-04): el-media tts in her roster-profile voice, one mp3 a tab for visitors.
  // A line's text must match its recording; a changed line is a new version (-v2). Checked word for word with stt, 2026-11-04.
  var AUDIO_V = { overview: 'overview-v3', audit: 'audit-v2', expect: 'expect-v1', join: 'join-v1' };
  var AUDIO_M = { overview: 'overview-member-v2', fixes: 'fixes-v1', dashboard: 'dashboard-v1', featured: 'featured-v2', demo: 'demo-v2', pulse: 'pulse-v1', promos: 'promos-v1', mylist: 'mylist-v1', next: 'next-v1', sourcing: 'sourcing-member-v1' };
  // Members: the tabs as 5 groups in one dropdown under the title (Sean, 2026-11-06: "way too much... grouped... or a drop down"),
  // the Events Guide's and the Pre-Vegan Business Guide's GROUPS. A group opens as a page of picture tiles (#/g/<group>); the dropdown
  // and Back / Next go by group. Visitors keep their four flat tabs. Liz's group-page lines are text until Sean approves them for recording.
  var GROUPS = [
    { k: 'start', label: 'Start here', kids: [] },
    { k: 'business', label: 'Your restaurant', kids: ['audit', 'fixes'], line: 'How your restaurant looks online today, and the challenges owners run into most.',
      say: 'Your restaurant is where we start: your free check, then the challenges other owners run into. Tick the ones that sound like you.' },
    { k: 'page', label: 'Your page', kids: ['featured', 'dashboard', 'demo'], line: 'Your page on Vegans Explore, the numbers behind it, and a sample to look around.',
      say: 'Your page is already in our Directory. Claim it, see who finds you on your dashboard, or look around the sample restaurant first.' },
    { k: 'help', label: 'Resources', kids: ['sourcing', 'pulse'], line: 'Who to buy from, and what other owners learned the hard way.',
      say: 'Resources is help you can use this week: who to buy from, and interviews with owners who have been where you are.' },
    { k: 'grow', label: 'Grow with us', kids: ['promos', 'next', 'mylist'], line: 'Promotions, what to do next, and everything you saved.',
      say: 'Grow with us is how we bring people to your door: promotions you can join, what to do next, and everything you saved.' }
  ];
  // A real picture for each section tile and each kind of supplier (Higgsfield, 2026-11-06, illustrative: no words or logos).
  var PIC_BASE = '/public/guides/restaurant-guide/';
  // Pictures go through Vercel's resizer (vercel.json images): the files are 640 px but a row icon shows at 30 px and a tile
  // at most about 120, so 256 covers a 2x phone. Site health, 2026-11-11: this page lost speed to about 1 MB of oversized images.
  function picUrl(name, w) { return '/_vercel/image?url=' + encodeURIComponent(PIC_BASE + name + '.jpg?v=2') + '&w=' + w + '&q=75'; }
  function pic(name) { return '<img src="' + picUrl(name, 256) + '" alt="" loading="lazy" decoding="async" width="640" height="640" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">'; }
  var TILE = { audit: 'Your free check: what people find when they look you up.', fixes: 'The ten things owners run into most. Tick yours.',
    featured: 'Your page in the Directory. Claim it and keep it current.', dashboard: 'Who looks at your page, where they come from, what they do next.',
    demo: 'A sample restaurant to click around, nothing real touched.', sourcing: 'Who sells it ready-made, and Buy or make.',
    pulse: 'Interviews with Vegan business owners, played right here.', promos: 'Events, features and campaigns that bring people in.',
    next: 'Claim your page, open your dashboard, follow us.', mylist: 'Everything you saved, in one place.' };
  var TILE_PIC = { audit: 't-audit', fixes: 't-fixes', featured: 't-featured', dashboard: 't-dashboard', demo: 't-demo', sourcing: 'src-food_drink',
    pulse: 't-pulse', promos: 't-promos', next: 't-next', mylist: 't-mylist' };
  function groupOf(k) { if (/^g:/.test(k)) return k.slice(2); for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].kids.indexOf(k) >= 0) return GROUPS[i].k; return 'start'; }
  function group(g) { for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].k === g) return GROUPS[i]; return GROUPS[0]; }
  function gHref(g) { return g === 'start' ? '#/' : '#/g/' + g; }
  function kidsOf(g) { var avail = tabs().map(function (t) { return t.k; }); return group(g).kids.filter(function (k) { return avail.indexOf(k) >= 0; }); }
  // The tour: members go Start here, then each group page followed by its sections; visitors go tab by tab.
  function tourSteps() {
    if (!member()) return tabs().map(function (t) { return t.k; });
    var out = ['overview']; GROUPS.slice(1).forEach(function (g) { out.push('g:' + g.k); kidsOf(g.k).forEach(function (k) { out.push(k); }); }); return out;
  }
  function stepHref(st) { return /^g:/.test(st) ? gHref(st.slice(2)) : href(st); }

  // What we run for restaurants (Sean, 2026-10-10). Never show a planned thing as live: each says Live or Coming.
  var PROMOS = [
    { k: 'challenge-stop', t: 'Be a Passport Challenge stop', live: 1, href: '/business/challenge', what: 'Five Vegan businesses a month in each chapter are the stops on our Passport Challenge: members come to check in, show what they ordered and win your gift cards in the Vault. You give four $25 gift cards. If you are not a member yet, your cards give you full membership, and your claim is included.', why: 'About $30 in food for a month of promotion to every member, and new customers who come back to use the cards. Starting in South Florida.' },
    { k: 'directory-page', t: 'Your Directory page', live: 1, href: '#/featured', what: 'A page on Vegans Explore that members find by city, search and votes, with your menu, hours, photos and links.', why: 'Free to be listed. Claim it to keep it current and see who finds you.' },
    { k: 'pulse-sponsor', t: 'A sponsored Daily Pulse story', live: 1, what: 'Your news written up and shared in your city\'s Daily Pulse, the topic members read every morning.', why: 'Sponsors give us the pictures; we write it and put it in front of your city.' },
    { k: 'bounties', t: 'Creator bounties', live: 1, what: 'Members and local creators make posts, reels and reviews about you, and earn points for it.', why: 'Real people showing your food, on their own accounts.' },
    { k: 'community-nights', t: 'Community nights', what: 'A members\' night at your restaurant: a set menu, a full room, photos and posts after.', why: 'A slow night turned into a full one, and regulars who came because of the community.' },
    { k: 'showcase', t: 'The Plant-Based Showcase', what: 'Sampling at events that are not Vegan, starting with Miami Dolphins game day at Hard Rock Stadium on November 29, 2026.', why: 'Your food in front of people who would never walk into a Vegan restaurant.' },
    { k: 'campaigns', t: 'Points campaigns', what: 'Members earn points for visiting, trying a dish or posting, with a leaderboard in your city.', why: 'A reason to come in this month, and to come back. Our Q1 2027 campaigns are being planned now.' },
    { k: 'ads', t: 'Ads on Vegans Explore', what: 'Your ad beside the Daily Pulse, events and Guides, on the pages your customers read.', why: 'Reach Vegans in your city where they are already looking for food.' },
    { k: 'guide-spot', t: 'A spot in a Guide', what: 'Your restaurant featured inside one of our Guides, walked through by its Guide.', why: 'A recommendation, not an ad, in front of people learning to eat Vegan.' }
  ];
  // Each fix's picture: an icon on the tile until we have photos.
  var S = 'stroke="#1f5f22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  var FIX_ICON = {
    location: '<path d="M12 21s-7-6.5-7-12a7 7 0 0114 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    branding: '<path d="M4 7l8-4 8 4-8 4z"/><path d="M4 12l8 4 8-4"/><path d="M4 17l8 4 8-4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    seo: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    social: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17" cy="7" r=".8"/>',
    visuals: '<rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l2-3h4l2 3"/>',
    feedback: '<path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12h5"/>',
    menu: '<path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
    community: '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2 20c1-3.5 3.5-5 6-5s5 1.5 6 5M12 20c.6-2.4 2-4 4-5 2.5 0 5 1.5 6 5"/>',
    burnout: '<path d="M12 3c2 4 6 5 6 10a6 6 0 01-12 0c0-3 2-4 2-7 2 1 3 3 3 5 1-2 1-5 1-8z"/>'
  };
  function fixIcon(id, size) { return '<svg width="' + (size || 34) + '" height="' + (size || 34) + '" viewBox="0 0 24 24" fill="none" ' + S + ' aria-hidden="true">' + (FIX_ICON[id] || FIX_ICON.info) + '</svg>'; }
  var ICON = {
    audit: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + '><path d="M9 4h6v3H9z"/><path d="M7 5H5v16h14V5h-2"/><path d="M8 13l3 3 5-6"/></svg>',
    fixes: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + '><path d="M14 6a4 4 0 00-5 5l-6 6 3 3 6-6a4 4 0 005-5l-3 3-3-3z"/></svg>',
    pulse: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + '><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>',
    featured: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + '><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/></svg>',
    promos: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + '><path d="M3 10v4h3l7 5V5L6 10z"/><path d="M17 9a4 4 0 010 6"/></svg>',
    demo: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + '><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M10 8.5l5 2.5-5 2.5z"/></svg>',
    quiz: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + '><circle cx="12" cy="9" r="6"/><path d="M9 14l-2 7 5-3 5 3-2-7"/></svg>'
  };
  var LOCK_SVG = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';
  var HEART = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>';
  var BOOKMARK = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 3h12a1 1 0 011 1v17l-7-4.5L5 21V4a1 1 0 011-1z"/></svg>';
  var AREA = { google: 'Google', seo: 'Search', web: 'Website', social: 'Social' };
  var STATE = { fix: 'Fix', good: 'Good', review: 'Check', skip: 'Could not check' };

  var main = document.getElementById('dgMain');
  var menuEl = document.getElementById('dgMenu'), menuSel = document.getElementById('dgMenuSelect');
  var qEl = document.getElementById('dgQ');
  var PUB = JSON.parse(document.getElementById('rg-public').textContent);

  var access = 'checking';       // checking | guest | pending | member
  var MEM = null;                // members-only payload (fixes, quiz, why)
  var ST = { rule: 'credit', cost: 1100, balance: 0, credits: 0, rate: 2500, cap: 3, active: false, via: null };
  var PODS = null, TOP = null, CRIT = null;
  var curTab = 'overview';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function auth() { return window.VEAuth || null; }
  function token() { var a = auth(); return a && a.isLoggedIn && a.isLoggedIn() ? a.getToken() : null; }
  function member() { return access === 'member'; }
  function sources(list) { return list && list.length ? '<span class="dg-src">' + list.map(function (s) { return '<a href="' + esc(s[1]) + '" target="_blank" rel="noopener">' + esc(s[0]) + '</a>'; }).join('') + '</span>' : ''; }
  function tabs() { return TABS.filter(function (t) { return !(t.guest && member()) && !(t.mine && !member()) && !(t.after && !member()) && !(t.pre && member()); }); }
  function tab(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i].k === k) return TABS[i]; return TABS[0]; }
  function href(k) { return '#/' + (k === 'overview' ? '' : k); }
  function store(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function recall(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  // ---------- tabs ----------
  function drawMenu(cur) {
    menuEl.classList.toggle('dg-dd-on', member()); menuSel.classList.toggle('dg-dd-on', member());
    if (!member()) {
      menuEl.innerHTML = tabs().map(function (t) {
        return '<a href="' + href(t.k) + '"' + (t.k === cur ? ' aria-current="page"' : '') + (t.guest ? ' class="dg-join-tab"' : '') + '>' + esc(t.label) + '</a>';
      }).join('');
      menuSel.innerHTML = tabs().map(function (t) { return '<option value="' + t.k + '"' + (t.k === cur ? ' selected' : '') + '>' + esc(t.label) + '</option>'; }).join('') +
        (cur === 'search' ? '<option value="search" selected>Search results</option>' : '');
      return;
    }
    // Members: one dropdown at every width, the 5 groups, each with its sections in small type (the Events Guide's drawMenu).
    var open = !!(menuEl.querySelector('.dg-dd-list') && !menuEl.querySelector('.dg-dd-list').hidden);
    var cg = cur === 'search' ? '' : groupOf(cur === 'overview' ? 'start' : cur), ci = 0;
    GROUPS.forEach(function (g, n) { if (g.k === cg) ci = n; });
    var curT = cur === 'search' ? { label: 'Search results' } : group(cg);
    var sec = cur !== 'search' && cur !== 'overview' && !/^g:/.test(cur) ? tab(cur) : null;
    menuEl.innerHTML = '<button type="button" class="dg-dd-btn" aria-haspopup="true" aria-expanded="false">' + esc(curT.label) +
      (sec ? ' <span class="dg-dd-sec">&rsaquo; ' + esc(sec.label) + '</span>' : '') +
      '<small>' + (cur === 'search' ? '' : (ci + 1) + ' of ' + GROUPS.length) + '</small></button>' +
      '<div class="dg-dd-list" hidden>' + GROUPS.map(function (g, n) {
        var kids = kidsOf(g.k).map(function (k) { return esc(tab(k).label); });
        return '<a href="' + gHref(g.k) + '"' + (g.k === cg ? ' aria-current="page"' : '') + '><span class="dg-dd-n">' + (n + 1) + '</span><span class="dg-dd-g"><b>' + esc(g.label) + '</b>' +
          (kids.length ? '<small>' + kids.join(' &middot; ') + '</small>' : '<small>Why this Guide, and how to use it</small>') + '</span></a>';
      }).join('') + '</div>';
    if (open) setDD(true);
  }
  function setDD(on) {
    var l = menuEl.querySelector('.dg-dd-list'), btn = menuEl.querySelector('.dg-dd-btn'); if (!l || !btn) return;
    l.hidden = !on; btn.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  menuEl.addEventListener('click', function (e) {
    if (e.target.closest('.dg-dd-btn')) { var l = menuEl.querySelector('.dg-dd-list'); setDD(l && l.hidden); return; }
    if (e.target.closest('.dg-dd-list a')) setDD(false);
  });
  document.addEventListener('click', function (e) { if (!menuEl.contains(e.target)) setDD(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setDD(false); });
  // A group's page: a picture tile for each of its sections.
  function viewGroup(g) {
    var G = group(g);
    if (G.k === 'start') return viewOverview();
    main.innerHTML = crumb([[G.label]]) + head('The Vegan Restaurant Guide', esc(G.label), esc(G.line)) +
      '<div class="rg-gtiles">' + kidsOf(G.k).map(function (k) {
        return '<a class="rg-gtile" href="' + href(k) + '"><span class="rg-gpic">' + pic(TILE_PIC[k] || 't-next') + '</span><span class="rg-gtxt"><b>' + esc(tab(k).label) + '</b><span>' + esc(TILE[k] || '') + '</span></span></a>';
      }).join('') + '</div>';
  }
  menuSel.addEventListener('change', function () { location.hash = href(menuSel.value); });

  // ---------- pieces ----------
  function crumb(parts) {
    return '<div class="dg-crumb"><a href="#/">Restaurant Guide</a>' + parts.map(function (p) { return ' &rsaquo; ' + (p[1] ? '<a href="' + p[1] + '">' + esc(p[0]) + '</a>' : esc(p[0])); }).join('') + '</div>';
  }
  function head(k, h, lede, right) {
    return '<div class="dg-head"><div><div class="dg-k">' + esc(k) + '</div><h2 class="dg-h1">' + h + '</h2></div>' + (right || '') + '</div>' + (lede ? '<p class="dg-lede">' + lede + '</p>' : '');
  }
  function toggles(list, cur) {
    return '<div class="dg-toggles" role="group">' + list.map(function (x) { return '<a href="' + x[1] + '" aria-pressed="' + (x[0] === cur) + '">' + esc(x[0]) + '</a>'; }).join('') + '</div>';
  }
  function skel(title, lines) { var h = '<div class="dg-skel">' + (title ? '<h3>' + esc(title) + '</h3>' : '<i></i>'); for (var i = 0; i < (lines || 3); i++) h += '<i style="width:' + (92 - i * 9) + '%"></i>'; return h + '</div>'; }
  function gated(inner, title, text) {
    return '<div class="dg-gated"><div class="dg-blur" aria-hidden="true">' + inner + '</div><div class="dg-gate"><span class="dg-lockic">' + LOCK_SVG.replace(/width="11" height="11"/, 'width="16" height="16"').replace('currentColor', '#1f5f22') + '</span>' +
      '<b>' + esc(title) + '</b><p>' + esc(text) + ' ' + esc(offerLine()) + '</p>' + ctaBtns() + '</div></div>';
  }
  // One tile for everything that is not a Directory listing: the picture on the left, the words, the actions top right.
  function row(o) {
    return '<div class="dg-srow"' + (o.href ? ' data-href="' + o.href + '"' : '') + '>' + (o.icon ? '<span class="dg-th rg-th" aria-hidden="true">' + o.icon + '</span>' : '') +
      '<div class="dg-srow-b">' + (o.pre || '') + '<h3>' + (o.href ? '<a href="' + o.href + '">' + esc(o.title) + '</a>' : esc(o.title)) + '</h3>' + (o.body || '') + '</div>' +
      (o.acts ? '<div class="dg-acts">' + o.acts + '</div>' : '') + '</div>';
  }

  // ---------- the offer (the Guide: $11 or 1,100 points) ----------
  function priced() { return ST.rule === 'credit' || ST.rule === 'points'; }
  function onPoints() { return ST.rule === 'points'; }
  // The Restaurant Guide is a door Guide (canon-ve-door-guides): free with its survey, the only door (Sean, 2026-11-04). The $11 is an optional contribution on What's next, never a way in.
  var SURVEY_SLUG = 'vegan-restaurant-guide';
  function surveyGo() { try { sessionStorage.setItem('ve_survey_for', SURVEY_SLUG); } catch (e) {} location.href = '/survey?s=' + SURVEY_SLUG; }
  function pts(n) { return Number(n || 0).toLocaleString('en-US'); }
  function credits(n) { return n + ' Guide credit' + (n === 1 ? '' : 's'); }
  function mode() {
    if (access === 'guest' || access === 'checking') return 'join';
    // A business Guide opens only with its intake, members included (canon-ve-door-guides v6 membership_rule_v6, Sean 2026-11-06).
    if (ST.active) return 'buy';
    if (!priced()) return 'activate';
    if (onPoints()) return ST.balance >= ST.cost ? 'points' : 'buy';
    if (ST.credits >= 1) return 'unlock';
    return ST.active ? 'buy' : 'activate';
  }
  function canExchange() { return ST.balance >= ST.rate && ST.credits < ST.cap; }
  function ctaLabel() {
    return { join: onPoints() ? 'Get it for $11' : 'Join for $11', activate: 'Become a Founding Member', unlock: 'Unlock with 1 credit',
      points: 'Unlock with ' + pts(ST.cost) + ' points', buy: onPoints() ? 'Get it for $11' : 'Get it now for $11' }[mode()];
  }
  function offerLine() {
    var m = mode();
    if (ST.active && m === 'buy') return 'You are a member, so this one is free. Answer a few questions about your restaurant and it opens, with up to 250 more points.';
    if (m === 'join' || m === 'activate' || m === 'buy') return 'Take the free restaurant survey. When you finish, you are a member and the whole Guide opens.';
    if (onPoints()) {
      if (m === 'points') return 'Unlock it with ' + pts(ST.cost) + ' points: you have ' + pts(ST.balance) + '. Or get it for $11.';
      return 'It is $11, or ' + pts(ST.cost) + ' points, and yours to keep.';
    }
    if (m === 'unlock') return 'Unlock it with 1 Guide credit. You have ' + ST.credits + '.';
    if (m === 'buy') return 'Get it now for $11, or use a Guide credit: Passport gives you one every month.';
    return 'Joining Vegans Explore is free with a short survey.';
  }
  function ctaBtns() {
    var m = mode();
    if (m === 'join' || m === 'activate' || m === 'buy') return '<div class="dg-btns"><button type="button" class="dg-btn" data-survey>Take the survey, free</button>' +
      (m === 'join' ? '<a href="#" data-signin>Already a member? Sign in</a>' : '') + '</div>';
    return '<div class="dg-btns"><button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button>' +
      (m === 'join' ? '<a href="#" data-signin>Already a member? Sign in</a>' : '') +
      (m === 'points' ? '<a href="#" data-buy>Or get it for $11</a>' : '') +
      (m === 'buy' && onPoints() ? '<a href="/passport">Or get your Passport: $11 with 1,100 points</a>' : '') +
      (m === 'buy' && !onPoints() ? (canExchange() ? '<a href="#" data-exchange>Use ' + pts(ST.rate) + ' points for a credit</a>' : '<a href="/passport">Passport: a credit every month</a>') : '') + '</div>';
  }
  function take(d) {
    if (!d || d.error) return;
    if (d.access_rule && d.access_rule !== ST.rule) { ST.rule = d.access_rule; if (TOUR.shown === 'join') TOUR.shown = null; }
    if (d.points_per_credit) ST.rate = d.points_per_credit;
    if (d.cost) ST.cost = d.cost;
    if (d.credit_cap) ST.cap = d.credit_cap;
    ST.balance = d.balance || 0; ST.credits = d.credits || 0; ST.active = d.membership_status === 'active'; ST.via = d.via || null;
  }
  function drawJoinbox() {
    var box = document.querySelector('.dg-joinbox'); if (!box || member()) return;
    var m = mode(), price = box.querySelector('.dg-jb-price'), btn = box.querySelector('[data-survey]') || box.querySelector('[data-join]'), signin = box.querySelector('.dg-jb-in');
    if (m === 'join' || m === 'activate' || m === 'buy') {
      price.innerHTML = '<b>Free</b><small>with the<br>survey</small>';
      btn.textContent = 'Take the survey'; btn.setAttribute('data-survey', '1'); btn.removeAttribute('data-join');
    } else {
      btn.setAttribute('data-join', '1'); btn.removeAttribute('data-survey');
      price.innerHTML = !onPoints() && (m === 'unlock' || m === 'buy') ? '<b>' + ST.credits + '</b><small>Guide credit' + (ST.credits === 1 ? '' : 's') + '<br>this Guide: 1</small>'
        : '<b>$11</b><small>one time<br>purchase</small>';
      btn.textContent = ctaLabel();
    }
    signin.style.display = m === 'join' ? '' : 'none';
  }

  // ---------- saves and votes (ve-cookbook, the Guide's own lists) ----------
  function cookApi(body) {
    var tok = token(), h = { 'Content-Type': 'application/json' };
    if (tok) h.Authorization = 'Bearer ' + tok;
    body.guide = SLUG;
    return fetch(COOK_URL, { method: 'POST', headers: h, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  var SV = { fix: {}, episode: {}, promo: {} }, SV_ORDER = [], svState = '', svWait = [];
  function loadSaves(then) {
    if (then) svWait.push(then);
    if (svState === 'loading') return;
    if (!member() || svState === 'loaded') { var w0 = svWait; svWait = []; w0.forEach(function (f) { f(); }); return; }
    svState = 'loading';
    var finish = function () { paintSaves(); var w = svWait; svWait = []; w.forEach(function (f) { f(); }); };
    cookApi({ action: 'saves' }).then(function (d) {
      if (d && d.saves) { SV_ORDER = d.saves; d.saves.forEach(function (x) { if (SV[x.kind]) SV[x.kind][x.key] = 1; }); svState = 'loaded'; } else svState = '';
      finish();
    }).catch(function () { svState = ''; finish(); });
  }
  function saveBtn(kind, key) {
    var on = !!SV[kind][key];
    return '<button type="button" class="dg-save' + (on ? ' on' : '') + '" data-save="' + kind + ':' + esc(key) + '" aria-pressed="' + on + '" title="' + (on ? 'Saved to My list' : 'Save to My list') + '">' + BOOKMARK + '<span>' + (on ? 'Saved' : 'Save') + '</span></button>';
  }
  function paintSaves() {
    [].forEach.call(document.querySelectorAll('[data-save]'), function (b) {
      var kk = b.getAttribute('data-save'), i = kk.indexOf(':'), on = !!(SV[kk.slice(0, i)] || {})[kk.slice(i + 1)];
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.title = on ? 'Saved to My list' : 'Save to My list';
      b.querySelector('span').textContent = on ? 'Saved' : 'Save';
    });
  }
  var GV = { counts: { episode: {}, fix: {} }, mine: { episode: {}, fix: {} } }, gvLoaded = false;
  function loadGVotes(then) {
    cookApi({ action: 'gvotes' }).then(function (d) {
      if (d && d.counts) { GV.counts = d.counts; GV.counts.fix = GV.counts.fix || {}; GV.mine = { episode: {}, fix: {} }; (d.mine.episode || []).forEach(function (x) { GV.mine.episode[x] = 1; }); (d.mine.fix || []).forEach(function (x) { GV.mine.fix[x] = 1; }); }
      // Tried once, even when it failed: the view redraws after this, and must not ask again (a redraw drops a playing episode).
      gvLoaded = true;
      if (then) then();
    }).catch(function () { gvLoaded = true; if (then) then(); });
  }
  function gvCount(key) { return (GV.counts.episode || {})[key] || 0; }
  // A fix's poll (Sean, 2026-11-04): tick the ones you relate to; tick or untick only, no daily votes. The ranking is everyone's.
  function pollBtn(id) {
    var on = !!GV.mine.fix[id], n = (GV.counts.fix || {})[id] || 0;
    if (!member()) return '<span class="dg-vote dg-vote-s" title="Members who relate to this"><b>' + n + '</b></span>';
    return '<button type="button" class="dg-vote dg-vote-s' + (on ? ' on' : '') + '" data-gvote="fix:' + esc(id) + '" aria-pressed="' + on + '" title="Tick if you relate to this">' + (on ? 'This applies to me' : 'This applies to me') + ' &middot; <b>' + n + '</b></button>';
  }
  function gvoteBtn(key) {
    var on = !!GV.mine.episode[key];
    return '<button type="button" class="dg-vote dg-vote-s' + (on ? ' on' : '') + '" data-gvote="episode:' + esc(key) + '" aria-pressed="' + on + '" title="' + (on ? 'You voted for this' : 'Vote for this') + '">' + HEART + '<b>' + gvCount(key) + '</b></button>';
  }

  // ---------- the audit (ve-restaurant-audit) ----------
  // The personal link (door Guides, Sean 2026-11-04): /guides/vegan-restaurant-guide?b=<code> opens already on that business. The server
  // maps the code to the listing (ve-restaurant-audit `personal`); this page never chooses one and shows no search box for it.
  var PERSONAL = null; // {slug, name, street, city, id} once the server has said who it is
  function AL() { return PERSONAL ? 'Your business' : 'Your audit'; }
  function loadPersonal(code) {
    if (!/^bo-[a-z0-9]{7}$/.test(code || '')) return;
    auditApi({ action: 'personal', code: code }).then(function (d) {
      if (!d || !d.slug) { store('rg_b', ''); return; }
      PERSONAL = d; PERSONAL.code = code; store('rg_b', code);
      for (var i = 0; i < TABS.length; i++) if (TABS[i].k === 'audit') TABS[i].label = 'Your business';
      if (!d.id) startMine();
      route();
    }).catch(function () {});
  }
  // The check starts the moment the page opens on their link (Sean, 2026-11-04), so Your business already has it, or says it is running.
  function startMine() {
    PERSONAL.starting = true;
    auditApi({ action: 'free', listing_slug: PERSONAL.slug, code: PERSONAL.code }).then(function (r) {
      PERSONAL.starting = false;
      if (r && r.id) { PERSONAL.id = r.id; store('rg_last_audit', r.id); LAST = null; }
      if (curTab === 'audit') route();
    }).catch(function () { PERSONAL.starting = false; if (curTab === 'audit') route(); });
  }
  function isAdmin() { var m = me(); return !!(m && m.is_superadmin); }
  // The Guide is by invitation (Sean, 2026-11-04): a business sees only its own, so no one picks another restaurant. The team keeps the search.
  function viewInvite() {
    var mail = 'mailto:contact@lesaruss.com?subject=' + encodeURIComponent('Invitation to the Vegans Explore Restaurant Guide');
    main.innerHTML = head('Your business', 'This Guide is by invitation',
      'We build it around one restaurant at a time, so your check is yours alone. If we sent you an email, open the link in it and your restaurant is already here.') +
      '<div class="dg-start"><a class="dg-btn" href="' + mail + '">Ask for an invitation</a><p>Free. We write back.</p></div>';
  }
  function notYou() {
    if (!PERSONAL) return '';
    var mail = 'mailto:contact@lesaruss.com?subject=' + encodeURIComponent('This is not my business: ' + PERSONAL.name);
    return '<p class="dg-empty" style="margin-top:14px">This is ' + esc(PERSONAL.name) + (PERSONAL.street ? ', ' + esc(PERSONAL.street) : '') + '. <a href="' + mail + '">Not your business? Tell us.</a></p>';
  }
  function viewPersonal() {
    var P = PERSONAL, mail = 'mailto:contact@lesaruss.com?subject=' + encodeURIComponent('This is not my business: ' + P.name);
    if (P.starting) { main.innerHTML = head('Your business', esc(P.name), esc([P.street, P.city].filter(Boolean).join(', '))) + '<div class="rg-waiting"><span class="rg-spin"></span>Running your check. This takes about a minute.</div>'; return; }
    main.innerHTML = head('Your business', esc(P.name), esc([P.street, P.city].filter(Boolean).join(', '))) +
      '<p class="dg-sub">We looked at your page, your Google listing and your website. Here is what we found, and what you can do about it first.</p>' +
      '<div class="rg-find"><button type="button" class="dg-btn" id="rgRunMine">Run my free check</button></div>' +
      '<span class="dg-status" role="status" style="display:block;margin-top:8px;color:#8a1c12"></span>' +
      '<p class="dg-empty" style="margin-top:14px">This is ' + esc(P.name) + (P.street ? ', ' + esc(P.street) : '') + '. <a href="' + mail + '">Not your business? Tell us.</a></p>';
    document.getElementById('rgRunMine').addEventListener('click', function () { runFree({ listing_slug: P.slug }); });
    try { if (sessionStorage.getItem('rg_autorun')) { sessionStorage.removeItem('rg_autorun'); runFree({ listing_slug: P.slug }); } } catch (e) {}
  }
  function auditApi(body) {
    var tok = token(), h = { 'Content-Type': 'application/json' };
    if (tok) h.Authorization = 'Bearer ' + tok;
    return fetch(AUDIT_URL, { method: 'POST', headers: h, body: JSON.stringify(body) }).then(function (r) { return r.json().then(function (d) { d._status = r.status; return d; }); });
  }
  // Each check belongs to one of the fixes (ve_audit_criteria.chapter), so an audit puts the fixes in order.
  function loadCriteria(then) {
    if (CRIT) return then && then();
    auditApi({ action: 'criteria' }).then(function (d) { CRIT = {}; (d.criteria || []).forEach(function (c) { CRIT[c.key] = c; }); if (then) then(); }).catch(function () { CRIT = {}; if (then) then(); });
  }
  var LAST = null; // the latest audit this browser ran or opened: {id, items or todo}
  function flagged() {
    var w = {};
    if (!LAST || !CRIT) return w;
    (LAST.items || []).forEach(function (it) { if (it.state === 'fix' && it.chapter) w[it.chapter] = (w[it.chapter] || 0) + (it.weight || 1); });
    (LAST.todo || []).forEach(function (it) { var c = CRIT[it.key]; if (c && c.chapter) w[c.chapter] = (w[c.chapter] || 0) + 1; });
    return w;
  }
  function loadLast(then) {
    var id = recall('rg_last_audit');
    if (!id || LAST) return then && then();
    auditApi({ action: 'get', id: id }).then(function (d) { if (d && d.status === 'done') LAST = d; if (then) then(); }).catch(function () { if (then) then(); });
  }
  var auditView = 0; // bumps on every view, so an old poll stops drawing
  var PICK = null;
  function viewAudit(sub) {
    var parts = String(sub || '').split('/');
    if (parts[0] === 'r' && parts[1]) return viewAuditResult(parts[1]);
    if (parts[0] === 'shopper' && parts[1]) return viewShopper(parts[1]);
    if (PERSONAL) { if (PERSONAL.id) return viewAuditResult(PERSONAL.id); return viewPersonal(); }
    if (!isAdmin()) return viewInvite();
    var v = ++auditView;
    main.innerHTML = head('Your audit', 'A free check of your restaurant',
      'We look at your Google listing, your website, how you show up in search, and your Instagram, then list what you can fix right away. It takes about a minute.') +
      '<div class="rg-find"><input type="search" id="rgFind" placeholder="Your restaurant\'s name" aria-label="Find your restaurant" autocomplete="off"></div>' +
      '<div class="rg-hits" id="rgHits"></div>' +
      '<details class="rg-manual"><summary>Not in our Directory? Enter your details</summary><form id="rgManual" class="dg-form">' +
      '<div class="dg-two"><label class="dg-field"><span>Restaurant name</span><input name="name" required maxlength="120"></label>' +
      '<label class="dg-field"><span>City</span><input name="city" required maxlength="80"></label></div>' +
      '<div class="dg-two"><label class="dg-field"><span>Website <i>(optional)</i></span><input name="website" maxlength="300" placeholder="example.com"></label>' +
      '<label class="dg-field"><span>Instagram <i>(optional)</i></span><input name="instagram" maxlength="120" placeholder="@yourrestaurant"></label></div>' +
      '<button type="submit" class="dg-btn">Run my free check</button></form></details>' +
      '<span class="dg-status" role="status" style="display:block;margin-top:8px;color:#8a1c12"></span>' +
      '<div id="rgMine"></div>';
    var input = document.getElementById('rgFind'), hits = document.getElementById('rgHits'), t;
    input.addEventListener('input', function () {
      clearTimeout(t);
      var q = input.value.trim();
      if (q.length < 2) { hits.innerHTML = ''; return; }
      t = setTimeout(function () {
        auditApi({ action: 'find', q: q }).then(function (d) {
          if (v !== auditView) return;
          var ls = d.listings || [];
          hits.innerHTML = ls.length ? ls.map(function (l) { return '<button type="button" class="rg-hit" data-pick="' + esc(l.slug) + '">' + esc(l.name) + '<span>' + esc(l.city || '') + ' &middot; Check it</span></button>'; }).join('')
            : '<p class="dg-empty">No match in the Directory. Enter your details below instead.</p>';
        });
      }, 220);
    });
    document.getElementById('rgManual').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      runFree({ name: f.name.value.trim(), city: f.city.value.trim(), website: f.website.value.trim(), instagram: f.instagram.value.trim() });
    });
    if (token()) drawMine(v);
  }
  function runFree(target) {
    setStatus('');
    var body = { action: 'free' }; for (var k in target) body[k] = target[k];
    main.querySelector('.rg-find') && (main.querySelector('.rg-find').innerHTML = '<div class="rg-waiting"><span class="rg-spin"></span>Starting your check...</div>');
    auditApi(body).then(function (d) {
      if (d && d.id) { store('rg_last_audit', d.id); LAST = null; location.hash = '#/audit/r/' + d.id; return; }
      viewAudit(''); setStatus((d && d.message) || 'That did not start. Try again in a minute.');
    }).catch(function () { viewAudit(''); setStatus('That did not start. Try again in a minute.'); });
  }
  // A member's audits: what they bought (and its re-check) and their free checks.
  function drawMine(v) {
    auditApi({ action: 'mine' }).then(function (d) {
      var el = document.getElementById('rgMine'); if (!el || v !== auditView) return;
      var orders = d.orders || [], audits = (d.audits || []).filter(function (a) { return a.status === 'done'; });
      if (!orders.length && !audits.length) return;
      var date = function (s) { return s ? new Date(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''; };
      el.innerHTML = '<h3 class="dg-k" style="margin:24px 0 10px">Your audits</h3><div class="dg-rows">' +
        orders.map(function (o) {
          var re = o.recheck_audit_id ? 'Re-check ready' : 'Re-check ' + date(o.recheck_at);
          var shop = o.tier === 'shopper' ? (o.shopper_status === 'reported' ? ' &middot; <a href="#/audit/shopper/' + esc(o.id) + '" style="color:var(--g);font-weight:800">Secret Shopper report</a>' : ' &middot; Secret Shopper visit coming') : '';
          return '<div class="dg-row"><div class="dg-row-main"><b>' + esc(o.business || 'Your restaurant') + '</b><span>' + (o.tier === 'shopper' ? 'Full audit with Secret Shopper' : 'Full audit') + ' &middot; ' + esc(date(o.paid_at)) + ' &middot; ' + esc(re) + shop + '</span></div>' +
            '<span class="dg-tag dg-tag-live">Paid</span><a class="dg-btn dg-ghost" href="#/audit/r/' + esc(o.recheck_audit_id || o.audit_id || '') + '">Open</a></div>';
        }).join('') +
        audits.slice(0, 6).map(function (a) {
          return '<div class="dg-row"><div class="dg-row-main"><b>' + esc(a.business || 'Your restaurant') + '</b><span>' + (a.tier === 'full' ? 'Full audit' : 'Free check') + ' &middot; ' + esc(date(a.created_at)) + '</span></div>' +
            '<span class="dg-tag dg-tag-off">' + (a.tier === 'full' ? 'Full' : 'Free') + '</span><a class="dg-btn dg-ghost" href="#/audit/r/' + esc(a.id) + '">Open</a></div>';
        }).join('') + '</div>';
    }).catch(function () {});
  }
  // The Secret Shopper report, for the owner who bought it (ve-restaurant-audit shopper_get answers them once it is sent).
  function viewShopper(id) {
    var v = ++auditView;
    main.innerHTML = crumb([[AL(), '#/audit'], ['Secret Shopper report']]) + '<div class="dg-loading">Loading your report...</div>';
    if (!token()) { main.innerHTML = crumb([[AL(), '#/audit'], ['Secret Shopper report']]) + '<p class="dg-empty">Sign in to read your Secret Shopper report.</p><button type="button" class="dg-btn" data-signin>Sign in</button>'; return; }
    auditApi({ action: 'shopper_get', order_id: id }).then(function (d) {
      if (v !== auditView) return;
      if (!d.id) { main.innerHTML = crumb([[AL(), '#/audit'], ['Secret Shopper report']]) + '<p class="dg-empty">' + (d._status === 403 ? 'Your report shows here once our shopper sends it.' : 'We could not find that report.') + '</p>'; return; }
      var r = d.report || {}, rate = function (x) { return x ? '<span class="rg-st rg-st-' + (x >= 4 ? 'good' : x === 3 ? 'review' : 'fix') + '">' + x + ' of 5</span>' : ''; };
      var part = function (title, rating, lines) {
        var body = lines.filter(function (l) { return l[1] != null && l[1] !== ''; }).map(function (l) { return '<p><strong>' + esc(l[0]) + ':</strong> ' + esc(l[1]) + '</p>'; }).join('');
        return '<div class="rg-item">' + (rating ? rate(rating) : '<span></span>') + '<div><b>' + esc(title) + '</b></div>' + body + '</div>';
      };
      var g = function (sec, k) { return (r[sec] || {})[k]; };
      var KN = { food: 'The food', room: 'The dining room', menu: 'The menu', restroom: 'The restroom', outside: 'Outside', receipt: 'Receipt', other: 'Photo' };
      main.innerHTML = crumb([[AL(), '#/audit'], ['Secret Shopper report']]) +
        head('Secret Shopper report', esc(d.place.name), 'Our shopper visited as a normal guest' + (g('visit', 'date') ? ' on ' + esc(new Date(g('visit', 'date') + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })) : '') + '. Here is what they found.') +
        '<div class="rg-score rg-score7"><div class="rg-main"><b>' + (g('summary', 'overall') || '&ndash;') + '<small style="font-size:16px"> of 5</small></b><span>Overall</span></div>' +
        [['welcome', 'Welcome'], ['wait', 'Wait'], ['menu', 'Menu'], ['food', 'Food'], ['clean', 'Clean'], ['staff', 'Staff']].map(function (x) { return '<div><b>' + (g(x[0], 'rating') || '&ndash;') + '</b><span>' + x[1] + '</span></div>'; }).join('') + '</div>' +
        '<div class="rg-todo">' +
        part('What went well', 0, [['', g('summary', 'went_well')]]).replace('<strong>:</strong> ', '') +
        part('What to fix first', 0, [['', g('summary', 'to_fix')]]).replace('<strong>:</strong> ', '') +
        part('The welcome', g('welcome', 'rating'), [['Greeted', g('welcome', 'greeted')], ['What happened', g('welcome', 'notes')]]) +
        part('The wait', g('wait', 'rating'), [['Minutes until they ordered', g('wait', 'order_min')], ['Minutes until the food came', g('wait', 'food_min')], ['Notes', g('wait', 'notes')]]) +
        part('The menu and Vegan labels', g('menu', 'rating'), [['Vegan labels', g('menu', 'labeled')], ['Notes', g('menu', 'notes')]]) +
        part('The food', g('food', 'rating'), [['What they ordered', g('visit', 'ordered')], ['Notes', g('food', 'notes')]]) +
        part('Cleanliness', g('clean', 'rating'), [['Notes', g('clean', 'notes')]]) +
        part('The staff', g('staff', 'rating'), [['They asked', g('staff', 'question')], ['The answer', g('staff', 'answer')], ['Notes', g('staff', 'notes')]]) +
        part('Would they go back?', 0, [['', g('summary', 'return')]]).replace('<strong>:</strong> ', '') +
        '</div>' +
        ((r.photos || []).filter(function (p) { return p.kind !== 'receipt'; }).length ? '<h3 class="dg-k" style="margin:18px 0 8px">Photos</h3><div class="dg-gallery">' + r.photos.filter(function (p) { return p.kind !== 'receipt'; }).map(function (p) {
          return '<figure class="dg-gp"><a href="' + esc(p.url || '') + '" target="_blank" rel="noopener"><span style="background-image:url(\'' + esc(p.url || '') + '\')"></span></a><figcaption>' + esc(KN[p.kind] || 'Photo') + (p.caption ? ': ' + esc(p.caption) : '') + '</figcaption></figure>';
        }).join('') + '</div>' : '') +
        '<p class="rg-fine">Want help with what it found? <a href="mailto:contact@lesaruss.com?subject=' + encodeURIComponent('Secret Shopper report: ' + d.place.name) + '">Write to our team</a>. What you paid counts toward our managed services within 30 days of your order.</p>';
    }).catch(function () { if (v === auditView) main.innerHTML = crumb([[AL(), '#/audit']]) + '<p class="dg-empty">We could not load your report just now. Refresh to try again.</p>'; });
  }
  function viewAuditResult(id) {
    var v = ++auditView, tries = 0;
    main.innerHTML = crumb([[AL(), '#/audit'], ['Your results']]) + '<div class="rg-waiting"><span class="rg-spin"></span>Checking your Google listing, website, search and Instagram. This takes about a minute.</div>';
    (function poll() {
      auditApi({ action: 'get', id: id }).then(function (d) {
        if (v !== auditView) return;
        if (d.status === 'running' || d.status === 'queued') { if (++tries < 40) setTimeout(poll, 3000); else main.querySelector('.rg-waiting').textContent = 'This is taking longer than usual. Refresh in a minute.'; return; }
        if (d.error || d.status !== 'done') { main.innerHTML = crumb([[AL(), '#/audit'], ['Your results']]) + '<p class="dg-empty">' + esc(d.error || 'We could not find that audit.') + ' <a href="#/audit">Run a new check</a></p>'; return; }
        LAST = d; store('rg_last_audit', d.id);
        loadCriteria(function () { if (v === auditView) (d.full ? drawFull(d) : drawFree(d)); });
      }).catch(function () { if (v === auditView && ++tries < 40) setTimeout(poll, 4000); });
    })();
  }
  function itemRow(it, full) {
    var c = CRIT && CRIT[it.key] || {};
    var ch = it.chapter || c.chapter;
    return '<div class="rg-item"><span class="rg-st rg-st-' + esc(it.state || 'fix') + '">' + esc(STATE[it.state || 'fix']) + '</span><div><span class="rg-area">' + esc(AREA[it.area || c.area] || '') + '</span><br><b>' + esc(it.label || c.label || it.key) + '</b></div>' +
      (it.found ? '<p>' + esc(it.found) + '</p>' : '') +
      (full && it.why ? '<p>' + esc(it.why) + '</p>' : '') + (full && it.how && it.state !== 'good' ? '<p class="rg-how"><strong>How to fix it:</strong> ' + esc(it.how) + '</p>' : '') +
      (member() && ch && it.state === 'fix' ? '<a href="#/fixes/' + esc(ch) + '">Read the fix in the Guide &rsaquo;</a>' : '') +
      (member() && it.state === 'fix' ? ' <a href="#" class="rg-have" data-managed="audit" data-fix="' + esc(ch || it.key) + '" data-business="' + esc(LAST && LAST.business || '') + '">Or have us do it &rsaquo;</a>' : '') + '</div>';
  }
  function drawFree(d) {
    var n = (d.todo || []).length;
    main.innerHTML = crumb([[AL(), '#/audit'], [d.business || 'Your results']]) +
      head('Your free check', esc(d.business || 'Your restaurant') + ': ' + (n ? n + ' thing' + (n === 1 ? '' : 's') + ' to fix right away' : 'nothing urgent on the free list'),
        n ? 'Most important first, each with what we found. Fix these and you are already ahead of most restaurants.' : 'The free checks came back clean. The full audit looks at much more.') +
      (n ? '<div class="rg-todo">' + d.todo.map(function (it) { return itemRow({ key: it.key, label: it.label, area: it.area, found: it.found, state: 'fix' }, false); }).join('') + '</div>' : '') +
      (d.more_fix && member() ? '<p class="dg-lede"><strong>' + d.more_fix + ' more</strong> to fix in the full audit, each with why it matters and how to fix it.</p>' : '') +
      (!member() ? '<div class="rg-next" style="margin-top:18px"><h3 class="dg-k" style="margin:0 0 6px">Next</h3><p class="dg-lede" style="margin:0 0 10px">Take the short survey and the rest of this Guide opens: the top challenges, your page, your dashboard, and what is coming. Free, no card.</p><button type="button" class="dg-btn" data-survey>Take the short survey</button></div>' : '') +
      (PERSONAL && (d.created_at || d.finished_at) ? '<p class="dg-empty" style="margin-top:14px">Checked on ' + esc(new Date(d.finished_at || d.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })) + '.</p>' : '') +
      '<div id="rgOffer"></div>' + notYou();
    drawOffer(d);
  }
  function drawFull(d) {
    var items = d.items || [], fix = items.filter(function (i) { return i.state === 'fix'; }), rest = items.filter(function (i) { return i.state !== 'fix'; });
    var areas = d.areas || {};
    var pctOf = function (a) { return a && a.max ? Math.round(100 * a.score / a.max) + '%' : '&ndash;'; };
    main.innerHTML = crumb([[AL(), '#/audit'], [d.business || 'Your results']]) +
      head('Your full audit', esc(d.business || 'Your restaurant'), 'Every check, with why it matters and how to fix it. Fix first, then the rest.') +
      '<div class="rg-score"><div class="rg-main"><b>' + (d.max_score ? Math.round(100 * d.score / d.max_score) + '%' : '&ndash;') + '</b><span>Overall</span></div>' +
      ['google', 'seo', 'web', 'social'].map(function (k) { return '<div><b>' + pctOf(areas[k]) + '</b><span>' + esc(AREA[k]) + '</span></div>'; }).join('') + '</div>' +
      (fix.length ? '<h3 class="dg-k" style="margin:0 0 8px">To fix (' + fix.length + ')</h3><div class="rg-todo">' + fix.sort(function (a, b) { return (b.weight || 0) - (a.weight || 0); }).map(function (i) { return itemRow(i, true); }).join('') + '</div>' : '') +
      '<h3 class="dg-k" style="margin:18px 0 8px">Everything else</h3><div class="rg-todo">' + rest.map(function (i) { return itemRow(i, true); }).join('') + '</div>' +
      '<p class="rg-fine">Want us to take care of it? Our managed services handle your Google listing, website and social for you. Reply to your audit email, or <a href="mailto:contact@lesaruss.com?subject=' + encodeURIComponent('Managed services for ' + (d.business || 'my restaurant')) + '">write to our team</a>.</p>';
  }
  // The full audit (Sean, 2026-10-10: "Go with $49 and $149"): its own add-on, never part of the Guide.
  function drawOffer(d) {
    var el = document.getElementById('rgOffer'); if (!el || !member()) return;
    var t = d.target || {}, body = { action: 'offer' };
    if (t.listing_slug) body.listing_slug = t.listing_slug; else { body.name = t.name; body.city = t.city; }
    auditApi(body).then(function (o) {
      el = document.getElementById('rgOffer'); if (!el) return;
      var plan = function (tier, title, price, lines, hot) {
        return '<div class="rg-plan' + (hot ? ' rg-hot' : '') + '"><h3>' + esc(title) + '</h3><div class="rg-price">$' + price + '<small>one time</small></div><ul>' + lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' +
          '<button type="button" class="dg-btn" data-buy="' + tier + '" data-audit="' + esc(d.id) + '">Get the ' + (tier === 'shopper' ? 'audit and visit' : 'full audit') + '</button></div>';
      };
      PICK = t;
      el.innerHTML = '<h3 class="dg-k" style="margin:22px 0 10px">Go deeper</h3><div class="rg-offer">' +
        plan('full', 'The full audit', 49, ['Every check: Google, search, your website and social', 'Why each one matters and how to fix it', 'Your score, and where it is lowest', 'We run it again in 90 days so you can see what changed']) +
        (o.shopper ? plan('shopper', 'The full audit and a Secret Shopper', 149, ['Everything in the full audit', 'A visit from our ' + (o.city ? o.city + ' ' : '') + 'team: they order, eat and report', 'The welcome, the wait, the menu, Vegan labeling, cleanliness and how well your staff know the menu', 'A written report with photos. You will not know the day'], 1) : '') +
        '</div><p class="rg-fine">If you sign up for our managed services within 30 days, what you paid counts toward it. The full audit is separate from this Guide.</p>' +
        '<span class="dg-status" role="status" style="display:block;margin-top:8px;color:#8a1c12"></span>';
    }).catch(function () {});
  }
  function buyAudit(btn) {
    var tier = btn.getAttribute('data-buy'), a = auth();
    if (!token()) {
      if (a) a.showAuthModal('Create your account, or sign in, to buy the full audit. It is $' + (tier === 'shopper' ? '149' : '49') + ', one time.', function () { location.reload(); }, 'signup');
      return;
    }
    var t = PICK || {}, body = { action: 'checkout', tier: tier };
    if (t.listing_slug) body.listing_slug = t.listing_slug; else { body.name = t.name; body.city = t.city; body.website = t.website; body.instagram = t.instagram; }
    btn.disabled = true; btn.textContent = 'Opening checkout...';
    auditApi(body).then(function (d) {
      if (d && d.url) { (window.top || window).location.href = d.url; return; }
      throw d;
    }).catch(function (d) { btn.disabled = false; btn.textContent = tier === 'shopper' ? 'Get the audit and visit' : 'Get the full audit'; setStatus((d && d.message) || 'Checkout did not open. Try again in a minute.'); });
  }

  // ---------- the fixes ----------
  // Every fix in the Guide's order; a member's own order puts what their audit flagged first.
  function allFixes() {
    var byId = {}; (MEM ? MEM.fixes : []).forEach(function (f) { byId[f.id] = f; }); byId[PUB.fix_example.id] = PUB.fix_example;
    return PUB.titles.map(function (t) { return byId[t[0]] || { id: t[0], title: t[1], locked: 1 }; });
  }
  function orderedFixes() {
    var list = allFixes(), c = GV.counts.fix || {};
    return list.map(function (f, i) { return [f, i]; }).sort(function (a, b) { return (c[b[0].id] || 0) - (c[a[0].id] || 0) || a[1] - b[1]; }).map(function (x) { return x[0]; });
  }
  function doneSet() { try { return JSON.parse(recall('rg_fixes_done') || '{}'); } catch (e) { return {}; } }
  function viewFixes(id) {
    var go = function () { if (curTab === 'fixes') draw(); };
    if (!gvLoaded) loadGVotes(go);
    function draw() {
      if (id) return viewFix(id);
      var list = orderedFixes();
      var tiles = list.map(function (f) {
        var open = !f.locked;
        return row({ icon: fixIcon(f.id), title: f.title, href: open ? '#/fixes/' + f.id : '',
          pre: (!member() && f.id === PUB.fix_example.id ? '<span class="dg-free">Free to try</span>' : ''),
          body: open ? '<p class="dg-srow-p">' + esc(f.problem) + '</p>' : '<p class="dg-srow-p">' + LOCK_SVG + ' In the full Guide</p>',
          acts: pollBtn(f.id) + (member() ? saveBtn('fix', f.id) : '') });
      }).join('');
      main.innerHTML = head('Top challenges', 'The top 10 things Vegan businesses run into',
        'This is not a review of your business. It is a checklist of the most common challenges. ' + (member() ? 'Tick the ones you relate to. The ranking comes from everyone who uses this Guide, so you can see what comes up most.' : 'One is open for you to try.')) +
        (member() ? '<div class="dg-srows">' + tiles + '</div>'
          : '<div class="dg-srows">' + tiles + '</div><div style="margin-top:16px">' + gated(skel('Every challenge', 4), 'All ten challenges', 'Each with what to do this week, ranked by the owners who relate to them.') + '</div>');
    }
    draw();
  }
  function viewFix(id) {
    var list = orderedFixes(), i = -1;
    list.forEach(function (f, n) { if (f.id === id) i = n; });
    var f = list[i];
    if (!f || f.locked) {
      main.innerHTML = crumb([['Top challenges', '#/fixes'], [f ? f.title : 'Challenge']]) + gated(skel(f ? f.title : '', 6), f ? f.title : 'This fix', 'It opens with the full Guide, with every other fix.');
      return;
    }
    var nextOpen = null; for (var n = i + 1; n < list.length; n++) if (!list[n].locked) { nextOpen = list[n]; break; }
    main.innerHTML = crumb([['Top challenges', '#/fixes'], [f.title]]) +
      '<div class="rg-fix">' +
      '<div class="dg-head"><div><div class="dg-k">No. ' + (i + 1) + ' of ' + list.length + '</div><h2 class="dg-h1">' + esc(f.title) + '</h2></div>' + (member() ? '<div class="dg-acts" style="flex-direction:row">' + saveBtn('fix', f.id) + '</div>' : '') + '</div>' +
      '<p class="rg-problem">' + esc(f.problem) + '</p><h3>What you can do</h3><ul>' + f.list.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<h3>This week</h3><div class="rg-week"><b>Your action</b>' + esc(f.action) + '</div>' +
      '<div class="rg-week" style="margin-top:12px"><b>Rather we did it?</b>Our team can take this off your plate, along with your website, Google, photos and brand. ' +
      '<a href="#" data-managed="fix" data-fix="' + esc(f.id) + '" data-business="' + esc(LAST && LAST.business || '') + '">Have us do it &rsaquo;</a></div>' +
      '<div class="rg-fixnav">' + pollBtn(f.id) +
      (nextOpen ? '<a class="dg-tnav next" href="#/fixes/' + nextOpen.id + '">Next challenge &rsaquo;</a>' : member() ? '<a class="dg-tnav next" href="#/featured">Claim your page &rsaquo;</a>' : '<a class="dg-tnav next" href="#/join">See all ten &rsaquo;</a>') + '</div></div>' +
      (!member() ? '<div style="margin-top:22px">' + gated(skel('The other nine', 3), 'The other nine challenges', 'Location, branding, search, social, photos, reviews, the menu, community and burnout, ranked by owners.') + '</div>' : '');
  }

  // ---------- the Pulse: research and our interviews ----------
  var LOCKED_FACTS = ['Replying to reviews wins customers', 'Restaurants last longer than the myth says'];
  // An interview is its podcast episode, the row a person's page uses (VEEpisodes.row): the show's square artwork, the title, the
  // show, date and length, Play in the player docked above the list, then our vote and Save (My list). Two across.
  function podCard(p) {
    var ep = p.ep;
    if (!ep || !window.VEEpisodes) return '';
    var show = { name: p.show.name, slug: p.show.slug, image: p.show.logo_url || '' };
    return VEEpisodes.row(Object.assign({}, ep, { summary: '', image: show.image || ep.image || '' }), show,
      { showName: true, acts: member() ? gvoteBtn(p.slug) + saveBtn('episode', p.slug) : '' });
  }
  function podKey(p) { return '|' + p.ep.guid; }
  function playPod(slug) {
    var p = (PODS || []).filter(function (x) { return x.slug === slug; })[0];
    if (p && p.ep && window.VEEpisodes) VEEpisodes.play(Object.assign({}, p.ep, { image: p.show.logo_url || p.ep.image || '' }), { name: p.show.name, image: p.show.logo_url || '' });
  }
  // The Pulse redraws when votes load, which would drop a playing episode: the player moves into the new dock (a move in the same
  // task keeps it playing) or, off the Pulse, to the foot of the window.
  function keepPlayer(bar) {
    if (!bar) return;
    // A view that started another episode while it drew made a new player: the old one stops and stays out (two showed, 2026-10-31).
    var cur = document.getElementById('vep-player');
    if (cur && cur !== bar) { var old = bar.querySelector('audio'); if (old) old.pause(); return; }
    var dock = main.querySelector('.vep-dock[data-vep-always]');
    if (dock) { bar.classList.add('docked'); document.body.classList.remove('vep-on'); dock.appendChild(bar); }
    else { bar.classList.remove('docked'); document.body.classList.add('vep-on'); document.body.appendChild(bar); }
  }
  function viewPulse(sub) {
    var parts = String(sub || '').split('/'), m = parts[0] === 'research' || parts[0] === 'fact' ? 'research' : 'listen';
    if ((parts[0] === 'watch' || parts[0] === 'listen') && parts[1]) { viewPulse(''); playPod(decodeURIComponent(parts[1])); return; }
    var t = toggles([['Interviews', '#/pulse'], ['The research', '#/pulse/research']], m === 'research' ? 'The research' : 'Interviews');
    var html = head('The Restaurant Pulse', m === 'research' ? 'What the research says' : 'Interviews with business owners',
      m === 'research' ? 'Every fact with its source linked.' : 'Owners and founders on what worked, what did not, and what they would do again. New ones keep coming.', t);
    if (m === 'research') {
      var facts = PUB.why.concat(MEM ? MEM.why : LOCKED_FACTS.map(function (x) { return { title: x, locked: 1 }; }));
      var n = Math.max(0, Math.min(facts.length - 1, parseInt(parts[0] === 'fact' ? parts[1] : 0, 10) || 0)), f = facts[n];
      html += '<div class="dg-facts2"><div class="dg-fact-list" role="list">' + facts.map(function (x, i) {
        return '<a role="listitem" href="#/pulse/fact/' + i + '" aria-current="' + (i === n) + '"><span>' + (i + 1) + '</span>' + esc(x.title) + (x.locked ? ' ' + LOCK_SVG : '') + '</a>';
      }).join('') + '</div><div class="dg-fact">' + (f.locked
        ? gated(skel(f.title, 5), 'More facts, every one sourced', 'Reviews, how long restaurants last, and what keeps them open, each with its study linked.')
        : '<h3>' + esc(f.title) + '</h3><p>' + esc(f.text) + '</p>' + sources(f.sources) +
          (n < facts.length - 1 ? '<a class="dg-fact-next" href="#/pulse/fact/' + (n + 1) + '">Next fact &rsaquo;</a>' : '')) + '</div></div>';
    } else {
      var pods = PODS ? PODS.map(function (x, i) { return [x, i]; }).sort(function (a, b) { return gvCount(b[0].slug) - gvCount(a[0].slug) || a[1] - b[1]; }).map(function (x) { return x[0]; }) : null;
      var grid = pods ? (pods.length ? '<div class="vep-list">' + pods.map(podCard).join('') + '</div>' : '<p class="dg-empty">No interviews yet.</p>') : '<div class="dg-loading">Loading...</div>';
      if (member() && !gvLoaded) loadGVotes(function () { if (curTab === 'pulse' && !/research|fact/.test(location.hash)) viewPulse(''); });
      html += member() ? '<div class="vep-dock" data-vep-always></div><div class="rg-eps">' + grid + '</div>' : gated('<div class="rg-eps">' + grid + '</div>', 'Every interview with business owners', 'Listen to them right here in the Guide.');
    }
    main.innerHTML = html;
  }

  // ---------- Get featured: the Directory ----------
  function viewFeatured(sub) {
    if (sub && sub.indexOf('listing/') === 0) return viewListing(decodeURIComponent(sub.slice(8)));
    if (PERSONAL) return viewListing(PERSONAL.slug, true);
    var ph = PERSONAL ? '/directory/' + encodeURIComponent(PERSONAL.slug) : '/directory', ch = PERSONAL ? '/claim?listing=' + encodeURIComponent(PERSONAL.slug) : '/claim';
    var steps = [
      ['Find your page', 'Your page is already in the Directory. Members find you by city, search and category.', ph, PERSONAL ? 'See your page' : 'See the Directory'],
      ['Claim it', 'Claiming makes the page yours. Our team reviews every claim to make sure it is accurate.', ch, 'Claim your listing'],
      ['Make it yours', 'Add your hours, photos and menu link, and change them whenever you like.', '/business', 'See what you can do'],
      ['Tell people', 'Members vote for the places they love, and the most voted rise to the top of your city.', '/directory', 'See the Directory']
    ];
    main.innerHTML = head('Claim your page', 'Your page already exists. Claiming makes it yours.',
      'Claiming is a short form. The $11, 1,100 points or the Partner plan covers it, and we show you which when you start.') +
      '<div class="rg-steps">' + steps.map(function (st, i) { return '<div class="rg-step"><em>' + (i + 1) + '</em><b>' + esc(st[0]) + '</b><p>' + esc(st[1]) + '</p><a href="' + st[2] + '">' + esc(st[3]) + ' &rsaquo;</a></div>'; }).join('') + '</div>' +
      (PERSONAL ? '' : '<h3 class="dg-k" style="margin:0 0 8px">Find your restaurant</h3><div class="rg-find"><input type="search" id="rgPage" placeholder="Your restaurant\'s name" aria-label="Find your restaurant\'s page" autocomplete="off"></div><div class="rg-hits" id="rgPageHits"></div>') +
      '<h3 class="dg-k" style="margin:18px 0 8px">Restaurants members vote for</h3>' + (TOP ? '<div class="vrd-root"><div class="rank-grid" id="rgTop">' + TOP.map(function (l, i) { return window.VERegionDirectory ? VERegionDirectory.card(l, i) : ''; }).join('') + '</div></div>' : '<div class="dg-loading">Loading...</div>');
    var input = document.getElementById('rgPage'), hits = document.getElementById('rgPageHits'), t;
    if (input) input.addEventListener('input', function () {
      clearTimeout(t); var q = input.value.trim();
      if (q.length < 2) { hits.innerHTML = ''; return; }
      t = setTimeout(function () {
        auditApi({ action: 'find', q: q }).then(function (d) {
          var ls = d.listings || [];
          hits.innerHTML = ls.length ? ls.map(function (l) { return '<a class="rg-hit" href="#/featured/listing/' + encodeURIComponent(l.slug) + '">' + esc(l.name) + '<span>' + esc(l.city || '') + ' &middot; Open the page</span></a>'; }).join('')
            : '<p class="dg-empty">Not in the Directory yet. <a href="/claim?add=1">Add your restaurant</a>, it is free.</p>';
        });
      }, 220);
    });
    var top = document.getElementById('rgTop');
    if (top && window.VERegionDirectory) VERegionDirectory.wire(top, function (slug) { location.hash = '#/featured/listing/' + encodeURIComponent(slug); });
  }
  // The demo (door Guides, Sean 2026-11-04): a view-only sample restaurant, its page and its owner's dashboard. Nothing can be saved there.
  ICON.dashboard = ICON.demo || ICON.audit;
  // Their own dashboard, its own tab (Sean, 2026-11-04): the back of their page. Until they claim the page it shows the preview and the way to claim it.
  function viewDashboard() {
    var P = PERSONAL;
    if (!P) { main.innerHTML = head('Your dashboard', 'Your dashboard', 'It opens on your own page. Use the link from your email.'); return; }
    main.innerHTML = head('Your dashboard', esc(P.name),
      'How many people look at your page, where they come from and what they do next, and where you update your page and menu. It opens fully when you claim your page.') +
      '<div class="dg-btns" style="margin-bottom:12px"><a class="dg-btn" href="/claim?listing=' + encodeURIComponent(P.slug) + '">Claim this page</a><a class="dg-btn dg-ghost" href="#/demo">See a sample dashboard</a></div>' +
      '<div class="dg-lframe"><iframe id="dgListingFrame" title="Your dashboard" src="/directory/' + encodeURIComponent(P.slug) + '?tab=brand"></iframe></div>';
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
  function viewDemo() {
    var steps = [
      ['Your page, as visitors see it', 'This is what a member sees when they find a restaurant: the story, hours, menu, photos and the vote.', ''],
      ['Your dashboard', 'Your home base. What is new, how many people looked at your page, and what to do next.', '?tab=brand'],
      ['Insights', 'Who looked, where they came from, and what they did next, by day.', '?tab=brand&pd=insights'],
      ['Your page', 'Where you change your story, hours, contact details and photos. Changes go live at once.', '?tab=brand&pd=page'],
      ['Menu', 'Your menu by section, one item at a time.', '?tab=brand&pd=menu'],
      ['Ads and opportunities', 'The ad spots, and the campaigns and events you can join.', '?tab=brand&pd=opps'],
      ['Your audit', 'Your listing check, and what to fix first.', '?tab=brand&pd=audit']
    ];
    main.innerHTML = head('Try the demo', 'How to use your page and dashboard',
      'Green Leaf Kitchen is a sample restaurant, so you can look around without touching anything real. Pick a step and it opens full screen. Close it when you are done. Yours starts with your own page.') +
      '<div class="dg-srows">' + steps.map(function (st, i) {
        return '<div class="dg-srow"><span class="dg-th rg-th" aria-hidden="true" style="font-weight:900;font-size:20px;color:#1f5f22">' + (i + 1) + '</span><div class="dg-srow-b"><h3>' + esc(st[0]) + '</h3><p>' + esc(st[1]) + '</p></div>' +
          '<div class="dg-acts"><button type="button" class="dg-btn dg-ghost" data-demo="' + esc(st[2]) + '" data-demo-name="' + esc(st[0]) + '">Show me</button></div></div>';
      }).join('') + '</div>';
    [].forEach.call(main.querySelectorAll('[data-demo]'), function (b) { b.addEventListener('click', function () { openDemo(b.getAttribute('data-demo'), b.getAttribute('data-demo-name')); }); });
  }
  // The demo opens full screen over the Guide, with Close (Sean, 2026-11-04: not in a small frame).
  function openDemo(qs, name) {
    var old = document.getElementById('rgDemo'); if (old) old.remove();
    var st = document.getElementById('rgDemoCss');
    if (!st) { st = document.createElement('style'); st.id = 'rgDemoCss'; st.textContent = '#rgDemo{position:fixed;inset:0;z-index:100002;background:#fff;display:flex;flex-direction:column}#rgDemo .rgd-bar{display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid rgba(0,0,0,.12);font:800 14px Montserrat,system-ui,sans-serif}#rgDemo .rgd-bar b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#rgDemo iframe{flex:1;border:0;width:100%}'; document.head.appendChild(st); }
    var w = document.createElement('div'); w.id = 'rgDemo'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', 'Demo: ' + name);
    w.innerHTML = '<div class="rgd-bar"><b>Demo: ' + esc(name) + ' (Green Leaf Kitchen, a sample)</b><button type="button" class="dg-btn" id="rgdClose">Close</button></div><iframe title="Sample restaurant" src="/business/sample' + (qs || '') + '"></iframe>';
    document.body.appendChild(w);
    function close() { w.remove(); document.removeEventListener('keydown', esc2); }
    function esc2(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', esc2);
    document.getElementById('rgdClose').addEventListener('click', close);
  }
  // A Directory page inside the Guide, framed and sized to fit; its own links go through the Guide's address bar.
  function viewListing(slug, mine) {
    main.innerHTML = (mine ? head('Claim your page', 'This is your page', 'It already exists in the Directory, and this is how members see it. Click around. Claiming makes it yours: your hours, photos and menu link, changed whenever you like.') : crumb([['Claim your page', '#/featured'], ['Directory page']])) +
      '<div class="dg-btns" style="margin-bottom:12px"><a class="dg-btn" href="/directory/' + encodeURIComponent(slug) + '?tab=brand">Partner Dashboard</a><a class="dg-btn dg-ghost" href="/claim?listing=' + encodeURIComponent(slug) + '">Claim this page</a></div>' +
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

  // ---------- Promotions ----------
  function viewPromos(k) {
    if (k) {
      var p = PROMOS.filter(function (x) { return x.k === k; })[0];
      if (p) {
        main.innerHTML = crumb([['Promotions', '#/promos'], [p.t]]) +
          '<span class="rg-promo-tag ' + (p.live ? 'rg-live' : 'rg-soon') + '">' + (p.live ? 'Live' : 'Coming') + '</span>' + head('Promotion', esc(p.t), esc(p.what)) +
          '<div class="rg-week" style="margin-bottom:16px"><b>What it does for a restaurant</b>' + esc(p.why) + '</div>' +
          '<div class="dg-btns">' + (p.href ? '<a class="dg-btn" href="' + p.href + '">Get started</a>' : '<a class="dg-btn" href="mailto:contact@lesaruss.com?subject=' + encodeURIComponent(p.t + (p.live ? '' : ': count me in')) + '">' + (p.live ? 'Ask our team' : 'Tell me when it opens') + '</a>') +
          (member() ? saveBtn('promo', p.k) : '') + '<a class="dg-btn dg-ghost" href="#/promos">All promotions</a></div>';
        return;
      }
    }
    main.innerHTML = head('Promotions', 'What we run that brings members through your door',
      'Each one marked Live or Coming. Pick what fits, or ask our team to plan it with you.') +
      '<div class="dg-srows">' + PROMOS.map(function (p) {
        return row({ icon: ICON.promos, title: p.t, href: '#/promos/' + p.k, pre: '<span class="rg-promo-tag ' + (p.live ? 'rg-live' : 'rg-soon') + '">' + (p.live ? 'Live' : 'Coming') + '</span>',
          body: '<p class="dg-srow-p">' + esc(p.what) + '</p>', acts: member() ? saveBtn('promo', p.k) : '' });
      }).join('') + '</div>';
  }

  // ---------- Sourcing (Sean, 2026-11-04, playbook ve-vegan-sourcing-guide, canon canon-ve-vegan-sourcing) ----------
  // Members only. Who to buy from instead of making it yourself, from the shared sourcing directory (ve_suppliers, through
  // ve-sourcing). Each supplier wears one honest label. A kind of supplier we have none of yet says Coming, never an empty list.
  // The address carries the view: #/sourcing/<domain>?kind=&label=&q=.
  var SRC_FN = SB + '/functions/v1/ve-sourcing';
  var SRC_DOMAINS = [
    { k: 'food_drink', t: 'Ready-made food and drink', d: 'Vegan cheese, plant milks, desserts and proteins, made by someone else and ready to serve or sell.' },
    { k: 'ingredients', t: 'Ingredients', d: 'The base ingredients to make it yourself, at the size a kitchen needs.' },
    { k: 'packaging', t: 'Packaging and bottling', d: 'Cups, containers, labels and bottlers, so your food can leave the building.' },
    { k: 'co_packing', t: 'Co-packers and contract makers', d: 'Someone else makes your recipe at scale.' },
    { k: 'machinery', t: 'Machinery for scale', d: 'The equipment that takes a kitchen batch to a production run.' },
    { k: 'materials', t: 'Materials for fashion and beauty makers', d: 'Plant-based leathers, fibers and trims for the people who make clothing and accessories.' },
    { k: 'distribution', t: 'Distributors', d: 'Who gets your product onto shelves.' },
    { k: 'certification', t: 'Certification and testing', d: 'Who checks and certifies that it is vegan.' }
  ];
  var SRC_LABEL = { peta_approved: ['PETA-Approved Vegan', 'peta'], fully_vegan: ['Fully vegan company', 'full'], offers_options: ['Offers vegan options', 'opts'], plant_material: ['Plant-based material', 'mat'], equipment: ['Equipment', 'eqp'] };
  var SRC_ICON = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + ' aria-hidden="true"><path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>';
  var SRC = { counts: null, shown: 0 };
  function srcFetch(body) {
    return fetch(SRC_FN, { method: 'POST', headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ guide: SLUG }, body)) })
      .then(function (r) { return r.json(); });
  }
  function srcParams(sub) {
    var bits = String(sub || '').split('?'), q = {};
    (bits[1] || '').split('&').forEach(function (kv) { var p = kv.split('='); if (p[0]) q[p[0]] = decodeURIComponent((p[1] || '').replace(/\+/g, ' ')); });
    return { domain: bits[0] || '', q: q };
  }
  function srcHash(domain, q) {
    var bits = ['kind', 'label', 'q'].filter(function (k) { return q[k]; }).map(function (k) { return k + '=' + encodeURIComponent(q[k]); });
    return '#/sourcing/' + domain + (bits.length ? '?' + bits.join('&') : '');
  }
  // A material named for the animal product reads as that product, so it shows as "<x> alternatives". Display only: the stored kind
  // keeps the source list's own word, so the filter value, search and later imports never change (Logan, 2026-11-05).
  var SRC_ALT = { leather: 1, suede: 1, down: 1, wool: 1, fur: 1, cashmere: 1, silk: 1, feathers: 1 };
  function kindName(k) {
    var t = String(k || ''); t = t.charAt(0).toUpperCase() + t.slice(1);
    if (String(k).toLowerCase() === 'feathers') t = 'Feather';
    return SRC_ALT[String(k).toLowerCase()] ? t + ' alternatives' : t;
  }
  var SRC_MEAN = {
    peta_approved: 'PETA has approved this company\'s products as Vegan under its own mark.',
    fully_vegan: 'Everything this company sells is Vegan, by what the company says of itself.',
    offers_options: 'A real supplier with Vegan lines. Not everything it sells is Vegan, so check each product with them.',
    plant_material: 'Made from plant fiber. That is a material, not a claim that it is Vegan, so check with the supplier.',
    equipment: 'A maker of machines, not food. Being listed here is about what you can make with them, not a claim that the company is Vegan.'
  };
  function srcRow(s) {
    var L = SRC_LABEL[s.label] || SRC_LABEL.offers_options;
    var kinds = (s.kinds || []).map(kindName).join(', ');
    return row({ icon: s.domain ? pic('src-' + s.domain) : SRC_ICON, title: s.name, href: '#/sourcing/s/' + encodeURIComponent(s.slug), pre: '<span class="rg-lab ' + L[1] + '">' + esc(L[0]) + '</span>',
      body: '<p class="dg-srow-p">' + esc(s.bio || (kinds ? 'Makes: ' + kinds + '.' : '')) + '</p>',
      acts: s.website ? '<a class="dg-btn dg-ghost" href="' + esc(s.website) + '" target="_blank" rel="noopener nofollow">Visit website</a>' : '' });
  }
  function viewSourcing(sub) {
    if (/^make(\/|$)/.test(String(sub || ''))) return viewMake(String(sub).split('?')[0].split('/')[1] || '');
    if (/^s\//.test(String(sub || ''))) return viewSupplier(decodeURIComponent(String(sub).split('?')[0].split('/')[1] || ''));
    var P = srcParams(sub), cur = SRC_DOMAINS.filter(function (d) { return d.k === P.domain; })[0];
    var note = '<p class="dg-lede rg-srcnote">Every supplier wears one label. <b>PETA-Approved Vegan</b> is PETA\'s own mark. <b>Plant-based material</b> means the product is made from plant fiber; that is a material, not a claim that it is Vegan, so check it with them. <b>Offers vegan options</b> is a real supplier with vegan lines: check each product with them. The PETA-Approved Vegan mark and the materials list come from PETA\'s <i>Guide to Vegan Suppliers and Manufacturers</i>, October 2026.</p>';
    var matNote = '<p class="rg-srcmat" id="rgSrcMat" hidden><b>Plant-based material</b> means made from plant fiber. It is a material, not a claim that it is Vegan, so check with the supplier.</p>';
    if (!cur) {
      main.innerHTML = head('Sourcing', 'Buy it from someone who already makes it', 'Not everything has to come out of your kitchen. Pick what you are looking for.') +
        '<div class="dg-srows" id="rgSrcDomains">' + SRC_DOMAINS.map(function (d) { return row({ icon: pic('src-' + d.k), title: d.t, pre: '<span class="rg-promo-tag rg-soon" data-src-tag="' + d.k + '">Checking</span>', body: '<p class="dg-srow-p">' + esc(d.d) + '</p>' }); }).join('') + '</div>' +
        '<div class="dg-srows" style="margin-top:16px">' + row({ icon: pic('src-make'), title: 'Buy or make', href: '#/sourcing/make', pre: '<span class="rg-promo-tag rg-live">Dairy basics</span>', body: '<p class="dg-srow-p">Cheese, cream, butter, milk and more: who sells it ready-made, and the recipe to make it yourself.</p>' }) + '</div>' + note;
      srcFetch({ action: 'list', limit: 1 }).then(function (r) {
        if (curTab !== 'sourcing') return;
        var c = (r && r.counts && r.counts.domain) || {}; SRC.counts = c;
        SRC_DOMAINS.forEach(function (d, i) {
          var el = main.querySelectorAll('.dg-srow')[i]; if (!el) return;
          var tag = el.querySelector('[data-src-tag]'), n = c[d.k] || 0;
          if (tag) { tag.className = 'rg-promo-tag ' + (n ? 'rg-live' : 'rg-soon'); tag.textContent = n ? n + ' suppliers' : 'Coming'; }
          if (n) el.setAttribute('data-href', '#/sourcing/' + d.k);
        });
      }).catch(function () { var t = main.querySelectorAll('[data-src-tag]'); for (var i = 0; i < t.length; i++) t[i].textContent = 'Coming'; });
      return;
    }
    var q = { kind: P.q.kind || '', label: P.q.label || '', q: P.q.q || '' };
    main.innerHTML = crumb([['Sourcing', '#/sourcing'], [cur.t]]) + head('Sourcing', esc(cur.t), esc(cur.d)) +
      '<div class="rg-srcbar"><input type="search" id="rgSrcQ" placeholder="Search suppliers" value="' + esc(q.q) + '" aria-label="Search suppliers">' +
      '<select id="rgSrcLabel" aria-label="Label"><option value="">All labels</option>' + Object.keys(SRC_LABEL).map(function (k) { return '<option value="' + k + '"' + (q.label === k ? ' selected' : '') + '>' + SRC_LABEL[k][0] + '</option>'; }).join('') + '</select>' +
      '<select id="rgSrcKind" aria-label="Kind"><option value="">All kinds</option></select></div>' +
      matNote + '<div class="dg-srows" id="rgSrcList">' + skel('', 3) + '</div><div class="dg-btns" id="rgSrcMore"></div>' + note;
    var listEl = document.getElementById('rgSrcList'), moreEl = document.getElementById('rgSrcMore'), kindEl = document.getElementById('rgSrcKind'), timer = null, seq = 0, got = [];
    function paint(total) {
      listEl.innerHTML = got.length ? got.map(srcRow).join('') : '<p class="dg-lede">Nothing matches. Try fewer filters.</p>';
      var mn = document.getElementById('rgSrcMat'); if (mn) mn.hidden = !got.some(function (x) { return x.label === 'plant_material'; });
      moreEl.innerHTML = got.length < total ? '<button class="dg-btn dg-ghost" id="rgSrcMoreBtn">Show more (' + (total - got.length) + ' left)</button>' : '';
      var b = document.getElementById('rgSrcMoreBtn'); if (b) b.onclick = function () { load(true); };
    }
    function load(more) {
      var my = ++seq; if (!more) got = [];
      srcFetch({ action: 'list', domain: cur.k, kind: q.kind, label: q.label, q: q.q, limit: 48, offset: got.length }).then(function (r) {
        if (my !== seq || curTab !== 'sourcing') return;
        if (!r || !r.ok) { listEl.innerHTML = '<p class="dg-lede">' + (r && r.error === 'guide_required' ? 'The Sourcing tab is for members.' : 'We could not load the suppliers. Try again in a moment.') + '</p>'; return; }
        got = got.concat(r.suppliers || []);
        if (kindEl.options.length <= 1) kindEl.innerHTML = '<option value="">All kinds</option>' + (r.kinds || []).map(function (k) { return '<option value="' + esc(k) + '"' + (q.kind === k ? ' selected' : '') + '>' + esc(kindName(k)) + '</option>'; }).join('');
        paint(r.total);
      }).catch(function () { listEl.innerHTML = '<p class="dg-lede">We could not load the suppliers. Try again in a moment.</p>'; });
    }
    SRC.back = { hash: srcHash(cur.k, q), t: cur.t, k: cur.k };
    function changed() { SRC.back = { hash: srcHash(cur.k, q), t: cur.t, k: cur.k }; history.replaceState(null, '', SRC.back.hash); load(false); }
    document.getElementById('rgSrcQ').addEventListener('input', function (e) { q.q = e.target.value; clearTimeout(timer); timer = setTimeout(changed, 250); });
    document.getElementById('rgSrcLabel').addEventListener('change', function (e) { q.label = e.target.value; changed(); });
    kindEl.addEventListener('change', function (e) { q.kind = e.target.value; changed(); });
    load(false);
  }

  // One supplier on its own (#/sourcing/s/<slug>): the whole bio, the label and what it means, what they make, their website. The list
  // clamps each bio to two rows, so this is where a supplier is read in full. The crumb goes back to the list it was opened from.
  function viewSupplier(slug) {
    var back = SRC.back, trail = [['Sourcing', '#/sourcing']];
    if (back && back.make) trail.push(['Buy or make', '#/sourcing/make']);
    if (back) trail.push([back.t, back.hash]);
    main.innerHTML = crumb(trail.concat([['...']])) + '<div id="rgSup">' + skel('', 3) + '</div>';
    srcFetch({ action: 'get', slug: slug }).then(function (r) {
      if (curTab !== 'sourcing') return;
      var box = document.getElementById('rgSup'); if (!box) return;
      if (!r || !r.ok) { box.innerHTML = '<p class="dg-lede">' + (r && r.error === 'not_found' ? 'We could not find that supplier.' : 'We could not load this. Try again in a moment.') + ' <a href="' + (back ? back.hash : '#/sourcing') + '">Back</a></p>'; return; }
      var s = r.supplier, L = SRC_LABEL[s.label] || SRC_LABEL.offers_options;
      var dom = SRC_DOMAINS.filter(function (d) { return d.k === s.domain; })[0];
      // A list remembered from earlier counts only when it is this supplier's own domain (opened by link after another list, it is not).
      if (back && !back.make && back.k && back.k !== s.domain) { back = null; trail = [['Sourcing', '#/sourcing']]; }
      if (!back && dom) trail.push([dom.t, '#/sourcing/' + dom.k]);
      var c = main.querySelector('.dg-crumb'); if (c) c.outerHTML = crumb(trail.concat([[s.name]]));
      box.innerHTML = head(dom ? dom.t : 'Sourcing', esc(s.name), '') +
        '<div class="rg-sup"><span class="rg-lab ' + L[1] + '">' + esc(L[0]) + '</span><p class="rg-sup-mean">' + esc(SRC_MEAN[s.label] || '') + '</p>' +
        (s.bio ? '<p class="rg-sup-bio">' + esc(s.bio) + '</p>' : '<p class="rg-sup-bio">We have not written about this supplier yet. Their website says what they make.</p>') +
        ((s.kinds || []).length ? '<h4>What they make</h4><div class="rg-sup-kinds">' + s.kinds.map(function (k) { return '<span>' + esc(kindName(k)) + '</span>'; }).join('') + '</div>' : '') +
        '<div class="dg-btns" style="margin-top:18px">' + (s.website ? '<a class="dg-btn" href="' + esc(s.website) + '" target="_blank" rel="noopener nofollow">Visit their website</a>' : '') +
        '<a class="dg-btn dg-ghost" href="' + (back ? back.hash : (dom ? '#/sourcing/' + dom.k : '#/sourcing')) + '">Back to the list</a></div>' +
        '<p class="rg-sup-note">Ask the supplier about each product before it goes on your menu. Featuring a supplier here never buys its place in the list.</p></div>';
    }).catch(function () { var box = document.getElementById('rgSup'); if (box) box.innerHTML = '<p class="dg-lede">We could not load this. Try again in a moment.</p>'; });
  }

  // Buy or make (Sean, 2026-11-05: pair the recipes we already have). Each item: who sells it ready-made, and the Cookbook recipe
  // at home scale. #/sourcing/make lists them, #/sourcing/make/<key> opens one. The pairs live in ve-sourcing (MAKE).
  function viewMake(key) {
    var homeTag = '<span class="rg-promo-tag rg-soon">Home scale</span>';
    if (!key) {
      main.innerHTML = crumb([['Sourcing', '#/sourcing'], ['Buy or make']]) + head('Sourcing', 'Buy or make', 'For each item, buy it from someone who already makes it, or make it yourself. The recipes are written for a home kitchen; scale them up and cost them before they go on a menu.') +
        '<div class="dg-srows" id="rgMakeList">' + skel('', 4) + '</div>';
      srcFetch({ action: 'make' }).then(function (r) {
        if (curTab !== 'sourcing') return;
        var el = document.getElementById('rgMakeList'); if (!el) return;
        if (!r || !r.ok) { el.innerHTML = '<p class="dg-lede">We could not load this. Try again in a moment.</p>'; return; }
        el.innerHTML = (r.items || []).map(function (it) {
          var pic = it.recipe && it.recipe.photo_url ? '<img src="' + esc(it.recipe.photo_url) + '" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">' : SRC_ICON;
          return row({ icon: pic, title: it.t, href: '#/sourcing/make/' + encodeURIComponent(it.key), pre: '<span class="rg-promo-tag ' + (it.buy ? 'rg-live">' + it.buy + (it.buy === 1 ? ' supplier' : ' suppliers') : 'rg-soon">Make it') + '</span>',
            body: '<p class="dg-srow-p">' + (it.buy ? 'Buy it ready-made, or make it: ' : 'No supplier for this yet. Make it: ') + esc(it.recipe.title) + '.</p>' });
        }).join('');
      }).catch(function () { var el = document.getElementById('rgMakeList'); if (el) el.innerHTML = '<p class="dg-lede">We could not load this. Try again in a moment.</p>'; });
      return;
    }
    main.innerHTML = crumb([['Sourcing', '#/sourcing'], ['Buy or make', '#/sourcing/make'], ['...']]) + '<div id="rgMake">' + skel('', 3) + '</div>';
    srcFetch({ action: 'make_get', key: key }).then(function (r) {
      if (curTab !== 'sourcing') return;
      var box = document.getElementById('rgMake'); if (!box) return;
      if (!r || !r.ok) { box.innerHTML = '<p class="dg-lede">' + (r && r.error === 'not_found' ? 'We could not find that item.' : 'We could not load this. Try again in a moment.') + ' <a href="#/sourcing/make">Back to Buy or make</a></p>'; return; }
      var c = main.querySelector('.dg-crumb'); if (c) c.outerHTML = crumb([['Sourcing', '#/sourcing'], ['Buy or make', '#/sourcing/make'], [r.item.t]]);
      SRC.back = { hash: '#/sourcing/make/' + encodeURIComponent(r.item.key), t: r.item.t, make: 1 };
      var R = r.recipe, sup = r.suppliers || [];
      var buy = '<h3 class="rg-bom-h">Buy it</h3>' + (sup.length ? '<div class="dg-srows">' + sup.map(srcRow).join('') + '</div>' :
        '<p class="dg-lede">No supplier in our directory sells this ready-made yet. We add suppliers every week.</p>');
      var make = '<h3 class="rg-bom-h">Make it ' + homeTag + '</h3>' + (R ? '<div class="rg-bom-rec">' +
        (R.photo_url ? '<figure><img src="' + esc(R.photo_url) + '" alt="' + esc(R.title) + '" loading="lazy">' + (R.photo_illustrative ? '<figcaption>Illustrative photo</figcaption>' : '') + '</figure>' : '') +
        '<b class="rg-bom-t">' + esc(R.title) + '</b>' + (R.time_text ? '<span class="rg-bom-m">' + esc(R.time_text) + '</span>' : '') +
        '<h4>What you need</h4><ul>' + (R.ingredients || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
        '<h4>How to make it</h4><ol>' + (R.instructions || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
        (R.tip ? '<p class="rg-bom-tip"><b>Tip</b> ' + esc(R.tip) + '</p>' : '') +
        '<p class="rg-bom-note">A home-kitchen recipe from Maya\'s Cookbook in the Vegan Dairy Guide. Scale it up and work out the cost per portion before it goes on your menu.</p></div>' :
        '<p class="dg-lede">The recipe is not available right now.</p>');
      box.innerHTML = head('Buy or make', esc(r.item.t), 'Buy it from someone who already makes it, or make it in your own kitchen.') + '<div class="rg-bom">' + '<div>' + buy + '</div><div>' + make + '</div></div>';
    }).catch(function () { var box = document.getElementById('rgMake'); if (box) box.innerHTML = '<p class="dg-lede">We could not load this. Try again in a moment.</p>'; });
  }

  // ---------- Test yourself: the quiz, one question at a time ----------
  var ANS = {};
  try { ANS = JSON.parse(sessionStorage.getItem('rg_quiz') || '{}'); } catch (e) { ANS = {}; }
  function keepAns() { try { sessionStorage.setItem('rg_quiz', JSON.stringify(ANS)); } catch (e) {} }
  function badge() { return recall('rg_badge'); }
  function viewQuiz(sub) {
    if (!member()) {
      main.innerHTML = head('Test yourself', 'The Entrepreneur Track quiz', 'Ten questions on the fixes. Score 80% or better and the badge is yours.') +
        gated(skel('Question 1 of 10', 4), 'The quiz and the badge', 'Ten questions, one at a time, and the Entrepreneur Track badge when you pass.');
      return;
    }
    var Q = MEM.quiz, n = parseInt(sub, 10);
    if (sub === 'result') {
      var right = 0; Q.forEach(function (q, i) { if (ANS[i] === q[2]) right++; });
      var pct = Math.round(100 * right / Q.length), pass = pct >= 80;
      if (pass && !badge()) store('rg_badge', new Date().toISOString());
      main.innerHTML = crumb([['Test yourself', '#/quiz'], ['Your score']]) + head('Your score', pct + '%', pass ? 'You passed. The Entrepreneur Track badge is yours.' : 'You need 80% for the badge. Look over the fixes and try again.') +
        (pass ? '<div class="rg-badge"><i>' + ICON.quiz.replace(/#1f5f22/g, '#ffffff') + '</i><div><b>Entrepreneur Track</b><span>The Vegan Restaurant Guide</span></div></div>' : '') +
        '<div class="dg-btns" style="margin-top:16px"><a class="dg-btn" href="#/quiz/1" data-retake>Take it again</a><a class="dg-btn dg-ghost" href="#/fixes">Back to the fixes</a></div>';
      return;
    }
    if (!n) {
      main.innerHTML = head('Test yourself', 'The Entrepreneur Track quiz', 'Ten questions on the fixes, one at a time. Score 80% or better and the badge is yours. Take it as often as you like.') +
        (badge() ? '<div class="rg-badge" style="margin-bottom:16px"><i>' + ICON.quiz.replace(/#1f5f22/g, '#ffffff') + '</i><div><b>Entrepreneur Track</b><span>Earned ' + esc(new Date(badge()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })) + '</span></div></div>' : '') +
        '<a class="dg-btn" href="#/quiz/1" data-retake>Start the quiz</a>';
      return;
    }
    n = Math.max(1, Math.min(Q.length, n));
    var q = Q[n - 1];
    main.innerHTML = crumb([['Test yourself', '#/quiz'], ['Question ' + n]]) + '<div class="rg-q"><div class="dg-k">Question ' + n + ' of ' + Q.length + '</div><h3>' + esc(q[0]) + '</h3>' +
      q[1].map(function (o, i) { return '<button type="button" class="rg-opt" data-ans="' + (n - 1) + ':' + i + '" aria-pressed="' + (ANS[n - 1] === i) + '"><i></i>' + esc(o) + '</button>'; }).join('') +
      '<div class="dg-formnav"><a class="dg-tnav" href="' + (n > 1 ? '#/quiz/' + (n - 1) : '#/quiz') + '">Back</a><span>' + n + ' of ' + Q.length + '</span>' +
      '<a class="dg-tnav next" id="rgQNext" href="' + (n < Q.length ? '#/quiz/' + (n + 1) : '#/quiz/result') + '"' + (ANS[n - 1] == null ? ' aria-disabled="true" style="opacity:.35;pointer-events:none"' : '') + '>' + (n < Q.length ? 'Next' : 'See my score') + '</a></div></div>';
  }

  // ---------- My list ----------
  var LIST_SECS = [['Fixes', 'fixes', 'fix', '#/fixes'], ['Interviews', 'interviews', 'episode', '#/pulse'], ['Promotions', 'promotions', 'promo', '#/promos']];
  function viewMyList(sub) {
    var sec = LIST_SECS.filter(function (x) { return x[1] === String(sub || '').split('/')[0]; })[0] || LIST_SECS[0];
    main.innerHTML = head('My list', 'My list', 'Everything you save in the Guide, in one place. Tap Save on any challenge, interview or promotion.', toggles(LIST_SECS.map(function (x) { return [x[0], '#/mylist/' + x[1]]; }), sec[0])) +
      '<div id="dgML"><div class="dg-loading">Loading your list...</div></div>';
    var draw = function () {
      var el = document.getElementById('dgML'); if (!el) return;
      var keys = SV_ORDER.filter(function (x) { return x.kind === sec[2]; }).map(function (x) { return x.key; }), html = '', items = [];
      if (sec[2] === 'fix') { var all = allFixes(); items = keys.map(function (k) { return all.filter(function (f) { return f.id === k; })[0]; }).filter(Boolean);
        html = '<div class="dg-srows">' + items.map(function (f) { return row({ icon: fixIcon(f.id), title: f.title, href: '#/fixes/' + f.id, body: '<p class="dg-srow-p">' + esc(f.problem || '') + '</p>', acts: saveBtn('fix', f.id) }); }).join('') + '</div>'; }
      else if (sec[2] === 'episode') { items = keys.map(function (k) { return (PODS || []).filter(function (p) { return p.slug === k; })[0]; }).filter(Boolean); html = '<div class="vep-dock" data-vep-always></div><div class="rg-eps"><div class="vep-list">' + items.map(podCard).join('') + '</div></div>'; }
      else { items = keys.map(function (k) { return PROMOS.filter(function (p) { return p.k === k; })[0]; }).filter(Boolean);
        html = '<div class="dg-srows">' + items.map(function (p) { return row({ icon: ICON.promos, title: p.t, href: '#/promos/' + p.k, body: '<p class="dg-srow-p">' + esc(p.what) + '</p>', acts: saveBtn('promo', p.k) }); }).join('') + '</div>'; }
      el.innerHTML = items.length ? html : '<p class="dg-empty">Nothing saved here yet. Tap Save on any of the <a href="' + sec[3] + '">' + esc(sec[0].toLowerCase()) + '</a> and it shows up here.</p>';
    };
    var waits = 0, done = function () { if (--waits <= 0) draw(); };
    if (svState !== 'loaded') { waits++; loadSaves(done); }
    if (sec[2] === 'episode' && !gvLoaded) { waits++; loadGVotes(done); }
    if (!waits) draw();
  }

  // ---------- Get access ----------
  function viewJoin() {
    if (member()) {
      main.innerHTML = head('Your Guide', 'The whole Guide is yours', (ST.via === 'purchase' ? 'You unlocked it, and it is yours to keep.' : 'It is yours to keep.') + ' Thank you for being here.') + '<a class="dg-btn" href="#/">Back to the overview</a>'; return;
    }
    if (ST.active) {
      // Already a member, not yet through this Guide's survey (Sean approved 2026-11-06): no membership pitch, no Founding line.
      var opens = ['Your audit and your top challenges, in order', 'Claim your page and your dashboard', 'Try the demo', 'Sourcing and Buy or make', 'Pulse', 'Promotions', 'My list'];
      main.innerHTML = head('Get in', 'You\'re a member. One short survey opens this Guide.',
        'This Guide opens with its own survey, about your restaurant. It takes a few minutes and pays points for every answer, and what you tell us is how we know what your business needs. When you finish, every tab is yours to keep.') +
        '<div class="dg-access"><div class="dg-pricebox"><div class="dg-big">Free<small>with the restaurant survey</small></div><button type="button" class="dg-btn" data-survey>Take the restaurant survey</button><p class="dg-pp">Your answers are saved as you go.</p></div>' +
        '<div><h3 class="dg-k" style="margin:0 0 8px">What opens when you finish</h3><ul>' + opens.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div></div>';
      return;
    }
    var m = mode();
    var doors = '<div class="dg-access"><div class="dg-pricebox"><div class="dg-big">Free<small>the short survey</small></div><p>It tells us how to serve you, and your membership opens when you finish.</p><button type="button" class="dg-btn" data-survey>Take the survey</button><p class="dg-pp">No card needed.</p>' +
      (m === 'join' ? '<p class="dg-pp">Already a member? <a href="#" data-signin>Sign in</a>.</p>' : '') + '</div>' +
      '<div><ul><li><b>Your page, yours to run.</b> Claim it and keep your hours, photos and menu link current.</li><li><b>The Directory, the Daily Pulse and the events calendar</b>, open to you as a member.</li><li><b>Founding Member</b> stays on your profile for good if you finish before midnight Eastern on January 1, 2027.</li></ul></div></div>';
    var benefits = [
      ['Post jobs', 'Hire from the community on the Jobs board.', 'Live for a business with a listing'],
      ['Join the community', 'Comment on the Daily Pulse, vote and check in.', 'Live'],
      ['Your page, yours to run', 'Claim it, edit it, add your hours, photos and menu link.', 'Live'],
      ['Promote your business and events', 'Promote your event and get found; marketing help from our team on request.', 'Live by request'],
      ['See what campaigns are happening', 'The dashboard lists open campaigns and opportunities, and you can say you are in.', 'Live as a list, campaigns coming'],
      ['Never miss a Guide', 'New Guides appear in your dashboard.', 'Live'],
      ['Featured in our Guides', 'When a Guide has room to feature a business, members are the first we call.', 'Coming'],
      ['Founding Member', 'Stays on your profile for good if you join before midnight Eastern on January 1, 2027.', 'Live until then']
    ];
    main.innerHTML = head('Get in', 'One way in, and it is free',
      'Finish the short survey before midnight Eastern on January 1, 2027 and you are a Founding Member, which stays on your profile for good. After you are in, a What\'s next page shows you everything you can do, and the Welcome Guide shows you the rest.') + doors +
      '<h3 class="dg-k" style="margin:22px 0 8px">What membership gets you</h3>' +
      '<p class="dg-lede" style="margin:0 0 10px"><b>We are the eyes and ears of the Vegan community, and our only job is to know what is happening and deliver it to the people it matters to. We have done this with SoFlo Vegans since 2016, and we still do.</b> This time we have the tools to do it.</p>' +
      '<div class="dg-srows">' + benefits.map(function (x) {
        return '<div class="dg-srow"><div class="dg-srow-b"><h3>' + esc(x[0]) + '</h3><p>' + esc(x[1]) + '</p></div><div class="dg-acts"><span class="dg-tag ' + (x[2].indexOf('Live') === 0 ? 'dg-tag-live' : 'dg-tag-off') + '">' + esc(x[2]) + '</span></div></div>';
      }).join('') + '</div>';
  }

  // ---------- What's next (Version 1, Sean 2026-11-04) ----------
  // The survey is the only door. The $11 is an optional contribution, thanks only: no points, no promise of anything bought with them.
  var SOCIALS = [
    ['Instagram', 'https://www.instagram.com/vegansexplore/', '@vegansexplore'],
    ['TikTok', 'https://www.tiktok.com/@vegansexplore', '@vegansexplore'],
    ['YouTube', 'https://www.youtube.com/@VegansExplore', '@VegansExplore'],
    ['Facebook', 'https://www.facebook.com/vegansexplore', 'facebook.com/vegansexplore']
  ];
  var NI = function (d) { return '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + '>' + d + '</svg>'; };
  ICON.give = NI('<path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/>');
  ICON.story = NI('<path d="M12 3a3 3 0 013 3v5a3 3 0 01-6 0V6a3 3 0 013-3z"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>');
  ICON.opps = NI('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M3 13h18"/>');
  ICON.dash = NI('<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="10" width="8" height="11" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/>');
  ICON.share = NI('<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>');
  ICON.book = NI('<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/>');
  ICON.job = NI('<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a1 1 0 011-1h4a1 1 0 011 1v2"/>');
  ICON.follow = NI('<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>');
  function me() { var a = auth(); try { return a && a.getMember ? a.getMember() : null; } catch (e) { return null; } }
  function shareLink() { var m = me(); return location.origin + (m && m.referral_code ? '/r/' + m.referral_code : '/passport'); }
  function copyText(t) {
    return (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(t) : Promise.reject()).catch(function () {
      var ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {} ta.remove();
    });
  }
  function joinedMessage() {
    var m = me(), nm = (m && m.name) || '', biz = PERSONAL && PERSONAL.name ? PERSONAL.name : '';
    return 'Hi Vegans Explore, I just joined as ' + (nm || 'a new member') + (biz ? ' from ' + biz : '') + '. Please follow me back!';
  }
  function viewNext(sub) {
    if (sub === 'follow') return viewFollow();
    var claimHref = PERSONAL && PERSONAL.slug ? '/claim?listing=' + encodeURIComponent(PERSONAL.slug) : '#/featured';
    var soon = function (key) { return '<button type="button" class="dg-btn dg-ghost" data-notify="' + key + '">Tell me when it opens</button>'; };
    var tag = '<span class="rg-promo-tag rg-soon">Coming</span>';
    var go = function (label, h, ext) { return '<a class="dg-btn dg-ghost" href="' + h + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + esc(label) + '</a>'; };
    var tiles = [
      { icon: ICON.give, title: 'Make a contribution', body: 'From $11. Our thanks, and it helps us grow faster. A contribution to the community, never a donation.', acts: go('Contribute', '/dashboard?contribute=1') },
      { icon: ICON.story, pre: tag, title: 'Share your story', body: 'Tell us in your own words why you do this. Opening soon.', acts: soon('share-your-story') },
      { icon: ICON.opps, pre: tag, title: 'Opportunities', body: 'A place to find what is open to your business. Opening soon.', acts: soon('opportunities') },
      { icon: ICON.featured, title: 'Claim your page', body: PERSONAL && PERSONAL.name ? esc(PERSONAL.name) + ' already has a page. Claiming makes it yours to run.' : 'Your page already exists. Claiming makes it yours to run.', acts: go('Claim it', claimHref) },
      { icon: ICON.dash, title: 'Open your dashboard', body: 'Your points, your level, the Directory, the Daily Pulse and everything you can do as a member.', acts: go('Open it', '/dashboard') },
      { icon: ICON.share, title: 'Share your link', body: 'Your own link. When someone joins with it, you get the credit.', acts: '<button type="button" class="dg-btn dg-ghost" data-copylink>Copy my link</button>' },
      { icon: ICON.book, title: 'Read the Welcome Guide', body: 'How to use Vegans Explore, from search to the Daily Pulse, in a few minutes.', acts: go('Read it', '/passport?guide=welcome') },
      { icon: ICON.job, title: 'Post a job', body: 'Hire from the community on the Jobs board. It needs a claimed page.', acts: go('Open the Jobs board', '/pulse/jobs') },
      { icon: ICON.follow, title: 'Follow us', body: 'Follow us everywhere, then tell us you joined so we can follow you back.', acts: go('Follow us', '#/next/follow') }
    ];
    main.innerHTML = head('What\'s next', 'You are in. Thank you.',
      'Welcome to Vegans Explore. Here is what you can do next. Pick any of it, in any order. Nothing here is required.') +
      '<div class="dg-srows">' + tiles.map(function (t) { if (t.body.indexOf('<p') !== 0) t.body = '<p style="margin:4px 0 0;font-size:14px;line-height:1.5;color:var(--ink75)">' + t.body + '</p>'; return row(t); }).join('') + '</div><p class="dg-status" role="status" aria-live="polite"></p>';
  }
  function viewFollow() {
    var msg = joinedMessage(), enc = encodeURIComponent(msg);
    main.innerHTML = crumb([['What\'s next', '#/next'], ['Follow us']]) +
      head('Follow us', 'Follow us everywhere', 'These are our own accounts. Follow and subscribe, and then tell us you joined, so we can follow you back.') +
      '<div class="dg-srows">' + SOCIALS.map(function (x) {
        return row({ icon: ICON.follow, title: x[0], body: '<p class="dg-srow-p">' + esc(x[2]) + '</p>', acts: '<a class="dg-btn dg-ghost" href="' + x[1] + '" target="_blank" rel="noopener">Follow</a>' });
      }).join('') + '</div>' +
      '<h3 class="dg-k" style="margin:22px 0 8px">Tell us you joined</h3>' +
      '<p class="dg-lede" style="margin:0 0 10px">Copy this message, change it if you like, and send it on any of these. We follow back.</p>' +
      '<textarea id="rgJoinedMsg" rows="3" style="width:100%;border:1px solid var(--line);border-radius:6px;padding:12px;font:inherit;font-size:15px" data-dictate="off">' + esc(msg) + '</textarea>' +
      '<div class="dg-btns" style="margin-top:10px"><button type="button" class="dg-btn" data-copymsg>Copy message</button>' +
      '<a class="dg-btn dg-ghost" data-send="https://m.me/vegansexplore?text=" href="https://m.me/vegansexplore?text=' + enc + '" target="_blank" rel="noopener">Send on Facebook</a>' +
      '<a class="dg-btn dg-ghost" data-send="mailto:contact@lesaruss.com?subject=' + encodeURIComponent('I just joined Vegans Explore') + '&body=" href="mailto:contact@lesaruss.com?subject=' + encodeURIComponent('I just joined Vegans Explore') + '&body=' + enc + '">Send by email</a>' +
      '<a class="dg-btn dg-ghost" href="https://ig.me/m/vegansexplore" target="_blank" rel="noopener" data-copyfirst>Send on Instagram</a>' +
      '<a class="dg-btn dg-ghost" href="https://www.tiktok.com/@vegansexplore" target="_blank" rel="noopener" data-copyfirst>Open TikTok</a></div>' +
      '<p class="dg-pp" style="margin-top:8px">Instagram and TikTok cannot fill in a message for you, so we copy it first. Paste it when the app opens.</p>' +
      '<p class="dg-status" role="status" aria-live="polite"></p>';
    var ta = document.getElementById('rgJoinedMsg');
    ta.addEventListener('input', function () {
      var e = encodeURIComponent(ta.value);
      [].forEach.call(main.querySelectorAll('[data-send]'), function (a) { a.href = a.getAttribute('data-send') + e; });
    });
  }
  function notifyMe(key, btn) {
    var m = me(); if (!m || !m.email) { setStatus('Sign in to be told when it opens.'); return; }
    btn.disabled = true; btn.textContent = 'Sending...';
    fetch(SB + '/rest/v1/member_interest', { method: 'POST', headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ email: m.email, role_slug: 'restaurant-guide-' + key, source: 'restaurant-guide-whats-next' }) })
      .then(function (r) { if (!r.ok) throw 0; btn.textContent = 'We will tell you'; setStatus('Done. We will email you the day it opens.'); })
      .catch(function () { btn.disabled = false; btn.textContent = 'Try again'; });
  }
  document.addEventListener('click', function (e) {
    var el;
    if ((el = e.target.closest('[data-notify]'))) { e.preventDefault(); notifyMe(el.getAttribute('data-notify'), el); return; }
    if ((el = e.target.closest('[data-copylink]'))) { e.preventDefault(); copyText(shareLink()).then(function () { setStatus('Copied. Anyone who joins with it is credited to you: ' + shareLink()); }); return; }
    if ((el = e.target.closest('[data-copymsg]'))) { e.preventDefault(); copyText(document.getElementById('rgJoinedMsg').value).then(function () { setStatus('Message copied.'); }); return; }
    if ((el = e.target.closest('[data-copyfirst]'))) { var t = document.getElementById('rgJoinedMsg'); if (t) copyText(t.value); }
  });

  // ---------- Overview ----------
  // Start here, short (Sean, 2026-11-06 live review: "very simple, not a lot... how to use this thing"; draft approved the same day).
  // It replaces the six-part VEGuideIntro on this Guide's Overview; the groups sit under it as headings with their sections as pills, so one click less.
  // Start here: the shared short opening (public/ve-guide-intro.js), in this Guide's words.
  function startCard(howTo) {
    var o = { place: 'This Guide is for people who run a Vegan restaurant, or are about to.',
      why: ['You feed people. We help them find you.', 'Customers decide from what they see online before they ever walk in. Vegans Explore brings Vegan diners to your door: the Directory, the Daily Pulse, our events and our members.'],
      change: 'you will know how your restaurant looks to someone searching today, what to fix first, and how your page brings people in.',
      how: howTo, pic: picUrl('t-start', 640) };
    return window.VEGuideIntro ? VEGuideIntro.html(o) : '';
  }
  function groupRows(open) {
    return GROUPS.slice(1).map(function (g) {
      return '<section class="rg-grow"><h3>' + esc(g.label) + '</h3><p>' + esc(g.line) + '</p><div class="rg-pills">' + (open ? kidsOf(g.k) : g.kids.filter(function (k) { return k !== 'mylist'; })).map(function (k) {
        var inner = '<span class="rg-pill-pic">' + pic(TILE_PIC[k] || 't-next') + '</span><span>' + esc(tab(k).label) + '</span>';
        return open ? '<a class="rg-pill" href="' + href(k) + '">' + inner + '</a>' : '<span class="rg-pill is-locked">' + inner + LOCK_SVG + '</span>';
      }).join('') + '</div></section>';
    }).join('');
  }
  function viewOverview() {
    if (!member()) {
      main.innerHTML = head('Vegans Explore Guides for business', 'Welcome to the Vegan Restaurant Guide', '') +
        startCard('run your free check first. A short survey after it makes you a member, free, and opens everything below.') +
        '<div class="dg-start" style="margin:18px 0 6px"><button type="button" class="dg-btn" data-run-check>Run my free check</button><p>For 100% Vegan restaurants. Free, no card.</p></div>' +
        '<h3 class="dg-k" style="margin:26px 0 4px">What opens after the survey</h3>' + groupRows(false);
      return;
    }
    main.innerHTML = head('Vegans Explore Guides for business', 'Welcome to the Vegan Restaurant Guide', '') +
      startCard('pick a topic below. Start with Your restaurant if you are not sure. Save anything to My list and come back any time.') +
      groupRows(true);
  }
  // What to expect: what opens after the survey, each marked Live or Coming (never a planned thing as live).
  function viewExpect() {
    var rows = [
      ['Top challenges', 'The top 10 things Vegan businesses run into. Tick the ones you relate to and see how owners rank them.', 'Live'],
      ['Your dashboard', 'How many people look at your page and what they do next. It opens fully when you claim your page.', 'Live'],
      ['Your Directory page', 'Your page already exists. Claim it, and keep your hours, photos and menu link current.', 'Live'],
      ['Our interviews', 'Business owners on what worked and what did not, and the research behind it.', 'Live'],
      ['Campaigns, events and features', 'The ways we bring members through your door. Each one says if it is live or coming.', 'Live and Coming'],
      ['More Guides and tools for owners', 'Added as we build them.', 'Coming']
    ];
    main.innerHTML = head('What to expect', 'What opens when you are in', 'We launch on January 1, 2027. Here is what is here now and what is coming.') +
      '<div class="dg-srows">' + rows.map(function (c) {
        return '<div class="dg-srow"><div class="dg-srow-b"><h3>' + esc(c[0]) + '</h3><p>' + esc(c[1]) + '</p></div><div class="dg-acts"><span class="dg-tag ' + (c[2] === 'Live' ? 'dg-tag-live' : 'dg-tag-off') + '">' + esc(c[2]) + '</span></div></div>';
      }).join('') + '</div>' +
      '<div class="dg-start" style="margin-top:16px"><button type="button" class="dg-btn" data-survey>Take the short survey</button><p>Free, no card, and you can stop any time.</p></div>';
  }

  // ---------- search (members) ----------
  function index() {
    var out = [];
    PUB.why.concat(MEM ? MEM.why : []).forEach(function (w) { out.push({ t: 'Pulse', title: w.title, text: w.text, href: '#/pulse/research' }); });
    if (!MEM) return out;
    allFixes().forEach(function (f) { out.push({ t: 'Top challenges', title: f.title, text: [f.problem].concat(f.list || []).concat([f.action]).join(' '), href: '#/fixes/' + f.id }); });
    (PODS || []).forEach(function (p) { out.push({ t: 'Pulse', title: p.title, text: (p.podcast_show || '') + '. ' + (p.summary || ''), href: '#/pulse/listen/' + encodeURIComponent(p.slug) }); });
    PROMOS.forEach(function (p) { out.push({ t: 'Promotions', title: p.t, text: p.what + ' ' + p.why, href: '#/promos/' + p.k }); });
    return out;
  }
  function viewSearch(q) {
    if (qEl.value !== q) qEl.value = q;
    var words = q.toLowerCase().split(/\s+/).filter(Boolean);
    var hits = index().filter(function (h) { var hay = (h.title + ' ' + h.text).toLowerCase(); return words.every(function (w) { return hay.indexOf(w) >= 0; }); });
    var groups = {}; hits.forEach(function (h) { (groups[h.t] = groups[h.t] || []).push(h); });
    var html = crumb([['Search']]) + '<h2 class="dg-h1">' + hits.length + (hits.length === 1 ? ' result' : ' results') + ' for &ldquo;' + esc(q) + '&rdquo;</h2><div class="dg-res">';
    ['Top challenges', 'Pulse', 'Promotions'].forEach(function (g) {
      if (!groups[g]) return;
      html += '<h2>' + esc(g) + ' (' + groups[g].length + ')</h2><div class="dg-grid">' + groups[g].slice(0, 24).map(function (h) {
        return '<a class="dg-card dg-hit" href="' + h.href + '"><h3>' + esc(h.title) + '</h3><p>' + esc(h.text.length > 160 ? h.text.slice(0, 157) + '...' : h.text) + '</p></a>';
      }).join('') + '</div>';
    });
    if (!hits.length) html += '<p class="dg-empty">Nothing matched. Try reviews, photos, hours or Instagram.</p>';
    main.innerHTML = html + '</div>';
  }
  var tSearch;
  qEl.addEventListener('input', function () {
    clearTimeout(tSearch);
    tSearch = setTimeout(function () {
      var q = qEl.value.trim(), h = q ? '#/search/' + encodeURIComponent(q) : '#/';
      if (/^#\/search\//.test(location.hash) && q) { history.replaceState(null, '', location.pathname + location.search + h); route(); } else location.hash = h;
    }, 180);
  });
  document.getElementById('dgSearchForm').addEventListener('submit', function (e) { e.preventDefault(); var q = qEl.value.trim(); if (q) location.hash = '#/search/' + encodeURIComponent(q); });

  // ---------- Liz, on the right of every tab ----------
  var TOUR = { started: false, playing: false, paused: false, shown: null };
  var tourM = document.getElementById('dgTourM'), foldBtn = document.getElementById('dgFold'), railEl = document.getElementById('dgRail');
  function setFold(folded) {
    railEl.classList.toggle('dg-folded', folded);
    foldBtn.textContent = folded ? 'Show Liz' : 'Hide Liz'; foldBtn.setAttribute('aria-expanded', String(!folded));
    try { sessionStorage.setItem('rg_liz_folded', folded ? '1' : ''); } catch (e) {}
  }
  foldBtn.addEventListener('click', function () {
    var folded = !railEl.classList.contains('dg-folded');
    if (folded && TOUR.playing) { TOUR.paused = true; stopLiz(); drawLiz(); }
    setFold(folded);
  });
  try { if (sessionStorage.getItem('rg_liz_folded')) setFold(true); } catch (e) {}
  var lizBox = document.getElementById('dgMaya'), bubble = document.getElementById('dgBubble'), playBtn = document.getElementById('dgPlay'), tourEl = document.getElementById('dgTour');
  var vid = document.createElement('video');
  vid.preload = 'metadata'; vid.playsInline = true; vid.setAttribute('playsinline', '');
  vid.setAttribute('aria-label', 'Liz, your Guide');
  function joinActive() { return !member() && !!(ST && ST.active); }
  var AUDIO_ACTIVE = 'join-member-v1'; // the join screen for a member who has not taken the restaurant survey (sayActive)
  function lizAudio(k) { if (k === 'join' && joinActive()) return CLIP_BASE + 'door-' + AUDIO_ACTIVE + '.mp3'; var f = (member() ? AUDIO_M : AUDIO_V)[k]; return f ? CLIP_BASE + 'door-' + f + '.mp3' : null; }
  var aud = new Audio(); aud.preload = 'none';
  aud.addEventListener('ended', function () { TOUR.playing = false; drawLiz(); });
  function clip(k) { if (member() && CLIPS_M[k]) return CLIPS_M[k]; if (k === 'join' && joinActive()) return null; if (k === 'join' && onPoints()) return null; return k === 'join' && mode() === 'unlock' ? CLIPS.join_credit : CLIPS[k] || null; }
  function cueLiz(k) {
    var c = clip(k), key = k + (member() ? ':m' : '') + (k === 'join' && joinActive() ? ':a' : '') + (k === 'join' && mode() === 'unlock' ? ':c' : '');
    if (TOUR.shown === key) return;
    TOUR.shown = key; stopLiz();
    var au = lizAudio(k); if (au) aud.src = au; else aud.removeAttribute('src');
    if (c) {
      vid.poster = c.poster; vid.src = c.video;
      if (!vid.parentNode) lizBox.appendChild(vid);
      vid.style.display = '';
    } else { vid.removeAttribute('src'); vid.load(); vid.style.display = 'none'; }
    lizBox.classList.remove('dg-shift'); void lizBox.offsetWidth; lizBox.classList.add('dg-shift');
  }
  function playLiz() {
    if (lizAudio(curTab)) { aud.play().then(function () { TOUR.playing = true; drawLiz(); }).catch(function () { TOUR.playing = false; drawLiz(); }); return; }
    if (!clip(curTab)) { drawLiz(); return; }
    // The first page's poster is the open smile; once she talks, the clip starts from her own first frame.
    vid.play().then(function () { TOUR.playing = true; drawLiz(); }).catch(function () { TOUR.playing = false; drawLiz(); });
  }
  function stopLiz() { vid.pause(); try { aud.pause(); } catch (e) {} TOUR.playing = false; }
  function startTour() {
    TOUR.started = true; TOUR.paused = false;
    [].forEach.call(document.querySelectorAll('[data-tour-start]'), function (b) { b.remove(); });
    playLiz();
  }
  vid.addEventListener('ended', function () { TOUR.playing = false; drawLiz(); });
  vid.addEventListener('click', function () { if (!TOUR.started) return startTour(); if (TOUR.playing) { TOUR.paused = true; stopLiz(); drawLiz(); } else { TOUR.paused = false; playLiz(); } });
  playBtn.addEventListener('click', function () { if (!TOUR.started) return startTour(); if (TOUR.playing) { TOUR.paused = true; stopLiz(); } else { TOUR.paused = false; playLiz(); } drawLiz(); });
  function drawLiz() {
    var steps = tourSteps(), i = 0, isG = /^g:/.test(curTab), t = tab(curTab);
    var cs = member() && curTab !== 'overview' && !isG ? groupOf(curTab) : null;
    steps.forEach(function (x, n) { if (x === curTab) i = n; });
    var shown = member() ? (curTab === 'overview' ? 0 : GROUPS.map(function (g) { return g.k; }).indexOf(groupOf(curTab))) : i;
    var total = member() ? GROUPS.length : steps.length;
    bubble.textContent = isG ? group(curTab.slice(2)).say : t.k === 'join' && joinActive() ? t.sayActive : !member() && t.show && lizAudio(t.k) ? t.show : member() && t.showMember && lizAudio(t.k) ? t.showMember : member() && t.sayMember ? t.sayMember : onPoints() && t.sayPoints ? t.sayPoints : t.k === 'join' && mode() === 'unlock' ? t.sayCredit : t.say;
    var has = !!clip(curTab) || !!lizAudio(curTab);
    playBtn.hidden = TOUR.started && !has;
    playBtn.classList.toggle('go', !TOUR.started);
    playBtn.innerHTML = !TOUR.started ? '&#9654; Start the tour' : TOUR.playing ? 'Pause Liz' : '&#9654; Watch Liz';
    tourEl.innerHTML = tourM.innerHTML = '<a class="dg-tnav" href="' + stepHref(steps[Math.max(0, i - 1)]) + '"' + (i ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Back</a><span>' + (shown + 1) + ' of ' + total + '</span>' +
      '<a class="dg-tnav next" href="' + stepHref(steps[Math.min(steps.length - 1, i + 1)]) + '"' + (i < steps.length - 1 ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Next</a>';
  }

  // ---------- router ----------
  function route() {
    var parts = (location.hash || '').replace(/^#\/?/, '').split('/');
    var view = parts[0] || 'overview', sub = parts.slice(1).join('/');
    if (view === 'search' && (!sub || !member())) view = 'overview';
    var known = { next: 1, overview: 1, audit: 1, expect: 1, fixes: 1, pulse: 1, sourcing: 1, featured: 1, dashboard: 1, demo: 1, promos: 1, mylist: 1, join: 1, search: 1, g: 1 };
    if (!known[view]) view = 'overview';
    // Before the survey only Overview, Your audit, What to expect and Get in open (Sean, 2026-11-04); the rest open once the access check says member.
    if (access !== 'checking' && !member() && TABS.some(function (t) { return t.k === view && t.after; })) { view = 'join'; sub = ''; location.replace('#/join'); }
    if (member() && view === 'expect') { view = 'overview'; sub = ''; }
    document.body.classList.toggle('dg-member', member());
    drawJoinbox();
    var key = view;
    if (view === 'search') key = curTab;
    if (view === 'join' && member()) { view = 'next'; sub = ''; key = 'next'; location.replace('#/next'); }
    if (view === 'next' && !member()) { view = 'join'; key = 'join'; }
    if (view === 'mylist' && !member()) { view = 'overview'; key = 'overview'; }
    if (view === 'sourcing' && !member()) { view = 'overview'; key = 'overview'; }
    if (view === 'g') { if (!member() || sub === 'start' || !sub) { view = 'overview'; key = 'overview'; } else key = 'g:' + group(sub).k; }
    if (member() && !svState) loadSaves();
    drawMenu(view === 'search' ? 'search' : key);
    if (view !== 'search' && qEl.value && document.activeElement !== qEl) qEl.value = '';
    if (view !== 'audit') auditView++;
    var bar = document.getElementById('vep-player');
    ({ next: function () { viewNext(sub); }, overview: viewOverview, expect: viewExpect, audit: function () { viewAudit(sub); }, fixes: function () { viewFixes(sub); }, pulse: function () { viewPulse(sub); }, sourcing: function () { viewSourcing(sub); },
       featured: function () { viewFeatured(sub); }, dashboard: function () { viewDashboard(); }, demo: function () { viewDemo(sub); }, promos: function () { viewPromos(sub); },
       mylist: function () { viewMyList(sub); }, g: function () { viewGroup(sub); }, join: viewJoin, search: function () { viewSearch(decodeURIComponent(sub)); } })[view]();
    keepPlayer(bar);
    var moved = key !== curTab;
    curTab = key;
    cueLiz(key);
    if (moved && TOUR.started && !TOUR.paused) playLiz();
    drawLiz();
    if (view !== 'search') { main.scrollTop = 0; if (!document.documentElement.classList.contains('dg-fit') || window.innerWidth <= 900) window.scrollTo(0, 0); }
  }
  window.addEventListener('hashchange', route);

  // ---------- access ----------
  function api(action, tok) {
    return fetch(UNLOCK_URL + '?action=' + action, { method: 'POST', headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: SLUG, token: tok || undefined }) })
      .then(function (r) { return r.json(); });
  }
  function rest(url) { return fetch(url, { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } }).then(function (r) { return r.json(); }); }
  function becomeMember(html) {
    var t = document.createElement('template'); t.innerHTML = html;
    var el = t.content.getElementById('rg-data');
    MEM = el ? JSON.parse(el.textContent) : null;
    access = MEM ? 'member' : 'pending';
    route();
  }
  // Each interview's podcast episode comes from its show's own feed through ve-podcast (the audio streams from the show's host).
  function feedEp(show, guid) {
    return fetch(PODCAST_FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'episode', slug: show, guid: guid }) })
      .then(function (r) { return r.json(); }).then(function (d) { return d && d.episode; }).catch(function () { return null; });
  }
  function loadPublic() {
    if (window.VEEpisodes) VEEpisodes.css();
    var eps = Promise.all(PULSE_PICKS.map(function (x) { return feedEp(x[1], x[2]); }));
    Promise.all([rest(PULSE_URL).catch(function () { return []; }), rest(TOP_URL).catch(function () { return []; }), rest(SHOWS_URL).catch(function () { return []; }), eps]).then(function (r) {
      var pods = Array.isArray(r[0]) ? r[0] : [], shows = Array.isArray(r[2]) ? r[2] : [];
      PODS = PULSE_PICKS.map(function (x, i) {
        var p = pods.filter(function (y) { return y.slug === x[0]; })[0], show = shows.filter(function (y) { return y.slug === x[1]; })[0], ep = r[3][i];
        return p && show && ep && ep.audio ? Object.assign({}, p, { show: show, ep: ep }) : null;
      }).filter(Boolean);
      TOP = Array.isArray(r[1]) ? r[1] : [];
      if (curTab === 'pulse' || curTab === 'featured' || curTab === 'mylist') route();
    });
  }
  function setStatus(msg) { [].forEach.call(document.querySelectorAll('.dg-status'), function (e) { e.textContent = msg; }); }

  document.addEventListener('click', function (e) {
    var a = auth(), el;
    if (e.target.closest('[data-tour-start]')) { startTour(); drawLiz(); return; }
    if (e.target.closest('[data-run-check]')) { e.preventDefault(); try { if (PERSONAL) sessionStorage.setItem('rg_autorun', '1'); } catch (x) {} location.hash = '#/audit'; return; }
    if ((el = e.target.closest('[data-pick]'))) { runFree({ listing_slug: el.getAttribute('data-pick') }); return; }
    if ((el = e.target.closest('[data-buy]'))) { buyAudit(el); return; }
    if ((el = e.target.closest('[data-ans]'))) {
      var p = el.getAttribute('data-ans').split(':'); ANS[+p[0]] = +p[1]; keepAns();
      [].forEach.call(el.parentNode.querySelectorAll('[data-ans]'), function (b) { b.setAttribute('aria-pressed', String(b === el)); });
      var nx = document.getElementById('rgQNext'); if (nx) { nx.removeAttribute('aria-disabled'); nx.style.opacity = ''; nx.style.pointerEvents = ''; }
      return;
    }
    if ((el = e.target.closest('[data-vep-play]'))) {
      var pp = (PODS || []).filter(function (x) { return x.ep && podKey(x) === el.getAttribute('data-vep-play'); })[0];
      if (pp) playPod(pp.slug); return;
    }
    if (e.target.closest('[data-retake]')) { ANS = {}; keepAns(); return; }
    if ((el = e.target.closest('[data-done]'))) {
      var d = doneSet(), id = el.getAttribute('data-done'); if (d[id]) delete d[id]; else d[id] = 1; store('rg_fixes_done', JSON.stringify(d)); route(); return;
    }
    if ((el = e.target.closest('[data-save]'))) {
      e.preventDefault(); e.stopPropagation();
      var kk = el.getAttribute('data-save'), i = kk.indexOf(':'), kind = kk.slice(0, i), key = kk.slice(i + 1), on = !SV[kind][key];
      if (on) { SV[kind][key] = 1; SV_ORDER.unshift({ kind: kind, key: key }); } else { delete SV[kind][key]; SV_ORDER = SV_ORDER.filter(function (x) { return !(x.kind === kind && x.key === key); }); }
      paintSaves();
      cookApi({ action: 'save', kind: kind, key: key, on: on }).then(function (r) { if (!r || !r.ok) throw r; }).catch(function () {
        if (on) delete SV[kind][key]; else SV[kind][key] = 1; paintSaves();
      });
      return;
    }
    if ((el = e.target.closest('[data-gvote]'))) {
      e.preventDefault(); e.stopPropagation();
      var gk = el.getAttribute('data-gvote').split(':'), kind2 = gk[0], key2 = gk[1], on2 = !GV.mine[kind2][key2];
      cookApi({ action: 'gvote', kind: kind2, key: key2, on: on2 }).then(function (r) {
        if (!r || !r.ok) return;
        if (on2) GV.mine[kind2][key2] = 1; else delete GV.mine[kind2][key2];
        GV.counts[kind2][key2] = r.count;
        el.classList.toggle('on', on2); el.setAttribute('aria-pressed', String(on2)); el.querySelector('b').textContent = r.count;
      });
      return;
    }
    if ((el = e.target.closest('.dg-srow[data-href]')) && !e.target.closest('a,button')) { location.hash = el.getAttribute('data-href'); return; }
    if (e.target.closest('[data-signin]')) {
      e.preventDefault();
      if (a) a.showAuthModal('Sign in and the Restaurant Guide opens if it is yours.', function () { location.reload(); }, 'login');
      return;
    }
    if ((el = e.target.closest('[data-survey]'))) { e.preventDefault(); surveyGo(); return; }
    if ((el = e.target.closest('[data-exchange]'))) { e.preventDefault(); exchange(el); return; }
    if ((el = e.target.closest('[data-buy]'))) { e.preventDefault(); if (token()) buyNow(el); return; }
    var jb = e.target.closest('[data-join]');
    if (jb) {
      if (!a || access === 'checking' || jb.disabled) return;
      stopLiz(); drawLiz();
      var m = mode();
      // On points, a new account goes straight on to the Guide's own $11 checkout (VE_ACTIVATE_HANDLER takes over the
      // $11 membership window), since buying the Guide is what makes them a member.
      if (m === 'join' && onPoints()) {
        var go = function () { delete window.VE_ACTIVATE_HANDLER; buyNow(jb); };
        window.VE_ACTIVATE_HANDLER = go;
        a.showAuthModal('Create your account, then get the Restaurant Guide for $11. Buying it makes you a member.', go, 'signup');
        return;
      }
      if (m === 'join') a.showAuthModal('Create your account. Joining is free with a short survey, and it opens this Guide.', function () { location.reload(); }, 'signup');
      else if (m === 'activate') a.showActivateModal('Joining is free with a short survey. It opens this Guide and the full community.');
      else if (m === 'unlock') unlock(jb);
      else if (m === 'points') unlockPoints(jb);
      else buyNow(jb);
    }
  });
  function unlock(btn) {
    var tok = token(); if (!tok) return;
    btn.disabled = true; btn.textContent = 'Unlocking...';
    api('unlock', tok).then(function (d) {
      if (d && d.unlocked) return api('open', tok).then(function (o) { take(o); if (o && o.unlocked && o.html) becomeMember(o.html); else throw 0; });
      if (d && d.error === 'no_credit') { ST.credits = 0; route(); return; }
      throw 0;
    }).catch(function () { btn.disabled = false; btn.textContent = ctaLabel(); setStatus('That did not go through, and no credit was used. Try again in a minute.'); });
  }
  // Spend 1,100 points on the Guide (ve-guide-unlock unlock), then open it.
  function unlockPoints(btn) {
    var tok = token(); if (!tok) return;
    btn.disabled = true; btn.textContent = 'Unlocking...';
    api('unlock', tok).then(function (d) {
      if (d && d.unlocked) return api('open', tok).then(function (o) { take(o); if (o && o.unlocked && o.html) becomeMember(o.html); else throw 0; });
      if (d && d.error === 'insufficient_points') { ST.balance = d.balance || 0; route(); return; }
      throw 0;
    }).catch(function () { btn.disabled = false; btn.textContent = ctaLabel(); setStatus('That did not go through, and no points were spent. Try again in a minute.'); });
  }
  function exchange(el) {
    var tok = token(); if (!tok || el.getAttribute('aria-busy')) return;
    el.setAttribute('aria-busy', 'true'); el.textContent = 'Turning points into a credit...';
    api('exchange', tok).then(function (d) {
      if (d && d.ok) { ST.credits = d.credits; ST.balance = d.balance; location.hash = '#/join'; route(); setStatus('You have a Guide credit now. Unlock the Guide with it.'); return; }
      throw 0;
    }).catch(function () { el.removeAttribute('aria-busy'); route(); setStatus('That did not go through, and no points were spent. Try again in a minute.'); });
  }
  function buyNow(btn) {
    var tok = token(); if (!tok) return;
    btn.disabled = true; btn.textContent = 'Opening checkout...';
    fetch(UNLOCK_URL + '?action=checkout', { method: 'POST', headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, token: tok, return_url: location.origin + location.pathname }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.url) { (window.top || window).location.href = d.url; return; } if (d && d.already) { location.reload(); return; } throw 0; })
      .catch(function () { btn.disabled = false; btn.textContent = ctaLabel(); setStatus('Checkout did not open. Try again in a minute.'); });
  }
  function confirmAfterCheckout(tok, tries, what) {
    setStatus(what === 'guide' ? 'Opening your Guide...' : 'Confirming your membership...');
    access = 'pending';
    api('open', tok).then(function (d) {
      take(d);
      if (d && d.unlocked && d.html) { setStatus(''); becomeMember(d.html); return; }
      if (onPoints() && what === 'activate' && ST.active && ST.balance >= ST.cost) { location.hash = '#/join'; route(); setStatus('Welcome in! Your 1,100 welcome points are here. Unlock the Guide with them.'); return; }
      if (what === 'activate' && ST.active && ST.credits >= 1) { location.hash = '#/join'; route(); setStatus('Welcome in! Your Guide credit is here. Unlock the Guide with it.'); return; }
      if (tries > 0) { setTimeout(function () { confirmAfterCheckout(tok, tries - 1, what); }, 2500); return; }
      route(); setStatus('Your payment went through. It can take a minute to show here: refresh this page shortly.');
    }).catch(function () { if (tries > 0) setTimeout(function () { confirmAfterCheckout(tok, tries - 1, what); }, 2500); else route(); });
  }

  function init() {
    if (window.VERegionDirectory) VERegionDirectory.css();
    document.documentElement.classList.add('dg-fit');
    if (window.VEGuideArt) { var art = VEGuideArt('liz', 'square'); if (art) lizBox.style.backgroundImage = "url('" + art + "')"; }
    var params = new URLSearchParams(location.search), auditBack = params.get('audit');
    // ?b=<code> is a business's own link from our email; it is kept for this browser so a reload or a later visit opens on it too.
    var bCode = (params.get('b') || '').toLowerCase();
    if (bCode) { params.delete('b'); history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash); }
    loadPersonal(bCode || recall('rg_b'));
    // /check/<slug> (business outreach's first email): open that business's own free check.
    var checkSlug = params.get('check');
    if (checkSlug) {
      params.delete('check'); history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash);
      auditApi({ action: 'latest', listing_slug: checkSlug }).then(function (d) {
        if (d && d.id) location.hash = '#/audit/r/' + d.id;
        else { location.hash = '#/audit'; setTimeout(function () { setStatus('We do not have a recent check for that business yet. Run one here, free.'); }, 600); }
      }).catch(function () { location.hash = '#/audit'; });
    }
    if (auditBack) {
      params.delete('audit'); history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash);
      setTimeout(function () { setStatus(auditBack === 'paid' ? 'Thank you. Your full audit is running, and we emailed you a copy of the link.' : auditBack === 'cancelled' ? 'Checkout was cancelled. Nothing was charged.' : ''); }, 1200);
    }
    if (params.get('welcome') === 'survey') { params.delete('welcome'); history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + '#/next'); }
    route();
    loadPublic();
    var a = auth(), viewAs = a && a.getViewAs ? a.getViewAs() : null;
    var tok = a && a.isLoggedIn() && !viewAs ? a.getToken() : null;
    if (!tok) { access = viewAs && viewAs.mode !== 'public' ? 'pending' : 'guest'; route(); api('status').then(function (d) { take(d); route(); }).catch(function () {}); return; }
    var back = params.get('activate') ? 'activate' : params.get('guide') ? 'guide' : null, val = back && params.get(back);
    if (back) { params.delete(back); history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash); }
    if (val === 'success' || val === 'bought') { confirmAfterCheckout(tok, 8, back); return; }
    if (back === 'guide' && val === 'cancelled') setTimeout(function () { setStatus('Checkout was cancelled. Nothing was charged.'); }, 1500);
    api('open', tok).then(function (d) {
      take(d);
      if (d && d.unlocked && d.html) becomeMember(d.html);
      else { access = d && d.loggedIn ? 'pending' : 'guest'; route(); }
    }).catch(function () { access = 'pending'; route(); setStatus('We could not check your access just now. Refresh to try again.'); });
  }

  if (window.VEAuth) init(); else window.addEventListener('load', init);
})();
