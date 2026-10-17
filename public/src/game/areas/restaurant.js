// Restaurant "Le Homard Joyeux" + kitchen (ground floor, east wing). Puzzles R1 (VIP seating), R2 (timed cold room), R3 (bouillabaisse).
import * as THREE from 'three';
import { toon, paintedMat, canvasTexture, textTexture } from '../../engine/toon.js';
import { Keypad } from '../locks.js';
import { Door } from '../build.js';
import { H0 } from '../hotel.js';
import { mesh, parasol } from '../props.js';
import { ITEMS } from '../items.js';
import { pickup, duckSpot, biscuitSpot, readable, freeDoor, dyn, V3 } from '../puzzle.js';

export const RESTAURANT_MODELS = [
  'furniture-kit/tableRound', 'furniture-kit/tableCloth', 'furniture-kit/chair', 'furniture-kit/chairCushion', 'furniture-kit/kitchenStove', 'furniture-kit/kitchenCabinet', 'furniture-kit/kitchenSink',
  'furniture-kit/kitchenFridgeLarge', 'furniture-kit/hoodLarge', 'furniture-kit/kitchenCabinetUpper', 'furniture-kit/kitchenBar', 'furniture-kit/pottedPlant', 'furniture-kit/lampSquareCeiling',
  'food-kit/onion', 'food-kit/bread', 'food-kit/loaf-baguette', 'food-kit/wine-red', 'food-kit/glass-wine', 'food-kit/plate', 'food-kit/cheese', 'food-kit/carrot', 'food-kit/cabbage', 'food-kit/pot-stew', 'food-kit/cooking-spoon',
  'food-kit/pan', 'food-kit/fish', 'food-kit/lemon', 'food-kit/barrel', 'food-kit/bag', 'food-kit/egg',
];

export const GUESTS = ['Docteur', 'Baron', 'Comtesse', 'Amiral'];
// seats: N (faces the sea), E, S (back to the sea), W
const SEATS = ['N', 'E', 'S', 'W'];
const SOLUTION = { N: 'Docteur', W: 'Baron', S: 'Comtesse', E: 'Amiral' };

export function makeLobster(s = 1) {
  const g = new THREE.Group();
  const red = toon(0xe8352b);
  const dark = toon(0xb52222);
  const body = mesh(new THREE.SphereGeometry(0.28, 14, 10), red, 0, 0.45, 0, g);
  body.scale.set(0.9, 0.75, 1.3);
  for (let i = 0; i < 4; i++) { const seg = mesh(new THREE.SphereGeometry(0.2 - i * 0.03, 12, 8), i % 2 ? dark : red, 0, 0.42 - i * 0.03, -0.35 - i * 0.17, g); seg.scale.set(1, 0.55, 0.8); }
  const tail = mesh(new THREE.ConeGeometry(0.18, 0.2, 5), red, 0, 0.33, -1.02, g);
  tail.rotation.x = -Math.PI / 2;
  const head = new THREE.Group();
  head.position.set(0, 0.55, 0.32);
  g.add(head);
  for (const x of [-0.09, 0.09]) {
    mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16, 6), dark, x, 0.08, 0, head);
    mesh(new THREE.SphereGeometry(0.05, 10, 8), toon(0xffffff), x, 0.17, 0.02, head);
    mesh(new THREE.SphereGeometry(0.025, 8, 6), toon(0x1a1420), x, 0.18, 0.06, head);
    const ant = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.7, 4), dark, x * 2, 0.3, 0.2, head);
    ant.rotation.x = 0.9;
  }
  const mouth = mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 12, Math.PI), toon(0x2a2233), 0, 0.0, 0.17, head);
  mouth.rotation.z = Math.PI;
  const claws = [];
  for (const sx of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(sx * 0.22, 0.5, 0.25);
    g.add(arm);
    const a = mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.35, 8), red, sx * 0.1, 0.05, 0.12, arm);
    a.rotation.set(1.2, 0, -sx * 0.6);
    const claw = new THREE.Group();
    claw.position.set(sx * 0.22, 0.12, 0.3);
    arm.add(claw);
    const big = mesh(new THREE.SphereGeometry(0.12, 12, 9), red, 0, 0, 0.08, claw);
    big.scale.set(0.7, 0.5, 1.2);
    const pinA = mesh(new THREE.ConeGeometry(0.05, 0.22, 8), red, 0.03 * sx, 0.04, 0.25, claw);
    pinA.rotation.x = Math.PI / 2;
    const pinB = new THREE.Group();
    pinB.position.set(-0.03 * sx, -0.02, 0.15);
    claw.add(pinB);
    const pb = mesh(new THREE.ConeGeometry(0.04, 0.2, 8), dark, 0, 0, 0.1, pinB);
    pb.rotation.x = Math.PI / 2;
    claws.push({ arm, claw, pinB });
  }
  for (let i = 0; i < 3; i++) for (const sx of [-1, 1]) {
    const leg = mesh(new THREE.CylinderGeometry(0.015, 0.012, 0.32, 5), dark, sx * 0.24, 0.25, 0.05 - i * 0.16, g);
    leg.rotation.z = sx * 0.8;
  }
  // chef hat!
  mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 14), toon(0xffffff), 0, 0.27, -0.02, head);
  const puff = mesh(new THREE.SphereGeometry(0.16, 12, 9), toon(0xffffff), 0, 0.38, -0.02, head);
  puff.scale.y = 0.75;
  g.userData = { head, claws };
  g.scale.setScalar(s);
  return g;
}

