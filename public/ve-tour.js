// ve-tour.js: guided tours, one format everywhere.
//
// The 60-second dashboard tour was rebuilt 2026-10-03 (Sean: "I like the 60 second tour, but
// it's of the old version of the website... the exact same format"), then the same format was
// opened up to other parts of the site the same day (Sean: "Let's do the tour format for other
// things": Community Manager tools, the city hubs, the Depot and the Partners page).
//
// The format: a soft spotlight on the real part of the page, a white card with "Step X of Y",
// a title and a line or two of copy, progress dots, and Back / Next / Skip tour.
//
// Tours (VETour.start(name), or ?tour=<name> on the tour's first page):
//   dashboard   the member dashboard (also ?tour=1 and /tour)
//   cm          Community Manager tools: dashboard, Certification, Pulse Desk
//   hub         any city community hub (/communities/<city>)
//   depot       The Depot, page by page
//   partners    the Partners page (/partners)
//   campaign    registered by the Directory listing page in demo mode (a campaign on a listing,
//               /campaign-engine/<brand>); a page may add tours to VETour.tours and start them.
//
// A step may carry before(), run before its spotlight is placed (open a tab, switch a view),
// and a tour may set doneLabel for its last button.
//
// A step names its page only when the tour moves between pages; the tour's state rides in
// sessionStorage across the move. Steps on the starting page are checked when the tour
// starts and skipped when that part is not on the page (a tab hidden on Depot > Dashboard
// checklist, a Community Manager prompt for a member), so a tour only points at real things.
//
// Each tour also puts its own "Take the tour" button on its pages (the dashboard prompts are
// written into center-console.html). Pages that load this file without a tour do nothing.

