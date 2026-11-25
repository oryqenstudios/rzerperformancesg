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
