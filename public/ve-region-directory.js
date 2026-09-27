/* VE Region Directory — shared, reusable component
   Mimics the feel of /directory (category tabs, subcat pills, one unified sorted/filtered list
   per category, real listing links, votes) but scoped to a single region's real listings.
   Used by each /communities/[city]/index.html page. Self-contained: injects its own CSS,
   fetches real data from public.listings, and never sends the visitor to the unscoped /directory.
*/
(function () {
  var SUPABASE_URL = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';

  // Category map (2026-09-07, Logan, Sean direction): Services was a catch-all
  // that mixed real local service providers in with SaaS tools Sean uses
  // personally (ElevenLabs, Canva, Cloudflare, Calendly, etc.). Sean's call:
  // Services on Vegans Explore means local service providers who register and
  // get listed -- accountants, chiropractors, dentists, doctors, plumbers, and
  // the like. The software/agency categories below are earmarked for the
  // future LESARUSS AI directory instead (their `listings` rows are tagged
  // 'lesaruss-ai-directory-candidate', not deleted) and route to 'lesaruss_ai',
  // a tab key with no entry in CAT_CONFIG -- same pattern already used for
  // 'events'/'media' below -- so they simply don't render on any VE region
  // page rather than being lost. Community stays nonprofits (+ existing
  // community-partner orgs); Products stays products.
  // Sections (Sean, 2026-09-27): five main sections, each with sub-sections that make sense
  // for it. listings.category holds the sub-section. Keep in step with SECTIONS in
  // /public/ve-listing-admin.js and CATEGORIES in supabase/functions/ve-claims.
  // AI & Automation and the other agency sub-sections sit under Services now, but the SaaS
  // tools tagged 'lesaruss-ai-directory-candidate' (2026-09-07) stay off the VE hubs.
  var CAT_MAP = {
    'Restaurants': 'food', 'Bakeries & Cafes': 'food', 'Food Trucks & Vendors': 'food', 'Markets': 'food',
    'Food Brands': 'food', 'Catering': 'food', 'Meal Prep': 'food',
    'Brands': 'products', 'Clothing and Fashion': 'products', 'Beauty and Personal Care': 'products',
    'Fitness and Athletics': 'products', 'E-Commerce & Marketplaces': 'products',
    'Health and Wellness': 'services', 'Coaches and Consultants': 'services', 'Marketing & Growth': 'services',
    'Branding & Creative Assets': 'services', 'Content Creation & Media': 'services', 'Web & Development': 'services',
    'AI & Automation': 'services', 'Business Operations': 'services',
    'Podcasts': 'media', 'YouTube': 'media', 'News Outlets': 'media', 'Documentaries & Films': 'media', 'Books': 'media', 'Media': 'media',
    'Community Partner': 'community', 'Nonprofits': 'community', 'Events': 'community',
    'Uncategorized': 'hidden'
  };

  var CAT_CONFIG = [
    { key: 'food', label: 'Food', hasVF: true,
      icon: '<svg fill="none" height="13" stroke="currentColor" stroke-linecap="round" stroke-width="2.2" viewBox="0 0 24 24" width="13"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2"></path><path d="M18 2v4"></path><path d="M21 8a3 3 0 01-3 3 3 3 0 01-3-3"></path></svg>',
      subcats: ['Restaurants', 'Bakeries & Cafes', 'Food Trucks & Vendors', 'Markets', 'Food Brands', 'Catering', 'Meal Prep'] },
    { key: 'products', label: 'Products', hasVF: false,
      icon: '<svg fill="none" height="13" stroke="currentColor" stroke-linecap="round" stroke-width="2.2" viewBox="0 0 24 24" width="13"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path><line x1="3" x2="21" y1="6" y2="6"></line><path d="M16 10a4 4 0 01-8 0"></path></svg>',
      subcats: ['Brands', 'Clothing and Fashion', 'Beauty and Personal Care', 'Fitness and Athletics', 'E-Commerce & Marketplaces'] },
    { key: 'services', label: 'Services', hasVF: false,
      icon: '<svg fill="none" height="13" stroke="currentColor" stroke-linecap="round" stroke-width="2.2" viewBox="0 0 24 24" width="13"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path></svg>',
      subcats: ['Health and Wellness', 'Coaches and Consultants', 'Marketing & Growth', 'Branding & Creative Assets', 'Content Creation & Media', 'Web & Development', 'AI & Automation', 'Business Operations'] },
    { key: 'media', label: 'Media', hasVF: false,
      icon: '<svg fill="none" height="13" stroke="currentColor" stroke-linecap="round" stroke-width="2.2" viewBox="0 0 24 24" width="13"><rect x="9" y="2" width="6" height="12" rx="3"></rect><path d="M5 10a7 7 0 0014 0"></path><line x1="12" x2="12" y1="17" y2="22"></line></svg>',
      subcats: ['Podcasts', 'YouTube', 'News Outlets', 'Documentaries & Films', 'Books', 'Media'] },
    { key: 'community', label: 'Community', hasVF: false,
      icon: '<svg fill="none" height="13" stroke="currentColor" stroke-linecap="round" stroke-width="2.2" viewBox="0 0 24 24" width="13"><circle cx="12" cy="12" r="10"></circle><line x1="2" x2="22" y1="12" y2="12"></line><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"></path></svg>',
      subcats: ['Community Partner', 'Nonprofits', 'Events'] }
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
    + '.vrd-root .subcat-pills .vrd-search-wrap{position:relative;margin-left:auto;flex:0 1 240px;min-width:160px;max-width:260px}'
    + '.vrd-root .vrd-search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#999;display:flex;pointer-events:none}'
    + '.vrd-root .vrd-search-input{width:100%;padding:8px 14px 8px 32px;border:1.5px solid #ddd;border-radius:20px;font-size:12px;font-family:Montserrat,sans-serif;color:#1a1a1a;background:#fff;transition:border-color .15s}'
    + '.vrd-root .vrd-search-input:focus{outline:none;border-color:#5EC47A}'
    + '@media(max-width:640px){.vrd-root .subcat-pills .vrd-search-wrap{flex:1 1 100%;margin-left:0;max-width:none;order:99}}'
    + '.vrd-root .perpage-select{font-family:Montserrat,sans-serif;font-size:11px;font-weight:700;letter-spacing:.06em;color:#555;background:#fff;border:1px solid #ddd;border-radius:20px;padding:7px 28px 7px 14px;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\'%3E%3Cpath d=\'M0 0l5 6 5-6z\' fill=\'%23888\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;flex-shrink:0;margin-left:auto}'
    + '.vrd-root .perpage-select:focus{outline:2px solid #5EC47A;outline-offset:1px}'
    + '.vrd-root .sort-bar{display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap}'
    + '.vrd-root .geo-label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#aaa;margin-left:8px}'
    + '.vrd-root .sort-label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#aaa}'
    + '.vrd-root .sort-select{font-family:Montserrat,sans-serif;font-size:11px;font-weight:700;color:#555;background:#fff;border:1px solid #ddd;border-radius:20px;padding:5px 26px 5px 12px;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\'%3E%3Cpath d=\'M0 0l5 6 5-6z\' fill=\'%23888\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center}'
    + '.vrd-root .sort-select:focus{outline:2px solid #5EC47A;outline-offset:1px}'
    + '.vrd-root .rank-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}'
    /* min-width:0 is load-bearing: the card is a grid item, and without it the
       grid track's automatic minimum grows to the card's min-content (the
       nowrap .rank-name forces that ~430px wide), so on a phone the track --
       and the card -- overflow the column and get clipped on the right. Zeroing
       the item's min-width lets the track shrink to the container so the name's
       ellipsis engages instead. Pairs with minmax(0,1fr) in the mobile grid. */
    + '.vrd-root .rank-card{background:#fff;border:1px solid #e8e8e8;border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:border-color .15s;min-width:0}'
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
    + '.vrd-root .vrd-vegan{display:inline-block;margin-left:6px;font-size:9px;font-weight:800;letter-spacing:.06em;padding:1px 7px;border-radius:10px;vertical-align:1px}'
    + '.vrd-root .vrd-vegan-fully{background:#e3f6e7;color:#1f6b33}'
    + '.vrd-root .vrd-vegan-friendly{background:#f0f0f0;color:#555}'
    + '.vrd-root .vrd-vegan-options{background:#f5f1e8;color:#6b5a2e}'
    + '.vrd-root .vrd-verified{display:inline-flex;align-items:center;gap:3px;margin-left:6px;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:2px 7px;border-radius:10px;background:#1f5f22;color:#fff;vertical-align:2px;white-space:nowrap}'
    + '.vrd-root .vrd-temp{display:inline-block;margin-left:6px;font-size:9.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:2px 7px;border-radius:10px;background:#fdecea;color:#9b1c1c}'
    + '.vrd-root .rank-right:has(.vla-edit){height:auto}'
    + '.vrd-root .vrd-vetting{display:inline-block;margin-left:6px;font-size:9.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:2px 7px;border-radius:10px;background:#fff4e2;color:#6b3f00;white-space:nowrap}'
    + '.vrd-root .av{border-radius:10px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}'
    + '.vrd-root .online-badge{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:3px 8px;border-radius:10px;background:#e8f8ef;color:#2d7a4f;border:1px solid #b6e5c8}'
    + '.vrd-root .online-badge::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:#5EC47A}'
    + '.vrd-root .vrd-empty{grid-column:1/-1;padding:48px 24px;text-align:center;color:#aaa;font-size:13px;font-weight:600}'
    + '.vrd-root .vrd-pagination{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:20px;padding-top:16px}'
    + '.vrd-root .vrd-page-btn{font-family:Montserrat,sans-serif;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:8px 18px;border-radius:20px;border:1px solid #ddd;background:#fff;color:#1a1a1a;cursor:pointer;transition:border-color .15s}'
    + '.vrd-root .vrd-page-btn:hover:not(:disabled){border-color:#5EC47A;color:#2d7a4f}'
    + '.vrd-root .vrd-page-btn:disabled{opacity:.35;cursor:default}'
    + '.vrd-root .vrd-page-indicator{font-size:11px;font-weight:700;color:#888;letter-spacing:.04em}'
    + '@media(max-width:768px){.vrd-root .rank-grid{grid-template-columns:minmax(0,1fr)}.vrd-root .cat-tab{font-size:10px;padding:10px 12px}.vrd-root .perpage-select{margin-left:0}}';

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
    // How Vegan (Sean, 2026-09-27): let people keep to 100% Vegan places without asking anyone.
    var veganHtml = '<span class="geo-label">Vegan</span>' +
      '<select aria-label="Filter by how Vegan" class="sort-select" data-vrd-vegan="' + cat.key + '">' +
      '<option value="">All</option><option value="fully">100% Vegan only</option><option value="friendly">Vegan-friendly</option><option value="options">Vegan options</option></select>';
    var typeOptions = '<option value="">All</option>' +
      '<option value="online">Online</option>' +
      '<option value="closed">Closed</option>';
    var typeHtml = veganHtml + '<span class="geo-label">Type</span>' +
      '<select aria-label="Filter by type" class="sort-select" data-vrd-type="' + cat.key + '">' + typeOptions + '</select>';
    var perpageHtml = '<select aria-label="Results per page" class="perpage-select" data-vrd-perpage="' + cat.key + '">' +
      '<option value="24" selected>Show 24</option><option value="48">Show 48</option><option value="111">Show 111</option>' +
      '</select>';
    return '<div class="sort-bar">' + sortHtml + geoHtml + typeHtml + perpageHtml + '</div>';
  }

  // Per-category search (2026-09-07, Logan, Sean correction: he'd first
  // asked for one global search above the tabs, then realized "it's not
  // searching all of the items" -- it should only search the active
  // category -- so it lives on that category's own subcat-pills row,
  // shifted to the right, "flush underneath the actual tab."
  function skeletonForCat(cat, config) {
    var subcatBtns = '<button class="subcat-pill sc-active" data-vrd-subcat="All">All</button>' +
      cat.subcats.map(function (s) { return '<button class="subcat-pill" data-vrd-subcat="' + esc(s) + '">' + esc(s) + '</button>'; }).join('');
    var searchIcon = '<svg class="vrd-search-icon" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
    var searchHtml = '<div class="vrd-search-wrap">' + searchIcon +
      '<input type="text" class="vrd-search-input" data-vrd-search placeholder="Search ' + esc(cat.label) + '&hellip;" aria-label="Search ' + esc(cat.label) + ' listings">' +
      '</div>';

    return '<div class="board-panel' + (cat.key === 'food' ? ' active' : '') + '" id="board-' + cat.key + '">' +
      '<div class="subcat-pills">' + subcatBtns + searchHtml + '</div>' +
      buildBar(cat, config) +
      '<div class="rank-grid" id="' + cat.key + '-grid"></div>' +
      '<div class="vrd-pagination" id="' + cat.key + '-pagination"></div>' +
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

  // Every section a listing is in: its main category plus any the admin editor added.
  function sectionsOf(l) {
    var out = [l.category || ''];
    (l.extra_categories || []).forEach(function (c) { if (c && out.indexOf(c) < 0) out.push(c); });
    return out;
  }
  // How Vegan, as a filter key and a label on the card (fully Vegan also covers the older 'vegan').
  var VEGAN_KEY = { fully_vegan: 'fully', vegan: 'fully', vegan_friendly: 'friendly', vegan_options: 'options' };
  var VEGAN_LABEL = { fully: '100% Vegan', friendly: 'Vegan-friendly', options: 'Vegan options' };
  function veganTag(l) {
    var k = VEGAN_KEY[l.vegan_status]; if (!k) return '';
    return ' <span class="vrd-vegan vrd-vegan-' + k + '">' + VEGAN_LABEL[k] + '</span>';
  }
  // VE Verified (playbook ve-verified-tours-hunt): a live paid tier (3-day grace past renewal).
  // The badge also needs the VE visit (ve_verified); Plus gets priority placement from payment.
  function vTier(l) {
    if (!l.ve_verified_tier) return null;
    if (l.ve_verified_until && new Date(l.ve_verified_until).getTime() < Date.now() - 3 * 864e5) return null;
    return l.ve_verified_tier;
  }
  function isPlus(l) { return vTier(l) === 'plus'; }
  function verifiedTag(l) {
    var t = vTier(l); if (!t || !l.ve_verified) return '';
    return ' <span class="vrd-verified"><svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>' + (t === 'plus' ? 'VE Verified Plus' : 'VE Verified') + '</span>';
  }
  function byPriority(a, b) { return (isPlus(b) ? 1 : 0) - (isPlus(a) ? 1 : 0); }
  function adminBtn(l) { return ADMIN ? '<button type="button" class="vla-edit" data-vla="' + esc(l.id) + '" title="Admin only">Edit</button>' : ''; }

  function makeBrowseCard(l, idx, type) {
    var votes = (l.vote_count || 0);
    var subcat = sectionsOf(l).join('|');
    var temp = l.business_status === 'CLOSED_TEMPORARILY' ? ' <span class="vrd-temp">Temporarily closed</span>' : '';
    return '<div class="rank-card" data-name="' + esc(l.name) + '" data-votes="' + votes + '" data-idx="' + idx + '" data-subcat="' + esc(subcat) + '" data-vegan="' + (VEGAN_KEY[l.vegan_status] || '') + '" data-slug="' + esc(l.slug || '') + '" data-city="' + esc(l.address_city || '') + '" data-listing-type="' + esc(type || 'regular') + '" data-plus="' + (isPlus(l) ? 1 : 0) + '">' +
      makeAvatar(l) +
      '<div class="rank-info"><div class="rank-name">' + esc(l.name) + verifiedTag(l) + '</div>' +
      '<div class="rank-meta">' + cardMeta(l) + vettingNote(l) + temp + '</div>' +
      '<div class="rank-subcat">' + esc(l.category || '') + veganTag(l) + '</div></div>' +
      '<div class="rank-right"><span class="vote-count">' + votes.toLocaleString() + '</span><span class="vote-label">votes</span><button class="vote-btn" data-listing-id="' + esc(l.id) + '">+ Vote</button>' + adminBtn(l) + '</div>' +
      '</div>';
  }

  function makeClosedCard(l, idx) {
    var votes = (l.vote_count || 0);
    var subcat = sectionsOf(l).join('|');
    return '<div class="rank-card" data-name="' + esc(l.name) + '" data-votes="' + votes + '" data-idx="' + idx + '" data-subcat="' + esc(subcat) + '" data-vegan="' + (VEGAN_KEY[l.vegan_status] || '') + '" data-slug="' + esc(l.slug || '') + '" data-city="' + esc(l.address_city || '') + '" data-listing-type="closed" style="opacity:.7">' +
      makeAvatar(l) +
      '<div class="rank-info"><div class="rank-name" style="color:#888">' + esc(l.name) + '</div>' +
      '<div class="rank-meta">' + cardMeta(l) + '</div>' +
      '<div class="rank-subcat"><span style="font-size:9px;font-weight:700;letter-spacing:.08em;color:#c00;border:1px solid #c00;border-radius:20px;padding:2px 8px;text-transform:uppercase">Permanently Closed</span></div></div>' +
      '<div class="rank-right"><span class="vote-count" style="color:#bbb">' + votes.toLocaleString() + '</span><span class="vote-label">votes</span>' + adminBtn(l) + '</div>' +
      '</div>';
  }

  function isOnline(l) { return !l.address_city && !l.address_state; }

  // Optional in-frame open (2026-09-07, Logan, Sean direction): a caller
  // can pass config.onOpenListing(slug, name) to keep listing clicks inside
  // its own frame instead of navigating the whole window -- the dashboard
  // uses this to open listings under its Directory tab with a breadcrumb
  // back into the dashboard. Public /communities/[city] hub pages don't
  // pass it, so their listing clicks keep navigating to /directory/[slug]
  // as real, shareable URLs, unchanged.
  function bindCardClicks(root, config) {
    root.querySelectorAll('.rank-card[data-slug]').forEach(function (card) {
      if (card.dataset.clickbound) return;
      card.dataset.clickbound = '1';
      var slug = card.dataset.slug;
      if (!slug) return;
      card.addEventListener('click', function (e) {
        if (e.target.closest('.vote-btn') || e.target.closest('.vla-edit')) return;
        if (config && typeof config.onOpenListing === 'function') { config.onOpenListing(slug, card.dataset.name || ''); return; }
        window.location = '/directory/' + slug;
      });
    });
  }

  // Votes are real (Sean 2026-09-27): /public/ve-votes.js saves them through ve-auth,
  // one per member per listing per day. Loaded on first use so no hub page needs a new tag.
  var votesLoading = null;
  function bindVoteButtons(root) {
    if (window.VEVotes) return window.VEVotes.wire(root);
    if (!votesLoading) votesLoading = new Promise(function (res) {
      var sc = document.createElement('script'); sc.src = '/public/ve-votes.js'; sc.onload = res; sc.onerror = res; document.head.appendChild(sc);
    });
    votesLoading.then(function () { if (window.VEVotes) window.VEVotes.wire(root); });
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

  var LAST = null; // what was last drawn, so an admin edit can redraw in place
  function populateGrids(root, config, approved, closed) {
    closed = closed || [];
    LAST = { root: root, config: config, approved: approved, closed: closed };
    var tabs = {}, closedTabs = {};
    CAT_CONFIG.forEach(function (c) { tabs[c.key] = []; closedTabs[c.key] = []; });

    // A listing shows in the tab of each of its sections (the main one decides the default).
    function tabsOf(l) {
      var out = [];
      sectionsOf(l).forEach(function (c, i) { var t = CAT_MAP[c] || (i === 0 ? 'services' : null); if (t && out.indexOf(t) < 0) out.push(t); });
      return out;
    }
    approved.forEach(function (l) {
      var into = l.business_status === 'CLOSED_PERMANENTLY' ? closedTabs : tabs; // marked closed: only under Type > Closed
      tabsOf(l).forEach(function (tab) { if (into[tab]) into[tab].push(l); });
    });
    closed.forEach(function (l) {
      tabsOf(l).forEach(function (tab) { if (closedTabs[tab]) closedTabs[tab].push(l); });
    });

    CAT_CONFIG.forEach(function (cfg) {
      var tab = cfg.key;
      var all = tabs[tab];
      // Plus businesses first in their section (priority placement), then by votes.
      all.sort(function (a, b) { return byPriority(a, b) || (b.vote_count || 0) - (a.vote_count || 0); });

      var cards = all.map(function (l, idx) {
        var type = isOnline(l) ? 'online' : 'regular';
        return makeBrowseCard(l, idx, type);
      }).join('');
      var closedCards = closedTabs[tab].map(function (l, idx) { return makeClosedCard(l, idx); }).join('');

      var grid = root.querySelector('#' + tab + '-grid');
      if (grid) grid.innerHTML = (cards + closedCards) || '<p class="vrd-empty vrd-empty-static">No listings yet in this category.</p>';

      populateGeoBar(root.querySelector('#board-' + tab + ' .sort-bar'), config, all);
    });

    bindVoteButtons(root);
    bindCardClicks(root, config);
    bindAdmin(root);

    root.querySelectorAll('.board-panel').forEach(function (panel) { applyPanelFilters(panel, config, true); });
  }

  function currentSubcat(panel) {
    var active = panel.querySelector('.subcat-pill.sc-active');
    return active ? active.getAttribute('data-vrd-subcat') : 'All';
  }

  var vrdPageState = {};

  function applyPanelFilters(panel, state, resetPage) {
    var special = currentSubcat(panel);
    var catKey = panel.id.replace('board-', '');
    var grid = panel.querySelector('#' + catKey + '-grid');
    if (!grid) return;
    var bar = panel.querySelector('.sort-bar');
    var countySel = bar ? bar.querySelector('[data-vrd-county]') : null;
    var citySel = bar ? bar.querySelector('[data-vrd-city]') : null;
    var typeSel = bar ? bar.querySelector('[data-vrd-type]') : null;
    var perpageSel = bar ? bar.querySelector('[data-vrd-perpage]') : null;
    var county = countySel ? countySel.value : '';
    var city = citySel ? citySel.value : '';
    var type = typeSel ? typeSel.value : '';
    var veganSel = bar ? bar.querySelector('[data-vrd-vegan]') : null;
    var vegan = veganSel ? veganSel.value : '';
    var perpage = perpageSel ? (parseInt(perpageSel.value, 10) || 24) : 24;
    var countyMap = {};
    if (countySel) { try { countyMap = JSON.parse(countySel.dataset.cities || '{}'); } catch (e) {} }
    // Search is scoped to this panel/category only (2026-09-07, Logan, Sean
    // correction) -- each panel has its own [data-vrd-search] input now.
    var searchInput = panel.querySelector('[data-vrd-search]');
    var searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.rank-card'));
    var matched = [];
    cards.forEach(function (card) {
      var subOk = (special === 'All') || (card.dataset.subcat || '').split('|').indexOf(special) > -1;
      var veganOk = !vegan || card.dataset.vegan === vegan;
      var geoOk = true;
      if (city) { geoOk = card.dataset.city === city; }
      else if (county && countyMap[county]) { geoOk = countyMap[county].indexOf(card.dataset.city) > -1; }
      var typeOk = type ? (card.dataset.listingType === type) : (card.dataset.listingType !== 'closed');
      var searchOk = !searchTerm ||
        (card.dataset.name || '').toLowerCase().indexOf(searchTerm) > -1 ||
        (card.dataset.subcat || '').toLowerCase().indexOf(searchTerm) > -1 ||
        (card.dataset.city || '').toLowerCase().indexOf(searchTerm) > -1;
      var ok = subOk && veganOk && geoOk && typeOk && searchOk;
      if (ok) matched.push(card);
      else card.style.display = 'none';
    });

    if (resetPage) vrdPageState[catKey] = 1;
    var totalPages = Math.max(1, Math.ceil(matched.length / perpage));
    var page = Math.min(Math.max(vrdPageState[catKey] || 1, 1), totalPages);
    vrdPageState[catKey] = page;
    var start = (page - 1) * perpage;
    var end = start + perpage;
    matched.forEach(function (card, i) {
      card.style.display = (i >= start && i < end) ? '' : 'none';
    });

    if (cards.length) {
      var emptyText = { online: 'No online-only listings for this region yet.', closed: 'No closed listings recorded.' }[type] || 'No listings match this filter yet.';
      var msg = grid.querySelector('.vrd-empty-dynamic');
      if (matched.length === 0) {
        if (!msg) { msg = document.createElement('p'); msg.className = 'vrd-empty vrd-empty-dynamic'; grid.appendChild(msg); }
        msg.textContent = emptyText;
        msg.style.display = '';
      } else if (msg) {
        msg.style.display = 'none';
      }
    }

    renderVrdPagination(panel, catKey, page, totalPages);
  }

  function renderVrdPagination(panel, catKey, page, totalPages) {
    var el = panel.querySelector('#' + catKey + '-pagination');
    if (!el) return;
    if (totalPages <= 1) { el.innerHTML = ''; return; }
    el.innerHTML =
      '<button type="button" class="vrd-page-btn" data-vrd-page-prev' + (page <= 1 ? ' disabled' : '') + '>Prev</button>' +
      '<span class="vrd-page-indicator">Page ' + page + ' of ' + totalPages + '</span>' +
      '<button type="button" class="vrd-page-btn" data-vrd-page-next' + (page >= totalPages ? ' disabled' : '') + '>Next</button>';
    var prevBtn = el.querySelector('[data-vrd-page-prev]');
    var nextBtn = el.querySelector('[data-vrd-page-next]');
    if (prevBtn) prevBtn.addEventListener('click', function () {
      vrdPageState[catKey] = Math.max(1, (vrdPageState[catKey] || 1) - 1);
      applyPanelFilters(panel, null, false);
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      vrdPageState[catKey] = (vrdPageState[catKey] || 1) + 1;
      applyPanelFilters(panel, null, false);
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
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

    // Search is per-category now (2026-09-07, Logan, Sean correction): each
    // panel owns its own [data-vrd-search] input and only re-filters itself.
    root.querySelectorAll('.board-panel').forEach(function (panel) {
      var searchInput = panel.querySelector('[data-vrd-search]');
      if (searchInput) {
        searchInput.addEventListener('input', function () { applyPanelFilters(panel, null, true); });
      }
    });

    root.querySelectorAll('[data-vrd-subcat]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var panel = btn.closest('.board-panel');
        panel.querySelectorAll('.subcat-pill').forEach(function (p) { p.classList.remove('sc-active'); });
        btn.classList.add('sc-active');
        applyPanelFilters(panel, state, true);
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
        applyPanelFilters(panel, state, true);
      });
    });

    root.querySelectorAll('[data-vrd-city]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var panel = sel.closest('.board-panel');
        applyPanelFilters(panel, state, true);
      });
    });

    root.querySelectorAll('[data-vrd-vegan]').forEach(function (sel) {
      sel.addEventListener('change', function () { applyPanelFilters(sel.closest('.board-panel'), state, true); });
    });

    root.querySelectorAll('[data-vrd-type]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var panel = sel.closest('.board-panel');
        applyPanelFilters(panel, state, true);
      });
    });

    root.querySelectorAll('[data-vrd-perpage]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var panel = sel.closest('.board-panel');
        applyPanelFilters(panel, state, true);
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
          if (order === 'votes') return (parseInt(b.dataset.plus || 0) - parseInt(a.dataset.plus || 0)) || parseInt(b.dataset.votes) - parseInt(a.dataset.votes);
          if (order === 'az') return a.dataset.name.localeCompare(b.dataset.name);
          if (order === 'recent') return parseInt(b.dataset.idx) - parseInt(a.dataset.idx);
          if (order === 'added') return parseInt(a.dataset.idx) - parseInt(b.dataset.idx);
          return 0;
        });
        cards.forEach(function (c) { grid.appendChild(c); });
        var panel = sel.closest('.board-panel');
        applyPanelFilters(panel, state, true);
      });
    });
  }

  function fetchAll(root, config, offset, acc) {
    acc = acc || [];
    var url = SUPABASE_URL + '/rest/v1/listings?select=id,slug,name,category,logo_url,vote_count,voter_count,claim_status,extra_categories,business_status,is_featured,ve_verified,ve_verified_tier,ve_verified_until,address_city,address_state,color,vegan_status,tags&status=eq.approved&limit=1000&offset=' + (offset || 0);
    fetch(url, { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        acc = acc.concat(data || []);
        if (data && data.length === 1000) { fetchAll(root, config, offset + 1000, acc); }
        else {
          var approved = acc.filter(function (l) { return (config.matchListing(l) || isOnline(l)) && (l.tags || []).indexOf('lesaruss-ai-directory-candidate') < 0; });
          // The public directory rule (/public/ve-trust.js): unvetted vegan-friendly listings
          // are for members only until 10 different people vote for them or the business claims it.
          withTrust(function (T) {
            TRUST = T;
            if (T) approved = approved.filter(function (l) { return window.VETrust.visible(l, T); });
            adminReady(function (a) { ADMIN = a; fetchClosed(root, config, approved); });
          });
        }
      })
      .catch(function (e) {
        console.error('VE Region Directory load error', e);
        root.querySelectorAll('.rank-grid').forEach(function (g) { g.innerHTML = '<p class="vrd-empty">Couldn\'t load the directory right now.</p>'; });
      });
  }

  var ADMIN = false, adminLoading = null;
  function adminReady(cb) {
    var m = window.VEAuth && VEAuth.getMember ? VEAuth.getMember() : null;
    if (!(m && m.is_superadmin)) return cb(false);
    if (!adminLoading) adminLoading = new Promise(function (res) {
      if (window.VEListingAdmin) return res();
      var sc = document.createElement('script'); sc.src = '/public/ve-listing-admin.js'; sc.onload = res; sc.onerror = res; document.head.appendChild(sc);
    }).then(function () { return !!(window.VEListingAdmin && VEListingAdmin.isAdmin()); });
    adminLoading.then(cb, function () { cb(false); });
  }
  function bindAdmin(root) {
    if (!ADMIN) return;
    window.VEListingAdmin.css();
    root.querySelectorAll('.vla-edit[data-vla]').forEach(function (b) {
      if (b.dataset.bound) return; b.dataset.bound = '1';
      b.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var id = b.getAttribute('data-vla'), l = null;
        LAST.approved.concat(LAST.closed).forEach(function (x) { if (x.id === id) l = x; });
        if (l) window.VEListingAdmin.edit(l, function () { redraw(); });
      });
    });
  }
  // Keep the visitor's tab, pill and filters, and redraw the grids with the edited listing.
  function redraw() {
    if (!LAST) return;
    var root = LAST.root, keep = {};
    root.querySelectorAll('.board-panel').forEach(function (panel) {
      var k = { sub: currentSubcat(panel) };
      panel.querySelectorAll('.sort-bar select').forEach(function (sel) { k[sel.className + '|' + Object.keys(sel.dataset).join()] = sel.value; });
      keep[panel.id] = k;
    });
    populateGrids(root, LAST.config, LAST.approved, LAST.closed);
    root.querySelectorAll('.board-panel').forEach(function (panel) {
      var k = keep[panel.id]; if (!k) return;
      panel.querySelectorAll('.subcat-pill').forEach(function (p) { p.classList.toggle('sc-active', p.getAttribute('data-vrd-subcat') === k.sub); });
      panel.querySelectorAll('.sort-bar select').forEach(function (sel) { var v = k[sel.className + '|' + Object.keys(sel.dataset).join()]; if (v != null) sel.value = v; });
      applyPanelFilters(panel, null, false);
    });
  }

  var TRUST = null, trustLoading = null;
  function withTrust(cb) {
    if (!trustLoading) trustLoading = new Promise(function (res) {
      if (window.VETrust) return res();
      var sc = document.createElement('script'); sc.src = '/public/ve-trust.js'; sc.onload = res; sc.onerror = res; document.head.appendChild(sc);
    }).then(function () { return window.VETrust ? window.VETrust.load() : null; });
    trustLoading.then(cb, function () { cb(null); });
  }
  // Members see listings still being vetted, marked so they know their vote counts.
  function vettingNote(l) {
    if (!TRUST || !window.VETrust || !window.VETrust.pending(l, TRUST)) return '';
    return '<span class="vrd-vetting" title="Shows to the public once ' + TRUST.min_voters + ' different people vote for it, or the business claims it.">Members only &middot; ' + (l.voter_count || 0) + ' of ' + TRUST.min_voters + ' people</span>';
  }

  function fetchClosed(root, config, approved) {
    var url = SUPABASE_URL + '/rest/v1/listings?select=id,slug,name,category,logo_url,vote_count,voter_count,claim_status,extra_categories,business_status,is_featured,ve_verified,ve_verified_tier,ve_verified_until,address_city,address_state,color,vegan_status,tags&status=eq.closed&limit=1000';
    fetch(url, { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } })
      .then(function (r) { return r.json(); })
      .then(function (data) { populateGrids(root, config, approved, (data || []).filter(function (l) { return config.matchListing(l) || isOnline(l); })); })
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
