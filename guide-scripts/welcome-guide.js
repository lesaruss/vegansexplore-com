/* The Welcome Guide (playbook ve-explorer-path; proposal docs/proposals/explorer-welcome-guide.md, approved by Sean 2026-11-08).
 * Built on the Holiday Guide's files (the template gate: guides/holiday-guide.html, guide-scripts/holiday-guide.js).
 *
 * It is our About us: the "about" section of a website, packaged as a mini website, and the free front door. The Overview
 * is enough on its own (Sean: "by the time they go through it, they should know everything they need to know"); every
 * section goes deeper and is optional. Liz hosts (approved 2026-11-08); the Guide for each area appears on its page.
 * Every page ends on the Explorer card (/public/ve-explorer-card.js), the bridge from reading to joining.
 *
 *   #/              Overview: Getting started, then every section as a short article (picture, about 250 characters, Read more)
 *   #/directory     Search and the Directory        #/points    Points and levels
 *   #/city          Your city                       #/paths     Your path and badges
 *   #/events        Events                          #/better    Make it better
 *   #/media         Media                           #/animals   For the animals
 *   #/guides        Guides                          #/founder   Become a Founder (the survey; members: your first steps)
 *
 * The Overview's tour is a video (tour-video-v2.mp4) playing in Liz's frame on the right; the section pages' lines are text until recorded. Every claim on these pages is
 * checked against what is live (CLAUDE.md); nothing promises an unbuilt feature.
 */
