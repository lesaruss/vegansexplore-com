/* The Depot's tab bar (Sean, 2026-09-27): one place for a brand's media, with its
 * features as tabs. Put <div id="depot-tabs"></div> where the tabs go and load this.
 * A new Depot feature is one more entry in TABS.
 */
(function () {
  var TABS = [
    { href: '/admin/depot', label: 'Library' },
    { href: '/admin/depot/onboarding', label: 'Onboarding' },
    { href: '/admin/depot/pulse', label: 'Pulse' },
    { href: '/admin/depot/logos', label: 'Logos' },
    { href: '/admin/depot/claims', label: 'Claims' },
    { href: '/admin/depot/verified', label: 'Verified' },
    { href: '/admin/depot/hunt', label: 'Hunt' },
    { href: '/admin/depot/narration', label: 'Import narration' }
  ];
  var CSS = '.depot-tabs{display:flex;flex-wrap:wrap;gap:4px;border-bottom:2px solid rgba(0,0,0,0.09);margin:0 0 22px;}' +
    '.depot-tabs a{font-size:13px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:rgba(26,26,26,0.8);text-decoration:none;padding:12px 16px 12px;border-bottom:3px solid transparent;margin-bottom:-2px;border-radius:8px 8px 0 0;}' +
    '.depot-tabs a:hover{background:rgba(0,0,0,0.04);color:#1a1a1a;}' +
    '.depot-tabs a[aria-current="page"]{color:#1f5f22;border-bottom-color:#1f5f22;}';
  function mount() {
    var el = document.getElementById('depot-tabs'); if (!el) return;
    if (!document.getElementById('depot-tabs-css')) { var st = document.createElement('style'); st.id = 'depot-tabs-css'; st.textContent = CSS; document.head.appendChild(st); }
    var here = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '');
    el.className = 'depot-tabs'; el.setAttribute('role', 'navigation'); el.setAttribute('aria-label', 'The Depot');
    el.innerHTML = TABS.map(function (t) { return '<a href="' + t.href + '"' + (here === t.href ? ' aria-current="page"' : '') + '>' + t.label + '</a>'; }).join('');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
