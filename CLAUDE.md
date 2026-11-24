# RZER Performance website

Website for **Rzer (RZER Performance)**, a Singapore car tuning and performance workshop (Instagram: `@rzerperformance.sg`). Built by a web designer for this client. Theme: **gloss black**. One page with three parts:

1. **Hero:** a realistic 12.5 s film that follows reference video 1 beat for beat from its 3 s mark, including its camera moves (the client cut the opening, where the liquid flows in):
   - a glossy black dome on the spotlit floor shrinks to a drop
   - the drop bursts into radiating rods and a rectangle, and the frame and chassis rise from it
   - the body pours over as the camera comes down to a head-on view
   - the headlights snap on, the paint cures to silver, and the camera orbits to the front three-quarter

   It has **sound**: the engine starting as the lights come on, a blip, a full rev, then pops and bangs on the overrun, the first bang with the headlights and the last just before the logo. As it ends, the **RZER Performance logo** draws in and the hero rests on the film's final frame (`hero-final.jpg`). A photoreal three.js Evo IX used to take over from the film here; the client asked for it to be removed from the hero, and it now lives only in the showroom preview (`src/showroom/`). The film was generated with Higgsfield in five chained segments; see `assets/generated/README.md`.
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

- **The 3D view has no libraries and no 3D assets.** Raw WebGL2 with one fragment shader that raymarches signed distance fields (SDFs). The car and garage are modelled in GLSL. This was chosen because the original build environment had no CDN access, and because SDFs let an earlier 3D liquid intro morph straight into the car (since replaced by the hero film and removed from the shader). Moving to Three.js later would be a new renderer, not a port.
- **The hero is a film.** The film files are `assets/site/hero-intro.mp4` (plus a `.webm` fallback), `hero-poster.jpg` and `hero-final.jpg`, about 7.8 MB in total. The films carry the synthesised engine sound (`tools/make-hero-audio.py`, muxed by `tools/mux-hero-audio.sh`).
- **three.js is only in the showroom preview** (`dist/showroom/`), not on the main page:
  - `src/showroom/showroom.js` is an ES module that uses **three.js r170, vendored in `vendor/three/`** (MIT; no CDN). The preview page reaches it through an import map.
  - The car is `assets/site/models/lancer-evolution.glb` (CC BY 4.0 by 3DCars4U; see `assets/site/models/CREDITS.md`).
  - `build.mjs` copies `assets/site/` to `dist/assets/`, `src/showroom/` to `dist/showroom/` and `vendor/` to `dist/vendor/`.
- **Serve the showroom preview over HTTP.** Module scripts don't load from `file://`, so it needs a web server (for example `python3 -m http.server -d dist` or GitHub Pages). The main page works from disk too.
- The page is **one HTML file**. `build.mjs` inlines `style.css`, `scene.frag` (into a `<script type="x-shader/x-fragment">`) and `app.js` into `src/index.html` at the `/*__CSS__*/`, `/*__FRAG__*/`, `/*__JS__*/` placeholders.
- It was first published as a claude.ai artifact. That host's limits shaped some choices: inline scripts only, no fetch, no form posting, and hash routes must be a plain `#name`. It is now meant for normal hosting (for example GitHub Pages from `dist/`).

## File map

