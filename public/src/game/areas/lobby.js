// Grand hall, reception, staircase, mezzanine & first-floor corridor. Puzzle L1–L2 (hymn → piano → cuckoo → hall key).
import * as THREE from 'three';
import { toon, paintedMat, canvasTexture, textTexture } from '../../engine/toon.js';
import { makeNPC } from '../../engine/player.js';
import { Y1, ROOF, LOBBY_TOP } from '../hotel.js';
import { mesh } from '../props.js';
import { ITEMS, star } from '../items.js';
import { pickup, duckSpot, biscuitSpot, readable, lockedDoor, dyn, V3 } from '../puzzle.js';

export const LOBBY_MODELS = [
  'furniture-kit/loungeSofa', 'furniture-kit/loungeSofaLong', 'furniture-kit/loungeChair', 'furniture-kit/loungeDesignChair', 'furniture-kit/tableCoffeeGlass', 'furniture-kit/rugRound', 'furniture-kit/rugRectangle',
  'furniture-kit/pottedPlant', 'furniture-kit/lampRoundFloor', 'furniture-kit/sideTable', 'furniture-kit/books', 'furniture-kit/coatRackStanding', 'furniture-kit/lampWall', 'furniture-kit/plantSmall1', 'furniture-kit/bench',
  'mini-characters/character-male-c', 'mini-characters/character-female-d',
];

export const NOTES = [
  { n: 'Do', f: 261.63, c: '#ff5a5a' }, { n: 'Ré', f: 293.66, c: '#ff9a3c' }, { n: 'Mi', f: 329.63, c: '#ffd23c' }, { n: 'Fa', f: 349.23, c: '#5fd068' },
  { n: 'Sol', f: 392.0, c: '#4fb3ff' }, { n: 'La', f: 440.0, c: '#7a6cff' }, { n: 'Si', f: 493.88, c: '#d36cff' },
];
export const HYMN = ['Sol', 'Mi', 'Do', 'Mi', 'Ré', 'Sol'];

function grandPiano() {
  const g = new THREE.Group();
  const black = toon(0x1f1b2a);
  // body outline (curved grand piano shape), keyboard side at +z
  const s = new THREE.Shape();
  s.moveTo(-0.75, 0.0);
  s.lineTo(0.75, 0.0);
  s.lineTo(0.75, -0.9);
  s.bezierCurveTo(0.75, -1.4, 0.3, -1.3, 0.15, -1.75);
  s.bezierCurveTo(0.05, -2.0, -0.3, -2.05, -0.55, -1.95);
  s.bezierCurveTo(-0.75, -1.85, -0.75, -1.6, -0.75, -1.4);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.32, bevelEnabled: false });
  geo.rotateX(Math.PI / 2);
  const body = mesh(geo, black, 0, 1.0, 0, g);
  body.position.y = 1.0;
  const lid = mesh(new THREE.ShapeGeometry(s), toon(0x2a2538, { side: THREE.DoubleSide }), 0, 1.0, 0, g);
  lid.rotation.x = -Math.PI / 2;
  const lidPivot = new THREE.Group();
  lidPivot.position.set(-0.75, 1.0, 0);
  lid.position.set(0.75, 0, 0);
  lidPivot.add(lid);
  lidPivot.rotation.z = 0.7;
  g.add(lidPivot);
  for (const [x, z] of [[-0.65, -0.1], [0.65, -0.1], [-0.3, -1.75]]) mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.68, 8), black, x, 0.34, z, g);
  mesh(new THREE.BoxGeometry(1.5, 0.12, 0.3), black, 0, 0.78, 0.13, g); // key bed
  mesh(new THREE.BoxGeometry(1.5, 0.05, 0.05), toon(0xc9a24a), 0, 0.86, 0.29, g);
  // music stand with an erased sheet
  const stand = mesh(new THREE.BoxGeometry(0.6, 0.32, 0.02), black, 0, 1.18, -0.08, g);
  stand.rotation.x = -0.25;
  const sheet = mesh(new THREE.PlaneGeometry(0.5, 0.28), toon(0xffffff, { map: textTexture(['♪  ?  ?  ?  ?  ?  ?', '(partition effacée)'], { w: 256, h: 144, bg: '#fffaf0', fg: '#7f6a5a', font: '600 22px Poppins', border: null }), unique: true }), 0, 1.19, -0.065, g);
  sheet.rotation.x = -0.25;
  // keys: 7 white + 5 black, centred, front edge at z=0.28
  const keys = [];
  const kw = 0.105;
  NOTES.forEach((nt, i) => {
    const x = (i - 3) * kw;
    const tex = canvasTexture(64, 192, (c, w, h) => { c.fillStyle = '#fffaf0'; c.fillRect(0, 0, w, h); c.fillStyle = nt.c; c.fillRect(6, h - 70, w - 12, 60); c.fillStyle = '#2a2233'; c.font = '800 24px Poppins'; c.textAlign = 'center'; c.fillText(nt.n, w / 2, h - 32); });
    const k = mesh(new THREE.BoxGeometry(kw - 0.008, 0.035, 0.26), [toon(0xfffaf0), toon(0xfffaf0), toon(0xffffff, { map: tex, unique: true, rim: false }), toon(0xfffaf0), toon(0xfffaf0), toon(0xfffaf0)], x, 0.85, 0.15, g);
    keys.push({ mesh: k, note: nt, base: 0.85 });
  });
  [0, 1, 3, 4, 5].forEach((i, j) => {
    const x = (i - 3) * kw + kw / 2;
    const k = mesh(new THREE.BoxGeometry(0.06, 0.04, 0.16), toon(0x1a1420), x, 0.885, 0.1, g);
    const f = [277.18, 311.13, 369.99, 415.3, 466.16][j];
    keys.push({ mesh: k, note: { n: ['Do♯', 'Ré♯', 'Fa♯', 'Sol♯', 'La♯'][j], f }, base: 0.885 });
  });
  const bench = mesh(new THREE.BoxGeometry(0.9, 0.08, 0.38), toon(0x1f1b2a), 0, 0.5, 0.75, g);
  for (const x of [-0.38, 0.38]) for (const z of [0.6, 0.9]) mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), black, x, 0.25, z, g);
  bench.castShadow = true;
  g.userData.keys = keys;
  return g;
}

