/* The Vegan Activism Guide's shared material (2026-11-19, the Nonprofit Guide pass; Sean, 2026-11-17: "we created a lot of good resources...
 * we could borrow from the activist guide"). ONE source for both Guides, so they never drift:
 *   /guide-scripts/activism-guide.js   the Vegan Activism Guide (Dani), every part
 *   /guide-scripts/nonprofit-guide.js  the Nonprofit Guide's part The movement (Dani), read only
 * Load it before either script (the history timeline is its own shared file, /guide-scripts/activism-history.js, VE_ACTIVISM_HISTORY).
 * What lives here: the names each part looks up in the Directory, the ways to act, the educators, Talks That Changed Minds, the
 * videos, the episodes' audio, the campaigns query, the line icons, the styles (.ag-*) and the video card (YouTube loads only when pressed).
 * Change a talk, an educator or a list of names here and both Guides change together. Never copy these into a Guide script.
 */
(function () {
  if (window.VE_ACTIVISM) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // The people and organizations each part shows on the shared Directory card (slugs; a listing not yet approved simply does not show).
  // Found by name, so a listing shows as soon as it is approved, whatever slug it gets.
  var SUSAN_NAMES = ['Susan Hargreaves', 'Be an Animal Hero'];
  var JAMES_NAMES = ['James Wildman', 'Animal Rights Foundation of Florida'];
  var ZOE_NAMES = ['Zoe Weil', 'Institute for Humane Education'];
  // Street outreach (Sean, 2026-11-16: "Go ahead with street outreach"): the groups and people known for it that we list.
  // Direct action (Sean, 2026-11-16: "Go ahead with direct action"): groups known for it that we list (The Save Movement and Surge show once listed).
  var ACTION_NAMES = ['Direct Action Everywhere', 'Animal Save Movement', 'Surge', 'Animal Equality', 'Mercy For Animals', 'The Humane League', 'PETA'];
  // Legal and policy work (Sean, 2026-11-16: "Go ahead with legal and policy work"); ALDF and the Nonhuman Rights Project show once listed.
  var LAW_NAMES = ['Animal Legal Defense Fund', 'Nonhuman Rights Project', 'Physicians Committee for Responsible Medicine', 'Humane World for Animals', 'The Humane League', 'Mercy For Animals'];
  var SCHOOL_MILK_AUDIO = 'https://episodes.captivate.fm/episode/33c5126d-a2a4-4a20-8437-1a7fa327d191.mp3';
  // Digital activism (Sean, 2026-11-16: "Go ahead with digital activism").
  var DIGITAL_NAMES = ['Earthling Ed', 'Joey Carbstrong', 'Veganuary', 'Vegan Outreach', 'The Humane League', 'Faunalytics'];
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
    '.ag-camp{border:3px solid #1a1a1a;border-radius:10px;padding:16px;background:#FFF1B8;box-shadow:5px 5px 0 #1a1a1a;margin:6px 0 18px;}',
    '.ag-camp small{font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;}',
    '.ag-camp b{display:block;font-size:22px;font-weight:900;margin:6px 0;}',
    '.ag-camp p{margin:0 0 12px;font-size:15px;line-height:1.55;}',
    '.ag-acts{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr));gap:12px;}',
    '.ag-act{display:flex;flex-direction:column;gap:6px;border:2px solid #1a1a1a;border-radius:10px;padding:14px;background:#fff;}',
    '.ag-act b{font-size:16px;font-weight:900;}',
    '.ag-act small{font-size:14px;line-height:1.5;color:var(--ink75);}',
    '.ag-act a{align-self:flex-start;margin-top:6px;}',
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
    ['legal-policy', 'law', 'Legal and policy work', 'Changing laws, rules and the way companies and schools do things.'],
    ['sanctuaries', 'sanctuary', 'Sanctuaries and rescue', 'Giving animals a safe home for life, and showing visitors who they really are.'],
    ['digital-activism', 'digital', 'Digital activism', 'Videos, posts, petitions and campaigns that reach people where they scroll.']
  ];
  // The humane educators, each with their own page in the Activism Guide (#/humane-education/<key>): [key, name, organization, line].
  var EDUCATORS = [
    ['susan-hargreaves', 'Susan Hargreaves', 'Be an Animal Hero', 'More than 40 years in schools, children\'s books and the documentary The Heart Whisperer.'],
    ['james-wildman', 'James Wildman', 'Animal Rights Foundation of Florida', 'Around 500 free talks a year and the talk 101 Reasons to Go Vegan.'],
    ['zoe-weil', 'Zoe Weil', 'Institute for Humane Education', 'Co-founder of the Institute, which trains teachers to do the most good and least harm.']
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
  // The campaigns (ve_activism_campaigns; Logan adds and closes rows), the same query for both Guides.
  var CAMPAIGNS_PATH = '/rest/v1/ve_activism_campaigns?select=slug,title,orgs,people,summary,background,actions,hashtag,starts_on,ends_on,status,spotlight&order=spotlight.desc,starts_on.desc';
  // The Directory lookup by name (PostgREST or=(name.ilike.<name>,...)), so a listing shows as soon as it is approved, whatever slug it gets.
  function namesOr(names) { return names.map(function (n) { return 'name.ilike.' + encodeURIComponent(n.replace(/[,()*]/g, ' ')); }).join(','); }
  // The video card. opts.base: a page other than the Activism Guide passes '/guides/vegan-activism-guide' so the card's own
  // links into the Activism Guide (#/...) still land there.
  function video(v, opts) {
    var base = opts && opts.base ? opts.base : '';
    return '<article class="ag-vid"><div class="ag-yt" data-yt="' + esc(v.id) + '" style="background-image:url(&quot;https://i.ytimg.com/vi/' + esc(v.id) + '/hqdefault.jpg&quot;)">' +
      '<button type="button" aria-label="Watch: ' + esc(v.t) + '"><span><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6,4 20,12 6,20"></polygon></svg>Watch</span></button></div>' +
      '<div class="ag-vid-b"><div class="ag-vid-k">' + esc(v.k) + '</div><b>' + esc(v.t) + '</b><p>' + esc(v.p) + '</p><span class="ag-len">' + v.len.replace(/&(?!amp;)/g, '&amp;') + '</span>' + (base ? String(v.more || '').replace(/href="#\//g, 'href="' + base + '#/') : (v.more || '')) + '</div></article>';
  }
  // An era of the history (VE_ACTIVISM_HISTORY) as its tile. base: '' on the Activism Guide, A.GUIDE elsewhere.
  function eraTile(e, base) {
    return '<li><a class="ag-era" href="' + (base || '') + '#/history/' + e.k + '" style="background:' + e.color + '"><small>' + esc(e.range) + '</small><b>' + esc(e.label) + '</b><p>' + esc(e.blurb) + '</p><em>' + e.events.length + ' moments</em></a></li>';
  }
  // A video loads only when pressed (nothing plays until pressed), on any page that shows the card.
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.ag-yt button'); if (!b) return;
    var box = b.parentNode, id = box.getAttribute('data-yt');
    box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0" title="' + esc(b.getAttribute('aria-label')) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    try { if (window.gtag) gtag('event', 'video_start', { video_title: 'activism-' + id }); } catch (x) {}
  });
  window.VE_ACTIVISM = {
    GUIDE: '/guides/vegan-activism-guide',
    SUSAN_NAMES: SUSAN_NAMES, JAMES_NAMES: JAMES_NAMES, ZOE_NAMES: ZOE_NAMES, ACTION_NAMES: ACTION_NAMES, LAW_NAMES: LAW_NAMES,
    DIGITAL_NAMES: DIGITAL_NAMES, OUTREACH_NAMES: OUTREACH_NAMES, MORE_EDU_NAMES: MORE_EDU_NAMES, SPEAKER_NAMES: SPEAKER_NAMES,
    SCHOOL_MILK_AUDIO: SCHOOL_MILK_AUDIO, SUSAN_AUDIO: SUSAN_AUDIO,
    IC: IC, WAYS: WAYS, EDUCATORS: EDUCATORS, SPEECHES: SPEECHES, VIDS: VIDS,
    CAMPAIGNS_PATH: CAMPAIGNS_PATH, namesOr: namesOr, video: video, eraTile: eraTile, esc: esc
  };
})();
