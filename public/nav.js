/* ---- Google Analytics on every page (Sean, 2026-10-28: "add the tag to the missing pages") ----
 * 43 of 142 pages had no /analytics.js, among them Join the Directory and both Guides. nav.js is on every page, so it loads the
 * tag where a page does not (analytics.js runs once either way). Not on our own admin pages (/admin/, the board consent), so the
 * team's work in the Depot is not counted as traffic. */
(function () {
  if (window.__veGA || /^\/(admin\/|board-consent)/.test(location.pathname)) return;
  var s = document.createElement('script'); s.src = '/analytics.js'; s.async = true;
  (document.head || document.documentElement).appendChild(s);
})();

/* ---- Inside the dashboard window (Sean, 2026-10-04) ----
 * Any page the dashboard opens in its console frame drops its own nav and footer (the dashboard
 * keeps its own around it) and tells the dashboard its height, so the frame grows to fit and
 * there is one scroll. Pages that already set ve-embedded themselves (Depot, Members, Board...)
 * keep their own handling. A page that fits or fills the frame (a full-screen app) is left in the
 * normal frame, and one whose layout grows with the frame (a 100vh hero) is put back to a fixed
 * frame that scrolls inside, rather than growing forever. */
(function () {
  var root = document.documentElement, inDash = false;
  // A city hub frames the Board and Bounties under the community the same way (Sean, 2026-10-05).
  try { inDash = window.self !== window.top && window.parent.location.origin === location.origin && /^\/(dashboard(\/|$)|communities\/[a-z-]+\/?$)/.test(window.parent.location.pathname); } catch (e) {}
  if (!inDash) return;
  var ownHandling = root.classList.contains('ve-embedded');
  root.classList.add('ve-embedded');
  var st = document.createElement('style');
  st.textContent = '.ve-embedded .ve-nav,.ve-embedded .ve-footer,.ve-embedded .ve-mob-menu,.ve-embedded .ve-mob-overlay{display:none !important}';
  document.head.appendChild(st);
  if (ownHandling) return;
  var lastH = 0, lastVH = 0, stopped = false;
  // The page's own content, not the frame it sits in: measuring the document would report the frame's
  // height back, so the frame could grow but never shrink (a short page after a tall one left a gap,
  // Sean 2026-10-04). Open dialogs and overlays sit outside the flow and are counted so none is cut off.
  function veContentHeight(){var b=document.body;if(!b)return 0;var h=b.scrollHeight;Array.prototype.forEach.call(document.querySelectorAll('dialog[open],.overlay,[role="dialog"]'),function(el){var cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||cs.position==='fixed')return;var r=el.getBoundingClientRect();if(r.height)h=Math.max(h,Math.ceil(r.bottom+window.scrollY));});return Math.ceil(h);}
  function send() {
    if (stopped || !document.body) return;
    // A Guide laid out to fill the window (html.dg-fit: the Guides, the Passport, the Ambassador Guide) is as tall as its
    // frame, so sizing the frame to it chases itself and the page bounces (Sean, 2026-10-28). It keeps the normal frame.
    if (document.documentElement.classList.contains('dg-fit')) {
      stopped = true; if (lastH) window.parent.postMessage({ type: 've-frame-unsize' }, location.origin); return;
    }
    var h = veContentHeight(), vh = window.innerHeight;
    if (lastH && vh !== lastVH && h > lastH && Math.abs((h - lastH) - (vh - lastVH)) < 3) {
      stopped = true; window.parent.postMessage({ type: 've-frame-unsize' }, location.origin); return;
    }
    lastVH = vh;
    // A page that fits the frame (or fills it, like a full-screen app) keeps the normal frame.
    if (!lastH && h <= vh + 2) return;
    if (Math.abs(h - lastH) < 2) return;
    lastH = h; window.parent.postMessage({ type: 've-frame-height', h: h }, location.origin);
  }
  function watch() {
    send();
    if (window.ResizeObserver) new ResizeObserver(send).observe(document.body);
    window.addEventListener('load', send);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || e.data.type !== 've-frame-view') return;
    root.style.setProperty('--ve-view-top', Math.max(0, Math.round(e.data.top)) + 'px');
    root.style.setProperty('--ve-view-h', Math.max(200, Math.round(e.data.height)) + 'px');
  });
})();

/* ---- Tracked links (Sean, 2026-10-04) ----
 * A /go/ link lands here with ?vl=<click id>. The click is kept (30 days) and, once the visitor is
 * signed in, credited to their account so they show up as interested in that campaign
 * (ve-links action=claim). The id is taken off the address bar right away. */
