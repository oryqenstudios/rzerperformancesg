#!/usr/bin/env python3
"""Synthesise the hero film's sound: the Evo starting as its headlights snap on, one big rev, the blow-off valve,
then pops and bangs on the overrun, in the tuning workshop. Each moment stands on its own, timed to the film
(assets/site/hero-intro.mp4, 60 fps, 15.783 s):

   0      faint workshop room tone (ventilation rumble, light hum); no engine while the car is being built
  10.475  the starter turns the engine over as the car's front sets: rur-rur-rur
  11.0    the engine fires as the headlights snap on (frame 264): a big flare, vroom, then a fast idle
  12.44   a full rev to 7,000 rpm, the turbo spooling
  12.79   throttle shut as the light streak bursts out at the bumper: a loud blow-off valve (psssh)
  13.16   backfires as the revs fall and the streak runs round the car: BANG, pap-pap, BANG, BANG
  14.77   one last BANG as the carbon finishes setting, just before the logo (14.858)
  14.9    settling to idle, fading out under the logo by the end of the film (15.783)

The logo time is the film's length minus LOGO_LEAD in src/app.js; keep the two in step.

The engine is a 4-cylinder 4-stroke: one exhaust pulse per cylinder every two revolutions (rpm / 30 per second),
each a sharp pressure spike ringing the exhaust's resonances, with per-cylinder imbalance for the idle burble and
brighter pulses under load. numpy only and deterministic (fixed seed).

  python3 tools/make-hero-audio.py out.wav [spectrogram.png]

Then tools/mux-hero-audio.sh puts the WAV into assets/site/hero-intro.mp4 and .webm.
"""
import sys
import wave

import numpy as np

SR = 48000
DUR = 15.85
N = int(SR * DUR)
T = np.arange(N) / SR
rng = np.random.default_rng(1729)

# ------------------------------------------------------------------------------------------------ film beats (s)
T_CRANK = 10.475  # starter engages
T_HEAD = 11.0     # headlights snap on: the engine fires
T_CATCH = T_HEAD
T_REV = 12.44     # foot down
T_LIFT = 12.79    # throttle shut: blow-off valve, as the light streak bursts out
POPS = [(13.16, 1.0), (13.27, 0.5), (13.335, 0.5), (13.42, 0.85), (13.54, 1.0),   # (time, size): BANG, pap-pap, BANG, BANG
        (14.77, 1.0)]                                                              # ...and the last BANG before the logo
T_END = 947 / 60  # film ends (15.783 s)
T_LOGO = T_END - 0.925   # the logo starts drawing (LOGO_LEAD 0.925 in app.js): 14.858 s
T_FADE = T_LOGO + 0.1    # idle starts fading out under the logo
IDLE = 1000.0
REDLINE = 7000.0


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
    (T_CATCH, T_CATCH + 0.195, 350, 3300, 'out'),   # fires and flares: vroom
    (T_CATCH + 0.195, T_CATCH + 0.86, 3300, 1450, 'out'),
    (T_CATCH + 0.86, T_REV, 1450, 1300, 'inout'),    # fast idle, slowly settling
    (T_REV, T_LIFT, 1500, REDLINE, 'in'),            # full rev
    (T_LIFT, T_LIFT + 0.87, REDLINE, 2100, 'out'),   # overrun: blow-off, then pops and bangs
    (T_LIFT + 0.87, T_LOGO, 2100, 1150, 'out'),      # revs still falling for the last bang
    (T_LOGO, T_LOGO + 0.45, 1150, IDLE, 'inout'),
], IDLE)
rpm += 35 * np.sin(2 * np.pi * 0.8 * T) * (rpm < 1300)          # idle lope
rpm = smooth(rpm, 0.025)

load = automation([
    (T_CATCH, T_CATCH + 0.175, 1.0, 1.0, 'lin'),
    (T_CATCH + 0.175, T_REV - 0.01, 0.2, 0.2, 'lin'),   # running at a fast idle before the rev
    (T_REV - 0.01, T_LIFT, 1.0, 1.0, 'lin'),
    (T_LIFT, T_LOGO, 0.0, 0.0, 'lin'),
], 0.12)
load[~running] = 0
load = smooth(load, 0.012)
overrun = (load < 0.05) & (rpm > 1500) & running

