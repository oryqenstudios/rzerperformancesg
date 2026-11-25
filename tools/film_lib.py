"""Shared pieces for the hero films built from Kling clips over a fixed background plate
(tools/finish-swarm-film.py; tools/finish-roll-film.py has its own copy).

  frames(path)                  a clip's frames, 1920x1080 BGR
  steady(fr, ref, bg)           each frame aligned onto ref by an affine ECC fit on the background mask bg (half size)
  tone(f, ref)                  a frame with its slow tone drift against ref taken out
  movers(fr, plate)             per frame, where something moves in front of the plate (half-size masks)
  over(f, m, plate, zone)       a frame laid over the plate: the clip where it moves or inside zone
  Retimed(fr, masks)            a clip sampled at any fraction of its length, in-betweens made by optical flow
"""
import subprocess

import cv2
import numpy as np

W, H = 1920, 1080


def frames(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'scale={W}:{H}:flags=lanczos,setsar=1', '-f', 'rawvideo',
                          '-pix_fmt', 'bgr24', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)


def warp(f, M, size=(W, H)):
    """f warped by M (an affine fit made at half size)."""
    M = np.asarray(M, np.float64).copy()
    M[:, 2] *= 2
    return cv2.warpAffine(f, M.astype(np.float32), size, flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)


def _grey(im):
    return cv2.GaussianBlur(cv2.cvtColor(cv2.resize(im, (W // 2, H // 2)), cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 1.5)


def steady(fr, ref_img, bg):
    """Each frame aligned onto ref_img by an affine ECC fit on the background bg (half size); fits that stray are
    rejected and the rest smoothed over 7 frames (Kling's clips sit a few pixels off their key frames and drift)."""
    ref = _grey(ref_img)
    good = np.eye(2, 3, dtype=np.float32)
    fits = []
    for f in fr:
        M = good.copy()
        try:
            _, M = cv2.findTransformECC(ref, _grey(f), M, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 60, 1e-5), bg, 3)
            if np.abs(M[:, :2] - np.eye(2)).max() > 0.03 or np.abs(M[:, 2]).max() > 20 or np.abs(M - good).max() > 4:
                M = good
        except cv2.error:
            M = good
        good = M
        fits.append(M.astype(np.float64))
    F = np.stack(fits)
    Fp = np.pad(F, ((3, 3), (0, 0), (0, 0)), mode='edge')
    F = np.stack([np.median(Fp[i:i + 7], axis=0) for i in range(len(F))])
    return [warp(f, M) for f, M in zip(fr, F)]


def tone(f, ref_img, amount=1.0):
    """f with its slow tone drift against ref_img taken out: the difference to the plate, smoothed over about 80 px and
    measured only where nothing is in front of the background, is subtracted (parts keep their own shading)."""
    g = cv2.resize(f, (W // 2, H // 2), interpolation=cv2.INTER_AREA).astype(np.float32)
    p = cv2.resize(ref_img, (W // 2, H // 2), interpolation=cv2.INTER_AREA).astype(np.float32)
    diff = g - p
    d0 = np.abs(cv2.GaussianBlur(diff, (0, 0), 1.5)).max(2)
    w = 1 - cv2.dilate((d0 > 30).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31))).astype(np.float32)
    den = cv2.GaussianBlur(w, (0, 0), 40)
    off = cv2.GaussianBlur(diff * w[..., None], (0, 0), 40) / np.maximum(den, 1e-3)[..., None]
    off = np.clip(off, -50, 50) * np.clip(den / 0.05, 0, 1)[..., None] * amount
    return np.clip(f - cv2.resize(off, (W, H)), 0, 255).astype(np.uint8)


def _half(im):
    return cv2.GaussianBlur(cv2.resize(im, (W // 2, H // 2), interpolation=cv2.INTER_AREA), (0, 0), 1.2)


def background(fr, start=0):
    """A clip's own background at half size: the per-pixel median of its frames from `start` (the parts move, or hover
    only for a while, so they drop out of it)."""
    return np.median(np.stack([_half(f) for f in fr[start::2]]), axis=0).astype(np.uint8)


def movers(fr, plate, thr=22, backgrounds=()):
    """Per frame, at half size: where a part is. A pixel is part of something only if it falls outside the range the
    plate covers within a few pixels of it, and also outside the range each of `backgrounds` covers there (the clip's
    own background and the previous clip's, from background()). Kling re-renders the floor's reflections in its own way
    a few frames into a clip; that matches one of those backgrounds, not a part, so the plate's crisp floor stays.
    Specks are dropped, each part's holes filled and the parts grown a little."""
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    small = [_half(f) for f in fr]
    refs = [(cv2.dilate(b, k).astype(np.int16), cv2.erode(b, k).astype(np.int16)) for b in (_half(plate), *backgrounds)]
    out = []
    for g in small:
        g = g.astype(np.int16)
        m = np.ones(g.shape[:2], bool)
        for hi, lo in refs:
            m &= np.maximum(g - hi, lo - g).max(2) > thr
        m = m.astype(np.uint8)
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
        n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
        m = np.isin(lab, [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= 25]).astype(np.uint8)   # small parts count
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
        inv = (1 - m).astype(np.uint8)
        n, lab, st, _ = cv2.connectedComponentsWithStats(inv, 4)
        border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
        m = (m | np.isin(lab, [i for i in range(1, n) if i not in border and st[i, cv2.CC_STAT_AREA] < 12000])).astype(np.uint8)
        out.append(cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))))
    return out


def over(f, m, plate, zone):
    a = cv2.GaussianBlur(cv2.resize(m.astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR), (0, 0), 1.5)[..., None]
    a = np.maximum(a, zone)
    return (plate * (1 - a) + f * a + 0.5).astype(np.uint8)


class Retimed:
    """A clip sampled at any fraction of its length: in-between frames are made by optical flow (DIS) from the two
    nearest frames, each pushed part of the way along its flow towards the other, then blended."""
    def __init__(self, fr, masks=None):
        self.fr, self.masks, self.pair, self.dis = fr, masks, None, cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
        gy, gx = np.mgrid[0:H, 0:W].astype(np.float32)
        self.grid = np.stack([gx, gy], -1)

    def flow(self, a, b):
        ga = cv2.cvtColor(cv2.resize(self.fr[a], (W // 2, H // 2), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
        gb = cv2.cvtColor(cv2.resize(self.fr[b], (W // 2, H // 2), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
        return cv2.resize(self.dis.calc(ga, gb, None), (W, H)) * 2

    def at(self, u):
        n = len(self.fr)
        k = float(np.clip(u, 0, 1)) * (n - 1)
        a = int(k)
        w = k - a
        i = min(a + (w > 0.5), n - 1)
        m = None if self.masks is None else self.masks[i]
        if a >= n - 1 or w < 0.03:
            return self.fr[min(a, n - 1)], m
        if w > 0.97:
            return self.fr[a + 1], m
        if self.pair != a:
            self.fab, self.fba, self.pair = self.flow(a, a + 1), self.flow(a + 1, a), a
        A = cv2.remap(self.fr[a], self.grid - w * self.fba, None, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        B = cv2.remap(self.fr[a + 1], self.grid - (1 - w) * self.fab, None, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        return (A.astype(np.float32) * (1 - w) + B.astype(np.float32) * w + 0.5).astype(np.uint8), m
