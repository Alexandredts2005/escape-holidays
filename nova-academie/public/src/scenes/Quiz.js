// Solo quiz vs NPC rivals (lessons, evaluations, repêchage).
import { G, W, H, shuffle, rand, charName } from '../core/state.js';
import { Audio } from '../core/audio.js';
import { need, bgAsset, portraitAsset } from '../core/assets.js';
import { text, button, setBackground, portrait, fadeIn, fadeOut, wait, sparkles, floatText, burst, makeLookPortrait, vignette } from '../ui/ui.js';
import { prepare, askQuestion, reveal, clearQuestion } from '../ui/quizui.js';

const asked = new Set();

export function drawQuestions(n, { minD = 1, maxD = 3, themes = null } = {}) {
  let pool = G.quiz.filter((q) => (q.d || 1) >= minD && (q.d || 1) <= maxD && (!themes || themes.includes(q.t)));
  let fresh = pool.filter((q) => !asked.has(q.q));
  if (fresh.length < n) { pool.forEach((q) => asked.delete(q.q)); fresh = pool; }
  const out = shuffle(fresh).slice(0, n);
  out.forEach((q) => asked.add(q.q));
  return out;
}

export class Quiz extends Phaser.Scene {
  constructor() { super('Quiz'); }

  init(data) {
    this.cfg = data;
  }

