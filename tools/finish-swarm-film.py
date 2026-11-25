#!/usr/bin/env python3
"""Build the swarm hero film, after the client's reference (a 3D car assembly breakdown): seen from a high front
three-quarter angle with a slow push-in, a swarm of small parts flies into the lit workshop and builds the engine in
mid-air, the suspension and brakes gather round it, the chassis frame drops in underneath, the wheels fly onto the
hubs and the bare body shell forms, then the carbon panels lock on, the front bumper last. The camera then swings down
and round to the head-on final frame (assets/generated/carbon-final.jpg, the still the hero rests on), the headlights
come on, and the engine starts as before.

  python3 tools/finish-swarm-film.py [out_dir]     # default preview/hero (not committed); assets/site to ship

Writes <out_dir>/hero-intro.mp4 and .webm (no sound: tools/make-hero-audio.py adds it, reading the timing this script
writes to assets/generated/assembly/swarm-motion.json) and hero-poster.jpg.

The parts (assets/generated/assembly/, see its README):
  keys/swarm/car34.jpg       the finished car from the high front corner (Kling edit of the final frame)
  keys/swarm/empty34.jpg     the same, the car removed: the plate the build is laid over
  keys/swarm/engine34.jpg    the engine in mid-air with its parts and the suspension around it
  keys/swarm/chassis34.jpg   the rolling chassis with the bare body shell
  keys/swarm/car34-push.jpg  car34 at the end of the push-in (the swing's first frame)
  clips/swarm/engine-b.mp4   Kling O3, empty34 -> engine34: the swarm flies in and builds the engine
  clips/swarm/chassis-b.mp4  Kling O3, engine34 -> chassis34
  clips/swarm/body-b.mp4     Kling O3, chassis34 -> car34: the panels lock on, the bumper last
  clips/swarm/swing-a.mp4    Kling O3, car34-push -> the final frame: the camera swings round; the headlights come on
  clips/idle.mp4             Kling O3, final -> final: the car idling (shared with the assembly film)

During the build the camera is locked off in the clips and the push-in is added here, so the workshop is the plate's,
pixel for pixel, with the clips' parts laid over it (where a part is, or where the car stands). Kling's 24 fps is
retimed to 60 fps by optical flow.
"""
import json
import os
import subprocess
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config_layers import align, load   # noqa: E402
from film_lib import H, W, Retimed, frames, movers, over, steady, tone   # noqa: E402

A = 'assets/generated/assembly'
K = f'{A}/keys/swarm'
OUT = sys.argv[1] if len(sys.argv) > 1 else 'preview/hero'
FPS = 60
CLIPS = {'engine': 'swarm/engine-b', 'chassis': 'swarm/chassis-b', 'body': 'swarm/body-b', 'swing': 'swarm/swing-a', 'idle': 'idle'}
TIMES = {'engine': (0.0, 2.6), 'chassis': (2.6, 4.9), 'body': (4.9, 7.2), 'swing': (7.2, 9.4)}
JOIN = 0.1          # crossfade between the build clips
DISSOLVE = 0.25     # the swing -> the real final frame
PUSH = (1.15, 0.4471, 0.5652)   # the push-in over the build: zoom at its end, and the centre it closes in on
T_FIRE = 10.0       # the engine fires
T_CRANK = T_FIRE - 0.525
T_END = 15.6
LAMPS = [(590, 641, 204, 102), (1084, 643, 244, 111)]   # the headlights in the final frame (x, y, w, h)
CRANK_DIM = 0.45

