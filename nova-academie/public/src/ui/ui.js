// Reusable UI pieces: text, buttons, panels, portraits, toasts, transitions, FX.
import { G, W, H, FONT, TITLE_FONT, charColor, fmt } from '../core/state.js';
import { Audio } from '../core/audio.js';
import { playerLayers, need, berryAsset } from '../core/assets.js';

export function text(scene, x, y, str, o = {}) {
  const t = scene.add.text(x, y, str, {
    fontFamily: o.font || FONT,
    fontSize: (o.size || 32) + 'px',
    fontStyle: String(o.weight || 600),
    color: o.color || '#ffffff',
    align: o.align || 'left',
    wordWrap: o.wrap ? { width: o.wrap, useAdvancedWrap: true } : undefined,
    stroke: o.stroke || undefined,
    strokeThickness: o.stroke ? (o.strokeW || 6) : 0,
    lineSpacing: o.lineSpacing || 4,
    shadow: o.shadow === false ? undefined : { offsetX: 0, offsetY: 3, color: 'rgba(0,0,0,0.55)', blur: 8, fill: true },
  });
  t.setOrigin(o.ox ?? 0, o.oy ?? 0);
  if (o.depth) t.setDepth(o.depth);
  return t;
}

export function title(scene, x, y, str, size = 72, color = '#ffffff') {
  return text(scene, x, y, str, { size, font: TITLE_FONT, weight: 900, color, ox: 0.5, oy: 0.5, stroke: '#2a0f45', strokeW: 10 });
}

export function panel(scene, x, y, w, h, style = 'panel', alpha = 1) {
  const p = scene.add.nineslice(x, y, style, undefined, w, h, 28, 28, 28, 28);
  p.setAlpha(alpha);
  return p;
}

export class Button extends Phaser.GameObjects.Container {
  constructor(scene, x, y, w, h, label, onClick, o = {}) {
    super(scene, x, y);
    this.style = o.style || 'btn';
    this.bg = scene.add.nineslice(0, 0, this.style, undefined, w, h, 30, 30, 30, 30);
    this.add(this.bg);
    let lx = 0;
    if (o.icon) {
      this.icon = scene.add.image(-w / 2 + 44, 0, o.icon).setDisplaySize(h * 0.62, h * 0.62);
      this.add(this.icon);
      lx = 22;
    }
    this.label = text(scene, lx, -2, label, { size: o.size || Math.min(34, h * 0.42), weight: 800, ox: 0.5, oy: 0.5, align: 'center', wrap: w - 40 - (o.icon ? 60 : 0) });
    this.add(this.label);
    if (o.sub) {
      this.label.y -= 14;
      this.sub = text(scene, lx, 22, o.sub, { size: 20, weight: 400, ox: 0.5, oy: 0.5, color: '#ffe6f6', align: 'center', wrap: w - 50 });
      this.add(this.sub);
    }
    this.setSize(w, h);
    this.w = w;
    this.h = h;
    this.enabled = true;
    this.onClick = onClick;
    this.setInteractive({ useHandCursor: true });
    this.on('pointerover', () => {
      if (!this.enabled) return;
      scene.tweens.add({ targets: this, scale: 1.05, duration: 120 });
      Audio.sfx(scene, 'hover', 0.35);
    });
    this.on('pointerout', () => scene.tweens.add({ targets: this, scale: 1, duration: 120 }));
    this.on('pointerdown', () => {
      if (!this.enabled) return;
      scene.tweens.add({ targets: this, scale: 0.95, duration: 70, yoyo: true });
      Audio.sfx(scene, 'click', 0.6);
      if (this.onClick) this.onClick(this);
    });
    scene.add.existing(this);
  }

  setEnabled(v) {
    this.enabled = v;
    this.setAlpha(v ? 1 : 0.45);
    return this;
  }

  setLabel(s) {
    this.label.setText(s);
    return this;
  }

  setStyle(style) {
    this.bg.setTexture(style);
    return this;
  }
}

export function button(scene, x, y, w, h, label, onClick, o) {
  return new Button(scene, x, y, w, h, label, onClick, o);
}

