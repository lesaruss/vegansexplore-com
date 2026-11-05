/* The Pre-Vegan Restaurant Guide (vegans-explore-initiative-business-certification B3, built 2026-11-05).
 *
 * For restaurants that serve meat, fish, dairy or eggs and also plant-based dishes. It explains Pre-Vegan Certification
 * (Standard V1.2, locked by Sean 2026-11-04 and 2026-11-05) and holds the free, private readiness check (B2).
 * Shell copied from the Vegan Restaurant Guide (template gate): Liz on the right of every tab, the content on the left,
 * Back / N of M / Next under her, the address bar carries the view (#/gates/g3, #/ready).
 *
 *   Overview       what it is and who it is for
 *   The stamp      what certification says, and never says (the locked disclosure wording)
 *   How it works   the eight steps
 *   The gates      the eight gates, one per view: the rule, what you will show, how to get ready
 *   Get in         visitors: the readiness check (the pre-vegan-assessment survey); finishing it makes them a member
 *   Your readiness members: their private score by gate, the blockers, the next steps (ve-mission-survey preveg_readiness)
 *   What's next    members: an optional contribution (Sean, 2026-11-05: free Guide, $11 optional, the usual 1,100 welcome
 *                  points, no double points), and the next things to do
 *
 * Everything here is the published methodology, so it is public; the score is the member's own and private.
 * A door Guide (canon-ve-door-guides): ve-guide-unlock opens it for any active member. Not launched: ve_guides
 * pre-vegan-restaurant-guide is unpublished and the survey is inactive until Sean turns them on. Liz's lines are text
 * drafts for Sean; nothing is recorded.
 */
