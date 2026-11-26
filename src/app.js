(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const body = document.body;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
// The 3D Evo (three.js and the CC BY model, src/showroom/) draws the scroll sections and the configurator whenever
// the page is served over http(s). Opened from disk, module scripts can't load, so the older shader car (scene.frag)
// draws instead; it is also the fallback if the 3D car can't start.
const canvas3d = $('#stage3d');
let use3d = location.protocol !== 'file:' && !!canvas3d;
let stage3d = null;
// the photo configurator's photos and layers (assets/config/manifest.js); without them the 3D car is the configurator
const PH = window.RZ_PHOTOS && window.RZ_PHOTOS.views && window.RZ_PHOTOS.views.a045 ? window.RZ_PHOTOS : null;
const photoMode = !!PH;
// options the 3D car and the photos can't show (wheel designs and sizes, widebody) are hidden while they're in use
const shown = g => !((use3d || photoMode) && g.sdfOnly);
const stockHidden = c => { for (const g of GROUPS) if (!shown(g)) c[g.key] = STOCK[g.key]; return c; };

// ------------------------------------------------------------------ math
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = a => Math.hypot(a[0], a[1], a[2]);
const norm = a => mul(a, 1 / (len(a) || 1));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
const toOrbit = (pos, target) => { const d = sub(pos, target); const r = len(d); return { target: target.slice(), r, th: Math.atan2(d[2], d[0]), ph: Math.asin(clamp(d[1] / r, -1, 1)) }; };
const orbitPos = o => { const cp = Math.cos(o.ph); return [o.target[0] + o.r * cp * Math.cos(o.th), o.target[1] + o.r * Math.sin(o.ph), o.target[2] + o.r * cp * Math.sin(o.th)]; };

// ------------------------------------------------------------------ parts catalogue
const CATS = [
  { id: 'paint', label: 'Paint', view: 'paint', groups: [
    { key: 'paint', label: 'Finish', items: [
      { id: 'silver', name: 'Liquid silver', note: 'The factory high-flake metallic', swatch: '#c9ccd1', u: { uPaint: [0.62, 0.63, 0.65], uPaintRough: 0.2, uPaintMetal: 1 } },
      { id: 'gloss', name: 'Gloss black', note: 'Piano-black lacquer under deep clear coat', swatch: '#060606', u: { uPaint: [0.006, 0.006, 0.007], uPaintRough: 0, uPaintMetal: 0 } },
      { id: 'satin', name: 'Satin black wrap', note: 'Low-sheen vinyl film, paint stays protected', swatch: '#1b1b1c', u: { uPaint: [0.016, 0.016, 0.017], uPaintRough: 0.5, uPaintMetal: 0 } },
      { id: 'grey', name: 'Track grey', note: 'Flat solid grey in gloss', swatch: '#7b7f85', u: { uPaint: [0.17, 0.175, 0.185], uPaintRough: 0.02, uPaintMetal: 0 } },
      { id: 'blue', name: 'Midnight blue', note: 'Deep blue that reads black in shade', swatch: '#0d1838', u: { uPaint: [0.008, 0.016, 0.07], uPaintRough: 0.03, uPaintMetal: 0 } },
      { id: 'red', name: 'Redline red', note: 'Solid red in gloss', swatch: '#8e0d08', u: { uPaint: [0.34, 0.012, 0.01], uPaintRough: 0.02, uPaintMetal: 0 } },
    ] } ] },
  { id: 'wheels', label: 'Wheels', view: 'wheels', groups: [
    { key: 'wheel', label: 'Design', card: 'Wheels', sdfOnly: true, items: [
      { id: 'factory', name: 'Factory six-spoke', note: 'As delivered', mark: 'F', u: { uWheel: 2 } },
      { id: 'rz5', name: 'RZ-5 split spoke', note: 'Forged, twin-blade spokes', mark: '5', u: { uWheel: 0 } },
      { id: 'rz10', name: 'RZ-10 mesh', note: 'Ten thin spokes with a mesh ring', mark: '10', u: { uWheel: 1 } },
      { id: 'aero', name: 'Aero disc', note: 'Closed face with angled cooling slots', mark: 'A', u: { uWheel: 3 } },
    ] },
    { key: 'size', label: 'Size', card: 'Wheel size', sdfOnly: true, items: [
      { id: '17', name: '17 inch', note: 'Factory size, tallest sidewall', mark: '17', u: { uRimR: 0.216 } },
      { id: '18', name: '18 inch', note: 'Lower profile tyre', mark: '18', u: { uRimR: 0.229 } },
      { id: '19', name: '19 inch', note: 'Thinnest sidewall, sharpest look', mark: '19', u: { uRimR: 0.241 } },
    ] },
    { key: 'rimfin', label: 'Finish', card: 'Wheel finish', items: [
      { id: 'silver', name: 'Silver', note: 'Factory painted silver', swatch: '#c4c8cd', u: { uRimCol: [0.72, 0.73, 0.75], uRimRough: 0.2, uRimMetal: 1 } },
      { id: 'black', name: 'Gloss black', note: 'Clear-coated black', swatch: '#0a0a0a', u: { uRimCol: [0.008, 0.008, 0.009], uRimRough: 0.05, uRimMetal: 0 } },
      { id: 'gun', name: 'Gunmetal', note: 'Dark metallic grey', swatch: '#3a3d42', u: { uRimCol: [0.16, 0.165, 0.18], uRimRough: 0.3, uRimMetal: 1 } },
      { id: 'bronze', name: 'Satin bronze', note: 'Warm bronze, low sheen', swatch: '#7a5326', u: { uRimCol: [0.46, 0.30, 0.13], uRimRough: 0.35, uRimMetal: 1 } },
    ] } ] },
  { id: 'brakes', label: 'Brakes', view: 'brakes', groups: [
    { key: 'caliper', label: 'Caliper colour', card: 'Calipers', items: [
      { id: 'black', name: 'Factory black', note: 'As delivered', swatch: '#151515', u: { uCaliper: [0.02, 0.02, 0.022] } },
      { id: 'red', name: 'Race red', note: 'High-temperature paint', swatch: '#c1160d', u: { uCaliper: [0.55, 0.02, 0.015] } },
      { id: 'yellow', name: 'Signal yellow', note: 'High-temperature paint', swatch: '#e0a90c', u: { uCaliper: [0.72, 0.45, 0.02] } },
      { id: 'blue', name: 'Electric blue', note: 'High-temperature paint', swatch: '#1f4fd6', u: { uCaliper: [0.03, 0.12, 0.6] } },
    ] } ] },
  { id: 'aero', label: 'Aero', view: 'aero', groups: [
    { key: 'lip', label: 'Front', card: 'Front', items: [
      { id: 'factory', name: 'Factory bumper', note: 'As delivered', mark: '—', u: { uLip: 0 } },
      { id: 'lip', name: 'Carbon lip', note: 'Slim lip under the bumper', mark: 'L', u: { uLip: 1 } },
      { id: 'splitter', name: 'Race splitter', note: 'Deep splitter with canards', mark: 'S', u: { uLip: 2 } },
    ] },
    { key: 'skirts', label: 'Sides', card: 'Sides', items: [
      { id: 'factory', name: 'Factory sills', note: 'As delivered', mark: '—', u: { uSkirts: 0 } },
      { id: 'carbon', name: 'Carbon side skirts', note: 'Extends the sill line', mark: 'C', u: { uSkirts: 1 } },
    ] },
    { key: 'diffuser', label: 'Rear', card: 'Rear', items: [
      { id: 'factory', name: 'Factory valance', note: 'As delivered', mark: '—', u: { uDiffuser: 0 } },
      { id: 'carbon', name: 'Carbon diffuser', note: 'Seven-fin diffuser', mark: 'D', u: { uDiffuser: 1 } },
    ] },
    { key: 'spoiler', label: 'Wing', card: 'Wing', items: [
      { id: 'factory', name: 'Factory wing', note: 'Body-colour blade on twin pedestals', mark: 'F', u: { uSpoiler: 1 } },
      { id: 'none', name: 'Wing delete', note: 'Clean boot lid', mark: '—', u: { uSpoiler: 0 } },
      { id: 'lip', name: 'Carbon lip spoiler', note: 'Thin blade on the boot edge', mark: 'L', u: { uSpoiler: 2 } },
      { id: 'gt', name: 'GT wing', note: 'Carbon wing on twin uprights', mark: 'GT', u: { uSpoiler: 3 } },
    ] } ] },
  { id: 'stance', label: 'Stance', view: 'stance', groups: [
    { key: 'ride', label: 'Ride height', card: 'Ride height', items: [
      { id: 'factory', name: 'Factory height', note: 'As delivered', mark: '0', u: { uRide: 0 } },
      { id: 'springs', name: 'Lowering springs', note: 'About 30 mm lower', mark: '30', u: { uRide: 0.03 } },
      { id: 'coilovers', name: 'Coilovers', note: 'About 50 mm lower, adjustable', mark: '50', u: { uRide: 0.05 } },
    ] },
    { key: 'wide', label: 'Body', card: 'Body', sdfOnly: true, items: [
      { id: 'factory', name: 'Factory width', note: 'As delivered', mark: '—', u: { uWide: 0 } },
      { id: 'wide', name: 'Widebody kit', note: 'Flared arches, wider track', mark: 'W', u: { uWide: 1 } },
    ] } ] },
  { id: 'exhaust', label: 'Exhaust', view: 'exhaust', groups: [
    { key: 'exhaust', label: 'Layout', card: 'Exhaust', items: [
      { id: 'factory', name: 'Factory single', note: 'One large tip, as delivered', mark: '1', u: { uExhaust: 0 } },
      { id: 'dual', name: 'Twin tips', note: 'One tip each side', mark: '2', u: { uExhaust: 3 } },
      { id: 'quad', name: 'Quad valved', note: 'Two tips each side, valve control', mark: '4', u: { uExhaust: 1 } },
      { id: 'centre', name: 'Centre twin', note: 'Two tips in the middle of the diffuser', mark: 'C', u: { uExhaust: 2 } },
    ] },
    { key: 'exfin', label: 'Tips', card: 'Tips', items: [
      { id: 'polished', name: 'Polished steel', note: 'As delivered', swatch: '#d9dcdf', u: { uExFinish: 0 } },
      { id: 'titanium', name: 'Burnt titanium', note: 'Heat-blued finish', swatch: 'linear-gradient(135deg,#3554b8,#7a3f9a 50%,#c99140)', u: { uExFinish: 1 } },
      { id: 'ceramic', name: 'Black ceramic', note: 'Matte, heat resistant', swatch: '#141414', u: { uExFinish: 2 } },
    ] } ] },
  { id: 'lights', label: 'Lights', view: 'lights', groups: [
    { key: 'drl', label: 'Daytime running lights', card: 'Light colour', items: [
      { id: 'white', name: 'Factory white', note: 'As delivered', swatch: '#fff6ea', u: { uDrl: [1, 0.97, 0.92] } },
      { id: 'ice', name: 'Ice blue', note: 'Cool white-blue', swatch: '#a8d0ff', u: { uDrl: [0.62, 0.8, 1] } },
      { id: 'amber', name: 'Amber', note: 'Warm signature', swatch: '#ffa02e', u: { uDrl: [1, 0.6, 0.16] } },
    ] },
    { key: 'tint', label: 'Window tint', card: 'Tint', items: [
      { id: 'light', name: 'Factory glass', note: 'As delivered', mark: 'F', u: { uTint: 0.2 } },
      { id: 'medium', name: 'Medium tint', note: 'Hides the cabin in shade', mark: 'M', u: { uTint: 0.6 } },
      { id: 'dark', name: 'Dark tint', note: 'Rear and side glass', mark: 'D', u: { uTint: 0.95 } },
    ] } ] },
  { id: 'carbon', label: 'Carbon', view: 'carbon', groups: [
    { key: 'hood', label: 'Bonnet', card: 'Bonnet', items: [
      { id: 'factory', name: 'Factory bonnet', note: 'Body colour with the factory vents', mark: '—', u: { uHood: 0 } },
      { id: 'carbon', name: 'Carbon bonnet', note: 'Vented, exposed twill weave', mark: 'C', u: { uHood: 1 } },
    ] },
    { key: 'roof', label: 'Roof', card: 'Roof', items: [
      { id: 'factory', name: 'Body colour', note: 'As delivered', mark: '—', u: { uRoof: 0 } },
      { id: 'carbon', name: 'Carbon roof', note: 'Exposed twill weave', mark: 'C', u: { uRoof: 1 } },
    ] },
    { key: 'mirror', label: 'Mirrors', card: 'Mirrors', items: [
      { id: 'factory', name: 'Body colour', note: 'As delivered', mark: '—', u: { uMirror: 0 } },
      { id: 'carbon', name: 'Carbon caps', note: 'Exposed twill weave', mark: 'C', u: { uMirror: 1 } },
    ] } ] },
];
// ------------------------------------------------------------------ performance parts (HKS, TOMEI, ENDLESS)
// Real parts that fit the Evo IX (CT9A), chosen by the client from the research in reports/, shown by type in the
// "Performance parts" tabs (PART_TABS), never by brand. Each part is its own option group (key 'p_' + id, first item
// 'none'), so the job card and copy-build list it like any option. Parts that can't be fitted together share an
// `excl` name: picking one takes the others off (two turbos, two exhausts, a stroker kit and separate pistons...).
// Photos are the makers' product shots cut out onto a transparent background (assets/parts/, see its README). A part
// that shows on the car has its own photo layer per view ('bp-' + id in the manifest, made by tools/config-build.py
// from Kling edits of the car with that part fitted); `link` sets the visual options it implies.
const EX_STEEL = { exhaust: 'factory', exfin: 'polished' };
const COIL = { ride: 'coilovers' };
const PART_TYPES = {
  turbo: ['Turbo kits', 'Turbo'], bov: ['Blow-off valves', 'Blow-off valve'],
  exhaust: ['Exhaust systems', 'Exhaust'], manifold: ['Manifold and heat shield', 'Manifold'], frontpipe: ['Front pipes', 'Front pipe'], cat: ['Catalyst', 'Catalyst'],
  intake: ['Intakes and filters', 'Intake'], suction: ['Intake hose', 'Intake hose'],
  cams: ['Camshafts', 'Camshafts'], valvetrain: ['Valve springs, retainers and cam gears', 'Valvetrain'], bottom: ['Pistons, rods and crank', 'Bottom end'], gasket: ['Head gaskets', 'Head gasket'], oil: ['Oil and cooling', 'Oil'],
  fuel: ['Fuel', 'Fuel'], ignition: ['Ignition', 'Ignition'],
  ecu: ['Engine management', 'ECU'], boost: ['Boost control', 'Boost control'], timer: ['Turbo timer', 'Turbo timer'],
  clutch: ['Clutches', 'Clutch'], coilover: ['Coilovers', 'Coilovers'],
  brakef: ['Front brake kits', 'Front brakes'], braker: ['Rear brake kits', 'Rear brakes'], pads: ['Brake pads', 'Pads'], discs: ['Brake discs', 'Discs'], lines: ['Brake lines', 'Brake lines'],
};
// the tabs: label, types in order, and where the photo goes when the tab opens (engine: the engine bay)
const PART_TABS = [
  { id: 'pt-turbo', label: 'Turbo', types: ['turbo', 'bov'], place: 'engine' },
  { id: 'pt-exhaust', label: 'Exhaust', types: ['exhaust', 'manifold', 'frontpipe', 'cat'], view: 'exhaust' },
  { id: 'pt-intake', label: 'Intake', types: ['intake', 'suction'], place: 'engine' },
  { id: 'pt-engine', label: 'Engine', types: ['cams', 'valvetrain', 'bottom', 'gasket', 'oil'], place: 'engine' },
  { id: 'pt-fuel', label: 'Fuel', types: ['fuel'], place: 'engine' },
  { id: 'pt-electronics', label: 'Electronics', types: ['ecu', 'boost', 'timer', 'ignition'] },
  { id: 'pt-clutch', label: 'Clutch', types: ['clutch'] },
  { id: 'pt-coilovers', label: 'Coilovers', types: ['coilover'], view: 'a090' },
  { id: 'pt-brakes', label: 'Brakes', types: ['brakef', 'braker', 'pads', 'discs', 'lines'], view: 'wheel' },
];
const NO_PHOTO = new Set(['hks-hipower-us', 'hks-turbo-timer']);
const PHOTO_OF = { 'endless-disc-basic-slit-f': 'endless-disc-basic-slit', 'endless-disc-basic-slit-r': 'endless-disc-basic-slit' };
const P = (type, brand, id, name, note, more = {}) => Object.assign({
  id, type, brand, name, note, img: NO_PHOTO.has(id) ? null : `assets/parts/${PHOTO_OF[id] || id}.webp`, excl: [type],
}, more);
const ANY = { excl: [] };   // fits alongside anything of its type
const PARTS = [
  // turbo
  P('turbo', 'HKS', 'hks-gtiii-rs', 'GT III Sports Turbine Kit (GTIII-RS)', 'Bolt-on ball-bearing turbo upgrade that replaces the factory turbo, supplied with oil and water lines and gaskets.'),
  P('turbo', 'TOMEI', 'tomei-arms-m7963', 'ARMS M7963 Turbo Kit', 'Bolt-on ARMS turbo kit with its own actuator, oil and water lines and gaskets, sized for a strong street 4G63.'),
  P('bov', 'HKS', 'hks-ssqv4', 'Super SQV4 kit', 'Sequential blow-off valve in silver die-cast aluminium with a finned trumpet outlet, as a kit for the Evo IX.'),
  P('bov', 'HKS', 'hks-suction-return', 'Suction Return Kit', 'Return pipework that feeds the Super SQV4\'s vented air back into the intake.', ANY),
  P('bov', 'TOMEI', 'tomei-bov', 'Blow Off Valve (strengthened)', 'Strengthened replacement for the factory blow-off valve in silver aluminium, holding boost better than the original.'),
  // exhaust
  P('exhaust', 'HKS', 'hks-super-turbo-muffler', 'Super Turbo Muffler', 'Polished stainless cat-back with a rounded-oval silencer, a ring of slots on its end cap and one 124 mm round tip with a blue heat tint.', { link: EX_STEEL }),
  P('exhaust', 'HKS', 'hks-silent-hipower', 'silent Hi-Power (TYPE-S)', 'The quieter HKS cat-back: polished stainless oval silencer and one plain 120 mm round tip at the factory exit.', { link: EX_STEEL }),
  P('exhaust', 'HKS', 'hks-hipower-spec-r', 'Hi-Power SPEC-R', 'Full titanium cat-back, much lighter than the factory system, with a cylindrical silencer and one 120 mm blue-tinted tip.', { link: EX_STEEL }),
  P('exhaust', 'HKS', 'hks-hipower-us', 'Hi-Power (US market)', 'Stainless cat-back from the Hi-Power range with one 120 mm round tip, made for the US-market Evo VIII and IX.', { link: EX_STEEL }),
  P('exhaust', 'HKS', 'hks-legal', 'LEGAL (US market)', 'Street cat-back with a matte black silencer and piping, finished with one polished 106 mm round tip.', { link: EX_STEEL }),
  P('exhaust', 'HKS', 'hks-carbon-ti', 'Carbon-Ti (US market)', 'Cat-back with a carbon-wrapped silencer, polished stainless piping and a double-wall burnt-titanium tip.', { link: EX_STEEL }),
  P('exhaust', 'TOMEI', 'tomei-expreme-ti', 'EXPREME Ti titanium muffler', 'Full titanium cat-back at under a third of the factory system\'s weight, with a round silencer and one 115 mm heat-blued tip.', { link: EX_STEEL }),
  P('manifold', 'TOMEI', 'tomei-expreme-manifold', 'EXPREME Exhaust Manifold', 'Polished stainless tubular manifold for the 4G63, supplied with heat wrap and gaskets.', { excl: ['manifold'] }),
  P('manifold', 'TOMEI', 'tomei-heat-protector', 'EXPREME Heat Protector', 'Stainless heat shield over the exhaust manifold; fits the EXPREME manifold or the factory one.', { excl: ['heat'] }),
  P('frontpipe', 'HKS', 'hks-gt-extension', 'GT Extension Kit', 'Stainless turbo outlet extension and front pipe in one piece, for freer flow from the turbo.'),
  P('frontpipe', 'HKS', 'hks-front-pipe', 'Front Pipe', 'Polished stainless front pipe from the turbo outlet back to the catalyst.'),
  P('frontpipe', 'TOMEI', 'tomei-outlet-component', 'EXPREME Outlet Component Ver.2', 'Turbine outlet and 3-inch stainless front pipe with a flexible section, supplied with gaskets.'),
  P('cat', 'HKS', 'hks-metal-catalyzer', 'Metal Catalyzer', 'High-flow 70 mm metal-core catalytic converter in stainless steel, supplied with gaskets and bolts.'),
  P('cat', 'TOMEI', 'tomei-ti-cat-straight', 'EXPREME Ti Cat Straight Pipe', 'Titanium straight pipe that takes the place of the catalytic converter section.'),
  // intake
  P('intake', 'HKS', 'hks-racing-suction', 'Racing Suction', 'Red cone filter on a polished intake pipe in place of the factory air box, with a sharper induction sound.'),
  P('intake', 'HKS', 'hks-super-power-flow', 'Super Power Flow', 'Green mushroom-shaped filter that replaces the factory air box for more airflow.'),
  P('intake', 'HKS', 'hks-premium-suction', 'Premium Suction', 'Enclosed black intake box that keeps the filter away from engine heat while flowing more air than stock.'),
  P('intake', 'HKS', 'hks-super-air-filter', 'Super Air Filter', 'Drop-in panel filter that replaces the factory filter inside the stock air box.'),
  P('suction', 'TOMEI', 'tomei-turbo-suction-hose', 'Turbo Suction Hose', 'Smooth blue silicone hose from the air filter to the turbo, larger than stock and without the factory bellows.'),
  // engine
  P('cams', 'HKS', 'hks-cam-ex', 'Camshaft EX 278°', 'Exhaust camshaft with 278° duration and 11.0 mm lift, used with the HKS valve springs.', { excl: ['camex'] }),
  P('cams', 'HKS', 'hks-cam-in-step2', 'Camshaft IN STEP2 274°', 'STEP2 intake camshaft with 274° duration and 11.0 mm lift.', { excl: ['camin'] }),
  P('cams', 'TOMEI', 'tomei-poncam-evo9', 'PONCAM EVO9 (intake and exhaust)', 'Intake and exhaust camshaft set made for the Evo IX\'s MIVEC engine, a bolt-in upgrade on the factory valve springs.', { excl: ['camex', 'camin'] }),
  P('cams', 'TOMEI', 'tomei-procam-evo9', 'PROCAM EVO9', 'Single intake or exhaust camshafts in a range of durations for built engines, in hydraulic or solid-lifter versions.', { excl: ['camex', 'camin'] }),
  P('valvetrain', 'HKS', 'hks-valve-spring', 'Valve Spring', 'Strengthened valve springs to suit HKS camshafts.', { excl: ['springs'] }),
  P('valvetrain', 'HKS', 'hks-cam-pulley', 'Cam Pulley (adjustable)', 'Adjustable aluminium cam pulley, anodised purple, for fine-tuning cam timing.', { excl: ['camgear'] }),
  P('valvetrain', 'TOMEI', 'tomei-valve-spring', 'Valve Spring', 'Strengthened oval-wire valve springs for up to 11.5 mm of valve lift.', { excl: ['springs'] }),
  P('valvetrain', 'TOMEI', 'tomei-ti-retainer', 'Titanium Valve Spring Retainers', 'Titanium retainers, nearly 40% lighter than stock, made for the TOMEI valve springs.', ANY),
  P('valvetrain', 'TOMEI', 'tomei-cam-gear', 'Adjustable Cam Gear', 'Red-anodised duralumin cam gear for fine-tuning cam timing.', { excl: ['camgear'] }),
  P('bottom', 'HKS', 'hks-forged-pistons', 'Forged Piston Kit', 'Forged pistons with nickel plating and moly-coated skirts, slightly oversized, for a rebuilt 4G63.', { excl: ['pistons'] }),
  P('bottom', 'HKS', 'hks-conrods', 'Connecting Rod Set (H-beam)', 'H-beam connecting rods made to go with the HKS forged pistons.', { excl: ['rods'] }),
  P('bottom', 'TOMEI', 'tomei-stroker-kits', '2.2 L / 2.3 L stroker kit', 'Complete stroker kits with crank, rods, pistons and rings that take the 4G63 to 2.2 or 2.3 litres.', { excl: ['pistons', 'rods', 'crank'] }),
  P('bottom', 'TOMEI', 'tomei-forged-pistons', 'Forged Piston Kit', 'Forged pistons made for the TOMEI stroker crankshaft.', { excl: ['pistons'] }),
  P('bottom', 'TOMEI', 'tomei-conrods', 'Forged H-Beam Conrods', 'Forged H-beam connecting rods in chrome-moly steel, in 147 mm and 150 mm lengths.', { excl: ['rods'] }),
  P('bottom', 'TOMEI', 'tomei-billet-crank', 'Billet Full Counter Crank', 'Billet, fully counterweighted stroker crankshaft for 2.2-litre or 2.3-litre builds.', { excl: ['crank'] }),
  P('bottom', 'TOMEI', 'tomei-studs-bearings', 'Studs, bolts and bearings', 'Head and main studs, bolts and bearings for a built 4G63.', ANY),
  P('gasket', 'HKS', 'hks-head-gasket', 'Stopper Type Head Gasket', 'Multi-layer metal head gasket with an opposed-bead stopper, in several thicknesses.'),
  P('gasket', 'TOMEI', 'tomei-head-gasket', 'Metal Head Gasket', 'Metal head gasket with a stainless bead layer for an 86.5 mm bore, in several thicknesses.'),
  P('oil', 'HKS', 'hks-oil-cooler-black', 'Oil Cooler Kit Black', 'Extra oil cooler behind the front bumper that works alongside the factory cooler, with braided lines.', ANY),
  P('oil', 'TOMEI', 'tomei-thermostat-killer', 'Oil Thermostat Killer', 'Replaces the oil thermostat so oil always flows through the cooler.', ANY),
  P('oil', 'TOMEI', 'tomei-slicing-baffle', 'Slicing Baffle', 'Oil pan baffle and cutter plates that stop oil surging away from the pickup under hard cornering.', ANY),
  // fuel and ignition
  P('fuel', 'HKS', 'hks-fuel-regulator', 'Fuel Regulator', 'Adjustable fuel pressure regulator with its bracket and fittings.', { excl: ['fpr'] }),
  P('fuel', 'TOMEI', 'tomei-fuel-pump', 'Fuel Pump', 'High-flow in-tank fuel pump in 255 L/h or 350 L/h versions.', { excl: ['pump'] }),
  P('fuel', 'TOMEI', 'tomei-fpr', 'Fuel Pressure Regulator', 'Adjustable fuel pressure regulator in hard-anodised billet aluminium with blue fittings.', { excl: ['fpr'] }),
  P('ignition', 'HKS', 'hks-coil-pro', 'Super Fire Racing Coil Pro', 'Coil-on-plug ignition coils that give a stronger spark than the factory coils.', { excl: ['coils'] }),
  P('ignition', 'HKS', 'hks-spark-plugs', 'Super Fire Racing M-iL spark plugs', 'Iridium racing spark plugs in a range of heat ranges.', { excl: ['plugs'] }),
  // electronics
  P('ecu', 'HKS', 'hks-fcon-is', 'F-CON iS', 'Piggy-back computer that adjusts fuel and ignition, tuned by an HKS dealer.'),
  P('ecu', 'HKS', 'hks-fcon-vpro', 'F-CON V Pro', 'Full stand-alone engine management, set up by an HKS dealer.'),
  P('boost', 'HKS', 'hks-evc7-mr', 'EVC7-MR', 'Electronic boost controller with a compact colour display and a lit control dial.'),
  P('boost', 'HKS', 'hks-evc-s2', 'EVC-S2', 'Electronic boost controller with a large numeric display and four buttons.'),
  P('timer', 'HKS', 'hks-turbo-timer', 'Turbo Timer', 'Keeps the engine idling for a set time after you switch off, so the turbo cools down.'),
  // clutch
  P('clutch', 'HKS', 'hks-la-clutch', 'LA Clutch', 'Single-plate clutch with a light 5.1 kg flywheel, rated for 450 PS.'),
  P('clutch', 'HKS', 'hks-la-clutch-twin', 'LA Clutch Twin', 'Twin-plate clutch with a light flywheel, for more power than a single plate holds.'),
  // coilovers
  P('coilover', 'HKS', 'hks-hipermax-s', 'HIPERMAX S', 'Street coilovers with 30-step damping, black bodies and white springs; about 34 mm lower at the front and 16 mm at the rear.', { link: COIL }),
  P('coilover', 'HKS', 'hks-hipermax-r', 'HIPERMAX R', 'Track coilovers with pillow-ball top mounts and 30-step damping; about 43 mm lower at the front and 25 mm at the rear.', { link: COIL }),
  P('coilover', 'ENDLESS', 'endless-function-ps', 'FUNCTION-PS', 'Street coilovers from the current FUNCTION range on X COILS PLUS springs (8 kg/mm front, 5 rear), with reinforced rubber top mounts.', { link: COIL }),
  P('coilover', 'ENDLESS', 'endless-function-sc', 'FUNCTION-SC', 'The softest FUNCTION setup, tuned for the street: X COILS springs (8 kg/mm front, 5 rear) on rubber top mounts.', { link: COIL }),
  P('coilover', 'ENDLESS', 'endless-function-tc', 'FUNCTION-TC', 'Track coilovers with firmer X COILS R springs (12 kg/mm front, 10 rear) plus helpers, on spherical top mounts.', { link: COIL }),
  P('coilover', 'ENDLESS', 'endless-zeal-function-x-plus', 'ZEAL Function X Plus', 'Blue-bodied, height-adjustable coilovers with yellow springs, in a soft or a hard spring set.', { link: COIL }),
  P('coilover', 'ENDLESS', 'endless-zeal-super-function', 'ZEAL Super Function Racing', 'Circuit coilovers with red springs and race spring rates, for track days and time attack.', { link: COIL }),
  // brakes
  P('brakef', 'ENDLESS', 'endless-racing-mono6', 'Racing MONO6', 'Forged monoblock six-piston front calipers in hard-anodised gunmetal with a red logo, on 370 mm discs.'),
  P('brakef', 'ENDLESS', 'endless-racing-mono4', 'Racing MONO4', 'Forged monoblock four-piston front calipers in hard-anodised gunmetal, on 355 mm discs.'),
  P('brakef', 'ENDLESS', 'endless-mono6-sports-ta', 'MONO6 Sports TA', 'Monoblock six-piston front calipers in blue, with discs from the factory size up to 370 mm.'),
  P('brakef', 'ENDLESS', 'endless-racing6', 'Racing6', 'Two-piece six-piston front calipers in blue anodise, on 370 mm discs.'),
  P('brakef', 'ENDLESS', 'endless-6pot', '6POT', 'Two-piece six-piston front calipers in blue anodise, with discs from the factory size up to 370 mm.'),
  P('brakef', 'ENDLESS', 'endless-chibi6', '6POT Compact Mini (Chibi6)', 'Compact six-piston front calipers in blue anodise, for the factory-size or 320 mm discs.'),
  P('brakef', 'ENDLESS', 'endless-m4', 'M4', 'Two-piece four-piston front calipers in blue anodise, for the factory-size or 320 mm discs.'),
  P('brakef', 'HKS', 'hks-brake-system', 'HKS Brake System (front and rear)', 'Silver-anodised aluminium calipers front and rear on large two-piece slotted discs with gold-coloured bells.', { excl: ['brakef', 'braker'] }),
  P('braker', 'ENDLESS', 'endless-racing-mono4r', 'Racing MONO4r', 'Forged monoblock four-piston rear calipers in hard-anodised gunmetal, on 332 mm discs.'),
  P('braker', 'ENDLESS', 'endless-racing4-rear', 'Racing4', 'Two-piece four-piston rear calipers in blue anodise, on 332 mm discs.'),
  P('braker', 'ENDLESS', 'endless-s2-rear', 'S2', 'Two-piston rear calipers in blue anodise, for the factory-size or 300 mm discs.'),
  P('pads', 'ENDLESS', 'endless-pads-street', 'Street and sport pads', 'Pads for the factory Brembo calipers, front and rear, in ENDLESS street and sport compounds such as SS-S, MX72 and MX72 Plus.'),
  P('discs', 'ENDLESS', 'endless-disc-racing-front', 'Racing 2-piece disc (front)', 'Two-piece front discs at the factory size, with E-slit or curving-slit grooves and an anodised bell.', { excl: ['discf'] }),
  P('discs', 'ENDLESS', 'endless-disc-basic-slit-f', 'Basic Slit disc (front)', 'One-piece slotted front discs at the factory size.', { excl: ['discf'] }),
  P('discs', 'ENDLESS', 'endless-disc-eslit-rear', 'E-Slit disc (rear)', 'Rear discs at the factory size with ENDLESS\'s E-slit groove pattern.', { excl: ['discr'] }),
  P('discs', 'ENDLESS', 'endless-disc-basic-slit-r', 'Basic Slit disc (rear)', 'One-piece slotted rear discs at the factory size.', { excl: ['discr'] }),
  P('lines', 'ENDLESS', 'endless-swivel-steel', 'Swivel Steel', 'Stainless braided brake lines with swivel fittings, for a firmer, more consistent pedal.'),
  P('lines', 'ENDLESS', 'endless-swivel-racing', 'Swivel Racing', 'Race braided brake lines with stainless swivel fittings, built for repeated hard braking on track.'),
];
const PART = Object.fromEntries(PARTS.map(p => [p.id, p]));
const PART_GROUPS = PARTS.map(p => ({ key: 'p_' + p.id, label: p.name, card: PART_TYPES[p.type][1], part: p, items: [{ id: 'none', name: 'None', note: '' }, p] }));
const partOn = id => config['p_' + id] === id;
const chosenParts = (cfg = config) => PARTS.filter(p => cfg['p_' + p.id] === p.id);
// which parts sit on a wheel (they stay put when the body drops) and the order their photo layers go down in: the
// turbo last, as the blow-off valves and intakes were fitted next to the stock turbo and their layers hold a bit of it
const WHEEL_PART = new Set(PARTS.filter(p => ['brakef', 'braker', 'discs'].includes(p.type)).map(p => p.id));
const LAYER_ORDER = ['discs', 'braker', 'brakef', 'exhaust', 'oil', 'manifold', 'suction', 'intake', 'bov', 'ignition', 'turbo'];
CATS.push({ id: 'parts', label: 'Parts', view: 'exhaust', hidden: true, groups: PART_GROUPS });
const PT_ORBIT = { 'pt-exhaust': 'exhaust', 'pt-coilovers': 'stance', 'pt-brakes': 'brakes' };
for (const t of PART_TABS) CATS.push({ id: t.id, label: t.label, view: PT_ORBIT[t.id] || 'paint', ptab: t, groups: [] });
const GROUPS = CATS.flatMap(c => c.groups.map(g => Object.assign(g, { cat: c })));
const STOCK = Object.fromEntries(GROUPS.map(g => [g.key, g.items[0].id]));
// the Rzer showcase build, styled on the client's Evo IX: silver, carbon bonnet, black wheels, splitter
const SIGNATURE = Object.assign({}, STOCK, {
  paint: 'silver', wheel: 'rz5', size: '18', rimfin: 'black', caliper: 'red', lip: 'splitter', skirts: 'carbon',
  diffuser: 'carbon', spoiler: 'gt', ride: 'coilovers', exhaust: 'dual', exfin: 'titanium', tint: 'medium', hood: 'carbon'
});
const item = (key, id) => { const g = GROUPS.find(x => x.key === key); return g.items.find(i => i.id === id) || g.items[0]; };
const itemName = it => it.brand ? `${it.brand} ${it.name}` : it.name;
const TABS = CATS.filter(c => !c.hidden);
const uniformsFor = cfg => { const u = {}; for (const g of GROUPS) Object.assign(u, item(g.key, cfg[g.key]).u); return u; };

let config = Object.assign({}, SIGNATURE);
if (use3d || photoMode) stockHidden(config);
const INTS = new Set(['uWheel', 'uSpoiler', 'uLip', 'uSkirts', 'uDiffuser', 'uExhaust', 'uExFinish', 'uHood', 'uRoof', 'uMirror', 'uZero']);

// ------------------------------------------------------------------ cameras
const HOME_CAMS = {
  hero:        { pos: [5.6, 1.2, -3.4],  target: [0.1, 0.5, 0.1],   fov: 34, shift: [0.34, 0.14], xray: 0 },
  about:       { pos: [0.5, 0.85, 7.6],  target: [0.0, 0.55, 0.0], fov: 34, shift: [0.26, 0.04],  xray: 0 },
  services:    { pos: [-5.6, 1.5, 4.0],  target: [-0.2, 0.5, 0.0], fov: 34, shift: [-0.3, 0.04], xray: 0 },
  engineering: { pos: [3.6, 3.1, 3.9],   target: [0.1, 0.35, 0.0], fov: 34, shift: [0.28, -0.04], xray: 1 },
  process:     { pos: [2.5, 0.55, 2.7],  target: [1.25, 0.38, 0.7], fov: 34, shift: [-0.38, 0.0], xray: 0 },
  try:         { pos: [6.2, 0.48, 0.7],  target: [0.0, 0.5, 0.0], fov: 34, shift: [0.3, 0.0],   xray: 0 },
  contact:     { pos: [-4.2, 3.4, -5.0], target: [0.0, 0.3, 0.0], fov: 34, shift: [-0.36, 0.0], xray: 0 },
};
const BUILD_VIEWS = {
  paint:   { pos: [4.9, 1.45, 3.3],  target: [0.0, 0.55, 0.0] },
  wheels:  { pos: [2.9, 0.55, 3.2],  target: [1.15, 0.38, 0.8] },
  brakes:  { pos: [2.35, 0.48, 2.5], target: [1.4, 0.36, 0.85] },
  aero:    { pos: [-4.6, 2.7, 3.3],  target: [-0.5, 0.65, 0.0] },
  stance:  { pos: [0.2, 0.34, 5.7],  target: [0.0, 0.45, 0.0] },
  exhaust: { pos: [-5.4, 0.75, 2.6], target: [-1.6, 0.4, 0.2] },
  lights:  { pos: [5.1, 0.7, 1.9],   target: [1.4, 0.5, 0.0] },
  carbon:  { pos: [3.3, 3.6, 3.5],   target: [0.0, 0.7, 0.0] },
};
for (const c of Object.values(HOME_CAMS)) c.orbit = toOrbit(c.pos, c.target);
for (const c of Object.values(BUILD_VIEWS)) c.orbit = toOrbit(c.pos, c.target);

// ------------------------------------------------------------------ WebGL
const canvas = $('#stage');
const loadingEl = $('#loading');
let gl = null, prog = null, ready = false, glFailed = false;
const locs = {};
const VERT = '#version 300 es\nvoid main(){ vec2 p = vec2((gl_VertexID<<1)&2, gl_VertexID&2); gl_Position = vec4(p*2.-1.,0.,1.); }';

function failGL(msg) {
  glFailed = true;
  if (msg) console.error('[rzer] 3D view unavailable:', msg);
  body.classList.add('nogl-bg');
  $('#nogl').hidden = false;
  loadingEl.classList.add('gone');
}

function initGL() {
  try {
    gl = canvas.getContext('webgl2', { antialias: false, depth: false, stencil: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  } catch (e) { gl = null; }
  if (!gl) return failGL('WebGL2 not available');
  const ext = gl.getExtension('KHR_parallel_shader_compile');
  const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const vs = mk(gl.VERTEX_SHADER, VERT);
  const fs = mk(gl.FRAGMENT_SHADER, $('#frag').textContent.trim());
  prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  // Windows graphics drivers can take a while to compile the scene the first time (the browser caches it after)
  setTimeout(() => { if (!ready && !glFailed) loadingEl.textContent = 'Preparing the 3D view. The first visit can take up to a minute on some graphics cards.'; }, 10000);
  const finish = () => {
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      return failGL((gl.getShaderInfoLog(fs) || '') + (gl.getProgramInfoLog(prog) || ''));
    }
    gl.useProgram(prog);
    ready = true;
    loadingEl.classList.add('gone');
  };
  if (ext) {
    const poll = () => { if (gl.getProgramParameter(prog, ext.COMPLETION_STATUS_KHR)) finish(); else setTimeout(poll, 50); };
    poll();
  } else finish();
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); ready = false; });
  canvas.addEventListener('webglcontextrestored', () => initGL());
}

