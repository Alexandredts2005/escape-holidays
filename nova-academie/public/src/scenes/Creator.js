// Character creator: name, agreement (gender), layered look.
import { G, W, H } from '../core/state.js';
import { Audio } from '../core/audio.js';
import { need, berryAsset, playerLayers, bgAsset } from '../core/assets.js';
import { Actor } from '../ui/actor.js';
import { text, button, setBackground, fadeIn, fadeOut, sparkles, vignette, toast } from '../ui/ui.js';

const HAIRS = ['hair1_color1', 'hair1_color2', 'hair1_color3', 'hair2_color1', 'hair2_color2', 'hair2_color3', 'hair3_color1', 'hair4_color1'];
const HAIR_LABEL = ['Court blond', 'Court rose', 'Court châtain', 'Long brun', 'Long roux', 'Long doré', 'Afro', 'Très court'];
const TINTS = [0, 0xff7ab8, 0x8fb8ff, 0xb48cff, 0x7de8c8, 0xff9f5a, 0xf2f2f2, 0x6b4a3a];
const TINT_LABEL = ['Naturelle', 'Rose', 'Bleu', 'Violet', 'Menthe', 'Cuivre', 'Platine', 'Chocolat'];
const BODY_LABEL = ['Sweat décontracté', 'Top & jean', 'Robe & blouse', 'Chic noir', 'Pull cosy'];
const EXPRS = ['sourire', 'joie', 'malice', 'serieux', 'surprise', 'calme'];
export const PRESET_LOOKS = [
  { body: 1, skin: 3, outfit: 0, hair: 'hair1_color3', tint: 0 },
  { body: 2, skin: 5, outfit: 1, hair: 'hair2_color2', tint: 0 },
  { body: 3, skin: 2, outfit: 2, hair: 'hair3_color1', tint: 0 },
  { body: 4, skin: 6, outfit: 0, hair: 'hair2_color3', tint: 0 },
  { body: 5, skin: 1, outfit: 1, hair: 'hair4_color1', tint: 0 },
  { body: 1, skin: 6, outfit: 2, hair: 'hair1_color1', tint: 0x8fb8ff },
];

export class Creator extends Phaser.Scene {
  constructor() { super('Creator'); }

  init(data) {
    this.cfg = data;
    this.look = { ...(data.look || PRESET_LOOKS[Math.floor(Math.random() * PRESET_LOOKS.length)]) };
    this.gender = data.gender || 'x';
    this.exprI = 0;
  }

