// Cartoon look: toon materials with a stepped gradient, and hand-painted procedural textures.
import * as THREE from 'three';

let gradient = null;
export function gradientMap() {
  if (gradient) return gradient;
  const steps = [90, 150, 205, 238, 255];
  const data = new Uint8Array(steps.length * 4);
  steps.forEach((v, i) => { data.set([v, v, v, 255], i * 4); });
  gradient = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  return gradient;
}

// Adds a soft warm rim light so silhouettes pop like in a cartoon.
function addRim(mat, strength = 0.35) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.rimStrength = { value: strength };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float rimStrength;')
      .replace('#include <opaque_fragment>', `
        float rim = smoothstep(0.55, 1.0, 1.0 - abs(dot(normalize(-vViewPosition), normal)));
        outgoingLight += vec3(1.0, 0.92, 0.78) * rim * rimStrength * 0.6;
        #include <opaque_fragment>`);
  };
  mat.customProgramCacheKey = () => 'rim' + strength;
}

const cache = new Map();
export function toon(color = 0xffffff, opts = {}) {
  const key = JSON.stringify([color, opts.map ? opts.map.uuid : 0, opts.transparent, opts.opacity, opts.emissive, opts.side, opts.rim]);
  if (cache.has(key) && !opts.unique) return cache.get(key);
  const m = new THREE.MeshToonMaterial({
    color, map: opts.map || null, gradientMap: gradientMap(), transparent: !!opts.transparent, opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide, emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 1,
  });
  if (opts.rim !== false) addRim(m, opts.rim ?? 0.3);
  if (!opts.unique) cache.set(key, m);
  return m;
}

// Convert loaded (standard) materials of a model to toon materials.
const convCache = new Map();
export function toonify(obj, opts = {}) {
  obj.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = opts.cast !== false;
    o.receiveShadow = true;
    const conv = (m) => {
      const k = m.uuid + (opts.tint || '');
      if (convCache.has(k) && !opts.unique) return convCache.get(k);
      const t = new THREE.MeshToonMaterial({
        color: m.color ? m.color.clone() : new THREE.Color(1, 1, 1), map: m.map || null, gradientMap: gradientMap(),
        transparent: m.transparent, opacity: m.opacity, side: m.side, emissive: m.emissive ? m.emissive.clone() : new THREE.Color(0),
      });
      if (t.map) t.map.colorSpace = THREE.SRGBColorSpace;
      if (opts.tint) t.color.multiply(new THREE.Color(opts.tint));
      addRim(t, 0.28);
      if (o.isSkinnedMesh) t.skinning = true;
      if (!opts.unique) convCache.set(k, t);
      return t;
    };
    o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
  });
  return obj;
}

// ------------------------------------------------------------------ painted textures
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function hex(c) { return typeof c === 'string' ? c : '#' + c.toString(16).padStart(6, '0'); }

function shade(color, amt) {
  const c = new THREE.Color(hex(color));
  const hsl = {};
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + amt)));
  return '#' + c.getHexString();
}

// soft painterly blotches + brush strokes over a base color
function paint(ctx, w, h, base, { blotch = 0.06, strokes = 120, strokeLen = 40, seed = 1, alpha = 0.08 } = {}) {
  const r = rng(seed);
  ctx.fillStyle = hex(base);
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) {
    const x = r() * w, y = r() * h, rad = (0.15 + r() * 0.35) * w;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const c = shade(base, (r() - 0.5) * blotch * 2);
    g.addColorStop(0, c + 'aa');
    g.addColorStop(1, c + '00');
    ctx.fillStyle = g;
    for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { ctx.save(); ctx.translate(ox, oy); ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2); ctx.restore(); }
  }
  ctx.lineCap = 'round';
  for (let i = 0; i < strokes; i++) {
    const x = r() * w, y = r() * h, a = r() * Math.PI, l = strokeLen * (0.5 + r());
    ctx.strokeStyle = (r() < 0.5 ? shade(base, 0.08) : shade(base, -0.08)) + Math.round(alpha * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = 2 + r() * 5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (r() - 0.5) * 10, y + Math.sin(a) * l * 0.5 + (r() - 0.5) * 10, x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
}

function tex(c, repeat = 1) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.repeat.set(repeat, repeat);
  return t;
}

const texCache = {};
export const TILE = {}; // world size (m) covered by one texture tile

