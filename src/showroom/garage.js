// The tuning garage from the hero film, built in 3D around the car, so the scroll sections and the 3D configurator
// sit in the same place as the hero: a glossy black epoxy floor like wet glass (a real reflection), a honeycomb of
// white hexagonal LED tubes on a dark ceiling, charcoal panelled walls with vertical red neon strips and a red line
// along the back wall, a wall of alloy wheels on red-lit shelves on one side and red-trimmed black tool chests on the
// other. The car's paint mirrors the same garage (env()).
//
// World: metres, y up, the car centred at the origin with its front at +x (as in showroom.js). Seen head-on from the
// front, as in the hero's last frame, the tool chests are on the left (+z) and the wheel wall on the right (-z).
//
// The room has the hero's proportions, smaller than the orbit some of the page's cameras take, so it is a cutaway:
// walls face inwards only (a camera outside a wall looks through it), and whatever stands against a wall is hidden
// while the camera is outside that wall (update()).
//
//   const garage = buildGarage({ renderer });
//   scene.add(garage.group); garage.env -> PMREM texture for the car's materials
//   garage.update(camera) each frame; garage.setReflect(bool); garage.resize(widthPx, heightPx)
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

export const ROOM = { back: -5.4, front: 7.4, left: 4.4, right: -4.4, ceil: 3.8 };
const HEX = { r: 0.42, u: 3.0, v: 3.7, line: 0.032 };   // the LED honeycomb: hex size, half extent across (z) and along (x)
const NEON = new THREE.Color(2.6, 0.1, 0.07);          // red neon (linear, above 1 so the bloom picks it up)
const LED = new THREE.Color(3.4, 3.4, 3.55);           // the white hex tubes
const WHEELS = { x0: -1.2, x1: 4.6 };                  // where the wheel wall stands along the right wall

