// Weekly hub: player card + choice of activity for the current time slot.
import { G, W, H, charName, writeSave } from '../core/state.js';
import { Audio } from '../core/audio.js';
import { need, bgAsset, portraitAsset } from '../core/assets.js';
import { WEEK_INFO } from '../core/season.js';
import { text, button, setBackground, portrait, fadeIn, fadeOut, bar, toast, STAT_LABEL, statIcon, makeLookPortrait, sparkles, vignette } from '../ui/ui.js';

export const ACTIVITIES = [
  { id: 'chant', label: 'Cours de chant', icon: 'ico_voix', desc: 'Vocalises avec Victor', gain: 'Voix ++', cost: 15 },
  { id: 'danse', label: 'Cours de danse', icon: 'ico_danse', desc: 'Chorégraphie avec Mia', gain: 'Danse ++', cost: 18 },
  { id: 'theatre', label: 'Théâtre', icon: 'ico_scene', desc: 'Interprétation avec Odile', gain: 'Scène ++', cost: 12 },
  { id: 'culture', label: 'Culture musicale', icon: 'ico_culture', desc: 'Quiz entre élèves', gain: 'Culture ++', cost: 8 },
  { id: 'souffle', label: 'Sport & souffle', icon: 'ico_forme', desc: 'Respiration et cardio', gain: 'Voix + · Danse +', cost: 12 },
  { id: 'social', label: 'Moment entre amis', icon: 'ico_pop', desc: 'Passer du temps avec un·e élève', gain: 'Amitié · Pop', cost: 5 },
  { id: 'repos', label: 'Se reposer', icon: 'ico_check', desc: 'Sieste, tisane, musique douce', gain: 'Énergie +40', cost: -40 },
];

const SLOTS = ['Lundi', 'Mardi', 'Mercredi'];

export class Planner extends Phaser.Scene {
  constructor() { super('Planner'); }

  init(data) { this.cfg = data; }

