# Generated hero media

The hero opens on a realistic 12.5 s film made with Higgsfield (`api.higgsfield.ai`). It follows reference video 1 beat for beat, including its camera moves, and ends on the final still. This folder keeps the stills, the prompts and the plan for rebuilding the film. The files the site ships are in `assets/site/` (`build.mjs` copies them to `dist/assets/`).

## What ships

| File in `assets/site/` | Made from |
|---|---|
| `hero-final.jpg` | `hero-final.png` at JPEG quality 88. It is `hero-v2a-1.png` with the garbled number-plate lettering painted out to a blank black plate. |
| `hero-intro.mp4` / `.webm` | The five segments in `film-plan.json`, joined by `tools/assemble-film.py`. 1920×1080, 24 fps. H.264 CRF 24 (capped at 2.8 Mbit/s) with faststart is about 4.2 MB; VP9 CRF 35 is about 3.1 MB. Sound: the synthesised engine start, revs, pops and bangs (AAC 160k / Opus 128k), see below. |
| `hero-poster.jpg` | The film's first frame, shown until it starts. |

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
4. `tools/mux-hero-audio.sh` synthesises the sound (`tools/make-hero-audio.py`) and adds it to both web files. Run it again after every `assemble-film.py`.

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
| 0–6.7 s | faint car-park room tone |
| 6.68 s | ignition relay click as the parking lights glow amber |
| 6.82 s | starter cranks |
| 7.42 s | engine catches, flares and settles to a lumpy idle |
| 8.15 s | a blip to 4,800 rpm, a few pops |
| 8.90 s | full rev to 7,300 rpm with turbo spool |
| 9.35 s | lift-off: blow-off valve; the first bang lands with the headlights (9.375 s, frame 225) |
| 9.4–10.27 s | pops, crackle and bangs as the revs fall; the last bang is just before the logo (10.34 s) |
| 10.3–12.4 s | idle, fading out under the logo |

The engine is a pulse train at the 4-cylinder firing rate (rpm / 30 per second) ringing a set of exhaust resonances, with per-cylinder imbalance at idle and brighter pulses under load. Pops are noise cracks with a low thump, all in a car-park reverb. Levels: idle about −25 dBFS RMS, full rev −13, bangs peak at −1. `python3 tools/make-hero-audio.py out.wav spectrogram.png` also draws a spectrogram with the beats marked. To use a real recording instead, pass it to `tools/mux-hero-audio.sh recording.wav`.

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
