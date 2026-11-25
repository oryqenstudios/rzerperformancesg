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
const GROUPS = CATS.flatMap(c => c.groups.map(g => Object.assign(g, { cat: c })));
const STOCK = Object.fromEntries(GROUPS.map(g => [g.key, g.items[0].id]));
// the Rzer showcase build, styled on the client's Evo IX: silver, carbon bonnet, black wheels, splitter
const SIGNATURE = Object.assign({}, STOCK, {
  paint: 'silver', wheel: 'rz5', size: '18', rimfin: 'black', caliper: 'red', lip: 'splitter', skirts: 'carbon',
  diffuser: 'carbon', spoiler: 'gt', ride: 'coilovers', exhaust: 'dual', exfin: 'titanium', tint: 'medium', hood: 'carbon'
});
const item = (key, id) => { const g = GROUPS.find(x => x.key === key); return g.items.find(i => i.id === id) || g.items[0]; };
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
tabsEl.innerHTML = CATS.map(c => `<button class="b-tab" role="tab" type="button" id="tab-${c.id}" data-cat="${c.id}" aria-selected="false" aria-controls="b-options">${c.label}</button>`).join('');
tabsEl.addEventListener('click', e => { const b = e.target.closest('.b-tab'); if (b) setCategory(b.dataset.cat); });
tabsEl.addEventListener('keydown', e => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  const i = CATS.findIndex(c => c.id === activeCat);
  const n = CATS[(i + (e.key === 'ArrowRight' ? 1 : CATS.length - 1)) % CATS.length];
  setCategory(n.id); $('#tab-' + n.id).focus(); e.preventDefault();
});

function setCategory(id, jump) {
  activeCat = id;
  const cat = CATS.find(c => c.id === id);
  $$('.b-tab', tabsEl).forEach(b => b.setAttribute('aria-selected', String(b.dataset.cat === id)));
  optsEl.setAttribute('aria-labelledby', 'tab-' + id);
  optsEl.innerHTML = cat.groups.filter(shown).map(g => `<fieldset class="og"><legend>${g.label}</legend><div class="og-items">${g.items.map((it, idx) => {
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
optsEl.addEventListener('click', e => {
  const b = e.target.closest('.opt'); if (!b) return;
  config[b.dataset.key] = b.dataset.id;
  $$(`.opt[data-key="${b.dataset.key}"]`, optsEl).forEach(o => o.setAttribute('aria-pressed', String(o.dataset.id === b.dataset.id)));
  renderCard();
  const v = BUILD_VIEWS[CATS.find(c => c.id === activeCat).view];
  orbitGoal = Object.assign({}, v.orbit, { target: v.orbit.target.slice() });
  if (photoMode) psOption(b.dataset.key);
});

function buildCode(cfg) {
  let v = 0n;
  for (const g of GROUPS) { v = v * BigInt(g.items.length) + BigInt(Math.max(0, g.items.findIndex(i => i.id === cfg[g.key]))); }
  return 'RZ-' + v.toString(36).toUpperCase().padStart(6, '0');
}
function renderCard() {
  const changed = GROUPS.filter(shown).filter(g => config[g.key] !== STOCK[g.key]);
  $('#card-count').textContent = String(changed.length);
  $('#jc-code').textContent = buildCode(config);
  $('#jc-sub').textContent = changed.length ? `${changed.length} ${changed.length === 1 ? 'change' : 'changes'} from stock` : 'Stock car';
  $('#jc-list').innerHTML = changed.length
    ? changed.map(g => `<li><span>${g.card || g.label}</span><span>${item(g.key, config[g.key]).name}</span></li>`).join('')
    : '<li class="jc-empty">Nothing changed yet. Pick parts on the left to start a job card.</li>';
}
function buildText() {
  const lines = ['RZER build request', 'Build code: ' + buildCode(config), 'My car: (make, model, year)', ''];
  for (const c of CATS) for (const g of c.groups.filter(shown)) {
    const stock = config[g.key] === STOCK[g.key];
    lines.push(`${g.card || g.label}: ${item(g.key, config[g.key]).name}${stock ? ' (stock)' : ''}`);
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
const ps = { view: 'a045', place: 'exterior', front: 0, token: 0, done: 0, shown: '', z: 1, playing: false, queue: 0, started: false };
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
  return { paint, names };
}

// draw view v with build cfg into canvas; false if its photo is missing
async function psCompose(canvas, v, cfg) {
  const e = PH.views[v];
  const { paint, names } = psLayers(v, cfg);
  const drop = e.masks && cfg.ride !== 'factory' && PH.drops[v] ? PH.drops[v][cfg.ride] || 0 : 0;
  const [base, ...rest] = await Promise.all([psPhoto(v, `paint-${paint}.webp`), ...names.map(n => psPhoto(v, n + '.webp')),
    ...(drop ? ['plate.webp', 'm-body.png', 'm-tyres.png', 'm-refl.png', 'm-floor.png'].map(f => psPhoto(v, f)) : [])]);
  if (!base) return false;
  const lay = rest.slice(0, names.length), masks = rest.slice(names.length);
  const [car, mb, mr, tmp, wheels] = psScratch;
  const onWheel = n => n.startsWith('rim-') || n.startsWith('caliper-');
  const put = (ctx, op, im, box) => { ctx.globalCompositeOperation = op; if (im) { if (box) ctx.drawImage(im, box[0], box[1], box[2], box[3]); else ctx.drawImage(im, 0, 0, PSW, PSH); } };
  const layers = (ctx, op) => names.forEach((n, i) => put(ctx, op, lay[i], e.layers[n]));
  const c = car.getContext('2d');
  put(c, 'source-over', base);
  layers(c, 'source-over');
  const out = canvas.getContext('2d');
  if (!drop || masks.some(m => !m)) { put(out, 'source-over', car); return true; }
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

async function psShow(v, quick) {
  if (!PH.views[v]) return;
  ps.view = v;
  const token = ++ps.token;
  const back = psCanvases[1 - ps.front], prev = psCanvases[ps.front];
  const cfg = compare ? STOCK : config;
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
      if (ps.queue) { const d = Math.sign(ps.queue); ps.queue -= d; psStep(d); }
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
  if (place === 'exterior') { psShow(CAT_VIEW[activeCat] || 'a045'); return; }
  const fly = FLY[place];
  // fly in from the outside view the film starts at, when the car looks stock
  if (psStockLook(fly.from) && PH.clips && PH.clips.includes(fly.clip) && !reduceMotion) {
    psShow(fly.from, true).then(() => psFilm(fly.clip, fly.to));
    return;
  }
  psShow(INSIDE[place][0]);
}
function psCategory(id) {
  if (ps.place !== 'exterior') { ps.place = 'exterior'; psIn.setAttribute('aria-pressed', 'false'); psEn.setAttribute('aria-pressed', 'false'); }
  psShow(CAT_VIEW[id] || 'a045');
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
