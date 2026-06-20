(function () {
  /* ── Styles ── */
  var css = [
    '.ve-nav{position:sticky;top:0;z-index:400;width:100%;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(0,0,0,0.09);}',
    '.ve-nav-inner{margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:0 28px;height:60px;gap:16px;font-family:"Montserrat",sans-serif;}',
    '.ve-wordmark{font-size:15px;font-weight:900;text-transform:uppercase;letter-spacing:0.06em;color:#1a1a1a;display:flex;align-items:center;gap:8px;text-decoration:none;}',
    '.ve-wordmark-logo{height:34px;width:auto;flex-shrink:0;}',
    '.ve-nav-spacer{flex:1;}',
    /* nav links always hidden - live in hamburger only */
    '.ve-nav-links{display:none;}',
    /* CTA always visible */
    '.ve-nav-cta{background:#F69820;color:#fff !important;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;padding:9px 18px;border-radius:4px;text-decoration:none;transition:background 0.15s;white-space:nowrap;}',
    '.ve-nav-cta:hover{background:#d4800f !important;}',
    /* hamburger always visible */
    '.ve-hamburger{display:flex;align-items:center;justify-content:center;background:none;border:1px solid rgba(0,0,0,0.12);border-radius:6px;cursor:pointer;padding:8px 10px;color:#1a1a1a;line-height:0;-webkit-tap-highlight-color:transparent;transition:border-color 0.15s;}',
    '.ve-hamburger:hover{border-color:rgba(0,0,0,0.3);}',
    '.ve-hamburger:focus-visible{outline:3px solid #F69820;outline-offset:3px;border-radius:6px;}',
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
  var iconMenu  = '<svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true"><rect width="18" height="2" rx="1" fill="#1a1a1a"/><rect y="6" width="18" height="2" rx="1" fill="#1a1a1a"/><rect y="12" width="18" height="2" rx="1" fill="#1a1a1a"/></svg>';
  var iconClose = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><line x1="2" y1="2" x2="16" y2="16" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/><line x1="16" y1="2" x2="2" y2="16" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/></svg>';

  /* ── Nav HTML ── */
  /* Order: Logo | spacer | Get Passport CTA | Hamburger */
  var html =
    '<nav class="ve-nav" role="navigation" aria-label="Main navigation">' +
      '<div class="ve-nav-inner">' +
        '<a href="/" class="ve-wordmark" aria-label="Vegans Explore home"' + cur('/') + '>' +
          '<img class="ve-wordmark-logo" src="/public/logo-ve-landscape-v1.svg" alt="Vegans Explore">' +
        '</a>' +
        '<div class="ve-nav-spacer"></div>' +
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

  /* ── Hamburger toggle ── */
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
