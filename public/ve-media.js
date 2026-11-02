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
    // The voted list's bar (Sean, 2026-11-01, the Directory's and Events' pills on Media): a name search, the live filters as
    // pills (tap to turn one off and on, its x to take it away) and Filters with the kind's own choices and Sort.
    '.vem-bar{position:relative;display:flex;align-items:center;gap:16px;margin:0 0 16px;}',
    '.vem-bar .vem-search{flex:1 1 auto;min-width:160px;margin:0;}',
    '.vem-chips{flex:0 1 auto;display:flex;gap:8px;align-items:center;min-width:0;overflow-x:auto;scrollbar-width:none;}',
    '.vem-chips:empty{display:none;}.vem-chips::-webkit-scrollbar{display:none;}',
    '.vem-chip{flex:0 0 auto;display:inline-flex;align-items:center;height:32px;border-radius:6px;border:1px solid var(--vb-line,#b6e5c8);background:var(--vb-soft,#f0faf4);color:var(--vb-accent-ink,#2d7a4f);font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;}',
    '.vem-chip button{font-family:inherit;font-size:inherit;font-weight:inherit;color:inherit;background:transparent;border:0;cursor:pointer;height:100%;}',
    '.vem-chip .lbl{padding:0 6px 0 12px;}.vem-chip .x{padding:0 10px 0 4px;font-size:15px;line-height:1;}',
    '.vem-chip:hover{border-color:var(--vb-accent-ink,#2d7a4f);}',
    '.vem-chip.off{background:#f4f4f4;border-color:#e0e0e0;color:#888;}.vem-chip.off .lbl{text-decoration:line-through;}',
    '.vem-fbtn{flex:0 0 auto;min-width:132px;height:46px;padding:0 18px;display:flex;align-items:center;justify-content:center;gap:8px;border:1.5px solid rgba(0,0,0,.14);border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;font-family:inherit;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap;}',
    '.vem-fbtn:hover,.vem-fbtn[aria-expanded="true"]{border-color:var(--vb-accent-ink,#2d7a4f);color:var(--vb-accent-ink,#2d7a4f);}',
    '.vem-fbtn[aria-expanded="true"]{background:var(--vb-soft,#f0faf4);}',
    '.vem-fcount{min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--vb-accent-ink,#2d7a4f);color:#fff;font-size:10px;line-height:18px;letter-spacing:0;text-align:center;}',
    '.vem-fcount[hidden]{display:none;}',
    '.vem-pop{position:absolute;top:calc(100% + 8px);right:0;z-index:40;width:min(820px,100%);background:#fff;border:1px solid #e3e3e3;border-radius:10px;box-shadow:0 14px 36px rgba(0,0,0,.16);overflow:hidden;}',
    '.vem-pop[hidden],.vem-psec[hidden]{display:none;}',
    '.vem-psec{padding:18px 20px;}.vem-psec+.vem-psec{border-top:1px solid #eee;}',
    '.vem-ph{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#1a1a1a;margin:0 0 12px;}',
    '.vem-kindbox{display:flex;flex-wrap:wrap;gap:8px;}',
    '.vem-kindbox button{font-family:inherit;font-size:12px;font-weight:700;height:34px;padding:0 14px;border-radius:6px;border:1.5px solid rgba(0,0,0,.14);background:#fff;color:#333;cursor:pointer;}',
    '.vem-kindbox button[aria-pressed="true"]{background:var(--vb-go,#2d7d31);border-color:var(--vb-go,#2d7d31);color:#fff;}',
    '.vem-pop select{font-family:inherit;width:100%;max-width:280px;height:40px;padding:0 44px 0 12px;font-size:12px;border:1.5px solid rgba(0,0,0,.14);border-radius:6px;background:#fff url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%278%27%3E%3Cpath d=%27M1 1l5 5 5-5%27 stroke=%27%23333%27 stroke-width=%272%27 fill=%27none%27/%3E%3C/svg%3E") no-repeat right 16px center;-webkit-appearance:none;appearance:none;}',
    '.vem-pfoot{display:flex;justify-content:flex-end;gap:10px;padding:12px 20px;border-top:1px solid #eee;background:#fafafa;}',
    '.vem-btn{font-family:inherit;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;height:40px;padding:0 18px;border-radius:6px;cursor:pointer;border:1.5px solid rgba(0,0,0,.14);background:#fff;color:#1a1a1a;}',
    '.vem-btn.green{background:var(--vb-go,#2d7d31);border-color:var(--vb-go,#2d7d31);color:#fff;}',
    '@media(max-width:600px){.vem-bar{flex-wrap:wrap;gap:10px}.vem-bar .vem-search{flex:1 1 100%;order:-1}.vem-chips{flex:1 1 100%;flex-wrap:wrap;overflow:visible}.vem-fbtn{flex:1 1 auto}.vem-psec{padding:16px}.vem-pfoot{padding:12px 16px}.vem-pfoot .vem-btn{flex:1 1 0}}',
    '.vem :focus-visible{outline:3px solid #F69820;outline-offset:3px;}'
  ].join('');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function typeOf(key) { return TYPES.filter(function (t) { return t.key === key; })[0] || TYPES[0]; }
  function get(path) {
    return fetch(SUPABASE_URL + '/rest/v1/' + path, { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }


  // The top 12 of a kind: most votes, then most voters, then a logo over a letter, then A to Z. Never ours, never closed.
  function rank(rows, sort) {
    // Shows on hiatus count too (Sean, 2026-10-27): their status shows on the card.
    // LESARUSS.ai's own listings (tag lesaruss-ai-directory-candidate: business podcasts and tools) are not ours to show.
    var byVotes = function (a, b) {
      return (b.vote_count || 0) - (a.vote_count || 0) || (b.voter_count || 0) - (a.voter_count || 0) ||
        (b.logo_url ? 1 : 0) - (a.logo_url ? 1 : 0) || String(a.name).localeCompare(String(b.name));
    };
    var yr = function (l) { var y = parseInt(l.release_year, 10); return isNaN(y) ? null : y; };
    var cmp = sort === 'az' ? function (a, b) { return String(a.name).localeCompare(String(b.name)); }
      : sort === 'newest' || sort === 'oldest' ? function (a, b) {
          var x = yr(a), y = yr(b); if (x === y) return byVotes(a, b); if (x === null) return 1; if (y === null) return -1;
          return sort === 'newest' ? y - x : x - y; }
      : byVotes;
    return rows.filter(function (l) { return OURS.indexOf(l.slug) < 0 && (l.tags || []).indexOf('lesaruss-ai-directory-candidate') < 0; })
      .sort(cmp).slice(0, TOP);
  }

  // Each kind's filters: a facet is a group of choices read from the listing; picks in one facet are either-or, facets combine.
  var STATUS = [['active', 'Active'], ['hiatus', 'On hiatus'], ['ended', 'Ended']];
  function statusOf(l) { return l.business_status === 'CLOSED_TEMPORARILY' ? 'hiatus' : l.business_status === 'CLOSED_PERMANENTLY' ? 'ended' : 'active'; }
  var BOOK_TYPES = [['cookbook', 'Cookbook'], ['memoir', 'Biography & memoir'], ['educational', 'Educational'], ['health', 'Health & nutrition'], ['lifestyle', 'Lifestyle'], ['children', "Children's"]];
  var FACETS = {
    podcasts: [{ key: 'status', label: 'Status', choices: STATUS, of: statusOf }],
    documentaries: [{ key: 'avail', label: 'Status', choices: [['active', 'Available'], ['hiatus', 'Unavailable for now'], ['ended', 'No longer available']], of: statusOf }],
    books: [{ key: 'type', label: 'Type of book', choices: BOOK_TYPES, of: function (l) { return l.book_type || ''; } }]
  };
  var SORTS = { podcasts: [['votes', 'Most votes'], ['az', 'A to Z']] };
  function sortsFor(k) { return SORTS[k] || [['votes', 'Most votes'], ['az', 'A to Z'], ['newest', 'Newest first'], ['oldest', 'Oldest first']]; }

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
        '<div class="vem-bar">' +
          '<div class="vem-search"><label for="' + uid + '-n" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Search by name</label>' +
            '<input type="search" id="' + uid + '-n" data-vem-name autocomplete="off"></div>' +
          '<div class="vem-chips" data-vem-chips role="group" aria-label="Filters on"></div>' +
          '<button type="button" class="vem-fbtn" data-vem-fbtn aria-expanded="false" aria-controls="' + uid + '-pop">' +
            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24" aria-hidden="true"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="7" y1="12" x2="17" y2="12"></line><line x1="10" y1="18" x2="14" y2="18"></line></svg>' +
            '<span>Filters</span><span class="vem-fcount" hidden></span></button>' +
          '<div class="vem-pop" id="' + uid + '-pop" role="region" aria-label="Filters and sort" hidden>' +
            '<div data-vem-facets></div>' +
            '<div class="vem-psec"><div class="vem-ph">Sort</div><select data-vem-sort aria-label="Sort by"></select></div>' +
            '<div class="vem-pfoot"><button type="button" class="vem-btn" data-vem-reset>Reset filters</button><button type="button" class="vem-btn green" data-vem-done>Done</button></div>' +
          '</div>' +
        '</div>' +
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
      cache = null; f = { q: '', picks: {}, sort: 'votes' }; nameIn.value = ''; nameIn.placeholder = 'Search ' + t.label.toLowerCase() + ' by name';
      sortSel.innerHTML = sortsFor(t.key).map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('');
      if (!restored) { restored = true; readUrl(t.key); }
      paintFilters();
      var cat = '"' + t.cat + '"';
      get('listings?select=' + fields + '&status=eq.approved&or=' + encodeURIComponent('(category.eq.' + cat + ',extra_categories.cs.{' + cat + '})') + '&limit=500')
        .then(function (rows) {
          if (mine !== seq) return;
          cache = rows || []; drawTop();
        })
        .catch(function () { if (mine === seq) grid.innerHTML = '<p class="vem-note">The list did not load. Refresh to try again.</p>'; });
    }

    // The voted list's filters (one kind at a time; they reset when the kind changes).
    var cache = null, f = { q: '', picks: {}, sort: 'votes' };
    var nameIn = el.querySelector('[data-vem-name]'), sortSel = el.querySelector('[data-vem-sort]'), chips = el.querySelector('[data-vem-chips]');
    var pop = el.querySelector('.vem-pop'), fbtn = el.querySelector('[data-vem-fbtn]'), facetsEl = el.querySelector('[data-vem-facets]');
    function facets() { return FACETS[type] || []; }
    function facetOf(k) { return facets().filter(function (x) { return x.key === k.split(':')[0]; })[0]; }
    function labelOf(k) { var fc = facetOf(k), v = k.split(':')[1]; var c = fc && fc.choices.filter(function (x) { return x[0] === v; })[0]; return c ? c[1] : v; }
    function onPicks() { return Object.keys(f.picks).filter(function (k) { return f.picks[k]; }); }
    function passes(l) {
      var on = onPicks();
      for (var i = 0, fs = facets(); i < fs.length; i++) {
        var mine = on.filter(function (k) { return k.split(':')[0] === fs[i].key; });
        if (mine.length && mine.indexOf(fs[i].key + ':' + fs[i].of(l)) < 0) return false;
      }
      if (f.q) { var w = f.q.toLowerCase().split(/\s+/), n = String(l.name || '').toLowerCase(); for (var j = 0; j < w.length; j++) if (n.indexOf(w[j]) < 0) return false; }
      return true;
    }
    function paintFilters() {
      var rows = cache || [];
      facetsEl.innerHTML = facets().map(function (fc) {
        var here = {}; rows.forEach(function (l) { if (OURS.indexOf(l.slug) < 0) here[fc.of(l)] = 1; });
        var ch = fc.choices.filter(function (c) { return here[c[0]] || (fc.key + ':' + c[0]) in f.picks; });
        if (!ch.length) return '';
        return '<div class="vem-psec"><div class="vem-ph">' + esc(fc.label) + '</div><div class="vem-kindbox">' + ch.map(function (c) {
          var k = fc.key + ':' + c[0]; return '<button type="button" data-vem-pick="' + esc(k) + '" aria-pressed="' + (k in f.picks) + '">' + esc(c[1]) + '</button>';
        }).join('') + '</div></div>';
      }).join('');
      chips.innerHTML = Object.keys(f.picks).map(function (k) {
        var off = !f.picks[k], l = esc(labelOf(k));
        return '<span class="vem-chip' + (off ? ' off' : '') + '"><button type="button" class="lbl" data-vem-chip="' + esc(k) + '" aria-pressed="' + !off + '" title="' + (off ? 'Turn ' + l + ' back on' : 'Turn ' + l + ' off for now') + '">' + l + '</button>' +
          '<button type="button" class="x" data-vem-chipx="' + esc(k) + '" aria-label="Remove ' + l + '">&times;</button></span>';
      }).join('');
      sortSel.value = f.sort;
      var n = onPicks().length + (f.sort !== 'votes' ? 1 : 0), cnt = el.querySelector('.vem-fcount');
      cnt.textContent = n; cnt.hidden = !n;
    }
    // Every view is a link (Sean, 2026-11-01): the name search, the sort and the filters on ride in the address (?q= &sort= &f=
    // status:active,...), and the episode search as ?search=, so Share sends exactly this list. Read once, on the first load.
    var restored = opts.url === false;
    function readUrl(kind) {
      try {
        var p = new URLSearchParams(location.search);
        f.q = (p.get('q') || '').trim(); nameIn.value = f.q;
        var so = p.get('sort'); if (so && sortsFor(kind).some(function (o) { return o[0] === so; })) f.sort = so;
        (p.get('f') || '').split(',').forEach(function (k) { if (k && facetOf(k)) f.picks[k] = true; });
        var se = (p.get('search') || '').trim(); if (se && kind === 'podcasts') { input.value = se; setTimeout(function () { input.dispatchEvent(new Event('input')); }, 0); }
      } catch (e) {}
    }
    function writeUrl() {
      if (opts.url === false || !restored) return;
      try {
        var u = new URL(location.href), p = u.searchParams;
        ['q', 'sort', 'f', 'search'].forEach(function (k) { p.delete(k); });
        if (f.q) p.set('q', f.q);
        if (f.sort !== 'votes') p.set('sort', f.sort);
        if (onPicks().length) p.set('f', onPicks().join(','));
        if (input.value.trim() && type === 'podcasts') p.set('search', input.value.trim());
        var next = u.pathname + (p.toString() ? '?' + p.toString() : '') + u.hash;
        if (next !== location.pathname + location.search + location.hash) history.replaceState(history.state, '', next);
      } catch (e) {}
    }
    function drawTop() {
      paintFilters();
      writeUrl();
      if (!cache) return;
      var top = rank(cache.filter(passes), f.sort);
      if (!top.length) { grid.innerHTML = '<p class="vem-note">' + (onPicks().length || f.q ? 'Nothing matches these filters.' : 'Nothing here yet.') + '</p>'; return; }
      grid.innerHTML = top.map(function (l, i) { return window.VERegionDirectory ? VERegionDirectory.card(l, i) : ''; }).join('');
      if (window.VERegionDirectory) VERegionDirectory.wire(grid.parentNode, opts.onOpenListing || null);
    }
    var closePop = function () { pop.hidden = true; fbtn.setAttribute('aria-expanded', 'false'); };
    fbtn.addEventListener('click', function () { var open = pop.hidden; pop.hidden = !open; fbtn.setAttribute('aria-expanded', open ? 'true' : 'false'); if (opts.onInteract) opts.onInteract(); });
    pop.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { closePop(); fbtn.focus(); } });
    el.querySelector('[data-vem-done]').addEventListener('click', function () { closePop(); fbtn.focus(); });
    el.querySelector('[data-vem-reset]').addEventListener('click', function () { f.picks = {}; f.sort = 'votes'; drawTop(); });
    sortSel.addEventListener('change', function () { f.sort = sortSel.value; drawTop(); });
    facetsEl.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-vem-pick]'); if (!b) return;
      var k = b.getAttribute('data-vem-pick'); if (k in f.picks) delete f.picks[k]; else f.picks[k] = true; drawTop();
    });
    chips.addEventListener('click', function (ev) {
      var x = ev.target.closest('[data-vem-chipx]'), t = ev.target.closest('[data-vem-chip]');
      if (x) { delete f.picks[x.getAttribute('data-vem-chipx')]; drawTop(); }
      else if (t) { var k = t.getAttribute('data-vem-chip'); f.picks[k] = !f.picks[k]; drawTop(); }
    });
    var nameTimer;
    nameIn.addEventListener('input', function () { clearTimeout(nameTimer); nameTimer = setTimeout(function () { f.q = nameIn.value.trim(); drawTop(); }, 150); });

    // Search our episodes (ve_pulse_content, the same search the old /podcast page had).
    var input = el.querySelector('input[type="search"]'), results = el.querySelector('[data-vem-results]'), timer = null;
    input.addEventListener('focus', function () { if (opts.onInteract) opts.onInteract(); });
    input.addEventListener('input', function () {
      clearTimeout(timer);
      var q = input.value.trim();
      writeUrl();
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