function cardTexture(name, selected) {
  return canvasTexture(256, 128, (x, W, H) => {
    x.fillStyle = selected ? '#ffe08a' : '#fffaf0'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#c9a24a'; x.lineWidth = 8; x.strokeRect(6, 6, W - 12, H - 12);
    x.fillStyle = '#2a2233'; x.font = '400 46px Pacifico'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(name, W / 2, H / 2 + 4);
  });
}

export function buildRestaurant(game, b, hotel) {
  const R = {};
  const st = game.state;
  game.makeLobster = makeLobster;
  const P = (n, x, z, rot, o = {}) => b.prop(n, x, o.y ?? 0.05, z, { rot, ...o });

  // ------------------------------------------------ dining room decor
  for (const [x, z] of [[11, -18.8], [21, -18.8], [11, -25.2]]) {
    P('furniture-kit/tableRound', x, z, 0);
    for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) P('furniture-kit/chairCushion', x + Math.sin(a) * 0.95, z + Math.cos(a) * 0.95, a + Math.PI, { collide: false });
    P('food-kit/glass-wine', x + 0.25, z + 0.1, 0, { y: 0.75, h: 0.2, collide: false });
    P('food-kit/plate', x - 0.2, z + 0.2, 0, { y: 0.75, h: 0.03, collide: false });
  }
  P('food-kit/loaf-baguette', 21.1, -18.7, 0.4, { y: 0.75, h: 0.08, collide: false });
  biscuitSpot(game, b, 'b_resto', 20.85, 0.77, -18.95, 1, 'Prendre le biscuit dans la corbeille à pain');
  duckSpot(game, b, 'd_resto', 23.3, 0.05, -27.4, -2.4);
  P('furniture-kit/pottedPlant', 8.7, -16.7, 0, { s: 1.3 });
  P('furniture-kit/pottedPlant', 23.3, -16.7, 0, { s: 1.3 });
  for (const [x, z] of [[12, -20], [20, -20], [16, -25]]) b.lamp(x, H0 - 1.5, z, { intensity: 5, range: 10, color: 0xffd0a0 });
  // aquarium with a "menu du jour" fish
  const aq = new THREE.Group();
  aq.position.set(23.4, 0.05, -24.6);
  b.root.add(aq);
  mesh(new THREE.BoxGeometry(0.8, 0.9, 2.0), paintedMat('wood'), 0, 0.45, 0, aq);
  const glassM = mesh(new THREE.BoxGeometry(0.7, 0.9, 1.9), toon(0x6fd8f0, { transparent: true, opacity: 0.5 }), 0, 1.35, 0, aq);
  glassM.castShadow = false;
  game.physics.addBox(23.4, 0.9, -24.6, 0.8, 1.8, 2.0);
  const fishes = [];
  for (let i = 0; i < 3; i++) { const f = mesh(new THREE.SphereGeometry(0.08, 10, 8), toon([0xffa83a, 0xff5a8a, 0xffe03a][i]), 0, 1.3, 0, b.root); f.scale.set(0.5, 0.7, 1.2); fishes.push(f); }
  dyn(fishes[0]); dyn(fishes[1]); dyn(fishes[2]);
  game.updaters.push((dt, t) => fishes.forEach((f, i) => { f.position.set(23.4 + Math.sin(t * 0.7 + i) * 0.2, 1.15 + i * 0.15, -24.6 + Math.sin(t * 0.5 + i * 2) * 0.8); f.rotation.y = Math.cos(t * 0.5 + i * 2) > 0 ? 0 : Math.PI; }));
  readable(game, { pos: [22.8, 1.3, -24.6], r: 1.6, label: 'Regarder l\'aquarium', title: 'L\'aquarium', html: 'Trois poissons tournent en rond.\nUne étiquette : <b>« Menu du jour »</b>.\n\nIls ont l\'air au courant.' });

  // ------------------------------------------------ R1: VIP table, place cards, reservation book, lobster
  const T = V3(16, 0.05, -22);
  P('furniture-kit/tableRound', T.x, T.z, 0, { s: 1.25 });
  const tableTop = 0.05 + 0.7 * 1.25;
  const cloth = mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.02, 32), toon(0xfff6ea), T.x, tableTop + 0.01, T.z, b.root);
  cloth.castShadow = false;
  // compass rose on the cloth: "mer" to the south
  const rose = canvasTexture(256, 256, (x, W) => {
    x.strokeStyle = '#c9a24a'; x.lineWidth = 5; x.beginPath(); x.arc(128, 128, 70, 0, Math.PI * 2); x.stroke();
    x.fillStyle = '#c9a24a'; x.beginPath(); x.moveTo(128, 40); x.lineTo(142, 128); x.lineTo(128, 216); x.lineTo(114, 128); x.fill();
    x.fillStyle = '#2a2233'; x.font = '800 24px Poppins'; x.textAlign = 'center'; x.fillText('MER', 128, 246); x.fillText('▼', 128, 226);
  });
  const roseM = mesh(new THREE.PlaneGeometry(0.9, 0.9), toon(0xffffff, { map: rose, transparent: true, unique: true, rim: false }), T.x, tableTop + 0.025, T.z, b.root);
  roseM.rotation.x = -Math.PI / 2;
  roseM.castShadow = false;
  const seatPos = { N: V3(0, 0, -1.25), E: V3(1.25, 0, 0), S: V3(0, 0, 1.25), W: V3(-1.25, 0, 0) };
  for (const s of SEATS) { const p = seatPos[s]; P('furniture-kit/chairCushion', T.x + p.x, T.z + p.z, Math.atan2(-p.x, -p.z), { s: 1.1 }); }
  // place cards (initial wrong order) — arrangement stored in state
  const cards = {};
  const initial = { N: 'Baron', E: 'Docteur', S: 'Amiral', W: 'Comtesse' };
  const arr = () => st.s.flags.seating || initial;
  for (const name of GUESTS) {
    const g = new THREE.Group();
    const tn = cardTexture(name, false);
    const ts = cardTexture(name, true);
    const m = mesh(new THREE.BoxGeometry(0.3, 0.15, 0.01), [toon(0xfffaf0), toon(0xfffaf0), toon(0xfffaf0), toon(0xfffaf0), toon(0xffffff, { map: tn, unique: true, rim: false }), toon(0xffffff, { map: tn, unique: true, rim: false })], 0, 0.075, 0, g);
    m.rotation.x = -0.35;
    g.userData = { m, tn, ts, name };
    b.root.add(dyn(g));
    cards[name] = g;
  }
  let sel = null;
  const layout = (instant = false) => {
    const a = arr();
    for (const s of SEATS) {
      const g = cards[a[s]];
      const p = seatPos[s].clone().multiplyScalar(0.52);
      g.userData.target = V3(T.x + p.x, tableTop + 0.02, T.z + p.z);
      g.rotation.y = Math.atan2(p.x, p.z);
      if (instant) g.position.copy(g.userData.target);
    }
  };
  layout(true);
  game.story.onApply(() => layout(true));
  game.updaters.push((dt) => {
    for (const g of Object.values(cards)) {
      const t = g.userData.target.clone();
      if (sel === g) t.y += 0.08;
      g.position.lerp(t, 1 - Math.exp(-dt * 10));
    }
  });
  const setSel = (g) => {
    if (sel) { const m = sel.userData.m; m.material[4].map = sel.userData.tn; m.material[5].map = sel.userData.tn; m.material[4].needsUpdate = m.material[5].needsUpdate = true; }
    sel = g;
    if (g) { const m = g.userData.m; m.material[4].map = g.userData.ts; m.material[5].map = g.userData.ts; m.material[4].needsUpdate = m.material[5].needsUpdate = true; }
  };
  const clickCard = (g) => {
    if (st.flag('seating_ok')) return;
    game.audio.sfx('cloth', 0.5, 1.3);
    if (!sel) { setSel(g); return; }
    if (sel === g) { setSel(null); return; }
    const a = { ...arr() };
    const s1 = SEATS.find((s) => a[s] === sel.userData.name);
    const s2 = SEATS.find((s) => a[s] === g.userData.name);
    [a[s1], a[s2]] = [a[s2], a[s1]];
    st.s.flags.seating = a;
    setSel(null);
    layout();
    if (SEATS.every((s) => a[s] === SOLUTION[s])) solved();
  };
  const lob = dyn(makeLobster(1.3));
  lob.position.set(16, 0.05 + 1.1, -27.0);
  b.root.add(lob);
  const ped = mesh(new THREE.CylinderGeometry(0.6, 0.7, 1.1, 16), paintedMat('marble'), 16, 0.6, -27.1, b.root);
  ped.castShadow = true;
  game.physics.addBox(16, 0.8, -27.1, 1.3, 1.6, 1.3);
  R.lobster = lob;
  let lobDance = 0;
  game.updaters.push((dt, t) => {
    const { head, claws } = lob.userData;
    const k = lobDance > 0 ? 1 : 0;
    lobDance = Math.max(0, lobDance - dt);
    head.rotation.z = Math.sin(t * (k ? 10 : 1.5)) * (k ? 0.25 : 0.04);
    claws.forEach((c, i) => {
      c.arm.rotation.x = k ? Math.sin(t * 8 + i * 3) * 0.5 : Math.sin(t * 1.2 + i) * 0.05;
      c.pinB.rotation.x = (st.flag('seating_ok') ? 0.6 : 0.05) + (k ? Math.abs(Math.sin(t * 12)) * 0.4 : 0);
    });
  });
  const kk = ITEMS.key_kitchen.make();
  kk.position.set(16.35, 0.05 + 1.1 + 0.62, -26.3);
  b.root.add(kk);
  pickup(game, { id: 'key_kitchen', item: 'key_kitchen', obj: kk, pos: [16, 1.6, -26.0], visible: () => st.flag('seating_ok'), dy: 3 });
  game.story.onApply(() => { kk.visible = st.flag('seating_ok') && !st.flag('got_key_kitchen'); });
  kk.visible = false;
  const solved = () => {
    game.setFlag('seating_ok');
    game.audio.sfx('jingle_solve', 0.7);
    setTimeout(async () => {
      game.exitInspect();
      await game.wait(0.7);
      await game.cut(async () => {
        await game.shot([16, 2.4, -23.6], [16, 1.7, -27], 1.0, 50);
        lobDance = 4;
        const song = [523, 659, 784, 659, 523, 784, 1046];
        song.forEach((f, i) => setTimeout(() => game.audio.tone(f, 0.35, 0.3), i * 260));
        await game.say([{ who: 'homard', text: '♪ Bienvenue au Homard Joyeux ! Le Baron dos aux murs, le Docteur face à la mer, la Comtesse à droite du Baron ! ♪ Excellente table, mon cher !' }]);
        kk.visible = true;
        game.audio.sfx('drop', 0.6);
        game.fx.sparkle(kk.position.clone(), 0xffe066, 16);
        await game.say([{ who: 'homard', text: 'Pour la peine, voici la clé de MA cuisine. Et n\'oubliez pas la recette secrète du chef ! ♪ Clac clac ! ♪' }]);
      });
    }, 300);
  };
  game.interact.add({
    pos: [T.x, 1.0, T.z], r: 2.2, label: () => (st.flag('seating_ok') ? null : 'Arranger les cartons de la table VIP'),
    inspect: () => ({
      cam: [T.x, tableTop + 1.7, T.z + 1.2], look: [T.x, tableTop, T.z], fov: 48, title: 'Table VIP — clique deux cartons pour les échanger',
      clickables: () => Object.values(cards).map((g) => ({ mesh: g, tip: g.userData.name, onClick: () => clickCard(g) })),
      onExit: () => setSel(null),
    }),
  });
  // reservation book on the maître d' stand
  const stand = new THREE.Group();
  stand.position.set(9.4, 0.05, -23.0);
  b.root.add(stand);
  mesh(new THREE.BoxGeometry(0.6, 1.1, 0.5), paintedMat('panel', 0xffd7b0), 0, 0.55, 0, stand);
  const book = mesh(new THREE.BoxGeometry(0.5, 0.05, 0.36), toon(0xa8323a), 0, 1.15, 0, stand);
  book.rotation.x = -0.2;
  game.physics.addBox(9.4, 0.6, -23, 0.6, 1.2, 0.5);
  readable(game, {
    pos: [9.6, 1.2, -22.4], r: 1.6, label: 'Lire le livre des réservations', title: 'Réservations — Table VIP',
    html: '<b>Table ronde VIP — 4 couverts.</b> (Rappel : la mer est au sud, derrière les baies vitrées.)\n\n• Le <b>Docteur</b> exige de voir la mer pendant tout le repas.\n• Le <b>Baron</b> ne tourne <u>jamais</u> le dos à la mer : il est persuadé qu\'un requin l\'attend.\n• La <b>Comtesse</b> s\'assoit toujours à la <u>droite</u> du Baron.\n• L\'<b>Amiral</b> prend la place qui reste, en râlant.\n\n<i>(Le chef rappelle que « à droite » se dit du point de vue de la personne assise.)</i>',
    clue: 'Table VIP : Docteur voit la mer ; Baron jamais dos à la mer ; Comtesse à la droite du Baron ; Amiral = place restante.',
  });
  readable(game, {
    pos: [16, 1.3, -26.2], r: 1.8, label: 'Lire la plaque du homard', title: 'Le Homard Joyeux', visible: () => !st.flag('seating_ok'),
    html: '« Je ne chante que pour une table VIP parfaitement placée. »\n\n<i>Homard mécanique, 1987. Ne pas nourrir. Ne pas pincer.</i>',
  });

  // ------------------------------------------------ kitchen
  const kd = game.doors.kitchen;
  game.interact.add({
    pos: [20, 1.2, -27.4], r: 1.8, label: () => (st.flag('kitchen_open') ? (kd.open ? null : 'Ouvrir la cuisine') : (game.has('key_kitchen') ? 'Déverrouiller la cuisine' : 'Porte de la cuisine')),
    use: async (g) => {
      if (st.flag('kitchen_open')) { kd.setOpen(true); return; }
      if (g.has('key_kitchen')) { g.take('key_kitchen'); g.audio.sfx('keys', 0.7); g.setFlag('kitchen_open'); kd.setOpen(true); return; }
      await g.say([{ who: 'player', text: '« Cuisine — Personnel autorisé uniquement ». Fermée à clé. Le homard sur son piédestal a l\'air de me surveiller.' }]);
    },
  });
  game.story.onApply(() => { if (st.flag('kitchen_open')) kd.setOpen(true, true); });
  // appliances
  P('furniture-kit/kitchenStove', 14.64, -39.4, 0);
  P('furniture-kit/kitchenStove', 15.46, -39.4, 0);
  P('furniture-kit/hoodLarge', 15.05, -39.6, 0, { y: 2.0, collide: false });
  for (const x of [12.9, 17.2, 18.3]) P('furniture-kit/kitchenCabinet', x, -39.45, 0);
  P('furniture-kit/kitchenSink', 23.4, -30.5, -Math.PI / 2);
  for (const z of [-29.4, -31.6, -32.7]) P('furniture-kit/kitchenCabinet', 23.4, z, -Math.PI / 2);
  P('furniture-kit/kitchenFridgeLarge', 8.6, -29.2, Math.PI / 2);
  // central island
  b.box(15.5, 0.05, -33.5, 3.4, 0.9, 1.2, paintedMat('metal'));
  P('food-kit/cabbage', 14.6, -33.4, 0, { y: 0.95, h: 0.25, collide: false });
  P('food-kit/carrot', 15.2, -33.6, 0.4, { y: 0.95, h: 0.08, collide: false });
  P('food-kit/lemon', 16.1, -33.3, 0, { y: 0.95, h: 0.12, collide: false });
  P('food-kit/pan', 16.8, -33.6, 0.6, { y: 0.95, h: 0.1, collide: false });
  b.surface(8, -40, 24, -28, 'concrete', -1, 4);
  for (const [x, z] of [[12, -31], [19, -31], [15, -37]]) b.lamp(x, H0 - 1.5, z, { intensity: 6, range: 10, color: 0xf4fbff });
  duckSpot(game, b, 'd_kitchen', 23.35, 0.98, -30.5, -Math.PI / 2);

  // the great pot (R3)
  const pot = dyn(new THREE.Group());
  pot.position.set(15.05, 0.05 + 0.86, -39.25);
  b.root.add(pot);
  const potBody = mesh(new THREE.CylinderGeometry(0.42, 0.36, 0.55, 20, 1, true), toon(0x8f9aa6, { side: THREE.DoubleSide }), 0, 0.27, 0, pot);
  mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.02, 20), toon(0x6b6f7c), 0, 0.01, 0, pot);
  const rim = mesh(new THREE.TorusGeometry(0.42, 0.03, 6, 24), toon(0xb7c1cc), 0, 0.55, 0, pot);
  rim.rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(0.07, 0.02, 6, 12, Math.PI), toon(0xb7c1cc), s * 0.45, 0.45, 0, pot).rotation.z = s * Math.PI / 2;
  const soup = mesh(new THREE.CircleGeometry(0.4, 24), toon(0xe0a050), 0, 0.42, 0, pot);
  soup.rotation.x = -Math.PI / 2;
  potBody.castShadow = true;
  const ladle = dyn(new THREE.Group());
  mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 6), toon(0xc9d2d8), 0, 0.35, 0, ladle);
  mesh(new THREE.SphereGeometry(0.06, 10, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toon(0xc9d2d8, { side: THREE.DoubleSide }), 0, 0.02, 0, ladle);
  ladle.position.set(15.25, 1.38, -39.2);
  ladle.rotation.z = 0.35;
  b.root.add(ladle);
  game.fx.emitter((fx) => { if (st.s.flags.soupSeq && st.s.flags.soupSeq.length) fx.steam(V3(15.05, 1.5, -39.25), 1, 0.4); }, 4);
  const RECIPE = ['onion', 'tomato', 'rouget', 'sardine'];
  const soupColors = [0xe0a050, 0xe8c070, 0xd9502a, 0xe06a3a, 0xc8502a];
  const seq = () => st.s.flags.soupSeq || [];
  const updSoup = () => { soup.material = toon(soupColors[Math.min(4, seq().length)]); };
  game.story.onApply(updSoup);
  let stirs = 0;
  const addIng = async (id) => {
    const s = seq().slice();
    const ok = RECIPE[s.length] === id;
    game.take(id);
    game.audio.sfx('plop', 0.7);
    game.fx.splash(V3(15.05, 1.45, -39.25), 18);
    if (!ok) {
      // the pot burps everything back
      for (const x of s) game.give(x, 1, { silent: true });
      game.give(id, 1, { silent: true });
      st.s.flags.soupSeq = [];
      updSoup();
      game.audio.sfx('jingle_fail', 0.5);
      game.fx.puff(V3(15.05, 1.6, -39.25), 20, 0x9fbf6a);
      await game.say([{ who: 'gustave', text: 'BEURK ! La marmite a tout recraché ! Ce n\'est pas l\'ordre de la recette. Tu as récupéré tes ingrédients, recommence dans le bon ordre.' }]);
      game.refreshInspect();
      return;
    }
    s.push(id);
    st.s.flags.soupSeq = s;
    updSoup();
    game.save();
    if (s.length === RECIPE.length) game.ui.subtitle('Tous les ingrédients sont dans la marmite… La recette dit de <b>remuer trois fois</b>.', 4);
    game.refreshInspect();
  };
  const stir = async () => {
    if (seq().length < RECIPE.length) { game.audio.sfx('pot', 0.4); game.ui.subtitle('Tu remues… de l\'eau tiède. Il manque des ingrédients.', 2.5); return; }
    stirs++;
    game.audio.sfx('pot', 0.6, 0.9 + stirs * 0.1);
    let t = 0;
    const f = (dt) => { t += dt; ladle.rotation.y = t * 8; if (t > 0.8) game.updaters.splice(game.updaters.indexOf(f), 1); };
    game.updaters.push(f);
    if (stirs >= 3 && !st.flag('soup')) {
      game.setFlag('soup');
      game.audio.sfx('jingle_solve', 0.7);
      game.exitInspect();
      await game.wait(0.6);
      await game.cut(async () => {
        await game.shot([15.05, 2.4, -37.2], [15.05, 1.5, -39.25], 1.0, 50);
        game.fx.steam(V3(15.05, 1.5, -39.25), 30, 0.6);
        star4.visible = true;
        let k = 0;
        await new Promise((res) => { const f2 = (dt) => { k += dt; star4.position.y = 1.4 + Math.min(1, k) * 0.7; star4.rotation.y += dt * 4; if (k > 1.4) { game.updaters.splice(game.updaters.indexOf(f2), 1); res(); } }; game.updaters.push(f2); });
        game.fx.sparkle(star4.position.clone(), 0xffe066, 30);
        await game.say([{ who: 'gustave', text: 'La bouillabaisse de la directrice… avec une ÉTOILE dedans ! Le secret du chef, c\'était donc ça. Ça explique le goût métallique.' }]);
      });
    }
  };
  const star4 = ITEMS.star.make();
  star4.position.set(15.05, 2.1, -39.25);
  star4.visible = false;
  b.root.add(star4);
  pickup(game, { id: 'star4', item: 'star', flag: 'star4', obj: star4, pos: [15.05, 1.8, -38.6], visible: () => st.flag('soup'), dy: 3, label: 'Prendre l\'étoile d\'or', text: '<b>Étoile d\'or n°4</b> — un poisson est gravé au dos', onTake: (g) => { g.story.gotStar(4); g.story.completeArea('restaurant'); } });
  game.story.onApply(() => { star4.visible = st.flag('soup') && !st.flag('star4'); if (st.flag('soup')) star4.position.y = 2.1; });
  // inventory items shown around the pot in the close-up
  const potItems = {};
  RECIPE.forEach((id, i) => {
    const o = ITEMS[id].make();
    o.scale.multiplyScalar(id === 'sardine' || id === 'rouget' ? 0.8 : 0.7);
    const a = Math.PI * (0.15 + i * 0.23);
    o.position.set(15.05 + Math.cos(a) * 0.7, 1.0, -39.25 + Math.sin(a) * 0.35 + 0.25);
    o.visible = false;
    b.root.add(dyn(o));
    potItems[id] = o;
  });
  game.interact.add({
    pos: [15.05, 1.4, -38.6], r: 1.8, label: () => (st.flag('soup') ? null : 'Cuisiner dans la grande marmite'),
    inspect: () => ({
      cam: [15.05, 2.35, -37.75], look: [15.05, 1.15, -39.1], fov: 50, title: 'La marmite — clique un ingrédient, puis la louche',
      onEnter: () => RECIPE.forEach((id) => { potItems[id].visible = game.has(id); }),
      onExit: () => RECIPE.forEach((id) => { potItems[id].visible = false; }),
      clickables: () => {
        RECIPE.forEach((id) => { potItems[id].visible = game.has(id); });
        return [
          ...RECIPE.filter((id) => game.has(id)).map((id) => ({ mesh: potItems[id], tip: 'Mettre : ' + ITEMS[id].name, onClick: () => addIng(id) })),
          { mesh: ladle, tip: 'Remuer avec la louche', onClick: () => stir() },
        ];
      },
    }),
  });
  // recipe pieces (3)
  const piece = (id, x, y, z, rot, where, visible) => {
    const pm = mesh(new THREE.PlaneGeometry(0.18, 0.22), toon(0xfbeed2, { side: THREE.DoubleSide }), x, y, z, b.root);
    pm.rotation.y = rot;
    pm.rotation.z = 0.12;
    pickup(game, { id, item: 'recipe', flag: id, obj: pm, pos: [x, y, z], visible, label: 'Prendre le morceau de recette', text: `<b>Morceau de recette</b> trouvé ${where}`, onTake: (g) => g.story.showRecipe() });
  };
  piece('recipe1', 9.0, 1.3, -29.2, Math.PI / 2, 'sur le frigo');
  // pantry (x 8..12, z -40..-35)
  let w = b.wall(12, -40, 12, -35, { h: H0, mat: 'stucco', skinA: 'wood', skinB: 'spatile', openings: [{ at: 3.6, w: 1.0, h: 2.3 }] });
  b.wall(8, -35, 12, -35, { h: H0, mat: 'stucco', skinA: 'spatile', skinB: 'wood' });
  const pd = new Door(b, 'pantry', 12, -36.9, w.rot, { w: 1.0, h: 2.3, color: 0xc98a4a, panelColor: 0x8a5e33, swing: -1 });
  freeDoor(game, pd, 'le garde-manger');
  for (let r = 0; r < 3; r++) b.box(8.5, 0.5 + r * 0.6, -37.5, 0.6, 0.04, 4.6, paintedMat('wood'));
  game.physics.addBox(8.5, 1.0, -37.5, 0.6, 2, 4.6);
  for (let i = 0; i < 6; i++) P(['food-kit/onion', 'food-kit/bag', 'food-kit/barrel', 'food-kit/egg', 'food-kit/cheese', 'food-kit/bread'][i], 8.5, -39.4 + i * 0.75, 0, { y: 0.54 + (i % 3) * 0.6, h: [0.14, 0.3, 0.3, 0.08, 0.12, 0.12][i], collide: false });
  const onion = ITEMS.onion.make();
  onion.scale.multiplyScalar(0.35 / 0.9);
  onion.position.set(8.55, 1.74, -36.2);
  b.root.add(onion);
  pickup(game, { id: 'onion', item: 'onion', obj: onion, pos: [8.9, 1.6, -36.2], label: 'Prendre un oignon' });
  piece('recipe2', 8.82, 1.2, -38.4, Math.PI / 2, 'dans le garde-manger');
  biscuitSpot(game, b, 'b_pantry', 8.5, 0.56, -38.6, 1, 'Prendre le biscuit du garde-manger');
  b.lamp(10, H0 - 1.5, -37.5, { intensity: 3, range: 6 });

  // ------------------------------------------------ cold room (x 19..24, z -40..-34) — R2 timed
  w = b.wall(19, -40, 19, -34, { h: H0, mat: 'stucco', skinA: 'metal', skinB: 'metal' });
  const cw = b.wall(19, -34, 24, -34, { h: H0, mat: 'stucco', skinA: 'metal', skinB: 'metal', openings: [{ at: 2.5, w: 1.2, h: 2.3 }] });
  const cdoor = new Door(b, 'cold', 20.9, -34, cw.rot, { w: 1.2, h: 2.3, color: 0xdfe7f0, panelColor: 0xb7c1cc, panels: true, swing: -1 });
  b.surface(19, -40, 24, -34, 'concrete', -1, 4);
  const ice = toon(0xdff6ff);
  for (const z of [-39.5]) for (let r = 0; r < 3; r++) b.box(21.5, 0.4 + r * 0.7, z, 4.6, 0.05, 0.7, paintedMat('metal'));
  game.physics.addBox(21.5, 1.0, -39.5, 4.6, 2, 0.7);
  for (let r = 0; r < 3; r++) b.box(23.5, 0.4 + r * 0.7, -37, 0.7, 0.05, 4.6, paintedMat('metal'));
  game.physics.addBox(23.5, 1.0, -37, 0.7, 2, 4.6);
  // crates: [day, temperature] shown in shuffled positions
  const crates = [['JEUDI', '-3 °C', 19.9, 0.45, -39.45], ['LUNDI', '-5 °C', 21.1, 1.15, -39.45], ['MERCREDI', '-6 °C', 22.3, 0.45, -39.45], ['MARDI', '-2 °C', 23.5, 1.15, -37.6]];
  for (const [day, temp, x, y, z] of crates) {
    const lab = canvasTexture(256, 160, (c, W, H) => { c.fillStyle = '#d9a46a'; c.fillRect(0, 0, W, H); c.fillStyle = '#fffaf0'; c.fillRect(14, 14, W - 28, H - 28); c.fillStyle = '#2a2233'; c.font = '600 24px Poppins'; c.textAlign = 'center'; c.fillText('Livré ' + day.toLowerCase(), W / 2, 58); c.font = '800 52px Poppins'; c.fillStyle = '#2f73d8'; c.fillText(temp, W / 2, 118); });
    const cr = mesh(new THREE.BoxGeometry(0.9, 0.5, 0.55), [paintedMat('wood'), paintedMat('wood'), paintedMat('wood'), paintedMat('wood'), toon(0xffffff, { map: lab, unique: true, rim: false }), paintedMat('wood')], x, y + 0.25, z, b.root);
    if (z > -39) { cr.rotation.y = -Math.PI / 2; }
  }
  readable(game, {
    pos: [21.5, 1.2, -38.6], r: 2.2, label: 'Examiner les caisses congelées', title: 'Caisses de livraison',
    html: 'Des caisses givrées, rangées n\'importe comment :\n\n• « Livré jeudi » — <b>−3 °C</b>\n• « Livré lundi » — <b>−5 °C</b>\n• « Livré mercredi » — <b>−6 °C</b>\n• « Livré mardi » — <b>−2 °C</b>',
    clue: 'Caisses : lundi −5, mardi −2, mercredi −6, jeudi −3.',
  });
  for (const [x, z] of [[20.2, -37], [22.6, -36.4]]) { const ic = mesh(new THREE.DodecahedronGeometry(0.25), ice, x, 0.2, z, b.root); ic.scale.y = 0.6; }
  const rouget = ITEMS.rouget.make();
  rouget.scale.multiplyScalar(0.6);
  rouget.position.set(21.2, 1.55, -39.5);
  b.root.add(rouget);
  piece('recipe3', 23.5, 1.6, -36.3, -Math.PI / 2, 'collé dans la glace de la chambre froide');
  b.lamp(21.5, H0 - 1.5, -37, { intensity: 4, range: 7, color: 0xbfe9ff });
  game.fx.emitter((fx) => { const p = V3(19.4 + Math.random() * 4.4, 3.8, -39.6 + Math.random() * 5.4); fx.spawn(p, V3(0, -0.4, 0), { life: 3, g: -0.05, s0: 0.04, s1: 0.03, color: 0xffffff }); }, 8);
  // inner emergency keypad
  const kp = new Keypad(game, { code: '5263', color: 0x2f73d8, onOpen: () => escapeCold() });
  kp.group.position.set(19.18, 1.4, -35.4);
  kp.group.rotation.y = Math.PI / 2;
  b.root.add(dyn(kp.group));
  b.sign(['URGENCE', 'températures', 'dans l\'ordre', 'des livraisons'], 19.17, 2.05, -35.4, Math.PI / 2, 0.42, 0.42, { font: '800 30px Poppins', bg: '#ff7458', fg: '#ffffff' });
  R.coldKeypad = kp;
  game.interact.add({
    pos: [19.8, 1.4, -35.4], r: 1.6, label: () => (game.timers.cold ? 'Utiliser le clavier d\'urgence' : null),
    inspect: { cam: [19.75, 1.5, -35.4], look: [19.18, 1.4, -35.4], fov: 45, title: 'Clavier d\'urgence — 4 chiffres', clickables: () => kp.clickables() },
  });
  readable(game, {
    pos: [19.8, 2.0, -35.4], r: 1.6, label: 'Lire l\'affiche d\'urgence', title: 'En cas d\'enfermement',
    html: 'Code d\'urgence : <b>les températures des caisses, dans l\'ordre des livraisons</b> (sans le signe moins).\n\n<i>Rappel : la semaine commence le lundi. Même aux Mirages.</i>',
    clue: 'Chambre froide : code = températures des caisses dans l\'ordre des livraisons (lundi → jeudi).',
  });
  game.interact.add({
    pos: [21.5, 1.2, -33.6], r: 1.6, label: () => (cdoor.open ? null : (game.player.position.z > -34 ? 'Ouvrir la chambre froide' : (st.flag('cold_done') ? 'Ouvrir la porte' : null))),
    use: () => cdoor.setOpen(true),
  });
  const trapCold = async (g) => {
    if (st.flag('cold_done') || g.timers.cold) return;
    await g.cut(async () => {
      cdoor.setOpen(false);
      g.audio.sfx('door_close2', 0.9);
      await g.wait(0.4);
      await g.say([
        { who: 'speaker', name: 'Mme Pincevent (haut-parleur)', text: 'Tiens, tiens… on chaparde dans ma chambre froide ? La porte se ferme toute seule, c\'est une porte de qualité. Bonne conservation !' },
        { who: 'gustave', text: 'Brrr ! La poignée intérieure est cassée, mais il y a un clavier d\'urgence près de la porte. Fais vite, je sens plus mes plumes !' },
      ]);
    });
    kp.solved = false;
    kp.entry = '';
    kp.draw('____');
    g.startTimer('cold', 'Chambre froide — −25 °C', 120, () => freeze(g));
  };
  pickup(game, { id: 'rouget', item: 'rouget', obj: rouget, pos: [21.2, 1.4, -38.8], label: 'Décrocher le rouget', onTake: (g) => trapCold(g) });
  const freeze = async (g) => {
    await g.cut(async () => {
      g.audio.sfx('jingle_fail', 0.7);
      await g.ui.fade(true, 900);
      g.renderer.post.uniforms.tint.value.set(1.03, 1, 0.96);
      if (g.has('rouget')) g.take('rouget');
      st.set('got_rouget', false);
      rouget.visible = true;
      cdoor.setOpen(true, true);
      g.player.teleport(16, 0.1, -31.5, 0);
      g.rig.follow(true);
      await g.wait(0.6);
      await g.ui.fade(false, 900);
      await g.say([
        { who: 'gustave', text: 'Tu étais devenu un esquimau géant ! J\'ai dû te décongeler au sèche-cheveux… enfin, avec mes ailes. Le rouget est retourné dans la chambre froide.' },
        { who: 'gustave', text: 'Avant d\'y retourner, mémorise bien les caisses : jour de livraison et température !' },
      ]);
      st.s.deaths++;
      g.save();
    });
  };
  const escapeCold = async () => {
    const g = game;
    g.stopTimer('cold');
    g.setFlag('cold_done');
    g.renderer.post.uniforms.tint.value.set(1.03, 1, 0.96);
    g.audio.sfx('metal_latch', 0.8);
    g.exitInspect();
    await g.wait(0.6);
    cdoor.setOpen(true);
    await g.say([{ who: 'gustave', text: 'Lundi −5, mardi −2, mercredi −6, jeudi −3 : 5-2-6-3. Bien joué, glaçon !' }]);
  };
  game.story.onApply(() => { if (st.flag('cold_done') || st.flag('got_rouget')) cdoor.setOpen(true, true); });
  game.updaters.push(() => {
    const t = game.timers.cold;
    if (t) { const k = 1 - t.left / t.total; game.renderer.post.uniforms.tint.value.set(1.03 - k * 0.25, 1 - k * 0.05, 0.96 + k * 0.3); }
  });

  b.zone('chambre froide', [19, -1, -40, 24, H0, -34], { music: 'kitchen', area: 'restaurant' });
  b.zone('cuisine', [8, -1, -40, 24, H0, -28], { music: 'kitchen', area: 'restaurant' });
  b.zone('restaurant', [8, -1, -28, 24, H0, -16], { music: 'kitchen', area: 'restaurant' });
  return R;
}
