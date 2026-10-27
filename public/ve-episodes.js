/* Podcast episodes, played on our page (Sean, 2026-10-27: "add an RSS of the podcast so that way it actually populates on their
 * listing... people can actually just listen to the episodes on our platform... they can save the episodes. But it's all pulling
 * from their RSS feed"). The episodes come from the show's own feed through the ve-podcast edge function; the audio streams from
 * the show's host. Used by the listing page's Episodes tab and My List's Episodes.
 *
 *   VEEpisodes.mount(el, { listing: {id, slug, name, logo_url}, onReady(total) })   the list (search, 20 a page, ?epage=),
 *       and one episode on its own view (?ep=<guid> in the address bar, Episodes / title to go back)
 *   VEEpisodes.play(ep, show)        plays in the player bar at the foot of the window (one at a time, keeps playing across tabs)
 *   VEEpisodes.save(listingId, guid) toggles a member's save; the Passport window for anyone else
 *   VEEpisodes.row(ep, show, opts)   one episode row's markup; VEEpisodes.css() adds the styles
 */
(function () {
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-podcast';
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function token() { try { return (window.VEAuth && VEAuth.getToken()) || localStorage.getItem('ve_token') || ''; } catch (e) { return ''; } }
  function call(body) {
    var h = { 'Content-Type': 'application/json' }, t = token(); if (t) h.Authorization = 'Bearer ' + t;
    return fetch(FN, { method: 'POST', headers: h, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  function when(iso) { if (!iso) return ''; var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  function len(s) { if (!s) return ''; var h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); if (m === 60) { h++; m = 0; } return h ? h + ' hr' + (m ? ' ' + m + ' min' : '') : m + ' min'; }
  var I = {
    play: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>',
    pause: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
    save: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
    saved: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
    x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };
  var STYLE = '.vep{font-family:Montserrat,sans-serif;color:#1a1a1a}' +
    '.vep-bar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:0 0 16px}.vep-bar input{flex:1 1 260px;font:inherit;font-size:14px;padding:10px 12px;border:1px solid rgba(0,0,0,.25);border-radius:6px}' +
    '.vep-count{font-size:12px;font-weight:700;color:rgba(26,26,26,.68)}' +
    '.vep-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(460px,100%),1fr));gap:12px}' +
    '.vep-row{display:grid;grid-template-columns:72px 1fr auto;gap:14px;align-items:start;border:1px solid rgba(0,0,0,.1);border-radius:10px;padding:12px;background:#fff}' +
    '.vep-img{width:72px;height:72px;border-radius:8px;background:#EAF7EA center/cover no-repeat}' +
    '.vep-t{font-size:14px;font-weight:800;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:#1a1a1a;text-decoration:none}' +
    'a.vep-t:hover{color:#1f5f22;text-decoration:underline}' +
    '.vep-meta{font-size:11.5px;font-weight:700;color:rgba(26,26,26,.68);margin:3px 0 4px}' +
    '.vep-sum{font-size:12.5px;line-height:1.5;color:rgba(26,26,26,.78);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
    '.vep-acts{display:flex;flex-direction:column;gap:6px}' +
    '.vep-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;font:inherit;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;border-radius:6px;padding:8px 12px;min-height:36px;cursor:pointer;border:1px solid rgba(0,0,0,.22);background:#fff;color:#1f5f22;white-space:nowrap}' +
    '.vep-btn.go{background:#1f5f22;border-color:#1f5f22;color:#fff}.vep-btn[aria-pressed=true]{background:#EAF7EA;border-color:#2d7d31}' +
    '.vep-pages{display:flex;justify-content:center;flex-wrap:wrap;gap:6px;margin-top:18px}.vep-pages button{min-width:38px;min-height:38px;padding:0 10px;font:inherit;font-size:13px;font-weight:800;border-radius:6px;border:1px solid rgba(0,0,0,.2);background:#fff;color:#1a1a1a;cursor:pointer}' +
    '.vep-pages button[aria-current=page]{background:#1f5f22;border-color:#1f5f22;color:#fff}.vep-pages .gap{align-self:center;padding:0 4px;color:rgba(26,26,26,.6)}' +
    '.vep-empty{font-size:13.5px;color:rgba(26,26,26,.7);padding:20px 0}' +
    '.vep-crumb{font-size:12.5px;font-weight:700;margin:0 0 16px;color:rgba(26,26,26,.68)}.vep-crumb button{background:none;border:0;padding:0;font:inherit;color:#1f5f22;cursor:pointer}.vep-crumb button:hover{text-decoration:underline}' +
    '.vep-one{display:grid;grid-template-columns:200px 1fr;gap:24px;align-items:start}.vep-one .vep-img{width:200px;height:200px;border-radius:12px}' +
    '.vep-one h2{font-size:22px;font-weight:900;line-height:1.25;margin:0 0 6px}.vep-one .vep-acts{flex-direction:row;flex-wrap:wrap;margin:14px 0 18px}' +
    '.vep-full{font-size:14px;line-height:1.7;color:rgba(26,26,26,.85);white-space:pre-line;max-width:860px}' +
    '@media(max-width:640px){.vep-row{grid-template-columns:56px 1fr}.vep-img{width:56px;height:56px}.vep-row .vep-acts{grid-column:1/-1;flex-direction:row}.vep-row .vep-acts .vep-btn{flex:1}' +
      '.vep-one{grid-template-columns:1fr}.vep-one .vep-img{width:140px;height:140px}}' +
    // The player bar, at the foot of the window.
    '#vep-player{position:fixed;left:0;right:0;bottom:0;z-index:9990;background:#fff;border-top:1px solid rgba(0,0,0,.14);box-shadow:0 -8px 24px rgba(0,0,0,.08);font-family:Montserrat,sans-serif;padding:10px 16px;display:grid;grid-template-columns:48px minmax(0,1fr) minmax(0,2fr) auto;gap:14px;align-items:center}' +
    '#vep-player .vep-img{width:48px;height:48px;border-radius:6px}#vep-player .pt{font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#vep-player .ps{font-size:11.5px;font-weight:700;color:rgba(26,26,26,.68);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#vep-player audio{width:100%;height:40px}#vep-player .vx{background:none;border:0;cursor:pointer;color:#1a1a1a;padding:8px;min-width:40px;min-height:40px}' +
    '@media(max-width:700px){#vep-player{grid-template-columns:44px minmax(0,1fr) auto;gap:10px}#vep-player audio{grid-column:1/-1;grid-row:2}#vep-player .vep-img{width:44px;height:44px}}' +
    '#vep-player.docked{position:static;border:1px solid rgba(0,0,0,.14);border-radius:10px;box-shadow:none;margin:0 0 16px}' +
    'body.vep-on{padding-bottom:84px}@media(max-width:700px){body.vep-on{padding-bottom:116px}}';
  function css() { if (document.getElementById('vep-css')) return; var s = document.createElement('style'); s.id = 'vep-css'; s.textContent = STYLE; document.head.appendChild(s); }

  // ---- the player ----
  var now = null; // {key, ep, show}
  function keyOf(ep, show) { return (show && show.id || '') + '|' + ep.guid; }
  function syncButtons() {
    var audio = document.querySelector('#vep-player audio'), playing = audio && !audio.paused;
    document.querySelectorAll('[data-vep-play]').forEach(function (b) {
      var on = now && b.getAttribute('data-vep-play') === now.key && playing;
      b.innerHTML = (on ? I.pause + 'Pause' : I.play + 'Play'); b.setAttribute('aria-label', (on ? 'Pause ' : 'Play ') + (b.getAttribute('data-title') || ''));
    });
  }
  function play(ep, show) {
    css();
    var key = keyOf(ep, show), bar = document.getElementById('vep-player');
    if (now && now.key === key && bar) { var a0 = bar.querySelector('audio'); if (a0.paused) a0.play(); else a0.pause(); return; }
    if (!bar) {
      bar = document.createElement('div'); bar.id = 'vep-player'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Episode player');
      // Inside the dashboard's frame the window's foot can be far off screen, so the player sits above the list instead.
      var dock = document.documentElement.classList.contains('ve-embedded') && document.querySelector('.vep-dock');
      if (dock) { bar.className = 'docked'; dock.appendChild(bar); } else document.body.appendChild(bar);
    }
    now = { key: key, ep: ep, show: show };
    bar.innerHTML = '<div class="vep-img" style="background-image:url(\'' + esc(ep.image || (show && show.image) || '') + '\')"></div>' +
      '<div style="min-width:0"><div class="pt">' + esc(ep.title) + '</div><div class="ps">' + esc((show && show.name) || '') + '</div></div>' +
      '<audio controls preload="metadata" src="' + esc(ep.audio) + '"></audio>' +
      '<button type="button" class="vx" aria-label="Close the player">' + I.x + '</button>';
    if (!bar.classList.contains('docked')) document.body.classList.add('vep-on');
    var audio = bar.querySelector('audio');
    ['play', 'pause', 'ended'].forEach(function (e) { audio.addEventListener(e, syncButtons); });
    bar.querySelector('.vx').onclick = function () { audio.pause(); bar.remove(); now = null; document.body.classList.remove('vep-on'); syncButtons(); };
    if ('mediaSession' in navigator && window.MediaMetadata) {
      try { navigator.mediaSession.metadata = new MediaMetadata({ title: ep.title, artist: (show && show.name) || '', artwork: (ep.image || (show && show.image)) ? [{ src: ep.image || show.image, sizes: '512x512' }] : [] }); } catch (e) {}
    }
    audio.play().catch(function () {}); syncButtons();
  }

  // ---- saving ----
  function save(listingId, guid, btn) {
    var m = window.VEAuth && VEAuth.getMember && VEAuth.getMember();
    if (!token() || !m || (m.membership_status !== 'active' && !m.is_superadmin)) { if (window.VEVotes && VEVotes.savePrompt) VEVotes.savePrompt(); else location.href = '/passport?from=save'; return Promise.resolve(null); }
    if (btn) btn.disabled = true;
    return call({ action: 'save', listing_id: listingId, guid: guid }).then(function (d) {
      if (btn) btn.disabled = false;
      if (d && d.why === 'members_only') { if (window.VEVotes && VEVotes.savePrompt) VEVotes.savePrompt(); return null; }
      if (!d || !d.ok) return null;
      if (window.veEpisodeSaved) window.veEpisodeSaved(listingId, guid, d.saved);
      document.querySelectorAll('[data-vep-save="' + CSS_ESC(listingId + '|' + guid) + '"]').forEach(function (b) { saveLook(b, d.saved); });
      return d.saved;
    }).catch(function () { if (btn) btn.disabled = false; return null; });
  }
  function CSS_ESC(s) { return window.CSS && window.CSS.escape ? window.CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&'); }
  function saveLook(b, on) { b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.innerHTML = (on ? I.saved + 'Saved' : I.save + 'Save'); }

  function row(ep, show, o) {
    o = o || {};
    var key = keyOf(ep, show), saved = !!o.saved;
    return '<div class="vep-row">' +
      '<div class="vep-img" style="background-image:url(\'' + esc(ep.image || show.image || '') + '\')" role="img" aria-label=""></div>' +
      '<div style="min-width:0">' +
        (o.href ? '<a class="vep-t" href="' + esc(o.href) + '" data-vep-open="' + esc(ep.guid) + '">' + esc(ep.title) + '</a>' : '<div class="vep-t">' + esc(ep.title) + '</div>') +
        '<div class="vep-meta">' + esc([o.showName ? show.name : '', when(ep.date), len(ep.duration)].filter(Boolean).join(' · ')) + '</div>' +
        (ep.summary ? '<div class="vep-sum">' + esc(ep.summary) + '</div>' : '') +
      '</div>' +
      '<div class="vep-acts"><button type="button" class="vep-btn go" data-vep-play="' + esc(key) + '" data-title="' + esc(ep.title) + '">' + I.play + 'Play</button>' +
        '<button type="button" class="vep-btn" data-vep-save="' + esc(show.id + '|' + ep.guid) + '" aria-pressed="' + saved + '">' + (saved ? I.saved + 'Saved' : I.save + 'Save') + '</button></div>' +
    '</div>';
  }

  // ---- the list and one episode ----
  function mount(el, opts) {
    css();
    var PER = 20, page = Math.max(1, parseInt(new URLSearchParams(location.search).get('epage'), 10) || 1);
    var L = opts.listing, show = { id: L.id, name: L.name, image: L.logo_url || '' }, saved = [], eps = [], total = 0, q = '', seq = 0;
    el.innerHTML = '<div class="vep-dock"></div><div class="vep"></div>'; var root = el.lastChild;
    function epParam() { return new URLSearchParams(location.search).get('ep') || ''; }
    function setEp(guid, push) {
      var u = new URL(location.href);
      if (guid) u.searchParams.set('ep', guid); else u.searchParams.delete('ep');
      if (u.href !== location.href) history[push ? 'pushState' : 'replaceState'](history.state, '', u.pathname + u.search + u.hash);
    }
    function wire(scope) {
      scope.querySelectorAll('[data-vep-play]').forEach(function (b) {
        b.onclick = function () { var g = b.getAttribute('data-vep-play').split('|').slice(1).join('|'); var ep = find(g); if (ep) play(ep, show); };
      });
      scope.querySelectorAll('[data-vep-save]').forEach(function (b) {
        b.onclick = function () { var g = b.getAttribute('data-vep-save').split('|').slice(1).join('|'); save(L.id, g, b).then(function (s) { if (s === true) saved.push(g); else if (s === false) saved = saved.filter(function (x) { return x !== g; }); }); };
      });
      scope.querySelectorAll('[data-vep-open]').forEach(function (a) {
        a.onclick = function (e) { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); openOne(a.getAttribute('data-vep-open'), true); };
      });
      syncButtons();
    }
    var cache = {};
    function find(g) { return cache[g] || eps.filter(function (e) { return e.guid === g; })[0]; }
    function hrefOf(g) { var u = new URL(location.href); u.searchParams.set('ep', g); return u.pathname + u.search; }

    function drawList() {
      root.innerHTML = '<div class="vep-bar"><input type="search" placeholder="Search episodes" aria-label="Search episodes" value="' + esc(q) + '"><span class="vep-count" aria-live="polite"></span></div>' +
        '<div class="vep-list"></div><div class="vep-pages"></div>';
      var input = root.querySelector('input'), t = null;
      input.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { q = input.value.trim(); go(1, false); }, 300); });
      paint();
    }
    function paint() {
      var list = root.querySelector('.vep-list'); if (!list) return;
      root.querySelector('.vep-count').textContent = total ? total + (total === 1 ? ' episode' : ' episodes') + (q ? ' match' : '') : '';
      list.innerHTML = eps.length ? eps.map(function (e) { return row(e, show, { saved: saved.indexOf(e.guid) >= 0, href: hrefOf(e.guid) }); }).join('')
        : '<div class="vep-empty">' + (q ? 'No episodes match that.' : 'No episodes yet.') + '</div>';
      // Page numbers: the first, the last and two either side of this one (the Directory's pager).
      var pages = Math.ceil(total / PER), nums = [], last = 0;
      for (var n = 1; n <= pages; n++) if (n === 1 || n === pages || Math.abs(n - page) <= 2) nums.push(n);
      root.querySelector('.vep-pages').innerHTML = pages > 1 ? '<nav aria-label="Episode pages" style="display:contents">' + nums.map(function (n) {
        var gap = n - last > 1 ? '<span class="gap">…</span>' : ''; last = n;
        return gap + '<button type="button" data-p="' + n + '"' + (n === page ? ' aria-current="page"' : '') + ' aria-label="Page ' + n + '">' + n + '</button>';
      }).join('') + '</nav>' : '';
      root.querySelectorAll('.vep-pages [data-p]').forEach(function (b) { b.onclick = function () { go(+b.getAttribute('data-p'), true); }; });
      wire(list);
    }
    function load(offset) {
      var my = ++seq;
      return call({ action: 'episodes', listing_id: L.id, q: q, offset: offset, limit: 20 }).then(function (d) {
        if (my !== seq) return d;
        if (!d || !d.ok) { root.innerHTML = '<div class="vep-empty">The episodes did not load. Try again in a moment.</div>'; return d; }
        if (d.show && d.show.image) show.image = d.show.image;
        if (d.saved) saved = d.saved;
        eps = d.episodes; total = d.total;
        eps.forEach(function (e) { cache[e.guid] = e; });
        paint(); return d;
      });
    }
    function go(n, scroll) {
      page = n;
      var u = new URL(location.href); if (n > 1) u.searchParams.set('epage', n); else u.searchParams.delete('epage');
      if (u.href !== location.href) history.replaceState(history.state, '', u.pathname + u.search + u.hash);
      load((n - 1) * PER).then(function () { if (scroll) toTop(); });
    }
    function toTop() {
      // Clear of the sticky menu (--ve-nav-h, set by nav.js).
      var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--ve-nav-h'), 10) || 72;
      var top = root.getBoundingClientRect().top;
      if (top < navH || top > window.innerHeight) window.scrollTo({ top: top + window.scrollY - navH - 16, behavior: 'smooth' });
    }
    function openOne(guid, push) {
      setEp(guid, push);
      root.innerHTML = '<div class="vep-empty">Loading the episode...</div>';
      call({ action: 'episode', listing_id: L.id, guid: guid }).then(function (d) {
        var ep = d && d.episode;
        if (!ep) { root.innerHTML = '<div class="vep-crumb"><button type="button">Episodes</button></div><div class="vep-empty">That episode is no longer in the show\'s feed.</div>'; root.querySelector('.vep-crumb button').onclick = back; return; }
        cache[ep.guid] = ep; if (d.show && d.show.image) show.image = d.show.image;
        if (d.saved && saved.indexOf(ep.guid) < 0) saved.push(ep.guid);
        root.innerHTML = '<nav class="vep-crumb" aria-label="Breadcrumb"><button type="button">Episodes</button> / ' + esc(ep.title) + '</nav>' +
          '<article class="vep-one"><div class="vep-img" style="background-image:url(\'' + esc(ep.image || show.image) + '\')" role="img" aria-label=""></div><div>' +
          '<h2>' + esc(ep.title) + '</h2><div class="vep-meta">' + esc([ep.season ? 'Season ' + ep.season : '', ep.episode ? 'Episode ' + ep.episode : '', when(ep.date), len(ep.duration)].filter(Boolean).join(' · ')) + '</div>' +
          '<div class="vep-acts"><button type="button" class="vep-btn go" data-vep-play="' + esc(keyOf(ep, show)) + '" data-title="' + esc(ep.title) + '">' + I.play + 'Play</button>' +
            '<button type="button" class="vep-btn" data-vep-save="' + esc(show.id + '|' + ep.guid) + '" aria-pressed="' + !!d.saved + '">' + (d.saved ? I.saved + 'Saved' : I.save + 'Save') + '</button>' +
            (ep.link ? '<a class="vep-btn" href="' + esc(ep.link) + '" target="_blank" rel="noopener">Show notes</a>' : '') + '</div>' +
          '<div class="vep-full">' + esc(ep.summary) + '</div></div></article>';
        root.querySelector('.vep-crumb button').onclick = back;
        wire(root);
        toTop();
      });
    }
    function back() { setEp('', true); drawList(); if (!eps.length) load((page - 1) * PER); }
    window.addEventListener('popstate', function () {
      var g = epParam(); if (!root.isConnected) return;
      if (g) openOne(g, false); else { drawList(); if (!eps.length) load((page - 1) * PER); }
    });

    var first = epParam();
    // The first page tells the page whether there is anything to show (no empty tab).
    return call({ action: 'episodes', listing_id: L.id, offset: (page - 1) * PER, limit: PER }).then(function (d) {
      if (d && d.ok) {
        if (d.show && d.show.image) show.image = d.show.image;
        saved = d.saved || []; eps = d.episodes || []; total = d.total || 0; eps.forEach(function (e) { cache[e.guid] = e; });
      }
      if (opts.onReady) opts.onReady(total, eps[0] || null, show);
      if (total && !eps.length && page > 1) { history.replaceState(history.state, '', location.pathname + location.search.replace(/[?&]epage=\d+/, '').replace(/^&/, '?') + location.hash); return mount(el, opts); }
      if (!total) return total;
      if (first) openOne(first, false); else drawList();
      return total;
    }).catch(function () { if (opts.onReady) opts.onReady(0); return 0; });
  }

  // My List: a member's saved episodes.
  function mine() { return call({ action: 'saves' }); }

  window.VEEpisodes = { mount: mount, play: play, save: save, row: row, css: css, mine: mine, when: when, len: len, saveLook: saveLook };
})();
