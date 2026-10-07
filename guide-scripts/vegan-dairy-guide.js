/* The Vegan Dairy Guide: access and the members-only screens (Sean, 2026-10-07).
 *
 * The Guide comes with the $11 Founding Membership. This page file holds only what
 * everyone sees: Start, the Learn preview and the "Get the Guide" slide. The rest
 * (Health and planet, See for yourself, Find, Swap, Make, Read, Keep going, and the
 * brand and swap data) is stored in ve_guides.content_html and handed out by
 * ve-guide-unlock ?action=open only to a member whose membership is active (or who
 * holds a ve_guide_purchases row). Signed out or not yet a member, the server sends
 * nothing, so view-source never shows the Guide.
 *
 * Joining reuses what the site already has: VEAuth.showAuthModal to create the account,
 * then the Founding Membership modal (VEAuth.showActivateModal -> ve-entry-checkout).
 * Checkout returns here with ?activate=success; ve-stripe-webhook flips the member to
 * active, and this script checks again until the Guide opens.
 *
 * To change the members-only screens, update ve_guides.content_html for slug
 * vegan-dairy-guide (the editorial source is the HQ playbook vegan-dairy-guide-content).
 * Never add them back to this repo: Vercel serves it, so anything here is public.
 */
(function () {
  var SLUG = 'vegan-dairy-guide';
  var UNLOCK_URL = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-guide-unlock';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var MEMBER_SLIDES = ['learn-2', 'door', 'look', 'find', 'swap', 'swap-2', 'make', 'read', 'end'];

  var stage = document.querySelector('.vg-stage');
  var unlockSlide = document.getElementById('unlock');
  var joinBtn = document.getElementById('dgJoin');
  var signInLine = document.getElementById('dgSignInLine');
  var statusEl = document.getElementById('dgStatus');

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function say(msg) { statusEl.textContent = msg || ''; }
  function auth() { return window.VEAuth || null; }
  function token() { var a = auth(); return a && a.isLoggedIn() ? a.getToken() : null; }

  function open(tok) {
    return fetch(UNLOCK_URL + '?action=open', {
      method: 'POST',
      headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, token: tok || undefined })
    }).then(function (r) { return r.json(); });
  }

  // Start the guided view once the slides are final. A link to a members-only slide
  // lands on "Get the Guide" when the Guide is locked.
  var started = false;
  function startGuided(locked) {
    if (started) return;
    started = true;
    var id = (location.hash || '').slice(1);
    if (locked && MEMBER_SLIDES.indexOf(id) >= 0) history.replaceState(null, '', location.pathname + location.search + '#unlock');
    if (locked) {
      [].forEach.call(document.querySelectorAll('#start [data-vg-go]'), function (b) {
        if (MEMBER_SLIDES.indexOf(b.getAttribute('data-vg-go')) < 0) return;
        b.setAttribute('data-vg-go', 'unlock');
        b.insertAdjacentHTML('beforeend', '<em class="dg-lock">With membership</em>');
      });
    }
    var s = document.createElement('script');
    s.src = '/public/ve-guided.js';
    document.body.appendChild(s);
  }

  function showGuide(html) {
    var tpl = document.createElement('template');
    tpl.innerHTML = html;
    var dataEl = tpl.content.getElementById('dg-data');
    var data = dataEl ? JSON.parse(dataEl.textContent) : { find: [], swap: [] };
    if (dataEl) dataEl.remove();
    unlockSlide.replaceWith(tpl.content);
    renderFind(data.find || []);
    renderSwap(data.swap || []);
    startGuided(false);
  }

  function showLocked(state) {
    // state: 'guest' (signed out) or 'pending' (account, no membership yet)
    signInLine.hidden = state !== 'guest';
    joinBtn.disabled = false;
    joinBtn.onclick = function () {
      var a = auth();
      if (!a) return;
      if (state === 'guest') {
        a.showAuthModal('Create your account. Then become a Founding Member and the Dairy Guide opens.', function () { location.reload(); }, 'signup');
      } else {
        a.showActivateModal('The Dairy Guide comes with the $11 Founding Membership, one time. It also opens the full community.');
      }
    };
    startGuided(true);
  }

  // Back from checkout: the webhook may take a few seconds to mark the membership active.
  function confirmAfterCheckout(tok, tries) {
    say('Confirming your membership...');
    joinBtn.disabled = true;
    open(tok).then(function (d) {
      if (d && d.unlocked && d.html) { showGuide(d.html); return; }
      if (tries > 0) { setTimeout(function () { confirmAfterCheckout(tok, tries - 1); }, 2500); return; }
      say('Your payment went through. Confirming can take a minute: refresh this page shortly and the Guide opens.');
      showLocked('pending');
    }).catch(function () { if (tries > 0) setTimeout(function () { confirmAfterCheckout(tok, tries - 1); }, 2500); else showLocked('pending'); });
  }

  function init() {
    var a = auth();
    // Super Admin "View As": a simulated visitor or member sees the locked page, and
    // nothing is read from the real account.
    var viewAs = a && a.getViewAs ? a.getViewAs() : null;
    if (viewAs) { showLocked(viewAs.mode === 'public' ? 'guest' : 'pending'); return; }

    var tok = token();
    if (!tok) { showLocked('guest'); return; }

    var params = new URLSearchParams(location.search);
    var back = params.get('activate');
    if (back) { params.delete('activate'); history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash); }
    if (back === 'success') { confirmAfterCheckout(tok, 8); return; }

    say('Checking your membership...');
    joinBtn.disabled = true;
    open(tok).then(function (d) {
      say('');
      if (d && d.unlocked && d.html) showGuide(d.html);
      else showLocked(d && d.loggedIn ? 'pending' : 'guest');
    }).catch(function () {
      say('We could not check your membership just now. Refresh to try again.');
      showLocked('pending');
    });
  }

  document.getElementById('dgSignIn').addEventListener('click', function (e) {
    e.preventDefault();
    var a = auth();
    if (a) a.showAuthModal('Sign in and the Dairy Guide opens if you are a member.', function () { location.reload(); }, 'login');
  });

  // ---- Members-only screens: the brand finder and the swap chart ----

  function renderFind(FIND) {
    var cat = 'All', q = '', page = 0, per = 12;
    var catsEl = document.getElementById('dgCats'), listEl = document.getElementById('dgBrands');
    var countEl = document.getElementById('dgCount'), searchEl = document.getElementById('dgSearch');
    var pagerEl = document.getElementById('dgPager');
    if (!catsEl) return;
    catsEl.innerHTML = ['All'].concat(FIND.map(function (c) { return c.cat; })).map(function (c) {
      return '<button type="button" class="dg-chip" data-cat="' + esc(c) + '" aria-pressed="' + (c === cat) + '">' + esc(c) + '</button>';
    }).join('');
    function matches() {
      var out = [];
      FIND.forEach(function (c) {
        if (cat !== 'All' && c.cat !== cat) return;
        c.items.forEach(function (it) {
          var hay = (it.b + ' ' + it.base + ' ' + c.cat).toLowerCase();
          if (!q || hay.indexOf(q) >= 0) out.push({ c: c.cat, it: it });
        });
      });
      return out;
    }
    function card(m) {
      var it = m.it;
      return '<div class="vg-glass dg-brand"><b>' + esc(it.b) + '</b>' +
        '<div class="dg-base">' + (cat === 'All' ? esc(m.c) + ' &middot; ' : '') + esc(it.base) + '</div>' +
        '<div class="dg-where">' + esc(it.where) + '</div>' +
        (it.note ? '<div class="dg-note">' + esc(it.note) + '</div>' : '') + '</div>';
    }
    // Desktop shows one page of cards that fits above the slide controls (nothing scrolls),
    // measured from a real card; phones show 12 a page.
    function fit() {
      if (window.innerWidth <= 900) return 12;
      var nav = document.querySelector('.vg-nav');
      var cols = getComputedStyle(listEl).gridTemplateColumns.split(' ').length || 1;
      var cardH = (listEl.firstElementChild && listEl.firstElementChild.offsetHeight) || 118;
      var slide = listEl.closest('.vg-slide'), stageEl = slide.parentNode;
      var bottom = nav ? nav.getBoundingClientRect().top : slide.getBoundingClientRect().bottom - 96;
      // The slide animates in from 6px below; measure from where it settles.
      var shift = slide.getBoundingClientRect().top - stageEl.getBoundingClientRect().top;
      var avail = bottom - (listEl.getBoundingClientRect().top - shift) - 66; // room for the pager row (12px gap plus the buttons)
      var rows = Math.max(1, Math.floor((avail + 14) / (cardH + 14)));
      return cols * rows;
    }
    function draw() {
      var all = matches();
      listEl.innerHTML = card({ c: 'x', it: { b: 'x', base: 'x', where: 'x' } });
      per = fit();
      var pages = Math.max(1, Math.ceil(all.length / per));
      if (page >= pages) page = pages - 1;
      var shown = all.slice(page * per, page * per + per);
      listEl.innerHTML = shown.map(card).join('') || '<p class="vg-fine">No match. Try another word or category.</p>';
      countEl.textContent = all.length + (all.length === 1 ? ' product' : ' products') + (pages > 1 ? ' · page ' + (page + 1) + ' of ' + pages : '') + ' · checked October 2026';
      pagerEl.innerHTML = pages > 1 ? '<button type="button" class="dg-chip" data-pg="-1"' + (page ? '' : ' disabled') + '>Previous</button><button type="button" class="dg-chip" data-pg="1"' + (page < pages - 1 ? '' : ' disabled') + '>More brands</button>' : '';
    }
    pagerEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pg]'); if (!b || b.disabled) return;
      page += +b.getAttribute('data-pg'); draw();
    });
    document.addEventListener('vg:change', function (e) { if (e.detail.id === 'find') draw(); });
    window.addEventListener('resize', function () { if (document.querySelector('#find.vg-active')) draw(); });
    catsEl.addEventListener('click', function (e) {
      var b = e.target.closest('.dg-chip'); if (!b) return;
      cat = b.getAttribute('data-cat');
      [].forEach.call(catsEl.children, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      page = 0; draw();
    });
    searchEl.addEventListener('input', function () { q = searchEl.value.trim().toLowerCase(); page = 0; draw(); });
    draw();
  }

  function renderSwap(SWAP) {
    [].forEach.call(document.querySelectorAll('[data-swap]'), function (tb) {
      var part = tb.getAttribute('data-swap') === '1' ? SWAP.slice(0, 8) : SWAP.slice(8);
      tb.innerHTML = part.map(function (r) {
        return '<tr><td>' + esc(r[0]) + '</td><td data-l="Shelf">' + esc(r[1]) + '</td><td data-l="Pantry">' + esc(r[2]) + '</td><td data-l="Tip">' + esc(r[3]) + '</td></tr>';
      }).join('');
    });
  }

  if (window.VEAuth) init(); else window.addEventListener('load', init);
})();
