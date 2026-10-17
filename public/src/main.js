// Escape Holidays — Hôtel Les Mirages. Game core: boot, loop, modes (title / play / inspect / cutscene), menus, saves.
import * as THREE from 'three';
import { Renderer } from './engine/renderer.js';
import { CameraRig } from './engine/camera.js';
import { Input } from './engine/input.js';
import { Physics } from './engine/physics.js';
import { Player } from './engine/player.js';
import { Audio } from './engine/audio.js';
import { UI } from './engine/ui.js';
import * as Assets from './engine/assets.js';
import { Interactables, Clicker } from './game/interact.js';
import { State, SKINS } from './game/state.js';
import { ITEMS } from './game/items.js';
import { makeIcons } from './game/icons.js';
import { FX } from './game/fx.js';
import { buildWorld, MODELS } from './game/world.js';
import { Story } from './game/story.js';
import { Gustave } from './game/npc.js';

const V = (a) => (a instanceof THREE.Vector3 ? a.clone() : new THREE.Vector3(...a));
const $ = (id) => document.getElementById(id);

const SFX = [
  'bell', 'bong', 'book_close', 'book_flip', 'book_open', 'click', 'cloth', 'confirm', 'creak1', 'creak2', 'door_close1', 'door_close2',
  'door_open1', 'door_open2', 'drop', 'error', 'glass_tap', 'hit_drama', 'jingle_area', 'jingle_duck', 'jingle_fail', 'jingle_funny',
  'jingle_item', 'jingle_solve', 'jingle_win', 'keys', 'knock', 'metal_click', 'metal_latch', 'metal_tap', 'pickup', 'plank', 'plop', 'pop',
  'pot', 'scratch', 'select', 'soft', 'sparkle', 'success', 'switch', 'tick', 'tin', 'toggle', 'ui_close', 'ui_open', 'whoosh',
  ...['carpet', 'concrete', 'grass', 'wood'].flatMap((s) => [0, 1, 2, 3, 4].map((i) => `step_${s}_${i}`)),
];

// lighting moods (blended when moving between zones / times of day)
export const MOODS = {
  day: { sky: [0x4fb8ee, 0xbdeeff], fog: 0xcdeefa, fogNear: 90, fogFar: 330, sun: 0xfff1d8, sunI: 2.5, hemiS: 0xeaf6ff, hemiG: 0xd6b48c, hemiI: 1.15, sat: 1.12, tint: [1.03, 1.0, 0.96] },
  dusk: { sky: [0x37427e, 0xff9e6e], fog: 0xf0a585, fogNear: 70, fogFar: 280, sun: 0xffa868, sunI: 1.9, hemiS: 0xffc9a8, hemiG: 0x5b4b7c, hemiI: 0.95, sat: 1.18, tint: [1.06, 0.97, 0.93] },
  inside: { sunI: 0.6, hemiI: 1.45, hemiS: 0xfff6ec, hemiG: 0xeadfd6 },
};

class Game {
  constructor() {
    this.container = $('app');
    this.quality = localStorage.getItem('eh_quality') || 'high';
    this.renderer = new Renderer(this.container, this.quality);
    this.scene = new THREE.Scene();
    this.rig = new CameraRig(this);
    this.renderer.onResize = (w, h) => this.rig.resize(w, h);
    this.rig.resize(window.innerWidth, window.innerHeight);
    this.input = new Input(this.renderer.r.domElement);
    this.physics = new Physics();
    this.audio = new Audio();
    this.ui = new UI(this);
    this.state = new State();
    this.interact = new Interactables(this);
    this.clicker = new Clicker(this);
    this.doors = {};
    this.updaters = [];
    this.lamps = [];
    this.zones = [];
    this.surfaces = [];
    this.timers = {};
    this.newItems = new Set();
    this.mode = 'loading';
    this.paused = false;
    this.t = 0;
    this.clock = new THREE.Clock();
    this.saveT = 0;
    this.lightT = 0;
    this.tod = 'day';
    this.moodK = { inside: 0 };
    try { const o = JSON.parse(localStorage.getItem('eh_opts') || 'null'); if (o) { this.rig.sens = o.sens ?? this.rig.sens; this.rig.invertY = !!o.invertY; } } catch (e) { /* ignore */ }
    this.setupLights();
    this.setupInput();
    this.loop = this.loop.bind(this);
    window.game = this; // handy for debugging / tests
  }

