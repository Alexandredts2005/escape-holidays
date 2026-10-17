// Story driver: intro, objectives, the hint ladder of every step, area stamps, stars, and the ending.
import * as THREE from 'three';
import { ITEMS } from './items.js';
import { makeLobster } from './areas/restaurant.js';
import { fmt } from '../main.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export const AREAS = [
  { id: 'suite', name: 'Suite 7', desc: 'Ta chambre… verrouillée de l\'extérieur.', stamp: 'furniture-kit/bedDouble', color: '#ffd0e0' },
  { id: 'hall', name: 'Le Grand Hall', desc: 'Réception, piano et coucou.', stamp: 'furniture-kit/loungeSofa', color: '#ffe08a' },
  { id: 'jardins', name: 'Jardins & piscine', desc: 'Fontaine, piscine, potager et plage.', stamp: 'nature-kit/tree_palmTall', color: '#b8f0a8' },
  { id: 'spa', name: 'Spa Bulles de Rêve', desc: 'Hammam, vestiaires et sauna.', stamp: 'furniture-kit/bathtub', color: '#b8f0ea' },
  { id: 'restaurant', name: 'Le Homard Joyeux', desc: 'Restaurant, cuisine et chambre froide.', stamp: 'food-kit/pot-stew', color: '#ffc4b0' },
  { id: 'bureau', name: 'Le Bureau', desc: 'Le repaire de la directrice.', stamp: () => ITEMS.star.make(), color: '#d9c9ff' },
];

const f = (game, k) => game.state.flag(k);

