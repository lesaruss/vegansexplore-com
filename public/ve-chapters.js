/* ve-chapters.js: the communities as Directory cards (Sean, 2026-11-01: "The community should be set up like they're in a directory
   listing... you can vote for them, you could save them. You see the little icon on the left-hand side of the city. And then when you
   click on it, you go to that particular city").

   VEChapters.mount(el, { onSave(slug, saved) })  draws every chapter in VE_HUBS (after /public/ve-hubs.js) as a card: the chapter's
   art as a square on the left, its name, where it is, its places, upcoming events and members, the votes over Votes, and Save.
   A search and Sort by (Most votes, Most places, A to Z) sit over the cards. The whole card opens /communities/<slug> as its own
   page, never in a frame. Votes are ve-votes chapter_vote (once every 24 hours, members); Save is joining the chapter (ve-auth
   join_community / leave_community), so saved chapters are the member's communities. Signed out, Vote and Save open the
   Passport window (VEVotes). Numbers come from ve-votes chapter_stats.
   A city hub shows its own card on its Overview: { only: [slug], bar: false, url: false, here: true } (no search, no link out).
   Sort by Traffic (Sean, 2026-11-09) ranks by ve_chapter_stats' traffic, a rank only (podcast downloads and web visitors from the chapter,
   kept internal); a super admin gets Insights on each card, opening BrandDesk > Vegans Explore > Insights > Chapters for it. */