function setU(name, v) {
  let l = locs[name];
  if (l === undefined) l = locs[name] = gl.getUniformLocation(prog, name);
  if (!l) return;
  if (INTS.has(name)) gl.uniform1i(l, v);
  else if (Array.isArray(v)) { if (v.length === 2) gl.uniform2f(l, v[0], v[1]); else gl.uniform3f(l, v[0], v[1], v[2]); }
  else gl.uniform1f(l, v);
}

// ------------------------------------------------------------------ quality
const quality = { scale: (coarse || innerWidth < 820) ? 0.45 : 0.6, max: 0.9, min: 0.34, ema: 0.016, frames: 0, reflect: 1 };
// the 3D car: share of min(devicePixelRatio, 1.5); below 0.7 the floor reflection goes off
const quality3d = { scale: (coarse || innerWidth < 820) ? 0.75 : 1, max: 1, min: 0.5, ema: 0.016, frames: 0 };
function sizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const w = Math.max(2, Math.round(innerWidth * dpr * quality.scale));
  const h = Math.max(2, Math.round(innerHeight * dpr * quality.scale));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
}
function adapt(dt) {
  const q = stage3d ? quality3d : quality;
  q.frames++;
  if (q.frames < 40) return;
  q.ema = q.ema * 0.92 + dt * 0.08;
  if (q.frames % 30 !== 0) return;
  let to = q.scale;
  if (q.ema > 0.034 && q.scale > q.min) to = Math.max(q.min, q.scale * 0.86);
  else if (q.ema < 0.0185 && q.scale < q.max) to = Math.min(q.max, q.scale * 1.05);
  if (to === q.scale) return;
  q.scale = to;
  if (stage3d) stage3d.setPixelScale(q.scale);
  else { if (q.scale < 0.5) quality.reflect = 0; sizeCanvas(); }
}

