/* ve-brand.js: one framework for every brand (Sean, 2026-10-29: "these listings may need to go on Vegans Explore. So it needs
 * to be set up exactly the same way. If we make an update in Vegans Explore and the look and feel and the functionality, it needs
 * to match LESARUSS.ai... What changes is just maybe the color and the look and feel of it").
 *
 * lesaruss.ai serves our own pages (the listing page, Join the Directory) and /public through a proxy to this site
 * (lesaruss-ai-site next.config.ts). Load this file in <head>, before anything else: on lesaruss.ai it sets window.VE_BRAND,
 * and the pages and shared scripts read it:
 *   - colors: the --ve-green* variables the pages use and the --vb-* ones the shared components use, in LESARUSS orange;
 *   - nav.js and footer.js draw the LESARUSS header and footer (drawNav, drawFooter) and skip our Google tag;
 *   - ve-votes.js sends the members window to the LESARUSS Passport and HQ sign-in;
 *   - ve-city-banner.js loads the city art from vegansexplore.com (assetOrigin);
 *   - pulse.html (served at lesaruss.ai/pulse) picks a business topic where Vegans Explore picks a city (pulse).
 * On vegansexplore.com it does nothing. ?brand=lesaruss turns it on here for a visit (a preview, a local check); ?brand=ve off.
 */
