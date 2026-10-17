// Game flow: sequences scenes for the solo season.
import { G, writeSave, clearSave, clamp, pick, shuffle, charName } from './state.js';
import { STORY } from '../data/story.js';
import {
  newSeason, WEEKS, WEEK_INFO, LEAVERS, FINAL_RIVAL, applyFx, addStat, gradeOf, GRADE_GAIN, energyFactor,
  playerEvalScore, simulateEvals, computeNominees, studentVote, publicVote, eliminate, difficultyFor,
} from './season.js';

let currentKey = null;

export function runScene(key, data = {}) {
  const T = typeof window !== 'undefined' && window.NOVA_AUTOTEST;
  if (T && T.fake && T.fake[key]) {
    T.log && T.log.push(key);
    return Promise.resolve().then(() => T.fake[key](data));
  }
  return new Promise((resolve) => {
    const mgr = G.game.scene;
    for (const sc of mgr.getScenes(false)) {
      const k = sc.sys.settings.key;
      if (k !== key && k !== 'Pause' && (sc.sys.isActive() || sc.sys.isPaused() || sc.sys.isSleeping())) mgr.stop(k);
    }
    currentKey = key;
    mgr.start(key, { ...data, _done: resolve });
  });
}

export function goTitle() {
  const mgr = G.game.scene;
  for (const sc of mgr.getScenes(false)) {
    const k = sc.sys.settings.key;
    if (k !== 'Title' && (sc.sys.isActive() || sc.sys.isPaused() || sc.sys.isSleeping())) mgr.stop(k);
  }
  G.season = null;
  currentKey = 'Title';
  mgr.start('Title');
}

function story(label, vars = {}) {
  if (STORY[label] === undefined) {
    console.warn('missing story', label);
    return Promise.resolve({});
  }
  return runScene('Story', { label, vars });
}

function storyOr(labels, vars) {
  for (const l of labels) if (STORY[l] !== undefined) return story(l, vars);
  return Promise.resolve({});
}

const VOCALISES = ['vocalise_1', 'vocalise_2', 'vocalise_3'];
const DANCES = ['danse_echauffement', 'danse_funk', 'danse_electro'];

function gainsFromGrade(stat, grade, mult = 1) {
  const v = Math.max(1, Math.round(GRADE_GAIN[grade] * mult * energyFactor()));
  addStat(stat, v);
  return { kind: 'stat', id: stat, v };
}

export async function newGame() {
  const res = await runScene('Creator', {});
  if (!res || res.cancel) return goTitle();
  G.season = newSeason(res.player);
  writeSave();
  return playSeason();
}

export async function continueGame(save) {
  G.season = save;
  return playSeason();
}

async function playSeason() {
  const s = G.season;
  const t0 = Date.now();
  const tick = setInterval(() => { if (G.season) G.season.playMs += 10000; }, 10000);
  try {
    if (s.phase === 'prologue') await prologue();
    while (!s.ending && s.week <= WEEKS) {
      const r = await runWeek();
      if (r === 'quit') return;
    }
    if (s.ending) await ending();
  } finally {
    clearInterval(tick);
    void t0;
  }
}

async function prologue() {
  const s = G.season;
  await story('prologue');
  const r = await runScene('Rhythm', {
    song: 'premier_pas', mode: 'chant', level: 'easy', context: 'audition', bg: 'scene', tutorial: true,
    resultTitle: "Résultat de l'audition", excerpt: 70, subtitle: 'Audition',
  });
  s.flags.audition = Math.round(r.acc * 100);
  addStat('voix', Math.round(r.acc * 14));
  addStat('pop', Math.round((r.acc - 0.5) * 10));
  await story('audition_result', { score: s.flags.audition });
  await story('arrivee');
  s.week = 1;
  s.phase = 'intro';
  writeSave();
}

function checkpoint() {
  const s = G.season;
  const copy = JSON.parse(JSON.stringify({ ...s, checkpoint: null }));
  s.checkpoint = copy;
}

