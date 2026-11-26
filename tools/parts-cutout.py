#!/usr/bin/env python3
"""Cut the configurator's brand-part photos out of their backgrounds -> assets/site/parts/<id>.webp (transparent).

The sources are the makers' official product photos gathered for the parts review (preview/parts-review/, not
committed: preview/ is git-ignored), listed with their ids in preview/parts-review/parts.json. Each photo goes through
rembg's IS-Net general model, is cropped to the part with a small margin and saved as a transparent WebP (at most
640x480). The ENDLESS MONO6 Sports TA photo keeps a white floor reflection under the caliper, which is stripped after.
Three HKS intakes only have photos of the part fitted in a car, which the model can't separate from the engine bay:
they are cropped to the part and cut out with GrabCut (the red and green filters seeded by their colour). The HKS oil
cooler uses HKS's studio photo of the kit instead of its fitted photo (ALT_SOURCE, cropped to the cooler core).
Also writes each part's reference image for the Kling edits (assets/generated/config/parts-ref/, on light grey; the
fitted intakes use their whole fitted photo, which shows where they sit).

  pip install "rembg[cpu]"     # downloads isnet-general-use.onnx (about 180 MB) to ~/.u2net on first use
  python3 tools/parts-cutout.py [id ...]     # all the configurator's parts, or just the ids given

The ids are the ones in PARTS in src/app.js (the Basic Slit disc is one photo for the front and rear items).
"""
import json
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
REV = os.path.join(ROOT, 'preview', 'parts-review')
REV2 = os.path.join(ROOT, 'preview', 'parts-review-2')   # the second review: the parts in tools/parts_more.py
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from parts_more import MORE  # noqa: E402
MORE_BY_ID = {m['id']: m for m in MORE}
OUT = os.path.join(ROOT, 'assets', 'site', 'parts')
IDS = [
    'hks-super-turbo-muffler',
    'hks-silent-hipower',
    'hks-hipower-spec-r',
    'hks-legal',
    'hks-carbon-ti',
    'tomei-expreme-ti',
    'hks-metal-catalyzer',
    'hks-gt-extension',
    'hks-front-pipe',
    'tomei-expreme-manifold',
    'tomei-heat-protector',
    'tomei-outlet-component',
    'tomei-ti-cat-straight',
    'hks-gtiii-rs',
    'tomei-arms-m7963',
    'hks-racing-suction',
    'hks-super-power-flow',
    'hks-premium-suction',
    'hks-super-air-filter',
    'tomei-turbo-suction-hose',
    'hks-ssqv4',
    'hks-suction-return',
    'tomei-bov',
    'hks-cam-ex',
    'hks-cam-in-step2',
    'hks-valve-spring',
    'hks-cam-pulley',
    'tomei-poncam-evo9',
    'tomei-procam-evo9',
    'tomei-valve-spring',
    'tomei-ti-retainer',
    'tomei-cam-gear',
    'hks-forged-pistons',
    'hks-conrods',
    'hks-head-gasket',
    'tomei-head-gasket',
    'tomei-stroker-kits',
    'tomei-forged-pistons',
    'tomei-conrods',
    'tomei-billet-crank',
    'tomei-studs-bearings',
    'hks-fuel-regulator',
    'tomei-fuel-pump',
    'tomei-fpr',
    'hks-fcon-is',
    'hks-fcon-vpro',
    'hks-evc7-mr',
    'hks-evc-s2',
    'hks-oil-cooler-black',
    'tomei-thermostat-killer',
    'tomei-slicing-baffle',
    'hks-coil-pro',
    'hks-spark-plugs',
    'hks-la-clutch',
    'hks-la-clutch-twin',
    'hks-hipermax-s',
    'hks-hipermax-r',
    'endless-function-ps',
    'endless-function-sc',
    'endless-function-tc',
    'endless-zeal-function-x-plus',
    'endless-zeal-super-function',
    'endless-racing-mono6',
    'endless-racing-mono4',
    'endless-racing-mono4r',
    'endless-mono6-sports-ta',
    'endless-racing6',
    'endless-6pot',
    'endless-chibi6',
    'endless-m4',
    'endless-racing4-rear',
    'endless-s2-rear',
    'hks-brake-system',
    'endless-pads-street',
    'endless-disc-racing-front',
    'endless-disc-basic-slit',
    'endless-disc-eslit-rear',
    'endless-swivel-steel',
    'endless-swivel-racing',
]   # hks-hipower-us and hks-turbo-timer have no official photo: the configurator draws an outline of the type instead


