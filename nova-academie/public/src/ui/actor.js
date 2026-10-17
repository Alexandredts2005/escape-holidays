// Visual-novel character on screen: expressions (crossfade), entrances, idle breathing, talk bounce.
import { G, W, H } from '../core/state.js';
import { bestExpr, playerLayers, need, actorAssets } from '../core/assets.js';

export const POS = { farleft: 250, left: 430, midleft: 700, center: 960, midright: 1220, right: 1490, farright: 1670 };

function srcOf(id) {
  if (id === 'player') return 'berry';
  const c = G.cast.chars[id];
  return c ? c.src : 'cabbit';
}

export class Actor extends Phaser.GameObjects.Container {
  constructor(scene, id, expr = 'neutre', look = null) {
    super(scene, POS.center, H);
    this.id = id;
    this.look = look || (id === 'player' ? G.season.player.look : null);
    this.src = look && !G.cast.chars[id] ? 'berry' : srcOf(id);
    this.baseScale = this.src === 'berry' ? 0.8 : 0.93;
    this.yBase = this.src === 'berry' ? H + 20 : H + 95;
    this.y = this.yBase;
    this.inner = scene.add.container(0, 0);
    this.add(this.inner);
    this.shadow = scene.add.ellipse(0, -10, 380, 60, 0x000000, 0.25);
    this.addAt(this.shadow, 0);
    this.expr = null;
    this.layers = null;
    this.setScale(this.baseScale);
    this.buildExpr(expr, false);
    scene.add.existing(this);
    this.breath = scene.tweens.add({ targets: this.inner, scaleY: 1.008, scaleX: 0.996, duration: 1700 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  makeImages(expr) {
    const imgs = [];
    if (this.id === 'player' || (this.look && !G.cast.chars[this.id])) {
      for (const name of playerLayers(this.look, expr)) {
        const im = this.scene.add.image(0, 0, 'berry_' + name).setOrigin(0.5, 1);
        if (name === this.look.hair && this.look.tint) im.setTint(this.look.tint);
        imgs.push(im);
      }
    } else {
      const e = bestExpr(this.id, expr);
      imgs.push(this.scene.add.image(0, 0, `${this.id}_${e}`).setOrigin(0.5, 1));
    }
    return imgs;
  }

  buildExpr(expr, fade = true) {
    if (expr === this.expr) return;
    const imgs = this.makeImages(expr);
    const group = this.scene.add.container(0, 0, imgs);
    this.inner.add(group);
    const old = this.layers;
    this.layers = group;
    this.expr = expr;
    if (old && fade) {
      group.setAlpha(0);
      this.scene.tweens.add({ targets: group, alpha: 1, duration: 160 });
      this.scene.tweens.add({ targets: old, alpha: 0, duration: 200, delay: 60, onComplete: () => old.destroy() });
    } else if (old) {
      old.destroy();
    }
  }

  async setExpr(expr) {
    if (expr === this.expr) return;
    await need(this.scene, actorAssets(this.id, [expr], this.look));
    if (!this.scene) return;
    this.buildExpr(expr, true);
  }

  place(pos) {
    this.x = typeof pos === 'number' ? pos : (POS[pos] ?? POS.center);
    this.posName = pos;
    return this;
  }

  enter(pos, how = 'slide') {
    this.place(pos);
    const tx = this.x;
    this.setAlpha(0);
    if (how === 'slide') {
      this.x = tx + (tx < W / 2 ? -160 : 160);
      this.scene.tweens.add({ targets: this, x: tx, alpha: 1, duration: 450, ease: 'Cubic.out' });
    } else if (how === 'pop') {
      this.setScale(this.baseScale * 0.85);
      this.scene.tweens.add({ targets: this, alpha: 1, scale: this.baseScale, duration: 380, ease: 'Back.out' });
    } else {
      this.scene.tweens.add({ targets: this, alpha: 1, duration: 400 });
    }
    return this;
  }

  moveTo(pos, ms = 450) {
    const tx = typeof pos === 'number' ? pos : POS[pos];
    this.posName = pos;
    this.scene.tweens.add({ targets: this, x: tx, duration: ms, ease: 'Cubic.inOut' });
  }

  exit(ms = 380) {
    return new Promise((res) => {
      if (this.breath) this.breath.remove();
      this.scene.tweens.add({
        targets: this, alpha: 0, x: this.x + (this.x < W / 2 ? -120 : 120), duration: ms,
        onComplete: () => { this.destroy(); res(); },
      });
    });
  }

  talk() {
    this.scene.tweens.add({ targets: this.inner, y: -14, duration: 110, yoyo: true, ease: 'Quad.out' });
  }

  focus(on) {
    const tint = on ? 0xffffff : 0x8d86a8;
    this.layers.list.forEach((im) => {
      if (this.look && im.texture.key === 'berry_' + this.look.hair && this.look.tint) {
        if (on) im.setTint(this.look.tint); else im.setTint(Phaser.Display.Color.ValueToColor(this.look.tint).darken(35).color);
      } else im.setTint(tint);
    });
    this.scene.tweens.add({ targets: this, scale: this.baseScale * (on ? 1.0 : 0.97), duration: 200 });
    this.setDepth(on ? 20 : 10);
  }

  jump() {
    this.scene.tweens.add({ targets: this.inner, y: -60, duration: 180, yoyo: true, ease: 'Quad.out', repeat: 1 });
  }

  shake() {
    this.scene.tweens.add({ targets: this.inner, x: 12, duration: 50, yoyo: true, repeat: 5 });
  }

  // little dance move used during performances
  groove(beatMs, energy = 1) {
    if (this.grooveTw) this.grooveTw.remove();
    this.grooveTw = this.scene.tweens.add({
      targets: this.inner, y: -18 * energy, angle: { from: -2.5 * energy, to: 2.5 * energy }, duration: beatMs / 2,
      yoyo: true, repeat: -1, ease: 'Sine.inOut',
    });
  }

  stopGroove() {
    if (this.grooveTw) this.grooveTw.remove();
    this.grooveTw = null;
    this.inner.y = 0;
    this.inner.angle = 0;
  }
}

export async function spawnActor(scene, id, expr, pos, how = 'slide', look = null) {
  await need(scene, actorAssets(id, [expr], look));
  const a = new Actor(scene, id, expr, look);
  a.setDepth(10);
  a.enter(pos, how);
  return a;
}
