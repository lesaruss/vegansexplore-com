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
    { k: 'gates', label: 'The gates', say: 'There are eight gates, and every one must pass. Open any gate for what to do, how to prove it, and what our Verifier checks. Everything you need is here, free.' },
    { k: 'join', label: 'Get in', guest: 1, say: 'There is one way in, and it is free. Take the readiness check. It takes a few minutes, it is private, and when you finish you are a member and your score is ready.' },
    { k: 'ready', label: 'Your readiness', mine: 1, say: 'This is your private readiness score, gate by gate. Fix the blockers first, then work down the next steps. It is not a certification, and nobody else sees it.' },
    { k: 'next', label: 'What\'s next', mine: 1, say: 'You are in. Thank you. Here is what you can do next. If you want to help us build faster, you can make a one-time contribution. If not, we understand.' }
  ];

  // The eight gates (Standard V1.2, locked) as plain how-tos (canon v9: the Guide gives the full answers; Sean approved the
  // text 2026-11-06, docs/proposals/pre-vegan-guide-gate-howtos.md). `rule` is the standard; `todo` what to do; `prove` how to
  // prove it; `checks` what the Verifier checks; `fails` common ways kitchens fail (the Verifier ring test).
  var GATES = [
    { id: 'g1', n: 'G1', t: 'Ingredient evidence',
      rule: 'Every ingredient and sub-ingredient in the dish is traced to a brand and product. A distributor\'s say-so alone does not count. Missing evidence fails.',
      todo: ['Write the recipe card for the dish: every ingredient, by brand and product, in the amounts you use.',
        'For each thing you buy, photograph the front of the package and the ingredient list. If it comes in a case with no retail label, ask the supplier for the specification sheet.',
        'Read every label down to the sub-ingredients (what is inside the sauce, the bread, the spice blend).',
        'Take out anything with honey, beeswax, carmine (also called cochineal or E120), shellac (confectioner\'s glaze), gelatin, isinglass or animal rennet, and anything whose label says "Contains milk" or "Contains egg". Swap the brand, or leave that dish out.',
        'For these ten, ask the maker in writing and keep the answer: natural flavors, wine, beer, vinegar, vitamin D3, cane sugar, enzymes, glycerin, emulsifiers (mono and diglycerides, lecithin from an unnamed source) and anything fermented. A short email works: "Is [product] free of all animal-derived ingredients and processing aids, including [the item]? Please reply in writing."',
        '"May contain milk" or a shared-facility line is not a fail. Note it; it goes in the dish\'s disclosure.'],
      prove: 'One folder per dish: the recipe card, a label photo or spec sheet for every bought ingredient, and the written answers from the makers.',
      checks: 'At the desk: every ingredient named by brand and product, a label or spec sheet for each, no banned ingredient, every item on the ten-item list answered in writing. In the kitchen: what is on the shelf matches the folder, three invoices pulled at random match the brands, every unlabeled container is identified, and each packaged ingredient is scanned.',
      fails: 'A vegetable stock with no brand named. A bun from a supplier with no label photo. A house dressing with honey.' },
    { id: 'g2', n: 'G2', t: 'Hidden in process',
      rule: 'Anything the dish touches on its way to the plate (stocks, doughs, glazes, pan spray, frying oil, shared bases) is traced the same way as an ingredient.',
      todo: ['Walk the dish from the shelf to the plate and write down every base it uses: stock, dough, bread or bun, glaze, sauce, dressing, marinade, pan release spray, frying or cooking oil, butter substitute, garnish, topping.',
        'For anything you make in house, write its own recipe card and trace its ingredients as in G1.',
        'Check the sprays and oils most kitchens forget: many pan sprays contain lecithin or flavorings, and "butter-flavored" oils can contain milk.',
        'If a base is shared with other dishes (a house sauce, a pizza dough), it must pass for this dish too, or this dish gets its own.'],
      prove: 'A one-page process map for each dish: every base it uses, each with its trace attached.',
      checks: 'The map against what they watch being made. A base used at the station that is not on the map fails the dish until it is traced.',
      fails: 'Butter brushed on the bun at the pass. A shared stock nobody thought of as an ingredient.' },
    { id: 'g3', n: 'G3', t: 'Protected path',
      rule: 'Every certified dish has a protected cooking path: its own storage, utensils and surfaces, or a clean separate pan, pot or barrier. Never shared fryer oil, shared cooking water, or a grill used for animal products and not cleaned first. A shared oven only under a written procedure we approved.',
      todo: ['Storage: give the dish\'s ingredients their own shelf or bin, labeled, never under raw animal products unless covered.',
        'Tools: set aside a pan, pot, tongs, ladle and cutting board for the dish (a color you use for nothing else works well). Or use a pan that is cleaned and sanitized and holds only this dish during its cook.',
        'Surfaces: a clean sheet, foil or a dedicated tray between the dish and any shared surface.',
        'Fryer: a dedicated fryer, or no frying for this dish. Shared oil with chicken or fish is a fail, no matter how often it is changed.',
        'Water: fresh water for pasta or vegetables, never the pot that cooked anything else.',
        'Grill or flat-top: scrape and clean it before the dish goes on, every time, or use a barrier or a separate pan on top.',
        'Oven: covered or on its own tray, and write down how you do it. Send that procedure with your evidence.',
        'Garnish: a separate garnish container for the dish, not the shared station with cheese, butter or bacon.'],
      table: { pass: ['Dedicated pan, pot, utensils and board', 'A shared pan, cleaned and sanitized, used only for this dish during its cook', 'A clean barrier on a shared surface', 'Shared oven, covered or on its own tray, under a written procedure'],
        fail: ['Shared fryer oil with any animal product', 'Pasta or vegetable water shared with animal products', 'A grill used for meat and not cleaned first', 'Shared oven, no procedure', 'Tongs or ladles moving between the dish and animal products', 'A shared garnish station with no separation', 'Stored under raw animal products, uncovered'] },
      prove: 'Where each dish is stored, prepped and cooked, a photo of each station, and the written oven procedure if you use a shared oven.',
      checks: 'They watch each dish made start to finish by the person who usually makes it, at normal service pace, and photograph each station. If they see something the table does not cover, they write it down and the approver decides; they never rule at the counter.',
      fails: 'Fries in the shared fryer. Pasta in the shared water. The same tongs for the chicken and the vegetables during a rush.' },
    { id: 'g4', n: 'G4', t: 'Accurate use',
      rule: 'The mark and the dish names are accurate everywhere the dish appears, delivery apps included.',
      todo: ['List every place the dish appears: printed menu, boards, website, QR menu, each delivery app, your social accounts.',
        'Use the same dish name everywhere, word for word.',
        'Put the mark only next to certified dishes, with the menu key ("Plant-Based Dish, Pre-Vegan Certified") on the same page or screen.',
        'Never call the restaurant Vegan, never put the mark on the door or the whole menu, never write "Vegan" alone on a certified dish, and never "allergen-free", "100% safe" or "inspected".',
        'On delivery apps, ask each platform to change a dish called "Vegan" to the certified name with the key in the description.'],
      prove: 'A screenshot or photo of every place the dish appears.',
      checks: 'The printed menu, boards, website and every delivery app that lists the dish, against your list.',
      fails: 'A delivery app still listing the dish as "Vegan" with no key.' },
    { id: 'g5', n: 'G5', t: 'Staff',
      rule: 'Every critical staff question is answered right. One manager is named for these dishes, and there is a training roster.',
      todo: ['Name one manager who is responsible for the certified dishes.',
        'Train everyone who takes orders for or cooks these dishes. Write down who and the date. Retrain anyone new before their first shift on these dishes.',
        'Teach the answers below. The Verifier asks two staff members questions like these, and one wrong answer fails the visit.',
        'Post the script where order-takers can see it.'],
      qa: [['Is this dish Vegan?', 'It is 100% plant-based, prepared on a protected path, and certified for this dish only. Here is the status page.'],
        ['Can you add cheese (or butter, or egg) to it?', 'Yes, but then it is no longer the certified dish, and we will tell you so.'],
        ['Is the rest of the menu Vegan?', 'No. Only the marked dishes are certified.'],
        ['Is it allergen-free?', 'No. It has no animal ingredients, but we do not certify allergens. Here is what is in it.'],
        ['Is it cooked in the same fryer, water or pan as meat?', 'No. It has its own path. (They should be able to say what that path is.)'],
        ['What if you are out of an ingredient?', 'We do not swap it. We take the dish off until we have the approved one.'],
        ['Who do I ask if I have a question?', 'The manager on duty, by name.']],
      prove: 'The manager\'s name, the training roster with dates, and the order-taking script.',
      checks: 'At least two staff members who make or serve the dishes, the critical questions, and the roster. Secret shoppers ask "Is this Vegan?" between visits.',
      fails: 'A server who says "it has a little butter". A new hire who was never trained.' },
    { id: 'g6', n: 'G6', t: 'Change approval',
      rule: 'Any change to a certified dish is approved by us before it is served. Otherwise the mark stops at once and the change is reported.',
      todo: ['Write an approved pantry list: for each ingredient, the brands you are allowed to use.',
        'Check every delivery against the list when it arrives. A different brand goes to the side, not into the dish.',
        'Ask your suppliers in writing not to substitute on these items without telling you.',
        'Before you change a recipe, a brand, a base or the way the dish is cooked, tell us and wait for the yes. A change we did not approve means the dish\'s mark stops until it is checked again. Hiding a change ends every certification at the location and removes the restaurant from Vegans Explore for 2 years.',
        'If you are out of an approved ingredient, take the dish off rather than swap it.'],
      prove: 'The approved pantry list, and a signed promise to ask before any change is served.',
      checks: 'The pantry list against the shelf and three invoices, and anything on the shelf that is not on the list.',
      fails: 'A distributor substitutes a different stock and nobody checks the delivery.' },
    { id: 'g7', n: 'G7', t: 'Access and corrective action',
      rule: 'Our visits and your records are open to us. Suspension does not wait on proof of intent; intent only sets the penalty. An independent appeal: 10 business days to appeal, a decision within 20 business days of a complete record.',
      todo: ['Agree to a scheduled kitchen visit, one courtesy check a year, and secret shoppers who order like any guest.',
        'Agree to photos of storage, stations and labels (never audio, never guests).',
        'Know what happens if something is wrong: the dish\'s mark stops while it is fixed, you can appeal within 10 business days, and you get a decision within 20 business days of a complete record.'],
      prove: 'Signed consent to the visit, the yearly check, records review and photos.',
      checks: 'That they were let in, saw what they asked to see, and could photograph it.' },
    { id: 'g8', n: 'G8', t: 'Records',
      rule: 'Records are kept for the term plus 5 years.',
      todo: ['Keep, in one place, every receiving label and invoice for these dishes\' ingredients, the written answers from makers, the training roster and every change approval.',
        'Name the person who keeps them.',
        'Keep them for the 12-month term and 5 years after. A shared drive folder per dish is enough.'],
      prove: 'Where the records are kept and who keeps them.',
      checks: 'Three invoices pulled at random, and that the folder holds what this page lists.' }
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
      main.innerHTML = head('The gates', 'Eight gates, and how to pass each one', 'Every gate must pass. Open one for what to do, how to prove it, and what the Verifier checks. It is all here, free.') +
        '<div class="pv-gates">' + GATES.map(function (x) {
          return '<a class="pv-gate" style="display:block;text-decoration:none;color:inherit" href="#/gates/' + x.id + '"><div class="dg-k">' + x.n + '</div><h3>' + esc(x.t) + '</h3><p>' + esc(x.rule) + '</p></a>';
        }).join('') + '</div>' +
        '<div class="pv-gate pv-own"><h3>Doing it without us</h3><p>Everything here is yours to use. If you put it in place and never apply, your kitchen is ready for the guest who will not walk into a Vegan restaurant but wants to trust one dish. That counts as a win for us too. If you want an independent check and the public mark that tells diners it was checked, that is what certification is for.</p></div>';
      return;
    }
    var i = GATES.indexOf(g), prev = GATES[i - 1], nxt = GATES[i + 1];
    main.innerHTML = crumb([['The gates', '#/gates'], [g.n + ' ' + g.t]]) + head(g.n, esc(g.t), null) +
      '<div class="pv-gate"><h3>The rule</h3><p>' + esc(g.rule) + '</p></div>' +
      '<div class="pv-gate"><h3>What to do</h3><ol class="pv-next pv-todo">' + g.todo.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ol>' +
        (g.qa ? '<dl class="pv-qa">' + g.qa.map(function (q) { return '<dt>' + esc(q[0]) + '</dt><dd>' + esc(q[1]) + '</dd>'; }).join('') + '</dl>' : '') + '</div>' +
      (g.table ? '<div class="pv-pf"><div class="pv-pf-col ok"><h3>Passes</h3><ul>' + g.table.pass.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></div>' +
        '<div class="pv-pf-col no"><h3>Fails</h3><ul>' + g.table.fail.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></div></div>' : '') +
      '<div class="pv-gate"><h3>How to prove it</h3><p>' + esc(g.prove) + '</p></div>' +
      '<div class="pv-gate"><h3>What the Verifier checks</h3><p>' + esc(g.checks) + '</p></div>' +
      (g.fails ? '<div class="pv-gate pv-fails"><h3>Common ways kitchens fail</h3><p>' + esc(g.fails) + '</p></div>' : '') +
      '<div class="dg-btns">' + (prev ? '<a class="dg-tnav" href="#/gates/' + prev.id + '">&larr; ' + prev.n + '</a>' : '') + (nxt ? '<a class="dg-tnav next" href="#/gates/' + nxt.id + '">' + nxt.n + ' &rarr;</a>' : '') + '</div>';
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
