/* ve-guide-catalog.js: the Guide cards, one list for /guides and the dashboard's Guides tab (Sean, 2026-10-26: the
   dashboard should mimic "what we currently have on the main guides page"). Change a Guide here and both pages follow.

   Live Guides wear their banner (800 x 500, the Guide on white; see Guide banners in CLAUDE.md). Guides still being
   made wear a flat line icon (Sean: "use flat images, flat icons for those") and show to signed-in members only, with
   Notify me; signed out, /guides shows only the live ones. The Welcome Guide is the Passport Guide (/passport), free.

   The menu and who sees what (Sean, 2026-10-30: "we're getting enough guides now where we can create a menu... even the onboarding
   guides... some that I want the community to see, and then there's some that I just want the team to see"). Every Guide sits on a
   shelf (SHELVES: Everyday, For your work, Partner Guides, Coming soon), picked from the banner's dropdown on /guides and the
   dashboard's Guides tab alike (bannerOptions). Each Guide says who sees it in the menu (`see`): 'all', 'members', a list of
   members.ve_role values (ambassador, community_manager...), or 'team' (super admins). The team sees every Guide, each restricted
   one marked with who else does. Hiding a Guide from the menu is not a lock: a Guide page guards itself where it has to.

   Usage (the page supplies the .gc-* card styles; this file adds the banner and icon rules):
     VEGuideCatalog.render(el, { viewer: member|null, shelf: 'all'|<shelf key>, source: 'guides-live-catalog', open: function (guide, event) {} });
     VEGuideCatalog.shelves(viewer) -> [{value, label}] the menu for this viewer; VEGuideCatalog.bannerOptions(viewer, extra) for VECityBanner.
   `open` is optional: the dashboard passes one to open a Guide inside its window. A Guide with `full` opens as its own page.

   Another brand (LESARUSS.ai's /guides, 2026-10-30, canon canon-lesaruss-ai-front-door: "Guides: the catalog style") passes its own
   list and shelves: render(el, { guides: [...], shelves: [{value, label, sub}] }); every Guide in it is open to all. Its Diplomats
   get every Guide from every LESARUSS community, so it can add ours with VEGuideCatalog.communityGuides(origin, chips): our live
   Guides with links and pictures on vegansexplore.com (origin), on their own shelf ('vegans-explore').
*/
(function () {
  if (window.VEGuideCatalog) return;
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var BANNERS = SB + '/storage/v1/object/public/vegan-media/media/guides/banners/';
  var PRICE = '$11 or 1,100 points';

  var ICONS = {
    burger: '<path d="M4 11h16M5 11a7 5 0 0114 0M4 15h16M5 15v1a3 3 0 003 3h8a3 3 0 003-3v-1"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18"/>',
    camera: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
    heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z"/>',
    sprout: '<path d="M12 20v-8M12 12c0-4 3-6 7-6 0 4-3 6-7 6zM12 14c0-3-2-5-6-5 0 3 2 5 6 5z"/>',
    megaphone: '<path d="M3 10v4l11 5V5L3 10zM14 8.5l5-2.5v12l-5-2.5M6 15.4l1 4.1h3l-1-2.8"/>',
    camera2: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.6a3.5 3.5 0 010 6.8M18 14.2a6.5 6.5 0 013.5 5.8"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>'
  };

  // The Partner Guides: the onboarding Guides for the people we bring in by invitation. Each opens as its own page (`full`), never
  // inside the dashboard's frame. The Ambassador Guide (Sean, 2026-10-28: "Only available to them") shows to Ambassadors and the team.
  var PARTNERS = [
    { slug: 'official-creator', shelf: 'partners', see: ['ambassador'], full: true, icon: 'camera2', badge: 'Creators', label: 'For professional creators', tag: 'New', title: 'The Official Creator Guide',
      href: '/creators/welcome', desc: 'For creators who do this for a living: being one of our official creators, the campaigns, collaborations and hosting we bring you, how campaigns pay, and registering.',
      chips: [{ text: 'By invitation' }, { text: 'On us', cls: 'free' }], cta: 'Open the Guide' },
    { slug: 'ambassador', shelf: 'partners', see: ['ambassador'], full: true, icon: 'megaphone', badge: 'Ambassador', label: 'For Ambassadors', title: 'The Ambassador Guide',
      href: '/ambassadors/welcome', desc: 'Why it matters, the opportunity, telling the stories, paid work, your link and what it earns, what to share and who joined through you.',
      chips: [{ text: 'By invitation' }, { text: 'On us', cls: 'free' }], cta: 'Open the Guide' },
    { slug: 'community-manager', shelf: 'partners', see: ['community_manager'], full: true, icon: 'compass', badge: 'Community Manager', label: 'For Community Managers', title: 'Community Manager Onboarding',
      href: '/community-managers/onboarding', desc: 'Running a chapter: your city, its members, its events and businesses, and the work that comes with it, step by step.',
      chips: [{ text: 'Gig work' }], cta: 'Open the Guide' },
    { slug: 'group-partner', shelf: 'partners', see: 'team', full: true, icon: 'users', badge: 'Group Partner', label: 'For group organizers', title: 'The Group Partner Guide',
      href: '/groups/welcome', desc: 'For the people who run Vegan social clubs and meetups: hosting your group here, your share from 20% to 50%, the guest pass and the sample club.',
      chips: [{ text: 'Sent with the invitation' }], cta: 'Open the Guide' },
    { slug: 'nonprofit-partner', shelf: 'partners', see: 'team', full: true, icon: 'heart', badge: 'Nonprofit Partner', label: 'For Nonprofit Partners', title: 'The Nonprofit Partner Guide',
      href: '/nonprofits/welcome', desc: 'For the lead of a Nonprofit Partner: your organization\'s link, its kit, its numbers, where the money goes and its points.',
      chips: [{ text: 'Partner leads' }], cta: 'Open the Guide' }
  ];
  var SHELVES = [
    { value: 'all', label: 'All Guides' },
    { value: 'everyday', label: 'Everyday Guides' },
    { value: 'work', label: 'For your work' },
    { value: 'partners', label: 'Partner Guides' },
    { value: 'soon', label: 'Coming soon' }
  ];
  var ROLE_WORDS = { ambassador: 'Ambassadors', community_manager: 'Community Managers' };

  // In order (Sean, 2026-10-26): the Welcome Guide, the Dairy Guide, the Restaurant Guide, the Stadium & Arena Guide
  // (launched 2026-10-29), the Airport Guide and the Nonprofit Guide (both launched 2026-10-29), then what is coming.
  var GUIDES = [
    { slug: 'welcome', shelf: 'everyday', label: 'Getting Started', title: 'Welcome Guide', banner: '/public/guides/welcome-guide.jpg', href: '/passport',
      desc: 'Start here: what Vegans Explore is, your community, the Directory, the Guides and how points work. Free and open to everyone.',
      chips: [{ text: 'Free', cls: 'free' }], cta: 'Start the Welcome Guide' },
    { slug: 'vegan-dairy-guide', shelf: 'everyday', label: 'Food', tag: 'New', title: 'The Vegan Dairy Guide', banner: BANNERS + 'vegan-dairy-guide.jpg', href: '/guides/vegan-dairy-guide',
      desc: 'Everything you need to go dairy-free: the brands to buy, swaps for every kind of dairy, recipes and cookbooks, the research and our interviews, with Maya walking you through it.',
      chips: [{ text: 'Walked through by Maya' }, { text: PRICE, cls: 'price' }], cta: 'Open the Guide' },
    { slug: 'vegan-restaurant-survival-guide', shelf: 'work', label: 'Business', tag: 'New', title: 'The Vegan Restaurant Guide', banner: BANNERS + 'vegan-restaurant-survival-guide.jpg', href: '/guides/vegan-restaurant-survival-guide',
      desc: 'What may be quietly hurting your restaurant, and how to fix it: a free check of your Google listing, website and social, the fixes in your order, our interviews with business owners, and how to get featured, with Liz walking you through it.',
      chips: [{ text: 'Walked through by Liz' }, { text: 'Free check' }, { text: PRICE, cls: 'price' }], cta: 'Open the Guide' },
    { slug: 'stadium-arena-guide', shelf: 'everyday', label: 'Game Day', tag: 'New', title: 'The Stadium & Arena Guide', banner: '/public/guides/stadium-arena-guide.jpg', href: '/guides/stadium-arena-guide',
      desc: 'Where to eat Vegan at the game: every stand and what it serves, a map of the bowl that takes you from your seat to the food, and fans keeping it right, with River walking you through it. Hard Rock Stadium is free.',
      chips: [{ text: 'Walked through by River' }, { text: 'Hard Rock Stadium free' }, { text: PRICE, cls: 'price' }], cta: 'Open the Guide' },
    { slug: 'airport-guide', shelf: 'everyday', label: 'Travel', tag: 'New', title: 'The Airport Guide', banner: '/public/guides/airport-guide.jpg', href: '/guides/airport-guide',
      desc: 'Vegan food at the airport, gate by gate: every spot before or after security, a map of the terminal that takes you from your gate to the food without screening again, and travelers keeping it right, with Nori walking you through it. Fort Lauderdale is free.',
      chips: [{ text: 'Walked through by Nori' }, { text: 'Fort Lauderdale free' }, { text: PRICE, cls: 'price' }], cta: 'Open the Guide' },
    { slug: 'nonprofit-guide', shelf: 'work', label: 'Nonprofits', tag: 'New', title: 'The Nonprofit Guide', banner: '/public/guides/nonprofit-guide.jpg', href: '/guides/nonprofit-guide',
      desc: 'For the people who keep Vegan nonprofits, rescues and sanctuaries going: ten ways to fundraise and stay relevant, our nonprofit series and interviews, the Directory, businesses near you that fit a tie-in, and how to get found, with Dani walking you through it.',
      chips: [{ text: 'Walked through by Dani' }, { text: 'Tip 1 free' }, { text: PRICE, cls: 'price' }], cta: 'Open the Guide' },
    { slug: 'creator-guide', shelf: 'work', label: 'Creators', tag: 'New', title: 'The Creator Guide', banner: '/public/guides/creator-guide.jpg?v=2', href: '/guides/creator-guide',
      desc: 'For Vegan creators going from hobby to professional: ten moves, each with a real creator doing it and three action items, the creators and channels in our Directory, our creator conversations, and your next step as an Ambassador, with Kai walking you through it.',
      chips: [{ text: 'Walked through by Kai' }, { text: 'Tip 1 free' }, { text: PRICE, cls: 'price' }], cta: 'Open the Guide' },
    { slug: 'vegan-meat-alternatives', shelf: 'soon', see: 'members', soon: true, icon: 'burger', label: 'Food', title: 'The Vegan Meat Alternatives Guide',
      desc: 'Burgers, chicken, sausage, deli slices and more made from plants: the brands to buy, how to cook them and where to find them.' },
    { slug: 'entrepreneur', shelf: 'soon', see: 'members', soon: true, icon: 'briefcase', label: 'Entrepreneur Path', title: 'Entrepreneur Guide',
      desc: 'Getting your Vegan business listed, claimed and growing on the platform, step by step.' },
    { slug: 'prevegan', shelf: 'soon', see: 'members', soon: true, icon: 'sprout', label: 'Pre-Vegan Path', title: 'Pre-Vegan Guide',
      desc: 'Real answers for going from Vegan-curious to confident: what to eat, what to expect and how to start.' },
    { slug: 'seasonedvegan', shelf: 'soon', see: 'members', soon: true, icon: 'globe', label: 'Seasoned Vegan Path', title: 'Seasoned Vegan Guide',
      desc: 'Deepen your impact: advocacy, mentoring and connecting with the global movement.' }
  ];

  var CSS = '.gc-banner{display:block;aspect-ratio:8/5;border-radius:10px;overflow:hidden;background:#f4f6f4;margin-bottom:4px;}' +
    '.gc-banner img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .25s;}' +
    '.gc-card:hover .gc-banner img{transform:scale(1.02);}' +
    '.gc-banner-icon{display:flex;align-items:center;justify-content:center;background:#F2F5F2;color:#1f5f22;}' +
    '.gc-banner-icon svg{width:48px;height:48px;}' +
    '.gc-banner-amb{background:#1f5f22;color:#fff;flex-direction:column;gap:12px;text-decoration:none;}.gc-banner-amb svg{width:64px;height:64px;}' +
    '.gc-banner-amb span{font-size:13px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;}' +
    '.gc-new-tag{font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#fff;background:#1f5f22;border-radius:20px;padding:3px 10px;}' +
    '.gc-waitlist{display:none;margin-top:6px;}.gc-waitlist.open{display:flex;flex-direction:column;gap:8px;}' +
    '.gc-waitlist input{padding:9px 12px;border:1.5px solid rgba(0,0,0,.12);border-radius:6px;font-family:Montserrat,sans-serif;font-size:12px;}' +
    '.gc-chip.who{background:#fff4e0;color:#7a4b00;}' +
    '.gc-shelf-h{grid-column:1/-1;display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin:18px 0 -4px;padding-top:14px;border-top:1px solid rgba(0,0,0,.09);}' +
    '.gc-shelf-h:first-child{margin-top:0;padding-top:0;border-top:0;}' +
    '.gc-shelf-h b{font-size:13px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#1f5f22;}' +
    '.gc-shelf-h span{font-size:13px;color:rgba(26,26,26,.68);}' +
    '.gc-empty{grid-column:1/-1;font-size:14px;color:rgba(26,26,26,.68);padding:24px 0;}' +
    '.gc-waitlist-success{display:none;font-size:11px;font-weight:700;color:#1f5f22;text-align:center;}';

  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function icon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.sprout) + '</svg>';
  }

  function card(g) {
    var chips = (g.chips || (g.soon ? [{ text: PRICE, cls: 'price' }] : [])).concat(g._who ? [{ text: g._who, cls: 'who' }] : []).map(function (c) {
      return '<span class="gc-chip' + (c.cls ? ' ' + c.cls : '') + '">' + esc(c.text) + '</span>';
    }).join('');
    var top = g.soon ? '<div class="gc-banner gc-banner-icon" aria-hidden="true">' + icon(g.icon) + '</div>'
      : g.badge ? '<a class="gc-banner gc-banner-icon gc-banner-amb" href="' + esc(g.href) + '" data-frame-label="' + esc(g.title) + '" data-gc-open tabindex="-1" aria-hidden="true">' + icon(g.icon) + '<span>' + esc(g.badge) + '</span></a>'
      : '<a class="gc-banner" href="' + esc(g.href) + '" data-frame-label="' + esc(g.title) + '" data-gc-open tabindex="-1" aria-hidden="true"' + (g.newTab ? ' target="_blank" rel="noopener"' : '') + '><img src="' + esc(g.banner) + '" alt="" width="800" height="500" loading="lazy"' + (g.bannerPos ? ' style="object-position:' + esc(g.bannerPos) + '"' : '') + '></a>';
    var tag = g.soon ? '<span class="gc-soon-tag">Coming soon</span>' : g.tag ? '<span class="gc-new-tag">' + esc(g.tag) + '</span>' : '';
    var action = g.soon
      ? '<button type="button" class="gc-btn gc-btn-outline" data-gc-notify>Notify me</button>' +
        '<div class="gc-waitlist"><input type="email" placeholder="Your email address" aria-label="Email to be told when the ' + esc(g.title) + ' opens">' +
        '<button type="button" class="gc-btn gc-btn-primary" data-gc-join>Join the waitlist</button>' +
        '<div class="gc-waitlist-success">You\'re on the list.</div></div>'
      : '<a href="' + esc(g.href) + '" class="gc-btn gc-btn-primary" data-frame-label="' + esc(g.title) + '" data-gc-open' + (g.newTab ? ' target="_blank" rel="noopener"' : '') + '>' + esc(g.cta) + '</a>';
    return '<div class="gc-card' + (g.soon ? ' is-soon' : '') + '" role="listitem" data-slug="' + esc(g.slug) + '">' + top +
      '<div class="gc-topline"><span class="gc-label">' + esc(g.label) + '</span>' + tag + '</div>' +
      '<div class="gc-title">' + esc(g.title) + '</div><p class="gc-desc">' + esc(g.desc) + '</p>' +
      '<div class="gc-meta-row">' + chips + '</div>' + action + '</div>';
  }

  var SHELF_SUB = {
    everyday: 'For eating out, shopping, game day and travel.',
    work: 'For businesses, nonprofits and creators.',
    partners: 'The onboarding Guides for the people we bring in by invitation.',
    soon: 'Being made now. Tap Notify me to hear the day one opens.'
  };
  function viewerOf(opts) {
    var v = opts.viewer || null;
    return {
      member: opts.member != null ? !!opts.member : !!v,
      team: !!(v && v.is_superadmin),
      role: (v && v.ve_role) || (opts.ambassador && !(v && v.is_superadmin) ? 'ambassador' : '')
    };
  }
  // Who besides the team sees a restricted Guide in the menu, in words for the team's chip.
  function whoWords(see) {
    if (see === 'team') return 'Team only';
    if (see === 'members') return 'Members only';
    return see.map(function (r) { return ROLE_WORDS[r] || r; }).join(', ') + ' and the team';
  }
  function canSee(g, w) {
    var see = g.see || 'all';
    if (w.team) return true;
    if (see === 'all') return true;
    if (see === 'members') return w.member;
    if (see === 'team') return false;
    return w.member && see.indexOf(w.role) >= 0;
  }
  function visible(opts) {
    if (opts && opts.guides) return opts.guides.slice();
    var w = viewerOf(opts || {});
    return PARTNERS.concat(GUIDES).filter(function (g) { return canSee(g, w); }).map(function (g) {
      var c = {}; for (var k in g) c[k] = g[k];
      c._who = w.team && g.see && g.see !== 'all' ? whoWords(g.see) : '';
      return c;
    });
  }
  // The menu: only shelves with something this viewer can see.
  function shelves(viewer, opts) {
    var list = visible({ viewer: viewer, member: opts && opts.member });
    return SHELVES.filter(function (s) { return s.value === 'all' || list.some(function (g) { return g.shelf === s.value; }); });
  }
  function bannerOptions(viewer, extra) {
    var o = { key: 'guides', title: 'Vegan Guides', pickLabel: 'Guides menu', art: '/communities/new-york/banner.jpg',
      sub: 'Step-by-step Guides walked through by our Guides. Every Guide is $11 or 1,100 points, and yours to keep.',
      choices: shelves(viewer, extra), param: 'shelf', home: { label: 'Guides home', href: '/guides' } };
    for (var k in extra || {}) if (k !== 'member') o[k] = extra[k];
    return o;
  }

  function render(el, opts) {
    if (!el) return;
    opts = opts || {};
    if (!document.getElementById('ve-guide-catalog-css')) {
      var st = document.createElement('style'); st.id = 've-guide-catalog-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    var all = visible(opts), SH = opts.shelves || SHELVES;
    var shelf = opts.shelf && opts.shelf !== 'all' ? opts.shelf : '';
    var html = '';
    if (shelf) {
      var only = all.filter(function (g) { return g.shelf === shelf; });
      html = only.length ? only.map(card).join('') : '<p class="gc-empty">Nothing on this shelf for you yet.</p>';
    } else {
      // All Guides, a shelf at a time with its heading, Everyday first.
      SH.forEach(function (s) {
        if (s.value === 'all') return;
        var on = all.filter(function (g) { return g.shelf === s.value; });
        if (!on.length) return;
        html += '<div class="gc-shelf-h" role="presentation"><b>' + esc(s.label) + '</b><span>' + esc(s.sub || SHELF_SUB[s.value] || '') + '</span></div>' + on.map(card).join('');
      });
    }
    el.innerHTML = html;
    Array.prototype.forEach.call(el.querySelectorAll('.gc-card'), function (c) {
      var g = all.filter(function (x) { return x.slug === c.getAttribute('data-slug'); })[0];
      if (opts.open && !g.full) Array.prototype.forEach.call(c.querySelectorAll('[data-gc-open]'), function (a) {
        a.addEventListener('click', function (e) { e.preventDefault(); opts.open(g, e); });
      });
      var notify = c.querySelector('[data-gc-notify]');
      if (notify) notify.addEventListener('click', function () { c.querySelector('.gc-waitlist').classList.toggle('open'); });
      var join = c.querySelector('[data-gc-join]');
      if (join) join.addEventListener('click', function () {
        var input = c.querySelector('.gc-waitlist input'), email = (input.value || '').trim();
        if (!email || email.indexOf('@') === -1) { input.focus(); return; }
        join.textContent = 'Sending...'; join.disabled = true;
        fetch(SB + '/rest/v1/member_interest', {
          method: 'POST',
          headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ email: email, role_slug: 'guide-waitlist-' + g.slug, source: opts.source || 'guides-live-catalog' })
        }).then(function (r) {
          if (!r.ok) throw new Error('failed');
          c.querySelector('.gc-waitlist').classList.remove('open');
          c.querySelector('.gc-waitlist-success').style.display = 'block';
        }).catch(function () { join.textContent = 'Try again'; join.disabled = false; });
      });
    });
  }

  // Our live Guides for another LESARUSS brand's catalog: every one with a page (not the free Welcome Guide, which is our Passport,
  // and not the Partner Guides), linked and pictured on vegansexplore.com, its chips replaced by the brand's own.
  function communityGuides(origin, chips) {
    origin = origin || 'https://vegansexplore.com';
    var abs = function (u) { return /^https?:/.test(u) ? u : origin + u; };
    return GUIDES.filter(function (g) { return !g.soon && g.slug !== 'welcome' && (g.see || 'all') === 'all'; }).map(function (g) {
      return { slug: 've-' + g.slug, shelf: 'vegans-explore', label: 'Vegans Explore \u00b7 ' + g.label, title: g.title, desc: g.desc,
        banner: abs(g.banner), href: abs(g.href), newTab: true, chips: chips || [{ text: PRICE, cls: 'price' }], cta: 'Open on Vegans Explore' };
    });
  }

  window.VEGuideCatalog = { GUIDES: GUIDES, PARTNERS: PARTNERS, SHELVES: SHELVES, render: render, shelves: shelves, bannerOptions: bannerOptions, communityGuides: communityGuides };
})();