  async create() {
    const s = G.season;
    const bgId = ['hall', 'salon', 'salon2', 'parc', 'cuisine', 'jardin', 'cafe', 'piscine', 'hall', 'salon'][s.week % 10];
    await need(this, [bgAsset(bgId), ...s.alive.map(portraitAsset)]);
    await makeLookPortrait(this, s.player.look);
    fadeIn(this);
    Audio.music(this, 'bgm_matin', { volume: 0.6 });
    setBackground(this, bgId);
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b0614, 0.45);
    vignette(this, 1);
    sparkles(this, 1);
    const info = WEEK_INFO[s.week];
    text(this, 60, 40, `Semaine ${s.week} · ${info.theme}`, { size: 48, weight: 900, font: 'Montserrat, Poppins', stroke: '#3a1250', strokeW: 8 });
    text(this, 60, 110, `${SLOTS[s.acts] || 'Mercredi'} — activité ${s.acts + 1}/3  ·  Chanson du prime : « ${this.songTitle(info.song)} »  ·  Invité·e : ${info.guest}`, { size: 26, weight: 400, color: '#ffd6f3' });
    this.playerCard(s);
    this.activityGrid(s);
    const menu = button(this, 1800, 60, 180, 64, 'Menu', () => this.scene.launch('Pause', { from: 'Planner' }), { style: 'btn2', size: 26 });
    menu.setDepth(50);
    if (G.lastGains && G.lastGains.length) {
      const str = G.lastGains.map((g) => `${STAT_LABEL[g.id] || charName(g.id)} ${g.v > 0 ? '+' : ''}${g.v}`).join('   ');
      toast(this, str, '#7dffb0', 980);
      G.lastGains = null;
    }
    writeSave();
  }

  songTitle(id) {
    const s = G.songs.find((x) => x.id === id);
    return s ? s.title : id;
  }

  playerCard(s) {
    const x = 60;
    const y = 180;
    const p = this.add.nineslice(x + 270, y + 400, 'panel', undefined, 540, 800, 28, 28, 28, 28);
    portrait(this, 'player', x + 270, y + 120, 170);
    text(this, x + 270, y + 240, s.player.name, { size: 38, weight: 900, ox: 0.5, oy: 0.5 });
    const rank = this.rankText(s);
    text(this, x + 270, y + 285, rank, { size: 22, weight: 400, ox: 0.5, oy: 0.5, color: '#cbb8ea' });
    const stats = ['voix', 'danse', 'scene', 'culture', 'pop'];
    const cols = { voix: 0xff5cb4, danse: 0x31d2ff, scene: 0xffc93c, culture: 0x3ddc84, pop: 0xff4d6d };
    stats.forEach((st, i) => {
      const yy = y + 345 + i * 70;
      this.add.image(x + 60, yy, statIcon(st)).setDisplaySize(46, 46);
      text(this, x + 95, yy - 16, STAT_LABEL[st], { size: 24, weight: 600, oy: 0.5 });
      text(this, x + 490, yy - 16, String(s.player.stats[st]), { size: 24, weight: 800, ox: 1, oy: 0.5, color: '#ffe66d' });
      bar(this, x + 95, yy + 14, 395, 14, s.player.stats[st], cols[st]);
    });
    const ey = y + 700;
    this.add.image(x + 60, ey, 'ico_forme').setDisplaySize(46, 46);
    text(this, x + 95, ey - 16, 'Énergie', { size: 24, weight: 600, oy: 0.5 });
    text(this, x + 490, ey - 16, `${s.player.energie}`, { size: 24, weight: 800, ox: 1, oy: 0.5, color: s.player.energie < 30 ? '#ff8a8a' : '#7dffb0' });
    bar(this, x + 95, ey + 14, 395, 14, s.player.energie, s.player.energie < 30 ? 0xff4d5a : 0x3ddc84);
    if (s.player.energie < 30) text(this, x + 270, ey + 55, 'Fatigue : tes performances baissent !', { size: 20, weight: 600, ox: 0.5, oy: 0.5, color: '#ff8a8a' });
  }

  rankText(s) {
    const n = s.alive.length + 1;
    return `${n} élèves encore en lice · ${s.eliminated.length} départ${s.eliminated.length > 1 ? 's' : ''}`;
  }

  activityGrid(s) {
    const x0 = 700;
    const y0 = 260;
    ACTIVITIES.forEach((a, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = x0 + col * 400 + 180;
      const y = y0 + row * 250 + 90;
      const card = this.add.container(x, y);
      const bg = this.add.nineslice(0, 0, 'panel', undefined, 370, 220, 28, 28, 28, 28);
      const ic = this.add.image(-120, -40, a.icon).setDisplaySize(84, 84);
      const t = text(this, -60, -62, a.label, { size: 28, weight: 800, wrap: 220 });
      const d = text(this, -160, 20, a.desc, { size: 21, weight: 400, color: '#d9c8ff', wrap: 320 });
      const g = text(this, -160, 70, a.gain, { size: 21, weight: 800, color: '#7dffb0' });
      const cost = text(this, 160, 70, a.cost > 0 ? `-${a.cost} énergie` : `+${-a.cost} énergie`, { size: 21, weight: 800, ox: 1, color: a.cost > 0 ? '#ffb37d' : '#7dffb0' });
      card.add([bg, ic, t, d, g, cost]);
      card.setSize(370, 220).setInteractive({ useHandCursor: true });
      card.on('pointerover', () => { this.tweens.add({ targets: card, scale: 1.05, duration: 120 }); bg.setTint(0xffd6f3); Audio.sfx(this, 'hover', 0.3); });
      card.on('pointerout', () => { this.tweens.add({ targets: card, scale: 1, duration: 120 }); bg.clearTint(); });
      card.on('pointerdown', () => {
        Audio.sfx(this, 'click', 0.6);
        if (a.id === 'social') this.socialPick(s);
        else this.choose({ act: a.id });
      });
      card.setAlpha(0);
      card.y += 30;
      this.tweens.add({ targets: card, alpha: 1, y, duration: 320, delay: 60 * i, ease: 'Cubic.out' });
    });
  }

  socialPick(s) {
    const ui = [];
    ui.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setDepth(100).setInteractive());
    ui.push(text(this, W / 2, 160, 'Avec qui veux-tu passer du temps ?', { size: 50, weight: 900, ox: 0.5, oy: 0.5, font: 'Montserrat, Poppins' }).setDepth(101));
    const list = s.alive;
    const perRow = Math.ceil(list.length / 2);
    list.forEach((id, i) => {
      const row = Math.floor(i / perRow);
      const cnt = Math.min(perRow, list.length - row * perRow);
      const x = W / 2 + ((i % perRow) - (cnt - 1) / 2) * 300;
      const y = 400 + row * 330;
      const p = portrait(this, id, x, y, 170, { label: charName(id) }).setDepth(101);
      const aff = s.aff[id] || 0;
      const hearts = aff >= 60 ? '♥♥♥♥' : aff >= 40 ? '♥♥♥' : aff >= 22 ? '♥♥' : aff >= 8 ? '♥' : '♡';
      const ht = text(this, x, y + 150, hearts, { size: 30, weight: 800, ox: 0.5, oy: 0.5, color: '#ff8ce6' }).setDepth(101);
      p.setSize(200, 260).setInteractive({ useHandCursor: true });
      p.on('pointerover', () => this.tweens.add({ targets: p, scale: 1.08, duration: 120 }));
      p.on('pointerout', () => this.tweens.add({ targets: p, scale: 1, duration: 120 }));
      p.on('pointerdown', () => { Audio.sfx(this, 'click', 0.6); this.choose({ act: 'social', target: id }); });
      ui.push(p, ht);
    });
    const back = button(this, W / 2, 1000, 320, 80, 'Retour', () => ui.concat([back]).forEach((o) => o.destroy()), { style: 'btn2' });
    back.setDepth(101);
  }

  async choose(res) {
    if (this.chosen) return;
    this.chosen = true;
    await fadeOut(this, 350);
    const done = this.cfg._done;
    this.scene.stop();
    if (done) done(res);
  }
}
