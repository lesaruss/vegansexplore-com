(function () {
  /* ── Styles ── */
  var css = [
    '.ve-nav{position:sticky;top:0;z-index:400;width:100%;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(0,0,0,0.09);display:flex;align-items:center;justify-content:space-between;padding:0 28px;height:60px;gap:16px;font-family:"Montserrat",sans-serif;}',
    '.ve-wordmark{font-size:15px;font-weight:900;text-transform:uppercase;letter-spacing:0.06em;color:#1a1a1a;display:flex;align-items:center;gap:8px;text-decoration:none;}',
    '.ve-mark{width:26px;height:26px;object-fit:contain;flex-shrink:0;}',
    '.ve-wordmark-explore{color:#3A9B3E;}',
    '.ve-nav-links{display:flex;align-items:center;gap:24px;}',
    '.ve-nav-links>a{font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6B6B6B;text-decoration:none;transition:color 0.15s;}',
    '.ve-nav-links>a:hover,.ve-nav-links>a[aria-current="page"]{color:#3A9B3E;}',
    '.ve-nav-cta{background:#F69820;color:#fff !important;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;padding:9px 18px;border-radius:4px;text-decoration:none;transition:background 0.15s;white-space:nowrap;}',
    '.ve-nav-cta:hover{background:#d4800f !important;}',
    '@media(max-width:768px){.ve-nav{padding:0 20px;}.ve-nav-links{display:none;}}',
    '@media(max-width:480px){.ve-nav{padding:0 16px;}}'
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── Current-page detection ── */
  var p = window.location.pathname.replace(/\/$/, '') || '/';

  function isCurrent(href) {
    var h = href.replace(/\/$/, '') || '/';
    return p === h || p.startsWith(h + '/');
  }

  function cur(href) {
    return isCurrent(href) ? ' aria-current="page"' : '';
  }

  /* ── Nav HTML ── */
  var html =
    '<nav class="ve-nav" role="navigation" aria-label="Main navigation">' +
      '<a href="/" class="ve-wordmark" aria-label="Vegans Explore home">' +
        '<img class="ve-mark" src="/public/ve-mark.png" alt="" aria-hidden="true">' +
        'Vegans <span class="ve-wordmark-explore">Explore</span>' +
      '</a>' +
      '<div class="ve-nav-links">' +
        '<a href="/guides/ve-guides-roster-v1"' + cur('/guides') + '>Guides</a>' +
        '<a href="/guides/ve-discuss"' + (p === '/guides/ve-discuss' || p === '/guides/ve-guide-chat-v1' ? ' aria-current="page"' : '') + '>Discuss</a>' +
        '<a href="/communities/find"' + cur('/communities') + '>Communities</a>' +
        '<a href="/directory"' + cur('/directory') + '>Directory</a>' +
        '<a href="/passport"' + cur('/passport') + '>Passport</a>' +
      '</div>' +
      '<a href="/passport" class="ve-nav-cta">Get Passport - $11</a>' +
    '</nav>';

  /* ── Inject before this script tag ── */
  document.currentScript.insertAdjacentHTML('beforebegin', html);
})();