  async create() {
    const c = this.cfg;
    const rivals = (c.rivals || []).slice(0, 3);
    await need(this, [bgAsset(c.bg || 'salle_musique'), ...rivals.map(portraitAsset)]);
    if (G.season) await makeLookPortrait(this, G.season.player.look);
    fadeIn(this);
    Audio.music(this, c.music || 'bgm_quiz', { volume: 0.55 });
    setBackground(this, c.bg || 'salle_musique', { dim: true });
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b0614, 0.55);
    vignette(this, 2);
    sparkles(this, 1);
    this.players = [{ id: 'player', name: G.season ? G.season.player.name : 'Toi', score: 0, ok: 0 }]
      .concat(rivals.map((id) => ({ id, name: charName(id), score: 0, ok: 0, skill: (G.cast.chars[id].stats.culture || 50) / 100 })));
    this.buildBoard();
    const qs = drawQuestions(c.count || 8, { minD: c.minD || 1, maxD: c.maxD || 3, themes: c.themes });
    await this.intro(c.title || 'Quiz culture musicale', c.subtitle || `${qs.length} questions · réponds vite pour gagner plus de points !`);
    for (let i = 0; i < qs.length; i++) {
      await this.round(prepare(qs[i]), i, qs.length);
    }
    await this.outro(qs.length);
  }

  buildBoard() {
    this.board = this.players.map((p, i) => {
      const x = 160;
      const y = 470 + i * 150;
      const por = portrait(this, p.id, x, y, 104);
      const nm = text(this, x + 72, y - 22, p.name, { size: 26, weight: 800, oy: 0.5 });
      const sc = text(this, x + 72, y + 16, '0', { size: 30, weight: 900, oy: 0.5, color: '#ffe66d', font: 'Montserrat, Poppins' });
      const mark = text(this, x + 40, y - 40, '', { size: 34, ox: 0.5, oy: 0.5 });
      return { p, por, nm, sc, mark };
    });
  }

  async intro(title, sub) {
    const t = text(this, W / 2, 420, title, { size: 76, weight: 900, font: 'Montserrat, Poppins', ox: 0.5, oy: 0.5, stroke: '#5a1e7a', strokeW: 10 });
    const s = text(this, W / 2, 520, sub, { size: 32, weight: 400, ox: 0.5, oy: 0.5, color: '#ffd6f3' });
    t.setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 500, ease: 'Back.out' });
    Audio.sfx(this, 'jingle_quiz', 0.6);
    await wait(this, 2200);
    this.tweens.add({ targets: [t, s], alpha: 0, duration: 300 });
    await wait(this, 300);
    t.destroy();
    s.destroy();
  }

  async round(q, i, total) {
    this.board.forEach((b) => b.mark.setText(''));
    const npcAns = this.players.slice(1).map((p) => {
      const diffPen = ((q.d || 1) - 1) * 0.12;
      const right = Math.random() < Math.max(0.2, p.skill * 0.85 - diffPen + 0.1);
      const tm = rand(2.5, 11);
      const choice = right ? q.correct : [0, 1, 2, 3].filter((k) => k !== q.correct)[Math.floor(Math.random() * 3)];
      return { p, choice, tm };
    });
    const timers = npcAns.map((a, k) => this.time.delayedCall(a.tm * 1000, () => {
      this.board[k + 1].mark.setText('✔').setColor('#ffffff');
      Audio.sfx(this, 'select', 0.3);
    }));
    const { choice, time, ui } = await askQuestion(this, q, { duration: this.cfg.duration || 15, index: i, total });
    timers.forEach((tm) => tm.remove());
    await wait(this, 400);
    reveal(this, ui, q.correct, choice);
    const pts = (ok, tm) => (ok ? Math.round(500 + 500 * Math.max(0, 1 - tm / 15)) : 0);
    const me = this.players[0];
    if (choice === q.correct) {
      const g = pts(true, time);
      me.score += g;
      me.ok++;
      floatText(this, 300, 450, `+${g}`, '#7dffb0');
      burst(this, ui.btns[q.correct].x, ui.btns[q.correct].y, 0x7dffb0, 16, 200);
    }
    npcAns.forEach((a, k) => {
      const ok = a.choice === q.correct;
      if (ok) { a.p.score += pts(true, a.tm); a.p.ok++; }
      this.board[k + 1].mark.setText(ok ? '✔' : '✖').setColor(ok ? '#7dffb0' : '#ff6b81');
    });
    this.board[0].mark.setText(choice === q.correct ? '✔' : '✖').setColor(choice === q.correct ? '#7dffb0' : '#ff6b81');
    this.board.forEach((b) => b.sc.setText(b.p.score.toLocaleString('fr-FR')));
    let fact = null;
    if (q.f) {
      fact = text(this, W / 2, 900, 'Le savais-tu ? ' + q.f, { size: 28, weight: 400, ox: 0.5, oy: 0.5, align: 'center', wrap: 1400, color: '#fff3c4' }).setDepth(120);
    }
    await wait(this, q.f ? 3400 : 2000);
    if (fact) fact.destroy();
    clearQuestion(ui);
  }

  async outro(total) {
    Audio.stop(this, 600);
    const ranked = this.players.slice().sort((a, b) => b.score - a.score);
    const rank = ranked.indexOf(this.players[0]) + 1;
    const me = this.players[0];
    const acc = me.ok / total;
    const c = this.add.container(W / 2, H / 2).setDepth(200);
    c.add(this.add.nineslice(0, 0, 'panel', undefined, 1000, 720, 28, 28, 28, 28));
    c.add(text(this, 0, -290, 'Classement', { size: 54, weight: 900, ox: 0.5, oy: 0.5, font: 'Montserrat, Poppins' }));
    ranked.forEach((p, i) => {
      const y = -170 + i * 110;
      c.add(text(this, -380, y, `${i + 1}.`, { size: 44, weight: 900, oy: 0.5, color: i === 0 ? '#ffe66d' : '#ffffff' }));
      c.add(portrait(this, p.id, -250, y, 84));
      c.add(text(this, -180, y, p.name, { size: 34, weight: 800, oy: 0.5, color: p.id === 'player' ? '#ff8ce6' : '#ffffff' }));
      c.add(text(this, 380, y, `${p.score.toLocaleString('fr-FR')} pts`, { size: 32, weight: 800, ox: 1, oy: 0.5, color: '#ffe66d' }));
    });
    c.add(text(this, 0, 260, `${me.ok}/${total} bonnes réponses`, { size: 30, weight: 600, ox: 0.5, oy: 0.5, color: '#d9c8ff' }));
    Audio.sfx(this, rank === 1 ? 'jingle_win' : 'jingle_good', 0.7);
    if (rank === 1) burst(this, W / 2, H / 2 - 170, 0xffe66d, 30, 260);
    await new Promise((res) => {
      const b = button(this, W / 2, H / 2 + 380, 420, 90, 'Continuer', () => res());
      b.setDepth(210);
    });
    await fadeOut(this);
    const done = this.cfg._done;
    this.scene.stop();
    if (done) done({ acc, rank, ok: me.ok, total, score: me.score });
  }
}
