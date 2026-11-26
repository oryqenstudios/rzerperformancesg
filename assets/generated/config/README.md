# Photo configurator

The configurator (`#build`) shows real-looking photos of a stock Mitsubishi Lancer Evolution IX in the tuning workshop,
made with Higgsfield, instead of the 3D car (which still draws the scroll sections, and is the configurator's fallback
when the photos are missing). Every option a visitor picks is laid over the photo as its own layer, so any combination
shows in one picture. The shipped files are in `assets/site/config/` (`build.mjs` copies them to `dist/assets/config/`).

## Views

| View | What it shows | Used for |
|---|---|---|
| `a000` … `a315` | eight views around the car at 45° steps, from the front (`a000`) towards its right side; the camera 6.5 m out at 1.25 m | dragging to turn the car; paint (`a045`), aero (`a135`), stance (`a090`) |
| `wheel`, `exhaust`, `headlight`, `top` | close-ups from the 3D configurator's category cameras; `top` looks down on the bonnet and roof | wheels and brakes, exhaust, lights, carbon |
| `int-front`, `int-dash`, `int-gauges`, `int-rear` | the cabin | the Interior button |
| `eng-bay`, `eng-detail` | the engine bay, bonnet up | the Engine bay button |

## How the photos were made

1. **Layout guides.** `tools/render-guides.mjs` renders the 3D Evo (factory spec, liquid silver) from each exterior
   camera into `guides/`. They fix each view's exact angle, framing and car size.
2. **Base photos.** Kling Image 4.0 edit (`tools/higgsfield-edit.sh kling`) with the guide, the hero's garage frame
   (`../garage-cut.jpg`) and, for consistency, already-made views of the same car as references. The prompt for views
   other than the first spells out which way the car faces: with only a front three-quarter as reference, Kling turned
   rear three-quarters into front ones and mirrored the sides. Takes were picked by eye; the picks are in `base/`.
   The interior and engine-bay photos have no guide (prompts in `tools/config-jobs.py`).
3. **Every option is an edit of the base photo** ("change only X; keep everything else pixel for pixel"):
   five more paints, the empty workshop (the car removed), a matte floor, and each part option. `tools/config-jobs.py`
   holds the views, which options show in each, and every prompt; `tools/config-gen.py` runs them ten at a time and
   resumes. The wing delete is made from each paint's photo (it uncovers painted boot); the lip spoiler and GT wing are
   made from the silver wing-delete photo. Generated files go to `src/` (not committed).