// ------------------------------------------------------------------ state
const cam = { orbit: Object.assign({}, HOME_CAMS.hero.orbit, { target: HOME_CAMS.hero.target.slice() }), fov: 34, shift: [0, 0], pos: [0, 0, 0], tgt: [0, 0, 0] };
let mode = 'home'; // home | build
const live = {}; // smoothed uniforms
let xray = 0, lights = 0, bay = 0, show = 0, exposure = 0, reflect = 1;
let lightsOn = true, compare = false;
let orbitGoal = null; // build mode target orbit
let userOrbit = null;
let lastInteract = 0;

// ------------------------------------------------------------------ hero intro: realistic film -> final still -> logo
const heroMedia = $('#hero-media'), heroVideo = $('#hero-video'), introBar = $('#intro-bar');
// the logo starts drawing this many seconds before the film ends: once the carbon has set, just after the last bang
// of the sound (tools/make-hero-audio.py times the pops to it, so change both together)
const LOGO_LEAD = 0.925;
let heroDone = false, logoShown = false;
const LOGO_SWEEP = 1.7;   // s: the beam's delay and sweep across the logo (style.css --sweep); the slogan follows it
let logoStart = 0;
function revealLogo() {
  if (logoShown) return;
  logoShown = true;
  logoStart = performance.now();
  $('#logo').classList.add('revealed');
  $('.hero-copy').classList.add('brand-on');
}
function finishIntro() {
  if (heroDone) return;
  heroDone = true;
  revealLogo();
  // the slogan comes in once the beam has crossed the logo, however the film ended (played out, skipped, linked past)
  const wait = Math.max(0, LOGO_SWEEP - (performance.now() - logoStart) / 1000);
  $('.hero-copy').style.setProperty('--slogan-delay', wait.toFixed(2) + 's');
  heroMedia.classList.add('is-final');
  try { heroVideo.pause(); } catch (e) { /* never started */ }
  stopListening();
  introBar.style.width = '100%';
  body.classList.remove('is-intro'); body.classList.add('intro-done');
}
// Esc, wheel or a swipe speed the film up; the skip button cuts straight to the final frame
function fastForward() {
  if (heroDone) return;
  if (!heroVideo.paused && heroVideo.readyState >= 2) { heroVideo.playbackRate = 4; heroVideo.muted = true; } else finishIntro();
}
// Sound: the film carries the engine starting, the revs and the pops and bangs (tools/make-hero-audio.py), and the
// client wants it on without a sound button. Browsers only let a page play sound before the visitor interacts when
// they already trust the site, so the film tries with sound first and, if that's refused, plays muted and brings
// the sound in, in sync, on the first click, tap or key press. Speeding up mutes it; Skip stops it.
const GESTURES = ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click'];
function onGesture(e) {
  if (heroDone || (e.type === 'keydown' && e.key === 'Escape') || heroVideo.playbackRate > 1) return;
  heroVideo.muted = false;
  stopListening();
}
function listenForSound() { GESTURES.forEach(g => addEventListener(g, onGesture, true)); }
function stopListening() { GESTURES.forEach(g => removeEventListener(g, onGesture, true)); }
$('#skip').addEventListener('click', finishIntro);
addEventListener('keydown', e => { if (e.key === 'Escape') fastForward(); });
addEventListener('wheel', () => { if (!heroDone && mode === 'home') fastForward(); }, { passive: true });
addEventListener('touchmove', () => { if (!heroDone && mode === 'home') fastForward(); }, { passive: true });
heroVideo.addEventListener('timeupdate', () => {
  if (!heroVideo.duration) return;
  introBar.style.width = (heroVideo.currentTime / heroVideo.duration * 100).toFixed(1) + '%';
});
heroVideo.addEventListener('ended', finishIntro);
heroVideo.addEventListener('error', finishIntro);
// the browser falls through the <source> list; only the last one failing means there is no film
const heroSources = $$('source', heroVideo);
if (heroSources.length) heroSources[heroSources.length - 1].addEventListener('error', finishIntro);
function startHero() {
  if (heroDone) return;
  heroVideo.muted = false;
  const p = heroVideo.play();
  if (p && p.catch) p.catch(() => {
    if (heroDone) return;
    heroVideo.muted = true;                  // sound refused before any interaction: play muted for now
    listenForSound();
    const q = heroVideo.play();
    if (q && q.catch) q.catch(finishIntro);  // autoplay refused altogether: show the still
  });
  // a film that has not started after 7 s (slow connection) should not hold the page
  setTimeout(() => { if (!heroDone && heroVideo.currentTime < 0.1) finishIntro(); }, 7000);
}

