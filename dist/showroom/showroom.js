// Photoreal showroom: the car alone under one overhead spotlight in a dimmed underground car park.
// World: metres, y up, car front at +x, floor at y = 0 (same as the old shader scene).
//
//   startShowroom({ canvas, interactive, onReady, onError }) -> { setActive(on), ready, credit }
// Used by the hero (non-interactive, slow sway, rendered only while visible) and by dist/showroom/
// (drag to orbit, slow turntable). Asset paths are resolved from this file, so any page can use it.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ---------------------------------------------------------------- the car
// Material names come from the model. The paint is recoloured only on meshes under `paintNode`, because the
// same material is also used on the wheels. The front is found as the side opposite the tail-light lenses.
const CAR = {
  url: new URL('../assets/models/lancer-evolution.glb', import.meta.url).href,
  length: 4.49,                        // Evo IX: 4,490 mm
  paintNode: 'car body',
  paint: ['wire_176026026'],
  glass: ['wire_255255255'],
  tailLights: ['wire_255000000'],
  rims: ['wire_154154154'],
  tyres: ['wire_040040040'],
  // CC BY 4.0 requires this credit wherever the model is shown
  credit: '<a href="https://sketchfab.com/3d-models/mitsubishi-lancer-evolution-b8087424eb45478a80a32428396f58a9">Mitsubishi Lancer Evolution</a> 3D model by <a href="https://sketchfab.com/3dcarsforyou">3DCars4U</a>, licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.',
};
const PAINT = { color: 0xc4c8cd, metalness: 0.9, roughness: 0.32 };   // liquid silver, under clear coat

const CEIL = 3.35;
const SPOT_Y = 3.25;
export const credit = CAR.credit;

export function startShowroom({ canvas, interactive = false, onReady = () => {}, onError = () => {} }) {
const size = () => [Math.max(2, canvas.clientWidth), Math.max(2, canvas.clientHeight)];

// ---------------------------------------------------------------- renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
const DPR = Math.min(window.devicePixelRatio || 1, 1.75);
renderer.setPixelRatio(DPR);
renderer.setSize(...size(), false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.05);

// ---------------------------------------------------------------- reflections: a small HDR "car park" for the paint to mirror
function environment() {
  const env = new THREE.Scene();
  const lift = -0.8;   // PMREM looks from the origin, so place the room as if seen from 0.8 m above the floor
  const basic = (r, g, b, side) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), side: side || THREE.FrontSide });
  const room = new THREE.Mesh(new THREE.BoxGeometry(44, CEIL, 30), basic(0.006, 0.006, 0.007, THREE.BackSide));
  room.position.y = CEIL / 2 + lift;
  env.add(room);
  // the spotlight lens straight above the car, and its soft halo: the bright highlight on roof and bonnet
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.42, 48), basic(28, 27, 25));
  lens.rotation.x = Math.PI / 2; lens.position.y = SPOT_Y + lift; env.add(lens);
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.42, 1.8, 48), basic(0.5, 0.48, 0.46));
  halo.rotation.x = Math.PI / 2; halo.position.y = SPOT_Y + 0.02 + lift; env.add(halo);
  // dimmed fluorescent tube rows
  const tubeGeo = new THREE.BoxGeometry(0.1, 0.04, 1.5);
  const tubeMat = basic(2.2, 2.15, 2.05);
  for (let x = -21; x <= 21; x += 3) for (const z of [-5.25, -1.75, 1.75, 5.25]) {
    if (Math.abs(x) < 2 && Math.abs(z) < 2) continue;
    const t = new THREE.Mesh(tubeGeo, tubeMat); t.position.set(x, CEIL - 0.05 + lift, z); env.add(t);
  }
  // the lit floor pool under the spot (reflected low on the doors) and faint glow from the side bays
  const pool = new THREE.Mesh(new THREE.CircleGeometry(2.6, 48), basic(0.32, 0.31, 0.3));
  pool.rotation.x = -Math.PI / 2; pool.position.y = lift + 0.01; env.add(pool);
  for (const s of [-1, 1]) {
    const bay = new THREE.Mesh(new THREE.PlaneGeometry(40, 1.6), basic(0.05, 0.05, 0.055, THREE.DoubleSide));
    bay.position.set(0, 0.9 + lift, s * 14.5); env.add(bay);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(env, 0.02).texture;
  pmrem.dispose();
  return tex;
}
// Only the car gets this map (per material, below). scene.environment would light the floor and walls evenly too,
// because it ignores each material's envMapIntensity; the car park must stay dark outside the spotlight.
const ENV = environment();

