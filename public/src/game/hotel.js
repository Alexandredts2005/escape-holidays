// Hotel structure: facades, floors, ceilings, partition walls, doors, stairs, roofs and the big sign.
import * as THREE from 'three';
import { Door } from './build.js';
import { toon, paintedMat, textTexture, canvasTexture } from '../engine/toon.js';
import { star } from './items.js';

export const Y1 = 4.5; // first floor level
export const H0 = 4.5; // ground floor wall height (up to the first floor)
export const H1 = 3.9; // first floor wall height
export const ROOF = 8.4;
export const LOBBY_TOP = 9.9;

const PINK = 0xffcdb8;
const TRIM = 0xfff6ea;
const TEAL = 0x2fa59b;

// a door leaf placed in a wall opening: wall info from Builder.wall, wall start (x0,z0), distance `at`, width w
export function doorIn(b, wi, x0, z0, at, w, id, o = {}) {
  const hx = x0 + wi.ux * (at - w / 2);
  const hz = z0 + wi.uz * (at - w / 2);
  return new Door(b, id, hx, hz, wi.rot, { w, ...o });
}

let shutterTex = null;
function shutterMat() {
  if (!shutterTex) {
    shutterTex = canvasTexture(64, 128, (x, w, h) => {
      x.fillStyle = '#2fa59b'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#1d7a72'; x.lineWidth = 4;
      for (let i = 8; i < h; i += 12) { x.beginPath(); x.moveTo(6, i); x.lineTo(w - 6, i); x.stroke(); }
      x.strokeRect(2, 2, w - 4, h - 4);
    });
  }
  return toon(0xffffff, { map: shutterTex });
}

// exterior window dressing: shutters + sill (+ optional awning) on the outer side of a wall
function windowDeco(b, wi, x0, z0, at, w, y, h, { shutters = true, awning = null, sill = true } = {}) {
  const cx = x0 + wi.ux * at;
  const cz = z0 + wi.uz * at;
  const off = 0.2;
  const ox = cx + wi.nx * off;
  const oz = cz + wi.nz * off;
  if (sill) b.box(ox, y - 0.12, oz, w + 0.3, 0.12, 0.22, toon(TRIM), { rot: wi.rot, collide: false });
  b.box(ox, y + h, oz, w + 0.3, 0.14, 0.16, toon(TRIM), { rot: wi.rot, collide: false, cast: false });
  if (shutters) {
    const sm = shutterMat();
    for (const s of [-1, 1]) {
      const d = w / 2 + 0.36;
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.62, h, 0.05), sm);
      m.position.set(ox + wi.ux * d * s, y + h / 2, oz + wi.uz * d * s);
      m.rotation.y = wi.rot;
      m.castShadow = true;
      b.root.add(m);
    }
  }
  if (awning) {
    const a = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.06, 1.1), paintedMat(awning));
    a.position.set(cx + wi.nx * 0.7, y + h + 0.45, cz + wi.nz * 0.7);
    a.rotation.set(0.38, wi.rot, 0, 'YXZ');
    a.castShadow = true;
    b.root.add(a);
    const val = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.25, 0.04), paintedMat(awning));
    val.position.set(cx + wi.nx * 1.22, y + h + 0.12, cz + wi.nz * 1.22);
    val.rotation.y = wi.rot;
    b.root.add(val);
  }
}

// straight horizontal band (cornice / plinth) along a facade
function band(b, x0, z0, x1, z1, y, h, depth, color, out) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const ang = Math.atan2(z1 - z0, x1 - x0);
  const ux = (x1 - x0) / len;
  const uz = (z1 - z0) / len;
  const nx = -uz * out;
  const nz = ux * out;
  b.box((x0 + x1) / 2 + nx * (0.15 + depth / 2 - 0.05), y, (z0 + z1) / 2 + nz * (0.15 + depth / 2 - 0.05), len + depth * 2, h, depth + 0.1, toon(color), { rot: -ang, collide: false, cast: false });
}

