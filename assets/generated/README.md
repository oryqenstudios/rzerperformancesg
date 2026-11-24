# Generated hero media

The hero opens on a realistic 15.8 s film made with Higgsfield (`api.higgsfield.ai`), set in a dark, professional tuning garage. Its build-up follows the client's reference video (a car-build film shared on WhatsApp) beat for beat and at its timing: black liquid crawls over a chrome ring and pulls into a dome, the dome sharpens to a drop and bursts into radiating rods, the rods join into a rectangle and a chassis frame rises out of it, the suspension, engine and intercooler grow, the camera cranes down as the tyres, seats and cabin frame rise, the cabin skins over, and the front sets over the engine into the complete black car. Then the headlights snap on, a streak of light runs round the car and sets the black liquid into bare carbon fibre, and the film lands on a full-carbon Evo IX, head-on and centred, with no number plate. This folder keeps the stills, the prompts and the plans for rebuilding the film. The files the site ships are in `assets/site/` (`build.mjs` copies them to `dist/assets/`).

## What ships

| File in `assets/site/` | Made from |
|---|---|
| `hero-intro.mp4` / `.webm` | `tools/finish-garage-film.sh`: the build-up (`build-plan.json`, 10.75 s), then a hard cut to the carbon cure clip. 1920×1080, 24 fps, 379 frames (15.79 s). H.264 CRF 24 (capped at 2.8 Mbit/s) with faststart; VP9 CRF 35. Sound: the synthesised engine start, rev, blow-off, pops and bangs (AAC 160k / Opus 128k), see "Sound". |
| `hero-final.jpg` | `carbon-final.jpg` (the end frame the cure clip was generated to land on) at 2048×1152, JPEG quality 88 |
| `hero-poster.jpg` | The film's first frame, shown until it starts |

## The build-up

Each beat of the reference is one keyframe still in the garage, and each step between two keyframes is one Kling O3 first-last-frame clip (`tools/higgsfield-flf.sh`, 5 s, pro, no sound), so consecutive clips share a frame and join without blending. `tools/assemble-build.py` lays them onto the reference's timeline (`build-plan.json`: each clip's slot in seconds, and where its action is paced differently from the reference, anchors that speed up or slow down part of it).