// ------------------------------------------------------------------ scroll mapping
let sections = [];
function measure() {
  sections = $$('main [data-cam]').map(el => ({ el, key: el.dataset.cam, top: el.offsetTop }));
}
function homeGoal() {
  const y = scrollY;
  let i = 0;
  while (i < sections.length - 1 && y >= sections[i + 1].top) i++;
  const a = sections[i], b = sections[Math.min(i + 1, sections.length - 1)];
  const local = b === a ? 0 : clamp((y - a.top) / (b.top - a.top), 0, 1);
  const e = smooth(0.3, 1.0, local);
  const ca = HOME_CAMS[a.key], cb = HOME_CAMS[b.key];
  const oa = ca.orbit, ob = cb.orbit;
  const portrait = innerWidth / innerHeight < 0.9;
  const o = {
    target: lerp3(oa.target, ob.target, e),
    r: lerp(oa.r, ob.r, e),
    th: oa.th + angDiff(oa.th, ob.th) * e,
    ph: lerp(oa.ph, ob.ph, e),
  };
  const shift = portrait ? [0, 0.3] : [lerp(ca.shift[0], cb.shift[0], e), lerp(ca.shift[1], cb.shift[1], e)];
  return { orbit: o, fov: lerp(ca.fov, cb.fov, e), shift, xray: lerp(ca.xray, cb.xray, e) };
}

const tachNeedle = $('#tach-needle');
function onScroll() {
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const p = clamp(scrollY / max, 0, 1);
  document.documentElement.style.setProperty('--sheen', (p * 260 - 40).toFixed(1) + '%');
  tachNeedle.style.top = ((1 - p) * 100).toFixed(2) + '%';
  tachNeedle.classList.toggle('hot', p > 0.86);
}
addEventListener('scroll', onScroll, { passive: true });
(function buildTach() {
  const s = $('#tach-scale');
  for (let i = 0; i <= 16; i++) {
    const t = document.createElement('i');
    const n = i / 2;
    t.style.top = (100 - (i / 16) * 100) + '%';
    if (i % 2 === 0) { t.className = 'major'; t.dataset.n = String(n); }
    if (n >= 7) t.classList.add('red');
    s.appendChild(t);
  }
})();

