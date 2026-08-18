// ve-tour.js (2026-08-18, Logan, V direction)
//
// Replaces the old static card-based /tour.html wizard with a real,
// interactive walkthrough that runs ON TOP of the actual live pages --
// dashboard, a real Community Hub, the Daily Pulse, Guides, and
// Get Involved -- instead of describing them in the abstract. A small
// movable spotlight box highlights the real element being explained and
// a callout card carries the copy + Back/Next/Skip controls.
//
// Sequenced Community-Hub-first per V's direction: the Hub is the concept
// ("here are the sections, here's where you find information"), with the
// Directory shown as a tab living INSIDE the hub rather than a separate
// top-level stop, and a clear distinction between hub-local articles
// (community-specific) and the Daily Pulse (the shared, site-wide feed).
//
// State persists across real page navigations via sessionStorage (a tour
// step's `page` can differ from the previous step's page -- Next then does
// a real navigation instead of just re-rendering). This file is loaded on
// every page that participates in a tour stop; on pages that aren't part
// of the tour, or when no tour is active, it does nothing.
//
// Selectors point at real, already-shipped markup (hub-tabs, tab-news,
// tab-directory, #pulseList, #passport-heading, #gi-list, etc.) -- verified
// against the live repo before writing this file. If a selector isn't found
// on load (future markup changes, slow-loading async content, etc.) the
// engine falls back to a centered card with no spotlight rather than
// breaking the tour.