(function () {
  if (window.VE_BRAND) return;
  // lesaruss.ai, and its branch previews on Vercel.
  var on = /(^|\.)lesaruss\.ai$/.test(location.hostname) || /^lesaruss-ai-site[a-z0-9-]*\.vercel\.app$/.test(location.hostname);
  try {
    var q = new URLSearchParams(location.search).get('brand');
    if (q === 'lesaruss') sessionStorage.setItem('ve_brand', 'lesaruss');
    if (q === 've') sessionStorage.removeItem('ve_brand');
    if (!on && sessionStorage.getItem('ve_brand') === 'lesaruss') on = true;
  } catch (e) {}
  if (!on) return;

  var HQ = 'https://hq.lesaruss.ai';
  // Which listings are LESARUSS.ai's (lesaruss-ai-site lib/directory.ts): its tags, and the studios both sites share. A business
  // member's listing is added by the Directory page itself (memberIds), since ad_businesses has no public read.
  var TAGS = ['lesaruss-ai-directory', 'lesaruss-ai-directory-candidate', 'lesaruss-ai-business-member'], SHARED = ['Studios'];
  // The LESARUSS.ai Directory's sections (listings.category holds the sub-section, as on Vegans Explore). The one list: the
  // lesaruss.ai Directory page reads it from here too. A national section is the same in every city.
  var SECTIONS = [
    { key: 'studios', label: 'Studios', subs: ['Recording Studios', 'Studios'] },
    { key: 'media', label: 'Media', subs: ['News Outlets', 'Radio and TV', 'Podcasts'] },
    { key: 'venues', label: 'Venues', subs: ['Event Venues', 'Coworking Spaces'] },
    { key: 'services', label: 'Services', subs: ['Music and Voice Lessons', 'Legal and Trademark', 'Printing'] },
    { key: 'tools', label: 'Tools', national: true, subs: ['AI & Automation', 'Web & Development', 'Marketing & Growth', 'Content Creation & Media', 'Business Operations', 'Branding & Creative Assets'] }
  ];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  window.VE_BRAND = {
    key: 'lesaruss',
    name: 'LESARUSS.ai',
    home: 'https://lesaruss.ai',
    assetOrigin: 'https://vegansexplore.com',
    // Votes on lesaruss.ai are for LESARUSS members: the $11 LESARUSS Passport (lesaruss.ai/passport, paid through HQ's
    // /api/passport, or with a claim) or a Diplomat ($111, /join). Members sign in with Continue with LESARUSS (ve-auth.js,
    // client 'lesaruss-ai', ve-lesaruss-sso), which lets in only a LESARUSS member (lr_member_entitled), and ve-votes counts
    // their vote in the same pool as Vegans Explore. The members window sends ?from= and ?back= to the Passport page.
    passportUrl: '/passport',
    passportLabel: 'Get the Passport, $11',
    passportApi: HQ + '/api/passport',
    loginUrl: HQ + '/login',
    signIn: 'lesaruss',
    ssoClient: 'lesaruss-ai',
    contact: 'contact@lesaruss.com',
    tags: TAGS,
    sharedCategories: SHARED,
    sections: SECTIONS,
    sectionOf: function (cat) { return SECTIONS.filter(function (x) { return x.subs.indexOf(cat) >= 0; })[0] || null; },
    ownsListing: function (l) {
      return !!l && ((l.tags || []).some(function (t) { return TAGS.indexOf(t) >= 0; }) || SHARED.indexOf(l.category) >= 0);
    },
    // Claim your listing (claim.html in brand mode): the $11 LESARUSS Passport, paid through HQ's /api/claim (the claim waits for
    // review in Depot > Claims, like every claim). A business not listed yet applies in HQ.
    passportName: 'LESARUSS Passport',
    claimApi: HQ + '/api/claim',
    applyUrl: HQ + '/business/apply',
    claimLede: 'Find your business in the LESARUSS.ai Directory and claim it with a LESARUSS Passport, $11 one time. Not listed yet? Add it and we will review it.',
    claimTicks: ['Your listing, marked as claimed and yours to keep current once we confirm it is you', 'A LESARUSS Passport: vote every day for the businesses you trust',
      'First access to sponsorship and advertising opportunities'],
    claimNext: function (slug) {
      return [
        { href: '/directory/' + encodeURIComponent(slug), small: 'Next', title: 'Your listing', text: 'Marked as claimed once we confirm it is you. We email you when it is approved.' },
        { soon: true, title: 'Edit your page', text: 'Update your details, photos and story yourself.' },
        { soon: true, title: 'Sponsorships and ads', text: 'First word on sponsorship and advertising opportunities across LESARUSS.' }
      ];
    },
    // Claim this listing: Join the Directory, here on lesaruss.ai, in LESARUSS colors.
    claimUrl: function (slug) { return '/claim?listing=' + encodeURIComponent(slug || ''); },
    gates: {
      vote: { icon: 'heart', title: 'Voting is for LESARUSS members',
        body: 'Member votes decide which businesses lead every list. A LESARUSS Passport, <b>$11 one time</b>, lets you vote every day for the studios, venues and services you trust. <a href="/join">Diplomats</a> vote too.' },
      save: { icon: 'bookmark', title: 'Saving is for Passport holders',
        body: 'Save the businesses you want to come back to. With a LESARUSS Passport, <b>$11 one time</b>, you can also vote for them every day.' },
      comment: { icon: 'chat', from: 'pulse', title: 'Comments are for LESARUSS members',
        body: 'Anyone can read the Pulse. LESARUSS members talk under every briefing: what they are seeing in their business, and what is working. A LESARUSS Passport is <b>$11 one time</b>. <a href="/join">Diplomats</a> comment too.' },
      report: { icon: 'chat', from: 'pulse', title: 'Reports come from LESARUSS members',
        body: 'Members keep the conversation useful: a report goes to the LESARUSS team. A LESARUSS Passport is <b>$11 one time</b>.' },
      post: { icon: 'chat', from: 'pulse', title: 'The conversation is for LESARUSS members',
        body: 'Anyone can read the Pulse. A LESARUSS Passport, <b>$11 one time</b>, lets you join the conversation under every briefing.' }
    },
    // Events and Funding (Sean, 2026-10-29, canon canon-lesaruss-ai-front-door): events/index.html at lesaruss.ai/events and
    // /funding, the events engine under the LESARUSS tenant (migration 20261030_lesaruss_ai_events_funding.sql).
    calendar: {
      art: '/communities/new-york/banner.jpg',
      event: { title: 'Business Events', sub: 'Conferences, summits, pitch nights, workshops and tours for business owners and creators, each checked on its official page.' },
      funding: { title: 'Funding', sub: 'Grants, loans, accelerators, pitch competitions and fellowships you can apply for, closing soon first, each with its official apply page.' }
    },
    // The Pulse by topic (Sean, 2026-10-29, canon canon-lesaruss-ai-front-door: "the banner picks a topic (AI, Funding, Marketing,
    // Leadership, Creators, Business operations, Events) where Vegans Explore picks a city"). Each key is ve-board's scope lr-<key>;
    // ve_pulse_auto_queue and the writer use the same list (migration 20261030_lesaruss_ai_topic_pulse.sql).
    pulse: {
      sub: 'One briefing a day for each topic, from the business news worth your time: what happened, why it matters to your business, and one thing to do.',
      art: '/communities/new-york/banner.jpg',
      topics: [{ key: 'ai', label: 'AI' }, { key: 'funding', label: 'Funding' }, { key: 'marketing', label: 'Marketing' },
        { key: 'leadership', label: 'Leadership' }, { key: 'creators', label: 'Creators' }, { key: 'operations', label: 'Business operations' },
        { key: 'events', label: 'Events' }]
    },
    drawNav: drawNav,
    mountAccount: mountAccount,
    drawFooter: drawFooter
  };

  // LESARUSS colors on our pages: burnt orange for words and buttons with white words, the bright orange for fills with dark words.
  var st = document.createElement('style');
  st.id = 've-brand-style';
  st.textContent = 'html:root{--ve-green:#C1440D;--ve-green-dark:#9E370A;--ve-green-light:#FFF3E6;--ve-green-deep:#9E370A;' +
    '--vb-accent:#F69820;--vb-accent-ink:#C1440D;--vb-accent-hi:#F69820;--vb-go:#C1440D;--vb-go-hover:#9E370A;--vb-soft:#FFF3E6;' +
    '--vb-line:#F9C99A;--vb-cta:#F69820;--vb-cta-hover:#E0870F;--vb-cta-ink:#1A1A1A;--vb-deep:#1A1A1A;--vb-deep-line:#4a3a30;' +
    '--vb-hero-1:rgba(14,12,10,.86);--vb-hero-2:rgba(14,12,10,.8);--vb-hero-1b:rgba(14,12,10,.9)}';
  (document.head || document.documentElement).appendChild(st);

  var NAV = [['/', 'Start Here'], ['/guides', 'Guides'], ['/directory', 'Directory'], ['/pulse', 'Pulse'], ['/events', 'Events'], ['/funding', 'Funding'], ['/join', 'Become a member'],
    [HQ + '/member/business', 'For businesses'], ['https://lesaruss.com', 'The Universe', 1]];

  // The lesaruss.ai header (lesaruss-ai-site app/site.tsx SiteHeader): the wordmark and the menu behind the button.
  function drawNav() {
    var css = document.createElement('style');
    css.textContent =
      '.lr-topbar{position:sticky;top:0;z-index:400;background:#fff;border-bottom:1px solid rgba(26,26,26,.10);font-family:Montserrat,sans-serif}' +
      '.lr-topbar .row{display:flex;align-items:center;justify-content:space-between;padding:12px 22px}' +
      '.lr-brand{font-weight:900;font-size:16px;letter-spacing:.02em;color:#1A1A1A;text-decoration:none}.lr-brand span{color:#C1440D}' +
      '.lr-burger{background:none;border:1px solid rgba(26,26,26,.10);border-radius:6px;width:38px;height:34px;font-size:16px;cursor:pointer;color:#1A1A1A;font-family:inherit}' +
      '.lr-menu{position:fixed;top:64px;right:22px;background:#fff;border:1px solid rgba(26,26,26,.10);border-radius:14px;box-shadow:0 12px 32px rgba(0,0,0,.14);padding:10px;display:none;flex-direction:column;gap:2px;z-index:401;min-width:170px;font-family:Montserrat,sans-serif}' +
      '.lr-menu.open{display:flex}' +
      '.lr-menu a{padding:11px 14px;border-radius:8px;font-size:14px;font-weight:700;color:#1A1A1A;text-decoration:none}' +
      '.lr-menu a:hover,.lr-menu a[aria-current=page]{background:rgba(246,152,32,.14)}';
    document.head.appendChild(css);
    var here = location.pathname.split('/')[1] || '';
    var bar = document.createElement('div');
    bar.className = 'lr-topbar ve-nav';
    bar.innerHTML = '<div class="row"><a class="lr-brand" href="/" aria-label="LESARUSS AI home">LESARUSS<span>.</span>AI</a>' +
      '<div class="lr-right"><span class="lr-account"></span>' +
      '<button type="button" class="lr-burger" aria-expanded="false" aria-controls="lrMenu" aria-label="Open menu">&#9776;</button></div></div>';
    var menu = document.createElement('nav');
    menu.id = 'lrMenu'; menu.className = 'lr-menu'; menu.setAttribute('aria-label', 'Site');
    menu.innerHTML = NAV.map(function (n) {
      var cur = n[0] === '/' + here && here ? ' aria-current="page"' : '';
      return '<a href="' + esc(n[0]) + '"' + cur + (n[2] ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + esc(n[1]) + '</a>';
    }).join('');
    var s = document.currentScript;
    var parent = s && s.parentNode ? s.parentNode : document.body;
    parent.insertBefore(bar, s && s.parentNode ? s : parent.firstChild);
    parent.insertBefore(menu, bar.nextSibling);
    var btn = bar.querySelector('.lr-burger');
    function set(o) { menu.classList.toggle('open', o); btn.setAttribute('aria-expanded', o ? 'true' : 'false'); }
    btn.addEventListener('click', function (e) { e.stopPropagation(); set(!menu.classList.contains('open')); });
    document.addEventListener('click', function (e) { if (!menu.contains(e.target)) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
    function setH() { document.documentElement.style.setProperty('--ve-nav-h', Math.round(bar.getBoundingClientRect().height) + 'px'); }
    setH(); window.addEventListener('resize', setH);
    mountAccount(bar.querySelector('.lr-account'));
  }

  // Sign in, and who is signed in, in the header (Sean, 2026-10-29: "I don't see how to log in... I didn't see a way to actually
  // show that I was logged in"). The listing pages' header (drawNav) and lesaruss.ai's own header (lesaruss-ai-site app/site.tsx)
  // both use it. Signed out: Sign in, which starts Continue with LESARUSS as this brand (ve-auth.js, data-ve-lesaruss) and comes
  // back to this page. Signed in: their initial and first name, opening who they are and Sign out. ve-auth.js keeps the session
  // in this site's localStorage; it is loaded here once the page has its own scripts, unless the page already did.
  var ACCT_CSS = '.lr-right{display:flex;align-items:center;gap:10px}.lr-account{position:relative;display:inline-flex}' +
    '.lr-signin{font:inherit;font-family:Montserrat,sans-serif;font-size:13px;font-weight:800;background:#F69820;color:#1A1A1A;border:0;border-radius:6px;padding:9px 16px;cursor:pointer;white-space:nowrap}' +
    '.lr-signin:hover{background:#E0870F}' +
    '.lr-me{display:inline-flex;align-items:center;gap:8px;font:inherit;font-family:Montserrat,sans-serif;font-size:13px;font-weight:800;color:#1A1A1A;background:#fff;border:1px solid rgba(26,26,26,.14);border-radius:6px;padding:5px 12px 5px 5px;cursor:pointer}' +
    '.lr-me i{font-style:normal;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:#C1440D;color:#fff;font-size:12px}' +
    '.lr-me-pop{position:absolute;top:calc(100% + 8px);right:0;min-width:270px;max-width:calc(100vw - 32px);background:#fff;border:1px solid rgba(26,26,26,.10);border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.14);padding:12px;display:none;z-index:402;font-family:Montserrat,sans-serif}' +
    '.lr-me-pop.open{display:block}.lr-me-pop b{display:block;font-size:14px;color:#1A1A1A}.lr-me-pop small{display:block;font-size:12px;color:rgba(26,26,26,.62);margin:2px 0 10px;overflow-wrap:anywhere}' +
    '.lr-me-pop .lr-out{font:inherit;font-size:13px;font-weight:800;width:100%;text-align:left;background:rgba(246,152,32,.14);color:#1A1A1A;border:0;border-radius:6px;padding:9px 12px;cursor:pointer}' +
    '@media(max-width:420px){.lr-me span{display:none}.lr-me{padding:5px}}';
  function withAuth(cb) {
    if (window.VEAuth) return cb();
    var go = function () {
      if (window.VEAuth) return cb();
      if (!document.querySelector('script[src*="/public/ve-auth.js"]')) {
        var sc = document.createElement('script'); sc.src = '/public/ve-auth.js'; sc.onload = cb; document.head.appendChild(sc);
      } else { var n = 0, t = setInterval(function () { if (window.VEAuth || ++n > 40) { clearInterval(t); if (window.VEAuth) cb(); } }, 150); }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  }
  function mountAccount(el) {
    if (!el) return;
    if (!document.getElementById('lr-acct-css')) { var c = document.createElement('style'); c.id = 'lr-acct-css'; c.textContent = ACCT_CSS; document.head.appendChild(c); }
    function draw() {
      var A = window.VEAuth, m = A && A.isLoggedIn() ? A.getMember() : null;
      var back = location.pathname + location.search + location.hash;
      if (!m) {
        el.innerHTML = '<button type="button" class="lr-signin" data-ve-lesaruss="' + esc(back) + '">Sign in</button>';
        return;
      }
      var name = String(m.name || m.email || 'Member'), first = name.split(/\s+/)[0];
      el.innerHTML = '<button type="button" class="lr-me" aria-expanded="false" aria-haspopup="true"><i>' + esc(first.charAt(0).toUpperCase()) + '</i><span>' + esc(first) + '</span></button>' +
        '<div class="lr-me-pop" role="menu"><b>' + esc(name) + '</b><small>Signed in' + (m.email ? ' as ' + esc(m.email) : '') + '</small>' +
        '<button type="button" class="lr-out" role="menuitem">Sign out</button></div>';
      var b = el.querySelector('.lr-me'), pop = el.querySelector('.lr-me-pop');
      b.addEventListener('click', function (e) { e.stopPropagation(); var o = !pop.classList.contains('open'); pop.classList.toggle('open', o); b.setAttribute('aria-expanded', o ? 'true' : 'false'); });
      document.addEventListener('click', function (e) { if (!el.contains(e.target)) { pop.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } });
      el.querySelector('.lr-out').addEventListener('click', function () { window.VEAuth.signOut(); });
    }
    el.innerHTML = '<button type="button" class="lr-signin" data-ve-lesaruss="' + esc(location.pathname + location.search + location.hash) + '">Sign in</button>';
    withAuth(draw);
    window.addEventListener('storage', function (e) { if (!e.key || e.key === 've_token' || e.key === 've_member') draw(); });
  }

  // The lesaruss.ai footer (app/site.tsx SiteFooter).
  function drawFooter() {
    var css = document.createElement('style');
    css.textContent =
      '.lr-foot{border-top:1px solid rgba(26,26,26,.10);background:#fff;font-family:Montserrat,sans-serif}' +
      '.lr-foot-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 22px;padding:18px 22px;max-width:1180px;margin:0 auto;font-size:13px;font-weight:600;color:rgba(26,26,26,.62)}' +
      '.lr-foot-brand{font-weight:900;color:#1A1A1A;letter-spacing:.02em}.lr-foot-brand span{color:#C1440D}.lr-foot-brand em{font-style:normal;font-weight:600;color:rgba(26,26,26,.62);letter-spacing:0}' +
      '.lr-foot-links{display:flex;flex-wrap:wrap;gap:6px 18px}.lr-foot-links a{color:rgba(26,26,26,.62);text-decoration:none}.lr-foot-links a:hover{color:#1A1A1A;text-decoration:underline}' +
      '@media(max-width:700px){.lr-foot-row{padding:16px}}';
    document.head.appendChild(css);
    var f = document.createElement('footer');
    f.className = 'lr-foot ve-footer'; f.setAttribute('role', 'contentinfo');
    f.innerHTML = '<div class="lr-foot-row"><span class="lr-foot-brand">LESARUSS<span>.</span>AI <em>&middot; Your guides in the new AI world.</em></span>' +
      '<nav class="lr-foot-links" aria-label="Footer"><a href="/guides">Guides</a><a href="/directory">Directory</a><a href="/pulse">Pulse</a><a href="/events">Events</a><a href="/funding">Funding</a><a href="/join">Become a member</a>' +
      '<a href="' + HQ + '/member/business">For businesses</a><a href="' + HQ + '/login">Member home</a>' +
      '<a href="https://lesaruss.com" target="_blank" rel="noopener noreferrer">The Universe</a><a href="mailto:contact@lesaruss.com">contact@lesaruss.com</a></nav>' +
      '<span class="lr-foot-copy">&copy; ' + new Date().getFullYear() + ' LESARUSS</span></div>';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(f, s); else document.body.appendChild(f);
  }
})();