// Steps in play order. `area`: where its hints count; `obj`: objective; `done`: completion test; `hints`: 3 levels.
function steps(game) {
  const g = game;
  return [
    { id: 'arrive', area: 'hall', obj: 'Rejoins la réception de l\'hôtel, en haut de l\'allée.', done: () => f(g, 'intro_done') },
    { id: 's_gustave', area: 'suite', obj: 'Un perroquet toque à la vitre du balcon… Il a l\'air d\'avoir faim.', done: () => f(g, 'gustave') },
    {
      id: 's_minibar', area: 'suite', obj: 'Trouve le code du minibar.', done: () => f(g, 'minibar'),
      hints: [
        'Une bonne douche chaude, ça éclaircit les idées… et ça fait apparaître des choses sur les miroirs.',
        'La buée du miroir montre un flamant, un coquillage et un ananas. Compte chacun d\'eux dans toute la suite : balcon et salle de bain compris !',
        '4 flamants (statuette, serviette, lampe, bouée dégonflée), 6 coquillages, 3 ananas. Code du minibar : 4-6-3.',
      ],
    },
    {
      id: 's_safe', area: 'suite', obj: 'Ouvre le coffre-fort caché dans la penderie.', done: () => f(g, 'safe'),
      hints: [
        'La penderie s\'ouvre, et le post-it du coffre parle des réveils de M. Dupont. Il y en a quatre, de quatre couleurs.',
        'Réveil rouge sur la table de nuit, bleu dans la salle de bain, vert sur le balcon, et le jaune… au frais dans le minibar. Regarde l\'heure de chacun.',
        'Rouge 1 h, bleu 4 h, vert 7 h, jaune 9 h : le code du coffre est 1479.',
      ],
    },
    {
      id: 's_exit', area: 'suite', obj: 'Sors de la Suite 7 !', done: () => f(g, 'suite_open'),
      hints: ['Le coffre contenait une clé de secours, non ?', 'La clé de secours ouvre la porte de la suite, au nord de la chambre.', 'Approche-toi de la porte de la suite et appuie sur E : la clé s\'utilise toute seule.'],
    },
    {
      id: 'h_piano', area: 'hall', obj: 'Trouve un moyen de sortir de l\'hôtel.', done: () => f(g, 'piano'),
      hints: [
        'La grande porte est verrouillée. Le coucou de la réception « ne chante que pour l\'Hymne des Mirages »… et il y a un piano dans le hall.',
        'La partition de l\'hymne est encadrée dans le couloir de l\'étage, à côté d\'une boîte à musique. Marcel la fredonne aussi en dormant.',
        'Au piano, joue : Sol, Mi, Do, Mi, Ré, Sol.',
      ],
    },
    {
      id: 'h_door', area: 'hall', obj: 'Récupère la clé crachée par le coucou et ouvre la grande porte.', done: () => f(g, 'hall_open'),
      hints: ['Le coucou a recraché une clé sur le comptoir de la réception.', 'Prends la clé du hall sur le comptoir, puis va à la grande porte au sud du hall.', 'Appuie sur E devant la porte principale avec la clé du hall en poche.'],
    },
    {
      id: 'g_statues', area: 'jardins', need: () => f(g, 'hall_open'), obj: 'Une étoile se cache dans les jardins… La fontaine a l\'air bien gardée.', done: () => f(g, 'star2'),
      hints: [
        'Lis la plaque devant la fontaine : chaque gardien doit regarder ce qu\'il aime. Chaque statue tourne d\'un quart de tour quand tu l\'actionnes.',
        'Le grand bleu, c\'est la mer (sud). La salade pousse au potager (ouest). Les cousins en plastique flottent dans la piscine (est). La maîtresse du lion est dans l\'hôtel (nord).',
        'Dauphin vers le sud, tortue vers l\'ouest, flamant vers l\'est, lion vers le nord. Puis ramasse l\'étoile au fond de la fontaine.',
      ],
    },
    {
      id: 'g_net', area: 'jardins', need: () => f(g, 'hall_open'), obj: 'Quelque chose brille au fond de la piscine. Trouve de quoi l\'attraper.', done: () => f(g, 'net_unlocked') || f(g, 'got_key_spa'),
      hints: [
        'L\'épuisette du maître-nageur est cadenassée à sa chaise. Son mot dit que le code est son cocktail préféré, qui porte le nom de l\'hôtel.',
        'L\'ardoise du bar de la piscine donne la recette de chaque cocktail. Cherche « Le Mirage ».',
        'Le Mirage = ananas, coco, fraise. Règle le cadenas de l\'épuisette sur ces trois fruits.',
      ],
    },
    {
      id: 'g_key', area: 'jardins', need: () => f(g, 'hall_open'), obj: 'Repêche l\'objet brillant au fond de la piscine.', done: () => f(g, 'got_key_spa'),
      hints: ['Prends l\'épuisette sur la chaise du maître-nageur.', 'L\'objet brille près du bord nord de la piscine, côté hôtel.', 'Va sur le bord nord de la piscine, face à la clé, et appuie sur E.'],
    },
    {
      id: 'p_hammam', area: 'spa', obj: 'Le spa est ouvert. Fais chauffer le hammam.', done: () => f(g, 'hammam'), need: () => f(g, 'spa_open'),
      hints: [
        'Le hammam a trois vannes. Une affiche du spa, le « Programme Aroma », donne un réglage par jour de la semaine.',
        'Le petit calendrier sur le comptoir d\'accueil du spa indique le jour : mercredi.',
        'Mercredi : eucalyptus 2, menthe 7, lavande 5.',
      ],
    },
    {
      id: 'p_locker', area: 'spa', obj: 'Suis le message apparu dans la vapeur du hammam.', done: () => f(g, 'locker9'), need: () => f(g, 'spa_open'),
      hints: [
        'Les peignoirs du vestiaire sont brodés d\'initiales et pendus à des patères numérotées. Qui est « la patronne » ?',
        'La patronne, c\'est la directrice : Véronique Pincevent, V.P. Son peignoir pend à la patère 9.',
        'Ouvre le casier n°9 avec ton bracelet « tout compris ».',
      ],
    },
    {
      id: 'p_sauna_in', area: 'spa', obj: 'Fouille le sauna.', done: () => (f(g, 'star3') && f(g, 'got_key_resto')) || f(g, 'sauna_done'), need: () => f(g, 'locker9'),
      hints: ['La clé du sauna était dans le casier 9.', 'Le sauna est la porte du fond du spa. M. Dupont y a caché quelque chose « là où personne ne reste longtemps ».', 'Le coffret en bois près des bancs du sauna contient une étoile et la clé du restaurant.'],
    },
    {
      id: 'p_sauna_out', area: 'spa', obj: 'Échappe-toi du sauna avant de cuire !', done: () => f(g, 'sauna_done'), need: () => f(g, 'star3') || g.timers.sauna,
      hints: [
        'Les planches gravées sur le banc donnent un ordre : 1 ce qui refroidit, 2 ce qui mouille, 3 ce qui souffle.',
        'Ce qui refroidit : le flocon. Ce qui mouille : la goutte. Ce qui souffle : le vent.',
        'Règle les trois molettes de la serrure intérieure : flocon, goutte, vent.',
      ],
    },
    {
      id: 'r_table', area: 'restaurant', obj: 'Le Homard Joyeux attend une table VIP parfaitement placée.', done: () => f(g, 'seating_ok'), need: () => f(g, 'resto_open'),
      hints: [
        'Le livre des réservations, à l\'entrée du restaurant, décrit les caprices des 4 invités. La rose des vents de la nappe indique la mer (au sud).',
        'Le Docteur veut voir la mer : il s\'assoit au nord. Le Baron refuse d\'avoir le dos à la mer, donc il n\'est pas au sud… et la Comtesse est à SA droite.',
        'Nord : Docteur. Ouest : Baron. Sud : Comtesse. Est : Amiral.',
      ],
    },
    {
      id: 'r_cold', area: 'restaurant', obj: 'Échappe-toi de la chambre froide !', done: () => !g.timers.cold, need: () => !!g.timers.cold,
      hints: ['L\'affiche près de la porte : les températures des caisses, dans l\'ordre des livraisons.', 'Lundi −5, mardi −2, mercredi −6, jeudi −3.', 'Tape 5263 sur le clavier d\'urgence.'],
    },
    {
      id: 'r_ingredients', area: 'restaurant', obj: 'Réunis les ingrédients de la bouillabaisse secrète.', need: () => f(g, 'kitchen_open'),
      done: () => f(g, 'soup') || ['onion', 'tomato', 'rouget', 'sardine'].every((i) => g.has(i) || (g.state.s.flags.soupSeq || []).includes(i)),
      hints: [
        'La recette est déchirée en trois morceaux : sur le frigo, dans le garde-manger et dans la chambre froide. Regarde-la dans ton sac.',
        'Oignon : garde-manger. Tomate : potager de l\'ouest. Rouget : chambre froide. Sardine : Jean-Michel le pélican, près du ponton.',
        'Jean-Michel échange sa sardine contre la cuillère en argent du minibar. La tomate se cueille près de l\'épouvantail.',
      ],
    },
    {
      id: 'r_soup', area: 'restaurant', obj: 'Prépare la bouillabaisse dans la grande marmite.', done: () => f(g, 'star4'), need: () => f(g, 'kitchen_open'),
      hints: ['Mets les ingrédients dans la marmite dans l\'ordre de la recette, puis remue.', 'Ordre : oignon, tomate, rouget, sardine. Puis trois coups de louche.', 'Dans la marmite : oignon, tomate, rouget, sardine, puis clique trois fois sur la louche. Ramasse l\'étoile !'],
    },
    {
      id: 'f_stars', area: 'bureau', obj: 'Place les 4 étoiles d\'or dans la porte du bureau de la directrice (étage, côté est).', done: () => f(g, 'office_open'),
      hints: [
        'La porte du bureau, au premier étage côté est, a 4 encoches en forme d\'étoile : le « Système Cinq Étoiles ».',
        'Il faut 4 étoiles : la suite (coffre), les jardins (fontaine), le spa (sauna) et le restaurant (marmite).',
        'Va devant la porte du bureau avec tes étoiles et appuie sur E.',
      ],
    },
    {
      id: 'f_safe', area: 'bureau', obj: 'Ouvre le coffre de la directrice avant la fin du Grand Ménage !', done: () => f(g, 'safe5'), need: () => f(g, 'office_open'),
      hints: [
        'La plaque du coffre : « Mes étoiles, dans l\'ordre de ma tournée ». Le plan de sa tournée est accroché au mur nord.',
        'Coquillage = Suite 7, soleil = Jardins, feuille = Spa, poisson = Restaurant. Sa tournée : Restaurant, Spa, Suite 7, Jardins.',
        'Appuie dans l\'ordre : poisson, feuille, coquillage, soleil.',
      ],
    },
    {
      id: 'f_exit', area: 'bureau', obj: 'La porte est scellée : trouve une autre sortie !', done: () => f(g, 'slid'), need: () => f(g, 'office_open'),
      hints: [
        'Un toboggan « fermé pour travaux » part justement du mur est de ce bureau…',
        'Dans la bibliothèque du mur est, un seul livre n\'a jamais été ouvert.',
        'Tire le livre turquoise « Comment rendre ses clients heureux », puis plonge dans le toboggan.',
      ],
    },
    {
      id: 'f_pier', area: 'bureau', obj: 'Cours jusqu\'au ponton et ouvre la grille avec la clé du bateau !', done: () => f(g, 'escaped'),
      hints: ['Le ponton est au sud de l\'île, au bout de l\'allée.', 'La clé du bateau ouvre le cadenas en forme d\'ancre de la grille.', 'Va à la grille du ponton et appuie sur E.'],
    },
  ];
}