// ---------------------------------------------------------------- canvas textures
function canvasTexture(size, draw, repeat, srgb = true) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
let seed = 7;
const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function concrete(g, n) {
  g.fillStyle = '#7c7d7e'; g.fillRect(0, 0, n, n);
  // tileable blotches: each one drawn at its wrapped copies too
  for (let k = 0; k < 220; k++) {
    const x = rand() * n, y = rand() * n, r = 14 + rand() * 110, light = rand() < 0.45;
    const a = 0.025 + rand() * 0.06;
    for (const dx of [-n, 0, n]) for (const dy of [-n, 0, n]) {
      const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      gr.addColorStop(0, light ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 1.4})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r);
    }
  }
  const img = g.getImageData(0, 0, n, n), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const v = (rand() - 0.5) * 22; d[i] += v; d[i + 1] += v; d[i + 2] += v; }
  g.putImageData(img, 0, 0);
}
function hazard(g, n) {
  g.fillStyle = '#0d0d0d'; g.fillRect(0, 0, n, n);
  g.fillStyle = '#c9a018';
  for (let k = -n; k < 2 * n; k += n / 4) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + n / 8, 0); g.lineTo(k + n / 8 - n, n); g.lineTo(k - n, n); g.fill(); }
}

// ---------------------------------------------------------------- floor: polished concrete with a soft planar reflection
const FLOOR = 60;
const reflector = new Reflector(new THREE.PlaneGeometry(FLOOR, FLOOR), {
  textureWidth: Math.round(size()[0] * DPR * 0.5), textureHeight: Math.round(size()[1] * DPR * 0.5), clipBias: 0.003,
});
reflector.rotation.x = -Math.PI / 2;
reflector.material.colorWrite = false;   // only here to render the mirror texture; the floor shows it
reflector.material.depthWrite = false;
reflector.renderOrder = -1;
scene.add(reflector);

const concreteMap = canvasTexture(1024, concrete, FLOOR / 5);
// the floor takes almost no light from the reflection environment: the spotlight alone lights it
const floorMat = new THREE.MeshStandardMaterial({ map: concreteMap, color: 0x767676, roughness: 0.55, metalness: 0 });
floorMat.onBeforeCompile = shader => {
  floorMat.userData.shader = shader;
  shader.uniforms.tReflect = { value: reflector.getRenderTarget().texture };
  shader.uniforms.reflMatrix = reflector.material.uniforms.textureMatrix;
  shader.uniforms.reflStrength = { value: 0.6 };
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nuniform mat4 reflMatrix;\nvarying vec4 vReflUv;')
    .replace('#include <project_vertex>', '#include <project_vertex>\nvReflUv = reflMatrix * vec4(transformed, 1.0);');
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nuniform sampler2D tReflect;\nuniform float reflStrength;\nvarying vec4 vReflUv;')
    .replace('#include <opaque_fragment>', `
      {
        // a 13-tap blur that widens with distance: polished, not mirror-perfect concrete
        vec2 ruv = vReflUv.xy / vReflUv.w;
        float spread = 0.0018 + 0.0035 * clamp(length(vViewPosition) / 12.0, 0.0, 1.0);
        vec3 refl = texture2D(tReflect, ruv).rgb * 0.2;
        for (int i = 0; i < 12; i++) {
          float a = float(i) * 0.5236;
          float r = (i < 6 ? 1.0 : 2.2) * spread;
          refl += texture2D(tReflect, ruv + vec2(cos(a), sin(a)) * r).rgb * (i < 6 ? 0.08 : 0.053);
        }
        float facing = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
        float fres = 0.12 + 0.55 * pow(1.0 - facing, 3.0);
        float wear = 0.6 + 0.4 * diffuseColor.g;   // darker patches read as rougher, less reflective
        outgoingLight += refl * reflStrength * fres * wear;
      }
      #include <opaque_fragment>`);
};
const floor = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR, FLOOR), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// painted bay lines and the lane edge
const lineMat = new THREE.MeshStandardMaterial({ color: 0xb8b8b4, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 });
const lineGeo = new THREE.PlaneGeometry(1, 1);
const lines = [];
for (let x = -25; x <= 25; x += 2.5) for (const s of [-1, 1]) lines.push([x, s * 4.9, 0.1, 3.2]);
for (let x = -25; x <= 25; x += 3) for (const s of [-1, 1]) lines.push([x, s * 3.2, 1.6, 0.1]);
const lineMesh = new THREE.InstancedMesh(lineGeo, lineMat, lines.length);
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
lines.forEach(([x, z, sx, sz], i) => lineMesh.setMatrixAt(i, m4.compose(new THREE.Vector3(x, 0.002, z), q, new THREE.Vector3(sx, sz, 1))));
lineMesh.receiveShadow = true;
scene.add(lineMesh);

