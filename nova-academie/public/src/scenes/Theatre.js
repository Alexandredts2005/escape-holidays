// Theatre minigame: pick the right intention for classic (public-domain) lines, then a memory test.
import { G, W, H, shuffle, pick } from '../core/state.js';
import { Audio } from '../core/audio.js';
import { need, bgAsset, actorAssets } from '../core/assets.js';
import { Actor } from '../ui/actor.js';
import { text, button, setBackground, fadeIn, fadeOut, wait, burst, floatText, vignette, spotlights } from '../ui/ui.js';

const EMO = {
  colere: { label: 'Colère', expr: 'serieux', col: 'btn_bad' },
  joie: { label: 'Joie', expr: 'joie', col: 'btn_ok' },
  tristesse: { label: 'Tristesse', expr: 'triste', col: 'btn2' },
  peur: { label: 'Peur', expr: 'inquiet', col: 'btn2' },
  amour: { label: 'Amour', expr: 'sourire', col: 'btn' },
  ironie: { label: 'Ironie', expr: 'malice', col: 'btn' },
  fierte: { label: 'Fierté', expr: 'sourire', col: 'btn' },
  surprise: { label: 'Surprise', expr: 'surprise', col: 'btn2' },
};

export class Theatre extends Phaser.Scene {
  constructor() { super('Theatre'); }

  init(data) { this.cfg = data; }

