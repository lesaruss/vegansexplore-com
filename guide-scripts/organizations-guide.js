/* The Organizations Guide (Sean, 2026-11-07, playbook ve-outreach, canon-ve-door-guides v8). Copied from the Creator Guide
 * (guide-scripts/creator-guide.js, template gate): the same tabs-as-tour, rail, menu, Back / N of M / Next and router.
 *
 * For visitor bureaus, chambers of commerce, cities and downtown districts. Sean rejected the slideshow and the travel headline
 * (2026-11-06); the message is his: ten years in this community since 2016, opening January 1 in every chapter city, our
 * Founding campaign and the January push, then the questionnaire, a short call and a custom proposal. Travel is one item on
 * the list, never the headline. Liz narrates (approved by Sean 2026-11-07); her lines are text, not recorded. The chapter
 * count is read live from VE_HUBS (no counts written into copy), so a recording of the Start here line would need rewording.
 *
 * The link in each civic-nov email carries ?o=<organization>&p=<place>&c=<chapter slug>&k=<bureau|chamber|district|city>,
 * kept for the visit, so the Guide names their place, opens on their chapter and words the possibilities for their kind.
 *
 *   start      Start here (VEGuideIntro) and the checklist
 *   who        Who we are: 2016, SoFlo Vegans, 500+ events
 *   city       In your city: our Founding campaign, the January push, live numbers per chapter (ve-votes chapter_stats)
 *   together   What we could do together, worded for their kind
 *   how        How it works: questionnaire, call, custom proposal
 *   go         Get started: /survey?s=organizations (live; finishing it brings them back here to #/next)
 *   next       What's next, shown after the questionnaire (?welcome=survey) or once they have finished it in this browser
 */
