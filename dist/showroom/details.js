// Real-world materials for the 3D Evo, added at runtime. The model has no UVs or textures, so every PBR channel
// (colour, roughness, metalness and surface relief) is computed per pixel from the surface position: in effect
// texture maps of unlimited resolution, which fade out cleanly once their detail is smaller than a pixel.
// Metallic-flake paint under an orange-peel clear coat; satin trim with a moulded stipple; grained leather with
// perforated seat inserts, brushed aluminium and piano-black trim inside; tyres with rubber grain, tread, sipes
// and plain moulded sidewalls; cross-drilled machined discs and cast calipers; tail lamps with optic ridges;
// clear headlight lenses with lit projectors. No text anywhere: the plates are blank and the sidewalls plain.
//
// The model shares materials between parts (the tyre rubber is also the interior, the caliper colour is also
// the black trim), so parts are told apart by the node they hang under: 'car body', 'w1'-'w4', 'b1'-'b4', and the
// body's part nodes from tools/split-model.py (rz_shell, rz_bonnet, rz_roof, rz_mirrors, rz_lip, rz_wing, rz_tip,
// rz_interior). Exterior materials get the x-ray dissolve (parts.js); the interior, wheels and brakes stay solid.
import * as THREE from 'three';
import { addDissolve, carbonMaterial } from './parts.js';

const NOISE = /* glsl */`
float h13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
vec3 h33(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
float vnoise3(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h13(i), h13(i + vec3(1, 0, 0)), f.x), mix(h13(i + vec3(0, 1, 0)), h13(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h13(i + vec3(0, 0, 1)), h13(i + vec3(1, 0, 1)), f.x), mix(h13(i + vec3(0, 1, 1)), h13(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}`;

// Surface relief from a procedural height field: bump mapping from screen-space derivatives (no UVs or tangents
// needed). Heights are in metres, as the view space is.
const BUMP = /* glsl */`
vec3 rzBump(vec3 n, float h) {
  // all derivatives first (they need uniform control flow), then guard: where a triangle is smaller than a pixel
  // the derivatives can be zero, and normalising a zero vector gives NaN, which the bloom would smear over the frame
  vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition);
  vec2 dh = vec2(dFdx(h), dFdy(h));
  vec3 r1 = cross(sy, n), r2 = cross(n, sx);
  float det = dot(sx, r1);
  vec3 b = abs(det) * n - sign(det) * (dh.x * r1 + dh.y * r2);
  float l = length(b);
  return (l > 1e-20 && abs(det) > 1e-20) ? b / l : n;
}
// how much of a pattern of frequency f (cycles per metre) still shows at this pixel
float rzVis(vec3 p, float f) { return 1.0 - smoothstep(0.35, 1.0, length(fwidth(p * f))); }`;

// Adds a micro-detail layer to a material. `glsl` runs with `p` (the surface position in metres, object space) and
// `n` (the object-space normal) and sets rzH (relief height in metres), rzRough (added roughness), rzTint
// (colour multiplier) and rzMetal (added metalness). `unit` is metres per object unit.
function micro(m, unit, key, glsl, extraUniforms = {}) {
  const prev = m.onBeforeCompile;
  const prevKey = m.customProgramCacheKey.call(m);
  m.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(m, sh, r);
    if (!/varying vec3 vObjPos/.test(sh.vertexShader)) objectSpace(sh);
    sh.uniforms.uUnit = { value: unit };
    Object.assign(sh.uniforms, extraUniforms);
    const decl = Object.entries(extraUniforms).map(([k, u]) => `uniform ${u.type} ${k};`).join('\n');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uUnit;\n${decl}\nfloat rzH; float rzRough; float rzMetal; vec3 rzTint;${BUMP}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec3 p = vObjPos * uUnit, n = normalize(vObjNormal);
          rzH = 0.0; rzRough = 0.0; rzMetal = 0.0; rzTint = vec3(1.0);
          ${glsl}
          diffuseColor.rgb *= rzTint;
        }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + rzRough, 0.02, 1.0);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = clamp(metalnessFactor + rzMetal, 0.0, 1.0);')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = rzBump(normal, rzH);');
  };
  m.customProgramCacheKey = () => prevKey + '|' + key;
  return m;
}

