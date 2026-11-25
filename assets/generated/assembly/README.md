# Hero films

The shipped hero film is the **swarm film** (last section below): a 3D car assembly breakdown seen from a high corner,
then a swing round to the head-on final frame. The two sections before it describe the earlier films (the transforming
assembly, the first one below, and the wheel roll), whose tools are kept for reference.

## The assembly film (earlier)

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

## The wheel-roll film (an earlier preview, superseded by the swarm film below)

A second concept, from the client's references (a lone wheel the camera follows, then the car forming around it):
in the dark workshop a single wheel rolls straight towards the camera from the back wall into a pool of light in the
middle, the camera pulling back with it. An axle extends sideways out of its hub, the wheels slide out along it, the
rear wheels, frame rails and coilovers come in, then the seats and engine; the carbon body folds on around it (doors,
floor, roof, bumper, bonnet, with sparks) and the headlights come on. The ceiling lights switch on bank by bank, back
row to front, which lands on the real final frame, and the engine starts as before. 16.6 s.

The client asked for everything to be seen from the front, like the final frame (the wheel never turns to show its
rim's face, the camera never pans or turns), and for real sizes and proportions throughout. So the wheel is a 235/45
R17 seen tread-on: 643 mm tall and about 245 mm wide (0.38 of its height), standing on the line of the car's front
axle, its size in the frame set by the floor's perspective, measured on the final frame (the horizon at 55% of the
frame's height; a wheel's height is 0.846 x (its contact line's height - 0.55) frame heights).

| Part | Made with | From → to |
|---|---|---|
| `keys/roll/dark-final.jpg` | Kling edit of the final frame, `prompts/roll/key-dark-final.txt` | the lights down: one dim light from above, the red neon faint, the headlights on |
| `keys/roll/dark-empty.jpg` | Kling edit of `dark-final`, `prompts/roll/key-dark-empty.txt` | the car removed (made from the dark frame so the light matches) |
| `keys/roll/wheel-raw.jpg` | Kling edit of `dark-empty` with `dark-final` as the size reference, `prompts/roll/key-wheel-front.txt` | one wheel seen from the front in the pool of light; it came out about 1.4x too big and too wide |
| `keys/roll/wheel.jpg`, `start-comp.jpg` | `tools/roll-keys.py` | the wheel at real size and proportions on the front axle's line (a quarter of the frame's height); the first frame: the camera zoomed 1.45x straight ahead, the wheel small by the back wall |
| `keys/roll/chassis.jpg` | Kling edit of `dark-empty` with `dark-final` and a wheel, `prompts/roll/key-chassis.txt` | the bare rolling chassis where the car stands |
| `clips/roll/roll-fcomp.mp4` | Kling O3 (5 s), `prompts/roll/clip-roll.txt` | `start-comp` → `wheel`: the wheel rolls straight towards the camera, upright, tread on; the camera pulls back |
| `clips/roll/chassis-fb.mp4` | Kling O3 (5 s), `prompts/roll/clip-chassis.txt` | `wheel` → `chassis`, every wheel kept facing the camera |
| `clips/roll/body-b.mp4` | Kling O3 (5 s), `prompts/roll/clip-body.txt` | `chassis` → `dark-final` |

Two takes of the chassis and body clips were made (`chassis-fa` turned some wheels sideways; `body-a` flashes its
panels white). The first version had the wheel roll in diagonally, turned to show its spokes; it was replaced.

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

## The swarm film (the shipped hero film)

After the client's reference, a 3D car assembly breakdown: one camera, high and in front of the car's front-left
corner, looking down at the car in a front three-quarter view, pushing in slowly. In the lit workshop a swarm of small
parts (bolts, bearings, pistons, cams, the turbo) flies in and builds the engine in mid-air, the suspension and brakes
gather round it; the chassis frame drops in underneath, the suspension and wheels fly to the corners and the bare body
shell forms; then the carbon panels lock on, doors, roof, bonnet, the front bumper last. The camera then swings down and
round to the head-on final frame (the client chose to keep the site's ending), the headlights come on, and the engine
starts as before. 15.6 s, the same beats after the build as the assembly film (fires at 10.0 s).

| Part | Made with | From → to |
|---|---|---|
| `keys/swarm/car34.jpg` | Kling edit of the final frame and `keys/empty.jpg`, `prompts/swarm/key-car34.txt` | the same car in the same place, the camera moved high into the front corner by the wheel wall (the first three takes turned the car instead of moving the camera; the prompt spells out how the room looks from there) |
| `keys/swarm/empty34.jpg` | Kling edit of `car34`, `prompts/swarm/key-empty34.txt` | the car removed: the plate |
| `keys/swarm/engine34.jpg` | Kling edit of `car34`, `prompts/swarm/key-engine34.txt` | the engine in mid-air with its parts, the suspension and brakes around it |
| `keys/swarm/chassis34.jpg` | Kling edit of `car34`, `prompts/swarm/key-chassis34.txt` | the rolling chassis with the bare metal body shell |
| `keys/swarm/car34-push.jpg` | crop of `car34` | the end of the push-in (1.15x towards the car): the swing's first frame |
| `clips/swarm/engine-b.mp4` | Kling O3 (5 s), `prompts/swarm/clip-engine.txt` | `empty34` → `engine34` |
| `clips/swarm/chassis-b.mp4` | Kling O3 (5 s), `prompts/swarm/clip-chassis.txt` | `engine34` → `chassis34` |
| `clips/swarm/body-b.mp4` | Kling O3 (5 s), `prompts/swarm/clip-body.txt` | `chassis34` → `car34` |
| `clips/swarm/swing-a.mp4` | Kling O3 (5 s), `prompts/swarm/clip-swing.txt` | `car34-push` → the final frame |

Two takes of each clip; the others were worse in a clear way (`engine-a` a blizzard over the whole frame, `chassis-a`
out of the reference's order, `body-a` panels flapping like sheets, `swing-b` headlights late and marks on the seats).

`tools/finish-swarm-film.py` builds it with `tools/film_lib.py`. The build clips keep the camera locked off and the
push-in is added afterwards, so the workshop stays the plate's and the clips join cleanly; each frame is steadied onto
the plate, its tone drift taken out, and only the moving parts (and, once the chassis lands, the car's own place) are
laid over the plate. The swing keeps Kling's frames (the camera moves) and dissolves into the real final frame.

Smoothing before it went on the site:
- **Joins.** Kling's clip starts drift a few pixels and jump a little in framing in their first frames, so a crossfade at
  each join showed parts twice. Instead, each clip's last 0.2 s slides into the next clip's first frame by optical flow
  (each frame pushed along the flow towards the other, then blended), and the body clip slides into the swing's first
  frame the same way.
- **Pacing.** Kling eases every clip in and out of its key frames, so at an even speed the build stopped at each join.
  Each clip's frames are retimed so the time a frame gets follows how much moves in it (square root of the motion,
  capped at its 60th percentile so a smeared burst is not slowed down), and 24 fps becomes 60 fps by optical flow.
- **Camera.** The push-in starts from rest and is still moving when the swing takes over, so the camera never stops.
- **The tall wing.** The body clip bolts a tall GT wing onto the boot and only shrinks it to the factory spoiler in its
  last frames. From body frame 52, as the roof lands over it, the wing's area comes from the finished car (`car34`).
- **The floor** stays the plate's crisp floor while the parts fly in (only the parts and their reflections come from the
  clip); the car's whole place comes from the clip once the chassis is landing.

```bash
python3 tools/finish-swarm-film.py assets/site      # needs clips/swarm and clips/idle.mp4; preview/hero to try a change
tools/mux-hero-audio.sh                             # synthesises the sound from swarm-motion.json and muxes it
npm run build
```
