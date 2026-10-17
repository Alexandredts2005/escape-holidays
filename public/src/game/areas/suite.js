// Suite 7 (first floor, west wing): the room where the guest wakes up locked in. Puzzles S1–S3.
import * as THREE from 'three';
import { toon, paintedMat, canvasTexture, textTexture } from '../../engine/toon.js';
import { DialLock, Keypad } from '../locks.js';
import { doorIn, balcony, Y1, ROOF } from '../hotel.js';
import { mesh, flamingoFloat } from '../props.js';
import { pickup, duckSpot, biscuitSpot, readable, lockedDoor, freeDoor, dyn, V3 } from '../puzzle.js';
import { ITEMS } from '../items.js';

export const SUITE_MODELS = [
  'furniture-kit/bedDouble', 'furniture-kit/cabinetBedDrawer', 'furniture-kit/lampRoundTable', 'furniture-kit/desk', 'furniture-kit/chairDesk', 'furniture-kit/loungeSofa',
  'furniture-kit/tableCoffee', 'furniture-kit/cabinetTelevision', 'furniture-kit/televisionModern', 'furniture-kit/loungeChair', 'furniture-kit/sideTable', 'furniture-kit/rugRounded',
  'furniture-kit/pottedPlant', 'furniture-kit/bathtub', 'furniture-kit/toilet', 'furniture-kit/bathroomSink', 'furniture-kit/bathroomMirror', 'furniture-kit/showerRound',
  'furniture-kit/lampSquareCeiling', 'furniture-kit/trashcan', 'furniture-kit/plantSmall2', 'furniture-kit/radio', 'food-kit/pineapple', 'furniture-kit/pillow', 'furniture-kit/coatRackStanding',
];

const Y = Y1;

// little round alarm clock frozen at `hour` o'clock
export function alarmClock(color, hour) {
  const g = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.07, 20), color, 0, 0.13, 0, g);
  body.rotation.x = Math.PI / 2;
  const face = canvasTexture(128, 128, (x, w) => {
    x.fillStyle = '#fffaf0'; x.beginPath(); x.arc(64, 64, 62, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#2a2233'; x.font = '800 20px Poppins'; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; x.fillText(String(i), 64 + Math.cos(a) * 47, 66 + Math.sin(a) * 47); }
    x.lineCap = 'round';
    const ha = (hour / 12) * Math.PI * 2 - Math.PI / 2;
    x.strokeStyle = '#2a2233'; x.lineWidth = 8; x.beginPath(); x.moveTo(64, 64); x.lineTo(64 + Math.cos(ha) * 30, 64 + Math.sin(ha) * 30); x.stroke();
    x.lineWidth = 5; x.beginPath(); x.moveTo(64, 64); x.lineTo(64, 22); x.stroke();
    x.fillStyle = '#e8352b'; x.beginPath(); x.arc(64, 64, 6, 0, Math.PI * 2); x.fill();
  });
  const f = mesh(new THREE.CircleGeometry(0.095, 24), toon(0xffffff, { map: face, unique: true, rim: false }), 0, 0.13, 0.036, g);
  f.castShadow = false;
  for (const s of [-1, 1]) {
    const bell = mesh(new THREE.SphereGeometry(0.045, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), color, s * 0.065, 0.225, 0, g);
    bell.rotation.z = -s * 0.5;
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 6), 0x2a2233, s * 0.06, 0.035, 0, g).rotation.z = s * 0.4;
  }
  mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), 0x2a2233, 0, 0.255, 0, g);
  return g;
}

function shell(color = 0xffd9c7) {
  const tex = canvasTexture(64, 64, (x, w, h) => { x.fillStyle = '#fff0e6'; x.fillRect(0, 0, w, h); x.strokeStyle = '#e8a08a'; x.lineWidth = 3; for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(i * 8, 0); x.lineTo(32, h); x.stroke(); } });
  const g = new THREE.Group();
  const m = mesh(new THREE.SphereGeometry(0.07, 14, 6, 0, Math.PI, 0, Math.PI / 2), toon(color, { map: tex, unique: true }), 0, 0.005, 0, g);
  m.scale.set(1, 0.45, 1.1);
  m.rotation.y = -Math.PI / 2;
  mesh(new THREE.BoxGeometry(0.05, 0.015, 0.03), color, 0, 0.008, 0.075, g);
  return g;
}

function flamingoFigure(h = 0.32) {
  const g = new THREE.Group();
  const pink = toon(0xff8fb1);
  const k = h / 0.32;
  const body = mesh(new THREE.SphereGeometry(0.06 * k, 12, 9), pink, 0, 0.2 * k, 0, g);
  body.scale.set(0.8, 0.75, 1.3);
  mesh(new THREE.CylinderGeometry(0.006 * k, 0.006 * k, 0.16 * k, 5), pink, 0, 0.08 * k, 0, g);
  const neck = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(0, 0.22 * k, 0.05 * k), V3(0, 0.3 * k, 0.08 * k), V3(0, 0.33 * k, 0.03 * k)]), 8, 0.013 * k, 6), pink);
  g.add(neck);
  mesh(new THREE.SphereGeometry(0.025 * k, 10, 8), pink, 0, 0.335 * k, 0.04 * k, g);
  mesh(new THREE.ConeGeometry(0.01 * k, 0.04 * k, 6), 0x2a2233, 0, 0.32 * k, 0.07 * k, g).rotation.x = 2.2;
  mesh(new THREE.CylinderGeometry(0.05 * k, 0.06 * k, 0.012 * k, 14), 0xc9a24a, 0, 0.006, 0, g);
  return g;
}