  async create() {
    const sc = this.cfg.piece ? G.theatre.find((p) => p.id === this.cfg.piece) : pick(G.theatre);
    this.piece = sc;
    await need(this, [bgAsset('theatre'), ...actorAssets('player', Object.values(EMO).map((e) => e.expr)), ...actorAssets('odile', ['neutre', 'joie', 'doute', 'serieux'])]);
    fadeIn(this);
    Audio.music(this, 'bgm_confession', { volume: 0.4 });
    setBackground(this, 'theatre', { dim: true });
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b0614, 0.35);
    spotlights(this, 3, 2, [0xfff1c4, 0xffd27a, 0xfff1c4]);
    vignette(this, 3);
    this.me = new Actor(this, 'player', 'neutre');
    this.me.place(330).setDepth(10).enter(330, 'fade');
    this.odile = new Actor(this, 'odile', 'neutre');
    this.odile.place(1620).setDepth(10).enter(1620, 'fade');
    this.score = 0;
    this.total = 0;
    const head = text(this, W / 2, 90, `${sc.title}`, { size: 52, weight: 900, font: 'Montserrat, Poppins', ox: 0.5, oy: 0.5, stroke: '#3a1250', strokeW: 8 });
    text(this, W / 2, 150, `${sc.author} · ${sc.year}`, { size: 26, weight: 400, ox: 0.5, oy: 0.5, color: '#ffd6f3' });
    head.setDepth(50);
    await this.say(`Odile : « ${sc.intro || 'Trouve la bonne intention pour chaque réplique. Le texte, c\'est la musique de l\'âme.'} »`, 3200);
    const lines = sc.lines.slice(0, 6);
    for (let i = 0; i < lines.length; i++) await this.intention(lines[i], i, lines.length);
    await this.say('Odile : « Maintenant, la mémoire ! Retrouve le mot manquant. »', 2400);
    const mem = shuffle(lines.filter((l) => l.w)).slice(0, 3);
    for (const l of mem) await this.memory(l);
    await this.finish();
  }

  say(str, ms) {
    return new Promise((res) => {
      const t = text(this, W / 2, 960, str, { size: 30, weight: 600, ox: 0.5, oy: 0.5, align: 'center', wrap: 1300, color: '#fff3c4' }).setDepth(60);
      t.setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 250 });
      this.time.delayedCall(ms, () => { t.destroy(); res(); });
    });
  }

  card(str, who) {
    const c = this.add.container(W / 2, 400).setDepth(40);
    const p = this.add.nineslice(0, 0, 'panel_light', undefined, 1100, 300, 28, 28, 28, 28);
    const w = text(this, -500, -120, who || '', { size: 26, weight: 800, color: '#7a2a8c', oy: 0.5 });
    const t = text(this, 0, 10, `« ${str} »`, { size: str.length > 110 ? 32 : 38, weight: 600, ox: 0.5, oy: 0.5, align: 'center', wrap: 1000, color: '#2a0f45', shadow: false, font: 'Poppins' });
    c.add([p, w, t]);
    c.setScale(0.9).setAlpha(0);
    this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 280, ease: 'Back.out' });
    return c;
  }

  async intention(line, i, n) {
    this.total++;
    const c = this.card(line.text, line.who);
    const opts = shuffle([line.emo, ...shuffle(Object.keys(EMO).filter((k) => k !== line.emo)).slice(0, 3)]);
    const timerBar = this.add.rectangle(W / 2 - 500, 575, 1000, 10, 0xffc93c).setOrigin(0, 0.5).setDepth(41);
    const choice = await new Promise((res) => {
      const btns = opts.map((k, j) => {
        const b = button(this, W / 2 - 540 + j * 360, 680, 330, 96, EMO[k].label, () => { btns.forEach((x) => x.setEnabled(false)); res({ k, btns }); }, { style: EMO[k].col, size: 32 });
        b.setDepth(42);
        return b;
      });
      this.tweens.add({ targets: timerBar, width: 0, duration: 9000, onComplete: () => res({ k: null, btns }) });
    });
    this.tweens.killTweensOf(timerBar);
    timerBar.destroy();
    const ok = choice.k === line.emo;
    choice.btns.forEach((b, j) => {
      if (opts[j] === line.emo) b.setStyle('btn_ok');
      else if (opts[j] === choice.k) b.setStyle('btn_bad');
      else b.setAlpha(0.3);
    });
    this.me.setExpr(EMO[choice.k || line.emo].expr);
    this.me.talk();
    if (ok) {
      this.score++;
      Audio.sfx(this, 'correct', 0.7);
      burst(this, 330, 400, 0xffe66d, 18, 60);
      this.odile.setExpr('joie');
      floatText(this, 1620, 380, pick(['Juste !', 'Magnifique !', 'Oui !', 'Bravo !']), '#7dffb0');
    } else {
      Audio.sfx(this, 'wrong', 0.7);
      this.odile.setExpr('doute');
      floatText(this, 1620, 380, `Plutôt : ${EMO[line.emo].label}`, '#ff8a8a', 34);
    }
    await wait(this, 1600);
    choice.btns.forEach((b) => b.destroy());
    c.destroy();
    this.odile.setExpr('neutre');
  }

  async memory(line) {
    this.total++;
    const hole = line.text.replace(line.w, '______');
    const c = this.card(hole, 'Mot manquant');
    const opts = shuffle([line.w, ...(line.alt || ['silence', 'lumière'])]).slice(0, 3);
    if (!opts.includes(line.w)) opts[0] = line.w;
    const ch = await new Promise((res) => {
      const btns = opts.map((wd, j) => {
        const b = button(this, W / 2 - 400 + j * 400, 680, 360, 96, wd, () => { btns.forEach((x) => x.setEnabled(false)); res({ wd, btns }); }, { style: j % 2 ? 'btn2' : 'btn', size: 32 });
        b.setDepth(42);
        return b;
      });
    });
    const ok = ch.wd === line.w;
    ch.btns.forEach((b, j) => {
      if (opts[j] === line.w) b.setStyle('btn_ok');
      else if (opts[j] === ch.wd) b.setStyle('btn_bad');
      else b.setAlpha(0.3);
    });
    if (ok) { this.score++; Audio.sfx(this, 'correct', 0.7); this.odile.setExpr('joie'); } else { Audio.sfx(this, 'wrong', 0.7); this.odile.setExpr('doute'); }
    await wait(this, 1400);
    ch.btns.forEach((b) => b.destroy());
    c.destroy();
  }

  async finish() {
    const acc = this.score / Math.max(1, this.total);
    const msg = acc >= 0.85 ? 'Odile : « Tu as fait vibrer la salle. Bravo. »' : acc >= 0.6 ? 'Odile : « C\'est prometteur. Travaille tes silences. »' : 'Odile : « On reprendra. Le théâtre est un muscle. »';
    this.odile.setExpr(acc >= 0.6 ? 'joie' : 'serieux');
    Audio.sfx(this, acc >= 0.6 ? 'applause_small' : 'jingle_oops', 0.8);
    const t = text(this, W / 2, 420, `${this.score}/${this.total}`, { size: 140, weight: 900, font: 'Montserrat, Poppins', ox: 0.5, oy: 0.5, stroke: '#3a1250', strokeW: 12 }).setDepth(50);
    t.setScale(0.3);
    this.tweens.add({ targets: t, scale: 1, duration: 400, ease: 'Back.out' });
    await this.say(msg, 2600);
    await new Promise((res) => button(this, W / 2, 700, 420, 90, 'Continuer', res).setDepth(60));
    await fadeOut(this);
    const done = this.cfg._done;
    this.scene.stop();
    if (done) done({ acc, score: this.score, total: this.total });
  }
}
