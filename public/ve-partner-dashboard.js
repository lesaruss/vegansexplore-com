/* The business dashboard (Sean, 2026-10-24, Love Life Cafe as the prototype): "basic information, like how many views in
 * the past 30 days... They should be able to sort through the analytics. If they have ads running, it should show the
 * ads... they should be able to find opportunities, they should be able to place ads, they should be able to do
 * everything from this section." And: "that one $11 investment opens them up... as we release new features, new tools,
 * we can have different wizards. It will automatically be shown to them in this one place."
 *
 * Only a listing's owner or a super admin gets here (ve-claims owner_dashboard checks again). The $11 Founding Membership,
 * or a live plan, opens it; an owner who is not a member yet still edits the page and the menu and is offered the membership.
 * One thing per view, the view in the address bar (?tab=brand&pd=<view>, a menu item as &item=<id|new>):
 *   home      the numbers at a glance, Get your page ready, What's new (ve_dashboard_cards, audience business)
 *   insights  7, 30, 90 days or a year: totals against the period before, a chart, what people did, where they came
 *             from, and every day in a table that sorts by any column
 *   checkins  how many members check in at the place, by week and home chapter, never who (Sean, 2026-10-28: "treat
 *             check-ins the same way" as saves; ve-claims owner_dashboard checkins, after the claim is approved). A place only.
 *   saves     everything but a place (Sean, 2026-10-27: "check-ins don't really apply to podcasts. We could put saves"): how
 *             many saved it and, for a podcast, its episodes, with plays (ve-podcast owner_saves). Counts, never names (2026-10-28).
 *   audience  Your audience (member profiles phase 3, Sean 2026-10-28; playbook ve-member-profiles-partner-windows): how many
 *             saved it and said yes to hearing from them, by chapter, never names; while a campaign the team set is running
 *             (ve_listing_campaigns), the shown profile parts of those who said yes and a message through us, 1 a week and 4 a
 *             campaign (ve-campaign-window audience / message_send)
 *   page      Edit your page (the four-step editor in directory/listing.html, opts.editPage)
 *   menu      the menu, by category; an item opens on its own (ve-claims menu_save / menu_delete)
 *   ads       their ads with impressions and clicks, and the spots they can ask about (ad_request)
 *   opps      our campaigns (I'm interested: partner_interest) and the open roles in their city
 *   audit     their audits and the $49 / $149 audit, through the Restaurant Guide (restaurants and other food places)
 *   guides    the Guides: theirs, free, or $11 or 1,100 points
 *   plan      Founding Member and the Partner plan
 *
 *   VEPartnerDash.mount(el, listing, { editPage: function (step) {}, call?: function (body) -> Promise, onJoin?: function () {} })
 *   call and onJoin stand in for ve-claims and the $11 checkout on the sample business (/business/sample, Sean 2026-10-27).
 */
