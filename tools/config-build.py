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
            self.iou = float((p3 & (photo_paint_mask > 0)).sum() / max(1, (p3 | (photo_paint_mask > 0)).sum()))
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
            if best is None or iou > best[2]:
                best = (name, A, iou)
        self.how, self.A, self.iou = best
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


def layer(base, img, region, path, thr=16, paint=None, keep_paint=None, reach=40, close=4):
    """Save the changed part of img (aligned to base) inside region as a cropped RGBA WebP; return its box or None.
    Paint pixels are dropped (a layer is laid over every colour) unless keep_paint covers them, or the new pixel is
    dark carbon over bright paint."""
    allowed = np.ones((H, W), np.uint8)
    if paint is not None:
        dark_over_paint = (cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) < 70) & (cv2.cvtColor(base, cv2.COLOR_BGR2GRAY) > 95)
        allowed = 1 - (paint & ~dark_over_paint.astype(np.uint8) & (1 if keep_paint is None else 1 - keep_paint))
    # the changed regions (outside the paint) that touch the part's rough place: the part comes out whole even where
    # the 3D map is some way off, and changes elsewhere (Kling re-renders patches of the workshop) are left out
    hard = (change_mask(base, img, thr=thr, min_area=60, grow=0, feather=0) * allowed).astype(np.uint8)
    hard = cv2.morphologyEx(hard, cv2.MORPH_CLOSE, disk(close))
    if close > 4:   # fill holes (dark parts in front of a dark wall barely differ from it)
        ff = hard.copy()
        cv2.floodFill(ff, np.zeros((H + 2, W + 2), np.uint8), (0, 0), 1)
        hard |= (1 - ff)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(hard, 8)
    touch = np.unique(lab[(region > 0) & (hard > 0)])
    keep = np.isin(lab, [i for i in touch if i and stats[i, cv2.CC_STAT_AREA] >= 60]).astype(np.uint8)
    # a region that sprawls far beyond the part is re-rendered background: keep only its part near the part
    keep &= cv2.dilate(region, disk(reach))
    a = cv2.GaussianBlur(cv2.dilate(keep, disk(2)).astype(np.float32), (0, 0), 1.5) * allowed
    ys, xs = np.nonzero(a > 0.02)
    if len(xs) < 150:
        return None
    x0, x1, y0, y1 = max(0, xs.min() - 2), min(W, xs.max() + 3), max(0, ys.min() - 2), min(H, ys.max() + 3)
    save_webp(path, np.dstack([img[y0:y1, x0:x1], (a[y0:y1, x0:x1] * 255).astype(np.uint8)]), 86)
    return [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]


