// ve-tour.js: the 60-second tour.
//
// Rebuilt 2026-10-03 (Sean: "I like the 60 second tour, but it's of the old version of the
// website... do an updated version that shows the new layout ... the exact same format").
// Same format as before: a soft spotlight on the real part of the page, a white card with
// "Step X of Y", the title and copy, progress dots, and Back / Next / Skip tour. What changed
// is where it runs. The old tour opened inside an iframe and walked through the Atlanta hub,
// the old Guides page and Get Involved. Now every step is on the member's own dashboard
// (/dashboard/center-console): the header, the tabs, the leaderboard, the Daily Pulse, each
// tab, Tools and the Guide button.
//
// Steps are filtered when the tour starts: a step is skipped when its part is not on this
// member's dashboard (a tab Sean hid on Depot > Dashboard checklist, the Community Manager
// certification for a member, and so on), so the tour only ever points at real things.
//
// Entry points: the "Take the 60-second tour" prompt on the dashboard calls VETour.start()
// in place, and /tour (tour.html) sends visitors to /dashboard?tour=1, which starts it once
// the dashboard has loaded (after sign-in, for a visitor who was signed out). Other pages
// that still load this file do nothing.

(function (global) {
  var Z = 999999;

  // sel: the first visible match is spotlighted (lists cover desktop and phone markup).
  // tab: the dashboard tab to open first. role: only offered when that part is on the page.
  var TOUR_STEPS = [
    {
      tab: 'profile', sel: ['.dash-welcome'],
      title: 'Welcome to your dashboard',
      body: "This is home base for everything Vegans Explore. Here's a quick look around, on your real dashboard.",
      placement: 'bottom'
    },
    {
      tab: 'profile', sel: ['#dash-welcome-stats'],
      title: 'Your points and level',
      body: 'Everything you do earns points: voting in the Directory, going to events, finishing guides and inviting friends. Your level climbs as they add up.',
      placement: 'bottom'
    },
    {
      tab: 'profile', sel: ['#dash-city-pill'],
      title: 'Choose your city',
      body: 'Your city sets what you see: local spots, local events and local news. Switch any time, even before you travel.',
      placement: 'bottom'
    },
    {
      tab: 'profile', sel: ['#dash-cm-cert-prompt'],
      title: 'Your certification',
      body: 'Community Managers start here. Nine short modules, each with a quick quiz. Pass them all to be certified.',
      placement: 'bottom'
    },
    {
      tab: 'profile', sel: ['#dash-tabs', '#dash-tabs-mobile'],
      title: 'Everything is one tab away',
      body: 'The Directory, Events, Shows, the Daily Pulse, Communities and your Tools all live right here.',
      placement: 'bottom'
    },
    {
      tab: 'profile', sel: ['#dash-leaderboard-block'],
      title: 'The leaderboard',
      body: 'See who is leading your city and the whole community. Switch between This City and Global.',
      placement: 'top'
    },
    {
      tab: 'profile', sel: ['#dash-home-pulse-block'],
      title: "Today's Daily Pulse",
      body: 'The latest Vegan news and stories. See All opens the full feed.',
      placement: 'top'
    },
    {
      tab: 'directory', sel: ['#dash-tabs .dash-tab[data-tab-key="directory"]', '#dash-tabs-mobile'],
      title: 'The Directory',
      body: 'Vegan and Vegan-friendly restaurants, shops and services in your city. Vote for your favorites and save them to My List.',
      placement: 'bottom'
    },
    {
      tab: 'events', sel: ['#dash-tabs .dash-tab[data-tab-key="events"]', '#dash-tabs-mobile'],
      title: 'Events',
      body: "What's coming up in your city, from potlucks to festivals.",
      placement: 'bottom'
    },
    {
      tab: 'shows', sel: ['#dash-tabs .dash-tab[data-tab-key="shows"]', '#dash-tabs-mobile'],
      title: 'Shows',
      body: 'Watch and listen to Vegans Explore shows and podcasts without leaving your dashboard.',
      placement: 'bottom'
    },
    {
      tab: 'communities', sel: ['#dash-tabs .dash-tab[data-tab-key="communities"]', '#dash-tabs-mobile'],
      title: 'Communities',
      body: 'Every city has its own community. Visit yours, or look around another city before you go.',
      placement: 'bottom'
    },
    {
      tab: 'tools', sel: ['#dash-tabs .dash-tab[data-tab-key="tools"]', '#dash-tabs-mobile'],
      title: 'Your tools',
      body: 'Bounties, campaigns, ways to get involved, step-by-step guides and My List, all in one place.',
      placement: 'bottom'
    },
    {
      tab: 'profile', sel: ['#lr-dock-ask'],
      title: 'Ask your Guide',
      body: 'Have a question? Tap your Guide any time and we will get you an answer. Enjoy exploring.',
      placement: 'top'
    }
  ];

  var steps = [];
  var current = 0;
  var currentTarget = null;
  var currentPlacement = 'bottom';
  var currentTabButton = null;

  function onDashboard() { return !!document.getElementById('dash-content'); }
  function visible(el) { return !!(el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden'); }
  function tabAvailable(key) {
    if (key === 'profile') return true;
    return !!document.querySelector('#dash-tabs .dash-tab[data-tab-key="' + key + '"]');
  }
  function openTab(key) {
    if (typeof global.activateDashTab === 'function') { try { global.activateDashTab(key, { skipHistory: true }); } catch (e) {} }
  }
  function findEl(step) {
    for (var i = 0; i < step.sel.length; i++) {
      var el = document.querySelector(step.sel[i]);
      if (visible(el)) return el;
    }
    return null;
  }

  // Keep a step only when its tab is on this member's dashboard and its part shows there.
  function availableSteps() {
    return TOUR_STEPS.filter(function (s) {
      if (!tabAvailable(s.tab)) return false;
      if (s.tab !== 'profile') return true;
      return !!findEl(s);
    });
  }

  function dashboardReady() {
    var c = document.getElementById('dash-content');
    return c && getComputedStyle(c).display !== 'none' && document.querySelector('#dash-tabs .dash-tab');
  }

  function startTour(onReady) {
    if (!onDashboard()) { location.href = '/dashboard?tour=1'; return; }
    var tries = 0;
    (function wait() {
      if (!dashboardReady()) { if (++tries < 80) setTimeout(wait, 150); return; }
      if (typeof onReady === 'function') onReady();
      if (typeof global.veCloseToolPanels === 'function') { try { global.veCloseToolPanels(); } catch (e) {} }
      openTab('profile');
      steps = availableSteps();
      if (!steps.length) return;
      goToStep(0);
    })();
  }

  function goToStep(idx) {
    if (idx < 0) idx = 0;
    if (idx >= steps.length) { finishTour(); return; }
    current = idx;
    renderStep(idx);
  }

  function finishTour() {
    teardown();
    openTab('profile');
    try { global.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { global.scrollTo(0, 0); }
  }

  function teardown() {
    ['overlay-spotlight', 'overlay-card', 'tab-highlight'].forEach(function (id) {
      var el = document.getElementById('ve-tour-' + id);
      if (el) el.parentNode.removeChild(el);
    });
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', reposition);
    window.removeEventListener('scroll', reposition, true);
  }

  function onKey(e) {
    if (e.key === 'Escape') finishTour();
    else if (e.key === 'ArrowRight') goToStep(current + 1);
    else if (e.key === 'ArrowLeft' && current > 0) goToStep(current - 1);
  }

  function ensureDom() {
    if (document.getElementById('ve-tour-overlay-card')) return;
    if (!document.getElementById('ve-tour-style')) {
      var style = document.createElement('style');
      style.id = 've-tour-style';
      style.textContent =
        '#ve-tour-overlay-spotlight{position:absolute;pointer-events:none;border-radius:10px;' +
        'box-shadow:0 0 0 9999px rgba(0,0,0,0.32);transition:top .25s ease,left .25s ease,width .25s ease,height .25s ease;z-index:' + Z + ';}' +
        '#ve-tour-tab-highlight{position:absolute;pointer-events:none;border-radius:8px;' +
        'border:2.5px solid #22C55E;box-shadow:0 0 0 3px rgba(34,197,94,0.25);' +
        'transition:top .25s ease,left .25s ease,width .25s ease,height .25s ease;z-index:' + (Z + 1) + ';}' +
        '#ve-tour-overlay-card{position:absolute;max-width:340px;background:#fff;border-radius:14px;' +
        'box-shadow:0 12px 40px rgba(0,0,0,0.3);padding:20px 22px;font-family:"Montserrat",sans-serif;z-index:' + (Z + 2) + ';' +
        'transition:top .25s ease,left .25s ease;}' +
        '#ve-tour-overlay-card.centered{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);}' +
        '.ve-tour-eyebrow{font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#16A34A;margin-bottom:6px;}' +
        '.ve-tour-title{font-size:16px;font-weight:900;color:#1a1a1a;margin-bottom:8px;line-height:1.25;padding-right:64px;}' +
        '.ve-tour-body{font-size:13px;color:#444;line-height:1.55;margin-bottom:16px;}' +
        '.ve-tour-row{display:flex;align-items:center;justify-content:space-between;gap:10px;}' +
        '.ve-tour-dots{display:flex;gap:5px;flex-wrap:wrap;}' +
        '.ve-tour-dot{width:6px;height:6px;border-radius:50%;background:rgba(0,0,0,0.15);}' +
        '.ve-tour-dot.active{background:#22C55E;width:14px;border-radius:3px;transition:width .15s;}' +
        '.ve-tour-btns{display:flex;gap:8px;flex-shrink:0;}' +
        '.ve-tour-btn{border:none;cursor:pointer;font-family:"Montserrat",sans-serif;font-size:11.5px;font-weight:800;' +
        'letter-spacing:.05em;text-transform:uppercase;padding:9px 16px;min-height:40px;border-radius:7px;}' +
        '.ve-tour-btn-primary{background:#16A34A;color:#fff;}' +
        '.ve-tour-btn-primary:hover{background:#15803D;}' +
        '.ve-tour-btn-back{background:#F3F4F6;color:#555;}' +
        '.ve-tour-btn-back:hover{background:#E5E7EB;}' +
        '.ve-tour-skip{font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#777;' +
        'background:none;border:none;cursor:pointer;text-decoration:underline;font-family:"Montserrat",sans-serif;' +
        'position:absolute;top:10px;right:14px;padding:6px 0;}' +
        '@media (max-width:520px){#ve-tour-overlay-card{max-width:calc(100vw - 32px);}}';
      document.head.appendChild(style);
    }

    var spotlight = document.createElement('div');
    spotlight.id = 've-tour-overlay-spotlight';
    document.body.appendChild(spotlight);

    var tabHighlight = document.createElement('div');
    tabHighlight.id = 've-tour-tab-highlight';
    tabHighlight.style.display = 'none';
    document.body.appendChild(tabHighlight);

    var card = document.createElement('div');
    card.id = 've-tour-overlay-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-live', 'polite');
    document.body.appendChild(card);

    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
  }

  function reposition() {
    var card = document.getElementById('ve-tour-overlay-card');
    var spotlight = document.getElementById('ve-tour-overlay-spotlight');
    var tabHighlight = document.getElementById('ve-tour-tab-highlight');
    if (!card || !spotlight) return;

    if (tabHighlight) {
      if (currentTabButton && currentTabButton !== currentTarget && visible(currentTabButton)) {
        var b = currentTabButton.getBoundingClientRect(), bp = 4;
        tabHighlight.style.display = 'block';
        tabHighlight.style.top = (b.top + window.scrollY - bp) + 'px';
        tabHighlight.style.left = (b.left + window.scrollX - bp) + 'px';
        tabHighlight.style.width = (b.width + bp * 2) + 'px';
        tabHighlight.style.height = (b.height + bp * 2) + 'px';
      } else {
        tabHighlight.style.display = 'none';
      }
    }

    if (!currentTarget || !document.body.contains(currentTarget)) {
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
    if (currentPlacement === 'top') {
      cTop = top - cardRect.height - gap;
      cLeft = left + width / 2 - cardRect.width / 2;
      if (cTop < window.scrollY + 12) cTop = top + height + gap;
    } else {
      cTop = top + height + gap;
      cLeft = left + width / 2 - cardRect.width / 2;
      if (cTop + cardRect.height > window.scrollY + window.innerHeight - 12 && top - cardRect.height - gap > window.scrollY + 12) {
        cTop = top - cardRect.height - gap;
      }
    }
    var minLeft = window.scrollX + 12;
    var maxLeft = window.scrollX + window.innerWidth - cardRect.width - 12;
    if (cLeft < minLeft) cLeft = minLeft;
    if (cLeft > maxLeft) cLeft = Math.max(minLeft, maxLeft);
    card.style.top = cTop + 'px';
    card.style.left = cLeft + 'px';
  }

  function renderStep(idx) {
    var step = steps[idx];
    ensureDom();
    if (step.tab) openTab(step.tab);

    setTimeout(function () {
      currentTarget = findEl(step);
      currentTabButton = step.tab && step.tab !== 'profile' ? document.querySelector('#dash-tabs .dash-tab[data-tab-key="' + step.tab + '"]') : null;
      currentPlacement = step.placement || 'bottom';
      if (currentTarget && currentTarget.scrollIntoView) {
        currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }

      var isLast = idx === steps.length - 1;
      var card = document.getElementById('ve-tour-overlay-card');
      card.setAttribute('aria-label', 'Tour, step ' + (idx + 1) + ' of ' + steps.length);
      card.innerHTML =
        '<button type="button" class="ve-tour-skip" id="ve-tour-skip-btn">Skip tour</button>' +
        '<div class="ve-tour-eyebrow">Step ' + (idx + 1) + ' of ' + steps.length + '</div>' +
        '<div class="ve-tour-title">' + step.title + '</div>' +
        '<div class="ve-tour-body">' + step.body + '</div>' +
        '<div class="ve-tour-row">' +
          '<div class="ve-tour-dots" id="ve-tour-dots" aria-hidden="true"></div>' +
          '<div class="ve-tour-btns">' +
            (idx > 0 ? '<button type="button" class="ve-tour-btn ve-tour-btn-back" id="ve-tour-back-btn">Back</button>' : '') +
            '<button type="button" class="ve-tour-btn ve-tour-btn-primary" id="ve-tour-next-btn">' + (isLast ? 'Start Exploring' : 'Next') + '</button>' +
          '</div>' +
        '</div>';

      var dotsEl = document.getElementById('ve-tour-dots');
      steps.forEach(function (_, i) {
        var d = document.createElement('div');
        d.className = 've-tour-dot' + (i === idx ? ' active' : '');
        dotsEl.appendChild(d);
      });

      document.getElementById('ve-tour-skip-btn').addEventListener('click', finishTour);
      var backBtn = document.getElementById('ve-tour-back-btn');
      if (backBtn) backBtn.addEventListener('click', function () { goToStep(idx - 1); });
      var nextBtn = document.getElementById('ve-tour-next-btn');
      nextBtn.addEventListener('click', function () { if (isLast) finishTour(); else goToStep(idx + 1); });
      try { nextBtn.focus({ preventScroll: true }); } catch (e) {}

      requestAnimationFrame(reposition);
      // Smooth scrolling and late-loading tab content move things; settle once more.
      setTimeout(reposition, 450);
    }, step.tab && step.tab !== 'profile' ? 150 : 0);
  }

  global.VETour = { start: function () { startTour(); }, steps: TOUR_STEPS };

  // /tour sends people to /dashboard?tour=1; start once the dashboard is up, and drop the
  // flag from the address so a refresh does not restart it.
  function autoStart() {
    if (!onDashboard()) return;
    var on = false;
    try { on = new URLSearchParams(location.search).get('tour') === '1'; } catch (e) {}
    if (!on) return;
    startTour(function () {
      try {
        var u = new URL(location.href); u.searchParams.delete('tour');
        history.replaceState(history.state, '', u.pathname + u.search + u.hash);
      } catch (e) {}
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoStart); else autoStart();
})(window);