export function painted(name) {
  if (texCache[name]) return texCache[name];
  const S = 512;
  const [c, x] = canvas(S, S);
  let tile = 2;
  switch (name) {
    case 'marble': { // checker marble for the lobby
      tile = 2.4;
      const half = S / 2;
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        const [cc, cx] = canvas(half, half);
        paint(cx, half, half, (i + j) % 2 ? '#2f3b4f' : '#f3ead8', { seed: i * 7 + j * 3 + 2, strokes: 40, blotch: 0.08 });
        cx.strokeStyle = (i + j) % 2 ? '#56647c66' : '#c9b99a66';
        cx.lineWidth = 2;
        const r = rng(i * 11 + j + 5);
        for (let k = 0; k < 4; k++) {
          cx.beginPath();
          let px = r() * half, py = 0;
          cx.moveTo(px, py);
          while (py < half) { px += (r() - 0.5) * 50; py += 20 + r() * 30; cx.lineTo(px, py); }
          cx.stroke();
        }
        x.drawImage(cc, i * half, j * half);
      }
      x.strokeStyle = '#c8a55a';
      x.lineWidth = 6;
      x.strokeRect(0, 0, S, S);
      x.beginPath(); x.moveTo(half, 0); x.lineTo(half, S); x.moveTo(0, half); x.lineTo(S, half); x.stroke();
      break;
    }
    case 'parquet': {
      tile = 2;
      paint(x, S, S, '#b97a45', { seed: 3, strokes: 60 });
      const n = 8;
      for (let i = 0; i < n; i++) for (let j = 0; j < 4; j++) {
        const r = rng(i * 13 + j);
        const w = S / n, hh = S / 4;
        const off = (i % 2) * hh / 2;
        x.fillStyle = shade('#b97a45', (r() - 0.5) * 0.12);
        x.fillRect(i * w + 1, ((j * hh + off) % S) + 1, w - 2, hh - 2);
        x.strokeStyle = '#6b3f1f55';
        x.lineWidth = 1.5;
        for (let k = 0; k < 5; k++) {
          x.beginPath();
          const yy = (j * hh + off + r() * hh) % S;
          x.moveTo(i * w + 4, yy); x.bezierCurveTo(i * w + w * 0.3, yy + 6, i * w + w * 0.7, yy - 6, i * w + w - 4, yy + 2); x.stroke();
        }
      }
      x.strokeStyle = '#5a3216aa'; x.lineWidth = 3;
      for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * S / n, 0); x.lineTo(i * S / n, S); x.stroke(); }
      break;
    }
    case 'wood': {
      tile = 1.5;
      paint(x, S, S, '#9c6339', { seed: 9, strokes: 200, strokeLen: 90, alpha: 0.12 });
      x.strokeStyle = '#5b3418aa'; x.lineWidth = 3;
      for (let i = 0; i <= 6; i++) { x.beginPath(); x.moveTo(0, i * S / 6); x.lineTo(S, i * S / 6); x.stroke(); }
      break;
    }
    case 'wallpaper': { // cream with soft vertical stripes and little fleur motifs
      tile = 2.2;
      paint(x, S, S, '#f6e6c8', { seed: 4, strokes: 50, blotch: 0.04 });
      for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#efd9b366' : '#f9ecd400'; x.fillRect(i * S / 8, 0, S / 8, S); }
      x.fillStyle = '#d9a86a';
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const cx0 = i * S / 4 + S / 8, cy0 = j * S / 4 + (i % 2 ? S / 8 : 0) + S / 16;
        x.beginPath();
        for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; x.ellipse(cx0 + Math.cos(a) * 9, cy0 + Math.sin(a) * 9, 7, 4, a, 0, Math.PI * 2); }
        x.fill();
      }
      break;
    }
    case 'wallpaper_pink': {
      tile = 2.2;
      paint(x, S, S, '#f7c9c9', { seed: 14, strokes: 50, blotch: 0.04 });
      x.strokeStyle = '#ffffff88'; x.lineWidth = 10;
      for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(i * S / 8 + S / 16, 0); x.lineTo(i * S / 8 + S / 16, S); x.stroke(); }
      x.fillStyle = '#ff8fb1aa';
      const r = rng(5);
      for (let k = 0; k < 18; k++) { x.beginPath(); x.ellipse(r() * S, r() * S, 10, 16, r(), 0, Math.PI * 2); x.fill(); }
      break;
    }
    case 'stucco': {
      tile = 3;
      paint(x, S, S, '#f4e9d6', { seed: 7, strokes: 260, strokeLen: 30, alpha: 0.07, blotch: 0.05 });
      break;
    }
    case 'stucco_ochre': {
      tile = 3;
      paint(x, S, S, '#f0c98f', { seed: 17, strokes: 260, strokeLen: 30, alpha: 0.07, blotch: 0.06 });
      break;
    }
    case 'terracotta': {
      tile = 1.6;
      paint(x, S, S, '#d77a4a', { seed: 5, strokes: 40 });
      const n = 4;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const r = rng(i * 31 + j * 7);
        x.fillStyle = shade('#d77a4a', (r() - 0.5) * 0.12);
        x.fillRect(i * S / n + 4, j * S / n + 4, S / n - 8, S / n - 8);
      }
      x.strokeStyle = '#efe0c8'; x.lineWidth = 8;
      for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * S / n, 0); x.lineTo(i * S / n, S); x.moveTo(0, i * S / n); x.lineTo(S, i * S / n); x.stroke(); }
      break;
    }
    case 'paving': { // warm stone paving for exterior paths
      tile = 3;
      paint(x, S, S, '#e2cfaa', { seed: 8, strokes: 80 });
      const r = rng(21);
      x.strokeStyle = '#a78c6488'; x.lineWidth = 4;
      for (let row = 0; row < 6; row++) {
        let px = (row % 2) * 40;
        const y0 = row * S / 6;
        while (px < S) { const w = 60 + r() * 60; x.fillStyle = shade('#e2cfaa', (r() - 0.5) * 0.1); x.fillRect(px + 2, y0 + 2, w - 4, S / 6 - 4); x.strokeRect(px, y0, w, S / 6); px += w; }
      }
      break;
    }
    case 'grass': {
      tile = 4;
      paint(x, S, S, '#7fbf4d', { seed: 2, strokes: 0, blotch: 0.09 });
      const r = rng(3);
      for (let i = 0; i < 1600; i++) {
        const px = r() * S, py = r() * S;
        x.strokeStyle = (r() < 0.5 ? '#9bd65e' : '#5f9e3a') + 'aa';
        x.lineWidth = 2;
        x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 6, py - 6 - r() * 8); x.stroke();
      }
      break;
    }
    case 'sand': {
      tile = 4;
      paint(x, S, S, '#f2d9a2', { seed: 6, strokes: 100, strokeLen: 20, alpha: 0.1 });
      const r = rng(9);
      for (let i = 0; i < 600; i++) { x.fillStyle = r() < 0.5 ? '#e0c182' : '#fff0c8'; x.fillRect(r() * S, r() * S, 2, 2); }
      break;
    }
    case 'pooltile': {
      tile = 1.2;
      paint(x, S, S, '#3fb7c9', { seed: 12, strokes: 0 });
      const n = 8;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const r = rng(i * 17 + j * 3);
        x.fillStyle = shade('#3fb7c9', (r() - 0.5) * 0.15);
        x.fillRect(i * S / n + 3, j * S / n + 3, S / n - 6, S / n - 6);
      }
      break;
    }
    case 'spatile': {
      tile = 1.2;
      paint(x, S, S, '#eef6f2', { seed: 13, strokes: 0 });
      const n = 6;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const r = rng(i * 7 + j * 19);
        x.fillStyle = r() < 0.15 ? '#9ed9cf' : shade('#eef6f2', (r() - 0.5) * 0.06);
        x.fillRect(i * S / n + 3, j * S / n + 3, S / n - 6, S / n - 6);
      }
      break;
    }
    case 'carpet': { // red corridor carpet with gold border
      tile = 2;
      paint(x, S, S, '#a8323a', { seed: 10, strokes: 300, strokeLen: 10, alpha: 0.06 });
      x.strokeStyle = '#e6b84d'; x.lineWidth = 14;
      x.strokeRect(30, -20, S - 60, S + 40);
      x.fillStyle = '#e6b84d55';
      for (let j = 0; j < 4; j++) { x.beginPath(); x.moveTo(S / 2, j * S / 4 + 20); x.lineTo(S / 2 + 40, j * S / 4 + S / 8); x.lineTo(S / 2, j * S / 4 + S / 4 - 20); x.lineTo(S / 2 - 40, j * S / 4 + S / 8); x.fill(); }
      break;
    }
    case 'roof': {
      tile = 2;
      paint(x, S, S, '#c4572d', { seed: 11, strokes: 40 });
      for (let j = 0; j < 8; j++) for (let i = 0; i < 6; i++) {
        const cx0 = i * S / 6 + (j % 2) * S / 12, cy0 = j * S / 8;
        x.fillStyle = shade('#c4572d', ((i * 7 + j * 3) % 5 - 2) * 0.02);
        x.beginPath(); x.ellipse(cx0 + S / 12, cy0 + S / 16, S / 13, S / 16, 0, 0, Math.PI); x.fill();
        x.strokeStyle = '#7a2e14aa'; x.lineWidth = 3; x.stroke();
      }
      break;
    }
    case 'awning': {
      tile = 1.6;
      for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#fff4e2' : '#ff7458'; x.fillRect(i * S / 8, 0, S / 8, S); }
      break;
    }
    case 'awning_teal': {
      tile = 1.6;
      for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#fff4e2' : '#24a7a0'; x.fillRect(i * S / 8, 0, S / 8, S); }
      break;
    }
    case 'hedge': {
      tile = 1.5;
      paint(x, S, S, '#3f7f3a', { seed: 15, strokes: 0, blotch: 0.12 });
      const r = rng(16);
      for (let i = 0; i < 500; i++) {
        x.fillStyle = (r() < 0.5 ? '#5aa04a' : '#2c5f2b') + 'cc';
        x.beginPath(); x.ellipse(r() * S, r() * S, 6 + r() * 8, 4 + r() * 5, r() * 3, 0, Math.PI * 2); x.fill();
      }
      break;
    }
    case 'panel': { // dark wood wainscot panel for the office
      tile = 1.6;
      paint(x, S, S, '#6b3a24', { seed: 18, strokes: 120, strokeLen: 70, alpha: 0.1 });
      x.strokeStyle = '#3b1d10'; x.lineWidth = 8;
      x.strokeRect(40, 40, S - 80, S - 80);
      x.strokeStyle = '#a7683f88'; x.lineWidth = 3;
      x.strokeRect(54, 54, S - 108, S - 108);
      break;
    }
    case 'kitchen': { // black & white small tiles
      tile = 1.2;
      const n = 8;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { x.fillStyle = (i + j) % 2 ? '#2d2a33' : '#f1ece2'; x.fillRect(i * S / n, j * S / n, S / n, S / n); }
      break;
    }
    case 'metal': {
      tile = 1;
      paint(x, S, S, '#c9d2d8', { seed: 19, strokes: 200, strokeLen: 120, alpha: 0.07 });
      break;
    }
    default:
      paint(x, S, S, '#ffffff', { seed: 1 });
  }
  const t = tex(c);
  TILE[name] = tile;
  texCache[name] = t;
  return t;
}

