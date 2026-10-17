// Procedural cartoon props (built from primitives so they share the toon look and cost almost nothing).
import * as THREE from 'three';
import { toon, paintedMat, canvasTexture, textTexture } from '../engine/toon.js';

export function mesh(geo, mat, x = 0, y = 0, z = 0, parent = null) {
  const m = new THREE.Mesh(geo, typeof mat === 'number' ? toon(mat) : mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}

const cyl = (rt, rb, h, s = 12) => new THREE.CylinderGeometry(rt, rb, h, s);
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const sph = (r, a = 12, b = 9) => new THREE.SphereGeometry(r, a, b);

// striped beach parasol
export function parasol(c1 = '#ff7458', c2 = '#fff4e2', h = 2.4, r = 1.4) {
  const g = new THREE.Group();
  mesh(cyl(0.035, 0.035, h, 8), 0xf4efe6, 0, h / 2, 0, g);
  const tex = canvasTexture(256, 32, (x, w, hh) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? c2 : c1; x.fillRect(i * w / 8, 0, w / 8, hh); } });
  const top = mesh(new THREE.ConeGeometry(r, 0.55, 16, 1, true), toon(0xffffff, { map: tex, side: THREE.DoubleSide, unique: true }), 0, h, 0, g);
  top.castShadow = true;
  mesh(sph(0.06), 0xffffff, 0, h + 0.28, 0, g);
  return g;
}

export function lampPost(h = 3.2) {
  const g = new THREE.Group();
  const iron = toon(0x2a2a3a);
  mesh(cyl(0.12, 0.16, 0.3, 10), iron, 0, 0.15, 0, g);
  mesh(cyl(0.05, 0.06, h, 8), iron, 0, h / 2, 0, g);
  mesh(box(0.34, 0.06, 0.34), iron, 0, h, 0, g);
  const glass = mesh(cyl(0.16, 0.12, 0.42, 8), toon(0xfff1b0, { emissive: 0xffc860, emissiveIntensity: 0.6 }), 0, h + 0.25, 0, g);
  glass.castShadow = false;
  g.userData.glass = glass;
  mesh(new THREE.ConeGeometry(0.24, 0.22, 8), iron, 0, h + 0.56, 0, g);
  return g;
}

export function flamingoFloat(s = 1) {
  const g = new THREE.Group();
  const pink = toon(0xff8fb1);
  const ring = mesh(new THREE.TorusGeometry(0.62, 0.26, 12, 24), pink, 0, 0.12, 0, g);
  ring.rotation.x = Math.PI / 2;
  const neck = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.2, -0.55), new THREE.Vector3(0, 0.7, -0.75), new THREE.Vector3(0, 1.2, -0.6), new THREE.Vector3(0, 1.35, -0.3),
  ]), 16, 0.1, 8), pink);
  neck.castShadow = true;
  g.add(neck);
  mesh(sph(0.17), pink, 0, 1.38, -0.25, g);
  const beak = mesh(new THREE.ConeGeometry(0.06, 0.24, 8), 0x2a2233, 0, 1.3, -0.05, g);
  beak.rotation.x = 2.2;
  for (const x of [0.1, -0.1]) mesh(sph(0.04), 0xffffff, x, 1.45, -0.18, g);
  g.scale.setScalar(s);
  return g;
}

