// Inventory items: names, descriptions, 3D models (used for world pickups and for the inventory icons).
import * as THREE from 'three';
import { toon, canvasTexture } from '../engine/toon.js';
import { get, has } from '../engine/assets.js';

const GOLD = 0xffc23d;

function key(color = GOLD, fob = 'round', fobColor = 0xff7458) {
  const g = new THREE.Group();
  const m = toon(color);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.016, 8, 20), m);
  ring.position.x = -0.09;
  g.add(ring);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 8), m);
  shaft.rotation.z = Math.PI / 2;
  shaft.position.x = 0.03;
  g.add(shaft);
  for (const [x, h] of [[0.08, 0.04], [0.05, 0.028]]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.014, h, 0.012), m);
    t.position.set(x, -h / 2, 0);
    g.add(t);
  }
  // fob (tag) hanging on the ring
  const fm = toon(fobColor);
  let f;
  if (fob === 'drop') {
    f = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), fm);
    f.scale.set(1, 1.3, 0.45);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.05, 10), fm);
    tip.position.y = 0.065;
    tip.scale.z = 0.5;
    f.add(tip);
  } else if (fob === 'star') {
    f = star(0.05, 0.022, fobColor);
  } else if (fob === 'flame') {
    f = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 8), fm);
    f.scale.z = 0.4;
  } else if (fob === 'anchor') {
    f = new THREE.Group();
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.09, 0.014), fm);
    const b = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.01, 6, 12, Math.PI), fm);
    b.rotation.z = Math.PI;
    b.position.y = -0.035;
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.012), fm);
    c.position.y = 0.03;
    f.add(a, b, c);
  } else {
    f = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 16), fm);
    f.rotation.x = Math.PI / 2;
  }
  f.position.set(-0.13, -0.07, 0);
  g.add(f);
  g.rotation.z = 0.25;
  return g;
}

export function star(r = 0.12, depth = 0.04, color = GOLD) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i / 10) * Math.PI * 2;
    const rr = i % 2 ? r * 0.45 : r;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: r * 0.08, bevelThickness: r * 0.08, bevelSegments: 2 });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, toon(color, { emissive: 0x553300, emissiveIntensity: 0.4 }));
}

export function duck(color = 0xffcf3a, s = 1) {
  const g = new THREE.Group();
  const m = toon(color, { emissive: color === 0xffcf3a ? 0x4a3000 : 0x000000 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), m);
  body.scale.set(1.25, 0.85, 1);
  body.position.y = 0.08;
  g.add(body);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.08, 8), m);
  tail.rotation.z = 1.1;
  tail.position.set(-0.12, 0.12, 0);
  g.add(tail);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 10), m);
  head.position.set(0.07, 0.2, 0);
  g.add(head);
  const beak = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), toon(0xff7a2a));
  beak.scale.set(1.4, 0.5, 1);
  beak.position.set(0.135, 0.19, 0);
  g.add(beak);
  for (const z of [0.035, -0.035]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), toon(0x2a2233));
    e.position.set(0.115, 0.225, z);
    g.add(e);
  }
  g.scale.setScalar(s);
  return g;
}

export function biscuit() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.022, 18), toon(0xd9a05b));
  g.add(b);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 5), toon(0x5a3420));
    c.position.set(Math.cos(a) * 0.04, 0.011, Math.sin(a) * 0.04);
    g.add(c);
  }
  const c = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), toon(0x5a3420));
  c.position.y = 0.011;
  g.add(c);
  return g;
}

function kenney(name, s = 1, tint) {
  if (!has(name)) return new THREE.Mesh(new THREE.SphereGeometry(0.08), toon(tint || 0xff00ff));
  const o = get(name);
  o.scale.setScalar(s);
  if (tint) o.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.multiply(new THREE.Color(tint)); } });
  return o;
}

