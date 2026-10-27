/* ve-media.js: the Media section (Sean, 2026-10-27: "let's do media instead of shows... what we're showing on media is
   our featured media plus the top 12 listings voted by you guys"). One component on /media and the dashboard's Media tab.

   - One kind of media at a time (Sean, 2026-10-27: "you shouldn't see the podcast when they're clicking on documentaries"):
     Podcasts, Documentaries or Books (TYPES below), picked in the page's banner, which is not about a city.
   - That kind's Featured first, with a Featured pill: what we put there, nobody adds theirs (SHOWS below, our four shows,
     are Podcasts' Featured; a kind with nothing featured skips straight to its 12).
   - Then its top 12 as voted in the Directory. Read fresh on every load, so a vote moves the list on the next visit. Our
     own shows are Directory listings too and are left out of the 12. Ties go to the one with a logo, then A to Z.
   - Cards are the Directory's own card (VERegionDirectory.card / wire), so votes work the same everywhere.

   Usage (load /public/ve-region-directory.js first):
     var media = VEMedia.mount(el, { type: 'podcasts', onInteract: function () {}, onOpenListing: function (slug, name) {} });
     media.setType('books');
   VEMedia.TYPES feeds the banner's picker; VEMedia.directoryUrl(type) is its See in the Directory link.
*/
(function () {
  if (window.VEMedia) return;
  var SUPABASE_URL = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var TOP = 12;

  // The kinds of media in the dropdown: key, label, the Directory sub-section (listings.category) it reads.
  var TYPES = [
    { key: 'podcasts', label: 'Podcasts', one: 'podcast', cat: 'Podcasts' },
    { key: 'documentaries', label: 'Documentaries', one: 'documentary', cat: 'Documentaries & Films' },
    { key: 'books', label: 'Books', one: 'book', cat: 'Books' }
  ];
  function directoryUrl(key) { return '/directory?tab=media&sub=' + encodeURIComponent(typeOf(key).cat); }


  // Our shows, in order. slug is the show's Directory listing (/directory/<slug>), which stays out of the 12; its links and
  // status come from the listing, spotify and apple here are only the fallback.
  // type: the kind of media it is featured under.
  var SHOWS = [
    { type: 'podcasts', slug: 'vegans-explore-podcast', name: 'Vegans Explore Podcast', desc: 'Our flagship daily show, spotlighting Vegan topics, changemakers, nonprofits, and brands from around the world.',
      img: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/78/e8/15/78e815be-972b-683e-53eb-a56c001e9969/mza_10373735271438816480.jpg/600x600bb.jpg',
      spotify: 'https://open.spotify.com/show/19GDaPV2SIwybt3HpMurHu', apple: 'https://podcasts.apple.com/us/podcast/vegans-explore-podcast/id1818708745' },
    { type: 'podcasts', slug: 'soflo-vegans-podcast', name: 'SoFlo Vegans Podcast', desc: "South Florida's Vegan community show, running since 2018: local restaurant spotlights, guest interviews, and the people building the SoFlo Vegan movement.",
      img: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/8c/41/0d/8c410d14-e682-99ce-96cf-f39b8bebb698/mza_10096790309738673455.jpg/600x600bb.jpg',
      spotify: 'https://open.spotify.com/show/0AjEvjgjAWPWr8GsuyCkcz', apple: 'https://podcasts.apple.com/us/podcast/soflo-vegans-podcast/id1368665222' },
    { type: 'podcasts', slug: 'pre-vegans-podcast', name: 'Pre-Vegans Podcast', desc: 'A beginner-friendly series answering the questions people ask before they go Vegan.',
      img: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/53/d9/56/53d95636-6d45-1b44-6274-201548f57873/mza_1682445160343010984.jpg/600x600bb.jpg',
      spotify: 'https://open.spotify.com/show/1lttNCqQ6zBrilhrKLogs7', apple: 'https://podcasts.apple.com/us/podcast/pre-vegans-podcast/id1780250627' },
    { type: 'podcasts', slug: 'vegans-who-lift-podcast', name: 'Vegans Who Lift Podcast', desc: 'Vegan bodybuilding, fitness, and coaching conversations hosted by Brooke Sellers and John Thomas.',
      img: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/a0/99/53/a099536e-ce80-ef47-ff90-c9cf600fc2e8/mza_11962273234771203853.jpg/600x600bb.jpg',
      spotify: 'https://open.spotify.com/show/5Pr82Chfg3dYfoHHFizyAQ', apple: 'https://podcasts.apple.com/us/podcast/vegans-who-lift-podcast/id1727178761' }
  ];
  var OURS = SHOWS.map(function (s) { return s.slug; });

  var css = [
    '.vem{font-family:Montserrat,sans-serif;color:#1a1a1a;}',
    '.vem-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:0 0 16px;padding-bottom:12px;border-bottom:2px solid rgba(0,0,0,.08);}',
    '.vem-head h2{font-size:22px;font-weight:900;margin:0;}',
    '.vem-head p{font-size:13px;color:rgba(26,26,26,.68);margin:4px 0 0;}',
    '.vem-sec{margin:0 0 44px;}',
    '.vem-shows{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;}',
    '@media(max-width:1280px){.vem-shows{grid-template-columns:repeat(2,minmax(0,1fr));}}',
    '@media(max-width:560px){.vem-shows{grid-template-columns:minmax(0,1fr);}}',
    '.vem-show{border:1px solid rgba(0,0,0,.1);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;background:#fff;transition:box-shadow .15s,transform .15s;}',
    '.vem-show:hover{box-shadow:0 10px 28px rgba(0,0,0,.10);transform:translateY(-2px);}',
    '.vem-thumb{position:relative;display:block;aspect-ratio:1/1;background:#e8f5e9 center/cover no-repeat;}',
    '.vem-pill{position:absolute;top:10px;left:10px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#fff;background:#2d7d31;border-radius:6px;padding:5px 9px;box-shadow:0 2px 8px rgba(0,0,0,.25);}',
    '.vem-body{padding:14px 16px 16px;display:flex;flex-direction:column;gap:8px;flex:1;}',
    '.vem-title{font-size:15px;font-weight:900;margin:0;}',
    '.vem-title a{color:inherit;text-decoration:none;}',
    '.vem-title a:hover{text-decoration:underline;}',
    // Summary two-row cap (LOCKED 2026-09-14).
    '.vem-desc{font-size:13px;line-height:1.5;color:rgba(26,26,26,.7);margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
    '.vem-listen{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto;}',
    '.vem-listen a{flex:1 1 auto;display:inline-flex;align-items:center;justify-content:center;gap:7px;border:1.5px solid rgba(0,0,0,.1);border-radius:6px;padding:8px 10px;font-size:12px;font-weight:700;color:#1a1a1a;text-decoration:none;}',
    '.vem-listen a:hover{border-color:#1a1a1a;}',
    '.vem-listen a:not(.vem-here){flex:1 1 0;height:40px;padding:0;}',
    '.vem-listen a.vem-here{flex:1 0 100%;padding:10px;background:#2d7d31;border-color:#2d7d31;color:#fff;font-size:13px;}',
    '.vem-listen a.vem-here:hover{background:#1b5e20;border-color:#1b5e20;}',
    '.vem-meta .vrd-mstat{display:inline-block;font-size:9px;font-weight:800;letter-spacing:.06em;padding:1px 7px;border-radius:10px;}',
    '.vem-meta .vrd-mstat-on{background:#e3f6e7;color:#1f6b33}.vem-meta .vrd-mstat-paused{background:#fff1dc;color:#8a5200}.vem-meta .vrd-mstat-off{background:#eee;color:#555}',
    '.vem-meta{font-size:12px;font-weight:700;color:rgba(26,26,26,.68);display:flex;align-items:center;gap:6px;}',
    '.vem-search{position:relative;margin:0 0 16px;}',
    '.vem-search input{width:100%;font-family:inherit;font-size:14px;padding:12px 14px;border:1.5px solid rgba(0,0,0,.12);border-radius:6px;background:#fff;color:#1a1a1a;}',
    '.vem-search input:focus{outline:none;border-color:#2d7d31;}',
    '.vem-results{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr));gap:6px;margin:0 0 16px;}',
    '.vem-res{display:flex;gap:12px;align-items:center;padding:10px;border-radius:8px;text-decoration:none;color:#1a1a1a;}',
    '.vem-res:hover{background:#e8f5e9;}',
    '.vem-res-thumb{width:56px;height:56px;border-radius:6px;background:#eee center/cover no-repeat;flex-shrink:0;}',
    '.vem-res-show{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#2d7d31;}',
    '.vem-res-title{font-size:13px;font-weight:800;margin-top:2px;}',
    '.vem-note{font-size:13px;color:rgba(26,26,26,.6);padding:8px 0;}',
    '.vem-all{display:inline-block;margin-top:16px;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#2d7d31;text-decoration:none;}',
    '.vem-all:hover{text-decoration:underline;}',
    '.vem :focus-visible{outline:3px solid #F69820;outline-offset:3px;}'
  ].join('');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function typeOf(key) { return TYPES.filter(function (t) { return t.key === key; })[0] || TYPES[0]; }
  function get(path) {
    return fetch(SUPABASE_URL + '/rest/v1/' + path, { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }

  // A featured show is its Directory listing (Sean, 2026-10-27: "the same as the page... set up the same way as the others"):
  // the card opens /directory/<slug> (episodes from its feed, Listen on), wears the feed's Active / On hiatus / Ended, and
  // lists where else to listen, Spotify, Apple Podcasts, Amazon Music and YouTube, from the listing (details.platforms).
  var LISTEN = [['spotify', 'Spotify', 'spotify'], ['apple', 'Apple Podcasts', 'apple-podcasts'], ['amazon', 'Amazon Music', 'amazon-music'], ['youtube', 'YouTube', 'youtube']];
  function showStatus(l) {
    var b = l && l.business_status;
    var t = b === 'CLOSED_PERMANENTLY' ? ['Ended', 'off'] : b === 'CLOSED_TEMPORARILY' ? ['On hiatus', 'paused'] : l ? ['Active', 'on'] : null;
    return t ? '<span class="vrd-mstat vrd-mstat-' + t[1] + '">' + t[0] + '</span>' : '';
  }
  function showCard(s, l) {
    var href = '/directory/' + s.slug, pl = (l && l.details && l.details.platforms) || {};
    var links = LISTEN.map(function (p) {
      var u = pl[p[0]] || s[p[0]];
      return u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener" title="' + p[1] + '" aria-label="' + p[1] + '"><img src="/public/icons/platforms/' + p[2] + '.svg" alt="" width="20" height="20"></a>' : '';
    }).join('');
    return '<div class="vem-show">' +
      '<a class="vem-thumb" href="' + href + '" data-vem-open="' + esc(s.slug) + '" style="background-image:url(\'' + esc(s.img) + '\')" aria-label="' + esc(s.name) + '"><span class="vem-pill">Featured</span></a>' +
      '<div class="vem-body"><h3 class="vem-title"><a href="' + href + '" data-vem-open="' + esc(s.slug) + '">' + esc(s.name) + '</a></h3>' +
      '<div class="vem-meta">Podcast ' + showStatus(l) + '</div>' +
      '<p class="vem-desc">' + esc(s.desc) + '</p>' +
      '<div class="vem-listen"><a class="vem-here" href="' + href + '" data-vem-open="' + esc(s.slug) + '">Listen here</a>' + links + '</div></div></div>';
  }

  // The top 12 of a kind: most votes, then most voters, then a logo over a letter, then A to Z. Never ours, never closed.
  function rank(rows) {
    // Ended shows count too (Sean, 2026-10-27): their status shows on the card.
    return rows.filter(function (l) { return OURS.indexOf(l.slug) < 0; })
      .sort(function (a, b) {
        return (b.vote_count || 0) - (a.vote_count || 0) || (b.voter_count || 0) - (a.voter_count || 0) ||
          (b.logo_url ? 1 : 0) - (a.logo_url ? 1 : 0) || String(a.name).localeCompare(String(b.name));
      }).slice(0, TOP);
  }

  function mount(target, opts) {
    opts = opts || {};
    var el = typeof target === 'string' ? document.getElementById(target) : target;
    if (!document.getElementById('vem-css')) { var st = document.createElement('style'); st.id = 'vem-css'; st.textContent = css; document.head.appendChild(st); }
    if (window.VERegionDirectory) VERegionDirectory.css();
    var type = typeOf(opts.type).key;
    var uid = 'vem-' + Math.random().toString(36).slice(2, 8);

    el.classList.add('vem');
    el.innerHTML =
      '<section class="vem-sec" data-vem-featured aria-labelledby="' + uid + '-f">' +
        '<div class="vem-head"><div><h2 id="' + uid + '-f">Featured</h2><p data-vem-fsub></p></div></div>' +
        '<div data-vem-searchbox><div class="vem-search"><label for="' + uid + '-q" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Search our episodes</label>' +
          '<input type="search" id="' + uid + '-q" placeholder="Search our episodes by topic, guest, or keyword"></div>' +
        '<div class="vem-results" data-vem-results aria-live="polite"></div></div>' +
        '<div class="vem-shows" data-vem-shows></div>' +
      '</section>' +
      '<section class="vem-sec" aria-labelledby="' + uid + '-t">' +
        '<div class="vem-head"><div><h2 id="' + uid + '-t" data-vem-title></h2><p>The top ' + TOP + ' as voted by members in the Directory. Vote for your favorites to move them up.</p></div></div>' +
        '<div class="vrd-root"><div class="rank-grid" data-vem-grid></div></div>' +
        '<a class="vem-all" data-vem-all href="/directory?tab=media">See them all in the Directory</a>' +
      '</section>';

    var grid = el.querySelector('[data-vem-grid]'), title = el.querySelector('[data-vem-title]');
    var featured = el.querySelector('[data-vem-featured]'), shows = el.querySelector('[data-vem-shows]');
    var allLink = el.querySelector('[data-vem-all]'), seq = 0;
    // Inside the dashboard a featured show opens under its Directory tab, like the cards below.
    shows.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-vem-open]');
      if (!a || !opts.onOpenListing || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      var s = SHOWS.filter(function (x) { return x.slug === a.getAttribute('data-vem-open'); })[0];
      opts.onOpenListing(s.slug, s.name);
    });

    function load() {
      var t = typeOf(type), mine = ++seq;
      // This kind's Featured, or none (then its 12 lead the page).
      var feat = SHOWS.filter(function (x) { return x.type === t.key; });
      featured.hidden = !feat.length;
      shows.innerHTML = feat.map(function (s) { return showCard(s, null); }).join('');
      // Then each show's listing: its status from the feed and its Listen on links.
      if (feat.length) get('listings?select=slug,business_status,details&status=eq.approved&slug=in.(' + feat.map(function (x) { return x.slug; }).join(',') + ')')
        .then(function (rows) {
          if (mine !== seq) return;
          var by = {}; (rows || []).forEach(function (r) { by[r.slug] = r; });
          shows.innerHTML = feat.map(function (s) { return showCard(s, by[s.slug] || null); }).join('');
        }).catch(function () {});
      el.querySelector('[data-vem-fsub]').textContent = t.key === 'podcasts' ? 'Our shows: listen here, or on Spotify, Apple Podcasts, Amazon Music and YouTube.' : 'Our picks.';
      el.querySelector('[data-vem-searchbox]').hidden = t.key !== 'podcasts';
      title.textContent = 'Top ' + TOP + ' ' + t.label;
      allLink.textContent = 'See every ' + t.one + ' in the Directory';
      allLink.href = directoryUrl(t.key);
      grid.innerHTML = '<p class="vem-note">Loading&hellip;</p>';
      var fields = window.VERegionDirectory ? VERegionDirectory.FIELDS : 'id,slug,name,category,logo_url,vote_count,voter_count,business_status';
      var cat = '"' + t.cat + '"';
      get('listings?select=' + fields + '&status=eq.approved&or=' + encodeURIComponent('(category.eq.' + cat + ',extra_categories.cs.{' + cat + '})') + '&limit=500')
        .then(function (rows) {
          if (mine !== seq) return;
          var top = rank(rows || []);
          if (!top.length) { grid.innerHTML = '<p class="vem-note">Nothing here yet.</p>'; return; }
          grid.innerHTML = top.map(function (l, i) { return window.VERegionDirectory ? VERegionDirectory.card(l, i) : ''; }).join('');
          if (window.VERegionDirectory) VERegionDirectory.wire(grid.parentNode, opts.onOpenListing || null);
        })
        .catch(function () { if (mine === seq) grid.innerHTML = '<p class="vem-note">The list did not load. Refresh to try again.</p>'; });
    }

    // Search our episodes (ve_pulse_content, the same search the old /podcast page had).
    var input = el.querySelector('input[type="search"]'), results = el.querySelector('[data-vem-results]'), timer = null;
    input.addEventListener('focus', function () { if (opts.onInteract) opts.onInteract(); });
    input.addEventListener('input', function () {
      clearTimeout(timer);
      var q = input.value.trim();
      if (!q) { results.innerHTML = ''; return; }
      timer = setTimeout(function () {
        get('ve_pulse_content?content_type=eq.podcast&status=eq.published&search_vector=wfts.' + encodeURIComponent(q) +
          '&select=title,slug,thumbnail_url,podcast_show&order=published_at.desc&limit=12')
          .then(function (rows) {
            if (input.value.trim() !== q) return;
            results.innerHTML = rows && rows.length ? rows.map(function (r) {
              return '<a class="vem-res" href="/pulse/' + encodeURIComponent(r.slug) + '"><span class="vem-res-thumb" style="background-image:url(\'' + esc(r.thumbnail_url || '') + '\')"></span>' +
                '<span><span class="vem-res-show">' + esc(r.podcast_show || '') + '</span><span class="vem-res-title" style="display:block">' + esc(r.title) + '</span></span></a>';
            }).join('') : '<p class="vem-note">No episodes found for "' + esc(q) + '".</p>';
          })
          .catch(function () { results.innerHTML = '<p class="vem-note">Search is not available right now.</p>'; });
      }, 300);
    });

    load();
    return { setType: function (k) { if (typeOf(k).key === type) return; type = typeOf(k).key; load(); }, reload: load };
  }

  // The banner's options (VECityBanner.mount), the same on /media and the dashboard: Vegan Media over the kind, the kinds
  // instead of cities, and See in the Directory for that kind. Add key, param or initial, and onChange.
  function bannerOptions(extra) {
    var o = { title: 'Vegan Media', pickLabel: 'Kind of media', art: '/communities/new-york/banner.jpg',
      sub: 'Our shows and picks first, then the podcasts, documentaries and books members vote to the top in the Directory.',
      choices: TYPES.map(function (t) { return { value: t.key, label: t.label }; }),
      link: function (key) { return { href: directoryUrl(key), label: 'See in the Directory' }; },
      // Join our network (Sean, 2026-10-27): the podcast network's application, between the Directory and Expand.
      actions: [{ label: 'Join our network', href: '/media/network', go: true }] };
    for (var k in extra) o[k] = extra[k];
    return o;
  }

  window.VEMedia = { mount: mount, TYPES: TYPES, SHOWS: SHOWS, directoryUrl: directoryUrl, bannerOptions: bannerOptions };
})();