function cuckooClock() {
  const g = new THREE.Group();
  const wood = paintedMat('wood', 0xffd2a8);
  mesh(new THREE.BoxGeometry(0.7, 0.8, 0.3), wood, 0, 0.4, 0, g);
  for (const s of [-1, 1]) {
    const r = mesh(new THREE.BoxGeometry(0.5, 0.06, 0.4), toon(0x8a4f2a), s * 0.2, 0.92, 0.02, g);
    r.rotation.z = -s * 0.65;
  }
  mesh(new THREE.ConeGeometry(0.05, 0.12, 6), toon(0x5fa84a), 0, 1.13, 0.12, g);
  const face = canvasTexture(128, 128, (x) => {
    x.fillStyle = '#fffaf0'; x.beginPath(); x.arc(64, 64, 60, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#2a2233'; x.lineWidth = 6; x.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; x.beginPath(); x.moveTo(64 + Math.cos(a) * 48, 64 + Math.sin(a) * 48); x.lineTo(64 + Math.cos(a) * 56, 64 + Math.sin(a) * 56); x.stroke(); }
    x.beginPath(); x.moveTo(64, 64); x.lineTo(64, 26); x.moveTo(64, 64); x.lineTo(90, 70); x.stroke();
  });
  mesh(new THREE.CircleGeometry(0.2, 24), toon(0xffffff, { map: face, unique: true, rim: false }), 0, 0.35, 0.155, g).castShadow = false;
  // little door + bird
  const door = new THREE.Group();
  door.position.set(-0.08, 0.62, 0.155);
  g.add(door);
  mesh(new THREE.BoxGeometry(0.16, 0.16, 0.02), toon(0x6b3a24), 0.08, 0, 0, door);
  mesh(new THREE.BoxGeometry(0.15, 0.15, 0.01), toon(0x1a1420), 0, 0.62, 0.15, g);
  const bird = new THREE.Group();
  bird.position.set(0, 0.62, 0.05);
  g.add(bird);
  mesh(new THREE.SphereGeometry(0.06, 10, 8), toon(0xffc23d), 0, 0, 0, bird);
  mesh(new THREE.ConeGeometry(0.02, 0.06, 6), toon(0xff7a2a), 0, 0, 0.07, bird).rotation.x = Math.PI / 2;
  // pendulum & weights
  const pend = new THREE.Group();
  pend.position.set(0, 0.02, 0.1);
  g.add(pend);
  mesh(new THREE.BoxGeometry(0.015, 0.6, 0.01), toon(0xc9a24a), 0, -0.3, 0, pend);
  mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.015, 14), toon(0xc9a24a), 0, -0.6, 0.01, pend).rotation.x = Math.PI / 2;
  for (const x of [-0.18, 0.18]) {
    mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.5, 4), toon(0x2a2233), x, -0.25, 0.08, g);
    mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.14, 8), toon(0x6b3a24), x, -0.55, 0.08, g);
  }
  g.userData = { door, bird, pend };
  return g;
}

function chandelier() {
  const g = new THREE.Group();
  const gold = toon(0xe9c46a, { emissive: 0x3a2a00 });
  mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 6), gold, 0, 0.8, 0, g);
  for (const [r, y, n] of [[1.1, 0, 10], [0.6, 0.5, 6]]) {
    const ring = mesh(new THREE.TorusGeometry(r, 0.04, 6, 32), gold, 0, y, 0, g);
    ring.rotation.x = Math.PI / 2;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 6), toon(0xfffaf0), Math.cos(a) * r, y + 0.1, Math.sin(a) * r, g);
      const fl = mesh(new THREE.SphereGeometry(0.045, 8, 6), toon(0xffe9a8, { emissive: 0xffc860, emissiveIntensity: 1 }), Math.cos(a) * r, y + 0.22, Math.sin(a) * r, g);
      fl.castShadow = false;
      const drop = mesh(new THREE.OctahedronGeometry(0.05), toon(0xdff8ff, { emissive: 0x335566 }), Math.cos(a + 0.3) * r, y - 0.15, Math.sin(a + 0.3) * r, g);
      drop.castShadow = false;
    }
  }
  mesh(new THREE.SphereGeometry(0.15, 10, 8), gold, 0, -0.25, 0, g);
  return g;
}

