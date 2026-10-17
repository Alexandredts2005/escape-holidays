// Dramatic reveals: professors' nominations, students' vote, public vote.
import { G, W, H, charName, rand } from '../core/state.js';
import { Audio } from '../core/audio.js';
import { need, bgAsset, portraitAsset } from '../core/assets.js';
import { text, button, setBackground, portrait, fadeIn, fadeOut, wait, burst, spotlights, vignette, confetti, makeLookPortrait } from '../ui/ui.js';

export class Verdict extends Phaser.Scene {
  constructor() { super('Verdict'); }

  init(data) { this.cfg = data; }

  async create() {
    const c = this.cfg;
    const ids = c.ids;
    await need(this, [bgAsset(c.bg || 'bureau'), ...ids.filter((i) => i !== 'player').map(portraitAsset)]);
    await makeLookPortrait(this, G.season.player.look);
    if (c.kind !== 'public') {
      for (const s of ['sting_verdict']) await need(this, [{ type: 'audio', key: s, url: [`assets/music/${s}.ogg`, `assets/music/${s}.mp3`] }]);
    }
    fadeIn(this);
    setBackground(this, c.bg || 'bureau', { dim: true });
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b0614, c.kind === 'public' ? 0.35 : 0.6);
    if (c.kind === 'public') spotlights(this, 4, 2, [0xff5cb4, 0x8b5cff, 0x31d2ff, 0xff5cb4]);
    vignette(this, 3);
    let res;
    if (c.kind === 'nomination') res = await this.nominations(c);
    else if (c.kind === 'students') res = await this.students(c);
    else res = await this.publicVote(c);
    await fadeOut(this, 500);
    const done = c._done;
    this.scene.stop();
    if (done) done(res || {});
  }

  heading(str, sub) {
    const t = text(this, W / 2, 110, str, { size: 64, weight: 900, font: 'Montserrat, Poppins', ox: 0.5, oy: 0.5, stroke: '#3a1250', strokeW: 10 }).setDepth(20);
    if (sub) text(this, W / 2, 180, sub, { size: 28, weight: 400, ox: 0.5, oy: 0.5, color: '#ffd6f3' }).setDepth(20);
    t.setScale(0.7).setAlpha(0);
    this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 450, ease: 'Back.out' });
  }

  grid(ids, size = 170) {
    const n = ids.length;
    const perRow = n > 5 ? Math.ceil(n / 2) : n;
    const out = {};
    ids.forEach((id, i) => {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const cnt = Math.min(perRow, n - row * perRow);
      const x = W / 2 + (col - (cnt - 1) / 2) * (size + 110);
      const y = (n > 5 ? 420 : 520) + row * (size + 140);
      const p = portrait(this, id, x, y, size, { label: charName(id) });
      p.setDepth(10);
      p.setScale(0);
      this.tweens.add({ targets: p, scale: 1, duration: 380, delay: i * 70, ease: 'Back.out' });
      out[id] = p;
    });
    return out;
  }

  async nominations(c) {
    Audio.music(this, 'bgm_tension', { volume: 0.7 });
    this.heading('Les nominations', c.sub || 'Les professeurs ont délibéré…');
    const all = c.ids;
    const cards = this.grid(all, 150);
    await wait(this, 2400);
    const scoreTxt = {};
    all.forEach((id) => {
      const p = cards[id];
      scoreTxt[id] = text(this, p.x, p.y - 112, `${c.scores[id] ?? '–'}/100`, { size: 24, weight: 800, ox: 0.5, oy: 0.5, color: '#ffe66d' }).setDepth(12).setAlpha(0);
      this.tweens.add({ targets: scoreTxt[id], alpha: 1, duration: 300 });
    });
    await wait(this, 1800);
    for (const id of c.nominees) {
      await wait(this, 1300);
      Audio.sfx(this, 'sting_verdict', 0.8);
      this.cameras.main.shake(250, 0.005);
      const p = cards[id];
      p.ring.setFillStyle(0xff3355);
      p.setDepth(15);
      const glow = this.add.image(p.x, p.y, 'glow').setTint(0xff3355).setScale(4).setBlendMode('ADD').setDepth(9).setAlpha(0);
      this.tweens.add({ targets: glow, alpha: 0.9, duration: 300, yoyo: true, repeat: 2, hold: 200, onComplete: () => glow.setAlpha(0.5) });
      this.tweens.add({ targets: p, scale: 1.25, duration: 300, ease: 'Back.out' });
      const tag = text(this, p.x, p.y + 125, 'NOMMÉ·E', { size: 26, weight: 900, ox: 0.5, oy: 0.5, color: '#ff6b81', stroke: '#1a0b2e', strokeW: 6 }).setDepth(16);
      tag.setScale(0);
      this.tweens.add({ targets: tag, scale: 1, duration: 300, ease: 'Back.out' });
    }
    all.filter((id) => !c.nominees.includes(id)).forEach((id) => this.tweens.add({ targets: cards[id], alpha: 0.45, duration: 600 }));
    await wait(this, 1500);
    await this.continueBtn();
    return {};
  }

  async students(c) {
    Audio.music(this, 'bgm_tension', { volume: 0.6 });
    const noms = c.nominees;
    this.heading('Le vote des élèves', c.playerNominated ? 'Tes camarades votent pour sauver l\'un·e des nommé·es…' : 'Qui veux-tu sauver ?');
    const cards = this.grid(noms, 220);
    const counters = {};
    noms.forEach((id) => {
      counters[id] = text(this, cards[id].x, cards[id].y + 175, '0 voix', { size: 34, weight: 900, ox: 0.5, oy: 0.5, color: '#ffe66d' }).setDepth(12);
    });
    let playerChoice = null;
    if (!c.playerNominated) {
      await wait(this, 900);
      playerChoice = await new Promise((res) => {
        const btns = noms.map((id) => {
          const b = button(this, cards[id].x, 880, 300, 80, `Sauver ${charName(id)}`, () => { btns.forEach((x) => x.destroy()); res(id); }, { size: 26 });
          b.setDepth(30);
          return b;
        });
      });
      burst(this, cards[playerChoice].x, cards[playerChoice].y, 0xffb3e6, 20, 30);
    }
    const result = c.vote(playerChoice);
    await wait(this, 800);
    const counts = {};
    noms.forEach((id) => { counts[id] = 0; });
    for (const b of result.ballots) {
      await wait(this, 650);
      counts[b.to]++;
      counters[b.to].setText(`${counts[b.to]} voix`);
      this.tweens.add({ targets: counters[b.to], scale: 1.3, duration: 120, yoyo: true });
      Audio.sfx(this, 'select', 0.5);
      const fromName = b.from === 'player' ? 'Toi' : charName(b.from);
      const t = text(this, cards[b.to].x, cards[b.to].y - 150, fromName, { size: 24, weight: 800, ox: 0.5, oy: 0.5, color: '#ffffff' }).setDepth(30);
      this.tweens.add({ targets: t, y: t.y - 50, alpha: 0, duration: 900, onComplete: () => t.destroy() });
    }
    await wait(this, 900);
    const saved = result.saved;
    Audio.sfx(this, 'jingle_good', 0.7);
    burst(this, cards[saved].x, cards[saved].y, 0x7dffb0, 30, 30);
    this.tweens.add({ targets: cards[saved], scale: 1.25, duration: 400, ease: 'Back.out' });
    cards[saved].ring.setFillStyle(0x3ddc84);
    noms.filter((id) => id !== saved).forEach((id) => { cards[id].ring.setFillStyle(0xff3355); this.tweens.add({ targets: cards[id], alpha: 0.7, duration: 400 }); });
    const msg = saved === 'player' ? 'Tes camarades t\'ont sauvé·e !' : `${charName(saved)} est sauvé·e par les élèves !`;
    text(this, W / 2, 1000, msg, { size: 40, weight: 900, ox: 0.5, oy: 0.5, color: '#7dffb0', stroke: '#1a0b2e', strokeW: 8 }).setDepth(30);
    await wait(this, 1800);
    await this.continueBtn(900);
    return { saved, playerChoice };
  }

  async publicVote(c) {
    await need(this, [{ type: 'audio', key: 'mus_bgm_suspense', url: ['assets/music/bgm_suspense.ogg', 'assets/music/bgm_suspense.mp3'] }]);
    Audio.music(this, 'bgm_suspense', { volume: 0.85, loop: false, fade: 200 });
    const ids = c.ids;
    this.heading(c.title || 'Le verdict du public', c.sub || 'Les votes sont clos…');
    const cards = this.grid(ids, 230);
    const bars = {};
    ids.forEach((id) => {
      const x = cards[id].x;
      const bg = this.add.rectangle(x, 860, 260, 34, 0x000000, 0.5).setDepth(12);
      const fg = this.add.rectangle(x - 130, 860, 2, 34, 0xff5cb4).setOrigin(0, 0.5).setDepth(13);
      const pct = text(this, x, 925, '…', { size: 46, weight: 900, ox: 0.5, oy: 0.5, font: 'Montserrat, Poppins' }).setDepth(13);
      bars[id] = { bg, fg, pct };
    });
    await wait(this, 2500);
    // suspense: bars wobble
    const fake = {};
    ids.forEach((id) => { fake[id] = 100 / ids.length; });
    for (let k = 0; k < 14; k++) {
      ids.forEach((id) => {
        const v = Phaser.Math.Clamp(fake[id] + rand(-14, 14), 5, 90);
        this.tweens.add({ targets: bars[id].fg, width: 2.6 * v, duration: 300 });
      });
      await wait(this, 330);
    }
    Audio.stop(this, 200);
    await wait(this, 600);
    await need(this, [{ type: 'audio', key: 'sting_verdict', url: ['assets/music/sting_verdict.ogg', 'assets/music/sting_verdict.mp3'] }]);
    Audio.sfx(this, 'sting_verdict', 1);
    this.cameras.main.flash(500, 255, 255, 255);
    ids.forEach((id) => {
      const v = c.result[id];
      this.tweens.add({ targets: bars[id].fg, width: 2.6 * v, duration: 900, ease: 'Cubic.out' });
      let cur = { v: 0 };
      this.tweens.add({ targets: cur, v, duration: 900, onUpdate: () => bars[id].pct.setText(`${Math.round(cur.v)} %`) });
    });
    await wait(this, 1400);
    const out = c.out;
    const winner = c.winner;
    ids.forEach((id) => {
      if (id === out) {
        cards[id].ring.setFillStyle(0x555566);
        this.tweens.add({ targets: cards[id], alpha: 0.55, scale: 0.92, duration: 600 });
        bars[id].fg.setFillStyle(0x666677);
      } else {
        cards[id].ring.setFillStyle(0x3ddc84);
        bars[id].fg.setFillStyle(0x3ddc84);
        this.tweens.add({ targets: cards[id], scale: 1.18, duration: 500, ease: 'Back.out' });
        burst(this, cards[id].x, cards[id].y, 0xffe66d, 26, 30);
      }
    });
    await need(this, [{ type: 'audio', key: 'applause_big', url: ['assets/music/applause_big.ogg', 'assets/music/applause_big.mp3'] }]);
    this.sound.play('applause_big', { volume: G.settings.sfx * 0.9 });
    if (winner) { const cf = confetti(this); this.time.delayedCall(5000, () => cf.stop()); }
    const msg = winner
      ? `${winner === 'player' ? G.season.player.name : charName(winner)} remporte NOVA Académie !`
      : (out === 'player' ? 'Le public ne t\'a pas sauvé·e…' : `${charName(out)} quitte l'aventure.`);
    text(this, W / 2, 1010, msg, { size: 44, weight: 900, ox: 0.5, oy: 0.5, color: winner || out !== 'player' ? '#ffe66d' : '#ff8a8a', stroke: '#1a0b2e', strokeW: 8 }).setDepth(30);
    await wait(this, 2200);
    await this.continueBtn(780);
    return { out };
  }

  continueBtn(y = 1000) {
    return new Promise((res) => {
      const b = button(this, 1700, y, 340, 80, 'Continuer', () => res(), { size: 28 });
      b.setDepth(40);
    });
  }
}