(function () {
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var FRONT_ROW = Date.now() < Date.parse('2027-01-01T05:00:00Z');
  var VIEWS = [['home', 'Home'], ['insights', 'Insights'], ['audience', 'Your audience'], ['checkins', 'Check-ins'], ['saves', 'Saves'], ['page', 'Your page'], ['menu', 'Menu'], ['ads', 'Ads'], ['opps', 'Opportunities'], ['audit', 'Audit'], ['guides', 'Guides'], ['plan', 'Your plan']];
  // Views a member needs (Home, Your page, Menu and Your plan work without).
  var MEMBERS = ['insights', 'audience', 'checkins', 'saves', 'ads', 'opps', 'audit', 'guides'];
  // The dashboard speaks to what the listing is (Sean, 2026-10-27). Keep in step with listingKind in directory/listing.html.
  function kindOf(c) {
    if (['Podcasts', 'YouTube', 'News Outlets', 'Media'].indexOf(c) >= 0) return 'show';
    if (['Documentaries & Films', 'Books'].indexOf(c) >= 0) return 'work';
    if (['Food Brands', 'Nutrition & Supplements', 'Fitness and Athletics', 'Clothing and Fashion', 'Beauty and Personal Care', 'E-Commerce & Marketplaces'].indexOf(c) >= 0) return 'brand';
    // Groups and organizations (Sean, 2026-10-29): no hours or menu, their own opportunities.
    if (['Groups', 'Nonprofits', 'Rescues', 'Sanctuaries', 'Events'].indexOf(c) >= 0) return 'org';
    return 'place';
  }
  // What people can do on the page, by kind: a podcast's visitors play episodes and open Listen on; a place's call and come in.
  var ACTS_BY = {
    show: [['play', 'Episodes played'], ['listen', 'Listen on clicks'], ['website', 'Website visits'], ['social', 'Social links']],
    work: [['website', 'Website visits'], ['social', 'Social links'], ['order', 'Where to buy'], ['photos', 'Photos opened']],
    brand: [['website', 'Website visits'], ['social', 'Social links'], ['order', 'Orders'], ['photos', 'Photos opened']],
    org: [['website', 'Website visits'], ['social', 'Social links'], ['photos', 'Photos opened']]
  };
  var ACTS_WORDS = { show: 'Plays and clicks', work: 'Clicks', brand: 'Clicks and orders', org: 'Clicks', place: 'Calls, directions, orders and clicks' };
  // What a group or an organization can take part in, all Coming. community-groups is the group program Sean described on
  // 2026-10-29 (a group's home on Vegans Explore); its terms are not set, so the card says what it is, never a rate.
  var ORG_OPPS = [
    ['community-groups', 'Groups', 'Host your group on Vegans Explore', 'Your group\'s home here: your events on your page and the calendar, members finding you in every city, and a share of what your members bring in. We are building it with the first groups now.'],
    ['nonprofit-partners', 'Nonprofits', 'Nonprofit Partners', 'For Vegan nonprofits, rescues and sanctuaries: your own link, a share of every Passport bought through it, points for our services and a badge.'],
    ['community-nights', 'Community', 'Community nights', 'In each city, starting in South Florida in November 2026.']
  ];
  // What a podcast can take part in (Sean, 2026-10-27), all Coming. directory/listing.html shows the first three on the locked tour.
  var PODCAST_OPPS = [
    ['podcast-network', 'Network', 'Join the Vegans Explore Podcast Network', 'Play the network tag, take part in our challenges, and be part of the sponsorships we bring in for the network.'],
    ['podcast-promos', 'Promos', 'Your promo on our shows', 'Your trailer or promo played on our own shows.'],
    ['podcast-production', 'Production', 'We produce your show', 'Editing, show notes, publishing and your release schedule, managed for you.'],
    ['podcast-network-sponsors', 'Sponsors', 'Sponsorships through the network', 'When a brand sponsors the network, member shows can carry the read.'],
    ['podcast-ads', 'Ads', 'Your show in our ad spots', 'Your artwork in ad spots across Vegans Explore: the Directory, the Daily Pulse and Media.'],
    ['podcast-marketing', 'Marketing', 'Clips and social promotion', 'Short clips from your episodes on our Instagram and TikTok, and in the Daily Pulse.']
  ];
  var ACTS = [['call', 'Calls'], ['directions', 'Directions'], ['website', 'Website visits'], ['order', 'Orders'], ['menu', 'Menu opened'], ['photos', 'Photos opened'], ['social', 'Social links']];
  var VIA = { page: 'The Directory and search', guide: 'Inside a Guide', link: 'A tracked link' };
  var CHECK = { logo: ['Your logo', 'A clear, official logo instead of your first letter.', 'photos'], description: ['Your story', 'A few lines on what you serve and what to try first.', 'about'],
    photos: ['Photos', 'Photos you own, so visitors can see the place and the food.', 'photos'], hours: ['Your hours', 'Each day the way you want it shown.', 'hours'],
    menu: ['Your menu', 'Menus are one of the first things people open.', 'menu'], audit: ['The free check', 'Ten things Google, your website and Instagram tell a visitor.', 'audit'] };
  // Our campaigns. The same slugs as the brand dashboard (OPPS in directory/listing.html), so interest adds up in one place.
  var CAMPAIGNS = [
    ['plant-based-showcase-2026-11-29', 'Game day', 'The Plant-Based Showcase', 'Miami Dolphins game day, Hard Rock Stadium. Sunday, November 29, 2026.', Date.parse('2026-11-30T05:00:00Z')],
    ['community-nights', 'Community', 'Community nights', 'In each city, starting in South Florida in November 2026.'],
    ['showcase-events', 'Showcase', 'The Showcase at college games and festivals', 'Events that are not Vegan events. Dates to be set.'],
    ['guide-feature', 'Guides', 'A featured spot in a Guide', 'Where people are choosing where to eat and what to buy.'],
    ['q1-2027-campaigns', 'Q1 2027', 'Our Q1 2027 campaigns', 'January to March 2027. Details to be set.']
  ];
  var CSS = '.vpd{font-family:Montserrat,sans-serif;color:#1a1a1a}' +
    '.vpd-nav{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 18px}.vpd-nav a{font-size:12px;font-weight:800;letter-spacing:.04em;padding:8px 12px;border-radius:6px;background:#f1f3f1;color:#333;text-decoration:none}' +
    '.vpd-nav a.on{background:#1f5f22;color:#fff}.vpd-nav a .lk{opacity:.55;margin-left:4px}' +
    '.vpd-head{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:baseline;justify-content:space-between;margin:0 0 16px}.vpd-head h3{font-size:20px;font-weight:900;margin:0}.vpd-head span{font-size:13px;color:rgba(26,26,26,.7)}' +
    '.vpd-crumb{font-size:12px;font-weight:700;color:rgba(26,26,26,.6);margin:0 0 6px}.vpd-crumb a{color:#1f5f22}' +
    '.vpd-tag{display:inline-block;font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:3px 8px;border-radius:6px;background:#eef4ee;color:#1f5f22}' +
    '.vpd-tag.warn{background:#fff4e0;color:#8a5200}.vpd-tag.off{background:#f1f1f1;color:#666}.vpd-tag.admin{background:#fffaf0;color:#7a4b00;border:1px dashed #b7791f}' +
    '.vpd-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(200px,100%),1fr));gap:12px;margin:0 0 18px}' +
    '.vpd-tiles>div{border:1px solid rgba(0,0,0,.1);border-radius:10px;padding:14px 16px;background:#fff}.vpd-tiles b{display:block;font-size:28px;font-weight:900;line-height:1.1}' +
    '.vpd-tiles span{display:block;font-size:12px;font-weight:700;color:rgba(26,26,26,.7);margin-top:4px}.vpd-tiles em{display:block;font-style:normal;font-size:12px;font-weight:700;margin-top:6px;color:rgba(26,26,26,.55)}' +
    '.vpd-tiles em.up{color:#1f7a2a}.vpd-tiles em.down{color:#a61b1b}' +
    '.vpd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr));gap:12px;margin:0 0 20px}' +
    '.vpd-card{border:1px solid rgba(0,0,0,.1);border-radius:10px;padding:14px 16px;background:#fff;display:flex;flex-direction:column;gap:6px}.vpd-card b{font-size:15px}' +
    '.vpd-card p{margin:0;font-size:13px;line-height:1.5;color:rgba(26,26,26,.78);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
    '.vpd-card .vpd-btn{align-self:flex-start;margin-top:auto}.vpd-card.done{background:#f6faf6}.vpd-card.done b::before{content:"\\2713  ";color:#1f7a2a}' +
    '.vpd h4{font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#1f5f22;margin:22px 0 10px}' +
    '.vpd-btn{display:inline-flex;align-items:center;justify-content:center;font:inherit;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:10px 16px;min-height:40px;border-radius:6px;border:0;background:#1f5f22;color:#fff;cursor:pointer;text-decoration:none}' +
    '.vpd-btn.o{background:#fff;color:#1f5f22;border:1px solid rgba(0,0,0,.25)}.vpd-btn:disabled{opacity:.5;cursor:default}.vpd-btn.sm{padding:6px 12px;min-height:32px;font-size:11px}' +
    '.vpd-range{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 14px}.vpd-range button{font:inherit;font-size:12px;font-weight:800;padding:7px 12px;border-radius:6px;border:1px solid rgba(0,0,0,.2);background:#fff;cursor:pointer}.vpd-range button.on{background:#1f5f22;color:#fff;border-color:#1f5f22}' +
    '.vpd-chart{display:flex;align-items:flex-end;gap:2px;height:140px;padding:10px 0 0;border-bottom:1px solid rgba(0,0,0,.15);margin:0 0 6px}.vpd-chart i{flex:1;background:#3a9b3e;border-radius:3px 3px 0 0;min-height:2px}' +
    '.vpd-chart-x{display:flex;justify-content:space-between;font-size:11px;color:rgba(26,26,26,.6);margin:0 0 18px}' +
    '.vpd-rows{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr));gap:4px 24px;margin:0 0 18px}.vpd-rows div{display:flex;justify-content:space-between;gap:12px;font-size:14px;padding:8px 0;border-bottom:1px solid rgba(0,0,0,.07)}.vpd-rows b{font-weight:900}' +
    '.vpd-table-wrap{max-height:420px;overflow:auto;border:1px solid rgba(0,0,0,.1);border-radius:10px}' +
    '.vpd-table{width:100%;border-collapse:collapse;font-size:14px}.vpd-table th{position:sticky;top:0;background:#f6f8f6;text-align:left;font-size:12px;font-weight:800;padding:10px 12px;cursor:pointer;user-select:none;white-space:nowrap}' +
    '.vpd-table td{padding:9px 12px;border-top:1px solid rgba(0,0,0,.06)}.vpd-table td.n,.vpd-table th.n{text-align:right}' +
    '.vpd-list{display:flex;flex-direction:column;border:1px solid rgba(0,0,0,.1);border-radius:10px;overflow:hidden;margin:0 0 18px}' +
    '.vpd-row{display:grid;grid-template-columns:1fr auto auto;gap:12px;align-items:center;padding:12px 14px;border-top:1px solid rgba(0,0,0,.07);background:#fff}.vpd-row:first-child{border-top:0}' +
    '.vpd-row b{display:block;font-size:14px}.vpd-row small{display:block;font-size:12.5px;color:rgba(26,26,26,.65);margin-top:2px}' +
    '.vpd-cat{background:#f6f8f6;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#1f5f22;padding:9px 14px;border-top:1px solid rgba(0,0,0,.07)}.vpd-cat:first-child{border-top:0}' +
    '.vpd-f{display:flex;flex-direction:column;gap:5px;margin:0 0 14px;font-size:13px;font-weight:800}.vpd-f small{font-weight:500;color:rgba(26,26,26,.7)}' +
    '.vpd-f input,.vpd-f textarea{font:inherit;font-size:15px;font-weight:400;padding:10px 12px;min-height:44px;border:1px solid rgba(0,0,0,.25);border-radius:6px;width:100%;box-sizing:border-box}.vpd-f textarea{min-height:90px;resize:vertical}' +
    '.vpd-checks{display:flex;flex-wrap:wrap;gap:8px 18px;margin:0 0 16px}.vpd-checks label{display:flex;gap:8px;align-items:center;font-size:14px;font-weight:700;cursor:pointer}.vpd-checks input{width:18px;height:18px;accent-color:#1f5f22}' +
    '.vpd-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:0 14px}' +
    '.vpd-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;border-top:1px solid rgba(0,0,0,.09);padding-top:14px;margin-top:6px}' +
    '.vpd-msg{font-size:13px;font-weight:700;color:#1f5f22;min-height:18px;margin:0 0 10px}.vpd-msg.bad{color:#a61b1b}' +
    '.vpd-join{background:#0f1f10;color:#fff;border-radius:12px;padding:22px 22px;margin:0 0 20px}.vpd-join b{display:block;font-size:19px;font-weight:900;margin:0 0 6px}.vpd-join p{margin:0 0 14px;font-size:14px;line-height:1.55;color:rgba(255,255,255,.85)}' +
    '.vpd-join .vpd-btn{background:#5ec47a;color:#0f1f10}' +
    '.vpd-empty{font-size:14px;color:rgba(26,26,26,.7);padding:6px 0 18px;margin:0}' +
    '.vpd-scroll{max-height:70vh;overflow:auto}.vpd-done{font-size:13px;font-weight:700;color:#1f7a2a;margin:0 0 20px}' +
    '@media(max-width:600px){.vpd-row{grid-template-columns:1fr auto}.vpd-row .vpd-tag{display:none}.vpd-tiles{grid-template-columns:1fr 1fr;gap:8px}.vpd-tiles b{font-size:22px}.vpd-tiles>div{padding:12px}}';

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function n(x) { return Number(x || 0).toLocaleString(); }
  function css() { if (!document.getElementById('vpd-css')) { var st = document.createElement('style'); st.id = 'vpd-css'; st.textContent = CSS; document.head.appendChild(st); } }
  function token() { return window.VEAuth && VEAuth.getToken ? VEAuth.getToken() : null; }
  function call(body) {
    return fetch(SB + '/functions/v1/ve-claims', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); }).catch(function () { return { error: 'network' }; });
  }
  function q(k) { return new URLSearchParams(location.search).get(k); }
  function day(d) { return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  function change(now, before) {
    if (!before) return now ? '<em>New this period</em>' : '<em>&nbsp;</em>';
    var p = Math.round((now - before) / before * 100);
    return '<em class="' + (p > 0 ? 'up' : p < 0 ? 'down' : '') + '">' + (p > 0 ? '+' : '') + p + '% on the period before</em>';
  }

  function mount(el, l, opts) {
    opts = opts || {};
    css();
    var api = opts.call || call;
    var D = null, days = 30, sortBy = ['day', -1], menu = null, SV = null, AU = null, AUnote = '';
    var KIND = kindOf(l.category), ACTS_K = ACTS_BY[KIND] || ACTS, ACT_WORDS = ACTS_WORDS[KIND];
    // Get your page ready, in a group's or an organization's words.
    var CK = KIND === 'org' ? Object.assign({}, CHECK, { description: ['Your story', 'A few lines on who you are, who it is for and what your events are like.', 'about'],
      photos: ['Photos', 'Photos from your events, so people can picture showing up.', 'photos'] }) : CHECK;
    function go(view, extra) {
      var u = new URL(location.href);
      u.searchParams.set('tab', 'brand'); u.searchParams.delete('edit'); u.searchParams.delete('item');
      if (view && view !== 'home') u.searchParams.set('pd', view); else u.searchParams.delete('pd');
      if (extra) Object.keys(extra).forEach(function (k) { u.searchParams.set(k, extra[k]); });
      history.pushState(null, '', u.pathname + u.search + u.hash);
      draw();
      var top = el.getBoundingClientRect().top + window.scrollY - 120; if (window.scrollY > top) window.scrollTo(0, Math.max(0, top));
    }
    function load(cb) {
      el.innerHTML = '<div class="vpd"><p class="vpd-empty">Loading your dashboard...</p></div>';
      api({ action: 'owner_dashboard', listing_id: l.id, days: days }).then(function (d) {
        if (!d || !d.ok) { el.innerHTML = '<div class="vpd"><p class="vpd-empty">We could not open your dashboard just now. Try again in a moment.</p></div>'; return; }
        D = d; cb();
      });
    }
    function views() {
      return VIEWS.filter(function (v) {
        if (v[0] === 'menu') return D.listing.food || D.menu_count > 0;
        if (v[0] === 'audit') return D.listing.food;
        if (v[0] === 'checkins') return KIND === 'place';
        if (v[0] === 'saves') return KIND !== 'place';
        return true;
      });
    }
    function draw() {
      if (!D) return load(draw);
      var view = q('pd') || 'home';
      if (!views().some(function (v) { return v[0] === view; })) view = 'home';
      if (view === 'page') { if (opts.editPage) opts.editPage(q('edit') || 'about'); return; }
      var nav = '<nav class="vpd-nav" aria-label="Your dashboard">' + views().map(function (v) {
        return '<a href="?tab=brand' + (v[0] === 'home' ? '' : '&pd=' + v[0]) + '" data-vpd="' + v[0] + '" class="' + (v[0] === view ? 'on' : '') + '">' + esc(v[1]) +
          (!D.open && MEMBERS.indexOf(v[0]) >= 0 ? '<span class="lk" aria-label="for members">&#128274;</span>' : '') + '</a>';
      }).join('') + '</nav>';
      var admin = D.admin ? ' <span class="vpd-tag admin">Viewing as admin</span>' : '';
      var body = !D.open && MEMBERS.indexOf(view) >= 0 ? joinBox() : (VIEW_FN[view] || drawHome)();
      el.innerHTML = '<div class="vpd">' + nav + '<div class="vpd-head"><h3>' + esc((VIEWS.filter(function (v) { return v[0] === view; })[0] || [])[1] || 'Home') + admin + '</h3>' +
        '<span>' + esc(l.name) + (D.listing.claim_status === 'verified' ? '' : ' &middot; waiting for our approval') + '</span></div>' + body + '</div>';
      wire(view);
    }
    function joinBox() {
      return '<div class="vpd-join"><b>Open your whole dashboard for $11</b>' +
        '<p>Become a Founding Member, one time, and this dashboard opens: your numbers and what people do on your page, ' + (KIND === 'show' ? 'who plays and saves your episodes, our podcast opportunities and ads, ' : 'our campaigns and ads, ') +
        (KIND === 'place' ? 'the audit, the Guides, and every new tool we add, as soon as it is ready. Editing your page and your menu stays free.' : 'the Guides, and every new tool we add, as soon as it is ready. Editing your page stays free.') + '</p>' +
        '<button type="button" class="vpd-btn" data-vpd-join>Become a Founding Member, $11</button></div>';
    }

    // ---- Home
    function drawHome() {
      var out = !D.open ? joinBox() : '';
      if (D.open && D.stats) {
        var s = D.stats, T = s.totals || {}, P = s.previous || {}, acts = ACTS_K.reduce(function (a, k) { return a + (T[k[0]] || 0); }, 0);
        out += '<div class="vpd-tiles"><div><b>' + n(T.view) + '</b><span>Page views, last ' + D.days + ' days</span>' + change(T.view || 0, P.views) + '</div>' +
          '<div><b>' + n(s.visitors) + '</b><span>Visitors</span>' + change(s.visitors || 0, P.visitors) + '</div>' +
          '<div><b>' + n(acts) + '</b><span>' + ACT_WORDS + '</span>' + change(acts, P.actions) + '</div>' +
          '<div><b>' + n(D.ads.reduce(function (a, x) { return a + x.impressions; }, 0)) + '</b><span>Ad impressions</span><em>' + (D.ads.length ? D.ads.length + ' campaign' + (D.ads.length > 1 ? 's' : '') : 'No ads yet') + '</em></div></div>' +
          '<a href="?tab=brand&pd=insights" data-vpd="insights" class="vpd-btn o sm">See every number</a>';
      }
      // What is left, as cards; what is done, on one line.
      // A podcast, a book or a brand has no hours or menu to fill in.
      var fits = function (c) { return CK[c.k] && (KIND === 'place' || ['logo', 'description'].indexOf(c.k) >= 0 || (KIND === 'org' && c.k === 'photos')); };
      var todo = D.checklist.filter(function (c) { return !c.done && fits(c); }), done = D.checklist.filter(function (c) { return c.done && fits(c); });
      out += '<h4>Get your page ready</h4>' + (todo.length ? '' : '<p class="vpd-empty">Everything is in. Your page is ready for visitors.</p>') +
        (todo.length ? '<div class="vpd-grid">' + todo.map(function (c) {
          var m = CK[c.k];
          var act = c.k === 'menu' ? '<a class="vpd-btn sm" href="?tab=brand&pd=menu" data-vpd="menu">Add it</a>'
            : c.k === 'audit' ? '<a class="vpd-btn sm" href="/guides/vegan-restaurant-survival-guide#/audit">Run it</a>'
            : '<button type="button" class="vpd-btn sm" data-vpd-edit="' + m[2] + '">Add it</button>';
          return '<div class="vpd-card"><b>' + esc(m[0]) + '</b><p>' + esc(m[1]) + '</p>' + act + '</div>';
        }).join('') + '</div>' : '') +
        (done.length && todo.length ? '<p class="vpd-done">&#10003; Done: ' + done.map(function (c) { return esc(CK[c.k][0].replace(/^Your /, '').replace(/^The /, '')); }).join(', ') + '</p>' : '');
      if (D.cards.length) out += '<h4>What\'s new</h4><div class="vpd-grid">' + D.cards.map(function (c) {
        return '<div class="vpd-card"><span class="vpd-tag' + (c.kind === 'offer' ? ' warn' : '') + '">' + esc({ new: 'New', wizard: 'Try it', offer: 'Offer', tip: 'Tip' }[c.kind] || 'New') + '</span>' +
          '<b>' + esc(c.title) + '</b><p>' + esc(c.body) + '</p>' +
          (c.cta_url ? '<a class="vpd-btn sm o" href="' + esc(c.cta_url.charAt(0) === '?' ? '?tab=brand&' + c.cta_url.slice(1) : c.cta_url) + '"' + (/^\?pd=/.test(c.cta_url) ? ' data-vpd="' + esc(c.cta_url.slice(4)) + '"' : '') + '>' + esc(c.cta_label || 'Open') + '</a>' : '') + '</div>';
      }).join('') + '</div>';
      return out;
    }

    // ---- Insights
    function drawInsights() {
      var s = D.stats || {}, T = s.totals || {}, P = s.previous || {}, daily = s.daily || [];
      var acts = ACTS_K.reduce(function (a, k) { return a + (T[k[0]] || 0); }, 0);
      // Every day in the range, zeros included, so the chart and the table show quiet days too.
      var map = {}; daily.forEach(function (d) { map[d.day] = d; });
      var all = []; for (var i = D.days - 1; i >= 0; i--) { var dt = new Date(Date.now() - i * 864e5); var k = dt.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); all.push(map[k] || { day: k, views: 0, visitors: 0, actions: 0 }); }
      var max = Math.max.apply(null, all.map(function (d) { return d.views; }).concat([1]));
      var rows = all.slice().sort(function (a, b) { var x = a[sortBy[0]], y = b[sortBy[0]]; return (x < y ? -1 : x > y ? 1 : 0) * sortBy[1]; });
      var th = function (k, label, num) { return '<th data-vpd-sort="' + k + '" class="' + (num ? 'n' : '') + '" aria-sort="' + (sortBy[0] === k ? (sortBy[1] > 0 ? 'ascending' : 'descending') : 'none') + '">' + label + (sortBy[0] === k ? (sortBy[1] > 0 ? ' &#9650;' : ' &#9660;') : '') + '</th>'; };
      var via = s.via || {};
      return '<div class="vpd-range" role="group" aria-label="Range">' + [[7, '7 days'], [30, '30 days'], [90, '90 days'], [365, 'A year']].map(function (r) { return '<button type="button" data-vpd-days="' + r[0] + '" class="' + (r[0] === D.days ? 'on' : '') + '">' + r[1] + '</button>'; }).join('') + '</div>' +
        '<div class="vpd-tiles"><div><b>' + n(T.view) + '</b><span>Page views</span>' + change(T.view || 0, P.views) + '</div><div><b>' + n(s.visitors) + '</b><span>Visitors</span>' + change(s.visitors || 0, P.visitors) + '</div>' +
        '<div><b>' + n(acts) + '</b><span>' + ACT_WORDS + '</span>' + change(acts, P.actions) + '</div></div>' +
        '<div class="vpd-chart" role="img" aria-label="Page views by day">' + all.map(function (d) { return '<i style="height:' + Math.round(d.views / max * 100) + '%" title="' + esc(day(d.day)) + ': ' + d.views + ' views"></i>'; }).join('') + '</div>' +
        '<div class="vpd-chart-x"><span>' + esc(day(all[0].day)) + '</span><span>' + esc(day(all[all.length - 1].day)) + '</span></div>' +
        '<h4>What people did</h4><div class="vpd-rows">' + ACTS_K.map(function (a) { return '<div><span>' + a[1] + '</span><b>' + n(T[a[0]]) + '</b></div>'; }).join('') + '</div>' +
        '<h4>Where they came from</h4><div class="vpd-rows">' + Object.keys(VIA).map(function (k) { return '<div><span>' + VIA[k] + '</span><b>' + n(via[k]) + '</b></div>'; }).join('') + '</div>' +
        '<h4>Day by day</h4><div class="vpd-table-wrap"><table class="vpd-table"><thead><tr>' + th('day', 'Day') + th('views', 'Views', 1) + th('visitors', 'Visitors', 1) + th('actions', KIND === 'place' ? 'Calls and clicks' : ACT_WORDS, 1) + '</tr></thead><tbody>' +
        rows.map(function (d) { return '<tr><td>' + esc(new Date(d.day + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })) + '</td><td class="n">' + n(d.views) + '</td><td class="n">' + n(d.visitors) + '</td><td class="n">' + n(d.actions) + '</td></tr>'; }).join('') +
        '</tbody></table></div><p class="vpd-empty" style="padding-top:10px">' + (s.since ? 'Counting since ' + esc(new Date(s.since).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })) + '. ' : '') +
        'Each visitor counts once every 30 minutes; automated browsers are not counted.</p>';
    }

    // ---- Menu: the list, then one item on its own.
    function drawMenu() {
      if (!menu) {
        api({ action: 'menu_list', listing_id: l.id }).then(function (d) { menu = (d && d.items) || []; draw(); });
        return '<p class="vpd-empty">Loading your menu...</p>';
      }
      var item = q('item');
      if (item) return drawItem(item);
      var cats = []; menu.forEach(function (m) { if (cats.indexOf(m.category) < 0) cats.push(m.category); });
      return '<div class="vpd-bar" style="border:0;padding:0;margin:0 0 14px"><span class="vpd-empty" style="padding:0">' + (menu.length ? 'Shows on your page under Menu. Changes are live right away.' : 'No menu yet. Add your first item and the Menu tab appears on your page.') + '</span>' +
        '<a class="vpd-btn" href="?tab=brand&pd=menu&item=new" data-vpd="menu" data-vpd-item="new">New item</a></div>' +
        (menu.length ? '<div class="vpd-list vpd-scroll">' + cats.map(function (c) {
          return '<div class="vpd-cat">' + esc(c) + '</div>' + menu.filter(function (m) { return m.category === c; }).map(function (m) {
            return '<div class="vpd-row"><div><b>' + esc(m.name) + (m.price_display ? ' &middot; ' + esc(m.price_display) : '') + '</b><small>' + esc(m.description || '') + '</small></div>' +
              '<span class="vpd-tag' + (m.is_available ? '' : ' off') + '">' + (m.is_available ? (m.is_featured ? 'Featured' : 'On the menu') : 'Hidden') + '</span>' +
              '<a class="vpd-btn sm o" href="?tab=brand&pd=menu&item=' + esc(m.id) + '" data-vpd="menu" data-vpd-item="' + esc(m.id) + '">Edit</a></div>';
          }).join('');
        }).join('') + '</div>' : '');
    }
    function drawItem(id) {
      var m = id === 'new' ? { category: (menu[menu.length - 1] || {}).category || '', is_vegan: true, is_available: true, sort_order: menu.length } : menu.filter(function (x) { return x.id === id; })[0];
      if (!m) return '<p class="vpd-empty">That item is not on your menu anymore. <a href="?tab=brand&pd=menu" data-vpd="menu">Back to your menu</a></p>';
      var cats = []; menu.forEach(function (x) { if (cats.indexOf(x.category) < 0) cats.push(x.category); });
      var chk = function (k, label) { return '<label><input type="checkbox" id="vpd-' + k + '"' + (m[k] ? ' checked' : '') + '> ' + label + '</label>'; };
      return '<p class="vpd-crumb"><a href="?tab=brand&pd=menu" data-vpd="menu">Menu</a> &rsaquo; ' + esc(id === 'new' ? 'New item' : m.name) + '</p>' +
        '<div class="vpd-form"><label class="vpd-f">Name<input id="vpd-name" maxlength="120" value="' + esc(m.name) + '"></label>' +
        '<label class="vpd-f">Section<small>For example Bowls, Smoothies, Desserts</small><input id="vpd-category" maxlength="60" list="vpd-cats" value="' + esc(m.category) + '"><datalist id="vpd-cats">' + cats.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist></label>' +
        '<label class="vpd-f">Price<small>As you want it shown, for example $14 or $12 to $16</small><input id="vpd-price_display" maxlength="30" value="' + esc(m.price_display) + '"></label>' +
        '<label class="vpd-f">Order<small>Lower numbers show first in their section</small><input id="vpd-sort_order" type="number" min="0" max="9999" value="' + esc(m.sort_order || 0) + '"></label></div>' +
        '<label class="vpd-f">Description<textarea id="vpd-description" maxlength="400">' + esc(m.description) + '</textarea></label>' +
        '<div class="vpd-checks">' + chk('is_vegan', 'Vegan') + chk('is_gluten_free', 'Gluten-free') + chk('is_featured', 'Featured') + chk('is_available', 'On the menu (untick to hide it)') + '</div>' +
        '<p class="vpd-msg" id="vpd-msg" role="status"></p><div class="vpd-bar"><a class="vpd-btn o" href="?tab=brand&pd=menu" data-vpd="menu">Back to your menu</a>' +
        (id === 'new' ? '' : '<button type="button" class="vpd-btn o" data-vpd-del style="color:#a61b1b">Remove it</button>') +
        '<button type="button" class="vpd-btn" data-vpd-save="' + esc(id) + '">Save</button></div>';
    }

    // ---- Ads
    // ---- Check-ins: the members who came in, newest first, with who comes back most.
    function drawCheckins() {
      // Counts only (Sean, 2026-10-28: "treat check-ins the same way" as saves): never who checked in.
      var c = D.checkins || {};
      if (!c.verified) return '<p class="vpd-empty">Once we approve your claim on this page, you will see how many members check in here, and when.</p>';
      var chap = function (s) { if (s === 'none') return 'No home chapter yet'; var h = (window.VE_HUBS || []).filter(function (x) { return x.slug === s; })[0]; return h ? h.name : String(s || '').replace(/-/g, ' '); };
      var out = '<div class="vpd-tiles"><div><b>' + n(c.last_30_days) + '</b><span>Check-ins, last 30 days</span></div><div><b>' + n(c.people) + '</b><span>Members who have checked in</span></div>' +
        '<div><b>' + n(c.returning) + '</b><span>Members who came back</span></div><div><b>' + n(c.total) + '</b><span>Check-ins, last 12 months</span></div></div>' +
        '<p class="vpd-empty" style="margin:0 0 12px">Members check in from your page when they are here, and earn points for it. We never show who checked in. The members who said you can message them are on <a href="?tab=brand&pd=audience" data-vpd="audience">Your audience</a>, and you can reach them while a campaign with us is running.</p>';
      if (!c.total) return out + '<p class="vpd-empty">No check-ins yet.</p>';
      var wk = function (d) { return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
      return out + '<h4>By week</h4><div class="vpd-table-wrap"><table class="vpd-table"><thead><tr><th>Week of</th><th>Check-ins</th></tr></thead><tbody>' +
        (c.by_week || []).slice().reverse().map(function (r) { return '<tr><td>' + esc(wk(r.week)) + '</td><td>' + n(r.n) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<h4>Where they are from</h4><div class="vpd-table-wrap"><table class="vpd-table"><thead><tr><th>Home chapter</th><th>Members</th></tr></thead><tbody>' +
        (c.by_chapter || []).map(function (r) { return '<tr><td>' + esc(chap(r.chapter)) + '</td><td>' + n(r.people) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }
    // ---- Saves (and plays, for a podcast): who keeps it, in place of check-ins.
    function drawSaves() {
      if (!SV) {
        fetch(SB + '/functions/v1/ve-podcast', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() }, body: JSON.stringify({ action: 'owner_saves', listing_id: l.id }) })
          .then(function (r) { return r.json(); }).then(function (d) { SV = d && d.ok ? d : { ok: false }; draw(); }).catch(function () { SV = { ok: false }; draw(); });
        return '<p class="vpd-empty">Loading your saves...</p>';
      }
      if (!SV.ok) return '<p class="vpd-empty">Your saves did not load. Try again in a moment.</p>';
      if (!SV.verified) return '<p class="vpd-empty">Once we approve your claim on this page, you will see every member who saves it.</p>';
      var T = (D.stats && D.stats.totals) || {}, pod = KIND === 'show', noun = l.category === 'Podcasts' ? 'podcast' : ({ show: 'show', work: 'page', brand: 'brand' }[KIND] || 'page');
      var when = function (x) { return esc(new Date(x).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })); };
      var out = '<div class="vpd-tiles"><div><b>' + n(SV.listing_saves) + '</b><span>Members who saved your ' + noun + '</span></div>' +
        (pod ? '<div><b>' + n(SV.episode_saves) + '</b><span>Episodes saved</span><em>by ' + n(SV.episode_savers) + ' member' + (SV.episode_savers === 1 ? '' : 's') + '</em></div>' +
          '<div><b>' + n(T.play) + '</b><span>Episodes played here, last ' + D.days + ' days</span></div><div><b>' + n(T.listen) + '</b><span>Listen on clicks, last ' + D.days + ' days</span></div>' : '') + '</div>' +
        '<p class="vpd-empty" style="margin:0 0 12px">Members save what they want to come back to; it sits in their My Saves.</p>';
      if (pod && SV.episodes.length) out += '<h4>Most saved episodes</h4><div class="vpd-list">' + SV.episodes.map(function (e) {
        return '<div class="vpd-row"><div><b>' + esc(e.title) + '</b></div><span class="vpd-tag">' + n(e.n) + ' save' + (e.n === 1 ? '' : 's') + '</span><span></span></div>'; }).join('') + '</div>';
      if (pod && SV.recent.length) out += '<h4>Episode saves</h4><div class="vpd-table-wrap"><table class="vpd-table"><thead><tr><th>When</th><th>Episode</th></tr></thead><tbody>' +
        SV.recent.map(function (r) { return '<tr><td>' + when(r.at) + '</td><td>' + esc(r.title) + '</td></tr>'; }).join('') + '</tbody></table></div>';
      // A save is a bookmark, never consent (Sean locked 2026-10-28): counts here; names only on Your audience, of the members who
      // said yes, while a campaign runs.
      return out + '<p class="vpd-empty">We never show who saved you. The members who said you can message them are on <a href="?tab=brand&pd=audience" data-vpd="audience">Your audience</a>, and you can reach them while a campaign with us is running.</p>';
    }

    // ---- Your audience (member profiles phase 3, Sean 2026-10-28): counts by chapter for everyone; names only of the members
    // who said yes, and only while a campaign with us is running, with a message through us.
    var SAID = { p_meal: 'Go-to Vegan meal', p_why: 'Why they went Vegan', p_day: 'A perfect day in their city', p_meet: 'Would love to meet people who', p_fact: 'Something surprising', q3_roles: 'What they do', q8_drivers: 'What drew them', q23_matters: 'What matters to them', q24_diet: 'How they eat' };
    function hubName(slug) { if (slug === 'none') return 'No home chapter yet'; var h = (window.VE_HUBS || []).filter(function (x) { return x.slug === slug; })[0]; return h ? h.name : String(slug || '').replace(/-/g, ' '); }
    function longDay(d) { return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }
    function drawAudience() {
      if (!AU) {
        if (opts.call) { AU = { ok: true, owner: true, verified: true, saved: 48, opted_in: 17, by_chapter: [{ chapter: 'south-florida', saved: 31, opted_in: 12 }, { chapter: 'central-florida', saved: 9, opted_in: 3 }, { chapter: 'none', saved: 8, opted_in: 2 }], campaign: null, next: null, people: [], messages: [], limits: {} }; return drawAudience(); }
        fetch(SB + '/functions/v1/ve-campaign-window', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() }, body: JSON.stringify({ action: 'audience', listing_id: l.id }) })
          .then(function (r) { return r.json(); }).then(function (d) { AU = d && d.ok ? d : { ok: false }; draw(); }).catch(function () { AU = { ok: false }; draw(); });
        return '<p class="vpd-empty">Loading your audience...</p>';
      }
      if (!AU.ok) return '<p class="vpd-empty">Your audience did not load. Try again in a moment.</p>';
      var c = AU.campaign, L = AU.limits || {};
      var out = (AUnote ? '<p class="vpd-done">' + esc(AUnote) + '</p>' : '') +
        '<div class="vpd-tiles"><div><b>' + n(AU.saved) + '</b><span>Members who saved you</span></div><div><b>' + n(AU.opted_in) + '</b><span>Said you can message them during campaigns</span></div>' +
        (c ? '<div><b>' + n(L.left) + ' of ' + n(L.per_campaign) + '</b><span>Messages left this campaign</span></div>' : '') + '</div>' +
        '<p class="vpd-empty" style="margin:0 0 12px">When members save you, we ask if you can message them during your campaigns with us. We never show who saved you: you see counts, and while a campaign runs, the members who said yes, with only what they chose to show on their profile.</p>';
      out += '<h4>By chapter</h4>' + (AU.by_chapter.length ? '<div class="vpd-table-wrap"><table class="vpd-table"><thead><tr><th>Chapter</th><th>Saved you</th><th>Said yes</th></tr></thead><tbody>' +
        AU.by_chapter.map(function (r) { return '<tr><td>' + esc(hubName(r.chapter)) + '</td><td>' + n(r.saved) + '</td><td>' + n(r.opted_in) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="vpd-empty">No saves yet.</p>');
      if (!c) return out + '<h4>Messages</h4><p class="vpd-empty">' + (AU.next ? 'Your next campaign, ' + esc(AU.next.name) + ', runs ' + esc(longDay(AU.next.starts_on)) + ' to ' + esc(longDay(AU.next.ends_on)) + '. You can message the members who said yes while it runs.' :
        'You can message the members who said yes while one of your campaigns with us is running. <a href="?tab=brand&pd=opps" data-vpd="opps">See our campaigns</a>.') + '</p>';
      var why = c.paused ? 'Your campaign\'s messages are paused while our team looks at a member\'s report. We will be in touch.' : !AU.owner ? 'Only the owner sends messages.' : !AU.verified ? 'Messages open once we approve your claim.' :
        !L.left ? 'You have sent every message for this campaign.' : L.next_at ? 'One message a week: the next one can go ' + new Date(L.next_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) + '.' : !AU.opted_in ? 'No members have said yes yet.' : '';
      out += '<h4>' + esc(c.name) + ', until ' + esc(longDay(c.ends_on)) + '</h4>' +
        '<label class="vpd-f">Your message<textarea id="vpd-cmsg" maxlength="' + n(L.max).replace(/,/g, '') + '"' + (why ? ' disabled' : '') + ' placeholder="This week only: 20% off for Vegans Explore members. Show your Passport at the counter."></textarea></label>' +
        '<p class="vpd-empty" style="margin:-6px 0 8px">It goes by email from Vegans Explore with your name on it. You never see their email, and they never see yours. They can stop your messages or report one; a report pauses the campaign\'s messages until our team looks.</p>' +
        '<p class="vpd-msg' + (why ? ' bad' : '') + '" id="vpd-msg" role="status">' + esc(why) + '</p>' +
        '<div class="vpd-bar"><span class="vpd-empty" style="padding:0">One a week, ' + n(L.per_campaign) + ' a campaign</span><button type="button" class="vpd-btn" data-vpd-send' + (why ? ' disabled' : '') + '>Send to ' + n(AU.opted_in) + (AU.opted_in === 1 ? ' member' : ' members') + '</button></div>';
      out += '<h4>Who said yes</h4>' + (AU.people.length ? '<div class="vpd-grid">' + AU.people.map(function (g) {
        var a = g.answers || {}, line = [a.q1_city ? hubName(a.q1_city) : '', a.q6_stage || ''].filter(Boolean).join(' \u00b7 ');
        var said = Object.keys(SAID).filter(function (k) { return a[k] && (!Array.isArray(a[k]) || a[k].length); }).map(function (k) { return '<p><b style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#1f5f22">' + esc(SAID[k]) + '</b><br>' + esc(Array.isArray(a[k]) ? a[k].join(', ') : a[k]) + '</p>'; }).join('');
        return '<div class="vpd-card"><b>' + esc(g.name || 'A member') + '</b>' + (line ? '<p>' + esc(line) + '</p>' : '') + said + '</div>';
      }).join('') + '</div>' : '<p class="vpd-empty">No one yet.</p>');
      out += '<h4>Messages you sent</h4>' + (AU.messages.length ? '<div class="vpd-list">' + AU.messages.map(function (m) {
        return '<div class="vpd-card"><p style="margin:0 0 4px;font-size:12px;font-weight:700;color:rgba(26,26,26,.68)">' + esc(new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })) + ' &middot; to ' + n(m.sent) + '</p><p style="white-space:pre-line;margin:0">' + esc(m.body) + '</p></div>';
      }).join('') + '</div>' : '<p class="vpd-empty">None yet.</p>');
      return out;
    }
    function drawAds() {
      var mine = D.ads.length ? '<div class="vpd-list">' + D.ads.map(function (a) {
        return '<div class="vpd-row"><div><b>' + esc(a.name) + '</b><small>' + esc([a.start_date, a.end_date].filter(Boolean).join(' to ')) + ' &middot; ' + n(a.impressions) + ' impressions &middot; ' + n(a.clicks) + ' clicks</small></div>' +
          '<span class="vpd-tag' + (a.status === 'active' ? '' : ' off') + '">' + esc(a.status === 'active' ? 'Live' : a.status === 'completed' ? 'Finished' : 'Not live yet') + '</span><span></span></div>';
      }).join('') + '</div>' : '<p class="vpd-empty">You have no ads running yet.</p>';
      return '<h4 style="margin-top:0">Your ads</h4>' + mine +
        '<h4>Place an ad</h4><p class="vpd-empty" style="padding-bottom:12px">Pick where you want to be seen. We send you the price and a sample with your ad in place, and nothing runs until you approve it.</p>' +
        '<div class="vpd-grid">' + D.spots.map(function (s) {
          return '<div class="vpd-card"><b>' + esc(s.page_name) + '</b><p>About ' + n(s.views) + ' views a month &middot; ' + s.slots + ' spot' + (s.slots > 1 ? 's' : '') + '</p>' +
            '<button type="button" class="vpd-btn sm" data-vpd-ad="' + esc(s.page_slug) + '">Ask about this spot</button></div>';
        }).join('') + '</div><p class="vpd-msg" id="vpd-msg" role="status"></p>';
    }

    // ---- Opportunities
    function drawOpps() {
      var ints = {}; (D.interests || []).forEach(function (k) { ints[k] = 1; });
      var camps = KIND === 'show' ? PODCAST_OPPS : KIND === 'org' ? ORG_OPPS : CAMPAIGNS.filter(function (c) { return !c[4] || Date.now() < c[4]; });
      return '<p class="vpd-empty">Tell us where you want in and we reach out with the details. Everything here is Coming.</p>' +
        '<div class="vpd-grid">' + camps.map(function (c) {
          return '<div class="vpd-card"><span class="vpd-tag warn">Coming &middot; ' + esc(c[1]) + '</span><b>' + esc(c[2]) + '</b><p>' + esc(c[3]) + '</p>' +
            '<button type="button" class="vpd-btn sm' + (ints[c[0]] ? ' o' : '') + '" data-vpd-int="' + esc(c[0]) + '" data-label="' + esc(c[2]) + '">' + (ints[c[0]] ? 'You are interested' : 'I\'m interested') + '</button></div>';
        }).join('') + '</div>' +
        (D.opportunities.length ? '<h4>Open roles in our community</h4><div class="vpd-list">' + D.opportunities.map(function (o) {
          return '<div class="vpd-row"><div><b>' + esc(o.title) + '</b><small>' + esc([o.opportunity_type, o.commitment, o.compensation].filter(Boolean).join(' &middot; ')) + '</small></div>' +
            '<span class="vpd-tag">' + esc(o.city_slug ? 'Your city' : 'Every city') + '</span>' +
            '<a class="vpd-btn sm o" href="/communities/' + esc(o.city_slug || D.listing.hub || 'south-florida') + '?tab=opportunities">See it</a></div>';
        }).join('') + '</div>' : '') + '<p class="vpd-msg" id="vpd-msg" role="status"></p>';
    }

    // ---- Audit
    function drawAudit() {
      var G = '/guides/vegan-restaurant-survival-guide';
      var list = D.audits.length ? '<div class="vpd-list">' + D.audits.map(function (a) {
        var done = a.status === 'done';
        // Our monthly check-up runs every check, but it is ours: the owner reads what to fix, not a score they paid for.
        var mine = a.source !== 'checkup';
        return '<div class="vpd-row"><div><b>' + esc(!mine ? 'Our monthly check-up' : a.tier === 'full' ? 'Full audit' : 'Free check') + '</b><small>' + esc(new Date(a.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })) +
          (mine && done && a.tier === 'full' && a.max_score ? ' &middot; ' + Math.round(a.score / a.max_score * 100) + '%' : '') + '</small></div>' +
          '<span class="vpd-tag' + (done ? '' : ' warn') + '">' + (done ? 'Ready' : 'Running') + '</span>' +
          (done ? '<a class="vpd-btn sm o" href="' + G + '#/audit/r/' + esc(a.id) + '">Open</a>' : '<span></span>') + '</div>';
      }).join('') + '</div>' : '<p class="vpd-empty">No audits yet.</p>';
      return '<div class="vpd-grid"><div class="vpd-card"><b>The free check</b><p>Ten things Google, your website and your Instagram tell a hungry visitor, with what to fix first.</p><a class="vpd-btn sm" href="' + G + '#/audit">Run the free check</a></div>' +
        '<div class="vpd-card"><b>The full audit, $49</b><p>Every check, scored, with how to fix each one, and a re-check 90 days later.</p><a class="vpd-btn sm o" href="' + G + '#/audit">Get the full audit</a></div>' +
        '<div class="vpd-card"><b>Full audit and Secret Shopper, $149</b><p>The full audit plus a visit from our team as a normal guest, with a written report.</p><a class="vpd-btn sm o" href="' + G + '#/audit">Add the Secret Shopper</a></div></div>' +
        '<h4>Your audits</h4>' + list;
    }

    // ---- Guides
    function drawGuides() {
      var seen = {}, list = D.guides.filter(function (g) { if (seen[g.title]) return false; seen[g.title] = 1; return true; });
      return '<div class="vpd-grid">' + list.map(function (g) {
        // Every Guide's banner (LOCKED 2026-10-10) lives under media/guides/banners/<slug>.jpg.
        var pic = g.cover_url || SB + '/storage/v1/object/public/vegan-media/media/guides/banners/' + g.slug + '.jpg';
        return '<div class="vpd-card"><div style="aspect-ratio:16/10;border-radius:8px;background:#f3f3f3 center/cover no-repeat;background-image:url(\'' + esc(pic) + '\')"></div>' +
          '<span class="vpd-tag' + (g.owned ? '' : ' off') + '">' + (g.access_rule === 'free' ? 'Free' : g.owned ? 'Yours' : '$11 or 1,100 points') + '</span><b>' + esc(g.title) + '</b><p>' + esc(g.description || '') + '</p>' +
          '<a class="vpd-btn sm' + (g.owned ? '' : ' o') + '" href="/guides/' + esc(g.slug) + '">' + (g.owned ? 'Open it' : 'See it') + '</a></div>';
      }).join('') + '</div>';
    }

    // ---- Your plan
    function drawPlan() {
      var member = D.member_active || D.admin;
      return '<div class="vpd-grid"><div class="vpd-card' + (member ? ' done' : '') + '"><b>Founding Member</b><p>' + (D.member_active ? 'You are a Founding Member. Your whole dashboard is open.' : D.admin ? 'Super admins see every dashboard.' : '$11 one time opens your whole dashboard.') + '</p>' +
        (member ? '' : '<button type="button" class="vpd-btn sm" data-vpd-join>Become a Founding Member, $11</button>') + '</div>' +
        '<div class="vpd-card' + (D.plan ? ' done' : '') + '"><b>' + esc(D.plan ? D.plan.name || 'Partner' : 'Partner') + '</b><p>' +
        (D.plan ? (D.plan.status === 'trialing' ? 'Front Row Start: your first quarter starts in January 2027.' : 'Your plan is live.' + (D.plan.renews_at ? ' Renews ' + esc(new Date(D.plan.renews_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })) + '.' : ''))
          : 'A front-row seat on every campaign, ads placed for you and a campaign manager. ' + (FRONT_ROW ? 'Front Row Start: nothing today, the rest of 2026 on us, then $111 a quarter from January 2027.' : '$111 a quarter.')) + '</p>' +
        (D.plan ? '' : '<a class="vpd-btn sm o" href="/claim?listing=' + encodeURIComponent(l.slug || '') + '&plan=brand' + (FRONT_ROW ? '&offer=front-row' : '') + '">' + (FRONT_ROW ? 'Take my front-row seat' : 'Become a Partner') + '</a>') + '</div></div>';
    }
    var VIEW_FN = { home: drawHome, insights: drawInsights, audience: drawAudience, checkins: drawCheckins, saves: drawSaves, menu: drawMenu, ads: drawAds, opps: drawOpps, audit: drawAudit, guides: drawGuides, plan: drawPlan };

    function msg(t, bad) { var m = el.querySelector('#vpd-msg'); if (m) { m.textContent = t; m.classList.toggle('bad', !!bad); } }
    function wire(view) {
      el.querySelectorAll('[data-vpd]').forEach(function (a) {
        a.addEventListener('click', function (e) { e.preventDefault(); go(a.dataset.vpd, a.dataset.vpdItem ? { item: a.dataset.vpdItem } : null); });
      });
      el.querySelectorAll('[data-vpd-edit]').forEach(function (b) { b.addEventListener('click', function () { if (opts.editPage) opts.editPage(b.dataset.vpdEdit); }); });
      el.querySelectorAll('[data-vpd-join]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (opts.onJoin) return opts.onJoin();
          if (!window.VEAuth || !VEAuth.startEntryCheckout) return;
          b.disabled = true;
          VEAuth.startEntryCheckout(1100).then(function (d) { if (d && d.url) location.href = d.url; else b.disabled = false; }, function () { b.disabled = false; });
        });
      });
      el.querySelectorAll('[data-vpd-days]').forEach(function (b) { b.addEventListener('click', function () { days = Number(b.dataset.vpdDays); D = null; load(draw); }); });
      el.querySelectorAll('[data-vpd-sort]').forEach(function (h) {
        h.addEventListener('click', function () { var k = h.dataset.vpdSort; sortBy = sortBy[0] === k ? [k, -sortBy[1]] : [k, k === 'day' ? -1 : -1]; draw(); });
      });
      var save = el.querySelector('[data-vpd-save]');
      if (save) save.addEventListener('click', function () {
        var id = save.dataset.vpdSave, v = function (k) { return (el.querySelector('#vpd-' + k) || {}).value; }, c = function (k) { return !!(el.querySelector('#vpd-' + k) || {}).checked; };
        var item = { id: id === 'new' ? undefined : id, name: v('name'), category: v('category'), price_display: v('price_display'), sort_order: v('sort_order'), description: v('description'),
          is_vegan: c('is_vegan'), is_gluten_free: c('is_gluten_free'), is_featured: c('is_featured'), is_available: c('is_available') };
        if (!String(item.name || '').trim()) return msg('Give the item a name.', true);
        save.disabled = true; msg('Saving...');
        api({ action: 'menu_save', listing_id: l.id, item: item }).then(function (d) {
          save.disabled = false;
          if (!d || !d.ok) return msg(d && d.error === 'menu_full' ? 'Your menu holds 300 items at most.' : 'That did not save. Try again.', true);
          menu = null; D.menu_count = Math.max(D.menu_count, 1); go('menu');
        });
      });
      var send = el.querySelector('[data-vpd-send]');
      if (send) send.addEventListener('click', function () {
        var t = (el.querySelector('#vpd-cmsg') || {}).value || '';
        if (!t.trim()) return msg('Write your message first.', true);
        if (opts.call) return msg('This is the sample business: nothing is sent.', true);
        if (!confirm('Send this to ' + AU.opted_in + (AU.opted_in === 1 ? ' member' : ' members') + '? You have ' + AU.limits.left + ' of ' + AU.limits.per_campaign + ' left this campaign.')) return;
        send.disabled = true; msg('Sending...');
        fetch(SB + '/functions/v1/ve-campaign-window', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() }, body: JSON.stringify({ action: 'message_send', listing_id: l.id, body: t.trim() }) })
          .then(function (r) { return r.json(); }).then(function (d) {
            if (!d || !d.ok) { send.disabled = false; return msg((d && d.message) || 'That did not send. Try again.', true); }
            AU = null; AUnote = 'Sent to ' + d.sent + (d.sent === 1 ? ' member.' : ' members.'); draw();
          }).catch(function () { send.disabled = false; msg('That did not send. Try again.', true); });
      });
      var del = el.querySelector('[data-vpd-del]');
      if (del) del.addEventListener('click', function () {
        if (!confirm('Remove this item from your menu?')) return;
        api({ action: 'menu_delete', listing_id: l.id, id: q('item') }).then(function (d) { if (!d || !d.ok) return msg('That did not go through. Try again.', true); menu = null; go('menu'); });
      });
      el.querySelectorAll('[data-vpd-ad]').forEach(function (b) {
        b.addEventListener('click', function () {
          var note = prompt('Anything we should know? Dates, a budget, what you want to promote. (Optional)') ;
          if (note === null) return;
          b.disabled = true;
          api({ action: 'ad_request', listing_id: l.id, page_slug: b.dataset.vpdAd, note: note }).then(function (d) {
            if (!d || !d.ok) { b.disabled = false; return msg('That did not go through. Try again.', true); }
            b.textContent = 'We will be in touch'; msg('Got it. We will send you the price and a sample.');
          });
        });
      });
      el.querySelectorAll('[data-vpd-int]').forEach(function (b) {
        b.addEventListener('click', function () {
          var k = b.dataset.vpdInt, on = (D.interests || []).indexOf(k) < 0;
          b.disabled = true;
          api({ action: 'partner_interest', listing_id: l.id, campaign: k, label: b.dataset.label, on: on }).then(function (d) {
            b.disabled = false;
            if (!d || !d.ok) return msg('That did not go through. Try again.', true);
            D.interests = on ? (D.interests || []).concat(k) : (D.interests || []).filter(function (x) { return x !== k; });
            draw(); msg(on ? 'Thanks. We will reach out with the details.' : 'Taken off your list.');
          });
        });
      });
    }
    window.addEventListener('popstate', function () { if (new URLSearchParams(location.search).get('tab') === 'brand' && el.isConnected && !q('edit')) draw(); });
    draw();
    return { redraw: draw };
  }

  window.VEPartnerDash = { mount: mount };
})();
