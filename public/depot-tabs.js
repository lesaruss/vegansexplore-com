/* The Depot's tab bar (Sean, 2026-09-27): one place for a brand's media, with its
 * features as tabs. Put <div id="depot-tabs"></div> where the tabs go and load this.
 * A new Depot feature is one more entry in TABS.
 * Inbox and Sources (Sean, 2026-09-28, content engine plan) replaced News Desk and City News.
 */
// The Depot lives in the dashboard (Sean, 2026-10-27: "the depot should be a tool... in the dashboard"). A Depot page opened on
// its own by a signed-in super admin moves to /dashboard/depot/<page>, keeping its query and #view. Anyone else is left where
// they are (the page's own sign-in check answers them).
// The dashboard loads this file only for the page list (window.VE_DEPOT_LIST_ONLY): Your tools' search lists every Depot page
// (Sean, 2026-10-30), read from TABS below, so there is one list.
(function () {
  if (window.VE_DEPOT_LIST_ONLY) return;
  var top = true; try { top = window.self === window.top; } catch (e) { top = false; }
  if (!top) return;
  var m = null; try { m = JSON.parse(localStorage.getItem('ve_member') || 'null'); } catch (e) {}
  var viewing = null; try { viewing = localStorage.getItem('ve_view_as'); } catch (e) {}
  var tok = null; try { tok = localStorage.getItem('ve_token'); } catch (e) {}
  if (!m || !m.is_superadmin || !tok || viewing) return;
  var page = location.pathname.replace(/^\/admin\/depot\/?/, '').replace(/\.html$/, '').replace(/\/$/, '').replace(/^index$/, '');
  if (!/^[a-z0-9-]*$/i.test(page)) return;
  location.replace('/dashboard/depot' + (page ? '/' + page : '') + location.search + location.hash);
})();