function luggageCart() {
  const g = new THREE.Group();
  const brass = toon(0xe9c46a);
  mesh(new THREE.BoxGeometry(1.2, 0.08, 0.7), toon(0xa8323a), 0, 0.25, 0, g);
  for (const x of [-0.58, 0.58]) {
    mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.7, 8), brass, x, 1.1, 0, g);
  }
  const top = mesh(new THREE.TorusGeometry(0.58, 0.025, 6, 20, Math.PI), brass, 0, 1.95, 0, g);
  top.rotation.z = 0;
  for (const [x, z] of [[-0.5, -0.3], [0.5, -0.3], [-0.5, 0.3], [0.5, 0.3]]) mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 10), toon(0x2a2233), x, 0.08, z, g).rotation.x = Math.PI / 2;
  const cols = [0x24a7a0, 0xff7458, 0xffc23d, 0x8a4f2a];
  [[-0.25, 0.29, 0.62, 0.42], [0.25, 0.29, 0.5, 0.36], [-0.2, 0.72, 0.5, 0.3], [0.2, 0.68, 0.44, 0.26]].forEach(([x, y, w, h], i) => {
    mesh(new THREE.BoxGeometry(w, h, 0.5), cols[i], x, y + h / 2, 0, g);
    mesh(new THREE.BoxGeometry(0.16, 0.04, 0.04), toon(0x2a2233), x, y + h + 0.02, 0, g);
  });
  return g;
}

function musicBox() {
  const g = new THREE.Group();
  mesh(new THREE.BoxGeometry(0.34, 0.18, 0.24), paintedMat('wood', 0xff9fb6), 0, 0.09, 0, g);
  const lid = mesh(new THREE.BoxGeometry(0.34, 0.03, 0.24), toon(0xffc23d), 0, 0.2, -0.08, g);
  lid.rotation.x = -1.1;
  mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.08, 6), toon(0xc9a24a), 0.19, 0.09, 0, g).rotation.z = Math.PI / 2;
  const dancer = new THREE.Group();
  dancer.position.set(0, 0.2, 0.02);
  g.add(dancer);
  mesh(new THREE.ConeGeometry(0.04, 0.08, 10), toon(0xff8fb1), 0, 0.04, 0, dancer);
  mesh(new THREE.SphereGeometry(0.018, 8, 6), toon(0xf2c9a8), 0, 0.1, 0, dancer);
  g.userData.dancer = dancer;
  return g;
}

function hymnSheet() {
  return canvasTexture(512, 360, (x, W, H) => {
    x.fillStyle = '#fffaf0'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#8a3b2a'; x.font = '400 40px Pacifico'; x.textAlign = 'center'; x.fillText('Hymne des Mirages', W / 2, 52);
    x.strokeStyle = '#2a2233'; x.lineWidth = 2;
    for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(30, 120 + i * 16); x.lineTo(W - 30, 120 + i * 16); x.stroke(); }
    const pos = { Do: 200, Ré: 192, Mi: 184, Fa: 176, Sol: 168, La: 160, Si: 152 };
    HYMN.forEach((n, i) => {
      const cx = 90 + i * 68;
      const cy = pos[n] - 40;
      const nt = NOTES.find((q) => q.n === n);
      x.fillStyle = nt.c; x.beginPath(); x.ellipse(cx, cy, 13, 10, -0.4, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#2a2233'; x.lineWidth = 3; x.stroke();
      x.beginPath(); x.moveTo(cx + 12, cy); x.lineTo(cx + 12, cy - 52); x.stroke();
      x.fillStyle = '#2a2233'; x.font = '800 26px Poppins'; x.fillText(n, cx, 250);
    });
    x.font = 'italic 600 20px Poppins'; x.fillStyle = '#5a4a3a';
    x.fillText('« Aux Mirages, on vient… et on reste ! »', W / 2, 310);
  });
}