// ---------------------------------------------------------------- the car park around it
const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR, FLOOR), new THREE.MeshStandardMaterial({ color: 0x1c1c1d, roughness: 0.95, emissive: 0x050505 }));
ceiling.rotation.x = Math.PI / 2; ceiling.position.y = CEIL; scene.add(ceiling);

const pillarMat = new THREE.MeshStandardMaterial({ map: canvasTexture(512, concrete, 1), color: 0x6e6e6e, roughness: 0.85, emissive: 0x161616 });
const sleeveMat = new THREE.MeshStandardMaterial({ map: canvasTexture(256, hazard, 2), roughness: 0.7, emissive: 0x1a140a });
for (let x = -22.5; x <= 22.5; x += 7.5) for (const z of [-6.6, 6.6]) {
  const p = new THREE.Mesh(new THREE.BoxGeometry(0.62, CEIL, 0.62), pillarMat);
  p.position.set(x, CEIL / 2, z); p.receiveShadow = true; scene.add(p);
  const s = new THREE.Mesh(new THREE.BoxGeometry(0.66, 1.0, 0.66), sleeveMat);
  s.position.set(x, 0.5, z); scene.add(s);
}

// dimmed tube lights: the "surrounding lights turned low" of a showroom
const tubes = [];
for (let x = -21; x <= 21; x += 3) for (const z of [-5.25, -1.75, 1.75, 5.25]) if (!(Math.abs(x) < 2 && Math.abs(z) < 2)) tubes.push([x, z]);
const tubeMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.04, 1.5), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.56, 1.5) }), tubes.length);
tubes.forEach(([x, z], i) => tubeMesh.setMatrixAt(i, m4.makeTranslation(x, CEIL - 0.03, z)));
scene.add(tubeMesh);

// ---------------------------------------------------------------- the spotlight
// wide enough to throw a pool of light on the floor around the whole car (about 3.2 m radius)
const spot = new THREE.SpotLight(0xfff3e6, 110, 14, 0.78, 0.45, 2);
spot.position.set(0, SPOT_Y, 0);
spot.target.position.set(0, 0, 0);
spot.castShadow = true;
spot.shadow.mapSize.set(2048, 2048);
spot.shadow.camera.near = 0.5;
spot.shadow.camera.far = 6;
spot.shadow.bias = -0.0002;
spot.shadow.normalBias = 0.02;
scene.add(spot, spot.target);
// the dimmed tubes: just enough to keep the pillars, bay lines and ceiling readable in the dark
scene.add(new THREE.HemisphereLight(0x9aa4b0, 0x000000, 0.07));