# idle fades out under the logo; the film ends in silence
fade = np.clip(1 - (T - T_FADE) / (T_END - 0.12 - T_FADE), 0, 1)
fade = fade * fade * (3 - 2 * fade)

# ------------------------------------------------------------------------------------------------ engine
KL = int(0.09 * SR)
kt = np.arange(KL) / SR
# exhaust resonances (Hz, decay s, level): a 3-inch turbo-back system with a straight-through silencer
MODES = [(66, .024, 1.0), (138, .017, .85), (224, .012, .65), (330, .009, .55), (470, .007, .45),
         (690, .005, .3), (985, .004, .2), (1440, .003, .13), (2150, .002, .08), (3300, .0015, .05)]
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
    k += (0.12 + 0.3 * bright) * src[s:s + KL] * np.exp(-kt / (0.004 if bright else 0.003))
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
    loud = (0.12 + 0.88 * ld) * (0.35 + 0.65 * min(r / REDLINE, 1))
    gain = 1 + (CYL_GAIN[c] - 1) * lumpy
    amp = loud / np.sqrt(r / 30 / 240) * gain * rng.lognormal(0, 0.06 if ld > 0.5 else 0.18)
    if overrun[i]:
        amp *= rng.uniform(0.75, 1.1)
    mivec = float(np.clip((r - 4800) / 800, 0, 1))
    b = float(np.clip(ld ** 0.8 * (0.3 + 0.45 * r / REDLINE + 0.25 * mivec), 0, 1))
    eng[j:j + KL] += amp * ((1 - b) * DARK[rng.integers(20)] + b * BRIGHT[rng.integers(20)])
eng = eng[:N]
eng /= np.percentile(np.abs(eng), 99.9)
mivec = np.clip((rpm - 4800) / 800, 0, 1)
drive = 1 + (1.3 + 1.0 * mivec) * load * np.minimum(rpm / REDLINE, 1)   # rasp under load, harder past the MIVEC changeover
x = drive * eng * 0.5
eng = np.tanh(x + 0.18 * x * x) / (drive * 0.5)                 # lopsided: exhaust pulses push harder than they pull, a growl

# induction roar, pulsing with the firing
intake = unit(filt(noise(N), lambda f: band(f, 150, 2500) * peak(f, 420, 1.2, 2.5)))
intake *= load * np.minimum(rpm / REDLINE, 1) * (0.5 + 0.5 * np.cos(2 * np.pi * phase)) ** 2 * 0.08

# ------------------------------------------------------------------------------------------------ turbo
CR = 1000
tc = np.arange(int(DUR * CR)) / CR
target = np.interp(tc, T, load * np.clip((rpm - 2600) / 3600, 0, 1))
spd_c = np.zeros_like(tc)
s = 0.0
for n_, tg in enumerate(target):
    s += (tg - s) * (1 - np.exp(-1 / (CR * (0.18 if tg > s else 0.7))))   # spools up fast, winds down slowly
    spd_c[n_] = s
spd = np.interp(T, tc, spd_c)
fw = 1300 + 4200 * spd + 40 * np.sin(2 * np.pi * 5.3 * T)
pw = np.cumsum(fw) / SR
turbo = (np.sin(2 * np.pi * pw) + 0.25 * np.sin(4 * np.pi * pw + 0.7)) * 0.012 * spd ** 2 * (0.35 + 0.65 * load)
whoosh = unit(filt(noise(N), lambda f: band(f, 700, 2600, 2) * peak(f, 1500, 1.2, 1.8)))
turbo += whoosh * 0.03 * spd ** 2 * load


