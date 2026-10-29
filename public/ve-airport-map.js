/* The airport map and "Get me there" (Sean, 2026-10-29: the Airport Guide, locked 2026-10-28 in playbook ve-venue-guides: "the same
 * layout by terminal and by before or after security"). Used by the Airport Guide (guide-scripts/airport-guide.js); the Stadium
 * Guide's bowl is /public/ve-venue-map.js, and this file answers the same calls so the Guide scripts read alike.
 *
 * We draw our own map from the gate numbers, never the airport's. An airport's layout (ve_venues.layout):
 *   { terminals: [{ id: 'T1', name: 'Terminal 1', concourses: [{ id: 'A', name: 'Concourse A', gates: 'A1-A14' | ['A1', ...],
 *     airside: 'T1' }] }] }
 * Concourses with the same airside group are connected after security (walk or train, no new screening). gates is a list, or ranges
 * ("A1-A14, A16"), in the order they run along the concourse. A stand's gates are its map_sections, its concourse its map_level; a
 * stand before security (zone landside) has its terminal's id in map_level and no gates.
 *
 * Directions start from the gate on the boarding pass, not GPS (GPS inside a terminal is off by a concourse and worse underground).
 *
 *   VEAirportMap.svg(layout, pins, opts)      pins [{n, sections:[gates], level, zone}], opts {you, route, title}
 *   VEAirportMap.find(layout, gate)           where a gate is: {key, label, concourse, terminal, index, exact} or null
 *   VEAirportMap.route(layout, from, stands)  from a gate to each stand: {from, routes: [{stand, section, minutes, steps[], rescreen}]}
 *   VEAirportMap.levels(layout)               the concourses, each {level, name, terminal, gates}; levelOf(layout, id)
 */
