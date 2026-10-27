/* VE Region Directory — shared, reusable component
   Mimics the feel of /directory (category tabs, subcat pills, one unified sorted/filtered list
   per category, real listing links, votes) but scoped to a single region's real listings.
   Used by the city hub page (/communities/hub.html) and /directory. Self-contained: injects its own CSS,
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
    // Food Trucks and Vendors are apart (Sean, 2026-10-27: "you might be just looking for a food truck"): a truck is a truck; a
    // vendor sells at markets, pop-ups and events. The old 'Food Trucks & Vendors' rows were re-filed the same day.
    'Restaurants': 'food', 'Bakeries & Cafes': 'food', 'Food Trucks': 'food', 'Vendors': 'food', 'Food Trucks & Vendors': 'food', 'Markets': 'food',
    'Catering': 'food', 'Meal Prep': 'food',
    // Food Brands are back under Food (Sean, 2026-10-26): sections open on their first sub-section, not All, so Food opens
    // on Restaurants and the national brands no longer mix with the local places. Nutrition & Supplements follows them.
    'Food Brands': 'food', 'Nutrition & Supplements': 'food',
    // Brands left the menu (Sean, 2026-10-26); an old 'Brands' row still shows under Products > All.
    'Brands': 'products', 'Clothing and Fashion': 'products', 'Beauty and Personal Care': 'products',
    'Fitness and Athletics': 'products', 'E-Commerce & Marketplaces': 'products',
    'Health and Wellness': 'services', 'Coaches and Consultants': 'services', 'Marketing & Growth': 'services',
    'Branding & Creative Assets': 'services', 'Content Creation & Media': 'services', 'Web & Development': 'services',
    'AI & Automation': 'services', 'Business Operations': 'services',
    'Podcasts': 'media', 'YouTube': 'media', 'News Outlets': 'media', 'Documentaries & Films': 'media', 'Books': 'media', 'Media': 'media',
    // Community is the animals first (Sean, 2026-10-27: "it being about nonprofits, it being about events, it being about rescues...
    // sanctuaries"). Community Partner was not a kind of listing; its rows were re-filed the same day.
    'Nonprofits': 'community', 'Rescues': 'community', 'Sanctuaries': 'community', 'Events': 'community', 'Community Partner': 'community',
    'Uncategorized': 'hidden'
  };

  var CAT_CONFIG = [
    { key: 'food', label: 'Food', hasVF: true,
      icon: '<svg fill="none" height="13" stroke="currentColor" stroke-linecap="round" stroke-width="2.2" viewBox="0 0 24 24" width="13"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2"></path><path d="M18 2v4"></path><path d="M21 8a3 3 0 01-3 3 3 3 0 01-3-3"></path></svg>',
      subcats: ['Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Food Brands', 'Nutrition & Supplements', 'Markets', 'Catering', 'Meal Prep'] },
    { key: 'products', label: 'Products', hasVF: false,
      icon: '<svg fill="none" height="13" stroke="currentColor" stroke-linecap="round" stroke-width="2.2" viewBox="0 0 24 24" width="13"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path><line x1="3" x2="21" y1="6" y2="6"></line><path d="M16 10a4 4 0 01-8 0"></path></svg>',
      subcats: ['Fitness and Athletics', 'Clothing and Fashion', 'Beauty and Personal Care', 'E-Commerce & Marketplaces'] },
    { key: 'services', label: 'Services', hasVF: false,
      icon: '<svg fill="none" height="13" stroke="currentColor" stroke-linecap="round" stroke-width="2.2" viewBox="0 0 24 24" width="13"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path></svg>',
      subcats: ['Health and Wellness', 'Coaches and Consultants', 'Marketing & Growth', 'Branding & Creative Assets', 'Content Creation & Media', 'Web & Development', 'AI & Automation', 'Business Operations'] },
    { key: 'media', label: 'Media', hasVF: false,
      icon: '<svg fill="none" height="13" stroke="currentColor" stroke-linecap="round" stroke-width="2.2" viewBox="0 0 24 24" width="13"><rect x="9" y="2" width="6" height="12" rx="3"></rect><path d="M5 10a7 7 0 0014 0"></path><line x1="12" x2="12" y1="17" y2="22"></line></svg>',
      // Media (Other media) is hidden for now (Sean, 2026-10-27: "I don't know what media is"); its listings show nowhere until re-filed.
      subcats: ['Podcasts', 'YouTube', 'News Outlets', 'Documentaries & Films', 'Books'] },
    { key: 'community', label: 'Community', hasVF: false,
      icon: '<svg fill="none" height="13" stroke="currentColor" stroke-linecap="round" stroke-width="2.2" viewBox="0 0 24 24" width="13"><circle cx="12" cy="12" r="10"></circle><line x1="2" x2="22" y1="12" y2="12"></line><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"></path></svg>',
      subcats: ['Nonprofits', 'Rescues', 'Sanctuaries', 'Events'] },
    // Being vetted (Sean, 2026-10-25): Vegan-friendly and Vegan-options food places the community has not vetted yet
    // (/public/ve-trust.js). Members only; each one moves to Food once 10 different members vote for it.
    { key: 'vetting', label: 'Being vetted', hasVF: false, membersOnly: true,
      icon: '<svg fill="none" height="13" stroke="currentColor" stroke-linecap="round" stroke-width="2.2" viewBox="0 0 24 24" width="13"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path></svg>',
      subcats: ['Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Catering', 'Meal Prep'] },
    // Review (Sean, 2026-10-25: "could we have a review tab that has all of those features in there, just so I'm doing it
    // from one place? Because I rarely go into the depot"). Super admins only: Depot > Directory review, framed in the tab.
    { key: 'review', label: 'Review', hasVF: false, adminOnly: true, frame: '/admin/depot/directory-review',
      icon: '<svg fill="none" height="13" stroke="currentColor" stroke-linecap="round" stroke-width="2.2" viewBox="0 0 24 24" width="13"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
      subcats: [] }
  ];
  // Members (an active membership) see the Being vetted section.
  function memberNow() { var m = window.VEAuth && VEAuth.getMember ? VEAuth.getMember() : null; return !!(m && m.membership_status === 'active'); }
  function adminNow() { var m = window.VEAuth && VEAuth.getMember ? VEAuth.getMember() : null; return !!(m && m.is_superadmin); }
  function catsFor() { return CAT_CONFIG.filter(function (c) { return (!c.membersOnly || memberNow()) && (!c.adminOnly || adminNow()); }); }

  var CSS = ''
    + '.vrd-root{font-family:Montserrat,sans-serif}'
    + '.vrd-root .cat-tabs{display:flex;gap:0;border-bottom:2px solid #e8e8e8;flex-wrap:wrap}'
    + /* Muted text is #666 (5.7:1 on white, WCAG AA); #888 and #aaa failed. */ '.vrd-root .cat-tab{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:11px 20px;border:none;background:transparent;color:#666;cursor:pointer;font-family:Montserrat,sans-serif;border-bottom:2px solid transparent;margin-bottom:-2px;transition:color .15s,border-color .15s;white-space:nowrap}'
    + '.vrd-root .cat-tab.active{color:#1a1a1a;border-bottom-color:#5EC47A}'
    + '.vrd-root .cat-tab:hover:not(.active){color:#555}'
    + '.vrd-root .board-panel{display:none;padding-top:16px}'
    + '.vrd-root .board-panel.active{display:block}'
    + '.vrd-root .vrd-frame{display:block;width:100%;min-height:600px;border:1px solid rgba(0,0,0,.09);border-radius:14px;background:#f7f8f7}'
    + '.vrd-root .subcat-pills{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #eee}'
    + '.vrd-root .subcat-pill{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:5px 14px;border-radius:20px;border:1px solid #ddd;background:#fff;color:#666;cursor:pointer;font-family:Montserrat,sans-serif;transition:all .15s}'
    + '.vrd-root .subcat-pill.sc-active{background:#1a1a1a;color:#fff;border-color:#1a1a1a}'
    + '.vrd-root .subcat-pill:hover:not(.sc-active){border-color:#5EC47A;color:#2d7a4f}'
    + '.vrd-root .subcat-pills .vrd-search-wrap{position:relative;margin-left:auto;flex:0 1 240px;min-width:160px;max-width:260px}'
    + '.vrd-root .vrd-search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#999;display:flex;pointer-events:none}'
    + '.vrd-root .vrd-search-input{width:100%;padding:8px 14px 8px 32px;border:1.5px solid #ddd;border-radius:20px;font-size:12px;font-family:Montserrat,sans-serif;color:#1a1a1a;background:#fff;transition:border-color .15s}'
    + '.vrd-root .vrd-search-input:focus{outline:none;border-color:#5EC47A}'
    + '@media(max-width:640px){.vrd-root .subcat-pills .vrd-search-wrap{flex:1 1 100%;margin-left:0;max-width:none;order:99}}'
    // Desktop: the sections take three-fourths in two rows (the fuller one on top), the search the last fourth on its own
    // (Sean, 2026-10-26). Phones keep the pills, then the search under them with room between.
    + '.vrd-root .subcat-pills.vrd-split{flex-wrap:nowrap;align-items:flex-start;gap:20px}'
    + '.vrd-root .subcat-list{flex:1 1 0;min-width:0;display:flex;flex-wrap:wrap;gap:8px 6px}'
    + '.vrd-root .subcat-pills.vrd-split .vrd-search-wrap{flex:0 0 calc(25% - 15px);max-width:none;min-width:0;margin-left:0}'
    + '@media(max-width:640px){.vrd-root .subcat-pills.vrd-split{flex-wrap:wrap;gap:0}.vrd-root .subcat-list{flex:1 1 100%}.vrd-root .subcat-pills.vrd-split .vrd-search-wrap{flex:1 1 100%;margin-top:14px}}'
    + '.vrd-root .perpage-select{font-family:Montserrat,sans-serif;font-size:11px;font-weight:700;letter-spacing:.06em;color:#555;background:#fff;border:1px solid #ddd;border-radius:20px;padding:7px 28px 7px 14px;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\'%3E%3Cpath d=\'M0 0l5 6 5-6z\' fill=\'%23888\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;flex-shrink:0;margin-left:auto}'
    + '.vrd-root .perpage-select:focus{outline:2px solid #5EC47A;outline-offset:1px}'
    + '.vrd-root .sort-bar{display:flex;align-items:center;gap:10px 18px;margin-bottom:16px;flex-wrap:wrap}'
    // One row on desktop, every field the same share; it wraps to a second row only when they no longer fit (Sean, 2026-10-26).
    + '.vrd-root .sb-f,.vrd-root .sort-bar .vrd-geo,.vrd-root .sort-bar .vrd-sub{display:flex;align-items:center;gap:8px;flex:1 1 0;min-width:170px}'
    + '.vrd-root .sort-bar .vrd-geo:has(select[data-vrd-city]:not([style*="none"])):has(select[data-vrd-region],select[data-vrd-county]){min-width:300px;flex-grow:1.6}'
    + '.vrd-root .sb-f select,.vrd-root .vrd-geo select,.vrd-root .vrd-sub select{flex:1 1 0;min-width:0;width:100%;text-overflow:ellipsis}'
    + '.vrd-root .sort-bar .sort-label,.vrd-root .sort-bar .geo-label{flex-shrink:0;white-space:nowrap;margin-left:0}'
    + '.vrd-root .sort-bar [hidden]{display:none!important}'
    // Phones: each filter is a small label over its dropdown, two across (Sean, 2026-10-25: "check the directory page on mobile").
    + '@media(max-width:600px){.vrd-root .sort-bar{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 10px;align-items:end}'
    + '.vrd-root .sort-bar .sb-f,.vrd-root .sort-bar .vrd-geo,.vrd-root .sort-bar .vrd-sub{display:flex;flex-direction:column;align-items:stretch;gap:5px;min-width:0}'
    + '.vrd-root .sort-bar .geo-label,.vrd-root .sort-bar .sort-label{margin-left:0;font-size:10px}'
    + '.vrd-root .sort-bar select{width:100%;max-width:100%;min-width:0}}'
    + '.vrd-root .geo-label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#666;margin-left:8px}'
    + '.vrd-root .sort-label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#666}'
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
    // The whole name shows, on up to three rows when it needs them (Sean, 2026-10-26: "right now they all have ellipses").
    + '.vrd-root .rank-name{font-size:14px;font-weight:800;color:#1a1a1a;line-height:1.25;overflow-wrap:break-word;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}'
    + '.vrd-root .rank-meta{font-size:12px;font-weight:600;color:#555;line-height:1}'
    + '.vrd-root .rank-subcat{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#666;margin-top:2px}'
    + '.vrd-root .rank-right{display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;gap:6px;flex-shrink:0;height:60px}'
    + '.vrd-root .vote-count{font-size:16px;font-weight:900;color:#1a1a1a;line-height:1}'
    + '.vrd-root .vote-label{font-size:9px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#666}'
    + '.vrd-root .vote-btn{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:6px 12px;border-radius:4px;background:#f0faf4;color:#2d7a4f;border:1px solid #b6e5c8;cursor:pointer;font-family:Montserrat,sans-serif;white-space:nowrap}'
    + '.vrd-root .vote-btn:hover{background:#5EC47A;color:#000;border-color:#5EC47A}'
    // The category and its badges wrap together, so a badge on a second line starts at the edge (2026-10-25).
    + '.vrd-root .rank-subcat{display:flex;flex-wrap:wrap;align-items:center;gap:3px 6px}'
    + '.vrd-root .vrd-vegan{display:inline-block;margin-left:0;font-size:9px;font-weight:800;letter-spacing:.06em;padding:1px 7px;border-radius:10px;vertical-align:1px}'
    + '.vrd-root .vrd-vegan-fully{background:#e3f6e7;color:#1f6b33}'
    + '.vrd-root .vrd-mstat{display:inline-block;font-size:9px;font-weight:800;letter-spacing:.06em;padding:1px 7px;border-radius:10px;vertical-align:1px}'
    + '.vrd-root .vrd-mstat-on{background:#e3f6e7;color:#1f6b33}.vrd-root .vrd-mstat-paused{background:#fff1dc;color:#8a5200}.vrd-root .vrd-mstat-off{background:#eee;color:#555}'
    + '.vrd-root .vrd-vegan-friendly{background:#f0f0f0;color:#555}'
    + '.vrd-root .vrd-vegan-options{background:#f5f1e8;color:#6b5a2e}'
    + '.vrd-root .vrd-vends{display:inline-block;font-size:9px;font-weight:800;letter-spacing:.06em;padding:1px 7px;border-radius:10px;background:#e8eefb;color:#23408e;white-space:nowrap}'
    + '.vrd-root .vrd-verified{display:inline-flex;align-items:center;gap:3px;margin-left:6px;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:2px 7px;border-radius:10px;background:#1f5f22;color:#fff;vertical-align:2px;white-space:nowrap}'
    + '.vrd-root .vrd-temp{display:inline-block;margin-left:6px;font-size:9.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:2px 7px;border-radius:10px;background:#fdecea;color:#9b1c1c}'
    + '.vrd-root .rank-right:has(.vla-edit){height:auto}'
    + '.vrd-root .vrd-vetting{margin-top:3px;font-size:11px;font-weight:700;color:#8a5a00;line-height:1.3;white-space:nowrap}'
    + '.vrd-root .av{border-radius:10px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}'
    + '.vrd-root .online-badge{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:3px 8px;border-radius:10px;background:#e8f8ef;color:#2d7a4f;border:1px solid #b6e5c8}'
    + '.vrd-root .online-badge::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:#5EC47A}'
    + '.vrd-root .vrd-empty{grid-column:1/-1;padding:48px 24px;text-align:center;color:#666;font-size:13px;font-weight:600}'
    + '.vrd-root .vrd-foot{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;margin-top:20px;padding-top:16px}'
    + '.vrd-root .vrd-foot .perpage-select{grid-column:3;justify-self:end;margin-left:0}.vrd-root .vrd-foot .perpage-select[hidden]{display:none}'
    + '.vrd-root .vrd-pagination{grid-column:2;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px}'
    + '.vrd-root .vrd-page-num{font-family:Montserrat,sans-serif;font-size:12px;font-weight:800;min-width:34px;height:34px;padding:0 8px;border-radius:6px;border:1px solid #ddd;background:#fff;color:#1a1a1a;cursor:pointer}'
    + '.vrd-root .vrd-page-num:hover:not(.on){border-color:#5EC47A;color:#2d7a4f}'
    + '.vrd-root .vrd-page-num.on{background:#1a1a1a;border-color:#1a1a1a;color:#fff;cursor:default}'
    + '.vrd-root .vrd-page-gap{font-size:12px;font-weight:800;color:#999;padding:0 2px}'
    + '@media(max-width:640px){.vrd-root .vrd-foot{grid-template-columns:minmax(0,1fr);justify-items:center}.vrd-root .vrd-pagination,.vrd-root .vrd-foot .perpage-select{grid-column:1;justify-self:center}}'
    + '.vrd-root .vrd-page-btn{font-family:Montserrat,sans-serif;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:8px 18px;border-radius:6px;border:1px solid #ddd;background:#fff;color:#1a1a1a;cursor:pointer;transition:border-color .15s}'
    + '.vrd-root .vrd-page-btn:hover:not(:disabled){border-color:#5EC47A;color:#2d7a4f}'
    + '.vrd-root .vrd-page-btn:disabled{opacity:.35;cursor:default}'
    + '.vrd-root .vrd-page-indicator{font-size:11px;font-weight:700;color:#666;letter-spacing:.04em}'
    // Beside the ad rail (/directory, the dashboard): three across in the three-fourths, two on a laptop (Sean, 2026-10-26).
    + '.vear-main .vrd-root .rank-grid{grid-template-columns:repeat(3,minmax(0,1fr))}'
    + '@media(max-width:1280px){.vear-main .vrd-root .rank-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}'
    + '@media(max-width:768px){.vrd-root .rank-grid,.vear-main .vrd-root .rank-grid{grid-template-columns:minmax(0,1fr)}.vrd-root .cat-tab{font-size:10px;padding:10px 12px}.vrd-root .perpage-select{margin-left:0}}';

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
    // Each label and its dropdown are one field (.sb-f): a row on desktop, two across on phones (Sean, 2026-10-25).
    var sortHtml = '<span class="sb-f"><span class="sort-label">Sort by</span>' +
      '<select aria-label="Sort listings" class="sort-select" data-vrd-sort="' + cat.key + '">' +
      // No sort by the day a listing was added (Sean, 2026-10-27: "I don't think people care when I added the listing"). Books and
      // films sort by the year they came out, newest or oldest first (SUB_FILTERS years; the options show only there).
      '<option value="votes">Most Votes</option><option value="az">A to Z</option><option value="newest" data-years hidden>Newest first</option><option value="oldest" data-years hidden>Oldest first</option>' +
      '</select></span>';
    var geoHtml = '';
    if (config && config.regions) {
      // Every city (/directory): a region first, then its cities.
      geoHtml = '<span class="geo-label">Area</span>' +
        '<select aria-label="Filter by region" class="sort-select" data-vrd-region="' + cat.key + '"><option value="">All regions</option></select>' +
        '<select aria-label="Filter by city" class="sort-select" data-vrd-city="' + cat.key + '" style="display:none"><option value="">All Cities</option></select>';
    } else if (config && config.counties) {
      geoHtml = '<span class="geo-label">Area</span>' +
        '<select aria-label="Filter by county" class="sort-select" data-vrd-county="' + cat.key + '">' +
        '<option value="">All Counties</option></select>' +
        '<select aria-label="Filter by city" class="sort-select" data-vrd-city="' + cat.key + '" style="display:none">' +
        '<option value="">All Cities</option></select>';
    } else {
      geoHtml = '<span class="geo-label">Area</span>' +
        '<select aria-label="Filter by city" class="sort-select" data-vrd-city="' + cat.key + '">' +
        '<option value="">All Cities</option></select>';
    }
    // How Vegan (Sean, 2026-09-27): let people keep to 100% Vegan places without asking anyone.
    var veganHtml = '<span class="sb-f"><span class="geo-label">Vegan</span>' +
      '<select aria-label="Filter by how Vegan" class="sort-select" data-vrd-vegan="' + cat.key + '">' +
      '<option value="">All</option><option value="fully">100% Vegan only</option><option value="friendly">Vegan-friendly</option><option value="options">Vegan options</option></select></span>';
    var typeOptions = '<option value="">All</option>' +
      '<option value="online">Online</option>' +
      '<option value="closed">Closed</option>';
    var typeHtml = veganHtml + '<span class="sb-f"><span class="geo-label">Type</span>' +
      '<select aria-label="Filter by type" class="sort-select" data-vrd-type="' + cat.key + '">' + typeOptions + '</select></span>';
    // Media is everywhere and none of it is a place (Sean, 2026-10-27): no Area, How Vegan or Online / Closed for it.
    if (cat.key === 'media') typeHtml = '';
    // A sub-section's own filters (SUB_FILTERS), shown while its pill is picked.
    var subHtml = '<span class="vrd-sub" data-sub-for="kind" hidden><span class="geo-label">Makes</span>' +
      '<select aria-label="Filter by what they make" class="sort-select" data-vrd-kind="' + cat.key + '"><option value="">All</option>' +
      KINDS.map(function (k) { return '<option value="' + k[0] + '">' + k[1] + '</option>'; }).join('') + '</select></span>' +
      '<span class="vrd-sub" data-sub-for="cuisine" hidden><span class="geo-label">Food</span>' +
      '<select aria-label="Filter by kind of food" class="sort-select" data-vrd-cuisine="' + cat.key + '"><option value="">All</option>' +
      CUISINES.map(function (k) { return '<option value="' + k[0] + '">' + k[1] + '</option>'; }).join('') + '</select></span>' +
      '<span class="vrd-sub" data-sub-for="chain" hidden><span class="geo-label">Stores</span>' +
      '<select aria-label="National chains or local markets" class="sort-select" data-vrd-chain="' + cat.key + '"><option value="">All</option><option value="1">National chains</option><option value="0">Local markets</option></select></span>' +
      '<span class="vrd-sub" data-sub-for="booktype" hidden><span class="geo-label">Type</span>' +
      '<select aria-label="Filter by type of book" class="sort-select" data-vrd-booktype="' + cat.key + '"><option value="">All</option>' +
      BOOK_TYPES.map(function (k) { return '<option value="' + k[0] + '">' + k[1] + '</option>'; }).join('') + '</select></span>' +
      // A show's status is a filter, not a sort (Sean, 2026-10-27, "you could decide what the best practice is"): people want only
      // the shows still going, not the list reordered.
      '<span class="vrd-sub" data-sub-for="mstat" hidden><span class="geo-label">Status</span>' +
      '<select aria-label="Filter by status" class="sort-select" data-vrd-mstat="' + cat.key + '"><option value="">All</option><option value="active">Active</option><option value="hiatus">On hiatus</option></select></span>' +
      '<span class="vrd-sub" data-sub-for="sells" hidden><span class="geo-label">Sells at</span>' +
      '<select aria-label="Where they sell" class="sort-select" data-vrd-sells="' + cat.key + '"><option value="">Anywhere</option><option value="1">Markets &amp; events</option><option value="0">Online &amp; stores</option></select></span>';
    return '<div class="sort-bar">' + sortHtml + '<span class="vrd-geo">' + geoHtml + '</span>' + subHtml + typeHtml + '</div>';
  }

  // Per-category search (2026-09-07, Logan, Sean correction: he'd first
  // asked for one global search above the tabs, then realized "it's not
  // searching all of the items" -- it should only search the active
  // category -- so it lives on that category's own subcat-pills row,
  // shifted to the right, "flush underneath the actual tab."
  function skeletonForCat(cat, config) {
    // A framed tool (Review): the page loads the first time the tab opens.
    if (cat.frame) return '<div class="board-panel" id="board-' + cat.key + '"><div class="vrd-frame-wrap" data-vrd-frame="' + esc(cat.frame) + '"></div></div>';
    // A section opens on its first sub-section; All comes last (Sean, 2026-10-26).
    var subcatBtns = cat.subcats.map(function (s, i) { return '<button class="subcat-pill' + (i ? '' : ' sc-active') + '" data-vrd-subcat="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') +
      '<button class="subcat-pill' + (cat.subcats.length ? '' : ' sc-active') + '" data-vrd-subcat="All">All</button>';
    var searchIcon = '<svg class="vrd-search-icon" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
    var searchHtml = '<div class="vrd-search-wrap">' + searchIcon +
      '<input type="text" class="vrd-search-input" data-vrd-search placeholder="Search ' + esc(cat.label) + '&hellip;" aria-label="Search ' + esc(cat.label) + ' listings">' +
      '</div>';

    return '<div class="board-panel' + (cat.key === 'food' ? ' active' : '') + '" id="board-' + cat.key + '">' +
      '<div class="subcat-pills vrd-split"><div class="subcat-list">' + subcatBtns + '</div>' + searchHtml + '</div>' +
      buildBar(cat, config) +
      '<div class="rank-grid" id="' + cat.key + '-grid"></div>' +
      // The pages in the middle, how many to show at the far right (Sean, 2026-10-26).
      '<div class="vrd-foot"><div class="vrd-pagination" id="' + cat.key + '-pagination"></div>' +
      '<select aria-label="Results per page" class="perpage-select" data-vrd-perpage="' + cat.key + '">' +
      '<option value="24" selected>Show 24</option><option value="48">Show 48</option><option value="111">Show 111</option></select></div>' +
      '</div>';
  }

  function renderSkeleton(config) {
    var tabs = '<div class="cat-tabs" role="tablist">' +
      catsFor().map(function (c) {
        return '<button class="cat-tab' + (c.key === 'food' ? ' active' : '') + '" data-vrd-tab="' + c.key + '" role="tab">' + c.icon + ' ' + c.label + '</button>';
      }).join('') + '</div>';
    var panels = catsFor().map(function (c) { return skeletonForCat(c, config); }).join('');
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
    // A grocery chain (tag ve-grocery-store, 2026-10-08) has no one address but is not an online business.
    if ((l.tags || []).indexOf('ve-grocery-store') >= 0) return 'Grocery store';
    if (!l.address_city && !l.address_state) return '<span class="online-badge">Online</span>';
    // Every chapter: the address stays as its headquarters.
    if ((l.communities || []).indexOf('all') >= 0) return esc(l.address_city || l.address_state || '') + ' &middot; Every chapter';
    return esc(l.address_city || l.address_state || '');
  }

  // Every section a listing is in: its main category plus any the admin editor added.
  function sectionsOf(l) {
    var out = [l.category || ''];
    (l.extra_categories || []).forEach(function (c) { if (c && out.indexOf(c) < 0) out.push(c); });
    return out;
  }
  // A brand that also sells in person (Sean, 2026-10-26: "they still show up at vendor... farmers markets and special events,
  // festivals... a tool for promoters who are looking to find vendors"): a Food Brand or Nutrition & Supplements listing that
  // is also under Vendors (extra_categories). It stays in its brand section and shows with the vendors too.
  var BRAND_SUBS = ['Food Brands', 'Nutrition & Supplements'];
  function vendsAt(l) { return BRAND_SUBS.indexOf(l.category) >= 0 && sectionsOf(l).indexOf('Vendors') >= 0; }
  function vendsTag(l) { return vendsAt(l) ? ' <span class="vrd-vends" title="Also sells at markets, festivals and events">Markets &amp; events</span>' : ''; }
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
    return ' <span class="vrd-verified"><svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>VE Verified</span>';
  }
  function byPriority(a, b) { return (isPlus(b) ? 1 : 0) - (isPlus(a) ? 1 : 0); }
  // The Review tab's frame. The page inside says how tall it is (ve-frame-height, from depot-tabs.js) so the Directory
  // scrolls as one page, and asks to scroll (ve-frame-scroll) when it moves to the next listing.
  function openToolFrame(root, key, hash) {
    var wrap = root.querySelector('#board-' + key + ' [data-vrd-frame]'); if (!wrap) return;
    var f = wrap.querySelector('iframe');
    if (!f) {
      f = document.createElement('iframe'); f.className = 'vrd-frame'; f.title = 'Directory review';
      f.src = wrap.getAttribute('data-vrd-frame') + (hash || '');
      wrap.appendChild(f); return;
    }
    if (hash) { try { f.contentWindow.location.hash = hash.replace(/^#/, ''); } catch (e) { f.src = wrap.getAttribute('data-vrd-frame') + hash; } }
  }
  function openReview(root, hash) {
    var btn = root.querySelector('[data-vrd-tab="review"]'); if (!btn) return false;
    var wrap = root.querySelector('#board-review [data-vrd-frame]');
    var fresh = wrap && !wrap.querySelector('iframe');
    if (fresh) openToolFrame(root, 'review', hash); // first open: load straight on the listing
    btn.click();
    if (!fresh) openToolFrame(root, 'review', hash);
    var panel = root.querySelector('#board-review'); if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data) return;
    var f = null; document.querySelectorAll('.vrd-frame').forEach(function (x) { if (x.contentWindow === e.source) f = x; });
    if (!f) return;
    if (e.data.type === 've-frame-height') { f.style.height = Math.max(600, Math.min(40000, Math.round(+e.data.h || 0))) + 'px'; f.setAttribute('scrolling', 'no'); }
    else if (e.data.type === 've-frame-scroll') window.scrollBy({ top: f.getBoundingClientRect().top + (+e.data.top || 0) - 80, behavior: e.data.smooth ? 'smooth' : 'auto' });
  });
  // Admins: Edit opens the listing editor; Review opens it in Depot > Directory review to fix what is missing (Sean, 2026-10-25),
  // in the Being vetted list when it is still waiting on member votes.
  function adminBtn(l) {
    if (!ADMIN) return '';
    var list = TRUST && window.VETrust && window.VETrust.pending(l, TRUST) ? 'vetting' : 'flagged';
    return '<span class="vla-btns"><button type="button" class="vla-edit" data-vla="' + esc(l.id) + '" title="Admin only">Edit</button>' +
      '<a class="vla-edit" data-vrd-review="#l/' + encodeURIComponent(l.id) + '/' + list + '" href="/admin/depot/directory-review#l/' + encodeURIComponent(l.id) + '/' + list + '" target="_blank" rel="noopener" title="Admin only: fix it in the Review tab">Review</a></span>';
  }

  // Paused and closed in the words of the kind of listing (Sean, 2026-10-27): a podcast is On hiatus, never Ended (it could come
  // back years later; Sean, same day), a book or film No
  // longer available, a brand Paused or Out of business. Keep in step with STATUS in /public/ve-listing-admin.js and statusWords
  // in /directory/listing.html.
  var STATUS_WORDS = { show: ['On hiatus', 'On hiatus'], work: ['Unavailable for now', 'No longer available'], brand: ['Paused', 'Out of business'], place: ['Temporarily closed', 'Permanently closed'] };
  function statusWords(cat) {
    return STATUS_WORDS[['Podcasts', 'YouTube', 'News Outlets', 'Media'].indexOf(cat) >= 0 ? 'show' : ['Documentaries & Films', 'Books'].indexOf(cat) >= 0 ? 'work'
      : ['Food Brands', 'Nutrition & Supplements', 'Fitness and Athletics', 'Clothing and Fashion', 'Beauty and Personal Care', 'E-Commerce & Marketplaces'].indexOf(cat) >= 0 ? 'brand' : 'place'];
  }

  // Media says whether it is still going in place of how Vegan it is (Sean, 2026-10-27: a podcast's Active or On hiatus,
  // which ve-podcast sets from its latest episode).
  var MEDIA_CATS = ['Podcasts', 'YouTube', 'News Outlets', 'Media', 'Documentaries & Films', 'Books'];
  function isMedia(l) { return MEDIA_CATS.indexOf(l.category) >= 0; }
  function mediaTag(l) {
    var w = statusWords(l.category), s = l.business_status, work = /Books|Documentaries/.test(l.category);
    // A book or a film is simply there; it says so only when it is not (Sean, 2026-10-27: "Available doesn't tell me anything").
    if (work && s !== 'CLOSED_PERMANENTLY' && s !== 'CLOSED_TEMPORARILY') return '';
    var t = s === 'CLOSED_PERMANENTLY' && work ? [w[1], 'off'] : s === 'CLOSED_PERMANENTLY' || s === 'CLOSED_TEMPORARILY' ? [w[0], 'paused'] : ['Active', 'on'];
    return ' <span class="vrd-mstat vrd-mstat-' + t[1] + '">' + t[0] + '</span>';
  }
  // The line under a media card's name says what it is, where a place says its city (Sean, 2026-10-27: no "Online", no city):
  // Podcast and its Active / On hiatus, News outlet and Active, Documentary film and its year, a book's type and year.
  // BOOK_TYPES is listings.details.book_type; keep in step with ve-listing-admin.js and the ve-listing-media function.
  function bookLabel(k) { var m = BOOK_TYPES.filter(function (x) { return x[0] === k; })[0]; return m ? m[1] : ''; }
  function mediaMeta(l) {
    var y = l.release_year ? ' &middot; ' + esc(l.release_year) : '';
    if (l.category === 'Documentaries & Films') return 'Documentary film' + y + mediaTag(l);
    if (l.category === 'Books') return esc(bookLabel(l.book_type) || 'Book') + y + mediaTag(l);
    return esc({ 'Podcasts': 'Podcast', 'YouTube': 'YouTube channel', 'News Outlets': 'News outlet' }[l.category] || l.category || '') + mediaTag(l);
  }
  function makeBrowseCard(l, idx, type) {
    var votes = (l.vote_count || 0);
    var subcat = sectionsOf(l).join('|');
    var temp = l.business_status === 'CLOSED_TEMPORARILY' && !isMedia(l) ? ' <span class="vrd-temp">' + statusWords(l.category)[0] + '</span>' : '';
    return '<div class="rank-card" data-name="' + esc(l.name) + '" data-votes="' + votes + '" data-idx="' + idx + '" data-subcat="' + esc(subcat) + '" data-vegan="' + (VEGAN_KEY[l.vegan_status] || '') + '" data-slug="' + esc(l.slug || '') + '" data-city="' + esc(l.address_city || '') + '" data-listing-type="' + esc(type || 'regular') + '" data-plus="' + (isPlus(l) ? 1 : 0) + '"' + extraAttrs(l) + '>' +
      makeAvatar(l) +
      '<div class="rank-info"><div class="rank-name">' + esc(l.name) + verifiedTag(l) + '</div>' +
      (isMedia(l) ? '<div class="rank-meta">' + mediaMeta(l) + '</div>'
        : '<div class="rank-meta">' + cardMeta(l) + temp + '</div>' +
          '<div class="rank-subcat">' + esc(l.category || '') + veganTag(l) + vendsTag(l) + '</div>') + vettingNote(l) + '</div>' +
      '<div class="rank-right"><span class="vote-count">' + votes.toLocaleString() + '</span><span class="vote-label">votes</span><button class="vote-btn" data-listing-id="' + esc(l.id) + '">+ Vote</button>' + adminBtn(l) + '</div>' +
      '</div>';
  }

  function makeClosedCard(l, idx) {
    var votes = (l.vote_count || 0);
    var subcat = sectionsOf(l).join('|');
    return '<div class="rank-card" data-name="' + esc(l.name) + '" data-votes="' + votes + '" data-idx="' + idx + '" data-subcat="' + esc(subcat) + '" data-vegan="' + (VEGAN_KEY[l.vegan_status] || '') + '" data-slug="' + esc(l.slug || '') + '" data-city="' + esc(l.address_city || '') + '" data-listing-type="closed"' + extraAttrs(l) + ' style="opacity:.7">' +
      makeAvatar(l) +
      '<div class="rank-info"><div class="rank-name" style="color:#555">' + esc(l.name) + '</div>' +
      '<div class="rank-meta">' + cardMeta(l) + '</div>' +
      '<div class="rank-subcat"><span style="font-size:9px;font-weight:700;letter-spacing:.08em;color:#c00;border:1px solid #c00;border-radius:20px;padding:2px 8px;text-transform:uppercase">' + statusWords(l.category)[1] + '</span></div></div>' +
      '<div class="rank-right"><span class="vote-count" style="color:#bbb">' + votes.toLocaleString() + '</span><span class="vote-label">votes</span>' + adminBtn(l) + '</div>' +
      '</div>';
  }

  function isOnline(l) { return !l.address_city && !l.address_state; }
  // A listing shows in a chapter when its address puts it there, it is online, or it serves that chapter
  // too (listings.communities: hub slugs, or 'all' for every chapter; Sean, 2026-10-24, migration
  // 20261024_listing_communities.sql). config.hub is the chapter's slug; /directory's Every City has none.
  function serves(l, hub) { var c = l.communities || []; return c.indexOf('all') >= 0 || (!!hub && c.indexOf(hub) >= 0); }
  function inRegion(config, l) { return config.matchListing(l) || isOnline(l) || isMedia(l) || serves(l, config.hub); }

  // Filters for one sub-section (Sean, 2026-10-24: "the sort menu should be custom to each one"). Food Brands are sold
  // everywhere, so they filter by what they make, not where; Markets by national chain or local store. Anything not
  // listed keeps the usual location filter. KINDS is listings.product_kinds; keep in step with ve-listing-admin.js.
  var KINDS = [['dairy', 'Dairy alternatives'], ['meat', 'Meat alternatives'], ['egg', 'Egg alternatives'], ['seafood', 'Seafood alternatives'],
    ['snacks', 'Snacks and sweets'], ['drinks', 'Drinks'], ['protein', 'Protein and supplements'], ['pantry', 'Pantry and sauces'], ['baked', 'Bread and baked goods'], ['frozen', 'Frozen meals']];
  // What kind of food a place serves (listings.cuisines, Sean 2026-10-25); keep in step with ve-listing-admin.js.
  var CUISINES = [['american', 'American & comfort food'], ['soul', 'Soul food'], ['caribbean', 'Caribbean'], ['latin', 'Latin American'],
    ['mexican', 'Mexican'], ['cuban', 'Cuban'], ['italian', 'Italian & pizza'], ['mediterranean', 'Mediterranean'], ['middle_eastern', 'Middle Eastern'],
    ['ethiopian', 'Ethiopian'], ['african', 'African'], ['indian', 'Indian'], ['thai', 'Thai'], ['chinese', 'Chinese'], ['japanese', 'Japanese & sushi'],
    ['korean', 'Korean'], ['vietnamese', 'Vietnamese'], ['asian', 'Pan-Asian'], ['burgers', 'Burgers & fast food'], ['bowls', 'Bowls & salads'],
    ['raw', 'Raw & juice bar'], ['brunch', 'Breakfast & brunch'], ['desserts', 'Desserts & sweets'], ['global', 'Global mix']];
  var BOOK_TYPES = [['cookbook', 'Cookbook'], ['memoir', 'Biography & memoir'], ['educational', 'Educational'], ['health', 'Health & nutrition'],
    ['lifestyle', 'Lifestyle'], ['children', 'Children\'s']];
  // Books sort by what kind of book, never by region (Sean, 2026-10-27); every media sub-section drops the location filter.
  var SUB_FILTERS = { 'Books': { geo: false, booktype: true, years: true }, 'Podcasts': { geo: false, mstat: true }, 'YouTube': { geo: false, mstat: true },
    'News Outlets': { geo: false, mstat: true }, 'Documentaries & Films': { geo: false, years: true }, 'Food Brands': { geo: false, kind: true, sells: true }, 'Nutrition & Supplements': { geo: false, sells: true }, 'Markets': { chain: true }, 'Restaurants': { cuisine: true },
    'Food Trucks': { cuisine: true }, 'Vendors': { cuisine: true }, 'Catering': { cuisine: true } };
  // Which regions (hub slugs) a listing counts in on /directory: its address's, the chapters it serves, '*' for every one.
  function hubsOf(l) {
    var c = l.communities || [];
    if (c.indexOf('all') >= 0 || isOnline(l) || isMedia(l)) return '*';
    var out = c.slice();
    (window.VE_HUBS || []).forEach(function (h) {
      if (out.indexOf(h.slug) >= 0) return;
      if (h.match.cities && h.match.cities.indexOf(l.address_city) < 0) return;
      if (h.match.states && h.match.states.indexOf(l.address_state) < 0) return;
      if (h.match.cities || h.match.states) out.push(h.slug);
    });
    return out.join('|');
  }
  function extraAttrs(l) {
    var ms = l.business_status === 'CLOSED_PERMANENTLY' || l.business_status === 'CLOSED_TEMPORARILY' ? 'hiatus' : 'active';
    return ' data-booktype="' + esc(l.book_type || '') + '" data-year="' + esc(l.release_year || '') + '" data-mstat="' + ms + '" data-kinds="' + esc((l.product_kinds || []).join('|')) + '" data-cuisines="' + esc((l.cuisines || []).join('|')) + '" data-chain="' + ((l.tags || []).indexOf('ve-grocery-store') >= 0 ? 1 : 0) + '" data-hubs="' + esc(hubsOf(l)) + '" data-vends="' + (vendsAt(l) ? 1 : 0) + '"';
  }

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
    var regionSel = barEl.querySelector('[data-vrd-region]');
    if (regionSel) {
      // Each region with listings here, and the cities in it.
      var byHub = {};
      listings.forEach(function (l) {
        var h = hubsOf(l); if (h === '*' || !h) return;
        h.split('|').forEach(function (slug) { byHub[slug] = byHub[slug] || {}; if (l.address_city) byHub[slug][l.address_city] = 1; });
      });
      var cities = {};
      regionSel.innerHTML = '<option value="">All regions</option>' + (window.VE_HUBS || []).filter(function (h) { return byHub[h.slug]; }).map(function (h) {
        cities[h.slug] = Object.keys(byHub[h.slug]).sort(); return '<option value="' + esc(h.slug) + '">' + esc(h.name) + '</option>';
      }).join('');
      regionSel.dataset.cities = JSON.stringify(cities); regionSel.value = '';
      if (citySel) { citySel.innerHTML = '<option value="">All Cities</option>'; citySel.style.display = 'none'; citySel.value = ''; }
      return;
    }
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
      if (l.category === 'Media' && !(l.extra_categories || []).length) return; // Other media: hidden for now
      // Marked closed: only under Type > Closed. Media that has ended stays with the rest: its episodes and pages still play.
      var into = l.business_status === 'CLOSED_PERMANENTLY' && !isMedia(l) ? closedTabs : tabs;
      // Still being vetted: only in the members' Being vetted section, not with the vetted places.
      if (into === tabs && TRUST && window.VETrust && window.VETrust.pending(l, TRUST)) { tabs.vetting.push(l); return; }
      tabsOf(l).forEach(function (tab) { if (into[tab]) into[tab].push(l); });
    });
    closed.forEach(function (l) {
      tabsOf(l).forEach(function (tab) { if (closedTabs[tab]) closedTabs[tab].push(l); });
    });

    CAT_CONFIG.forEach(function (cfg) {
      var tab = cfg.key;
      var all = tabs[tab];
      // Plus businesses first in their section (priority placement), then by votes.
      all.sort(tab === 'vetting'
        ? function (a, b) { return (b.voter_count || 0) - (a.voter_count || 0) || (b.vote_count || 0) - (a.vote_count || 0); } // closest to 10 first
        : function (a, b) { return byPriority(a, b) || (b.vote_count || 0) - (a.vote_count || 0); });

      var cards = all.map(function (l, idx) {
        var type = isOnline(l) ? 'online' : 'regular';
        return makeBrowseCard(l, idx, type);
      }).join('');
      var closedCards = closedTabs[tab].map(function (l, idx) { return makeClosedCard(l, idx); }).join('');

      var grid = root.querySelector('#' + tab + '-grid');
      if (grid) grid.innerHTML = (cards + closedCards) || '<p class="vrd-empty vrd-empty-static">' + (tab === 'vetting' ? 'Nothing waiting to be vetted here.' : 'No listings yet in this category.') + '</p>';

      populateGeoBar(root.querySelector('#board-' + tab + ' .sort-bar'), config, all);
    });

    bindVoteButtons(root);
    bindCardClicks(root, config);
    bindAdmin(root);

    root.querySelectorAll('.board-panel').forEach(function (panel) { syncSubFilters(panel); applyPanelFilters(panel, config, true); });
  }

  // The media section has no location filter on any of its pills, All included.
  function subFiltersFor(panel, sub) {
    var sf = SUB_FILTERS[sub] || {};
    return panel && panel.id === 'board-media' && sf.geo !== false ? Object.assign({ geo: false }, sf) : sf;
  }
  function currentSubcat(panel) {
    var active = panel.querySelector('.subcat-pill.sc-active');
    return active ? active.getAttribute('data-vrd-subcat') : 'All';
  }

  var vrdPageState = {};

  // Show the picked sub-section's own filters and hide (and clear) the rest; hide location where it does not apply.
  function syncSubFilters(panel) {
    var bar = panel && panel.querySelector('.sort-bar'); if (!bar) return;
    var sf = subFiltersFor(panel, currentSubcat(panel));
    bar.querySelectorAll('.vrd-sub').forEach(function (w) {
      var on = !!sf[w.dataset.subFor]; w.hidden = !on;
      if (!on) { var s = w.querySelector('select'); if (s) s.value = ''; }
    });
    // Newest and Oldest belong to books and films; anywhere else the sort goes back to Most Votes.
    var sortSel = bar.querySelector('[data-vrd-sort]');
    if (sortSel) {
      sortSel.querySelectorAll('[data-years]').forEach(function (o) { o.hidden = !sf.years; o.disabled = !sf.years; });
      if (!sf.years && /^(newest|oldest)$/.test(sortSel.value)) { sortSel.value = 'votes'; sortSel.dispatchEvent(new Event('change')); }
    }
    // Brands sell everywhere, so no location filter, until a promoter looks for the ones at markets and events.
    var sells = bar.querySelector('[data-vrd-sells]');
    var geo = bar.querySelector('.vrd-geo'); if (geo) geo.hidden = sf.geo === false && !(sf.sells && sells && sells.value === '1');
  }

  function applyPanelFilters(panel, state, resetPage) {
    var special = currentSubcat(panel);
    var catKey = panel.id.replace('board-', '');
    var grid = panel.querySelector('#' + catKey + '-grid');
    if (!grid) return;
    var bar = panel.querySelector('.sort-bar');
    var countySel = bar ? bar.querySelector('[data-vrd-county]') : null;
    var citySel = bar ? bar.querySelector('[data-vrd-city]') : null;
    var typeSel = bar ? bar.querySelector('[data-vrd-type]') : null;
    var perpageSel = panel.querySelector('[data-vrd-perpage]');
    var county = countySel ? countySel.value : '';
    var city = citySel ? citySel.value : '';
    var type = typeSel ? typeSel.value : '';
    var veganSel = bar ? bar.querySelector('[data-vrd-vegan]') : null;
    var vegan = veganSel ? veganSel.value : '';
    var perpage = perpageSel ? (parseInt(perpageSel.value, 10) || 24) : 24;
    var countyMap = {};
    if (countySel) { try { countyMap = JSON.parse(countySel.dataset.cities || '{}'); } catch (e) {} }
    var regionSel = bar ? bar.querySelector('[data-vrd-region]') : null, region = regionSel ? regionSel.value : '';
    // The picked sub-section's own filters; the others are hidden and cleared (syncSubFilters).
    var sf = subFiltersFor(panel, special);
    var booktypeSel = bar ? bar.querySelector('[data-vrd-booktype]') : null, booktype = sf.booktype && booktypeSel ? booktypeSel.value : '';
    var mstatSel = bar ? bar.querySelector('[data-vrd-mstat]') : null, mstat = sf.mstat && mstatSel ? mstatSel.value : '';
    var kindSel = bar ? bar.querySelector('[data-vrd-kind]') : null, kind = sf.kind && kindSel ? kindSel.value : '';
    var chainSel = bar ? bar.querySelector('[data-vrd-chain]') : null, chain = sf.chain && chainSel ? chainSel.value : '';
    var cuisineSel = bar ? bar.querySelector('[data-vrd-cuisine]') : null, cuisine = sf.cuisine && cuisineSel ? cuisineSel.value : '';
    var sellsSel = bar ? bar.querySelector('[data-vrd-sells]') : null, sells = sf.sells && sellsSel ? sellsSel.value : '';
    if (sf.geo === false && sells !== '1') { city = ''; county = ''; region = ''; }
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
      if (geoOk && region) { var hs = card.dataset.hubs || ''; geoOk = hs === '*' || hs.split('|').indexOf(region) > -1; }
      if (kind && (card.dataset.kinds || '').split('|').indexOf(kind) < 0) geoOk = false;
      if (booktype && card.dataset.booktype !== booktype) geoOk = false;
      if (mstat && card.dataset.mstat !== mstat) geoOk = false;
      if (chain && card.dataset.chain !== chain) geoOk = false;
      if (cuisine && (card.dataset.cuisines || '').split('|').indexOf(cuisine) < 0) geoOk = false;
      if (sells && card.dataset.vends !== sells) geoOk = false;
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
    // Show 24 / 48 / 111 matters only when there is more than one page of the smallest.
    if (perpageSel) perpageSel.hidden = matched.length <= 24;
  }

  function renderVrdPagination(panel, catKey, page, totalPages) {
    var el = panel.querySelector('#' + catKey + '-pagination');
    if (!el) return;
    if (totalPages <= 1) { el.innerHTML = ''; return; }
    // Every page number near this one, plus the first and last, so page 7 is one click from page 2 (Sean, 2026-10-26).
    var nums = [], last = 0;
    for (var n = 1; n <= totalPages; n++) {
      if (n !== 1 && n !== totalPages && Math.abs(n - page) > 2) continue;
      if (last && n - last > 1) nums.push(n - last === 2 ? '<button type="button" class="vrd-page-num" data-vrd-page="' + (n - 1) + '">' + (n - 1) + '</button>' : '<span class="vrd-page-gap" aria-hidden="true">&hellip;</span>');
      nums.push(n === page ? '<button type="button" class="vrd-page-num on" aria-current="page">' + n + '</button>' : '<button type="button" class="vrd-page-num" data-vrd-page="' + n + '" aria-label="Page ' + n + '">' + n + '</button>');
      last = n;
    }
    el.innerHTML =
      '<button type="button" class="vrd-page-btn" data-vrd-page-prev' + (page <= 1 ? ' disabled' : '') + '>Prev</button>' +
      nums.join('') +
      '<button type="button" class="vrd-page-btn" data-vrd-page-next' + (page >= totalPages ? ' disabled' : '') + '>Next</button>';
    el.querySelectorAll('[data-vrd-page]').forEach(function (b) {
      b.addEventListener('click', function () {
        vrdPageState[catKey] = parseInt(b.getAttribute('data-vrd-page'), 10) || 1;
        applyPanelFilters(panel, null, false);
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
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
        openToolFrame(root, btn.getAttribute('data-vrd-tab'));
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
        syncSubFilters(panel);
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

    root.querySelectorAll('[data-vrd-region]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var citySel = sel.closest('.sort-bar').querySelector('[data-vrd-city]'), map = {};
        try { map = JSON.parse(sel.dataset.cities || '{}'); } catch (e) {}
        if (citySel) {
          citySel.innerHTML = '<option value="">All Cities</option>' + (map[sel.value] || []).map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('');
          citySel.value = ''; citySel.style.display = sel.value ? '' : 'none';
        }
        applyPanelFilters(sel.closest('.board-panel'), state, true);
      });
    });
    root.querySelectorAll('[data-vrd-kind], [data-vrd-chain], [data-vrd-cuisine], [data-vrd-sells], [data-vrd-booktype], [data-vrd-mstat]').forEach(function (sel) {
      sel.addEventListener('change', function () { var panel = sel.closest('.board-panel'); if (sel.hasAttribute('data-vrd-sells')) syncSubFilters(panel); applyPanelFilters(panel, state, true); });
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
          // By the year it came out; anything without a year goes last, then by votes.
          if (order === 'newest' || order === 'oldest') {
            var ya = parseInt(a.dataset.year, 10), yb = parseInt(b.dataset.year, 10);
            if (isNaN(ya) !== isNaN(yb)) return isNaN(ya) ? 1 : -1;
            return (isNaN(ya) ? 0 : order === 'newest' ? yb - ya : ya - yb) || parseInt(b.dataset.votes) - parseInt(a.dataset.votes);
          }
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
    var url = SUPABASE_URL + '/rest/v1/listings?select=id,slug,name,category,logo_url,vote_count,voter_count,claim_status,extra_categories,business_status,is_featured,ve_verified,ve_verified_tier,ve_verified_until,address_city,address_state,color,vegan_status,tags,communities,product_kinds,cuisines,vetted_at,release_year:details->>release_year,book_type:details->>book_type&status=eq.approved&limit=1000&offset=' + (offset || 0);
    fetch(url, { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        acc = acc.concat(data || []);
        if (data && data.length === 1000) { fetchAll(root, config, offset + 1000, acc); }
        else {
          var approved = acc.filter(function (l) { return inRegion(config, l) && (l.tags || []).indexOf('lesaruss-ai-directory-candidate') < 0; });
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
    // Review on a card opens that listing in the Review tab, when this Directory has one.
    root.querySelectorAll('a.vla-edit[data-vrd-review]').forEach(function (a) {
      if (a.dataset.bound) return; a.dataset.bound = '1';
      a.addEventListener('click', function (e) { if (openReview(root, a.getAttribute('data-vrd-review'))) { e.preventDefault(); e.stopPropagation(); } });
    });
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
      panel.querySelectorAll('.sort-bar select, [data-vrd-perpage]').forEach(function (sel) { k[sel.className + '|' + Object.keys(sel.dataset).join()] = sel.value; });
      keep[panel.id] = k;
    });
    populateGrids(root, LAST.config, LAST.approved, LAST.closed);
    root.querySelectorAll('.board-panel').forEach(function (panel) {
      var k = keep[panel.id]; if (!k) return;
      panel.querySelectorAll('.subcat-pill').forEach(function (p) { p.classList.toggle('sc-active', p.getAttribute('data-vrd-subcat') === k.sub); });
      panel.querySelectorAll('.sort-bar select, [data-vrd-perpage]').forEach(function (sel) { var v = k[sel.className + '|' + Object.keys(sel.dataset).join()]; if (v != null) sel.value = v; });
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
  // Members see listings still being vetted, with how far each is from going public, on its own line under the card's
  // details so it never runs into the vote button (Sean, 2026-10-25).
  function vettingNote(l) {
    if (!TRUST || !window.VETrust || !window.VETrust.pending(l, TRUST)) return '';
    return '<div class="vrd-vetting" title="Shows to the public once ' + TRUST.min_voters + ' different members vote for it, or the business claims it.">' + (l.voter_count || 0) + ' of ' + TRUST.min_voters + ' member votes</div>';
  }

  function fetchClosed(root, config, approved) {
    var url = SUPABASE_URL + '/rest/v1/listings?select=id,slug,name,category,logo_url,vote_count,voter_count,claim_status,extra_categories,business_status,is_featured,ve_verified,ve_verified_tier,ve_verified_until,address_city,address_state,color,vegan_status,tags,communities,product_kinds,cuisines,vetted_at,release_year:details->>release_year,book_type:details->>book_type&status=eq.closed&limit=1000';
    fetch(url, { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } })
      .then(function (r) { return r.json(); })
      .then(function (data) { populateGrids(root, config, approved, (data || []).filter(function (l) { return inRegion(config, l); })); })
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
    },
    // The same listing card anywhere else (Sean, 2026-10-08: a Guide shows Directory listings "with
    // the same look and feel of the current directory"). Put cards inside an element with class
    // vrd-root and a .rank-grid; wire() adds votes and opens a listing through onOpen(slug, name)
    // so the visitor stays where they are. A listing needs the fields fetchAll selects.
    css: injectStyleOnce,
    card: function (l, idx) { return makeBrowseCard(l, idx || 0, isOnline(l) ? 'online' : 'regular'); },
    wire: function (root, onOpen) { bindVoteButtons(root); bindCardClicks(root, onOpen ? { onOpenListing: onOpen } : null); },
    FIELDS: 'id,slug,name,category,logo_url,vote_count,voter_count,claim_status,extra_categories,business_status,is_featured,ve_verified,ve_verified_tier,ve_verified_until,address_city,address_state,color,vegan_status,tags,communities,product_kinds,cuisines,vetted_at,release_year:details->>release_year,book_type:details->>book_type'
  };
})();
