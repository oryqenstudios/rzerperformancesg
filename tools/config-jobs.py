#!/usr/bin/env python3
"""The photo configurator's generation plan: every view, which options show in it, and the edit prompt for each.

  python3 tools/config-jobs.py <stage> > jobs.json      then   python3 tools/config-gen.py jobs.json

Stages:
  bases     the close-up, interior and engine-bay base photos (two takes each; pick one into
            assets/generated/config/base/silver-factory-<view>.jpg)
  edits     every option edit whose base photo exists (paints, empty-garage plates, matte floors, part options)
  wing      the wing-delete edit of every paint photo, then the lip spoiler and GT wing on the silver wing-delete
  parts     the brand parts (HKS, TOMEI, ENDLESS; PART_SLOTS in src/app.js) fitted to the car in every view they show
            in, each edit given the part's product photo as image 2 (assets/generated/config/parts-ref/)
Jobs whose output already exists are skipped by config-gen.py, so a stage can be run again after more bases exist.

Views: a000..a315 orbit the car at 45 degree steps from the front towards its right side (tools/render-guides.mjs);
wheel, exhaust, headlight and top are close-ups; int-* are the interior, eng-* the engine bay.
Each edit starts from the view's silver factory photo (or, for the wing delete, from that view's paint photo).
"""
import json
import os
import sys

C = 'assets/generated/config'
SRC = f'{C}/src'
GARAGE = 'assets/generated/garage-cut.jpg'
ORBIT = ['a000', 'a045', 'a090', 'a135', 'a180', 'a225', 'a270', 'a315']
CLOSE = ['wheel', 'exhaust', 'headlight', 'top']
EXTERIOR = ORBIT + CLOSE
INTERIOR = ['int-dash', 'int-front', 'int-rear', 'int-gauges']
ENGINE = ['eng-bay', 'eng-detail']

base = lambda v: f'{C}/base/silver-factory-{v}.jpg'
src = lambda name: f'{SRC}/{name}.png'

KEEP = ("Change nothing else: keep the camera, the framing, the car's exact position, size and shape, and everything else in "
        "image 1 exactly as it is, pixel for pixel: the paint, wheels, glass, lights, reflections and the whole workshop. "
        "Photorealistic. No text, no logos, no badges.")
edit = lambda s: f'Image 1 is the photo to edit. {s} {KEEP}'

PAINTS = {   # id -> description (silver is the base photo)
    'gloss': 'gloss black: a deep solid piano-black lacquer under a deep clear coat, no metallic flake, with mirror-like reflections of the lights',
    'satin': 'satin black vinyl wrap: a low-sheen black film with soft, diffuse reflections and no mirror shine',
    'grey': 'track grey: a flat solid mid grey with no metallic flake, glossy under a clear coat',
    'blue': 'midnight blue: a very deep dark blue metallic that reads almost black in shade and deep blue where the light hits',
    'red': 'redline red: a solid bright red with no metallic flake, glossy under a deep clear coat',
}
paint_prompt = lambda d: (f'Image 1 is the photo to edit. Repaint the whole car body in {d}, including the body-colour bumpers, '
                          'mirrors, sills, door handles and rear wing. Keep the black trim, glass, lights, grille, wheels and tyres '
                          'exactly as they are. ' + KEEP.replace('the paint, ', ''))

EXHAUST_LAYOUT = {
    'factory': 'the single large round factory tip under the right of the rear bumper',
    'dual': 'twin tips: one large round tip exiting under each side of the rear bumper, left and right, instead of the single tip',
    'quad': 'quad tips: two round tips side by side under each side of the rear bumper, four in total, instead of the single tip',
    'centre': 'centre twin tips: two round tips side by side in the middle of the rear valance, instead of the single tip',
}
EXHAUST_FINISH = {
    'polished': 'polished stainless steel',
    'titanium': 'burnt titanium, heat-blued with a blue, purple and gold sheen',
    'ceramic': 'matte black ceramic coating',
}

