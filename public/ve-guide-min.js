/* Minimize the Guide (Sean, 2026-10-28). Every Guide page with the rail layout (#dgApp, #dgRail, #dgFold) loads this after its
 * own script.
 *
 * The page's own Hide / Show button (#dgFold, which sets .dg-folded on the rail and remembers it for the visit) stays the one
 * switch. This moves it under the rail's Back / N of M / Next as one full-width "Hide me" button, and, once folded, takes the rail
 * away entirely so the content has the whole width: the Guide floats as a rounded square in the bottom right corner of the screen,
 * "Show me" (Sean: "it just overlaps... not in its own column... say show me, hide me... if the name's long, it's going to throw
 * it off"). The same on desktop and phones. The picture is the rail's data-guide through VEGuideArt (footer.js). */
(function () {
  var app = document.getElementById('dgApp'), rail = document.getElementById('dgRail'), fold = document.getElementById('dgFold');
  if (!app || !rail || !fold) return;
  var slug = rail.getAttribute('data-guide') || 'liz';
  var name = slug.charAt(0).toUpperCase() + slug.slice(1);
  var pic = window.VEGuideArt ? VEGuideArt(slug, 'square') : '';

  var css =
    '.dg-rail .dg-fold.dg-fold-me{display:flex !important;width:100%;justify-content:center;padding:11px 14px;margin-top:2px;}' +
    '.dg-app.dg-min{grid-template-columns:minmax(0,1fr) !important;}' +
    '.dg-app.dg-min .dg-rail{display:none !important;}' +
    '.dg-mini{display:none;position:fixed;right:16px;bottom:16px;z-index:900;width:84px;padding:0;border:0;border-radius:12px;overflow:hidden;' +
    'background:#fff;box-shadow:0 6px 20px rgba(0,0,0,.25);cursor:pointer;font-family:inherit;flex-direction:column;}' +
    'html.dg-min-on .dg-mini{display:flex;}' +
    '.dg-mini i{display:block;width:84px;height:84px;background:#f3f6f3 center 18%/cover no-repeat;transition:transform .15s;}' +
    '.dg-mini:hover i{transform:scale(1.05);}' +
    '.dg-mini span{display:block;background:var(--g,#1f5f22);color:#fff;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:5px 0;text-align:center;}' +
    '.dg-mini:focus-visible{outline:3px solid #F69820;outline-offset:3px;}' +
    '@media (max-width:480px){.dg-mini{width:72px;right:12px;bottom:12px;}.dg-mini i{width:72px;height:72px;}}' +
    '@media print{.dg-mini{display:none !important;}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // Hide me goes under Back / N of M / Next, one row across the rail.
  fold.classList.add('dg-fold-me');
  rail.appendChild(fold);

  var mini = document.createElement('button');
  mini.type = 'button'; mini.className = 'dg-mini';
  mini.setAttribute('aria-label', 'Show ' + name + ', your Guide');
  mini.innerHTML = '<i style="background-image:url(\'' + pic + '\')"></i><span>Show me</span>';
  document.body.appendChild(mini);
  mini.addEventListener('click', function () { fold.click(); });

  function sync() {
    var on = rail.classList.contains('dg-folded');
    app.classList.toggle('dg-min', on);
    document.documentElement.classList.toggle('dg-min-on', on);
    // The page's script names the Guide on the button; this one says me, so a long name never breaks the row.
    if (fold.textContent !== (on ? 'Show me' : 'Hide me')) fold.textContent = on ? 'Show me' : 'Hide me';
    fold.setAttribute('aria-label', (on ? 'Show ' : 'Hide ') + name + ', your Guide');
    // Folding the Guide away stops them talking.
    if (on) [].forEach.call(rail.querySelectorAll('video,audio'), function (m) { try { m.pause(); } catch (e) {} });
  }
  new MutationObserver(sync).observe(rail, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(function () { if (!/^(Show|Hide) me$/.test(fold.textContent)) sync(); }).observe(fold, { childList: true, characterData: true, subtree: true });
  sync();

  // Keep the Guide hidden (Sean, 2026-11-12: "I want the guides default to be hidden, because I only need the guides when I need it... maybe
  // there's a way that people can set this as an option"). Hide me / Show me is now remembered on this device for every Guide page and
  // every visit (ve_guide_hidden), not just the visit. A member whose account says so (member_hidden_modules 'guide-rail', which comes
  // with their session as hidden_modules) starts hidden on any device until they press Show me. Everyone else still meets their Guide.
  var KEY = 've_guide_hidden', auto = false;
  function device() { try { var v = localStorage.getItem(KEY); return v === '1' ? true : v === '0' ? false : null; } catch (e) { return null; } }
  function account() {
    try { var m = window.VEAuth && VEAuth.getRealMember && VEAuth.getRealMember(); return !!(m && (m.hidden_modules || []).indexOf('guide-rail') !== -1); }
    catch (e) { return false; }
  }
  fold.addEventListener('click', function () {
    if (auto) return;
    setTimeout(function () { try { localStorage.setItem(KEY, rail.classList.contains('dg-folded') ? '1' : '0'); } catch (e) {} }, 0);
  });
  // The saved choice wins both ways, over a page's own per-visit memory too (shown on one Guide page means shown on the next).
  function apply() {
    var dev = device(), want = dev === null ? account() : dev, folded = rail.classList.contains('dg-folded');
    if (want === folded || (!want && dev === null)) return;
    auto = true; try { fold.click(); } finally { auto = false; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(apply, 0); });
  else setTimeout(apply, 0);
})();
