#!/usr/bin/env python3
"""Build the hero film: the car's parts fly into the workshop and assemble into the carbon Evo, its headlights snap on
and it idles, ending on the final frame (assets/generated/carbon-final.jpg), the same car, camera and background as the
final still. Writes assets/site/hero-intro.mp4/.webm (no sound: run tools/mux-hero-audio.sh next) and hero-poster.jpg.

  python3 tools/finish-assembly-film.py

The parts (assets/generated/assembly/, the clips in clips/, not committed):
  keys/empty.jpg      the workshop with the car removed (Kling image edit of the final frame)
  keys/exploded.jpg   the car's parts pulled apart and hanging in the air, headlights dark (exploded-lit.jpg, the
                      first take, had them lit)
  keys/lights-off.jpg the finished car with its headlights off: its two lamps dim the real final frame while cranking
  clips/arrive.mp4    Kling O3 first-last-frame, empty -> exploded: the parts fly in and stop in place
  clips/assemble.mp4  Kling O3, exploded -> the final frame (10 s): the parts fold, spin and lock together with a burst
                      of sparks; the headlights come on as the front section locks
  clips/idle.mp4      Kling O3, final -> final: the finished car idling, headlights on

Timeline (TIMES): the arrival and the assembly are sped up to fit their slots; the assembly's last frames dissolve
into the real final frame (the clip's headlights come on as its front section locks in); while the starter cranks
(T_CRANK) the headlights dim a little, as on a real car, and at T_FIRE the engine fires (tools/make-hero-audio.py) and they come back to full; then the idling car, starting and ending
on the real final frame. 60 fps.

The background never moves: every frame is the real final frame's workshop with only the clip's moving parts on top.
Kling re-renders the walls, wheel wall and ceiling a little differently in each clip (up to 30/255 off), so outside the
car's own place a pixel comes from the clip only where something moves there (it differs from the clip's median frame),
and behind the car's place the plate is the empty-workshop key, blended in softly.
"""
import os
import subprocess
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config_layers import align, load   # noqa: E402

A = 'assets/generated/assembly'
SITE = 'assets/site'
W, H, FPS = 1920, 1080, 60
TIMES = {'arrive': (0.0, 3.4), 'assemble': (3.4, 10.0)}
T_FIRE = 10.0      # the engine fires, as the assembled car settles (T_HEAD in tools/make-hero-audio.py)
T_CRANK = T_FIRE - 0.525
T_END = 15.6
DISSOLVE = 0.25    # assembly -> the real final frame
LAMPS = [(590, 641, 204, 102), (1084, 643, 244, 111)]   # the headlights in the final frame (x, y, w, h)
CRANK_DIM = 0.45   # how far the headlights dim towards off while cranking


def frames(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'scale={W}:{H}:flags=lanczos,setsar=1', '-f', 'rawvideo',
                          '-pix_fmt', 'bgr24', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)


def sample(fr, u):
    """The clip at fraction u (0..1), blending the two nearest frames."""
    k = u * (len(fr) - 1)
    a = int(k)
    w = k - a
    if a >= len(fr) - 1 or w < 0.02:
        return fr[min(a, len(fr) - 1)]
    return (fr[a] * (1 - w) + fr[a + 1] * w + 0.5).astype(np.uint8)