const pmCache = {};
export function paintedMat(name, color = 0xffffff, opts = {}) {
  const k = name + color + JSON.stringify(opts);
  if (pmCache[k]) return pmCache[k];
  const m = toon(color, { map: painted(name), unique: true, rim: opts.rim ?? 0.15, ...opts });
  m.userData.tile = TILE[name];
  pmCache[k] = m;
  return m;
}

// Text/symbol textures (signs, dials, notes in the world)
export function textTexture(lines, { w = 512, h = 256, bg = '#fff6e3', fg = '#2a2233', font = '600 54px Poppins', align = 'center', border = '#2a2233', pad = 18, lineH = 1.25 } = {}) {
  const [c, x] = canvas(w, h);
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  if (border) { x.strokeStyle = border; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, h - 10); }
  x.fillStyle = fg;
  x.font = font;
  x.textAlign = align;
  x.textBaseline = 'middle';
  const arr = Array.isArray(lines) ? lines : [lines];
  const size = parseInt(font.match(/(\d+)px/)[1], 10);
  const total = arr.length * size * lineH;
  arr.forEach((ln, i) => {
    const y = h / 2 - total / 2 + size * lineH * (i + 0.5);
    x.fillText(ln, align === 'center' ? w / 2 : pad, y);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function canvasTexture(w, h, draw) {
  const [c, x] = canvas(w, h);
  draw(x, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
