// Outdoors: forecourt & fountain, gardens (pool, vegetable garden), beach, pier and lighthouse.
import * as THREE from 'three';
import { Door } from '../build.js';
import { toon, paintedMat, textTexture } from '../../engine/toon.js';
import { parasol, lampPost, flamingoFloat, lifeguardChair, tikiBar, beachHut, lighthouse, sandcastle, scarecrow, greenhouse, tomatoPlant, raisedBed, bench, towel, statue, fountain, slide, gateMaterial, hedgeBlock, mesh } from '../props.js';
import { seaMaterial } from '../world.js';
import { Y1 } from '../hotel.js';

export const EXTERIOR_MODELS = [
  'nature-kit/tree_palmTall', 'nature-kit/tree_palmBend', 'nature-kit/tree_palmDetailedTall', 'nature-kit/tree_palmShort', 'nature-kit/tree_oak', 'nature-kit/tree_default',
  'nature-kit/rock_largeA', 'nature-kit/rock_largeB', 'nature-kit/rock_largeC', 'nature-kit/rock_tallA', 'nature-kit/rock_tallB', 'nature-kit/rock_smallA', 'nature-kit/rock_smallC',
  'nature-kit/plant_bushLarge', 'nature-kit/plant_bush', 'nature-kit/plant_bushDetailed', 'nature-kit/flower_redA', 'nature-kit/flower_yellowA', 'nature-kit/flower_purpleA', 'nature-kit/grass_large',
  'nature-kit/crops_leafsStageB', 'nature-kit/crop_pumpkin', 'nature-kit/crop_carrot', 'nature-kit/crop_melon', 'nature-kit/crops_cornStageD', 'nature-kit/crops_wheatStageB', 'nature-kit/canoe', 'nature-kit/canoe_paddle',
  'watercraft-kit/boat-speed-a', 'watercraft-kit/buoy', 'watercraft-kit/buoy-flag', 'watercraft-kit/boat-row-small',
  'furniture-kit/loungeChairRelax', 'furniture-kit/tableRound', 'furniture-kit/chair', 'food-kit/cocktail', 'food-kit/coconut', 'food-kit/pineapple', 'food-kit/strawberry',
  'fantasy-town-kit/cart', 'fantasy-town-kit/stall-red', 'fantasy-town-kit/lantern', 'holiday-kit/bench',
];

const PALMS = ['nature-kit/tree_palmTall', 'nature-kit/tree_palmBend', 'nature-kit/tree_palmDetailedTall'];

