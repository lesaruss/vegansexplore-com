/* ve-ad-rail.js: the right-hand advertising rail (Sean, 2026-10-04: "three-fourths being the
   content, one-fourth being the advertisement to the right ... that's a revenue stream for us").
   Used on the Daily Pulse (/pulse, every tab and post, the dashboard's Daily Pulse tab), the
   dashboard's Events tab and the Directory (/directory and the dashboard's Directory tab).

   The Directory's rail is the chapter's (Sean, 2026-10-26: "those banners will appear throughout the
   entire chapter... South Florida... Central Florida will have its own"): two 300 x 250 banners, the
   same two landscape slots as that city hub's billboard (VE_HUBS[].page.adPrefix, page
   /communities/<slug>), so one buy shows on every page of the chapter. All cities uses the Directory's
   own pair (page /directory). <aside class="vear-rail" data-ad-page="chapter" data-ad-chapter="<hub slug>">,
   and VEAdRail.chapter(rail, slug) when the city changes.

   Same ad system as the old Pulse page and the Directory listing billboard: placements live in
   ad_placements (page_slug + slot_id), ad-resolve picks the active campaign per slot and logs the
   impression, ad-click logs the click.

   Usage:
     <div class="vear-layout"><div class="vear-main">...content...</div><aside class="vear-rail" data-ad-page="pulse"></aside></div>
     Rails fill themselves the first time they scroll into view; VEAdRail.mountAll() picks up rails added later.
*/
(function () {
  if (window.VEAdRail) return;
  var SUPABASE_URL = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  // The slots each page has, top to bottom (ad_placements.slot_id).
  var PAGES = {
    pulse: [{ id: 'skyscraper', shape: 'tower', size: '300 x 600' }, { id: 'landscape-1', shape: 'landscape', size: '300 x 250' }],
    '/events': [{ id: 've-events-skyscraper', shape: 'tower', size: '300 x 600' }, { id: 've-events-landscape-1', shape: 'landscape', size: '300 x 250' }]
  };

  // A chapter's rail: its hub's two landscape slots, or the Directory's pair for All cities.
  function chapterPage(slug) {
    var hub = (window.VE_HUBS || []).filter(function (h) { return h.slug === slug; })[0];
    var prefix = hub && hub.page && hub.page.adPrefix;
    if (!prefix) return { slug: '/directory', slots: [{ id: 've-directory-landscape-1', shape: 'landscape', size: '300 x 250' }, { id: 've-directory-landscape-2', shape: 'landscape', size: '300 x 250' }] };
    return { slug: '/communities/' + hub.slug, slots: [{ id: prefix + '-landscape-1', shape: 'landscape', size: '300 x 250' }, { id: prefix + '-landscape-2', shape: 'landscape', size: '300 x 250' }] };
  }

  var css = [
    '.vear-layout{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,1fr);gap:28px;align-items:start;}',
    '.vear-main{min-width:0;}',
    '.vear-rail{position:sticky;top:16px;display:flex;flex-direction:column;align-items:stretch;gap:14px;min-width:0;}',
    '.vear-label{font-size:9px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:rgba(26,26,26,0.45);text-align:center;}',
    '.vear-slot{position:relative;border-radius:10px;overflow:hidden;background:#fff;border:1px solid rgba(0,0,0,0.1);width:100%;max-width:300px;margin:0 auto;}',
    '.vear-slot.tower{aspect-ratio:1/2;}',
    '.vear-slot.landscape{aspect-ratio:6/5;}',
    '.vear-slot a.vear-ad{display:block;width:100%;height:100%;}',
    '.vear-slot img{width:100%;height:100%;object-fit:cover;display:block;}',
    '.vear-ph{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:12px;text-align:center;background:#f2f8f2;color:#1f5f22;text-decoration:none;}',
    '.vear-ph strong{font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;}',
    '.vear-ph span{font-size:11px;font-weight:600;color:rgba(26,26,26,0.55);}',
    '.vear-ph:hover strong{text-decoration:underline;}',
    '.vear-ph:focus-visible,.vear-slot a.vear-ad:focus-visible{outline:2px solid #1a1a1a;outline-offset:-2px;}',
    // Narrow screens: the rail drops under the content, slots side by side.
    '@media (max-width:900px){.vear-layout{grid-template-columns:minmax(0,1fr);}.vear-rail{position:static;flex-direction:row;flex-wrap:wrap;justify-content:center;border-top:1px solid rgba(0,0,0,0.1);padding-top:18px;}.vear-label{width:100%;}.vear-slot{flex:1 1 220px;max-width:300px;margin:0;}}'
  ].join('');
  var st = document.createElement('style'); st.id = 'vear-style'; st.textContent = css; document.head.appendChild(st);
  // HTML5 ad creatives render through the shared helper; load it if the page did not.
  if (!window.VEAdCreative && !document.querySelector('script[src="/public/ve-ad-creative.js"]')) {
    var hs = document.createElement('script'); hs.src = '/public/ve-ad-creative.js'; document.head.appendChild(hs);
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function click(placementId, campaignId) {
    try { navigator.sendBeacon(SUPABASE_URL + '/functions/v1/ad-click', new Blob([JSON.stringify({ placement_id: placementId, campaign_id: campaignId })], { type: 'text/plain' })); } catch (e) {}
  }
  function mount(rail) {
    if (!rail || rail.getAttribute('data-ad-ready')) return;
    var page = rail.getAttribute('data-ad-page');
    var slots = PAGES[page];
    if (page === 'chapter') { var ch = chapterPage(rail.getAttribute('data-ad-chapter') || ''); page = ch.slug; slots = ch.slots; }
    if (!slots) return;
    rail.setAttribute('data-ad-ready', '1');
    rail.setAttribute('aria-label', 'Advertisement');
    // An empty slot invites an advertiser instead of showing a blank box.
    rail.innerHTML = '<div class="vear-label">Advertisement</div>' + slots.map(function (s) {
      return '<div class="vear-slot ' + s.shape + '" data-slot="' + s.id + '"><a class="vear-ph" href="/dashboard/advertising"><strong>Your ad here</strong><span>' + s.size + ' &middot; Advertise with Vegans Explore</span></a></div>';
    }).join('');
    fetch(SUPABASE_URL + '/functions/v1/ad-resolve?brand_slug=vegans-explore&page_slug=' + encodeURIComponent(page), { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        (data && data.slots || []).forEach(function (ad) {
          if (!ad.image_url) return;
          var el = rail.querySelector('[data-slot="' + ad.slot_id + '"]'); if (!el) return;
          if (window.VEAdCreative) { el.innerHTML = VEAdCreative.markup(ad, { linkClass: 'vear-ad' }); return; }
          el.innerHTML = '<a class="vear-ad" href="' + esc(ad.link_url || '#') + '" target="_blank" rel="noopener noreferrer sponsored"><img src="' + esc(ad.image_url) + '" alt="Advertisement"></a>';
          el.querySelector('a').addEventListener('click', function () { click(ad.placement_id, ad.campaign_id); });
        });
      })
      .catch(function () { /* the "Your ad here" boxes stay */ });
  }
  // A rail fills (and its impression counts) only once it is on screen: a hidden dashboard tab
  // or an unopened post page never counts.
  var io = window.IntersectionObserver ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); mount(e.target); } });
  }) : null;
  function mountAll() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-ad-page]:not([data-ad-ready]):not([data-ad-watch])'), function (r) {
      if (io) { r.setAttribute('data-ad-watch', '1'); io.observe(r); } else mount(r);
    });
  }
  // A chapter rail follows the city picker: new slots, filled again (and counted) for the new chapter.
  function chapter(rail, slug) {
    if (!rail || (rail.getAttribute('data-ad-chapter') || '') === (slug || '')) return;
    rail.setAttribute('data-ad-chapter', slug || '');
    if (rail.getAttribute('data-ad-ready')) { rail.removeAttribute('data-ad-ready'); mount(rail); }
  }
  window.VEAdRail = { mount: mount, mountAll: mountAll, chapter: chapter };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll); else mountAll();
})();
