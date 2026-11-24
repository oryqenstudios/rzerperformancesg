#!/usr/bin/env python3
"""Lay the build-up clips onto the reference's timeline and write one master film (no sound).

  python3 tools/assemble-build.py assets/generated/build-plan.json out.mp4

The plan lists the clips in order. Each one is a Kling O3 first-last-frame clip between two keyframes, so the last
frame of one clip and the first frame of the next are the same image and the joins need no blending:

  [{"file": "assets/generated/shots/build-clip-2.mp4", "film": [2.25, 4.75], "pace": [[0.42, 0.66]]}, ...]

  film   when the clip plays in the finished film (s); the clips must follow on without gaps
  pace   optional anchors [film_fraction, clip_fraction] for clips whose action is paced differently from the
         reference: e.g. [0.5, 0.6] shows 60% of the clip by half way through its slot. Linear between anchors.
  reverse  true for a clip generated backwards (from the later keyframe to the earlier one), played in reverse

Output frame n (24 fps) shows the clip whose slot holds n/24, at the nearest frame. A clip's own last frame is never
shown: the next clip starts on the same image.
"""
import json
import subprocess
import sys

import numpy as np

W, H, FPS = 1920, 1080, 24
plan = json.load(open(sys.argv[1]))
out = sys.argv[2]


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
    used = []
    while n < total and n / FPS < t1 - 1e-9:
        u = (n / FPS - t0) / (t1 - t0)
        k = int(round(np.interp(u, fu, cu) * (len(frames) - 1)))
        used.append(k)
        enc.stdin.write(frames[k].tobytes())
        n += 1
    print(f"{clip['file']}: film {t0:.2f}-{t1:.2f} s, {len(used)} frames from its frames {used[0]}-{used[-1]} of {len(frames)}")
enc.stdin.close()
enc.wait()
print(f'{n} frames ({n / FPS:.3f} s)')