export class Story {
  constructor(game) {
    this.game = game;
    this.areas = AREAS;
    this.applyFns = [];
    this.steps = steps(game);
    this.homardModel = () => makeLobster(1);
    this.t = 0;
  }

  onApply(fn) { this.applyFns.push(fn); }

  // push saved state into the world (doors, picked items, solved devices)
  apply() {
    for (const fn of this.applyFns) { try { fn(); } catch (e) { console.warn('apply', e); } }
    const g = this.game;
    this.refreshStars();
    if (f(g, 'gustave')) g.gustave.join();
    const L = g.world.areas.lobby;
    L.directrice.root.visible = false;
    L.marcel.root.visible = true;
    g.setTimeOfDay(f(g, 'escaped') ? 'dusk' : 'day');
    this.refresh();
  }

  areaOf(step) { return step && step.area; }

  // the step the player is on: first unfinished, preferring the zone they stand in
  activeSteps() { return this.steps.filter((s) => !s.done() && (!s.need || s.need())); }

  // forHints: skip steps that have no hint ladder (e.g. before Gustave joins)
  currentStep(forHints = true) {
    const act = this.activeSteps();
    const za = this.game.zone && this.game.zone.area;
    const timed = act.find((s) => s.id === 'r_cold' || s.id === 'p_sauna_out' || s.id === 'f_safe' || s.id === 'f_exit');
    if (timed && (this.game.timers.cold || this.game.timers.sauna || this.game.timers.office)) return timed;
    const ok = (s) => !forHints || s.hints;
    return act.find((s) => s.area === za && ok(s)) || act.find(ok) || act[0] || null;
  }