// the fixture and its visible beam in the haze
const fixture = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.22, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, metalness: 0.8, side: THREE.DoubleSide }));
fixture.position.y = SPOT_Y + 0.07; scene.add(fixture);
const lensMesh = new THREE.Mesh(new THREE.CircleGeometry(0.2, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 8.8, 8.4) }));
lensMesh.rotation.x = Math.PI / 2; lensMesh.position.y = SPOT_Y - 0.03; scene.add(lensMesh);
const beam = new THREE.Mesh(
  new THREE.CylinderGeometry(0.18, 3.1, SPOT_Y, 64, 1, true),
  new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(1, 0.96, 0.9) }, uStrength: { value: 0.045 }, uTop: { value: SPOT_Y } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vH;
      void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vH = wp.y; vec4 mv = viewMatrix * wp;
        vV = normalize(-mv.xyz); vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uStrength; uniform float uTop; varying vec3 vN; varying vec3 vV; varying float vH;
      void main() { float facing = pow(abs(dot(normalize(vN), normalize(vV))), 2.2);
        float h = clamp(vH / uTop, 0.0, 1.0);
        float a = uStrength * facing * (0.3 + 0.7 * h) * smoothstep(0.0, 0.3, h);
        gl_FragColor = vec4(uColor * a, 1.0); }`,
  }),
);
beam.position.y = SPOT_Y / 2;
scene.add(beam);

// ---------------------------------------------------------------- camera: front three-quarter from the car's left, car right of the copy
const camera = new THREE.PerspectiveCamera(30, size()[0] / size()[1], 0.1, 80);
const HOME = { pos: new THREE.Vector3(5.75, 1.2, -3.95), target: new THREE.Vector3(0.1, 0.55, 0.05) };
camera.position.copy(HOME.pos);
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
let controls = null;
if (interactive) {
  controls = new OrbitControls(camera, canvas);
  controls.target.copy(HOME.target);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 3.2;
  controls.maxDistance = 9;
  controls.minPolarAngle = 0.9;
  controls.maxPolarAngle = 1.52;
  controls.autoRotate = !still;
  controls.autoRotateSpeed = 0.35;   // one turn in about three minutes
  controls.update();
} else {
  camera.lookAt(HOME.target);
}
// hero: a slow sway either side of the front three-quarter, so the car stays beside the logo
const sway = new THREE.Spherical().setFromVector3(HOME.pos.clone().sub(HOME.target));
function swayCamera(t) {
  const s = sway.clone();
  s.theta += Math.sin(t * Math.PI * 2 / 28) * 0.16;
  s.phi += Math.sin(t * Math.PI * 2 / 37) * 0.025;
  camera.position.setFromSpherical(s).add(HOME.target);
  camera.lookAt(HOME.target);
}

function frame() {
  const [w, h] = size(), portrait = w / h < 0.9;
  camera.aspect = w / h;
  camera.fov = portrait ? 52 : 30;
  // lens shift: move the car right of the logo on wide screens
  if (portrait) camera.clearViewOffset(); else camera.setViewOffset(w, h, -w * 0.2, h * 0.05, w, h);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
}

// ---------------------------------------------------------------- post: bloom, tone mapping, grain and vignette
const composer = new EffectComposer(renderer);
composer.setPixelRatio(DPR);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(...size()), 0.22, 0.5, 1.0));
composer.addPass(new OutputPass());
const grain = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; varying vec2 vUv;
    float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    void main() { vec3 c = texture2D(tDiffuse, vUv).rgb;
      vec2 q = vUv; c *= 0.6 + 0.4 * pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.22);
      c += (hash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * 0.02;
      gl_FragColor = vec4(c, 1.0); }`,
});
composer.addPass(grain);
frame();
new ResizeObserver(frame).observe(canvas);

