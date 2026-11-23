// Inlines src/style.css, src/scene.frag and src/app.js into src/index.html
// and writes one self-contained page to dist/index.html.
//   node build.mjs           build once
//   node build.mjs --watch   rebuild on every change in src/
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(root, 'src');
const out = path.join(root, 'dist', 'index.html');
const read = f => fs.readFileSync(path.join(srcDir, f), 'utf8');

function build() {
  let html = read('index.html');
  // function replacements so "$" sequences in the sources are never treated as patterns
  html = html.replace('/*__CSS__*/', () => read('style.css'));
  html = html.replace('/*__FRAG__*/', () => read('scene.frag'));
  html = html.replace('/*__JS__*/', () => read('app.js'));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log(`[build] dist/index.html ${(html.length / 1024).toFixed(1)} KB`);
}

build();

if (process.argv.includes('--watch')) {
  let t = null;
  fs.watch(srcDir, () => { clearTimeout(t); t = setTimeout(() => { try { build(); } catch (e) { console.error(e.message); } }, 80); });
  console.log('[build] watching src/ — open dist/index.html in a browser and refresh after edits');
}
