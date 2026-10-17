// The directrice's office (first floor, east wing): the 4-star door, the trap, the symbol safe, the secret bookcase and the slide.
import * as THREE from 'three';
import { toon, paintedMat, canvasTexture, textTexture } from '../../engine/toon.js';
import { Y1, ROOF } from '../hotel.js';
import { mesh } from '../props.js';
import { ITEMS, STAR_SYMBOLS } from '../items.js';
import { SYM } from './spa.js';
import { pickup, duckSpot, biscuitSpot, readable, dyn, V3 } from '../puzzle.js';

export const OFFICE_MODELS = ['furniture-kit/bookcaseClosedWide', 'furniture-kit/bookcaseOpen', 'furniture-kit/books', 'furniture-kit/pottedPlant', 'furniture-kit/rugRectangle', 'furniture-kit/loungeSofa', 'furniture-kit/lampRoundFloor', 'furniture-kit/computerScreen', 'furniture-kit/coatRackStanding'];

const Y = Y1;
// the safe wants the star symbols in the order of the directrice's inspection round
export const SAFE_ORDER = ['poisson', 'feuille', 'coquillage', 'soleil'];
const AREA_OF = { coquillage: 'Suite 7', soleil: 'Jardins', feuille: 'Spa', poisson: 'Restaurant' };

