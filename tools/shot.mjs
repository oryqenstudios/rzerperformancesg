// Render src/scene.frag on its own (no page UI) and save PNGs to tools/shots/.
// Fastest way to check a shader change.
//
//   node tools/shot.mjs '<json>' [width] [height]
//
// <json> is one frame object or an array of them. Any key starting with "u" is
// passed as a uniform; "cam" is [[pos],[target]]; "fov" is in degrees; "name"
// is the output file name. Defaults below = the built car with the Rzer
// signature build (silver Evo, showroom spotlight), headlights on.
//
//   node tools/shot.mjs '{"name":"hero"}'
//   node tools/shot.mjs '{"name":"intro-spikes","uT":3.6,"uLights":0,"cam":[[2.6,1.6,1.4],[0,0.05,0]],"fov":38}'
//   node tools/shot.mjs '{"name":"xray","uXray":1,"cam":[[3.6,3.1,3.9],[0.1,0.35,0]]}'
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [json = '{}', W = '960', H = '600'] = process.argv.slice(2);
const frag = fs.readFileSync(path.join(here, '..', 'src', 'scene.frag'), 'utf8');
const parsed = JSON.parse(json);
const frames = Array.isArray(parsed) ? parsed : [parsed];
const outDir = path.join(here, 'shots');
fs.mkdirSync(outDir, { recursive: true });

const b = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: +W, height: +H } });
await p.setContent(`<canvas id=c width=${W} height=${H} style="display:block"></canvas>`);

for (const [i, opts] of frames.entries()) {
  const res = await p.evaluate(({ frag, opts, W, H }) => {
    if (!window.__gl) {
      const gl = document.getElementById('c').getContext('webgl2');
      const vs = `#version 300 es\nvoid main(){ vec2 p = vec2((gl_VertexID<<1)&2, gl_VertexID&2); gl_Position = vec4(p*2.-1.,0,1); }`;
      const mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
      const pr = gl.createProgram();
      gl.attachShader(pr, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, frag.trim()));
      gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
      window.__gl = { gl, pr };
    }
    const { gl, pr } = window.__gl;
    gl.useProgram(pr);
    const L = n => gl.getUniformLocation(pr, n);
    const d = Object.assign({
      uT: 99, uXray: 0, uLights: 1, uBay: 0, uShow: 1, uReflect: 1, uExposure: 1.35, uDrl: [1, 0.97, 0.92],
      uPaint: [0.62, 0.63, 0.65], uPaintRough: 0.2, uPaintMetal: 1,
      uRimCol: [0.008, 0.008, 0.009], uRimRough: 0.05, uRimMetal: 0, uCaliper: [0.55, 0.02, 0.015],
      uWheel: 0, uRimR: 0.229, uSpoiler: 3, uLip: 2, uSkirts: 1, uDiffuser: 1, uExhaust: 0, uExFinish: 1,
      uRide: 0.05, uWide: 0, uHood: 1, uRoof: 0, uMirror: 0, uTint: 0.6, uTime: 1, uZero: 0, uShift: [0, 0],
      cam: [[5.6, 1.2, -3.4], [0.1, 0.5, 0.1]], fov: 34
    }, opts);
    const ints = ['uWheel', 'uSpoiler', 'uLip', 'uSkirts', 'uDiffuser', 'uExhaust', 'uExFinish', 'uHood', 'uRoof', 'uMirror', 'uZero'];
    for (const [k, v] of Object.entries(d)) {
      if (!k.startsWith('u')) continue;
      const l = L(k); if (!l) continue;
      if (ints.includes(k)) gl.uniform1i(l, v);
      else if (Array.isArray(v)) (v.length === 2 ? gl.uniform2fv : gl.uniform3fv).call(gl, l, v);
      else gl.uniform1f(l, v);
    }
    const [pos, tgt] = d.cam;
    const sub = (a, b) => a.map((x, i) => x - b[i]);
    const norm = a => { const l = Math.hypot(...a); return a.map(x => x / l); };
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const f = norm(sub(tgt, pos)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f);
    gl.uniform3fv(L('uCamPos'), pos); gl.uniform3fv(L('uCamFwd'), f); gl.uniform3fv(L('uCamRight'), r); gl.uniform3fv(L('uCamUp'), u);
    gl.uniform1f(L('uTanHalf'), Math.tan(d.fov * Math.PI / 360));
    gl.uniform2f(L('uRes'), W, H);
    gl.viewport(0, 0, W, H);
    const t = performance.now();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); // wait for the GPU
    return { ms: Math.round(performance.now() - t) };
  }, { frag, opts, W: +W, H: +H }).catch(e => ({ error: String(e) }));
  const name = (opts.name || 'frame-' + i) + '.png';
  if (res.error) { console.error(res.error); process.exitCode = 1; break; }
  await p.screenshot({ path: path.join(outDir, name) });
  console.log(`${name}  ${res.ms} ms`);
}
await b.close();
