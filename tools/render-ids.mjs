// Render part-ID maps of the 3D Evo from the photo configurator's camera views (the same cameras as
// tools/render-guides.mjs, which the photos were generated from). tools/config-build.py aligns them onto each photo and
// uses them to keep each option's layer to its own part, and to split the car into body, tyres and floor reflection for
// the ride-height shift. Needs dist/ served over http:
//   python3 -m http.server -d dist 8765 &
//   node tools/render-ids.mjs [http://127.0.0.1:8765/] [view,view...] -> assets/generated/config/ids/<view>-<state>.png
// Each pixel is a part id (IDS below); 100 + id is that part's mirror image in the floor; 200 is bare floor; 0 is
// anything else. States: stock, and three with add-ons fitted (their ids show where each add-on sits).
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const base = process.argv[2] || 'http://127.0.0.1:8765/';
const cfgDir = path.join(here, '..', 'assets', 'generated', 'config');
const out = path.join(cfgDir, 'ids');
fs.mkdirSync(out, { recursive: true });
const views = JSON.parse(fs.readFileSync(path.join(cfgDir, 'guides', 'views.json')));

export const IDS = { paint: 10, bonnet: 11, roof: 12, mirrors: 13, lip: 14, wing: 15, glass: 20, headlight: 21, tail: 22, trim: 23,
  rim: 30, tyre: 31, caliper: 32, tip: 40, splitter: 41, skirts: 42, diffuser: 43, lipspoiler: 44, gt: 45, interior: 50, other: 60 };
const STOCK = {
  uPaint: [0.62, 0.63, 0.65], uPaintRough: 0.2, uPaintMetal: 1, uRimCol: [0.72, 0.73, 0.75], uRimRough: 0.2, uRimMetal: 1,
  uCaliper: [0.02, 0.02, 0.022], uLip: 0, uSkirts: 0, uDiffuser: 0, uSpoiler: 1, uRide: 0, uExhaust: 0, uExFinish: 0,
  uDrl: [1, 0.97, 0.92], uTint: 0.2, uHood: 0, uRoof: 0, uMirror: 0, lights: 1, xray: 0,
};
// exhaust layouts in the 3D car: 0 factory, 3 twin, 1 quad, 2 centre (CATS in src/app.js)
const STATES = {
  stock: {},
  addA: { uLip: 2, uSkirts: 1, uDiffuser: 1, uSpoiler: 3, uExhaust: 3 },   // splitter, skirts, diffuser, GT wing, twin tips
  addB: { uSpoiler: 2, uExhaust: 1 },                                        // lip spoiler, quad tips
  addC: { uExhaust: 2 },                                                     // centre tips
};
const only = process.argv[3] ? process.argv[3].split(',') : null;

