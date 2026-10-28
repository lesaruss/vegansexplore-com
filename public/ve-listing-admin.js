/* Quick listing editor for superadmins (Sean, 2026-09-27), from any city hub card or listing
 * page: rename a listing, change its location, pick its main section and sub-section (and more
 * sub-sections in the same section, like a restaurant that also caters), set how Vegan it is,
 * mark it closed, and, for restaurants and cafes, fill in the At a Glance details (atmosphere,
 * seating, amenities, accessibility, ownership) that Love Life Cafe shows.
 *
 * Logo (Sean, 2026-09-29: "upload the logos directly on the listings"): make one, copy a logo
 * still linked from the business's own site into our storage, or remove it. A logo change saves
 * right away. Upload / Replace the logo opens the logo editor (/public/ve-logo-editor.js; Sean,
 * 2026-10-27: "Can we implement that into the replace logo button?"): drop, paste or link a picture,
 * square it, and Save logo stores it the way Directory review > Logos does (ve-discover add_logo_url,
 * logo_set), so it shows in Logos > Done. Copy and Remove go through ve-media-library as before.
 *
 * What it is comes first (Sean, 2026-10-27: "once you select its media... you don't see anything else. Then based off what
 * you choose, the next part populates"): the section sits under the logo, and the rest shows only what fits that kind of
 * listing (KIND_OF). Media hides How Vegan, Location, Chapters and Locations (it is in every chapter: saving sets Every
 * chapter) and its status reads Active / On hiatus (books and films: Available / No longer available); products and
 * brands hide Locations and read In business / Paused / Out of business; places keep it all. A part that is hidden is not
 * saved, so what the listing already has stays. Nothing but the section shows until a section is picked.
 *
 * Chapters (Sean, 2026-10-24): an organization that covers more than its own city (Florida Animal Rescue
 * Alliance across Florida, PETA everywhere) also shows in the chapters picked here, or in every chapter.
 * Its address stays its headquarters and its home chapter. Saved in listings.communities.
 *
 * Nobody else sees it: the button only renders for a signed-in superadmin (not while
 * previewing the site as someone else), and ve-claims admin_listing checks is_superadmin again.
 *
 *   VEListingAdmin.isAdmin()               true for a signed-in superadmin
 *   VEListingAdmin.edit(listing, onSaved)  opens the editor; onSaved(updatedFields) after a save
 * The listing should carry its full row (the hub loads the rest when the editor opens).
 */
