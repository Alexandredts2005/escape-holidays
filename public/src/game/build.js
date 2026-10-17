// Architecture & set-dressing helpers. Every solid piece also registers a collider.
import * as THREE from 'three';
import { toon, paintedMat, textTexture } from '../engine/toon.js';
import { get, info, KIT } from '../engine/assets.js';

// Box geometry whose UVs are in world units / tile size so painted textures tile correctly.
export function boxGeo(w, h, d, tile = 2) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      uv.setXY(k, uv.getX(k) * dims[f][0] / tile, uv.getY(k) * dims[f][1] / tile);
    }
  }
  return g;
}

export class Builder {
  constructor(game, parent) {
    this.game = game;
    this.phys = game.physics;
    this.root = parent || game.scene;
    this.statics = [];
  }

  add(o) { this.root.add(o); return o; }

  // footstep surface zone (later registrations take priority)
  surface(x0, z0, x1, z1, type, y0 = -9, y1 = 99) {
    this.game.surfaces.push({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), type, y0, y1 });
  }

  // light source candidate for the pooled point lights
  lamp(x, y, z, o = {}) {
    const l = { pos: new THREE.Vector3(x, y, z), color: o.color ?? 0xffd9a0, intensity: o.intensity ?? 6, range: o.range ?? 10, on: o.on, flicker: o.flicker };
    this.game.lamps.push(l);
    return l;
  }

  // lighting / music zone. box = [x0, y0, z0, x1, y1, z1]
  zone(name, box, o = {}) {
    const z = { name, box, inside: o.inside ?? true, music: o.music, musicVol: o.musicVol, area: o.area, enter: o.enter };
    this.game.zones.push(z);
    return z;
  }

  M(name, color = 0xffffff, opts) {
    if (typeof name === 'number') return toon(name, opts);
    return paintedMat(name, color, opts);
  }

  // Box with bottom at y. mat: material or name. Returns mesh.
  box(x, y, z, w, h, d, mat, o = {}) {
    const m = typeof mat === 'string' || typeof mat === 'number' ? this.M(mat, o.color) : mat;
    const tile = (m && m.userData && m.userData.tile) || 2;
    const mesh = new THREE.Mesh(boxGeo(w, h, d, o.tile || tile), m);
    mesh.position.set(x, y + h / 2, z);
    mesh.rotation.y = o.rot || 0;
    mesh.castShadow = o.cast !== false;
    mesh.receiveShadow = true;
    if (o.collide !== false) this.phys.addBox(x, y + h / 2, z, w, h, d, o.rot || 0);
    if (o.name) mesh.name = o.name;
    (o.parent || this.root).add(mesh);
    return mesh;
  }

  // Floor slab whose top surface is at y
  floor(x0, z0, x1, z1, y, mat, o = {}) {
    const t = o.t || 0.3;
    return this.box((x0 + x1) / 2, y - t, (z0 + z1) / 2, Math.abs(x1 - x0), t, Math.abs(z1 - z0), mat, { cast: false, ...o });
  }

  ceiling(x0, z0, x1, z1, y, mat, o = {}) {
    return this.box((x0 + x1) / 2, y, (z0 + z1) / 2, Math.abs(x1 - x0), o.t || 0.25, Math.abs(z1 - z0), mat, { cast: o.cast ?? true, ...o });
  }

  // Straight wall from (x0,z0) to (x1,z1). openings: [{ at, w, h, y, glass }] measured along the wall from start.
  // skinA / skinB: material names for thin decorative skins on the +normal / -normal side (normal = (-uz, ux)).
  wall(x0, z0, x1, z1, o = {}) {
    const h = o.h ?? 3.6;
    const t = o.t ?? 0.3;
    const y = o.y ?? 0;
    const mat = o.mat || 'stucco';
    const len = Math.hypot(x1 - x0, z1 - z0);
    const ang = Math.atan2(z1 - z0, x1 - x0);
    const ux = (x1 - x0) / len;
    const uz = (z1 - z0) / len;
    const nx = -uz;
    const nz = ux;
    const ops = (o.openings || []).slice().sort((a, b) => a.at - b.at);
    const seg = (a, b, yy, hh) => {
      if (b - a < 0.01 || hh < 0.01) return;
      const mid = (a + b) / 2;
      const cx = x0 + ux * mid;
      const cz = z0 + uz * mid;
      this.box(cx, yy, cz, b - a, hh, t, mat, { rot: -ang, collide: o.collide, cast: o.cast });
      for (const [skin, sgn] of [[o.skinA, 1], [o.skinB, -1]]) {
        if (!skin) continue;
        const off = t / 2 + 0.012;
        this.box(cx + nx * off * sgn, yy, cz + nz * off * sgn, b - a, hh, 0.02, skin, { rot: -ang, collide: false, cast: false });
      }
    };
    let cur = 0;
    for (const op of ops) {
      const a = op.at - op.w / 2;
      const b = op.at + op.w / 2;
      seg(cur, a, y, h);
      const oy = op.y ?? 0;
      const oh = op.h ?? 2.3;
      if (oy > 0) seg(a, b, y, oy);
      if (oy + oh < h) seg(a, b, y + oy + oh, h - oy - oh);
      if (op.glass) this.glass(x0 + ux * op.at, y + oy, z0 + uz * op.at, op.w, oh, -ang, op.frame);
      if (op.trim !== false && !op.glass) this.trim(x0 + ux * op.at, y + oy, z0 + uz * op.at, op.w, oh, -ang, t, op.trimColor);
      cur = b;
    }
    seg(cur, len, y, h);
    return { ang, len, ux, uz, nx, nz, rot: -ang };
  }

  // decorative frame around a doorway
  trim(x, y, z, w, h, rot, t, color = 0xfff4e0) {
    const m = toon(color);
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    const mk = (bx, by, bw, bh) => {
      const g = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, t + 0.08), m);
      g.position.set(x + c * bx, y + by, z - s * bx);
      g.rotation.y = rot;
      g.castShadow = true;
      this.root.add(g);
    };
    mk(-w / 2 - 0.06, h / 2, 0.12, h);
    mk(w / 2 + 0.06, h / 2, 0.12, h);
    mk(0, h + 0.06, w + 0.24, 0.12);
  }

  glass(x, y, z, w, h, rot, frame = 0xffffff) {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(w, h), toon(0xbfe9ff, { transparent: true, opacity: 0.32, side: THREE.DoubleSide, rim: false }));
    g.position.set(x, y + h / 2, z);
    g.rotation.y = rot;
    g.renderOrder = 2;
    this.root.add(g);
    // collider so the player cannot walk through windows
    this.phys.addBox(x, y + h / 2, z, w, h, 0.1, rot);
    const fm = toon(frame);
    const bar = (bx, by, bw, bh) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.08), fm);
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      m.position.set(x + c * bx, y + by, z - s * bx);
      m.rotation.y = rot;
      this.root.add(m);
    };
    bar(0, h / 2, 0.06, h);
    bar(0, h / 2, w, 0.06);
    bar(-w / 2, h / 2, 0.08, h);
    bar(w / 2, h / 2, 0.08, h);
    bar(0, 0.04, w + 0.08, 0.08);
    bar(0, h - 0.04, w + 0.08, 0.08);
  }

  // Simple straight staircase going from (x,z) in direction rot (0 = towards -Z), rising `rise` over `run`
  stairs(x, z, w, run, rise, rot, mat, y0 = 0) {
    const n = Math.max(2, Math.round(rise / 0.18));
    const sh = rise / n;
    const sd = run / n;
    const g = new THREE.Group();
    const m = typeof mat === 'string' ? this.M(mat) : mat;
    for (let i = 0; i < n; i++) {
      const step = new THREE.Mesh(boxGeo(w, sh * (i + 1), sd, 1.5), m);
      step.position.set(0, (sh * (i + 1)) / 2, -(i + 0.5) * sd);
      step.castShadow = true;
      step.receiveShadow = true;
      g.add(step);
    }
    g.position.set(x, y0, z);
    g.rotation.y = rot;
    this.root.add(g);
    const cx = x - Math.sin(rot) * run / 2;
    const cz = z - Math.cos(rot) * run / 2;
    this.phys.addRamp(cx, cz, w, run, y0, y0 + rise, rot);
    return g;
  }

  column(x, z, r, h, mat = 0xfff4e0, y = 0) {
    const m = typeof mat === 'number' ? toon(mat) : this.M(mat);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.08, h, 16), m);
    c.position.set(x, y + h / 2, z);
    c.castShadow = true;
    c.receiveShadow = true;
    this.root.add(c);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(r * 2.6, 0.25, r * 2.6), m);
    cap.position.set(x, y + h - 0.12, z);
    this.root.add(cap);
    const base = cap.clone();
    base.position.y = y + 0.12;
    this.root.add(base);
    this.phys.addBox(x, y + h / 2, z, r * 2, h, r * 2);
    return c;
  }

  // Place a Kenney model by footprint centre. o: { rot, s (scale multiplier on KIT), collide, pad, y, tint, h (target height) }
  prop(name, x, y, z, o = {}) {
    const inf = info(name);
    const obj = get(name);
    let s = (o.s ?? 1) * (o.kit ?? KIT);
    if (o.h && inf) s = o.h / inf.size[1];
    if (o.w && inf) s = o.w / Math.max(inf.size[0], inf.size[2]);
    const wrap = new THREE.Group();
    obj.scale.setScalar(s);
    if (inf) obj.position.set(-(inf.min[0] + inf.size[0] / 2) * s, -inf.min[1] * s, -(inf.min[2] + inf.size[2] / 2) * s);
    wrap.add(obj);
    wrap.position.set(x, y, z);
    wrap.rotation.y = o.rot || 0;
    if (o.tint) obj.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.multiply(new THREE.Color(o.tint)); } });
    if (o.noShadow) obj.traverse((m) => { if (m.isMesh) m.castShadow = false; });
    (o.parent || this.root).add(wrap);
    if (o.collide !== false && inf) {
      const pad = o.pad ?? 0;
      const sx = inf.size[0] * s + pad;
      const sy = (o.colH ?? inf.size[1] * s);
      const sz = inf.size[2] * s + pad;
      this.phys.addBox(x, y + sy / 2, z, Math.max(0.05, sx), sy, Math.max(0.05, sz), o.rot || 0);
    }
    wrap.userData.size = inf ? inf.size.map((v) => v * s) : [1, 1, 1];
    wrap.userData.model = name;
    return wrap;
  }

  // Flat textured plane (signs, paintings, rugs). rot = facing direction (0 faces +Z)
  plane(x, y, z, w, h, map, o = {}) {
    const m = toon(0xffffff, { map, transparent: !!o.transparent, side: o.double ? THREE.DoubleSide : THREE.FrontSide, rim: false, unique: true });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    p.position.set(x, y, z);
    p.rotation.y = o.rot || 0;
    if (o.flat) { p.rotation.x = -Math.PI / 2; p.rotation.z = o.rot || 0; p.rotation.y = 0; }
    p.receiveShadow = !o.emissive;
    if (o.emissive) { m.emissive = new THREE.Color(0xffffff); m.emissiveMap = map; m.emissiveIntensity = o.emissive; }
    (o.parent || this.root).add(p);
    return p;
  }

  sign(lines, x, y, z, rot, w = 1.6, h = 0.8, o = {}) {
    const t = textTexture(lines, { w: 512, h: Math.round(512 * h / w), font: o.font || '700 44px Poppins', bg: o.bg ?? '#fff6e3', fg: o.fg || '#2a2233', border: o.border ?? '#2a2233' });
    const p = this.plane(x, y, z, w, h, t, { rot, ...o });
    return p;
  }

  frame(x, y, z, w, h, map, rot, color = 0xc9a24a) {
    const g = new THREE.Group();
    const fm = toon(color);
    const b = 0.08;
    const mk = (bw, bh, px, py) => { const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.06), fm); m.position.set(px, py, 0); g.add(m); };
    mk(w + b * 2, b, 0, h / 2 + b / 2);
    mk(w + b * 2, b, 0, -h / 2 - b / 2);
    mk(b, h, -w / 2 - b / 2, 0);
    mk(b, h, w / 2 + b / 2, 0);
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), toon(0xffffff, { map, rim: false, unique: true }));
    pic.position.z = 0.01;
    g.add(pic);
    g.position.set(x, y, z);
    g.rotation.y = rot;
    this.root.add(g);
    return g;
  }
}

