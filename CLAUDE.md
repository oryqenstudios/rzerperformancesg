# RZER Performance website

Website for **Rzer (RZER Performance)**, a Singapore car tuning and performance workshop (Instagram: `@rzerperformance.sg`). Built by a web designer for this client. Theme: **gloss black**. One page with three parts:

1. **Hero:** a realistic 15.6 s, 60 fps film in a professional tuning garage, fully lit (glossy black epoxy floor, a hexagonal LED ceiling, red neon, a wheel wall; the client's reference for its colours and look). It follows the client's reference, a 3D car assembly breakdown:
   - one camera, high in the garage's front corner, looks down at the car's front three-quarter and pushes in slowly
   - a swarm of small parts (bolts, bearings, pistons, cams, the turbo) flies in and builds the engine in mid-air, the suspension and brakes gather round it; the chassis frame drops in, the wheels and the bare body shell follow; then the carbon panels lock on, the front bumper last
   - the camera swings down and round to the head-on view, the headlights come on, the starter cranks (headlights dim), the engine fires, and the car idles
   - during the build the garage is a fixed plate (only the parts are laid over it), and the film ends on the client's chosen look: a full-carbon Evo IX, head-on and **centred in the frame**, with **no number plate** (`hero-final.jpg`, unchanged)

   It has **sound**: air rushing past the parts and a metallic clank as each one lands or locks (timed from the film's own motion, `swarm-motion.json`), then the starter cranking, the engine firing, one full rev, the blow-off valve, pops and bangs, and one last bang just before the logo. As the film settles on its final frame, the **RZER Performance logo** draws in **at the centre of the screen, over the car**, and the hero rests on the film's final frame (`hero-final.jpg`) with the slogan and buttons centred below. A photoreal three.js Evo IX used to take over from the film here; the client asked for it to be removed from the hero, and it now lives only in the showroom preview (`src/showroom/`). The film was generated with Higgsfield (keyframe stills, then a Kling clip between each pair); see `assets/generated/assembly/README.md`.
2. **Scroll sections** in the style of reference video 2: the real-time 3D Evo IX (the CC BY model, three.js), no text on the car, **in the same tuning garage as the hero** (the client asked for the rest of the site to have the hero's background): a glossy black epoxy floor with a real reflection, the white hexagonal LED ceiling, red neon, the wheel wall and the tool chests, built in 3D around the car (`src/showroom/garage.js`). The camera moves around it per section (side profile, rear three-quarter, x-ray with tracked hotspots, wheel close-up, headlights-on front view, contact).
3. **Configurator** (`#build`): a **photo configurator**. Real-looking photos of a stock Evo IX in the tuning garage (Higgsfield), from eight angles around the car plus close-ups, the interior and the engine bay. Every option (paint, wheel finish, calipers, aero, ride height, exhaust, lights/tint, carbon) is laid over the photo as its own layer, so any combination shows. Drag to turn the car (a short turning film plays while it is stock), with Interior and Engine bay buttons (fly-in films), a job card, build code, hold-to-compare-stock and copy-build. Without the photos (`assets/config/manifest.js`) the 3D Evo is the configurator. See `assets/generated/config/README.md`.

Part 2 (and the 3D configurator fallback) needs the page served over http(s). Opened from disk (file://) it falls back to the older shader car (`scene.frag`), which is also the fallback if the 3D car can't start. The photo configurator works either way.

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
- **The hero is a film.** The film files are `assets/site/hero-intro.mp4` (plus a `.webm` fallback), `hero-poster.jpg` and `hero-final.jpg`, about 15.5 MB in total (the browser loads only one film: the 8.0 MB MP4, or the 6.7 MB WebM). The films carry the synthesised engine sound (`tools/make-hero-audio.py`, muxed by `tools/mux-hero-audio.sh`).
- **The 3D car is three.js** for the scroll sections, the configurator and the preview (`dist/showroom/`):
  - `src/showroom/showroom.js` is an ES module that uses **three.js r170, vendored in `vendor/three/`** (MIT; no CDN). The page reaches it through an import map and a module script at the end of `index.html`.
  - The car is `assets/site/models/lancer-evolution-rzer.glb`: the CC BY 4.0 model by 3DCars4U (`assets/source/lancer-evolution.glb`) with its body split into named parts by `tools/split-model.py`. See `assets/site/models/CREDITS.md`.
  - `build.mjs` copies `assets/site/` to `dist/assets/`, `src/showroom/` to `dist/showroom/` and `vendor/` to `dist/vendor/`.
- **Serve over HTTP for the 3D car.** Module scripts don't load from `file://`, so it needs a web server (for example `python3 -m http.server -d dist` or GitHub Pages). From disk the page still works, with the shader car.
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
| `src/showroom/` | `showroom.js`: the three.js scene (car, garage, lights, post-processing) as `startShowroom()`. `garage.js`: the hero's tuning garage in 3D (reflective epoxy floor, LED honeycomb, neon, wheel wall, tool chests, the paint's environment map). `details.js`: the car's realistic materials and details. `parts.js`: carbon fibre, bolt-on aero, exhaust tips, the x-ray view and the controller that applies the configurator. `index.html`: a full-screen preview with drag-to-orbit (`dist/showroom/`) |
| `vendor/three/` | three.js r170 and the add-ons the showroom imports (glTF and Draco loaders, post-processing, Reflector for the garage floor, OrbitControls) |
| `assets/site/models/` | The 3D car (split into parts) and its credits |
| `assets/site/config/` | The photo configurator: per view, the photo in each paint, the option layers, ride-height masks; `clips/` (turning and fly-in films); `manifest.js` (`window.RZ_PHOTOS`) |
| `assets/generated/config/` | How the configurator photos were made: guides, chosen base photos, ID maps, landmarks, prompts; README |
| `tools/render-guides.mjs`, `tools/render-ids.mjs` | Render the 3D Evo from the configurator's cameras: layout guides for the photos, and part-ID maps that keep each layer to its part |
| `tools/config-jobs.py`, `tools/config-gen.py` | The configurator's views, options and prompts; run the Higgsfield edits ten at a time (resumable) |
| `tools/config-build.py`, `tools/config_layers.py` | Align the edits, cut the option layers and masks, encode the films, write `assets/site/config/` |
| `assets/source/` | The model as downloaded, input to `tools/split-model.py` (not shipped) |
| `assets/generated/` | Higgsfield stills, the segment prompts (`prompts/`), `film-plan.json`, and how the shipped files were made |
| `tools/higgsfield-i2v.sh` | Generate one film segment (image-to-video) and pull its last frame |
| `tools/assemble-film.py` | Reverse, retime and join the segments per `film-plan.json` (the original car-park film, no longer shipped) |
| `tools/higgsfield-v2v.sh` | Restyle a whole film with Seedance video-edit (how the film moved into the tuning garage) |
| `tools/higgsfield-edit.sh` | Edit a still from one or more reference images (Kling or Seedream image edit) |
| `tools/higgsfield-flf.sh` | Generate a clip between a given first and last frame (Kling O3) |
| `tools/assemble-build.py` | Lay the build-up clips onto the reference's timeline per `assets/generated/build-plan.json` |
| `tools/finish-swarm-film.py` | Build the hero film (the shipped one): the swarm, chassis and body clips over the fixed plate with the push-in, smoothed joins (optical-flow morphs, motion-paced timing), the swing to head-on, the engine start, the idle; encode the web files (without sound) and the poster; write `swarm-motion.json` for the sound |
| `tools/film_lib.py` | Shared by the film scripts: steadying clips onto a plate, tone matching, moving-part masks, optical-flow retiming |
| `tools/finish-assembly-film.py`, `tools/finish-roll-film.py`, `tools/roll-keys.py` | Earlier hero films (the transforming assembly; the wheel roll), kept for reference |
| `tools/finish-garage-film.sh` | The previous hero (liquid build-up and carbon cure), kept for reference |
| `tools/bridge-clips.py` | Join the start of one clip to the end of another with matched framing (kept for fixing clips; not used by the shipped film) |
| `tools/join-cure.py` | The join to the carbon cure: a hard cut with the framing matched across it (measured with OpenCV), and camera jumps eased out |
| `tools/make-hero-audio.py` | Synthesise the hero film's sound (assembly clanks, engine start, revs, pops and bangs, workshop reverb), timed to the film's frames |
| `tools/mux-hero-audio.sh` | Put that sound (or any WAV) into `hero-intro.mp4` and `.webm`. Run it after every `finish-swarm-film.py assets/site` |
| `tools/shot.mjs` | Render the shader alone with any uniforms → `tools/shots/*.png` |
| `tools/split-model.py` | Split the model's merged body into named part nodes (shell, bonnet, roof, mirrors, lip, wing, tip, interior) |
| `tools/page.mjs` | Drive the built page through states (intro time, scroll, `#build`, clicks) → screenshots + page errors. `RZ_URL=http://…` tests the 3D car |

## Hero (`#hero-media` in `src/index.html`, controller in `src/app.js`)

- The film plays inline once. `LOGO_LEAD` (0.925 s) before it ends, just after the last bang of the sound, `revealLogo()` adds `.revealed` to the logo, so the logo comes in as the film settles on its final frame. On `ended`, `finishIntro()` adds `.is-final` (fading in `hero-final.jpg`) and swaps `is-intro` for `intro-done`, which brings in the tagline and buttons.
- **Layout:** the film ends with the car head-on in the middle of the frame (`object-position: 50% 50%`). `.hero-copy` covers the hero: the logo is centred at `--logo-y` (46% of the height, over the base of the windscreen, whose dark glass keeps it legible), and the slogan and buttons are centred along the bottom.
- **Sound, with no sound button (the client asked for none):**
  - `startHero()` first plays the film with sound. Browsers allow that only for sites the visitor already trusts (Chrome's media engagement, a per-site sound setting).
  - Refused, it plays muted, and the first click, tap or key press (`GESTURES`, not Esc) unmutes it in sync.
  - Speeding up mutes it (4× audio sounds broken). Skip stops it, which also covers the accessibility rule that automatic sound must be stoppable.
- **Skip** cuts straight to the final frame. Esc, the wheel or a swipe set `playbackRate = 4`. `prefers-reduced-motion` and in-page hash links go straight to the still.
- **Fallbacks:** if autoplay is refused, the last `<source>` errors, or nothing has played after 7 s, it shows the still. The still is the 2K end frame the film was generated to land on; once both are blurred a little they differ by about 1.3% per pixel (the still is just sharper), so the crossfade doesn't show.
- While the film covers the stage (home page, `scrollY < 2`), the old shader view draws only every 30th frame.
- **Portrait screens** (`max-aspect-ratio: 9/10`): the media takes the top of the screen, `--media-h` = 72svh but no taller than 125vw, so the whole car fits across a phone. The logo sits over the car (46% of `--media-h`, sized to half of it) and the slogan and buttons are centred on black below. The hero's own black background hides the 3D stage behind it, and `.hero::after` fades it into the next section.
- **Logo:** inline SVG, white, no background, redrawn from the client's logo. The words are bold slanted RZER and outlined PERFORMANCE, in Archivo at 125% width, skewed −12°. The reveal follows the client's brief (a light beam over bevelled glass, then the slogan with a shimmer). It runs on `.revealed`, about 1.7 s, in vector so the mark never changes shape:
  1. The mark appears as faint dark glass (`.logo-base` under a mask at 12%).
  2. `.logo-beam`, a soft, slanted volumetric beam with a haze around it, sweeps left to right. Behind it the mark turns solid white (the base mask slides with it).
  3. `.logo-glint`, a copy of the mark through the `#logo-glass` SVG filter (specular lighting on a blurred outline, lit from both sides), shows only in a narrow band at the beam, so the bevelled glass edges catch the light as it passes.
  4. `.hero-copy::before` darkens the frame to a deep matte black behind the logo, and along the bottom behind the slogan and buttons. A soft dark drop shadow on `.logo-base` lifts the outlined lettering off the carbon bonnet.
  5. Once the beam has crossed (`LOGO_SWEEP` in `app.js` sets `--slogan-delay`), the slogan fades in and one shimmer brightens it from grey to `--chrome`; the buttons follow. Then everything holds.

  The masks and the beam share one timing (`--sweep` on `.logo`); the CSS comment above the logo rules gives the geometry that keeps them together.
  Reduced motion turns the animations off. Replace it with the client's vector file when they send one.

## 3D car (`src/showroom/`)

`startShowroom({ canvas, interactive, external, onReady, onError })`:
- **external** (the main page): `app.js` sets the camera each frame with `setView({ pos, target, fov, shift })` (the same camera model as the shader: vertical fov, lens shift in NDC through `setViewOffset`), the configurator values and view state with `setState()` (the CATS uniforms plus `lights`, `xray`, `bay`, `reflect`), the pixel scale with `setPixelScale()`, and draws with `render(dt)` from its own loop.
- **interactive**: the preview at `dist/showroom/`, with OrbitControls and its own loop, showing `PREVIEW_STATE` (the factory car in silver).
- Loading: the page's module script starts it once the hero film can play through (or after 4 s), so the film gets the connection first. Every material variant is compiled before `onReady` (the page's `stage3d:ready` event), so swapping a part never stalls.

**Parts** (`tools/split-model.py` → node names; `details.js` → `dressed.parts`):
- `rz_shell` (paint, glass, lights, trim), `rz_bonnet` (with its vents), `rz_roof`, `rz_mirrors`, `rz_lip` (the body-colour front lip), `rz_wing` (blade and two uprights), `rz_tip` (the factory muffler and single tip), `rz_interior`.
- Found per connected piece (vertices welded) from where the piece sits; the bonnet is cut out of the shell by position (`BONNET` in the tool). To check a change, open the preview, tint each part a loud colour through `SHOWROOM.parts.dressed.parts` and render it from a few sides.

**Configurator mapping** (`carController` in `parts.js`):
- paint colour, metal (flake on/off) and roughness (satin: no clear coat); rim colour/finish; caliper colour; window tint; light colour and headlights on/off
- ride height: the `car_body` node drops in its own units while the wheels stay; `bodyRig` (lenses, headlights, add-ons, internals) drops with it
- carbon bonnet/roof/mirrors/lip: their paint meshes swap to `carbonBody` (a 2×2 twill in object space that fades to plain lacquer once a tow is under a pixel)
- add-ons (`buildAddons`, fitted to the model): a splitter following the front lip's outline with canards on the bumper corners, skirts swept along the sills, a seven-fin diffuser, a lip spoiler on the boot's trailing edge, a GT wing (inverted airfoil, end plates, gurney flap, uprights on the boot); the factory wing hides for any other wing option
- exhaust: `rz_tip` for the factory single tip; twin, quad and centre layouts are added tips in polished, burnt titanium (vertex-colour heat tint) or black ceramic
- **x-ray**: exterior materials dissolve through a screen-space dither (`addDissolve`, no transparency sorting or recompiles), a ghost copy of each exterior mesh glows with fresnel edges and a 12.5 cm grid, and `buildInternals` shows the 4G63 with its red cam cover, the turbo, intercooler pipes, coilovers at each corner, the exhaust and the driveline. The interior, wheels and brakes stay solid.
- `bay` (the configurator) lifts the key light by 12%. The shadow map only redraws when the car changes shape.
- **Measuring parts:** the split model's parts share one vertex list per original piece (each part only has its own index list), so `geometry.boundingBox` and `Box3.setFromObject` measure the whole original piece. Use `worldPoints()` / `partBox()` from `parts.js`, which only count the vertices a part's triangles use.
- Options the model can't show are `sdfOnly` in CATS and hidden while the 3D car is in use: wheel designs, wheel sizes, the widebody kit.

- **Car config `CAR`:** the model URL, real length (4.49 m) and width (1.77 m), and the tail-light material.
  - The model is scaled to its real length, centred and set on the floor. It is turned so its front faces +x, away from the tail lights.
  - It comes out about 5% too wide, so it is narrowed to the real width, measured across the wheel arches below the mirrors. The track ends up at about 1.52 m, as on the real car.
- **Details (`details.js`, `dressCar()`):** the model has no UVs or textures, so every PBR channel (colour, roughness, metalness, relief) is computed per pixel from the surface position by `micro()`: bump mapping from screen-space derivatives (no UVs or tangents), sizes in metres, and each pattern fades out with `rzVis()` once it is smaller than a pixel. In effect texture maps of unlimited resolution.
  - **Telling parts apart:** the model shares materials between parts, so `dressCar()` goes by the node each part hangs under. Those nodes are `car_body` (GLTFLoader turns spaces in node names into underscores) with its `rz_*` part nodes, `w1`–`w4` and `b1`–`b4`.
  - **Paint:** `MeshPhysicalMaterial` with a rough metallic base (0.36) under a mirror clear coat.
    - Metallic flake tilts the base normal per 1.5 mm cell, and fades out by `fwidth` once a flake is under a pixel, so it doesn't alias into noise.
    - The clear coat gets a faint 1.5 cm orange-peel ripple.
    - Both are in model units, converted using the body mesh's world scale.
  - **Wheels:**
    - tyres: plain moulded sidewalls (no lettering) with a rim-protector ring and fine ribs by the bead on the outer face (`uOutward` per tyre), tread grooves and sipes, rubber grain; all in the tyre's local cylinder (axis = local y)
    - gloss black clear-coated rims (`wire_007007007`)
    - machined cast-iron discs with a dark hat and two staggered rings of 24 cross-drilled holes (`wire_154154154`; friction ring about 4.3–6.7 local units)
    - red calipers with a faint cast grain (everything under `b1`–`b4`)
    - a chrome centre cap
  - **Body:** satin black trim with a moulded stipple, tinted glass, and deep-red tail-lamp lenses with fine optic ridges and a faint glow.
  - **Interior** (`rz_interior`): grained leather with sheen, with perforated inserts inside the seats' box (front seats and rear bench); brushed aluminium, piano-black trim and red accents.
  - **Headlights:** the lens triangles are split out of the window glass by position (within 0.62 m of the nose, 0.45–0.8 m high, more than 0.3 m off centre) into a clear-glass mesh. Behind each lens sit two emissive projectors with halo rings.
  - **No text anywhere** (the client's brief): both number plates are blank black plates in a thin silver frame, on planar UVs computed in world space.
- **Garage (`garage.js`, the client's brief: the same background as the hero).** The tuning garage from the hero film, built in 3D around the car, with the hero's proportions (`ROOM`: 12.8 × 8.8 m, 3.8 m high; seen head-on from the front, the tool chests are on the left, +z, and the wheel wall on the right, -z):
  - **Floor:** black epoxy like wet glass: a `Reflector` (the scene drawn mirrored, at half the canvas's resolution) through a custom shader that softens it a little, warps it by faint waves, strengthens it at grazing angles and lays it over a dark base with faint marble veins. When the page turns reflections off (`reflect: 0`, below 0.7 render scale), a plain glossy floor shows instead.
  - **Ceiling:** a honeycomb of white LED tubes (one `InstancedMesh` of edges, with a soft additive glow so the thin tubes don't break into dots in the distance) on dark tiles.
  - **Walls:** charcoal panels, lit evenly by the honeycomb, so their light is drawn in (unlit materials, a little brighter towards the ceiling). Red neon: vertical strips on the side and front walls (none behind the wheel shelves), a line along the top of every wall and the back wall's line at roof height, each with a faint red wash. The front wall has a roller door.
  - **Wheel wall** (right): four shelves of tyres and multi-spoke rims (alternately silver and dark), with red LED strips along the shelf edges. **Tool chests** (left): black chests with red side panels, drawer handles, top boxes and cans.
  - **Cutaway:** the room is smaller than the orbit some of the page's cameras take, so walls face inwards only (a camera outside a wall looks through it), and whatever stands against a wall hides while the camera is outside that wall or within 1.2 m of it (`update(camera)`, every frame).
  - **Reflections on the car:** a PMREM map of the same garage (the honeycomb drawn thicker, the neon, dark walls), set **per car material**, never as `scene.environment`, which ignores each material's `envMapIntensity`.
  - **Direct light:** a key from straight above (the honeycomb) that casts the car's shadow onto a `ShadowMaterial` catcher, a soft fill, faint red rims from either side (the neon) and a hemisphere fill.
- **Post:** `EffectComposer` → a NaN scrub → a little `UnrealBloomPass` (the lit headlights, the neon and the LED tubes pass its threshold) → `OutputPass` with `NeutralToneMapping` at exposure 0.9, so paint colours stay true and silver stays below white. The scrub matters: one NaN pixel from any shader (for example a zero-length normal where a triangle is smaller than a pixel) gets blurred over the whole frame by the bloom and the view goes black. `rzBump()` guards against that too.
- **Shader compile:** `renderer.compileAsync()` compiles every shader before `onReady`. It runs in the background where `KHR_parallel_shader_compile` exists, so the page and the film don't stall.
- **Cost:** the model is about 500,000 triangles and 17 MB uncompressed. The scene is drawn twice per frame (once more, at half resolution, for the floor's reflection; skipped on slow devices) plus the shadow map when the car changes, and not at all while the hero film covers it. Compressing the GLB would cut the download several times over.

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
  - `HOME_CAMS` per section (`data-cam`). The camera is interpolated in orbit space (target, r, θ, φ) from scroll position so it never passes through the car. The hero camera looks at the front three-quarter from the car's left (the film covers it).
  - `shift` is a lens shift in NDC that places the car beside the copy.
  - `BUILD_VIEWS` holds one camera per configurator category.
  - On portrait screens the camera distance is scaled up by `fit`.
- **Routing:** `#build` opens the configurator. Any other hash is the home page (in-page anchors).
- **Photo configurator** (`photoMode`, the "photo configurator" section of app.js): `psCompose()` draws a view into a canvas: the paint's photo, the active layers in a fixed order, then the ride-height shift (body down over the wheels, its reflection up, the empty workshop behind; only in the five orbit views where the empty-workshop edit was clean). A new view crossfades in. `CAT_VIEW` picks the view per category; `psOption()` keeps the current view if it shows the changed option. Films play only while the car looks stock in silver (`psStockLook`). It starts from the stock car. Test hooks: `RZ.photo()`, `RZ.photoShow(view)`.
  - The photos are generated, so a few parts differ a little between views; the GT wing is solid from behind but smaller and less connected seen from the side and front.
  - Ride height splits the photo at the line where the tyres meet the floor (found from the tyres' reflections in the 3D part map): above it the body and every part on it (even in front of a wheel) drop; below it the reflection rises; the wheels are the photo with only the rim and caliper layers.
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
- **The configurator photos are AI-generated** (Higgsfield): a likeness of a stock Evo IX, not a real car, with the 3D model's mesh wheels; no badges or plates.
- **The hero film and still are AI-generated** (Higgsfield). The ending was generated to look like a full-carbon Evo IX photo the client sent (only as a reference: that photo is not in the repo or on the site, and its plate and branding are not reproduced). The car has no number plate at the end; the liquid car before the cure has a blank plate that melts away as the carbon sets. Before the cure the liquid car has an older Evo V/VI-style front and a red badge; the finished car keeps a Mitsubishi grille badge. Confirm with the client that the badge is fine.
- **3D cars:**
  - The scroll sections, configurator and preview use the CC BY 4.0 Evo IX by 3DCars4U (split into parts for the site, which the licence allows with credit). Its credit is in the footer (`#model-credit`) and on the preview; keep it.
  - The older primitive-built car in the shader is only the file:// and no-WebGL2 fallback.
  - Do not use the vecarz Evo IX (CC BY-NC) without a commercial licence.
  - There are no prices anywhere.
- **The logo SVG is a redraw** of a small image of the client's logo. Swap in their vector file when available.

## Testing workflow

1. `npm run build`
2. For shader-only checks, run `node tools/shot.mjs '{"name":"x", ...uniforms}'`. Examples are in the file header.
3. For page states (sections, `#build`, mobile 390×844), run `node tools/page.mjs W H '<steps>'`. Call `RZ.skipHero()` first. Serve `dist/` and set `RZ_URL=http://127.0.0.1:8765/` to test the 3D car; without it the tool opens the file and gets the shader car. Configurator colours ease in over about 20 frames.
4. Compare against `reference/current-*.png` and the `video*` frames.

Headless Chromium falls back to SwiftShader (software) without a GPU: about 1–2 s per frame, and the first draw includes shader JIT. Trigger clicks from script (`page.mjs` already does), because slow frames block real clicks.

## Ideas not yet built

- Wheel designs, wheel sizes and the widebody kit on the 3D car: they need new wheel meshes and flared arches.
- Compress `lancer-evolution-rzer.glb` (17 MB): Draco or mesh quantization would cut it several times over.
- A 9:16 version of the hero film and still for phones.
- Video 2 beats: opening doors, an exploded engine, a numbers section with real dyno figures from the client.
- Share a build by link. `buildCode()` is already a reversible mixed-radix base36 code; decoding isn't written yet.
- A real booking backend (WhatsApp link, form service).
