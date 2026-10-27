/* ve-media.js: the Media section (Sean, 2026-10-27: "let's do media instead of shows... what we're showing on media is
   our featured media plus the top 12 listings voted by you guys"). One component on /media and the dashboard's Media tab.

   - Our shows come first, always, each with a Featured pill (SHOWS below; nobody adds theirs, we decide what is here).
   - Then the top 12 of one kind of media, as voted in the Directory: Podcasts, Documentaries or Books (the dropdown,
     TYPES below). Read fresh on every load, so a vote moves the list on the next visit. Our own shows are Directory
     listings too and are left out of the 12. Ties go to the one with a logo, then A to Z.
   - Cards are the Directory's own card (VERegionDirectory.card / wire), so votes work the same everywhere.

   Usage (load /public/ve-region-directory.js first):
     var media = VEMedia.mount(el, { urlState: true, onInteract: function () {}, onOpenListing: function (slug, name) {} });
     media.setType('books');
   urlState keeps ?type= in the address bar (/media); the dashboard passes false.
*/
(function () {
  if (window.VEMedia) return;
  var SUPABASE_URL = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var TOP = 12;

  // The kinds of media in the dropdown: key, label, the Directory sub-section (listings.category) it reads.
  var TYPES = [
    { key: 'podcasts', label: 'Podcasts', cat: 'Podcasts' },
    { key: 'documentaries', label: 'Documentaries', cat: 'Documentaries & Films' },
    { key: 'books', label: 'Books', cat: 'Books' }
  ];

  var SPOTIFY = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1DB954"/><path d="M6.5 9.3c3.6-1.1 7.9-.8 11 1M7.1 12.6c3-.9 6.5-.6 9.2.9M7.7 15.7c2.4-.6 5-.4 7.1.7" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></svg>';
  var APPLE = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6" fill="#9B4DE0"/><circle cx="12" cy="10" r="2.4" fill="#fff"/><path d="M11 13.6h2l-.4 5.4h-1.2z" fill="#fff"/><path d="M8.1 14.4a5 5 0 1 1 7.8 0M6 16.3a7.6 7.6 0 1 1 12 0" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/></svg>';

  // Our shows, in order. slug is the show's page (/podcast/<slug>/) and its Directory listing, which stays out of the 12.
  var SHOWS = [
    { slug: 'vegans-explore-podcast', name: 'Vegans Explore Podcast', desc: 'Our flagship daily show, spotlighting Vegan topics, changemakers, nonprofits, and brands from around the world.',
      img: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/78/e8/15/78e815be-972b-683e-53eb-a56c001e9969/mza_10373735271438816480.jpg/600x600bb.jpg',
      spotify: 'https://open.spotify.com/show/19GDaPV2SIwybt3HpMurHu', apple: 'https://podcasts.apple.com/us/podcast/vegans-explore-podcast/id1818708745' },
    { slug: 'soflo-vegans-podcast', name: 'SoFlo Vegans Podcast', desc: "South Florida's Vegan community show, running since 2018: local restaurant spotlights, guest interviews, and the people building the SoFlo Vegan movement.",
      img: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/8c/41/0d/8c410d14-e682-99ce-96cf-f39b8bebb698/mza_10096790309738673455.jpg/600x600bb.jpg',
      spotify: 'https://open.spotify.com/show/0AjEvjgjAWPWr8GsuyCkcz', apple: 'https://podcasts.apple.com/us/podcast/soflo-vegans-podcast/id1368665222' },
    { slug: 'pre-vegans-podcast', name: 'Pre-Vegans Podcast', desc: 'A beginner-friendly series answering the questions people ask before they go Vegan.',
      img: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/53/d9/56/53d95636-6d45-1b44-6274-201548f57873/mza_1682445160343010984.jpg/600x600bb.jpg',
      spotify: 'https://open.spotify.com/show/1lttNCqQ6zBrilhrKLogs7', apple: 'https://podcasts.apple.com/us/podcast/pre-vegans-podcast/id1780250627' },
    { slug: 'vegans-who-lift-podcast', name: 'Vegans Who Lift Podcast', desc: 'Vegan bodybuilding, fitness, and coaching conversations hosted by Brooke Sellers and John Thomas.',
      img: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/a0/99/53/a099536e-ce80-ef47-ff90-c9cf600fc2e8/mza_11962273234771203853.jpg/600x600bb.jpg',
      spotify: 'https://open.spotify.com/show/5Pr82Chfg3dYfoHHFizyAQ', apple: 'https://podcasts.apple.com/us/podcast/vegans-who-lift-podcast/id1727178761' }
  ];
  var OURS = SHOWS.map(function (s) { return s.slug; });

  var CHEVRON = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%231a1a1a' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E\")";
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
    '.vem-type{display:flex;align-items:center;gap:10px;}',
    '.vem-type label{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:rgba(26,26,26,.68);}',
    // Dropdowns never show the browser's arrow (canon rule 15).
    '.vem-type select{appearance:none;-webkit-appearance:none;-moz-appearance:none;font-family:inherit;font-size:13px;font-weight:800;color:#1a1a1a;background:#fff ' + CHEVRON + ' no-repeat right 16px center;border:1.5px solid rgba(0,0,0,.15);border-radius:6px;padding:10px 44px 10px 14px;cursor:pointer;min-width:200px;}',
    '.vem-type select::-ms-expand{display:none;}',
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

  function showCard(s) {
    return '<div class="vem-show">' +
      '<a class="vem-thumb" href="/podcast/' + s.slug + '/" style="background-image:url(\'' + esc(s.img) + '\')" aria-label="' + esc(s.name) + '"><span class="vem-pill">Featured</span></a>' +
      '<div class="vem-body"><h3 class="vem-title"><a href="/podcast/' + s.slug + '/">' + esc(s.name) + '</a></h3>' +
      '<p class="vem-desc">' + esc(s.desc) + '</p>' +
      '<div class="vem-listen"><a href="' + esc(s.spotify) + '" target="_blank" rel="noopener">' + SPOTIFY + '<span>Spotify</span></a>' +
      '<a href="' + esc(s.apple) + '" target="_blank" rel="noopener">' + APPLE + '<span>Apple Podcasts</span></a></div></div></div>';
  }

  // The top 12 of a kind: most votes, then most voters, then a logo over a letter, then A to Z. Never ours, never closed.
  function rank(rows) {
    return rows.filter(function (l) { return OURS.indexOf(l.slug) < 0 && l.business_status !== 'CLOSED_PERMANENTLY'; })
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
    var urlState = opts.urlState !== false;
    var type = typeOf(urlState ? new URLSearchParams(location.search).get('type') : opts.type).key;
    var uid = 'vem-' + Math.random().toString(36).slice(2, 8);

    el.classList.add('vem');
    el.innerHTML =
      '<section class="vem-sec" aria-labelledby="' + uid + '-f">' +
        '<div class="vem-head"><div><h2 id="' + uid + '-f">Featured</h2><p>Our shows, on Spotify, Apple Podcasts and here.</p></div></div>' +
        '<div class="vem-search"><label for="' + uid + '-q" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Search our episodes</label>' +
          '<input type="search" id="' + uid + '-q" placeholder="Search our episodes by topic, guest, or keyword"></div>' +
        '<div class="vem-results" data-vem-results aria-live="polite"></div>' +
        '<div class="vem-shows">' + SHOWS.map(showCard).join('') + '</div>' +
      '</section>' +
      '<section class="vem-sec" aria-labelledby="' + uid + '-t">' +
        '<div class="vem-head"><div><h2 id="' + uid + '-t" data-vem-title></h2><p>The top ' + TOP + ' as voted by members in the Directory. Vote for your favorites to move them up.</p></div>' +
          '<div class="vem-type"><label for="' + uid + '-k">Media</label><select id="' + uid + '-k">' +
            TYPES.map(function (t) { return '<option value="' + t.key + '">' + esc(t.label) + '</option>'; }).join('') + '</select></div></div>' +
        '<div class="vrd-root"><div class="rank-grid" data-vem-grid></div></div>' +
        '<a class="vem-all" data-vem-all href="/directory?tab=media">See them all in the Directory</a>' +
      '</section>';

    var select = el.querySelector('select'), grid = el.querySelector('[data-vem-grid]'), title = el.querySelector('[data-vem-title]');
    var allLink = el.querySelector('[data-vem-all]'), seq = 0;

    function load() {
      var t = typeOf(type), mine = ++seq;
      select.value = t.key;
      title.textContent = 'Top ' + TOP + ' ' + t.label;
      allLink.textContent = 'See every ' + t.label.toLowerCase().replace(/s$/, '') + ' in the Directory';
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

    select.addEventListener('change', function () {
      type = select.value;
      if (urlState) {
        var q = new URLSearchParams(location.search);
        if (type === TYPES[0].key) q.delete('type'); else q.set('type', type);
        var s = q.toString();
        history.replaceState(history.state, '', location.pathname + (s ? '?' + s : '') + location.hash);
      }
      if (opts.onInteract) opts.onInteract();
      load();
    });

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
    return { setType: function (k) { type = typeOf(k).key; load(); }, reload: load };
  }

  window.VEMedia = { mount: mount, TYPES: TYPES, SHOWS: SHOWS };
})();
