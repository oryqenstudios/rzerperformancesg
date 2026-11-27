#!/usr/bin/env python3
"""Turn the generated photos into the photo configurator's files: assets/site/config/<view>/* and manifest.js.

  python3 tools/config-build.py [view ...]        (default: every view that has a base photo)

Per exterior view (a000..a315, wheel, exhaust, headlight, top):
  paint-<id>.webp       the whole photo in each paint (silver is the base photo), aligned to the base
  plate.webp            the empty workshop (the car removed), shown where the body moves away when it is lowered
  <option>.webp         a layer: what changed in that option's edit, kept to the option's own part, cropped, soft-edged
  wingdel-<paint>.webp  the wing removed from that paint's photo (the boot under it is painted, so one per paint)
  m-body.png, m-tyres.png, m-refl.png, m-floor.png   half-size alpha masks for the ride-height shift
Interior views get their photo; the engine-bay views their paints and the carbon bonnet layer.
manifest.js sets window.RZ_PHOTOS = {views: {...}, drops: {...}} for src/app.js.

Where each part is comes from the 3D car: tools/render-ids.mjs renders part-ID maps from the same cameras the photos
were generated from (stock, and with the add-ons fitted). Each map is aligned onto its photo by matching the car's
outline (what disappears in the empty-workshop edit), then used to keep every layer to its part. Without that, a layer
also carries the patches of paint reflection that Kling re-renders in every edit, which show as silver blotches on a
car of another colour.
"""
import importlib.util
import json
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config_layers import H, W, align, change_mask, load   # noqa: E402

