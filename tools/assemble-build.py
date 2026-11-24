#!/usr/bin/env python3
"""Lay the build-up clips onto the reference's timeline and write one master film (no sound).

  python3 tools/assemble-build.py assets/generated/build-plan.json out.mp4 [fps]

The plan lists the clips in order. Each one is a Kling O3 first-last-frame clip between two keyframes, so the last
frame of one clip and the first frame of the next are the same image and the joins need no blending:

  [{"file": "assets/generated/shots/build-clip-2.mp4", "film": [2.25, 4.75], "pace": [[0.42, 0.66]]}, ...]

  film   when the clip plays in the finished film (s); the clips must follow on without gaps
  pace   optional anchors [film_fraction, clip_fraction] for clips whose action is paced differently from the
         reference: e.g. [0.5, 0.6] shows 60% of the clip by half way through its slot. Linear between anchors.
  reverse  true for a clip generated backwards (from the later keyframe to the earlier one), played in reverse

Output frame n (60 fps by default) shows the clip whose slot holds n/fps. Most clips play 2-5x faster than they were
generated, so at 60 fps nearly every generated frame is used (at 24 fps, 2-4 in 5 were skipped and the motion looked
choppy). Where a clip plays faster than one generated frame per output frame, the nearest frame is shown; where it
plays slower, the two nearest are blended. The pace anchors are joined by a smooth monotone curve, so the speed
changes gradually. A clip's own last frame is never shown: the next clip starts on the same image.
"""
import json
import subprocess
import sys

import numpy as np

W, H = 1920, 1080
plan = json.load(open(sys.argv[1]))
out = sys.argv[2]
FPS = int(sys.argv[3]) if len(sys.argv) > 3 else 60


def pchip(x, y, xq):
    """Monotone cubic through (x, y) (Fritsch-Carlson), evaluated at xq: no overshoot, so time never runs backwards."""
    x, y = np.asarray(x, float), np.asarray(y, float)
    h, d = np.diff(x), np.diff(y) / np.diff(x)
    m = np.zeros_like(y)
    m[0], m[-1] = d[0], d[-1]
    for i in range(1, len(x) - 1):
        if d[i - 1] * d[i] > 0:
            w1, w2 = 2 * h[i] + h[i - 1], h[i] + 2 * h[i - 1]
            m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i])
    i = int(np.clip(np.searchsorted(x, xq) - 1, 0, len(x) - 2))
    t = (xq - x[i]) / h[i]
    return ((2 * t ** 3 - 3 * t ** 2 + 1) * y[i] + (t ** 3 - 2 * t ** 2 + t) * h[i] * m[i]
            + (-2 * t ** 3 + 3 * t ** 2) * y[i + 1] + (t ** 3 - t ** 2) * h[i] * m[i + 1])


def read(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'scale={W}:{H}:flags=lanczos,setsar=1',
                          '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)


for a, b in zip(plan, plan[1:]):
    assert abs(a['film'][1] - b['film'][0]) < 1e-6, f"gap or overlap between {a['file']} and {b['file']}"

enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                        '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-crf', '12', '-preset', 'slow',
                        '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
total = round(plan[-1]['film'][1] * FPS)
n = 0
for clip in plan:
    frames = read(clip['file'])
    if clip.get('reverse'):
        frames = frames[::-1]
    t0, t1 = clip['film']
    anchors = [[0.0, 0.0]] + clip.get('pace', []) + [[1.0, 1.0]]
    fu, cu = zip(*anchors)
    last = len(frames) - 1
    pos = lambda u: float(np.clip(pchip(fu, cu, u), 0, 1)) * last
    used = []
    while n < total and n / FPS < t1 - 1e-9:
        u = (n / FPS - t0) / (t1 - t0)
        k = pos(u)
        step = (pos(min(u + 1 / FPS / (t1 - t0), 1)) - k)          # generated frames per output frame here
        if step >= 1 or abs(k - round(k)) < 0.05:
            f = frames[int(round(k))]
        else:
            a = int(k)
            w = k - a
            f = (frames[a] * (1 - w) + frames[min(a + 1, last)] * w + 0.5).astype(np.uint8)
        used.append(int(round(k)))
        enc.stdin.write(f.tobytes())
        n += 1
    print(f"{clip['file']}: film {t0:.2f}-{t1:.2f} s, {len(used)} frames from its frames {used[0]}-{used[-1]} of {len(frames)}")
enc.stdin.close()
enc.wait()
print(f'{n} frames ({n / FPS:.3f} s)')