(function () {
  var KEY = 've_link_clicks', FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-links', DAYS = 30;
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { return []; } }
  function save(a) { try { if (a.length) localStorage.setItem(KEY, JSON.stringify(a.slice(-20))); else localStorage.removeItem(KEY); } catch (e) {} }
  var pending = load().filter(function (c) { return c && c.id && Date.now() - c.t < DAYS * 864e5; });
  try {
    var u = new URL(location.href), vl = u.searchParams.get('vl');
    if (vl) {
      if (/^[0-9a-f-]{36}$/i.test(vl) && !pending.some(function (c) { return c.id === vl; })) pending.push({ id: vl, t: Date.now() });
      u.searchParams.delete('vl');
      history.replaceState(history.state, '', u.pathname + u.search + u.hash);
    }
  } catch (e) {}
  save(pending);
  var token = null;
  try { token = localStorage.getItem('ve_token'); } catch (e) {}
  if (!pending.length || !token) return;
  pending.forEach(function (c) {
    fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ action: 'claim', click_id: c.id }) })
      .then(function (r) { if (r.status !== 401) save(load().filter(function (x) { return x.id !== c.id; })); })
      .catch(function () {});
  });
})();

(function () {
  /* ---- Styles ---- */
  var css = [
    '.ve-nav{position:sticky;top:0;z-index:400;width:100%;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(0,0,0,0.09);}',
    '.ve-nav-inner{margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:0 28px;height:60px;gap:16px;font-family:"Montserrat",sans-serif;}',
    '.ve-wordmark{font-size:15px;font-weight:900;text-transform:uppercase;letter-spacing:0.06em;color:#1a1a1a;display:flex;align-items:center;gap:8px;text-decoration:none;}',
    '.ve-wordmark-logo{height:34px;width:auto;flex-shrink:0;}',
    '.ve-nav-spacer{flex:1;}',
    // Dark text on the bright green (WCAG AA, 9:1; white on it was 2.3:1). Sean, 2026-10-25: "make sure this page is ADA".
    '.ve-nav-cta{background:#22C55E;color:#06210f !important;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;padding:9px 18px;border-radius:4px;text-decoration:none;transition:background 0.15s;white-space:nowrap;}',
    '.ve-nav-cta:hover{background:#16A34A !important;}',
    '.ve-nav-login{font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#1a1a1a;text-decoration:none;padding:9px 12px;white-space:nowrap;}',
    '.ve-nav-login:hover{color:#22C55E;}',
    '.ve-nav-member{display:flex;align-items:center;gap:8px;cursor:pointer;position:relative;background:none;border:none;padding:4px;margin:0;border-radius:6px;font:inherit;}',
    '.ve-nav-member:focus-visible{outline:3px solid #22C55E;outline-offset:2px;}',
    '.ve-nav-avatar{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff;flex-shrink:0;font-family:"Montserrat",sans-serif;letter-spacing:0.04em;}',
    '.ve-nav-lesars{background:#F0FDF4;border:1px solid #BBF7D0;color:#0F5C2B;font-size:10px;font-weight:800;letter-spacing:0.08em;padding:4px 8px;border-radius:20px;white-space:nowrap;}',
    '@media(max-width:480px){.ve-nav-inner{padding:0 16px;}}',
    // Signed out (Sean, 2026-10-27: "the same style of navigation that we're using on the logged in version"): the dashboard's
    // top bar. The menu shows on desktop in the dashboard's tab style; on phones it is one full-width dropdown on its own row.
    // Log In and Join on the right. No announcement pill and no hamburger.
    '.ve-pub-nav{flex:1;min-width:0;display:flex;align-items:center;justify-content:flex-start;margin-left:14px;}',
    '.ve-pub-tabs{display:flex;align-items:center;gap:22px;}',
    '.ve-pub-tabs a{font-size:12px;font-weight:800;letter-spacing:0.04em;color:rgba(26,26,26,0.68);text-decoration:none;padding:19px 2px 17px;border-bottom:2.5px solid transparent;white-space:nowrap;}',
    '.ve-pub-tabs a:hover{color:#1a1a1a;}',
    '.ve-pub-tabs a[aria-current="page"]{color:#2d7d31;border-bottom-color:#3A9B3E;}',
    '.ve-pub-tabs a:focus-visible,.ve-pub-select:focus-visible{outline:3px solid #22C55E;outline-offset:2px;border-radius:4px;}',
    '.ve-pub-select{display:none;width:100%;font-family:"Montserrat",sans-serif;font-size:13px;font-weight:800;color:#1a1a1a;background:#fff url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%278%27 viewBox=%270 0 12 8%27><path d=%27M1 1l5 5 5-5%27 stroke=%27%23475569%27 stroke-width=%272%27 fill=%27none%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/></svg>") no-repeat right 16px center;border:1.5px solid rgba(0,0,0,0.09);border-radius:6px;padding:11px 44px 11px 14px;-webkit-appearance:none;-moz-appearance:none;appearance:none;cursor:pointer;}',
    '.ve-nav-public .ve-nav-right-wrap{display:flex;gap:4px;}',
    '@media(max-width:960px){.ve-pub-tabs{gap:16px;}.ve-pub-tabs a{font-size:11px;}}',
    // Signed in the menu has up to nine sections: the badge steps aside first, then the gaps close.
    '@media(max-width:1240px){.ve-nav-in .ve-nav-lesars{display:none;} .ve-nav-in .ve-pub-tabs{gap:16px;}}',
    '@media(max-width:1060px){.ve-nav-in .ve-pub-tabs{gap:12px;} .ve-nav-in .ve-pub-tabs a{font-size:11px;letter-spacing:0.02em;} .ve-nav-in .ve-nav-inner{padding:0 18px;}}',
    // Phones (Sean, 2026-10-27: "To save space at the top, can we make the menu on mobile the hamburger menu in the right
    // corner"): the menu row is gone; a hamburger after Log In and Join (or the avatar) opens the sections in a panel under the bar.
    '.ve-burger{display:none;align-items:center;justify-content:center;width:42px;height:42px;margin-left:6px;border:1.5px solid rgba(0,0,0,0.12);border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;flex-shrink:0;}',
    '.ve-burger svg{width:20px;height:20px;}',
    '.ve-burger[aria-expanded="true"]{border-color:#2d7d31;color:#2d7d31;}',
    '.ve-burger:focus-visible{outline:3px solid #22C55E;outline-offset:2px;}',
    '.ve-burger-menu{position:absolute;left:0;right:0;top:100%;z-index:1000;background:#fff;border-bottom:1px solid rgba(0,0,0,0.09);box-shadow:0 14px 28px rgba(0,0,0,0.12);padding:6px 0;}',
    '.ve-burger-menu[hidden]{display:none;}',
    '.ve-burger-menu a{display:block;padding:14px 22px;font-size:14px;font-weight:800;color:#1a1a1a;text-decoration:none;border-left:3px solid transparent;}',
    '.ve-burger-menu a:hover{background:#f6faf7;}',
    '.ve-burger-menu a[aria-current="page"]{color:#2d7d31;border-left-color:#3A9B3E;background:#f0faf4;}',
    '@media(max-width:960px){.ve-nav-in .ve-pub-nav{display:none;} .ve-nav-in .ve-nav-right-wrap{margin-left:auto;} .ve-nav-in .ve-burger{display:inline-flex;}}',
    '@media(max-width:860px){.ve-nav-public .ve-pub-nav{display:none;} .ve-nav-public .ve-nav-right-wrap{display:flex !important;margin-left:auto;} .ve-nav-public .ve-burger{display:inline-flex;}}',
    '.ve-nav-right-wrap{display:flex;align-items:center;}',
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---- Auth state ---- */
  var realMember = null;
  try { realMember = JSON.parse(localStorage.getItem('ve_member') || 'null'); } catch(e) {}
  var realLoggedIn = !!(realMember && localStorage.getItem('ve_token'));

  function swEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

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
      // ?view_as= previews one page without saving the choice (ve-auth.js urlViewAs).
      var _vk = new URLSearchParams(location.search).get('view_as');
      var _va = _vk === 'ambassador' ? { mode: 'member', role: 'ambassador' } : _vk === 'member' ? { mode: 'member', role: null } : _vk === 'cm' ? { mode: 'member', role: 'community_manager' } : JSON.parse(localStorage.getItem('ve_view_as') || 'null');
      if (_va && (_va.mode === 'public' || _va.mode === 'member')) viewAs = _va;
    } catch (e) {}
  }

  var member, loggedIn;
  if (viewAs) {
    if (viewAs.mode === 'public') {
      member = null;
      loggedIn = false;
    } else {
      member = Object.assign({}, realMember, { lesars_balance: viewAs.points || 0, is_superadmin: false, ve_role: viewAs.role !== undefined ? viewAs.role : null });
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

  /* ---- Right side: Log In and Join, or the member's avatar ----
     Signed in (Sean, 2026-10-27): the avatar and the membership badge open the account menu
     (/public/ve-account-menu.js): their account and Sign out, and for a super admin View As and Sign In As.
     No hamburger and no announcement pill. */
  var desktopRight;
  if (loggedIn && member) {
    var avatarStyle = 'background:' + swEsc(member.color || '#22C55E') + ';';
    var avatarSrc = member.avatar_url
      ? '<img src="' + swEsc(member.avatar_url) + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" alt="">'
      : '<span>' + swEsc(member.initials || '?') + '</span>';
    // 2026-10-03 (Sean): the badge names the membership a person actually has. Membership is
    // the one-time Founding Membership; Community Manager appears once Sean approves them.
    var tierBadge = member.ve_role === 'community_manager' ? 'Community Manager' : member.ve_role === 'ambassador' ? 'Ambassador'
      : (member.membership_status === 'active' ? 'Founding Member' : 'Member');
    desktopRight =
      '<button type="button" class="ve-nav-member" id="ve-nav-member-chip" aria-label="Your account, ' + swEsc(member.name || '') + '">' +
        '<span class="ve-nav-avatar" style="' + avatarStyle + '">' + avatarSrc + '</span>' +
        '<span class="ve-nav-lesars">' + tierBadge + '</span>' +
      '</button>';
  } else {
    desktopRight =
      '<a href="/login" class="ve-nav-login"' + cur('/login') + '>Log In</a>' +
      '<a href="/passport" class="ve-nav-cta">Join</a>';
  }

  /* ---- The menu ----
     Signed in (Sean, 2026-10-27), the dashboard's order: Dashboard, Directory, Events, Daily Pulse, Media, Guides, Communities,
     My Saves, and the Depot for super admins. Signed out, the same order without Dashboard, My Saves and the Depot (Sean,
     2026-10-27: "My Saves and Depot are logged in versions only"). One bar either way: tabs on desktop, the hamburger on phones.
     A page under a section counts as that section. */
  var MENU = loggedIn
    ? [['Dashboard', '/dashboard'], ['Directory', '/directory'], ['Events', '/events'], ['Daily Pulse', '/pulse'], ['Media', '/media'],
       ['Guides', '/guides'], ['Communities', '/communities'], ['My Saves', '/dashboard/saves']]
        .concat(isRealSuperAdmin && !viewAs ? [['Depot', '/dashboard/depot']] : [])
    : [['Directory', '/directory'], ['Events', '/events'], ['Daily Pulse', '/pulse'], ['Media', '/media'], ['Guides', '/guides'], ['Communities', '/communities']];
  function inSection(href) {
    if (href === '/dashboard') return p === '/dashboard' || p === '/dashboard/center-console';
    if (href === '/dashboard/depot') return p.indexOf('/dashboard/depot') === 0 || p.indexOf('/admin/depot') === 0;
    if (href === '/media' && p.indexOf('/podcast/') === 0) return true;
    if (href === '/pulse' && isCurrent('/guides/ve-discuss')) return true;
    return p === href || p.indexOf(href + '/') === 0;
  }
  var here = MENU.filter(function (m) { return inSection(m[1]); })[0];
  var navTabsHtml =
    '<div class="ve-pub-nav">' +
      '<div class="ve-pub-tabs">' + MENU.map(function (m) { return '<a href="' + m[1] + '"' + (inSection(m[1]) ? ' aria-current="page"' : '') + '>' + m[0] + '</a>'; }).join('') + '</div>' +
      '<select class="ve-pub-select" id="ve-pub-select" aria-label="Menu">' +
        (here ? '' : '<option value="" selected>Menu</option>') +
        MENU.map(function (m) { return '<option value="' + m[1] + '"' + (here === m ? ' selected' : '') + '>' + m[0] + '</option>'; }).join('') +
      '</select>' +
    '</div>';
  var html =
    '<nav class="ve-nav ve-nav-public' + (loggedIn ? ' ve-nav-in' : '') + '" role="navigation" aria-label="Main navigation">' +
      '<div class="ve-nav-inner">' +
        '<a href="/" class="ve-wordmark" aria-label="Vegans Explore home"' + cur('/') + '>' +
          '<img class="ve-wordmark-logo" src="/public/logo-ve-landscape-v1.svg" alt="Vegans Explore">' +
        '</a>' +
        navTabsHtml +
        '<div class="ve-nav-right-wrap">' + desktopRight +
          '<button type="button" class="ve-burger" id="ve-burger" aria-label="Menu" aria-expanded="false" aria-controls="ve-burger-menu">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="17" x2="20" y2="17"></line></svg>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="ve-burger-menu" id="ve-burger-menu" hidden>' +
        MENU.map(function (m) { return '<a href="' + m[1] + '"' + (inSection(m[1]) ? ' aria-current="page"' : '') + '>' + m[0] + '</a>'; }).join('') +
      '</div>' +
    '</nav>';

  document.currentScript.insertAdjacentHTML('beforebegin', html);
  // The menu's height, for anything that sticks under it (the ad rail): --ve-nav-h on the page.
  (function () {
    var navEl = document.querySelector('.ve-nav'); if (!navEl) return;
    function setH() { document.documentElement.style.setProperty('--ve-nav-h', Math.round(navEl.getBoundingClientRect().height) + 'px'); }
    setH(); window.addEventListener('resize', setH); window.addEventListener('load', setH);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setH);
  })();

  /* ---- The account menu, and the Viewing as / Signed in as pill (also while a super admin views as the public) ---- */
  if (realLoggedIn) {
    var chipBtn = document.getElementById('ve-nav-member-chip');
    var useMenu = function () { if (chipBtn) window.VEAccountMenu.attach(chipBtn); };
    if (window.VEAccountMenu) useMenu();
    else {
      var am = document.createElement('script');
      am.src = '/public/ve-account-menu.js';
      am.onload = useMenu;
      document.head.appendChild(am);
    }
  }

  // The hamburger opens and closes the menu panel; Escape or a tap outside closes it.
  (function () {
    var burger = document.getElementById('ve-burger'), menu = document.getElementById('ve-burger-menu');
    if (!burger || !menu) return;
    function set(open) { menu.hidden = !open; burger.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    burger.addEventListener('click', function (e) { e.stopPropagation(); set(menu.hidden); });
    document.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target)) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { set(false); burger.focus(); } });
  })();
  var pubSelect = document.getElementById('ve-pub-select');
  if (pubSelect) pubSelect.addEventListener('change', function () { if (pubSelect.value) location.href = pubSelect.value; });
  /* ---- Passport gate (event delegation - runs on every page nav.js is included) ---- */
  var _gated = ['.vote-hero-btn', '.donate-btn', '#donate-btn', '.btn-join', '.star-btn', '.mobile-sticky-btn-vote', '.mobile-sticky-btn-save'];
  // Signed out, a members-only button opens the Passport Guide (Sean, 2026-10-25: /passport is the one Passport), which has
  // Sign in for members and returns them here (back=). The old sign-in pop-up stays only as the fallback below.
  function _showGateModal(msg) {
    var _here = location.pathname + location.search + location.hash;
    if (location.pathname !== '/passport') { location.href = '/passport?back=' + encodeURIComponent(_here); return; }
    var _msg = msg || 'You need a Passport to do that.';
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
        else if (_t > 50) { clearInterval(_iv); window.location.href = '/passport#/join'; }
      }, 100);
    }
  }
  document.addEventListener('click', function(e) {
    if (localStorage.getItem('ve_token')) return;
    var t = e.target;
    while (t && t !== document.body) {
      // A link that already goes to the Passport needs no gate.
      if (t.tagName === 'A' && /^\/passport(?:$|[?#/])/.test(t.getAttribute('href') || '')) return;
      for (var _gi = 0; _gi < _gated.length; _gi++) {
        try {
          if (t.matches && t.matches(_gated[_gi])) {
            e.preventDefault();
            e.stopImmediatePropagation();
            // A vote first says why (Sean, 2026-10-26): the window from ve-votes.js, Explore the Passport from there.
            if (/vote/.test(_gated[_gi]) && window.VEVotes && VEVotes.passportPrompt) { VEVotes.passportPrompt(); return; }
            if (/save/.test(_gated[_gi]) && window.VEVotes && VEVotes.savePrompt) { VEVotes.savePrompt(); return; }
            if (/donate/.test(_gated[_gi]) && window.VEVotes && VEVotes.givePrompt) { VEVotes.givePrompt(); return; }
            _showGateModal();
            return;
          }
        } catch(ex) {}
      }
      if (t.tagName === 'A' && t.classList && t.classList.contains('topic-card') && !t.classList.contains('tc-locked')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        _showGateModal('Get your Passport to join the discussion.');
        return;
      }
      t = t.parentElement;
    }
  }, true);

})();