/* The account menu (Sean, 2026-10-27: "when I click my circle with the L, that activates the view as as well as the
 * ability to log out... for members, it would just be for them to see their account information and to log out").
 * One menu for the avatar on every page: the site nav (public/nav.js) and the dashboard (dashboard/center-console.html).
 *
 *   VEAccountMenu.attach(buttonEl)   the button opens and closes the menu under it
 *
 * Everyone signed in: their name, email and membership, My Account, My Saves, Contribute (active members), Sign out.
 * A super admin also gets View As (the public, a member, an Ambassador, a Community Manager; ve_view_as, the same overlay
 * public/ve-auth.js reads) and Sign In As (ve-switch-account, a real sign-in as one of the ve_switch_accounts).
 * While a preview or a switch is on, a pill at the bottom left says so, with Back to my account.
 * Reads localStorage directly, like nav.js, so it works on pages that never load ve-auth.js. */
(function () {
  if (window.VEAccountMenu) return;
  var SW_URL = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-switch-account';
  var VIEWS = [
    { key: 'real', label: 'My account' },
    { key: 'public', label: 'The public (signed out)' },
    { key: 'member', label: 'Member' },
    { key: 'amb', label: 'Ambassador' },
    { key: 'cm', label: 'Community Manager' }
  ];

  function read(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function token() { try { return localStorage.getItem('ve_token'); } catch (e) { return null; } }
  function realMember() { return read('ve_member'); }
  function switchFrom() { var s = read('ve_switch_from'); return s && s.token && s.member ? s : null; }
  function isSuper() { var m = realMember(); return !!(m && m.is_superadmin); }
  function viewKey() {
    if (!isSuper()) return 'real';
    var v = read('ve_view_as');
    if (!v) return 'real';
    if (v.mode === 'public') return 'public';
    if (v.mode === 'member') return v.role === 'community_manager' ? 'cm' : v.role === 'ambassador' ? 'amb' : 'member';
    return 'real';
  }
  function viewLabel(k) { return { 'public': 'the public', member: 'a member', amb: 'an Ambassador', cm: 'a Community Manager' }[k] || ''; }
  function badge(m) {
    if (!m) return '';
    if (m.is_superadmin) return 'Super admin';
    if (m.ve_role === 'community_manager') return 'Community Manager';
    if (m.ve_role === 'ambassador') return 'Ambassador';
    return m.membership_status === 'active' ? 'Founding Member' : 'Member';
  }

  function setView(k) {
    try {
      if (k === 'real') localStorage.removeItem('ve_view_as');
      else if (k === 'public') localStorage.setItem('ve_view_as', JSON.stringify({ mode: 'public' }));
      else if (k === 'member') localStorage.setItem('ve_view_as', JSON.stringify({ mode: 'member', points: 0, tier: 'free', role: null }));
      else if (k === 'amb') localStorage.setItem('ve_view_as', JSON.stringify({ mode: 'member', points: 0, tier: 'free', role: 'ambassador' }));
      else if (k === 'cm') localStorage.setItem('ve_view_as', JSON.stringify({ mode: 'member', points: 0, tier: 'free', role: 'community_manager' }));
    } catch (e) {}
    // The dashboard is for members, so the public view opens the homepage.
    if (k === 'public' && /^\/(dashboard|admin)(\/|$)/.test(location.pathname)) location.href = '/';
    else location.reload();
  }
  function signOut() {
    try { ['ve_token', 've_member', 've_switch_from', 've_view_as'].forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {}
    location.href = '/';
  }
  function backToMine() {
    var s = switchFrom();
    try {
      if (s) {
        localStorage.setItem('ve_token', s.token);
        localStorage.setItem('ve_member', JSON.stringify(s.member));
        localStorage.removeItem('ve_switch_from');
      }
      localStorage.removeItem('ve_view_as');
    } catch (e) {}
    location.reload();
  }

  var CSS =
    '.vam{position:fixed;z-index:10040;width:300px;max-width:calc(100vw - 24px);max-height:calc(100vh - 80px);overflow:auto;background:#fff;border:1px solid rgba(0,0,0,0.12);border-radius:8px;box-shadow:0 12px 32px rgba(0,0,0,0.16);font-family:"Montserrat",sans-serif;color:#1a1a1a;text-align:left;}' +
    '.vam[hidden]{display:none;}' +
    '.vam-head{display:flex;align-items:center;gap:12px;padding:16px;border-bottom:1px solid rgba(0,0,0,0.08);}' +
    '.vam-av{width:40px;height:40px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#fff;overflow:hidden;}' +
    '.vam-av img{width:100%;height:100%;object-fit:cover;}' +
    '.vam-who{min-width:0;}' +
    '.vam-name{font-size:14px;font-weight:800;line-height:1.3;}' +
    '.vam-mail{font-size:12px;font-weight:600;color:rgba(26,26,26,0.68);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '.vam-tag{display:inline-block;margin-top:5px;background:#F0FDF4;border:1px solid #BBF7D0;color:#0F5C2B;font-size:10px;font-weight:800;letter-spacing:0.06em;padding:3px 8px;border-radius:6px;}' +
    '.vam-sec{padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.08);}' +
    '.vam-sec:last-child{border-bottom:none;}' +
    '.vam-label{font-size:10px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:rgba(26,26,26,0.6);padding:10px 16px 6px;}' +
    '.vam a,.vam button{display:flex;align-items:center;gap:10px;width:100%;padding:11px 16px;background:none;border:none;font:inherit;font-size:13px;font-weight:700;color:#1a1a1a;text-decoration:none;text-align:left;cursor:pointer;}' +
    '.vam a:hover,.vam button:hover{background:#f5f5f5;}' +
    '.vam a:focus-visible,.vam button:focus-visible{outline:3px solid #22C55E;outline-offset:-3px;}' +
    '.vam-opt .vam-dot{width:14px;height:14px;border-radius:50%;border:2px solid rgba(0,0,0,0.3);flex-shrink:0;}' +
    '.vam-opt.on{color:#15803D;}' +
    '.vam-opt.on .vam-dot{border-color:#16A34A;background:radial-gradient(#16A34A 0 3px,#fff 4px);}' +
    '.vam-sw img,.vam-sw .vam-ini{width:28px;height:28px;border-radius:6px;object-fit:cover;flex-shrink:0;background:#DCFCE7;color:#15803D;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;}' +
    '.vam-sw small{display:block;font-size:11px;font-weight:600;color:rgba(26,26,26,0.6);}' +
    '.vam-note{padding:8px 16px 12px;font-size:12px;color:rgba(26,26,26,0.68);}' +
    '.vam .vam-out{color:#b91c1c;}' +
    '.vam .vam-out:hover{background:#fef2f2;}' +
    '.vam-pill{position:fixed;left:16px;bottom:16px;z-index:10050;display:flex;align-items:center;gap:10px;max-width:calc(100% - 32px);padding:8px 8px 8px 14px;background:#1a1a1a;color:#fff;border-radius:6px;box-shadow:0 6px 20px rgba(0,0,0,0.25);font-family:"Montserrat",sans-serif;font-size:12px;font-weight:600;}' +
    '.vam-pill strong{font-weight:800;}' +
    '.vam-pill button{border:none;border-radius:6px;background:#22C55E;color:#0b2e14;font-family:"Montserrat",sans-serif;font-size:12px;font-weight:800;padding:8px 12px;cursor:pointer;white-space:nowrap;}';
  function addCss() {
    if (document.getElementById('vam-css')) return;
    var st = document.createElement('style'); st.id = 'vam-css'; st.textContent = CSS; document.head.appendChild(st);
  }

  var swCache = null;
  function loadSwitchList(box) {
    function draw(rows) {
      if (!rows.length) { box.innerHTML = '<div class="vam-note">No accounts to switch into.</div>'; return; }
      box.innerHTML = rows.map(function (a) {
        var pic = a.avatar_url ? '<img src="' + esc(a.avatar_url) + '" alt="">' : '<span class="vam-ini">' + esc((a.label || '?').charAt(0)) + '</span>';
        return '<button type="button" class="vam-sw" data-sw="' + esc(a.member_id) + '">' + pic + '<span>' + esc(a.label) + '<small>' + esc(a.kind === 'guide' ? 'Guide' : (a.note || 'Member')) + '</small></span></button>';
      }).join('');
    }
    if (swCache) { draw(swCache); return; }
    fetch(SW_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() }, body: JSON.stringify({ action: 'list' }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { swCache = (d && d.accounts) || []; draw(swCache); })
      .catch(function () { box.innerHTML = '<div class="vam-note">Could not load the accounts.</div>'; });
  }
  function switchInto(btn) {
    var own = token(), me = realMember();
    btn.disabled = true;
    fetch(SW_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + own }, body: JSON.stringify({ action: 'switch', member_id: btn.getAttribute('data-sw') }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.token || !d.member) { btn.disabled = false; alert((d && d.message) || 'That switch did not go through.'); return; }
        try {
          localStorage.setItem('ve_switch_from', JSON.stringify({ token: own, member: me }));
          localStorage.removeItem('ve_view_as');
          localStorage.setItem('ve_token', d.token);
          localStorage.setItem('ve_member', JSON.stringify(d.member));
        } catch (e) {}
        location.href = '/dashboard';
      })
      .catch(function () { btn.disabled = false; });
  }

  function build() {
    var m = realMember(), sw = switchFrom(), sup = isSuper() && !sw, k = viewKey();
    if (!m) return '';
    var av = m.avatar_url ? '<img src="' + esc(m.avatar_url) + '" alt="">' : esc(m.initials || (m.name || '?').charAt(0));
    var h = '<div class="vam-head"><div class="vam-av" style="background:' + esc(m.color || '#22C55E') + '">' + av + '</div>' +
      '<div class="vam-who"><div class="vam-name">' + esc(m.name || 'Your account') + '</div>' +
      (m.email ? '<div class="vam-mail">' + esc(m.email) + '</div>' : '') +
      '<span class="vam-tag">' + esc(badge(m)) + '</span></div></div>';
    h += '<div class="vam-sec">' +
      '<a href="/account" role="menuitem">My Account</a>' +
      '<a href="/dashboard/saves" role="menuitem">My Saves</a>' +
      (m.membership_status === 'active' ? '<a href="/dashboard?contribute=1" role="menuitem">Contribute</a>' : '') +
      '</div>';
    if (sup) {
      h += '<div class="vam-sec" role="group" aria-label="View as"><div class="vam-label">View as</div>' +
        VIEWS.map(function (v) {
          return '<button type="button" class="vam-opt' + (v.key === k ? ' on' : '') + '" role="menuitemradio" aria-checked="' + (v.key === k) + '" data-view="' + v.key + '"><span class="vam-dot" aria-hidden="true"></span>' + v.label + '</button>';
        }).join('') + '</div>' +
        '<div class="vam-sec" role="group" aria-label="Sign in as"><div class="vam-label">Sign in as</div><div class="vam-swlist"><div class="vam-note">Loading accounts...</div></div></div>';
    }
    if (sw) h += '<div class="vam-sec"><div class="vam-label">Signed in as ' + esc(m.name) + '</div><button type="button" data-back="1" role="menuitem">Back to my account</button></div>';
    h += '<div class="vam-sec"><button type="button" class="vam-out" data-out="1" role="menuitem">Sign out</button></div>';
    return h;
  }

  var menu = null, owner = null;
  function close() {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    if (owner) owner.setAttribute('aria-expanded', 'false');
  }
  function place(btn) {
    var r = btn.getBoundingClientRect(), w = menu.offsetWidth || 300;
    menu.style.top = Math.round(r.bottom + 8) + 'px';
    menu.style.left = Math.round(Math.max(12, Math.min(window.innerWidth - w - 12, r.right - w))) + 'px';
  }
  function open(btn) {
    addCss();
    if (!menu) {
      menu = document.createElement('div');
      menu.className = 'vam'; menu.id = 'vam-menu'; menu.setAttribute('role', 'menu'); menu.hidden = true;
      document.body.appendChild(menu);
      menu.addEventListener('click', function (e) {
        e.stopPropagation();
        var t = e.target.closest ? e.target.closest('[data-view],[data-sw],[data-back],[data-out]') : null;
        if (!t) return;
        if (t.hasAttribute('data-view')) { if (!t.classList.contains('on')) setView(t.getAttribute('data-view')); }
        else if (t.hasAttribute('data-sw')) switchInto(t);
        else if (t.hasAttribute('data-back')) backToMine();
        else if (t.hasAttribute('data-out')) signOut();
      });
      document.addEventListener('click', close);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu && !menu.hidden) { close(); if (owner) owner.focus(); } });
      window.addEventListener('resize', close);
    }
    menu.innerHTML = build();
    var list = menu.querySelector('.vam-swlist');
    if (list) loadSwitchList(list);
    owner = btn;
    menu.hidden = false;
    place(btn);
    btn.setAttribute('aria-expanded', 'true');
    var first = menu.querySelector('a,button'); if (first) first.focus({ preventScroll: true });
  }
  function attach(btn) {
    if (!btn || btn._vam) return;
    btn._vam = true;
    btn.setAttribute('aria-haspopup', 'menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'vam-menu');
    btn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (menu && !menu.hidden && owner === btn) close(); else open(btn);
    });
    btn.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } });
  }

  // While a preview or a switch is on, say so on every page, with the way back. Not inside a frame (the page around it shows it).
  function pill() {
    var top = true; try { top = window.self === window.top; } catch (e) { top = false; }
    if (!top || document.querySelector('.vam-pill')) return;
    var sw = switchFrom(), k = viewKey(), m = realMember(), text = '';
    if (sw) text = 'Signed in as <strong>' + esc(m && m.name) + '</strong>';
    else if (k !== 'real') text = 'Viewing as <strong>' + esc(viewLabel(k)) + '</strong>';
    if (!text) return;
    addCss();
    var el = document.createElement('div');
    el.className = 'vam-pill'; el.setAttribute('role', 'status');
    el.innerHTML = '<span>' + text + '</span><button type="button">Back to my account</button>';
    el.querySelector('button').addEventListener('click', backToMine);
    document.body.appendChild(el);
  }
  if (document.body) pill(); else document.addEventListener('DOMContentLoaded', pill);

  window.VEAccountMenu = { attach: attach, close: close, signOut: signOut };
})();