(function () {
  var W = 1000, LX = 150, RX = 975, ROW = 74, HEAD = 34, LAND = 40, GAP = 14;
  var MIN_PER_GATE = 0.5, HOP_MIN = 8, RESCREEN_MIN = 30;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(s) { return String(s == null ? '' : s).toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function split(g) { var m = norm(g).match(/^([A-Z]*)(\d+)([A-Z]?)$/); return m ? { pre: m[1], n: +m[2], suf: m[3] } : null; }

  // "A1-A14, A16" or ["A1", ...] -> ['A1', ..., 'A14', 'A16']
  function expand(g) {
    var parts = Array.isArray(g) ? g : String(g || '').split(/[,;]/), out = [];
    parts.forEach(function (p) {
      p = String(p).trim(); if (!p) return;
      var m = p.match(/^([A-Za-z]*)\s*(\d+)\s*(?:-|to|–)\s*([A-Za-z]*)\s*(\d+)$/);
      if (m && (!m[3] || m[3].toUpperCase() === m[1].toUpperCase()) && +m[4] >= +m[2] && +m[4] - +m[2] < 200) {
        for (var i = +m[2]; i <= +m[4]; i++) out.push(m[1].toUpperCase() + i);
      } else out.push(p.toUpperCase().replace(/\s+/g, ''));
    });
    return out;
  }

  function build(layout) {
    if (layout._built) return layout._built;
    var cs = [];
    (layout.terminals || []).forEach(function (t) {
      (t.concourses || []).forEach(function (c) {
        var gates = expand(c.gates);
        cs.push({ level: String(c.id), name: c.name || ('Concourse ' + c.id), terminal: String(t.id), tname: t.name || t.id,
          airside: String(c.airside || t.id), gates: gates, keys: gates.map(norm) });
      });
    });
    layout._built = cs;
    return cs;
  }
  function levels(layout) { return build(layout); }
  function levelOf(layout, id) { var C = build(layout); for (var i = 0; i < C.length; i++) if (C[i].level === String(id)) return i; return -1; }
  function terminalName(layout, id) { var t = (layout.terminals || []).filter(function (x) { return String(x.id) === String(id); })[0]; return t ? (t.name || t.id) : id; }

  // A gate as a traveler types it ("D24", "gate d 24"): the exact one, else the nearest number on a concourse with that letter.
  function find(layout, gate) {
    var C = build(layout), key = norm(gate).replace(/^GATE/, '');
    if (!key) return null;
    for (var i = 0; i < C.length; i++) { var j = C[i].keys.indexOf(key); if (j >= 0) return at(C, i, j, true); }
    var g = split(key); if (!g) return null;
    var best = null, bd = Infinity;
    C.forEach(function (c, ci) {
      c.keys.forEach(function (k, ki) {
        var h = split(k); if (!h || h.pre !== g.pre) return;
        var d = Math.abs(h.n - g.n); if (d < bd && d <= 6) { bd = d; best = [ci, ki]; }
      });
    });
    return best ? Object.assign(at(C, best[0], best[1], false), { label: key }) : null;
  }
  function at(C, ci, j, exact) { var c = C[ci]; return { key: c.keys[j], label: c.gates[j], level: ci, concourse: c.level, terminal: c.terminal, index: j, exact: exact }; }

  // Where a stand is on a concourse: its gates we can find, else the middle of its concourse (a concourse whose gates no source
  // confirmed is drawn without them).
  function spots(layout, st) {
    var C = build(layout), out = [];
    (st.sections || []).forEach(function (g) { var t = find(layout, g); if (t) out.push(t); });
    if (!out.length && st.level) {
      var ci = levelOf(layout, st.level);
      if (ci >= 0) { var c = C[ci], j = Math.floor(Math.max(c.gates.length - 1, 0) / 2); out.push({ key: c.keys[j] || ('MID-' + c.level), label: c.gates[j] || '', level: ci, concourse: c.level, terminal: c.terminal, index: j, mid: true }); }
    }
    return out;
  }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }

  // The way from a gate to each stand's nearest place: the same concourse, a concourse connected after security, or out through
  // security again. A stand you would have to re-screen for comes after every one you would not.
  function route(layout, from, stands) {
    var C = build(layout), here = C[from.level], out = [];
    (stands || []).forEach(function (st) {
      var opts = [];
      if (st.zone === 'landside') {
        var tid = st.level || here.terminal, tn = terminalName(layout, tid);
        opts.push({ minutes: RESCREEN_MIN, rescreen: true, section: '', target: { level: -1, terminal: tid },
          steps: ['It is before security in ' + tn + '.', tid === here.terminal ? 'You would leave and go through security again.' : 'You would leave, go to ' + tn + ' and go through security again.'] });
      } else {
        spots(layout, st).forEach(function (t) {
          var c = C[t.level], apart = Math.abs(t.index - from.index), at = t.mid ? 'Ask for ' + st.name + ' in ' + c.name + '.' : 'Then walk to gate ' + t.label + '.';
          if (t.level === from.level) {
            opts.push({ minutes: Math.max(1, Math.round(apart * MIN_PER_GATE)), rescreen: false, section: t.mid ? '' : t.label, target: t,
              steps: [t.mid ? 'It is in ' + here.name + ', the concourse you are in; ask there for ' + st.name + '.' : apart <= 1 ? 'It is right by your gate, at gate ' + t.label + '.' : 'You are in ' + here.name + '. Walk toward gate ' + t.label + ', ' + plural(apart, 'gate') + ' from yours.'] });
          } else if (c.airside === here.airside) {
            opts.push({ minutes: HOP_MIN + Math.round(t.index * MIN_PER_GATE / 2), rescreen: false, section: t.mid ? '' : t.label, target: t,
              steps: ['Follow the signs to ' + c.name + (c.terminal !== here.terminal ? ' in ' + c.tname : '') + '. You stay after security, with no new screening.', at] });
          } else {
            opts.push({ minutes: RESCREEN_MIN + Math.round(t.index * MIN_PER_GATE / 2), rescreen: true, section: t.mid ? '' : t.label, target: t,
              steps: [c.name + (c.terminal !== here.terminal ? ' in ' + c.tname : '') + ' is not connected to yours after security.', 'You would leave and go through security again there. ' + at] });
          }
        });
      }
      opts.sort(function (a, b) { return a.minutes - b.minutes; });
      if (opts[0]) out.push(Object.assign(opts[0], { stand: st }));
    });
    out.sort(function (a, b) { return (a.rescreen - b.rescreen) || (a.minutes - b.minutes); });
    return { from: from, routes: out };
  }

  // Where things sit on the drawing: each terminal a heading, its before-security strip, then its concourses, one bar each.
  function geometry(layout) {
    var C = build(layout), y = 8, rows = {}, strips = {}, heads = [];
    (layout.terminals || []).forEach(function (t) {
      heads.push({ y: y, name: t.name || t.id }); y += HEAD;
      strips[String(t.id)] = y; y += LAND;
      C.forEach(function (c, ci) { if (c.terminal === String(t.id)) { rows[ci] = y; y += ROW; } });
      y += GAP;
    });
    return { C: C, rows: rows, strips: strips, heads: heads, h: y };
  }
  function gateX(c, j) { var n = c.gates.length; if (!n) return (LX + RX) / 2; return n <= 1 ? (LX + RX) / 2 : LX + 18 + (RX - LX - 36) * j / (n - 1); }

  function pinSvg(x, y, n, on) {
    return '<g class="vam-pin' + (on ? ' on' : '') + '" data-pin="' + n + '" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')">' +
      '<path d="M0 0 C-4 -8 -13 -13 -13 -23 A13 13 0 1 1 13 -23 C13 -13 4 -8 0 0Z"/><text x="0" y="-18" text-anchor="middle">' + n + '</text></g>';
  }

  function svg(layout, pins, opts) {
    opts = opts || {};
    var G = geometry(layout), C = G.C, you = opts.you, r = opts.route, best = r && r.routes[0], body = '';
    G.heads.forEach(function (h) { body += '<text class="vam-term" x="12" y="' + (h.y + 22) + '">' + esc(h.name) + '</text>'; });
    Object.keys(G.strips).forEach(function (tid) {
      var y = G.strips[tid];
      body += '<rect class="vam-land" x="' + LX + '" y="' + (y + 6) + '" width="' + (RX - LX) + '" height="26" rx="6"/>' +
        '<text class="vam-lab" x="12" y="' + (y + 24) + '">Before security</text>';
    });
    C.forEach(function (c, ci) {
      var y = G.rows[ci], by = y + 38, hot = best && !best.rescreen && best.target.level === ci, mine = you && you.level === ci;
      body += '<text class="vam-lab" x="12" y="' + (by + 11) + '">' + esc(c.name) + '</text>' +
        '<rect class="vam-bar' + (hot ? ' hot' : '') + (mine ? ' mine' : '') + '" x="' + LX + '" y="' + by + '" width="' + (RX - LX) + '" height="16" rx="8"/>';
      var step = Math.max(1, Math.ceil(c.gates.length / 14));
      c.gates.forEach(function (g, j) {
        var x = gateX(c, j);
        body += '<line class="vam-tick" x1="' + x.toFixed(1) + '" y1="' + (by + 3) + '" x2="' + x.toFixed(1) + '" y2="' + (by + 13) + '"/>';
        if (j % step === 0 || j === c.gates.length - 1) body += '<text class="vam-gate" x="' + x.toFixed(1) + '" y="' + (by + 30) + '" text-anchor="middle">' + esc(g) + '</text>';
      });
    });
    // The walk along your concourse, from your gate to the nearest stand on it.
    if (you && best && !best.rescreen && best.target.level === you.level) {
      var c0 = C[you.level], yb = G.rows[you.level] + 46;
      body += '<line class="vam-route" x1="' + gateX(c0, you.index).toFixed(1) + '" y1="' + yb + '" x2="' + gateX(c0, best.target.index).toFixed(1) + '" y2="' + yb + '"/>';
    }
    var seen = {}, landN = {};
    (pins || []).forEach(function (p) {
      if (p.zone === 'landside') {
        var tid = p.level || (layout.terminals && layout.terminals[0] && String(layout.terminals[0].id));
        if (G.strips[tid] == null) return;
        var k2 = landN[tid] = (landN[tid] || 0) + 1;
        body += pinSvg(LX + 30 + (k2 - 1) * 34, G.strips[tid] + 20, p.n, best && best.stand.n === p.n);
        return;
      }
      spots(layout, p).forEach(function (t) {
        var key = t.level + ':' + t.key, nth = seen[key] = (seen[key] || 0) + 1;
        body += pinSvg(gateX(C[t.level], t.index) + (nth - 1) * 26, G.rows[t.level] + 36, p.n,
          best && best.stand.n === p.n && best.target.level === t.level && best.target.key === t.key);
      });
    });
    if (you) body += '<g class="vam-you" transform="translate(' + gateX(C[you.level], you.index).toFixed(1) + ' ' + (G.rows[you.level] + 46) + ')"><circle r="13"/><text y="4" text-anchor="middle">YOU</text></g>';
    return '<svg class="vam" viewBox="0 0 ' + W + ' ' + G.h + '" role="img" aria-label="' + esc(opts.title || 'Airport map') + '">' + body + '</svg>';
  }

  var CSS = '.vam{display:block;width:100%;height:auto;font-family:Montserrat,sans-serif;}' +
    '.vam-term{font-size:17px;font-weight:900;fill:#111;}.vam-lab{font-size:12.5px;font-weight:800;fill:#3d3d3d;}' +
    '.vam-land{fill:#eef1ee;stroke:#d9dfd9;}' +
    '.vam-bar{fill:#2d7d31;}.vam-bar.mine{fill:#1f5f22;}.vam-bar.hot{stroke:#F69820;stroke-width:3;}' +
    '.vam-tick{stroke:rgba(255,255,255,.75);stroke-width:1.5;}.vam-gate{font-size:11px;font-weight:700;fill:#3d3d3d;}' +
    '.vam-route{stroke:#F69820;stroke-width:7;stroke-linecap:round;stroke-dasharray:2 11;}' +
    '.vam-pin{cursor:pointer;}.vam-pin path{fill:#fff;stroke:#1a1a1a;stroke-width:2.5;}.vam-pin text{font-size:13px;font-weight:900;fill:#1a1a1a;}' +
    '.vam-pin.on path{fill:#F69820;}' +
    '.vam-you circle{fill:#F69820;stroke:#fff;stroke-width:3;}.vam-you text{font-size:9px;font-weight:900;fill:#fff;}';
  function css() { if (document.getElementById('vam-css')) return; var st = document.createElement('style'); st.id = 'vam-css'; st.textContent = CSS; document.head.appendChild(st); }

  window.VEAirportMap = { svg: svg, find: find, route: route, levels: levels, levelOf: levelOf, terminalName: terminalName, css: css, expand: expand };
})();