export function buildHotel(game, b) {
  const st = paintedMat('stucco', PINK);
  const H = {};
  const ext = { mat: st };
  const wp = 'wallpaper';
  const wpp = 'wallpaper_pink';
  const spa = 'spatile';
  const pan = paintedMat('wallpaper', 0xe8dcff);

  // ------------------------------------------------ ground floor finishes (top at y = 0.05)
  b.floor(-8, -40, 8, -16, 0.05, 'marble', { t: 0.08 });
  b.floor(-24, -40, -8, -16, 0.05, 'spatile', { t: 0.08 });
  b.floor(8, -28, 24, -16, 0.05, 'parquet', { t: 0.08 });
  b.floor(8, -40, 24, -28, 0.05, 'kitchen', { t: 0.08 });
  b.surface(-8, -40, 8, -16, 'concrete', -1, 4);
  b.surface(-24, -40, -8, -16, 'concrete', -1, 4);
  b.surface(8, -28, 24, -16, 'wood', -1, 4);
  b.surface(8, -40, 24, -28, 'concrete', -1, 4);

  // ------------------------------------------------ first floor slabs (4.2 .. 4.5)
  const slab = (x0, z0, x1, z1, mat, color) => {
    b.box((x0 + x1) / 2, Y1 - 0.3, (z0 + z1) / 2, Math.abs(x1 - x0), 0.3, Math.abs(z1 - z0), paintedMat(mat, color), { cast: true });
    b.box((x0 + x1) / 2, Y1 - 0.34, (z0 + z1) / 2, Math.abs(x1 - x0) - 0.02, 0.04, Math.abs(z1 - z0) - 0.02, paintedMat('stucco', 0xfffaf2), { collide: false, cast: false });
  };
  slab(-24, -36, -8, -16, 'parquet', 0xffe6d0); // suite
  slab(8, -36, 24, -16, 'parquet', 0xd9b59a); // office
  slab(-24, -40, 24, -36, 'carpet'); // corridor + mezzanine
  b.surface(-24, -40, 24, -36, 'carpet', 4, 9);
  b.surface(-24, -36, -8, -16, 'wood', 4, 9);
  b.surface(8, -36, 24, -16, 'carpet', 4, 9);

  // ------------------------------------------------ roofs & ceilings
  const roofSlab = (x0, z0, x1, z1, y, ceilColor = 0xfffaf2) => {
    b.box((x0 + x1) / 2, y, (z0 + z1) / 2, Math.abs(x1 - x0) + 0.3, 0.3, Math.abs(z1 - z0) + 0.3, paintedMat('stucco', 0xe8ddd0));
    b.box((x0 + x1) / 2, y - 0.04, (z0 + z1) / 2, Math.abs(x1 - x0) - 0.02, 0.04, Math.abs(z1 - z0) - 0.02, paintedMat('stucco', ceilColor), { collide: false, cast: false });
  };
  roofSlab(-24, -40, -8, -16, ROOF);
  roofSlab(8, -40, 24, -16, ROOF);
  roofSlab(-8, -40, 8, -16, LOBBY_TOP, 0xfff1d6);

  // ------------------------------------------------ outer walls
  // south facade (z = -16), drawn west → east: +normal = south = outside
  let w;
  w = b.wall(-24.15, -16, -8, -16, { h: H0, ...ext, skinB: spa, openings: [{ at: 4.15, w: 1.6, y: 2.3, h: 1.1, glass: true }, { at: 12.15, w: 2.4, y: 0.8, h: 2.4, glass: true }] });
  windowDeco(b, w, -24.15, -16, 4.15, 1.6, 2.3, 1.1, { shutters: false });
  windowDeco(b, w, -24.15, -16, 12.15, 2.4, 0.8, 2.4, { awning: 'awning_teal' });
  w = b.wall(-8, -16, 8, -16, { h: H0, ...ext, skinB: wp, openings: [{ at: 3, w: 2.2, y: 0.7, h: 3.0, glass: true }, { at: 8, w: 3.2, h: 3.4, trimColor: 0xe9c46a }, { at: 13, w: 2.2, y: 0.7, h: 3.0, glass: true }] });
  H.mainWall = w;
  windowDeco(b, w, -8, -16, 3, 2.2, 0.7, 3.0, { shutters: false });
  windowDeco(b, w, -8, -16, 13, 2.2, 0.7, 3.0, { shutters: false });
  H.mainL = doorIn(b, w, -8, -16, 7.2, 1.6, 'main_l', { h: 3.4, color: 0x2fa59b, panelColor: 0x1d7a72, window: true, swing: 1 });
  // right leaf: hinge on the east side, leaf pointing west (rot + PI)
  H.mainR = new Door(b, 'main_r', 1.6, -16, w.rot + Math.PI, { w: 1.6, h: 3.4, color: 0x2fa59b, panelColor: 0x1d7a72, window: true, swing: -1 });
  w = b.wall(8, -16, 24.15, -16, { h: H0, ...ext, skinB: wpp, openings: [3.5, 8, 12.5].map((at) => ({ at, w: 2.8, y: 0.6, h: 3.0, glass: true })) });
  for (const at of [3.5, 8, 12.5]) windowDeco(b, w, 8, -16, at, 2.8, 0.6, 3.0, { shutters: false, awning: 'awning' });
  // first floor south
  w = b.wall(-24.15, -16, -8, -16, { y: Y1, h: H1, ...ext, skinB: wpp, openings: [{ at: 2.65, w: 1.6, y: 0.9, h: 1.9, glass: true }, { at: 8.15, w: 1.4, h: 2.5 }, { at: 13.15, w: 1.6, y: 0.9, h: 1.9, glass: true }] });
  H.balconyWall = w;
  windowDeco(b, w, -24.15, -16, 2.65, 1.6, Y1 + 0.9, 1.9);
  windowDeco(b, w, -24.15, -16, 13.15, 1.6, Y1 + 0.9, 1.9);
  w = b.wall(-8, -16, 8, -16, { y: Y1, h: LOBBY_TOP + 0.3 - Y1, ...ext, skinB: wp, openings: [{ at: 3, w: 2.2, y: 0.6, h: 3.2, glass: true }, { at: 8, w: 3.0, y: 0.5, h: 2.6, glass: true }, { at: 13, w: 2.2, y: 0.6, h: 3.2, glass: true }] });
  for (const at of [3, 13]) windowDeco(b, w, -8, -16, at, 2.2, Y1 + 0.6, 3.2, { shutters: false });
  w = b.wall(8, -16, 24.15, -16, { y: Y1, h: H1, ...ext, skinB: pan, openings: [3.5, 8, 12.5].map((at) => ({ at, w: 1.6, y: 0.9, h: 1.9, glass: true })) });
  for (const at of [3.5, 8, 12.5]) windowDeco(b, w, 8, -16, at, 1.6, Y1 + 0.9, 1.9);

  // north facade (z = -40), drawn east → west: +normal = north = outside
  w = b.wall(24.15, -40, 8, -40, { h: H0, ...ext, skinB: spa, openings: [{ at: 4.15, w: 1.6, y: 1.5, h: 1.3, glass: true }, { at: 12.15, w: 1.6, y: 1.5, h: 1.3, glass: true }] });
  for (const at of [4.15, 12.15]) windowDeco(b, w, 24.15, -40, at, 1.6, 1.5, 1.3);
  b.wall(8, -40, -8, -40, { h: LOBBY_TOP + 0.3, ...ext, skinB: wp, openings: [{ at: 4, w: 1.6, y: Y1 + 1.2, h: 2.6, glass: true }, { at: 12, w: 1.6, y: Y1 + 1.2, h: 2.6, glass: true }] });
  w = b.wall(-8, -40, -24.15, -40, { h: H0, ...ext, skinB: spa, openings: [{ at: 4, w: 1.4, y: 2.4, h: 1.0, glass: true }] });
  windowDeco(b, w, -8, -40, 4, 1.4, 2.4, 1.0, { shutters: false });
  w = b.wall(24.15, -40, 8, -40, { y: Y1, h: H1, ...ext, skinB: wp, openings: [{ at: 4.15, w: 1.4, y: 0.9, h: 1.8, glass: true }, { at: 12.15, w: 1.4, y: 0.9, h: 1.8, glass: true }] });
  for (const at of [4.15, 12.15]) windowDeco(b, w, 24.15, -40, at, 1.4, Y1 + 0.9, 1.8);
  w = b.wall(-8, -40, -24.15, -40, { y: Y1, h: H1, ...ext, skinB: wp, openings: [{ at: 4, w: 1.4, y: 0.9, h: 1.8, glass: true }, { at: 12, w: 1.4, y: 0.9, h: 1.8, glass: true }] });
  for (const at of [4, 12]) windowDeco(b, w, -8, -40, at, 1.4, Y1 + 0.9, 1.8);
  H.corridorNorth = { x0: -24, x1: 24, z: -40 };

  // west facade (x = -24), drawn north → south: +normal = west = outside
  w = b.wall(-24, -40.15, -24, -15.85, { h: H0, ...ext, skinB: spa, openings: [{ at: 20.15, w: 1.4, y: 2.3, h: 1.0, glass: true }] });
  windowDeco(b, w, -24, -40.15, 20.15, 1.4, 2.3, 1.0, { shutters: false });
  w = b.wall(-24, -40.15, -24, -15.85, { y: Y1, h: H1, ...ext, skinB: wpp, openings: [{ at: 2.15, w: 1.2, y: 0.9, h: 1.8, glass: true }, { at: 10.15, w: 1.6, y: 0.9, h: 1.9, glass: true }, { at: 18.15, w: 1.6, y: 0.9, h: 1.9, glass: true }] });
  for (const at of [2.15, 10.15, 18.15]) windowDeco(b, w, -24, -40.15, at, at < 3 ? 1.2 : 1.6, Y1 + 0.9, at < 3 ? 1.8 : 1.9);

  // east facade (x = 24), drawn south → north: +normal = east = outside
  w = b.wall(24, -15.85, 24, -40.15, { h: H0, ...ext, skinB: wpp, openings: [{ at: 6.15, w: 2.6, y: 0.6, h: 3.0, glass: true }, { at: 18.15, w: 1.6, y: 1.5, h: 1.3, glass: true }] });
  windowDeco(b, w, 24, -15.85, 6.15, 2.6, 0.6, 3.0, { shutters: false, awning: 'awning' });
  windowDeco(b, w, 24, -15.85, 18.15, 1.6, 1.5, 1.3);
  w = b.wall(24, -15.85, 24, -40.15, { y: Y1, h: H1, ...ext, skinB: pan, openings: [{ at: 4.15, w: 1.6, y: 0.9, h: 1.9, glass: true }, { at: 10.15, w: 1.3, y: 0.3, h: 1.6 }, { at: 15.15, w: 1.6, y: 0.9, h: 1.9, glass: true }, { at: 22.15, w: 1.2, y: 0.9, h: 1.8, glass: true }] });
  H.hatchWall = w;
  for (const at of [4.15, 15.15, 22.15]) windowDeco(b, w, 24, -15.85, at, at > 20 ? 1.2 : 1.6, Y1 + 0.9, at > 20 ? 1.8 : 1.9);
  H.hatch = doorIn(b, w, 24, -15.85, 10.15, 1.3, 'hatch', { h: 1.6, y: Y1 + 0.3, color: 0x6b3a24, panels: false, swing: -1 });

  // ------------------------------------------------ partitions, ground floor
  // lobby | spa (x = -8), drawn south → north: +normal = +x = lobby
  w = b.wall(-8, -16, -8, -40, { h: H0, mat: st, skinA: wp, skinB: spa, openings: [{ at: 10, w: 1.6, h: 2.7, trimColor: 0xe9c46a }] });
  H.spaDoor = doorIn(b, w, -8, -16, 10, 1.6, 'spa', { h: 2.7, color: 0xeef6f2, panelColor: 0x9ed9cf, window: true, swing: 1 });
  // lobby | kitchen + restaurant (x = 8), drawn north → south: +normal = -x = lobby
  b.wall(8, -40, 8, -28, { h: H0, mat: st, skinA: wp, skinB: spa });
  w = b.wall(8, -28, 8, -16, { h: H0, mat: st, skinA: wp, skinB: wpp, openings: [{ at: 7, w: 1.6, h: 2.7, trimColor: 0xe9c46a }] });
  H.restoDoor = doorIn(b, w, 8, -28, 7, 1.6, 'resto', { h: 2.7, color: 0xa8323a, panelColor: 0x7a1f26, swing: 1 });
  // restaurant | kitchen (z = -28), drawn west → east: +normal = +z = restaurant
  w = b.wall(8, -28, 24, -28, { h: H0, mat: st, skinA: wpp, skinB: spa, openings: [{ at: 12, w: 1.4, h: 2.5 }] });
  H.kitchenDoor = doorIn(b, w, 8, -28, 12, 1.4, 'kitchen', { h: 2.5, color: 0xdfe7f0, panelColor: 0xc9d2d8, window: true, swing: 1 });
  // spa rooms (x = -16), drawn south → north: +normal = +x = spa hall
  w = b.wall(-16, -16, -16, -40, { h: H0, mat: st, skinA: spa, skinB: spa, openings: [4, 12, 20].map((at) => ({ at, w: 1.2, h: 2.4 })) });
  H.spaRoomsWall = w;
  H.vestDoor = doorIn(b, w, -16, -16, 4, 1.2, 'vestiaire', { h: 2.4, color: 0xffffff, panelColor: 0x9ed9cf, swing: 1, open: true });
  H.hammamDoor = doorIn(b, w, -16, -16, 12, 1.2, 'hammam', { h: 2.4, color: 0xbfe9ff, panelColor: 0x9ed9cf, window: true, swing: 1, open: true });
  H.saunaDoor = doorIn(b, w, -16, -16, 20, 1.2, 'sauna', { h: 2.4, color: 0xb98a55, panelColor: 0x8a5e33, window: true, swing: 1 });
  b.wall(-24, -24, -16, -24, { h: H0, mat: st, skinA: spa, skinB: spa });
  b.wall(-24, -32, -16, -32, { h: H0, mat: st, skinA: spa, skinB: 'wood' });

  // ------------------------------------------------ partitions, first floor
  // corridor | suite (z = -36), drawn west → east: +normal = +z = suite
  w = b.wall(-24.15, -36, -8, -36, { y: Y1, h: H1, mat: st, skinA: wpp, skinB: wp, openings: [{ at: 8.15, w: 1.2, h: 2.4, trimColor: 0xe9c46a }] });
  H.suiteDoor = doorIn(b, w, -24.15, -36, 8.15, 1.2, 'suite', { y: Y1, h: 2.4, color: 0xffffff, panelColor: 0xf0d9c0, swing: -1 });
  // corridor | office (z = -36)
  w = b.wall(8, -36, 24.15, -36, { y: Y1, h: H1, mat: st, skinA: pan, skinB: wp, openings: [{ at: 8, w: 1.4, h: 2.6, trimColor: 0xe9c46a }] });
  H.officeDoor = doorIn(b, w, 8, -36, 8, 1.4, 'office', { y: Y1, h: 2.6, color: 0x5a2c1a, panelColor: 0x3b1d10, swing: -1 });
  H.officeWall = w;
  // lobby | suite upper (x = -8), drawn south → north: +normal = +x = lobby
  b.wall(-8, -16, -8, -36, { y: Y1, h: LOBBY_TOP + 0.3 - Y1, mat: st, skinA: wp, skinB: wpp });
  // lobby | office upper (x = 8), drawn north → south: +normal = -x = lobby
  b.wall(8, -36, 8, -16, { y: Y1, h: LOBBY_TOP + 0.3 - Y1, mat: st, skinA: wp, skinB: pan });
  // fillers above the corridor where it crosses the lobby walls
  b.wall(-8, -36, -8, -40, { y: ROOF, h: LOBBY_TOP + 0.3 - ROOF, mat: st, skinA: wp, skinB: wp });
  b.wall(8, -40, 8, -36, { y: ROOF, h: LOBBY_TOP + 0.3 - ROOF, mat: st, skinA: wp, skinB: wp });

  // ------------------------------------------------ facade bands, parapets, pilasters
  for (const [x0, z0, x1, z1, out] of [[-24, -16, 24, -16, 1], [24, -40, -24, -40, 1], [-24, -40, -24, -16, 1], [24, -16, 24, -40, 1]]) {
    band(b, x0, z0, x1, z1, 0.3, 0.6, 0.08, 0xd9a77f, out);
    band(b, x0, z0, x1, z1, Y1 - 0.3, 0.32, 0.12, TRIM, out);
    band(b, x0, z0, x1, z1, ROOF, 0.32, 0.2, TRIM, out);
  }
  for (const [x0, z0, x1, z1] of [[-8, -16, 8, -16], [8, -40, -8, -40]]) band(b, x0, z0, x1, z1, LOBBY_TOP, 0.32, 0.22, TRIM, 1);
  // parapets on the wing roofs
  const par = (x0, z0, x1, z1) => b.wall(x0, z0, x1, z1, { y: ROOF + 0.3, h: 0.7, t: 0.25, mat: st, cast: true });
  par(-24.15, -16, -8, -16); par(8, -16, 24.15, -16); par(-24.15, -40, -8, -40); par(8, -40, 24.15, -40);
  par(-24, -40, -24, -16); par(24, -40, 24, -16);
  for (const [x0, z0, x1, z1] of [[-24.15, -16, -8, -16], [8, -16, 24.15, -16], [-24.15, -40, -8, -40], [8, -40, 24.15, -40], [-24, -40, -24, -16], [24, -40, 24, -16]]) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const ang = Math.atan2(z1 - z0, x1 - x0);
    b.box((x0 + x1) / 2, ROOF + 1.0, (z0 + z1) / 2, len + 0.2, 0.12, 0.4, toon(TRIM), { rot: -ang, collide: false });
  }
  for (const [x, z] of [[-24, -16], [24, -16], [-24, -40], [24, -40], [-8, -16], [8, -16]]) {
    const h = Math.abs(x) === 8 ? LOBBY_TOP + 0.3 : ROOF + 0.3;
    b.box(x, 0, z, 0.7, h, 0.7, toon(TRIM), { collide: false });
  }

  // lobby hip roof (terracotta)
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0, 1, 1, 4, 1), paintedMat('roof', 0xffffff));
  roof.geometry.rotateY(Math.PI / 4);
  const rp = roof.geometry.attributes.position;
  const uv = new Float32Array(rp.count * 2);
  for (let i = 0; i < rp.count; i++) { uv[i * 2] = rp.getX(i) * 4; uv[i * 2 + 1] = rp.getZ(i) * 6 + rp.getY(i) * 3; }
  roof.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  roof.geometry.computeVertexNormals();
  roof.scale.set(17.6 / Math.SQRT2 * 1.0, 3.2, 25.6 / Math.SQRT2);
  roof.position.set(0, LOBBY_TOP + 0.3 + 1.6, -28);
  roof.castShadow = true;
  b.root.add(roof);
  // flat-roof dressing: chimneys, AC box, potted palms
  b.box(-18, ROOF + 0.3, -34, 1.2, 1.6, 1.2, paintedMat('stucco', PINK));
  b.box(18, ROOF + 0.3, -33, 1.2, 1.6, 1.2, paintedMat('stucco', PINK));
  b.box(-14, ROOF + 0.3, -26, 2.2, 1.1, 1.4, paintedMat('metal'));

  // ------------------------------------------------ the big sign with its five star slots
  const signTex = textTexture(['HÔTEL LES MIRAGES'], { w: 1024, h: 160, bg: null, border: null, fg: '#fff6ea', font: '400 118px Bebas' });
  const signBack = new THREE.Mesh(new THREE.BoxGeometry(13, 1.5, 0.2), toon(0x1b2440));
  signBack.position.set(0, LOBBY_TOP - 1.6, -15.72);
  b.root.add(signBack);
  b.plane(0, LOBBY_TOP - 1.6, -15.6, 12.4, 1.94, signTex, { transparent: true, emissive: 0.5 });
  H.signStars = [];
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * 1.3;
    const slot = star(0.38, 0.06, 0x3b3550);
    slot.material = toon(0x3b3550);
    slot.position.set(x, LOBBY_TOP + 0.75, -15.7);
    b.root.add(slot);
    const s = star(0.4, 0.12);
    s.position.set(x, LOBBY_TOP + 0.75, -15.6);
    s.visible = false;
    s.userData.dynamic = true;
    b.root.add(s);
    H.signStars.push(s);
  }
  const plate = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.25, 0.15), toon(TRIM));
  plate.position.set(0, LOBBY_TOP + 0.72, -15.8);
  b.root.add(plate);
  game.updaters.push((dt, t) => { H.signStars.forEach((s, i) => { if (s.visible) s.rotation.y = Math.sin(t * 1.5 + i) * 0.35; }); });

  // entrance canopy (marquise) with columns and lanterns
  const can = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.25, 3.4), toon(TRIM));
  can.position.set(0, 3.9, -14.3);
  can.castShadow = true;
  b.root.add(can);
  const awn = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.5, 3.6), paintedMat('awning_teal'));
  awn.position.set(0, 4.25, -14.3);
  b.root.add(awn);
  const ctex = textTexture(['Les Mirages'], { w: 512, h: 96, bg: null, border: null, fg: '#ffc23d', font: '400 64px Pacifico' });
  b.plane(0, 3.85, -12.58, 3.6, 0.68, ctex, { transparent: true });
  for (const x of [-2.4, 2.4]) b.column(x, -12.8, 0.18, 3.8, TRIM);
  for (const x of [-2.4, 2.4]) {
    const lan = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), toon(0xfff1b0, { emissive: 0xffd36e, emissiveIntensity: 0.9 }));
    lan.position.set(x, 3.4, -12.55);
    b.root.add(lan);
  }
  b.lamp(0, 3.2, -13.5, { intensity: 5, range: 9, on: () => game.tod === 'dusk' });
  // red carpet
  b.box(0, 0.05, -11.5, 2.4, 0.03, 9, paintedMat('carpet'), { collide: false, cast: false });

  return H;
}

// first floor balcony with balustrade
export function balcony(b, x0, x1, z0, depth, y) {
  b.box((x0 + x1) / 2, y - 0.3, z0 + depth / 2, x1 - x0, 0.3, depth, paintedMat('terracotta'), { cast: true });
  b.surface(x0, z0, x1, z0 + depth, 'concrete', y - 1, y + 3);
  const m = toon(TRIM);
  const rail = (ax, az, bx, bz) => {
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.round(len / 0.32);
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.9, 8), m);
      p.position.set(ax + (bx - ax) * k, y + 0.45, az + (bz - az) * k);
      b.root.add(p);
    }
    const ang = Math.atan2(bz - az, bx - ax);
    b.box((ax + bx) / 2, y + 0.9, (az + bz) / 2, len + 0.12, 0.1, 0.18, m, { rot: -ang });
    b.phys.addBox((ax + bx) / 2, y + 0.6, (az + bz) / 2, len, 1.2, 0.2, -ang);
  };
  rail(x0, z0 + depth - 0.1, x1, z0 + depth - 0.1);
  rail(x0 + 0.1, z0, x0 + 0.1, z0 + depth);
  rail(x1 - 0.1, z0, x1 - 0.1, z0 + depth);
}