The keyframes (`build/`) are Kling Image 4.0 edits (`tools/higgsfield-edit.sh kling`, two images). For the first five, image 1 is a frame of the reference video (for the camera and the subject's shape and place) and image 2 is `garage-cut.jpg` (for the garage); the prompt says to keep the first's camera and subject and swap its surroundings for the garage. Those reference frames are not in the repo: they are another company's film. The last two keyframes are made from the finished car so that the build ends exactly on it.

| Film | Reference beat | Keyframe → keyframe (prompts `build-key-*.txt`) | Clip (prompt `build-clip-N.txt`) |
|---|---|---|---|
| 0–2.25 s | liquid crawls over the ring, pulls into a dome | `1-flow` → `2-dome` | 1 |
| 2.25–4.75 s | the dome sharpens to a drop and bursts into radiating rods (paced so the burst lands at 3.3 s, as in the reference) | `2-dome` → `3-rods` | 2 |
| 4.75–6.25 s | the rods join into a rectangle; the frame and strut towers rise | `3-rods` → `4-frame` | 3 |
| 6.25–7.5 s | suspension, brakes, engine, intercooler and rear wheels grow | `4-frame` → `5-chassis` | 4 |
| 7.5–8.75 s | the camera cranes down to head-on; tyres, seats and the cabin frame rise | `5-chassis` → `6-cabin-frame` | 5 |
| 8.75–9.75 s | the cabin skins over | `6-cabin-frame` → `7-front-open` | 6 |
| 9.75–10.75 s | the front sets over the engine: the complete black car, headlights off | `7-front-open` → `garage-cut.jpg` | 7 |

`7-front-open` is `garage-cut.jpg` with its front taken away (`rolling-ref.jpg`, an earlier rolling-chassis still, shows the parts underneath); `6-cabin-frame` is that with the cabin's sides taken away. Building the body this way, front last and from a closed cabin, is what kept the doors shut: every clip that formed the whole body at once, in O3 and Kling Omni, forward and generated in reverse, swung the doors open and shut halfway (six takes).

```bash
# one clip, e.g. the last:
tools/higgsfield-flf.sh assets/generated/build/7-front-open.jpg assets/generated/garage-cut.jpg assets/generated/prompts/build-clip-7.txt 5 build-clip-7
```

The clips are saved in `shots/` (not committed) as `build-clip-1.mp4` … `build-clip-7.mp4`, the names `build-plan.json` uses.

## The garage and the carbon ending

The client sent a reference for the garage's colours and look (black, white and red: a glossy black floor, a hexagonal LED ceiling, red neon, a wheel wall) and a photo of a full-carbon Evo IX for the ending, with the plate removed. Their photo is only a reference: it is not in the repo (`carbon-evo-reference.png` is ignored) or on the site, and its plate and branding are not reproduced. The chain:

| Step | Tool, model | Inputs | Output |
|---|---|---|---|
| 1. The garage | `tools/higgsfield-edit.sh kling`, Kling Image 4.0 edit | `hero-final.png` (the old final still), `prompts/garage-final.txt` | `garage-final.jpg`: the silver Evo moved into the garage |
| 2. The carbon look | Kling Image 4.0 edit, two images | `garage-final.jpg` (setting), the client's photo (car), `prompts/carbon-look.txt` | `carbon-look.jpg`: the carbon Evo in the garage, right of centre, no plate |
| 3. The film in the garage | `tools/higgsfield-v2v.sh`, Seedance 2.5 video-edit (1080p, no audio) | the original film (sound stripped), `garage-final.jpg`, `prompts/garage-film.txt` | `shots/garage-film.mp4` (12.4 s): the old film, motion and timing, in the garage. Its build-up shipped until the new one replaced it; its frame 212 is still `garage-cut.jpg` |
| 4. The end frame | `tools/higgsfield-edit.sh kling` with two images (take b of two) | `garage-cut.jpg` (frame 212 of the garage film: the liquid car head-on, centred, headlights off) for the camera, `carbon-look.jpg` for the car, `prompts/carbon-final.txt` | `carbon-final.jpg`: the carbon Evo, head-on and centred, headlights on, no plate |
| 5. The cure | `tools/higgsfield-flf.sh`, Kling O3 first-last-frame (5 s, pro, no sound) | `garage-cut.jpg` to `carbon-final.jpg`, `prompts/carbon-cure.txt` | `shots/carbon-cure.mp4`: locked camera; headlights snap on at 0.25 s, a light streak bursts out at the bumper at 2 s and runs round the car, the liquid sets into carbon and the plate melts away; it settles from about 4.3 s |
| 6. The web files | `tools/finish-garage-film.sh` (which runs `tools/assemble-build.py` and `tools/join-cure.py`), then `tools/mux-hero-audio.sh` | the build-up and step 5 | `assets/site/hero-*` |

The stills here are JPEG quality 95 (the tools upload JPEGs anyway; they save their own output as PNG in `shots/`).

`tools/join-cure.py` joins the build-up to the cure clip with a hard cut. It measures the camera framing of every frame around the cut (OpenCV ECC on the background, leaving the car out): Kling's cure clip starts on the frame it was given, then within 3 frames lurches about 1% closer and 9 px and holds still. A dissolve showed a doubled car, so over the build-up's last second a gentle correction (only ever zooming in, so no edges show) is eased in so that its framing meets the clip's settled framing exactly at the cut, the clip's first frames are warped onto that framing, and its first 4 frames fade in from its first frame (Kling redraws the fine detail of the frame it was given). It also eases out any sudden jump in the incoming camera move (the old garage film had one).

```bash
# rebuild the ending (from the repo root):
tools/higgsfield-edit.sh kling assets/generated/garage-cut.jpg,assets/generated/carbon-look.jpg assets/generated/prompts/carbon-final.txt carbon-final
tools/higgsfield-flf.sh assets/generated/garage-cut.jpg assets/generated/carbon-final.jpg assets/generated/prompts/carbon-cure.txt 5 carbon-cure
pip install opencv-python-headless   # for tools/join-cure.py
tools/finish-garage-film.sh   # needs the build clips and shots/carbon-cure.mp4
tools/mux-hero-audio.sh
```

The sections below describe the original car-park film, which no longer ships (the garage film restyled it; the new build-up replaced both): its phases, its timing and how its segments were made.

## The film, phase by phase

| Playback | Reference video | Segment (model) | What happens | Camera |
|---|---|---|---|---|
| 0–0.4 s | 3.0–3.3 s | `seg-a-hailuo` (Hailuo 2.3), last 0.7 s only | The glossy dome shrinks to a drop. The client cut the first 3 s, where black liquid flows in over a chrome ring emblem; `"from": 5.184` in the plan does the cut, so removing it brings that opening back | Looking down at the drop |
| 0.4–2.6 s | 3.3–5.2 s | `seg-b1-hailuo` (Hailuo 2.3) | The drop bursts into dozens of thin rods radiating across the floor; a pool squares off into a beaded rectangle | Looking down, rising |
| 2.6–4.6 s | 5.2–6.4 s | `seg-b2-kling` (Kling 2.5 Turbo Pro) | The frame, wheels, engine, intercooler and seats rise out of the rectangle | High over the front |
| 4.6–8.2 s | 6.4–10.4 s | `seg-c-kling` (Kling) | Black liquid pours up over the chassis and forms the body | Cranes down to a low, head-on front view |
| 8.2–12.5 s | 10.4–15 s | `seg-d-kling` (Kling) | Headlights snap on, the paint cures from black to silver | Orbits from head-on to the front three-quarter, ending on the final still |

The segment clips themselves are not committed (`assets/generated/shots/` is ignored, about 35 MB). Higgsfield keeps them for 7 days after generation.

## How it was made

No Higgsfield video model takes an end frame, so the film is generated **backwards** and played reversed:

1. `seg-d` starts from the final still, with the camera orbiting to head-on and the paint turning to black liquid.
2. Each earlier segment starts from the **last frame** of the one after it, so every join is the same image.
3. `tools/assemble-film.py` reverses each clip, trims it, retimes it to its phase of the reference (`film-plan.json`), joins them and encodes the web files (without sound).
4. `tools/mux-hero-audio.sh` synthesises the sound (`tools/make-hero-audio.py`) and adds it to both web files. Run it again after every `assemble-film.py` or `finish-garage-film.sh`.

```bash
# regenerate a segment (from the repo root), e.g. the last one:
tools/higgsfield-i2v.sh kling assets/generated/hero-final.png assets/generated/prompts/5-lights-cure-orbit.txt 5 seg-d-kling
# ...then the next one from its last frame:
tools/higgsfield-i2v.sh kling assets/generated/shots/seg-d-kling-last.png assets/generated/prompts/4-body-and-camera-descent.txt 5 seg-c-kling
# rebuild the film from the plan:
python3 tools/assemble-film.py assets/generated/film-plan.json assets/site
# ...and put the sound back in:
tools/mux-hero-audio.sh
```

### Sound

`tools/make-hero-audio.py` synthesises it with numpy (no samples, no licences; a fixed seed, so it renders the same every time). The timings at the top of the script are frames of the film, so retime them if the film changes:

| Film time | Sound |
|---|---|
| 0–10.4 s | faint workshop room tone only, while the car is being built |
| 10.475 s | the starter turns the engine over as the front sets: five chugs, rur-rur-rur |
| 11.0 s | the engine fires as the headlights snap on (frame 264): a big flare to 3,300 rpm, then a fast idle |
| 12.44 s | one full rev to 7,000 rpm, the turbo spooling |
| 12.79 s | throttle shut as the light streak bursts out at the bumper: a loud blow-off valve, a full whoosh kept mostly below 3 kHz so it isn't sharp, on its own, dying away before the first bang |
| 13.16–13.54 s | backfires as the revs fall and the streak runs round the car: BANG, pap-pap, BANG, BANG, each with its own deep boom |
| 14.77 s | one last BANG as the carbon finishes setting |
| 14.867 s | the logo starts drawing (`LOGO_LEAD` 0.925 s in `src/app.js`); the idle fades out under it by the end (15.792 s) |

Each moment has its own slot so the sound stays clean: the reverb is short, nothing overlaps the blow-off, and the bangs are mixed so the limiter leaves them alone; it only touches the first few milliseconds of the blow-off. It aims at the sound of a 4G63 Evo IX through a 3-inch turbo-back exhaust. The reverb is a short, hard-walled room. The engine is a pulse train at the 4-cylinder firing rate (rpm / 30 per second): sharp pressure spikes ringing a set of exhaust resonances (lowest at 66 Hz), with per-cylinder imbalance at idle, a lopsided saturation for growl, and a harder, raspier tone above about 5,000 rpm where MIVEC changes over. The turbo adds a whoosh of air as it spools, with a quiet whistle on top. The treble is kept low throughout (about 6% of the energy above 3 kHz; the bangs' crack is rounded, the turbo whistle is low and quiet, the mix rolls off from 10 kHz). Levels: cranking about −18 dBFS RMS, full rev −13, blow-off −11, bangs peak at −1. `python3 tools/make-hero-audio.py out.wav spectrogram.png` also draws a spectrogram with the beats marked. To use a real recording instead, pass it to `tools/mux-hero-audio.sh recording.wav`.

Each prompt in `prompts/` describes its phase **in reverse** (what happens from the start frame). The chain is:

| Prompt | Start frame | Clip |
|---|---|---|
| `5-lights-cure-orbit.txt` | `hero-final.png` | `seg-d-kling` |
| `4-body-and-camera-descent.txt` | `seg-d-kling-last.png` | `seg-c-kling` |
| `3-rectangle-to-chassis.txt` | `seg-c-kling-last.png` | `seg-b2-kling` |
| `2-drop-burst-rods.txt` | `seg-b2-kling-last.png` | `seg-b1-hailuo` |
| `1-flow-in-and-dome.txt` | `seg-b1-hailuo-last.png` | `seg-a-hailuo` |

Both models were tried for every phase and the closer match to the reference was kept. Kling is sharper and better at camera moves. Hailuo was better at the liquid beats: it was the only one to lay the rods flat on the floor. One Hailuo request was wrongly refused by its content filter; rewording the prompt fixed it.

## Final still: `higgsfield-ai/soul/standard`

Settings: `resolution: "1080p"` (the live API rejects the documented `2K`), `aspect_ratio: "16:9"`, `num_images: 1` (more were ignored). Output is 2048×1152 PNG.

Prompt used for `hero-v2a-1.png` (the client's pick):

> Photorealistic photograph of a silver 2006 Mitsubishi Lancer Evolution IX saloon (Evo 9), tuned: exposed carbon fibre vented bonnet, Evolution IX front bumper with a large central trapezoid intake showing the front-mount intercooler and two small side intakes, angular clear headlights with dark housings switched on, deep carbon front splitter with small canards, carbon side skirts, lowered on coilovers with tight wheel gaps, black multi-spoke forged wheels, red brake calipers, clean grille with no badge, plain black number plate with no characters, parked alone in a dark underground concrete car park at night. One strong spotlight mounted in the ceiling directly above the car shines straight down onto its roof and bonnet, a clearly visible cone of light in light haze, a bright round pool of light on the polished concrete floor around the car with mirror-like reflections. The rest of the car park is dim: fluorescent tubes turned low, concrete pillars with yellow and black hazard stripes fading into darkness. Luxury showroom mood, moody, cinematic, photorealistic automotive photography, sharp focus, realistic metallic paint reflections. Front three-quarter view from a low camera at headlight height, the car on the right third of the frame facing left, empty dark space on the left half. 35mm lens. No people, no text.

`hero-v1-1.png`, `hero-v2b-1.png` and `hero-v2c-1.png` are the other options shown to the client.

Known limits:
- From text alone the model draws an older Evo V/VI front (rounder headlights with amber corners) and always adds the grille badge. A photo of the client's Evo IX as a reference image would fix the shape.
- `intro-hailuo-1.mp4` is the first, single-shot version of the film, with a static camera. It is kept for comparison.
