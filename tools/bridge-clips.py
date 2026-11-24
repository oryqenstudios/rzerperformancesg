#!/usr/bin/env python3
"""Join the start of one clip to the end of another when the frames in between are unusable.

  python3 tools/bridge-clips.py <first.mp4> <last_frame_of_first> <second.mp4> <first_frame_of_second> <out.mp4>

Kling kept opening the car's doors while its body formed (in every take, forward and reversed), so the body-forming
clip is made of the part of one take before the doors open and the part of another after they have shut. The two
parts' cameras differ, so:

  - the second part's framing is measured against the first part's last frame (OpenCV ECC on the background, the
    car left out) and its first EASE frames are steered from that framing back to their own, easing out; the second
    part's camera is further back, so this only zooms in and no edges show
  - over its first FADE frames it fades in over the first part's last frame, so the last of the body forms in a
    dissolve between two images with the same framing (no doubled outline)

Writes every frame at 24 fps (no sound); tools/assemble-build.py then fits it into its slot on the timeline.
Needs numpy and OpenCV (pip install opencv-python-headless).
"""
import subprocess
import sys

import cv2
import numpy as np

first, a_end, second, b_start, out = sys.argv[1], int(sys.argv[2]), sys.argv[3], int(sys.argv[4]), sys.argv[5]
W, H = 1920, 1080
EASE = 18    # frames over which the second part's camera eases from the first part's framing back to its own
FADE = 5     # frames of dissolve


def read(path, lo, hi):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf',
                          f"select='between(n,{lo},{hi})',scale={W}:{H}:flags=lanczos,setsar=1",
                          '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)


def small(rgb):
    g = cv2.cvtColor(cv2.resize(rgb, (W // 2, H // 2), interpolation=cv2.INTER_AREA), cv2.COLOR_RGB2GRAY)
    return cv2.GaussianBlur(g.astype(np.float32), (0, 0), 2)


MASK = np.ones((H // 2, W // 2), np.uint8)
MASK[int(.2 * H / 2):int(.95 * H / 2), int(.22 * W / 2):int(.78 * W / 2)] = 0   # the car


def pose(ref, img):
    """Affine (2x3, full-size pixels) from the reference frame's coordinates to this frame's: a feature match (which
    copes with the large difference in scale) refined by ECC."""
    sift = cv2.SIFT_create(3000)
    ka, da = sift.detectAndCompute(ref.astype(np.uint8), MASK)
    kb, db = sift.detectAndCompute(img.astype(np.uint8), MASK)
    good = [m for m, n in cv2.BFMatcher().knnMatch(da, db, k=2) if m.distance < 0.75 * n.distance]
    pa = np.float32([ka[m.queryIdx].pt for m in good])
    pb = np.float32([kb[m.trainIdx].pt for m in good])
    A, inl = cv2.estimateAffinePartial2D(pa, pb, method=cv2.RANSAC, ransacReprojThreshold=2.0)
    print(f'  {int(inl.sum())} of {len(good)} matched features agree')
    A = A.astype(np.float32)
    _, A = cv2.findTransformECC(ref, img, A, cv2.MOTION_AFFINE,
                                (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-7), MASK, 5)
    A = A.astype(np.float64)
    A[:, 2] *= 2
    return A


A_frames = read(first, 0, a_end)
B_frames = read(second, b_start, 10 ** 6)
T = pose(small(A_frames[-1]), small(B_frames[0]))       # where the first part's last framing sits in the second part
print(f'second part vs first: scale {np.sqrt(np.linalg.det(T[:, :2])):.3f}, shift {T[0, 2]:.1f} {T[1, 2]:.1f} px')

enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', '24',
                        '-i', '-', '-c:v', 'libx264', '-crf', '12', '-preset', 'slow', '-pix_fmt', 'yuv420p', out],
                       stdin=subprocess.PIPE)
for f in A_frames:
    enc.stdin.write(f.tobytes())
held = A_frames[-1].astype(np.float32)
I = np.eye(2, 3)
for k, f in enumerate(B_frames):
    if k < EASE:
        u = k / EASE
        M = T + (I - T) * (3 * u * u - 2 * u ** 3)        # output -> this frame's pixels, easing to its own framing
        f = cv2.warpAffine(f, M, (W, H), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    if k < FADE:
        w = (k + 1) / (FADE + 1)
        f = np.clip(f.astype(np.float32) * w + held * (1 - w) + 0.5, 0, 255).astype(np.uint8)
    enc.stdin.write(f.tobytes())
enc.stdin.close()
enc.wait()
print(f'{len(A_frames)} + {len(B_frames)} frames')
