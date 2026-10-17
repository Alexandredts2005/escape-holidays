// Third-person orbit camera with collision, plus smooth cinematic / inspect shots.
import * as THREE from 'three';

export class CameraRig {
  constructor(game) {
    this.game = game;
    this.cam = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.08, 600);
    this.yaw = Math.PI;
    this.pitch = 0.32;
    this.dist = 4.4;
    this.targetDist = 4.4;
    this.minDist = 1.4;
    this.maxDist = 8;
    this.target = new THREE.Vector3();
    this.mode = 'follow';
    this.shot = null;
    this.sens = 0.0026;
    this.invertY = false;
    this.shake = 0;
    this.curDist = 4.4;
  }

  resize(w, h) {
    this.cam.aspect = w / h;
    this.cam.updateProjectionMatrix();
  }

  // move to a fixed shot (inspect / cutscene); returns a promise when arrived
  goTo(pos, look, dur = 0.9, fov = null) {
    this.mode = 'shot';
    const from = { p: this.cam.position.clone(), l: this.lookPoint ? this.lookPoint.clone() : look.clone(), fov: this.cam.fov };
    this.shot = { from, to: { p: pos.clone(), l: look.clone(), fov: fov || this.cam.fov }, t: 0, dur };
    return new Promise((res) => { this.shot.done = res; });
  }

  follow(snap = false) {
    this.mode = 'follow';
    this.shot = null;
    if (snap) this.snap = true;
    if (this.cam.fov !== 55) { this.cam.fov = 55; this.cam.updateProjectionMatrix(); }
  }

  // where the follow camera would be right now (used to glide back from a shot)
  followPose(player) {
    const head = player.position.clone();
    head.y += 1.25;
    const dir = new THREE.Vector3(Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), Math.cos(this.yaw) * Math.cos(this.pitch));
    let d = this.targetDist;
    const hit = this.game.physics.raycast(head, dir, d + 0.3);
    if (hit) d = Math.max(0.35, hit.distance - 0.3);
    this.curDist = d;
    return { pos: head.clone().addScaledVector(dir, d), look: head };
  }

  async glideBack(player, dur = 0.6) {
    const { pos, look } = this.followPose(player);
    await this.goTo(pos, look, dur, 55);
    this.target.copy(look);
    this.follow();
  }

  update(dt, input, player) {
    const m = input.consumeMouse();
    if (this.mode === 'shot') {
      if (!this.shot) return;
      const s = this.shot;
      s.t = Math.min(1, s.t + dt / s.dur);
      const k = s.t < 0.5 ? 4 * s.t ** 3 : 1 - (-2 * s.t + 2) ** 3 / 2;
      this.cam.position.lerpVectors(s.from.p, s.to.p, k);
      const l = new THREE.Vector3().lerpVectors(s.from.l, s.to.l, k);
      this.lookPoint = l;
      this.cam.lookAt(l);
      const fov = THREE.MathUtils.lerp(s.from.fov, s.to.fov, k);
      if (Math.abs(fov - this.cam.fov) > 0.01) { this.cam.fov = fov; this.cam.updateProjectionMatrix(); }
      if (s.t >= 1 && s.done) { const d = s.done; s.done = null; d(); }
      return;
    }
    if (input.lookEnabled) {
      this.yaw -= m.x * this.sens;
      this.pitch += m.y * this.sens * (this.invertY ? -1 : 1);
      this.pitch = THREE.MathUtils.clamp(this.pitch, -0.35, 1.25);
      this.targetDist = THREE.MathUtils.clamp(this.targetDist + m.w * 0.6, this.minDist, this.maxDist);
    }
    const head = player.position.clone();
    head.y += 1.25;
    if (this.snap) { this.target.copy(head); this.snap = false; }
    else this.target.lerp(head, 1 - Math.exp(-dt * 14));
    this.dist = THREE.MathUtils.lerp(this.dist, this.targetDist, 1 - Math.exp(-dt * 8));
    const dir = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch),
    );
    let d = this.dist;
    const hit = this.game.physics.raycast(this.target, dir, d + 0.3);
    if (hit) d = Math.max(0.35, hit.distance - 0.3);
    // smooth in/out (fast in to avoid clipping, slow out)
    this.curDist = d < this.curDist ? d : THREE.MathUtils.lerp(this.curDist, d, 1 - Math.exp(-dt * 5));
    this.cam.position.copy(this.target).addScaledVector(dir, this.curDist);
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt);
      this.cam.position.x += (Math.random() - 0.5) * this.shake * 0.3;
      this.cam.position.y += (Math.random() - 0.5) * this.shake * 0.3;
    }
    this.lookPoint = this.target.clone();
    this.cam.lookAt(this.target);
    // hide the player when the camera is very close
    player.model.visible = this.curDist > 0.75;
  }
}