export function lifeguardChair() {
  const g = new THREE.Group();
  const wood = paintedMat('wood', 0xffffff);
  const white = toon(0xffffff);
  for (const [x, z] of [[-0.45, -0.4], [0.45, -0.4], [-0.45, 0.4], [0.45, 0.4]]) {
    const leg = mesh(box(0.1, 2.2, 0.1), white, x * 0.9, 1.1, z * 0.9, g);
    leg.rotation.z = -x * 0.08;
  }
  for (let i = 0; i < 4; i++) mesh(box(0.9, 0.05, 0.12), wood, 0, 0.35 + i * 0.4, 0.42, g);
  mesh(box(1.0, 0.1, 0.9), wood, 0, 2.2, 0, g);
  mesh(box(1.0, 0.8, 0.08), wood, 0, 2.6, -0.42, g);
  for (const x of [-0.48, 0.48]) mesh(box(0.06, 0.06, 0.8), white, x, 2.55, 0, g);
  const p = parasol('#ff3355', '#ffffff', 1.4, 0.8);
  p.position.set(0.4, 2.2, -0.35);
  g.add(p);
  const tex = textTexture(['MAÎTRE', 'NAGEUR'], { w: 256, h: 128, bg: '#ff3355', fg: '#ffffff', font: '800 44px Poppins', border: '#ffffff' });
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), toon(0xffffff, { map: tex, unique: true }));
  s.position.set(0, 2.62, -0.37);
  g.add(s);
  return g;
}

// thatched tiki bar; returns { group, counterTop }
export function tikiBar(w = 4, d = 2.4) {
  const g = new THREE.Group();
  const bamboo = toon(0xd9b46a);
  const straw = toon(0xe8c879);
  for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) mesh(cyl(0.09, 0.1, 3, 8), bamboo, x, 1.5, z, g);
  const roof = mesh(new THREE.ConeGeometry(Math.hypot(w, d) * 0.62, 1.5, 4, 1), straw, 0, 3.6, 0, g);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(w / d * 0.9, 1, 1);
  // fringe
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const f = mesh(new THREE.ConeGeometry(0.15, 0.5, 4), straw, Math.cos(a) * w * 0.66, 2.85, Math.sin(a) * d * 0.68, g);
    f.rotation.x = Math.PI;
  }
  const counter = mesh(box(w - 0.3, 1.1, 0.6), bamboo, 0, 0.55, d / 2 - 0.4, g);
  mesh(box(w - 0.1, 0.08, 0.8), paintedMat('wood'), 0, 1.12, d / 2 - 0.4, g);
  for (let i = 0; i < 9; i++) mesh(cyl(0.05, 0.05, 1.1, 6), toon(0xc9a24a), -w / 2 + 0.35 + i * (w - 0.7) / 8, 0.55, d / 2 - 0.08, g);
  mesh(box(w - 0.4, 1.1, 0.3), paintedMat('wood'), 0, 1.6, -d / 2 + 0.25, g); // back shelf
  return { group: g, counter };
}

export function beachHut(color = '#24a7a0') {
  const g = new THREE.Group();
  const tex = canvasTexture(128, 128, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#fff6ea' : color; x.fillRect(i * w / 8, 0, w / 8, h); } });
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(1.5, 1);
  const m = toon(0xffffff, { map: tex, unique: true });
  mesh(box(1.8, 2.2, 1.8), m, 0, 1.1, 0, g);
  const roof = mesh(new THREE.ConeGeometry(1.5, 0.9, 4), toon(0xfff6ea), 0, 2.65, 0, g);
  roof.rotation.y = Math.PI / 4;
  mesh(box(0.8, 1.7, 0.05), toon(0xfff6ea), 0, 0.95, 0.91, g);
  mesh(sph(0.04), 0xffc23d, 0.28, 0.95, 0.95, g);
  return g;
}

export function lighthouse() {
  const g = new THREE.Group();
  const red = toon(0xe8473f);
  const white = toon(0xfff6ea);
  const n = 5;
  for (let i = 0; i < n; i++) {
    const r0 = 1.6 - i * 0.18;
    mesh(cyl(r0 - 0.18, r0, 2.2, 16), i % 2 ? red : white, 0, 1.1 + i * 2.2, 0, g);
  }
  const top = n * 2.2;
  mesh(cyl(1.3, 1.3, 0.25, 16), toon(0x2a2a3a), 0, top + 0.12, 0, g);
  const lamp = mesh(cyl(0.7, 0.7, 1.2, 12), toon(0xfff1b0, { emissive: 0xffd36e, emissiveIntensity: 0.8, transparent: true, opacity: 0.85 }), 0, top + 0.85, 0, g);
  lamp.castShadow = false;
  mesh(new THREE.ConeGeometry(1.0, 0.9, 12), red, 0, top + 1.9, 0, g);
  mesh(sph(0.15), 0xffc23d, 0, top + 2.45, 0, g);
  // balcony ring
  const ring = mesh(new THREE.TorusGeometry(1.25, 0.05, 6, 24), toon(0x2a2a3a), 0, top + 0.6, 0, g);
  ring.rotation.x = Math.PI / 2;
  mesh(box(0.7, 1.4, 0.1), toon(0x6b3a24), 0, 0.7, 1.58, g);
  // rotating beam
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.8, 14, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1b0, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }));
  beam.rotation.z = Math.PI / 2;
  beam.position.x = 7;
  const pivot = new THREE.Group();
  pivot.position.y = top + 0.85;
  pivot.add(beam);
  g.add(pivot);
  g.userData.beam = pivot;
  return g;
}