# option -> (views it shows in, prompt). Names are <view>__<option>.
OPTIONS = {
    'plate': (EXTERIOR, "Image 1 is the photo to edit. Remove the car completely and show the empty workshop where it stood: the "
              "glossy black floor continues with the reflections of the ceiling lights, and the walls, tool chests and wheel wall "
              "behind the car are completed naturally. Keep the camera, the framing and everything else in the workshop exactly as "
              "it is in image 1, pixel for pixel. No car, no people, no text."),
    'matte': (EXTERIOR, "Image 1 is the photo to edit. Make the floor a matte dark charcoal concrete with no reflections at all, so "
              "the car's mirror reflection in the floor disappears completely. Keep the car itself, the camera, the framing and the "
              "rest of the workshop exactly as they are in image 1, pixel for pixel. Photorealistic. No text, no logos."),
    'rim-black': (EXTERIOR, edit('Refinish the wheel rims in gloss black: clear-coated black with a deep shine. Keep the same wheel design, tyres, brake discs and calipers.')),
    'rim-gun': (EXTERIOR, edit('Refinish the wheel rims in gunmetal: a dark metallic grey. Keep the same wheel design, tyres, brake discs and calipers.')),
    'rim-bronze': (EXTERIOR, edit('Refinish the wheel rims in satin bronze: a warm bronze with a low sheen. Keep the same wheel design, tyres, brake discs and calipers.')),
    'caliper-red': (['a045', 'a090', 'a135', 'a225', 'a270', 'a315', 'wheel', 'exhaust', 'headlight'],
                    edit('Paint the brake calipers seen behind the wheel spokes a bright race red. Keep the wheels exactly as they are.')),
    'caliper-yellow': (['a045', 'a090', 'a135', 'a225', 'a270', 'a315', 'wheel', 'exhaust', 'headlight'],
                       edit('Paint the brake calipers seen behind the wheel spokes signal yellow. Keep the wheels exactly as they are.')),
    'caliper-blue': (['a045', 'a090', 'a135', 'a225', 'a270', 'a315', 'wheel', 'exhaust', 'headlight'],
                     edit('Paint the brake calipers seen behind the wheel spokes electric blue. Keep the wheels exactly as they are.')),
    'lip-lip': (['a000', 'a045', 'a090', 'a270', 'a315', 'headlight', 'top'],
                edit('Fit a slim carbon fibre lip under the front bumper: a thin blade of exposed glossy 2x2 twill carbon weave following the bumper\'s lower edge.')),
    'lip-splitter': (['a000', 'a045', 'a090', 'a270', 'a315', 'headlight', 'top'],
                     edit('Fit a carbon fibre race splitter under the front bumper: a thin flat blade of exposed glossy 2x2 twill carbon weave that follows the shape of the bumper\'s lower edge and sticks out only about 5 cm beyond it, no more, plus one small carbon canard on each front corner of the bumper. It is a real, modest street-car part, not a racing car splitter.')),
    'skirts-carbon': (['a045', 'a090', 'a135', 'a225', 'a270', 'a315', 'wheel', 'exhaust', 'top'],
                      edit('Fit carbon fibre side skirts under the side sills, extending the sill line down by about 4 cm in exposed glossy 2x2 twill carbon weave.')),
    'diffuser-carbon': (['a135', 'a180', 'a225', 'exhaust'],
                        edit('Fit a carbon fibre rear diffuser under the rear bumper, in exposed glossy 2x2 twill carbon weave, with seven vertical fins.')),
    'drl-ice': (['a000', 'a045', 'a315', 'headlight', 'top'], edit('Make the headlights shine an ice blue, a cool white-blue light, instead of white.')),
    'drl-amber': (['a000', 'a045', 'a315', 'headlight', 'top'], edit('Make the headlights shine a warm amber light instead of white.')),
    'lights-off': (['a000', 'a045', 'a315', 'headlight', 'top'], edit('Switch the headlights off: the lenses are clear and unlit, with no glow.')),
    'tint-medium': (EXTERIOR, edit('Give all the windows a medium tint, so the cabin is hard to see in shade.')),
    'tint-dark': (EXTERIOR, edit('Give the side and rear windows a dark limo tint and the windscreen a light tint, so the cabin behind the side glass is hidden.')),
    'hood-carbon': (['a000', 'a045', 'a090', 'a270', 'a315', 'headlight', 'top'],
                    edit('Replace the bonnet with an exposed carbon fibre bonnet: glossy 2x2 twill carbon weave, with the same shape and vents.')),
    'roof-carbon': (['top'], edit('Make the roof panel exposed glossy 2x2 twill carbon fibre weave.')),
    'mirror-carbon': (EXTERIOR, edit('Replace the door mirror caps with exposed glossy 2x2 twill carbon fibre caps.')),
}
for lay, ld in EXHAUST_LAYOUT.items():
    for fin, fd in EXHAUST_FINISH.items():
        if (lay, fin) == ('factory', 'polished'):
            continue
        what = (f'Refinish the single factory exhaust tip in {fd}.' if lay == 'factory'
                else f'Replace the exhaust with {ld}, in {fd}.')
        OPTIONS[f'ex-{lay}-{fin}'] = (['a135', 'a180', 'a225', 'exhaust'], edit(what))