export function buildExterior(game, b, hotel) {
  const E = {};
  const rnd = mulberry(7);
  const palm = (x, z, s = 3) => b.prop(PALMS[Math.floor(rnd() * PALMS.length)], x, 0, z, { s: s * (0.85 + rnd() * 0.35), rot: rnd() * 6.28, collide: false, colH: 3 }) && game.physics.addBox(x, 1.5, z, 0.5, 3, 0.5);

  // ------------------------------------------------ paths
  b.floor(-16, -16, 16, -1, 0.08, 'paving', { t: 0.1 });
  b.floor(-2.5, -1, 2.5, 24, 0.08, 'paving', { t: 0.1 });
  b.floor(-1.6, 24, 1.6, 46, 0.1, 'wood', { t: 0.12, tile: 1.5 });
  b.surface(-16, -16, 16, -1, 'concrete', -1, 3);
  b.surface(-2.5, -1, 2.5, 24, 'concrete', -1, 3);
  b.surface(-1.6, 24, 1.6, 80, 'wood', -1, 3);
  // flower beds along the forecourt
  for (const x of [-13.5, 13.5]) {
    b.box(x, 0.08, -8.5, 3, 0.35, 13, paintedMat('terracotta', 0xd9a77f), { collide: true });
    for (let i = 0; i < 9; i++) {
      const f = ['nature-kit/flower_redA', 'nature-kit/flower_yellowA', 'nature-kit/flower_purpleA'][i % 3];
      b.prop(f, x + (rnd() - 0.5) * 2, 0.43, -14 + i * 1.4, { s: 2.2, rot: rnd() * 6, collide: false });
    }
  }

  // ------------------------------------------------ fountain & statues (puzzle G1 lives in garden.js)
  const f = fountain(3);
  f.group.position.set(0, 0.08, -8.5);
  b.root.add(f.group);
  E.fountain = f;
  game.physics.addGeometry(new THREE.CylinderGeometry(3.2, 3.2, 2.4, 20), new THREE.Matrix4().makeTranslation(0, 1.2, -8.5));
  const water = new THREE.Mesh(new THREE.CircleGeometry(2.95, 40), seaMaterial(game, { shallow: 0x5fd8e8, deep: 0x5fd8e8, scale: 2.5, pool: true }));
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.6, -8.5);
  b.root.add(water);
  E.fountainWater = water;
  // water jets from the top tier
  E.jets = game.fx.emitter((fx) => {
    if (!E.jetsOn) return;
    const a = Math.random() * Math.PI * 2;
    const p = new THREE.Vector3(0, 3.7, -8.5);
    fx.spawn(p, new THREE.Vector3(Math.cos(a) * 1.1, 1.2 + Math.random() * 0.6, Math.sin(a) * 1.1), { life: 0.9, g: -6, drag: 0.2, s0: 0.09, s1: 0.04, color: Math.random() < 0.5 ? 0xffffff : 0xbfefff });
    const a2 = Math.random() * Math.PI * 2;
    fx.spawn(new THREE.Vector3(Math.cos(a2) * 1.2, 2.3, -8.5 + Math.sin(a2) * 1.2), new THREE.Vector3(Math.cos(a2) * 0.6, 0.2, Math.sin(a2) * 0.6), { life: 0.6, g: -7, s0: 0.08, s1: 0.03, color: 0xdff8ff });
  }, 70);
  E.jetsOn = true;
  E.statues = {};
  for (const [kind, x, z] of [['dauphin', -5.2, -4.4], ['tortue', 5.2, -4.4], ['flamant', -5.2, -12.6], ['lion', 5.2, -12.6]]) {
    const s = statue(kind);
    s.position.set(x, 0.08, z);
    s.userData.dynamic = true;
    b.root.add(s);
    game.physics.addBox(x, 1.3, z, 1.2, 2.6, 1.2);
    E.statues[kind] = s;
  }
  // riddle plaque on a little lectern
  const lect = new THREE.Group();
  mesh(new THREE.BoxGeometry(0.2, 1.0, 0.2), toon(0x2a2a3a), 0, 0.5, 0, lect);
  const board = mesh(new THREE.BoxGeometry(1.2, 0.8, 0.06), toon(0xc9a24a), 0, 1.1, 0, lect);
  board.rotation.x = -0.6;
  lect.position.set(0, 0.08, -3.4);
  b.root.add(lect);
  const pt = textTexture(['Les Gardiens', 'de la Fontaine'], { w: 512, h: 340, bg: '#e9c46a', fg: '#4a3418', font: '400 60px Pacifico', border: '#8a6420' });
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 0.72), toon(0xffffff, { map: pt, unique: true, rim: false }));
  plaque.position.set(0, 1.11, -3.355);
  plaque.rotation.x = -0.6;
  lect.add(plaque);
  plaque.position.set(0, 1.115, 0.035);
  E.plaque = lect;
  game.physics.addBox(0, 0.6, -3.4, 1.2, 1.2, 0.6);

  // ------------------------------------------------ hedges, gates, fences
  hedgeBlock(b, -16, -16, -16, -9.3);
  hedgeBlock(b, -16, -6.7, -16, 18.5);
  hedgeBlock(b, 16, -16, 16, -9.3);
  hedgeBlock(b, 16, -6.7, 16, 18.5);
  hedgeBlock(b, -16, 18, -64, 18);
  hedgeBlock(b, 16, 18, 64, 18);
  hedgeBlock(b, -24, -40, -24, -60);
  hedgeBlock(b, 24, -40, 24, -60);
  for (const x of [-16, 16]) {
    for (const z of [-9.6, -6.4]) {
      b.box(x, 0, z, 0.6, 2.1, 0.6, paintedMat('paving', 0xf6efe2));
      mesh(new THREE.SphereGeometry(0.24, 10, 8), toon(0xffc23d), x, 2.3, z, b.root);
    }
  }
  const gm = gateMaterial();
  E.gates = [
    new Door(b, 'gate_w1', -16, -9.3, -Math.PI / 2, { w: 1.3, h: 1.9, mat: gm, panels: false, fit: true, swing: -1 }),
    new Door(b, 'gate_w2', -16, -6.7, Math.PI / 2, { w: 1.3, h: 1.9, mat: gm, panels: false, fit: true, swing: 1 }),
    new Door(b, 'gate_e1', 16, -9.3, -Math.PI / 2, { w: 1.3, h: 1.9, mat: gm, panels: false, fit: true, swing: 1 }),
    new Door(b, 'gate_e2', 16, -6.7, Math.PI / 2, { w: 1.3, h: 1.9, mat: gm, panels: false, fit: true, swing: -1 }),
  ];
  E.gates.forEach((g) => g.pivot.children.forEach((c) => { if (c.geometry && c.geometry.type === 'SphereGeometry') c.visible = false; }));
  const sign = (lines, x, z, rot) => b.sign(lines, x, 2.35, z, rot, 1.3, 0.45, { font: '700 52px Poppins', double: true });
  sign(['Potager'], -16.45, -8, -Math.PI / 2);
  sign(['Piscine'], 16.45, -8, Math.PI / 2);

  // ------------------------------------------------ front lawn, allée palms & lamps
  for (let z = 2; z <= 22; z += 6.5) { palm(-4.6, z); palm(4.6, z + 3); }
  for (const [x, z] of [[-12, 4], [12, 6], [-9, 13], [10, 14], [-14, 11], [13, 1]]) palm(x, z, 2.6);
  E.lamps = [];
  for (const z of [0, 10, 20, 32, 42]) {
    for (const x of [-3.3, 3.3]) {
      const l = lampPost();
      l.position.set(x, 0.08, z);
      b.root.add(l);
      game.physics.addBox(x, 1.6, z, 0.3, 3.2, 0.3);
      E.lamps.push(l);
      if (x > 0) b.lamp(0, 3.4, z, { intensity: 6, range: 12, on: () => game.tod === 'dusk' });
    }
  }
  for (const [x, z, r] of [[-8, 8, 0.5], [8, 8, -0.5]]) { const bb = bench(); bb.position.set(x, 0.03, z); bb.rotation.y = r + (x < 0 ? Math.PI / 2 : -Math.PI / 2); b.root.add(bb); game.physics.addBox(x, 0.5, z, 1.0, 1, 1.9, 0); }

  // ------------------------------------------------ restaurant terrace
  b.floor(8, -16, 24, -10.5, 0.12, 'wood', { t: 0.14 });
  b.surface(8, -16, 24, -10.5, 'wood', -1, 3);
  for (const x of [11, 16, 21]) {
    b.prop('furniture-kit/tableRound', x, 0.12, -13, { collide: true });
    for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) b.prop('furniture-kit/chair', x + Math.sin(a) * 0.95, 0.12, -13 + Math.cos(a) * 0.95, { rot: a + Math.PI, collide: false });
    const p = parasol(x === 16 ? '#24a7a0' : '#ff7458');
    p.position.set(x, 0.12, -13);
    b.root.add(p);
  }

  // ------------------------------------------------ pool garden (east)
  const deck = 'terracotta';
  b.floor(27, -27, 49, -24, 0.08, deck, { t: 0.1 });
  b.floor(27, -10, 49, -7, 0.08, deck, { t: 0.1 });
  b.floor(27, -24, 30, -10, 0.08, deck, { t: 0.1 });
  b.floor(46, -24, 49, -10, 0.08, deck, { t: 0.1 });
  b.surface(27, -27, 49, -7, 'concrete', -3, 3);
  // basin
  const tile = paintedMat('pooltile');
  b.box(38, -1.7, -17, 16, 0.1, 14, tile, { cast: false });
  b.box(38, -1.6, -24.1, 16.4, 1.68, 0.2, tile, { cast: false });
  b.box(38, -1.6, -9.9, 16.4, 1.68, 0.2, tile, { cast: false });
  b.box(29.9, -1.6, -17, 0.2, 1.68, 14, tile, { cast: false });
  b.box(46.1, -1.6, -17, 0.2, 1.68, 14, tile, { cast: false });
  for (const [x0, z0, x1, z1] of [[29.8, -24.2, 46.2, -24.2], [29.8, -9.8, 46.2, -9.8], [29.8, -24.2, 29.8, -9.8], [46.2, -24.2, 46.2, -9.8]]) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    b.box((x0 + x1) / 2, 0.08, (z0 + z1) / 2, x0 === x1 ? 0.5 : len + 0.5, 0.12, x0 === x1 ? len + 0.5 : 0.5, toon(0xfff6ea), { collide: false });
  }
  game.physics.addBox(38, -0.4, -17, 15.6, 2.6, 13.6); // invisible: "baignade interdite"
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), seaMaterial(game, { shallow: 0x4fd6e6, deep: 0x4fd6e6, scale: 1.6, pool: true }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(38, -0.18, -17);
  b.root.add(pool);
  E.pool = pool;
  const fl = flamingoFloat(1.1);
  fl.position.set(41, -0.2, -14);
  fl.userData.dynamic = true;
  b.root.add(fl);
  E.flamingo = fl;
  game.updaters.push((dt, t) => { fl.position.x = 41 + Math.sin(t * 0.17) * 2.5; fl.position.z = -14 + Math.sin(t * 0.11) * 1.8; fl.rotation.y = t * 0.12; fl.position.y = -0.2 + Math.sin(t * 1.3) * 0.04; });
  const lg = lifeguardChair();
  lg.position.set(28.4, 0.08, -17);
  lg.userData.dynamic = true;
  lg.rotation.y = Math.PI / 2;
  b.root.add(lg);
  game.physics.addBox(28.4, 1.4, -17, 1.1, 2.8, 1.1);
  E.lifeguard = lg;
  for (let i = 0; i < 4; i++) {
    b.prop('furniture-kit/loungeChairRelax', 33 + i * 3.4, 0.08, -8.4, { rot: Math.PI, s: 1.1 });
    if (i % 2 === 0) { const p = parasol(i ? '#ff8fb1' : '#24a7a0'); p.position.set(34.7 + i * 3.4, 0.08, -8); b.root.add(p); }
    const tw = towel(['#ff7458', '#24a7a0', '#ffc23d', '#ff8fb1'][i]);
    tw.position.set(33 + i * 3.4, 0.6, -8.5);
    b.root.add(tw);
  }
  for (let i = 0; i < 3; i++) b.prop('furniture-kit/loungeChairRelax', 47.6, 0.08, -21 + i * 3.4, { rot: -Math.PI / 2, s: 1.1 });
  const tb = tikiBar(4.2, 2.6);
  tb.group.position.set(53, 0.08, -17);
  tb.group.rotation.y = -Math.PI / 2;
  b.root.add(tb.group);
  game.physics.addBox(52.2, 0.6, -17, 1.0, 1.2, 4.4);
  game.physics.addBox(54.6, 1.5, -17, 0.6, 3, 4.4);
  for (let i = 0; i < 3; i++) b.prop('furniture-kit/chair', 50.6, 0.08, -18.4 + i * 1.4, { rot: Math.PI / 2, s: 1.05, collide: false });
  b.floor(49, -21, 56, -13, 0.08, 'wood', { t: 0.1 });
  E.tiki = tb;
  for (const [x, z] of [[50, -26], [50, -8], [26, -8], [36, -28], [44, -28], [55, -24], [55, -10]]) palm(x, z, 3);
  // the mysterious slide from the office hatch down to the pool
  const sl = slide([
    new THREE.Vector3(24.3, Y1 + 0.75, -25.9), new THREE.Vector3(25.8, Y1 + 0.35, -26.3), new THREE.Vector3(27.6, Y1 - 0.6, -25.8),
    new THREE.Vector3(28.8, Y1 - 1.8, -24.2), new THREE.Vector3(29.4, 1.4, -22.4), new THREE.Vector3(30.8, 0.5, -21.2), new THREE.Vector3(32.4, 0.05, -20.8),
  ]);
  b.root.add(sl);
  E.slide = sl;
  b.sign(['TOBOGGAN', 'Fermé pour travaux', 'depuis 1987'], 27.2, 1.5, -27.2, 0, 1.4, 0.8, { font: '700 46px Poppins', bg: '#ffc23d' });
  b.box(27.2, 0, -27.25, 0.1, 1.1, 0.1, toon(0x2a2a3a), { collide: false });

  // ------------------------------------------------ vegetable garden (west)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const x = -46 + c * 6;
      const z = -30 + r * 5;
      const bed = raisedBed(4, 1.6);
      bed.position.set(x, 0.03, z);
      b.root.add(bed);
      game.physics.addBox(x, 0.25, z, 4, 0.5, 1.6);
      const crop = ['nature-kit/crop_carrot', 'nature-kit/crops_leafsStageB', 'nature-kit/crop_pumpkin', 'nature-kit/crops_cornStageD', 'nature-kit/crop_melon', 'nature-kit/crops_wheatStageB'][(r * 3 + c) % 6];
      for (let k = 0; k < 4; k++) b.prop(crop, x - 1.4 + k * 0.95, 0.44, z, { s: 1.4, rot: rnd() * 6, collide: false });
    }
  }
  // tomato bed (guarded by the scarecrow)
  const tbed = raisedBed(4.4, 1.8);
  tbed.position.set(-38, 0.03, -13);
  b.root.add(tbed);
  game.physics.addBox(-38, 0.25, -13, 4.4, 0.5, 1.8);
  E.tomatoPlants = [];
  for (let k = 0; k < 4; k++) {
    const tp = tomatoPlant(3);
    tp.position.set(-39.6 + k * 1.05, 0.44, -13);
    tp.userData.dynamic = true;
    b.root.add(tp);
    E.tomatoPlants.push(tp);
  }
  const sc = scarecrow();
  sc.position.set(-35, 0.03, -11);
  sc.rotation.y = -0.6;
  b.root.add(sc);
  game.physics.addBox(-35, 1.1, -11, 0.4, 2.2, 0.4);
  E.scarecrow = sc;
  const gh = greenhouse(5, 3.6, 2.6);
  gh.position.set(-49, 0.03, -6);
  b.root.add(gh);
  game.physics.addBox(-49, 1.3, -6, 5, 2.6, 3.6);
  b.box(-29, 0.03, 4, 3, 2.5, 2.4, paintedMat('wood', 0xd9b48a));
  const shedRoof = mesh(new THREE.ConeGeometry(2.4, 1.0, 4), toon(0xc4572d), -29, 3.0, 4, b.root);
  shedRoof.rotation.y = Math.PI / 4;
  shedRoof.scale.z = 0.85;
  b.prop('fantasy-town-kit/cart', -33, 0.03, 6, { rot: 0.6, s: 0.9 });
  for (const [x, z] of [[-54, -20], [-52, 6], [-42, 10], [-30, -36], [-56, -32], [-36, -2]]) b.prop(rnd() < 0.5 ? 'nature-kit/tree_oak' : 'nature-kit/tree_default', x, 0, z, { s: 2.4, rot: rnd() * 6, collide: false }) && game.physics.addBox(x, 1.5, z, 0.6, 3, 0.6);
  b.surface(-64, -60, -16, 18, 'grass', -1, 3);
  b.surface(16, -60, 64, 18, 'grass', -1, 3);
  b.surface(27, -27, 49, -7, 'concrete', -3, 3);
  b.surface(49, -21, 56, -13, 'wood', -1, 3);

  // ------------------------------------------------ beach, huts, sandcastle
  ['#24a7a0', '#ff7458', '#ffc23d', '#ff8fb1'].forEach((c, i) => {
    const h = beachHut(c);
    h.position.set(24 + i * 3.4, 0, 27);
    h.rotation.y = 0;
    b.root.add(h);
    game.physics.addBox(24 + i * 3.4, 1.2, 27, 1.9, 2.4, 1.9);
  });
  for (const [x, z, c] of [[-10, 32, '#ff7458'], [-22, 30, '#24a7a0'], [12, 34, '#ffc23d'], [28, 36, '#ff8fb1'], [-34, 34, '#ffc23d']]) {
    const p = parasol(c, '#fff4e2', 2.3, 1.3);
    p.position.set(x, 0, z);
    p.rotation.z = 0.08;
    b.root.add(p);
    const t = towel(c);
    t.position.set(x + 0.8, 0.02, z + 0.6);
    t.rotation.z = 0.3;
    b.root.add(t);
  }
  const castle = sandcastle();
  castle.position.set(-16, 0, 37);
  b.root.add(castle);
  game.physics.addBox(-16, 0.6, 37, 1.8, 1.2, 1.8);
  E.castle = castle;
  b.prop('nature-kit/canoe', 18, 0, 40, { rot: 0.4, s: 1.6, collide: false });
  b.prop('nature-kit/canoe_paddle', 19.4, 0.05, 41, { rot: 1.2, s: 1.6, collide: false });
  for (const [x, z] of [[-30, 26], [-44, 24], [40, 24], [48, 30], [-6, 26], [8, 25]]) palm(x, z, 3.2);
  // lighthouse on its rocks
  const lh = lighthouse();
  lh.position.set(-53, 0.3, 42);
  lh.userData.beam.userData.dynamic = true;
  b.root.add(lh);
  game.physics.addBox(-53, 5, 42, 3.2, 10, 3.2);
  game.updaters.push((dt) => { lh.userData.beam.rotation.y += dt * 0.6; });
  for (const [x, z, n, s] of [[-50, 46, 'nature-kit/rock_largeA', 3], [-56, 38, 'nature-kit/rock_largeB', 3.4], [-57, 46, 'nature-kit/rock_tallA', 2.2], [-48, 40, 'nature-kit/rock_largeC', 2.5],
    [58, -30, 'nature-kit/rock_largeA', 3], [60, 10, 'nature-kit/rock_tallB', 2.4], [-60, -10, 'nature-kit/rock_largeB', 3], [44, 46, 'nature-kit/rock_largeC', 3], [-30, -52, 'nature-kit/rock_tallA', 2.5], [30, -53, 'nature-kit/rock_largeB', 3]]) {
    b.prop(n, x, -0.2, z, { s, rot: rnd() * 6 });
  }
  E.lighthouse = lh;

  // ------------------------------------------------ pier, gate and the boat
  const pw = 3.2;
  b.box(0, 0.12, 60, pw, 0.22, 28, paintedMat('wood'), { tile: 1.5 });
  for (let z = 47; z <= 73; z += 3) for (const x of [-pw / 2, pw / 2]) mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.6, 8), paintedMat('wood'), x, -0.5, z, b.root);
  for (const x of [-pw / 2 - 0.05, pw / 2 + 0.05]) game.physics.addBox(x, 0.8, 60, 0.15, 1.4, 28);
  game.physics.addBox(0, 0.8, 74.2, pw, 1.4, 0.2);
  for (const x of [-pw / 2 - 0.05, pw / 2 + 0.05]) b.box(x, 0.34, 60, 0.08, 0.06, 28, toon(0xfff6ea), { collide: false });
  for (let z = 47.5; z <= 73; z += 1.6) for (const x of [-pw / 2 - 0.05, pw / 2 + 0.05]) b.box(x, 0.34, z, 0.06, 0.65, 0.06, toon(0xfff6ea), { collide: false });
  for (let z = 47.5; z <= 73; z += 1.6) for (const x of [-pw / 2 - 0.05, pw / 2 + 0.05]) b.box(x, 0.97, z, 0.06, 0.04, 1.6, toon(0xfff6ea), { collide: false });
  b.box(0, 0.08, 46.2, pw, 0.16, 1.2, paintedMat('wood'), { collide: true });
  for (const x of [-pw / 2 - 0.3, pw / 2 + 0.3]) b.box(x, 0, 47.4, 0.5, 2.4, 0.5, paintedMat('paving', 0xf6efe2));
  E.pierGate = [
    new Door(b, 'pier_l', -pw / 2 - 0.05, 47.4, 0, { w: pw / 2 + 0.05, h: 2.0, y: 0.23, mat: gm, panels: false, fit: true, swing: 1 }),
    new Door(b, 'pier_r', pw / 2 + 0.05, 47.4, Math.PI, { w: pw / 2 + 0.05, h: 2.0, y: 0.23, mat: gm, panels: false, fit: true, swing: -1 }),
  ];
  E.pierGate.forEach((g) => g.pivot.children.forEach((c) => { if (c.geometry && c.geometry.type === 'SphereGeometry') c.visible = false; }));
  b.sign(['PONTON PRIVÉ'], 0, 2.65, 47.1, Math.PI, 2.2, 0.5, { font: '800 58px Poppins', bg: '#1b2440', fg: '#ffc23d', border: '#ffc23d', double: true });
  const boat = b.prop('watercraft-kit/boat-speed-a', 4.6, -0.75, 67, { rot: 0, collide: false, s: 1.15 });
  E.boat = boat;
  boat.userData.dynamic = true;
  game.physics.addBox(4.6, 0, 67, 3.6, 2, 7.2);
  game.updaters.push((dt, t) => { boat.position.y = -0.75 + Math.sin(t * 1.1) * 0.06; boat.rotation.z = Math.sin(t * 0.8) * 0.02; });
  const name = textTexture(['Mirage II'], { w: 512, h: 128, bg: null, border: null, fg: '#1b2440', font: '400 80px Pacifico' });
  const nm = b.plane(0, 0.8, 0, 2.0, 0.5, name, { transparent: true, parent: boat });
  nm.position.set(-1.72, 0.95, -0.6);
  nm.rotation.y = -Math.PI / 2;
  for (const [x, z] of [[-8, 58], [10, 64], [-14, 70], [16, 54]]) b.prop('watercraft-kit/buoy', x, -0.9, z, { collide: false, s: 0.6 });
  b.prop('watercraft-kit/boat-row-small', -6, -0.55, 62, { rot: 1.3, collide: false, s: 0.7 });

  b.lamp(0, 3, 47.5, { intensity: 5, range: 10, on: () => game.tod === 'dusk' });
  // ambience
  E.sea = game.audio.ambient('sea', new THREE.Vector3(0, 0, 44), 45, 0.5);
  E.sea2 = game.audio.ambient('sea', new THREE.Vector3(55, 0, -10), 30, 0.35);
  E.fountainSnd = game.audio.ambient('fountain', new THREE.Vector3(0, 1, -8.5), 14, 0.5);
  return E;
}

function mulberry(a) {
  return () => { a |= 0; a = a + 0x6d2b79f5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