  async create() {
    await need(this, [bgAsset('chambre')]);
    fadeIn(this);
    Audio.music(this, 'bgm_chateau', { volume: 0.6 });
    setBackground(this, 'chambre', { dim: true });
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b0614, 0.35);
    vignette(this, 1);
    sparkles(this, 1);
    text(this, 1260, 70, this.cfg.title || 'Crée ton personnage', { size: 60, weight: 900, font: 'Montserrat, Poppins', ox: 0.5, oy: 0.5, stroke: '#3a1250', strokeW: 10 });
    this.add.nineslice(1260, 590, 'panel', undefined, 1120, 900, 28, 28, 28, 28);
    // name input (DOM)
    text(this, 760, 190, 'Prénom de scène', { size: 28, weight: 800, oy: 0.5 });
    const el = document.createElement('input');
    el.className = 'nova';
    el.maxLength = 14;
    el.placeholder = 'Ton prénom';
    el.value = this.cfg.name || '';
    this.nameEl = this.add.dom(1350, 190, el);
    this.rows = [];
    const row = (y, label, getter, prev, next) => {
      text(this, 760, y, label, { size: 28, weight: 800, oy: 0.5 });
      const val = text(this, 1350, y, getter(), { size: 28, weight: 600, ox: 0.5, oy: 0.5, color: '#ffe66d' });
      const upd = () => { val.setText(getter()); this.refresh(); };
      button(this, 1110, y, 80, 64, '◀', () => { prev(); upd(); }, { style: 'btn2', size: 28 });
      button(this, 1590, y, 80, 64, '▶', () => { next(); upd(); }, { style: 'btn2', size: 28 });
      this.rows.push(val);
    };
    const cyc = (k, n, base = 1) => [() => { this.look[k] = ((this.look[k] - base - 1 + n) % n) + base; }, () => { this.look[k] = ((this.look[k] - base + 1) % n) + base; }];
    const g = ['m', 'f', 'x'];
    const gl = { m: 'Masculin (prêt)', f: 'Féminin (prête)', x: 'Inclusif (prêt·e)' };
    row(290, 'Accords du texte', () => gl[this.gender], () => { this.gender = g[(g.indexOf(this.gender) + 2) % 3]; }, () => { this.gender = g[(g.indexOf(this.gender) + 1) % 3]; });
    row(390, 'Style', () => BODY_LABEL[this.look.body - 1], ...cyc('body', 5));
    row(490, 'Couleur de tenue', () => `Variante ${this.look.outfit + 1}`, ...cyc('outfit', 3, 0));
    row(590, 'Teint', () => `Teint ${this.look.skin}`, ...cyc('skin', 6));
    const hi = () => HAIRS.indexOf(this.look.hair);
    row(690, 'Coiffure', () => HAIR_LABEL[hi()], () => { this.look.hair = HAIRS[(hi() + HAIRS.length - 1) % HAIRS.length]; }, () => { this.look.hair = HAIRS[(hi() + 1) % HAIRS.length]; });
    const ti = () => Math.max(0, TINTS.indexOf(this.look.tint || 0));
    row(790, 'Couleur des cheveux', () => TINT_LABEL[ti()], () => { this.look.tint = TINTS[(ti() + TINTS.length - 1) % TINTS.length]; }, () => { this.look.tint = TINTS[(ti() + 1) % TINTS.length]; });
    button(this, 1000, 920, 360, 84, 'Aléatoire', () => {
      this.look = { body: 1 + Math.floor(Math.random() * 5), skin: 1 + Math.floor(Math.random() * 6), outfit: Math.floor(Math.random() * 3), hair: HAIRS[Math.floor(Math.random() * HAIRS.length)], tint: Math.random() < 0.6 ? 0 : TINTS[1 + Math.floor(Math.random() * 7)] };
      this.rows.forEach((r, i) => r.setText([gl[this.gender], BODY_LABEL[this.look.body - 1], `Variante ${this.look.outfit + 1}`, `Teint ${this.look.skin}`, HAIR_LABEL[hi()], TINT_LABEL[ti()]][i]));
      this.refresh();
    }, { style: 'btn2' });
    button(this, 1500, 920, 420, 84, this.cfg.confirm || 'Entrer au château', () => this.validate());
    if (this.cfg.cancelable !== false) button(this, 120, 1020, 180, 64, 'Retour', () => this.finish({ cancel: true }), { style: 'btn_off', size: 24 });
    this.preview = null;
    await this.refresh();
    this.time.addEvent({ delay: 2200, loop: true, callback: () => { this.exprI = (this.exprI + 1) % EXPRS.length; if (this.preview) this.preview.setExpr(EXPRS[this.exprI]); } });
  }

  async refresh() {
    const tok = (this.tok = (this.tok || 0) + 1);
    const layers = new Set();
    EXPRS.forEach((e) => playerLayers(this.look, e).forEach((l) => layers.add(l)));
    await need(this, [...layers].map(berryAsset));
    if (tok !== this.tok || !this.scene.isActive()) return;
    const old = this.preview;
    this.preview = new Actor(this, 'custom', EXPRS[this.exprI], { ...this.look });
    this.preview.src = 'berry';
    this.preview.place(360).setDepth(5);
    this.preview.y = H + 20;
    this.preview.setScale(0.85);
    if (old) old.destroy();
  }

  validate() {
    const name = (this.nameEl.node.value || '').trim().replace(/[<>{}|]/g, '');
    if (name.length < 2) {
      toast(this, 'Choisis un prénom (2 lettres minimum) !', '#ff8a8a');
      Audio.sfx(this, 'wrong', 0.6);
      return;
    }
    Audio.sfx(this, 'confirm', 0.8);
    this.finish({ player: { name, gender: this.gender, look: { ...this.look } } });
  }

  async finish(res) {
    if (this.done_) return;
    this.done_ = true;
    await fadeOut(this);
    const done = this.cfg._done;
    this.scene.stop();
    if (done) done(res);
  }
}
