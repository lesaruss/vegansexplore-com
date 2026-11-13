/* The Food Photographer Guide (outline locked by Sean 2026-11-13: "lock it, yes"; playbook ve-front-of-house, canon canon-ve-front-of-house
 * photo_standard and sales_route_v16 talent). Sean, 2026-11-13: "Let's show them exactly what we want and help them become better food
 * photographers. If we can tell them the exact settings to put their camera on, when to shoot, what to look for... Let's create the demand."
 * Built on the Explorer Guide's files through its first copy (template gate: passport.html?guide=welcome, guide-scripts/welcome-guide.js,
 * mocks/nominate/guide.js): head, crumb, the Getting started card, artRow, the .vxc call to action, the rail's Back / N of M / Next.
 * Kai hosts (the Creator Guide). Her lines are text drafts until Sean approves them; nothing is recorded, so there is no Play.
 * Every picture is Green Leaf Kitchen, our sample restaurant, kept whole and stamped Sample (public/guides/food-photo/).
 *
 *   #/          Overview            #/light     Light and when to shoot
 *   #/standard  What good looks like  #/angles  The two angles
 *   #/phone     Your phone          #/plating   Plating and drinks
 *   #/camera    Your camera         #/space     The space and the people
 *   #/deliver   Delivering          #/paid      Get paid
 */
