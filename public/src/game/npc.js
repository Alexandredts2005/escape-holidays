// Procedural animal characters (Gustave the parrot, Jean-Michel the pelican) and the parrot companion behaviour.
import * as THREE from 'three';
import { toon } from '../engine/toon.js';

const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();

function ell(rx, ry, rz, color, seg = 14) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75)), toon(color));
  m.scale.set(rx, ry, rz);
  m.castShadow = true;
  return m;
}

function eye(r = 0.03) {
  const g = new THREE.Group();
  const w = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), toon(0xffffff, { rim: false }));
  const p = new THREE.Mesh(new THREE.SphereGeometry(r * 0.55, 10, 8), toon(0x1a1420, { rim: false }));
  p.position.z = r * 0.62;
  const h = new THREE.Mesh(new THREE.SphereGeometry(r * 0.18, 6, 5), toon(0xffffff, { emissive: 0xffffff, rim: false }));
  h.position.set(r * 0.2, r * 0.25, r * 1.05);
  g.add(w, p, h);
  return g;
}

// Scarlet macaw, ~0.42 m tall, facing +Z. Returns { root, head, wingL, wingR, beakLow, tail }
export function makeParrot() {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const red = 0xe8352b;
  const torso = ell(0.1, 0.14, 0.1, red);
  torso.position.y = 0.16;
  torso.rotation.x = 0.25;
  body.add(torso);
  const belly = ell(0.075, 0.1, 0.06, 0xff6a4a);
  belly.position.set(0, 0.14, 0.05);
  body.add(belly);
  const head = new THREE.Group();
  head.position.set(0, 0.32, 0.03);
  body.add(head);
  head.add(ell(0.085, 0.085, 0.085, red));
  const face = ell(0.05, 0.05, 0.03, 0xfff3ea);
  face.position.set(0, 0.0, 0.065);
  head.add(face);
  for (const s of [1, -1]) {
    const e = eye(0.024);
    e.position.set(s * 0.045, 0.02, 0.06);
    e.rotation.y = s * 0.45;
    head.add(e);
  }
  // hooked beak: upper part + lower mandible (animated)
  const beakUp = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.09, 10), toon(0xf3e6c8));
  beakUp.position.set(0, -0.015, 0.105);
  beakUp.rotation.x = 1.9;
  head.add(beakUp);
  const beakLow = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.05, 8), toon(0x2a2233));
  beakLow.position.set(0, -0.045, 0.08);
  beakLow.rotation.x = 2.3;
  head.add(beakLow);
  // crest feathers
  for (let i = 0; i < 3; i++) {
    const f = ell(0.015, 0.05, 0.012, i === 1 ? 0xffc23d : red, 8);
    f.position.set((i - 1) * 0.02, 0.09, -0.02);
    f.rotation.set(-0.5, 0, (i - 1) * 0.3);
    head.add(f);
  }
  const mkWing = (s) => {
    const w = new THREE.Group();
    w.position.set(s * 0.085, 0.22, -0.01);
    const a = ell(0.03, 0.12, 0.075, red);
    a.position.y = -0.07;
    const b = ell(0.026, 0.1, 0.06, 0xffc23d);
    b.position.set(s * 0.006, -0.1, -0.012);
    const c = ell(0.022, 0.1, 0.05, 0x2f73d8);
    c.position.set(s * 0.01, -0.16, -0.02);
    w.add(a, b, c);
    w.rotation.z = s * 0.12;
    body.add(w);
    return w;
  };
  const wingL = mkWing(1);
  const wingR = mkWing(-1);
  const tail = new THREE.Group();
  tail.position.set(0, 0.06, -0.07);
  tail.rotation.x = -0.45;
  [[0xe8352b, 0], [0x2f73d8, 0.03], [0x2f73d8, -0.03]].forEach(([c, x]) => {
    const f = ell(0.018, 0.17, 0.008, c, 8);
    f.position.set(x, -0.15, 0);
    tail.add(f);
  });
  body.add(tail);
  for (const s of [1, -1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.05, 6), toon(0x6b6f7c));
    leg.position.set(s * 0.035, 0.03, 0.01);
    body.add(leg);
  }
  return { root, body, head, wingL, wingR, beakLow, tail };
}

