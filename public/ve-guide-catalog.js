/* ve-guide-catalog.js: the Guide cards, one list for /guides and the dashboard's Guides tab (Sean, 2026-10-26: the
   dashboard should mimic "what we currently have on the main guides page"). Change a Guide here and both pages follow.

   Live Guides wear their banner (800 x 500, the Guide on white; see Guide banners in CLAUDE.md). Guides still being
   made wear a flat line icon (Sean: "use flat images, flat icons for those") and show to signed-in members only, with
   Notify me; signed out, /guides shows only the live ones. The Welcome Guide is the Passport Guide (/passport), free.

   Usage (the page supplies the .gc-* card styles; this file adds the banner and icon rules):
     VEGuideCatalog.render(el, { member: true|false, ambassador: true|false, source: 'guides-live-catalog', open: function (guide, event) {} });
   `open` is optional: the dashboard passes one to open a Guide inside its window.
*/
(function () {
  if (window.VEGuideCatalog) return;
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var BANNERS = SB + '/storage/v1/object/public/vegan-media/media/guides/banners/';
  var PRICE = '$11 or 1,100 points';

  var ICONS = {
    burger: '<path d="M4 11h16M5 11a7 5 0 0114 0M4 15h16M5 15v1a3 3 0 003 3h8a3 3 0 003-3v-1"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18"/>',
    camera: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
    heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z"/>',
    sprout: '<path d="M12 20v-8M12 12c0-4 3-6 7-6 0 4-3 6-7 6zM12 14c0-3-2-5-6-5 0 3 2 5 6 5z"/>',
    megaphone: '<path d="M3 10v4l11 5V5L3 10zM14 8.5l5-2.5v12l-5-2.5M6 15.4l1 4.1h3l-1-2.8"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>'
  };

  // The Ambassador Guide (Sean, 2026-10-28: "this should show up on their guides, under their guide section. Only available to
  // them"): first, for Ambassadors only (render's opts.ambassador; super admins see it too, marked Ambassadors only). It opens as
  // its own page, never inside the dashboard's frame.
  var AMBASSADOR = { slug: 'ambassador', ambassador: true, full: true, icon: 'megaphone', label: 'For Ambassadors', tag: 'Yours', title: 'The Ambassador Guide',
    href: '/ambassadors/welcome', desc: 'Why it matters, your role, your city, your link and what it earns, who to invite, what to share and who joined through you.',
    chips: [{ text: 'Ambassadors only' }, { text: 'On us', cls: 'free' }], cta: 'Open your Guide' };

  // In order (Sean, 2026-10-26): the Welcome Guide, the Dairy Guide, the Restaurant Guide, the Stadium & Arena Guide
  // (launched 2026-10-29), then what is coming.
  var GUIDES = [
    { slug: 'welcome', label: 'Getting Started', title: 'Welcome Guide', banner: '/public/guides/welcome-guide.jpg', href: '/passport',
      desc: 'Start here: what Vegans Explore is, your community, the Directory, the Guides and how points work. Free and open to everyone.',
      chips: [{ text: 'Free', cls: 'free' }], cta: 'Start the Welcome Guide' },
    { slug: 'vegan-dairy-guide', label: 'Food', tag: 'New', title: 'The Vegan Dairy Guide', banner: BANNERS + 'vegan-dairy-guide.jpg', href: '/guides/vegan-dairy-guide',
      desc: 'Everything you need to go dairy-free: the brands to buy, swaps for every kind of dairy, recipes and cookbooks, the research and our interviews, with Maya walking you through it.',
      chips: [{ text: 'Walked through by Maya' }, { text: PRICE, cls: 'price' }], cta: 'Open the Guide' },
    { slug: 'vegan-restaurant-survival-guide', label: 'Business', tag: 'New', title: 'The Vegan Restaurant Survival Guide', banner: BANNERS + 'vegan-restaurant-survival-guide.jpg', href: '/guides/vegan-restaurant-survival-guide',
      desc: 'What may be quietly hurting your restaurant, and how to fix it: a free check of your Google listing, website and social, the fixes in your order, our interviews with business owners, and how to get featured, with Liz walking you through it.',
      chips: [{ text: 'Walked through by Liz' }, { text: 'Free check' }, { text: PRICE, cls: 'price' }], cta: 'Open the Guide' },
    { slug: 'stadium-arena-guide', label: 'Game Day', tag: 'New', title: 'The Stadium & Arena Guide', banner: '/public/guides/stadium-arena-guide.jpg', href: '/guides/stadium-arena-guide',
      desc: 'Where to eat Vegan at the game: every stand and what it serves, a map of the bowl that takes you from your seat to the food, and fans keeping it right, with River walking you through it. Hard Rock Stadium is free.',
      chips: [{ text: 'Walked through by River' }, { text: 'Hard Rock Stadium free' }, { text: PRICE, cls: 'price' }], cta: 'Open the Guide' },
    { slug: 'airport-guide', label: 'Travel', tag: 'New', title: 'The Airport Guide', banner: '/public/guides/airport-guide.jpg', href: '/guides/airport-guide',
      desc: 'Vegan food at the airport, gate by gate: every spot before or after security, a map of the terminal that takes you from your gate to the food without screening again, and travelers keeping it right, with Nori walking you through it. Fort Lauderdale is free.',
      chips: [{ text: 'Walked through by Nori' }, { text: 'Fort Lauderdale free' }, { text: PRICE, cls: 'price' }], cta: 'Open the Guide' },
    { slug: 'vegan-meat-alternatives', soon: true, icon: 'burger', label: 'Food', title: 'The Vegan Meat Alternatives Guide',
      desc: 'Burgers, chicken, sausage, deli slices and more made from plants: the brands to buy, how to cook them and where to find them.' },
    { slug: 'entrepreneur', soon: true, icon: 'briefcase', label: 'Entrepreneur Path', title: 'Entrepreneur Guide',
      desc: 'Getting your Vegan business listed, claimed and growing on the platform, step by step.' },
    { slug: 'creator', soon: true, icon: 'camera', label: 'Creator Path', title: 'Creator Guide',
      desc: 'Building an audience and earning through the Vegans Explore ecosystem as a content creator.' },
    { slug: 'nonprofit', soon: true, icon: 'heart', label: 'Nonprofit Path', title: 'Nonprofit Guide',
      desc: "Building your organization's community on the platform and growing your base of supporters." },
    { slug: 'prevegan', soon: true, icon: 'sprout', label: 'Pre-Vegan Path', title: 'Pre-Vegan Guide',
      desc: 'Real answers for going from Vegan-curious to confident: what to eat, what to expect and how to start.' },
    { slug: 'seasonedvegan', soon: true, icon: 'globe', label: 'Seasoned Vegan Path', title: 'Seasoned Vegan Guide',
      desc: 'Deepen your impact: advocacy, mentoring and connecting with the global movement.' }
  ];

  var CSS = '.gc-banner{display:block;aspect-ratio:8/5;border-radius:10px;overflow:hidden;background:#f4f6f4;margin-bottom:4px;}' +
    '.gc-banner img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .25s;}' +
    '.gc-card:hover .gc-banner img{transform:scale(1.02);}' +
    '.gc-banner-icon{display:flex;align-items:center;justify-content:center;background:#F2F5F2;color:#1f5f22;}' +
    '.gc-banner-icon svg{width:48px;height:48px;}' +
    '.gc-banner-amb{background:#1f5f22;color:#fff;flex-direction:column;gap:12px;text-decoration:none;}.gc-banner-amb svg{width:64px;height:64px;}' +
    '.gc-banner-amb span{font-size:13px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;}' +
    '.gc-new-tag{font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#fff;background:#1f5f22;border-radius:20px;padding:3px 10px;}' +
    '.gc-waitlist{display:none;margin-top:6px;}.gc-waitlist.open{display:flex;flex-direction:column;gap:8px;}' +
    '.gc-waitlist input{padding:9px 12px;border:1.5px solid rgba(0,0,0,.12);border-radius:6px;font-family:Montserrat,sans-serif;font-size:12px;}' +
    '.gc-waitlist-success{display:none;font-size:11px;font-weight:700;color:#1f5f22;text-align:center;}';

  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function icon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.sprout) + '</svg>';
  }

  function card(g) {
    var chips = (g.chips || (g.soon ? [{ text: PRICE, cls: 'price' }] : [])).map(function (c) {
      return '<span class="gc-chip' + (c.cls ? ' ' + c.cls : '') + '">' + esc(c.text) + '</span>';
    }).join('');
    var top = g.soon ? '<div class="gc-banner gc-banner-icon" aria-hidden="true">' + icon(g.icon) + '</div>'
      : g.ambassador ? '<a class="gc-banner gc-banner-icon gc-banner-amb" href="' + esc(g.href) + '" data-frame-label="' + esc(g.title) + '" data-gc-open tabindex="-1" aria-hidden="true">' + icon(g.icon) + '<span>Ambassador</span></a>'
      : '<a class="gc-banner" href="' + esc(g.href) + '" data-frame-label="' + esc(g.title) + '" data-gc-open tabindex="-1" aria-hidden="true"><img src="' + esc(g.banner) + '" alt="" width="800" height="500" loading="lazy"></a>';
    var tag = g.soon ? '<span class="gc-soon-tag">Coming soon</span>' : g.tag ? '<span class="gc-new-tag">' + esc(g.tag) + '</span>' : '';
    var action = g.soon
      ? '<button type="button" class="gc-btn gc-btn-outline" data-gc-notify>Notify me</button>' +
        '<div class="gc-waitlist"><input type="email" placeholder="Your email address" aria-label="Email to be told when the ' + esc(g.title) + ' opens">' +
        '<button type="button" class="gc-btn gc-btn-primary" data-gc-join>Join the waitlist</button>' +
        '<div class="gc-waitlist-success">You\'re on the list.</div></div>'
      : '<a href="' + esc(g.href) + '" class="gc-btn gc-btn-primary" data-frame-label="' + esc(g.title) + '" data-gc-open>' + esc(g.cta) + '</a>';
    return '<div class="gc-card' + (g.soon ? ' is-soon' : '') + '" role="listitem" data-slug="' + esc(g.slug) + '">' + top +
      '<div class="gc-topline"><span class="gc-label">' + esc(g.label) + '</span>' + tag + '</div>' +
      '<div class="gc-title">' + esc(g.title) + '</div><p class="gc-desc">' + esc(g.desc) + '</p>' +
      '<div class="gc-meta-row">' + chips + '</div>' + action + '</div>';
  }

  function render(el, opts) {
    if (!el) return;
    opts = opts || {};
    if (!document.getElementById('ve-guide-catalog-css')) {
      var st = document.createElement('style'); st.id = 've-guide-catalog-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    // Guides still being made are for members only (Sean, 2026-10-26).
    var all = (opts.ambassador ? [AMBASSADOR] : []).concat(GUIDES);
    var list = all.filter(function (g) { return !g.soon || opts.member; });
    el.innerHTML = list.map(card).join('');
    Array.prototype.forEach.call(el.querySelectorAll('.gc-card'), function (c) {
      var g = all.filter(function (x) { return x.slug === c.getAttribute('data-slug'); })[0];
      if (opts.open && !g.full) Array.prototype.forEach.call(c.querySelectorAll('[data-gc-open]'), function (a) {
        a.addEventListener('click', function (e) { e.preventDefault(); opts.open(g, e); });
      });
      var notify = c.querySelector('[data-gc-notify]');
      if (notify) notify.addEventListener('click', function () { c.querySelector('.gc-waitlist').classList.toggle('open'); });
      var join = c.querySelector('[data-gc-join]');
      if (join) join.addEventListener('click', function () {
        var input = c.querySelector('.gc-waitlist input'), email = (input.value || '').trim();
        if (!email || email.indexOf('@') === -1) { input.focus(); return; }
        join.textContent = 'Sending...'; join.disabled = true;
        fetch(SB + '/rest/v1/member_interest', {
          method: 'POST',
          headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ email: email, role_slug: 'guide-waitlist-' + g.slug, source: opts.source || 'guides-live-catalog' })
        }).then(function (r) {
          if (!r.ok) throw new Error('failed');
          c.querySelector('.gc-waitlist').classList.remove('open');
          c.querySelector('.gc-waitlist-success').style.display = 'block';
        }).catch(function () { join.textContent = 'Try again'; join.disabled = false; });
      });
    });
  }

  window.VEGuideCatalog = { GUIDES: GUIDES, render: render };
})();