(function () {
  if (window.VEChapters) return;
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-votes';
  var WHERE = { FL: 'Florida', GA: 'Georgia', DC: 'Washington, D.C.', DE: 'Delaware', MD: 'Maryland', VA: 'Virginia', WV: 'West Virginia',
    NY: 'New York', PA: 'Pennsylvania', CA: 'California', WA: 'Washington', OR: 'Oregon', TX: 'Texas', CO: 'Colorado', MA: 'Massachusetts', GB: 'United Kingdom' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function token() { try { return window.VEAuth && VEAuth.isLoggedIn() ? VEAuth.getToken() : null; } catch (e) { return null; } }
  function me() { try { return window.VEAuth && VEAuth.isLoggedIn() ? VEAuth.getMember() : null; } catch (e) { return null; } }
  function call(body, auth) {
    var h = { 'Content-Type': 'application/json' }, t = auth && token();
    if (t) h.Authorization = 'Bearer ' + t;
    return fetch(FN, { method: 'POST', headers: h, body: JSON.stringify(body) }).then(function (r) { return r.json().then(function (d) { d._status = r.status; return d; }); });
  }
  function votes() {
    if (window.VEVotes) return Promise.resolve(window.VEVotes);
    return new Promise(function (res) {
      var s = document.createElement('script'); s.src = '/public/ve-votes.js';
      s.onload = function () { res(window.VEVotes || null); }; s.onerror = function () { res(null); };
      document.head.appendChild(s);
    });
  }
  function authLoad() {
    if (window.VEAuth) return Promise.resolve();
    return new Promise(function (res) {
      var s = document.createElement('script'); s.src = '/public/ve-auth.js';
      s.onload = res; s.onerror = res; document.head.appendChild(s);
    });
  }
  function n(x) { return Number(x || 0).toLocaleString(); }
  function admin() { var m = me(); return !!(m && m.is_superadmin); }
  var HQ = 'https://hq.lesaruss.ai/branddesk/brands/vegans-explore?view=insights&in=chapters&place=chapter:';

  var CSS = '.vch-bar[hidden]{display:none!important}.vch-bar{display:flex;gap:10px;align-items:center;margin:0 0 16px;flex-wrap:wrap}'
    + '.vch-bar input{flex:1 1 220px;min-width:0;height:44px;border:1.5px solid #e2e2e2;border-radius:6px;padding:0 14px;font:600 14px Montserrat,sans-serif}'
    + '.vch-bar select{height:44px;border:1.5px solid #e2e2e2;border-radius:6px;padding:0 44px 0 14px;font:700 13px Montserrat,sans-serif;background:#fff url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%278%27%3E%3Cpath d=%27M1 1l5 5 5-5%27 stroke=%27%23333%27 stroke-width=%272%27 fill=%27none%27/%3E%3C/svg%3E") no-repeat right 16px center;appearance:none;-webkit-appearance:none;color:#1a1a1a}'
    + '.vch-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(340px,100%),1fr));gap:12px}'
    + '.vch-card{background:#fff;border:1px solid #e8e8e8;border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:14px;cursor:pointer;text-decoration:none;color:inherit;min-width:0;transition:border-color .15s}'
    + '.vch-card:hover,.vch-card:focus-within{border-color:var(--vb-go,#3A9B3E)}'
    + '.vch-link{color:inherit;text-decoration:none}.vch-link:focus-visible{outline:3px solid #22C55E;outline-offset:2px}'
    + '.vch-av{width:64px;height:64px;min-width:64px;border-radius:10px;background:#1a1a1a center/cover no-repeat}'
    + '.vch-info{flex:1;min-width:0}'
    + '.vch-name{font-size:15px;font-weight:800;color:#1a1a1a;line-height:1.25;display:flex;align-items:center;gap:6px;flex-wrap:wrap}'
    + '.vch-mine{font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--vb-accent-ink,#2d7a4f);background:var(--vb-soft,#f0faf4);border:1px solid var(--vb-line,#b6e5c8);border-radius:20px;padding:2px 8px}'
    + '.vch-meta{font-size:12px;font-weight:600;color:rgba(26,26,26,.6);margin-top:2px}'
    + '.vch-nums{font-size:11px;font-weight:700;color:rgba(26,26,26,.75);margin-top:5px;display:flex;gap:10px;flex-wrap:wrap}'
    + '.vch-right{display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0}'
    + '.vch-count{font-size:18px;font-weight:900;color:#1a1a1a;line-height:1}'
    + '.vch-btn{font:800 9.5px Montserrat,sans-serif;letter-spacing:.08em;text-transform:uppercase;padding:4px 8px;min-width:58px;min-height:24px;text-align:center;text-decoration:none;display:inline-block;box-sizing:border-box;line-height:16px;border-radius:6px;background:var(--vb-soft,#f0faf4);color:var(--vb-accent-ink,#2d7a4f);border:1px solid var(--vb-line,#b6e5c8);cursor:pointer;white-space:nowrap}'
    + '.vch-btn.on{background:var(--vb-go,#2d7d31);color:#fff;border-color:var(--vb-go,#2d7d31)}'
    + '.vch-btn.save{background:#fff;color:#1a1a1a;border-color:#ddd}'
    + '.vch-btn.save.on{background:#1a1a1a;color:#fff;border-color:#1a1a1a}'
    + '.vch-btn.ins{background:#fff;color:var(--vb-accent-ink,#2d7a4f);border-color:var(--vb-line,#b6e5c8)}'
    + '.vch-card.here{cursor:default}'
    + '@media(max-width:600px){.vch-card{padding:12px;gap:12px}.vch-av{width:56px;height:56px;min-width:56px}}'
    + '.vch-empty{color:rgba(26,26,26,.6);font-weight:600;padding:20px 0}'
    + '.vch-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:100000;background:#1a1a1a;color:#fff;font:600 13px Montserrat,sans-serif;padding:12px 16px;border-radius:8px;max-width:calc(100vw - 32px)}';

  function css() {
    if (document.getElementById('vch-css')) return;
    var s = document.createElement('style'); s.id = 'vch-css'; s.textContent = CSS; document.head.appendChild(s);
  }
  var tt;
  function toast(t) {
    var el = document.getElementById('vch-toast');
    if (!el) { el = document.createElement('div'); el.id = 'vch-toast'; el.className = 'vch-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = t; el.hidden = false; clearTimeout(tt); tt = setTimeout(function () { el.hidden = true; }, 3200);
  }

  function mount(el, opts) {
    opts = opts || {};
    if (typeof el === 'string') el = document.getElementById(el);
    if (!el || !window.VE_HUBS) return null;
    css();
    var stats = {}, next = {}, state = { q: '', sort: 'votes' };
    try { var p = new URLSearchParams(location.search); state.q = p.get('q') || ''; if (/^(votes|traffic|places|az)$/.test(p.get('sort') || '')) state.sort = p.get('sort'); } catch (e) {}
    el.innerHTML = (opts.bar === false ? '<div class="vch-bar" hidden>' : '<div class="vch-bar">') + '<label style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)" for="vch-q">Search communities</label>' +
      '<input type="search" id="vch-q" placeholder="Search communities by city or state" autocomplete="off" value="' + esc(state.q) + '">' +
      '<select id="vch-sort" aria-label="Sort by"><option value="votes">Most votes</option><option value="traffic">Traffic</option><option value="places">Most places</option><option value="az">A to Z</option></select></div>' +
      '<div class="vch-grid" role="list"></div>';
    var grid = el.querySelector('.vch-grid'), qIn = el.querySelector('#vch-q'), sortSel = el.querySelector('#vch-sort');
    sortSel.value = state.sort;

    function saved() { var m = me(); return (m && m.communities) || []; }
    function writeUrl() {
      if (opts.url === false) return;
      try {
        var u = new URL(location.href);
        if (state.q) u.searchParams.set('q', state.q); else u.searchParams.delete('q');
        if (state.sort !== 'votes') u.searchParams.set('sort', state.sort); else u.searchParams.delete('sort');
        history.replaceState(history.state, '', u.pathname + u.search + u.hash);
      } catch (e) {}
    }
    function draw() {
      var mine = saved(), q = state.q.toLowerCase().trim();
      var list = VE_HUBS.filter(function (h) {
        if (opts.only && opts.only.indexOf(h.slug) < 0) return false;
        if (!q) return true;
        var hay = (h.name + ' ' + (WHERE[h.state] || '') + ' ' + ((h.page && h.page.area) || '') + ' ' + (h.places || []).join(' ')).toLowerCase();
        return q.split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; });
      });
      list.sort(function (a, b) {
        var sa = stats[a.slug] || {}, sb = stats[b.slug] || {};
        if (state.sort === 'az') return a.name.localeCompare(b.name);
        if (state.sort === 'traffic') return (sa.traffic || 1e9) - (sb.traffic || 1e9) || (sb.votes || 0) - (sa.votes || 0) || a.name.localeCompare(b.name);
        if (state.sort === 'places') return (sb.places || 0) - (sa.places || 0) || a.name.localeCompare(b.name);
        return (sb.votes || 0) - (sa.votes || 0) || (sb.places || 0) - (sa.places || 0) || a.name.localeCompare(b.name);
      });
      if (!list.length) { grid.innerHTML = '<p class="vch-empty">No community matches that. Try a city or a state.</p>'; return; }
      grid.innerHTML = list.map(function (h) {
        var s = stats[h.slug] || {}, v = s.votes || 0, on = mine.indexOf(h.slug) >= 0, voted = !!next[h.slug];
        var where = h.state === 'GB' ? 'United Kingdom' : h.state === 'DC' ? 'United States' : (WHERE[h.state] || '') + ', United States';
        return '<div class="vch-card' + (opts.here ? ' here' : '') + '" role="listitem" data-slug="' + esc(h.slug) + '">' +
          '<span class="vch-av" style="background-image:url(\'' + esc(window.VEImg ? VEImg((h.page && h.page.banner) || '', 160) : ((h.page && h.page.banner) || '')) + '\')" aria-hidden="true"></span>' +
          '<span class="vch-info"><span class="vch-name"><a class="vch-link" href="/communities/' + esc(h.slug) + '">' + esc(h.name) + '</a>' + (on ? ' <span class="vch-mine">Saved</span>' : '') + '</span>' +
          '<span class="vch-meta" style="display:block">' + esc(where) + '</span>' +
          '<span class="vch-nums">' + (s.places != null ? '<span>' + n(s.places) + (s.places === 1 ? ' place' : ' places') + '</span><span>' + n(s.events) + (s.events === 1 ? ' event' : ' events') + ' coming up</span>' +
            (s.members ? '<span>' + n(s.members) + (s.members === 1 ? ' member' : ' members') + '</span>' : '') : '<span>&nbsp;</span>') + '</span></span>' +
          '<span class="vch-right"><span class="vch-count">' + n(v) + '</span>' +
          '<button type="button" class="vch-btn' + (voted ? ' on' : '') + '" data-vch-vote="' + esc(h.slug) + '" aria-label="Vote for ' + esc(h.name) + '">' + (voted ? 'Voted' : (v === 1 ? 'Vote' : 'Votes')) + '</button>' +
          '<button type="button" class="vch-btn save' + (on ? ' on' : '') + '" data-vch-save="' + esc(h.slug) + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Saved: ' : 'Save ') + esc(h.name) + '">' + (on ? 'Saved' : 'Save') + '</button>' +
          (admin() && !opts.here ? '<a class="vch-btn ins" href="' + HQ + esc(h.slug) + '" target="_blank" rel="noopener" aria-label="Insights for ' + esc(h.name) + '">Insights</a>' : '') + '</span></div>';
      }).join('');
    }

    grid.addEventListener('click', function (e) {
      var vb = e.target.closest('[data-vch-vote]'), sb = e.target.closest('[data-vch-save]');
      if (!vb && !sb) {
        var card = e.target.closest('.vch-card');
        if (!card || e.target.closest('a') || opts.here) return;
        location.href = '/communities/' + card.getAttribute('data-slug');
        return;
      }
      e.preventDefault(); e.stopPropagation();
      // A page that did not load ve-auth.js (the cause of Brion Hurley's report, 2026-11-08): with a stored session, load it
      // and try the click again rather than calling a signed-in member signed out.
      if (!window.VEAuth && localStorage.getItem('ve_token')) {
        var tgt = vb || sb;
        authLoad().then(function () { if (window.VEAuth) tgt.click(); });
        return;
      }
      if (!token()) { votes().then(function (V) { if (!V) { location.href = '/passport'; return; } vb ? V.passportPrompt() : V.savePrompt(); }); return; }
      if (vb) {
        var slug = vb.getAttribute('data-vch-vote');
        if (next[slug]) { votes().then(function (V) { if (V && V.votedPrompt) V.votedPrompt(next[slug]); }); return; }
        vb.disabled = true;
        call({ action: 'chapter_vote', chapter: slug }, true).then(function (d) {
          vb.disabled = false;
          if (d.ok) { stats[slug] = Object.assign({}, stats[slug], { votes: d.votes }); next[slug] = d.next_vote_at; draw(); toast('Thanks. Your vote counts for ' + (VE_HUBS.filter(function (h) { return h.slug === slug; })[0] || {}).name + '.'); }
          else if (d.error === 'already_voted') { next[slug] = d.next_vote_at; draw(); votes().then(function (V) { if (V && V.votedPrompt) V.votedPrompt(d.next_vote_at); }); }
          else if (d._status === 402) votes().then(function (V) { V ? V.passportPrompt() : (location.href = '/passport'); });
          else toast('That vote did not go through. Try again.');
        }).catch(function () { vb.disabled = false; toast('That vote did not go through. Try again.'); });
        return;
      }
      var s2 = sb.getAttribute('data-vch-save'), on = saved().indexOf(s2) >= 0;
      sb.disabled = true;
      (on ? VEAuth.leaveCommunity(s2) : VEAuth.joinCommunity(s2)).then(function (d) {
        sb.disabled = false;
        if (d && d.error) { if (/payment|passport|member/i.test(d.error + ' ' + (d.message || ''))) votes().then(function (V) { if (V) V.savePrompt(); }); else toast(d.message || 'That did not save. Try again.'); return; }
        var st = stats[s2] = Object.assign({}, stats[s2]); st.members = Math.max(0, (st.members || 0) + (on ? -1 : 1));
        draw(); toast(on ? 'Removed from your communities.' : 'Saved. It is one of your communities now.');
        if (opts.onSave) opts.onSave(s2, !on, (d && d.communities) || saved());
      }).catch(function () { sb.disabled = false; toast('That did not save. Try again.'); });
    });
    var qt;
    qIn.addEventListener('input', function () { clearTimeout(qt); qt = setTimeout(function () { state.q = qIn.value; writeUrl(); draw(); }, 120); });
    sortSel.addEventListener('change', function () { state.sort = sortSel.value; writeUrl(); draw(); });

    draw();
    call({ action: 'chapter_stats' }).then(function (d) { (d.chapters || []).forEach(function (r) { stats[r.chapter] = r; }); draw(); }).catch(function () {});
    if (!window.VEAuth && localStorage.getItem('ve_token')) authLoad().then(function () { draw(); if (token()) call({ action: 'chapter_today' }, true).then(function (d) { next = (d && d.next) || {}; draw(); }).catch(function () {}); });
    else if (token()) call({ action: 'chapter_today' }, true).then(function (d) { next = (d && d.next) || {}; draw(); }).catch(function () {});
    return { redraw: draw };
  }
  window.VEChapters = { mount: mount };
})();
