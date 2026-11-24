#!/usr/bin/env python3
"""Synthesise the hero film's sound: the Evo starting up, revving, and popping and banging on the overrun in an
echoing underground car park. Every event is timed to the film (assets/site/hero-intro.mp4, 24 fps):

   0     faint car-park room tone (ventilation rumble, strip-light hum)
   6.68  the parking lights glow amber: ignition relay click        6.82  the starter cranks
   7.42  the engine catches, flares and settles to a lumpy idle     8.15  a quick blip, a few pops on the overrun
   8.90  a full rev to 7,300 rpm with the turbo spooling
   9.35  lift-off: blow-off valve, and the first bang lands with the headlights snapping on (9.375, frame 225)
         then a string of pops, crackle and bangs as the revs fall; the last bang is just before the logo (10.34)
  10.3   back to idle, fading out under the logo by the end of the film (12.54)

The engine is a 4-cylinder 4-stroke: one exhaust pulse per cylinder every two revolutions (rpm / 30 per second),
each pulse ringing the exhaust's resonances, with per-cylinder imbalance for the idle burble and brighter, noisier
pulses under load. numpy only and deterministic (fixed seed).

  python3 tools/make-hero-audio.py out.wav [spectrogram.png]

Then tools/mux-hero-audio.sh puts the WAV into assets/site/hero-intro.mp4 and .webm.
"""
import sys
import wave

import numpy as np

SR = 48000
DUR = 12.56
N = int(SR * DUR)
T = np.arange(N) / SR
rng = np.random.default_rng(1729)

# ------------------------------------------------------------------------------------------------ film beats (s)
T_IGN = 6.68      # ignition: the parking lights start to glow
T_CRANK = 6.82    # starter engages
T_CATCH = 7.42    # engine fires
T_LIFT = 9.35     # throttle snaps shut at the top of the big rev
T_HEAD = 9.375    # headlights snap on: the first bang
T_LOGO = 10.34    # the logo starts drawing (film length - LOGO_LEAD in app.js)
T_FADE = 10.9     # idle starts fading out under the logo
T_END = 12.54     # film ends
IDLE = 1000.0
REDLINE = 7300.0


# ------------------------------------------------------------------------------------------------ helpers
def at(t):
    return int(round(t * SR))


def noise(n):
    return rng.standard_normal(n)


def band(f, lo=None, hi=None, order=2):
    g = np.ones_like(f)
    if lo:
        g = g / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * order))
    if hi:
        g = g / np.sqrt(1 + (f / hi) ** (2 * order))
    return g


def peak(f, fc, q, gain):
    return 1 + (gain - 1) / (1 + ((f - fc) / (fc / q)) ** 2)


def filt(x, gain):
    """Zero-phase filter by a magnitude response gain(freqs). Used on noise beds, before any envelope."""
    n = len(x)
    m = 1 << (n - 1).bit_length()
    f = np.fft.rfftfreq(m, 1 / SR)
    return np.fft.irfft(np.fft.rfft(x, m) * gain(f), m)[:n]


def unit(x):
    return x / (np.std(x) + 1e-12)


def conv(x, h):
    n = len(x) + len(h) - 1
    m = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(h, m), m)[:len(x)]


