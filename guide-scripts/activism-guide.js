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
  var ZOE_NAMES = ['Zoe Weil', 'Institute for Humane Education'];
  // Street outreach (Sean, 2026-11-16: "Go ahead with street outreach"): the groups and people known for it that we list.
  // Direct action (Sean, 2026-11-16: "Go ahead with direct action"): groups known for it that we list (The Save Movement and Surge show once listed).
  var ACTION_NAMES = ['Direct Action Everywhere', 'The Save Movement', 'Surge', 'Animal Equality', 'Mercy For Animals', 'The Humane League', 'PETA'];
  var OUTREACH_NAMES = ['Anonymous for the Voiceless', 'Vegan Outreach', 'Earthling Ed', 'Joey Carbstrong', 'Revolution Philadelphia'];
  // More humane educators (Sean, 2026-11-16: "find out who the community would consider humane educators"); each shows once its listing is approved.
  var MORE_EDU_NAMES = ['TeachKind', 'LivingKind', 'Ruby Roth', 'Factory Farming Awareness Coalition', 'Institute for Humane Education'];
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
    '.ag-sec p.ag-sub{margin:0 0 12px;font-size:14.5px;line-height:1.55;color:var(--ink75);}',
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
    '.ag-eras{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr));gap:14px;}',
    '.ag-era{display:block;border:3px solid #1a1a1a;border-radius:10px;padding:16px;color:inherit;text-decoration:none;box-shadow:5px 5px 0 #1a1a1a;transition:transform .12s;}',
    'a.ag-era:hover{transform:translate(-2px,-2px);}',
    '.ag-era small{display:block;font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;}',
    '.ag-era b{display:block;font-size:20px;font-weight:900;margin:6px 0;}',
    '.ag-era p{margin:0 0 10px;font-size:14px;line-height:1.5;}',
    '.ag-era em{font-style:normal;font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;border-bottom:2px solid #1a1a1a;}',
    '.ag-band{border:3px solid #1a1a1a;border-radius:10px;padding:14px 16px;margin:6px 0 18px;}',
    '.ag-band small{font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;}',
    '.ag-band p{margin:6px 0 0;font-size:15px;line-height:1.55;}',
    '.ag-eranav{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 16px;}',
    '.ag-eranav a{font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;border:2px solid #1a1a1a;border-radius:6px;padding:7px 10px;color:#1a1a1a;text-decoration:none;background:#fff;}',
    '.ag-eranav a[aria-current=page]{background:#1a1a1a;color:#fff;}',
    '.ag-tl{list-style:none;margin:0;padding:0 0 0 28px;position:relative;}',
    '.ag-tl::before{content:"";position:absolute;left:9px;top:6px;bottom:6px;width:4px;border-radius:2px;background:#1a1a1a;}',
    '.ag-ev{position:relative;margin:0 0 14px;}',
    '.ag-ev::before{content:"";position:absolute;left:-26px;top:16px;width:16px;height:16px;border-radius:50%;border:3px solid #1a1a1a;background:var(--ag-c,#FF9EC4);}',
    '.ag-ev details{border:2px solid #1a1a1a;border-radius:10px;background:#fff;}',
    '.ag-ev summary{list-style:none;cursor:pointer;padding:12px 14px;display:flex;gap:12px;align-items:baseline;flex-wrap:wrap;}',
    '.ag-ev summary::-webkit-details-marker{display:none;}',
    '.ag-ev summary span{font-size:12px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#C2185B;min-width:120px;}',
    '.ag-ev summary b{font-size:16px;font-weight:900;flex:1 1 240px;}',
    '.ag-ev summary i{font-style:normal;font-size:12px;font-weight:800;color:var(--ink55);}',
    '.ag-ev details[open] summary i{display:none;}',
    '.ag-ev .ag-evb{padding:0 14px 14px;font-size:15px;line-height:1.6;color:var(--ink75);}',
    '.ag-ev .ag-evb p{margin:0;}',
    '.ag-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;}',
    '.ag-chips a{font-size:12px;font-weight:800;border:2px solid #1a1a1a;border-radius:6px;padding:5px 9px;color:#1a1a1a;text-decoration:none;background:#FFF7EC;}',
    '.ag-eranext{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:18px 0;}',
    '.ag-credit{font-size:13px;color:var(--ink55);margin:18px 0 0;}',
    '.ag-about{font-size:15px;line-height:1.6;color:var(--ink75);margin:0 0 12px;}'
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
    ['street-outreach', 'outreach', 'Street outreach', 'Conversations with people on the street, often with footage, so they can see for themselves.'],
    ['direct-action', 'direct', 'Direct action', 'Protests, vigils and peaceful public actions that bring attention to what animals go through.'],
    ['', 'law', 'Legal and policy work', 'Changing laws, rules and the way companies and schools do things.'],
    ['sanctuaries', 'sanctuary', 'Sanctuaries and rescue', 'Giving animals a safe home for life, and showing visitors who they really are.'],
    ['', 'digital', 'Digital activism', 'Videos, posts, petitions and campaigns that reach people where they scroll.']
  ];
  // The parts in the menu, and every page the rail walks (each page its own Dani scene).
  var TABS = [{ k: 'overview', label: 'Overview' }, { k: 'humane-education', label: 'Humane Education' }, { k: 'street-outreach', label: 'Street Outreach' }, { k: 'direct-action', label: 'Direct Action' }, { k: 'speeches', label: 'The Speeches' }, { k: 'sanctuaries', label: 'Sanctuaries' }, { k: 'history', label: 'History' }];
  var STEPS = [
    // Dani's lines, approved by Sean 2026-11-16 (the Humane Education line updated for Susan the same day); text until recorded.
    { k: 'overview', art: 'overview', say: 'Hi, I\'m Dani. Every animal we\'ve ever helped was helped by someone who decided to speak up. There\'s no single right way to do it. Some people teach, some march, some build sanctuaries, some change laws. This Guide walks you through all of it, so you can find the way that fits you. Let\'s start with one of the gentlest and most powerful: teaching.' },
    { k: 'humane-education', art: 'humane-education', say: 'Humane education means helping people, often students, think about how their choices affect animals, people and the planet. It\'s about giving people the facts and letting them decide, not preaching. Nobody has been doing it longer, or with more heart, than Susan Hargreaves.' },
    // The two educator pages' lines are drafts for Sean.
    { k: 'humane-education/susan-hargreaves', art: 'susan-hargreaves', say: 'Meet Susan Hargreaves. She has been teaching people to care about animals for more than 40 years. Press play to hear her story on our podcast.' },
    { k: 'humane-education/james-wildman', art: 'james-wildman', say: 'Meet James Wildman. He gives around 500 free talks a year. Start with our interview, then watch the talk that made him known.' },
    // Draft for Sean (2026-11-16).
    { k: 'humane-education/zoe-weil', art: 'zoe-weil', say: 'Meet Zoe Weil. She helped turn humane education into a field of its own, and she teaches the teachers. If you have ever wanted to bring this work into a classroom, start here.' },
    // Draft for Sean (2026-11-16, "Go ahead with street outreach").
    { k: 'street-outreach', art: 'street-outreach', say: 'Street outreach is just a conversation, on a sidewalk, with someone who has never been asked to think about animals this way. You do not need all the answers. You need to listen, ask good questions and be kind. Start by joining a group near you.' },
    // Draft for Sean (2026-11-16, "Go ahead with direct action").
    { k: 'direct-action', art: 'direct-action', say: 'Sometimes the most powerful thing we can do is show up, together, where everyone can see us. Marches, vigils and peaceful protests remind the world that animals have people standing up for them. Go with a group, stay peaceful, and you will never forget your first one.' },
    // Draft for Sean (2026-11-16, "Go ahead with the speeches").
    { k: 'speeches', art: 'speeches', say: 'Sometimes one talk is all it takes. These are some of the most watched and shared talks on Veganism anywhere, and the list keeps growing. Start with a short one tonight, save the long ones for when you have the time, and tell us which talk changed your mind.' },
    // Draft for Sean (2026-11-16, "Go ahead with sanctuaries and rescue").
    { k: 'sanctuaries', art: 'sanctuaries', say: 'Some people help animals by changing minds. Sanctuaries and rescues help them one life at a time. Here, an animal who was never meant to grow old gets to live out a whole life. Visit one, lend a hand, or sponsor a friend, and you will never look at them the same way.' },
    // Draft for Sean (2026-11-16, the history of the movement).
    { k: 'history', art: 'history', say: 'Every Vegan today stands on the shoulders of people who spoke up long before us, some of them more than two thousand years ago. Walk through the story one era at a time, and if you know a moment we missed, tell us.' }
  ];
  // The videos: ours first, then the talk (YouTube, loaded only when pressed).
  // Talks That Changed Minds: an ongoing list (Sean, 2026-11-16: "just change it to talks that changed minds... an ongoing list"), shortest first.
  // Start: the six Sean shared. Every one has subtitles in many languages. Suggestions come in through #/speeches/suggest.
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
  function crumb(label, sub, up) { return '<div class="dg-crumb"><a href="#/">The Vegan Activism Guide</a> &rsaquo; ' + (sub ? '<a href="' + (up || '#/humane-education') + '">' + esc(label) + '</a> &rsaquo; ' + esc(sub) : esc(label)) + '</div>'; }
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
  function loadTop(category, boxId, gridId) {
    var FIELDS = window.VERegionDirectory && VERegionDirectory.FIELDS ? VERegionDirectory.FIELDS : 'id,slug,name,category,logo_url,vote_count,address_city,address_state,color,vegan_status,communities,tags,extra_categories';
    rest(SB + '/rest/v1/listings?select=' + FIELDS + '&status=eq.approved&category=eq.' + category + '&order=vote_count.desc.nullslast,name.asc&limit=8').then(function (rows) {
      var box = $(boxId); if (!box) return;
      if (!Array.isArray(rows) || !rows.length) { box.innerHTML = '<p class="ag-sub">None listed yet.</p>'; return; }
      box.innerHTML = cards(rows, gridId); wireCards(gridId);
    }).catch(function () {});
  }
  // A person's books from our Books (listings named "<title> by <author>"), on the shared Directory card; the section hides when there are none.
  function loadBooks(author, secId, boxId, gridId) {
    var FIELDS = window.VERegionDirectory && VERegionDirectory.FIELDS ? VERegionDirectory.FIELDS : 'id,slug,name,category,logo_url,vote_count,address_city,address_state,color,vegan_status,communities,tags,extra_categories';
    var who = [].concat(author), or = who.map(function (a) { return 'name.ilike.*' + encodeURIComponent('by ' + a) + '*'; }).join(',');
    rest(SB + '/rest/v1/listings?select=' + FIELDS + '&status=eq.approved&category=eq.Books&or=(' + or + ')&order=vote_count.desc.nullslast,name.asc&limit=12').then(function (rows) {
      var sec = $(secId), box = $(boxId); if (!sec || !box || !Array.isArray(rows) || !rows.length) return;
      box.innerHTML = cards(rows, gridId); wireCards(gridId); sec.hidden = false;
    }).catch(function () {});
  }
  function booksSec(id) { return '<div class="ag-sec" id="' + id + 'Sec" hidden><h3>Books</h3><p class="ag-sub">In our Books, with where to get them.</p><div id="' + id + '"></div></div>'; }
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
        '<div class="ag-sec"><h3>The speeches</h3><p class="ag-sub">Talks that changed minds around the world, shortest first. Know one we should add? Suggest it.</p><ul class="ag-ways"><li><a class="ag-way" href="#/speeches"><span class="ag-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></span><span><b>Talks That Changed Minds</b><small>Philip Wollen, Joey Carbstrong, Earthling Ed, James Aspey, James Wildman and Gary Yourofsky.</small><span class="ag-tag live">Open now</span></span></a></li></ul></div>' +
        '<div class="ag-sec"><h3>History</h3><p class="ag-sub">From ancient teachers to today\'s activists.</p><ul class="ag-ways"><li><a class="ag-way" href="#/history"><span class="ag-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span><span><b>A History of the Vegan Movement</b><small>A timeline from the earliest records to today, one era at a time.</small><span class="ag-tag live">Open now</span></span></a></li></ul></div>' +
        '<div class="ag-sec"><h3>Also coming</h3><p class="ag-sub">Campaign news, and a place to rally and talk with other activists.</p></div>';
    },
    'humane-education': function () {
      return crumb('Humane Education') + head('Humane education', 'Teaching People to Care', '') +
        // What is humane education? (Sean, 2026-11-16: "people might not have heard the term before"; copy approved the same day.)
        '<div class="ag-sec"><h3>What is humane education?</h3>' +
        '<p class="ag-about">Humane education teaches people to think about how their everyday choices affect animals, other people and the planet, and then lets them decide for themselves. It isn\'t a lecture or a protest. It\'s teaching.</p>' +
        '<p class="ag-about"><b>Where it happens:</b> classrooms and school assemblies, libraries, summer camps, universities, community centers and, more and more, online.</p>' +
        '<p class="ag-about"><b>What a session looks like:</b> a talk, a story, a video or an activity that helps people see animals as individuals, learn where food and products come from, and practice kindness and critical thinking.</p>' +
        '<p class="ag-about"><b>Why it matters:</b> most people never get the chance to think about these questions at all. Humane education gives them the facts and the space to decide, which is why so many Vegans say it was where their own journey began.</p></div>' +
        '<div class="ag-sec"><h3>The educators</h3><p class="ag-sub">Each one has their own page: their story, what to watch or hear, and how to reach them.</p>' +
        '<ul class="ag-ways">' +
        educator('susan-hargreaves', 'Susan Hargreaves', 'Be an Animal Hero', 'More than 40 years in schools, children\'s books and the documentary The Heart Whisperer.') +
        educator('james-wildman', 'James Wildman', 'Animal Rights Foundation of Florida', 'Around 500 free talks a year and the talk 101 Reasons to Go Vegan.') +
        educator('zoe-weil', 'Zoe Weil', 'Institute for Humane Education', 'Co-founder of the Institute, which trains teachers to do the most good and least harm.') +
        '</ul></div>' +
        '<div class="ag-sec" id="agTeachBooksSec" hidden><h3>Books for teaching</h3><p class="ag-sub">Books by these educators, for classrooms, families and anyone teaching kindness.</p><div id="agTeachBooks"></div></div>' +
        '<div class="ag-sec"><h3>More humane educators</h3><p class="ag-sub">Organizations and authors that bring humane education to schools, families and teachers.</p><div id="agMoreEdu"><p class="ag-sub">Their Directory pages are on the way.</p></div></div>';
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
        booksSec('agSusanBooks') +
        '<div class="ag-sec"><h3>Meet them</h3><p class="ag-sub">Susan and her organization in the Directory.</p><div id="agSusan"><p class="ag-sub">Their Directory pages are on the way.</p></div></div>' +
        '<div id="agSusanGo"></div>';
    },
    speeches: function () {
      return crumb('The Speeches') + head('The speeches', 'Talks That Changed Minds', '') +
        '<p class="ag-about">Some of the most watched and shared speeches on Veganism and animal rights, shortest first. Every one has subtitles in many languages: turn them on in the player. The list keeps growing.</p>' +
        '<div class="ag-sec"><div class="ag-vids">' + SPEECHES.map(vid).join('') + '</div></div>' +
        '<div class="ag-sec"><h3>Meet them</h3><p class="ag-sub">The speakers in our Directory.</p><div id="agSpk"><p class="ag-sub">Their Directory pages are on the way.</p></div></div>' +
        cta('Talks That Changed Minds', 'Know a talk we should add?', 'Tell us the talk that changed your mind, or someone else\'s. We watch every one.', ['Suggest a talk', '#/speeches/suggest']);
    },
    'speeches/suggest': function () {
      return crumb('The Speeches', 'Suggest a talk', '#/speeches') + head('The speeches', 'Suggest a Talk', '') +
        '<p class="ag-about">Which talk should be on this list? Send us the link and a line on why. We watch every suggestion before it goes up.</p>' +
        '<form class="k-form" id="agSug" novalidate>' +
        '<div class="k-f wide"><label for="agSugLink">The talk\'s link</label><input id="agSugLink" type="url" required placeholder="https://www.youtube.com/watch?v=..."></div>' +
        '<div class="k-f"><label for="agSugWho">Who gives it</label><input id="agSugWho" type="text" maxlength="120"></div>' +
        '<div class="k-f"><label for="agSugEmail">Your email (optional)</label><input id="agSugEmail" type="email" maxlength="200" placeholder="Only if we have a question"></div>' +
        '<div class="k-f wide"><label for="agSugWhy">Why it belongs here</label><textarea id="agSugWhy" maxlength="1500"></textarea></div>' +
        '<div class="k-f wide"><button type="submit" class="dg-btn" id="agSugGo">Send my suggestion</button><p class="k-msg" id="agSugMsg" role="status"></p></div>' +
        '</form>';
    },
    'direct-action': function () {
      var forms = [
        ['direct', 'Marches', 'Thousands of people walking together through a city for the animals, like the Official Animal Rights March organized by Surge.'],
        ['sanctuary', 'Vigils', 'Gathering peacefully outside slaughterhouses to bear witness to the animals on their way in, and to share what is seen. The Save Movement is known for it.'],
        ['outreach', 'Protests and demonstrations', 'Peaceful public actions outside stores, restaurants, events or companies to draw attention to how animals are treated. Direct Action Everywhere and PETA are known for them.'],
        ['law', 'Campaigns that change companies', 'Organized pressure that gets companies to change how they treat animals, often in their supply chains. The Humane League and Mercy For Animals lead many of them.'],
        ['digital', 'Investigations', 'Footage from inside farms and slaughterhouses that shows the public what really happens there. Animal Equality and Mercy For Animals are known for their investigations.']
      ];
      var steps = [
        ['Go with a group', 'Direct action works best, and is safest, with experienced organizers. Join a group or an event before going on your own.'],
        ['Stay peaceful', 'The strongest actions are calm and respectful. Follow the organizers\' guidelines, and let the message speak.'],
        ['Know your rights', 'Learn the local rules on permits, sidewalks and private property before you go. Organizers usually share what you need to know.'],
        ['Take care of yourself', 'Bearing witness can be painful. Talk with your group afterwards, rest and come back when you are ready.']
      ];
      return crumb('Direct Action') + head('Direct action', 'Show Up Together', '') +
        '<div class="ag-sec"><h3>What is direct action?</h3>' +
        '<p class="ag-about">Direct action means showing up in public, peacefully and together, to make sure the animals are seen. It includes marches, vigils, protests and organized campaigns. Where outreach is one conversation at a time, direct action speaks to a whole street, a company or a city at once.</p></div>' +
        '<div class="ag-sec"><h3>The ways it is done</h3><ul class="ag-ways">' + forms.map(function (w) {
          return '<li><div class="ag-way"><span class="ag-ic"><svg viewBox="0 0 24 24" aria-hidden="true">' + IC[w[0]] + '</svg></span><span><b>' + esc(w[1]) + '</b><small>' + esc(w[2]) + '</small></span></div></li>';
        }).join('') + '</ul></div>' +
        '<div class="ag-sec"><h3>Before your first action</h3><ol class="ag-tl" style="--ag-c:#FF9EC4">' + steps.map(function (x) {
          return '<li class="ag-ev"><details open><summary><b>' + esc(x[0]) + '</b></summary><div class="ag-evb"><p>' + esc(x[1]) + '</p></div></details></li>';
        }).join('') + '</ol>' +
        '<div class="wg-gs-btns"><a class="dg-btn" href="/events?cat=activism">Activism events</a> <a class="dg-btn dg-ghost" href="/directory?tab=community&amp;sub=groups">Groups near me</a></div></div>' +
        '<div class="ag-sec"><h3>Who does it</h3><p class="ag-sub">Organizations known for direct action, in our Directory.</p><div id="agAct"><p class="ag-sub">Loading...</p></div></div>' +
        cta('Direct action', 'Not ready to march yet?', 'Start with a conversation. Street outreach is a gentle first step into activism.', ['Street outreach', '#/street-outreach']);
    },
    'street-outreach': function () {
      var forms = [
        ['outreach', 'The Cube of Truth', 'Volunteers in masks stand in a square holding screens that show footage from farms and slaughterhouses, while others talk with the people who stop to watch. Started by Anonymous for the Voiceless.'],
        ['teach', 'Tabling and leafleting', 'A table or a stack of leaflets on a busy street or campus, handing people something to read and answering their questions. Vegan Outreach is known for it.'],
        ['digital', 'Street conversations on camera', 'Talking with people on the street about why we treat some animals as friends and others as food, and sharing the conversations online. Earthling Ed and Joey Carbstrong are known for it.'],
        ['sanctuary', 'Food giveaways and tastings', 'Handing out free Vegan food so people can taste how easy it is, like Susan Hargreaves and the Veganza Animal Heroes giving away Vegan roasts before Thanksgiving.'],
        ['direct', 'Chalking and visual displays', 'Facts, art and messages in chalk or on boards where people walk by, often next to a team ready to talk.']
      ];
      var steps = [
        ['Find a group near you', 'Most outreach happens in teams. Joining one means training, support and people to learn from.'],
        ['Watch before you talk', 'Go to an event and stand with the team first. Listen to how experienced activists open a conversation.'],
        ['Learn the conversation', 'Ask questions, listen to the answers and help people reach their own conclusions. Arguing to win rarely changes a mind.'],
        ['Take care of yourself', 'Outreach can be heavy. Take breaks, lean on your team and remember that every conversation plants a seed.']
      ];
      return crumb('Street Outreach') + head('Street outreach', 'Start a Conversation', '') +
        '<div class="ag-sec"><h3>What is street outreach?</h3>' +
        '<p class="ag-about">Street outreach means talking with people face to face in public places, on sidewalks, campuses and at events, about how animals are treated and why so many people are choosing to go Vegan. It isn\'t shouting or shaming. The best outreach is a calm, honest conversation that leaves someone thinking.</p></div>' +
        '<div class="ag-sec"><h3>The ways it is done</h3><ul class="ag-ways">' + forms.map(function (w) {
          return '<li><div class="ag-way"><span class="ag-ic"><svg viewBox="0 0 24 24" aria-hidden="true">' + IC[w[0]] + '</svg></span><span><b>' + esc(w[1]) + '</b><small>' + esc(w[2]) + '</small></span></div></li>';
        }).join('') + '</ul></div>' +
        '<div class="ag-sec"><h3>How to get started</h3><ol class="ag-tl" style="--ag-c:#FF9EC4">' + steps.map(function (x) {
          return '<li class="ag-ev"><details open><summary><b>' + esc(x[0]) + '</b></summary><div class="ag-evb"><p>' + esc(x[1]) + '</p></div></details></li>';
        }).join('') + '</ol>' +
        '<div class="wg-gs-btns"><a class="dg-btn" href="/directory?tab=community&amp;sub=groups">Groups near me</a> <a class="dg-btn dg-ghost" href="/events?cat=activism">Activism events</a></div></div>' +
        '<div class="ag-sec"><h3>Who does it</h3><p class="ag-sub">Groups and people known for street outreach, in our Directory.</p><div id="agOut"><p class="ag-sub">Loading...</p></div></div>' +
        '<div class="ag-sec" id="agOutBooksSec" hidden><h3>Books</h3><p class="ag-sub">For learning the conversation.</p><div id="agOutBooks"></div></div>' +
        cta('Street outreach', 'Hear how the best do it.', 'Some of the most shared talks on Veganism come from people who learned on the street.', ['Talks That Changed Minds', '#/speeches']);
    },
    sanctuaries: function () {
      var ways = [
        ['sanctuary', 'Visit', 'Many sanctuaries host tours and open days. Meeting the animals face to face is often what changes a mind. Check each one\'s visiting hours before you go.'],
        ['teach', 'Volunteer', 'Sanctuaries and rescues run on helping hands: feeding, cleaning, building, driving, events and social media.'],
        ['outreach', 'Sponsor an animal', 'Many sanctuaries let you sponsor one resident, covering food and care, with news about the friend you are helping.'],
        ['law', 'Give', 'Food, vet bills and land cost money every day. A small monthly gift is what keeps most sanctuaries open.'],
        ['direct', 'Adopt or foster', 'Rescues find homes for animals, from dogs and cats to chickens and pigs. Fostering gives an animal a bridge to a forever home.'],
        ['digital', 'Share their stories', 'Follow your local sanctuary and share its rescues. Every share is a chance for someone to meet an animal as an individual.']
      ];
      return crumb('Sanctuaries and Rescue') + head('Sanctuaries and rescue', 'One Life at a Time', '') +
        '<p class="ag-about">A <b>sanctuary</b> is a forever home: animals rescued from farms and other places live out their natural lives there, cared for and never sold or used. A <b>rescue</b> saves animals in need and finds them new homes. Both welcome help.</p>' +
        '<div class="ag-sec"><h3>Find one near you</h3><p class="ag-sub">Our Directory lists sanctuaries and rescues across the country. Use Near me to see the closest.</p>' +
        '<div class="wg-gs-btns"><a class="dg-btn" href="/directory?tab=community&amp;sub=sanctuaries">Sanctuaries near me</a> <a class="dg-btn dg-ghost" href="/directory?tab=community&amp;sub=rescues">Rescues near me</a></div></div>' +
        '<div class="ag-sec"><h3>Ways to help</h3><ul class="ag-ways">' + ways.map(function (w) {
          return '<li><div class="ag-way"><span class="ag-ic"><svg viewBox="0 0 24 24" aria-hidden="true">' + IC[w[0]] + '</svg></span><span><b>' + esc(w[1]) + '</b><small>' + esc(w[2]) + '</small></span></div></li>';
        }).join('') + '</ul></div>' +
        '<div class="ag-sec"><h3>Vouch for a sanctuary</h3><p class="ag-sub">Sanctuaries in our Directory, by how many members vouch for them. Been to one, or support one? Vouch for it: one vouch per member.</p><div id="agSan"><p class="ag-sub">Loading...</p></div></div>' +
        '<div class="ag-sec"><h3>Vouch for a rescue</h3><p class="ag-sub">Rescues in our Directory, by how many members vouch for them. Adopted from one, or volunteered there? Vouch for it: one vouch per member.</p><div id="agRes"><p class="ag-sub">Loading...</p></div></div>' +
        cta('Sanctuaries and rescue', 'Know a sanctuary or rescue we are missing?', 'Tell us about it. Our team looks it up and checks it before it goes on the Directory.', ['Add a sanctuary or rescue', '#/sanctuaries']).replace('<a class="vxc-go" href="#/sanctuaries">', '<a class="vxc-go" href="#/sanctuaries" data-ve-listing-request role="button">');
    },
    history: function () {
      var H = window.VE_ACTIVISM_HISTORY || [];
      return crumb('History') + head('History', 'A History of the Vegan Movement', '') +
        '<p class="ag-about">From ancient teachers to today\'s activists, the people who decided animals matter. Pick an era to walk through it, and open any moment for the story.</p>' +
        '<ul class="ag-eras">' + H.map(function (e) {
          return '<li><a class="ag-era" href="#/history/' + e.k + '" style="background:' + e.color + '"><small>' + esc(e.range) + '</small><b>' + esc(e.label) + '</b><p>' + esc(e.blurb) + '</p><em>' + e.events.length + ' moments</em></a></li>';
        }).join('') + '</ul>' +
        '<p class="ag-credit">Started from the timeline in <i>Pre-Vegans</i> by Sean Russell, then researched and carried to today. History is still being written: tell us what to add.</p>' +
        cta('History', 'Know a moment we missed?', 'A person, a group, a law, a film or a first. Tell us and we will look into it.', ['Suggest a moment', '#/history/suggest']);
    },
    'history/suggest': function () {
      return crumb('History', 'Suggest a moment', '#/history') + head('History', 'Suggest a Moment', '') +
        '<p class="ag-about">What belongs in the history of the Vegan movement? Tell us what happened, when, and where we can read about it. We check every suggestion before it goes up.</p>' +
        '<form class="k-form" id="agHis" novalidate>' +
        '<div class="k-f wide"><label for="agHisWhat">What happened</label><input id="agHisWhat" type="text" maxlength="200" required></div>' +
        '<div class="k-f"><label for="agHisWhen">When</label><input id="agHisWhen" type="text" maxlength="60" placeholder="A year, or about when"></div>' +
        '<div class="k-f"><label for="agHisLink">Where to read about it (optional)</label><input id="agHisLink" type="url" maxlength="500" placeholder="https://"></div>' +
        '<div class="k-f wide"><label for="agHisWhy">Why it matters</label><textarea id="agHisWhy" maxlength="1500"></textarea></div>' +
        '<div class="k-f"><label for="agHisEmail">Your email (optional)</label><input id="agHisEmail" type="email" maxlength="200" placeholder="Only if we have a question"></div>' +
        '<div class="k-f wide"><button type="submit" class="dg-btn" id="agHisGo">Send my suggestion</button><p class="k-msg" id="agHisMsg" role="status"></p></div>' +
        '</form>';
    },
    'humane-education/zoe-weil': function () {
      return crumb('Humane Education', 'Zoe Weil') + head('Humane education', 'Teaching With Zoe Weil', '') +
        '<p class="ag-about">Zoe Weil is the co-founder of the Institute for Humane Education, which trains educators and changemakers to solve problems in ways that do the most good and least harm for people, animals and the environment. She is the author of <i>The Power and Promise of Humane Education</i>, and her TEDx talk <i>The World Becomes What We Teach</i> makes the case that what schools teach shapes the world students go on to build. The Institute offers graduate programs, free resources for teachers and its Solutionary Framework.</p>' +
        booksSec('agZoeBooks') +
        '<div class="ag-sec"><h3>Meet them</h3><p class="ag-sub">Zoe and the Institute for Humane Education in the Directory.</p><div id="agZoe"><p class="ag-sub">Their Directory pages are on the way.</p></div></div>' +
        cta('Humane education', 'Want to teach it yourself?', 'The Institute for Humane Education offers courses and resources for teachers and parents.', ['Visit the Institute', 'https://humaneeducation.org']);
    },
    'humane-education/james-wildman': function () {
      return crumb('Humane Education', 'James Wildman') + head('Humane education', 'Teaching With James Wildman', '') +
        '<p class="ag-about">James Wildman is a humane educator with the Animal Rights Foundation of Florida. He has worked there for more than 13 years, gives around 500 free presentations a year in schools, universities and communities, and has spoken to more than 100,000 people.</p>' +
        '<div class="ag-sec"><h3>Watch</h3><div class="ag-vids">' + vid(VIDS.interview) + vid(VIDS.talk) + '</div></div>' +
        booksSec('agJamesBooks') +
        '<div class="ag-sec"><h3>Meet them</h3><p class="ag-sub">James and his organization in the Directory.</p><div id="agJames"></div></div>' +
        cta('Humane education', 'Bring a talk like this to your school.', 'James gives free presentations in schools, universities and communities. Reach him through his page.', ['Bring a talk like this to your school', '/directory/james-wildman']);
    }
  };

  function eraView(k) {
    var H = window.VE_ACTIVISM_HISTORY || [], i = -1;
    for (var n = 0; n < H.length; n++) if (H[n].k === k) i = n;
    if (i < 0) return VIEWS.history();
    var e = H[i], prev = H[i - 1], next = H[i + 1];
    return crumb('History', e.label, '#/history') + head(e.range, e.label, '') +
      '<nav class="ag-eranav" aria-label="Eras">' + H.map(function (x) { return '<a href="#/history/' + x.k + '"' + (x.k === k ? ' aria-current="page"' : '') + '>' + esc(x.label) + '</a>'; }).join('') + '</nav>' +
      '<div class="ag-band" style="background:' + e.color + '"><small>' + esc(e.range) + '</small><p>' + esc(e.blurb) + '</p></div>' +
      '<ol class="ag-tl" style="--ag-c:' + e.color + '">' + e.events.map(function (v, m) {
        return '<li class="ag-ev"><details' + (m === 0 ? ' open' : '') + '><summary><span>' + esc(v.y) + '</span><b>' + esc(v.t) + '</b><i>Open</i></summary><div class="ag-evb"><p>' + esc(v.p) + '</p>' +
          (v.links && v.links.length ? '<div class="ag-chips">' + v.links.map(function (l) { return '<a href="/directory/' + esc(l[0]) + '">' + esc(l[1]) + '</a>'; }).join('') + '</div>' : '') +
          (v.t === 'Your chapter of the story' ? '<div class="ag-chips"><a href="#/history/suggest">Suggest a moment</a><a href="/communities">Find your community</a></div>' : '') + '</div></details></li>';
      }).join('') + '</ol>' +
      '<div class="ag-eranext">' + (prev ? '<a class="dg-btn dg-ghost" href="#/history/' + prev.k + '">&larr; ' + esc(prev.label) + '</a>' : '<span></span>') +
      (next ? '<a class="dg-btn" href="#/history/' + next.k + '">' + esc(next.label) + ' &rarr;</a>' : '<a class="dg-btn" href="#/history/suggest">Suggest a moment</a>') + '</div>';
  }

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
    var t = step(curTab === 'speeches/suggest' ? 'speeches' : /^history\//.test(curTab) ? 'history' : curTab), i = STEPS.indexOf(t);
    bubble.textContent = t.say;
    var box = $('dgMaya'); box.innerHTML = ''; box.style.backgroundImage = "url('" + ART + t.art + ".jpg')";
    $('dgPlay').hidden = true;   // no recording yet: the Play button shows once Dani's lines are recorded
    tourEl.innerHTML = tourM.innerHTML = '<a class="dg-tnav" href="' + href(STEPS[Math.max(0, i - 1)].k) + '"' + (i ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Back</a><span>' + (i + 1) + ' of ' + STEPS.length + '</span>' +
      '<a class="dg-tnav next" href="' + href(STEPS[Math.min(STEPS.length - 1, i + 1)].k) + '"' + (i < STEPS.length - 1 ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Next</a>';
  }
  function route() {
    var k = (location.hash.replace(/^#\/?/, '') || 'overview').split('?')[0].replace(/\/+$/, '') || 'overview';
    var era = /^history\/[a-z-]+$/.test(k) && !VIEWS[k];
    if (!VIEWS[k] && !era) k = 'overview';
    curTab = k;
    main.innerHTML = era ? eraView(k.split('/')[1]) : VIEWS[k]();
    if (k === 'humane-education/james-wildman') loadCards(JAMES_NAMES, 'agJames', 'agJamesGrid');
    if (k === 'humane-education/zoe-weil') { loadCards(ZOE_NAMES, 'agZoe', 'agZoeGrid'); loadBooks('Zoe Weil', 'agZoeBooksSec', 'agZoeBooks', 'agZoeBooksGrid'); }
    if (k === 'humane-education/susan-hargreaves') loadBooks('Susan Hargreaves', 'agSusanBooksSec', 'agSusanBooks', 'agSusanBooksGrid');
    if (k === 'humane-education/james-wildman') loadBooks('James Wildman', 'agJamesBooksSec', 'agJamesBooks', 'agJamesBooksGrid');
    if (k === 'humane-education') { loadCards(MORE_EDU_NAMES, 'agMoreEdu', 'agMoreEduGrid'); loadBooks(['Susan Hargreaves', 'Zoe Weil', 'Ruby Roth'], 'agTeachBooksSec', 'agTeachBooks', 'agTeachBooksGrid'); }
    if (k === 'speeches') loadCards(SPEAKER_NAMES, 'agSpk', 'agSpkGrid');
    if (k === 'direct-action') loadCards(ACTION_NAMES, 'agAct', 'agActGrid');
    if (k === 'street-outreach') { loadCards(OUTREACH_NAMES, 'agOut', 'agOutGrid'); loadBooks(['Ed Winters'], 'agOutBooksSec', 'agOutBooks', 'agOutBooksGrid'); }
    if (k === 'sanctuaries') { loadTop('Sanctuaries', 'agSan', 'agSanGrid'); loadTop('Rescues', 'agRes', 'agResGrid'); }
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
  // Suggest a talk: to the team as a suggestion (ve-feedback, as the Guide's visitor suggestions are sent).
  document.addEventListener('submit', function (e) {
    if (!e.target || e.target.id !== 'agSug') return;
    e.preventDefault();
    var link = $('agSugLink').value.trim(), who = $('agSugWho').value.trim(), em = $('agSugEmail').value.trim(), why = $('agSugWhy').value.trim(), msg = $('agSugMsg'), go = $('agSugGo');
    if (!/^https?:\/\/\S+\.\S+/.test(link)) { msg.className = 'k-msg err'; msg.textContent = 'Add the talk\'s link, starting with https://'; return; }
    if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { msg.className = 'k-msg err'; msg.textContent = 'That email does not look right.'; return; }
    go.disabled = true; go.textContent = 'Sending...'; msg.className = 'k-msg'; msg.textContent = '';
    var vid = ''; try { vid = localStorage.getItem('ve_visitor') || ''; } catch (x) {}
    fetch(SB + '/functions/v1/ve-feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_url: location.href.split('#')[0] + '#/speeches', page_label: 'Talks That Changed Minds', kind: 'suggestion',
        message: 'Suggested talk for Talks That Changed Minds: ' + link + (who ? '\nWho gives it: ' + who : '') + (why ? '\nWhy: ' + why : ''),
        email: em, name: 'A visitor (via Dani, Suggest a talk)', visitor: vid, signed_in: false, viewport: innerWidth + 'x' + innerHeight }) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (x) {
        if (!x.ok || !x.d || !x.d.ok) throw x.d || {};
        $('agSug').outerHTML = '<p class="ag-about"><b>Thank you.</b> We have your suggestion and will watch it' + (em ? ', and we will write to ' + esc(em) + ' when it is added' : '') + '.</p><a class="dg-btn" href="#/speeches">Back to the talks</a>';
      })
      .catch(function (d) { go.disabled = false; go.textContent = 'Send my suggestion'; msg.className = 'k-msg err'; msg.textContent = d && d.error === 'daily_limit' ? 'You have sent a few already. Thank you, we have them.' : 'That did not go through. Try again in a moment.'; });
  });
  document.addEventListener('submit', function (e) {
    if (!e.target || e.target.id !== 'agHis') return;
    e.preventDefault();
    var what = $('agHisWhat').value.trim(), when = $('agHisWhen').value.trim(), link = $('agHisLink').value.trim(), why = $('agHisWhy').value.trim(), em = $('agHisEmail').value.trim(), msg = $('agHisMsg'), go = $('agHisGo');
    if (what.length < 3) { msg.className = 'k-msg err'; msg.textContent = 'Tell us what happened.'; return; }
    if (link && !/^https?:\/\/\S+\.\S+/.test(link)) { msg.className = 'k-msg err'; msg.textContent = 'The link should start with https://'; return; }
    if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { msg.className = 'k-msg err'; msg.textContent = 'That email does not look right.'; return; }
    go.disabled = true; go.textContent = 'Sending...'; msg.className = 'k-msg'; msg.textContent = '';
    var vid = ''; try { vid = localStorage.getItem('ve_visitor') || ''; } catch (x) {}
    fetch(SB + '/functions/v1/ve-feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_url: location.href.split('#')[0] + '#/history', page_label: 'A History of the Vegan Movement', kind: 'suggestion',
        message: 'Suggested moment for the History of the Vegan Movement: ' + what + (when ? '\nWhen: ' + when : '') + (link ? '\nSource: ' + link : '') + (why ? '\nWhy: ' + why : ''),
        email: em, name: 'A visitor (via Dani, Suggest a moment)', visitor: vid, signed_in: false, viewport: innerWidth + 'x' + innerHeight }) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (x) {
        if (!x.ok || !x.d || !x.d.ok) throw x.d || {};
        $('agHis').outerHTML = '<p class="ag-about"><b>Thank you.</b> We have your suggestion and will look into it' + (em ? '. If we have a question, we will write to ' + esc(em) : '') + '.</p><a class="dg-btn" href="#/history">Back to the history</a>';
      })
      .catch(function (d) { go.disabled = false; go.textContent = 'Send my suggestion'; msg.className = 'k-msg err'; msg.textContent = d && d.error === 'daily_limit' ? 'You have sent a few already. Thank you, we have them.' : 'That did not go through. Try again in a moment.'; });
  });
  if (window.VERegionDirectory) VERegionDirectory.css();   // the Directory card's own styles
  window.addEventListener('hashchange', route);
  tourM.addEventListener('click', function (e) { if (e.target.closest('.dg-tnav')) setTimeout(function () { railEl.scrollIntoView({ block: 'start' }); }, 0); });
  route();
})();
