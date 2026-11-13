/* ve-look.js: the Color Block look (canon canon-ve-look-color-block, LOCKED 2026-11-11), LIVE for everyone since 2026-11-11
   (Sean: "I'm ready for it to go live"). nav.js loads it on every Vegans Explore page. <html> gets class ve-cb plus its section
   (ve-cb-s-<section>) and page (ve-cb-p-<page>), and /public/ve-look.css loads (every rule there sits under html.ve-cb).
   Rollback for one browser while checking something: ?look=off (kept in localStorage ve_look=off); ?look=on clears it. */
(function () {
  if (window.VELook) return;
  var KEY = 've_look';
  var path = location.pathname.replace(/\/+$/, '') || '/';
  var q = null;
  try { q = new URLSearchParams(location.search).get('look'); } catch (e) {}
  var on = true;
  if (q === 'off') { try { localStorage.setItem(KEY, 'off'); } catch (e) {} on = false; }
  else if (q === 'on' || q === 'preview') { try { localStorage.removeItem(KEY); } catch (e) {} }
  else { try { on = localStorage.getItem(KEY) !== 'off'; } catch (e) {} }
  var onPreviewPath = false;

  window.VELook = { on: on };
  if (!on) return;

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
    if (p === '/') return 'home';
    if (p === '/directory' || p === '/directory-preview') return document.querySelector('meta[name="ve-directory"][content="doors"]') ? 'doors' : 'directory';
    if (/^\/directory\/[^/]+$/.test(p) && p !== '/directory/product') return 'listing';
    if (/^\/certified(\.html)?$/.test(p)) return 'listing'; // the certified page wears the listing page's header (the same classes)
    if (p === '/events') return 'events';
    if (p === '/guides') return 'guides';
    if (p === '/communities') return 'communities';
    if (/^\/pulse(\/(jobs|classifieds|fosters|rescues|suggest))?$/.test(p)) return 'pulse';
    if (p === '/media') return 'media';
    if (p === '/passport') return 'passport';
    if (p === '/nominate' || p === '/nominate/interview') return 'nominate';
    return 'other';
  }
  var de = document.documentElement;
  de.classList.add('ve-cb', 've-cb-s-' + sectionOf(path), 've-cb-p-' + pageOf(path));

  var head = document.head || de;
  if (!document.getElementById('ve-look-css')) {
    var l = document.createElement('link');
    l.id = 've-look-css'; l.rel = 'stylesheet'; l.href = '/public/ve-look.css?v=9';
    l.setAttribute('blocking', 'render');
    head.appendChild(l);
  }

})();