function flamingoLamp() {
  const g = flamingoFigure(1.5);
  const shade = mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.3, 16, 1, true), toon(0xfff1d6, { emissive: 0xffd9a0, emissiveIntensity: 0.4, side: THREE.DoubleSide }), 0, 1.75, 0.15, g);
  shade.castShadow = false;
  return g;
}

function towelFlamingo() {
  const g = new THREE.Group();
  const w = toon(0xffb3c9);
  const b = mesh(new THREE.SphereGeometry(0.16, 12, 9), w, 0, 0.1, 0, g);
  b.scale.set(1.3, 0.6, 0.9);
  const neck = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(0.15, 0.12, 0), V3(0.24, 0.35, 0), V3(0.17, 0.5, 0), V3(0.24, 0.52, 0)]), 10, 0.04, 8), w);
  g.add(neck);
  mesh(new THREE.ConeGeometry(0.02, 0.07, 6), 0x2a2233, 0.29, 0.5, 0, g).rotation.z = -1.9;
  return g;
}

function deflatedFloat() {
  const f = flamingoFloat(0.55);
  f.scale.y = 0.2;
  f.rotation.z = 0.1;
  return f;
}

function painting(draw, w = 1.2, h = 0.8) {
  return canvasTexture(256, Math.round(256 * h / w), (x, W, H) => draw(x, W, H));
}

function seaPainting(x, W, H) {
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffb38a'); g.addColorStop(0.55, '#ffe0a8'); g.addColorStop(0.56, '#3fb7c9'); g.addColorStop(1, '#1676b8');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = '#fff4c8'; x.beginPath(); x.arc(W * 0.7, H * 0.5, 22, Math.PI, 0); x.fill();
  x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(W * 0.3, H * 0.52); x.lineTo(W * 0.36, H * 0.2); x.lineTo(W * 0.36, H * 0.52); x.fill();
  x.fillStyle = '#8a3b2a'; x.fillRect(W * 0.26, H * 0.52, W * 0.14, 6);
}

function directricePortrait(x, W, H) {
  x.fillStyle = '#c9b6ff'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#5b5f6e'; x.beginPath(); x.ellipse(W / 2, H * 0.95, W * 0.32, H * 0.3, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#f2b48c'; x.beginPath(); x.arc(W / 2, H * 0.45, W * 0.17, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#e8613b'; x.beginPath(); x.arc(W / 2, H * 0.2, W * 0.1, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.ellipse(W / 2, H * 0.36, W * 0.18, H * 0.08, 0, Math.PI, 0); x.fill();
  x.fillStyle = '#2a2233'; x.fillRect(W * 0.42, H * 0.44, 10, 4); x.fillRect(W * 0.54, H * 0.44, 10, 4);
  x.fillRect(W * 0.46, H * 0.54, W * 0.08, 3);
  x.fillStyle = '#2a2233'; x.font = '700 15px Poppins'; x.textAlign = 'center';
  x.fillText('Employée du mois', W / 2, H - 22); x.fillText('(depuis 1987)', W / 2, H - 6);
}

