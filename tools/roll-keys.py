#!/usr/bin/env python3
"""Build the keyframes of the wheel-roll hero film from its Kling stills (assets/generated/assembly/keys/roll/):

  dark-final.jpg  the final frame with the workshop's lights down (one dim light from above, faint red neon)
  dark-empty.jpg  the same with the car removed: the plate every frame before the lights come on is laid over
  wheel-raw.jpg   a single wheel standing in the pool of light, seen from the front like the car's front wheels
                  (tread to the camera); Kling made it about 1.8x too big

Writes:
  wheel.jpg  the wheel at its real size (a 17-inch wheel, 643 mm, at the depth of the car's front axle: about a
             quarter of the frame's height), on the plate
  start-comp.jpg  the film's first frame: the camera zoomed straight ahead at the back of the workshop, the same
             wheel small and in shadow by the back wall, about to roll straight towards the camera into the light
             (1920x1080; tools/higgsfield-edit.sh then relights it into start.jpg)

The floor's perspective is measured from the final frame: the horizon sits at 55% of the frame's height and a wheel's
height in the frame is 0.846 x (its contact line's height - 0.55), in frame heights.

  python3 tools/roll-keys.py
"""
import cv2
import numpy as np

K = 'assets/generated/assembly/keys/roll'
HORIZON, SIZE = 0.55, 0.846          # wheel height (frame heights) = SIZE * (contact y - HORIZON)
ASPECT = 0.38                        # a 235/45 R17 tyre seen from the front: about 245 mm wide, 643 mm tall
CONTACT = 0.865                      # where it stands: on the line of the car's front axle (as in chassis.jpg)
START = (0.5, 0.635)                 # where the wheel starts: its contact point, as fractions of the frame
VIEW = (1.45, 0.5, 0.60)             # the first frame's camera: zoom, and the centre of its view (straight ahead)

e = cv2.imread(f'{K}/dark-empty.jpg')
w = cv2.imread(f'{K}/wheel-raw.jpg')
H, W = e.shape[:2]
# Kling's edit sits a few pixels off the plate: line it up (translation)
g = lambda im: cv2.cvtColor(cv2.resize(im, (W // 2, H // 2)), cv2.COLOR_BGR2GRAY).astype(np.float32)
_, T = cv2.findTransformECC(g(e), g(w), np.eye(2, 3, dtype=np.float32), cv2.MOTION_TRANSLATION, (3, 100, 1e-5), None, 5)
T[:, 2] *= 2
w = cv2.warpAffine(w, T, (W, H), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)

# the wheel: what changed against the plate, above the line where it meets the floor
d = np.abs(cv2.GaussianBlur(w.astype(np.float32), (0, 0), 3) - cv2.GaussianBlur(e.astype(np.float32), (0, 0), 3)).max(2)
ch = (d > 18).astype(np.uint8)
ch[:int(0.4 * H)] = 0                    # the wheel stands on the floor (the edit also touched the ceiling a little)
n, lab, st, _ = cv2.connectedComponentsWithStats(cv2.morphologyEx(ch, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8)), 8)
ch = (lab == 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))).astype(np.uint8) * ch
rows = [(y, np.where(ch[y])[0]) for y in range(H)]
span = [(y, xs.min(), xs.max()) for y, xs in rows if len(xs) and xs.max() - xs.min() < 0.3 * W]
top = min(y for y, _, _ in span)
widths = {y: b - a for y, a, b in span}
# the contact line: below the wheel's widest row, where the changed region suddenly widens (its shadow on the floor)
mid = max(widths, key=lambda y: widths[y] if y < top + 0.8 * (H * 0.9 - top) else 0)
contact = next(y for y in range(mid, H) if y not in widths or widths[y] > 1.15 * widths[mid])
xs = [(a, b) for y, a, b in span if top <= y < contact]
x0, x1 = min(a for a, _ in xs), max(b for _, b in xs)
cx = (x0 + x1) / 2
height = contact - top
# Kling draws the tyre too wide for its height: narrow it to a real tyre's proportions
mid = [b - a for y, a, b in span if top + 0.2 * height <= y < contact - 0.1 * height]
aspect = float(np.median(mid)) / height
narrow = min(1.0, ASPECT / aspect)
print(f'wheel: x {x0}-{x1}, y {top}-{contact} ({height / H:.3f} of the frame), width/height {aspect:.2f} -> x{narrow:.2f}')

