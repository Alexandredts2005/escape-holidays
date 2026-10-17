'use strict';
// Multiplayer rooms: lobby, quiz battle, "saison express" (quiz + performance + nominations + votes + eliminations).

const MAX_PLAYERS = 8;
const Q_TIME = 15000;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const HAIRS = ['hair1_color1', 'hair1_color2', 'hair1_color3', 'hair2_color1', 'hair2_color2', 'hair2_color3', 'hair3_color1', 'hair4_color1'];
const QUIZ_BATTLE_QUESTIONS = 12;
const SEASON_QUESTIONS = 5;

function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function cleanName(n) {
  const s = String(n || '').replace(/[<>{}|\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 14);
  return s.length >= 2 ? s : null;
}

function cleanLook(l) {
  const o = l && typeof l === 'object' ? l : {};
  const int = (v, a, b, d) => (Number.isInteger(v) && v >= a && v <= b ? v : d);
  return {
    body: int(o.body, 1, 5, 1),
    skin: int(o.skin, 1, 6, 3),
    outfit: int(o.outfit, 0, 2, 0),
    hair: HAIRS.includes(o.hair) ? o.hair : 'hair1_color3',
    tint: int(o.tint, 0, 0xffffff, 0),
  };
}

class Room {
  constructor(mgr, code) {
    this.mgr = mgr;
    this.io = mgr.io;
    this.code = code;
    this.players = new Map(); // pid -> player
    this.host = null;
    this.phase = 'lobby';
    this.mode = null;
    this.round = 0;
    this.timer = null;
    this.q = null;
    this.qList = [];
    this.qIndex = 0;
    this.songIdx = 0;
    this.lastActive = Date.now();
    this.used = new Set();
  }

  emit(ev, data) {
    this.io.to(this.code).emit(ev, data);
  }

  list() {
    return [...this.players.values()];
  }

  connected() {
    return this.list().filter((p) => p.connected);
  }

  alive() {
    return this.list().filter((p) => p.alive);
  }

  publicState() {
    return {
      code: this.code, host: this.host, phase: this.phase, mode: this.mode, round: this.round,
      players: this.list().map((p) => ({ pid: p.pid, name: p.name, look: p.look, score: p.score, alive: p.alive, connected: p.connected, round: p.roundScore })),
    };
  }

  sync() {
    this.emit('mp:room', this.publicState());
  }

  setPhase(phase, data = {}, ms = 0) {
    this.phase = phase;
    this.lastActive = Date.now();
    clearTimeout(this.timer);
    const now = Date.now();
    this.emit('mp:phase', { phase, ...data, endsAt: ms ? now + ms : 0, now });
    this.sync();
  }

  after(ms, fn) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      try { fn(); } catch (e) { console.error('[room]', e); }
    }, ms);
  }

  add(socket, name, look, pid) {
    let p = this.players.get(pid);
    if (p) {
      p.socket = socket.id;
      p.connected = true;
      p.name = name;
      p.look = look;
    } else {
      p = { pid, socket: socket.id, name, look, score: 0, roundScore: 0, alive: this.phase === 'lobby', connected: true, answer: null, perf: null, vote: null };
      this.players.set(pid, p);
    }
    if (!this.host || !this.players.get(this.host) || !this.players.get(this.host).connected) this.host = pid;
    socket.join(this.code);
    socket.data.room = this.code;
    socket.data.pid = pid;
    this.sync();
    return p;
  }

  drop(pid) {
    const p = this.players.get(pid);
    if (!p) return;
    p.connected = false;
    if (this.phase === 'lobby') this.players.delete(pid);
    if (this.host === pid) {
      const next = this.connected()[0];
      this.host = next ? next.pid : null;
    }
    this.sync();
    this.checkProgress();
  }

  // ---------------------------------------------------------------- game start
  start(mode) {
    if (this.phase !== 'lobby' && this.phase !== 'podium' && this.phase !== 'winner') return;
    if (this.connected().length < 1) return;
    this.mode = mode === 'saison' ? 'saison' : 'quiz';
    for (const p of this.list()) {
      if (!p.connected) { this.players.delete(p.pid); continue; }
      p.score = 0; p.roundScore = 0; p.alive = true; p.answer = null; p.perf = null; p.vote = null;
    }
    this.round = 0;
    this.songIdx = Math.floor(Math.random() * 4);
    if (this.mode === 'quiz') {
      this.qList = this.drawQuestions(QUIZ_BATTLE_QUESTIONS);
      this.qIndex = 0;
      this.setPhase('intro', { title: 'Quiz Battle', sub: `${this.qList.length} questions — sois le plus rapide !` }, 4000);
      this.after(4000, () => this.nextQuestion());
    } else {
      this.nextRound();
    }
  }

  drawQuestions(n) {
    let pool = this.mgr.quiz.filter((q) => !this.used.has(q.q));
    if (pool.length < n) { this.used.clear(); pool = this.mgr.quiz; }
    const out = shuffle(pool).slice(0, n);
    out.forEach((q) => this.used.add(q.q));
    return out;
  }

  // ---------------------------------------------------------------- quiz
  nextQuestion() {
    if (this.qIndex >= this.qList.length) {
      if (this.mode === 'quiz') return this.podium();
      return this.startPerf();
    }
    const src = this.qList[this.qIndex];
    const order = shuffle([0, 1, 2, 3]);
    this.q = { id: `${this.round}-${this.qIndex}`, src, answers: order.map((i) => src.a[i]), correct: order.indexOf(0), start: Date.now() };
    for (const p of this.list()) p.answer = null;
    this.setPhase('question', {
      qid: this.q.id, n: this.qIndex, total: this.qList.length, t: src.t, q: src.q, answers: this.q.answers, duration: Q_TIME / 1000,
    }, Q_TIME);
    this.after(Q_TIME + 300, () => this.reveal());
  }

  answer(pid, qid, choice) {
    const p = this.players.get(pid);
    if (!p || this.phase !== 'question' || !this.q || qid !== this.q.id || p.answer) return;
    if (this.mode === 'saison' && !p.alive) return;
    const c = Number(choice);
    if (!Number.isInteger(c) || c < 0 || c > 3) return;
    p.answer = { choice: c, ms: Date.now() - this.q.start };
    this.emit('mp:answered', { pid });
    this.checkProgress();
  }

  reveal() {
    if (this.phase !== 'question') return;
    const results = {};
    for (const p of this.list()) {
      if (this.mode === 'saison' && !p.alive) continue;
      const a = p.answer;
      const ok = !!a && a.choice === this.q.correct;
      const pts = ok ? Math.round(500 + 500 * Math.max(0, 1 - a.ms / Q_TIME)) : 0;
      p.score += pts;
      p.quizPts = (p.quizPts || 0) + pts;
      results[p.pid] = { choice: a ? a.choice : -1, ok, pts };
    }
    this.setPhase('reveal', { qid: this.q.id, correct: this.q.correct, results, fact: this.q.src.f || null, scores: this.scores() }, 4500);
    this.qIndex++;
    this.after(this.q.src.f ? 5200 : 4000, () => this.nextQuestion());
  }

  scores() {
    const s = {};
    for (const p of this.list()) s[p.pid] = p.score;
    return s;
  }

  podium() {
    const ranking = this.list().slice().sort((a, b) => b.score - a.score).map((p) => ({ pid: p.pid, name: p.name, score: p.score }));
    this.setPhase('podium', { ranking }, 0);
  }

  // ---------------------------------------------------------------- saison express
  nextRound() {
    this.round++;
    for (const p of this.list()) { p.quizPts = 0; p.perf = null; p.vote = null; p.roundScore = 0; }
    this.qList = this.drawQuestions(SEASON_QUESTIONS);
    this.qIndex = 0;
    const alive = this.alive().length;
    this.setPhase('intro', {
      title: alive <= 2 ? 'La Grande Finale' : `Prime ${this.round}`,
      sub: alive <= 2 ? 'Quiz + performance : le meilleur score gagne !' : `${alive} élèves en lice · quiz + performance, puis nominations`,
    }, 4500);
    this.after(4500, () => this.nextQuestion());
  }

  startPerf() {
    const pool = this.mgr.songs.filter((s) => s.kind === 'song');
    const song = pool[this.songIdx % pool.length];
    this.songIdx++;
    const mode = this.round % 2 === 0 ? 'danse' : 'chant';
    this.perfSong = song;
    const level = this.round >= 3 ? 'normal' : 'easy';
    const ms = Math.round(Math.min(song.duration, 75) * 1000) + 30000;
    this.setPhase('perf', { song: song.id, title: song.title, mode, level, excerpt: 75 }, ms);
    this.after(ms, () => this.endPerf());
  }

  perfProgress(pid, data) {
    const p = this.players.get(pid);
    if (!p || this.phase !== 'perf' || !p.alive) return;
    p.live = { score: Math.max(0, Math.min(1e7, Number(data.score) || 0)), acc: Math.max(0, Math.min(1, Number(data.acc) || 0)) };
    const now = Date.now();
    if (!this.lastBoard || now - this.lastBoard > 1500) {
      this.lastBoard = now;
      const list = this.alive().map((x) => ({ pid: x.pid, name: x.name, score: x.live ? x.live.score : 0 })).sort((a, b) => b.score - a.score);
      this.emit('mp:board', { list });
    }
  }

  perfDone(pid, data) {
    const p = this.players.get(pid);
    if (!p || this.phase !== 'perf' || !p.alive || p.perf) return;
    p.perf = { acc: Math.max(0, Math.min(1, Number(data.acc) || 0)), score: Math.max(0, Math.min(1e7, Number(data.score) || 0)) };
    this.emit('mp:answered', { pid });
    this.checkProgress();
  }

  endPerf() {
    if (this.phase !== 'perf') return;
    const alive = this.alive();
    for (const p of alive) {
      const acc = p.perf ? p.perf.acc : 0;
      p.roundScore = Math.round(((p.quizPts || 0) / (SEASON_QUESTIONS * 1000)) * 45 + acc * 55);
      p.score += Math.round(acc * 3000);
    }
    const ranking = alive.slice().sort((a, b) => b.roundScore - a.roundScore).map((p) => ({ pid: p.pid, name: p.name, round: p.roundScore, acc: p.perf ? p.perf.acc : 0 }));
    this.setPhase('results', { ranking }, 7000);
    this.after(7000, () => {
      if (alive.length <= 2) return this.final(ranking);
      this.nominate(ranking);
    });
  }

  nominate(ranking) {
    const noms = ranking.slice(-2).map((r) => r.pid);
    this.nominees = noms;
    this.setPhase('nominate', { nominees: noms }, 6000);
    this.after(6000, () => this.startVote());
  }

  voters() {
    return this.list().filter((p) => p.connected && !this.nominees.includes(p.pid));
  }

  startVote() {
    for (const p of this.list()) p.vote = null;
    if (!this.voters().length) return this.endVote();
    this.setPhase('vote', { nominees: this.nominees }, 15000);
    this.after(15000, () => this.endVote());
  }

  vote(pid, target) {
    const p = this.players.get(pid);
    if (!p || this.phase !== 'vote' || this.nominees.includes(pid) || p.vote || !this.nominees.includes(target)) return;
    p.vote = target;
    this.emit('mp:answered', { pid });
    this.checkProgress();
  }

  endVote() {
    if (this.phase !== 'vote' && this.phase !== 'nominate') return;
    const counts = {};
    this.nominees.forEach((n) => { counts[n] = 0; });
    for (const p of this.list()) if (p.vote && counts[p.vote] !== undefined) counts[p.vote]++;
    const [a, b] = this.nominees;
    const pa = this.players.get(a);
    const pb = this.players.get(b);
    let saved;
    if (counts[a] !== counts[b]) saved = counts[a] > counts[b] ? a : b;
    else saved = (pa ? pa.roundScore : 0) >= (pb ? pb.roundScore : 0) ? a : b;
    const out = saved === a ? b : a;
    const po = this.players.get(out);
    if (po) po.alive = false;
    this.setPhase('elim', { counts, saved, out }, 8000);
    this.after(8000, () => {
      if (this.alive().length <= 1) return this.winner(this.alive()[0]);
      this.nextRound();
    });
  }

  final(ranking) {
    const win = ranking[0] ? this.players.get(ranking[0].pid) : null;
    this.winner(win);
  }

  winner(p) {
    const ranking = this.list().slice().sort((a, b) => (b.alive - a.alive) || (b.score - a.score)).map((x) => ({ pid: x.pid, name: x.name, score: x.score }));
    this.setPhase('winner', { pid: p ? p.pid : null, name: p ? p.name : '', ranking }, 0);
  }

  // all expected inputs received -> advance early
  checkProgress() {
    if (this.phase === 'question') {
      const need = this.list().filter((p) => p.connected && (this.mode === 'quiz' || p.alive));
      if (need.length && need.every((p) => p.answer)) this.after(600, () => this.reveal());
    } else if (this.phase === 'perf') {
      const need = this.alive().filter((p) => p.connected);
      if (need.every((p) => p.perf)) this.after(800, () => this.endPerf());
    } else if (this.phase === 'vote') {
      const v = this.voters();
      if (v.every((p) => p.vote)) this.after(800, () => this.endVote());
    }
  }

  backToLobby() {
    clearTimeout(this.timer);
    for (const p of this.list()) if (!p.connected) this.players.delete(p.pid);
    this.list().forEach((p) => { p.alive = true; });
    this.setPhase('lobby', {}, 0);
  }
}

