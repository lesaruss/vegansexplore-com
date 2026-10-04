/* Daily Post topics (Sean, 2026-10-04, playbook ve-daily-pulse-discussion).
   The Daily Post is a lane of the Community Board: one topic a day per city plus one national topic,
   each a short intro, one question and a link to the source. This file is the one way the rest of
   the site shows topics (dashboard, city hubs), so a topic card looks the same everywhere. The
   Board itself (/board?lane=pulse) is where the conversation happens.

     VEPulse.fetch(community, limit)  -> Promise<topics>   newest first, city + national
     VEPulse.card(topic, community)   -> HTML for one card (links to the conversation)
     VEPulse.isToday(topic)           -> published in the last 24 hours
     VEPulse.link(topic, community)   -> /board?lane=pulse&community=...&post=...
     VEPulse.briefing(topic)          -> HTML for the full briefing (stories, heads up, today's move)
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
    return '/board?lane=pulse&community=' + encodeURIComponent(community || (t.community !== 'national' ? t.community : 'south-florida')) + '&post=' + encodeURIComponent(t.id);
  }
  function when(t) {
    if (isToday(t)) return 'Today';
    return new Date(t.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  function safe(u) { u = String(u || ''); return /^https?:\/\//i.test(u) || /^\/(?!\/)/.test(u) ? u : ''; }
  function summary(t) {
    var b = t.briefing || {}, bits = [];
    var s = (b.stories || []).length, e = (b.events || []).length;
    if (s) bits.push(s + (s === 1 ? ' story' : ' stories'));
    if (e) bits.push(e + (e === 1 ? ' event' : ' events'));
    if (b.action && b.action.title) bits.push('Today\'s move: ' + b.action.title);
    return bits.join(' \u00b7 ');
  }
  // The full briefing, for the conversation view. Story and event links open the original; the
  // action can point inside the site.
  function briefing(t) {
    var b = t.briefing; if (!b) return '';
    var out = '<div class="vep-brief">';
    if ((b.stories || []).length) {
      out += '<section><h4>What people are talking about</h4><ol>' + b.stories.map(function (x) {
        var u = safe(x.url);
        return '<li>' + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(x.title) + '</a>' : '<strong>' + esc(x.title) + '</strong>') +
          (x.take ? '<span class="vep-take">' + esc(x.take) + '</span>' : '') + (x.source ? '<span class="vep-src">' + esc(x.source) + '</span>' : '') + '</li>';
      }).join('') + '</ol></section>';
    }
    if ((b.events || []).length) {
      out += '<section><h4>Heads up</h4><ul class="vep-ev">' + b.events.map(function (x) {
        var u = safe(x.url);
        return '<li>' + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(x.title) + '</a>' : '<strong>' + esc(x.title) + '</strong>') +
          '<span class="vep-take">' + esc([x.when, x.where].filter(Boolean).join(' \u00b7 ')) + '</span></li>';
      }).join('') + '</ul></section>';
    }
    if (b.action && b.action.title) {
      var au = safe(b.action.url), ext = /^https?:/i.test(au);
      out += '<section class="vep-move"><h4>Today\'s move</h4><strong>' + esc(b.action.title) + '</strong>' +
        (b.action.text ? '<p>' + esc(b.action.text) + '</p>' : '') +
        (au ? '<a href="' + esc(au) + '"' + (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + esc(b.action.label || 'Take action') + '</a>' : '') + '</section>';
    }
    return out + '</div>';
  }
  function card(t, community) {
    var n = t.reply_count || 0, sum = summary(t);
    return '<a class="vep-card" href="' + link(t, community) + '" data-frame-label="Daily Post">' +
      '<div class="vep-tags">' + (isToday(t) ? '<span class="vep-tag today">Today</span>' : '') +
        '<span class="vep-tag' + (t.community === 'national' ? ' national">National' : '">Local') + '</span></div>' +
      '<div class="vep-title">' + esc(t.title) + '</div>' +
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

  window.VEPulse = { fetch: fetchTopics, card: card, isToday: isToday, link: link, todays: todays, briefing: briefing, summary: summary };
})();