| File | What it holds |
|---|---|
| `src/index.html` | Markup: nav, hero (film, still, logo SVG), sections (`data-cam` keys), footer, rev-counter gauge, x-ray hotspots, configurator shell |
| `src/style.css` | Design tokens and every layout rule (desktop, ≤900px mobile, portrait hero, reduced motion) |
| `src/app.js` | Hero film controller, WebGL setup, render loop, adaptive resolution, scroll cameras, routing, configurator UI, parts catalogue, contact form |
| `src/scene.frag` | The whole 3D scene |
| `assets/site/` | Hero media that ships with the site |
| `src/showroom/` | `showroom.js`: the photoreal three.js scene (car, garage, spotlight, reflective floor, post-processing) as `startShowroom()`. `details.js`: the car's realistic materials and details. `index.html`: a full-screen preview with drag-to-orbit (`dist/showroom/`) |
| `vendor/three/` | three.js r170 and the add-ons the showroom imports (glTF and Draco loaders, post-processing, Reflector, OrbitControls) |
| `assets/site/models/` | The 3D car and its credits |
| `assets/generated/` | Higgsfield stills, the segment prompts (`prompts/`), `film-plan.json`, and how the shipped files were made |
| `tools/higgsfield-i2v.sh` | Generate one film segment (image-to-video) and pull its last frame |
| `tools/assemble-film.py` | Reverse, retime and join the segments per `film-plan.json`; encode the web files (without sound) |
| `tools/make-hero-audio.py` | Synthesise the hero film's sound (engine start, revs, pops and bangs, car-park reverb), timed to the film's frames |
| `tools/mux-hero-audio.sh` | Put that sound (or any WAV) into `hero-intro.mp4` and `.webm`. Run it after every `assemble-film.py` |
| `tools/shot.mjs` | Render the shader alone with any uniforms → `tools/shots/*.png` |
| `tools/page.mjs` | Drive the built page through states (intro time, scroll, `#build`, clicks) → screenshots + page errors |

## Hero (`#hero-media` in `src/index.html`, controller in `src/app.js`)

