/* The Explore Season Partners Guide intake.
 * One component, two homes: the public /partners page and the Opportunities
 * section inside the member platform (playbook explore-season-partners-guide,
 * locked 2026-09-24). It is a step-by-step pop-up: one question per screen,
 * a progress bar, Back, and an X that keeps the visitor's answers.
 *
 *   Open it from any element with data-vpg-open, or call VEPartnerGuide.open().
 *   <div data-ve-partner-guide data-source="..."></div> renders a small
 *   "Get started" card for inline homes such as the member dashboard.
 *
 * Offers, cities and spots come from the ve-partner-guide edge function, which
 * reads public.ve_partner_offers; every checkout or inquiry writes a sponsors row.
 *
 * Pricing is a member benefit (Sean, 2026-09-24): full details and prices show
 * only to Founding Members (membership_status 'active'). Everyone else answers
 * the questions, sees what the $11 one-time Founding Membership unlocks, joins
 * (VEAuth sign-up, then the $11 checkout) and lands back on their matches.
 */
(function () {
  var API = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-partner-guide';
  var STORE_KEY = 've_pg_state';
  var AUTH_API = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-auth';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';

  var CSS = [
    '.vpg-dialog{margin:auto;font-family:"Montserrat",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1a1a1a;border:0;padding:0;border-radius:16px;width:min(680px,calc(100% - 32px));max-height:min(760px,calc(100vh - 32px));box-shadow:0 24px 60px rgba(0,0,0,0.3);overflow:hidden;}',
    '.vpg-dialog *{box-sizing:border-box;}',
    '.vpg-dialog::backdrop{background:rgba(10,20,12,0.62);}',
    '.vpg-dialog[open]{display:flex;flex-direction:column;}',
    '.vpg-head{display:flex;align-items:center;gap:14px;padding:18px 20px 14px;border-bottom:1px solid rgba(0,0,0,0.08);}',
    '.vpg-head-title{font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#1f5f22;white-space:nowrap;}',
    '.vpg-bar{flex:1;height:6px;border-radius:99px;background:#EAF7EA;overflow:hidden;min-width:0;}',
    '.vpg-bar span{display:block;height:100%;background:#2d7d31;border-radius:99px;transition:width .25s;}',
    '.vpg-x{appearance:none;border:0;background:none;cursor:pointer;width:44px;height:44px;margin:-8px -10px -8px 0;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#1a1a1a;flex:0 0 auto;}',
    '.vpg-x:hover{background:#f2f2f2;}',
    '.vpg-body{padding:26px 24px 20px;overflow-y:auto;flex:1;}',
    '.vpg-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 20px 16px;border-top:1px solid rgba(0,0,0,0.08);}',
    '.vpg-link{appearance:none;border:0;background:none;font:inherit;font-size:13px;font-weight:700;color:#1f5f22;cursor:pointer;padding:10px 4px;text-decoration:underline;text-underline-offset:3px;}',
    '.vpg-link[hidden]{display:none;}',
    '.vpg-q-title{font-size:24px;font-weight:900;line-height:1.2;margin:0 0 6px;letter-spacing:-0.01em;}',
    '.vpg-q-sub{font-size:14px;line-height:1.55;color:rgba(26,26,26,0.72);margin:0 0 20px;}',
    '.vpg-choices{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:10px;}',
    '.vpg-choice{appearance:none;font:inherit;text-align:left;background:#fff;border:1.5px solid rgba(0,0,0,0.16);border-radius:12px;padding:14px 16px;min-height:56px;cursor:pointer;display:flex;flex-direction:column;gap:2px;transition:border-color .15s,background .15s;}',
    '.vpg-choice:hover{border-color:#2d7d31;background:#f7fcf7;}',
    '.vpg-choice[aria-pressed="true"]{border-color:#2d7d31;background:#EAF7EA;}',
    '.vpg-choice strong{font-size:15px;font-weight:800;}',
    '.vpg-choice small{font-size:12.5px;color:rgba(26,26,26,0.68);font-weight:600;}',
    '.vpg-dialog :focus-visible{outline:3px solid #F69820;outline-offset:2px;}',
    '.vpg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(270px,100%),1fr));gap:14px;}',
    '.vpg-card{min-width:0;background:#fff;border:1.5px solid rgba(0,0,0,0.12);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:9px;}',
    '.vpg-card.featured{border-color:#2d7d31;box-shadow:0 6px 20px rgba(45,125,49,0.12);}',
    '.vpg-card h3{font-size:17px;font-weight:900;margin:0;line-height:1.25;}',
    '.vpg-price{font-size:26px;font-weight:900;line-height:1;margin:2px 0 0;}',
    '.vpg-price span{font-size:13px;font-weight:700;color:rgba(26,26,26,0.68);margin-left:6px;}',
    '.vpg-tagline{font-size:14px;line-height:1.55;color:rgba(26,26,26,0.78);margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
    '.vpg-inc{list-style:none;margin:2px 0 0;padding:0;}',
    '.vpg-inc li{font-size:13.5px;line-height:1.5;padding:3px 0 3px 22px;position:relative;}',
    '.vpg-inc li::before{content:"";position:absolute;left:2px;top:8px;width:11px;height:6px;border-left:2.5px solid #2d7d31;border-bottom:2.5px solid #2d7d31;transform:rotate(-45deg);}',
    '.vpg-badges{display:flex;flex-wrap:wrap;gap:6px;}',
    '.vpg-badge{font-size:10.5px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;padding:4px 9px;border-radius:100px;background:#EAF7EA;color:#1f5f22;}',
    '.vpg-badge.warn{background:#fff3e0;color:#7d4a00;}',
    '.vpg-note{font-size:12.5px;line-height:1.5;color:#7d4a00;background:#fff8ec;border:1px solid rgba(246,152,32,0.35);border-radius:8px;padding:9px 11px;margin:2px 0 0;}',
    '.vpg-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto;padding-top:6px;}',
    '.vpg-btn{appearance:none;font:inherit;font-size:12px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;border-radius:6px;padding:13px 18px;min-height:44px;cursor:pointer;border:1.5px solid #2d7d31;background:#2d7d31;color:#fff;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;}',
    '.vpg-btn:hover{background:#1f5f22;border-color:#1f5f22;}',
    '.vpg-btn.ghost{background:#fff;color:#1f5f22;}',
    '.vpg-btn.ghost:hover{background:#EAF7EA;}',
    '.vpg-btn[disabled]{opacity:.6;cursor:wait;}',
    '.vpg-form{display:none;flex-direction:column;gap:10px;margin-top:8px;padding-top:12px;border-top:1px solid rgba(0,0,0,0.09);}',
    '.vpg-form.open,.vpg-form.always{display:flex;}',
    '.vpg-form.always{border-top:0;padding-top:0;margin-top:0;}',
    '.vpg-form label{font-size:12px;font-weight:700;display:flex;flex-direction:column;gap:5px;}',
    '.vpg-input{font:inherit;font-size:15px;padding:11px 12px;border:1.5px solid rgba(0,0,0,0.2);border-radius:6px;background:#fff;color:#1a1a1a;width:100%;min-width:0;}',
    'textarea.vpg-input{min-height:96px;resize:vertical;}',
    '.vpg-hp{position:absolute !important;left:-9999px !important;width:1px;height:1px;overflow:hidden;}',
    '.vpg-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(200px,100%),1fr));gap:10px;}',
    '.vpg-msg{font-size:13.5px;line-height:1.55;border-radius:8px;padding:11px 13px;margin:0;}',
    '.vpg-msg.ok{background:#EAF7EA;color:#1f5f22;border:1px solid #b8ddb9;}',
    '.vpg-msg.err{background:#fdecea;color:#8a1c12;border:1px solid #f1b8b1;}',
    '.vpg-hint{font-size:13px;color:rgba(26,26,26,0.72);margin:14px 0 0;line-height:1.55;}',
    '.vpg-inline{font-family:"Montserrat",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#fff;border:1.5px solid rgba(0,0,0,0.12);border-radius:14px;padding:22px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;}',
    '.vpg-inline p{margin:0;font-size:14px;line-height:1.55;color:rgba(26,26,26,0.78);max-width:560px;}',
    '.vpg-inline strong{display:block;font-size:17px;color:#1a1a1a;margin-bottom:2px;}',
    '@media (max-width:600px){.vpg-dialog{width:100%;max-width:100%;height:100%;max-height:100%;border-radius:0;}.vpg-body{padding:22px 18px 16px;}.vpg-q-title{font-size:21px;}.vpg-actions .vpg-btn{flex:1 1 100%;}}'
  ].join('');

  var AUDIENCES = [
    ['attendee', 'I want to attend', 'Come to events and join the community'],
    ['local_business', 'Local business', 'Restaurant, shop, maker or service'],
    ['national_brand', 'National brand', 'Products sold across many markets'],
    ['chef', 'Chef', 'Private chef, caterer or culinary pro'],
    ['nonprofit', 'Nonprofit', 'A cause-driven organization']
  ];
  var GOALS = [
    ['sampling', 'Get my product tasted', 'Sampling in front of new people'],
    ['visibility', 'Get seen', 'Brand visibility at events and online'],
    ['leads', 'Get customers', 'Leads and repeat buyers'],
    ['hosting', 'Host my people', 'Bring guests, clients or a team'],
    ['goodwill', 'Support the movement', 'Goodwill and community impact']
  ];
  var BUDGETS = [['under_500', 'Under $500', '', 50000], ['500_2500', '$500 to $2,500', '', 250000], ['2500_8000', '$2,500 to $8,000', '', 799999], ['8k_plus', '$8,000 and up', 'Starts with a call with Sean', Infinity]];
  var STARTS = [['before_oct_24', 'Before Oct 24', 'Get every event this quarter'], ['november', 'November', ''], ['december', 'December', ''], ['q1_2027', 'Early 2027', '']];

  var ERRORS = {
    name_required: 'Please add your name.',
    valid_email_required: 'Please add a valid email address.',
    audience_required: 'Go back to the first question and tell us who you are.',
    message_required: 'Please write your question.',
    event_choice_required: 'Pick which Community Night you want.',
    sold_out: 'All five Activation Partner spots are taken. Ask a question to talk through other options.',
    too_many_requests: 'We received several requests from this email in the last hour. Please try again later.',
    city_not_live: 'Checkout opens when your city goes live. Leave your email and the team will reach out.',
    meeting_requires_8k_budget: 'Meetings with Sean start at $8,000. Change your budget, or pick a self-serve option.',
    already_holding: 'You already have a spot on hold. Check your email for the details.'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function token() { try { return localStorage.getItem('ve_token') || ''; } catch (e) { return ''; } }
  function member() { try { return JSON.parse(localStorage.getItem('ve_member') || 'null') || {}; } catch (e) { return {}; } }
  // Fresh membership status from ve-auth (the cached ve_member can be stale right after checkout).
  function refreshMember() {
    var t = token();
    if (!t) { G.memberStatus = null; return Promise.resolve(null); }
    return fetch(AUTH_API + '?action=me', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ANON_KEY }, body: JSON.stringify({ action: 'me', token: t }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { G.memberStatus = d && d.member ? d.member.membership_status : null; return G.memberStatus; })
      .catch(function () { G.memberStatus = null; return null; });
  }
  function isFoundingMember() { return loggedIn() && G.memberStatus === 'active'; }
  function loggedIn() { try { return window.VEAuth ? VEAuth.isLoggedIn() : !!token(); } catch (e) { return !!token(); } }
  function track(name, params) { try { if (window.gtag) window.gtag('event', name, params || {}); } catch (e) {} }
  var ICON_X = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

  var G = {
    data: null, dialog: null, source: 'partners_page', uid: 0,
    state: { step: 'audience', audience: '', city: 'south-florida', goal: '', budget: '', start: '' }
  };

  function loadState() { try { var s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); if (s && typeof s === 'object') G.state = Object.assign(G.state, s); } catch (e) {} }
  function saveState() { try { localStorage.setItem(STORE_KEY, JSON.stringify(G.state)); } catch (e) {} }

  function injectCss() {
    if (document.getElementById('vpg-css')) return;
    var s = document.createElement('style');
    s.id = 'vpg-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function city() { return (G.data ? G.data.cities : []).filter(function (c) { return c.slug === G.state.city; })[0] || {}; }

  // The path a visitor walks, computed from their answers so far.
  function steps() {
    var s = G.state, list = ['audience', 'city'];
    if (s.audience && city().status && city().status !== 'live') return list.concat(['coming']);
    if (s.audience === 'attendee' || s.audience === 'nonprofit') return list.concat(['results']);
    return list.concat(['goal', 'budget', 'start', 'results']);
  }

  function buildDialog() {
    if (G.dialog) return G.dialog;
    var d = document.createElement('dialog');
    d.className = 'vpg-dialog';
    d.setAttribute('aria-labelledby', 'vpg-q-title');
    d.innerHTML = '<div class="vpg-head"><span class="vpg-head-title">Find my fit</span><div class="vpg-bar" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="100"><span></span></div>' +
      '<button type="button" class="vpg-x" aria-label="Close">' + ICON_X + '</button></div>' +
      '<div class="vpg-body" aria-live="polite"></div>' +
      '<div class="vpg-foot"><button type="button" class="vpg-link" data-act="back">Back</button><button type="button" class="vpg-link" data-act="ask">Have a question instead?</button></div>';
    document.body.appendChild(d);
    d.querySelector('.vpg-x').addEventListener('click', close);
    d.querySelector('[data-act=back]').addEventListener('click', back);
    d.querySelector('[data-act=ask]').addEventListener('click', function () { go('question'); });
    d.addEventListener('click', function (e) { if (e.target === d) close(); }); // click on the backdrop
    d.addEventListener('close', function () { saveState(); if (G.opener) G.opener.focus(); });
    G.dialog = d;
    return d;
  }

  function open(opts) {
    opts = opts || {};
    injectCss();
    if (opts.source) G.source = opts.source;
    G.opener = document.activeElement;
    var d = buildDialog();
    if (!d.open) d.showModal();
    if (opts.step) G.state.step = opts.step;
    track('pg_open', { source: G.source });
    if (G.data && G.memberChecked) { render(); return; }
    d.querySelector('.vpg-body').innerHTML = '<p class="vpg-q-sub">Loading the season&hellip;</p>';
    Promise.all([G.data ? Promise.resolve(G.data) : fetch(API + '?action=catalog').then(function (r) { return r.json(); }), refreshMember()]).then(function (res) {
      var data = res[0];
      if (!data || !data.offers) throw new Error('no offers');
      G.data = data;
      G.memberChecked = true;
      if ((steps().indexOf(G.state.step) === -1 && ['question', 'success'].indexOf(G.state.step) === -1) || (G.state.step === 'results' && !G.state.audience)) G.state.step = 'audience';
      render();
    }).catch(function () {
      d.querySelector('.vpg-body').innerHTML = '<p class="vpg-msg err">The partner menu did not load. Close this and try again, or email <a href="mailto:contact@vegansexplore.com">contact@vegansexplore.com</a>.</p>';
    });
  }

  function close() { if (G.dialog && G.dialog.open) G.dialog.close(); }

  function go(step) {
    G.state.step = step;
    saveState();
    track('pg_step', { step: step, audience: G.state.audience });
    if (step === 'results') track('pg_results', { audience: G.state.audience, budget: G.state.budget });
    render();
  }

  function back() {
    var s = G.state.step;
    if (s === 'question' || s === 'success') { go(G.state.audience ? 'results' : 'audience'); return; }
    var list = steps(), i = list.indexOf(s);
    if (i > 0) go(list[i - 1]);
  }

  function next() {
    var list = steps(), i = list.indexOf(G.state.step);
    go(list[Math.min(i + 1, list.length - 1)]);
  }

  function choiceStep(key, title, sub, options) {
    var val = G.state[key];
    return '<h2 class="vpg-q-title" id="vpg-q-title">' + title + '</h2>' + (sub ? '<p class="vpg-q-sub">' + sub + '</p>' : '') +
      '<div class="vpg-choices">' + options.map(function (o) {
        return '<button type="button" class="vpg-choice" data-key="' + key + '" data-val="' + esc(o[0]) + '" aria-pressed="' + (val === o[0]) + '"><strong>' + esc(o[1]) + '</strong>' + (o[2] ? '<small>' + esc(o[2]) + '</small>' : '') + '</button>';
      }).join('') + '</div>';
  }

  function render() {
    var d = G.dialog, s = G.state, body = d.querySelector('.vpg-body');
    var list = steps(), i = list.indexOf(s.step);
    var pct = s.step === 'success' ? 100 : (i < 0 ? 100 : Math.round((i / (list.length - 1)) * 100));
    d.querySelector('.vpg-bar span').style.width = Math.max(pct, 6) + '%';
    d.querySelector('.vpg-bar').setAttribute('aria-valuenow', String(pct));
    d.querySelector('[data-act=back]').hidden = s.step === 'audience' || s.step === 'success';
    d.querySelector('[data-act=ask]').hidden = s.step === 'question' || s.step === 'success';

    var html = '';
    if (s.step === 'audience') html = (G.welcome && isFoundingMember() ? '<p class="vpg-msg ok" style="margin-bottom:14px;">Welcome, Founding Member. Your pricing is unlocked.</p>' : '') + choiceStep('audience', 'Who are you?', 'We will only show you what fits.', AUDIENCES);
    else if (s.step === 'city') html = choiceStep('city', 'Which city?', 'South Florida is live. Each new city opens as its Community Manager comes on.',
      G.data.cities.map(function (c) { return [c.slug, c.name, c.status === 'live' ? 'Live now' : 'Coming soon']; }));
    else if (s.step === 'goal') html = choiceStep('goal', 'What do you want most?', '', GOALS);
    else if (s.step === 'budget') html = choiceStep('budget', 'What is your budget?', 'Everything under $8,000 checks out right here, no meeting needed.', BUDGETS);
    else if (s.step === 'start') html = choiceStep('start', 'When do you want to start?', 'Sign before Oct 24 and you get every event this quarter.', STARTS);
    else if (s.step === 'coming') html = comingStep();
    else if (s.step === 'results') html = isFoundingMember() ? resultsStep() : gateStep();
    else if (s.step === 'question') html = questionStep();
    else if (s.step === 'success') html = '<h2 class="vpg-q-title" id="vpg-q-title">You are in.</h2><p class="vpg-q-sub">Your payment went through. Check your email for your receipt and what is included. The team will reach out with next steps.</p><button type="button" class="vpg-btn" data-act="close">Done</button>';
    body.innerHTML = html;
    body.scrollTop = 0;
    bind(body);
    var first = body.querySelector('.vpg-choice[aria-pressed="true"]') || body.querySelector('.vpg-choice, .vpg-form.always input:not([name=hp_field]), .vpg-btn');
    if (first) first.focus({ preventScroll: true });
  }

  function comingStep() {
    var c = city();
    return '<h2 class="vpg-q-title" id="vpg-q-title">' + esc(c.name) + ' is coming.</h2>' +
      '<p class="vpg-q-sub">A Community Manager is already lined up. The city opens when the season can support it. Leave your email and the team will reach out when it opens.</p>' +
      form('notify-city', 'notify', null, 'Put me on the list', true);
  }

  function gateStep() {
    var signedIn = loggedIn();
    track('pg_gate', { audience: G.state.audience, signed_in: signedIn });
    return '<h2 class="vpg-q-title" id="vpg-q-title">Your matches are ready.</h2>' +
      '<p class="vpg-q-sub">Details and pricing are for Founding Members. It is one $11 contribution, one time, and it goes straight into what we are building.</p>' +
      '<ul class="vpg-inc" style="margin-bottom:18px;">' +
        '<li>Every option that fits you, with full details and pricing</li>' +
        '<li>A seat in our upcoming campaigns, starting this season</li>' +
        '<li>Entry to member events, including Community Nights</li>' +
        '<li>Full community access: post, join your city, follow and save</li>' +
        '<li>1,100 Points to use toward guides</li>' +
      '</ul>' +
      '<div class="vpg-actions" style="margin-top:0;"><button type="button" class="vpg-btn" data-auth="' + (signedIn ? 'pay' : 'signup') + '">Become a Founding Member, $11</button>' +
      (signedIn ? '' : '<button type="button" class="vpg-btn ghost" data-auth="login">I am a member, log in</button>') + '</div>' +
      '<p class="vpg-hint">One time. It never renews. Rather talk first? Use "Have a question instead?" below.</p>';
  }

  // After sign-up the site may show its own activation prompt first; reopen on the
  // visitor's matches once they are signed in and every account pop-up is closed.
  function authThenResults(mode) {
    saveState();
    if (mode === 'pay' && window.VEAuth) {
      track('pg_membership_checkout', {});
      VEAuth.startEntryCheckout(1100).then(function (d) { if (d && d.url) location.href = d.url; }).catch(function () {});
      return;
    }
    close();
    if (!window.VEAuth) { location.href = '/join'; return; }
    VEAuth.showAuthModal(mode === 'signup' ? 'Create your account, then become a Founding Member for $11 to see your matches and pricing.' : 'Log in to see your matches and pricing.', function () { refreshMember().then(function () { open({ step: 'results' }); }); }, mode);
    var shown = function (id) { var el = document.getElementById(id); return el && el.style.display !== 'none' && el.style.display !== ''; };
    var started = Date.now();
    var timer = setInterval(function () {
      if (Date.now() - started > 15 * 60000) { clearInterval(timer); return; }
      if (loggedIn() && !shown('ve-auth-modal') && !shown('ve-pledge-modal')) {
        clearInterval(timer);
        if (!G.dialog || !G.dialog.open) refreshMember().then(function () { if (isFoundingMember()) open({ step: 'results' }); });
      }
    }, 700);
  }

  // "Become a member": sign up (or log in), pay the $11 Founding Membership, then land
  // in the intake with pricing unlocked. Members skip straight to the intake.
  function join(opts) {
    opts = opts || {};
    if (opts.source) G.source = opts.source;
    track('pg_join', { source: G.source, signed_in: loggedIn() });
    if (!loggedIn()) { authThenResults('signup'); return; }
    refreshMember().then(function () {
      G.memberChecked = true;
      if (isFoundingMember()) open({ step: G.state.audience ? 'results' : 'audience' });
      else authThenResults('pay');
    });
  }

  function matches() {
    var s = G.state, budget = BUDGETS.filter(function (b) { return b[0] === s.budget; })[0];
    var max = budget ? budget[3] : null;
    var list = G.data.offers.filter(function (o) {
      if (o.audiences.indexOf(s.audience) === -1) return false;
      if (o.exit === 'meeting') return s.budget === '8k_plus';
      if (max !== null && o.price_cents && o.price_cents > max) return false;
      return true;
    });
    list.sort(function (a, b) {
      var ga = s.goal && a.goals.indexOf(s.goal) !== -1 ? 0 : 1, gb = s.goal && b.goals.indexOf(s.goal) !== -1 ? 0 : 1;
      return ga - gb || a.sort - b.sort;
    });
    return list;
  }

  function resultsStep() {
    var s = G.state, list = matches();
    var head = s.audience === 'attendee' ? 'Your way in' : 'Here is what fits';
    var sub = s.audience === 'attendee' ? 'Founding Membership is the one ask for everyone: $11 one time, and you are in.'
      : 'Options under $8,000 check out right here. $8,000 and up starts with a call with Sean.';
    var html = '<h2 class="vpg-q-title" id="vpg-q-title">' + head + '</h2><p class="vpg-q-sub">' + sub + '</p>';
    html += list.length ? '<div class="vpg-grid">' + list.map(function (o, i) { return card(o, i === 0); }).join('') + '</div>'
      : '<p class="vpg-q-sub">Nothing on the menu matches that budget yet. Go back and try a different range, or ask us a question.</p>';
    var hidden = s.budget !== '8k_plus' && G.data.offers.some(function (o) { return o.exit === 'meeting' && o.audiences.indexOf(s.audience) !== -1; });
    if (hidden) html += '<p class="vpg-hint">Planning $8,000 or more? Go back and choose that budget to see Activation Partner and Season Partnership options.</p>';
    return html;
  }

  function card(o, featured) {
    var s = G.state, d = G.data, badges = '', note = '', actions = '', forms = '';
    if (o.includes_membership) badges += '<span class="vpg-badge">Membership included</span>';
    if (o.slug === 'activation-partner') {
      var left = d.activation_spots_left;
      badges += '<span class="vpg-badge warn">' + (left > 0 ? left + ' of ' + (o.capacity || 5) + ' spots left' : 'Sold out') + '</span>';
    }
    if (o.early_sign_note) {
      note = s.start === 'before_oct_24'
        ? '<p class="vpg-note"><strong>Early sign advantage:</strong> sign before Oct 24 and you get every event in the quarter.</p>'
        : '<p class="vpg-note">' + esc(o.early_sign_note) + '</p>';
    }
    if (o.exit === 'checkout') {
      actions = '<button type="button" class="vpg-btn" data-open="buy-' + o.slug + '">Lock it in</button>';
      forms = form('buy-' + o.slug, 'checkout', o, 'Continue to secure checkout');
    } else if (o.exit === 'meeting') {
      var soldOut = o.slug === 'activation-partner' && d.activation_spots_left <= 0;
      actions = '<button type="button" class="vpg-btn" data-open="meet-' + o.slug + '">Book a call with Sean</button>' +
        (soldOut ? '' : '<button type="button" class="vpg-btn ghost" data-open="hold-' + o.slug + '">Reserve, 7-day hold</button>');
      forms = form('meet-' + o.slug, 'meeting', o, 'Request my call') + (soldOut ? '' : form('hold-' + o.slug, 'reserve', o, 'Hold my spot for 7 days'));
    } else {
      actions = '<button type="button" class="vpg-btn ghost" data-open="notify-' + o.slug + '">Notify me</button>';
      forms = form('notify-' + o.slug, 'notify', o, 'Notify me');
    }
    return '<article class="vpg-card' + (featured ? ' featured' : '') + '"><h3>' + esc(o.name) + '</h3>' +
      '<p class="vpg-price">' + esc(o.price_label) + (o.price_note ? '<span>' + esc(o.price_note) + '</span>' : '') + '</p>' +
      (badges ? '<div class="vpg-badges">' + badges + '</div>' : '') +
      '<p class="vpg-tagline">' + esc(o.tagline) + '</p>' +
      '<ul class="vpg-inc">' + o.includes.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>' +
      note + '<div class="vpg-actions">' + actions + '</div>' + forms + '</article>';
  }

  function questionStep() {
    var c = city();
    var who = G.state.audience === 'national_brand' ? 'National brand questions go straight to Sean.'
      : (c.status === 'live' && c.manager_name && c.manager_routed
        ? 'Your question goes to ' + esc(c.manager_name) + ', our ' + esc(c.name) + ' Community Manager, with Sean copied.'
        : 'Your question goes to the Vegans Explore team.');
    return '<h2 class="vpg-q-title" id="vpg-q-title">Ask us anything.</h2><p class="vpg-q-sub">' + who + ' We reply by email.</p>' + form('question', 'question', null, 'Send my question', true);
  }

  function form(id, kind, offer, submitLabel, always) {
    var me = member(), business = G.state.audience && G.state.audience !== 'attendee';
    var f = '<form class="vpg-form' + (always ? ' always' : '') + '" id="vpg-f-' + id + '" data-kind="' + kind + '" data-offer="' + (offer ? offer.slug : '') + '" novalidate>';
    if (kind === 'reserve') f += '<p class="vpg-hint" style="margin:0;">Your spot is held for 7 days while pricing is finalized with Sean. No payment today.</p>';
    if (kind === 'meeting') f += '<p class="vpg-hint" style="margin:0;">You will get Sean\'s calendar right after this, plus a copy by email.</p>';
    f += '<div class="vpg-row"><label>Name<input class="vpg-input" name="name" autocomplete="name" required value="' + esc(me.name || '') + '"></label>' +
      '<label>Email<input class="vpg-input" name="email" type="email" autocomplete="email" required value="' + esc(me.email || '') + '"></label></div>';
    if (business || kind === 'question') f += '<div class="vpg-row"><label>Business or organization' + (kind === 'question' ? ' (optional)' : '') + '<input class="vpg-input" name="company" autocomplete="organization"></label>' +
      (kind === 'question' ? '' : '<label>Phone (optional)<input class="vpg-input" name="phone" type="tel" autocomplete="tel"></label>') + '</div>';
    if (offer && offer.event_choices && offer.event_choices.length) {
      f += '<label>Which night?<select class="vpg-input" name="event" required><option value="">Choose a Community Night</option>' +
        offer.event_choices.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select></label>';
    }
    if (kind === 'question' && !G.state.audience) {
      f += '<label>You are a&hellip;<select class="vpg-input" name="audience" required><option value="">Choose one</option>' +
        AUDIENCES.map(function (a) { return '<option value="' + a[0] + '">' + esc(a[1]) + '</option>'; }).join('') + '</select></label>';
    }
    if (kind === 'question') f += '<label>Your question<textarea class="vpg-input" name="message" required></textarea></label>';
    f += '<label class="vpg-hp" aria-hidden="true">Leave empty<input name="hp_field" tabindex="-1" autocomplete="off" id="vpg-hp-' + (++G.uid) + '"></label>';
    return f + '<div class="vpg-status" role="status"></div><button type="submit" class="vpg-btn">' + submitLabel + '</button></form>';
  }

  function bind(body) {
    body.querySelectorAll('.vpg-choice').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-key');
        G.state[k] = b.getAttribute('data-val');
        if (k === 'audience' && (G.state.audience === 'attendee' || G.state.audience === 'nonprofit')) { G.state.goal = ''; G.state.budget = ''; G.state.start = ''; }
        next();
      });
    });
    body.querySelectorAll('[data-open]').forEach(function (b) {
      b.addEventListener('click', function () {
        var f = document.getElementById('vpg-f-' + b.getAttribute('data-open'));
        if (!f) return;
        var c = b.closest('.vpg-card');
        if (c) c.querySelectorAll('.vpg-form.open').forEach(function (o) { if (o !== f) o.classList.remove('open'); });
        f.classList.toggle('open');
        if (f.classList.contains('open')) { var first = f.querySelector('input:not([name=hp_field]),select'); if (first) first.focus(); }
      });
    });
    body.querySelectorAll('[data-act=close]').forEach(function (b) { b.addEventListener('click', close); });
    body.querySelectorAll('[data-auth]').forEach(function (b) { b.addEventListener('click', function () { authThenResults(b.getAttribute('data-auth')); }); });
    body.querySelectorAll('form.vpg-form').forEach(function (f) {
      f.addEventListener('submit', function (e) { e.preventDefault(); submit(f); });
    });
  }

  function submit(f) {
    var s = G.state, kind = f.getAttribute('data-kind'), offer = f.getAttribute('data-offer');
    var status = f.querySelector('.vpg-status'), btn = f.querySelector('button[type=submit]');
    var val = function (n) { var el = f.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; };
    var show = function (cls, html) { status.innerHTML = '<p class="vpg-msg ' + cls + '">' + html + '</p>'; };
    var audience = s.audience || val('audience');
    if (!audience) { show('err', ERRORS.audience_required); return; }
    if (!val('name')) { show('err', ERRORS.name_required); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email'))) { show('err', ERRORS.valid_email_required); return; }
    if (f.querySelector('[name=event]') && !val('event')) { show('err', ERRORS.event_choice_required); return; }
    if (kind === 'question' && !val('message')) { show('err', ERRORS.message_required); return; }

    var answers = {};
    if (s.goal) answers.goal = s.goal;
    if (s.budget) answers.budget = s.budget;
    if (s.start) answers.start = s.start;
    if (val('event')) answers.event = val('event');
    var body = {
      name: val('name'), email: val('email'), company: val('company'), phone: val('phone'), message: val('message'),
      hp_field: val('hp_field'), audience: audience, city: s.city, offer: offer || undefined, answers: answers,
      source: G.source, token: token() || undefined
    };
    var action = kind === 'checkout' ? 'checkout' : 'inquire';
    if (action === 'inquire') body.kind = kind;
    btn.disabled = true;
    show('ok', kind === 'checkout' ? 'Opening secure checkout&hellip;' : 'Sending&hellip;');
    fetch(API + '?action=' + action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        var j = res.j || {};
        if (!res.ok || j.error) { btn.disabled = false; show('err', ERRORS[j.error] || 'Something went wrong. Please try again, or email contact@vegansexplore.com.'); return; }
        track(kind === 'checkout' ? 'pg_checkout_start' : 'pg_inquire', { kind: kind, offer: offer || '' });
        if (kind === 'checkout' && j.url) { saveState(); window.location.href = j.url; return; }
        var msg = {
          question: 'Got it. Your question is on its way, and we emailed you a copy.',
          notify: 'You are on the list. The team will reach out when it opens.',
          meeting: 'Request received. <a href="' + esc(j.meeting_url) + '" target="_blank" rel="noopener">Pick a time on Sean\'s calendar</a>. The link is in your email too.',
          reserve: 'Your spot is held until ' + esc(new Date(j.hold_expires_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })) + '. <a href="' + esc(j.meeting_url) + '" target="_blank" rel="noopener">Book your call with Sean</a> to finalize pricing.'
        }[kind];
        f.innerHTML = '<p class="vpg-msg ok" role="status">' + msg + '</p>';
      })
      .catch(function () { btn.disabled = false; show('err', 'Could not reach the server. Check your connection and try again.'); });
  }

  function init() {
    injectCss();
    loadState();
    document.querySelectorAll('[data-ve-partner-guide]').forEach(function (el) {
      if (el.__vpg) return;
      el.__vpg = true;
      var src = el.getAttribute('data-source') || 'partners_page';
      el.innerHTML = '<div class="vpg-inline"><p><strong>Find my fit</strong>Membership, Community Night tables, goodie bags and activations for this season. A few quick questions and you will see what fits, with pricing.</p>' +
        '<button type="button" class="vpg-btn" data-vpg-open data-source="' + esc(src) + '">Find my fit</button></div>';
    });
    document.addEventListener('click', function (e) {
      var j = e.target.closest && e.target.closest('[data-vpg-join]');
      if (j) { e.preventDefault(); join({ source: j.getAttribute('data-source') || G.source }); return; }
      var t = e.target.closest && e.target.closest('[data-vpg-open]');
      if (!t) return;
      e.preventDefault();
      open({ source: t.getAttribute('data-source') || G.source, step: t.getAttribute('data-vpg-step') || undefined });
    });
    var q = new URLSearchParams(location.search);
    if (q.get('activate') === 'success') {
      var tries = 0;
      (function poll() {
        refreshMember().then(function () {
          if (isFoundingMember() || ++tries > 12) { G.memberChecked = true; G.welcome = true; open({ step: 'results' }); }
          else setTimeout(poll, 1500);
        });
      })();
    }
    else if (q.get('checkout') === 'success') open({ step: 'success' });
    else if (q.get('checkout') === 'cancelled') open({ step: 'results' });
    // Members see "See my options" instead of "Become a member".
    var joins = document.querySelectorAll('[data-vpg-join][data-member-label]');
    if (joins.length && loggedIn()) refreshMember().then(function () {
      if (isFoundingMember()) joins.forEach(function (b) { b.textContent = b.getAttribute('data-member-label'); });
    });
  }

  window.VEPartnerGuide = { open: open, close: close, join: join };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
