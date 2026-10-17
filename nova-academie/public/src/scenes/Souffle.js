// Breath-control minigame: hold to raise your voice, keep it inside the moving zone. A synth "aah" follows your pitch.
import { G, W, H } from '../core/state.js';
import { Audio } from '../core/audio.js';
import { need, bgAsset, actorAssets } from '../core/assets.js';
import { Actor } from '../ui/actor.js';
import { text, button, setBackground, fadeIn, fadeOut, wait, burst, vignette } from '../ui/ui.js';

const DUR = 32;
const TOP = 170;
const BOT = 930;

export class Souffle extends Phaser.Scene {
  constructor() { super('Souffle'); }

  init(data) { this.cfg = data; }

  async create() {
    await need(this, [bgAsset(this.cfg.bg || 'yoga'), ...actorAssets('player', ['neutre', 'joie', 'calme', 'inquiet'])]);
    fadeIn(this);
    Audio.music(this, 'bgm_chateau', { volume: 0.35 });
    setBackground(this, this.cfg.bg || 'yoga', { dim: true });
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b0614, 0.45);
    vignette(this, 2);
    this.me = new Actor(this, 'player', 'calme');
    this.me.place(420).setDepth(10).enter(420, 'fade');
    text(this, W / 2 + 200, 80, this.cfg.title || 'Technique vocale : le souffle', { size: 48, weight: 900, font: 'Montserrat, Poppins', ox: 0.5, oy: 0.5, stroke: '#3a1250', strokeW: 8 });
    this.info = text(this, W / 2 + 200, 140, 'Maintiens ESPACE (ou le clic) pour monter ta voix. Reste dans la zone lumineuse !', { size: 26, weight: 400, ox: 0.5, oy: 0.5, color: '#ffd6f3' });
    // gauge
    const gx = 1150;
    this.gx = gx;
    const g = this.add.graphics();
    g.fillStyle(0x12082a, 0.8).fillRoundedRect(gx - 90, TOP - 20, 180, BOT - TOP + 40, 40);
    g.lineStyle(3, 0xffffff, 0.15).strokeRoundedRect(gx - 90, TOP - 20, 180, BOT - TOP + 40, 40);
    this.zoneH = this.cfg.zone || 150;
    this.zone = this.add.rectangle(gx, 500, 150, this.zoneH, 0x31d2ff, 0.35).setBlendMode('ADD');
    this.zoneGlow = this.add.image(gx, 500, 'glow').setTint(0x31d2ff).setScale(3, 2.2).setAlpha(0.3).setBlendMode('ADD');
    this.cursor = this.add.image(gx, BOT, 'gem_pink').setScale(0.75);
    this.cy = BOT;
    this.vy = 0;
    this.inside = 0;
    this.elapsed = 0;
    this.meterBg = this.add.rectangle(1500, 540, 40, 600, 0x000000, 0.4);
    this.meter = this.add.rectangle(1500, 840, 40, 2, 0x3ddc84).setOrigin(0.5, 1);
    this.pctTxt = text(this, 1500, 200, '0 %', { size: 40, weight: 900, ox: 0.5, oy: 0.5 });
    this.timeTxt = text(this, 1500, 900, `${DUR}s`, { size: 30, weight: 600, ox: 0.5, oy: 0.5, color: '#cbb8ea' });
    this.holdKey = this.input.keyboard.addKey('SPACE');
    this.events.once('shutdown', () => this.stopVoice());
    this.input.on('pointerdown', () => { this.ptr = true; });
    this.input.on('pointerup', () => { this.ptr = false; });
    await new Promise((res) => {
      const b = button(this, W / 2 + 200, 560, 420, 90, 'Commencer', () => { b.destroy(); res(); });
    });
    this.startVoice();
    this.running = true;
    this.seed = Math.random() * 100;
  }

  startVoice() {
    const ctx = this.sound.context;
    if (!ctx || !ctx.createOscillator) return;
    try {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      const vib = ctx.createOscillator();
      vib.frequency.value = 5.4;
      const vibG = ctx.createGain();
      vibG.gain.value = 3;
      vib.connect(vibG).connect(osc.frequency);
      const f1 = ctx.createBiquadFilter();
      f1.type = 'bandpass'; f1.frequency.value = 800; f1.Q.value = 6;
      const f2 = ctx.createBiquadFilter();
      f2.type = 'bandpass'; f2.frequency.value = 1150; f2.Q.value = 8;
      const mix = ctx.createGain();
      mix.gain.value = 0;
      osc.connect(f1).connect(mix);
      osc.connect(f2).connect(mix);
      mix.connect(ctx.destination);
      osc.start();
      vib.start();
      this.voice = { osc, vib, mix };
    } catch (e) {
      this.voice = null;
    }
  }

  stopVoice() {
    if (!this.voice) return;
    try {
      this.voice.mix.gain.value = 0;
      this.voice.osc.stop();
      this.voice.vib.stop();
      this.voice.mix.disconnect();
    } catch (e) { /* ignore */ }
    this.voice = null;
  }

  update(time, delta) {
    if (!this.running) return;
    const dt = Math.min(0.05, delta / 1000);
    this.elapsed += dt;
    const t = this.elapsed;
    const level = this.cfg.level || 1;
    const zc = 550 + Math.sin(t * 0.55 * level + this.seed) * 220 + Math.sin(t * 1.3 * level + this.seed * 2) * 90;
    this.zone.y = zc;
    this.zoneGlow.y = zc;
    const hold = this.holdKey.isDown || this.ptr;
    this.vy += (hold ? -1900 : 1500) * dt;
    this.vy *= 0.9;
    this.cy = Phaser.Math.Clamp(this.cy + this.vy * dt, TOP, BOT);
    if (this.cy === TOP || this.cy === BOT) this.vy = 0;
    this.cursor.y = this.cy;
    const inside = Math.abs(this.cy - zc) < this.zoneH / 2;
    if (inside) this.inside += dt;
    this.zone.fillColor = inside ? 0x3ddc84 : 0x31d2ff;
    this.zoneGlow.setTint(inside ? 0x3ddc84 : 0x31d2ff);
    if (inside && Math.random() < 0.06) burst(this, this.gx, this.cy, 0x7dffb0, 4, 20);
    const pct = this.inside / Math.max(0.001, t);
    this.pctTxt.setText(`${Math.round(pct * 100)} %`);
    this.meter.height = Math.max(2, 600 * pct);
    this.timeTxt.setText(`${Math.max(0, Math.ceil(DUR - t))}s`);
    if (this.voice) {
      const ctx = this.sound.context;
      const freq = 160 + (1 - (this.cy - TOP) / (BOT - TOP)) * 420;
      this.voice.osc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.03);
      this.voice.mix.gain.setTargetAtTime(hold || this.cy < BOT - 5 ? 0.16 * G.settings.voice : 0, ctx.currentTime, 0.05);
    }
    if (Math.floor(t * 2) !== this.lastExpr) {
      this.lastExpr = Math.floor(t * 2);
      this.me.setExpr(inside ? 'joie' : this.cy >= BOT - 4 ? 'calme' : 'inquiet');
    }
    if (t >= DUR) this.finish(pct);
  }

  async finish(pct) {
    this.running = false;
    this.stopVoice();
    const acc = Phaser.Math.Clamp(pct * 1.1, 0, 1);
    Audio.sfx(this, acc > 0.6 ? 'jingle_good' : 'jingle_oops', 0.7);
    const t = text(this, W / 2 + 200, 520, `${Math.round(pct * 100)} % dans la zone`, { size: 72, weight: 900, font: 'Montserrat, Poppins', ox: 0.5, oy: 0.5, stroke: '#3a1250', strokeW: 10 }).setDepth(50);
    t.setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 400, ease: 'Back.out' });
    await wait(this, 900);
    await new Promise((res) => button(this, W / 2 + 200, 700, 420, 90, 'Continuer', res).setDepth(60));
    await fadeOut(this);
    const done = this.cfg._done;
    this.scene.stop();
    if (done) done({ acc });
  }

}