// give the fragment shader the object-space position and normal (the mesh's own units)
function objectSpace(sh) {
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;\nvarying vec3 vObjNormal;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObjPos = position;\nvObjNormal = normal;');
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;\nvarying vec3 vObjNormal;\n' + NOISE);
}

// ---------------------------------------------------------------- paint
// Flakes tilt the base layer's normal per ~1.5 mm cell so the metallic paint sparkles; the clear coat on top
// keeps its own normal, with only a faint low-frequency orange-peel ripple.
function paintMaterial(color, env, unitsPerMetre) {
  const m = new THREE.MeshPhysicalMaterial({
    // a slightly rough metallic base under a mirror-smooth clear coat: paint, not chrome
    color, metalness: 0.9, roughness: 0.36, clearcoat: 1, clearcoatRoughness: 0.02, envMap: env, envMapIntensity: 1.25,
  });
  m.onBeforeCompile = sh => {
    objectSpace(sh);
    // cells per model unit: flakes about 1.5 mm across, orange-peel ripples about 1.5 cm
    sh.uniforms.uFlake = { value: 1 / (unitsPerMetre * 0.0015) };
    sh.uniforms.uFlakeAmt = m.userData.flake;   // 1 for metallic paint, 0 for solid colours
    sh.uniforms.uPeel = { value: 1 / (unitsPerMetre * 0.015) };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uFlake;\nuniform float uPeel;\nuniform float uFlakeAmt;')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          // flakes only show where a flake is bigger than about a pixel; further off they average out to
          // smooth metallic paint, as real paint does, instead of aliasing into noise
          vec3 fp = vObjPos * uFlake;
          float flakeVis = 1.0 - smoothstep(0.35, 1.2, length(fwidth(fp)));
          normal = normalize(normal + (h33(floor(fp)) - 0.5) * 0.09 * flakeVis * uFlakeAmt);
        }`)
      .replace('#include <clearcoat_normal_fragment_maps>', `#include <clearcoat_normal_fragment_maps>
        vec3 peel = vec3(vnoise3(vObjPos * uPeel), vnoise3(vObjPos * uPeel + 17.3), vnoise3(vObjPos * uPeel + 41.9)) - 0.5;
        clearcoatNormal = normalize(clearcoatNormal + peel * 0.012);`);
  };
  m.userData.flake = { value: 1 };
  m.customProgramCacheKey = () => 'rz-paint';
  return m;
}

// ---------------------------------------------------------------- tyres
// The tyre's axis is its local y; uOutward picks the face that points away from the car. The sidewall is plain
// moulded rubber (no lettering): a rim-protector ring and fine concentric ribs near the bead. The tread has two
// circumferential grooves and sipes. Rubber grain everywhere.
function tyreMaterial(env, outward, unit) {
  const m = new THREE.MeshPhysicalMaterial({ color: 0x141416, roughness: 0.86, metalness: 0, envMap: env, envMapIntensity: 0.45 });
  m.onBeforeCompile = sh => {
    objectSpace(sh);
    sh.uniforms.uOutward = { value: outward };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uOutward;\nfloat tyreRing;\nfloat tyreGroove;\nfloat tyreSide;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec3 n = normalize(vObjNormal);
          float r = length(vObjPos.xz);
          float a = atan(vObjPos.z, vObjPos.x);
          tyreSide = step(0.5, abs(n.y));
          tyreRing = 0.0; tyreGroove = 0.0;
          if (tyreSide > 0.5) {
            tyreRing = 0.45 * (1.0 - smoothstep(0.03, 0.09, abs(r - 10.75)));                            // rim protector
            tyreRing = max(tyreRing, 0.2 * step(0.5, fract(r * 6.0)) * (1.0 - smoothstep(11.1, 11.6, r)) * step(10.85, r));   // ribs by the bead
          } else {
            float w = abs(vObjPos.y);
            tyreGroove = max(1.0 - smoothstep(0.12, 0.22, abs(w - 1.3)), 1.0 - smoothstep(0.1, 0.2, abs(w - 3.7)));
            float sipe = 1.0 - smoothstep(0.02, 0.07, abs(fract(a * 30.0) - 0.5));
            tyreGroove = max(tyreGroove, sipe * smoothstep(3.9, 4.4, w) * 0.8);
          }
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.1, 0.1, 0.105), tyreRing);
          diffuseColor.rgb *= 1.0 - 0.75 * tyreGroove;
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = tyreSide > 0.5 ? mix(0.7, 0.55, tyreRing) : mix(0.88, 1.0, tyreGroove);`);
  };
  m.customProgramCacheKey = () => 'rz-tyre';
  // rubber grain, about 0.6 mm
  return micro(m, unit, 'grain', `
    float f = 1700.0;
    rzH = (vnoise3(p * f) - 0.5) * 0.00004 * rzVis(p, f);
    rzRough = (vnoise3(p * 500.0) - 0.5) * 0.06;`);
}