// ------------------------------------------------------------------ routing
let savedScroll = 0;
function route() {
  const h = location.hash.slice(1);
  if (h === 'build') openBuilder();
  else closeBuilder(h);
}
function openBuilder() {
  if (mode === 'build') return;
  savedScroll = scrollY;
  finishIntro();
  mode = 'build';
  body.classList.add('in-builder');
  $('#builder').hidden = false;
  $('#home').setAttribute('inert', '');
  [canvas, canvas3d].forEach(el => el && (el.tabIndex = 0));
  if (photoMode) {
    body.classList.add('photo-build'); psEl.hidden = false;
    // the photo configurator starts from the stock car the photos show
    if (!ps.started) { ps.started = true; config = Object.assign({}, STOCK); renderCard(); }
  }
  setCategory(activeCat || 'paint', true);
  layoutBuilder();
  psLayout();
  lastInteract = performance.now();
}
function closeBuilder(h) {
  if (mode !== 'build') {
    return;
  }
  mode = 'home';
  body.classList.remove('in-builder', 'photo-build');
  $('#builder').hidden = true;
  if (photoMode) psEl.hidden = true;
  $('#home').removeAttribute('inert');
  [canvas, canvas3d].forEach(el => el && el.removeAttribute('tabindex'));
  measure();
  const el = h && h !== 'top' ? document.getElementById(h) : null;
  requestAnimationFrame(() => {
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    else if (h === 'top') scrollTo({ top: 0, behavior: 'instant' });
    else scrollTo({ top: savedScroll, behavior: 'instant' });
    onScroll();
  });
}
addEventListener('hashchange', route);

// ------------------------------------------------------------------ configurator UI
const tabsEl = $('#b-tabs'), optsEl = $('#b-options');
let activeCat = null;
const TICK = '<svg class="tick" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 9.5l3.2 3L14 5.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
const tabBtn = c => `<button class="b-tab${c.ptab ? ' b-tab-part' : ''}" role="tab" type="button" id="tab-${c.id}" data-cat="${c.id}" aria-selected="false" aria-controls="b-options">${c.label}</button>`;
tabsEl.innerHTML = TABS.filter(c => !c.ptab).map(tabBtn).join('')
  + '<span class="b-tabs-label" aria-hidden="true">Performance parts</span>'
  + `<div class="b-tabs-parts" role="presentation">${TABS.filter(c => c.ptab).map(tabBtn).join('')}</div>`;
tabsEl.addEventListener('click', e => { const b = e.target.closest('.b-tab'); if (b) setCategory(b.dataset.cat); });
tabsEl.addEventListener('keydown', e => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  const i = TABS.findIndex(c => c.id === activeCat);
  const n = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
  setCategory(n.id); $('#tab-' + n.id).focus(); e.preventDefault();
});

// a simple line drawing of the part type, for a part without a product photo
const PART_ICON = {
  exhaust: '<path d="M6 30h22m0-6h6a8 8 0 0 1 0 16h-6zM42 32h12" />',
  manifold: '<path d="M8 18h8v24M24 18v24M32 18h8v24M8 42h44" />', pipe: '<path d="M8 22h20c8 0 8 16 16 16h12" />',
  turbo: '<circle cx="30" cy="30" r="13"/><circle cx="30" cy="30" r="4"/>', coilover: '<path d="M26 10v40M34 10v40M22 16l16 6-16 6 16 6-16 6 16 6" />',
  caliper: '<path d="M14 40a18 18 0 0 1 32 0" /><path d="M18 40h24" />', disc: '<circle cx="30" cy="30" r="18"/><circle cx="30" cy="30" r="6"/>',
  pad: '<rect x="14" y="22" width="32" height="16" rx="4"/>', line: '<path d="M8 40c10-20 34 4 44-16" />',
  unit: '<rect x="12" y="18" width="36" height="24" rx="3"/><path d="M18 26h14M18 32h8" /><circle cx="41" cy="30" r="3"/>',
};
const TYPE_ICON = { exhaust: 'exhaust', manifold: 'manifold', turbo: 'turbo', coilover: 'coilover', brakef: 'caliper', braker: 'caliper',
  discs: 'disc', pads: 'pad', lines: 'line', ecu: 'unit', boost: 'unit', timer: 'unit' };
function partCard(p) {
  const key = 'p_' + p.id;
  const pic = p.img
    ? `<img src="${p.img}" alt="" loading="lazy" decoding="async">`
    : `<svg viewBox="0 0 60 60" aria-hidden="true">${PART_ICON[TYPE_ICON[p.type]] || PART_ICON.pipe}</svg>`;
  return `<button class="opt popt" type="button" data-key="${key}" data-id="${p.id}" aria-pressed="${config[key] === p.id}">`
    + `<span class="p-img${p.img ? '' : ' p-noimg'}">${pic}</span><span class="p-brand">${p.brand}</span>`
    + `<span class="opt-name">${p.name}</span><span class="opt-note">${p.note}</span>${TICK}</button>`;
}
function setCategory(id, jump) {
  activeCat = id;
  const cat = CATS.find(c => c.id === id);
  $$('.b-tab', tabsEl).forEach(b => b.setAttribute('aria-selected', String(b.dataset.cat === id)));
  optsEl.setAttribute('aria-labelledby', 'tab-' + id);
  if (cat.ptab) {
    optsEl.innerHTML = '<p class="p-intro">HKS, TOMEI and ENDLESS parts that fit the Evo IX. Pick a part to fit it; pick it again to take it off.</p>'
      + cat.ptab.types.map(t => [t, PARTS.filter(q => q.type === t)]).filter(([, list]) => list.length)
        .map(([t, list]) => `<fieldset class="og"><legend>${PART_TYPES[t][0]}</legend><div class="og-items">${list.map(partCard).join('')}</div></fieldset>`).join('');
  } else optsEl.innerHTML = cat.groups.filter(shown).map(g => `<fieldset class="og"><legend>${g.label}</legend><div class="og-items">${g.items.map((it, idx) => {
    const lead = it.swatch ? `<span class="sw" style="--sw:${it.swatch}"></span>` : `<span class="mark">${it.mark || ''}</span>`;
    const tag = idx === 0 ? '<span class="stock-tag">stock</span>' : '';
    return `<button class="opt" type="button" data-key="${g.key}" data-id="${it.id}" aria-pressed="${config[g.key] === it.id}">${lead}<span class="opt-name">${it.name}${tag}</span><span class="opt-note">${it.note}</span>${TICK}</button>`;
  }).join('')}</div></fieldset>`).join('');
  optsEl.scrollTop = 0;
  const v = BUILD_VIEWS[cat.view];
  orbitGoal = Object.assign({}, v.orbit, { target: v.orbit.target.slice() });
  if (jump && !userOrbit) cam.orbit = Object.assign({}, cam.orbit);
  if (photoMode && mode === 'build') psCategory(id);
}
// a generic exhaust layout or another ride height takes the real part of that type off
const LINK_UNDO = { exhaust: 'exhaust', ride: 'coilover' };
// fit or take off a part: what can't be fitted alongside it comes off, and the visual options it implies are set
function pickPart(id) {
  const p = PART[id], key = 'p_' + id, on = config[key] !== id;
  const off = [];
  if (on) for (const q of PARTS) if (q !== p && partOn(q.id) && q.excl.some(x => p.excl.includes(x))) { config['p_' + q.id] = 'none'; off.push(q); }
  config[key] = on ? id : 'none';
  const changed = [];
  if (on && p.link) for (const [k, v] of Object.entries(p.link)) if (config[k] !== v) { config[k] = v; changed.push(k); }
  // a part taken off returns what it set to stock (the exhaust layout stays), unless another chosen part still sets it
  for (const q of on ? off : [p]) if (q.link) for (const [k, v] of Object.entries(q.link)) {
    if (k === 'exhaust' || k === 'exfin') continue;
    if (config[k] === v && !chosenParts().some(r => (r.link || {})[k] === v)) { config[k] = STOCK[k]; changed.push(k); }
  }
  return { on, changed };
}
optsEl.addEventListener('click', e => {
  const b = e.target.closest('.opt'); if (!b) return;
  const key = b.dataset.key;
  if (key.startsWith('p_')) {
    const rideBefore = config.ride;
    const { on, changed } = pickPart(b.dataset.id);
    $$('.popt', optsEl).forEach(o => o.setAttribute('aria-pressed', String(config[o.dataset.key] === o.dataset.id)));
    renderCard();
    if (photoMode && mode === 'build') psPart(PART[b.dataset.id], on, changed, rideBefore);
    else pulseCard();
    return;
  }
  config[key] = b.dataset.id;
  const undo = LINK_UNDO[key];
  if (undo) for (const q of chosenParts()) if (q.type === undo && (q.link || {})[key] !== config[key]) config['p_' + q.id] = 'none';
  $$(`.opt[data-key="${key}"]`, optsEl).forEach(o => o.setAttribute('aria-pressed', String(o.dataset.id === config[key])));
  renderCard();
  const v = BUILD_VIEWS[CATS.find(c => c.id === activeCat).view];
  orbitGoal = Object.assign({}, v.orbit, { target: v.orbit.target.slice() });
  if (photoMode) psOption(key);
});
// the job card button pulses when a part goes on that the photo can't show
function pulseCard() {
  const btn = $('#card-toggle');
  btn.classList.remove('pulse'); void btn.offsetWidth; btn.classList.add('pulse');
}

// the visual options as a mixed-radix number, then the chosen parts as a bit mask
function buildCode(cfg) {
  let v = 0n, m = 0n;
  for (const g of GROUPS) if (!g.part) v = v * BigInt(g.items.length) + BigInt(Math.max(0, g.items.findIndex(i => i.id === cfg[g.key])));
  PARTS.forEach((p, i) => { if (cfg['p_' + p.id] === p.id) m |= 1n << BigInt(i); });
  return 'RZ-' + v.toString(36).toUpperCase().padStart(6, '0') + (m ? '-' + m.toString(36).toUpperCase() : '');
}
// a visual option set by a chosen part (e.g. the ride height its coilovers give): the part's own line covers it
const implied = g => !g.part && chosenParts().some(p => (p.link || {})[g.key] === config[g.key]);
function renderCard() {
  const changed = GROUPS.filter(shown).filter(g => config[g.key] !== STOCK[g.key] && !implied(g));
  $('#card-count').textContent = String(changed.length);
  $('#jc-code').textContent = buildCode(config);
  $('#jc-sub').textContent = changed.length ? `${changed.length} ${changed.length === 1 ? 'change' : 'changes'} from stock` : 'Stock car';
  $('#jc-list').innerHTML = changed.length
    ? changed.map(g => `<li><span>${g.card || g.label}</span><span>${itemName(item(g.key, config[g.key]))}</span></li>`).join('')
    : '<li class="jc-empty">Nothing changed yet. Pick parts on the left to start a job card.</li>';
}
function buildText() {
  const lines = ['RZER build request', 'Build code: ' + buildCode(config), 'My car: (make, model, year)', ''];
  for (const c of CATS) for (const g of c.groups.filter(shown)) {
    const stock = config[g.key] === STOCK[g.key];
    if ((c.hidden && stock) || implied(g)) continue;   // brand parts: only the ones chosen, and what they cover once
    lines.push(`${g.card || g.label}: ${itemName(item(g.key, config[g.key]))}${stock ? ' (stock)' : ''}`);
  }
  return lines.join('\n');
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch (e) {
    const ta = $('#jc-copy'); ta.value = text; ta.select();
    try { return document.execCommand('copy'); } catch (e2) { return false; }
  }
}
$('#copy-build').addEventListener('click', async () => {
  const ok = await copyText(buildText());
  const note = $('#jc-note');
  note.textContent = ok ? 'Copied. Paste it into a message to @rzerperformance.sg on Instagram.' : 'Copy was blocked by the browser. Select the job card text and copy it manually.';
});
const cardToggle = $('#card-toggle');
cardToggle.addEventListener('click', () => {
  const card = $('#jobcard'); card.hidden = !card.hidden;
  cardToggle.setAttribute('aria-expanded', String(!card.hidden));
  body.classList.toggle('card-open', !card.hidden);
  layoutBuilder();
  psLayout();
});
$('#preset').addEventListener('click', () => { config = stockHidden(Object.assign({}, SIGNATURE)); setCategory(activeCat); renderCard(); });
$('#reset').addEventListener('click', () => { config = Object.assign({}, STOCK); setCategory(activeCat); renderCard(); });
const lightsBtn = $('#lights');
lightsBtn.addEventListener('click', () => { lightsOn = !lightsOn; lightsBtn.setAttribute('aria-pressed', String(lightsOn)); if (photoMode) psShow(ps.view, true); });
const hold = $('#hold');
const setCompare = on => {
  if (on === compare) return;
  compare = on; hold.classList.toggle('is-down', on); $('#stock-badge').hidden = !on;
  if (photoMode && mode === 'build') psShow(ps.view, true);
};
hold.addEventListener('pointerdown', e => { hold.setPointerCapture(e.pointerId); setCompare(true); });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => hold.addEventListener(ev, () => setCompare(false)));
hold.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); setCompare(true); } });
hold.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') setCompare(false); });
hold.addEventListener('blur', () => setCompare(false));

