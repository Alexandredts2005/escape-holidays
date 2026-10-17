// Season rules: stats, NPC simulation, evaluations, nominations, votes, eliminations.
import { G, clamp, rand, shuffle } from './state.js';

// Narrative elimination order (one per prime). Week 8 = semi-final, week 9 = final.
export const LEAVERS = ['jade', 'noah', 'hugo', 'sacha', 'maelle', 'zack', 'kenza', 'lea'];
export const FINAL_RIVAL = 'ines';
export const WEEKS = 9;

export const WEEK_INFO = [
  null,
  { theme: 'Bienvenue au château', song: 'chateau_reves', mode: 'chant', eval2: 'quiz', guest: 'Lou Ardent' },
  { theme: 'Semaine danse', song: 'danse_avec_moi', mode: 'danse', eval2: 'danse', guest: 'Les Kinetic' },
  { theme: 'Semaine émotion', song: 'lumiere', mode: 'chant', eval2: 'theatre', guest: 'Camille Rives' },
  { theme: 'Semaine électro-pop', song: 'ville_nuit', mode: 'chant', eval2: 'quiz', guest: 'NÉON' },
  { theme: 'Semaine latino', song: 'soleil_octobre', mode: 'danse', eval2: 'danse', guest: 'Rafa Solé' },
  { theme: 'Semaine rock', song: 'ne_lache_rien', mode: 'chant', eval2: 'theatre', guest: 'Les Brûlants' },
  { theme: 'Semaine des duos', song: 'deux_voix', mode: 'chant', eval2: 'quiz', guest: 'Élise & Marco' },
  { theme: 'Demi-finale', song: 'mille_etoiles', mode: 'chant', eval2: 'danse', guest: 'Orchestre National', song2: 'feu_artifice' },
  { theme: 'La Grande Finale', song: 'derniere_scene', mode: 'chant', eval2: 'theatre', guest: 'Toute la promo' },
];

export const STATS = ['voix', 'danse', 'scene', 'culture', 'pop'];

export function newSeason(player) {
  const aff = {};
  for (const id of G.cast.students) aff[id] = 10;
  aff.ines = 0;
  return {
    v: 1,
    player: { ...player, stats: { voix: 40, danse: 35, scene: 35, culture: 40, pop: 50 }, energie: 100 },
    week: 0,
    phase: 'prologue',
    acts: 0,
    aff,
    flags: {},
    alive: G.cast.students.slice(),
    eliminated: [],
    evals: {},
    nominees: [],
    saved: null,
    publicNominees: [],
    playerNominated: false,
    repechage: false,
    primeScore: 0,
    history: [],
    startedAt: Date.now(),
    playMs: 0,
    ending: null,
    socialDone: {},
    npcBoost: {},
  };
}

export function S() {
  return G.season;
}

export function addStat(stat, v) {
  const s = S();
  if (stat === 'energie') s.player.energie = clamp(s.player.energie + v, 0, 100);
  else s.player.stats[stat] = clamp((s.player.stats[stat] || 0) + v, 0, 100);
}

// Effects string: "pop+2 voix-1 aff.lea+3 flag.x=1 energie+10"
export function applyFx(str) {
  const gains = [];
  if (!str) return gains;
  const s = S();
  for (const tok of str.split(/\s+/).filter(Boolean)) {
    let m = tok.match(/^aff\.(\w+)([+-]\d+)$/);
    if (m) {
      s.aff[m[1]] = clamp((s.aff[m[1]] || 0) + parseInt(m[2], 10), -50, 100);
      gains.push({ kind: 'aff', id: m[1], v: parseInt(m[2], 10) });
      continue;
    }
    m = tok.match(/^flag\.(\w+)=(\w+)$/);
    if (m) {
      s.flags[m[1]] = isNaN(m[2]) ? m[2] : Number(m[2]);
      continue;
    }
    m = tok.match(/^(\w+)([+-]\d+)$/);
    if (m) {
      addStat(m[1], parseInt(m[2], 10));
      gains.push({ kind: 'stat', id: m[1], v: parseInt(m[2], 10) });
    }
  }
  return gains;
}

export function evalCond(cond, vars = {}) {
  const s = S();
  const env = (path) => {
    const [a, b] = path.split('.');
    if (a === 'aff') return s.aff[b] || 0;
    if (a === 'flag') return s.flags[b] || 0;
    if (a === 'stat') return s.player.stats[b] || 0;
    if (a === 'alive') return s.alive.includes(vars[b] || b) ? 1 : 0;
    if (a === 'week') return s.week;
    if (a === 'nominated') return s.playerNominated ? 1 : 0;
    if (a === 'gender') return b === s.player.gender ? 1 : 0;
    if (a === 'var') return vars[b] || 0;
    if (a === 'energie') return s.player.energie;
    return 0;
  };
  const m = cond.match(/^(!)?([\w.]+)\s*(>=|<=|==|!=|>|<)?\s*(-?\d+)?$/);
  if (!m) return false;
  const val = env(m[2]);
  let res;
  if (!m[3]) res = !!val;
  else {
    const n = Number(m[4]);
    res = { '>=': val >= n, '<=': val <= n, '==': val == n, '!=': val != n, '>': val > n, '<': val < n }[m[3]];
  }
  return m[1] ? !res : res;
}

export function gradeOf(acc) {
  if (acc >= 0.95) return 'S';
  if (acc >= 0.88) return 'A';
  if (acc >= 0.76) return 'B';
  if (acc >= 0.6) return 'C';
  return 'D';
}

export const GRADE_GAIN = { S: 6, A: 5, B: 4, C: 2, D: 1 };

export function energyFactor() {
  const e = S().player.energie;
  return e < 25 ? 0.82 : e < 45 ? 0.92 : 1;
}