spec = importlib.util.spec_from_file_location('jobs', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config-jobs.py'))
J = importlib.util.module_from_spec(spec)
spec.loader.exec_module(J)

OUT = 'assets/site/config'
IDDIR = f'{J.C}/ids'
GUIDES = json.load(open(f'{J.C}/guides/views.json'))
ID = json.load(open(f'{IDDIR}/ids.json')) if os.path.exists(f'{IDDIR}/ids.json') else {}
RIDE_MM = {'springs': 30, 'coilovers': 50}
manifest = {'views': {}, 'drops': {}}
# building only some views keeps the rest of the existing manifest
if len(sys.argv) > 1 and os.path.exists(f'{OUT}/manifest.js'):
    manifest = json.loads(open(f'{OUT}/manifest.js').read().split('=', 1)[1].strip().rstrip(';'))
if os.path.exists(f'{OUT}/manifest.js'):
    manifest = json.loads(open(f'{OUT}/manifest.js').read().split('=', 1)[1].rstrip(';\n'))

# option -> (id map state, parts, grow in px): the layer is kept to these parts (and their mirror images) grown a little
ROI = {
    'rim-': ('stock', ['rim'], 6),
    'caliper-': ('stock', ['caliper'], 6),
    'tint-': ('stock', ['glass'], 6),
    'drl-': ('stock', ['headlight'], 18),
    'lights-off': ('stock', ['headlight'], 18),
    'hood-carbon': ('stock', ['bonnet'], 8),
    'roof-carbon': ('stock', ['roof'], 8),
    'mirror-carbon': ('stock', ['mirrors'], 8),
    'lip-lip': ('stock', ['lip'], 12),
    'lip-splitter': ('addA', ['splitter', 'lip'], 22),
    'skirts-carbon': ('addA', ['skirts'], 18),
    'diffuser-carbon': ('addA', ['diffuser'], 20),
    'wingdel-': ('stock', ['wing'], 16),
    'wing-lip': ('addB', ['lipspoiler'], 16),
    'wing-gt': ('addA', ['gt'], 26),
    'ex-factory-': ('stock', ['tip'], 14),
    'ex-dual-': ('addA', ['tip'], 30),
    'ex-quad-': ('addB', ['tip'], 30),
    'ex-centre-': ('addC', ['tip'], 30),
}


def save_webp(path, im, q=82):
    cv2.imwrite(path, im, [cv2.IMWRITE_WEBP_QUALITY, q])


def save_mask(path, a):
    """Alpha mask as a white RGBA PNG at half size (drawn scaled up with smoothing)."""
    a = cv2.resize(np.clip(a * 255, 0, 255).astype(np.uint8), (W // 2, H // 2), interpolation=cv2.INTER_AREA)
    cv2.imwrite(path, np.dstack([np.full_like(a, 255)] * 3 + [a]), [cv2.IMWRITE_PNG_COMPRESSION, 9])


def disk(r):
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))


def car_region(base, plate):
    """The car and its reflection in the photo: the big connected change when the car is removed."""
    d = change_mask(base, plate, thr=20, min_area=0, grow=0, feather=0).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(d, 8)
    order = sorted(range(1, n), key=lambda i: -stats[i, cv2.CC_STAT_AREA])
    keep = np.zeros((H, W), np.uint8)
    for i in order[:1]:
        keep[lab == i] = 1
    keep = cv2.morphologyEx(keep, cv2.MORPH_CLOSE, disk(15))
    ff = keep.copy()
    cv2.floodFill(ff, np.zeros((H + 2, W + 2), np.uint8), (0, 0), 1)
    return keep | (1 - ff)


class Ids:
    """The view's part-ID maps, aligned onto its photo."""
    PAINT_IDS = (10, 11, 12, 13, 14, 15)

    @staticmethod
    def fit(target, source):
        """Affine taking target (photo) coordinates to source (3D map) coordinates: bounding boxes, then ECC."""
        a = cv2.GaussianBlur(cv2.resize(target.astype(np.float32), (W // 2, H // 2)), (0, 0), 3)
        b = cv2.GaussianBlur(cv2.resize(source.astype(np.float32), (W // 2, H // 2)), (0, 0), 3)

        def bbox(m):
            ys, xs = np.nonzero(m > 0.5)
            return xs.min(), ys.min(), xs.max(), ys.max()
        pa, pb = bbox(a), bbox(b)
        sc = float(np.sqrt((pb[2] - pb[0]) / max(1, pa[2] - pa[0]) * (pb[3] - pb[1]) / max(1, pa[3] - pa[1])))
        A = np.array([[sc, 0, (pb[0] + pb[2]) / 2 - sc * (pa[0] + pa[2]) / 2],
                      [0, sc, (pb[1] + pb[3]) / 2 - sc * (pa[1] + pa[3]) / 2]], np.float32)
        for motion in (cv2.MOTION_TRANSLATION, cv2.MOTION_AFFINE):
            try:
                _, A = cv2.findTransformECC(a, b, A.copy(), motion, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 400, 1e-7), None, 5)
            except cv2.error:
                pass
        A = A.copy()
        A[:, 2] *= 2
        return A

    def __init__(self, v, photo_car, photo_paint_mask, outline_ok):
        """Aligned by the car's outline (what the empty-workshop edit removed) or by its painted body (what the red
        edit turned red, against the 3D car's painted panels and their mirror images), whichever lines the painted
        panels up better."""
        raw = {st: cv2.imread(f'{IDDIR}/{v}-{st}.png', cv2.IMREAD_UNCHANGED) for st in ('stock', 'addA', 'addB', 'addC')}
        st = raw['stock']
        lm = json.load(open(f'{J.C}/landmarks.json')).get(v) if os.path.exists(f'{J.C}/landmarks.json') else None
        if lm:   # hand-placed matching points: a homography (these photos' perspective differs from their guides)
            pts = np.float32(lm)
            Hm, _ = cv2.findHomography(pts[:, :2], pts[:, 2:], 0)
            self.maps = {k: cv2.warpPerspective(m, Hm, (W, H), flags=cv2.INTER_NEAREST) for k, m in raw.items()}
            pids = list(self.PAINT_IDS) + [i + 100 for i in self.PAINT_IDS]
            p3 = np.isin(self.maps['stock'], pids)
            self.how, self.A = 'landmarks', None
            self.iou = self.score = float((p3 & (photo_paint_mask > 0)).sum() / max(1, (p3 | (photo_paint_mask > 0)).sum()))
            return
        pids = list(self.PAINT_IDS) + [i + 100 for i in self.PAINT_IDS]
        cands = [('paint', self.fit(photo_paint_mask, np.isin(st, pids)))]
        if outline_ok:
            cands.append(('outline', self.fit(photo_car, (st > 0) & (st != 200))))
        best = None
        for name, A in cands:
            warped = cv2.warpAffine(st, A, (W, H), flags=cv2.INTER_NEAREST | cv2.WARP_INVERSE_MAP)
            p3 = np.isin(warped, pids)
            iou = float((p3 & (photo_paint_mask > 0)).sum() / max(1, (p3 | (photo_paint_mask > 0)).sum()))
            # judged by the car's outline when the empty-workshop edit gives a clean one, else by the paint
            c3 = (warped > 0) & (warped < 100)
            out_iou = float((c3 & (photo_car > 0)).sum() / max(1, (c3 | (photo_car > 0)).sum()))
            score = out_iou if outline_ok else iou
            if best is None or score > best[3]:
                best = (name, A, iou, score)
        self.how, self.A, self.iou, self.score = best
        self.maps = {k: cv2.warpAffine(m, self.A, (W, H), flags=cv2.INTER_NEAREST | cv2.WARP_INVERSE_MAP) for k, m in raw.items()}

    def part(self, state, names, mirror=True):
        m = self.maps[state]
        ids = [ID[n] for n in names]
        out = np.isin(m, ids + ([i + 100 for i in ids] if mirror else []))
        return out.astype(np.uint8)

    def roi(self, state, names, grow):
        """The parts grown by grow px, and their mirror images in the floor grown only a little (the floor around a
        reflection is re-rendered in every edit, and the car's reflection takes the paint colour)."""
        real = cv2.dilate(self.part(state, names, mirror=False), disk(grow))
        refl = self.part(state, names) & (1 - self.part(state, names, mirror=False))
        return real | cv2.dilate(refl, disk(min(grow, 5)))


def photo_paint(base, red, black=None):
    """The car's paint in the photo: pixels the red-paint edit turned strongly red that weren't red already (the red
    neon and tail lights are red in both), or that the gloss-black edit darkened a lot (paint in shade)."""
    chroma = lambda im: im[..., 2].astype(int) - np.maximum(im[..., 1], im[..., 0]).astype(int)
    m = (chroma(red) > 45) & (chroma(base) < 25)
    if black is not None:
        luma = lambda im: cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(int)
        m |= (luma(base) - luma(black) > 55) & (np.abs(chroma(red) - chroma(base)) > 20)
    m = m.astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, disk(3))
    return cv2.dilate(m, disk(2))


def paint_everywhere(base, paints):
    """The car's paint (and its reflections) in the photo: pixels that differ a lot between the paint photos.
    Glass, trim, tyres, lights and the workshop stay nearly the same in all of them."""
    b = cv2.GaussianBlur(base.astype(np.float32), (0, 0), 1.5)
    d = np.zeros((H, W), np.float32)
    for im in paints:
        d = np.maximum(d, np.abs(cv2.GaussianBlur(im.astype(np.float32), (0, 0), 1.5) - b).max(2))
    m = (d > 38).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, disk(1))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, disk(3))
    return cv2.dilate(m, disk(2))


def fill_holes(m, max_area):
    """Fill the holes in mask m up to max_area pixels."""
    inv = (1 - m).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(inv, 4)
    small = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] <= max_area
             and st[i, cv2.CC_STAT_LEFT] > 0 and st[i, cv2.CC_STAT_TOP] > 0
             and st[i, cv2.CC_STAT_LEFT] + st[i, cv2.CC_STAT_WIDTH] < W and st[i, cv2.CC_STAT_TOP] + st[i, cv2.CC_STAT_HEIGHT] < H]
    return (m | np.isin(lab, small)).astype(np.uint8)


def layer(base, img, region, path, thr=16, paint=None, reach=40, close=4, fill=0, darken_only=False, cover=False,
          fill_paint=False, colour_only=False):
    """Save the changed part of img (aligned to base) inside region as a cropped RGBA WebP; return its box or None.
    A layer is laid over every paint colour, so paint pixels are dropped from it. With cover (carbon and black parts),
    paint the option covers with something dark is kept, the weave's highlights filled in. fill fills holes up to that
    many pixels; with fill_paint the filled holes may be paint (inside a wheel, where the paint mask catches
    reflections). darken_only keeps only pixels the edit made darker (window tint)."""
    gb, gi = cv2.cvtColor(base, cv2.COLOR_BGR2GRAY).astype(int), cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(int)
    changed = change_mask(base, img, thr=thr, min_area=60, grow=0, feather=0).astype(np.uint8)
    if darken_only:
        changed &= cv2.morphologyEx((gi < gb - 3).astype(np.uint8), cv2.MORPH_OPEN, disk(1))
    if colour_only:   # a painted caliper: only its colour, never the wheel spokes in front of it
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        col = ((hsv[..., 1] > 90) & (hsv[..., 2] > 45)).astype(np.uint8)
        changed &= cv2.dilate(cv2.morphologyEx(col, cv2.MORPH_OPEN, disk(1)), disk(1))
    allowed = np.ones((H, W), np.uint8)
    if paint is not None:
        if cover:
            cov = (changed & (gi < gb - 22) & (gi < 95) & paint).astype(np.uint8)
            cov = fill_holes(cv2.morphologyEx(cov, cv2.MORPH_CLOSE, disk(5)), 4000)
            allowed = 1 - (paint & (1 - cov))
        else:
            allowed = 1 - paint
        if fill_paint:   # wheels: each wheel face (the hull of a big change outside the paint) is never paint
            core = cv2.morphologyEx((changed & allowed).astype(np.uint8), cv2.MORPH_CLOSE, disk(9))
            n, lab, st, _ = cv2.connectedComponentsWithStats(core, 8)
            hulls = np.zeros((H, W), np.uint8)
            for i in range(1, n):
                if st[i, cv2.CC_STAT_AREA] >= 500 and (region[lab == i] > 0).any():
                    pts = cv2.findNonZero((lab == i).astype(np.uint8))
                    cv2.fillConvexPoly(hulls, cv2.convexHull(pts), 1)
            allowed = np.maximum(allowed, cv2.erode(hulls, disk(2)))
    # the changed regions (outside the paint) that touch the part's rough place: the part comes out whole even where
    # the 3D map is some way off, and changes elsewhere (Kling re-renders patches of the workshop) are left out
    hard = (changed * allowed).astype(np.uint8)
    hard = cv2.morphologyEx(hard, cv2.MORPH_CLOSE, disk(close))
    if fill:
        hard = fill_holes(hard, fill)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(hard, 8)
    touch = np.unique(lab[(region > 0) & (hard > 0)])
    keep = np.isin(lab, [i for i in touch if i and stats[i, cv2.CC_STAT_AREA] >= 60]).astype(np.uint8)
    # a region that sprawls far beyond the part is re-rendered background: keep only its part near the part
    keep &= cv2.dilate(region, disk(reach))
    a = cv2.GaussianBlur(cv2.dilate(keep, disk(2)).astype(np.float32), (0, 0), 1.5)
    a *= cv2.erode(allowed, disk(1))
    ys, xs = np.nonzero(a > 0.02)
    if len(xs) < 150:
        return None
    x0, x1, y0, y1 = max(0, xs.min() - 2), min(W, xs.max() + 3), max(0, ys.min() - 2), min(H, ys.max() + 3)
    save_webp(path, np.dstack([img[y0:y1, x0:x1], (a[y0:y1, x0:x1] * 255).astype(np.uint8)]), 86)
    return [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]


def wing_mask(base, wd_silver, region):
    """Where the factory wing was: what the wing delete changed in the silver photo (a silver wing against the dark
    workshop is a clean outline), near the wing's rough place, holes filled."""
    ch = change_mask(base, wd_silver, thr=16, min_area=60, grow=0, feather=0).astype(np.uint8)
    ch = cv2.morphologyEx(ch, cv2.MORPH_CLOSE, disk(5))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(ch, 8)
    touch = np.unique(lab[(region > 0) & (ch > 0)])
    m = np.isin(lab, [i for i in touch if i and stats[i, cv2.CC_STAT_AREA] >= 60]).astype(np.uint8)
    m &= cv2.dilate(region, disk(60))
    return cv2.dilate(fill_holes(m, 25000), disk(3))


def mask_layer(img, mask, path):
    a = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), 1.5)
    ys, xs = np.nonzero(a > 0.02)
    if len(xs) < 150:
        return None
    x0, x1, y0, y1 = max(0, xs.min() - 2), min(W, xs.max() + 3), max(0, ys.min() - 2), min(H, ys.max() + 3)
    save_webp(path, np.dstack([img[y0:y1, x0:x1], (a[y0:y1, x0:x1] * 255).astype(np.uint8)]), 86)
    return [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]