WING_VIEWS = ['a045', 'a090', 'a135', 'a180', 'a225', 'a270', 'a315', 'exhaust', 'top']
WINGDEL = edit("Remove the rear wing completely: the boot lid is clean and smooth in the car's paint, with no wing, no pedestals and no holes.")
WING_ADD = {
    'wing-lip': edit('Fit a thin carbon fibre lip spoiler blade along the trailing edge of the boot lid, in exposed glossy 2x2 twill carbon weave.'),
    'wing-gt': edit('Fit a carbon fibre GT wing to the boot lid: an inverted airfoil in exposed glossy 2x2 twill carbon weave, about as wide as the boot lid and no wider than the car\'s body, with small flat end plates, standing on two short uprights bolted to the boot lid so the blade sits just above the height of the roof. A real street-car part, in proportion with the car.'),
}

# base photos of the close-ups, interior and engine bay: (images, prompt)
SETTING = ("The car stands in the same professional car tuning workshop as the other images: a glossy black epoxy floor like wet "
           "glass with sharp reflections, a honeycomb ceiling of white hexagonal LED panels, charcoal walls with vertical red neon "
           "strips, a red neon line along the walls, a lit wall of alloy wheels and red-edged black tool chests. The car is evenly "
           "and clearly lit by the hexagon ceiling.")
CAR = ("a stock 2006 Mitsubishi Lancer Evolution IX saloon in liquid silver metallic paint, factory front bumper, factory bonnet with "
       "its vents, factory side sills, factory rear wing, factory ride height, the same silver wheels, black brake calipers, clear "
       "headlights switched on, red tail lights, lightly tinted glass. The number plates are removed: the plate recesses are empty and "
       "plain. No badges, no emblems, no lettering anywhere on the car")
GUIDED = ("Image 1 is a 3D render that sets the shot: keep its exact camera angle, height, lens and framing, and the car's exact "
          "position, size, orientation and shape, its wheel design and its factory rear wing. The view is: {view} Make it a real "
          "photograph of the same real car as images 3 and 4 (they show it from other angles: copy its look, not their angle): " + CAR +
          ". " + SETTING + " Photorealistic automotive photography, sharp focus, realistic metallic paint reflections. No text, no "
          "logos, no people, no other cars.")
INSIDE = ("Images 1 and 2 show the car from outside. Make one real photograph inside the same car, " + "{view}" + " The interior "
          "is the factory Evolution IX cabin: black, with two black Recaro-style sports seats with dark grey fabric centres, a "
          "black three-spoke sports steering wheel on the right-hand side (right-hand drive), round gauges, a black dashboard with "
          "silver accents, a short gear lever and aluminium pedals. Through the glass the workshop shows: the hexagon LED ceiling "
          "and red neon strips. Photorealistic automotive interior photography, sharp focus, natural light from the ceiling. No "
          "text, no logos or lettering on the steering wheel, seats, gauges or dashboard, no badges, no people.")
ENGINE_BAY = ("Images 1 and 2 show the car. Make one real photograph of the same car in the same workshop, {view} The engine is "
              "the factory 4G63 2.0-litre turbocharged inline-four: a plain dark cam cover with no lettering, the turbocharger and "
              "its heat shield, the silver intercooler pipes, the intake, the strut towers, the battery and the fluid reservoirs, "
              "clean and well kept. The car's liquid silver paint shows on the wings and around the bay. Photorealistic automotive "
              "photography, sharp focus, lit by the hexagon LED ceiling. No text, no lettering, no logos, no badges, no people.")