export function sandcastle() {
  const g = new THREE.Group();
  const sand = toon(0xe8c685);
  mesh(box(1.6, 0.4, 1.6), sand, 0, 0.2, 0, g);
  for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) {
    mesh(cyl(0.25, 0.3, 0.8, 10), sand, x, 0.4, z, g);
    mesh(new THREE.ConeGeometry(0.28, 0.35, 10), sand, x, 0.98, z, g);
  }
  mesh(box(0.9, 0.9, 0.9), sand, 0, 0.85, 0, g);
  mesh(cyl(0.3, 0.35, 0.6, 10), sand, 0, 1.6, 0, g);
  const flag = mesh(box(0.3, 0.18, 0.02), 0xff7458, 0.17, 2.15, 0, g);
  flag.castShadow = false;
  mesh(cyl(0.015, 0.015, 0.7, 6), 0xffffff, 0, 2.0, 0, g);
  mesh(box(0.35, 0.45, 0.05), toon(0x9c6d3a), 0, 0.62, 0.46, g);
  return g;
}

export function scarecrow() {
  const g = new THREE.Group();
  const wood = paintedMat('wood');
  mesh(box(0.12, 2.2, 0.12), wood, 0, 1.1, 0, g);
  mesh(box(1.6, 0.1, 0.1), wood, 0, 1.6, 0, g);
  const shirt = toon(0xe8473f);
  mesh(box(0.6, 0.7, 0.32), shirt, 0, 1.45, 0, g);
  for (const s of [-1, 1]) mesh(box(0.55, 0.22, 0.24), shirt, s * 0.55, 1.62, 0, g);
  for (const s of [-1, 1]) {
    const straw = mesh(new THREE.ConeGeometry(0.1, 0.3, 6), toon(0xe8c879), s * 0.9, 1.6, 0, g);
    straw.rotation.z = s * Math.PI / 2;
  }
  const head = mesh(sph(0.26), toon(0xf2d9a2), 0, 2.05, 0, g);
  head.scale.set(1, 1.1, 1);
  for (const x of [-0.09, 0.09]) mesh(sph(0.04), 0x2a2233, x, 2.1, 0.23, g);
  const mouth = mesh(new THREE.TorusGeometry(0.08, 0.015, 6, 12, Math.PI), toon(0x2a2233), 0, 1.98, 0.24, g);
  mouth.rotation.z = Math.PI;
  mesh(cyl(0.38, 0.38, 0.04, 16), toon(0xc9a24a), 0, 2.27, 0, g);
  mesh(cyl(0.2, 0.22, 0.25, 14), toon(0xc9a24a), 0, 2.4, 0, g);
  // sunglasses: he IS on holiday
  const shades = toon(0x1a1420);
  for (const x of [-0.09, 0.09]) mesh(cyl(0.07, 0.07, 0.03, 12), shades, x, 2.1, 0.25, g).rotation.x = Math.PI / 2;
  mesh(box(0.08, 0.02, 0.02), shades, 0, 2.11, 0.26, g);
  return g;
}

