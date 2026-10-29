/* ve-media.js: the Media section (Sean, 2026-10-27: "let's do media instead of shows... what we're showing on media is
   our featured media plus the top 12 listings voted by you guys"). One component on /media and the dashboard's Media tab.

   - One kind of media at a time (Sean, 2026-10-27: "you shouldn't see the podcast when they're clicking on documentaries"):
     Podcasts, Documentaries or Books (TYPES below), picked in the page's banner, which is not about a city.
   - That kind's Featured first, in its own section with the Directory's card like the 12 (Sean, 2026-10-27): what we put
     there, nobody adds theirs (SHOWS below, our four shows, are Podcasts' Featured; a kind with nothing featured skips
     straight to its 12).
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


  // Our shows, in order: each one's Directory listing (/directory/<slug>), shown with the Directory's card in Featured and
  // left out of the 12. type: the kind of media it is featured under.
  var SHOWS = [
    { type: 'podcasts', slug: 'vegans-explore-podcast', name: 'Vegans Explore Podcast' },
    { type: 'podcasts', slug: 'soflo-vegans-podcast', name: 'SoFlo Vegans Podcast' },
    { type: 'podcasts', slug: 'pre-vegans-podcast', name: 'Pre-Vegans Podcast' },
    { type: 'podcasts', slug: 'vegans-who-lift-podcast', name: 'Vegans Who Lift Podcast' },
    { type: 'books', slug: 'pre-vegans-by-sean-russell', name: 'Pre-Vegans' }
  ];
  var OURS = SHOWS.map(function (s) { return s.slug; });

  var css = [
    '.vem{font-family:Montserrat,sans-serif;color:#1a1a1a;}',
    '.vem-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:0 0 16px;padding-bottom:12px;border-bottom:2px solid rgba(0,0,0,.08);}',
    '.vem-head h2{font-size:22px;font-weight:900;margin:0;}',
    '.vem-head p{font-size:13px;color:rgba(26,26,26,.68);margin:4px 0 0;}',
    '.vem-sec{margin:0 0 44px;}',
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


  // The top 12 of a kind: most votes, then most voters, then a logo over a letter, then A to Z. Never ours, never closed.
  function rank(rows) {
    // Shows on hiatus count too (Sean, 2026-10-27): their status shows on the card.
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
        '<div class="vrd-root"><div class="rank-grid" data-vem-shows></div></div>' +
      '</section>' +
      '<section class="vem-sec" aria-labelledby="' + uid + '-t">' +
        '<div class="vem-head"><div><h2 id="' + uid + '-t" data-vem-title></h2><p>The top ' + TOP + ' as voted by members in the Directory. Vote for your favorites to move them up.</p></div></div>' +
        '<div class="vrd-root"><div class="rank-grid" data-vem-grid></div></div>' +
      '</section>';

    var grid = el.querySelector('[data-vem-grid]'), title = el.querySelector('[data-vem-title]');
    var featured = el.querySelector('[data-vem-featured]'), shows = el.querySelector('[data-vem-shows]');
    var allLink = el.querySelector('[data-vem-all]'), seq = 0;

    function load() {
      var t = typeOf(type), mine = ++seq;
      // This kind's Featured, or none (then its 12 lead the page).
      var feat = SHOWS.filter(function (x) { return x.type === t.key; });
      featured.hidden = !feat.length;
      var fields = window.VERegionDirectory ? VERegionDirectory.FIELDS : 'id,slug,name,category,logo_url,vote_count,voter_count,business_status';
      // Featured shows wear the Directory's own card, the same as the top 12, in their own section (Sean, 2026-10-27: "show the
      // featured podcasts in the same format as the other, just in their own section"), in our order (SHOWS).
      shows.innerHTML = feat.length ? '<p class="vem-note">Loading&hellip;</p>' : '';
      if (feat.length) get('listings?select=' + fields + '&status=eq.approved&slug=in.(' + feat.map(function (x) { return x.slug; }).join(',') + ')')
        .then(function (rows) {
          if (mine !== seq) return;
          var by = {}; (rows || []).forEach(function (r) { by[r.slug] = r; });
          var list = feat.map(function (s) { return by[s.slug]; }).filter(Boolean);
          if (!window.VERegionDirectory || !list.length) { featured.hidden = true; return; }
          shows.innerHTML = list.map(function (l, i) { return VERegionDirectory.card(l, i); }).join('');
          VERegionDirectory.wire(shows.parentNode, opts.onOpenListing || null);
        }).catch(function () { if (mine === seq) featured.hidden = true; });
      el.querySelector('[data-vem-fsub]').textContent = t.key === 'podcasts' ? 'Our own shows. Open one to listen here, or on Spotify, Apple Podcasts, Amazon Music and YouTube.' : t.key === 'books' ? 'From Vegans Explore.' : 'Our picks.';
      el.querySelector('[data-vem-searchbox]').hidden = t.key !== 'podcasts';
      title.textContent = 'Top ' + TOP + ' ' + t.label;
      // No "See every book in the Directory" line (Sean, 2026-10-27): the banner's See in the Directory does that.
      if (allLink) { allLink.textContent = 'See every ' + t.one + ' in the Directory'; allLink.href = directoryUrl(t.key); }
      grid.innerHTML = '<p class="vem-note">Loading&hellip;</p>';
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
      // Media home first (Sean, 2026-10-27: the page's own home, like Directory home); See in the Directory shows while it is open.
      home: { label: 'Media home', href: '/media' },
      // Join our network (Sean, 2026-10-27): the podcast network's application, between the Directory and Expand.
      actions: [{ label: 'Join our network', short: 'Join network', href: '/media/network', go: true }] };
    for (var k in extra) o[k] = extra[k];
    return o;
  }

  window.VEMedia = { mount: mount, TYPES: TYPES, SHOWS: SHOWS, directoryUrl: directoryUrl, bannerOptions: bannerOptions };
})();