function layoutBuilder() {
  if (mode !== 'build') return;
  const narrow = innerWidth <= 900;
  if (!narrow && innerWidth < 1240 && !$('#jobcard').dataset.init) { $('#jobcard').hidden = true; cardToggle.setAttribute('aria-expanded', 'false'); }
  if (narrow && !$('#jobcard').dataset.init) { $('#jobcard').hidden = true; cardToggle.setAttribute('aria-expanded', 'false'); }
  $('#jobcard').dataset.init = '1';
}
function buildShift() {
  if (innerWidth <= 900) return [0, 0.36];
  const left = $('.b-panel').getBoundingClientRect().right;
  const card = $('#jobcard');
  const right = card.hidden ? innerWidth : card.getBoundingClientRect().left;
  const cx = (left + right) / 2;
  return [(cx / innerWidth) * 2 - 1, -0.04];
}

// orbit controls
const pointers = new Map();
let pinchDist = 0;
const onStage = (type, fn, opts) => [canvas, canvas3d].forEach(el => el && el.addEventListener(type, fn, opts));
onStage('pointerdown', e => {
  if (mode !== 'build') return;
  e.currentTarget.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, [e.clientX, e.clientY]);
  if (!userOrbit) userOrbit = Object.assign({}, cam.orbit, { target: cam.orbit.target.slice() });
  orbitGoal = null;
  if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinchDist = Math.hypot(a[0] - b[0], a[1] - b[1]); }
  touched();
});
onStage('pointermove', e => {
  if (mode !== 'build' || !pointers.has(e.pointerId)) return;
  const prev = pointers.get(e.pointerId);
  pointers.set(e.pointerId, [e.clientX, e.clientY]);
  if (pointers.size === 1) {
    userOrbit.th += (e.clientX - prev[0]) * 0.007;
    userOrbit.ph = clamp(userOrbit.ph + (e.clientY - prev[1]) * 0.005, -0.02, 1.25);
  } else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    if (pinchDist) userOrbit.r = clamp(userOrbit.r * pinchDist / d, 2.0, 8.5);
    pinchDist = d;
  }
  touched();
});
['pointerup', 'pointercancel'].forEach(ev => onStage(ev, e => { pointers.delete(e.pointerId); pinchDist = 0; }));
onStage('wheel', e => {
  if (mode !== 'build') return;
  e.preventDefault();
  if (!userOrbit) userOrbit = Object.assign({}, cam.orbit, { target: cam.orbit.target.slice() });
  orbitGoal = null;
  userOrbit.r = clamp(userOrbit.r * Math.exp(e.deltaY * 0.0012), 2.0, 8.5);
  touched();
}, { passive: false });
onStage('keydown', e => {
  if (mode !== 'build') return;
  const k = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, 0.08], ArrowDown: [0, -0.08] }[e.key];
  if (!k) return;
  e.preventDefault();
  if (!userOrbit) userOrbit = Object.assign({}, cam.orbit, { target: cam.orbit.target.slice() });
  orbitGoal = null;
  userOrbit.th += k[0]; userOrbit.ph = clamp(userOrbit.ph + k[1], -0.02, 1.25);
  touched();
});
function touched() { lastInteract = performance.now(); $('#b-hint').classList.add('gone'); }
// category change hands control back to the preset view
tabsEl.addEventListener('click', () => { userOrbit = null; });
optsEl.addEventListener('click', () => { userOrbit = null; });

// ------------------------------------------------------------------ photo configurator
// Real photos of the stock Evo IX in the workshop (assets/config/, made by tools/config-build.py). Each view has the
// whole photo in every paint; each option is a cropped layer, laid over it in a fixed order. Ride height moves the body
// down over the wheels and its floor reflection up, using masks of the body, tyres, reflection and floor, with the
// empty workshop behind. Views: eight around the car (a000 front ... a315, 45 degrees apart towards its right side),
// close-ups for the wheels, exhaust, headlights and the top, and the interior and engine bay.
const ORBIT = ['a000', 'a045', 'a090', 'a135', 'a180', 'a225', 'a270', 'a315'];
const CAT_VIEW = { paint: 'a045', wheels: 'wheel', brakes: 'wheel', aero: 'a135', stance: 'a090', exhaust: 'exhaust', lights: 'headlight', carbon: 'top' };
for (const t of PART_TABS) if (t.view) CAT_VIEW[t.id] = t.view;
const NEAR_ORBIT = { wheel: 'a045', exhaust: 'a135', headlight: 'a045', top: 'a045' };
const INSIDE = { interior: ['int-front', 'int-dash', 'int-gauges', 'int-rear'], engine: ['eng-bay', 'eng-detail'] };
// short films of the stock car (assets/config/clips/): turning one step between neighbouring views (and back), and
// flying in through the driver's door or under the raised bonnet. They only play while the car looks stock in silver.
const FLY = { interior: { from: 'a090', to: 'int-front', clip: 'fly-interior' }, engine: { from: 'a000', to: 'eng-bay', clip: 'fly-engine' } };
// which layers each option group lays down (by name prefix), to tell whether a view shows a change
const GROUP_LAYERS = { spoiler: ['wingdel-', 'wing-'], lip: ['lip-'], skirts: ['skirts-'], diffuser: ['diffuser-'], exhaust: ['ex-'], exfin: ['ex-'],
  rimfin: ['rim-'], caliper: ['caliper-'], drl: ['drl-', 'lights-off'], tint: ['tint-'], hood: ['hood-'], roof: ['roof-'], mirror: ['mirror-'] };
const PSW = 1920, PSH = 1080;
const psEl = $('#ps'), psFrame = $('#ps-frame'), psCanvases = $$('.ps-c', psFrame), psBg = $('#ps-bg'), psLoad = $('#ps-load'), psDots = $('#ps-dots');
const psIn = $('#ps-interior'), psEn = $('#ps-engine');
const ps = { view: 'a045', place: 'exterior', front: 0, token: 0, done: 0, shown: '', z: 1, playing: false, queue: 0, started: false,
  hold: null, ride: null, afterFilm: null };   // hold: a part left out while it animates in; ride: a height to show instead
const psVideo = $('#ps-v');
const psImgs = new Map();
function psPhoto(v, f) {
  const src = `assets/config/${v}/${f}`;
  if (!psImgs.has(src)) psImgs.set(src, new Promise(res => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }));
  return psImgs.get(src);
}
const psScratch = [0, 1, 2, 3, 4].map(() => Object.assign(document.createElement('canvas'), { width: PSW, height: PSH }));

function psLayers(v, cfg) {
  const e = PH.views[v], L = e.layers || {}, names = [];
  const paint = e.paints.includes(cfg.paint) ? cfg.paint : 'silver';
  if (e.kind === 'interior') return { paint: 'silver', names };
  const add = n => { if (L[n]) names.push(n); };
  if (cfg.spoiler !== 'factory') { add('wingdel-' + paint); if (cfg.spoiler !== 'none') add('wing-' + cfg.spoiler); }
  if (cfg.lip !== 'factory') add('lip-' + cfg.lip);
  if (cfg.skirts !== 'factory') add('skirts-' + cfg.skirts);
  if (cfg.diffuser !== 'factory') add('diffuser-' + cfg.diffuser);
  if (cfg.exhaust !== 'factory' || cfg.exfin !== 'polished') add(`ex-${cfg.exhaust}-${cfg.exfin}`);
  if (cfg.rimfin !== 'silver') add('rim-' + cfg.rimfin);
  if (cfg.caliper !== 'black') add('caliper-' + cfg.caliper);
  if (cfg.tint !== 'light') add('tint-' + cfg.tint);
  if (!lightsOn) add('lights-off'); else if (cfg.drl !== 'white') add('drl-' + cfg.drl);
  if (cfg.hood !== 'factory') add('hood-' + cfg.hood);
  if (cfg.roof !== 'factory') add('roof-' + cfg.roof);
  if (cfg.mirror !== 'factory') add('mirror-' + cfg.mirror);
  const chosen = chosenParts(cfg);
  for (const t of LAYER_ORDER) for (const q of chosen) if (q.type === t) add('bp-' + q.id);
  return { paint, names };
}

// draw view v with build cfg into canvas; false if its photo is missing
const rideDrop = (v, ride) => (PH.views[v].masks && ride !== 'factory' && PH.drops[v] ? PH.drops[v][ride] || 0 : 0);
async function psCompose(canvas, v, cfg, dropPx) {
  const e = PH.views[v];
  const { paint, names } = psLayers(v, cfg);
  const drop = dropPx !== undefined ? dropPx : rideDrop(v, cfg.ride);
  const [base, ...rest] = await Promise.all([psPhoto(v, `paint-${paint}.webp`), ...names.map(n => psPhoto(v, n + '.webp')),
    ...(drop || (e.masks && dropPx !== undefined) ? ['plate.webp', 'm-body.png', 'm-tyres.png', 'm-refl.png', 'm-floor.png'].map(f => psPhoto(v, f)) : [])]);
  if (!base) return false;
  const lay = rest.slice(0, names.length), masks = rest.slice(names.length);
  const [car, mb, mr, tmp, wheels] = psScratch;
  const onWheel = n => n.startsWith('rim-') || n.startsWith('caliper-') || (n.startsWith('bp-') && WHEEL_PART.has(n.slice(3)));
  const put = (ctx, op, im, box) => { ctx.globalCompositeOperation = op; if (im) { if (box) ctx.drawImage(im, box[0], box[1], box[2], box[3]); else ctx.drawImage(im, 0, 0, PSW, PSH); } };
  const layers = (ctx, op) => names.forEach((n, i) => put(ctx, op, lay[i], e.layers[n]));
  const c = car.getContext('2d');
  put(c, 'source-over', base);
  layers(c, 'source-over');
  const out = canvas.getContext('2d');
  if (!drop || masks.some(m => !m)) { put(out, 'source-over', car); return true; }
  out.clearRect(0, 0, PSW, PSH);
  const [plate, mBody, mTyres, mRefl, mFloor] = masks;
  // the body: its mask minus the tyres, plus every part laid on it (a splitter or skirt in front of a wheel drops with
  // the body), minus the floor below where the tyres meet it
  const b = mb.getContext('2d');
  b.clearRect(0, 0, PSW, PSH); put(b, 'source-over', mBody); put(b, 'destination-out', mTyres);
  names.forEach((n, i) => { if (!onWheel(n)) put(b, 'source-over', lay[i], e.layers[n]); });
  put(b, 'destination-out', mFloor);
  // the wheels: the photo with only the rim and caliper layers
  const w = wheels.getContext('2d');
  put(w, 'source-over', base);
  names.forEach((n, i) => { if (onWheel(n)) put(w, 'source-over', lay[i], e.layers[n]); });
  // its reflection: the reflection mask and the parts' reflections, minus the tyres
  const r = mr.getContext('2d');
  r.clearRect(0, 0, PSW, PSH); layers(r, 'source-over'); put(r, 'destination-in', mFloor);
  put(r, 'source-over', mRefl); put(r, 'destination-out', mTyres);
  const t = tmp.getContext('2d');
  const cut = (mask, from = car) => { t.globalCompositeOperation = 'source-over'; t.clearRect(0, 0, PSW, PSH); put(t, 'source-over', from); put(t, 'destination-in', mask); return tmp; };
  put(out, 'source-over', plate);
  out.drawImage(cut(mr), 0, -drop);      // the reflection rises as the body drops
  out.drawImage(cut(mTyres, wheels), 0, 0);   // the wheels stay on the floor
  out.drawImage(cut(mb), 0, drop);       // the body comes down over them
  return true;
}