  refresh() {
    const g = this.game;
    const act = this.activeSteps();
    const cur = this.currentStep(false);
    const main = act[0];
    if (main && g.state.s.flags['stepT_' + main.id] === undefined) g.state.s.flags['stepT_' + main.id] = g.state.s.time;
    if (cur && g.state.s.flags['stepT_' + cur.id] === undefined) g.state.s.flags['stepT_' + cur.id] = g.state.s.time;
    const text = cur ? cur.obj : 'Tu t\'es échappé ! Profite de tes vacances (ailleurs).';
    if (text !== this.lastObj) { this.lastObj = text; g.ui.objective(text); }
  }

  update(dt) {
    this.t += dt;
    if (this.t > 1) { this.t = 0; if (this.game.mode === 'play' || this.game.mode === 'inspect') this.refresh(); }
  }

  enterArea(area) {
    const s = this.game.state.s;
    if (!area || !this.game.state.flag('intro_done')) return;
    if (s.areaStart[area] === undefined) {
      s.areaStart[area] = s.time;
      const a = AREAS.find((x) => x.id === area);
      if (a) { this.game.ui.toast(`<b>${a.name}</b><br>${a.desc}`, { cls: 'teal' }); this.game.audio.sfx('jingle_area', 0.4); }
    }
    this.refresh();
  }

