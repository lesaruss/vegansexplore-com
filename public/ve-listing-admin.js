/* Quick listing editor for superadmins (Sean, 2026-09-27), from any city hub card or listing
 * page: rename a listing, change its location, pick its main section and sub-section (and more
 * sub-sections in the same section, like a restaurant that also caters), set how Vegan it is,
 * mark it closed, and, for restaurants and cafes, fill in the At a Glance details (atmosphere,
 * seating, amenities, accessibility, ownership) that Love Life Cafe shows.
 *
 * Logo (Sean, 2026-09-29: "upload the logos directly on the listings"): upload one, copy a logo
 * still linked from the business's own site into our storage, or remove it. A logo change saves
 * right away through ve-media-library (logo_set / logo_fetch), the same path as Depot > Logos.
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
    ['Food', ['Restaurants', 'Bakeries & Cafes', 'Food Trucks & Vendors', 'Markets', 'Food Brands', 'Catering', 'Meal Prep']],
    ['Products', ['Brands', 'Clothing and Fashion', 'Beauty and Personal Care', 'Fitness and Athletics', 'E-Commerce & Marketplaces']],
    ['Services', ['Health and Wellness', 'Coaches and Consultants', 'Marketing & Growth', 'Branding & Creative Assets', 'Content Creation & Media', 'Web & Development', 'AI & Automation', 'Business Operations']],
    ['Media', ['Podcasts', 'YouTube', 'News Outlets', 'Documentaries & Films', 'Books', 'Media']],
    ['Community', ['Community Partner', 'Nonprofits', 'Events']]
  ];
  var SUB_LABEL = { 'Media': 'Other media' };
  // At a Glance belongs to places you sit down in.
  var DINING = ['Restaurants', 'Bakeries & Cafes'];
  var VEGAN = [['fully_vegan', '100% Vegan'], ['vegan_friendly', 'Vegan-friendly'], ['vegan_options', 'Vegan options']];
  var OPEN = [['OPERATIONAL', 'Open'], ['CLOSED_TEMPORARILY', 'Temporarily closed'], ['CLOSED_PERMANENTLY', 'Permanently closed']];
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
    '#vla .row{display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px}#vla .row2{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
    '#vla .chips{display:flex;flex-wrap:wrap;gap:6px}#vla .chips label{display:flex;gap:6px;align-items:center;font-size:12.5px;font-weight:700;border:1px solid rgba(0,0,0,.18);border-radius:99px;padding:5px 11px;cursor:pointer;min-height:32px}' +
    '#vla .chips label:has(input:checked){background:#EAF7EA;border-color:#2d7d31}#vla .chips label:has(input:disabled){opacity:.45;cursor:default}' +
    '#vla .chips input{accent-color:#1f5f22;width:15px;height:15px;margin:0}' +
    '#vla .check{display:flex;gap:8px;align-items:center;font-size:13px;font-weight:700;margin:8px 0 4px;cursor:pointer}#vla .check input{width:17px;height:17px;accent-color:#1f5f22}' +
    '#vla .note{font-size:12px;color:#666;margin-top:4px}' +
    '#vla .acts{display:flex;gap:8px;justify-content:flex-end;align-items:center;margin-top:18px;position:sticky;bottom:-18px;background:#fff;padding:12px 0 4px}#vla .msg{flex:1;font-size:13px;font-weight:700;color:#1f5f22}#vla .msg.bad{color:#8a1c12}' +
    '#vla button{font:inherit;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;border-radius:8px;padding:10px 16px;cursor:pointer;min-height:40px}' +
    '#vla .save{background:#1f5f22;color:#fff;border:0}#vla .save:disabled{opacity:.5}#vla .cancel{background:#fff;color:#1f5f22;border:1px solid rgba(0,0,0,.25)}' +
    '@media(max-width:520px){#vla .row{grid-template-columns:1fr 1fr}#vla .row .street{grid-column:1/-1}}' +
    '.vla-edit{font-family:Montserrat,sans-serif;font-size:9.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:4px 9px;border-radius:4px;border:1px dashed #b7791f;background:#fffaf0;color:#7a4b00;cursor:pointer}' +
    '.vla-edit:hover{background:#fff1d6}' +
    '#vla .logo{display:flex;gap:14px;align-items:center;flex-wrap:wrap}#vla .logo-img{width:72px;height:72px;border-radius:12px;border:1px solid rgba(0,0,0,.12);background:#fff center/contain no-repeat;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px;color:#fff;flex:0 0 auto}' +
    '#vla .logo-btns{display:flex;flex-wrap:wrap;gap:6px;flex:1;min-width:0}#vla .logo-btns button{background:#fff;color:#1f5f22;border:1px solid rgba(0,0,0,.25);padding:8px 12px;min-height:38px}#vla .logo-btns .rm{color:#8a1c12}' +
    '#vla .logo-msg{flex-basis:100%;font-size:12.5px;font-weight:700;color:#1f5f22;min-height:18px}#vla .logo-msg.bad{color:#8a1c12}';
  var FIELDS = 'id,slug,name,logo_url,initials,color,category,extra_categories,vegan_status,business_status,address_street,address_city,address_state,address_zip,atmosphere,accommodations,indoor_seating,late_hours,high_speed_wifi,is_black_owned,is_women_owned,is_latino_owned,is_asian_owned,is_lgbtq_owned,is_immigrant_owned,is_veteran_owned,is_indigenous_owned,is_family_owned,lgbtq_friendly';

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
      '<label class="h" for="vla-name">Business name</label><input type="text" id="vla-name" maxlength="160" value="' + esc(l.name) + '">' +

      '<h3>Logo</h3><div class="logo"><div class="logo-img" id="vla-logo"></div><div class="logo-btns">' +
      '<button type="button" id="vla-up">Upload a logo</button><button type="button" id="vla-copy" hidden>Copy it into our storage</button><button type="button" class="rm" id="vla-rm" hidden>Remove</button>' +
      '<input type="file" id="vla-file" accept="image/*" hidden></div><div class="logo-msg" id="vla-lmsg" role="status"></div></div>' +

      '<h3>Location</h3>' +
      '<label class="check"><input type="checkbox" id="vla-online"' + (online ? ' checked' : '') + '> Online only, no storefront</label>' +
      '<div id="vla-addr"><div class="row"><div class="street"><label class="h" for="vla-st">Street</label><input type="text" id="vla-st" value="' + esc(l.address_street) + '"></div>' +
      '<div><label class="h" for="vla-city">City</label><input type="text" id="vla-city" value="' + esc(l.address_city) + '"></div>' +
      '<div class="row2"><div><label class="h" for="vla-state">State</label><input type="text" id="vla-state" maxlength="40" value="' + esc(l.address_state) + '"></div>' +
      '<div><label class="h" for="vla-zip">Zip</label><input type="text" id="vla-zip" maxlength="12" value="' + esc(l.address_zip) + '"></div></div></div>' +
      '<div class="note">The city decides which hub it shows on. The map pin follows the street address.</div></div>' +

      '<h3>Section</h3>' +
      '<label class="h">Main section</label><div class="chips" id="vla-sec">' + SECTIONS.map(function (s) { return chip('radio', 'vla-sec', s[0], s[0], s[0] === sec); }).join('') + '</div>' +
      '<label class="h" for="vla-sub">Sub-section</label><select id="vla-sub"></select>' +
      '<label class="h">Also show it under</label><div class="chips" id="vla-extra"></div>' +

      '<h3>How Vegan</h3><div class="chips">' + VEGAN.map(function (o) { return chip('radio', 'vla-vs', o[0], o[1], o[0] === vs); }).join('') + '</div>' +
      '<h3>Open or closed</h3><div class="chips">' + OPEN.map(function (o) { return chip('radio', 'vla-bs', o[0], o[1], o[0] === bs); }).join('') + '</div>' +

      '<div id="vla-glance"><h3>At a Glance <span style="font-weight:700;letter-spacing:0;text-transform:none;color:#666">(restaurants and cafes)</span></h3>' +
      '<label class="h" for="vla-atm">Atmosphere</label><select id="vla-atm">' + ATMOS.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === (l.atmosphere || '') ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
      glance + '</div>' +

      '<div class="acts"><span class="msg" id="vla-msg" role="status"></span><button type="button" class="cancel" id="vla-x">Cancel</button><button type="button" class="save" id="vla-s">Save</button></div></div>';
    document.body.appendChild(wrap);
    var $ = function (sel) { return wrap.querySelector(sel); };

    // Sub-sections follow the main section; the extra ones stay inside the same section.
    function drawSubs(keepSub) {
      var s = ($('input[name=vla-sec]:checked') || {}).value, subs = subsOf(s), cur = keepSub && subs.indexOf(keepSub) >= 0 ? keepSub : subs[0];
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
    }
    wrap.querySelectorAll('input[name=vla-sec]').forEach(function (r) { r.addEventListener('change', function () { drawSubs(null); }); });
    $('#vla-sub').addEventListener('change', syncSub);
    $('#vla-extra').addEventListener('change', syncSub);
    drawSubs(l.category);
    // ---- Logo: saves on its own, right away.
    var logoChanged = false;
    function drawLogo(msg, bad) {
      var box = $('#vla-logo'), u = l.logo_url || '';
      if (u) { box.style.backgroundImage = 'url("' + u.replace(/"/g, '%22') + '")'; box.style.backgroundColor = '#fff'; box.textContent = ''; box.setAttribute('aria-label', 'Current logo'); }
      else { box.style.backgroundImage = ''; box.style.backgroundColor = l.color || '#1f5f22'; box.textContent = l.initials || String(l.name || '?').slice(0, 2).toUpperCase(); box.setAttribute('aria-label', 'No logo yet, the initials show instead'); }
      $('#vla-up').textContent = u ? 'Replace the logo' : 'Upload a logo';
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
        l.logo_url = saved.logo_url; target.logo_url = saved.logo_url; target.logo_alt_text = saved.logo_alt_text; logoChanged = true;
        drawLogo(saved.logo_url ? 'Saved. The logo is live now.' : 'Removed. The initials show now.');
      }, function (e) {
        drawLogo(e && e.message === 'not_an_image' ? 'That file is not a picture.' : e && e.message === 'fetch_failed' ? 'Their website would not hand over the logo. Upload it instead.' : 'That did not save. Try again.', true);
      }).then(function () { btns.forEach(function (b) { b.disabled = false; }); });
    }
    $('#vla-up').onclick = function () { $('#vla-file').click(); };
    $('#vla-file').onchange = function () {
      var f = this.files && this.files[0]; this.value = ''; if (!f) return;
      logoWork('Adding the logo...', function () { return uploader().then(function (U) { return U.setLogo(VEAuth.getToken(), f, l); }); });
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
    $('#vla-name').focus();

    $('#vla-s').onclick = function () {
      var btn = this, msg = $('#vla-msg');
      function bad(t) { msg.className = 'msg bad'; msg.textContent = t; }
      var name = $('#vla-name').value.trim();
      if (!name) return bad('The business needs a name.');
      var isOnline = $('#vla-online').checked;
      if (!isOnline && !$('#vla-city').value.trim()) return bad('Add a city, or tick Online only.');
      var vals = function (n) { return Array.prototype.map.call(wrap.querySelectorAll('input[name=' + n + ']:checked'), function (i) { return i.value; }); };
      var body = { action: 'admin_listing', listing_id: l.id, name: name, category: $('#vla-sub').value, extra_categories: vals('vla-extra'),
        business_status: (wrap.querySelector('input[name=vla-bs]:checked') || {}).value || 'OPERATIONAL',
        address: isOnline ? { online: true } : { street: $('#vla-st').value, city: $('#vla-city').value, state: $('#vla-state').value, zip: $('#vla-zip').value } };
      var v = wrap.querySelector('input[name=vla-vs]:checked'); if (v) body.vegan_status = v.value;
      if (!$('#vla-glance').hidden) {
        var flags = vals('vla-flag');
        body.details = { atmosphere: $('#vla-atm').value, accommodations: vals('vla-acc'), owned: vals('vla-own'),
          indoor_seating: flags.indexOf('indoor_seating') >= 0, late_hours: flags.indexOf('late_hours') >= 0, high_speed_wifi: flags.indexOf('high_speed_wifi') >= 0 };
      }
      btn.disabled = true; msg.className = 'msg'; msg.textContent = 'Saving...';
      fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + VEAuth.getToken() }, body: JSON.stringify(body) })
        .then(function (r) { return r.json(); }).then(function (d) {
          if (!d || !d.ok) { btn.disabled = false; bad(d && d.error === 'no_access' ? 'Admins only.' : d && d.error === 'bad_city' ? 'Add a city, or tick Online only.' : 'That did not save. Try again.'); return; }
          Object.assign(target, d.listing, { logo_url: l.logo_url }); close(true); if (onSaved) onSaved(d.listing);
        }).catch(function () { btn.disabled = false; bad('Could not connect. Try again.'); });
    };
  }
  window.VEListingAdmin = { isAdmin: isAdmin, edit: edit, css: css, SECTIONS: SECTIONS };
})();