# ------------------------------------------------------------------------------------------------ the stills
final = load('assets/generated/carbon-final.jpg')
off_src, _, _ = align(final, load(f'{A}/keys/lights-off.jpg'))
lamp = np.zeros((H, W), np.float32)
for x, y, w, h in LAMPS:
    cv2.ellipse(lamp, (x + w // 2, y + h // 2), (w // 2 + 18, h // 2 + 16), 0, 0, 360, 1, -1)
lamp = cv2.GaussianBlur(lamp, (0, 0), 8)[..., None]
final_zone = np.zeros((H, W), np.float32)
final_zone[560:1000, 520:1400] = 1
final_zone = cv2.GaussianBlur(final_zone, (0, 0), 20)[..., None]   # where the idling car moves

car34 = load(f'{K}/car34.jpg')
empty34, _, r = align(car34, load(f'{K}/empty34.jpg'))
print(f'plate aligned (worst local misfit {r:.1f} px)')
# where the car stands (and its reflection): the clips are always used there
d = np.abs(cv2.GaussianBlur(car34.astype(np.float32), (0, 0), 2) - cv2.GaussianBlur(empty34.astype(np.float32), (0, 0), 2)).max(2)
car = cv2.morphologyEx((d > 26).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
n_, lab_, st_, _ = cv2.connectedComponentsWithStats(car, 8)
car = (lab_ == 1 + int(np.argmax(st_[1:, cv2.CC_STAT_AREA]))).astype(np.uint8)
zone = cv2.GaussianBlur(cv2.dilate(car, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41))).astype(np.float32), (0, 0), 12)[..., None]
plate = (car34 * (1 - zone) + empty34 * zone + 0.5).astype(np.uint8)


def push(f, t):
    """The slow push-in, eased over the build: the view narrows to 1/PUSH[0] of the frame while its centre drifts to
    PUSH's centre, ending on exactly the crop the swing clip starts from (keys/swarm/car34-push.jpg)."""
    z_end, cx, cy = PUSH
    u = np.clip(t / TIMES['body'][1], 0, 1)
    u = u * u * (3 - 2 * u)
    z = 1 + (z_end - 1) * u
    c = np.array([W / 2 + (cx * W - W / 2) * u, H / 2 + (cy * H - H / 2) * u])   # the source point at the view's centre
    M = np.float32([[z, 0, W / 2 - z * c[0]], [0, z, H / 2 - z * c[1]]])
    return cv2.warpAffine(f, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)


# ------------------------------------------------------------------------------------------------ the clips
raw = {k: frames(f'{A}/clips/{v}.mp4') for k, v in CLIPS.items()}
bg = cv2.resize((zone[..., 0] < 0.05).astype(np.uint8), (W // 2, H // 2), interpolation=cv2.INTER_NEAREST)
clips = {}
for k in ('engine', 'chassis', 'body'):
    fr = [tone(f, plate) for f in steady(raw[k], plate, bg)]
    clips[k] = Retimed(fr, movers(fr, plate))
    print('laid out', k)
clips['swing'] = Retimed(list(raw['swing']))          # the camera moves: Kling's own frames
idle = steady(raw['idle'], final, cv2.resize((final_zone[..., 0] < 0.05).astype(np.uint8), (W // 2, H // 2)))
clips['idle'] = Retimed(idle)


def built(k, t):
    t0, t1 = TIMES[k]
    f, m = clips[k].at((t - t0) / (t1 - t0))
    return over(f, m, plate, zone)


# ------------------------------------------------------------------------------------------------ the film
os.makedirs(OUT, exist_ok=True)
STILLS = [float(x) for x in os.environ['STILLS'].split(',')] if os.environ.get('STILLS') else None
master = f'{OUT}/master.mp4'
enc = None if STILLS else subprocess.Popen(
    ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
     '-vf', 'unsharp=5:5:0.5:5:5:0', '-c:v', 'libx264', '-crf', '10', '-preset', 'medium', '-pix_fmt', 'yuv420p', master],
    stdin=subprocess.PIPE)
n_total = round(T_END * FPS)
motion, prev = [], None
order = ['engine', 'chassis', 'body']
for n in range(n_total):
    t = n / FPS
    if STILLS and not any(abs(t - x) < 0.5 / FPS for x in STILLS):
        continue
    if t < TIMES['body'][1]:
        k = next(c for c in order if t < TIMES[c][1])
        f = built(k, t)
        i = order.index(k)
        if i > 0 and t < TIMES[k][0] + JOIN:            # out of the previous clip's last frame
            w = (t - TIMES[k][0]) / JOIN
            f = (built(order[i - 1], TIMES[k][0]) * (1 - w) + f * w + 0.5).astype(np.uint8)
        f = push(f, t)
    elif t < TIMES['swing'][1]:
        t0, t1 = TIMES['swing']
        f = clips['swing'].at((t - t0) / (t1 - t0))[0]
        if t < t0 + JOIN:                               # out of the pushed-in end of the build
            w = (t - t0) / JOIN
            f = (push(built('body', t0), t0) * (1 - w) + f * w + 0.5).astype(np.uint8)
        if t > t1 - DISSOLVE:                           # into the real final frame
            w = (t - (t1 - DISSOLVE)) / DISSOLVE
            f = (f * (1 - w) + final * w + 0.5).astype(np.uint8)
    elif t < T_FIRE:
        f = final
    else:
        fi = clips['idle'].at((t - T_FIRE) / (T_END - T_FIRE))[0]
        f = (final * (1 - final_zone) + fi * final_zone + 0.5).astype(np.uint8)
        edge = min(1.0, (t - T_FIRE) / 0.25, (T_END - 1 / FPS - t) / 0.4)
        f = (final * (1 - edge) + f * edge + 0.5).astype(np.uint8)
    if T_CRANK <= t < T_FIRE:   # cranking: the headlights dim and waver, then come back to full as it fires
        dd = CRANK_DIM * (0.85 + 0.15 * np.sin(2 * np.pi * 11 * t)) * lamp
        f = (f * (1 - dd) + off_src * dd + 0.5).astype(np.uint8)
    if STILLS:
        cv2.imwrite(f'{OUT}/still-{t:.2f}.jpg', f, [cv2.IMWRITE_JPEG_QUALITY, 92])
        continue
    small = cv2.GaussianBlur(cv2.cvtColor(cv2.resize(f, (480, 270), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 1)
    motion.append(0.0 if prev is None else float(np.abs(small - prev).mean()))
    prev = small
    enc.stdin.write(f.tobytes())
    if n % 120 == 0:
        print(f'{t:5.2f} s')
if STILLS:
    sys.exit(0)
enc.stdin.close()
enc.wait()

json.dump({'fps': FPS, 'motion': [round(x, 3) for x in motion], 't_fire': T_FIRE, 't_end': n_total / FPS,
           'assembly': [0.0, TIMES['body'][1]]}, open(f'{A}/swarm-motion.json', 'w'))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', master, '-an', '-c:v', 'libx264', '-preset', 'slow', '-tune', 'film', '-crf', '22',
                '-maxrate', '5000k', '-bufsize', '10000k', '-movflags', '+faststart', f'{OUT}/hero-intro.mp4'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', master, '-an', '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '4500k', '-row-mt', '1',
                '-deadline', 'good', '-cpu-used', '2', f'{OUT}/hero-intro.webm'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', master, '-frames:v', '1', '-q:v', '3', f'{OUT}/hero-poster.jpg'], check=True)
print(f'{n_total} frames ({n_total / FPS:.3f} s), engine fires at {T_FIRE} s')
