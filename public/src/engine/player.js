// Third-person character: Kenney mini character + animation state machine + capsule physics.
import * as THREE from 'three';
import { getAnimated, KIT } from './assets.js';

const UP = new THREE.Vector3(0, 1, 0);
const _seg = new THREE.Line3();
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();

export class Player {
  constructor(game, skin = 'character-female-b') {
    this.game = game;
    this.root = new THREE.Group();
    this.root.name = 'player';
    this.radius = 0.3;
    this.height = 1.42;
    this.segStart = new THREE.Vector3(0, this.radius, 0);
    this.segEnd = new THREE.Vector3(0, this.height - this.radius, 0);
    this.vel = new THREE.Vector3();
    this.onGround = false;
    this.speed = 3.4;
    this.runSpeed = 6.0;
    this.facing = 0;
    this.moveAmt = 0;
    this.frozen = false;
    this.action = null;
    this.lastSafe = new THREE.Vector3();
    this.stepT = 0;
    this.setSkin(skin);
  }

  setSkin(skin) {
    if (this.model) this.root.remove(this.model);
    const { scene, animations } = getAnimated('mini-characters/' + skin);
    this.skin = skin;
    this.model = scene;
    this.model.scale.setScalar(KIT);
    this.model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    this.root.add(this.model);
    this.mixer = new THREE.AnimationMixer(this.model);
    this.actions = {};
    for (const clip of animations) this.actions[clip.name] = this.mixer.clipAction(clip);
    this.current = null;
    this.play('idle', 0);
    // shoulder anchor for the parrot companion
    this.shoulder = new THREE.Object3D();
    this.shoulder.position.set(0.22, 1.12, -0.02);
    this.root.add(this.shoulder);
  }

  play(name, fade = 0.18, once = false) {
    const a = this.actions[name];
    if (!a || this.current === a) return a;
    a.reset();
    a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    a.clampWhenFinished = once;
    a.enabled = true;
    a.setEffectiveWeight(1);
    if (this.current) a.crossFadeFrom(this.current, fade, true);
    a.play();
    this.current = a;
    return a;
  }

  // one-shot gesture (pick-up, interact...) that returns to locomotion
  gesture(name, dur = 0.8) {
    const a = this.play(name, 0.12, true);
    this.action = name;
    this.actionT = dur;
    return a;
  }

  get position() { return this.root.position; }

  teleport(x, y, z, facing) {
    this.root.position.set(x, y, z);
    this.vel.set(0, 0, 0);
    if (facing !== undefined) { this.facing = facing; this.model.rotation.y = facing; }
    this.lastSafe.copy(this.root.position);
  }

  update(dt, input, camYaw) {
    const phys = this.game.physics;
    let move = { x: 0, y: 0 };
    const run = input.down('ShiftLeft') || input.down('ShiftRight');
    if (!this.frozen) move = input.axis();
    // camera-relative direction
    const fwd = _v1.set(-Math.sin(camYaw), 0, -Math.cos(camYaw));
    const right = _v2.set(Math.cos(camYaw), 0, -Math.sin(camYaw));
    const dir = new THREE.Vector3().addScaledVector(fwd, move.y).addScaledVector(right, move.x);
    const amt = Math.min(1, dir.length());
    if (amt > 0.01) dir.normalize();
    const speed = (run ? this.runSpeed : this.speed) * amt;
    this.moveAmt = THREE.MathUtils.lerp(this.moveAmt, speed, 1 - Math.exp(-dt * 12));
    if (amt > 0.01) {
      const target = Math.atan2(dir.x, dir.z);
      let d = target - this.facing;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.facing += d * (1 - Math.exp(-dt * 14));
      this.model.rotation.y = this.facing;
    }
    if (!this.frozen && input.hit('Space') && this.onGround) {
      this.vel.y = 6.2;
      this.onGround = false;
      this.play('jump', 0.08, true);
      this.game.audio.sfx('soft', 0.35);
    }
    if (this.kinematic) { this.mixer.update(dt); return; }
    const steps = 4;
    const h = dt / steps;
    const horiz = dir.clone().multiplyScalar(this.moveAmt * h);
    for (let i = 0; i < steps; i++) {
      if (this.onGround) this.vel.y = Math.max(this.vel.y, -2);
      this.vel.y += -22 * h;
      const pos = this.root.position;
      pos.add(horiz);
      pos.y += this.vel.y * h;
      _seg.start.copy(pos).add(this.segStart);
      _seg.end.copy(pos).add(this.segEnd);
      phys.resolve(_seg, this.radius);
      const newPos = _seg.start.clone().sub(this.segStart);
      const delta = newPos.clone().sub(pos);
      this.onGround = delta.y > Math.abs(h * this.vel.y * 0.25);
      const off = Math.max(0, delta.length() - 1e-5);
      delta.normalize().multiplyScalar(off);
      pos.add(delta);
      if (!this.onGround) {
        delta.normalize();
        this.vel.addScaledVector(delta, -delta.dot(this.vel));
      } else this.vel.y = 0;
    }
    if (this.onGround && this.root.position.y > -2) this.lastSafe.copy(this.root.position);
    if (this.root.position.y < -6) this.teleport(this.lastSafe.x, this.lastSafe.y + 1, this.lastSafe.z);
    // animation
    if (this.action) {
      this.actionT -= dt;
      if (this.actionT <= 0) this.action = null;
    } else if (!this.onGround && this.vel.y < -3) this.play('fall', 0.2);
    else if (!this.onGround && this.current === this.actions.jump) { /* keep jump */ }
    else if (this.moveAmt > 4.2) this.play('sprint', 0.15);
    else if (this.moveAmt > 0.4) this.play('walk', 0.15);
    else this.play('idle', 0.25);
    if (this.current === this.actions.walk) this.current.timeScale = THREE.MathUtils.clamp(this.moveAmt / 2.6, 0.6, 1.6);
    if (this.current === this.actions.sprint) this.current.timeScale = THREE.MathUtils.clamp(this.moveAmt / 5.2, 0.8, 1.3);
    this.mixer.update(dt);
    // footsteps
    if (this.onGround && this.moveAmt > 0.5) {
      this.stepT -= dt * (this.moveAmt > 4.2 ? 1.7 : 1.0) * Math.max(0.6, this.moveAmt / 3.4);
      if (this.stepT <= 0) {
        this.stepT = 0.42;
        this.game.footstep(this.root.position);
      }
    }
  }
}

export function makeNPC(skin, scale = KIT) {
  const { scene, animations } = getAnimated('mini-characters/' + skin);
  scene.scale.setScalar(scale);
  scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  const root = new THREE.Group();
  root.add(scene);
  const mixer = new THREE.AnimationMixer(scene);
  const actions = {};
  for (const c of animations) actions[c.name] = mixer.clipAction(c);
  let current = null;
  const npc = {
    root, model: scene, mixer,
    play(name, fade = 0.2, once = false) {
      const a = actions[name];
      if (!a || current === a) return;
      a.reset();
      a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
      a.clampWhenFinished = once;
      if (current) a.crossFadeFrom(current, fade, true);
      a.play();
      current = a;
    },
    update(dt) { mixer.update(dt); },
  };
  npc.play('idle', 0);
  return npc;
}

export { UP };
