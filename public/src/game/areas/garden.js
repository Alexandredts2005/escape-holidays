// Outdoor puzzles: G1 fountain guardians, G2 lifeguard net + pool key, G3 Jean-Michel the pelican, G4 the tomato, and the pier gate.
import * as THREE from 'three';
import { toon, canvasTexture, textTexture } from '../../engine/toon.js';
import { DialLock } from '../locks.js';
import { makePelican } from '../npc.js';
import { ITEMS } from '../items.js';
import { pickup, duckSpot, biscuitSpot, readable, dyn, spinner, V3 } from '../puzzle.js';
import { mesh } from '../props.js';

const DIRS = ['sud', 'est', 'nord', 'ouest'];
const KINDS = { dauphin: 'du dauphin', tortue: 'de la tortue', flamant: 'du flamant', lion: 'du lion' };
const SOLUTION = { dauphin: 0, tortue: 3, flamant: 1, lion: 2 };
const START = { dauphin: 2, tortue: 1, flamant: 0, lion: 3 };

const INK = '#2a2233';
export const FRUIT = {
  ananas: (x, cx, cy, s) => { x.fillStyle = '#ffc23d'; x.beginPath(); x.ellipse(cx, cy + s * 0.2, s * 0.42, s * 0.55, 0, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#c98a1a'; x.lineWidth = s * 0.07; for (let i = -1; i <= 1; i++) { x.beginPath(); x.moveTo(cx - s * 0.4, cy + i * s * 0.25); x.lineTo(cx + s * 0.4, cy + s * 0.4 + i * s * 0.25); x.stroke(); } x.fillStyle = '#4fc85a'; for (const a of [-0.5, 0, 0.5]) { x.beginPath(); x.moveTo(cx, cy - s * 0.3); x.lineTo(cx + Math.sin(a) * s * 0.6 - s * 0.1, cy - s * 0.9); x.lineTo(cx + Math.sin(a) * s * 0.6 + s * 0.1, cy - s * 0.9); x.fill(); } },
  coco: (x, cx, cy, s) => { x.fillStyle = '#8a5a2a'; x.beginPath(); x.arc(cx, cy, s * 0.62, 0, Math.PI * 2); x.fill(); x.fillStyle = '#fffaf0'; x.beginPath(); x.arc(cx, cy, s * 0.42, 0, Math.PI * 2); x.fill(); x.fillStyle = '#5a3a1a'; for (const a of [0, 2.1, 4.2]) { x.beginPath(); x.arc(cx + Math.cos(a) * s * 0.2, cy + Math.sin(a) * s * 0.2, s * 0.07, 0, Math.PI * 2); x.fill(); } },
  fraise: (x, cx, cy, s) => { x.fillStyle = '#e8352b'; x.beginPath(); x.moveTo(cx - s * 0.55, cy - s * 0.3); x.quadraticCurveTo(cx, cy - s * 0.55, cx + s * 0.55, cy - s * 0.3); x.quadraticCurveTo(cx + s * 0.4, cy + s * 0.5, cx, cy + s * 0.8); x.quadraticCurveTo(cx - s * 0.4, cy + s * 0.5, cx - s * 0.55, cy - s * 0.3); x.fill(); x.fillStyle = '#ffe08a'; for (let i = 0; i < 7; i++) { x.beginPath(); x.arc(cx + Math.cos(i * 2.4) * s * 0.25, cy + Math.sin(i * 2.4) * s * 0.25 + s * 0.05, s * 0.04, 0, Math.PI * 2); x.fill(); } x.fillStyle = '#4fc85a'; x.beginPath(); x.ellipse(cx, cy - s * 0.42, s * 0.4, s * 0.12, 0, 0, Math.PI * 2); x.fill(); },
  citron: (x, cx, cy, s) => { x.fillStyle = '#ffe03a'; x.beginPath(); x.ellipse(cx, cy, s * 0.7, s * 0.48, 0.3, 0, Math.PI * 2); x.fill(); x.fillStyle = '#c9b020'; x.beginPath(); x.arc(cx + s * 0.62, cy + s * 0.2, s * 0.08, 0, Math.PI * 2); x.fill(); },
  pasteque: (x, cx, cy, s) => { x.fillStyle = '#3d9e3a'; x.beginPath(); x.arc(cx, cy - s * 0.2, s * 0.75, 0, Math.PI); x.fill(); x.fillStyle = '#ff5a6a'; x.beginPath(); x.arc(cx, cy - s * 0.2, s * 0.6, 0, Math.PI); x.fill(); x.fillStyle = INK; for (const k of [-0.3, 0, 0.3]) { x.beginPath(); x.ellipse(cx + k * s, cy + s * 0.1, s * 0.05, s * 0.09, 0, 0, Math.PI * 2); x.fill(); } },
  banane: (x, cx, cy, s) => { x.strokeStyle = '#ffd23c'; x.lineWidth = s * 0.35; x.lineCap = 'round'; x.beginPath(); x.arc(cx + s * 0.2, cy - s * 0.4, s * 0.75, 1.9, 3.2); x.stroke(); x.strokeStyle = '#6b4a1a'; x.lineWidth = s * 0.1; x.beginPath(); x.moveTo(cx - s * 0.62, cy - s * 0.48); x.lineTo(cx - s * 0.6, cy - s * 0.62); x.stroke(); },
};
const FRUITS = ['ananas', 'coco', 'fraise', 'citron', 'pasteque', 'banane'];

export function buildGarden(game, b, E) {
  const G = {};
  const st = game.state;
  // ------------------------------------------------ G1: statues around the fountain
  const rotOf = (k) => st.s.flags['rot_' + k] ?? START[k];
  for (const [kind, s] of Object.entries(E.statues)) {
    spinner(game, s, 7);
    s.rotation.y = s.userData.targetRot = rotOf(kind) * Math.PI / 2;
    game.interact.add({
      pos: [s.position.x, 1.4, s.position.z], r: 2.2, obj: s.userData.animal,
      label: () => (st.flag('fountain') ? null : `Tourner la statue ${KINDS[kind]} (elle regarde vers le ${DIRS[rotOf(kind) % 4]})`),
      use: (g) => {
        const v = (rotOf(kind) + 1) % 4;
        st.s.flags['rot_' + kind] = v;
        s.userData.targetRot += Math.PI / 2;
        g.audio.sfx('scratch', 0.6, 0.6);
        g.player.gesture('interact-right', 0.6);
        if (Object.keys(SOLUTION).every((k) => rotOf(k) === SOLUTION[k])) drain(true);
        g.save();
      },
    });
  }
  game.story.onApply(() => { for (const [kind, s] of Object.entries(E.statues)) { s.rotation.y = s.userData.targetRot = rotOf(kind) * Math.PI / 2; } if (st.flag('fountain')) drain(false); });
  readable(game, {
    pos: [0, 1.2, -2.8], r: 1.8, obj: null, label: 'Lire la plaque « Les Gardiens de la Fontaine »', title: 'Les Gardiens de la Fontaine',
    html: 'Le <b>dauphin</b> rêve du grand bleu.\nLa <b>tortue</b> ne pense qu\'à la salade.\nLe <b>flamant</b> cherche ses cousins en plastique.\nLe <b>lion</b> ne quitte jamais des yeux sa maîtresse.\n\n<i>Quand chacun regardera ce qu\'il aime,\nla fontaine livrera son secret.</i>',
    clue: 'Plaque de la fontaine : dauphin → grand bleu, tortue → salade, flamant → cousins en plastique, lion → sa maîtresse.',
  });
  const star2 = ITEMS.star.make();
  star2.position.set(0.9, 0.2, -8.5);
  star2.rotation.x = -Math.PI / 2;
  star2.visible = false;
  b.root.add(star2);
  const drain = (fresh) => {
    if (fresh && !st.flag('fountain')) {
      game.setFlag('fountain');
      game.audio.sfx('jingle_solve', 0.7);
      game.audio.sfx('whoosh', 0.6, 0.4);
      game.cut(async () => {
        await game.shot([6, 5, -1.5], [0, 0.4, -8.5], 1.2, 50);
        E.jetsOn = false;
        await game.wait(2.2);
        star2.visible = !st.flag('star2');
        game.fx.sparkle(star2.position.clone().add(V3(0, 0.3, 0)), 0xffe066, 24);
        await game.say([{ who: 'gustave', text: 'Les quatre gardiens regardent ce qu\'ils aiment… et la fontaine se vide ! Il y a une étoile au fond !' }]);
      });
    } else { E.jetsOn = false; E.fountainWater.position.y = 0.12; star2.visible = !st.flag('star2'); }
  };
  game.updaters.push((dt) => { if (st.flag('fountain') && E.fountainWater.position.y > 0.12) E.fountainWater.position.y = Math.max(0.12, E.fountainWater.position.y - dt * 0.25); });
  pickup(game, { id: 'star2', item: 'star', flag: 'star2', obj: star2, pos: [2.6, 0.8, -8.5], r: 2.2, visible: () => st.flag('fountain'), label: 'Ramasser l\'étoile au fond de la fontaine', text: '<b>Étoile d\'or n°2</b> — un soleil est gravé au dos', onTake: (g) => { g.story.gotStar(2); g.story.checkGarden(); } });

  // ------------------------------------------------ G2: the lifeguard's net (fruit padlock) + the pool key
  const lg = E.lifeguard;
  const net = ITEMS.epuisette.make();
  net.scale.setScalar(4.2);
  net.rotation.set(0, 0, 1.2);
  net.position.set(28.4 + 0.65, 1.0, -16.0);
  b.root.add(net);
  dyn(net);
  const fl = new DialLock(game, { n: 3, code: [0, 1, 2], symbols: FRUITS.map((f) => FRUIT[f]), radius: 0.06, width: 0.075, color: 0x2fa59b, wheelColor: '#ffffff', onOpen: () => openNet() });
  fl.group.position.set(28.4 + 0.72, 1.05, -16.55);
  fl.group.rotation.y = Math.PI / 2;
  b.root.add(dyn(fl.group));
  game.updaters.push((dt) => fl.update(dt));
  G.fruitLock = fl;
  const chain = mesh(new THREE.TorusGeometry(0.12, 0.02, 6, 14), toon(0xb7c1cc), 28.4 + 0.66, 1.05, -16.3, b.root);
  chain.rotation.y = Math.PI / 2;
  dyn(chain);
  const openNet = () => {
    game.setFlag('net_unlocked');
    fl.group.visible = false;
    chain.visible = false;
    game.audio.sfx('metal_latch', 0.7);
    game.audio.sfx('jingle_solve', 0.6);
    game.exitInspect();
  };
  game.story.onApply(() => { if (st.flag('net_unlocked')) { fl.group.visible = false; chain.visible = false; } });
  game.interact.add({
    pos: [29.4, 1.1, -16.5], r: 1.8, label: () => (st.flag('net_unlocked') ? null : 'Examiner le cadenas de l\'épuisette'),
    inspect: { cam: [29.75, 1.25, -16.55], look: [29.12, 1.05, -16.55], fov: 40, title: 'Cadenas à fruits — 3 molettes', clickables: () => fl.clickables() },
  });
  pickup(game, { id: 'epuisette', item: 'epuisette', obj: net, pos: [29.3, 1.0, -15.9], visible: () => st.flag('net_unlocked'), label: 'Prendre l\'épuisette' });
  readable(game, {
    pos: [29.0, 1.6, -17.0], r: 1.8, label: 'Lire le mot du maître-nageur', title: 'Mot scotché sur la chaise',
    html: '« Épuisette réservée au maître-nageur !\nLe code du cadenas ? Facile : <b>mon cocktail préféré</b>, celui qui porte <b>le nom de l\'hôtel</b>. Comme ça je n\'oublie jamais.\n\n— Kevin, maître-nageur (en vacances lui aussi) »',
    clue: 'Maître-nageur : code du cadenas = son cocktail préféré, qui porte le nom de l\'hôtel.',
  });
  // tiki bar chalkboard
  const cocktails = [['Le Mirage', ['ananas', 'coco', 'fraise']], ['Le Pincevent', ['citron', 'citron', 'citron']], ['Le Gustave', ['banane', 'coco', 'ananas']], ['La Bouée', ['pasteque', 'fraise', 'citron']]];
  const board = canvasTexture(400, 420, (x, W, H) => {
    x.fillStyle = '#2b3a33'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#8a5a2a'; x.lineWidth = 16; x.strokeRect(8, 8, W - 16, H - 16);
    x.fillStyle = '#fffaf0'; x.font = '400 36px Pacifico'; x.textAlign = 'center'; x.fillText('Cocktails', W / 2, 60);
    cocktails.forEach(([n, f], i) => {
      const y = 120 + i * 78;
      x.textAlign = 'left'; x.fillStyle = '#ffe08a'; x.font = '700 24px Poppins'; x.fillText(n, 30, y);
      f.forEach((fr, k) => FRUIT[fr](x, 250 + k * 50, y - 8, 20));
    });
  });
  const bb = mesh(new THREE.PlaneGeometry(1.0, 1.05), toon(0xffffff, { map: board, unique: true, rim: false }), 51.6, 1.7, -14.3, b.root);
  bb.rotation.y = -Math.PI / 2 + 0.3;
  readable(game, {
    pos: [51.0, 1.4, -14.6], r: 2.0, label: 'Lire l\'ardoise des cocktails', title: 'Cocktails du bar',
    html: cocktails.map(([n, f]) => `<b>${n}</b> : ${f.join(' + ')}`).join('\n') + '\n\n<i>(Le Gustave est interdit aux perroquets.)</i>',
    clue: 'Ardoise du bar : Le Mirage = ananas + coco + fraise.',
  });
  for (const [x, z, f] of [[52.2, -17.5, 'food-kit/cocktail'], [52.2, -16.4, 'food-kit/coconut'], [52.2, -18.6, 'food-kit/pineapple']]) b.prop(f, x, 1.15, z, { h: 0.3, collide: false });
  biscuitSpot(game, b, 'b_tiki', 52.2, 1.17, -15.6, 1, 'Prendre le biscuit sur le comptoir');
  // the key glinting at the bottom of the pool
  const sk = ITEMS.key_spa.make();
  sk.scale.setScalar(1.6);
  sk.position.set(41, -1.6, -22.4);
  sk.rotation.x = -Math.PI / 2;
  b.root.add(sk);
  dyn(sk);
  game.fx.emitter((fx) => { if (!st.flag('got_key_spa')) fx.spawn(V3(41 + (Math.random() - 0.5) * 0.4, -0.15, -22.4 + (Math.random() - 0.5) * 0.4), V3(0, 0.2, 0), { life: 0.8, s0: 0.08, s1: 0, color: 0xffffaa }); }, 4);
  game.story.onApply(() => { if (st.flag('got_key_spa')) sk.visible = false; });
  game.interact.add({
    pos: [41, 0.4, -24.6], r: 2.2, label: () => (st.flag('got_key_spa') ? null : (game.has('epuisette') ? 'Repêcher l\'objet brillant avec l\'épuisette' : 'Quelque chose brille au fond de la piscine')),
    use: async (g) => {
      if (!g.has('epuisette')) { await g.say([{ who: 'player', text: 'Une clé, tout au fond ! Trop profond pour la main… et « baignade interdite » d\'après le panneau. Il me faudrait un outil.' }]); return; }
      await g.cut(async () => {
        await g.shot([43, 2.6, -26.5], [41, -0.8, -22.4], 1.0, 50);
        g.player.gesture('interact-right', 1.2);
        g.audio.sfx('plop', 0.8);
        g.fx.splash(V3(41, -0.15, -22.4), 25);
        await g.wait(0.8);
        sk.visible = false;
        g.state.set('got_key_spa');
        g.take('epuisette');
        g.give('key_spa');
        await g.say([{ who: 'gustave', text: 'La clé du Spa ! Je savais bien que cette piscine cachait quelque chose. À part Kevin.' }]);
        g.story.checkGarden();
      });
    },
  });
  b.sign(['BAIGNADE', 'INTERDITE', '(sauf direction)'], 30.5, 1.4, -26.4, 0, 1.0, 0.6, { font: '800 36px Poppins', bg: '#ff3355', fg: '#ffffff' });
  b.box(30.5, 0, -26.45, 0.08, 1.1, 0.08, toon(0x2a2a3a), { collide: false });

  // ------------------------------------------------ G3: Jean-Michel the pelican (trade the spoon for a sardine)
  const pel = makePelican();
  pel.root.position.set(2.6, 0.95, 44.6);
  pel.root.rotation.y = -0.9;
  b.root.add(dyn(pel.root));
  mesh(new THREE.CylinderGeometry(0.22, 0.24, 1.0, 10), toon(0x9c6d3a), 2.6, 0.45, 44.6, b.root);
  game.physics.addBox(2.6, 0.8, 44.6, 0.6, 1.6, 0.6);
  const sardineInBeak = ITEMS.sardine.make();
  sardineInBeak.scale.setScalar(0.5);
  sardineInBeak.position.set(0.05, -0.04, 0.36);
  sardineInBeak.rotation.y = Math.PI / 2;
  pel.head.add(sardineInBeak);
  game.story.onApply(() => { sardineInBeak.visible = !st.flag('got_sardine'); });
  game.updaters.push((dt, t) => { pel.head.rotation.x = Math.sin(t * 0.8) * 0.08; pel.head.rotation.y = Math.sin(t * 0.37) * 0.4; });
  let pTalk = 0;
  game.interact.add({
    pos: [2.6, 1.2, 44.0], r: 2.2, label: () => (st.flag('got_sardine') ? 'Saluer Jean-Michel' : (game.has('spoon') ? 'Proposer la cuillère au pélican' : 'Parler au pélican')),
    use: async (g) => {
      if (st.flag('got_sardine')) { await g.say([{ who: 'pelican', text: 'Kroâ. (Jean-Michel admire son reflet dans la cuillère. Il est heureux.)' }]); return; }
      if (g.has('spoon')) {
        await g.cut(async () => {
          await g.shot([0.5, 1.8, 42.2], [2.6, 1.5, 44.6], 1.0, 45);
          await g.say([{ who: 'pelican', text: 'KROÂÂ ?! (Jean-Michel fixe la cuillère en argent. Ses yeux brillent presque autant qu\'elle.)' }]);
          g.take('spoon');
          g.audio.sfx('pop', 0.7);
          sardineInBeak.visible = false;
          g.state.set('got_sardine');
          g.give('sardine');
          await g.say([
            { who: 'pelican', text: 'Kroâ kroâ. (Il lâche sa sardine et serre la cuillère contre son cœur.)' },
            { who: 'gustave', text: 'Jean-Michel est un pélican-pie : il collectionne tout ce qui brille. Il a même une cuillère à melon de 1992.' },
          ]);
        });
        return;
      }
      const lines = [
        [{ who: 'pelican', text: 'Kroâ. (Le pélican garde jalousement une sardine dans son bec. Il te toise.)' }, ...(st.flag('gustave') ? [{ who: 'gustave', text: 'C\'est Jean-Michel. Il n\'échange sa sardine que contre quelque chose qui BRILLE. Les cailloux, il les recrache.' }] : [])],
        [{ who: 'pelican', text: 'Kroâ ? (Il fixe tes clés, puis ton visage, puis soupire. Rien de tout ça ne brille assez.)' }],
      ];
      await g.say(lines[pTalk++ % lines.length]);
      g.state.clue('Jean-Michel le pélican échange sa sardine contre un objet qui brille.');
    },
  });

  // ------------------------------------------------ G4: the tomato (and the scarecrow on holiday)
  const plants = E.tomatoPlants;
  const tomatoes = plants.flatMap((p) => p.userData.fruits);
  game.story.onApply(() => { if (st.flag('got_tomato')) tomatoes[1].visible = false; });
  pickup(game, { id: 'tomato', item: 'tomato', obj: tomatoes[1], pos: [-38.5, 0.9, -12.2], r: 2.0, label: 'Cueillir une tomate cœur-de-bœuf' });
  let scT = 0;
  game.interact.add({
    pos: [-35, 1.6, -10.4], r: 1.8, label: 'Parler à l\'épouvantail',
    use: async (g) => {
      const lines = [
        'L\'épouvantail porte des lunettes de soleil. Il est clairement en vacances, lui aussi.',
        'Un écriteau autour de son cou : « Je fais peur aux corbeaux. Pas aux touristes. Servez-vous. »',
        'Il ne répond pas. Il bronze.',
      ];
      await g.say([{ who: 'player', text: lines[scT++ % lines.length] }]);
    },
  });
  readable(game, { pos: [-49, 1.3, -4.2], r: 2.2, label: 'Regarder dans la serre', title: 'La serre', html: 'Des plants d\'eucalyptus, de menthe et de lavande. Une étiquette : « Pour le hammam — ne pas manger, Gustave ! »' });

  // ------------------------------------------------ collectibles outside
  duckSpot(game, b, 'd_castle', -16, 2.32, 37, 0.3);
  duckSpot(game, b, 'd_lighthouse', -53, 0.35, 43.9, 0);
  biscuitSpot(game, b, 'b_bench', -8.0, 0.5, 8.0, 1, 'Prendre le biscuit sur le banc');
  biscuitSpot(game, b, 'b_shed', -29, 0.1, 5.5, 1, 'Prendre le biscuit devant la cabane');

  // ------------------------------------------------ garden gates & pier gate
  game.story.onApply(() => {
    const open = st.flag('intro_done');
    E.gates.forEach((g) => g.setOpen(open, true));
    const pierOpen = !st.flag('intro_done') || st.flag('escaped');
    E.pierGate.forEach((g) => g.setOpen(pierOpen, true));
  });
  game.interact.add({
    pos: [0, 1.2, 46.6], r: 2.2,
    label: () => (st.flag('intro_done') && !st.flag('escaped') ? (game.has('boat_key') ? 'Ouvrir la grille du ponton (clé du bateau)' : 'Grille du ponton') : null),
    use: async (g) => {
      if (!g.has('boat_key')) {
        await g.say([{ who: 'player', text: 'Une grosse grille, un cadenas en forme d\'ancre. « Ponton privé de la Direction ». Le bateau est juste derrière…' }]);
        g.state.clue('La grille du ponton a un cadenas en forme d\'ancre (clé du bateau ?).');
        return;
      }
      await g.story.ending();
    },
  });
  for (const [x, z] of [[-16, -8], [16, -8]]) game.interact.add({ pos: [x, 1.2, z], r: 2, label: () => (st.flag('intro_done') ? null : 'Grille du jardin'), use: async (g) => g.say([{ who: 'player', text: '« Jardins fermés pour la nuit. Ouverture à 8 h. » Bon, demain alors.' }]) });
  return G;
}