(function (global) {
  var STORAGE_KEY = 've_tour_step';
  var Z = 999999;

  var TOUR_STEPS = [
    {
      page: '/dashboard',
      selector: '#dash-community-section',
      fallbackSelector: '#dash-tile-grid',
      title: 'Welcome to Vegans Explore',
      body: "This is a real, live walkthrough -- we'll point out the actual pages as we go, not just describe them. Let's start with your Community Hub.",
      placement: 'bottom',
    },
    {
      page: '/communities/atlanta',
      selector: '.hub-tabs',
      fallbackSelector: '.hero',
      title: 'Your Community Hub',
      body: "Every city has a hub like this one. This is Atlanta's -- once you join a city from your dashboard, yours will look just like it. Here are the sections: this is where you'll find everything for your city.",
      placement: 'bottom',
    },
    {
      page: '/communities/atlanta',
      tab: 'news',
      selector: '#tab-news',
      title: 'Articles For This City',
      body: "This tab holds articles written specifically for this community -- local news, deals, and updates you won't find anywhere else.",
      placement: 'right',
    },
    {
      page: '/communities/atlanta',
      tab: 'directory',
      selector: '#tab-directory',
      title: 'The Directory Lives Right Here',
      body: "Your city's Directory is built into the hub, so you can search vegan-friendly spots near you without ever leaving the community.",
      placement: 'right',
    },
    {
      page: '/pulse',
      selector: '#pulseList',
      fallbackSelector: '#pulse-hero-section',
      title: 'The Daily Pulse',
      body: "This is the main feed -- the articles that apply across all of Vegans Explore, not just one city. Local hub news and the Daily Pulse work together: local for your community, Pulse for everyone.",
      placement: 'top',
    },
    {
      page: '/guides',
      selector: '#passport-heading',
      fallbackSelector: '#gc-heading',
      title: 'Points & Your Passport',
      body: 'Everything you do earns points toward your Passport -- missions, daily activity, and inviting friends all count.',
      placement: 'top',
    },
    {
      page: '/dashboard/get-involved',
      selector: '#gi-list',
      fallbackSelector: '#gi-content',
      title: "You're Ready to Explore",
      body: 'Want to do more than browse? Apply here to volunteer or become a Vegan Explorer.',
      placement: 'top',
      isLast: true,
    },
  ];

  function getStep() {
    var s;
    try { s = sessionStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    if (s === null) return null;
    var n = parseInt(s, 10);
    return isNaN(n) ? null : n;
  }
  function setStep(i) {
    try { sessionStorage.setItem(STORAGE_KEY, String(i)); } catch (e) {}
  }
  function clearTourState() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  function exitHref() {
    return (global.VEAuth && global.VEAuth.isLoggedIn && global.VEAuth.isLoggedIn()) ? '/dashboard' : '/join';
  }

  function startTour() {
    setStep(0);
    var first = TOUR_STEPS[0];
    if (location.pathname === first.page) {
      renderStep(0);
    } else {
      location.href = first.page;
    }
  }

  function goToStep(idx) {
    if (idx < 0) idx = 0;
    if (idx >= TOUR_STEPS.length) { finishTour(); return; }
    var step = TOUR_STEPS[idx];
    setStep(idx);
    if (step.page === location.pathname) {
      renderStep(idx);
    } else {
      location.href = step.page;
    }
  }

  function finishTour() {
    clearTourState();
    teardown();
    location.href = exitHref();
  }

  function skipTour() {
    clearTourState();
    teardown();
    location.href = exitHref();
  }

  function teardown() {
    // FIXED (2026-08-18, Logan, V correction): this used to check for an id
    // ('ve-tour-overlay-backdrop') that was never actually created -- the
    // real elements are 've-tour-overlay-spotlight' and 've-tour-overlay-card'.
    // Because the check never matched, ensureDom() below recreated a brand
    // new spotlight box-shadow on every single Next click instead of reusing
    // the existing one. Each fresh box-shadow layer stacks its own dimming on
    // top of the last, which is why it visibly got darker and darker with
    // every step -- confirmed as the root cause of V's report.
    ['overlay-spotlight', 'overlay-card', 'tab-highlight'].forEach(function (id) {
      var el = document.getElementById('ve-tour-' + id);
      if (el) el.parentNode.removeChild(el);
    });
    window.removeEventListener('resize', reposition);
    window.removeEventListener('scroll', reposition, true);
  }

  var currentTarget = null;
  var currentPlacement = 'bottom';
  var currentTabButton = null;

  function ensureDom() {
    // FIXED: correct id check, so a same-page step change (e.g. the two
    // hub-tab steps) reuses the one existing overlay instead of stacking a
    // new one on top. Cross-page navigations get a fresh DOM anyway (new
    // page load), so this is also safe there.
    if (document.getElementById('ve-tour-overlay-card')) return;

    var style = document.createElement('style');
    style.id = 've-tour-style';
    style.textContent =
      // LIGHTENED (2026-08-18, V correction): was rgba(0,0,0,0.55); "not so
      // dark" -- dropped to 0.32 so the page stays legible behind the dim.
      '#ve-tour-overlay-spotlight{position:absolute;pointer-events:none;border-radius:10px;' +
      'box-shadow:0 0 0 9999px rgba(0,0,0,0.32);transition:top .25s ease,left .25s ease,width .25s ease,height .25s ease;z-index:' + Z + ';}' +
      // NEW: a distinct ring (no dimming, no cutout) around the active hub
      // tab button itself, so it's clear which tab the tour is on even
      // though the tab bar sits outside the spotlighted section below it.
      '#ve-tour-tab-highlight{position:absolute;pointer-events:none;border-radius:8px;' +
      'border:2.5px solid #22C55E;box-shadow:0 0 0 3px rgba(34,197,94,0.25);' +
      'transition:top .25s ease,left .25s ease,width .25s ease,height .25s ease;z-index:' + (Z + 1) + ';}' +
      '#ve-tour-overlay-card{position:absolute;max-width:340px;background:#fff;border-radius:14px;' +
      'box-shadow:0 12px 40px rgba(0,0,0,0.3);padding:20px 22px;font-family:"Montserrat",sans-serif;z-index:' + (Z + 2) + ';' +
      'transition:top .25s ease,left .25s ease;}' +
      '#ve-tour-overlay-card.centered{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);}' +
      '.ve-tour-eyebrow{font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#22C55E;margin-bottom:6px;}' +
      '.ve-tour-title{font-size:16px;font-weight:900;color:#1a1a1a;margin-bottom:8px;line-height:1.25;}' +
      '.ve-tour-body{font-size:13px;color:#444;line-height:1.55;margin-bottom:16px;}' +
      '.ve-tour-row{display:flex;align-items:center;justify-content:space-between;gap:10px;}' +
      '.ve-tour-dots{display:flex;gap:5px;}' +
      '.ve-tour-dot{width:6px;height:6px;border-radius:50%;background:rgba(0,0,0,0.15);}' +
      '.ve-tour-dot.active{background:#22C55E;width:14px;border-radius:3px;transition:width .15s;}' +
      '.ve-tour-btns{display:flex;gap:8px;}' +
      '.ve-tour-btn{border:none;cursor:pointer;font-family:"Montserrat",sans-serif;font-size:11.5px;font-weight:800;' +
      'letter-spacing:.05em;text-transform:uppercase;padding:9px 16px;border-radius:7px;}' +
      '.ve-tour-btn-primary{background:#22C55E;color:#fff;}' +
      '.ve-tour-btn-primary:hover{background:#16A34A;}' +
      '.ve-tour-btn-back{background:#F3F4F6;color:#555;}' +
      '.ve-tour-btn-back:hover{background:#E5E7EB;}' +
      '.ve-tour-skip{font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#999;' +
      'background:none;border:none;cursor:pointer;text-decoration:underline;font-family:"Montserrat",sans-serif;' +
      'position:absolute;top:10px;right:14px;}' +
      '@media (max-width:520px){#ve-tour-overlay-card{max-width:calc(100vw - 32px);}}';
    document.head.appendChild(style);

    var spotlight = document.createElement('div');
    spotlight.id = 've-tour-overlay-spotlight';
    document.body.appendChild(spotlight);

    var tabHighlight = document.createElement('div');
    tabHighlight.id = 've-tour-tab-highlight';
    tabHighlight.style.display = 'none';
    document.body.appendChild(tabHighlight);

    var card = document.createElement('div');
    card.id = 've-tour-overlay-card';
    document.body.appendChild(card);

    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
  }

  function findEl(step) {
    var el = step.selector ? document.querySelector(step.selector) : null;
    if (el) return el;
    if (step.fallbackSelector) return document.querySelector(step.fallbackSelector);
    return null;
  }

  function reposition() {
    var card = document.getElementById('ve-tour-overlay-card');
    var spotlight = document.getElementById('ve-tour-overlay-spotlight');
    var tabHighlight = document.getElementById('ve-tour-tab-highlight');
    if (!card || !spotlight) return;

    // NEW (V correction): ring-highlight the active hub tab button itself,
    // separately from the dimmed spotlight cutout below it, so it's always
    // clear which tab the tour is pointing at even when the tab bar sits
    // outside the spotlighted section.
    if (tabHighlight) {
      if (currentTabButton && document.body.contains(currentTabButton)) {
        var btnRect = currentTabButton.getBoundingClientRect();
        var btnPad = 4;
        tabHighlight.style.display = 'block';
        tabHighlight.style.top = (btnRect.top + window.scrollY - btnPad) + 'px';
        tabHighlight.style.left = (btnRect.left + window.scrollX - btnPad) + 'px';
        tabHighlight.style.width = (btnRect.width + btnPad * 2) + 'px';
        tabHighlight.style.height = (btnRect.height + btnPad * 2) + 'px';
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
    var cTop, cLeft;
    var gap = 18;
    if (currentPlacement === 'right') {
      cTop = top + height / 2 - cardRect.height / 2;
      cLeft = left + width + gap;
      if (cLeft + cardRect.width > window.scrollX + window.innerWidth - 12) {
        cLeft = left - cardRect.width - gap; // flip to left if no room
      }
    } else if (currentPlacement === 'top') {
      cTop = top - cardRect.height - gap;
      cLeft = left + width / 2 - cardRect.width / 2;
    } else {
      // bottom (default)
      cTop = top + height + gap;
      cLeft = left + width / 2 - cardRect.width / 2;
    }
    // clamp within viewport horizontally
    var minLeft = window.scrollX + 12;
    var maxLeft = window.scrollX + window.innerWidth - cardRect.width - 12;
    if (cLeft < minLeft) cLeft = minLeft;
    if (cLeft > maxLeft) cLeft = Math.max(minLeft, maxLeft);
    if (cTop < window.scrollY + 12) cTop = top + height + gap; // flip below if would go above viewport top

    card.style.top = cTop + 'px';
    card.style.left = cLeft + 'px';
  }

  function renderStep(idx) {
    var step = TOUR_STEPS[idx];
    ensureDom();

    function paint() {
      if (step.tab && typeof window.switchTab === 'function') {
        try { window.switchTab(step.tab); } catch (e) {}
      }
      // NEW (V correction): track the real tab button (id="tab-btn-<tab>",
      // matching the hub markup) so reposition() can ring-highlight it.
      currentTabButton = step.tab ? document.getElementById('tab-btn-' + step.tab) : null;
      currentTarget = findEl(step);
      currentPlacement = step.placement || 'bottom';
      if (currentTarget && currentTarget.scrollIntoView) {
        currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }

      var card = document.getElementById('ve-tour-overlay-card');
      var isLast = !!step.isLast;
      card.innerHTML =
        '<button type="button" class="ve-tour-skip" id="ve-tour-skip-btn">Skip tour</button>' +
        '<div class="ve-tour-eyebrow">Step ' + (idx + 1) + ' of ' + TOUR_STEPS.length + '</div>' +
        '<div class="ve-tour-title">' + step.title + '</div>' +
        '<div class="ve-tour-body">' + step.body + '</div>' +
        '<div class="ve-tour-row">' +
          '<div class="ve-tour-dots" id="ve-tour-dots"></div>' +
          '<div class="ve-tour-btns">' +
            (idx > 0 ? '<button type="button" class="ve-tour-btn ve-tour-btn-back" id="ve-tour-back-btn">Back</button>' : '') +
            '<button type="button" class="ve-tour-btn ve-tour-btn-primary" id="ve-tour-next-btn">' + (isLast ? 'Start Exploring' : 'Next') + '</button>' +
          '</div>' +
        '</div>';

      var dotsEl = document.getElementById('ve-tour-dots');
      TOUR_STEPS.forEach(function (_, i) {
        var d = document.createElement('div');
        d.className = 've-tour-dot' + (i === idx ? ' active' : '');
        dotsEl.appendChild(d);
      });

      document.getElementById('ve-tour-skip-btn').addEventListener('click', skipTour);
      var backBtn = document.getElementById('ve-tour-back-btn');
      if (backBtn) backBtn.addEventListener('click', function () { goToStep(idx - 1); });
      document.getElementById('ve-tour-next-btn').addEventListener('click', function () {
        if (isLast) { finishTour(); } else { goToStep(idx + 1); }
      });

      // Give the DOM a frame to size the card before positioning it.
      requestAnimationFrame(reposition);
    }

    // Async tab content (e.g. the directory widget) can take a beat to mount;
    // give it a short window before falling back to whatever is present.
    if (step.tab) { setTimeout(paint, 120); } else { paint(); }
  }

  global.VETour = {
    start: startTour,
    steps: TOUR_STEPS,
  };

  document.addEventListener('DOMContentLoaded', function () {
    var idx = getStep();
    if (idx === null || idx < 0 || idx >= TOUR_STEPS.length) return;
    var step = TOUR_STEPS[idx];
    if (step.page !== location.pathname) return; // this page isn't this step -- no-op
    renderStep(idx);
  });
})(window);