(function () {
  var SLUG = 'pre-vegan-restaurant-guide';
  var SURVEY_SLUG = 'pre-vegan-assessment';
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var UNLOCK_URL = SB + '/functions/v1/ve-guide-unlock';
  var SURVEY_URL = SB + '/functions/v1/ve-mission-survey';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';

  // Liz's lines: text drafts for Sean (no recordings). `say` for visitors, `sayMember` once they are in.
  var TABS = [
    { k: 'overview', label: 'Overview', say: 'Hi, I\'m Liz. If your restaurant serves meat and also plant-based dishes, this Guide is for you. Pre-Vegan Certification checks the dishes you name, and how they are made, so plant-based guests can order with confidence. Start with the free readiness check. It is private, and only you see your score.',
      sayMember: 'Welcome in. Your readiness score is in Your readiness. The gates show what each check looks for, and What\'s next shows where to go from here.' },
    { k: 'stamp', label: 'The stamp', say: 'This is exactly what a certified dish says, and what it never says. It always travels with its limits, so a guest knows what was checked before they order.' },
    { k: 'how', label: 'How it works', say: 'Here is the whole path, step by step. Three different people look at your file, and a person makes the final decision.' },
    { k: 'gates', label: 'The gates', say: 'There are eight gates, and every one must pass. Open any gate to see the rule, what you will show us, and how to get ready.' },
    { k: 'join', label: 'Get in', guest: 1, say: 'There is one way in, and it is free. Take the readiness check. It takes a few minutes, it is private, and when you finish you are a member and your score is ready.' },
    { k: 'ready', label: 'Your readiness', mine: 1, say: 'This is your private readiness score, gate by gate. Fix the blockers first, then work down the next steps. It is not a certification, and nobody else sees it.' },
    { k: 'next', label: 'What\'s next', mine: 1, say: 'You are in. Thank you. Here is what you can do next. If you want to help us build faster, you can make a one-time contribution. If not, we understand.' }
  ];

  // The eight gates (Standard V1.2, locked). `rule` is the standard's own words; `show` is the evidence item (E1 to E8);
  // `ready` is how to get ready (Logan's draft from the gates).
  var GATES = [
    { id: 'g1', n: 'G1', t: 'Ingredient evidence', rule: 'Every ingredient and sub-ingredient traced by brand and product. A distributor\'s assurance alone does not count. Missing evidence fails.',
      show: 'For each dish: the recipe card, and a label photo or supplier spec sheet for every purchased component.',
      ready: ['Photograph every label for these dishes, front and ingredients.', 'Read each one down to its sub-ingredients.', 'Ask makers in writing about natural flavors, wine, beer, vinegar, vitamin D3, sugar, enzymes, glycerin, emulsifiers and anything fermented.', 'Swap anything with honey, beeswax, carmine, shellac, gelatin, isinglass or animal rennet, or a "contains milk" or "contains egg" line.'] },
    { id: 'g2', n: 'G2', t: 'Hidden in process', rule: 'Stocks, doughs, glazes, pan release, frying oil and shared bases are each traced in the dish\'s evidence.',
      show: 'A process map for each dish: every base it uses, each with its own trace.',
      ready: ['List every stock, dough, glaze, spray, oil and shared sauce the dish touches.', 'Trace each one the same way as an ingredient.'] },
    { id: 'g3', n: 'G3', t: 'Protected path', rule: 'Designated storage, utensils and surfaces. A clean separate pan, pot or barrier is allowed. Never shared fryer oil, shared cooking water, or an uncleaned grill used for animal products. A shared oven only under an approved procedure.',
      show: 'Where each dish is stored, prepped and cooked, with a photo of each station.',
      ready: ['Give these ingredients their own shelf or bin.', 'Set aside utensils and a surface, or use a clean separate pan every time.', 'Use a dedicated fryer and fresh water.', 'Write down how a shared grill is cleaned first, or how a shared oven is used.'] },
    { id: 'g4', n: 'G4', t: 'Accurate use', rule: 'The mark and the dish names are accurate on every channel, delivery apps included.',
      show: 'Every place the dishes appear, with a screenshot of each.',
      ready: ['List your printed menu, website, QR menu, every delivery app and your social.', 'Make sure the dish names match everywhere.', 'Never call the restaurant Vegan.'] },
    { id: 'g5', n: 'G5', t: 'Staff', rule: 'Every critical staff question answered right. A designated manager and a training roster.',
      show: 'The designated manager, everyone trained with the date, and the order-taking script.',
      ready: ['Name one manager responsible for these dishes.', 'Train everyone who takes orders or cooks them, and keep the dates.', 'Teach what to say when a guest asks about allergies or adds something to a dish.'] },
    { id: 'g6', n: 'G6', t: 'Change approval', rule: 'A change to a certified dish is approved before it is served; otherwise the mark stops at once and the change is reported.',
      show: 'An approved pantry list (allowed brands per ingredient) and a signed promise to ask before any change is served.',
      ready: ['Write the list of brands allowed for each ingredient.', 'Check every delivery against it.', 'Ask your supplier not to substitute on these items.'] },
    { id: 'g7', n: 'G7', t: 'Access and corrective action', rule: 'Visits and records open to us. Suspension does not wait on proof of intent; intent only sets the penalty. Independent appeal: 10 business days to appeal, a decision within 20 business days of a complete record.',
      show: 'Signed consent to the visit, one unannounced check a year, records review and photos (no audio).',
      ready: ['Be ready for a kitchen visit and one unannounced check a year.'] },
    { id: 'g8', n: 'G8', t: 'Records', rule: 'Kept for the term plus 5 years.',
      show: 'Where receiving labels, invoices and change approvals are kept, and who keeps them.',
      ready: ['Keep every receiving label and invoice for these dishes in one place.', 'Name the person who keeps them.'] }
  ];
  var GATE_NAME = { eligibility: 'Who can apply' };
  GATES.forEach(function (g) { GATE_NAME[g.n] = g.n + ' ' + g.t; });

  var main = document.getElementById('dgMain');
  var menuEl = document.getElementById('dgMenu'), menuSel = document.getElementById('dgMenuSelect');
  var access = 'checking';   // checking | guest | pending | member
  var READY = null;          // the member's readiness, once read
  var curTab = 'overview';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function auth() { return window.VEAuth || null; }
  function token() { var a = auth(); return a && a.isLoggedIn && a.isLoggedIn() ? a.getToken() : null; }
  function member() { return access === 'member'; }
  function tabs() { return TABS.filter(function (t) { return !(t.guest && member()) && !(t.mine && !member()); }); }
  function tab(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i].k === k) return TABS[i]; return TABS[0]; }
  function href(k) { return '#/' + (k === 'overview' ? '' : k); }

  // ---------- pieces (the parent's) ----------
  function drawMenu(cur) {
    menuEl.innerHTML = tabs().map(function (t) { return '<a href="' + href(t.k) + '"' + (t.k === cur ? ' aria-current="page"' : '') + (t.guest ? ' class="dg-join-tab"' : '') + '>' + esc(t.label) + '</a>'; }).join('');
    menuSel.innerHTML = tabs().map(function (t) { return '<option value="' + t.k + '"' + (t.k === cur ? ' selected' : '') + '>' + esc(t.label) + '</option>'; }).join('');
  }
  menuSel.addEventListener('change', function () { location.hash = href(menuSel.value); });
  function crumb(parts) {
    return '<div class="dg-crumb"><a href="#/">Pre-Vegan Guide</a>' + parts.map(function (p) { return ' &rsaquo; ' + (p[1] ? '<a href="' + p[1] + '">' + esc(p[0]) + '</a>' : esc(p[0])); }).join('') + '</div>';
  }
  function head(k, h, lede) { return '<div class="dg-head"><div><div class="dg-k">' + esc(k) + '</div><h2 class="dg-h1">' + h + '</h2></div></div>' + (lede ? '<p class="dg-lede">' + lede + '</p>' : ''); }
  function startBtn(label) { return '<div class="dg-start"><button type="button" class="dg-btn" data-survey>' + esc(label || 'Take the readiness check') + '</button><p>Free, private, and you can stop any time.</p></div>'; }
  function surveyGo() { try { sessionStorage.setItem('ve_survey_for', SURVEY_SLUG); } catch (e) {} location.href = '/survey?s=' + SURVEY_SLUG; }

  // ---------- views ----------
  function viewOverview() {
    main.innerHTML = head('The Pre-Vegan Restaurant Guide', 'Certify the plant-based dishes you already serve',
      'For restaurants that serve meat, fish, dairy or eggs and also plant-based dishes. Pre-Vegan Certification checks the dishes you name, and the way they are made, at your location. It never says your restaurant is Vegan.') +
      '<div class="pv-gates">' +
      [['What it checks', 'Each named dish: every ingredient traced, every hidden base, and a protected cooking path.'],
       ['Who it is for', 'An open, licensed restaurant with a public menu and at least 3 named plant-based dishes. The first group is in South Florida.'],
       ['What it costs', 'The first group is free. Certification is not open yet; the price is set after the first audits.'],
       ['Start here', 'The readiness check is free and private. It shows, gate by gate, what to work on first.']].map(function (x) {
        return '<div class="pv-gate"><h3>' + esc(x[0]) + '</h3><p>' + esc(x[1]) + '</p></div>';
      }).join('') + '</div>' +
      (member() ? '<div class="dg-start"><a class="dg-btn" href="#/ready">See your readiness</a></div>' : startBtn());
  }
  function viewStamp() {
    main.innerHTML = head('The stamp', 'What a certified dish says',
      'The stamp always travels with its limits, on the same display, readable before ordering. "Pre-Vegan" is the working name until the trademark search and a test with diners.') +
      '<div class="pv-stamp"><b>Plant-Based Dish, Pre-Vegan Certified</b><small><b style="font-size:13px;display:inline">N of M menu items certified</b><br>This restaurant also serves [meat, fish, dairy or eggs: only the ones it serves]. Only the dishes listed are certified.</small></div>' +
      '<div class="pv-gate"><h3>On the menu</h3><p>Plant-Based Dish, Pre-Vegan Certified. Prepared on a protected path. See status: [QR]</p></div>' +
      '<div class="pv-gate"><h3>On the window</h3><p>Selected dishes certified here, with the status link. Never a seal for the whole restaurant.</p></div>' +
      '<div class="pv-gate"><h3>What it means</h3><p>The named dish and the way it is made were checked against our published standard at this location. It is not a claim about the rest of the menu or the kitchen, not an allergen or health claim, and not a food-safety inspection.</p></div>' +
      '<div class="pv-gate"><h3>Never</h3><p>"Vegan" alone, "Vegan restaurant", "100% safe", "allergen-free", "inspected", or a level or score.</p></div>';
  }
  function viewHow() {
    var steps = [
      ['The readiness check', 'Free and private, in this Guide. Only you see your score.'],
      ['A signed application', 'Once certification opens.'],
      ['Your evidence', 'Sent 10 business days before the visit, one item for each gate.'],
      ['The desk review', 'Someone other than the Verifier checks your paperwork.'],
      ['The visit', 'The Verifier watches each dish being made, checks the shelves and takes photos. No audio.'],
      ['The decision', 'A third person decides, in writing. Never software.'],
      ['Twelve months', 'One unannounced check in the year, and a check after a complaint, an owner or chef change, new equipment or a recall.'],
      ['Renewal', 'There is no grace period. An expired dish comes off the registry until it is certified again.']
    ];
    main.innerHTML = head('How it works', 'From the readiness check to a certified dish', 'Every gate must pass. The fee, once there is one, buys the audit and one re-test, never the result.') +
      '<ol class="pv-next" style="padding-left:20px">' + steps.map(function (s) { return '<li><b>' + esc(s[0]) + '.</b> ' + esc(s[1]) + '</li>'; }).join('') + '</ol>' +
      '<p class="pv-note">The public sees a registry of who is certified and a live status page for each dish. There is never a public list of who failed.</p>';
  }
  function viewGates(sub) {
    var g = GATES.filter(function (x) { return x.id === sub; })[0];
    if (!g) {
      main.innerHTML = head('The gates', 'Eight gates, and every one must pass', 'Open a gate to see the rule, what you will show us, and how to get ready.') +
        '<div class="pv-gates">' + GATES.map(function (x) {
          return '<a class="pv-gate" style="display:block;text-decoration:none;color:inherit" href="#/gates/' + x.id + '"><div class="dg-k">' + x.n + '</div><h3>' + esc(x.t) + '</h3><p>' + esc(x.rule) + '</p></a>';
        }).join('') + '</div>';
      return;
    }
    var i = GATES.indexOf(g), prev = GATES[i - 1], nxt = GATES[i + 1];
    main.innerHTML = crumb([['The gates', '#/gates'], [g.n + ' ' + g.t]]) + head(g.n, esc(g.t), null) +
      '<div class="pv-gate"><h3>The rule</h3><p>' + esc(g.rule) + '</p></div>' +
      '<div class="pv-gate"><h3>What you will show us</h3><p>' + esc(g.show) + '</p></div>' +
      '<div class="pv-gate"><h3>How to get ready</h3><ul class="pv-next" style="padding-left:18px;margin:0">' + g.ready.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="dg-btns">' + (prev ? '<a href="#/gates/' + prev.id + '">&larr; ' + prev.n + '</a>' : '') + (nxt ? '<a href="#/gates/' + nxt.id + '">' + nxt.n + ' &rarr;</a>' : '') + '</div>';
  }
  function viewJoin() {
    main.innerHTML = head('Get in', 'One way in, and it is free',
      'Take the readiness check. When you finish, you are a member of Vegans Explore and your private score opens here. No card needed.') +
      '<div class="pv-gate"><h3>What it asks</h3><p>About 25 short questions on your dishes, your labels, your kitchen, your staff and your records. Answer what you know; "not sure" is fine.</p></div>' +
      '<div class="pv-gate"><h3>Who sees it</h3><p>Only you see your score. Your answers help our team shape the program. Nothing you answer is published, and it is not a certification.</p></div>' +
      startBtn() + '<p class="pv-note" style="margin-top:12px">Already a member? <a href="#" data-signin>Sign in</a>.</p>';
  }
  function surveyApi(action) {
    return fetch(SURVEY_URL + '?action=' + action, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ANON_KEY }, body: JSON.stringify({ token: token() }) }).then(function (r) { return r.json(); });
  }
  function viewReady() {
    if (!READY) {
      main.innerHTML = head('Your readiness', 'Reading your answers...', null);
      surveyApi('preveg_readiness').then(function (d) { READY = (d && d.readiness) || { error: 1 }; if (curTab === 'ready') viewReady(); })
        .catch(function () { READY = { error: 1 }; if (curTab === 'ready') viewReady(); });
      return;
    }
    if (READY.error) { main.innerHTML = head('Your readiness', 'We could not read your score just now', 'Refresh the page to try again.'); return; }
    var r = READY;
    if (!r.answered) { main.innerHTML = head('Your readiness', 'Take the readiness check first', 'Your score appears here once you answer.') + startBtn(); return; }
    var top = r.ready_to_apply
      ? '<div class="pv-ok"><b>You look ready to apply.</b> No blockers, and every gate is at 75% or more. When certification opens, we will tell you.</div>'
      : r.blockers.length ? '<div class="pv-block"><b>Fix these first</b><ul style="padding-left:18px;margin:6px 0 0">' + r.blockers.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul></div>'
      : r.answered < r.questions ? '<div class="pv-block"><b>' + (r.questions - r.answered) + ' questions still open.</b> Finish the check for your full score.</div>' : '';
    main.innerHTML = head('Your readiness', r.overall_pct + '% ready', 'Self-reported and private. This is not a certification, and nobody else sees it.') + top +
      '<div class="pv-gates">' + r.gates.map(function (g) {
        return '<div class="pv-gate"><h3>' + esc(GATE_NAME[g.gate] || g.gate) + '</h3><div class="pv-bar"><i style="width:' + g.pct + '%"></i></div><p class="pv-note">' + g.pct + '%' + (g.unanswered ? ' &middot; ' + g.unanswered + ' not answered' : '') + '</p></div>';
      }).join('') + '</div>' +
      (r.next_steps.length ? '<h3 class="dg-k" style="margin:18px 0 6px">Next steps</h3><ul class="pv-next" style="padding-left:18px">' + r.next_steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' : '') +
      '<div class="dg-start"><button type="button" class="dg-btn" data-survey>Change my answers</button><a href="#/gates">See the gates</a></div>';
  }
  function viewNext() {
    main.innerHTML = head('What\'s next', 'You are in. Thank you.', 'Here is where to go from here.') +
      '<div class="pv-gates">' +
      '<div class="pv-gate"><h3>Your readiness</h3><p>Your private score, gate by gate, with what to fix first.</p><a class="dg-btn" href="#/ready">See it</a></div>' +
      '<div class="pv-gate"><h3>Make a contribution (optional)</h3><p>From $11, one time. It helps us build the platform faster. If this is your first $11, it comes with the usual 1,100 welcome points. If not, we understand. This has no effect on your certification or your readiness score.</p><a class="dg-btn" href="/dashboard?contribute=1">Contribute</a></div>' +
      '<div class="pv-gate"><h3>Contribute later</h3><p>Any time, by getting a Guide or completing a bounty.</p><a href="/guides">See the Guides</a></div>' +
      '<div class="pv-gate"><h3>Your page</h3><p>Your restaurant may already be in our Directory. Claim it to keep your hours, photos and menu link up to date.</p><a href="/claim">Find your page</a></div>' +
      '</div>';
  }

  // ---------- Liz, on the right (text only) ----------
  var TOUR = { started: false };
  var tourM = document.getElementById('dgTourM'), foldBtn = document.getElementById('dgFold'), railEl = document.getElementById('dgRail');
  var lizBox = document.getElementById('dgMaya'), bubble = document.getElementById('dgBubble'), playBtn = document.getElementById('dgPlay'), tourEl = document.getElementById('dgTour');
  foldBtn.addEventListener('click', function () { var f = !railEl.classList.contains('dg-folded'); railEl.classList.toggle('dg-folded', f); foldBtn.textContent = f ? 'Show Liz' : 'Hide Liz'; foldBtn.setAttribute('aria-expanded', String(!f)); });
  playBtn.hidden = true; // no recordings yet: the bubble carries her words
  function drawLiz() {
    var t = tab(curTab), list = tabs(), i = 0;
    list.forEach(function (x, n) { if (x.k === curTab) i = n; });
    bubble.textContent = member() && t.sayMember ? t.sayMember : t.say;
    tourEl.innerHTML = tourM.innerHTML = '<a class="dg-tnav" href="' + href(list[Math.max(0, i - 1)].k) + '"' + (i ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Back</a><span>' + (i + 1) + ' of ' + list.length + '</span>' +
      '<a class="dg-tnav next" href="' + href(list[Math.min(list.length - 1, i + 1)].k) + '"' + (i < list.length - 1 ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Next</a>';
  }

  // ---------- router ----------
  function route() {
    var parts = (location.hash || '').replace(/^#\/?/, '').split('/');
    var view = parts[0] || 'overview', sub = parts.slice(1).join('/');
    var known = { overview: 1, stamp: 1, how: 1, gates: 1, join: 1, ready: 1, next: 1 };
    if (!known[view]) view = 'overview';
    if (view === 'join' && member()) { view = 'next'; location.replace('#/next'); }
    if ((view === 'ready' || view === 'next') && access !== 'checking' && !member()) { view = 'join'; location.replace('#/join'); }
    document.body.classList.toggle('dg-member', member());
    drawMenu(view);
    ({ overview: viewOverview, stamp: viewStamp, how: viewHow, gates: function () { viewGates(sub); }, join: viewJoin,
       ready: function () { if (member()) viewReady(); else main.innerHTML = head('Your readiness', 'Checking...', null); }, next: viewNext })[view]();
    curTab = view;
    drawLiz();
    main.scrollTop = 0; if (!document.documentElement.classList.contains('dg-fit') || window.innerWidth <= 900) window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  document.addEventListener('click', function (e) {
    var a = auth();
    if (e.target.closest('[data-survey]')) { e.preventDefault(); surveyGo(); return; }
    if (e.target.closest('[data-signin]')) { e.preventDefault(); if (a) a.showAuthModal('Sign in and the Pre-Vegan Guide opens.', function () { location.reload(); }, 'login'); }
  });

  // ---------- access: a door Guide opens for any active member (ve-guide-unlock) ----------
  function api(action, tok) {
    return fetch(UNLOCK_URL + '?action=' + action, { method: 'POST', headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: SLUG, token: tok || undefined }) }).then(function (r) { return r.json(); });
  }
  function init() {
    document.documentElement.classList.add('dg-fit');
    if (window.VEGuideArt) { var art = VEGuideArt('liz', 'square'); if (art) lizBox.style.backgroundImage = "url('" + art + "')"; }
    var params = new URLSearchParams(location.search);
    if (params.get('welcome') === 'survey') { params.delete('welcome'); history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + '#/ready'); }
    route();
    var tok = token();
    if (!tok) { access = 'guest'; route(); return; }
    api('open', tok).then(function (d) { access = d && d.unlocked ? 'member' : 'pending'; route(); })
      .catch(function () { access = 'pending'; route(); });
  }
  if (window.VEAuth) init(); else window.addEventListener('load', init);
})();
