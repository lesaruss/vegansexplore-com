/*
 * ve-venue-bounties.js: the bounty board for the venue Guides (Stadium & Arena, Airport).
 *
 * Sean, 2026-11-01: "depending on which stadium they're in, they click the bounties, it should clearly list what we want them to do
 * and list it in terms of highest bounty to lowest bounty. So people could literally be Pokemon going to this world looking for
 * different opportunities to level up the points."
 *
 * Two views, both drawn from what ve-venues already returns (no extra server call):
 *   VEVenueBounties.board(venues, o)   every venue of the Guide with open bounties, the most points first (ve-venues `bounties`)
 *   VEVenueBounties.venue(d, o)        one venue's jobs, grouped by what they pay, highest first (ve-venues `venue`)
 * The jobs: Find something we don't have (Something missing), Be first to confirm an item no member has checked lately (the
 * bounty), then Check it is still there for the rest. The amounts are ve_venue_report_points rows, so the board never disagrees
 * with what is paid. Every job opens the Guide's own report form, which holds the sign-in, Passport and Guide gates.
 *
 * o = { base: '#/venue/' | '#/airport/', owner: bool, points: {kind: row}, limits: {daily_paid_cap, fresh_days},
 *       where: 'section' | 'gate', place: 'venue' | 'airport', join: '#/join', free: free venue slug, freeName }
 */
