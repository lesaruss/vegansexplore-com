/* ve-branddesk-client.js: a managed client's own space (BrandDesk, canon canon-ve-front-of-house; onboarding built 2026-10-31).
 * "They rent the service, they own the assets" (Sean, 2026-10-31): their Library, their asset sheet and how onboarding stands.
 *
 *   VEBrandDesk.mount(el, { slug | account_id, view: 'start'|'library'|'sheet', go: function (view) {}, admin: bool, load?: fn -> Promise })
 *
 * Three views, one at a time:
 *   start    Getting started: the onboarding checklist (ve-branddesk steps), their plan, and where things are
 *   library  every file we made for them, by kind, with Download and Download everything (a ZIP built in the browser, with the asset
 *            sheet and the menu as a spreadsheet inside). Full size opens once the setup is paid in full; their old website is
 *            always theirs.
 *   sheet    the asset sheet: everything about the business in one place, from their Cartridge (ve_cartridges), with Download the
 *            menu (CSV) and Download the asset sheet (HTML)
 * admin: true (Depot > BrandDesk) adds ticking steps, Archive their website and adding files to the Library.
 * load stands in for the server on the sample business (/business/sample), which has no account.
 */
(function () {
  if (window.VEBrandDesk) return;
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-branddesk';
  var KINDS = [['photo', 'Photos'], ['video', 'Videos'], ['logo', 'Logo files'], ['brand', 'Brand kit'], ['graphic', 'Graphics'], ['menu_board', 'Menu boards'], ['document', 'Documents'], ['archive', 'Your old website']];
  var KIND_WORD = {}; KINDS.forEach(function (k) { KIND_WORD[k[0]] = k[1]; });
  var PLAN = { full: 'Setup paid in full', '3': 'Setup in 3 monthly payments', '6': 'Setup in 6 monthly payments' };
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
      '.vebd-card{background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:12px;padding:16px 18px;margin:0 0 16px;}' +
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
      '.vebd-form select{appearance:none;-webkit-appearance:none;padding-right:44px;background:#fff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%23333\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E") no-repeat right 16px center;}' +
      '.vebd-msg{font-size:12.5px;font-weight:700;min-height:18px;color:var(--vb-accent,#1E7A3E);}.vebd-msg.bad{color:#B42318;}' +
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

  function mount(el, o) {
    o = o || {}; css();
    var D = null, kindFilter = '';
    var view = o.view || 'start';
    function go(v) { view = v; if (o.go) o.go(v); draw(); }
    function load() {
      el.innerHTML = '<div class="vebd"><p class="vebd-muted">Loading...</p></div>';
      (o.load ? o.load() : api({ action: 'client', slug: o.slug, account_id: o.account_id })).then(function (d) {
        if (!d || !d.ok) { el.innerHTML = '<div class="vebd"><p class="vebd-muted">' + (d && d.error === 'not_found' ? 'There is no managed marketing account here.' : 'This did not load. Try again in a moment.') + '</p></div>'; return; }
        D = d; draw();
      }, function () { el.innerHTML = '<div class="vebd"><p class="vebd-muted">This did not load. Try again in a moment.</p></div>'; });
    }
    function sub() {
      return '<nav class="vebd-sub" aria-label="Managed by us">' + [['start', 'Getting started'], ['library', 'Your Library'], ['sheet', 'Your asset sheet']].map(function (v) {
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
      var plan = '<section class="vebd-card"><h4>' + (D.admin ? 'Their plan' : 'Your plan') + '</h4><p>' + esc(PLAN[A.setup_plan] || '') + ', then $500 a month' + (A.social ? ', plus $500 a month for social media' : '') + '. Since ' + esc(day(A.activated_at)) + '.' +
        (A.pause_from ? ' Paused from ' + esc(day(A.pause_from)) + ' to ' + esc(day(A.pause_until)) + '.' : '') + '</p>' +
        '<p class="vebd-muted">' + (D.unlocked ? 'Your setup is paid in full, so every file in your Library downloads at full size.' : 'Full-size downloads of what we make open once your setup is paid in full. Your old website is always yours to download.') + '</p>' +
        (D.sample ? '<p><a class="vebd-btn o sm" href="/business/agreement" target="_blank" rel="noopener">The agreement</a> <a class="vebd-btn o sm" href="/business/sample/brand" target="_blank" rel="noopener">Their brand kit</a> <a class="vebd-btn o sm" href="/business/sample/site" target="_blank" rel="noopener">Their website</a></p>' :
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
    function draw() {
      if (!D) return load();
      var body = view === 'library' ? drawLibrary() : view === 'sheet' ? drawSheet() : drawStart();
      el.innerHTML = '<div class="vebd">' + (D.sample ? '<p class="vebd-muted"><span class="vebd-pill wait">Sample</span> What a managed client sees: everything we made for them, theirs to keep. Downloads here are the sample\'s illustrative photos.</p>' : D.account.test ? '<p class="vebd-muted"><span class="vebd-pill wait">Test account</span></p>' : '') + sub() + body + '</div>';
      wire();
    }
    function wire() {
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
        ['google', 'Your Google profile, with us as a manager'], ['domain', 'Access to your domain settings (you keep the domain)'], ['socials', 'Access to your two social platforms'], ['shoot', 'Your starter photo shoot'], ['library', 'Your Library']]
        .map(function (s) { return { key: s[0], client: s[1], team: s[1], how: 'team', done_at: now }; });
      return { ok: true, admin: false, sample: true, unlocked: true, steps: steps, files: files, archives: [],
        account: { id: 'sample', status: 'active', setup_plan: '3', social: true, activated_at: '2026-10-14' },
        listing: { name: (C.business || {}).name || 'Green Leaf Kitchen', slug: 'sample' }, cartridge: { status: 'locked', updated_at: (C.meta || {}).updated, data: C } };
    });
  }
  window.VEBrandDesk = { mount: mount, sampleData: sampleData, sheetModel: sheetModel };
})();
