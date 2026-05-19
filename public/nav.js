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
    '.ve-nav-drop{position:relative;}',
    '.ve-nav-drop-btn{background:none;border:none;font-family:"Montserrat",sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6B6B6B;cursor:pointer;display:flex;align-items:center;gap:4px;padding:0;transition:color 0.15s;}',
    '.ve-nav-drop-btn:hover,.ve-nav-drop-btn.open{color:#3A9B3E;}',
    '.ve-nav-drop-arrow{font-size:9px;transition:transform 0.15s;display:inline-block;}',
    '.ve-nav-drop-btn.open .ve-nav-drop-arrow{transform:rotate(180deg);}',
    '.ve-nav-drop-menu{position:absolute;top:calc(100% + 12px);left:50%;transform:translateX(-50%);background:#fff;border:1px solid rgba(0,0,0,0.09);border-radius:10px;padding:8px 0;min-width:230px;box-shadow:0 8px 32px rgba(0,0,0,0.12);z-index:500;display:none;}',
    '.ve-nav-drop-menu.open{display:block;}',
    '.ve-nav-drop-item{display:flex;align-items:center;gap:10px;padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#1a1a1a;text-decoration:none;transition:background 0.1s;}',
    '.ve-nav-drop-item:hover{background:#f5f5f5;}',
    '.ve-nav-drop-item[aria-current="page"]{background:#e8f5e9;color:#2d7d31;}',
    '.ve-nav-drop-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}',
    '.ve-nav-cta{background:#F69820;color:#fff !important;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;padding:9px 18px;border-radius:4px;text-decoration:none;transition:background 0.15s;white-space:nowrap;}',
    '.ve-nav-cta:hover{background:#d4800f !important;}',
    /* hamburger */
    '.ve-hamburger{display:none;background:none;border:none;cursor:pointer;padding:6px;color:#1a1a1a;line-height:0;-webkit-tap-highlight-color:transparent;}',
    '.ve-hamburger:focus-visible{outline:3px solid #F69820;outline-offset:3px;border-radius:4px;}',
    /* mobile menu */
    '.ve-mob-menu{display:none;position:fixed;top:60px;left:0;right:0;background:#fff;border-bottom:1px solid rgba(0,0,0,0.09);box-shadow:0 8px 24px rgba(0,0,0,0.12);z-index:399;overflow-y:auto;max-height:calc(100vh - 60px);}',
    '.ve-mob-menu.open{display:block;}',
    '.ve-mob-section{padding:4px 0;border-bottom:1px solid rgba(0,0,0,0.06);}',
    '.ve-mob-section:last-child{border-bottom:none;}',
    '.ve-mob-section-label{font-size:9px;font-weight:800;letter-spacing:0.24em;text-transform:uppercase;color:#9B9B9B;padding:14px 20px 6px;}',
    '.ve-mob-menu a{display:flex;align-items:center;gap:10px;padding:13px 20px;font-family:"Montserrat",sans-serif;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;text-decoration:none;transition:background 0.1s;}',
    '.ve-mob-menu a:hover{background:#f5f5f5;color:#3A9B3E;}',
    '.ve-mob-menu a[aria-current="page"]{color:#3A9B3E;}',
    '.ve-mob-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}',
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

  /* ── Paths config ── */
  var paths = [
    { href: '/guides/ve-path-prevegan',      label: 'Pre-Vegan Path',      color: '#2d7d31' },
    { href: '/guides/ve-path-seasonedvegan', label: 'Seasoned Vegan Path', color: '#8B6914' },
    { href: '/guides/ve-path-entrepreneur',  label: 'Entrepreneur Path',   color: '#2D5F8A' },
    { href: '/guides/ve-path-nonprofit',     label: 'Nonprofit Path',      color: '#C4522A' },
    { href: '/guides/ve-path-creator',       label: 'Creator Path',        color: '#6B35A8' }
  ];

  var onGuidesPath    = paths.some(function (path) { return isCurrent(path.href); });
  var communityPaths  = ['/communities/find', '/communities'];
  var onCommunityPath = communityPaths.some(function (h) { return isCurrent(h); });

  /* ── Desktop dropdown items ── */
  var dropItems = paths.map(function (pt) {
    return '<a href="' + pt.href + '" class="ve-nav-drop-item" role="menuitem"' + cur(pt.href) + '>' +
      '<span class="ve-nav-drop-dot" style="background:' + pt.color + ';" aria-hidden="true"></span>' +
      pt.label + '</a>';
  }).join('');

  /* ── Mobile menu path items ── */
  var mobPathItems = paths.map(function (pt) {
    return '<a href="' + pt.href + '"' + cur(pt.href) + '>' +
      '<span class="ve-mob-dot" style="background:' + pt.color + ';" aria-hidden="true"></span>' +
      pt.label + '</a>';
  }).join('');

  /* ── Hamburger icons ── */
  var iconMenu  = '<svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden="true"><rect width="22" height="2" rx="1" fill="#1a1a1a"/><rect y="7" width="22" height="2" rx="1" fill="#1a1a1a"/><rect y="14" width="22" height="2" rx="1" fill="#1a1a1a"/></svg>';
  var iconClose = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><line x1="3" y1="3" x2="17" y2="17" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/><line x1="17" y1="3" x2="3" y2="17" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/></svg>';

  /* ── Nav HTML ── */
  var html =
    '<nav class="ve-nav" role="navigation" aria-label="Main navigation">' +
      '<a href="/" class="ve-wordmark" aria-label="Vegans Explore home"' + cur('/') + '>' +
        '<img class="ve-mark" src="/public/ve-mark.png" alt="" aria-hidden="true">' +
        'Vegans <span class="ve-wordmark-explore">Explore</span>' +
      '</a>' +
      '<div class="ve-nav-links">' +
        '<div class="ve-nav-drop">' +
          '<button class="ve-nav-drop-btn' + (onGuidesPath ? ' open' : '') + '" id="ve-guides-btn" aria-haspopup="true" aria-expanded="' + onGuidesPath + '">' +
            'Guides <span class="ve-nav-drop-arrow" aria-hidden="true">&#9660;</span>' +
          '</button>' +
          '<div class="ve-nav-drop-menu" id="ve-guides-menu" role="menu" aria-labelledby="ve-guides-btn">' + dropItems + '</div>' +
        '</div>' +
        '<a href="/guides/ve-discuss"' + (isCurrent('/guides/ve-discuss') || isCurrent('/guides/ve-guide-chat-v1') ? ' aria-current="page"' : '') + '>Discuss</a>' +
        '<div class="ve-nav-drop">' +
          '<button class="ve-nav-drop-btn' + (onCommunityPath ? ' open' : '') + '" id="ve-community-btn" aria-haspopup="true" aria-expanded="' + onCommunityPath + '">' +
            'Communities <span class="ve-nav-drop-arrow" aria-hidden="true">&#9660;</span>' +
          '</button>' +
          '<div class="ve-nav-drop-menu" id="ve-community-menu" role="menu" aria-labelledby="ve-community-btn">' +
            '<a href="/communities/find" class="ve-nav-drop-item" role="menuitem"' + cur('/communities/find') + '><span class="ve-nav-drop-dot" style="background:#3A9B3E;" aria-hidden="true"></span>Find a Community</a>' +
            '<a href="/communities" class="ve-nav-drop-item" role="menuitem"' + cur('/communities') + '><span class="ve-nav-drop-dot" style="background:#F69820;" aria-hidden="true"></span>Run a Community</a>' +
          '</div>' +
        '</div>' +
        '<a href="/directory"' + cur('/directory') + '>Directory</a>' +
        '<a href="/passport"' + cur('/passport') + '>Passport</a>' +
      '</div>' +
      '<a href="/passport" class="ve-nav-cta">Get Passport - $11</a>' +
      '<button class="ve-hamburger" id="ve-hamburger-btn" aria-label="Open navigation" aria-expanded="false" aria-controls="ve-mob-menu">' + iconMenu + '</button>' +
    '</nav>' +
    /* mobile menu — position:fixed so DOM location doesn't matter */
    '<div class="ve-mob-menu" id="ve-mob-menu" role="dialog" aria-label="Navigation" aria-modal="true">' +
      '<div class="ve-mob-section">' +
        '<div class="ve-mob-section-label">Guides</div>' + mobPathItems +
      '</div>' +
      '<div class="ve-mob-section">' +
        '<a href="/guides/ve-discuss"' + (isCurrent('/guides/ve-discuss') ? ' aria-current="page"' : '') + '>Discuss</a>' +
        '<a href="/communities/find"' + cur('/communities/find') + '>Find a Community</a>' +
        '<a href="/communities"' + cur('/communities') + '>Run a Community</a>' +
        '<a href="/directory"' + cur('/directory') + '>Directory</a>' +
        '<a href="/passport"' + cur('/passport') + '>Passport</a>' +
      '</div>' +
      '<div class="ve-mob-cta-wrap"><a href="/passport" class="ve-mob-cta">Get Passport - $11</a></div>' +
    '</div>';

  document.currentScript.insertAdjacentHTML('beforebegin', html);

  /* ── Desktop: Guides dropdown ── */
  var guidesBtn  = document.getElementById('ve-guides-btn');
  var guidesMenu = document.getElementById('ve-guides-menu');

  guidesBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = guidesMenu.classList.toggle('open');
    guidesBtn.classList.toggle('open', open);
    guidesBtn.setAttribute('aria-expanded', String(open));
  });

  /* ── Desktop: Community dropdown ── */
  var communityBtn  = document.getElementById('ve-community-btn');
  var communityMenu = document.getElementById('ve-community-menu');

  communityBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = communityMenu.classList.toggle('open');
    communityBtn.classList.toggle('open', open);
    communityBtn.setAttribute('aria-expanded', String(open));
  });

  /* close all desktop dropdowns on outside click or Escape */
  document.addEventListener('click', function () {
    guidesMenu.classList.remove('open');
    guidesBtn.classList.remove('open');
    guidesBtn.setAttribute('aria-expanded', 'false');
    communityMenu.classList.remove('open');
    communityBtn.classList.remove('open');
    communityBtn.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      guidesMenu.classList.remove('open');
      guidesBtn.classList.remove('open');
      guidesBtn.setAttribute('aria-expanded', 'false');
      communityMenu.classList.remove('open');
      communityBtn.classList.remove('open');
      communityBtn.setAttribute('aria-expanded', 'false');
    }
  });

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

  /* close mobile menu when a link is tapped */
  mobMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { setMobOpen(false); });
  });

})();
