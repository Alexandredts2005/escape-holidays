// Persistent game state (flags, inventory, collectibles, progress) with localStorage saves.
const KEY = 'eh_save_v1';

export const SKINS = [
  'character-female-b', 'character-male-b', 'character-female-a', 'character-male-a', 'character-female-c', 'character-male-c',
  'character-female-d', 'character-male-d', 'character-female-e', 'character-male-e', 'character-female-f', 'character-male-f',
];

export function freshState() {
  return {
    v: 1,
    flags: {},
    inv: {},
    order: [],
    ducks: [],
    biscuits: 0,
    biscuitsFound: [],
    hints: 0,
    areaHints: {},
    areaStart: {},
    areaDone: {},
    stamps: [],
    skin: SKINS[0],
    pos: null,
    time: 0,
    deaths: 0,
    started: Date.now(),
    clues: [],
  };
}

export class State {
  constructor() {
    this.s = freshState();
  }

  reset() { this.s = freshState(); }

  flag(k) { return !!this.s.flags[k]; }

  set(k, v = true) { this.s.flags[k] = v; }

  has(id, n = 1) { return (this.s.inv[id] || 0) >= n; }

  count(id) { return this.s.inv[id] || 0; }

  give(id, n = 1) {
    this.s.inv[id] = (this.s.inv[id] || 0) + n;
    if (!this.s.order.includes(id)) this.s.order.push(id);
  }

  take(id, n = 1) {
    this.s.inv[id] = Math.max(0, (this.s.inv[id] || 0) - n);
    if (!this.s.inv[id]) { delete this.s.inv[id]; this.s.order = this.s.order.filter((x) => x !== id); }
  }

  clue(text) {
    if (!this.s.clues.includes(text)) this.s.clues.push(text);
  }

  unlockedSkins() {
    return Math.min(SKINS.length, 2 + Math.floor(this.s.ducks.length / 2) * 2 + (this.flag('escaped') ? 12 : 0));
  }

  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.s)); return true; } catch (e) { return false; }
  }

  static hasSave() {
    try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); return !!(s && s.flags && s.flags.intro_done); } catch (e) { return false; }
  }

  load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s) { this.s = { ...freshState(), ...s }; return true; }
    } catch (e) { /* ignore */ }
    return false;
  }

  static clear() {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  }
}
