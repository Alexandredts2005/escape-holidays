// Pause menu + options overlay.
import { G, W, H, saveSettings, writeSave } from '../core/state.js';
import { Audio } from '../core/audio.js';
import { text, button } from '../ui/ui.js';
import { goTitle } from '../core/flow.js';

export class Pause extends Phaser.Scene {
  constructor() { super('Pause'); }

  init(data) { this.cfg = data || {}; }

  create() {
    const from = this.cfg.from;
    if (from && from !== 'Title' && this.scene.isActive(from)) this.scene.pause(from);
    this.scene.bringToTop();
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72).setInteractive();
    this.add.nineslice(W / 2, H / 2, 'panel', undefined, 1100, 900, 28, 28, 28, 28);
    if (this.cfg.options) this.options();
    else this.menu();
  }

  clear() {
    this.children.list.slice(2).forEach((o) => o.destroy());
  }

  menu() {
    this.clear();
    text(this, W / 2, 230, 'Pause', { size: 72, weight: 900, font: 'Montserrat, Poppins', ox: 0.5, oy: 0.5 });
    button(this, W / 2, 380, 560, 90, 'Reprendre', () => this.close());
    button(this, W / 2, 490, 560, 90, 'Options', () => this.options(), { style: 'btn2' });
    if (G.season) {
      button(this, W / 2, 600, 560, 90, 'Sauvegarder', () => {
        const ok = writeSave();
        Audio.sfx(this, ok ? 'confirm' : 'wrong', 0.7);
        const t = text(this, W / 2, 660, ok ? 'Partie sauvegardée !' : 'Sauvegarde impossible sur ce navigateur', { size: 26, weight: 600, ox: 0.5, oy: 0.5, color: ok ? '#7dffb0' : '#ff8a8a' });
        this.time.delayedCall(1500, () => t.destroy());
      }, { style: 'btn2' });
    }
    button(this, W / 2, 740, 560, 90, 'Menu principal', () => {
      if (G.season) writeSave();
      this.scene.stop();
      goTitle();
    }, { style: 'btn_bad' });
  }

  options() {
    this.clear();
    text(this, W / 2, 200, 'Options', { size: 64, weight: 900, font: 'Montserrat, Poppins', ox: 0.5, oy: 0.5 });
    const s = G.settings;
    const slider = (y, label, key, min, max, step, fmtv) => {
      text(this, 520, y, label, { size: 30, weight: 800, oy: 0.5 });
      const val = text(this, 1400, y, fmtv(s[key]), { size: 30, weight: 800, ox: 1, oy: 0.5, color: '#ffe66d' });
      const upd = (d) => {
        s[key] = Math.round(Phaser.Math.Clamp(s[key] + d, min, max) * 100) / 100;
        val.setText(fmtv(s[key]));
        saveSettings();
        Audio.refreshVolume();
      };
      button(this, 1000, y, 76, 60, '−', () => upd(-step), { style: 'btn2', size: 30 });
      button(this, 1100, y, 76, 60, '+', () => upd(step), { style: 'btn2', size: 30 });
    };
    const pct = (v) => `${Math.round(v * 100)} %`;
    slider(310, 'Musique', 'music', 0, 1, 0.1, pct);
    slider(390, 'Effets sonores', 'sfx', 0, 1, 0.1, pct);
    slider(470, 'Voix chantée', 'voice', 0, 1, 0.1, pct);
    slider(550, 'Latence audio', 'latency', -200, 200, 10, (v) => `${v > 0 ? '+' : ''}${v} ms`);
    slider(630, 'Vitesse des notes', 'scroll', 0.6, 1.8, 0.1, (v) => `x${v.toFixed(1)}`);
    slider(710, 'Vitesse du texte', 'textSpeed', 10, 120, 10, (v) => `${v} car./s`);
    const lv = { easy: 'Facile', normal: 'Normal', hard: 'Difficile' };
    text(this, 520, 790, 'Difficulté', { size: 30, weight: 800, oy: 0.5 });
    const db = button(this, 1150, 790, 340, 64, lv[s.difficulty], () => {
      s.difficulty = s.difficulty === 'easy' ? 'normal' : s.difficulty === 'normal' ? 'hard' : 'easy';
      db.setLabel(lv[s.difficulty]);
      saveSettings();
    }, { style: 'btn2', size: 26 });
    button(this, W / 2 - 220, 900, 380, 80, 'Plein écran', () => {
      if (this.scale.isFullscreen) this.scale.stopFullscreen(); else this.scale.startFullscreen();
    }, { style: 'btn2', size: 26 });
    button(this, W / 2 + 220, 900, 380, 80, 'Retour', () => (this.cfg.options ? this.close() : this.menu()));
  }

  close() {
    const from = this.cfg.from;
    if (from && this.scene.isPaused(from)) this.scene.resume(from);
    this.scene.stop();
  }
}
