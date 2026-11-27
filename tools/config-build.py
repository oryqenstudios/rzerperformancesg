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


def tps_fit(src, dst):
    """Thin-plate spline taking the points src to dst (n x 2 each), as a function on m x 2 arrays."""
    src, dst = np.asarray(src, float), np.asarray(dst, float)
    n = len(src)

    def U(r2):
        with np.errstate(divide='ignore', invalid='ignore'):
            u = r2 * np.log(r2)
        u[r2 == 0] = 0
        return u
    P = np.hstack([np.ones((n, 1)), src])
    L = np.zeros((n + 3, n + 3))
    L[:n, :n], L[:n, n:], L[n:, :n] = U(((src[:, None] - src[None]) ** 2).sum(2)), P, P.T
    Y = np.zeros((n + 3, 2))
    Y[:n] = dst
    Wt = np.linalg.solve(L, Y)
    return lambda q: U(((q[:, None] - src[None]) ** 2).sum(2)) @ Wt[:n] + np.hstack([np.ones((len(q), 1)), q]) @ Wt[n:]


def tps_warp(m, pts):
    """Lay the map m (guide coordinates) onto the photo by the points [guide x, guide y, photo x, photo y]: a spline
    from photo to guide at every pixel, then nearest-neighbour lookups."""
    pts = np.float32(pts)
    f = tps_fit(pts[:, 2:], pts[:, :2])
    mx, my = np.zeros((H, W), np.float32), np.zeros((H, W), np.float32)
    xs = np.arange(W, dtype=float)
    for y0 in range(0, H, 60):
        ys = np.arange(y0, min(H, y0 + 60), dtype=float)
        gx, gy = np.meshgrid(xs, ys)
        g = f(np.stack([gx.ravel(), gy.ravel()], 1))
        mx[y0:y0 + len(ys)], my[y0:y0 + len(ys)] = g[:, 0].reshape(gx.shape), g[:, 1].reshape(gx.shape)
    return cv2.remap(m, mx, my, cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT, borderValue=0)