# ---------------------------------------------------------------- brand parts fitted to the car (config-jobs.py 'parts')
# Each Kling edit of a view with one part fitted becomes that part's layer, 'bp-<id>', cut to where the part goes:
#   exhausts    around the factory tip (and where the added tips of the 3D car sit), like the exhaust options
#   brakes      inside the wheels on the part's axle (front or rear, from where the view's camera sees each axle),
#               around the factory caliper and disc, leaving out the spokes in front (from the 3D part map)
#   engine bay  and the oil cooler: inside a box drawn per view around where the part sits (ENGINE_ROI)
FRONT_AXLE, REAR_AXLE = 1.31, -1.315          # the 3D car's axles (x, metres), wheel centres 0.33 m up, 0.755 m out
DISC_FRONT = {'endless-disc-racing-front', 'endless-disc-basic-slit-f'}
DISC_REAR = {'endless-disc-eslit-rear', 'endless-disc-basic-slit-r'}
# box (x0, y0, x1, y1) per engine view and part kind, in photo pixels, drawn round where the edits put each kind; the
# layer is what clearly changed inside it (significant()), as Kling re-renders the whole engine bay a little
ENGINE_ROI = {
    'eng-bay': {'turbo': (680, 380, 1340, 830), 'manifold': (600, 400, 1340, 860), 'heat': (620, 640, 1180, 940),
                'intake': (980, 300, 1500, 830), 'suction': (620, 260, 1320, 820), 'bov': (940, 420, 1250, 770),
                'ignition': (500, 280, 1060, 560)},
    'eng-detail': {'turbo': (800, 200, 1700, 900), 'manifold': (380, 330, 1460, 900), 'heat': (360, 460, 980, 900),
                   'intake': (380, 380, 1500, 850), 'suction': (380, 480, 1200, 820), 'bov': (380, 450, 1420, 780),
                   'ignition': (560, 300, 1250, 720)},
}
ENGINE_KIND = {'hks-gtiii-rs': 'turbo', 'tomei-arms-m7963': 'turbo', 'tomei-expreme-manifold': 'manifold', 'tomei-heat-protector': 'heat',
               'hks-racing-suction': 'intake', 'hks-super-power-flow': 'intake', 'hks-premium-suction': 'intake',
               'tomei-turbo-suction-hose': 'suction', 'hks-ssqv4': 'bov', 'tomei-bov': 'bov', 'hks-coil-pro': 'ignition'}
