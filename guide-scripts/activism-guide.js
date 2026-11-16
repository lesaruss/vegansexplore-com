/* The Vegan Activism Guide (Sean, 2026-11-16; playbook ve-activism-guide). Dani hosts.
 * The page is a copy of /nominate (the first copy of passport.html?guide=welcome, the template for Guides); this file follows
 * guide-scripts/nominate.js (head, crumb, the Getting started card, the article rows, the .vxc call to action, the rail's Back / N of M / Next).
 *
 *   #/                  Overview: Dani's welcome, the ways to act (each one its own part, none ranked above another), what is coming
 *   #/humane-education  Humane education: Dani's intro, then its educators, one page each (Sean, 2026-11-16: "she needs her own page,
 *                       just like James Wildman. I would even have her lead the humane education because she's been at it for 40 plus years")
 *   #/humane-education/susan-hargreaves  Susan Hargreaves, Be an Animal Hero: about, our 2018 episode, her listings, one call to action
 *   #/humane-education/james-wildman     James Wildman, ARFF: about, our interview, his 101 Reasons talk, his listings, one call to action
 * The menu shows the parts (Overview, Humane Education); the rail's Back / N of M / Next walks every page, each with its own Dani scene.
 *
 * Copy approved by Sean 2026-11-16 ("Approved, go ahead and build it"). Dani's lines are text until they are recorded (her voice id is in CLAUDE.md);
 * nothing plays until pressed. Parts not built yet say Coming, never a promise.
 */
