(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const body = document.body;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;

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
const catmull = (p0, p1, p2, p3, t) => {
  const t2 = t * t, t3 = t2 * t;
  return p1.map((_, i) => 0.5 * ((2 * p1[i]) + (-p0[i] + p2[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3));
};
const toOrbit = (pos, target) => { const d = sub(pos, target); const r = len(d); return { target: target.slice(), r, th: Math.atan2(d[2], d[0]), ph: Math.asin(clamp(d[1] / r, -1, 1)) }; };
const orbitPos = o => { const cp = Math.cos(o.ph); return [o.target[0] + o.r * cp * Math.cos(o.th), o.target[1] + o.r * Math.sin(o.ph), o.target[2] + o.r * cp * Math.sin(o.th)]; };

// ------------------------------------------------------------------ parts catalogue
const CATS = [
  { id: 'paint', label: 'Paint', view: 'paint', groups: [
    { key: 'paint', label: 'Finish', items: [
      { id: 'gloss', name: 'Gloss black', note: 'Piano-black lacquer under deep clear coat', swatch: '#060606', u: { uPaint: [0.006, 0.006, 0.007], uPaintRough: 0, uPaintMetal: 0 } },
      { id: 'satin', name: 'Satin black wrap', note: 'Low-sheen vinyl film, paint stays protected', swatch: '#1b1b1c', u: { uPaint: [0.016, 0.016, 0.017], uPaintRough: 0.5, uPaintMetal: 0 } },
      { id: 'grey', name: 'Track grey', note: 'Flat solid grey in gloss', swatch: '#7b7f85', u: { uPaint: [0.17, 0.175, 0.185], uPaintRough: 0.02, uPaintMetal: 0 } },
      { id: 'blue', name: 'Midnight blue', note: 'Deep blue that reads black in shade', swatch: '#0d1838', u: { uPaint: [0.008, 0.016, 0.07], uPaintRough: 0.03, uPaintMetal: 0 } },
      { id: 'silver', name: 'Liquid silver', note: 'High-flake metallic', swatch: '#c9ccd1', u: { uPaint: [0.62, 0.63, 0.65], uPaintRough: 0.2, uPaintMetal: 1 } },
      { id: 'red', name: 'Redline red', note: 'Solid red in gloss', swatch: '#8e0d08', u: { uPaint: [0.34, 0.012, 0.01], uPaintRough: 0.02, uPaintMetal: 0 } },
    ] } ] },
  { id: 'wheels', label: 'Wheels', view: 'wheels', groups: [
    { key: 'wheel', label: 'Design', card: 'Wheels', items: [
      { id: 'factory', name: 'Factory six-spoke', note: 'As delivered', mark: 'F', u: { uWheel: 2 } },
      { id: 'rz5', name: 'RZ-5 split spoke', note: 'Forged, twin-blade spokes', mark: '5', u: { uWheel: 0 } },
      { id: 'rz10', name: 'RZ-10 mesh', note: 'Ten thin spokes with a mesh ring', mark: '10', u: { uWheel: 1 } },
      { id: 'aero', name: 'Aero disc', note: 'Closed face with angled cooling slots', mark: 'A', u: { uWheel: 3 } },
    ] },
    { key: 'size', label: 'Size', card: 'Wheel size', items: [
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
    { key: 'wide', label: 'Body', card: 'Body', items: [
      { id: 'factory', name: 'Factory width', note: 'As delivered', mark: '—', u: { uWide: 0 } },
      { id: 'wide', name: 'Widebody kit', note: 'Flared arches, wider track', mark: 'W', u: { uWide: 1 } },
    ] } ] },
  { id: 'exhaust', label: 'Exhaust', view: 'exhaust', groups: [
    { key: 'exhaust', label: 'Layout', card: 'Exhaust', items: [
      { id: 'dual', name: 'Factory twin', note: 'One tip each side', mark: '2', u: { uExhaust: 0 } },
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
  aero:    { pos: [-4.5, 1.9, 3.4],  target: [-0.3, 0.6, 0.0] },
  stance:  { pos: [0.2, 0.34, 5.7],  target: [0.0, 0.45, 0.0] },
  exhaust: { pos: [-5.4, 0.75, 2.6], target: [-1.6, 0.4, 0.2] },
  lights:  { pos: [5.1, 0.7, 1.9],   target: [1.4, 0.5, 0.0] },
  carbon:  { pos: [3.3, 3.6, 3.5],   target: [0.0, 0.7, 0.0] },
};
for (const c of Object.values(HOME_CAMS)) c.orbit = toOrbit(c.pos, c.target);
for (const c of Object.values(BUILD_VIEWS)) c.orbit = toOrbit(c.pos, c.target);

// Beat for beat with the reference video (seconds):
//   0-2.2 liquid slides in over the chrome emblem and gathers   2.2-3.6 drop -> lens -> crown
//   3.6-5.3 burst, curling legs, rods and web to a rectangle    5.3-8.5 frame, towers, suspension, engine, wheels, cabin
//   8.6-10.0 body pours over the frame   10.0-10.7 liquid cures to paint   10.9 headlights   11.2-12.4 showroom spot
//   11.6-14.4 orbit to the front three-quarter, logo reveal
const INTRO_LEN = 14.4;
const INTRO_KEYS = [
  { t: 0.0,  pos: [2.30, 0.20, -0.55], tgt: [-0.20, 0.10, 0.60] },
  { t: 1.0,  pos: [2.25, 0.24, -0.40], tgt: [-0.10, 0.10, 0.30] },
  { t: 1.9,  pos: [2.40, 0.40, -0.20], tgt: [0.00, 0.14, 0.06] },
  { t: 2.7,  pos: [2.25, 0.75, 0.00],  tgt: [0.00, 0.10, 0.00] },
  { t: 3.4,  pos: [2.15, 1.05, 0.00],  tgt: [0.00, 0.03, 0.00] },
  { t: 4.1,  pos: [2.55, 1.50, 0.00],  tgt: [-0.15, 0.00, 0.00] },
  { t: 4.8,  pos: [3.20, 1.95, 0.00],  tgt: [-0.40, 0.00, 0.00] },
  { t: 5.4,  pos: [3.40, 2.25, 0.00],  tgt: [-0.45, 0.00, 0.00] },
  { t: 6.3,  pos: [3.60, 2.95, 0.00],  tgt: [-0.25, 0.15, 0.00] },
  { t: 7.2,  pos: [4.00, 2.30, 0.00],  tgt: [0.45, 0.35, 0.00] },
  { t: 8.2,  pos: [4.80, 1.35, 0.00],  tgt: [0.30, 0.50, 0.00] },
  { t: 9.0,  pos: [5.40, 1.00, 0.00],  tgt: [0.00, 0.60, 0.00] },
  { t: 10.6, pos: [5.80, 0.92, 0.00],  tgt: [0.00, 0.62, 0.00] },
  { t: 11.6, pos: [5.30, 0.85, 0.00],  tgt: [0.00, 0.60, 0.00] },
  { t: 12.7, pos: [5.30, 0.95, -1.90], tgt: [0.00, 0.58, 0.00] },
  { t: 13.6, pos: [4.90, 1.05, -2.90], tgt: [0.05, 0.55, 0.05] },
  { t: 14.4, pos: HOME_CAMS.hero.pos, tgt: HOME_CAMS.hero.target },
];
function introCam(t) {
  const k = INTRO_KEYS;
  let i = 0; while (i < k.length - 2 && t > k[i + 1].t) i++;
  const a = k[Math.max(0, i - 1)], b = k[i], c = k[i + 1], d = k[Math.min(k.length - 1, i + 2)];
  const u = smooth(0, 1, clamp((t - b.t) / (c.t - b.t), 0, 1)) * 0.6 + clamp((t - b.t) / (c.t - b.t), 0, 1) * 0.4;
  return { pos: catmull(a.pos, b.pos, c.pos, d.pos, u), tgt: catmull(a.tgt, b.tgt, c.tgt, d.tgt, u) };
}
function introLights(t) {
  if (t < 10.9) return 0;
  const k = t - 10.9;
  if (k < 0.07) return 1; if (k < 0.16) return 0.05; if (k < 0.24) return 0.85; if (k < 0.38) return 0.12;
  return Math.min(1, 0.55 + (k - 0.38) * 1.5);
}

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
  const finish = () => {
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      return failGL((gl.getShaderInfoLog(fs) || '') + (gl.getProgramInfoLog(prog) || ''));
    }
    gl.useProgram(prog);
    ready = true;
    loadingEl.classList.add('gone');
    introClockStart = performance.now();
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
function sizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const w = Math.max(2, Math.round(innerWidth * dpr * quality.scale));
  const h = Math.max(2, Math.round(innerHeight * dpr * quality.scale));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
}
function adapt(dt) {
  quality.frames++;
  if (quality.frames < 40) return;
  quality.ema = quality.ema * 0.92 + dt * 0.08;
  if (quality.frames % 30 !== 0) return;
  if (quality.ema > 0.034 && quality.scale > quality.min) {
    quality.scale = Math.max(quality.min, quality.scale * 0.86);
    if (quality.scale < 0.5) quality.reflect = 0;
    sizeCanvas();
  } else if (quality.ema < 0.0185 && quality.scale < quality.max) {
    quality.scale = Math.min(quality.max, quality.scale * 1.05);
    sizeCanvas();
  }
}

// ------------------------------------------------------------------ state
// The hero now opens on a realistic film (see #hero-media), so the 3D liquid intro starts finished.
// RZ.setIntro(t) still plays it for previews.
const intro = { t: 99, speed: 1, done: true, revealed: true };
let introClockStart = 0;
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
const LOGO_LEAD = 2.2;   // the logo starts drawing in this many seconds before the film ends
let heroDone = false, logoShown = false;
function revealLogo() {
  if (logoShown) return;
  logoShown = true;
  $('#logo').classList.add('revealed');
}
function finishIntro() {
  if (heroDone) return;
  heroDone = true;
  heroMedia.classList.add('is-final');
  try { heroVideo.pause(); } catch (e) { /* never started */ }
  introBar.style.width = '100%';
  body.classList.remove('is-intro'); body.classList.add('intro-done');
  revealLogo();
}
// Esc, wheel or a swipe speed the film up; the skip button cuts straight to the final frame
function fastForward() {
  if (heroDone) return;
  if (!heroVideo.paused && heroVideo.readyState >= 2) heroVideo.playbackRate = 4; else finishIntro();
}
$('#skip').addEventListener('click', finishIntro);
addEventListener('keydown', e => { if (e.key === 'Escape') fastForward(); });
addEventListener('wheel', () => { if (!heroDone && mode === 'home') fastForward(); }, { passive: true });
addEventListener('touchmove', () => { if (!heroDone && mode === 'home') fastForward(); }, { passive: true });
heroVideo.addEventListener('timeupdate', () => {
  if (!heroVideo.duration) return;
  introBar.style.width = (heroVideo.currentTime / heroVideo.duration * 100).toFixed(1) + '%';
  // the logo comes in with the film's final shot, not after it
  if (heroVideo.currentTime >= heroVideo.duration - LOGO_LEAD) revealLogo();
});
heroVideo.addEventListener('ended', finishIntro);
heroVideo.addEventListener('error', finishIntro);
// the browser falls through the <source> list; only the last one failing means there is no film
const heroSources = $$('source', heroVideo);
if (heroSources.length) heroSources[heroSources.length - 1].addEventListener('error', finishIntro);
// the photoreal three.js Evo (module script in index.html) replaces the final still once it has loaded
document.addEventListener('showroom:ready', () => heroMedia.classList.add('has-3d'));
let heroCarActive = false;
function updateHeroCar() {
  const car = window.RZ_SHOWROOM;
  if (!car) return;
  // render it only from the last moments of the film, and only while the hero is on screen
  const nearEnd = heroDone || (heroVideo.duration > 0 && heroVideo.currentTime > heroVideo.duration - 1.5);
  const want = mode === 'home' && nearEnd && scrollY < innerHeight;
  if (want !== heroCarActive) { heroCarActive = want; car.setActive(want); }
}
function startHero() {
  if (heroDone) return;
  heroVideo.muted = true;
  const p = heroVideo.play();
  if (p && p.catch) p.catch(finishIntro);   // autoplay refused: show the still
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
  canvas.tabIndex = 0;
  setCategory(activeCat || 'paint', true);
  layoutBuilder();
  lastInteract = performance.now();
}
function closeBuilder(h) {
  if (mode !== 'build') {
    return;
  }
  mode = 'home';
  body.classList.remove('in-builder');
  $('#builder').hidden = true;
  $('#home').removeAttribute('inert');
  canvas.removeAttribute('tabindex');
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
  optsEl.innerHTML = cat.groups.map(g => `<fieldset class="og"><legend>${g.label}</legend><div class="og-items">${g.items.map((it, idx) => {
    const lead = it.swatch ? `<span class="sw" style="--sw:${it.swatch}"></span>` : `<span class="mark">${it.mark || ''}</span>`;
    const tag = idx === 0 ? '<span class="stock-tag">stock</span>' : '';
    return `<button class="opt" type="button" data-key="${g.key}" data-id="${it.id}" aria-pressed="${config[g.key] === it.id}">${lead}<span class="opt-name">${it.name}${tag}</span><span class="opt-note">${it.note}</span>${TICK}</button>`;
  }).join('')}</div></fieldset>`).join('');
  optsEl.scrollTop = 0;
  const v = BUILD_VIEWS[cat.view];
  orbitGoal = Object.assign({}, v.orbit, { target: v.orbit.target.slice() });
  if (jump && !userOrbit) cam.orbit = Object.assign({}, cam.orbit);
}
optsEl.addEventListener('click', e => {
  const b = e.target.closest('.opt'); if (!b) return;
  config[b.dataset.key] = b.dataset.id;
  $$(`.opt[data-key="${b.dataset.key}"]`, optsEl).forEach(o => o.setAttribute('aria-pressed', String(o.dataset.id === b.dataset.id)));
  renderCard();
  const v = BUILD_VIEWS[CATS.find(c => c.id === activeCat).view];
  orbitGoal = Object.assign({}, v.orbit, { target: v.orbit.target.slice() });
});

function buildCode(cfg) {
  let v = 0n;
  for (const g of GROUPS) { v = v * BigInt(g.items.length) + BigInt(Math.max(0, g.items.findIndex(i => i.id === cfg[g.key]))); }
  return 'RZ-' + v.toString(36).toUpperCase().padStart(6, '0');
}
function renderCard() {
  const changed = GROUPS.filter(g => config[g.key] !== STOCK[g.key]);
  $('#card-count').textContent = String(changed.length);
  $('#jc-code').textContent = buildCode(config);
  $('#jc-sub').textContent = changed.length ? `${changed.length} ${changed.length === 1 ? 'change' : 'changes'} from stock` : 'Stock car';
  $('#jc-list').innerHTML = changed.length
    ? changed.map(g => `<li><span>${g.card || g.label}</span><span>${item(g.key, config[g.key]).name}</span></li>`).join('')
    : '<li class="jc-empty">Nothing changed yet. Pick parts on the left to start a job card.</li>';
}
function buildText() {
  const lines = ['RZER build request', 'Build code: ' + buildCode(config), 'My car: (make, model, year)', ''];
  for (const c of CATS) for (const g of c.groups) {
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
});
$('#preset').addEventListener('click', () => { config = Object.assign({}, SIGNATURE); setCategory(activeCat); renderCard(); });
$('#reset').addEventListener('click', () => { config = Object.assign({}, STOCK); setCategory(activeCat); renderCard(); });
const lightsBtn = $('#lights');
lightsBtn.addEventListener('click', () => { lightsOn = !lightsOn; lightsBtn.setAttribute('aria-pressed', String(lightsOn)); });
const hold = $('#hold');
const setCompare = on => { compare = on; hold.classList.toggle('is-down', on); $('#stock-badge').hidden = !on; };
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
canvas.addEventListener('pointerdown', e => {
  if (mode !== 'build') return;
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, [e.clientX, e.clientY]);
  if (!userOrbit) userOrbit = Object.assign({}, cam.orbit, { target: cam.orbit.target.slice() });
  orbitGoal = null;
  if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinchDist = Math.hypot(a[0] - b[0], a[1] - b[1]); }
  touched();
});
canvas.addEventListener('pointermove', e => {
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
['pointerup', 'pointercancel'].forEach(ev => canvas.addEventListener(ev, e => { pointers.delete(e.pointerId); pinchDist = 0; }));
canvas.addEventListener('wheel', e => {
  if (mode !== 'build') return;
  e.preventDefault();
  if (!userOrbit) userOrbit = Object.assign({}, cam.orbit, { target: cam.orbit.target.slice() });
  orbitGoal = null;
  userOrbit.r = clamp(userOrbit.r * Math.exp(e.deltaY * 0.0012), 2.0, 8.5);
  touched();
}, { passive: false });
canvas.addEventListener('keydown', e => {
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
  update(dt, now / 1000);
  updateHeroCar();
  // at the top of the home page the hero film covers the stage: draw only now and then to stay warm
  const covered = mode === 'home' && scrollY < 2 && intro.done;
  if (ready && (!covered || coveredFrames++ % 30 === 0)) {
    draw(now / 1000);
    if (!covered) adapt(dt);
  }
  requestAnimationFrame(frame);
}

let settle = false;
function update(dt, time) {
  const k = settle ? 1 : 1 - Math.exp(-dt * 3.2);
  // intro
  if (!intro.done && ready) {
    intro.t += dt * intro.speed;
    const c = introCam(Math.min(intro.t, INTRO_LEN));
    cam.pos = c.pos; cam.tgt = c.tgt;
    cam.fov = 38 + (34 - 38) * smooth(12.6, 14.4, intro.t);
    const hs = HOME_CAMS.hero.shift;
    cam.shift = [hs[0] * smooth(12.8, 14.4, intro.t), hs[1] * smooth(12.8, 14.4, intro.t)];
    lights = introLights(intro.t);
    show = smooth(11.2, 12.4, intro.t);
    exposure = 1.35 * smooth(0, 0.8, intro.t);
    xray = 0; bay = 0;
    if (intro.t >= INTRO_LEN) { intro.done = true; intro.t = 99; }
    return;
  }
  if (!intro.done) return;

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
  cam.fov = lerp(cam.fov, goal.fov, k);
  cam.shift = [lerp(cam.shift[0], goal.shift[0], k), lerp(cam.shift[1], goal.shift[1], k)];

  // hotspots
  const spotsOn = mode === 'home' ? smooth(0.6, 0.95, xray) : 0;
  for (const h of hotspots) {
    const s = spotsOn > 0.01 ? project(add(h.p, [0, -(live.uRide || 0), 0])) : null;
    if (!s) { h.el.style.opacity = '0'; continue; }
    h.el.style.opacity = spotsOn.toFixed(2);
    h.el.style.transform = `translate(${s[0].toFixed(1)}px, ${s[1].toFixed(1)}px) translateY(-50%)`;
  }
}

function draw(time) {
  sizeCanvas();
  gl.viewport(0, 0, canvas.width, canvas.height);
  const target = uniformsFor(mode === 'build' && compare ? STOCK : config);
  const ks = 0.18;
  for (const [n, v] of Object.entries(target)) {
    if (INTS.has(n) || live[n] === undefined) live[n] = Array.isArray(v) ? v.slice() : v;
    else if (Array.isArray(v)) live[n] = live[n].map((x, i) => x + (v[i] - x) * ks);
    else live[n] = live[n] + (v - live[n]) * ks;
  }
  for (const [n, v] of Object.entries(live)) setU(n, v);
  const f = norm(sub(cam.tgt, cam.pos)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f);
  setU('uCamPos', cam.pos); setU('uCamFwd', f); setU('uCamRight', r); setU('uCamUp', u);
  setU('uTanHalf', Math.tan(cam.fov * Math.PI / 360));
  setU('uShift', cam.shift);
  setU('uRes', [canvas.width, canvas.height]);
  setU('uTime', time % 1000);
  setU('uZero', 0);
  setU('uT', intro.done ? 99 : intro.t);
  setU('uXray', xray < 0.003 ? 0 : xray);
  setU('uLights', lights);
  setU('uBay', bay < 0.003 ? 0 : bay);
  setU('uShow', show);
  setU('uReflect', reflect);
  setU('uExposure', exposure);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// ------------------------------------------------------------------ boot
addEventListener('resize', () => { measure(); sizeCanvas(); onScroll(); layoutBuilder(); });
addEventListener('load', measure);
document.fonts && document.fonts.ready.then(measure);
measure(); onScroll(); renderCard();
if (reduceMotion) finishIntro();
initGL();
route();
if (location.hash && location.hash !== '#build' && location.hash !== '#top') finishIntro();
startHero();
requestAnimationFrame(frame);

// test hook
window.RZ = {
  state: () => ({ intro: intro.t, done: intro.done, heroDone, heroTime: heroVideo.currentTime, mode, scale: quality.scale, ready, glFailed, xray, cam: { pos: cam.pos, tgt: cam.tgt } }),
  setIntro: (t, hold) => { intro.done = false; intro.t = t; if (hold) intro.speed = 0; },   // previews the 3D liquid intro
  skipHero: () => finishIntro(),
  setConfig: c => { Object.assign(config, c); renderCard(); if (activeCat) setCategory(activeCat); },
  quality,
  settle: v => { settle = v; },
};
})();
