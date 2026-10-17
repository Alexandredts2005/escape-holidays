// Visual-novel scene: runs a story script (see core/script.js).
import { G, W, H, fmt, charName, charColor, writeSave } from '../core/state.js';
import { parseScript } from '../core/script.js';
import { applyFx, evalCond } from '../core/season.js';
import { Audio } from '../core/audio.js';
import { need, bgAsset, actorAssets } from '../core/assets.js';
import { Actor, POS } from '../ui/actor.js';
import { text, panel, button, setBackground, fadeIn, fadeOut, wait, confetti, floatText, STAT_LABEL } from '../ui/ui.js';
import { STORY } from '../data/story.js';

const cache = {};

export class Story extends Phaser.Scene {
  constructor() { super('Story'); }

  init(data) {
    this.data_ = data;
    this.vars = data.vars || {};
    this.actors = {};
    this.bg = null;
    this.skipping = !!window.NOVA_AUTOTEST;
    this.auto = false;
  }

  create() {
    fadeIn(this, 350);
    const key = this.data_.label;
    const src = typeof key === 'string' && STORY[key] !== undefined ? STORY[key] : (this.data_.src || '');
    if (!cache[key] || this.data_.src) cache[key] = parseScript(src);
    this.prog = cache[key];
    this.pc = 0;
    this.dead = false;
    this.events.once('shutdown', () => { this.dead = true; });
    this.buildUI();
    this.run();
  }

