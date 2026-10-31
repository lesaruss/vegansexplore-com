/* The creator ad and "Is this you?" on People pages, and the steps of a promotion, tracked from the page it was clicked on
 * (Sean, 2026-10-30: "an ad for content creators to register using the animated style... see who's clicking on it, how many people
 * click through, follow their journey... which channels are showing up the most... somebody signed up because they went through
 * Brooke's page and became a creator on her page").
 *
 *   VEPromo.creatorCards(el, {page, listing_id, name, claim})   the animated ad (Kai, in our illustration style) and, when claim is
 *                                                               set, "Is this you, <first name>?" above it
 *                                                               (form: true, for People who are not creators, opens a short claim
 *                                                               request in the card instead: name, email, a link that shows it is
 *                                                               them, a note; ve-ambassador person_claim, promo 'profile-claim')
 *   VEPromo.step(promo, step)          'landed' or 'started' on the destination, sent with where the visitor clicked
 *   VEPromo.source(promo)              {page, listing_id, cta, claim, claim_name, channel, visitor} for the application, or null
 *
 * Steps go to ve_promo_track (migration 20261030_promo_funnel.sql): view (the card on screen), click, landed, started; ve-ambassador
 * adds sent and accepted. The click is kept 30 days (localStorage ve_promo_<promo>), the last one wins. The channel is how this visit
 * came in (sessionStorage ve_landing, set by nav.js). Bots and previews are not counted. Read in Depot > Ambassadors > Where they
 * came from. */