// the build the photo shows: the stock car while comparing; without a part that is about to animate in
const psCfg = () => {
  if (compare) return STOCK;
  if (!ps.hold && !ps.ride) return config;
  const c = Object.assign({}, config);
  if (ps.hold) c['p_' + ps.hold] = 'none';
  if (ps.ride) c.ride = ps.ride;
  return c;
};
async function psShow(v, quick) {
  if (!PH.views[v]) return;
  ps.view = v;
  const token = ++ps.token;
  const back = psCanvases[1 - ps.front], prev = psCanvases[ps.front];
  const cfg = psCfg();
  const slow = setTimeout(() => { if (token === ps.token) psLoad.textContent = 'Loading the photos'; }, 400);
  const ok = await psCompose(back, v, cfg);
  clearTimeout(slow);
  if (token !== ps.token) return;   // a newer view was asked for meanwhile
  ps.done = token;
  psLoad.textContent = ok ? '' : 'This photo could not be loaded.';
  if (!ok) return;
  back.style.zIndex = String(++ps.z);
  back.style.transitionDuration = quick || reduceMotion ? '0s' : '';
  back.classList.add('on');
  setTimeout(() => { if (ps.token === token) prev.classList.remove('on'); }, quick ? 0 : 420);
  ps.front = 1 - ps.front;
  ps.shown = v + ':' + JSON.stringify(psLayers(v, cfg)) + ':' + cfg.ride;
  psBg.getContext('2d').drawImage(back, 0, 0, psBg.width, psBg.height);
  psDotsUpdate();
  psPreload(v);
}
function psPreload(v) {
  const i = ORBIT.indexOf(v);
  if (i < 0) return;
  setTimeout(() => {
    for (const n of [ORBIT[(i + 1) % 8], ORBIT[(i + 7) % 8]]) {
      if (!PH.views[n]) continue;
      const { paint, names } = psLayers(n, config);
      psPhoto(n, `paint-${paint}.webp`); names.forEach(x => psPhoto(n, x + '.webp'));
    }
  }, 300);
}
function psDotsUpdate() {
  const list = ps.place === 'exterior' ? ORBIT : INSIDE[ps.place];
  if (psDots.childElementCount !== list.length) psDots.innerHTML = list.map(() => '<span></span>').join('');
  [...psDots.children].forEach((d, i) => d.classList.toggle('on', list[i] === ps.view));
}
// does view v show the car exactly as the films do (stock, silver, factory height)?
function psStockLook(v) {
  if (!PH.views[v]) return false;
  const cfg = compare ? STOCK : config;
  const { paint, names } = psLayers(v, cfg);
  return paint === 'silver' && !names.length && cfg.ride === 'factory';
}
// play a film in the frame, then land on view `to` (composed underneath while it plays)
function psFilm(name, to, rate) {
  if (!PH.clips || !PH.clips.includes(name) || reduceMotion) return false;
  ps.playing = true;
  psVideo.src = `assets/config/clips/${name}.mp4`;
  psVideo.playbackRate = rate || 1;
  const land = () => {
    psVideo.onended = psVideo.onerror = null;
    psShow(to, true).then(() => {
      psVideo.classList.remove('on');
      ps.playing = false;
      const after = ps.afterFilm; ps.afterFilm = null;
      if (after) after();
      else if (ps.queue) { const d = Math.sign(ps.queue); ps.queue -= d; psStep(d); }
    });
  };
  psVideo.onended = land;
  psVideo.onerror = land;
  psVideo.onplaying = () => psVideo.classList.add('on');
  const pr = psVideo.play();
  if (pr && pr.catch) pr.catch(land);
  return true;
}
function psStep(dir) {
  if (ps.playing) { ps.queue = Math.max(-2, Math.min(2, ps.queue + dir)); return; }
  if (ps.place !== 'exterior') {
    const list = INSIDE[ps.place], i = list.indexOf(ps.view);
    psShow(list[(i + dir + list.length) % list.length]);
    return;
  }
  // from a close-up, the first step goes to the nearest view around the car
  if (!ORBIT.includes(ps.view)) { psShow(NEAR_ORBIT[ps.view] || 'a045'); return; }
  const next = ORBIT[(ORBIT.indexOf(ps.view) + dir + 8) % 8];
  if (psStockLook(ps.view) && psStockLook(next) && psFilm(`spin-${ps.view}-${next}`, next)) return;
  psShow(next);
}
function psPlace(place) {
  if (ps.playing) return;
  ps.place = place;
  psIn.setAttribute('aria-pressed', String(place === 'interior'));
  psEn.setAttribute('aria-pressed', String(place === 'engine'));
  if (place === 'exterior') { psShow(CAT_VIEW[activeCat] && PH.views[CAT_VIEW[activeCat]].kind === 'exterior' ? CAT_VIEW[activeCat] : 'a045'); return; }
  const fly = FLY[place];
  // fly in from the outside view the film starts at, when the car looks stock
  if (psStockLook(fly.from) && PH.clips && PH.clips.includes(fly.clip) && !reduceMotion) {
    psShow(fly.from, true).then(() => psFilm(fly.clip, fly.to));
    return;
  }
  psShow(INSIDE[place][0]);
}
function psExterior() {
  if (ps.place !== 'exterior') { ps.place = 'exterior'; psIn.setAttribute('aria-pressed', 'false'); psEn.setAttribute('aria-pressed', 'false'); }
}
function psCategory(id) {
  const t = (CATS.find(c => c.id === id) || {}).ptab;
  if (t && t.place === 'engine') { if (ps.place !== 'engine' && !ps.playing) psPlace('engine'); return; }
  if (t && !t.view) return;   // nothing of this type shows on the car: the photo stays as it is
  psExterior();
  psShow(CAT_VIEW[id] || 'a045');
}

// ------------------------------------------------------------------ fitting a part on the photo
// A part that shows on the car fits into place: the photo goes to a view that shows it (into the engine bay through
// the bonnet for engine parts, the stock fly-in film when it can play), the car is shown without the part, then the
// part's own layer moves into place on an overlay with a sweep of light across it, and the full build is drawn under
// it. A turbo plays its own fitting film when the engine bay is otherwise stock. Coilovers lower the car smoothly.
const psFx = $('#ps-fx');
const FIT_VIEW = { exhaust: 'exhaust', brakef: 'wheel', braker: 'a135', oil: 'a000' };
const FIT_FROM = {   // where the part comes from, as a share of its own size, and its starting scale
  exhaust: [0.35, 0, 1.04], brakef: [0, 0, 1.18], braker: [0, 0, 1.18], discs: [0, 0, 1.12], oil: [0, 0.25, 1.06],
};
const wait = ms => new Promise(r => setTimeout(r, ms));
function psEnterEngine() {
  return new Promise(res => {
    ps.place = 'engine';
    psIn.setAttribute('aria-pressed', 'false'); psEn.setAttribute('aria-pressed', 'true');
    const fly = FLY.engine;
    if (!reduceMotion && psStockLook(fly.from) && PH.clips && PH.clips.includes(fly.clip)) {
      ps.afterFilm = res;
      psShow(fly.from, true).then(() => { if (!psFilm(fly.clip, fly.to)) { ps.afterFilm = null; psShow(fly.to, true).then(res); } });
    } else psShow(INSIDE.engine[0], true).then(res);
  });
}
function psFitAnim(im, box, drop, type) {
  return new Promise(res => {
    const ctx = psFx.getContext('2d');
    const [x, y, w, h] = box, cy = y + drop;
    const [fx, fy, fs] = FIT_FROM[type] || [0, -0.45, 1.06];
    const glint = Object.assign(document.createElement('canvas'), { width: w, height: h });
    const g = glint.getContext('2d');
    const t0 = performance.now(), D = 950;
    psFx.classList.add('on');
    const frame = now => {
      const t = Math.min(1, (now - t0) / D);
      const m = Math.min(1, t / 0.7), k = 1 - Math.pow(1 - m, 3);   // the move eases out over the first 70%
      ctx.clearRect(0, 0, PSW, PSH);
      ctx.save();
      ctx.globalAlpha = Math.min(1, t * 3);
      ctx.translate(x + w / 2 + fx * w * (1 - k), cy + h / 2 + fy * h * (1 - k));
      const sc = 1 + (fs - 1) * (1 - k);
      ctx.scale(sc, sc);
      ctx.drawImage(im, -w / 2, -h / 2, w, h);
      if (t > 0.5) {   // then a band of light sweeps across the part, only where the part is
        const u = (t - 0.5) / 0.5;
        g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, w, h); g.drawImage(im, 0, 0, w, h);
        g.globalCompositeOperation = 'source-atop';
        const bx = -0.4 * w + u * 1.8 * w, band = g.createLinearGradient(bx, 0, bx + 0.35 * w, h * 0.4);
        band.addColorStop(0, 'rgba(255,255,255,0)'); band.addColorStop(0.5, 'rgba(255,255,255,0.55)'); band.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = band; g.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.sin(Math.PI * u) * 0.9;
        ctx.drawImage(glint, -w / 2, -h / 2, w, h);
      }
      ctx.restore();
      if (t < 1) requestAnimationFrame(frame); else res();
    };
    requestAnimationFrame(frame);
  });
}
async function psFit(v, q) {
  const layer = 'bp-' + q.id, e = PH.views[v];
  ps.hold = q.id;
  await psShow(v, ps.view === v);   // the car without the part
  ps.hold = null;
  const im = await psPhoto(v, layer + '.webp');
  if (!im || reduceMotion || !e.layers[layer]) { await psShow(v, true); return; }
  const drop = WHEEL_PART.has(q.id) ? 0 : rideDrop(v, config.ride);
  await psFitAnim(im, e.layers[layer], drop, q.type);
  await psShow(v, true);
  psFx.getContext('2d').clearRect(0, 0, PSW, PSH);
  psFx.classList.remove('on');
}
// the car settles from one ride height to another on a view that can show it
async function psRide(from, to) {
  let v = ps.view;
  if (ps.place !== 'exterior' || !PH.views[v].masks) { psExterior(); v = 'a090'; }
  if (reduceMotion) { await psShow(v, true); return; }
  ps.ride = from;
  await psShow(v, ps.view === v);   // at the old height first
  ps.ride = null;
  const d0 = rideDrop(v, from), d1 = rideDrop(v, to), canvas = psCanvases[ps.front];
  const t0 = performance.now(), D = 700;
  for (;;) {
    const t = Math.min(1, (performance.now() - t0) / D);
    const k = t < 1 ? 1 - Math.pow(1 - t, 3) * Math.cos(t * 7) : 1;   // settles with a small bounce
    await psCompose(canvas, v, psCfg(), d0 + (d1 - d0) * k);
    if (t >= 1) break;
    await new Promise(r => requestAnimationFrame(r));
  }
  psBg.getContext('2d').drawImage(canvas, 0, 0, psBg.width, psBg.height);
}
async function psTurbo(q) {
  ps.hold = q.id;
  if (ps.place !== 'engine') await psEnterEngine();
  const v = 'eng-bay';
  if (ps.view !== v) await psShow(v, true);
  const clip = 'fit-' + q.id;
  const rest = psLayers(v, psCfg());
  ps.hold = null;
  if (!reduceMotion && !rest.names.length && rest.paint === 'silver' && PH.clips && PH.clips.includes(clip)) {
    await new Promise(res => { ps.afterFilm = res; if (!psFilm(clip, v)) { ps.afterFilm = null; res(); } });
    return;
  }
  await psFit(v, q);
}
async function psPart(q, on, changed, rideBefore) {
  if (ps.playing) { psShow(ps.view, true); return; }
  if (changed.includes('ride')) {   // coilovers on or off: the car settles first
    ps.hold = on ? q.id : null;
    await psRide(rideBefore, config.ride);
    ps.hold = null;
    if (!on) { await psShow(ps.view, true); return; }
  }
  const layer = 'bp-' + q.id;
  const views = Object.keys(PH.views).filter(v => (PH.views[v].layers || {})[layer]);
  if (!on) {   // taken off: redraw the view if it showed the part, else nothing changes on the photo
    if (views.includes(ps.view) || changed.length) await psShow(ps.view); else pulseCard();
    return;
  }
  if (q.type === 'turbo' && views.length) return psTurbo(q);
  if (!views.length) { pulseCard(); if (changed.length) psShow(ps.view, true); return; }
  const engine = PH.views[views[0]].kind === 'engine';
  const want = engine ? 'eng-detail' : (q.type === 'discs' ? (q.id.endsWith('-r') || q.id.includes('rear') ? 'a135' : 'wheel') : FIT_VIEW[q.type]);
  const v = views.includes(ps.view) ? ps.view : views.includes(want) ? want : views[0];
  if (engine) { if (ps.place !== 'engine') { ps.hold = q.id; await psEnterEngine(); } }
  else psExterior();
  await psFit(v, q);
}
// an option changed: show it where it can be seen (the current view if it shows that group, else the category's view)
function psOption(key) {
  const e = PH.views[ps.view];
  const visible = ps.place === 'exterior' && (key === 'paint' || (key === 'ride' ? !!e.masks
    : (GROUP_LAYERS[key] || []).some(pre => Object.keys(e.layers || {}).some(n => n.startsWith(pre)))));
  if (visible) psShow(ps.view, true); else psCategory(activeCat);
}
// the photo sits in the free space between the parts list and the job card (above the parts list on phones),
// its edges fading into a blurred copy of itself
function psLayout() {
  if (!photoMode || mode !== 'build') return;
  const narrow = innerWidth <= 900;
  let l = 0, r = innerWidth, t = 56, b = innerHeight - 84;
  if (narrow) b = innerHeight * 0.56 - 48;
  else {
    l = $('.b-panel').getBoundingClientRect().right + 12;
    const card = $('#jobcard');
    if (!card.hidden) r = card.getBoundingClientRect().left - 12;
  }
  const w = Math.min((r - l) / 0.8, (b - t) * 1.3 * 16 / 9, innerWidth * 1.25);
  const h = w * 9 / 16;
  Object.assign(psFrame.style, { width: w.toFixed(1) + 'px', height: h.toFixed(1) + 'px', left: ((l + r - w) / 2).toFixed(1) + 'px', top: ((t + b - h) / 2).toFixed(1) + 'px' });
  psDots.style.top = ((t + b + h) / 2 + (narrow ? -16 : 10)).toFixed(1) + 'px';
  psDots.style.left = ((l + r) / 2).toFixed(1) + 'px';
}
if (photoMode) {
  if (PH.views['int-dash']) psIn.hidden = false;
  if (PH.views['eng-bay']) psEn.hidden = false;
  $('#b-hint').textContent = 'Drag to turn the car.';
  psIn.addEventListener('click', () => psPlace(ps.place === 'interior' ? 'exterior' : 'interior'));
  psEn.addEventListener('click', () => psPlace(ps.place === 'engine' ? 'exterior' : 'engine'));
  let drag = null;
  psEl.tabIndex = 0;
  psEl.addEventListener('pointerdown', e => { drag = { x: e.clientX, acc: 0 }; psEl.setPointerCapture(e.pointerId); touched(); });
  psEl.addEventListener('pointermove', e => {
    if (!drag) return;
    drag.acc += e.clientX - drag.x; drag.x = e.clientX;
    const step = innerWidth <= 900 ? 48 : 80;
    while (Math.abs(drag.acc) >= step) { psStep(drag.acc > 0 ? -1 : 1); drag.acc -= Math.sign(drag.acc) * step; }
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => psEl.addEventListener(ev, () => { drag = null; }));
  psEl.addEventListener('keydown', e => {
    const d = { ArrowLeft: 1, ArrowRight: -1 }[e.key];
    if (d) { e.preventDefault(); psStep(d); touched(); }
  });
}

// ------------------------------------------------------------------ contact form
$('#contact-form').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.currentTarget, st = $('#form-status');
  const name = f.name.value.trim(), car = f.car.value.trim();
  if (!name || !car) {
    st.className = 'form-status error';
    st.textContent = !name ? 'Add your name so Rzer knows who is asking.' : 'Add your car so Rzer can check parts for it.';
    (!name ? f.name : f.car).focus();
    return;
  }
  const work = $$('input[name="work"]:checked', f).map(i => i.value);
  const text = [`Hi Rzer, I'm ${name}.`, `Car: ${car}`, work.length ? `Interested in: ${work.join(', ')}` : '', f.notes.value.trim() ? `Notes: ${f.notes.value.trim()}` : ''].filter(Boolean).join('\n');
  const ok = await copyText(text);
  st.className = 'form-status' + (ok ? '' : ' error');
  st.textContent = ok ? 'Copied. Open Instagram and paste it into a message to @rzerperformance.sg.' : 'Copy was blocked by the browser. Please type your request into an Instagram message instead.';
});

