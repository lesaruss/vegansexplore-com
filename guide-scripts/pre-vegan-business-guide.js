/* The Pre-Vegan Business Guide (playbook ve-pre-vegan-business-guide; Sean approved the tabs, survey and Maya's lines 2026-11-06,
 * draft docs/proposals/pre-vegan-business-guide.md). For businesses that are not Vegan and are adding plant-based (Pre-Vegan)
 * options: coffee shops, gyms, juice bars, cafes, caterers. Copied from the Vegan Restaurant Guide under the template gate.
 * canon-ve-pre-vegan-meaning (Sean, 2026-11-06): a business that is not Vegan offers plant-based or Pre-Vegan options, never
 * "Vegan options", in our own copy; it earns the word Vegan. The Overview follows canon-ve-guide-overview-standard
 * (docs/proposals/pre-vegan-business-guide-overview.md, approved by Sean 2026-11-06).
 *
 * The tabs are the tour. Maya stays on the right of every tab; her lines are text beside her still picture until Sean approves a
 * recording (her voice is on her roster profile). Back / N of M / Next under her walks the tabs in order.
 *
 *   Overview       the story (the opening standard) and the 5-step checklist; members tick it, saved on the account
 *   Why add plant-based  honest reasons, sourced, and what it does not do
 *   What to add    by kind of business; the coffee shop is open to everyone (the free example), the rest after the survey
 *   How to say it  menu words: plant-based for an item, plant-based options for a menu, the shared kitchen line
 *   Sourcing       members: the shared supplier directory (ve-sourcing), honest labels
 *   Buy or make    members: each item, who sells it ready-made, or a home-scale recipe
 *   Get found      members: how the Directory lists places, vetting by member votes, votes rank, nobody pays to move up
 *
 * Members see the tabs as 5 groups in one dropdown (Sean, 2026-11-06; the Events Guide's GROUPS): Start here, Learn it, Add it,
 * Get found, Your list. Visitors keep the flat tabs.
 *   Claim your page members: find your page and claim it, or add your business
 *   What's next    members: what to do next; tasting nights are Coming until one has run
 *   My list        members: saved kinds of business (ve_guide_saves through ve-cookbook)
 *   Get in         visitors: the short survey, the only door
 *
 * A door Guide (canon-ve-door-guides): free with its survey, and ve-guide-unlock opens it to any active member. The members-only
 * text (what to add for every kind of business but the coffee shop) is ve_guides.content_html, never in this repo.
 * Never promise sales, customers or no backlash. Featuring never buys rank.
 */
