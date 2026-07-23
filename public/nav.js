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
    '.ve-announce-wrap{display:flex;align-items:center;min-width:0;margin-right:16px;}',
    '.ve-announce{display:flex;align-items:center;gap:8px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:30px;padding:6px 14px 6px 6px;cursor:pointer;text-decoration:none;max-width:360px;min-width:0;transition:background 0.15s,border-color 0.15s;}',
    '.ve-announce:hover{background:#e3f9e7;border-color:#9fe6ac;}',
    '.ve-announce-icon{width:22px;height:22px;border-radius:50%;flex-shrink:0;background:#F69820;display:flex;align-items:center;justify-content:center;}',
    '.ve-announce-text{font-size:11px;font-weight:700;color:#15803D;letter-spacing:0.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:1;transition:opacity 0.25s;}',
    '.ve-announce-text.fading{opacity:0;}',
    '.ve-nav-right-wrap{display:flex;align-items:center;}',
    '@media(max-width:900px){.ve-announce{max-width:200px;} .ve-nav-right-wrap{display:none;}}',
    '.ve-va-panel{padding:14px 20px 18px;position:relative;}',
    '.ve-va-label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:rgba(0,0,0,0.4);margin-bottom:10px;}',
    '.ve-va-trigger{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;padding:10px 12px;border:1px solid rgba(0,0,0,0.15);border-radius:6px;background:#fff;font-family:"Montserrat",sans-serif;font-size:12px;font-weight:700;color:#1a1a1a;cursor:pointer;transition:border-color 0.1s;}',
    '.ve-va-trigger:hover{border-color:rgba(0,0,0,0.3);}',
    '.ve-va-trigger.open{border-color:#22C55E;}',
    '.ve-va-caret{width:14px;height:14px;stroke:rgba(0,0,0,0.4);fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;transition:transform 0.15s;}',
    '.ve-va-trigger.open .ve-va-caret{transform:rotate(180deg);}',
    '.ve-va-menu{display:none;margin-top:6px;border:1px solid rgba(0,0,0,0.1);border-radius:6px;overflow:hidden;}',
    '.ve-va-menu.open{display:block;}',
    '.ve-va-opt{display:block;width:100%;text-align:left;padding:10px 12px;border:none;border-bottom:1px solid rgba(0,0,0,0.07);background:#fff;font-family:"Montserrat",sans-serif;font-size:12px;font-weight:700;color:#1a1a1a;cursor:pointer;transition:background 0.1s;}',
    '.ve-va-opt:last-child{border-bottom:none;}',
    '.ve-va-opt:hover{background:#f5f5f5;}',
    '.ve-va-opt.ve-va-active{background:#F0FDF4;color:#15803D;}'
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---- Auth state ---- */
  var realMember = null;
  try { realMember = JSON.parse(localStorage.getItem('ve_member') || 'null'); } catch(e) {}
  var realLoggedIn = !!(realMember && localStorage.getItem('ve_token'));

  /* ---- Super Admin "View As" simulator (2026-07-12) ----
     Mirrors the override formula in public/ve-auth.js (VEAuth.getViewAs / getMember /
     isLoggedIn). Duplicated here rather than calling VEAuth because nav.js renders the
     chrome synchronously on every page load, while ve-auth.js is only lazy-loaded on
     pages that need the sign-in modal - this matches nav.js's existing pattern of
     reading localStorage directly instead of depending on VEAuth being preloaded.
     Only ever honored when the REAL underlying account is a super admin. */
  var isRealSuperAdmin = !!(realMember && realMember.is_superadmin);
  var viewAs = null;
  if (isRealSuperAdmin) {
    try {
      var _va = JSON.parse(localStorage.getItem('ve_view_as') || 'null');
      if (_va && (_va.mode === 'public' || _va.mode === 'member')) viewAs = _va;
    } catch (e) {}
  }

  var member, loggedIn;
  if (viewAs) {
    if (viewAs.mode === 'public') {
      member = null;
      loggedIn = false;
    } else {
      member = Object.assign({}, realMember, { lesars_balance: viewAs.points || 0 });
      loggedIn = true;
    }
  } else {
    member = realMember;
    loggedIn = realLoggedIn;
  }

  /* ---- Current-page detection ---- */
  var p = window.location.pathname.replace(/\/$/, '') || '/';
  function isCurrent(href) { var h = href.replace(/\/$/, '') || '/'; return p === h; }
  function cur(href) { return isCurrent(href) ? ' aria-current="page"' : ''; }

  /* ---- Personalized "Welcome" destination (2026-07-23) ----
     Once a visitor picks a city on /communities (see veChooseCity there),
     the Welcome link routes straight back to that community instead of the
     generic /welcome page - so a traveling member can switch cities and
     "Welcome" always means "my city," not a static page. */
  var VE_CITY_SLUGS = ['south-florida', 'central-florida', 'atlanta', 'new-york', 'los-angeles', 'london'];
  var savedCity = null;
  try { savedCity = localStorage.getItem('ve_selected_city'); } catch (e) {}
  var welcomeHref = (savedCity && VE_CITY_SLUGS.indexOf(savedCity) !== -1) ? ('/communities/' + savedCity) : '/welcome';

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

  /* ---- Super Admin "View As" panel (drawer-only, always available regardless of
     simulated state - matches the GeekFon Society "View as membership" precedent) ---- */
  var vaId = 'real';
  if (viewAs) { vaId = viewAs.mode === 'public' ? 'public' : ('member-' + (viewAs.points || 0)); }
  function vaCls(id) { return vaId === id ? ' ve-va-active' : ''; }
  var VA_LABELS = { 'real': 'My Account (Real)', 'public': 'Public - Logged Out', 'member-0': 'Free Member - 0 Points', 'member-1500': 'Free Member - 1,500 Points' };
  var adminPanel = '';
  if (isRealSuperAdmin) {
    adminPanel =
      '<hr class="ve-mob-divider">' +
      '<div class="ve-mob-section ve-va-panel">' +
        '<div class="ve-va-label">Super Admin - View As</div>' +
        '<button class="ve-va-trigger" id="ve-va-trigger" aria-haspopup="listbox" aria-expanded="false">' +
          '<span id="ve-va-trigger-label">' + VA_LABELS[vaId] + '</span>' +
          '<svg viewBox="0 0 24 24" class="ve-va-caret"><path d="M6 9l6 6 6-6"/></svg>' +
        '</button>' +
        '<div class="ve-va-menu" id="ve-va-menu" role="listbox">' +
          '<button class="ve-va-opt' + vaCls('real') + '" data-va="real" role="option">My Account (Real)</button>' +
          '<button class="ve-va-opt' + vaCls('public') + '" data-va="public" role="option">Public - Logged Out</button>' +
          '<button class="ve-va-opt' + vaCls('member-0') + '" data-va="member-0" role="option">Free Member - 0 Points</button>' +
          '<button class="ve-va-opt' + vaCls('member-1500') + '" data-va="member-1500" role="option">Free Member - 1,500 Points</button>' +
        '</div>' +
      '</div>';
  }

  /* ---- Nav HTML ---- */
  var announceHtml =
    '<div class="ve-announce-wrap">' +
      '<a class="ve-announce" id="ve-announce" href="/join" aria-label="Special announcements">' +
        '<span class="ve-announce-icon" aria-hidden="true">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.9a2 2 0 1 1-3.2 0"/></svg>' +
        '</span>' +
        '<span class="ve-announce-text" id="ve-announce-text">Founding Membership: $11 once, forever - closes July 13</span>' +
      '</a>' +
    '</div>';

  var html =
    '<nav class="ve-nav" role="navigation" aria-label="Main navigation">' +
      '<div class="ve-nav-inner">' +
        '<a href="/" class="ve-wordmark" aria-label="Vegans Explore home"' + cur('/') + '>' +
          '<img class="ve-wordmark-logo" src="/public/logo-ve-landscape-v1.svg" alt="Vegans Explore">' +
        '</a>' +
        '<div class="ve-nav-spacer"></div>' +
        announceHtml +
        '<div class="ve-nav-right-wrap">' + desktopRight + '</div>' +
        '<button class="ve-hamburger" id="ve-hamburger-btn" aria-label="Open navigation" aria-expanded="false" aria-controls="ve-mob-menu">' + iconMenu + '</button>' +
      '</div>' +
    '</nav>' +
    '<div class="ve-mob-overlay" id="ve-mob-overlay" aria-hidden="true"></div>' +
    '<div class="ve-mob-menu" id="ve-mob-menu" role="dialog" aria-label="Navigation" aria-modal="true">' +
      '<div class="ve-mob-section">' +
        '<a href="' + welcomeHref + '"' + cur(welcomeHref) + '>Welcome</a>' +
        '<a href="/guides"' + cur('/guides') + '>Guides</a>' +
        '<a href="/pulse"' + (isCurrent('/pulse') || isCurrent('/guides/ve-discuss') ? ' aria-current="page"' : '') + '>Pulse</a>' +
        '<a href="/communities"' + cur('/communities') + '>Communities</a>' +
        '<a href="/directory"' + cur('/directory') + '>Directory</a>' +
      '</div>' +
      mobileBottom +
      adminPanel +
    '</div>';

  document.currentScript.insertAdjacentHTML('beforebegin', html);

  /* ---- Special Announcements pill: rotates messages, links to real pages (safe on every route) ---- */
  (function() {
    var messages = [
      { text: 'Founding Membership: $11 once, forever - closes July 13', href: '/join' },
      { text: 'New: guided city launches rolling out through July', href: '/welcome' }
    ];
    var idx = 0;
    var textEl = document.getElementById('ve-announce-text');
    var linkEl = document.getElementById('ve-announce');
    if (!textEl || !linkEl) return;
    setInterval(function() {
      textEl.classList.add('fading');
      setTimeout(function() {
        idx = (idx + 1) % messages.length;
        textEl.textContent = messages[idx].text;
        linkEl.setAttribute('href', messages[idx].href);
        textEl.classList.remove('fading');
      }, 250);
    }, 6000);
  })();

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

  /* ---- Super Admin "View As" dropdown (drawer) ---- */
  if (isRealSuperAdmin) {
    var vaTrigger = document.getElementById('ve-va-trigger');
    var vaMenu = document.getElementById('ve-va-menu');
    if (vaTrigger && vaMenu) {
      vaTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        var open = vaMenu.classList.toggle('open');
        vaTrigger.classList.toggle('open', open);
        vaTrigger.setAttribute('aria-expanded', String(open));
      });
      document.addEventListener('click', function() {
        vaMenu.classList.remove('open');
        vaTrigger.classList.remove('open');
        vaTrigger.setAttribute('aria-expanded', 'false');
      });
    }
    var vaOpts = document.querySelectorAll('.ve-va-opt');
    for (var _i = 0; _i < vaOpts.length; _i++) {
      vaOpts[_i].addEventListener('click', function(e) {
        e.stopPropagation();
        var v = this.getAttribute('data-va');
        if (v === 'real') {
          try { localStorage.removeItem('ve_view_as'); } catch(e) {}
        } else if (v === 'public') {
          try { localStorage.setItem('ve_view_as', JSON.stringify({ mode: 'public' })); } catch(e) {}
        } else {
          var pts = v === 'member-1500' ? 1500 : 0;
          try { localStorage.setItem('ve_view_as', JSON.stringify({ mode: 'member', points: pts })); } catch(e) {}
        }
        window.location.reload();
      });
    }
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