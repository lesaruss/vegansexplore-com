/* Daily Pulse topics (Sean, 2026-10-04, playbook ve-daily-pulse-discussion).
   The Pulse is a lane of the Community Board: one topic a day per city plus one national topic,
   each a short intro, one question and a link to the source. This file is the one way the rest of
   the site shows topics (dashboard, city hubs), so a topic card looks the same everywhere. The
   Board itself (/pulse, the Daily Pulse tab) is where the conversation happens.

     VEPulse.fetch(community, limit)  -> Promise<topics>   newest first, city + national
     VEPulse.card(topic, community)   -> HTML for one card (links to the conversation)
     VEPulse.isToday(topic)           -> published in the last 24 hours
     VEPulse.link(topic, community)   -> /pulse?city=...&post=...
     VEPulse.briefing(topic)          -> HTML for the full briefing (stories, heads up, today's move)
     VEPulse.hydrate(el)              -> swap the briefing's lists for Directory cards and the episode row
     VEPulse.summary(topic)           -> one line: "5 stories · 2 events · Today's move: ..."

   A topic is a city briefing (Sean, 2026-10-04: lead the movement, not trivia): an opening, the
   stories people are talking about, upcoming events, one action, and the question.

   Every summary on a card is capped at two rows (CLAUDE.md, summary two-row cap): .vep-intro. */