(function () {
  if (window.VEPromo) return;
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var KEEP_MS = 30 * 864e5;
  var BOT = /bot|crawl|spider|preview|HeadlessChrome|Lighthouse/i.test(navigator.userAgent || '');
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // The same visitor id as the referral count (ve-auth.js refVisit).
  function visitor() {
    try {
      var v = localStorage.getItem('ve_visitor');
      if (!v || !/^[A-Za-z0-9-]{8,64}$/.test(v)) { v = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2, 12); localStorage.setItem('ve_visitor', v); }
      return v;
    } catch (e) { return ''; }
  }
  function landing() { try { return JSON.parse(sessionStorage.getItem('ve_landing') || '{}') || {}; } catch (e) { return {}; } }
  function kept(promo) {
    try { var s = JSON.parse(localStorage.getItem('ve_promo_' + promo) || 'null'); return s && Date.now() - (s.at || 0) < KEEP_MS ? s : null; } catch (e) { return null; }
  }
  function send(promo, step, ctx) {
    var v = visitor(); if (BOT || !v) return;
    var L = landing();
    try {
      fetch(SB + '/rest/v1/rpc/ve_promo_track', { method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: 'Bearer ' + ANON },
        body: JSON.stringify({ p_promo: promo, p_step: step, p_visitor: v, p_page: ctx.page || null, p_listing: ctx.listing_id || null,
          p_cta: ctx.cta || null, p_channel: ctx.channel || L.channel || null, p_vl: ctx.vl || L.vl || null }) }).catch(function () {});
    } catch (e) {}
  }
  function click(promo, ctx) {
    var L = landing();
    var src = { page: ctx.page, listing_id: ctx.listing_id || null, cta: ctx.cta, claim: ctx.claim || '', claim_name: ctx.claim_name || '',
      channel: L.channel || '', vl: L.vl || '', at: Date.now() };
    try { localStorage.setItem('ve_promo_' + promo, JSON.stringify(src)); } catch (e) {}
    send(promo, 'click', src);
  }
  function step(promo, st) {
    var s = kept(promo) || {};
    send(promo, st, { page: s.page || null, listing_id: s.listing_id, cta: s.cta, channel: s.channel, vl: s.vl });
  }
  function source(promo) {
    var s = kept(promo), L = landing();
    return { page: s ? s.page : '', listing_id: s ? s.listing_id : null, cta: s ? s.cta : '', claim: s ? s.claim : '',
      claim_name: s ? s.claim_name : '', channel: (s && s.channel) || L.channel || '', visitor: visitor() };
  }
  // Counts a card once it is on screen, once a page.
  function onScreen(el, fn) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); fn(); } }, { threshold: 0.5 });
    io.observe(el);
  }

  var CSS = '' +
    '.vpc{display:flex;flex-direction:column;gap:12px;margin-bottom:14px}' +
    '.vpc-claim{border:1px solid var(--vb-line,#d6e9dc);background:var(--vb-soft,#f1f8f3);border-radius:8px;padding:14px 16px}' +
    '.vpc-claim b{display:block;font-size:14px;font-weight:800;color:#111;margin:0 0 4px}' +
    '.vpc-claim p{font-size:12.5px;line-height:1.55;color:rgba(0,0,0,.68);margin:0 0 10px}' +
    '.vpc-claim a{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;color:var(--vb-accent-ink,#14532d);border:1px solid var(--vb-accent,#16a34a);border-radius:6px;padding:8px 14px;background:#fff}' +
    '.vpc-ad{display:block;position:relative;border-radius:8px;overflow:hidden;text-decoration:none;color:#fff;background:#0f1f17;aspect-ratio:4/5;max-height:440px;box-shadow:0 2px 10px rgba(0,0,0,.12)}' +
    '.vpc-ad:focus-visible{outline:3px solid var(--vb-accent,#16a34a);outline-offset:2px}' +
    '.vpc-f{position:absolute;inset:0;background-size:cover;background-position:center 20%;opacity:0;animation:vpcF 16s infinite}' +
    '.vpc-f:nth-child(1){animation-delay:0s}.vpc-f:nth-child(2){animation-delay:4s}.vpc-f:nth-child(3){animation-delay:8s}.vpc-f:nth-child(4){animation-delay:12s}' +
    '@keyframes vpcF{0%{opacity:0;transform:scale(1.02)}5%{opacity:1}25%{opacity:1}30%{opacity:0;transform:scale(1.12)}100%{opacity:0}}' +
    '.vpc-ad:after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.86) 0%,rgba(0,0,0,.55) 40%,rgba(0,0,0,0) 66%)}' +
    '.vpc-copy{display:block;position:absolute;left:0;right:0;bottom:0;padding:16px;z-index:1}' +
    '.vpc-copy small{display:block;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#bef264;margin:0 0 6px}' +
    '.vpc-lines{display:block;position:relative;height:26px;margin:0 0 4px}' +
    '.vpc-lines b{position:absolute;left:0;right:0;top:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:20px;font-weight:900;line-height:1.2;opacity:0;animation:vpcT 16s infinite;text-shadow:0 1px 3px rgba(0,0,0,.5)}' +
    '.vpc-lines b:nth-child(1){animation-delay:0s}.vpc-lines b:nth-child(2){animation-delay:4s}.vpc-lines b:nth-child(3){animation-delay:8s}.vpc-lines b:nth-child(4){animation-delay:12s}' +
    '@keyframes vpcT{0%{opacity:0;transform:translateY(8px)}5%{opacity:1;transform:none}25%{opacity:1}30%{opacity:0;transform:translateY(-6px)}100%{opacity:0}}' +
    '.vpc-copy p{font-size:12.5px;line-height:1.5;margin:0 0 12px;color:rgba(255,255,255,.92);text-shadow:0 1px 2px rgba(0,0,0,.5)}' +
    '.vpc-copy em{display:block;text-align:center;font-style:normal;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;background:var(--vb-go,#22c55e);color:#062b14;border-radius:6px;padding:11px 12px}' +
    '.vpc-ad:hover em{background:var(--vb-go-hover,#16a34a);color:#fff}' +
    '.vpc-claim button.vpc-open{font:inherit;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--vb-accent-ink,#14532d);border:1px solid var(--vb-accent,#16a34a);border-radius:6px;padding:8px 14px;background:#fff;cursor:pointer}' +
    '.vpc-form label{display:block;font-size:11.5px;font-weight:700;color:#333;margin:0 0 8px}' +
    '.vpc-form input,.vpc-form textarea{display:block;width:100%;box-sizing:border-box;margin-top:4px;font:inherit;font-size:13px;font-weight:400;border:1px solid #cfd8d2;border-radius:6px;padding:8px 10px;background:#fff;color:#111}' +
    '.vpc-form textarea{min-height:56px;resize:vertical}' +
    '.vpc-form input[aria-invalid=true]{border-color:#b42318}' +
    '.vpc-acts{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:4px}' +
    '.vpc-acts button{font:inherit;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;border-radius:6px;padding:9px 14px;cursor:pointer}' +
    '.vpc-send{background:var(--vb-go,#22c55e);color:#062b14;border:1px solid var(--vb-go,#22c55e)}.vpc-send:disabled{opacity:.6;cursor:default}' +
    '.vpc-cancel{background:#fff;color:#333;border:1px solid #cfd8d2}' +
    '.vpc-msg{font-size:12px;color:#b42318;margin:6px 0 0}.vpc-done{font-size:12.5px;line-height:1.55;color:#14532d;margin:0}' +
    '@media(prefers-reduced-motion:reduce){.vpc-f,.vpc-lines b{animation:none}.vpc-f:first-child,.vpc-lines b:first-child{opacity:1}}';
  var FRAMES = [['/gigs/sample/img/post-kitchen.webp', 'Cook for the camera'], ['/gigs/sample/img/post-event.webp', 'Host our events'],
    ['/gigs/sample/img/post-market.webp', 'Tell local stories'], ['/gigs/sample/img/post-protein.webp', 'Work with Vegan brands']];

  function creatorCards(el, ctx) {
    if (!el || !ctx) return;
    if (!document.getElementById('vpc-css')) { var st = document.createElement('style'); st.id = 'vpc-css'; st.textContent = CSS; document.head.appendChild(st); }
    var first = String(ctx.name || '').split(/\s+/)[0];
    var page = ctx.page || location.pathname;
    var claimHref = '/gigs/sample?claim=' + encodeURIComponent(ctx.claim || '') + '#join/1';
    el.innerHTML = '<div class="vpc">' +
      (ctx.claim && ctx.form ? '<div class="vpc-claim" data-vpc="claim"><b>Is this you' + (first ? ', ' + esc(first) : '') + '?</b>' +
        '<div class="vpc-body"><p>Claim your profile. Tell us it is you, and once our team confirms it, your profile is linked to your account and kept up to date with you.</p>' +
        '<button type="button" class="vpc-open">Claim your profile</button></div></div>' : '') +
      (ctx.claim && !ctx.form ? '<div class="vpc-claim" data-vpc="claim"><b>Is this you' + (first ? ', ' + esc(first) : '') + '?</b>' +
        '<p>Claim your profile. Once our team confirms it is you, keep it up to date, and get matched with paid work as one of our official creators.</p>' +
        '<a href="' + esc(claimHref) + '" data-vpc-go="claim">Claim your profile</a></div>' : '') +
      '<a class="vpc-ad" href="/gigs/sample#overview" data-vpc="ad" data-vpc-go="ad" aria-label="Become an official Vegans Explore creator">' +
        FRAMES.map(function (f) { return '<span class="vpc-f" style="background-image:url(\'' + f[0] + '\')" aria-hidden="true"></span>'; }).join('') +
        '<span class="vpc-copy"><small>Vegans Explore creators</small><span class="vpc-lines" aria-hidden="true">' +
          FRAMES.map(function (f) { return '<b>' + esc(f[1]) + '</b>'; }).join('') + '</span>' +
          '<p>Paid campaigns, collaborations and hosting with Vegan brands and events, in every city.</p><em>Become a creator</em></span></a></div>';
    var base = { page: page, listing_id: ctx.listing_id || null, claim_name: ctx.name || '' };
    el.querySelectorAll('[data-vpc]').forEach(function (card) {
      var cta = card.getAttribute('data-vpc');
      var promo = cta === 'claim' && ctx.form ? 'profile-claim' : 'creator-register';
      onScreen(card, function () { send(promo, 'view', Object.assign({ cta: cta }, base)); });
    });
    if (ctx.form) claimForm(el.querySelector('.vpc-claim'), ctx, base);
    el.addEventListener('click', function (e) {
      var a = e.target.closest('[data-vpc-go]'); if (!a) return;
      var cta = a.getAttribute('data-vpc-go');
      click('creator-register', Object.assign({ cta: cta, claim: cta === 'claim' ? ctx.claim : '' }, base));
    });
  }

  // The short claim (Sean, 2026-10-31: "a short claim request for people who aren't creators"), in the card itself. A signed-in member's
  // name and email are filled in and their token sent, so approving links the profile to their account.
  function claimForm(card, ctx, base) {
    if (!card) return;
    var body = card.querySelector('.vpc-body');
    var m = null; try { m = window.VEAuth && VEAuth.isLoggedIn && VEAuth.isLoggedIn() ? VEAuth.getMember() : null; } catch (e) {}
    function open() {
      send('profile-claim', 'click', Object.assign({ cta: 'claim' }, base));
      body.innerHTML = '<form class="vpc-form" novalidate>' +
        '<label>Your name<input name="name" autocomplete="name" maxlength="120" value="' + esc(m && m.name || '') + '"></label>' +
        '<label>Your email<input name="email" type="email" autocomplete="email" maxlength="200" value="' + esc(m && m.email || '') + '"></label>' +
        '<label>A link that shows it is you<input name="proof" maxlength="300" placeholder="Your Instagram, website or a page about you"></label>' +
        '<label>Anything we should know (optional)<textarea name="note" maxlength="500"></textarea></label>' +
        '<div class="vpc-acts"><button type="submit" class="vpc-send">Send to our team</button><button type="button" class="vpc-cancel">Cancel</button></div>' +
        '<p class="vpc-msg" role="alert" hidden></p></form>';
      var f = body.querySelector('form'), E = f.elements, msg = f.querySelector('.vpc-msg');
      f.querySelector('.vpc-cancel').addEventListener('click', reset);
      f.addEventListener('input', function (e) { if (e.target.getAttribute('aria-invalid')) { e.target.removeAttribute('aria-invalid'); msg.hidden = true; } });
      (f.querySelector('input[name=name]').value ? f.querySelector('input[name=proof]') : f.querySelector('input[name=name]')).focus();
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = { name: E.name.value.trim(), email: E.email.value.trim(), proof: E.proof.value.trim(), note: E.note.value.trim() };
        ['name', 'email', 'proof'].forEach(function (k) { E[k].removeAttribute('aria-invalid'); });
        var bad = !v.name ? 'name' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email) ? 'email' : !v.proof ? 'proof' : '';
        if (bad) { E[bad].setAttribute('aria-invalid', 'true'); E[bad].focus(); msg.hidden = false;
          msg.textContent = bad === 'name' ? 'Give your name.' : bad === 'email' ? 'That email does not look right.' : 'Add a link that shows it is you.'; return; }
        var btn = f.querySelector('.vpc-send'); btn.disabled = true; btn.textContent = 'Sending...'; msg.hidden = true;
        var h = { 'Content-Type': 'application/json', apikey: ANON, Authorization: 'Bearer ' + ANON };
        try { var t = window.VEAuth && VEAuth.getToken && VEAuth.getToken(); if (t && m) h.Authorization = 'Bearer ' + t; } catch (e2) {}
        fetch(SB + '/functions/v1/ve-ambassador', { method: 'POST', headers: h,
          body: JSON.stringify(Object.assign({ action: 'person_claim', listing_id: ctx.listing_id, visitor: visitor() }, v)) })
          .then(function (r) { return r.json().catch(function () { return {}; }); })
          .then(function (d) {
            if (d && d.ok) { body.innerHTML = '<p class="vpc-done" role="status">Thank you. Our team will check it is you and write back to ' + esc(v.email) + ', usually within a few days.</p>'; return; }
            btn.disabled = false; btn.textContent = 'Send to our team'; msg.hidden = false;
            msg.textContent = (d && d.message) || 'That did not send. Try again in a minute.';
            if (d && d.fields && d.fields[0] && E[d.fields[0]]) E[d.fields[0]].setAttribute('aria-invalid', 'true');
          })
          .catch(function () { btn.disabled = false; btn.textContent = 'Send to our team'; msg.hidden = false; msg.textContent = 'That did not send. Try again in a minute.'; });
      });
    }
    var first = body.innerHTML;
    function reset() { body.innerHTML = first; body.querySelector('.vpc-open').addEventListener('click', open); }
    body.querySelector('.vpc-open').addEventListener('click', open);
  }

  window.VEPromo = { creatorCards: creatorCards, step: step, source: source, click: click };
})();
