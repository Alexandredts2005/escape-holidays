// Shared quiz question UI (solo + multiplayer).
import { W, H, shuffle } from '../core/state.js';
import { Audio } from '../core/audio.js';
import { text, button } from './ui.js';

export const THEME_COL = {
  'Chanson française': 0xff5cb4, 'Pop internationale': 0x31d2ff, 'Comédies musicales': 0xffc93c, 'Solfège & instruments': 0x8b5cff,
  'Cinéma & séries': 0xff8a3d, 'Culture générale': 0x3ddc84, 'Danse': 0xff6bd6, 'Théâtre': 0xb8e994, 'Histoire de la musique': 0x82ccdd,
  'Géographie': 0x4cd3c2, 'Sciences': 0x70a1ff, 'Sport': 0xffa502, 'Littérature': 0xeccc68, 'Art': 0xff7f50,
};

export function prepare(q) {
  const order = shuffle([0, 1, 2, 3]);
  return { ...q, answers: order.map((i) => q.a[i]), correct: order.indexOf(0) };
}

// Renders a question; resolves {choice, time} (choice -1 = timeout). opts: {duration, index, total, locked}
export function askQuestion(scene, q, opts = {}) {
  const dur = opts.duration || 15;
  const root = scene.add.container(0, 0).setDepth(opts.depth || 100);
  const col = THEME_COL[q.t] || 0xff5cb4;
  const theme = scene.add.nineslice(W / 2, 150, 'btn', undefined, 520, 60, 30, 30, 30, 30).setTint(col);
  const themeT = text(scene, W / 2, 148, q.t + (opts.total ? `  ·  ${opts.index + 1}/${opts.total}` : ''), { size: 26, weight: 800, ox: 0.5, oy: 0.5 });
  const qp = scene.add.nineslice(W / 2, 320, 'panel', undefined, 1500, 230, 28, 28, 28, 28);
  const qt = text(scene, W / 2, 320, q.q, { size: q.q.length > 90 ? 36 : 42, weight: 800, ox: 0.5, oy: 0.5, align: 'center', wrap: 1380 });
  root.add([theme, themeT, qp, qt]);
  // timer ring
  const ring = scene.add.graphics();
  const timerT = text(scene, 1780, 320, String(dur), { size: 44, weight: 900, ox: 0.5, oy: 0.5 });
  root.add([ring, timerT]);
  const btns = [];
  const letters = ['A', 'B', 'C', 'D'];
  const styles = ['btn', 'btn2', 'btn', 'btn2'];
  const t0 = scene.time.now;
  const uiObj = { root, btns, ring, timerT };
  return new Promise((resolve) => {
    let done = false;
    const finish = (choice) => {
      if (done) return;
      done = true;
      ev.remove();
      btns.forEach((b, i) => { b.setEnabled(false); if (i === choice) b.setAlpha(1).setStyle('btn_off'); });
      if (choice >= 0) { btns[choice].setAlpha(1); }
      resolve({ choice, time: (scene.time.now - t0) / 1000, ui: uiObj });
    };
    q.answers.forEach((ans, i) => {
      const x = W / 2 + (i % 2 ? 380 : -380);
      const y = 560 + Math.floor(i / 2) * 150;
      const b = button(scene, x, y, 720, 120, `${letters[i]}.  ${ans}`, () => finish(i), { style: styles[i], size: ans.length > 34 ? 26 : 32 });
      b.setDepth((opts.depth || 100) + 1);
      b.setAlpha(0);
      b.y = y + 40;
      scene.tweens.add({ targets: b, alpha: 1, y, duration: 260, delay: 120 + i * 70, ease: 'Cubic.out' });
      if (opts.locked) b.setEnabled(false);
      btns.push(b);
    });
    root.btns = btns;
    const keyH = (e) => {
      const k = e.key.toUpperCase();
      const idx = ['A', 'B', 'C', 'D', '1', '2', '3', '4'].indexOf(k);
      if (idx >= 0 && !done && !opts.locked) finish(idx % 4);
    };
    scene.input.keyboard.on('keydown', keyH);
    root.once('destroy', () => scene.input.keyboard.off('keydown', keyH));
    let lastSec = dur;
    const ev = scene.time.addEvent({
      delay: 50, loop: true, callback: () => {
        const el = (scene.time.now - t0) / 1000;
        const left = Math.max(0, dur - el);
        ring.clear();
        ring.lineStyle(12, 0x000000, 0.4).strokeCircle(1780, 320, 60);
        ring.lineStyle(12, left < 4 ? 0xff4d5a : 0xffc93c, 1);
        ring.beginPath();
        ring.arc(1780, 320, 60, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * left) / dur, false);
        ring.strokePath();
        const sec = Math.ceil(left);
        if (sec !== lastSec) {
          lastSec = sec;
          timerT.setText(String(sec));
          if (sec <= 3 && sec > 0) Audio.sfx(scene, 'tick', 0.6);
        }
        if (left <= 0) finish(-1);
      },
    });
    root.forceEnd = () => finish(-1);
    if (opts.onUi) opts.onUi(uiObj);
  });
}

export function reveal(scene, ui, correct, choice) {
  ui.btns.forEach((b, i) => {
    if (i === correct) {
      b.setStyle('btn_ok').setAlpha(1);
      scene.tweens.add({ targets: b, scale: 1.06, duration: 160, yoyo: true, repeat: 1 });
    } else if (i === choice) {
      b.setStyle('btn_bad').setAlpha(1);
      scene.tweens.add({ targets: b, x: b.x + 12, duration: 50, yoyo: true, repeat: 4 });
    } else b.setAlpha(0.35);
  });
  Audio.sfx(scene, choice === correct ? 'correct' : 'wrong', 0.8);
}

export function clearQuestion(ui) {
  ui.btns.forEach((b) => b.destroy());
  ui.root.destroy();
}
