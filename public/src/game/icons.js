// Renders inventory icons, dialogue portraits, wardrobe thumbnails and journal stamps from the real 3D models.
import * as THREE from 'three';
import { getAnimated, get, has, KIT } from '../engine/assets.js';
import { SKINS } from './state.js';
import { ITEMS } from './items.js';
import { makeParrot, makePelican } from './npc.js';

const INK = '#2a2233';

function sticker(src, size, { ink = INK, w = 4, bg = null, circle = false } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  if (bg) {
    x.fillStyle = bg;
    if (circle) { x.beginPath(); x.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); x.fill(); } else x.fillRect(0, 0, size, size);
  }
  const s = document.createElement('canvas');
  s.width = s.height = size;
  const sx = s.getContext('2d');
  sx.drawImage(src, 0, 0, size, size);
  sx.globalCompositeOperation = 'source-in';
  sx.fillStyle = ink;
  sx.fillRect(0, 0, size, size);
  for (let a = 0; a < 16; a++) x.drawImage(s, Math.cos((a / 16) * Math.PI * 2) * w, Math.sin((a / 16) * Math.PI * 2) * w);
  x.drawImage(src, 0, 0, size, size);
  return c;
}

export function makeIcons(game) {
  const size = 192;
  const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1);
  r.setSize(size, size);
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xa898b0, 1.7));
  const d = new THREE.DirectionalLight(0xfff4e6, 2.4);
  d.position.set(1.5, 2.6, 2.4);
  scene.add(d);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
  const box = new THREE.Box3();
  const sph = new THREE.Sphere();

  const shoot = (obj, { dir = [0.55, 0.5, 1], fill = 0.86, target = null, radius = null } = {}) => {
    const holder = new THREE.Group();
    holder.add(obj);
    scene.add(holder);
    holder.updateMatrixWorld(true);
    box.setFromObject(obj, true);
    box.getBoundingSphere(sph);
    const c = target ? new THREE.Vector3(...target) : sph.center;
    const rad = radius ?? sph.radius;
    const dist = rad / Math.sin(THREE.MathUtils.degToRad(cam.fov / 2)) / fill;
    cam.position.copy(c).addScaledVector(new THREE.Vector3(...dir).normalize(), dist);
    cam.near = dist / 50;
    cam.far = dist * 4;
    cam.updateProjectionMatrix();
    cam.lookAt(c);
    r.render(scene, cam);
    scene.remove(holder);
    return r.domElement;
  };

  const out = { items: {}, portraits: {}, skins: {}, stamps: {} };
  for (const [id, it] of Object.entries(ITEMS)) {
    const o = it.make();
    out.items[id] = sticker(shoot(o), 128, { w: 3 }).toDataURL();
  }

  const posed = (skin) => {
    const { scene: s, animations } = getAnimated('mini-characters/' + skin);
    s.scale.setScalar(KIT);
    const mixer = new THREE.AnimationMixer(s);
    const idle = animations.find((a) => a.name === 'idle');
    if (idle) { mixer.clipAction(idle).play(); mixer.update(0.4); }
    s.updateMatrixWorld(true);
    return s;
  };

  const portrait = (obj, bg, opts) => sticker(shoot(obj, opts), 160, { bg, circle: true, w: 3 }).toDataURL();
  const PBG = { directrice: '#c9b6ff', marcel: '#a6e3ff', homard: '#ffb3a6' };
  const charOf = { directrice: 'character-female-d', marcel: 'character-male-c' };
  const head = (skin) => ({ dir: [0.25, 0.12, 1], target: [0, 1.05, 0], radius: 0.36, fill: 0.95 });
  for (const [who, skin] of Object.entries(charOf)) out.portraits[who] = portrait(posed(skin), PBG[who], head(skin));
  for (const sk of SKINS) {
    out.portraits['skin:' + sk] = portrait(posed(sk), '#ffe08a', head(sk));
    out.skins[sk] = sticker(shoot(posed(sk), { dir: [0.4, 0.25, 1], fill: 0.9 }), 128, { w: 3 }).toDataURL();
  }
  const parrot = makeParrot().root;
  out.portraits.gustave = portrait(parrot, '#b8f0ea', { dir: [0.3, 0.1, 1], target: [0, 0.3, 0.05], radius: 0.14, fill: 0.9 });
  const pel = makePelican().root;
  out.portraits.pelican = portrait(pel, '#ffe1b3', { dir: [0.9, 0.1, 1], target: [0, 0.9, 0.3], radius: 0.32, fill: 0.95 });
  out.portraits.speaker = speakerIcon();
  out.portraits.dupont = out.portraits['skin:character-male-e'];
  if (game.story && game.story.homardModel) out.portraits.homard = portrait(game.story.homardModel(), PBG.homard, { dir: [0.2, 0.3, 1], fill: 0.9 });

  // journal stamps
  for (const a of (game.story ? game.story.areas : [])) {
    let o;
    if (typeof a.stamp === 'function') o = a.stamp();
    else if (a.stamp && has(a.stamp)) { o = get(a.stamp); o.scale.setScalar(KIT); } else o = new THREE.Group();
    out.stamps[a.id] = stamp(shoot(o, { dir: [0.6, 0.55, 1], fill: 0.8 }), a.color, a.name);
  }
  out.stampBlank = stamp(null, '#efe3c8', '');
  r.dispose();
  r.forceContextLoss();
  return out;
}

function stamp(img, color, title) {
  const W = 200;
  const H = 200;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#fff';
  x.fillRect(6, 6, W - 12, H - 12);
  // perforations
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i <= 10; i++) {
    for (const [px, py] of [[6 + i * (W - 12) / 10, 6], [6 + i * (W - 12) / 10, H - 6], [6, 6 + i * (H - 12) / 10], [W - 6, 6 + i * (H - 12) / 10]]) {
      x.beginPath(); x.arc(px, py, 6, 0, Math.PI * 2); x.fill();
    }
  }
  x.globalCompositeOperation = 'source-over';
  x.fillStyle = color;
  x.fillRect(18, 18, W - 36, H - 36);
  x.strokeStyle = INK;
  x.lineWidth = 4;
  x.strokeRect(18, 18, W - 36, H - 36);
  if (img) x.drawImage(sticker(img, 150, { w: 3 }), 25, 14, 150, 150);
  if (title) {
    x.font = '800 17px Poppins';
    x.textAlign = 'center';
    x.fillStyle = INK;
    x.fillText(title.length > 20 ? title.slice(0, 19) + '…' : title, W / 2, H - 28);
  }
  return c.toDataURL();
}

function speakerIcon() {
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const x = c.getContext('2d');
  x.fillStyle = '#ffd36e'; x.beginPath(); x.arc(80, 80, 80, 0, Math.PI * 2); x.fill();
  x.fillStyle = INK;
  x.beginPath(); x.moveTo(40, 64); x.lineTo(62, 64); x.lineTo(92, 38); x.lineTo(92, 122); x.lineTo(62, 96); x.lineTo(40, 96); x.closePath(); x.fill();
  x.strokeStyle = INK; x.lineWidth = 8; x.lineCap = 'round';
  for (const rr of [22, 40]) { x.beginPath(); x.arc(96, 80, rr, -0.7, 0.7); x.stroke(); }
  return c.toDataURL();
}
