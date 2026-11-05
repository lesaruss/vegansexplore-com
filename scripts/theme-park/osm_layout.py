#!/usr/bin/env python3
"""Turn OpenStreetMap data (ODbL) for one theme park into the compact base layer the park map draws
(ve_venues.layout.base, drawn by /public/ve-park-map.js). Playbook ve-theme-park-guide, Sean 2026-11-05: "create a maybe even
better looking version of it that's uniquely ours but true to the map". Our own drawing from open survey data, never the park's map art.

  python3 -I scripts/theme-park/osm_layout.py <osm json tiles...> --park "Magic Kingdom" --out base.json

The tiles are the main OSM API's /api/0.6/map.json answers (read through the one-time function ve-once-osm-park, since the build
session cannot reach OpenStreetMap). Output: metres from an origin, in decimetres, as flat [x, y, x, y, ...] lists, simplified.
  o        [lat, lng] the origin          b     [minx, miny, maxx, maxy] the park outline's box, decimetres
  park     the park's outline             lands [{n: name, r: ring}]  (OSM place=locality areas)
  green    gardens, grass, woods          rock  sand and bare rock (rockwork)
  water    lakes, the moat, rivers         wl    [{w: metres, l: line}] canals and streams
  plaza    pedestrian areas                path  [{w: metres, l: line}] walkways
  bld      buildings                       castle the castle (OSM historic=castle) or null
  rail     the railroad lines              src, at
"""
import json, math, sys, argparse, datetime