final = load(f'{A}/../carbon-final.jpg')
off_src, _, _ = align(final, load(f'{A}/keys/lights-off.jpg'))
mask = np.zeros((H, W), np.float32)
for x, y, w, h in LAMPS:
    cv2.ellipse(mask, (x + w // 2, y + h // 2), (w // 2 + 18, h // 2 + 16), 0, 0, 360, 1, -1)
mask = cv2.GaussianBlur(mask, (0, 0), 8)[..., None]
final_off = (final * (1 - mask) + off_src * mask + 0.5).astype(np.uint8)

# the car's place in the final frame (the car and its reflection): what the empty-workshop key removed
empty, _, _ = align(final, load(f'{A}/keys/empty.jpg'))
d = np.abs(cv2.GaussianBlur(final.astype(np.float32), (0, 0), 2) - cv2.GaussianBlur(empty.astype(np.float32), (0, 0), 2)).max(2)
car = (d > 30).astype(np.uint8)
n_, lab_, st_, _ = cv2.connectedComponentsWithStats(cv2.morphologyEx(car, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8)), 8)
car = (lab_ == 1 + int(np.argmax(st_[1:, cv2.CC_STAT_AREA]))).astype(np.uint8)
x, y, w, h = cv2.boundingRect(car)
zone = np.zeros((H, W), np.float32)
zone[max(0, y - 30):y + h + 30, max(0, x - 30):x + w + 30] = 1
zone = cv2.GaussianBlur(zone, (0, 0), 20)[..., None]
plate = (final * (1 - zone) + empty * zone + 0.5).astype(np.uint8)


def steady(fr):
    """Each frame aligned onto the fixed workshop: Kling's clips sit a few pixels off the final frame and drift a
    little. Affine fit (ECC) on the background outside the car's place. A fit that strays far from the last good one
    (big moving parts can drag it) is rejected, and the fits are smoothed over time before warping."""
    ref = cv2.GaussianBlur(cv2.cvtColor(cv2.resize(plate, (W // 2, H // 2)), cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 1.5)
    bg = (cv2.resize(zone[..., 0], (W // 2, H // 2)) < 0.05).astype(np.uint8)
    good = np.eye(2, 3, dtype=np.float32)
    fits = []
    for f in fr:
        g = cv2.GaussianBlur(cv2.cvtColor(cv2.resize(f, (W // 2, H // 2)), cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 1.5)
        A = good.copy()
        try:
            _, A = cv2.findTransformECC(ref, g, A, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 60, 1e-5), bg, 3)
            lin = A[:, :2] - np.eye(2)
            if np.abs(lin).max() > 0.03 or np.abs(A[:, 2]).max() > 20 or np.abs(A - good).max() > 4:
                A = good
        except cv2.error:
            A = good
        good = A
        fits.append(A.astype(np.float64))
    F = np.stack(fits)
    k = 7
    Fp = np.pad(F, ((k // 2, k // 2), (0, 0), (0, 0)), mode='edge')
    F = np.stack([np.median(Fp[i:i + k], axis=0) for i in range(len(F))])
    out = []
    for f, A in zip(fr, F):
        M = A.copy(); M[:, 2] *= 2
        out.append(cv2.warpAffine(f, M.astype(np.float32), (W, H), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE))
    return np.stack(out)


def movers(fr):
    """Per frame, at half size: the moving parts (and their reflections). A pixel moves where it falls outside the
    range the fixed workshop covers within a few pixels of it (Kling's backgrounds wobble by a few pixels and shift in
    tone); thin lines and specks are then removed, and the parts filled in and grown a little."""
    p = cv2.GaussianBlur(cv2.resize(plate, (W // 2, H // 2), interpolation=cv2.INTER_AREA), (0, 0), 1.2).astype(np.int16)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    hi, lo = cv2.dilate(p, k).astype(np.int16), cv2.erode(p, k).astype(np.int16)
    out = []
    for f in fr:
        g = cv2.GaussianBlur(cv2.resize(f, (W // 2, H // 2), interpolation=cv2.INTER_AREA), (0, 0), 1.2).astype(np.int16)
        d = np.maximum(g - hi, lo - g).max(2)
        m = (d > 26).astype(np.uint8)
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
        n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
        m = np.isin(lab, [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= 120]).astype(np.uint8)
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21)))
        # fill each part's holes (dark tyres over the dark tool chests barely differ from them)
        inv = (1 - m).astype(np.uint8)
        n, lab, st, _ = cv2.connectedComponentsWithStats(inv, 4)
        border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
        m = (m | np.isin(lab, [i for i in range(1, n) if i not in border and st[i, cv2.CC_STAT_AREA] < 12000])).astype(np.uint8)
        out.append(cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))))
    return out


def over_plate(f, m):
    """The clip's frame f where it moves (mask m, half size) or where the car stands; the fixed workshop elsewhere."""
    a = cv2.GaussianBlur(cv2.resize(m.astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR), (0, 0), 2)[..., None]
    a = np.maximum(a, zone)
    return (plate * (1 - a) + f * a + 0.5).astype(np.uint8)


out = f'{A}/master.mp4'
enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS),
                        '-i', '-', '-vf', 'unsharp=5:5:0.6:5:5:0', '-c:v', 'libx264', '-crf', '10', '-preset', 'medium',
                        '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
clips = {k: steady(frames(f'{A}/clips/{k}.mp4')) for k in ('arrive', 'assemble', 'idle')}
masks = {k: movers(v) for k, v in clips.items()}


def at(k, u):
    """Clip k at fraction u, laid over the fixed workshop."""
    i = int(round(u * (len(clips[k]) - 1)))
    return over_plate(sample(clips[k], u), masks[k][min(i, len(masks[k]) - 1)])
n_total = round(T_END * FPS)
motion, prev = [], None
for n in range(n_total):
    t = n / FPS
    if t < TIMES['arrive'][1]:
        t0, t1 = TIMES['arrive']
        f = at('arrive', (t - t0) / (t1 - t0))
    elif t < TIMES['assemble'][1]:
        t0, t1 = TIMES['assemble']
        f = at('assemble', (t - t0) / (t1 - t0))
        if t > t1 - DISSOLVE:                     # into the real final frame
            w = (t - (t1 - DISSOLVE)) / DISSOLVE
            f = (f * (1 - w) + final * w + 0.5).astype(np.uint8)
    elif t < T_FIRE:
        f = final
    else:
        u = (t - T_FIRE) / (T_END - T_FIRE)
        f = at('idle', u)
        # the idle clip starts and ends on the real final frame: blend it in at both ends
        edge = min(1.0, (t - T_FIRE) / 0.25, (T_END - 1 / FPS - t) / 0.4)
        f = (final * (1 - edge) + f * edge + 0.5).astype(np.uint8)
    if T_CRANK <= t < T_FIRE:   # cranking: the headlights dim and waver, then come back to full as it fires
        d = CRANK_DIM * (0.85 + 0.15 * np.sin(2 * np.pi * 11 * t)) * mask
        f = (f * (1 - d) + off_src * d + 0.5).astype(np.uint8)
    small = cv2.GaussianBlur(cv2.cvtColor(cv2.resize(f, (480, 270), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 1)
    motion.append(0.0 if prev is None else float(np.abs(small - prev).mean()))
    prev = small
    enc.stdin.write(f.tobytes())
enc.stdin.close()
# how much the film moves, frame by frame: tools/make-hero-audio.py times the assembly sounds to it
import json   # noqa: E402
json.dump({'fps': FPS, 'motion': [round(x, 3) for x in motion]}, open(f'{A}/motion.json', 'w'))
enc.wait()
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', out, '-an', '-c:v', 'libx264', '-preset', 'slow', '-tune', 'film', '-crf', '22',
                '-maxrate', '5000k', '-bufsize', '10000k', '-movflags', '+faststart', f'{SITE}/hero-intro.mp4'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', out, '-an', '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '4500k', '-row-mt', '1',
                '-deadline', 'good', '-cpu-used', '2', f'{SITE}/hero-intro.webm'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', out, '-frames:v', '1', '-q:v', '3', f'{SITE}/hero-poster.jpg'], check=True)
print(f'{n_total} frames ({n_total / FPS:.3f} s), engine fires at {T_FIRE} s')
