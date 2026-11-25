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
JOIN = 0.2          # each clip's still tail morphs into the next clip's first frame over this long before the cut
DISSOLVE = 0.25     # the swing -> the real final frame
PUSH = (1.15, 0.4471, 0.5652)   # the push-in over the build: zoom at its end, and the centre it closes in on
T_FIRE = 10.0       # the engine fires
T_CRANK = T_FIRE - 0.525
T_END = 15.6
LAMPS = [(590, 641, 204, 102), (1084, 643, 244, 111)]   # the headlights in the final frame (x, y, w, h)
CRANK_DIM = 0.45
WING = (52, 8, (980, 220, 1420, 430))   # the body clip's tall wing: from frame 52 (the roof has landed), blended in over
                                        # 8 frames, the area it sits in (x0, y0, x1, y1) comes from the finished car

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
    """The slow push-in over the build: the view narrows to 1/PUSH[0] of the frame while its centre drifts to PUSH's
    centre, ending on exactly the crop the swing clip starts from (keys/swarm/car34-push.jpg). It starts from rest and
    is still moving when the swing takes over, so the camera never stops between the two."""
    z_end, cx, cy = PUSH
    u = np.clip(t / TIMES['body'][1], 0, 1) ** 1.6
    z = 1 + (z_end - 1) * u
    c = np.array([W / 2 + (cx * W - W / 2) * u, H / 2 + (cy * H - H / 2) * u])   # the source point at the view's centre
    M = np.float32([[z, 0, W / 2 - z * c[0]], [0, z, H / 2 - z * c[1]]])
    return cv2.warpAffine(f, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)


# ------------------------------------------------------------------------------------------------ the clips
def pace(fr):
    """Where each source frame of a clip falls in its slot (0..1). Kling eases every clip in and out of its key
    frames, so played at an even speed the build would stop at each join; here the time a frame gets follows how much
    moves in it (the square root, smoothed), so near-still stretches pass quickly and the busy ones keep their pace.
    Motion is capped at its 60th percentile first, so a burst (Kling smearing parts together) is not slowed down."""
    g = [cv2.resize(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), (240, 135), interpolation=cv2.INTER_AREA).astype(np.float32) for f in fr]
    m = np.array([np.abs(g[i + 1] - g[i]).mean() for i in range(len(g) - 1)])
    m = np.minimum(m, np.percentile(m, 60))
    m = np.convolve(np.pad(m, 4, mode='edge'), np.ones(9) / 9, mode='valid')
    w = np.sqrt(m + 0.35 * np.median(m))
    tau = np.concatenate([[0], np.cumsum(w)])
    return tau / tau[-1]


DIS = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
GRID = np.stack(np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32)), -1)


def morph(a, b, w):
    """An in-between of two nearly matching frames at w (0..1): each pushed along the optical flow towards the other,
    then blended, so parts that sit a little apart slide into place instead of showing twice."""
    ga = cv2.cvtColor(cv2.resize(a, (W // 2, H // 2), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
    gb = cv2.cvtColor(cv2.resize(b, (W // 2, H // 2), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
    fab = cv2.resize(DIS.calc(ga, gb, None), (W, H)) * 2
    fba = cv2.resize(DIS.calc(gb, ga, None), (W, H)) * 2
    A_ = cv2.remap(a, GRID - w * fba, None, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    B_ = cv2.remap(b, GRID - (1 - w) * fab, None, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    w = w * w * (3 - 2 * w)
    return (A_.astype(np.float32) * (1 - w) + B_.astype(np.float32) * w + 0.5).astype(np.uint8)


raw = {k: frames(f'{A}/clips/{v}.mp4') for k, v in CLIPS.items()}
bg = cv2.resize((zone[..., 0] < 0.05).astype(np.uint8), (W // 2, H // 2), interpolation=cv2.INTER_NEAREST)
def unwing(fr):
    """Kling's body clip bolts a tall GT wing onto the boot and only shrinks it to the car's factory spoiler in its
    last frames. Once the roof has landed, the wing's area (where it differs from the finished car) is taken from the
    finished car instead, so the spoiler is the real one from then on."""
    i0, ramp, (x0, y0, x1, y1) = WING
    ref = fr[90]
    d = np.abs(cv2.GaussianBlur(ref.astype(np.float32), (0, 0), 2) - cv2.GaussianBlur(car34.astype(np.float32), (0, 0), 2)).max(2)
    m = np.zeros((H, W), np.uint8)
    m[y0:y1, x0:x1] = (d[y0:y1, x0:x1] > 30)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
    m = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 6)[..., None]
    out = []
    for i, f in enumerate(fr):
        w = float(np.clip((i - i0) / ramp, 0, 1))
        w = w * w * (3 - 2 * w)
        out.append(f if w == 0 else (f * (1 - w * m) + car34 * (w * m) + 0.5).astype(np.uint8))
    return out


clips, paces = {}, {}
for k in ('engine', 'chassis', 'body'):
    fr = [tone(f, plate) for f in steady(raw[k], plate, bg)]
    if k == 'body':
        fr = unwing(fr)
    clips[k] = Retimed(fr, movers(fr, plate))
    paces[k] = pace(fr)
    print('laid out', k, 'time share of each quarter:', np.round(np.diff(np.interp([0, 30, 60, 90, 120], np.arange(len(fr)), paces[k])), 2))
clips['swing'] = Retimed(list(raw['swing']))          # the camera moves: Kling's own frames
idle = steady(raw['idle'], final, cv2.resize((final_zone[..., 0] < 0.05).astype(np.uint8), (W // 2, H // 2)))
clips['idle'] = Retimed(idle)


def built(k, t):
    """Build clip k at film time t, laid over the plate. The car's place always comes from the clip once the
    chassis is landing (before that only the flying parts and their reflections do, so the floor stays crisp)."""
    t0, t1 = TIMES[k]
    tau = paces[k]
    u = float(np.interp(np.clip((t - t0) / (t1 - t0), 0, 1), tau, np.linspace(0, 1, len(tau))))
    f, m = clips[k].at(u)
    zw = {'engine': 0.0, 'chassis': min(1.0, u / 0.35), 'body': 1.0}[k]
    return over(f, m, plate, zone * zw)


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
        t1 = TIMES[k][1]
        if i < len(order) - 1 and t > t1 - JOIN:        # slide into the next clip's first frame before the cut
            f = morph(f, built(order[i + 1], t1), (t - (t1 - JOIN)) / JOIN)
        elif k == 'body' and t > t1 - JOIN:             # and into the swing's first frame (in pushed-in framing)
            f = push(f, t)
            f = morph(f, clips['swing'].at(0.0)[0], (t - (t1 - JOIN)) / JOIN)
        if not (k == 'body' and t > t1 - JOIN):
            f = push(f, t)
    elif t < TIMES['swing'][1]:
        t0, t1 = TIMES['swing']
        f = clips['swing'].at((t - t0) / (t1 - t0))[0]
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
