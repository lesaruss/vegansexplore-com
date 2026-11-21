# ig-carousel panel: "zoom and bleed" picture areas (1080 x 1080). Screens are drawn 1.4x to 2x bigger than the current slides and run off
# the edge of the picture area (the band covers the cut), so the live site reads at feed size. Guide scenes stay whole, never cropped.
import sys
from PIL import Image, ImageDraw
R = '/home/user/vegansexplore-com/public/social/pinned/'
OUT = '/home/user/vegansexplore-com/public/social/panel/ig-carousel/art/'
INK = (26, 26, 26)
COL = {'dk': (0x2D, 0x5C, 0x27), 'or': (0xF6, 0x98, 0x20), 'pink': (0xFF, 0x9E, 0xC4), 'md': (0x3A, 0x9B, 0x3E), 'peach': (0xFF, 0xEB, 0xD1)}
tint = lambda c: tuple(round(v * .26 + 255 * .74) for v in c)

def rr(size, r):
    m = Image.new('L', size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], r, fill=255); return m

def shadow_box(cv, x, y, w, h, r, fill, sh=16):
    d = ImageDraw.Draw(cv)
    d.rounded_rectangle([x + sh, y + sh, x + w + sh, y + h + sh], r, fill=INK)
    d.rounded_rectangle([x, y, x + w, y + h], r, fill=fill)

def screen(cv, cap, cx, cy, x, y, w, h, r):
    im = Image.open(R + 'cap/' + cap).convert('RGB'); s = w / (im.width - cx) if cx >= 0 else 1
    crop = im.crop((cx, cy, im.width, min(im.height, cy + round(h / s))))
    crop = crop.resize((w, round(crop.height * s)), Image.LANCZOS)
    cv.paste(crop, (x, y), rr(crop.size, r))

def phone(cv, cap, x, y, w, cy=0):
    h = 2000; b = round(w * .024)
    shadow_box(cv, x, y, w, h, round(w * .09), (17, 17, 17))
    screen(cv, cap, 0, cy, x + b, y + b, w - 2 * b, h, round(w * .068))

def browser(cv, cap, x, y, w, cx0, cy0, cx1):
    """desktop screenshot, columns cx0..cx1 of the capture shown across w (the frame may run off the canvas)"""
    h = 2000; d = ImageDraw.Draw(cv)
    shadow_box(cv, x, y, w, h, 30, INK)
    d.rounded_rectangle([x + 6, y + 6, x + w - 6, y + h], 26, fill='white')
    for i, c in enumerate([(0xFF, 0x9E, 0xC4), (0xF6, 0x98, 0x20), (0x22, 0xC5, 0x5E)]):
        d.ellipse([x + 30 + i * 34, y + 24, x + 52 + i * 34, y + 46], fill=c)
    d.line([x + 6, y + 68, x + w - 6, y + 68], fill=INK, width=4)
    im = Image.open(R + 'cap/' + cap).convert('RGB'); s = (w - 12) / (cx1 - cx0)
    crop = im.crop((cx0, cy0, cx1, im.height)); crop = crop.resize((w - 12, round(crop.height * s)), Image.LANCZOS)
    cv.paste(crop, (x + 6, y + 70))

def card(cv, scene, x, y, w):
    shadow_box(cv, x, y, w, w, 30, 'white')
    im = Image.open(scene).convert('RGB').resize((w - 28, w - 28), Image.LANCZOS)
    cv.paste(im, (x + 14, y + 14), rr(im.size, 18))

def make(name, color, fn):
    cv = Image.new('RGB', (1080, 1080), tint(COL[color])); fn(cv); cv.save(OUT + name + '.jpg', quality=90)

# cover: the homepage big and sliced, Liz showing a friend, whole
make('cover', 'dk', lambda c: (phone(c, 'home.jpg', 40, 60, 640, cy=336), card(c, R + 'scenes/liz-share.jpg', 610, 590, 430)))
# Directory: one phone, wide and sliced, no Guide; starts at the headline so the doors land in the frame
make('directory', 'dk', lambda c: phone(c, 'directory.jpg', 110, 56, 860, cy=330))
# a listing: the phone wide, Maya reading a menu in the corner (covers only the bottom of the screen)
make('listing', 'dk', lambda c: (phone(c, 'listing.jpg', 40, 56, 760, cy=336), card(c, R + 'scenes/maya-menu.jpg', 690, 640, 360)))
# events: the list wide, River at a festival
make('events', 'or', lambda c: (phone(c, 'events.jpg', 40, 56, 760, cy=610), card(c, R + 'scenes/river-festival.jpg', 690, 640, 360)))
# a community: the hub on the phone, set right this time so the run of slides does not repeat one layout.
# (Tried the desktop hub in a browser frame bled off the right edge: at 360 px wide its words were unreadable, so desktop shots are out.)
make('community', 'md', lambda c: phone(c, 'seattle.jpg', 250, 56, 790, cy=336))
print('ok')
