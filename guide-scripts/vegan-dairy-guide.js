/* The Vegan Dairy Guide: a mini website on all things dairy (Sean, 2026-10-07).
 *
 * One page, a menu that is always there, and one search bar across everything. The address
 * bar carries the view (#/brands/milk, #/swaps, #/search/oat) so Back works and links open
 * the same place.
 *
 *   Home        tiles into every section, the Why preview, and Maya (the Guide) on the right
 *   Why         six sourced facts (three public, three with membership)
 *   Brands      Directory listings tagged vegan-dairy-guide (category Food Brands), each with its
 *               products in listings.details.dairy_guide; filter by product, sort, vote (ve-votes)
 *   Swaps       how to replace each dairy item, from the shelf or the pantry; filter and search
 *   Recipes     make it at home
 *   Cookbooks   Directory listings tagged dairy-guide-book (category Books), plus two resources
 *   See for yourself   how milk is made, behind a warning
 *
 * Access: the Guide comes with the $11 Founding Membership. Home and the Why preview are open
 * to everyone. The members-only text (Why 4-6, See for yourself, swaps, recipes, resources) is
 * ve_guides.content_html for slug vegan-dairy-guide-site, handed out by ve-guide-unlock ?action=open
 * only to active members. Never add it back to this repo: Vercel serves it, so anything here is
 * public. Joining reuses VEAuth.showAuthModal and the Founding Membership window
 * (ve-entry-checkout); checkout returns with ?activate=success and the page re-checks.
 * To add a brand or a cookbook: list it in the Directory with the tag; it shows up here.
 */