(function () {
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var PIC = '/public/guides/';
  var ART = PIC + 'activism/dani-';
  // The people and organizations each part shows on the shared Directory card (slugs; a listing not yet approved simply does not show).
  // Found by name, so a listing shows as soon as it is approved, whatever slug it gets.
  var SUSAN_NAMES = ['Susan Hargreaves', 'Be an Animal Hero'];
  var JAMES_NAMES = ['James Wildman', 'Animal Rights Foundation of Florida'];
  var SUSAN_AUDIO = 'https://podcasts.captivate.fm/media/0809b3b7-51b2-47b5-84c8-aad59bbe7fa0/sfv-podcast-episode-007.mp3';
  var CSS = [
    '.dg-joinbox a.dg-btn{text-decoration:none;}',
    '.ag-ways{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr));gap:12px;}',
    '.ag-way{display:flex;gap:14px;align-items:flex-start;border:1px solid var(--line);border-radius:12px;padding:14px;background:#fff;color:inherit;text-decoration:none;}',
    'a.ag-way:hover{border-color:var(--g2);}',
    '.ag-ic{flex:0 0 52px;height:52px;border-radius:12px;background:#FF9EC4;display:grid;place-items:center;}',
    '.ag-ic svg{width:26px;height:26px;stroke:#1a1a1a;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
    '.ag-way b{display:block;font-size:16px;font-weight:900;margin:2px 0 4px;}',
    '.ag-way small{display:block;font-size:13.5px;line-height:1.5;color:var(--ink75);}',
    '.ag-tag{display:inline-block;margin-top:6px;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;border-radius:6px;padding:3px 8px;}',
    '.ag-tag.live{color:var(--g);background:var(--gl);}',
    '.ag-tag.soon{color:#8a5a00;background:var(--warm);}',
    '.ag-sec{margin:26px 0 8px;}',
    '.ag-sec h3{font-size:20px;font-weight:900;margin:0 0 4px;}',
    '.ag-sec p.ag-sub{margin:0 0 12px;font-size:14.5px;line-height:1.55;color:var(--ink75);max-width:860px;}',
    '.ag-vids{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(420px,100%),1fr));gap:18px;}',
    '.ag-vid{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff;}',
    '.ag-yt{position:relative;aspect-ratio:16/9;background:#0F1F14 center/cover no-repeat;}',
    '.ag-yt iframe{position:absolute;inset:0;width:100%;height:100%;border:0;}',
    '.ag-yt button{position:absolute;inset:0;border:0;background:transparent;cursor:pointer;display:flex;align-items:flex-end;justify-content:flex-start;padding:14px;}',
    '.ag-yt button span{display:inline-flex;align-items:center;gap:8px;background:#F69820;color:#1a1a1a;font:800 13px Montserrat,sans-serif;letter-spacing:.06em;text-transform:uppercase;padding:11px 16px;border-radius:6px;box-shadow:0 2px 10px rgba(0,0,0,.25);}',
    '.ag-vid-b{padding:12px 14px 14px;}',
    '.ag-vid-k{font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#C2185B;}',
    '.ag-vid-b b{display:block;font-size:16px;font-weight:900;line-height:1.3;margin:4px 0;}',
    '.ag-vid-b p{margin:0;font-size:14px;line-height:1.55;color:var(--ink75);}',
    '.ag-vid-b .ag-len{display:block;margin-top:6px;font-size:12px;font-weight:800;color:var(--ink55);}',
    '.ag-more{display:inline-block;margin-top:8px;font-size:13px;font-weight:800;color:var(--g);text-decoration:underline;}',
    '.ag-about{font-size:15px;line-height:1.6;color:var(--ink75);max-width:860px;margin:0 0 12px;}'
  ].join('');
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  // Line icons for the ways to act (no pictures of people, so nothing covers or crops a face).
  var IC = {
    teach: '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M7 9v5c0 1.7 2.2 3 5 3s5-1.3 5-3V9"/>',
    outreach: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    direct: '<path d="M4 21V4"/><path d="M4 4h12l-2 4 2 4H4"/>',
    law: '<path d="M12 3v18M5 21h14M6 7h12M6 7l-3 6a3 3 0 0 0 6 0L6 7zM18 7l-3 6a3 3 0 0 0 6 0l-3-6z"/>',
    sanctuary: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
    digital: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'
  };
  // The ways to act, in no order of rank (Sean, 2026-11-16: "a balance of humane education and direct action and all that").
  var WAYS = [
    ['humane-education', 'teach', 'Humane education', 'Helping people, often students, think through how their choices affect animals, people and the planet.'],
    ['', 'outreach', 'Street outreach', 'Conversations with people on the street, often with footage, so they can see for themselves.'],
    ['', 'direct', 'Direct action', 'Protests, vigils and peaceful public actions that bring attention to what animals go through.'],
    ['', 'law', 'Legal and policy work', 'Changing laws, rules and the way companies and schools do things.'],
    ['', 'sanctuary', 'Sanctuaries and rescue', 'Giving animals a safe home for life, and showing visitors who they really are.'],
    ['', 'digital', 'Digital activism', 'Videos, posts, petitions and campaigns that reach people where they scroll.']
  ];
  // The parts in the menu, and every page the rail walks (each page its own Dani scene).
  var TABS = [{ k: 'overview', label: 'Overview' }, { k: 'humane-education', label: 'Humane Education' }, { k: 'speeches', label: 'The Speeches' }];
  var STEPS = [
    // Dani's lines, approved by Sean 2026-11-16 (the Humane Education line updated for Susan the same day); text until recorded.
    { k: 'overview', art: 'overview', say: 'Hi, I\'m Dani. Every animal we\'ve ever helped was helped by someone who decided to speak up. There\'s no single right way to do it. Some people teach, some march, some build sanctuaries, some change laws. This Guide walks you through all of it, so you can find the way that fits you. Let\'s start with one of the gentlest and most powerful: teaching.' },
    { k: 'humane-education', art: 'humane-education', say: 'Humane education means helping people, often students, think about how their choices affect animals, people and the planet. It\'s about giving people the facts and letting them decide, not preaching. Nobody has been doing it longer, or with more heart, than Susan Hargreaves.' },
    // The two educator pages' lines are drafts for Sean.
    { k: 'humane-education/susan-hargreaves', art: 'susan-hargreaves', say: 'Meet Susan Hargreaves. She has been teaching people to care about animals for more than 40 years. Press play to hear her story on our podcast.' },
    { k: 'humane-education/james-wildman', art: 'james-wildman', say: 'Meet James Wildman. He gives around 500 free talks a year. Start with our interview, then watch the talk that made him known.' },
    // Draft for Sean (2026-11-16, "Go ahead with the speeches").
    { k: 'speeches', art: 'speeches', say: 'Sometimes one talk is all it takes. These six are some of the most watched and shared talks on Veganism anywhere. Start with a short one tonight, and save the long ones for when you have the time.' }
  ];
  // The videos: ours first, then the talk (YouTube, loaded only when pressed).
  // The six speeches Sean shared (2026-11-16), shortest first so anyone can start tonight. Every one has subtitles in many languages.
  var SPEECHES = [
    { id: 'uQCe4qEexjc', k: 'Philip Wollen', t: 'Should Animals Be Off the Menu?', len: '10 minutes',
      p: 'Philip Wollen\'s opening in a public debate. Short, direct and famous for good reason: it asks everyone to look at what their choices cost animals.' },
    { id: '4XDVGgZijLA', k: 'Joey Carbstrong', t: 'Opening Speech in a Veganism Debate at the University of Oxford', len: '10 minutes',
      p: 'A short, powerful case from a creator known for his street activism, investigations and documentaries.' },
    { id: 'Z3u7hXpOm58', k: 'Earthling Ed', t: 'You Will Never Look at Your Life in the Same Way Again', len: 'About 32 minutes',
      p: 'One of the best known talks by Ed Winters, who also gives TEDx talks, debates on TV and radio, and writes books on Veganism and ethical reasoning.' },
    { id: 'KHOcox2lvQo', k: 'James Aspey', t: 'A Wake-Up Call', len: 'About 42 minutes',
      p: 'One of the most inspiring and widely shared talks on Veganism, from a well known animal rights activist.' },
    { id: 'YnQb58BoBQw', k: 'James Wildman', t: '101 Reasons to Go Vegan', len: 'About 1 hour 8 minutes',
      p: 'The humane educator\'s classic, given to classrooms across Florida.', more: '<a class="ag-more" href="#/humane-education/james-wildman">Meet James in Humane Education</a>' },
    { id: 'es6U00LMmC4', k: 'Gary Yourofsky', t: 'The Best Speech You Will Ever Hear', len: 'About 1 hour, plus a 30 minute Q&amp;A',
      p: 'One of the most viewed talks on Veganism, with millions of views, from a speaker who has given thousands of talks at schools and universities.',
      more: '<a class="ag-more" href="https://www.youtube.com/watch?v=WIkC4OJEx3c" target="_blank" rel="noopener">Watch part 2, the Q&amp;A (about 30 minutes)</a>' }
  ];
  var SPEAKER_NAMES = ['Earthling Ed', 'James Wildman', 'James Aspey', 'Joey Carbstrong', 'Philip Wollen', 'Gary Yourofsky'];
  var VIDS = {
    interview: { id: 'W5esV8NUFgk', k: 'Our interview', t: '101 Reasons to Go Vegan, How James Wildman Reaches 100,000 Students a Year', len: '21 minutes · the Vegans Explore Podcast',
      p: 'James explains how humor, evidence and meeting people where they are change minds more than winning arguments do.' },
    talk: { id: 'YnQb58BoBQw', k: 'Go deeper', t: '101 Reasons to Go Vegan', len: 'About 1 hour 8 minutes',
      p: 'The talk James has given to classrooms across Florida.' }
  };

  var main = document.getElementById('dgMain');
  var menuEl = document.getElementById('dgMenu'), menuSel = document.getElementById('dgMenuSelect');
  var bubble = document.getElementById('dgBubble'), tourEl = document.getElementById('dgTour'), tourM = document.getElementById('dgTourM');
  var foldBtn = document.getElementById('dgFold'), railEl = document.getElementById('dgRail');
  var curTab = 'overview';

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pic(p) { return PIC + p; }
  function rest(url) { return fetch(url, { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } }).then(function (r) { return r.json(); }); }
  function step(k) { for (var i = 0; i < STEPS.length; i++) if (STEPS[i].k === k) return STEPS[i]; return STEPS[0]; }
  function href(k) { return '#/' + (k === 'overview' ? '' : k); }
  function head(k, h, lede) { return '<div class="dg-head"><div><div class="dg-k">' + esc(k) + '</div><h2 class="dg-h1">' + esc(h) + '</h2></div></div>' + (lede ? '<p class="dg-lede">' + lede + '</p>' : ''); }
  function crumb(label, sub) { return '<div class="dg-crumb"><a href="#/">The Vegan Activism Guide</a> &rsaquo; ' + (sub ? '<a href="#/humane-education">' + esc(label) + '</a> &rsaquo; ' + esc(sub) : esc(label)) + '</div>'; }
  function card(kicker, title, picUrl, body, btns) {
    return '<section class="wg-gs"><span class="wg-gs-pic"><img src="' + esc(picUrl) + '" alt="" decoding="async" width="640" height="640"></span>' +
      '<div class="wg-gs-b"><div class="vgi-k">' + esc(kicker) + '</div><h3 class="wg-gs-t">' + esc(title) + '</h3>' + body +
      (btns ? '<div class="wg-gs-btns">' + btns + '</div>' : '') + '</div></section>';
  }
  function lines(ps) { return ps.map(function (x) { return '<p>' + x + '</p>'; }).join(''); }
  function cta(k, title, text, go) {
    if (window.VEExplorerCard) VEExplorerCard.html({});   // loads the .vxc styles (nominate.js does the same)
    return '<section class="vxc" aria-label="' + esc(go[0]) + '"><div class="vxc-b"><div class="vxc-k">' + esc(k) + '</div><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p></div>' +
      '<a class="vxc-go" href="' + esc(go[1]) + '">' + esc(go[0]) + '</a></section>';
  }
  function way(w) {
    var inner = '<span class="ag-ic"><svg viewBox="0 0 24 24" aria-hidden="true">' + IC[w[1]] + '</svg></span><span><b>' + esc(w[2]) + '</b><small>' + esc(w[3]) + '</small>' +
      (w[0] ? '<span class="ag-tag live">Open now</span>' : '<span class="ag-tag soon">Coming</span>') + '</span>';
    return '<li>' + (w[0] ? '<a class="ag-way" href="' + href(w[0]) + '">' + inner + '</a>' : '<div class="ag-way">' + inner + '</div>') + '</li>';
  }
  function vid(v) {
    return '<article class="ag-vid"><div class="ag-yt" data-yt="' + esc(v.id) + '" style="background-image:url(&quot;https://i.ytimg.com/vi/' + esc(v.id) + '/hqdefault.jpg&quot;)">' +
      '<button type="button" aria-label="Watch: ' + esc(v.t) + '"><span><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6,4 20,12 6,20"></polygon></svg>Watch</span></button></div>' +
      '<div class="ag-vid-b"><div class="ag-vid-k">' + esc(v.k) + '</div><b>' + esc(v.t) + '</b><p>' + esc(v.p) + '</p><span class="ag-len">' + v.len.replace(/&(?!amp;)/g, '&amp;') + '</span>' + (v.more || '') + '</div></article>';
  }
  // The shared Directory card (VERegionDirectory.card / .wire), never a hand-made one.
  function cards(list, id) { return '<div class="vrd-root"><div class="rank-grid" id="' + id + '">' + list.map(function (l, i) { return window.VERegionDirectory ? VERegionDirectory.card(l, i) : ''; }).join('') + '</div></div>'; }
  function wireCards(id) { var g = $(id); if (g && window.VERegionDirectory) VERegionDirectory.wire(g, function (slug) { location.href = '/directory/' + encodeURIComponent(slug); }); }
  function loadCards(names, boxId, gridId, done) {
    var FIELDS = window.VERegionDirectory && VERegionDirectory.FIELDS ? VERegionDirectory.FIELDS : 'id,slug,name,category,logo_url,vote_count,address_city,address_state,color,vegan_status,communities,tags,extra_categories';
    var or = names.map(function (n) { return 'name.ilike.' + encodeURIComponent(n.replace(/[,()*]/g, ' ')); }).join(',');
    rest(SB + '/rest/v1/listings?select=' + FIELDS + '&status=eq.approved&or=(' + or + ')').then(function (rows) {
      var box = $(boxId); if (!box || !Array.isArray(rows) || !rows.length) { if (done) done([]); return; }
      function at(r) { for (var i = 0; i < names.length; i++) if (names[i].toLowerCase() === String(r.name || '').toLowerCase()) return i; return 99; }
      rows.sort(function (a, b) { return at(a) - at(b); });
      box.innerHTML = cards(rows, gridId); wireCards(gridId);
      if (done) done(rows);
    }).catch(function () { if (done) done([]); });
  }
  function educator(k, name, org, line) {
    return '<li><a class="ag-way" href="#/humane-education/' + k + '"><span class="ag-ic"><svg viewBox="0 0 24 24" aria-hidden="true">' + IC.teach + '</svg></span><span><b>' + esc(name) + '</b><small>' + esc(org) + '. ' + esc(line) + '</small><span class="ag-tag live">Open</span></span></a></li>';
  }

  var VIEWS = {
    overview: function () {
      return head('Free for everyone', 'Find Your Way to Speak Up', '') +
        card('Getting started', 'How to use this Guide', pic('thumb-community.jpg'), lines([
          'Every way of helping animals is here, side by side. Open a part, watch the people who do it best, meet the organizations behind them, and find the way that fits you.']),
          '<a class="dg-btn" href="#/humane-education">Start with humane education</a>') +
        '<div class="ag-sec"><h3>The ways to act</h3><p class="ag-sub">No way is ranked above another. Each part opens as it is ready.</p>' +
        '<ul class="ag-ways">' + WAYS.map(way).join('') + '</ul></div>' +
        '<div class="ag-sec"><h3>The speeches</h3><p class="ag-sub">Six talks that changed minds around the world, shortest first.</p><ul class="ag-ways"><li><a class="ag-way" href="#/speeches"><span class="ag-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></span><span><b>The Speeches</b><small>Philip Wollen, Joey Carbstrong, Earthling Ed, James Aspey, James Wildman and Gary Yourofsky.</small><span class="ag-tag live">Open now</span></span></a></li></ul></div>' +
        '<div class="ag-sec"><h3>Also coming</h3><p class="ag-sub">Campaign news, and a place to rally and talk with other activists.</p></div>';
    },
    'humane-education': function () {
      return crumb('Humane Education') + head('Humane education', 'Teaching People to Care', '') +
        '<p class="ag-about">Humane education means helping people, often students, think about how their choices affect animals, people and the planet. It is about giving people the facts and letting them decide, not preaching.</p>' +
        '<div class="ag-sec"><h3>The educators</h3><p class="ag-sub">Each one has their own page: their story, what to watch or hear, and how to reach them.</p>' +
        '<ul class="ag-ways">' +
        educator('susan-hargreaves', 'Susan Hargreaves', 'Be an Animal Hero', 'More than 40 years in schools, children\'s books and the documentary The Heart Whisperer.') +
        educator('james-wildman', 'James Wildman', 'Animal Rights Foundation of Florida', 'Around 500 free talks a year and the talk 101 Reasons to Go Vegan.') +
        '</ul></div>';
    },
    'humane-education/susan-hargreaves': function () {
      return crumb('Humane Education', 'Susan Hargreaves') + head('Humane education', 'Teaching With Susan Hargreaves', '') +
        '<p class="ag-about">Susan Hargreaves founded Be an Animal Hero and has been a humane educator for more than 40 years. She has written children\'s books and educational resource books, performs at schools with giveaways for students and people in need, and regularly works with PETA and other organizations to hand out items. Her documentary on humane education, <i>The Heart Whisperer</i>, was directed by the director of <i>Earthlings</i>. Our founder credits her as his personal Vegan mentor.</p>' +
        // The Heart Whisperer, spotlighted (Sean, 2026-11-16: "that needs to be spotlighted"). Link from Sean, 2026-11-16.
        '<div class="ag-sec"><h3>The Heart Whisperer</h3><div class="ag-vids"><article class="ag-vid"><div class="ag-vid-b"><div class="ag-vid-k">Her documentary</div><b>The Heart Whisperer</b>' +
        '<p>Susan\'s documentary on humane education, directed by the director of <i>Earthlings</i>. It is streaming on Jane Unchained.</p>' +
        '<a class="dg-btn" href="https://watch.unchainedtv.com/videos/the-heart-whisperer" target="_blank" rel="noopener" style="display:inline-block;margin-top:10px;text-decoration:none">Watch on Jane Unchained</a></div></article></div></div>' +
        '<div class="ag-sec"><h3>Listen</h3><div class="ag-vids"><article class="ag-vid"><div class="ag-vid-b"><div class="ag-vid-k">Our episode</div><b>Susan Hargreaves: Founder of Animal Hero Kids</b>' +
        '<p>Susan on Vegan living, animal rights and making the change, on the SoFlo Vegans Podcast.</p><span class="ag-len">36 minutes \u00b7 the SoFlo Vegans Podcast, part of the Vegans Explore Network</span>' +
        '<audio controls preload="none" src="' + SUSAN_AUDIO + '" style="width:100%;margin-top:10px"></audio></div></article></div></div>' +
        '<div class="ag-sec"><h3>Meet them</h3><p class="ag-sub">Susan and her organization in the Directory.</p><div id="agSusan"><p class="ag-sub">Their Directory pages are on the way.</p></div></div>' +
        '<div id="agSusanGo"></div>';
    },
    speeches: function () {
      return crumb('The Speeches') + head('The speeches', 'Six Talks That Changed Minds', '') +
        '<p class="ag-about">Some of the most watched and shared speeches on Veganism and animal rights, shortest first. Every one has subtitles in many languages: turn them on in the player.</p>' +
        '<div class="ag-sec"><div class="ag-vids">' + SPEECHES.map(vid).join('') + '</div></div>' +
        '<div class="ag-sec"><h3>Meet them</h3><p class="ag-sub">The speakers in our Directory.</p><div id="agSpk"><p class="ag-sub">Their Directory pages are on the way.</p></div></div>';
    },
    'humane-education/james-wildman': function () {
      return crumb('Humane Education', 'James Wildman') + head('Humane education', 'Teaching With James Wildman', '') +
        '<p class="ag-about">James Wildman is a humane educator with the Animal Rights Foundation of Florida. He has worked there for more than 13 years, gives around 500 free presentations a year in schools, universities and communities, and has spoken to more than 100,000 people.</p>' +
        '<div class="ag-sec"><h3>Watch</h3><div class="ag-vids">' + vid(VIDS.interview) + vid(VIDS.talk) + '</div></div>' +
        '<div class="ag-sec"><h3>Meet them</h3><p class="ag-sub">James and his organization in the Directory.</p><div id="agJames"></div></div>' +
        cta('Humane education', 'Bring a talk like this to your school.', 'James gives free presentations in schools, universities and communities. Reach him through his page.', ['Bring a talk like this to your school', '/directory/james-wildman']);
    }
  };

  // ---------- menu and Dani (nominate.js / welcome-guide.js) ----------
  function drawMenu(cur) {
    cur = cur.split('/')[0];
    menuEl.innerHTML = TABS.map(function (t) { return '<a href="' + href(t.k) + '"' + (t.k === cur ? ' aria-current="page"' : '') + '>' + esc(t.label) + '</a>'; }).join('');
    menuSel.innerHTML = TABS.map(function (t, n) { return '<option value="' + t.k + '"' + (t.k === cur ? ' selected' : '') + '>' + (n + 1) + '. ' + esc(t.label) + '</option>'; }).join('');
  }
  document.documentElement.classList.toggle('dg-dd', TABS.length > 5);
  menuSel.addEventListener('change', function () { location.hash = href(menuSel.value); });
  foldBtn.addEventListener('click', function () {
    var f = !railEl.classList.contains('dg-folded'); railEl.classList.toggle('dg-folded', f);
    foldBtn.textContent = f ? 'Show Dani' : 'Hide Dani'; foldBtn.setAttribute('aria-expanded', String(!f));
  });
  function drawDani() {
    var t = step(curTab), i = STEPS.indexOf(t);
    bubble.textContent = t.say;
    var box = $('dgMaya'); box.innerHTML = ''; box.style.backgroundImage = "url('" + ART + t.art + ".jpg')";
    $('dgPlay').hidden = true;   // no recording yet: the Play button shows once Dani's lines are recorded
    tourEl.innerHTML = tourM.innerHTML = '<a class="dg-tnav" href="' + href(STEPS[Math.max(0, i - 1)].k) + '"' + (i ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Back</a><span>' + (i + 1) + ' of ' + STEPS.length + '</span>' +
      '<a class="dg-tnav next" href="' + href(STEPS[Math.min(STEPS.length - 1, i + 1)].k) + '"' + (i < STEPS.length - 1 ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Next</a>';
  }
  function route() {
    var k = (location.hash.replace(/^#\/?/, '') || 'overview').split('?')[0].replace(/\/+$/, '') || 'overview';
    if (!VIEWS[k]) k = 'overview';
    curTab = k;
    main.innerHTML = VIEWS[k]();
    if (k === 'humane-education/james-wildman') loadCards(JAMES_NAMES, 'agJames', 'agJamesGrid');
    if (k === 'speeches') loadCards(SPEAKER_NAMES, 'agSpk', 'agSpkGrid');
    if (k === 'humane-education/susan-hargreaves') loadCards(SUSAN_NAMES, 'agSusan', 'agSusanGrid', function (rows) {
      // Bring Susan to your school shows once her People page is live, and links to it.
      var me = rows.filter(function (r) { return /susan hargreaves/i.test(r.name || ''); })[0], go = $('agSusanGo');
      if (me && go) go.innerHTML = cta('Humane education', 'Bring Susan to your school.', 'Susan performs at schools, with giveaways for students. Reach her through her page.', ['Bring Susan to your school', '/directory/' + me.slug]);
    });
    drawMenu(curTab); drawDani();
    window.scrollTo(0, 0);
  }
  // A video loads only when pressed (nothing plays until pressed).
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.ag-yt button'); if (!b) return;
    var box = b.parentNode, id = box.getAttribute('data-yt');
    box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0" title="' + esc(b.getAttribute('aria-label')) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    try { if (window.gtag) gtag('event', 'video_start', { video_title: 'activism-' + id }); } catch (x) {}
  });
  if (window.VERegionDirectory) VERegionDirectory.css();   // the Directory card's own styles
  window.addEventListener('hashchange', route);
  tourM.addEventListener('click', function (e) { if (e.target.closest('.dg-tnav')) setTimeout(function () { railEl.scrollIntoView({ block: 'start' }); }, 0); });
  route();
})();