  buildUI() {
    this.box = this.add.container(0, 0).setDepth(100);
    const p = panel(this, W / 2, 920, 1760, 250, 'panel', 0.96);
    this.nameBg = this.add.nineslice(250, 790, 'btn', undefined, 360, 64, 30, 30, 30, 30);
    this.nameText = text(this, 250, 788, '', { size: 30, weight: 800, ox: 0.5, oy: 0.5 });
    this.lineText = text(this, 140, 832, '', { size: 34, weight: 400, wrap: 1640, lineSpacing: 10 });
    this.arrow = text(this, 1790, 1000, '▼', { size: 28, color: '#ff8ce6', ox: 0.5, oy: 0.5 });
    this.tweens.add({ targets: this.arrow, y: 1010, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
    this.box.add([p, this.nameBg, this.nameText, this.lineText, this.arrow]);
    this.box.setVisible(false);

    this.tools = this.add.container(0, 0).setDepth(200);
    const auto = button(this, 1560, 50, 150, 56, 'Auto', () => {
      this.auto = !this.auto;
      auto.setStyle(this.auto ? 'btn_ok' : 'btn2');
      if (this.auto && this.waitingAdvance) this.advance();
    }, { style: 'btn2', size: 24 });
    const skip = button(this, 1730, 50, 170, 56, 'Passer ⏩', () => {
      this.skipping = true;
      if (this.waitingAdvance) this.advance();
    }, { style: 'btn2', size: 24 });
    this.tools.add([auto, skip]);

    this.input.on('pointerdown', (p, over) => {
      if (over && over.length) return;
      this.advance();
    });
    this.input.keyboard.on('keydown-SPACE', () => this.advance());
    this.input.keyboard.on('keydown-ENTER', () => this.advance());
    this.input.keyboard.on('keydown-CTRL', () => { this.skipping = true; if (this.waitingAdvance) this.advance(); });
  }

  advance() {
    if (this.choosing) return;
    if (this.typing) {
      this.finishTyping();
      return;
    }
    if (this.waitingAdvance) {
      this.waitingAdvance = false;
      const r = this.advanceResolve;
      this.advanceResolve = null;
      if (r) r();
    }
  }

  resolveWho(who) {
    if (who.startsWith('$')) return this.vars[who.slice(1)] || who;
    return who;
  }

  sub(str) {
    return fmt(str.replace(/\{@(\w+)\}/g, (_, k) => {
      const v = this.vars[k];
      if (v === undefined) return '';
      return G.cast.chars[v] ? charName(v) : (v === 'player' ? charName('player') : v);
    }));
  }

  async run() {
    const ops = this.prog.ops;
    while (this.pc < ops.length) {
      const op = ops[this.pc++];
      if (this.dead) return;
      if (op.t === 'say') await this.say(op);
      else if (op.t === 'choice') await this.choice(op);
      else if (op.t === 'if') {
        if (evalCond(op.cond, this.vars)) this.jump(op.label);
      } else if (op.t === 'cmd') {
        const r = await this.cmd(op.cmd, op.args.map((a) => (a.startsWith('$') ? this.resolveWho(a) : a)));
        if (r === 'end') break;
      }
    }
    await this.finish();
  }

  jump(label) {
    if (label === 'end') { this.pc = this.prog.ops.length; return; }
    const at = this.prog.labels[label];
    if (at === undefined) console.warn('missing label', label);
    else this.pc = at;
  }

  async finish() {
    this.box.setVisible(false);
    await fadeOut(this, 350);
    if (G.settings.autoSave) writeSave();
    const done = this.data_._done;
    this.scene.stop();
    if (done) done(this.result || {});
  }

  async cmd(cmd, a) {
    const fast = this.skipping;
    switch (cmd) {
      case 'bg': {
        const id = a[0];
        await need(this, [bgAsset(id)]);
        const img = setBackground(this, id, { night: a.includes('night'), dim: a.includes('dim'), depth: -1 });
        if (this.bg && !a.includes('cut') && !fast) {
          img.setAlpha(0);
          const old = this.bg;
          this.tweens.add({ targets: img, alpha: 1, duration: 600, onComplete: () => old.destroy() });
        } else if (this.bg) this.bg.destroy();
        this.bg = img;
        img.setDepth(0);
        break;
      }
      case 'music':
        if (a[0] === 'stop') Audio.stop(this);
        else Audio.music(this, a[0]);
        break;
      case 'sfx':
        if (a[0].startsWith('applause') || a[0].startsWith('jingle') || a[0].startsWith('sting')) {
          await need(this, [{ type: 'audio', key: a[0], url: [`assets/music/${a[0]}.ogg`, `assets/music/${a[0]}.mp3`] }]);
        }
        Audio.sfx(this, a[0], 0.9);
        break;
      case 'show': {
        const [id, expr = 'neutre', pos = 'center', how = 'slide'] = a;
        await need(this, actorAssets(id, [expr]));
        if (this.actors[id]) {
          this.actors[id].setExpr(expr);
          this.actors[id].moveTo(pos);
        } else {
          const act = new Actor(this, id, expr);
          act.setDepth(10);
          act.enter(pos, fast ? 'fade' : how);
          this.actors[id] = act;
        }
        break;
      }
      case 'hide':
        if (this.actors[a[0]]) {
          const act = this.actors[a[0]];
          delete this.actors[a[0]];
          if (fast) act.destroy(); else act.exit();
        }
        break;
      case 'hideall':
        Object.values(this.actors).forEach((act) => act.exit());
        this.actors = {};
        if (!fast) await wait(this, 300);
        break;
      case 'move':
        if (this.actors[a[0]]) this.actors[a[0]].moveTo(a[1]);
        break;
      case 'expr':
        if (this.actors[a[0]]) await this.actors[a[0]].setExpr(a[1]);
        break;
      case 'jump':
        if (this.actors[a[0]]) this.actors[a[0]].jump();
        break;
      case 'wait':
        if (!fast) await wait(this, parseFloat(a[0] || '1') * 1000);
        break;
      case 'shake':
        this.cameras.main.shake(350, 0.006);
        break;
      case 'flash':
        this.cameras.main.flash(400, 255, 255, 255);
        break;
      case 'confetti': {
        const c = confetti(this);
        this.time.delayedCall(3000, () => c.stop());
        break;
      }
      case 'stat': {
        const gains = applyFx(a.join(' ').replace(/\$(\w+)/g, (_, k) => this.vars[k] || k));
        this.showGains(gains);
        break;
      }
      case 'set':
        this.result = this.result || {};
        this.result[a[0]] = a[1];
        break;
      case 'goto':
        this.jump(a[0]);
        break;
      case 'end':
        return 'end';
      case 'title':
      case 'card':
        await this.card(this.sub(a[0]), fast);
        break;
      default:
        console.warn('unknown cmd', cmd);
    }
    return null;
  }

  showGains(gains) {
    let y = 300;
    for (const g of gains) {
      if (g.kind === 'stat') {
        const lab = STAT_LABEL[g.id] || g.id;
        floatText(this, 1650, y, `${lab} ${g.v > 0 ? '+' : ''}${g.v}`, g.v > 0 ? '#7dffb0' : '#ff8a8a', 34);
      } else if (g.kind === 'aff' && G.cast.chars[g.id]) {
        floatText(this, 1650, y, `${charName(g.id)} ${g.v > 0 ? '♥ +' : '♥ '}${g.v}`, g.v > 0 ? '#ffb3e6' : '#ff8a8a', 30);
      }
      y += 56;
    }
  }

  async card(str, fast) {
    const c = this.add.container(W / 2, H / 2).setDepth(300);
    const bg = this.add.rectangle(0, 0, W, 220, 0x0b0614, 0.82);
    const t = text(this, 0, 0, str, { size: 64, weight: 800, ox: 0.5, oy: 0.5, align: 'center', font: 'Montserrat, Poppins', stroke: '#5a1e7a', strokeW: 8 });
    c.add([bg, t]);
    c.setAlpha(0);
    await new Promise((r) => this.tweens.add({ targets: c, alpha: 1, duration: fast ? 50 : 400, onComplete: r }));
    if (!fast) await wait(this, 1500);
    await new Promise((r) => this.tweens.add({ targets: c, alpha: 0, duration: fast ? 50 : 400, onComplete: r }));
    c.destroy();
  }

  async say(op) {
    const who = this.resolveWho(op.who);
    const line = this.sub(op.text);
    if (op.expr && this.actors[who]) this.actors[who].setExpr(op.expr);
    this.box.setVisible(true);
    let name = '';
    let color = '#ffffff';
    if (who === 'narr') {
      name = '';
    } else if (who.startsWith('[')) {
      name = who.slice(1, -1);
      color = '#ffd27a';
    } else {
      name = charName(who);
      color = charColor(who);
    }
    this.nameBg.setVisible(!!name);
    this.nameText.setText(name).setColor('#ffffff');
    if (name) this.nameBg.setTint(Phaser.Display.Color.HexStringToColor(color).color);
    this.lineText.setFontStyle(who === 'narr' ? 'italic 400' : '400');
    this.lineText.setColor(who === 'narr' ? '#e4d7ff' : '#ffffff');
    Object.entries(this.actors).forEach(([id, act]) => act.focus(id === who || who === 'narr' || !this.actors[who]));
    if (this.actors[who]) this.actors[who].talk();
    await this.typeText(line);
    if (this.skipping) {
      await wait(this, 30);
      return;
    }
    await new Promise((res) => {
      this.waitingAdvance = true;
      this.advanceResolve = res;
      if (this.auto) {
        this.time.delayedCall(1200 + line.length * 35, () => { if (this.advanceResolve === res) this.advance(); });
      }
    });
  }

  typeText(line) {
    return new Promise((res) => {
      this.fullLine = line;
      this.typing = true;
      this.typeRes = res;
      this.arrow.setVisible(false);
      if (this.skipping) {
        this.finishTyping();
        return;
      }
      let i = 0;
      const speed = Math.max(10, G.settings.textSpeed);
      if (this.typeEv) this.typeEv.remove();
      this.lineText.setText('');
      this.typeEv = this.time.addEvent({
        delay: 1000 / speed, loop: true, callback: () => {
          i += 1;
          this.lineText.setText(line.slice(0, i));
          if (i >= line.length) this.finishTyping();
        },
      });
    });
  }

  finishTyping() {
    if (this.typeEv) this.typeEv.remove();
    this.typeEv = null;
    this.lineText.setText(this.fullLine || '');
    this.typing = false;
    this.arrow.setVisible(true);
    const r = this.typeRes;
    this.typeRes = null;
    if (r) r();
  }

  async choice(op) {
    if (window.NOVA_AUTOTEST) {
      const opts = op.opts.filter((o) => !o.text.startsWith('?'));
      const o = opts[Math.floor(Math.random() * opts.length)];
      applyFx((o.fx || '').replace(/\$(\w+)/g, (_, k) => this.vars[k] || k));
      if (o.label) this.jump(o.label);
      window.NOVA_AUTOTEST.choices = (window.NOVA_AUTOTEST.choices || 0) + 1;
      return;
    }
    this.skipping = false;
    this.choosing = true;
    const opts = op.opts.filter((o) => !o.text.startsWith('?') || evalCond(o.text.slice(1).split(' ')[0], this.vars));
    const n = opts.length;
    const btns = [];
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.35).setDepth(140);
    await new Promise((res) => {
      opts.forEach((o, i) => {
        const label = this.sub(o.text.replace(/^\?\S+\s*/, ''));
        const y = 420 + (i - (n - 1) / 2) * 120;
        const b = button(this, W / 2, y, 1100, 96, label, () => {
          btns.forEach((x) => x.setEnabled(false));
          this.tweens.add({ targets: b, scale: 1.08, duration: 120, yoyo: true });
          this.time.delayedCall(260, () => res(o));
        }, { style: i % 2 ? 'btn2' : 'btn', size: 30 });
        b.setDepth(150);
        b.setAlpha(0);
        b.x = W / 2 + (i % 2 ? 120 : -120);
        this.tweens.add({ targets: b, alpha: 1, x: W / 2, duration: 300, delay: i * 80, ease: 'Cubic.out' });
        btns.push(b);
      });
    }).then((o) => {
      btns.forEach((b) => b.destroy());
      overlay.destroy();
      this.choosing = false;
      const gains = applyFx((o.fx || '').replace(/\$(\w+)/g, (_, k) => this.vars[k] || k));
      this.showGains(gains);
      if (o.label) this.jump(o.label);
      this.lastChoice = o;
    });
  }
}