function mapTexture() {
  return canvasTexture(640, 440, (x, W, H) => {
    x.fillStyle = '#f6e6c8'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#8a6420'; x.lineWidth = 8; x.strokeRect(4, 4, W - 8, H - 8);
    x.fillStyle = '#8a3b2a'; x.font = '400 34px Pacifico'; x.textAlign = 'center'; x.fillText('Ma tournée d\'inspection', W / 2, 48);
    // stylised hotel plan
    x.fillStyle = '#ffd2c2'; x.fillRect(120, 90, 400, 150);
    x.strokeStyle = '#2a2233'; x.lineWidth = 4; x.strokeRect(120, 90, 400, 150);
    x.beginPath(); x.moveTo(253, 90); x.lineTo(253, 240); x.moveTo(386, 90); x.lineTo(386, 240); x.stroke();
    x.fillStyle = '#7fbf4d'; x.fillRect(60, 260, 520, 90);
    x.fillStyle = '#3fb7c9'; x.fillRect(440, 275, 110, 60);
    x.fillStyle = '#2a2233'; x.font = '700 20px Poppins';
    const spots = { 'Suite 7': [186, 130], Spa: [186, 205], Restaurant: [453, 205], Jardins: [300, 315] };
    for (const [n, [px, py]] of Object.entries(spots)) x.fillText(n, px, py);
    // dotted route with numbered stops: Restaurant → Spa → Suite 7 → Jardins
    const route = ['Restaurant', 'Spa', 'Suite 7', 'Jardins'];
    x.setLineDash([10, 10]); x.strokeStyle = '#c3352b'; x.lineWidth = 5; x.beginPath();
    route.forEach((n, i) => { const [px, py] = spots[n]; if (i) x.lineTo(px, py - 30); else x.moveTo(px, py - 30); });
    x.stroke(); x.setLineDash([]);
    route.forEach((n, i) => {
      const [px, py] = spots[n];
      x.fillStyle = '#c3352b'; x.beginPath(); x.arc(px + 52, py - 34, 19, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#fff'; x.font = '800 24px Poppins'; x.fillText(String(i + 1), px + 52, py - 25);
    });
    x.fillStyle = '#5a4a3a'; x.font = 'italic 600 18px Poppins'; x.fillText('« Chaque matin, même ordre. Même mon coffre le sait. »', W / 2, H - 40);
  });
}

function bigPortrait() {
  return canvasTexture(320, 420, (x, W, H) => {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5b3a8a'); g.addColorStop(1, '#2a1a4a'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = '#4a4e5e'; x.beginPath(); x.ellipse(W / 2, H * 0.98, W * 0.42, H * 0.34, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#f2b48c'; x.beginPath(); x.arc(W / 2, H * 0.42, 62, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#e8613b'; x.beginPath(); x.arc(W / 2, H * 0.19, 40, 0, Math.PI * 2); x.fill(); x.beginPath(); x.ellipse(W / 2, H * 0.33, 66, 26, 0, Math.PI, 0); x.fill();
    x.fillStyle = '#2a2233'; x.fillRect(W / 2 - 30, H * 0.41, 16, 5); x.fillRect(W / 2 + 14, H * 0.41, 16, 5); x.beginPath(); x.arc(W / 2, H * 0.5, 14, 0.2, Math.PI - 0.2); x.stroke();
    x.fillStyle = '#ffc23d';
    for (let i = 0; i < 5; i++) { const cx = 60 + i * 50; const cy = H - 34; x.beginPath(); for (let k = 0; k < 10; k++) { const a = Math.PI / 2 + (k / 10) * Math.PI * 2; const r = k % 2 ? 7 : 16; x.lineTo(cx + Math.cos(a) * r, cy - Math.sin(a) * r); } x.fill(); }
  });
}

// wall safe with four symbol buttons; returns { group, clickables, solved }
function symbolSafe(game, onOpen) {
  const g = new THREE.Group();
  const metal = paintedMat('metal', 0x7d8794);
  mesh(new THREE.BoxGeometry(0.9, 0.9, 0.12), metal, 0, 0, 0, g);
  const door = new THREE.Group();
  door.position.set(-0.4, 0, 0.07);
  g.add(door);
  mesh(new THREE.BoxGeometry(0.8, 0.8, 0.04), paintedMat('metal', 0xa7b1bd), 0.4, 0, 0, door);
  const syms = ['coquillage', 'soleil', 'feuille', 'poisson'];
  const btns = [];
  syms.forEach((s, i) => {
    const tex = canvasTexture(128, 128, (x, w, h) => { x.fillStyle = '#fff6e3'; x.beginPath(); x.arc(64, 64, 62, 0, Math.PI * 2); x.fill(); SYM[s](x, 64, 64, 44); });
    const btn = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 20), [toon(0xc9a24a), toon(0xffffff, { map: tex, unique: true, rim: false }), toon(0xc9a24a)], 0.4 + (i % 2 ? 0.16 : -0.16), (i < 2 ? 0.12 : -0.2), 0.04, door);
    btn.rotation.x = Math.PI / 2;
    btn.userData.base = 0.04;
    btns.push({ mesh: btn, sym: s });
  });
  const leds = [];
  for (let i = 0; i < 4; i++) leds.push(mesh(new THREE.SphereGeometry(0.02, 8, 6), toon(0x332a3a, { unique: true }), 0.4 - 0.18 + i * 0.12, 0.33, 0.04, door));
  let entry = [];
  const state = { solved: false };
  const setLeds = (n, color) => leds.forEach((l, i) => { l.material.color.set(i < n ? color : 0x332a3a); l.material.emissive.set(i < n ? color : 0x000000); });
  const press = (b) => {
    if (state.solved) return;
    b.mesh.position.z = b.userData ? 0.02 : 0.02;
    setTimeout(() => { b.mesh.position.z = 0.04; }, 140);
    game.audio.sfx('click', 0.6, 1.1);
    entry.push(b.sym);
    setLeds(entry.length, 0x3ddc84);
    if (entry.length === 4) {
      if (entry.every((s, i) => s === SAFE_ORDER[i])) {
        state.solved = true;
        game.audio.sfx('success', 0.8);
        setTimeout(() => onOpen(), 400);
      } else {
        game.audio.sfx('error', 0.7);
        setLeds(4, 0xff3355);
        setTimeout(() => { entry = []; setLeds(0); }, 700);
      }
    }
  };
  return { group: g, door, state, clickables: () => btns.map((b) => ({ mesh: b.mesh, tip: b.sym, onClick: () => press(b) })), reset: () => { entry = []; setLeds(0); } };
}