// ---------------------------------------------------------------- brakes
function discMaterial(env) {
  const m = new THREE.MeshPhysicalMaterial({ color: 0x8b8d91, metalness: 1, roughness: 0.42, envMap: env, envMapIntensity: 1 });
  m.onBeforeCompile = sh => {
    objectSpace(sh);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nfloat discRing;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        float discR = length(vObjPos.xz);
        discRing = 0.5 + 0.5 * sin(discR * 55.0);   // machining marks
        diffuseColor.rgb *= mix(0.8, 1.0, discRing) * mix(0.5, 1.0, smoothstep(3.0, 4.2, discR));   // darker hat in the middle
        {
          // cross-drilled: two staggered rings of 24 holes across the friction face
          float ang = atan(vObjPos.z, vObjPos.x) / 6.2831853 * 24.0, hole = 0.0;
          for (int k = 0; k < 2; k++) {
            float rr = 5.05 + 0.8 * float(k);
            vec2 d = vec2((fract(ang + 0.5 * float(k)) - 0.5) * rr * 6.2831853 / 24.0, discR - rr);
            hole = max(hole, 1.0 - smoothstep(0.13, 0.2, length(d)));
          }
          diffuseColor.rgb *= 1.0 - 0.9 * hole;
          discRing = mix(discRing, 1.0, hole);
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(0.3, 0.52, discRing);`);
  };
  return m;
}

// ---------------------------------------------------------------- number plate
// blank: a black plate in a thin silver frame, no lettering
function plateTexture() {
  const c = document.createElement('canvas');
  c.width = 1040; c.height = 224;
  const g = c.getContext('2d');
  g.fillStyle = '#050505'; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = '#d8d8d8'; g.lineWidth = 7; g.strokeRect(14, 14, c.width - 28, c.height - 28);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
// The plate mesh has front and rear quads; give each a planar UV that reads correctly from outside.
function plateUVs(mesh) {
  const pos = mesh.geometry.attributes.position, v = new THREE.Vector3();
  const world = [];
  for (let i = 0; i < pos.count; i++) world.push(v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld).clone());
  const bounds = { front: new THREE.Box3(), rear: new THREE.Box3() };
  world.forEach(p => bounds[p.x > 0 ? 'front' : 'rear'].expandByPoint(p));
  const uv = new Float32Array(pos.count * 2);
  world.forEach((p, i) => {
    const b = bounds[p.x > 0 ? 'front' : 'rear'], w = b.max.z - b.min.z || 1, h = b.max.y - b.min.y || 1;
    uv[2 * i] = p.x > 0 ? (b.max.z - p.z) / w : (p.z - b.min.z) / w;   // seen from the front, +z is to the left
    uv[2 * i + 1] = (p.y - b.min.y) / h;
  });
  mesh.geometry = mesh.geometry.clone();
  mesh.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

// ---------------------------------------------------------------- headlights
// The lenses share the window glass. Split their triangles into their own mesh so they can be clear.
function splitHeadlightLenses(glassMesh, front) {
  const g = glassMesh.geometry, pos = g.attributes.position, idx = g.index;
  if (!idx) return null;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const keep = [], lens = [];
  const lensBox = { left: new THREE.Box3(), right: new THREE.Box3() };
  for (let i = 0; i < idx.count; i += 3) {
    const i0 = idx.getX(i), i1 = idx.getX(i + 1), i2 = idx.getX(i + 2);
    a.fromBufferAttribute(pos, i0).applyMatrix4(glassMesh.matrixWorld);
    b.fromBufferAttribute(pos, i1).applyMatrix4(glassMesh.matrixWorld);
    c.fromBufferAttribute(pos, i2).applyMatrix4(glassMesh.matrixWorld);
    const cx = (a.x + b.x + c.x) / 3, cy = (a.y + b.y + c.y) / 3, cz = (a.z + b.z + c.z) / 3;
    if (cx > front - 0.62 && cy > 0.45 && cy < 0.8 && Math.abs(cz) > 0.3) {   // the lenses sit 0.25-0.6 m behind the bumper
      lens.push(i0, i1, i2);
      const box = lensBox[cz < 0 ? 'left' : 'right'];
      box.expandByPoint(a); box.expandByPoint(b); box.expandByPoint(c);
    } else keep.push(i0, i1, i2);
  }
  if (!lens.length) return null;
  const windows = g.clone(); windows.setIndex(keep);
  const lenses = g.clone(); lenses.setIndex(lens);
  glassMesh.geometry = windows;
  return { geometry: lenses, boxes: [lensBox.left, lensBox.right].filter(x => !x.isEmpty()) };
}
// Two projectors per side, each a glowing lens inside a halo ring.
function headlightUnits(boxes, colour) {
  const group = new THREE.Group();
  const glow = new THREE.MeshBasicMaterial({ color: colour.clone().multiplyScalar(7), toneMapped: true });
  const ring = new THREE.MeshBasicMaterial({ color: colour.clone().multiplyScalar(4) });
  const beams = [];
  for (const box of boxes) {
    const centre = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
    for (const k of [-0.22, 0.22]) {
      const p = new THREE.Vector3(centre.x - 0.035, centre.y - size.y * 0.05, centre.z + k * size.z);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.024, 32), glow);
      lens.position.copy(p); lens.rotation.y = Math.PI / 2; group.add(lens);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.0045, 8, 48), ring);
      halo.position.copy(p); halo.rotation.y = Math.PI / 2; group.add(halo);
    }
  }
  // the configurator's light colour and on/off (0-1)
  const tint = colour.clone();
  const set = level => {
    glow.color.copy(tint).multiplyScalar(7 * level + 0.06);
    ring.color.copy(tint).multiplyScalar(4 * level + 0.04);
    for (const b of beams) { b.color.copy(tint); b.intensity = 28 * level; }
  };
  return { group, colour: tint, set };
}

// ---------------------------------------------------------------- dress the whole car
export function dressCar(model, { env, paintColor, unitsPerMetre, frontX }) {
  const parentNamed = (o, test) => { for (let p = o; p; p = p.parent) if (test(p.name)) return true; return false; };
  const partOf = o => { for (let p = o; p; p = p.parent) if (/^rz_/.test(p.name)) return p.name.slice(3); return null; };
  // GLTFLoader renames nodes (spaces become underscores), so 'car body' arrives as 'car_body'
  const onBody = o => parentNamed(o, n => n.replace(/[\s.]+/g, '_') === 'car_body');
  const onWheel = o => parentNamed(o, n => /^w[1-4]$/.test(n));
  const onBrake = o => parentNamed(o, n => /^b[1-4]$/.test(n));

  const paint = paintMaterial(paintColor, env, unitsPerMetre);
  const unit = 1 / unitsPerMetre;   // metres per object unit (body and wheels share it)
  // satin black plastic trim with a moulded stipple (about 0.4 mm)
  const trim = micro(new THREE.MeshPhysicalMaterial({ color: 0x0b0b0c, metalness: 0.02, roughness: 0.55, envMap: env, envMapIntensity: 0.6 }), unit, 'stipple', `
    float f = 2600.0;
    rzH = (vnoise3(p * f) - 0.5) * 0.00003 * rzVis(p, f);
    rzRough = (vnoise3(p * 300.0) - 0.5) * 0.08;`);
  const windows = new THREE.MeshPhysicalMaterial({
    color: 0x0a0d0c, roughness: 0.02, transparent: true, opacity: 0.8, clearcoat: 1, clearcoatRoughness: 0,
    envMap: env, envMapIntensity: 1.6, depthWrite: false,
  });
  const lensGlass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.01, transparent: true, opacity: 0.16, clearcoat: 1, clearcoatRoughness: 0,
    envMap: env, envMapIntensity: 2, depthWrite: false,
  });
  // tail-lamp lenses: deep red polycarbonate with fine optic ridges moulded inside (about 2.5 mm pitch)
  const tail = micro(new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0.42, 0.0, 0.012), roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02, transparent: true, opacity: 0.88,
    emissive: new THREE.Color(1, 0.02, 0.012), emissiveIntensity: 0.32, envMap: env, envMapIntensity: 1.4,
  }), unit, 'optics', `
    float f = 400.0;
    vec2 q = p.xy * f + vec2(0.0, step(0.5, fract(p.x * f * 0.5)) * 0.5);
    rzH = (abs(sin(q.x * 3.14159)) * abs(sin(q.y * 3.14159)) - 0.4) * 0.00012 * rzVis(p, f);
    rzTint = vec3(mix(1.0, 0.8 + 0.4 * abs(sin(q.x * 3.14159)), rzVis(p, f)));`);
  const rim = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0c, metalness: 0.35, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.04, envMap: env, envMapIntensity: 1.2 });
  const hub = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, metalness: 0.85, roughness: 0.38, envMap: env });
  const cap = new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 1, roughness: 0.2, envMap: env });
  const disc = discMaterial(env);
  // calipers: high-temperature paint over a cast body, which shows through as a faint grain
  const caliper = micro(new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.62, 0.03, 0.02), roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.1, envMap: env }), unit, 'cast', `
    float f = 900.0;
    rzH = (vnoise3(p * f) - 0.5) * 0.00003 * rzVis(p, f);`);
  const plate = new THREE.MeshStandardMaterial({ map: plateTexture(), roughness: 0.35, metalness: 0.1, envMap: env, envMapIntensity: 0.6 });
  const carbonBody = carbonMaterial(env, unit);

  // the cabin: grained leather with perforated inserts on the seats, brushed aluminium, piano-black trim, red accents
  const seats = { uSeatMin: { type: 'vec3', value: new THREE.Vector3(1e9, 1e9, 1e9) }, uSeatMax: { type: 'vec3', value: new THREE.Vector3(-1e9, -1e9, -1e9) } };
  const leather = micro(new THREE.MeshPhysicalMaterial({ color: 0x18181a, roughness: 0.6, sheen: 0.35, sheenRoughness: 0.6, sheenColor: 0x3a3a3e, envMap: env, envMapIntensity: 0.5 }), unit, 'leather', `
    // grain: two octaves of pebbled relief, about 1 mm
    float g = vnoise3(p * 1100.0) * 0.6 + vnoise3(p * 2600.0) * 0.4;
    rzH = (g - 0.5) * 0.00005 * rzVis(p, 1100.0);
    rzRough = (g - 0.5) * 0.12;
    // perforated inserts on the seats: a 4 mm grid of 1.2 mm holes on the plane the surface faces
    vec3 an = abs(n);
    vec2 q = (an.y > max(an.x, an.z) ? p.xz : (an.x > an.z ? p.zy : p.xy)) / 0.004;
    float hole = (1.0 - smoothstep(0.12, 0.17, length(fract(q) - 0.5))) * rzVis(p, 250.0);
    vec3 o = vObjPos;
    hole *= step(uSeatMin.x, o.x) * step(o.x, uSeatMax.x) * step(uSeatMin.y, o.y) * step(o.y, uSeatMax.y) * step(uSeatMin.z, o.z) * step(o.z, uSeatMax.z);
    rzTint = vec3(1.0 - 0.75 * hole);
    rzRough += 0.3 * hole;`, seats);
  // brushed aluminium: fine streaks along the length of the part
  const aluminium = micro(new THREE.MeshPhysicalMaterial({ color: 0xb8bcc2, metalness: 1, roughness: 0.3, envMap: env, envMapIntensity: 1 }), unit, 'brushed', `
    float s = vnoise3(vec3(p.x * 40.0, p.y * 4000.0, p.z * 4000.0));
    rzRough = (s - 0.5) * 0.22 * rzVis(p, 4000.0);
    rzH = (s - 0.5) * 0.000006 * rzVis(p, 4000.0);`);
  const pianoBlack = new THREE.MeshPhysicalMaterial({ color: 0x050506, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03, envMap: env, envMapIntensity: 1.1 });
  const redAccent = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.32, 0.02, 0.02), roughness: 0.5, sheen: 0.3, sheenColor: 0x502020, envMap: env, envMapIntensity: 0.5 });

  // exterior materials fade out in the x-ray view; shared model materials get an exterior copy for that
  const dissolve = { value: 0 };
  for (const m of [paint, trim, windows, tail, plate, carbonBody]) addDissolve(m, dissolve);
  const trimInside = trim.clone();
  const exteriorCopies = new Map();
  const exterior = m => {
    if (!exteriorCopies.has(m)) exteriorCopies.set(m, addDissolve(m.clone(), dissolve));
    return exteriorCopies.get(m);
  };

  // the seats' box (front seats and rear bench), in the interior mesh's own units, for the perforated inserts
  const seatZone = o => {
    const inv = o.matrixWorld.clone().invert();
    const box = new THREE.Box3(new THREE.Vector3(-1.5, 0.42, -0.74), new THREE.Vector3(-0.1, 1.3, 0.74)).applyMatrix4(inv);
    seats.uSeatMin.value.copy(box.min); seats.uSeatMax.value.copy(box.max);
  };
  const extras = new THREE.Group();
  const parts = {};
  const exteriorMeshes = [];
  let headlights = { colour: new THREE.Color(1, 0.97, 0.92), set() {} };
  model.traverse(o => {
    const part = partOf(o);
    if (part && !parts[part]) parts[part] = model.getObjectByName('rz_' + part);
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    const outside = onBody(o) && part !== 'interior';
    if (outside) exteriorMeshes.push(o);
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const out = mats.map(m => {
      const n = m.name;
      if (onBrake(o)) return caliper;
      if (onWheel(o)) {
        if (n === 'wire_040040040') {
          // which local face of this tyre points away from the car
          const axis = new THREE.Vector3(0, 1, 0).transformDirection(o.matrixWorld);
          const centre = o.getWorldPosition(new THREE.Vector3());
          return tyreMaterial(env, Math.sign(axis.z * Math.sign(centre.z || 1)) || 1, unit);
        }
        if (n === 'wire_007007007') return rim;
        if (n === 'wire_154154154') return disc;
        if (n === 'wire_176026026') return cap;
        return hub;
      }
      if (part === 'interior') {
        if (n === 'wire_040040040') { seatZone(o); return leather; }
        if (n === 'wire_216216216') return aluminium;
        if (n === 'wire_007007007') return pianoBlack;
        if (n === 'wire_255000000') return redAccent;
      }
      if (onBody(o)) {
        if (n === 'wire_176026026') {
          if (['bonnet', 'roof', 'mirrors', 'lip'].includes(part)) o.userData.paintSlot = true;   // can turn carbon
          return paint;
        }
        if (n === 'wire_216216216') return outside ? trim : trimInside;
        if (n === 'wire_255000000') { o.castShadow = false; return tail; }
        if (n === 'plate x' || n === 'plate_x') { plateUVs(o); return plate; }
        if (n === 'wire_255255255') {
          o.castShadow = false;
          const split = splitHeadlightLenses(o, frontX);
          if (split) {
            const lensMesh = new THREE.Mesh(split.geometry, lensGlass);
            lensMesh.matrixAutoUpdate = false;
            lensMesh.matrix.copy(o.matrixWorld);
            extras.add(lensMesh);
            headlights = headlightUnits(split.boxes, new THREE.Color(1, 0.97, 0.92));
            extras.add(headlights.group);
          }
          return windows;
        }
      }
      m.envMap = env;
      return outside ? exterior(m) : m;
    });
    o.material = Array.isArray(o.material) ? out : out[0];
  });
  return {
    extras,   // world-space additions (clear lenses, projectors, beams): add to the scene as-is
    parts,    // rz_* part nodes by name (shell, bonnet, roof, mirrors, lip, wing, tip, interior)
    exteriorMeshes,
    headlights,
    dissolve,
    materials: { paint, trim, windows, lensGlass, tail, rim, caliper, carbonBody },
  };
}