export function toast(scene, msg, color = '#ffffff', y = 140) {
  const c = scene.add.container(W / 2, y).setDepth(5000);
  const t = text(scene, 0, 0, msg, { size: 30, weight: 800, color, ox: 0.5, oy: 0.5, align: 'center', wrap: 1200 });
  const bg = scene.add.nineslice(0, 0, 'panel', undefined, Math.max(360, t.width + 80), t.height + 44, 28, 28, 28, 28);
  c.add([bg, t]);
  c.setAlpha(0).setScale(0.8);
  scene.tweens.add({ targets: c, alpha: 1, scale: 1, duration: 220, ease: 'Back.out' });
  scene.tweens.add({ targets: c, alpha: 0, y: y - 40, delay: 2200, duration: 400, onComplete: () => c.destroy() });
  return c;
}

export function floatText(scene, x, y, msg, color = '#ffe066', size = 40) {
  const t = text(scene, x, y, msg, { size, weight: 800, color, ox: 0.5, oy: 0.5, stroke: '#2a0f45', strokeW: 8 }).setDepth(4000);
  scene.tweens.add({ targets: t, y: y - 80, alpha: 0, duration: 1200, ease: 'Cubic.out', onComplete: () => t.destroy() });
  return t;
}

export function portrait(scene, id, x, y, size = 140, o = {}) {
  const c = scene.add.container(x, y);
  const key = id === 'player' ? 'portrait_player' : (o.key || 'portrait_' + id);
  const ring = scene.add.circle(0, 0, size / 2 + 6, Phaser.Display.Color.HexStringToColor(o.color || charColor(id)).color);
  const back = scene.add.circle(0, 0, size / 2, 0x1d0f33);
  c.add([ring, back]);
  if (scene.textures.exists(key)) {
    const img = scene.add.image(0, 0, key).setDisplaySize(size, size);
    c.add(img);
    c.img = img;
  }
  c.ring = ring;
  if (o.label) {
    const t = text(scene, 0, size / 2 + 26, o.label, { size: o.labelSize || 24, weight: 800, ox: 0.5, oy: 0.5, align: 'center' });
    c.add(t);
    c.labelText = t;
  }
  return c;
}

// Build a circular portrait texture from a layered look (player / multiplayer avatars)
export async function makeLookPortrait(scene, look, key = 'portrait_player') {
  const layers = playerLayers(look, 'sourire');
  await need(scene, layers.map(berryAsset));
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const rt = scene.make.renderTexture({ x: 0, y: 0, width: 256, height: 256 }, false);
  // head region of the berry sprites (sprite size ~ 490x1100)
  const sx = 100, sy = 10, ss = 330;
  const sc = 256 / ss;
  for (const name of layers) {
    const img = scene.make.image({ x: -sx * sc, y: -sy * sc, key: 'berry_' + name, add: false }).setOrigin(0, 0).setScale(sc);
    if (name === look.hair && look.tint) img.setTint(look.tint);
    rt.draw(img);
    img.destroy();
  }
  rt.erase('circle_inv', 0, 0);
  rt.saveTexture(key);
  return key;
}

export function fadeIn(scene, ms = 450) {
  scene.cameras.main.fadeIn(ms, 11, 6, 20);
}

export function fadeOut(scene, ms = 400) {
  return new Promise((res) => {
    scene.cameras.main.fadeOut(ms, 11, 6, 20);
    scene.cameras.main.once('camerafadeoutcomplete', () => res());
  });
}

export function wait(scene, ms) {
  return new Promise((res) => scene.time.delayedCall(ms, res));
}

export function tween(scene, cfg) {
  return new Promise((res) => scene.tweens.add({ ...cfg, onComplete: () => res() }));
}

export function sparkles(scene, depth = 1, tint = [0xffffff, 0xffb3e6, 0xb39dff, 0xffe28a]) {
  return scene.add.particles(0, 0, 'star', {
    x: { min: 0, max: W }, y: { min: 0, max: H },
    lifespan: 2600, scale: { start: 0, end: 0.35, ease: 'Sine.inOut', yoyo: true }, alpha: { start: 0.9, end: 0 },
    frequency: 160, quantity: 1, tint, blendMode: 'ADD', rotate: { min: 0, max: 90 },
  }).setDepth(depth);
}

