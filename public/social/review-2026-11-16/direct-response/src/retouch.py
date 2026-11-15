# Removes the readable "EVENT WRISTBAND" lettering from River's wristbands (rule: no readable words in our drawn scenes).
# Inside each strap (bounds per row, measured on the 1080 art), light letter pixels are refilled with that strap's own color.
import sys, numpy as np
from PIL import Image, ImageFilter
src, out = sys.argv[1], sys.argv[2]
img = Image.open(src).convert('RGB'); im = np.array(img).astype(int)
def lerp(a, b, t): return a + (b - a) * t
# strap: (y0, y1, (xl0, xr0) at y0, (xl1, xr1) at y1, color test)
straps = [
  (560, 735, (329, 350), (332, 352), lambda c: c[2] > c[0] + 15),            # blue
  (557, 735, (343, 372), (369, 391), lambda c: c[0] > c[2] + 40),            # orange
]
mask_all = np.zeros(im.shape[:2], bool)
for y0, y1, (a0, b0), (a1, b1), ok in straps:
    for y in range(y0, y1):
        t = (y - y0) / (y1 - y0); xl, xr = int(lerp(a0, a1, t)), int(lerp(b0, b1, t))
        row = im[y, xl:xr]
        good = [c for c in row if ok(c) and c.max() < 245 and (c.max() - c.min()) > 45]
        if not good: continue
        col = np.median(np.array(good), 0)
        for x in range(xl, xr):
            c = im[y, x]
            if c.max() > 150 and (c.max() - c.min()) < 80 or (c.max() > 200 and not ok(c)):
                im[y, x] = col; mask_all[y, x] = True
        # second pass: letter edges, anything lighter than the strap that is not its black outline
        for x in range(xl + 2, xr - 2):
            c = im[y, x]
            if c.max() > 90 and (c.sum() - col.sum()) > 45: im[y, x] = col; mask_all[y, x] = True
outi = Image.fromarray(im.astype(np.uint8))
m = Image.fromarray((mask_all * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.5))
outi = Image.composite(outi.filter(ImageFilter.GaussianBlur(0.8)), outi, m)
outi.save(out, quality=92)
