/* The Depot's tab bar (Sean, 2026-09-27): one place for a brand's media, with its
 * features as tabs. Put <div id="depot-tabs"></div> where the tabs go and load this.
 * A new Depot feature is one more entry in TABS.
 * Inbox and Sources (Sean, 2026-09-28, content engine plan) replaced News Desk and City News.
 */
(function () {
  var TABS = [
    { href: '/admin/depot/inbox', label: 'Inbox' },
    { href: '/admin/depot', label: 'Library' },
    { href: '/admin/depot/onboarding', label: 'Onboarding' },
    { href: '/admin/depot/pulse', label: 'Pulse' },
    { href: '/admin/depot/sources', label: 'Sources' },
    { href: '/admin/depot/pulse-cities', label: 'Pulse Cities' },
    { href: '/admin/depot/logos', label: 'Logos' },
    { href: '/admin/depot/claims', label: 'Claims' },
    { href: '/admin/depot/verified', label: 'Passport Partners' },
    { href: '/admin/depot/services', label: 'Services' },
    { href: '/admin/depot/challenge', label: 'Passport Challenge' },
    { href: '/admin/depot/tours', label: 'Tours' },
    { href: '/admin/depot/narration', label: 'Import narration' }
  ];
  // Sean, 2026-09-29: a drop-down to the right of the page title instead of a row of tabs,
  // so the pages feel less busy. The current page is the selected option.
  var CSS = '.depot-head{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;margin-bottom:18px;}' +
    '.depot-head h1{margin-bottom:0 !important;}' +
    '.depot-go{display:flex;align-items:center;gap:8px;}' +
    '.depot-go span{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:rgba(26,26,26,0.8);}' +
    '.depot-go select{font:inherit;font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#1f5f22;min-height:44px;padding:8px 40px 8px 14px;border:1.5px solid #1f5f22;border-radius:99px;background-color:#fff;cursor:pointer;max-width:100%;' +
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
})();