export function buildGarage({ renderer }) {
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const group = new THREE.Group();
  group.name = 'garage';
  const W = ROOM.front - ROOM.back, D = ROOM.left - ROOM.right, cx = (ROOM.front + ROOM.back) / 2, cz = (ROOM.left + ROOM.right) / 2;

  // ---------------------------------------------------------------- textures (drawn, no image files)
  function tex(w, h, draw, srgb = true) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = aniso;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const grain = (g, w, h, amt) => {
    const d = g.getImageData(0, 0, w, h);
    for (let i = 0; i < d.data.length; i += 4) {
      const n = (Math.random() - 0.5) * amt;
      d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n;
    }
    g.putImageData(d, 0, 0);
  };
  // one wall panel, 1.2 m wide and 1.9 m tall: flat, with a fine seam round it (tinted charcoal by the material)
  const panelTex = tex(256, 405, (g, w, h) => {
    g.fillStyle = '#e4e4e6'; g.fillRect(0, 0, w, h);
    grain(g, w, h, 12);
    g.fillStyle = '#5a5b5e'; g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h);
    g.fillStyle = '#ffffff'; g.fillRect(3, 3, w - 3, 1); g.fillRect(3, 3, 1, h - 3);
  });
  // ceiling tiles: dark, with a faint grid
  const tileTex = tex(128, 128, (g, w, h) => {
    g.fillStyle = '#202124'; g.fillRect(0, 0, w, h);
    grain(g, w, h, 6);
    g.fillStyle = '#0c0c0e'; g.fillRect(0, 0, w, 4); g.fillRect(0, 0, 4, h);
  });
  // a roller door: horizontal ribs
  const doorTex = tex(64, 256, (g, w, h) => {
    for (let y = 0; y < h; y += 16) {
      const gr = g.createLinearGradient(0, y, 0, y + 16);
      gr.addColorStop(0, '#9a9ba0'); gr.addColorStop(0.5, '#6d6e73'); gr.addColorStop(1, '#3a3b3e');
      g.fillStyle = gr; g.fillRect(0, y, w, 16);
    }
  });
  // drawer fronts of a tool chest: gaps and brushed handle bars
  const drawerTex = tex(256, 256, (g, w, h) => {
    g.fillStyle = '#0d0d0e'; g.fillRect(0, 0, w, h);
    const rows = [0, 0.13, 0.25, 0.36, 0.48, 0.62, 0.8, 1];
    for (let i = 0; i < rows.length - 1; i++) {
      const y0 = rows[i] * h, y1 = rows[i + 1] * h;
      g.fillStyle = '#000'; g.fillRect(0, y0, w, 3);
      const hg = g.createLinearGradient(0, y0 + 6, 0, y0 + 12);
      hg.addColorStop(0, '#d8dade'); hg.addColorStop(1, '#55575c');
      g.fillStyle = hg; g.fillRect(w * 0.08, y0 + 6, w * 0.84, Math.max(4, (y1 - y0) * 0.12));
    }
  });
  // a multi-spoke rim face, transparent between the spokes
  const rimTex = tex(256, 256, (g, w) => {
    const c = w / 2;
    g.clearRect(0, 0, w, w);
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(c, c, c * 0.98, 0, Math.PI * 2); g.arc(c, c, c * 0.86, 0, Math.PI * 2, true); g.fill();   // the lip
    for (let i = 0; i < 10; i++) {   // ten split spokes
      const a = (i / 10) * Math.PI * 2;
      g.save(); g.translate(c, c); g.rotate(a);
      g.beginPath(); g.moveTo(-c * 0.05, c * 0.16); g.lineTo(-c * 0.03, c * 0.9); g.lineTo(c * 0.03, c * 0.9); g.lineTo(c * 0.05, c * 0.16); g.fill();
      g.restore();
    }
    g.beginPath(); g.arc(c, c, c * 0.22, 0, Math.PI * 2); g.fill();   // the hub
  }, false);
  // the soft red wash a neon strip throws on the wall around it
  const glowTex = tex(128, 8, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, 'rgba(255,40,30,0)'); gr.addColorStop(0.5, 'rgba(255,40,30,1)'); gr.addColorStop(1, 'rgba(255,40,30,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });

  // ---------------------------------------------------------------- materials
  // the walls and ceiling are lit evenly by the honeycomb, so their light is drawn in (unlit materials): charcoal,
  // a little brighter towards the ceiling (vertex colours)
  const wallMat = new THREE.MeshBasicMaterial({ color: 0x3e3f44, map: panelTex, vertexColors: true });
  const ceilMat = new THREE.MeshBasicMaterial({ color: 0x2a2b2e, map: tileTex });
  const neonMat = new THREE.MeshBasicMaterial({ color: NEON });
  const ledMat = new THREE.MeshBasicMaterial({ color: LED });
  const glowMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false });
  const chestMat = new THREE.MeshStandardMaterial({ color: 0x111113, roughness: 0.32, metalness: 0.4 });
  const chestFront = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.35, map: drawerTex });
  const redTrim = new THREE.MeshStandardMaterial({ color: 0xa3110f, roughness: 0.35, metalness: 0.2, emissive: 0x2a0303 });
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.5, metalness: 0.3 });
  const tyreMat = new THREE.MeshStandardMaterial({ color: 0x0f0f10, roughness: 0.85 });
  // the display rims face the room, where there is little to mirror: part metal, part paint, so they read
  const rimSilver = new THREE.MeshStandardMaterial({ color: 0xd4d7dc, roughness: 0.3, metalness: 0.55, map: rimTex, alphaTest: 0.5, side: THREE.DoubleSide, emissive: 0x1c1d20 });
  const rimDark = new THREE.MeshStandardMaterial({ color: 0x3c3d42, roughness: 0.25, metalness: 0.5, map: rimTex, alphaTest: 0.5, side: THREE.DoubleSide, emissive: 0x08080a });
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1f, roughness: 0.4, metalness: 0.8 });
  const doorMat = new THREE.MeshBasicMaterial({ color: 0x4a4b50, map: doorTex });   // lit like the walls

  // ---------------------------------------------------------------- the shell: walls facing in, the ceiling facing down
  const props = { left: new THREE.Group(), right: new THREE.Group(), back: new THREE.Group(), front: new THREE.Group() };
  Object.values(props).forEach(p => group.add(p));
  function wall(len, side, pos, rotY, prop) {
    const t = panelTex.clone(); t.needsUpdate = true; t.repeat.set(len / 1.2, ROOM.ceil / 1.9);
    const m = wallMat.clone(); m.map = t;
    const geo = new THREE.PlaneGeometry(len, ROOM.ceil, 1, 8);
    const vp = geo.attributes.position, col = [];
    for (let i = 0; i < vp.count; i++) {
      const y = vp.getY(i) / ROOM.ceil + 0.5;   // 0 at the floor, 1 at the ceiling
      const k = 0.82 + 0.45 * y * y;
      col.push(k, k, k);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const w = new THREE.Mesh(geo, m);
    w.position.set(pos[0], ROOM.ceil / 2, pos[1]); w.rotation.y = rotY;
    group.add(w);
    // red neon: vertical strips along the wall, each with a soft wash, and a line along the top
    // (as in the hero, the back wall has only its horizontal line; no strip behind the wheel wall's shelves)
    const strips = side === 'back' ? 0 : Math.max(2, Math.round(len / 3.4));
    for (let i = 0; i < strips; i++) {
      const s = -len / 2 + (i + 0.5) * (len / strips);
      if (side === 'right' && s + cx > WHEELS.x0 - 0.3 && s + cx < WHEELS.x1 + 0.3) continue;
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.035, ROOM.ceil * 0.68, 0.03), neonMat);
      strip.position.set(s, ROOM.ceil * 0.5, 0.02);
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.45, ROOM.ceil * 0.72), glowMat);
      glow.position.set(s, ROOM.ceil * 0.5, 0.01);
      const holder = new THREE.Group(); holder.add(strip, glow);
      holder.position.set(pos[0], 0, pos[1]); holder.rotation.y = rotY;
      prop.add(holder);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(len, 0.025, 0.03), neonMat);
    top.position.set(0, ROOM.ceil - 0.06, 0.02);
    const holder = new THREE.Group(); holder.add(top);
    holder.position.set(pos[0], 0, pos[1]); holder.rotation.y = rotY;
    prop.add(holder);
    return w;
  }
  // a plane's front faces +z; turn each to face into the room
  wall(D, 'back', [ROOM.back, cz], Math.PI / 2, props.back);
  wall(D, 'front', [ROOM.front, cz], -Math.PI / 2, props.front);
  wall(W, 'left', [cx, ROOM.left], Math.PI, props.left);
  wall(W, 'right', [cx, ROOM.right], 0, props.right);
  // the back wall's red line, at about roof height, as in the hero
  {
    const line = new THREE.Mesh(new THREE.BoxGeometry(D * 0.8, 0.028, 0.03), neonMat);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.36, D * 0.82), glowMat);
    glow.rotation.z = Math.PI / 2;
    const h = new THREE.Group(); h.add(line, glow);
    line.position.y = glow.position.y = 1.42; line.position.z = 0.02; glow.position.z = 0.012;
    h.position.set(ROOM.back, 0, cz); h.rotation.y = Math.PI / 2;
    props.back.add(h);
  }
  // a roller door in the front wall
  {
    const door = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.0), doorMat);
    doorMat.map.repeat.set(1, 3.0 / 1.0);
    door.position.set(ROOM.front - 0.01, 1.5, cz); door.rotation.y = -Math.PI / 2;
    props.front.add(door);
  }
  // the ceiling
  {
    const t = tileTex.clone(); t.needsUpdate = true; t.repeat.set(W / 0.6, D / 0.6);
    const m = ceilMat.clone(); m.map = t;
    const c = new THREE.Mesh(new THREE.PlaneGeometry(W, D), m);
    c.rotation.x = Math.PI / 2; c.position.set(cx, ROOM.ceil, cz);
    group.add(c);
  }

  // ---------------------------------------------------------------- the LED honeycomb
  // flat-sided towards the front and back (as seen in the hero), centred over the car
  function hexEdges() {
    const { r, u: U, v: V } = HEX, s3 = Math.sqrt(3), seen = new Map();
    for (let q = -12; q <= 12; q++) for (let k = -12; k <= 12; k++) {
      const u = 1.5 * r * q, v = s3 * r * (k + (q & 1) / 2);
      if (Math.abs(u) > U - r * 0.5 || Math.abs(v) > V - r * 0.5) continue;
      for (let e = 0; e < 6; e++) {
        const a0 = e * Math.PI / 3, a1 = (e + 1) * Math.PI / 3;
        const p0 = [u + r * Math.cos(a0), v + r * Math.sin(a0)], p1 = [u + r * Math.cos(a1), v + r * Math.sin(a1)];
        const key = `${Math.round((p0[0] + p1[0]) * 50)},${Math.round((p0[1] + p1[1]) * 50)}`;
        if (!seen.has(key)) seen.set(key, [p0, p1]);
      }
    }
    return [...seen.values()];   // [[u0, v0], [u1, v1]]: u along z, v along x
  }
  const EDGES = hexEdges();
  function honeycomb(width, mat, y) {
    const geo = new THREE.PlaneGeometry(1, 1).rotateX(Math.PI / 2);   // facing down
    const mesh = new THREE.InstancedMesh(geo, mat, EDGES.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    EDGES.forEach(([p0, p1], i) => {
      const x0 = p0[1], z0 = p0[0], x1 = p1[1], z1 = p1[0];
      const len = Math.hypot(x1 - x0, z1 - z0) + width;
      q.setFromEuler(e.set(0, Math.atan2(-(z1 - z0), x1 - x0), 0));
      m.compose(new THREE.Vector3((x0 + x1) / 2, y, (z0 + z1) / 2), q, new THREE.Vector3(len, 1, width));
      mesh.setMatrixAt(i, m);
    });
    return mesh;
  }
  group.add(honeycomb(HEX.line, ledMat, ROOM.ceil - 0.02));
  // each tube's soft glow, as in the hero; it also keeps the thin tubes from breaking into dots in the distance
  const haloMat = new THREE.MeshBasicMaterial({ color: LED.clone().multiplyScalar(0.07), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  group.add(honeycomb(HEX.line * 4.5, haloMat, ROOM.ceil - 0.025));

  // ---------------------------------------------------------------- the wheel wall (right, -z)
  {
    const { x0, x1 } = WHEELS, rows = [0.3, 1.0, 1.7, 2.4], depth = 0.42, zW = ROOM.right;
    const back = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 2.85, 0.05), shelfMat);
    back.position.set((x0 + x1) / 2, 1.55, zW + 0.03);
    props.right.add(back);
    const per = Math.floor((x1 - x0) / 0.74);
    const tyres = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 40, 1, true).rotateX(Math.PI / 2), tyreMat, rows.length * per);
    const tyreFace = new THREE.InstancedMesh(new THREE.RingGeometry(0.215, 0.3, 40), tyreMat, rows.length * per);
    const barrels = new THREE.InstancedMesh(new THREE.CircleGeometry(0.215, 32), barrelMat, rows.length * per);
    const silver = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.43, 0.43), rimSilver, rows.length * per);
    const dark = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.43, 0.43), rimDark, rows.length * per);
    let n = 0, ns = 0, nd = 0;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
    rows.forEach((y, ri) => {
      // the shelf, its red LED strip along the front edge and the red wash on the wall above it
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.04, depth), shelfMat);
      shelf.position.set((x0 + x1) / 2, y - 0.02, zW + depth / 2);
      const led = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.02, 0.02), neonMat);
      led.position.set((x0 + x1) / 2, y - 0.03, zW + depth + 0.005);
      const wash = new THREE.Mesh(new THREE.PlaneGeometry(0.22, x1 - x0), glowMat);
      wash.rotation.z = Math.PI / 2; wash.position.set((x0 + x1) / 2, y + 0.05, zW + 0.06);
      props.right.add(shelf, led, wash);
      for (let i = 0; i < per; i++) {
        const x = x0 + 0.42 + i * ((x1 - x0 - 0.84) / (per - 1));
        const c = new THREE.Vector3(x, y + 0.3, zW + depth / 2 + 0.02);
        q.identity();
        m.compose(c, q, one); tyres.setMatrixAt(n, m);
        m.compose(c.clone().setZ(c.z + 0.1), q, one); tyreFace.setMatrixAt(n, m);
        m.compose(c.clone().setZ(c.z + 0.02), q, one); barrels.setMatrixAt(n, m);
        q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), (i * 0.7 + ri) % 1.3);
        m.compose(c.clone().setZ(c.z + 0.095), q, one);
        if ((i + ri) % 2) silver.setMatrixAt(ns++, m); else dark.setMatrixAt(nd++, m);
        n++;
      }
    });
    silver.count = ns; dark.count = nd;
    props.right.add(tyres, tyreFace, barrels, silver, dark);
  }

  // ---------------------------------------------------------------- the tool chests (left, +z)
  {
    const zW = ROOM.left, deep = 0.62;
    let x = -4.9;
    const widths = [1.35, 1.0, 1.35, 0.9, 1.35, 1.1];
    widths.forEach((w, i) => {
      const h = i % 2 ? 0.95 : 1.02;
      const mats = [chestMat, chestMat, chestMat, chestMat, chestMat, chestFront];   // the front (-z) faces the room
      const fm = chestFront.clone(); fm.map = chestFront.map.clone(); fm.map.needsUpdate = true; fm.map.repeat.set(1, 1);
      mats[5] = fm;
      const cab = new THREE.Mesh(new THREE.BoxGeometry(w, h, deep), mats);
      cab.position.set(x + w / 2, 0.1 + h / 2, zW - deep / 2 - 0.05);
      props.left.add(cab);
      // red side panels and casters
      for (const s of [-1, 1]) {
        const side = new THREE.Mesh(new THREE.BoxGeometry(0.04, h, deep + 0.01), redTrim);
        side.position.set(x + w / 2 + s * (w / 2 - 0.02), 0.1 + h / 2, zW - deep / 2 - 0.05);
        props.left.add(side);
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 12).rotateX(Math.PI / 2), tyreMat);
        wheel.position.set(x + w / 2 + s * (w / 2 - 0.1), 0.045, zW - deep + 0.05);
        props.left.add(wheel);
      }
      // a top box on some, and a few cans and tools on the worktop
      if (i % 3 !== 1) {
        const tw = w * 0.62, th = 0.38;
        const top = new THREE.Mesh(new THREE.BoxGeometry(tw, th, deep * 0.8), [chestMat, chestMat, chestMat, chestMat, chestMat, fm]);
        top.position.set(x + w * 0.4, 0.1 + h + th / 2, zW - deep * 0.4 - 0.05);
        props.left.add(top);
        const trim = new THREE.Mesh(new THREE.BoxGeometry(0.03, th, deep * 0.8 + 0.01), redTrim);
        trim.position.set(x + w * 0.4 + tw / 2, 0.1 + h + th / 2, zW - deep * 0.4 - 0.05);
        props.left.add(trim);
      }
      for (let k = 0; k < 3; k++) {
        const can = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 12), k % 2 ? chestMat : redTrim);
        can.position.set(x + w * (0.72 + k * 0.08), 0.1 + h + 0.1, zW - deep * 0.55);
        props.left.add(can);
      }
      x += w + 0.06;
    });
  }

  // ---------------------------------------------------------------- the floor: black epoxy like wet glass
  // A real reflection (Reflector renders the scene mirrored in the floor), softened a little and warped by the
  // epoxy's faint waves, stronger at grazing angles, over a dark base with faint marble veins. When the page turns
  // reflections off (slow devices), a plain glossy floor shows instead.
  const FloorShader = {
    name: 'GarageFloor',
    uniforms: {
      color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
      uBase: { value: new THREE.Color(0.012, 0.012, 0.014) }, uStrength: { value: 0.5 }, uTexel: { value: new THREE.Vector2(1 / 512, 1 / 512) },
    },
    vertexShader: /* glsl */`
      uniform mat4 textureMatrix;
      varying vec4 vUv;
      varying vec3 vWorld;
      #include <common>
      #include <logdepthbuf_pars_vertex>
      void main() {
        vUv = textureMatrix * vec4(position, 1.0);
        vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        #include <logdepthbuf_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tDiffuse;
      uniform vec3 uBase;
      uniform float uStrength;
      uniform vec2 uTexel;
      varying vec4 vUv;
      varying vec3 vWorld;
      #include <logdepthbuf_pars_fragment>
      float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnoise(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
      }
      float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; } return s; }
      void main() {
        #include <logdepthbuf_fragment>
        vec2 uv = vUv.xy / vUv.w;
        vec2 wave = vec2(fbm(vWorld.xz * 0.7), fbm(vWorld.xz * 0.7 + 7.3)) - 0.5;
        uv += wave * 0.006;
        vec2 t = uTexel * 1.6;
        vec3 r = texture2D(tDiffuse, uv).rgb * 0.36
          + (texture2D(tDiffuse, uv + vec2(t.x, 0.0)).rgb + texture2D(tDiffuse, uv - vec2(t.x, 0.0)).rgb
          +  texture2D(tDiffuse, uv + vec2(0.0, t.y)).rgb + texture2D(tDiffuse, uv - vec2(0.0, t.y)).rgb) * 0.16;
        vec3 V = normalize(cameraPosition - vWorld);
        float fres = 0.42 + 0.58 * pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0);
        float vein = smoothstep(0.014, 0.0, abs(fbm(vWorld.xz * 0.45 + 3.1) - 0.5)) * 0.7
                   + smoothstep(0.008, 0.0, abs(fbm(vWorld.xz * 1.6 + 11.7) - 0.5)) * 0.4;
        vec3 base = uBase * (0.8 + 0.4 * fbm(vWorld.xz * 2.3)) + vec3(0.035) * vein;
        gl_FragColor = vec4(base + r * uStrength * fres, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  };
  const reflector = new Reflector(new THREE.PlaneGeometry(W, D), { textureWidth: 512, textureHeight: 512, clipBias: 0.002, multisample: 0, shader: FloorShader });
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.set(cx, 0, cz);
  group.add(reflector);
  const plainFloor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.16, metalness: 0 }));
  plainFloor.rotation.x = -Math.PI / 2;
  plainFloor.position.set(cx, -0.002, cz);
  plainFloor.visible = false;
  group.add(plainFloor);

  // ---------------------------------------------------------------- what the car's paint mirrors
  // The same garage, simplified and unlit, seen from the car's mid-height: the honeycomb drawn thicker (the
  // environment map is coarse), the neon, dark walls and floor.
  function env() {
    const e = new THREE.Scene();
    const basic = v => new THREE.MeshBasicMaterial({ color: v, side: THREE.DoubleSide });
    const lift = new THREE.Group(); lift.position.y = -0.62; e.add(lift);
    const room = new THREE.Mesh(new THREE.BoxGeometry(W, ROOM.ceil, D), basic(new THREE.Color(0.04, 0.04, 0.044)));
    room.position.set(cx, ROOM.ceil / 2, cz); lift.add(room);
    const hc = honeycomb(0.1, new THREE.MeshBasicMaterial({ color: new THREE.Color(3.6, 3.6, 3.75), side: THREE.DoubleSide }), ROOM.ceil - 0.05);
    lift.add(hc);
    const red = basic(new THREE.Color(0.9, 0.035, 0.025));
    for (const [x, z, ry, len] of [[cx, ROOM.left - 0.05, Math.PI, W], [cx, ROOM.right + 0.05, 0, W], [ROOM.front - 0.05, cz, -Math.PI / 2, D]]) {
      const n = Math.max(2, Math.round(len / 3.4));
      for (let i = 0; i < n; i++) {
        const s = new THREE.Mesh(new THREE.PlaneGeometry(0.12, ROOM.ceil * 0.68), red);
        const g = new THREE.Group(); g.add(s); s.position.set(-len / 2 + (i + 0.5) * (len / n), ROOM.ceil * 0.5, 0);
        g.position.set(x, 0, z); g.rotation.y = ry; lift.add(g);
      }
    }
    const line = new THREE.Mesh(new THREE.PlaneGeometry(D * 0.8, 0.08), red);
    line.position.set(ROOM.back + 0.05, 1.42, cz); line.rotation.y = Math.PI / 2; lift.add(line);
    const wheelWall = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 2.6), basic(new THREE.Color(0.08, 0.012, 0.01)));
    wheelWall.position.set(1.7, 1.5, ROOM.right + 0.06); lift.add(wheelWall);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const out = pmrem.fromScene(e, 0.02).texture;
    pmrem.dispose();
    return out;
  }
  const ENV = env();
  for (const m of [chestMat, chestFront, redTrim, shelfMat, rimSilver, rimDark, barrelMat]) { m.envMap = ENV; m.envMapIntensity = 0.8; }
  rimSilver.envMapIntensity = 1.6;   // the silver rims catch the honeycomb
  plainFloor.material.envMap = ENV; plainFloor.material.envMapIntensity = 0.7;

  // ---------------------------------------------------------------- per frame: the cutaway
  // what stands against a wall goes while the camera is outside that wall, or right up against it (1.2 m)
  const margin = 0.35, near = 1.2;
  group.updateMatrixWorld(true);
  const boxes = { left: new THREE.Box3().setFromObject(props.left), right: new THREE.Box3().setFromObject(props.right) };
  function update(camera) {
    const p = camera.position;
    props.left.visible = p.z < ROOM.left - margin && boxes.left.distanceToPoint(p) > near;
    props.right.visible = p.z > ROOM.right + margin && boxes.right.distanceToPoint(p) > near;
    props.back.visible = p.x > ROOM.back + margin;
    props.front.visible = p.x < ROOM.front - margin;
  }
  function setReflect(on) { reflector.visible = !!on; plainFloor.visible = !on; }
  // the reflection is drawn at half the canvas's resolution: it is softened anyway, and it costs a second pass
  function resize(w, h) {
    const rw = Math.max(64, Math.round(w * 0.5)), rh = Math.max(64, Math.round(h * 0.5));
    reflector.getRenderTarget().setSize(rw, rh);
    reflector.material.uniforms.uTexel.value.set(1 / rw, 1 / rh);
  }
  return { group, env: ENV, update, setReflect, resize, reflector, props };
}