body = np.zeros((H, W), np.uint8)
cv2.ellipse(body, (int(cx), int((top + contact) / 2)), (int((x1 - x0) / 2 + 10), int(height / 2 + 10)), 0, 0, 360, 255, -1)
body[contact + 4:] = 0
under = np.zeros((H, W), np.uint8)       # its contact shadow and reflection on the floor
cv2.ellipse(under, (int(cx), int(contact + 0.06 * height)), (int((x1 - x0) * 0.62), int(0.16 * height)), 0, 0, 360, 255, -1)
patch = cv2.GaussianBlur(np.maximum(body, under), (0, 0), 6).astype(np.float32) / 255


def paste(base, scale, at, gain=1.0, region=patch, reflect=0.0):
    """The wheel scaled by `scale` (and narrowed to a real tyre's width) about its contact point, moved to `at`
    (pixels), over `base`."""
    sx = scale * narrow
    M = np.float32([[sx, 0, at[0] - sx * cx], [0, scale, at[1] - scale * contact]])
    src = np.clip(w.astype(np.float32) * gain, 0, 255)
    img = cv2.warpAffine(src, M, (W, H), flags=cv2.INTER_AREA)
    a = cv2.warpAffine(region, M, (W, H), flags=cv2.INTER_LINEAR)[..., None]
    out = base.astype(np.float32) * (1 - a) + img * a
    if reflect:   # a faint mirror image in the glossy floor
        F = np.float32([[sx, 0, at[0] - sx * cx], [0, -scale, at[1] + scale * contact]])
        ref = cv2.GaussianBlur(cv2.warpAffine(src, F, (W, H), flags=cv2.INTER_AREA), (0, 0), 2.5)
        ra = cv2.GaussianBlur(cv2.warpAffine(body.astype(np.float32) / 255, F, (W, H)), (0, 0), 3)[..., None] * reflect
        out = out * (1 - ra) + ref * ra
    return np.clip(out, 0, 255).astype(np.uint8)


def shadow(base, size, at, depth):
    """A soft contact shadow on the floor under a wheel `size` frame heights tall standing at `at` (pixels)."""
    sh = np.zeros((H, W), np.float32)
    cv2.ellipse(sh, (int(at[0]), int(at[1])), (int(size * H * ASPECT * 0.85), int(size * H * 0.05)), 0, 0, 360, 1, -1)
    sh = cv2.GaussianBlur(sh, (0, 0), size * H * 0.04)[..., None]
    return (base.astype(np.float32) * (1 - depth * sh)).astype(np.uint8)


body_soft = cv2.GaussianBlur(body, (0, 0), 3).astype(np.float32) / 255
real = SIZE * (CONTACT - HORIZON)
at = (W / 2, CONTACT * H)
wheel = paste(shadow(e, real, at, 0.7), real / (height / H), at, region=body_soft, reflect=0.3)
cv2.imwrite(f'{K}/wheel.jpg', wheel, [cv2.IMWRITE_JPEG_QUALITY, 95])
print(f'real size {real:.3f} of the frame: scaled by {real / (height / H):.3f}')

# the first frame: the same wheel far back on the left, out of the light (darker), and the camera zoomed in on it
sx, sy = START
small = SIZE * (sy - HORIZON)
start = paste(shadow(e, small, (sx * W, sy * H), 0.55), small / (height / H), (sx * W, sy * H), gain=0.5, region=body_soft, reflect=0.35)
z, vx, vy = VIEW
vw, vh = W / z, H / z
x0, y0 = int(round(vx * W - vw / 2)), int(round(vy * H - vh / 2))
crop = start[y0:y0 + int(vh), x0:x0 + int(vw)]
cv2.imwrite(f'{K}/start-comp.jpg', cv2.resize(crop, (1920, 1080), interpolation=cv2.INTER_CUBIC), [cv2.IMWRITE_JPEG_QUALITY, 95])
print(f'start: wheel {small:.3f} of the frame, {small * z:.3f} of the zoomed view; view {x0},{y0} {vw:.0f}x{vh:.0f}')
