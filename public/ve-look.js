/* ve-look.js: the Color Block look as a switch over the live site (canon canon-ve-look-color-block, LOCKED 2026-11-11).
   Sean wants to walk the whole site in the new look before it goes live. nav.js loads this file only when the look is
   asked for, so a visitor who never asks downloads nothing and sees the site exactly as it is.

   On when any of these is true:
     - the address has ?look=preview (kept in localStorage ve_look=preview, so every page after it stays in the look)
     - localStorage ve_look is 'preview'
     - the path starts with /preview
   ?look=off clears the key (a /preview path stays in the look, since that is what it is for).

   When on: <html> gets class ve-cb plus its section (ve-cb-s-<section>) and page (ve-cb-p-<page>), /public/ve-look.css loads
   (every rule there sits under html.ve-cb), and a small "Preview look" chip sits in the bottom left corner with Turn off. */
(function () {
  if (window.VELook) return;
  var KEY = 've_look';
  var path = location.pathname.replace(/\/+$/, '') || '/';
  var q = null;
  try { q = new URLSearchParams(location.search).get('look'); } catch (e) {}
  var onPreviewPath = /^\/preview(\/|$)/.test(path);
  var on = false;
  if (q === 'off') { try { localStorage.removeItem(KEY); } catch (e) {} }
  else if (q === 'preview') { on = true; try { localStorage.setItem(KEY, 'preview'); } catch (e) {} }
  else { try { on = localStorage.getItem(KEY) === 'preview'; } catch (e) {} }
  if (onPreviewPath) on = true;

  window.VELook = { on: on };
  if (!on) return;

  // Each part of the site wears its own color (Foundations, section colors, LOCKED 2026-11-11).
  function sectionOf(p) {
    if (/^\/(directory|explore|search|claim)(\/|$)/.test(p)) return 'directory';
    if (/^\/events(\/|$)/.test(p)) return 'events';
    if (/^\/(guides|guide|business-guide|nominate)(\/|$)/.test(p)) return 'guides';
    if (/^\/communities(\/|$)/.test(p)) return 'communities';
    if (/^\/pulse(\/|$)/.test(p)) return 'pulse';
    if (/^\/(media|podcast|listen)(\/|$)/.test(p)) return 'media';
    if (/^\/(passport|levels|survey|join|welcome)(\/|$)/.test(p)) return 'passport';
    return 'home';
  }
  function pageOf(p) {
    if (onPreviewPath) return 'preview';
    if (p === '/directory') return 'directory';
    if (/^\/directory\/[^/]+$/.test(p) && p !== '/directory/product') return 'listing';
    if (p === '/events') return 'events';
    if (p === '/guides') return 'guides';
    if (p === '/communities') return 'communities';
    if (/^\/pulse(\/(jobs|classifieds|fosters|rescues|suggest))?$/.test(p)) return 'pulse';
    if (p === '/media') return 'media';
    if (p === '/passport') return 'passport';
    return 'other';
  }
  var de = document.documentElement;
  de.classList.add('ve-cb', 've-cb-s-' + sectionOf(path), 've-cb-p-' + pageOf(path));

  var head = document.head || de;
  if (!document.getElementById('ve-look-css')) {
    var l = document.createElement('link');
    l.id = 've-look-css'; l.rel = 'stylesheet'; l.href = '/public/ve-look.css?v=1';
    l.setAttribute('blocking', 'render');
    head.appendChild(l);
  }

  // The chip: small, in the bottom left corner, so the viewer always knows this is the preview and can leave it.
  function chip() {
    if (document.getElementById('ve-look-chip') || !document.body) return;
    var off = onPreviewPath ? '/?look=off' : (function () {
      try { var u = new URL(location.href); u.searchParams.set('look', 'off'); return u.pathname + u.search + u.hash; } catch (e) { return '?look=off'; }
    })();
    var c = document.createElement('div');
    c.id = 've-look-chip';
    c.setAttribute('role', 'note');
    c.innerHTML = '<span class="vlc-dot" aria-hidden="true"></span><span class="vlc-t">Preview look</span><a class="vlc-off" href="' + off + '">Turn off</a>';
    document.body.appendChild(c);
    lift();
    var t = 0;
    function soon() { if (!t) t = setTimeout(function () { t = 0; lift(); }, 120); }
    window.addEventListener('scroll', soon, { passive: true });
    window.addEventListener('resize', soon);
    setTimeout(lift, 1500); setTimeout(lift, 4000);
  }
  // A page's own fixed bar along the bottom (the listing's Order and Call bar on phones) keeps its buttons: the chip sits above it.
  function lift() {
    var c = document.getElementById('ve-look-chip'); if (!c) return;
    var h = window.innerHeight, cw = c.getBoundingClientRect().width + 12, up = 0;
    var all = document.body.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i]; if (el === c || c.contains(el)) continue;
      var cs = getComputedStyle(el); if (cs.position !== 'fixed' || cs.visibility === 'hidden' || cs.display === 'none') continue;
      var r = el.getBoundingClientRect();
      if (r.height < 1 || r.width < 1 || r.left > cw || r.bottom < h - 4 || r.top < h * 0.5) continue;
      up = Math.max(up, h - r.top);
    }
    c.style.bottom = (12 + up) + 'px';
  }
  if (document.body) chip(); else document.addEventListener('DOMContentLoaded', chip);
})();