ENGINE_KIND.update({m['id']: 'turbo' for m in J.MORE if m['type'] == 'turbo'})
ENGINE_KIND.update({m['id']: 'icpipe' for m in J.MORE if m['type'] == 'icpipe'})
ENGINE_ROI['eng-bay']['icpipe'] = (600, 250, 1450, 860)
ENGINE_ROI['eng-detail']['icpipe'] = (250, 250, 1500, 920)
MORE_BY = {m['id']: m for m in J.MORE}
GOOD_WING_VIEWS = {'a135', 'a180', 'a225', 'exhaust', 'a045', 'a090', 'a270', 'a315', 'top'}   # where a GT wing edit sits on the boot (some retaken: config-jobs.py WING_RETAKE)
WHEEL_ELLIPSES = json.load(open(f'{J.C}/wheel-ellipses.json'))
OIL_ROI = {'a000': (1170, 720, 1310, 820)}   # the bumper's corner intake on the car's left
# inside the engine: the open head (eng-cams) and the cutaway (eng-block), where the parts in J.INSIDE_PARTS go
INSIDE_ROI = {'eng-cams': (380, 280, 1720, 980), 'eng-block': (440, 380, 1200, 940)}
ALIGN_TO = {'eng-cams': 'eng-head'}   # a base made by editing another view's photo, laid back onto it
# parts that look much like the factory ones (camshafts, springs, pistons, rods, the crank, gaskets) change too little for
# significant(): their layer is the edit inside the shape of where they sit. Shapes in photo pixels: ('band', end, end,
# half width, end radius) along a camshaft with its gears, or ('poly', points).
INSIDE_SHAPES = {
    'eng-cams': {'ex': ('band', (540, 505), (1255, 740), 60, 78), 'in': ('band', (770, 390), (1550, 615), 52, 72),
                 'head': ('poly', [(460, 670), (450, 600), (500, 430), (730, 350), (1600, 530), (1560, 700), (1250, 860), (900, 820)])},
    'eng-block': {'pistons': ('poly', [(705, 500), (775, 500), (780, 568), (985, 585), (985, 690), (745, 690), (705, 600)]),
                  'rods': ('poly', [(735, 600), (990, 640), (990, 770), (900, 800), (735, 720)]),
                  'crank': ('poly', [(500, 620), (640, 600), (760, 700), (940, 715), (955, 800), (880, 865), (700, 875), (560, 805), (500, 720)]),
                  'deck': ('poly', [(697, 452), (1125, 476), (980, 566), (697, 505)])},
}
INSIDE_SHAPE = {'hks-cam-ex': ['ex'], 'hks-cam-in-step2': ['in'], 'tomei-poncam-evo9': ['ex', 'in'], 'tomei-procam-evo9': ['ex', 'in'],
                'hks-valve-spring': ['head'], 'tomei-valve-spring': ['head'], 'tomei-ti-retainer': ['head'],
                'hks-forged-pistons': ['pistons'], 'tomei-forged-pistons': ['pistons'], 'hks-conrods': ['rods'], 'tomei-conrods': ['rods'],
                'tomei-billet-crank': ['crank'], 'tomei-stroker-kits': ['crank', 'rods', 'pistons'],
                'hks-head-gasket': ['deck'], 'tomei-head-gasket': ['deck']}


def inside_shape(v, names):
    m = np.zeros((H, W), np.uint8)
    for n in names:
        sh = INSIDE_SHAPES[v][n]
        if sh[0] == 'band':
            _, a, b, w, r = sh
            cv2.line(m, a, b, 1, 2 * w)
            cv2.circle(m, a, r, 1, -1)
            cv2.circle(m, b, r, 1, -1)
        else:
            cv2.fillPoly(m, [np.array(sh[1], np.int32)], 1)
    return m


def project(v, pts):
    """3D points (metres, the 3D car's frame) -> pixels in view v's photo, with the guide camera it was generated from."""
    g = GUIDES[v]
    pos, tgt = np.array(g['pos'], float), np.array(g['target'], float)
    fwd = (tgt - pos) / np.linalg.norm(tgt - pos)
    right = np.cross(fwd, [0, 1, 0]); right /= np.linalg.norm(right)
    up = np.cross(right, fwd)
    f = (H / 2) / np.tan(np.radians(g['fov']) / 2)
    out = []
    for p_ in pts:
        d = np.array(p_, float) - pos
        z = d @ fwd
        out.append((W / 2 + f * (d @ right) / z, H / 2 - f * (d @ up) / z) if z > 0.1 else (np.nan, np.nan))
    return out