(function () {
  var SLUG = 'pre-vegan-business-guide';
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var UNLOCK_URL = SB + '/functions/v1/ve-guide-unlock';
  var COOK_URL = SB + '/functions/v1/ve-cookbook';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';

  // The tabs, in tour order, and what Maya says on each (Sean approved every line, 2026-11-06). A line's text must match its recording; change one and record -v2.
  var TABS = [
    { k: 'overview', label: 'Overview', say: 'Hi, I\'m Maya. If you\'re adding plant-based options, you might be worried about getting it wrong, or that nobody will order them. That\'s normal, and it\'s why this Guide exists. It\'s for coffee shops, gyms, juice bars, cafes and restaurants that aren\'t Vegan yet. Inside, you\'ll find what to add first, who sells it, a recipe to make it, and the right words for your menu. When you finish, you\'ll have your first items picked, a supplier or recipe for each, your menu wording set, and your page claimed. Press Play on any page and I\'ll walk you through it. Take the short survey and the whole Guide opens. It\'s free. And if you get stuck, ask me. If I can\'t answer, our team will.',
      sayMember: 'Welcome in. Start here has your five steps. Tick each one as you go, and it stays on your account. The menu at the top has the rest of the Guide, or follow me with Next.' },
    { k: 'why', label: 'Why add plant-based', say: 'Here\'s the honest version. Who asks for plant-based options, what a short list costs you, and what it won\'t do. Every number has its source under it.' },
    { k: 'add', label: 'What to add', say: 'Pick your kind of business. Coffee shops are open to everyone: the first things to add, what to stock, and what to watch for. The rest open with the survey.',
      sayMember: 'Pick your kind of business. Each one has a few easy first items, what to stock, and what to watch for.' },
    { k: 'say', label: 'How to say it', say: 'The words matter. Call an item plant-based only when it has nothing from an animal: no meat, dairy, eggs or honey. Call your menu plant-based options. Here\'s a line for shared kitchens too.' },
    { k: 'sourcing', label: 'Sourcing', mine: 1, say: 'You don\'t have to make it all. Here\'s who sells it, and every supplier wears an honest label. Check with the supplier before you order.' },
    { k: 'make', label: 'Buy or make', mine: 1, say: 'For each item, see who sells it ready, or a recipe to make it. The recipes are home scale, so test a batch before you scale it.' },
    { k: 'found', label: 'Get found', mine: 1, say: 'Here\'s how people find you in our Directory. Places with plant-based options are vetted by member votes, and nobody can pay to move up.' },
    { k: 'claim', label: 'Claim your page', mine: 1, say: 'If your business is in our Directory, claim your page and keep it current. If it isn\'t, add it here.' },
    { k: 'next', label: 'What\'s next', mine: 1, say: 'You\'re in. Thank you. Claim your page, save what you need, and follow us. Tasting nights are coming, and we\'ll tell you when the first one runs.' },
    { k: 'mylist', label: 'My list', mine: 1, say: 'Everything you saved is right here.' },
    { k: 'join', label: 'Get in', guest: 1, say: 'There\'s one way in, and it\'s free. Take the short survey about your business, and the whole Guide opens.' }
  ];
  // Maya's recordings (2026-11-06: el-media tts in her roster-profile voice, each checked word for word with stt).
  // AUDIO_V is the visitor's line, AUDIO_M the member's; a member tab with no entry of its own plays the visitor line (same words).
  var AUDIO_BASE = SB + '/storage/v1/object/public/vegan-media/media/maya/pre-vegan-business-guide/';
  // -v2 (2026-11-06): the new Overview and the plant-based language (canon-ve-pre-vegan-meaning). The -v1 files stay in storage.
  var AUDIO_V = { overview: 'overview-v2', why: 'why-v2', add: 'add-v1', say: 'say-v2', join: 'join-v1' };
  // Group pages (members): Maya's `say` in GROUPS, recorded as g-<group>-v1.mp3 (approved by Sean 2026-11-06, recorded 2026-11-07, checked with stt).
  var AUDIO_G = { learn: 'g-learn-v1', addit: 'g-addit-v1', gofound: 'g-gofound-v1', yours: 'g-yours-v1' };
  var AUDIO_M = { overview: 'overview-member-v2', add: 'add-member-v1', sourcing: 'sourcing-v1', make: 'make-v1', found: 'found-v2', claim: 'claim-v1', next: 'next-v1', mylist: 'mylist-v1' };
  // Members: the tabs as 5 groups (Sean, 2026-11-06), copied from the Events Guide's GROUPS. A group opens as a page of tiles; the
  // dropdown and Back / Next go by group. Maya's line on a group page (`say`) is recorded (AUDIO_G); change a line, record -v2.
  var GROUPS = [
    { k: 'start', label: 'Start here', kids: [] },
    { k: 'learn', label: 'Learn it', kids: ['why', 'say'], line: 'Why plant-based options are worth it, and the right words for your menu.',
      say: 'Learn it is the why and the words. Start with the honest reasons, then the words that make customers trust your menu.' },
    { k: 'addit', label: 'Add it', kids: ['add', 'sourcing', 'make'], line: 'What to add first, who sells it, and a recipe to make it.',
      say: 'Add it is where it happens. Pick your first items, then buy them from a supplier or make them from a recipe.' },
    { k: 'gofound', label: 'Get found', kids: ['found', 'claim'], line: 'How people find you, and your page on Vegans Explore.',
      say: 'Get found is how people looking for plant-based food find you, and how you claim your page.' },
    { k: 'yours', label: 'Your list', kids: ['mylist', 'next'], line: 'Everything you saved, and what to do next.',
      say: 'Your list keeps everything you saved, and what you can do next.' }
  ];

  var S = 'stroke="#1f5f22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  var NI = function (d) { return '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' + S + ' aria-hidden="true">' + d + '</svg>'; };
  // One icon a kind of business.
  var ADD_ICON = {
    coffee: NI('<path d="M4 9h12v5a5 5 0 01-5 5H9a5 5 0 01-5-5z"/><path d="M16 10h2a2 2 0 010 4h-2"/><path d="M8 3v3M12 3v3"/>'),
    gym: NI('<path d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12"/>'),
    juice: NI('<path d="M7 8h10l-1.5 13h-7z"/><path d="M12 8l2-5"/><path d="M8 13h8"/>'),
    cafe: NI('<path d="M4 15c0-4 3.5-7 8-7s8 3 8 7z"/><path d="M3 15h18v2a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>'),
    caterer: NI('<path d="M3 17h18"/><path d="M5 17a7 7 0 0114 0"/><path d="M12 7V5"/><path d="M4 20h16"/>')
  };
  var ICON = {
    why: NI('<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16v.5"/>'),
    add: NI('<path d="M12 5v14M5 12h14"/>'),
    say: NI('<path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12h5"/>'),
    sourcing: NI('<path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>'),
    make: NI('<path d="M5 11h14v3a7 7 0 01-14 0z"/><path d="M9 7c0-1 1-2 1-3M13 7c0-1 1-2 1-3"/>'),
    found: NI('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
    claim: NI('<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>'),
    give: NI('<path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/>'),
    tasting: NI('<path d="M8 3v7a4 4 0 008 0V3"/><path d="M12 14v7M8 21h8"/>'),
    dash: NI('<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="10" width="8" height="11" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/>'),
    share: NI('<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>'),
    book: NI('<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/>'),
    follow: NI('<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>')
  };
  var LOCK_SVG = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';
  var BOOKMARK = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 3h12a1 1 0 011 1v17l-7-4.5L5 21V4a1 1 0 011-1z"/></svg>';

  var main = document.getElementById('dgMain');
  var menuEl = document.getElementById('dgMenu'), menuSel = document.getElementById('dgMenuSelect');
  var qEl = document.getElementById('dgQ');
  var PUB = JSON.parse(document.getElementById('pb-public').textContent);

  var access = 'checking';       // checking | guest | pending | member
  var MEM = null;                // members-only payload: { adds: [...] }
  var ST = { rule: 'points', cost: 1100, balance: 0, active: false, via: null };
  var curTab = 'overview';
  function groupOf(k) { if (/^g:/.test(k)) return k.slice(2); for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].kids.indexOf(k) >= 0) return GROUPS[i].k; return 'start'; }
  function group(g) { for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].k === g) return GROUPS[i]; return GROUPS[0]; }
  function gHref(g) { return g === 'start' ? '#/' : '#/g/' + g; }
  function kidsOf(g) { var avail = tabs().map(function (t) { return t.k; }); return group(g).kids.filter(function (k) { return avail.indexOf(k) >= 0; }); }
  // The tour: members go Start here, then each group page followed by its sections; visitors go tab by tab.
  function tourSteps() {
    if (!member()) return tabs().map(function (t) { return t.k; });
    var out = ['overview']; GROUPS.slice(1).forEach(function (g) { out.push('g:' + g.k); kidsOf(g.k).forEach(function (k) { out.push(k); }); }); return out;
  }
  function stepHref(st) { return /^g:/.test(st) ? gHref(st.slice(2)) : href(st); }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function auth() { return window.VEAuth || null; }
  function token() { var a = auth(); return a && a.isLoggedIn && a.isLoggedIn() ? a.getToken() : null; }
  function me() { var a = auth(); try { return a && a.getMember ? a.getMember() : null; } catch (e) { return null; } }
  function member() { return access === 'member'; }
  function sources(list) { return list && list.length ? '<span class="dg-src">' + list.map(function (s) { return '<a href="' + esc(s[1]) + '" target="_blank" rel="noopener">' + esc(s[0]) + '</a>'; }).join('') + '</span>' : ''; }
  function tabs() { return TABS.filter(function (t) { return !(t.guest && member()) && !(t.mine && !member()); }); }
  function tab(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i].k === k) return TABS[i]; return TABS[0]; }
  function href(k) { return '#/' + (k === 'overview' ? '' : k); }

  // ---------- tabs ----------
  function drawMenu(cur) {
    menuEl.classList.toggle('dg-dd-on', member()); menuSel.classList.toggle('dg-dd-on', member());
    if (!member()) {
      menuEl.innerHTML = tabs().map(function (t) {
        return '<a href="' + href(t.k) + '"' + (t.k === cur ? ' aria-current="page"' : '') + (t.guest ? ' class="dg-join-tab"' : '') + '>' + esc(t.label) + '</a>';
      }).join('');
      menuSel.innerHTML = tabs().map(function (t) { return '<option value="' + t.k + '"' + (t.k === cur ? ' selected' : '') + '>' + esc(t.label) + '</option>'; }).join('') +
        (cur === 'search' ? '<option value="search" selected>Search results</option>' : '');
      return;
    }
    // Members: one dropdown at every width, the 5 groups, each with its sections in small type (the Events Guide's drawMenu).
    var open = !!(menuEl.querySelector('.dg-dd-list') && !menuEl.querySelector('.dg-dd-list').hidden);
    var cg = cur === 'search' ? '' : groupOf(cur === 'overview' ? 'start' : cur), ci = 0;
    GROUPS.forEach(function (g, n) { if (g.k === cg) ci = n; });
    var curT = cur === 'search' ? { label: 'Search results' } : group(cg);
    var sec = cur !== 'search' && cur !== 'overview' && !/^g:/.test(cur) ? tab(cur) : null;
    menuEl.innerHTML = '<button type="button" class="dg-dd-btn" aria-haspopup="true" aria-expanded="false">' + esc(curT.label) +
      (sec ? ' <span class="dg-dd-sec">&rsaquo; ' + esc(sec.label) + '</span>' : '') +
      '<small>' + (cur === 'search' ? '' : (ci + 1) + ' of ' + GROUPS.length) + '</small></button>' +
      '<div class="dg-dd-list" hidden>' + GROUPS.map(function (g, n) {
        var kids = kidsOf(g.k).map(function (k) { return esc(tab(k).label); });
        return '<a href="' + gHref(g.k) + '"' + (g.k === cg ? ' aria-current="page"' : '') + '><span class="dg-dd-n">' + (n + 1) + '</span><span class="dg-dd-g"><b>' + esc(g.label) + '</b>' +
          (kids.length ? '<small>' + kids.join(' &middot; ') + '</small>' : '<small>Your story and five steps</small>') + '</span></a>';
      }).join('') + '</div>';
    if (open) setDD(true);
  }
  function setDD(on) {
    var l = menuEl.querySelector('.dg-dd-list'), btn = menuEl.querySelector('.dg-dd-btn'); if (!l || !btn) return;
    l.hidden = !on; btn.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  menuEl.addEventListener('click', function (e) {
    if (e.target.closest('.dg-dd-btn')) { var l = menuEl.querySelector('.dg-dd-list'); setDD(l && l.hidden); return; }
    if (e.target.closest('.dg-dd-list a')) setDD(false);
  });
  document.addEventListener('click', function (e) { if (!menuEl.contains(e.target)) setDD(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setDD(false); });
  menuSel.addEventListener('change', function () { location.hash = href(menuSel.value); });

  // ---------- pieces ----------
  function crumb(parts) {
    return '<div class="dg-crumb"><a href="#/">Pre-Vegan Business Guide</a>' + parts.map(function (p) { return ' &rsaquo; ' + (p[1] ? '<a href="' + p[1] + '">' + esc(p[0]) + '</a>' : esc(p[0])); }).join('') + '</div>';
  }
  function head(k, h, lede, right) {
    return '<div class="dg-head"><div><div class="dg-k">' + esc(k) + '</div><h2 class="dg-h1">' + h + '</h2></div>' + (right || '') + '</div>' + (lede ? '<p class="dg-lede">' + lede + '</p>' : '');
  }
  function skel(title, lines) { var h = '<div class="dg-skel">' + (title ? '<h3>' + esc(title) + '</h3>' : '<i></i>'); for (var i = 0; i < (lines || 3); i++) h += '<i style="width:' + (92 - i * 9) + '%"></i>'; return h + '</div>'; }
  function gated(inner, title, text) {
    return '<div class="dg-gated"><div class="dg-blur" aria-hidden="true">' + inner + '</div><div class="dg-gate"><span class="dg-lockic">' + LOCK_SVG.replace(/width="11" height="11"/, 'width="16" height="16"').replace('currentColor', '#1f5f22') + '</span>' +
      '<b>' + esc(title) + '</b><p>' + esc(text) + ' Take the short survey about your business and the whole Guide opens. Free, no card.</p>' + ctaBtns() + '</div></div>';
  }
  // One tile for everything that is not a Directory listing: the picture on the left, the words, the actions top right.
  function row(o) {
    return '<div class="dg-srow"' + (o.href ? ' data-href="' + o.href + '"' : '') + '>' + (o.icon ? '<span class="dg-th rg-th" aria-hidden="true">' + o.icon + '</span>' : '') +
      '<div class="dg-srow-b">' + (o.pre || '') + '<h3>' + (o.href ? '<a href="' + o.href + '">' + esc(o.title) + '</a>' : esc(o.title)) + '</h3>' + (o.body || '') + '</div>' +
      (o.acts ? '<div class="dg-acts">' + o.acts + '</div>' : '') + '</div>';
  }
  function numRow(n, t, d) { return '<div class="dg-srow"><span class="dg-th rg-th" aria-hidden="true" style="font-weight:900;font-size:20px;color:#1f5f22">' + n + '</span><div class="dg-srow-b"><h3>' + esc(t) + '</h3><p>' + esc(d) + '</p></div></div>'; }

  // ---------- the door: the survey, free (canon-ve-door-guides) ----------
  function surveyGo() { try { sessionStorage.setItem('ve_survey_for', SLUG); } catch (e) {} location.href = '/survey?s=' + SLUG; }
  function ctaBtns() {
    return '<div class="dg-btns"><button type="button" class="dg-btn" data-survey>Take the survey, free</button>' +
      (access === 'guest' || access === 'checking' ? '<a href="#" data-signin>Already a member? Sign in</a>' : '') + '</div>';
  }
  function take(d) {
    if (!d || d.error) return;
    if (d.access_rule) ST.rule = d.access_rule;
    if (d.cost) ST.cost = d.cost;
    ST.balance = d.balance || 0; ST.active = d.membership_status === 'active'; ST.via = d.via || null;
  }
  function drawJoinbox() {
    var box = document.querySelector('.dg-joinbox'); if (!box || member()) return;
    var signin = box.querySelector('.dg-jb-in');
    signin.style.display = access === 'guest' || access === 'checking' ? '' : 'none';
  }

  // ---------- saves (ve-cookbook, the Guide's own list) ----------
  function cookApi(body) {
    var tok = token(), h = { 'Content-Type': 'application/json' };
    if (tok) h.Authorization = 'Bearer ' + tok;
    body.guide = SLUG;
    return fetch(COOK_URL, { method: 'POST', headers: h, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  // A saved kind of business is kind 'fix', key 'add-<id>' (ve-cookbook's SAVE_KINDS).
  var SV = { fix: {} }, SV_ORDER = [], svState = '', svWait = [];
  function loadSaves(then) {
    if (then) svWait.push(then);
    if (svState === 'loading') return;
    if (!member() || svState === 'loaded') { var w0 = svWait; svWait = []; w0.forEach(function (f) { f(); }); return; }
    svState = 'loading';
    var finish = function () { paintSaves(); var w = svWait; svWait = []; w.forEach(function (f) { f(); }); };
    cookApi({ action: 'saves' }).then(function (d) {
      if (d && d.saves) { SV_ORDER = d.saves; d.saves.forEach(function (x) { if (SV[x.kind]) SV[x.kind][x.key] = 1; }); svState = 'loaded'; } else svState = '';
      finish();
    }).catch(function () { svState = ''; finish(); });
  }
  function saveBtn(kind, key) {
    var on = !!SV[kind][key];
    return '<button type="button" class="dg-save' + (on ? ' on' : '') + '" data-save="' + kind + ':' + esc(key) + '" aria-pressed="' + on + '" title="' + (on ? 'Saved to My list' : 'Save to My list') + '">' + BOOKMARK + '<span>' + (on ? 'Saved' : 'Save') + '</span></button>';
  }
  function paintSaves() {
    [].forEach.call(document.querySelectorAll('[data-save]'), function (b) {
      var kk = b.getAttribute('data-save'), i = kk.indexOf(':'), on = !!(SV[kk.slice(0, i)] || {})[kk.slice(i + 1)];
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.title = on ? 'Saved to My list' : 'Save to My list';
      b.querySelector('span').textContent = on ? 'Saved' : 'Save';
    });
  }

  // ---------- Why add plant-based ----------
  function viewWhy() {
    main.innerHTML = head('Why add plant-based', 'The honest version', 'Who asks for it, what a short plant-based list costs you, and what it will not do. A number here always has its source under it.') +
      '<div class="dg-srows">' + PUB.why.map(function (w) { return row({ icon: ICON.why, title: w.title, body: '<p class="dg-srow-p" style="-webkit-line-clamp:unset;display:block">' + esc(w.text) + '</p>' + sources(w.sources) }); }).join('') + '</div>' +
      '<h3 class="dg-k" style="margin:22px 0 8px">What it will not do</h3>' +
      '<div class="dg-srows">' + PUB.wont.map(function (x) { return row({ icon: ICON.why, title: x[0], body: '<p class="dg-srow-p">' + esc(x[1]) + '</p>' }); }).join('') + '</div>' +
      '<div class="dg-start" style="margin-top:16px"><a class="dg-btn" href="#/add">See what to add</a></div>';
  }

  // ---------- What to add, by kind of business ----------
  function allAdds() {
    var byId = {}; (MEM ? MEM.adds : []).forEach(function (a) { byId[a.id] = a; }); byId[PUB.add_example.id] = PUB.add_example;
    return PUB.types.map(function (t) { return byId[t[0]] || { id: t[0], title: t[1], short: t[2], locked: 1 }; });
  }
  function viewAdd(id) {
    if (id) return viewAddOne(id);
    var list = allAdds();
    main.innerHTML = head('What to add', 'Pick your kind of business',
      'Each one has a few easy first items, what to stock, and what to watch for.' + (member() ? '' : ' The coffee shop is open for you to try.')) +
      '<div class="dg-srows">' + list.map(function (a) {
        var open = !a.locked;
        return row({ icon: ADD_ICON[a.id] || ICON.add, title: a.title, href: open ? '#/add/' + a.id : '',
          pre: (!member() && a.id === PUB.add_example.id ? '<span class="dg-free">Free to try</span>' : ''),
          body: '<p class="dg-srow-p">' + (open ? esc(a.short) : LOCK_SVG + ' ' + esc(a.short) + ' Opens with the survey.') + '</p>',
          acts: member() && open ? saveBtn('fix', 'add-' + a.id) : '' });
      }).join('') + '</div>' +
      '<p class="dg-empty" style="margin-top:14px">A restaurant? The <a href="/guides/vegan-restaurant-guide">Vegan Restaurant Guide</a> is built for you. Something else? The ideas for cafes and caterers carry over to most kitchens.</p>' +
      (member() ? '' : '<div style="margin-top:16px">' + gated(skel('Every kind of business', 4), 'Gyms, juice bars, cafes and caterers', 'Each with first items, what to stock and what to watch for.') + '</div>');
  }
  function viewAddOne(id) {
    var list = allAdds(), i = -1;
    list.forEach(function (a, n) { if (a.id === id) i = n; });
    var a = list[i];
    if (!a || a.locked) {
      main.innerHTML = crumb([['What to add', '#/add'], [a ? a.title : 'Kind of business']]) + gated(skel(a ? a.title : '', 6), a ? a.title : 'This kind of business', 'It opens with the survey, with every other kind of business.');
      return;
    }
    var nextOpen = null; for (var n = i + 1; n < list.length; n++) if (!list[n].locked) { nextOpen = list[n]; break; }
    var ul = function (xs) { return '<ul>' + (xs || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; };
    main.innerHTML = crumb([['What to add', '#/add'], [a.title]]) +
      '<div class="rg-fix">' +
      '<div class="dg-head"><div><div class="dg-k">What to add</div><h2 class="dg-h1">' + esc(a.title) + '</h2></div>' + (member() ? '<div class="dg-acts" style="flex-direction:row">' + saveBtn('fix', 'add-' + a.id) + '</div>' : '') + '</div>' +
      '<p class="rg-problem">' + esc(a.short) + '</p>' +
      '<h3>Easy first items</h3>' + ul(a.firsts) +
      '<h3>What to stock</h3>' + ul(a.stock) +
      '<h3>What to watch for</h3>' + ul(a.watch) +
      '<h3>Start here</h3><div class="rg-week"><b>This week</b>' + esc(a.start) + '</div>' +
      (member() ? '<div class="rg-week" style="margin-top:12px"><b>Rather buy it ready-made?</b>See who sells it in <a href="#/sourcing">Sourcing</a>, or a recipe to make it in <a href="#/make">Buy or make</a>.</div>' : '') +
      '<div class="rg-fixnav"><span></span>' +
      (nextOpen ? '<a class="dg-tnav next" href="#/add/' + nextOpen.id + '">Next kind of business &rsaquo;</a>' : '<a class="dg-tnav next" href="#/say">How to say it &rsaquo;</a>') + '</div></div>' +
      (!member() ? '<div style="margin-top:22px">' + gated(skel('The other kinds', 3), 'Gyms, juice bars, cafes and caterers', 'Each with first items, what to stock and what to watch for.') + '</div>' : '');
  }

  // ---------- How to say it ----------
  function viewSay() {
    main.innerHTML = head('How to say it', 'The words on your menu', 'Say exactly what is true. People who eat Vegan read menus closely, and the right words earn their trust.') +
      '<div class="dg-srows">' + PUB.say.map(function (x) { return row({ icon: ICON.say, title: x[0], body: '<p class="dg-srow-p" style="-webkit-line-clamp:unset;display:block">' + esc(x[1]) + '</p>' }); }).join('') + '</div>' +
      '<h3 class="dg-k" style="margin:22px 0 8px">Lines you can use</h3>' +
      '<div class="dg-srows">' + PUB.lines.map(function (x) { return row({ icon: ICON.say, title: x[0], body: '<p class="dg-srow-p" style="-webkit-line-clamp:unset;display:block">&ldquo;' + esc(x[1]) + '&rdquo;</p>', acts: '<button type="button" class="dg-btn dg-ghost" data-copy="' + esc(x[1]) + '">Copy</button>' }); }).join('') + '</div>' +
      '<p class="dg-status" role="status" aria-live="polite"></p>';
  }

  // ---------- Sourcing and Buy or make (copied from the Restaurant Guide; ve-sourcing lists this Guide in GUIDES) ----------
  var SRC_FN = SB + '/functions/v1/ve-sourcing';
  var SRC_DOMAINS = [
    { k: 'food_drink', t: 'Ready-made food and drink', d: 'Vegan cheese, plant milks, desserts and proteins, made by someone else and ready to serve or sell.' },
    { k: 'ingredients', t: 'Ingredients', d: 'The base ingredients to make it yourself, at the size a kitchen needs.' },
    { k: 'packaging', t: 'Packaging and bottling', d: 'Cups, containers, labels and bottlers, so your food can leave the building.' },
    { k: 'co_packing', t: 'Co-packers and contract makers', d: 'Someone else makes your recipe at scale.' },
    { k: 'machinery', t: 'Machinery for scale', d: 'The equipment that takes a kitchen batch to a production run.' },
    { k: 'materials', t: 'Materials for fashion and beauty makers', d: 'Plant-based leathers, fibers and trims for the people who make clothing and accessories.' },
    { k: 'distribution', t: 'Distributors', d: 'Who gets your product onto shelves.' },
    { k: 'certification', t: 'Certification and testing', d: 'Who checks and certifies that it is vegan.' }
  ];
  var SRC_LABEL = { peta_approved: ['PETA-Approved Vegan', 'peta'], fully_vegan: ['Fully vegan company', 'full'], offers_options: ['Offers vegan options', 'opts'], plant_material: ['Plant-based material', 'mat'] };
  var SRC_ICON = ICON.sourcing;
  var SRC = { counts: null, shown: 0 };
  function inSrc() { return curTab === 'sourcing' || curTab === 'make'; }
  function srcFetch(body) {
    return fetch(SRC_FN, { method: 'POST', headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ guide: SLUG }, body)) })
      .then(function (r) { return r.json(); });
  }
  function srcParams(sub) {
    var bits = String(sub || '').split('?'), q = {};
    (bits[1] || '').split('&').forEach(function (kv) { var p = kv.split('='); if (p[0]) q[p[0]] = decodeURIComponent((p[1] || '').replace(/\+/g, ' ')); });
    return { domain: bits[0] || '', q: q };
  }
  function srcHash(domain, q) {
    var bits = ['kind', 'label', 'q'].filter(function (k) { return q[k]; }).map(function (k) { return k + '=' + encodeURIComponent(q[k]); });
    return '#/sourcing/' + domain + (bits.length ? '?' + bits.join('&') : '');
  }
  // A material named for the animal product reads as that product, so it shows as "<x> alternatives" (display only).
  var SRC_ALT = { leather: 1, suede: 1, down: 1, wool: 1, fur: 1, cashmere: 1, silk: 1, feathers: 1 };
  function kindName(k) {
    var t = String(k || ''); t = t.charAt(0).toUpperCase() + t.slice(1);
    if (String(k).toLowerCase() === 'feathers') t = 'Feather';
    return SRC_ALT[String(k).toLowerCase()] ? t + ' alternatives' : t;
  }
  var SRC_MEAN = {
    peta_approved: 'PETA has approved this company\'s products as Vegan under its own mark.',
    fully_vegan: 'Everything this company sells is Vegan, by what the company says of itself.',
    offers_options: 'A real supplier with Vegan lines. Not everything it sells is Vegan, so check each product with them.',
    plant_material: 'Made from plant fiber. That is a material, not a claim that it is Vegan, so check with the supplier.'
  };
  function srcRow(s) {
    var L = SRC_LABEL[s.label] || SRC_LABEL.offers_options;
    var kinds = (s.kinds || []).map(kindName).join(', ');
    return row({ icon: SRC_ICON, title: s.name, href: '#/sourcing/s/' + encodeURIComponent(s.slug), pre: '<span class="rg-lab ' + L[1] + '">' + esc(L[0]) + '</span>',
      body: '<p class="dg-srow-p">' + esc(s.bio || (kinds ? 'Makes: ' + kinds + '.' : '')) + '</p>',
      acts: s.website ? '<a class="dg-btn dg-ghost" href="' + esc(s.website) + '" target="_blank" rel="noopener nofollow">Visit website</a>' : '' });
  }
  function viewSourcing(sub) {
    if (/^s\//.test(String(sub || ''))) return viewSupplier(decodeURIComponent(String(sub).split('?')[0].split('/')[1] || ''));
    var P = srcParams(sub), cur = SRC_DOMAINS.filter(function (d) { return d.k === P.domain; })[0];
    var note = '<p class="dg-lede rg-srcnote">Every supplier wears one label. <b>PETA-Approved Vegan</b> is PETA\'s own mark. <b>Plant-based material</b> means the product is made from plant fiber; that is a material, not a claim that it is Vegan, so check it with them. <b>Offers vegan options</b> is a real supplier with vegan lines: check each product with them. The PETA-Approved Vegan mark and the materials list come from PETA\'s <i>Guide to Vegan Suppliers and Manufacturers</i>, October 2026.</p>';
    var matNote = '<p class="rg-srcmat" id="rgSrcMat" hidden><b>Plant-based material</b> means made from plant fiber. It is a material, not a claim that it is Vegan, so check with the supplier.</p>';
    if (!cur) {
      main.innerHTML = head('Sourcing', 'Buy it from someone who already makes it', 'Not everything has to come out of your kitchen. Pick what you are looking for.') +
        '<div class="dg-srows" id="rgSrcDomains">' + SRC_DOMAINS.map(function (d) { return row({ icon: SRC_ICON, title: d.t, pre: '<span class="rg-promo-tag rg-soon" data-src-tag="' + d.k + '">Checking</span>', body: '<p class="dg-srow-p">' + esc(d.d) + '</p>' }); }).join('') + '</div>' +
        '<div class="dg-srows" style="margin-top:16px">' + row({ icon: ICON.make, title: 'Buy or make', href: '#/make', pre: '<span class="rg-promo-tag rg-live">Dairy basics</span>', body: '<p class="dg-srow-p">Cheese, cream, butter, milk and more: who sells it ready-made, and the recipe to make it yourself.</p>' }) + '</div>' + note;
      srcFetch({ action: 'list', limit: 1 }).then(function (r) {
        if (curTab !== 'sourcing') return;
        var c = (r && r.counts && r.counts.domain) || {}; SRC.counts = c;
        SRC_DOMAINS.forEach(function (d, i) {
          var el = main.querySelectorAll('.dg-srow')[i]; if (!el) return;
          var tag = el.querySelector('[data-src-tag]'), n = c[d.k] || 0;
          if (tag) { tag.className = 'rg-promo-tag ' + (n ? 'rg-live' : 'rg-soon'); tag.textContent = n ? n + ' suppliers' : 'Coming'; }
          if (n) el.setAttribute('data-href', '#/sourcing/' + d.k);
        });
      }).catch(function () { var t = main.querySelectorAll('[data-src-tag]'); for (var i = 0; i < t.length; i++) t[i].textContent = 'Coming'; });
      return;
    }
    var q = { kind: P.q.kind || '', label: P.q.label || '', q: P.q.q || '' };
    main.innerHTML = crumb([['Sourcing', '#/sourcing'], [cur.t]]) + head('Sourcing', esc(cur.t), esc(cur.d)) +
      '<div class="rg-srcbar"><input type="search" id="rgSrcQ" placeholder="Search suppliers" value="' + esc(q.q) + '" aria-label="Search suppliers">' +
      '<select id="rgSrcLabel" aria-label="Label"><option value="">All labels</option>' + Object.keys(SRC_LABEL).map(function (k) { return '<option value="' + k + '"' + (q.label === k ? ' selected' : '') + '>' + SRC_LABEL[k][0] + '</option>'; }).join('') + '</select>' +
      '<select id="rgSrcKind" aria-label="Kind"><option value="">All kinds</option></select></div>' +
      matNote + '<div class="dg-srows" id="rgSrcList">' + skel('', 3) + '</div><div class="dg-btns" id="rgSrcMore"></div>' + note;
    var listEl = document.getElementById('rgSrcList'), moreEl = document.getElementById('rgSrcMore'), kindEl = document.getElementById('rgSrcKind'), timer = null, seq = 0, got = [];
    function paint(total) {
      listEl.innerHTML = got.length ? got.map(srcRow).join('') : '<p class="dg-lede">Nothing matches. Try fewer filters.</p>';
      var mn = document.getElementById('rgSrcMat'); if (mn) mn.hidden = !got.some(function (x) { return x.label === 'plant_material'; });
      moreEl.innerHTML = got.length < total ? '<button class="dg-btn dg-ghost" id="rgSrcMoreBtn">Show more (' + (total - got.length) + ' left)</button>' : '';
      var b = document.getElementById('rgSrcMoreBtn'); if (b) b.onclick = function () { load(true); };
    }
    function load(more) {
      var my = ++seq; if (!more) got = [];
      srcFetch({ action: 'list', domain: cur.k, kind: q.kind, label: q.label, q: q.q, limit: 48, offset: got.length }).then(function (r) {
        if (my !== seq || curTab !== 'sourcing') return;
        if (!r || !r.ok) { listEl.innerHTML = '<p class="dg-lede">' + (r && r.error === 'guide_required' ? 'The Sourcing tab is for members.' : 'We could not load the suppliers. Try again in a moment.') + '</p>'; return; }
        got = got.concat(r.suppliers || []);
        if (kindEl.options.length <= 1) kindEl.innerHTML = '<option value="">All kinds</option>' + (r.kinds || []).map(function (k) { return '<option value="' + esc(k) + '"' + (q.kind === k ? ' selected' : '') + '>' + esc(kindName(k)) + '</option>'; }).join('');
        paint(r.total);
      }).catch(function () { listEl.innerHTML = '<p class="dg-lede">We could not load the suppliers. Try again in a moment.</p>'; });
    }
    SRC.back = { hash: srcHash(cur.k, q), t: cur.t };
    function changed() { SRC.back = { hash: srcHash(cur.k, q), t: cur.t }; history.replaceState(null, '', SRC.back.hash); load(false); }
    document.getElementById('rgSrcQ').addEventListener('input', function (e) { q.q = e.target.value; clearTimeout(timer); timer = setTimeout(changed, 250); });
    document.getElementById('rgSrcLabel').addEventListener('change', function (e) { q.label = e.target.value; changed(); });
    kindEl.addEventListener('change', function (e) { q.kind = e.target.value; changed(); });
    load(false);
  }
  // One supplier on its own (#/sourcing/s/<slug>): the whole bio, the label and what it means, what they make, their website.
  function viewSupplier(slug) {
    var back = SRC.back, trail = back && back.make ? [['Buy or make', '#/make']] : [['Sourcing', '#/sourcing']];
    if (back) trail.push([back.t, back.hash]);
    main.innerHTML = crumb(trail.concat([['...']])) + '<div id="rgSup">' + skel('', 3) + '</div>';
    srcFetch({ action: 'get', slug: slug }).then(function (r) {
      if (!inSrc()) return;
      var box = document.getElementById('rgSup'); if (!box) return;
      if (!r || !r.ok) { box.innerHTML = '<p class="dg-lede">' + (r && r.error === 'not_found' ? 'We could not find that supplier.' : 'We could not load this. Try again in a moment.') + ' <a href="' + (back ? back.hash : '#/sourcing') + '">Back</a></p>'; return; }
      var s = r.supplier, L = SRC_LABEL[s.label] || SRC_LABEL.offers_options;
      var dom = SRC_DOMAINS.filter(function (d) { return d.k === s.domain; })[0];
      if (!back && dom) trail.push([dom.t, '#/sourcing/' + dom.k]);
      var c = main.querySelector('.dg-crumb'); if (c) c.outerHTML = crumb(trail.concat([[s.name]]));
      box.innerHTML = head(dom ? dom.t : 'Sourcing', esc(s.name), '') +
        '<div class="rg-sup"><span class="rg-lab ' + L[1] + '">' + esc(L[0]) + '</span><p class="rg-sup-mean">' + esc(SRC_MEAN[s.label] || '') + '</p>' +
        (s.bio ? '<p class="rg-sup-bio">' + esc(s.bio) + '</p>' : '<p class="rg-sup-bio">We have not written about this supplier yet. Their website says what they make.</p>') +
        ((s.kinds || []).length ? '<h4>What they make</h4><div class="rg-sup-kinds">' + s.kinds.map(function (k) { return '<span>' + esc(kindName(k)) + '</span>'; }).join('') + '</div>' : '') +
        '<div class="dg-btns" style="margin-top:18px">' + (s.website ? '<a class="dg-btn" href="' + esc(s.website) + '" target="_blank" rel="noopener nofollow">Visit their website</a>' : '') +
        '<a class="dg-btn dg-ghost" href="' + (back ? back.hash : (dom ? '#/sourcing/' + dom.k : '#/sourcing')) + '">Back to the list</a></div>' +
        '<p class="rg-sup-note">Ask the supplier about each product before it goes on your menu. Featuring a supplier here never buys its place in the list.</p></div>';
    }).catch(function () { var box = document.getElementById('rgSup'); if (box) box.innerHTML = '<p class="dg-lede">We could not load this. Try again in a moment.</p>'; });
  }
  // Buy or make: #/make lists the items, #/make/<key> opens one. The pairs live in ve-sourcing (MAKE).
  function viewMake(key) {
    var homeTag = '<span class="rg-promo-tag rg-soon">Home scale</span>';
    if (!key) {
      main.innerHTML = head('Buy or make', 'Buy or make', 'For each item, buy it from someone who already makes it, or make it yourself. The recipes are written for a home kitchen; scale them up and cost them before they go on a menu.') +
        '<div class="dg-srows" id="rgMakeList">' + skel('', 4) + '</div>';
      srcFetch({ action: 'make' }).then(function (r) {
        if (curTab !== 'make') return;
        var el = document.getElementById('rgMakeList'); if (!el) return;
        if (!r || !r.ok) { el.innerHTML = '<p class="dg-lede">We could not load this. Try again in a moment.</p>'; return; }
        el.innerHTML = (r.items || []).map(function (it) {
          var pic = it.recipe && it.recipe.photo_url ? '<img src="' + esc(it.recipe.photo_url) + '" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">' : ICON.make;
          return row({ icon: pic, title: it.t, href: '#/make/' + encodeURIComponent(it.key), pre: '<span class="rg-promo-tag ' + (it.buy ? 'rg-live">' + it.buy + (it.buy === 1 ? ' supplier' : ' suppliers') : 'rg-soon">Make it') + '</span>',
            body: '<p class="dg-srow-p">' + (it.buy ? 'Buy it ready-made, or make it: ' : 'No supplier for this yet. Make it: ') + esc(it.recipe.title) + '.</p>' });
        }).join('');
      }).catch(function () { var el = document.getElementById('rgMakeList'); if (el) el.innerHTML = '<p class="dg-lede">We could not load this. Try again in a moment.</p>'; });
      return;
    }
    main.innerHTML = crumb([['Buy or make', '#/make'], ['...']]) + '<div id="rgMake">' + skel('', 3) + '</div>';
    srcFetch({ action: 'make_get', key: key }).then(function (r) {
      if (curTab !== 'make') return;
      var box = document.getElementById('rgMake'); if (!box) return;
      if (!r || !r.ok) { box.innerHTML = '<p class="dg-lede">' + (r && r.error === 'not_found' ? 'We could not find that item.' : 'We could not load this. Try again in a moment.') + ' <a href="#/make">Back to Buy or make</a></p>'; return; }
      var c = main.querySelector('.dg-crumb'); if (c) c.outerHTML = crumb([['Buy or make', '#/make'], [r.item.t]]);
      SRC.back = { hash: '#/make/' + encodeURIComponent(r.item.key), t: r.item.t, make: 1 };
      var R = r.recipe, sup = r.suppliers || [];
      var buy = '<h3 class="rg-bom-h">Buy it</h3>' + (sup.length ? '<div class="dg-srows">' + sup.map(srcRow).join('') + '</div>' :
        '<p class="dg-lede">No supplier in our directory sells this ready-made yet. We add suppliers every week.</p>');
      var make = '<h3 class="rg-bom-h">Make it ' + homeTag + '</h3>' + (R ? '<div class="rg-bom-rec">' +
        (R.photo_url ? '<figure><img src="' + esc(R.photo_url) + '" alt="' + esc(R.title) + '" loading="lazy">' + (R.photo_illustrative ? '<figcaption>Illustrative photo</figcaption>' : '') + '</figure>' : '') +
        '<b class="rg-bom-t">' + esc(R.title) + '</b>' + (R.time_text ? '<span class="rg-bom-m">' + esc(R.time_text) + '</span>' : '') +
        '<h4>What you need</h4><ul>' + (R.ingredients || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
        '<h4>How to make it</h4><ol>' + (R.instructions || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
        (R.tip ? '<p class="rg-bom-tip"><b>Tip</b> ' + esc(R.tip) + '</p>' : '') +
        '<p class="rg-bom-note">A home-kitchen recipe from Maya\'s Cookbook in the Vegan Dairy Guide. Scale it up and work out the cost per portion before it goes on your menu.</p></div>' :
        '<p class="dg-lede">The recipe is not available right now.</p>');
      box.innerHTML = head('Buy or make', esc(r.item.t), 'Buy it from someone who already makes it, or make it in your own kitchen.') + '<div class="rg-bom">' + '<div>' + buy + '</div><div>' + make + '</div></div>';
    }).catch(function () { var box = document.getElementById('rgMake'); if (box) box.innerHTML = '<p class="dg-lede">We could not load this. Try again in a moment.</p>'; });
  }

  // ---------- Get found ----------
  function viewFound() {
    var steps = [
      ['Listed in the Directory', 'Members find places by city, search and kind. A place that is not Vegan but has plant-based items is listed too, marked so people know what to expect.', '/directory', 'See the Directory'],
      ['Vetted by members', 'A place with plant-based options shows to everyone once 10 different members vote for it, its business claims it, or our team checks it. Until then members see it under Being vetted.', '/directory', 'How the Directory works'],
      ['Votes move you up', 'Members vote for the places they love, and the most voted rise to the top of their city. Votes are the only thing that moves a place up.', '/directory', 'See the most voted'],
      ['Nobody can pay to move up', 'Being featured, an ad or a plan never buys a better place in the list. That is why members trust it.', '', '']
    ];
    main.innerHTML = head('Get found', 'How people find you on Vegans Explore', 'An honest list is the point. Here is how a place gets in front of the people looking for plant-based food.') +
      '<div class="rg-steps">' + steps.map(function (st, i) { return '<div class="rg-step"><em>' + (i + 1) + '</em><b>' + esc(st[0]) + '</b><p>' + esc(st[1]) + '</p>' + (st[2] ? '<a href="' + st[2] + '">' + esc(st[3]) + ' &rsaquo;</a>' : '') + '</div>'; }).join('') + '</div>' +
      '<div class="dg-start" style="margin-top:16px"><a class="dg-btn" href="#/claim">Claim your page</a></div>';
  }

  // ---------- Claim your page ----------
  function viewClaim() {
    var steps = [
      ['Find your page', 'Search for your business below. Many are already in the Directory.'],
      ['Claim it', 'Claiming is a short form. The $11, 1,100 points or the Partner plan covers it, and we show you which when you start. Our team reviews every claim to make sure it is accurate.'],
      ['Keep it current', 'Your hours, photos and menu link, changed whenever you like.']
    ];
    main.innerHTML = head('Claim your page', 'Make your page yours', 'If your business is in our Directory, claim it. If it is not, add it.') +
      '<div class="rg-steps">' + steps.map(function (st, i) { return '<div class="rg-step"><em>' + (i + 1) + '</em><b>' + esc(st[0]) + '</b><p>' + esc(st[1]) + '</p></div>'; }).join('') + '</div>' +
      '<h3 class="dg-k" style="margin:18px 0 8px">Find your business</h3><div class="rg-find"><input type="search" id="pbPage" placeholder="Your business\'s name" aria-label="Find your business\'s page" autocomplete="off"></div><div class="rg-hits" id="pbPageHits"></div>' +
      '<p class="dg-empty" style="margin-top:14px">Not listed? <a href="/claim?add=1">Add your business</a>.</p>';
    var input = document.getElementById('pbPage'), hits = document.getElementById('pbPageHits'), t;
    input.addEventListener('input', function () {
      clearTimeout(t); var q = input.value.trim().replace(/[*,()]/g, ' ').trim();
      if (q.length < 2) { hits.innerHTML = ''; return; }
      t = setTimeout(function () {
        rest(SB + '/rest/v1/listings?select=slug,name,address_city,address_state&status=eq.approved&name=ilike.*' + encodeURIComponent(q) + '*&order=vote_count.desc.nullslast&limit=8').then(function (ls) {
          ls = Array.isArray(ls) ? ls : [];
          hits.innerHTML = ls.length ? ls.map(function (l) {
            return '<a class="rg-hit" href="/claim?listing=' + encodeURIComponent(l.slug) + '">' + esc(l.name) + '<span>' + esc([l.address_city, l.address_state].filter(Boolean).join(', ')) + ' &middot; Claim this page</span></a>';
          }).join('') : '<p class="dg-empty">Not in the Directory yet. <a href="/claim?add=1">Add your business</a>.</p>';
        }).catch(function () { hits.innerHTML = '<p class="dg-empty">We could not search just now. Try again in a moment.</p>'; });
      }, 220);
    });
  }

  // ---------- What's next ----------
  var SOCIALS = [
    ['Instagram', 'https://www.instagram.com/vegansexplore/', '@vegansexplore'],
    ['TikTok', 'https://www.tiktok.com/@vegansexplore', '@vegansexplore'],
    ['YouTube', 'https://www.youtube.com/@VegansExplore', '@VegansExplore'],
    ['Facebook', 'https://www.facebook.com/vegansexplore', 'facebook.com/vegansexplore']
  ];
  function shareLink() { var m = me(); return location.origin + (m && m.referral_code ? '/r/' + m.referral_code : '/passport'); }
  function copyText(t) {
    return (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(t) : Promise.reject()).catch(function () {
      var ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {} ta.remove();
    });
  }
  function viewNext(sub) {
    if (sub === 'follow') return viewFollow();
    var go = function (label, h) { return '<a class="dg-btn dg-ghost" href="' + h + '">' + esc(label) + '</a>'; };
    var tag = '<span class="rg-promo-tag rg-soon">Coming</span>';
    var tiles = [
      { icon: ICON.claim, title: 'Claim your page', body: 'Your page may already be in the Directory. Claiming makes it yours to run.', acts: go('Claim it', '#/claim') },
      { icon: ICON.add, title: 'What to add', body: 'First items, what to stock and what to watch for, for your kind of business.', acts: go('Open it', '#/add') },
      { icon: ICON.tasting, pre: tag, title: 'Tasting nights', body: 'Invited members taste your dishes and send honest feedback, anonymous to you. Coming: we will tell you when the first one runs.', acts: '<button type="button" class="dg-btn dg-ghost" data-notify="tasting-nights">Tell me when it opens</button>' },
      { icon: ICON.dash, title: 'Open your dashboard', body: 'Your points, your level, the Directory, the Daily Pulse and everything you can do as a member.', acts: go('Open it', '/dashboard') },
      { icon: ICON.give, title: 'Make a contribution', body: 'From $11. Our thanks, and it helps us grow faster. A contribution to the community, never a donation.', acts: go('Contribute', '/dashboard?contribute=1') },
      { icon: ICON.share, title: 'Share your link', body: 'Your own link. When someone joins with it, you get the credit.', acts: '<button type="button" class="dg-btn dg-ghost" data-copylink>Copy my link</button>' },
      { icon: ICON.book, title: 'Read the Welcome Guide', body: 'How to use Vegans Explore, from search to the Daily Pulse, in a few minutes.', acts: go('Read it', '/passport') },
      { icon: ICON.follow, title: 'Follow us', body: 'Follow us everywhere, so you see what we share.', acts: go('Follow us', '#/next/follow') }
    ];
    main.innerHTML = head('What\'s next', 'You are in. Thank you.', 'Here is what you can do next. Pick any of it, in any order. Nothing here is required.') +
      '<div class="dg-srows">' + tiles.map(function (t) { t.body = '<p style="margin:4px 0 0;font-size:14px;line-height:1.5;color:var(--ink75)">' + esc(t.body) + '</p>'; return row(t); }).join('') + '</div><p class="dg-status" role="status" aria-live="polite"></p>';
  }
  function viewFollow() {
    main.innerHTML = crumb([['What\'s next', '#/next'], ['Follow us']]) + head('Follow us', 'Follow us everywhere', 'These are our own accounts.') +
      '<div class="dg-srows">' + SOCIALS.map(function (x) { return row({ icon: ICON.follow, title: x[0], body: '<p class="dg-srow-p">' + esc(x[2]) + '</p>', acts: '<a class="dg-btn dg-ghost" href="' + x[1] + '" target="_blank" rel="noopener">Follow</a>' }); }).join('') + '</div>';
  }
  function notifyMe(key, btn) {
    var m = me(); if (!m || !m.email) { setStatus('Sign in to be told when it opens.'); return; }
    btn.disabled = true; btn.textContent = 'Sending...';
    fetch(SB + '/rest/v1/member_interest', { method: 'POST', headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ email: m.email, role_slug: SLUG + '-' + key, source: SLUG + '-whats-next' }) })
      .then(function (r) { if (!r.ok) throw 0; btn.textContent = 'We will tell you'; setStatus('Done. We will email you the day it opens.'); })
      .catch(function () { btn.disabled = false; btn.textContent = 'Try again'; });
  }

  // ---------- My list ----------
  function viewMyList() {
    main.innerHTML = head('My list', 'My list', 'Everything you save in the Guide, in one place. Tap Save on any kind of business in What to add.') + '<div id="dgML"><div class="dg-loading">Loading your list...</div></div>';
    loadSaves(function () {
      var el = document.getElementById('dgML'); if (!el) return;
      var all = allAdds(), items = SV_ORDER.filter(function (x) { return x.kind === 'fix' && /^add-/.test(x.key); })
        .map(function (x) { return all.filter(function (a) { return 'add-' + a.id === x.key && !a.locked; })[0]; }).filter(Boolean);
      el.innerHTML = items.length ? '<div class="dg-srows">' + items.map(function (a) { return row({ icon: ADD_ICON[a.id] || ICON.add, title: a.title, href: '#/add/' + a.id, body: '<p class="dg-srow-p">' + esc(a.short) + '</p>', acts: saveBtn('fix', 'add-' + a.id) }); }).join('') + '</div>'
        : '<p class="dg-empty">Nothing saved yet. Tap Save on any kind of business in <a href="#/add">What to add</a> and it shows up here.</p>';
    });
  }

  // ---------- Get in ----------
  function viewJoin() {
    main.innerHTML = head('Get in', 'Adding plant-based options?', 'Tell us about your business in a short survey and the whole Guide opens. Free, no card.') +
      '<div class="dg-access"><div class="dg-pricebox"><div class="dg-big">Free<small>the short survey</small></div><p>It tells us how to serve you, and your membership opens when you finish.</p><button type="button" class="dg-btn" data-survey>Take the survey</button><p class="dg-pp">No card needed.</p>' +
      (access === 'guest' ? '<p class="dg-pp">Already a member? <a href="#" data-signin>Sign in</a>.</p>' : '') + '</div>' +
      '<div><ul><li><b>What to add</b> for gyms, juice bars, cafes and caterers, not only coffee shops.</li><li><b>Sourcing and Buy or make:</b> who sells it ready-made, and the recipe to make it yourself.</li><li><b>Your page:</b> claim it and keep it current.</li><li><b>Founding Member</b> stays on your profile for good if you finish before midnight Eastern on January 1, 2027.</li></ul></div></div>';
  }

  // ---------- Overview: Start here (canon-ve-guide-overview-standard; approved by Sean 2026-11-06) ----------
  // The five steps to finishing. Members tick them; a tick is a save on their account (ve-cookbook, kind 'fix', key 'step-<n>').
  var STEPS = [
    ['1', 'Pick your kind of business', '#/add'],
    ['2', 'Choose your first items', '#/add'],
    ['3', 'Line up a supplier or a recipe for each', '#/make'],
    ['4', 'Set your menu wording', '#/say'],
    ['5', 'Claim your page', '#/claim']
  ];
  function stepsDone() { return STEPS.filter(function (st) { return SV.fix['step-' + st[0]]; }).length; }
  function checklist() {
    if (!member()) return '<ol class="pb-check">' + STEPS.map(function (st) { return '<li><em>' + st[0] + '</em><span class="pb-t">' + esc(st[1]) + '</span></li>'; }).join('') + '</ol>';
    return '<p class="pb-prog" id="pbProg">' + stepsDone() + ' of ' + STEPS.length + ' done</p><ol class="pb-check" id="pbCheck">' + STEPS.map(function (st) {
      var on = !!SV.fix['step-' + st[0]];
      return '<li' + (on ? ' class="on"' : '') + '><em>' + st[0] + '</em><span class="pb-t">' + esc(st[1]) + '</span><a href="' + st[2] + '">Open &rsaquo;</a>' +
        '<button type="button" class="pb-tick' + (on ? ' on' : '') + '" data-step="' + st[0] + '" aria-pressed="' + on + '">' + (on ? 'Done' : 'Mark done') + '</button></li>';
    }).join('') + '</ol>';
  }
  function paintSteps() {
    var box = document.getElementById('pbCheck'); if (!box) return;
    [].forEach.call(box.querySelectorAll('[data-step]'), function (b) {
      var on = !!SV.fix['step-' + b.getAttribute('data-step')];
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.textContent = on ? 'Done' : 'Mark done';
      b.closest('li').classList.toggle('on', on);
    });
    var p = document.getElementById('pbProg'); if (p) p.textContent = stepsDone() + ' of ' + STEPS.length + ' done';
  }
  function viewOverview() {
    var ul = function (xs) { return '<ul>' + xs.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; };
    main.innerHTML = head('Vegans Explore Guides for business', 'Adding plant-based options? You\'re in the right place.', '') +
      '<div class="pb-story">' +
      '<h3>The elephant in the room</h3><p>You might be worried you\'ll get it wrong. You\'ll call something plant-based and someone will find butter in it. Or you\'ll put a dish on the menu that nobody orders. Or you\'ll feel like a Vegan crowd is waiting to judge you. That\'s normal, and it\'s exactly why this Guide exists.</p>' +
      '<h3>You\'re in the right place</h3><p>This Guide is for businesses that aren\'t Vegan and want to offer plant-based options: coffee shops, gyms, juice bars, cafes, caterers and restaurants. You don\'t have to change who you are to start.</p>' +
      '<h3>Why this Guide exists</h3><p>We started Pre-Vegans as a pathway: a place where people who aren\'t Vegan yet are met with education and compassion, not judgment. This Guide is that same pathway for businesses. Plant-based options are where it starts. Where it goes is up to you.</p>' +
      '<h3>What to expect</h3>' + ul(['What to add first for your kind of business, what to stock and what to watch for', 'Who sells it ready-made, every supplier with an honest label', 'A recipe for each item if you\'d rather make it', 'The right words for your menu, so customers trust what they read', 'How people find you on Vegans Explore, and how to claim your page']) +
      '<h3>When you finish</h3><p>You\'ll have your first plant-based items picked, someone to buy them from or a recipe to make them, the right words on your menu, and your page on Vegans Explore where people are looking. Finishing means five things, and you can tick them as you go:</p>' +
      checklist() +
      '<h3>How to use this Guide</h3>' + ul(['The tabs across the top are the tour. Go in order with Back and Next, or jump to what you need.', 'Press Play under my name and I\'ll talk you through each page.', 'Save anything to My list so it\'s there next time.', 'If a page is locked, take the short survey and the whole Guide opens.']) +
      '<h3>It\'s easier than it looks</h3><p>It\'s free. The survey takes a few minutes. There is no wrong place to start, and nobody is grading you.</p>' +
      '<h3>Ask me</h3><p>Stuck on something? Ask me. If I can\'t answer it, I\'ll pass it to our team and a real person will get back to you.</p>' +
      '</div>' +
      '<div class="dg-start" style="margin-top:16px">' + (member() ? '<a class="dg-btn" href="#/add">Start with What to add</a>' : '<button type="button" class="dg-btn" data-survey>Take the survey</button><p>Free, no card.</p>') + '</div>' +
      '<p class="dg-status" role="status" aria-live="polite"></p>';
    if (member()) loadSaves(paintSteps);
  }
  // A group page (members): its sections as tiles.
  function viewGroup(g) {
    var G = group(g);
    if (G.k === 'start') return viewOverview();
    main.innerHTML = crumb([[G.label]]) + head('The Pre-Vegan Business Guide', esc(G.label), esc(G.line)) +
      '<div class="dg-tiles">' + kidsOf(G.k).map(function (k) {
        var t = tab(k), blurb = { why: 'Honest reasons, with sources, and what it will not do.', say: 'The words for your menu, and a line for a shared kitchen.',
          add: 'First items, what to stock and what to watch for.', sourcing: 'Who sells it ready-made, each with an honest label.', make: 'For each item, a supplier or a home-scale recipe.',
          found: 'How people find you in the Directory.', claim: 'Find your business and make the page yours.', mylist: 'Everything you saved.', next: 'What you can do next.' }[k] || '';
        return '<a class="dg-tile' + (k === 'add' ? ' dg-warm' : '') + '" href="' + href(k) + '"><div class="dg-ic">' + (ICON[k] || ICON.book) + '</div><div><b>' + esc(t.label) + '</b><span>' + esc(blurb) + '</span></div></a>';
      }).join('') + '</div>';
  }
  ICON.mylist = BOOKMARK.replace('width="13" height="13"', 'width="24" height="24"').replace('fill="currentColor"', 'fill="#1f5f22"');
  ICON.next = ICON.follow;

  // ---------- search (members) ----------
  function index() {
    var out = [];
    PUB.why.forEach(function (w) { out.push({ t: 'Why add plant-based', title: w.title, text: w.text, href: '#/why' }); });
    PUB.say.forEach(function (x) { out.push({ t: 'How to say it', title: x[0], text: x[1], href: '#/say' }); });
    allAdds().forEach(function (a) { if (!a.locked) out.push({ t: 'What to add', title: a.title, text: [a.short].concat(a.firsts || [], a.stock || [], a.watch || [], [a.start]).join(' '), href: '#/add/' + a.id }); });
    return out;
  }
  function viewSearch(q) {
    if (qEl.value !== q) qEl.value = q;
    var words = q.toLowerCase().split(/\s+/).filter(Boolean);
    var hits = index().filter(function (h) { var hay = (h.title + ' ' + h.text).toLowerCase(); return words.every(function (w) { return hay.indexOf(w) >= 0; }); });
    var groups = {}; hits.forEach(function (h) { (groups[h.t] = groups[h.t] || []).push(h); });
    var html = crumb([['Search']]) + '<h2 class="dg-h1">' + hits.length + (hits.length === 1 ? ' result' : ' results') + ' for &ldquo;' + esc(q) + '&rdquo;</h2><div class="dg-res">';
    ['What to add', 'How to say it', 'Why add plant-based'].forEach(function (g) {
      if (!groups[g]) return;
      html += '<h2>' + esc(g) + ' (' + groups[g].length + ')</h2><div class="dg-grid">' + groups[g].slice(0, 24).map(function (h) {
        return '<a class="dg-card dg-hit" href="' + h.href + '"><h3>' + esc(h.title) + '</h3><p>' + esc(h.text.length > 160 ? h.text.slice(0, 157) + '...' : h.text) + '</p></a>';
      }).join('') + '</div>';
    });
    if (!hits.length) html += '<p class="dg-empty">Nothing matched. Try oat milk, honey, whey or protein.</p>';
    main.innerHTML = html + '</div>';
  }
  var tSearch;
  qEl.addEventListener('input', function () {
    clearTimeout(tSearch);
    tSearch = setTimeout(function () {
      var q = qEl.value.trim(), h = q ? '#/search/' + encodeURIComponent(q) : '#/';
      if (/^#\/search\//.test(location.hash) && q) { history.replaceState(null, '', location.pathname + location.search + h); route(); } else location.hash = h;
    }, 180);
  });
  document.getElementById('dgSearchForm').addEventListener('submit', function (e) { e.preventDefault(); var q = qEl.value.trim(); if (q) location.hash = '#/search/' + encodeURIComponent(q); });

  // ---------- Maya, on the right of every tab ----------
  var TOUR = { started: false, playing: false, paused: false, shown: null };
  var tourM = document.getElementById('dgTourM'), foldBtn = document.getElementById('dgFold'), railEl = document.getElementById('dgRail');
  function setFold(folded) {
    railEl.classList.toggle('dg-folded', folded);
    foldBtn.textContent = folded ? 'Show Maya' : 'Hide Maya'; foldBtn.setAttribute('aria-expanded', String(!folded));
    try { sessionStorage.setItem('pb_maya_folded', folded ? '1' : ''); } catch (e) {}
  }
  foldBtn.addEventListener('click', function () {
    var folded = !railEl.classList.contains('dg-folded');
    if (folded && TOUR.playing) { TOUR.paused = true; stopMaya(); drawMaya(); }
    setFold(folded);
  });
  try { if (sessionStorage.getItem('pb_maya_folded')) setFold(true); } catch (e) {}
  var mayaBox = document.getElementById('dgMaya'), bubble = document.getElementById('dgBubble'), playBtn = document.getElementById('dgPlay'), tourEl = document.getElementById('dgTour');
  function mayaAudio(k) { if (/^g:/.test(k)) { var gk = k.slice(2); return AUDIO_G[gk] ? AUDIO_BASE + AUDIO_G[gk] + '.mp3' : null; } var f = (member() ? AUDIO_M : AUDIO_V)[k] || AUDIO_V[k]; return f ? AUDIO_BASE + f + '.mp3' : null; }
  var aud = new Audio(); aud.preload = 'none';
  aud.addEventListener('ended', function () { TOUR.playing = false; drawMaya(); });
  function cueMaya(k) {
    var key = k + (member() ? ':m' : '');
    if (TOUR.shown === key) return;
    TOUR.shown = key; stopMaya();
    var au = mayaAudio(k); if (au) aud.src = au; else aud.removeAttribute('src');
    mayaBox.classList.remove('dg-shift'); void mayaBox.offsetWidth; mayaBox.classList.add('dg-shift');
  }
  function playMaya() {
    if (!mayaAudio(curTab)) { drawMaya(); return; }
    aud.play().then(function () { TOUR.playing = true; drawMaya(); }).catch(function () { TOUR.playing = false; drawMaya(); });
  }
  function stopMaya() { try { aud.pause(); } catch (e) {} TOUR.playing = false; }
  playBtn.addEventListener('click', function () { if (!TOUR.started) { TOUR.started = true; TOUR.paused = false; playMaya(); } else if (TOUR.playing) { TOUR.paused = true; stopMaya(); } else { TOUR.paused = false; playMaya(); } drawMaya(); });
  function drawMaya() {
    var isG = /^g:/.test(curTab), t = isG ? null : tab(curTab);
    var st = tourSteps(), key = curTab === 'search' ? 'overview' : curTab, i = Math.max(0, st.indexOf(key));
    bubble.textContent = isG ? group(curTab.slice(2)).say : (member() && t.sayMember ? t.sayMember : t.say);
    // A page with no recording for this visitor: no Play button, her words are in the bubble.
    playBtn.hidden = !mayaAudio(curTab);
    playBtn.classList.toggle('go', !TOUR.started);
    playBtn.innerHTML = !TOUR.started ? '&#9654; Play Maya' : TOUR.playing ? 'Pause Maya' : '&#9654; Play Maya';
    var pos;
    if (member()) { var gi = 0; GROUPS.forEach(function (g, n) { if (g.k === groupOf(key === 'overview' ? 'start' : key)) gi = n; }); pos = (gi + 1) + ' of ' + GROUPS.length; }
    else pos = (i + 1) + ' of ' + st.length;
    tourEl.innerHTML = tourM.innerHTML = '<a class="dg-tnav" href="' + stepHref(st[Math.max(0, i - 1)]) + '"' + (i ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Back</a><span>' + pos + '</span>' +
      '<a class="dg-tnav next" href="' + stepHref(st[Math.min(st.length - 1, i + 1)]) + '"' + (i < st.length - 1 ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Next</a>';
  }
  // A section's crumb names its group for members: Pre-Vegan Business Guide > Add it > Sourcing.
  function groupCrumb(key) {
    if (!member() || key === 'overview' || key === 'search' || /^g:/.test(key)) return;
    var G = group(groupOf(key)); if (G.k === 'start') return;
    var link = ' &rsaquo; <a href="' + gHref(G.k) + '">' + esc(G.label) + '</a>';
    var c = main.querySelector('.dg-crumb');
    if (c && c === main.firstElementChild) { var a = c.querySelector('a'); if (a) a.insertAdjacentHTML('afterend', link); }
    else main.insertAdjacentHTML('afterbegin', '<div class="dg-crumb"><a href="#/">Pre-Vegan Business Guide</a>' + link + ' &rsaquo; ' + esc(tab(key).label) + '</div>');
  }

  // ---------- router ----------
  function route() {
    var parts = (location.hash || '').replace(/^#\/?/, '').split('/');
    var view = parts[0] || 'overview', sub = parts.slice(1).join('/');
    if (view === 'search' && (!sub || !member())) view = 'overview';
    var known = { overview: 1, why: 1, add: 1, say: 1, sourcing: 1, make: 1, found: 1, claim: 1, next: 1, mylist: 1, join: 1, search: 1, g: 1 };
    if (view === 'g' && !member()) { view = 'overview'; sub = ''; }
    if (!known[view]) view = 'overview';
    // The members' tabs send a visitor to Get in, once the access check has answered.
    if (access !== 'checking' && !member() && TABS.some(function (t) { return t.k === view && t.mine; })) { view = 'join'; sub = ''; location.replace('#/join'); }
    document.body.classList.toggle('dg-member', member());
    drawJoinbox();
    var key = view;
    if (view === 'search') key = curTab;
    if (view === 'join' && member()) { view = 'next'; sub = ''; key = 'next'; location.replace('#/next'); }
    if (member() && !svState) loadSaves();
    if (view === 'g') { key = !sub || group(sub).k === 'start' ? 'overview' : 'g:' + group(sub).k; }
    drawMenu(view === 'search' ? 'search' : key);
    if (view !== 'search' && qEl.value && document.activeElement !== qEl) qEl.value = '';
    var moved = key !== curTab;
    curTab = key;
    ({ overview: viewOverview, why: viewWhy, add: function () { viewAdd(sub); }, say: viewSay, sourcing: function () { viewSourcing(sub); }, make: function () { viewMake(sub); },
       found: viewFound, claim: viewClaim, next: function () { viewNext(sub); }, mylist: viewMyList, join: viewJoin, search: function () { viewSearch(decodeURIComponent(sub)); },
       g: function () { viewGroup(sub); } })[view]();
    groupCrumb(key);
    cueMaya(key);
    if (moved && TOUR.started && !TOUR.paused) playMaya();
    drawMaya();
    if (view !== 'search') { main.scrollTop = 0; if (!document.documentElement.classList.contains('dg-fit') || window.innerWidth <= 900) window.scrollTo(0, 0); }
  }
  window.addEventListener('hashchange', route);

  // ---------- access ----------
  function api(action, tok) {
    return fetch(UNLOCK_URL + '?action=' + action, { method: 'POST', headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: SLUG, token: tok || undefined }) })
      .then(function (r) { return r.json(); });
  }
  function rest(url) { return fetch(url, { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } }).then(function (r) { return r.json(); }); }
  function becomeMember(html) {
    var t = document.createElement('template'); t.innerHTML = html;
    var el = t.content.getElementById('pb-data');
    MEM = el ? JSON.parse(el.textContent) : null;
    access = MEM ? 'member' : 'pending';
    route();
  }
  function setStatus(msg) { [].forEach.call(document.querySelectorAll('.dg-status'), function (e) { e.textContent = msg; }); }

  document.addEventListener('click', function (e) {
    var a = auth(), el;
    if ((el = e.target.closest('[data-notify]'))) { e.preventDefault(); notifyMe(el.getAttribute('data-notify'), el); return; }
    if ((el = e.target.closest('[data-copylink]'))) { e.preventDefault(); copyText(shareLink()).then(function () { setStatus('Copied. Anyone who joins with it is credited to you: ' + shareLink()); }); return; }
    if ((el = e.target.closest('[data-copy]'))) { e.preventDefault(); copyText(el.getAttribute('data-copy')).then(function () { setStatus('Copied.'); }); return; }
    if ((el = e.target.closest('[data-step]'))) {
      e.preventDefault();
      var sk = 'step-' + el.getAttribute('data-step'), son = !SV.fix[sk];
      if (son) SV.fix[sk] = 1; else delete SV.fix[sk];
      paintSteps();
      cookApi({ action: 'save', kind: 'fix', key: sk, on: son }).then(function (r) { if (!r || !r.ok) throw r; }).catch(function () {
        if (son) delete SV.fix[sk]; else SV.fix[sk] = 1; paintSteps(); setStatus('We could not save that just now. Try again in a moment.');
      });
      return;
    }
    if ((el = e.target.closest('[data-save]'))) {
      e.preventDefault(); e.stopPropagation();
      var kk = el.getAttribute('data-save'), i = kk.indexOf(':'), kind = kk.slice(0, i), key = kk.slice(i + 1), on = !SV[kind][key];
      if (on) { SV[kind][key] = 1; SV_ORDER.unshift({ kind: kind, key: key }); } else { delete SV[kind][key]; SV_ORDER = SV_ORDER.filter(function (x) { return !(x.kind === kind && x.key === key); }); }
      paintSaves();
      cookApi({ action: 'save', kind: kind, key: key, on: on }).then(function (r) { if (!r || !r.ok) throw r; }).catch(function () {
        if (on) delete SV[kind][key]; else SV[kind][key] = 1; paintSaves();
      });
      return;
    }
    if ((el = e.target.closest('.dg-srow[data-href]')) && !e.target.closest('a,button')) { location.hash = el.getAttribute('data-href'); return; }
    if (e.target.closest('[data-signin]')) {
      e.preventDefault();
      if (a) a.showAuthModal('Sign in and the Pre-Vegan Business Guide opens if you are a member.', function () { location.reload(); }, 'login');
      return;
    }
    if (e.target.closest('[data-survey]')) { e.preventDefault(); surveyGo(); return; }
  });

  function init() {
    document.documentElement.classList.add('dg-fit');
    if (window.VEGuideArt) { var art = VEGuideArt('maya', 'square'); if (art) mayaBox.style.backgroundImage = "url('" + art + "')"; }
    var params = new URLSearchParams(location.search);
    if (params.get('welcome') === 'survey') { params.delete('welcome'); history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + '#/next'); }
    route();
    var a = auth(), viewAs = a && a.getViewAs ? a.getViewAs() : null;
    var tok = a && a.isLoggedIn() && !viewAs ? a.getToken() : null;
    if (!tok) { access = viewAs && viewAs.mode !== 'public' ? 'pending' : 'guest'; route(); api('status').then(function (d) { take(d); route(); }).catch(function () {}); return; }
    api('open', tok).then(function (d) {
      take(d);
      if (d && d.unlocked && d.html) becomeMember(d.html);
      else { access = d && d.loggedIn ? 'pending' : 'guest'; route(); }
    }).catch(function () { access = 'pending'; route(); setStatus('We could not check your access just now. Refresh to try again.'); });
  }

  if (window.VEAuth) init(); else window.addEventListener('load', init);
})();