  completeArea(id) {
    const g = this.game;
    const s = g.state.s;
    if (s.areaDone[id]) return;
    const start = s.areaStart[id] ?? s.time;
    s.areaDone[id] = { time: s.time - start };
    const a = AREAS.find((x) => x.id === id);
    const hints = s.areaHints[id] || 0;
    const medal = hints === 0 ? 'or' : hints <= 2 ? 'argent' : 'bronze';
    s.stamps.push(id);
    g.audio.sfx('jingle_win', 0.5);
    g.ui.toast(`<b>Tampon « ${a.name} »</b> ajouté au carnet !<br>Médaille d'${medal} · ${fmt(s.areaDone[id].time)}`, { icon: g.icons.stamps[id], cls: 'gold' });
    g.save();
  }

  checkGarden() { if (f(this.game, 'star2') && f(this.game, 'got_key_spa')) this.completeArea('jardins'); }

  starCount() { return [1, 2, 3, 4, 5].filter((n) => f(this.game, 'star' + n)).length; }

  refreshStars() {
    const H = this.game.world.hotel;
    H.signStars.forEach((s, i) => { s.visible = f(this.game, 'star' + (i + 1)); });
  }

  gotStar(n) {
    const g = this.game;
    this.refreshStars();
    g.audio.sfx('jingle_win', 0.6);
    const star = g.world.hotel.signStars[n - 1];
    g.fx.sparkle(star.getWorldPosition(new THREE.Vector3()), 0xffe066, 30);
    g.ui.toast(`<b>Étoile d'or ${this.starCount()}/5</b> — elle se rallume sur l'enseigne de l'hôtel !`, { icon: g.icons.items.star, cls: 'gold' });
    if (n <= 4 && this.starCount() === 1 && f(g, 'gustave')) setTimeout(() => g.say([{ who: 'gustave', text: 'Une étoile d\'or ! Regarde ce que dit la lettre de Dupont : il en faut quatre pour ouvrir le bureau de la directrice.' }]), 600);
  }

  showRecipe() {
    const g = this.game;
    const have = [1, 2, 3].filter((n) => f(g, 'recipe' + n));
    const parts = {
      1: '<b>BOUILLABAISSE DE LA DIRECTRICE</b>\n(recette ultra-secrète)\n\n1. D\'abord l\'<b>oignon</b>, celui qui fait pleurer.',
      2: '2. Puis la <b>tomate</b> du potager.\n3. Ensuite le <b>rouget</b> de la chambre froide.',
      3: '4. Enfin la <b>sardine</b> de Jean-Michel.\n\n…et <b>remuer trois fois</b> à la louche.\nNe JAMAIS changer l\'ordre !',
    };
    const html = [1, 2, 3].map((n) => (have.includes(n) ? parts[n] : '<span class="faded">[ morceau manquant ]</span>')).join('\n\n');
    if (have.length === 3) g.state.clue('Recette : oignon, tomate, rouget, sardine, puis remuer 3 fois.');
    g.ui.note(`Recette (${have.length}/3 morceaux)`, html);
  }

  canReach(s) {
    const g = this.game;
    const [x, y, z] = s;
    const inHotel = x > -24 && x < 24 && z > -40 && z < -16;
    if (!f(g, 'intro_done')) return !inHotel || (y < 2 && x > -8 && x < 8);
    if (y > 3 && x < -8 && z > -36) return true; // suite
    if (inHotel && x > -8 && x < 8) return f(g, 'suite_open');
    if (y > 3 && z < -36) return f(g, 'suite_open');
    if (!inHotel) return f(g, 'hall_open');
    if (x < -8 && y < 3) return f(g, 'spa_open') && !g.timers.sauna;
    if (x > 8 && y < 3) return f(g, 'resto_open') && !g.timers.cold;
    if (x > 8 && y > 3) return f(g, 'office_open') && !g.timers.office;
    return true;
  }

  resume() {
    const g = this.game;
    if (!f(g, 'gustave') && f(g, 'intro_done')) { g.gustave.perchAt(V(-15.4, 5.5, -14.1), Math.PI); g.gustave.pecking = true; }
    this.refresh();
    g.ui.toast('Partie reprise. Bon retour aux Mirages !', { cls: 'teal' });
  }