function paperNote(lines, color = '#fbeed2') {
  const t = canvasTexture(256, 320, (x, w, h) => {
    x.fillStyle = color; x.fillRect(0, 0, w, h);
    x.fillStyle = '#3b2a22'; x.font = '600 26px Poppins';
    lines.forEach((l, i) => x.fillText(l, 22, 52 + i * 38));
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.2), toon(0xffffff, { map: t, side: THREE.DoubleSide, unique: true, rim: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

export const STAR_SYMBOLS = { star1: 'coquillage', star2: 'soleil', star3: 'feuille', star4: 'poisson' };

export const ITEMS = {
  bracelet: {
    name: 'Bracelet « tout compris »',
    desc: 'Un bracelet en plastique turquoise. Imprimé dessus : <b>« Tout compris* »</b>.<br><small>*sauf la sortie.</small><br><br>Il sert de clé pour les casiers du spa.',
    make: () => { const g = new THREE.Group(); const t = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 10, 28), toon(0x24c7b8)); g.add(t); const tag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.035, 0.03), toon(0xffc23d)); tag.position.y = -0.075; g.add(tag); return g; },
  },
  spoon: {
    name: 'Cuillère en argent',
    desc: 'Une petite cuillère du minibar, gravée « Les Mirages ». Elle brille tellement que tu vois ton reflet dedans… et il a l\'air fatigué.',
    make: () => { const g = new THREE.Group(); const m = toon(0xdfe7f0, { emissive: 0x222833 }); const h = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.18, 8), m); h.rotation.z = Math.PI / 2; h.position.x = -0.06; g.add(h); const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), m); b.scale.set(1.4, 0.35, 1); b.position.x = 0.06; g.add(b); g.rotation.z = 0.3; return g; },
  },
  key_secours: { name: 'Clé de secours', desc: 'Une clé dorée avec une étiquette : <b>« Suite 7 — en cas d\'urgence »</b>. Et ça, c\'est une urgence.', make: () => key(GOLD, 'round', 0xff7458) },
  star: {
    name: 'Étoile d\'or',
    desc: 'Une étoile dorée de l\'hôtel.',
    make: () => star(0.12, 0.04),
    examine: (game) => {
      const got = Object.keys(STAR_SYMBOLS).filter((k) => game.state.flag(k));
      game.ui.note('Étoiles d\'or', `Tu as <b>${got.length} étoile${got.length > 1 ? 's' : ''}</b> sur 5.<br><br>Au dos de chaque étoile, un symbole est gravé :<br>${got.map((k) => `• Étoile n°${k.slice(4)} : <b>${STAR_SYMBOLS[k]}</b>`).join('<br>')}<br><br><i>La porte du bureau de la directrice, à l'étage, a 4 encoches en forme d'étoile.</i>`);
    },
  },
  key_hall: { name: 'Clé du hall', desc: 'Une grosse clé recrachée par le coucou de la réception. Étiquette : <b>« Porte principale »</b>. Direction : le grand air !', make: () => key(0xc9a24a, 'star', 0x24a7a0) },
  epuisette: {
    name: 'Épuisette', desc: 'Une épuisette de piscine, longue et un peu tordue. Idéale pour repêcher ce qui traîne au fond de l\'eau.',
    make: () => { const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 8), toon(0x3d8fd6)); p.rotation.z = Math.PI / 2; p.position.x = -0.12; g.add(p); const r = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.01, 6, 20), toon(0xdfe7f0)); r.position.x = 0.21; r.rotation.y = Math.PI / 2; g.add(r); const n = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.1, 12, 1, true), toon(0xffffff, { transparent: true, opacity: 0.6, side: THREE.DoubleSide })); n.rotation.z = Math.PI / 2; n.position.x = 0.26; g.add(n); g.rotation.z = 0.5; return g; },
  },
  key_spa: { name: 'Clé du Spa', desc: 'Une clé repêchée au fond de la piscine, avec une goutte d\'eau en porte-clé. <b>« Spa Bulles de Rêve »</b>.', make: () => key(0xdfe7f0, 'drop', 0x5fc8f0) },
  tomato: { name: 'Tomate cœur-de-bœuf', desc: 'Une tomate énorme, chipée à l\'épouvantail. Parfaite pour une bouillabaisse.', make: () => kenney('food-kit/tomato', 0.9) },
  sardine: { name: 'Sardine', desc: 'Une sardine offerte par Jean-Michel le pélican, en échange de la cuillère. Elle sent… la sardine.', make: () => kenney('food-kit/fish', 0.55, 0x9fc7e8) },
  key_sauna: { name: 'Clé du sauna', desc: 'Une clé avec une flamme en bois. Trouvée dans le casier 9, celui de la directrice.', make: () => key(0xc9a24a, 'flame', 0xff5a3a) },
  key_resto: { name: 'Clé du restaurant', desc: '<b>« Le Homard Joyeux »</b>. Cachée par M. Dupont dans le sauna, là où personne ne reste longtemps.', make: () => key(GOLD, 'round', 0xe8473f) },
  key_kitchen: { name: 'Clé de la cuisine', desc: 'Recrachée par le homard mécanique. Elle sent un peu le beurre à l\'ail.', make: () => key(0xdfe7f0, 'round', 0xffffff) },
  onion: { name: 'Oignon', desc: 'Un oignon de la réserve. Il te fait déjà pleurer, ou c\'est la situation ?', make: () => kenney('food-kit/onion', 0.9) },
  rouget: { name: 'Rouget', desc: 'Un rouget tout frais… enfin, tout congelé. Récupéré dans la chambre froide.', make: () => kenney('food-kit/fish', 0.6, 0xff8f7a) },
  recipe: {
    name: 'Morceaux de recette',
    desc: '',
    make: () => paperNote(['Bouilla-', 'baisse', '...']),
    examine: (game) => game.story.showRecipe(),
  },
  boat_key: { name: 'Clé du bateau', desc: 'La clé du « Mirage II », le bateau de la directrice. La liberté tient dans ta main.', make: () => key(GOLD, 'anchor', 0x1b2440) },
};
