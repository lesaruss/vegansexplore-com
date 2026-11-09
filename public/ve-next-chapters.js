/* ve-next-chapters.js: Where should we go next? (Sean, 2026-11-09, playbook ve-chapter-rankings: "a column that has 10 slots...
   chapters that are in the works... members can go in there and vote for what's the next chapter that we should open... suggest
   another location... It's more of a suggestion. It's not a guarantee").

   VENextChapters.beside(listEl)  wraps the chapter cards (VEChapters) in a layout with the board beside them: the chapters
   three-fourths on the left and the board one-fourth on the right on desktop; on phones the board comes first, showing the top 3
   with "See all", then the chapters. /communities and the dashboard's Communities tab both use it.
   VENextChapters.mount(el)       draws the board alone.
   Places are ve_next_chapters rows (a new place is a row); votes are ve-votes next_vote, once every 24 hours per member, like a
   chapter's; Suggest another place is ve-votes next_suggest (members, 3 a day, emailed to the team, added by hand). Signed out,
   Vote and Suggest open the members window (VEVotes). Load after /public/ve-auth.js. */
(function () {
  if (window.VENextChapters) return;
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-votes';
  var TOP = 10, PHONE_TOP = 3;
  var CSS = '.nx-layout{display:grid;grid-template-columns:minmax(0,3fr) minmax(300px,1fr);grid-template-areas:"main side";gap:28px;align-items:start}'
    + '.nx-layout>.nx-main{grid-area:main;min-width:0}.nx-layout>.nx-col{grid-area:side}'
    + '@media(max-width:1000px){.nx-layout{grid-template-columns:1fr;grid-template-areas:"side" "main";gap:20px}}'
    + '.nx-col{border:1px solid #e8e8e8;border-radius:12px;padding:18px 16px;position:sticky;top:calc(var(--ve-nav-h,64px) + 16px);background:#fff;font-family:Montserrat,sans-serif}'
    + '@media(max-width:1000px){.nx-col{position:static}}'
    + '.nx-eye{font:800 10px Montserrat,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--vb-accent-ink,#2d7a4f)}'
    + '.nx-col h2{font:900 20px/1.2 Montserrat,sans-serif;margin:4px 0 6px;color:#1a1a1a}'
    + '.nx-sub{font:600 12px/1.5 Montserrat,sans-serif;color:rgba(26,26,26,.7);margin:0 0 14px}'
    + '.nx-list{list-style:none;display:flex;flex-direction:column;gap:8px;margin:0;padding:0}'
    + '.nx-row{display:flex;align-items:center;gap:10px;border:1px solid #eee;border-radius:10px;padding:8px 10px}'
    + '.nx-rank{font:900 13px Montserrat,sans-serif;width:20px;text-align:center;color:rgba(26,26,26,.55)}'
    + '.nx-row.top3 .nx-rank{color:var(--vb-go,#2d7d31)}'
    + '.nx-ph{width:44px;height:44px;min-width:44px;border-radius:8px;background:#eef1ee center/cover no-repeat;display:flex;align-items:center;justify-content:center;color:#9aa89b}'
    + '.nx-info{flex:1;min-width:0}.nx-name{display:block;font:800 13px/1.25 Montserrat,sans-serif;color:#1a1a1a}'
    + '.nx-meta{display:block;font:600 11px Montserrat,sans-serif;color:rgba(26,26,26,.6);margin-top:2px}'
    + '.nx-right{display:flex;flex-direction:column;align-items:center;gap:4px}'
    + '.nx-count{font:900 15px Montserrat,sans-serif;line-height:1;color:#1a1a1a}'
    + '.nx-btn{font:800 10px Montserrat,sans-serif;letter-spacing:.1em;text-transform:uppercase;padding:6px 9px;min-width:56px;min-height:30px;border-radius:6px;background:var(--vb-soft,#f0faf4);color:var(--vb-accent-ink,#2d7a4f);border:1px solid var(--vb-line,#b6e5c8);cursor:pointer}'
    + '.nx-btn.on{background:var(--vb-go,#2d7d31);color:#fff;border-color:var(--vb-go,#2d7d31)}'
    + '.nx-h3{font:800 11px Montserrat,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:rgba(26,26,26,.55);margin:16px 0 8px}'
    + '.nx-more{display:none;width:100%;margin-top:10px;height:40px;border-radius:6px;border:1px solid #ddd;background:#fff;font:800 12px Montserrat,sans-serif;color:#1a1a1a;cursor:pointer}'
    + '@media(max-width:1000px){.nx-col.short .nx-hide{display:none}.nx-col.short .nx-more{display:block}}'
    + '.nx-suggest{display:block;width:100%;margin-top:14px;height:44px;border-radius:6px;border:1.5px dashed var(--vb-line,#b6e5c8);background:#fff;font:800 13px Montserrat,sans-serif;color:var(--vb-accent-ink,#2d7a4f);cursor:pointer}'
    + '.nx-form{margin-top:12px;display:flex;flex-direction:column;gap:8px}'
    + '.nx-form label{font:700 12px Montserrat,sans-serif;color:#1a1a1a}'
    + '.nx-form input,.nx-form textarea{width:100%;border:1.5px solid #e2e2e2;border-radius:6px;padding:10px 12px;font:600 14px Montserrat,sans-serif;box-sizing:border-box}'
    + '.nx-form textarea{min-height:72px;resize:vertical}'
    + '.nx-form .nx-send{height:42px;border-radius:6px;border:0;background:var(--vb-go,#2d7d31);color:#fff;font:800 13px Montserrat,sans-serif;cursor:pointer}'
    + '.nx-form .nx-note{font:600 11px/1.4 Montserrat,sans-serif;color:rgba(26,26,26,.6)}'
    + '.nx-empty{font:600 12px Montserrat,sans-serif;color:rgba(26,26,26,.6);padding:8px 0}';
  var PIN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function token() { try { return window.VEAuth && VEAuth.isLoggedIn() ? VEAuth.getToken() : null; } catch (e) { return null; } }
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
  function join() { votes().then(function (V) { if (V && V.passportPrompt) V.passportPrompt(); else location.href = '/survey?s=explorer'; }); }
  function toast(msg) {
    var el = document.getElementById('vch-toast');
    if (!el) { el = document.createElement('div'); el.id = 'vch-toast'; el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:100000;background:#1a1a1a;color:#fff;font:600 13px Montserrat,sans-serif;padding:12px 16px;border-radius:8px;max-width:calc(100vw - 32px)';
      document.body.appendChild(el); }
    el.textContent = msg; el.style.display = 'block'; clearTimeout(el._t); el._t = setTimeout(function () { el.style.display = 'none'; }, 3200);
  }
  function css() { if (document.getElementById('nx-css')) return; var s = document.createElement('style'); s.id = 'nx-css'; s.textContent = CSS; document.head.appendChild(s); }

  function mount(el) {
    css();
    var places = [], next = {}, open = false, formOpen = false;
    el.classList.add('nx-col', 'short');
    el.setAttribute('aria-label', 'Where should we go next?');

    function row(p, i) {
      var voted = !!next[p.slug];
      return '<li class="nx-row' + (i < 3 ? ' top3' : '') + (i >= PHONE_TOP ? ' nx-hide' : '') + '"><span class="nx-rank">' + (i + 1) + '</span><span class="nx-ph">' + PIN + '</span>' +
        '<span class="nx-info"><span class="nx-name">' + esc(p.name) + '</span><span class="nx-meta">' + esc(p.sub || '') + '</span></span>' +
        '<span class="nx-right"><span class="nx-count">' + Number(p.votes || 0).toLocaleString() + '</span>' +
        '<button type="button" class="nx-btn' + (voted ? ' on' : '') + '" data-nx-vote="' + esc(p.slug) + '" aria-label="Vote for ' + esc(p.name) + '">' + (voted ? 'Voted' : 'Vote') + '</button></span></li>';
    }
    function draw() {
      var list = places.slice().sort(function (a, b) { return (b.votes - a.votes) || (b.voters - a.voters) || (a.sort - b.sort); });
      var top = list.slice(0, TOP), rise = list.slice(TOP);
      el.classList.toggle('short', !open);
      el.innerHTML = '<div class="nx-eye">Coming next</div><h2>Where should we go next?</h2>' +
        '<p class="nx-sub">Vote for the next chapter, once a day for each place you want. Your votes guide us. They don\'t decide it: we may open somewhere because someone there is ready to lead.</p>' +
        (list.length ? '<ol class="nx-list">' + top.map(row).join('') + '</ol>' +
          (rise.length ? '<div class="nx-h3 nx-hide">Rising</div><ol class="nx-list nx-hide">' + rise.map(function (p, i) { return row(p, i + TOP); }).join('') + '</ol>' : '') +
          (list.length > PHONE_TOP ? '<button type="button" class="nx-more" data-nx-more>See all ' + list.length + ' places</button>' : '')
          : '<p class="nx-empty">Loading the places...</p>') +
        '<div class="' + (open ? '' : 'nx-hide') + '">' +
        (formOpen ? '<form class="nx-form" data-nx-form><label for="nx-place">Where should we open?</label><input id="nx-place" name="place" maxlength="120" required placeholder="A city, a state or a country">' +
          '<label for="nx-why">Why there? (optional)</label><textarea id="nx-why" name="why" maxlength="600" placeholder="Who is there, what is happening"></textarea>' +
          '<button type="submit" class="nx-send">Send it to our team</button><span class="nx-note">Our team reads every one. A place goes on the board once we add it.</span></form>'
          : '<button type="button" class="nx-suggest" data-nx-suggest>+ Suggest another place</button>') + '</div>';
    }

    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-nx-more]')) { open = true; draw(); return; }
      if (e.target.closest('[data-nx-suggest]')) { if (!token()) { join(); return; } formOpen = true; draw(); var i = el.querySelector('#nx-place'); if (i) i.focus(); return; }
      var vb = e.target.closest('[data-nx-vote]');
      if (!vb) return;
      e.preventDefault();
      if (!token()) { join(); return; }
      var slug = vb.getAttribute('data-nx-vote');
      if (next[slug]) { votes().then(function (V) { if (V && V.votedPrompt) V.votedPrompt(next[slug]); }); return; }
      vb.disabled = true;
      call({ action: 'next_vote', place: slug }, true).then(function (d) {
        vb.disabled = false;
        var p = places.filter(function (x) { return x.slug === slug; })[0];
        if (d.ok) { if (p) { p.votes = d.votes; } next[slug] = d.next_vote_at; draw(); toast('Thanks. Your vote counts for ' + (p ? p.name : 'that place') + '.'); }
        else if (d.error === 'already_voted') { next[slug] = d.next_vote_at; draw(); votes().then(function (V) { if (V && V.votedPrompt) V.votedPrompt(d.next_vote_at); }); }
        else if (d._status === 402) join();
        else toast(d.message || 'That vote did not go through. Try again.');
      }).catch(function () { vb.disabled = false; toast('That vote did not go through. Try again.'); });
    });
    el.addEventListener('submit', function (e) {
      var f = e.target.closest('[data-nx-form]'); if (!f) return;
      e.preventDefault();
      var btn = f.querySelector('.nx-send'), place = f.place.value.trim(), why = f.why.value.trim();
      if (place.length < 2) { f.place.focus(); return; }
      btn.disabled = true; btn.textContent = 'Sending...';
      call({ action: 'next_suggest', place: place, why: why }, true).then(function (d) {
        if (d.ok) { formOpen = false; draw(); toast('Thanks. Our team will read your suggestion.'); return; }
        btn.disabled = false; btn.textContent = 'Send it to our team';
        if (d._status === 402) join(); else toast(d.message || 'That did not send. Try again.');
      }).catch(function () { btn.disabled = false; btn.textContent = 'Send it to our team'; toast('That did not send. Try again.'); });
    });

    draw();
    call({ action: 'next_list' }).then(function (d) { places = d.places || []; draw(); }).catch(function () {});
    if (token()) call({ action: 'next_today' }, true).then(function (d) { next = (d && d.next) || {}; draw(); }).catch(function () {});
    return { redraw: draw };
  }

  // The chapter cards and the board side by side; the board first on phones.
  function beside(listEl) {
    css();
    if (!listEl || listEl.parentNode.classList.contains('nx-main')) return null;
    var wrap = document.createElement('div'); wrap.className = 'nx-layout';
    var main = document.createElement('div'); main.className = 'nx-main';
    var side = document.createElement('aside');
    listEl.parentNode.insertBefore(wrap, listEl);
    wrap.appendChild(side); wrap.appendChild(main); main.appendChild(listEl);
    return mount(side);
  }

  window.VENextChapters = { mount: mount, beside: beside };
})();
