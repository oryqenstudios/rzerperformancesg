// Drive the built page (dist/index.html) headlessly, step through states and
// save screenshots to tools/shots/. Also reports page errors.
//
//   node tools/page.mjs <width> <height> '<steps json>'
//
// steps json: { "hash": "#build", "scale": 0.5, "list": [ step, ... ] }
// step keys (all optional, run in this order):
//   js:       code to evaluate in the page (window.RZ test hooks, see CLAUDE.md)
//   click:    CSS selector to click (clicked from script; slow GPU frames block real clicks)
//   hash:     set location.hash (e.g. "build", "top")
//   scrollTo: element id to scroll to instantly
//   frames:   animation frames to wait (default 3)
//   shot:     screenshot file name without extension
//   log:      expression whose value is printed
//
// Examples
//   node tools/page.mjs 1440 900 '{"list":[{"js":"RZ.setIntro(9); RZ.settle(true)","frames":5,"shot":"hero"}]}'
//   node tools/page.mjs 1440 900 '{"list":[{"js":"RZ.setIntro(99); RZ.settle(true)"},{"scrollTo":"engineering","shot":"xray"}]}'
//   node tools/page.mjs 1440 900 '{"hash":"#build","list":[{"js":"RZ.settle(true)","frames":4,"shot":"build"},{"click":"#tab-aero","shot":"aero"}]}'
//   node tools/page.mjs 390 844 '{"hash":"#build","list":[{"js":"RZ.settle(true)","frames":4,"shot":"mobile-build"}]}'
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [W = '1440', H = '900', json = '{"list":[]}'] = process.argv.slice(2);
const steps = JSON.parse(json);
const outDir = path.join(here, 'shots');
fs.mkdirSync(outDir, { recursive: true });

const b = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', e => errors.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });

const url = pathToFileURL(path.join(here, '..', 'dist', 'index.html')).href + (steps.hash || '');
await p.goto(url);
await p.waitForFunction(() => window.RZ && (RZ.state().ready || RZ.state().glFailed), null, { timeout: 120000 });
if (steps.scale) await p.evaluate(q => { RZ.quality.scale = q; RZ.quality.min = q; RZ.quality.max = q; }, steps.scale);
const frames = async n => { for (let i = 0; i < n; i++) await p.evaluate(() => new Promise(r => requestAnimationFrame(() => r()))); };

for (const s of steps.list) {
  if (s.js) await p.evaluate(s.js);
  if (s.click) await p.evaluate(sel => document.querySelector(sel).click(), s.click);
  if (s.hash) await p.evaluate(h => { location.hash = h; }, s.hash);
  if (s.scrollTo) await p.evaluate(id => document.getElementById(id).scrollIntoView({ behavior: 'instant', block: 'start' }), s.scrollTo);
  await frames(s.frames || 3);
  if (s.shot) { await p.screenshot({ path: path.join(outDir, s.shot + '.png') }); console.log('saved', s.shot + '.png'); }
  if (s.log) console.log(s.log, '=>', JSON.stringify(await p.evaluate(s.log)));
}
console.log(errors.length ? errors.join('\n') : 'no page errors');
await b.close();