# photos that show the part fitted in a car: cut out only the part (box in the source thumbnail's pixels), by GrabCut
CROP = {
    'hks-racing-suction': (168, 88, 278, 222),
    'hks-super-power-flow': (138, 78, 268, 212),
    'hks-premium-suction': (158, 22, 381, 262),
}
# a better official photo than the review's: (url, local copy, crop box)
ALT_SOURCE = {
    'hks-oil-cooler-black': ('https://www.hks-power.co.jp/product/cooling/oilcooler/images/oil_cooler_black_Rtype.jpg',
                             'img-alt/oilcooler-rtype.jpg', (300, 138, 572, 392)),
}
REF = os.path.join(ROOT, 'assets', 'generated', 'config', 'parts-ref')


def grabcut(pid, im):
    """Cut a fitted part out of a cluttered photo: GrabCut from the crop's border (background) and, for the red and
    green filters, their colour (part)."""
    import cv2
    c = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2BGR)
    c = cv2.resize(c, (c.shape[1] * 3, c.shape[0] * 3), interpolation=cv2.INTER_CUBIC)
    h, w = c.shape[:2]
    hsv = cv2.cvtColor(c, cv2.COLOR_BGR2HSV)
    mask = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
    if pid == 'hks-racing-suction':   # the red filter and its purple adapter
        fg = ((((hsv[..., 0] < 8) | (hsv[..., 0] > 168)) & (hsv[..., 1] > 90))
              | ((hsv[..., 0] > 118) & (hsv[..., 0] < 160) & (hsv[..., 1] > 50))) & (hsv[..., 2] > 60)
    elif pid == 'hks-super-power-flow':
        fg = (hsv[..., 0] > 40) & (hsv[..., 0] < 95) & (hsv[..., 1] > 60) & (hsv[..., 2] > 50)
    else:
        fg = np.zeros((h, w), bool)
        mask[int(h * 0.12):int(h * 0.88), int(w * 0.12):int(w * 0.88)] = cv2.GC_PR_FGD
    if fg.any():
        fgm = cv2.morphologyEx(fg.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        mask[cv2.dilate(fgm, np.ones((25, 25), np.uint8)) > 0] = cv2.GC_PR_FGD
        mask[fgm > 0] = cv2.GC_FGD
    mask[:3, :] = mask[-3:, :] = mask[:, :3] = mask[:, -3:] = cv2.GC_BGD
    cv2.grabCut(c, mask, None, np.zeros((1, 65)), np.zeros((1, 65)), 8, cv2.GC_INIT_WITH_MASK)
    m = ((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    if n > 1:
        m = (lab == 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(1 - m, 4)   # fill the holes
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    m = (m | np.isin(lab, [i for i in range(1, n) if i not in border])).astype(np.uint8)
    a = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.6)
    return Image.fromarray(np.dstack([cv2.cvtColor(c, cv2.COLOR_BGR2RGB), (a * 255).astype(np.uint8)]))


def write_ref(pid, src_photo=None):
    """The reference image for the Kling edits: the cut-out on light grey (or a whole fitted photo)."""
    os.makedirs(REF, exist_ok=True)
    if src_photo is not None:
        im = src_photo.convert('RGB')
        im.resize((1024, round(1024 * im.height / im.width)), Image.LANCZOS).save(os.path.join(REF, pid + '.jpg'), quality=92)
        return
    im = Image.open(os.path.join(OUT, pid + '.webp')).convert('RGBA')
    bg = Image.new('RGBA', (1024, 768), (232, 233, 235, 255))
    im.thumbnail((880, 660), Image.LANCZOS)
    bg.alpha_composite(im, ((1024 - im.width) // 2, (768 - im.height) // 2))
    bg.convert('RGB').save(os.path.join(REF, pid + '.jpg'), quality=92)


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


def largest_parts(cut):
    """Keep the matte's big pieces only: drops captions printed under a wheel and stray specks."""
    import cv2
    a = np.array(cut)[..., 3]
    n, lab, st, _ = cv2.connectedComponentsWithStats((a > 40).astype(np.uint8), 8)
    if n <= 2:
        return cut
    big = st[1:, cv2.CC_STAT_AREA].max()
    keep = np.isin(lab, [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= 0.15 * big])
    keep = cv2.dilate(keep.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    arr = np.array(cut)
    arr[..., 3] = np.where(keep, arr[..., 3], 0)
    return Image.fromarray(arr)


def main():
    from rembg import new_session, remove
    parts = {p['id']: p for p in json.load(open(os.path.join(REV, 'parts.json')))['parts']}
    rev2 = {p['id']: p for p in json.load(open(os.path.join(REV2, 'parts.json')))['parts']} if os.path.exists(os.path.join(REV2, 'parts.json')) else {}
    os.makedirs(OUT, exist_ok=True)
    session = new_session('isnet-general-use')
    for pid in sys.argv[1:] or IDS + list(MORE_BY_ID):
        if pid in MORE_BY_ID:   # second review: its full-size download
            src = (rev2[MORE_BY_ID[pid]['review']].get('photo') or {}).get('local_file')
            if not src:
                print('no photo:', pid)
                continue
            im = Image.open(os.path.join(REV2, src))
            if im.mode in ('RGBA', 'LA', 'P'):   # transparent PNGs: flatten on white for the matte
                im = im.convert('RGBA')
                bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
                bg.alpha_composite(im)
                im = bg
            im = im.convert('RGB')
        else:
            src = (parts[pid].get('photo') or {}).get('thumbnail')   # the review's copies: badges masked, CMYK converted
            if not src:
                print('no photo:', pid)
                continue
            im = Image.open(os.path.join(REV, src)).convert('RGB')
        if pid in ALT_SOURCE:
            url, local, box = ALT_SOURCE[pid]
            path = os.path.join(REV, local)
            if not os.path.exists(path):
                os.makedirs(os.path.dirname(path), exist_ok=True)
                import urllib.request
                urllib.request.urlretrieve(url, path)
            im = Image.open(path).convert('RGB').crop(box)
        if pid in CROP:
            whole = im
            cut = grabcut(pid, im.crop(CROP[pid]))
            a = np.array(cut)[..., 3]
            ys, xs = np.where(a > 12)
            cut = cut.crop((max(0, xs.min() - 8), max(0, ys.min() - 8), xs.max() + 8, ys.max() + 8))
            cut.thumbnail((640, 480), Image.LANCZOS)
            cut.save(os.path.join(OUT, pid + '.webp'), 'WEBP', quality=86, method=6)
            write_ref(pid, whole)
            print(f'{pid:40s} (GrabCut)')
            continue
        if im.width < 900:   # small sources: upscale before the matte so the edges stay smooth
            im = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
        cut = remove(im, session=session, post_process_mask=True)
        if pid in MORE_BY_ID:
            cut = largest_parts(cut)
        a = np.array(cut)[..., 3]
        ys, xs = np.where(a > 12)
        pad = int(0.03 * max(a.shape))
        cut = cut.crop((max(0, xs.min() - pad), max(0, ys.min() - pad), min(a.shape[1], xs.max() + pad), min(a.shape[0], ys.max() + pad)))
        cut.thumbnail((640, 480), Image.LANCZOS)
        out = os.path.join(OUT, pid + '.webp')
        cut.save(out, 'WEBP', quality=86, method=6)
        if pid == 'endless-mono6-sports-ta':
            strip_floor_reflection(out)
        write_ref(pid)
        print(f'{pid:40s} {os.path.getsize(out) // 1024} KB')


if __name__ == '__main__':
    main()