async function runWeek() {
  const s = G.season;
  const w = s.week;
  const info = WEEK_INFO[w];
  if (s.phase === 'intro') {
    checkpoint();
    s.player.energie = clamp(s.player.energie + 35, 0, 100);
    await story(`w${w}_intro`);
    s.phase = 'acts';
    s.acts = 0;
    writeSave();
  }
  while (s.phase === 'acts' && s.acts < 3) {
    const ch = await runScene('Planner', {});
    await doActivity(ch);
    s.acts++;
    writeSave();
  }
  if (s.phase === 'acts') s.phase = 'eval';
  if (s.phase === 'eval') {
    await storyOr([`w${w}_eval`, 'eval_generic']);
    const lvl = difficultyFor('eval');
    const r1 = await runScene('Rhythm', {
      song: info.song, mode: info.mode, level: lvl, context: 'eval', bg: info.mode === 'danse' ? 'repetition' : 'salle_musique',
      excerpt: 55, resultTitle: 'Évaluation', subtitle: `Évaluation · ${info.mode === 'danse' ? 'danse' : 'chant'}`,
    });
    let r2;
    if (info.eval2 === 'quiz') r2 = await runScene('Quiz', { count: 5, rivals: shuffle(s.alive).slice(0, 3), title: 'Évaluation : culture', bg: 'bureau' });
    else if (info.eval2 === 'theatre') r2 = await runScene('Theatre', {});
    else r2 = await runScene('Rhythm', { song: pick(DANCES), mode: 'danse', level: lvl, context: 'eval', bg: 'danse', excerpt: 45, resultTitle: 'Évaluation danse', subtitle: 'Évaluation · danse' });
    const ef = energyFactor();
    const score = playerEvalScore(r1.acc * ef, r2.acc * ef);
    simulateEvals(score);
    computeNominees();
    s.player.energie = clamp(s.player.energie - 10, 0, 100);
    s.phase = 'nomin';
    writeSave();
  }
  if (s.phase === 'nomin') {
    const ids = ['player', ...s.alive];
    await story('nomin_intro', { score: s.evals.player });
    if (w < 8) await runScene('Verdict', { kind: 'nomination', ids, nominees: s.nominees, scores: s.evals, bg: 'bureau' });
    const others = s.nominees.filter((n) => n !== 'player');
    const vars = { A: others[0], B: others[1], C: others[2] };
    if (w >= 8) await story(w === 8 ? 'semi_nomin' : 'final_nomin', vars);
    else if (s.playerNominated) await story('nomin_player', vars);
    else await story('nomin_safe', vars);
    s.phase = w >= 8 ? 'confess' : 'vote';
    if (w >= 8) s.publicNominees = w === 9 ? ['player', FINAL_RIVAL] : ['player', ...s.alive];
    writeSave();
  }
  if (s.phase === 'vote') {
    const res = await runScene('Verdict', {
      kind: 'students', ids: s.nominees, nominees: s.nominees, playerNominated: s.playerNominated, bg: 'salon2',
      vote: (choice) => studentVote(choice),
    });
    const saved = s.saved;
    if (res.playerChoice) {
      applyFx(`aff.${res.playerChoice}+6`);
      s.nominees.filter((n) => n !== res.playerChoice && n !== 'player').forEach((n) => applyFx(`aff.${n}-2`));
    }
    const vars = { S: saved, A: s.publicNominees.find((n) => n !== 'player'), B: s.publicNominees.filter((n) => n !== 'player')[1] };
    if (saved === 'player') await story('vote_saved_player', vars);
    else if (s.publicNominees.includes('player')) await story('vote_player_public', vars);
    else await story('vote_after', vars);
    s.phase = 'confess';
    writeSave();
  }
  if (s.phase === 'confess') {
    await storyOr([`confess_${w}`, 'confess_generic']);
    s.phase = 'prime';
    writeSave();
  }
  if (s.phase === 'prime') {
    const r = await prime();
    if (r === 'quit') return 'quit';
  }
  return null;
}

async function doActivity(ch) {
  const s = G.season;
  const lvl = difficultyFor('lesson');
  const gains = [];
  const A = (ch && ch.act) || 'repos';
  const costs = { chant: 15, danse: 18, theatre: 12, culture: 8, souffle: 12, social: 5, repos: -40 };
  if (A === 'chant') {
    await storyOr([`lesson_chant_${(s.week % 3) + 1}`, 'lesson_chant_1']);
    const r = await runScene('Rhythm', { song: VOCALISES[s.week % 3], mode: 'chant', level: lvl, context: 'lesson', bg: 'chant', resultTitle: 'Cours de chant' });
    gains.push(gainsFromGrade('voix', r.grade));
    if (r.grade === 'S') gains.push(gainsFromGrade('scene', 'C'));
  } else if (A === 'danse') {
    await storyOr([`lesson_danse_${(s.week % 3) + 1}`, 'lesson_danse_1']);
    const r = await runScene('Rhythm', { song: DANCES[s.week % 3], mode: 'danse', level: lvl, context: 'lesson', bg: s.week % 2 ? 'danse' : 'repetition', resultTitle: 'Cours de danse', excerpt: 75 });
    gains.push(gainsFromGrade('danse', r.grade));
  } else if (A === 'theatre') {
    await storyOr([`lesson_theatre_${(s.week % 2) + 1}`, 'lesson_theatre_1']);
    const r = await runScene('Theatre', {});
    gains.push(gainsFromGrade('scene', gradeOf(r.acc)));
  } else if (A === 'culture') {
    await storyOr([`lesson_culture_${(s.week % 2) + 1}`, 'lesson_culture_1']);
    const r = await runScene('Quiz', { count: 6, rivals: shuffle(s.alive).slice(0, 3), title: 'Culture musicale' });
    gains.push(gainsFromGrade('culture', gradeOf(r.acc)));
    if (r.rank === 1) { addStat('pop', 1); gains.push({ kind: 'stat', id: 'pop', v: 1 }); }
  } else if (A === 'souffle') {
    await storyOr([`lesson_souffle_${(s.week % 2) + 1}`, 'lesson_souffle_1']);
    const r = await runScene('Souffle', { level: 1 + s.week * 0.08, zone: Math.max(110, 160 - s.week * 5) });
    const g = gradeOf(r.acc);
    gains.push(gainsFromGrade('voix', g, 0.6));
    gains.push(gainsFromGrade('danse', g, 0.4));
  } else if (A === 'social') {
    const id = ch.target;
    const n = (s.socialDone[id] || 0) + 1;
    s.socialDone[id] = n;
    const before = s.aff[id] || 0;
    await storyOr([`social_${id}_${n}`, `social_${id}_${((n - 1) % 3) + 1}`, 'social_generic'], { X: id });
    if ((s.aff[id] || 0) === before) applyFx(`aff.${id}+5`);
    gains.push({ kind: 'aff', id, v: (s.aff[id] || 0) - before });
    addStat('pop', 1);
    gains.push({ kind: 'stat', id: 'pop', v: 1 });
  } else {
    const roommate = s.alive.includes('lea') ? 'lea' : s.alive[0];
    await storyOr([`repos_${(s.week % 3) + 1}`, 'repos_1'], { R: roommate });
  }
  const before = s.player.energie;
  s.player.energie = clamp(s.player.energie - costs[A], 0, 100);
  gains.push({ kind: 'stat', id: 'energie', v: s.player.energie - before });
  G.lastGains = gains.filter((g) => g.v);
}

