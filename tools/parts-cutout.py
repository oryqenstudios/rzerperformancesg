#!/usr/bin/env python3
"""Cut the configurator's brand-part photos out of their backgrounds -> assets/site/parts/<id>.webp (transparent).

The sources are the makers' official product photos gathered for the parts review (preview/parts-review/, not
committed: preview/ is git-ignored), listed with their ids in preview/parts-review/parts.json. Each photo goes through
rembg's IS-Net general model, is cropped to the part with a small margin and saved as a transparent WebP (at most
640x480). The ENDLESS MONO6 Sports TA photo keeps a white floor reflection under the caliper, which is stripped after.

  pip install "rembg[cpu]"     # downloads isnet-general-use.onnx (about 180 MB) to ~/.u2net on first use
  python3 tools/parts-cutout.py [id ...]     # all the configurator's parts, or just the ids given

The ids are the ones in PART_SLOTS in src/app.js (the Basic Slit disc is one photo for the front and rear items).
"""
import json
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
REV = os.path.join(ROOT, 'preview', 'parts-review')
OUT = os.path.join(ROOT, 'assets', 'site', 'parts')
IDS = [
    'hks-super-turbo-muffler', 'hks-silent-hipower', 'hks-hipower-spec-r', 'hks-legal', 'hks-carbon-ti', 'tomei-expreme-ti',
    'hks-metal-catalyzer', 'hks-gt-extension', 'hks-front-pipe', 'tomei-expreme-manifold', 'tomei-heat-protector',
    'tomei-outlet-component', 'tomei-ti-cat-straight', 'hks-gtiii-rs', 'tomei-arms-m7963',
    'endless-function-ps', 'endless-function-sc', 'endless-function-tc', 'endless-zeal-function-x-plus', 'endless-zeal-super-function',
    'endless-racing-mono6', 'endless-racing-mono4', 'endless-racing-mono4r', 'endless-mono6-sports-ta', 'endless-racing6', 'endless-6pot',
    'endless-chibi6', 'endless-m4', 'endless-racing4-rear', 'endless-s2-rear', 'endless-pads-street',
    'endless-disc-racing-front', 'endless-disc-basic-slit', 'endless-disc-eslit-rear', 'endless-swivel-steel', 'endless-swivel-racing',
]   # hks-hipower-us has no official photo: the configurator draws an exhaust outline instead


def strip_floor_reflection(path):
    """Remove pale regions joined to the transparent surroundings in the lower part of the image (a white floor
    reflection the matte kept), leaving enclosed pale details such as a white logo."""
    import cv2
    im = np.array(Image.open(path).convert('RGBA'))
    rgb, a = im[..., :3].astype(int), im[..., 3]
    pale = ((rgb.min(2) > 150) & (rgb.max(2) - rgb.min(2) < 40) & (a > 0)).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(pale, 8)
    edge = cv2.dilate((a < 10).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    drop = np.zeros_like(pale)
    for i in range(1, n):
        comp = lab == i
        cy = st[i, cv2.CC_STAT_TOP] + st[i, cv2.CC_STAT_HEIGHT] / 2
        if st[i, cv2.CC_STAT_AREA] >= 40 and cy > im.shape[0] * 0.55 and (edge & comp).any():
            drop |= comp.astype(np.uint8)
    drop = cv2.dilate(drop, np.ones((3, 3), np.uint8))
    im[..., 3] = np.minimum(a, cv2.GaussianBlur(np.where(drop > 0, 0, a).astype(np.uint8), (0, 0), 0.7))
    ys, xs = np.where(im[..., 3] > 12)
    im = im[max(0, ys.min() - 12):ys.max() + 12, max(0, xs.min() - 12):xs.max() + 12]
    Image.fromarray(im).save(path, 'WEBP', quality=86, method=6)


def main():
    from rembg import new_session, remove
    parts = {p['id']: p for p in json.load(open(os.path.join(REV, 'parts.json')))['parts']}
    os.makedirs(OUT, exist_ok=True)
    session = new_session('isnet-general-use')
    for pid in sys.argv[1:] or IDS:
        src = (parts[pid].get('photo') or {}).get('thumbnail')   # the review's copies: badges masked, CMYK converted
        if not src:
            print('no photo:', pid)
            continue
        im = Image.open(os.path.join(REV, src)).convert('RGB')
        if im.width < 900:   # small sources: upscale before the matte so the edges stay smooth
            im = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
        cut = remove(im, session=session, post_process_mask=True)
        a = np.array(cut)[..., 3]
        ys, xs = np.where(a > 12)
        pad = int(0.03 * max(a.shape))
        cut = cut.crop((max(0, xs.min() - pad), max(0, ys.min() - pad), min(a.shape[1], xs.max() + pad), min(a.shape[0], ys.max() + pad)))
        cut.thumbnail((640, 480), Image.LANCZOS)
        out = os.path.join(OUT, pid + '.webp')
        cut.save(out, 'WEBP', quality=86, method=6)
        if pid == 'endless-mono6-sports-ta':
            strip_floor_reflection(out)
        print(f'{pid:40s} {os.path.getsize(out) // 1024} KB')


if __name__ == '__main__':
    main()
