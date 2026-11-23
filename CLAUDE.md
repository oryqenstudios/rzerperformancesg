# RZER Performance website

Website for **Rzer (RZER Performance)**, a Singapore car tuning and performance workshop (Instagram: `@rzerperformance.sg`). Built by a web designer for this client. Theme: **gloss black**. One page with three parts:

1. **Hero:** a realistic 15.6 s film that follows reference video 1 beat for beat, including its camera moves:
   - black liquid flows in at floor level over a chrome emblem and gathers into a dome and a drop
   - the drop bursts into radiating rods and a rectangle, and the frame and chassis rise from it
   - the body pours over as the camera comes down to a head-on view
   - the headlights snap on, the paint cures to silver, and the camera orbits to the front three-quarter

   It crossfades into the final still, and the **RZER Performance logo** draws in over it. The film was generated with Higgsfield in five chained segments; see `assets/generated/README.md`.
2. **Scroll sections** in the style of reference video 2: a real-time 3D Evo IX-style car under a showroom spotlight. The camera moves around it per section (side profile, rear three-quarter, x-ray with tracked hotspots, wheel close-up, headlights-on front view, contact).
3. **Configurator** (`#build`): orbit the car and swap parts live (paint, wheels, calipers, aero, stance, exhaust, lights/tint, carbon) with a job card, build code, hold-to-compare-stock and copy-build.

Reference frames are in `reference/` (`video1-*`, `video2-*`). Renders of the current state are in `reference/current-*.png`. Look at both before changing visuals.

## Commands

```bash
npm install && npx playwright install chromium   # playwright is only for the screenshot tools
npm run build        # src/* -> dist/index.html, assets/site/* -> dist/assets/
npm run dev          # rebuild on every change in src/; refresh dist/index.html in the browser
```

