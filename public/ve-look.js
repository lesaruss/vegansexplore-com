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

  /* The Directory's seven doors (Sean, 2026-11-11: "I want to apply what they recommended... I'm fine with where we landed on that";
     BOSS docs/proposals/2026-11-11-directory-navigation-boss.md). While the look is on, /directory opens the doors build
     (directory-preview/index.html) with everything in its address (?tab= &sub= &city= &q= and the filters), and that page writes
     /directory back into the address before anything reads it, so the address bar, Back, reload and Share all stay on /directory.
     Every link into the Directory (the menu, a listing's breadcrumb, a city hub's Directory links, old ?tab= links) lands on the
     doors this way, with no live markup changed. With the look off this file never loads, so /directory is exactly today's page.
     Only /directory itself: a listing (/directory/<slug>) is untouched. It stops by itself on a page that already is the doors
     (<meta name="ve-directory" content="doors">).

     GO-LIVE, either one is enough:
       1. The doors alone, any time:  git mv -f directory-preview/index.html directory/index.html
          That is the whole step. The doors file already carries the live Directory's title, canonical and share tags; the
          preview's noindex is a header in vercel.json (on /directory-preview only), so nothing wrong travels with the file; this
          block then never fires (the meta is on /directory). Tidy later: delete this block and that vercel.json header.
       2. With the look: flip its default (on = true above). The doors come with it through this block, one extra page load per
          visit to /directory, so do step 1 at the same time or soon after. */
  if (path === '/directory' && !document.querySelector('meta[name="ve-directory"][content="doors"]')) {
    document.documentElement.style.visibility = 'hidden';
    location.replace('/directory-preview' + (location.search ? location.search + '&' : '?') + 'as=directory' + location.hash);
    return;
  }

  // Each part of the site wears its own color (Foundations, section colors, LOCKED 2026-11-11).
  function sectionOf(p) {
    if (/^\/(directory|directory-preview|explore|search|claim)(\/|$)/.test(p)) return 'directory';
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
    if (p === '/directory' || p === '/directory-preview') return document.querySelector('meta[name="ve-directory"][content="doors"]') ? 'doors' : 'directory';
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
