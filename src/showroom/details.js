// Realistic detail for the 3D Evo, added at runtime (the model file has no textures and is left untouched):
// metallic-flake paint under an orange-peel clear coat, tyre sidewall lettering and tread grooves, machined
// discs and red calipers, gloss black rims, clear headlight lenses with lit projectors and real beams,
// glossy tail-light lenses and an RZER number plate.
//
// The model shares materials between parts (the tyre rubber is also the interior, the caliper colour is also
// the black trim), so parts are told apart by the node they hang under: 'car body', 'w1'-'w4', 'b1'-'b4'.
import * as THREE from 'three';

const NOISE = /* glsl */`
float h13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
vec3 h33(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
float vnoise3(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h13(i), h13(i + vec3(1, 0, 0)), f.x), mix(h13(i + vec3(0, 1, 0)), h13(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h13(i + vec3(0, 0, 1)), h13(i + vec3(1, 0, 1)), f.x), mix(h13(i + vec3(0, 1, 1)), h13(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}`;

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
    sh.uniforms.uPeel = { value: 1 / (unitsPerMetre * 0.015) };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uFlake;\nuniform float uPeel;')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          // flakes only show where a flake is bigger than about a pixel; further off they average out to
          // smooth metallic paint, as real paint does, instead of aliasing into noise
          vec3 fp = vObjPos * uFlake;
          float flakeVis = 1.0 - smoothstep(0.35, 1.2, length(fwidth(fp)));
          normal = normalize(normal + (h33(floor(fp)) - 0.5) * 0.22 * flakeVis);
        }`)
      .replace('#include <clearcoat_normal_fragment_maps>', `#include <clearcoat_normal_fragment_maps>
        vec3 peel = vec3(vnoise3(vObjPos * uPeel), vnoise3(vObjPos * uPeel + 17.3), vnoise3(vObjPos * uPeel + 41.9)) - 0.5;
        clearcoatNormal = normalize(clearcoatNormal + peel * 0.012);`);
  };
  return m;
}

// ---------------------------------------------------------------- tyres
function tyreLettering() {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.textAlign = 'center';
  g.font = '800 70px Arial, Helvetica, sans-serif';
  for (const [text, x] of [['RZER PERFORMANCE', 0.2], ['265/35 R18 97Y', 0.55], ['RADIAL TUBELESS', 0.84]]) g.fillText(text, x * c.width, 68);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
// The tyre's axis is its local y. Lettering goes on the outer sidewall only (uOutward picks the face).
function tyreMaterial(env, letters, outward) {
  const m = new THREE.MeshPhysicalMaterial({ color: 0x121214, roughness: 0.86, metalness: 0, envMap: env, envMapIntensity: 0.45 });
  m.onBeforeCompile = sh => {
    objectSpace(sh);
    sh.uniforms.tLetters = { value: letters };
    sh.uniforms.uOutward = { value: outward };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D tLetters;\nuniform float uOutward;\nfloat tyreLetter;\nfloat tyreGroove;\nfloat tyreSide;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec3 n = normalize(vObjNormal);
          float r = length(vObjPos.xz);
          float a = atan(vObjPos.z, vObjPos.x);
          tyreSide = step(0.5, abs(n.y));
          tyreLetter = 0.0; tyreGroove = 0.0;
          if (tyreSide > 0.5 && vObjPos.y * uOutward > 0.0) {
            vec2 luv = vec2(a / 6.2831853 * 2.0 * uOutward, (r - 10.95) / 1.35);
            if (luv.y > 0.0 && luv.y < 1.0) tyreLetter = texture2D(tLetters, luv).r;
            tyreLetter = max(tyreLetter, 0.45 * (1.0 - smoothstep(0.03, 0.09, abs(r - 10.75))));   // rim-protector ring
          }
          if (tyreSide < 0.5) {
            float w = abs(vObjPos.y);
            tyreGroove = max(1.0 - smoothstep(0.12, 0.22, abs(w - 1.3)), 1.0 - smoothstep(0.1, 0.2, abs(w - 3.7)));
            float sipe = 1.0 - smoothstep(0.02, 0.07, abs(fract(a * 30.0) - 0.5));
            tyreGroove = max(tyreGroove, sipe * smoothstep(3.9, 4.4, w) * 0.8);
          }
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.17, 0.17, 0.18), tyreLetter * 0.85);
          diffuseColor.rgb *= 1.0 - 0.75 * tyreGroove;
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = tyreSide > 0.5 ? mix(0.64, 0.48, tyreLetter) : mix(0.88, 1.0, tyreGroove);`);
  };
  return m;
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
        diffuseColor.rgb *= mix(0.8, 1.0, discRing) * mix(0.5, 1.0, smoothstep(3.0, 4.2, discR));   // darker hat in the middle`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(0.3, 0.52, discRing);`);
  };
  return m;
}