(function (global) {
  var Z = 999999;
  var STATE_KEY = 've_tour_state';
  var STATE_TTL = 30 * 60 * 1000;

  function q(sel) { try { return document.querySelector(sel); } catch (e) { return null; } }
  function visible(el) { return !!(el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden'); }
  function pathKey() {
    return location.pathname.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '') || '/';
  }
  function onDashboard() { return !!document.getElementById('dash-content'); }
  function onHub() { return !!(q('#hub-heading') && q('.hub-tabs')); }
  function onPartners() { return !!(q('#stage') && q('#s-seat')); }
  // The page a step lives on: 'dashboard' for every dashboard tab URL, else the clean path.
  function currentPage() { return onDashboard() ? 'dashboard' : pathKey(); }

  // ---- page helpers used by steps ------------------------------------------------------
  function dashTab(key) {
    if (typeof global.activateDashTab === 'function') { try { global.activateDashTab(key, { skipHistory: true }); } catch (e) {} }
  }
  function dashTabAvailable(key) {
    return key === 'profile' || !!q('#dash-tabs .dash-tab[data-tab-key="' + key + '"]');
  }
  function dashboardReady() {
    var c = document.getElementById('dash-content');
    return c && getComputedStyle(c).display !== 'none' && q('#dash-tabs .dash-tab');
  }
  function hubTab(key) {
    if (typeof global.switchTab === 'function') { try { global.switchTab(key); } catch (e) {} }
  }
  // The Partners page keeps its slide index private, so step with its own Back / Next.
  function partnerSlide(id) {
    var target = document.getElementById(id);
    if (!target || target.classList.contains('active')) return;
    var ids = Array.prototype.map.call(document.querySelectorAll('#stage .slide'), function (s) { return s.id; });
    for (var n = 0; n < 12 && !target.classList.contains('active'); n++) {
      var cur = ids.indexOf((q('#stage .slide.active') || {}).id);
      var btn = document.getElementById(cur < ids.indexOf(id) ? 'nav-next' : 'nav-back');
      if (!btn) return;
      btn.click();
    }
  }

  // ---- the tours ------------------------------------------------------------------------
  var DASH_PAGE = 'dashboard';
  var TOURS = {
    dashboard: {
      label: 'Dashboard tour',
      ready: dashboardReady,
      prepare: function () { if (typeof global.veCloseToolPanels === 'function') { try { global.veCloseToolPanels(); } catch (e) {} } dashTab('profile'); },
      finish: function () { dashTab('profile'); try { global.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { global.scrollTo(0, 0); } },
      steps: [
        { page: DASH_PAGE, tab: 'profile', sel: ['.dash-welcome'], title: 'Welcome to your dashboard',
          body: "This is home base for everything Vegans Explore. Here's a quick look around, on your real dashboard." },
        { page: DASH_PAGE, tab: 'profile', sel: ['#dash-welcome-stats'], title: 'Your points and level',
          body: 'Everything you do earns points: voting in the Directory, going to events, finishing guides and inviting friends. Your level climbs as they add up.' },
        { page: DASH_PAGE, tab: 'profile', sel: ['#dash-city-pill'], title: 'Choose your city',
          body: 'Your city sets what you see: local spots, local events and local news. Switch any time, even before you travel.' },
        { page: DASH_PAGE, tab: 'profile', sel: ['#dash-cm-cert-prompt'], title: 'Your certification',
          body: 'Community Managers start here. Nine short modules, each with a quick quiz. Pass them all to be certified.' },
        { page: DASH_PAGE, tab: 'profile', sel: ['#dash-tabs', '#dash-tabs-mobile'], title: 'Everything is one tab away',
          body: 'The Directory, Events, Shows, the Daily Pulse, Communities and your Tools all live right here.' },
        { page: DASH_PAGE, tab: 'profile', sel: ['#dash-leaderboard-block'], placement: 'top', title: 'The leaderboard',
          body: 'See who is leading your city and the whole community. Switch between This City and Global.' },
        { page: DASH_PAGE, tab: 'pulse', sel: ['#dash-tabs .dash-tab[data-tab-key="pulse"]', '#dash-tabs-mobile'], title: "Today's Daily Pulse",
          body: "Your city's daily briefing and today's national one: what is happening, what is coming up, and one thing you can do." },
        { page: DASH_PAGE, tab: 'directory', sel: ['#dash-tabs .dash-tab[data-tab-key="directory"]', '#dash-tabs-mobile'], title: 'The Directory',
          body: 'Vegan and Vegan-friendly restaurants, shops and services in your city. Vote for your favorites and save them to My List.' },
        { page: DASH_PAGE, tab: 'events', sel: ['#dash-tabs .dash-tab[data-tab-key="events"]', '#dash-tabs-mobile'], title: 'Events',
          body: "What's coming up in your city, from potlucks to festivals." },
        { page: DASH_PAGE, tab: 'shows', sel: ['#dash-tabs .dash-tab[data-tab-key="shows"]', '#dash-tabs-mobile'], title: 'Shows',
          body: 'Watch and listen to Vegans Explore shows and podcasts without leaving your dashboard.' },
        { page: DASH_PAGE, tab: 'communities', sel: ['#dash-tabs .dash-tab[data-tab-key="communities"]', '#dash-tabs-mobile'], title: 'Communities',
          body: 'Every city has its own community. Visit yours, or look around another city before you go.' },
        { page: DASH_PAGE, tab: 'tools', sel: ['#dash-tabs .dash-tab[data-tab-key="tools"]', '#dash-tabs-mobile'], title: 'Your tools',
          body: 'Bounties, campaigns, ways to get involved, step-by-step guides and My List, all in one place.' },
        { page: DASH_PAGE, tab: 'profile', sel: ['#lr-dock-ask'], placement: 'top', title: 'Ask your Guide',
          body: 'Have a question? Tap your Guide any time and we will get you an answer. Enjoy exploring.' }
      ]
    },

    cm: {
      label: 'Community Manager tour',
      ready: function () { return currentPage() !== DASH_PAGE || dashboardReady(); },
      prepare: function () { if (onDashboard()) { if (typeof global.veCloseToolPanels === 'function') { try { global.veCloseToolPanels(); } catch (e) {} } dashTab('profile'); } },
      steps: [
        { page: DASH_PAGE, tab: 'profile', sel: ['.dash-welcome'], title: 'Your Community Manager tools',
          body: 'A quick walk through what you have as a Community Manager: your city, your certification, the Pulse Desk and your tools.' },
        { page: DASH_PAGE, tab: 'profile', sel: ['#dash-stats-row'], title: 'What needs you',
          body: 'Today\'s Pulse for your city, everything waiting on a decision, and how your city grew this week. Tap Pending Submissions to work through them.' },
        { page: DASH_PAGE, tab: 'profile', sel: ['#dash-cm-cert-prompt'], title: 'Start with your certification',
          body: 'Your handbook as a course. This card shows your progress and takes you straight back in.' },
        { page: DASH_PAGE, tab: 'profile', sel: ['#dash-cm-pulse-prompt'], title: 'The Pulse Desk',
          body: "Where you tell us what's happening in your city. We'll look at it in a moment." },
        { page: DASH_PAGE, tab: 'tools', sel: ['#dash-tiles-flat', '#dash-tiles-sectioned'], title: 'Your tools',
          body: 'Certification lives here too, with Event Management and Directory Review on the way.' },
        { page: '/dashboard/certification', sel: ['#c-layout .side', '#c-layout'], placement: 'right', title: 'Nine short modules',
          body: 'Each module is a short read and a quick quiz. Your progress saves as you go, so you can stop and pick up any time.' },
        { page: '/dashboard/certification', sel: ['#c-main'], title: 'Learn, then pass the quiz',
          body: 'Read each page here, then answer the quiz. Pass every module to earn your certificate.' },
        { page: '/dashboard/pulse-desk', sel: ['#pd-form', '#pd-app'], title: "Tell us what's happening",
          body: 'Type it or tap the microphone and say it out loud: an opening, a closing, something people are talking about. The desk asks what it needs.' },
        { page: '/dashboard/pulse-desk', sel: ['#pd-app .side', '#pd-editor-wrap'], placement: 'left', title: 'Review, then publish',
          body: 'Your draft shows up here. Edit anything, then publish it to your community page. Your past stories are listed below it.' },
        { page: '/dashboard/pulse-desk', sel: ['.back-dash', 'h1'], title: "You're all set",
          body: 'That is everything. Head back to your dashboard any time, and thank you for leading your city.' }
      ]
    },

    hub: {
      label: 'Community tour',
      ready: onHub,
      prepare: function () { hubTab('news'); },
      finish: function () { hubTab('news'); try { global.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { global.scrollTo(0, 0); } },
      launcher: function (btn) { var host = q('.member-bar-actions'); if (!host || !onHub()) return false; btn.className += ' ve-tour-launch-light'; host.insertBefore(btn, host.firstChild); return true; },
      steps: [
        { sel: ['section.hero .hero-content', 'section.hero'], title: 'Your city, all in one place',
          body: "Every city has a community hub like this one. Here's what you'll find." },
        { sel: ['section.hero .hero-actions .btn-join'], title: 'Join this community',
          body: 'New here? Join to make this city part of your Vegans Explore account.' },
        { sel: ['.hub-tabs', '#hub-tab-select'], title: 'Everything for this city',
          body: 'News, events, the Directory, ways to get involved and local partners, one tab each.' },
        { hubTab: 'news', sel: ['#tab-btn-news', '#hub-tab-select'], title: 'Local news',
          body: 'Stories from this city: openings, closings and what people are talking about.' },
        { hubTab: 'events', sel: ['#tab-btn-events', '#hub-tab-select'], title: 'Events',
          body: "What's coming up here. Know about an event? Submit it from this tab and we'll review it." },
        { hubTab: 'directory', sel: ['#tab-btn-directory', '#hub-tab-select'], title: 'The Directory',
          body: 'Vegan and Vegan-friendly spots in this city. Vote for your favorites so others can find them.' },
        { hubTab: 'opportunities', sel: ['#tab-btn-opportunities', '#hub-tab-select'], title: 'Get involved',
          body: 'Volunteer roles and other ways to help in this city.' },
        { hubTab: 'partners', sel: ['#tab-btn-partners', '#hub-tab-select'], title: 'Local partners',
          body: 'Businesses that partner with Vegans Explore here.' },
        { sel: ['#tab-link-board', '#hub-tab-select'], title: 'The Community Board',
          body: 'Ask the city and find who can help: rescue, fostering, rides, food and more.' },
        { sel: ['#tab-btn-members', '#hub-tab-select'], title: 'For Founding Members',
          body: 'Members, Rewards and Chat open for Founding Members: $11, one time. Enjoy exploring.' }
      ]
    },

    depot: {
      label: 'Depot tour',
      ready: function () { return !!q('.depot-head'); },
      launcher: function (btn) { var host = q('.depot-head'); if (!host) return false; btn.className += ' ve-tour-launch-green'; host.appendChild(btn); return true; },
      steps: [
        { page: '/admin/depot', sel: ['.depot-head'], title: 'Welcome to the Depot',
          body: 'Everything behind Vegans Explore lives here. Use Go to on any page to jump around. This tour visits the parts you will use most.' },
        { page: '/admin/depot', sel: ['#ml-drop', '.depot-head'], title: 'The Library',
          body: 'Drop pictures, sound and video here. Everything is kept in our own storage and tagged, so any page can use it.' },
        { page: '/admin/depot/inbox', sel: ['.depot-head'], title: 'Inbox',
          body: 'Every story idea in one place: links you paste, stories members send from their hub, and what our sources find.' },
        { page: '/admin/depot/pulse', sel: ['.depot-head'], title: 'Pulse',
          body: 'Write a piece and publish it straight to the Daily Pulse.' },
        { page: '/admin/depot/pulse-cities', sel: ['.depot-head'], title: 'Pulse Cities',
          body: 'Put any published piece in one or more city hubs. A tagged piece shows in that hub\'s Local News.' },
        { page: '/admin/depot/onboarding', sel: ['.depot-head'], title: 'Onboarding',
          body: 'Set each onboarding slide\'s picture, narration, music and video.' },
        { page: '/admin/depot/preview', sel: ['.depot-head'], title: 'Preview journeys',
          body: 'Walk every onboarding journey from the first slide to the dashboard, without signing up or paying.' },
        { page: '/admin/depot/community-managers', sel: ['.depot-head'], title: 'Community Managers',
          body: 'Everyone who applied to lead a city. Approve turns on their Community Manager dashboard.' },
        { page: '/admin/depot/dashboard-checklist', sel: ['.depot-head'], title: 'Dashboard checklist',
          body: 'Choose which parts of the dashboard each view gets: Member, Community Manager and Superadmin.' },
        { page: '/admin/depot/claims', sel: ['.depot-head'], title: 'Claims',
          body: 'Which listings the public sees, and the businesses claiming theirs.' },
        { page: '/admin/depot/verified', sel: ['.depot-head'], title: 'Passport Partners',
          body: 'Every Passport Stop and Passport Anchor business, and where each one stands.' },
        { page: '/admin/depot/challenge', sel: ['.depot-head .depot-go', '.depot-head'], title: 'And the rest',
          body: 'Passport Challenge is here, and Go to has Sources, Logos, Services, Tours and Import narration. That is the Depot.' }
      ]
    },

    partners: {
      label: 'Partners tour',
      ready: onPartners,
      prepare: function () { partnerSlide('s-problem'); },
      finish: function () { partnerSlide('s-problem'); },
      launcher: function (btn) { var host = q('#s-problem .hero-inner'); if (!host) return false; btn.className += ' ve-tour-launch-light'; btn.style.marginTop = '18px'; host.appendChild(btn); return true; },
      steps: [
        { slide: 's-problem', sel: ['#s-problem .hero-inner'], title: 'Partner with Vegans Explore',
          body: 'This short guide shows how partnering works, one slide at a time.' },
        { slide: 's-problem', sel: ['#stage-nav'], placement: 'top', title: 'Move through the slides',
          body: 'Use Next and Back, or the arrow keys. Each slide has a short narration you can play.' },
        { slide: 's-seat', sel: ['#s-seat .member-box'], title: 'Step 1: Founding Membership',
          body: '$11, one time. It is how you join, and it unlocks full details and pricing for every option.' },
        { slide: 's-seat', sel: ['#s-seat .ways'], title: 'Step 2: choose your part',
          body: 'Fill the goodie bags, bring your table to a Community Night, grow your menu, or shape the whole season.' },
        { slide: 's-seat', sel: ['#s-seat [data-vpg-join]'], title: 'Take your seat',
          body: 'Answer a few quick questions and see the options that fit your business.' },
        { slide: 's-seat', sel: ['#s-seat [data-vpg-open]', '#faq-open'], title: 'Questions?',
          body: 'Not sure yet? Ask us and we will reply. Common questions covers checkout, timing and food at your table.' }
      ]
    }
  };

  // ---- state ----------------------------------------------------------------------------
  var tourName = null, tour = null, order = [], pos = 0;
  var currentTarget = null, currentPlacement = 'bottom', currentRing = null;

  function saveState() {
    try { sessionStorage.setItem(STATE_KEY, JSON.stringify({ tour: tourName, order: order, pos: pos, at: Date.now() })); } catch (e) {}
  }
  function readState() {
    try {
      var s = JSON.parse(sessionStorage.getItem(STATE_KEY) || 'null');
      if (!s || !TOURS[s.tour] || Date.now() - (s.at || 0) > STATE_TTL) return null;
      return s;
    } catch (e) { return null; }
  }
  function clearState() { try { sessionStorage.removeItem(STATE_KEY); } catch (e) {} }

  function stepPage(step) { return step.page || null; }
  function onStepPage(step) { var p = stepPage(step); return !p || p === currentPage(); }

  function findEl(step) {
    for (var i = 0; i < step.sel.length; i++) {
      var el = q(step.sel[i]);
      if (visible(el)) return el;
    }
    return null;
  }

  // Steps on this page are kept only when their part is here. Steps on other pages are
  // checked when the tour gets there.
  function keepStep(step) {
    if (!onStepPage(step)) return true;
    if (step.tab) {
      if (!dashTabAvailable(step.tab)) return false;
      if (step.tab !== 'profile') return true;
    }
    if (step.hubTab) return !!q('#tab-btn-' + step.hubTab);
    if (step.slide) return step.sel.some(function (s) { return !!q(s); });
    // A step that sets up its own part (before) is checked once that has run.
    if (step.before) return step.sel.some(function (s) { return !!q(s); });
    return !!findEl(step);
  }

  function whenReady(fn) {
    var tries = 0;
    (function wait() {
      if (tour.ready && !tour.ready()) { if (++tries < 80) setTimeout(wait, 150); return; }
      fn();
    })();
  }

  function start(name, onReady) {
    name = TOURS[name] ? name : 'dashboard';
    var t = TOURS[name];
    var first = t.steps[0];
    // Begin on the tour's first page when it has one and we are elsewhere.
    if (stepPage(first) && stepPage(first) !== currentPage()) {
      location.href = (stepPage(first) === DASH_PAGE ? '/dashboard' : stepPage(first)) + '?tour=' + name;
      return;
    }
    teardown();
    tourName = name; tour = t;
    whenReady(function () {
      if (typeof onReady === 'function') onReady();
      if (tour.prepare) tour.prepare();
      order = [];
      tour.steps.forEach(function (s, i) { if (keepStep(s)) order.push(i); });
      if (!order.length) return;
      pos = 0;
      show();
    });
  }

  function go(n) {
    if (n < 0) n = 0;
    if (n >= order.length) { finish(); return; }
    pos = n;
    var step = tour.steps[order[pos]];
    if (!onStepPage(step)) {
      saveState();
      location.href = stepPage(step) === DASH_PAGE ? '/dashboard' : stepPage(step);
      return;
    }
    show();
  }

  function finish() {
    clearState();
    teardown();
    if (tour && tour.finish) tour.finish();
  }

  function teardown() {
    ['overlay-spotlight', 'overlay-card', 'tab-highlight'].forEach(function (id) {
      var el = document.getElementById('ve-tour-' + id);
      if (el) el.parentNode.removeChild(el);
    });
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', reposition);
    window.removeEventListener('scroll', reposition, true);
  }

  function onKey(e) {
    if (e.key === 'Escape') finish();
    else if (e.key === 'ArrowRight') { e.stopPropagation(); go(pos + 1); }
    else if (e.key === 'ArrowLeft' && pos > 0) { e.stopPropagation(); go(pos - 1); }
  }

  function ensureStyle() {
    if (document.getElementById('ve-tour-style')) return;
    var style = document.createElement('style');
    style.id = 've-tour-style';
    style.textContent =
      '#ve-tour-overlay-spotlight{position:absolute;pointer-events:none;border-radius:10px;' +
      'box-shadow:0 0 0 9999px rgba(0,0,0,0.32);transition:top .25s ease,left .25s ease,width .25s ease,height .25s ease;z-index:' + Z + ';}' +
      '#ve-tour-tab-highlight{position:absolute;pointer-events:none;border-radius:8px;' +
      'border:2.5px solid #22C55E;box-shadow:0 0 0 3px rgba(34,197,94,0.25);' +
      'transition:top .25s ease,left .25s ease,width .25s ease,height .25s ease;z-index:' + (Z + 1) + ';}' +
      '#ve-tour-overlay-card{position:absolute;max-width:340px;background:#fff;border-radius:14px;text-align:left;' +
      'box-shadow:0 12px 40px rgba(0,0,0,0.3);padding:20px 22px;font-family:"Montserrat",sans-serif;z-index:' + (Z + 2) + ';' +
      'transition:top .25s ease,left .25s ease;}' +
      '#ve-tour-overlay-card.centered{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);}' +
      '.ve-tour-eyebrow{font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#15803D;margin-bottom:6px;}' +
      '.ve-tour-title{font-size:16px;font-weight:900;color:#1a1a1a;margin-bottom:8px;line-height:1.25;padding-right:64px;text-transform:none;letter-spacing:0;}' +
      '.ve-tour-body{font-size:13px;color:#444;line-height:1.55;margin-bottom:16px;}' +
      '.ve-tour-row{display:flex;align-items:center;justify-content:space-between;gap:10px;}' +
      '.ve-tour-dots{display:flex;gap:5px;flex-wrap:wrap;}' +
      '.ve-tour-dot{width:6px;height:6px;border-radius:50%;background:rgba(0,0,0,0.15);}' +
      '.ve-tour-dot.active{background:#22C55E;width:14px;border-radius:3px;transition:width .15s;}' +
      '.ve-tour-btns{display:flex;gap:8px;flex-shrink:0;}' +
      '.ve-tour-btn{border:none;cursor:pointer;font-family:"Montserrat",sans-serif;font-size:11.5px;font-weight:800;' +
      'letter-spacing:.05em;text-transform:uppercase;padding:9px 16px;min-height:40px;border-radius:7px;}' +
      '.ve-tour-btn-primary{background:#15803D;color:#fff;}' +
      '.ve-tour-btn-primary:hover{background:#166534;}' +
      '.ve-tour-btn-back{background:#F3F4F6;color:#444;}' +
      '.ve-tour-btn-back:hover{background:#E5E7EB;}' +
      '.ve-tour-skip{font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#666;' +
      'background:none;border:none;cursor:pointer;text-decoration:underline;font-family:"Montserrat",sans-serif;' +
      'position:absolute;top:10px;right:14px;padding:6px 0;}' +
      '.ve-tour-launch{font-family:"Montserrat",sans-serif;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;' +
      'border-radius:99px;padding:8px 16px;min-height:40px;cursor:pointer;background:transparent;display:inline-flex;align-items:center;gap:6px;}' +
      '.ve-tour-launch-light{color:#fff;border:1.5px solid rgba(255,255,255,0.7);}' +
      '.ve-tour-launch-light:hover{border-color:#fff;background:rgba(255,255,255,0.08);}' +
      '.ve-tour-launch-green{color:#1f5f22;border:1.5px solid #1f5f22;background:#fff;}' +
      '.ve-tour-launch-green:hover{background:#EAF7EA;}' +
      '@media (max-width:520px){#ve-tour-overlay-card{max-width:calc(100vw - 32px);}}';
    document.head.appendChild(style);
  }

  function ensureDom() {
    ensureStyle();
    if (document.getElementById('ve-tour-overlay-card')) return;
    var spotlight = document.createElement('div');
    spotlight.id = 've-tour-overlay-spotlight';
    document.body.appendChild(spotlight);
    var ring = document.createElement('div');
    ring.id = 've-tour-tab-highlight';
    ring.style.display = 'none';
    document.body.appendChild(ring);
    var card = document.createElement('div');
    card.id = 've-tour-overlay-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-live', 'polite');
    document.body.appendChild(card);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
  }

  function reposition() {
    var card = document.getElementById('ve-tour-overlay-card');
    var spotlight = document.getElementById('ve-tour-overlay-spotlight');
    var ring = document.getElementById('ve-tour-tab-highlight');
    if (!card || !spotlight) return;

    if (ring) {
      if (currentRing && currentRing !== currentTarget && visible(currentRing)) {
        var b = currentRing.getBoundingClientRect(), bp = 4;
        ring.style.display = 'block';
        ring.style.top = (b.top + window.scrollY - bp) + 'px';
        ring.style.left = (b.left + window.scrollX - bp) + 'px';
        ring.style.width = (b.width + bp * 2) + 'px';
        ring.style.height = (b.height + bp * 2) + 'px';
      } else {
        ring.style.display = 'none';
      }
    }

    if (!currentTarget || !document.body.contains(currentTarget) || !visible(currentTarget)) {
      spotlight.style.display = 'none';
      card.classList.add('centered');
      return;
    }
    card.classList.remove('centered');
    spotlight.style.display = 'block';

    var rect = currentTarget.getBoundingClientRect();
    var pad = 8;
    var top = rect.top + window.scrollY - pad;
    var left = rect.left + window.scrollX - pad;
    var width = rect.width + pad * 2;
    var height = rect.height + pad * 2;
    spotlight.style.top = top + 'px';
    spotlight.style.left = left + 'px';
    spotlight.style.width = width + 'px';
    spotlight.style.height = height + 'px';

    var cardRect = card.getBoundingClientRect();
    var cTop, cLeft, gap = 18;
    var vTop = window.scrollY + 12, vBottom = window.scrollY + window.innerHeight - 12;
    if ((currentPlacement === 'left' || currentPlacement === 'right') && window.innerWidth > 760) {
      cTop = top + height / 2 - cardRect.height / 2;
      cLeft = currentPlacement === 'right' ? left + width + gap : left - cardRect.width - gap;
      if (cLeft + cardRect.width > window.scrollX + window.innerWidth - 12) cLeft = left - cardRect.width - gap;
      if (cLeft < window.scrollX + 12) cLeft = left + width + gap;
      if (cTop < vTop) cTop = vTop;
      if (cTop + cardRect.height > vBottom) cTop = Math.max(vTop, vBottom - cardRect.height);
    } else if (currentPlacement === 'top') {
      cTop = top - cardRect.height - gap;
      cLeft = left + width / 2 - cardRect.width / 2;
      if (cTop < vTop) cTop = top + height + gap;
    } else {
      cTop = top + height + gap;
      cLeft = left + width / 2 - cardRect.width / 2;
      if (cTop + cardRect.height > vBottom && top - cardRect.height - gap > vTop) cTop = top - cardRect.height - gap;
    }
    // A target taller than the screen: keep the card on screen over it.
    if (cTop + cardRect.height > vBottom && cTop > vTop + 40 && height > window.innerHeight * 0.6) cTop = Math.max(vTop, vBottom - cardRect.height);
    var minLeft = window.scrollX + 12;
    var maxLeft = window.scrollX + window.innerWidth - cardRect.width - 12;
    if (cLeft < minLeft) cLeft = minLeft;
    if (cLeft > maxLeft) cLeft = Math.max(minLeft, maxLeft);
    card.style.top = cTop + 'px';
    card.style.left = cLeft + 'px';
  }

  function show() {
    var step = tour.steps[order[pos]];
    ensureDom();
    saveState();
    if (step.tab) dashTab(step.tab);
    if (step.hubTab) hubTab(step.hubTab);
    if (step.slide) partnerSlide(step.slide);
    // A step can set up its own part of the page first (open a tab, switch a view).
    if (typeof step.before === 'function') { try { step.before(); } catch (e) {} }
    var settle = (step.tab && step.tab !== 'profile') || step.hubTab || step.slide || step.before ? 180 : 0;

    var tries = 0;
    setTimeout(function paint() {
      currentTarget = findEl(step);
      // Parts that load after the page (certification, the Pulse Desk) get a few seconds.
      if (!currentTarget && ++tries < 25) { setTimeout(paint, 200); return; }
      currentRing = null;
      if (step.tab && step.tab !== 'profile') currentRing = q('#dash-tabs .dash-tab[data-tab-key="' + step.tab + '"]');
      if (step.hubTab) currentRing = q('#tab-btn-' + step.hubTab);
      currentPlacement = step.placement || 'bottom';
      if (currentTarget && currentTarget.scrollIntoView) currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' });

      var total = order.length, isLast = pos === total - 1;
      var card = document.getElementById('ve-tour-overlay-card');
      card.setAttribute('aria-label', (tour.label || 'Tour') + ', step ' + (pos + 1) + ' of ' + total);
      card.innerHTML =
        '<button type="button" class="ve-tour-skip" id="ve-tour-skip-btn">Skip tour</button>' +
        '<div class="ve-tour-eyebrow">Step ' + (pos + 1) + ' of ' + total + '</div>' +
        '<div class="ve-tour-title">' + step.title + '</div>' +
        '<div class="ve-tour-body">' + step.body + '</div>' +
        '<div class="ve-tour-row">' +
          '<div class="ve-tour-dots" aria-hidden="true">' + order.map(function (_, i) { return '<div class="ve-tour-dot' + (i === pos ? ' active' : '') + '"></div>'; }).join('') + '</div>' +
          '<div class="ve-tour-btns">' +
            (pos > 0 ? '<button type="button" class="ve-tour-btn ve-tour-btn-back" id="ve-tour-back-btn">Back</button>' : '') +
            '<button type="button" class="ve-tour-btn ve-tour-btn-primary" id="ve-tour-next-btn">' + (isLast ? (tour.doneLabel || 'Start Exploring') : 'Next') + '</button>' +
          '</div>' +
        '</div>';
      document.getElementById('ve-tour-skip-btn').addEventListener('click', finish);
      var back = document.getElementById('ve-tour-back-btn');
      if (back) back.addEventListener('click', function () { go(pos - 1); });
      var next = document.getElementById('ve-tour-next-btn');
      next.addEventListener('click', function () { if (isLast) finish(); else go(pos + 1); });
      try { next.focus({ preventScroll: true }); } catch (e) {}
      requestAnimationFrame(reposition);
      setTimeout(reposition, 450);
    }, settle); // a tab or slide change needs a moment before measuring
  }

  // Resume a tour that moved here from another page.
  function resume(s) {
    tourName = s.tour; tour = TOURS[s.tour]; order = s.order || []; pos = s.pos || 0;
    var step = tour.steps[order[pos]];
    if (!step || !onStepPage(step)) return;
    whenReady(function () { setTimeout(show, 120); });
  }

  // "Take the tour" buttons for tours that live on this page.
  function mountLaunchers() {
    Object.keys(TOURS).forEach(function (name) {
      var t = TOURS[name];
      if (!t.launcher || document.getElementById('ve-tour-launch-' + name)) return;
      var tries = 0;
      (function attempt() {
        if (document.getElementById('ve-tour-launch-' + name)) return;
        ensureStyle();
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 've-tour-launch-' + name;
        btn.className = 've-tour-launch';
        btn.innerHTML = '<span aria-hidden="true">&#128075;</span> Take the tour';
        btn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); start(name); });
        if (!t.launcher(btn) && ++tries < 20) setTimeout(attempt, 250);
      })();
    });
  }

  global.VETour = {
    start: function (name) { start(name || 'dashboard'); },
    tours: TOURS,
    steps: TOURS.dashboard.steps
  };

  function boot() {
    mountLaunchers();
    var param = null;
    try { param = new URLSearchParams(location.search).get('tour'); } catch (e) {}
    if (param) {
      var name = param === '1' ? 'dashboard' : param;
      if (TOURS[name]) {
        start(name, function () {
          try {
            var u = new URL(location.href); u.searchParams.delete('tour');
            history.replaceState(history.state, '', u.pathname + u.search + u.hash);
          } catch (e) {}
        });
        return;
      }
    }
    var s = readState();
    if (s) resume(s);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