// fogged-mirror drawing: flamingo ? shell ? pineapple ? = MINIBAR
function fogTexture() {
  return canvasTexture(256, 360, (x, W, H) => {
    x.fillStyle = 'rgba(235,245,250,0.92)'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#7f99a8'; x.fillStyle = '#7f99a8'; x.lineWidth = 7; x.lineCap = 'round'; x.lineJoin = 'round';
    // flamingo
    x.beginPath(); x.ellipse(70, 80, 26, 16, 0, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.moveTo(90, 72); x.quadraticCurveTo(110, 30, 92, 22); x.lineTo(100, 32); x.stroke();
    x.beginPath(); x.moveTo(66, 96); x.lineTo(66, 135); x.moveTo(74, 96); x.lineTo(80, 120); x.lineTo(70, 122); x.stroke();
    // shell
    x.beginPath(); x.moveTo(40, 225); x.quadraticCurveTo(70, 160, 100, 225); x.closePath(); x.stroke();
    for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(70, 225); x.lineTo(46 + i * 12, 192 + Math.abs(i - 2) * 6); x.stroke(); }
    // pineapple
    x.beginPath(); x.ellipse(70, 310, 20, 28, 0, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.moveTo(60, 284); x.lineTo(54, 262); x.moveTo(70, 282); x.lineTo(70, 256); x.moveTo(80, 284); x.lineTo(86, 262); x.stroke();
    x.beginPath(); x.moveTo(56, 296); x.lineTo(84, 324); x.moveTo(84, 296); x.lineTo(56, 324); x.stroke();
    x.font = '800 64px Poppins'; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (const y of [80, 205, 310]) x.fillText('?', 170, y);
    x.save(); x.translate(232, 190); x.rotate(Math.PI / 2); x.font = '800 30px Poppins'; x.fillText('MINIBAR', 0, 0); x.restore();
  });
}

export function buildSuite(game, b, hotel) {
  const S = {};
  const st = game.state;
  // bathroom partitions
  let w = b.wall(-18, -36, -18, -28, { y: Y, h: ROOF - Y, mat: 'stucco', skinA: 'spatile', skinB: 'wallpaper_pink', openings: [{ at: 5.5, w: 1.0, h: 2.3 }] });
  const bathDoor = doorIn(b, w, -18, -36, 5.5, 1.0, 'bath', { y: Y, h: 2.3, color: 0xffffff, panelColor: 0xf0d9c0, swing: 1, open: true });
  freeDoor(game, bathDoor, 'la salle de bain');
  b.wall(-24, -28, -18, -28, { y: Y, h: ROOF - Y, mat: 'stucco', skinA: 'wallpaper_pink', skinB: 'spatile' });
  b.floor(-23.85, -35.85, -18.15, -28.15, Y + 0.02, 'spatile', { t: 0.02 });
  b.surface(-24, -36, -18, -28, 'concrete', Y - 1, Y + 3);
  b.box(-16, Y + 0.02, -26, 6, 0.01, 4, paintedMat('carpet', 0xffc9d6), { collide: false, cast: false });
  // wainscot rail
  for (const [x0, z0, x1, z1] of [[-17.85, -16.3, -8.3, -16.3], [-23.8, -27.8, -23.8, -16.3]]) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    b.box((x0 + x1) / 2, Y + 0.9, (z0 + z1) / 2, x0 === x1 ? 0.05 : len, 0.06, x0 === x1 ? len : 0.05, toon(0xfff6ea), { collide: false, cast: false });
  }

  // ------------------------------------------------ furniture
  const P = (n, x, z, rot, o = {}) => b.prop(n, x, o.y ?? Y, z, { rot, ...o });
  P('furniture-kit/bedDouble', -9.25, -25.5, -Math.PI / 2);
  P('furniture-kit/cabinetBedDrawer', -8.5, -27.15, -Math.PI / 2);
  P('furniture-kit/cabinetBedDrawer', -8.5, -23.85, -Math.PI / 2);
  P('furniture-kit/lampRoundTable', -8.5, -27.3, -Math.PI / 2, { y: Y + 0.5, collide: false });
  b.lamp(-8.6, Y + 1.0, -27.3, { intensity: 2.5, range: 5 });
  P('furniture-kit/pillow', -8.55, -26.0, -Math.PI / 2, { y: Y + 0.55, collide: false });
  P('furniture-kit/pillow', -8.55, -25.0, -Math.PI / 2, { y: Y + 0.55, collide: false });
  P('furniture-kit/rugRounded', -12.5, -25.5, Math.PI / 2, { collide: false });
  P('furniture-kit/cabinetTelevision', -21, -27.6, 0);
  P('furniture-kit/televisionModern', -21, -27.65, 0, { y: Y + 0.59, collide: false });
  P('furniture-kit/loungeSofa', -21, -22.6, Math.PI);
  P('furniture-kit/tableCoffee', -21, -24.7, 0);
  P('furniture-kit/desk', -23.4, -18.4, Math.PI / 2);
  P('furniture-kit/chairDesk', -22.5, -18.4, -Math.PI / 2, { collide: false });
  P('furniture-kit/loungeChair', -10.2, -17.3, Math.PI * 0.85);
  P('furniture-kit/sideTable', -12.1, -16.75, Math.PI);
  P('furniture-kit/pottedPlant', -17.3, -35.4, 0);
  P('furniture-kit/pottedPlant', -14.6, -16.6, 0);
  P('furniture-kit/coatRackStanding', -14.7, -35.4, 0, { collide: false });
  P('furniture-kit/trashcan', -22.4, -16.7, 0);
  P('furniture-kit/radio', -12.1, -16.75, Math.PI, { y: Y + 0.73, collide: false });
  // bathroom
  P('furniture-kit/bathtub', -23.3, -31.6, Math.PI / 2);
  P('furniture-kit/toilet', -23.45, -29.0, Math.PI / 2);
  P('furniture-kit/bathroomSink', -21.3, -35.55, 0);
  P('furniture-kit/bathroomMirror', -21.3, -35.82, 0, { y: Y + 1.05, collide: false, s: 1.15 });
  P('furniture-kit/showerRound', -18.75, -35.25, 0);
  b.box(-20.1, Y + 1.22, -35.75, 0.6, 0.04, 0.2, toon(0xffffff), { collide: false });
  for (const [x, y, z] of [[-16, ROOF - 0.05, -26], [-21, ROOF - 0.05, -32], [-16, ROOF - 0.05, -19]]) P('furniture-kit/lampSquareCeiling', x, z, 0, { y: y - 0.44 * 1.2, collide: false, s: 1.2 });
  b.lamp(-16, ROOF - 1.3, -26, { intensity: 7, range: 11 });
  b.lamp(-21, ROOF - 1.3, -32, { intensity: 5, range: 8 });
  b.lamp(-16, ROOF - 1.3, -19, { intensity: 5, range: 9 });
  // paintings
  b.frame(-16.5, Y + 2.1, -35.8, 1.4, 0.9, painting(seaPainting, 1.4, 0.9), 0);
  b.frame(-8.3, Y + 2.0, -25.5, 1.6, 1.0, painting(seaPainting, 1.6, 1.0), -Math.PI / 2);
  b.frame(-23.8, Y + 2.0, -24.6, 0.8, 1.0, painting(directricePortrait, 0.8, 1.0), Math.PI / 2, 0xc9a24a);

  // ------------------------------------------------ the counting objects (4 flamingos, 6 shells, 3 pineapples)
  const fig = flamingoFigure(0.32); fig.position.set(-23.4, Y + 0.73, -17.9); fig.rotation.y = Math.PI / 2; b.root.add(fig);
  const tf = towelFlamingo(); tf.position.set(-10.4, Y + 0.62, -25.5); tf.rotation.y = Math.PI; b.root.add(tf);
  const fl = flamingoLamp(); fl.position.set(-8.9, Y, -16.9); fl.rotation.y = -2.4; b.root.add(fl);
  b.lamp(-8.9, Y + 1.7, -17, { intensity: 2.5, range: 5, color: 0xffb3c9 });
  const df = deflatedFloat(); df.position.set(-19.5, Y + 0.02, -14.6); df.rotation.y = 0.5; b.root.add(df);
  for (const [x, y, z, r] of [[-22.85, Y + 0.8, -32.4, 0.3], [-22.85, Y + 0.8, -31.9, 1.4], [-22.85, Y + 0.8, -31.3, -0.4], [-8.55, Y + 0.5, -23.95, 0.2], [-8.4, Y + 0.5, -23.7, 2.1], [-13.0, Y + 0.6, -14.3, 0.8]]) {
    const s = shell(); s.position.set(x, y, z); s.rotation.y = r; b.root.add(s);
  }
  for (const [x, y, z, h] of [[-21, Y + 0.44, -24.7, 0.32], [-23.55, Y + 0.73, -19.0, 0.26], [-20.0, Y + 1.24, -35.75, 0.16]]) P('food-kit/pineapple', x, z, 0, { y, h, collide: false });

  // ------------------------------------------------ notes, phone, TV
  const note = mesh(new THREE.PlaneGeometry(0.22, 0.28), toon(0xfbeed2), -9.3, Y + 0.735, -18.0, b.root);
  readable(game, {
    pos: [-23.4, Y + 0.9, -18.6], label: 'Lire le règlement intérieur', title: 'Règlement intérieur',
    html: '<b>Hôtel Les Mirages ★★★★★</b>\n\nArt. 1 — Le client est roi. La directrice est impératrice.\nArt. 2 — Il est interdit de quitter l\'hôtel avant la fin de son séjour.\nArt. 3 — La fin du séjour est fixée par la directrice.\nArt. 4 — Le perroquet ne doit pas être nourri. Surtout pas de biscuits.\nArt. 5 — Les réclamations se déposent au bureau de la directrice (fermé à clé, 4 étoiles requises).\n\n<i>Signé : Véronique Pincevent, Directrice</i>',
    clue: 'Règlement : le bureau de la directrice demande 4 étoiles.',
  });
  note.rotation.x = -Math.PI / 2;
  note.visible = false;
  readable(game, {
    pos: [-8.6, Y + 0.7, -25.5], r: 1.8, label: 'Lire le mot sur l\'oreiller', title: 'Mot sur l\'oreiller',
    html: 'Cher gagnant, chère gagnante,\n\nBienvenue pour votre <b>séjour à durée indéterminée</b> !\nLe petit-déjeuner est servi de 7h00 à 7h01.\nPour votre sécurité, votre porte a été verrouillée de l\'extérieur.\n\nUn biscuit vous attend sur l\'oreiller.\nIl n\'est <u>pas</u> pour le perroquet.\n\n<i>— V. P.</i>',
  });
  const phoneG = new THREE.Group();
  mesh(new THREE.BoxGeometry(0.22, 0.07, 0.16), 0xff7458, 0, 0.035, 0, phoneG);
  mesh(new THREE.BoxGeometry(0.24, 0.05, 0.06), 0xff7458, 0, 0.1, -0.03, phoneG);
  phoneG.position.set(-23.3, Y + 0.73, -17.7);
  b.root.add(phoneG);
  let calls = 0;
  game.interact.add({
    pos: [-23.3, Y + 0.85, -17.7], r: 1.5, label: 'Appeler la réception', obj: phoneG,
    use: async (g) => {
      g.audio.sfx('bell', 0.4, 1.6);
      const lines = [
        [{ who: 'speaker', name: 'Répondeur', text: 'Bienvenue à la réception de l\'Hôtel Les Mirages ! Pour le room-service, tapez 1. Pour vous plaindre, tapez 2. Pour partir… raccrochez et oubliez.' }],
        [{ who: 'speaker', name: 'Répondeur', text: 'Vous avez tapé 2. Votre réclamation a bien été jetée à la poubelle. Merci de votre fidélité éternelle.' }],
        [{ who: 'speaker', name: 'Répondeur', text: '♪ Musique d\'attente ♪ … Votre temps d\'attente estimé est de : quarante-sept ans.' }],
      ];
      await g.say(lines[calls++ % lines.length]);
    },
  });
  let tv = 0;
  game.interact.add({
    pos: [-21, Y + 1.0, -27.3], r: 2.2, label: 'Allumer la télé',
    use: async (g) => {
      g.audio.sfx('switch', 0.5);
      const lines = [
        'Mirages TV — Météo : soleil, 31 °C. Risque d\'évasion : nul. Risque de coup de soleil : élevé.',
        'Mirages TV — Le jeu « Qui veut gagner des vacances ? » est suspendu : notre dernier gagnant n\'est jamais reparti.',
        'Mirages TV — Rediffusion : « La directrice raconte l\'Hôtel Les Mirages », épisode 412.',
      ];
      await g.say([{ who: 'speaker', name: 'Mirages TV', text: lines[tv++ % lines.length] }]);
    },
  });

  // ------------------------------------------------ S1: shower → fogged mirror → minibar code 4-6-3
  const fog = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.86), new THREE.MeshBasicMaterial({ map: fogTexture(), transparent: true, opacity: 0, depthWrite: false }));
  fog.position.set(-21.3, Y + 1.5, -35.68);
  fog.renderOrder = 3;
  b.root.add(fog);
  S.fog = fog;
  const steam = game.fx.emitter((fx) => fx.steam(V3(-18.75, Y + 1.6, -35.2), 1, 0.7), 14);
  steam.on = false;
  game.updaters.push((dt) => {
    const want = st.flag('mirror') ? 0.95 : 0;
    fog.material.opacity += (want - fog.material.opacity) * Math.min(1, dt * 0.6);
  });
  game.interact.add({
    pos: [-18.75, Y + 1.2, -35.0], r: 1.7, label: () => (st.flag('mirror') ? 'Rouvrir l\'eau chaude' : 'Ouvrir la douche (eau chaude)'),
    use: async (g) => {
      g.audio.sfx('switch', 0.6);
      steam.on = true;
      g.audio.sfx('plop', 0.4, 0.6);
      setTimeout(() => { steam.on = false; }, 9000);
      if (!st.flag('mirror')) {
        g.ui.subtitle('La vapeur envahit la salle de bain…', 3);
        await g.wait(2.5);
        g.setFlag('mirror');
        g.state.clue('Buée du miroir : « flamant ? coquillage ? ananas ? » puis MINIBAR.');
        g.ui.subtitle('Des dessins apparaissent dans la buée du miroir !', 3.5);
        g.audio.sfx('sparkle', 0.5);
      }
    },
  });
  const mirrorShot = { cam: [-21.3, Y + 1.5, -34.75], look: [-21.3, Y + 1.5, -35.7], title: 'Le miroir embué', fov: 50 };
  game.interact.add({
    pos: [-21.3, Y + 1.5, -35.6], r: 1.7, label: () => (st.flag('mirror') ? 'Regarder la buée du miroir' : 'Se regarder dans le miroir'),
    use: async (g, d) => {
      if (st.flag('mirror')) g.enterInspect({ ...d, inspect: mirrorShot });
      else await g.say([{ who: 'player', text: 'Une tête de vacancier qui n\'a pas eu son petit-déjeuner. Charmant.' }]);
    },
  });

  // minibar: small fridge with a 3-digit dial padlock, facing +X against the west wall
  const mb = dyn(new THREE.Group());
  mb.position.set(-23.45, Y, -20.6);
  b.root.add(mb);
  mesh(new THREE.BoxGeometry(0.62, 0.86, 0.66), 0xf4f1ea, 0, 0.43, 0, mb);
  mesh(new THREE.BoxGeometry(0.5, 0.03, 0.56), 0xdfe7f0, 0.02, 0.42, 0, mb);
  const mbDoor = new THREE.Group();
  mbDoor.position.set(0.31, 0, 0.33);
  mb.add(mbDoor);
  mesh(new THREE.BoxGeometry(0.04, 0.84, 0.64), 0xffffff, 0.02, 0.43, -0.32, mbDoor);
  mesh(new THREE.BoxGeometry(0.03, 0.3, 0.04), 0xc9d2d8, 0.05, 0.55, -0.58, mbDoor);
  const mlabel = textTexture(['MINIBAR'], { w: 256, h: 64, bg: '#ff7458', fg: '#ffffff', font: '800 40px Poppins', border: null });
  const ml = mesh(new THREE.PlaneGeometry(0.34, 0.085), toon(0xffffff, { map: mlabel, unique: true, rim: false }), 0.045, 0.74, -0.32, mbDoor);
  ml.rotation.y = Math.PI / 2;
  game.physics.addBox(-23.45, Y + 0.43, -20.6, 0.62, 0.86, 0.66);
  const lock = new DialLock(game, { n: 3, code: [4, 6, 3], color: 0xc9a24a, onOpen: () => openMinibar(true) });
  lock.group.position.set(0.37, 0.5, 0);
  lock.group.rotation.y = Math.PI / 2;
  mb.add(lock.group);
  game.updaters.push((dt) => lock.update(dt));
  S.lock = lock;
  let mbAngle = 0;
  game.updaters.push((dt) => {
    const want = st.flag('minibar') ? -1.9 : 0;
    mbAngle += (want - mbAngle) * (1 - Math.exp(-dt * 5));
    mbDoor.rotation.y = mbAngle;
  });
  const openMinibar = async (fresh) => {
    if (fresh) {
      game.audio.sfx('metal_latch', 0.7);
      game.audio.sfx('jingle_solve', 0.6);
      game.setFlag('minibar');
      lock.group.visible = false;
      game.exitInspect();
      await game.wait(0.8);
      game.ui.toast('Le minibar s\'ouvre !', { cls: 'teal' });
    }
  };
  game.interact.add({
    pos: [-23.0, Y + 0.6, -20.6], r: 1.6, label: () => (st.flag('minibar') ? null : 'Examiner le cadenas du minibar'),
    inspect: { cam: [-22.6, Y + 0.62, -20.6], look: [-23.08, Y + 0.5, -20.6], fov: 40, title: 'Cadenas du minibar — 3 chiffres', clickables: () => lock.clickables() },
  });
  biscuitSpot(game, b, 'b_minibar', -23.45, Y + 0.45, -20.75, 2, 'Prendre les biscuits du minibar');
  const spoon = (await_item('spoon'));
  spoon.position.set(-23.4, Y + 0.47, -20.35);
  spoon.rotation.set(-Math.PI / 2, 0, 0.4);
  b.root.add(spoon);
  pickup(game, { id: 'spoon', item: 'spoon', obj: spoon, pos: [-23.2, Y + 0.5, -20.4], visible: () => st.flag('minibar'), label: 'Prendre la cuillère en argent' });
  const yellow = alarmClock(0xffc23d, 9);
  yellow.position.set(-23.45, Y + 0.05, -20.45);
  yellow.rotation.y = Math.PI / 2;
  b.root.add(yellow);
  dyn(yellow);
  // the biscuit spot added above sits on the shelf; make minibar contents unreachable while locked
  const mbList = game.interact.list.slice(-2);
  mbList.forEach((d) => { const v = d.visible; d.visible = () => st.flag('minibar') && (!v || v()); });

  // ------------------------------------------------ S3: four alarm clocks → safe 1479
  const clocks = [
    { name: 'rouge', color: 0xe8352b, hour: 1, pos: [-8.5, Y + 0.5, -27.0], rot: -Math.PI / 2 },
    { name: 'bleu', color: 0x2f73d8, hour: 4, pos: [-20.4, Y + 1.24, -35.72], rot: 0 },
    { name: 'vert', color: 0x3ddc84, hour: 7, pos: [-12.0, Y + 0.6, -14.25], rot: Math.PI },
    { name: 'jaune', color: 0xffc23d, hour: 9, pos: null, obj: yellow, rot: Math.PI / 2 },
  ];
  for (const c of clocks) {
    const o = c.obj || alarmClock(c.color, c.hour);
    if (!c.obj) { o.position.set(...c.pos); o.rotation.y = c.rot; b.root.add(o); dyn(o); }
    const p = o.position;
    const n = new THREE.Vector3(Math.sin(c.rot), 0, Math.cos(c.rot));
    game.interact.add({
      pos: [p.x, p.y + 0.15, p.z], r: 1.6, obj: o, label: `Examiner le réveil ${c.name}`,
      visible: c.name === 'jaune' ? () => st.flag('minibar') : (c.name === 'vert' ? () => st.flag('balcony_open') : undefined),
      inspect: {
        cam: [p.x + n.x * 0.5, p.y + 0.2, p.z + n.z * 0.5], look: [p.x, p.y + 0.13, p.z], fov: 38, title: `Réveil ${c.name}`,
        onEnter: (g) => { g.state.clue(`Réveil ${c.name} : arrêté sur ${c.hour} h.`); },
      },
    });
  }

  // wardrobe with two doors and the safe inside (against the north wall, facing +Z)
  const wd = dyn(new THREE.Group());
  wd.position.set(-12.4, Y, -35.45);
  b.root.add(wd);
  const wood = paintedMat('wood', 0xffe2c4);
  mesh(new THREE.BoxGeometry(2.0, 2.3, 0.08), wood, 0, 1.15, -0.3, wd);
  for (const x of [-0.98, 0.98]) mesh(new THREE.BoxGeometry(0.06, 2.3, 0.66), wood, x, 1.15, 0, wd);
  mesh(new THREE.BoxGeometry(2.0, 0.08, 0.66), wood, 0, 2.3, 0, wd);
  mesh(new THREE.BoxGeometry(2.0, 0.08, 0.66), wood, 0, 0.04, 0, wd);
  mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.9, 6), 0xc9d2d8, 0, 1.95, 0, wd).rotation.z = Math.PI / 2;
  for (const [x, c] of [[-0.6, 0xffffff], [-0.35, 0xffb3c9]]) { const robe = mesh(new THREE.BoxGeometry(0.12, 1.0, 0.5), c, x, 1.4, 0, wd); robe.rotation.y = 0.1; }
  const wDoors = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group();
    piv.position.set(s * 0.98, 0, 0.33);
    wd.add(piv);
    mesh(new THREE.BoxGeometry(0.98, 2.2, 0.05), paintedMat('panel', 0xffe2c4), -s * 0.49, 1.15, 0, piv);
    mesh(new THREE.SphereGeometry(0.035, 8, 6), 0xffc23d, -s * 0.9, 1.15, 0.05, piv);
    wDoors.push({ piv, s });
  }
  game.physics.addBox(-12.4, Y + 1.15, -35.45, 2.0, 2.3, 0.7);
  let wAng = 0;
  game.updaters.push((dt) => {
    const want = st.flag('wardrobe') ? 1.75 : 0;
    wAng += (want - wAng) * (1 - Math.exp(-dt * 5));
    wDoors.forEach((d) => { d.piv.rotation.y = -d.s * wAng; });
  });
  game.interact.add({
    pos: [-12.4, Y + 1.2, -34.8], r: 1.8, label: () => (st.flag('wardrobe') ? null : 'Ouvrir la penderie'),
    use: (g) => { g.audio.sfx('creak1', 0.6); g.setFlag('wardrobe'); },
  });
  // safe
  const safe = dyn(new THREE.Group());
  safe.position.set(-12.75, Y + 0.08, -35.4);
  wd.parent.add(safe);
  const metal = paintedMat('metal', 0x8f9aa6);
  mesh(new THREE.BoxGeometry(0.62, 0.56, 0.5), metal, 0, 0.28, 0, safe);
  const sDoor = new THREE.Group();
  sDoor.position.set(-0.29, 0, 0.26);
  safe.add(sDoor);
  mesh(new THREE.BoxGeometry(0.58, 0.52, 0.04), paintedMat('metal', 0xb7c1cc), 0.29, 0.28, 0, sDoor);
  const keypad = new Keypad(game, { code: '1479', color: 0x3b4252, onOpen: () => openSafe(true) });
  keypad.group.scale.setScalar(1.2);
  keypad.group.position.set(0.22, 0.3, 0.03);
  sDoor.add(keypad.group);
  const postit = mesh(new THREE.PlaneGeometry(0.13, 0.13), toon(0xffef6e, { map: textTexture(['Rouge', 'Bleu', 'Vert', 'Jaune'], { w: 128, h: 128, bg: '#ffef6e', fg: '#2f5aa8', font: '700 22px Poppins', border: null }), unique: true }), 0.48, 0.38, 0.025, sDoor);
  postit.rotation.z = 0.08;
  S.keypad = keypad;
  let sAng = 0;
  game.updaters.push((dt) => {
    const want = st.flag('safe') ? 1.6 : 0;
    sAng += (want - sAng) * (1 - Math.exp(-dt * 4));
    sDoor.rotation.y = -sAng;
  });
  const openSafe = async (fresh) => {
    if (!fresh) return;
    game.audio.sfx('metal_latch', 0.8);
    game.audio.sfx('jingle_solve', 0.7);
    game.setFlag('safe');
    game.exitInspect();
    await game.wait(0.9);
    game.ui.toast('Le coffre-fort s\'ouvre !', { cls: 'teal' });
  };
  game.interact.add({
    pos: [-12.75, Y + 0.45, -35.0], r: 1.7, label: () => (st.flag('wardrobe') && !st.flag('safe') ? 'Examiner le coffre-fort' : null),
    inspect: { cam: [-12.62, Y + 0.6, -34.45], look: [-12.68, Y + 0.38, -35.1], fov: 42, title: 'Coffre-fort — code à 4 chiffres', clickables: () => keypad.clickables() },
  });
  readable(game, {
    pos: [-12.3, Y + 0.45, -35.0], r: 1.7, label: 'Lire le post-it du coffre', title: 'Post-it jaune',
    visible: () => st.flag('wardrobe') && !st.flag('safe'),
    html: '<span class="ink-blue">Code du coffre = l\'heure de mes réveils !\n\n<b>Rouge — Bleu — Vert — Jaune</b>\n\n(Je les ai mis un peu partout, je dors très mal dans cet hôtel.)\n\n— M. Dupont, Suite 7</span>',
    clue: 'Post-it : code du coffre = heures des réveils rouge, bleu, vert, jaune.',
  });
  // safe contents
  const starObj = await_item('star');
  starObj.position.set(-12.85, Y + 0.3, -35.45);
  b.root.add(starObj);
  pickup(game, { id: 'star1', item: 'star', flag: 'star1', obj: starObj, pos: [-12.75, Y + 0.4, -35.1], visible: () => st.flag('safe'), label: 'Prendre l\'étoile d\'or', text: '<b>Étoile d\'or n°1</b> — un coquillage est gravé au dos', onTake: (g) => g.story.gotStar(1) });
  const key = await_item('key_secours');
  key.position.set(-12.55, Y + 0.12, -35.3);
  key.rotation.x = -Math.PI / 2;
  b.root.add(key);
  pickup(game, { id: 'key_secours', item: 'key_secours', obj: key, pos: [-12.6, Y + 0.3, -35.1], visible: () => st.flag('safe') });
  readable(game, {
    pos: [-12.9, Y + 0.2, -35.1], r: 1.7, label: 'Lire la lettre de M. Dupont', title: 'Lettre de M. Dupont', visible: () => st.flag('safe'),
    html: 'Jour 312 à l\'Hôtel Les Mirages.\n\nSi tu lis ceci, toi aussi tu as « gagné un séjour ».\nLa directrice a caché les <b>étoiles d\'or</b> de l\'hôtel dans ses pièces préférées. <b>Quatre étoiles</b> ouvrent son bureau, et dans son bureau se trouve la clé de son bateau.\n\nJ\'ai caché la clé du restaurant dans le sauna : là où personne ne reste longtemps.\n\nNe fais pas confiance au coucou de la réception : il ne chante que pour l\'hymne de l\'hôtel.\n\nBon courage. Moi, j\'ai abandonné et je fais de l\'aquagym.\n\n— Gérard Dupont',
    clue: 'Dupont : 4 étoiles ouvrent le bureau ; la clé du resto est dans le sauna ; le coucou ne chante que pour l\'hymne.',
  });

  // ------------------------------------------------ S2: Gustave on the balcony + pet flap
  balcony(b, -21, -11, -16.15, 2.6, Y);
  const balDoor = doorIn(b, hotel.balconyWall, -24.15, -16, 8.15, 1.4, 'balcony', { y: Y, h: 2.5, color: 0xffffff, panelColor: 0xf0d9c0, window: true, swing: 1, panels: false });
  const flap = new THREE.Group();
  flap.position.set(0.7, 0.42, 0);
  balDoor.pivot.add(flap);
  mesh(new THREE.BoxGeometry(0.4, 0.34, 0.11), 0xff8fb1, 0, -0.17, 0, flap);
  S.flap = flap;
  S.balDoor = balDoor;
  game.story.onApply(() => { if (st.flag('balcony_open')) balDoor.setOpen(true, true); });
  const planter = mesh(new THREE.BoxGeometry(1.2, 0.4, 0.4), paintedMat('terracotta'), -20.2, Y + 0.2, -14.0, b.root);
  planter.rotation.y = 0.0;
  b.prop('furniture-kit/plantSmall2', -20.6, -14.0, 0, { y: Y + 0.4, s: 2, collide: false });
  game.physics.addBox(-20.2, Y + 0.2, -14.0, 1.2, 0.4, 0.4);
  const btable = mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.04, 16), toon(0xffffff), -12.4, Y + 0.6, -14.4, b.root);
  mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.6, 8), toon(0xffffff), -12.4, Y + 0.3, -14.4, b.root);
  game.physics.addBox(-12.4, Y + 0.3, -14.4, 0.7, 0.6, 0.7);
  btable.castShadow = true;
  duckSpot(game, b, 'd_balcony', -19.8, Y + 0.4, -14.0, 0.4);
  duckSpot(game, b, 'd_bath', -23.3, Y + 0.32, -32.4, Math.PI / 2);
  biscuitSpot(game, b, 'b_pillow', -8.7, Y + 0.76, -25.5, 1, 'Prendre le biscuit sur l\'oreiller');

  game.story.onApply(() => {
    if (!st.flag('gustave')) { game.gustave.perchAt(V3(-15.4, Y + 1.0, -14.1), Math.PI); game.gustave.pecking = true; }
  });
  game.interact.add({
    pos: [-16, Y + 1.0, -16.4], r: 2.0, dy: 2.5,
    label: () => (st.flag('gustave') ? null : (st.s.biscuits > 0 ? 'Glisser un biscuit par la chatière' : 'Parler au perroquet derrière la vitre')),
    use: async (g) => {
      if (g.state.s.biscuits <= 0) {
        if (!st.flag('met_gustave')) {
          st.set('met_gustave');
          await g.say([
            { who: 'gustave', text: 'Psst ! Hé ! Toi, le nouveau ! Oui, toi, avec ta tête de touriste !' },
            { who: 'gustave', text: 'Gustave, perroquet officiel de l\'Hôtel Les Mirages. Enfin, ex-officiel. La directrice m\'a mis à la porte… du balcon.' },
            { who: 'gustave', text: 'Je connais tous les secrets de cet hôtel. Et je peux t\'aider à sortir d\'ici.' },
            { who: 'player', text: 'Génial ! Ouvre-moi, alors !' },
            { who: 'gustave', text: 'Ah, non non non. Rien n\'est gratuit, mon petit. Un perroquet, ça carbure au biscuit. Glisse-m\'en un par la chatière et on en reparle.' },
          ]);
          g.state.clue('Gustave veut un biscuit (à glisser par la chatière de la porte du balcon).');
        } else await g.say([{ who: 'gustave', text: 'Pas de biscuit ? Fouille un peu ! La directrice laisse toujours un « cadeau de bienvenue » quelque part…' }]);
        return;
      }
      await g.cut(async () => {
        g.state.s.biscuits--;
        g.ui.counters({ biscuits: g.state.s.biscuits });
        g.player.gesture('interact-right', 0.8);
        g.audio.sfx('soft', 0.5);
        await g.shot([-14.2, Y + 1.7, -17.6], [-16, Y + 0.6, -15.4], 1.0, 50);
        flapSwing(game, flap);
        g.gustave.pecking = false;
        await g.gustave.flyTo(V3(-16, Y + 0.35, -15.6), Math.PI);
        g.gustave.eat();
        await g.say([{ who: 'gustave', text: 'Miam ! Sablé pur beurre, pépites de chocolat… Tu as du goût, toi. Bon, attends, je passe par la chatière.' }]);
        flapSwing(game, flap);
        g.audio.sfx('pop', 0.6, 0.8);
        g.gustave.perchAt(V3(-16, Y + 0.5, -16.9), Math.PI);
        await g.wait(0.6);
        await g.say([{ who: 'gustave', text: 'Hnnngh… voilà. Tu ne racontes à personne que je suis resté coincé trois secondes. Et la porte du balcon, je te la crochète avec mon bec. Clic !' }]);
        g.audio.sfx('metal_click', 0.7);
        balDoor.setOpen(true);
        g.setFlag('balcony_open');
        await g.wait(0.5);
        g.gustave.comeBack();
        g.setFlag('gustave');
        await g.say([
          { who: 'gustave', text: 'Bon. Le deal : je reste sur ton épaule, et dès que tu sèches, appuie sur <b>H</b>. Un biscuit, un indice. Trois indices max par énigme, de plus en plus précis.' },
          { who: 'gustave', text: 'Les biscuits sont cachés partout dans l\'hôtel. Garde-les pour les moments où tu es vraiment coincé : il n\'y en a pas une infinité !' },
          { who: 'gustave', text: 'Et si tu veux un conseil gratuit : dans cette suite, rien n\'est là par hasard. Regarde, compte, note. Ton carnet (<b>J</b>) retient les indices pour toi.' },
        ]);
      });
    },
  });

  // ------------------------------------------------ exit: suite door (key_secours)
  lockedDoor(game, game.doors.suite, {
    flag: 'suite_open', key: 'key_secours', label: 'Porte de la suite',
    locked: [{ who: 'player', text: 'Verrouillée de l\'extérieur… Et j\'entends l\'étiquette « Ne pas déranger » se balancer de l\'autre côté. Elle se moque de moi.' }],
    unlockText: 'La clé de secours tourne. Liberté ! (enfin, presque)',
    onOpen: async (g) => { g.story.completeArea('suite'); },
  });

  // zones
  b.zone('balcon', [-21.2, Y - 0.5, -16.2, -10.8, Y + 3, -13.4], { inside: false, music: 'suite', area: 'suite' });
  b.zone('suite', [-24, Y - 0.5, -36, -8, ROOF, -16], { music: 'suite', area: 'suite' });
  return S;
}

// items that also exist in the world use the same 3D models as their icons
function await_item(id) { return ITEMS[id].make(); }

function flapSwing(game, flap) {
  game.audio.sfx('creak2', 0.4, 1.4);
  let t = 0;
  const f = (dt) => { t += dt; flap.rotation.x = Math.sin(t * 9) * Math.exp(-t * 2.5) * 1.1; if (t > 2) { flap.rotation.x = 0; game.updaters.splice(game.updaters.indexOf(f), 1); } };
  game.updaters.push(f);
}
