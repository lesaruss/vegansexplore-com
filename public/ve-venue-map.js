/* The venue map and "Get me there" (Sean, 2026-10-28: "show a map of the stadium and where these things are with a locator
 * icon... be anywhere in the stadium and... show me where exactly to go"). Used by the Stadium & Arena Guide
 * (guide-scripts/stadium-arena-guide.js); playbook ve-venue-guides.
 *
 * We draw our own map from the section numbers, never the venue's seating chart. A venue's layout (ve_venues.layout) lists each
 * level's sections in clockwise order around the bowl, side by side as the chart is drawn:
 *   { field: 'football'|'basketball'|'hockey'|'baseball', ring_m: 800,
 *     levels: [{ level: '100', name: '100 level', sides: { top: [...], tr: [...], right: [...], br: [...], bottom: [...],
 *                bl: [...], left: [...], tl: [...] } }, ...] }      innermost level first
 * top runs left to right, right top to bottom, bottom right to left, left bottom to top; tl, tr, br, bl are the corners.
 * A stand's pins are its map_sections ("122A" sits behind section 122); map_level is for a stand we only know the level of.
 *
 * Directions come from the section on the member's ticket, not GPS (GPS inside a stadium is off by several sections and worse
 * under a roof). Walking clockwise around the bowl keeps the field on your right.
 *
 *   VEVenueMap.svg(layout, pins, opts)      the map; pins [{n, label, sections:[...]}], opts {you: <section>, route: <result>}
 *   VEVenueMap.find(layout, section)        where a section is: {level, label, angle, x, y} or null
 *   VEVenueMap.route(layout, from, stands)  directions from a section to each stand: [{stand, section, minutes, steps[]}]
 */