def wheel_masks(v, ids):
    """Each wheel the photo shows (rim, tyre and brake in the 3D map), as 'front' or 'rear' by the nearest projected axle."""
    wheel = ids.part('stock', ['rim', 'tyre', 'caliper'], mirror=False)
    n, lab, st, cen = cv2.connectedComponentsWithStats(cv2.morphologyEx(wheel, cv2.MORPH_CLOSE, disk(7)), 8)
    axles = {'front': [(FRONT_AXLE, 0.33, z) for z in (0.755, -0.755)], 'rear': [(REAR_AXLE, 0.33, z) for z in (0.755, -0.755)]}
    pix = {k: [q for q in project(v, pts) if not np.isnan(q[0])] for k, pts in axles.items()}
    out = {'front': np.zeros((H, W), np.uint8), 'rear': np.zeros((H, W), np.uint8)}
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] < 400:
            continue
        cx, cy = cen[i]
        best = min(((np.hypot(cx - x, cy - y), k) for k, qs in pix.items() for x, y in qs), default=(0, None))[1]
        if best:
            out[best] |= (lab == i).astype(np.uint8)
    return out


def brake_region(ids, wheels, grow):
    """Inside the given wheels: around the factory caliper and disc, out to the rim, without the spokes in front."""
    rim = ids.part('stock', ['rim'], mirror=False)
    cal = ids.part('stock', ['caliper'], mirror=False)
    inside = np.zeros((H, W), np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats((rim | cal) & wheels, 8)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] >= 300:
            cv2.fillConvexPoly(inside, cv2.convexHull(cv2.findNonZero((lab == i).astype(np.uint8))), 1)
    inside = cv2.erode(inside, disk(5))
    return cv2.dilate(cal, disk(grow)) & inside & (1 - cv2.erode(rim, disk(1)))


def significant(base, img, thr=30, min_area=1500):
    """Where the edit clearly differs from the base: colour difference (Lab) of both blurred, big regions only. Keeps a
    new part whole and drops the slight re-rendering Kling does everywhere else."""
    lb = cv2.cvtColor(cv2.GaussianBlur(base, (0, 0), 3), cv2.COLOR_BGR2LAB).astype(np.float32)
    li = cv2.cvtColor(cv2.GaussianBlur(img, (0, 0), 3), cv2.COLOR_BGR2LAB).astype(np.float32)
    m = cv2.morphologyEx((np.sqrt(((lb - li) ** 2).sum(2)) > thr).astype(np.uint8), cv2.MORPH_OPEN, disk(3))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    m = np.isin(lab, [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= min_area]).astype(np.uint8)
    return fill_holes(cv2.morphologyEx(m, cv2.MORPH_CLOSE, disk(9)), 20000)


def box_mask(b):
    m = np.zeros((H, W), np.uint8)
    m[b[1]:b[3], b[0]:b[2]] = 1
    return m


def cut_more(v, t, base, img, path, get, have, ids, paint_px, paint3d):
    """A layer for a part from the second review (tools/parts_more.py), by type:
      wheel        inside all the wheels the 3D map shows (rim, tyre, brake), never the paint around them
      bonnet       the factory bonnet's place, its weave kept where it covers paint (like the carbon bonnet option)
      wing         what changed from the wing-delete photo the edit started from, around the boot (like the GT wing option)
      intercooler  what clearly changed below the headlights (the bumper's opening)
      interior     what clearly changed anywhere in the cabin view"""
    if t == 'wheel':
        # exactly the stock wheels and their floor reflections (assets/generated/config/wheel-ellipses.json)
        ells = WHEEL_ELLIPSES.get(v)
        if not ells:
            return None
        m = np.zeros((H, W), np.uint8)
        for cx, cy, w, h in ells:
            cv2.ellipse(m, ((cx, cy), (w * 1.01, h * 1.01), 0), 1, -1)
        return mask_layer(img, m, path)
    if t == 'bonnet':
        # exactly the bonnet: the outline of this view's carbon bonnet option layer (checked to sit on the bonnet)
        hc = manifest['views'].get(v, {}).get('layers', {}).get('hood-carbon')
        if not hc or not os.path.exists(f'{OUT}/{v}/hood-carbon.webp'):
            return None
        x, y, w, h = hc
        a = cv2.imread(f'{OUT}/{v}/hood-carbon.webp', cv2.IMREAD_UNCHANGED)[..., 3]
        m = np.zeros((H, W), np.uint8)
        m[y:y + h, x:x + w] = (cv2.resize(a, (w, h)) > 100).astype(np.uint8)
        # only what the edit turned to carbon (darker than the silver paint), never the silver it left: that would show
        # silver on every other paint
        gb, gi = cv2.cvtColor(base, cv2.COLOR_BGR2GRAY).astype(int), cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(int)
        carbon = cv2.morphologyEx(((gi < gb - 18) | (gi < 90)).astype(np.uint8), cv2.MORPH_CLOSE, disk(4))
        m &= fill_holes(carbon, 3000)
        return mask_layer(img, cv2.dilate(m, disk(1)), path)
    if t == 'wing' and v not in GOOD_WING_VIEWS:   # elsewhere Kling's wing floats off the boot: the page shows the GT wing option
        return None
    if t == 'wing' and ids is not None and have('wingdel-silver'):
        wd = get('wingdel-silver')
        r = ids.roi('stock', ['wing'], 30) | ids.roi('addA', ['gt'], 26)
        return layer(wd, img, r, path, paint=paint_px, reach=90, thr=9, close=7, fill=4000, cover=True) if r.any() else None
    if t == 'intercooler':
        sig = significant(base, img, 22, 300)
        if ids is not None:
            hl = ids.part('stock', ['headlight'], mirror=False)
            if hl.any():
                sig[:np.nonzero(hl)[0].max()] = 0
        return layer(base, img, cv2.dilate(sig, disk(3)), path, thr=6, reach=0, close=4, fill=1500)
    if t in ('seat', 'steering', 'gauge', 'harness'):
        r = cv2.dilate(significant(base, img, 26, 800), disk(4))
        return layer(base, img, r, path, thr=6, reach=0, close=5, fill=4000)
    return None