class RoomManager {
  constructor(io, { quiz, songs }) {
    this.io = io;
    this.quiz = quiz;
    this.songs = songs;
    this.rooms = new Map();
    setInterval(() => this.gc(), 60000).unref();
  }

  count() {
    return this.rooms.size;
  }

  newCode() {
    for (let k = 0; k < 1000; k++) {
      let c = '';
      for (let i = 0; i < 4; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
      if (!this.rooms.has(c)) return c;
    }
    return null;
  }

  gc() {
    const now = Date.now();
    for (const [code, r] of this.rooms) {
      if (!r.connected().length && now - r.lastActive > 120000) {
        clearTimeout(r.timer);
        this.rooms.delete(code);
      }
    }
  }

  attach(socket) {
    const bucket = { t: Date.now(), n: 0 };
    const limited = () => {
      const now = Date.now();
      if (now - bucket.t > 1000) { bucket.t = now; bucket.n = 0; }
      bucket.n++;
      return bucket.n > 25;
    };
    const room = () => this.rooms.get(socket.data.room);
    const pidOk = (pid) => typeof pid === 'string' && /^[a-z0-9]{8,32}$/i.test(pid);

    socket.on('mp:create', (d, cb) => {
      if (limited() || typeof cb !== 'function') return;
      const name = cleanName(d && d.name);
      if (!name || !pidOk(d.pid)) return cb({ ok: false, err: 'Prénom invalide' });
      const code = this.newCode();
      if (!code) return cb({ ok: false, err: 'Serveur plein' });
      const r = new Room(this, code);
      this.rooms.set(code, r);
      r.add(socket, name, cleanLook(d.look), d.pid);
      cb({ ok: true, code });
    });

    socket.on('mp:join', (d, cb) => {
      if (limited() || typeof cb !== 'function') return;
      const code = String((d && d.code) || '').toUpperCase().trim();
      const r = this.rooms.get(code);
      const name = cleanName(d && d.name);
      if (!r) return cb({ ok: false, err: 'Salon introuvable' });
      if (!name || !pidOk(d.pid)) return cb({ ok: false, err: 'Prénom invalide' });
      const existing = r.players.get(d.pid);
      if (!existing && r.players.size >= MAX_PLAYERS) return cb({ ok: false, err: 'Salon complet (8 max)' });
      if (!existing && r.phase !== 'lobby') {
        // spectator joins as eliminated player who can still vote
        r.add(socket, name, cleanLook(d.look), d.pid).alive = false;
      } else r.add(socket, name, cleanLook(d.look), d.pid);
      cb({ ok: true, code, phase: r.phase });
      r.sync();
    });

    socket.on('mp:start', (d) => {
      const r = room();
      if (!r || r.host !== socket.data.pid || limited()) return;
      r.start(d && d.mode);
    });

    socket.on('mp:lobby', () => {
      const r = room();
      if (!r || r.host !== socket.data.pid) return;
      r.backToLobby();
    });

    socket.on('mp:answer', (d) => {
      const r = room();
      if (r && d) r.answer(socket.data.pid, d.qid, d.choice);
    });

    socket.on('mp:perf_progress', (d) => {
      const r = room();
      if (r && d && !limited()) r.perfProgress(socket.data.pid, d);
    });

    socket.on('mp:perf_done', (d) => {
      const r = room();
      if (r && d) r.perfDone(socket.data.pid, d);
    });

    socket.on('mp:vote', (d) => {
      const r = room();
      if (r && d) r.vote(socket.data.pid, d.target);
    });

    socket.on('mp:react', (d) => {
      const r = room();
      if (!r || limited()) return;
      const e = Number(d && d.e);
      if (Number.isInteger(e) && e >= 0 && e < 6) r.emit('mp:react', { pid: socket.data.pid, e });
    });

    socket.on('mp:leave', () => {
      const r = room();
      if (!r) return;
      socket.leave(r.code);
      r.players.delete(socket.data.pid);
      if (r.host === socket.data.pid) {
        const n = r.connected()[0];
        r.host = n ? n.pid : null;
      }
      socket.data.room = null;
      r.sync();
      r.checkProgress();
    });

    socket.on('disconnect', () => {
      const r = room();
      if (r) r.drop(socket.data.pid);
    });
  }
}

module.exports = { RoomManager, Room, cleanName, cleanLook };