async function prime() {
  const s = G.season;
  const w = s.week;
  const info = WEEK_INFO[w];
  const snapshot = JSON.parse(JSON.stringify({ ...s, checkpoint: null }));
  await storyOr([`w${w}_prime`, 'prime_generic']);
  const lvl = difficultyFor('prime');
  const bg = w === 9 ? 'finale' : w % 3 === 0 ? 'scene' : w % 3 === 1 ? 'prime' : 'plateau_tv';
  const r = await runScene('Rhythm', { song: info.song, mode: info.mode, level: lvl, context: 'prime', bg, resultTitle: `Prime ${w}`, subtitle: `Prime ${w} · en direct` });
  const ef = energyFactor();
  let perf = r.acc * ef;
  if (info.song2) {
    await story('semi_second_song');
    const r2 = await runScene('Rhythm', { song: info.song2, mode: 'danse', level: lvl, context: 'prime', bg: 'prime', resultTitle: 'Prime · 2e titre' });
    perf = (perf + r2.acc * ef) / 2;
  }
  s.primeScore = perf;
  const popGain = Math.round((perf - 0.62) * 22);
  addStat('pop', popGain);
  addStat(info.mode === 'danse' ? 'danse' : 'voix', Math.max(1, Math.round(GRADE_GAIN[gradeOf(perf)] / 2)));
  addStat('scene', 2);
  const pv = publicVote(perf);
  const ids = w === 9 ? ['player', FINAL_RIVAL] : s.publicNominees;
  await story(w === 9 ? 'final_verdict_intro' : 'prime_verdict_intro', { score: Math.round(perf * 100) });
  await runScene('Verdict', {
    kind: 'public', ids, result: pv.res, out: pv.out, winner: pv.winner, bg,
    title: w === 9 ? 'Le grand vainqueur' : 'Le verdict du public', sub: w === 9 ? 'Qui succédera aux étoiles ?' : 'Qui reste au château ?',
  });
  s.history.push({ week: w, perf: Math.round(perf * 100), out: pv.out, nominees: ids });
  if (w === 9) {
    s.ending = pv.winner === 'player' ? 'victoire' : 'finaliste';
    s.player.energie = 100;
    writeSave();
    return null;
  }
  if (pv.out === 'player') {
    const res = await story('gameover', { week: w });
    if (res.choice === 'retry') {
      Object.assign(s, snapshot);
      s.phase = 'prime';
      s.retries = (s.retries || 0) + 1;
      writeSave();
      return null;
    }
    if (res.choice === 'week' && s.checkpoint) {
      const cp = s.checkpoint;
      Object.keys(s).forEach((k) => delete s[k]);
      Object.assign(s, cp, { checkpoint: null, retries: (cp.retries || 0) + 1 });
      writeSave();
      return null;
    }
    writeSave();
    goTitle();
    return 'quit';
  }
  eliminate(pv.out);
  await storyOr([`farewell_${pv.out}`, 'farewell_generic'], { X: pv.out });
  await storyOr([`w${w}_after`, 'after_generic'], { X: pv.out });
  s.week++;
  s.phase = 'intro';
  writeSave();
  return null;
}

async function ending() {
  const s = G.season;
  await story(s.ending === 'victoire' ? 'ending_victoire' : 'ending_finaliste');
  s.completed = true;
  writeSave();
  await runScene('Credits', { ending: s.ending });
  clearSave();
  goTitle();
}

export async function freePlay(cfg) {
  await runScene('Rhythm', { ...cfg, context: 'free' });
  goTitle();
}
