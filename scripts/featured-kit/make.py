# Featured kit: size the five drawn portraits and render the two share graphics, ready to upload.
# python3 scripts/featured-kit/make.py --name "Maria Rodriguez" --city "South Florida" --in <dir with 1x1, 4x5, 9x16, 16x9, 21x9 .png/.jpg> --out <dir>
# Writes <out>/1x1.jpg 4x5.jpg 9x16.jpg 16x9.jpg 21x9.jpg post.jpg story.jpg (the exact names Depot > Nominations checks for).
import argparse, glob, os, subprocess, sys
from PIL import Image
SIZE = {'1x1': (1080, 1080), '4x5': (1080, 1350), '9x16': (1080, 1920), '16x9': (1920, 1080), '21x9': (2520, 1080)}
a = argparse.ArgumentParser(); a.add_argument('--name', required=True); a.add_argument('--city', required=True)
a.add_argument('--in', dest='src', required=True); a.add_argument('--out', required=True); a.add_argument('--base', default='https://vegansexplore.com')
a.add_argument('--sample', action='store_true'); o = a.parse_args()
os.makedirs(o.out, exist_ok=True)
for k, (w, h) in SIZE.items():
    f = (glob.glob(os.path.join(o.src, k + '.*')) or [None])[0]
    if not f: sys.exit('missing ' + k)
    im = Image.open(f).convert('RGB')
    # each shape was drawn in its own shape: only a small tolerance, never a crop into another shape
    if abs(im.width / im.height - w / h) > 0.02: sys.exit(f'{k} is {im.width}x{im.height}, not drawn as {k}; draw it again in its shape')
    im.resize((w, h), Image.LANCZOS).save(os.path.join(o.out, k + '.jpg'), quality=84)
here = os.path.dirname(os.path.abspath(__file__))
cmd = ['node', os.path.join(here, '..', 'brand-templates', 'featured.js'), '--name', o.name, '--city', o.city, '--square', os.path.join(o.out, '1x1.jpg'),
       '--tall', os.path.join(o.out, '4x5.jpg'), '--out', o.out, '--base', o.base] + (['--sample'] if o.sample else [])
sys.exit(subprocess.call(cmd))