def build_view(v):
    os.makedirs(f'{OUT}/{v}', exist_ok=True)
    base = load(J.base(v))
    kind = 'exterior' if v in J.EXTERIOR else 'interior' if v in J.INTERIOR else 'engine'
    entry = {'paints': ['silver'], 'layers': {}, 'kind': kind}
    save_webp(f'{OUT}/{v}/paint-silver.webp', base)
    notes = []
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
        manifest['views'][v] = entry
        return notes
    if not (have('plate') and have('paint-red') and os.path.exists(f'{IDDIR}/{v}-stock.png')):
        manifest['views'][v] = entry
        return notes + ['no plate or ids yet']
    plate = get('plate')
    save_webp(f'{OUT}/{v}/plate.webp', plate)
    photo_car = car_region(base, plate)
    paint_px = photo_paint(base, get('paint-red'), get('paint-gloss') if have('paint-gloss') else None)
    clean_plate = photo_car.mean() < 0.5     # else the edit re-rendered most of the frame
    ids = Ids(v, photo_car, paint_px, clean_plate)
    notes.append(f'3D fit by {ids.how}: paint overlap {ids.iou:.2f}')
    paint3d = ids.part('stock', ['paint'], mirror=False)
    if not clean_plate:                      # the car's outline then comes from the 3D car
        photo_car = cv2.dilate(((ids.maps['stock'] > 0) & (ids.maps['stock'] != 200)).astype(np.uint8), disk(4))
    # ride-height masks
    tyres = cv2.dilate(ids.part('stock', ['rim', 'tyre', 'caliper']), disk(3))
    floor3d = (ids.maps['stock'] >= 100).astype(np.uint8)
    car3d = ((ids.maps['stock'] > 0) & (ids.maps['stock'] < 100)).astype(np.uint8)
    body = photo_car & cv2.dilate(car3d, disk(10)) & (1 - tyres) & (1 - (floor3d & (1 - cv2.dilate(car3d, disk(3)))))
    refl3d = (ids.maps['stock'] > 100) & (ids.maps['stock'] < 200)
    refl = photo_car & cv2.dilate(refl3d.astype(np.uint8), disk(12)) & (1 - body) & (1 - tyres)
    if v in J.ORBIT:
        for name, m in [('body', body), ('tyres', tyres), ('refl', refl), ('floor', floor3d | refl)]:
            save_mask(f'{OUT}/{v}/m-{name}.png', cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.0))
    # the body is only lowered where the 3D outline fits the photo well (around the car; the close-ups are framed
    # too differently)
    entry['masks'] = bool(v in J.ORBIT and clean_plate)
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
                # paint around a part is only taken right next to it (re-rendered paint elsewhere is noise)
                return r & (1 - (paint3d & (1 - cv2.dilate(part, disk(5)))))
        return None

    opts = [o for o, (views, _) in J.OPTIONS.items() if v in views and o not in ('plate', 'matte')]
    # options that replace paint keep the paint pixels of their own part
    PAINTED = {'hood-carbon': ['bonnet'], 'roof-carbon': ['roof'], 'mirror-carbon': ['mirrors'], 'lip-lip': ['lip'], 'lip-splitter': ['lip']}
    for o in opts:
        r = region_for(o)
        if have(o) and r is not None and r.any():
            kp = cv2.dilate(ids.part('stock', PAINTED[o], mirror=False), disk(4)) if o in PAINTED else None
            box = layer(base, get(o), r, f'{OUT}/{v}/{o}.webp', paint=paint_px, keep_paint=kp)
            if box:
                entry['layers'][o] = box
    if v in J.WING_VIEWS:
        r = ids.roi('stock', ['wing'], ROI['wingdel-'][2])
        for pid in ['silver'] + list(J.PAINTS):
            src_paint = base if pid == 'silver' else (aligned.get(f'paint-{pid}') if have(f'paint-{pid}') else None)
            if src_paint is not None and have(f'wingdel-{pid}') and r.any():
                box = layer(src_paint, get(f'wingdel-{pid}', src_paint), r, f'{OUT}/{v}/wingdel-{pid}.webp')
                if box:
                    entry['layers'][f'wingdel-{pid}'] = box
        if 'wingdel-silver' in aligned:
            wd = aligned['wingdel-silver']
            for o in J.WING_ADD:
                rr = region_for(o)
                if rr is not None:   # Kling mounts its wings where the factory wing stood
                    rr = rr | ids.roi('stock', ['wing'], 30)
                if have(o) and rr is not None and rr.any():
                    box = layer(wd, get(o, wd), rr, f'{OUT}/{v}/{o}.webp', paint=paint_px, reach=90, thr=9, close=7)
                    if box:
                        entry['layers'][o] = box
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
build_clips()
for v in views:
    notes = build_view(v)
    e = manifest['views'][v]
    print(f"{v}: {len(e['paints'])} paints, {len(e['layers'])} layers{', masks' if e.get('masks') else ''}. {'; '.join(notes)}", flush=True)
with open(f'{OUT}/manifest.js', 'w') as f:
    f.write('window.RZ_PHOTOS = ' + json.dumps(manifest, separators=(',', ':')) + ';\n')
print('wrote', f'{OUT}/manifest.js')