def blow_off():
    """The blow-off valve venting boost: a full, breathy whoosh whose pitch falls as the pressure drops. Kept mostly
    below 3 kHz, with a low rush of air under it, so it is loud without sounding thin or sharp."""
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    win = int(0.02 * SR)
    hop = win // 2
    w = np.hanning(win)
    src = noise(n + win)
    out = np.zeros(n + win)
    for s0 in range(0, n, hop):
        fc = 1900 * np.exp(-(s0 / SR) / 0.25) + 700
        out[s0:s0 + win] += filt(src[s0:s0 + win] * w, lambda f: band(f, fc * 0.4, fc * 1.5, 3))
    rush = unit(filt(noise(n), lambda f: band(f, 250, 1200, 3)))
    out = unit(0.8 * unit(out[:n]) + 0.6 * rush)
    out = 1.5 * np.tanh(out / 1.5)          # round off the hiss's random peaks, so it can be loud without clipping
    tail = np.clip((t[-1] - t) / 0.1, 0, 1)   # dies away fully before the first bang
    return 0.9 * out * (1 - np.exp(-t / 0.006)) * np.exp(-t / 0.12) * tail


bov = np.zeros(N)
place(bov, blow_off(), T_LIFT + 0.025)

# ------------------------------------------------------------------------------------------------ pops and bangs
CRACK = unit(filt(noise(SR), lambda f: band(f, 500, 5000)))
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
    body = slice_of(BODY) * np.exp(-t / (0.008 + 0.022 * size))
    f0 = rng.uniform(45, 65) * (1 + 0.35 * np.exp(-t / 0.025))
    thump = np.sin(2 * np.pi * np.cumsum(f0) / SR) * np.exp(-t / (0.028 + 0.045 * size))
    rattle = slice_of(RATTLE) * np.exp(-t / 0.03) * (t > 0.004)
    p = (1 - np.exp(-t / 0.0004)) * (0.55 * crack + 0.9 * body + 1.6 * size * thump) + 0.05 * rattle
    return size * np.tanh(1.1 * p)     # a little punch, without squashing the boom into a drone


pops = np.zeros(N)
for t, size in POPS:
    place(pops, pop(size), t)

# ------------------------------------------------------------------------------------------------ start-up
# The starter turning the engine over: each compression stroke is a low chug through the exhaust while the motor
# labours, and between them the motor whirrs a little faster. Rur-rur-rur, until it fires with the headlights.
starter = np.zeros(N)
a, b = at(T_CRANK), at(T_CATCH + 0.04)
t = T[a:b] - T_CRANK
pc = np.cumsum(9.5 + 5.0 * t) / SR                       # compression strokes per second, quickening
m = 0.5 - 0.5 * np.cos(2 * np.pi * pc)                    # 1 at each compression stroke
whirr = unit(filt(noise(b - a), lambda f: band(f, 300, 2500) * peak(f, 1000, 2.0, 2.0)))
grind = unit(filt(noise(b - a), lambda f: band(f, 70, 500)))
env = np.clip(t / 0.02, 0, 1) * np.clip((T_CATCH + 0.04 - T[a:b]) / 0.04, 0, 1)
starter[a:b] = env * ((0.25 + 0.75 * (1 - m)) * 0.016 * whirr + (0.3 + 0.7 * m) * 0.035 * grind)
nc = int(0.12 * SR)
tn = np.arange(nc) / SR
for i in np.flatnonzero(np.diff(np.floor(pc)) > 0):
    chug = 0.16 * np.pad(DARK[rng.integers(20)], (0, nc - KL)) + 0.12 * np.sin(2 * np.pi * 48 * tn) * np.exp(-tn / 0.045)
    place(starter, chug * (1 - np.exp(-tn / 0.003)), T_CRANK + t[i] + 0.03)
place(starter, 0.25 * pop(0.1), T_CRANK)                  # the pinion engaging

# ------------------------------------------------------------------------------------------------ the workshop
amb = 0.004 * unit(filt(noise(N), lambda f: band(f, 25, 400)))
amb += 0.0012 * np.sin(2 * np.pi * 100 * T) + 0.0005 * np.sin(2 * np.pi * 200 * T + 1)   # strip-light hum
amb *= np.clip(T / 0.4, 0, 1)