export function buildLobby(game, b, hotel) {
  const L = {};
  const st = game.state;
  // ------------------------------------------------ staircase, mezzanine railings
  b.stairs(6.7, -28.5, 2.2, 7.5, Y1 - 0.05, 0, paintedMat('carpet'), 0.05);
  b.surface(5.6, -36, 7.8, -28.5, 'carpet', -1, 6);
  const brass = toon(0xe9c46a);
  const post = (x, y, z, h = 1.0) => mesh(new THREE.CylinderGeometry(0.035, 0.045, h, 8), brass, x, y + h / 2, z, b.root);
  for (let x = -7.8; x <= 5.5; x += 0.45) post(x, Y1, -36.05, 1.0);
  b.box(-1.15, Y1 + 1.0, -36.05, 13.4, 0.08, 0.12, brass, { collide: false });
  game.physics.addBox(-1.15, Y1 + 0.6, -36.05, 13.4, 1.2, 0.2);
  // stair handrail (west side, sloped)
  const n = 16;
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    post(5.55, 0.05 + k * (Y1 - 0.05), -28.5 - k * 7.5, 1.0);
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, Math.hypot(7.5, Y1)), brass);
  rail.position.set(5.55, 1.05 + Y1 / 2, -32.25);
  rail.rotation.x = Math.atan2(Y1, 7.5);
  b.root.add(rail);
  game.physics.addBox(5.5, 2.4, -32.25, 0.15, 5, 7.5);
  b.box(6.7, 0, -36.2, 2.2, Y1 - 0.3, 0.1, paintedMat('stucco', 0xfff4e0), { collide: false });
  // columns
  for (const [x, z] of [[-4.6, -21], [4.4, -21], [-4.6, -31], [3.8, -26.8]]) b.column(x, z, 0.32, LOBBY_TOP, 0xfff4e0, 0.05);
  // chandelier
  const ch = chandelier();
  ch.position.set(-0.6, LOBBY_TOP - 2.2, -26.5);
  b.root.add(ch);
  b.lamp(-0.6, LOBBY_TOP - 2.6, -26.5, { intensity: 14, range: 20 });
  b.lamp(0, 3.2, -37.5, { intensity: 6, range: 10 });
  b.lamp(-1, Y1 + 2.5, -38, { intensity: 5, range: 12 });

  // ------------------------------------------------ reception desk & key board
  const desk = new THREE.Group();
  desk.position.set(0, 0.05, -37.0);
  b.root.add(desk);
  mesh(new THREE.BoxGeometry(6.0, 0.9, 0.7), paintedMat('panel', 0xffd7b0), 0, 0.45, 0, desk);
  mesh(new THREE.BoxGeometry(6.3, 0.08, 0.9), paintedMat('marble'), 0, 0.94, 0, desk);
  for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.7, 0.9, 1.6), paintedMat('panel', 0xffd7b0), s * 3.35, 0.45, -0.6, desk);
  game.physics.addBox(0, 0.5, -37.0, 6.0, 1.0, 0.7);
  for (const s of [-1, 1]) game.physics.addBox(s * 3.35, 0.5, -37.6, 0.7, 1.0, 1.6);
  // staff platform behind the desk (so the directrice towers over her guests)
  b.box(0, 0.05, -38.65, 6.0, 0.3, 2.3, paintedMat('wood', 0xd9a77f));
  const rsign = textTexture(['Réception'], { w: 512, h: 128, bg: null, border: null, fg: '#e9c46a', font: '400 76px Pacifico' });
  b.plane(0, 0.6, -36.62, 2.2, 0.55, rsign, { transparent: true });
  const bellG = new THREE.Group();
  mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 16), toon(0x2a2233), 0, 0.01, 0, bellG);
  mesh(new THREE.SphereGeometry(0.09, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(0xe9c46a, { emissive: 0x332200 }), 0, 0.02, 0, bellG);
  mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.04, 6), toon(0x2a2233), 0, 0.12, 0, bellG);
  bellG.position.set(1.4, 0.99, -36.85);
  b.root.add(dyn(bellG));
  let rings = 0;
  game.interact.add({
    pos: [1.4, 1.1, -36.6], r: 1.6, obj: bellG, label: 'Faire sonner la cloche',
    use: async (g) => {
      g.audio.sfx('bell', 0.8);
      rings++;
      if (st.flag('intro_done') && g.mode === 'play') {
        L.zzz(true);
        if (rings % 3 === 0) await g.say([{ who: 'marcel', text: 'Hein ?! Qui… Personne ne passe… zzz… Le règlement… zzz…' }]);
      }
    },
  });
  // key board on the back wall: hooks, one key missing (Suite 7)
  const kb = new THREE.Group();
  kb.position.set(-2.2, 2.0, -39.82);
  b.root.add(kb);
  mesh(new THREE.BoxGeometry(1.8, 1.0, 0.05), paintedMat('wood'), 0, 0, 0, kb);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) {
    const num = r * 6 + c + 1;
    const x = -0.72 + c * 0.29;
    const y = 0.25 - r * 0.45;
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.06, 6), brass, x, y, 0.04, kb).rotation.x = Math.PI / 2;
    const tag = textTexture([String(num)], { w: 64, h: 64, bg: '#fffaf0', fg: '#2a2233', font: '800 34px Poppins', border: '#2a2233' });
    mesh(new THREE.PlaneGeometry(0.1, 0.1), toon(0xffffff, { map: tag, unique: true, rim: false }), x, y + 0.11, 0.03, kb);
    if (num !== 7) { const k = ITEMS.key_secours.make(); k.scale.setScalar(0.8); k.rotation.set(0, 0, -Math.PI / 2 + 0.25); k.position.set(x, y - 0.1, 0.05); kb.add(k); }
  }
  readable(game, {
    pos: [-2.2, 1.6, -39.4], r: 2.2, label: 'Regarder le tableau des clés', title: 'Tableau des clés',
    html: 'Toutes les chambres sont fermées à double tour. Les clés pendent sagement à leurs crochets…\n\n…sauf celle de la <b>Suite 7</b>. Normal, c\'est la tienne. Et elle a été remplacée par une étiquette :\n\n<i>« Clé confisquée pour votre confort. — La Direction »</i>',
  });
  // cuckoo clock above the reception
  const ck = dyn(cuckooClock());
  ck.position.set(1.6, 2.3, -39.7);
  b.root.add(ck);
  L.cuckoo = ck;
  let ckT = 0;
  game.updaters.push((dt, t) => {
    ck.userData.pend.rotation.z = Math.sin(t * 3) * 0.25;
    const out = ckT > 0;
    if (out) ckT -= dt;
    const d = ck.userData.door;
    d.rotation.y += ((out ? -1.6 : 0) - d.rotation.y) * Math.min(1, dt * 10);
    const bd = ck.userData.bird;
    bd.position.z += ((out ? 0.3 : 0.05) - bd.position.z) * Math.min(1, dt * 10);
  });
  const cuckoo = (times = 2) => {
    ckT = 1.2 + times * 0.5;
    for (let i = 0; i < times; i++) {
      setTimeout(() => { game.audio.tone(784, 0.25, 0.3, 'bird'); setTimeout(() => game.audio.tone(659, 0.35, 0.3, 'bird'), 220); }, 300 + i * 600);
    }
  };
  L.cuckooSing = cuckoo;
  game.interact.add({
    pos: [1.6, 2.4, -39.3], r: 2.6, dy: 3, label: 'Examiner le coucou', obj: ck,
    use: async (g) => {
      g.state.clue('Le coucou de la réception « ne chante que pour l\'hymne des Mirages ».');
      await g.ui.note('Le coucou', 'Un vieux coucou en bois. Une plaque de laiton est vissée dessous :\n\n<b>« Je ne chante que pour l\'Hymne des Mirages. »</b>\n\nUne petite clé semble coincée dans le bec de l\'oiseau, derrière la trappe.');
    },
  });
  const hallKey = ITEMS.key_hall.make();
  hallKey.position.set(1.0, 1.0, -36.75);
  hallKey.rotation.set(-Math.PI / 2, 0, 0.6);
  b.root.add(hallKey);
  pickup(game, { id: 'key_hall', item: 'key_hall', obj: hallKey, pos: [1.0, 1.3, -36.5], visible: () => st.flag('piano') });
  game.story.onApply(() => { hallKey.visible = st.flag('piano') && !st.flag('got_key_hall'); });

  // ------------------------------------------------ piano (puzzle L2)
  const piano = dyn(grandPiano());
  piano.position.set(-4.2, 0.05, -27.2);
  piano.rotation.y = 0.35;
  b.root.add(piano);
  game.physics.addBox(-4.2 + Math.sin(0.35) * -0.9, 0.6, -27.2 + Math.cos(0.35) * -0.9, 1.6, 1.2, 2.1, 0.35);
  L.piano = piano;
  const played = [];
  const pressKey = (k) => {
    k.mesh.position.y = k.base - 0.012;
    setTimeout(() => { k.mesh.position.y = k.base; }, 160);
    game.audio.tone(k.note.f, 1.4, 0.4);
    const p = new THREE.Vector3();
    k.mesh.getWorldPosition(p);
    game.fx.floatText(p.add(V3(0, 0.12, 0)), '♪', { color: k.note.c || '#ffffff', size: 0.12, life: 1.1, rise: 0.25 });
    if (st.flag('piano')) return;
    played.push(k.note.n);
    while (played.length > HYMN.length) played.shift();
    if (played.length === HYMN.length && played.every((x, i) => x === HYMN[i])) {
      game.setFlag('piano');
      setTimeout(async () => {
        game.audio.sfx('jingle_solve', 0.6);
        game.exitInspect();
        await game.wait(0.8);
        await game.cut(async () => {
          await game.shot([1.0, 2.0, -34.6], [1.6, 2.6, -39.6], 1.1, 50);
          cuckoo(3);
          await game.wait(1.6);
          game.audio.sfx('drop', 0.6);
          hallKey.visible = true;
          game.fx.sparkle(hallKey.position.clone(), 0xffe066, 18);
          await game.say([{ who: 'gustave', text: 'Coucou ! Le coucou a recraché une clé sur le comptoir. Et toi qui pensais que les oiseaux ne servaient à rien…' }]);
        });
      }, 500);
    }
  };
  game.interact.add({
    pos: [-4.2 + Math.sin(0.35) * 0.4, 0.9, -27.2 + Math.cos(0.35) * 0.4], r: 1.8, label: 'Jouer du piano', obj: null,
    inspect: () => {
      const c = new THREE.Vector3(0, 0.85, 0.12).applyAxisAngle(V3(0, 1, 0), 0.35).add(piano.position);
      const cam = new THREE.Vector3(0, 1.6, 1.05).applyAxisAngle(V3(0, 1, 0), 0.35).add(piano.position);
      return { cam: cam.toArray(), look: c.toArray(), fov: 45, title: 'Piano à queue — clique sur les touches', clickables: () => piano.userData.keys.map((k) => ({ mesh: k.mesh, tip: k.note.n, onClick: () => pressKey(k) })) };
    },
  });

  // ------------------------------------------------ lounge furniture & decor
  const P = (nme, x, z, rot, o = {}) => b.prop(nme, x, o.y ?? 0.05, z, { rot, ...o });
  P('furniture-kit/rugRound', 0.6, -21.5, 0, { collide: false, s: 1.7 });
  P('furniture-kit/loungeSofa', 0.6, -23.4, 0);
  P('furniture-kit/loungeDesignChair', -1.7, -21.2, Math.PI / 2);
  P('furniture-kit/loungeDesignChair', 2.9, -21.2, -Math.PI / 2);
  P('furniture-kit/tableCoffeeGlass', 0.6, -21.5, 0);
  P('furniture-kit/pottedPlant', -7.4, -16.8, 0, { s: 1.4 });
  P('furniture-kit/pottedPlant', 7.4, -16.8, 0, { s: 1.4 });
  P('furniture-kit/pottedPlant', -7.4, -35.2, 0, { s: 1.4 });
  P('furniture-kit/lampRoundFloor', -6.9, -23.2, 0, { collide: false });
  P('furniture-kit/bench', -7.4, -20, Math.PI / 2);
  P('furniture-kit/coatRackStanding', 4.8, -36.0, 0, { collide: false });
  for (const [x, z, r] of [[-7.85, -19.5, Math.PI / 2], [-7.85, -33, Math.PI / 2], [7.85, -18.0, -Math.PI / 2]]) P('furniture-kit/lampWall', x, z, r, { y: 2.6, collide: false });
  const cart = dyn(luggageCart());
  cart.position.set(-5.8, 0.05, -18.4);
  cart.rotation.y = 0.4;
  b.root.add(cart);
  game.physics.addBox(-5.8, 1, -18.4, 1.3, 2, 0.9, 0.4);
  duckSpot(game, b, 'd_lobby', -5.65, 1.12, -18.4, 0.5);
  biscuitSpot(game, b, 'b_sofa', 0.2, 0.5, -23.25, 1, 'Fouiller entre les coussins du canapé');
  biscuitSpot(game, b, 'b_desk', -2.6, 0.99, -36.9, 1, 'Prendre le biscuit oublié sur le comptoir');
  // portraits & paintings on the walls
  b.frame(-7.8, 2.6, -33.4, 1.4, 1.75, canvasTexture(160, 200, (x, W, H) => {
    x.fillStyle = '#c9b6ff'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#5b5f6e'; x.beginPath(); x.ellipse(W / 2, H, W * 0.4, H * 0.32, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#f2b48c'; x.beginPath(); x.arc(W / 2, H * 0.45, 30, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#e8613b'; x.beginPath(); x.arc(W / 2, H * 0.22, 20, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#2a2233'; x.fillRect(W / 2 - 14, H * 0.43, 8, 3); x.fillRect(W / 2 + 6, H * 0.43, 8, 3); x.fillRect(W / 2 - 8, H * 0.53, 16, 2);
    x.font = '700 13px Poppins'; x.textAlign = 'center'; x.fillText('V. Pincevent, Directrice', W / 2, H - 10);
  }), Math.PI / 2, 0xc9a24a);
  b.sign(['Spa', 'Bulles de Rêve'], -7.82, 3.3, -26, Math.PI / 2, 1.5, 0.6, { font: '700 46px Poppins', bg: '#b8f0ea' });
  b.sign(['Le Homard Joyeux'], 7.82, 3.3, -21, -Math.PI / 2, 1.8, 0.45, { font: '400 50px Pacifico', bg: '#ffd0c4' });

  // ------------------------------------------------ Marcel, the sleeping night guard
  const marcel = makeNPC('character-male-c');
  marcel.root.position.set(5.5, 0.05, -18.6);
  marcel.root.rotation.y = -2.3;
  marcel.play('sit', 0);
  b.root.add(dyn(marcel.root));
  P('furniture-kit/loungeChair', 5.55, -18.55, -2.3, { collide: true });
  game.updaters.push((dt) => marcel.update(dt));
  L.marcel = marcel;
  let zT = 0;
  let zFast = 0;
  L.zzz = (fast) => { zFast = fast ? 4 : 0; };
  game.updaters.push((dt) => {
    if (!marcel.root.visible || game.mode === 'title') return;
    zT -= dt * (zFast > 0 ? 3 : 1);
    zFast = Math.max(0, zFast - dt);
    if (zT <= 0 && game.player.position.distanceTo(marcel.root.position) < 16) {
      zT = 2.2;
      game.fx.floatText(marcel.root.position.clone().add(V3(0, 1.6, 0)), 'Z', { color: '#b8f0ea', size: 0.35, life: 2.0, rise: 1.0 });
      game.audio.sfxAt('soft', marcel.root.position, game.player.root, 0.12, 8, 0.5);
    }
  });
  const sleepTalk = [
    'Zzz… madame la directrice… oui… les clients ne partent jamais… zzz…',
    'Mmmh… sol… mi… do… la directrice chante faux… mi… ré… zzz…',
    'Zzz… le coucou… il ne fait coucou que pour l\'hymne… zzz… comme moi au karaoké…',
    'Rrrr… pas les biscuits au perroquet… zzz… il est sournois ce perroquet…',
    'Zzz… l\'hymne… il est encadré au premier… à côté de la boîte à musique… zzz…',
  ];
  let talk = 0;
  game.interact.add({
    pos: [5.3, 1.0, -18.9], r: 1.8, label: 'Parler à Marcel (il dort)',
    use: async (g) => {
      await g.say([{ who: 'marcel', text: sleepTalk[talk++ % sleepTalk.length] }]);
      if (talk === 1) await g.say([{ who: 'gustave', text: 'Marcel, le veilleur de nuit. Il dort depuis 1994. Mais il parle beaucoup en dormant. Très utile.' }]);
      if (talk % sleepTalk.length === 2) g.state.clue('Marcel marmonne : « sol… mi… do… mi… ré… »');
    },
  });
  // directrice (intro & finale)
  const dir = makeNPC('character-female-d');
  dir.root.position.set(0, 0.35, -38.2);
  dir.root.visible = false;
  b.root.add(dyn(dir.root));
  game.updaters.push((dt) => { if (dir.root.visible) dir.update(dt); });
  L.directrice = dir;

  // ------------------------------------------------ doors of the hall
  lockedDoor(game, game.doors.main_l, {
    flag: 'hall_open', key: 'key_hall', label: 'Porte principale', pos: [0, 1.4, -16.6],
    locked: [{ who: 'player', text: 'Verrouillée ! Et un écriteau : « Sortie interdite aux clients. Merci de votre compréhension éternelle. »' }],
    unlockText: 'La grande porte s\'ouvre sur le soleil !',
    onOpen: async (g) => { g.doors.main_r.setOpen(true); g.story.completeArea('hall'); },
  });
  game.story.onApply(() => { if (st.flag('hall_open') || !st.flag('intro_done')) { game.doors.main_l.setOpen(true, true); game.doors.main_r.setOpen(true, true); } });
  lockedDoor(game, game.doors.spa, {
    flag: 'spa_open', key: 'key_spa', label: 'Porte du Spa',
    locked: [{ who: 'player', text: 'Spa « Bulles de Rêve »… fermé à clé. Il paraît que la directrice l\'utilise pour « détendre » les clients récalcitrants.' }],
    unlockText: 'Le spa est ouvert. Ça sent l\'eucalyptus !',
  });
  lockedDoor(game, game.doors.resto, {
    flag: 'resto_open', key: 'key_resto', label: 'Porte du restaurant',
    locked: [{ who: 'player', text: 'Le Homard Joyeux : « Fermé — Réservation obligatoire depuis 1987 ». Ça sent quand même le beurre à l\'ail.' }],
    unlockText: 'Le restaurant est ouvert !',
  });

  // ------------------------------------------------ first floor corridor
  // hymn frame + music box (clue L1)
  b.frame(-10.2, Y1 + 1.9, -39.8, 1.3, 0.92, hymnSheet(), 0, 0xc9a24a);
  const console1 = mesh(new THREE.BoxGeometry(1.4, 0.06, 0.45), paintedMat('wood'), -10.2, Y1 + 0.85, -39.55, b.root);
  for (const x of [-0.62, 0.62]) mesh(new THREE.BoxGeometry(0.06, 0.85, 0.06), paintedMat('wood'), -10.2 + x, Y1 + 0.42, -39.55, b.root);
  console1.castShadow = true;
  game.physics.addBox(-10.2, Y1 + 0.45, -39.55, 1.4, 0.9, 0.45);
  const mbx = dyn(musicBox());
  mbx.position.set(-10.2, Y1 + 0.88, -39.5);
  b.root.add(mbx);
  let playing = false;
  game.updaters.push((dt) => { if (playing) mbx.userData.dancer.rotation.y += dt * 4; });
  readable(game, {
    pos: [-10.2, Y1 + 1.9, -39.4], r: 2.2, label: 'Lire la partition encadrée', title: 'Hymne des Mirages',
    html: `<div style="text-align:center"><b style="font-size:26px">${HYMN.join(' — ')}</b>\n\n<i>« Aux Mirages, on vient… et on reste ! »</i>\n(paroles et musique : V. Pincevent)</div>`,
    clue: 'Hymne des Mirages : ' + HYMN.join(' – ') + '.',
  });
  game.interact.add({
    pos: [-10.2, Y1 + 1.0, -39.2], r: 1.6, label: 'Remonter la boîte à musique', obj: mbx,
    use: async (g) => {
      if (playing) return;
      playing = true;
      g.audio.sfx('scratch', 0.3, 2);
      for (const n of HYMN) {
        const nt = NOTES.find((q) => q.n === n);
        g.audio.tone(nt.f * 2, 0.7, 0.3, 'box');
        g.fx.floatText(mbx.position.clone().add(V3(0, 0.4, 0.1)), '♪', { color: nt.c, size: 0.18, life: 1.2, rise: 0.4 });
        await g.wait(0.45);
      }
      playing = false;
    },
  });
  // fake guest-room doors with funny signs
  const fake = (x, num, text) => {
    const d = new THREE.Group();
    d.position.set(x, Y1, -39.82);
    b.root.add(d);
    mesh(new THREE.BoxGeometry(1.1, 2.3, 0.06), paintedMat('panel', 0xfff0de), 0, 1.15, 0, d);
    mesh(new THREE.BoxGeometry(1.34, 2.45, 0.04), toon(0xe9c46a), 0, 1.2, -0.02, d);
    mesh(new THREE.SphereGeometry(0.05, 8, 6), toon(0xffc23d), 0.42, 1.05, 0.06, d);
    b.plane(x, Y1 + 1.8, -39.77, 0.3, 0.2, textTexture([String(num)], { w: 128, h: 80, bg: '#e9c46a', fg: '#2a2233', font: '800 50px Poppins', border: null }));
    b.plane(x - 0.3, Y1 + 1.2, -39.76, 0.24, 0.45, textTexture(['NE PAS', 'DÉRANGER'], { w: 96, h: 180, bg: '#ff7458', fg: '#fff', font: '800 20px Poppins', border: null }));
    let k = 0;
    game.interact.add({ pos: [x, Y1 + 1.1, -39.4], r: 1.4, label: `Frapper à la chambre ${num}`, use: async (g) => { g.audio.sfx('knock', 0.7); await g.wait(0.5); await g.say([{ who: 'speaker', name: `Chambre ${num}`, text: text[k++ % text.length] }]); } });
  };
  fake(-16, 6, ['Ronnnnfl… (quelqu\'un ronfle derrière la porte.)', '« Revenez après mes vacances ! » — Ah, il est là depuis 1998.']);
  fake(-21.8, 5, ['« Pas maintenant, je fais un puzzle de 50 000 pièces ! »', '« J\'ai presque fini le bord ! »']);
  fake(15.5, 8, ['« C\'est complet ! Pour toujours ! » (c\'est la voix de la directrice… enregistrée.)']);
  fake(21.8, 9, ['Glouglou… (un aquarium ? un jacuzzi ? Mieux vaut ne pas savoir.)']);
  biscuitSpot(game, b, 'b_corridor', -22.9, Y1 + 0.02, -37.0, 1, 'Ramasser le biscuit derrière la plante');
  b.prop('furniture-kit/pottedPlant', -23.3, Y1, -37.4, { s: 1.4 });
  b.prop('furniture-kit/pottedPlant', 23.3, Y1, -37.4, { s: 1.4 });
  for (const x of [-20, -12, 12, 20]) b.lamp(x, ROOF - 1.3, -38, { intensity: 4, range: 8 });
  for (const x of [-18, -13.5, 13.5, 19]) b.prop('furniture-kit/lampWall', x, -39.8, 0, { y: Y1 + 2.2, collide: false });

  // the office door's "Système Cinq Étoiles" plate (4 slots)
  const plate = new THREE.Group();
  plate.position.set(17.55, Y1 + 1.45, -36.2);
  plate.rotation.y = Math.PI;
  b.root.add(dyn(plate));
  mesh(new THREE.BoxGeometry(0.7, 0.9, 0.05), toon(0xe9c46a, { emissive: 0x221500 }), 0, 0, 0, plate);
  const ptex = textTexture(['SYSTÈME', 'CINQ ÉTOILES'], { w: 256, h: 96, bg: '#1b2440', fg: '#ffc23d', font: '800 30px Poppins', border: null });
  mesh(new THREE.PlaneGeometry(0.6, 0.22), toon(0xffffff, { map: ptex, unique: true, rim: false }), 0, 0.3, 0.03, plate);
  L.slots = [];
  for (let i = 0; i < 4; i++) {
    const x = -0.15 + (i % 2) * 0.3;
    const y = 0.02 - Math.floor(i / 2) * 0.3;
    const hole = star(0.1, 0.02, 0x2a2233);
    hole.material = toon(0x2a2233);
    hole.position.set(x, y, 0.03);
    plate.add(hole);
    const s = star(0.1, 0.04);
    s.position.set(x, y, 0.05);
    s.visible = false;
    plate.add(s);
    L.slots.push(s);
  }
  b.sign(['BUREAU DE LA', 'DIRECTRICE', 'Entrée sur', 'invitation'], 16, Y1 + 2.85, -36.2, Math.PI, 1.1, 0.5, { font: '800 30px Poppins', bg: '#fff6ea' });
  L.plate = plate;

  // zones
  b.zone('couloir', [-24, Y1 - 0.5, -40, 24, LOBBY_TOP, -36], { music: 'lounge', area: 'hall' });
  b.zone('hall', [-8, -1, -40, 8, LOBBY_TOP, -16], { music: 'lounge', area: 'hall' });
  return L;
}
