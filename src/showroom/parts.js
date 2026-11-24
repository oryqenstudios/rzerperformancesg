// Configurable parts for the 3D Evo: carbon fibre, bolt-on aero, exhaust tips, the x-ray view, and the controller
// that maps the configurator's values onto the car each frame.
//
// World frame (the car as showroom.js places it): metres, x forward, y up from the floor, z across, car centred.
// Add-ons are fitted to the model's own geometry where it matters (the splitter follows the front lip's outline,
// the skirts follow the sills, the wing sits on the boot), measured from the part nodes of
// lancer-evolution-rzer.glb (tools/split-model.py).
import * as THREE from 'three';

const HASH = /* glsl */`
float rzHash(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }`;

// ---------------------------------------------------------------- dissolve (the x-ray view)
// Exterior materials drop a growing share of their pixels in a fixed screen-space pattern, so the shell fades
// out without transparency sorting and without recompiling anything.
export function addDissolve(m, uniform) {
  const prev = m.onBeforeCompile;
  const prevKey = m.customProgramCacheKey.call(m);
  m.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(m, sh, r);
    sh.uniforms.uDissolve = uniform;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uDissolve;' + HASH)
      .replace(/void main\(\) \{/, 'void main() {\n  if (uDissolve > 0.0 && rzHash(gl_FragCoord.xy) < uDissolve) discard;');
  };
  m.customProgramCacheKey = () => prevKey + '|dissolve';
  return m;
}