def build_brand_parts(v, base, get, have, entry, ids=None, paint_px=None, paint3d=None):
    for pid in J.BRAND_PARTS:
        name = f'bp-{pid}'
        if not have(name):
            continue
        img = get(name)
        path = f'{OUT}/{v}/{name}.webp'
        box = None
        if pid in J.EXHAUSTS and ids is not None:
            part = ids.part('stock', ['tip'], mirror=False)
            r = ids.roi('stock', ['tip'], 40) | ids.roi('addA', ['tip'], 30)
            r &= 1 - (paint3d & (1 - cv2.dilate(part, disk(5))))
            box = layer(base, img, r, path, paint=paint_px, cover=True)
        elif ids is not None and (pid in J.FRONT_KITS or pid in J.REAR_KITS or pid == 'hks-brake-system' or pid in DISC_FRONT | DISC_REAR):
            wm = wheel_masks(v, ids)
            axle = ('front' if pid in J.FRONT_KITS or pid in DISC_FRONT else 'rear' if pid in J.REAR_KITS or pid in DISC_REAR else 'both')
            wheels = wm['front'] | wm['rear'] if axle == 'both' else wm[axle]
            disc = pid in DISC_FRONT | DISC_REAR
            r = brake_region(ids, wheels, 12 if disc else 30)
            if r.any():
                box = layer(base, img, r, path, thr=14, reach=3, close=2)
        elif pid in ENGINE_KIND and v in ENGINE_ROI:
            r = cv2.dilate(significant(base, img), disk(4)) & box_mask(ENGINE_ROI[v][ENGINE_KIND[pid]])
            box = layer(base, img, r, path, thr=6, reach=0, close=5, fill=3000)
        elif pid in J.INSIDE_PARTS and v == J.INSIDE_PARTS[pid][0]:
            if pid in INSIDE_SHAPE:
                box = mask_layer(img, inside_shape(v, INSIDE_SHAPE[pid]), path)
            else:
                r = cv2.dilate(significant(base, img), disk(4)) & box_mask(INSIDE_ROI[v])
                box = layer(base, img, r, path, thr=6, reach=0, close=5, fill=3000)
        elif '--' in pid:   # a part fitted together with another (the harness on the BRIDE seat): what changed in the cabin
            box = cut_more(v, 'seat', base, img, path, get, have, ids, paint_px, paint3d)
        elif pid in MORE_BY and MORE_BY[pid]['type'] in ('wheel', 'bonnet', 'wing', 'intercooler', 'seat', 'steering', 'gauge', 'harness'):
            box = cut_more(v, MORE_BY[pid]['type'], base, img, path, get, have, ids, paint_px, paint3d)
        elif pid == 'hks-oil-cooler-black' and v in OIL_ROI:
            r = cv2.dilate(significant(base, img, 24, 300), disk(4)) & box_mask(OIL_ROI[v])
            box = layer(base, img, r, path, thr=6, reach=0, close=4, fill=1500)
        if box:
            entry['layers'][name] = box


HEAD_SCALE = W / ((J.HEAD_CROP[2] - J.HEAD_CROP[0]) * W / 2720)
HEAD_M = np.float32([[HEAD_SCALE, 0, -J.HEAD_CROP[0] * W / 2720 * HEAD_SCALE],
                     [0, HEAD_SCALE, -J.HEAD_CROP[1] * H / 1536 * HEAD_SCALE]])


def cut_layer(path_in, box, path_out, M):
    """A layer (RGBA WebP placed at box) moved by the affine M into a new view; its new box, or None if it leaves the frame."""
    lay = cv2.imread(path_in, cv2.IMREAD_UNCHANGED)
    x, y, w, h = box
    full = np.zeros((H, W, 4), np.uint8)
    full[y:y + h, x:x + w] = cv2.resize(lay, (w, h)) if lay.shape[:2] != (h, w) else lay
    out = cv2.warpAffine(full, M, (W, H), flags=cv2.INTER_LINEAR)
    ys, xs = np.nonzero(out[..., 3] > 5)
    if len(xs) < 150:
        return None
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    save_webp(path_out, out[y0:y1, x0:x1], 86)
    return [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]


def build_head():
    """eng-head: the cam cover close-up of eng-detail (HEAD_CROP), the page's zoom target before the cover comes off. Its
    silver photo is the base (the same crop from the full-size photo); the other paints and every layer are eng-detail's,
    cut to the crop, so the zoom is seamless whatever the build."""
    src = manifest['views'].get('eng-detail')
    if not src or not os.path.exists(J.base('eng-head')):
        return []
    v = 'eng-head'
    os.makedirs(f'{OUT}/{v}', exist_ok=True)
    entry = {'paints': list(src['paints']), 'layers': {}, 'kind': 'engine'}
    save_webp(f'{OUT}/{v}/paint-silver.webp', load(J.base(v)))
    for pid in src['paints'][1:]:
        im = cv2.imread(f'{OUT}/eng-detail/paint-{pid}.webp')
        save_webp(f'{OUT}/{v}/paint-{pid}.webp', cv2.warpAffine(im, HEAD_M, (W, H), flags=cv2.INTER_LANCZOS4))
    for name, box in src['layers'].items():
        b = cut_layer(f'{OUT}/eng-detail/{name}.webp', box, f'{OUT}/{v}/{name}.webp', HEAD_M)
        if b:
            entry['layers'][name] = b
    manifest['views'][v] = entry
    return [f'{len(entry["layers"])} layers cut from eng-detail']


def head_layers_outside(v, base, entry):
    """eng-cams shows the parts around the head that eng-head shows (the turbo, intakes, pipes): eng-head's layers that
    stay clear of what taking the cover off changed."""
    head = manifest['views'].get('eng-head')
    if not head:
        return
    opened = cv2.dilate(significant(load(J.base('eng-head')), base), disk(12))
    for name, (x, y, w, h) in head['layers'].items():
        if not name.startswith('bp-'):
            continue
        lay = cv2.imread(f'{OUT}/eng-head/{name}.webp', cv2.IMREAD_UNCHANGED)
        a = cv2.resize(lay, (w, h))[..., 3] > 128
        if a.sum() and (opened[y:y + h, x:x + w][a] > 0).mean() < 0.03:
            b = cut_layer(f'{OUT}/eng-head/{name}.webp', [x, y, w, h], f'{OUT}/{v}/{name}.webp', np.float32([[1, 0, 0], [0, 1, 0]]))
            if b:
                entry['layers'][name] = b


