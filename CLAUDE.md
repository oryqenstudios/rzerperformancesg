# RZER Performance website

Website for **Rzer (RZER Performance)**, a Singapore car tuning and performance workshop (Instagram: `@rzerperformance.sg`). Built by a web designer for this client. Theme: **gloss black**. One self-contained page with three parts:

1. **Hero intro** that recreates reference video 1: black liquid pools on a car-park floor → glossy dome → droplet → ferrofluid spikes → wire lattice → chassis with cage → body pours in like liquid → headlights flicker on → chrome `RZER` wordmark wipes in.
2. **Scroll sections** in the style of reference video 2: the camera moves around the car per section (side profile, rear three-quarter, x-ray with tracked hotspots, wheel close-up, headlights-on front view, contact).
3. **Configurator** (`#build`): orbit the car and swap parts live (paint, wheels, calipers, aero, stance, exhaust, lights/tint, carbon) with a job card, build code, hold-to-compare-stock and copy-build.

Reference frames are in `reference/` (`video1-*`, `video2-*`). Renders of the current state are in `reference/current-*.png`. Look at both before changing visuals.

## Commands

```bash
npm install && npx playwright install chromium   # playwright is only for the screenshot tools
npm run build        # src/* -> dist/index.html (single file)
npm run dev          # rebuild on every change in src/; refresh dist/index.html in the browser
```