// ---------------------------------------------------------------- carbon fibre
// A 2x2 twill weave: tows run alternately along u and v in a staircase. Each tow gets a lengthwise sheen, so the
// weave flickers as the light moves. Once a tow is smaller than about a pixel, the pattern fades to plain dark
// lacquer (as real carbon looks from across a room) instead of shimmering. `unit` = metres per object unit.
export function carbonMaterial(env, unit = 1) {
  const m = new THREE.MeshPhysicalMaterial({
    color: 0x2a2c30, metalness: 0.1, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.03, envMap: env, envMapIntensity: 0.9,
  });
  m.onBeforeCompile = sh => {
    sh.uniforms.uTow = { value: 0.0045 / unit };   // tow width in object units
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCfPos;\nvarying vec3 vCfNormal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCfPos = position;\nvCfNormal = normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uTow;\nvarying vec3 vCfPos;\nvarying vec3 vCfNormal;\nfloat cfWeave;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          // project onto the plane the surface mostly faces
          vec3 an = abs(normalize(vCfNormal));
          vec2 q = an.y > max(an.x, an.z) ? vCfPos.xz : (an.x > an.z ? vCfPos.zy : vCfPos.xy);
          q /= uTow;
          float along = mod(floor(q.x) + floor(q.y), 4.0) < 2.0 ? 1.0 : 0.0;   // which way the top tow runs
          float across = along > 0.5 ? fract(q.y) : fract(q.x);
          float tow = sin(across * 3.14159);                                  // rounded tow cross-section
          float vis = 1.0 - smoothstep(0.4, 1.1, length(fwidth(q)));
          cfWeave = mix(0.5, along * 0.55 + tow * 0.45, vis);
          diffuseColor.rgb *= mix(0.55, 1.45, cfWeave);
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(0.46, 0.26, cfWeave);`);
  };
  m.customProgramCacheKey = () => 'rz-carbon';
  return m;
}

// ---------------------------------------------------------------- x-ray ghost
// The shell drawn again as a glowing outline: fresnel edges and a faint 12.5 cm grid in world space.
export function ghostMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 0 }, uColor: { value: new THREE.Color(0.55, 0.75, 1.0) } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        vec4 mv = viewMatrix * w; vV = -mv.xyz; vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `uniform float uOpacity; uniform vec3 uColor; varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
        vec2 g = abs(fract(vW.xz * 8.0) - 0.5);
        float grid = smoothstep(0.46, 0.5, max(g.x, g.y));
        float a = (0.03 + 0.75 * f + grid * (0.08 + 0.3 * f)) * uOpacity;
        gl_FragColor = vec4(uColor * a, a);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
}

// ---------------------------------------------------------------- measuring the model
function worldPoints(root) {
  const out = [], v = new THREE.Vector3();
  root.updateMatrixWorld(true);
  root.traverse(o => {
    if (!o.isMesh) return;
    const p = o.geometry.attributes.position;
    for (let i = 0; i < p.count; i += 1) out.push(v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld).clone());
  });
  return out;
}
// convex hull of points in the xz plane (monotone chain), as [x, z] pairs, counter-clockwise
function hullXZ(pts) {
  const p = pts.map(v => [v.x, v.z]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const q of p) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
  for (const q of p.reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}
// a flat plate (outline in xz, thickness t) whose top face sits at height y
function plateXZ(outline, y, t) {
  const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, z)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false });
  g.rotateX(Math.PI / 2);   // shape (x, z) lies in xz, extruded downward
  g.translate(0, y, 0);
  return g;
}
// a profile (offset outward, height) swept along a line of [x, z] points; side = +1 / -1 for the car's two sides
function sweep(line, profile, side) {
  const pos = [], idx = [];
  line.forEach(([x, z]) => { for (const [o, y] of profile) pos.push(x, y, z + side * o); });
  const n = profile.length;
  for (let i = 0; i < line.length - 1; i++) for (let j = 0; j < n - 1; j++) {
    const a = i * n + j, b = a + 1, c = a + n, d = c + 1;
    if (side > 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function extrudeSide(points, depth) {   // a shape in (x, y), extruded across z, centred
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y))), { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  return g;
}

// ---------------------------------------------------------------- bolt-on parts
export function buildAddons({ env, carbon, parts }) {
  const shellPts = worldPoints(parts.shell);   // measured once: the shell is large
  const group = new THREE.Group();
  group.name = 'rz-addons';
  const mesh = (g, m, name) => { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; if (name) o.name = name; return o; };

  // --- splitter: a plate following the front lip's outline, pushed 6 cm forward, plus canards on the corners
  const lipPts = worldPoints(parts.lip);
  const lipMin = Math.min(...lipPts.map(p => p.y));
  const lipX0 = Math.min(...lipPts.map(p => p.x)), lipX1 = Math.max(...lipPts.map(p => p.x));
  const front = lipPts.filter(p => p.x > lipX0 + 0.12);
  const hull = hullXZ(front).map(([x, z]) => [x + (x - lipX0) / (lipX1 - lipX0) * 0.06, z * 1.025]);
  const splitter = new THREE.Group();
  splitter.name = 'splitter';
  splitter.add(mesh(plateXZ(hull, lipMin + 0.002, 0.009), carbon));
  const canard = extrudeSide([[0, 0], [0.13, 0.012], [0.11, 0.03], [0, 0.026]], 0.005);
  const bumper = shellPts.filter(p => p.x > 1.85 && p.y > 0.3 && p.y < 0.46);
  for (const side of [-1, 1]) {
    const edge = bumper.filter(p => p.z * side > 0).reduce((a, p) => Math.abs(p.z) > Math.abs(a.z) ? p : a, new THREE.Vector3(1.95, 0, 0.85 * side));
    for (const [dy, dx] of [[0.0, 0.0], [0.085, -0.03]]) {
      const c = mesh(canard, carbon);
      c.position.set(edge.x - 0.02 + dx, 0.31 + dy, edge.z + side * 0.01);
      c.rotation.set(side * 0.35, side * -0.55, 0.12);
      splitter.add(c);
    }
  }
  group.add(splitter);

  // --- side skirts: a blade along each sill between the arches, with a small flange
  const sill = shellPts.filter(p => p.y < 0.26 && p.x > -0.92 && p.x < 0.95);
  const sillY = sill.length ? Math.min(...sill.map(p => p.y)) : 0.13;
  const skirts = new THREE.Group();
  skirts.name = 'skirts';
  for (const side of [-1, 1]) {
    const line = [];
    for (let x = -0.9; x <= 0.93; x += 0.06) {
      const near = sill.filter(p => Math.abs(p.x - x) < 0.04 && p.z * side > 0);
      const zo = near.length ? Math.max(...near.map(p => Math.abs(p.z))) : 0.86;
      line.push([x, side * zo]);
    }
    const profile = [[-0.01, sillY + 0.045], [0.012, sillY + 0.04], [0.016, sillY - 0.03], [0.05, sillY - 0.036], [0.052, sillY - 0.046], [-0.01, sillY - 0.046]];
    skirts.add(mesh(sweep(line.map(([x, z]) => [x, z]), profile, side), carbon));
  }
  group.add(skirts);

  // --- diffuser: a plate under the rear bumper kicking up at the back, with seven fins
  const diffuser = new THREE.Group();
  diffuser.name = 'diffuser';
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.008, 1.0), carbon);
  plate.position.set(-2.04, 0.245, 0); plate.rotation.z = -0.07; plate.castShadow = true;
  diffuser.add(plate);
  const fin = extrudeSide([[0, 0], [0.42, 0], [0, -0.075]], 0.006);   // deepest at the back
  diffuser.userData.fins = [];
  for (const z of [-0.42, -0.28, -0.14, 0, 0.14, 0.28, 0.42]) {
    const f = mesh(fin, carbon);
    f.position.set(-2.255, 0.255, z); f.rotation.z = -0.07;
    diffuser.add(f);
    diffuser.userData.fins.push(f);
  }
  group.add(diffuser);

  // --- the boot: its height along the car, from the shell (the factory wing is a separate part)
  const bootPts = shellPts.filter(p => p.x < -1.7 && Math.abs(p.z) < 0.5 && p.y > 0.8);
  const bootY = x => { const near = bootPts.filter(p => Math.abs(p.x - x) < 0.03); return near.length ? Math.max(...near.map(p => p.y)) : 1.0; };
  const bootEnd = bootPts.length ? Math.min(...bootPts.filter(p => p.y > bootY(-2.0) - 0.06).map(p => p.x)) : -2.2;

  // --- lip spoiler: a thin blade on the boot's trailing edge
  const lip = mesh(extrudeSide([[0, 0], [-0.09, 0.0], [-0.1, 0.028], [-0.02, 0.012]], 1.22), carbon, 'lipSpoiler');
  lip.position.set(bootEnd + 0.07, bootY(bootEnd + 0.07) - 0.004, 0);
  group.add(lip);

  // --- GT wing: an inverted airfoil on twin uprights, with end plates and a gurney flap
  const gt = new THREE.Group();
  gt.name = 'gtWing';
  const foil = [];
  for (let i = 0; i <= 24; i++) {   // inverted, cambered section: flat-ish top, curved underside
    const t = i / 24, x = -t * 0.3;
    foil.push([x, 0.006 * Math.sin(Math.PI * t)]);
  }
  for (let i = 24; i >= 0; i--) {
    const t = i / 24, x = -t * 0.3;
    foil.push([x, -0.034 * Math.sqrt(t) * (1 - t) * 2.2 - 0.002]);
  }
  const wingY = 1.29, wingX = -1.93, span = 1.52;
  const blade = mesh(extrudeSide(foil, span), carbon);
  blade.position.set(wingX, wingY, 0); blade.rotation.z = -0.14;   // trailing edge up
  gt.add(blade);
  const gurney = mesh(new THREE.BoxGeometry(0.004, 0.016, span), carbon);
  gurney.position.set(wingX - 0.3 * Math.cos(0.14), wingY + 0.3 * Math.sin(0.14) + 0.006, 0);
  gt.add(gurney);
  const endplate = extrudeSide([[0.05, -0.08], [-0.33, -0.05], [-0.36, 0.12], [0.03, 0.06]], 0.006);
  for (const side of [-1, 1]) {
    const e = mesh(endplate, carbon);
    e.position.set(wingX, wingY, side * (span / 2 + 0.003));
    gt.add(e);
    const baseY = bootY(-2.03);
    const upright = mesh(extrudeSide([[0, 0], [-0.15, 0], [-0.12, wingY - baseY - 0.03], [-0.04, wingY - baseY - 0.03]], 0.012), carbon);
    upright.position.set(-1.95, baseY - 0.01, side * 0.47);
    gt.add(upright);
  }
  group.add(gt);

  // --- exhaust tips: four layouts, three finishes
  const tipMats = [
    new THREE.MeshPhysicalMaterial({ color: 0xd8dadd, metalness: 1, roughness: 0.14, envMap: env, envMapIntensity: 1.3, side: THREE.DoubleSide }),
    new THREE.MeshPhysicalMaterial({ vertexColors: true, metalness: 1, roughness: 0.24, envMap: env, envMapIntensity: 1.3, side: THREE.DoubleSide }),
    new THREE.MeshPhysicalMaterial({ color: 0x0b0b0c, metalness: 0.2, roughness: 0.62, envMap: env, envMapIntensity: 0.6, side: THREE.DoubleSide }),
  ];
  const soot = new THREE.MeshStandardMaterial({ color: 0x030303, roughness: 0.95 });
  function tipGeometry(r) {
    const g = new THREE.CylinderGeometry(r, r * 0.96, 0.17, 40, 6, true);
    g.rotateZ(Math.PI / 2);   // axis along x, outlet at -x
    // heat-blued titanium: gold at the base, blue then violet toward the outlet (used by the titanium finish)
    const pos = g.attributes.position, col = [];
    const stops = [[0, [0.80, 0.55, 0.22]], [0.45, [0.25, 0.32, 0.78]], [0.75, [0.40, 0.22, 0.62]], [1, [0.62, 0.62, 0.66]]];
    for (let i = 0; i < pos.count; i++) {
      const t = 0.5 - pos.getX(i) / 0.17;   // 0 at the base, 1 at the outlet
      let k = 0; while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
      const [ta, ca] = stops[k], [tb, cb] = stops[k + 1], u = THREE.MathUtils.clamp((t - ta) / (tb - ta), 0, 1);
      col.push(...ca.map((c, j) => c + (cb[j] - c) * u));
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return g;
  }
  const tips = {};
  const layouts = {
    3: { r: 0.05, at: [[0.285, 0.555], [0.285, -0.555]] },                                        // twin, one each side
    1: { r: 0.042, at: [[0.285, 0.48], [0.285, 0.63], [0.285, -0.48], [0.285, -0.63]] },           // quad
    2: { r: 0.047, at: [[0.27, 0.085], [0.27, -0.085]] },                                          // centre twin
  };
  for (const [key, { r, at }] of Object.entries(layouts)) {
    const set = new THREE.Group();
    set.name = 'tips' + key;
    const geo = tipGeometry(r);
    set.userData.shells = [];
    for (const [y, z] of at) {
      const t = mesh(geo, tipMats[0]);
      t.position.set(-2.19, y, z);
      set.add(t);
      set.userData.shells.push(t);
      const inner = mesh(new THREE.CircleGeometry(r * 0.94, 32), soot);
      inner.position.set(-2.2, y, z); inner.rotation.y = -Math.PI / 2;
      set.add(inner);
    }
    tips[key] = set;
    group.add(set);
  }
  return { group, splitter, skirts, diffuser, lip, gt, tips, tipMats };
}

