/*
 * /public/ve-holiday-menu.js: a place's holiday menu in a lightbox over the page, laid out as a Vegans Explore menu (Sean, 2026-11-10,
 * Nana's A Vegan the prototype: "a uniform menu for all of the listings that shows their logo, that shows their name, and then has their
 * menu. If it's a long menu, it could be a scroll in the middle of it... information on ordering... their page, and then you can close it").
 * Their brand is their logo; the menu itself is ours, the same for every place (the start of a menu service for restaurants).
 * One component for the Holiday Guide's menu cards and the Directory listing page; never copy it.
 *
 *   VEHolidayMenu.open(menu, { onClose })   menu = { name, slug, logo, city, state, vegan (true | false | null), holiday,
 *                                                     summary, items [{name, desc, price, photo}], order_by (YYYY-MM-DD), pickup,
 *                                                     price_range, holiday_hours, order_url, link, note }
 *                                             A business menu has items; a found menu (a tip) has a note and a link to its own post.
 *   VEHolidayMenu.close()
 *   VEHolidayMenu.forListing(listing, el)    fills el with the listing's live holiday menu, if it has one: See Menu opens it,
 *                                             Holiday Guide goes to the whole Guide (every page with a menu promotes the Guide).
 *
 * Layout: the header (their logo and name, the Vegan tag at the right on the name's row, lined up with the prices) and the footer
 * (Order, Their page, Close) stay put; the menu between them scrolls. Ordering facts (Pickup, Price, Order by, Holiday hours) are
 * menu rows like the dishes. Closes on X, Close, Escape or a tap outside. Data comes from ve-holiday (`holidays`, `live`).
 */