`dist/index.html` works opened straight from disk (file://) as long as `dist/assets/` sits next to it. The only other network request is Google Fonts (Archivo).

## Stack and constraints

- **The 3D view has no libraries and no 3D assets.** Raw WebGL2 with one fragment shader that raymarches signed distance fields (SDFs). The car, garage, liquid and lattice are all modelled in GLSL. This was chosen because the original build environment had no CDN access, and because SDFs let the liquid morph straight into the car. Moving to Three.js later would be a new renderer, not a port.
- **The hero is media, not 3D:** `assets/site/hero-intro.mp4` (plus a `.webm` fallback), `hero-poster.jpg` and `hero-final.jpg`, about 9 MB in total. `build.mjs` copies them to `dist/assets/`.
- The page is **one HTML file**. `build.mjs` inlines `style.css`, `scene.frag` (into a `<script type="x-shader/x-fragment">`) and `app.js` into `src/index.html` at the `/*__CSS__*/`, `/*__FRAG__*/`, `/*__JS__*/` placeholders.
- It was first published as a claude.ai artifact. That host's limits shaped some choices: inline scripts only, no fetch, no form posting, and hash routes must be a plain `#name`. It is now meant for normal hosting (for example GitHub Pages from `dist/`).

## File map

| File | What it holds |
|---|---|
| `src/index.html` | Markup: nav, hero (film, still, logo SVG), sections (`data-cam` keys), footer, rev-counter gauge, x-ray hotspots, configurator shell |
| `src/style.css` | Design tokens and every layout rule (desktop, ≤900px mobile, portrait hero, reduced motion) |
| `src/app.js` | Hero film controller, WebGL setup, render loop, adaptive resolution, 3D intro (preview only), scroll cameras, routing, configurator UI, parts catalogue, contact form |
| `src/scene.frag` | The whole 3D scene |
| `assets/site/` | Hero media that ships with the site |
| `assets/generated/` | Higgsfield stills, the segment prompts (`prompts/`), `film-plan.json`, and how the shipped files were made |
| `tools/higgsfield-i2v.sh` | Generate one film segment (image-to-video) and pull its last frame |
| `tools/assemble-film.py` | Reverse, retime and join the segments per `film-plan.json`; encode the web files |
| `tools/shot.mjs` | Render the shader alone with any uniforms → `tools/shots/*.png` |
| `tools/page.mjs` | Drive the built page through states (intro time, scroll, `#build`, clicks) → screenshots + page errors |

## Hero (`#hero-media` in `src/index.html`, controller in `src/app.js`)

- The film plays muted and inline once. On `ended` it adds `.is-final`, which fades in `hero-final.jpg`, then `finishIntro()` swaps `is-intro` for `intro-done` and adds `.revealed` to the logo.
- **Skip** cuts straight to the final frame. Esc, the wheel or a swipe set `playbackRate = 4`. `prefers-reduced-motion` and in-page hash links go straight to the still.
- **Fallbacks:** if autoplay is refused, the last `<source>` errors, or nothing has played after 7 s, it shows the still. The film's last frame and the still differ by about 1.2% per pixel, so the crossfade is invisible.
- While the film covers the stage (home page, `scrollY < 2`), the 3D view draws only every 30th frame.
- **Portrait screens** (`max-aspect-ratio: 9/10`): the media takes the top 72svh and the copy sits on black below. The hero's own black background hides the 3D stage, and `.hero::after` fades it into the next section.
- **Logo:** inline SVG, white, no background, redrawn from the client's logo. `.logo-line` (the car roofline swoosh) draws in with `stroke-dashoffset` on a `pathLength="1"` path. `.logo-words` (bold slanted RZER and outlined PERFORMANCE, Archivo at 125% width, skewed −12°) wipes in with `clip-path`. Replace it with the client's vector file when they send one.

## Shader (`src/scene.frag`)

**World:** metres, y up, car front at **+x**, **+z is the car's right** (right-hand drive, so the steering wheel is at +z). Floor y=0, ceiling `CEIL`=3.35. Tyre radius `R`=0.33, front axle `FX`=1.31, rear axle `RX`=-1.315, half track `TRK`=0.755.

**Body space:** `pb = p + vec3(0, uRide, 0)`. Lowering moves the body down while the wheels stay on the floor and tuck into the arches.

**Modes** (`gMode`): 0 intro, 1 car, 2 x-ray shell (body + bolt-ons), 3 x-ray inner (wheels, chassis, engine, seats).

**Body** `bodySDF`: an Evo IX-style four-door saloon. It is a smooth intersection of three extruded 2D views:
- side profile polygon `PROF[20]` (x,y): blunt nose, bonnet, raked windscreen, flat roof, rear screen, boot
- plan rounded box (x,z), with a front corner radius of 0.42 and rear 0.30
- cross-section via `cabinHW` (tumblehome above the beltline `shoulderY(x)`) and `halfW(x)` (blistered arches, plus widebody via `uWide`)

It then cuts wheel arches (only for |z|>0.46), the big lower intake in the front bumper and the exhaust openings. It adds the factory pedestal wing (`uSpoiler` 1).

**Bolt-on parts:**
- `carbonParts`: lip or splitter with canards, skirts, diffuser fins, lip spoiler, GT wing
- `mirrorSDF`
- `exhaustSDF`: dual, quad or centre layouts via `exhaustSlot`
- `wheelSDF`: tyre, barrel, lip, 4 spoke styles via polar repetition, rotor, caliper
- `chassisSDF(p, t)` and `engineSDF(p, t)`: the perimeter frame, strut towers, suspension and greenhouse pillars; a transverse turbo four with a front-mount intercooler, the AWD driveline and the seats. `t` is the intro clock, so each group grows in over its own window. The x-ray passes 99.

**Materials:** `scene()` returns a `M_*` id. Zones on the body are decided in `shadeObj` from body-space position and normal, not in the SDF:
- glass: windscreen, side glass framed by the drip rail, A and C pillars and the black B-pillar; rear screen
- headlights with two projectors and halo rings each; honeycomb upper grille and corner intakes; intercooler core behind the intake
- round tail lamps
- panel gaps for four doors, handles, bonnet and boot shut lines
- factory bonnet vents; carbon bonnet and roof options
- dark wheel wells

No Mitsubishi badges or lettering are modelled.

**Lighting:** there are no shadows. `envCol()` is an analytic environment:
- ceiling tube rows every 3 m in x
- soft glow from the side bays
- a horizon line
- softboxes in the configurator (`uBay`)
- **Showroom mode** (`uShow`, 0–1, on after the intro): the tubes, pillars and floor dim to 22–30%. A spotlight `SPOT` hangs above the car pointing straight down. `spotAt()` gives its cone; it adds:
  - a lit floor pool, reflected in the lower body
  - diffuse and metallic-flake light on upward faces
  - light bouncing off the floor pool onto the body sides
  - a visible beam in `main()`
  - a lens reflection in gloss

Gloss and metallic paint only read through these reflections, so **any change to `envCol` or the spot changes the whole look**.

**Floor:**
- fbm concrete and lane markings
- in car modes, an analytic contact shadow (the car footprint plus 4 wheel patches)
- headlight pool and spotlight pool
- an optional glossy reflection pass (`uReflect`), stronger in showroom mode

**Pillars:** 14 analytic boxes with hazard stripes.

**3D intro clock** `uT` (seconds; ≥ `BUILT` = 10.8 means the car is complete). The site no longer plays it (the hero is a film), but `RZ.setIntro(t)` previews it. It follows the reference beats:
- **0–2.2 s:** the pool slides in and swallows a chrome RZER roundel, then gathers into a mound.
- **2.2–3.6 s:** drop, flattened lens, crown.
- **3.6–5.3 s:** burst into ten curling legs that straighten, 56 thin rods, web chords and the rectangle outline.
- **5.3–8.5 s:** the frame rises out of the outline. Then come the towers, suspension, engine and intercooler, wheels, seats and pillars.
- **8.6–10.0 s:** the body pours up as `M_LIQUID`.
- **10.0–10.7 s:** a bright line sweeps front to back and cures the liquid into paint.
- **10.9 s:** headlights.
- **11.2–12.4 s:** showroom spot.

**X-ray:** two passes. The inner one is solid; the shell is translucent, using fresnel alpha plus a faint grid.

**Post:** spotlight beam, fog, headlight flare with an anamorphic streak, ACES tone mapping, gamma, vignette and grain.

### Performance rules (read before editing the shader)

- **One call site each** for `march`, `calcN`, `calcAO`, `shadeObj` and `background`. Chrome on Windows compiles WebGL through ANGLE → HLSL, which inlines every call, so each extra call site of these copies the whole scene again and compile time balloons. `main()` uses a 2-pass loop (primary, then x-ray shell or floor reflection) for exactly this reason. Add new passes to that loop rather than calling `march` again.
- Loops start at `uZero` (a uniform that is always 0) so drivers can't unroll them.
- `carScene` and `bodySDF` return a bounding-box distance when far away (> 0.12 and > 0.10). **Don't feed those bounded distances into AO**: it causes rectangular floor shadows. That's why the floor uses the analytic footprint shadow in car modes.
- `app.js` adapts the render scale (`quality`: start 0.6 on desktop, 0.45 on mobile, range 0.34–0.9 of `min(devicePixelRatio, 1.5)`). It turns the floor reflection off below 0.5. Cost scales with the screen area the car covers.
- The shader compiles asynchronously via `KHR_parallel_shader_compile`.

## App (`src/app.js`)

- **Parts catalogue `CATS`:** categories → groups `{key, label, card, items}`. Each item is `{id, name, note, swatch | mark, u: {uniforms}}`. The **first item in a group is stock**.
  - Evo stock: 17-inch wheels and the factory pedestal wing.
  - `STOCK` and `SIGNATURE` are configs. `SIGNATURE` is the Rzer showcase build, styled on the client's Evo IX photo and also used on the home page: silver, carbon bonnet, black 18-inch wheels, splitter with canards, skirts, diffuser, GT wing, coilovers.
  - `uniformsFor(config)` merges item uniforms. Float and vec uniforms ease toward their targets; int uniforms switch instantly.
- **Add a part:**
  1. Add the SDF and/or material to the shader behind a new uniform.
  2. Add an item or group in `CATS`.
  3. If the uniform is an int, add it to `INTS`.
  4. If it needs its own camera angle, add a `BUILD_VIEWS` entry.
- **Cameras:**
  - `HOME_CAMS` per section (`data-cam`). The camera is interpolated in orbit space (target, r, θ, φ) from scroll position so it never passes through the car. The hero camera looks at the front three-quarter from the car's left, like the film's final frame.
  - `shift` is a lens shift in NDC that places the car beside the copy.
  - `BUILD_VIEWS` holds one camera per configurator category.
  - `INTRO_KEYS` is a Catmull-Rom path through the 3D intro.
  - On portrait screens the camera distance is scaled up by `fit`.
- **Routing:** `#build` opens the configurator. Any other hash is the home page (in-page anchors).
- **Hotspots:** DOM labels projected from 3D points (`data-pos`) on the turbo, front coilover, front brake and exhaust. They're visible only in the x-ray section.
- **Rev-counter scroll gauge:** `.tach`. The `--sheen` CSS variable moves a highlight across the chrome headlines as you scroll.
- **Contact form and "Copy build":** both copy text to the clipboard for an Instagram DM. There is no backend.
- **Test hooks:** `window.RZ` exposes:
  - `state()`, which includes `heroDone` and `heroTime`
  - `skipHero()`
  - `setIntro(t, hold)`, which previews the 3D intro
  - `setConfig(obj)`
  - `quality`
  - `settle(bool)`: `settle(true)` snaps the camera so screenshots don't wait for easing.

## Design system

- **Tokens** (`:root` in style.css):
  - `--black` #000 (true black, not a tinted near-black)
  - `--chrome` #e8ebee
  - `--steel`, `--graphite`, `--hair`
  - `--redline` #ff3b2f: **only** for the rev-counter redline. The red tail lights are part of the 3D scene.
- **Type:** Archivo variable from Google Fonts. Display text is `font-stretch: 125%`, weight 800–900, uppercase, with the `.chrome` gradient. Body text is Archivo at normal width.
- **Logo:** white only, no background (see Hero above).
- **Buttons:** chrome gradient (primary) or ghost. 3px radius.
- **Copy rules:** British English (bonnet, tyres, colour, centre). Sentence case outside the display headlines. No eyebrow labels, no arrows appended to buttons. Numbered markers appear only in the process steps, which really are a sequence.

## Content status: confirm with the client

- **All copy is a placeholder.** It was written from the brief "car tuning and performance" because the client's Instagram couldn't be read. Confirm the services, process and tagline.
- **No address, phone or opening hours.** Bookings point to an Instagram DM.
- **The hero film and still are AI-generated** (Higgsfield). They show an Evo with an older Evo V/VI-style front and a Mitsubishi grille badge. The number plate was blanked by hand. A real photo of the client's car as a reference image would make it an accurate Evo IX.
- **The 3D car is an Evo IX-style model built from primitives**, not a licensed model. There are no prices anywhere.
- **The logo SVG is a redraw** of a small image of the client's logo. Swap in their vector file when available.

## Testing workflow

1. `npm run build`
2. For shader-only checks, run `node tools/shot.mjs '{"name":"x", ...uniforms}'`. Examples are in the file header.
3. For page states (sections, `#build`, mobile 390×844), run `node tools/page.mjs W H '<steps>'`. Call `RZ.skipHero()` first: the film plays (and usually finishes) while the tool waits for the shader to compile.
4. Compare against `reference/current-*.png` and the `video*` frames.

Headless Chromium falls back to SwiftShader (software) without a GPU: about 1–2 s per frame, and the first draw includes shader JIT. Trigger clicks from script (`page.mjs` already does), because slow frames block real clicks.

## Ideas not yet built

- Real car platforms the client works on (likely Three.js with licensed GLB models whose part meshes are named), keeping the same catalogue and job card. That would also let the scroll sections match the realistic hero.
- A 9:16 version of the hero film and still for phones.
- Video 2 beats: opening doors, an exploded engine, a numbers section with real dyno figures from the client.
- Share a build by link. `buildCode()` is already a reversible mixed-radix base36 code; decoding isn't written yet.
- A real booking backend (WhatsApp link, form service).
