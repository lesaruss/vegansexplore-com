# Picture-area compositor for the short-video panel samples (4:5 reel art 1080x1350, 1:1 carousel art 1080x1080).
# Screens go full bleed at near native phone size (1170 px capture -> 1080 px), cropped INTO the part that matters.
# A Guide scene rides as a rounded inset in the reel's safe area (left side, above the caption zone; never under the like/share column).
import sys
from PIL import Image, ImageDraw, ImageFilter
R = '/home/user/vegansexplore-com/public/social/pinned/'
OUT = '/home/user/vegansexplore-com/public/social/panel/short-video/art/'

def rr_mask(w, h, r):
    m = Image.new('L', (w, h), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), r, fill=255); return m

def screen(cap, y0, W, H, scale=1080/1170):
    im = Image.open(R + 'cap/' + cap + '.jpg').convert('RGB')
    cw = int(round(W / scale)); ch = int(round(H / scale)); x0 = (im.width - cw) // 2
    return im.crop((x0, y0, x0 + cw, y0 + ch)).resize((W, H), Image.LANCZOS)

def inset(base, scene, x, y, s, crop=None):
    sc = Image.open(R + 'scenes/' + scene + '.jpg').convert('RGB')
    if crop: sc = sc.crop(crop)
    sc = sc.resize((s, s), Image.LANCZOS)
    b = 12; card = Image.new('RGB', (s + 2 * b, s + 2 * b), 'white')
    card.paste(sc, (b, b), rr_mask(s, s, 14))
    sh = Image.new('RGBA', base.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((x + 14, y + 14, x + s + 2 * b + 14, y + s + 2 * b + 14), 22, fill=(26, 26, 26, 255))
    base.paste(Image.new('RGB', base.size, (26, 26, 26)), (0, 0), sh.split()[3])
    base.paste(card, (x, y), rr_mask(s + 2 * b, s + 2 * b, 22))
    return base

def save(im, name): im.save(OUT + name, quality=90); print(name, im.size)

# Reel art, 1080x1350. In the full frame it starts at y=570; IG's caption/audio rows cover frame y>=1560 (art y>=990),
# the action column covers x>=940 from frame y~1150 (art y>=580). Faces and key UI stay in art y<990 and x<940 below art y 580.
# 01 hook: Liz with the app, scene whole on top, the site's own header strip below it.
a = Image.new('RGB', (1080, 1350), 'white')
a.paste(Image.open(R + 'scenes/liz-share.jpg').convert('RGB'), (0, 0))
a.paste(screen('home', 0, 1080, 270), (0, 1080))
save(a, 'r1-hook.jpg')
# 02 Directory: the headline, search and the Eat door big, all above the caption zone.
# (no Guide here: the doors are the point, and Sean asked for some frames without one)
a = screen('directory', 590, 1080, 1350)
save(a, 'r2-directory.jpg')
# 03 Listing: the listing head big, Maya inset.
a = screen('listing', 160, 1080, 1350)
save(inset(a, 'maya-menu', 36, 770, 290, (120, 0, 1040, 920)), 'r3-listing.jpg')
# 04 Events: the event cards big, River inset.
a = screen('events', 278, 1080, 1350)
save(inset(a, 'river-festival', 30, 700, 260, (140, 0, 1080, 940)), 'r4-events.jpg')
# Carousel inside slide art, 1:1: the Directory doors full bleed, Theo inset bottom right (no app UI on a feed post's picture).
a = screen('directory', 1125, 1080, 1080)
save(inset(a, 'theo-guidebook', 716, 716, 300, (140, 0, 1080, 940)), 'c-directory-sq.jpg')
