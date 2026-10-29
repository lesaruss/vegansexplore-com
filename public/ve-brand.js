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
 *   - ve-city-banner.js loads the city art from vegansexplore.com (assetOrigin).
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
    // Votes on lesaruss.ai are for LESARUSS members: the $11 LESARUSS Passport (today it comes with a claim) or a Diplomat
    // ($111, /join). Members sign in with Continue with LESARUSS (ve-auth.js, client 'lesaruss-ai', ve-lesaruss-sso), which
    // lets in only a LESARUSS member (lr_member_entitled), and ve-votes counts their vote in the same pool as Vegans Explore.
    passportUrl: '/join',
    passportLabel: 'Become a Diplomat',
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
        body: 'Member votes decide which businesses lead every list. Diplomats (<b>$111 for 111 days</b>) vote every day for the studios, venues and services they trust, and so does the owner who claims a listing with the <b>$11</b> LESARUSS Passport.' },
      save: { icon: 'bookmark', title: 'Saving is for Passport holders',
        body: 'Save the businesses you want to come back to. With a LESARUSS Passport, <b>$11 one time</b>, you can also vote for them every day.' }
    },
    drawNav: drawNav,
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

  var NAV = [['/', 'Start Here'], ['/guides', 'Guides'], ['/directory', 'Directory'], ['/join', 'Become a member'],
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
      '<button type="button" class="lr-burger" aria-expanded="false" aria-controls="lrMenu" aria-label="Open menu">&#9776;</button></div>';
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
      '<nav class="lr-foot-links" aria-label="Footer"><a href="/guides">Guides</a><a href="/directory">Directory</a><a href="/join">Become a member</a>' +
      '<a href="' + HQ + '/member/business">For businesses</a><a href="' + HQ + '/login">Member sign in</a>' +
      '<a href="https://lesaruss.com" target="_blank" rel="noopener noreferrer">The Universe</a><a href="mailto:contact@lesaruss.com">contact@lesaruss.com</a></nav>' +
      '<span class="lr-foot-copy">&copy; ' + new Date().getFullYear() + ' LESARUSS</span></div>';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(f, s); else document.body.appendChild(f);
  }
})();
