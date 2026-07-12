(function () {
  /* ---- Styles ---- */
  var css = [
    '.ve-nav{position:sticky;top:0;z-index:400;width:100%;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(0,0,0,0.09);}',
    '.ve-nav-inner{margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:0 28px;height:60px;gap:16px;font-family:"Montserrat",sans-serif;}',
    '.ve-wordmark{font-size:15px;font-weight:900;text-transform:uppercase;letter-spacing:0.06em;color:#1a1a1a;display:flex;align-items:center;gap:8px;text-decoration:none;}',
    '.ve-wordmark-logo{height:34px;width:auto;flex-shrink:0;}',
    '.ve-nav-spacer{flex:1;}',
    '.ve-nav-links{display:none;}',
    '.ve-nav-cta{background:#22C55E;color:#fff !important;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;padding:9px 18px;border-radius:4px;text-decoration:none;transition:background 0.15s;white-space:nowrap;}',
    '.ve-nav-cta:hover{background:#16A34A !important;}',
    '.ve-nav-member{display:flex;align-items:center;gap:8px;cursor:pointer;position:relative;}',
    '.ve-nav-avatar{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff;flex-shrink:0;font-family:"Montserrat",sans-serif;letter-spacing:0.04em;}',
    '.ve-nav-lesars{background:#F0FDF4;border:1px solid #BBF7D0;color:#15803D;font-size:10px;font-weight:800;letter-spacing:0.08em;padding:4px 8px;border-radius:20px;white-space:nowrap;}',
    '.ve-nav-member-menu{display:none;position:absolute;top:calc(100% + 8px);right:0;background:#fff;border:1px solid rgba(0,0,0,0.1);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.12);min-width:180px;z-index:500;overflow:hidden;}',
    '.ve-nav-member-menu.open{display:block;}',
    '.ve-nav-member-menu a,.ve-nav-member-menu button{display:flex;align-items:center;gap:10px;padding:12px 16px;font-family:"Montserrat",sans-serif;font-size:12px;font-weight:700;color:#1a1a1a;text-decoration:none;background:none;border:none;width:100%;text-align:left;cursor:pointer;transition:background 0.1s;}',
    '.ve-nav-member-menu a:hover,.ve-nav-member-menu button:hover{background:#f5f5f5;}',
    '.ve-nav-member-menu hr{border:none;border-top:1px solid rgba(0,0,0,0.08);margin:4px 0;}',
    '.ve-hamburger{display:flex;align-items:center;justify-content:center;background:none;border:1px solid rgba(0,0,0,0.12);border-radius:6px;cursor:pointer;padding:8px 10px;color:#1a1a1a;line-height:0;-webkit-tap-highlight-color:transparent;transition:border-color 0.15s;}',
    '.ve-hamburger:hover{border-color:rgba(0,0,0,0.3);}',
    '.ve-hamburger:focus-visible{outline:3px solid #22C55E;outline-offset:3px;border-radius:6px;}',
    '.ve-mob-menu{display:none;position:fixed;top:60px;right:0;bottom:0;width:280px;max-width:85vw;background:#fff;border-left:1px solid rgba(0,0,0,0.09);box-shadow:-8px 0 24px rgba(0,0,0,0.12);z-index:401;overflow-y:auto;}',
    '.ve-mob-menu.open{display:block;animation:ve-slide-in 0.22s cubic-bezier(0.4,0,0.2,1);}',
    '@keyframes ve-slide-in{from{transform:translateX(100%);}to{transform:translateX(0);}}',
    '.ve-mob-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.3);z-index:400;}',
    '.ve-mob-overlay.open{display:block;}',
    '.ve-mob-section{padding:4px 0;}',
    '.ve-mob-menu a{display:flex;align-items:center;gap:10px;padding:13px 20px;font-family:"Montserrat",sans-serif;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;text-decoration:none;transition:background 0.1s;}',
    '.ve-mob-menu a:hover{background:#f5f5f5;color:#22C55E;}',
    '.ve-mob-menu a[aria-current="page"]{color:#22C55E;}',
    '.ve-mob-cta-wrap{padding:16px 20px 20px;}',
    '.ve-mob-cta{display:block !important;text-align:center;background:#22C55E;color:#fff !important;font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;padding:14px;border-radius:4px;text-decoration:none;transition:background 0.15s;}',
    '.ve-mob-cta:hover{background:#16A34A !important;}',
    '.ve-mob-divider{border:none;border-top:1px solid rgba(0,0,0,0.08);margin:4px 0;}',
    '.ve-mob-signout{padding:13px 20px;font-family:"Montserrat",sans-serif;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#dc2626;cursor:pointer;background:none;border:none;width:100%;text-align:left;}',
    '.ve-mob-signout:hover{background:#fef2f2;}',
    '.ve-mob-lesars{display:inline-block;background:#F0FDF4;border:1px solid #BBF7D0;color:#15803D;font-size:10px;font-weight:800;letter-spacing:0.06em;padding:3px 7px;border-radius:20px;margin-left:6px;vertical-align:middle;}',
    '@media(max-width:480px){.ve-nav-inner{padding:0 16px;}}',
    '.ve-desktop-links{display:flex;align-items:center;gap:0;margin-right:16px;}',
    '.ve-desktop-links a{font-family:"Montserrat",sans-serif;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#1a1a1a;text-decoration:none;padding:7px 11px;border-radius:4px;transition:background 0.1s,color 0.1s;white-space:nowrap;}',
    '.ve-desktop-links a:hover{background:#f5f5f5;color:#22C55E;}',
    '.ve-desktop-links a[aria-current="page"]{color:#22C55E;}',
    '@media(max-width:900px){.ve-desktop-links{display:none;}}'
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---- Auth state ---- */
  var member = null;
  try { member = JSON.parse(localStorage.getItem('ve_member') || 'null'); } catch(e) {}
  var loggedIn = !!(member && localStorage.getItem('ve_token'));

  /* ---- Current-page detection ---- */
  var p = window.location.pathname.replace(/\/$/, '') || '/';
  function isCurrent(href) { var h = href.replace(/\/$/, '') || '/'; return p === h; }
  function cur(href) { return isCurrent(href) ? ' aria-current="page"' : ''; }

  /* ---- Icons ---- */
  var iconMenu  = '<svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true"><rect width="18" height="2" rx="1" fill="#1a1a1a"/><rect y="6" width="18" height="2" rx="1" fill="#1a1a1a"/><rect y="12" width="18" height="2" rx="1" fill="#1a1a1a"/></svg>';
  var iconClose = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><line x1="2" y1="2" x2="16" y2="16" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/><line x1="16" y1="2" x2="2" y2="16" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/></svg>';

  /* ---- Desktop right-side: CTA or member chip ---- */
  var desktopRight, mobileBottom;

  if (loggedIn && member) {
    var avatarStyle = 'background:' + (member.color || '#22C55E') + ';';
    var avatarSrc = member.avatar_url
      ? '<img src="' + member.avatar_url + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" alt="' + member.name + '">'
      : '<span>' + (member.initials || '?') + '</span>';
    var lesarsBalance = (member.lesars_balance || 0).toLocaleString();

    desktopRight =
      '<div class="ve-nav-member" id="ve-nav-member-chip" aria-haspopup="true" aria-expanded="false">' +
        '<div class="ve-nav-avatar" style="' + avatarStyle + '">' + avatarSrc + '</div>' +
        '<span class="ve-nav-lesars">' + lesarsBalance + ' Points</span>' +
        '<div class="ve-nav-member-menu" id="ve-member-menu" role="menu">' +
          '<a href="/account"' + cur('/account') + ' role="menuitem">My Account</a>' +
          '<a href="/account/my-list"' + cur('/account/my-list') + ' role="menuitem">My List</a>' +
          '<a href="/account/lesars"' + cur('/account/lesars') + ' role="menuitem">Points Balance</a>' +
          '<hr>' +
          '<button id="ve-signout-desktop" role="menuitem">Sign Out</button>' +
        '</div>' +
      '</div>';

    mobileBottom =
      '<hr class="ve-mob-divider">' +
      '<div class="ve-mob-section">' +
        '<a href="/account"' + cur('/account') + '>' +
          'Account' +
          '<span class="ve-mob-lesars">' + lesarsBalance + ' Points</span>' +
        '</a>' +
        '<a href="/account/my-list"' + cur('/account/my-list') + '>My List</a>' +
      '</div>' +
      '<button class="ve-mob-signout" id="ve-signout-mobile">Sign Out</button>';
  } else {
    desktopRight = '<a href="/join" class="ve-nav-cta">Get Passport - Free</a>';
    mobileBottom =
      '<div class="ve-mob-cta-wrap">' +
        '<a href="/join" class="ve-mob-cta">Get Passport - Free</a>' +
      '</div>';
  }

  /* ---- Nav HTML ---- */
  var html =
    '<nav class="ve-nav" role="navigation" aria-label="Main navigation">' +
      '<div class="ve-nav-inner">' +
        '<a href="/" class="ve-wordmark" aria-label="Vegans Explore home"' + cur('/') + '>' +
          '<img class="ve-wordmark-logo" src="/public/logo-ve-landscape-v1.svg" alt="Vegans Explore">' +
        '</a>' +
        '<div class="ve-nav-spacer"></div>' +
        '<div class="ve-desktop-links">' +
          '<a href="/welcome"' + cur('/welcome') + '>Welcome</a>' +
          '<a href="/guides"' + cur('/guides') + '>Guides</a>' +
          '<a href="/pulse"' + (isCurrent('/pulse') || isCurrent('/guides/ve-discuss') ? ' aria-current="page"' : '') + '>Pulse</a>' +
          '<a href="/communities"' + cur('/communities') + '>Communities</a>' +
          '<a href="/directory"' + cur('/directory') + '>Directory</a>' +
        '</div>' +
        desktopRight +
        '<button class="ve-hamburger" id="ve-hamburger-btn" aria-label="Open navigation" aria-expanded="false" aria-controls="ve-mob-menu">' + iconMenu + '</button>' +
      '</div>' +
    '</nav>' +
    '<div class="ve-mob-overlay" id="ve-mob-overlay" aria-hidden="true"></div>' +
    '<div class="ve-mob-menu" id="ve-mob-menu" role="dialog" aria-label="Navigation" aria-modal="true">' +
      '<div class="ve-mob-section">' +
        '<a href="/welcome"' + cur('/welcome') + '>Welcome</a>' +
        '<a href="/guides"' + cur('/guides') + '>Guides</a>' +
        '<a href="/pulse"' + (isCurrent('/pulse') || isCurrent('/guides/ve-discuss') ? ' aria-current="page"' : '') + '>Pulse</a>' +
        '<a href="/communities"' + cur('/communities') + '>Communities</a>' +
        '<a href="/directory"' + cur('/directory') + '>Directory</a>' +
      '</div>' +
      mobileBottom +
    '</div>';

  document.currentScript.insertAdjacentHTML('beforebegin', html);

  /* ---- Member menu toggle (desktop) ---- */
  if (loggedIn) {
    var chip = document.getElementById('ve-nav-member-chip');
    var menu = document.getElementById('ve-member-menu');
    if (chip && menu) {
      chip.addEventListener('click', function(e) {
        e.stopPropagation();
        var open = menu.classList.toggle('open');
        chip.setAttribute('aria-expanded', String(open));
      });
      document.addEventListener('click', function() {
        menu.classList.remove('open');
        chip.setAttribute('aria-expanded', 'false');
      });
    }
    var signoutD = document.getElementById('ve-signout-desktop');
    if (signoutD) signoutD.addEventListener('click', function() {
      localStorage.removeItem('ve_token');
      localStorage.removeItem('ve_member');
      window.location.href = '/';
    });
    var signoutM = document.getElementById('ve-signout-mobile');
    if (signoutM) signoutM.addEventListener('click', function() {
      localStorage.removeItem('ve_token');
      localStorage.removeItem('ve_member');
      window.location.href = '/';
    });
  }

  /* ---- Hamburger + drawer toggle ---- */
  var hamburger = document.getElementById('ve-hamburger-btn');
  var mobMenu   = document.getElementById('ve-mob-menu');
  var overlay   = document.getElementById('ve-mob-overlay');

  function setMobOpen(open) {
    mobMenu.classList.toggle('open', open);
    overlay.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    hamburger.innerHTML = open ? iconClose : iconMenu;
  }

  hamburger.addEventListener('click', function (e) {
    e.stopPropagation();
    setMobOpen(!mobMenu.classList.contains('open'));
  });

  overlay.addEventListener('click', function () { setMobOpen(false); });

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

  /* ---- Passport gate (event delegation - runs on every page nav.js is included) ---- */
  var _gated = ['.vote-hero-btn', '.donate-btn', '#donate-btn', '.btn-join', '.star-btn', '.mobile-sticky-btn-vote', '.mobile-sticky-btn-save'];
  function _showGateModal(msg) {
    var _msg = msg || 'You need a free Passport to do that.';
    if (window.VEAuth && typeof VEAuth.showAuthModal === 'function') {
      VEAuth.showAuthModal(_msg);
      return;
    }
    function _tryShow() {
      if (window.VEAuth && typeof VEAuth.showAuthModal === 'function') {
        VEAuth.showAuthModal(_msg);
      }
    }
    if (!document.querySelector('script[src*="ve-auth"]')) {
      var _s = document.createElement('script');
      _s.src = '/public/ve-auth.js';
      _s.onload = _tryShow;
      document.head.appendChild(_s);
    } else {
      var _t = 0, _iv = setInterval(function() {
        _t++;
        if (window.VEAuth && typeof VEAuth.showAuthModal === 'function') { clearInterval(_iv); _tryShow(); }
        else if (_t > 50) { clearInterval(_iv); window.location.href = '/join'; }
      }, 100);
    }
  }
  document.addEventListener('click', function(e) {
    if (localStorage.getItem('ve_token')) return;
    var t = e.target;
    while (t && t !== document.body) {
      for (var _gi = 0; _gi < _gated.length; _gi++) {
        try {
          if (t.matches && t.matches(_gated[_gi])) {
            e.preventDefault();
            e.stopImmediatePropagation();
            _showGateModal();
            return;
          }
        } catch(ex) {}
      }
      if (t.tagName === 'A' && t.classList && t.classList.contains('topic-card') && !t.classList.contains('tc-locked')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        _showGateModal('Get your free Passport to join the discussion.');
        return;
      }
      t = t.parentElement;
    }
  }, true);

})();