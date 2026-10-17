// Rhythm minigame. mode 'chant' = falling gems with lyric syllables + karaoke; mode 'danse' = rising arrows + dancing avatar.
import { G, W, H, writeSave } from '../core/state.js';
import { Audio } from '../core/audio.js';
import { need, bgAsset, musicAsset, voiceAsset, chartAsset, actorAssets } from '../core/assets.js';
import { gradeOf } from '../core/season.js';
import { Actor } from '../ui/actor.js';
import { text, button, panel, setBackground, spotlights, vignette, burst, fadeIn, fadeOut, wait, confetti, keyHint } from '../ui/ui.js';

const LANE_X = [735, 885, 1035, 1185];
const LANE_COL = ['pink', 'cyan', 'gold', 'violet'];
const LANE_TINT = [0xff5cb4, 0x31d2ff, 0xffc93c, 0x9a6bff];
const KEYS = [['D', 'LEFT', 'A'], ['F', 'DOWN', 'S'], ['J', 'UP', 'W'], ['K', 'RIGHT']];
const WIN = { perfect: 0.05, great: 0.095, good: 0.14 };
const JUDGE_TXT = { perfect: 'PARFAIT !', great: 'SUPER !', good: 'BIEN', miss: 'RATÉ' };
const JUDGE_COL = { perfect: '#ffe66d', great: '#7dffb0', good: '#8fd3ff', miss: '#ff6b81' };
const ARROW_ROT = [-90, 180, 0, 90];

export class Rhythm extends Phaser.Scene {
  constructor() { super('Rhythm'); }

  init(data) {
    this.cfg = data;
    this.mode = data.mode || 'chant';
    this.level = data.level || 'normal';
    this.started = false;
    this.ended = false;
    this.paused = false;
  }

  async create() {
    const c = this.cfg;
    this.cameras.main.setBackgroundColor('#0b0614');
    const loadingTxt = text(this, W / 2, H / 2, 'Préparation de la scène…', { size: 36, ox: 0.5, oy: 0.5, color: '#ffb3e6' });
    const bgId = c.bg || (this.mode === 'danse' ? 'danse' : 'chant');
    const assets = [bgAsset(bgId), musicAsset(c.song), chartAsset(c.song)];
    const hasVoice = this.mode === 'chant' && !c.noVoice && G.songs.find((s) => s.id === c.song && s.voice);
    if (hasVoice) assets.push(voiceAsset(c.song));
    const dancerId = c.dancer || (G.season ? 'player' : null);
    if (dancerId) assets.push(...actorAssets(dancerId, ['joie', 'sourire', 'surprise'], c.look));
    Audio.stop(this, 400);
    await need(this, assets);
    loadingTxt.destroy();
    fadeIn(this, 500);
    this.chart = this.cache.json.get('chart_' + c.song);
    const src = this.mode === 'danse' ? this.chart.dance[this.level] : this.chart.notes[this.level];
    this.endTime = Math.min(this.chart.duration + 0.5, c.excerpt || 9999);
    this.notes = src.filter((n) => n[0] < this.endTime - 0.2).map((n, i) => ({
      t: n[0], lane: n[1], hold: this.mode === 'chant' ? n[2] : 0, syl: n[3] || '', li: n[4], i, state: 0, obj: null,
    }));
    this.totalWeight = this.notes.reduce((a, n) => a + 1 + (n.hold ? 1 : 0), 0);
    this.next = 0;
    this.stats = { perfect: 0, great: 0, good: 0, miss: 0, score: 0, combo: 0, maxCombo: 0, weight: 0 };
    this.holding = [null, null, null, null];
    this.approach = 1.55 / (G.settings.scroll || 1);
    this.beat = 60 / this.chart.bpm;

    this.buildStage(bgId);
    this.buildHighway();
    this.buildHud();
    if (dancerId) this.buildDancer(dancerId);
    if (this.mode === 'chant') this.buildLyrics();
    this.bindInput();

    this.music = this.sound.add('mus_' + c.song, { volume: G.settings.music });
    if (hasVoice) this.voice = this.sound.add('voc_' + c.song, { volume: G.settings.voice });
    if (c.tutorial) await this.tutorial();
    this.start();
  }