(function () {
  if (window.VEHolidayMenu) return;
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-holiday';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var PAD = 28, PADM = 18, GUIDE = '/guides/holiday-guide';
  var CSS = '' +
    // The same gap above as before, and a deeper one below so it never reads as resting on the site footer (Sean, 2026-11-10).
    '.vhm-back{position:fixed;inset:0;z-index:100000;background:rgba(15,23,15,.6);display:flex;align-items:flex-start;justify-content:center;padding:6vh 16px 0}' +
    '.vhm{background:#fff;color:#1a1a1a;border-radius:12px;width:min(680px,100%);max-height:min(84vh,880px);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.32);font-family:inherit}' +
    '.vhm-head,.vhm-body,.vhm-foot{padding-left:' + PAD + 'px;padding-right:' + PAD + 'px;scrollbar-gutter:stable}' +
    '.vhm-head{flex:none;overflow:hidden;padding-top:14px;padding-bottom:16px;border-bottom:3px solid #1f5f22;background:#fbfdf9}' +
    '.vhm-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 12px}' +
    '.vhm-k{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#1f5f22;margin:0}' +
    '.vhm-k img{width:18px;height:18px;display:block}' +
    '.vhm-x{width:36px;height:36px;border-radius:6px;border:1px solid rgba(0,0,0,.14);background:#fff;font-size:22px;line-height:1;cursor:pointer;color:#1a1a1a;flex:none}' +
    '.vhm-id{display:flex;align-items:center;gap:14px}' +
    '.vhm-logo{width:64px;height:64px;border-radius:10px;flex:none;background:#fff center/contain no-repeat;border:1px solid rgba(0,0,0,.1);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:24px;color:#1f5f22}' +
    '.vhm-nm{flex:1;min-width:0}.vhm-nm h2{font-size:24px;line-height:1.15;margin:0;font-weight:800}.vhm-nm p{margin:3px 0 0;color:rgba(26,26,26,.6);font-size:14px}' +
    '.vhm-tag{flex:none;align-self:center;font-size:11.5px;font-weight:800;border-radius:6px;padding:4px 9px;background:#e8f5e9;color:#1f5f22;white-space:nowrap}.vhm-tag.pv{background:#fff3df;color:#8a5a00}' +
    '.vhm-body{flex:1 1 auto;overflow-y:auto;padding-top:6px;padding-bottom:10px;overscroll-behavior:contain}' +
    '.vhm-sum{font-size:14.5px;line-height:1.55;margin:14px 0 0;color:rgba(26,26,26,.75)}' +
    '.vhm-sec{margin:20px 0 0}.vhm-sec h3{margin:0;font-size:11.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#1f5f22;padding:0 0 8px;border-bottom:1px solid #cfe5d0}' +
    '.vhm-it{display:flex;gap:12px;padding:12px 0;border-bottom:1px dashed rgba(0,0,0,.12)}.vhm-it:last-child{border-bottom:0}.vhm-it img{width:60px;height:60px;object-fit:cover;border-radius:6px;flex:none}' +
    '.vhm-it>div{flex:1;min-width:0}.vhm-ih{display:flex;justify-content:space-between;gap:12px;align-items:baseline}.vhm-ih b{font-size:15.5px}.vhm-ih em{font-style:normal;font-weight:800;color:#1f5f22;white-space:nowrap}' +
    '.vhm-it p{margin:3px 0 0;font-size:14px;line-height:1.5;color:rgba(26,26,26,.75)}' +
    '.vhm-note{font-size:14px;line-height:1.55;color:rgba(26,26,26,.75);margin:12px 0 0}' +
    '.vhm-foot{flex:none;border-top:1px solid rgba(0,0,0,.1);padding-top:14px;padding-bottom:14px;background:#fbfdf9}' +
    '.vhm-acts{display:flex;gap:8px;flex-wrap:nowrap}' +
    '.vhm-acts a,.vhm-acts button{flex:1 1 0;display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 12px;border-radius:6px;font:inherit;font-weight:800;font-size:12px;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;background:#22C55E;color:#03170a;border:0;cursor:pointer;white-space:nowrap}' +
    '.vhm-acts .g{background:#fff;color:#1a1a1a;border:1.5px solid rgba(0,0,0,.16)}' +
    '.vhm-fine{margin:10px 0 0;font-size:12px;color:rgba(26,26,26,.55);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}' +
    'html.vhm-open{overflow:hidden}' +
    '.vhm-card{border:1px solid #f2d7a6;background:#fff7e8;border-radius:10px;padding:18px 20px;margin:0 0 22px;display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap}' +
    '.vhm-card h3{margin:0 0 4px;font-size:18px}.vhm-card p{margin:0;font-size:14px;color:rgba(26,26,26,.75);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
    '.vhm-cbtns{display:flex;gap:8px;flex-wrap:nowrap}.vhm-card .vhm-cbtns a{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 18px;border-radius:6px;background:#fff;color:#1a1a1a;border:1.5px solid rgba(0,0,0,.16);font-weight:800;font-size:12px;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;white-space:nowrap}' +
    '@media(max-width:600px){.vhm-cbtns{width:100%}.vhm-cbtns>*{flex:1 1 0}}' +
    '.vhm-card button{min-height:42px;padding:0 18px;border-radius:6px;border:0;background:#22C55E;color:#03170a;font:inherit;font-weight:800;font-size:12px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;white-space:nowrap}' +
    '@media(max-width:600px){.vhm-back{padding:10px;align-items:center}.vhm{max-height:92vh}.vhm-head,.vhm-body,.vhm-foot{padding-left:' + PADM + 'px;padding-right:' + PADM + 'px}' +
      '.vhm-logo{width:52px;height:52px}.vhm-nm h2{font-size:20px}.vhm-acts a,.vhm-acts button{font-size:11px;letter-spacing:.04em;padding:0 8px}}';
  var box = null, onClose = null, lastFocus = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function css() { if (document.getElementById('vhm-css')) return; var s = document.createElement('style'); s.id = 'vhm-css'; s.textContent = CSS; document.head.appendChild(s); }
  function day(iso) { try { return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric' }); } catch (e) { return iso; } }
  function safe(u) { return /^https?:\/\//i.test(String(u || '')) ? u : ''; }
  function row(name, desc, price, photo) {
    var ph = safe(photo) || (/^\//.test(String(photo || '')) ? photo : '');
    return '<div class="vhm-it">' + (ph ? '<img src="' + esc(ph) + '" alt="" loading="lazy">' : '') + '<div><div class="vhm-ih"><b>' + esc(name) + '</b>' + (price ? '<em>' + esc(price) + '</em>' : '') + '</div>' + (desc ? '<p>' + esc(desc) + '</p>' : '') + '</div></div>';
  }
  function html(m) {
    var where = [m.city, m.state].filter(Boolean).join(', ');
    var tag = m.vegan === true ? '<span class="vhm-tag">100% Vegan</span>' : m.vegan === false ? '<span class="vhm-tag pv">Plant-based (Pre-Vegan)</span>' : '';
    var logo = safe(m.logo) || (/^\//.test(String(m.logo || '')) ? m.logo : '');
    var items = (m.items || []).filter(function (x) { return x && x.name; });
    var ordering = [m.pickup ? row('Pickup', m.pickup) : '', m.price_range ? row('Price', m.price_range) : '', m.order_by ? row('Order by', day(m.order_by)) : '',
      m.holiday_hours ? row('Holiday hours', m.holiday_hours) : ''].join('');
    var order = safe(m.order_url) || safe(m.link);
    return '<div class="vhm-head"><div class="vhm-bar"><p class="vhm-k"><img src="/public/ve-logo-mark.svg" alt="">Vegans Explore &middot; ' + esc((m.holiday || 'Holiday') + ' Menu') + '</p>' +
        '<button type="button" class="vhm-x" aria-label="Close" data-vhm-x>&times;</button></div>' +
        '<div class="vhm-id"><div class="vhm-logo"' + (logo ? ' style="background-image:url(\'' + esc(logo) + '\')"' : '') + '>' + (logo ? '' : esc(String(m.name || '?').charAt(0))) + '</div>' +
        '<div class="vhm-nm"><h2 id="vhm-t">' + esc(m.name) + '</h2>' + (where ? '<p>' + esc(where) + '</p>' : '') + '</div>' + tag + '</div></div>' +
      '<div class="vhm-body">' + (m.summary ? '<p class="vhm-sum">' + esc(m.summary) + '</p>' : '') +
        (items.length ? '<div class="vhm-sec"><h3>The Menu</h3>' + items.map(function (x) { return row(x.name, x.desc, x.price, x.photo); }).join('') + '</div>'
          : '<div class="vhm-sec"><h3>The Menu</h3>' + (m.note ? '<p class="vhm-note">' + esc(m.note) + '</p>' : '') + '<p class="vhm-note">We are still getting their full dish list. Their own post has it for now.</p></div>') +
        (ordering ? '<div class="vhm-sec"><h3>Ordering</h3>' + ordering + '</div>' : '') + '</div>' +
      '<div class="vhm-foot"><div class="vhm-acts">' + (order ? '<a href="' + esc(order) + '" target="_blank" rel="noopener">Order</a>' : '') +
        // On their own page the menu points to the whole Holiday Guide instead (Sean, 2026-11-10: "Any page that features a menu
        // should also feature the Holiday Guide").
        (/\/directory\//.test(location.pathname) ? '<a class="g" href="' + GUIDE + '">Holiday Guide</a>' : m.slug ? '<a class="g" href="/directory/' + encodeURIComponent(m.slug) + '">Their page</a>' : '') +
        '<button type="button" class="g" data-vhm-x>Close</button></div>' +
        '<p class="vhm-fine"><span>From their own holiday post. Check prices and dates when you order.</span><span>Menu by Vegans Explore</span></p></div>';
  }
  function close() {
    if (!box) return;
    box.remove(); box = null; document.documentElement.classList.remove('vhm-open'); document.removeEventListener('keydown', onKey);
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
    var f = onClose; onClose = null; if (f) f();
  }
  function onKey(e) { if (e.key === 'Escape') close(); }
  function open(m, opt) {
    css(); if (box) { onClose = null; box.remove(); box = null; }
    lastFocus = document.activeElement; onClose = opt && opt.onClose || null;
    box = document.createElement('div'); box.className = 'vhm-back';
    box.innerHTML = '<div class="vhm" role="dialog" aria-modal="true" aria-labelledby="vhm-t">' + html(m) + '</div>';
    box.addEventListener('click', function (e) { if (e.target === box || e.target.closest('[data-vhm-x]')) close(); });
    document.body.appendChild(box); document.documentElement.classList.add('vhm-open'); document.addEventListener('keydown', onKey);
    var x = box.querySelector('.vhm-x'); if (x) x.focus();
  }
  function post(body) { return fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY }, body: JSON.stringify(body) }).then(function (r) { return r.json(); }); }
  // The listing page: the live menu for a holiday in its season (promo_from to the day after the holiday), first one found.
  function forListing(l, el) {
    if (!l || !l.id || !el) return;
    post({ action: 'holidays' }).then(function (d) {
      var now = Date.now();
      var hs = ((d && d.holidays) || []).filter(function (h) { return (!h.promo_from || Date.parse(h.promo_from) <= now) && Date.parse(h.holiday_on + 'T23:59:00-05:00') + 864e5 > now; });
      return hs.reduce(function (p, h) {
        return p.then(function (found) {
          if (found) return found;
          return post({ action: 'live', holiday: h.slug }).then(function (r) {
            var m = ((r && r.menus) || []).filter(function (x) { return x.listing_id === l.id; })[0];
            var t = !m && ((r && r.tips) || []).filter(function (x) { return x.listing_id === l.id; })[0];
            if (!m && !t) return null;
            var base = { name: l.name, slug: l.slug, logo: l.logo_url, city: l.address_city, state: l.address_state,
              vegan: l.vegan_status === 'fully_vegan' ? true : l.vegan_status ? false : null, holiday: String(h.name || '').replace(/\s*\(.*\)$/, '') };
            return m ? Object.assign(base, { summary: m.summary, items: m.items, order_by: m.order_by, pickup: m.pickup, price_range: m.price_range, holiday_hours: m.holiday_hours, order_url: m.order_url })
              : Object.assign(base, { note: t.note, link: t.link });
          });
        });
      }, Promise.resolve(null));
    }).then(function (m) {
      if (!m) return;
      css();
      el.innerHTML = '<div class="vhm-card"><div style="flex:1;min-width:220px"><h3>' + esc(m.holiday) + ' Menu</h3><p>' + esc(m.summary || m.note || '') + '</p></div>' +
        '<div class="vhm-cbtns"><button type="button" data-vhm-open>See Menu</button><a class="g" href="' + GUIDE + '">Holiday Guide</a></div></div>';
      el.hidden = false;
      el.querySelector('[data-vhm-open]').addEventListener('click', function () { open(m); });
    }).catch(function () {});
  }
  window.VEHolidayMenu = { open: open, close: close, forListing: forListing };
})();
