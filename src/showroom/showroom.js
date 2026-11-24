// The 3D Evo as a photoreal product asset: isolated on a plain solid background in neutral, even studio light.
// World: metres, y up, car front at +x, floor at y = 0 (same as the old shader scene).
//
//   startShowroom({ canvas, interactive, external, onReady, onError }) -> api
//   - interactive: dist/showroom/ (drag to orbit, slow turntable, its own render loop)
//   - external:    the main page's scroll sections and configurator. app.js sets the camera (api.setView), the
//                  configurator values and view state (api.setState) and draws (api.render) from its own loop.
// Asset paths are resolved from this file, so any page can use it.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { dressCar } from './details.js';
import { buildAddons, buildInternals, carbonMaterial, carController, ghostMaterial, worldPoints } from './parts.js';

// ---------------------------------------------------------------- the car
// lancer-evolution-rzer.glb is the CC BY model with its body split into named parts (tools/split-model.py).
// The front is found as the side opposite the tail-light lenses.
const CAR = {
  url: new URL('../assets/models/lancer-evolution-rzer.glb', import.meta.url).href,
  length: 4.49,                        // Evo IX: 4,490 mm
  width: 1.77,                         // Evo IX: 1,770 mm (the model comes out about 5% wider; it is narrowed to this)
  bodyNode: 'car_body',              // GLTFLoader renames the node 'car body' to 'car_body'
  tailLights: ['wire_255000000'],   // used to find the front; the other parts are handled in details.js
  // CC BY 4.0 requires this credit wherever the model is shown
  credit: '<a href="https://sketchfab.com/3d-models/mitsubishi-lancer-evolution-b8087424eb45478a80a32428396f58a9">Mitsubishi Lancer Evolution</a> 3D model by <a href="https://sketchfab.com/3dcarsforyou">3DCars4U</a>, licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>, split into parts for this site.',
};
const PAINT = { color: 0xb9bdc3 };   // liquid silver (the full paint material is in details.js)
// what the preview shows: the factory car in silver with black wheels and red calipers
const PREVIEW_STATE = {
  uPaint: [0.62, 0.63, 0.65], uPaintRough: 0.2, uPaintMetal: 1, uRimCol: [0.008, 0.008, 0.009], uRimRough: 0.05, uRimMetal: 0,
  uCaliper: [0.55, 0.02, 0.015], uLip: 0, uSkirts: 0, uDiffuser: 0, uSpoiler: 1, uRide: 0, uExhaust: 0, uExFinish: 0,
  uDrl: [1, 0.97, 0.92], uTint: 0.6, uHood: 0, uRoof: 0, uMirror: 0, lights: 1, xray: 0,
};

export const credit = CAR.credit;

export function startShowroom({ canvas, interactive = false, external = false, onReady = () => {}, onError = () => {} }) {
const size = () => [Math.max(2, canvas.clientWidth), Math.max(2, canvas.clientHeight)];

// ---------------------------------------------------------------- renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
const DPR = Math.min(window.devicePixelRatio || 1, external ? 1.5 : 1.75);
let pixelScale = 1;
renderer.setPixelRatio(DPR);
renderer.setSize(...size(), false);
renderer.toneMapping = THREE.NeutralToneMapping;   // keeps the paint colours true
renderer.toneMappingExposure = 0.9;   // silver stays below white under the soft boxes
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;   // the car and the lights stand still: redraw the shadow only when the car changes
renderer.shadowMap.needsUpdate = true;

const scene = new THREE.Scene();

// ---------------------------------------------------------------- studio: neutral even light on a plain background
// The car is isolated on a plain solid background (dark, so the page's white copy stays readable) in soft, even
// studio light. There is no set and no visible floor: an invisible shadow catcher and a soft contact shadow keep
// the car on the ground.
scene.background = new THREE.Color(0x101113);

// reflections: a neutral studio for the paint to mirror, with a long soft box overhead, strip lights either side,
// front and rear fill panels and a dim floor. Set per car material (scene.environment ignores envMapIntensity).
function studioEnvironment() {
  const env = new THREE.Scene();
  const basic = (v, side) => new THREE.MeshBasicMaterial({ color: new THREE.Color(v, v, v), side: side || THREE.FrontSide });
  const room = new THREE.Mesh(new THREE.BoxGeometry(30, 12, 30), basic(0.03, THREE.BackSide));
  room.position.y = 5.4;   // PMREM looks from the origin: about the car's mid-height
  env.add(room);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), basic(0.018));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.6; env.add(floor);
  const panel = (w, h, v, pos, rot) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic(v, THREE.DoubleSide));
    m.position.set(...pos); m.rotation.set(...rot); env.add(m);
  };
  panel(7, 2.4, 3.0, [0, 4.2, 0], [Math.PI / 2, 0, 0]);                       // long soft box overhead
  for (const s of [-1, 1]) panel(9, 1.0, 1.5, [0, 1.5, s * 6.5], [0, 0, 0]);   // strip lights either side
  panel(4, 2.2, 0.8, [8, 1.3, 0], [0, -Math.PI / 2, 0]);                     // front fill
  panel(4, 2.2, 0.55, [-8, 1.3, 0], [0, Math.PI / 2, 0]);                    // rear fill
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(env, 0.03).texture;
  pmrem.dispose();
  return tex;
}
const ENV = studioEnvironment();

