// Physical 3D puzzle devices: dial padlocks, keypads, rotary knobs. Used in inspect close-ups.
import * as THREE from 'three';
import { toon, canvasTexture } from '../engine/toon.js';

function wheelTexture(symbols, color = '#fff6e3', ink = '#2a2233') {
  const n = symbols.length;
  return canvasTexture(128 * n, 128, (x, w, h) => {
    x.fillStyle = color;
    x.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      x.fillStyle = i % 2 ? '#00000012' : '#00000000';
      x.fillRect(i * 128, 0, 128, h);
      x.strokeStyle = '#00000040';
      x.lineWidth = 3;
      x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, h); x.stroke();
      x.save();
      x.translate(i * 128 + 64, 64);
      x.rotate(Math.PI / 2);
      const s = symbols[i];
      if (typeof s === 'function') s(x, 0, 0, 40);
      else {
        x.fillStyle = ink;
        x.font = '800 78px Poppins';
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.fillText(s, 0, 4);
      }
      x.restore();
    }
  });
}

// N rotating wheels side by side. code: array of indices. onOpen callback.
export class DialLock {
  constructor(game, { symbols = '0123456789'.split(''), n = 3, code, radius = 0.06, width = 0.07, gap = 0.012, color = 0xc9a24a, wheelColor = '#fff6e3', onOpen, onChange, sound = 'switch' }) {
    this.game = game;
    this.symbols = symbols;
    this.code = code;
    this.onOpen = onOpen;
    this.onChange = onChange;
    this.sound = sound;
    this.group = new THREE.Group();
    this.values = new Array(n).fill(0);
    this.wheels = [];
    this.solved = false;
    const base = wheelTexture(symbols, wheelColor);
    const total = n * width + (n - 1) * gap;
    const body = new THREE.Mesh(new THREE.BoxGeometry(total + 0.06, radius * 2.4, radius * 1.4), toon(color));
    body.position.z = -radius * 0.5;
    this.group.add(body);
    for (let i = 0; i < n; i++) {
      const tex = base.clone();
      tex.wrapS = THREE.RepeatWrapping;
      tex.repeat.set(1, 1);
      tex.needsUpdate = true;
      const geo = new THREE.CylinderGeometry(radius, radius, width, 32, 1, true);
      const mat = toon(0xffffff, { map: tex, unique: true, side: THREE.DoubleSide, rim: false });
      const wh = new THREE.Mesh(geo, mat);
      wh.rotation.z = Math.PI / 2;
      wh.position.x = -total / 2 + width / 2 + i * (width + gap);
      wh.position.z = 0.012;
      this.group.add(wh);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.02, radius * 1.02, 0.006, 24), toon(color));
      cap.rotation.z = Math.PI / 2;
      cap.position.copy(wh.position);
      cap.position.x += width / 2;
      this.group.add(cap);
      this.wheels.push({ mesh: wh, pos: 0, target: 0, tex });
    }
    const mark = new THREE.Mesh(new THREE.BoxGeometry(total + 0.04, 0.004, 0.004), toon(0xff3355));
    mark.position.set(0, -radius * 0.55, radius + 0.004);
    this.group.add(mark);
    this.wheels.forEach((w) => this.apply(w));
  }

  apply(w) {
    w.tex.offset.x = (0.5 + w.pos) / this.symbols.length;
  }

  setValues(vals) {
    vals.forEach((v, i) => { this.values[i] = v; this.wheels[i].pos = this.wheels[i].target = v; this.apply(this.wheels[i]); });
  }

  clickables() {
    return this.wheels.map((w, i) => ({
      mesh: w.mesh,
      tip: 'Tourner la molette (clic gauche / droit)',
      onClick: (dir) => this.turn(i, dir),
      enabled: () => !this.solved,
    }));
  }

  turn(i, dir = 1) {
    if (this.solved) return;
    const n = this.symbols.length;
    this.values[i] = (this.values[i] + dir + n) % n;
    this.wheels[i].target += dir;
    this.game.audio.sfx(this.sound, 0.5, 0.9 + Math.random() * 0.2);
    if (this.onChange) this.onChange(this.values);
    this.check();
  }

  check() {
    if (this.code && this.values.every((v, i) => v === this.code[i])) {
      this.solved = true;
      setTimeout(() => this.onOpen && this.onOpen(), 450);
    }
  }

  update(dt) {
    for (const w of this.wheels) {
      if (Math.abs(w.pos - w.target) > 0.0005) {
        w.pos += (w.target - w.pos) * (1 - Math.exp(-dt * 14));
        this.apply(w);
      }
    }
  }
}