def build_view(v):
    if v == 'eng-head':
        return build_head()
    os.makedirs(f'{OUT}/{v}', exist_ok=True)
    base = load(J.base(v))
    if v in ALIGN_TO:
        base, _, worst = align(load(J.base(ALIGN_TO[v])), base)
    kind = 'exterior' if v in J.EXTERIOR else 'interior' if v in J.INTERIOR else 'engine'
    entry = {'paints': ['silver'], 'layers': {}, 'kind': kind}
    save_webp(f'{OUT}/{v}/paint-silver.webp', base)
    notes = [f'laid onto {ALIGN_TO[v]}, misfit {worst:.1f}px'] if v in ALIGN_TO else []
    have = lambda name: os.path.exists(J.src(f'{v}__{name}'))
    aligned = {}

    def get(name, onto=None):
        if name not in aligned:
            im, _, worst = align(onto if onto is not None else base, load(J.src(f'{v}__{name}')))
            aligned[name] = im
            if worst > 2.5:
                notes.append(f'{name} misfit {worst:.1f}px')
        return aligned[name]

    for pid in J.PAINTS:
        if have(f'paint-{pid}'):
            save_webp(f'{OUT}/{v}/paint-{pid}.webp', get(f'paint-{pid}'))
            entry['paints'].append(pid)
    if kind == 'interior':
        build_brand_parts(v, base, get, have, entry)
        manifest['views'][v] = entry
        return notes
    if kind == 'engine':
        if have('hood-carbon'):
            var = get('hood-carbon')
            darker = (cv2.cvtColor(var, cv2.COLOR_BGR2GRAY).astype(int) < cv2.cvtColor(base, cv2.COLOR_BGR2GRAY).astype(int) - 25).astype(np.uint8)
            darker = cv2.morphologyEx(darker, cv2.MORPH_CLOSE, disk(6))
            n, lab, st, _ = cv2.connectedComponentsWithStats(darker, 8)
            big = max([st[i, cv2.CC_STAT_AREA] for i in range(1, n)] or [0])
            region = np.isin(lab, [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] > 0.08 * big]).astype(np.uint8)
            box = layer(base, var, cv2.dilate(region, disk(6)), f'{OUT}/{v}/hood-carbon.webp')
            if box:
                entry['layers']['hood-carbon'] = box
        build_brand_parts(v, base, get, have, entry)
        if v == 'eng-cams':
            head_layers_outside(v, base, entry)
        manifest['views'][v] = entry
        return notes
    if not (have('plate') and have('paint-red') and os.path.exists(f'{IDDIR}/{v}-stock.png')):
        manifest['views'][v] = entry
        return notes + ['no plate or ids yet']
    plate = get('plate')
    save_webp(f'{OUT}/{v}/plate.webp', plate)
    photo_car = car_region(base, plate)
    paint_red = photo_paint(base, get('paint-red'), get('paint-gloss') if have('paint-gloss') else None)
    paint_px = paint_red | paint_everywhere(base, [get(f'paint-{p}') for p in J.PAINTS if have(f'paint-{p}')])
    clean_plate = photo_car.mean() < 0.5     # else the edit re-rendered most of the frame
    ids = Ids(v, photo_car, paint_red, clean_plate)
    notes.append(f'3D fit by {ids.how}: score {ids.score:.2f}')
    paint3d = ids.part('stock', ['paint'], mirror=False)
    if not clean_plate:                      # the car's outline then comes from the 3D car
        photo_car = cv2.dilate(((ids.maps['stock'] > 0) & (ids.maps['stock'] != 200)).astype(np.uint8), disk(4))
    # ride-height masks
    tyres = cv2.dilate(ids.part('stock', ['rim', 'tyre', 'caliper']), disk(3))
    floor3d = (ids.maps['stock'] >= 100).astype(np.uint8)
    car3d = ((ids.maps['stock'] > 0) & (ids.maps['stock'] < 100)).astype(np.uint8)
    # where the tyres meet the floor: the body (and anything hung under it, like a splitter) is everything above that
    # line, its reflection everything below. Splitting by the floor's own outline tore parts that hang over the floor.
    below = np.zeros((H, W), np.uint8)
    # each tyre's reflection starts where the tyre meets the floor (from dead ahead little tread shows, but its
    # reflection always does)
    n_, lab_, st_, _ = cv2.connectedComponentsWithStats((ids.maps['stock'] == ID['tyre'] + 100).astype(np.uint8), 8)
    pts = []
    for i in range(1, n_):
        if st_[i, cv2.CC_STAT_AREA] > 300:
            ys_, xs_ = np.nonzero(lab_ == i)
            top = ys_.min()
            pts.append((int(xs_[ys_ <= top + 3].mean()), int(top)))
    if len(pts) >= 2:
        pts.sort()
        line = np.interp(np.arange(W), [p_[0] for p_ in pts], [p_[1] for p_ in pts])
        below = (np.arange(H)[:, None] > line[None, :] - 2).astype(np.uint8)
    else:
        below = floor3d
    floor3d = floor3d & below
    body = photo_car & cv2.dilate(car3d, disk(10)) & (1 - tyres) & (1 - below)
    body |= photo_car & (1 - below) & (1 - tyres) & cv2.dilate(car3d, disk(40))
    refl3d = (ids.maps['stock'] > 100) & (ids.maps['stock'] < 200)
    refl = photo_car & cv2.dilate(refl3d.astype(np.uint8), disk(12)) & below & (1 - tyres)
    if v in J.ORBIT:
        for name, m in [('body', body), ('tyres', tyres), ('refl', refl), ('floor', floor3d | refl)]:
            save_mask(f'{OUT}/{v}/m-{name}.png', cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.0))
    # the body is only lowered where the 3D outline fits the photo well (around the car; the close-ups are framed
    # too differently)
    entry['masks'] = bool(v in J.ORBIT and clean_plate and (ids.how == 'landmarks' or ids.score >= 0.5))
    g = GUIDES[v]
    dist = float(np.linalg.norm(np.subtract(g['pos'], g['target'])))
    px_per_m = (H / 2) / np.tan(np.radians(g['fov']) / 2) / dist
    if entry['masks']:
        manifest['drops'][v] = {k: round(px_per_m * mm / 1000, 1) for k, mm in RIDE_MM.items()}

    def region_for(opt):
        for pre, (state, parts, grow) in ROI.items():
            if opt.startswith(pre):
                part = ids.part(state, parts, mirror=False)
                r = ids.roi(state, parts, grow)
                if opt.startswith('ex-') and not opt.startswith('ex-factory'):
                    part |= ids.part('stock', ['tip'], mirror=False)   # the factory tip goes when the layout changes
                    r |= ids.roi('stock', ['tip'], grow)
                if (opt.startswith('rim-') or opt.startswith('caliper-')) and ids.how != 'outline':
                    r |= cv2.dilate(part, disk(45))                   # a rougher 3D fit: reach further
                # paint around a part is only taken right next to it (re-rendered paint elsewhere is noise)
                return r & (1 - (paint3d & (1 - cv2.dilate(part, disk(5)))))
        return None

    opts = [o for o, (views, _) in J.OPTIONS.items() if v in views and o not in ('plate', 'matte')]
    for o in opts:
        r = region_for(o)
        if have(o) and r is not None and r.any():
            carbon = o.split('-')[0] in ('hood', 'roof', 'mirror', 'lip', 'skirts', 'diffuser', 'ex')
            wheel = o.startswith('rim-') or o.startswith('caliper-')
            rims = o.startswith('rim-')
            box = layer(base, get(o), r, f'{OUT}/{v}/{o}.webp', paint=paint_px, darken_only=o.startswith('tint-'),
                        cover=carbon, fill=2500 if rims else 0, fill_paint=rims, colour_only=o.startswith('caliper-'))
            if box:
                entry['layers'][o] = box
    if v in J.WING_VIEWS:
        r = ids.roi('stock', ['wing'], ROI['wingdel-'][2])
        wm = wing_mask(base, get('wingdel-silver'), r) if have('wingdel-silver') and r.any() else None
        for pid in ['silver'] + list(J.PAINTS):
            src_paint = base if pid == 'silver' else (aligned.get(f'paint-{pid}') if have(f'paint-{pid}') else None)
            if src_paint is not None and wm is not None and have(f'wingdel-{pid}'):
                wd_p = get(f'wingdel-{pid}', src_paint)
                own = change_mask(src_paint, wd_p, thr=16, min_area=60, grow=0, feather=0).astype(np.uint8)
                m = fill_holes(wm | (own & cv2.dilate(wm, disk(10))), 25000)
                box = mask_layer(wd_p, m, f'{OUT}/{v}/wingdel-{pid}.webp')
                if box:
                    entry['layers'][f'wingdel-{pid}'] = box
        if 'wingdel-silver' in aligned:
            wd = aligned['wingdel-silver']
            for o in J.WING_ADD:
                rr = region_for(o)
                if rr is not None:   # Kling mounts its wings where the factory wing stood
                    rr = rr | ids.roi('stock', ['wing'], 30)
                if have(o) and rr is not None and rr.any():
                    box = layer(wd, get(o, wd), rr, f'{OUT}/{v}/{o}.webp', paint=paint_px, reach=90, thr=9, close=7, fill=4000, cover=True)
                    if box:
                        entry['layers'][o] = box
    build_brand_parts(v, base, get, have, entry, ids, paint_px, paint3d)
    manifest['views'][v] = entry
    return notes


