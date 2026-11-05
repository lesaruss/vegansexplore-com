/* The park map with a you-are-here dot (Sean, 2026-11-04, playbook ve-theme-park-guide: "put pins where the restaurants are...
 * whatever restaurant they're in, they can do the location thing, put where they are on the map and see the distance").
 * Used by the Vegan Theme Park Guide (guide-scripts/theme-park-guide.js). Same pin family as VEVenueMap (public/ve-venue-map.js).
 *
 * Our own drawing, never the park's map art (copyrighted): the pins are the restaurants' coordinates (ve_venue_spots.latitude and
 * longitude, Google's placement checked by Sean), laid out true to scale in a plain frame, with each land named where its pins sit.
 * A park is outdoors, so the phone's GPS works: a dot, a ring for how sure it is, and a distance to every restaurant. The distance is
 * the straight line times about 1.3 and is said to be "about N on foot" (feet under a tenth of a mile, else miles). Never turn by turn.
 *
 *   VEParkMap.svg(pins, opts)     pins [{n, id, name, lat, lng, land, lost}]; opts {you: {lat, lng, acc}, on: <id>, title, base}
 *                                 base: venue.layout.base, the park drawn from OpenStreetMap (ODbL, credited on the map; Sean 2026-11-05)
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
    // With an illustrated base (OpenStreetMap shapes, venue.layout.base), the frame is the park itself; without one it fits the pins.
    var B = o.base && o.base.o && o.base.b ? o.base : null, bo = B ? P({ lat: B.o[0], lng: B.o[1] }) : null;
    if (B) {
      minX = Math.min(minX, B.b[0] / 10 + bo.x); minY = Math.min(minY, B.b[1] / 10 + bo.y); maxX = Math.max(maxX, B.b[2] / 10 + bo.x); maxY = Math.max(maxY, B.b[3] / 10 + bo.y);
    } else {
      var span = Math.max(maxX - minX, maxY - minY, 120), pad = span * 0.12;
      minX -= pad; maxX += pad; minY -= pad; maxY += pad;
    }
    var wm = maxX - minX, hm = maxY - minY, s = (W - 2 * PAD) / Math.max(wm, hm), H = Math.round(hm * s + 2 * PAD), Wd = Math.round(wm * s + 2 * PAD);
    var X = function (x) { return PAD + (x - minX) * s; }, Y = function (y) { return PAD + (maxY - y) * s; };
    var out = ['<svg class="vvm vpm" viewBox="0 0 ' + Wd + ' ' + H + '" role="img" aria-label="' + esc(o.title || 'Map of the park') + '" xmlns="http://www.w3.org/2000/svg">'];
    out.push('<rect class="vpm-bg" x="0" y="0" width="' + Wd + '" height="' + H + '" rx="14"/>');
    if (B) out.push(baseLayer(B, bo, X, Y, s, Wd, H));
    // A 100 m grid, so distances read at a glance (the illustrated map has a scale bar instead).
    if (!B) for (var gx = Math.ceil(minX / 100) * 100; gx <= maxX; gx += 100) out.push('<line class="vpm-grid" x1="' + X(gx) + '" y1="' + Y(minY) + '" x2="' + X(gx) + '" y2="' + Y(maxY) + '"/>');
    if (!B) for (var gy = Math.ceil(minY / 100) * 100; gy <= maxY; gy += 100) out.push('<line class="vpm-grid" x1="' + X(minX) + '" y1="' + Y(gy) + '" x2="' + X(maxX) + '" y2="' + Y(gy) + '"/>');
    if (!B) out.push('<text class="vpm-scale" x="' + (Wd - 24) + '" y="' + (H - 18) + '" text-anchor="end">grid squares are 100 m (about 330 ft)</text>');
    else {
      var sb = 100 * s;
      out.push('<g class="vpm-sbar"><rect x="20" y="' + (H - 46) + '" width="' + (sb + 150) + '" height="32" rx="6"/><line x1="32" y1="' + (H - 24) + '" x2="' + (32 + sb) + '" y2="' + (H - 24) + '"/>' +
        '<line x1="32" y1="' + (H - 30) + '" x2="32" y2="' + (H - 18) + '"/><line x1="' + (32 + sb) + '" y1="' + (H - 30) + '" x2="' + (32 + sb) + '" y2="' + (H - 18) + '"/>' +
        '<text x="' + (42 + sb) + '" y="' + (H - 19) + '">100 m · 330 ft</text></g>');
      out.push('<text class="vpm-credit" x="20" y="' + (H - 56) + '">Map data © OpenStreetMap contributors</text>');
    }
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
      var mx = (x0 + x1) / 2, my = (y0 + y1) / 2, bl = B && landMid(B, bo, X, Y, l);
      if (bl) { mx = bl.x; my = bl.y; y0 = my + 24; y1 = my - 10; }
      // Where the name can go, best first: above the group, below it, left, right. The first spot no pin or other name sits on wins.
      var tries = (bl ? [[mx, my], [mx, my - 40], [mx, my + 40], [mx - 60, my], [mx + 60, my]] : []).concat([[mx, y0 - 58], [mx, y1 + 34], [x0 - half - 28, my], [x1 + half + 28, my], [mx, y0 - 76], [mx, y1 + 52]]);
      function clear(c) {
        var lx = c[0], ly = c[1];
        if (lx - half < 12 || lx + half > Wd - 12 || ly < 30 || ly > H - 40) return false;
        return !pos.some(function (q) { return q.x + 20 > lx - half && q.x - 20 < lx + half && q.y > ly - 18 && q.y - 52 < ly + 6; }) &&
          !placed.some(function (r) { return Math.abs(r[0] - lx) < half + r[2] && Math.abs(r[1] - ly) < 22; });
      }
      var pick, two = false;
      if (bl) {
        // On the illustrated map a land's name stays inside that land: the clear spot nearest its middle. A name too wide for its land
        // breaks onto two lines ("LIBERTY / SQUARE"); with no clear spot at all it sits at the middle, under the pins.
        var more = []; for (var dy2 = -160; dy2 <= 160; dy2 += 20) for (var dx2 = -200; dx2 <= 200; dx2 += 25) more.push([mx + dx2, my + dy2]);
        var near = function (p1, p2) { return Math.hypot(p1[0] - mx, p1[1] - my) - Math.hypot(p2[0] - mx, p2[1] - my); };
        var fits = function (hw) { return function (c) { return inPoly(c, bl.poly) && inPoly([c[0] - hw * .8, c[1]], bl.poly) && inPoly([c[0] + hw * .8, c[1]], bl.poly) && clear(c); }; };
        pick = more.filter(fits(half)).sort(near)[0];
        var words = name.split(' ');
        if (!pick && words.length > 1) {
          var h0 = half, w2 = Math.max.apply(null, words.map(function (x) { return x.length; }));
          half = w2 * 7.2 + 6;
          var ok = function (c) { return fits(half)(c) && clear([c[0], c[1] + 20]); };
          pick = more.filter(ok).sort(near)[0];
          if (pick) two = true; else half = h0;
        }
        if (!pick) {
          // No room inside (a narrow land full of pins): a tag in the land's own color at the nearest clear spot close by, with a line
          // into the land, so the name is never mistaken for the land it sits over.
          var wide = []; for (var dy3 = -150; dy3 <= 150; dy3 += 15) for (var dx3 = -200; dx3 <= 200; dx3 += 20) if (Math.hypot(dx3, dy3) <= 170) wide.push([mx + dx3, my + dy3]);
          pick = wide.filter(clear).sort(near)[0];
          if (pick) {
            var col = LAND_TINT[String(l).toLowerCase()] || '#e7ecd5';
            out.push('<line class="vpm-call" x1="' + pick[0] + '" y1="' + pick[1] + '" x2="' + mx + '" y2="' + my + '"/><circle class="vpm-call-d" cx="' + mx + '" cy="' + my + '" r="4"/>' +
              '<rect class="vpm-tagw" x="' + (pick[0] - half - 4) + '" y="' + (pick[1] - 20) + '" width="' + (2 * half + 8) + '" height="28" rx="6"/>' +
              '<rect class="vpm-tag" x="' + (pick[0] - half - 4) + '" y="' + (pick[1] - 20) + '" width="' + (2 * half + 8) + '" height="28" rx="6" stroke="' + col + '"/>');
          } else pick = [mx, my];
        }
      } else pick = tries.filter(clear)[0] || tries[0];
      placed.push([pick[0], pick[1], half]); if (two) placed.push([pick[0], pick[1] + 20, half]);
      var label = two ? '<tspan x="' + pick[0] + '">' + esc(words[0]) + '</tspan><tspan x="' + pick[0] + '" dy="20">' + esc(words.slice(1).join(' ')) + '</tspan>' : esc(name);
      out.push('<text class="vpm-land' + (B ? ' b' : '') + '" x="' + pick[0] + '" y="' + pick[1] + '" text-anchor="middle">' + label + '</text>');
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

  // The illustrated base: our own drawing of OpenStreetMap's shapes (ODbL), never the park's map art. Points are decimetres east and
  // north of base.o, as flat [x, y, ...] lists (scripts/theme-park/osm_layout.py makes them).
  var LAND_TINT = { 'main street, u.s.a.': '#f9d9c4', 'adventureland': '#c9e7b1', 'frontierland': '#f0cfa0', 'liberty square': '#bfe3dc',
    'fantasyland': '#f1cbe6', 'tomorrowland': '#c6daf4' };
  var TINTS = ['#e7ecd5', '#e3e6f2', '#f2e6d8'];
  function ptsOf(r, bo, X, Y) { var o = []; for (var i = 0; i + 1 < r.length; i += 2) o.push(X(r[i] / 10 + bo.x).toFixed(1) + ' ' + Y(r[i + 1] / 10 + bo.y).toFixed(1)); return o; }
  function ring(r, bo, X, Y) { var p = ptsOf(r, bo, X, Y); return p.length > 2 ? 'M' + p.join('L') + 'Z' : ''; }
  function line(r, bo, X, Y) { var p = ptsOf(r, bo, X, Y); return p.length > 1 ? 'M' + p.join('L') : ''; }
  function rings(list, bo, X, Y) { return (list || []).map(function (r) { return ring(r, bo, X, Y); }).join(''); }
  function landMid(B, bo, X, Y, name) {
    var k = String(name).toLowerCase(), L = (B.lands || []).filter(function (x) { return String(x.n).toLowerCase() === k; })[0];
    if (!L) return null;
    var sx = 0, sy = 0, n = 0; for (var i = 0; i + 1 < L.r.length; i += 2) { sx += L.r[i]; sy += L.r[i + 1]; n++; }
    var poly = []; for (var j = 0; j + 1 < L.r.length; j += 2) poly.push([X(L.r[j] / 10 + bo.x), Y(L.r[j + 1] / 10 + bo.y)]);
    return { x: X(sx / n / 10 + bo.x), y: Y(sy / n / 10 + bo.y), poly: poly };
  }
  function inPoly(pt, poly) {
    var c = false; for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var a = poly[i], b = poly[j]; if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
    } return c;
  }
  function baseLayer(B, bo, X, Y, s, Wd, H) {
    var o = [], id = 'vpmclip' + Math.random().toString(36).slice(2, 8);
    o.push('<defs><clipPath id="' + id + '"><rect x="0" y="0" width="' + Wd + '" height="' + H + '" rx="14"/></clipPath></defs><g clip-path="url(#' + id + ')">');
    o.push('<rect class="vpm-out-bg" x="0" y="0" width="' + Wd + '" height="' + H + '"/>');
    if (B.park) o.push('<path class="vpm-park" d="' + ring(B.park, bo, X, Y) + '"/>');
    (B.lands || []).forEach(function (L, i) {
      o.push('<path class="vpm-l" fill="' + (LAND_TINT[String(L.n).toLowerCase()] || TINTS[i % TINTS.length]) + '" d="' + ring(L.r, bo, X, Y) + '"/>');
    });
    var edges = (B.lands || []).map(function (L, i) { return '<path class="vpm-le" stroke="' + (LAND_TINT[String(L.n).toLowerCase()] || TINTS[i % TINTS.length]) + '" d="' + ring(L.r, bo, X, Y) + '"/>'; }).join('');
    o.push('<path class="vpm-green" d="' + rings(B.green, bo, X, Y) + '"/>');
    o.push('<path class="vpm-rock" d="' + rings(B.rock, bo, X, Y) + '"/>');
    o.push('<path class="vpm-water" d="' + rings(B.water, bo, X, Y) + '"/>');
    (B.wl || []).forEach(function (w) { o.push('<path class="vpm-wl" stroke-width="' + Math.max(2, w.w * s).toFixed(1) + '" d="' + line(w.l, bo, X, Y) + '"/>'); });
    o.push('<path class="vpm-plaza" d="' + rings(B.plaza, bo, X, Y) + '"/>');
    var paths = B.path || [];
    paths.forEach(function (w) { o.push('<path class="vpm-path-e" stroke-width="' + (Math.max(1.6, w.w * s) + 1.6).toFixed(1) + '" d="' + line(w.l, bo, X, Y) + '"/>'); });
    paths.forEach(function (w) { o.push('<path class="vpm-path" stroke-width="' + Math.max(1.6, w.w * s).toFixed(1) + '" d="' + line(w.l, bo, X, Y) + '"/>'); });
    (B.rail || []).forEach(function (r) { o.push('<path class="vpm-rail" d="' + line(r, bo, X, Y) + '"/>'); });
    o.push('<path class="vpm-bld" d="' + rings(B.bld, bo, X, Y) + '"/>');
    o.push(edges);
    if (B.castle) o.push('<path class="vpm-castle" d="' + ring(B.castle, bo, X, Y) + '"/>');
    o.push('</g>');
    return o.join('');
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
    '.vpm-out-bg{fill:#d6e5c8;}.vpm-park{fill:#eef1e2;stroke:#b9cda4;stroke-width:3;}.vpm-l{opacity:.95;}.vpm-le{fill:none;stroke-width:7;opacity:.9;filter:saturate(2.2) brightness(.86);stroke-linejoin:round;}.vpm-green{fill:#a9cf8c;opacity:.55;}.vpm-rock{fill:#e3c99b;}' +
    '.vpm-water{fill:#a7d4ec;stroke:#82bedf;stroke-width:1.5;}.vpm-wl{fill:none;stroke:#a7d4ec;stroke-linecap:round;stroke-linejoin:round;}' +
    '.vpm-plaza{fill:#fbf3e1;stroke:#e5d4b2;stroke-width:1;}.vpm-path-e{fill:none;stroke:#dcc8a1;stroke-linecap:round;stroke-linejoin:round;}' +
    '.vpm-path{fill:none;stroke:#fbf3e1;stroke-linecap:round;stroke-linejoin:round;}.vpm-rail{fill:none;stroke:#8d6e4f;stroke-width:2.5;stroke-dasharray:7 5;opacity:.8;}' +
    '.vpm-bld{fill:#f1e4cf;stroke:#bea27a;stroke-width:1;}.vpm-castle{fill:#9fbdf0;stroke:#3f68b3;stroke-width:2.5;}' +
    '.vpm-land.b{fill:#2b3a29;opacity:.78;font-size:17px;paint-order:stroke;stroke:rgba(255,255,255,.85);stroke-width:5px;stroke-linejoin:round;}' +
    '.vpm-call{stroke:#2b3a29;stroke-width:2;opacity:.75;}.vpm-tagw{fill:#fff;}.vpm-tag{fill:none;stroke-width:4;filter:saturate(2.2) brightness(.86);}.vpm-call-d{fill:#2b3a29;opacity:.7;}.vpm-sbar rect{fill:rgba(255,255,255,.88);}.vpm-sbar line{stroke:#1a1a1a;stroke-width:2.5;}.vpm-sbar text{font-size:14px;font-weight:700;fill:#1a1a1a;}' +
    '.vpm-credit{font-size:12px;fill:#44533f;paint-order:stroke;stroke:rgba(255,255,255,.85);stroke-width:4px;}' +
    '.vpm-lead{stroke:#1a1a1a;stroke-width:1.5;opacity:.55;}.vpm-true{fill:#1a1a1a;}.vpm .vvm-pin.on path{fill:#F69820;}.vpm .vvm-you circle{fill:#1a1a1a;stroke:#fff;stroke-width:3;}';
  function css() { if (document.getElementById('vpm-css')) return; var st = document.createElement('style'); st.id = 'vpm-css'; st.textContent = CSS; document.head.appendChild(st); }

  window.VEParkMap = { svg: svg, metres: metres, walk: walk, watch: watch, css: css, FACTOR: FACTOR };
})();