export function buildOffice(game, b, hotel) {
  const O = {};
  const st = game.state;
  const P = (n, x, z, rot, o = {}) => b.prop(n, x, o.y ?? Y, z, { rot, ...o });

  // ------------------------------------------------ the 4-star door (from the corridor)
  const lobby = () => game.world.areas.lobby;
  const placed = () => [1, 2, 3, 4].filter((n) => st.flag('slot' + n)).length;
  game.story.onApply(() => {
    const L = lobby();
    [1, 2, 3, 4].forEach((n, i) => { L.slots[i].visible = st.flag('slot' + n); });
    if (st.flag('office_open')) game.doors.office.setOpen(true, true);
  });
  game.interact.add({
    pos: [16.6, Y + 1.3, -36.7], r: 2.0,
    label: () => (st.flag('office_open') ? null : (game.state.count('star') > 0 ? 'Placer tes étoiles dans les encoches' : 'Porte du bureau de la directrice')),
    use: async (g) => {
      const L = lobby();
      let n = g.state.count('star');
      if (n <= 0) {
        await g.say([{ who: 'player', text: `« Système Cinq Étoiles » : quatre encoches en forme d'étoile. ${placed()}/4 sont remplies.` }, ...(st.flag('gustave') ? [{ who: 'gustave', text: 'Les étoiles d\'or ! La directrice les a cachées dans ses pièces préférées. Il en faut quatre.' }] : [])]);
        return;
      }
      for (let k = 1; k <= 4 && n > 0; k++) {
        if (st.flag('slot' + k)) continue;
        st.set('slot' + k);
        L.slots[k - 1].visible = true;
        g.take('star');
        n--;
        g.audio.sfx('metal_click', 0.7, 0.9 + k * 0.1);
        g.fx.sparkle(L.slots[k - 1].getWorldPosition(new THREE.Vector3()), 0xffe066, 12);
        await g.wait(0.35);
      }
      g.save();
      if (placed() >= 4) {
        g.audio.sfx('jingle_solve', 0.8);
        g.setFlag('office_open');
        await g.wait(0.5);
        g.doors.office.setOpen(true);
        await g.say([{ who: 'gustave', text: 'Les quatre étoiles brillent… La porte du bureau s\'ouvre. J\'ai un mauvais pressentiment. Un très mauvais. Genre « pas de biscuit pendant un an ».' }]);
      } else {
        await g.say([{ who: 'player', text: `${placed()} étoile${placed() > 1 ? 's' : ''} sur 4. Il en manque encore.` }]);
      }
    },
  });

  // ------------------------------------------------ office interior
  P('furniture-kit/rugRectangle', 16, -24, 0, { collide: false, s: 1.8, tint: 0xd04a4a });
  // grand desk
  const desk = new THREE.Group();
  desk.position.set(16, Y, -22.6);
  b.root.add(desk);
  const mah = paintedMat('panel', 0xc98a6a);
  mesh(new THREE.BoxGeometry(3.0, 0.08, 1.3), paintedMat('wood', 0x8a4a2a), 0, 0.82, 0, desk);
  mesh(new THREE.BoxGeometry(2.9, 0.78, 0.1), mah, 0, 0.4, -0.58, desk);
  for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.8, 0.78, 1.2), mah, s * 1.05, 0.4, 0, desk);
  game.physics.addBox(16, Y + 0.45, -22.6, 3.0, 0.9, 1.3);
  // throne
  const throne = new THREE.Group();
  throne.position.set(16, Y, -21.2);
  b.root.add(throne);
  mesh(new THREE.BoxGeometry(0.9, 0.5, 0.8), toon(0xa8323a), 0, 0.25, 0, throne);
  mesh(new THREE.BoxGeometry(0.9, 1.5, 0.15), toon(0xa8323a), 0, 0.9, 0.35, throne);
  for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.1, 8, 6), toon(0xe9c46a), s * 0.4, 1.7, 0.35, throne);
  game.physics.addBox(16, Y + 0.6, -21.2, 0.9, 1.2, 0.9);
  // desk items: monitor (visio), name plate, candy jar
  P('furniture-kit/computerScreen', 16.2, -22.8, 0, { y: Y + 0.86, collide: false });
  const screenTex = canvasTexture(256, 180, () => {});
  const scr = mesh(new THREE.PlaneGeometry(0.66, 0.42), toon(0xffffff, { map: screenTex, unique: true, emissive: 0xffffff, emissiveIntensity: 0.7, rim: false }), 16.2, Y + 1.19, -22.68, b.root);
  scr.material.emissiveMap = screenTex;
  scr.castShadow = false;
  dyn(scr);
  const drawScreen = (mode) => {
    const c = screenTex.image.getContext('2d');
    const W = 256; const H = 180;
    c.fillStyle = mode === 'face' ? '#2a1a4a' : '#10161a'; c.fillRect(0, 0, W, H);
    if (mode === 'face') {
      c.fillStyle = '#f2b48c'; c.beginPath(); c.arc(W / 2, 100, 46, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#e8613b'; c.beginPath(); c.arc(W / 2, 40, 30, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#2a2233'; c.fillRect(W / 2 - 24, 92, 14, 5); c.fillRect(W / 2 + 10, 92, 14, 5);
      c.beginPath(); c.arc(W / 2, 112, 16, 0.1, Math.PI - 0.1); c.lineWidth = 4; c.strokeStyle = '#2a2233'; c.stroke();
      c.fillStyle = '#ff3355'; c.font = '800 16px Poppins'; c.fillText('● LIVE', 10, 20);
    } else { c.fillStyle = '#3ddc84'; c.font = '700 18px monospace'; c.fillText('> MIRAGES-OS', 12, 30); c.fillText('> clients : 1', 12, 60); c.fillText('> départs : 0', 12, 90); c.fillText('> mdp : ********', 12, 120); }
    screenTex.needsUpdate = true;
  };
  drawScreen('os');
  O.drawScreen = drawScreen;
  b.plane(16, Y + 0.9, -22.0, 0.5, 0.12, textTexture(['V. PINCEVENT — DIRECTRICE'], { w: 512, h: 96, bg: '#e9c46a', fg: '#2a2233', font: '800 34px Poppins', border: null }), { rot: Math.PI });
  biscuitSpot(game, b, 'b_office', 15.0, Y + 0.86, -22.5, 2, 'Piocher dans le pot de biscuits de la directrice');
  readable(game, {
    pos: [16.2, Y + 1.2, -23.3], r: 1.8, label: 'Regarder l\'ordinateur', title: 'Mirages-OS',
    html: '<span style="font-family:monospace">> clients actuels : 1\n> départs autorisés : 0\n> note de l\'hôtel : ★☆☆☆☆\n> objectif : ★★★★★\n> méthode : garder le client jusqu\'à ce qu\'il mette 5 étoiles</span>',
  });
  // portrait + safe on the west wall (x = 8, office side faces +x)
  b.frame(8.2, Y + 2.0, -22.0, 1.6, 2.1, bigPortrait(), Math.PI / 2, 0xe9c46a);
  const safe = symbolSafe(game, () => openSafe(true));
  safe.group.position.set(8.25, Y + 1.5, -28.5);
  safe.group.rotation.y = Math.PI / 2;
  b.root.add(dyn(safe.group));
  O.safe = safe;
  game.updaters.push((dt) => { const w = st.flag('safe5') ? -1.7 : 0; safe.door.rotation.y += (w - safe.door.rotation.y) * Math.min(1, dt * 4); });
  game.interact.add({
    pos: [8.8, Y + 1.5, -28.5], r: 1.8, label: () => (st.flag('safe5') ? null : 'Examiner le coffre-fort mural'),
    inspect: { cam: [9.6, Y + 1.55, -28.5], look: [8.25, Y + 1.5, -28.5], fov: 45, title: 'Coffre-fort — 4 symboles dans le bon ordre', clickables: () => safe.clickables() },
  });
  readable(game, {
    pos: [8.8, Y + 0.8, -28.5], r: 1.6, label: 'Lire la plaque du coffre', title: 'Plaque gravée', visible: () => !st.flag('safe5'),
    html: '« Mes étoiles, dans l\'ordre de ma tournée. »\n\n<i>Quatre boutons : coquillage, soleil, feuille, poisson.</i>',
    clue: 'Coffre du bureau : les symboles des étoiles, dans l\'ordre de la tournée d\'inspection de la directrice.',
  });
  // inspection map on the north wall (office side, facing +z)
  b.frame(20.3, Y + 1.9, -35.78, 2.4, 1.65, mapTexture(), 0, 0x8a6420);
  readable(game, {
    pos: [20.3, Y + 1.6, -35.0], r: 2.2, label: 'Regarder le plan de l\'hôtel', title: 'Ma tournée d\'inspection',
    html: 'Un plan de l\'hôtel annoté au feutre rouge. Une tournée en pointillés, avec des numéros :\n\n<b>1 — Restaurant\n2 — Spa\n3 — Suite 7\n4 — Jardins</b>\n\n« Chaque matin, même ordre. Même mon coffre le sait. »',
    clue: 'Tournée de la directrice : 1 Restaurant, 2 Spa, 3 Suite 7, 4 Jardins.',
  });
  // decor
  P('furniture-kit/loungeSofa', 11.5, -17.2, Math.PI);
  P('furniture-kit/pottedPlant', 8.8, -16.8, 0, { s: 1.4 });
  P('furniture-kit/pottedPlant', 23.2, -16.8, 0, { s: 1.4 });
  P('furniture-kit/lampRoundFloor', 22.9, -22.2, 0, { collide: false });
  P('furniture-kit/coatRackStanding', 9.2, -34.9, 0, { collide: false });
  // trophy cabinet: "Employée du mois" plaques + golden duck
  const tc = new THREE.Group();
  tc.position.set(12.0, Y, -35.4);
  b.root.add(tc);
  mesh(new THREE.BoxGeometry(2.2, 2.0, 0.5), paintedMat('panel', 0xc98a6a), 0, 1.0, 0, tc);
  const glass = mesh(new THREE.PlaneGeometry(2.0, 1.4), toon(0xbfe9ff, { transparent: true, opacity: 0.25 }), 0, 1.25, 0.26, tc);
  glass.castShadow = false;
  for (let i = 0; i < 6; i++) b.plane(11.3 + (i % 3) * 0.7, Y + 1.0 + Math.floor(i / 3) * 0.6, -35.14, 0.42, 0.3, textTexture(['Employée', 'du mois', 'V.P.'], { w: 128, h: 96, bg: '#e9c46a', fg: '#2a2233', font: '700 18px Poppins', border: '#8a6420' }));
  game.physics.addBox(12.0, Y + 1.0, -35.4, 2.2, 2.0, 0.5);
  duckSpot(game, b, 'd_office', 12.9, Y + 1.92, -35.3, 0);
  for (const [x, z] of [[12, -26], [20, -26], [16, -32]]) b.lamp(x, ROOF - 1.3, z, { intensity: 5, range: 10, color: 0xffd0a0 });
  // alarm beacons (red, flashing during the trap)
  const beacons = [];
  for (const [x, z] of [[9, -35.5], [23, -17]]) {
    const bc = mesh(new THREE.SphereGeometry(0.15, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(0x661122, { emissive: 0x000000, unique: true }), x, ROOF - 0.3, z, b.root);
    bc.rotation.x = Math.PI;
    beacons.push(dyn(bc));
    b.lamp(x, ROOF - 1.3, z, { intensity: 9, range: 12, color: 0xff2244, on: () => !!game.timers.office, flicker: true });
  }
  game.updaters.push((dt, t) => { const on = !!game.timers.office; beacons.forEach((bc) => bc.material.emissive.setRGB(on && Math.sin(t * 10) > 0 ? 1 : 0, 0, on ? 0.1 : 0)); });

  // ------------------------------------------------ the secret bookcase hiding the slide hatch (east wall)
  const bcase = b.prop('furniture-kit/bookcaseClosedWide', 23.55, Y, -26.0, { rot: -Math.PI / 2, s: 1.35, collide: false });
  dyn(bcase);
  game.physics.addDynamic('bookcase', 23.55, Y + 1.0, -26.0, 0.65, 2.0, 2.1, 0);
  O.bookcase = bcase;
  // the one book never read: "Comment rendre ses clients heureux"
  const book = mesh(new THREE.BoxGeometry(0.22, 0.32, 0.08), toon(0x24c7b8, { emissive: 0x0a3a34, unique: true }), 23.2, Y + 1.25, -25.4, b.root);
  book.rotation.y = -Math.PI / 2;
  dyn(book);
  const dust = game.fx.emitter((fx) => { if (!st.flag('bookcase')) fx.spawn(V3(23.15, Y + 1.45, -25.4), V3((Math.random() - 0.5) * 0.1, 0.1, (Math.random() - 0.5) * 0.1), { life: 1.5, s0: 0.03, s1: 0.02, color: 0xfff1c8 }); }, 5);
  O.dust = dust;
  const slideOpen = (instant) => {
    game.physics.setDynamic('bookcase', false);
    if (instant) { bcase.position.z = -28.3; book.position.z = -27.7; } else {
      let t = 0;
      const f = (dt) => { t = Math.min(1, t + dt / 1.6); const k = t * t * (3 - 2 * t); bcase.position.z = -26.0 - k * 2.3; book.position.z = -25.4 - k * 2.3; if (t >= 1) game.updaters.splice(game.updaters.indexOf(f), 1); };
      game.updaters.push(f);
    }
    game.doors.hatch.setOpen(true, instant);
  };
  game.story.onApply(() => { if (st.flag('bookcase')) slideOpen(true); if (st.flag('safe5')) safe.state.solved = true; });
  readable(game, {
    pos: [22.9, Y + 1.3, -26.0], r: 2.0, label: 'Regarder la bibliothèque', title: 'La bibliothèque de la directrice', visible: () => !st.flag('bookcase'),
    html: 'Des rangées de livres reliés cuir, impeccables :\n« L\'art de dire non », « Le client, ce gibier », « Ma vie, mon œuvre, mon hôtel (tome 12) »…\n\nUn seul livre turquoise est couvert de poussière, comme s\'il n\'avait <b>jamais été ouvert</b> :\n<b>« Comment rendre ses clients heureux »</b>.',
    clue: 'Bibliothèque : un livre poussiéreux jamais ouvert, « Comment rendre ses clients heureux ».',
  });
  game.interact.add({
    pos: [23.0, Y + 1.25, -25.4], r: 1.5, obj: book, label: () => (st.flag('bookcase') ? null : 'Tirer le livre poussiéreux'),
    use: async (g) => {
      g.audio.sfx('book_flip', 0.6);
      g.audio.sfx('creak2', 0.8, 0.7);
      g.setFlag('bookcase');
      slideOpen(false);
      await g.wait(1.2);
      await g.say([{ who: 'gustave', text: 'Un passage secret ! La trappe du fameux toboggan « fermé pour travaux depuis 1987 ». Elle nous a toujours menti !' }]);
    },
  });
  game.interact.add({
    pos: [23.4, Y + 1.0, -26.0], r: 1.6, label: () => (st.flag('bookcase') && game.doors.hatch.open ? (st.flag('safe5') ? 'Plonger dans le toboggan !' : 'Le toboggan… (il faut d\'abord la clé du bateau !)') : null),
    use: async (g) => {
      if (!st.flag('safe5')) { await g.say([{ who: 'gustave', text: 'Attends ! Sans la clé du bateau, on va juste finir dans la piscine. Le coffre-fort d\'abord !' }]); return; }
      await rideSlide(g);
    },
  });

  // ------------------------------------------------ safe contents: boat key + 5th star
  const bk = ITEMS.boat_key.make();
  bk.position.set(8.3, Y + 1.38, -28.65);
  bk.rotation.y = Math.PI / 2;
  b.root.add(bk);
  pickup(game, { id: 'boat_key', item: 'boat_key', obj: bk, pos: [8.8, Y + 1.4, -28.6], visible: () => st.flag('safe5') });
  const s5 = ITEMS.star.make();
  s5.position.set(8.3, Y + 1.62, -28.35);
  s5.rotation.y = Math.PI / 2;
  b.root.add(s5);
  pickup(game, { id: 'star5', item: 'star', flag: 'star5', obj: s5, pos: [8.8, Y + 1.6, -28.3], visible: () => st.flag('safe5'), label: 'Prendre la 5e étoile', text: '<b>La 5e étoile !</b> Celle que la directrice gardait pour elle.', onTake: (g) => g.story.gotStar(5) });
  const openSafe = async () => {
    game.setFlag('safe5');
    game.audio.sfx('metal_latch', 0.8);
    game.audio.sfx('jingle_solve', 0.7);
    game.exitInspect();
    await game.wait(0.8);
    await game.say([{ who: 'gustave', text: 'Poisson, feuille, coquillage, soleil : sa tournée ! Le coffre est ouvert : la clé du bateau… et une 5e étoile ! Maintenant, il faut trouver une sortie !' }]);
  };

  // ------------------------------------------------ the trap (entering the office)
  b.zone('bureau', [8, Y - 0.5, -36, 24, ROOF, -16], {
    music: 'office', area: 'bureau',
    enter: (g) => { if (st.flag('office_open') && !st.flag('escaped') && !g.timers.office && !st.flag('slid')) trap(g); },
  });
  const trap = async (g) => {
    await g.cut(async () => {
      g.doors.office.setOpen(false);
      g.audio.sfx('door_close2', 1);
      g.audio.sfx('hit_drama', 0.8);
      await g.wait(0.4);
      drawScreen('face');
      await g.shot([16.2, Y + 1.6, -24.4], [16.2, Y + 1.15, -22.7], 1.0, 45);
      if (!st.flag('trap_seen')) {
        st.set('trap_seen');
        await g.say([
          { who: 'directrice', text: 'Bravo, bravo ! Quatre étoiles trouvées. Vous êtes le client le plus doué que j\'aie jamais… <b>enfermé</b>.' },
          { who: 'directrice', text: 'Vous croyiez vraiment que j\'allais vous laisser fouiller mon bureau ? Je viens de lancer le programme <b>« Grand Ménage »</b>.' },
          { who: 'directrice', text: 'Dans trois minutes, ce bureau sera aspiré, ciré, lustré… et scellé. Vous compris. Vous ferez un très joli presse-papier.' },
          { who: 'directrice', text: 'Ma clé de bateau ? Dans mon coffre, évidemment. Bonne chance ! Hi hi hi !' },
          { who: 'gustave', text: 'Elle est complètement toquée ! Vite : le coffre, puis une sortie. Regarde partout : plan, bibliothèque, tout !' },
        ]);
      } else {
        await g.say([{ who: 'directrice', text: 'Encore vous ?! Grand Ménage, deuxième passage. Trois minutes. Et cette fois, j\'ajoute la cire au citron.' }]);
      }
      drawScreen('os');
    });
    g.startTimer('office', 'Grand Ménage', 180, () => cleaned(g));
    g.audio.playMusic('chrono', 0.5);
  };
  const cleaned = async (g) => {
    await g.cut(async () => {
      g.audio.sfx('whoosh', 0.9, 0.5);
      g.fx.puff(g.player.position.clone().add(V3(0, 1, 0)), 40, 0xffffff);
      await g.ui.fade(true, 900);
      g.player.teleport(16, Y + 0.1, -38, 0);
      g.rig.follow(true);
      g.doors.office.setOpen(true, true);
      await g.wait(0.6);
      await g.ui.fade(false, 900);
      await g.say([
        { who: 'gustave', text: 'On a été aspirés, cirés et recrachés dans le couloir ! Je brille comme un parquet neuf.' },
        { who: 'gustave', text: 'La porte est rouverte. On y retourne ? Ce qui est fait reste fait : le coffre et la bibliothèque n\'ont pas bougé.' },
      ]);
      st.s.deaths++;
      g.save();
    });
  };

  // ------------------------------------------------ slide ride → pool → pier
  const rideSlide = async (g) => {
    g.stopTimer('office');
    g.setFlag('slid');
    await g.cut(async () => {
      const curve = g.world.areas.exterior.slide.userData.curve;
      g.audio.sfx('whoosh', 0.9);
      g.player.play('fall', 0.1);
      const pl = g.player;
      pl.kinematic = true;
      const dur = 3.2;
      let t = 0;
      await new Promise((res) => {
        const f = (dt) => {
          t = Math.min(1, t + dt / dur);
          const k = t * t * 0.6 + t * 0.4;
          const p = curve.getPoint(k);
          const tn = curve.getTangent(k);
          pl.root.position.copy(p).add(V3(0, -0.45, 0));
          pl.model.rotation.y = Math.atan2(tn.x, tn.z);
          const back = p.clone().addScaledVector(tn, -3).add(V3(0, 1.6, 0));
          g.rig.cam.position.lerp(back, 0.2);
          g.rig.cam.lookAt(p);
          if (t >= 1) { g.updaters.splice(g.updaters.indexOf(f), 1); res(); }
        };
        g.rig.mode = 'shot';
        g.rig.shot = null;
        g.updaters.push(f);
      });
      g.audio.sfx('plop', 1, 0.5);
      g.fx.splash(V3(33, -0.1, -20.6), 60);
      pl.kinematic = false;
      pl.teleport(33.5, 0.1, -8.6, Math.PI);
      g.rig.yaw = 0;
      g.rig.follow(true);
      g.mode = 'cut';
      await g.wait(0.4);
      g.audio.playMusic('final', 1.0);
      await g.say([
        { who: 'gustave', text: 'YOUHOUUU ! Atterrissage dans la piscine, note artistique : 10 sur 10 !' },
        { who: 'gustave', text: 'Vite, au ponton ! La clé du bateau ouvre aussi la grille. Cours, cours, COURS !' },
      ]);
      g.ui.objective('Cours jusqu\'au ponton et ouvre la grille avec la clé du bateau !');
    });
  };
  O.rideSlide = rideSlide;
  b.surface(8, -36, 24, -16, 'carpet', Y - 1, Y + 3);
  return O;
}
