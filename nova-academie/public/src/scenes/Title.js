// Title screen and main menu.
import { G, W, H, hasSave, loadSave, clearSave } from '../core/state.js';
import { Audio } from '../core/audio.js';
import { text, button, setBackground, sparkles, spotlights, vignette, fadeIn, fadeOut, wait } from '../ui/ui.js';
import { newGame, continueGame, freePlay } from '../core/flow.js';

export class Title extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    fadeIn(this, 800);
    Audio.music(this, 'bgm_menu', { volume: 0.8 });
    const bg = setBackground(this, 'chateau_nuit');
    this.tweens.add({ targets: bg, scale: bg.scale * 1.06, duration: 20000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.add.rectangle(W / 2, H / 2, W, H, 0x12062a, 0.35);
    spotlights(this, 4, 1, [0xff5cb4, 0x8b5cff, 0x31d2ff, 0xffc93c]).forEach((b) => b.setAlpha(0.18));
    sparkles(this, 2);
    vignette(this, 3);
    const logo = this.add.image(W / 2, 250, 'logo').setDepth(10).setScale(0.75);
    logo.setAlpha(0).setScale(0.5);
    this.tweens.add({ targets: logo, alpha: 1, scale: 0.75, duration: 900, ease: 'Back.out' });
    this.tweens.add({ targets: logo, y: 262, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: 900 });
    const glow = this.add.image(W / 2, 250, 'glow').setScale(9, 4).setTint(0xff5cb4).setAlpha(0.25).setBlendMode('ADD').setDepth(9);
    this.tweens.add({ targets: glow, alpha: 0.45, duration: 1600, yoyo: true, repeat: -1 });
    text(this, W / 2, 470, 'La saison commence au château', { size: 32, weight: 600, ox: 0.5, oy: 0.5, color: '#ffe0f5' }).setDepth(10);

    const items = [];
    const save = hasSave() ? loadSave() : null;
    if (save && !save.completed) {
      items.push(['Continuer la saison', () => this.go(() => continueGame(save)), 'btn', `Semaine ${save.week || 0} · ${save.player.name}`]);
    }
    items.push(['Nouvelle saison', () => this.newSeason(save), save ? 'btn2' : 'btn', 'Solo · environ 2 heures']);
    items.push(['Multijoueur en ligne', () => this.go(() => this.scene.start('Multi')), 'btn2', 'Quiz battle · Saison entre amis']);
    items.push(['Scène libre (karaoké)', () => this.freeMenu(), 'btn2', 'Toutes les chansons, chant ou danse']);
    items.push(['Options', () => { this.scene.launch('Pause', { from: 'Title', options: true }); this.scene.pause(); }, 'btn2']);
    items.push(['Crédits', () => this.go(() => this.scene.start('Credits', { fromTitle: true })), 'btn2']);
    items.forEach(([label, fn, style, sub], i) => {
      const b = button(this, W / 2, 570 + i * 84, 560, 72, label, fn, { style, size: 28 });
      b.setDepth(20).setAlpha(0);
      this.tweens.add({ targets: b, alpha: 1, duration: 400, delay: 500 + i * 90 });
      if (sub) {
        const st = text(this, W / 2 + 300, 570 + i * 84, sub, { size: 20, weight: 400, oy: 0.5, color: '#d9c8ff' }).setDepth(20);
        st.setAlpha(0);
        this.tweens.add({ targets: st, alpha: 1, duration: 400, delay: 700 + i * 90 });
      }
    });
    text(this, 30, H - 40, 'v1.0 · Musique originale, décors CC0 Poly Haven, personnages CC0 OpenGameArt', { size: 18, weight: 400, color: '#9b86b8', oy: 0.5 }).setDepth(20);
  }

  async go(fn) {
    if (this.leaving) return;
    this.leaving = true;
    await fadeOut(this, 400);
    fn();
  }

  newSeason(save) {
    if (save && !save.completed) {
      this.confirm('Une saison est en cours. La remplacer ?', () => { clearSave(); this.go(() => newGame()); });
    } else this.go(() => newGame());
  }

  confirm(msg, yes) {
    const ui = [];
    ui.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setDepth(100).setInteractive());
    ui.push(this.add.nineslice(W / 2, H / 2, 'panel', undefined, 900, 360, 28, 28, 28, 28).setDepth(101));
    ui.push(text(this, W / 2, H / 2 - 70, msg, { size: 34, weight: 800, ox: 0.5, oy: 0.5, align: 'center', wrap: 800 }).setDepth(102));
    ui.push(button(this, W / 2 - 200, H / 2 + 80, 340, 84, 'Remplacer', () => { ui.forEach((o) => o.destroy()); yes(); }, { style: 'btn_bad' }).setDepth(102));
    ui.push(button(this, W / 2 + 200, H / 2 + 80, 340, 84, 'Annuler', () => ui.forEach((o) => o.destroy()), { style: 'btn2' }).setDepth(102));
  }

  freeMenu() {
    const ui = [];
    ui.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8).setDepth(100).setInteractive());
    ui.push(text(this, W / 2, 90, 'Scène libre', { size: 60, weight: 900, ox: 0.5, oy: 0.5, font: 'Montserrat, Poppins' }).setDepth(101));
    let mode = 'chant';
    let level = 'normal';
    const modeBtn = button(this, W / 2 - 330, 190, 400, 70, 'Mode : Chant', () => {
      mode = mode === 'chant' ? 'danse' : 'chant';
      modeBtn.setLabel(`Mode : ${mode === 'chant' ? 'Chant' : 'Danse'}`);
    }, { style: 'btn2', size: 26 }).setDepth(101);
    const lvls = { easy: 'Facile', normal: 'Normal', hard: 'Difficile' };
    const lvlBtn = button(this, W / 2 + 330, 190, 400, 70, 'Niveau : Normal', () => {
      level = level === 'easy' ? 'normal' : level === 'normal' ? 'hard' : 'easy';
      lvlBtn.setLabel(`Niveau : ${lvls[level]}`);
    }, { style: 'btn2', size: 26 }).setDepth(101);
    ui.push(modeBtn, lvlBtn);
    const songs = G.songs.filter((s) => s.kind !== 'vocalise' || true);
    songs.forEach((s, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const m = Math.floor(s.duration / 60);
      const sec = String(Math.round(s.duration % 60)).padStart(2, '0');
      const b = button(this, W / 2 + (col - 1) * 560, 310 + row * 112, 520, 96, s.title, () => {
        ui.forEach((o) => o.destroy());
        const save = hasSave() ? loadSave() : null;
        const look = save ? save.player.look : { body: 3, skin: 4, outfit: 0, hair: 'hair2_color3', tint: 0 };
        const m2 = s.kind === 'dance' ? 'danse' : (s.voice ? mode : 'danse');
        this.go(() => freePlay({ song: s.id, mode: m2, level, bg: m2 === 'danse' ? 'danse' : 'scene', dancer: 'player', look, resultTitle: s.title }));
      }, { style: i % 2 ? 'btn2' : 'btn', size: 26, sub: `${s.kind === 'song' ? 'Chanson' : s.kind === 'dance' ? 'Danse' : 'Vocalise'} · ${m}:${sec} · ${s.bpm} BPM` });
      b.setDepth(101);
      ui.push(b);
    });
    ui.push(button(this, W / 2, 1020, 320, 70, 'Retour', () => ui.forEach((o) => o.destroy()), { style: 'btn_off', size: 26 }).setDepth(101));
  }
}
