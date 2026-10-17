// Spa "Bulles de Rêve" (ground floor, west wing). Puzzles P1 (hammam valves), P2 (robe → locker), P3 (timed sauna).
import * as THREE from 'three';
import { toon, paintedMat, canvasTexture, textTexture } from '../../engine/toon.js';
import { DialLock, Knob } from '../locks.js';
import { H0 } from '../hotel.js';
import { mesh } from '../props.js';
import { ITEMS, duck } from '../items.js';
import { pickup, duckSpot, biscuitSpot, readable, dyn, V3 } from '../puzzle.js';

export const SPA_MODELS = ['furniture-kit/loungeChairRelax', 'furniture-kit/pottedPlant', 'furniture-kit/plantSmall3', 'furniture-kit/bench', 'furniture-kit/benchCushionLow', 'furniture-kit/sideTable', 'furniture-kit/coatRackStanding'];

const INK = '#2a2233';

// symbol drawers (canvas 2D) used on valves, dials and posters
export const SYM = {
  eucalyptus: (x, cx, cy, s) => { x.fillStyle = '#3a9e8f'; for (const k of [-1, 1]) { x.beginPath(); x.ellipse(cx + k * s * 0.35, cy, s * 0.32, s * 0.55, k * 0.5, 0, Math.PI * 2); x.fill(); } x.strokeStyle = INK; x.lineWidth = s * 0.08; x.beginPath(); x.moveTo(cx, cy - s * 0.7); x.lineTo(cx, cy + s * 0.7); x.stroke(); },
  menthe: (x, cx, cy, s) => { x.fillStyle = '#4fc85a'; x.beginPath(); x.moveTo(cx, cy - s * 0.8); x.quadraticCurveTo(cx + s * 0.8, cy, cx, cy + s * 0.8); x.quadraticCurveTo(cx - s * 0.8, cy, cx, cy - s * 0.8); x.fill(); x.strokeStyle = '#2b7a33'; x.lineWidth = s * 0.08; x.beginPath(); x.moveTo(cx, cy - s * 0.7); x.lineTo(cx, cy + s * 0.7); for (let i = -2; i <= 2; i++) { x.moveTo(cx, cy + i * s * 0.25); x.lineTo(cx + s * 0.3, cy + i * s * 0.25 - s * 0.15); x.moveTo(cx, cy + i * s * 0.25); x.lineTo(cx - s * 0.3, cy + i * s * 0.25 - s * 0.15); } x.stroke(); },
  lavande: (x, cx, cy, s) => { x.strokeStyle = '#4f8a3a'; x.lineWidth = s * 0.1; x.beginPath(); x.moveTo(cx, cy + s * 0.8); x.lineTo(cx, cy - s * 0.2); x.stroke(); x.fillStyle = '#9b6cff'; for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(cx + (i % 2 ? 0.15 : -0.15) * s, cy - s * 0.15 - i * s * 0.12, s * 0.16, s * 0.1, 0, 0, Math.PI * 2); x.fill(); } },
  soleil: (x, cx, cy, s) => { x.fillStyle = '#ffc23d'; x.beginPath(); x.arc(cx, cy, s * 0.42, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#ff9a3c'; x.lineWidth = s * 0.12; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; x.beginPath(); x.moveTo(cx + Math.cos(a) * s * 0.55, cy + Math.sin(a) * s * 0.55); x.lineTo(cx + Math.cos(a) * s * 0.85, cy + Math.sin(a) * s * 0.85); x.stroke(); } },
  feu: (x, cx, cy, s) => { x.fillStyle = '#ff5a3a'; x.beginPath(); x.moveTo(cx, cy - s * 0.85); x.quadraticCurveTo(cx + s * 0.75, cy, cx + s * 0.4, cy + s * 0.7); x.quadraticCurveTo(cx, cy + s * 0.95, cx - s * 0.4, cy + s * 0.7); x.quadraticCurveTo(cx - s * 0.75, cy, cx, cy - s * 0.85); x.fill(); x.fillStyle = '#ffc23d'; x.beginPath(); x.ellipse(cx, cy + s * 0.4, s * 0.22, s * 0.32, 0, 0, Math.PI * 2); x.fill(); },
  flocon: (x, cx, cy, s) => { x.strokeStyle = '#4fb3ff'; x.lineWidth = s * 0.12; x.lineCap = 'round'; for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI; x.beginPath(); x.moveTo(cx + Math.cos(a) * s * 0.8, cy + Math.sin(a) * s * 0.8); x.lineTo(cx - Math.cos(a) * s * 0.8, cy - Math.sin(a) * s * 0.8); x.stroke(); } for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const px = cx + Math.cos(a) * s * 0.55; const py = cy + Math.sin(a) * s * 0.55; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a + 0.8) * s * 0.22, py + Math.sin(a + 0.8) * s * 0.22); x.moveTo(px, py); x.lineTo(px + Math.cos(a - 0.8) * s * 0.22, py + Math.sin(a - 0.8) * s * 0.22); x.stroke(); } },
  goutte: (x, cx, cy, s) => { x.fillStyle = '#3d8fd6'; x.beginPath(); x.moveTo(cx, cy - s * 0.85); x.quadraticCurveTo(cx + s * 0.65, cy + s * 0.05, cx + s * 0.5, cy + s * 0.45); x.arc(cx, cy + s * 0.4, s * 0.5, 0.1, Math.PI - 0.1); x.quadraticCurveTo(cx - s * 0.65, cy + s * 0.05, cx, cy - s * 0.85); x.fill(); x.fillStyle = '#ffffff99'; x.beginPath(); x.ellipse(cx - s * 0.18, cy + s * 0.3, s * 0.1, s * 0.18, 0.4, 0, Math.PI * 2); x.fill(); },
  vent: (x, cx, cy, s) => { x.strokeStyle = '#7f99a8'; x.lineWidth = s * 0.13; x.lineCap = 'round'; for (const [dy, l] of [[-0.4, 0.9], [0, 1.2], [0.4, 0.7]]) { x.beginPath(); x.moveTo(cx - s * 0.8, cy + dy * s); x.lineTo(cx + s * (l - 0.8), cy + dy * s); x.arc(cx + s * (l - 0.8), cy + dy * s - s * 0.18, s * 0.18, Math.PI / 2, -Math.PI * 0.7, true); x.stroke(); } },
  coquillage: (x, cx, cy, s) => { x.fillStyle = '#ffb38a'; x.beginPath(); x.moveTo(cx - s * 0.8, cy + s * 0.35); x.quadraticCurveTo(cx, cy - s * 1.1, cx + s * 0.8, cy + s * 0.35); x.closePath(); x.fill(); x.strokeStyle = '#c96a3a'; x.lineWidth = s * 0.09; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(cx, cy + s * 0.5); x.lineTo(cx - s * 0.6 + i * s * 0.3, cy - s * 0.2 - Math.sin((i / 4) * Math.PI) * s * 0.4); x.stroke(); } x.fillStyle = '#ffb38a'; x.fillRect(cx - s * 0.22, cy + s * 0.35, s * 0.44, s * 0.3); },
  poisson: (x, cx, cy, s) => { x.fillStyle = '#4fb3ff'; x.beginPath(); x.ellipse(cx - s * 0.1, cy, s * 0.6, s * 0.35, 0, 0, Math.PI * 2); x.fill(); x.beginPath(); x.moveTo(cx + s * 0.4, cy); x.lineTo(cx + s * 0.85, cy - s * 0.4); x.lineTo(cx + s * 0.85, cy + s * 0.4); x.fill(); x.fillStyle = '#2a2233'; x.beginPath(); x.arc(cx - s * 0.4, cy - s * 0.08, s * 0.08, 0, Math.PI * 2); x.fill(); },
  feuille: (x, cx, cy, s) => { x.fillStyle = '#5fbf4a'; x.beginPath(); x.moveTo(cx - s * 0.7, cy + s * 0.7); x.quadraticCurveTo(cx - s * 0.7, cy - s * 0.7, cx + s * 0.75, cy - s * 0.75); x.quadraticCurveTo(cx + s * 0.7, cy + s * 0.7, cx - s * 0.7, cy + s * 0.7); x.fill(); x.strokeStyle = '#2b7a33'; x.lineWidth = s * 0.08; x.beginPath(); x.moveTo(cx - s * 0.7, cy + s * 0.7); x.lineTo(cx + s * 0.5, cy - s * 0.5); x.stroke(); },
};

