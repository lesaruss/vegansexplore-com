/* VE Region Directory — shared, reusable component
   Mimics the feel of /directory (category tabs, subcat pills, one unified sorted/filtered list
   per category, real listing links, votes) but scoped to a single region's real listings.
   Used by each /communities/[city]/index.html page. Self-contained: injects its own CSS,
   fetches real data from public.listings, and never sends the visitor to the unscoped /directory.
*/
(function () {
  var SUPABASE_URL = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';

  var CAT_MAP = {
    'Restaurants': 'food', 'Bakeries & Cafes': 'food', 'Food Brands': 'food', 'Catering': 'food', 'Meal Prep': 'food',
    'Brands': 'products', 'Beauty and Personal Care': 'products', 'Clothing and Fashion': 'products',
    'E-Commerce & Marketplaces': 'products', 'Fitness and Athletics': 'products',
    'AI & Automation': 'services', 'Web & Development': 'services', 'Marketing & Growth': 'services',
    'Health and Wellness': 'services', 'Business Operations': 'services', 'Branding & Creative Assets': 'services',
    'Coaches and Consultants': 'services', 'Content Creation & Media': 'services',
    'Community Partner': 'community', 'Nonprofits': 'community',
    'Events and Catering': 'events',
    'Media': 'media', 'Uncategorized': 'media'
  };

  var CAT_CONFIG = [
    { key: 'food', label: 'Food', hasVF: true,
      icon: '<svg fill="none" height="13" stroke="currentColor" stroke-linecap="round" stroke-width="2.2" viewBox="0 0 24 24" width="13"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2"></path><path d="M18 2v4"></path><path d="M21 8a3 3 0 01-3 3 3 3 0 01-3-3"></path></svg>',
      subcats: ['Restaurants', 'Bakeries & Cafes', 'Food Brands', 'Catering', 'Meal Prep'] },
    { key: 'products', label: 'Products', hasVF: false,
      icon: '<svg fill="none" height="13" stroke="currentColor" stroke-linecap="round" stroke-width="2.2" viewBox="0 0 24 24" width="13"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path><line x1="3" x2="21" y1="6" y2="6"></line><path d="M16 10a4 4 0 01-8 0"></path></svg>',
      subcats: ['Beauty and Personal Care', 'Clothing and Fashion', 'E-Commerce & Marketplaces', 'Fitness and Athletics', 'Brands'] },
    { key: 'services', label: 'Services', hasVF: false,
      icon: '<svg fill="none" height="13" stroke="currentColor" stroke-linecap="round" stroke-width="2.2" viewBox="0 0 24 24" width="13"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path></svg>',
      subcats: ['AI & Automation', 'Web & Development', 'Marketing & Growth', 'Health and Wellness', 'Business Operations', 'Branding & Creative Assets', 'Coaches and Consultants', 'Content Creation & Media'] },
    { key: 'community', label: 'Community', hasVF: false,
      icon: '<svg fill="none" height="13" stroke="currentColor" stroke-linecap="round" stroke-width="2.2" viewBox="0 0 24 24" width="13"><circle cx="12" cy="12" r="10"></circle><line x1="2" x2="22" y1="12" y2="12"></line><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"></path></svg>',
      subcats: ['Community Partner', 'Nonprofits'] }
  ];

  var CSS = ''
    + '.vrd-root{font-family:Montserrat,sans-serif}'
    + '.vrd-root .cat-tabs{display:flex;gap:0;border-bottom:2px solid #e8e8e8;flex-wrap:wrap}'
    + '.vrd-root .cat-tab{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:11px 20px;border:none;background:transparent;color:#888;cursor:pointer;font-family:Montserrat,sans-serif;border-bottom:2px solid transparent;margin-bottom:-2px;transition:color .15s,border-color .15s;white-space:nowrap}'
    + '.vrd-root .cat-tab.active{color:#1a1a1a;border-bottom-color:#5EC47A}'
    + '.vrd-root .cat-tab:hover:not(.active){color:#555}'
    + '.vrd-root .board-panel{display:none;padding-top:16px}'
    + '.vrd-root .board-panel.active{display:block}'
    + '.vrd-root .subcat-pills{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #eee}'
    + '.vrd-root .subcat-pill{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:5px 14px;border-radius:20px;border:1px solid #ddd;background:#fff;color:#888;cursor:pointer;font-family:Montserrat,sans-serif;transition:all .15s}'
    + '.vrd-root .subcat-pill.sc-active{background:#1a1a1a;color:#fff;border-color:#1a1a1a}'
    + '.vrd-root .subcat-pill:hover:not(.sc-active){border-color:#5EC47A;color:#2d7a4f}'
    + '.vrd-root .perpage-select{font-family:Montserrat,sans-serif;font-size:11px;font-weight:700;letter-spacing:.06em;color:#555;background:#fff;border:1px solid #ddd;border-radius:20px;padding:7px 28px 7px 14px;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\'%3E%3Cpath d=\'M0 0l5 6 5-6z\' fill=\'%23888\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;flex-shrink:0;margin-left:auto}'
    + '.vrd-root .perpage-select:focus{outline:2px solid #5EC47A;outline-offset:1px}'
    + '.vrd-root .sort-bar{display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap}'
    + '.vrd-root .geo-label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#aaa;margin-left:8px}'
    + '.vrd-root .sort-label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#aaa}'
    + '.vrd-root .sort-select{font-family:Montserrat,sans-serif;font-size:11px;font-weight:700;color:#555;background:#fff;border:1px solid #ddd;border-radius:20px;padding:5px 26px 5px 12px;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\'%3E%3Cpath d=\'M0 0l5 6 5-6z\' fill=\'%23888\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center}'
    + '.vrd-root .sort-select:focus{outline:2px solid #5EC47A;outline-offset:1px}'
    + '.vrd-root .rank-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}'
    + '.vrd-root .rank-card{background:#fff;border:1px solid #e8e8e8;border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:border-color .15s}'
    + '.vrd-root .rank-card:hover{border-color:#5EC47A}'
    + '.vrd-root .rank-num-col{display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;min-width:32px}'
    + '.vrd-root .rank-num{font-size:20px;font-weight:900;color:#e0e0e0;line-height:1;text-align:center}'
    + '.vrd-root .rank-num.top3{color:#5EC47A}'
    + '.vrd-root .rank-pts{font-size:8px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap;text-align:center}'
    + '.vrd-root .rank-info{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:3px}'
    + '.vrd-root .rank-name{font-size:14px;font-weight:800;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2}'
    + '.vrd-root .rank-meta{font-size:12px;font-weight:600;color:#555;line-height:1}'
    + '.vrd-root .rank-subcat{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#aaa;margin-top:2px}'
    + '.vrd-root .rank-right{display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;gap:6px;flex-shrink:0;height:60px}'
    + '.vrd-root .vote-count{font-size:16px;font-weight:900;color:#1a1a1a;line-height:1}'
    + '.vrd-root .vote-label{font-size:9px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#aaa}'
    + '.vrd-root .vote-btn{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:6px 12px;border-radius:4px;background:#f0faf4;color:#2d7a4f;border:1px solid #b6e5c8;cursor:pointer;font-family:Montserrat,sans-serif;white-space:nowrap}'
    + '.vrd-root .vote-btn:hover{background:#5EC47A;color:#000;border-color:#5EC47A}'
    + '.vrd-root .av{border-radius:10px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}'
    + '.vrd-root .online-badge{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:3px 8px;border-radius:10px;background:#e8f8ef;color:#2d7a4f;border:1px solid #b6e5c8}'
    + '.vrd-root .online-badge::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:#5EC47A}'
    + '.vrd-root .vrd-empty{grid-column:1/-1;padding:48px 24px;text-align:center;color:#aaa;font-size:13px;font-weight:600}'
    + '@media(max-width:768px){.vrd-root .rank-grid{grid-template-columns:1fr}.vrd-root .cat-tab{font-size:10px;padding:10px 12px}.vrd-root .perpage-select{margin-left:0}}';

  function injectStyleOnce() {
    if (document.getElementById('vrd-style')) return;
    var s = document.createElement('style');
    s.id = 'vrd-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function buildBar(cat, config) {
    var sortHtml = '<span class="sort-label">Sort by</span>' +
      '<select aria-label="Sort listings" class="sort-select" data-vrd-sort="' + cat.key + '">' +
      '<option value="votes">Most Votes</option><option value="az">A to Z</option><option value="recent">Most Recent</option><option value="added">First Added</option>' +
      '</select>';
    var geoHtml = '';
    if (config && config.counties) {
      geoHtml = '<span class="geo-label">Filter by</span>' +
        '<select aria-label="Filter by county" class="sort-select" data-vrd-county="' + cat.key + '">' +
        '<option value="">All Counties</option></select>' +
        '<select aria-label="Filter by city" class="sort-select" data-vrd-city="' + cat.key + '" style="display:none">' +
        '<option value="">All Cities</option></select>';
    } else {
      geoHtml = '<span class="geo-label">Filter by</span>' +
        '<select aria-label="Filter by city" class="sort-select" data-vrd-city="' + cat.key + '">' +
        '<option value="">All Cities</option></select>';
    }
    var typeOptions = '<option value="">All</option>' +
      (cat.hasVF ? '<option value="vf">Vegan Friendly</option>' : '') +
      '<option value="online">Online</option>' +
      '<option value="closed">Closed</option>';
    var typeHtml = '<span class="geo-label">Type</span>' +
      '<select aria-label="Filter by type" class="sort-select" data-vrd-type="' + cat.key + '">' + typeOptions + '</select>';
    var perpageHtml = '<select aria-label="Results per page" class="perpage-select" data-vrd-perpage="' + cat.key + '">' +
      '<option value="24">Show 24</option><option value="48">Show 48</option><option value="111" selected>Show 111</option>' +
      '</select>';
    return '<div class="sort-bar">' + sortHtml + geoHtml + typeHtml + perpageHtml + '</div>';
  }

  function skeletonForCat(cat, config) {
    var subcatBtns = '<button class="subcat-pill sc-active" data-vrd-subcat="All">All</button>' +
      cat.subcats.map(function (s) { return '<button class="subcat-pill" data-vrd-subcat="' + esc(s) + '">' + esc(s) + '</button>'; }).join('');

    return '<div class="board-panel' + (cat.key === 'food' ? ' active' : '') + '" id="board-' + cat.key + '">' +
      '<div class="subcat-pills">' + subcatBtns + '</div>' +
      buildBar(cat, config) +
      '<div class="rank-grid" id="' + cat.key + '-grid"></div>' +
      '</div>';
  }

  function renderSkeleton(config) {
    var tabs = '<div class="cat-tabs" role="tablist">' +
      CAT_CONFIG.map(function (c) {
        return '<button class="cat-tab' + (c.key === 'food' ? ' active' : '') + '" data-vrd-tab="' + c.key + '" role="tab">' + c.icon + ' ' + c.label + '</button>';
      }).join('') + '</div>';
    var panels = CAT_CONFIG.map(function (c) { return skeletonForCat(c, config); }).join('');
    return '<div class="vrd-root">' + tabs + panels + '</div>';
  }

  function makeAvatar(l) {
    var initial = ((l.name || 'V').charAt(0)).toUpperCase();
    var color = l.color || '#3A9B3E';
    var fallback = '<div class="av" style="width:60px;height:60px;min-width:60px;background:' + esc(color) + ';display:none;align-items:center;justify-content:center"><span style="font-size:24px;font-weight:900;color:#fff;line-height:1">' + esc(initial) + '</span></div>';
    if (l.logo_url) {
      return '<img class="vrd-logo" src="' + esc(l.logo_url) + '" style="width:60px;height:60px;min-width:60px;object-fit:cover;border-radius:10px" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' + fallback;
    }
    return '<div class="av" style="width:60px;height:60px;min-width:60px;background:' + esc(color) + ';display:flex;align-items:center;justify-content:center"><span style="font-size:24px;font-weight:900;color:#fff;line-height:1">' + esc(initial) + '</span></div>';
  }

  function cardMeta(l) {
    if (!l.address_city && !l.address_state) return '<span class="online-badge">Online</span>';
    return esc(l.address_city || l.address_state || '');
  }

  function makeBrowseCard(l, idx, type) {
    var votes = (l.favorites_count || 0) + (l.likes_count || 0);
    var subcat = l.category || '';
    return '<div class="rank-card" data-name="' + esc(l.name) + '" data-votes="' + votes + '" data-idx="' + idx + '" data-subcat="' + esc(subcat) + '" data-slug="' + esc(l.slug || '') + '" data-city="' + esc(l.address_city || '') + '" data-listing-type="' + esc(type || 'regular') + '">' +
      makeAvatar(l) +
      '<div class="rank-info"><div class="rank-name">' + esc(l.name) + '</div>' +
      '<div class="rank-meta">' + cardMeta(l) + '</div>' +
      '<div class="rank-subcat">' + esc(l.category || '') + '</div></div>' +
      '<div class="rank-right"><span class="vote-count">' + votes.toLocaleString() + '</span><span class="vote-label">votes</span><button class="vote-btn">+ Vote</button></div>' +
      '</div>';
  }

  function makeClosedCard(l, idx) {
    var votes = (l.favorites_count || 0) + (l.likes_count || 0);
    var subcat = l.category || '';
    return '<div class="rank-card" data-name="' + esc(l.name) + '" data-votes="' + votes + '" data-idx="' + idx + '" data-subcat="' + esc(subcat) + '" data-slug="' + esc(l.slug || '') + '" data-city="' + esc(l.address_city || '') + '" data-listing-type="closed" style="opacity:.7">' +
      makeAvatar(l) +
      '<div class="rank-info"><div class="rank-name" style="color:#888">' + esc(l.name) + '</div>' +
      '<div class="rank-meta">' + cardMeta(l) + '</div>' +
      '<div class="rank-subcat"><span style="font-size:9px;font-weight:700;letter-spacing:.08em;color:#c00;border:1px solid #c00;border-radius:20px;padding:2px 8px;text-transform:uppercase">Permanently Closed</span></div></div>' +
      '<div class="rank-right"><span class="vote-count" style="color:#bbb">' + votes.toLocaleString() + '</span><span class="vote-label">votes</span></div>' +
      '</div>';
  }

  function isOnline(l) { return !l.address_city && !l.address_state; }

  function bindCardClicks(root) {
    root.querySelectorAll('.rank-card[data-slug]').forEach(function (card) {
      if (card.dataset.clickbound) return;
      card.dataset.clickbound = '1';
      var slug = card.dataset.slug;
      if (!slug) return;
      card.addEventListener('click', function (e) {
        if (e.target.classList.contains('vote-btn') || e.target.closest('.vote-btn')) return;
        window.location = '/directory/' + slug;
      });
    });
  }

  function bindVoteButtons(root) {
    root.querySelectorAll('.vote-btn').forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (this.dataset.voted) return;
        this.dataset.voted = '1';
        var r = this.closest('.rank-right');
        var el = r ? r.querySelector('.vote-count') : null;
        if (el) { var n = parseInt(el.textContent.replace(/,/g, '')); el.textContent = (n + 1).toLocaleString(); }
        this.textContent = 'Voted';
        this.style.background = '#5EC47A'; this.style.color = '#000'; this.style.borderColor = '#5EC47A';
        this.disabled = true;
      });
    });
  }

  function populateGeoBar(barEl, config, listings) {
    if (!barEl) return;
    var countySel = barEl.querySelector('[data-vrd-county]');
    var citySel = barEl.querySelector('[data-vrd-city]');
    if (!countySel && !citySel) return;
    var seen = {};
    var distinctCities = [];
    listings.forEach(function (l) {
      if (l.address_city && !seen[l.address_city]) { seen[l.address_city] = true; distinctCities.push(l.address_city); }
    });
    distinctCities.sort();
    if (countySel && config.counties) {
      var pruned = {};
      Object.keys(config.counties).forEach(function (cn) {
        var cities = config.counties[cn].filter(function (c) { return seen[c]; });
        if (cities.length) pruned[cn] = cities;
      });
      countySel.innerHTML = '<option value="">All Counties</option>' +
        Object.keys(pruned).map(function (cn) { return '<option value="' + esc(cn) + '">' + esc(cn) + '</option>'; }).join('');
      countySel.dataset.cities = JSON.stringify(pruned);
      countySel.value = '';
      if (citySel) { citySel.innerHTML = '<option value="">All Cities</option>'; citySel.style.display = 'none'; citySel.value = ''; }
    } else if (citySel) {
      citySel.innerHTML = '<option value="">All Cities</option>' +
        distinctCities.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('');
      citySel.value = '';
    }
  }

  function populateGrids(root, config, approved, closed) {
    closed = closed || [];
    var tabs = {}, closedTabs = {};
    CAT_CONFIG.forEach(function (c) { tabs[c.key] = []; closedTabs[c.key] = []; });

    approved.forEach(function (l) {
      var tab = CAT_MAP[l.category] || 'services';
      if (tabs[tab]) tabs[tab].push(l);
    });
    closed.forEach(function (l) {
      var tab = CAT_MAP[l.category] || 'services';
      if (closedTabs[tab]) closedTabs[tab].push(l);
    });

    CAT_CONFIG.forEach(function (cfg) {
      var tab = cfg.key;
      var all = tabs[tab];
      all.sort(function (a, b) { return ((b.favorites_count || 0) + (b.likes_count || 0)) - ((a.favorites_count || 0) + (a.likes_count || 0)); });

      var cards = all.map(function (l, idx) {
        var type = (cfg.hasVF && l.vegan_status === 'vegan_friendly') ? 'vf' : (isOnline(l) ? 'online' : 'regular');
        return makeBrowseCard(l, idx, type);
      }).join('');
      var closedCards = closedTabs[tab].map(function (l, idx) { return makeClosedCard(l, idx); }).join('');

      var grid = root.querySelector('#' + tab + '-grid');
      if (grid) grid.innerHTML = (cards + closedCards) || '<p class="vrd-empty vrd-empty-static">No listings yet in this category.</p>';

      populateGeoBar(root.querySelector('#board-' + tab + ' .sort-bar'), config, all);
    });

    bindVoteButtons(root);
    bindCardClicks(root);

    root.querySelectorAll('.board-panel').forEach(function (panel) { applyPanelFilters(panel, config); });
  }

  function currentSubcat(panel) {
    var active = panel.querySelector('.subcat-pill.sc-active');
    return active ? active.getAttribute('data-vrd-subcat') : 'All';
  }

  function applyPanelFilters(panel, state) {
    var special = currentSubcat(panel);
    var catKey = panel.id.replace('board-', '');
    var grid = panel.querySelector('#' + catKey + '-grid');
    if (!grid) return;
    var bar = panel.querySelector('.sort-bar');
    var countySel = bar ? bar.querySelector('[data-vrd-county]') : null;
    var citySel = bar ? bar.querySelector('[data-vrd-city]') : null;
    var typeSel = bar ? bar.querySelector('[data-vrd-type]') : null;
    var county = countySel ? countySel.value : '';
    var city = citySel ? citySel.value : '';
    var type = typeSel ? typeSel.value : '';
    var countyMap = {};
    if (countySel) { try { countyMap = JSON.parse(countySel.dataset.cities || '{}'); } catch (e) {} }
    var cards = grid.querySelectorAll('.rank-card');
    var visibleCount = 0;
    cards.forEach(function (card) {
      var subOk = (special === 'All') || (card.dataset.subcat === special);
      var geoOk = true;
      if (city) { geoOk = card.dataset.city === city; }
      else if (county && countyMap[county]) { geoOk = countyMap[county].indexOf(card.dataset.city) > -1; }
      var typeOk = type ? (card.dataset.listingType === type) : (card.dataset.listingType !== 'closed');
      var ok = subOk && geoOk && typeOk;
      card.style.display = ok ? '' : 'none';
      if (ok) visibleCount++;
    });
    if (cards.length) {
      var emptyText = { vf: 'No vegan-friendly listings yet.', online: 'No online-only listings for this region yet.', closed: 'No closed listings recorded.' }[type] || 'No listings match this filter yet.';
      var msg = grid.querySelector('.vrd-empty-dynamic');
      if (visibleCount === 0) {
        if (!msg) { msg = document.createElement('p'); msg.className = 'vrd-empty vrd-empty-dynamic'; grid.appendChild(msg); }
        msg.textContent = emptyText;
        msg.style.display = '';
      } else if (msg) {
        msg.style.display = 'none';
      }
    }
  }

  function wireControls(root, state) {
    root.querySelectorAll('[data-vrd-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        root.querySelectorAll('.cat-tab').forEach(function (t) { t.classList.remove('active'); });
        root.querySelectorAll('.board-panel').forEach(function (p) { p.classList.remove('active'); });
        btn.classList.add('active');
        root.querySelector('#board-' + btn.getAttribute('data-vrd-tab')).classList.add('active');
      });
    });

    root.querySelectorAll('[data-vrd-subcat]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var panel = btn.closest('.board-panel');
        panel.querySelectorAll('.subcat-pill').forEach(function (p) { p.classList.remove('sc-active'); });
        btn.classList.add('sc-active');
        applyPanelFilters(panel, state);
      });
    });

    root.querySelectorAll('[data-vrd-county]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var bar = sel.closest('.sort-bar');
        var citySel = bar ? bar.querySelector('[data-vrd-city]') : null;
        var county = sel.value;
        var map = {};
        try { map = JSON.parse(sel.dataset.cities || '{}'); } catch (e) {}
        var cities = map[county] || [];
        if (citySel) {
          citySel.innerHTML = '<option value="">All Cities</option>' +
            cities.map(function (c) { return '<option value="' + c.replace(/"/g, '&quot;') + '">' + c + '</option>'; }).join('');
          citySel.value = '';
          citySel.style.display = county ? '' : 'none';
        }
        var panel = sel.closest('.board-panel');
        applyPanelFilters(panel, state);
      });
    });

    root.querySelectorAll('[data-vrd-city]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var panel = sel.closest('.board-panel');
        applyPanelFilters(panel, state);
      });
    });

    root.querySelectorAll('[data-vrd-type]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var panel = sel.closest('.board-panel');
        applyPanelFilters(panel, state);
      });
    });

    root.querySelectorAll('[data-vrd-perpage]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var cat = sel.getAttribute('data-vrd-perpage');
        var grid = root.querySelector('#' + cat + '-grid');
        if (!grid) return;
        var n = parseInt(sel.value);
        var shown = 0;
        grid.querySelectorAll('.rank-card').forEach(function (c) {
          if (c.style.display === 'none') return;
          shown++;
          c.style.opacity = shown <= n ? '1' : '0.25';
          c.style.pointerEvents = shown <= n ? '' : 'none';
        });
      });
    });

    root.querySelectorAll('[data-vrd-sort]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var cat = sel.getAttribute('data-vrd-sort');
        var grid = root.querySelector('#' + cat + '-grid');
        if (!grid) return;
        var order = sel.value;
        var cards = Array.prototype.slice.call(grid.querySelectorAll('.rank-card'));
        cards.sort(function (a, b) {
          if (order === 'votes') return parseInt(b.dataset.votes) - parseInt(a.dataset.votes);
          if (order === 'az') return a.dataset.name.localeCompare(b.dataset.name);
          if (order === 'recent') return parseInt(b.dataset.idx) - parseInt(a.dataset.idx);
          if (order === 'added') return parseInt(a.dataset.idx) - parseInt(b.dataset.idx);
          return 0;
        });
        cards.forEach(function (c) { grid.appendChild(c); });
      });
    });
  }

  function fetchAll(root, config, offset, acc) {
    acc = acc || [];
    var url = SUPABASE_URL + '/rest/v1/listings?select=id,slug,name,category,logo_url,favorites_count,likes_count,is_featured,address_city,address_state,color,vegan_status&status=eq.approved&limit=1000&offset=' + (offset || 0);
    fetch(url, { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        acc = acc.concat(data || []);
        if (data && data.length === 1000) { fetchAll(root, config, offset + 1000, acc); }
        else {
          var approved = acc.filter(config.matchListing);
          fetchClosed(root, config, approved);
        }
      })
      .catch(function (e) {
        console.error('VE Region Directory load error', e);
        root.querySelectorAll('.rank-grid').forEach(function (g) { g.innerHTML = '<p class="vrd-empty">Couldn\'t load the directory right now.</p>'; });
      });
  }

  function fetchClosed(root, config, approved) {
    var url = SUPABASE_URL + '/rest/v1/listings?select=id,slug,name,category,logo_url,favorites_count,likes_count,is_featured,address_city,address_state,color&status=eq.closed&limit=1000';
    fetch(url, { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } })
      .then(function (r) { return r.json(); })
      .then(function (data) { populateGrids(root, config, approved, (data || []).filter(config.matchListing)); })
      .catch(function () { populateGrids(root, config, approved, []); });
  }

  window.VERegionDirectory = {
    init: function (config) {
      var root = document.getElementById(config.mount);
      if (!root) return;
      injectStyleOnce();
      root.innerHTML = renderSkeleton(config);
      wireControls(root, config);
      fetchAll(root, config);
    }
  };
})();
