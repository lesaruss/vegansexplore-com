"""Build the landscape logo v2 and the mark-only files from the portrait logo v2 (Sean, 2026-11-11:
"the vegans isn't the same weight as the portrait view. It should be the same weight"; "when we have the logo
that small, we should just use the mark"). Reuses the portrait's own paths, so the weight and spacing match."""
import re, sys
VARIANTS = ['', '-inverted', '-white', '-ink']
for v in VARIANTS:
    src = open(f'public/logo-ve-portrait-v2{v}.svg').read()
    g = re.search(r'<g transform="translate\(325\.94,-203\.93\) scale\(2\.53111\)">(.*?)</g>', src, re.S).group(1)
    texts = re.findall(r'<path fill="([^"]+)" transform="translate\(([-\d.]+),([-\d.]+)\)" d="([^"]+)"/>', src)
    assert len(texts) == 2, (v, len(texts))
    # mark-only: local coordinates, mark spans x 205..1292, y 81..969
    open(f'public/logo-ve-mark{v}.svg', 'w').write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="165 41 1167 968" role="img" aria-label="Vegans Explore">{g}</svg>\n')
    # landscape: mark body height = text block height (VEGANS top 2377 to EXPLORE bottom 3602 in root units)
    s = 1225 / 731.0
    X0 = -s * 205; Y0 = 2377 - s * 238
    mark_right = X0 + s * 1292
    dx = mark_right + 230
    paths = ''.join(f'<path fill="{f}" transform="translate({float(tx)+dx:.2f},{ty})" d="{d}"/>' for f, tx, ty, d in texts)
    top = Y0 + s * 81; bottom = 3602.25
    right = 4500 + dx
    pad = 90
    vb = f'{-pad:.0f} {top-pad:.0f} {right+2*pad:.0f} {bottom-top+2*pad:.0f}'
    open(f'public/logo-ve-landscape-v2{v}.svg', 'w').write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="Vegans Explore">'
        f'<g transform="translate({X0:.2f},{Y0:.2f}) scale({s:.5f})">{g}</g>{paths}</svg>\n')
    print(v or 'full', 'viewBox', vb)