(function () {
  var CX = 500, CY = 400, FW = 170, FH = 100, C0 = 60, K = 0.4142, BASE = 22, GAP = 8;
  var SIDES = ['top', 'tr', 'right', 'br', 'bottom', 'bl', 'left', 'tl'];
  var WALK_M_PER_MIN = 60, LEVEL_MIN = 3;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(s) { return String(s == null ? '' : s).toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function numOf(s) { var m = /\d+/.exec(String(s || '')); return m ? +m[0] : null; }

  // The eight corners of the bowl at a distance d out from the field, clockwise from the top side's left end.
  function verts(d) {
    var hw = FW + d, hh = FH + d, c = C0 + d * K;
    return [[CX - hw + c, CY - hh], [CX + hw - c, CY - hh], [CX + hw, CY - hh + c], [CX + hw, CY + hh - c],
            [CX + hw - c, CY + hh], [CX - hw + c, CY + hh], [CX - hw, CY + hh - c], [CX - hw, CY - hh + c]];
  }
  function pt(side, f, d) {
    var v = verts(d), i = SIDES.indexOf(side), a = v[i], b = v[(i + 1) % 8];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  }
  // Where a ray from the field's center at angle t crosses the ring at distance d.
  function onRing(t, d) {
    var v = verts(d), dx = Math.cos(t), dy = Math.sin(t), best = null;
    for (var i = 0; i < 8; i++) {
      var a = v[i], b = v[(i + 1) % 8], ex = b[0] - a[0], ey = b[1] - a[1];
      var den = dx * ey - dy * ex; if (Math.abs(den) < 1e-9) continue;
      var s = ((a[0] - CX) * ey - (a[1] - CY) * ex) / den, u = ((a[0] - CX) * dy - (a[1] - CY) * dx) / den;
      if (s > 0 && u >= -1e-6 && u <= 1 + 1e-6 && (best === null || s < best)) best = s;
    }
    return [CX + dx * (best || 0), CY + dy * (best || 0)];
  }
  function perim(d) { var v = verts(d), p = 0; for (var i = 0; i < 8; i++) { var a = v[i], b = v[(i + 1) % 8]; p += Math.hypot(b[0] - a[0], b[1] - a[1]); } return p; }

  // Every section with its shape and place. Cached on the layout object.
  function build(layout) {
    if (layout._built) return layout._built;
    var levels = layout.levels || [], n = levels.length, d = BASE, out = [];
    levels.forEach(function (lv, li) {
      var thick = lv.thick || (n === 1 ? 110 : li === 0 ? 95 : li === n - 1 ? 85 : 45);
      var d0 = d, d1 = d + thick, secs = [];
      SIDES.forEach(function (side) {
        var list = (lv.sides || {})[side] || [], k = list.length;
        list.forEach(function (label, j) {
          var g = 0.04 / Math.max(k, 1), f0 = j / k + g, f1 = (j + 1) / k - g;
          var poly = [pt(side, f0, d0 + 1.5), pt(side, f1, d0 + 1.5), pt(side, f1, d1 - 1.5), pt(side, f0, d1 - 1.5)];
          var c = pt(side, (f0 + f1) / 2, (d0 + d1) / 2);
          secs.push({ label: String(label), key: norm(label), num: numOf(label), side: side, poly: poly, x: c[0], y: c[1],
            angle: Math.atan2(c[1] - CY, c[0] - CX), level: li });
        });
      });
      out.push({ level: String(lv.level), name: lv.name || (lv.level + ' level'), d0: d0, d1: d1, mid: (d0 + d1) / 2, secs: secs });
      d = d1 + GAP;
    });
    var ring = +layout.ring_m || 800, p0 = out.length ? perim(out[0].mid) : 1;
    out.forEach(function (L) { L.ring_m = ring * perim(L.mid) / p0; });
    layout._built = out;
    return out;
  }

  // A section as a member types it ("142", "sec 142", "122A"): the exact one, else the nearest number on its level.
  function find(layout, section) {
    var L = build(layout), key = norm(section).replace(/^SECTION|^SEC/, ''), n = numOf(key);
    if (!key) return null;
    for (var i = 0; i < L.length; i++) for (var j = 0; j < L[i].secs.length; j++) if (L[i].secs[j].key === key) return L[i].secs[j];
    if (n === null) return null;
    var best = null, bd = Infinity;
    L.forEach(function (lv) {
      var nums = lv.secs.filter(function (s) { return s.num !== null; }).map(function (s) { return s.num; });
      if (!nums.length) return;
      var lo = Math.min.apply(null, nums), hi = Math.max.apply(null, nums);
      if (n < lo - 5 || n > hi + 5) return;
      lv.secs.forEach(function (s) { if (s.num !== null && Math.abs(s.num - n) < bd) { bd = Math.abs(s.num - n); best = s; } });
    });
    return best ? Object.assign({}, best, { label: key, exact: false }) : null;
  }
  function levelOf(layout, level) { var L = build(layout); for (var i = 0; i < L.length; i++) if (L[i].level === String(level)) return i; return -1; }

  // Signed walk from angle a to b the short way (positive is clockwise).
  function delta(a, b) { var x = b - a; while (x > Math.PI) x -= 2 * Math.PI; while (x < -Math.PI) x += 2 * Math.PI; return x; }
  function between(a, dd, t) { var x = delta(a, t); return dd > 0 ? x > 0.02 && x < dd - 0.02 : x < -0.02 && x > dd + 0.02; }

  function routeTo(layout, from, target) {
    var L = build(layout), lv = L[target.level], dd = delta(from.angle, target.angle), steps = [];
    var walk = Math.abs(dd) / (2 * Math.PI) * lv.ring_m, change = target.level - from.level;
    if (change) steps.push('Take the nearest ramp or escalator ' + (change > 0 ? 'up' : 'down') + ' to the ' + lv.name + '.');
    var passed = lv.secs.filter(function (s) { return between(from.angle, dd, s.angle); })
      .sort(function (a, b) { return Math.abs(delta(from.angle, a.angle)) - Math.abs(delta(from.angle, b.angle)); }).map(function (s) { return s.label; });
    if (Math.abs(dd) < 0.12) steps.push(change ? 'It is right there, on the concourse behind section ' + target.label + '.' : 'It is right by you, on the concourse behind section ' + target.label + '.');
    else steps.push((change ? 'Then walk' : 'On the concourse, walk') + ' with the field on your ' + (dd > 0 ? 'right' : 'left') +
      (passed.length ? ', past ' + (passed.length > 3 ? passed.slice(0, 3).join(', ') + ' and ' + (passed.length - 3) + ' more' : passed.length > 1 ? passed.slice(0, -1).join(', ') + ' and ' + passed[passed.length - 1] : passed[0]) : '') +
      ', to section ' + target.label + '.');
    return { minutes: Math.max(1, Math.round(walk / WALK_M_PER_MIN + Math.abs(change) * LEVEL_MIN)), steps: steps, dd: dd, walk: walk };
  }

  // For each stand, the nearest of its spots from the member's section.
  function route(layout, section, stands) {
    var from = typeof section === 'string' ? find(layout, section) : section;
    if (!from) return null;
    var out = [];
    (stands || []).forEach(function (st) {
      var best = null;
      (st.sections || []).forEach(function (raw) {
        var s = find(layout, raw); if (!s) return;
        var r = routeTo(layout, from, Object.assign({}, s, { label: String(raw) }));
        if (!best || r.minutes < best.minutes || (r.minutes === best.minutes && r.walk < best.walk)) best = Object.assign(r, { section: String(raw), target: s });
      });
      if (best) out.push(Object.assign(best, { stand: st }));
    });
    out.sort(function (a, b) { return a.minutes - b.minutes; });
    return { from: from, routes: out };
  }

  function pinSvg(x, y, n, on) {
    return '<g class="vvm-pin' + (on ? ' on' : '') + '" data-pin="' + n + '" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(1.35)">' +
      '<path d="M0 0 C-4 -9 -15 -16 -15 -27 A15 15 0 1 1 15 -27 C15 -16 4 -9 0 0Z"/><text x="0" y="-22" text-anchor="middle">' + n + '</text></g>';
  }
  function fieldSvg(kind) {
    var x = CX - FW + 18, y = CY - FH + 18, w = 2 * (FW - 18), h = 2 * (FH - 18), s = '<rect class="vvm-field" x="' + (CX - FW + 6) + '" y="' + (CY - FH + 6) + '" width="' + (2 * FW - 12) + '" height="' + (2 * FH - 12) + '" rx="26"/>';
    if (kind === 'football') {
      s += '<rect class="vvm-ez" x="' + x + '" y="' + y + '" width="' + (w / 12) + '" height="' + h + '"/><rect class="vvm-ez" x="' + (x + w * 11 / 12) + '" y="' + y + '" width="' + (w / 12) + '" height="' + h + '"/>';
      for (var i = 1; i < 12; i++) s += '<line class="vvm-yd" x1="' + (x + w * i / 12) + '" y1="' + y + '" x2="' + (x + w * i / 12) + '" y2="' + (y + h) + '"/>';
    }
    return s + '<text class="vvm-ftext" x="' + CX + '" y="' + (CY + 6) + '" text-anchor="middle">' + ({ football: 'FIELD', baseball: 'FIELD', basketball: 'COURT', hockey: 'RINK' }[kind] || 'FIELD') + '</text>';
  }

  function svg(layout, pins, opts) {
    opts = opts || {};
    var L = build(layout), you = opts.you, r = opts.route, body = fieldSvg(layout.field);
    var hot = {}; if (r) r.routes.forEach(function (x) { hot[x.target.level + ':' + x.target.key] = 1; });
    L.forEach(function (lv) {
      lv.secs.forEach(function (s) {
        var cls = 'vvm-sec vvm-l' + Math.min(s.level, 2) + (you && you.level === s.level && you.key === s.key ? ' you' : '');
        body += '<polygon class="' + cls + '" points="' + s.poly.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>';
        var t = s.label.length > 4 ? '' : s.label;
        if (t) body += '<text class="vvm-num" x="' + s.x.toFixed(1) + '" y="' + (s.y + 4).toFixed(1) + '" text-anchor="middle">' + esc(t) + '</text>';
      });
    });
    // The walk: up or down at the member's place, then around the target level's concourse.
    if (r && r.routes.length) {
      var best = r.routes[0], lv = L[best.target.level], a = r.from.angle, steps = Math.max(8, Math.ceil(Math.abs(best.dd) * 24)), pts = [];
      if (best.target.level !== r.from.level) pts.push([r.from.x, r.from.y]);
      for (var i = 0; i <= steps; i++) pts.push(onRing(a + best.dd * i / steps, lv.d1 + 3));
      body += '<polyline class="vvm-route" points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>';
    }
    (pins || []).forEach(function (p) {
      (p.sections || []).forEach(function (raw) {
        var s = find(layout, raw); if (!s) return;
        body += pinSvg(s.x, s.y, p.n, r && r.routes.length && r.routes[0].stand.n === p.n && r.routes[0].target.key === s.key && r.routes[0].target.level === s.level);
      });
    });
    if (you) body += '<g class="vvm-you" transform="translate(' + you.x.toFixed(1) + ' ' + you.y.toFixed(1) + ')"><circle r="15"/><text y="5" text-anchor="middle">YOU</text></g>';
    return '<svg class="vvm" viewBox="40 -40 920 830" role="img" aria-label="' + esc(opts.title || 'Venue map') + '">' + body + '</svg>';
  }

  var CSS = '.vvm{display:block;width:100%;height:auto;font-family:Montserrat,sans-serif;}' +
    '.vvm-field{fill:#a3bd7a;}.vvm-ez{fill:#6f8f43;}.vvm-yd{stroke:rgba(255,255,255,.55);stroke-width:1.5;}' +
    '.vvm-ftext{fill:rgba(255,255,255,.9);font-size:22px;font-weight:900;letter-spacing:.2em;}' +
    '.vvm-sec{stroke:#fff;stroke-width:1;}.vvm-l0{fill:#1f5f22;}.vvm-l1{fill:#2d7d31;}.vvm-l2{fill:#3A9B3E;}' +
    '.vvm-sec.you{fill:#F69820;}' +
    '.vvm-num{fill:#fff;font-size:12.5px;font-weight:700;pointer-events:none;}' +
    '.vvm-route{fill:none;stroke:#F69820;stroke-width:7;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:2 12;}' +
    '.vvm-pin{cursor:pointer;}.vvm-pin path{fill:#fff;stroke:#1a1a1a;stroke-width:2.5;}.vvm-pin text{font-size:15px;font-weight:900;fill:#1a1a1a;}' +
    '.vvm-pin.on path{fill:#F69820;}' +
    '.vvm-you circle{fill:#1a1a1a;stroke:#fff;stroke-width:3;}.vvm-you text{fill:#fff;font-size:9.5px;font-weight:900;letter-spacing:.04em;}';
  function css() { if (document.getElementById('vvm-css')) return; var st = document.createElement('style'); st.id = 'vvm-css'; st.textContent = CSS; document.head.appendChild(st); }

  window.VEVenueMap = { svg: svg, find: find, route: route, levelOf: levelOf, css: css, levels: function (layout) { return build(layout); } };
})();