  // ------------------------------------------------------------------ intro
  async intro() {
    const g = this.game;
    const L = g.world.areas.lobby;
    g.setTimeOfDay('dusk');
    g.player.teleport(0, 0.4, 70, Math.PI);
    g.rig.yaw = 0;
    g.rig.follow(true);
    g.mode = 'cut';
    g.ui.hud(false);
    g.rig.mode = 'shot';
    g.rig.shot = null;
    g.rig.cam.position.set(30, 22, 100);
    g.rig.cam.lookAt(0, 3, 40);
    g.audio.playMusic('dusk', 1.5);
    await g.ui.fade(false, 1200);
    g.ui.subtitle('Toi, un ticket gagnant, et un séjour de rêve tous frais payés…', 4);
    await g.shot([12, 9, 82], [0, 2, 55], 4.5, 50);
    g.ui.subtitle('<b>Hôtel Les Mirages ★★★★★</b> — le palace le plus exclusif de l\'archipel.', 4);
    await g.shot([4, 3.2, 74], [0, 2.5, 40], 3.5, 55);
    await g.rig.glideBack(g.player, 1.2);
    g.ui.hud(true);
    g.mode = 'play';
    g.ui.objective(this.steps[0].obj);
    g.ui.toast('<b>ZQSD / WASD</b> pour marcher · <b>Maj</b> pour courir · <b>souris</b> pour regarder (clic pour verrouiller)', { cls: 'teal' });
    // the welcome scene triggers when the player walks into the hall
    await new Promise((res) => {
      const f2 = () => {
        const p = g.player.position;
        if (p.z < -18 && p.x > -8 && p.x < 8 && g.mode === 'play') { g.updaters.splice(g.updaters.indexOf(f2), 1); res(); }
      };
      g.updaters.push(f2);
    });
    await g.cut(async () => {
      const dir = L.directrice;
      dir.root.visible = true;
      dir.root.position.set(0, 0.35, -38.3);
      dir.root.rotation.y = 0;
      dir.play('idle', 0);
      await g.shot([3.2, 2.3, -31.5], [0, 1.6, -37.5], 1.2, 45);
      g.audio.sfx('bell', 0.6);
      await g.say([
        { who: 'directrice', text: 'Ah ! Notre grand gagnant ! Bienvenue à l\'Hôtel Les Mirages. Je suis Véronique Pincevent, la directrice.' },
        { who: 'player', text: 'Merci ! C\'est magnifique ici. Mais… il n\'y a personne ?' },
        { who: 'directrice', text: 'Les autres clients sont… très attachés à leurs chambres. Voici votre bracelet <b>« tout compris »</b>. Il ouvre les casiers du spa.' },
      ]);
      g.give('bracelet', 1, { text: '<b>Bracelet « tout compris »</b> — il ouvre les casiers du spa' });
      dir.play('emote-yes', 0.2, true);
      await g.say([
        { who: 'directrice', text: 'Votre suite est la numéro 7, à l\'étage. Le petit-déjeuner est servi de 7 h 00 à 7 h 01. Ne soyez pas en retard.' },
        { who: 'player', text: 'Et je repars quand, exactement ? Le billet ne dit rien…' },
        { who: 'directrice', text: 'Votre séjour est à <b>durée indéterminée</b>. C\'est inclus dans le « tout compris ». Bonne nuit !' },
        { who: 'player', text: 'Ha ha… Elle plaisante, non ?' },
      ]);
      g.audio.sfx('hit_drama', 0.5);
      await g.ui.fade(true, 1600);
      dir.root.visible = false;
      g.ui.subtitle('<b>Le lendemain matin…</b>', 3.5);
      g.audio.playMusic(null, 0.5);
      await g.wait(2.6);
      // morning in Suite 7, locked in
      g.setFlag('intro_done');
      g.story.apply();
      g.doors.main_l.setOpen(false, true);
      g.doors.main_r.setOpen(false, true);
      g.player.teleport(-11.6, 4.6, -25.4, Math.PI / 2 + Math.PI);
      g.rig.yaw = -Math.PI / 2 + Math.PI;
      g.rig.pitch = 0.25;
      g.rig.follow(true);
      g.gustave.perchAt(V(-15.4, 5.5, -14.1), Math.PI);
      g.gustave.pecking = true;
      g.audio.sfx('bell', 0.4, 0.8);
      await g.ui.fade(false, 1400);
      g.player.gesture('emote-no', 1.4);
      await g.say([
        { who: 'speaker', name: 'Mme Pincevent (haut-parleur)', text: 'Bonjour, cher client ! Petit rappel du <b>règlement intérieur</b>, article 2 : il est interdit de quitter l\'hôtel avant la fin de votre séjour.' },
        { who: 'speaker', name: 'Mme Pincevent (haut-parleur)', text: 'Article 3 : la fin de votre séjour est fixée par moi. Pour votre confort, votre porte a été verrouillée. Excellente journée aux Mirages !' },
        { who: 'player', text: 'Quoi ?! Elle m\'a enfermé ! Il faut que je sorte d\'ici… et de cette île.' },
      ]);
      g.audio.sfx('glass_tap', 0.6);
      g.ui.subtitle('<b>Toc toc toc</b> — quelque chose tape contre la porte-fenêtre du balcon.', 3.5);
    });
    g.audio.musicName = null;
    g.zone = undefined;
    g.save();
    this.refresh();
  }