def car_park_ir():
    """A hard-walled workshop: slaps off the epoxy floor, ceiling and walls, then a tail in which the highs die
    away first. Kept short and low so the moments stay separate."""
    n = int(2.0 * SR)
    t = np.arange(n) / SR
    ir = np.zeros(n)
    for ms, g in [(3.1, .32), (9.4, .28), (16.8, .22), (23.5, .2), (31.0, .17), (38.2, .15),
                  (47.5, .12), (59.0, .1), (71.3, .09), (86.0, .07)]:
        ir[int(ms * SR / 1000 * rng.uniform(0.92, 1.08))] += g * rng.choice([-1, 1])
    ir = filt(ir, lambda f: band(f, None, 4000, 1))
    tail = np.zeros(n)
    for lo, hi, rt in [(20, 250, 1.3), (250, 2000, 1.4), (2000, 9000, 0.9), (9000, 20000, 0.4)]:
        tail += filt(noise(n), lambda f, lo=lo, hi=hi: band(f, lo, hi, 3)) * np.exp(-6.91 * t / rt)
    tail *= np.clip((t - 0.012) / 0.04, 0, 1)
    tail *= np.sqrt(1.5 * np.sum(ir ** 2) / np.sum(tail ** 2))   # the tail carries 1.5x the early energy
    ir += tail
    ir[0] = 0
    return ir / np.sqrt(np.sum(ir ** 2))


engine_bus = (eng + intake) * fade
dry = 0.55 * engine_bus + turbo * fade + bov + 0.55 * pops + starter
send = 0.55 * engine_bus * 0.2 + bov * 0.25 + 0.55 * pops * 0.33 + starter * 0.2
wet = [conv(send, car_park_ir()) for _ in range(2)]
mix = np.stack([dry + 0.5 * wet[0], dry + 0.5 * wet[1]], axis=1) + amb[:, None]
mix = np.stack([filt(mix[:, ch], lambda f: band(f, 28, 10000, 1)) for ch in range(2)], axis=1)


# ------------------------------------------------------------------------------------------------ master
def limit(x, ceiling, release=0.08):
    """Look-ahead peak limiter on 1 ms blocks. Returns the limited signal and its deepest gain reduction (dB)."""
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
    return np.clip(x * gs[:, None], -ceiling, ceiling), -20 * np.log10(g.min()), np.argmin(g) / 1000


def rms_db(x, t0, t1):
    seg = x[at(t0):at(t1)]
    return 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12)


mix *= 10 ** ((-13 - rms_db(mix, T_REV + 0.1, T_LIFT)) / 20)   # the full rev sits at -13 dBFS RMS
mix, reduction, reduction_at = limit(mix, 10 ** (-1 / 20))                     # peaks at -1 dBFS
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
for name, (t0, t1) in {'room tone': (1, T_CRANK - 0.1), 'cranking': (T_CRANK + 0.05, T_CATCH - 0.01),
                       'fires': (T_CATCH, T_CATCH + 0.22), 'fast idle': (T_CATCH + 0.56, T_REV), 'full rev': (T_REV, T_LIFT),
                       'blow-off': (T_LIFT + 0.02, T_LIFT + 0.3), 'pops': (POPS[0][0] - 0.02, POPS[4][0] + 0.12),
                       'last bang': (POPS[-1][0] - 0.02, POPS[-1][0] + 0.12),
                       'idle under logo': (T_LOGO + 0.1, T_LOGO + 0.5)}.items():
    print(f'  {name:16s} {rms_db(mix, t0, t1):6.1f} dBFS RMS')
print(f'  peak {20 * np.log10(np.max(np.abs(mix))):.1f} dBFS, deepest limiting {reduction:.1f} dB at {reduction_at:.2f} s')


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
    for t, label in [(T_CRANK, 'crank'), (T_HEAD, 'headlights: fires'), (T_REV, 'rev'), (T_LIFT, 'blow-off'),
                     (POPS[0][0], 'pops'), (POPS[-1][0], 'bang'), (T_LOGO, 'logo'), (T_END, 'end')]:
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
