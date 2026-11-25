#!/usr/bin/env python3
"""Build the wheel-roll hero film: in the dark workshop a single wheel rolls out of the shadows into a pool of light,
the camera following it; the car then builds itself around it (the axle and chassis first, then the carbon body),
its headlights come on, the workshop's ceiling lights switch on bank by bank, and the engine starts and idles. It ends
on the same final frame as before (assets/generated/carbon-final.jpg, the still the hero rests on).

  python3 tools/finish-roll-film.py [out_dir]      # default preview/hero (not committed); assets/site to ship

Writes <out_dir>/hero-intro.mp4 and .webm (no sound: tools/make-hero-audio.py and tools/mux-hero-audio.sh add it,
reading the timing this script writes to assets/generated/assembly/roll-motion.json) and hero-poster.jpg.

The parts (assets/generated/assembly/, see its README):
  keys/roll/dark-final.jpg  the final frame with the lights down (one dim light from above, the red neon faint)
  keys/roll/dark-empty.jpg  the same, the car removed: the plate the dark part of the film is laid over
  keys/roll/start-comp.jpg  the first frame: the camera zoomed straight ahead, the wheel small by the back wall
  keys/roll/wheel.jpg       the wheel at real size, seen from the front, in the pool of light (tools/roll-keys.py)
  keys/roll/chassis.jpg     the bare rolling chassis where the car will stand
  clips/roll/roll-fcomp.mp4 Kling O3, start-comp -> wheel: the wheel rolls straight towards the camera into the light,
                            upright and tread on; the camera pulls back to the final framing
  clips/roll/chassis-fb.mp4 Kling O3, wheel -> chassis: an axle extends sideways out of the wheel's hub, the wheels
                            slide out along it, the rear wheels, frame rails and coilovers, then the seats and engine
  clips/roll/body-b.mp4     Kling O3, chassis -> dark-final: the doors, floor, roof, bumper and bonnet fold on, with
                            sparks; the headlights come on
  clips/idle.mp4            Kling O3, final -> final: the car idling (shared with the assembly film)

After the roll, the camera is locked off and the background never moves: a pixel comes from the clip only where a part
is (it falls outside the range the plate covers within a few pixels of it) or where the car stands; everything else is
the plate. Kling's 24 fps clips are retimed to 60 fps by optical flow (DIS), not by blending frames, so moving edges
stay single.
"""
import json
import os
import subprocess
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config_layers import align, load   # noqa: E402

A = 'assets/generated/assembly'
K = f'{A}/keys/roll'
OUT = sys.argv[1] if len(sys.argv) > 1 else 'preview/hero'
W, H, FPS = 1920, 1080, 60
CLIPS = {'roll': 'roll/roll-fcomp', 'chassis': 'roll/chassis-fb', 'body': 'roll/body-b', 'idle': 'idle'}
TIMES = {'roll': (0.0, 3.5), 'chassis': (3.5, 6.6), 'body': (6.6, 9.7)}
JOIN = 0.2          # roll -> chassis crossfade
DISSOLVE = 0.25     # the body clip -> the dark final key
BANKS = [9.78, 9.95, 10.12]    # the ceiling lights switch on, back row to front row
T_FIRE = 11.0       # the engine fires (T_HEAD in tools/make-hero-audio.py comes from roll-motion.json)
T_CRANK = T_FIRE - 0.525
T_END = 16.6
LAMPS = [(590, 641, 204, 102), (1084, 643, 244, 111)]   # the headlights in the final frame (x, y, w, h)
CRANK_DIM = 0.45
ROWS = [(140, 215), (70, 140), (0, 70)]   # the hexagon ceiling's rows (y, in the final frame), back to front
CONE = (560, 0, 1360, 470)                # the light cone from the ceiling spot (x0, y0, x1, y1)
FIXTURE = (840, 20, 1080, 140)            # the spot's own fitting
TOP = (740, 0, 1180, 330)                 # the top of its cone