export function greenhouse(w = 4, d = 3, h = 2.6) {
  const g = new THREE.Group();
  const frame = toon(0xffffff);
  const glass = toon(0xbfe9ff, { transparent: true, opacity: 0.28, side: THREE.DoubleSide, rim: false });
  const gl = mesh(box(w, h, d), glass, 0, h / 2, 0, g);
  gl.castShadow = false;
  const roof = mesh(new THREE.CylinderGeometry(0.01, d / 1.6, 1, 4, 1), glass, 0, h + 0.5, 0, g);
  roof.rotation.y = Math.PI / 4;
  roof.scale.x = w / d;
  roof.castShadow = false;
  for (const x of [-w / 2, 0, w / 2]) for (const z of [-d / 2, d / 2]) mesh(box(0.06, h, 0.06), frame, x, h / 2, z, g);
  for (const z of [-d / 2, d / 2]) mesh(box(w, 0.06, 0.06), frame, 0, h, z, g);
  for (const x of [-w / 2, w / 2]) mesh(box(0.06, 0.06, d), frame, x, h, 0, g);
  return g;
}

export function tomatoPlant(fruits = 3) {
  const g = new THREE.Group();
  mesh(cyl(0.015, 0.015, 1.2, 5), toon(0x9c6d3a), 0, 0.6, 0, g);
  const leaf = toon(0x4f9e3a);
  for (let i = 0; i < 6; i++) {
    const l = mesh(sph(0.16, 8, 6), leaf, Math.cos(i * 2.1) * 0.12, 0.3 + i * 0.15, Math.sin(i * 2.1) * 0.12, g);
    l.scale.set(1.2, 0.5, 0.8);
  }
  g.userData.fruits = [];
  for (let i = 0; i < fruits; i++) {
    const t = mesh(sph(0.075, 10, 8), toon(0xe8352b), Math.cos(i * 2.4 + 1) * 0.16, 0.45 + i * 0.22, Math.sin(i * 2.4 + 1) * 0.16, g);
    g.userData.fruits.push(t);
  }
  return g;
}

export function raisedBed(w = 3, d = 1.2) {
  const g = new THREE.Group();
  mesh(box(w, 0.4, d), paintedMat('wood'), 0, 0.2, 0, g);
  mesh(box(w - 0.15, 0.05, d - 0.15), toon(0x6b4a2e), 0, 0.41, 0, g);
  return g;
}

export function bench() {
  const g = new THREE.Group();
  const wood = paintedMat('wood');
  const iron = toon(0x2a2a3a);
  for (let i = 0; i < 3; i++) mesh(box(1.8, 0.05, 0.12), wood, 0, 0.45, -0.18 + i * 0.16, g);
  for (let i = 0; i < 2; i++) mesh(box(1.8, 0.12, 0.04), wood, 0, 0.7 + i * 0.18, -0.3, g);
  for (const x of [-0.75, 0.75]) { mesh(box(0.06, 0.45, 0.5), iron, x, 0.22, -0.05, g); mesh(box(0.06, 0.5, 0.06), iron, x, 0.7, -0.3, g); }
  return g;
}

export function towel(color = '#ff7458', w = 0.9, l = 1.8) {
  const tex = canvasTexture(64, 128, (x, ww, hh) => { x.fillStyle = color; x.fillRect(0, 0, ww, hh); x.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++) x.fillRect(0, 14 + i * 32, ww, 8); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), toon(0xffffff, { map: tex, unique: true, rim: false }));
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  return m;
}

