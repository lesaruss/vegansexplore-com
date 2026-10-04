/* The Depot's tab bar (Sean, 2026-09-27): one place for a brand's media, with its
 * features as tabs. Put <div id="depot-tabs"></div> where the tabs go and load this.
 * A new Depot feature is one more entry in TABS.
 * Inbox and Sources (Sean, 2026-09-28, content engine plan) replaced News Desk and City News.
 */
(function () {
  var TABS = [
    { href: '/admin/depot/inbox', label: 'Inbox' },
    { href: '/admin/depot/bounties', label: 'Bounties' },
    { href: '/admin/depot', label: 'Library' },
    { href: '/admin/depot/onboarding', label: 'Onboarding' },
    { href: '/admin/depot/preview', label: 'Preview journeys' },
    { href: '/admin/depot/pulse', label: 'Pulse' },
    { href: '/admin/depot/sources', label: 'Sources' },
    { href: '/admin/depot/links', label: 'Links' },
    { href: '/admin/depot/pulse-cities', label: 'Pulse Cities' },
    { href: '/admin/depot/logos', label: 'Logos' },
    { href: '/admin/depot/community-managers', label: 'Community Managers' },
    { href: '/admin/depot/dashboard-checklist', label: 'Dashboard checklist' },
    { href: '/admin/depot/claims', label: 'Claims' },
    { href: '/admin/depot/verified', label: 'Passport Partners' },
    { href: '/admin/depot/services', label: 'Services' },
    { href: '/admin/depot/challenge', label: 'Passport Challenge' },
    { href: '/admin/depot/tours', label: 'Tours' },
    { href: '/admin/depot/narration', label: 'Import narration' }
  ];
  // Sean, 2026-09-29: a drop-down to the right of the page title instead of a row of tabs,
  // so the pages feel less busy. The current page is the selected option.
  // Sean, 2026-09-29: the drop-down sits on the far right, "Go to" on one line. Its styles are
  // !important where a page styles every select (Pulse sets select{width:100%}).
  var CSS = '.depot-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 16px;margin-bottom:18px;}' +
    '.depot-head h1{margin-bottom:0 !important;min-width:0;}' +
    '.depot-go{display:flex;align-items:center;gap:8px;flex:0 0 auto;margin-left:auto;}' +
    '.depot-go span{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:rgba(26,26,26,0.8);white-space:nowrap;}' +
    '.depot-go select{width:auto !important;flex:0 0 auto;font:inherit;font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#1f5f22;min-height:44px;padding:8px 40px 8px 14px;border:1.5px solid #1f5f22;border-radius:99px;background-color:#fff;cursor:pointer;max-width:100%;' +
    '-webkit-appearance:none;-moz-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath d=\'M1 1.5l5 5 5-5\' fill=\'none\' stroke=\'%231f5f22\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 16px center;background-size:12px 8px;}' +
    '.depot-go select:hover{background-color:#EAF7EA;}';
  function mount() {
    var el = document.getElementById('depot-tabs'); if (!el) return;
    if (!document.getElementById('depot-tabs-css')) { var st = document.createElement('style'); st.id = 'depot-tabs-css'; st.textContent = CSS; document.head.appendChild(st); }
    var here = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '');
    var go = document.createElement('label'); go.className = 'depot-go';
    go.innerHTML = '<span>Go to</span><select aria-label="Go to another part of the Depot">' +
      (TABS.some(function (t) { return t.href === here; }) ? '' : '<option value="" selected>Choose</option>') +
      TABS.map(function (t) { return '<option value="' + t.href + '"' + (here === t.href ? ' selected' : '') + '>' + t.label + '</option>'; }).join('') + '</select>';
    go.querySelector('select').addEventListener('change', function () { if (this.value) location.href = this.value; });
    // Put the drop-down beside the page title when the title sits right above the old tab spot.
    var h1 = el.previousElementSibling;
    if (h1 && h1.tagName === 'H1') {
      var row = document.createElement('div'); row.className = 'depot-head';
      h1.parentNode.insertBefore(row, h1); row.appendChild(h1); row.appendChild(go);
      el.remove();
    } else {
      el.className = 'depot-head'; el.setAttribute('role', 'navigation'); el.setAttribute('aria-label', 'The Depot'); el.appendChild(go);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();

  // Inside the dashboard (Sean, 2026-09-29: the Pulse page "gets cut off" at The piece): the
  // dashboard shows a Depot page in a fixed-height frame inside its own scrolling panel, two
  // scrolls stacked, so a tall page looked cut off at the frame's edge. The page now tells the
  // dashboard its height and the frame grows to fit, one scroll. The dashboard in turn says which
  // part of the frame is on screen, so a pop-up (dialog) opens where Sean is looking, and a
  // jump to the top (window.scrollTo) scrolls the dashboard instead of the frame.
  var embedded = false;
  try { embedded = window.self !== window.top && window.parent.location.origin === location.origin; } catch (e) {}
  if (embedded) {
    var root = document.documentElement, lastH = 0;
    root.classList.add('ve-autosize');
    var st2 = document.createElement('style');
    st2.textContent = '.ve-autosize dialog[open]{position:absolute;inset:auto 0 auto 0;margin:0 auto;top:calc(var(--ve-view-top,0px) + 24px);max-height:calc(var(--ve-view-h,100vh) - 48px) !important;overflow:auto;}';
    document.head.appendChild(st2);
    // The page's own content, not the frame it sits in: measuring the document would report the frame's
    // height back, so the frame could grow but never shrink (a short page after a tall one left a gap,
    // Sean 2026-10-04). Open dialogs and overlays sit outside the flow and are counted so none is cut off.
    function veContentHeight(){var b=document.body;if(!b)return 0;var h=b.scrollHeight;Array.prototype.forEach.call(document.querySelectorAll('dialog[open],.overlay,[role="dialog"]'),function(el){var cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||cs.position==='fixed')return;var r=el.getBoundingClientRect();if(r.height)h=Math.max(h,Math.ceil(r.bottom+window.scrollY));});return Math.ceil(h);}
    var send = function () {
      var h = veContentHeight();
      if (Math.abs(h - lastH) < 2) return;
      lastH = h; window.parent.postMessage({ type: 've-frame-height', h: h }, location.origin);
    };
    var watch = function () {
      send();
      if (window.ResizeObserver) new ResizeObserver(send).observe(document.body);
      window.addEventListener('load', send);
    };
    if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch);
    window.addEventListener('message', function (e) {
      if (e.origin !== location.origin || !e.data || e.data.type !== 've-frame-view') return;
      root.style.setProperty('--ve-view-top', Math.max(0, Math.round(e.data.top)) + 'px');
      root.style.setProperty('--ve-view-h', Math.max(200, Math.round(e.data.height)) + 'px');
    });
    var ownScroll = window.scrollTo.bind(window);
    window.scrollTo = function (a, b) {
      var top = a && typeof a === 'object' ? a.top : b;
      if (typeof top !== 'number') return ownScroll(a, b);
      window.parent.postMessage({ type: 've-frame-scroll', top: top, smooth: !!(a && a.behavior === 'smooth') }, location.origin);
    };
  }
})();

// Guided tour (public/ve-tour.js, Sean 2026-10-03): every Depot page gets the "Take the tour" button.
(function () {
  if (window.VETour || document.querySelector('script[src="/public/ve-tour.js"]')) return;
  function add() { var s = document.createElement('script'); s.src = '/public/ve-tour.js'; s.defer = true; document.body.appendChild(s); }
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
})();
