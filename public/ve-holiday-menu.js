/*
 * /public/ve-holiday-menu.js: a place's holiday menu in a window over the page (Sean, 2026-11-10, Nana's A Vegan the prototype:
 * "a pop-up... in the center, overlaid the page, you could see it and then close it, and then have the same thing on their page").
 * One component for the Holiday Guide's menu cards and the Directory listing page; never copy it.
 *
 *   VEHolidayMenu.open(menu, { onClose })   menu = { name, slug, city, state, vegan (true | false | null), holiday,
 *                                                     summary, items [{name, desc, price, photo}], order_by (YYYY-MM-DD), pickup,
 *                                                     price_range, holiday_hours, order_url, link, note }
 *                                             A business menu has items; a found menu (a tip) has a note and a link to its own post.
 *   VEHolidayMenu.close()
 *   VEHolidayMenu.forListing(listing, el)    fills el with the listing's live holiday menu, if it has one, and shows it.
 *
 * Closes on X, Escape or a tap outside. Data comes from ve-holiday (`holidays`, `live`).
 */
(function () {
  if (window.VEHolidayMenu) return;
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-holiday';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var CSS = '' +
    '.vhm-back{position:fixed;inset:0;z-index:100000;background:rgba(15,23,15,.55);display:flex;align-items:center;justify-content:center;padding:24px 16px}' +
    '.vhm{position:relative;background:#fff;color:#1a1a1a;border-radius:10px;width:min(680px,100%);max-height:min(86vh,900px);overflow:auto;box-shadow:0 24px 60px rgba(0,0,0,.3);font-family:inherit}' +
    '.vhm-in{padding:26px 28px 24px}' +
    '.vhm-x{position:sticky;top:0;float:right;margin:10px 10px 0 0;width:38px;height:38px;border-radius:6px;border:1px solid rgba(0,0,0,.12);background:#fff;font-size:22px;line-height:1;cursor:pointer;color:#1a1a1a;z-index:1}' +
    '.vhm-k{font-size:11.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#1f5f22;margin:0 0 6px}' +
    '.vhm h2{font-size:26px;line-height:1.15;margin:0 0 4px;font-weight:800}' +
    '.vhm-w{color:rgba(26,26,26,.6);font-size:14px;margin:0 0 10px}' +
    '.vhm-tag{display:inline-block;font-size:11.5px;font-weight:800;border-radius:6px;padding:3px 8px;background:#e8f5e9;color:#1f5f22}.vhm-tag.pv{background:#fff3df;color:#8a5a00}' +
    '.vhm-sum{font-size:15px;line-height:1.55;margin:12px 0 0}' +
    '.vhm-facts{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0}.vhm-facts span{font-size:13px;background:#fff7e8;border:1px solid #f2d7a6;border-radius:6px;padding:6px 10px}' +
    '.vhm-items{margin:18px 0 0;border-top:1px solid rgba(0,0,0,.1)}' +
    '.vhm-it{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid rgba(0,0,0,.08)}.vhm-it img{width:64px;height:64px;object-fit:cover;border-radius:6px;flex:none}' +
    '.vhm-it>div{flex:1;min-width:0}.vhm-ih{display:flex;justify-content:space-between;gap:12px;align-items:baseline}.vhm-ih b{font-size:15.5px}.vhm-ih em{font-style:normal;font-weight:800;color:#1f5f22;white-space:nowrap}' +
    '.vhm-it p{margin:3px 0 0;font-size:14px;line-height:1.5;color:rgba(26,26,26,.75)}' +
    '.vhm-note{font-size:13px;color:rgba(26,26,26,.6);margin:16px 0 0}' +
    '.vhm-acts{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0 0}' +
    '.vhm-acts a{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border-radius:6px;font-weight:800;font-size:13px;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;background:#16a34a;color:#fff}' +
    '.vhm-acts a.g{background:#fff;color:#1a1a1a;border:1px solid rgba(0,0,0,.18)}' +
    'html.vhm-open{overflow:hidden}' +
    '.vhm-card{border:1px solid #f2d7a6;background:#fff7e8;border-radius:10px;padding:18px 20px;margin:0 0 22px;display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap}' +
    '.vhm-card h3{margin:0 0 4px;font-size:18px}.vhm-card p{margin:0;font-size:14px;color:rgba(26,26,26,.75);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
    '.vhm-card button{min-height:42px;padding:0 18px;border-radius:6px;border:0;background:#16a34a;color:#fff;font-weight:800;font-size:13px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;white-space:nowrap}' +
    '@media(max-width:600px){.vhm-back{padding:12px}.vhm-in{padding:20px 18px 20px}.vhm h2{font-size:22px}.vhm{max-height:90vh}}';
  var box = null, onClose = null, lastFocus = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function css() { if (document.getElementById('vhm-css')) return; var s = document.createElement('style'); s.id = 'vhm-css'; s.textContent = CSS; document.head.appendChild(s); }
  function day(iso) { try { return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'long', day: 'numeric' }); } catch (e) { return iso; } }
  function safe(u) { return /^https?:\/\//i.test(String(u || '')) ? u : ''; }
  function html(m) {
    var where = [m.city, m.state].filter(Boolean).join(', ');
    var tag = m.vegan === true ? '<span class="vhm-tag">100% Vegan</span>' : m.vegan === false ? '<span class="vhm-tag pv">Plant-based (Pre-Vegan) menu</span>' : '';
    var facts = [m.order_by ? '<span><b>Order by</b> ' + esc(day(m.order_by)) + '</span>' : '', m.pickup ? '<span><b>Pickup</b> ' + esc(m.pickup) + '</span>' : '',
      m.price_range ? '<span><b>Price</b> ' + esc(m.price_range) + '</span>' : '', m.holiday_hours ? '<span><b>Holiday hours</b> ' + esc(m.holiday_hours) + '</span>' : ''].join('');
    var items = (m.items || []).filter(function (x) { return x && x.name; });
    var order = safe(m.order_url), src = safe(m.link);
    return '<button type="button" class="vhm-x" aria-label="Close" data-vhm-x>&times;</button><div class="vhm-in">' +
      '<p class="vhm-k">' + esc((m.holiday || 'Holiday') + ' Menu') + '</p><h2 id="vhm-t">' + esc(m.name) + '</h2>' + (where ? '<p class="vhm-w">' + esc(where) + '</p>' : '') + tag +
      (m.summary || m.note ? '<p class="vhm-sum">' + esc(m.summary || m.note) + '</p>' : '') +
      (facts ? '<div class="vhm-facts">' + facts + '</div>' : '') +
      (items.length ? '<div class="vhm-items">' + items.map(function (x) {
        var ph = safe(x.photo) || (/^\//.test(String(x.photo || '')) ? x.photo : '');
        return '<div class="vhm-it">' + (ph ? '<img src="' + esc(ph) + '" alt="" loading="lazy">' : '') + '<div><div class="vhm-ih"><b>' + esc(x.name) + '</b>' + (x.price ? '<em>' + esc(x.price) + '</em>' : '') + '</div>' + (x.desc ? '<p>' + esc(x.desc) + '</p>' : '') + '</div></div>';
      }).join('') + '</div>' : '<p class="vhm-note">We are still getting the full dish list from them. Their own post has it for now.</p>') +
      '<p class="vhm-note">From ' + esc(m.name) + '’s own holiday post. Prices and dates can change, so check with them when you order.</p>' +
      '<div class="vhm-acts">' + (order ? '<a href="' + esc(order) + '" target="_blank" rel="noopener">Order</a>' : src ? '<a href="' + esc(src) + '" target="_blank" rel="noopener">Order from them</a>' : '') +
      (m.slug && !/\/directory\//.test(location.pathname) ? '<a class="g" href="/directory/' + encodeURIComponent(m.slug) + '">Their page</a>' : '') + '</div></div>';
  }
  function close() {
    if (!box) return;
    box.remove(); box = null; document.documentElement.classList.remove('vhm-open'); document.removeEventListener('keydown', onKey);
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
    var f = onClose; onClose = null; if (f) f();
  }
  function onKey(e) { if (e.key === 'Escape') close(); }
  function open(m, opt) {
    css(); if (box) { var f = onClose; onClose = null; box.remove(); box = null; }
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
            var hn = String(h.name || '').replace(/\s*\(.*\)$/, '');
            return m ? { name: l.name, slug: l.slug, city: l.address_city, state: l.address_state, vegan: l.vegan_status === 'fully_vegan' ? true : l.vegan_status ? false : null, holiday: hn,
                summary: m.summary, items: m.items, order_by: m.order_by, pickup: m.pickup, price_range: m.price_range, holiday_hours: m.holiday_hours, order_url: m.order_url }
              : { name: l.name, slug: l.slug, city: l.address_city, state: l.address_state, vegan: null, holiday: hn, note: t.note, link: t.link };
          });
        });
      }, Promise.resolve(null));
    }).then(function (m) {
      if (!m) return;
      css();
      el.innerHTML = '<div class="vhm-card"><div style="flex:1;min-width:220px"><h3>' + esc(m.holiday) + ' Menu</h3><p>' + esc(m.summary || m.note || '') + '</p></div><button type="button" data-vhm-open>See the menu</button></div>';
      el.hidden = false;
      el.querySelector('[data-vhm-open]').addEventListener('click', function () { open(m); });
    }).catch(function () {});
  }
  window.VEHolidayMenu = { open: open, close: close, forListing: forListing };
})();