// low-poly animal statues on a pedestal; they face +Z at rotation 0
export function statue(kind, stone = 0xf1ece2) {
  const g = new THREE.Group();
  const m = toon(stone);
  const ped = mesh(box(1.1, 1.0, 1.1), toon(0xd9c9ad), 0, 0.5, 0, g);
  ped.userData.pedestal = true;
  mesh(box(1.25, 0.12, 1.25), toon(0xe8dcc4), 0, 1.04, 0, g);
  const a = new THREE.Group();
  a.position.y = 1.1;
  g.add(a);
  if (kind === 'dauphin') {
    const body = mesh(sph(0.3, 14, 10), m, 0, 0.75, 0, a);
    body.scale.set(0.8, 1.5, 1.05);
    body.rotation.x = 0.5;
    const snout = mesh(new THREE.ConeGeometry(0.12, 0.4, 10), m, 0, 1.15, 0.38, a);
    snout.rotation.x = 1.2;
    const fin = mesh(new THREE.ConeGeometry(0.12, 0.3, 4), m, 0, 0.95, -0.25, a);
    fin.rotation.x = -0.6;
    const tail = mesh(box(0.55, 0.08, 0.25), m, 0, 0.22, -0.2, a);
    tail.rotation.x = 0.4;
    mesh(cyl(0.12, 0.2, 0.3, 10), m, 0, 0.15, 0, a);
    for (const x of [-0.13, 0.13]) mesh(sph(0.04), 0x2a2233, x, 1.05, 0.3, a);
  } else if (kind === 'tortue') {
    const shell = mesh(new THREE.SphereGeometry(0.42, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), m, 0, 0.12, 0, a);
    shell.scale.y = 0.8;
    mesh(cyl(0.44, 0.44, 0.1, 16), m, 0, 0.1, 0, a);
    const head = mesh(sph(0.15), m, 0, 0.28, 0.52, a);
    head.scale.z = 1.3;
    for (const [x, z] of [[-0.3, 0.28], [0.3, 0.28], [-0.3, -0.28], [0.3, -0.28]]) mesh(sph(0.1), m, x, 0.05, z, a);
    for (const x of [-0.07, 0.07]) mesh(sph(0.03), 0x2a2233, x, 0.33, 0.66, a);
  } else if (kind === 'flamant') {
    const body = mesh(sph(0.28, 14, 10), m, 0, 0.95, -0.05, a);
    body.scale.set(0.8, 0.75, 1.25);
    for (const x of [-0.07, 0.07]) mesh(cyl(0.025, 0.025, 0.8, 6), m, x, 0.4, 0, a);
    const neck = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.0, 0.25), new THREE.Vector3(0, 1.4, 0.35), new THREE.Vector3(0, 1.7, 0.2), new THREE.Vector3(0, 1.8, 0.35)]), 12, 0.05, 8), m);
    neck.castShadow = true;
    a.add(neck);
    mesh(sph(0.11), m, 0, 1.82, 0.38, a);
    const beak = mesh(new THREE.ConeGeometry(0.04, 0.18, 8), m, 0, 1.75, 0.5, a);
    beak.rotation.x = 2.1;
  } else if (kind === 'lion') {
    const body = mesh(sph(0.3, 14, 10), m, 0, 0.42, -0.1, a);
    body.scale.set(0.9, 0.85, 1.4);
    const mane = mesh(sph(0.32, 14, 10), m, 0, 0.78, 0.22, a);
    mane.scale.set(1.1, 1.05, 0.8);
    const face = mesh(sph(0.2, 12, 9), m, 0, 0.74, 0.42, a);
    face.scale.z = 0.8;
    for (const x of [-0.08, 0.08]) mesh(sph(0.03), 0x2a2233, x, 0.8, 0.56, a);
    mesh(sph(0.04), 0x2a2233, 0, 0.72, 0.6, a);
    for (const [x, z] of [[-0.18, 0.25], [0.18, 0.25]]) mesh(cyl(0.08, 0.09, 0.42, 8), m, x, 0.21, z, a);
    const tail = mesh(cyl(0.03, 0.03, 0.5, 6), m, 0, 0.5, -0.55, a);
    tail.rotation.x = -0.8;
  }
  g.userData.animal = a;
  return g;
}