// ---------------------------------------------------------------- x-ray internals
// What the x-ray view shows under the shell: the transverse 4G63 with its red cam cover, the turbo on the front
// of the engine, the front-mount intercooler piping, coilovers at each corner, the exhaust and the AWD driveline.
export function buildInternals(env) {
  const g = new THREE.Group();
  g.name = 'rz-internals';
  const M = (color, metalness, roughness, extra = {}) => new THREE.MeshPhysicalMaterial({ color, metalness, roughness, envMap: env, envMapIntensity: 1.1, ...extra });
  const alu = M(0x9a9da2, 1, 0.35), steel = M(0x6d7075, 1, 0.3), dark = M(0x1c1d20, 0.6, 0.5), red = M(0xb0160e, 0.1, 0.45, { clearcoat: 0.6 });
  const gold = M(0xc89b3c, 1, 0.3), spring = M(0xc4180f, 0.2, 0.35, { clearcoat: 0.8 }), black = M(0x0c0c0d, 0.3, 0.6);
  const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m; };
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d, 2, 2, 2);
  // engine: block, head, red cam cover, intake plenum, oil pan
  add(box(0.42, 0.34, 0.62), alu, 1.45, 0.5, 0.02);
  add(box(0.34, 0.1, 0.6), alu, 1.47, 0.72, 0.02);
  add(box(0.3, 0.06, 0.56), red, 1.47, 0.8, 0.02);
  add(box(0.14, 0.14, 0.5), alu, 1.25, 0.72, 0.02, 0, 0, 0.25);
  add(box(0.32, 0.08, 0.5), dark, 1.45, 0.3, 0.02);
  // gearbox on the left of the engine, transfer case
  add(new THREE.CylinderGeometry(0.15, 0.18, 0.36, 24), dark, 1.35, 0.42, 0.48, Math.PI / 2, 0, 0);
  // turbo on the front of the engine: compressor and turbine housings, downpipe
  const snail = new THREE.TorusGeometry(0.075, 0.035, 14, 32);
  add(snail, steel, 1.72, 0.6, 0.12, 0, Math.PI / 2, 0);
  add(snail, alu, 1.72, 0.6, 0.28, 0, Math.PI / 2, 0);
  add(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 20), steel, 1.72, 0.6, 0.2, Math.PI / 2, 0, 0);
  // intercooler pipes from the turbo to the front-mount core and back to the plenum
  const pipe = (pts, r, mat) => g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 48, r, 12), mat));
  pipe([[1.72, 0.6, 0.32], [1.8, 0.55, 0.45], [1.95, 0.42, 0.52], [2.0, 0.38, 0.45]], 0.032, alu);
  pipe([[2.0, 0.38, -0.45], [1.9, 0.5, -0.5], [1.55, 0.72, -0.3], [1.3, 0.76, -0.1]], 0.032, alu);
  // exhaust: downpipe under the engine, along the tunnel to a muffler at the back
  pipe([[1.72, 0.6, 0.18], [1.78, 0.4, 0.12], [1.6, 0.22, 0.1], [0.8, 0.2, 0.14], [-0.6, 0.21, 0.16], [-1.6, 0.25, 0.4], [-1.95, 0.27, 0.5]], 0.032, steel);
  add(new THREE.CylinderGeometry(0.11, 0.11, 0.42, 24), steel, -1.85, 0.27, 0.12, 0, 0, Math.PI / 2);
  // driveline: prop shaft, rear diff, half shafts
  add(new THREE.CylinderGeometry(0.03, 0.03, 2.3, 12), steel, 0.05, 0.24, 0.0, 0, 0, Math.PI / 2);
  add(box(0.22, 0.18, 0.26), dark, -1.33, 0.32, 0);
  for (const x of [1.34, -1.33]) for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.025, 0.025, 0.56, 12), steel, x, 0.32, s * 0.4, Math.PI / 2, 0, 0);
  // coilovers at each corner: gold damper body, red spring, top mount
  const helix = new THREE.Curve();
  helix.getPoint = (t, out = new THREE.Vector3()) => out.set(Math.cos(t * Math.PI * 2 * 6) * 0.055, t * 0.24 - 0.12, Math.sin(t * Math.PI * 2 * 6) * 0.055);
  const springGeo = new THREE.TubeGeometry(helix, 240, 0.009, 8);
  for (const [x, top] of [[1.33, 0.86], [-1.32, 0.8]]) for (const s of [-1, 1]) {
    const z = s * 0.56;
    add(new THREE.CylinderGeometry(0.028, 0.028, top - 0.38, 16), gold, x, (top + 0.38) / 2, z);
    add(springGeo, spring, x, top - 0.17, z);
    add(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 20), black, x, top, z);
    add(new THREE.CylinderGeometry(0.065, 0.065, 0.012, 20), gold, x, top - 0.3, z);
  }
  // front-mount intercooler core behind the bumper
  add(box(0.06, 0.2, 1.0), alu, 2.02, 0.4, 0);
  g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
  g.visible = false;
  return g;
}

