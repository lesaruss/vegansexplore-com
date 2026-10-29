/* ve-city-banner.js: the city banner every browse page shares (Sean, 2026-10-26: "the header to be similar
   to the directory where they can immediately select and collapse as well. That should be a feature for all
   the banners"). The Directory's banner, made one component: the chosen city's art (New York for all
   cities), a city picker from VE_HUBS (/public/ve-hubs.js, load it first), Visit the community, and
   Collapse / Expand, which folds it to one bar that keeps the picker. ?city=<hub slug> carries the choice.

   Collapse or Expand is one choice for the whole site (Sean, 2026-10-27: "if somebody collapses it, let it stay collapsed when they
   navigate through to the different pages"): sessionStorage ve_banner_hero, read by every banner.

   Usage:
     <section id="my-banner"></section>
     var banner = VECityBanner.mount('my-banner', {
       key: 'events',                 // names the banner (its id); Collapse / Expand is shared by every banner
       title: 'Vegan Events',         // the big line; the city name (or allLabel) goes under it
       sub: 'One line about the page.',
       allTitle: 'Every City', allLabel: 'All cities',
       onChange: function (slug, hub) {},  // runs at mount and on every pick ('' is all cities)
       home: { label: 'Events home', href: '/events' | onClick },  // the first button: back to the page's own home, the same as its
                                      // menu button (Sean, 2026-10-27, in place of View community); hubLink: false drops it
       action: { label: 'Submit an event', onClick: function () {} },  // optional: the page's own button, beside the home button
       actions: [{ label, href | onClick, id, go: true, open: true }],  // optional: more buttons (go: the green one; open: only
                                                                        // while the banner is open, not in the folded bar)
       meta: '<span>...</span>'       // optional: a line under the sub, while the banner is open (a city hub's cities)
     });
     banner.autoFold();   // call on the first click into the page's content: folds unless the visitor chose
     banner.setAction('Post a job');   // the page's own button can change with what the page shows (the Pulse's tabs)
     banner.set('atlanta'); banner.setQuiet('atlanta'); banner.current(); banner.hub(); banner.matches(hub, {city, state});
     banner.setChoices([{value, label}], value, pick) lists something else for a while (Media's kinds); setChoices(null) puts the cities back.
   Options for the dashboard: initial (the city when the address bar has none) and param: false (leave the address bar alone).
   A page that is not about a city (Media, Sean 2026-10-27: "no one's trying to make media just for one location") picks from
   its own list instead: choices: [{value, label}] (no All option; the picked label goes under the title), pickLabel (what
   screen readers hear), art (one picture for every pick) and link(value) -> {href, label} for the first button.
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
    '.vcb-eyebrow{font-size:10px;font-weight:800;letter-spacing:.32em;text-transform:uppercase;color:var(--vb-accent,#3A9B3E);margin-bottom:16px;display:flex;align-items:center;gap:10px;}',
    '.vcb-eyebrow::before{content:"";width:20px;height:2px;background:var(--vb-accent,#3A9B3E);}',
    '.vcb h1{font-size:clamp(36px,5.5vw,68px);font-weight:900;line-height:.96;letter-spacing:-.03em;text-transform:uppercase;color:#fff;margin:0 0 18px;text-shadow:0 2px 14px rgba(0,0,0,.6);}',
    '.vcb h1 em{display:block;color:var(--vb-accent-hi,#6fd98c);font-style:normal;}',
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
    '.vcb-btn-go{background:var(--vb-go,#2d7d31);border-color:var(--vb-go,#2d7d31);}',
    '.vcb-btn-go:hover{background:var(--vb-go-hover,#1f5f22);border-color:var(--vb-go-hover,#1f5f22);}',
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
    '.vcb.is-collapsed h1 em{display:block;font-size:17px;margin-top:4px;white-space:nowrap;overflow:hidden;}',
    // Folded, the title stays on one line and shrinks to fit instead (Sean, 2026-10-26: two rows made the buttons taller on phones).
    '.vcb.is-collapsed .vcb-t{display:block;white-space:nowrap;}',
    '.vcb.is-collapsed .vcb-pick{margin-top:0;flex-wrap:nowrap;}',
    '.vcb.is-collapsed .vcb-pick select{padding:9px 44px 9px 14px;}',
    // Folded, the buttons keep their own height, stacked and centered beside the title (Sean, 2026-10-27: one button "should just be
    // the same size as normally... centered"), never stretched to the bar's height.
    '.vcb.is-collapsed .vcb-actions{display:grid;grid-auto-rows:auto;align-content:center;gap:8px;margin:0;}',
    '.vcb.is-collapsed .vcb-open-only,.vcb.is-collapsed .vcb-meta{display:none !important;}',
    '.vcb-meta{margin-top:14px;}',
    '.vcb.is-collapsed .vcb-btn{width:100%;padding:8px 10px;display:flex;align-items:center;justify-content:center;}',
    // Option B on phones: flat scrim and a frosted card.
    // Phones (Sean, 2026-10-27: "make the section with the title and city drop down full width so it flushes with the top
    // navigation"): no gap under the menu, and the card with the title and picker runs the full width.
    // Phones have no Expand (Sean, 2026-10-27: "on mobile, we lose the expand"): the banner is always folded there, and a banner
    // with no buttons left gives its title the whole width (vcb-no-acts).
    '.vcb-short{display:none;}',
    '@media (max-width:900px){.vcb-long{display:none;}.vcb-short{display:inline;}.vcb-toggle{display:none !important;}.vcb.is-collapsed.vcb-no-acts .vcb-inner{grid-template-columns:minmax(0,1fr);}.vcb.vcb-no-acts .vcb-actions{display:none;}}',
    '@media (max-width:900px){.vcb{margin-top:0;align-items:flex-end;min-height:520px;background-position:center center;}.vcb::before{background:rgba(0,0,0,.32);}.vcb::after{display:none;}.vcb-inner{background:rgba(0,0,0,.6);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-radius:0;margin:0;padding:28px 20px;width:100%;max-width:100%;border:0;}}',
    '@media (max-width:480px){.vcb-inner{background:rgba(0,0,0,.62);margin:0;padding:24px 16px;max-width:100%;border:0;}.vcb-pick select{min-width:0;width:100%;}.vcb.is-collapsed .vcb-inner{padding:14px 16px;grid-template-columns:minmax(0,1fr) minmax(118px,36%);gap:12px 22px;}.vcb.is-collapsed h1{font-size:18px;}.vcb.is-collapsed h1 em{font-size:15px;}.vcb.is-collapsed .vcb-pick select{flex:1 1 100%;width:100%;}.vcb.is-collapsed .vcb-btn{font-size:10px;letter-spacing:.06em;white-space:normal;text-align:center;}.vcb-actions .vcb-btn{flex:1 1 auto;}}'
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
    var choices = opts.choices && opts.choices.length ? opts.choices : null;
    function choice(v) { return choices ? choices.filter(function (c) { return c.value === v; })[0] || null : null; }
    el.innerHTML =
      '<div class="vcb-inner"><div class="vcb-main">' +
        '<div class="vcb-eyebrow">' + esc(opts.eyebrow || 'Vegans Explore') + '</div>' +
        '<h1 id="' + id + '-h"><span class="vcb-t">' + esc(opts.title || '') + '</span> <em data-vcb-city>' + esc(opts.allTitle || 'Every City') + '</em></h1>' +
        (opts.sub ? '<p class="vcb-sub">' + esc(opts.sub) + '</p>' : '') +
        (opts.meta ? '<div class="vcb-meta">' + opts.meta + '</div>' : '') +
        '<div class="vcb-pick">' +
          '<label for="' + id + '-city">' + esc(opts.pickLabel || 'City') + '</label>' +
          '<select id="' + id + '-city">' + (choices ? '' : '<option value="">' + esc(opts.allLabel || 'All cities') + '</option>') +
            (choices || hubs().map(function (h) { return { value: h.slug, label: h.name }; })).map(function (c) { return '<option value="' + esc(c.value) + '">' + esc(c.label) + '</option>'; }).join('') +
          '</select>' +
        '</div></div>' +
        '<div class="vcb-actions">' +
          // With a home button, a page's own link (Media's See in the Directory) follows it and shows only while the banner is open.
          (opts.home ? '<a class="vcb-btn" data-vcb-home href="' + esc(opts.home.href || '#') + '">' + esc(opts.home.label) + '</a>' +
              (opts.link ? '<a class="vcb-btn vcb-open-only" data-vcb-link href="#">See more</a>' : '')
            : opts.hubLink === false ? '' : '<a class="vcb-btn" data-vcb-link href="/communities">View communities</a>') +
          (opts.action ? '<button type="button" class="vcb-btn vcb-btn-go" data-vcb-action>' + esc(opts.action.label) + '</button>' : '') +
          (opts.actions || []).map(function (a, i) {
            var cls = 'vcb-btn' + (a.go ? ' vcb-btn-go' : '') + (a.open ? ' vcb-open-only' : '');
            var id = a.id ? ' id="' + esc(a.id) + '"' : '';
            // a.short: a phone's label, so the button stays one row (Sean, 2026-10-27: Join network for Join our network).
            var text = a.short ? '<span class="vcb-long">' + esc(a.label) + '</span><span class="vcb-short">' + esc(a.short) + '</span>' : esc(a.label);
            return a.href ? '<a class="' + cls + '"' + id + ' href="' + esc(a.href) + '">' + text + '</a>'
              : '<button type="button" class="' + cls + '"' + id + ' data-vcb-act="' + i + '">' + text + '</button>';
          }).join('') +
          '<button type="button" class="vcb-btn vcb-toggle" aria-controls="' + id + '" aria-expanded="true">Collapse</button>' +
        '</div>' +
      '</div>';

    var select = el.querySelector('select'), cityEl = el.querySelector('[data-vcb-city]');
    var link = el.querySelector('[data-vcb-link]'), toggle = el.querySelector('.vcb-toggle');
    var mobile = window.matchMedia('(max-width: 900px)');
    var param = opts.param === false ? null : (opts.param || 'city'), storeKey = 've_banner_hero';
    // label: what the line under the title says in place of the city (the Directory's section, Sean 2026-10-27); setLabel.
    var current = '', chosen = null, label = '';

    // A chapter's art is its VE_HUBS page.banner (a new chapter needs no entry here); ART is the fallback by file name.
    function art(slug) {
      if (mobile.matches && MOBILE_ART[slug]) return '/communities/' + slug + '/' + MOBILE_ART[slug];
      var h = hubBySlug(slug); if (h && h.page && h.page.banner) return h.page.banner;
      return '/communities/' + slug + '/' + (ART[slug] || 'banner.jpg');
    }
    // On another brand's site (window.VE_BRAND.assetOrigin, e.g. https://vegansexplore.com) the city art comes from here.
    function abs(u) { var o = window.VE_BRAND && window.VE_BRAND.assetOrigin; return o && u && u.charAt(0) === '/' && u.charAt(1) !== '/' ? o + u : u; }
    function paint() { el.style.backgroundImage = "url('" + abs(opts.art || art(current || 'new-york')) + "')"; }
    function show(slug, quiet) {
      if (choices) {
        var c = choice(slug) || choices[0];
        current = c.value; select.value = current; cityEl.textContent = label || c.label; paint(); fitTitle();
        if (link && opts.link) { var l = opts.link(current) || {}; if (l.href) link.href = l.href; if (l.label) link.textContent = l.label; }
        if (opts.onChange && !quiet) opts.onChange(current, null);
        return;
      }
      var hub = hubBySlug(slug);
      current = hub ? hub.slug : '';
      select.value = current;
      cityEl.textContent = label || (hub ? hub.name : (opts.allTitle || 'Every City'));
      paint(); fitTitle();
      // A city opens its hub; All cities opens every community.
      if (link) { link.href = hub ? '/communities/' + hub.slug : '/communities'; link.textContent = hub ? 'View community' : 'View communities'; }
      if (opts.onChange && !quiet) opts.onChange(current, hub);
    }
    // View community opens the chapter the way the menu's Communities does, never inside a frame (Sean, 2026-10-27: "It doesn't
    // take you to View Communities the way the top bar takes you"): in the dashboard (this window or the one framing this page,
    // like the Daily Pulse tab) the dashboard opens it (VEOpenCommunity in center-console); in any other frame the whole window goes.
    if (link && !opts.link) link.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      var host = null;
      try { host = window.VEOpenCommunity ? window : window.parent !== window && window.parent.VEOpenCommunity ? window.parent : null; } catch (x) { host = null; }
      if (host) { e.preventDefault(); host.VEOpenCommunity(current || ''); return; }
      if (window.top !== window) { e.preventDefault(); try { window.top.location.href = link.href; } catch (x) { window.open(link.href, '_top'); } }
    });
    function fromUrl() { return param ? new URLSearchParams(location.search).get(param) || '' : current; }

    // setChoices(list, value, pick): the picker lists something other than the cities for a while (the Directory's Media section
    // lists its kinds, Sean 2026-10-29), and a pick goes to pick(value), not to the page's onChange. setChoices(null) puts the
    // cities (or the page's own choices) back as they were.
    var swapped = null, cityLabel = el.querySelector('.vcb-pick label');
    function fillSelect(list, all) {
      select.innerHTML = (all ? '<option value="">' + esc(opts.allLabel || 'All cities') + '</option>' : '') +
        list.map(function (c) { return '<option value="' + esc(c.value) + '">' + esc(c.label) + '</option>'; }).join('');
    }
    select.addEventListener('change', function () {
      if (swapped) { swapped.pick(select.value); return; }
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
    // Folded, shrink the title until it fits its column on one line (fitTitle), never below 12px. The buttons stack taller
    // than the title (on a phone and, since 2026-10-28, on a desktop), so the title and the line under it grow to fill that height instead (Sean, 2026-10-27:
    // "make the title big enough where it's filling in that gap, but not adjusting anything else"): the biggest size at which
    // every word still fits the column, the line under it stays one line, and the title, that line and the picker together are
    // no taller than the buttons.
    var title = el.querySelector('.vcb-t'), h1 = el.querySelector('h1'), pick = el.querySelector('.vcb-pick');
    var phone = window.matchMedia('(max-width: 900px)'), fitting = false;
    function fitTitle() {
      if (!title || fitting) return;
      fitting = true;
      title.style.fontSize = ''; title.style.whiteSpace = ''; title.style.lineHeight = ''; cityEl.style.fontSize = '';
      if (el.classList.contains('is-collapsed')) {
        var size = parseFloat(getComputedStyle(title).fontSize) || 18;
        while (title.scrollWidth > title.clientWidth + 1 && size > 12) { size -= 0.5; title.style.fontSize = size + 'px'; }
        var acts = el.querySelector('.vcb-actions');
        // Desktop too (Sean, 2026-10-28: "I want it to look exactly like how it looks on mobile in relation to the title and subtitle
        // and the dropdown"): folded, the title and the line under it grow until they and the picker fill the buttons' height, the
        // same 8px apart as the buttons. A phone lets the title wrap; a desktop keeps it on one line.
        if (acts && acts.offsetHeight) {
          var room = acts.offsetHeight, ratio = (parseFloat(getComputedStyle(cityEl).fontSize) || 15) / size;
          var fits = function (n) {
            title.style.fontSize = n + 'px'; cityEl.style.fontSize = Math.round(n * ratio * 2) / 2 + 'px';
            var words = title.scrollWidth <= title.clientWidth + 1 && cityEl.scrollWidth <= cityEl.clientWidth + 1;
            return words && h1.offsetHeight + pick.offsetHeight + 8 <= room;
          };
          if (phone.matches) { title.style.whiteSpace = 'normal'; title.style.lineHeight = '1.05'; }
          var best = size;
          for (var n = size + 1; n <= 44; n++) { if (fits(n)) best = n; else break; }
          if (best === size) { title.style.whiteSpace = ''; title.style.lineHeight = ''; }
          fits(best);
        }
      }
      fitting = false;
    }
    if (window.ResizeObserver) new ResizeObserver(function () { fitTitle(); }).observe(el); else window.addEventListener('resize', fitTitle);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);
    function fold(on) { el.classList.toggle('is-collapsed', on); fitTitle(); toggle.textContent = on ? 'Expand' : 'Collapse'; toggle.setAttribute('aria-expanded', on ? 'false' : 'true'); }
    try { chosen = sessionStorage.getItem(storeKey); } catch (e) {}
    toggle.addEventListener('click', function () {
      var on = !el.classList.contains('is-collapsed'); fold(on);
      chosen = on ? 'collapsed' : 'expanded'; try { sessionStorage.setItem(storeKey, chosen); } catch (e) {}
    });
    // On a phone it is always folded and the choice is the desktop's alone; back on a wide screen it is as the visitor left it.
    var autoFolded = false;
    function byDevice() {
      if (phone.matches) { fold(true); return; }
      fold(chosen ? chosen === 'collapsed' : autoFolded);
    }
    var acts = Array.prototype.filter.call(el.querySelectorAll('.vcb-actions .vcb-btn'), function (b) {
      return !b.classList.contains('vcb-toggle') && !b.classList.contains('vcb-open-only');
    });
    if (!acts.length) el.classList.add('vcb-no-acts');
    byDevice();
    if (phone.addEventListener) phone.addEventListener('change', byDevice);
    Array.prototype.forEach.call(el.querySelectorAll('[data-vcb-act]'), function (b) {
      b.addEventListener('click', function () { var a = opts.actions[+b.getAttribute('data-vcb-act')]; if (a && a.onClick) a.onClick(); });
    });
    // The home button (Sean, 2026-10-27: "the same as if they were to click that top navigation button"): a link to the page's
    // home, or the page's own onClick where the home is a view inside it (the dashboard's tabs).
    var homeBtn = el.querySelector('[data-vcb-home]');
    if (homeBtn && opts.home.onClick) homeBtn.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault(); opts.home.onClick();
    });
    var actionBtn = el.querySelector('[data-vcb-action]');
    if (actionBtn) actionBtn.addEventListener('click', function () { if (!chosen) { autoFolded = true; fold(true); } opts.action.onClick(); });

    var api = {
      el: el,
      set: function (slug) { show(slug); },
      setQuiet: function (slug) { show(slug, true); },
      current: function () { return current; },
      hub: function () { return hubBySlug(current); },
      fold: fold,
      autoFold: function () { if (!chosen) { autoFolded = true; fold(true); } },
      setAction: function (label) { if (actionBtn && label) actionBtn.textContent = label; },
      setHome: function (href) { if (homeBtn && href) homeBtn.href = href; },
      setLabel: function (text) { label = text || ''; if (swapped) { cityEl.textContent = label; fitTitle(); return; } show(current, true); },
      setChoices: function (list, value, pick, pickLabel) {
        if (list && list.length) {
          if (!swapped || JSON.stringify(swapped.list) !== JSON.stringify(list)) fillSelect(list, false);
          swapped = { list: list, pick: pick || function () {} };
          select.value = value || list[0].value;
          if (cityLabel) cityLabel.textContent = pickLabel || 'Kind';
          return;
        }
        if (!swapped) return;
        swapped = null;
        fillSelect(choices || hubs().map(function (h) { return { value: h.slug, label: h.name }; }), !choices);
        if (cityLabel) cityLabel.textContent = opts.pickLabel || 'City';
        select.value = current;
      },
      matches: matches
    };
    show((param && new URLSearchParams(location.search).get(param)) || opts.initial || '');
    return api;
  }

  window.VECityBanner = { mount: mount, matches: matches, hubBySlug: hubBySlug };
})();