BASES = {
    'wheel': ([f'{C}/guides/wheel.png', GARAGE, base('a045'), base('a090')], GUIDED.format(view=(
        "a low close view of the car's right front wheel, brake and wheel arch, with the right-hand side of the car running away to "
        "the left of the frame and the front bumper corner and headlight at the right."))),
    'exhaust': ([f'{C}/guides/exhaust.png', GARAGE, base('a135'), base('a180')], GUIDED.format(view=(
        "a low rear three-quarter view from behind the car's right rear corner: the boot, the rear wing, the tail lights, the rear "
        "bumper with the exhaust tip, and the right-hand side running away to the right. The headlights are not visible."))),
    'headlight': ([f'{C}/guides/headlight.png', GARAGE, base('a045'), base('a000')], GUIDED.format(view=(
        "a low close view of the front of the car from in front of its right front corner: the front bumper, grille, both "
        "headlights switched on and the bonnet, with the right-hand side running away from the camera."))),
    'top': ([f'{C}/guides/top.png', GARAGE, base('a045'), base('a000')], GUIDED.format(view=(
        "a high front three-quarter view from above the car's right front corner, looking down on the bonnet with its vents, the "
        "roof and the boot with the rear wing."))),
    'int-dash': ([base('a090'), base('a045')], INSIDE.format(view=(
        "from the middle of the rear seat looking forward between the front seats: the dashboard, the steering wheel on the right, "
        "the gauges, the centre console and the gear lever, and the workshop through the windscreen."))),
    'int-front': ([base('a090'), base('a045')], INSIDE.format(view=(
        "through the open driver's door on the right-hand side, looking across the two front sports seats to the passenger side."))),
    'int-rear': ([base('a090'), base('a045')], INSIDE.format(view=(
        "through the open right-hand rear door, looking at the rear bench seat and the backs of the front seats."))),
    'int-gauges': ([base('a090'), base('a045')], INSIDE.format(view=(
        "from the driver's seat: a close view of the three-spoke steering wheel and the round gauges behind it, with no markings "
        "readable."))),
    'eng-bay': ([base('a000'), base('a045')], ENGINE_BAY.format(view=(
        "standing in front of the car with the bonnet raised on its stay, looking down into the whole engine bay, the raised "
        "bonnet's underside at the top of the frame."))),
    'eng-detail': ([base('a000'), base('a045')], ENGINE_BAY.format(view=(
        "a close view into the engine bay from the front right corner with the bonnet raised: the turbocharger, its heat shield and "
        "the intercooler piping in sharp focus."))),
}