  // ------------------------------------------------------------------ ending
  async ending() {
    const g = this.game;
    const E = g.world.areas.exterior;
    const L = g.world.areas.lobby;
    await g.cut(async () => {
      g.audio.sfx('keys', 0.8);
      g.audio.sfx('metal_latch', 0.8);
      E.pierGate.forEach((d) => d.setOpen(true));
      g.setTimeOfDay('dusk');
      await g.wait(0.6);
      const dir = L.directrice;
      dir.root.visible = true;
      dir.root.position.set(-1.2, 0.12, 36.5);
      dir.root.rotation.y = Math.PI;
      dir.play('sprint', 0.1);
      const marcel = L.marcel;
      marcel.root.position.set(1.4, 0.12, 34.5);
      marcel.root.rotation.y = Math.PI;
      marcel.play('walk', 0.1);
      await g.shot([5, 2.6, 52], [0, 1.2, 42], 1.4, 50);
      let k = 0;
      await new Promise((res) => {
        const f2 = (dt) => { k += dt; dir.root.position.z = 36.5 + Math.min(1, k / 1.5) * 7; marcel.root.position.z = 34.5 + Math.min(1, k / 2) * 6; if (k > 2) { g.updaters.splice(g.updaters.indexOf(f2), 1); res(); } };
        g.updaters.push(f2);
      });
      dir.play('idle', 0.2);
      marcel.play('idle', 0.2);
      g.player.teleport(0, 0.4, 49.5, 0);
      await g.say([
        { who: 'directrice', text: 'ARRÊTEZ ! Vous ne pouvez pas partir ! Qui va me laisser un avis cinq étoiles, hein ? QUI ?' },
        { who: 'player', text: 'Madame, on ne garde pas ses clients prisonniers pour avoir des étoiles.' },
        { who: 'directrice', text: 'Mais… j\'ai tout fait ! Le spa ! Le homard qui chante ! Le petit-déjeuner d\'une minute !' },
        { who: 'marcel', text: '*bâille* Madame… je crois que j\'ai dormi trente ans. Et je crois que je démissionne.' },
        { who: 'gustave', text: 'Et moi, je retourne à la vie sauvage. Enfin, à la vie sauvage avec des biscuits. Allez, on file !' },
      ]);
      // board the boat and sail away
      const boat = E.boat;
      g.player.root.visible = false;
      g.gustave.obj.visible = false;
      g.audio.sfx('whoosh', 0.8, 0.6);
      g.audio.playMusic('victory', 1.0);
      const pl = g.player;
      pl.kinematic = true;
      const seat = new THREE.Object3D();
      seat.position.set(0, 1.0, -0.6);
      boat.add(seat);
      pl.root.visible = true;
      boat.add(pl.root);
      pl.root.position.set(0, 0.55, -0.3);
      pl.model.rotation.y = 0;
      pl.play('drive', 0.1);
      g.gustave.state = 'off';
      g.gustave.obj.visible = true;
      boat.add(g.gustave.obj);
      g.gustave.obj.position.set(0.5, 1.6, -0.6);
      g.gustave.obj.rotation.set(0, 0, 0);
      let t = 0;
      const z0 = boat.position.z;
      const sail = (dt) => {
        t += dt;
        boat.position.z = z0 + t * t * 1.4;
        boat.position.x = 4.6 + Math.sin(t * 0.3) * 2;
        boat.rotation.y = Math.sin(t * 0.3) * 0.15;
        if (t > 3) g.fx.spawn(boat.position.clone().add(V(0, 0.2, -3.2)), V((Math.random() - 0.5) * 2, 1, -1), { life: 0.8, g: -6, s0: 0.12, s1: 0.04, color: 0xffffff });
      };
      g.updaters.push(sail);
      await g.shot([12, 4, 64], [4.6, 0.5, 70], 2.0, 50);
      await g.say([{ who: 'gustave', text: 'Adieu, les Mirages ! Prochain arrêt : un hôtel où on te laisse partir. Et où les biscuits sont à volonté !' }]);
      await g.shot([0, 10, 40], [4, 0, 95], 4, 50);
      await g.wait(2);
      g.updaters.splice(g.updaters.indexOf(sail), 1);
      g.setFlag('escaped');
      this.completeArea('bureau');
      await g.ui.fade(true, 1500);
      this.showEnd();
    });
  }