- The film plays inline once.
- **Sound, with no sound button (the client asked for none):**
  - `startHero()` first plays the film with sound. Browsers allow that only for sites the visitor already trusts (Chrome's media engagement, a per-site sound setting).
  - Refused, it plays muted, and the first click, tap or key press (`GESTURES`, not Esc) unmutes it in sync.
  - Speeding up mutes it (4× audio sounds broken). Skip stops it, which also covers the accessibility rule that automatic sound must be stoppable. `LOGO_LEAD` (2.2 s) before it ends, `revealLogo()` adds `.revealed` to the logo, so the logo comes in over the final orbit. On `ended`, `finishIntro()` adds `.is-final` (fading in `hero-final.jpg`) and swaps `is-intro` for `intro-done`, which brings in the tagline and buttons.
- **Skip** cuts straight to the final frame. Esc, the wheel or a swipe set `playbackRate = 4`. `prefers-reduced-motion` and in-page hash links go straight to the still.
- **Fallbacks:** if autoplay is refused, the last `<source>` errors, or nothing has played after 7 s, it shows the still. The film's last frame and the still differ by about 1.2% per pixel, so the crossfade is invisible.
- While the film covers the stage (home page, `scrollY < 2`), the old shader view draws only every 30th frame.
- **Portrait screens** (`max-aspect-ratio: 9/10`): the media takes the top 72svh and the copy sits on black below. The hero's own black background hides the 3D stage behind it, and `.hero::after` fades it into the next section.
- **Logo:** inline SVG, white, no background, redrawn from the client's logo. The words are bold slanted RZER and outlined PERFORMANCE, in Archivo at 125% width, skewed −12°. The reveal (CSS keyframes on `.revealed`, about 2.2 s) runs:
  1. `.logo-line`, the car roofline swoosh, draws in as a light trace with `stroke-dashoffset` on a `pathLength="1"` path.
  2. `.logo-spark`, a short glowing dash on the same path, rides its tip.
  3. `.logo-rzer` slides in out of a blur.
  4. `.logo-perf` draws its outline with `stroke-dasharray`.
  5. `.logo-words` pulses a glow as it lands.

  Reduced motion turns the animations off. Replace it with the client's vector file when they send one.

## Showroom (`src/showroom/showroom.js`)

Not on the main page: the client asked for the 3D car to be taken out of the hero. Open `dist/showroom/` to see it. It's the starting point for moving the scroll sections and configurator onto three.js. `startShowroom({canvas, interactive, onReady})` returns `setActive()` for pausing it when off screen.


- **Car config `CAR`:** the model URL, real length (4.49 m) and the tail-light material.
  - The model is scaled to its real length, centred and set on the floor. It is turned so its front faces +x, away from the tail lights.
- **Details (`details.js`, `dressCar()`):** the model has no textures, so realism is added at runtime and the file stays untouched.
  - **Telling parts apart:** the model shares materials between parts, so `dressCar()` goes by the node each part hangs under. Those nodes are `car_body` (GLTFLoader turns spaces in node names into underscores), `w1`–`w4` and `b1`–`b4`.
  - **Paint:** `MeshPhysicalMaterial` with a rough metallic base (0.36) under a mirror clear coat.
    - Metallic flake tilts the base normal per 1.5 mm cell, and fades out by `fwidth` once a flake is under a pixel, so it doesn't alias into noise.
    - The clear coat gets a faint 1.5 cm orange-peel ripple.
    - Both are in model units, converted using the body mesh's world scale.
  - **Wheels:**
    - tyres: sidewall lettering from a canvas strip on the outer face only (`uOutward` per tyre), a rim-protector ring, tread grooves and sipes, all in the tyre's local cylinder (axis = local y)
    - gloss black clear-coated rims (`wire_007007007`)
    - machined cast-iron discs with a dark hat (`wire_154154154`)
    - red calipers (everything under `b1`–`b4`)
    - a chrome centre cap
  - **Body:** satin black trim, tinted windows, and glossy deep-red tail-light lenses with a faint glow.
  - **Headlights:** the lens triangles are split out of the window glass by position (within 0.62 m of the nose, 0.45–0.8 m high, more than 0.3 m off centre) into a clear-glass mesh. Behind each lens sit two emissive projectors with halo rings, plus a `SpotLight` beam onto the floor ahead.
  - **Number plates:** both get planar UVs computed in world space and an "RZER" canvas plate.
- **Lighting:**
  - One `SpotLight` overhead (110 cd, 0.78 rad) with PCF soft shadows, a dim hemisphere fill, and an additive cone mesh for the visible beam.
  - A PMREM map of a small HDR car park (spotlight lens and halo, dimmed tube rows, lit floor pool) gives the car its reflections.
  - That map is set **per car material**, never as `scene.environment`. In r170, `scene.environment` ignores each material's `envMapIntensity` and lit the whole car park evenly.
- **Floor:**
  - A canvas-made concrete texture under a `MeshStandardMaterial`, patched in `onBeforeCompile` to add the `Reflector`'s planar reflection with a 13-tap blur and fresnel.
  - The `Reflector` mesh itself draws nothing (`colorWrite: false`); it only renders the mirror texture.
  - The set: hazard-striped pillars, dimmed tube rows, bay lines, fog.
- **Post:** `EffectComposer` → `UnrealBloomPass` → `OutputPass` (ACES) → a vignette and grain pass.
- **Shader compile:** `renderer.compileAsync()` compiles every shader before `showroom:ready`. It runs in the background where `KHR_parallel_shader_compile` exists, so the page and the film don't stall.
- **Cost:** the model is about 500,000 triangles and 19 MB uncompressed. The `Reflector` renders the scene twice. Compressing the GLB with Draco (the gltf.report script in `assets/generated/README.md` style) would cut the download several times over.

## Shader (`src/scene.frag`)

**World:** metres, y up, car front at **+x**, **+z is the car's right** (right-hand drive, so the steering wheel is at +z). Floor y=0, ceiling `CEIL`=3.35. Tyre radius `R`=0.33, front axle `FX`=1.31, rear axle `RX`=-1.315, half track `TRK`=0.755.

**Body space:** `pb = p + vec3(0, uRide, 0)`. Lowering moves the body down while the wheels stay on the floor and tuck into the arches.

**Modes** (`gMode`): 1 car, 2 x-ray shell (body + bolt-ons), 3 x-ray inner (wheels, chassis, engine, seats).

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
- `chassisSDF(p, t)` and `engineSDF(p, t)`: the perimeter frame, strut towers, suspension and greenhouse pillars; a transverse turbo four with a front-mount intercooler, the AWD driveline and the seats. `t` once timed each group growing in for the old 3D intro; the x-ray passes 99.

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
- an analytic contact shadow (the car footprint plus 4 wheel patches)
- headlight pool and spotlight pool
- an optional glossy reflection pass (`uReflect`), stronger in showroom mode

**Pillars:** 14 analytic boxes with hazard stripes.

**X-ray:** two passes. The inner one is solid; the shell is translucent, using fresnel alpha plus a faint grid.

**Post:** spotlight beam, fog, headlight flare with an anamorphic streak, ACES tone mapping, gamma, vignette and grain.

### Performance rules (read before editing the shader)

- **One call site each** for `march`, `calcN`, `calcAO`, `shadeObj` and `background`. Chrome on Windows compiles WebGL through ANGLE → HLSL, which inlines every call, so each extra call site of these copies the whole scene again and compile time balloons. `main()` uses a 2-pass loop (primary, then x-ray shell or floor reflection) for exactly this reason. Add new passes to that loop rather than calling `march` again.
- Loops start at `uZero` (a uniform that is always 0) so drivers can't unroll them.
- `carScene` and `bodySDF` return a bounding-box distance when far away (> 0.12 and > 0.10). **Don't feed those bounded distances into AO**: it causes rectangular floor shadows. That's why the floor uses the analytic footprint shadow.
- `app.js` adapts the render scale (`quality`: start 0.6 on desktop, 0.45 on mobile, range 0.34–0.9 of `min(devicePixelRatio, 1.5)`). It turns the floor reflection off below 0.5. Cost scales with the screen area the car covers.
- The shader compiles asynchronously via `KHR_parallel_shader_compile`. If it isn't ready after 10 s, the configurator's loading note says the first visit can take up to a minute on some graphics cards.
- **Keep `scene()` small.** The configurator once stuck on "Loading the 3D scene" on Windows because the unused 3D intro inside `scene()` was copied into every call site. Removing it took the software-renderer compile from 29 s to 16 s (the original upload took 18 s). `node tools/page.mjs` prints the compile time.

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
  - On portrait screens the camera distance is scaled up by `fit`.
- **Routing:** `#build` opens the configurator. Any other hash is the home page (in-page anchors).
- **Hotspots:** DOM labels projected from 3D points (`data-pos`) on the turbo, front coilover, front brake and exhaust. They're visible only in the x-ray section.
- **Rev-counter scroll gauge:** `.tach`. The `--sheen` CSS variable moves a highlight across the chrome headlines as you scroll.
- **Contact form and "Copy build":** both copy text to the clipboard for an Instagram DM. There is no backend.
- **Test hooks:** `window.RZ` exposes:
  - `state()`, which includes `heroDone` and `heroTime`
  - `skipHero()`
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
- **3D cars:**
  - The showroom preview's car is the CC BY 4.0 Evo IX by 3DCars4U, and the preview shows its credit. Wherever it goes on the main site, its credit must go in the footer.
  - The scroll sections and configurator still use the older primitive-built Evo IX-style car in the shader.
  - Do not use the vecarz Evo IX (CC BY-NC) without a commercial licence.
  - There are no prices anywhere.
- **The logo SVG is a redraw** of a small image of the client's logo. Swap in their vector file when available.

## Testing workflow

1. `npm run build`
2. For shader-only checks, run `node tools/shot.mjs '{"name":"x", ...uniforms}'`. Examples are in the file header.
3. For page states (sections, `#build`, mobile 390×844), run `node tools/page.mjs W H '<steps>'`. Call `RZ.skipHero()` first: the film plays (and usually finishes) while the tool waits for the shader to compile.
4. Compare against `reference/current-*.png` and the `video*` frames.

Headless Chromium falls back to SwiftShader (software) without a GPU: about 1–2 s per frame, and the first draw includes shader JIT. Trigger clicks from script (`page.mjs` already does), because slow frames block real clicks.

## Ideas not yet built

- Move the scroll sections and the configurator onto the three.js showroom with the same Evo model, so they match the hero:
  - scroll cameras like `HOME_CAMS`
  - paint, rim, caliper and tint swaps through its materials
  - aero parts would need extra meshes
- Draco-compress `lancer-evolution.glb`.
- A 9:16 version of the hero film and still for phones.
- Video 2 beats: opening doors, an exploded engine, a numbers section with real dyno figures from the client.
- Share a build by link. `buildCode()` is already a reversible mixed-radix base36 code; decoding isn't written yet.
- A real booking backend (WhatsApp link, form service).
