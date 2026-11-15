/* The site as an app (Sean, 2026-11-15: "I clicked to get an image... It came up full screen so I can save it to my library. And then I
 * didn't have a way of going back because I don't have navigation because it's a web app. So we need to make sure that the site is set
 * up for web apps"). Loaded by /public/nav.js on every page.
 *  - Opened from the home screen (display-mode standalone) there is no browser bar, so the top bar gets a Back button on every page but
 *    the homepage (history back, or home when there is nothing to go back to).
 *  - A link to a picture or a PDF on our sites never opens as a bare page there: it opens in a viewer over the page with Close (and, for a
 *    picture, "press and hold to save"). Only in the app: in a browser, Back works and pages keep their own viewers.
 *  - "Get the app" in the phone menu (data-ve-install) opens the Add to home screen steps (VEInstall.show, /public/ve-install.js).
 *  - The app's bottom bar on phones (below). */
(function () {
  if (window.VEAppShell) return;
  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  var OURS = /(^|\.)vegansexplore\.com$|supabase\.co$|\.vercel\.app$|^localhost$/;
  var FILE = /\.(png|jpe?g|webp|gif|svg|pdf)(\?|#|$)/i;

  var css = document.createElement('style');
  css.textContent =
    '.ve-app-back{appearance:none;border:2px solid #1A1A1A;background:#fff;color:#1A1A1A;border-radius:6px;height:38px;min-width:38px;padding:0 10px;' +
    'display:inline-flex;align-items:center;gap:4px;font:800 14px/1 Montserrat,system-ui,sans-serif;cursor:pointer;margin-right:8px;flex:0 0 auto}' +
    '.ve-app-back svg{width:18px;height:18px}' +
    '#ve-viewer{position:fixed;inset:0;z-index:10060;background:rgba(17,17,17,.94);display:flex;flex-direction:column;' +
    'padding:calc(10px + env(safe-area-inset-top,0px)) 12px calc(14px + env(safe-area-inset-bottom,0px))}' +
    '#ve-viewer .vv-top{display:flex;align-items:center;gap:10px;color:#fff;font:700 13px/1.35 Montserrat,system-ui,sans-serif}' +
    '#ve-viewer .vv-top span{flex:1;min-width:0}' +
    '#ve-viewer button{appearance:none;border:2px solid #fff;background:#fff;color:#1A1A1A;border-radius:6px;padding:10px 16px;font:800 14px/1 Montserrat,system-ui,sans-serif;cursor:pointer}' +
    '#ve-viewer .vv-body{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;margin-top:10px}' +
    '#ve-viewer img{max-width:100%;max-height:100%;object-fit:contain;-webkit-touch-callout:default}' +
    '#ve-viewer iframe{width:100%;height:100%;border:0;background:#fff;border-radius:6px}';
  (document.head || document.documentElement).appendChild(css);

  function close() { var v = document.getElementById('ve-viewer'); if (v) v.remove(); document.removeEventListener('keydown', esc); }
  function esc(e) { if (e.key === 'Escape') close(); }
  function view(url) {
    close();
    var pdf = /\.pdf(\?|#|$)/i.test(url);
    var v = document.createElement('div'); v.id = 've-viewer'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true');
    v.innerHTML = '<div class="vv-top"><span>' + (pdf ? '' : 'Press and hold the picture, then Save to Photos.') + '</span><button type="button">Close</button></div>' +
      '<div class="vv-body">' + (pdf ? '<iframe title="Document"></iframe>' : '<img alt="">') + '</div>';
    v.querySelector(pdf ? 'iframe' : 'img').src = url;
    v.querySelector('button').onclick = close;
    v.addEventListener('click', function (e) { if (e.target === v || e.target.className === 'vv-body') close(); });
    document.body.appendChild(v); document.addEventListener('keydown', esc);
    v.querySelector('button').focus();
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var inst = e.target.closest && e.target.closest('[data-ve-install]');
    if (inst) {
      e.preventDefault();
      var go = function () { if (window.VEInstall) window.VEInstall.show(); };
      if (window.VEInstall) go(); else { var s = document.createElement('script'); s.src = '/public/ve-install.js'; s.onload = go; document.head.appendChild(s); }
      return;
    }
    if (!standalone) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.hasAttribute('data-no-viewer')) return;
    var u; try { u = new URL(a.getAttribute('href'), location.href); } catch (er) { return; }
    if (!FILE.test(u.pathname) || !OURS.test(u.hostname)) return;
    e.preventDefault();
    view(u.href);
  }, true);

  function addBack() {
    if (!standalone || location.pathname === '/' || document.querySelector('.ve-app-back')) return;
    var home = document.querySelector('.ve-nav .ve-wordmark'); if (!home) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 've-app-back'; b.setAttribute('aria-label', 'Back');
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
    b.onclick = function () { if (history.length > 1) history.back(); else location.href = '/'; };
    home.parentNode.insertBefore(b, home);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addBack); else addBack();

  /* The bottom bar on phones (Sean, 2026-11-15: "the app has a bottom menu... is that something we should bring to the mobile version?
   * ... go, build the bottom menu"): the app's five tabs in its order (vegansexplore-app src/components/TabBar.tsx), Home, Explore, Menu
   * raised in the center, Saves, Profile, with the app's icons, dressed like HQ's phone bar in Color Block. Menu opens the site's menu.
   * Phones only (860 px and under, where the site's menu becomes the hamburger), on every page with the site's nav, never in a frame or on another brand's site. */
  var TABS = [
    ['Home', '/', '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>', function (p) { return p === '/' || p === '/index.html'; }],
    ['Explore', '/directory', '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', function (p) { return /^\/(directory|search|explore)(\/|$)/.test(p); }],
    ['Menu', '#menu', '<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>', function () { return false; }],
    ['Saves', '/dashboard/saves', '<path d="M6 3h12v18l-6-4-6 4z"/>', function (p) { return /^\/dashboard\/saves/.test(p); }],
    ['Profile', '/dashboard/profile', '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>', function (p) { return /^\/(dashboard\/profile|account)(\/|$)/.test(p); }]
  ];
  var barCss = document.createElement('style');
  barCss.textContent =
    '.ve-tabbar{display:none}' +
    '@media (max-width:860px){' +
    'body.ve-has-tabbar{padding-bottom:calc(86px + env(safe-area-inset-bottom,0px))}' +
    'body.ve-has-tabbar{--ve-tabbar-h:calc(76px + env(safe-area-inset-bottom,0px))}' +
    'body.ve-has-tabbar #ve-inst{bottom:calc(100px + env(safe-area-inset-bottom,0px))}' +
    '.ve-tabbar{display:grid;grid-template-columns:repeat(5,1fr);position:fixed;left:0;right:0;bottom:0;z-index:9000;background:#fff;border-top:3px solid #1A1A1A;' +
    'padding:6px 4px calc(22px + env(safe-area-inset-bottom,0px));font-family:Montserrat,system-ui,sans-serif}' +
    '.ve-tabbar a{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:2px;font-size:11px;font-weight:800;text-decoration:none;color:#1A1A1A;padding:4px 0;min-height:48px;-webkit-tap-highlight-color:transparent}' +
    '.ve-tabbar svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}' +
    '.ve-tabbar a[aria-current="page"]{color:#2D5C27}.ve-tabbar a[aria-current="page"] span{box-shadow:inset 0 -3px 0 #22C55E}' +
    '.ve-tabbar .vt-mid svg{width:24px;height:24px;color:#fff;background:#2D5C27;border:3px solid #1A1A1A;border-radius:50%;padding:10px;box-sizing:content-box;margin-top:-24px}' +
    '}';
  (document.head || document.documentElement).appendChild(barCss);
  function addBar() {
    if (window.VE_BRAND || document.querySelector('.ve-tabbar') || !document.querySelector('.ve-nav')) return;
    var framed = false; try { framed = window.self !== window.top; } catch (e) { framed = true; }
    if (framed) return;
    var p = location.pathname;
    var nav = document.createElement('nav'); nav.className = 've-tabbar'; nav.setAttribute('aria-label', 'Quick');
    nav.innerHTML = TABS.map(function (t) {
      var mid = t[0] === 'Menu';
      return '<a href="' + t[1] + '"' + (mid ? ' class="vt-mid" data-ve-menu' : '') + (t[3](p) ? ' aria-current="page"' : '') + '>' +
        '<svg viewBox="0 0 24 24" aria-hidden="true">' + t[2] + '</svg><span>' + t[0] + '</span></a>';
    }).join('');
    nav.querySelector('[data-ve-menu]').addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var b = document.getElementById('ve-burger');
      // After this tap has finished, so the menu's own tap-outside-to-close does not shut it again at once.
      if (b) { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(function () { b.click(); }, 0); } else location.href = '/directory';
    });
    document.body.appendChild(nav); document.body.classList.add('ve-has-tabbar');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addBar); else addBar();

  window.VEAppShell = { view: view, close: close, standalone: standalone };
})();
