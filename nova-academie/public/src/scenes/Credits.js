// Scrolling credits (also lists asset licenses).
import { G, W, H } from '../core/state.js';
import { Audio } from '../core/audio.js';
import { need, bgAsset } from '../core/assets.js';
import { text, button, setBackground, sparkles, fadeIn, fadeOut, confetti } from '../ui/ui.js';

const LINES = [
  ['h', 'NOVA Académie'],
  ['', ''],
  ['t', 'Conception, programmation, scénario, musique'],
  ['', 'Le studio NOVA'],
  ['', ''],
  ['t', 'Musique & chansons'],
  ['', 'Compositions et paroles originales, synthétisées pour le jeu'],
  ['', '« Premier Pas » · « Le Château des Rêves » · « Lumière »'],
  ['', '« Danse avec moi » · « Ma ville la nuit » · « Ne lâche rien »'],
  ['', "« Soleil d'octobre » · « Mille étoiles » · « Feu d'artifice »"],
  ['', '« Deux voix » · « La Dernière Scène »'],
  ['', ''],
  ['t', 'Personnages (CC0, OpenGameArt.org)'],
  ['', 'VN Characters — cabbit KusSv'],
  ['', 'Visual Novel Style Characters — MadameBerry'],
  ['', 'The Corporation Secretary — Raquel'],
  ['', ''],
  ['t', 'Décors photographiques (CC0, Poly Haven)'],
  ['', 'Panoramas HDRI de Poly Haven (polyhaven.com) — merci à leurs photographes'],
  ['', ''],
  ['t', 'Bruitages (CC0, Kenney.nl)'],
  ['', 'Interface Sounds · UI Audio · Music Jingles'],
  ['', ''],
  ['t', 'Polices (SIL Open Font License)'],
  ['', 'Poppins · Montserrat · Bebas Neue · Pacifico'],
  ['', ''],
  ['t', 'Moteur'],
  ['', 'Phaser 3 (MIT) · Socket.IO (MIT) · Node.js'],
  ['', ''],
  ['t', 'Textes de théâtre'],
  ['', 'Extraits du domaine public : Molière, Corneille, Racine, Rostand, Musset, Hugo, Marivaux, Shakespeare'],
  ['', ''],
  ['', ''],
  ['h', 'Merci d\'avoir joué !'],
];

export class Credits extends Phaser.Scene {
  constructor() { super('Credits'); }

  init(data) { this.cfg = data || {}; }

  async create() {
    await need(this, [bgAsset('finale')]);
    fadeIn(this, 800);
    Audio.music(this, 'bgm_generique', { volume: 0.8 });
    setBackground(this, 'finale', { dim: true });
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b0614, 0.6);
    sparkles(this, 1);
    if (this.cfg.ending === 'victoire') { const c = confetti(this); this.time.delayedCall(6000, () => c.stop()); }
    const roll = this.add.container(W / 2, H + 60);
    let y = 0;
    for (const [k, s] of LINES) {
      if (k === 'h') { roll.add(text(this, 0, y, s, { size: 80, weight: 900, font: 'Montserrat, Poppins', ox: 0.5, oy: 0.5, stroke: '#5a1e7a', strokeW: 10 })); y += 120; }
      else if (k === 't') { roll.add(text(this, 0, y, s, { size: 34, weight: 800, ox: 0.5, oy: 0.5, color: '#ff8ce6' })); y += 56; }
      else { roll.add(text(this, 0, y, s, { size: 28, weight: 400, ox: 0.5, oy: 0.5, color: '#ffffff', align: 'center', wrap: 1500 })); y += s ? 46 : 30; }
    }
    if (this.cfg.ending && G.season) {
      const p = G.season;
      const mins = Math.round((p.playMs || 0) / 60000);
      roll.add(text(this, 0, y + 40, `${p.player.name} · ${this.cfg.ending === 'victoire' ? 'Vainqueur·e de la saison' : 'Finaliste de la saison'} · ${mins} min de jeu`, { size: 30, weight: 800, ox: 0.5, oy: 0.5, color: '#ffe66d' }));
      y += 100;
    }
    this.tweens.add({ targets: roll, y: -y + H / 2 - 80, duration: (y + H) * 22, ease: 'Linear', onComplete: () => this.end() });
    button(this, 1780, 1030, 220, 64, 'Passer', () => this.end(), { style: 'btn2', size: 24 });
  }

  async end() {
    if (this.ended) return;
    this.ended = true;
    await fadeOut(this, 600);
    const done = this.cfg._done;
    if (done) { this.scene.stop(); done({}); } else this.scene.start('Title');
  }
}