const symbolCanvas = (name, size = 128, bg = '#fff6e3') => canvasTexture(size, size, (x, w, h) => { if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); } SYM[name](x, w / 2, h / 2, w * 0.38); });

export function buildSpa(game, b, hotel) {
  const P = {};
  const st = game.state;
  const tile = paintedMat('spatile');
  // ------------------------------------------------ ceilings / skins already from hotel; decor of the hall
  b.box(-12, 0.05, -26, 0.8, 0.02, 7, paintedMat('carpet', 0x9ed9cf), { collide: false, cast: false });
  // reception counter
  const counter = mesh(new THREE.BoxGeometry(2.4, 1.05, 0.7), toon(0xffffff), -9.4, 0.58, -32.6, b.root);
  counter.rotation.y = Math.PI / 2;
  mesh(new THREE.BoxGeometry(0.8, 0.06, 2.6), paintedMat('wood', 0xffe2c4), -9.4, 1.12, -32.6, b.root);
  game.physics.addBox(-9.4, 0.55, -32.6, 0.7, 1.1, 2.4);
  b.sign(['Spa', 'Bulles de Rêve'], -8.17, 2.6, -32.6, -Math.PI / 2, 1.6, 0.7, { font: '400 52px Pacifico', bg: '#b8f0ea', fg: '#1d7a72' });
  // jacuzzi
  const jac = new THREE.Group();
  jac.position.set(-12, 0.05, -19.6);
  b.root.add(jac);
  const rim = mesh(new THREE.TorusGeometry(1.5, 0.22, 8, 32), tile, 0, 0.62, 0, jac);
  rim.rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(1.55, 1.6, 0.62, 32), toon(0xeef6f2), 0, 0.31, 0, jac);
  const jw = mesh(new THREE.CircleGeometry(1.42, 32), toon(0x7fe0ec, { emissive: 0x0a3a44 }), 0, 0.58, 0, jac);
  jw.rotation.x = -Math.PI / 2;
  game.physics.addGeometry(new THREE.CylinderGeometry(1.75, 1.75, 1.6, 16), new THREE.Matrix4().makeTranslation(-12, 0.8, -19.6));
  game.fx.emitter((fx) => { const a = Math.random() * Math.PI * 2; const r = Math.random() * 1.2; fx.spawn(V3(-12 + Math.cos(a) * r, 0.66, -19.6 + Math.sin(a) * r), V3(0, 0.25 + Math.random() * 0.2, 0), { life: 0.6, g: 0, s0: 0.06, s1: 0.1, color: 0xffffff }); }, 25);
  game.fx.emitter((fx) => fx.steam(V3(-12, 0.7, -19.6), 1, 2.2, 0xffffff), 3);
  duckSpot(game, b, 'd_jacuzzi', -12.4, 0.58, -19.2, 1.2);
  for (let i = 0; i < 3; i++) { const d = duck(0xffffff, 1.0); d.position.set(-11.4 + i * 0.4, 0.58, -20.4 + (i % 2) * 0.5); d.rotation.y = i * 1.7; b.root.add(dyn(d)); const z0 = d.position.z; game.updaters.push((dt, t) => { d.position.z = z0 + Math.sin(t * 0.7 + i) * 0.15; d.rotation.y += dt * 0.2; }); }
  // loungers, plants, towels
  for (let i = 0; i < 3; i++) b.prop('furniture-kit/loungeChairRelax', -9.0, 0.05, -23.6 - i * 1.4, { rot: -Math.PI / 2, s: 1.05 });
  for (const [x, z] of [[-15.4, -16.7], [-8.7, -16.7], [-15.4, -39.3], [-8.7, -39.3]]) b.prop('furniture-kit/pottedPlant', x, 0.05, z, { s: 1.4 });
  const shelf = mesh(new THREE.BoxGeometry(0.45, 1.6, 1.4), paintedMat('wood', 0xffe2c4), -15.6, 0.85, -31.0, b.root);
  game.physics.addBox(-15.6, 0.85, -31.0, 0.45, 1.6, 1.4);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) mesh(new THREE.BoxGeometry(0.36, 0.14, 0.38), [0xffffff, 0xb8f0ea, 0xffd0c4][(r + c) % 3], -15.55, 0.3 + r * 0.5, -31.45 + c * 0.45, b.root);
  shelf.castShadow = true;
  biscuitSpot(game, b, 'b_spa', -15.55, 1.66, -31.0, 1, 'Prendre le biscuit sur l\'étagère');
  b.lamp(-12, H0 - 1.5, -22, { intensity: 7, range: 12, color: 0xd9fff6 });
  b.lamp(-12, H0 - 1.5, -34, { intensity: 6, range: 10, color: 0xd9fff6 });

  // ------------------------------------------------ P1 clues: aroma programme poster + tear-off calendar
  const progs = [['Lundi', 5, 1, 8], ['Mardi', 9, 4, 3], ['Mercredi', 2, 7, 5], ['Jeudi', 6, 0, 2], ['Vendredi', 1, 3, 9]];
  const poster = canvasTexture(400, 560, (x, W, H) => {
    x.fillStyle = '#eef6f2'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#1d7a72'; x.lineWidth = 10; x.strokeRect(5, 5, W - 10, H - 10);
    x.fillStyle = '#1d7a72'; x.font = '400 40px Pacifico'; x.textAlign = 'center'; x.fillText('Programme Aroma', W / 2, 62);
    x.font = '600 18px Poppins'; x.fillText('Réglage des vannes du hammam', W / 2, 92);
    ['eucalyptus', 'menthe', 'lavande'].forEach((s, i) => SYM[s](x, 200 + i * 70, 140, 22));
    progs.forEach(([d, a, m, l], i) => {
      const y = 205 + i * 66;
      x.fillStyle = i % 2 ? '#ffffff' : '#d9f2ec'; x.fillRect(24, y - 30, W - 48, 58);
      x.fillStyle = INK; x.textAlign = 'left'; x.font = '800 24px Poppins'; x.fillText(d, 36, y + 8);
      x.textAlign = 'center'; x.font = '800 30px Poppins';
      [a, m, l].forEach((v, k) => x.fillText(String(v), 200 + k * 70, y + 10));
    });
    x.font = 'italic 600 16px Poppins'; x.fillStyle = '#5a6a6a'; x.fillText('Week-end : hammam réservé à la Direction.', W / 2, H - 22);
  });
  b.frame(-15.83, 1.9, -26.0, 1.0, 1.4, poster, Math.PI / 2, 0xffffff);
  readable(game, {
    pos: [-15.4, 1.6, -26.0], r: 2.0, label: 'Lire le Programme Aroma', title: 'Programme Aroma — vannes du hammam',
    html: '<table style="width:100%;text-align:center;font-weight:700"><tr><th></th><th>Eucalyptus</th><th>Menthe</th><th>Lavande</th></tr>' + progs.map(([d, a, m, l]) => `<tr><td style="text-align:left">${d}</td><td>${a}</td><td>${m}</td><td>${l}</td></tr>`).join('') + '</table>\n<i>Week-end : hammam réservé à la Direction.</i>',
    clue: 'Programme Aroma : un réglage des 3 vannes par jour de la semaine (voir le calendrier du spa).',
  });
  const cal = canvasTexture(200, 240, (x, W, H) => {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#ff7458'; x.fillRect(0, 0, W, 64);
    x.fillStyle = '#ffffff'; x.font = '800 30px Poppins'; x.textAlign = 'center'; x.fillText('MERCREDI', W / 2, 44);
    x.fillStyle = INK; x.font = '800 110px Poppins'; x.fillText('14', W / 2, 172);
    x.font = '600 20px Poppins'; x.fillText('Juillet', W / 2, 214);
  });
  // little tear-off calendar standing on the counter
  const calStand = dyn(new THREE.Group());
  calStand.position.set(-9.4, 1.15, -33.3);
  b.root.add(calStand);
  const cs = mesh(new THREE.BoxGeometry(0.3, 0.36, 0.04), toon(0xffffff, { map: cal, unique: true, rim: false }), 0, 0.18, 0, calStand);
  cs.rotation.set(-0.25, Math.PI / 2 + Math.PI, 0);
  calStand.rotation.y = 0;
  readable(game, {
    pos: [-9.6, 1.3, -33.3], r: 1.8, label: 'Regarder le calendrier', title: 'Calendrier du spa',
    html: 'Un calendrier à feuillets arrachables.\n\nAujourd\'hui : <b>Mercredi 14 juillet</b>.\n\n(Écrit au stylo dans la marge : « Penser à régler le hammam selon le programme du jour ! »)',
    clue: 'Calendrier du spa : aujourd\'hui, c\'est mercredi.',
  });

  // ------------------------------------------------ hammam (x -24..-16, z -32..-24)
  for (const [z, d] of [[-31.3, 1.0], [-24.7, 1.0]]) b.box(-20, 0.05, z, 7.6, 0.5, d, tile);
  b.box(-23.4, 0.05, -28, 1.0, 0.5, 5.6, tile);
  duckSpot(game, b, 'd_hammam', -23.4, 0.55, -26.0, Math.PI / 2);
  const knobs = {};
  const want = { eucalyptus: 2, menthe: 7, lavande: 5 };
  const valves = [['eucalyptus', 0x3a9e8f, -21.8], ['menthe', 0x4fc85a, -20.0], ['lavande', 0x9b6cff, -18.2]];
  for (const [name, color, x] of valves) {
    const k = new Knob(game, { n: 10, color, symbol: SYM[name], onChange: () => checkValves() });
    k.group.position.set(x, 1.5, -31.82);
    b.root.add(dyn(k.group));
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), toon(0xc9d2d8), x, 1.5, -31.9, b.root).rotation.x = Math.PI / 2;
    b.plane(x, 1.8, -31.83, 0.17, 0.17, symbolCanvas(name));
    game.updaters.push((dt) => k.update(dt));
    knobs[name] = k;
  }
  mesh(new THREE.CylinderGeometry(0.035, 0.035, 4.2, 8), toon(0xc9d2d8), -20, 1.5, -31.95, b.root).rotation.z = Math.PI / 2;
  P.knobs = knobs;
  const steamOn = { v: false };
  game.fx.emitter((fx) => { if (steamOn.v || st.flag('hammam')) fx.steam(V3(-20 + (Math.random() - 0.5) * 6, 0.3, -28 + (Math.random() - 0.5) * 6), 1, 0.5); }, 16);
  // steam-revealed message on the hammam glass wall (east side)
  const msg = canvasTexture(512, 256, (x, W, H) => {
    x.fillStyle = 'rgba(240,250,255,0.9)'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#6f8fa0'; x.font = '800 40px Poppins'; x.textAlign = 'center';
    x.fillText('VESTIAIRE :', W / 2, 80);
    x.fillText('le peignoir', W / 2, 140);
    x.fillText('de la patronne', W / 2, 200);
  });
  const msgM = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), new THREE.MeshBasicMaterial({ map: msg, transparent: true, opacity: 0, depthWrite: false }));
  msgM.position.set(-20, 2.2, -24.18);
  msgM.rotation.y = Math.PI;
  msgM.renderOrder = 3;
  b.root.add(msgM);
  game.updaters.push((dt) => { const w = st.flag('hammam') ? 0.95 : 0; msgM.material.opacity += (w - msgM.material.opacity) * Math.min(1, dt * 0.5); });
  const checkValves = () => {
    if (st.flag('hammam')) return;
    if (Object.entries(want).every(([n, v]) => knobs[n].value === v)) {
      game.setFlag('hammam');
      Object.values(knobs).forEach((k) => { k.locked = true; });
      game.audio.sfx('jingle_solve', 0.6);
      game.audio.sfx('whoosh', 0.6, 0.6);
      setTimeout(async () => {
        game.exitInspect();
        await game.wait(1.2);
        game.ui.subtitle('Pschhhh ! La vapeur parfumée envahit le hammam… et des lettres apparaissent sur le mur !', 4);
        game.state.clue('Message dans la vapeur du hammam : « Vestiaire : le peignoir de la patronne ».');
      }, 600);
    }
  };
  game.story.onApply(() => { if (st.flag('hammam')) { Object.entries(want).forEach(([n, v]) => knobs[n].set(v, true)); Object.values(knobs).forEach((k) => { k.locked = true; }); } });
  game.interact.add({
    pos: [-20, 1.5, -31.3], r: 2.2, label: () => (st.flag('hammam') ? null : 'Régler les vannes du hammam'),
    inspect: { cam: [-20, 1.7, -30.0], look: [-20, 1.5, -31.82], fov: 50, title: 'Vannes : eucalyptus · menthe · lavande', clickables: () => Object.values(knobs).flatMap((k) => k.clickables()) },
  });
  readable(game, { pos: [-20, 2.0, -24.6], r: 2.4, label: 'Lire le message dans la vapeur', title: 'Dans la vapeur…', visible: () => st.flag('hammam'), html: '<b style="font-size:26px">« VESTIAIRE : le peignoir de la patronne »</b>' });
  b.lamp(-20, H0 - 1.5, -28, { intensity: 4, range: 8, color: 0xbfe9ff });
  b.surface(-24, -32, -16, -24, 'concrete', -1, 4);

  // ------------------------------------------------ vestiaires (x -24..-16, z -24..-16): robes + 12 lockers
  const robeHooks = [[2, 'P.V.', 0xffffff], [5, 'V.R.', 0xb8f0ea], [9, 'V.P.', 0xffd0e0], [11, 'M.', 0xffe9a8], [7, null, null]];
  for (const [num, ini, color] of robeHooks) {
    const x = -23.2 + (num - 1) * 0.58;
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 6), toon(0xc9d2d8), x, 1.9, -23.78, b.root).rotation.x = Math.PI / 2;
    b.plane(x, 2.12, -23.8, 0.14, 0.14, textTexture([String(num)], { w: 64, h: 64, bg: '#1b2440', fg: '#ffc23d', font: '800 36px Poppins', border: null }));
    if (!ini) continue;
    const robe = new THREE.Group();
    robe.position.set(x, 1.85, -23.62);
    b.root.add(robe);
    const r = mesh(new THREE.CylinderGeometry(0.16, 0.26, 1.1, 10), toon(color), 0, -0.55, 0, robe);
    r.scale.z = 0.5;
    mesh(new THREE.BoxGeometry(0.5, 0.1, 0.16), toon(color), 0, -0.05, 0, robe);
    const tex = textTexture([ini], { w: 128, h: 64, bg: null, border: null, fg: ini === 'V.P.' ? '#c3352b' : '#2f5aa8', font: '400 44px Pacifico' });
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.11), toon(0xffffff, { map: tex, transparent: true, unique: true, rim: false }));
    lab.position.set(0.05, -0.32, 0.135);
    robe.add(lab);
  }
  readable(game, {
    pos: [-20.5, 1.5, -23.2], r: 2.4, label: 'Examiner les peignoirs', title: 'Les peignoirs brodés',
    html: 'Des peignoirs moelleux, chacun brodé d\'initiales, pendus à des patères numérotées :\n\n• Patère 2 : <b>P.V.</b>\n• Patère 5 : <b>V.R.</b>\n• Patère 9 : <b>V.P.</b> (rose, brodé en lettres d\'or, évidemment)\n• Patère 11 : <b>M.</b>\n• Patère 7 : vide',
    clue: 'Peignoirs : P.V. (2), V.R. (5), V.P. (9), M. (11).',
  });
  const staff = canvasTexture(300, 360, (x, W, H) => {
    x.fillStyle = '#fffaf0'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#1d7a72'; x.font = '400 30px Pacifico'; x.textAlign = 'center'; x.fillText('Notre équipe', W / 2, 46);
    x.fillStyle = INK; x.font = '700 18px Poppins'; x.textAlign = 'left';
    ['Paul Vidal — masseur', 'Valérie Roux — esthéticienne', 'Marcel — veilleur (dort)', 'Gustave — mascotte (renvoyé)', '', 'Direction :', 'Véronique Pincevent'].forEach((l, i) => x.fillText(l, 22, 96 + i * 34));
  });
  b.frame(-16.2, 1.8, -17.2, 0.8, 0.96, staff, -Math.PI / 2, 0xffffff);
  readable(game, {
    pos: [-16.6, 1.6, -17.2], r: 1.8, label: 'Lire « Notre équipe »', title: 'Notre équipe',
    html: '• Paul Vidal — masseur\n• Valérie Roux — esthéticienne\n• Marcel — veilleur de nuit (dort)\n• Gustave — mascotte (renvoyé pour gourmandise)\n\n<b>Direction :</b> Véronique Pincevent',
    clue: 'Équipe du spa : Paul Vidal, Valérie Roux, Marcel… et la directrice Véronique Pincevent.',
  });
  // lockers along the west wall, numbered 1..12 (2 rows)
  const lockers = [];
  for (let i = 0; i < 12; i++) {
    const row = Math.floor(i / 6);
    const col = i % 6;
    const z = -17.0 - col * 1.08;
    const y = 0.05 + row * 1.15;
    const g = new THREE.Group();
    g.position.set(-23.55, y, z);
    b.root.add(dyn(g));
    mesh(new THREE.BoxGeometry(0.55, 1.1, 1.0), toon(0x9ed9cf), 0, 0.55, 0, g);
    const door = new THREE.Group();
    door.position.set(0.29, 0, 0.5);
    g.add(door);
    mesh(new THREE.BoxGeometry(0.04, 1.04, 0.98), toon(0x3fb7a8), 0, 0.55, -0.49, door);
    const num = textTexture([String(i + 1)], { w: 64, h: 64, bg: '#fffaf0', fg: INK, font: '800 38px Poppins', border: null });
    const nm = mesh(new THREE.PlaneGeometry(0.16, 0.16), toon(0xffffff, { map: num, unique: true, rim: false }), 0.025, 0.85, -0.49, door);
    nm.rotation.y = Math.PI / 2;
    const sensor = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 12), toon(0x2a2233, { emissive: 0xff3355, emissiveIntensity: 0.6 }), 0.03, 0.55, -0.85, door);
    sensor.rotation.z = Math.PI / 2;
    lockers.push({ g, door, open: false, sensor, n: i + 1 });
  }
  game.physics.addBox(-23.55, 1.2, -19.7, 0.55, 2.4, 6.5);
  game.updaters.push((dt) => lockers.forEach((l) => { const w = l.open ? -1.8 : 0; l.door.rotation.y += (w - l.door.rotation.y) * Math.min(1, dt * 6); }));
  P.lockers = lockers;
  const funny = { 3: 'Une chaussette orpheline. Elle attend sa jumelle depuis 2003.', 6: 'Un poulet en caoutchouc. Il couine quand on appuie dessus. Couic.', 12: 'Un mot : « Rendez-moi mon peignoir. — Paul V. »' };
  const lockerOpen = (l, fresh) => {
    l.open = true;
    l.sensor.material = toon(0x2a2233, { emissive: 0x3ddc84, emissiveIntensity: 0.8 });
    if (fresh) game.audio.sfx('metal_click', 0.6);
  };
  game.story.onApply(() => { if (st.flag('locker9')) lockerOpen(lockers[8], false); });
  game.interact.add({
    pos: [-22.7, 1.2, -19.7], r: 2.4, label: 'Utiliser un casier (bracelet)',
    use: async (g) => {
      const choice = await chooseLocker(g);
      if (choice === null) return;
      const l = lockers[choice - 1];
      if (choice === 9) {
        if (!g.has('bracelet')) { await g.say([{ who: 'player', text: 'Le capteur clignote : il faut un bracelet de l\'hôtel.' }]); return; }
        if (!st.flag('locker9')) { lockerOpen(l, true); g.setFlag('locker9'); g.audio.sfx('jingle_solve', 0.6); g.ui.toast('Bip ! Le casier 9 s\'ouvre avec ton bracelet « tout compris ».', { icon: g.icons.items.bracelet }); }
        return;
      }
      g.audio.sfx('error', 0.5);
      if (funny[choice] && !l.peek) {
        l.peek = true;
        lockerOpen(l, true);
        await g.say([{ who: 'player', text: `Le casier ${choice} n'était pas fermé… ${funny[choice]}` }]);
        setTimeout(() => { l.open = false; }, 2500);
        return;
      }
      await g.say([{ who: 'speaker', name: 'Casier ' + choice, text: 'BIP BIP. Accès refusé. Ce casier n\'est pas le vôtre. Votre tentative a été signalée à la Direction. (Elle s\'en fiche.)' }]);
    },
  });
  // locker 9 contents: sauna key + biscuit
  const sk = ITEMS.key_sauna.make();
  sk.position.set(-23.5, 1.25 + 0.4, -17.0 - 2 * 1.08);
  b.root.add(sk);
  pickup(game, { id: 'key_sauna', item: 'key_sauna', obj: sk, pos: [-23.2, 1.7, -19.16], visible: () => st.flag('locker9') });
  biscuitSpot(game, b, 'b_locker9', -23.5, 1.25, -19.0, 2, 'Prendre les biscuits du casier 9');
  game.interact.list[game.interact.list.length - 1].visible = (() => { const v = game.interact.list[game.interact.list.length - 1].visible; return () => st.flag('locker9') && v(); })();
  for (let i = 0; i < 2; i++) b.prop('furniture-kit/benchCushionLow', -19.6, 0.05, -18.2 - i * 2.6, { rot: Math.PI / 2 });
  b.lamp(-20, H0 - 1.5, -20, { intensity: 5, range: 9 });

  // ------------------------------------------------ sauna (x -24..-16, z -40..-32): timed escape
  const wood = paintedMat('wood', 0xffd2a0);
  b.floor(-23.85, -39.85, -16.15, -32.15, 0.07, 'wood', { t: 0.02 });
  b.surface(-24, -40, -16, -32, 'wood', -1, 4);
  for (const [x, z, w, d, y] of [[-22.4, -36, 1.4, 7.4, 0.45], [-23.3, -36, 0.9, 7.4, 0.95], [-20, -39.2, 4.8, 1.0, 0.45]]) b.box(x, 0.05, z, w, y, d, wood);
  for (const z of [-33, -39.6]) b.box(-24 + 0.16, 0, z, 0.02, 4.2, 0.01, wood, { collide: false });
  // stove with glowing stones
  const stove = new THREE.Group();
  stove.position.set(-17.2, 0.05, -38.8);
  b.root.add(stove);
  mesh(new THREE.BoxGeometry(0.9, 0.8, 0.9), toon(0x3b3550), 0, 0.4, 0, stove);
  for (let i = 0; i < 9; i++) mesh(new THREE.DodecahedronGeometry(0.14), toon(0x6b6f7c, { emissive: i % 3 ? 0x441100 : 0x882200 }), (i % 3 - 1) * 0.25, 0.88, (Math.floor(i / 3) - 1) * 0.25, stove);
  game.physics.addBox(-17.2, 0.6, -38.8, 1.0, 1.2, 1.0);
  game.fx.emitter((fx) => fx.steam(V3(-17.2, 1.1, -38.8), 1, 0.6), 5);
  b.lamp(-17.2, 1.4, -38.8, { intensity: 5, range: 7, color: 0xff9a5a, flicker: true });
  b.lamp(-20, H0 - 1.5, -36, { intensity: 3, range: 7, color: 0xffc89a });
  // engraved planks (the clue)
  const plankTex = (num, text, sym) => canvasTexture(512, 128, (x, W, H) => {
    x.fillStyle = '#d9a46a'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#8a5a2a55'; x.lineWidth = 3; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(0, 14 + i * 20); x.bezierCurveTo(W * 0.3, 20 + i * 20, W * 0.6, 8 + i * 20, W, 16 + i * 20); x.stroke(); }
    x.fillStyle = '#5a3216'; x.font = '800 44px Poppins'; x.textAlign = 'left'; x.fillText(num, 22, 80); x.font = '700 34px Poppins'; x.fillText(text, 80, 78);
  });
  [['1', 'ce qui refroidit'], ['2', 'ce qui mouille'], ['3', 'ce qui souffle']].forEach(([n, t], i) => {
    const m = mesh(new THREE.PlaneGeometry(1.2, 0.3), toon(0xffffff, { map: plankTex(n, t), unique: true, rim: false }), -21.69, 0.33, -33.6 - i * 1.6, b.root);
    m.rotation.y = Math.PI / 2;
    m.castShadow = false;
  });
  readable(game, {
    pos: [-21.2, 0.6, -35.2], r: 2.2, label: 'Lire les planches gravées', title: 'Planches gravées du banc',
    html: 'Gravé au couteau dans le bois du banc, de la main de M. Dupont :\n\n<b>1 — ce qui refroidit\n2 — ce qui mouille\n3 — ce qui souffle</b>\n\n<i>« Pour sortir d\'ici vivant. »</i>',
    clue: 'Sauna : « 1 ce qui refroidit, 2 ce qui mouille, 3 ce qui souffle ».',
  });
  readable(game, { pos: [-16.6, 1.6, -33.2], r: 1.6, label: 'Regarder le thermomètre', title: 'Thermomètre', html: () => (game.timers.sauna ? `Il affiche <b>${Math.round(90 + (1 - game.timers.sauna.left / game.timers.sauna.total) * 40)} °C</b>… et ça monte.` : 'Il affiche 90 °C. Toujours 90 °C. On se demande s\'il n\'est pas collé.') });
  // the hidden wooden box under the upper bench: star 3 + restaurant key
  const box = dyn(new THREE.Group());
  box.position.set(-21.2, 0.07, -38.6);
  b.root.add(box);
  mesh(new THREE.BoxGeometry(0.6, 0.3, 0.4), paintedMat('wood', 0xc98a4a), 0, 0.15, 0, box);
  const star3 = ITEMS.star.make();
  star3.position.set(-21.35, 0.52, -38.6);
  b.root.add(star3);
  const rk = ITEMS.key_resto.make();
  rk.position.set(-21.0, 0.4, -38.5);
  rk.rotation.x = -Math.PI / 2;
  b.root.add(rk);
  const takeSauna = (g) => {
    if (st.flag('star3') && st.flag('got_key_resto') && !st.flag('sauna_done') && !g.timers.sauna) trap(g);
  };
  pickup(game, { id: 'star3', item: 'star', flag: 'star3', obj: star3, pos: [-21.2, 0.6, -38.1], label: 'Prendre l\'étoile d\'or cachée', text: '<b>Étoile d\'or n°3</b> — une feuille est gravée au dos', onTake: (g) => { g.story.gotStar(3); takeSauna(g); } });
  pickup(game, { id: 'key_resto', item: 'key_resto', obj: rk, pos: [-21.0, 0.5, -38.1], onTake: (g) => takeSauna(g) });

  // inner door dial lock (3 symbol wheels)
  const symbols = ['soleil', 'feu', 'flocon', 'goutte', 'vent', 'feuille'];
  const sauLock = new DialLock(game, {
    n: 3, code: [2, 3, 4], radius: 0.07, width: 0.09, color: 0x8a5e33, wheelColor: '#fff6e3',
    symbols: symbols.map((s) => (x, cx, cy, size) => SYM[s](x, cx, cy, size)),
    onOpen: () => escapeSauna(),
  });
  sauLock.group.position.set(-16.33, 1.25, -34.5);
  sauLock.group.rotation.y = -Math.PI / 2;
  b.root.add(dyn(sauLock.group));
  game.updaters.push((dt) => sauLock.update(dt));
  P.sauLock = sauLock;
  game.interact.add({
    pos: [-16.8, 1.3, -34.6], r: 1.6, label: () => (game.timers.sauna ? 'Déverrouiller la porte du sauna (molettes)' : null),
    inspect: { cam: [-16.9, 1.27, -34.5], look: [-16.33, 1.25, -34.5], fov: 42, title: 'Serrure intérieure du sauna', clickables: () => sauLock.clickables(), hidePlayer: true },
  });
  game.interact.add({
    pos: [-16.6, 1.2, -36], r: 1.4, label: () => (st.flag('sauna_open') && !game.timers.sauna && game.player.position.x < -16 && !game.doors.sauna.open ? 'Ouvrir la porte du sauna' : null),
    use: () => game.doors.sauna.setOpen(true),
  });
  const trap = async (g) => {
    await g.cut(async () => {
      g.doors.sauna.setOpen(false);
      g.audio.sfx('door_close2', 0.9);
      g.audio.sfx('metal_latch', 0.8);
      await g.wait(0.5);
      await g.say([
        { who: 'speaker', name: 'Mme Pincevent (haut-parleur)', text: 'Oh, un client au sauna ! Profitez bien de notre <b>séance prolongée</b>. J\'ai verrouillé la porte et poussé le thermostat. Pour votre bien-être, bien sûr.' },
        { who: 'gustave', text: 'Elle a mis le chauffage à fond ! La serrure de la porte a trois molettes à symboles. Vite, avant que mes plumes ne frisent !' },
      ]);
    });
    sauLock.solved = false;
    sauLock.setValues([0, 0, 0]);
    g.startTimer('sauna', 'Sauna — 130 °C', 150, () => faint(g));
  };
  const faint = async (g) => {
    await g.cut(async () => {
      g.audio.sfx('jingle_fail', 0.7);
      await g.ui.fade(true, 900);
      g.renderer.post.uniforms.tint.value.set(1.03, 1, 0.96);
      // dropped everything: items go back in the box
      if (g.has('key_resto')) g.take('key_resto');
      if (st.flag('star3')) { g.take('star'); st.set('star3', false); g.story.refreshStars(); }
      st.set('got_key_resto', false);
      star3.visible = true;
      rk.visible = true;
      g.doors.sauna.setOpen(true, true);
      g.player.teleport(-10.4, 0.1, -25, Math.PI / 2);
      g.rig.yaw = Math.PI / 2 + Math.PI;
      g.rig.follow(true);
      await g.wait(0.6);
      await g.ui.fade(false, 900);
      await g.say([
        { who: 'gustave', text: 'Tu t\'es évanoui ! J\'ai dû te traîner jusqu\'ici par la capuche. Tu pèses une tonne, au passage.' },
        { who: 'gustave', text: 'Tu as tout lâché dans le sauna. Retente : relis bien les planches gravées, et fonce sur la serrure.' },
      ]);
      st.s.deaths++;
      g.save();
    });
  };
  const escapeSauna = async () => {
    const g = game;
    g.stopTimer('sauna');
    g.setFlag('sauna_done');
    g.setFlag('sauna_open');
    g.renderer.post.uniforms.tint.value.set(1.03, 1, 0.96);
    g.audio.sfx('metal_latch', 0.8);
    g.audio.sfx('jingle_solve', 0.7);
    g.exitInspect();
    await g.wait(0.6);
    g.doors.sauna.setOpen(true);
    await g.say([{ who: 'gustave', text: 'Ouf ! De l\'air ! Flocon, goutte, vent : ce qui refroidit, ce qui mouille, ce qui souffle. Ce Dupont, quel poète.' }]);
    g.story.completeArea('spa');
  };
  // heat tint while trapped
  game.updaters.push(() => {
    const t = game.timers.sauna;
    if (t) { const k = 1 - t.left / t.total; game.renderer.post.uniforms.tint.value.set(1.03 + k * 0.25, 1 - k * 0.12, 0.96 - k * 0.25); }
  });
  // sauna door from the spa hall (key)
  const lockedSauna = game.interact.add({
    pos: [-15.4, 1.2, -36], r: 1.6, label: () => (st.flag('sauna_open') ? (game.doors.sauna.open ? null : 'Ouvrir le sauna') : (game.has('key_sauna') ? 'Déverrouiller le sauna' : 'Porte du sauna')),
    use: async (g) => {
      if (st.flag('sauna_open')) { g.doors.sauna.setOpen(true); return; }
      if (g.has('key_sauna')) { g.take('key_sauna'); g.audio.sfx('keys', 0.7); g.setFlag('sauna_open'); g.doors.sauna.setOpen(true); return; }
      await g.say([{ who: 'player', text: 'Le sauna est fermé à clé. Une affichette : « Clé à demander à la Direction (casier personnel) ».' }]);
    },
  });
  P.lockedSauna = lockedSauna;
  game.story.onApply(() => { if (st.flag('sauna_open')) game.doors.sauna.setOpen(true, true); });

  // zones
  b.zone('sauna', [-24, -1, -40, -16, H0, -32], { music: 'spa', area: 'spa' });
  b.zone('spa', [-24, -1, -40, -8, H0, -16], { music: 'spa', area: 'spa' });
  return P;
}

// lets the player pick a locker number through the pause-menu panel
function chooseLocker(game) {
  return new Promise((res) => {
    const prev = game.paused;
    game.paused = true;
    game.input.unlock();
    const items = [];
    for (let i = 1; i <= 12; i++) items.push({ label: 'Casier ' + i, fn: () => { game.ui.screen('screen-pause', false); game.paused = prev; res(i); } });
    items.push({ label: 'Annuler', cls: 'alt', fn: () => { game.ui.screen('screen-pause', false); game.paused = prev; res(null); } });
    game.ui.menu('pause-menu', items);
    const menu = document.getElementById('pause-menu');
    menu.style.display = 'grid';
    menu.style.gridTemplateColumns = 'repeat(4, 1fr)';
    menu.querySelectorAll('button').forEach((bt) => { bt.style.minWidth = '120px'; });
    document.querySelector('#screen-pause h2').textContent = 'Quel casier ?';
    game.ui.screen('screen-pause', true);
    const restore = () => { menu.style.display = ''; menu.style.gridTemplateColumns = ''; document.querySelector('#screen-pause h2').textContent = 'Pause'; };
    const done = res;
    res = (v) => { restore(); done(v); };
  });
}