`dist/index.html` works opened straight from disk (file://). The only network request is Google Fonts (Archivo).

## Stack and constraints

- **No libraries and no 3D assets.** Raw WebGL2 with one fragment shader that raymarches signed distance fields (SDFs). The car, garage, liquid and lattice are all modelled in GLSL. This was chosen because the original build environment had no CDN access, and because SDFs let the liquid morph straight into the car. Moving to Three.js later would be a new renderer, not a port.
- Output is **one HTML file**. `build.mjs` inlines `style.css`, `scene.frag` (into a `<script type="x-shader/x-fragment">`) and `app.js` into `src/index.html` at the `/*__CSS__*/`, `/*__FRAG__*/`, `/*__JS__*/` placeholders.
- It was first published as a claude.ai artifact. That host's limits shaped some choices: inline scripts only, no fetch, no form posting, and hash routes must be a plain `#name`. Hosted anywhere else these limits go away.

## File map

| File | What it holds |
|---|---|
| `src/index.html` | Markup: nav, hero, sections (`data-cam` keys), footer, rev-counter gauge, x-ray hotspots, configurator shell |
| `src/style.css` | Design tokens and every layout rule (desktop, ≤900px mobile, reduced motion) |
| `src/app.js` | WebGL setup, render loop, adaptive resolution, intro timeline, scroll cameras, routing, configurator UI, parts catalogue, contact form |
| `src/scene.frag` | The whole 3D scene |
| `tools/shot.mjs` | Render the shader alone with any uniforms → `tools/shots/*.png` |
| `tools/page.mjs` | Drive the built page through states (intro time, scroll, `#build`, clicks) → screenshots + page errors |

## Shader (`src/scene.frag`)

**World:** metres, y up, car front at **+x**, **+z is the car's right** (right-hand drive, so the steering wheel is at +z). Floor y=0, ceiling `CEIL`=3.35. Tyre radius `R`=0.345, front axle `FX`=1.40, rear axle `RX`=-1.32.

**Body space:** `pb = p + vec3(0, uRide, 0)`. Lowering moves the body down while the wheels stay on the floor and tuck into the arches.

**Modes** (`gMode`): 0 intro, 1 car, 2 x-ray shell (body + bolt-ons), 3 x-ray inner (wheels, chassis, engine, seats).

**Body** `bodySDF`: a smooth intersection of three extruded 2D views:
- side profile polygon `PROF[20]` (x,y)
- plan rounded box (x,z), with a front corner radius of 0.70 and rear 0.45
- cross-section via `cabinHW` (tumblehome above `shoulderY(x)`) and `halfW(x)` (fender bulges, plus widebody via `uWide`)

It then cuts wheel arches (only for |z|>0.5), a side scoop and exhaust openings, and adds the ducktail.

**Bolt-on parts:**
- `carbonParts`: lip or splitter with canards, skirts, diffuser fins, lip spoiler, GT wing
- `mirrorSDF`
- `exhaustSDF`: dual, quad or centre layouts via `exhaustSlot`
- `wheelSDF`: tyre, barrel, lip, 4 spoke styles via polar repetition, rotor, caliper
- `chassisSDF` and `engineSDF`: used by the intro and the x-ray

**Materials:** `scene()` returns a `M_*` id. Zones on the body (glass, DRL strip and projectors, grille honeycomb, light bar, panel gaps, carbon roof and bonnet) are decided in `shadeObj` from body-space position and normal, not in the SDF.

**Lighting:** there are no light sources or shadows. `envCol()` is an analytic environment:
- ceiling tube rows every 3 m in x
- soft glow from the side bays
- a horizon line
- softboxes in the configurator (`uBay`)

Gloss black only reads through these reflections, so **any change to `envCol` changes the whole look**.

**Floor:**
- fbm concrete and lane markings
- in car modes, an analytic contact shadow (the car footprint plus 4 wheel patches)
- a headlight pool
- an optional glossy reflection pass (`uReflect`)

**Pillars:** 14 analytic boxes with hazard stripes.

**Intro clock** `uT` (seconds; ≥ 9.5 means built):
- **0–3 s:** puddle → dome → droplet (SDF `mix`).
- **3–5.3 s:** spikes → lattice (polar repetition, `rectR`, rectangle rings).
- **5.3–6.6 s:** chassis, engine and wheels inflate (distance offsets).
- **6.6–8.1 s:** the body fills from below with a rippling cut plane (`M_LIQUID` until 8.15).
- **8.2 s:** headlights. The flicker is driven from JS (`introLights`).

**X-ray:** two passes. The inner one is solid; the shell is translucent, using fresnel alpha plus a faint grid.

**Post:** fog, headlight flare with an anamorphic streak, ACES tone mapping, gamma, vignette and grain.

### Performance rules (read before editing the shader)

- **One call site each** for `march`, `calcN`, `calcAO`, `shadeObj` and `background`. Chrome on Windows compiles WebGL through ANGLE → HLSL, which inlines every call, so each extra call site of these copies the whole scene again and compile time balloons. `main()` uses a 2-pass loop (primary, then x-ray shell or floor reflection) for exactly this reason. Add new passes to that loop rather than calling `march` again.
- Loops start at `uZero` (a uniform that is always 0) so drivers can't unroll them.
- `carScene` and `bodySDF` return a bounding-box distance when far away (> 0.12 and > 0.10). **Don't feed those bounded distances into AO**: it causes rectangular floor shadows. That's why the floor uses the analytic footprint shadow in car modes.
- `app.js` adapts the render scale (`quality`: start 0.6 on desktop, 0.45 on mobile, range 0.34–0.9 of `min(devicePixelRatio, 1.5)`). It turns the floor reflection off below 0.5. Cost scales with the screen area the car covers.
- The shader compiles asynchronously via `KHR_parallel_shader_compile`. The intro clock only starts once the compile finishes.

## App (`src/app.js`)

- **Parts catalogue `CATS`:** categories → groups `{key, label, card, items}`. Each item is `{id, name, note, swatch | mark, u: {uniforms}}`. The **first item in a group is stock**. `STOCK` and `SIGNATURE` (the Rzer showcase build, also used on the home page) are configs; `uniformsFor(config)` merges item uniforms. Float and vec uniforms ease toward their targets; int uniforms switch instantly.
- **Add a part:**
  1. Add the SDF and/or material to the shader behind a new uniform.
  2. Add an item or group in `CATS`.
  3. If the uniform is an int, add it to `INTS`.
  4. If it needs its own camera angle, add a `BUILD_VIEWS` entry.
- **Cameras:**
  - `HOME_CAMS` per section (`data-cam`). The camera is interpolated in orbit space (target, r, θ, φ) from scroll position so it never passes through the car.
  - `shift` is a lens shift in NDC that places the car beside the copy.
  - `BUILD_VIEWS` holds one camera per configurator category.
  - `INTRO_KEYS` is a Catmull-Rom path through the intro.
  - On portrait screens the camera distance is scaled up by `fit`.
- **Routing:** `#build` opens the configurator. Any other hash is the home page (in-page anchors).
- **Intro:** 9.6 s. Skip, scroll, wheel or Esc fast-forwards it ×7; `prefers-reduced-motion` skips it. The wordmark is revealed with the `.revealed` class.
- **Hotspots:** DOM labels projected from 3D points (`data-pos`). They're visible only in the x-ray section.
- **Rev-counter scroll gauge:** `.tach`. The `--sheen` CSS variable moves a highlight across the chrome headlines as you scroll.
- **Contact form and "Copy build":** both copy text to the clipboard for an Instagram DM. There is no backend.
- **Test hooks:** `window.RZ` exposes `state()`, `setIntro(t)`, `setConfig(obj)`, `quality`, `settle(bool)`. `settle(true)` snaps the camera so screenshots don't wait for easing.

## Design system

- **Tokens** (`:root` in style.css):
  - `--black` #000 (true black, not a tinted near-black)
  - `--chrome` #e8ebee
  - `--steel`, `--graphite`, `--hair`
  - `--redline` #ff3b2f: **only** for the rev-counter redline. The red tail lights are part of the 3D scene.
- **Type:** Archivo variable from Google Fonts. Display text is `font-stretch: 125%`, weight 800–900, uppercase, with the `.chrome` gradient. Body text is Archivo at normal width.
- **Buttons:** chrome gradient (primary) or ghost. 3px radius.
- **Copy rules:** British English (bonnet, tyres, colour, centre). Sentence case outside the display headlines. No eyebrow labels, no arrows appended to buttons. Numbered markers appear only in the process steps, which really are a sequence.

## Content status: confirm with the client

- **All copy is a placeholder.** It was written from the brief "car tuning and performance" because the client's Instagram couldn't be read. Confirm the services, process and tagline.
- **No address, phone or opening hours.** Bookings point to an Instagram DM.
- **The demo coupe is an original design**, not a real model. There are no prices anywhere.

## Testing workflow

1. `npm run build`
2. For shader-only checks, run `node tools/shot.mjs '{"name":"x", ...uniforms}'`. Examples are in the file header.
3. For page states (intro time, sections, `#build`, mobile 390×844), run `node tools/page.mjs W H '<steps>'`.
4. Compare against `reference/current-*.png` and the `video*` frames.

Headless Chromium falls back to SwiftShader (software) without a GPU: about 1–2 s per frame, and the first draw includes shader JIT. Trigger clicks from script (`page.mjs` already does), because slow frames block real clicks.

## Ideas not yet built

- Real car platforms the client works on (likely Three.js with licensed GLB models whose part meshes are named), keeping the same catalogue and job card.
- Video 2 beats: opening doors, an exploded engine, a numbers section with real dyno figures from the client.
- Share a build by link. `buildCode()` is already a reversible mixed-radix base36 code; decoding isn't written yet.
- A real booking backend (WhatsApp link, form service) once the site is hosted outside claude.ai.