(function () {
  var PIC = '/public/guides/food-photo/';
  var CSS = [
    '.nm-mock{margin:0;background:#FFF7EC;color:#5a3a00;border-bottom:1px solid #f5d9b0;font-size:12px;font-weight:600;padding:8px 40px;}',
    '.nm-mock b{font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#b45309;border:2px solid #b45309;border-radius:6px;padding:1px 7px;margin-right:8px;}',
    '.dg-joinbox a.dg-btn{text-decoration:none;}',
    '.fp-set{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(220px,100%),1fr));gap:10px;margin:14px 0 4px;}',
    '.fp-set div{border:1px solid var(--line);border-radius:10px;padding:12px 14px;background:#fff;}',
    '.fp-set b{display:block;font-size:20px;font-weight:900;color:var(--ink);}',
    '.fp-set small{display:block;font-size:12.5px;line-height:1.45;color:var(--ink75);margin-top:2px;}',
    '@media (max-width:900px){.nm-mock{padding:8px 16px;}}'
  ].join('');
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pic(p) { return PIC + p; }
  function art(slug) { return window.VEGuideArt ? VEGuideArt(slug, 'square') : ''; }

  // ---------- content (the outline Sean locked, in order) ----------
  var TABS = [
    { k: 'overview', label: 'Overview', say: 'Hi, I\'m Kai. Restaurants want photos that make people hungry. This Guide shows you exactly how we shoot them, and how to get paid for it.' },
    { k: 'standard', label: 'What Good Looks Like', say: 'Start here. This is the standard every shoot is held to. Learn to see it, and the rest gets easy.' },
    { k: 'phone', label: 'Your Phone', say: 'Your phone is enough to start. Five settings, and your photos already look better.' },
    { k: 'camera', label: 'Your Camera', say: 'Have a camera? Here is where to start. Then adjust from there.' },
    { k: 'light', label: 'Light and When to Shoot', say: 'Light is everything. Learn where to put the plate and when to shoot, and you are halfway there.' },
    { k: 'angles', label: 'The Two Angles', say: 'Two angles for every dish. Same surface, same light, every time.' },
    { k: 'plating', label: 'Plating and Drinks', say: 'Shoot it the way it leaves the kitchen, and shoot it fast. Here is what to fix before you press the button.' },
    { k: 'space', label: 'The Space and the People', say: 'People want to see where they will sit and who will feed them. Here is the shot list for the room.' },
    { k: 'deliver', label: 'Delivering', say: 'Great photos still need to land right. Here is exactly how to deliver them.' },
    { k: 'paid', label: 'Get Paid', say: 'Ready? Here is how you go from learning this to getting paid for it.' }
  ];
  var SUMMARY = {
    standard: 'The one standard every shoot is held to, shown on our sample restaurant.',
    phone: 'Five phone settings that make your food photos look better today.',
    camera: 'Where to start with a camera: aperture, ISO, shutter and white balance.',
    light: 'Where to put the plate, when to shoot, and how to soften the light.',
    angles: 'Three-quarter and overhead, on the same surface for every dish.',
    plating: 'Shoot it as it leaves the kitchen, clean, fast, with drinks lit from behind.',
    space: 'Outside by day and dusk, the room, the counter, the details and the team.',
    deliver: 'Three shapes, full size, named right and uploaded to the shot list.',
    paid: 'A $75 paid trial of three dishes, then booked shoots in your city.'
  };
  var THUMB = { standard: 'standard.jpg', phone: 'toast.jpg', camera: 'noodles.jpg', light: 'window.jpg', angles: 'angle-top.jpg', plating: 'plate.jpg', space: 'space-wide.jpg', deliver: 'surface.jpg', paid: 'team.jpg' };
  var GROUPS = [
    { label: 'Learn the Standard', kids: ['standard', 'phone', 'camera', 'light', 'angles'] },
    { label: 'Shoot and Get Paid', kids: ['plating', 'space', 'deliver', 'paid'] }
  ];
  var JOB = '/gigs#board';

  // ---------- shared pieces, from welcome-guide.js ----------
  var main = document.getElementById('dgMain');
  var menuEl = document.getElementById('dgMenu'), menuSel = document.getElementById('dgMenuSelect');
  var bubble = document.getElementById('dgBubble'), tourEl = document.getElementById('dgTour'), tourM = document.getElementById('dgTourM');
  var foldBtn = document.getElementById('dgFold'), railEl = document.getElementById('dgRail');
  var curTab = 'overview';
  function tab(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i].k === k) return TABS[i]; return TABS[0]; }
  function href(k) { return '#/' + (k === 'overview' ? '' : k); }
  function head(k, h) { return '<div class="dg-head"><div><div class="dg-k">' + esc(k) + '</div><h2 class="dg-h1">' + esc(h) + '</h2></div></div>'; }
  function crumb(label) { return '<div class="dg-crumb"><a href="#/">The Food Photographer Guide</a> &rsaquo; ' + esc(label) + '</div>'; }
  function artRow(picUrl, title, txt, link, more) {
    if (!link) return '<li class="wg-art"><span class="wg-art-img" style="background-image:url(&quot;' + esc(picUrl) + '&quot;)"></span><div><span class="wg-art-t">' + esc(title) + '</span><p>' + esc(txt) + '</p></div></li>';
    return '<li class="wg-art"><a href="' + esc(link) + '" tabindex="-1" aria-hidden="true"><span class="wg-art-img" style="background-image:url(&quot;' + esc(picUrl) + '&quot;)"></span></a>' +
      '<div><a class="wg-art-t" href="' + esc(link) + '">' + esc(title) + '</a><p>' + esc(txt) + '</p><a class="wg-art-more" href="' + esc(link) + '">' + esc(more || 'Read more') + ' &rsaquo;</a></div></li>';
  }
  function cta(k, title, text, go) {
    if (window.VEExplorerCard) VEExplorerCard.html({}); // loads the card's styles, as welcome-guide.js does
    return '<section class="vxc" aria-label="' + esc(go[0]) + '"><div class="vxc-b"><div class="vxc-k">' + esc(k) + '</div><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p></div>' +
      '<a class="vxc-go" href="' + esc(go[1]) + '">' + esc(go[0]) + '</a></section>';
  }
  // A section page in the Welcome Guide's shape: how to use this page, the parts as rows, one call to action.
  function sectionPage(k, o) {
    var start = '<section class="wg-gs" aria-label="How to use this page"><span class="wg-gs-pic"><img src="' + pic(o.pic) + '" alt="" decoding="async" width="640" height="640"></span>' +
      '<div class="wg-gs-b"><div class="vgi-k">How to use this page</div><h3 class="wg-gs-t">' + esc(o.title) + '</h3><p>' + o.how + '</p>' + (o.extra || '') +
      '<div class="wg-gs-btns"><a class="dg-btn" href="' + esc(o.go[1]) + '">' + esc(o.go[0]) + '</a></div></div></section>';
    return crumb(tab(k).label) + head(o.kicker, tab(k).label) + start +
      (o.parts && o.parts.length ? '<div class="wg-arts"><div class="wg-grp"><h5>' + esc(o.group) + '</h5><ol>' + o.parts.map(function (x) { return artRow(pic(x[0]), x[1], x[2]); }).join('') + '</ol></div></div>' : '') +
      cta('See it for yourself', o.ctaTitle, o.ctaText, o.go);
  }
  function settings(rows) { return '<div class="fp-set">' + rows.map(function (r) { return '<div><b>' + esc(r[0]) + '</b><small>' + esc(r[1]) + '</small></div>'; }).join('') + '</div>'; }
  function nextOf(k) { var i = TABS.indexOf(tab(k)); var n = TABS[Math.min(TABS.length - 1, i + 1)]; return ['Next: ' + n.label, href(n.k)]; }

  var VIEWS = {
    overview: function () {
      return head('Free for everyone', 'Shoot Food People Want to Eat') +
        '<section class="wg-gs" aria-label="Getting started"><span class="wg-gs-pic"><img src="' + pic('standard.jpg') + '" alt="" decoding="async" width="640" height="640"></span>' +
        '<div class="wg-gs-b"><div class="vgi-k">Getting started</div><h3 class="wg-gs-t">How to use this page</h3>' +
        '<p><b>This Guide teaches the one standard we shoot restaurants to,</b> with the exact settings, light and angles, using your phone or a camera. Read it in order, practice on your next meal, then take the paid trial and join the photographers we book.</p>' +
        '<div class="wg-gs-btns"><a class="dg-btn" href="#/standard">Start with the standard</a><a class="dg-btn dg-ghost" href="#/paid">How you get paid</a></div></div></section>' +
        '<div class="wg-arts wg-arts-ov">' + GROUPS.map(function (g) {
          return '<div class="wg-grp"><h5>' + esc(g.label) + '</h5><ol>' + g.kids.map(function (k) { return artRow(pic(THUMB[k]), tab(k).label, SUMMARY[k], href(k), 'Read more'); }).join('') + '</ol></div>';
        }).join('') + '</div>';
    },
    standard: function () {
      return sectionPage('standard', { kicker: 'Learn the standard', title: 'One standard, every shoot', pic: 'standard.jpg', group: 'What every shoot has',
        how: '<b>Everything below is what a finished shoot looks like.</b> The pictures are Green Leaf Kitchen, our sample restaurant. Look at them closely: the same table, the same light, the same two angles. That sameness is what makes a menu look like one place.',
        go: ['See the sample shoot', 'https://vegansexplore.com/business/sample/shoot'], ctaTitle: 'See the whole sample shoot.', ctaText: 'Every dish and every shot of the space, the way a client gets them.',
        parts: [
          ['surface.jpg', 'Same Surface, Same Light', 'Every dish on the same table, by the same window, so the whole menu reads as one restaurant.'],
          ['angle-34.jpg', 'Two Angles Every Dish', 'A three-quarter shot and an overhead shot of each dish, framed the same way each time.'],
          ['plate.jpg', 'Plated as Served', 'What the customer gets, cleaned up and garnished. Nothing added that is not on the menu.'],
          ['space-wide.jpg', 'The Space Too', 'Outside, the room, the counter and the details, so people can picture walking in.'],
          ['team.jpg', 'The People Behind It', 'The owner and the team, with their OK. People choose places run by people they like.']
        ] });
    },
    phone: function () {
      return sectionPage('phone', { kicker: 'Learn the standard', title: 'Five settings, better photos today', pic: 'toast.jpg', group: 'Set your phone once',
        how: '<b>Change these once and leave them.</b> Wipe the lens with a soft cloth before every shoot; a smudge blurs more food photos than anything else.',
        extra: settings([['Grid on', 'iPhone: Settings, Camera, Grid. Android: camera settings, Grid lines.'], ['Flash off', 'Always. Flash flattens food and makes it shine in the wrong places.'], ['1x lens', 'Not the wide 0.5x. Step back and use 1x or 2x so plates keep their shape.'], ['Lock focus and exposure', 'Tap and hold on the food until you see the lock, then slide a little darker.'], ['Portrait mode off', 'No portrait blur, no filters, full resolution. We edit later, lightly.']]),
        go: nextOf('phone'), ctaTitle: 'Try it on your next meal.', ctaText: 'Five settings, one window, one plate. Then come back and learn the light.',
        parts: [] });
    },
    camera: function () {
      return sectionPage('camera', { kicker: 'Learn the standard', title: 'A starting point, then adjust', pic: 'noodles.jpg', group: 'Where to start',
        how: '<b>These are starting settings, not rules.</b> Set them, take a test shot, look at it big, then adjust one thing at a time.',
        extra: settings([['f/4 to f/8', 'Enough of the dish in focus. Use f/2.8 only for a single detail shot.'], ['ISO 100 to 400', 'As low as the light allows, for clean shadows.'], ['1/125 or faster', 'Handheld. Slower than that, use a tripod.'], ['Daylight white balance', 'Or set it from a gray card, so whites stay white.'], ['RAW and JPEG', 'RAW for editing, JPEG to check on the spot.']]),
        go: nextOf('camera'), ctaTitle: 'Set it, test it, adjust it.', ctaText: 'One test shot, one change at a time. Then on to light.',
        parts: [] });
    },
    light: function () {
      return sectionPage('light', { kicker: 'Learn the standard', title: 'Where to put the plate, when to shoot', pic: 'window.jpg', group: 'Light, step by step',
        how: '<b>Find the biggest window in the room and put the table beside it.</b> Turn off the lights overhead. Shoot before service starts or between lunch and dinner, when the room is quiet and the light is steady.',
        go: nextOf('light'), ctaTitle: 'Find your window.', ctaText: 'One window, overhead lights off, a white card to fill. That is the setup.',
        parts: [
          ['window.jpg', 'Window Light, From the Side', 'Light from the side or slightly behind the plate gives food shape and texture.'],
          ['banquette.jpg', 'Overhead Lights Off', 'Mixed light turns food yellow on one side and blue on the other. Window only.'],
          ['surface.jpg', 'Soften Hard Sun', 'Direct sun makes harsh shadows. Hang a sheer curtain or a diffuser in the window.'],
          ['plate.jpg', 'Fill With a White Card', 'A white card or foam board opposite the window lifts the dark side of the plate.'],
          ['space-dusk.jpg', 'Outside at Dusk', 'For the building, shoot 15 to 30 minutes after sunset with every light on.']
        ] });
    },
    angles: function () {
      return sectionPage('angles', { kicker: 'Learn the standard', title: 'Two angles, every dish', pic: 'angle-top.jpg', group: 'The two angles',
        how: '<b>Every dish gets both angles, on the same surface, from the same distance.</b> Leave a little room around the plate so it fits all three shapes we deliver.',
        go: nextOf('angles'), ctaTitle: 'Shoot both angles.', ctaText: 'One plate, two angles, same table. Then learn to make the plate ready.',
        parts: [
          ['angle-34.jpg', 'Three-Quarter, About 45 Degrees', 'Best for burgers, sandwiches, stacks and drinks: anything with height.'],
          ['angle-top.jpg', 'Overhead, Straight Down', 'Best for bowls, flat plates and spreads. Keep the phone level with the table.'],
          ['surface.jpg', 'Same Surface, Same Distance', 'Every dish on the same table at the same size, so the menu looks like one place.'],
          ['standard.jpg', 'Leave Room Around It', 'The plate fills most of the frame with room to spare for square, tall and wide.']
        ] });
    },
    plating: function () {
      return sectionPage('plating', { kicker: 'Shoot and get paid', title: 'As it leaves the kitchen, but clean', pic: 'plate.jpg', group: 'Before you press the button',
        how: '<b>Shoot what the customer gets.</b> Ask the kitchen to plate it as they serve it, then fix the small things and shoot right away. Sauces dry, ice melts and steam disappears in minutes.',
        go: nextOf('plating'), ctaTitle: 'Clean it, then shoot it fast.', ctaText: 'Wipe, garnish, shoot. Then the room and the people.',
        parts: [
          ['plate.jpg', 'Plated as Served', 'No extras that are not on the menu. People should get what they see.'],
          ['wrap.jpg', 'Wipe the Rims, Garnish Last', 'Clean drips and crumbs, add the fresh garnish just before you shoot.'],
          ['noodles.jpg', 'Shoot Fast', 'Have the table and light ready before the plate comes out of the kitchen.'],
          ['drink.jpg', 'Drinks: Light From Behind', 'Put the window behind the glass so it glows. Catch the cold drops on the outside.'],
          ['latte.jpg', 'Props: Keep It Simple', 'One napkin, one utensil. No other brands in the frame.']
        ] });
    },
    space: function () {
      return sectionPage('space', { kicker: 'Shoot and get paid', title: 'Where they will sit, who will feed them', pic: 'space-wide.jpg', group: 'The shot list for the room',
        how: '<b>Shoot the space before it fills up.</b> Hold the camera at chest height and keep the walls straight up and down. Ask before photographing anyone, and get customers\' permission in writing.',
        go: nextOf('space'), ctaTitle: 'Walk the room.', ctaText: 'Outside, inside, the counter, the details, the team. Then deliver it right.',
        parts: [
          ['space-day.jpg', 'Outside by Day', 'The front, the entrance and the sign, straight on, in good daylight.'],
          ['space-dusk.jpg', 'Outside at Dusk', 'The same view after sunset with the lights on. It is the shot people remember.'],
          ['space-wide.jpg', 'Inside Wide, From the Corners', 'Chest height, walls straight. Show where people sit.'],
          ['counter.jpg', 'The Counter and the Details', 'The counter or bar, the plants, the menu board: what makes it theirs.'],
          ['owner.jpg', 'The Owner and the Team', 'With their OK. Customers only with written permission.']
        ] });
    },
    deliver: function () {
      return sectionPage('deliver', { kicker: 'Shoot and get paid', title: 'Land it right', pic: 'surface.jpg', group: 'How to deliver',
        how: '<b>A shoot is done when the files are in the shot list,</b> in the right shapes, named so anyone can find them. Edit lightly and honestly.',
        go: nextOf('deliver'), ctaTitle: 'Deliver it right.', ctaText: 'Three shapes, full size, named and uploaded. Then get paid for it.',
        parts: [
          ['standard.jpg', 'Three Shapes, Full Size', 'Every dish in 4:5, 1:1 and 16:9, each made from your full-size photo.'],
          ['surface.jpg', 'JPEG, Big Enough', 'sRGB color, at least 3,000 pixels on the long side.'],
          ['burrito.jpg', 'Name Every File', 'The dish and the angle, like burrito-bowl-overhead.jpg, so nothing gets lost.'],
          ['smoothie.jpg', 'Light Edits Only', 'Exposure, white balance and straightening. No filters, nothing added that is not there.'],
          ['angle-34.jpg', 'Upload to the Shot List', 'Each photo onto its dish in the shot list. Copyright goes to the client.']
        ] });
    },
    paid: function () {
      return sectionPage('paid', { kicker: 'Shoot and get paid', title: 'From learning it to getting paid for it', pic: 'team.jpg', group: 'How it works',
        how: '<b>Restaurants book photo shoots through us, and we book the photographers who meet this standard.</b> Members, creators and students all start the same way: apply, take the paid trial, and join the photographers we book in your city.',
        go: ['See the job', JOB], ctaTitle: 'Ready to get paid for it?', ctaText: 'Apply on the Gig Board. A few people are picked for the paid trial each round.',
        parts: [
          ['angle-34.jpg', 'Apply on the Gig Board', 'A short pitch and two or three food photos. Join free with a short survey to see it.'],
          ['plate.jpg', 'The Paid Trial: $75', 'Three dishes we name, shot to this standard. We tell you what passed and what to fix.'],
          ['surface.jpg', 'Join the Photographers We Book', 'Pass it and we book you for shoots in your city, with the shot list in hand.'],
          ['team.jpg', 'Paid for Every Shoot', 'The pay for each shoot is set and agreed before you are booked.']
        ] });
    }
  };

  // ---------- menu and Kai, from welcome-guide.js ----------
  function drawMenu(cur) {
    menuEl.innerHTML = TABS.map(function (t) { return '<a href="' + href(t.k) + '"' + (t.k === cur ? ' aria-current="page"' : '') + '>' + esc(t.label) + '</a>'; }).join('');
    menuSel.innerHTML = TABS.map(function (t, n) { return '<option value="' + t.k + '"' + (t.k === cur ? ' selected' : '') + '>' + (n + 1) + '. ' + esc(t.label) + '</option>'; }).join('');
  }
  document.documentElement.classList.toggle('dg-dd', TABS.length > 5);
  menuSel.addEventListener('change', function () { location.hash = href(menuSel.value); });
  function setFold(folded) {
    railEl.classList.toggle('dg-folded', folded);
    foldBtn.textContent = folded ? 'Show Kai' : 'Hide Kai'; foldBtn.setAttribute('aria-expanded', String(!folded));
  }
  foldBtn.addEventListener('click', function () { setFold(!railEl.classList.contains('dg-folded')); });
  // Kai's picture: her square art on every page until each page's own scene is drawn with the locked scene recipe (before this goes live).
  function drawKai() {
    var t = tab(curTab), i = TABS.indexOf(t);
    bubble.textContent = t.say;
    var box = document.getElementById('dgMaya'), a = art('kai');
    if (a) box.style.backgroundImage = "url('" + a + "')";
    tourEl.innerHTML = tourM.innerHTML = '<a class="dg-tnav" href="' + href(TABS[Math.max(0, i - 1)].k) + '"' + (i ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Back</a><span>' + (i + 1) + ' of ' + TABS.length + '</span>' +
      '<a class="dg-tnav next" href="' + href(TABS[Math.min(TABS.length - 1, i + 1)].k) + '"' + (i < TABS.length - 1 ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Next</a>';
  }
  function route() {
    var k = (location.hash.replace(/^#\/?/, '') || 'overview').split(/[?\/]/)[0] || 'overview';
    if (!VIEWS[k]) k = 'overview';
    curTab = k;
    main.innerHTML = VIEWS[k]();
    drawMenu(curTab); drawKai();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  tourM.addEventListener('click', function (e) { if (e.target.closest('.dg-tnav')) setTimeout(function () { railEl.scrollIntoView({ block: 'start' }); }, 0); });
  function start() { if (!window.VEGuideArt) return setTimeout(start, 60); route(); }
  start();
})();