// ------------------------------------------------------------------ doors
export class Door {
  // hinge at (x,z); leaf extends along the wall direction (rot as returned by wall().rot). swing: +1 / -1
  constructor(b, id, x, z, rot, o = {}) {
    this.b = b;
    this.game = b.game;
    this.id = id;
    this.w = o.w ?? 1.1;
    this.h = o.h ?? 2.3;
    this.swing = o.swing ?? 1;
    this.open = false;
    this.angle = 0;
    this.target = 0;
    this.baseRot = rot;
    this.pivot = new THREE.Group();
    this.pivot.userData.dynamic = true;
    this.pivot.position.set(x, o.y ?? 0, z);
    this.pivot.rotation.y = rot;
    const mat = o.mat ? (typeof o.mat === 'string' ? b.M(o.mat) : o.mat) : toon(o.color ?? 0x8a4f2a);
    this.leaf = new THREE.Mesh(o.fit ? new THREE.BoxGeometry(this.w, this.h, 0.09) : boxGeo(this.w, this.h, 0.09, 1), mat);
    this.leaf.position.set(this.w / 2, this.h / 2, 0);
    this.leaf.castShadow = true;
    this.pivot.add(this.leaf);
    if (o.panels !== false) {
      const pmat = toon(o.panelColor ?? 0x6f3c1e);
      for (const py of [this.h * 0.28, this.h * 0.7]) {
        for (const side of [1, -1]) {
          const p = new THREE.Mesh(new THREE.BoxGeometry(this.w * 0.62, this.h * 0.3, 0.02), pmat);
          p.position.set(this.w / 2, py, side * 0.055);
          this.pivot.add(p);
        }
      }
    }
    if (o.window) {
      const g = new THREE.Mesh(new THREE.PlaneGeometry(this.w * 0.5, this.h * 0.35), toon(0xbfe9ff, { transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
      g.position.set(this.w / 2, this.h * 0.7, 0);
      this.pivot.add(g);
    }
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), toon(0xffd25a));
    knob.position.set(this.w - 0.12, 1.02, 0.08);
    this.pivot.add(knob);
    const k2 = knob.clone();
    k2.position.z = -0.08;
    this.pivot.add(k2);
    b.root.add(this.pivot);
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    this.center = new THREE.Vector3(x + c * this.w / 2, (o.y ?? 0) + 1.1, z - s * this.w / 2);
    b.phys.addDynamic('door:' + id, this.center.x, (o.y ?? 0) + this.h / 2, this.center.z, this.w, this.h, 0.22, rot);
    this.game.doors[id] = this;
    if (o.open) this.setOpen(true, true);
  }

  setOpen(v, instant = false) {
    this.open = v;
    this.target = v ? this.swing * Math.PI * 0.56 : 0;
    this.b.phys.setDynamic('door:' + this.id, !v);
    if (instant) {
      this.angle = this.target;
      this.pivot.rotation.y = this.baseRot + this.angle;
    } else this.game.audio.sfxAt(v ? 'door_open1' : 'door_close1', this.center, this.game.player.root, 0.9);
  }

  update(dt) {
    if (Math.abs(this.angle - this.target) < 0.0005) return;
    this.angle += (this.target - this.angle) * (1 - Math.exp(-dt * 6));
    this.pivot.rotation.y = this.baseRot + this.angle;
  }
}
