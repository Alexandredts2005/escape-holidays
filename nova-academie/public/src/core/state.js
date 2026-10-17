// Global state, settings and save management.
export const W = 1920;
export const H = 1080;

export const FONT = 'Poppins, sans-serif';
export const TITLE_FONT = 'Montserrat, Poppins, sans-serif';
export const COLORS = {
  pink: 0xff5cb4, violet: 0x8b5cff, gold: 0xffc93c, cyan: 0x31d2ff, dark: 0x0b0614, white: 0xffffff,
  good: 0x3ddc84, bad: 0xff4d5a,
};

const SETTINGS_KEY = 'nova_settings_v1';
const SAVE_KEY = 'nova_save_v1';

const DEFAULT_SETTINGS = {
  music: 0.7, sfx: 0.8, voice: 0.9, latency: 0, difficulty: 'normal', textSpeed: 40, scroll: 1.0, autoSave: true,
};

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeJSON(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    return true;
  } catch (e) {
    return false;
  }
}

export const G = {
  settings: { ...DEFAULT_SETTINGS, ...(readJSON(SETTINGS_KEY) || {}) },
  season: null,
  cast: null,
  sprites: null,
  quiz: null,
  songs: null,
  theatre: null,
  game: null,
};

export function saveSettings() {
  writeJSON(SETTINGS_KEY, G.settings);
}

export function hasSave() {
  const s = readJSON(SAVE_KEY);
  return !!(s && s.player);
}

export function loadSave() {
  return readJSON(SAVE_KEY);
}

export function writeSave() {
  if (!G.season) return false;
  G.season.savedAt = Date.now();
  return writeJSON(SAVE_KEY, G.season);
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
}

// French gender agreement helper: "{prêt|prête}" -> depends on player gender
export function fmt(text) {
  const p = G.season && G.season.player;
  const name = p ? p.name : 'toi';
  const g = p ? p.gender : 'x';
  return text
    .replace(/\{name\}/g, name)
    .replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_, m, f) => {
      if (g === 'm') return m;
      if (g === 'f') return f;
      if (f.startsWith(m)) return m + '·' + f.slice(m.length);
      return m + '/' + f;
    });
}

export function rand(a, b) {
  return a + Math.random() * (b - a);
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function charName(id) {
  if (id === 'player' || id === 'moi') return G.season ? G.season.player.name : 'Moi';
  const c = G.cast && G.cast.chars[id];
  return c ? c.name : id;
}

export function charColor(id) {
  if (id === 'player' || id === 'moi') return '#ff8ce6';
  const c = G.cast && G.cast.chars[id];
  return c ? c.color : '#ffffff';
}
