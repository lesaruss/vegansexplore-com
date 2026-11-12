/* ve-branddesk-client.js: a managed client's own space (BrandDesk, canon canon-ve-front-of-house; onboarding built 2026-10-31).
 * "They rent the service, they own the assets" (Sean, 2026-10-31): their Library, their asset sheet and how onboarding stands.
 *
 *   VEBrandDesk.mount(el, { slug | account_id, view: 'start'|'website'|'library'|'sheet'|'reports'|'campaigns'|'social', report: id, go: function (view) {}, admin: bool, load?: fn -> Promise })
 *
 * Three views, one at a time:
 *   start    Getting started: the onboarding checklist (ve-branddesk steps), their plan, and where things are
 *   library  every file we made for them, by kind, with Download and Download everything (a ZIP built in the browser, with the asset
 *            sheet and the menu as a spreadsheet inside). Full size opens once the setup is paid in full; their old website is
 *            always theirs.
 *   sheet    the asset sheet: everything about the business in one place, from their Cartridge (ve_cartridges), with Download the
 *            menu (CSV) and Download the asset sheet (HTML)
 *   website    Your website (the website launch, ve-branddesk site_*): the private preview, the owner's approval (their name typed) or
 *              changes, their domain with the DNS records to add, SSL, the final check of every page, and every step with who and when.
 *              Admin (Depot) adds Build their website, the look, Send it for their OK, Add their domain, Check it, Run the final check.
 *   social     Your social (the social add-on): posts waiting for the owner's OK, coming up and posted (social_get / social_decide)
 *   campaigns  Your campaigns: the month's campaign from the rotation (ve_branddesk_campaigns), when, and how it went
 *   insights   Insights: the latest month's numbers against the month before (from the latest sent report), and what is waiting on them
 *   kit        Your brand kit: each part (logo, colors, type, voice, story, menu, photos, details) and where it stands, from their Cartridge
 *   reports  Monthly reports: each month's check-in once it is sent (ve-branddesk checkin_get), one report per view
 *   VEBrandDesk.reportHtml(checkin, steps) draws a report; /business/checkin uses it for the preview.
 * admin: true (Depot > BrandDesk) adds ticking steps, Archive their website and adding files to the Library.
 * load stands in for the server on the sample business (/business/sample), which has no account.
 */