// Numeric keypad with a little screen. code: string.
export class Keypad {
  constructor(game, { code, digits = 4, color = 0x3b4252, ledColors = null, onOpen, title = '' }) {
    this.game = game;
    this.code = code;
    this.digits = digits;
    this.onOpen = onOpen;
    this.entry = '';
    this.solved = false;
    this.group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.04), toon(color));
    this.group.add(body);
    this.screenTex = canvasTexture(256, 64, () => {});
    this.screen = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.045), toon(0xffffff, { map: this.screenTex, unique: true, emissive: 0xffffff, emissiveIntensity: 0.9, rim: false }));
    this.screen.material.emissiveMap = this.screenTex;
    this.screen.position.set(0, 0.12, 0.021);
    this.group.add(this.screen);
    this.ledColors = ledColors;
    if (ledColors) {
      ledColors.forEach((c, i) => {
        const led = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), toon(c, { emissive: c, emissiveIntensity: 0.8 }));
        led.position.set(-0.06 + i * (0.12 / Math.max(1, ledColors.length - 1)), 0.152, 0.02);
        this.group.add(led);
      });
    }
    this.buttons = [];
    const labels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'];
    labels.forEach((lab, i) => {
      const tex = canvasTexture(64, 64, (x) => {
        x.fillStyle = lab === 'OK' ? '#3ddc84' : lab === 'C' ? '#ff7458' : '#fff6e3';
        x.fillRect(0, 0, 64, 64);
        x.fillStyle = '#2a2233';
        x.font = `800 ${lab === 'OK' ? 26 : 38}px Poppins`;
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.fillText(lab, 32, 35);
      });
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.016), [null, null, null, null, null, null].map((_, k) => (k === 4 ? toon(0xffffff, { map: tex, unique: true, rim: false }) : toon(0xd8d2c4))));
      const col = i % 3;
      const row = Math.floor(i / 3);
      b.position.set(-0.062 + col * 0.062, 0.06 - row * 0.052, 0.026);
      b.userData.base = b.position.z;
      this.group.add(b);
      this.buttons.push({ mesh: b, lab });
    });
    this.draw('_'.repeat(digits));
  }

  draw(text, color = '#7dffb0') {
    const c = this.screenTex.image;
    const x = c.getContext('2d');
    x.fillStyle = '#10161a';
    x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = color;
    x.font = '700 44px monospace';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(text, c.width / 2, c.height / 2 + 2);
    this.screenTex.needsUpdate = true;
  }

  clickables() {
    return this.buttons.map((b) => ({ mesh: b.mesh, tip: b.lab === 'OK' ? 'Valider' : b.lab === 'C' ? 'Effacer' : 'Touche ' + b.lab, onClick: () => this.press(b), enabled: () => !this.solved }));
  }

  press(b) {
    if (this.solved) return;
    b.mesh.position.z = b.mesh.userData.base - 0.008;
    setTimeout(() => { b.mesh.position.z = b.mesh.userData.base; }, 120);
    this.game.audio.sfx('click', 0.5, 1.2);
    if (b.lab === 'C') { this.entry = ''; this.draw('_'.repeat(this.digits)); return; }
    if (b.lab === 'OK') { this.validate(); return; }
    if (this.entry.length >= this.digits) return;
    this.entry += b.lab;
    this.draw(this.entry.padEnd(this.digits, '_'));
    if (this.entry.length === this.digits) setTimeout(() => this.validate(), 250);
  }

  validate() {
    if (this.entry === this.code) {
      this.solved = true;
      this.draw('OUVERT', '#7dffb0');
      this.game.audio.sfx('success', 0.7);
      setTimeout(() => this.onOpen && this.onOpen(), 500);
    } else {
      this.draw('ERREUR', '#ff6b6b');
      this.game.audio.sfx('error', 0.6);
      this.entry = '';
      setTimeout(() => !this.solved && this.draw('_'.repeat(this.digits)), 900);
      if (this.onFail) this.onFail();
    }
  }

  update() {}
}

// Single rotary knob with N positions (0..n-1), labelled ring
export class Knob {
  constructor(game, { n = 10, color = 0xff7458, symbol = null, onChange }) {
    this.game = game;
    this.n = n;
    this.value = 0;
    this.onChange = onChange;
    this.group = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.CircleGeometry(0.11, 32), toon(0xffffff, {
      map: canvasTexture(256, 256, (x) => {
        x.fillStyle = '#fff6e3'; x.beginPath(); x.arc(128, 128, 126, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#2a2233'; x.font = '800 30px Poppins'; x.textAlign = 'center'; x.textBaseline = 'middle';
        for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; x.fillText(String(i), 128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100); }
        if (symbol) symbol(x, 128, 128, 34);
      }), unique: true, rim: false,
    }));
    this.group.add(ring);
    this.knob = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.05, 20), toon(color));
    this.knob.rotation.x = Math.PI / 2;
    this.knob.position.z = 0.025;
    const pointer = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.05, 0.012), toon(0xffffff));
    pointer.position.set(0, 0.03, 0.03);
    this.knobPivot = new THREE.Group();
    this.knobPivot.add(this.knob);
    this.knobPivot.add(pointer);
    this.group.add(this.knobPivot);
    this.angle = 0;
    this.target = 0;
  }

  set(v, instant = false) {
    this.value = ((v % this.n) + this.n) % this.n;
    this.target = -(this.value / this.n) * Math.PI * 2;
    if (instant) { this.angle = this.target; this.knobPivot.rotation.z = this.angle; }
  }

  clickables() {
    return [{ mesh: this.knob, tip: 'Tourner la molette (clic gauche / droit)', onClick: (dir) => this.turn(dir), enabled: () => !this.locked }];
  }

  turn(dir) {
    this.set(this.value + dir);
    this.game.audio.sfx('switch', 0.5, 0.8 + Math.random() * 0.2);
    if (this.onChange) this.onChange(this.value);
  }

  update(dt) {
    if (Math.abs(this.angle - this.target) > 0.0005) {
      this.angle += (this.target - this.angle) * (1 - Math.exp(-dt * 14));
      this.knobPivot.rotation.z = this.angle;
    }
  }
}
