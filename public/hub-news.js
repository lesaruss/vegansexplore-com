/* Shared "Local News & Updates" renderer for VE city hub pages.
   Merges community-submitted news (ve_community_news, approved) with
   Pulse articles manually tagged into this city (ve_pulse_city_tags -> ve_pulse_content),
   sorted pinned-first then newest-first. Usage:
     <div id="hub-news-grid"><p class="hub-dir-empty">Loading local news&hellip;</p></div>
     <script src="/public/hub-news.js"></script>
     <script>VEHubNews.render('hub-news-grid', 'new-york');</script>
*/
(function () {
  var SUPABASE_URL = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function headers() { return { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY }; }

  function fetchCommunityNews(city) {
    return fetch(SUPABASE_URL + '/rest/v1/ve_community_news?select=id,headline,summary,url,image_url,is_pinned,published_at,source_name&status=eq.approved&city_slug=eq.' + encodeURIComponent(city) + '&order=is_pinned.desc,published_at.desc&limit=12', { headers: headers() })
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        return (rows || []).map(function (n) {
          return {
            kind: 'community',
            headline: n.headline,
            summary: n.summary,
            url: n.url,
            image_url: n.image_url,
            is_pinned: !!n.is_pinned,
            published_at: n.published_at,
            source_name: n.source_name
          };
        });
      })
      .catch(function () { return []; });
  }

  function fetchPulseSpotlights(city) {
    return fetch(SUPABASE_URL + '/rest/v1/ve_pulse_city_tags?select=is_pinned,tagged_at,ve_pulse_content(title,slug,category,summary,thumbnail_url,published_at)&city_slug=eq.' + encodeURIComponent(city), { headers: headers() })
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        return (rows || []).filter(function (t) { return t.ve_pulse_content; }).map(function (t) {
          var p = t.ve_pulse_content;
          return {
            kind: 'pulse',
            headline: p.title,
            summary: p.summary,
            url: '/pulse/' + p.slug,
            image_url: p.thumbnail_url,
            is_pinned: !!t.is_pinned,
            published_at: p.published_at,
            source_name: p.category
          };
        });
      })
      .catch(function () { return []; });
  }

  function render(gridId, city) {
    var grid = document.getElementById(gridId);
    if (!grid) return;
    Promise.all([fetchCommunityNews(city), fetchPulseSpotlights(city)]).then(function (results) {
      var items = results[0].concat(results[1]);
      items.sort(function (a, b) {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        var da = a.published_at ? new Date(a.published_at).getTime() : 0;
        var db = b.published_at ? new Date(b.published_at).getTime() : 0;
        return db - da;
      });
      items = items.slice(0, 12);

      if (!items.length) {
        grid.innerHTML = '<p class="hub-dir-empty">No local news yet. Check back soon.</p>';
        return;
      }

      grid.innerHTML = items.map(function (n) {
        var d = n.published_at ? new Date(n.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
        var badge = n.is_pinned ? '<span class="news-tag">Featured</span>' : (n.kind === 'pulse' ? '<span class="news-tag update">Spotlight</span>' : '');
        var isExternal = n.kind === 'community';
        return '<article class="news-card">' +
          '<div class="news-img">' +
            (n.image_url ? '<img src="' + esc(n.image_url) + '" alt="' + esc(n.headline) + '" style="width:100%;height:100%;object-fit:cover;">' : '<div class="news-img-placeholder">' + (n.is_pinned ? 'Featured' : 'Photo') + '</div>') +
            badge +
          '</div>' +
          '<div class="news-body">' +
            '<p class="news-date">' + esc(d) + (n.source_name ? ' &middot; ' + esc(n.source_name) : '') + '</p>' +
            '<h3 class="news-headline">' + esc(n.headline) + '</h3>' +
            (n.summary ? '<p class="news-excerpt">' + esc(n.summary) + '</p>' : '') +
            (n.url ? '<a href="' + esc(n.url) + '"' + (isExternal ? ' target="_blank" rel="noopener noreferrer"' : '') + ' class="news-read">Read story</a>' : '') +
          '</div></article>';
      }).join('');
    }).catch(function () {
      grid.innerHTML = '<p class="hub-dir-empty">Couldn\'t load news right now.</p>';
    });
  }

  /* Live "Upcoming Events" renderer, reused by newer hub pages.
     cityNames: array of real city-name strings to match against events.city (a metro area may span several). */
  function renderEvents(listId, cityNames) {
    var list = document.getElementById(listId);
    if (!list) return;
    fetch(SUPABASE_URL + '/rest/v1/events?select=id,title,starts_at,location_name,city,category,ticket_url,rsvp_count&status=eq.approved&order=starts_at.asc&limit=100', { headers: headers() })
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        var matches = (rows || []).filter(function (e) { return e.city && cityNames.indexOf(e.city) > -1; });
        if (!matches.length) { list.innerHTML = '<p class="hub-dir-empty">No upcoming events posted yet. Check back soon.</p>'; return; }
        list.innerHTML = matches.map(function (e) {
          var dt = new Date(e.starts_at);
          var day = dt.getDate();
          var mon = dt.toLocaleString('en-US', { month: 'short' });
          var time = dt.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
          return '<article class="event-row" aria-label="' + esc(e.title) + '">' +
            '<div class="event-date-col" aria-hidden="true"><span class="event-day">' + day + '</span><span class="event-mon">' + esc(mon) + '</span></div>' +
            '<div class="event-body">' +
              '<p class="event-type-badge">' + esc(e.category || 'Event') + '</p>' +
              '<h3 class="event-name">' + esc(e.title) + '</h3>' +
              '<div class="event-details" aria-label="Event details">' +
                '<span>' + esc(e.location_name || e.city) + (e.city ? ', ' + esc(e.city) : '') + '</span>' +
                '<span>' + esc(time) + '</span>' +
                (e.rsvp_count ? '<span>' + e.rsvp_count + ' attending</span>' : '') +
              '</div>' +
            '</div>' +
            '<div class="event-cta-col">' + (e.ticket_url ? '<a href="' + esc(e.ticket_url) + '" class="btn-rsvp" target="_blank" rel="noopener noreferrer" aria-label="RSVP for ' + esc(e.title) + '">RSVP</a>' : '<span class="btn-rsvp" style="opacity:.5;pointer-events:none;">Details soon</span>') +
            '</div></article>';
        }).join('');
      }).catch(function () { list.innerHTML = '<p class="hub-dir-empty">Couldn\'t load events right now.</p>'; });
  }

  window.VEHubNews = { render: render, renderEvents: renderEvents };
})();