# ---------------------------------------------------------------- brand parts fitted to the car
# id -> (views, what it is, how it looks / where it goes). Every edit starts from the view's silver factory photo, with
# the part's product photo (on light grey) as image 2. Names are <view>__bp-<id>.
REF = lambda pid: f'{C}/parts-ref/{pid}.jpg'
REAR = ['a135', 'a180', 'a225', 'exhaust']
FRONT_WHEELS = ['a045', 'a090', 'a270', 'a315', 'wheel', 'headlight']
REAR_WHEELS = ['a090', 'a135', 'a225', 'a270', 'exhaust']
EXHAUSTS = {
    'hks-super-turbo-muffler': 'a polished stainless cat-back with a rounded-oval silencer and one large 124 mm straight-cut round tip with a blue-purple heat tint on its end',
    'hks-silent-hipower': 'a polished stainless cat-back with an oval silencer and one plain polished 120 mm straight-cut round tip',
    'hks-hipower-spec-r': 'a full titanium cat-back with a cylindrical silencer and one 120 mm round titanium tip in a dark burnt-titanium finish with a blue tint',
    'hks-hipower-us': 'a stainless cat-back with a round silencer and one 120 mm polished round tip',
    'hks-legal': 'a cat-back with a matte black silencer and black piping, ending in one polished 106 mm round tip',
    'hks-carbon-ti': 'a cat-back with a carbon-fibre-wrapped silencer and one large double-wall round tip in a burnt titanium finish, blue and purple',
    'tomei-expreme-ti': 'a full titanium cat-back with a round titanium silencer and one large 115 mm straight-cut round tip, heat-blued blue and purple at its end',
}
FRONT_KITS = {
    'endless-racing-mono6': ('a forged monoblock six-piston caliper in hard-anodised dark gunmetal grey', 'a large 370 mm slotted two-piece disc'),
    'endless-racing-mono4': ('a forged monoblock four-piston caliper in hard-anodised dark gunmetal grey', 'a large 355 mm slotted disc'),
    'endless-mono6-sports-ta': ('a monoblock six-piston caliper in bright metallic blue', 'a large slotted disc'),
    'endless-racing6': ('a large two-piece six-piston caliper in bright blue anodise', 'a large 370 mm slotted disc'),
    'endless-6pot': ('a two-piece six-piston caliper in bright blue anodise', 'a slotted disc'),
    'endless-chibi6': ('a compact six-piston caliper in bright blue anodise', 'a slotted disc'),
    'endless-m4': ('a two-piece four-piston caliper in bright blue anodise', 'a slotted disc'),
}
REAR_KITS = {
    'endless-racing-mono4r': ('a forged monoblock four-piston caliper in hard-anodised dark gunmetal grey', 'a 332 mm slotted disc'),
    'endless-racing4-rear': ('a two-piece four-piston caliper in bright blue anodise', 'a 332 mm slotted disc'),
    'endless-s2-rear': ('a two-piston caliper in bright blue anodise', 'a slotted disc'),
}
ENGINE_PARTS = {   # (what, where in the bay)
    'hks-gtiii-rs': ('an aftermarket ball-bearing turbocharger with a polished compressor housing, a cast turbine housing and its actuator',
                     'in place of the factory turbocharger and its heat shield at the front of the engine, bolted to the exhaust manifold, with its compressor housing and actuator clearly visible'),
    'tomei-arms-m7963': ('an aftermarket turbocharger with a polished compressor housing, a cast turbine housing and a blue actuator',
                         'in place of the factory turbocharger and its heat shield at the front of the engine, bolted to the exhaust manifold, with its compressor housing and blue actuator clearly visible'),
    'tomei-expreme-manifold': ('a polished stainless steel tubular exhaust manifold: four equal-length tubes merging into a collector',
                               'in place of the factory exhaust manifold and its heat shield at the front of the engine, uncovered so its polished tubes are visible'),
    'tomei-heat-protector': ('a polished stainless steel heat shield', 'over the exhaust manifold at the front of the engine, in place of the factory heat shield'),
    'hks-racing-suction': ('a big red cone air filter on a polished aluminium intake pipe', 'in place of the factory air filter box, connected to the intake pipe leading to the turbocharger'),
    'hks-super-power-flow': ('a big green mushroom-shaped air filter', 'in place of the factory air filter box, connected to the intake pipe leading to the turbocharger'),
    'hks-premium-suction': ('a black enclosed air box intake with a short black intake pipe', 'in place of the factory air filter box, connected to the intake pipe leading to the turbocharger'),
    'tomei-turbo-suction-hose': ('a smooth bright blue silicone intake hose with steel clamps', 'replacing the black rubber intake hose that runs from the air filter box to the turbocharger'),
    'hks-ssqv4': ('a silver die-cast aluminium blow-off valve with a finned trumpet-shaped outlet', 'on the intercooler pipe, in place of the factory blow-off valve, clearly visible'),
    'tomei-bov': ('a silver aluminium blow-off valve', 'on the intercooler pipe, in place of the factory blow-off valve, clearly visible'),
    'hks-coil-pro': ('black coil-on-plug ignition coils with long white boots', 'on top of the cam cover, replacing the factory ignition coils over the four spark plugs'),
}
BRAND_PARTS = {}
for pid, what in EXHAUSTS.items():
    BRAND_PARTS[pid] = (REAR, edit(
        f'Image 2 shows an aftermarket exhaust: {what}. Fit it to the car: at the factory exit under the right of the rear bumper, '
        'the factory tip is replaced by this exhaust\'s single round tip at its real size, and where the silencer can be seen below '
        'the bumper it is this exhaust\'s silencer. Keep the rear bumper and everything else exactly as it is.'))
for pid, (cal, disc) in FRONT_KITS.items():
    BRAND_PARTS[pid] = (FRONT_WHEELS, edit(
        f'Image 2 shows an aftermarket brake caliper: {cal}. Fit it to the car\'s front wheels only: behind the spokes of each front '
        f'wheel, the factory brake caliper and disc are replaced by this caliper on {disc}, at their real size. Keep the wheel spokes, '
        'rims and tyres exactly as they are, in front of the brakes. The rear brakes stay exactly as they are.'))
for pid, (cal, disc) in REAR_KITS.items():
    BRAND_PARTS[pid] = (REAR_WHEELS, edit(
        f'Image 2 shows an aftermarket brake caliper: {cal}. Fit it to the car\'s rear wheels only: behind the spokes of each rear '
        f'wheel, the factory brake caliper and disc are replaced by this caliper on {disc}, at their real size. Keep the wheel spokes, '
        'rims and tyres exactly as they are, in front of the brakes. The front brakes stay exactly as they are.'))
BRAND_PARTS['hks-brake-system'] = (sorted(set(FRONT_WHEELS + REAR_WHEELS)), edit(
    'Image 2 shows an aftermarket brake kit: large silver-anodised aluminium calipers on two-piece slotted discs with gold-coloured '
    'centre bells. Fit it to all four wheels: behind the spokes of each wheel, the factory brake caliper and disc are replaced by a '
    'silver caliper on a large slotted disc, at their real size. Keep the wheel spokes, rims and tyres exactly as they are, in front of the brakes.'))