function npcSkill(id, kind) {
  const st = G.cast.chars[id].stats;
  const w = S().week;
  const base = kind === 'danse' ? st.danse : kind === 'theatre' ? st.scene : kind === 'quiz' ? st.culture : st.voix;
  return base + w * 2.4 + (S().npcBoost[id] || 0);
}

// Player eval composite (0-100) from minigame accuracies + stats
export function playerEvalScore(acc1, acc2) {
  const p = S().player.stats;
  const w = WEEK_INFO[S().week];
  const st2 = w.eval2 === 'danse' ? p.danse : w.eval2 === 'theatre' ? p.scene : p.culture;
  const perf = (acc1 * 0.6 + acc2 * 0.4) * 100;
  return clamp(perf * 0.72 + ((p.voix + st2) / 2) * 0.28, 0, 100);
}

export function simulateEvals(playerScore) {
  const s = S();
  const res = { player: Math.round(playerScore) };
  const leaver = LEAVERS[s.week - 1];
  for (const id of s.alive) {
    let sc = npcSkill(id, 'chant') * 0.6 + npcSkill(id, WEEK_INFO[s.week].eval2) * 0.4 + rand(-6, 6);
    if (id === leaver) sc -= 12;
    if (id === 'ines' || id === 'lea') sc += 4;
    res[id] = Math.round(clamp(sc, 20, 98));
  }
  s.evals = res;
  return res;
}

export function computeNominees() {
  const s = S();
  const leaver = LEAVERS[s.week - 1];
  if (s.week >= 8) {
    s.nominees = ['player', ...s.alive];
    s.playerNominated = true;
    return s.nominees;
  }
  const pool = ['player', ...s.alive.filter((id) => id !== leaver)];
  pool.sort((a, b) => s.evals[a] - s.evals[b]);
  const others = pool.slice(0, 2);
  s.nominees = shuffle([leaver, ...others]);
  s.playerNominated = s.nominees.includes('player');
  return s.nominees;
}

// Students vote to save one nominee. Returns {votes:{id:count}, ballots:[{from,to}], saved}
export function studentVote(playerChoice = null) {
  const s = S();
  const leaver = LEAVERS[s.week - 1];
  const voters = s.alive.filter((id) => !s.nominees.includes(id));
  const votes = {};
  s.nominees.forEach((n) => { votes[n] = 0; });
  const ballots = [];
  const candidates = s.nominees.filter((n) => n !== leaver);
  for (const v of voters) {
    let to;
    if (s.playerNominated) {
      const otherNpc = candidates.find((c) => c !== 'player');
      const p = clamp(0.3 + (s.aff[v] || 0) / 110, 0.05, 0.95);
      to = !otherNpc || Math.random() < p ? 'player' : otherNpc;
    } else {
      to = candidates[Math.floor(Math.random() * candidates.length)];
    }
    votes[to]++;
    ballots.push({ from: v, to });
  }
  if (playerChoice && !s.playerNominated) {
    votes[playerChoice] = (votes[playerChoice] || 0) + 1;
    ballots.push({ from: 'player', to: playerChoice });
  }
  // leaver can never be saved (narrative)
  const ranked = candidates.slice().sort((a, b) => votes[b] - votes[a] || (a === 'player' ? -1 : 1));
  const saved = ranked[0];
  s.saved = saved;
  s.publicNominees = s.nominees.filter((n) => n !== saved);
  return { votes, ballots, saved };
}

// Public vote result at the prime. perf = prime accuracy 0..1
export function publicVote(perf) {
  const s = S();
  const p = s.player.stats;
  const avg = (p.voix + p.danse + p.scene + p.culture) / 4;
  const playerScore = perf * 100 * 0.45 + p.pop * 0.35 + avg * 0.2;
  const noms = s.publicNominees;
  const res = {};
  if (s.week === 9) {
    const opp = 56 + rand(-3, 3);
    const pct = clamp(50 + (playerScore - opp) * 1.6, 18, 82);
    res.player = Math.round(pct);
    res[FINAL_RIVAL] = 100 - res.player;
    const winner = res.player > 50 ? 'player' : FINAL_RIVAL;
    return { res, out: winner === 'player' ? FINAL_RIVAL : 'player', winner, playerScore };
  }
  if (!noms.includes('player')) {
    const leaver = LEAVERS[s.week - 1];
    const other = noms.find((n) => n !== leaver);
    const a = Math.round(rand(54, 68));
    if (other) {
      res[other] = a;
      res[leaver] = 100 - a;
    } else res[leaver] = 100;
    return { res, out: leaver, playerScore };
  }
  const opp = 46 + s.week * 1.6 + rand(-4, 4);
  const others = noms.filter((n) => n !== 'player');
  let pp = clamp(100 / noms.length + (playerScore - opp) * 1.25, 8, 85);
  res.player = Math.round(pp);
  const rest = 100 - res.player;
  if (others.length === 1) res[others[0]] = rest;
  else {
    const leaver = LEAVERS[s.week - 1];
    const lv = Math.round(rest * rand(0.3, 0.42));
    others.forEach((o) => { res[o] = o === leaver ? lv : rest - lv; });
  }
  const lowest = Object.keys(res).sort((a, b) => res[a] - res[b])[0];
  return { res, out: lowest, playerScore };
}

export function eliminate(id) {
  const s = S();
  s.alive = s.alive.filter((x) => x !== id);
  if (!s.eliminated.includes(id)) s.eliminated.push(id);
}

export function difficultyFor(kind) {
  const d = G.settings.difficulty;
  const w = S() ? S().week : 0;
  if (d === 'easy') return 'easy';
  if (d === 'hard') return w >= 4 ? 'hard' : 'normal';
  return w >= 3 ? 'normal' : 'easy';
}