// ---------------------------------------------------------------- number plate
function plateTexture() {
  const c = document.createElement('canvas');
  c.width = 1040; c.height = 224;
  const g = c.getContext('2d');
  g.fillStyle = '#050505'; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = '#d8d8d8'; g.lineWidth = 7; g.strokeRect(14, 14, c.width - 28, c.height - 28);
  g.fillStyle = '#ececec'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '700 150px Arial, Helvetica, sans-serif';
  g.fillText('RZER', c.width / 2, c.height / 2 + 6);
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
// Two projectors per side, each a glowing lens inside a halo ring, plus a real beam onto the floor.
function headlightUnits(boxes, colour) {
  const group = new THREE.Group();
  const glow = new THREE.MeshBasicMaterial({ color: colour.clone().multiplyScalar(7), toneMapped: true });
  const ring = new THREE.MeshBasicMaterial({ color: colour.clone().multiplyScalar(4) });
  for (const box of boxes) {
    const centre = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
    for (const k of [-0.22, 0.22]) {
      const p = new THREE.Vector3(centre.x - 0.035, centre.y - size.y * 0.05, centre.z + k * size.z);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.024, 32), glow);
      lens.position.copy(p); lens.rotation.y = Math.PI / 2; group.add(lens);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.0045, 8, 48), ring);
      halo.position.copy(p); halo.rotation.y = Math.PI / 2; group.add(halo);
    }
    const beam = new THREE.SpotLight(colour, 28, 12, 0.42, 0.75, 2);
    beam.position.set(centre.x - 0.02, centre.y, centre.z);
    beam.target.position.set(centre.x + 4, 0, centre.z * 1.25);
    group.add(beam, beam.target);
  }
  return group;
}

// ---------------------------------------------------------------- dress the whole car
export function dressCar(model, { env, paintColor, unitsPerMetre, frontX }) {
  const parentNamed = (o, test) => { for (let p = o; p; p = p.parent) if (test(p.name)) return true; return false; };
  // GLTFLoader renames nodes (spaces become underscores), so 'car body' arrives as 'car_body'
  const onBody = o => parentNamed(o, n => n.replace(/[\s.]+/g, '_') === 'car_body');
  const onWheel = o => parentNamed(o, n => /^w[1-4]$/.test(n));
  const onBrake = o => parentNamed(o, n => /^b[1-4]$/.test(n));

  const paint = paintMaterial(paintColor, env, unitsPerMetre);
  const trim = new THREE.MeshPhysicalMaterial({ color: 0x060607, metalness: 0.05, roughness: 0.55, envMap: env, envMapIntensity: 0.6 });
  const windows = new THREE.MeshPhysicalMaterial({
    color: 0x0a0c0e, roughness: 0.02, transparent: true, opacity: 0.8, clearcoat: 1, clearcoatRoughness: 0,
    envMap: env, envMapIntensity: 1.6, depthWrite: false,
  });
  const lensGlass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.01, transparent: true, opacity: 0.16, clearcoat: 1, clearcoatRoughness: 0,
    envMap: env, envMapIntensity: 2, depthWrite: false,
  });
  const tail = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0.42, 0.0, 0.012), roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02, transparent: true, opacity: 0.88,
    emissive: new THREE.Color(1, 0.02, 0.012), emissiveIntensity: 0.32, envMap: env, envMapIntensity: 1.4,
  });
  const rim = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0c, metalness: 0.35, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.04, envMap: env, envMapIntensity: 1.2 });
  const hub = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, metalness: 0.85, roughness: 0.38, envMap: env });
  const cap = new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 1, roughness: 0.2, envMap: env });
  const disc = discMaterial(env);
  const caliper = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.62, 0.03, 0.02), roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.1, envMap: env });
  const plate = new THREE.MeshStandardMaterial({ map: plateTexture(), roughness: 0.35, metalness: 0.1, envMap: env, envMapIntensity: 0.6 });
  const letters = tyreLettering();

  const extras = new THREE.Group();
  model.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const out = mats.map(m => {
      const n = m.name;
      if (onBrake(o)) return caliper;
      if (onWheel(o)) {
        if (n === 'wire_040040040') {
          // which local face of this tyre points away from the car
          const axis = new THREE.Vector3(0, 1, 0).transformDirection(o.matrixWorld);
          const centre = o.getWorldPosition(new THREE.Vector3());
          return tyreMaterial(env, letters, Math.sign(axis.z * Math.sign(centre.z || 1)) || 1);
        }
        if (n === 'wire_007007007') return rim;
        if (n === 'wire_154154154') return disc;
        if (n === 'wire_176026026') return cap;
        return hub;
      }
      if (onBody(o)) {
        if (n === 'wire_176026026') return paint;
        if (n === 'wire_216216216') return trim;
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
            extras.add(headlightUnits(split.boxes, new THREE.Color(1, 0.97, 0.92)));
          }
          return windows;
        }
      }
      m.envMap = env;
      return m;
    });
    o.material = Array.isArray(o.material) ? out : out[0];
  });
  return extras;   // world-space additions (clear lenses, projectors, beams): add to the scene as-is
}