(function () {
  var SLUG = 'vegan-dairy-guide-site'; // ve_guides row for this version (the slide version used vegan-dairy-guide)
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var UNLOCK_URL = SB + '/functions/v1/ve-guide-unlock';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var LISTING_FIELDS = 'id,slug,name,initials,color,vote_count,website,vegan_status,details';
  var BRANDS_URL = SB + '/rest/v1/listings?select=' + LISTING_FIELDS + '&status=eq.approved&category=eq.Food%20Brands&tags=cs.%7Bvegan-dairy-guide%7D';
  var BOOKS_URL = SB + '/rest/v1/listings?select=' + LISTING_FIELDS + '&status=eq.approved&category=eq.Books&tags=cs.%7Bdairy-guide-book%7D';
  var CATS = ['Milk', 'Coffee Creamer', 'Butter', 'Cheese Slices', 'Cheese Spreads', 'Shredded Cheese', 'Parmesan', 'Sour Cream', 'Feta', 'Cream Cheese', 'Yogurt', 'Ice Cream'];
  var SWAP_GROUPS = ['Milk & cream', 'Butter', 'Cheese', 'Yogurt & sour cream'];
  var MENU = [
    ['home', 'Home'], ['why', 'Why dairy-free'], ['brands', 'Brands'], ['swaps', 'Swaps'],
    ['cookbook', 'Cookbook'], ['look', 'See for yourself']
  ];
  var LOCKED = { brands: 1, swaps: 1, cookbook: 1, look: 1 };
  // Pantry ingredients for "What can I make?": each matches recipe and swap text.
  var PANTRY = [
    ['Cashews', /cashew/i], ['Soy milk', /soy milk/i], ['Plant milk', /plant milk/i], ['Coconut milk or cream', /coconut (milk|cream)/i],
    ['Coconut oil', /coconut oil/i], ['Lemon juice', /lemon/i], ['Vinegar', /vinegar/i], ['Nutritional yeast', /nutritional yeast/i],
    ['Tofu', /tofu/i], ['Raw nuts', /raw nuts|almond/i], ['Potatoes and carrots', /potato|carrot/i], ['Bananas', /banana/i],
    ['Dates', /dates/i], ['Chickpeas (aquafaba)', /aquafaba|chickpea/i]
  ];

  var ICON = {
    brands: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1f5f22" stroke-width="1.8" stroke-linejoin="round"><path d="M8 2h8l-1 3h-6z"/><path d="M9 5h6l3 4v12a1 1 0 01-1 1H7a1 1 0 01-1-1V9z"/><path d="M6 12h12"/></svg>',
    swaps: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1f5f22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13l-3-3"/><path d="M20 16H7l3 3"/></svg>',
    recipes: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1f5f22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h18a8 8 0 01-8 8h-2a8 8 0 01-8-8z"/><path d="M8 7c0-1.5 1-2 1-3M12 7c0-1.5 1-2 1-3M16 7c0-1.5 1-2 1-3"/></svg>',
    cookbook: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1f5f22" stroke-width="1.8" stroke-linejoin="round"><path d="M4 4h6a2 2 0 012 2v14a2 2 0 00-2-2H4z"/><path d="M20 4h-6a2 2 0 00-2 2v14a2 2 0 012-2h6z"/></svg>',
    books: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1f5f22" stroke-width="1.8" stroke-linejoin="round"><path d="M4 4h6a2 2 0 012 2v14a2 2 0 00-2-2H4z"/><path d="M20 4h-6a2 2 0 00-2 2v14a2 2 0 012-2h6z"/></svg>',
    why: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1f5f22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l7-7"/></svg>',
    look: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#8a5a00" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>'
  };

  var main = document.getElementById('dgMain'), wrap = document.getElementById('dgWrap');
  var menuEl = document.getElementById('dgMenu'), menuSel = document.getElementById('dgMenuSelect');
  var qEl = document.getElementById('dgQ');
  var homeHTML = main.querySelector('[data-view="home"]').outerHTML;
  var PUB = JSON.parse(document.getElementById('dg-public').textContent);

  var access = 'checking';       // checking | guest | pending | member
  var MEM = null;                // members-only payload
  var BRANDS = null, BOOKS = null;
  var lookOpen = false;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function slugify(s) { return String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function catBySlug(s) { for (var i = 0; i < CATS.length; i++) if (slugify(CATS[i]) === s) return CATS[i]; return null; }
  function groupBySlug(s) { for (var i = 0; i < SWAP_GROUPS.length; i++) if (slugify(SWAP_GROUPS[i]) === s) return SWAP_GROUPS[i]; return null; }
  function auth() { return window.VEAuth || null; }
  function sources(list) { return list && list.length ? '<span class="dg-src">' + list.map(function (s) { return '<a href="' + esc(s[1]) + '" target="_blank" rel="noopener">' + esc(s[0]) + '</a>'; }).join('') + '</span>' : ''; }

  // ---------- menu ----------
  function drawMenu(cur) {
    var locked = access !== 'member';
    menuEl.innerHTML = MENU.map(function (m) {
      return '<a href="#/' + (m[0] === 'home' ? '' : m[0]) + '"' + (m[0] === cur ? ' aria-current="page"' : '') + '>' + esc(m[1]) +
        (locked && LOCKED[m[0]] ? ' <svg class="dg-lk" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-label="with membership"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>' : '') + '</a>';
    }).join('');
    menuSel.innerHTML = MENU.map(function (m) { return '<option value="' + m[0] + '"' + (m[0] === cur ? ' selected' : '') + '>' + esc(m[1]) + (locked && LOCKED[m[0]] ? ' (members)' : '') + '</option>'; }).join('') +
      (cur === 'search' ? '<option value="search" selected>Search results</option>' : '');
  }
  menuSel.addEventListener('change', function () { location.hash = '#/' + (menuSel.value === 'home' ? '' : menuSel.value); });

  // ---------- pieces ----------
  function crumb(parts) {
    return '<div class="dg-crumb"><a href="#/">Dairy Guide</a>' + parts.map(function (p) { return ' &rsaquo; ' + (p[1] ? '<a href="' + p[1] + '">' + esc(p[0]) + '</a>' : esc(p[0])); }).join('') + '</div>';
  }
  function whyCard(w) { return '<div class="dg-card"><h3>' + esc(w.title) + '</h3><p>' + esc(w.text) + '</p>' + sources(w.sources) + '</div>'; }

  // A locked section shows what is inside before anyone pays (Sean, 2026-10-07: "until they
  // could see something, it's not going to convince them"). Sean, 2026-10-08: each slide is words on
  // the left and a picture on the right; the $11 sits in the header for anyone not yet a member.
  var slideTimer = null;
  var ART_BASE = 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDGnUNmLloVUBJsrfOxR8cZFdv/';
  // Maya scenes for the previews, made in Higgsfield from her current picture (2026-10-08).
  var SCENE = {
    aisle: 'hf_20261008_025717_4bff1ed2-3cc5-4edf-b7c7-3ed9f8b96325_min.webp',
    buttermilk: 'hf_20261008_025718_9798574f-c084-4eab-946d-9070647c9831_min.webp',
    nutmilk: 'hf_20261008_030007_c3e9cfe8-ffac-4c5d-99de-fdde4bc02d58_min.webp',
    pantry: 'hf_20261008_025718_edca8864-2276-49cf-96b6-8e078e620cbb_min.webp',
    chefs: 'hf_20261008_025717_951874f0-e533-4b8f-b777-95ef48aee782_min.webp',
    look: 'hf_20261008_025717_6c7153ba-3515-449d-896a-3dfb9810208e_min.webp',
    why: 'hf_20261008_025717_2cadeb61-373d-4bce-9101-941793bf8c1e_min.webp'
  };
  function scene(k, alt) { return '<img class="dg-pv-img" src="' + ART_BASE + SCENE[k] + '" alt="' + esc(alt) + '" loading="lazy">'; }
  // Example products, label values exactly as the brand reported them to USDA FoodData Central
  // (Branded Foods), shown with FDA label rounding and % Daily Values. Rows a brand did not report are left off.
  var LABELS = [
    { listing: 'oatly', name: 'Oatly Oatmilk', title: 'The milk swap that keeps your calcium', cat: 'Milk', fdc: '2677675', serving: '1 cup (240 mL)', cal: 120,
      line: 'Fortified with calcium and vitamin D: 350 mg of calcium a cup, 27% of the Daily Value.',
      rows: [['Total Fat', '5g', '6%', 0, 1], ['Saturated Fat', '0.5g', '3%', 1], ['Trans Fat', '0g', '', 1], ['Cholesterol', '0mg', '0%', 0, 1], ['Sodium', '100mg', '4%', 0, 1],
        ['Total Carbohydrate', '16g', '6%', 0, 1], ['Dietary Fiber', '2g', '7%', 1], ['Total Sugars', '7g', '', 1], ['Includes 7g Added Sugars', '', '14%', 2], ['Protein', '3g', '', 0, 1, 1],
        ['Vitamin D', '4.8mcg', '24%'], ['Calcium', '350mg', '27%'], ['Iron', '0.3mg', '2%'], ['Potassium', '390mg', '8%']] },
    { listing: 'follow-your-heart', name: 'Follow Your Heart Provolone Style', title: 'Know what you\'re getting', cat: 'Cheese', fdc: '1854452', serving: '1 oz (30g)', cal: 90,
      line: 'Made with coconut oil and potato starch, with 0g of protein a serving, so plan your protein from other foods.',
      rows: [['Total Fat', '7g', '9%', 0, 1], ['Saturated Fat', '6g', '30%', 1], ['Trans Fat', '0g', '', 1], ['Cholesterol', '0mg', '0%', 0, 1], ['Sodium', '270mg', '12%', 0, 1],
        ['Total Carbohydrate', '6g', '2%', 0, 1], ['Dietary Fiber', '0g', '0%', 1], ['Total Sugars', '0g', '', 1], ['Protein', '0g', '', 0, 1, 1], ['Calcium', '0mg', '0%'], ['Iron', '0mg', '0%']] },
    { listing: 'kite-hill', name: 'Kite Hill Plain Cream Cheese', title: 'Cream cheese with 0g saturated fat', cat: 'Cream Cheese', fdc: '2757615', serving: '30g', cal: 70,
      line: 'Made with live cultures, and 0g of saturated fat a serving.',
      rows: [['Total Fat', '6g', '8%', 0, 1], ['Saturated Fat', '0g', '0%', 1], ['Sodium', '200mg', '9%', 0, 1], ['Total Carbohydrate', '2g', '1%', 0, 1], ['Dietary Fiber', '1g', '4%', 1],
        ['Total Sugars', '1g', '', 1], ['Protein', '2g', '', 0, 1, 1]] }
  ];
  function nutLabel(p) {
    return '<div class="dg-nf" role="img" aria-label="Nutrition Facts for ' + esc(p.name) + '"><h4>Nutrition Facts</h4>' +
      '<div class="nf-serv">Serving size <b>' + esc(p.serving) + '</b></div>' +
      '<div class="nf-cal"><span>Calories</span><b>' + p.cal + '</b></div><div class="nf-dvh">% Daily Value*</div>' +
      p.rows.map(function (r) {
        return '<div class="nf-r' + (r[3] === 1 ? ' in' : r[3] === 2 ? ' in2' : '') + (r[5] ? ' thick' : '') + '"><span>' + (r[4] ? '<b>' + esc(r[0]) + '</b> ' : esc(r[0]) + ' ') + esc(r[1]) + '</span><b>' + esc(r[2]) + '</b></div>';
      }).join('') + '</div>';
  }
  function labelSlide(p) {
    var l = null; (BRANDS || []).forEach(function (b) { if (b.slug === p.listing) l = b; });
    var it = l ? (((l.details || {}).dairy_guide || []).filter(function (i) { return i.cat === p.cat || (p.cat === 'Cheese' && /Cheese Slices/.test(i.cat)); })[0] || {}) : {};
    return pv(p.cat, p.title,
      '<p class="dg-pv-name">' + esc(p.name) + '</p>' + (it.base ? '<p><b>Made from</b> ' + esc(it.base.charAt(0).toLowerCase() + it.base.slice(1)) + '. <b>Where</b> ' + esc(it.where) + '.</p>' : '') + '<p>' + esc(p.line) + '</p>' +
      '<div class="dg-pv-src">Label: <a href="https://fdc.nal.usda.gov/food-details/' + p.fdc + '/nutrients" target="_blank" rel="noopener">USDA FoodData Central</a>, as the brand reported it. Recipes change, so check the package.</div>',
      nutLabel(p));
  }
  function voteDemo() {
    var demo = [['Oatly', 'Milk, Coffee Creamer, Ice Cream', 'O', 128, 1], ['Silk', 'Milk, Coffee Creamer, Yogurt', 'S', 96], ['Califia Farms', 'Milk, Coffee Creamer', 'CF', 71]];
    return '<div class="dg-pv-demo" aria-hidden="true"><span class="dg-pv-tag" style="align-self:flex-start">Example</span>' + demo.map(function (d) {
      return '<div class="dg-demo-card' + (d[4] ? ' top' : '') + '"><div class="dg-bhead"><div class="dg-av" style="background:#1f5f22">' + d[2] + '</div><div><div class="dg-bname">' + d[0] + '</div><div class="dg-bcat">' + d[1] + '</div></div></div>' +
        '<div class="dg-bfoot"><span class="vote-count">' + d[3] + '</span><span class="dg-vl">votes</span><span class="dg-demo-vote">' + (d[4] ? 'Voted' : 'Vote') + '</span></div></div>';
    }).join('') + '</div>';
  }
  // The ask comes right after the proof: the last slide of every locked section (panel, 2026-10-08).
  function offerSlide(section) {
    var soft = section === 'swaps' ? ['#/why', 'Read 3 free facts'] : ['#/swaps', 'Try the free swap'];
    var art = window.VEGuideArt ? VEGuideArt('maya', 'square') : '';
    return pv('Founding Membership', 'Going dairy-free is easier together',
      '<p><b>$11 one time:</b> the full Dairy Guide plus the Vegans Explore community: your member dashboard, Directory votes, the Community Board and points.</p>' +
      '<div class="dg-pv-cta"><button type="button" class="dg-btn" data-join>Join for $11</button><a href="' + soft[0] + '">' + soft[1] + '</a></div>' +
      '<p class="dg-pv-src">Already a member? <a href="#" data-signin>Sign in</a> and the Guide opens.</p>',
      art ? '<img class="dg-pv-img" src="' + esc(art) + '" alt="Maya, your Guide" loading="lazy">' : '');
  }
  function pv(k, title, body, art) {
    return '<div class="dg-pv"><div class="dg-pv-txt"><div class="dg-pv-k">' + esc(k) + '</div><h3>' + esc(title) + '</h3>' + body + '</div>' +
      (art ? '<div class="dg-pv-art">' + art + '</div>' : '') + '</div>';
  }
  // Cookbook covers from Open Library, for the four with a cover on file.
  var COVERS = [['Super Easy Vegan Cheese Cookbook', '12087441'], ['One-Hour Dairy-Free Cheese', '9165674'], ['Breaking Up with Dairy', '14849260'], ['Incredible Vegan Ice Cream', '10254059']];
  function previewSlides(section) {
    var b = BRANDS || [], bk = BOOKS || [];
    var ex = PUB.swap_example;
    var exampleSwap = ex ? '<div class="dg-swap dg-pv-card"><h3>' + esc(ex.replace) + '</h3><dl><dt>Shelf</dt><dd>' + esc(ex.shelf) + '</dd><dt>Pantry</dt><dd>' + esc(ex.pantry) + '</dd></dl>' + (ex.tip ? '<div class="dg-tip">' + esc(ex.tip) + '</div>' : '') + '</div>' : '';
    var chips = function (arr) { return '<div class="dg-pv-chips">' + arr.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>'; };
    var S = {
      why: [
        pv('With membership', 'Three more facts, every one sourced', '<p>What the cancer research shows, how plants cover the nutrients, and the planet: each with its studies linked.</p>', scene('why', 'Maya reading the research at a cafe'))
      ],
      brands: [
        pv('Brands', 'Stop guessing in the dairy aisle', '<p><b>76 products from 43 brands</b>, sorted by what you are replacing: milk, butter, cheese, yogurt, ice cream and more. Every one is in the Vegans Explore Directory, with where to buy it.</p>' + chips(CATS), scene('aisle', 'Maya in the dairy-free aisle with oat milk and plant cheese'))
      ].concat(b.length ? LABELS.map(labelSlide) : []).concat([
        pv('Vote', 'You decide what tops this list', '<p>Members vote once a day for the products they love, so the list sorts itself by what people actually buy again.</p>', voteDemo())
      ]),
      swaps: [
        pv('Free example', 'Try one tonight: Buttermilk, free', exampleSwap, scene('buttermilk', 'Maya making dairy-free buttermilk with soy milk and lemon')),
        pv('16 swaps', 'Replace anything dairy', '<p>From the shelf, or from what is already in your pantry. Search them, or browse by milk and cream, butter, cheese, and yogurt and sour cream.</p>',
          '<div class="dg-pv-swaps">' + ['Milk', 'Butter', 'Heavy cream', 'Whipped cream', 'Sour cream', 'Cream cheese', 'Parmesan', 'Cheese sauce', 'Ricotta', 'Ghee'].map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>')
      ],
      cookbook: [
        pv('Recipes', 'Miss cheese? Make it at home', '<p>Nut milk, ice cream, and dairy-free staples you can make from your pantry: sour cream, cream cheese, parmesan, ricotta and more.</p>' + chips(['Nut milk', 'Banana ice cream', 'Cashew sour cream', 'Cashew cream cheese', 'Potato cheese sauce', 'Tofu ricotta']), scene('nutmilk', 'Maya pouring homemade almond milk')),
        pv('What can I make?', 'Start from what you have', '<p>Tick what is in your kitchen and the Cookbook shows what you can make right now.</p>' + chips(PANTRY.slice(0, 8).map(function (p) { return p[0]; })), scene('pantry', 'Maya at her pantry with cashews, tofu, a lemon and potatoes')),
        pv('Cookbooks', bk.length ? bk.length + ' cookbooks' : 'Cookbooks', '<p>The best dairy-free cookbooks, voted on by members.</p>' + chips(bk.slice(0, 6).map(function (l) { return ((l.details || {}).dairy_guide_book || {}).title || l.name; })),
          '<div class="dg-pv-books">' + COVERS.map(function (c) { return '<img src="https://covers.openlibrary.org/b/id/' + c[1] + '-M.jpg" alt="' + esc(c[0]) + ' cover" loading="lazy">'; }).join('') + '</div>'),
        pv('Chefs', 'Chefs: get featured here', '<p>Cook dairy-free? Share your recipes in the Cookbook and get a profile linked to what you offer. <a href="/partners">Get featured</a></p>', scene('chefs', 'Maya and Pascal cooking a dairy-free cheese sauce'))
      ],
      look: [
        pv('See for yourself', 'When you\'re ready, the plain facts', '<p>Plain facts from USDA and dairy-industry sources about how milk is produced on US farms. No graphic images, and always behind a clear warning.</p>', scene('look', 'Maya at a sanctuary fence with a cow and her calf'))
      ],
      search: [pv('Search', 'Search all of it', '<p>Members search every brand, swap, recipe and cookbook at once.</p>')]
    };
    var list = (S[section] || S.search).filter(Boolean);
    return S[section] ? list.concat([offerSlide(section)]) : list;
  }
  function lockPanel(section) {
    var slides = previewSlides(section);
    return '<div class="dg-lock2">' +
      '<div class="dg-show" data-show><div class="dg-show-track">' + slides.map(function (s, i) { return '<div class="dg-show-slide' + (i ? '' : ' on') + '" aria-hidden="' + (i ? 'true' : 'false') + '">' + s + '</div>'; }).join('') + '</div>' +
      (slides.length > 1 ? '<div class="dg-show-nav"><button type="button" class="dg-show-b" data-show-go="-1" aria-label="Previous">&lsaquo;</button><div class="dg-show-dots">' + slides.map(function (s, i) { return '<button type="button" data-show-to="' + i + '"' + (i ? '' : ' class="on"') + ' aria-label="Slide ' + (i + 1) + '"></button>'; }).join('') + '</div><button type="button" class="dg-show-b" data-show-go="1" aria-label="Next">&rsaquo;</button></div>' : '') +
      '</div></div>';
  }
  function startShow() {
    clearInterval(slideTimer);
    var show = main.querySelector('[data-show]'); if (!show) return;
    var slides = show.querySelectorAll('.dg-show-slide'), dots = show.querySelectorAll('[data-show-to]'), cur = 0, paused = false;
    function go(n) {
      cur = (n + slides.length) % slides.length;
      [].forEach.call(slides, function (s, i) { s.classList.toggle('on', i === cur); s.setAttribute('aria-hidden', i === cur ? 'false' : 'true'); });
      [].forEach.call(dots, function (d, i) { d.classList.toggle('on', i === cur); });
    }
    show.addEventListener('click', function (e) {
      var g = e.target.closest('[data-show-go]'), to = e.target.closest('[data-show-to]');
      if (g) go(cur + +g.getAttribute('data-show-go')); else if (to) go(+to.getAttribute('data-show-to'));
    });
    // No autoplay (panel, 2026-10-08): a Nutrition Facts label needs reading time.
  }

  function brandCard(l, cat) {
    var items = (l.details && l.details.dairy_guide) || [];
    var shown = cat ? items.filter(function (i) { return i.cat === cat; }) : items;
    var it = shown[0] || {};
    var cats = items.map(function (i) { return i.cat; });
    var lines = cat
      ? '<div class="dg-line"><b>Made from</b> ' + esc(it.base) + '</div><div class="dg-line"><b>Where</b> ' + esc(it.where) + '</div>' + (it.note ? '<div class="dg-note">' + esc(it.note) + '</div>' : '')
      : '<div class="dg-line"><b>Makes</b> ' + esc(cats.join(', ')) + '</div><div class="dg-line"><b>Made from</b> ' + esc(ingredients(items)) + '</div>';
    return '<div class="rank-card" data-votes="' + (l.vote_count || 0) + '">' +
      '<div class="dg-bhead"><div class="dg-av" style="background:' + esc(l.color || '#1f5f22') + '">' + esc(l.initials || l.name.charAt(0)) + '</div>' +
      '<div><div class="dg-bname">' + esc(l.name) + '</div><div class="dg-bcat">' + esc(cat || (cats.length + (cats.length === 1 ? ' product' : ' products'))) + '</div></div></div>' + lines +
      '<div class="dg-bfoot"><span class="vote-count">' + (l.vote_count || 0).toLocaleString() + '</span><span class="dg-vl">votes</span>' +
      '<button type="button" class="vote-btn" data-listing-id="' + esc(l.id) + '">Vote</button>' +
      '<a class="dg-listing" href="/directory/' + encodeURIComponent(l.slug) + '">Listing &rsaquo;</a></div></div>';
  }
  // Each ingredient once across a brand's products: "Almond milk, coconut", not "Almond milk; Almond milk, coconut".
  function ingredients(items) {
    var seen = {}, out = [];
    items.forEach(function (i) {
      String(i.base || '').split(/[,;]/).forEach(function (w) {
        w = w.trim(); var k = w.toLowerCase();
        if (w && !seen[k]) { seen[k] = 1; out.push(out.length ? w.charAt(0).toLowerCase() + w.slice(1) : w); }
      });
    });
    return out.join(', ');
  }

  function bookCard(l) {
    var b = (l.details && l.details.dairy_guide_book) || {};
    return '<div class="rank-card" data-votes="' + (l.vote_count || 0) + '"><div class="dg-book"><div class="dg-cover" aria-hidden="true">' + esc(b.title || l.name) + '</div>' +
      '<div><div class="dg-bname">' + esc(b.title || l.name) + '</div><div class="dg-line">' + esc(b.author || '') + '</div>' +
      '<div class="dg-line">' + esc([b.publisher, b.year].filter(Boolean).join(', ')) + '</div><div class="dg-bcat" style="margin-top:4px">' + esc(b.topic || '') + '</div>' +
      (b.note ? '<div class="dg-note">' + esc(b.note) + '</div>' : '') + '</div></div>' +
      '<div class="dg-bfoot"><span class="vote-count">' + (l.vote_count || 0).toLocaleString() + '</span><span class="dg-vl">votes</span>' +
      '<button type="button" class="vote-btn" data-listing-id="' + esc(l.id) + '">Vote</button>' +
      '<a class="dg-listing" href="/directory/' + encodeURIComponent(l.slug) + '">Listing &rsaquo;</a></div></div>';
  }

  function swapCard(s) {
    return '<div class="dg-swap"><h3>' + esc(s.replace) + '</h3><dl><dt>Shelf</dt><dd>' + esc(s.shelf) + '</dd><dt>Pantry</dt><dd>' + esc(s.pantry) + '</dd></dl>' +
      (s.tip ? '<div class="dg-tip">' + esc(s.tip) + '</div>' : '') + '</div>';
  }
  function recipeCard(r) {
    return '<div class="dg-card dg-recipe"><h3>' + esc(r.title) + '</h3><div class="dg-bcat">' + esc(r.time) + '</div><ol>' + r.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
      (r.tip ? '<div class="dg-note">Tip: ' + esc(r.tip) + '</div>' : '') + '</div>';
  }

  function sortBy(list, how) {
    return list.slice().sort(function (a, b) { return how === 'az' ? a.name.localeCompare(b.name) : (b.vote_count || 0) - (a.vote_count || 0) || a.name.localeCompare(b.name); });
  }
  var sortPref = 'votes';

  // ---------- views ----------
  function viewHome() {
    var tiles = [
      ['brands', 'Brands', '76 products from 43 brands, sorted by what you are replacing.'],
      ['swaps', 'Swaps', '16 ways to replace dairy when you cook.'],
      ['why', 'Why dairy-free', 'What the research says, with sources.'],
      ['cookbook', 'Cookbook', 'Recipes, cookbooks, chefs, and what you can make from your pantry.'],
      ['look', 'See for yourself', 'How milk is made. Optional.']
    ];
    main.innerHTML = homeHTML;
    document.getElementById('dgTiles').innerHTML = tiles.map(function (t) {
      return '<a class="dg-tile' + (t[0] === 'look' ? ' dg-warm' : '') + '" href="#/' + t[0] + '"><div class="dg-ic">' + ICON[t[0]] + '</div><div><b>' + esc(t[1]) + '</b><span>' + esc(t[2]) +
        (access !== 'member' && LOCKED[t[0]] ? '</span><span class="dg-mlock">With membership' : '') + '</span></div></a>';
    }).join('');
    document.getElementById('dgWhyPreview').innerHTML = PUB.why.map(whyCard).join('');
    if (access === 'member' && BRANDS && BRANDS.length) {
      main.querySelector('[data-view="home"]').insertAdjacentHTML('beforeend',
        '<div class="dg-sec-h"><h2>Most voted brands</h2><a href="#/brands">All brands</a></div><div class="dg-grid">' + sortBy(BRANDS, 'votes').slice(0, 4).map(function (l) { return brandCard(l); }).join('') + '</div>');
    }
  }

  function viewWhy() {
    var all = PUB.why.concat(MEM ? MEM.why : []);
    main.innerHTML = crumb([['Why dairy-free']]) + '<h2 class="dg-h1">Why go dairy-free</h2><p class="dg-lede">What the research actually says, with every source linked. Links, not proof, where the research says so.</p>' +
      '<div class="dg-grid dg-3">' + all.map(whyCard).join('') + '</div>' + (MEM ? '' : '<div style="margin-top:26px">' + lockPanel('why') + '</div>');
    startShow();
  }

  function viewBrands(catSlug) {
    var cat = catSlug ? catBySlug(catSlug) : null;
    var head = crumb(cat ? [['Brands', '#/brands'], [cat]] : [['Brands']]) + '<h2 class="dg-h1">' + (cat ? esc(cat) : 'The brands to buy') + '</h2>';
    if (!MEM) { main.innerHTML = head + lockPanel('brands'); startShow(); return; }
    if (!BRANDS) { main.innerHTML = head + '<div class="dg-loading">Loading brands...</div>'; return; }
    var list = cat ? BRANDS.filter(function (l) { return ((l.details && l.details.dairy_guide) || []).some(function (i) { return i.cat === cat; }); }) : BRANDS;
    var chips = '<div class="dg-chips">' + ['All'].concat(CATS).map(function (c) {
      var on = (c === 'All' && !cat) || c === cat;
      return '<a class="dg-chip" aria-pressed="' + on + '" href="#/brands' + (c === 'All' ? '' : '/' + slugify(c)) + '">' + esc(c) + '</a>';
    }).join('') + '</div>';
    main.innerHTML = head + '<p class="dg-lede">Every brand here is in the Vegans Explore Directory. Checked October 2026. Vote once a day for the ones you love.</p>' + chips +
      '<div class="dg-tools"><input type="search" id="dgFilter" placeholder="Filter by name or ingredient (oat, cashew...)" aria-label="Filter brands">' +
      '<select id="dgSort" aria-label="Sort"><option value="votes">Most voted</option><option value="az">A to Z</option></select><span class="dg-count" id="dgCountB"></span></div>' +
      '<div class="dg-grid" id="dgList"></div>';
    var sortEl = document.getElementById('dgSort'), fEl = document.getElementById('dgFilter');
    sortEl.value = sortPref;
    function draw() {
      var q = fEl.value.trim().toLowerCase();
      var rows = sortBy(list, sortPref).filter(function (l) {
        if (!q) return true;
        var hay = (l.name + ' ' + JSON.stringify((l.details && l.details.dairy_guide) || [])).toLowerCase();
        return hay.indexOf(q) >= 0;
      });
      document.getElementById('dgCountB').textContent = rows.length + (rows.length === 1 ? ' brand' : ' brands');
      var listEl = document.getElementById('dgList');
      listEl.innerHTML = rows.map(function (l) { return brandCard(l, cat); }).join('') || '<p class="dg-empty">No match. Try another word.</p>';
      if (window.VEVotes) VEVotes.wire(listEl);
    }
    sortEl.addEventListener('change', function () { sortPref = sortEl.value; draw(); });
    fEl.addEventListener('input', draw);
    draw();
  }

  function viewSwaps(groupSlug) {
    var group = groupSlug ? groupBySlug(groupSlug) : null;
    var head = crumb(group ? [['Swaps', '#/swaps'], [group]] : [['Swaps']]) + '<h2 class="dg-h1">' + (group ? esc(group) : 'Swap it out') + '</h2>';
    if (!MEM) { main.innerHTML = head + lockPanel('swaps'); startShow(); return; }
    var chips = '<div class="dg-chips">' + ['All'].concat(SWAP_GROUPS).map(function (g) {
      var on = (g === 'All' && !group) || g === group;
      return '<a class="dg-chip" aria-pressed="' + on + '" href="#/swaps' + (g === 'All' ? '' : '/' + slugify(g)) + '">' + esc(g) + '</a>';
    }).join('') + '</div>';
    main.innerHTML = head + '<p class="dg-lede">How to replace each dairy item: grab one from the shelf, or make it from what is already in your pantry.</p>' + chips +
      '<div class="dg-tools"><input type="search" id="dgFilter" placeholder="Search swaps (buttermilk, cream cheese...)" aria-label="Search swaps"><span class="dg-count" id="dgCountS"></span></div>' +
      '<div class="dg-grid" id="dgList"></div><div style="margin-top:16px">' + sources(MEM.swap_sources) + '</div>';
    var fEl = document.getElementById('dgFilter');
    function draw() {
      var q = fEl.value.trim().toLowerCase();
      var rows = MEM.swaps.filter(function (s) { return (!group || s.group === group) && (!q || JSON.stringify(s).toLowerCase().indexOf(q) >= 0); });
      document.getElementById('dgCountS').textContent = rows.length + (rows.length === 1 ? ' swap' : ' swaps');
      document.getElementById('dgList').innerHTML = rows.map(swapCard).join('') || '<p class="dg-empty">No match. Try another word.</p>';
    }
    fEl.addEventListener('input', draw);
    draw();
  }

  // The Cookbook (Sean, 2026-10-07): recipes, cookbooks and chefs in one place, plus
  // "What can I make?" from what is already in the kitchen.
  function cookRecipes() {
    var ours = MEM.recipes.map(function (r) { return { title: r.title, from: 'Vegans Explore kitchen', time: r.time, steps: r.steps, tip: r.tip }; });
    var pantry = MEM.swaps.filter(function (s) { return /blend|pulse|simmer|whip|stir|warm|tbsp|cup/i.test(s.pantry) && s.pantry.length > 40; })
      .map(function (s) { return { title: 'Homemade ' + s.replace.toLowerCase().replace(/, (cooking|baking)$/, ''), from: 'From the swap list', time: '', steps: [s.pantry], tip: s.tip }; });
    return ours.concat(pantry);
  }
  var pantryPick = {};
  function viewCookbook(sub) {
    var tabs = [['', 'Recipes'], ['make', 'What can I make?'], ['books', 'Cookbooks'], ['chefs', 'Chefs']];
    var cur = { make: 1, books: 1, chefs: 1 }[sub] ? sub : '';
    var head = crumb(cur ? [['Cookbook', '#/cookbook'], [tabs.filter(function (x) { return x[0] === cur; })[0][1]]] : [['Cookbook']]) + '<h2 class="dg-h1">The Cookbook</h2>';
    if (!MEM) { main.innerHTML = head + '<p class="dg-lede">Recipes, cookbooks and chefs in one place, and a way to cook from what you already have.</p>' + lockPanel('cookbook'); startShow(); return; }
    var tabHtml = '<div class="dg-chips">' + tabs.map(function (x) { return '<a class="dg-chip" aria-pressed="' + (x[0] === cur) + '" href="#/cookbook' + (x[0] ? '/' + x[0] : '') + '">' + esc(x[1]) + '</a>'; }).join('') + '</div>';
    var body = '';
    if (cur === '') {
      body = '<p class="dg-lede">Dairy-free staples you can make at home. Search the whole Guide from the bar at the top.</p><div class="dg-grid">' + cookRecipes().map(function (r) {
        return '<div class="dg-card dg-recipe"><h3>' + esc(r.title) + '</h3><div class="dg-bcat">' + esc(r.from + (r.time ? ' · ' + r.time : '')) + '</div>' +
          (r.steps.length > 1 ? '<ol>' + r.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' : '<p style="margin-top:8px">' + esc(r.steps[0]) + '</p>') +
          (r.tip ? '<div class="dg-note">Tip: ' + esc(r.tip) + '</div>' : '') + '</div>';
      }).join('') + '</div>';
    } else if (cur === 'make') {
      body = '<p class="dg-lede">Tick what you have. Recipes that use the most of it come first.</p><div class="dg-chips" id="dgPantry">' + PANTRY.map(function (p, i) {
        return '<button type="button" class="dg-chip" data-p="' + i + '" aria-pressed="' + !!pantryPick[i] + '">' + esc(p[0]) + '</button>';
      }).join('') + '</div><div class="dg-grid" id="dgMake"></div>';
    } else if (cur === 'books') {
      body = '<p class="dg-lede">Cookbooks from the Vegans Explore Directory, most voted first. Vote for the ones that helped you.</p>' +
        '<div class="dg-tools"><input type="search" id="dgFilter" placeholder="Search cookbooks (cheese, ice cream...)" aria-label="Search cookbooks"><select id="dgSort" aria-label="Sort"><option value="votes">Most voted</option><option value="az">A to Z</option></select></div>' +
        '<div class="dg-grid" id="dgList">' + (BOOKS ? '' : '<div class="dg-loading">Loading cookbooks...</div>') + '</div>' +
        '<div class="dg-sec-h"><h2>Resources</h2></div><div class="dg-grid">' + MEM.resources.map(function (r) {
          return '<div class="dg-card"><h3>' + esc(r.title) + '</h3><p>' + esc(r.text) + '</p>' + sources([[r.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''), r.url]]) + '</div>';
        }).join('') + '</div>';
    } else {
      body = '<div class="dg-chef-empty"><div><h3>Chefs are coming to the Cookbook</h3><p>We are partnering with chefs who specialize in dairy-free cooking. Each one shares recipes here, linked to their profile with their classes, books and services.</p></div>' +
        '<a class="dg-btn" href="/partners">Are you a chef? Get featured</a></div>';
    }
    main.innerHTML = head + tabHtml + body;
    if (cur === 'make') {
      var grid = document.getElementById('dgMake'), all = cookRecipes();
      var draw = function () {
        var picked = Object.keys(pantryPick).filter(function (k) { return pantryPick[k]; }).map(Number);
        if (!picked.length) {
          grid.innerHTML = all.map(function (r) { return '<div class="dg-card dg-recipe"><h3>' + esc(r.title) + '</h3><div class="dg-bcat">' + esc(r.from) + '</div>' + (r.steps.length > 1 ? '<ol>' + r.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' : '<p style="margin-top:8px">' + esc(r.steps[0]) + '</p>') + '</div>'; }).join('');
          return;
        }
        var rows = all.map(function (r) {
          var txt = r.title + ' ' + r.steps.join(' ');
          var uses = picked.filter(function (i) { return PANTRY[i][1].test(txt); });
          return { r: r, uses: uses };
        }).filter(function (x) { return x.uses.length; }).sort(function (a, b) { return b.uses.length - a.uses.length; });
        grid.innerHTML = rows.map(function (x) {
          return '<div class="dg-card dg-recipe"><h3>' + esc(x.r.title) + '</h3><div class="dg-bcat">Uses ' + esc(x.uses.map(function (i) { return PANTRY[i][0].toLowerCase(); }).join(', ')) + '</div>' +
            (x.r.steps.length > 1 ? '<ol>' + x.r.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' : '<p style="margin-top:8px">' + esc(x.r.steps[0]) + '</p>') + '</div>';
        }).join('') || '<p class="dg-empty">Nothing uses those yet. Try adding another ingredient.</p>';
      };
      document.getElementById('dgPantry').addEventListener('click', function (e) {
        var c = e.target.closest('[data-p]'); if (!c) return;
        var i = c.getAttribute('data-p'); pantryPick[i] = !pantryPick[i]; c.setAttribute('aria-pressed', String(!!pantryPick[i])); draw();
      });
      draw();
    }
    if (cur === 'books' && BOOKS) {
      var sortEl = document.getElementById('dgSort'), fEl = document.getElementById('dgFilter');
      sortEl.value = sortPref;
      var drawB = function () {
        var q = fEl.value.trim().toLowerCase();
        var rows = sortBy(BOOKS, sortPref).filter(function (l) { return !q || (l.name + ' ' + JSON.stringify(l.details || {})).toLowerCase().indexOf(q) >= 0; });
        var listEl = document.getElementById('dgList');
        listEl.innerHTML = rows.map(bookCard).join('') || '<p class="dg-empty">No match. Try another word.</p>';
        if (window.VEVotes) VEVotes.wire(listEl);
      };
      sortEl.addEventListener('change', function () { sortPref = sortEl.value; drawB(); });
      fEl.addEventListener('input', drawB);
      drawB();
    }
  }

  function viewLook() {
    var head = crumb([['See for yourself']]) + '<h2 class="dg-h1">See for yourself</h2>';
    if (!MEM) { main.innerHTML = head + lockPanel('look'); startShow(); return; }
    var L = MEM.look;
    if (!lookOpen) {
      main.innerHTML = head + '<div class="dg-door"><p>' + esc(L.door) + '</p><div class="dg-btns"><button type="button" class="dg-btn" id="dgLookGo">Read on</button><a class="dg-btn dg-ghost" href="#/brands">Skip to the brands</a></div></div>';
      document.getElementById('dgLookGo').addEventListener('click', function () { lookOpen = true; viewLook(); });
      return;
    }
    main.innerHTML = head + '<p class="dg-lede">How milk is produced on US dairy farms, in plain facts from USDA and dairy-industry sources.</p><ol class="dg-facts">' +
      L.facts.map(function (f) { return '<li><strong>' + esc(f[0]) + '</strong> ' + esc(f[1]) + '</li>'; }).join('') + '</ol>' + sources(L.sources) +
      '<p class="dg-lede" style="margin-top:18px"><strong>Go further:</strong> ' + esc(L.further) + '</p>';
  }

  // ---------- search ----------
  function index() {
    var out = [];
    PUB.why.concat(MEM ? MEM.why : []).forEach(function (w) { out.push({ t: 'Why dairy-free', title: w.title, text: w.text, href: '#/why' }); });
    if (!MEM) return out;
    (BRANDS || []).forEach(function (l) {
      ((l.details && l.details.dairy_guide) || []).forEach(function (i) {
        out.push({ t: 'Brands', title: l.name + ', ' + i.cat, text: 'Made from ' + i.base + '. Where: ' + i.where + (i.note ? '. ' + i.note : ''), href: '#/brands/' + slugify(i.cat) });
      });
    });
    MEM.swaps.forEach(function (s) { out.push({ t: 'Swaps', title: s.replace, text: 'Shelf: ' + s.shelf + ' Pantry: ' + s.pantry + (s.tip ? ' ' + s.tip : ''), href: '#/swaps/' + slugify(s.group) }); });
    MEM.recipes.forEach(function (r) { out.push({ t: 'Cookbook', title: r.title, text: r.steps.join(' '), href: '#/cookbook' }); });
    (BOOKS || []).forEach(function (l) { var b = (l.details && l.details.dairy_guide_book) || {}; out.push({ t: 'Cookbook', title: b.title || l.name, text: 'Cookbook by ' + [b.author, b.topic].filter(Boolean).join(', '), href: '#/cookbook/books' }); });
    MEM.look.facts.forEach(function (f) { out.push({ t: 'See for yourself', title: f[0], text: f[1], href: '#/look' }); });
    return out;
  }
  function viewSearch(q) {
    if (qEl.value !== q) qEl.value = q;
    var words = q.toLowerCase().split(/\s+/).filter(Boolean);
    var hits = index().filter(function (h) { var hay = (h.title + ' ' + h.text).toLowerCase(); return words.every(function (w) { return hay.indexOf(w) >= 0; }); });
    var groups = {};
    hits.forEach(function (h) { (groups[h.t] = groups[h.t] || []).push(h); });
    var order = ['Brands', 'Swaps', 'Cookbook', 'Why dairy-free', 'See for yourself'];
    var html = crumb([['Search']]) + '<h2 class="dg-h1">' + hits.length + (hits.length === 1 ? ' result' : ' results') + ' for &ldquo;' + esc(q) + '&rdquo;</h2><div class="dg-res">';
    order.forEach(function (g) {
      if (!groups[g]) return;
      html += '<h2>' + esc(g) + ' (' + groups[g].length + ')</h2><div class="dg-grid">' + groups[g].slice(0, 24).map(function (h) {
        return '<a class="dg-card dg-hit" href="' + h.href + '"><h3>' + esc(h.title) + '</h3><p>' + esc(h.text.length > 160 ? h.text.slice(0, 157) + '...' : h.text) + '</p></a>';
      }).join('') + '</div>';
    });
    if (!hits.length) html += '<p class="dg-empty">Nothing matched. Try a brand (Oatly), an item (cream cheese) or an ingredient (cashew).</p>';
    html += '</div>';
    if (!MEM) html += '<div style="margin-top:26px">' + lockPanel('search') + '</div>';
    main.innerHTML = html;
    startShow();
  }
  var tSearch;
  qEl.addEventListener('input', function () {
    clearTimeout(tSearch);
    tSearch = setTimeout(function () {
      var q = qEl.value.trim();
      var h = q ? '#/search/' + encodeURIComponent(q) : '#/';
      if (/^#\/search\//.test(location.hash) && q) history.replaceState(null, '', location.pathname + location.search + h); else location.hash = h;
      route();
    }, 180);
  });
  document.getElementById('dgSearchForm').addEventListener('submit', function (e) { e.preventDefault(); var q = qEl.value.trim(); if (q) location.hash = '#/search/' + encodeURIComponent(q); });

  // ---------- router ----------
  function route() {
    var parts = (location.hash || '').replace(/^#\/?/, '').split('/');
    var view = parts[0] || 'home', sub = parts.slice(1).join('/');
    if (view === 'search' && !sub) view = 'home';
    if (view === 'recipes') view = 'cookbook';
    if (view === 'books') { view = 'cookbook'; sub = 'books'; }
    var known = { home: 1, why: 1, brands: 1, swaps: 1, cookbook: 1, look: 1, search: 1 };
    if (!known[view]) view = 'home';
    clearInterval(slideTimer);
    document.body.classList.toggle('dg-member', access === 'member'); // header: search for members, the $11 box for everyone else
    drawMenu(view);
    wrap.classList.toggle('dg-wide', view !== 'home');
    if (view !== 'search' && qEl.value && document.activeElement !== qEl) qEl.value = '';
    ({ home: viewHome, why: viewWhy, brands: function () { viewBrands(sub); }, swaps: function () { viewSwaps(sub); },
       cookbook: function () { viewCookbook(sub); }, look: viewLook, search: function () { viewSearch(decodeURIComponent(sub)); } })[view]();
    if (view !== 'search') window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  // ---------- access ----------
  function api(action, tok) {
    return fetch(UNLOCK_URL + '?action=' + action, {
      method: 'POST', headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, token: tok || undefined })
    }).then(function (r) { return r.json(); });
  }
  function rest(url) { return fetch(url, { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } }).then(function (r) { return r.json(); }); }
  function becomeMember(html) {
    var t = document.createElement('template'); t.innerHTML = html;
    var el = t.content.getElementById('dg-data');
    MEM = el ? JSON.parse(el.textContent) : null;
    if (!MEM) { access = 'pending'; route(); return; }
    access = 'member';
    route();
  }
  // Brands and cookbooks are public Directory listings, so everyone loads them: members
  // browse them, and the preview slides show real names to everyone else.
  function loadDirectory() {
    Promise.all([rest(BRANDS_URL), rest(BOOKS_URL)]).then(function (r) {
      BRANDS = Array.isArray(r[0]) ? r[0] : []; BOOKS = Array.isArray(r[1]) ? r[1] : [];
      route();
    }).catch(function () { BRANDS = BRANDS || []; BOOKS = BOOKS || []; route(); });
  }
  function setStatus(msg) { [].forEach.call(document.querySelectorAll('.dg-status'), function (e) { e.textContent = msg; }); }

  // Maya's welcome: the play button on her picture and the green button both start it.
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-intro]')) return;
    var box = document.getElementById('dgPortrait'), v = document.getElementById('dgIntro');
    if (!box || !v) return;
    box.classList.add('playing'); v.controls = true;
    v.currentTime = 0; var p = v.play(); if (p && p.catch) p.catch(function () {});
  });
  document.addEventListener('ended', function (e) {
    if (e.target && e.target.id === 'dgIntro') { var box = document.getElementById('dgPortrait'); if (box) box.classList.remove('playing'); e.target.controls = false; }
  }, true);
  document.addEventListener('click', function (e) {
    var a = auth();
    if (e.target.closest('[data-signin]')) {
      e.preventDefault();
      if (a) a.showAuthModal('Sign in and the Dairy Guide opens if you are a member.', function () { location.reload(); }, 'login');
      return;
    }
    if (e.target.closest('[data-join]')) {
      if (!a || access === 'checking') return;
      if (access === 'guest') a.showAuthModal('Create your account. Then become a Founding Member and the Dairy Guide opens.', function () { location.reload(); }, 'signup');
      else a.showActivateModal('The Dairy Guide comes with the $11 Founding Membership, one time. It also opens the full community.');
    }
  });

  function confirmAfterCheckout(tok, tries) {
    setStatus('Confirming your membership...');
    api('open', tok).then(function (d) {
      if (d && d.unlocked && d.html) { becomeMember(d.html); return; }
      if (tries > 0) { setTimeout(function () { confirmAfterCheckout(tok, tries - 1); }, 2500); return; }
      access = 'pending'; route();
      setStatus('Your payment went through. Confirming can take a minute: refresh this page shortly and the Guide opens.');
    }).catch(function () { if (tries > 0) setTimeout(function () { confirmAfterCheckout(tok, tries - 1); }, 2500); else { access = 'pending'; route(); } });
  }

  function init() {
    // Maya on the right, her mid shot (a square spot). Her video waits for the Vegan House pilot.
    var v = document.getElementById('dgPortrait');
    if (window.VEGuideArt) { var art = VEGuideArt('maya', 'square'); if (art) v.style.backgroundImage = "url('" + art + "')"; }

    route();
    loadDirectory();
    var a = auth();
    var viewAs = a && a.getViewAs ? a.getViewAs() : null;
    if (viewAs) { access = viewAs.mode === 'public' ? 'guest' : 'pending'; route(); return; }
    var tok = a && a.isLoggedIn() ? a.getToken() : null;
    if (!tok) { access = 'guest'; route(); return; }

    var params = new URLSearchParams(location.search), back = params.get('activate');
    if (back) { params.delete('activate'); history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash); }
    if (back === 'success') { confirmAfterCheckout(tok, 8); return; }
    api('open', tok).then(function (d) {
      if (d && d.unlocked && d.html) becomeMember(d.html);
      else { access = d && d.loggedIn ? 'pending' : 'guest'; route(); }
    }).catch(function () { access = 'pending'; route(); setStatus('We could not check your membership just now. Refresh to try again.'); });
  }

  if (window.VEAuth) init(); else window.addEventListener('load', init);
})();