  // ------------------------------------------------------------------ lighting & sky
  setupLights() {
    this.hemi = new THREE.HemisphereLight(0xeaf6ff, 0xd6b48c, 1.15);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff1d8, 2.5);
    this.sun.castShadow = true;
    const s = this.sun.shadow;
    s.mapSize.set(2048, 2048);
    s.camera.left = -30; s.camera.right = 30; s.camera.top = 30; s.camera.bottom = -30;
    s.camera.near = 1; s.camera.far = 160;
    s.bias = -0.0005;
    s.normalBias = 0.035;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
    this.sunDir = new THREE.Vector3(-0.42, 1, 0.62).normalize();
    // pooled point lights: the nearest lamps of the world get them (constant count = no shader recompiles)
    this.pool = [];
    for (let i = 0; i < 4; i++) {
      const l = new THREE.PointLight(0xffd9a0, 0, 10, 1.4);
      this.scene.add(l);
      this.pool.push(l);
    }
    this.scene.fog = new THREE.Fog(0xcdeefa, 60, 230);
    // sky dome
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(0x4fb8ee) }, bottom: { value: new THREE.Color(0xbdeeff) }, sunDir: { value: this.sunDir }, sunCol: { value: new THREE.Color(0xfff6d0) } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); vec4 p = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w * 0.99999; }',
      fragmentShader: `uniform vec3 top; uniform vec3 bottom; uniform vec3 sunDir; uniform vec3 sunCol; varying vec3 vP;
        void main(){ float h = clamp(vP.y * 1.6 + 0.08, 0.0, 1.0); vec3 c = mix(bottom, top, smoothstep(0.0, 1.0, h));
          float s = dot(normalize(vP), normalize(sunDir)); c = mix(c, sunCol, smoothstep(0.9975, 0.999, s)); c += sunCol * pow(max(s, 0.0), 24.0) * 0.25;
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(480, 32, 16), this.skyMat);
    this.sky.frustumCulled = false;
    this.sky.renderOrder = -1;
    this.scene.add(this.sky);
  }

  setTimeOfDay(tod) {
    this.tod = tod;
    this.sunDir.copy(tod === 'dusk' ? new THREE.Vector3(-0.85, 0.32, 0.55) : new THREE.Vector3(-0.42, 1, 0.62)).normalize();
    this.applyMood(1);
  }

  applyMood(k = 0.05) {
    const m = MOODS[this.tod];
    const ins = this.moodK.inside;
    const lerpC = (obj, hex) => obj.lerp(new THREE.Color(hex), k);
    lerpC(this.skyMat.uniforms.top.value, m.sky[0]);
    lerpC(this.skyMat.uniforms.bottom.value, m.sky[1]);
    lerpC(this.scene.fog.color, m.fog);
    this.scene.fog.near = m.fogNear;
    this.scene.fog.far = m.fogFar;
    lerpC(this.sun.color, m.sun);
    lerpC(this.hemi.color, new THREE.Color(m.hemiS).lerp(new THREE.Color(MOODS.inside.hemiS), ins).getHex());
    lerpC(this.hemi.groundColor, new THREE.Color(m.hemiG).lerp(new THREE.Color(MOODS.inside.hemiG), ins).getHex());
    const sunI = THREE.MathUtils.lerp(m.sunI, MOODS.inside.sunI, ins);
    const hemiI = THREE.MathUtils.lerp(m.hemiI, MOODS.inside.hemiI, ins);
    this.sun.intensity += (sunI - this.sun.intensity) * k;
    this.hemi.intensity += (hemiI - this.hemi.intensity) * k;
    const u = this.renderer.post.uniforms;
    u.sat.value += (m.sat - u.sat.value) * k;
    u.tint.value.lerp(new THREE.Vector3(...m.tint), k);
  }

  updateLights(dt) {
    const p = this.player ? this.player.position : this.rig.cam.position;
    // sun shadow camera follows the player (snapped to texels to avoid shimmering)
    const c = this.rig.mode === 'shot' ? this.rig.cam.position : p;
    const snap = 60 / 2048;
    const cx = Math.round(c.x / snap) * snap;
    const cz = Math.round(c.z / snap) * snap;
    this.sun.target.position.set(cx, 0, cz);
    this.sun.position.set(cx, 0, cz).addScaledVector(this.sunDir, 80);
    this.sky.position.copy(this.rig.cam.position);
    // zone (inside / outside) blending
    const z = this.zoneAt(p);
    const insideTarget = z && z.inside ? 1 : 0;
    this.moodK.inside += (insideTarget - this.moodK.inside) * (1 - Math.exp(-dt * 3));
    this.applyMood(1 - Math.exp(-dt * 3));
    if (z !== this.zone) this.enterZone(z);
    // point light pool
    this.lightT -= dt;
    if (this.lightT <= 0) {
      this.lightT = 0.25;
      const cam = this.rig.cam.position;
      const cand = this.lamps.filter((l) => (!l.on || l.on()) && Math.abs(l.pos.y - cam.y) < 7).map((l) => ({ l, d: l.pos.distanceToSquared(cam) })).sort((a, b) => a.d - b.d);
      this.pool.forEach((pl, i) => {
        const e = cand[i];
        pl.userData.want = e && e.d < 26 * 26 ? e.l : null;
        if (pl.userData.want) { pl.position.copy(e.l.pos); pl.color.set(e.l.color ?? 0xffd9a0); pl.distance = e.l.range ?? 10; }
      });
    }
    for (const pl of this.pool) {
      const target = pl.userData.want ? (pl.userData.want.intensity ?? 6) * 0.75 * (pl.userData.want.flicker ? 0.85 + Math.sin(this.t * 13 + pl.id) * 0.1 : 1) : 0;
      pl.intensity += (target - pl.intensity) * (1 - Math.exp(-dt * 8));
    }
  }

  zoneAt(p) {
    for (const z of this.zones) {
      const b = z.box;
      if (p.x >= b[0] && p.x <= b[3] && p.y >= b[1] - 0.5 && p.y <= b[4] && p.z >= b[2] && p.z <= b[5]) return z;
    }
    return null;
  }

  enterZone(z) {
    const prev = this.zone;
    this.zone = z;
    if (this.mode !== 'play' && this.mode !== 'inspect') return;
    if (z && z.music) this.audio.playMusic(this.timerActive() ? 'chrono' : z.music, 2.2, z.musicVol ?? 1);
    if (z && z.area && this.story) this.story.enterArea(z.area, prev && prev.area);
    if (z && z.enter) z.enter(this, prev);
  }

  // ------------------------------------------------------------------ input
  setupInput() {
    this.input.on('key', (k) => {
      if (this.mode === 'loading') return;
      if (k === 'Escape') return this.onEscape();
      if (this.mode === 'title') return;
      if (this.ui.dialogOpen) { if (k === 'KeyE' || k === 'Space' || k === 'Enter') this.ui.advance(); return; }
      if (this.ui.noteOpen) { if (k === 'KeyE' || k === 'Space' || k === 'Enter') this.ui.closeNote(); return; }
      if (k === 'KeyJ') return this.toggleJournal();
      if (k === 'KeyP') return this.pause(!this.paused);
      if (this.paused || this.ui.anyScreen()) return;
      if (k === 'KeyH') return this.hint();
      if (k === 'KeyL' && this.lamp) return this.lamp.toggle();
      if (this.mode === 'play' && (k === 'KeyE' || k === 'Enter')) this.interact.use();
    });
    this.input.on('mousedown', (e) => {
      if (this.mode !== 'play' || this.ui.dialogOpen || this.ui.noteOpen || this.paused) return;
      if (e.button === 0) this.input.lock();
    });
    this.input.on('lock', (on) => this.ui.crosshair(on || this.mode === 'play'));
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.mode === 'play' && !this.paused) this.pause(true); });
  }

  onEscape() {
    if (this.ui.noteOpen) return this.ui.closeNote();
    if (this.ui.dialogOpen) return;
    if (this.mode === 'inspect') return this.exitInspect();
    const open = ['screen-journal', 'screen-wardrobe', 'screen-options'].some((s) => !$(s).classList.contains('hidden'));
    if (open) return this.ui.closeScreens();
    if (this.mode === 'play') return this.pause(!this.paused);
  }

  onScreenChange() {
    const any = this.ui.anyScreen();
    if (any) this.input.unlock();
  }

  // ------------------------------------------------------------------ boot
  async boot() {
    this.ui.loading(0.02, 'Préparation des valises…');
    await Promise.all(['400 40px Bebas', '400 40px Pacifico', '400 40px Poppins', '600 40px Poppins', '700 40px Poppins', '800 40px Poppins'].map((f) => document.fonts.load(f).catch(() => null)));
    await Assets.loadCatalog();
    const chars = SKINS.map((s) => 'mini-characters/' + s);
    const all = [...new Set([...MODELS, ...chars])];
    await Assets.warm(all.slice(0, 1));
    let done = 0;
    await Promise.all(all.map((n) => Assets.warm([n]).then(() => { done++; this.ui.loading(0.05 + 0.65 * (done / all.length), 'Chargement de l\'hôtel… ' + Math.round(100 * done / all.length) + '%'); })));
    this.ui.loading(0.72, 'Peinture des murs…');
    await new Promise((r) => setTimeout(r, 20));
    this.fx = new FX(this);
    this.player = new Player(this, this.state.s.skin);
    this.scene.add(this.player.root);
    this.story = new Story(this);
    this.gustave = new Gustave(this);
    this.world = buildWorld(this);
    this.ui.loading(0.85, 'Construction des collisions…');
    await new Promise((r) => setTimeout(r, 20));
    this.scene.add(this.physics.build());
    this.ui.loading(0.92, 'Gustave répète son texte…');
    await new Promise((r) => setTimeout(r, 20));
    this.icons = makeIcons(this);
    this.ui.portraits = this.icons.portraits;
    this.renderer.r.compile(this.scene, this.rig.cam);
    // warm-up: render each area once behind the loading screen so shaders (incl. shadow passes) and
    // textures are ready before play — avoids hitches the first time a place comes into view
    this.ui.loading(0.96, 'Mise en place des transats…');
    const views = [[0, 3, 66, 0, 1, 30], [0, 2.5, -2, 0, 2, -30], [0, 2.5, -20, 0, 2, -38], [-16, 6, -18, -16, 5, -32], [-9, 2.5, -18, -20, 1, -34],
      [9, 2.5, -17, 20, 1, -34], [16, 6, -17, 16, 5, -34], [30, 4, -6, 40, 0, -20], [-30, 4, -2, -42, 0, -16], [-10, 4, 30, -40, 1, 40]];
    for (const [x, y, z, lx, ly, lz] of views) {
      this.rig.cam.position.set(x, y, z);
      this.rig.cam.lookAt(lx, ly, lz);
      this.player.teleport(x, y - 1.5, z);
      this.updateLights(0.25);
      this.renderer.render(this.scene, this.rig.cam);
      await new Promise((r) => setTimeout(r, 0));
    }
    this.ui.loading(1, 'Bienvenue !');
    this.player.teleport(...this.world.spawn.title);
    this.setTimeOfDay('day');
    this.clock.start();
    requestAnimationFrame(this.loop);
    await new Promise((r) => setTimeout(r, 250));
    this.ui.show('loading', false);
    this.showTitle();
  }

  // ------------------------------------------------------------------ menus
  showTitle() {
    this.mode = 'title';
    this.ui.hud(false);
    this.titleT = 0;
    this.rig.mode = 'title';
    const has = State.hasSave();
    this.ui.menu('title-menu', [
      has && { label: 'Continuer', sub: 'Reprendre ton évasion', fn: () => this.start(true) },
      { label: has ? 'Nouvelle partie' : 'Jouer', sub: has ? 'Efface la sauvegarde' : 'Ton séjour de rêve commence', cls: has ? 'alt' : '', fn: () => this.start(false) },
      { label: 'Vestiaire', cls: 'alt', fn: () => this.openWardrobe('screen-title') },
      { label: 'Options', cls: 'alt', fn: () => this.openOptions('screen-title') },
    ]);
    this.ui.screen('screen-title', true);
    this.audio.playMusic('lounge', 1.5, 0.9);
    const unlock = () => { this.audio.unlock(); this.audio.preload(SFX); this.audio.playMusic(null, 0); this.audio.musicName = null; this.audio.playMusic('lounge', 1.5, 0.9); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  async start(cont) {
    this.audio.unlock();
    this.audio.preload(SFX);
    if (this.started) { // the world holds puzzle state: a clean restart is a reload
      if (!cont) State.clear();
      sessionStorage.setItem('eh_autostart', cont ? 'continue' : 'new');
      location.reload();
      return;
    }
    this.started = true;
    if (cont) this.state.load();
    else { State.clear(); this.state.reset(); }
    this.ui.screen('screen-title', false);
    await this.ui.fade(true, 400);
    this.player.setSkin(this.state.s.skin);
    this.story.apply();
    this.refreshInventory();
    this.ui.hud(true);
    this.rig.follow(true);
    this.mode = 'play';
    if (cont && this.state.s.pos) {
      const p = this.state.s.pos;
      this.player.teleport(p[0], p[1] + 0.05, p[2], p[3]);
      this.rig.yaw = p[3] + Math.PI;
      this.ui.fade(false, 600);
      this.story.resume();
    } else {
      await this.story.intro();
    }
    this.zone = undefined;
  }

  pause(on) {
    if (this.mode !== 'play' && this.mode !== 'inspect') return;
    if (on === this.paused) return;
    this.paused = on;
    if (on) {
      this.input.unlock();
      this.ui.menu('pause-menu', [
        { label: 'Reprendre', fn: () => this.pause(false) },
        { label: 'Carnet de voyage', sub: 'Tampons, médailles, indices notés', cls: 'alt', fn: () => this.openJournal('screen-pause') },
        { label: 'Vestiaire', cls: 'alt', fn: () => this.openWardrobe('screen-pause') },
        { label: 'Options', cls: 'alt', fn: () => this.openOptions('screen-pause') },
        { label: 'Revenir au point sûr', sub: 'Si tu es coincé quelque part', cls: 'alt', fn: () => { this.pause(false); this.unstuck(); } },
        { label: 'Sauvegarder et quitter', cls: 'danger', fn: () => { this.save(); sessionStorage.removeItem('eh_autostart'); location.reload(); } },
      ]);
      this.ui.screen('screen-pause', true);
      this.audio.duck(true);
    } else {
      this.ui.screen('screen-pause', false);
      this.audio.duck(false);
    }
  }

  unstuck() {
    const s = this.world.safePoint(this.player.position);
    this.player.teleport(...s);
    this.rig.follow(true);
  }

  openScreen(id, from) {
    if (from) { this.ui.show(from, false); this.ui.returnTo = from; }
    this.ui.screen(id, true);
    this.audio.sfx('ui_open', 0.5);
  }

  toggleJournal() {
    if (this.mode !== 'play' && this.mode !== 'inspect') return;
    if (!$('screen-journal').classList.contains('hidden')) { this.ui.closeScreens(); if (this.journalPaused) { this.journalPaused = false; this.paused = false; } return; }
    if (this.ui.anyScreen()) return;
    this.paused = true;
    this.journalPaused = true;
    this.openJournal();
  }

  openJournal(from) {
    const s = this.state.s;
    const areas = this.story.areas;
    let html = '<div class="journal-grid">';
    for (const a of areas) {
      const done = s.areaDone[a.id];
      const hints = s.areaHints[a.id] || 0;
      const medal = !done ? '' : hints === 0 ? '🥇 Médaille d\'or' : hints <= 2 ? '🥈 Médaille d\'argent' : '🥉 Médaille de bronze';
      const seen = s.areaStart[a.id] !== undefined;
      html += `<div class="stamp ${done ? 'done' : ''}"><img src="${done ? this.icons.stamps[a.id] : this.icons.stampBlank}"><h4>${seen ? a.name : '???'}</h4>`;
      html += done ? `<p class="medal">${medal}</p><p>Temps : ${fmt(done.time)} · Indices : ${hints}</p>` : `<p>${seen ? a.desc : 'Lieu pas encore découvert'}</p>`;
      html += '</div>';
    }
    html += '</div>';
    html += `<div class="clues"><h3>Notes & indices relevés</h3>${s.clues.length ? '<ul>' + s.clues.map((c) => `<li>${c}</li>`).join('') + '</ul>' : '<p>Rien pour l\'instant. Observe tout !</p>'}</div>`;
    html += `<div class="clues"><h3>Collection</h3><p>Étoiles d'or : <b>${this.story.starCount()}/5</b> · Canards dorés : <b>${s.ducks.length}/10</b> · Biscuits : <b>${s.biscuits}</b> · Indices utilisés : <b>${s.hints}</b> · Temps : <b>${fmt(s.time)}</b></p></div>`;
    $('journal-body').innerHTML = html;
    this.openScreen('screen-journal', from);
    this.audio.sfx('book_open', 0.6);
  }

  openWardrobe(from) {
    const grid = $('wardrobe-grid');
    grid.innerHTML = '';
    const unlocked = this.state.unlockedSkins();
    SKINS.forEach((sk, i) => {
      const d = document.createElement('div');
      const locked = i >= unlocked;
      d.className = 'skin' + (locked ? ' locked' : '') + (this.state.s.skin === sk ? ' on' : '');
      d.innerHTML = `<img src="${this.icons.skins[sk]}"><div>${locked ? '🔒 ' + (i < 12 ? Math.ceil((i - 1) / 2) * 2 + ' canards' : '') : SKIN_NAMES[i]}</div>`;
      if (!locked) d.addEventListener('click', () => {
        this.state.s.skin = sk;
        this.player.setSkin(sk);
        if (this.gustave) this.gustave.reattach();
        this.audio.sfx('cloth', 0.7);
        this.state.save();
        this.openWardrobe();
      });
      grid.appendChild(d);
    });
    if (from !== undefined) this.openScreen('screen-wardrobe', from);
  }

  openOptions(from) {
    const v = this.audio.vol;
    $('options-body').innerHTML = `
      <div class="opt">Volume général <input type="range" id="o-master" min="0" max="1" step="0.05" value="${v.master}"></div>
      <div class="opt">Musique <input type="range" id="o-music" min="0" max="1" step="0.05" value="${v.music}"></div>
      <div class="opt">Effets <input type="range" id="o-sfx" min="0" max="1" step="0.05" value="${v.sfx}"></div>
      <div class="opt">Sensibilité souris <input type="range" id="o-sens" min="0.001" max="0.006" step="0.0002" value="${this.rig.sens}"></div>
      <div class="opt">Inverser l'axe vertical <input type="checkbox" id="o-inv" ${this.rig.invertY ? 'checked' : ''}></div>
      <div class="opt">Qualité graphique <select id="o-q"><option value="high">Haute</option><option value="medium">Moyenne</option><option value="low">Basse (PC modeste)</option></select></div>
      <div class="opt">Contours encrés <input type="checkbox" id="o-edge" ${this.renderer.post.uniforms.edge.value > 0 ? 'checked' : ''}></div>`;
    $('o-q').value = this.quality;
    const save = () => {
      v.master = +$('o-master').value; v.music = +$('o-music').value; v.sfx = +$('o-sfx').value;
      this.audio.saveVol();
      this.rig.sens = +$('o-sens').value;
      this.rig.invertY = $('o-inv').checked;
      this.renderer.post.uniforms.edge.value = $('o-edge').checked ? 1 : 0;
      localStorage.setItem('eh_opts', JSON.stringify({ sens: this.rig.sens, invertY: this.rig.invertY }));
      if ($('o-q').value !== this.quality) { this.quality = $('o-q').value; localStorage.setItem('eh_quality', this.quality); this.renderer.setQuality(this.quality); }
    };
    $('options-body').querySelectorAll('input,select').forEach((e) => e.addEventListener('input', save));
    this.openScreen('screen-options', from);
  }

  setFlag(k, v = true) {
    this.state.set(k, v);
    if (this.story) this.story.refresh();
    this.save();
  }

  // ------------------------------------------------------------------ inventory & rewards
  give(id, n = 1, { silent = false, text = null } = {}) {
    this.state.give(id, n);
    this.newItems.add(id);
    this.refreshInventory();
    if (!silent) {
      const it = ITEMS[id];
      this.ui.toast(text || `<b>${it.name}</b>${n > 1 ? ' ×' + n : ''} — ajouté à ton sac`, { icon: this.icons.items[id] });
      this.audio.sfx('jingle_item', 0.55);
    }
    this.save();
  }

  take(id, n = 1) {
    this.state.take(id, n);
    this.refreshInventory();
  }

  has(id, n = 1) { return this.state.has(id, n); }

  refreshInventory() {
    const items = this.state.s.order.filter((id) => ITEMS[id] && !ITEMS[id].hidden).map((id) => ({ id, name: ITEMS[id].name, count: this.state.count(id), isNew: this.newItems.has(id) }));
    this.newItems.clear();
    this.ui.inventory(items, this.icons ? this.icons.items : {});
    this.ui.counters({ biscuits: this.state.s.biscuits, ducks: this.state.s.ducks.length });
  }

  inspectItem(id) {
    const it = ITEMS[id];
    if (!it) return;
    this.audio.sfx('cloth', 0.4);
    if (it.examine) return it.examine(this);
    this.ui.note(it.name, `<img src="${this.icons.items[id]}" style="width:150px;display:block;margin:0 auto 8px">${it.desc}`);
  }

  addBiscuits(n, where) {
    this.state.s.biscuits += n;
    if (where) this.state.s.biscuitsFound.push(where);
    this.ui.counters({ biscuits: this.state.s.biscuits });
    this.ui.toast(`<b>+${n} biscuit${n > 1 ? 's' : ''}</b> pour Gustave${this.state.flag('gustave') ? '' : ' (un perroquet en raffole…)'}`, { icon: 'assets/ui/biscuit.png', cls: 'gold' });
    this.audio.sfx('pickup', 0.6, 1.1);
    this.save();
  }

  addDuck(id, pos) {
    if (this.state.s.ducks.includes(id)) return;
    const before = this.state.unlockedSkins();
    this.state.s.ducks.push(id);
    this.ui.counters({ ducks: this.state.s.ducks.length });
    this.audio.sfx('jingle_duck', 0.7);
    if (pos) this.fx.sparkle(pos, 0xffd84a, 30);
    let txt = `<b>Canard doré ${this.state.s.ducks.length}/10</b> — Coin coin !`;
    if (this.state.unlockedSkins() > before) txt += '<br>Nouvelles tenues au vestiaire !';
    this.ui.toast(txt, { icon: 'assets/ui/duck.png', cls: 'gold' });
    this.save();
  }

  // ------------------------------------------------------------------ hints (Gustave)
  async hint() {
    if (this.mode !== 'play' && this.mode !== 'inspect') return;
    if (!this.state.flag('gustave')) { this.ui.toast('Tu n\'as personne pour t\'aider… pour l\'instant.'); return; }
    const step = this.story.currentStep();
    if (!step || !step.hints) { await this.say([{ who: 'gustave', text: step && step.free ? step.free : 'Rien à signaler, cap\'taine ! Explore, il y a sûrement des canards dorés à dénicher.' }]); return; }
    const s = this.state.s;
    const lvl = s.flags['hint_' + step.id] || 0;
    if (lvl >= step.hints.length) {
      await this.say([{ who: 'gustave', text: 'Je te répète gratuitement, parce que je suis un oiseau généreux : ' + step.hints[step.hints.length - 1] }]);
      return;
    }
    const stuck = (s.time - (s.flags['stepT_' + step.id] ?? s.time)) > 480;
    if (s.biscuits <= 0) {
      if (lvl === 0 && stuck) {
        s.flags['hint_' + step.id] = 1;
        await this.say([{ who: 'gustave', text: 'Bon… tu fais tellement pitié que je te le donne à crédit. ' + step.hints[0] }]);
        this.state.clue('Gustave : ' + step.hints[0]);
        return;
      }
      await this.say([{ who: 'gustave', text: GUSTAVE_BROKE[Math.floor(Math.random() * GUSTAVE_BROKE.length)] }]);
      return;
    }
    const ok = await this.confirm(`Donner 1 biscuit à Gustave pour un indice ${['léger', 'précis', 'très précis'][lvl] || ''} ? (il t'en reste ${s.biscuits})`);
    if (!ok) return;
    s.biscuits--;
    s.hints++;
    const area = this.story.areaOf(step);
    if (area) s.areaHints[area] = (s.areaHints[area] || 0) + 1;
    s.flags['hint_' + step.id] = lvl + 1;
    this.ui.counters({ biscuits: s.biscuits });
    this.gustave.eat();
    this.audio.sfx('pop', 0.6);
    await this.say([{ who: 'gustave', text: step.hints[lvl] }]);
    this.state.clue('Gustave : ' + step.hints[lvl]);
    this.save();
  }

  confirm(text) {
    return new Promise((res) => {
      const prev = this.paused;
      this.paused = true;
      this.input.unlock();
      const done = (v) => { $('screen-pause').querySelector('h2').textContent = 'Pause'; this.ui.screen('screen-pause', false); this.paused = prev; res(v); };
      this.ui.menu('pause-menu', [
        { label: 'Oui', fn: () => done(true) },
        { label: 'Non', cls: 'alt', fn: () => done(false) },
      ]);
      $('screen-pause').querySelector('h2').textContent = 'Gustave';
      const p = document.createElement('p');
      p.className = 'sub';
      p.textContent = text;
      $('pause-menu').prepend(p);
      this.ui.screen('screen-pause', true);
    });
  }

  // ------------------------------------------------------------------ dialogue & cutscenes
  async say(lines) {
    const prevMode = this.mode;
    this.input.unlock();
    await this.ui.dialog(lines.map((l) => ({ ...l, name: l.name || NAMES[l.who] || l.who, portrait: l.who === 'player' ? 'skin:' + this.state.s.skin : l.who })));
    if (this.mode === prevMode && this.mode === 'play') this.ui.crosshair(true);
  }

  // run an async cutscene: freezes player and hides the prompt
  async cut(fn) {
    const prev = this.mode === 'inspect' ? 'play' : this.mode;
    if (this.mode === 'inspect') this.exitInspect(true);
    this.mode = 'cut';
    this.ui.prompt(null);
    this.input.unlock();
    try { await fn(); } catch (e) { console.error(e); }
    if (this.mode === 'cut') {
      if (this.rig.mode === 'shot') await this.rig.glideBack(this.player, 0.7);
      this.mode = prev === 'cut' ? 'play' : prev;
    }
  }

  wait(s) { return new Promise((r) => setTimeout(r, s * 1000)); }

  shot(pos, look, dur = 1.2, fov = null) { return this.rig.goTo(V(pos), V(look), dur, fov); }

  // ------------------------------------------------------------------ inspect mode
  async enterInspect(def) {
    const ins = typeof def.inspect === 'function' ? def.inspect(this) : def.inspect;
    if (!ins) return;
    this.mode = 'inspect';
    this.inspecting = { def, ins };
    this.input.unlock();
    this.ui.crosshair(false);
    this.ui.prompt(null);
    this.ui.inspectBar(ins.title || (typeof def.label === 'function' ? def.label() : def.label));
    this.player.root.visible = ins.hidePlayer === false;
    this.player.play('idle');
    if (ins.onEnter) ins.onEnter(this);
    await this.rig.goTo(V(ins.cam), V(ins.look), ins.dur ?? 0.8, ins.fov || 40);
    if (!this.inspecting || this.inspecting.def !== def) return;
    this.clicker.set(ins.clickables ? ins.clickables() : []);
  }

  exitInspect(instant = false) {
    if (this.mode !== 'inspect' || !this.inspecting) return;
    const { ins } = this.inspecting;
    this.inspecting = null;
    this.clicker.set([]);
    document.body.style.cursor = 'default';
    this.ui.inspectBar(null);
    this.ui.prompt(null);
    this.player.root.visible = true;
    this.mode = 'play';
    if (instant) this.rig.follow(true);
    else { this.mode = 'cut'; this.rig.glideBack(this.player, 0.55).then(() => { if (this.mode === 'cut') this.mode = 'play'; }); }
    if (ins.onExit) ins.onExit(this);
  }

  // refresh clickables of the current inspect view (after a state change)
  refreshInspect() {
    if (this.mode === 'inspect' && this.inspecting && this.inspecting.ins.clickables) this.clicker.set(this.inspecting.ins.clickables());
  }

  // ------------------------------------------------------------------ timers
  startTimer(id, label, secs, onFail) {
    this.timers[id] = { label, left: secs, total: secs, onFail };
    this.audio.playMusic('chrono', 0.8);
    this.audio.sfx('hit_drama', 0.6);
  }

  stopTimer(id) {
    delete this.timers[id];
    this.ui.timer(null);
    if (!this.timerActive() && this.zone && this.zone.music) { this.audio.musicName = null; this.audio.playMusic(this.zone.music, 1.5, this.zone.musicVol ?? 1); }
  }

  timerActive() { return Object.keys(this.timers).length > 0; }

  updateTimers(dt) {
    for (const [id, t] of Object.entries(this.timers)) {
      const before = Math.ceil(t.left);
      t.left -= dt;
      this.ui.timer(t.label, t.left);
      if (t.left < 10 && Math.ceil(t.left) !== before) this.audio.sfx('tick', 0.6, 1.3);
      if (t.left <= 0) {
        this.stopTimer(id);
        if (t.onFail) t.onFail();
      }
    }
  }

  // ------------------------------------------------------------------ sounds
  surfaceAt(p) {
    for (let i = this.surfaces.length - 1; i >= 0; i--) {
      const s = this.surfaces[i];
      if (p.x >= s.x0 && p.x <= s.x1 && p.z >= s.z0 && p.z <= s.z1 && p.y >= (s.y0 ?? -9) && p.y <= (s.y1 ?? 99)) return s.type;
    }
    return 'concrete';
  }

  footstep(p) {
    const type = this.surfaceAt(p);
    const vol = { carpet: 0.32, concrete: 0.26, grass: 0.3, wood: 0.3, sand: 0.3, water: 0.3 }[type] ?? 0.26;
    const name = type === 'sand' ? 'grass' : type === 'water' ? 'concrete' : type;
    this.audio.sfx(`step_${name}_${Math.floor(Math.random() * 5)}`, vol, 0.9 + Math.random() * 0.2);
    if (type === 'water') this.audio.sfx('plop', 0.12, 1.4 + Math.random() * 0.3);
  }

  // ------------------------------------------------------------------ saves
  save() {
    if (!this.started) return;
    const p = this.player.position;
    if (this.mode === 'play' && this.player.onGround && !this.timerActive()) this.state.s.pos = [p.x, p.y, p.z, this.player.facing];
    this.state.save();
  }

  // ------------------------------------------------------------------ main loop
  loop() {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    this.t += dt;
    const blocked = this.paused || this.ui.dialogOpen || this.ui.noteOpen;
    if (this.mode === 'title') this.updateTitleCam(dt);
    if (!this.paused) {
      const canMove = this.mode === 'play' && !blocked;
      this.player.frozen = !canMove;
      this.input.lookEnabled = canMove;
      if (this.mode !== 'title') this.player.update(dt, this.input, this.rig.yaw);
      if (this.mode !== 'title') this.rig.update(dt, this.input, this.player);
      if (canMove) this.interact.update(dt);
      else if (this.mode === 'play') this.ui.prompt(null);
      if (this.mode === 'inspect' && !blocked) this.clicker.update();
      for (const u of this.updaters) u(dt, this.t);
      for (const d of Object.values(this.doors)) d.update(dt);
      if (this.fx) this.fx.update(dt);
      if (!blocked && (this.mode === 'play' || this.mode === 'inspect')) {
        this.updateTimers(dt);
        this.state.s.time += dt;
        this.ui.counters({ time: fmt(this.state.s.time) });
        this.saveT += dt;
        if (this.saveT > 15) { this.saveT = 0; this.save(); }
      }
      if (this.story) this.story.update(dt);
    }
    this.updateLights(dt);
    if (this.player) this.audio.updateAmbient(this.mode === 'title' ? this.rig.cam.position : this.player.position);
    this.renderer.render(this.scene, this.rig.cam);
    this.input.consumeMouse();
    this.input.endFrame();
  }

  updateTitleCam(dt) {
    this.titleT += dt;
    const shot = this.world.titleShot(this.titleT);
    this.rig.cam.position.copy(shot.pos);
    this.rig.cam.lookAt(shot.look);
  }
}

