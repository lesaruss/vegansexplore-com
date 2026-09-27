/* Quick listing editor for superadmins (Sean, 2026-09-27): from any city hub card or listing
 * page, change a listing's section (or add it to more sections, like a restaurant that also
 * caters), set how Vegan it is, or mark it closed. Nobody else sees it: the button only
 * renders for a signed-in superadmin (not while previewing the site as someone else), and
 * ve-claims admin_listing checks is_superadmin again before saving.
 *
 *   VEListingAdmin.isAdmin()               true for a signed-in superadmin
 *   VEListingAdmin.edit(listing, onSaved)  opens the editor; onSaved(updatedFields) after a save
 * The listing needs id, name, category, extra_categories, vegan_status and business_status.
 */
(function () {
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-claims';
  // The sections, grouped the way the city hubs show them (CAT_MAP in ve-region-directory.js).
  var GROUPS = [
    ['Food', ['Restaurants', 'Bakeries & Cafes', 'Food Brands', 'Catering', 'Meal Prep']],
    ['Products', ['Brands', 'Beauty and Personal Care', 'Clothing and Fashion', 'E-Commerce & Marketplaces', 'Fitness and Athletics']],
    ['Services', ['Health and Wellness', 'Coaches and Consultants']],
    ['Community', ['Community Partner', 'Nonprofits']],
    ['Not shown on the hubs', ['Events and Catering', 'Media', 'Uncategorized', 'AI & Automation', 'Web & Development', 'Marketing & Growth', 'Business Operations', 'Branding & Creative Assets', 'Content Creation & Media']]
  ];
  var VEGAN = [['fully_vegan', '100% Vegan'], ['vegan_friendly', 'Vegan-friendly'], ['vegan_options', 'Vegan options']];
  var OPEN = [['OPERATIONAL', 'Open'], ['CLOSED_TEMPORARILY', 'Temporarily closed'], ['CLOSED_PERMANENTLY', 'Permanently closed']];
  var CSS = '#vla{position:fixed;inset:0;z-index:9997;background:rgba(10,20,12,.6);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Montserrat,sans-serif}' +
    '#vla .box{background:#fff;border-radius:14px;max-width:560px;width:100%;max-height:calc(100vh - 32px);overflow:auto;padding:22px 22px 18px;color:#1a1a1a;box-shadow:0 24px 60px rgba(0,0,0,.35)}' +
    '#vla h2{font-size:17px;font-weight:900;margin:0 0 2px}#vla .who{font-size:12px;color:#666;margin-bottom:14px}' +
    '#vla label.h{display:block;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#1f5f22;margin:14px 0 6px}' +
    '#vla select{width:100%;font:inherit;font-size:14px;padding:9px 10px;border:1px solid rgba(0,0,0,.25);border-radius:8px;background:#fff;color:#1a1a1a}' +
    '#vla .extras{display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:13px}#vla .extras b{grid-column:1/-1;font-size:11px;color:#666;margin-top:6px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}' +
    '#vla .extras label{display:flex;gap:7px;align-items:center;cursor:pointer;min-height:28px}#vla .extras input,#vla .seg input{accent-color:#1f5f22;width:16px;height:16px}' +
    '#vla .seg{display:flex;flex-wrap:wrap;gap:6px}#vla .seg label{display:flex;gap:6px;align-items:center;font-size:13px;font-weight:700;border:1px solid rgba(0,0,0,.18);border-radius:99px;padding:6px 12px;cursor:pointer}' +
    '#vla .seg label:has(input:checked){background:#EAF7EA;border-color:#2d7d31}' +
    '#vla .acts{display:flex;gap:8px;justify-content:flex-end;align-items:center;margin-top:18px}#vla .msg{flex:1;font-size:13px;font-weight:700;color:#1f5f22}#vla .msg.bad{color:#8a1c12}' +
    '#vla button{font:inherit;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;border-radius:8px;padding:10px 16px;cursor:pointer;min-height:40px}' +
    '#vla .save{background:#1f5f22;color:#fff;border:0}#vla .save:disabled{opacity:.5}#vla .cancel{background:#fff;color:#1f5f22;border:1px solid rgba(0,0,0,.25)}' +
    '@media(max-width:480px){#vla .extras{grid-template-columns:1fr}}' +
    '.vla-edit{font-family:Montserrat,sans-serif;font-size:9.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:4px 9px;border-radius:4px;border:1px dashed #b7791f;background:#fffaf0;color:#7a4b00;cursor:pointer}' +
    '.vla-edit:hover{background:#fff1d6}';

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function isAdmin() {
    var m = window.VEAuth && VEAuth.getMember ? VEAuth.getMember() : null; // null while previewing as public
    return !!(m && m.is_superadmin && VEAuth.isLoggedIn());
  }
  function css() { if (!document.getElementById('vla-css')) { var st = document.createElement('style'); st.id = 'vla-css'; st.textContent = CSS; document.head.appendChild(st); } }
  function radios(name, list, cur) {
    return '<div class="seg">' + list.map(function (o) { return '<label><input type="radio" name="' + name + '" value="' + o[0] + '"' + (o[0] === cur ? ' checked' : '') + '>' + o[1] + '</label>'; }).join('') + '</div>';
  }
  function edit(l, onSaved) {
    if (!isAdmin()) return;
    css();
    var old = document.getElementById('vla'); if (old) old.remove();
    var extra = l.extra_categories || [], vs = l.vegan_status === 'vegan' ? 'fully_vegan' : (l.vegan_status || ''), bs = l.business_status || 'OPERATIONAL';
    var main = GROUPS.map(function (g) {
      return '<optgroup label="' + esc(g[0]) + '">' + g[1].map(function (c) { return '<option' + (c === l.category ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</optgroup>';
    }).join('');
    var known = GROUPS.some(function (g) { return g[1].indexOf(l.category) >= 0; });
    var boxes = GROUPS.slice(0, 4).map(function (g) {
      return '<b>' + esc(g[0]) + '</b>' + g[1].map(function (c) { return '<label><input type="checkbox" value="' + esc(c) + '"' + (extra.indexOf(c) >= 0 ? ' checked' : '') + '>' + esc(c) + '</label>'; }).join('');
    }).join('');
    var wrap = document.createElement('div'); wrap.id = 'vla';
    wrap.innerHTML = '<div class="box" role="dialog" aria-modal="true" aria-labelledby="vla-t">' +
      '<h2 id="vla-t">' + esc(l.name) + '</h2><div class="who">Admin only. Changes are live as soon as you save.</div>' +
      '<label class="h" for="vla-main">Main section</label><select id="vla-main">' + (known ? '' : '<option selected>' + esc(l.category || '') + '</option>') + main + '</select>' +
      '<label class="h">Also show it under</label><div class="extras" id="vla-extra">' + boxes + '</div>' +
      '<label class="h">How Vegan</label>' + radios('vla-vs', VEGAN, vs) +
      '<label class="h">Open or closed</label>' + radios('vla-bs', OPEN, bs) +
      '<div class="acts"><span class="msg" id="vla-msg" role="status"></span><button type="button" class="cancel" id="vla-x">Cancel</button><button type="button" class="save" id="vla-s">Save</button></div></div>';
    document.body.appendChild(wrap);
    function close() { wrap.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    wrap.querySelector('#vla-x').onclick = close;
    // The main section never doubles as an extra one.
    function syncExtras() { var m = wrap.querySelector('#vla-main').value; wrap.querySelectorAll('#vla-extra input').forEach(function (i) { i.disabled = i.value === m; if (i.disabled) i.checked = false; }); }
    wrap.querySelector('#vla-main').addEventListener('change', syncExtras); syncExtras();
    wrap.querySelector('#vla-main').focus();
    wrap.querySelector('#vla-s').onclick = function () {
      var btn = this, msg = wrap.querySelector('#vla-msg');
      var body = { action: 'admin_listing', listing_id: l.id, category: wrap.querySelector('#vla-main').value,
        extra_categories: Array.prototype.map.call(wrap.querySelectorAll('#vla-extra input:checked'), function (i) { return i.value; }),
        business_status: (wrap.querySelector('input[name=vla-bs]:checked') || {}).value || 'OPERATIONAL' };
      var v = wrap.querySelector('input[name=vla-vs]:checked'); if (v) body.vegan_status = v.value;
      btn.disabled = true; msg.className = 'msg'; msg.textContent = 'Saving...';
      fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + VEAuth.getToken() }, body: JSON.stringify(body) })
        .then(function (r) { return r.json(); }).then(function (d) {
          if (!d || !d.ok) { btn.disabled = false; msg.className = 'msg bad'; msg.textContent = d && d.error === 'no_access' ? 'Admins only.' : 'That did not save. Try again.'; return; }
          Object.assign(l, d.listing); close(); if (onSaved) onSaved(d.listing);
        }).catch(function () { btn.disabled = false; msg.className = 'msg bad'; msg.textContent = 'Could not connect. Try again.'; });
    };
  }
  window.VEListingAdmin = { isAdmin: isAdmin, edit: edit, css: css };
})();