(function () {
  var DEADLINE = Date.parse('2027-01-01T05:00:00Z');
  var OPEN = Date.now() < DEADLINE;
  var PIC = '/public/guides/';

  // The Overview video's script, approved by Sean 2026-11-08 (v3). Each chapter is also its section's "Summarize this page".
  var CHAPTERS = [
    ['Welcome', 'Hi, I\'m Liz. Maybe you want to eat out without guessing, find your people, or do more for the animals than you are right now. Wherever you\'re starting from, this Guide is how you get there. You\'ll start out just looking around, and you\'ll finish knowing your city, your community, and exactly where you fit in. Let\'s go.'],
    ['Why listen to us', 'Why listen to us? We\'ve spent more than ten years inside this community: activism, events, content, running businesses, and hundreds of long conversations about what people needed. Now we can finally build it, and we can\'t get it right without you.'],
    ['Find your way', 'Search for anything and it shows up. The Directory has places to eat and shop, people, groups and nonprofits, city by city. Your city has its own Daily Pulse, its boards and its events. And our Guides each walk you through one topic.'],
    ['Take part', 'Vote for the places you love. Your favorites tell us who to spotlight next. Check in when you visit and take on bounties to earn points. Spend them to open Guides and ask your Guide anything, or give them to the places and causes you care about. And points keep getting more valuable: giveaways, special opportunities and discounts are on the way, and the local businesses and nonprofits you give them to will be able to use them for promotion through us.'],
    ['Your path', 'Everyone starts as an Explorer. Run a restaurant, host events, make content or work with a nonprofit? Each one has its own path, its own Guide and its own badge.'],
    ['Make it better', 'This is the part that matters most. Use it in your day to day, and tell us what\'s working, what isn\'t, and what you wish you could do. Every page has a Feedback button. Ask your Guide, or ask a person on our team. Search for something we don\'t have yet, and it goes to our team. We read all of it, and we build from it every day. We\'re real people, supported by technology that finally lets us carry out a vision we\'ve been working on since 2016.'],
    ['For the animals', 'Here\'s where it\'s all going. With a network of businesses, people and nonprofits that actually show up, we can run campaigns that move the needle for the animals, the reason we\'re all here.'],
    ['Become a Founder', 'Right now you\'re early, and that\'s rare. If you feel you know enough, take the survey and get started right away. It\'s a few quick questions, about two minutes, and you\'re in, free, with 250 points to use across the platform. Want to take your time? Each section of this Guide breaks down exactly how to use it today. Either way, join before midnight on January first and you\'re a Founding Member for good. Founders unlock some really cool things in 2027, and the only way to hear about them, and lock them in for yourself, is to join today.']
  ];

  // Liz's line on each tab (text drafts for the section pages; the Overview's is chapter 1). `lead` is the Guide for that area.
  var TABS = [
    { k: 'overview', scene: 'welcome/liz-overview.jpg', label: 'Overview', say: 'Watch this video to get a full overview of Vegans Explore. Then click through each section to learn more about it.', sayMember: 'Welcome back. Watch this video any time for a full overview, then click through each section to go deeper.' },
    { k: 'directory', scene: 'welcome/liz-directory.jpg', label: 'Search and the Directory', pic: 'thumb-directory.jpg', lead: 'pascal', say: 'Press Play and I will walk you through the Directory. When you are ready, view it and pick your city.' },
    { k: 'city', scene: 'welcome/liz-city.jpg', label: 'Your City', pic: 'thumb-community.jpg', lead: 'river', say: 'Press Play and I will walk you through your city. Then find your chapter and say hello.' },
    { k: 'events', scene: 'welcome/liz-events.jpg', label: 'Events', pic: 'vegan-events-guide.jpg', lead: 'river', say: 'Press Play and I will walk you through Events. Then pick a place and find something to do this week.' },
    { k: 'media', scene: 'welcome/liz-media.jpg', label: 'Media', pic: 'holiday/p-listen.jpg', lead: 'kai', say: 'Press Play and I will walk you through Media. Then press Play on something good today.' },
    { k: 'guides', scene: 'welcome/liz-guides.jpg', label: 'Guides', pic: 'welcome-guide.jpg', lead: 'maya', say: 'Press Play and I will walk you through the Guides. Then pick an interest and try the free part of any Guide.' },
    { k: 'points', scene: 'welcome/liz-points.jpg?v=2', label: 'Points and Levels', pic: 'thumb-bounties.jpg', lead: 'theo', say: 'Press Play and I will walk you through points. Then join free and start with 250 points.' },
    { k: 'paths', scene: 'welcome/liz-paths.jpg', label: 'Your Path and Badges', pic: 'thumb-passport.jpg', lead: 'kai', say: 'Press Play and I will walk you through the paths. Then start as an Explorer and find yours.' },
    { k: 'better', scene: 'welcome/liz-better.jpg', label: 'Make It Better', pic: 'restaurant-guide/t-next.jpg', lead: 'liz', say: 'Press Play and I will walk you through every way to tell us. Then tell us one thing today.' },
    { k: 'animals', scene: 'welcome/liz-animals.jpg', label: 'For the Animals', pic: 'nonprofit-guide.jpg', lead: 'dani', say: 'Here is where it is all going, and how you can show up for the animals today.' },
    { k: 'founder', scene: 'welcome/liz-founder.jpg', label: 'Become a Founder', pic: 'welcome-ensemble.jpg', lead: 'liz', say: 'You are early. Answer a few quick questions and you are in.', sayMember: 'You are in. Here are your first steps.' }
  ];
  var LEADS = {
    pascal: ['Pascal', 'our cook, making the Meat Alternatives and Meal Prep Guides'],
    river: ['River', 'leads the Vegan Events and Stadium & Arena Guides'],
    kai: ['Kai', 'leads the Creator Guide'],
    maya: ['Maya', 'leads the Dairy and Pre-Vegan Business Guides'],
    theo: ['Theo', 'leads the Nutrition and Holiday Guides'],
    dani: ['Dani', 'leads the Nonprofit Guide'],
    liz: ['Liz', 'your host, and the Vegan Restaurant Guide']
  };
  // Two groups, side by side in two columns (Sean, 2026-11-10: "I don't think we need that many pills... put them side by side like we
  // just did with the holiday guide... two columns and more of a paragraph"). Guides moved to Take Part so both columns come out even.
  var GROUPS = [
    { label: 'Find Your Way', line: 'Search, the Directory, your city, events and our shows.', kids: ['directory', 'city', 'events', 'media'] },
    { label: 'Take Part', line: 'Guides, points, your path, telling us what to build, the animals, and becoming a Founder.', kids: ['guides', 'points', 'paths', 'better', 'animals', 'founder'] }
  ];
  // Old addresses: the nine-tab Welcome (2026-11-03) and the four Founding Member pages (2026-11-01) land on the page that holds them now.
  var OLD = { places: 'directory', community: 'city', supports: 'animals', bring: 'points', business: 'paths', join: 'founder', can: 'directory', now: 'founder' };

  var main = document.getElementById('dgMain');
  var menuEl = document.getElementById('dgMenu'), menuSel = document.getElementById('dgMenuSelect');
  var bubble = document.getElementById('dgBubble'), tourEl = document.getElementById('dgTour'), tourM = document.getElementById('dgTourM');
  var foldBtn = document.getElementById('dgFold'), railEl = document.getElementById('dgRail');
  var params = new URLSearchParams(location.search);
  var from = params.get('from') || '';
  var back = params.get('back') || '';
  if (!/^\/(?!\/)/.test(back)) back = '';
  var curTab = 'overview';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function auth() { return window.VEAuth || null; }
  function me() { var a = auth(); return a && a.isLoggedIn && a.isLoggedIn() ? a.getMember() : null; }
  function member() { var m = me(); return !!(m && m.membership_status === 'active'); }
  function tab(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i].k === k) return TABS[i]; return TABS[0]; }
  function href(k) { return '#/' + (k === 'overview' ? '' : k); }
  function pic(p) { return PIC + p; }
  function art(slug) { return window.VEGuideArt ? VEGuideArt(slug, 'square') : ''; }
  function head(k, h, lede) {
    return '<div class="dg-head"><div><div class="dg-k">' + esc(k) + '</div><h2 class="dg-h1">' + esc(h) + '</h2></div></div>' + (lede ? '<p class="dg-lede">' + lede + '</p>' : '');
  }
  function crumb(label) { return '<div class="dg-crumb"><a href="#/">Welcome Guide</a> &rsaquo; ' + esc(label) + '</div>'; }
  function lead(k) {
    var t = tab(k), l = LEADS[t.lead]; if (!l) return '';
    return '<div class="wg-lead"><span class="wg-lead-pic" style="background-image:url(\'' + esc(art(t.lead)) + '\')"></span><span><b>' + esc(l[0]) + '</b>, ' + esc(l[1]) + '</span></div>';
  }
  // A section page: what it is, how to use it today, what members get, and links.
  function section(k, kicker, lede, what, how, members, links) {
    return crumb(tab(k).label) + head(kicker, tab(k).label, lede) + lead(k) +
      '<div class="wg-cols"><div class="wg-box"><h3>What It Is</h3><p>' + what + '</p></div>' +
      '<div class="wg-box"><h3>How to Use It Today</h3><ol class="wg-steps">' + how.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol></div>' +
      '<div class="wg-box wg-mem"><h3>What Members Get</h3><ul class="wg-list">' + members.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul></div></div>' +
      (links && links.length ? '<div class="dg-btns" style="margin:16px 0 0">' + links.map(function (x, i) { return '<a class="dg-btn' + (i ? ' dg-ghost' : '') + '" href="' + x[1] + '">' + esc(x[0]) + '</a>'; }).join('') + '</div>' : '');
  }
  function explorerCard() {
    return window.VEExplorerCard ? VEExplorerCard.html({ back: '/passport#/founder', member: member(), next: { label: 'See your first steps', href: '#/founder' } }) : '';
  }

  // A members-only prompt (vote, save, check in...) lands on the Overview with its note (Sean, 2026-11-01), and an old link says it moved.
  function gateNote() {
    var w = { vote: ['Voting is for members.', 'vote every day for the places you love'], save: ['Saving is for members.', 'keep the places you love in My Saves'],
      checkin: ['Check-ins are for members.', 'earn 10 points every time you visit a place'], give: ['Giving points is for members.', 'give your points to the places you love'],
      tickets: ['This is a members-only event.', 'we take you straight to the tickets'], board: ['Posting and comments are for members.', 'join the conversation on the Daily Pulse in every city'] }[from];
    if (from === 'old-link' && !w) return '<p class="dg-note"><b>That page has moved.</b> Vegans Explore has a new home, and this is the best place to start.</p>';
    if (!w || member()) return '';
    return '<p class="dg-note"><b>' + w[0] + '</b> Join free with a short survey, and ' + w[1] + '. <a href="#/founder" style="color:var(--g);font-weight:800">See how</a>.' + (me() ? '' : ' Already a member? <a href="#" data-signin style="color:var(--g);font-weight:800">Sign in</a> and you go right back.') + '</p>';
  }

  // ---------- views ----------
  function countdown() {
    if (!OPEN) return '';
    return '<div class="wg-cd" id="wgCd" role="timer"><div class="wg-cd-l">Founding Membership closes in</div><div class="wg-cd-r">' +
      ['Days', 'Hours', 'Min', 'Sec'].map(function (u, n) { return '<div><b data-cd="' + n + '">--</b><span>' + u + '</span></div>'; }).join('') + '</div></div>';
  }
  function tickCd() {
    var el = document.getElementById('wgCd'); if (!el) return;
    var ms = DEADLINE - Date.now(); if (ms <= 0) { el.hidden = true; return; }
    var s = Math.floor(ms / 1000), v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
    el.querySelectorAll('[data-cd]').forEach(function (b) { var n = +b.getAttribute('data-cd'); b.textContent = n ? String(v[n]).padStart(2, '0') : v[n]; });
  }
  setInterval(tickCd, 1000);

  // The Overview (Sean, 2026-11-09): Getting started (how to use the page: watch Liz's tour in her frame, read on, join), then every section as a
  // short article, read like the Pulse: a small picture, the title, about 250 characters, Read more. The sub-sections live on each section's page.
  // About 75 characters each (Sean, 2026-11-10: "let's go with 75 characters, because I still feel like they're a little long").
  // Read more carries the rest.
  var SUMMARY = {
    directory: 'One search finds any Vegan place, person or answer, ranked by member votes.',
    city: 'Your chapter\'s home: a Daily Pulse each morning, boards, events and places.',
    events: 'Festivals, potlucks and meetups near you, or submit your own from a flyer.',
    media: 'Our shows, plus podcasts, films and books the community votes to the top.',
    guides: 'Mini websites on one topic each, walked through by one of our Guides.',
    points: 'Earn points by taking part, then spend them on Guides and level up.',
    paths: 'Start as an Explorer, then find the path, Guide and badge that fit you.',
    better: 'Tell us what works and what does not. We read it all and build from it.',
    animals: 'The reason we are all here: rescues, sanctuaries and nonprofits near you.',
    founder: 'A few quick questions, about two minutes, and you are in, free, with 250 points.'
  };
  function gettingStarted() {
    // One blurb, about 250 characters (Sean, 2026-11-10: "I don't like the three sections... just make it a 250 character blurb").
    var ps = member()
      ? ['<b>Welcome back.</b> Everything is open to you now. Press Play the tour any time and Liz walks you through Vegans Explore in about three minutes, or read on: every part is below, and Read more shows how to use it today.']
      : ['<b>Vegans Explore is your Vegan world in one place:</b> places to eat and shop, your city, events, shows and Guides. Press Play the tour and Liz walks you through it in about three minutes, or read on. Joining is free, with 250 points.'];
    return '<section class="wg-gs" aria-label="Getting started"><span class="wg-gs-pic"><img src="' + pic('welcome-ensemble.jpg') + '" alt="" decoding="async" width="640" height="640"></span>' +
      '<div class="wg-gs-b"><div class="vgi-k">Getting started</div><h3 class="wg-gs-t">How to use this page</h3>' + ps.map(function (x) { return '<p>' + x + '</p>'; }).join('') +
      '<div class="wg-gs-btns"><button type="button" class="dg-btn" data-wg-tour>&#9654; Play the tour</button>' + (member() ? '' : '<a class="dg-btn dg-ghost" href="#/founder">Become a Founder</a>') + '</div></div></section>';
  }
  // One article row, read like the Pulse: a picture, the title, a short summary, a link (the Overview and every section page use it).
  function artRow(picUrl, title, txt, link, more) {
    if (!link) return '<li class="wg-art"><span class="wg-art-img" style="background-image:url(&quot;' + esc(picUrl) + '&quot;)"></span><div><span class="wg-art-t">' + esc(title) + '</span><p>' + esc(txt) + '</p></div></li>';
    var ext = /^\//.test(link);
    return '<li class="wg-art"><a href="' + esc(link) + '" tabindex="-1" aria-hidden="true"><span class="wg-art-img" style="background-image:url(&quot;' + esc(picUrl) + '&quot;)"></span></a>' +
      '<div><a class="wg-art-t" href="' + esc(link) + '">' + esc(title) + '</a><p>' + esc(txt) + '</p><a class="wg-art-more" href="' + esc(link) + '">' + esc(more || (ext ? 'Open it' : 'Read more')) + ' &rsaquo;</a></div></li>';
  }
  function articles() {
    return GROUPS.map(function (g) {
      return '<div class="wg-grp"><h5>' + esc(g.label) + '</h5><ol>' + g.kids.map(function (k) {
        var t = tab(k), txt = k === 'founder' && member() ? 'You are in. Your first steps, and where to ask when you need help.' : SUMMARY[k];
        return artRow(pic(t.pic), t.label, txt, href(k), 'Read more');
      }).join('') + '</ol></div>';
    }).join('');
  }
  // Section page rows are about 75 characters too (Sean, 2026-11-10: "do the section pages at 75 too").
  // A section page in the Overview's shape (Sean, 2026-11-09): how to use the page (Liz's own short video for that page, once its script is
  // approved and recorded), then the parts of that area as plain rows (a picture, about 150 characters, no link each), then one call to action
  // at the bottom to go see it. Becoming a member is the header's button.
  function sectionPage(k, o) {
    var rec = !!CLIPS[k];
    var start = '<section class="wg-gs" aria-label="How to use this page"><span class="wg-gs-pic"><img src="' + pic(o.pic) + '" alt="" decoding="async" width="640" height="640"></span>' +
      '<div class="wg-gs-b"><div class="vgi-k">How to use this page</div><h3 class="wg-gs-t">' + esc(o.title) + '</h3>' + (rec ? ['<b>Watch Liz.</b> Press Play Liz for a short walk-through.'] : []).concat(o.how).map(function (x) { return '<p>' + x + '</p>'; }).join('') +
      '<div class="wg-gs-btns">' + (rec ? '<button type="button" class="dg-btn" data-wg-tour>&#9654; Play Liz</button>' : '') + '<a class="dg-btn' + (rec ? ' dg-ghost' : '') + '" href="' + esc(o.go[1]) + '"' + (o.feedback ? ' data-ve-feedback' : '') + '>' + esc(o.go[0]) + '</a></div></div></section>';
    if (window.VEExplorerCard) VEExplorerCard.html({}); // loads the card's styles, shared by the call to action below
    var cta = '<section class="vxc" aria-label="' + esc(o.go[0]) + '"><div class="vxc-b"><div class="vxc-k">See it for yourself</div><h3>' + esc(o.ctaTitle) + '</h3><p>' + esc(o.ctaText) + '</p></div>' +
      '<a class="vxc-go" href="' + esc(o.go[1]) + '"' + (o.feedback ? ' data-ve-feedback' : '') + '>' + esc(o.go[0]) + '</a></section>';
    return crumb(tab(k).label) + head(o.kicker, tab(k).label, '') + start +
      '<div class="wg-arts"><div class="wg-grp"><h5>' + esc(o.group) + '</h5><ol>' + o.parts.map(function (x) { return artRow(pic(x[0]), x[1], x[2]); }).join('') + '</ol></div></div>' + cta;
  }
  function viewOverview() {
    main.innerHTML = gateNote() + head('Free for everyone', member() ? 'Welcome Back to Vegans Explore' : 'Welcome to Vegans Explore', '') + gettingStarted() + '<div class="wg-arts wg-arts-ov">' + articles() + '</div>';
  }

  var VIEWS = {
    directory: function () {
      return sectionPage('directory', { kicker: 'Find your way', title: 'Every Vegan place, person and group', pic: 'thumb-directory.jpg', group: 'What is in the Directory',
        how: ['<b>Read the parts below.</b> Each one is a section of the Directory.', '<b>Members vote</b> for the places they love, and that is how places rise to the top.'],
        go: ['View the Directory', '/directory'], ctaTitle: 'Go see the Directory.', ctaText: 'Pick your city and start looking around. It is open to everyone.',
        parts: [
          ['eating-out.jpg', 'Local Food', 'Restaurants, bakeries, food trucks, markets and more, ranked by votes.'],
          ['supermarket-guide.jpg', 'Products', 'Brands you can buy anywhere: food, supplements, clothing and beauty.'],
          ['nutrition-guide.jpg', 'Services', 'Coaches, health pros, animal care and more, from people who share your values.'],
          ['restaurant-guide/t-pulse.jpg', 'Media', 'Podcasts, channels, documentaries and books, ranked by the community.'],
          ['thumb-community.jpg', 'Community and People', 'Nonprofits, rescues, groups, and the people leading the movement.']
        ] });
    },
    city: function () {
      return sectionPage('city', { kicker: 'Find your way', title: 'Every chapter has its own home', pic: 'partner-community-manager.jpg', group: 'In your city',
        how: ['<b>Read the parts below.</b> Each one is part of your chapter\'s home.', '<b>Find your city</b> on the Communities page and read today\'s Daily Pulse.'],
        go: ['Find your city', '/communities'], ctaTitle: 'Go find your city.', ctaText: 'Pick your chapter and read today\'s Daily Pulse. It is open to everyone.',
        parts: [
          ['holiday/w-say.jpg', 'The Daily Pulse', 'A short morning briefing: your city\'s news, what is on, one thing to do.'],
          ['vegan-pets.jpg', 'The Boards', 'Jobs, classifieds, fosters and rescues, a board for each in your city.'],
          ['partner-group-partner.jpg', 'Events in Your City', 'Potlucks, meetups, festivals and sanctuary days, on one calendar.'],
          ['restaurant-guide/t-promos.jpg', 'Most Voted Places', 'The places your chapter\'s members vote to the top, to eat and shop.'],
          ['vegan-abroad.jpg', 'Where We Go Next', 'Not seeing your city? Vote for the next chapter, or suggest one.']
        ] });
    },
    events: function () {
      return sectionPage('events', { kicker: 'Find your way', title: 'Something to do, near you or anywhere', pic: 'holiday/p-events.jpg', group: 'On the calendar',
        how: ['<b>Read the parts below.</b> Each one is part of Events.', '<b>Pick a place</b> and the kinds of events you like, then open one for its details.'],
        go: ['See events', '/events'], ctaTitle: 'Go find something to do.', ctaText: 'Pick a place and see what is on this week. It is open to everyone.',
        parts: [
          ['vegan-events-guide.jpg', 'Find Something to Do', 'Events in your chapter and around the world, filtered by place and kind.'],
          ['restaurant-guide/t-dashboard.jpg', 'Every Event Checked', 'Our team checks every event and keeps its dates and details right.'],
          ['stadium-arena-guide.jpg', 'Going and Tickets', 'Members tap I\'m going, and some events have members-only tickets.'],
          ['restaurant-guide/t-next.jpg', 'Submit an Event', 'Add yours from a flyer, a link or typed in. We tell you when it is live.'],
          ['holiday/p-business.jpg', 'Run Events With Us', 'Claim your event, and the free Vegan Events Guide helps you run it.']
        ] });
    },
    media: function () {
      return sectionPage('media', { kicker: 'Find your way', title: 'Shows, films and books worth your time', pic: 'holiday/p-listen.jpg', group: 'In Media',
        how: ['<b>Read the parts below.</b> Each one is part of Media.', '<b>Press Play</b> on any episode; it keeps playing while you look around.'],
        go: ['Open Media', '/media'], ctaTitle: 'Go press Play.', ctaText: 'Our shows and the community\'s favorites, right on the page. Open to everyone.',
        parts: [
          ['restaurant-guide/t-pulse.jpg', 'Our Shows', 'The Vegans Explore Podcast, SoFlo Vegans and Pre-Vegans.'],
          ['holiday/p-listen.jpg', 'Top Podcasts', 'The podcasts the community votes to the top, playable on the page.'],
          ['creator-guide.jpg', 'Documentaries', 'Films that changed how people see food and animals, and where to watch.'],
          ['restaurant-guide/t-mylist.jpg', 'Books', 'Cookbooks, memoirs and health books, including our guests\' picks.'],
          ['partner-official-creator.jpg', 'Join Our Network', 'Host a podcast? Apply to join the Vegans Explore Podcast Network.']
        ] });
    },
    guides: function () {
      return sectionPage('guides', { kicker: 'Take part', title: 'One topic at a time, walked through', pic: 'vegan-dairy-guide.jpg', group: 'In the Guides',
        how: ['<b>Read the parts below.</b> Each one is part of the Guides.', '<b>Pick an interest</b> on the Guides page, then open any Guide and try its free part.'],
        go: ['See every Guide', '/guides'], ctaTitle: 'Go pick a Guide.', ctaText: 'Every Guide has a free part to try. Open to everyone.',
        parts: [
          ['welcome-guide.jpg', 'Find Your Guide', 'Every Guide in one place, sorted by what you care about.'],
          ['vegan-restaurant-guide.jpg', 'Free With a Survey', 'Guides for your work open free with a short survey.'],
          ['airport-guide.jpg', 'Topic Guides', 'Yours to keep with points, and each has a free part to try first.'],
          ['nutrition-guide.jpg', 'Ask Your Guide', 'Ask any Guide a question. Saved answers are free; asking costs points.'],
          ['holiday-guide.jpg', 'What We Build Next', 'See the Guides we are making next and tap Notify me on the ones you want.']
        ] });
    },
    points: function () {
      return sectionPage('points', { kicker: 'Take part', title: 'Earn them by taking part', pic: 'thumb-bounties.jpg', group: 'How points work',
        how: ['<b>Read the parts below.</b> Each one is part of how points work.', '<b>Points are never bought.</b> They come from what you do here.'],
        go: ['Start earning, free', '/survey?s=explorer'], ctaTitle: 'Start with 250 points.', ctaText: 'Take the short survey, join free, and your points start today.',
        parts: [
          ['thumb-bounties.jpg', 'Earn Points', 'The survey, check-ins, bounties and friends who join with your link.'],
          ['airport-guide.jpg', 'Use Points', 'Open topic Guides, ask your Guide, or bid in the Vault where it is open.'],
          ['nonprofit-guide.jpg', 'Give Points', 'Boost a business or nonprofit you believe in, once it claims its page.'],
          ['thumb-passport.jpg', 'Level Up', 'Your level counts everything you have earned, so spending never lowers it.'],
          ['partner-ambassador.jpg', 'Your Link', 'Share any page with your link. Every friend who joins earns you 111 points.']
        ] });
    },
    paths: function () {
      return sectionPage('paths', { kicker: 'Take part', title: 'Everyone starts as an Explorer', pic: 'partner-group-partner.jpg', group: 'The paths and their badges',
        how: ['<b>Read the parts below.</b> Each one is a path, with its own Guide, its own short survey and its own badge.', '<b>Take as many as fit.</b> Run a group or community? That path is on its way: tap Notify me on the paths page.'],
        go: ['See your paths', '/paths'], ctaTitle: 'Find your path.', ctaText: 'Start as an Explorer with the short survey, then pick the paths that fit what you do.',
        parts: [
          ['thumb-passport.jpg', 'Explorer', 'Everyone starts here. The short survey makes you a member, with a badge.'],
          ['vegan-restaurant-guide.jpg', 'Restaurant', 'You feed the movement. Get your free check, claim your page and get found.'],
          ['vegan-events-guide.jpg', 'Event host', 'You bring people together. Plan it, fill it and run it, with us behind you.'],
          ['creator-guide.jpg', 'Creator', 'You tell the stories. Get seen, get booked and work with Vegan brands.'],
          ['nonprofit-guide.jpg', 'Nonprofit', 'You stand up for the animals. Get found, get help and share the load.'],
          ['pre-vegan-business-guide.jpg', 'Business', 'Adding plant-based options? Learn what to serve and how to say it.'],
          ['partner-ambassador.jpg', 'Your badges', 'Your badges show on your profile. Each opens its Guide and bounties.']
        ] });
    },
    better: function () {
      return sectionPage('better', { kicker: 'Take part', title: 'Tell us what is working and what is not', pic: 'restaurant-guide/t-fixes.jpg', group: 'Ways to tell us', feedback: true,
        how: ['<b>Read the parts below.</b> Each one is a way to reach us, and we read all of it.', '<b>Use it in your day to day.</b> We are real people, supported by technology, and we build from what you send every day.'],
        go: ['Send feedback now', '/feedback'], ctaTitle: 'Tell us one thing.', ctaText: 'Something working, missing or confusing? Send it now. It starts with the page you are on.',
        parts: [
          ['restaurant-guide/t-next.jpg', 'The Feedback button', 'On every page, in the top bar. Tell us what is broken, missing or an idea.'],
          ['nutrition-guide.jpg', 'Talk to your Guide', 'Ask a Guide anything. Saved answers are free; asking is 4 points a message.'],
          ['partner-community-manager.jpg', 'Ask a person', 'Guide did not know? Members can ask a person on our team, free.'],
          ['thumb-directory.jpg', 'Search for what is missing', 'Search for something we do not have, and it tells us what to add next.'],
          ['thumb-community.jpg', 'Tell us a place to add', 'Know a place, person or group we should list? Tell us, and we check it.'],
          ['restaurant-guide/t-pulse.jpg', 'Suggest a topic', 'Every city\'s board has Suggest a Topic, with tips for the Daily Pulse.'],
          ['partner-official-creator.jpg', 'Nominate someone', 'Nominate someone, or yourself, for the Daily Pulse and our shows.']
        ] });
    },
    animals: function () {
      return sectionPage('animals', { kicker: 'Take part', title: 'The reason we are all here', pic: 'partner-nonprofit-partner.jpg', group: 'How to show up for the animals',
        how: ['<b>Read the parts below.</b> Each one is a way to help, starting today.', '<b>Together we move the needle.</b> Businesses, people and nonprofits that actually show up can run campaigns for the animals. Be first to hear about the ones we run together.'],
        go: ['Find nonprofits and rescues', '/directory?tab=community'], ctaTitle: 'Show up for the animals.', ctaText: 'Find the nonprofits, rescues and sanctuaries near you, and give them your points.',
        parts: [
          ['nonprofit-guide.jpg', 'Nonprofits, rescues and sanctuaries', 'Listed in every chapter in the Directory, ranked by member votes.'],
          ['vegan-pets.jpg', 'The Fosters board', 'Every city has a Fosters board, so animals find a home close by.'],
          ['thumb-community.jpg', 'The Rescues board', 'Every city has a Rescues board for animals who need help now.'],
          ['vegan-events-guide.jpg', 'Sanctuary days and fundraisers', 'Find them in Events, in your chapter and around the world.'],
          ['thumb-bounties.jpg', 'Give your points', 'Give points to a nonprofit, rescue or sanctuary that has claimed its page.'],
          ['restaurant-guide/t-pulse.jpg', 'For the animals in the Pulse', 'Every morning\'s Daily Pulse has a For the animals section.']
        ] });
    },
    founder: function () {
      if (member()) {
        var m = me() || {};
        return crumb(tab('founder').label) + head('You are in', m.founding_member ? 'Welcome, Founding Member' : 'Welcome, Explorer', 'You are a member. Here is what to do first.') +
          '<div class="wg-ways">' + [
            ['1. Vote for three places you love', 'Open the Directory, find three places, and vote. Come back tomorrow and vote again.', '/directory'],
            ['2. Check in this week', 'Visiting a Vegan place? Tap Check in on its page for 10 points.', '/directory'],
            ['3. Tell us one thing', 'Something working, missing or confusing? Send it with the Feedback button. We read every one.', '']
          ].map(function (w) { return '<div class="wg-box"><h3>' + esc(w[0]) + '</h3><p>' + esc(w[1]) + '</p>' + (w[2] ? '<a href="' + w[2] + '">Open it</a>' : '<button type="button" class="dg-link" data-ve-feedback>Send feedback</button>') + '</div>'; }).join('') + '</div>' +
          '<h3 class="hg-sh">Your Path</h3><p class="dg-lede">Run a restaurant, host events, make content or work with a nonprofit? <a href="#/paths" style="color:var(--g);font-weight:800">Pick your path</a>, each free with its own survey.</p>' +
          '<h3 class="hg-sh">Where to Ask</h3><p class="dg-lede">Talk to the Guide on any Guide\'s page, ask a person on our team, or use the Feedback button on every page.</p>' +
          '<div class="dg-btns"><a class="dg-btn" href="' + esc(back || '/dashboard') + '">' + (back ? 'Go back' : 'Open your dashboard') + '</a></div>';
      }
      return crumb(tab('founder').label) + head('Become a Founder', 'You Are Early, and That Is Rare', 'A few quick questions, about two minutes, and you are in, free, with 250 points to use across the platform.' + (OPEN ? ' Join before midnight Eastern on January 1, 2027 and you are a Founding Member for good. Founders unlock some really cool things in 2027, and the only way to hear about them, and lock them in for yourself, is to join today.' : '')) +
        countdown() + explorerCard() +
        '<p class="dg-lede" style="margin-top:14px">Want to take your time? Every section of this Guide breaks down exactly how to use it today. <a href="#/" style="color:var(--g);font-weight:800">Back to the Overview</a>.</p>';
    }
  };

  // ---------- menu and Liz ----------
  function drawMenu(cur) {
    menuEl.innerHTML = TABS.map(function (t) { return '<a href="' + href(t.k) + '"' + (t.k === 'founder' ? ' class="dg-join-tab"' : '') + (t.k === cur ? ' aria-current="page"' : '') + '>' + esc(t.k === 'directory' ? 'Directory' : t.k === 'paths' ? 'Your Path' : t.label) + '</a>'; }).join('');
    menuSel.innerHTML = TABS.map(function (t, n) { return '<option value="' + t.k + '"' + (t.k === cur ? ' selected' : '') + '>' + (n + 1) + '. ' + esc(t.label) + '</option>'; }).join('');
  }
  // More than 5 tabs: the menu is a dropdown at every width (Sean, 2026-11-09, the BCPS rule).
  document.documentElement.classList.toggle('dg-dd', TABS.length > 5);
  menuSel.addEventListener('change', function () { location.hash = href(menuSel.value); });
  function setFold(folded) {
    railEl.classList.toggle('dg-folded', folded);
    foldBtn.textContent = folded ? 'Show Liz' : 'Hide Liz'; foldBtn.setAttribute('aria-expanded', String(!folded));
    try { sessionStorage.setItem('wg_liz_folded', folded ? '1' : ''); } catch (e) {}
  }
  foldBtn.addEventListener('click', function () { setFold(!railEl.classList.contains('dg-folded')); });
  try { if (sessionStorage.getItem('wg_liz_folded')) setFold(true); } catch (e) {}
  function drawLiz() {
    var t = tab(curTab), i = TABS.indexOf(t);
    bubble.textContent = member() && t.sayMember ? t.sayMember : t.say;
    // Liz in a scene for each page (Sean, 2026-11-08: "a different look on every page"); her square art is the fallback.
    var box = document.getElementById('dgMaya'), a = t.scene ? pic(t.scene) : art('liz');
    if (a && box.getAttribute('data-art') !== a) { box.style.backgroundImage = "url('" + a + "')"; box.setAttribute('data-art', a); }
    setVideo(box);
    tourEl.innerHTML = tourM.innerHTML = '<a class="dg-tnav" href="' + href(TABS[Math.max(0, i - 1)].k) + '"' + (i ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Back</a><span>' + (i + 1) + ' of ' + TABS.length + '</span>' +
      '<a class="dg-tnav next" href="' + href(TABS[Math.min(TABS.length - 1, i + 1)].k) + '"' + (i < TABS.length - 1 ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Next</a>';
  }
  // Liz's eight recorded chapters (2026-11-08, her roster-profile voice, each checked word for word with stt), back to back on the Overview.
  // The tour is one video (2026-11-09, Sean approved v2): Liz's eight chapters (chapter 1 take v3, chapter 4 take v2a) over the 48 approved frames.
  // Chapter Play buttons and the rail's Play the tour drive that video; CH_AT is where each chapter starts in it.
  var VIDEO = { v: 2, src: 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/liz/welcome-guide/tour-video-v2.mp4',
    poster: '/public/guides/welcome/tour-video-v2-poster.jpg',
    vtt: '/public/guides/welcome/tour-video-v2.vtt' };
  var CH_AT = [0, 19.984, 35.814, 53.264, 81.293, 91.272, 121.443, 131.709];
  var playBtn = document.getElementById('dgPlay'), PLAY = { at: 0, playing: false, started: false };
  function vid() { return document.getElementById('wgVideo'); }
  // Each section page plays its own short video in Liz's frame once its script is approved and recorded.
  // Each section's own video (Sean, 2026-11-09: no borrowed tour parts): Liz's approved line over that page's shots, captions from her word timings.
  var MEDIA = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/liz/welcome-guide/';
  var SEC = { directory: 'sec-directory-v2', city: 'sec-city-v2', events: 'sec-events-v2', media: 'sec-media-v2', guides: 'sec-guides-v2', points: 'sec-points-v2', paths: 'sec-paths-v2', better: 'sec-better-v1' };
  var CLIPS = { overview: [0, 1e9] };
  Object.keys(SEC).forEach(function (k) { CLIPS[k] = [0, 1e9]; });
  function cur() {
    if (curTab === 'overview' || !SEC[curTab]) return { src: VIDEO.src, vtt: VIDEO.vtt, poster: VIDEO.poster, ga: 'welcome_tour_v' + VIDEO.v };
    return { src: MEDIA + SEC[curTab] + '.mp4', vtt: '/public/guides/welcome/' + SEC[curTab] + '.vtt', poster: pic(tab(curTab).scene), ga: 'welcome_' + SEC[curTab] };
  }
  function clip() { return CLIPS[curTab] || null; }
  function chAt(t) { var n = 0; CH_AT.forEach(function (x, i) { if (t >= x - 0.05) n = i; }); return n; }
  // The tour plays in Liz's frame on the Overview (Sean, 2026-11-09: "the video plays on the right where you see Liz"), the Holiday Guide's way.
  function setVideo(box) {
    var v = vid(), ov = box.querySelector('.hg-rplay');
    if (v && v.getAttribute('data-for') !== curTab) { v.pause(); v.remove(); v = null; PLAY.started = false; PLAY.ga = 0; }
    if (!clip()) { if (v) { v.pause(); v.remove(); } if (ov) ov.hidden = true; var ex0 = box.querySelector('.hg-expand'); if (ex0) ex0.hidden = true; return; }
    if (!v) {
      v = document.createElement('video'); v.id = 'wgVideo';
      v.playsInline = true; v.preload = 'none'; v.setAttribute('playsinline', ''); var m = cur(); v.poster = m.poster; v.src = m.src; v.setAttribute('data-for', curTab);
      v.setAttribute('aria-label', 'Welcome to Vegans Explore, the tour with Liz');
      v.innerHTML = '<track kind="captions" srclang="en" label="English" default src="' + m.vtt + '">';
      try { v.textTracks[0].mode = window.innerWidth > 900 ? 'showing' : 'hidden'; } catch (e) {}
      v.addEventListener('click', function () { if (v.paused) startVid(); else v.pause(); });
      box.insertBefore(v, box.firstChild);
    }
    if (!ov) { ov = document.createElement('button'); ov.type = 'button'; ov.className = 'hg-rplay'; ov.setAttribute('aria-label', 'Play the tour'); ov.innerHTML = '&#9654;'; box.appendChild(ov);
      ov.addEventListener('click', function () { toggleTour(); }); }
    ov.hidden = !v.paused;
    if (!box.querySelector('.hg-expand')) {
      box.insertAdjacentHTML('beforeend', '<button type="button" class="hg-expand" aria-label="Expand Liz">Expand</button>');
      box.querySelector('.hg-expand').addEventListener('click', function (e) { e.stopPropagation(); expand(); });
    }
    var ex = box.querySelector('.hg-expand'); if (ex) ex.hidden = false;
  }
  function startVid() {
    var v = vid(); if (!v) return; PLAY.started = true;
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    if (!PLAY.ga) { PLAY.ga = 1; try { gtag('event', 'video_start', { video: cur().ga }); } catch (e) {} }
  }
  function paintPlay() {
    var c = clip();
    playBtn.hidden = !c;
    playBtn.classList.toggle('go', !PLAY.started);
    playBtn.innerHTML = PLAY.playing ? 'Pause Liz' : '&#9654; ' + (curTab !== 'overview' ? 'Play Liz' : PLAY.started ? 'Keep watching' : 'Play the tour');
    var ov = document.querySelector('#dgMaya .hg-rplay'); if (ov) ov.hidden = !c || PLAY.playing;
  }
  function playAt(n) {
    var v = vid(); if (!v) return;
    PLAY.at = n;
    var go = function () { try { v.currentTime = CH_AT[n]; } catch (e) {} startVid(); };
    if (v.readyState >= 1) go(); else { v.preload = 'auto'; v.addEventListener('loadedmetadata', go, { once: true }); v.load(); }
    if (window.innerWidth <= 900) railEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    paintPlay();
  }
  function seekPlay(t) {
    var v = vid(); if (!v) return;
    var go = function () { try { v.currentTime = t; } catch (e) {} startVid(); };
    if (v.readyState >= 1) go(); else { v.preload = 'auto'; v.addEventListener('loadedmetadata', go, { once: true }); v.load(); }
  }
  function toggleTour() {
    var v = vid(); if (!v) return;
    if (!v.paused) { v.pause(); return; }
    var c = clip() || [0, 1e9];
    if (curTab !== 'overview') { if (!(v.currentTime >= c[0] && v.currentTime < c[1] - 0.3)) seekPlay(c[0]); else startVid(); return; }
    if (PLAY.started && v.currentTime > 0) startVid(); else playAt(PLAY.at);
  }
  ['play', 'pause', 'ended', 'timeupdate'].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      if (!e.target || e.target.id !== 'wgVideo') return;
      var v = e.target;
      if (ev === 'play') { PLAY.playing = true; PLAY.started = true; }
      if (ev === 'pause' || ev === 'ended') PLAY.playing = false;
      if (ev === 'ended') { try { gtag('event', 'video_complete', { video: cur().ga }); } catch (er) {} }
      var n = chAt(v.currentTime), c = clip();
      // A section's clip stops at its end and waits at its start for the next Play.
      if (c && curTab !== 'overview' && ev === 'timeupdate' && v.currentTime >= c[1]) { v.pause(); try { v.currentTime = c[0]; } catch (er) {} }
      if (n !== PLAY.at || ev !== 'timeupdate') PLAY.at = n;
      if (ev === 'ended') PLAY.at = 0;
      paintPlay();
    }, true);
  });
  playBtn.addEventListener('click', toggleTour);
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-wg-ch]'); if (c) { e.preventDefault(); playAt(+c.getAttribute('data-wg-ch')); return; }
    if (e.target.closest('[data-wg-tour]')) { e.preventDefault(); toggleTour(); if (window.innerWidth <= 900) railEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  });
  // Expand (phones): the tour big in a lightbox, picking up where the frame was.
  function expand() {
    var lb = document.getElementById('hgLb');
    if (!lb) {
      lb = document.createElement('div'); lb.id = 'hgLb'; lb.className = 'hg-lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Liz, bigger');
      document.body.appendChild(lb);
      lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('.hg-lb-x')) closeExpand(); });
    }
    var v = vid(), c = clip() || [0, 1e9], at = v && v.currentTime > c[0] && v.currentTime < c[1] ? v.currentTime : (curTab === 'overview' ? CH_AT[PLAY.at] : c[0]);
    if (v) v.pause();
    lb.innerHTML = '<div class="hg-lb-in"><button type="button" class="hg-lb-x">Close</button><video controls playsinline autoplay poster="' + esc(cur().poster) + '" src="' + esc(cur().src) + '"><track kind="captions" srclang="en" label="English" default src="' + esc(cur().vtt) + '"></video></div>';
    lb.hidden = false; document.documentElement.style.overflow = 'hidden';
    var lv = lb.querySelector('video');
    lv.addEventListener('loadedmetadata', function () { try { lv.currentTime = at; lv.textTracks[0].mode = 'showing'; } catch (e) {} }, { once: true });
    if (curTab !== 'overview') lv.addEventListener('timeupdate', function () { if (lv.currentTime >= c[1]) lv.pause(); });
    lv.play().catch(function () {});
    try { gtag('event', 'video_expand', { video: cur().ga }); } catch (e) {}
    lb.querySelector('.hg-lb-x').focus();
  }
  function closeExpand() {
    var lb = document.getElementById('hgLb'); if (!lb || lb.hidden) return;
    var lv = lb.querySelector('video'), v = vid();
    if (lv && v) { try { v.currentTime = lv.currentTime; } catch (e) {} }
    if (lv) lv.pause();
    lb.hidden = true; lb.innerHTML = ''; document.documentElement.style.overflow = '';
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeExpand(); });
  tourM.addEventListener('click', function (e) { if (e.target.closest('.dg-tnav')) setTimeout(function () { railEl.scrollIntoView({ block: 'start' }); }, 0); });
  function drawJoinbox() {
    var btn = document.querySelector('[data-wg-join]'), jin = document.getElementById('wgJbIn');
    if (member()) { btn.textContent = 'Your dashboard'; jin.innerHTML = 'You\'re<br>a member'; }
    else { btn.textContent = 'Become a Founder'; jin.innerHTML = me() ? 'One step<br>left' : 'Member?<br><a href="#" data-signin>Sign in</a>'; }
  }

  function route() {
    var k = (location.hash || '').replace(/^#\/?/, '').split('/')[0] || 'overview';
    if (OLD[k]) { k = OLD[k]; history.replaceState(null, '', location.pathname + location.search + href(k)); }
    // A members-only prompt that pointed at the join step opens the Overview with its note.
    if (k === 'founder' && from && from !== 'old-link' && !member() && !/#\/founder/.test(location.hash)) k = 'overview';
    if (k !== 'overview' && !VIEWS[k]) k = 'overview';
    document.body.classList.toggle('dg-member', member());
    drawJoinbox(); drawMenu(k);
    var oldV = vid(); if (oldV && !oldV.paused) oldV.pause();
    curTab = k;
    if (k === 'overview') viewOverview(); else main.innerHTML = VIEWS[k]();
    if (window.VEExplorerCard) VEExplorerCard.wire(main);
    tickCd(); drawLiz(); paintPlay();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  document.addEventListener('click', function (e) {
    var a = auth();
    if (e.target.closest('[data-signin]')) {
      e.preventDefault(); if (!a) return;
      a.showAuthModal('Sign in to Vegans Explore.', function () { if (back) location.href = back; else location.reload(); }, 'login');
      return;
    }
    if (e.target.closest('[data-wg-join]')) {
      if (member()) { location.href = back || '/dashboard'; return; }
      location.hash = '#/founder';
      return;
    }
    if (e.target.closest('[data-ve-feedback]') && window.VEFeedback && VEFeedback.open) { e.preventDefault(); VEFeedback.open(); }
  });

  function init() {
    document.documentElement.classList.add('dg-fit');
    route();
  }
  if (window.VEAuth) init(); else window.addEventListener('load', init);
})();
