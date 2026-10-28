/* Minimize the Guide (Sean, 2026-10-28: "if I'm using this tool, I don't want to see River on the right-hand side... a hide
 * button... then he just becomes like a little icon of his thumbnail. And then when you click it, it opens up and pushes...
 * everything to the left"). Every Guide page with the rail layout (#dgApp, #dgRail, #dgFold) loads this after its own script.
 *
 * The page's own Hide / Show button (#dgFold, which sets .dg-folded on the rail and remembers it for the visit) stays the one
 * switch. On desktop a folded rail shrinks to a round thumbnail of the Guide (data-guide on the rail, VEGuideArt from
 * footer.js) and the content takes the width; the thumbnail opens it again. Phones keep the page's own Hide / Show. */
(function () {
  var app = document.getElementById('dgApp'), rail = document.getElementById('dgRail'), fold = document.getElementById('dgFold');
  if (!app || !rail || !fold) return;
  var slug = rail.getAttribute('data-guide') || 'liz';
  var name = slug.charAt(0).toUpperCase() + slug.slice(1);
  var pic = window.VEGuideArt ? VEGuideArt(slug, 'square') : '';

  var css = '@media (min-width:901px){' +
    '.dg-app{transition:grid-template-columns .3s ease;}' +
    '.dg-fold{display:inline-flex !important;}' +
    '.dg-app.dg-min{grid-template-columns:minmax(0,1fr) 72px !important;}' +
    '.dg-app.dg-min .dg-rail>*:not(.dg-mini){display:none !important;}' +
    '.dg-app.dg-min .dg-mini{display:flex;}}' +
    '@media (prefers-reduced-motion:reduce){.dg-app{transition:none;}}' +
    '.dg-mini{display:none;flex-direction:column;align-items:center;gap:6px;position:sticky;top:calc(var(--ve-nav-h,64px) + 16px);font-family:inherit;' +
    'background:none;border:0;padding:0;cursor:pointer;color:var(--ink75,#444);}' +
    '.dg-mini i{display:block;width:60px;height:60px;border-radius:50%;background:#f3f6f3 center 18%/cover no-repeat;border:3px solid var(--g,#1f5f22);' +
    'box-shadow:0 4px 12px rgba(0,0,0,.18);transition:transform .15s;}' +
    '.dg-mini:hover i{transform:scale(1.06);}' +
    '.dg-mini span{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;}' +
    '.dg-mini:focus-visible{outline:3px solid #F69820;outline-offset:4px;border-radius:8px;}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var mini = document.createElement('button');
  mini.type = 'button'; mini.className = 'dg-mini';
  mini.setAttribute('aria-label', 'Show ' + name + ', your Guide');
  mini.innerHTML = '<i style="background-image:url(\'' + pic + '\')"></i><span>Show ' + name + '</span>';
  rail.insertBefore(mini, rail.firstChild);
  mini.addEventListener('click', function () { fold.click(); });

  function sync() {
    var on = rail.classList.contains('dg-folded');
    app.classList.toggle('dg-min', on);
    // Folding him away stops him talking.
    if (on) [].forEach.call(rail.querySelectorAll('video,audio'), function (m) { try { m.pause(); } catch (e) {} });
  }
  new MutationObserver(sync).observe(rail, { attributes: true, attributeFilter: ['class'] });
  sync();
})();
