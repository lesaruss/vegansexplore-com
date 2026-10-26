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
       onChange: function (slug, hub) {}   // runs at mount and on every pick ('' is all cities)
     });
     banner.autoFold();   // call on the first click into the page's content: folds unless the visitor chose
     banner.set('atlanta'); banner.current(); banner.hub(); banner.matches(hub, {city, state});
*/
(function () {
  if (window.VECityBanner) return;

  var ART = { philadelphia: 'banner.png', dmv: 'banner.png' };
  var MOBILE_ART = { 'new-york': 'hero-mobile.jpg', london: 'hero-mobile.jpg' };
  var CHEVRON = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23ffffff' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E\")";

  var css = [
    '.vcb{position:relative;min-height:440px;display:flex;align-items:center;background:#0d0d0d center / cover no-repeat;transition:background-image .4s;font-family:Montserrat,sans-serif;}',
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
    '.vcb-pick label{font-size:10px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.75);}',
    // Dropdowns never show the browser's arrow (canon rule 15): our chevron, 16px from the edge.
    '.vcb-pick select{appearance:none;-webkit-appearance:none;-moz-appearance:none;font-family:inherit;font-size:13px;font-weight:800;color:#fff;background:rgba(0,0,0,.55) ' + CHEVRON + ' no-repeat right 16px center;border:1.5px solid rgba(255,255,255,.5);border-radius:6px;padding:11px 44px 11px 16px;cursor:pointer;min-width:220px;}',
    '.vcb-pick select::-ms-expand{display:none;}',
    '.vcb-pick select option{color:#1a1a1a;}',
    '.vcb-link{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#fff;text-decoration:none;border-bottom:2px solid #3A9B3E;padding-bottom:2px;}',
    '.vcb-link[hidden]{display:none;}',
    '.vcb-toggle{font-family:inherit;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#fff;background:transparent;border:1.5px solid rgba(255,255,255,.5);border-radius:6px;padding:9px 14px;cursor:pointer;}',
    '.vcb-toggle:hover{border-color:#fff;}',
    '.vcb :focus-visible{outline:3px solid #F69820;outline-offset:3px;}',
    '.vcb.is-collapsed{min-height:0;}',
    '.vcb.is-collapsed::before{background:rgba(0,0,0,.78);}',
    '.vcb.is-collapsed::after{display:none;}',
    '.vcb.is-collapsed .vcb-inner{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 24px;max-width:none;width:100%;padding:14px 40px;margin:0;background:none;border:0;backdrop-filter:none;-webkit-backdrop-filter:none;border-radius:0;}',
    '.vcb.is-collapsed .vcb-eyebrow,.vcb.is-collapsed .vcb-sub{display:none;}',
    '.vcb.is-collapsed h1{font-size:20px;line-height:1.2;margin:0;letter-spacing:-.01em;}',
    '.vcb.is-collapsed h1 em{display:inline;margin-left:8px;}',
    '.vcb.is-collapsed .vcb-pick{margin-top:0;}',
    '.vcb.is-collapsed .vcb-pick select{padding:9px 44px 9px 14px;}',
    // Option B on phones: flat scrim and a frosted card.
    '@media (max-width:900px){.vcb{align-items:flex-end;min-height:520px;background-position:center center;}.vcb::before{background:rgba(0,0,0,.32);}.vcb::after{display:none;}.vcb-inner{background:rgba(0,0,0,.58);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-radius:8px;margin:0 24px 32px;padding:32px 28px;max-width:calc(100% - 48px);border:1px solid rgba(255,255,255,.09);}}',
    '@media (max-width:480px){.vcb-inner{background:rgba(0,0,0,.62);margin:0 16px 24px;padding:28px 24px;max-width:calc(100% - 32px);border:1px solid rgba(255,255,255,.10);}.vcb-pick select{min-width:0;width:100%;}.vcb.is-collapsed .vcb-inner{padding:12px 16px;}.vcb.is-collapsed .vcb-pick{width:100%;}.vcb.is-collapsed .vcb-pick label{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;}.vcb.is-collapsed .vcb-pick select{flex:1 1 100%;width:100%;}}'
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
      '<div class="vcb-inner">' +
        '<div class="vcb-eyebrow">' + esc(opts.eyebrow || 'Vegans Explore') + '</div>' +
        '<h1 id="' + id + '-h">' + esc(opts.title || '') + ' <em data-vcb-city>' + esc(opts.allTitle || 'Every City') + '</em></h1>' +
        (opts.sub ? '<p class="vcb-sub">' + esc(opts.sub) + '</p>' : '') +
        '<div class="vcb-pick">' +
          '<label for="' + id + '-city">City</label>' +
          '<select id="' + id + '-city"><option value="">' + esc(opts.allLabel || 'All cities') + '</option>' +
            hubs().map(function (h) { return '<option value="' + esc(h.slug) + '">' + esc(h.name) + '</option>'; }).join('') +
          '</select>' +
          (opts.hubLink === false ? '' : '<a class="vcb-link" data-vcb-link href="/communities" hidden>Visit the community</a>') +
          '<button type="button" class="vcb-toggle" aria-controls="' + id + '" aria-expanded="true">Collapse</button>' +
        '</div>' +
      '</div>';

    var select = el.querySelector('select'), cityEl = el.querySelector('[data-vcb-city]');
    var link = el.querySelector('[data-vcb-link]'), toggle = el.querySelector('.vcb-toggle');
    var mobile = window.matchMedia('(max-width: 900px)');
    var param = opts.param || 'city', storeKey = 've_' + (opts.key || 'banner') + '_hero';
    var current = '', chosen = null;

    function art(slug) {
      if (mobile.matches && MOBILE_ART[slug]) return '/communities/' + slug + '/' + MOBILE_ART[slug];
      return '/communities/' + slug + '/' + (ART[slug] || 'banner.jpg');
    }
    function paint() { el.style.backgroundImage = "url('" + art(current || 'new-york') + "')"; }
    function show(slug) {
      var hub = hubBySlug(slug);
      current = hub ? hub.slug : '';
      select.value = current;
      cityEl.textContent = hub ? hub.name : (opts.allTitle || 'Every City');
      paint();
      if (link) { link.hidden = !hub; if (hub) link.href = '/communities/' + hub.slug; }
      if (opts.onChange) opts.onChange(current, hub);
    }
    function fromUrl() { return new URLSearchParams(location.search).get(param) || ''; }

    select.addEventListener('change', function () {
      var q = new URLSearchParams(location.search);
      if (select.value) q.set(param, select.value); else q.delete(param);
      var s = q.toString();
      history.pushState({ city: select.value }, '', location.pathname + (s ? '?' + s : '') + location.hash);
      show(select.value);
    });
    window.addEventListener('popstate', function () { if (fromUrl() !== current) show(fromUrl()); });
    if (mobile.addEventListener) mobile.addEventListener('change', paint);

    // Expanded on landing; autoFold() folds it on the first click into the page, unless the visitor chose with the button.
    function fold(on) { el.classList.toggle('is-collapsed', on); toggle.textContent = on ? 'Expand' : 'Collapse'; toggle.setAttribute('aria-expanded', on ? 'false' : 'true'); }
    try { chosen = sessionStorage.getItem(storeKey); } catch (e) {}
    toggle.addEventListener('click', function () {
      var on = !el.classList.contains('is-collapsed'); fold(on);
      chosen = on ? 'collapsed' : 'expanded'; try { sessionStorage.setItem(storeKey, chosen); } catch (e) {}
    });
    if (chosen) fold(chosen === 'collapsed');

    var api = {
      el: el,
      set: function (slug) { show(slug); },
      current: function () { return current; },
      hub: function () { return hubBySlug(current); },
      fold: fold,
      autoFold: function () { if (!chosen) fold(true); },
      matches: matches
    };
    show(fromUrl());
    return api;
  }

  window.VECityBanner = { mount: mount, matches: matches, hubBySlug: hubBySlug };
})();