4. **Layers.** `tools/config-build.py` aligns each edit onto its base (ECC; the worst local misfit is about 1–2.5 px)
   and keeps what changed, but only on the option's own part: `tools/render-ids.mjs` renders part-ID maps of the 3D car
   from the same cameras (stock, and with the add-ons fitted, plus the car's mirror image in the floor), which are
   aligned onto the photo by matching the car's outline (what disappears in the empty-workshop edit; overlap 0.89–0.95).
   Without that, Kling's re-rendered paint reflections came along as silver blotches on cars of other colours. Paint
   (and its floor reflection) is every pixel that differs a lot between the six paint photos; it is dropped from every
   layer, so no silver comes along onto another colour, with these exceptions:
   - carbon and black parts (bonnet, roof, mirrors, lip, splitter, skirts, diffuser, wings, exhaust) keep paint they
     cover with something dark, the weave's highlights filled in
   - rims keep each wheel face whole (the hull of the change), since the paint test also catches rim reflections
   - calipers keep only strongly coloured pixels, never the spokes in front of them
   - window tint keeps only glass the edit made darker (one edit turned the windscreen milky)
   - the wing delete for every paint is cut to the outline of the wing removed from the silver photo (a silver wing
     on the dark wall gives a clean outline; on dark paints the wing barely differs from the wall and left holes)
5. **Ride height** is not photographed (the split between body and reflection is the line where the tyres meet the floor,
   so a splitter or skirt hanging over the floor drops with the body; the front and rear views are fitted to the 3D maps
   by hand-placed landmarks in `landmarks.json`, as the car's long floor reflection pulls the automatic fit down): the page moves the body down by 30 mm (lowering springs) or 50 mm
   (coilovers), converted to pixels per view from the camera distance, over wheels that stay put, and moves its floor
   reflection up, with the empty workshop behind. The masks (`m-body`, `m-tyres`, `m-refl`, `m-floor`) come from the
   3D ID maps trimmed to the photo's own car outline. (A lowered edit from Kling moved the whole car about 120 px, so
   parts made on the factory-height photo would not have lined up.)
6. **Films.** Kling O3 first-last-frame (`tools/higgsfield-flf.sh`) between neighbouring base views gives the one-step
   turns (`clips/spin-*`), and from the right side into the cabin and from the front into the engine bay the fly-ins.
   `config-build.py` speeds them up (1 s per turn, 2.5 s per fly-in), adds each turn backwards too, and encodes
   1280×720 H.264. They play only while the car looks stock in silver, since they show the stock car.

```bash
# from the repo root, with dist/ served for the 3D renders: python3 -m http.server -d dist 8765 &
node tools/render-guides.mjs                       # guides/ (once)
python3 tools/config-jobs.py bases > jobs.json && python3 tools/config-gen.py jobs.json   # then pick takes into base/
python3 tools/config-jobs.py edits > jobs.json && python3 tools/config-gen.py jobs.json
python3 tools/config-jobs.py wing > jobs.json && python3 tools/config-gen.py jobs.json    # after the paints
node tools/render-ids.mjs                          # ids/
pip install opencv-python-headless
python3 tools/config-build.py                      # assets/site/config/ and manifest.js
```

## Brand parts fitted to the car

The configurator's HKS, TOMEI and ENDLESS parts (`PARTS` in `src/app.js`) that show on the car each have photo
layers made the same way as the options: `python3 tools/config-jobs.py parts` lists one Kling edit per part and view,
each given the part's product photo (on light grey, `parts-ref/`, from `assets/site/parts/`) as image 2:

| Parts | Views | Cut to (`build_brand_parts()` in `tools/config-build.py`) |
|---|---|---|
| 7 exhausts | `a135`, `a180`, `a225`, `exhaust` | around the factory tip and where the 3D car's added tips sit, with its floor reflection |
| 7 front brake kits, 2 front discs | `a045`, `a090`, `a270`, `a315`, `wheel`, `headlight` (discs: `wheel`, `a045`, `a315`) | inside the front wheels: each wheel the 3D map shows is front or rear by the nearest axle projected through the view's camera; around the factory caliper and disc, out to the rim, minus the spokes |
| 3 rear brake kits, 2 rear discs | `a090`, `a135`, `a225`, `a270`, `exhaust` (discs: `exhaust`, `a135`, `a225`) | the same, inside the rear wheels |
| HKS Brake System | all of the above | inside all four wheels |
| turbos, manifold, heat shield, 3 intakes, intake hose, 2 blow-off valves, Coil Pro | `eng-bay`, `eng-detail` | a box per view around where that kind of part sits (`ENGINE_ROI`) |
| oil cooler | `a000` | a box around the bumper's lower opening on the car's left |

The turbo fitting films (`clips/fit-<id>.mp4`) are Kling O3 first-last-frame clips from the stock `eng-bay` photo to
its edit with that turbo fitted, sped up to about 3 s by `build_clips()`.

```bash
python3 tools/config-jobs.py parts > jobs.json && python3 tools/config-gen.py jobs.json
python3 tools/config-build.py a135 a180 a225 exhaust a045 a090 a270 a315 wheel headlight a000 eng-bay eng-detail
```

Building only some views keeps the rest of the existing manifest.

## In the page

`assets/config/manifest.js` sets `window.RZ_PHOTOS` (views, their paints and layer boxes, ride-height drops, films).
`src/app.js` (photo configurator section) draws a view into a canvas: the paint's photo, then the active layers in a
fixed order (wing delete for that paint, the wing, front, skirts, diffuser, exhaust, rims, calipers, tint, lights,
bonnet, roof, mirrors), then the ride-height shift. A new view crossfades in over the last. Drag (or the arrow keys)
turns the car a step at a time; the Interior and Engine bay buttons switch to those photos. The photo sits between the
parts list and the job card, its edges fading into a blurred copy of itself.

## Limits

- The car is a generated likeness of a stock Evo IX with the 3D model's mesh wheels, not a photo of a real car. No
  badges or number plates.
- The first front-view photo (`a000`) had its front wheels splayed outward (their faces visible from dead ahead); it was
  regenerated with the wheels spelled out (upright, only the tread showing), its grille badge removed by a second edit,
  and its edits and the two turning films that touch it made again.
- `exhaust__diffuser-carbon` was regenerated: Kling wrote "LICENSE PLATE" on the blank plate. Check new edits for text.
- Option shapes are Kling's own (its race splitter is deep and long; its exhaust layouts and GT wing are its
  interpretation), so they can differ slightly between views.
- Wheel designs, sizes and the widebody kit are not offered (as with the 3D car).