def build_clips():
    """The films (assets/generated/config/clips/): each one-step turn sped up to 1 s, forwards and backwards, and the
    fly-ins to 2.5 s; 1280x720 at 30 fps."""
    import subprocess
    src_dir, out_dir = f'{J.C}/clips', f'{OUT}/clips'
    os.makedirs(out_dir, exist_ok=True)
    names = []
    for f in sorted(os.listdir(src_dir)) if os.path.isdir(src_dir) else []:
        if not f.endswith('.mp4'):
            continue
        name = f[:-4]
        jobs = []
        if name.startswith('spin-'):
            _, a, b = name.split('-')
            jobs = [(f'spin-{a}-{b}', 'setpts=PTS/5'), (f'spin-{b}-{a}', 'reverse,setpts=PTS/5')]
        elif name.startswith('fly-'):
            jobs = [(name, 'setpts=PTS/2')]
        elif name.startswith('fit-') or name.startswith('open-'):
            jobs = [(name, 'setpts=PTS/1.6')]
        for out_name, speed in jobs:
            dst = f'{out_dir}/{out_name}.mp4'
            if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(f'{src_dir}/{f}'):
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{src_dir}/{f}', '-an', '-vf', f'{speed},fps=30,scale=1280:720:flags=lanczos',
                                '-c:v', 'libx264', '-crf', '23', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', dst], check=True)
            names.append(out_name)
    manifest['clips'] = names
    print(f'{len(names)} films')


views = sys.argv[1:] or [v for v in J.EXTERIOR + J.INTERIOR + J.ENGINE if os.path.exists(J.base(v))]
if views == ['clips']:
    views = []
if 'eng-detail' in views and 'eng-head' not in views:   # the close-up is cut from eng-detail, and eng-cams uses it
    views.insert(views.index('eng-detail') + 1, 'eng-head')
for later in ('eng-cams', 'eng-block'):
    if later in views:
        views.remove(later)
        views.append(later)
build_clips()
for v in views:
    notes = build_view(v)
    e = manifest['views'][v]
    print(f"{v}: {len(e['paints'])} paints, {len(e['layers'])} layers{', masks' if e.get('masks') else ''}. {'; '.join(notes)}", flush=True)
with open(f'{OUT}/manifest.js', 'w') as f:
    f.write('window.RZ_PHOTOS = ' + json.dumps(manifest, separators=(',', ':')) + ';\n')
print('wrote', f'{OUT}/manifest.js')