(function () {
  var VOTES_FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-votes';
  var SURVEY = '/survey?s=organizations';
  var S = 'stroke="#1f5f22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  function ic(path) { return '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + '>' + path + '</svg>'; }
  var ICON = {
    who: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
    city: ic('<path d="M3 21h18M5 21V9l5-3v15M10 21V4l9 5v12"/><path d="M13 12h3M13 16h3"/>'),
    together: ic('<path d="M7 11l3 3 7-7"/><rect x="3" y="3" width="18" height="18" rx="3"/>'),
    how: ic('<path d="M4 6h16M4 12h10M4 18h6"/>'),
    go: ic('<path d="M5 12h14M13 6l6 6-6 6"/>')
  };

  // ---------- who is reading: from their email link, kept for the visit ----------
  var KINDS = { bureau: 1, chamber: 1, district: 1, city: 1 };
  function recallS(k) { try { return sessionStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function storeS(k, v) { try { if (v) sessionStorage.setItem(k, v); else sessionStorage.removeItem(k); } catch (e) {} }
  var params = new URLSearchParams(location.search);
  ['o', 'p', 'c', 'k'].forEach(function (k) { var v = (params.get(k) || '').slice(0, 120); if (v) storeS('og_' + k, v); });
  var ORG = recallS('og_o'), PLACE = recallS('og_p'), CHAPTER = recallS('og_c'), KIND = KINDS[recallS('og_k')] ? recallS('og_k') : '';
  var welcomed = params.get('welcome') === 'survey';
  if (welcomed) { try { localStorage.setItem('og_done', '1'); } catch (e) {} params.delete('welcome'); history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + '#/next'); }
  var DONE = welcomed; try { DONE = DONE || !!localStorage.getItem('og_done'); } catch (e) {}

  function hubs() { return window.VE_HUBS || []; }
  function hub(slug) { return hubs().filter(function (h) { return h.slug === slug; })[0] || null; }
  function nChapters() { return hubs().length; }
  function place() { return PLACE || (hub(CHAPTER) && hub(CHAPTER).name) || ''; }
  function placeOr(fallback) { return place() || fallback; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---------- Liz's lines (Sean, 2026-11-07) ----------
  function sayStart() {
    var n = nChapters(), p = place();
    return 'Hi, I\'m Liz. You\'re probably not a Vegan organization, and you don\'t need to be. You\'re here because people in your community eat Vegan, and you want them to feel welcome. ' +
      'We\'ve been building this community since 2016, and on January 1 we open in ' + n + ' chapters' + (p ? ', including ' + p : '') + '. ' +
      'This takes about five minutes: who we are, how we show up in your city, what we could do together, and how to start. If I can\'t answer something, I\'ll pass it to our team.';
  }
  function sayCity() {
    return 'Right now we\'re running our Founding campaign, reaching out to every Vegan business, nonprofit and organization across our ' + nChapters() + ' chapters. ' +
      'On January 1, 2027, we launch with a big push to help places in ' + placeOr('your city') + ' add plant-based options and welcome Vegans, so more people have a reason to come in and come back. ' +
      'We do it through members who check in and vote, community bounties, local partners and a Daily Pulse every morning. Pick your city and see what\'s already there.';
  }
  function sayTogether() {
    return 'You know ' + placeOr('your community') + ' better than anyone, so this starts with you. Here are a few places we could begin, and if you have something else in mind, tell us.';
  }
  var TABS = [
    { k: 'start', label: 'Start here', say: sayStart },
    { k: 'who', label: 'Who we are', say: function () { return 'We started in South Florida in 2016 as SoFlo Vegans, with events, a podcast and a lot of time with local businesses. Ten years and more than 500 events later, Vegans Explore is what that became: one home for the Vegan community, city by city.'; } },
    { k: 'city', label: 'In your city', say: sayCity },
    { k: 'together', label: 'What we could do together', say: sayTogether },
    { k: 'how', label: 'How it works', say: function () { return 'Three steps. A short questionnaire, about three minutes. A short call with our team. Then a custom proposal made for you. There\'s no price list here, because the proposal comes after we\'ve listened.'; } },
    { k: 'go', label: 'Get started', say: function () { return 'The questionnaire takes about three minutes. Your answers go straight to our team, and we\'ll reach out to set up the call. Finishing it also makes you a member, free, so you can look around everything we\'ve built.'; } },
    { k: 'next', label: 'What\'s next', done: 1, say: function () { return 'Thank you. Our team has your answers and will reach out to set up a short call. While you wait, here\'s your city on Vegans Explore.'; } }
  ];
  function tabs() { return TABS.filter(function (t) { return !t.done || DONE; }); }
  function tab(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i].k === k) return TABS[i]; return TABS[0]; }
  function href(k) { return '#/' + (k === 'start' ? '' : k); }

  var main = document.getElementById('dgMain'), menuEl = document.getElementById('dgMenu'), menuSel = document.getElementById('dgMenuSelect');
  var bubble = document.getElementById('dgBubble'), tourEl = document.getElementById('dgTour'), tourM = document.getElementById('dgTourM');
  var foldBtn = document.getElementById('dgFold'), railEl = document.getElementById('dgRail');
  var curTab = 'start';

  function drawMenu(cur) {
    menuEl.innerHTML = tabs().map(function (t) { return '<a href="' + href(t.k) + '"' + (t.k === cur ? ' aria-current="page"' : '') + '>' + esc(t.label) + '</a>'; }).join('');
    menuSel.innerHTML = tabs().map(function (t) { return '<option value="' + t.k + '"' + (t.k === cur ? ' selected' : '') + '>' + esc(t.label) + '</option>'; }).join('');
  }
  menuSel.addEventListener('change', function () { location.hash = href(menuSel.value); });

  function head(k, h, lede) {
    return '<div class="dg-head"><div><div class="dg-k">' + esc(k) + '</div><h2 class="dg-h1">' + h + '</h2></div></div>' + (lede ? '<p class="dg-lede">' + lede + '</p>' : '');
  }
  function nextBtn(k, label) { return '<div class="dg-btns" style="margin-top:18px"><a class="dg-btn" href="' + href(k) + '">' + esc(label) + '</a></div>'; }

  // ---------- views ----------
  function viewStart() {
    var who = ORG ? esc(ORG) + ': this' : 'This';
    var tiles = [['who', 'Who we are', 'Ten years in this community, since 2016.'], ['city', 'In your city', 'How we show up, and what\'s already there.'],
      ['together', 'What we could do together', 'A few places to begin, starting with you.'], ['how', 'How it works', 'A questionnaire, a call, a proposal made for you.']];
    main.innerHTML = head('The Organizations Guide', who + ' is for organizations that welcome people', '') +
      (window.VEGuideIntro ? VEGuideIntro.html({
        place: 'This Guide is for visitor bureaus, chambers of commerce, cities and downtown districts.',
        why: ['We have been in this community since 2016.', 'On January 1, 2027, Vegans Explore opens in every city where we have a chapter.'],
        change: 'you will know who we are, how we show up in your city, what we could do together, and the three steps to a custom proposal.',
        how: 'go tab by tab with Next, or jump to any tab above. It takes about five minutes.',
        pic: '/public/guides/thumb-community.jpg'
      }) : '') +
      '<div class="dg-tiles" style="margin-top:14px">' + tiles.map(function (t) {
        return '<a class="dg-tile" href="' + href(t[0]) + '"><span class="dg-ic">' + ICON[t[0]] + '</span><span><b>' + esc(t[1]) + '</b><span>' + esc(t[2]) + '</span></span></a>';
      }).join('') + '</div>' + nextBtn('who', 'Start with who we are');
  }
  function viewWho() {
    main.innerHTML = head('Who we are', 'Ten years in this community', 'We started in South Florida in 2016 as SoFlo Vegans: events, a podcast and a lot of time with local businesses. More than 500 events hosted and backed since then. Vegans Explore is what that became: one home for the Vegan community, city by city.') +
      '<div class="dg-grid">' +
        card('The Directory', 'Vegan places, plant-based options, brands, nonprofits and people, voted on by our members.', '/directory', 'Open the Directory') +
        card('Events', 'A calendar of Vegan events in our chapters and around the world.', '/events', 'See the calendar') +
        card('The Daily Pulse', 'What is happening in each city, every morning.', '/pulse', 'Read today\'s Pulse') +
        card('Guides', 'Guides that walk people through eating out, travel, game day and more.', '/guides', 'See the Guides') +
        card('Our podcasts', 'Conversations with the people building the Vegan community.', '/media', 'Listen') +
      '</div>' + nextBtn('city', 'Next: in your city');
  }
  function card(h, p, link, cta) { return '<div class="dg-card"><h3>' + esc(h) + '</h3><p>' + esc(p) + '</p><span class="dg-src"><a href="' + link + '" target="_blank" rel="noopener">' + esc(cta) + '</a></span></div>'; }

  var STATS = null, statsWait = false;
  function loadStats(then) {
    if (STATS || statsWait) { if (STATS && then) then(); return; }
    statsWait = true;
    fetch(VOTES_FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'chapter_stats' }) })
      .then(function (r) { return r.json(); }).then(function (d) { STATS = {}; (d.chapters || []).forEach(function (r) { STATS[r.chapter] = r; }); statsWait = false; if (then) then(); })
      .catch(function () { statsWait = false; });
  }
  function cityBlock(slug) {
    var h = hub(slug);
    if (!h) return '<p class="dg-empty">Pick a city to see what\'s already there.</p>';
    var st = STATS && STATS[slug], n = function (k) { return st ? Number(st[k] || 0).toLocaleString('en-US') : '...'; };
    var banner = h.page && h.page.banner ? ' style="background-image:linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25)),url(\'' + esc(h.page.banner) + '\')"' : '';
    return '<div class="og-ban"' + banner + ' role="img" aria-label="' + esc((h.page && h.page.alt) || h.name) + '"></div>' +
      '<div class="og-stats"><div><b>' + n('places') + '</b><span>Places in the Directory</span></div><div><b>' + n('events') + '</b><span>Events coming up</span></div></div>' +
      '<div class="dg-btns">' +
        '<a class="dg-btn" href="/communities/' + encodeURIComponent(slug) + '" target="_blank" rel="noopener">See ' + esc(h.name) + ' on Vegans Explore</a>' +
        '<a class="dg-btn dg-ghost" href="/directory?city=' + encodeURIComponent(slug) + '" target="_blank" rel="noopener">The Directory</a>' +
        '<a class="dg-btn dg-ghost" href="/events?city=' + encodeURIComponent(slug) + '" target="_blank" rel="noopener">Events</a>' +
        '<a class="dg-btn dg-ghost" href="/pulse?city=' + encodeURIComponent(slug) + '" target="_blank" rel="noopener">Daily Pulse</a>' +
      '</div>';
  }
  function viewCity(mode) {
    var pick = '<label class="og-pick"><span class="dg-k" style="display:block;margin-bottom:6px">Your city</span><select id="ogCity"><option value="">Pick a city</option>' +
      hubs().map(function (h) { return '<option value="' + esc(h.slug) + '"' + (h.slug === CHAPTER ? ' selected' : '') + '>' + esc(h.name) + '</option>'; }).join('') + '</select></label>';
    main.innerHTML = (mode === 'next'
      ? head('What\'s next', 'Thank you', 'Our team has your answers and will reach out to set up a short call. While you wait, here\'s your city on Vegans Explore.')
      : head('In your city', 'How we show up in ' + esc(placeOr('your city')),
        'Right now we\'re running our Founding campaign, reaching out to every Vegan business, nonprofit and organization across our ' + nChapters() + ' chapters. On January 1, 2027, we launch with a big push to help places add plant-based options and welcome Vegans, so more people have a reason to come in and come back.') +
        '<div class="og-list">' +
          '<div><i>1</i><span><b>Members</b> check in where they go and vote for the places they love.</span></div>' +
          '<div><i>2</i><span><b>Community bounties</b> keep listings right, like checking a place is still open.</span></div>' +
          '<div><i>3</i><span><b>Local partners</b>: businesses, nonprofits and groups in each city.</span></div>' +
          '<div><i>4</i><span><b>The Daily Pulse</b>: what is happening in each city, every morning.</span></div>' +
        '</div>') +
      pick + '<div id="ogCityBox">' + cityBlock(CHAPTER) + '</div>' + (mode === 'next' ? '' : nextBtn('together', 'Next: what we could do together'));
    document.getElementById('ogCity').addEventListener('change', function () { CHAPTER = this.value; storeS('og_c', CHAPTER); document.getElementById('ogCityBox').innerHTML = cityBlock(CHAPTER); });
    loadStats(function () { var box = document.getElementById('ogCityBox'); if (box) box.innerHTML = cityBlock(CHAPTER); });
  }
  function ideas(k) {
    var p = placeOr('your city');
    if (k === 'chamber') return ['Help people find your member businesses.', 'Help your members add plant-based options and reach Vegan customers.', 'Promote your events to the Vegan community.', 'Show that ' + p + ' welcomes Vegans.', 'Something you have in mind.'];
    return ['Help visitors and residents find Vegan places in ' + p + '.', 'Promote your events and festivals to the Vegan community.', 'Show that ' + p + ' welcomes Vegans.', 'Bring more Vegan travelers to your area.', 'Something you have in mind.'];
  }
  function viewTogether() {
    var k = KIND || 'bureau';
    var kinds = [['bureau', 'Visitor bureau'], ['chamber', 'Chamber of commerce'], ['district', 'Downtown district'], ['city', 'City or town']];
    main.innerHTML = head('What we could do together', 'It starts with ' + esc(ORG || 'you'),
        'You know ' + esc(placeOr('your community')) + ' better than anyone. Here are a few places we could begin, and if you have something else in mind, tell us.') +
      '<div class="dg-chips" role="group" aria-label="Your kind of organization">' + kinds.map(function (x) { return '<button type="button" class="dg-chip" data-k="' + x[0] + '" aria-pressed="' + (x[0] === k) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="og-list">' + ideas(k).map(function (t, i) { return '<div><i>' + (i + 1) + '</i><span>' + esc(t) + '</span></div>'; }).join('') + '</div>' +
      nextBtn('how', 'Next: how it works');
    [].forEach.call(main.querySelectorAll('[data-k]'), function (b) { b.addEventListener('click', function () { KIND = b.getAttribute('data-k'); storeS('og_k', KIND); viewTogether(); }); });
  }
  function viewHow() {
    main.innerHTML = head('How it works', 'Three steps', 'There\'s no price list here, because the proposal comes after we\'ve listened.') +
      '<div class="rg-steps">' +
        '<div class="rg-step"><em>1</em><b>A short questionnaire</b><p>About three minutes: who you are, your city and what you would like to do.</p></div>' +
        '<div class="rg-step"><em>2</em><b>A short call with our team</b><p>We listen first, and ask what would help most.</p></div>' +
        '<div class="rg-step"><em>3</em><b>A custom proposal made for you</b><p>Written for ' + esc(ORG || 'your organization') + ', after the call.</p></div>' +
      '</div>' + nextBtn('go', 'Next: get started');
  }
  function viewGo() {
    main.innerHTML = head('Get started', 'The questionnaire', 'It takes about three minutes. Your answers go straight to our team, and we\'ll reach out to set up the call. Finishing it also makes you a member, free, so you can look around everything we\'ve built.') +
      '<div class="dg-door"><p>Nothing is charged. You can stop and come back: your answers save as you go.</p><div class="dg-btns"><a class="dg-btn" href="' + SURVEY + '">Take the questionnaire</a></div></div>';
  }

  // ---------- Liz on the right ----------
  function setFold(folded) {
    railEl.classList.toggle('dg-folded', folded);
    foldBtn.textContent = folded ? 'Show Liz' : 'Hide Liz'; foldBtn.setAttribute('aria-expanded', String(!folded));
    try { sessionStorage.setItem('og_liz_folded', folded ? '1' : ''); } catch (e) {}
  }
  foldBtn.addEventListener('click', function () { setFold(!railEl.classList.contains('dg-folded')); });
  try { if (sessionStorage.getItem('og_liz_folded')) setFold(true); } catch (e) {}
  function drawLiz() {
    var list = tabs(), i = 0;
    list.forEach(function (x, n) { if (x.k === curTab) i = n; });
    bubble.textContent = tab(curTab).say();
    tourEl.innerHTML = tourM.innerHTML = '<a class="dg-tnav" href="' + href(list[Math.max(0, i - 1)].k) + '"' + (i ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Back</a><span>' + (i + 1) + ' of ' + list.length + '</span>' +
      '<a class="dg-tnav next" href="' + href(list[Math.min(list.length - 1, i + 1)].k) + '"' + (i < list.length - 1 ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Next</a>';
  }

  // ---------- router ----------
  function route() {
    var view = (location.hash || '').replace(/^#\/?/, '').split('/')[0] || 'start';
    var known = { start: 1, who: 1, city: 1, together: 1, how: 1, go: 1, next: DONE ? 1 : 0 };
    if (!known[view]) view = 'start';
    drawMenu(view);
    ({ start: viewStart, who: viewWho, city: function () { viewCity(); }, together: viewTogether, how: viewHow, go: viewGo, next: function () { viewCity('next'); } })[view]();
    curTab = view;
    drawLiz();
    main.scrollTop = 0; if (!document.documentElement.classList.contains('dg-fit') || window.innerWidth <= 900) window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  function init() {
    document.documentElement.classList.add('dg-fit');
    var box = document.getElementById('dgMaya');
    if (window.VEGuideArt) { var art = VEGuideArt('liz', 'square'); if (art) box.style.backgroundImage = "url('" + art + "')"; }
    route();
  }
  if (window.VEGuideArt) init(); else window.addEventListener('load', init);
})();
