// The island: terrain, sea, sky dressing, and assembly of the hotel and every area.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Builder, boxGeo } from './build.js';
import { toon, painted, TILE } from '../engine/toon.js';
import { buildHotel } from './hotel.js';
import { buildExterior, EXTERIOR_MODELS } from './areas/exterior.js';
import { buildLobby, LOBBY_MODELS } from './areas/lobby.js';
import { buildSuite, SUITE_MODELS } from './areas/suite.js';
import { buildSpa, SPA_MODELS } from './areas/spa.js';
import { buildRestaurant, RESTAURANT_MODELS } from './areas/restaurant.js';
import { buildOffice, OFFICE_MODELS } from './areas/office.js';
import { buildGarden } from './areas/garden.js';

export const SEA_Y = -0.25;

export const MODELS = [...new Set([
  'food-kit/tomato', 'food-kit/onion', 'food-kit/fish', 'food-kit/cookie',
  ...EXTERIOR_MODELS, ...LOBBY_MODELS, ...SUITE_MODELS, ...SPA_MODELS, ...RESTAURANT_MODELS, ...OFFICE_MODELS,
])];

// Island outline (superellipse with a little wobble), in world XZ
export function islandOutline(scale = 1, N = 120) {
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const n = 3.4;
    const wob = 1 + 0.025 * Math.sin(a * 5 + 1) + 0.015 * Math.sin(a * 13 + 2);
    const x = Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * 63 * wob * scale;
    const z = Math.sign(s) * Math.pow(Math.abs(s), 2 / n) * (s > 0 ? 51 : 55) * wob * scale + 1;
    pts.push(new THREE.Vector2(x, z));
  }
  return pts;
}

function planarUV(geo, tile) {
  const p = geo.attributes.position;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = p.getX(i) / tile; uv[i * 2 + 1] = p.getZ(i) / tile; }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

function buildTerrain(game, b) {
  const pts = islandOutline();
  const shape = new THREE.Shape(pts.map((p) => new THREE.Vector2(p.x, -p.y)));
  // the swimming pool is dug into the island
  const poolHole = () => { const h = new THREE.Path(); h.moveTo(29.9, 24.1); h.lineTo(29.9, 9.9); h.lineTo(46.1, 9.9); h.lineTo(46.1, 24.1); h.closePath(); return h; };
  shape.holes.push(poolHole());
  const depth = 3;
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 1.2, bevelSegments: 2, curveSegments: 4 });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -depth - 0.6, 0);
  planarUV(geo, TILE.sand || 4);
  painted('sand');
  planarUV(geo, TILE.sand);
  const sand = new THREE.Mesh(geo, toon(0xffffff, { map: painted('sand'), unique: true, rim: false }));
  sand.receiveShadow = true;
  game.scene.add(sand);
  game.physics.addGeometry(geo);
  // grass lawn (inner superellipse) slightly above the sand
  const inner = islandOutline(0.83).map((p) => new THREE.Vector2(p.x, -(p.y - 5.5)));
  const gShape = new THREE.Shape(inner);
  gShape.holes.push(poolHole());
  const gGeo = new THREE.ShapeGeometry(gShape, 4);
  gGeo.rotateX(-Math.PI / 2);
  gGeo.translate(0, 0.03, 0);
  painted('grass');
  planarUV(gGeo, TILE.grass);
  const grass = new THREE.Mesh(gGeo, toon(0xffffff, { map: painted('grass'), unique: true, rim: false }));
  grass.receiveShadow = true;
  game.scene.add(grass);
  b.surface(-80, -80, 80, 80, 'water', -9, -0.3);
  b.surface(-80, -80, 80, 80, 'sand', -0.3, 99);
  // grass footsteps inside the lawn outline (approximate by its bounding superellipse test)
  game.isOnLawn = (x, z) => {
    const nx = Math.abs(x) / (63 * 0.83);
    const nz = Math.abs(z - 5.5 - 1) / ((z > 6.5 ? 51 : 55) * 0.83);
    return Math.pow(nx, 3.4) + Math.pow(nz, 3.4) < 1;
  };
  const prevSurface = game.surfaceAt.bind(game);
  game.surfaceAt = (p) => {
    const t = prevSurface(p);
    return t === 'sand' && game.isOnLawn(p.x, p.z) ? 'grass' : t;
  };
  // shallow sea floor the player can wade on, and an invisible fence further out
  game.physics.addBox(0, -0.85, 0, 260, 0.6, 260);
  const fence = islandOutline(1.12, 48);
  for (let i = 0; i < fence.length; i++) {
    const a = fence[i];
    const c = fence[(i + 1) % fence.length];
    const len = a.distanceTo(c) + 1;
    const ang = Math.atan2(c.y - a.y, c.x - a.x);
    game.physics.addBox((a.x + c.x) / 2, 1, (a.y + c.y) / 2, len, 4, 1, -ang);
  }
}