// Brown pelican on a post. Returns { root, head, pouch }
export function makePelican() {
  const root = new THREE.Group();
  const white = 0xf4efe6;
  const torso = ell(0.22, 0.24, 0.32, white);
  torso.position.y = 0.42;
  root.add(torso);
  const wing = ell(0.2, 0.16, 0.3, 0x9a8f86);
  wing.position.set(0, 0.48, -0.06);
  root.add(wing);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.38, 10), toon(white));
  neck.position.set(0, 0.72, 0.18);
  neck.rotation.x = 0.35;
  root.add(neck);
  const head = new THREE.Group();
  head.position.set(0, 0.92, 0.26);
  root.add(head);
  head.add(ell(0.09, 0.085, 0.11, white));
  const cap = ell(0.07, 0.04, 0.08, 0xffd36a);
  cap.position.y = 0.06;
  head.add(cap);
  for (const s of [1, -1]) {
    const e = eye(0.026);
    e.position.set(s * 0.07, 0.025, 0.04);
    e.rotation.y = s * 0.9;
    head.add(e);
  }
  const beak = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.035, 0.42), toon(0xff9b3a));
  beak.position.set(0, -0.01, 0.27);
  head.add(beak);
  const hook = ell(0.03, 0.03, 0.03, 0xff7a2a);
  hook.position.set(0, -0.02, 0.48);
  head.add(hook);
  const pouch = ell(0.05, 0.08, 0.19, 0xffb46a);
  pouch.position.set(0, -0.08, 0.25);
  head.add(pouch);
  for (const s of [1, -1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 6), toon(0xff9b3a));
    leg.position.set(s * 0.09, 0.11, 0.02);
    root.add(leg);
    const foot = ell(0.06, 0.015, 0.07, 0xff9b3a, 8);
    foot.position.set(s * 0.09, 0.01, 0.06);
    root.add(foot);
  }
  const tail = ell(0.12, 0.05, 0.12, 0x9a8f86);
  tail.position.set(0, 0.38, -0.32);
  root.add(tail);
  return { root, head, pouch };
}

// Gustave: sits on the player's shoulder, flies to points of interest, eats biscuits, talks.
export class Gustave {
  constructor(game) {
    this.game = game;
    this.p = makeParrot();
    this.obj = this.p.root;
    this.obj.scale.setScalar(0.85);
    this.obj.visible = false;
    this.obj.userData.dynamic = true;
    game.scene.add(this.obj);
    this.state = 'off';
    this.t = 0;
    this.flap = 0;
    this.eatT = 0;
    this.lookT = 0;
    this.headYaw = 0;
    game.updaters.push((dt) => this.update(dt));
  }

  join() { this.state = 'shoulder'; this.obj.visible = true; this.snap = true; this.pecking = false; }

  comeBack() { this.state = 'return'; this.obj.visible = true; this.snap = false; this.pecking = false; }

  reattach() { this.snap = true; }

  // fly to a world point and perch there (e.g. pointing at a clue); returns when landed
  flyTo(pos, perchYaw = 0) {
    this.state = 'fly';
    const from = this.obj.position.clone();
    const to = pos.clone();
    const mid = from.clone().lerp(to, 0.5);
    mid.y += 1.2 + from.distanceTo(to) * 0.15;
    this.path = { from, mid, to, t: 0, dur: Math.max(0.8, from.distanceTo(to) / 5), yaw: perchYaw };
    this.game.audio.sfxAt('whoosh', from, this.game.player.root, 0.5);
    return new Promise((r) => { this.path.done = r; });
  }

  back() { this.state = 'return'; this.path = null; }

  perchAt(pos, yaw = 0) {
    this.state = 'perch';
    this.obj.visible = true;
    this.obj.position.copy(pos);
    this.obj.rotation.set(0, yaw, 0);
  }

  eat() { this.eatT = 1.2; this.game.audio.sfx('scratch', 0.3, 1.6); }