def frames(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'scale={W}:{H}:flags=lanczos,setsar=1', '-f', 'rawvideo',
                          '-pix_fmt', 'bgr24', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)


# ------------------------------------------------------------------------------------------------ the stills
final = load('assets/generated/carbon-final.jpg')
off_src, _, _ = align(final, load(f'{A}/keys/lights-off.jpg'))
lamp = np.zeros((H, W), np.float32)
for x, y, w, h in LAMPS:
    cv2.ellipse(lamp, (x + w // 2, y + h // 2), (w // 2 + 18, h // 2 + 16), 0, 0, 360, 1, -1)
lamp = cv2.GaussianBlur(lamp, (0, 0), 8)[..., None]

dark_final, _, r1 = align(final, load(f'{K}/dark-final.jpg'))
dark_empty, _, r2 = align(dark_final, load(f'{K}/dark-empty.jpg'))
print(f'keys aligned (worst local misfit {r1:.1f}, {r2:.1f} px)')

# where the car stands (its body, reflection and headlight beams): the clip is always used there
d = np.abs(cv2.GaussianBlur(dark_final.astype(np.float32), (0, 0), 2) - cv2.GaussianBlur(dark_empty.astype(np.float32), (0, 0), 2)).max(2)
car = cv2.morphologyEx((d > 24).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
n_, lab_, st_, _ = cv2.connectedComponentsWithStats(car, 8)
car = (lab_ == 1 + int(np.argmax(st_[1:, cv2.CC_STAT_AREA]))).astype(np.uint8)
car = cv2.dilate(car, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (61, 61)))
zone = cv2.GaussianBlur(car.astype(np.float32), (0, 0), 15)[..., None]
plate = (dark_final * (1 - zone) + dark_empty * zone + 0.5).astype(np.uint8)

# the ceiling banks: each row of hexagons switches on in turn; the rest of the room follows the share that is on
ceil = np.zeros((len(ROWS), H, W), np.float32)
for i, (y0, y1) in enumerate(ROWS):
    ceil[i, y0:y1, 300:1620] = 1
    ceil[i] = cv2.GaussianBlur(ceil[i], (0, 0), 6)
ceil_any = np.clip(ceil.sum(0), 0, 1)


def bank(t, t0):
    """One bank switching on at t0: on, a quick flicker off, then on for good."""
    if t < t0:
        return 0.0
    u = t - t0
    return 1.0 if u > 0.09 else (1.0 if u < 0.03 else 0.25 if u < 0.055 else 0.85)


def lights(t):
    """The workshop between dark (the dark final key) and lit (the real final frame)."""
    b = [bank(t, t0) for t0 in BANKS]
    room = sum(b) / len(b)
    w = room * (1 - ceil_any) + sum(bi * ci for bi, ci in zip(b, ceil))
    w = w[..., None]
    return (dark_final * (1 - w) + final * w + 0.5).astype(np.uint8)


# ------------------------------------------------------------------------------------------------ the clips
def steady(fr, ref_img, bg):
    """Each frame aligned onto ref_img by an affine ECC fit on the background bg (half size); fits that stray are
    rejected and the rest smoothed over 7 frames."""
    ref = cv2.GaussianBlur(cv2.cvtColor(cv2.resize(ref_img, (W // 2, H // 2)), cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 1.5)
    good = np.eye(2, 3, dtype=np.float32)
    fits = []
    for f in fr:
        g = cv2.GaussianBlur(cv2.cvtColor(cv2.resize(f, (W // 2, H // 2)), cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 1.5)
        M = good.copy()
        try:
            _, M = cv2.findTransformECC(ref, g, M, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 60, 1e-5), bg, 3)
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


def warp(f, M):
    M = M.copy()
    M[:, 2] *= 2
    return cv2.warpAffine(f, M.astype(np.float32), (W, H), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)


def tone(f, ref_img, amount=1.0):
    """f with its slow tone drift against ref_img taken out. Kling renders the walls and floor a little lighter or
    darker than the plate, and one clip brightens the ceiling light for a while: the difference to the plate, smoothed
    over about 80 px and measured only where nothing is in front of the background, is subtracted (parts keep their
    own shading, but sit in the plate's light)."""
    g = cv2.resize(f, (W // 2, H // 2), interpolation=cv2.INTER_AREA).astype(np.float32)
    p = cv2.resize(ref_img, (W // 2, H // 2), interpolation=cv2.INTER_AREA).astype(np.float32)
    diff = g - p
    d0 = np.abs(cv2.GaussianBlur(diff, (0, 0), 1.5)).max(2)
    w = 1 - cv2.dilate((d0 > 30).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31))).astype(np.float32)
    den = cv2.GaussianBlur(w, (0, 0), 40)
    off = cv2.GaussianBlur(diff * w[..., None], (0, 0), 40) / np.maximum(den, 1e-3)[..., None]
    off = np.clip(off, -50, 50) * np.clip(den / 0.05, 0, 1)[..., None] * amount
    return np.clip(f - cv2.resize(off, (W, H)), 0, 255).astype(np.uint8)


def movers(fr, gate_top=False):
    """Per frame, at half size: where a part is. A pixel is part of something only if it falls outside the range the
    plate covers within a few pixels of it; specks are dropped, each part's holes filled and the parts grown a little.
    In the ceiling light's fitting only something darker than the light counts. With gate_top (the body clip, which
    brightens the light for a while), the top of the light's cone comes from the clip only in frames where a part
    passes through it: frames with sharp-edged differences there (a smooth glow has none)."""
    p = cv2.GaussianBlur(cv2.resize(plate, (W // 2, H // 2), interpolation=cv2.INTER_AREA), (0, 0), 1.2).astype(np.int16)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    hi, lo = cv2.dilate(p, k).astype(np.int16), cv2.erode(p, k).astype(np.int16)
    fix = np.zeros((H // 2, W // 2), bool)
    x0, y0, x1, y1 = FIXTURE
    fix[y0 // 2:y1 // 2, x0 // 2:x1 // 2] = True
    top = np.zeros((H // 2, W // 2), bool)
    x0, y0, x1, y1 = TOP
    top[y0 // 2:y1 // 2, x0 // 2:x1 // 2] = True
    hp = lambda x: x - cv2.GaussianBlur(x, (0, 0), 6)
    php = hp(cv2.resize(plate, (W // 2, H // 2), interpolation=cv2.INTER_AREA).astype(np.float32))
    out, gates = [], []
    for f in fr:
        g = cv2.GaussianBlur(cv2.resize(f, (W // 2, H // 2), interpolation=cv2.INTER_AREA), (0, 0), 1.2).astype(np.int16)
        d = np.maximum(g - hi, lo - g).max(2)
        m = (d > 20) & ~(fix & ((lo - g).max(2) < 20))
        if gate_top:
            sharp = np.abs(hp(cv2.resize(f, (W // 2, H // 2), interpolation=cv2.INTER_AREA).astype(np.float32)) - php).max(2) > 30
            gates.append(float((sharp & top & ~fix).sum() >= 400))
        m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
        n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
        m = np.isin(lab, [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= 120]).astype(np.uint8)
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21)))
        inv = (1 - m).astype(np.uint8)
        n, lab, st, _ = cv2.connectedComponentsWithStats(inv, 4)
        border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
        m = (m | np.isin(lab, [i for i in range(1, n) if i not in border and st[i, cv2.CC_STAT_AREA] < 12000])).astype(np.uint8)
        out.append(cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))))
    if gate_top:   # the gate opens and closes over 9 frames, so the light never pops
        soft = np.convolve(np.pad(gates, 4, mode='edge'), np.ones(9) / 9, mode='valid')
        topf = cv2.GaussianBlur(top.astype(np.float32), (0, 0), 6)
        out = [m.astype(np.float32) * (1 - topf * (1 - gi)) for m, gi in zip(out, soft)]
    return out


def over(f, m, under):
    a = cv2.GaussianBlur(cv2.resize(m.astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR), (0, 0), 2)[..., None]
    a = np.maximum(a, zone)
    return (under * (1 - a) + f * a + 0.5).astype(np.uint8)


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
        k = np.clip(u, 0, 1) * (n - 1)
        a = int(k)
        w = float(k - a)
        i = min(a + (w > 0.5), n - 1)
        m = None if self.masks is None else self.masks[i]
        if a >= n - 1 or w < 0.03:
            return self.fr[min(a, n - 1)], m
        if w > 0.97:
            return self.fr[a + 1], m
        if self.pair != a:
            self.fab, self.fba, self.pair = self.flow(a, a + 1), self.flow(a + 1, a), a
        A_ = cv2.remap(self.fr[a], self.grid - w * self.fba, None, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        B_ = cv2.remap(self.fr[a + 1], self.grid - (1 - w) * self.fab, None, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        return (A_.astype(np.float32) * (1 - w) + B_.astype(np.float32) * w + 0.5).astype(np.uint8), m


raw = {k: frames(f'{A}/clips/{v}.mp4') for k, v in CLIPS.items()}
bg = cv2.resize((zone[..., 0] < 0.05).astype(np.uint8), (W // 2, H // 2), interpolation=cv2.INTER_NEAREST)
x0, y0, x1, y1 = CONE
bg[y0 // 2:y1 // 2, x0 // 2:x1 // 2] = 0
locked = {k: [tone(f, plate) for f in steady(raw[k], plate, bg)] for k in ('chassis', 'body')}
locked['idle'] = steady(raw['idle'], final, bg)

# the roll: the camera moves, so its frames are Kling's own; over its last second they are eased onto the plate
wheel_key, _, _ = align(dark_final, load(f'{K}/wheel.jpg'))
ref = cv2.GaussianBlur(cv2.cvtColor(cv2.resize(wheel_key, (W // 2, H // 2)), cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 1.5)
g = cv2.GaussianBlur(cv2.cvtColor(cv2.resize(raw['roll'][-1], (W // 2, H // 2)), cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 1.5)
try:
    _, end_fit = cv2.findTransformECC(ref, g, np.eye(2, 3, dtype=np.float32), cv2.MOTION_AFFINE, (3, 100, 1e-6), bg, 3)
except cv2.error:
    end_fit = np.eye(2, 3, dtype=np.float32)
print('roll end fit', np.round(end_fit, 4).tolist())
roll = []
nr = len(raw['roll'])
for i, f in enumerate(raw['roll']):
    s = np.clip((i - (nr - 1 - 24)) / 24, 0, 1)
    s = s * s * (3 - 2 * s)
    roll.append(tone(warp(f, np.eye(2, 3) + s * (end_fit - np.eye(2, 3))), wheel_key, s) if s > 0 else f)

clips = {'roll': Retimed(roll), 'chassis': Retimed(locked['chassis'], movers(locked['chassis'])),
         'body': Retimed(locked['body'], movers(locked['body'], gate_top=True)),
         'idle': Retimed(locked['idle'], [np.zeros((H // 2, W // 2), np.uint8)] * len(locked['idle']))}   # the idling car only moves where it stands


def clip(k, t):
    t0, t1 = TIMES[k]
    f, m = clips[k].at((t - t0) / (t1 - t0))
    return f if m is None else over(f, m, plate)


# ------------------------------------------------------------------------------------------------ the film
os.makedirs(OUT, exist_ok=True)
if os.environ.get('STILLS'):   # STILLS="6.0,7.5": write just those frames as JPEGs (to check a change quickly)
    STILLS = [float(x) for x in os.environ['STILLS'].split(',')]
master = f'{OUT}/master.mp4'
enc = None if os.environ.get('STILLS') else subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS),
                        '-i', '-', '-vf', 'unsharp=5:5:0.5:5:5:0', '-c:v', 'libx264', '-crf', '10', '-preset', 'medium',
                        '-pix_fmt', 'yuv420p', master], stdin=subprocess.PIPE)
n_total = round(T_END * FPS)
motion, prev = [], None
for n in range(n_total):
    t = n / FPS
    if enc is None and not any(abs(t - x) < 0.5 / FPS for x in STILLS):
        continue
    if t < TIMES['roll'][1]:
        f = clip('roll', t)
    elif t < TIMES['chassis'][1]:
        f = clip('chassis', t)
        if t < TIMES['chassis'][0] + JOIN:              # out of the roll's last frame
            w = (t - TIMES['chassis'][0]) / JOIN
            f = (clips['roll'].at(1.0)[0] * (1 - w) + f * w + 0.5).astype(np.uint8)
    elif t < TIMES['body'][1]:
        t1 = TIMES['body'][1]
        f = clip('body', t)
        if t > t1 - DISSOLVE:
            w = (t - (t1 - DISSOLVE)) / DISSOLVE
            f = (f * (1 - w) + dark_final * w + 0.5).astype(np.uint8)
    elif t < T_FIRE:
        f = lights(t)
    else:
        u = (t - T_FIRE) / (T_END - T_FIRE)
        fi, mi = clips['idle'].at(u)
        a = cv2.GaussianBlur(cv2.resize(mi.astype(np.float32), (W, H)), (0, 0), 2)[..., None]
        a = np.maximum(a, zone)
        f = (final * (1 - a) + fi * a + 0.5).astype(np.uint8)
        edge = min(1.0, (t - T_FIRE) / 0.25, (T_END - 1 / FPS - t) / 0.4)
        f = (final * (1 - edge) + f * edge + 0.5).astype(np.uint8)
    if T_CRANK <= t < T_FIRE:
        dd = CRANK_DIM * (0.85 + 0.15 * np.sin(2 * np.pi * 11 * t)) * lamp
        f = (f * (1 - dd) + off_src * dd + 0.5).astype(np.uint8)
    small = cv2.GaussianBlur(cv2.cvtColor(cv2.resize(f, (480, 270), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 1)
    motion.append(0.0 if prev is None else float(np.abs(small - prev).mean()))
    prev = small
    if enc is None:
        cv2.imwrite(f'{OUT}/still-{t:.2f}.jpg', f, [cv2.IMWRITE_JPEG_QUALITY, 92])
        continue
    enc.stdin.write(f.tobytes())
    if n % 120 == 0:
        print(f'{t:5.2f} s')
if enc is None:
    sys.exit(0)
enc.stdin.close()
enc.wait()

# the film's timing and motion, for tools/make-hero-audio.py
json.dump({'fps': FPS, 'motion': [round(x, 3) for x in motion], 't_fire': T_FIRE, 't_end': n_total / FPS,
           'roll': list(TIMES['roll']), 'assembly': [TIMES['chassis'][0], TIMES['body'][1]], 'banks': BANKS},
          open(f'{A}/roll-motion.json', 'w'))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', master, '-an', '-c:v', 'libx264', '-preset', 'slow', '-tune', 'film', '-crf', '22',
                '-maxrate', '5000k', '-bufsize', '10000k', '-movflags', '+faststart', f'{OUT}/hero-intro.mp4'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', master, '-an', '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '4500k', '-row-mt', '1',
                '-deadline', 'good', '-cpu-used', '2', f'{OUT}/hero-intro.webm'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', master, '-frames:v', '1', '-q:v', '3', f'{OUT}/hero-poster.jpg'], check=True)
print(f'{n_total} frames ({n_total / FPS:.3f} s), lights on at {BANKS}, engine fires at {T_FIRE} s')