(function () {
  if (window.VEBrandDesk) return;
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-branddesk';
  var KINDS = [['photo', 'Photos'], ['video', 'Videos'], ['logo', 'Logo files'], ['brand', 'Brand kit'], ['graphic', 'Graphics'], ['menu_board', 'Menu boards'], ['document', 'Documents'], ['archive', 'Your old website']];
  var KIND_WORD = {}; KINDS.forEach(function (k) { KIND_WORD[k[0]] = k[1]; });
  var PLAN = { full: 'Setup paid in full', '3': 'Setup in 3 monthly payments', '6': 'Setup in 6 monthly payments' };
  // The plan in words: pricing_v9 (Site or Managed, canon canon-ve-front-of-house v9), the $1,500 setup plan before it (managed_v1),
  // or the account's own line when it is billed on its own terms (plan_line, HQ client billing).
  function planText(A) {
    if (A.plan_line) return A.plan_line;
    var adds = (A.addons || []).map(function (x) { return x === 'photos' ? 'photos' : x === 'video' ? 'a video' : x; });
    var addW = adds.length ? ', with ' + adds.join(' and ') : '';
    if (A.plan === 'site') return 'Site, $500 every 3 months' + addW;
    if (A.plan === 'managed') return 'Managed, $500 a month' + (A.social ? ', plus $500 a month for social media' : '') + ', setup paid' + addW;
    return (PLAN[A.setup_plan] || '') + ', then $500 a month' + (A.social ? ', plus $500 a month for social media' : '');
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function day(d) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''; }
  function size(b) { b = Number(b || 0); return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : b > 1024 ? Math.round(b / 1024) + ' KB' : b ? b + ' B' : ''; }
  function token() { try { return (window.VEAuth && VEAuth.getToken && VEAuth.getToken()) || ''; } catch (e) { return ''; } }
  function api(body) {
    return fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); });
  }
  function css() {
    if (document.getElementById('vebdStyle')) return;
    var s = document.createElement('style'); s.id = 'vebdStyle';
    s.textContent = '.vebd{font-family:Montserrat,system-ui,sans-serif;color:#14261a;}' +
      '.vebd-sub{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 16px;}.vebd-sub a{font-size:13px;font-weight:800;padding:9px 14px;border-radius:6px;border:1px solid rgba(0,0,0,.18);color:#14261a;text-decoration:none;background:#fff;}' +
      '.vebd-sub a.on{border-color:var(--vb-accent,#1E7A3E);box-shadow:inset 0 -3px 0 var(--vb-accent,#1E7A3E);}' +
      '.vebd-ins{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;}@media(max-width:620px){.vebd-ins{grid-template-columns:repeat(2,minmax(0,1fr));}}' +
      '.vebd-ins-t{border:1px solid rgba(0,0,0,.1);border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:2px;}.vebd-ins-t b{font-size:24px;font-weight:900;}.vebd-ins-t span{font-size:13px;font-weight:700;}.vebd-ins-t small{font-size:12px;font-weight:700;}.vebd-ins-t small.up{color:#1E5F2A;}.vebd-ins-t small.dn{color:#a33;}' +
      '.vebd-ins-bar{display:grid;grid-template-columns:minmax(110px,190px) 1fr 40px 48px;gap:10px;align-items:center;font-size:13px;margin:6px 0;}.vebd-ins-bar i{display:block;height:10px;background:#eef1ee;border-radius:5px;overflow:hidden;}.vebd-ins-bar em{display:block;height:100%;background:var(--vb-accent,#1E7A3E);border-radius:5px;}.vebd-ins-bar b{text-align:right;}.vebd-ins-bar small{color:#1E5F2A;font-weight:700;}' +
      '.vebd-kit-row{display:flex;gap:12px;align-items:center;}.vebd-kit-row>span{display:flex;flex-direction:column;gap:3px;}.vebd-kit-logo{width:44px;height:44px;border-radius:8px;background:#fff center/contain no-repeat;border:1px solid rgba(0,0,0,.1);}.vebd-kit-sw{display:flex;gap:4px;}.vebd-kit-sw i{width:22px;height:22px;border-radius:5px;border:1px solid rgba(0,0,0,.12);}' +
      '.vebd-card{background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:12px;padding:16px 18px;margin:0 0 16px;}' +
      '.vebd-list li.vebd-soc{display:grid;grid-template-columns:120px minmax(0,1fr);gap:14px;align-items:start;justify-content:stretch;}.vebd-form[hidden]{display:none;}.vebd-form textarea{font:inherit;font-size:14px;border:1px solid rgba(0,0,0,.22);border-radius:6px;padding:8px 10px;width:100%;box-sizing:border-box;}.vebd-soc-pics{display:grid;grid-template-columns:1fr 1fr;gap:4px;}' +
      '.vebd-soc-pics .th{display:block;aspect-ratio:1;border-radius:8px;background:#eef1ee center/cover no-repeat;}.vebd-soc-pics .th:only-child{grid-column:1/-1;}' +
      '.vebd-soc-pics .th.none{display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#555;text-transform:capitalize;grid-column:1/-1;}' +
      '.vebd-soc-cap{font-size:14.5px;line-height:1.55;margin:8px 0 0;white-space:normal;}.vebd-soc-ask{margin-top:10px;}.vebd-soc-ask .vebd-form{margin-top:10px;}' +
      '@media(max-width:560px){.vebd-list li.vebd-soc{grid-template-columns:84px minmax(0,1fr);gap:10px;}}' +
      '.vebd h4{font-size:15px;font-weight:900;margin:0 0 10px;}.vebd p{font-size:14px;line-height:1.6;margin:0 0 10px;}' +
      '.vebd-muted{color:rgba(0,0,0,.62);font-size:13px;}.vebd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr));gap:14px;}' +
      '.vebd-step{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:10px;align-items:start;padding:11px 0;border-top:1px solid rgba(0,0,0,.07);}' +
      '.vebd-step:first-child{border-top:0;}.vebd-dot{width:24px;height:24px;border-radius:50%;border:2px solid rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:#fff;}' +
      '.vebd-step.done .vebd-dot{background:var(--vb-accent,#1E7A3E);border-color:var(--vb-accent,#1E7A3E);}.vebd-step b{font-size:14px;display:block;}.vebd-step small{font-size:12.5px;color:rgba(0,0,0,.6);}' +
      '.vebd-btn{font:inherit;font-size:12.5px;font-weight:800;padding:9px 14px;min-height:38px;border-radius:6px;cursor:pointer;border:0;background:var(--vb-accent,#1E7A3E);color:#fff;text-decoration:none;display:inline-flex;align-items:center;gap:6px;}' +
      '.vebd-btn.o{background:#fff;color:#14261a;border:1px solid rgba(0,0,0,.22);}.vebd-btn.sm{font-size:11.5px;padding:6px 11px;min-height:32px;}.vebd-btn:disabled{opacity:.55;cursor:wait;}' +
      '.vebd-bar{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:0 0 14px;}' +
      '.vebd-pill{font-size:11px;font-weight:800;padding:3px 8px;border-radius:5px;background:#eef1ee;color:#333;white-space:nowrap;}.vebd-pill.ok{background:#e3f3e5;color:#1E5F2A;}.vebd-pill.wait{background:#fff4e0;color:#8a5200;}' +
      '.vebd-files{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(220px,100%),1fr));gap:12px;}' +
      '.vebd-file{border:1px solid rgba(0,0,0,.1);border-radius:12px;overflow:hidden;background:#fff;display:flex;flex-direction:column;}' +
      '.vebd-file .th{aspect-ratio:4/3;background:#f2f4f1 center/cover no-repeat;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:rgba(0,0,0,.45);text-transform:uppercase;letter-spacing:.08em;}' +
      '.vebd-file .th.logo{background-size:contain;background-color:#3c4a3f;background-origin:content-box;padding:14px;}' +
      '.vebd-file .bd{padding:10px 12px;display:flex;flex-direction:column;gap:6px;flex:1;}.vebd-file b{font-size:13px;line-height:1.35;overflow-wrap:anywhere;}' +
      '.vebd-file .row{display:flex;gap:6px;align-items:center;justify-content:space-between;margin-top:auto;}' +
      '.vebd-chips{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px;}.vebd-chips button{font:inherit;font-size:12px;font-weight:800;padding:7px 11px;border-radius:6px;border:1px solid rgba(0,0,0,.16);background:#fff;cursor:pointer;color:#14261a;}' +
      '.vebd-chips button.on{background:var(--vb-accent,#1E7A3E);border-color:var(--vb-accent,#1E7A3E);color:#fff;}' +
      '.vebd-sw{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(150px,100%),1fr));gap:10px;}.vebd-sw div{border:1px solid rgba(0,0,0,.1);border-radius:10px;overflow:hidden;font-size:12.5px;}' +
      '.vebd-sw i{display:block;height:54px;}.vebd-sw span{display:block;padding:7px 9px;}' +
      '.vebd-kv{display:grid;grid-template-columns:160px minmax(0,1fr);gap:6px 14px;font-size:14px;}.vebd-kv dt{font-weight:800;color:rgba(0,0,0,.65);}.vebd-kv dd{margin:0;overflow-wrap:anywhere;}' +
      '.vebd-menu{width:100%;border-collapse:collapse;font-size:13.5px;}.vebd-menu th,.vebd-menu td{text-align:left;padding:8px 8px;border-top:1px solid rgba(0,0,0,.08);vertical-align:top;}' +
      '.vebd-menu th{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(0,0,0,.6);border-top:0;}.vebd-menu .sec td{font-weight:900;background:#f6f8f5;}' +
      '.vebd-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:10px 12px;align-items:end;}' +
      '.vebd-form label{font-size:12px;font-weight:800;display:flex;flex-direction:column;gap:4px;}.vebd-form input,.vebd-form select{font:inherit;font-size:14px;min-height:40px;border:1px solid rgba(0,0,0,.22);border-radius:6px;padding:8px 10px;background:#fff;}' +
      '.vebd-menu select{font:inherit;font-size:13.5px;min-height:36px;padding:6px 40px 6px 10px;border:1px solid rgba(0,0,0,.25);border-radius:6px;appearance:none;-webkit-appearance:none;background:#fff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%23333\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E") no-repeat right 14px center;}' +
      '.vebd-form select{appearance:none;-webkit-appearance:none;padding-right:44px;background:#fff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%23333\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E") no-repeat right 16px center;}' +
      '.vebd-msg{font-size:12.5px;font-weight:700;min-height:18px;color:var(--vb-accent,#1E7A3E);}.vebd-msg.bad{color:#B42318;}' +
      '.vebd-nums{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(170px,100%),1fr));gap:10px;margin:0 0 6px;}.vebd-num{border:1px solid rgba(0,0,0,.1);border-radius:10px;padding:12px 14px;}' +
      '.vebd-num b{display:block;font-size:26px;font-weight:900;line-height:1.1;}.vebd-num span{font-size:12.5px;color:rgba(0,0,0,.62);}.vebd-num i{font-style:normal;font-size:12px;font-weight:800;}.vebd-num i.up{color:#1E5F2A;}.vebd-num i.dn{color:#8a5200;}' +
      '.vebd-rep p.lead{font-size:15px;}.vebd-list{list-style:none;margin:0;padding:0;}.vebd-list li{display:flex;gap:10px;justify-content:space-between;align-items:center;padding:11px 0;border-top:1px solid rgba(0,0,0,.07);}.vebd-list li:first-child{border-top:0;}' +
      '@media(max-width:640px){.vebd-kv{grid-template-columns:1fr;gap:2px;}.vebd-kv dd{margin-bottom:8px;}.vebd-menu .was{display:none;}}';
    document.head.appendChild(s);
  }

  // ---- The asset sheet, from the Cartridge (or the listing until the brand kit has it)
  function sheetModel(D) {
    var c = (D.cartridge && D.cartridge.data) || {}, l = D.listing || {};
    var info = c.info || {}, addr = info.address || {}, links = info.links || {};
    var hours = info.hours || l.google_hours_json || {};
    // Google's hours come as a JSON string of [{day, hours}] or as {Day: text}.
    if (typeof hours === 'string') { try { hours = JSON.parse(hours); } catch (e) { hours = {}; } }
    if (Array.isArray(hours)) { var h = {}; hours.forEach(function (x) { if (x && x.day) h[x.day] = x.hours || x.text || ''; }); hours = h; }
    return {
      name: (c.business && c.business.name) || l.name || '',
      kind: (c.business && c.business.kind) || l.category || '', vegan: (c.business && c.business.vegan) || '',
      cuisines: (c.business && c.business.cuisines) || [],
      story: c.story || { tagline: l.tagline || '', short: l.description || '' },
      voice: c.voice || null, brand: c.brand || {}, menu: (c.menu && c.menu.sections) || [],
      address: [addr.street || l.address_street, addr.city || l.address_city, (addr.state || l.address_state || '') + ' ' + (addr.zip || l.address_zip || '')].filter(function (x) { return x && x.trim(); }).join(', '),
      phone: info.phone || l.phone || '', email: info.email || l.email || '', hours: hours, details: info.details || [],
      links: { website: links.website || l.website || '', instagram: links.instagram || l.instagram || '', facebook: links.facebook || l.facebook || '', tiktok: links.tiktok || l.tiktok || '', youtube: l.youtube || '' },
      google: l.google_place_id ? 'https://www.google.com/maps/place/?q=place_id:' + l.google_place_id : (links.google || ''),
      ordering: info.ordering || null, from_kit: !!D.cartridge, updated: D.cartridge ? D.cartridge.updated_at : null
    };
  }
  function sheetHtml(S, forFile) {
    var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    var kv = function (rows) { return '<dl class="vebd-kv">' + rows.filter(function (r) { return r[1]; }).map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl>'; };
    var a = function (u) { if (u && !/^(https?:)?\/\//.test(u) && u.charAt(0) !== '/') return esc(u); return u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(String(u).replace(/^https?:\/\//, '')) + '</a>' : ''; };
    var st = S.story || {}, v = S.voice, b = S.brand || {};
    var out = '<section class="vebd-card"><h4>The business</h4>' + kv([['Name', esc(S.name)], ['Kind', esc(S.kind)], ['How Vegan', esc(S.vegan)], ['Food', esc((S.cuisines || []).join(', '))],
      ['Address', esc(S.address)], ['Phone', esc(S.phone)], ['Email', esc(S.email)], ['Google', a(S.google)]]) + '</section>';
    out += '<section class="vebd-card"><h4>Hours</h4>' + kv(DAYS.map(function (d) { return [d, esc(S.hours[d] || '')]; })) +
      (S.details.length ? '<p class="vebd-muted" style="margin-top:8px">' + S.details.map(esc).join(' &middot; ') + '</p>' : '') + '</section>';
    out += '<section class="vebd-card"><h4>Links</h4>' + kv([['Website', a(S.links.website)], ['Instagram', a(S.links.instagram)], ['Facebook', a(S.links.facebook)], ['TikTok', a(S.links.tiktok)], ['YouTube', a(S.links.youtube)],
      ['Ordering', S.ordering ? esc((S.ordering.pos ? S.ordering.pos + (S.ordering.state === 'connected' ? ', connected' : '') : '') + (S.ordering.order_url ? ' ' + S.ordering.order_url : '')) : '']]) + '</section>';
    if (st.tagline || st.short || (st.long || []).length) out += '<section class="vebd-card"><h4>Your story</h4>' + kv([['One line', esc(st.tagline)], ['Short', esc(st.short)]]) +
      ((st.long || []).length ? '<div style="margin-top:8px">' + [].concat(st.long).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' : '') + '</section>';
    if ((b.colors || []).length) out += '<section class="vebd-card"><h4>Colors</h4><div class="vebd-sw">' + b.colors.map(function (c) {
      return '<div><i style="background:' + esc(c.hex) + '"></i><span><b>' + esc(c.name) + '</b><br>' + esc(c.hex) + (c.job ? '<br><span class="vebd-muted">' + esc(c.job) + '</span>' : '') + '</span></div>'; }).join('') + '</div></section>';
    if (b.type && (b.type.heading || b.type.body)) out += '<section class="vebd-card"><h4>Type</h4>' + kv([['Headings', esc(b.type.heading && b.type.heading.family)], ['Body', esc(b.type.body && b.type.body.family)]]) + '</section>';
    if (b.logo && (b.logo.files || []).length) out += '<section class="vebd-card"><h4>Logo files</h4>' + kv(b.logo.files.map(function (f) { return [f.name, f.state === 'have' ? 'Ready' : 'Being made']; })) +
      ((b.logo.rules || []).length ? '<p class="vebd-muted" style="margin-top:8px">' + b.logo.rules.map(esc).join(' ') + '</p>' : '') + '</section>';
    if (v) out += '<section class="vebd-card"><h4>Your voice</h4>' + kv([['In three words', esc((v.personality || []).join(', '))], ['How you sound', esc(v.sounds_like)], ['Never', esc((v.never || []).join('; '))],
      ['Words to use', esc(((v.words || {}).use || []).join(', '))], ['Words to leave out', esc(((v.words || {}).avoid || []).join(', '))]]) +
      (v.samples ? kv(Object.keys(v.samples).map(function (k) { return [{ hero: 'Website', instagram: 'Instagram', google_reply: 'A Google reply', closed: 'A closed day' }[k] || k, esc(v.samples[k])]; })) : '') + '</section>';
    if (S.menu.length) out += '<section class="vebd-card"><h4>Your menu</h4><div style="overflow-x:auto"><table class="vebd-menu"><thead><tr><th>Item</th><th>Price</th><th>Description</th><th class="was">In your words</th></tr></thead><tbody>' +
      S.menu.map(function (sec) {
        return '<tr class="sec"><td colspan="4">' + esc(sec.name) + '</td></tr>' + (sec.items || []).map(function (it) {
          return '<tr><td><b>' + esc(it.name) + '</b>' + ((it.tags || []).length ? '<br><span class="vebd-muted">' + esc(it.tags.join(', ')) + '</span>' : '') + '</td><td>' + esc(it.price || '') + '</td><td>' + esc(it.copy || it.was || '') + '</td><td class="was vebd-muted">' + esc(it.was || '') + '</td></tr>';
        }).join('');
      }).join('') + '</tbody></table></div></section>';
    if (forFile) return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(S.name) + ', asset sheet</title>' +
      '<style>body{font-family:Arial,sans-serif;max-width:960px;margin:32px auto;padding:0 16px;color:#14261a}' + (document.getElementById('vebdStyle') || {}).textContent + '</style></head><body class="vebd"><h1>' + esc(S.name) + '</h1><p class="vebd-muted">Asset sheet, ' +
      esc(day(new Date())) + '. Everything about your business in one place. It is yours. Vegans Explore.</p>' + out + '</body></html>';
    return out;
  }
  function menuCsv(S) {
    var q = function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var rows = [['Section', 'Item', 'Price', 'Tags', 'Description', 'In your words']];
    S.menu.forEach(function (sec) { (sec.items || []).forEach(function (it) { rows.push([sec.name, it.name, it.price || '', (it.tags || []).join('; '), it.copy || '', it.was || '']); }); });
    return rows.map(function (r) { return r.map(q).join(','); }).join('\r\n');
  }
  function save(name, blob) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
  function slugify(s) { return String(s || 'business').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function jszip() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    return new Promise(function (ok, bad) { var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'; s.onload = function () { ok(window.JSZip); }; s.onerror = bad; document.head.appendChild(s); });
  }

  // ---- One month's report (the monthly check-in, once sent; the check-in page previews it the same way)
  var ACT_WORD = { website: 'Website visits', directions: 'Directions', call: 'Calls', order: 'Orders started', menu: 'Menu opened', social: 'Social links', photos: 'Photos opened', gallery: 'Photos opened' };
  function reportHtml(r, steps) {
    css();
    var N = (r.numbers && r.numbers.now) || {}, B = (r.numbers && r.numbers.before) || {}, A = r.answers || {};
    var ch = function (a, b) { a = +a || 0; b = +b || 0; if (!b) return a ? '<i class="up">New this month</i>' : '<i>&nbsp;</i>'; var d = Math.round((a - b) / b * 100); return '<i class="' + (d >= 0 ? 'up' : 'dn') + '">' + (d >= 0 ? '+' : '') + d + '% on last month</i>'; };
    var tile = function (n, b, label) { return '<div class="vebd-num"><b>' + (+n || 0).toLocaleString() + '</b><span>' + esc(label) + '</span><br>' + ch(n, b) + '</div>'; };
    var acts = Object.keys(N.actions || {}).reduce(function (t, k) { return t + (+N.actions[k] || 0); }, 0), actsB = Object.keys(B.actions || {}).reduce(function (t, k) { return t + (+B.actions[k] || 0); }, 0);
    var nums = '<div class="vebd-nums">' + tile(N.views, B.views, 'Views of your page') + tile(N.visitors, B.visitors, 'People who saw it') + tile(acts, actsB, 'Taps and clicks on your page') +
      tile(N.checkins, B.checkins, 'Member check-ins') + tile(N.visits, B.visits, 'Member visits with photos') + tile(N.files, B.files, 'New files in your Library') + '</div>';
    var actRows = Object.keys(N.actions || {}).map(function (k) { return [ACT_WORD[k] || k, (+N.actions[k]).toLocaleString()]; });
    var kv = function (rows) { return '<dl class="vebd-kv">' + rows.filter(function (x) { return x[1]; }).map(function (x) { return '<dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') + '</dl>'; };
    var said = [];
    var MINE = { rating: 'How the month was', busiest: 'Busiest and quiet times', sold_best: 'What sold best', heard: 'What customers said', menu: 'Menu changes coming',
      hours: 'Hours and closures', events: 'What you are hosting', campaign: 'Campaign for next month', from_us: 'What you thought of our work', needs: 'What you need from us' };
    (steps || []).forEach(function (st) { st.q.forEach(function (q) { if (A[q.k]) said.push([MINE[q.k] || q.label, A[q.k]]); }); });
    var paras = function (t) { return String(t || '').split(/\n{2,}/).map(function (x) { return '<p class="lead">' + esc(x).replace(/\n/g, '<br>') + '</p>'; }).join(''); };
    return '<div class="vebd vebd-rep"><section class="vebd-card"><h4>' + esc(r.month_name || '') + '</h4>' + (r.summary ? paras(r.summary) : '<p class="vebd-muted">What the month meant goes here.</p>') + '</section>' +
      '<section class="vebd-card"><h4>The numbers</h4>' + nums + (actRows.length ? '<div style="margin-top:10px">' + kv(actRows) + '</div>' : '') +
      '<p class="vebd-muted" style="margin:8px 0 0">From your Vegans Explore page' + (r.sent_at ? ', for the whole month' : ', so far this month') + '. Google and social numbers join here as we connect them.</p></section>' +
      '<section class="vebd-card"><h4>Next month</h4>' + (r.next_month ? paras(r.next_month) : '<p class="vebd-muted">What we do next goes here.</p>') + (A.campaign && A.campaign !== 'None this month' ? '<p><b>Your campaign:</b> ' + esc(A.campaign) + '</p>' : '') + '</section>' +
      (said.length ? '<section class="vebd-card"><h4>What you told us</h4>' + kv(said) + '</section>' : '') + '</div>';
  }

  function mount(el, o) {
    o = o || {}; css();
    var D = null, kindFilter = '';
    var view = o.view || 'start';
    function go(v) { view = v; reportId = ''; if (o.go) o.go(v); draw(); }
    function load() {
      el.innerHTML = '<div class="vebd"><p class="vebd-muted">Loading...</p></div>';
      (o.load ? o.load() : api({ action: 'client', slug: o.slug, account_id: o.account_id })).then(function (d) {
        if (!d || !d.ok) { el.innerHTML = '<div class="vebd"><p class="vebd-muted">' + (d && d.error === 'not_found' ? 'There is no managed marketing account here.' : 'This did not load. Try again in a moment.') + '</p></div>'; return; }
        D = d; draw();
      }, function () { el.innerHTML = '<div class="vebd"><p class="vebd-muted">This did not load. Try again in a moment.</p></div>'; });
    }
    function sub() {
      return '<nav class="vebd-sub" aria-label="BrandDesk">' + [['start', 'Getting started'], ['insights', 'Insights'], ['website', 'Your website'], ['kit', 'Your brand kit']].concat(D.account && D.account.social ? [['social', 'Your social']] : []).concat([['campaigns', 'Your campaigns'], ['library', 'Your Library'], ['sheet', 'Your asset sheet'], ['reports', 'Monthly reports']]).map(function (v) {
        return '<a href="#" data-bdv="' + v[0] + '" class="' + (v[0] === view ? 'on' : '') + '">' + v[1] + '</a>'; }).join('') + '</nav>';
    }
    function drawStart() {
      var A = D.account, S = D.steps || [], done = S.filter(function (s) { return s.done_at; }).length;
      var steps = S.map(function (s) {
        var tick = D.admin && s.how === 'team' ? '<button type="button" class="vebd-btn sm ' + (s.done_at ? 'o' : '') + '" data-bdstep="' + s.key + '" data-on="' + (s.done_at ? '0' : '1') + '">' + (s.done_at ? 'Undo' : 'Mark done') + '</button>' : '';
        return '<div class="vebd-step' + (s.done_at ? ' done' : '') + '"><span class="vebd-dot">' + (s.done_at ? '&#10003;' : '') + '</span><div><b>' + esc(D.admin ? s.team : s.client) + '</b><small>' +
          (s.done_at ? 'Done ' + esc(day(s.done_at)) + (s.by && D.admin ? ' by ' + esc(s.by) : '') + (s.auto && D.admin ? ' (on its own)' : '') + (s.note ? ' &middot; ' + esc(s.note) : '') : (s.how === 'auto' ? 'Happens on its own' : 'Coming up')) + '</small></div>' + tick + '</div>';
      }).join('');
      var arc = (D.archives || [])[0];
      var plan = '<section class="vebd-card"><h4>' + (D.admin ? 'Their plan' : 'Your plan') + '</h4><p>' + esc(planText(A)) + '. Since ' + esc(day(A.activated_at)) + '.' +
        (A.pause_from ? ' Paused from ' + esc(day(A.pause_from)) + ' to ' + esc(day(A.pause_until)) + '.' : '') + '</p>' +
        '<p class="vebd-muted">' + (D.unlocked ? 'Your setup is paid in full, so every file in your Library downloads at full size.' : 'Full-size downloads of what we make open once your setup is paid in full. Your old website is always yours to download.') + '</p>' +
        (D.sample ? '<p><a class="vebd-btn o sm" href="/business/agreement" target="_blank" rel="noopener">The agreement</a> <a class="vebd-btn o sm" href="/business/sample/brand" target="_blank" rel="noopener">Your brand kit</a> <a class="vebd-btn o sm" href="/business/sample/site" target="_blank" rel="noopener">Your website</a></p>' :
          D.listing ? '<p><a class="vebd-btn o sm" href="/business/managed?listing=' + esc(D.listing.slug) + '">Your plan and pause</a> <a class="vebd-btn o sm" href="/business/agreement" target="_blank" rel="noopener">Your agreement</a>' +
          ' <a class="vebd-btn o sm" href="/business/brand?listing=' + esc(D.listing.slug) + '">Your brand kit</a></p>' : '') + '</section>';
      var admin = '';
      if (D.admin) {
        admin = '<section class="vebd-card"><h4>Their website archive</h4>' + (arc ? '<p>' + (arc.status === 'running' ? '<span class="vebd-pill wait">Running</span> Started ' + esc(day(arc.created_at)) + '. Refresh in a minute.' :
          arc.status === 'done' ? '<span class="vebd-pill ok">Done</span> ' + esc(arc.pages) + ' pages, ' + esc(arc.assets) + ' files, ' + esc(size(arc.bytes)) + (arc.platform && arc.platform !== 'other' ? ', built with ' + esc(arc.platform) : '') + ', ' + esc(day(arc.finished_at)) + '.' :
          '<span class="vebd-pill">Failed</span> ' + esc(arc.note || '')) + '</p>' + (arc.note && arc.status === 'done' ? '<p class="vebd-muted">' + esc(arc.note) + '</p>' : '') : '<p class="vebd-muted">Not archived yet.</p>') +
          '<form class="vebd-form" id="vebd-arc"><label>Their website<input name="url" value="' + esc(A.website_url || '') + '" placeholder="https://"></label><div><button class="vebd-btn" type="submit">Archive it now</button></div></form><p class="vebd-msg" id="vebd-arc-msg" role="status"></p></section>';
      }
      return '<section class="vebd-card"><div class="vebd-bar"><h4 style="margin:0">' + (D.admin ? 'Onboarding' : 'Getting started') + '</h4><span class="vebd-pill ' + (done === S.length ? 'ok' : 'wait') + '">' + done + ' of ' + S.length + ' done</span></div>' +
        (D.admin ? '' : '<p class="vebd-muted">Your Community Manager walks you through this. Nothing here needs you to log in anywhere; we ask for access on your welcome call.</p>') + steps + '</section>' + admin + plan;
    }
    function drawLibrary() {
      var F = D.files || [], have = {};
      F.forEach(function (f) { have[f.kind] = (have[f.kind] || 0) + 1; });
      var shown = F.filter(function (f) { return !kindFilter || f.kind === kindFilter; });
      var chips = '<div class="vebd-chips"><button type="button" data-bdk="" class="' + (!kindFilter ? 'on' : '') + '">Everything (' + F.length + ')</button>' +
        KINDS.filter(function (k) { return have[k[0]]; }).map(function (k) { return '<button type="button" data-bdk="' + k[0] + '" class="' + (kindFilter === k[0] ? 'on' : '') + '">' + esc(k[1]) + ' (' + have[k[0]] + ')</button>'; }).join('') + '</div>';
      var up = D.admin ? '<section class="vebd-card"><h4>Add to their Library</h4><form class="vebd-form" id="vebd-up"><label>What it is<select name="kind">' +
        KINDS.filter(function (k) { return k[0] !== 'archive'; }).map(function (k) { return '<option value="' + k[0] + '">' + esc(k[1]) + '</option>'; }).join('') + '</select></label>' +
        '<label>Files<input type="file" name="files" multiple></label><label>Title (optional, one file)<input name="title" maxlength="140"></label><div><button class="vebd-btn" type="submit">Upload</button></div></form>' +
        '<p class="vebd-msg" id="vebd-up-msg" role="status"></p><p class="vebd-muted">Full size, as it was made: up to 500 MB a file. The client sees it at once.</p></section>' : '';
      var locked = F.filter(function (f) { return f.locked; }).length;
      var head = '<div class="vebd-bar"><p class="vebd-muted" style="margin:0">Every photo, video, logo file and graphic we make for you, at full size. Yours to keep, whatever happens.' +
        (locked ? ' Full-size downloads open once your setup is paid in full.' : '') + '</p>' + (F.length ? '<button type="button" class="vebd-btn" id="vebd-all">Download everything</button>' : '') + '</div><p class="vebd-msg" id="vebd-all-msg" role="status"></p>';
      var grid = shown.length ? '<div class="vebd-files">' + shown.map(function (f) {
        return '<div class="vebd-file"><div class="th' + (f.kind === 'logo' ? ' logo' : '') + '"' + (f.view ? ' style="background-image:url(\'' + esc(f.view) + '\')"' : '') + '>' + (f.view ? '' : esc(KIND_WORD[f.kind] || f.kind)) + '</div><div class="bd"><b>' + esc(f.title) + '</b>' +
          '<span class="vebd-muted">' + esc(KIND_WORD[f.kind] || f.kind) + (f.bytes ? ' &middot; ' + esc(size(f.bytes)) : '') + (f.width ? ' &middot; ' + f.width + ' x ' + f.height : '') + ' &middot; ' + esc(day(f.created_at)) + '</span>' +
          (f.note ? '<span class="vebd-muted">' + esc(f.note) + '</span>' : '') + '<div class="row">' + (f.download ? '<a class="vebd-btn sm" href="' + esc(f.download) + '">Download</a>' : '<span class="vebd-pill">Full size after setup</span>') +
          (D.admin && !o.load ? '<button type="button" class="vebd-btn sm o" data-bdrm="' + f.id + '">Remove</button>' : '') + '</div></div></div>';
      }).join('') + '</div>' : '<p class="vebd-muted">' + (F.length ? 'Nothing of that kind yet.' : 'Your Library fills up as we make things for you: your logo files and brand kit first, then the photos from your shoot.') + '</p>';
      return up + '<section class="vebd-card">' + head + chips + grid + '</section>';
    }
    function drawSheet() {
      var S = sheetModel(D);
      return '<div class="vebd-bar"><p class="vebd-muted" style="margin:0">' + (S.from_kit ? 'From your brand kit, updated ' + esc(day(S.updated)) + '. We keep it current every month.' : 'From your Directory page. Your brand kit fills in the rest as we build it.') + '</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' + (S.menu.length ? '<button type="button" class="vebd-btn o" id="vebd-csv">Download the menu (spreadsheet)</button>' : '') + '<button type="button" class="vebd-btn" id="vebd-html">Download the asset sheet</button></div></div>' + sheetHtml(S, false);
    }
    var reportId = o.report || '', RCACHE = {};
    function frame(body) {
      el.innerHTML = '<div class="vebd">' + (D.sample ? '<p class="vebd-muted"><span class="vebd-pill wait">Sample</span> What a BrandDesk client sees: their onboarding, numbers, website, brand kit and everything we made for them, theirs to keep. Downloads here are the sample\'s illustrative photos.</p>' : D.account.test ? '<p class="vebd-muted"><span class="vebd-pill wait">Test account</span></p>' : '') + sub() + body + '</div>';
      wire();
    }
    var CSTATUS = { planned: ['Planned', 'wait'], scheduled: ['Date set', ''], done: ['Done', 'ok'] };
    function drawCampaigns() {
      var R = D.campaigns || [], now = Date.now();
      var row = function (c) {
        var st = CSTATUS[c.status] || ['', ''], res = c.results || {}, bits = [];
        if (res.came) bits.push(res.came + ' came'); if (res.posts) bits.push(res.posts + ' posts'); if (res.followers) bits.push(res.followers + ' new followers');
        return '<li><span><b>' + esc(c.title) + '</b>, ' + esc(c.month_name) + '<br><small class="vebd-muted">' + (c.starts_at ? esc(new Date(c.starts_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })) : 'Date to be set with you') +
          (bits.length ? ' &middot; ' + esc(bits.join(', ')) : '') + '</small>' + (res.worked && c.status === 'done' ? '<br><small>' + esc(res.worked) + '</small>' : '') + '</span>' +
          '<span style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="vebd-pill ' + st[1] + '">' + st[0] + '</span>' + (c.event_id ? '<a class="vebd-btn o sm" href="/events#event/' + esc(c.event_id) + '" target="_blank" rel="noopener">On the calendar</a>' : '') +
          ((o.admin || D.admin) && !D.sample ? '<a class="vebd-btn o sm" href="/business/campaign?id=' + esc(c.id) + '">Open</a>' : '') + '</span></li>';
      };
      var next = R.filter(function (c) { return c.status !== 'done' && (!c.starts_at || +new Date(c.starts_at) > now - 864e5); }), past = R.filter(function (c) { return next.indexOf(c) < 0; });
      var add = (D.admin && !D.sample && ['active', 'paused', 'canceling'].indexOf(D.account.status) >= 0) ? '<form class="vebd-form" id="vebd-cadd" style="margin-top:14px"><label>Add a campaign<select name="kind">' +
        [['influencer_night', 'Influencer night'], ['dj_night', 'DJ night'], ['customer_appreciation', 'Customer appreciation'], ['giveaway', 'Giveaway'], ['scavenger_stop', 'Scavenger hunt stop'], ['community_night', 'Community night'], ['photo_night', 'Photo night']]
          .map(function (k) { return '<option value="' + k[0] + '">' + k[1] + '</option>'; }).join('') + '</select></label><label>Month<input type="month" name="month" required></label>' +
        '<button class="vebd-btn" type="submit">Add it</button></form><p class="vebd-msg" id="vebd-cadd-msg"></p>' : '';
      frame('<section class="vebd-card"><h4>Your campaigns</h4><p class="vebd-muted">One campaign a month from our rotation (an influencer night, a DJ night, customer appreciation, a giveaway, a scavenger hunt stop or a community night), picked with your Community Manager at your check-in, and a photo night every two months. We plan it, put it on the Vegans Explore calendar and tell you how it went.</p>' +
        (next.length ? '<h4 style="margin-top:14px">Coming up</h4><ul class="vebd-list">' + next.map(row).join('') + '</ul>' : '<p class="vebd-muted" style="margin:10px 0 0">Your next campaign shows here once you pick it at your monthly check-in.</p>') +
        (past.length ? '<h4 style="margin-top:16px">Done</h4><ul class="vebd-list">' + past.map(row).join('') + '</ul>' : '') + add + '</section>');
      var f = el.querySelector('#vebd-cadd');
      if (f) f.addEventListener('submit', function (e) {
        e.preventDefault(); var m = el.querySelector('#vebd-cadd-msg');
        api({ action: 'campaign_create', account_id: D.account.id, kind: f.kind.value, month: f.month.value + '-01' }).then(function (d) {
          if (d && d.ok) { location.href = '/business/campaign?id=' + d.id; return; }
          m.className = 'vebd-msg bad'; m.textContent = (d && d.message) || 'That did not add.';
        });
      });
    }
    // ---- Your social (the social add-on): posts waiting for their OK, what is coming, and what went out with its links.
    var SOC = null, SST = { review: ['Waiting for your OK', 'wait'], changes: ['Change asked', 'wait'], approved: ['Approved', ''], posted: ['Posted', 'ok'], draft: ['Draft', ''], skipped: ['Skipped', ''] };
    function drawSocial() {
      if (!SOC) {
        frame('<p class="vebd-muted">Loading...</p>');
        (D.sample ? Promise.resolve(sampleSocial()) : o.loadSocial ? o.loadSocial() : api({ action: 'social_get', account_id: D.account.id })).then(function (d) {
          if (!d || !d.ok) { frame('<section class="vebd-card"><p class="vebd-muted">This did not load. Try again in a moment.</p></section>'); return; }
          SOC = d; drawSocial();
        });
        return;
      }
      var S = SOC, P = S.posts || [], plat = function (k) { return (S.platforms[k] || {}).name || k; };
      var when = function (d) { return d ? new Date(d).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'No date yet'; };
      var card = function (p) {
        var st = SST[p.status] || ['', ''];
        var pics = (p.media || []).filter(function (x) { return x.view; }).map(function (x) { return '<span class="th" style="background-image:url(\'' + esc(x.view) + '\')"></span>'; }).join('');
        var links = Object.keys(p.links || {}).map(function (k) { return '<a class="vebd-btn o sm" href="' + esc(p.links[k]) + '" target="_blank" rel="noopener">See it on ' + esc(plat(k)) + '</a>'; }).join(' ');
        var ask = (p.status === 'review' || p.status === 'changes') && (S.owner || D.sample) ?
          '<div class="vebd-soc-ask"><button type="button" class="vebd-btn sm" data-soc-ok="' + esc(p.id) + '">Looks good</button> <button type="button" class="vebd-btn o sm" data-soc-ch="' + esc(p.id) + '">Ask for a change</button>' +
          '<form class="vebd-form" data-soc-form="' + esc(p.id) + '" hidden><label>What would you like changed?<textarea name="note" maxlength="1000" rows="3"></textarea></label><div><button class="vebd-btn sm" type="submit">Send it to us</button></div></form></div>' : '';
        return '<li class="vebd-soc"><div class="vebd-soc-pics">' + (pics || '<span class="th none">' + esc(p.format) + '</span>') + '</div><div class="vebd-soc-bd">' +
          '<div class="vebd-bar" style="margin:0 0 4px"><b>' + esc(when(p.planned_at)) + '</b><span class="vebd-pill ' + st[1] + '">' + st[0] + '</span></div>' +
          '<small class="vebd-muted">' + esc((p.platforms || []).map(plat).join(' and ')) + ' &middot; ' + esc(p.format) + (p.approved_by === 'auto' ? ' &middot; approved on its own' : '') + '</small>' +
          '<p class="vebd-soc-cap">' + esc(p.caption).replace(/\n/g, '<br>') + '</p>' + (p.owner_note ? '<p class="vebd-muted"><b>You asked:</b> ' + esc(p.owner_note) + '</p>' : '') +
          (links ? '<p style="margin:6px 0 0">' + links + '</p>' : '') + ask + '<p class="vebd-msg" data-soc-msg="' + esc(p.id) + '" role="status"></p></div></li>';
      };
      var waiting = P.filter(function (p) { return p.status === 'review' || p.status === 'changes'; }), coming = P.filter(function (p) { return p.status === 'approved'; }), out = P.filter(function (p) { return p.status === 'posted'; });
      var su = S.setup || {}, handles = (su.platforms || []).map(function (k) { return esc(plat(k)) + (su.handles && su.handles[k] ? ' ' + esc(su.handles[k]) : ''); }).join(' and ');
      var team = (S.team || o.admin) && !D.sample ? '<p style="margin:10px 0 0"><a class="vebd-btn o sm" href="/business/social?account=' + esc(D.account.id) + '">Open the social planner</a></p>' : '';
      frame('<section class="vebd-card"><h4>Your social</h4><p class="vebd-muted">' + (su.status === 'active' ? 'We post for you on ' + handles + ', about ' + esc(su.per_month) + ' posts a month' + (su.manager_name ? ', run by ' + esc(su.manager_name) : '') + '. Each post comes to you first: say OK or ask for a change. If we do not hear from you, it is approved on its own ' + esc(S.ok_hours) + ' hours before it goes out.'
          : 'Your social media starts once we have access to your two platforms (we ask on your welcome call) and your social manager is set.') + '</p>' +
        '<p class="vebd-muted" style="margin:0">' + esc(S.month_name) + ': ' + esc(S.counts.planned) + ' planned, ' + esc(S.counts.posted) + ' posted.</p>' + team + '</section>' +
        '<section class="vebd-card"><h4>Waiting for your OK</h4>' + (waiting.length ? '<ul class="vebd-list">' + waiting.map(card).join('') + '</ul>' : '<p class="vebd-muted" style="margin:0">Nothing is waiting for you right now.</p>') + '</section>' +
        (coming.length ? '<section class="vebd-card"><h4>Coming up</h4><ul class="vebd-list">' + coming.map(card).join('') + '</ul></section>' : '') +
        (out.length ? '<section class="vebd-card"><h4>Posted</h4><ul class="vebd-list">' + out.map(card).join('') + '</ul></section>' : ''));
      var decide = function (id, decision, note) {
        var m = el.querySelector('[data-soc-msg="' + id + '"]');
        if (D.sample) { m.textContent = 'In the sample nothing is sent.'; return; }
        m.className = 'vebd-msg'; m.textContent = 'Sending...';
        api({ action: 'social_decide', account_id: D.account.id, id: id, decision: decision, note: note }).then(function (d) {
          if (d && d.ok) { SOC = null; drawSocial(); return; }
          m.className = 'vebd-msg bad'; m.textContent = (d && d.message) || 'That did not send.';
        });
      };
      el.querySelectorAll('[data-soc-ok]').forEach(function (b) { b.addEventListener('click', function () { decide(b.dataset.socOk, 'approve'); }); });
      el.querySelectorAll('[data-soc-ch]').forEach(function (b) { b.addEventListener('click', function () { var f = el.querySelector('[data-soc-form="' + b.dataset.socCh + '"]'); f.hidden = !f.hidden; if (!f.hidden) f.note.focus(); }); });
      el.querySelectorAll('[data-soc-form]').forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); decide(f.dataset.socForm, 'changes', f.note.value); }); });
    }
    // ---- Insights: the latest sent report's numbers against the month before, then what is on their list this month.
    var INS = null;
    function pct(a, b) { a = Number(a || 0); b = Number(b || 0); if (!b) return a ? 'New' : ''; var d = Math.round((a - b) / b * 100); return (d > 0 ? '+' : '') + d + '%'; }
    function drawInsights() {
      var R = (D.reports || []).filter(function (r) { return r.status === 'sent'; });
      if (!R.length) { frame('<section class="vebd-card"><h4>Insights</h4><p class="vebd-muted" style="margin:0">Your numbers start with your first monthly report, after your first full month with us. Until then, your dashboard\'s Insights shows your page\'s views day by day.</p></section>'); return; }
      if (!INS) {
        frame('<p class="vebd-muted">Loading...</p>');
        (o.loadReport ? o.loadReport(R[0].id) : api({ action: 'checkin_get', id: R[0].id })).then(function (d) {
          INS = (d && d.ok && d.checkin) ? d.checkin : { failed: true }; drawInsights();
        }, function () { INS = { failed: true }; drawInsights(); });
        return;
      }
      if (INS.failed || !INS.numbers) { INS = null; frame('<section class="vebd-card"><h4>Insights</h4><p class="vebd-muted" style="margin:0">This did not load. Try again in a moment.</p></section>'); return; }
      var N = INS.numbers.now || {}, B = INS.numbers.before || {};
      var sum = function (a) { return Object.keys(a || {}).reduce(function (t, k) { return t + Number(a[k] || 0); }, 0); };
      var tile = function (v, b, label) {
        var c = pct(v, b);
        return '<div class="vebd-ins-t"><b>' + esc(Number(v || 0).toLocaleString()) + '</b><span>' + esc(label) + '</span>' + (c ? '<small class="' + (/^-/.test(c) ? 'dn' : 'up') + '">' + esc(c) + ' vs the month before</small>' : '') + '</div>';
      };
      var AW = { menu: 'Opened the menu', directions: 'Asked for directions', website: 'Went to your website', order: 'Started an order', call: 'Tapped to call', social: 'Opened your social', photos: 'Looked at photos' };
      var acts = N.actions || {}, keys = Object.keys(acts), max = Math.max.apply(null, keys.map(function (k) { return Number(acts[k] || 0); }).concat([1]));
      var bars = keys.sort(function (a, b) { return acts[b] - acts[a]; }).map(function (k) {
        return '<div class="vebd-ins-bar"><span>' + esc(AW[k] || k) + '</span><i><em style="width:' + Math.round(acts[k] / max * 100) + '%"></em></i><b>' + esc(acts[k]) + '</b><small>' + esc(pct(acts[k], (B.actions || {})[k])) + '</small></div>';
      }).join('');
      var prev = new Date(Date.UTC(+INS.month.slice(0, 4), +INS.month.slice(5, 7) - 2, 1, 12)).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
      var list = [];
      if (D.sample || (D.account && D.account.social)) list.push('<li><span><b>' + (D.sample ? 'Social posts waiting for your OK' : 'Your social this month') + '</b><br><small class="vebd-muted">Posts wait for your OK, or approve themselves 48 hours before they go out.</small></span><a href="#" class="vebd-btn sm" data-bdv="social">Your social</a></li>');
      var nx = (D.campaigns || []).filter(function (c) { return c.status !== 'done'; })[0];
      if (nx) list.push('<li><span><b>Next campaign: ' + esc(nx.title) + '</b><br><small class="vebd-muted">' + (nx.starts_at ? esc(new Date(nx.starts_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })) : 'Date to be set with you') + '</small></span><a href="#" class="vebd-btn o sm" data-bdv="campaigns">Your campaigns</a></li>');
      list.push('<li><span><b>Your ' + esc(INS.month_name) + ' report</b><br><small class="vebd-muted">What the month meant and what we do next, from your check-in.</small></span><a href="#" class="vebd-btn o sm" data-bdr="' + esc(INS.id) + '">Read it</a></li>');
      frame('<section class="vebd-card"><div class="vebd-bar"><h4 style="margin:0">' + esc(INS.month_name) + '</h4><span class="vebd-muted">Against ' + esc(prev) + '</span></div>' +
        '<div class="vebd-ins">' + tile(N.views, B.views, 'Views of your page') + tile(N.visitors, B.visitors, 'People who saw it') + tile(sum(N.actions), sum(B.actions), 'Taps and clicks') +
        tile(N.checkins, B.checkins, 'Member check-ins') + tile(N.visits, B.visits, 'Member visits with photos') + tile(N.files, B.files, 'New files in your Library') + '</div>' +
        (bars ? '<h4 style="margin:18px 0 8px">What people did on your page</h4>' + bars : '') +
        '<p class="vebd-muted" style="margin:12px 0 0">Google and social numbers join here as we connect them. Day-by-day numbers are on your dashboard\'s Insights.</p></section>' +
        '<section class="vebd-card"><h4>On your list this month</h4><ul class="vebd-list">' + list.join('') + '</ul></section>');
    }
    // ---- Your brand kit: every part and where it stands (their Cartridge), with a look at each. Changing a locked part is a request.
    var KIT_PARTS = [['logo', 'Logo'], ['colors', 'Colors'], ['type', 'Type'], ['voice', 'Voice'], ['story', 'Story'], ['menu', 'Menu'], ['photos', 'Photos'], ['info', 'Hours and details']];
    var KST = { locked: ['Locked', 'ok'], in_review: ['Waiting for your OK', 'wait'], revising: ['Being revised', 'wait'], in_progress: ['In progress', 'wait'], not_started: ['Not started', ''] };
    function drawKit() {
      var K = (D.cartridge && D.cartridge.data) || {}, A = (K.meta || {}).approvals || {}, br = K.brand || {};
      var look = function (k) {
        if (k === 'logo') { var lg = (br.logo || {}).primary; return lg && lg.src ? '<span class="vebd-kit-logo" style="background-image:url(\'' + esc(lg.src) + '\')"></span>' : ''; }
        if (k === 'colors') return (br.colors || []).length ? '<span class="vebd-kit-sw">' + br.colors.map(function (c) { return '<i title="' + esc(c.name + ' ' + c.hex) + '" style="background:' + esc(c.hex) + '"></i>'; }).join('') + '</span>' : '';
        if (k === 'type') { var t = br.type || {}; return t.heading ? '<small>' + esc(t.heading.family) + ' for headings, ' + esc((t.body || {}).family || '') + ' for text</small>' : ''; }
        if (k === 'voice') return ((K.voice || {}).personality || []).length ? '<small>' + esc(K.voice.personality.join(', ')) + '</small>' : '';
        if (k === 'story') return (K.story || {}).tagline ? '<small>' + esc(K.story.tagline) + '</small>' : '';
        if (k === 'menu') { var n = 0; (((K.menu || {}).sections) || []).forEach(function (s) { n += (s.items || []).length; }); return n ? '<small>' + n + ' items in ' + K.menu.sections.length + ' sections</small>' : ''; }
        if (k === 'photos') { var p = ((K.photos || {}).space || []).filter(function (x) { return x.src; }).length; return p ? '<small>' + p + ' photos of your space and team, plus every dish</small>' : ''; }
        if (k === 'info') { var i = K.info || {}, ad = i.address || {}; return ad.street ? '<small>' + esc([ad.street, ad.city].filter(Boolean).join(', ')) + '</small>' : ''; }
        return '';
      };
      var locked = 0;
      var rows = KIT_PARTS.map(function (p) {
        var a = A[p[0]] || {}, st = KST[a.state] || KST.not_started; if (a.state === 'locked') locked++;
        var lk = look(p[0]), logo = p[0] === 'logo' && lk;
        return '<li><span class="vebd-kit-row">' + (logo ? lk : '') + '<span><b>' + esc(p[1]) + '</b>' + (logo ? '' : lk) +
          (a.at ? '<small class="vebd-muted">' + esc(st[0]) + ' ' + esc(day(a.at)) + (a.by ? ' by ' + esc(a.by === 'Owner' ? 'you' : a.by) : '') + '</small>' : '') + '</span></span>' +
          '<span class="vebd-pill ' + st[1] + '">' + st[0] + '</span></li>';
      }).join('');
      var href = D.sample ? '/business/sample/brand' : D.listing ? '/business/brand?listing=' + encodeURIComponent(D.listing.slug) : '';
      frame('<section class="vebd-card"><div class="vebd-bar"><h4 style="margin:0">Your brand kit</h4><span class="vebd-pill ' + (locked === KIT_PARTS.length ? 'ok' : 'wait') + '">' + locked + ' of ' + KIT_PARTS.length + ' locked</span></div>' +
        '<p class="vebd-muted">Everything we make for you comes from here: your website, your posts, your menu boards and your photos. A locked part stays as you approved it. To change one, ask for the change with a reason and your Community Manager takes it from there.</p>' +
        '<ul class="vebd-list">' + rows + '</ul>' + (href ? '<p style="margin:12px 0 0"><a class="vebd-btn" href="' + esc(href) + '" target="_blank" rel="noopener">Open your brand kit</a></p>' : '') + '</section>');
    }
    function drawReports() {
      var R = D.reports || [];
      if (reportId) {
        var back = '<div class="vebd-bar"><a href="#" class="vebd-btn o sm" data-bdr="">Monthly reports</a></div>';
        if (RCACHE[reportId]) { frame(back + reportHtml(RCACHE[reportId].checkin, RCACHE[reportId].steps)); return; }
        frame(back + '<p class="vebd-muted">Loading...</p>');
        (o.loadReport ? o.loadReport(reportId) : api({ action: 'checkin_get', id: reportId })).then(function (d) {
          if (!d || !d.ok) { frame(back + '<p class="vebd-muted">This report did not load.</p>'); return; }
          RCACHE[reportId] = d; drawReports();
        });
        return;
      }
      var list = R.length ? '<ul class="vebd-list">' + R.map(function (r) {
        return '<li><span><b>' + esc(r.month_name) + '</b>' + (r.status === 'sent' ? '<br><small class="vebd-muted">Sent ' + esc(day(r.sent_at)) + '</small>' : '') + '</span>' +
          (r.status === 'sent' ? '<a href="#" class="vebd-btn sm" data-bdr="' + esc(r.id) + '">Read it</a>' : '<span class="vebd-pill wait">' + (r.status === 'due' ? 'Check-in due' : 'Being written') + '</span>' + (o.admin || D.admin ? ' <a class="vebd-btn o sm" href="/business/checkin?id=' + esc(r.id) + '">Open the check-in</a>' : '')) + '</li>'; }).join('') + '</ul>'
        : '<p class="vebd-muted" style="margin:0">Your first report comes after your first full month with us: your Community Manager checks in with you, then it lands here.</p>';
      var start = (D.admin && !D.sample && ['active', 'paused', 'canceling'].indexOf(D.account.status) >= 0) ? '<p style="margin:12px 0 0"><button type="button" class="vebd-btn o sm" id="vebd-ci">Open this month\'s check-in</button> <span class="vebd-msg" id="vebd-ci-msg"></span></p>' : '';
      frame('<section class="vebd-card"><h4>Monthly reports</h4><p class="vebd-muted">Every month your Community Manager checks in with you: how the month went, what is coming, and the campaign you want next. Then your report lands here with the month\'s numbers.</p>' + list + start + '</section>');
      var ci = el.querySelector('#vebd-ci');
      if (ci) ci.addEventListener('click', function () {
        ci.disabled = true;
        api({ action: 'checkin_start', account_id: D.account.id }).then(function (d) {
          if (d && d.ok) { location.href = '/business/checkin?id=' + d.id; return; }
          ci.disabled = false; var m = el.querySelector('#vebd-ci-msg'); m.className = 'vebd-msg bad'; m.textContent = (d && d.message) || 'That did not open.';
        });
      });
    }
    // ---- Your website (the website launch): preview, the owner's approval, their domain, the final check.
    var WEB = null;
    var WEV = { made: 'Started building it', look: 'Look set', sent: 'Sent to the owner for their OK', approved: 'Approved', changes: 'Changes asked', domain: 'Domain added',
      domain_removed: 'Domain taken off', old_scan: 'Their old site read again', old_saved: 'Old addresses matched', checked: 'Final check run', launched: 'Launched: live on their domain', paused: 'Taken down for now', resumed: 'Put back up', ended: 'Ended' };
    function sampleWeb() {
      var at = function (d) { var x = new Date(); x.setDate(x.getDate() - d); return x.toISOString(); };
      return { ok: true, sample: true, admin: false, owner: true, host: 'sites.example', listing: { name: (D.listing || {}).name || 'Green Leaf Kitchen', slug: 'sample' },
        kit: { status: 'locked', updated_at: at(4), parts: [['logo', 'Logo'], ['colors', 'Colors'], ['type', 'Type'], ['voice', 'Voice'], ['story', 'Story'], ['menu', 'Menu'], ['photos', 'Photos'], ['info', 'Hours and details']].map(function (p) { return { key: p[0], name: p[1], state: 'locked' }; }) },
        looks: { fresh: 'Fresh neighborhood', island: 'Island bright', night: 'Night lounge', street: 'Street heat' },
        pages: [{ path: '', name: 'Home' }, { path: 'menu', name: 'Menu' }, { path: 'order', name: 'Order' }, { path: 'about', name: 'About' }, { path: 'visit', name: 'Visit' }],
        site: { id: 'sample', status: 'preview', status_word: 'Waiting for the owner', review: 'waiting', preview_url: '/business/sample/site', live_url: null, domain: null, published_version: 0, sent_at: at(1),
          old_scanned_at: at(3), old_note: '7 addresses on greenleafkitchen.com, from its sitemap and home page.', old_pages: [{ path: '/', title: 'Green Leaf Kitchen', to: '', how: 'same' },
            { path: '/our-menu', title: 'Our Menu | Green Leaf Kitchen', to: 'menu', how: 'words' }, { path: '/brunch', title: 'Weekend Brunch', to: 'menu', how: 'words' }, { path: '/order-online', title: 'Order Online', to: 'order', how: 'words' },
            { path: '/our-story', title: 'Our Story', to: 'about', how: 'words' }, { path: '/contact-us', title: 'Contact & Hours', to: 'visit', how: 'words' }, { path: '/?page_id=12', title: 'Gallery', to: '', how: 'home' }] },
        events: [{ kind: 'sent', by_name: 'Our team', at: at(1), note: 'Everything comes from your brand kit. Have a look on your phone too.' }, { kind: 'made', by_name: 'Our team', at: at(3) }] };
    }
    function drawWebsite() {
      if (!WEB) {
        frame('<p class="vebd-muted">Loading...</p>');
        (D.sample ? Promise.resolve(sampleWeb()) : api({ action: 'site_get', account_id: D.account.id })).then(function (d) {
          if (!d || !d.ok) { frame('<section class="vebd-card"><p class="vebd-muted">This did not load. Try again in a moment.</p></section>'); return; }
          WEB = d; drawWebsite();
        });
        return;
      }
      var W = WEB, S = W.site, A = !!W.admin, out = '';
      // Step one is the brand kit: the website is drawn only from it, so where each part stands comes first.
      var kitUrl = D.sample ? '/business/sample/brand' : '/business/brand?listing=' + encodeURIComponent((W.listing || D.listing || {}).slug || '');
      var KST = { locked: ['ok', 'Locked'], in_progress: ['wait', 'In progress'], not_started: ['', 'Not started'] };
      if (!W.kit) out += '<section class="vebd-card"><h4>1. ' + (A ? 'Their' : 'Your') + ' brand kit</h4><p>' + (A ? 'Everything on their website comes from their brand kit: logo, colors, type, voice, story, menu, photos, hours. Start it first; it fills itself from their Directory page.' : 'Everything on your website comes from your brand kit. We start it with you on your welcome call.') + '</p>' +
        (A ? '<p><a class="vebd-btn" href="' + esc(kitUrl) + '" target="_blank" rel="noopener">Start their brand kit</a></p>' : '') + '</section>';
      else {
        var pl = W.kit.parts || [], lk = pl.filter(function (p) { return p.state === 'locked'; }).length;
        out += '<section class="vebd-card"><div class="vebd-bar"><h4 style="margin:0">1. ' + (A ? 'Their' : 'Your') + ' brand kit</h4><span class="vebd-pill ' + (pl.length && lk === pl.length ? 'ok' : 'wait') + '">' + lk + ' of ' + pl.length + ' locked</span></div>' +
          '<p class="vebd-muted">' + (A ? 'The website is drawn from it, part by part. A part that is not locked yet shows what the kit holds today.' : 'Your website is drawn from it, part by part. Change something there and the preview follows; your live site changes only once you approve it.') + '</p>' +
          '<p style="display:flex;flex-wrap:wrap;gap:6px">' + pl.map(function (p) { var k = KST[p.state] || KST.not_started; return '<span class="vebd-pill ' + k[0] + '">' + esc(p.name) + ': ' + k[1] + '</span>'; }).join('') + '</p>' +
          '<p><a class="vebd-btn o" href="' + esc(kitUrl) + '" target="_blank" rel="noopener">Open ' + (A ? 'their' : 'your') + ' brand kit</a></p></section>';
      }
      var pageLinks = function (base) { return (W.pages || []).map(function (p) { var u = /^https?:|^\//.test(base) ? base + (D.sample && p.path ? '#/' + p.path : p.path) : base; return '<a class="vebd-btn o sm" href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(p.name) + '</a>'; }).join(' '); };
      if (!S) {
        out += '<section class="vebd-card"><h4>2. ' + (A ? 'Their website' : 'Your website') + '</h4><p>' + (A ? 'Their website is built from their brand kit on our frame: their colors, type, logo, words, menu and photos. Start it once the brand kit has their basics; it shows on a private preview until they approve it.' :
          'We are building your new website from your brand kit. When it is ready you get a private preview to look at, and it goes live on your domain only once you approve it.') + '</p>' +
          (A ? (W.kit ? '<button type="button" class="vebd-btn" data-web="start">Build their website</button>' : '<p class="vebd-muted">Start their brand kit first (step 1, above).</p>') : '') + '<p class="vebd-msg" data-webmsg role="status"></p></section>';
        return frame(out);
      }
      var pill = S.status === 'live' ? 'ok' : ['preview', 'changes', 'connecting'].indexOf(S.status) >= 0 ? 'wait' : '';
      out += '<section class="vebd-card"><div class="vebd-bar"><h4 style="margin:0">2. ' + (A ? 'Their website' : 'Your website') + '</h4><span class="vebd-pill ' + pill + '">' + esc(S.status_word || S.status) + '</span></div>';
      if (S.live_url && S.status === 'live') out += '<p><b>Live at <a href="' + esc(S.live_url) + '" target="_blank" rel="noopener">' + esc(S.domain) + '</a></b>' + (S.launched_at ? ' since ' + esc(day(S.launched_at)) : '') + '.</p><p>' + pageLinks(S.live_url) + '</p>';
      out += '<p class="vebd-muted" style="margin-top:6px">' + (S.published ? 'The private preview always shows the brand kit as it is now; ' + (A ? 'their' : 'your') + ' live site shows version ' + esc(S.published_version) + ', the one ' + (A ? 'they' : 'you') + ' approved' + (S.approved_name ? ' (' + esc(S.approved_name) + ', ' + esc(day(S.approved_at)) + ')' : '') + '.' :
        'This is a private preview: only ' + (A ? 'they and our team' : 'you and our team') + ' can see it, and search engines cannot.') + '</p>' +
        '<p><a class="vebd-btn" href="' + esc(S.preview_url) + '" target="_blank" rel="noopener">Look at the preview</a> ' + pageLinks(S.preview_url) + '</p></section>';
      // The owner's OK.
      if (S.review === 'waiting' && (W.owner || W.sample)) out += '<section class="vebd-card"><h4>' + (S.published ? 'An update is waiting for your OK' : 'Is it ready to go live?') + '</h4>' +
        '<p>Look through every page on your phone and your computer. When you are happy, type your name and approve it. ' + (S.published ? 'Your live site changes as soon as you do.' : 'Then we connect your domain and check every page before it goes live.') + '</p>' +
        '<form class="vebd-form" data-webok><label>Your full name<input name="name" autocomplete="name" required minlength="3" maxlength="120"></label><div><button class="vebd-btn" type="submit">Approve my website</button></div></form>' +
        '<p style="margin:12px 0 4px"><button type="button" class="vebd-btn o sm" data-webch-open>Ask for changes instead</button></p><form class="vebd-form" data-webch hidden><label>What would you like changed?<textarea name="note" rows="3" maxlength="1000" required></textarea></label><div><button class="vebd-btn o" type="submit">Send it to us</button></div></form>' +
        '<p class="vebd-msg" data-webmsg role="status"></p></section>';
      else if (S.review === 'changes') out += '<section class="vebd-card"><h4>' + (A ? 'They asked for changes' : 'You asked for changes') + '</h4><p>' + esc(S.change_note || '') + '</p><p class="vebd-muted">' + esc(day(S.change_at)) + (A ? '. Make them in their brand kit, then send it again.' : '. We are on it; you will get the preview again.') + '</p></section>';
      else if (S.review === 'waiting' && A) out += '<section class="vebd-card"><h4>Waiting for their OK</h4><p class="vebd-muted">Sent ' + esc(day(S.sent_at)) + '. They approve it on their dashboard. If they said yes another way (a call, an email), record it here with how.</p>' +
        '<form class="vebd-form" data-webok><label>Their name, as they gave it<input name="name" required minlength="3" maxlength="120"></label><label>How they said yes<input name="note" required maxlength="500" placeholder="On the phone with Sean, Nov 2"></label><div><button class="vebd-btn o" type="submit">Record their OK</button></div></form><p class="vebd-msg" data-webmsg role="status"></p></section>';
      // The team's tools.
      if (A) {
        out += '<section class="vebd-card"><h4>Build and send</h4><form class="vebd-form" data-weblook><label>The look<select name="look"><option value="">Their brand kit (colors and type)</option>' +
          Object.keys(W.looks || {}).map(function (k) { return '<option value="' + esc(k) + '"' + (S.look === k ? ' selected' : '') + '>' + esc(W.looks[k]) + '</option>'; }).join('') + '</select></label><div><button class="vebd-btn o" type="submit">Save the look</button></div></form>' +
          '<p class="vebd-muted" style="margin-top:8px">Their kit\'s colors count once all six roles are set; until then the site wears the look picked here (Fresh neighborhood by default).</p>' +
          (['paused', 'ended'].indexOf(S.status) < 0 ? '<form class="vebd-form" data-websend style="margin-top:10px"><label>A line for their email (optional)<input name="note" maxlength="1000" placeholder="Everything comes from your brand kit."></label><div><button class="vebd-btn" type="submit">' + (S.review === 'waiting' ? 'Send it again' : 'Send it to them for their OK') + '</button></div></form>' : '') +
          '<p class="vebd-msg" data-webmsg role="status"></p></section>';
        var ds = S.domain_state || {};
        out += '<section class="vebd-card"><h4>Their domain</h4>' + (!S.published ? '<p class="vebd-muted">Their domain is connected once they approve the site.</p>' : !S.domain ?
          '<p>The domain stays theirs. Add it here: it is attached to our hosting, and we show the records they (or whoever runs their domain) add. A bare domain also gets www, sent to it.</p><form class="vebd-form" data-webdom><label>Their domain<input name="domain" placeholder="greenleafkitchen.com" required></label><div><button class="vebd-btn" type="submit">Add their domain</button></div></form>' :
          '<p><b>' + esc(S.domain) + '</b>' + (S.www ? ' (and www.' + esc(S.domain) + ', sent to it)' : '') + '</p>' +
          '<div class="vebd-kv" style="margin-bottom:10px"><dt>On our hosting</dt><dd>' + (ds.on_project ? 'Yes' : 'No') + '</dd><dt>Their DNS</dt><dd>' + (ds.misconfigured === false ? 'Pointed at us' : 'Not pointed at us yet') + '</dd>' +
          '<dt>Secure (SSL)</dt><dd>' + (ds.ssl ? 'Yes' : 'Not yet' + (ds.ssl_error ? ' (' + esc(ds.ssl_error) + ')' : '')) + '</dd><dt>Last looked</dt><dd>' + esc(ds.checked_at ? new Date(ds.checked_at).toLocaleString() : '') + '</dd></div>' +
          ((ds.records || []).length && ds.misconfigured !== false ? '<p>They add these at their domain company, then we check again (SSL follows on its own within minutes):</p><table class="vebd-menu"><thead><tr><th>Type</th><th>Name</th><th>Value</th></tr></thead><tbody>' +
            ds.records.map(function (r) { return '<tr><td>' + esc(r.type) + '</td><td>' + esc(r.name) + '</td><td style="overflow-wrap:anywhere">' + esc(r.value) + '</td></tr>'; }).join('') + '</tbody></table>' : '') +
          '<p style="margin-top:10px"><button type="button" class="vebd-btn o" data-web="domain_check">Check the domain</button> <button type="button" class="vebd-btn" data-web="check">Run the final check</button> <button type="button" class="vebd-btn o sm" data-web="domain_remove">Take the domain off</button></p>') +
          '<p class="vebd-msg" data-webmsg role="status"></p></section>';
      }
      // Their old website's addresses: read before the domain moves, each sent on to its new page so the search traffic follows them.
      var OP = S.old_pages || [], NEWP = (W.pages || []).map(function (p) { return [p.path, p.name]; }), pname = function (to) { var x = NEWP.filter(function (p) { return p[0] === (to || ''); })[0]; return x ? x[1] : 'Home'; };
      var moved = OP.filter(function (p) { return p.how !== 'same' && p.path !== '/'; });
      if (A || moved.length) out += '<section class="vebd-card"><div class="vebd-bar"><h4 style="margin:0">' + (A ? 'Their old website\'s addresses' : 'Your old website\'s addresses') + '</h4>' + (S.old_scanned_at ? '<span class="vebd-pill ok">' + moved.length + ' sent on</span>' : '<span class="vebd-pill wait">Not read yet</span>') + '</div>' +
        '<p class="vebd-muted">' + (A ? 'Before their domain moves to us we read their current site (its sitemap and home page) and send every old address to the matching new page with a permanent redirect, so links people saved and what Google already ranks keep working. Change any match; the final check tries them.' :
          'Every address your old website had sends visitors to the matching page on your new one, so saved links and what Google already shows keep working.') + '</p>' +
        (S.old_note ? '<p class="vebd-muted">' + esc(S.old_note) + (S.old_scanned_at ? ' Read ' + esc(day(S.old_scanned_at)) + '.' : '') + '</p>' : '') +
        (moved.length ? '<form data-webold><table class="vebd-menu"><thead><tr><th>Old address</th><th>Its title</th><th>Goes to</th></tr></thead><tbody>' + moved.map(function (p, i) {
          return '<tr><td style="overflow-wrap:anywhere">' + esc(p.path) + '</td><td><small class="vebd-muted">' + esc(p.title || '') + '</small></td><td>' + (A ? '<select name="to' + i + '" data-path="' + esc(p.path) + '">' + NEWP.map(function (n) { return '<option value="' + esc(n[0]) + '"' + ((p.to || '') === n[0] ? ' selected' : '') + '>' + esc(n[1]) + '</option>'; }).join('') + '</select>' : esc(pname(p.to))) +
            (A && p.how === 'home' ? ' <small class="vebd-muted">nothing matched</small>' : '') + '</td></tr>'; }).join('') + '</tbody></table>' + (A ? '<div style="margin-top:10px"><button class="vebd-btn o" type="submit">Save the matches</button></div>' : '') + '</form>' : '') +
        (A ? '<form class="vebd-form" data-webold-add style="margin-top:12px"><label>An old address the scan missed<input name="path" placeholder="/our-menu" maxlength="300"></label><label>Goes to<select name="to">' + NEWP.map(function (n) { return '<option value="' + esc(n[0]) + '">' + esc(n[1]) + '</option>'; }).join('') + '</select></label><div><button class="vebd-btn o" type="submit">Add it</button></div></form>' +
          (S.status !== 'live' ? '<p style="margin-top:10px"><button type="button" class="vebd-btn o sm" data-web="old_scan">' + (S.old_scanned_at ? 'Read their old site again' : 'Read their old site now') + '</button></p>' : '') : '') +
        '<p class="vebd-msg" data-webmsg role="status"></p></section>';
      if (S.checks && S.checks.length) out += '<section class="vebd-card"><h4>The final check</h4><p class="vebd-muted">' + esc(new Date(S.checked_at).toLocaleString()) + ': ' + S.checks.filter(function (c) { return c.ok; }).length + ' of ' + S.checks.length + ' passed.</p><ul class="vebd-list">' +
        S.checks.map(function (c) { return '<li><span><b>' + esc(c.what) + '</b><br><small class="vebd-muted">' + esc(c.note) + '</small></span><span class="vebd-pill ' + (c.ok ? 'ok' : 'wait') + '">' + (c.ok ? 'Passed' : 'Not yet') + '</span></li>'; }).join('') + '</ul></section>';
      if (A && ['approved', 'connecting', 'live', 'paused'].indexOf(S.status) >= 0) out += '<section class="vebd-card"><h4>Take it down</h4><p class="vebd-muted">Taking it down shows a plain page on their domain until it is put back. Ending it takes their domain off our hosting (their old site, the domain and everything in their Library stay theirs).</p><p>' +
        (S.status === 'paused' ? '<button type="button" class="vebd-btn o" data-web="resume">Put it back up</button>' : '<button type="button" class="vebd-btn o" data-web="pause">Take it down for now</button>') + ' <button type="button" class="vebd-btn o sm" data-web="end">End it</button></p><p class="vebd-msg" data-webmsg role="status"></p></section>';
      out += '<section class="vebd-card"><h4>Every step</h4><ul class="vebd-list">' + (W.events || []).map(function (e) {
        return '<li><span><b>' + esc(WEV[e.kind] || e.kind) + (e.kind === 'approved' && e.data && e.data.version ? ', version ' + esc(e.data.version) : '') + '</b><br><small class="vebd-muted">' + esc(e.by_name || '') + (e.note ? ' &middot; ' + esc(e.note) : '') + '</small></span><small class="vebd-muted">' + esc(new Date(e.at).toLocaleString()) + '</small></li>'; }).join('') + '</ul></section>';
      frame(out);
      wireWebsite();
    }
    function wireWebsite() {
      var msg = function (t, bad) { var m = el.querySelectorAll('[data-webmsg]'); m.forEach(function (x) { x.textContent = t; x.classList.toggle('bad', !!bad); }); };
      var call = function (body, ok) {
        if (WEB.sample) { msg('Sample: nothing is saved or sent.'); return; }
        msg('Working...');
        api(Object.assign({ account_id: D.account.id }, body)).then(function (d) {
          if (d && d.ok) { WEB = d; drawWebsite(); if (ok) msg(typeof ok === 'function' ? ok(d) : ok); return; }
          msg((d && d.message) || ({ no_kit: 'Start their brand kit first.', name_needed: 'Type your full name.', note_needed: 'Say how they agreed.', bad_domain: 'That is not a domain.', domain_used: 'Another client has that domain.', not_theirs: 'That is one of our own domains.', nothing_to_approve: 'There is nothing waiting for an OK.' })[d && d.error] || 'That did not go through.', true);
        }, function () { msg('That did not go through.', true); });
      };
      el.querySelectorAll('[data-web]').forEach(function (b) {
        b.addEventListener('click', function () {
          var k = b.dataset.web;
          if (k === 'end' && !confirm('End their website? Their domain comes off our hosting.')) return;
          if (k === 'domain_remove' && !confirm('Take ' + WEB.site.domain + ' off our hosting? The site stops answering on it.')) return;
          b.disabled = true;
          var map = { start: { action: 'site_start' }, domain_check: { action: 'site_domain_check' }, check: { action: 'site_check' }, domain_remove: { action: 'site_domain_remove' },
            old_scan: { action: 'site_old_scan' }, pause: { action: 'site_status', status: 'paused' }, resume: { action: 'site_status', status: 'resume' }, end: { action: 'site_status', status: 'ended' } };
          call(map[k], k === 'check' ? function (d) { return d.launched ? 'Every check passed. It is live, and the owner has been emailed.' : 'Checked. See what is not there yet below.'; } : k === 'domain_check' ? 'Looked again.' : '');
        });
      });
      var f;
      if ((f = el.querySelector('[data-webok]'))) f.addEventListener('submit', function (e) { e.preventDefault(); var E = f.elements; call({ action: 'site_decide', decision: 'approve', name: E.namedItem('name').value, note: E.namedItem('note') ? E.namedItem('note').value : '' }, 'Approved. Thank you.'); });
      if ((f = el.querySelector('[data-webch]'))) { var fc = f; el.querySelector('[data-webch-open]').addEventListener('click', function () { fc.hidden = false; fc.elements.namedItem('note').focus(); });
        fc.addEventListener('submit', function (e) { e.preventDefault(); call({ action: 'site_decide', decision: 'changes', note: fc.elements.namedItem('note').value }, 'Sent. We will make the changes and send it again.'); }); }
      if ((f = el.querySelector('[data-weblook]'))) f.addEventListener('submit', function (e) { e.preventDefault(); call({ action: 'site_look', look: e.target.elements.namedItem('look').value || null }, 'Saved. The preview wears it now.'); });
      if ((f = el.querySelector('[data-websend]'))) f.addEventListener('submit', function (e) { e.preventDefault(); call({ action: 'site_send', note: e.target.elements.namedItem('note').value }, 'Sent. They have the preview link by email.'); });
      if ((f = el.querySelector('[data-webold]'))) f.addEventListener('submit', function (e) { e.preventDefault(); var pages = []; e.target.querySelectorAll('select[data-path]').forEach(function (x) { pages.push({ path: x.dataset.path, to: x.value }); }); call({ action: 'site_old_save', pages: pages }, 'Saved. Their domain sends each one there.'); });
      if ((f = el.querySelector('[data-webold-add]'))) f.addEventListener('submit', function (e) { e.preventDefault(); var E = e.target.elements; call({ action: 'site_old_save', add_path: E.namedItem('path').value, add_to: E.namedItem('to').value }, 'Added.'); });
      if ((f = el.querySelector('[data-webdom]'))) f.addEventListener('submit', function (e) { e.preventDefault(); call({ action: 'site_domain', domain: e.target.elements.namedItem('domain').value }, 'Added. Send them the records below.'); });
    }
    function draw() {
      if (!D) return load();
      if (view === 'reports') return drawReports();
      if (view === 'campaigns') return drawCampaigns();
      if (view === 'social') return drawSocial();
      if (view === 'website') return drawWebsite();
      if (view === 'insights') return drawInsights();
      if (view === 'kit') return drawKit();
      var body = view === 'library' ? drawLibrary() : view === 'sheet' ? drawSheet() : drawStart();
      el.innerHTML = '<div class="vebd">' + (D.sample ? '<p class="vebd-muted"><span class="vebd-pill wait">Sample</span> What a BrandDesk client sees: their onboarding, numbers, website, brand kit and everything we made for them, theirs to keep. Downloads here are the sample\'s illustrative photos.</p>' : D.account.test ? '<p class="vebd-muted"><span class="vebd-pill wait">Test account</span></p>' : '') + sub() + body + '</div>';
      wire();
    }
    function wire() {
      el.querySelectorAll('[data-bdr]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); if (view !== 'reports') { view = 'reports'; if (o.go) o.go('reports'); } reportId = a.dataset.bdr; if (o.goReport) o.goReport(reportId); drawReports(); }); });
      el.querySelectorAll('[data-bdv]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); go(a.dataset.bdv); }); });
      el.querySelectorAll('[data-bdk]').forEach(function (b) { b.addEventListener('click', function () { kindFilter = b.dataset.bdk; draw(); }); });
      el.querySelectorAll('[data-bdstep]').forEach(function (b) {
        b.addEventListener('click', function () {
          b.disabled = true;
          api({ action: 'step', account_id: D.account.id, step: b.dataset.bdstep, done: b.dataset.on === '1' }).then(function (d) { if (d && d.ok) D.steps = d.steps; draw(); });
        });
      });
      el.querySelectorAll('[data-bdrm]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (!confirm('Take this file out of their Library? It is kept on our side.')) return;
          api({ action: 'file_remove', file_id: b.dataset.bdrm }).then(function () { D = null; draw(); });
        });
      });
      var S = view === 'sheet' ? sheetModel(D) : null;
      var csv = el.querySelector('#vebd-csv'), html = el.querySelector('#vebd-html');
      if (csv) csv.addEventListener('click', function () { save(slugify(S.name) + '-menu.csv', new Blob([menuCsv(S)], { type: 'text/csv' })); });
      if (html) html.addEventListener('click', function () { save(slugify(S.name) + '-asset-sheet.html', new Blob([sheetHtml(S, true)], { type: 'text/html' })); });
      var all = el.querySelector('#vebd-all');
      if (all) all.addEventListener('click', function () {
        var msg = el.querySelector('#vebd-all-msg'), files = D.files.filter(function (f) { return f.download; }), S2 = sheetModel(D);
        all.disabled = true; msg.className = 'vebd-msg'; msg.textContent = 'Getting your files ready...';
        jszip().then(function (JSZip) {
          var zip = new JSZip(), n = 0, used = {};
          zip.file('asset-sheet.html', sheetHtml(S2, true));
          if (S2.menu.length) zip.file('menu.csv', menuCsv(S2));
          return files.reduce(function (p, f) {
            return p.then(function () {
              return fetch(f.download).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (b) {
                var ext = (f.download.split('?')[0].match(/\.[a-z0-9]{2,5}$/i) || [''])[0];
                var name = (decodeURIComponent((f.download.match(/[?&]download=([^&]+)/) || [])[1] || '') || slugify(f.title) + ext), k = (KIND_WORD[f.kind] || f.kind).toLowerCase().replace(/[^a-z0-9]+/g, '-');
                var key = k + '/' + name; if (used[key]) key = k + '/' + (++used[key]) + '-' + name; else used[key] = 1;
                zip.file(key, b); n++; msg.textContent = 'Getting your files ready... ' + n + ' of ' + files.length;
              }).catch(function () { /* one file missing does not stop the rest */ });
            });
          }, Promise.resolve()).then(function () { return zip.generateAsync({ type: 'blob' }); }).then(function (blob) {
            save(slugify(S2.name) + '-library.zip', blob); all.disabled = false;
            msg.textContent = 'Downloaded ' + n + ' files, your asset sheet' + (S2.menu.length ? ' and your menu' : '') + '.' + (D.files.length > files.length ? ' Full-size files open once your setup is paid in full.' : '');
          });
        }).catch(function () { all.disabled = false; msg.className = 'vebd-msg bad'; msg.textContent = 'That did not finish. Try again, or download the files one at a time.'; });
      });
      var arc = el.querySelector('#vebd-arc');
      if (arc) arc.addEventListener('submit', function (e) {
        e.preventDefault(); var m = el.querySelector('#vebd-arc-msg'); m.className = 'vebd-msg'; m.textContent = 'Starting...';
        api({ action: 'archive', account_id: D.account.id, url: arc.url.value.trim() }).then(function (d) {
          if (d && d.ok) { m.textContent = 'Archiving ' + d.url + '. It takes a minute or two; refresh to see it.'; return; }
          m.className = 'vebd-msg bad'; m.textContent = (d && d.message) || 'That did not start.';
        });
      });
      var up = el.querySelector('#vebd-up');
      if (up) up.addEventListener('submit', function (e) {
        e.preventDefault();
        var m = el.querySelector('#vebd-up-msg'), files = Array.prototype.slice.call(up.files.files || []), kind = up.kind.value, title = up.title.value.trim();
        if (!files.length) { m.className = 'vebd-msg bad'; m.textContent = 'Choose a file.'; return; }
        m.className = 'vebd-msg'; var done = 0;
        files.reduce(function (p, f) {
          return p.then(function () {
            m.textContent = 'Uploading ' + (done + 1) + ' of ' + files.length + '...';
            return dims(f).then(function (wh) {
              return api({ action: 'file_upload_url', account_id: D.account.id, kind: kind, name: f.name, mime: f.type, bytes: f.size }).then(function (u) {
                if (!u || !u.ok) throw new Error((u && u.message) || 'upload link');
                return fetch(u.url, { method: 'PUT', headers: { 'Content-Type': f.type || 'application/octet-stream', 'x-upsert': 'false' }, body: f }).then(function (r) {
                  if (!r.ok) throw new Error('upload');
                  return api({ action: 'file_done', account_id: D.account.id, path: u.path, title: files.length === 1 ? title : '', bytes: f.size, mime: f.type, width: wh[0], height: wh[1] });
                }).then(function (d) { if (!d || !d.ok) throw new Error('save'); done++; });
              });
            });
          });
        }, Promise.resolve()).then(function () { D = null; draw(); }, function (err) { m.className = 'vebd-msg bad'; m.textContent = 'Stopped after ' + done + ': ' + (err.message || 'that did not upload') + '.'; });
      });
    }
    function dims(f) {
      return new Promise(function (ok) {
        if (!/^image\//.test(f.type) || /svg/.test(f.type)) return ok([0, 0]);
        var i = new Image(), u = URL.createObjectURL(f); i.onload = function () { ok([i.naturalWidth, i.naturalHeight]); URL.revokeObjectURL(u); }; i.onerror = function () { ok([0, 0]); }; i.src = u;
      });
    }
    load();
    return { reload: function () { D = null; draw(); }, show: function (v) { view = v; draw(); } };
  }

  // The sample business (Green Leaf Kitchen) has no account: its Cartridge and photos stand in, nothing is saved.
  function sampleData() {
    var load = window.VE_CARTRIDGE ? Promise.resolve() : new Promise(function (ok) { var s = document.createElement('script'); s.src = '/business/sample/cartridge.js'; s.onload = ok; s.onerror = ok; document.head.appendChild(s); });
    return load.then(function () {
      var C = window.VE_CARTRIDGE || {}, files = [], now = new Date().toISOString();
      var add = function (kind, title, src, note) { files.push({ id: 's' + files.length, kind: kind, title: title, view: src, download: src, created_at: now, note: note || '' }); };
      ((C.brand || {}).logo || {}).primary && add('logo', 'Primary logo, stacked, on cream', C.brand.logo.primary.src);
      (((C.brand || {}).logo || {}).files || []).forEach(function (f) { if (f.src) add('logo', f.name, f.src); });
      ((C.photos || {}).space || []).forEach(function (p) { if (p.src) add('photo', p.shot, p.src); });
      ((C.menu || {}).sections || []).forEach(function (sec) { (sec.items || []).forEach(function (it) { if (it.photo && it.photo.src) add('photo', it.name, it.photo.src, sec.name); }); });
      var steps = [['welcome', 'Your welcome call'], ['owner', 'We confirm you run the business'], ['archive', 'A copy of your current website, kept for you'], ['brand_kit', 'Your brand kit'],
        ['google', 'Your Google profile, with us as a manager'], ['domain', 'Access to your domain settings (you keep the domain)'], ['socials', 'Access to your two social platforms'], ['shoot', 'Your photos'], ['website', 'Your new website, live on your domain'], ['library', 'Your Library']]
        .map(function (s, i) { return { key: s[0], client: s[1], team: s[1], how: 'team', done_at: ['2026-10-14', '2026-10-14', '2026-10-15', '2026-10-22', '2026-10-16', '2026-10-16', '2026-10-17', '2026-10-28', '2026-11-03', '2026-11-04'][i] + 'T16:00:00Z' }; });
      return { ok: true, admin: false, sample: true, unlocked: true, steps: steps, files: files, archives: [],
        account: { id: 'sample', status: 'active', plan: 'managed', addons: ['photos'], setup_plan: 'full', social: true, activated_at: '2026-10-14' },
        listing: { name: (C.business || {}).name || 'Green Leaf Kitchen', slug: 'sample' }, cartridge: { status: 'locked', updated_at: (C.meta || {}).updated, data: C },
        reports: [sampleMonth()], campaigns: sampleCampaigns() };
    });
  }
  // The sample business's social month (made up): two posts waiting for the owner's OK, one coming up, two posted.
  function sampleSocial() {
    var C = window.VE_CARTRIDGE || {}, pics = [];
    ((C.menu || {}).sections || []).forEach(function (sec) { (sec.items || []).forEach(function (it) { if (it.photo && it.photo.src) pics.push(it.photo.src); }); });
    ((C.photos || {}).space || []).forEach(function (p) { if (p.src) pics.push(p.src); });
    var pic = function (i) { return { id: 'm' + i, view: pics[i % Math.max(pics.length, 1)] || null }; };
    var at = function (days, h) { var d = new Date(); d.setDate(d.getDate() + days); d.setHours(h, 0, 0, 0); return d.toISOString(); };
    var n = new Date(), month = n.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return { ok: true, owner: true, team: false, sample: true, month_name: month, ok_hours: 48, counts: { planned: 12, posted: 2 },
      platforms: { instagram: { name: 'Instagram', meta: true }, tiktok: { name: 'TikTok', meta: false }, facebook: { name: 'Facebook', meta: true }, youtube: { name: 'YouTube', meta: false } },
      setup: { platforms: ['instagram', 'tiktok'], handles: { instagram: '@greenleafkitchen', tiktok: '@greenleafkitchen' }, per_month: 12, status: 'active', manager_name: 'Kai M.' },
      posts: [
        { id: 'p1', planned_at: at(4, 12), platforms: ['instagram', 'tiktok'], format: 'carousel', status: 'review', caption: 'Lunch is ready when you are. Our jackfruit tacos are back on the menu this week, with lime crema and pickled onions. Come hungry.', media: [pic(0), pic(1)], links: {} },
        { id: 'p2', planned_at: at(6, 18), platforms: ['tiktok'], format: 'video', status: 'review', caption: 'Thirty seconds in our kitchen: the cashew queso, start to finish.', media: [pic(2)], links: {} },
        { id: 'p3', planned_at: at(2, 11), platforms: ['instagram', 'tiktok'], format: 'photo', status: 'approved', caption: 'Weekend brunch starts Saturday at 10. The banana bread French toast is calling.', media: [pic(3)], links: {} },
        { id: 'p4', planned_at: at(-3, 12), platforms: ['instagram', 'tiktok'], format: 'photo', status: 'posted', caption: 'New on the menu: the Green Leaf bowl. Quinoa, roasted sweet potato, kale and our tahini dressing.', media: [pic(4)], links: { instagram: 'https://www.instagram.com/', tiktok: 'https://www.tiktok.com/' } },
        { id: 'p5', planned_at: at(-6, 17), platforms: ['instagram'], format: 'carousel', status: 'posted', caption: 'Thank you to everyone who came to customer appreciation night.', media: [pic(5), pic(6)], links: { instagram: 'https://www.instagram.com/' } }] };
  }
  // The sample business's report for last month, sent on the 6th of this one (made up, like Green Leaf Kitchen itself).
  function sampleMonth() {
    var n = new Date(), m = new Date(Date.UTC(n.getFullYear(), n.getMonth() - 1, 1, 12)), sent = new Date(Date.UTC(n.getFullYear(), n.getMonth(), Math.min(6, n.getDate()), 15));
    return { id: 'sample-report', month: m.toISOString().slice(0, 10), month_name: m.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }), status: 'sent', sent_at: sent.toISOString() };
  }
  function sampleCampaigns() {
    var n = new Date(), mk = function (off, day, h) { return new Date(n.getFullYear(), n.getMonth() + off, day, h, 0); }, mn = function (d) { return { month: new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1, 12)).toISOString().slice(0, 10), month_name: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }; };
    var a = mk(1, 12, 19), b = mk(1, 20, 18), c = mk(-1, 16, 19);
    return [Object.assign({ id: 's1', title: 'Customer appreciation', status: 'scheduled', starts_at: a.toISOString(), event_id: null, results: {} }, mn(a)),
      Object.assign({ id: 's2', title: 'Photo night', status: 'planned', starts_at: null, event_id: null, results: {} }, mn(b)),
      Object.assign({ id: 's3', title: 'Influencer night', status: 'done', starts_at: c.toISOString(), event_id: null, results: { came: 8, posts: 14, followers: 212, worked: 'The jackfruit tacos were in almost every post; two creators came back the next weekend.' } }, mn(c))];
  }
  function sampleReport() {
    var sm = sampleMonth();
    return Promise.resolve({ ok: true, steps: SAMPLE_STEPS, checkin: { id: 'sample-report', month: sm.month, month_name: sm.month_name, status: 'sent', sent_at: sm.sent_at,
      summary: sm.month_name.split(' ')[0] + ' was your best month with us so far. Your new website and the starter shoot went live in the second week, and the people who found you on Vegans Explore went up by almost half. The jackfruit tacos are now the most opened dish on your page.\n\nThree members visited for their visit bounty and sent photos of the brunch plates, which are in your Library and on your Google profile.',
      next_month: 'A customer appreciation night on the second Thursday, with a creator from your chapter filming it. We shoot the two new fall items the week before, and post your holiday hours on Google and your page by the 20th.',
      answers: { rating: 'Good', busiest: 'Saturday and Sunday brunch; Tuesday nights are quiet.', sold_best: 'Jackfruit tacos and the turmeric latte. The kale salad did not move.', heard: 'People keep asking for a gluten-free bread.', menu: 'Two fall items: a pumpkin curry and a pecan bar.', hours: 'Closed on Thanksgiving.', campaign: 'Customer appreciation', from_us: 'They liked the photos. Asked for Google posts more often.', needs: 'Holiday hours posted.' },
      numbers: { now: { views: 1240, visitors: 860, actions: { website: 96, directions: 141, call: 38, order: 52, menu: 210 }, checkins: 27, visits: 3, files: 34 },
        before: { views: 840, visitors: 590, actions: { website: 61, directions: 88, call: 30, order: 21, menu: 120 }, checkins: 14, visits: 0, files: 0 } } } });
  }
  var SAMPLE_STEPS = [{ q: [{ k: 'rating', label: 'How was the month for the business?' }, { k: 'busiest', label: 'When were they busiest, and when was it quiet?' }, { k: 'sold_best', label: 'What sold best? Anything that did not move?' }, { k: 'heard', label: 'What did customers say?' }] },
    { q: [{ k: 'menu', label: 'Any menu changes coming?' }, { k: 'hours', label: 'Any change to hours, closures or holidays?' }] },
    { q: [{ k: 'from_us', label: 'What did they like from us, and what should we do better?' }, { k: 'needs', label: 'Anything they need from us?' }] }];
  window.VEBrandDesk = { mount: mount, sampleData: sampleData, sampleReport: sampleReport, sheetModel: sheetModel, reportHtml: reportHtml };
})();
