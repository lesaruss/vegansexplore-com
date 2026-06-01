(function () {
  /* ── Styles ── */
  var css = [
    '.ve-nav{position:sticky;top:0;z-index:400;width:100%;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(0,0,0,0.09);}',
    '.ve-nav-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:0 28px;height:60px;gap:16px;font-family:"Montserrat",sans-serif;}',
    '.ve-wordmark{font-size:15px;font-weight:900;text-transform:uppercase;letter-spacing:0.06em;color:#1a1a1a;display:flex;align-items:center;gap:8px;text-decoration:none;}',
    '.ve-wordmark-logo{height:34px;width:auto;flex-shrink:0;}',
    '.ve-nav-links{display:flex;align-items:center;gap:24px;}',
    '.ve-nav-links>a{font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6B6B6B;text-decoration:none;transition:color 0.15s;}',
    '.ve-nav-links>a:hover,.ve-nav-links>a[aria-current="page"]{color:#3A9B3E;}',
    '.ve-nav-cta{background:#F69820;color:#fff !important;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;padding:9px 18px;border-radius:4px;text-decoration:none;transition:background 0.15s;white-space:nowrap;}',
    '.ve-nav-cta:hover{background:#d4800f !important;}',
    /* hamburger */
    '.ve-hamburger{display:none;background:none;border:none;cursor:pointer;padding:6px;color:#1a1a1a;line-height:0;-webkit-tap-highlight-color:transparent;}',
    '.ve-hamburger:focus-visible{outline:3px solid #F69820;outline-offset:3px;border-radius:4px;}',
    /* mobile menu */
    '.ve-mob-menu{display:none;position:fixed;top:60px;left:0;right:0;background:#fff;border-bottom:1px solid rgba(0,0,0,0.09);box-shadow:0 8px 24px rgba(0,0,0,0.12);z-index:399;overflow-y:auto;max-height:calc(100vh - 60px);}',
    '.ve-mob-menu.open{display:block;}',
    '.ve-mob-section{padding:4px 0;}',
    '.ve-mob-menu a{display:flex;align-items:center;gap:10px;padding:13px 20px;font-family:"Montserrat",sans-serif;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;text-decoration:none;transition:background 0.1s;}',
    '.ve-mob-menu a:hover{background:#f5f5f5;color:#3A9B3E;}',
    '.ve-mob-menu a[aria-current="page"]{color:#3A9B3E;}',
    '.ve-mob-cta-wrap{padding:16px 20px 20px;}',
    '.ve-mob-cta{display:block !important;text-align:center;background:#F69820;color:#fff !important;font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;padding:14px;border-radius:4px;text-decoration:none;transition:background 0.15s;}',
    '.ve-mob-cta:hover{background:#d4800f !important;}',
    /* responsive */
    '@media(max-width:768px){.ve-nav-inner{padding:0 20px;}.ve-nav-links{display:none;}.ve-nav-cta{display:none;}.ve-hamburger{display:flex;align-items:center;justify-content:center;}}',
    '@media(max-width:480px){.ve-nav-inner{padding:0 16px;}}'
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── Current-page detection ── */
  var p = window.location.pathname.replace(/\/$/, '') || '/';
  function isCurrent(href) { var h = href.replace(/\/$/, '') || '/'; return p === h; }
  function cur(href) { return isCurrent(href) ? ' aria-current="page"' : ''; }

  /* ── Hamburger icons ── */
  var iconMenu  = '<svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden="true"><rect width="22" height="2" rx="1" fill="#1a1a1a"/><rect y="7" width="22" height="2" rx="1" fill="#1a1a1a"/><rect y="14" width="22" height="2" rx="1" fill="#1a1a1a"/></svg>';
  var iconClose = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><line x1="3" y1="3" x2="17" y2="17" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/><line x1="17" y1="3" x2="3" y2="17" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/></svg>';

  /* ── Nav HTML ── */
  var html =
    '<nav class="ve-nav" role="navigation" aria-label="Main navigation">' +
      '<div class="ve-nav-inner">' +
      '<a href="/" class="ve-wordmark" aria-label="Vegans Explore home"' + cur('/') + '>' +
        '<img class="ve-wordmark-logo" src="/public/logo-ve-landscape-v1.svg" alt="Vegans Explore">' +
      '</a>' +
      '<div class="ve-nav-links">' +
        '<a href="/guides"' + cur('/guides') + '>Guides</a>' +
        '<a href="/pulse"' + (isCurrent('/pulse') || isCurrent('/guides/ve-discuss') || isCurrent('/guides/ve-guide-chat-v1') ? ' aria-current="page"' : '') + '>Pulse</a>' +
        '<a href="/communities"' + cur('/communities') + '>Communities</a>' +
        '<a href="/directory"' + cur('/directory') + '>Directory</a>' +
        '<a href="/passport"' + cur('/passport') + '>Passport</a>' +
      '</div>' +
      '<a href="/passport" class="ve-nav-cta">Get Passport - $11</a>' +
      '<button class="ve-hamburger" id="ve-hamburger-btn" aria-label="Open navigation" aria-expanded="false" aria-controls="ve-mob-menu">' + iconMenu + '</button>' +
      '</div>' +
    '</nav>' +
    '<div class="ve-mob-menu" id="ve-mob-menu" role="dialog" aria-label="Navigation" aria-modal="true">' +
      '<div class="ve-mob-section">' +
        '<a href="/guides"' + cur('/guides') + '>Guides</a>' +
        '<a href="/pulse"' + (isCurrent('/pulse') || isCurrent('/guides/ve-discuss') ? ' aria-current="page"' : '') + '>Pulse</a>' +
        '<a href="/communities"' + cur('/communities') + '>Communities</a>' +
        '<a href="/directory"' + cur('/directory') + '>Directory</a>' +
        '<a href="/passport"' + cur('/passport') + '>Passport</a>' +
      '</div>' +
      '<div class="ve-mob-cta-wrap"><a href="/passport" class="ve-mob-cta">Get Passport - $11</a></div>' +
    '</div>';

  document.currentScript.insertAdjacentHTML('beforebegin', html);

  /* ── Mobile: Hamburger ── */
  var hamburger = document.getElementById('ve-hamburger-btn');
  var mobMenu   = document.getElementById('ve-mob-menu');

  function setMobOpen(open) {
    mobMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    hamburger.innerHTML = open ? iconClose : iconMenu;
  }

  hamburger.addEventListener('click', function (e) {
    e.stopPropagation();
    setMobOpen(!mobMenu.classList.contains('open'));
  });

  document.addEventListener('click', function (e) {
    if (mobMenu.classList.contains('open') && !mobMenu.contains(e.target) && !hamburger.contains(e.target)) {
      setMobOpen(false);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobMenu.classList.contains('open')) {
      setMobOpen(false);
      hamburger.focus();
    }
  });

  mobMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { setMobOpen(false); });
  });

})();