(function () {
  if (window.VEVenueBounties) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function n(x) { return Number(x || 0).toLocaleString('en-US'); }

  function css() {
    if (document.getElementById('vbz-css')) return;
    var s = document.createElement('style'); s.id = 'vbz-css';
    s.textContent =
      '.vbz-note{background:#fff8e1;border:1px solid #f1dc9a;border-radius:8px;padding:12px 14px;font-size:13.5px;line-height:1.5;color:#5c4300;margin:0 0 16px;display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}' +
      '.vbz-note b{color:#3f2e00}' +
      '.vbz-tier{margin:20px 0 8px;display:flex;align-items:baseline;gap:10px}' +
      '.vbz-tier h3{font-size:15px;font-weight:900;margin:0;color:var(--ink,#1a1a1a)}' +
      '.vbz-tier span{font-size:12.5px;color:var(--ink75,rgba(0,0,0,.68))}' +
      '.vbz-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(420px,100%),1fr));gap:10px}' +
      '.vbz-job{display:grid;grid-template-columns:76px minmax(0,1fr) auto;gap:12px;align-items:center;background:#fff;border:1.5px solid var(--line,#e6e6e6);border-radius:8px;padding:12px;text-decoration:none;color:inherit}' +
      '.vbz-job:hover{border-color:var(--g2,#3A9B3E)}' +
      '.vbz-pts{border-radius:8px;background:#fff1b8;color:#6b4a00;text-align:center;padding:8px 4px;line-height:1.1}' +
      '.vbz-pts b{display:block;font-size:22px;font-weight:900}' +
      '.vbz-pts i{display:block;font-style:normal;font-size:10.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}' +
      '.vbz-pts.lo{background:#eef6ee;color:#1f5f22}' +
      '.vbz-job h4{margin:0 0 3px;font-size:14.5px;font-weight:800;line-height:1.3}' +
      '.vbz-job p{margin:0;font-size:12.5px;line-height:1.45;color:var(--ink75,rgba(0,0,0,.68))}' +
      '.vbz-where{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:var(--ink,#1a1a1a);margin:0 0 3px}' +
      '.vbz-no{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;border-radius:5px;background:var(--g,#2D5C27);color:#fff;font-size:11px;font-weight:900;padding:0 4px}' +
      '.vbz-go{font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:8px 11px;border-radius:6px;background:var(--g,#2D5C27);color:#fff;white-space:nowrap}' +
      '.vbz-small{font-size:12.5px;color:var(--ink75,rgba(0,0,0,.68));margin:14px 0 0;line-height:1.5}' +
      '.vbz-vcard{display:grid;grid-template-columns:96px minmax(0,1fr) auto;gap:14px;align-items:center;background:#fff;border:1.5px solid var(--line,#e6e6e6);border-radius:8px;padding:10px;text-decoration:none;color:inherit}' +
      '.vbz-vcard:hover{border-color:var(--g2,#3A9B3E)}' +
      '.vbz-vimg{width:96px;height:72px;border-radius:6px;background:#eef3ee center/cover no-repeat}' +
      '.vbz-vcard h4{margin:0 0 3px;font-size:15px;font-weight:800}' +
      '.vbz-vcard p{margin:0;font-size:12.5px;color:var(--ink75,rgba(0,0,0,.68))}' +
      '.vbz-rank{font-size:11px;font-weight:900;color:#6b4a00;letter-spacing:.04em;text-transform:uppercase}' +
      '.vbz-jhead{display:grid;grid-template-columns:76px minmax(0,1fr);gap:12px;align-items:center;margin:0 0 10px}' +
      '.vbz-jt{margin:2px 0 4px;font-size:19px;font-weight:900;line-height:1.25}' +
      '.vbz-jd{margin:0 0 8px;font-size:13.5px;line-height:1.5;color:var(--ink75,rgba(0,0,0,.68))}.vbz-jd b{color:var(--ink,#1a1a1a)}' +
      '.vbz-pic{margin:0 0 12px}.vbz-pic img{display:block;width:100%;height:170px;object-fit:cover;border-radius:10px;background:#eef3ee}' +
      '.vbz-pic figcaption{font-size:11.5px;color:var(--ink75,rgba(0,0,0,.68));margin-top:5px}' +
      '@media (max-width:560px){.vbz-job{grid-template-columns:64px minmax(0,1fr)}.vbz-job .vbz-go{grid-column:2;justify-self:start}' +
      '.vbz-vcard{grid-template-columns:72px minmax(0,1fr)}.vbz-vimg{width:72px;height:56px}.vbz-vcard .vbz-pts{grid-column:2;justify-self:start;padding:6px 10px}.vbz-vcard .vbz-pts b,.vbz-vcard .vbz-pts i{display:inline;font-size:13px}.vbz-vcard .vbz-pts i{margin-left:4px}}';
    document.head.appendChild(s);
  }

  function pay(P, kind, first) {
    var p = P[kind] || {};
    return first ? [p.first_with_photo || p.with_photo || 0, p.first_no_photo || p.no_photo || 0] : [p.with_photo || 0, p.no_photo || 0];
  }

  // Every job at one venue, highest pay first; ties keep the stand order the venue page uses.
  function jobs(d, o) {
    var P = o.points || {}, base = o.base + d.venue.slug + '/report/', out = [];
    var miss = pay(P, 'missing');
    out.push({ pts: miss[0], low: miss[1], order: -1, title: 'Find a Vegan item we don\'t have',
      what: 'Spot a Vegan item or a ' + (o.place === 'airport' ? 'spot' : 'stand') + ' that is not in the Guide yet. Photograph it with the menu or the sign.',
      href: base + 'missing' });
    (d.spots || []).forEach(function (s, si) {
      (s.items || []).forEach(function (it, ii) {
        var where = { num: si + 1, stand: s.name, at: s.where || '' };
        if (it.bounty) {
          var f = pay(P, 'confirm', true);
          out.push({ pts: f[0], low: f[1], order: si * 1000 + ii, where: where, bounty: true, title: 'Be first to confirm ' + it.name,
            what: it.freshness === 'stale' ? 'No member has checked it in ' + ((o.limits && o.limits.fresh_days) || 35) + ' days. Photograph it at the stand, or the menu board that shows it.'
              : 'No member has checked it yet. Photograph it at the stand, or the menu board that shows it.',
            href: base + 'confirm/' + it.id, page: o.base + d.venue.slug + '/bounties/' + it.id });
        } else {
          var c = pay(P, 'confirm');
          out.push({ pts: c[0], low: c[1], order: si * 1000 + ii, where: where, title: 'Check ' + it.name + ' is still there',
            what: 'Confirm it is still sold as written, with a photo for the most points.', href: base + 'confirm/' + it.id, page: o.base + d.venue.slug + '/bounties/' + it.id });
        }
      });
    });
    return out.sort(function (a, b) { return b.pts - a.pts || a.order - b.order; });
  }

  function jobRow(j) {
    var where = j.where ? '<div class="vbz-where"><span class="vbz-no">' + j.where.num + '</span>' + esc(j.where.stand) + (j.where.at ? ' &middot; ' + esc(j.where.at) : '') + '</div>' : '';
    return '<a class="vbz-job" href="' + esc(j.page || j.href) + '"><span class="vbz-pts' + (j.pts < 25 ? ' lo' : '') + '"><b>' + n(j.pts) + '</b><i>points</i></span>' +
      '<span><h4>' + esc(j.title) + '</h4>' + where + '<p>' + esc(j.what) + ' ' + n(j.low) + ' without a photo.</p></span><span class="vbz-go">' + (j.page ? 'Find it' : 'Do it') + '</span></a>';
  }

  function tierName(p, top, o) {
    if (p === top && p > 0) return 'The biggest bounties';
    return n(p) + ' points each';
  }

  // One venue's jobs.
  function venue(d, o) {
    css();
    var list = jobs(d, o), tiers = [], cur = null;
    list.forEach(function (j) { if (!cur || cur.pts !== j.pts) { cur = { pts: j.pts, items: [] }; tiers.push(cur); } cur.items.push(j); });
    var top = tiers.length ? tiers[0].pts : 0;
    var cap = (o.limits && o.limits.daily_paid_cap) || 40;
    var gate = o.owner ? '' : '<div class="vbz-note"><span><b>Bounties unlock with the Guide.</b> Here is everything we want at ' + esc(d.venue.name) +
      '. Get the Guide and every job here pays.</span><a class="dg-btn" href="' + esc(o.join || '#/join') + '">Get the Guide</a></div>';
    var P = o.points || {}, wr = pay(P, 'wrong'), cm = pay(P, 'comment');
    return gate + tiers.map(function (t) {
      return '<div class="vbz-tier"><h3>' + esc(tierName(t.pts, top, o)) + '</h3><span>' + t.items.length + ' job' + (t.items.length === 1 ? '' : 's') + (t.pts === top ? ', ' + n(t.pts) + ' points each with a photo' : '') + '</span></div>' +
        '<div class="vbz-list">' + t.items.map(jobRow).join('') + '</div>';
    }).join('') +
      '<p class="vbz-small">Something changed, or not there anymore? Open the item\'s Update for ' + n(wr[0]) + ' points with a photo. A comment on any item pays ' + n(cm[0]) +
      '. Do it from inside the ' + esc(o.place || 'venue') + ': your phone\'s location is checked. The team checks every report and points land once it is accepted, up to ' + n(cap) + ' paid a day. The first to confirm an item gets the bounty; after that it pays its usual amount.</p>';
  }

  // Every venue with open bounties, the most points first.
  function board(venues, o) {
    css();
    if (!venues.length) return '<p class="dg-empty">No bounties are open here right now. Every item has been checked lately: try another city, or add something new at a ' + esc(o.place || 'venue') + ' you visit.</p>';
    return '<div class="vbz-list" style="grid-template-columns:1fr">' + venues.map(function (v, i) {
      var img = v.image ? ' style="background-image:url(\'' + esc(v.image) + '\')"' : '';
      var line = v.empty ? 'Nothing listed yet: be the first to add what is there' : v.open + ' item' + (v.open === 1 ? '' : 's') + ' waiting to be confirmed first';
      return '<a class="vbz-vcard" href="' + esc(o.base + v.slug + '/bounties') + '"><span class="vbz-vimg"' + img + '></span><span>' +
        (i < 3 ? '<span class="vbz-rank">#' + (i + 1) + ' in bounties</span>' : '') + '<h4>' + esc(v.name) + '</h4><p>' + esc(v.city || '') + (v.state ? ', ' + esc(v.state) : '') +
        ' &middot; ' + esc(line) + '</p></span><span class="vbz-pts"><b>' + n(v.points) + '</b><i>points</i></span></a>';
    }).join('') + '</div>';
  }

  // One job on its own (Sean, 2026-11-01: "when they click into it, it should have an image of where it is on the right hand side.
  // And it should show the accompanying map. So that way they can find it... something similar for what we did for the stadium for
  // the airport... where they can find directions"). Left: the job, its points, Do it, and Get me there from the section or gate
  // (the same one the venue page keeps). Right: the item's photo, else the venue's picture, then the map with only this stand's pin
  // and the walk to it. o adds: lib (VEVenueMap | VEAirportMap), unit ('section' | 'gate'), seatKey(slug), pinLevel (a stand known only
  // by its level still gets a pin: the airport's concourses), mapNote.
  function findJob(d, itemId) {
    var hit = null;
    (d.spots || []).forEach(function (s, si) { (s.items || []).forEach(function (it) { if (it.id === itemId) hit = { it: it, s: s, si: si }; }); });
    return hit;
  }
  function standOf(h, o) {
    var s = h.s, secs = s.map_sections || [];
    return { n: h.si + 1, id: s.id, name: s.name, sections: secs, level: s.map_level, zone: s.zone, pinned: secs.length > 0 || (!!o.pinLevel && !!s.map_level) };
  }
  function job(d, itemId, o) {
    css();
    var v = d.venue, h = findJob(d, itemId);
    if (!h) return '<p class="dg-empty">That job is not here any more: the item may have been updated or taken off. <a href="' + esc(o.base + v.slug + '/bounties') + '">See every job at ' + esc(v.name) + '</a>.</p>';
    var j = jobs(d, o).filter(function (x) { return x.href.slice(-itemId.length) === itemId; })[0];
    var st = standOf(h, o), it = h.it, unit = o.unit || 'section';
    var seat = ''; try { seat = localStorage.getItem(o.seatKey(v.slug)) || ''; } catch (e) {}
    var pic = it.photo_url ? { src: it.photo_url, cap: it.photo_illustrative ? 'Illustrative photo' : 'A photo of ' + it.name }
      : v.image ? { src: v.image, cap: v.name + ', illustrated' } : null;
    var gate = o.owner ? '' : '<div class="vbz-note" style="margin:0 0 12px"><span><b>Bounties unlock with the Guide.</b> Get it and this job pays.</span><a class="dg-btn" href="' + esc(o.join || '#/join') + '">Get the Guide</a></div>';
    var left = '<div class="sa-g-form">' + gate +
      '<div class="vbz-jhead"><span class="vbz-pts' + (j.pts < 25 ? ' lo' : '') + '"><b>' + n(j.pts) + '</b><i>points</i></span><div><div class="dg-k">' + (j.bounty ? 'Bounty: be first' : 'Job') + '</div>' +
        '<h3 class="vbz-jt">' + esc(j.title) + '</h3><div class="vbz-where"><span class="vbz-no">' + st.n + '</span>' + esc(st.name) + (h.s.where ? ' &middot; ' + esc(h.s.where) : '') + '</div></div></div>' +
      (it.description ? '<p class="vbz-jd">' + esc(it.description) + '</p>' : '') +
      '<p class="vbz-jd"><b>What to do:</b> ' + esc(j.what) + ' ' + n(j.low) + ' points without a photo.</p>' +
      '<div class="dg-btns" style="margin:10px 0 14px"><a class="dg-btn" href="' + esc(j.href) + '">Do it</a><a class="dg-btn dg-ghost" href="' + esc(o.base + v.slug + '/report/choose/' + it.id) + '">Something changed?</a></div>' +
      (v.layout && o.lib ? '<form class="sa-seat" id="vbzSeat"><label for="vbzSeatIn">Your ' + unit + '</label><div><input id="vbzSeatIn" inputmode="text" autocomplete="off" maxlength="12" placeholder="' + (unit === 'gate' ? 'D7' : '124') + '" value="' + esc(seat) + '">' +
        '<button class="dg-btn" type="submit">Get me there</button></div></form>' : '') + '</div>';
    var right = '<div class="sa-g-map">' + (pic ? '<figure class="vbz-pic"><img src="' + esc(pic.src) + '" alt="' + esc(pic.cap) + '" loading="lazy"><figcaption>' + esc(pic.cap) + '</figcaption></figure>' : '') +
      (v.layout && o.lib ? '<div class="sa-map-box" id="vbzMap"></div><div class="sa-map-foot"><span>' + esc(o.mapNote || 'Our own drawing, from the section numbers.') + '</span></div>' : '') +
      (st.pinned ? '' : '<p class="sa-dir-hint">' + esc(st.name) + (st.level ? ' is on the ' + esc(levelName(v, st.level, o)) + ', but we do not know its ' + unit + ' yet' : ' is not on the map yet') + '. Ask a worker there, and add the ' + unit + ' in your report: it helps the next person.</p>') + '</div>';
    return '<section class="sa-vgrid2 vbz-jgrid">' + left + right + '<div class="sa-g-dirs" id="vbzDirs" aria-live="polite"></div></section>';
  }
  function levelName(v, lv, o) {
    try { var L = o.lib.levels(v.layout), i = o.lib.levelOf(v.layout, lv); if (i >= 0 && L[i]) return L[i].name || lv; } catch (e) {}
    return lv + (o.unit === 'gate' ? '' : ' level');
  }
  function wireJob(d, itemId, o) {
    var v = d.venue, h = findJob(d, itemId), M = o.lib, box = document.getElementById('vbzMap');
    if (!h || !M || !box || !v.layout) return;
    if (M.css) M.css();
    var st = standOf(h, o), pins = st.pinned ? [st] : [];
    var form = document.getElementById('vbzSeat'), inp = document.getElementById('vbzSeatIn'), dirs = document.getElementById('vbzDirs'), unit = o.unit || 'section';
    var paint = function () {
      var seat = inp ? inp.value.trim() : '', you = seat ? M.find(v.layout, seat) : null, r = you && pins.length ? M.route(v.layout, you, pins) : null;
      box.innerHTML = M.svg(v.layout, pins, { you: you, route: r, title: 'Map of ' + v.name + ' with ' + st.name });
      var html = '';
      if (seat && !you) html = '<p class="sa-dir-miss">We could not find ' + unit + ' ' + esc(seat) + ' at ' + esc(v.name) + '. Check the number on your ' + (unit === 'gate' ? 'boarding pass' : 'ticket') + '.</p>';
      else if (r && r.routes.length) {
        var x = r.routes[0];
        html = '<ol class="sa-dirs"><li><span class="sa-dir-go" style="cursor:default"><span class="sa-pinno">' + st.n + '</span><span><b>' + esc(st.name) + '</b> <span class="sa-dir-meta">' +
          (x.rescreen ? 'through security again' : (x.section ? unit + ' ' + esc(x.section) + ' &middot; ' : '') + 'about ' + x.minutes + ' min') + '</span></span></span><p>' + x.steps.map(esc).join(' ') + '</p></li></ol>';
        if (you.exact === false) html = '<p class="sa-dir-miss">' + (unit === 'gate' ? 'Gate' : 'Section') + ' ' + esc(seat) + ' is not on our map yet, so this starts from the nearest one we have.</p>' + html;
      } else if (you && !pins.length) html = '<p class="sa-dir-hint">You are marked on the map. This stand is not pinned yet, so ask a worker where it is.</p>';
      else if (!seat) html = '<p class="sa-dir-hint">Type the ' + unit + ' on your ' + (unit === 'gate' ? 'boarding pass' : 'ticket') + ' and press Get me there for the walk to ' + esc(st.name) + '.</p>';
      dirs.innerHTML = html;
    };
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); try { localStorage.setItem(o.seatKey(v.slug), inp.value.trim()); } catch (er) {} paint(); });
    paint();
  }

  window.VEVenueBounties = { css: css, jobs: jobs, venue: venue, board: board, job: job, wireJob: wireJob };
})();
