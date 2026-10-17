// On-demand asset loading (backgrounds, character sprites, music) to keep memory low.
import { G } from './state.js';

let queue = Promise.resolve();
const bgUse = new Map(); // key -> last used timestamp
const MAX_BG = 8;

export const bgKey = (id) => 'bg_' + id;
export const charKey = (id, expr) => `${id}_${expr}`;

export function bgAsset(id) {
  return { type: 'image', key: bgKey(id), url: `assets/bg/${id}.jpg` };
}

export function charAsset(id, expr) {
  return { type: 'image', key: charKey(id, expr), url: `assets/chars/${id}_${expr}.webp` };
}

export function berryAsset(name) {
  return { type: 'image', key: 'berry_' + name, url: `assets/chars/berry/${name}.webp` };
}

export function portraitAsset(id) {
  return { type: 'image', key: 'portrait_' + id, url: `assets/chars/portrait_${id}.webp` };
}

export function musicAsset(id) {
  return { type: 'audio', key: 'mus_' + id, url: [`assets/music/${id}.ogg`, `assets/music/${id}.mp3`] };
}

export function voiceAsset(id) {
  return { type: 'audio', key: 'voc_' + id, url: [`assets/music/${id}_voice.ogg`, `assets/music/${id}_voice.mp3`] };
}

export function chartAsset(id) {
  return { type: 'json', key: 'chart_' + id, url: `assets/music/charts/${id}.json` };
}

// Resolve the best expression available for a character
export function bestExpr(id, expr) {
  const meta = G.sprites && G.sprites[id];
  if (!meta) return expr || 'neutre';
  const list = meta.exprs;
  if (list.includes(expr)) return expr;
  const fb = (G.cast.fallback[expr] || []).concat(['neutre', list[0]]);
  for (const e of fb) if (list.includes(e)) return e;
  return list[0];
}

export function playerLayers(look, expr) {
  const face = G.cast.berryFaces[expr] || G.cast.berryFaces.neutre;
  return [
    `body${look.body}_skin${look.skin}`,
    `body${look.body}_outfit${look.outfit}`,
    `face${face}`,
    look.hair,
  ];
}

function exists(scene, a) {
  if (a.type === 'image') return scene.textures.exists(a.key);
  if (a.type === 'audio') return scene.cache.audio.exists(a.key);
  if (a.type === 'json') return scene.cache.json.exists(a.key);
  return false;
}

function evictBackgrounds(scene, keep) {
  const bgs = [...bgUse.entries()].filter(([k]) => scene.textures.exists(k)).sort((a, b) => a[1] - b[1]);
  while (bgs.length > MAX_BG) {
    const [k] = bgs.shift();
    if (keep.has(k) || (G.bgInUse && G.bgInUse.has(k))) continue;
    scene.textures.remove(k);
    bgUse.delete(k);
  }
}

// Load a list of assets on the given (active) scene; resolves when everything is ready.
export function need(scene, assets) {
  const run = () => new Promise((resolve) => {
    const todo = assets.filter((a) => a && !exists(scene, a));
    const now = performance.now();
    const keep = new Set(assets.map((a) => a && a.key));
    assets.forEach((a) => { if (a && a.key && a.key.startsWith('bg_')) bgUse.set(a.key, now); });
    if (!todo.length) return resolve();
    const L = scene.load;
    for (const a of todo) {
      if (a.type === 'image') L.image(a.key, a.url);
      else if (a.type === 'audio') L.audio(a.key, a.url);
      else if (a.type === 'json') L.json(a.key, a.url);
    }
    const done = () => {
      L.off('complete', done);
      evictBackgrounds(scene, keep);
      resolve();
    };
    L.on('complete', done);
    L.start();
  });
  queue = queue.then(run, run);
  return queue;
}

export function actorAssets(id, exprs, look) {
  if (id === 'player' || (look && !G.cast.chars[id])) {
    const L = look || (G.season && G.season.player.look);
    const set = new Set();
    for (const e of exprs) playerLayers(L, e).forEach((n) => set.add(n));
    return [...set].map(berryAsset);
  }
  return exprs.map((e) => charAsset(id, bestExpr(id, e)));
}
