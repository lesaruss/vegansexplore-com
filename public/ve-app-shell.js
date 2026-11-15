/* The site as an app (Sean, 2026-11-15: "I clicked to get an image... It came up full screen so I can save it to my library. And then I
 * didn't have a way of going back because I don't have navigation because it's a web app. So we need to make sure that the site is set
 * up for web apps"). Loaded by /public/nav.js on every page.
 *  - Opened from the home screen (display-mode standalone) there is no browser bar, so the top bar gets a Back button on every page but
 *    the homepage (history back, or home when there is nothing to go back to).
 *  - A link to a picture or a PDF on our sites never opens as a bare page there: it opens in a viewer over the page with Close (and, for a
 *    picture, "press and hold to save"). Only in the app: in a browser, Back works and pages keep their own viewers.
 *  - "Get the app" in the phone menu (data-ve-install) opens the Add to home screen steps (VEInstall.show, /public/ve-install.js). */
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

  window.VEAppShell = { view: view, close: close, standalone: standalone };
})();
