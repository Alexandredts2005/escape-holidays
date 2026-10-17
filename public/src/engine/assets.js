// GLB loading with caching, toon conversion and size normalisation.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { toonify } from './toon.js';

const loader = new GLTFLoader();
const gltfs = new Map();
let catalog = {};

export const KIT = 1.9; // Kenney kits → metres

export async function loadCatalog() {
  catalog = await (await fetch('assets/models/catalog.json')).json();
}

export function info(name) {
  return catalog[name];
}

export function preload(names, onProgress) {
  let done = 0;
  return Promise.all(names.map((n) => load(n).then(() => { done++; if (onProgress) onProgress(done / names.length); })));
}

export function load(name) {
  if (gltfs.has(name)) return gltfs.get(name);
  const p = new Promise((res, rej) => {
    loader.load(`assets/models/${name}.glb`, (g) => {
      toonify(g.scene);
      res(g);
    }, undefined, (e) => { console.warn('model load failed', name, e); rej(e); });
  });
  gltfs.set(name, p);
  return p;
}

export async function model(name) {
  const g = await load(name);
  return g.scene.clone(true);
}

// Synchronous clone of an already-loaded model
const ready = new Map();
export function warm(names) {
  return Promise.all(names.map(async (n) => { ready.set(n, await load(n)); }));
}

export function get(name) {
  const g = ready.get(name);
  if (!g) throw new Error('model not preloaded: ' + name);
  return g.scene.clone(true);
}

export function getAnimated(name) {
  const g = ready.get(name);
  if (!g) throw new Error('model not preloaded: ' + name);
  return { scene: SkeletonUtils.clone(g.scene), animations: g.animations };
}

export function has(name) {
  return ready.has(name);
}
