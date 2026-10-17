// Lightweight particle effects (sparkles, confetti, steam, splashes, crumbs) and floating text sprites.
import * as THREE from 'three';
import { canvasTexture } from '../engine/toon.js';

const N = 900;

export class FX {
  constructor(game) {
    this.game = game;
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(N * 3);
    this.col = new Float32Array(N * 3);
    this.size = new Float32Array(N);
    this.alpha = new Float32Array(N);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    g.setAttribute('size', new THREE.BufferAttribute(this.size, 1));
    g.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1));
    this.geo = g;
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { scale: { value: window.innerHeight / 2 } },
      vertexShader: `attribute float size; attribute float alpha; attribute vec3 color; varying vec3 vC; varying float vA;
        uniform float scale;
        void main(){ vC = color; vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec3 vC; varying float vA;
        void main(){ vec2 q = gl_PointCoord - 0.5; float d = length(q); if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.32, d) * vA; vec3 c = mix(vC, vec3(0.16, 0.13, 0.2), smoothstep(0.36, 0.48, d) * 0.6);
          gl_FragColor = vec4(c, a);
          #include <colorspace_fragment>
        }`,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    game.scene.add(this.points);
    this.p = [];
    for (let i = 0; i < N; i++) this.p.push({ life: 0, max: 1, v: new THREE.Vector3(), x: new THREE.Vector3(), g: 0, drag: 0, s0: 0.1, s1: 0.1, c: new THREE.Color() });
    this.next = 0;
    this.texts = [];
    this.emitters = [];
    window.addEventListener('resize', () => { this.mat.uniforms.scale.value = window.innerHeight / 2; });
  }

  spawn(x, v, { life = 1, g = 0, drag = 0, s0 = 0.08, s1 = 0.02, color = 0xffffff } = {}) {
    const p = this.p[this.next];
    this.next = (this.next + 1) % N;
    p.x.copy(x);
    p.v.copy(v);
    p.life = p.max = life * (0.7 + Math.random() * 0.6);
    p.g = g; p.drag = drag; p.s0 = s0; p.s1 = s1;
    p.c.set(color);
    return p;
  }

  sparkle(pos, color = 0xffe066, n = 24) {
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(1 + Math.random() * 2.2);
      v.y = Math.abs(v.y) + 0.5;
      this.spawn(pos, v, { life: 0.9, g: -3, drag: 2, s0: 0.12, s1: 0.0, color: Math.random() < 0.3 ? 0xffffff : color });
    }
  }

  confetti(pos, n = 80) {
    const cols = [0xff7458, 0xffc23d, 0x24a7a0, 0xff8fb1, 0x5fc8f0, 0xffffff];
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3((Math.random() - 0.5) * 5, 3 + Math.random() * 4, (Math.random() - 0.5) * 5);
      this.spawn(pos, v, { life: 2.2, g: -6, drag: 1.4, s0: 0.1, s1: 0.08, color: cols[i % cols.length] });
    }
  }

  steam(pos, n = 1, spread = 0.4, color = 0xffffff) {
    for (let i = 0; i < n; i++) {
      const x = pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * spread, 0, (Math.random() - 0.5) * spread));
      this.spawn(x, new THREE.Vector3((Math.random() - 0.5) * 0.3, 0.5 + Math.random() * 0.5, (Math.random() - 0.5) * 0.3), { life: 2.2, g: 0.1, drag: 0.6, s0: 0.15, s1: 0.75, color });
    }
  }

  splash(pos, n = 30) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = new THREE.Vector3(Math.cos(a) * (0.5 + Math.random()), 2 + Math.random() * 2.5, Math.sin(a) * (0.5 + Math.random()));
      this.spawn(pos, v, { life: 0.9, g: -9, drag: 0.4, s0: 0.1, s1: 0.04, color: Math.random() < 0.5 ? 0xffffff : 0xbfefff });
    }
  }

  crumb(pos) {
    this.spawn(pos, new THREE.Vector3((Math.random() - 0.5) * 0.6, 0.4, (Math.random() - 0.5) * 0.6), { life: 0.7, g: -6, s0: 0.03, s1: 0.03, color: 0xd9a05b });
  }

  puff(pos, n = 14, color = 0xf5efe6) {
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(0.8 + Math.random());
      v.y = Math.abs(v.y) * 0.6;
      this.spawn(pos, v, { life: 0.8, g: 0.3, drag: 3, s0: 0.2, s1: 0.5, color });
    }
  }

  // continuous emitter; returns handle with .on toggle
  emitter(fn, rate) {
    const e = { fn, rate, acc: 0, on: true };
    this.emitters.push(e);
    return e;
  }

  floatText(pos, text, { color = '#ffffff', size = 0.5, life = 1.6, rise = 0.8, font = '800 90px Poppins' } = {}) {
    const tex = canvasTexture(256, 128, (x, w, h) => {
      x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.lineWidth = 14; x.strokeStyle = '#2a2233'; x.strokeText(text, w / 2, h / 2);
      x.fillStyle = color; x.fillText(text, w / 2, h / 2);
    });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    s.scale.set(size * 2, size, 1);
    s.position.copy(pos);
    s.renderOrder = 6;
    this.game.scene.add(s);
    this.texts.push({ s, life, max: life, rise, y0: pos.y, x0: pos.x });
  }

  update(dt) {
    for (const e of this.emitters) {
      if (!e.on) continue;
      e.acc += dt * e.rate;
      while (e.acc >= 1) { e.acc -= 1; e.fn(this); }
    }
    let alive = 0;
    for (let i = 0; i < N; i++) {
      const p = this.p[i];
      if (p.life <= 0) { this.alpha[i] = 0; this.size[i] = 0; continue; }
      alive++;
      p.life -= dt;
      p.v.y += p.g * dt;
      p.v.multiplyScalar(Math.exp(-p.drag * dt));
      p.x.addScaledVector(p.v, dt);
      const k = 1 - Math.max(0, p.life) / p.max;
      this.pos[i * 3] = p.x.x; this.pos[i * 3 + 1] = p.x.y; this.pos[i * 3 + 2] = p.x.z;
      this.col[i * 3] = p.c.r; this.col[i * 3 + 1] = p.c.g; this.col[i * 3 + 2] = p.c.b;
      this.size[i] = p.s0 + (p.s1 - p.s0) * k;
      this.alpha[i] = Math.min(1, (1 - k) * 2.2) * Math.min(1, k * 12 + 0.2);
    }
    if (alive || this.wasAlive) {
      for (const a of ['position', 'color', 'size', 'alpha']) this.geo.attributes[a].needsUpdate = true;
    }
    this.wasAlive = alive > 0;
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      const k = 1 - t.life / t.max;
      t.s.position.y = t.y0 + t.rise * k;
      t.s.position.x = t.x0 + Math.sin(k * 6) * 0.08;
      t.s.material.opacity = Math.min(1, t.life * 2.5);
      if (t.life <= 0) { this.game.scene.remove(t.s); t.s.material.map.dispose(); t.s.material.dispose(); this.texts.splice(i, 1); }
    }
  }
}