export function confetti(scene, depth = 3000) {
  const e = scene.add.particles(0, -20, 'confetti', {
    x: { min: 0, max: W }, lifespan: 4200, speedY: { min: 180, max: 420 }, speedX: { min: -120, max: 120 },
    rotate: { start: 0, end: 720 }, scaleX: { min: 0.6, max: 1.3 }, scaleY: { min: 0.6, max: 1.2 },
    tint: [0xff5cb4, 0xffc93c, 0x31d2ff, 0x8b5cff, 0x3ddc84, 0xffffff], frequency: 18, quantity: 3, gravityY: 60,
  }).setDepth(depth);
  return e;
}

export function burst(scene, x, y, tint = 0xffffff, n = 14, depth = 3000) {
  const e = scene.add.particles(x, y, 'star', {
    speed: { min: 180, max: 520 }, angle: { min: 0, max: 360 }, lifespan: 600, scale: { start: 0.45, end: 0 },
    blendMode: 'ADD', tint, emitting: false,
  }).setDepth(depth);
  e.explode(n);
  scene.time.delayedCall(800, () => e.destroy());
  return e;
}

// Rotating additive stage spotlights
export function spotlights(scene, n = 5, depth = 2, colors = [0xff5cb4, 0x31d2ff, 0xffc93c, 0x8b5cff, 0xffffff]) {
  const beams = [];
  for (let i = 0; i < n; i++) {
    const x = (W / (n + 1)) * (i + 1);
    const b = scene.add.image(x, -40, 'beam').setOrigin(0.5, 0).setBlendMode('ADD').setAlpha(0.32)
      .setTint(colors[i % colors.length]).setDepth(depth).setScale(1.2, 1.05);
    b.rotation = Phaser.Math.DegToRad((i % 2 ? 1 : -1) * 18);
    scene.tweens.add({ targets: b, rotation: -b.rotation, duration: 2600 + i * 400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    beams.push(b);
  }
  return beams;
}

export function vignette(scene, depth = 5, alpha = 1) {
  return scene.add.image(W / 2, H / 2, 'vignette').setDisplaySize(W, H).setDepth(depth).setAlpha(alpha);
}

export function setBackground(scene, id, o = {}) {
  const key = 'bg_' + id;
  G.bgInUse = G.bgInUse || new Set();
  const img = scene.add.image(W / 2, H / 2, key).setDisplaySize(W, H).setDepth(o.depth ?? 0);
  G.bgInUse.add(key);
  img.once('destroy', () => G.bgInUse && G.bgInUse.delete(key));
  if (o.night) img.setTint(0x6f7fb8);
  if (o.dim) img.setTint(0x9a8fb5);
  return img;
}

export function statIcon(stat) {
  return { voix: 'ico_voix', danse: 'ico_danse', scene: 'ico_scene', culture: 'ico_culture', pop: 'ico_pop', energie: 'ico_forme' }[stat] || 'ico_star';
}

export const STAT_LABEL = { voix: 'Voix', danse: 'Danse', scene: 'Scène', culture: 'Culture', pop: 'Popularité', energie: 'Énergie' };

export function bar(scene, x, y, w, h, value, color = 0xff5cb4) {
  const c = scene.add.container(x, y);
  const bg = scene.add.rectangle(0, 0, w, h, 0x000000, 0.45).setOrigin(0, 0.5);
  const fg = scene.add.rectangle(0, 0, Math.max(2, (w * value) / 100), h, color).setOrigin(0, 0.5);
  c.add([bg, fg]);
  c.setValue = (v, anim = true) => {
    const tw = Math.max(2, (w * Phaser.Math.Clamp(v, 0, 100)) / 100);
    if (anim) scene.tweens.add({ targets: fg, width: tw, duration: 600, ease: 'Cubic.out' });
    else fg.width = tw;
  };
  return c;
}

export function keyHint(scene, x, y, str) {
  return text(scene, x, y, str, { size: 20, weight: 400, color: '#cbb8ea', ox: 0.5, oy: 0.5 });
}

export { fmt };