const b = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })).newPage();
p.on('pageerror', e => console.log('pageerror', e.message));
p.on('console', m => { if (m.type() === 'error') console.log('console', m.text()); });
await p.goto(base + 'showroom/');
await p.waitForFunction(() => window.SHOWROOM && window.SHOWROOM.ready, null, { timeout: 600000 });
await p.evaluate(IDS => {
  SHOWROOM.setActive(false);
  window.__ids = async () => {
    const THREE = await import('three');
    const S = SHOWROOM, P = S.parts, D = P.dressed, M = D.materials, A = P.addons;
    const tipSets = new Set(Object.values(A.tips));
    // the car itself, and the rig that carries its headlight units and add-ons (internals stay hidden)
    const holds = (c, t) => { let hit = false; c.traverse(x => { if (x === t) hit = true; }); return hit; };
    const carRoots = S.scene.children.filter(c => holds(c, D.parts.shell) || holds(c, A.group) || holds(c, D.extras));
    const inCar = o => carRoots.some(r => holds(r, o));
    const partOf = o => {
      for (let x = o; x; x = x.parent) {
        if (x === A.splitter) return 'splitter';
        if (x === A.skirts) return 'skirts';
        if (x === A.diffuser) return 'diffuser';
        if (x === A.lip) return 'lipspoiler';
        if (x === A.gt) return 'gt';
        if (tipSets.has(x)) return 'tip';
        if (x === D.extras) return 'headlight';
        if (/^w[1-4]$/.test(x.name)) return 'wheel';
        if (/^b[1-4]$/.test(x.name)) return 'brake';
        if (x.name && x.name.startsWith('rz_')) return x.name.slice(3);
      }
      return null;
    };
    const mats = new Map();
    const idMat = id => { if (!mats.has(id)) mats.set(id, new THREE.MeshBasicMaterial({ color: new THREE.Color(id / 255, 0, 0), side: THREE.DoubleSide, toneMapped: false })); return mats.get(id); };
    const classify = (part, m) => {
      if (part === 'wheel') return m === M.rim ? 'rim' : 'tyre';
      if (part === 'brake') return 'caliper';
      if (['splitter', 'skirts', 'diffuser', 'lipspoiler', 'gt', 'tip', 'headlight', 'interior'].includes(part)) return part;
      if (m === M.paint || m === M.carbonBody) return ['bonnet', 'roof', 'mirrors', 'lip', 'wing'].includes(part) ? part : 'paint';
      if (m === M.windows) return 'glass';
      if (m === M.lensGlass) return 'headlight';
      if (m === M.tail) return 'tail';
      if (m === M.trim) return 'trim';
      return 'other';
    };
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), idMat(200));
    const rt = new THREE.WebGLRenderTarget(1920, 1080, { samples: 0, colorSpace: THREE.LinearSRGBColorSpace });
    const R = S.renderer;
    // one view: the car's ids, then its mirror image, combined
    window.__renderIds = view => {
      const cam = S.camera;
      cam.position.set(...view.pos); cam.lookAt(...view.target); cam.fov = view.fov; cam.aspect = 16 / 9; cam.clearViewOffset(); cam.updateProjectionMatrix();
      const saved = [];
      carRoots.forEach(r => r.traverse(o => {
        if (!o.isMesh || !o.visible) return;
        const part = partOf(o);
        saved.push([o, o.material]);
        o.material = Array.isArray(o.material) ? o.material.map(m => idMat(IDS[classify(part, m)])) : idMat(IDS[classify(part, o.material)]);
      }));
      const hidden = S.scene.children.filter(c => !carRoots.includes(c) && c.visible);
      hidden.forEach(c => { c.visible = false; });
      const bg = S.scene.background, tm = R.toneMapping, ocs = R.outputColorSpace;
      S.scene.background = null; R.toneMapping = THREE.NoToneMapping;
      R.setRenderTarget(rt);
      const grab = () => { const px = new Uint8Array(1920 * 1080 * 4); R.readRenderTargetPixels(rt, 0, 0, 1920, 1080, px); return px; };
      S.scene.add(floor);
      R.setClearColor(0x000000, 0); R.clear(); R.render(S.scene, cam);
      const front = grab();
      S.scene.remove(floor);
      // the mirror image in the floor (y = 0): flip about the floor, not about the car's own origin
      const flip = () => carRoots.forEach(r => { r.position.y *= -1; r.scale.y *= -1; r.updateMatrixWorld(true); });
      flip();
      R.clear(); R.render(S.scene, cam);
      const mirror = grab();
      flip();
      R.setRenderTarget(null);
      S.scene.background = bg; R.toneMapping = tm; R.outputColorSpace = ocs;
      hidden.forEach(c => { c.visible = true; });
      for (const [o, m] of saved) o.material = m;
      // bottom-up rows -> top-down; car part, else its reflection (+100), else floor (200)
      const outArr = new Uint8Array(1920 * 1080);
      for (let y = 0; y < 1080; y++) for (let x = 0; x < 1920; x++) {
        const i = ((1079 - y) * 1920 + x) * 4;
        const a = front[i], m = mirror[i];
        outArr[y * 1920 + x] = a && a !== 200 ? a : m ? m + 100 : a;
      }
      let s = ''; for (let i = 0; i < outArr.length; i += 32768) s += String.fromCharCode.apply(null, outArr.subarray(i, i + 32768));
      return btoa(s);
    };
  };
}, IDS);
await p.evaluate(() => window.__ids());
for (const [state, extra] of Object.entries(STATES)) {
  await p.evaluate(s => SHOWROOM.setState(s), Object.assign({}, STOCK, extra));
  for (const [name, v] of Object.entries(views)) {
    if (only && !only.includes(name)) continue;
    const b64 = await p.evaluate(v => window.__renderIds(v), v);
    // written as a PGM, then packed to a PNG (an ID map compresses to a few tens of KB)
    const pgm = path.join(out, `${name}-${state}.pgm`);
    fs.writeFileSync(pgm, Buffer.concat([Buffer.from('P5\n1920 1080\n255\n'), Buffer.from(b64, 'base64')]));
    execFileSync('python3', ['-c', 'import cv2,sys,os; cv2.imwrite(sys.argv[2], cv2.imread(sys.argv[1], cv2.IMREAD_UNCHANGED), [cv2.IMWRITE_PNG_COMPRESSION, 9]); os.remove(sys.argv[1])', pgm, pgm.replace(/\.pgm$/, '.png')]);
    console.log('ids', name, state);
  }
}
fs.writeFileSync(path.join(out, 'ids.json'), JSON.stringify(IDS));
await b.close();
