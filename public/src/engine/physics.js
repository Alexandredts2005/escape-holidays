// Static world collision (merged box/ramp colliders in a BVH) + dynamic box colliders (doors), capsule character physics.
import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const _box = new THREE.Box3();
const _seg = new THREE.Line3();
const _triPoint = new THREE.Vector3();
const _capPoint = new THREE.Vector3();
const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();

export class Physics {
  constructor() {
    this.parts = [];
    this.dynamic = new Map(); // id -> { mesh, enabled }
    this.collider = null;
    this.debug = false;
  }

  // Oriented box collider (center, size, rotation Y)
  addBox(cx, cy, cz, sx, sy, sz, rotY = 0, tag = 'solid') {
    const g = new THREE.BoxGeometry(sx, sy, sz);
    _m.makeRotationY(rotY).setPosition(cx, cy, cz);
    g.applyMatrix4(_m);
    g.deleteAttribute('uv');
    g.deleteAttribute('normal');
    this.parts.push(g);
    return g;
  }

  // Ramp from (x,z) bottom at y0 to top y1 along direction rotY, width w, length len
  addRamp(x, z, w, len, y0, y1, rotY = 0) {
    const ang = Math.atan2(y1 - y0, len);
    const l = Math.hypot(len, y1 - y0);
    const g = new THREE.BoxGeometry(w, 0.3, l);
    // rotY = 0 rises towards -Z (same convention as Builder.stairs): the -Z end goes up
    const m = new THREE.Matrix4().makeRotationX(ang);
    g.applyMatrix4(m);
    g.translate(0, (y0 + y1) / 2 - 0.15 / Math.cos(ang), 0);
    g.applyMatrix4(new THREE.Matrix4().makeRotationY(rotY));
    g.translate(x, 0, z);
    g.deleteAttribute('uv');
    g.deleteAttribute('normal');
    this.parts.push(g);
  }

  addGeometry(geo, matrix) {
    const g = geo.clone();
    if (matrix) g.applyMatrix4(matrix);
    for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k);
    this.parts.push(g.index ? g.toNonIndexed() : g);
  }

  build() {
    const geos = this.parts.map((g) => (g.index ? g.toNonIndexed() : g));
    const merged = mergeGeometries(geos, false);
    merged.boundsTree = new MeshBVH(merged);
    this.collider = new THREE.Mesh(merged, new THREE.MeshBasicMaterial({ wireframe: true, color: 0xff00ff }));
    this.collider.visible = false;
    return this.collider;
  }

  // Dynamic box (e.g. a door). Toggle with setDynamic(id, enabled)
  addDynamic(id, cx, cy, cz, sx, sy, sz, rotY = 0) {
    const g = new THREE.BoxGeometry(sx, sy, sz);
    g.boundsTree = new MeshBVH(g);
    const mesh = new THREE.Mesh(g);
    mesh.position.set(cx, cy, cz);
    mesh.rotation.y = rotY;
    mesh.updateMatrixWorld(true);
    this.dynamic.set(id, { mesh, enabled: true });
  }

  setDynamic(id, enabled) {
    const d = this.dynamic.get(id);
    if (d) d.enabled = enabled;
  }

  // Push a capsule segment (world space) out of geometry. Returns true if touched.
  resolve(segment, radius) {
    let hit = false;
    const test = (mesh) => {
      const inv = _m.copy(mesh.matrixWorld).invert();
      _seg.copy(segment).applyMatrix4(inv);
      _box.makeEmpty();
      _box.expandByPoint(_seg.start).expandByPoint(_seg.end);
      _box.min.addScalar(-radius);
      _box.max.addScalar(radius);
      mesh.geometry.boundsTree.shapecast({
        intersectsBounds: (box) => box.intersectsBox(_box),
        intersectsTriangle: (tri) => {
          const dist = tri.closestPointToSegment(_seg, _triPoint, _capPoint);
          if (dist < radius) {
            const depth = radius - dist;
            const dir = _capPoint.sub(_triPoint).normalize();
            _seg.start.addScaledVector(dir, depth);
            _seg.end.addScaledVector(dir, depth);
            hit = true;
          }
        },
      });
      segment.copy(_seg).applyMatrix4(mesh.matrixWorld);
    };
    test(this.collider);
    for (const d of this.dynamic.values()) {
      if (!d.enabled) continue;
      if (d.mesh.position.distanceToSquared(segment.start) > 36) continue;
      test(d.mesh);
    }
    return hit;
  }

  raycast(origin, dir, far) {
    const ray = new THREE.Raycaster(origin, dir, 0, far);
    ray.firstHitOnly = true;
    let best = null;
    const hits = [];
    const h = this.collider.geometry.boundsTree.raycastFirst(ray.ray, THREE.DoubleSide);
    if (h) hits.push(h);
    for (const d of this.dynamic.values()) {
      if (!d.enabled) continue;
      const inv = _m.copy(d.mesh.matrixWorld).invert();
      const r2 = ray.ray.clone().applyMatrix4(inv);
      const hh = d.mesh.geometry.boundsTree.raycastFirst(r2, THREE.DoubleSide);
      if (hh) { hh.point.applyMatrix4(d.mesh.matrixWorld); hh.distance = hh.point.distanceTo(origin); hits.push(hh); }
    }
    for (const x of hits) if (x.distance <= far && (!best || x.distance < best.distance)) best = x;
    return best;
  }
}

export { _v as tmpVec };