// stone fountain with basin, tiers and a water surface (water mesh returned for draining)
export function fountain(r = 3) {
  const g = new THREE.Group();
  const stone = paintedMat('paving', 0xf6efe2);
  const rim = mesh(new THREE.TorusGeometry(r, 0.28, 8, 40), stone, 0, 0.55, 0, g);
  rim.rotation.x = Math.PI / 2;
  mesh(cyl(r, r + 0.15, 0.6, 40), toon(0xd9c9ad), 0, 0.3, 0, g).material = toon(0xd9c9ad);
  const inner = mesh(cyl(r - 0.05, r - 0.05, 0.62, 40, 1), toon(0x3fb7c9), 0, 0.31, 0, g);
  inner.material = toon(0x2f8fa8);
  mesh(cyl(0.45, 0.6, 1.6, 14), stone, 0, 1.4, 0, g);
  const tier1 = mesh(cyl(1.3, 0.5, 0.35, 24), stone, 0, 2.2, 0, g);
  mesh(cyl(0.22, 0.3, 0.9, 12), stone, 0, 2.8, 0, g);
  mesh(cyl(0.7, 0.3, 0.25, 20), stone, 0, 3.3, 0, g);
  mesh(sph(0.22), toon(0xffc23d), 0, 3.6, 0, g);
  return { group: g, tier1 };
}

// yellow water slide along a curve (decorative tube with stripes)
export function slide(points) {
  const curve = new THREE.CatmullRomCurve3(points);
  const tex = canvasTexture(64, 256, (x, w, h) => { x.fillStyle = '#ffc23d'; x.fillRect(0, 0, w, h); x.fillStyle = '#ff7458'; for (let i = 0; i < 8; i++) x.fillRect(0, i * 32, w, 10); });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 6);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.55, 14, false), toon(0xffffff, { map: tex, unique: true, side: THREE.DoubleSide }));
  tube.castShadow = true;
  const g = new THREE.Group();
  g.add(tube);
  // support posts
  for (let k = 0.15; k < 0.95; k += 0.2) {
    const p = curve.getPoint(k);
    if (p.y < 1.2) continue;
    mesh(cyl(0.08, 0.08, p.y, 8), toon(0xffffff), p.x, p.y / 2, p.z, g);
  }
  g.userData.curve = curve;
  return g;
}

// wrought-iron gate leaf material (bars with transparency)
let gateTex = null;
export function gateMaterial() {
  if (!gateTex) {
    gateTex = canvasTexture(128, 256, (x, w, h) => {
      x.clearRect(0, 0, w, h);
      x.fillStyle = '#2a2a3a';
      for (let i = 0; i < 7; i++) x.fillRect(6 + i * 19, 0, 7, h);
      x.fillRect(0, 0, w, 12); x.fillRect(0, h - 12, w, 12); x.fillRect(0, h * 0.55, w, 9);
      x.strokeStyle = '#ffc23d'; x.lineWidth = 6;
      for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(22 + i * 42, h * 0.3, 14, 0, Math.PI * 2); x.stroke(); }
    });
  }
  const m = toon(0xffffff, { map: gateTex, side: THREE.DoubleSide, unique: true, rim: false });
  m.alphaTest = 0.5;
  return m;
}

export function hedgeBlock(b, x0, z0, x1, z1, h = 1.6, t = 1.0) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const ang = Math.atan2(z1 - z0, x1 - x0);
  const m = b.box((x0 + x1) / 2, 0, (z0 + z1) / 2, len, h, t, paintedMat('hedge'), { rot: -ang });
  return m;
}