def smooth(x, sec):
    n = max(1, int(sec * SR))
    c = np.cumsum(np.pad(x, (n // 2, n - n // 2), mode='edge'))
    return (c[n:] - c[:-n]) / n


def shape(u, kind):
    u = np.clip(u, 0, 1)
    if kind == 'out':      # fast start, slowing down (revs falling back)
        return 1 - (1 - u) ** 2
    if kind == 'in':       # slightly accelerating (revs climbing as boost builds)
        return u ** 1.25
    if kind == 'inout':
        return u * u * (3 - 2 * u)
    return u


def automation(segments, default):
    out = np.full(N, float(default))
    for t0, t1, v0, v1, kind in segments:
        a, b = at(t0), at(t1)
        out[a:b] = v0 + (v1 - v0) * shape((T[a:b] - t0) / (t1 - t0), kind)
    return out


def place(bus, sig, t):
    i = at(t)
    if i >= len(bus):
        return
    n = min(len(sig), len(bus) - i)
    bus[i:i + n] += sig[:n]


# ------------------------------------------------------------------------------------------------ the drive
running = T >= T_CATCH
rpm = automation([
    (T_CATCH, 7.60, 380, 2700, 'out'),        # catches and flares
    (7.60, 8.00, 2700, 1120, 'out'),
    (8.00, 8.15, 1120, IDLE, 'inout'),
    (8.15, 8.32, IDLE, 4800, 'in'),           # blip
    (8.32, 8.85, 4800, 1150, 'out'),
    (8.85, 8.90, 1150, 1100, 'lin'),
    (8.90, T_LIFT, 1100, REDLINE, 'in'),      # full rev
    (T_LIFT, 10.30, REDLINE, 1250, 'out'),    # overrun: pops and bangs
    (10.30, 10.90, 1250, IDLE, 'inout'),
], IDLE)
rpm += 35 * np.sin(2 * np.pi * 0.8 * T) * (rpm < 1300)          # idle lope
rpm = smooth(rpm, 0.025)

load = automation([
    (T_CATCH, 7.56, 0.65, 0.65, 'lin'),
    (8.14, 8.315, 1.0, 1.0, 'lin'),
    (8.315, 8.85, 0.0, 0.0, 'lin'),
    (8.89, T_LIFT, 1.0, 1.0, 'lin'),
    (T_LIFT, 10.28, 0.0, 0.0, 'lin'),
], 0.12)
load[~running] = 0
load = smooth(load, 0.012)
overrun = (load < 0.05) & (rpm > 1500) & running

# idle fades out under the logo; the film ends in silence
fade = np.clip(1 - (T - T_FADE) / (12.42 - T_FADE), 0, 1)
fade = fade * fade * (3 - 2 * fade)

# ------------------------------------------------------------------------------------------------ engine
KL = int(0.09 * SR)
kt = np.arange(KL) / SR
# exhaust resonances (Hz, decay s, level): a 3-inch turbo-back system with a straight-through silencer
MODES = [(78, .022, 1.0), (151, .016, .85), (236, .012, .65), (334, .009, .5), (468, .007, .38),
         (690, .005, .28), (985, .004, .2), (1440, .003, .13), (2150, .002, .08), (3300, .0015, .05)]
NOISE_DARK = unit(filt(noise(SR * 2), lambda f: band(f, 60, 2200) * peak(f, 320, 1.5, 2.0)))
NOISE_BRIGHT = unit(filt(noise(SR * 2), lambda f: band(f, 90, 7000) * peak(f, 1600, 1.0, 2.0)))


def kernel(bright):
    """One exhaust pulse: a sharp pressure spike ringing the exhaust's resonances, plus a little combustion noise."""
    tau_p = 0.0007 if bright else 0.0011
    k = 2.2 * (kt / tau_p) * np.exp(1 - kt / tau_p)
    for f, tau, a in MODES:
        g = a * ((0.45 + 1.4 * bright) if f > 400 else 1.0) * rng.uniform(0.8, 1.2)
        f = f * (1 + rng.uniform(-0.03, 0.03))
        k += g * np.exp(-kt / tau) * np.sin(2 * np.pi * f * kt + rng.uniform(-0.6, 0.6))
    src = NOISE_BRIGHT if bright else NOISE_DARK
    s = rng.integers(0, len(src) - KL)
    k += (0.15 + 0.4 * bright) * src[s:s + KL] * np.exp(-kt / (0.004 if bright else 0.003))
    k *= 1 - np.exp(-kt / 0.0005)
    return k / np.sqrt(np.mean(k ** 2))


DARK = [kernel(0) for _ in range(20)]
BRIGHT = [kernel(1) for _ in range(20)]
CYL_GAIN = [1.0, 0.84, 1.07, 0.91]      # slight imbalance: the 4-cylinder burble at idle
CYL_SHIFT = [0.0, 0.035, -0.02, 0.03]   # fraction of a firing interval

phase = np.cumsum(np.where(running, rpm / 30.0, 0)) / SR
events = np.searchsorted(phase, np.arange(1, int(phase[-1])))
eng = np.zeros(N + KL)
for k, i in enumerate(events, start=1):
    c = k % 4
    r, ld = rpm[i], load[i]
    period = 30.0 / r
    lumpy = float(np.clip(1.6 - r / 2500, 0.15, 1))
    j = i + int((CYL_SHIFT[c] * lumpy + rng.normal(0, 0.008 if ld > 0.5 else 0.025)) * period * SR)
    if j < 0 or j >= N:
        continue
    if overrun[i] and rng.random() < 0.3:
        continue                                                  # overrun: some cycles barely fire
    loud = (0.12 + 0.88 * ld) * (0.35 + 0.65 * min(r / REDLINE, 1))
    gain = 1 + (CYL_GAIN[c] - 1) * lumpy
    amp = loud / np.sqrt(r / 30 / 240) * gain * rng.lognormal(0, 0.06 if ld > 0.5 else 0.2)
    if overrun[i]:
        amp *= rng.uniform(0.5, 1.4)
    b = float(np.clip(ld ** 0.8 * (0.4 + 0.6 * r / REDLINE), 0, 1))
    eng[j:j + KL] += amp * ((1 - b) * DARK[rng.integers(20)] + b * BRIGHT[rng.integers(20)])
eng = eng[:N]
eng /= np.percentile(np.abs(eng), 99.9)
drive = 1 + 1.5 * load * np.minimum(rpm / REDLINE, 1)          # rasp under load
eng = np.tanh(drive * eng * 0.5) / (drive * 0.5)

# induction roar, pulsing with the firing
intake = unit(filt(noise(N), lambda f: band(f, 150, 2500) * peak(f, 420, 1.2, 2.5)))
intake *= load * np.minimum(rpm / REDLINE, 1) * (0.5 + 0.5 * np.cos(2 * np.pi * phase)) ** 2 * 0.1

# ------------------------------------------------------------------------------------------------ turbo
CR = 1000
tc = np.arange(int(DUR * CR)) / CR
target = np.interp(tc, T, load * np.clip((rpm - 2600) / 3800, 0, 1))
spd_c = np.zeros_like(tc)
s = 0.0
for n_, tg in enumerate(target):
    s += (tg - s) * (1 - np.exp(-1 / (CR * (0.22 if tg > s else 0.7))))   # spools up fast, winds down slowly
    spd_c[n_] = s
spd = np.interp(T, tc, spd_c)
fw = 1700 + 6800 * spd + 60 * np.sin(2 * np.pi * 5.3 * T)
pw = np.cumsum(fw) / SR
turbo = (np.sin(2 * np.pi * pw) + 0.25 * np.sin(4 * np.pi * pw + 0.7)) * 0.03 * spd ** 2 * (0.35 + 0.65 * load)


def blow_off(strength):
    """The blow-off valve venting boost: a hiss whose pitch falls as the pressure drops."""
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    win = int(0.02 * SR)
    hop = win // 2
    w = np.hanning(win)
    src = noise(n + win)
    out = np.zeros(n + win)
    for s0 in range(0, n, hop):
        fc = 5200 * np.exp(-(s0 / SR) / 0.35) + 1800
        out[s0:s0 + win] += filt(src[s0:s0 + win] * w, lambda f: band(f, fc * 0.45, fc * 1.6))
    out = unit(out[:n])
    return strength * 0.22 * out * (1 - np.exp(-t / 0.006)) * np.exp(-t / 0.16)


bov = np.zeros(N)
place(bov, blow_off(0.25), 8.318)            # small one after the blip
place(bov, blow_off(1.0), T_LIFT + 0.004)    # full boost dumped at the top of the big rev

# ------------------------------------------------------------------------------------------------ pops and bangs
CRACK = unit(filt(noise(SR), lambda f: band(f, 700, 12000)))
BODY = unit(filt(noise(SR), lambda f: band(f, 120, 2400) * peak(f, 420, 1.3, 2.5)))
RATTLE = unit(filt(noise(SR), lambda f: band(f, 1500, 5000, 3)))


def pop(size):
    """Unburnt fuel igniting in the exhaust: a crack, a body, a low thump and a little tip rattle."""
    n = int(0.25 * SR)
    t = np.arange(n) / SR

    def slice_of(src):
        s0 = rng.integers(0, len(src) - n)
        return src[s0:s0 + n]

    crack = slice_of(CRACK) * np.exp(-t / rng.uniform(0.0015, 0.004))
    body = slice_of(BODY) * np.exp(-t / (0.008 + 0.02 * size))
    f0 = rng.uniform(55, 85) * (1 + 0.3 * np.exp(-t / 0.02))
    thump = np.sin(2 * np.pi * np.cumsum(f0) / SR) * np.exp(-t / (0.03 + 0.05 * size))
    rattle = slice_of(RATTLE) * np.exp(-t / 0.05) * (t > 0.004)
    p = (1 - np.exp(-t / 0.00015)) * (0.9 * crack + 0.8 * body + 1.6 * size * thump) + 0.06 * rattle
    return size * np.tanh(1.5 * p)


POPS = [(8.40, .45), (8.46, .2), (8.50, .3), (8.57, .55), (8.64, .2), (8.72, .35),          # after the blip
        (T_HEAD, 1.0), (9.45, .4), (9.50, .3), (9.58, .6), (9.62, .25), (9.71, .75), (9.77, .35),
        (9.84, .4), (9.93, .9), (10.00, .3), (10.06, .45), (10.13, .35), (10.27, 1.0)]  # last bang before the logo
SYNCED = {T_HEAD, 10.27}
CRACKLE = [(8.51, 8.55), (9.465, 9.55), (9.64, 9.69), (9.86, 9.91), (10.07, 10.12)]   # machine-gun crackle
for a, b in CRACKLE:
    t = a
    while t < b:
        POPS.append((t, rng.uniform(0.06, 0.18)))
        t += rng.uniform(0.012, 0.028)
pops = np.zeros(N)
for t, size in POPS:
    place(pops, pop(size), t + (0 if t in SYNCED else rng.normal(0, 0.006)))

# ------------------------------------------------------------------------------------------------ start-up
starter = np.zeros(N)
a, b = at(T_CRANK), at(T_CATCH + 0.07)
t = T[a:b] - T_CRANK
pc = np.cumsum(7.6 + 2.2 * t) / SR                       # compressions per second rise as it spins up
m = 0.5 - 0.5 * np.cos(2 * np.pi * pc)                    # 1 at each compression stroke
fs_ = 290 * (1 - 0.13 * m) * (1 + 0.6 * np.clip((T[a:b] - T_CATCH) / 0.07, 0, 1))   # freewheels as it catches
ps = np.cumsum(fs_) / SR
whine = sum(np.sin(2 * np.pi * h * ps + h) / h ** 1.1 for h in range(1, 10))
mech = unit(filt(noise(b - a), lambda f: band(f, 900, 6000)))
env = np.clip(t / 0.03, 0, 1) * np.clip((T_CATCH + 0.07 - T[a:b]) / 0.07, 0, 1)
starter[a:b] = env * (0.5 + 0.5 * m) * (0.035 * whine + 0.007 * mech)
for i in np.flatnonzero(np.diff(np.floor(pc)) > 0):       # each compression puffs through the exhaust
    place(starter, 0.07 * DARK[rng.integers(20)], T_CRANK + t[i] + 0.02)
place(starter, 0.35 * pop(0.12), T_CRANK)                 # the pinion engaging
n = int(0.03 * SR)
tt = np.arange(n) / SR
click = 0.05 * (unit(filt(noise(n), lambda f: band(f, 1000, 6000))) * np.exp(-tt / 0.0015)
                + np.sin(2 * np.pi * 2800 * tt) * np.exp(-tt / 0.004))
place(starter, click, T_IGN)                              # ignition relay

# ------------------------------------------------------------------------------------------------ the car park
amb = 0.004 * unit(filt(noise(N), lambda f: band(f, 25, 400)))
amb += 0.0012 * np.sin(2 * np.pi * 100 * T) + 0.0005 * np.sin(2 * np.pi * 200 * T + 1)   # strip-light hum
amb *= np.clip(T / 0.4, 0, 1)


def car_park_ir():
    """Concrete underground car park: discrete slaps off the floor, ceiling and pillars, then a long tail
    in which the highs die away first."""
    n = int(2.8 * SR)
    t = np.arange(n) / SR
    ir = np.zeros(n)
    for ms, g in [(3.1, .32), (9.4, .28), (16.8, .22), (23.5, .2), (31.0, .17), (38.2, .15),
                  (47.5, .12), (59.0, .1), (71.3, .09), (86.0, .07)]:
        ir[int(ms * SR / 1000 * rng.uniform(0.92, 1.08))] += g * rng.choice([-1, 1])
    ir = filt(ir, lambda f: band(f, None, 6000, 1))
    tail = np.zeros(n)
    for lo, hi, rt in [(20, 250, 1.9), (250, 2000, 2.0), (2000, 9000, 1.1), (9000, 20000, 0.5)]:
        tail += filt(noise(n), lambda f, lo=lo, hi=hi: band(f, lo, hi, 3)) * np.exp(-6.91 * t / rt)
    tail *= np.clip((t - 0.012) / 0.04, 0, 1)
    tail *= np.sqrt(3 * np.sum(ir ** 2) / np.sum(tail ** 2))   # the tail carries 3x the early energy
    ir += tail
    ir[0] = 0
    return ir / np.sqrt(np.sum(ir ** 2))


engine_bus = (eng + intake) * fade
dry = 0.55 * engine_bus + turbo * fade + bov + 0.9 * pops + starter
send = 0.55 * engine_bus * 0.30 + bov * 0.35 + 0.9 * pops * 0.60 + starter * 0.30
wet = [conv(send, car_park_ir()) for _ in range(2)]
mix = np.stack([dry + 0.9 * wet[0], dry + 0.9 * wet[1]], axis=1) + amb[:, None]
mix = np.stack([filt(mix[:, ch], lambda f: band(f, 28, 16000, 2)) for ch in range(2)], axis=1)


# ------------------------------------------------------------------------------------------------ master
def limit(x, ceiling, release=0.12):
    """Look-ahead peak limiter on 1 ms blocks."""
    blk = SR // 1000
    a = np.max(np.abs(x), axis=1)
    nb = -(-len(a) // blk)
    bm = np.zeros(nb * blk)
    bm[:len(a)] = a
    bm = np.pad(bm.reshape(nb, blk).max(1), (1, 4))
    look = np.max(np.stack([bm[i:i + nb] for i in range(6)]), axis=0)
    target = np.minimum(1, ceiling / np.maximum(look, 1e-9))
    g = np.empty(nb)
    cur = 1.0
    rel = np.exp(-1 / (release * 1000))
    for i, tg in enumerate(target):
        cur = tg if tg < cur else tg + (cur - tg) * rel
        g[i] = cur
    gs = np.interp(np.arange(len(a)), np.arange(nb) * blk + blk / 2, g)
    return np.clip(x * gs[:, None], -ceiling, ceiling)


def rms_db(x, t0, t1):
    seg = x[at(t0):at(t1)]
    return 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12)


mix *= 10 ** ((-13 - rms_db(mix, 9.0, T_LIFT)) / 20)   # the full rev sits at -13 dBFS RMS
mix = limit(mix, 10 ** (-1 / 20))                        # peaks at -1 dBFS
edge = np.clip(np.minimum(T / 0.01, (T_END - T) / 0.05), 0, 1)
mix *= edge[:, None]

out = sys.argv[1] if len(sys.argv) > 1 else 'hero-audio.wav'
pcm = np.clip(mix * 32767 + rng.uniform(-0.5, 0.5, mix.shape) + rng.uniform(-0.5, 0.5, mix.shape), -32768, 32767)
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.astype('<i2').tobytes())
print('wrote', out)
for name, (t0, t1) in {'room tone': (1, 6), 'starter': (6.9, 7.4), 'idle': (8.0, 8.14), 'blip': (8.15, 8.32),
                       'full rev': (8.9, T_LIFT), 'pops': (T_LIFT, 10.32), 'idle under logo': (10.9, 11.5)}.items():
    print(f'  {name:16s} {rms_db(mix, t0, t1):6.1f} dBFS RMS')
print(f'  peak {20 * np.log10(np.max(np.abs(mix))):.1f} dBFS')


# ------------------------------------------------------------------------------------------------ spectrogram
def spectrogram(x, path):
    from PIL import Image, ImageDraw
    win, hop = 2048, 240
    frames = 1 + (len(x) - win) // hop
    ix = np.arange(win)[None, :] + hop * np.arange(frames)[:, None]
    mag = np.abs(np.fft.rfft(x[ix] * np.hanning(win), axis=1))
    db = 20 * np.log10(mag + 1e-9)
    db = np.clip((db - db.max() + 80) / 80, 0, 1)
    freqs = np.fft.rfftfreq(win, 1 / SR)
    H = 420
    rows = np.exp(np.linspace(np.log(12000), np.log(30), H))
    img = np.stack([np.interp(rows, freqs, db[i]) for i in range(frames)], axis=1)
    rgb = np.stack([np.clip(img * 1.6, 0, 1), np.clip(img * 1.6 - 0.5, 0, 1), np.clip(img * 2 - 1.4, 0, 1)], -1)
    env = np.array([np.sqrt(np.mean(x[i * hop:i * hop + win] ** 2)) for i in range(frames)])
    env_db = np.clip((20 * np.log10(env + 1e-9) + 60) / 60, 0, 1)
    top = np.zeros((90, frames, 3))
    for i, v in enumerate(env_db):
        top[90 - int(v * 88):, i] = (0.75, 0.78, 0.8)
    im = Image.fromarray((np.concatenate([top, rgb]) * 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    for t, label in [(T_IGN, 'ignition'), (T_CATCH, 'catch'), (8.15, 'blip'), (8.9, 'rev'), (T_HEAD, 'headlights'),
                     (T_LOGO, 'logo'), (T_END, 'end')]:
        xpos = int(t * SR / hop)
        d.line([(xpos, 0), (xpos, im.height)], fill=(80, 200, 255))
        d.text((xpos + 3, 2), label, fill=(255, 255, 255))
    for f in (100, 1000, 10000):
        y = 90 + int(np.interp(np.log(f), np.log(rows[::-1]), np.arange(H)[::-1]))
        d.text((2, y - 6), f'{f} Hz', fill=(255, 255, 0))
    im.save(path)
    print('wrote', path)


if len(sys.argv) > 2:
    spectrogram(mix.mean(axis=1), sys.argv[2])
