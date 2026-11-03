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
      var body = { q: q, limit: o.limit || 20, content_limit: o.contentLimit || 6, brand: BRAND, log: !!o.log, visitor: o.log ? vid() : undefined };
      if (g) { body.lat = g.lat; body.lng = g.lng; }
      return fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: o.signal })
        .then(function (r) { if (!r.ok) throw new Error('search'); return r.json(); });
    });
  }


  // ---- content: moments from our shows, our episodes, other shows ----
  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(Number(sec) || 0)); var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return (h ? h + ':' + (m < 10 ? '0' : '') + m : m) + ':' + (s < 10 ? '0' : '') + s;
  }
  function epTag(x) { return [x.show, x.episode ? 'Ep ' + x.episode : ''].filter(Boolean).join(' · '); }
  function momentHref(x) { return '/pulse/' + encodeURIComponent(x.slug) + (x.youtube_id && x.start ? '?t=' + Math.floor(x.start) : ''); }
  function showHref(x) { return '/listen?show=' + encodeURIComponent(x.show_slug) + '&ep=' + encodeURIComponent(x.guid); }
  function letterTile(name, img) {
    var l = img ? '<img src="' + esc(img) + '" alt="" loading="lazy" width="40" height="40" onerror="this.replaceWith(document.createTextNode(\'' + esc((name || '?').charAt(0).toUpperCase()) + '\'))">' : '<span>' + esc((name || '?').charAt(0).toUpperCase()) + '</span>';
    return '<span class="ves-logo">' + l + '</span>';
  }
  var PLAY = '<svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:#2D5C27" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  function hasContent(c) { return !!c && ((c.moments || []).length + (c.episodes || []).length + (c.shows || []).length) > 0; }


  /* ---- a store and a thing: "does Walmart carry vegan ice cream" ---- */
  function cap(t) { t = String(t || ''); return t.charAt(0).toUpperCase() + t.slice(1); }
  function storeSay(st) {
    var n = st.store.name, what = st.term ? st.term : (st.thing || '');
    if (st.mode === 'unknown_item') return { yes: false, head: 'Not confirmed yet: ' + what + ' at ' + n, line: 'We have not confirmed ' + what + ' at ' + n + ' yet. We only say yes to what we have seen.' };
    if (st.total > 0) return { yes: true, head: (st.mode === 'all' ? 'Vegan at ' + n : cap(what) + ' at ' + n),
      line: st.mode === 'all' ? 'Our Guides place ' + st.total + ' Vegan product' + (st.total === 1 ? '' : 's') + ' at ' + n + '. Stock changes by store, so check the shelf.'
        : 'Yes. Our Guides place ' + st.total + ' Vegan ' + what + ' product' + (st.total === 1 ? '' : 's') + ' at ' + n + '. Stock changes by store, so check the shelf.' };
    return { yes: false, head: 'Not confirmed yet: ' + what + ' at ' + n, line: st.store_mapped ? 'We have ' + st.store_mapped + ' Vegan products mapped at ' + n + ', but no ' + what + ' yet.' : 'We have no Vegan products mapped at ' + n + ' yet.' };
  }
  function ago(iso) {
    if (!iso) return 'From the Guides, not checked in a store yet';
    var d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
    return 'Checked in a store ' + (d <= 0 ? 'today' : d === 1 ? 'yesterday' : d + ' days ago');
  }
  function daysAgo(iso) { var d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5); return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d + ' days ago'; }
  // What the locations say about an item: seen at N locations and when, missing at some, or flagged as maybe gone.
  function itemLine(x) {
    var b = [];
    if (x.seen_locations) b.push('Seen at ' + x.seen_locations + ' location' + (x.seen_locations === 1 ? '' : 's') + (x.checked_at ? ', last ' + daysAgo(x.checked_at) : ''));
    else b.push(ago(x.checked_at));
    if (x.flagged) b.push('some locations say it is gone'); else if (x.not_locations) b.push('missing at ' + x.not_locations);
    return b.join(' · ');
  }
  function storeHref(x) { return '/directory/' + encodeURIComponent(x.brand_slug) + '?tab=products' + (x.product_slug ? '&product=' + encodeURIComponent(x.product_slug) : ''); }
  var SCAN_HREF = '/guides/supermarket-guide#/scan';

  /* ---- what we understood, in words ---- */
  function words(r) {
    var it = (r && r.interpretation) || {}, out = [], ci = r && r.content && r.content.intent;
    if (r && r.store) return ['At ' + r.store.store.name, r.store.mode === 'all' ? 'Everything Vegan' : cap(r.store.term || r.store.thing)];
    // A question about a topic is read as that topic ("Talking with family"), not as its leftover words.
    if (!(it.labels && it.labels.length) && !it.place && !it.near_me && ci && ci.labels && ci.labels.length) return ci.labels.slice();
    (it.labels || []).forEach(function (l) { out.push(l); });
    if (it.terms) out.push('“' + it.terms + '”');
    if (it.place) out.push('in ' + it.place.name + (it.place.state ? ', ' + it.place.state : ''));
    else if (it.near_me) out.push('near you');
    return out;
  }
  // Distances come from the engine in km; people read miles (Sean, 2026-11-02).
  function miNum(km) { var m = km * 0.621371; return m < 0.1 ? 0.1 : (m < 10 ? Math.round(m * 10) / 10 : Math.round(m)); }
  function kmText(km) { return km == null ? '' : (km * 0.621371 < 0.1 ? 'under 0.1 mi' : miNum(km) + ' mi'); }
  function away(km) { return km == null ? '' : 'about ' + miNum(km) + (miNum(km) === 1 ? ' mile' : ' miles') + ' away'; }
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


  /* ---- Liz: when we have no answer (Sean, 2026-11-03) ---- */
  var ASK_CSS = '.vesa-back{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px}' +
    '.vesa-card{background:#fff;border-radius:12px;max-width:560px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,.3);font-family:Montserrat,sans-serif;color:#1a1a1a;overflow:hidden}' +
    '.vesa-in{display:flex;gap:18px;padding:22px}.vesa-liz{flex:none;width:92px;height:92px;border-radius:12px;background:#E8F5E9 center/cover no-repeat}' +
    '.vesa-q{font:800 11px Montserrat,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#2D5C27;margin:0 0 6px}.vesa-h{font:900 19px/1.25 Montserrat,sans-serif;margin:0 0 8px}' +
    '.vesa-p{font:500 14px/1.55 Montserrat,sans-serif;color:#333;margin:0 0 10px}.vesa-p b{font-weight:800}' +
    '.vesa-f{padding:0 22px 20px}.vesa-f label{display:block;font:700 12px Montserrat,sans-serif;margin:0 0 6px}.vesa-row{display:flex;gap:8px}' +
    '.vesa-row input{flex:1;min-width:0;height:44px;border:1.5px solid #ddd;border-radius:6px;padding:0 12px;font:500 14px Montserrat,sans-serif}.vesa-row input:focus{outline:none;border-color:#2D5C27}' +
    '.vesa-b{height:44px;padding:0 16px;border-radius:6px;border:0;background:#2D5C27;color:#fff;font:800 13px Montserrat,sans-serif;cursor:pointer}.vesa-b:hover{background:#1f4a1b}' +
    '.vesa-x{display:block;margin:12px 0 0;background:none;border:0;color:#666;font:700 12px Montserrat,sans-serif;cursor:pointer;padding:0;text-decoration:underline}' +
    '.vesa-ok{font:700 13px Montserrat,sans-serif;color:#2D5C27;margin:10px 0 0}.vesa-fine{font:500 11.5px/1.45 Montserrat,sans-serif;color:#666;margin:8px 0 0}' +
    '[data-ask-more]{color:#2D5C27;font-weight:800;text-decoration:underline;text-underline-offset:2px}' +
    '@media(max-width:480px){.vesa-in{flex-direction:column;padding:18px}.vesa-liz{width:72px;height:72px}.vesa-row{flex-direction:column}.vesa-row input{flex:none}.vesa-b{width:100%}}';
  var lastAsk = '';
  function askCss() { if (document.getElementById('vesa-css')) return; var s = document.createElement('style'); s.id = 'vesa-css'; s.textContent = ASK_CSS; document.head.appendChild(s); }
  function askPost(q, email) {
    return fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'ask', q: q, email: email || undefined, brand: BRAND, visitor: vid() }) }).then(function (r) { return r.json(); });
  }
  function lizUrl() { try { return window.VEGuideArt ? window.VEGuideArt('liz', 'square') : ''; } catch (e) { return ''; } }
  // The full card: Liz says how this works once, then it is a compact line.
  function askCard(q) {
    askCss(); if (document.getElementById('vesa-back')) return;
    try { localStorage.setItem('ve_ask_seen', '1'); } catch (e) {}
    var b = document.createElement('div'); b.className = 'vesa-back'; b.id = 'vesa-back'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-modal', 'true'); b.setAttribute('aria-label', 'How questions work');
    b.innerHTML = '<div class="vesa-card"><div class="vesa-in"><div class="vesa-liz" style="background-image:url(\'' + esc(lizUrl()) + '\')" role="img" aria-label="Liz"></div><div>' +
      '<p class="vesa-q">Liz, your Guide</p><h2 class="vesa-h">We don\'t have that one yet.</h2>' +
      '<p class="vesa-p">Vegans Explore is early, and every question you ask teaches us what to add. Yours is in our team\'s queue. When we have an answer, <b>we\'ll send it to you</b>, and everyone who asks the same thing after you will find it waiting.</p>' +
      '<p class="vesa-p">So keep asking. The more people use it, the smarter it gets.</p></div></div>' +
      '<form class="vesa-f"><label for="vesa-em">Want us to email you the answer? (optional)</label><div class="vesa-row"><input id="vesa-em" type="email" autocomplete="email" placeholder="you@example.com"><button class="vesa-b" type="submit">Email me the answer</button></div>' +
      '<p class="vesa-ok" hidden></p><p class="vesa-fine">We use your email only to send you this answer.</p><button type="button" class="vesa-x">Got it</button></form></div>';
    document.body.appendChild(b);
    askPost(q, '').catch(function () {});
    function close() { b.remove(); document.removeEventListener('keydown', esc_); }
    function esc_(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', esc_);
    b.addEventListener('click', function (e) { if (e.target === b || e.target.classList.contains('vesa-x')) close(); });
    var em = b.querySelector('#vesa-em'); setTimeout(function () { try { em.focus(); } catch (e) {} }, 50);
    b.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault(); var v = em.value.trim(), ok = b.querySelector('.vesa-ok');
      if (!v) { close(); return; }
      askPost(q, v).then(function (r) { ok.hidden = false; ok.textContent = r && r.ok ? 'Got it. We\'ll write to you when we have it.' : 'That email does not look right. Try again.'; if (r && r.ok) setTimeout(close, 1800); }).catch(function () { ok.hidden = false; ok.textContent = 'Something went wrong. Try again in a moment.'; });
    });
    var h = b.querySelector('.vesa-h'); h.setAttribute('tabindex', '-1');
  }
  // The line under a search with nothing: the first time the full card, after that a short note with a link to it.
  function askNote(q) {
    askCss();
    var seen = false; try { seen = localStorage.getItem('ve_ask_seen') === '1'; } catch (e) {}
    return { seen: seen, html: 'We don\'t have that yet. <b>It\'s in our team\'s queue</b>, and we\'ll write back when we have an answer. <a href="#" data-ask-more>How this works</a>' };
  }

  /* ---- the box: a field, a list under it, keyboard like a combobox ---- */
  function mount(input, o) {
    o = o || {}; css();
    var host = o.host || input.parentNode, uid = 'ves-l' + Math.random().toString(36).slice(2, 7);
    var list = document.createElement('div'); list.className = 'ves-list'; list.id = uid; list.setAttribute('role', 'listbox'); list.hidden = true;
    host.style.position = host.style.position || 'relative'; host.appendChild(list);
    input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list'); input.setAttribute('aria-expanded', 'false'); input.setAttribute('aria-controls', uid);
    if (!o.dictate) input.setAttribute('data-dictate', 'off');   // the phone's own keyboard dictates; the floating mic crowded the clear button (Sean, 2026-11-02)
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
      var it = r.interpretation || {}, w = words(r), html = '', n = 1, c = r.content || {};
      var href = '/search?q=' + encodeURIComponent(q);
      function id() { return uid + '-' + (n++); }
      html += '<div class="ves-h">Search</div><a class="ves-row" role="option" id="' + uid + '-0" href="' + href + '" data-q="1">' + '<span class="ves-logo">' + SVG.replace('<svg', '<svg style="width:18px;height:18px;stroke:#2D5C27;fill:none;stroke-width:2.2"') + '</span>' +
        '<span class="ves-t"><span class="ves-n">' + esc(q) + '</span><span class="ves-m">' + (w.length ? esc(w.join(' · ')) : 'See every match') + '</span></span><span class="ves-go">See all' + (r.total ? ' ' + r.total : '') + '</span></a>';
      var sHtml = '';
      if (r.store) {
        var sy = storeSay(r.store);
        sHtml += '<div class="ves-h">In the store</div><a class="ves-row" role="option" id="' + id() + '" href="' + href + '" data-go="1"><span class="ves-logo">' + (sy.yes ? '&#10003;' : '?') + '</span><span class="ves-t"><span class="ves-n">' + esc(sy.head) + '</span><span class="ves-m">' + esc(sy.line) + '</span></span></a>';
        (r.store.items || []).slice(0, 2).forEach(function (x) { sHtml += '<a class="ves-row" role="option" id="' + id() + '" href="' + storeHref(x) + '" data-go="1">' + letterTile(x.brand, x.logo) + '<span class="ves-t"><span class="ves-n">' + esc(x.brand + ' ' + x.type) + '</span><span class="ves-m">' + esc(itemLine(x)) + '</span></span></a>'; });
      }
      var listingIntent = (it.labels && it.labels.length) || it.place || it.near_me;
      var contentFirst = hasContent(c) && !listingIntent && ((c.intent && c.intent.topics && c.intent.topics.length) || !(r.results || []).length);
      var res = contentFirst ? [] : (r.results || []).slice(0, r.store ? 2 : hasContent(c) ? 4 : 6);
      var cHtml = '', oHtml = '', lHtml = '';
      var mo = (c.moments || []).slice(0, 2), ep = (c.episodes || []).slice(0, mo.length ? 1 : 2), ot = (c.shows || []).slice(0, 1);
      if (mo.length || ep.length) {
        cHtml += '<div class="ves-h">From our shows</div>';
        mo.forEach(function (x) { cHtml += '<a class="ves-row" role="option" id="' + id() + '" href="' + momentHref(x) + '" data-go="1"><span class="ves-logo">' + PLAY + '</span><span class="ves-t"><span class="ves-n">“' + esc(x.quote) + '”</span><span class="ves-m">' + esc([x.speaker, epTag(x), 'at ' + fmtTime(x.start)].filter(Boolean).join(' · ')) + '</span></span></a>'; });
        ep.forEach(function (x) { cHtml += '<a class="ves-row" role="option" id="' + id() + '" href="/pulse/' + encodeURIComponent(x.slug) + '" data-go="1">' + letterTile(x.title, x.thumb) + '<span class="ves-t"><span class="ves-n">' + esc(x.title) + '</span><span class="ves-m">' + esc(epTag(x)) + '</span></span></a>'; });
      }
      if (ot.length) {
        oHtml += '<div class="ves-h">From other shows</div>';
        ot.forEach(function (x) { oHtml += '<a class="ves-row" role="option" id="' + id() + '" href="' + showHref(x) + '" data-go="1">' + letterTile(x.show, x.logo_url) + '<span class="ves-t"><span class="ves-n">' + esc(x.title) + '</span><span class="ves-m">' + esc(x.show) + ' · from the show\'s description</span></span></a>'; });
      }
      if (res.length) {
        lHtml += '<div class="ves-h">' + (r.nearest_fallback ? 'Closest we have' : 'Best matches') + '</div>';
        res.forEach(function (x) { lHtml += '<a class="ves-row" role="option" id="' + id() + '" href="/directory/' + encodeURIComponent(x.slug) + '" data-slug="' + esc(x.slug) + '" data-go="1">' + tile(x) + '<span class="ves-t"><span class="ves-n">' + esc(x.name) + '</span><span class="ves-m">' + esc(meta(x)) + '</span></span></a>'; });
      }
      // What the question is about leads: a question about a topic shows our shows first, a place or a thing shows the Directory first.
      html += sHtml + (contentFirst ? (cHtml + oHtml + lHtml) : (lHtml + cHtml + oHtml));
      if (r.nearest_fallback && it.place) html += '<div class="ves-note">Nothing in ' + esc(it.place.name) + ' yet. These are the closest, ' + esc(away(r.nearest_km)) + '.</div>';
      else if (!res.length && !hasContent(c) && !r.store) { html += '<div class="ves-note" data-ask="1">' + askNote(q).html + '</div>'; lastAsk = q; }
      list.innerHTML = html; list.hidden = false; input.setAttribute('aria-expanded', 'true'); cur = -1;
    }
    function run() {
      var q = input.value.trim(); if (q.length < 2) { close(); return; }
      if (q === last) { list.hidden = false; input.setAttribute('aria-expanded', 'true'); return; }
      if (ctl) ctl.abort(); ctl = window.AbortController ? new AbortController() : null;
      query(q, { limit: 6, contentLimit: 3, signal: ctl && ctl.signal }).then(function (r) { if (input.value.trim() !== q) return; last = q; draw(r, q); }).catch(function (e) { if (e && e.name === 'AbortError') return; });
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
        if (el && el.getAttribute('data-go')) { query(input.value.trim(), { limit: 1, log: true }).catch(function () {}); location.href = el.getAttribute('href'); }
        else submit();
      }
    });
    list.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('[data-ask-more]'); if (a) { e.preventDefault(); askCard(lastAsk || input.value.trim()); } });
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

  window.VESearch = { askCard: askCard, askNote: askNote, storeSay: storeSay, ago: ago, itemLine: itemLine, storeHref: storeHref, scanHref: SCAN_HREF, fmtTime: fmtTime, epTag: epTag, momentHref: momentHref, showHref: showHref, hasContent: hasContent, mount: mount, panel: panel, toggle: toggle, query: query, words: words, meta: meta, tile: tile, esc: esc, kmText: kmText, away: away, css: css, vid: vid };
})();
