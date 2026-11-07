/* Add Vegans Explore to your home screen (playbook ve-mobile-app, step D, 2026-11-07).
 * Loaded by /public/nav.js on phones and tablets. Polite by design:
 *  - never on a first visit: only from the 3rd page a visitor opens (localStorage ve_pwa_views);
 *  - never again for 30 days after Not now (ve_pwa_dismissed), never once it is installed or opened from the home screen;
 *  - never on a form or checkout (the survey, claim, sign-in, invitations, BrandDesk sign-up), never in a frame.
 * Android and Chrome: the browser's own install window (beforeinstallprompt). iPhone and iPad: how to do it from Share.
 * Google Analytics events: install_prompt_shown, install_prompt_accepted, install_prompt_dismissed, app_installed.
 * Open it any time with VEInstall.show() (or ?install=1 on any page). */
(function () {
  if (window.VEInstall) return;
  var LS = window.localStorage, KEY_V = 've_pwa_views', KEY_D = 've_pwa_dismissed', DAYS = 30, AFTER = 3;
  var deferred = null, shown = false;
  function get(k) { try { return LS.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { LS.setItem(k, v); } catch (e) {} }
  function ga(name, extra) { try { if (window.gtag) window.gtag('event', name, Object.assign({ platform: ios ? 'ios' : 'android' }, extra || {})); } catch (e) {} }

  var ua = navigator.userAgent || '';
  var ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var inApp = /FBAN|FBAV|Instagram|Line\/|TikTok|Snapchat|LinkedInApp/i.test(ua);
  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  var framed = false; try { framed = window.self !== window.top; } catch (e) { framed = true; }
  var forced = /[?&]install=1\b/.test(location.search);
  var BLOCK = /^\/(admin|survey|claim|login|auth|invite|business\/(managed|challenge|holiday-menu|checkin|campaign|social|shoot|agreement)|account|messages|pulse-preferences)(\/|$)/;

  if (standalone) set(KEY_D, 'installed');
  var views = (parseInt(get(KEY_V), 10) || 0) + 1; set(KEY_V, String(views));

  function eligible() {
    if (forced) return true;
    if (standalone || framed || inApp || !touch || BLOCK.test(location.pathname)) return false;
    var d = get(KEY_D);
    if (d === 'installed') return false;
    if (d && Date.now() - Number(d) < DAYS * 864e5) return false;
    return views >= AFTER;
  }

  var CSS = '#ve-inst{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:10050;max-width:460px;margin:0 auto;' +
    'background:#fff;color:#1A1A1A;border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,.28);padding:16px 16px 14px;font-family:Montserrat,system-ui,sans-serif;' +
    'transform:translateY(130%);transition:transform .35s ease}' +
    '#ve-inst.on{transform:none}' +
    '#ve-inst .vi-row{display:flex;gap:14px;align-items:center}' +
    '#ve-inst img{width:56px;height:56px;border-radius:13px;flex:0 0 56px;box-shadow:0 0 0 1px rgba(0,0,0,.08)}' +
    '#ve-inst h2{font-size:16px;font-weight:800;margin:0 0 3px;line-height:1.25}' +
    '#ve-inst p{font-size:13.5px;line-height:1.45;margin:0;color:rgba(0,0,0,.68)}' +
    '#ve-inst .vi-acts{display:flex;gap:10px;justify-content:flex-end;margin-top:14px}' +
    '#ve-inst button{appearance:none;border:0;border-radius:6px;font:700 14px/1 Montserrat,system-ui,sans-serif;padding:12px 16px;cursor:pointer}' +
    '#ve-inst .vi-no{background:transparent;color:rgba(0,0,0,.7)}' +
    '#ve-inst .vi-yes{background:#2D5C27;color:#fff}' +
    '#ve-inst .vi-steps{margin:12px 0 0;padding:0;list-style:none;font-size:13.5px;line-height:1.5;color:rgba(0,0,0,.78)}' +
    '#ve-inst .vi-steps li{display:flex;gap:8px;align-items:center;margin-top:6px}' +
    '#ve-inst .vi-steps b{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#E8F5E9;color:#2D5C27;font-size:12px;flex:0 0 22px}' +
    '#ve-inst .vi-steps svg{width:18px;height:18px;vertical-align:-3px}';
  var SHARE = '<svg viewBox="0 0 24 24" fill="none" stroke="#1A73E8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Share"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';

  function close(why) {
    var el = document.getElementById('ve-inst'); if (!el) return;
    el.classList.remove('on'); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
    if (why === 'no') { set(KEY_D, String(Date.now())); ga('install_prompt_dismissed'); }
  }

  function draw() {
    if (shown || document.getElementById('ve-inst')) return; shown = true;
    if (!document.getElementById('ve-inst-css')) { var st = document.createElement('style'); st.id = 've-inst-css'; st.textContent = CSS; document.head.appendChild(st); }
    var el = document.createElement('div'); el.id = 've-inst'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Add Vegans Explore to your home screen');
    var manual = ios || !deferred;
    var body = ios
      ? '<ol class="vi-steps"><li><b>1</b><span>Tap Share ' + SHARE + ' at the bottom of Safari</span></li><li><b>2</b><span>Choose <strong>Add to Home Screen</strong></span></li></ol>'
      : (!deferred ? '<ol class="vi-steps"><li><b>1</b><span>Open your browser\'s menu (the three dots)</span></li><li><b>2</b><span>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong></span></li></ol>' : '');
    el.innerHTML = '<div class="vi-row"><img src="/public/app/apple-touch-icon.png" alt=""><div><h2>Add Vegans Explore to your home screen</h2>' +
      '<p>Your city\'s Vegan places, events and the Daily Pulse, one tap away.</p></div></div>' + body +
      '<div class="vi-acts"><button type="button" class="vi-no">Not now</button>' + (manual ? '<button type="button" class="vi-yes vi-ok">Got it</button>' : '<button type="button" class="vi-yes">Add it</button>') + '</div>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('on'); }); });
    ga('install_prompt_shown');
    el.querySelector('.vi-no').onclick = function () { close('no'); };
    el.querySelector('.vi-yes').onclick = function () {
      if (manual) { set(KEY_D, String(Date.now())); ga('install_prompt_accepted'); close(); return; }
      deferred.prompt();
      deferred.userChoice.then(function (r) {
        if (r && r.outcome === 'accepted') { set(KEY_D, 'installed'); ga('install_prompt_accepted'); } else { set(KEY_D, String(Date.now())); ga('install_prompt_dismissed'); }
        deferred = null; close();
      });
    };
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e;
    if (eligible()) setTimeout(draw, 2500);
  });
  window.addEventListener('appinstalled', function () { set(KEY_D, 'installed'); ga('app_installed'); close(); });

  // iPhone and iPad have no install event: show the two steps instead, in Safari only (other iOS browsers vary).
  if (ios && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) && eligible()) setTimeout(draw, 2500);
  // ?install=1 always shows it (for checking and for links we send), with the menu steps if the browser gave no install event.
  else if (forced) setTimeout(function () { if (!shown) draw(); }, 3000);

  window.VEInstall = { show: function () { shown = false; draw(); }, close: close };
})();