function seaMaterial(game, { shallow = 0x3fd0d8, deep = 0x1676b8, foam = 0xffffff, scale = 1, pool = false } = {}) {
  const m = new THREE.ShaderMaterial({
    fog: !pool,
    transparent: pool,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      t: { value: 0 }, shallow: { value: new THREE.Color(shallow) }, deep: { value: new THREE.Color(deep) }, foam: { value: new THREE.Color(foam) }, scale: { value: scale },
    }]),
    vertexShader: `varying vec3 wp;
      #include <fog_pars_vertex>
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); wp = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader: `uniform float t; uniform vec3 shallow; uniform vec3 deep; uniform vec3 foam; uniform float scale; varying vec3 wp;
      #include <fog_pars_fragment>
      void main(){
        vec2 p = wp.xz * scale;
        ${pool ? 'float d = 0.0;' : 'float nx = abs(wp.x) / 63.0; float nz = abs(wp.z - 1.0) / (wp.z > 1.0 ? 51.0 : 55.0); float d = pow(pow(nx, 3.4) + pow(nz, 3.4), 1.0 / 3.4);'}
        vec3 c = mix(shallow, deep, smoothstep(1.02, 1.5, d));
        float w = sin(p.x * 0.45 + t * 0.9 + sin(p.y * 0.21 + t * 0.4) * 2.0) * sin(p.y * 0.37 - t * 0.7 + sin(p.x * 0.17) * 2.0);
        float w2 = sin((p.x + p.y) * 0.9 + t * 1.6 + sin(p.x * 0.5 - t) * 1.5);
        c += 0.06 * step(0.55, w);
        float streak = smoothstep(0.93, 0.98, w2 * w);
        c = mix(c, foam, streak * ${pool ? '0.55' : '0.6'});
        gl_FragColor = vec4(c, ${pool ? '0.86' : '1.0'});
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  game.updaters.push((dt, time) => { m.uniforms.t.value = time; });
  return m;
}

