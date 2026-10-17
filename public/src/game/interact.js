// Interactable objects: targeting, prompt, highlight, inspect mode with clickable 3D parts.
import * as THREE from 'three';

const _v = new THREE.Vector3();
const _d = new THREE.Vector3();

export class Interactables {
  constructor(game) {
    this.game = game;
    this.list = [];
    this.current = null;
    this.t = 0;
  }

  add(def) {
    def.r = def.r ?? 1.8;
    if (!(def.pos instanceof THREE.Vector3)) def.pos = new THREE.Vector3(...def.pos);
    if (def.obj) this.prepHighlight(def.obj);
    this.list.push(def);
    return def;
  }

  remove(def) {
    this.list = this.list.filter((d) => d !== def);
    if (this.current === def) this.current = null;
  }

  prepHighlight(obj) {
    obj.traverse((m) => {
      if (!m.isMesh || m.userData.hl) return;
      m.material = Array.isArray(m.material) ? m.material.map((x) => x.clone()) : m.material.clone();
      m.userData.hl = true;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      m.userData.baseEmissive = mats.map((x) => (x.emissive ? x.emissive.clone() : null));
    });
  }

  highlight(obj, k) {
    if (!obj) return;
    obj.traverse((m) => {
      if (!m.isMesh || !m.userData.hl) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((x, i) => {
        if (!x.emissive) return;
        const b = m.userData.baseEmissive[i];
        x.emissive.setRGB(b.r + 0.35 * k, b.g + 0.24 * k, b.b + 0.08 * k);
      });
    });
  }

  label(d) {
    if (d.visible && !d.visible()) return null;
    return typeof d.label === 'function' ? d.label() : d.label;
  }

  update(dt) {
    const g = this.game;
    this.t += dt;
    const p = g.player.position;
    const cam = g.rig.cam;
    cam.getWorldDirection(_d);
    let best = null;
    let bestScore = 1e9;
    for (const d of this.list) {
      const dist = Math.hypot(d.pos.x - p.x, d.pos.z - p.z);
      if (dist > d.r || Math.abs(d.pos.y - (p.y + 1)) > (d.dy ?? 2.2)) continue;
      const lab = this.label(d);
      if (!lab) continue;
      _v.copy(d.pos).sub(cam.position).normalize();
      const look = 1 - _v.dot(_d); // 0 = dead centre
      // facing of the player matters too
      const toObj = Math.atan2(d.pos.x - p.x, d.pos.z - p.z);
      let fa = Math.abs(Math.atan2(Math.sin(toObj - g.player.facing), Math.cos(toObj - g.player.facing)));
      if (dist < 0.9) fa *= 0.3;
      const score = look * 4 + fa * 0.6 + dist * 0.25;
      if (fa > 1.9 && look > 0.25) continue;
      if (score < bestScore) { bestScore = score; best = d; }
    }
    if (best !== this.current) {
      if (this.current) this.highlight(this.current.obj, 0);
      this.current = best;
    }
    if (best) {
      this.highlight(best.obj, 0.55 + Math.sin(this.t * 6) * 0.35);
      g.ui.prompt(this.label(best));
    } else g.ui.prompt(null);
    return best;
  }

  use() {
    const d = this.current;
    if (!d) return false;
    this.highlight(d.obj, 0);
    if (d.inspect) this.game.enterInspect(d);
    else if (d.use) d.use(this.game, d);
    return true;
  }
}

// Clickable 3D parts in inspect mode
export class Clicker {
  constructor(game) {
    this.game = game;
    this.ray = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.items = [];
    this.hover = null;
    const dom = game.renderer.r.domElement;
    dom.addEventListener('mousemove', (e) => {
      this.mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    });
    dom.addEventListener('mousedown', (e) => {
      if (!this.items.length || game.ui.dialogOpen || game.ui.noteOpen) return;
      this.mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      const hit = this.pick();
      if (hit) { e.preventDefault(); hit.onClick(e.button === 2 ? -1 : 1, hit); }
    });
    dom.addEventListener('touchstart', (e) => {
      if (!this.items.length) return;
      const t = e.changedTouches[0];
      this.mouse.set((t.clientX / window.innerWidth) * 2 - 1, -(t.clientY / window.innerHeight) * 2 + 1);
      const hit = this.pick();
      if (hit) hit.onClick(1, hit);
    }, { passive: true });
  }

  set(items) {
    this.items = items || [];
    if (!this.items.length && this.hover) { this.game.interact.highlight(this.hover.mesh, 0); this.hover = null; }
    for (const it of this.items) this.game.interact.prepHighlight(it.mesh);
  }

  pick() {
    this.ray.setFromCamera(this.mouse, this.game.rig.cam);
    const meshes = this.items.filter((i) => !i.enabled || i.enabled()).map((i) => i.mesh);
    const hits = this.ray.intersectObjects(meshes, true);
    if (!hits.length) return null;
    let o = hits[0].object;
    while (o && !meshes.includes(o)) o = o.parent;
    return this.items.find((i) => i.mesh === o) || null;
  }

  update() {
    if (!this.items.length) return;
    const h = this.pick();
    if (h !== this.hover) {
      if (this.hover) this.game.interact.highlight(this.hover.mesh, 0);
      this.hover = h;
      document.body.style.cursor = h ? 'pointer' : 'default';
      if (h && h.tip) this.game.ui.prompt(h.tip, 'Clic');
      else this.game.ui.prompt(null);
    }
    if (h) this.game.interact.highlight(h.mesh, 0.6);
  }
}
