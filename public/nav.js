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
    '.ve-nav-links{display:none;}',
    // Dark text on the bright green (WCAG AA, 9:1; white on it was 2.3:1). Sean, 2026-10-25: "make sure this page is ADA".
    '.ve-nav-cta{background:#22C55E;color:#06210f !important;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;padding:9px 18px;border-radius:4px;text-decoration:none;transition:background 0.15s;white-space:nowrap;}',
    '.ve-nav-cta:hover{background:#16A34A !important;}',
    '.ve-nav-login{font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#1a1a1a;text-decoration:none;padding:9px 12px;white-space:nowrap;}',
    '.ve-nav-login:hover{color:#22C55E;}',
    '.ve-nav-member{display:flex;align-items:center;gap:8px;cursor:pointer;position:relative;}',
    '.ve-nav-avatar{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff;flex-shrink:0;font-family:"Montserrat",sans-serif;letter-spacing:0.04em;}',
    '.ve-nav-lesars{background:#F0FDF4;border:1px solid #BBF7D0;color:#0F5C2B;font-size:10px;font-weight:800;letter-spacing:0.08em;padding:4px 8px;border-radius:20px;white-space:nowrap;}',
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
    '.ve-mob-login{display:block;text-align:center;background:none;border:1px solid rgba(0,0,0,0.15);color:#1a1a1a !important;font-size:12px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;padding:12px;border-radius:4px;text-decoration:none;margin-bottom:8px;transition:border-color 0.15s;}',
    '.ve-mob-login:hover{border-color:#22C55E;color:#22C55E !important;}',
    '.ve-mob-divider{border:none;border-top:1px solid rgba(0,0,0,0.08);margin:4px 0;}',
    '.ve-mob-signout{padding:13px 20px;font-family:"Montserrat",sans-serif;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#dc2626;cursor:pointer;background:none;border:none;width:100%;text-align:left;}',
    '.ve-mob-signout:hover{background:#fef2f2;}',
    '.ve-mob-lesars{display:inline-block;background:#F0FDF4;border:1px solid #BBF7D0;color:#15803D;font-size:10px;font-weight:800;letter-spacing:0.06em;padding:3px 7px;border-radius:20px;margin-left:6px;vertical-align:middle;}',
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
    '@media(max-width:860px){.ve-nav-public .ve-nav-inner{height:auto;flex-wrap:wrap;row-gap:0;padding-top:0;padding-bottom:10px;} .ve-nav-public .ve-wordmark{height:56px;} .ve-nav-public .ve-pub-nav{order:3;flex:0 0 100%;margin-left:0;} .ve-pub-tabs{display:none;} .ve-pub-select{display:block;} .ve-nav-public .ve-nav-right-wrap{display:flex !important;margin-left:auto;}}',
    '.ve-announce-wrap{display:flex;align-items:center;min-width:0;margin-right:16px;}',
    '.ve-announce{display:flex;align-items:center;gap:8px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:30px;padding:6px 14px 6px 6px;cursor:pointer;text-decoration:none;max-width:360px;min-width:0;transition:background 0.15s,border-color 0.15s;}',
    '.ve-announce:hover{background:#e3f9e7;border-color:#9fe6ac;}',
    '.ve-announce-icon{width:22px;height:22px;border-radius:50%;flex-shrink:0;background:#F69820;display:flex;align-items:center;justify-content:center;}',
    '.ve-announce-text{font-size:11px;font-weight:700;color:#0F5C2B;letter-spacing:0.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:1;transition:opacity 0.25s;}',
    '.ve-announce-text.fading{opacity:0;}',
    '.ve-nav-right-wrap{display:flex;align-items:center;}',
    '@media(max-width:900px){.ve-announce{max-width:360px;} .ve-nav-right-wrap{display:none;}}',
    /* Phones: the pill gets its own full-width row so the message is readable instead of a 7px ellipsis. */
    '@media(max-width:560px){.ve-nav-inner{height:auto;flex-wrap:wrap;row-gap:0;padding-bottom:10px;} .ve-wordmark{height:60px;} .ve-announce-wrap{order:4;flex:0 0 100%;margin:0;} .ve-announce{max-width:none;width:100%;border-radius:18px;} .ve-announce-text{white-space:normal;overflow:visible;line-height:1.35;} .ve-mob-menu{top:104px;}}',
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
    '.ve-va-opt.ve-va-active{background:#F0FDF4;color:#15803D;}',
    '.ve-sw-label{margin-top:18px;}',
    '.ve-sw-list{border:1px solid rgba(0,0,0,0.1);border-radius:6px;overflow:hidden;}',
    '.ve-sw-opt{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:8px 12px;border:none;border-bottom:1px solid rgba(0,0,0,0.07);background:#fff;font-family:"Montserrat",sans-serif;font-size:12px;font-weight:700;color:#1a1a1a;cursor:pointer;}',
    '.ve-sw-opt:last-child{border-bottom:none;}',
    '.ve-sw-opt:hover{background:#f5f5f5;}',
    '.ve-sw-opt img,.ve-sw-opt .ve-sw-ini{width:28px;height:28px;border-radius:6px;object-fit:cover;flex-shrink:0;background:#DCFCE7;color:#15803D;display:flex;align-items:center;justify-content:center;font-size:11px;}',
    '.ve-sw-opt small{display:block;font-weight:600;color:rgba(0,0,0,0.5);font-size:11px;}',
    '.ve-sw-note{padding:10px 12px;font-size:12px;color:rgba(0,0,0,0.55);}',
    '.ve-sw-pill{position:fixed;left:16px;bottom:16px;z-index:10050;display:flex;align-items:center;gap:10px;max-width:calc(100% - 32px);padding:8px 8px 8px 14px;background:#1a1a1a;color:#fff;border-radius:6px;box-shadow:0 6px 20px rgba(0,0,0,0.25);font-family:"Montserrat",sans-serif;font-size:12px;font-weight:600;}',
    '.ve-sw-pill strong{font-weight:800;}',
    '.ve-sw-pill button{border:none;border-radius:6px;background:#22C55E;color:#0b2e14;font-family:"Montserrat",sans-serif;font-size:12px;font-weight:800;padding:8px 12px;cursor:pointer;white-space:nowrap;}'
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---- Auth state ---- */
  var realMember = null;
  try { realMember = JSON.parse(localStorage.getItem('ve_member') || 'null'); } catch(e) {}
  var realLoggedIn = !!(realMember && localStorage.getItem('ve_token'));

  /* ---- Switch account (Sean, 2026-10-26; ve-switch-account, playbook ve-guide-accounts) ----
     Unlike View As, a switch is a real sign-in as another account (Logan Russell, the Guides), so
     every call the page makes runs as that member. The super admin's own session waits in
     ve_switch_from until Back to my account puts it back. */
  var switchFrom = null;
  try { switchFrom = JSON.parse(localStorage.getItem('ve_switch_from') || 'null'); } catch(e) {}
  if (switchFrom && !(switchFrom.token && switchFrom.member)) switchFrom = null;
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

  /* ---- "Dashboard" nav link (2026-08-18, V direction) ----
     Only shown to logged-in members. A logged-out visitor has not
     registered, so Dashboard has no meaning for them -- confirmed via the
     Super Admin "View As: Public - Logged Out" simulator incorrectly
     showing it. Logged-out visitors get a Login link instead (below),
     placed directly above Get Passport. */
  var dashboardLinkHtml = loggedIn ? ('<a href="/dashboard"' + cur('/dashboard') + '>Dashboard</a>') : '';

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
    // 2026-10-03 (Sean): the badge names the membership a person actually has. Membership is
    // the one-time Founding Membership; Community Manager appears once Sean approves them.
    var tierBadge = member.ve_role === 'community_manager' ? 'Community Manager'
      : (member.membership_status === 'active' ? 'Founding Member' : 'Member');

    desktopRight =
      '<div class="ve-nav-member" id="ve-nav-member-chip" role="button" tabindex="0" aria-label="Account menu" aria-haspopup="true" aria-expanded="false">' +
        '<div class="ve-nav-avatar" style="' + avatarStyle + '">' + avatarSrc + '</div>' +
        '<span class="ve-nav-lesars">' + tierBadge + '</span>' +
        '<div class="ve-nav-member-menu" id="ve-member-menu" role="menu">' +
          '<a href="/account"' + cur('/account') + ' role="menuitem">My Account</a>' +
          // My Saves (Sean, 2026-10-27): the dashboard tab with saved episodes and listings; it replaced My List.
          '<a href="/dashboard/saves"' + cur('/dashboard/saves') + ' role="menuitem">My Saves</a>' +
          (member.membership_status === 'active' ? '<a href="/dashboard?contribute=1" role="menuitem">Contribute</a>' : '') +
          '<hr>' +
          '<button id="ve-signout-desktop" role="menuitem">Sign Out</button>' +
        '</div>' +
      '</div>';

    mobileBottom =
      '<hr class="ve-mob-divider">' +
      '<div class="ve-mob-section">' +
        '<a href="/account"' + cur('/account') + '>' +
          'Account' +
          '<span class="ve-mob-lesars">' + tierBadge + '</span>' +
        '</a>' +
        '<a href="/dashboard/saves"' + cur('/dashboard/saves') + '>My Saves</a>' +
        (member.membership_status === 'active' ? '<a href="/dashboard?contribute=1">Contribute</a>' : '') +
      '</div>' +
      '<button class="ve-mob-signout" id="ve-signout-mobile">Sign Out</button>';
  } else {
    // Copy fixed 2026-09-18 (Sean, live test): "- Free" pushed the free tier
    // as the default, which is backwards -- there is no more standalone
    // free tier, and the paid sustaining Passport is meant to be the
    // default choice, with the free Guest Passport application available
    // but not the headline.
    desktopRight =
      '<a href="/login" class="ve-nav-login"' + cur('/login') + '>Log In</a>' +
      '<a href="/passport" class="ve-nav-cta">Join</a>';
    mobileBottom =
      '<div class="ve-mob-cta-wrap">' +
        '<a href="/login" class="ve-mob-login"' + cur('/login') + '>Log In</a>' +
        '<a href="/passport" class="ve-mob-cta">Join</a>' +
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
        '<div class="ve-va-label ve-sw-label">Super Admin - Sign In As</div>' +
        '<div class="ve-sw-list" id="ve-sw-list"><div class="ve-sw-note">Loading accounts...</div></div>' +
      '</div>';
  } else if (switchFrom) {
    adminPanel =
      '<hr class="ve-mob-divider">' +
      '<div class="ve-mob-section ve-va-panel">' +
        '<div class="ve-va-label">Signed In As ' + swEsc(realMember && realMember.name) + '</div>' +
        '<div class="ve-sw-list"><button class="ve-sw-opt" data-sw-back="1">Back to my account</button></div>' +
      '</div>';
  }

  /* ---- Nav HTML ---- */
  var announceHtml =
    '<div class="ve-announce-wrap">' +
      '<a class="ve-announce" id="ve-announce" href="/partners#guide" aria-label="Special announcements">' +
        '<span class="ve-announce-icon" aria-hidden="true">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.9a2 2 0 1 1-3.2 0"/></svg>' +
        '</span>' +
        '<span class="ve-announce-text" id="ve-announce-text">Founding Membership: $11 one time, and you are in.</span>' +
      '</a>' +
    '</div>';

  // Menu (Sean, 2026-10-26): Events is open to everyone; the Community Board left the menu (its jobs,
  // classifieds, fosters and rescues are reached through the Pulse) and so did Lead Your City.
  // One list for the drawer and the signed-out bar. A page under a section counts as that section (/directory/<slug>).
  var MENU = [['Guides', '/guides'], ['Pulse', '/pulse'], ['Media', '/media'], ['Communities', '/communities'], ['Directory', '/directory'], ['Events', '/events']];
  function inSection(href) {
    if (href === '/media' && p.indexOf('/podcast/') === 0) return true;
    if (href === '/pulse' && isCurrent('/guides/ve-discuss')) return true;
    return p === href || p.indexOf(href + '/') === 0;
  }
  var here = MENU.filter(function (m) { return inSection(m[1]); })[0];
  // Signed out: the dashboard-style bar. A super admin viewing as the public keeps the drawer for View As.
  var publicBar = !loggedIn;
  var pubNavHtml = !publicBar ? '' :
    '<div class="ve-pub-nav">' +
      '<div class="ve-pub-tabs">' + MENU.map(function (m) { return '<a href="' + m[1] + '"' + (inSection(m[1]) ? ' aria-current="page"' : '') + '>' + m[0] + '</a>'; }).join('') + '</div>' +
      '<select class="ve-pub-select" id="ve-pub-select" aria-label="Menu">' +
        (here ? '' : '<option value="" selected>Menu</option>') +
        MENU.map(function (m) { return '<option value="' + m[1] + '"' + (here === m ? ' selected' : '') + '>' + m[0] + '</option>'; }).join('') +
      '</select>' +
    '</div>';
  var showDrawer = !publicBar || !!adminPanel;
  var html =
    '<nav class="ve-nav' + (publicBar ? ' ve-nav-public' : '') + '" role="navigation" aria-label="Main navigation">' +
      '<div class="ve-nav-inner">' +
        '<a href="/" class="ve-wordmark" aria-label="Vegans Explore home"' + cur('/') + '>' +
          '<img class="ve-wordmark-logo" src="/public/logo-ve-landscape-v1.svg" alt="Vegans Explore">' +
        '</a>' +
        (publicBar ? pubNavHtml : '<div class="ve-nav-spacer"></div>' + announceHtml) +
        '<div class="ve-nav-right-wrap">' + desktopRight + '</div>' +
        (showDrawer ? '<button class="ve-hamburger" id="ve-hamburger-btn" aria-label="Open navigation" aria-expanded="false" aria-controls="ve-mob-menu">' + iconMenu + '</button>' : '') +
      '</div>' +
    '</nav>' +
    '<div class="ve-mob-overlay" id="ve-mob-overlay" aria-hidden="true"></div>' +
    '<div class="ve-mob-menu" id="ve-mob-menu" role="dialog" aria-label="Navigation" aria-modal="true">' +
      (publicBar ? '' :
      '<div class="ve-mob-section">' +
        dashboardLinkHtml +
        '<a href="/guides"' + cur('/guides') + '>Guides</a>' +
        '<a href="/pulse" id="ve-nav-pulse-link"' + (isCurrent('/pulse') || isCurrent('/guides/ve-discuss') ? ' aria-current="page"' : '') + '>Pulse</a>' +
        '<a href="/media"' + (isCurrent('/media') || p.indexOf('/podcast/') === 0 ? ' aria-current="page"' : '') + '>Media</a>' +
        '<a href="/communities"' + cur('/communities') + '>Communities</a>' +
        '<a href="/directory"' + cur('/directory') + '>Directory</a>' +
        '<a href="/events"' + cur('/events') + '>Events</a>' +
      '</div>' +
      mobileBottom) +
      adminPanel +
    '</div>';

  document.currentScript.insertAdjacentHTML('beforebegin', html);
  // The menu's height, for anything that sticks under it (the ad rail): --ve-nav-h on the page.
  (function () {
    var navEl = document.querySelector('.ve-nav'); if (!navEl) return;
    function setH() { document.documentElement.style.setProperty('--ve-nav-h', Math.round(navEl.getBoundingClientRect().height) + 'px'); }
    setH(); window.addEventListener('resize', setH); window.addEventListener('load', setH);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setH);
  })();

  /* ---- Special Announcements pill: rotates messages, links to real pages (safe on every route) ----
     2026-08-18 (V direction): messages used to be hardcoded here, which meant a
     code push every time the copy needed to change - and it went stale for
     weeks (still advertising a $11 founding offer that never existed and a
     July city launch, months after both were dead). Now fetched from
     ve_nav_announcements (public-readable, is_active=true rows only), so
     updating the rotation is a database edit, not a deploy. Falls back to a
     single safe default if the fetch fails so the pill never breaks. */
  (function() {
    var FALLBACK = [{ text: 'Founding Membership: $11 one time, and you are in.', href: '/partners#guide' }];
    var idx = 0;
    var messages = FALLBACK;
    var textEl = document.getElementById('ve-announce-text');
    var linkEl = document.getElementById('ve-announce');
    if (!textEl || !linkEl) return;

    function rotate() {
      setInterval(function() {
        textEl.classList.add('fading');
        setTimeout(function() {
          idx = (idx + 1) % messages.length;
          textEl.textContent = messages[idx].text;
          linkEl.setAttribute('href', messages[idx].href);
          textEl.classList.remove('fading');
        }, 250);
      }, 6000);
    }

    var SUPABASE_URL = 'https://fwbhwfxpncrsfhttimna.supabase.co';
    var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
    fetch(SUPABASE_URL + '/rest/v1/ve_nav_announcements?select=message,href,sort_order&is_active=eq.true&order=sort_order.asc', {
      headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY }
    }).then(function(r) { return r.ok ? r.json() : null; }).then(function(rows) {
      if (rows && rows.length) {
        messages = rows.map(function(r) { return { text: r.message, href: r.href }; });
        textEl.textContent = messages[0].text;
        linkEl.setAttribute('href', messages[0].href);
      }
    }).catch(function() {}).then(rotate);
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
      chip.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chip.click(); }
        if (e.key === 'Escape') { menu.classList.remove('open'); chip.setAttribute('aria-expanded', 'false'); }
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
      localStorage.removeItem('ve_switch_from');
      window.location.href = '/';
    });
    var signoutM = document.getElementById('ve-signout-mobile');
    if (signoutM) signoutM.addEventListener('click', function() {
      localStorage.removeItem('ve_token');
      localStorage.removeItem('ve_member');
      localStorage.removeItem('ve_switch_from');
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

  /* ---- Switch account: Sign In As list (super admin) and the way back ---- */
  var SW_URL = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-switch-account';
  function swCall(body, token) {
    return fetch(SW_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify(body) })
      .then(function(r) { return r.json(); });
  }
  function swBack() {
    try {
      localStorage.setItem('ve_token', switchFrom.token);
      localStorage.setItem('ve_member', JSON.stringify(switchFrom.member));
      localStorage.removeItem('ve_switch_from');
    } catch(e) {}
    window.location.reload();
  }
  var swList = document.getElementById('ve-sw-list');
  if (isRealSuperAdmin && !switchFrom && swList) {
    var ownToken = null;
    try { ownToken = localStorage.getItem('ve_token'); } catch(e) {}
    swCall({ action: 'list' }, ownToken).then(function(d) {
      var rows = (d && d.accounts) || [];
      if (!rows.length) { swList.innerHTML = '<div class="ve-sw-note">No accounts to switch into.</div>'; return; }
      swList.innerHTML = rows.map(function(a) {
        var pic = a.avatar_url ? '<img src="' + swEsc(a.avatar_url) + '" alt="">' : '<span class="ve-sw-ini">' + swEsc((a.label || '?').charAt(0)) + '</span>';
        var sub = a.kind === 'guide' ? 'Guide' : (a.note || 'Member');
        return '<button class="ve-sw-opt" data-sw="' + swEsc(a.member_id) + '">' + pic + '<span>' + swEsc(a.label) + '<small>' + swEsc(sub) + '</small></span></button>';
      }).join('');
    }).catch(function() { swList.innerHTML = '<div class="ve-sw-note">Could not load the accounts.</div>'; });
    swList.addEventListener('click', function(e) {
      e.stopPropagation();
      var btn = e.target.closest ? e.target.closest('[data-sw]') : null;
      if (!btn) return;
      btn.disabled = true;
      swCall({ action: 'switch', member_id: btn.getAttribute('data-sw') }, ownToken).then(function(d) {
        if (!d || !d.token || !d.member) { btn.disabled = false; alert((d && d.message) || 'That switch did not go through.'); return; }
        try {
          localStorage.setItem('ve_switch_from', JSON.stringify({ token: ownToken, member: realMember }));
          localStorage.removeItem('ve_view_as');
          localStorage.setItem('ve_token', d.token);
          localStorage.setItem('ve_member', JSON.stringify(d.member));
        } catch(e) {}
        window.location.href = '/dashboard';
      }).catch(function() { btn.disabled = false; });
    });
  }
  if (switchFrom) {
    document.body.insertAdjacentHTML('beforeend',
      '<div class="ve-sw-pill" role="status"><span>Signed in as <strong>' + swEsc(realMember && realMember.name) + '</strong></span>' +
      '<button type="button" data-sw-back="1">Back to my account</button></div>');
    var swBacks = document.querySelectorAll('[data-sw-back]');
    for (var _b = 0; _b < swBacks.length; _b++) swBacks[_b].addEventListener('click', function(e) { e.stopPropagation(); swBack(); });
  }

  var pubSelect = document.getElementById('ve-pub-select');
  if (pubSelect) pubSelect.addEventListener('change', function () { if (pubSelect.value) location.href = pubSelect.value; });

  /* ---- Hamburger + drawer toggle ---- */
  var hamburger = document.getElementById('ve-hamburger-btn');
  if (hamburger) {
  var mobMenu   = document.getElementById('ve-mob-menu');
  var overlay   = document.getElementById('ve-mob-overlay');

  function setMobOpen(open) {
    // The nav is taller on phones (announcement row), so open the menu right under it.
    if (open) { var navEl = document.querySelector('.ve-nav'); if (navEl) mobMenu.style.top = Math.round(navEl.getBoundingClientRect().bottom) + 'px'; }
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
  }

  /* ---- Passport gate (event delegation - runs on every page nav.js is included) ---- */
  var _gated = ['.vote-hero-btn', '.donate-btn', '#donate-btn', '.btn-join', '.star-btn', '.mobile-sticky-btn-vote', '.mobile-sticky-btn-save'];
  // Signed out, a members-only button opens the Passport Guide (Sean, 2026-10-25: /passport is the one Passport), which has
  // Sign in for members and returns them here (back=). The old sign-in pop-up stays only as the fallback below.
  function _showGateModal(msg) {
    var _here = location.pathname + location.search + location.hash;
    if (location.pathname !== '/passport') { location.href = '/passport?back=' + encodeURIComponent(_here); return; }
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
        _showGateModal('Get your free Passport to join the discussion.');
        return;
      }
      t = t.parentElement;
    }
  }, true);

})();