// ---------------------------------------------------------------- load the car
const names = m => (Array.isArray(m) ? m : [m]);
function prepareCar(model) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const centre = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  // front = away from the tail-light lenses; fall back to the long axis
  const rear = new THREE.Box3();
  model.traverse(o => { if (o.isMesh && names(o.material).some(m => CAR.tailLights.includes(m.name))) rear.expandByObject(o); });
  const dir = rear.isEmpty()
    ? new THREE.Vector3(size.x >= size.z ? 1 : 0, 0, size.x >= size.z ? 0 : 1)
    : centre.clone().sub(rear.getCenter(new THREE.Vector3()));
  const yaw = Math.atan2(dir.z, dir.x);   // turns that direction onto +x
  const car = new THREE.Group();
  model.position.sub(centre);
  car.add(model);
  car.rotation.y = yaw;
  car.scale.setScalar(CAR.length / Math.max(size.x, size.z));
  car.updateMatrixWorld(true);
  car.position.y = -new THREE.Box3().setFromObject(car).min.y;

  // physically based materials: clear-coated metallic paint, reflective tinted glass, satin rims, rubber
  const paint = new THREE.MeshPhysicalMaterial({
    color: PAINT.color, metalness: PAINT.metalness, roughness: PAINT.roughness,
    clearcoat: 1, clearcoatRoughness: 0.03, envMap: ENV, envMapIntensity: 1.2,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x0a0c0e, metalness: 0, roughness: 0.02, transparent: true, opacity: 0.78,
    clearcoat: 1, clearcoatRoughness: 0, envMap: ENV, envMapIntensity: 1.6, depthWrite: false,
  });
  const underBody = o => { for (let p = o; p; p = p.parent) if (p.name === CAR.paintNode) return true; return false; };
  model.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    const list = names(o.material).map(m => {
      if (CAR.paint.includes(m.name) && underBody(o)) return paint;
      if (CAR.glass.includes(m.name)) { o.castShadow = false; return glass; }
      if (CAR.rims.includes(m.name)) { m.color.setScalar(0.035); m.metalness = 0.9; m.roughness = 0.28; }   // gloss black wheels, like the build
      if (CAR.tyres.includes(m.name)) { m.roughness = 0.88; m.metalness = 0; }
      if (CAR.tailLights.includes(m.name)) { m.emissive = new THREE.Color(0.9, 0.03, 0.02); m.emissiveIntensity = 0.6; }
      m.envMap = ENV;
      m.envMapIntensity = 1;
      return m;
    });
    o.material = Array.isArray(o.material) ? list : list[0];
  });

  // soft contact shadow so the tyres sit on the floor
  const shadowTex = canvasTexture(256, (g, n) => {
    const gr = g.createRadialGradient(n / 2, n / 2, n * 0.18, n / 2, n / 2, n / 2);
    gr.addColorStop(0, 'rgba(0,0,0,0.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, n, n);
  }, 1, false);
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(CAR.length * 1.12, CAR.length * 0.5), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  contact.rotation.x = -Math.PI / 2; contact.position.y = 0.004;
  scene.add(contact);
  return car;
}

const api = { ready: false, credit: CAR.credit, setActive, camera, controls, spot, scene, renderer, floorMat, reflector, beam, composer };
const draco = new DRACOLoader().setDecoderPath(new URL('../vendor/three/addons/libs/draco/gltf/', import.meta.url).href);
new GLTFLoader().setDRACOLoader(draco).load(CAR.url, gltf => {
  scene.add(prepareCar(gltf.scene));
  composer.render();   // compile shaders now, not on the first visible frame
  api.ready = true;
  onReady(api);
}, undefined, err => {
  console.error('[showroom]', err);
  onError(err);
});

// ---------------------------------------------------------------- loop
const clock = new THREE.Clock();
let time = 0;
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  time += still ? 0 : dt;
  if (controls) controls.update(dt); else swayCamera(time);
  grain.uniforms.uTime.value += dt;
  composer.render();
}
// render only while someone can see it
function setActive(on) {
  renderer.setAnimationLoop(on ? tick : null);
  if (on) clock.getDelta();
}
setActive(interactive);
return api;
}