(function () {
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var FN = SB + '/functions/v1/ve-claims';
  var OURS = SB + '/storage/v1/object/public/vegan-media/';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  // Main sections and their sub-sections. Keep in step with CAT_MAP / CAT_CONFIG in
  // /public/ve-region-directory.js and CATEGORIES in supabase/functions/ve-claims.
  var SECTIONS = [
    ['Food', ['Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Food Brands', 'Nutrition & Supplements', 'Markets', 'Catering', 'Meal Prep']],
    ['Products', ['Fitness and Athletics', 'Clothing and Fashion', 'Beauty and Personal Care', 'E-Commerce & Marketplaces']],
    ['Services', ['Health and Wellness', 'Health Professionals', 'Coaches and Consultants', 'Animal Care', 'Marketing & Growth']],
    ['Media', ['Podcasts', 'YouTube', 'News Outlets', 'Documentaries & Films', 'Books', 'Media']],
    ['Community', ['Nonprofits', 'Rescues', 'Sanctuaries', 'Events']],
    // People (Sean, 2026-10-28). A person has no place: their profile, links and credits are saved by ve-people.
    ['People', ['Activists', 'Content Creators', 'Athletes', 'Physicians', 'Health Experts', 'Chefs', 'Founders']]
  ];
  // A physician's specialty (details.person.specialty); keep in step with SPECIALTIES in /public/ve-region-directory.js and ve-people.
  var SPECIALTIES = [['cardiology', 'Cardiology'], ['gastroenterology', 'Gastroenterology'], ['internal', 'Internal medicine'], ['family', 'Family medicine'],
    ['lifestyle', 'Lifestyle medicine'], ['psychiatry', 'Psychiatry'], ['urology', 'Urology'], ['surgery', 'Surgery'], ['other', 'Other specialties']];
  var PEOPLE_FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-people';
  function people(body) {
    return fetch(PEOPLE_FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + VEAuth.getToken() }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); });
  }
  var SUB_LABEL = { 'Media': 'Other media' };
  // A book's type (details.book_type, Sean 2026-10-27); keep in step with /public/ve-region-directory.js and ve-listing-media.
  var BOOK_TYPES = [['cookbook', 'Cookbook'], ['memoir', 'Biography & memoir'], ['educational', 'Educational'], ['health', 'Health & nutrition'],
    ['lifestyle', 'Lifestyle'], ['children', 'Children\'s']];
  // A health professional's practice (details.health_type, Sean 2026-10-27); keep in step with ve-region-directory.js and ve-listing-media.
  var HEALTH_TYPES = [['doctor', 'Doctors'], ['dentist', 'Dentists'], ['dietitian', 'Dietitians & nutritionists'], ['chiropractor', 'Chiropractors'],
    ['therapist', 'Therapists & counselors'], ['other', 'Other practices']];
  var MEDIA_FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-listing-media';
  // The chapters, from /public/ve-hubs.js where the page loads it (same order and names).
  var CHAPTERS_FALLBACK = [['south-florida', 'South Florida'], ['central-florida', 'Central Florida'], ['north-florida', 'North Florida'], ['atlanta', 'Atlanta'], ['washington-dc', 'Washington, D.C.'], ['delaware', 'Delaware'], ['maryland', 'Maryland'], ['virginia', 'Virginia'], ['west-virginia', 'West Virginia'], ['new-york', 'New York'], ['philadelphia', 'Philadelphia'], ['los-angeles', 'Los Angeles'], ['london', 'London']];
  function chapters() { return window.VE_HUBS ? VE_HUBS.map(function (h) { return [h.slug, h.name]; }) : CHAPTERS_FALLBACK; }
  // The chapter an address puts a listing in (VE_HUBS match), if the page has the hubs.
  function homeChapter(city, state) {
    if (!window.VE_HUBS || !city) return '';
    var h = VE_HUBS.filter(function (x) {
      return (!x.match.cities || x.match.cities.indexOf(city) >= 0) && (!x.match.states || x.match.states.indexOf(String(state || '').toUpperCase()) >= 0);
    })[0];
    return h ? h.slug : '';
  }
  // What a food brand makes (listings.product_kinds, Sean 2026-10-24): the Directory's Food Brands filter. Keep in step
  // with KINDS in /public/ve-region-directory.js.
  var KINDS = [['dairy', 'Dairy alternatives'], ['meat', 'Meat alternatives'], ['egg', 'Egg alternatives'], ['seafood', 'Seafood alternatives'],
    ['snacks', 'Snacks and sweets'], ['drinks', 'Drinks'], ['protein', 'Protein and supplements'], ['pantry', 'Pantry and sauces'], ['baked', 'Bread and baked goods'], ['frozen', 'Frozen meals']];
  // What kind of food a place serves (listings.cuisines, Sean 2026-10-25: "just because it's vegan doesn't tell the whole
  // story. Some are Caribbean, some are Ethiopian, Italian"), one or more. Global mix is the place that is not one thing.
  // Keep in step with CUISINES in /public/ve-region-directory.js and the check in 20261025_restaurant_essentials.sql.
  var CUISINES = [['american', 'American & comfort food'], ['soul', 'Soul food'], ['caribbean', 'Caribbean'], ['latin', 'Latin American'],
    ['mexican', 'Mexican'], ['cuban', 'Cuban'], ['italian', 'Italian & pizza'], ['mediterranean', 'Mediterranean'], ['middle_eastern', 'Middle Eastern'],
    ['ethiopian', 'Ethiopian'], ['african', 'African'], ['indian', 'Indian'], ['thai', 'Thai'], ['chinese', 'Chinese'], ['japanese', 'Japanese & sushi'],
    ['korean', 'Korean'], ['vietnamese', 'Vietnamese'], ['asian', 'Pan-Asian'], ['burgers', 'Burgers & fast food'], ['bowls', 'Bowls & salads'],
    ['raw', 'Raw & juice bar'], ['brunch', 'Breakfast & brunch'], ['desserts', 'Desserts & sweets'], ['global', 'Global mix']];
  var FOOD_PLACES = ['Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Catering', 'Meal Prep'];
  // At a Glance belongs to places you sit down in.
  var DINING = ['Restaurants', 'Bakeries & Cafes'];
  var VEGAN = [['fully_vegan', '100% Vegan'], ['vegan_friendly', 'Vegan-friendly'], ['vegan_options', 'Vegan options']];
  var OPEN = [['OPERATIONAL', 'Open'], ['CLOSED_TEMPORARILY', 'Temporarily closed'], ['CLOSED_PERMANENTLY', 'Permanently closed']];
  // What kind of listing a sub-section is, and so which parts of the editor it needs. Keep the words in step with STATUS_WORDS in
  // /public/ve-region-directory.js and statusWords in /directory/listing.html.
  var MEDIA_SHOWS = ['Podcasts', 'YouTube', 'News Outlets', 'Media'], MEDIA_WORKS = ['Documentaries & Films', 'Books'];
  var BRANDS = ['Food Brands', 'Nutrition & Supplements', 'Fitness and Athletics', 'Clothing and Fashion', 'Beauty and Personal Care', 'E-Commerce & Marketplaces'];
  function kindOf(cat) { return (SECTIONS[5][1].indexOf(cat) >= 0) ? 'person' : MEDIA_SHOWS.indexOf(cat) >= 0 ? 'show' : MEDIA_WORKS.indexOf(cat) >= 0 ? 'work' : BRANDS.indexOf(cat) >= 0 ? 'brand' : 'place'; }
  var STATUS = {
    place: { title: 'Open or closed', opts: OPEN },
    // Never Ended (Sean, 2026-10-27: "it could come back 3 years later").
    show: { title: 'Status', opts: [['OPERATIONAL', 'Active'], ['CLOSED_TEMPORARILY', 'On hiatus']] },
    work: { title: 'Status', opts: [['OPERATIONAL', 'Available'], ['CLOSED_PERMANENTLY', 'No longer available']] },
    brand: { title: 'Status', opts: [['OPERATIONAL', 'In business'], ['CLOSED_TEMPORARILY', 'Paused'], ['CLOSED_PERMANENTLY', 'Out of business']] }
  };
  var ATMOS = [['', 'Not set'], ['casual', 'Casual'], ['fast-casual', 'Fast casual'], ['upscale', 'Upscale'], ['fine-dining', 'Fine dining'], ['bar-lounge', 'Bar / lounge']];
  var GLANCE = [
    ['Seating', [['a', 'Dine-in'], ['f', 'indoor_seating', 'Indoor seating'], ['a', 'Outdoor Seating'], ['a', 'Reservations']]],
    ['Amenities', [['a', 'Takeout'], ['a', 'Delivery'], ['a', 'Catering'], ['a', 'WiFi'], ['f', 'high_speed_wifi', 'High-speed WiFi'], ['a', 'Parking'], ['a', 'BYOB'], ['a', 'Dog-Friendly'], ['a', 'Family-Friendly'], ['a', 'Live Music'], ['f', 'late_hours', 'Late hours']]],
    ['Accessibility', [['a', 'Wheelchair Accessible']]],
    ['Ownership', [['o', 'is_black_owned', 'Black-owned'], ['o', 'is_women_owned', 'Women-owned'], ['o', 'is_latino_owned', 'Latino/Hispanic-owned'], ['o', 'is_asian_owned', 'Asian-owned'], ['o', 'is_lgbtq_owned', 'LGBTQ+-owned'], ['o', 'is_immigrant_owned', 'Immigrant-owned'], ['o', 'is_veteran_owned', 'Veteran-owned'], ['o', 'is_indigenous_owned', 'Indigenous-owned'], ['o', 'is_family_owned', 'Family-owned']]]
  ];
  var CSS = '#vla{position:fixed;inset:0;z-index:9997;background:rgba(10,20,12,.6);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Montserrat,sans-serif}' +
    '#vla .box{background:#fff;border-radius:14px;max-width:600px;width:100%;max-height:calc(100vh - 32px);overflow:auto;padding:22px 22px 18px;color:#1a1a1a;box-shadow:0 24px 60px rgba(0,0,0,.35)}' +
    '#vla h2{font-size:17px;font-weight:900;margin:0 0 2px}#vla .who{font-size:12px;color:#666;margin-bottom:6px}' +
    '#vla h3{font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#1f5f22;margin:18px 0 4px;padding-top:12px;border-top:1px solid #eee}' +
    '#vla label.h{display:block;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#555;margin:10px 0 5px}' +
    '#vla select,#vla input[type=text]{width:100%;font:inherit;font-size:14px;padding:9px 10px;border:1px solid rgba(0,0,0,.25);border-radius:8px;background:#fff;color:#1a1a1a}' +
    // Dropdowns: our own arrow, 16px in from the right edge (canon-sean-interface-defaults rule 15; the select rule in claim.html).
    '#vla select{-webkit-appearance:none;-moz-appearance:none;appearance:none;padding-right:46px;cursor:pointer;background:#fff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'9\' viewBox=\'0 0 14 9\'%3E%3Cpath d=\'M1 1l6 6 6-6\' fill=\'none\' stroke=\'%231f5f22\' stroke-width=\'2.2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E") no-repeat right 16px center/14px 9px}#vla select::-ms-expand{display:none}' +
    '#vla .row{display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px}#vla .row2{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
    '#vla .chips{display:flex;flex-wrap:wrap;gap:6px}#vla .chips label{display:flex;gap:6px;align-items:center;font-size:12.5px;font-weight:700;border:1px solid rgba(0,0,0,.18);border-radius:99px;padding:5px 11px;cursor:pointer;min-height:32px}' +
    '#vla .chips label:has(input:checked){background:#EAF7EA;border-color:#2d7d31}#vla .chips label:has(input:disabled){opacity:.45;cursor:default}' +
    '#vla .chips input{accent-color:#1f5f22;width:15px;height:15px;margin:0}' +
    '#vla .check{display:flex;gap:8px;align-items:center;font-size:13px;font-weight:700;margin:8px 0 4px;cursor:pointer}#vla .check input{width:17px;height:17px;accent-color:#1f5f22}' +
    '#vla .note{font-size:12px;color:#666;margin-top:4px}' +
    '#vla .acts{display:flex;gap:8px;justify-content:flex-end;align-items:center;margin-top:18px;position:sticky;bottom:-18px;background:#fff;padding:12px 0 4px}#vla .msg{flex:1;font-size:13px;font-weight:700;color:#1f5f22}#vla .msg.bad{color:#8a1c12}' +
    '#vla button,#vla a.cancel{font:inherit;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;border-radius:8px;padding:10px 16px;cursor:pointer;min-height:40px}#vla a.cancel{display:inline-flex;align-items:center}' +
    '#vla .save{background:#1f5f22;color:#fff;border:0}#vla .save:disabled{opacity:.5}#vla .cancel{background:#fff;color:#1f5f22;border:1px solid rgba(0,0,0,.25)}' +
    '@media(max-width:520px){#vla .row{grid-template-columns:1fr 1fr}#vla .row .street{grid-column:1/-1}}' +
    '.vla-edit{font-family:Montserrat,sans-serif;font-size:9.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:4px 9px;border-radius:4px;border:1px dashed #b7791f;background:#fffaf0;color:#7a4b00;cursor:pointer}' +
    '.vla-edit:hover{background:#fff1d6}' +
    'a.vla-edit{text-decoration:none;display:inline-block}' +
    '.vla-btns{display:flex;gap:4px;justify-content:center;flex-wrap:wrap}' +
    '#vla .logo{display:flex;gap:14px;align-items:center;flex-wrap:wrap}#vla .logo-img{width:72px;height:72px;border-radius:12px;border:1px solid rgba(0,0,0,.12);background:#fff center/contain no-repeat;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px;color:#fff;flex:0 0 auto}' +
    '#vla .logo-btns{display:flex;flex-wrap:wrap;gap:6px;flex:1;min-width:0}#vla .logo-btns button{background:#fff;color:#1f5f22;border:1px solid rgba(0,0,0,.25);padding:8px 12px;min-height:38px}#vla .logo-btns .rm{color:#8a1c12}' +
    '#vla .logo-msg{flex-basis:100%;font-size:12.5px;font-weight:700;color:#1f5f22;min-height:18px}#vla .logo-msg.bad{color:#8a1c12}' +
    // The logo editor opens under the logo, and the dialog widens while it is open.
    '#vla .box.vla-wide{max-width:880px}#vla .ledit{border:1px solid rgba(0,0,0,.12);border-radius:10px;padding:14px;margin:4px 0 6px;background:#fafafa}' +
    '#vla .ledit-look{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 6px}#vla .ledit-look a{font-size:12px;font-weight:700;color:#1f5f22;border:1px solid rgba(0,0,0,.2);border-radius:6px;padding:6px 10px;text-decoration:none;background:#fff}' +
    '#vla .ledit-hint{font-size:12px;color:#555;margin:0 0 12px}#vla .ledit-acts{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}' +
    '#vla .ledit .vle button{min-height:0;letter-spacing:0;text-transform:none;font-weight:700;padding:8px 12px;border-radius:6px}';
  var FIELDS = 'id,slug,name,logo_url,initials,color,website,instagram,facebook,category,extra_categories,communities,product_kinds,cuisines,vetted_at,voter_count,rss_url,claim_status,vegan_status,business_status,address_street,address_city,address_state,address_zip,atmosphere,accommodations,indoor_seating,late_hours,high_speed_wifi,is_black_owned,is_women_owned,is_latino_owned,is_asian_owned,is_lgbtq_owned,is_immigrant_owned,is_veteran_owned,is_indigenous_owned,is_family_owned,lgbtq_friendly,parent_id,location_label,release_year:details->>release_year,book_type:details->>book_type,health_type:details->>health_type,description,tiktok,youtube,person:details->person';

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function isAdmin() {
    var m = window.VEAuth && VEAuth.getMember ? VEAuth.getMember() : null; // null while previewing as public
    return !!(m && m.is_superadmin && VEAuth.isLoggedIn());
  }
  function css() { if (!document.getElementById('vla-css')) { var st = document.createElement('style'); st.id = 'vla-css'; st.textContent = CSS; document.head.appendChild(st); } }
  function sectionOf(cat) { for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i][1].indexOf(cat) >= 0) return SECTIONS[i][0]; return ''; }
  function subsOf(sec) { for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i][0] === sec) return SECTIONS[i][1]; return []; }
  // The shared uploader is only on Depot pages, so the editor loads it the first time a logo is added.
  function uploader() {
    if (window.VEMediaUpload) return Promise.resolve(window.VEMediaUpload);
    return new Promise(function (res, rej) {
      var sc = document.createElement('script'); sc.src = '/public/ve-media-upload.js';
      sc.onload = function () { window.VEMediaUpload ? res(window.VEMediaUpload) : rej(new Error('load')); }; sc.onerror = function () { rej(new Error('load')); };
      document.head.appendChild(sc);
    });
  }
  // The logo editor (Directory review > Logos) is loaded the first time a logo is made here.
  function logoEditor() {
    if (window.VELogoEditor) return Promise.resolve(window.VELogoEditor);
    return new Promise(function (res, rej) {
      var sc = document.createElement('script'); sc.src = '/public/ve-logo-editor.js';
      sc.onload = function () { window.VELogoEditor ? res(window.VELogoEditor) : rej(new Error('load')); }; sc.onerror = function () { rej(new Error('load')); };
      document.head.appendChild(sc);
    });
  }
  var DISCOVER = SB + '/functions/v1/ve-discover';
  function disc(body) {
    return fetch(DISCOVER, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + VEAuth.getToken() }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); });
  }
  // The editor's square goes to the staging folder (add_logo_url), then logo_set moves it next to the listing.
  function uploadSquare(blob) {
    return disc({ action: 'add_logo_url', content_type: 'image/jpeg', bytes: blob.size }).then(function (u) {
      if (!u || !u.signed_url) throw new Error((u && u.message) || 'Could not start the upload. Try again.');
      return new Promise(function (res, rej) {
        var x = new XMLHttpRequest(); x.open('PUT', u.signed_url); x.setRequestHeader('Content-Type', 'image/jpeg'); x.setRequestHeader('x-upsert', 'true');
        x.onload = function () { if (x.status >= 300) rej(new Error('The upload did not go through. Try again.')); else res(u.path); };
        x.onerror = function () { rej(new Error('The upload did not go through. Check your connection and try again.')); };
        x.send(blob);
      });
    });
  }
  function chip(type, name, value, label, on) { return '<label><input type="' + type + '" name="' + name + '" value="' + esc(value) + '"' + (on ? ' checked' : '') + '>' + esc(label) + '</label>'; }

  // The hub cards only carry a few fields, so fetch the whole row first.
  function edit(l, onSaved) {
    if (!isAdmin()) return;
    fetch(SB + '/rest/v1/listings?id=eq.' + encodeURIComponent(l.id) + '&select=' + FIELDS, { headers: { apikey: ANON, Authorization: 'Bearer ' + ANON } })
      .then(function (r) { return r.json(); }).then(function (rows) { open(Object.assign({}, l, (rows && rows[0]) || {}), l, onSaved); })
      .catch(function () { open(l, l, onSaved); });
  }
  function open(l, target, onSaved) {
    css();
    var old = document.getElementById('vla'); if (old) old.remove();
    var sec = sectionOf(l.category), extra = l.extra_categories || [], accom = l.accommodations || [];
    var vs = l.vegan_status === 'vegan' ? 'fully_vegan' : (l.vegan_status || ''), bs = l.business_status || 'OPERATIONAL';
    var online = !l.address_city && !l.address_state;
    var glance = GLANCE.map(function (g) {
      return '<label class="h">' + g[0] + '</label><div class="chips">' + g[1].map(function (it) {
        if (it[0] === 'a') return chip('checkbox', 'vla-acc', it[1], it[1], accom.indexOf(it[1]) >= 0);
        if (it[0] === 'f') return chip('checkbox', 'vla-flag', it[1], it[2], !!l[it[1]]);
        return chip('checkbox', 'vla-own', it[1], it[2], !!l[it[1]] || (it[1] === 'is_lgbtq_owned' && !!l.lgbtq_friendly));
      }).join('') + '</div>';
    }).join('');
    var wrap = document.createElement('div'); wrap.id = 'vla';
    wrap.innerHTML = '<div class="box" role="dialog" aria-modal="true" aria-labelledby="vla-t">' +
      '<h2 id="vla-t">Edit listing</h2><div class="who">Admin only. Changes are live as soon as you save.</div>' +
      '<label class="h" for="vla-name" id="vla-name-l">Business name</label><input type="text" id="vla-name" maxlength="160" value="' + esc(l.name) + '">' +

      '<h3 id="vla-logo-t">Logo</h3><div class="logo"><div class="logo-img" id="vla-logo"></div><div class="logo-btns">' +
      '<button type="button" id="vla-up">Upload a logo</button><button type="button" id="vla-copy" hidden>Copy it into our storage</button><button type="button" class="rm" id="vla-rm" hidden>Remove</button>' +
      '</div><div class="logo-msg" id="vla-lmsg" role="status"></div></div><div class="ledit" id="vla-ledit" hidden></div>' +

      // What it is, first: the parts under it follow from it.
      '<h3>What it is</h3>' +
      '<label class="h">Main section</label><div class="chips" id="vla-sec">' + SECTIONS.map(function (s) { return chip('radio', 'vla-sec', s[0], s[0], s[0] === sec); }).join('') + '</div>' +
      '<label class="h" for="vla-sub">Sub-section</label><select id="vla-sub"></select>' +
      '<label class="h">Also show it under</label><div class="chips" id="vla-extra"></div>' +
      '<div class="note" id="vla-vends-note" hidden>Sells at markets, festivals or events too? Tick Vendors: it stays in its brand section, shows with the vendors, and its card reads Markets &amp; events.</div>' +
      '<div id="vla-cuis-wrap"><label class="h">What kind of food (up to four)</label><div class="chips">' + CUISINES.map(function (k) { return chip('checkbox', 'vla-cuis', k[0], k[1], (l.cuisines || []).indexOf(k[0]) >= 0); }).join('') + '</div></div>' +
      '<div id="vla-kinds-wrap"><label class="h">What they make</label><div class="chips">' + KINDS.map(function (k) { return chip('checkbox', 'vla-kind', k[0], k[1], (l.product_kinds || []).indexOf(k[0]) >= 0); }).join('') + '</div></div>' +

      '<div class="note" id="vla-first" hidden>Pick the main section and sub-section first. The rest of the listing follows from what it is.</div>' +
      '<div id="vla-rest">' +

      // Episodes (Sean, 2026-10-27): the show's RSS feed fills its Episodes tab (ve-podcast). Found from Apple Podcasts when empty.
      // A book or a film says when it came out, and a book what kind it is (Sean, 2026-10-27), on its card in place of a city.
      '<div id="vla-p-work" hidden><h3>About the work</h3><label class="h" for="vla-year">Year it came out</label>' +
      '<input type="text" id="vla-year" inputmode="numeric" maxlength="4" placeholder="2018" value="' + esc(l.release_year || '') + '">' +
      '<div id="vla-bt-wrap"><label class="h">Type of book</label><div class="chips">' + BOOK_TYPES.map(function (k) { return chip('radio', 'vla-bt', k[0], k[1], l.book_type === k[0]); }).join('') + '</div></div></div>' +
      // A person (Sean, 2026-10-28): what they do, a physician's specialty, their bio (written from their interviews), where to find
      // them, links to their work, and what they did with us. No phone or address.
      '<div id="vla-p-person" hidden><h3>About them</h3>' +
      '<label class="h" for="vla-ptitle">What they do, in a line</label><input type="text" id="vla-ptitle" maxlength="90" placeholder="Cardiologist and author" value="' + esc((l.person || {}).title || '') + '">' +
      '<div id="vla-spec-wrap"><label class="h">Specialty</label><div class="chips">' + SPECIALTIES.map(function (k) { return chip('radio', 'vla-spec', k[0], k[1], (l.person || {}).specialty === k[0]); }).join('') + '</div></div>' +
      '<label class="h" for="vla-pbio">Bio</label><textarea id="vla-pbio" rows="9" style="width:100%;font:13px/1.6 Montserrat,sans-serif;padding:10px;border:1px solid #ccc;border-radius:6px">' + esc(l.description || '') + '</textarea>' +
      '<div class="chips" style="margin-top:6px"><button type="button" class="cancel" id="vla-pbio-go">Write it from their interviews</button></div>' +
      '<div class="note">Written only from what they said with us (their episodes\' transcripts). Read it before you save.</div>' +
      '<div class="row2"><div><label class="h" for="vla-pweb">Website</label><input type="text" id="vla-pweb" value="' + esc(l.website || '') + '"></div>' +
      '<div><label class="h" for="vla-pig">Instagram</label><input type="text" id="vla-pig" placeholder="@handle" value="' + esc(l.instagram || '') + '"></div></div>' +
      '<div class="row2"><div><label class="h" for="vla-pfb">Facebook</label><input type="text" id="vla-pfb" value="' + esc(l.facebook || '') + '"></div>' +
      '<div><label class="h" for="vla-ptt">TikTok</label><input type="text" id="vla-ptt" placeholder="@handle" value="' + esc(l.tiktok || '') + '"></div></div>' +
      '<label class="h" for="vla-pyt">YouTube</label><input type="text" id="vla-pyt" placeholder="@channel or a link" value="' + esc(l.youtube || '') + '">' +
      '<label class="h">Their work (a sign-up page, a program, a product, a book)</label>' +
      [0, 1, 2].map(function (i) { var x = ((l.person || {}).links || [])[i] || {};
        return '<div class="row2"><div><input type="text" class="vla-plink-l" maxlength="40" placeholder="Label, like Work with me" value="' + esc(x.label || '') + '"></div><div><input type="text" class="vla-plink-u" placeholder="https://" value="' + esc(x.url || '') + '"></div></div>'; }).join('') +
      '<h3>With Vegans Explore</h3><div id="vla-pcred" class="note">Loading...</div>' +
      '<label class="h" for="vla-pep">Add an episode</label><input type="text" id="vla-pep" placeholder="Search our episodes by title or guest"><div id="vla-pep-res" class="note"></div>' +
      '<label class="h">Add an event, article or video</label>' +
      '<div class="row2"><div><select id="vla-pck"><option value="event">Event</option><option value="article">Article</option><option value="video">Video</option></select></div>' +
      '<div><input type="text" id="vla-pcrole" maxlength="40" placeholder="Their role, like Speaker"></div></div>' +
      '<input type="text" id="vla-pct" maxlength="200" placeholder="Title, like Vegan Foodie Fest Miami" style="margin-top:6px">' +
      '<div class="row2"><div><input type="text" id="vla-pcu" placeholder="Link (optional)"></div><div><input type="date" id="vla-pcd"></div></div>' +
      '<div class="chips" style="margin-top:6px"><button type="button" class="cancel" id="vla-pcadd">Add it</button></div></div>' +
      '<div id="vla-p-health" hidden><h3>Kind of practice</h3><div class="chips">' + HEALTH_TYPES.map(function (k) { return chip('radio', 'vla-ht', k[0], k[1], l.health_type === k[0]); }).join('') + '</div></div>' +
      '<div id="vla-p-rss" hidden><h3>Episodes</h3><label class="h" for="vla-rss">Podcast RSS feed</label>' +
      '<input type="text" id="vla-rss" placeholder="https://feeds.example.com/show" value="' + esc(l.rss_url || '') + '">' +
      '<div class="note">Its episodes play on its page and members can save them. We find it from the Apple Podcasts link when there is one; clear it to take Episodes off.</div></div>' +

      '<div id="vla-p-loc"><h3>Location</h3>' +
      '<label class="check"><input type="checkbox" id="vla-online"' + (online ? ' checked' : '') + '> Online only, no storefront</label>' +
      '<div id="vla-addr"><div class="row"><div class="street"><label class="h" for="vla-st">Street</label><input type="text" id="vla-st" value="' + esc(l.address_street) + '"></div>' +
      '<div><label class="h" for="vla-city">City</label><input type="text" id="vla-city" value="' + esc(l.address_city) + '"></div>' +
      '<div class="row2"><div><label class="h" for="vla-state">State</label><input type="text" id="vla-state" maxlength="40" value="' + esc(l.address_state) + '"></div>' +
      '<div><label class="h" for="vla-zip">Zip</label><input type="text" id="vla-zip" maxlength="12" value="' + esc(l.address_zip) + '"></div></div></div>' +
      '<div class="note">The city decides which hub it shows on. The map pin follows the street address.</div></div></div>' +

      // Locations (Sean, 2026-10-25): one business, many places. Each location is its own listing tied to a main listing,
      // which holds what they share; Add a location copies it (ve-claims admin_location_add).
      '<div id="vla-p-locs"><h3>Locations</h3>' +
      '<div class="row2"><div><label class="h" for="vla-parent">Part of (the main listing)</label><input type="text" id="vla-parent" placeholder="Its address, like jajaja-mexicana" value=""></div>' +
      '<div><label class="h" for="vla-loclabel">This location\'s name</label><input type="text" id="vla-loclabel" maxlength="60" placeholder="West Village" value="' + esc(l.location_label) + '"></div></div>' +
      '<div class="note">Leave Part of empty for the main listing or a business with one place. A location fills anything it leaves empty (about, logo, socials, menu) from the main listing.</div>' +
      '<div id="vla-locs" class="note"></div>' +
      '<button type="button" class="cancel" id="vla-addloc" style="margin-top:6px">Add a location</button>' +
      '<div id="vla-locform" hidden style="margin-top:8px"><div class="row"><div class="street"><label class="h" for="vla-nl-label">Location name</label><input type="text" id="vla-nl-label" maxlength="60" placeholder="West Village"></div>' +
        '<div><label class="h" for="vla-nl-st">Street</label><input type="text" id="vla-nl-st"></div></div>' +
        '<div class="row"><div class="street"><label class="h" for="vla-nl-city">City</label><input type="text" id="vla-nl-city"></div>' +
        '<div class="row2"><div><label class="h" for="vla-nl-state">State</label><input type="text" id="vla-nl-state" maxlength="40"></div><div><label class="h" for="vla-nl-zip">Zip</label><input type="text" id="vla-nl-zip" maxlength="12"></div></div></div>' +
        '<label class="h" for="vla-nl-phone">Phone</label><input type="text" id="vla-nl-phone" maxlength="40">' +
        '<div class="chips" style="margin-top:8px"><button type="button" class="save" id="vla-nl-go">Add this location</button></div>' +
        '<div class="note">It copies the name, logo, about, socials, website, section and how Vegan. Its hours, Google place and map pin fill in overnight.</div></div></div>' +

      '<div id="vla-p-ch"><h3>Chapters</h3>' +
      '<label class="check"><input type="checkbox" id="vla-all"' + ((l.communities || []).indexOf('all') >= 0 ? ' checked' : '') + '> Every chapter (a national or global organization)</label>' +
      '<div class="chips" id="vla-ch">' + chapters().map(function (c) { return chip('checkbox', 'vla-ch', c[0], c[1], (l.communities || []).indexOf(c[0]) >= 0); }).join('') + '</div>' +
      '<div class="note" id="vla-ch-note"></div></div>' +

      '<div id="vla-p-vegan"><h3>How Vegan</h3><div class="chips">' + VEGAN.map(function (o) { return chip('radio', 'vla-vs', o[0], o[1], o[0] === vs); }).join('') + '</div>' +
      // Vetted by us (Sean, 2026-10-25): skips the 10 member votes a Vegan-friendly or Vegan-options place needs.
      '<div id="vla-vet-wrap"><label class="check"><input type="checkbox" id="vla-vet"' + (l.vetted_at ? ' checked' : '') + '> Vetted by us: show it to everyone now</label>' +
      '<div class="note">Otherwise it stays in the members\' Being vetted section until 10 different members vote for it (' + (l.voter_count || 0) + ' so far) or the business claims it.</div></div></div>' +
      '<h3 id="vla-bs-t">Open or closed</h3><div class="chips" id="vla-bs"></div>' +
      // Off the Directory without calling it closed (Sean, 2026-10-25: "I just wanted to remove and not even mark as permanently
      // closed"). Both save at once through ve-outreach listing_state; Depot > Directory review lists them and can put them back.
      '<div class="note" id="vla-bs-note"></div>' +
      '<div class="chips" style="margin-top:6px"><button type="button" class="cancel" id="vla-hold">Hold for review</button><button type="button" class="cancel" id="vla-remove" style="color:#8a1c12;border-color:#8a1c12">Remove from the Directory</button>' +
        '<a class="cancel" href="/admin/depot/directory-review#l/' + encodeURIComponent(l.id) + '/flagged" target="_blank" rel="noopener" style="text-decoration:none">Open in Directory review</a></div>' +

      '<div id="vla-glance"><h3>At a Glance <span style="font-weight:700;letter-spacing:0;text-transform:none;color:#666">(restaurants and cafes)</span></h3>' +
      '<label class="h" for="vla-atm">Atmosphere</label><select id="vla-atm">' + ATMOS.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === (l.atmosphere || '') ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
      glance + '</div>' +
      '</div>' + // #vla-rest

      '<div class="acts"><span class="msg" id="vla-msg" role="status"></span><button type="button" class="cancel" id="vla-x">Cancel</button><button type="button" class="save" id="vla-s">Save</button></div></div>';
    document.body.appendChild(wrap);
    var $ = function (sel) { return wrap.querySelector(sel); };

    // Sub-sections follow the main section; the extra ones stay inside the same section.
    function drawSubs(keepSub) {
      // Other media is hidden for now (Sean, 2026-10-27), except on a listing still filed there, so it can be moved.
      var s = ($('input[name=vla-sec]:checked') || {}).value, subs = subsOf(s).filter(function (c) { return c !== 'Media' || l.category === 'Media'; }), cur = keepSub && subs.indexOf(keepSub) >= 0 ? keepSub : subs[0];
      // Not in any section yet (Uncategorized): it keeps what it has until a section is picked.
      if (!s) { $('#vla-sub').innerHTML = '<option value="' + esc(l.category || 'Uncategorized') + '">' + esc(l.category || 'Uncategorized') + ' (pick a main section)</option>'; $('#vla-extra').innerHTML = ''; syncSub(); return; }
      $('#vla-sub').innerHTML = subs.map(function (c) { return '<option value="' + esc(c) + '"' + (c === cur ? ' selected' : '') + '>' + esc(SUB_LABEL[c] || c) + '</option>'; }).join('');
      $('#vla-extra').innerHTML = subs.map(function (c) { return chip('checkbox', 'vla-extra', c, SUB_LABEL[c] || c, extra.indexOf(c) >= 0); }).join('');
      syncSub();
    }
    function syncSub() {
      var cur = $('#vla-sub').value;
      wrap.querySelectorAll('input[name=vla-extra]').forEach(function (i) { i.disabled = i.value === cur; if (i.disabled) i.checked = false; });
      var dining = [cur].concat(Array.prototype.map.call(wrap.querySelectorAll('input[name=vla-extra]:checked'), function (i) { return i.value; }))
        .some(function (c) { return DINING.indexOf(c) >= 0; });
      $('#vla-glance').hidden = !dining;
      $('#vla-cuis-wrap').hidden = [cur].concat(Array.prototype.map.call(wrap.querySelectorAll('input[name=vla-extra]:checked'), function (i) { return i.value; }))
        .every(function (c) { return FOOD_PLACES.indexOf(c) < 0; });
      syncVet();
      $('#vla-vends-note').hidden = ['Food Brands', 'Nutrition & Supplements'].indexOf(cur) < 0;
      $('#vla-kinds-wrap').hidden = [cur].concat(Array.prototype.map.call(wrap.querySelectorAll('input[name=vla-extra]:checked'), function (i) { return i.value; })).indexOf('Food Brands') < 0;
      // The rest follows from what it is (Sean, 2026-10-27): nothing until a section is picked; media serves every chapter and has no
      // address, locations or How Vegan; a brand has no locations.
      var picked = !!($('input[name=vla-sec]:checked') || {}).value, kind = kindOf(cur), person = kind === 'person', media = kind === 'show' || kind === 'work' || person;
      $('#vla-first').hidden = picked; $('#vla-rest').hidden = !picked;
      $('#vla-p-loc').hidden = $('#vla-p-ch').hidden = $('#vla-p-vegan').hidden = media;
      $('#vla-p-locs').hidden = media || kind === 'brand';
      $('#vla-p-person').hidden = !person; $('#vla-spec-wrap').hidden = cur !== 'Physicians';
      $('#vla-bs-t').hidden = $('#vla-bs').hidden = person;
      $('#vla-logo-t').textContent = person ? 'Photo' : 'Logo';
      $('#vla-p-rss').hidden = cur !== 'Podcasts';
      $('#vla-p-health').hidden = cur !== 'Health Professionals';
      $('#vla-p-work').hidden = kind !== 'work'; $('#vla-bt-wrap').hidden = cur !== 'Books';
      $('#vla-name-l').textContent = media ? 'Name' : 'Business name';
      drawStatus(person ? 'place' : kind);
    }
    // Status words fit the kind: a podcast is Active or On hiatus; a brand In business, Paused or Out of business.
    function drawStatus(kind) {
      var cur = (wrap.querySelector('input[name=vla-bs]:checked') || {}).value || bs, st = STATUS[kind], opts = st.opts.slice();
      if (!opts.some(function (o) { return o[0] === cur; })) opts.splice(1, 0, [cur, cur === 'CLOSED_TEMPORARILY' ? 'Unavailable for now' : cur]);
      $('#vla-bs-t').textContent = st.title;
      $('#vla-bs').innerHTML = opts.map(function (o) { return chip('radio', 'vla-bs', o[0], o[1], o[0] === cur); }).join('');
      var last = st.opts[st.opts.length - 1][1];
      // A podcast's status follows its feed (ve-podcast, every hour): a save here holds only until the feed is read again.
      $('#vla-bs-note').textContent = $('#vla-sub').value === 'Podcasts'
        ? 'Set from its latest episode: Active within 6 months, then On hiatus, never Ended. A new episode sets it back on its own. To take it off the Directory:'
        : kind === 'show' ? 'To take it off the Directory:' : last + ' keeps it under Closed in the Directory, for memory. To take it off without that:';
    }
    // The vetted switch only matters for a Vegan-friendly or Vegan-options food place (the rule in /public/ve-trust.js).
    function syncVet() {
      var v = (wrap.querySelector('input[name=vla-vs]:checked') || {}).value;
      $('#vla-vet-wrap').hidden = !(v === 'vegan_friendly' || v === 'vegan_options') || FOOD_PLACES.indexOf($('#vla-sub').value) < 0;
    }
    wrap.querySelectorAll('input[name=vla-vs]').forEach(function (r) { r.addEventListener('change', syncVet); });
    wrap.querySelectorAll('input[name=vla-sec]').forEach(function (r) { r.addEventListener('change', function () { drawSubs(null); }); });
    $('#vla-sub').addEventListener('change', syncSub);
    $('#vla-extra').addEventListener('change', syncSub);
    drawSubs(l.category);
    // People: credits, adding an episode or an event, and the bio from their interviews.
    function drawCredits() {
      var box = $('#vla-pcred'); if (!box || $('#vla-p-person').hidden) return;
      people({ action: 'credits', listing_id: l.id }).then(function (d) {
        var rows = (d && d.credits) || [];
        box.innerHTML = rows.length ? rows.map(function (c) {
          var t = (c.content && c.content.title) || (c.event && c.event.title) || c.title || '';
          var w = (c.content && [c.content.podcast_show, c.content.episode_number ? 'Ep ' + c.content.episode_number : ''].filter(Boolean).join(' ')) || c.kind;
          return '<div style="display:flex;gap:8px;align-items:center;justify-content:space-between;padding:4px 0;border-top:1px solid #eee"><span><b>' + esc(t) + '</b> &middot; ' + esc(w) + (c.role ? ' &middot; ' + esc(c.role) : '') + '</span>' +
            '<button type="button" class="cancel" data-pcred-rm="' + esc(c.id) + '" style="padding:4px 10px">Remove</button></div>'; }).join('') : 'Nothing yet.';
      });
    }
    if (!$('#vla-p-person').hidden) drawCredits();
    $('#vla-sub').addEventListener('change', drawCredits);
    wrap.addEventListener('click', function (e) {
      var rm = e.target.closest('[data-pcred-rm]');
      if (rm) { rm.disabled = true; people({ action: 'credit_remove', id: rm.getAttribute('data-pcred-rm') }).then(drawCredits); return; }
      var ep = e.target.closest('[data-pep]');
      if (ep) { ep.disabled = true; people({ action: 'credit_add', listing_id: l.id, kind: 'episode', content_id: ep.getAttribute('data-pep'), role: 'Guest' }).then(function (d) {
        $('#vla-pep-res').textContent = d && d.ok ? 'Added.' : d && d.error === 'already_credited' ? 'Already on their page.' : 'That did not save.'; drawCredits(); }); }
    });
    var pepT;
    $('#vla-pep').addEventListener('input', function () {
      clearTimeout(pepT); var q = this.value.trim(); if (q.length < 3) { $('#vla-pep-res').innerHTML = ''; return; }
      pepT = setTimeout(function () { people({ action: 'episodes', q: q }).then(function (d) {
        $('#vla-pep-res').innerHTML = ((d && d.rows) || []).map(function (r) { return '<div style="display:flex;gap:8px;align-items:center;justify-content:space-between;padding:3px 0">' +
          '<span>' + esc(r.title) + ' &middot; ' + esc(r.podcast_show || '') + '</span><button type="button" class="cancel" data-pep="' + esc(r.id) + '" style="padding:4px 10px">Add</button></div>'; }).join('') || 'No episode matches.';
      }); }, 300);
    });
    $('#vla-pcadd').onclick = function () {
      var t = $('#vla-pct').value.trim(), msg = $('#vla-msg'); if (!t) { msg.className = 'msg bad'; msg.textContent = 'Give it a title.'; return; }
      people({ action: 'credit_add', listing_id: l.id, kind: $('#vla-pck').value, title: t, url: $('#vla-pcu').value.trim(), happened_on: $('#vla-pcd').value, role: $('#vla-pcrole').value.trim() })
        .then(function (d) { if (d && d.ok) { $('#vla-pct').value = $('#vla-pcu').value = $('#vla-pcd').value = $('#vla-pcrole').value = ''; drawCredits(); } else { msg.className = 'msg bad'; msg.textContent = 'That did not save. ' + ((d && d.error) || ''); } });
    };
    $('#vla-pbio-go').onclick = function () {
      var b = this, msg = $('#vla-msg'); b.disabled = true; msg.className = 'msg'; msg.textContent = 'Reading their interviews...';
      people({ action: 'bio_draft', listing_id: l.id }).then(function (d) {
        b.disabled = false;
        if (!d || !d.ok) { msg.className = 'msg bad'; msg.textContent = (d && d.message) || 'That did not work. Try again.'; return; }
        $('#vla-pbio').value = d.bio; if (!$('#vla-ptitle').value.trim() && d.title) $('#vla-ptitle').value = d.title;
        msg.textContent = 'Written from ' + (d.sources || []).length + ' episode(s). Read it, then Save.';
      }).catch(function () { b.disabled = false; msg.className = 'msg bad'; msg.textContent = 'Could not connect.'; });
    };
    // Chapters: the address's own chapter is always on; Every chapter covers the rest.
    function syncChapters() {
      var all = $('#vla-all').checked, online = $('#vla-online').checked;
      var home = online ? '' : homeChapter($('#vla-city').value.trim(), $('#vla-state').value.trim());
      wrap.querySelectorAll('input[name=vla-ch]').forEach(function (i) {
        var isHome = i.value === home;
        i.disabled = all || isHome;
        // The address's chapter is ticked for it; when the address moves, that tick goes with it.
        if (isHome) { if (!i.checked) i.dataset.auto = '1'; i.checked = true; }
        else if (i.dataset.auto) { i.checked = false; delete i.dataset.auto; }
      });
      var name = (chapters().filter(function (c) { return c[0] === home; })[0] || [])[1];
      $('#vla-ch-note').textContent = all ? 'Shows in every chapter, today and new ones. Its address shows as its headquarters.'
        : online ? 'Online businesses already show in every chapter.'
        : name ? 'Its address puts it in ' + name + '. Tick the other chapters it serves.'
        : 'Its address is outside our chapters. Tick the chapters it serves.';
    }
    ['#vla-all', '#vla-online'].forEach(function (s) { $(s).addEventListener('change', syncChapters); });
    ['#vla-city', '#vla-state'].forEach(function (s) { $(s).addEventListener('input', syncChapters); });
    syncChapters();
    // ---- Logo: saves on its own, right away.
    var logoChanged = false;
    function drawLogo(msg, bad) {
      var box = $('#vla-logo'), u = l.logo_url || '';
      if (u) { box.style.backgroundImage = 'url("' + u.replace(/"/g, '%22') + '")'; box.style.backgroundColor = '#fff'; box.textContent = ''; box.setAttribute('aria-label', 'Current logo'); }
      else { box.style.backgroundImage = ''; box.style.backgroundColor = l.color || '#1f5f22'; box.textContent = l.initials || String(l.name || '?').slice(0, 2).toUpperCase(); box.setAttribute('aria-label', 'No logo yet, the initials show instead'); }
      var pic = kindOf($('#vla-sub').value) === 'person' ? 'photo' : 'logo';
      $('#vla-up').textContent = u ? 'Replace the ' + pic : 'Upload a ' + pic;
      $('#vla-copy').hidden = !u || u.indexOf(OURS) === 0; // still hotlinked from the business's site
      $('#vla-rm').hidden = !u;
      var m = $('#vla-lmsg');
      m.className = 'logo-msg' + (bad ? ' bad' : '');
      m.textContent = msg != null ? msg : (u && u.indexOf(OURS) !== 0 ? 'This logo is linked from their website. Copy it into our storage so it never breaks.' : u ? '' : 'No logo yet. The initials show instead.');
    }
    function logoWork(label, p) {
      var btns = wrap.querySelectorAll('.logo-btns button'); btns.forEach(function (b) { b.disabled = true; });
      drawLogo(label);
      return p().then(function (saved) {
        l.logo_url = saved.logo_url; target.logo_url = saved.logo_url; if ('logo_alt_text' in saved) target.logo_alt_text = saved.logo_alt_text; logoChanged = true;
        drawLogo(saved.logo_url ? 'Saved. The logo is live now.' : 'Removed. The initials show now.');
      }, function (e) {
        drawLogo(e && e.message === 'not_an_image' ? 'That file is not a picture.' : e && e.message === 'fetch_failed' ? 'Their website would not hand over the logo. Make it in the editor instead.' : e && / /.test(e.message || '') ? e.message : 'That did not save. Try again.', true);
      }).then(function () { btns.forEach(function (b) { b.disabled = false; }); });
    }
    // Upload / Replace the logo: the logo editor, with the logo as it is loaded in to adjust, and where to look for a better one.
    function closeEditor() { var p = $('#vla-ledit'); p.hidden = true; p.innerHTML = ''; wrap.querySelector('.box').classList.remove('vla-wide'); $('#vla-up').disabled = false; }
    $('#vla-up').onclick = function () {
      var panel = $('#vla-ledit'); if (!panel.hidden) return;
      $('#vla-up').disabled = true; drawLogo('Opening the logo editor...');
      logoEditor().then(function (LE) {
        var name = String(l.name || ''), ig = String(l.instagram || '').replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/.*$/, '');
        var look = [];
        if (l.website) look.push(['Their website', /^https?:/i.test(l.website) ? l.website : 'https://' + l.website]);
        if (ig) look.push(['Instagram', 'https://www.instagram.com/' + ig + '/']);
        if (l.facebook) look.push(['Facebook', l.facebook]);
        look.push(['Google Images', 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(name + ' logo')]);
        panel.innerHTML = '<div class="ledit-look">' + look.map(function (x) { return '<a href="' + esc(x[1]) + '" target="_blank" rel="noopener">' + esc(x[0]) + '</a>'; }).join('') + '</div>' +
          '<p class="ledit-hint">' + (l.logo_url ? 'The logo as it is now is loaded below. Adjust it, or' : 'Find their logo, then') +
          ' right-click it and Copy image and paste here (Ctrl+V or Cmd+V), drag it in from the other tab, paste its link, or drop a file.</p>' +
          '<div id="vla-le"></div><div class="ledit-acts"><button type="button" class="cancel" id="vla-le-x">Cancel</button><button type="button" class="save" id="vla-le-save" disabled>Save logo</button></div>';
        panel.hidden = false; wrap.querySelector('.box').classList.add('vla-wide'); drawLogo();
        var save = $('#vla-le-save');
        var ed = LE.mount($('#vla-le'), { fetchUrl: function (url) { return disc({ action: 'logo_fetch', url: url }); }, onChange: function (on) { save.disabled = !on; } });
        if (l.logo_url) ed.load(l.logo_url);
        $('#vla-le-x').onclick = closeEditor;
        save.onclick = function () {
          save.disabled = true;
          logoWork('Saving the logo...', function () {
            return ed.toBlob().then(uploadSquare).then(function (path) { return disc({ action: 'logo_set', listing_id: l.id, path: path }); })
              .then(function (d) { if (!d.ok) throw new Error(d.message || d.error || 'save'); closeEditor(); return { logo_url: d.logo_url }; });
          }).then(function () { if (!$('#vla-ledit').hidden) save.disabled = false; });
        };
        panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, function () { $('#vla-up').disabled = false; drawLogo('The logo editor did not load. Try again.', true); });
    };
    $('#vla-copy').onclick = function () {
      logoWork('Copying the logo from their website...', function () {
        return uploader().then(function (U) {
          return U.api(VEAuth.getToken(), { action: 'logo_fetch', listing_id: l.id }).then(function (d) {
            if (!d.ok) throw new Error(d.error || 'fetch_failed');
            var bin = atob(d.b64), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
            return U.setLogo(VEAuth.getToken(), new Blob([a], { type: d.mime }), l);
          });
        });
      });
    };
    $('#vla-rm').onclick = function () {
      if (!confirm('Remove this logo? The initials show instead.')) return;
      logoWork('Removing...', function () {
        return uploader().then(function (U) { return U.api(VEAuth.getToken(), { action: 'logo_set', listing_id: l.id, url: null }); })
          .then(function (d) { if (!d.ok) throw new Error(d.error || 'save'); return d.listing; });
      });
    };
    drawLogo();

    function syncOnline() { $('#vla-addr').hidden = $('#vla-online').checked; }
    $('#vla-online').addEventListener('change', syncOnline); syncOnline();

    // A logo already saved on its own: tell the page when the editor closes, so it redraws.
    function close(saved) { wrap.remove(); document.removeEventListener('keydown', onKey); if (!saved && logoChanged && onSaved) onSaved({ logo_url: l.logo_url }); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    $('#vla-x').onclick = function () { close(); };
    // Hold for review / Remove: off the Directory now (Depot > Directory review holds the list and puts them back).
    function offDirectory(state, ask) {
      var note = state === 'removed' ? prompt(ask + '\n\nWhy, for the record (optional):', '') : (confirm(ask) ? '' : null);
      if (note === null) return;
      var msg = $('#vla-msg'); msg.className = 'msg'; msg.textContent = 'Saving...';
      fetch(SB + '/functions/v1/ve-outreach', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + VEAuth.getToken() },
        body: JSON.stringify({ action: 'listing_state', listing_id: l.id, state: state, note: note }) })
        .then(function (r) { return r.json(); }).then(function (d) {
          if (!d || !d.ok) { msg.className = 'msg bad'; msg.textContent = 'That did not save. ' + ((d && d.error) || ''); return; }
          msg.textContent = state === 'removed' ? 'Removed. Find it in Depot > Directory review.' : 'On hold. Find it in Depot > Directory review.';
          setTimeout(function () { location.href = '/admin/depot/directory-review#' + (state === 'removed' ? 'removed' : 'held'); }, 900);
        }).catch(function () { msg.className = 'msg bad'; msg.textContent = 'Could not connect. Try again.'; });
    }
    $('#vla-hold').onclick = function () { offDirectory('hold', 'Hold ' + l.name + ' for review? It comes off the Directory until you decide.'); };
    $('#vla-remove').onclick = function () { offDirectory('removed', 'Remove ' + l.name + ' from the Directory? It is not marked closed, and you can put it back from Depot > Directory review.'); };
    $('#vla-name').focus();

    // Locations: the main listing's address in Part of, and the group's other places.
    var mainId = l.parent_id || l.id, H = { apikey: ANON, Authorization: 'Bearer ' + ANON }, parentSlug = '';
    function drawLocs() {
      fetch(SB + '/rest/v1/listings?or=(id.eq.' + mainId + ',parent_id.eq.' + mainId + ')&status=neq.rejected&select=id,slug,name,location_label,address_city,address_state,status,business_status', { headers: H })
        .then(function (r) { return r.json(); }).then(function (rows) {
          rows = rows || [];
          var main = rows.filter(function (x) { return x.id === mainId; })[0];
          if (l.parent_id && main) { parentSlug = main.slug; $('#vla-parent').value = main.slug; }
          var others = rows.filter(function (x) { return x.id !== l.id; });
          $('#vla-locs').innerHTML = others.length ? 'In this group: ' + others.map(function (x) {
            var tag = x.business_status === 'CLOSED_PERMANENTLY' ? ' (closed)' : x.status === 'pending' ? ' (on hold)' : '';
            return '<a href="/directory/' + encodeURIComponent(x.slug) + '" target="_blank" rel="noopener">' + esc(x.id === mainId ? x.name + ' (main)' : (x.location_label || x.address_city || x.name)) + '</a>' + tag;
          }).join(', ') + '.' : '';
        }).catch(function () {});
    }
    drawLocs();
    $('#vla-addloc').onclick = function () { $('#vla-locform').hidden = !$('#vla-locform').hidden; if (!$('#vla-locform').hidden) $('#vla-nl-label').focus(); };
    $('#vla-nl-go').onclick = function () {
      var btn = this, msg = $('#vla-msg');
      var b = { action: 'admin_location_add', listing_id: l.id, label: $('#vla-nl-label').value.trim(), street: $('#vla-nl-st').value, city: $('#vla-nl-city').value.trim(),
        state: $('#vla-nl-state').value, zip: $('#vla-nl-zip').value, phone: $('#vla-nl-phone').value };
      if (!b.label || !b.city) { msg.className = 'msg bad'; msg.textContent = 'A new location needs its name and city.'; return; }
      btn.disabled = true; msg.className = 'msg'; msg.textContent = 'Adding...';
      fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + VEAuth.getToken() }, body: JSON.stringify(b) })
        .then(function (r) { return r.json(); }).then(function (d) {
          btn.disabled = false;
          if (!d || !d.ok) { msg.className = 'msg bad'; msg.textContent = d && d.error === 'duplicate_listing' ? 'That location is already listed in that city.' : 'That did not save. ' + ((d && (d.message || d.error)) || ''); return; }
          msg.className = 'msg'; msg.innerHTML = 'Added: <a href="/directory/' + encodeURIComponent(d.location.slug) + '" target="_blank" rel="noopener">' + esc(d.location.name) + '</a>.';
          ['#vla-nl-label', '#vla-nl-st', '#vla-nl-city', '#vla-nl-state', '#vla-nl-zip', '#vla-nl-phone'].forEach(function (k) { $(k).value = ''; });
          $('#vla-locform').hidden = true; drawLocs();
        }).catch(function () { btn.disabled = false; msg.className = 'msg bad'; msg.textContent = 'Could not connect. Try again.'; });
    };

    $('#vla-s').onclick = function () {
      var btn = this, msg = $('#vla-msg');
      function bad(t) { msg.className = 'msg bad'; msg.textContent = t; }
      var name = $('#vla-name').value.trim();
      if (!name) return bad('The business needs a name.');
      if (!($('input[name=vla-sec]:checked') || {}).value) return bad('Pick the main section first.');
      var kind = kindOf($('#vla-sub').value), hasLoc = !$('#vla-p-loc').hidden;
      var isOnline = $('#vla-online').checked;
      if (hasLoc && !isOnline && !$('#vla-city').value.trim()) return bad('Add a city, or tick Online only.');
      var vals = function (n) { return Array.prototype.map.call(wrap.querySelectorAll('input[name=' + n + ']:checked'), function (i) { return i.value; }); };
      var body = { action: 'admin_listing', listing_id: l.id, name: name, category: $('#vla-sub').value, extra_categories: vals('vla-extra'),
        business_status: (wrap.querySelector('input[name=vla-bs]:checked') || {}).value || 'OPERATIONAL' };
      // Only the parts shown are saved; media keeps its address as it is and serves every chapter.
      if (hasLoc) body.address = isOnline ? { online: true } : { street: $('#vla-st').value, city: $('#vla-city').value, state: $('#vla-state').value, zip: $('#vla-zip').value };
      var v = wrap.querySelector('input[name=vla-vs]:checked'); if (v && !$('#vla-p-vegan').hidden) body.vegan_status = v.value;
      // The home chapter comes from the address, so only the extra ones are saved.
      if (kind === 'show' || kind === 'work' || kind === 'person') body.communities = ['all'];
      else if (!$('#vla-p-ch').hidden) body.communities = $('#vla-all').checked ? ['all'] : Array.prototype.filter.call(wrap.querySelectorAll('input[name=vla-ch]:checked'), function (i) { return !i.disabled; }).map(function (i) { return i.value; });
      if (!$('#vla-kinds-wrap').hidden) body.product_kinds = vals('vla-kind');
      if (!$('#vla-cuis-wrap').hidden) body.cuisines = vals('vla-cuis');
      if (!$('#vla-vet-wrap').hidden) body.vetted = $('#vla-vet').checked;
      var ps = $('#vla-parent').value.trim();
      if (!$('#vla-p-locs').hidden && ps !== parentSlug) body.parent_slug = ps;
      if (!$('#vla-p-locs').hidden && $('#vla-loclabel').value.trim() !== (l.location_label || '')) body.location_label = $('#vla-loclabel').value.trim();
      if (!$('#vla-glance').hidden) {
        var flags = vals('vla-flag');
        body.details = { atmosphere: $('#vla-atm').value, accommodations: vals('vla-acc'), owned: vals('vla-own'),
          indoor_seating: flags.indexOf('indoor_seating') >= 0, late_hours: flags.indexOf('late_hours') >= 0, high_speed_wifi: flags.indexOf('high_speed_wifi') >= 0 };
      }
      btn.disabled = true; msg.className = 'msg'; msg.textContent = 'Saving...';
      fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + VEAuth.getToken() }, body: JSON.stringify(body) })
        .then(function (r) { return r.json(); }).then(function (d) {
          if (!d || !d.ok) { btn.disabled = false; bad(d && d.error === 'no_access' ? 'Admins only.' : d && d.error === 'bad_city' ? 'Add a city, or tick Online only.'
            : d && d.error === 'duplicate_listing' ? 'Another listing with this name is already ' + (isOnline ? 'online only' : 'in that city') + (d.other ? ': ' + d.other.name + ' (' + d.other.slug + (d.other.status === 'approved' ? '' : ', ' + d.other.status) + ')' : '') + '. Merge them or change one.'
            : d && d.error === 'parent_not_found' ? 'Part of: no listing has that address.' : d && d.error === 'parent_is_self' ? 'Part of: a listing cannot be part of itself.'
            : d && d.error === 'has_locations' ? 'Part of: this listing is the main listing of its own locations. Move those first.'
            : 'That did not save. Try again.' + (d && d.message ? ' (' + d.message + ')' : '')); return; }
          Object.assign(target, d.listing, { logo_url: l.logo_url });
          // The year, the type of book and a practice's kind are saved by ve-listing-media (admin_listing does not hold details).
          var yr = $('#vla-year').value.trim(), bt = ($('input[name=vla-bt]:checked') || {}).value || '', ht = ($('input[name=vla-ht]:checked') || {}).value || '';
          var health = !$('#vla-p-health').hidden && ht !== (l.health_type || '');
          var work = health || !$('#vla-p-work').hidden && (yr !== String(l.release_year || '') || (!$('#vla-bt-wrap').hidden && bt !== (l.book_type || '')));
          (work ? fetch(MEDIA_FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + VEAuth.getToken() },
              body: JSON.stringify(health ? { action: 'save', listing_id: l.id, health_type: ht } : { action: 'save', listing_id: l.id, release_year: yr, book_type: $('#vla-bt-wrap').hidden ? undefined : bt }) })
              .then(function (r) { return r.json(); }).then(function (x) {
                if (!x || !x.ok) throw new Error(x && x.error === 'bad_year' ? 'the year should be four digits.' : 'try again.');
                l.release_year = target.release_year = x.release_year; l.book_type = target.book_type = x.book_type; l.health_type = target.health_type = x.health_type;
              }) : Promise.resolve()).then(savePerson).then(afterWork, function (e) { btn.disabled = false; bad('Saved, but ' + e.message); });
          // A person's profile, links and socials go to ve-people.
          function savePerson() {
            if (kindOf($('#vla-sub').value) !== 'person') return;
            var links = Array.prototype.map.call(wrap.querySelectorAll('.vla-plink-u'), function (u, i) {
              return { label: wrap.querySelectorAll('.vla-plink-l')[i].value.trim(), url: u.value.trim() }; }).filter(function (x) { return x.url; });
            return people({ action: 'save', listing_id: l.id, title: $('#vla-ptitle').value.trim(), specialty: $('#vla-spec-wrap').hidden ? '' : (($('input[name=vla-spec]:checked') || {}).value || ''),
              links: links, bio: $('#vla-pbio').value, website: $('#vla-pweb').value.trim(), instagram: $('#vla-pig').value.trim(), facebook: $('#vla-pfb').value.trim(),
              tiktok: $('#vla-ptt').value.trim(), youtube: $('#vla-pyt').value.trim() }).then(function (x) { if (!x || !x.ok) throw new Error('their profile did not: ' + ((x && (x.message || x.error)) || 'try again.')); });
          }
          function afterWork() {
          // A changed feed is read at once, so a wrong one says so before the window closes.
          var rss = $('#vla-rss').value.trim();
          if ($('#vla-p-rss').hidden || rss === (l.rss_url || '')) { close(true); if (onSaved) onSaved(d.listing); return; }
          msg.className = 'msg'; msg.textContent = 'Saved. Reading the feed...';
          fetch(SB + '/functions/v1/ve-podcast', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + VEAuth.getToken() }, body: JSON.stringify({ action: 'admin_feed', listing_id: l.id, rss_url: rss }) })
            .then(function (r) { return r.json(); }).then(function (f) {
              btn.disabled = false;
              if (f && f.ok) { l.rss_url = rss; close(true); if (onSaved) onSaved(d.listing); return; }
              bad('Saved, but the feed did not read: ' + (f && f.error === 'bad_url' ? 'that is not a web address.' : (f && f.error) || 'try again.'));
            }).catch(function () { btn.disabled = false; bad('Saved, but the feed could not be reached. Try again.'); });
          }
        }).catch(function () { btn.disabled = false; bad('Could not connect. Try again.'); });
    };
  }
  window.VEListingAdmin = { isAdmin: isAdmin, edit: edit, css: css, SECTIONS: SECTIONS, CUISINES: CUISINES };
})();
