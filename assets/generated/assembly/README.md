# Hero film: the assembly

The hero film (15.6 s, 60 fps) keeps the old film's final frame, `../carbon-final.jpg`: the full-carbon Evo IX head-on and
centred in the tuning garage, same camera, same background. What leads up to it is new: the car's parts fly into the
empty garage, hang in the air in an exploded view, then fold, spin and lock together into the car like a transforming
machine, its headlights coming on as the front section locks. The engine cranks, fires and idles, and the film rests on
the final frame. `tools/finish-assembly-film.py` builds it; `tools/make-hero-audio.py` makes the sound to fit.

| Part | Made with | From → to |
|---|---|---|
| `keys/empty.jpg` | Kling Image 4.0 edit of the final frame, `prompts/key-empty.txt` | the garage with the car removed |
| `keys/exploded.jpg` | Kling edit of the final frame, `prompts/key-exploded.txt`, then `key-exploded-dark.txt` | every part pulled apart and hanging in the air (headlights dark; `exploded-lit.jpg` is the take before) |
| `keys/lights-off.jpg` | Kling edit, `prompts/key-lightsoff.txt` | the finished car with its headlights off; only its two lamps are used, to dim the real final frame while the starter cranks |
| `clips/arrive.mp4` | Kling O3 first-last-frame (5 s), `prompts/clip-arrive.txt` | `empty` → `exploded`: the chassis drops in, then the engine, wheels and panels fly in and stop in place |
| `clips/assemble.mp4` | Kling O3 (10 s), `prompts/clip-assemble.txt` | `exploded` → the final frame: the parts fold and lock together with sparks; the headlights come on |
| `clips/idle.mp4` | Kling O3 (5 s), `prompts/clip-idle.txt` | the final frame → itself: the car idling |

The clips are not committed (`clips/` is ignored); Higgsfield keeps them for 7 days. Two takes of each were made and the
best kept (`assemble` take b of the version that ends on the final frame).

## Keeping the background untouched

Kling re-renders the walls, wheel wall and ceiling slightly differently in each clip (up to 30/255 off) and drifts the
frame a few pixels, so the finished film never shows its background:

1. Every clip frame is aligned onto the final frame (affine ECC on the background around the car, rejected if it strays
   from the last good fit, smoothed over 7 frames).
2. A pixel comes from the clip only where something moves there: it falls outside the range the real background covers
   within a few pixels of it. Specks and thin lines are dropped and each part's holes filled (dark tyres over the dark
   tool chests barely differ from them).
3. Everywhere else, the frame is the real final frame's workshop; behind where the car stands, the empty-garage key.

So the hexagon ceiling, the neon, the wheel wall and the tool chests are pixel for pixel the final frame's from the first
frame to the last; only the parts and their reflections move.

## Timeline

| Film | What happens |
|---|---|
| 0–3.4 s | the parts arrive (`arrive`, sped up) |
| 3.4–10.0 s | they assemble (`assemble`, sped up), the last 0.25 s dissolving into the real final frame |
| 9.475 s | the starter cranks: the headlights dim and waver |
| 10.0 s | the engine fires, the headlights come back to full; then the idling car to the end |
| 14.675 s | the logo draws in (`LOGO_LEAD` 0.925 s in `src/app.js`) |

`finish-assembly-film.py` also writes `motion.json`: how much the film moves, frame by frame. `make-hero-audio.py` reads it:
the air rush follows it, and each sudden stop of motion (a part landing or locking) gets a metallic clank, some with a
servo whir before and a latch click after, the biggest (the chassis landing) a deep thud.

```bash
python3 tools/finish-assembly-film.py   # needs clips/ and opencv-python-headless
tools/mux-hero-audio.sh                 # synthesises the sound from motion.json and muxes it
npm run build
```

The previous build-up films (liquid → car) and their tools are kept in `../README.md` and `tools/finish-garage-film.sh`.

## The wheel-roll film (preview, not on the site yet)

A second concept, from the client's references (a lone wheel the camera follows, then the car forming around it):
in the dark workshop a single wheel, at its real size, rolls out of the shadows at the back on the left into a pool of
light in the middle, the camera following it and pulling back to the final framing. An axle grows out of its hub, the
frame rails, the other wheels, the coilovers, then the seats and engine come in; the carbon body folds on around it
(doors, floor, roof, bumper, bonnet, with sparks) and the headlights come on. The ceiling lights switch on bank by
bank, back row to front, which lands on the real final frame, and the engine starts as before. 16.6 s.

| Part | Made with | From → to |
|---|---|---|
| `keys/roll/dark-final.jpg` | Kling edit of the final frame, `prompts/roll/key-dark-final.txt` | the lights down: one dim light from above, the red neon faint, the headlights on |
| `keys/roll/dark-empty.jpg` | Kling edit of `dark-final`, `prompts/roll/key-dark-empty.txt` | the car removed (made from the dark frame so the light matches) |
| `keys/roll/wheel-raw.jpg` | Kling edit of `dark-empty` with `dark-final` as the size reference, `prompts/roll/key-wheel.txt` | one wheel in the pool of light; it came out about 1.5x too big |
| `keys/roll/wheel.jpg`, `start-comp.jpg` | `tools/roll-keys.py` | the wheel scaled to real size (a 643 mm wheel at the front axle's depth: a quarter of the frame's height, from the floor's perspective measured on the final frame); the first frame: the camera zoomed 1.45x on the back left, the wheel small there |
| `keys/roll/start.jpg` | Kling edit of `start-comp`, `prompts/roll/key-start.txt` | the small wheel relit in the shadows |
| `keys/roll/chassis.jpg` | Kling edit of `dark-empty` with `dark-final` and `wheel`, `prompts/roll/key-chassis.txt` | the bare rolling chassis where the car stands |
| `clips/roll/roll-b.mp4` | Kling O3 (5 s), `prompts/roll/clip-roll.txt` | `start` → `wheel`: the wheel rolls forward, the camera follows it |
| `clips/roll/chassis-b.mp4` | Kling O3 (5 s), `prompts/roll/clip-chassis.txt` | `wheel` → `chassis` |
| `clips/roll/body-b.mp4` | Kling O3 (5 s), `prompts/roll/clip-body.txt` | `chassis` → `dark-final` |

Two takes of each clip were made; the `b` takes were kept (`chassis-a` and `body-a` were cleaner in places but their
wheels splay or their panels flash white).

`tools/finish-roll-film.py` builds it. The roll keeps Kling's own frames (the camera moves), eased onto the plate over
its last second. From there the camera is locked off and the frames are laid over the dark plate as before, with two
additions: each clip frame's slow tone drift against the plate is taken out first (Kling renders the walls a little
lighter, and the body clip brightens the ceiling light for a while), and the top of the light's cone only comes from
the clip in frames where a part passes through it. Kling's 24 fps is retimed to 60 fps by optical flow rather than by
blending frames. It writes `roll-motion.json` with the film's beats, which `tools/make-hero-audio.py` reads (via
`HERO_MOTION`) for the tyre rolling in and settling, the parts' clanks, and the contactor clunk of each light bank.

```bash
python3 tools/roll-keys.py                         # wheel.jpg and start-comp.jpg from the Kling stills
python3 tools/finish-roll-film.py preview/hero     # or assets/site to ship it
HERO_MOTION=assets/generated/assembly/roll-motion.json python3 tools/make-hero-audio.py hero.wav
```