(function () {
  if (window.VEPulse) return;
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-board';
  var DAY = 24 * 60 * 60 * 1000;

  var css = [
    '.vep-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;}',
    '@media (max-width:760px){.vep-grid{grid-template-columns:minmax(0,1fr);}}',
    '.vep-card{display:flex;flex-direction:column;gap:8px;text-align:left;background:#fff;border:1.5px solid rgba(0,0,0,0.12);border-radius:14px;padding:16px 18px;color:#1a1a1a;text-decoration:none;font-family:inherit;min-width:0;}',
    '.vep-card:hover{border-color:#595959;}',
    '.vep-card:focus-visible{outline:2px solid #1a1a1a;outline-offset:2px;}',
    '.vep-tags{display:flex;flex-wrap:wrap;gap:6px;}',
    '.vep-tag{font-size:10.5px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;border-radius:6px;padding:3px 8px;background:#e8f5e9;color:#1f5f22;}',
    '.vep-tag.today{background:#1f5f22;color:#fff;}',
    '.vep-tag.national{background:#efefef;color:#3d3d3d;}',
    '.vep-title{font-size:16px;font-weight:800;line-height:1.3;}',
    '.vep-intro{font-size:13.5px;line-height:1.55;color:rgba(26,26,26,0.78);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
    '.vep-question{font-size:14px;font-weight:700;line-height:1.45;color:#1f5f22;}',
    '.vep-meta{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:12px;color:#595959;margin-top:auto;padding-top:4px;}',
    '.vep-meta strong{color:#1a1a1a;font-weight:700;}',
    '.vep-sum{font-size:12px;font-weight:700;color:#7d4a00;}',
    '.vep-brief{margin-top:16px;display:grid;gap:16px;}',
    '.vep-brief h4{font-size:11px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;color:#595959;margin:0 0 8px;}',
    '.vep-brief ol,.vep-brief ul{list-style:none;margin:0;padding:0;display:grid;gap:10px;}',
    '.vep-brief li{border-left:3px solid #cfe8d0;padding:2px 0 2px 12px;}',
    '.vep-brief li a{color:#1a1a1a;font-weight:800;text-decoration:none;}',
    '.vep-brief li a:hover{text-decoration:underline;}',
    '.vep-brief .vep-take{display:block;font-size:14px;line-height:1.55;color:rgba(26,26,26,0.78);margin-top:2px;}',
    '.vep-brief .vep-src{display:block;font-size:12px;color:#595959;margin-top:2px;}',
    '.vep-brief .vep-ev li{border-left-color:#F69820;}',
    '.vep-house{background:#f4f9f4;border:1px solid #d6ead7;border-radius:12px;padding:16px 18px;display:grid;gap:14px;}',
    '.vep-house h5{font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#1f5f22;margin:0 0 6px;}',
    '.vep-house li{border-left-color:#9fd3a2;}',
    '.vep-house .vep-more{font-size:13px;font-weight:800;color:#1f5f22;text-decoration:none;}',
    '.vep-house .vep-cards1 .rank-grid{grid-template-columns:minmax(0,420px)!important;}',
    '.vep-house>div,.vep-strip-wrap{min-width:0;}',
    '.vep-house .vep-strip{display:grid!important;grid-auto-flow:column;grid-template-columns:none!important;grid-auto-columns:320px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:8px;gap:12px;justify-content:start;}',
    '.vep-house .vep-strip>.rank-card,.vep-house .vep-strip>.vep-seeall{height:132px;min-height:0;box-sizing:border-box;}',
    '.vep-house .vep-strip .rank-name{-webkit-line-clamp:2;}',
    '.vep-house .vep-strip>*{scroll-snap-align:start;}',
    '.vep-seeall{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:6px;border:1.5px dashed #9fd3a2;border-radius:12px;background:#fff;color:#1f5f22;font-weight:800;text-decoration:none;padding:18px;text-align:center;min-height:120px;}',
    '.vep-seeall b{font-size:30px;line-height:1;}',
    '.vep-house .vep-epbox{background:#fff;border-radius:12px;}',
    '@media (max-width:560px){.vep-house .vep-strip{grid-auto-columns:84%;}.vep-house .vep-cards1 .rank-grid{grid-template-columns:minmax(0,1fr)!important;}}',
    '.vep-brief li.vep-pic{display:grid;grid-template-columns:132px minmax(0,1fr);gap:14px;align-items:start;border-left:0;padding:0;}',
    '.vep-pic>a{display:block;}',
    '.vep-pic .vep-img{display:block;width:132px;height:99px;border-radius:10px;background:#eef3ee center/cover no-repeat;}',
    '.vep-pic .vep-noimg{background:#eef3ee url("/public/ve-logo-mark.svg") center/38% no-repeat;opacity:.55;}',
    '@media (max-width:560px){.vep-brief li.vep-pic{grid-template-columns:96px minmax(0,1fr);gap:12px;}.vep-pic .vep-img{width:96px;height:72px;}}',
    '.vep-news{display:grid;gap:18px;}',
    '.vep-grp h5,.vep-brief .vep-news h5{font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#1f5f22;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid #e3efe3;}',
    '.vep-brief .vep-ev li{display:flex;gap:14px;align-items:stretch;border-left:0;padding:0;}',
    '.vep-date{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:64px;padding:8px 10px;border-radius:10px;background:var(--vb-soft,#e8f5e9);flex-shrink:0;text-align:center;}',
    '.vep-day{font-size:24px;font-weight:900;letter-spacing:-.03em;line-height:1;color:var(--vb-go,#2d7d31);}',
    '.vep-mon{font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--vb-go-hover,#1f5f22);margin-top:3px;}',
    '.vep-house .vep-tile{text-decoration:none;color:inherit;}',
    '.vep-house .vep-bav{width:60px;height:60px;min-width:60px;border-radius:10px;background:#fff3e3;color:#b25f00;display:flex;align-items:center;justify-content:center;}',
    '.vep-house .vep-tmeta{line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
    '.vep-house .vep-tile .vote-btn{display:inline-block;}',
    '.vep-house .vep-play{display:inline-flex;align-items:center;gap:4px;}',
    '.vep-bday{display:grid;grid-template-columns:52px minmax(0,1fr);gap:14px;align-items:center;background:#fff;border:1.5px solid #F69820;border-radius:12px;padding:14px 16px;}',
    '.vep-bday .vep-bico{width:52px;height:52px;border-radius:10px;background:#fff3e3;display:flex;align-items:center;justify-content:center;color:#b25f00;}',
    '.vep-bday b{display:block;font-size:16px;line-height:1.3;color:#1a1a1a;}',
    '.vep-bday .vep-src{margin-top:2px;}',
    '.vep-bday .vep-bacts{display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:10px;align-items:center;}',
    '.vep-bday .vep-bgo{display:inline-flex;align-items:center;min-height:40px;padding:8px 16px;border-radius:6px;background:#1f5f22;color:#fff;font-weight:800;text-decoration:none;font-size:14px;}',
    '.vep-move{background:#1f5f22;color:#fff;border-radius:12px;padding:16px 18px;}',
    '.vep-move h4{color:#cfe8d0;}',
    '.vep-move strong{display:block;font-size:17px;line-height:1.3;}',
    '.vep-move p{font-size:14px;line-height:1.55;margin:4px 0 12px;color:#eaf7ea;}',
    '.vep-move a{display:inline-flex;align-items:center;min-height:44px;padding:10px 18px;border-radius:10px;background:#fff;color:#1f5f22;font-weight:800;text-decoration:none;}',
    '.vep-move a:focus-visible{outline:3px solid #F69820;outline-offset:2px;}',
    '.vep-empty{border:1.5px dashed rgba(0,0,0,0.12);border-radius:14px;padding:22px 18px;font-size:14px;line-height:1.55;color:rgba(26,26,26,0.78);}',
    '.vep-empty strong{display:block;color:#1a1a1a;margin-bottom:4px;}'
  ].join('');
  var st = document.createElement('style'); st.id = 'vep-style'; st.textContent = css; document.head.appendChild(st);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function isToday(t) { return !!t.published_at && Date.now() - new Date(t.published_at).getTime() < DAY; }
  function link(t, community) {
    return '/pulse?city=' + encodeURIComponent(community || (t.community !== 'national' ? t.community : 'south-florida')) + '&post=' + encodeURIComponent(t.id);
  }
  function when(t) {
    if (isToday(t)) return 'Today';
    return new Date(t.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  function safe(u) { u = String(u || ''); return /^https?:\/\//i.test(u) || /^\/(?!\/)/.test(u) ? u : ''; }
  function slugOf(u) { var m = String(u || '').match(/^\/directory\/([a-z0-9-]+)/); return m ? m[1] : ''; }
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  function loadScript(src, ok) {
    if (ok()) return Promise.resolve();
    return new Promise(function (res) { var sc = document.createElement('script'); sc.src = src; sc.onload = res; sc.onerror = res; document.head.appendChild(sc); });
  }
  // Swap the briefing's text lists for the Directory's cards (with Vote) and the episode's playable row. Anything that fails stays as text.
  function hydrate(root) {
    if (!root) return;
    var boxes = root.querySelectorAll('[data-vep-cards]');
    if (boxes.length) loadScript('/public/ve-region-directory.js', function () { return !!window.VERegionDirectory; }).then(function () {
      if (!window.VERegionDirectory) return;
      VERegionDirectory.css();
      return new Promise(function (res) { VERegionDirectory.admin ? VERegionDirectory.admin(res) : res(); });
    }).then(function () {
      if (!window.VERegionDirectory) return;
      var all = [];
      Array.prototype.forEach.call(boxes, function (b) { b.getAttribute('data-vep-cards').split(',').forEach(function (x) { if (x && all.indexOf(x) < 0) all.push(x); }); });
      if (!all.length) return;
      fetch(SB + '/rest/v1/listings?status=eq.approved&slug=in.(' + all.map(encodeURIComponent).join(',') + ')&select=' + encodeURIComponent(VERegionDirectory.FIELDS),
        { headers: { apikey: ANON, Authorization: 'Bearer ' + ANON } })
        .then(function (r) { return r.ok ? r.json() : []; }).then(function (rows) {
          var by = {}; (rows || []).forEach(function (r) { by[r.slug] = r; });
          Array.prototype.forEach.call(boxes, function (b) {
            var list = b.getAttribute('data-vep-cards').split(',').map(function (x) { return by[x]; }).filter(Boolean);
            if (!list.length) return;
            var strip = b.hasAttribute('data-vep-strip'), n = Number(b.getAttribute('data-more-n') || 0), more = b.getAttribute('data-more-url') || '';
            var html = list.map(function (r, i) { return VERegionDirectory.card(r, i); }).join('');
            if (strip && n > list.length && more) html += '<a class="vep-seeall" href="' + esc(more) + '" target="_top"><b>+' + (n - list.length) + '</b>See all ' + n + ' new places</a>';
            b.innerHTML = '<div class="vrd-root"><div class="rank-grid' + (strip ? ' vep-strip' : '') + '">' + html + '</div></div>';
            if (strip) { var p = b.parentNode && b.parentNode.querySelector(':scope > p'); if (p && n > list.length) p.remove(); }
            VERegionDirectory.wire(b);
          });
        }).catch(function () {});
    });
    var eb = root.querySelector('[data-vep-ep]');
    if (eb) {
      var q; try { q = new URL(eb.getAttribute('data-vep-ep'), location.origin).searchParams; } catch (e) { return; }
      var slug = q.get('show') || '', guid = q.get('ep') || '';
      if (!/^[a-z0-9-]+$/.test(slug) || !guid) return;
      loadScript('/public/ve-episodes.js', function () { return !!window.VEEpisodes; }).then(function () {
        if (!window.VEEpisodes) return;
        var h = { 'Content-Type': 'application/json' };
        try { var tok = localStorage.getItem('ve_token'); if (tok) h.Authorization = 'Bearer ' + tok; } catch (e) {}
        return Promise.all([
          fetch(SB + '/rest/v1/listings?select=id,slug,name,logo_url&status=eq.approved&slug=eq.' + encodeURIComponent(slug) + '&limit=1', { headers: { apikey: ANON, Authorization: 'Bearer ' + ANON } }).then(function (r) { return r.json(); }),
          fetch(SB + '/functions/v1/ve-podcast', { method: 'POST', headers: h, body: JSON.stringify({ action: 'episode', slug: slug, guid: guid }) }).then(function (r) { return r.json(); })
        ]).then(function (r) {
          var l = r[0] && r[0][0], d = r[1];
          if (!l || !d || !d.ok || !d.episode) return;
          var show = { id: l.id, name: l.name, slug: l.slug, image: l.logo_url || (d.show && d.show.image) || '' };
          var ep = Object.assign({}, d.episode, { image: show.image || d.episode.image || '' });
          VEEpisodes.css();
          // The episode in the Directory card's frame (Sean, 2026-11-09: the same tile size for everything): the show's picture, the episode,
          // the show, and on the right Play over Save (the episode's own save, ve-podcast).
          var img = show.image ? '<img class="vrd-logo" src="' + esc(show.image) + '" alt="" style="width:60px;height:60px;min-width:60px;object-fit:cover;border-radius:10px">' : '<div class="av vep-bav">' + TARGET + '</div>';
          var epHref = '/directory/' + encodeURIComponent(show.slug) + '?ep=' + encodeURIComponent(ep.guid);
          eb.innerHTML = '<div class="vrd-root"><div class="rank-grid vep-strip"><a class="rank-card vep-tile" href="' + esc(epHref) + '" target="_top">' + img +
            '<div class="rank-info"><div class="rank-name">' + esc(ep.title) + '</div><div class="rank-meta vep-tmeta">' + esc(show.name) + '</div><div class="rank-subcat">Episode</div></div>' +
            '<div class="rank-right">' + (ep.audio ? '<button type="button" class="vote-btn" data-vep-play>Play</button>' : '') +
            '<button type="button" class="vrd-save' + (d.saved ? ' on' : '') + '" data-vep-save="' + esc(l.id + '|' + ep.guid) + '">' + (d.saved ? 'Saved' : 'Save') + '</button></div></a></div></div>';
          eb.addEventListener('click', function (e) {
            var b = e.target.closest('[data-vep-play]');
            if (b) { e.preventDefault(); e.stopPropagation(); VEEpisodes.play(ep, show); return; }
            var s2 = e.target.closest('[data-vep-save]');
            if (s2) { e.preventDefault(); e.stopPropagation(); VEEpisodes.save(l.id, ep.guid, s2).then(function (on) { if (on == null) return; s2.classList.toggle('on', !!on); s2.textContent = on ? 'Saved' : 'Save'; }); }
          });
        });
      }).catch(function () {});
    }
  }
  function summary(t) {
    var b = t.briefing || {}, bits = [];
    var s = (b.stories || []).length, e = (b.events || []).length;
    if (s) bits.push(s + (s === 1 ? ' story' : ' stories'));
    if (e) bits.push(e + (e === 1 ? ' event' : ' events'));
    if (b.action && b.action.title) bits.push('Today\'s move: ' + b.action.title);
    return bits.join(' \u00b7 ');
  }
  // Story topics, in the order the Pulse shows them (the writer's briefing.stories[n].topic; keep in step with pulse_topic_write).
  var TOPICS = [['food', 'Food and drink'], ['animals', 'For the animals'], ['health', 'Health'], ['community', 'Community'], ['business', 'Business'], ['culture', 'Film, books and media']];
  var TOPIC_NAMES = {}; TOPICS.forEach(function (x) { TOPIC_NAMES[x[0]] = x[1]; });
  var MONS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  // "Sun, Nov 8, 1 pm" -> {day: 8, mon: 'Nov', full: 'Sun, Nov 8', raw}
  function dateParts(w) {
    var m = String(w || '').match(/^((?:[A-Za-z]{3,9},?\s+)?)([A-Za-z]{3,9})\.?\s+(\d{1,2})\b/);
    if (!m || MONS.indexOf(m[2].slice(0, 3).toLowerCase()) < 0) return null;
    var mon = m[2].slice(0, 1).toUpperCase() + m[2].slice(1, 3).toLowerCase();
    return { day: m[3], mon: mon, full: (m[1] ? m[1].trim().replace(/,$/, '') + ', ' : '') + mon + ' ' + m[3], raw: m[0] };
  }
  var TARGET = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>';
  // A bounty in the Directory card's frame: the picture square, the name, what it is, and on the right its points over the button.
  function bountyTile(x) {
    var u = safe(x.url);
    var meta = x.line ? esc(x.line) : esc([x.count > 1 ? x.count + ' jobs open' : '1 job open', x.remote ? 'do it from home' : ''].filter(Boolean).join(' · '));
    return '<a class="rank-card vep-tile" href="' + esc(u) + '" target="_top">' +
      '<div class="av vep-bav">' + TARGET + '</div>' +
      '<div class="rank-info"><div class="rank-name">' + esc(x.title) + '</div><div class="rank-meta vep-tmeta">' + meta + '</div><div class="rank-subcat">Bounty</div></div>' +
      '<div class="rank-right">' + (x.points ? '<span class="vote-count">' + Number(x.points).toLocaleString() + '</span><span class="vote-label">points</span>' : '') + '<span class="vote-btn">See jobs</span></div></a>';
  }
  // The briefing's lists
  // The full briefing, for the conversation view. Story and event links open the original; the
  // action can point inside the site.
  function briefing(t) {
    var b = t.briefing; if (!b) return '';
    var out = '<div class="vep-brief">';
    // Stories (Sean, 2026-11-09): every story is the same small row with its picture on the left (no big lead), grouped under plain eyebrows:
    // the city's own first ("In South Florida"), then by topic (briefing.stories[n].topic, written by the Pulse writer). Never "national" or
    // "international": Vegans Explore serves the Vegan community everywhere. A story that links to our bounties shows as a bounty tile below.
    var isPic = function (x) { return /^https:\/\/fwbhwfxpncrsfhttimna\.supabase\.co\/storage\/v1\/object\/public\/vegan-media\/media\/pulse\/stories\//.test(String(x.image || '')); };
    var story = function (x) {
      var u = safe(x.url), im = isPic(x) ? x.image : '';
      var head = (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(x.title) + '</a>' : '<strong>' + esc(x.title) + '</strong>') +
        (x.take ? '<span class="vep-take">' + esc(x.take) + '</span>' : '') + (x.source ? '<span class="vep-src">' + esc(x.source) + '</span>' : '');
      var pic = im ? '<span class="vep-img" role="img" aria-label="" style="background-image:url(&quot;' + esc(im) + '&quot;)"></span>' : '<span class="vep-img vep-noimg" aria-hidden="true"></span>';
      return '<li class="vep-pic">' + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true">' + pic + '</a>' : pic) + '<div>' + head + '</div></li>';
    };
    var isBounty = function (x) { return /^(https?:\/\/(www\.)?vegansexplore\.com)?\/bounties(\?|$)/.test(String(x.url || '')); };
    var all = (b.stories || []), bountyStories = all.filter(isBounty), rest = all.filter(function (x) { return !isBounty(x); });
    var groups = [['local', 'In ' + placeName(t.community)]].concat(TOPICS), byKey = {};
    rest.forEach(function (x) {
      var k = (!x.national && !x.feature_id) ? 'local' : (TOPIC_NAMES[x.topic] ? x.topic : 'more');
      (byKey[k] = byKey[k] || []).push(x);
    });
    var sec = groups.concat([['more', 'More news']]).filter(function (g) { return (byKey[g[0]] || []).length; }).map(function (g) {
      return '<div class="vep-grp"><h5>' + esc(g[1]) + '</h5><ol>' + byKey[g[0]].map(story).join('') + '</ol></div>';
    }).join('');
    if (sec) out += '<section class="vep-news"><h4>Top news</h4>' + sec + '</section>';
    // Heads up (Sean, 2026-11-09): events wear the calendar's date tile on the left of the line.
    if ((b.events || []).length) {
      out += '<section><h4>Heads up</h4><ul class="vep-ev">' + b.events.map(function (x) {
        var u = safe(x.url), d = dateParts(x.when), rest2 = d ? String(x.when).replace(d.raw, '').replace(/^[\s,·-]+|[\s,·-]+$/g, '') : x.when;
        return '<li>' + (d ? '<span class="vep-date" aria-hidden="true"><span class="vep-day">' + esc(d.day) + '</span><span class="vep-mon">' + esc(d.mon) + '</span></span>' : '<span class="vep-date" aria-hidden="true"><span class="vep-mon">Soon</span></span>') +
          '<div>' + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(x.title) + '</a>' : '<strong>' + esc(x.title) + '</strong>') +
          '<span class="vep-take">' + esc([d ? d.full + (rest2 ? ', ' + rest2 : '') : rest2, x.where].filter(Boolean).join(' · ')) + '</span></div></li>';
      }).join('') + '</ul></section>';
    }
    // From Vegans Explore (Sean, 2026-11-01: "intermix some of our content"). Since 2026-11-09 (Sean: "We have these tiles that are all different
    // sizes. Let's keep them the same size for everything... keep it looking exactly the same as it is in the directory listing") every item is the
    // Directory's own card, in a row that slides sideways, one width for all: Spotlight, Bounties of the day, New in the Directory, Listen.
    // briefing() writes text with data-vep-* markers; hydrate(root) swaps in the cards.
    var h = b.house;
    if (h || bountyStories.length) {
      h = h || {};
      var our = function (u, label) { u = safe(u); return u ? '<a href="' + esc(u) + '" target="_top">' + esc(label) + '</a>' : '<strong>' + esc(label) + '</strong>'; };
      var cut = function (x) { x = String(x || ''); return x.length > 210 ? x.slice(0, 210).replace(/\s+\S*$/, '') + '...' : x; };
      var parts = [];
      if (h.spotlight) parts.push('<div><h5>Spotlight</h5>' + (h.spotlight.line ? '<p class="vep-take" style="margin:0 0 10px">' + esc(cut(h.spotlight.line)) + '</p>' : '') +
        '<div class="vep-strip-wrap" data-vep-cards="' + esc(slugOf(h.spotlight.url)) + '" data-vep-strip="1"><ul><li>' + our(h.spotlight.url, h.spotlight.name) + '<span class="vep-src">' + esc([h.spotlight.kind, h.spotlight.city].filter(Boolean).join(' · ')) + '</span></li></ul></div></div>');
      var bl = bountyStories.map(function (x) { return { title: x.title, line: x.take, url: x.url, feature: true }; })
        .concat((h.bounties_day || (h.bounty_day ? [h.bounty_day] : [])).filter(function (x) { return x && x.title; }));
      if (bl.length) {
        var ball = safe(h.bounties_all_url || (h.bounty_day && h.bounty_day.all_url) || '/bounties?community=' + t.community);
        parts.push('<div><h5>Bounties of the day</h5><div class="vrd-root"><div class="rank-grid vep-strip">' + bl.map(bountyTile).join('') +
          (ball ? '<a class="vep-seeall" href="' + esc(ball) + '" target="_top"><b>+</b>See all bounties</a>' : '') + '</div></div></div>');
      }
      if ((h.new_listings || []).length) parts.push('<div><h5>New in the Directory' + (h.new_count > 1 ? ' · ' + h.new_count + ' places' : '') + '</h5>' +
        '<div class="vep-strip-wrap" data-vep-cards="' + esc(h.new_listings.map(function (x) { return slugOf(x.url); }).filter(Boolean).join(',')) + '" data-vep-strip="1" data-more-n="' + Number(h.new_count || 0) + '" data-more-url="' + esc(safe(h.new_url)) + '"><ul>' + h.new_listings.map(function (x) {
        return '<li>' + our(x.url, x.name) + '<span class="vep-src">' + esc([x.kind, x.city].filter(Boolean).join(' · ')) + '</span></li>'; }).join('') + '</ul></div>' +
        (h.new_count > h.new_listings.length ? '<p style="margin:8px 0 0"><a class="vep-more" href="' + esc(safe(h.new_url)) + '" target="_top">See all ' + h.new_count + ' new places</a></p>' : '') + '</div>');
      if (h.episode) parts.push('<div><h5>Listen</h5><div class="vep-dock" data-vep-always></div>' + (h.episode.summary ? '<p class="vep-take" style="margin:0 0 10px">' + esc(cut(h.episode.summary)) + '</p>' : '') +
        '<div class="vep-epbox" data-vep-ep="' + esc(safe(h.episode.url)) + '"><ul><li>' + our(h.episode.url, h.episode.title) + '<span class="vep-src">' + esc(h.episode.show) + '</span></li></ul></div></div>');
      if (h.ask && h.ask.title) parts.push('<div><h5>' + esc(h.ask.title) + '</h5><p style="font-size:14px;line-height:1.55;margin:0 0 6px">' + esc(h.ask.text) + '</p><a class="vep-more" href="' + esc(safe(h.ask.url)) + '" target="_top">' + esc(h.ask.label || 'Tell us') + '</a></div>');
      if (parts.length) out += '<section class="vep-house"><h4>From Vegans Explore</h4>' + parts.join('') + '</section>';
    }
    if (b.action && b.action.title) {
      var au = safe(b.action.url), ext = /^https?:/i.test(au);
      out += '<section class="vep-move"><h4>Today\'s move</h4><strong>' + esc(b.action.title) + '</strong>' +
        (b.action.text ? '<p>' + esc(b.action.text) + '</p>' : '') +
        (au ? '<a href="' + esc(au) + '"' + (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + esc(b.action.label || 'Take action') + '</a>' : '') + '</section>';
    }
    return out + '</div>';
  }
  // Sean, 2026-10-31: the city is the tag, so the title is only the news; older "South Florida Pulse: ..." titles lose it here.
  function placeName(slug) { var h = (window.VE_HUBS || []).filter(function (x) { return x.slug === slug; })[0]; return h ? h.name : 'Local'; }
  function cleanTitle(s) { return String(s || '').replace(/^[A-Za-z.,' ]{2,40} Pulse:\s*/, ''); }
  function card(t, community) {
    var n = t.reply_count || 0, sum = summary(t);
    return '<a class="vep-card" href="' + link(t, community) + '" data-frame-label="Daily Pulse">' +
      '<div class="vep-tags">' + (isToday(t) ? '<span class="vep-tag today">Today</span>' : '') +
        '<span class="vep-tag' + (t.community === 'national' ? ' national">National' : '">' + esc(placeName(t.community))) + '</span></div>' +
      '<div class="vep-title">' + esc(cleanTitle(t.title)) + '</div>' +
      '<div class="vep-intro">' + esc(t.body) + '</div>' +
      (sum ? '<div class="vep-sum">' + esc(sum) + '</div>' : '') +
      (t.question ? '<div class="vep-question">' + esc(t.question) + '</div>' : '') +
      '<div class="vep-meta">' + (t.source_name && !sum ? '<span>Source: <strong>' + esc(t.source_name) + '</strong></span>' : '') + '<span>' + esc(when(t)) + '</span>' +
        '<span>' + n + (n === 1 ? ' reply' : ' replies') + '</span></div></a>';
  }
  function fetchTopics(community, limit) {
    var h = { 'Content-Type': 'application/json' };
    try { var tok = window.VEAuth && VEAuth.getToken ? VEAuth.getToken() : localStorage.getItem('ve_token'); if (tok) h.Authorization = 'Bearer ' + tok; } catch (e) {}
    return fetch(FN, { method: 'POST', headers: h, body: JSON.stringify({ action: 'list', lane: 'pulse', community: community }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { return (d.posts || []).slice(0, limit || 30); })
      .catch(function () { return []; });
  }
  // Today's pair for a city: its newest local topic and the newest national one.
  function todays(topics) {
    var local = null, national = null;
    topics.forEach(function (t) {
      if (t.community === 'national') { if (!national) national = t; } else if (!local) local = t;
    });
    return [local, national].filter(Boolean);
  }

  window.VEPulse = { fetch: fetchTopics, card: card, isToday: isToday, link: link, todays: todays, briefing: briefing, hydrate: hydrate, summary: summary };
})();