(function () {
  // Trimmed and grouped (Sean, 2026-10-27: "way too many things in there... some of the stuff could probably be removed based
  // off... an obsolete idea"; "go"). Out of the menu, still open by their address: Logos (Directory review > Logos does it),
  // Pulse and Pulse Cities (the old article Pulse and city news), Passport Partners (the $250 / $500 plans, replaced by the $111
  // Partner plan), Tours (2027), Passport Challenge (not running) and Import narration
  // (part of Onboarding). Put one back by adding its row here.
  // The Depot home (Sean, 2026-11-07, playbook branddesk-production-wing): the Depot opens on an overview of sections, one tile
  // each, instead of the Library. Every tool belongs to one section (its group); a section's tools are listed together, so the Go to
  // menu shows each section once (it showed Content twice when rows of another group sat between Content rows). Admin and Site and QA
  // are gone: their tools moved into these sections. "Moving to BrandDesk" holds what BrandDesk takes over, each tool staying here
  // until BrandDesk does everything it does. Retired tools are in TRASH, below, never deleted, restorable from the home's Trash bin.
  var SECTIONS = [
    { k: 'directory', label: 'Directory', line: 'Directory review, Logos, Events, Claims, Venues, Badges, Certification, Secret Shopper' },
    { k: 'content', label: 'Content', line: 'Inbox, Sources, Content index, Books, Cookbook, Search questions, Library' },
    { k: 'bounties', label: 'Bounties', line: 'Bounty proofs, check-in photos and receipts, submissions, the watchlist' },
    { k: 'guides', label: 'Guides', line: 'Every tour video: script, recordings, lookbook. Journeys, onboarding, the checklist' },
    { k: 'ideas', label: 'Ideas', line: 'Every idea you drop in, and feedback from the site' },
    { k: 'demos', label: 'Demos', line: 'The sample restaurant, sample group, Gig Board, Campaign Engine, pitch decks' },
    { k: 'branddesk', label: 'BrandDesk', line: 'Social, outreach campaigns and send days, playbooks, the podcast, Insights. Opens in HQ.' },
    { k: 'moving', label: 'Moving to BrandDesk', line: 'People, partners and invites, members, Analytics. Here until BrandDesk does all of it.' }
  ];
  var TABS = [
    { group: 'Directory', href: '/admin/depot/directory-review', label: 'Directory review' },
    // Logos is a Directory tool again (Sean, 2026-11-07: "it should be in a directory with everything else"); star it for My list.
    { group: 'Directory', href: '/admin/depot/directory-review#logos', label: 'Logos' },
    { group: 'Directory', href: '/admin/depot/events', label: 'Events' },
    { group: 'Directory', href: '/admin/depot/claims', label: 'Claims' },
    { group: 'Directory', href: '/admin/depot/venues', label: 'Venues' },
    { group: 'Directory', href: '/admin/depot/badges', label: 'Business badges' },
    { group: 'Directory', href: '/admin/depot/holiday-menus', label: 'Holiday menus' },
    { group: 'Directory', href: '/admin/depot/certification', label: 'Pre-Vegan Certification' },
    { group: 'Directory', href: '/admin/depot/challenge-stops', label: 'Passport Challenge stops' },
    { group: 'Directory', href: '/admin/depot/event-sponsors', label: 'Event sponsors' },
    { group: 'Directory', href: '/admin/depot/brand-campaigns', label: 'Brand campaigns' },
    { group: 'Directory', href: '/dashboard/secret-shopper', label: 'Secret Shopper', kind: 'dash' },
    { group: 'Content', href: '/admin/depot/inbox', label: 'Inbox' },
    { group: 'Content', href: '/admin/depot/sources', label: 'Sources' },
    { group: 'Content', href: '/admin/depot/pulse-subscribers', label: 'Pulse subscribers' },
    { group: 'Content', href: '/admin/depot/content-index', label: 'Content index' },
    { group: 'Content', href: '/admin/depot/books', label: 'Books' },
    { group: 'Content', href: '/admin/depot/mentions', label: 'In this story' },
    { group: 'Content', href: '/admin/depot/listing-posts', label: 'Social posts' },
    { group: 'Content', href: '/admin/depot/cookbook', label: 'Cookbook' },
    { group: 'Content', href: '/admin/depot/search-questions', label: 'Search questions' },
    { group: 'Content', href: '/admin/depot/comments', label: 'Comments' },
    { group: 'Content', href: '/admin/depot/nominations', label: 'Nominations' },
    { group: 'Content', href: '/admin/depot/library', label: 'Library' },
    { group: 'Bounties', href: '/admin/depot/bounties', label: 'Bounties' },
    { group: 'Bounties', href: '/admin/depot/checkins', label: 'Check-ins' },
    { group: 'Bounties', href: '/dashboard/submissions', label: 'Submissions', kind: 'dash' },
    { group: 'Bounties', href: '/admin/depot/watchlist', label: 'Watchlist' },
    { group: 'Guides', href: '/admin/depot/guides', label: 'Guides and tours' },
    { group: 'Guides', href: '/admin/depot/preview', label: 'Preview journeys' },
    { group: 'Guides', href: '/admin/depot/onboarding', label: 'Onboarding' },
    { group: 'Guides', href: '/admin/depot/dashboard-checklist', label: 'Dashboard checklist' },
    { group: 'Ideas', href: '/admin/depot/ideas', label: 'Ideas' },
    { group: 'Ideas', href: '/admin/depot/feedback', label: 'Feedback' },
    { group: 'Ideas', href: '/admin/depot/next-chapters', label: 'Next chapter suggestions' },
    // Demos (Sean, 2026-10-30): the samples and walkthroughs we show people, kind 'demo', each opening in a new tab as the public sees it.
    { group: 'Demos', href: '/business/sample', label: 'Sample business', kind: 'demo' },
    { group: 'Demos', href: '/groups/sample', label: 'Sample group', kind: 'demo' },
    { group: 'Demos', href: '/gigs/sample', label: 'Sample Gig Board', kind: 'demo' },
    { group: 'Demos', href: '/campaign-engine', label: 'The Campaign Engine', kind: 'demo' },
    { group: 'Demos', href: '/campaign-engine/fieldhouse-protein', label: 'Campaign on a listing', kind: 'demo' },
    { group: 'Demos', href: '/campaign-engine/fieldhouse-protein/social', label: 'Campaign in the feeds', kind: 'demo' },
    { group: 'Demos', href: '/campaign-engine/fieldhouse-protein/dashboard', label: 'Campaign sponsor dashboard', kind: 'demo' },
    { group: 'Demos', href: '/campaign-engine/fieldhouse-protein/report', label: 'Campaign final report', kind: 'demo' },
    { group: 'Demos', href: '/partners', label: 'Partner walkthrough', kind: 'demo' },
    { group: 'Demos', href: '/partners/pitches/vegans-explore-dolphins-pitch', label: 'Pitch: Miami Dolphins', kind: 'demo' },
    { group: 'Demos', href: '/partners/pitches/vegans-explore-supermarket-pitch', label: 'Pitch: Supermarkets', kind: 'demo' },
    { group: 'Demos', href: '/partners/pitches/vegans-explore-night-event-pitch', label: 'Pitch: Night events', kind: 'demo' },
    { group: 'Demos', href: '/partners/pitches/vegans-explore-global-tour-pitch', label: 'Pitch: Global tour', kind: 'demo' },
    { group: 'Demos', href: '/partners/pitches/vegans-explore-cm-pitch', label: 'Pitch: Community Managers', kind: 'demo' },
    // BrandDesk (Sean, 2026-11-07: BrandDesk lives in HQ and Vegans Explore links to it; the Depot copies BrandDesk already does
    // better are in the trash bin). Kind 'hq': opens BrandDesk in a new tab, signed in with the LESARUSS account.
    { group: 'BrandDesk', href: 'https://hq.lesaruss.ai/branddesk/brands/vegans-explore?view=social', label: 'Social', kind: 'hq' },
    { group: 'BrandDesk', href: 'https://hq.lesaruss.ai/branddesk/brands/vegans-explore?view=people&p=campaigns', label: 'Outreach campaigns', kind: 'hq' },
    { group: 'BrandDesk', href: 'https://hq.lesaruss.ai/branddesk/brands/vegans-explore?view=people&p=days', label: 'Send days and cities', kind: 'hq' },
    { group: 'BrandDesk', href: 'https://hq.lesaruss.ai/branddesk/brands/vegans-explore?view=blueprint&b=playbooks', label: 'Playbooks', kind: 'hq' },
    { group: 'BrandDesk', href: 'https://hq.lesaruss.ai/branddesk/brands/vegans-explore?view=podcast', label: 'Podcast', kind: 'hq' },
    { group: 'BrandDesk', href: 'https://hq.lesaruss.ai/branddesk/brands/vegans-explore?view=insights', label: 'Insights', kind: 'hq' },
    { group: 'Moving to BrandDesk', href: '/admin/depot/people', label: 'People' },
    { group: 'Moving to BrandDesk', href: '/admin/depot/ambassadors', label: 'Ambassadors' },
    { group: 'Moving to BrandDesk', href: '/admin/depot/founding', label: 'Founding Members' },
    { group: 'Moving to BrandDesk', href: '/admin/depot/nonprofit-partners', label: 'Nonprofit Partners' },
    { group: 'Moving to BrandDesk', href: '/admin/depot/group-partners', label: 'Group Partners' },
    { group: 'Moving to BrandDesk', href: '/admin/depot/community-managers', label: 'Community Managers' },
    { group: 'Moving to BrandDesk', href: '/admin/depot/profiles', label: 'Profiles' },
    { group: 'Moving to BrandDesk', href: '/admin/depot/invites', label: 'Invites' },
    { group: 'Moving to BrandDesk', href: '/admin/depot/referral-claims', label: 'Referral claims' },
    { group: 'Moving to BrandDesk', href: '/admin/depot/links', label: 'Links' },
    // Members is a read-only Depot page (2026-11-08; Sean, 2026-11-07: "The Depot keeps a read-only member list"). The old roster with its
    // class moves, /dashboard/members, still opens by its address.
    { group: 'Moving to BrandDesk', href: '/dashboard/leads', label: 'Leads', kind: 'dash' },
    { group: 'Moving to BrandDesk', href: '/dashboard/applications', label: 'Role applications', kind: 'dash' },
    { group: 'Moving to BrandDesk', href: '/admin/depot/branddesk', label: 'BrandDesk clients' }
  ];
  // The trash bin (Sean, 2026-11-07: "a visible trash bin... if I ever want to resurrect it"). Retired, never deleted: the page,
  // its data and its function stay. Restoring one (the home's Trash bin, ve-depot trash_set) puts it back in its section. Keep the
  // hrefs in step with TRASH in supabase/functions/ve-depot.
  var TRASH = [
    { href: '/admin/depot/challenges', label: 'Challenges', group: 'Bounties', why: 'The three Earn your Passport challenges were retired on November 3, 2026: the survey is the way in.' },
    { href: '/admin/depot/challenge', label: 'Passport Challenge', group: 'Directory', why: 'The scavenger hunt is not running. No hunt was ever made.' },
    { href: '/admin/depot/challenge-card', label: 'Passport Challenge card', group: 'Directory', why: 'The scavenger hunt\'s printable card.' },
    { href: '/admin/depot/challenge-kit', label: 'Passport Challenge kit', group: 'Directory', why: 'The scavenger hunt\'s kit for stops.' },
    { href: '/admin/depot/pulse', label: 'Pulse (old articles)', group: 'Content', why: 'The old article Pulse. The Daily Pulse on the Community Board replaced it.' },
    { href: '/admin/depot/pulse-cities', label: 'Pulse Cities', group: 'Content', why: 'City news, retired on October 5, 2026 for the Daily Pulse.' },
    { href: '/admin/depot/verified', label: 'Passport Partners', group: 'Directory', why: 'The $250 and $500 plans, replaced by the $111 Partner plan.' },
    { href: '/admin/depot/logos', label: 'Logos (old page)', group: 'Directory', why: 'A second Logos page. Logos in Directory review does it.' },
    { href: '/admin/depot/tours', label: 'Tours', group: 'Directory', why: 'A 2027 idea. No tour was ever made.' },
    { href: '/admin/depot/services', label: 'Services', group: 'Directory', why: 'The old one-thing services. The shop is BrandDesk\'s now. No order was ever made.' },
    { href: '/admin/depot/dinners', label: 'Dinner guests', group: 'Moving to BrandDesk', why: 'Dinner seats on us ended with comps. One dinner, October 4.' },
    { href: '/admin/depot/narration', label: 'Import narration', group: 'Guides', why: 'Part of Onboarding.' },
    { href: '/dashboard/insights', label: 'Community Insights', group: 'Moving to BrandDesk', kind: 'dash', why: 'Moved to BrandDesk > Vegans Explore > Insights > Members on November 7, 2026.' },
    { href: '/dashboard/health', label: 'Platform health', group: 'Moving to BrandDesk', kind: 'dash', why: 'Moved to BrandDesk > Vegans Explore > Insights > Health on November 7, 2026.' },
    { href: '/dashboard/guest-reviews', label: 'Guest reviews', group: 'Moving to BrandDesk', kind: 'dash', why: 'The old free Guest Passport queue. Nobody has been in it since free accounts ended.' }
  ];
  // A restored tool goes back to its section. The home saves the list in this browser (ve_depot_restored) after reading it.
  var restored = []; try { restored = JSON.parse(localStorage.getItem('ve_depot_restored') || '[]') || []; } catch (e) {}
  TRASH.forEach(function (t) { if (restored.indexOf(t.href) >= 0) TABS.push({ group: t.group, href: t.href, label: t.label, kind: t.kind, restored: true }); });
  var ORDER = SECTIONS.map(function (x) { return x.label; });
  TABS.sort(function (a, b) { return ORDER.indexOf(a.group) - ORDER.indexOf(b.group); });
  window.VE_DEPOT_SECTIONS = SECTIONS;
  window.VE_DEPOT_TRASH = TRASH;
  // How often and when each one was opened, in this browser, for the dashboard's Depot box (Sean, 2026-10-30: "the most used depot
  // tools... sorted by most recently used"). A Depot page counts itself as it loads; the dashboard counts the others as it opens them.
  window.VE_DEPOT_USE = function (href) {
    try { var u = JSON.parse(localStorage.getItem('ve_depot_use') || '{}'); var x = u[href] || { n: 0 }; x.n++; x.at = Date.now(); u[href] = x; localStorage.setItem('ve_depot_use', JSON.stringify(u)); } catch (e) {}
  };
  window.VE_DEPOT_TABS = TABS;
  if (window.VE_DEPOT_LIST_ONLY) return;
  // Sean, 2026-09-29: a drop-down to the right of the page title instead of a row of tabs,
  // so the pages feel less busy. The current page is the selected option.
  // Sean, 2026-09-29: the drop-down sits on the far right, "Go to" on one line. Its styles are
  // !important where a page styles every select (Pulse sets select{width:100%}).
  var CSS = '.depot-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 16px;margin-bottom:18px;}' +
    '.depot-head h1{margin-bottom:0 !important;min-width:0;}' +
    '.depot-go{display:flex;align-items:center;gap:8px;flex:0 0 auto;margin-left:auto;}' +
    '.depot-go span{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:rgba(26,26,26,0.8);white-space:nowrap;}' +
    // Sean, 2026-10-27: the drop-down looks like every other drop-down on the site (claim.html's select): white, a 6px corner,
    // plain words, our green chevron 16px in from the edge. No pill.
    '.depot-go select{width:auto !important;flex:0 0 auto;font:inherit;font-size:14px;font-weight:700;letter-spacing:0;text-transform:none;color:#1a1a1a;min-height:46px;padding:10px 46px 10px 14px;border:1.5px solid rgba(0,0,0,0.18);border-radius:6px;background-color:#fff;cursor:pointer;max-width:100%;min-width:240px;' +
    '-webkit-appearance:none;-moz-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'9\' viewBox=\'0 0 14 9\'%3E%3Cpath d=\'M1 1l6 6 6-6\' fill=\'none\' stroke=\'%231f5f22\' stroke-width=\'2.2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 16px center;background-size:14px 9px;}' +
    '.depot-go select:hover{border-color:rgba(0,0,0,0.4);}' +
    '.depot-go select:focus-visible{outline:3px solid #22C55E;outline-offset:2px;}' +
    // On a phone the tour button is full width under Go to, the same size as the drop-down (Sean, 2026-10-27).
    '@media (max-width:560px){.depot-go{flex:1 1 100%;}.depot-go select{flex:1 1 auto;min-width:0;}.depot-head .ve-tour-launch{flex:1 1 100%;min-height:46px;}}';
  function mount() {
    var el = document.getElementById('depot-tabs'); if (!el) return;
    var at = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '');
    if (TABS.some(function (t) { return t.href === at; })) window.VE_DEPOT_USE(at);
    if (!document.getElementById('depot-tabs-css')) { var st = document.createElement('style'); st.id = 'depot-tabs-css'; st.textContent = CSS; document.head.appendChild(st); }
    var here = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '');
    var go = document.createElement('label'); go.className = 'depot-go';
    go.innerHTML = '<span>Go to</span><select aria-label="Go to another part of the Depot">' +
      '<option value="/admin/depot"' + (here === '/admin/depot' ? ' selected' : '') + '>Depot home</option>' +
      TABS.reduce(function (h, t, k) {
        var open = !k || TABS[k - 1].group !== t.group, close = k === TABS.length - 1 || TABS[k + 1].group !== t.group;
        return h + (open ? '<optgroup label="' + t.group + '">' : '') + '<option value="' + t.href + '"' + (here === t.href ? ' selected' : '') + '>' + t.label + '</option>' + (close ? '</optgroup>' : '');
      }, '') + '</select>';
    // A Depot page goes here; a demo opens in a new tab; a dashboard page asks the dashboard around this frame to open it.
    go.querySelector('select').addEventListener('change', function () {
      var t = TABS.filter(function (x) { return x.href === this.value; }, this)[0]; if (!t) return;
      if (t.kind === 'demo' || t.kind === 'hq') { window.VE_DEPOT_USE(t.href); window.open(t.href, '_blank', 'noopener'); this.value = here; return; }
      if (t.kind === 'dash') {
        var inDash = false; try { inDash = window.self !== window.top && /^\/dashboard/.test(window.top.location.pathname); } catch (e) {}
        window.VE_DEPOT_USE(t.href);
        if (inDash) { window.top.postMessage({ type: 've-open-tool', href: t.href, label: t.label }, location.origin); this.value = here; return; }
      }
      location.href = t.href;
    });
    // A retired tool opened by its address says so, with Restore (the page still works; nothing was deleted).
    var gone = TRASH.filter(function (t) { return t.href === here; })[0];
    if (gone && restored.indexOf(gone.href) < 0) {
      var note = document.createElement('div');
      note.setAttribute('role', 'status');
      note.style.cssText = 'background:#FFF7EC;border:1px solid #f5d9b0;border-radius:10px;padding:12px 14px;margin:0 0 16px;font-size:13.5px;color:#5a3a00;display:flex;flex-wrap:wrap;gap:10px;align-items:center;';
      note.innerHTML = '<span style="flex:1 1 320px"><b>This tool is in the trash bin.</b> ' + gone.why + ' It still works; nothing was deleted.</span>' +
        '<a href="/admin/depot#trash" style="font-weight:800;color:#1f5f22">Open the trash bin to restore it</a>';
      el.parentNode.insertBefore(note, el.nextSibling);
    }
    // Put the drop-down beside the page title when the title sits right above the old tab spot.
    var h1 = el.previousElementSibling;
    if (h1 && h1.tagName === 'H1') {
      var row = document.createElement('div'); row.className = 'depot-head';
      h1.parentNode.insertBefore(row, h1); row.appendChild(h1); row.appendChild(go);
      el.remove();
    } else {
      el.className = 'depot-head'; el.setAttribute('role', 'navigation'); el.setAttribute('aria-label', 'The Depot'); el.appendChild(go);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();

  // Inside the dashboard (Sean, 2026-09-29: the Pulse page "gets cut off" at The piece): the
  // dashboard shows a Depot page in a fixed-height frame inside its own scrolling panel, two
  // scrolls stacked, so a tall page looked cut off at the frame's edge. The page now tells the
  // dashboard its height and the frame grows to fit, one scroll. The dashboard in turn says which
  // part of the frame is on screen, so a pop-up (dialog) opens where Sean is looking, and a
  // jump to the top (window.scrollTo) scrolls the dashboard instead of the frame.
  var embedded = false;
  try { embedded = window.self !== window.top && window.parent.location.origin === location.origin; } catch (e) {}
  if (embedded) {
    var root = document.documentElement, lastH = 0;
    root.classList.add('ve-autosize');
    var st2 = document.createElement('style');
    st2.textContent = '.ve-autosize dialog[open]{position:absolute;inset:auto 0 auto 0;margin:0 auto;top:calc(var(--ve-view-top,0px) + 24px);max-height:calc(var(--ve-view-h,100vh) - 48px) !important;overflow:auto;}';
    document.head.appendChild(st2);
    // The page's own content, not the frame it sits in: measuring the document would report the frame's
    // height back, so the frame could grow but never shrink (a short page after a tall one left a gap,
    // Sean 2026-10-04). Open dialogs and overlays sit outside the flow and are counted so none is cut off.
    function veContentHeight(){var b=document.body;if(!b)return 0;var h=b.scrollHeight;Array.prototype.forEach.call(document.querySelectorAll('dialog[open],.overlay,[role="dialog"]'),function(el){var cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||cs.position==='fixed')return;var r=el.getBoundingClientRect();if(r.height)h=Math.max(h,Math.ceil(r.bottom+window.scrollY));});return Math.ceil(h);}
    var send = function () {
      var h = veContentHeight();
      if (Math.abs(h - lastH) < 2) return;
      lastH = h; window.parent.postMessage({ type: 've-frame-height', h: h }, location.origin);
    };
    var watch = function () {
      send();
      if (window.ResizeObserver) new ResizeObserver(send).observe(document.body);
      window.addEventListener('load', send);
    };
    if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch);
    window.addEventListener('message', function (e) {
      if (e.origin !== location.origin || !e.data || e.data.type !== 've-frame-view') return;
      root.style.setProperty('--ve-view-top', Math.max(0, Math.round(e.data.top)) + 'px');
      root.style.setProperty('--ve-view-h', Math.max(200, Math.round(e.data.height)) + 'px');
    });
    var ownScroll = window.scrollTo.bind(window);
    window.scrollTo = function (a, b) {
      var top = a && typeof a === 'object' ? a.top : b;
      if (typeof top !== 'number') return ownScroll(a, b);
      window.parent.postMessage({ type: 've-frame-scroll', top: top, smooth: !!(a && a.behavior === 'smooth') }, location.origin);
    };
  }
})();

// Guided tour (public/ve-tour.js, Sean 2026-10-03): every Depot page gets the "Take the tour" button.
(function () {
  if (window.VE_DEPOT_LIST_ONLY || window.VETour || document.querySelector('script[src="/public/ve-tour.js"]')) return;
  function add() { var s = document.createElement('script'); s.src = '/public/ve-tour.js'; s.defer = true; document.body.appendChild(s); }
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
})();