  buildStage(bgId) {
    const ctx = this.cfg.context;
    this.bg = setBackground(this, bgId, { dim: true });
    this.bg.setAlpha(0.85);
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b0614, ctx === 'prime' ? 0.25 : 0.45);
    if (ctx === 'prime' || ctx === 'audition' || ctx === 'mp') {
      this.beams = spotlights(this, 5, 2);
      this.crowd = [this.add.image(W / 2, H + 40, 'crowd0').setOrigin(0.5, 1).setDepth(60).setAlpha(0.95),
        this.add.image(W / 2, H + 40, 'crowd1').setOrigin(0.5, 1).setDepth(60).setAlpha(0)];
    }
    vignette(this, 3, 0.9);
    this.flashRect = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0).setDepth(90).setBlendMode('ADD');
  }

  buildHighway() {
    const top = this.mode === 'danse' ? 0 : 0;
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(0x12082a, 0.72);
    g.fillRoundedRect(650, top - 20, 620, H + 40, 30);
    g.lineStyle(2, 0xffffff, 0.08);
    for (let i = 1; i < 4; i++) g.lineBetween(660 + i * 150, 0, 660 + i * 150, H);
    this.hitY = this.mode === 'danse' ? 190 : 860;
    this.spawnY = this.mode === 'danse' ? H + 90 : -80;
    g.fillStyle(0xffffff, 0.12);
    g.fillRect(650, this.hitY - 4, 620, 8);
    this.targets = LANE_X.map((x, i) => {
      let t;
      if (this.mode === 'danse') {
        t = this.add.image(x, this.hitY, 'arrow_grey').setAngle(ARROW_ROT[i]).setScale(0.95).setAlpha(0.8).setDepth(6);
      } else {
        t = this.add.image(x, this.hitY, 'ring').setTint(LANE_TINT[i]).setScale(1.0).setDepth(6);
      }
      const k = keyHint(this, x, this.mode === 'danse' ? this.hitY - 100 : this.hitY + 92, ['D', 'F', 'J', 'K'][i] + (this.mode === 'danse' ? ['  ←', '  ↓', '  ↑', '  →'][i] : ''));
      k.setDepth(6);
      const glow = this.add.image(x, this.hitY, 'glow').setTint(LANE_TINT[i]).setScale(2.2).setAlpha(0).setBlendMode('ADD').setDepth(7);
      return { img: t, glow };
    });
    this.laneFlash = LANE_X.map((x, i) => this.add.rectangle(x, H / 2, 140, H, LANE_TINT[i], 0).setDepth(4).setBlendMode('ADD'));
  }

  buildHud() {
    const c = this.cfg;
    this.add.image(1600, 120, 'panel').setDisplaySize(560, 170).setDepth(50).setAlpha(0.9);
    this.titleTxt = text(this, 1600, 80, this.chart.title, { size: 34, weight: 800, ox: 0.5, oy: 0.5 }).setDepth(51);
    this.subTxt = text(this, 1600, 122, c.subtitle || ({ easy: 'Facile', normal: 'Normal', hard: 'Difficile' }[this.level]), { size: 22, weight: 400, ox: 0.5, oy: 0.5, color: '#ffb3e6' }).setDepth(51);
    this.progBg = this.add.rectangle(1360, 168, 480, 10, 0x000000, 0.5).setOrigin(0, 0.5).setDepth(51);
    this.prog = this.add.rectangle(1360, 168, 2, 10, 0xff5cb4).setOrigin(0, 0.5).setDepth(52);
    this.scoreTxt = text(this, 1600, 270, '0', { size: 64, weight: 900, font: 'Montserrat, Poppins', ox: 0.5, oy: 0.5, stroke: '#2a0f45', strokeW: 10 }).setDepth(51);
    this.accTxt = text(this, 1600, 330, 'Précision 100 %', { size: 26, weight: 600, ox: 0.5, oy: 0.5, color: '#d9c8ff' }).setDepth(51);
    this.comboTxt = text(this, 960, this.mode === 'danse' ? 560 : 420, '', { size: 92, weight: 900, font: 'Montserrat, Poppins', ox: 0.5, oy: 0.5, color: '#ffffff', stroke: '#5a1e7a', strokeW: 12 }).setDepth(40).setAlpha(0.9);
    this.judgeTxt = text(this, 960, this.mode === 'danse' ? 330 : 700, '', { size: 56, weight: 900, font: 'Montserrat, Poppins', ox: 0.5, oy: 0.5, stroke: '#1a0b2e', strokeW: 10 }).setDepth(41);
    if (c.context === 'mp' && c.onProgress) {
      this.mpBoard = text(this, 1600, 420, '', { size: 24, weight: 600, ox: 0.5, oy: 0, align: 'center', lineSpacing: 8 }).setDepth(51);
    }
    const pauseBtn = button(this, 1840, 1030, 120, 56, '❚❚', () => this.togglePause(), { style: 'btn2', size: 26 });
    pauseBtn.setDepth(80);
  }

  buildDancer(id) {
    const look = this.cfg.look || null;
    this.dancer = new Actor(this, id, 'sourire', look);
    this.dancer.place(330);
    this.dancer.setDepth(30);
    this.dancer.setScale(this.dancer.baseScale * (this.mode === 'danse' ? 0.95 : 0.85));
    this.dancer.y = this.dancer.yBase + (this.mode === 'danse' ? 0 : 40);
    this.dancerScale = this.dancer.scale;
    this.floor = this.add.image(330, H - 30, 'floorglow').setTint(0xff5cb4).setBlendMode('ADD').setAlpha(0.6).setDepth(29).setScale(1.4, 1);
    this.dancer.groove(this.beat * 1000 * 2, this.mode === 'danse' ? 0.6 : 0.35);
  }

  buildLyrics() {
    this.lyBox = this.add.container(0, 0).setDepth(70);
    const p = this.add.nineslice(W / 2, 1010, 'panel', undefined, 1500, 120, 28, 28, 28, 28).setAlpha(0.92);
    this.lyBox.add(p);
    this.lyLine = this.add.container(W / 2, 992);
    this.lyNext = text(this, W / 2, 1042, '', { size: 24, weight: 400, ox: 0.5, oy: 0.5, color: '#a693c9' });
    this.lyBox.add([this.lyLine, this.lyNext]);
    this.lyIdx = -1;
    this.lyBox.setDepth(70);
  }

  layoutLine(li) {
    this.lyLine.removeAll(true);
    this.lySyl = [];
    const L = this.chart.lines[li];
    if (!L) return;
    const parts = [];
    let cur = 0;
    const tx = L.text;
    for (const [t, s] of L.syl) {
      const at = tx.indexOf(s, cur);
      if (at < 0) { parts.push({ t, s: s + ' ' }); continue; }
      if (parts.length && at > cur) parts[parts.length - 1].s += tx.slice(cur, at);
      parts.push({ t, s });
      cur = at + s.length;
    }
    if (parts.length) parts[parts.length - 1].s += tx.slice(cur);
    let x = 0;
    const objs = parts.map((p) => {
      const o = text(this, x, 0, p.s, { size: 40, weight: 800, oy: 0.5, color: '#ffffff', shadow: false });
      x += o.width;
      return { o, t: p.t };
    });
    objs.forEach(({ o }) => { o.x -= x / 2; this.lyLine.add(o); });
    this.lySyl = objs;
    const N = this.chart.lines[li + 1];
    this.lyNext.setText(N ? N.text : '');
  }

  bindInput() {
    this.keyMap = {};
    KEYS.forEach((ks, lane) => ks.forEach((k) => { this.keyMap[k] = lane; }));
    this.input.keyboard.on('keydown', (e) => {
      if (e.repeat) return;
      if (e.key === 'Escape') { this.togglePause(); return; }
      const k = e.key.length === 1 ? e.key.toUpperCase() : e.key.replace('Arrow', '').toUpperCase();
      if (this.keyMap[k] !== undefined) this.press(this.keyMap[k]);
    });
    this.input.keyboard.on('keyup', (e) => {
      const k = e.key.length === 1 ? e.key.toUpperCase() : e.key.replace('Arrow', '').toUpperCase();
      if (this.keyMap[k] !== undefined) this.release(this.keyMap[k]);
    });
    this.input.addPointer(3);
    this.pointerLane = {};
    const laneAt = (x) => {
      for (let i = 0; i < 4; i++) if (Math.abs(x - LANE_X[i]) <= 75) return i;
      return -1;
    };
    this.input.on('pointerdown', (p, over) => {
      if (over && over.length) return;
      const lane = laneAt(p.x);
      if (lane >= 0) {
        this.pointerLane[p.id] = lane;
        this.press(lane);
      }
    });
    this.input.on('pointerup', (p) => {
      const lane = this.pointerLane[p.id];
      if (lane !== undefined) {
        delete this.pointerLane[p.id];
        this.release(lane);
      }
    });
  }

  tutorial() {
    return new Promise((res) => {
      const c = this.add.container(W / 2, H / 2).setDepth(200);
      const bg = this.add.rectangle(0, 0, W, H, 0x000000, 0.6);
      const p = this.add.nineslice(0, 0, 'panel', undefined, 1100, 560, 28, 28, 28, 28);
      const t1 = text(this, 0, -200, this.mode === 'danse' ? 'Comment danser' : 'Comment chanter', { size: 54, weight: 900, ox: 0.5, oy: 0.5, font: 'Montserrat, Poppins' });
      const msg = this.mode === 'danse'
        ? 'Les flèches montent vers les cibles en haut.\nAppuie sur D F J K (ou ← ↓ ↑ →) au moment\noù elles les touchent. Sur mobile : touche les colonnes.'
        : 'Les notes descendent vers les cercles.\nAppuie sur D F J K au bon moment (ou touche la colonne).\nLes notes longues : garde la touche enfoncée !\nChaque note est une syllabe de la chanson.';
      const t2 = text(this, 0, -40, msg, { size: 30, weight: 400, ox: 0.5, oy: 0.5, align: 'center', lineSpacing: 12 });
      c.add([bg, p, t1, t2]);
      const b = button(this, W / 2, H / 2 + 190, 420, 90, "C'est parti !", () => { c.destroy(); b.destroy(); res(); });
      b.setDepth(201);
    });
  }

  start() {
    const lead = 2.2;
    const ctx = this.sound.context;
    this.useCtx = !!ctx;
    this.leadIn = lead;
    if (this.useCtx) this.startCtx = ctx.currentTime + lead;
    else this.startMs = performance.now() + lead * 1000;
    this.music.play({ delay: lead });
    if (this.voice) this.voice.play({ delay: lead });
    this.started = true;
    this.countdown();
  }

  async countdown() {
    for (const n of ['3', '2', '1']) {
      const t = text(this, 960, 480, n, { size: 160, weight: 900, font: 'Montserrat, Poppins', ox: 0.5, oy: 0.5, stroke: '#5a1e7a', strokeW: 14 }).setDepth(150);
      this.tweens.add({ targets: t, scale: 1.6, alpha: 0, duration: 650, onComplete: () => t.destroy() });
      await wait(this, 620);
    }
  }

  now() {
    const lat = (G.settings.latency || 0) / 1000;
    if (this.useCtx) return this.sound.context.currentTime - this.startCtx - lat;
    return (performance.now() - this.startMs) / 1000 - lat;
  }

  togglePause() {
    if (!this.started || this.ended) return;
    if (this.now() < 0.1 && !this.paused) return;
    if (!this.paused) {
      this.paused = true;
      this.pauseAt = this.now();
      this.music.pause();
      if (this.voice) this.voice.pause();
      this.pauseMenu();
    } else {
      this.paused = false;
      const resumeCtx = this.sound.context ? this.sound.context.currentTime : 0;
      if (this.useCtx) this.startCtx = resumeCtx - this.pauseAt - (G.settings.latency || 0) / 1000;
      else this.startMs = performance.now() - this.pauseAt * 1000;
      this.music.resume();
      if (this.voice) this.voice.resume();
      if (this.pauseUI) this.pauseUI.forEach((o) => o.destroy());
    }
  }

  pauseMenu() {
    const ui = [];
    ui.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65).setDepth(300));
    ui.push(text(this, W / 2, 330, 'Pause', { size: 80, weight: 900, ox: 0.5, oy: 0.5, font: 'Montserrat, Poppins' }).setDepth(301));
    ui.push(button(this, W / 2, 480, 520, 90, 'Reprendre', () => this.togglePause()).setDepth(301));
    if (this.cfg.context !== 'mp') {
      ui.push(button(this, W / 2, 590, 520, 90, 'Recommencer', () => {
        this.music.stop();
        if (this.voice) this.voice.stop();
        this.scene.restart(this.cfg);
      }, { style: 'btn2' }).setDepth(301));
    }
    if (this.cfg.context === 'lesson' || this.cfg.context === 'free') {
      ui.push(button(this, W / 2, 700, 520, 90, 'Abandonner', () => {
        this.music.stop();
        if (this.voice) this.voice.stop();
        this.finish(true);
      }, { style: 'btn_bad' }).setDepth(301));
    }
    this.pauseUI = ui;
  }

  press(lane) {
    if (!this.started || this.paused || this.ended) return;
    const t = this.now();
    const tg = this.targets[lane];
    tg.img.setScale(this.mode === 'danse' ? 0.8 : 0.85);
    this.tweens.add({ targets: tg.img, scale: this.mode === 'danse' ? 0.95 : 1, duration: 120 });
    // nearest unjudged note in lane
    let best = null;
    let bd = 9;
    for (let i = Math.max(0, this.next - 4); i < this.notes.length; i++) {
      const n = this.notes[i];
      if (n.t - t > WIN.good + 0.05) break;
      if (n.state !== 0 || n.lane !== lane) continue;
      const d = Math.abs(n.t - t);
      if (d < bd) { bd = d; best = n; }
    }
    if (!best || bd > WIN.good) return;
    const j = bd <= WIN.perfect ? 'perfect' : bd <= WIN.great ? 'great' : 'good';
    this.judge(best, j);
    if (best.hold) {
      best.state = 2;
      this.holding[lane] = best;
    } else {
      best.state = 1;
      this.killNote(best, true);
    }
  }

  release(lane) {
    const n = this.holding[lane];
    if (!n) return;
    this.holding[lane] = null;
    const t = this.now();
    const end = n.t + n.hold;
    if (end - t <= 0.14) this.holdDone(n, true);
    else this.holdDone(n, false);
  }

  holdDone(n, ok) {
    n.state = 1;
    if (ok) {
      this.stats.weight += 1;
      this.stats.score += 300 * this.mult();
      burst(this, LANE_X[n.lane], this.hitY, LANE_TINT[n.lane], 10);
    } else {
      this.showJudge('miss', 'LÂCHÉ');
      this.breakCombo();
    }
    this.killNote(n, ok);
  }

  mult() {
    return 1 + Math.min(3, Math.floor(this.stats.combo / 15) * 0.5);
  }

  judge(n, j) {
    const s = this.stats;
    s[j]++;
    const w = { perfect: 1, great: 0.8, good: 0.5 }[j];
    s.weight += w;
    s.combo++;
    s.maxCombo = Math.max(s.maxCombo, s.combo);
    s.score += Math.round({ perfect: 1000, great: 700, good: 400 }[j] * this.mult());
    this.showJudge(j);
    const tg = this.targets[n.lane];
    tg.glow.setAlpha(0.9);
    this.tweens.add({ targets: tg.glow, alpha: 0, duration: 260 });
    this.laneFlash[n.lane].setAlpha(0.18);
    this.tweens.add({ targets: this.laneFlash[n.lane], alpha: 0, duration: 200 });
    if (j === 'perfect') burst(this, LANE_X[n.lane], this.hitY, LANE_TINT[n.lane], 12);
    if (this.voice) this.voice.setVolume(G.settings.voice);
    if (this.dancer) this.danceMove(n.lane, j);
    if (s.combo > 0 && s.combo % 25 === 0) this.milestone();
  }

  breakCombo() {
    if (this.stats.combo >= 10) this.cameras.main.shake(160, 0.004);
    this.stats.combo = 0;
  }

  miss(n) {
    this.stats.miss++;
    this.breakCombo();
    this.showJudge('miss');
    if (this.voice) {
      this.voice.setVolume(G.settings.voice * 0.2);
      this.time.delayedCall(450, () => { if (this.voice && !this.ended) this.voice.setVolume(G.settings.voice * 0.7); });
    }
    if (this.dancer && Math.random() < 0.5) this.dancer.shake();
  }

  showJudge(j, label) {
    this.judgeTxt.setText(label || JUDGE_TXT[j]).setColor(JUDGE_COL[j]).setScale(1.25).setAlpha(1);
    this.tweens.killTweensOf(this.judgeTxt);
    this.tweens.add({ targets: this.judgeTxt, scale: 1, duration: 120 });
    this.tweens.add({ targets: this.judgeTxt, alpha: 0, delay: 380, duration: 250 });
  }

  milestone() {
    const t = text(this, 960, 540, `${this.stats.combo} COMBO !`, { size: 110, weight: 900, font: 'Montserrat, Poppins', ox: 0.5, oy: 0.5, color: '#ffe66d', stroke: '#c2185b', strokeW: 14 }).setDepth(95);
    t.setScale(0.5);
    this.tweens.add({ targets: t, scale: 1.2, duration: 300, ease: 'Back.out' });
    this.tweens.add({ targets: t, alpha: 0, delay: 600, duration: 400, onComplete: () => t.destroy() });
    this.flashRect.setAlpha(0.15);
    this.tweens.add({ targets: this.flashRect, alpha: 0, duration: 350 });
    if (this.cfg.context === 'prime') this.sound.play('applause_small', { volume: 0.5 * G.settings.sfx });
  }

  danceMove(lane, j) {
    const d = this.dancer;
    const inner = d.inner;
    this.tweens.killTweensOf(inner);
    d.stopGroove();
    const e = j === 'perfect' ? 1 : 0.7;
    if (this.mode === 'danse') {
      if (lane === 0) this.tweens.add({ targets: inner, x: -40 * e, angle: -8 * e, duration: 110, yoyo: true, ease: 'Quad.out' });
      else if (lane === 3) this.tweens.add({ targets: inner, x: 40 * e, angle: 8 * e, duration: 110, yoyo: true, ease: 'Quad.out' });
      else if (lane === 2) this.tweens.add({ targets: inner, y: -70 * e, duration: 140, yoyo: true, ease: 'Quad.out' });
      else this.tweens.add({ targets: inner, scaleY: 0.9, scaleX: 1.06, duration: 100, yoyo: true });
      if (j === 'perfect' && Math.random() < 0.12) this.tweens.add({ targets: inner, scaleX: -1, duration: 160, yoyo: true });
    } else {
      this.tweens.add({ targets: inner, y: -16 * e, angle: (lane < 2 ? -3 : 3) * e, duration: 120, yoyo: true });
    }
    if (this.floor) {
      this.floor.setTint(LANE_TINT[lane]).setAlpha(0.95);
      this.tweens.add({ targets: this.floor, alpha: 0.5, duration: 300 });
    }
  }

  spawn(n) {
    const x = LANE_X[n.lane];
    const c = this.add.container(x, this.spawnY).setDepth(20);
    if (this.mode === 'danse') {
      const a = this.add.image(0, 0, 'arrow_' + LANE_COL[n.lane]).setAngle(ARROW_ROT[n.lane]).setScale(0.95);
      c.add(a);
    } else {
      if (n.hold) {
        const len = (n.hold / this.approach) * (this.hitY - this.spawnY);
        const tr = this.add.image(0, -len / 2, 'trail').setDisplaySize(46, len).setTint(LANE_TINT[n.lane]).setAlpha(0.75);
        c.add(tr);
        n.trailLen = len;
        n.trail = tr;
      }
      c.add(this.add.image(0, 0, 'gem_' + LANE_COL[n.lane]).setScale(0.95));
      if (n.syl) c.add(text(this, 0, 0, n.syl, { size: n.syl.length > 4 ? 22 : 26, weight: 800, ox: 0.5, oy: 0.5, color: '#ffffff', stroke: '#1a0b2e', strokeW: 5, shadow: false }));
    }
    n.obj = c;
  }

  killNote(n, hit) {
    if (!n.obj) return;
    const o = n.obj;
    n.obj = null;
    if (hit) {
      this.tweens.add({ targets: o, scale: 1.5, alpha: 0, duration: 140, onComplete: () => o.destroy() });
    } else {
      this.tweens.add({ targets: o, alpha: 0, duration: 200, onComplete: () => o.destroy() });
    }
  }

  update() {
    if (!this.started || this.paused || this.ended) return;
    const t = this.now();
    const dist = this.hitY - this.spawnY;
    // spawn
    while (this.next < this.notes.length && this.notes[this.next].t - t <= this.approach) {
      this.spawn(this.notes[this.next]);
      this.next++;
    }
    for (let i = Math.max(0, this.next - 60); i < this.next; i++) {
      const n = this.notes[i];
      if (!n.obj) {
        if (n.state === 0 && t - n.t > WIN.good) { n.state = 1; this.miss(n); }
        continue;
      }
      const p = 1 - (n.t - t) / this.approach;
      if (n.state === 2) {
        // holding: head stays on the line, trail shrinks
        n.obj.y = this.hitY;
        const remain = n.t + n.hold - t;
        if (n.trail) {
          const len = Math.max(0, (remain / this.approach) * dist);
          n.trail.setDisplaySize(46, len);
          n.trail.y = -len / 2;
        }
        if (Math.floor(t * 8) !== n.tick) {
          n.tick = Math.floor(t * 8);
          this.stats.score += 25;
          this.targets[n.lane].glow.setAlpha(0.6);
        }
        if (remain <= 0) {
          this.holding[n.lane] = null;
          this.holdDone(n, true);
        }
        continue;
      }
      n.obj.y = this.spawnY + dist * p;
      if (n.state === 0 && t - n.t > WIN.good) {
        n.state = 1;
        this.miss(n);
        this.killNote(n, false);
      }
    }
    // HUD
    const s = this.stats;
    this.scoreTxt.setText(s.score.toLocaleString('fr-FR'));
    const judged = s.perfect + s.great + s.good + s.miss;
    const acc = judged ? s.weight / Math.max(1, judged + this.holdsJudged()) : 1;
    this.accTxt.setText(`Précision ${Math.round(acc * 100)} %`);
    this.comboTxt.setText(s.combo >= 5 ? `${s.combo}` : '');
    this.prog.width = Math.max(2, 480 * Phaser.Math.Clamp(t / this.endTime, 0, 1));
    // beat pulse
    const beatIdx = Math.floor(t / this.beat);
    if (beatIdx !== this.lastBeat && t > 0) {
      this.lastBeat = beatIdx;
      this.onBeat(beatIdx);
    }
    if (this.mode === 'chant') this.updateLyrics(t);
    if (this.cfg.onProgress && Math.floor(t) !== this.lastProg) {
      this.lastProg = Math.floor(t);
      const r = this.cfg.onProgress({ score: s.score, acc, combo: s.combo });
      if (r && this.mpBoard) this.mpBoard.setText(r);
    }
    if (t >= this.endTime && !this.ended) this.finish(false);
  }

  holdsJudged() {
    let c = 0;
    for (let i = 0; i < this.next; i++) {
      const n = this.notes[i];
      if (n.hold && n.state === 1) c++;
    }
    return c;
  }

  onBeat(b) {
    this.targets.forEach((tg) => {
      tg.img.setAlpha(1);
      this.tweens.add({ targets: tg.img, alpha: this.mode === 'danse' ? 0.75 : 0.85, duration: this.beat * 800 });
    });
    if (this.crowd && b % 2 === 0) {
      const up = (b / 2) % 2 === 0;
      this.crowd[1].setAlpha(up ? 0.95 : 0);
      this.crowd[0].setAlpha(up ? 0 : 0.95);
    }
    if (b % 4 === 0 && this.bg) {
      this.bg.setScale(this.bg.scaleX * 1.004, this.bg.scaleY * 1.004);
      this.tweens.add({ targets: this.bg, scaleX: W / this.bg.width, scaleY: H / this.bg.height, duration: this.beat * 900 });
    }
  }

  updateLyrics(t) {
    const lines = this.chart.lines;
    let li = this.lyIdx;
    const cur = lines[li];
    if (!cur || t > cur.t1 - 0.15) {
      const nx = lines.findIndex((L) => t < L.t1 - 0.15 && t >= L.t0 - 1.2);
      if (nx !== -1 && nx !== li) {
        this.lyIdx = nx;
        this.layoutLine(nx);
        this.lyLine.setAlpha(0);
        this.tweens.add({ targets: this.lyLine, alpha: 1, duration: 200 });
      } else if (nx === -1 && li !== -2) {
        const upcoming = lines.find((L) => L.t0 > t);
        this.lyLine.removeAll(true);
        this.lySyl = [];
        this.lyNext.setText(upcoming && upcoming.t0 - t < 6 ? upcoming.text : '♪ ♪ ♪');
        this.lyIdx = -2;
      }
    }
    if (this.lySyl) {
      for (const s of this.lySyl) {
        if (t >= s.t - 0.03 && !s.done) {
          s.done = true;
          s.o.setColor('#ff8ce6');
          this.tweens.add({ targets: s.o, y: -6, duration: 90, yoyo: true });
        }
      }
    }
  }

  async finish(aborted) {
    if (this.ended) return;
    this.ended = true;
    const s = this.stats;
    const judgedWeightBase = this.totalWeight || 1;
    let acc = Phaser.Math.Clamp(s.weight / judgedWeightBase, 0, 1);
    if (aborted) acc *= 0.4;
    const grade = gradeOf(acc);
    if (this.music.isPlaying) this.tweens.add({ targets: this.music, volume: 0, duration: 900, onComplete: () => this.music.stop() });
    if (this.voice && this.voice.isPlaying) this.tweens.add({ targets: this.voice, volume: 0, duration: 900, onComplete: () => this.voice.stop() });
    if (this.dancer) this.dancer.stopGroove();
    const result = { acc, grade, score: s.score, maxCombo: s.maxCombo, perfect: s.perfect, great: s.great, good: s.good, miss: s.miss, aborted };
    if (this.cfg.context === 'mp' && this.cfg.onFinish) this.cfg.onFinish(result);
    await wait(this, 700);
    if (this.cfg.context === 'prime' || this.cfg.context === 'audition') {
      this.sound.play(acc > 0.75 ? 'applause_big' : 'applause', { volume: G.settings.sfx });
      if (acc > 0.75) { const cf = confetti(this); this.time.delayedCall(2500, () => cf.stop()); }
      if (this.dancer) this.dancer.setExpr(acc > 0.6 ? 'joie' : 'surprise');
    }
    await this.showResults(result);
    await fadeOut(this, 400);
    const done = this.cfg._done;
    this.scene.stop();
    if (done) done(result);
  }

  showResults(r) {
    return new Promise((res) => {
      const c = this.add.container(W / 2, H / 2).setDepth(250);
      c.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.55));
      c.add(this.add.nineslice(0, 0, 'panel', undefined, 900, 700, 28, 28, 28, 28));
      c.add(text(this, 0, -280, this.cfg.resultTitle || 'Résultat', { size: 44, weight: 800, ox: 0.5, oy: 0.5 }));
      const gcol = { S: '#ffe66d', A: '#7dffb0', B: '#8fd3ff', C: '#ffb37d', D: '#ff8a8a' }[r.grade];
      const g = text(this, -220, -40, r.grade, { size: 230, weight: 900, font: 'Montserrat, Poppins', ox: 0.5, oy: 0.5, color: gcol, stroke: '#2a0f45', strokeW: 16 });
      c.add(g);
      g.setScale(0.2);
      this.tweens.add({ targets: g, scale: 1, duration: 500, ease: 'Back.out' });
      const lines = [
        `Précision : ${Math.round(r.acc * 100)} %`,
        `Score : ${r.score.toLocaleString('fr-FR')}`,
        `Combo max : ${r.maxCombo}`,
        `Parfait ${r.perfect} · Super ${r.great} · Bien ${r.good} · Raté ${r.miss}`,
      ];
      c.add(text(this, 40, -40, lines.slice(0, 3).join('\n'), { size: 34, weight: 600, oy: 0.5, lineSpacing: 18 }));
      c.add(text(this, 0, 130, lines[3], { size: 24, weight: 400, ox: 0.5, oy: 0.5, color: '#cbb8ea' }));
      if (r.grade === 'S' || r.grade === 'A') this.time.delayedCall(300, () => burst(this, W / 2 - 220, H / 2 - 40, 0xffe66d, 30, 260));
      const b = button(this, W / 2, H / 2 + 260, 420, 90, 'Continuer', () => { b.destroy(); c.destroy(); res(); });
      b.setDepth(260);
      if (this.cfg.context === 'mp') this.time.delayedCall(6000, () => { if (b.scene) { b.destroy(); c.destroy(); res(); } });
    });
  }
}