for pid, axle, desc in [('endless-disc-racing-front', 'front', 'two-piece slotted discs with curved slots and an anodised blue centre bell'),
                        ('endless-disc-basic-slit-f', 'front', 'one-piece slotted discs with curved slots across the friction face'),
                        ('endless-disc-eslit-rear', 'rear', 'slotted discs with curved E-shaped slots across the friction face'),
                        ('endless-disc-basic-slit-r', 'rear', 'one-piece slotted discs with curved slots across the friction face')]:
    views = ['wheel', 'a045', 'a315'] if axle == 'front' else ['exhaust', 'a135', 'a225']
    BRAND_PARTS[pid] = (views, edit(
        f'Image 2 shows aftermarket brake discs. Replace the {axle} brake discs, seen behind the wheel spokes, with {desc}, at the '
        'factory size. Keep the factory calipers, the wheel spokes, rims and tyres exactly as they are.'))
for pid, (what, where) in ENGINE_PARTS.items():
    BRAND_PARTS[pid] = (ENGINE, edit(
        f'Image 1 shows the engine bay with the bonnet raised. Image 2 shows an aftermarket part: {what}. Fit this part in the engine '
        f'bay {where}, at its real size, looking as it does in image 2. Everything else in the engine bay stays exactly as it is.'))
BRAND_PARTS['hks-oil-cooler-black'] = (['a000'], edit(
    'Image 2 shows an aftermarket oil cooler with a silver-finned core. Fit it behind the opening at the front of the car\'s left side '
    '(on the right in this picture), low in the front bumper, so its silver-finned core shows through the bumper opening. Keep the '
    'bumper and everything else exactly as it is.'))
BRAND_REF = {'endless-disc-basic-slit-f': 'endless-disc-basic-slit', 'endless-disc-basic-slit-r': 'endless-disc-basic-slit'}


def jobs(stage):
    out = []
    if stage == 'bases':
        for v, (images, prompt) in BASES.items():
            for take in 'ab':
                out.append({'name': f'{v}__base-{take}', 'images': images, 'prompt': prompt})
    elif stage == 'edits':
        for v in EXTERIOR:
            if not os.path.exists(base(v)):
                continue
            for pid, d in PAINTS.items():
                out.append({'name': f'{v}__paint-{pid}', 'images': [base(v)], 'prompt': paint_prompt(d)})
            for opt, (views, prompt) in OPTIONS.items():
                if v in views:
                    out.append({'name': f'{v}__{opt}', 'images': [base(v)], 'prompt': prompt})
            if v in WING_VIEWS:
                out.append({'name': f'{v}__wingdel-silver', 'images': [base(v)], 'prompt': WINGDEL})
        for v in ENGINE:
            if not os.path.exists(base(v)):
                continue
            for pid, d in PAINTS.items():
                out.append({'name': f'{v}__paint-{pid}', 'images': [base(v)], 'prompt': paint_prompt(d)})
            out.append({'name': f'{v}__hood-carbon', 'images': [base(v)], 'prompt': edit(
                'Only the raised bonnet itself, standing open at the top of the frame and seen from below, becomes an exposed '
                'carbon fibre bonnet: its underside and edges are glossy 2x2 twill carbon weave. The front wings, bumper and '
                'everything in the engine bay stay silver and exactly as they are.')})
    elif stage == 'wing':
        for v in WING_VIEWS:
            if not os.path.exists(base(v)):
                continue
            for pid in PAINTS:
                if os.path.exists(src(f'{v}__paint-{pid}')):
                    out.append({'name': f'{v}__wingdel-{pid}', 'images': [src(f'{v}__paint-{pid}')], 'prompt': WINGDEL})
            if os.path.exists(src(f'{v}__wingdel-silver')):
                for opt, prompt in WING_ADD.items():
                    out.append({'name': f'{v}__{opt}', 'images': [src(f'{v}__wingdel-silver')], 'prompt': prompt})
    elif stage == 'parts':
        for pid, (views, prompt) in BRAND_PARTS.items():
            ref = REF(BRAND_REF.get(pid, pid))
            for v in views:
                if os.path.exists(base(v)):
                    out.append({'name': f'{v}__bp-{pid}', 'images': [base(v)] + ([ref] if os.path.exists(ref) else []), 'prompt': prompt})
    else:
        sys.exit(f'unknown stage {stage}')
    return out


if __name__ == '__main__':
    json.dump(jobs(sys.argv[1]), sys.stdout, indent=1)