// ------------------------------------------------------------------ hotspots
const hotspots = $$('.hotspot').map(el => ({ el, p: el.dataset.pos.split(',').map(Number) }));
function project(p) {
  const f = norm(sub(cam.tgt, cam.pos)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f);
  const v = sub(p, cam.pos); const z = dot(v, f);
  if (z <= 0.01) return null;
  const tanH = Math.tan(cam.fov * Math.PI / 360), asp = innerWidth / innerHeight;
  const x = dot(v, r) / (z * tanH * asp) + cam.shift[0];
  const y = dot(v, u) / (z * tanH) + cam.shift[1];
  return [(x * 0.5 + 0.5) * innerWidth, (0.5 - y * 0.5) * innerHeight];
}

// ------------------------------------------------------------------ frame loop
let last = performance.now();
let coveredFrames = 0;
function frame(now) {
  const dt = Math.min(0.1, Math.max(0.001, (now - last) / 1000));
  last = now;
  // the logo comes in with the film's final shot, right after the last bang; checked every frame, because
  // timeupdate only fires about every 250 ms
  if (!logoShown && !heroDone && heroVideo.duration && heroVideo.currentTime >= heroVideo.duration - LOGO_LEAD) revealLogo();
  update(dt, now / 1000);
  // at the top of the home page the hero film covers the stage: draw only now and then to stay warm
  const covered = mode === 'home' && scrollY < 2;
  const photos = mode === 'build' && photoMode;   // the photo configurator covers the stage: nothing to draw
  if (ready && !photos && (!covered || (!stage3d && coveredFrames++ % 30 === 0))) {
    draw(now / 1000, dt);
    if (!covered) adapt(dt);
  }
  requestAnimationFrame(frame);
}

let settle = false;
function update(dt, time) {
  const k = settle ? 1 : 1 - Math.exp(-dt * 3.2);
  let goal;
  if (mode === 'home') {
    goal = homeGoal();
    if (!reduceMotion && scrollY < innerHeight * 0.5) { goal.orbit.th += Math.sin(time * 0.13) * 0.06; goal.orbit.ph += Math.sin(time * 0.17) * 0.015; }
    xray += (goal.xray - xray) * k;
    bay += (0 - bay) * k;
    show += (1 - show) * k;
    lights += (1 - lights) * k;
    reflect = quality.reflect;
  } else {
    let o = userOrbit || orbitGoal || cam.orbit;
    if (userOrbit && !reduceMotion && performance.now() - lastInteract > 9000) userOrbit.th += dt * 0.12;
    goal = { orbit: o, fov: 34, shift: buildShift() };
    xray += (0 - xray) * k;
    bay += (1 - bay) * k;
    show += (1 - show) * k;
    lights += ((lightsOn ? 1 : 0) - lights) * k * 2;
    reflect = quality.reflect;
  }
  exposure += (1.35 - exposure) * k;
  const ko = settle ? 1 : (userOrbit && mode === 'build' ? 1 - Math.exp(-dt * 14) : k);
  const o = cam.orbit, g = goal.orbit;
  o.target = lerp3(o.target, g.target, ko);
  o.r = lerp(o.r, g.r, ko);
  o.th = o.th + angDiff(o.th, g.th) * ko;
  o.ph = lerp(o.ph, g.ph, ko);
  // keep the camera above the floor and below the ceiling
  const p = orbitPos(o);
  if (p[1] < 0.12) o.ph = Math.asin(clamp((0.12 - o.target[1]) / o.r, -1, 1));
  if (p[1] > 3.1) o.ph = Math.asin(clamp((3.1 - o.target[1]) / o.r, -1, 1));
  const asp = innerWidth / innerHeight;
  const fit = asp < 1 ? 1 + clamp((1 - asp) / 0.55, 0, 1) * (mode === 'build' ? 0.75 : 0.45) : 1;
  cam.pos = orbitPos(Object.assign({}, o, { r: o.r * fit })); cam.tgt = o.target;
  // tall screens: widen the lens so the whole car fits across (about 80% of the square-screen view)
  let fov = goal.fov;
  if (mode === 'home' && asp < 0.8) fov = Math.atan(Math.tan(fov * Math.PI / 360) * 0.8 / asp) * 360 / Math.PI;
  cam.fov = lerp(cam.fov, fov, k);
  cam.shift = [lerp(cam.shift[0], goal.shift[0], k), lerp(cam.shift[1], goal.shift[1], k)];

  // hotspots
  const spotsOn = mode === 'home' ? smooth(0.6, 0.95, xray) : 0;
  for (const h of hotspots) {
    const s = spotsOn > 0.01 ? project(add(h.p, [0, -(live.uRide || 0), 0])) : null;
    if (!s) { h.el.style.opacity = '0'; continue; }
    h.el.style.opacity = spotsOn.toFixed(2);
    // near the right edge the label goes on the dot's left, so it stays on screen
    const flip = s[0] > innerWidth - 190;
    h.el.classList.toggle('flip', flip);
    h.el.style.transform = `translate(${s[0].toFixed(1)}px, ${s[1].toFixed(1)}px) translate(${flip ? '-100%' : '0'}, -50%)`;
  }
}

function draw(time, dt) {
  const target = uniformsFor(mode === 'build' && compare ? STOCK : config);
  const ks = 0.18;
  for (const [n, v] of Object.entries(target)) {
    if (INTS.has(n) || live[n] === undefined) live[n] = Array.isArray(v) ? v.slice() : v;
    else if (Array.isArray(v)) live[n] = live[n].map((x, i) => x + (v[i] - x) * ks);
    else live[n] = live[n] + (v - live[n]) * ks;
  }
  if (stage3d) {
    stage3d.setView({ pos: cam.pos, target: cam.tgt, fov: cam.fov, shift: cam.shift });
    stage3d.setState(Object.assign({}, live, { lights, xray: xray < 0.003 ? 0 : xray, bay, reflect: quality3d.scale >= 0.7 ? 1 : 0 }));
    stage3d.render(dt);
    return;
  }
  sizeCanvas();
  gl.viewport(0, 0, canvas.width, canvas.height);
  for (const [n, v] of Object.entries(live)) setU(n, v);
  const f = norm(sub(cam.tgt, cam.pos)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f);
  setU('uCamPos', cam.pos); setU('uCamFwd', f); setU('uCamRight', r); setU('uCamUp', u);
  setU('uTanHalf', Math.tan(cam.fov * Math.PI / 360));
  setU('uShift', cam.shift);
  setU('uRes', [canvas.width, canvas.height]);
  setU('uTime', time % 1000);
  setU('uZero', 0);
  setU('uXray', xray < 0.003 ? 0 : xray);
  setU('uLights', lights);
  setU('uBay', bay < 0.003 ? 0 : bay);
  setU('uShow', show);
  setU('uReflect', reflect);
  setU('uExposure', exposure);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// ------------------------------------------------------------------ boot
addEventListener('resize', () => { measure(); sizeCanvas(); onScroll(); layoutBuilder(); psLayout(); });
addEventListener('load', measure);
document.fonts && document.fonts.ready.then(measure);
function start3d() {
  body.classList.add('use-3d');
  loadingEl.textContent = 'Loading the 3D car';
  const slow = setTimeout(() => { if (!stage3d && use3d) loadingEl.textContent = 'Loading the 3D car. The first visit takes a little longer.'; }, 12000);
  document.addEventListener('stage3d:ready', e => {
    clearTimeout(slow);
    stage3d = e.detail;
    stage3d.setPixelScale(quality3d.scale);
    ready = true;
    loadingEl.classList.add('gone');
  });
  // no 3D car (an old browser, a failed download): the shader car takes over, with all its options
  document.addEventListener('stage3d:error', () => {
    clearTimeout(slow);
    use3d = false; stage3d = null;
    body.classList.remove('use-3d');
    loadingEl.textContent = 'Loading the 3D scene';
    renderCard();
    if (activeCat) setCategory(activeCat);
    initGL();
  });
}
measure(); onScroll(); renderCard();
if (reduceMotion) finishIntro();
if (use3d) start3d(); else initGL();
route();
if (location.hash && location.hash !== '#build' && location.hash !== '#top') finishIntro();
startHero();
requestAnimationFrame(frame);

// test hook
window.RZ = {
  state: () => ({ heroDone, heroTime: heroVideo.currentTime, mode, three: !!stage3d, scale: stage3d ? quality3d.scale : quality.scale, ready, glFailed, xray, cam: { pos: cam.pos, tgt: cam.tgt } }),
  skipHero: () => finishIntro(),
  setConfig: c => { Object.assign(config, c); renderCard(); if (activeCat) setCategory(activeCat); },
  quality,
  quality3d,
  settle: v => { settle = v; },
  photo: () => (photoMode ? { view: ps.view, place: ps.place, shown: ps.shown, busy: ps.token !== ps.done } : null),
  photoShow: v => psShow(v, true),
};
})();
