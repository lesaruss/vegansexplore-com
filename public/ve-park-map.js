/* The park map with a you-are-here dot (Sean, 2026-11-04, playbook ve-theme-park-guide: "put pins where the restaurants are...
 * whatever restaurant they're in, they can do the location thing, put where they are on the map and see the distance").
 * Used by the Vegan Theme Park Guide (guide-scripts/theme-park-guide.js). Same pin family as VEVenueMap (public/ve-venue-map.js).
 *
 * Our own drawing, never the park's map art (copyrighted): the pins are the restaurants' coordinates (ve_venue_spots.latitude and
 * longitude, Google's placement checked by Sean), laid out true to scale in a plain frame, with each land named where its pins sit.
 * A park is outdoors, so the phone's GPS works: a dot, a ring for how sure it is, and a distance to every restaurant. The distance is
 * the straight line times about 1.3 and is said to be "about N on foot" (feet under a tenth of a mile, else miles). Never turn by turn.
 *
 *   VEParkMap.svg(pins, opts)     pins [{n, id, name, lat, lng, land, lost}]; opts {you: {lat, lng, acc}, on: <id>, title}
 *   VEParkMap.metres(a, b)        straight line between two {lat, lng}
 *   VEParkMap.walk(m)             {text: 'about 450 ft on foot', m: walking metres}
 *   VEParkMap.watch(cb, err)      starts the phone's location; cb({lat, lng, acc}); returns stop()
 *   VEParkMap.css()               adds the map's styles once
 */