// ---------------------------------------------------------------- the controller
// Maps the configurator's eased values (the old shader uniforms, see CATS in app.js) and the view state onto the car.
export function carController({ dressed, addons, internals, ghosts, ghostMat, carbonBody, bodyNode, bodyRig, renderer }) {
  const { materials: mat, parts, headlights, dissolve } = dressed;
  const base = bodyNode.position.clone();
  bodyNode.parent.updateMatrixWorld(true);
  const inv = bodyNode.parent.matrixWorld.clone().invert();
  const down = new THREE.Vector3(0, -1, 0).applyMatrix4(inv).sub(new THREE.Vector3(0, 0, 0).applyMatrix4(inv));   // 1 m down, in local units
  const carbonParts = { uHood: parts.bonnet, uRoof: parts.roof, uMirror: parts.mirrors };
  const setPaintOrCarbon = (part, carbonOn) => part.traverse(o => {
    if (!o.isMesh || !o.userData.paintSlot) return;
    o.material = carbonOn ? carbonBody : mat.paint;
  });
  let last = {};
  let shadowDirty = true;
  const changed = (k, v) => { const same = last[k] === v; last[k] = v; return !same; };

  function set(s) {
    // paint: the configurator's colour in linear RGB, with finish from roughness and metal
    if (s.uPaint) mat.paint.color.setRGB(s.uPaint[0], s.uPaint[1], s.uPaint[2]);
    const rough = s.uPaintRough ?? 0.02, metal = s.uPaintMetal ?? 0;
    mat.paint.metalness = 0.9 * metal;
    mat.paint.roughness = rough > 0.3 ? 0.58 : THREE.MathUtils.lerp(0.42, 0.36, metal);
    mat.paint.clearcoat = 1 - THREE.MathUtils.smoothstep(rough, 0.25, 0.45);
    mat.paint.clearcoatRoughness = 0.02 + rough * 0.1;
    mat.paint.userData.flake.value = metal;
    // wheels and brakes
    if (s.uRimCol) mat.rim.color.setRGB(s.uRimCol[0], s.uRimCol[1], s.uRimCol[2]);
    mat.rim.roughness = Math.max(0.06, s.uRimRough ?? 0.2);
    mat.rim.metalness = s.uRimMetal ?? 1;
    mat.rim.clearcoat = 1 - 0.5 * (s.uRimMetal ?? 1);
    if (s.uCaliper) mat.caliper.color.setRGB(s.uCaliper[0], s.uCaliper[1], s.uCaliper[2]);
    // glass and lights
    const tint = s.uTint ?? 0.2;
    mat.windows.opacity = 0.6 + 0.37 * tint;
    if (s.uDrl) headlights.colour.setRGB(s.uDrl[0], s.uDrl[1], s.uDrl[2]);
    headlights.set(s.lights ?? 1);
    // stance: the body drops, the wheels stay on the floor
    const ride = s.uRide ?? 0;
    if (changed('ride', ride.toFixed(4))) {
      bodyNode.position.copy(base).addScaledVector(down, ride);
      bodyRig.position.y = -ride;
      shadowDirty = true;
    }
    // carbon panels and the front lip
    for (const [k, part] of Object.entries(carbonParts)) if (changed(k, s[k])) { setPaintOrCarbon(part, s[k] === 1); }
    if (changed('uLip', s.uLip)) { setPaintOrCarbon(parts.lip, s.uLip >= 1); addons.splitter.visible = s.uLip === 2; shadowDirty = true; }
    if (changed('uSkirts', s.uSkirts)) { addons.skirts.visible = s.uSkirts === 1; shadowDirty = true; }
    if (changed('uDiffuser', s.uDiffuser)) { addons.diffuser.visible = s.uDiffuser === 1; shadowDirty = true; }
    if (changed('uSpoiler', s.uSpoiler)) {
      parts.wing.visible = s.uSpoiler === 1;
      addons.lip.visible = s.uSpoiler === 2;
      addons.gt.visible = s.uSpoiler === 3;
      shadowDirty = true;
    }
    if (changed('uExhaust', s.uExhaust) || changed('uExFinish', s.uExFinish) || changed('uDiffuser2', s.uDiffuser)) {
      parts.tip.visible = (s.uExhaust ?? 0) === 0;
      for (const [key, set] of Object.entries(addons.tips)) {
        set.visible = String(s.uExhaust) === key;
        for (const t of set.userData.shells) t.material = addons.tipMats[s.uExFinish ?? 0] || addons.tipMats[0];
      }
      // the centre tips sit between the diffuser's middle fins
      for (const f of addons.diffuser.userData.fins) f.visible = !(s.uExhaust === 2 && Math.abs(f.position.z) < 0.15);
      shadowDirty = true;
    }
    // x-ray: the shell dissolves into a glowing outline and the internals show
    const x = s.xray ?? 0;
    dissolve.value = THREE.MathUtils.smoothstep(x, 0.05, 0.85) * 0.985;
    internals.visible = x > 0.02;
    for (const g of ghosts) { g.visible = x > 0.02; }
    ghostMat.uniforms.uOpacity.value = THREE.MathUtils.smoothstep(x, 0.1, 0.9);
    // the floor shadow only needs redrawing when the car changes shape
    if (shadowDirty && renderer) { renderer.shadowMap.needsUpdate = true; shadowDirty = false; }
  }
  return { set };
}
