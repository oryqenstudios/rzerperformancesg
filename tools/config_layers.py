"""Shared helpers for the photo configurator's layers (tools/config-build.py uses them).

Every option is a Higgsfield edit of one base photo ("change only X"). Kling keeps the car where it was to within a
pixel or so after a small global shift, so each edit is aligned back onto its base with ECC (an affine fit on the whole
blurred frame), and the part of it that changed becomes a layer: the edited pixels where the difference is clear,
cleaned up, grown a little and feathered, so the layer can be laid over any paint colour of the same view.
"""
import cv2
import numpy as np

W, H = 1920, 1080


def load(path):
    """Any image, as 1920x1080 BGR."""
    im = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if im is None:
        raise FileNotFoundError(path)
    return cv2.resize(im, (W, H), interpolation=cv2.INTER_AREA) if im.shape[:2] != (H, W) else im


def grey(im, blur=2.0):
    return cv2.GaussianBlur(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), blur)


def align(base, im, mask=None):
    """Warp im onto base (affine, ECC at half size). Returns (aligned, matrix, residual): residual is the worst local
    misfit left, in pixels, measured by phase correlation on tiles across the frame."""
    a, b = cv2.resize(grey(base), (W // 2, H // 2)), cv2.resize(grey(im), (W // 2, H // 2))
    m = None if mask is None else cv2.resize(mask.astype(np.uint8), (W // 2, H // 2), interpolation=cv2.INTER_NEAREST)
    A = np.eye(2, 3, dtype=np.float32)
    # translation first, then affine from there; an edit that changed too much to fit (ECC gives up) keeps the last fit
    for motion in (cv2.MOTION_TRANSLATION, cv2.MOTION_AFFINE):
        try:
            _, A = cv2.findTransformECC(a, b, A.copy(), motion, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-7), m, 5)
        except cv2.error:
            pass
    A[:, 2] *= 2
    out = cv2.warpAffine(im, A, (W, H), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    ga, gb = grey(base), grey(out)
    worst = 0.0
    for y in range(140, H - 260, 200):
        for x in range(160, W - 260, 220):
            (dx, dy), r = cv2.phaseCorrelate(ga[y:y + 128, x:x + 128], gb[y:y + 128, x:x + 128])
            if r > 0.3:
                worst = max(worst, float(np.hypot(dx, dy)))
    return out, A, worst


def change_mask(base, im, thr=22, min_area=400, grow=3, feather=2.0, region=None):
    """Alpha (0..1 float) of where im differs clearly from base (both aligned BGR)."""
    d = np.abs(cv2.GaussianBlur(base.astype(np.float32), (0, 0), 1.5) - cv2.GaussianBlur(im.astype(np.float32), (0, 0), 1.5)).max(2)
    m = (d > thr).astype(np.uint8)
    if region is not None:
        m &= region.astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m, 8)
    keep = np.zeros_like(m)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] >= min_area:
            keep[lab == i] = 1
    if grow:
        keep = cv2.dilate(keep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * grow + 1, 2 * grow + 1)))
    a = keep.astype(np.float32)
    return np.clip(cv2.GaussianBlur(a, (0, 0), feather), 0, 1) if feather else a


def preview(base, im, alpha):
    """Base with the changed region tinted, for checking a mask by eye."""
    tint = base.copy()
    tint[..., 2] = np.clip(tint[..., 2] * 0.5 + 128 * alpha, 0, 255)
    return np.hstack([cv2.resize(tint, (960, 540)), cv2.resize(im, (960, 540))])