// direct light: a soft key that casts the car's shadow, fill, rim and top lights, and a neutral sky fill
const hemi = new THREE.HemisphereLight(0xf0f2f6, 0x141517, 0.5);
const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.position.set(3.2, 6.5, 3.6);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -3.6, right: 3.6, top: 3.6, bottom: -3.6, near: 2, far: 16 });
key.shadow.bias = -0.0003;
key.shadow.normalBias = 0.02;
key.shadow.radius = 6;
const fill = new THREE.DirectionalLight(0xf4f6ff, 0.6);
fill.position.set(-4, 3, -3.5);
const rim = new THREE.DirectionalLight(0xffffff, 0.8);
rim.position.set(-5, 4.5, 4);
const top = new THREE.DirectionalLight(0xffffff, 0.5);
top.position.set(0, 8, 0.01);
scene.add(hemi, key, fill, rim, top);
const KEY = key.intensity;

// the floor: invisible, it only takes the car's shadow
const catcher = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.45 }));
catcher.rotation.x = -Math.PI / 2;
catcher.receiveShadow = true;
scene.add(catcher);

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

// ---------------------------------------------------------------- camera
const camera = new THREE.PerspectiveCamera(30, size()[0] / size()[1], 0.1, 80);
const HOME = { pos: new THREE.Vector3(5.75, 1.2, -3.95), target: new THREE.Vector3(0.1, 0.55, 0.05) };
camera.position.copy(HOME.pos);
camera.lookAt(HOME.target);
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
}

// the page's camera: position, target, vertical fov and a lens shift in NDC (the old shader's uShift)
const view = { shift: [0, 0] };
function applyView() {
  const [w, h] = size();
  camera.aspect = w / h;
  if (external) camera.setViewOffset(w, h, -view.shift[0] * w / 2, view.shift[1] * h / 2, w, h);
  else if (w / h < 0.9) { camera.fov = 52; camera.clearViewOffset(); }
  else { camera.fov = 30; camera.setViewOffset(w, h, -w * 0.2, h * 0.05, w, h); }
  camera.updateProjectionMatrix();
}
function resize() {
  const [w, h] = size();
  renderer.setPixelRatio(DPR * pixelScale);
  renderer.setSize(w, h, false);
  composer.setPixelRatio(DPR * pixelScale);
  composer.setSize(w, h);
  applyView();
}

