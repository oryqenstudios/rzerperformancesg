// Render the 3D Evo (factory spec, liquid silver) from the photo configurator's camera angles, as layout guides for
// the Higgsfield photos (tools/higgsfield-edit.sh). Needs dist/ served over http:
//   python3 -m http.server -d dist 8765 &
//   node tools/render-guides.mjs [http://127.0.0.1:8765/] [view,view...] -> assets/generated/config/guides/*.png
// Car: front at +x, its right side at +z. Angles are the camera's azimuth from the front, towards the right side.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const base = process.argv[2] || 'http://127.0.0.1:8765/';
const out = path.join(here, '..', 'assets', 'generated', 'config', 'guides');
fs.mkdirSync(out, { recursive: true });

export const ORBIT = { r: 6.5, h: 1.25, target: [0, 0.6, 0], fov: 30 };
const views = {};
for (let a = 0; a < 360; a += 45) {
  const t = a * Math.PI / 180;
  views[`a${String(a).padStart(3, '0')}`] = { pos: [ORBIT.r * Math.cos(t), ORBIT.h, ORBIT.r * Math.sin(t)], target: ORBIT.target, fov: ORBIT.fov };
}
// close-ups, from the configurator's camera for that category (src/app.js BUILD_VIEWS)
views.wheel = { pos: [2.9, 0.55, 3.2], target: [1.15, 0.38, 0.8], fov: 30 };
views.exhaust = { pos: [-5.4, 0.75, 2.6], target: [-1.6, 0.4, 0.2], fov: 30 };
views.headlight = { pos: [5.1, 0.7, 1.9], target: [1.4, 0.5, 0.0], fov: 30 };
views.top = { pos: [3.3, 3.6, 3.5], target: [0.0, 0.7, 0.0], fov: 30 };        // high: the bonnet and roof

const STOCK_SILVER = {
  uPaint: [0.62, 0.63, 0.65], uPaintRough: 0.2, uPaintMetal: 1,            // liquid silver
  uRimCol: [0.72, 0.73, 0.75], uRimRough: 0.2, uRimMetal: 1,               // factory silver wheels
  uCaliper: [0.02, 0.02, 0.022],                                           // factory black calipers
  uLip: 0, uSkirts: 0, uDiffuser: 0, uSpoiler: 1, uRide: 0, uExhaust: 0, uExFinish: 0,
  uDrl: [1, 0.97, 0.92], uTint: 0.2, uHood: 0, uRoof: 0, uMirror: 0, lights: 1, xray: 0,
};

const b = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })).newPage();
p.on('pageerror', e => console.log('pageerror', e.message));
await p.goto(base + 'showroom/');
await p.waitForFunction(() => window.SHOWROOM && window.SHOWROOM.ready, null, { timeout: 600000 });
await p.evaluate(s => { SHOWROOM.setActive(false); SHOWROOM.setState(s); document.querySelector('.copy').style.display = 'none';
  document.getElementById('credit').style.display = 'none'; }, STOCK_SILVER);
const only = process.argv[3] ? process.argv[3].split(',') : null;
for (const [name, v] of Object.entries(views)) {
  if (only && !only.includes(name)) continue;
  await p.evaluate(v => {
    const c = SHOWROOM.camera;
    c.position.set(...v.pos); c.lookAt(...v.target); c.fov = v.fov; c.clearViewOffset(); c.updateProjectionMatrix();
    SHOWROOM.renderer.shadowMap.needsUpdate = true;
    SHOWROOM.render(); SHOWROOM.render();
  }, v);
  await p.locator('#view').screenshot({ path: path.join(out, name + '.png') });
  console.log('rendered', name);
}
fs.writeFileSync(path.join(out, 'views.json'), JSON.stringify(views, null, 1));
await b.close();