export function fmt(s) {
  s = Math.floor(s || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : `${m}:${String(ss).padStart(2, '0')}`;
}

export const NAMES = {
  player: 'Toi', gustave: 'Gustave', directrice: 'Mme Pincevent', marcel: 'Marcel', pelican: 'Jean-Michel', speaker: 'Haut-parleur', dupont: 'M. Dupont', homard: 'Le Homard Joyeux',
};

const SKIN_NAMES = ['Lola', 'Hugo', 'Inès', 'Malik', 'Jade', 'Tom', 'Rose', 'Léo', 'Nina', 'Sacha', 'Zoé', 'Noah'];

const GUSTAVE_BROKE = [
  'Pas de biscuit, pas d\'indice. C\'est la loi du marché, cocotte !',
  'Mon cerveau fonctionne au biscuit. Là, il est en grève. Fouille l\'hôtel, il y en a de cachés partout.',
  'Coco veut un biscuit… Coco n\'a PAS de biscuit. Coco boude.',
];

// ------------------------------------------------------------------ start
const game = new Game();
game.boot().then(() => {
  const auto = sessionStorage.getItem('eh_autostart');
  if (auto) { sessionStorage.removeItem('eh_autostart'); game.start(auto === 'continue'); }
}).catch((e) => {
  console.error(e);
  game.ui.loading(1, 'Oups, le chargement a échoué : ' + e.message);
});
