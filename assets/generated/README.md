# Generated hero media

The hero opens on a realistic film made with Higgsfield (`api.higgsfield.ai`). This folder keeps the raw generations and how they were made, so they can be regenerated or tweaked. The files the site actually ships are in `assets/site/` (`build.mjs` copies them to `dist/assets/`).

## What ships

| File in `assets/site/` | Made from |
|---|---|
| `hero-final.jpg` | `hero-final.png` at JPEG quality 88. It is `hero-v2a-1.png` with the garbled number-plate lettering painted out to a blank black plate. |
| `hero-intro.mp4` / `.webm` | `intro-hailuo-1.mp4` played **in reverse**, so the film ends exactly on the final still. H.264 CRF 20 with faststart; VP9 CRF 34 as the fallback for browsers without H.264. No audio. |
| `hero-poster.jpg` | The first frame of `hero-intro.mp4` (the black droplet), shown until the film starts. |

## Final still: `higgsfield-ai/soul/standard`

Settings: `resolution: "1080p"` (the live API rejects the documented `2K`), `aspect_ratio: "16:9"`, `num_images: 1` (more were ignored). Output is 2048×1152 PNG.

Prompt used for `hero-v2a-1.png` (the client's pick):

> Photorealistic photograph of a silver 2006 Mitsubishi Lancer Evolution IX saloon (Evo 9), tuned: exposed carbon fibre vented bonnet, Evolution IX front bumper with a large central trapezoid intake showing the front-mount intercooler and two small side intakes, angular clear headlights with dark housings switched on, deep carbon front splitter with small canards, carbon side skirts, lowered on coilovers with tight wheel gaps, black multi-spoke forged wheels, red brake calipers, clean grille with no badge, plain black number plate with no characters, parked alone in a dark underground concrete car park at night. One strong spotlight mounted in the ceiling directly above the car shines straight down onto its roof and bonnet, a clearly visible cone of light in light haze, a bright round pool of light on the polished concrete floor around the car with mirror-like reflections. The rest of the car park is dim: fluorescent tubes turned low, concrete pillars with yellow and black hazard stripes fading into darkness. Luxury showroom mood, moody, cinematic, photorealistic automotive photography, sharp focus, realistic metallic paint reflections. Front three-quarter view from a low camera at headlight height, the car on the right third of the frame facing left, empty dark space on the left half. 35mm lens. No people, no text.

`hero-v1-1.png`, `hero-v2b-1.png` and `hero-v2c-1.png` are the other options shown to the client (2b: same car under a ceiling spot with the logo space on the left; 2c: symmetric front view with the spot directly overhead).

Known limits: from text alone the model draws an older Evo V/VI front (rounder headlights with amber corners) and always adds the grille badge. A photo of the client's Evo IX as a reference image would fix the shape.

## Intro film: `minimax/hailuo-2.3/standard/image-to-video`

No documented Higgsfield video model takes an end frame, so the film is generated backwards: the final still is the **start** frame, the car melts away, and the site plays the clip reversed. Settings: `duration: 10`, `prompt_optimizer: true`, `image_url` = the final still uploaded through `POST /files/generate-upload-url`. Output is 1364×768 at 24 fps.

> Locked-off camera, the shot stays perfectly still. Photoreal cinematic transformation in the same dark underground car park under the same overhead spotlight. The silver tuned Evo's bodywork slowly melts into thick glossy jet-black liquid like ferrofluid, starting at the roof and pouring downward; the panels liquefy and slide away, revealing a glossy black chassis frame, engine, coilover suspension and wheels underneath. Then the chassis and wheels dissolve into thin glossy black rods lying flat on the concrete in a radiating starburst, the rods retract toward the centre and merge into one smooth glossy black droplet sitting in the pool of spotlight on the polished floor. Realistic liquid physics, mirror-like reflections, no people, no text.

Reversed, it runs droplet → radiating rods → chassis, engine and wheels → black liquid body → silver car, the same beats as the reference video.

The same prompt on `kling-video/v2.5-turbo/pro/image-to-video` (`cfg_scale: 0.6`) gave a sharper 1080p clip with a red cam cover on the engine, but it skipped the radiating rods and added liquid dripping from the ceiling lamp. It is not committed (11 MB).

## Re-encoding

```bash
ffmpeg -i assets/generated/intro-hailuo-1.mp4 -vf "reverse,format=yuv420p" -an -c:v libx264 -preset slow -crf 20 -movflags +faststart assets/site/hero-intro.mp4
ffmpeg -i assets/generated/intro-hailuo-1.mp4 -vf "reverse,format=yuv420p" -an -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 assets/site/hero-intro.webm
ffmpeg -i assets/site/hero-intro.mp4 -frames:v 1 -q:v 3 assets/site/hero-poster.jpg
```