def tps_map(m, lm):
    """A part-ID map laid onto a photo seen from a different angle than its guide: the car by its points, the floor
    and the car's reflection by theirs (the reflection moves differently from the car when the angle changes)."""
    car, refl = tps_warp(m, lm['car']), tps_warp(m, lm['refl'])
    out = np.where(refl >= 100, refl, 0).astype(m.dtype)
    return np.where((car > 0) & (car < 100), car, out).astype(m.dtype)


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
        if lm:   # hand-placed matching points (these photos' framing or perspective differs from their guides)
            if isinstance(lm, dict):   # many points: thin-plate splines, the car and its floor reflection each by its own
                self.warp = lambda m: tps_map(m, lm)
            else:                      # a few points: a homography
                pts = np.float32(lm)
                Hm, _ = cv2.findHomography(pts[:, :2], pts[:, 2:], 0)
                self.warp = lambda m: cv2.warpPerspective(m, Hm, (W, H), flags=cv2.INTER_NEAREST)
            self.raw = raw
            self.maps = {k: self.warp(m) for k, m in raw.items()}
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
        self.warp = lambda m: cv2.warpAffine(m, self.A, (W, H), flags=cv2.INTER_NEAREST | cv2.WARP_INVERSE_MAP)
        self.raw = raw
        self.maps = {k: self.warp(m) for k, m in raw.items()}

    def factory_tip(self, v):
        """Where the factory exhaust tip is: the 3D car's own tip doesn't show in its renders, so of the twin tips fitted
        in the add-on render, the one on the car's right (and its reflection), as (tip, tip and reflection)."""
        out = []
        for idv, y in ((ID['tip'], 0.3), (ID['tip'] + 100, -0.3)):
            raw = (self.raw['addA'] == idv).astype(np.uint8)
            n, lab, st, cen = cv2.connectedComponentsWithStats(cv2.dilate(raw, disk(4)), 8)
            right, left = project(v, [(-2.2, y, 0.55), (-2.2, y, -0.55)])
            comps = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= 60]
            keep = [i for i in comps if np.hypot(*(cen[i] - right)) < np.hypot(*(cen[i] - left))]
            out.append(self.warp(((np.isin(lab, keep)) & (raw > 0)).astype(np.uint8)) if keep else np.zeros((H, W), np.uint8))
        return out[0], out[0] | out[1]

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
    """Where the factory wing was: what the wing delete clearly changed in the silver photo (a silver wing against the
    dark workshop is a clean outline), near the wing's rough place, small holes filled. Only clear changes count: Kling
    redraws the wall round the wing a little lighter, which would show as grey haze on the other paints."""
    a = cv2.GaussianBlur(base, (0, 0), 1.0).astype(np.int16)
    b = cv2.GaussianBlur(wd_silver, (0, 0), 1.0).astype(np.int16)
    ch = (np.abs(a - b).max(2) > 30).astype(np.uint8) & cv2.dilate(region, disk(40))
    ch = cv2.morphologyEx(ch, cv2.MORPH_OPEN, disk(1))
    ch = cv2.morphologyEx(ch, cv2.MORPH_CLOSE, disk(4))
    n, lab, st, _ = cv2.connectedComponentsWithStats(ch, 8)
    big = max([st[i, cv2.CC_STAT_AREA] for i in range(1, n)] or [0])
    m = np.isin(lab, [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= max(150, 0.03 * big)]).astype(np.uint8)
    return cv2.dilate(fill_holes(m, 6000), disk(3))


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
#   brakes      inside the wheels on the part's axle, through the stock wheel's gaps (brake_layer)
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
IC_BOX = {'a000': (760, 725, 1140, 815), 'a045': (1310, 685, 1560, 792), 'a315': (330, 715, 482, 792), 'headlight': (1260, 730, 1570, 812)}
GOOD_WING_VIEWS = {'a135', 'a180', 'a225', 'exhaust', 'a045', 'a090', 'a270', 'a315', 'top'}   # where a GT wing edit sits on the boot (some retaken: config-jobs.py WING_RETAKE)
WHEEL_ELLIPSES = json.load(open(f'{J.C}/wheel-ellipses.json'))
OIL_ROI = {'a000': (1170, 720, 1310, 820)}   # the bumper's corner intake on the car's left
# inside the engine: the open head (eng-cams) and the cutaway (eng-block), where the parts in J.INSIDE_PARTS go
INSIDE_ROI = {'eng-cams': (600, 380, 1450, 760), 'eng-block': (440, 380, 1200, 940)}
ALIGN_TO = {'eng-cams': 'eng-head'}   # a base made by editing another view's photo, laid back onto it
# parts that look much like the factory ones (camshafts, springs, pistons, rods, the crank, gaskets) change too little for
# significant(): their layer is the edit inside the shape of where they sit. Shapes in photo pixels: ('band', end, end,
# half width, end radius) along a camshaft with its gears, or ('poly', points).
INSIDE_SHAPES = {
    'eng-cams': {'ex': ('band', (710, 530), (1150, 660), 36, 58), 'in': ('band', (840, 455), (1340, 580), 32, 52),
                 'head': ('poly', [(650, 580), (660, 500), (830, 430), (1370, 530), (1400, 610), (1260, 700), (1060, 720), (800, 680)])},
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
    # in the guide's own pixels (where the camera projection holds), then laid onto the photo like the rest of the map
    wheel = np.isin(ids.raw['stock'], [ID['rim'], ID['tyre'], ID['caliper']]).astype(np.uint8)
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
    return {k: ids.warp(m) for k, m in out.items()}


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


def brake_layer(v, base, img, ids, axle, disc, path):
    """A brake kit or disc seen through the stock wheel. Kling often redraws the wheel round a new brake (spokes thinned
    or gone, a bare disc), so the edit is only used inside each wheel on the part's axle (its hand-measured tyre
    ellipse, cut to the rim) and only where the stock photo is dark between the spokes: the wheel stays exactly as it
    is in front, and the new brake shows through its gaps. A kit's caliper is kept to where the factory caliper is in
    the 3D map (one caliper per wheel; Kling sometimes draws a second one on the far side of the disc)."""
    wm = wheel_masks(v, ids)
    cal3 = ids.part('stock', ['caliper'], mirror=False)
    lum = cv2.GaussianBlur(cv2.cvtColor(base, cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 0.8)
    gaps = np.clip((58 - lum) / 30, 0, 1)
    a = np.zeros((H, W), np.float32)
    for cx, cy, w, h in WHEEL_ELLIPSES[v][:2]:
        tyre = np.zeros((H, W), np.uint8)
        cv2.ellipse(tyre, (cx, cy), (w // 2, h // 2), 0, 0, 360, 1, -1)
        f, r = int((wm['front'] & tyre).sum()), int((wm['rear'] & tyre).sum())
        if f + r == 0 or (axle != 'both' and ('front' if f > r else 'rear') != axle):
            continue
        inner = np.zeros((H, W), np.float32)
        cv2.ellipse(inner, (cx, cy), (int(w * 0.36), int(h * 0.36)), 0, 0, 360, 1, -1)
        m = cv2.GaussianBlur(inner, (0, 0), 1.5)
        c = cal3 & tyre
        if not disc and c.sum() >= 30:   # (from some angles the factory caliper is hidden behind the spokes in the 3D map)
            m *= cv2.GaussianBlur(cv2.dilate(c, disk(int(0.3 * w))).astype(np.float32), (0, 0), 6)
        a = np.maximum(a, m)
    a *= gaps
    ys, xs = np.nonzero(a > 0.02)
    if len(xs) < 150:
        return None
    x0, x1, y0, y1 = max(0, xs.min() - 2), min(W, xs.max() + 3), max(0, ys.min() - 2), min(H, ys.max() + 3)
    save_webp(path, np.dstack([img[y0:y1, x0:x1], (a[y0:y1, x0:x1] * 255).astype(np.uint8)]), 86)
    return [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]


def rim_layer(v, base, img, path):
    """A rim colour: inside each wheel and its floor reflection (the hand-measured tyre ellipses, inside the tyre's
    rubber), what the edit changed. The 3D map's rims reach into the arches where its fit is rough, and the paint test
    misses the silver reflections there, so the layers carried silver patches of the body onto other colours."""
    m = np.zeros((H, W), np.float32)
    for cx, cy, w, h in WHEEL_ELLIPSES[v]:
        cv2.ellipse(m, ((cx, cy), (w * 0.86, h * 0.86), 0), 1, -1)
    m = cv2.GaussianBlur(m, (0, 0), 1.5)
    d = np.abs(cv2.GaussianBlur(img, (0, 0), 1.0).astype(np.int16) - cv2.GaussianBlur(base, (0, 0), 1.0).astype(np.int16)).max(2)
    c = cv2.GaussianBlur(cv2.dilate(np.clip((d.astype(np.float32) - 10) / 18, 0, 1), disk(1)), (0, 0), 0.8)
    return mask_layer(img, m * c, path)


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


def wing_matte(wd, img, region, path):
    """A wing laid on the no-wing photo wd: a soft matte from how much each pixel changed (so the dark carbon blade
    against the dark wall comes through whole), never the silver paint the edit redrew around it (a wing is dark, so
    bright pixels that changed only a little are paint and would show as grey haze on other colours), near the boot."""
    a = cv2.GaussianBlur(img, (0, 0), 1.0).astype(np.float32)
    b = cv2.GaussianBlur(wd, (0, 0), 1.0).astype(np.float32)
    d = np.abs(a - b).max(2)
    # a carbon wing is darker than the wall or boot it covers; Kling's redrawn wall is lighter haze: keep what got
    # darker, plus strong changes (highlights on the blade)
    darker = cv2.cvtColor(b.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32) - cv2.cvtColor(a.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)
    alpha = np.maximum(np.clip((darker - 6) / 20, 0, 1), (d > 50).astype(np.float32))
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    alpha[(gray > 105) & (d < 60)] = 0
    alpha *= region.astype(np.float32)
    core = (alpha > 0.35).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(cv2.morphologyEx(core, cv2.MORPH_CLOSE, disk(4)), 8)
    big = max([st[i, cv2.CC_STAT_AREA] for i in range(1, n)] or [0])
    keep = np.isin(lab, [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= max(400, 0.04 * big)]).astype(np.uint8)
    keep = fill_holes(cv2.morphologyEx(keep, cv2.MORPH_CLOSE, disk(3)), 1500)
    alpha = np.maximum(alpha, keep * 0.0) * cv2.dilate(keep, disk(3)).astype(np.float32)
    alpha = np.where(keep > 0, np.maximum(alpha, 0.92), alpha)
    alpha = cv2.GaussianBlur(alpha, (0, 0), 0.8)
    ys, xs = np.nonzero(alpha > 0.03)
    if len(xs) < 150:
        return None
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    save_webp(path, np.dstack([img[y0:y1, x0:x1], (alpha[y0:y1, x0:x1] * 255).astype(np.uint8)]), 86)
    return [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]


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
        hc = (CURRENT.get('layers') or {}).get('hood-carbon')   # this build's own carbon bonnet layer
        if not hc or not os.path.exists(f'{OUT}/{v}/hood-carbon.webp'):
            return None
        x, y, w, h = hc
        a = cv2.imread(f'{OUT}/{v}/hood-carbon.webp', cv2.IMREAD_UNCHANGED)[..., 3]
        m = np.zeros((H, W), np.uint8)
        m[y:y + h, x:x + w] = (cv2.resize(a, (w, h)) > 100).astype(np.uint8)
        if ids is not None:   # never the front wings (Kling made some carbon too); gaps in the outline filled from the 3D bonnet
            b3 = ids.part('stock', ['bonnet'], mirror=False)
            m = fill_holes(cv2.morphologyEx(m | b3, cv2.MORPH_CLOSE, disk(6)), 40000) & cv2.dilate(b3, disk(12))
        # only what the edit turned to carbon, never the silver it left (that would show silver on every other paint):
        # darker than the silver paint, or with the weave's fine texture where the carbon catches a bright reflection
        gb, gi = cv2.cvtColor(base, cv2.COLOR_BGR2GRAY).astype(np.float32), cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
        hp_i = cv2.blur(np.abs(gi - cv2.GaussianBlur(gi, (0, 0), 1.5)), (9, 9))
        hp_b = cv2.blur(np.abs(gb - cv2.GaussianBlur(gb, (0, 0), 1.5)), (9, 9))
        weave = (hp_i > hp_b + 2.5) & (hp_i > 4)
        carbon = cv2.morphologyEx(((gi < gb - 18) | (gi < 90) | weave).astype(np.uint8), cv2.MORPH_CLOSE, disk(4))
        m &= fill_holes(carbon, 6000)
        return mask_layer(img, cv2.dilate(m, disk(1)), path)
    if t == 'wing' and v not in GOOD_WING_VIEWS:   # elsewhere Kling's wing floats off the boot: the page shows the GT wing option
        return None
    if t == 'wing' and ids is not None and have('wingdel-silver'):
        # what the edit added to the no-wing photo, near the boot (the wing's stands sit on it; the blade stands above)
        wd = get('wingdel-silver')
        near = cv2.dilate(ids.part('stock', ['wing'], mirror=False) | ids.part('addA', ['gt'], mirror=False), disk(160))
        return wing_matte(wd, img, near, path)
    if t == 'intercooler':   # only the bumper's central opening (Kling also filled the corner intakes and fog lamps)
        if v not in IC_BOX:
            return None
        sig = significant(base, img, 18, 200) & box_mask(IC_BOX[v])
        return layer(base, img, cv2.dilate(sig, disk(3)) & box_mask(IC_BOX[v]), path, thr=6, reach=0, close=4, fill=1500)
    if t in ('seat', 'steering', 'gauge', 'harness'):
        r = cv2.dilate(significant(base, img, 26, 800), disk(4))
        return layer(base, img, r, path, thr=6, reach=0, close=5, fill=4000)
    return None


CURRENT = {}   # the view entry being built (the bonnet parts use its carbon bonnet layer)


def build_brand_parts(v, base, get, have, entry, ids=None, paint_px=None, paint3d=None):
    CURRENT.clear()
    CURRENT.update(entry)
    for pid in J.BRAND_PARTS:
        name = f'bp-{pid}'
        if not have(name):
            continue
        img = get(name)
        if get.misfit.get(name, 0) > 12:   # Kling moved the camera: the part would sit in the wrong place
            print(f'  {v} {name} skipped: misaligned by {get.misfit[name]:.0f}px')
            continue
        path = f'{OUT}/{v}/{name}.webp'
        box = None
        if pid in J.EXHAUSTS and ids is not None:
            # every one of these exhausts has a single tip where the factory one is: never the twin-tip positions
            # (a second tip Kling sometimes adds on the left of the bumper would not be the real part)
            part, both = ids.factory_tip(v)
            r = cv2.dilate(part, disk(40)) | cv2.dilate(both, disk(5))
            r &= 1 - (paint3d & (1 - cv2.dilate(part, disk(5))))
            box = layer(base, img, r, path, paint=paint_px, cover=True)
        elif ids is not None and (pid in J.FRONT_KITS or pid in J.REAR_KITS or pid == 'hks-brake-system' or pid in DISC_FRONT | DISC_REAR):
            axle = ('front' if pid in J.FRONT_KITS or pid in DISC_FRONT else 'rear' if pid in J.REAR_KITS or pid in DISC_REAR else 'both')
            box = brake_layer(v, base, img, ids, axle, pid in DISC_FRONT | DISC_REAR, path)
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


def structure_score(a, b):
    """How well two photos line up, 0..1: the correlation of their (blurred) edge maps, colour-blind."""
    def grad(im):
        g = cv2.GaussianBlur(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 2)
        return np.hypot(cv2.Sobel(g, cv2.CV_32F, 1, 0), cv2.Sobel(g, cv2.CV_32F, 0, 1)).ravel()
    A, B = grad(a), grad(b)
    A -= A.mean(); B -= B.mean()
    return float((A * B).sum() / np.sqrt((A * A).sum() * (B * B).sum()))


def only_changed(v, base, entry):
    """Every part layer keeps only what its edit changed: a pixel the edit left alone is the silver photo, and on any other
    paint the right pixel there is that paint's own photo (else silver shows as grey haze round the part). Wings are cut
    against the no-wing photo already, so they are left as they are."""
    for name, (x, y, w, h) in list(entry['layers'].items()):
        if not name.startswith('bp-') or MORE_BY.get(name[3:], {}).get('type') == 'wing':
            continue
        path = f'{OUT}/{v}/{name}.webp'
        lay = cv2.imread(path, cv2.IMREAD_UNCHANGED)
        if lay is None or lay.ndim < 3 or lay.shape[2] < 4:
            continue
        if lay.shape[:2] != (h, w):
            lay = cv2.resize(lay, (w, h))
        b = base[y:y + h, x:x + w]
        d = np.abs(cv2.GaussianBlur(lay[..., :3], (0, 0), 1.0).astype(np.int16) - cv2.GaussianBlur(b, (0, 0), 1.0).astype(np.int16)).max(2)
        c = np.clip((d.astype(np.float32) - 8) / 16, 0, 1)
        c = cv2.GaussianBlur(cv2.dilate(c, disk(1)), (0, 0), 0.8)
        lay[..., 3] = (lay[..., 3].astype(np.float32) * c).astype(np.uint8)
        save_webp(path, lay, 86)


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
    sane_cache = {}

    def sane(name):
        """An edit is only used if it keeps the photo's structure (its edges line up with the base): Kling sometimes
        answers a repaint with a different car, whose layers would float off the photo."""
        if name not in sane_cache:
            sc = structure_score(base, load(J.src(f'{v}__{name}')))
            sane_cache[name] = sc >= 0.3
            if sc < 0.3:
                notes.append(f'{name} REJECTED (structure {sc:.2f})')
        return sane_cache[name]
    # only repaints are checked: the empty-garage plate, the wing delete and the parts change the picture by design
    have = lambda name: os.path.exists(J.src(f'{v}__{name}')) and (not name.startswith('paint-') or sane(name))
    aligned = {}
    get_misfit = {}

    def get(name, onto=None):
        if name not in aligned:
            im, _, worst = align(onto if onto is not None else base, load(J.src(f'{v}__{name}')))
            aligned[name] = im
            get.misfit[name] = worst
            if worst > 2.5:
                notes.append(f'{name} misfit {worst:.1f}px')
        return aligned[name]
    get.misfit = get_misfit

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
        only_changed(v, base, entry)
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
            if rims and v in WHEEL_ELLIPSES:   # the rim colours: what changed inside the wheels, never the paint round them
                box = rim_layer(v, base, get(o), f'{OUT}/{v}/{o}.webp')
                if box:
                    entry['layers'][o] = box
                continue
            # a carbon panel stops at its shut lines: Kling often turned the panels next to it carbon too (the front
            # wings beside the bonnet), joined to it, so only a little reach past the panel's place in the 3D map
            panel = o in ('hood-carbon', 'roof-carbon', 'mirror-carbon')
            box = layer(base, get(o), r, f'{OUT}/{v}/{o}.webp', paint=paint_px, darken_only=o.startswith('tint-'),
                        cover=carbon, fill=2500 if rims else 0, fill_paint=rims, colour_only=o.startswith('caliper-'),
                        reach=12 if panel else 40)
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
                m = fill_holes(wm | (own & cv2.dilate(wm, disk(3))), 3000)
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
                    box = wing_matte(wd, get(o, wd), cv2.dilate(rr, disk(60)), f'{OUT}/{v}/{o}.webp')
                    if box:
                        entry['layers'][o] = box
    build_brand_parts(v, base, get, have, entry, ids, paint_px, paint3d)
    only_changed(v, base, entry)
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