  showEnd() {
    const g = this.game;
    const s = g.state.s;
    const medals = AREAS.map((a) => { const h = s.areaHints[a.id] || 0; return s.areaDone[a.id] ? (h === 0 ? '🥇' : h <= 2 ? '🥈' : '🥉') : '—'; });
    const rank = s.hints === 0 ? 'Évadé légendaire' : s.hints <= 6 ? 'Grand évadé' : s.hints <= 15 ? 'Touriste malin' : 'Ami des perroquets';
    document.getElementById('end-body').innerHTML = `
      <h1>Évadé des Mirages !</h1>
      <p class="sub">Tu as échappé à Mme Pincevent, à son Grand Ménage et à son petit-déjeuner d'une minute.</p>
      <div class="stats">
        <div class="stat"><span>Temps</span>${fmt(s.time)}</div>
        <div class="stat"><span>Indices de Gustave</span>${s.hints}</div>
        <div class="stat"><span>Canards dorés</span>${s.ducks.length}/10</div>
        <div class="stat"><span>Évanouissements</span>${s.deaths}</div>
        <div class="stat"><span>Rang</span>${rank}</div>
      </div>
      <p>${AREAS.map((a, i) => `${medals[i]} ${a.name}`).join(' &nbsp;·&nbsp; ')}</p>
      <p><b>Toutes les tenues du vestiaire sont débloquées !</b></p>
      <p class="sub">Votre avis compte ! Notez votre séjour : <span id="review" style="font-size:30px;cursor:pointer">☆☆☆☆☆</span></p>
      <p style="font-size:13px;opacity:.75">Escape Holidays — modèles 3D CC0 Kenney · three.js · musique originale · un jeu de l'Hôtel Les Mirages</p>`;
    const rv = document.getElementById('review');
    rv.addEventListener('click', () => { rv.textContent = '★☆☆☆☆'; g.audio.sfx('jingle_funny', 0.6); g.ui.toast('Une étoile. La directrice pleure dans son peignoir V.P.', { cls: 'coral' }); });
    g.ui.menu('end-menu', [
      { label: 'Nouvelle partie', fn: () => { State_clear(); sessionStorage.setItem('eh_autostart', 'new'); location.reload(); } },
      { label: 'Menu principal', cls: 'alt', fn: () => { sessionStorage.removeItem('eh_autostart'); location.reload(); } },
    ]);
    g.mode = 'end';
    g.ui.screen('screen-end', true);
    g.ui.hud(false);
    g.audio.sfx('jingle_win', 0.8);
    g.fx.confetti(g.rig.cam.position.clone().add(V(0, -1, -3)), 120);
  }
}

function State_clear() { try { localStorage.removeItem('eh_save_v1'); } catch (e) { /* ignore */ } }
