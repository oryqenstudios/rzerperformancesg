#!/usr/bin/env python3
"""Join the garage film and the carbon cure clip with a hard cut that doesn't jump.

The cure clip (Kling O3 first-last-frame) starts on the garage film's frame CUT, but within its first 3 frames its
camera lurches about 1% closer and 9 px up, then holds still. Meanwhile the garage film's camera is slowly pulling
back. A dissolve between the two shows a doubled car, so instead:

  - every frame is measured against the cure clip's settled framing (cure frame REF), with ECC on blurred greyscale
    frames, leaving the car out (its headlights and paint change)
  - over the garage film's last RAMP frames, a gentle correction (about 1% closer and 9 px up) is eased in on top of
    the film's own camera move, so that at the cut it lands exactly on the settled framing; it only ever zooms in,
    so no edges show
  - the cure clip's first frames, before it settles, are warped onto the settled framing, and its first BLEND frames
    fade in from its first frame (Kling redraws the fine detail of the frame it was given over its next few frames)
  - a sudden jump in the garage film's own camera move in those frames (the restyle has one, at frame 192) is eased
    out over the next POP_EASE frames: the camera carries on from where it was, then catches up

  python3 tools/join-cure.py <garage.mp4> <cure.mp4> <start> <cut> <out.mp4>

Uses garage frames start..cut-1, then every cure frame. Writes a high-quality H.264 master (no sound).
Needs numpy and OpenCV (pip install opencv-python-headless).
"""
import subprocess
import sys

import cv2
import numpy as np

garage, cure, START, CUT, out = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
W, H = 1920, 1080
RAMP = 24    # frames of the garage film that are steered onto the cure clip's framing (1 s)
REF = 12     # a cure frame after it has settled
POP = 6.0      # px: a frame whose camera move differs this much from the previous frame's is a jump
POP_EASE = 8   # frames over which a jump is eased out
BLEND = 4      # frames
SETTLED = 1.0  # px: from the first cure frame within this of REF's framing (at the frame corners), frames are left alone


def read(path, first, last):
    """Frames first..last-1 as full-size RGB."""
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', f"select='between(n,{first},{last - 1})'",
                          '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)


def small(rgb):
    g = cv2.cvtColor(cv2.resize(rgb, (W // 2, H // 2), interpolation=cv2.INTER_AREA), cv2.COLOR_RGB2GRAY)
    return cv2.GaussianBlur(g.astype(np.float32), (0, 0), 2)


MASK = np.ones((H // 2, W // 2), np.uint8)
MASK[int(.28 * H / 2):int(.92 * H / 2), int(.27 * W / 2):int(.75 * W / 2)] = 0   # the car


def pose(ref, img, init=None):
    """Affine A (2x3, full-size pixels) taking the reference framing's coordinates to this frame's coordinates.
    ECC only finds the right answer from a nearby start, so pass a neighbouring frame's pose as init."""
    A = np.eye(2, 3) if init is None else init.copy()
    A[:, 2] /= 2
    _, A = cv2.findTransformECC(ref, img, A.astype(np.float32), cv2.MOTION_AFFINE,
                                (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-7), MASK, 5)
    A = A.astype(np.float64)
    A[:, 2] *= 2
    return A


def m3(A):
    return np.vstack([A, [0, 0, 1]])


def corner_error(A):
    pts = np.array([[0, 0, 1], [W, 0, 1], [0, H, 1], [W, H, 1]], float).T
    return np.abs(A @ pts - pts[:2]).max()


def warp(rgb, M):
    """Output pixel x shows the input at M x."""
    return cv2.warpAffine(rgb, M, (W, H), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)


cure_frames = read(cure, 0, 10 ** 6)
ref = small(cure_frames[REF])
k0 = CUT - RAMP
tail = read(garage, k0, CUT)                         # garage k0 .. CUT-1
first_pose = pose(ref, small(cure_frames[0]))
poses, A = {}, first_pose
for k in range(CUT - 1, k0 - 1, -1):                 # back from the cut, each starting from the next frame's pose
    A = poses[k] = pose(ref, small(tail[k - k0]), A)

# the steered framing: the film's own framing plus a correction eased in (smoothstep) so that at the cut it equals
# the settled framing. The correction is the gap between the cure clip's first frame (the garage frame at CUT) and its
# settled framing.
D = np.eye(2, 3) - first_pose
# jumps: the camera carries on at its previous speed through the jump, then eases back onto the film's own move (this
# lags behind the film, so the edge it uncovers is at the bottom, which the page fades to black)
ease = {k: np.zeros((2, 3)) for k in range(k0, CUT)}
pops = []
for k in range(k0 + 2, CUT):                         # along the path as smoothed so far
    expected = 2 * (poses[k - 1] - ease[k - 1]) - (poses[k - 2] - ease[k - 2])
    gap = poses[k] - ease[k] - expected
    if np.hypot(*gap[:, 2]) > POP:
        pops.append(k)
        for j in range(k, min(k + POP_EASE, CUT)):
            u = (j - k) / POP_EASE
            ease[j] += gap * (1 - (3 * u * u - 2 * u ** 3))
steer = {}
for k in range(k0, CUT):
    u = (k - k0) / RAMP
    P = poses[k] - ease[k] + D * (3 * u * u - 2 * u ** 3)
    steer[k] = (m3(poses[k]) @ np.linalg.inv(m3(P)))[:2]   # output -> this frame's pixels

enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', '24',
                        '-i', '-', '-c:v', 'libx264', '-crf', '12', '-preset', 'slow', '-pix_fmt', 'yuv420p', out],
                       stdin=subprocess.PIPE)
for first in range(START, k0, 48):                   # the untouched part of the garage film, in chunks
    for f in read(garage, first, min(first + 48, k0)):
        enc.stdin.write(f.tobytes())
for i, f in enumerate(tail):
    enc.stdin.write(warp(f, steer[k0 + i]).tobytes())
settled_at, A, first = None, None, None
for n, f in enumerate(cure_frames):
    if settled_at is None:
        A = pose(ref, small(f), A)
        if corner_error(A) < SETTLED:
            settled_at = n
        else:
            f = warp(f, A)
    if n == 0:
        first = f.astype(np.float32)
    elif n <= BLEND:
        w = n / (BLEND + 1)
        f = np.clip(f.astype(np.float32) * w + first * (1 - w) + 0.5, 0, 255).astype(np.uint8)
    enc.stdin.write(f.tobytes())
enc.stdin.close()
enc.wait()
print(f'steered garage frames {k0}-{CUT - 1} (jumps eased at {pops}); cure clip settled from its frame {settled_at}; '
      f'{CUT - START + len(cure_frames)} frames')