function buildSea(game) {
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400, 1, 1), seaMaterial(game));
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = SEA_Y;
  game.scene.add(sea);
  // animated foam ring along the shore
  const pts = islandOutline(1, 160);
  const cen = new THREE.Vector2(0, 1);
  const pos = [];
  const uv = [];
  const idx = [];
  const n = pts.length;
  for (let i = 0; i <= n; i++) {
    const p = pts[i % n];
    const a = pts[(i - 1 + n) % n];
    const c = pts[(i + 1) % n];
    const tng = c.clone().sub(a).normalize();
    let nr = new THREE.Vector2(tng.y, -tng.x);
    if (nr.dot(p.clone().sub(cen)) < 0) nr.negate();
    const inP = p.clone().addScaledVector(nr, 0.6);
    const outP = p.clone().addScaledVector(nr, 5.5);
    pos.push(inP.x, SEA_Y + 0.02, inP.y, outP.x, SEA_Y + 0.02, outP.y);
    uv.push(i / n, 0, i / n, 1);
    if (i < n) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  const fm = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { t: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float t; varying vec2 vUv;
      void main(){ float u = vUv.x * 160.0; float v = vUv.y;
        float wave = fract(v * 2.2 - t * 0.18 + sin(u * 0.7 + t) * 0.04);
        float band = smoothstep(0.0, 0.06, wave) * (1.0 - smoothstep(0.1, 0.2, wave));
        float edge = 1.0 - smoothstep(0.0, 0.12, v);
        float a = max(band * (1.0 - v) * 0.9, edge * (0.75 + 0.25 * sin(u * 1.3 + t * 2.0)));
        gl_FragColor = vec4(1.0, 1.0, 1.0, a * 0.85); }`,
  });
  game.updaters.push((dt, time) => { fm.uniforms.t.value = time; });
  const foam = new THREE.Mesh(g, fm);
  foam.renderOrder = 1;
  game.scene.add(foam);
}

export { seaMaterial };

function buildSkyDressing(game) {
  const cloudMat = toon(0xffffff, { rim: 0.5 });
  const clouds = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const c = new THREE.Group();
    const n = 4 + (i % 3);
    for (let k = 0; k < n; k++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 9), cloudMat);
      const r = 5 + Math.random() * 5;
      s.scale.set(r, r * 0.7, r);
      s.position.set((k - n / 2) * 6 + Math.random() * 3, Math.random() * 2, Math.random() * 4);
      c.add(s);
    }
    const a = (i / 14) * Math.PI * 2;
    const R = 170 + Math.random() * 120;
    c.position.set(Math.cos(a) * R, 55 + Math.random() * 35, Math.sin(a) * R);
    c.rotation.y = -a;
    c.userData.speed = 0.4 + Math.random() * 0.6;
    clouds.add(c);
  }
  clouds.userData.dynamic = true;
  game.scene.add(clouds);
  game.updaters.push((dt) => { clouds.rotation.y += dt * 0.004; });
}

function buildIslets(game, b) {
  // distant scenery islets (unreachable)
  const spots = [[-190, 120, 22], [210, 90, 30], [140, -230, 26], [-240, -150, 34], [40, 260, 18]];
  for (const [x, z, r] of spots) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r, 4, 20), toon(0xf2d9a2, { map: painted('sand') }));
    m.position.set(x, SEA_Y - 1.6, z);
    game.scene.add(m);
    const g = new THREE.Mesh(new THREE.SphereGeometry(r * 0.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(0x5fa84a));
    g.scale.y = 0.35;
    g.position.set(x, SEA_Y + 0.3, z);
    game.scene.add(g);
    for (let k = 0; k < 4; k++) {
      const p = b.prop(k % 2 ? 'nature-kit/tree_palmTall' : 'nature-kit/tree_palmBend', x + (Math.random() - 0.5) * r * 0.8, SEA_Y + 0.5, z + (Math.random() - 0.5) * r * 0.8, { collide: false, s: 3 + Math.random(), rot: Math.random() * 6 });
      p.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    }
  }
}

export function buildWorld(game) {
  const b = new Builder(game);
  buildTerrain(game, b);
  buildSea(game);
  buildSkyDressing(game);
  buildIslets(game, b);
  const hotel = buildHotel(game, b);
  const areas = {
    suite: buildSuite(game, b, hotel),
    lobby: buildLobby(game, b, hotel),
    spa: buildSpa(game, b, hotel),
    restaurant: buildRestaurant(game, b, hotel),
    office: buildOffice(game, b, hotel),
    exterior: buildExterior(game, b, hotel),
  };
  areas.garden = buildGarden(game, b, areas.exterior);
  mergeStatic(game);
  // outdoor zone last: interiors registered first take priority
  b.zone('outside', [-200, -20, -200, 200, 60, 200], { inside: false, music: 'island', area: 'jardins' });
  const world = {
    b, hotel, areas,
    spawn: {
      title: [0, 0.1, 30, Math.PI],
      pier: [0, 0.6, 66, Math.PI],
      suite: [-15, 4.6, -27, Math.PI],
    },
    titleShot(t) {
      const a = t * 0.05 + 0.6;
      const pos = new THREE.Vector3(Math.sin(a) * 78, 26 + Math.sin(t * 0.13) * 4, Math.cos(a) * 78 + 4);
      return { pos, look: new THREE.Vector3(0, 4, -12) };
    },
    safePoint(p) {
      // nearest known safe spot
      const spots = [[0, 0.1, -10, Math.PI], [0, 0.1, 30, Math.PI], [0, 0.1, -24, Math.PI], [-15, 4.6, -27, Math.PI], [36, 0.1, -4, 0], [-36, 0.1, -8, 0],
        [-12, 0.1, -24, 0], [16, 0.1, -22, 0], [16, 4.6, -26, 0]];
      let best = spots[0];
      let bd = 1e9;
      for (const s of spots) {
        if (game.story && !game.story.canReach(s)) continue;
        const d = (s[0] - p.x) ** 2 + (s[1] - p.y) ** 2 * 4 + (s[2] - p.z) ** 2;
        if (d < bd) { bd = d; best = s; }
      }
      return best;
    },
  };
  return world;
}

// Merge every static, opaque mesh by material: thousands of props become a few dozen draw calls.
// Anything that moves or reacts later must be flagged with userData.dynamic (or be an interactable).
function mergeStatic(game) {
  const scene = game.scene;
  scene.updateMatrixWorld(true);
  const groups = new Map();
  scene.traverse((o) => {
    if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh) return;
    for (let p = o; p; p = p.parent) if (p.userData.dynamic || p.userData.hl || p.name === 'player') return;
    const mat = o.material;
    if (!mat || Array.isArray(mat) || mat.transparent || mat.isShaderMaterial || !o.visible) return;
    const geo = o.geometry;
    if (!geo.attributes.position || !geo.attributes.normal) return;
    const key = mat.uuid + (o.castShadow ? 'c' : '-') + (o.receiveShadow ? 'r' : '-');
    if (!groups.has(key)) groups.set(key, { mat, cast: o.castShadow, recv: o.receiveShadow, list: [] });
    groups.get(key).list.push(o);
  });
  let removed = 0;
  for (const gr of groups.values()) {
    if (gr.list.length < 2) continue;
    const geos = gr.list.map((o) => {
      let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      g.applyMatrix4(o.matrixWorld);
      return g;
    });
    const merged = mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    if (!merged) continue;
    merged.computeBoundingSphere();
    const m = new THREE.Mesh(merged, gr.mat);
    m.castShadow = gr.cast;
    m.receiveShadow = gr.recv;
    m.matrixAutoUpdate = false;
    m.name = 'static';
    scene.add(m);
    for (const o of gr.list) { o.parent.remove(o); removed++; }
  }
  game.stats = { merged: removed, groups: groups.size };
}

export { boxGeo };
