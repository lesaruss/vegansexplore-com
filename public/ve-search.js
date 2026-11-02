/* ve-search.js: universal search (Sean, 2026-11-02, playbook ve-universal-search).
   One box, on every page. Type what you want in your own words ("vegan restaurants in Claremont", "egg substitute", "vegan doctor near me");
   a short list of the best matches appears, and Enter opens the full results at /search. The engine is the ve-search edge function (the
   database's ve_search); the words it knows, the places it knows and what people looked for are rows per brand, so another brand loads
   this same file with its own rows.

   VESearch.mount(input, {host, limit, onSubmit})  turn any text input into the box (a dropdown under it)
   VESearch.panel()                                the search bar under the nav (the magnifier in nav.js opens it; "/" does too)
   VESearch.query(q, {log, limit})                 Promise of the engine's answer
   VESearch.place(r)                               "Restaurants" · "near Claremont" as words
   Nothing is shown to the visitor but what they typed and what we found; Near me asks the phone for its place only when asked. */
(function () {
  if (window.VESearch) return;
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-search';
  var BRAND = (window.VE_BRAND && window.VE_BRAND.searchBrand) || 'vegans-explore';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function vid() { try { var v = localStorage.getItem('ve_visitor'); if (!v) { v = Math.random().toString(36).slice(2, 12); localStorage.setItem('ve_visitor', v); } return v; } catch (e) { return ''; } }

  /* ---- where the phone is: asked only for a "near me" search, kept for the visit ---- */
  function geo() {
    return new Promise(function (res) {
      try { var c = JSON.parse(sessionStorage.getItem('ve_geo') || 'null'); if (c && c.lat) return res(c); } catch (e) {}
      if (!navigator.geolocation) return res(null);
      navigator.geolocation.getCurrentPosition(function (p) {
        var c = { lat: p.coords.latitude, lng: p.coords.longitude };
        try { sessionStorage.setItem('ve_geo', JSON.stringify(c)); } catch (e) {}
        res(c);
      }, function () { res(null); }, { timeout: 8000, maximumAge: 600000 });
    });
  }
  function wantsNear(q) { return /\b(near me|nearby|around me|close to me|nearest)\b/i.test(q || ''); }
  function savedGeo() { try { var c = JSON.parse(sessionStorage.getItem('ve_geo') || 'null'); return c && c.lat ? c : null; } catch (e) { return null; } }

  function query(q, o) {
    o = o || {};
    return (wantsNear(q) ? geo() : Promise.resolve(savedGeo())).then(function (g) {
      var body = { q: q, limit: o.limit || 20, brand: BRAND, log: !!o.log, visitor: o.log ? vid() : undefined };
      if (g) { body.lat = g.lat; body.lng = g.lng; }
      return fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: o.signal })
        .then(function (r) { if (!r.ok) throw new Error('search'); return r.json(); });
    });
  }

  /* ---- what we understood, in words ---- */
  function words(r) {
    var it = (r && r.interpretation) || {}, out = [];
    (it.labels || []).forEach(function (l) { out.push(l); });
    if (it.terms) out.push('“' + it.terms + '”');
    if (it.place) out.push('in ' + it.place.name + (it.place.state ? ', ' + it.place.state : ''));
    else if (it.near_me) out.push('near you');
    return out;
  }
  function kmText(km) { return km == null ? '' : (km < 1 ? 'under 1 km' : (km >= 100 ? Math.round(km) : km) + ' km'); }
  function meta(x) { return [x.category, x.city && (x.city + (x.state ? ', ' + x.state : '')), kmText(x.km)].filter(Boolean).join(' · '); }
  function tile(x) {
    var l = x.logo_url ? '<img src="' + esc(x.logo_url) + '" alt="" loading="lazy" width="40" height="40" onerror="this.replaceWith(document.createTextNode(\'' + esc((x.name || '?').charAt(0).toUpperCase()) + '\'))">' : '<span>' + esc((x.name || '?').charAt(0).toUpperCase()) + '</span>';
    return '<span class="ves-logo">' + l + '</span>';
  }

  var CSS = '.ves-panel{position:absolute;left:0;right:0;top:100%;z-index:1001;background:#fff;border-bottom:1px solid rgba(0,0,0,.09);box-shadow:0 14px 28px rgba(0,0,0,.12);padding:14px 28px 16px;font-family:Montserrat,sans-serif}' +
    '.ves-panel[hidden]{display:none}.ves-wrap{position:relative;display:block}' +
    '.ves-field{display:flex;align-items:center;gap:10px;height:48px;border:1.5px solid rgba(0,0,0,.18);border-radius:6px;background:#fff;padding:0 14px}' +
    '.ves-field:focus-within{border-color:var(--vb-accent,#3A9B3E);box-shadow:0 0 0 3px rgba(58,155,62,.18)}' +
    '.ves-field svg{width:18px;height:18px;flex:none;stroke:#444;fill:none;stroke-width:2.2;stroke-linecap:round}' +
    '.ves-field input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:600 15px Montserrat,sans-serif;color:#1a1a1a}' +
    '.ves-field input::placeholder{color:#6b6b6b;font-weight:500}' +
    '.ves-x{border:0;background:transparent;font-size:20px;line-height:1;color:#555;cursor:pointer;padding:4px 6px;border-radius:6px}.ves-x[hidden]{display:none}' +
    '.ves-list{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:5;background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:6px;box-shadow:0 14px 30px rgba(0,0,0,.14);max-height:min(70vh,520px);overflow:auto;text-align:left}' +
    '.ves-list[hidden]{display:none}' +
    '.ves-h{padding:10px 14px 4px;font:800 10.5px Montserrat,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#666}' +
    '.ves-row{display:flex;align-items:center;gap:12px;padding:9px 14px;text-decoration:none;color:#1a1a1a;cursor:pointer}' +
    '.ves-row[aria-selected="true"],.ves-row:hover{background:#f0faf4}' +
    '.ves-logo{width:40px;height:40px;flex:none;border-radius:6px;background:#E8F5E9;color:#2D5C27;display:flex;align-items:center;justify-content:center;font:800 16px Montserrat,sans-serif;overflow:hidden}.ves-logo img{width:100%;height:100%;object-fit:cover}' +
    '.ves-t{min-width:0;flex:1}.ves-n{display:block;font:700 14px Montserrat,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ves-m{display:block;font:500 12px Montserrat,sans-serif;color:#555;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.ves-go{flex:none;font:800 12px Montserrat,sans-serif;color:#2D5C27;white-space:nowrap}' +
    '.ves-note{padding:10px 14px;font:500 12.5px Montserrat,sans-serif;color:#444;background:#fafafa;border-top:1px solid #eee}' +
    '.ves-chip{display:inline-block;padding:3px 9px;border-radius:6px;background:#E8F5E9;color:#1f4a1b;font:700 12px Montserrat,sans-serif;margin:0 6px 4px 0}' +
    '@media(max-width:600px){.ves-panel{padding:10px 16px 12px}.ves-field{height:46px}}';
  function css() { if (document.getElementById('ves-css')) return; var s = document.createElement('style'); s.id = 'ves-css'; s.textContent = CSS; document.head.appendChild(s); }

  var SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.5" y2="16.5"/></svg>';

  /* ---- the box: a field, a list under it, keyboard like a combobox ---- */
  function mount(input, o) {
    o = o || {}; css();
    var host = o.host || input.parentNode, uid = 'ves-l' + Math.random().toString(36).slice(2, 7);
    var list = document.createElement('div'); list.className = 'ves-list'; list.id = uid; list.setAttribute('role', 'listbox'); list.hidden = true;
    host.style.position = host.style.position || 'relative'; host.appendChild(list);
    input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list'); input.setAttribute('aria-expanded', 'false'); input.setAttribute('aria-controls', uid);
    input.setAttribute('autocomplete', 'off'); input.setAttribute('autocapitalize', 'off'); input.setAttribute('spellcheck', 'false');
    var timer, ctl, rows = [], cur = -1, last = '';
    function submit(q) { q = (q || input.value).trim(); if (q.length < 2) return; close(); if (o.onSubmit) o.onSubmit(q); else location.href = '/search?q=' + encodeURIComponent(q); }
    function close() { list.hidden = true; input.setAttribute('aria-expanded', 'false'); cur = -1; input.removeAttribute('aria-activedescendant'); }
    function mark(i) {
      cur = i; var els = list.querySelectorAll('.ves-row');
      els.forEach(function (e, k) { e.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      if (i >= 0 && els[i]) { input.setAttribute('aria-activedescendant', els[i].id); els[i].scrollIntoView({ block: 'nearest' }); } else input.removeAttribute('aria-activedescendant');
    }
    function draw(r, q) {
      var it = r.interpretation || {}, w = words(r), html = '';
      var href = '/search?q=' + encodeURIComponent(q);
      html += '<div class="ves-h">Search</div><a class="ves-row" role="option" id="' + uid + '-0" href="' + href + '" data-q="1">' + '<span class="ves-logo">' + SVG.replace('<svg', '<svg style="width:18px;height:18px;stroke:#2D5C27;fill:none;stroke-width:2.2"') + '</span>' +
        '<span class="ves-t"><span class="ves-n">' + esc(q) + '</span><span class="ves-m">' + (w.length ? esc(w.join(' · ')) : 'See every match') + '</span></span><span class="ves-go">See all' + (r.total ? ' ' + r.total : '') + '</span></a>';
      var res = (r.results || []).slice(0, 6);
      if (res.length) {
        html += '<div class="ves-h">' + (r.nearest_fallback ? 'Closest we have' : 'Best matches') + '</div>';
        res.forEach(function (x, i) { html += '<a class="ves-row" role="option" id="' + uid + '-' + (i + 1) + '" href="/directory/' + encodeURIComponent(x.slug) + '" data-slug="' + esc(x.slug) + '">' + tile(x) + '<span class="ves-t"><span class="ves-n">' + esc(x.name) + '</span><span class="ves-m">' + esc(meta(x)) + '</span></span></a>'; });
      }
      if (r.nearest_fallback && it.place) html += '<div class="ves-note">Nothing in ' + esc(it.place.name) + ' yet. These are the closest, about ' + esc(r.nearest_km) + ' km away.</div>';
      else if (!res.length) html += '<div class="ves-note">Nothing matches yet. We keep track of what people look for so we know what to add next.</div>';
      list.innerHTML = html; list.hidden = false; input.setAttribute('aria-expanded', 'true'); cur = -1;
    }
    function run() {
      var q = input.value.trim(); if (q.length < 2) { close(); return; }
      if (q === last) { list.hidden = false; input.setAttribute('aria-expanded', 'true'); return; }
      if (ctl) ctl.abort(); ctl = window.AbortController ? new AbortController() : null;
      query(q, { limit: 6, signal: ctl && ctl.signal }).then(function (r) { if (input.value.trim() !== q) return; last = q; draw(r, q); }).catch(function (e) { if (e && e.name === 'AbortError') return; });
    }
    input.addEventListener('input', function () { last = ''; clearTimeout(timer); timer = setTimeout(run, 170); });
    if (o.openOnFocus !== false) input.addEventListener('focus', function () { if (input.value.trim().length >= 2) run(); });
    input.addEventListener('keydown', function (e) {
      var n = list.querySelectorAll('.ves-row').length;
      if (e.key === 'ArrowDown') { e.preventDefault(); if (list.hidden) run(); else mark(Math.min(n - 1, cur + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); mark(Math.max(-1, cur - 1)); }
      else if (e.key === 'Escape') { if (!list.hidden) { close(); e.stopPropagation(); } else if (o.onEscape) o.onEscape(); }
      else if (e.key === 'Enter') {
        e.preventDefault(); var el = cur >= 0 ? list.querySelectorAll('.ves-row')[cur] : null;
        if (el && el.getAttribute('data-slug')) { query(input.value.trim(), { limit: 1, log: true }).catch(function () {}); location.href = el.getAttribute('href'); }
        else submit();
      }
    });
    list.addEventListener('mousedown', function (e) { var a = e.target.closest && e.target.closest('a.ves-row'); if (a && a.getAttribute('data-q') && o.onSubmit) { e.preventDefault(); submit(input.value); } });
    document.addEventListener('click', function (e) { if (!host.contains(e.target)) close(); });
    return { close: close, submit: submit };
  }

  /* ---- the bar under the nav ---- */
  var pan;
  function panel() {
    css();
    var nav = document.querySelector('.ve-nav'); if (!nav) return null;
    if (!pan) {
      pan = document.createElement('div'); pan.className = 'ves-panel'; pan.setAttribute('role', 'search'); pan.hidden = true;
      pan.innerHTML = '<div class="ves-wrap"><label class="ves-field">' + SVG + '<input type="text" id="ves-input" placeholder="Search anything: vegan restaurants in Claremont, egg substitute, vegan doctor" aria-label="Search">' +
        '<button type="button" class="ves-x" aria-label="Close search">&times;</button></label></div>';
      nav.appendChild(pan);
      var inp = pan.querySelector('input');
      var m = mount(inp, { host: pan.querySelector('.ves-wrap'), onEscape: function () { toggle(false); } });
      pan.querySelector('.ves-x').addEventListener('click', function () { toggle(false); });
      pan._m = m;
    }
    return pan;
  }
  function toggle(open) {
    var p = panel(); if (!p) return;
    var on = open === undefined ? p.hidden : open;
    p.hidden = !on;
    var b = document.querySelector('[data-ve-search-btn]'); if (b) b.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on) { var i = p.querySelector('input'); i.focus(); i.select(); } else if (p._m) p._m.close();
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      var t = e.target, tag = t && t.tagName; if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
      if (document.getElementById('ves-page-input')) { e.preventDefault(); document.getElementById('ves-page-input').focus(); return; }
      e.preventDefault(); toggle(true);
    }
  });

  window.VESearch = { mount: mount, panel: panel, toggle: toggle, query: query, words: words, meta: meta, tile: tile, esc: esc, kmText: kmText, css: css, vid: vid };
})();
