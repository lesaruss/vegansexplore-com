(function () {
  /* ── Styles ── */
  var css = [
    '.ve-nav{position:sticky;top:0;z-index:400;width:100%;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(0,0,0,0.09);display:flex;align-items:center;justify-content:space-between;padding:0 28px;height:60px;gap:16px;font-family:"Montserrat",sans-serif;}',
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
    '@media(max-width:768px){.ve-nav{padding:0 20px;}.ve-nav-links{display:none;}.ve-nav-cta{display:none;}.ve-hamburger{display:flex;align-items:center;justify-content:center;}}',
    '@media(max-width:480px){.ve-nav{padding:0 16px;}}'
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

/* ── Superadmin Preview Bar ── */
(function () {
  if (location.search.includes('sa=1')) localStorage.setItem('ve-sa', '1');
  if (localStorage.getItem('ve-sa') !== '1') return;

  /* CSS */
  var css = [
    /* Viewport switcher — right edge, vertical tab */
    '.vesa-vp{position:fixed;bottom:200px;right:0;z-index:9999;display:flex;flex-direction:column;align-items:flex-end;}',
    '.vesa-vp-handle{background:#3A9B3E;color:#fff;font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;writing-mode:vertical-rl;padding:12px 7px;border-radius:6px 0 0 6px;cursor:pointer;border:none;font-family:"Montserrat",sans-serif;box-shadow:-2px 0 8px rgba(0,0,0,0.15);}',
    '.vesa-vp-panel{display:none;background:#fff;border:1px solid #e0e0e0;border-right:none;border-radius:8px 0 0 8px;padding:10px 12px;gap:8px;flex-direction:column;box-shadow:-2px 0 12px rgba(0,0,0,0.1);}',
    '.vesa-vp-panel.open{display:flex;}',
    '.vesa-vp-btn{font-family:"Montserrat",sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background:#f5f5f5;border:1px solid #e0e0e0;border-radius:4px;padding:6px 12px;cursor:pointer;color:#555;transition:all 0.15s;white-space:nowrap;}',
    '.vesa-vp-btn:hover{background:#e8f5e9;color:#3A9B3E;border-color:#3A9B3E;}',
    '.vesa-vp-btn.active{background:#3A9B3E;color:#fff;border-color:#3A9B3E;}',
    /* Member state card — top right */
    '.vesa-ms{position:fixed;top:70px;right:12px;z-index:9999;background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:8px 12px;display:flex;flex-direction:column;gap:6px;box-shadow:0 2px 12px rgba(0,0,0,0.1);font-family:"Montserrat",sans-serif;}',
    '.vesa-ms-label{font-size:8px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:#aaa;}',
    '.vesa-ms-btns{display:flex;gap:4px;flex-wrap:wrap;max-width:220px;}',
    '.vesa-ms-btn{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;padding:4px 8px;border-radius:4px;border:1px solid #e0e0e0;background:#fff;color:#777;cursor:pointer;font-family:"Montserrat",sans-serif;transition:all 0.15s;white-space:nowrap;}',
    '.vesa-ms-btn:hover{border-color:#3A9B3E;color:#3A9B3E;}',
    '.vesa-ms-btn.active{background:#3A9B3E;border-color:#3A9B3E;color:#fff;}',
    /* Body viewport constraints */
    'body.vesa-tablet{max-width:768px!important;margin-left:auto!important;margin-right:auto!important;box-shadow:0 0 0 1px #e0e0e0;}',
    'body.vesa-mobile{max-width:390px!important;margin-left:auto!important;margin-right:auto!important;box-shadow:0 0 0 1px #e0e0e0;}'
  ].join('');

  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* Viewport switcher HTML */
  var vpEl = document.createElement('div');
  vpEl.className = 'vesa-vp';
  vpEl.setAttribute('role', 'complementary');
  vpEl.setAttribute('aria-label', 'Viewport preview switcher');
  vpEl.innerHTML =
    '<div class="vesa-vp-panel" id="vesa-vp-panel">' +
      '<button class="vesa-vp-btn active" data-vp="desktop" type="button">Desktop</button>' +
      '<button class="vesa-vp-btn" data-vp="tablet" type="button">Tablet</button>' +
      '<button class="vesa-vp-btn" data-vp="mobile" type="button">Mobile</button>' +
    '</div>' +
    '<button class="vesa-vp-handle" id="vesa-vp-handle" type="button" aria-label="Toggle viewport" aria-expanded="false">Preview</button>';

  /* Member state HTML */
  var msEl = document.createElement('div');
  msEl.className = 'vesa-ms';
  msEl.setAttribute('role', 'complementary');
  msEl.setAttribute('aria-label', 'Simulate member state');
  msEl.innerHTML =
    '<div class="vesa-ms-label">Member State</div>' +
    '<div class="vesa-ms-btns">' +
      '<button class="vesa-ms-btn active" data-ms="guest" type="button">Guest</button>' +
      '<button class="vesa-ms-btn" data-ms="passport-ot" type="button">Passport $11</button>' +
      '<button class="vesa-ms-btn" data-ms="passport-mo" type="button">Passport/mo</button>' +
      '<button class="vesa-ms-btn" data-ms="partner" type="button">Partner</button>' +
    '</div>';

  document.body.appendChild(vpEl);
  document.body.appendChild(msEl);

  /* Viewport logic */
  var vpPanel = document.getElementById('vesa-vp-panel');
  var vpHandle = document.getElementById('vesa-vp-handle');
  var vpOpen = false;

  vpHandle.addEventListener('click', function () {
    vpOpen = !vpOpen;
    vpPanel.classList.toggle('open', vpOpen);
    vpHandle.setAttribute('aria-expanded', String(vpOpen));
  });

  vpEl.querySelectorAll('.vesa-vp-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      vpEl.querySelectorAll('.vesa-vp-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      document.body.classList.remove('vesa-tablet', 'vesa-mobile');
      var vp = btn.dataset.vp;
      if (vp === 'tablet') document.body.classList.add('vesa-tablet');
      if (vp === 'mobile') document.body.classList.add('vesa-mobile');
      localStorage.setItem('ve-sa-vp', vp);
    });
  });

  /* Member state logic */
  msEl.querySelectorAll('.vesa-ms-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      msEl.querySelectorAll('.vesa-ms-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var ms = btn.dataset.ms;
      document.body.setAttribute('data-ve-member', ms);
      localStorage.setItem('ve-sa-ms', ms);
    });
  });

  /* Restore saved state */
  var savedVP = localStorage.getItem('ve-sa-vp') || 'desktop';
  var savedMS = localStorage.getItem('ve-sa-ms') || 'guest';

  vpEl.querySelectorAll('.vesa-vp-btn').forEach(function (b) {
    b.classList.toggle('active', b.dataset.vp === savedVP);
  });
  if (savedVP === 'tablet') document.body.classList.add('vesa-tablet');
  if (savedVP === 'mobile') document.body.classList.add('vesa-mobile');

  msEl.querySelectorAll('.vesa-ms-btn').forEach(function (b) {
    b.classList.toggle('active', b.dataset.ms === savedMS);
  });
  document.body.setAttribute('data-ve-member', savedMS);

})();