// ---------------------------------------------------------------- post: a little bloom on the lit headlights, tone mapping
const composer = new EffectComposer(renderer);
composer.setPixelRatio(DPR);
composer.addPass(new RenderPass(scene, camera));
// a safety net before the bloom: one invalid (NaN) pixel from any shader would otherwise be blurred over the frame
composer.addPass(new ShaderPass({
  uniforms: { tDiffuse: { value: null } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
    void main() { vec4 c = texture2D(tDiffuse, vUv); gl_FragColor = (any(isnan(c)) || any(isinf(c))) ? vec4(0.0, 0.0, 0.0, 1.0) : c; }`,
}));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(...size()), 0.14, 0.4, 1.0));
composer.addPass(new OutputPass());
resize();
new ResizeObserver(resize).observe(canvas);

// ---------------------------------------------------------------- load the car
const names = m => (Array.isArray(m) ? m : [m]);
const under = (o, name) => { for (let p = o; p; p = p.parent) if (p.name === name) return true; return false; };
let controller = null;
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
  // accurate proportions: narrow the body (model x is the car's width) to the real width, which is measured across
  // the wheel arches, below the mirrors
  const shell = model.getObjectByName('rz_shell');
  if (shell) {
    const floor = new THREE.Box3().setFromObject(car).min.y;
    const below = worldPoints(shell).filter(p => p.y - floor < 0.8);
    const w = Math.max(...below.map(p => p.z)) - Math.min(...below.map(p => p.z));
    if (w > 0) car.scale.x *= CAR.width / w;
    car.updateMatrixWorld(true);
  }
  car.position.y = -new THREE.Box3().setFromObject(car).min.y;
  car.updateMatrixWorld(true);

  // realistic materials and details (src/showroom/details.js)
  let metresPerUnit = 0.025;
  model.traverse(o => { if (o.isMesh && under(o, CAR.bodyNode)) metresPerUnit = o.matrixWorld.getMaxScaleOnAxis(); });
  const dressed = dressCar(model, {
    env: ENV, paintColor: PAINT.color, unitsPerMetre: 1 / metresPerUnit,
    frontX: new THREE.Box3().setFromObject(car).max.x,
  });

  // everything that rides with the body: lenses and headlights, bolt-on parts, the x-ray internals
  const bodyRig = new THREE.Group();
  bodyRig.add(dressed.extras);
  const carbon = carbonMaterial(ENV, 1);
  carbon.side = THREE.DoubleSide;
  const addons = buildAddons({ env: ENV, carbon, parts: dressed.parts });
  bodyRig.add(addons.group);
  const internals = buildInternals(ENV);
  bodyRig.add(internals);
  scene.add(bodyRig);
  // the x-ray outline: each exterior mesh drawn again with the ghost material
  const ghostMat = ghostMaterial();
  const ghosts = dressed.exteriorMeshes.map(o => {
    const g = new THREE.Mesh(o.geometry, ghostMat);
    g.position.copy(o.position); g.quaternion.copy(o.quaternion); g.scale.copy(o.scale);
    g.renderOrder = 10; g.visible = false;
    o.parent.add(g);
    return g;
  });
  controller = carController({
    dressed, addons, internals, ghosts, ghostMat, carbonBody: dressed.materials.carbonBody,
    bodyNode: model.getObjectByName(CAR.bodyNode), bodyRig, renderer,
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

  // so every variant is compiled before the car shows (no stall when a part is swapped): show them all once
  const warm = new THREE.Group();
  const tile = new THREE.PlaneGeometry(0.01, 0.01);
  for (const m of [dressed.materials.carbonBody, ...addons.tipMats, ghostMat]) { const t = new THREE.Mesh(tile, m); t.position.y = -1; warm.add(t); }
  scene.add(warm);
  internals.visible = true;
  api.parts = { dressed, addons, internals };   // for tests and tuning
  return { car, warm, internals };
}

const api = {
  ready: false, credit: CAR.credit, setActive, camera, controls, scene, renderer, composer, lights: { hemi, key, fill, rim, top },
  // external mode: { pos: [x,y,z], target: [x,y,z], fov, shift: [x,y] } from app.js's camera
  setView({ pos, target, fov, shift }) {
    camera.position.set(...pos);
    camera.lookAt(target[0], target[1], target[2]);
    camera.fov = fov;
    view.shift = shift || [0, 0];
    applyView();
  },
  // configurator values (CATS uniforms in app.js) plus view state: lights, xray, bay (the configurator lifts the key light)
  setState(s) {
    if (controller) controller.set(s);
    key.intensity = KEY * (1 + 0.12 * (s.bay ?? 0));
  },
  setPixelScale(s) { if (Math.abs(s - pixelScale) > 0.01) { pixelScale = s; resize(); } },
  render() { composer.render(); },
};
const draco = new DRACOLoader().setDecoderPath(new URL('../vendor/three/addons/libs/draco/gltf/', import.meta.url).href);
new GLTFLoader().setDRACOLoader(draco).load(CAR.url, gltf => {
  const { car, warm, internals } = prepareCar(gltf.scene);
  scene.add(car);
  // compile every shader in the background (KHR_parallel_shader_compile), so the page and the film don't stall
  renderer.compileAsync(scene, camera).catch(() => {}).then(() => {
    scene.remove(warm);
    internals.visible = false;
    controller.set(PREVIEW_STATE);
    renderer.shadowMap.needsUpdate = true;
    api.ready = true;
    onReady(api);
  });
}, undefined, err => {
  console.error('[showroom]', err);
  onError(err);
});

// ---------------------------------------------------------------- loop (the preview; the page drives its own)
const clock = new THREE.Clock();
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (controls) controls.update(dt);
  api.render(dt);
}
// render only while someone can see it
function setActive(on) {
  renderer.setAnimationLoop(on && !external ? tick : null);
  if (on) clock.getDelta();
}
setActive(interactive);
return api;
}