ap = argparse.ArgumentParser()
ap.add_argument('tiles', nargs='+')
ap.add_argument('--park', required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--pad', type=float, default=40.0, help='metres around the park outline to keep')
ap.add_argument('--land-pad', type=float, default=35.0, help='metres around the lands for the frame')
a = ap.parse_args()

N, W, R = {}, {}, {}
for t in a.tiles:
    for e in json.load(open(t))['elements']:
        {'node': N, 'way': W, 'relation': R}[e['type']][e['id']] = e

def coords(w):
    return [(N[n]['lat'], N[n]['lon']) for n in w['nodes'] if n in N]

park = next((w for w in W.values() if w.get('tags', {}).get('tourism') == 'theme_park' and w['tags'].get('name') == a.park), None)
if not park:
    sys.exit('no theme_park way named ' + a.park)
pc = coords(park)
olat = sum(p[0] for p in pc) / len(pc); olng = sum(p[1] for p in pc) / len(pc)
KX = 111320 * math.cos(olat * math.pi / 180); KY = 110540
def m(p): return ((p[1] - olng) * KX, (p[0] - olat) * KY)
pm = [m(p) for p in pc]
bx0 = min(p[0] for p in pm) - a.pad; bx1 = max(p[0] for p in pm) + a.pad
by0 = min(p[1] for p in pm) - a.pad; by1 = max(p[1] for p in pm) + a.pad
def near(pts): return any(bx0 <= x <= bx1 and by0 <= y <= by1 for x, y in pts)

def dp(pts, tol):
    if len(pts) < 3: return pts
    keep = [False] * len(pts); keep[0] = keep[-1] = True; st = [(0, len(pts) - 1)]
    while st:
        i, j = st.pop(); (x1, y1), (x2, y2) = pts[i], pts[j]; dx, dy = x2 - x1, y2 - y1; L = math.hypot(dx, dy) or 1e-9
        k, dm = -1, -1
        for q in range(i + 1, j):
            d = abs(dy * (pts[q][0] - x1) - dx * (pts[q][1] - y1)) / L
            if d > dm: dm, k = d, q
        if dm > tol: keep[k] = True; st += [(i, k), (k, j)]
    return [p for p, f in zip(pts, keep) if f]

def flat(pts, tol, ring):
    if ring:
        if pts[0] == pts[-1]: pts = pts[:-1]
        if len(pts) < 3: return None
        h = len(pts) // 2  # a closed ring starts and ends on one point, which the simplifier cannot measure from: do it in two halves
        s = dp(pts[:h + 1], tol) + dp(pts[h:] + [pts[0]], tol)[1:-1]
    else:
        s = dp(pts, tol)
    if ring and len(s) < 3: return None
    if not ring and len(s) < 2: return None
    o = []
    for x, y in s: o += [round(x * 10), round(y * 10)]
    return o

def area(pts):
    return abs(sum(pts[i][0] * pts[i - 1][1] - pts[i - 1][0] * pts[i][1] for i in range(len(pts)))) / 2

def stitch(ways):
    """Join a multipolygon's outer ways into closed rings."""
    segs = [coords(w) for w in ways if coords(w)]; rings = []
    while segs:
        cur = segs.pop(0); changed = True
        while cur[0] != cur[-1] and changed:
            changed = False
            for i, s in enumerate(segs):
                if s[0] == cur[-1]: cur += s[1:]
                elif s[-1] == cur[-1]: cur += s[::-1][1:]
                elif s[-1] == cur[0]: cur = s + cur[1:]
                elif s[0] == cur[0]: cur = s[::-1] + cur[1:]
                else: continue
                segs.pop(i); changed = True; break
        rings.append(cur)
    return rings

out = {'src': 'OpenStreetMap contributors (ODbL)', 'at': datetime.date.today().isoformat(), 'o': [round(olat, 7), round(olng, 7)],
       'b': [round(bx0 * 10), round(by0 * 10), round(bx1 * 10), round(by1 * 10)],
       'park': flat(pm, 1.5, True), 'lands': [], 'green': [], 'rock': [], 'water': [], 'wl': [], 'plaza': [], 'path': [], 'bld': [], 'castle': None, 'rail': []}

used = set()
for r in R.values():
    t = r.get('tags', {})
    if t.get('type') != 'multipolygon' or not (t.get('natural') == 'water' or t.get('water')): continue
    outers = [W[mm['ref']] for mm in r.get('members', []) if mm['type'] == 'way' and mm.get('role') in ('outer', '') and mm['ref'] in W]
    for ring in stitch(outers):
        pts = [m(p) for p in ring]
        if near(pts):
            f = flat(pts, 1.5, True)
            if f: out['water'].append(f)
    used.update(w['id'] for w in outers)

PATHW = {'footway': 3, 'pedestrian': 6, 'living_street': 9, 'steps': 2.5, 'path': 2}
for w in W.values():
    t = w.get('tags', {}); c = coords(w)
    if len(c) < 2: continue
    pts = [m(p) for p in c]
    if not near(pts): continue
    closed = w['nodes'][0] == w['nodes'][-1]
    if t.get('place') == 'locality' and t.get('name') and closed:
        f = flat(pts, 1.5, True)
        if f: out['lands'].append({'n': t['name'], 'r': f})
    elif t.get('historic') == 'castle' and closed:
        out['castle'] = flat(pts, 0.4, True)
    elif t.get('building') and closed:
        if area(pts) >= 12:
            f = flat(pts, 0.7, True)
            if f: out['bld'].append(f)
    elif (t.get('natural') == 'water' or t.get('water')) and closed and w['id'] not in used:
        f = flat(pts, 1.2, True)
        if f: out['water'].append(f)
    elif t.get('waterway') in ('canal', 'stream', 'river', 'drain') and not closed:
        f = flat(pts, 1.2, False)
        if f: out['wl'].append({'w': 6 if t['waterway'] in ('canal', 'river') else 3, 'l': f})
    elif closed and (t.get('leisure') == 'garden' or t.get('landuse') in ('grass', 'forest') or t.get('natural') in ('wood', 'scrub', 'grassland')):
        f = flat(pts, 1.2, True)
        if f: out['green'].append(f)
    elif closed and t.get('natural') in ('sand', 'bare_rock', 'shingle', 'beach'):
        f = flat(pts, 1.0, True)
        if f: out['rock'].append(f)
    elif t.get('highway') == 'pedestrian' and closed and t.get('area') == 'yes':
        f = flat(pts, 0.8, True)
        if f: out['plaza'].append(f)
    elif t.get('highway') in PATHW:
        f = flat(pts, 0.8, False)
        if f: out['path'].append({'w': PATHW[t['highway']], 'l': f})
    elif t.get('railway') == 'narrow_gauge':
        f = flat(pts, 1.2, False)
        if f: out['rail'].append(f)

# The frame is the lands (what a visitor walks), not the whole outline, which takes in backstage and the parking side.
if out['lands']:
    xs = [v for L in out['lands'] for v in L['r'][0::2]]; ys = [v for L in out['lands'] for v in L['r'][1::2]]
    pd = round(a.land_pad * 10)
    out['b'] = [min(xs) - pd, min(ys) - pd, max(xs) + pd, max(ys) + pd]
# Big shapes first, so small ones sit on top.
for k in ('green', 'water', 'rock', 'plaza'):
    out[k].sort(key=lambda r: -area([(r[i], r[i + 1]) for i in range(0, len(r), 2)]))
s = json.dumps(out, separators=(',', ':'))
open(a.out, 'w').write(s)
print({k: (len(v) if isinstance(v, list) else v) for k, v in out.items() if k not in ('o', 'b', 'park')}, 'bytes', len(s))
