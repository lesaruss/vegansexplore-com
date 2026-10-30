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
    // Services trimmed (Sean, 2026-10-27: "we have too many things"): Marketing & Growth is the catch-all for agency work, and
    // Health Professionals (doctors, dentists...) and Animal Care joined. The old agency sub-sections stay mapped for the SaaS
    // tools tagged for the LESARUSS AI directory, which never show here.
    'Health Professionals': 'services', 'Animal Care': 'services',
    // Studios (Sean, 2026-10-29): production, podcast and photo studios a creator can book; claimed with the $11 Passport like any listing.
    'Studios': 'services',
    'Podcasts': 'media', 'YouTube': 'media', 'News Outlets': 'media', 'Documentaries & Films': 'media', 'Books': 'media', 'Media': 'media',
    // Community is the animals first (Sean, 2026-10-27: "it being about nonprofits, it being about events, it being about rescues...
    // sanctuaries"). Community Partner was not a kind of listing; its rows were re-filed the same day.
    'Nonprofits': 'community', 'Rescues': 'community', 'Sanctuaries': 'community', 'Groups': 'community', 'Events': 'community', 'Community Partner': 'community',
    // People (Sean, 2026-10-28: "a people directory... people that we've actually interacted with"): a person is a listing, so votes
    // and saves work the same. Keep PEOPLE_CATS below, SECTIONS in ve-listing-admin.js and PEOPLE in directory/listing.html in step.
    'Activists': 'people', 'Content Creators': 'people', 'Athletes': 'people', 'Physicians': 'people', 'Health Experts': 'people',
    'Chefs': 'people', 'Founders': 'people',
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
      subcats: ['Health and Wellness', 'Health Professionals', 'Coaches and Consultants', 'Animal Care', 'Studios', 'Marketing & Growth'] },
    { key: 'media', label: 'Media', hasVF: false,
      icon: '<svg fill="none" height="13" stroke="currentColor" stroke-linecap="round" stroke-width="2.2" viewBox="0 0 24 24" width="13"><rect x="9" y="2" width="6" height="12" rx="3"></rect><path d="M5 10a7 7 0 0014 0"></path><line x1="12" x2="12" y1="17" y2="22"></line></svg>',
      // Media (Other media) is hidden for now (Sean, 2026-10-27: "I don't know what media is"); its listings show nowhere until re-filed.
      subcats: ['Podcasts', 'YouTube', 'News Outlets', 'Documentaries & Films', 'Books'] },
    { key: 'community', label: 'Community', hasVF: false,
      icon: '<svg fill="none" height="13" stroke="currentColor" stroke-linecap="round" stroke-width="2.2" viewBox="0 0 24 24" width="13"><circle cx="12" cy="12" r="10"></circle><line x1="2" x2="22" y1="12" y2="12"></line><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"></path></svg>',
      // All first here, the one exception (Sean, 2026-10-27: "I don't mind people seeing all of the community listings in one slot").
      // Groups (Sean, 2026-10-29): social clubs and meetup groups; a group's page lists the events it hosts (events.host_listing_id).
      subcats: ['Nonprofits', 'Rescues', 'Sanctuaries', 'Groups', 'Events'], allFirst: true },
    // People, All first like Community. Open to everyone since Sean launched it (2026-10-28: "launch the people directory").
    { key: 'people', label: 'People', hasVF: false,
      icon: '<svg fill="none" height="13" stroke="currentColor" stroke-linecap="round" stroke-width="2.2" viewBox="0 0 24 24" width="13"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 00-3-3.87"></path><path d="M16 3.13a4 4 0 010 7.75"></path></svg>',
      subcats: ['Activists', 'Content Creators', 'Athletes', 'Physicians', 'Health Experts', 'Chefs', 'Founders'], allFirst: true },
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
  // One framework for every brand (Sean, 2026-10-29: "If we make an update in Vegans Explore... it needs to match LESARUSS.ai...
  // What changes is just maybe the color"). Another brand's site loads this same file (lesaruss.ai proxies /public/* here) and
  // passes config.brand: its sections ({ sections, catMap }), which listings are its own (include(l)), no vetting rule
  // (trust: false), no How Vegan (vegan: false) and where a listing opens (listingBase). Colors are the --vb-* variables in the
  // CSS below; Vegans Explore sets none, so it keeps its greens. With no config.brand nothing here changes for Vegans Explore.
  var BRAND = {};
  var VE_CAT_MAP = CAT_MAP, VE_CAT_CONFIG = CAT_CONFIG;
  function useBrand(b) {
    BRAND = b || {};
    CAT_MAP = BRAND.catMap || VE_CAT_MAP;
    CAT_CONFIG = BRAND.sections || VE_CAT_CONFIG;
  }
  function ownListing(l) {
    if (typeof BRAND.include === 'function') return BRAND.include(l);
    return (l.tags || []).indexOf('lesaruss-ai-directory-candidate') < 0;
  }
  // Members (an active membership) see the Being vetted section.
  function memberNow() { var m = window.VEAuth && VEAuth.getMember ? VEAuth.getMember() : null; return !!(m && m.membership_status === 'active'); }
  function adminNow() { var m = window.VEAuth && VEAuth.getMember ? VEAuth.getMember() : null; return !!(m && m.is_superadmin); }
  function catsFor() { return CAT_CONFIG.filter(function (c) { return (!c.membersOnly || memberNow()) && (!c.adminOnly || adminNow()); }); }

  var CSS = ''
    + '.vrd-root{font-family:Montserrat,sans-serif}'
    + '.vrd-root .cat-tabs{display:flex;gap:0;border-bottom:2px solid #e8e8e8;flex-wrap:wrap}'
    + /* Muted text is #666 (5.7:1 on white, WCAG AA); #888 and #aaa failed. */ '.vrd-root .cat-tab{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:11px 20px;border:none;background:transparent;color:#666;cursor:pointer;font-family:Montserrat,sans-serif;border-bottom:2px solid transparent;margin-bottom:-2px;transition:color .15s,border-color .15s;white-space:nowrap}'
    + '.vrd-root .cat-tab.active{color:#1a1a1a;border-bottom-color:var(--vb-accent,#5EC47A)}'
    + '.vrd-root .cat-tab:hover:not(.active){color:#555}'
    + '.vrd-root .board-panel{display:none;padding-top:16px}'
    + '.vrd-root .board-panel.active{display:block}'
    + '.vrd-root .vrd-frame{display:block;width:100%;min-height:600px;border:1px solid rgba(0,0,0,.09);border-radius:14px;background:#f7f8f7}'
    + '.vrd-root .subcat-pills{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #eee}'
    + '.vrd-root .subcat-pill{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:5px 14px;border-radius:20px;border:1px solid #ddd;background:#fff;color:#666;cursor:pointer;font-family:Montserrat,sans-serif;transition:all .15s}'
    + '.vrd-root .subcat-pill.sc-active{background:#1a1a1a;color:#fff;border-color:#1a1a1a}'
    + '.vrd-root .subcat-pill:hover:not(.sc-active){border-color:var(--vb-accent,#5EC47A);color:var(--vb-accent-ink,#2d7a4f)}'
    + '.vrd-root .subcat-pills .vrd-search-wrap{position:relative;margin-left:auto;flex:0 1 240px;min-width:160px;max-width:260px}'
    + '.vrd-root .vrd-search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#999;display:flex;pointer-events:none}'
    + '.vrd-root .vrd-search-input{width:100%;padding:8px 14px 8px 32px;border:1.5px solid #ddd;border-radius:20px;font-size:12px;font-family:Montserrat,sans-serif;color:#1a1a1a;background:#fff;transition:border-color .15s}'
    + '.vrd-root .vrd-search-input:focus{outline:none;border-color:var(--vb-accent,#5EC47A)}'
    + '@media(max-width:640px){.vrd-root .subcat-pills .vrd-search-wrap{flex:1 1 100%;margin-left:0;max-width:none;order:99}}'
    // The sub-sections fill the row under the tabs (Sean, 2026-10-27; the search moved under them, beside the filter icon).
    + '.vrd-root .subcat-list{flex:1 1 0;min-width:0;display:flex;flex-wrap:wrap;gap:8px 6px}'
    // The search and the filter icon, one row under the tabs; the filters drop down under the icon (Sean, 2026-10-27).
    // The button reads Filters with how many are set, wider, a clear gap after the search (Sean, 2026-10-30, canon
    // canon-ve-directory-navigation: "make it clear that that's the filter").
    + '.vrd-root .vrd-tools{position:relative;display:flex;align-items:center;gap:16px;margin-bottom:16px}'
    + '.vrd-root .vrd-tools .vrd-search-wrap{position:relative;flex:1 1 auto;min-width:0}'
    + '.vrd-root .vrd-tools .vrd-search-input{height:44px;border-radius:6px;padding:0 14px 0 34px;font-size:13px}'
    + '.vrd-root .vrd-filter-btn{position:relative;flex:0 0 auto;min-width:132px;height:44px;padding:0 18px;display:flex;align-items:center;justify-content:center;gap:8px;border:1.5px solid #ddd;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;font-family:Montserrat,sans-serif;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap}'
    + '.vrd-root .vrd-filter-btn:hover,.vrd-root .vrd-filter-btn[aria-expanded=true]{border-color:var(--vb-accent-ink,#2d7a4f);color:var(--vb-accent-ink,#2d7a4f)}'
    + '.vrd-root .vrd-filter-btn[aria-expanded=true]{background:var(--vb-soft,#f0faf4)}'
    + '.vrd-root .vrd-filter-btn:focus-visible{outline:2px solid var(--vb-accent,#5EC47A);outline-offset:2px}'
    + '.vrd-root .vrd-filter-count{min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--vb-accent-ink,#2d7a4f);color:#fff;font-size:10px;font-weight:800;line-height:18px;letter-spacing:0;text-align:center}'
    + '.vrd-root .vrd-filter-count[hidden]{display:none}'
    // The location on show, by the search, with an x to clear it: never hidden inside the filter (canon-ve-directory-navigation).
    + '.vrd-root .vrd-loc-tag{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 10px 0 12px;border-radius:6px;border:1px solid var(--vb-line,#b6e5c8);background:var(--vb-soft,#f0faf4);color:var(--vb-accent-ink,#2d7a4f);font-family:Montserrat,sans-serif;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;max-width:240px;overflow:hidden;text-overflow:ellipsis}'
    + '.vrd-root .vrd-loc-tag[hidden]{display:none}'
    + '.vrd-root .vrd-loc-tag:hover{border-color:var(--vb-accent-ink,#2d7a4f)}'
    + '.vrd-root .vrd-loc-tag .vrd-x{font-size:15px;line-height:1;margin-left:2px}'
    // Location, first in the filter: Continent, Country, Chapter, each waiting on the one before.
    + '.vrd-root .vrd-loc-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}'
    + '.vrd-root .vrd-loc-grid .sb-f{display:flex;flex-direction:column;align-items:stretch;gap:6px;min-width:0}'
    + '.vrd-root .vrd-loc-grid .geo-label{margin:0;font-size:10px;letter-spacing:.08em;color:#666}'
    + '.vrd-root .vrd-loc-grid .sb-f select{flex:0 0 auto;height:40px}'
    + '.vrd-root .vrd-loc-grid .sb-f select:disabled{background-color:#f4f4f4;color:#999;cursor:not-allowed;border-color:#e6e6e6}'
    + '.vrd-root .vrd-pop-sec.vrd-loc[hidden]{display:none}'
    // With the sections in the page's banner, the tab row under it is the section's sub-sections (canon-ve-directory-navigation).
    + '.vrd-root.vrd-menu-out .cat-tabs{display:none}'
    + '.vrd-root .vrd-subtabs{display:flex;flex-wrap:wrap;gap:0;border-bottom:2px solid #e8e8e8;margin:-16px 0 16px}'
    + '.vrd-root .vrd-subtabs .subcat-pill{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:13px 16px;border:0;border-bottom:2px solid transparent;border-radius:0;margin-bottom:-2px;background:transparent;color:#666;white-space:nowrap}'
    + '.vrd-root .vrd-subtabs .subcat-pill.sc-active{background:transparent;color:#1a1a1a;border-color:var(--vb-accent,#5EC47A)}'
    + '.vrd-root .vrd-subtabs .subcat-pill:hover:not(.sc-active){color:#333;border-color:#ccc}'
    + '@media(max-width:768px){.vrd-root .vrd-subtabs{flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}.vrd-root .vrd-subtabs::-webkit-scrollbar{display:none}.vrd-root .vrd-subtabs .subcat-pill{font-size:10px;padding:12px}}'
    + '@media(max-width:600px){.vrd-root .vrd-tools{flex-wrap:wrap;gap:10px}.vrd-root .vrd-tools .vrd-search-wrap{flex:1 1 100%;order:-1}.vrd-root .vrd-filter-btn{flex:1 1 auto}.vrd-root .vrd-loc-grid{grid-template-columns:minmax(0,1fr);gap:12px}}'
    + '.vrd-root .vrd-filter-pop{position:absolute;top:calc(100% + 8px);right:0;z-index:40;width:min(820px,100%);background:#fff;border:1px solid #e3e3e3;border-radius:10px;box-shadow:0 14px 36px rgba(0,0,0,.16);padding:0;overflow:hidden}'
    + '.vrd-root .vrd-filter-pop[hidden]{display:none}'
    + '.vrd-root .vrd-pop-sec{padding:18px 20px}'
    + '.vrd-root .vrd-pop-sec + .vrd-pop-sec{border-top:1px solid #eee}'
    + '.vrd-root .vrd-pop-h{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#1a1a1a;margin:0 0 12px}'
    + '.vrd-root .vrd-filter-pop .subcat-list{gap:8px}'
    + '.vrd-root .vrd-filter-pop .subcat-pill{border-radius:6px;padding:8px 14px}'
    + '.vrd-root .vrd-filter-pop .sort-bar{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px;align-items:start;margin:0}'
    + '.vrd-root .vrd-filter-pop .sort-bar .sb-f,.vrd-root .vrd-filter-pop .sort-bar .vrd-sub{display:flex;flex-direction:column;align-items:stretch;gap:6px;min-width:0}'
    // Area is a region and then its cities: one label, the two dropdowns under it.
    + '.vrd-root .vrd-filter-pop .sort-bar .vrd-geo{display:flex;flex-direction:column;align-items:stretch;gap:6px;min-width:0}'
    + '.vrd-root .vrd-filter-pop .sort-bar .vrd-geo:empty{display:none}'
    + '.vrd-root .vrd-filter-pop .sort-bar .geo-label,.vrd-root .vrd-filter-pop .sort-bar .sort-label{margin:0;font-size:10px;letter-spacing:.08em;color:#666}'
    // Dropdowns: our chevron 16px from the edge (canon rule 15), the 6px corner (rule 13), one height.
    + '.vrd-root .vrd-filter-pop .sort-bar select,.vrd-root .vrd-filter-pop select{flex:0 0 auto;width:100%;max-width:100%;min-width:0;height:40px;border-radius:6px;border:1.5px solid #ddd;padding:0 44px 0 12px;font-size:12px;color:#1a1a1a;background:#fff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath d=\'M1 1.5l5 5 5-5\' fill=\'none\' stroke=\'%23555\' stroke-width=\'1.8\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E") no-repeat right 16px center}'
    + '.vrd-root .vrd-filter-pop select:focus{outline:none;border-color:var(--vb-accent,#5EC47A)}'
    + '.vrd-root .vrd-pop-foot{display:flex;justify-content:flex-end;gap:10px;padding:12px 20px;border-top:1px solid #eee;background:#fafafa}'
    + '.vrd-root .vrd-pop-btn{font-family:Montserrat,sans-serif;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:10px 16px;border-radius:6px;border:1.5px solid #ddd;background:#fff;color:#1a1a1a;cursor:pointer}'
    + '.vrd-root .vrd-pop-btn:hover{border-color:var(--vb-accent-ink,#2d7a4f);color:var(--vb-accent-ink,#2d7a4f)}'
    + '.vrd-root .vrd-pop-done{background:var(--vb-go,#2d7d31);border-color:var(--vb-go,#2d7d31);color:#fff}'
    + '.vrd-root .vrd-pop-done:hover{background:var(--vb-go-hover,#1f5f22);border-color:var(--vb-go-hover,#1f5f22);color:#fff}'
    + '@media(max-width:600px){.vrd-root .vrd-filter-pop .sort-bar{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 10px}.vrd-root .vrd-pop-sec{padding:16px}.vrd-root .vrd-pop-foot{padding:12px 16px}.vrd-root .vrd-pop-btn{flex:1 1 0}}'
    + '.vrd-root .perpage-select{font-family:Montserrat,sans-serif;font-size:11px;font-weight:700;letter-spacing:.06em;color:#555;background:#fff;border:1px solid #ddd;border-radius:20px;padding:7px 28px 7px 14px;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\'%3E%3Cpath d=\'M0 0l5 6 5-6z\' fill=\'%23888\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;flex-shrink:0;margin-left:auto}'
    + '.vrd-root .perpage-select:focus{outline:2px solid var(--vb-accent,#5EC47A);outline-offset:1px}'
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
    + '.vrd-root .sort-select:focus{outline:2px solid var(--vb-accent,#5EC47A);outline-offset:1px}'
    + '.vrd-root .rank-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}'
    /* min-width:0 is load-bearing: the card is a grid item, and without it the
       grid track's automatic minimum grows to the card's min-content (the
       nowrap .rank-name forces that ~430px wide), so on a phone the track --
       and the card -- overflow the column and get clipped on the right. Zeroing
       the item's min-width lets the track shrink to the container so the name's
       ellipsis engages instead. Pairs with minmax(0,1fr) in the mobile grid. */
    + '.vrd-root .rank-card{background:#fff;border:1px solid #e8e8e8;border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:border-color .15s;min-width:0}'
    + '.vrd-root .rank-card:hover{border-color:var(--vb-accent,#5EC47A)}'
    + '.vrd-root .rank-num-col{display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;min-width:32px}'
    + '.vrd-root .rank-num{font-size:20px;font-weight:900;color:#e0e0e0;line-height:1;text-align:center}'
    + '.vrd-root .rank-num.top3{color:var(--vb-accent,#5EC47A)}'
    + '.vrd-root .rank-pts{font-size:8px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap;text-align:center}'
    + '.vrd-root .rank-info{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:3px}'
    // The whole name shows, on up to four rows when it needs them (Sean, 2026-10-26: "right now they all have ellipses"; four since
    // 2026-10-27, when a long rescue's name beside the ad rail still needed a fourth).
    + '.vrd-root .rank-name{font-size:14px;font-weight:800;color:#1a1a1a;line-height:1.25;overflow-wrap:break-word;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}'
    + '.vrd-root .rank-meta{font-size:12px;font-weight:600;color:#555;line-height:1}'
    + '.vrd-root .rank-subcat{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#666;margin-top:2px}'
    + '.vrd-root .rank-right{display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;gap:6px;flex-shrink:0;height:60px}'
    + '.vrd-root .vote-count{font-size:16px;font-weight:900;color:#1a1a1a;line-height:1}'
    + '.vrd-root .vote-label{font-size:9px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#666}'
    + '.vrd-root .vote-btn{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:6px 10px;border-radius:6px;background:var(--vb-soft,#f0faf4);color:var(--vb-accent-ink,#2d7a4f);border:1px solid var(--vb-line,#b6e5c8);cursor:pointer;font-family:Montserrat,sans-serif;white-space:nowrap}'
    + '.vrd-root .vote-btn:hover{background:var(--vb-accent,#5EC47A);color:#000;border-color:var(--vb-accent,#5EC47A)}'
    // The category and its badges wrap together, so a badge on a second line starts at the edge (2026-10-25).
    + '.vrd-root .rank-subcat{display:flex;flex-wrap:wrap;align-items:center;gap:3px 6px}'
    + '.vrd-root .vrd-vegan{display:inline-block;margin-left:0;font-size:9px;font-weight:800;letter-spacing:.06em;padding:1px 7px;border-radius:10px;vertical-align:1px}'
    + '.vrd-root .vrd-vegan-fully{background:#e3f6e7;color:#1f6b33}'
    + '.vrd-root .vrd-mstat{display:inline-block;font-size:9px;font-weight:800;letter-spacing:.06em;padding:1px 7px;border-radius:10px;vertical-align:1px}'
    + '.vrd-root .vrd-mstat-on{background:#e3f6e7;color:#1f6b33}.vrd-root .vrd-mstat-paused{background:#fff1dc;color:#8a5200}.vrd-root .vrd-mstat-off{background:#eee;color:#555}'
    + '.vrd-root .vrd-vegan-friendly{background:#f0f0f0;color:#555}'
    + '.vrd-root .vrd-vegan-options{background:#f5f1e8;color:#6b5a2e}'
    + '.vrd-root .vrd-vends{display:inline-block;font-size:9px;font-weight:800;letter-spacing:.06em;padding:1px 7px;border-radius:10px;background:#e8eefb;color:#23408e;white-space:nowrap}'
    + '.vrd-root .vrd-verified{display:inline-flex;align-items:center;gap:3px;margin-left:6px;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:2px 7px;border-radius:10px;background:var(--vb-go-hover,#1f5f22);color:#fff;vertical-align:2px;white-space:nowrap}'
    + '.vrd-root .vrd-temp{display:inline-block;margin-left:6px;font-size:9.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:2px 7px;border-radius:10px;background:#fdecea;color:#9b1c1c}'
    + '.vrd-root .rank-right:has(.vla-edit){height:auto}'
    // The count, then Vote as its word and its button; the admins' More menu under them (2026-10-27).
    + '.vrd-root .rank-right{align-items:center;justify-content:center;gap:5px}'
    + '.vrd-root .vla-more{position:relative}'
    + '.vrd-root .vla-more>summary{list-style:none;display:block;text-align:center}'
    + '.vrd-root .vla-more>summary::-webkit-details-marker{display:none}'
    + '.vrd-root .vla-more>summary::after{content:" \\25BE"}'
    + '.vrd-root .vla-menu{position:absolute;right:0;top:calc(100% + 4px);z-index:30;display:flex;flex-direction:column;gap:2px;min-width:130px;padding:6px;background:#fff;border:1px solid #e3e3e3;border-radius:6px;box-shadow:0 8px 24px rgba(0,0,0,.14)}'
    + '.vrd-root .vla-menu .vla-edit{border:0;background:none;text-align:left;padding:8px 10px;border-radius:4px;font-size:11px}'
    + '.vrd-root .vla-menu .vla-edit:hover{background:#fffaf0}'
    + '.vrd-root .vrd-vetting{margin-top:3px;font-size:11px;font-weight:700;color:#8a5a00;line-height:1.3;white-space:nowrap}'
    + '.vrd-root .av{border-radius:10px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}'
    + '.vrd-root .online-badge{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:3px 8px;border-radius:10px;background:var(--vb-soft,#e8f8ef);color:var(--vb-accent-ink,#2d7a4f);border:1px solid var(--vb-line,#b6e5c8)}'
    + '.vrd-root .online-badge::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--vb-accent,#5EC47A)}'
    + '.vrd-root .vrd-empty{grid-column:1/-1;padding:48px 24px;text-align:center;color:#666;font-size:13px;font-weight:600}'
    + '.vrd-root .vrd-foot{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;margin-top:20px;padding-top:16px}'
    + '.vrd-root .vrd-foot .perpage-select{grid-column:3;justify-self:end;margin-left:0}.vrd-root .vrd-foot .perpage-select[hidden]{display:none}'
    + '.vrd-root .vrd-pagination{grid-column:2;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px}'
    + '.vrd-root .vrd-page-num{font-family:Montserrat,sans-serif;font-size:12px;font-weight:800;min-width:34px;height:34px;padding:0 8px;border-radius:6px;border:1px solid #ddd;background:#fff;color:#1a1a1a;cursor:pointer}'
    + '.vrd-root .vrd-page-num:hover:not(.on){border-color:var(--vb-accent,#5EC47A);color:var(--vb-accent-ink,#2d7a4f)}'
    + '.vrd-root .vrd-page-num.on{background:#1a1a1a;border-color:#1a1a1a;color:#fff;cursor:default}'
    + '.vrd-root .vrd-page-gap{font-size:12px;font-weight:800;color:#999;padding:0 2px}'
    + '@media(max-width:640px){.vrd-root .vrd-foot{grid-template-columns:minmax(0,1fr);justify-items:center}.vrd-root .vrd-pagination,.vrd-root .vrd-foot .perpage-select{grid-column:1;justify-self:center}}'
    + '.vrd-root .vrd-page-btn{font-family:Montserrat,sans-serif;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:8px 18px;border-radius:6px;border:1px solid #ddd;background:#fff;color:#1a1a1a;cursor:pointer;transition:border-color .15s}'
    + '.vrd-root .vrd-page-btn:hover:not(:disabled){border-color:var(--vb-accent,#5EC47A);color:var(--vb-accent-ink,#2d7a4f)}'
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
    if (config && config.location) {
      // Location mode (canon-ve-directory-navigation): the chapter is picked in the Location section above, so Area is that
      // chapter's cities. The region dropdown stays hidden; it only carries each chapter's cities (populateGeoBar).
      geoHtml = '<span class="geo-label">Area</span>' +
        '<select aria-label="Filter by region" class="sort-select" data-vrd-region="' + cat.key + '" style="display:none"><option value="">All regions</option></select>' +
        '<select aria-label="Filter by city" class="sort-select" data-vrd-city="' + cat.key + '"><option value="">All Cities</option></select>';
    } else if (config && config.regions) {
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
    if (BRAND.vegan === false) veganHtml = '';
    var typeHtml = veganHtml + '<span class="sb-f"><span class="geo-label">Type</span>' +
      '<select aria-label="Filter by type" class="sort-select" data-vrd-type="' + cat.key + '">' + typeOptions + '</select></span>';
    // Media is everywhere and none of it is a place (Sean, 2026-10-27): no Area, How Vegan or Online / Closed for it.
    if (cat.key === 'media' || cat.key === 'people') typeHtml = '';
    // A sub-section's own filters (SUB_FILTERS), shown while its pill is picked.
    var subHtml = '<span class="vrd-sub" data-sub-for="kind" hidden><span class="geo-label">Makes</span>' +
      '<select aria-label="Filter by what they make" class="sort-select" data-vrd-kind="' + cat.key + '"><option value="">All</option>' +
      KINDS.map(function (k) { return '<option value="' + k[0] + '">' + k[1] + '</option>'; }).join('') + '</select></span>' +
      '<span class="vrd-sub" data-sub-for="cuisine" hidden><span class="geo-label">Food</span>' +
      '<select aria-label="Filter by kind of food" class="sort-select" data-vrd-cuisine="' + cat.key + '"><option value="">All</option>' +
      CUISINES.map(function (k) { return '<option value="' + k[0] + '">' + k[1] + '</option>'; }).join('') + '</select></span>' +
      '<span class="vrd-sub" data-sub-for="chain" hidden><span class="geo-label">Stores</span>' +
      '<select aria-label="National chains or local markets" class="sort-select" data-vrd-chain="' + cat.key + '"><option value="">All</option><option value="1">National chains</option><option value="0">Local markets</option></select></span>' +
      '<span class="vrd-sub" data-sub-for="htype" hidden><span class="geo-label">Practice</span>' +
      '<select aria-label="Filter by kind of practice" class="sort-select" data-vrd-htype="' + cat.key + '"><option value="">All</option>' +
      HEALTH_TYPES.map(function (k) { return '<option value="' + k[0] + '">' + k[1] + '</option>'; }).join('') + '</select></span>' +
      '<span class="vrd-sub" data-sub-for="spec" hidden><span class="geo-label">Specialty</span>' +
      '<select aria-label="Filter by specialty" class="sort-select" data-vrd-spec="' + cat.key + '"><option value="">All</option>' +
      SPECIALTIES.map(function (k) { return '<option value="' + k[0] + '">' + k[1] + '</option>'; }).join('') + '</select></span>' +
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
    // A section opens on its first sub-section; All comes last (Sean, 2026-10-26), except where allFirst says otherwise.
    var allBtn = '<button class="subcat-pill' + (cat.allFirst || !cat.subcats.length ? ' sc-active' : '') + '" data-vrd-subcat="All">All</button>';
    var subcatBtns = (cat.allFirst ? allBtn : '') + cat.subcats.map(function (s, i) { return '<button class="subcat-pill' + (i || cat.allFirst ? '' : ' sc-active') + '" data-vrd-subcat="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') +
      (cat.allFirst ? '' : allBtn);
    var first = cat.allFirst || !cat.subcats.length ? cat.label : cat.subcats[0];
    var searchIcon = '<svg class="vrd-search-icon" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
    var searchHtml = '<div class="vrd-search-wrap">' + searchIcon +
      '<input type="text" class="vrd-search-input" data-vrd-search placeholder="Search ' + esc(first) + '&hellip;" aria-label="Search ' + esc(first) + '">' +
      '</div>';

    // The filters live behind an icon at the right of the search, under the tabs (Sean, 2026-10-27: "hide the filter options...
    // as an icon to the right of the search... they see the filter options and sort by options appear as a drop down. When they
    // click the icon again it closes"). The icon shows how many filters are set.
    // It reads Filters, with how many are set (Sean, 2026-10-30: "make it clear that that's the filter").
    var filterBtn = '<button type="button" class="vrd-filter-btn" data-vrd-filter aria-expanded="false" aria-controls="' + cat.key + '-filters" title="Sort and filter">' +
      '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24" aria-hidden="true"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="7" y1="12" x2="17" y2="12"></line><line x1="10" y1="18" x2="14" y2="18"></line></svg>' +
      '<span>Filters</span><span class="vrd-filter-count" hidden></span></button>';
    // Location mode: the chapter on show as a tag by the search, and the Location section first in the filter.
    var locOn = config && config.location && LOC_SECTIONS.indexOf(cat.key) >= 0;
    var locTag = locOn ? '<button type="button" class="vrd-loc-tag" data-vrd-loc-clear hidden title="Show every location">' +
      '<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z"></path><circle cx="12" cy="10" r="2.5"></circle></svg>' +
      '<span data-vrd-loc-name></span><span class="vrd-x" aria-hidden="true">&times;</span></button>' : '';
    var locSec = locOn ? '<div class="vrd-pop-sec vrd-loc"><div class="vrd-pop-h">Location</div><div class="vrd-loc-grid">' +
      LOC_LEVELS.map(function (lv) { return '<span class="sb-f"><span class="geo-label">' + lv[1] + '</span><select class="sort-select" aria-label="' + lv[1] + '" data-vrd-loc="' + lv[0] + '"></select></span>'; }).join('') +
      '</div></div>' : '';
    // With the sections in the page's banner (config.sectionMenu), the sub-sections are the tab row under it, not in the filter.
    var subTabs = config && config.sectionMenu && cat.subcats.length ? '<div class="vrd-subtabs" role="tablist" aria-label="' + esc(cat.label) + '">' + subcatBtns + '</div>' : '';
    var subInPop = cat.subcats.length && !subTabs;
    return '<div class="board-panel' + (cat.key === 'food' ? ' active' : '') + '" id="board-' + cat.key + '">' +
      // The sub-sections are in the dropdown too, first (Sean, 2026-10-27: "It should also have the Restaurant, Bakeries, Food
      // Truck options in the icon as well"); the search says which one is showing ("Search Restaurants...").
      subTabs +
      '<div class="vrd-tools">' + searchHtml + locTag + filterBtn +
      '<div class="vrd-filter-pop" id="' + cat.key + '-filters" role="region" aria-label="Sort and filter" hidden>' +
        locSec +
        (subInPop ? '<div class="vrd-pop-sec"><div class="vrd-pop-h">' + esc(cat.label) + '</div><div class="subcat-list">' + subcatBtns + '</div></div>' : '') +
        '<div class="vrd-pop-sec"><div class="vrd-pop-h">Sort and filter</div>' + buildBar(cat, config) + '</div>' +
        '<div class="vrd-pop-foot"><button type="button" class="vrd-pop-btn" data-vrd-reset>Reset filters</button>' +
        '<button type="button" class="vrd-pop-btn vrd-pop-done" data-vrd-done>Done</button></div>' +
      '</div></div>' +
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
    return '<div class="vrd-root' + (config && config.sectionMenu ? ' vrd-menu-out' : '') + '">' + tabs + panels + '</div>';
  }

  function makeAvatar(l) {
    var initial = ((l.name || 'V').charAt(0)).toUpperCase();
    var color = l.color || BRAND.avatar || '#3A9B3E';
    var fallback = '<div class="av" style="width:60px;height:60px;min-width:60px;background:' + esc(color) + ';display:none;align-items:center;justify-content:center"><span style="font-size:24px;font-weight:900;color:#fff;line-height:1">' + esc(initial) + '</span></div>';
    if (l.logo_url) {
      // Lazy: the Directory draws every section's cards up front (about 700 logos), so only the ones on screen load
      // (Sean, 2026-10-28: People photos came last, behind every hidden card's logo).
      return '<img class="vrd-logo" loading="lazy" decoding="async" src="' + esc(l.logo_url) + '" style="width:60px;height:60px;min-width:60px;object-fit:cover;border-radius:10px" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' + fallback;
    }
    return '<div class="av" style="width:60px;height:60px;min-width:60px;background:' + esc(color) + ';display:flex;align-items:center;justify-content:center"><span style="font-size:24px;font-weight:900;color:#fff;line-height:1">' + esc(initial) + '</span></div>';
  }

  function cardMeta(l) {
    // A grocery chain (tag ve-grocery-store, 2026-10-08) has no one address but is not an online business.
    if ((l.tags || []).indexOf('ve-grocery-store') >= 0) return 'Grocery store';
    if ((l.communities || []).indexOf('all') >= 0) return 'Every chapter';
    if (!l.address_city && !l.address_state) return '<span class="online-badge">Online</span>';
    // A listing that serves more than one chapter reads like a brand: where it works, not its headquarters' city (Sean,
    // 2026-10-27: Be An Animal Hero "still says Jupiter... we could treat it like a brand").
    var reach = reachOf(l); if (reach) return esc(reach);
    return esc(l.address_city || l.address_state || '');
  }
  // Every chapter, All of Florida (every chapter in a state that has more than one, VE_HUBS[].state), or the chapters by name.
  var STATE_NAMES = { FL: 'Florida', CA: 'California', NY: 'New York', GA: 'Georgia', PA: 'Pennsylvania', DC: 'D.C.', MD: 'Maryland', VA: 'Virginia', GB: 'the UK' };
  function reachOf(l) {
    var c = l.communities || [];
    if (c.indexOf('all') >= 0) return 'Every chapter';
    var hubs = window.VE_HUBS || [], mine = hubsOf(l).split('|').filter(Boolean);
    if (mine.length < 2) return '';
    var names = [], used = {};
    Object.keys(STATE_NAMES).forEach(function (st) {
      var inState = hubs.filter(function (h) { return h.state === st; });
      if (inState.length > 1 && inState.every(function (h) { return mine.indexOf(h.slug) >= 0; })) { names.push('All of ' + STATE_NAMES[st]); inState.forEach(function (h) { used[h.slug] = 1; }); }
    });
    hubs.forEach(function (h) { if (mine.indexOf(h.slug) >= 0 && !used[h.slug]) names.push(h.name); });
    return names.length > 2 ? names.length + ' chapters' : names.join(' & ');
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
    if (BRAND.vegan === false) return '';
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
    // One small More menu instead of two buttons, so the name keeps its room (Sean, 2026-10-27: "a more drop down to replace review
    // and edit... if we wanted to add anything else, we could add it"). A new admin action is one more item here.
    return '<details class="vla-more"><summary class="vla-edit" title="Admin only">More</summary><div class="vla-menu" role="menu">' +
      '<button type="button" class="vla-edit" role="menuitem" data-vla="' + esc(l.id) + '">Edit</button>' +
      '<a class="vla-edit" role="menuitem" data-vrd-review="#l/' + encodeURIComponent(l.id) + '/' + list + '" href="/admin/depot/directory-review#l/' + encodeURIComponent(l.id) + '/' + list + '" target="_blank" rel="noopener">Review</a></div></details>';
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
  // A person is not a place either: every chapter, no address, and the line under the name is what they do (details.person.title).
  var PEOPLE_CATS = ['Activists', 'Content Creators', 'Athletes', 'Physicians', 'Health Experts', 'Chefs', 'Founders'];
  function isPerson(l) { return PEOPLE_CATS.indexOf(l.category) >= 0; }
  function personMeta(l) {
    var spec = l.category === 'Physicians' ? specLabel(l.specialty) : '';
    return esc(l.person_title || spec || l.category || '');
  }
  // A Nonprofit Partner (Sean, 2026-10-29): listings.tags carries ve-nonprofit-partner while the partnership is active.
  function partnerTag(l) { return (l.tags || []).indexOf('ve-nonprofit-partner') >= 0 ? ' <span class="vrd-mstat vrd-mstat-on">Nonprofit Partner</span>' : ''; }
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
    var temp = l.business_status === 'CLOSED_TEMPORARILY' && !isMedia(l) && !isPerson(l) ? ' <span class="vrd-temp">' + statusWords(l.category)[0] + '</span>' : '';
    return '<div class="rank-card" data-name="' + esc(l.name) + '" data-votes="' + votes + '" data-idx="' + idx + '" data-subcat="' + esc(subcat) + '" data-vegan="' + (VEGAN_KEY[l.vegan_status] || '') + '" data-slug="' + esc(l.slug || '') + '" data-city="' + esc(l.address_city || '') + '" data-listing-type="' + esc(type || 'regular') + '" data-plus="' + (isPlus(l) ? 1 : 0) + '"' + extraAttrs(l) + '>' +
      makeAvatar(l) +
      '<div class="rank-info"><div class="rank-name">' + esc(l.name) + verifiedTag(l) + '</div>' +
      (isPerson(l) ? '<div class="rank-meta">' + personMeta(l) + '</div>'
        : isMedia(l) ? '<div class="rank-meta">' + mediaMeta(l) + '</div>'
        : '<div class="rank-meta">' + cardMeta(l) + temp + '</div>' +
          '<div class="rank-subcat">' + esc(l.category || '') + veganTag(l) + vendsTag(l) + partnerTag(l) + '</div>') + vettingNote(l) + '</div>' +
      '<div class="rank-right"><span class="vote-count">' + votes.toLocaleString() + '</span><button class="vote-btn" data-listing-id="' + esc(l.id) + '" title="Vote for this one">' + (votes === 1 ? 'Vote' : 'Votes') + '</button>' + adminBtn(l) + '</div>' +
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
  function inRegion(config, l) { return config.matchListing(l) || isOnline(l) || isMedia(l) || isPerson(l) || serves(l, config.hub); }

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
  // A health professional's practice (details.health_type, Sean 2026-10-27: "doctors, dentists, and that could have its own sub
  // menu"); keep in step with ve-listing-admin.js and the ve-listing-media function.
  var HEALTH_TYPES = [['doctor', 'Doctors'], ['dentist', 'Dentists'], ['dietitian', 'Dietitians & nutritionists'], ['chiropractor', 'Chiropractors'],
    ['therapist', 'Therapists & counselors'], ['other', 'Other practices']];
  // A physician's specialty (details.person.specialty, Sean 2026-10-28: "the physicians, we could break them down to different types
  // of specialties"); keep in step with ve-listing-admin.js.
  var SPECIALTIES = [['cardiology', 'Cardiology'], ['gastroenterology', 'Gastroenterology'], ['internal', 'Internal medicine'], ['family', 'Family medicine'],
    ['lifestyle', 'Lifestyle medicine'], ['psychiatry', 'Psychiatry'], ['urology', 'Urology'], ['surgery', 'Surgery'], ['other', 'Other specialties']];
  function specLabel(k) { var m = SPECIALTIES.filter(function (x) { return x[0] === k; })[0]; return m ? m[1] : ''; }
  function healthLabel(k) { var m = HEALTH_TYPES.filter(function (x) { return x[0] === k; })[0]; return m ? m[1] : ''; }
  // Books sort by what kind of book, never by region (Sean, 2026-10-27); every media sub-section drops the location filter.
  var SUB_FILTERS = { 'Books': { geo: false, booktype: true, years: true }, 'Podcasts': { geo: false, mstat: true }, 'YouTube': { geo: false, mstat: true },
    'News Outlets': { geo: false, mstat: true }, 'Documentaries & Films': { geo: false, years: true }, 'Food Brands': { geo: false, kind: true, sells: true }, 'Nutrition & Supplements': { geo: false, sells: true }, 'Markets': { chain: true }, 'Health Professionals': { htype: true }, 'Restaurants': { cuisine: true },
    'Food Trucks': { cuisine: true }, 'Vendors': { cuisine: true }, 'Catering': { cuisine: true },
    'Activists': { geo: false }, 'Content Creators': { geo: false }, 'Athletes': { geo: false }, 'Physicians': { geo: false, spec: true },
    'Health Experts': { geo: false }, 'Chefs': { geo: false }, 'Founders': { geo: false } };
  // Location (Sean, 2026-10-30, canon canon-ve-directory-navigation: "you would pick the location, maybe the continent... then
  // the country, and then the city... grayed out until you choose the first one"). With config.location the city leaves the page's
  // banner and is picked first in the filter: Continent, Country, Chapter (VE_HUBS[].continent, .country), then Area, the
  // chapter's cities. Every listing is loaded once and the location filters the cards by data-hubs, so a pick redraws nothing.
  // Media and People have no location, nor do the brand sub-sections unless Sells at is Markets & events (geoApplies).
  var LOC_SECTIONS = ['food', 'products', 'services', 'community', 'vetting'];
  var LOC_LEVELS = [['continent', 'Continent'], ['country', 'Country'], ['chapter', 'Chapter']];
  var LOC = { continent: '', country: '', chapter: '' }, LOCCFG = null;
  function locHubs() { return window.VE_HUBS || []; }
  function locHub() { return LOC.chapter ? locHubs().filter(function (h) { return h.slug === LOC.chapter; })[0] || null : null; }
  function locChoices(level) {
    var seen = {}, out = [];
    locHubs().forEach(function (h) {
      var v, label;
      if (level === 'continent') { v = h.continent; label = v; }
      else if (level === 'country') { if (h.continent !== LOC.continent) return; v = h.country; label = v; }
      else { if (h.country !== LOC.country) return; v = h.slug; label = h.name; }
      if (v && !seen[v]) { seen[v] = 1; out.push({ value: v, label: label }); }
    });
    return out;
  }
  // A level with one choice fills itself (Europe fills the United Kingdom, which fills London).
  function locFill() {
    if (LOC.continent && !LOC.country) { var c = locChoices('country'); if (c.length === 1) LOC.country = c[0].value; }
    if (LOC.country && !LOC.chapter) { var h = locChoices('chapter'); if (h.length === 1) LOC.chapter = h[0].value; }
  }
  function locSetTo(level, v) {
    if (level === 'continent') LOC = { continent: v || '', country: '', chapter: '' };
    else if (level === 'country') { LOC.country = v || ''; LOC.chapter = ''; }
    else {
      LOC.chapter = v || '';
      var h = locHub(); if (h) { LOC.country = h.country; LOC.continent = h.continent; }
    }
    if (v) locFill();
  }
  // initial: a chapter's slug, or {continent, country, chapter} as the page kept it.
  function locFrom(init) {
    LOC = { continent: '', country: '', chapter: '' };
    if (!init) return;
    if (typeof init === 'string') { if (locHubs().some(function (h) { return h.slug === init; })) locSetTo('chapter', init); return; }
    if (init.chapter && locHubs().some(function (h) { return h.slug === init.chapter; })) { locSetTo('chapter', init.chapter); return; }
    if (init.continent && locChoices('continent').some(function (c) { return c.value === init.continent; })) {
      locSetTo('continent', init.continent);
      if (init.country && locChoices('country').some(function (c) { return c.value === init.country; })) locSetTo('country', init.country);
    }
  }
  // The chapters the location covers, or null for every location.
  function locSet() {
    if (LOC.chapter) return [LOC.chapter];
    if (!LOC.continent) return null;
    return locHubs().filter(function (h) { return h.continent === LOC.continent && (!LOC.country || h.country === LOC.country); }).map(function (h) { return h.slug; });
  }
  function locName() { var h = locHub(); return h ? h.name : LOC.country || LOC.continent || ''; }
  function geoApplies(panel) {
    if (!panel) return false;
    var sf = subFiltersFor(panel, currentSubcat(panel)), sells = panel.querySelector('[data-vrd-sells]');
    return !(sf.geo === false && !(sf.sells && sells && sells.value === '1'));
  }
  function locApplies(panel) { return !!LOCCFG && !!panel && LOC_SECTIONS.indexOf(panel.id.replace(/^board-/, '')) >= 0 && geoApplies(panel); }
  // The tag by the search and the Location section show only where location applies.
  function locShow(panel) {
    var on = locApplies(panel), sec = panel.querySelector('.vrd-loc'), tag = panel.querySelector('[data-vrd-loc-clear]');
    if (sec) sec.hidden = !on;
    if (tag) { var n = locName(); tag.hidden = !(on && n); var nm = tag.querySelector('[data-vrd-loc-name]'); if (nm) nm.textContent = n; tag.setAttribute('aria-label', 'Showing ' + n + '. Show every location'); }
  }
  // Every panel's three dropdowns, its tag and its Area (the chapter's cities) as LOC stands.
  function locPaint(root) {
    if (!LOCCFG) return;
    var all = { continent: 'All continents', country: 'All countries', chapter: 'All chapters' };
    root.querySelectorAll('.board-panel').forEach(function (panel) {
      panel.querySelectorAll('[data-vrd-loc]').forEach(function (sel) {
        var lv = sel.getAttribute('data-vrd-loc');
        var waiting = (lv === 'country' && !LOC.continent) || (lv === 'chapter' && !LOC.country);
        sel.innerHTML = '<option value="">' + all[lv] + '</option>' + (waiting ? '' : locChoices(lv).map(function (c) { return '<option value="' + esc(c.value) + '">' + esc(c.label) + '</option>'; }).join(''));
        sel.value = LOC[lv] || ''; sel.disabled = waiting;
      });
      var bar = panel.querySelector('.sort-bar'), regionSel = bar && bar.querySelector('[data-vrd-region]'), citySel = bar && bar.querySelector('[data-vrd-city]');
      if (regionSel && citySel) {
        var map = {}; try { map = JSON.parse(regionSel.dataset.cities || '{}'); } catch (e) {}
        var keep = citySel.value, cities = LOC.chapter ? map[LOC.chapter] || [] : [];
        citySel.innerHTML = '<option value="">All Cities</option>' + cities.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('');
        citySel.value = cities.indexOf(keep) >= 0 ? keep : ''; citySel.style.display = '';
      }
      locShow(panel);
    });
  }
  function locChanged(root) {
    locPaint(root);
    root.querySelectorAll('.board-panel').forEach(function (panel) { syncSubFilters(panel); applyPanelFilters(panel, null, true); countFilters(panel); });
    tellSection(root, LOCCFG);
    if (LOCCFG.location.onChange) LOCCFG.location.onChange({ continent: LOC.continent, country: LOC.country, chapter: LOC.chapter }, locHub());
  }

  // Which regions (hub slugs) a listing counts in on /directory: its address's, the chapters it serves, '*' for every one.
  function hubsOf(l) {
    var c = l.communities || [];
    if (c.indexOf('all') >= 0 || isOnline(l) || isMedia(l) || isPerson(l)) return '*';
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
    return ' data-booktype="' + esc(l.book_type || '') + '" data-htype="' + esc(l.health_type || '') + '" data-spec="' + esc(l.specialty || '') + '" data-year="' + esc(l.release_year || '') + '" data-mstat="' + ms + '" data-kinds="' + esc((l.product_kinds || []).join('|')) + '" data-cuisines="' + esc((l.cuisines || []).join('|')) + '" data-chain="' + ((l.tags || []).indexOf('ve-grocery-store') >= 0 ? 1 : 0) + '" data-hubs="' + esc(hubsOf(l)) + '" data-vends="' + (vendsAt(l) ? 1 : 0) + '"';
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
        window.location = (BRAND.listingBase || '/directory/') + slug;
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

    locPaint(root);
    root.querySelectorAll('.board-panel').forEach(function (panel) { syncSubFilters(panel); applyPanelFilters(panel, config, true); });
  }

  // The media section has no location filter on any of its pills, All included.
  function subFiltersFor(panel, sub) {
    var sf = SUB_FILTERS[sub] || {};
    return panel && (panel.id === 'board-media' || panel.id === 'board-people') && sf.geo !== false ? Object.assign({ geo: false }, sf) : sf;
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
    var geo = bar.querySelector('.vrd-geo'); if (geo) geo.hidden = (sf.geo === false && !(sf.sells && sells && sells.value === '1')) || (!!LOCCFG && !LOC.chapter);
    if (LOCCFG) locShow(panel);
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
    var htypeSel = bar ? bar.querySelector('[data-vrd-htype]') : null, htype = sf.htype && htypeSel ? htypeSel.value : '';
    var mstatSel = bar ? bar.querySelector('[data-vrd-mstat]') : null, mstat = sf.mstat && mstatSel ? mstatSel.value : '';
    var specSel = bar ? bar.querySelector('[data-vrd-spec]') : null, spec = sf.spec && specSel ? specSel.value : '';
    var kindSel = bar ? bar.querySelector('[data-vrd-kind]') : null, kind = sf.kind && kindSel ? kindSel.value : '';
    var chainSel = bar ? bar.querySelector('[data-vrd-chain]') : null, chain = sf.chain && chainSel ? chainSel.value : '';
    var cuisineSel = bar ? bar.querySelector('[data-vrd-cuisine]') : null, cuisine = sf.cuisine && cuisineSel ? cuisineSel.value : '';
    var sellsSel = bar ? bar.querySelector('[data-vrd-sells]') : null, sells = sf.sells && sellsSel ? sellsSel.value : '';
    if (sf.geo === false && sells !== '1') { city = ''; county = ''; region = ''; }
    // Location mode: the chapters the location covers, wherever it applies (locApplies).
    var hubSet = null;
    if (LOCCFG) { region = ''; if (locApplies(panel)) hubSet = locSet(); }
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
      if (geoOk && hubSet) { var hl = card.dataset.hubs || ''; geoOk = hl === '*' || hl.split('|').some(function (x) { return hubSet.indexOf(x) > -1; }); }
      if (kind && (card.dataset.kinds || '').split('|').indexOf(kind) < 0) geoOk = false;
      if (booktype && card.dataset.booktype !== booktype) geoOk = false;
      if (htype && card.dataset.htype !== htype) geoOk = false;
      if (mstat && card.dataset.mstat !== mstat) geoOk = false;
      if (spec && card.dataset.spec !== spec) geoOk = false;
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

  // Every section and sub-section has its own address (Sean, 2026-10-27: "if I wanted to send somebody to the markets section
  // of our food directory, I couldn't... when I'm going back, it's taking me to the main page and resetting everything"):
  // ?tab=<section>&sub=<sub-section> (food, markets; bakeries-and-cafes), pushed on each click so back and forward move
  // through them. Not the city: the same link opens in whichever chapter the visitor has picked. config.url is the path the
  // address belongs to (/directory, /dashboard/directory); a city hub, whose ?tab= is its own section, leaves it out.
  function subSlug(v) { return String(v || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function defaultPill(panel) {
    var pills = panel ? panel.querySelectorAll('[data-vrd-subcat]') : [];
    for (var i = 0; i < pills.length; i++) if (pills[i].classList.contains('sc-active') && pills[i]._vrdDefault) return pills[i];
    return pills[0] || null;
  }
  function urlHere(config) { return config && config.url && location.pathname.replace(/\/$/, '') === config.url; }
  function pushSection(root, config, tab, sub) {
    if (!urlHere(config) || root._vrdRestoring) return;
    var q = new URLSearchParams(location.search);
    q.set('tab', tab);
    if (sub) q.set('sub', subSlug(sub)); else q.delete('sub');
    var s = q.toString(), url = location.pathname + (s ? '?' + s : '') + location.hash;
    if (url !== location.pathname + location.search + location.hash) history.pushState({ vrdTab: tab, vrdSub: sub || '' }, '', url);
  }
  // Opens the section and sub-section the address names (the first section and its first pill when it names none).
  function applySection(root, config) {
    var q = new URLSearchParams(location.search), tab = (q.get('tab') || '').replace(/[^a-z]/g, ''), sub = q.get('sub') || '';
    var btn = (tab && root.querySelector('[data-vrd-tab="' + tab + '"]')) || (urlHere(config) ? root.querySelector('[data-vrd-tab]') : null);
    if (!btn) return;
    root._vrdRestoring = true;
    try {
      if (!btn.classList.contains('active') || tab) btn.click();
      var panel = root.querySelector('#board-' + btn.getAttribute('data-vrd-tab'));
      var pill = sub && panel ? Array.prototype.filter.call(panel.querySelectorAll('[data-vrd-subcat]'), function (b) {
        var v = b.getAttribute('data-vrd-subcat'); return v === sub || subSlug(v) === subSlug(sub);
      })[0] : defaultPill(panel);
      if (pill && !pill.classList.contains('sc-active')) pill.click();
    } finally { root._vrdRestoring = false; }
  }

  // config.onSection(key, label, subs): the section on show (the Directory's banner names it under its title, Sean 2026-10-27),
  // and its sub-sections {list: [{value, label}], active, pick(value)} for a banner that picks them (Media's kinds, Sean
  // 2026-10-29: "the drop down shows the cities, and instead it should show the different types... and any new thing that we
  // get on there"). The list is the section's own pills, so a new sub-section joins it; All comes where the pills put it.
  function tellSection(root, config) {
    var on = root.querySelector('.cat-tab.active'), key = on && on.getAttribute('data-vrd-tab');
    var c = CAT_CONFIG.filter(function (x) { return x.key === key; })[0];
    if (!(config && config.onSection && c)) return;
    var panel = root.querySelector('#board-' + c.key);
    var pills = panel ? Array.prototype.filter.call(panel.querySelectorAll('[data-vrd-subcat]'), function (b) { return !b.hidden && b.style.display !== 'none'; }) : [];
    var act = panel && panel.querySelector('.subcat-pill.sc-active');
    config.onSection(c.key, c.label, {
      list: pills.map(function (b) { var v = b.getAttribute('data-vrd-subcat'); return { value: v, label: v === 'All' ? 'All ' + c.label.toLowerCase() : b.textContent.trim() }; }),
      active: act ? act.getAttribute('data-vrd-subcat') : '',
      pick: function (v) {
        var b = pills.filter(function (x) { return x.getAttribute('data-vrd-subcat') === v; })[0];
        if (b && !b.classList.contains('sc-active')) b.click();
      },
      // The sections, for a banner that is the Directory's menu (config.sectionMenu, canon-ve-directory-navigation), and open(key).
      sections: catsFor().map(function (x) { return { value: x.key, label: x.label }; }),
      open: function (k) { var t = root.querySelector('[data-vrd-tab="' + k + '"]'); if (t && !t.classList.contains('active')) t.click(); },
      // Location mode: whether this section and sub-section use the location, and what it is.
      location: LOCCFG ? { applies: locApplies(panel), name: locName(), chapter: LOC.chapter, continent: LOC.continent, country: LOC.country } : null
    });
  }
  // How many filters differ from where they started, on the icon.
  function countFilters(panel) {
    var btn = panel.querySelector('[data-vrd-filter]'), badge = btn && btn.querySelector('.vrd-filter-count');
    if (!badge) return;
    var n = 0;
    panel.querySelectorAll('.vrd-filter-pop select').forEach(function (sel) {
      if (sel.hasAttribute('data-vrd-loc')) return;
      var wrap = sel.closest('.vrd-sub'); if (wrap && wrap.hidden) return;
      if (sel.style.display === 'none' || sel.hidden) return;
      if (sel._vrdStart !== undefined && sel.value !== sel._vrdStart) n++;
    });
    badge.textContent = n; badge.hidden = !n;
  }
  function wireControls(root, state) {
    root.querySelectorAll('.vrd-filter-pop select').forEach(function (sel) { sel._vrdStart = sel.value; });
    root.querySelectorAll('[data-vrd-filter]').forEach(function (btn) {
      var pop = root.querySelector('#' + btn.getAttribute('aria-controls'));
      btn.addEventListener('click', function () {
        var open = pop.hidden; pop.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) { var first = pop.querySelector('select'); if (first) first.focus(); }
      });
      pop.addEventListener('change', function () { countFilters(btn.closest('.board-panel')); });
      var close = function () { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
      var done = pop.querySelector('[data-vrd-done]'); if (done) done.addEventListener('click', function () { close(); btn.focus(); });
      // Reset puts every filter back where it started (the sub-section stays); each change runs the page's own filtering.
      var reset = pop.querySelector('[data-vrd-reset]'); if (reset) reset.addEventListener('click', function () {
        pop.querySelectorAll('.sort-bar select').forEach(function (sel) {
          if (sel._vrdStart !== undefined && sel.value !== sel._vrdStart) { sel.value = sel._vrdStart; sel.dispatchEvent(new Event('change', { bubbles: true })); }
        });
        countFilters(btn.closest('.board-panel'));
      });
      pop.addEventListener('keydown', function (e) { if (e.key === 'Escape') { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); } });
    });
    root.querySelectorAll('.board-panel').forEach(function (panel) {
      var on = panel.querySelector('.subcat-pill.sc-active'); if (on) on._vrdDefault = true;
    });
    root.querySelectorAll('[data-vrd-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        root.querySelectorAll('.cat-tab').forEach(function (t) { t.classList.remove('active'); });
        root.querySelectorAll('.board-panel').forEach(function (p) { p.classList.remove('active'); });
        btn.classList.add('active');
        var panel = root.querySelector('#board-' + btn.getAttribute('data-vrd-tab'));
        panel.classList.add('active');
        openToolFrame(root, btn.getAttribute('data-vrd-tab'));
        tellSection(root, state);
        var on = panel.querySelector('.subcat-pill.sc-active');
        pushSection(root, state, btn.getAttribute('data-vrd-tab'), on && !on._vrdDefault ? on.getAttribute('data-vrd-subcat') : '');
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
        countFilters(panel);
        var q = panel.querySelector('[data-vrd-search]'), sub = btn.getAttribute('data-vrd-subcat');
        if (q) { var lbl = sub === 'All' ? (CAT_CONFIG.filter(function (c) { return 'board-' + c.key === panel.id; })[0] || {}).label : sub; q.placeholder = 'Search ' + lbl + '\u2026'; q.setAttribute('aria-label', 'Search ' + lbl); }
        pushSection(root, state, panel.id.replace(/^board-/, ''), btn._vrdDefault ? '' : btn.getAttribute('data-vrd-subcat'));
        if (panel.classList.contains('active')) tellSection(root, state);
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
    root.querySelectorAll('[data-vrd-kind], [data-vrd-chain], [data-vrd-cuisine], [data-vrd-sells], [data-vrd-booktype], [data-vrd-htype], [data-vrd-mstat], [data-vrd-spec]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var panel = sel.closest('.board-panel');
        if (sel.hasAttribute('data-vrd-sells')) { syncSubFilters(panel); if (panel.classList.contains('active')) tellSection(root, state); }
        applyPanelFilters(panel, state, true);
      });
    });

    root.querySelectorAll('[data-vrd-loc]').forEach(function (sel) {
      sel.addEventListener('change', function () { locSetTo(sel.getAttribute('data-vrd-loc'), sel.value); locChanged(root); });
    });
    root.querySelectorAll('[data-vrd-loc-clear]').forEach(function (b) {
      b.addEventListener('click', function () { locSetTo('continent', ''); locChanged(root); });
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
    var url = SUPABASE_URL + '/rest/v1/listings?select=id,slug,name,category,logo_url,vote_count,voter_count,claim_status,extra_categories,business_status,is_featured,ve_verified,ve_verified_tier,ve_verified_until,address_city,address_state,color,vegan_status,tags,communities,product_kinds,cuisines,vetted_at,release_year:details->>release_year,book_type:details->>book_type,health_type:details->>health_type,person_title:details->person->>title,specialty:details->person->>specialty&status=eq.approved&order=id&limit=1000&offset=' + (offset || 0);
    fetch(url, { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        acc = acc.concat(data || []);
        // offset starts undefined, so (offset || 0): undefined + 1000 is NaN, which the address turned back into 0 and the
        // first page loaded forever once the Directory passed 1,000 listings (2026-10-28).
        if (Array.isArray(data) && data.length === 1000) { fetchAll(root, config, (offset || 0) + 1000, acc); }
        else {
          var approved = acc.filter(function (l) { return inRegion(config, l) && ownListing(l); });
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
    if (!window.__vrdMoreClose) {
      window.__vrdMoreClose = true;
      document.addEventListener('click', function (e) {
        document.querySelectorAll('.vla-more[open]').forEach(function (d) { if (!d.contains(e.target)) d.removeAttribute('open'); });
      });
    }
    root.querySelectorAll('.vla-menu .vla-edit').forEach(function (x) { x.addEventListener('click', function () { var d = x.closest('details'); if (d) d.removeAttribute('open'); }); });
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
    if (BRAND.trust === false) return cb(null);
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
    var url = SUPABASE_URL + '/rest/v1/listings?select=id,slug,name,category,logo_url,vote_count,voter_count,claim_status,extra_categories,business_status,is_featured,ve_verified,ve_verified_tier,ve_verified_until,address_city,address_state,color,vegan_status,tags,communities,product_kinds,cuisines,vetted_at,release_year:details->>release_year,book_type:details->>book_type,health_type:details->>health_type,person_title:details->person->>title,specialty:details->person->>specialty&status=eq.closed&limit=1000';
    fetch(url, { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } })
      .then(function (r) { return r.json(); })
      .then(function (data) { populateGrids(root, config, approved, (data || []).filter(function (l) { return inRegion(config, l) && ownListing(l); })); })
      .catch(function () { populateGrids(root, config, approved, []); });
  }

  window.VERegionDirectory = {
    init: function (config) {
      var root = document.getElementById(config.mount);
      if (!root) return;
      useBrand(config.brand);
      injectStyleOnce();
      // config.location = {initial, onChange(loc, hub)}: the location is picked in the filter (canon-ve-directory-navigation).
      LOCCFG = config.location ? config : null;
      if (LOCCFG) locFrom(config.location.initial);
      root.innerHTML = renderSkeleton(config);
      wireControls(root, config);
      locPaint(root);
      root.querySelectorAll('.board-panel').forEach(function (panel) { syncSubFilters(panel); });
      fetchAll(root, config);
      tellSection(root, config);
      if (config.url) {
        applySection(root, config);
        if (!root._vrdPop) { root._vrdPop = config; window.addEventListener('popstate', function () { if (urlHere(root._vrdPop)) applySection(root, root._vrdPop); }); }
        else root._vrdPop = config;
      }
    },
    // The same listing card anywhere else (Sean, 2026-10-08: a Guide shows Directory listings "with
    // the same look and feel of the current directory"). Put cards inside an element with class
    // vrd-root and a .rank-grid; wire() adds votes and opens a listing through onOpen(slug, name)
    // so the visitor stays where they are. A listing needs the fields fetchAll selects.
    css: injectStyleOnce,
    // A brand's cards outside init (2026-10-30: a LESARUSS.ai Guide's Directory tab): the same config.brand init takes, so the
    // card reads like that brand's Directory (no How Vegan, its avatar color, its listing addresses).
    brand: function (b) { useBrand(b); },
    card: function (l, idx) { return makeBrowseCard(l, idx || 0, isOnline(l) ? 'online' : 'regular'); },
    wire: function (root, onOpen) { bindVoteButtons(root); bindCardClicks(root, onOpen ? { onOpenListing: onOpen } : null); },
    FIELDS: 'id,slug,name,category,logo_url,vote_count,voter_count,claim_status,extra_categories,business_status,is_featured,ve_verified,ve_verified_tier,ve_verified_until,address_city,address_state,color,vegan_status,tags,communities,product_kinds,cuisines,vetted_at,release_year:details->>release_year,book_type:details->>book_type,health_type:details->>health_type'
  };
})();
