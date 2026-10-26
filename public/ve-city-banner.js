/* ve-city-banner.js: the city banner every browse page shares (Sean, 2026-10-26: "the header to be similar
   to the directory where they can immediately select and collapse as well. That should be a feature for all
   the banners"). The Directory's banner, made one component: the chosen city's art (New York for all
   cities), a city picker from VE_HUBS (/public/ve-hubs.js, load it first), Visit the community, and
   Collapse / Expand, which folds it to one bar that keeps the picker. ?city=<hub slug> carries the choice.

   Usage:
     <section id="my-banner"></section>
     var banner = VECityBanner.mount('my-banner', {
       key: 'events',                 // remembers Collapse / Expand for the visit (sessionStorage ve_<key>_hero)
       title: 'Vegan Events',         // the big line; the city name (or allLabel) goes under it
       sub: 'One line about the page.',
       allTitle: 'Every City', allLabel: 'All cities',
       onChange: function (slug, hub) {},  // runs at mount and on every pick ('' is all cities)
       action: { label: 'Submit an event', onClick: function () {} }   // optional: the page's own button, beside View community
     });
     banner.autoFold();   // call on the first click into the page's content: folds unless the visitor chose
     banner.set('atlanta'); banner.setQuiet('atlanta'); banner.current(); banner.hub(); banner.matches(hub, {city, state});
   Options for the dashboard: initial (the city when the address bar has none) and param: false (leave the address bar alone).
*/
(function () {
  if (window.VECityBanner) return;

  var ART = { philadelphia: 'banner.png', dmv: 'banner.png' };
  var MOBILE_ART = { 'new-york': 'hero-mobile.jpg', london: 'hero-mobile.jpg' };
  var CHEVRON = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23ffffff' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E\")";

  var css = [
    // A 24px gap under the menu on every page that wears it (Sean, 2026-10-26); the dashboard's inset banner sets its own.
    '.vcb{margin-top:24px;position:relative;min-height:440px;display:flex;align-items:center;background:#0d0d0d center / cover no-repeat;transition:background-image .4s;font-family:Montserrat,sans-serif;}',
    // Hero legibility pattern (LOCKED 2026-05-18), Option A on desktop.
    '.vcb::before{content:"";position:absolute;inset:0;background:linear-gradient(to right,rgba(0,0,0,.99) 0%,rgba(0,0,0,.95) 28%,rgba(0,0,0,.72) 52%,rgba(0,0,0,.28) 68%,transparent 84%);}',
    '.vcb::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.45) 0%,transparent 32%);}',
    '.vcb-inner{position:relative;z-index:1;padding:56px 40px;max-width:680px;}',
    '.vcb-eyebrow{font-size:10px;font-weight:800;letter-spacing:.32em;text-transform:uppercase;color:#3A9B3E;margin-bottom:16px;display:flex;align-items:center;gap:10px;}',
    '.vcb-eyebrow::before{content:"";width:20px;height:2px;background:#3A9B3E;}',
    '.vcb h1{font-size:clamp(36px,5.5vw,68px);font-weight:900;line-height:.96;letter-spacing:-.03em;text-transform:uppercase;color:#fff;margin:0 0 18px;text-shadow:0 2px 14px rgba(0,0,0,.6);}',
    '.vcb h1 em{display:block;color:#6fd98c;font-style:normal;}',
    '.vcb-sub{font-size:16px;line-height:1.6;color:rgba(255,255,255,.9);max-width:520px;margin:0;}',
    '.vcb-pick{display:flex;align-items:center;gap:12px;margin-top:26px;flex-wrap:wrap;}',
    // No City label beside the picker (Sean, 2026-10-26: it pushed the picker out on phones); the picker sits flush left
    // under the title. Screen readers still hear "City".
    '.vcb-pick label{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;}',
    // Dropdowns never show the browser's arrow (canon rule 15): our chevron, 16px from the edge.
    '.vcb-pick select{appearance:none;-webkit-appearance:none;-moz-appearance:none;font-family:inherit;font-size:13px;font-weight:800;color:#fff;background:rgba(0,0,0,.55) ' + CHEVRON + ' no-repeat right 16px center;border:1.5px solid rgba(255,255,255,.5);border-radius:6px;padding:11px 44px 11px 16px;cursor:pointer;min-width:220px;}',
    '.vcb-pick select::-ms-expand{display:none;}',
    '.vcb-pick select option{color:#1a1a1a;}',
    // The buttons (Sean, 2026-10-26: View community was a text link; "my goal was to have it be a button"): View community
    // (the picked city's hub, or every community), the page's own action (Submit an event) and Expand / Collapse.
    '.vcb-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;}',
    '.vcb-btn{display:inline-flex;align-items:center;justify-content:center;font-family:inherit;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#fff;background:rgba(0,0,0,.35);border:1.5px solid rgba(255,255,255,.5);border-radius:6px;padding:10px 16px;cursor:pointer;text-decoration:none;white-space:nowrap;}',
    '.vcb-btn:hover{border-color:#fff;background:rgba(0,0,0,.55);}',
    '.vcb-btn-go{background:#2d7d31;border-color:#2d7d31;}',
    '.vcb-btn-go:hover{background:#1f5f22;border-color:#1f5f22;}',
    '.vcb :focus-visible{outline:3px solid #F69820;outline-offset:3px;}',
    '.vcb.is-collapsed{min-height:0;}',
    '.vcb.is-collapsed::before{background:rgba(0,0,0,.78);}',
    '.vcb.is-collapsed::after{display:none;}',
    // Folded (Sean, 2026-10-26): three rows and two columns, the right one about a quarter. Left: the title, the chapter
    // under it, then City and its picker. Right, the same height: View community, the page's action, Expand.
    '.vcb.is-collapsed .vcb-inner{display:grid;grid-template-columns:minmax(0,3fr) minmax(150px,1fr);gap:16px 24px;align-items:stretch;max-width:none;width:100%;padding:18px 40px;margin:0;background:none;border:0;backdrop-filter:none;-webkit-backdrop-filter:none;border-radius:0;}',
    '.vcb.is-collapsed .vcb-main{display:flex;flex-direction:column;justify-content:space-between;gap:8px;min-width:0;}',
    '.vcb.is-collapsed .vcb-eyebrow,.vcb.is-collapsed .vcb-sub{display:none;}',
    '.vcb.is-collapsed h1{font-size:22px;line-height:1.15;margin:0;letter-spacing:-.01em;}',
    '.vcb.is-collapsed h1 em{display:block;font-size:17px;margin-top:4px;}',
    // Folded, the title stays on one line and shrinks to fit instead (Sean, 2026-10-26: two rows made the buttons taller on phones).
    '.vcb.is-collapsed .vcb-t{display:block;white-space:nowrap;}',
    '.vcb.is-collapsed .vcb-pick{margin-top:0;flex-wrap:nowrap;}',
    '.vcb.is-collapsed .vcb-pick select{padding:9px 44px 9px 14px;}',
    '.vcb.is-collapsed .vcb-actions{display:grid;grid-auto-rows:1fr;gap:8px;margin:0;}',
    '.vcb.is-collapsed .vcb-btn{width:100%;padding:8px 10px;display:flex;align-items:center;justify-content:center;}',
    // Option B on phones: flat scrim and a frosted card.
    '@media (max-width:900px){.vcb{align-items:flex-end;min-height:520px;background-position:center center;}.vcb::before{background:rgba(0,0,0,.32);}.vcb::after{display:none;}.vcb-inner{background:rgba(0,0,0,.58);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-radius:8px;margin:0 24px 32px;padding:32px 28px;max-width:calc(100% - 48px);border:1px solid rgba(255,255,255,.09);}}',
    '@media (max-width:480px){.vcb-inner{background:rgba(0,0,0,.62);margin:0 16px 24px;padding:28px 24px;max-width:calc(100% - 32px);border:1px solid rgba(255,255,255,.10);}.vcb-pick select{min-width:0;width:100%;}.vcb.is-collapsed .vcb-inner{padding:14px 16px;grid-template-columns:minmax(0,1fr) minmax(118px,36%);gap:12px 22px;}.vcb.is-collapsed h1{font-size:18px;}.vcb.is-collapsed h1 em{font-size:15px;}.vcb.is-collapsed .vcb-pick select{flex:1 1 100%;width:100%;}.vcb.is-collapsed .vcb-btn{font-size:10px;letter-spacing:.06em;white-space:normal;text-align:center;}.vcb-actions .vcb-btn{flex:1 1 auto;}}'
  ].join('');

  function injectCss() {
    if (document.getElementById('vcb-css')) return;
    var s = document.createElement('style'); s.id = 'vcb-css'; s.textContent = css;
    document.head.appendChild(s);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function hubs() { return window.VE_HUBS || []; }
  function hubBySlug(slug) { return hubs().filter(function (h) { return h.slug === slug; })[0] || null; }

  // Is a place (an event's or a listing's city and state) in this hub? Its Directory rule, or one of its event cities.
  function matches(hub, place) {
    if (!hub) return true;
    var city = place.city || '', state = (place.state || '').toUpperCase();
    if (hub.page && hub.page.eventCities && hub.page.eventCities.indexOf(city) > -1) return true;
    var m = hub.match || {};
    if (!m.cities && !m.states) return false;
    if (m.cities && m.cities.indexOf(city) < 0) return false;
    if (m.states && m.states.indexOf(state) < 0) return false;
    return true;
  }

  function mount(target, opts) {
    opts = opts || {};
    injectCss();
    var el = typeof target === 'string' ? document.getElementById(target) : target;
    var id = el.id || ('vcb-' + (opts.key || 'banner'));
    el.id = id;
    el.classList.add('vcb');
    el.setAttribute('aria-labelledby', id + '-h');
    el.innerHTML =
      '<div class="vcb-inner"><div class="vcb-main">' +
        '<div class="vcb-eyebrow">' + esc(opts.eyebrow || 'Vegans Explore') + '</div>' +
        '<h1 id="' + id + '-h"><span class="vcb-t">' + esc(opts.title || '') + '</span> <em data-vcb-city>' + esc(opts.allTitle || 'Every City') + '</em></h1>' +
        (opts.sub ? '<p class="vcb-sub">' + esc(opts.sub) + '</p>' : '') +
        '<div class="vcb-pick">' +
          '<label for="' + id + '-city">City</label>' +
          '<select id="' + id + '-city"><option value="">' + esc(opts.allLabel || 'All cities') + '</option>' +
            hubs().map(function (h) { return '<option value="' + esc(h.slug) + '">' + esc(h.name) + '</option>'; }).join('') +
          '</select>' +
        '</div></div>' +
        '<div class="vcb-actions">' +
          (opts.hubLink === false ? '' : '<a class="vcb-btn" data-vcb-link href="/communities">View communities</a>') +
          (opts.action ? '<button type="button" class="vcb-btn vcb-btn-go" data-vcb-action>' + esc(opts.action.label) + '</button>' : '') +
          '<button type="button" class="vcb-btn vcb-toggle" aria-controls="' + id + '" aria-expanded="true">Collapse</button>' +
        '</div>' +
      '</div>';

    var select = el.querySelector('select'), cityEl = el.querySelector('[data-vcb-city]');
    var link = el.querySelector('[data-vcb-link]'), toggle = el.querySelector('.vcb-toggle');
    var mobile = window.matchMedia('(max-width: 900px)');
    var param = opts.param === false ? null : (opts.param || 'city'), storeKey = 've_' + (opts.key || 'banner') + '_hero';
    var current = '', chosen = null;

    function art(slug) {
      if (mobile.matches && MOBILE_ART[slug]) return '/communities/' + slug + '/' + MOBILE_ART[slug];
      return '/communities/' + slug + '/' + (ART[slug] || 'banner.jpg');
    }
    function paint() { el.style.backgroundImage = "url('" + art(current || 'new-york') + "')"; }
    function show(slug, quiet) {
      var hub = hubBySlug(slug);
      current = hub ? hub.slug : '';
      select.value = current;
      cityEl.textContent = hub ? hub.name : (opts.allTitle || 'Every City');
      paint();
      // A city opens its hub; All cities opens every community.
      if (link) { link.href = hub ? '/communities/' + hub.slug : '/communities'; link.textContent = hub ? 'View community' : 'View communities'; }
      if (opts.onChange && !quiet) opts.onChange(current, hub);
    }
    function fromUrl() { return param ? new URLSearchParams(location.search).get(param) || '' : current; }

    select.addEventListener('change', function () {
      if (!param) { show(select.value); return; }
      var q = new URLSearchParams(location.search);
      if (select.value) q.set(param, select.value); else q.delete(param);
      var s = q.toString();
      history.pushState({ city: select.value }, '', location.pathname + (s ? '?' + s : '') + location.hash);
      show(select.value);
    });
    window.addEventListener('popstate', function () { if (param && fromUrl() !== current) show(fromUrl()); });
    if (mobile.addEventListener) mobile.addEventListener('change', paint);

    // Expanded on landing; autoFold() folds it on the first click into the page, unless the visitor chose with the button.
    // Folded, shrink the title until it fits its column on one line (fitTitle), never below 12px.
    var title = el.querySelector('.vcb-t');
    function fitTitle() {
      if (!title) return;
      title.style.fontSize = '';
      if (!el.classList.contains('is-collapsed')) return;
      var size = parseFloat(getComputedStyle(title).fontSize) || 18;
      while (title.scrollWidth > title.clientWidth + 1 && size > 12) { size -= 0.5; title.style.fontSize = size + 'px'; }
    }
    if (window.ResizeObserver) new ResizeObserver(function () { fitTitle(); }).observe(el); else window.addEventListener('resize', fitTitle);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);
    function fold(on) { el.classList.toggle('is-collapsed', on); fitTitle(); toggle.textContent = on ? 'Expand' : 'Collapse'; toggle.setAttribute('aria-expanded', on ? 'false' : 'true'); }
    try { chosen = sessionStorage.getItem(storeKey); } catch (e) {}
    toggle.addEventListener('click', function () {
      var on = !el.classList.contains('is-collapsed'); fold(on);
      chosen = on ? 'collapsed' : 'expanded'; try { sessionStorage.setItem(storeKey, chosen); } catch (e) {}
    });
    if (chosen) fold(chosen === 'collapsed');
    var actionBtn = el.querySelector('[data-vcb-action]');
    if (actionBtn) actionBtn.addEventListener('click', function () { if (!chosen) fold(true); opts.action.onClick(); });

    var api = {
      el: el,
      set: function (slug) { show(slug); },
      setQuiet: function (slug) { show(slug, true); },
      current: function () { return current; },
      hub: function () { return hubBySlug(current); },
      fold: fold,
      autoFold: function () { if (!chosen) fold(true); },
      matches: matches
    };
    show((param && new URLSearchParams(location.search).get(param)) || opts.initial || '');
    return api;
  }

  window.VECityBanner = { mount: mount, matches: matches, hubBySlug: hubBySlug };
})();
