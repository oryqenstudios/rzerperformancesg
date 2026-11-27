"""Wheel layers from the wheels' real product photos (assets/site/parts/<id>.webp), so every spoke is the real one.

The stock tyres stay: each wheel of a view (assets/generated/config/wheel-ellipses.json, the tyre's outline, then its
floor reflection) gets the product photo's rim inside it, at the real proportion of an 18-inch rim in a 255/35R18 tyre
(the rim is 72% of the tyre's outer diameter). The photo's own outline (an ellipse fitted to its cut-out) is mapped
onto the rim's ellipse, its brightness matched to the stock rim it covers, a soft dark ring drawn where the tyre's
bead meets the rim, and the reflection is the same rim flipped, dimmed and softened like the floor's other reflections."""
import json
import os

import cv2
import numpy as np

RIM = 0.72


def _rim_ellipse(cut_rgba):
    a = cut_rgba[..., 3]
    cs, _ = cv2.findContours((a > 128).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cs, key=cv2.contourArea)
    return cv2.fitEllipse(cv2.convexHull(c))


def _place(cut, src_ell, dst_c, dst_ax, H, W):
    """Affine that takes the cut-out's ellipse onto an upright ellipse at dst_c with axes dst_ax."""
    (sx, sy), (sa, sb), sang = src_ell
    # undo the source ellipse's rotation, scale its axes to the target's, move to the target centre
    t = np.deg2rad(sang)
    R = np.array([[np.cos(t), -np.sin(t)], [np.sin(t), np.cos(t)]])
    S = np.diag([dst_ax[0] / sa, dst_ax[1] / sb])
    M2 = S @ R.T
    off = np.array(dst_c) - M2 @ np.array([sx, sy])
    M = np.hstack([M2, off[:, None]]).astype(np.float32)
    return cv2.warpAffine(cut, M, (W, H), flags=cv2.INTER_LANCZOS4, borderValue=(0, 0, 0, 0))


def wheel_layer(pid, view, base, parts_dir, ells_path, H=1080, W=1920):
    ells = json.load(open(ells_path)).get(view)
    path = os.path.join(parts_dir, pid + '.webp')
    if not ells or not os.path.exists(path):
        return None
    cut = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if cut.shape[2] == 3:
        return None
    src = _rim_ellipse(cut)
    out = np.zeros((H, W, 4), np.float32)
    n = len(ells) // 2   # the wheels first, then their reflections in the same order
    gray = cv2.cvtColor(base, cv2.COLOR_BGR2GRAY).astype(np.float32)
    for k, (cx, cy, w, h) in enumerate(ells):
        refl = k >= n
        ax = (w * RIM, h * RIM)
        lay = _place(cut, src, (cx, cy), ax, H, W).astype(np.float32)
        if refl:   # mirrored about its own centre, like a reflection in the floor
            ys, xs = np.nonzero(lay[..., 3] > 0)
            if len(ys):
                y0, y1 = ys.min(), ys.max()
                lay[y0:y1 + 1] = lay[y0:y1 + 1][::-1]
        a = lay[..., 3:] / 255.0
        rim = np.zeros((H, W), np.uint8)
        cv2.ellipse(rim, ((cx, cy), ax, 0), 1, -1)
        # brightness like the stock rim it covers (the photo was lit in a studio)
        if rim.any() and a.sum() > 0:
            stock = gray[rim > 0].mean()
            mine = (cv2.cvtColor(lay[..., :3].astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)[(a[..., 0] > 0.5)]).mean()
            gain = np.clip(stock / max(mine, 1), 0.55, 1.25)
            lay[..., :3] *= gain
        if refl:
            lay[..., :3] *= 0.55
            lay = cv2.GaussianBlur(lay, (0, 0), 1.6)
            a = lay[..., 3:] / 255.0 * 0.85
        else:
            a = lay[..., 3:] / 255.0
        # the tyre's bead: a soft dark ring just outside the rim
        ring = np.zeros((H, W), np.uint8)
        cv2.ellipse(ring, ((cx, cy), (ax[0] * 1.05, ax[1] * 1.05), 0), 1, -1)
        ring = cv2.GaussianBlur((ring & (1 - rim)).astype(np.float32), (0, 0), 2)[..., None] * (0.5 if refl else 0.8)
        dark = np.zeros_like(lay)
        dark[..., 3:] = ring
        a_tot = a + ring * (1 - a)
        rgb = (lay[..., :3] * a + dark[..., :3] * ring * (1 - a)) / np.maximum(a_tot, 1e-6)
        new_a = a_tot + out[..., 3:] * (1 - a_tot)
        out[..., :3] = (rgb * a_tot + out[..., :3] * out[..., 3:] * (1 - a_tot)) / np.maximum(new_a, 1e-6)
        out[..., 3:] = new_a
    out[..., 3:] *= 255
    res = np.clip(out, 0, 255).astype(np.uint8)
    ys, xs = np.nonzero(res[..., 3] > 3)
    if not len(xs):
        return None
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    return res, [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]