  update(dt) {
    if (this.state === 'off') return;
    this.t += dt;
    const pl = this.game.player;
    const p = this.p;
    const target = _v;
    let flying = false;
    if (this.state === 'shoulder' || this.state === 'return') {
      pl.shoulder.getWorldPosition(target);
      if (this.snap) { this.obj.position.copy(target); this.snap = false; }
      const d = this.obj.position.distanceTo(target);
      if (this.state === 'return') {
        flying = d > 0.08;
        this.obj.position.lerp(target, 1 - Math.exp(-dt * 4));
        if (d < 0.08) this.state = 'shoulder';
      } else this.obj.position.lerp(target, 1 - Math.exp(-dt * 25));
      pl.model.getWorldQuaternion(_q);
      this.obj.quaternion.slerp(_q, 1 - Math.exp(-dt * 10));
      this.obj.visible = pl.model.visible && pl.root.visible;
    } else if (this.state === 'fly' && this.path) {
      const s = this.path;
      s.t = Math.min(1, s.t + dt / s.dur);
      const k = s.t;
      const a = s.from.clone().lerp(s.mid, k);
      const b = s.mid.clone().lerp(s.to, k);
      const prev = this.obj.position.clone();
      this.obj.position.copy(a.lerp(b, k));
      const dir = this.obj.position.clone().sub(prev);
      if (dir.lengthSq() > 1e-7) this.obj.rotation.y = Math.atan2(dir.x, dir.z);
      flying = true;
      if (s.t >= 1) { this.state = 'perch'; this.obj.rotation.y = s.yaw; if (s.done) s.done(); }
      this.obj.visible = true;
    }
    // wings
    if (flying) {
      this.flap += dt * 22;
      const f = Math.sin(this.flap) * 1.1;
      p.wingL.rotation.z = 0.2 + f; p.wingR.rotation.z = -0.2 - f;
      p.wingL.rotation.x = p.wingR.rotation.x = -0.4;
      p.body.rotation.x = 0.5;
    } else {
      const idleFlap = (Math.sin(this.t * 0.7) > 0.97) ? Math.sin(this.t * 30) * 0.5 : 0;
      p.wingL.rotation.z = 0.12 + Math.abs(idleFlap); p.wingR.rotation.z = -0.12 - Math.abs(idleFlap);
      p.wingL.rotation.x = p.wingR.rotation.x = 0;
      p.body.rotation.x = THREE.MathUtils.lerp(p.body.rotation.x, 0, 1 - Math.exp(-dt * 6));
    }
    // head: look around, bob when talking or eating
    this.lookT -= dt;
    if (this.lookT <= 0) { this.lookT = 1 + Math.random() * 2.5; this.headYaw = (Math.random() - 0.5) * 1.6; }
    p.head.rotation.y = THREE.MathUtils.lerp(p.head.rotation.y, this.headYaw, 1 - Math.exp(-dt * 8));
    const ui = this.game.ui;
    const talking = ui.dialogOpen && ui.lines !== undefined && this.game.ui.speaker === 'gustave' && ui.typed < (ui.full || '').length;
    if (this.pecking && this.state === 'perch') {
      const k = Math.max(0, Math.sin(this.t * 7)) ** 6;
      p.head.rotation.x = k * 0.8;
      if (k > 0.9 && !this.pecked) { this.pecked = true; this.game.audio.sfxAt('glass_tap', this.obj.position, this.game.player.root, 0.5, 10, 1.3); }
      if (k < 0.2) this.pecked = false;
    } else if (this.eatT > 0) {
      this.eatT -= dt;
      p.head.rotation.x = 0.5 + Math.sin(this.t * 25) * 0.3;
      p.beakLow.rotation.x = 2.3 + Math.abs(Math.sin(this.t * 25)) * 0.4;
      if (Math.random() < dt * 8) this.game.fx.crumb(this.obj.position.clone().add(new THREE.Vector3(0, 0.25, 0)));
    } else if (talking) {
      p.beakLow.rotation.x = 2.3 + Math.abs(Math.sin(this.t * 18)) * 0.45;
      p.head.rotation.x = Math.sin(this.t * 9) * 0.12;
    } else {
      p.beakLow.rotation.x = 2.3;
      p.head.rotation.x = THREE.MathUtils.lerp(p.head.rotation.x, 0, 1 - Math.exp(-dt * 6));
    }
  }
}