(function () {
  var W = 1000, PAD = 90, FACTOR = 1.3;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function metres(a, b) {
    var R = 6371000, r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function walk(m) {
    var w = m * FACTOR, ft = w * 3.28084;
    if (ft < 528) return { m: w, text: 'about ' + Math.max(10, Math.round(ft / 10) * 10).toLocaleString('en-US') + ' ft on foot' };
    return { m: w, text: 'about ' + (w / 1609.344).toFixed(1) + ' mi on foot' };
  }
  // Flat projection around the park: metres east and north of its centre, good to a few millimetres at this size.
  function proj(c) { var kx = 111320 * Math.cos(c.lat * Math.PI / 180), ky = 110540; return function (p) { return { x: (p.lng - c.lng) * kx, y: (p.lat - c.lat) * ky }; }; }

  function svg(pins, o) {
    o = o || {};
    var pts = (pins || []).filter(function (p) { return p.lat != null && p.lng != null; });
    if (!pts.length) return '';
    var c = { lat: 0, lng: 0 }; pts.forEach(function (p) { c.lat += p.lat; c.lng += p.lng; }); c.lat /= pts.length; c.lng /= pts.length;
    var P = proj(c), xy = pts.map(function (p) { return { p: p, q: P(p) }; });
    var you = o.you && o.you.lat != null ? { q: P(o.you), acc: o.you.acc || 0 } : null;
    // The frame fits the pins; a visitor far outside it (still on the way in) is drawn at the edge, never stretching the map.
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    xy.forEach(function (a) { minX = Math.min(minX, a.q.x); maxX = Math.max(maxX, a.q.x); minY = Math.min(minY, a.q.y); maxY = Math.max(maxY, a.q.y); });
    var span = Math.max(maxX - minX, maxY - minY, 120), pad = span * 0.12;
    minX -= pad; maxX += pad; minY -= pad; maxY += pad;
    var wm = maxX - minX, hm = maxY - minY, s = (W - 2 * PAD) / Math.max(wm, hm), H = Math.round(hm * s + 2 * PAD), Wd = Math.round(wm * s + 2 * PAD);
    var X = function (x) { return PAD + (x - minX) * s; }, Y = function (y) { return PAD + (maxY - y) * s; };
    var out = ['<svg class="vvm vpm" viewBox="0 0 ' + Wd + ' ' + H + '" role="img" aria-label="' + esc(o.title || 'Map of the park') + '" xmlns="http://www.w3.org/2000/svg">'];
    out.push('<rect class="vpm-bg" x="0" y="0" width="' + Wd + '" height="' + H + '" rx="14"/>');
    // A 100 m grid, so distances read at a glance.
    for (var gx = Math.ceil(minX / 100) * 100; gx <= maxX; gx += 100) out.push('<line class="vpm-grid" x1="' + X(gx) + '" y1="' + Y(minY) + '" x2="' + X(gx) + '" y2="' + Y(maxY) + '"/>');
    for (var gy = Math.ceil(minY / 100) * 100; gy <= maxY; gy += 100) out.push('<line class="vpm-grid" x1="' + X(minX) + '" y1="' + Y(gy) + '" x2="' + X(maxX) + '" y2="' + Y(gy) + '"/>');
    out.push('<text class="vpm-scale" x="' + (Wd - 24) + '" y="' + (H - 18) + '" text-anchor="end">grid squares are 100 m (about 330 ft)</text>');
    // Pins that would sit on top of each other are spread apart (never more than 70 px from their true spot); a displaced pin keeps a
    // small dot and a thin line at its true place, so the map stays honest.
    var pos = xy.map(function (a) { return { x: X(a.q.x), y: Y(a.q.y), tx: X(a.q.x), ty: Y(a.q.y) }; }), MIN = 44, MAXD = 70;
    for (var it = 0; it < 80; it++) {
      var moved = false;
      for (var i = 0; i < pos.length; i++) for (var j = i + 1; j < pos.length; j++) {
        var dx = pos[j].x - pos[i].x, dy = pos[j].y - pos[i].y, d = Math.sqrt(dx * dx + dy * dy * 0.56);
        if (d >= MIN) continue;
        if (d < 0.01) { dx = (j % 2 ? 1 : -1); dy = 0.3; d = Math.sqrt(dx * dx + dy * dy * 0.56); }
        var k = (MIN - d) / 2 / d; pos[i].x -= dx * k; pos[i].y -= dy * k; pos[j].x += dx * k; pos[j].y += dy * k; moved = true;
      }
      pos.forEach(function (q) { var ex = q.x - q.tx, ey = q.y - q.ty, e = Math.sqrt(ex * ex + ey * ey); if (e > MAXD) { q.x = q.tx + ex / e * MAXD; q.y = q.ty + ey / e * MAXD; } });
      if (!moved) break;
    }
    // Each land's name sits behind the middle of its pins.
    var lands = {}; xy.forEach(function (a, n) { var l = a.p.land; if (l) { (lands[l] = lands[l] || []).push(pos[n]); } });
    var placed = [];
    Object.keys(lands).forEach(function (l) {
      var a = lands[l], name = l.replace(', U.S.A.', '').toUpperCase(), half = name.length * 7.2 + 6;
      var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      a.forEach(function (q) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); });
      var mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      // Where the name can go, best first: above the group, below it, left, right. The first spot no pin or other name sits on wins.
      var tries = [[mx, y0 - 58], [mx, y1 + 34], [x0 - half - 28, my], [x1 + half + 28, my], [mx, y0 - 76], [mx, y1 + 52]];
      function clear(c) {
        var lx = c[0], ly = c[1];
        if (lx - half < 12 || lx + half > Wd - 12 || ly < 30 || ly > H - 40) return false;
        return !pos.some(function (q) { return q.x + 20 > lx - half && q.x - 20 < lx + half && q.y > ly - 18 && q.y - 52 < ly + 6; }) &&
          !placed.some(function (r) { return Math.abs(r[0] - lx) < half + r[2] && Math.abs(r[1] - ly) < 22; });
      }
      var pick = tries.filter(clear)[0] || tries[0];
      placed.push([pick[0], pick[1], half]);
      out.push('<text class="vpm-land" x="' + pick[0] + '" y="' + pick[1] + '" text-anchor="middle">' + esc(name) + '</text>');
    });
    if (you) {
      var inside = you.q.x >= minX && you.q.x <= maxX && you.q.y >= minY && you.q.y <= maxY;
      var yx = Math.min(Math.max(X(you.q.x), 22), Wd - 22), yy = Math.min(Math.max(Y(you.q.y), 22), H - 22);
      if (inside && you.acc) out.push('<circle class="vpm-acc" cx="' + yx + '" cy="' + yy + '" r="' + Math.min(you.acc * s, 300) + '"/>');
      out.push('<g class="vvm-you" transform="translate(' + yx + ' ' + yy + ')"><circle r="11"/><circle r="4" class="vpm-core"/></g>');
      if (!inside) out.push('<text class="vpm-out" x="' + yx + '" y="' + (yy + (yy < H / 2 ? 30 : -18)) + '" text-anchor="middle">You are here, off the map</text>');
    }
    xy.forEach(function (a, n) {
      var q = pos[n]; if (Math.abs(q.x - q.tx) + Math.abs(q.y - q.ty) > 8) out.push('<line class="vpm-lead" x1="' + q.tx + '" y1="' + q.ty + '" x2="' + q.x + '" y2="' + q.y + '"/><circle class="vpm-true" cx="' + q.tx + '" cy="' + q.ty + '" r="4"/>');
    });
    xy.forEach(function (a, n) {
      var x = pos[n].x, y = pos[n].y, on = o.on && o.on === a.p.id;
      out.push('<g class="vvm-pin' + (on ? ' on' : '') + '" data-id="' + esc(a.p.id) + '" transform="translate(' + x + ' ' + y + ')" tabindex="0" role="button" aria-label="' + esc(a.p.n + '. ' + a.p.name) + '">' +
        '<path d="M0 0 C-13 -17 -17 -24 -17 -33 A17 17 0 1 1 17 -33 C17 -24 13 -17 0 0 Z"/><text text-anchor="middle" y="-28">' + esc(a.p.n) + '</text></g>');
    });
    out.push('</svg>');
    return out.join('');
  }

  function watch(cb, err) {
    if (!navigator.geolocation) { if (err) err({ code: 0, message: 'This browser cannot find your location.' }); return function () {}; }
    var id = navigator.geolocation.watchPosition(function (g) { cb({ lat: g.coords.latitude, lng: g.coords.longitude, acc: g.coords.accuracy || 0 }); },
      function (e) { if (err) err(e); }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
    return function () { navigator.geolocation.clearWatch(id); };
  }

  var CSS = '.vpm-bg{fill:#f1f5ee;}.vpm-grid{stroke:#dfe7da;stroke-width:1;}.vpm-scale{fill:#8a9a86;font-size:15px;font-weight:600;}' +
    '.vpm-land{fill:rgba(45,92,39,.34);font-size:19px;font-weight:800;letter-spacing:.1em;pointer-events:none;}' +
    '.vpm-acc{fill:rgba(58,155,62,.16);stroke:rgba(58,155,62,.6);stroke-width:2;}.vpm-core{fill:#F69820;stroke:none;}.vpm-out{fill:#444;font-size:17px;font-weight:800;}' +
    '.vpm .vvm-pin{cursor:pointer;}.vpm .vvm-pin path{fill:#fff;stroke:#1a1a1a;stroke-width:2.5;}.vpm .vvm-pin text{font-size:15px;font-weight:900;fill:#1a1a1a;}' +
    '.vpm-lead{stroke:#1a1a1a;stroke-width:1.5;opacity:.55;}.vpm-true{fill:#1a1a1a;}.vpm .vvm-pin.on path{fill:#F69820;}.vpm .vvm-you circle{fill:#1a1a1a;stroke:#fff;stroke-width:3;}';
  function css() { if (document.getElementById('vpm-css')) return; var st = document.createElement('style'); st.id = 'vpm-css'; st.textContent = CSS; document.head.appendChild(st); }

  window.VEParkMap = { svg: svg, metres: metres, walk: walk, watch: watch, css: css, FACTOR: FACTOR };
})();
