// Online multiplayer client: lobby, quiz battle, saison express.
import { G, W, H, hasSave, loadSave } from '../core/state.js';
import { Audio } from '../core/audio.js';
import { need, bgAsset } from '../core/assets.js';
import { text, button, setBackground, portrait, fadeIn, fadeOut, wait, sparkles, vignette, burst, confetti, makeLookPortrait, toast, spotlights } from '../ui/ui.js';
import { askQuestion, reveal as revealQ, clearQuestion } from '../ui/quizui.js';
import { PRESET_LOOKS } from './Creator.js';

const REACT = ['ico_pop', 'ico_star', 'ico_voix', 'ico_check', 'ico_crown', 'ico_forme'];

function getPid() {
  let pid = null;
  try { pid = localStorage.getItem('nova_pid'); } catch (e) { /* ignore */ }
  if (!pid || !/^[a-z0-9]{8,32}$/i.test(pid)) {
    pid = Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 8);
    try { localStorage.setItem('nova_pid', pid); } catch (e) { /* ignore */ }
  }
  return pid;
}

export class Multi extends Phaser.Scene {
  constructor() { super('Multi'); }

  init() {
    this.pid = getPid();
    this.room = null;
    this.phase = 'menu';
    this.ui = [];
    this.offset = 0;
    const save = hasSave() ? loadSave() : null;
    let prefs = null;
    try { prefs = JSON.parse(localStorage.getItem('nova_mp_prefs') || 'null'); } catch (e) { prefs = null; }
    this.name = (prefs && prefs.name) || (save ? save.player.name : '');
    this.look = (prefs && prefs.look) || (save ? save.player.look : PRESET_LOOKS[0]);
    this.lookIdx = -1;
  }

  async create() {
    await need(this, [bgAsset('plateau_tv'), bgAsset('prime')]);
    fadeIn(this);
    Audio.music(this, 'bgm_prime', { volume: 0.5 });
    this.bg = setBackground(this, 'plateau_tv', { dim: true });
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b0614, 0.55);
    vignette(this, 1);
    sparkles(this, 1);
    this.events.on('wake', () => { Audio.music(this, 'bgm_prime', { volume: 0.5 }); this.render(); });
    this.events.once('shutdown', () => this.disconnect());
    if (typeof window.io !== 'function') {
      this.clear();
      this.put(text(this, W / 2, 420, 'Multijoueur indisponible', { size: 60, weight: 900, ox: 0.5, oy: 0.5 }));
      this.put(text(this, W / 2, 530, 'Le mode en ligne nécessite le serveur NOVA (npm start ou Docker).\nLe jeu solo fonctionne sans serveur.', { size: 30, weight: 400, ox: 0.5, oy: 0.5, align: 'center' }));
      this.put(button(this, W / 2, 700, 360, 84, 'Retour', () => this.leave()));
      return;
    }
    this.connect();
    this.render();
  }

  connect() {
    const url = window.NOVA_SERVER || undefined;
    const sock = window.io(url, { transports: ['websocket', 'polling'], reconnection: true });
    this.sock = sock;
    sock.on('connect', () => {
      if (this.room) sock.emit('mp:join', { code: this.room.code, name: this.name, look: this.look, pid: this.pid }, () => {});
    });
    sock.on('mp:room', (r) => {
      const first = !this.room;
      this.room = r;
      this.ensurePortraits().then(() => { if (first || this.phase === 'lobby') this.renderIfAwake(); else this.refreshStrip(); });
    });
    sock.on('mp:phase', (p) => {
      this.offset = p.now - Date.now();
      this.phaseData = p;
      this.phase = p.phase;
      this.renderIfAwake();
    });
    sock.on('mp:answered', ({ pid }) => this.markAnswered(pid));
    sock.on('mp:board', ({ list }) => { this.board = list; });
    sock.on('mp:react', ({ pid, e }) => this.showReaction(pid, e));
    sock.on('connect_error', () => { if (this.phase === 'menu') toast(this, 'Connexion au serveur impossible', '#ff8a8a'); });
  }

  disconnect() {
    if (this.sock) {
      try { this.sock.emit('mp:leave'); this.sock.disconnect(); } catch (e) { /* ignore */ }
    }
    this.sock = null;
  }

  async ensurePortraits() {
    if (!this.room) return;
    for (const p of this.room.players) {
      const key = 'portrait_mp_' + p.pid;
      const sig = JSON.stringify(p.look);
      if (this.textures.exists(key) && this.textures.get(key).sig === sig) continue;
      await makeLookPortrait(this, p.look, key);
      this.textures.get(key).sig = sig;
    }
  }

  renderIfAwake() {
    if (this.scene.isSleeping() || !this.scene.isActive()) return;
    this.render();
  }

  put(o) { this.ui.push(o); return o; }

  clear() {
    if (this.qui) { clearQuestion(this.qui); this.qui = null; }
    this.ui.forEach((o) => o && o.destroy && o.destroy());
    this.ui = [];
    this.strip = null;
  }

  me() {
    return this.room && this.room.players.find((p) => p.pid === this.pid);
  }

  isHost() {
    return this.room && this.room.host === this.pid;
  }

  pkey(pid) { return 'portrait_mp_' + pid; }

  playerName(pid) {
    const p = this.room && this.room.players.find((x) => x.pid === pid);
    return p ? p.name : '?';
  }

  render() {
    this.clear();
    const ph = this.phase;
    if (ph === 'menu') return this.renderMenu();
    if (ph === 'lobby') return this.renderLobby();
    if (ph === 'intro') return this.renderIntro();
    if (ph === 'question') return this.renderQuestion();
    if (ph === 'reveal') return this.renderReveal();
    if (ph === 'perf') return this.renderPerf();
    if (ph === 'results') return this.renderResults();
    if (ph === 'nominate') return this.renderNominate();
    if (ph === 'vote') return this.renderVote();
    if (ph === 'elim') return this.renderElim();
    if (ph === 'winner' || ph === 'podium') return this.renderWinner();
    this.heading('Connexion au salon…', 'La partie en cours va s\'afficher dans un instant');
    return null;
  }

  heading(str, sub) {
    this.put(text(this, W / 2, 90, str, { size: 64, weight: 900, font: 'Montserrat, Poppins', ox: 0.5, oy: 0.5, stroke: '#3a1250', strokeW: 10 }));
    if (sub) this.put(text(this, W / 2, 160, sub, { size: 28, weight: 400, ox: 0.5, oy: 0.5, color: '#ffd6f3' }));
  }

  // ---------------------------------------------------------------- menu
  async renderMenu() {
    this.heading('Multijoueur en ligne', 'Jusqu\'à 8 joueurs · Quiz Battle ou Saison express');
    this.put(this.add.nineslice(W / 2, 560, 'panel', undefined, 1300, 760, 28, 28, 28, 28));
    this.put(text(this, 420, 270, 'Ton prénom', { size: 30, weight: 800, oy: 0.5 }));
    const el = document.createElement('input');
    el.className = 'nova';
    el.maxLength = 14;
    el.placeholder = 'Prénom';
    el.value = this.name;
    this.nameEl = this.put(this.add.dom(1050, 270, el));
    this.put(text(this, 420, 390, 'Ton avatar', { size: 30, weight: 800, oy: 0.5 }));
    const looks = [this.look, ...PRESET_LOOKS];
    for (let i = 0; i < looks.length; i++) await makeLookPortrait(this, looks[i], 'portrait_preset_' + i);
    looks.forEach((lk, i) => {
      const x = 700 + i * 150;
      const p = this.put(portrait(this, 'preset', x, 400, 120, { key: 'portrait_preset_' + i, color: i === Math.max(0, this.lookIdx) ? '#ffe66d' : '#8b5cff' }));
      p.setSize(130, 130).setInteractive({ useHandCursor: true });
      p.on('pointerdown', () => {
        this.lookIdx = i;
        this.look = lk;
        Audio.sfx(this, 'select', 0.6);
        this.name = this.nameEl.node.value;
        this.render();
      });
    });
    this.put(button(this, W / 2, 560, 620, 96, 'Créer un salon', () => this.create_()));
    this.put(text(this, 420, 700, 'Code du salon', { size: 30, weight: 800, oy: 0.5 }));
    const ce = document.createElement('input');
    ce.className = 'nova';
    ce.maxLength = 4;
    ce.placeholder = 'ABCD';
    ce.style.width = '220px';
    ce.style.textTransform = 'uppercase';
    this.codeEl = this.put(this.add.dom(870, 700, ce));
    this.put(button(this, 1300, 700, 420, 90, 'Rejoindre', () => this.join(), { style: 'btn2' }));
    this.put(button(this, W / 2, 1000, 320, 76, 'Retour', () => this.leave(), { style: 'btn_off', size: 26 }));
  }

  validName() {
    const n = (this.nameEl.node.value || '').trim();
    if (n.length < 2) { toast(this, 'Entre un prénom (2 lettres minimum)', '#ff8a8a'); return null; }
    this.name = n;
    try { localStorage.setItem('nova_mp_prefs', JSON.stringify({ name: n, look: this.look })); } catch (e) { /* ignore */ }
    return n;
  }

  create_() {
    const n = this.validName();
    if (!n) return;
    this.sock.emit('mp:create', { name: n, look: this.look, pid: this.pid }, (r) => {
      if (!r || !r.ok) return toast(this, (r && r.err) || 'Erreur', '#ff8a8a');
      this.phase = 'lobby';
      Audio.sfx(this, 'confirm', 0.7);
    });
  }

  join() {
    const n = this.validName();
    if (!n) return;
    const code = (this.codeEl.node.value || '').toUpperCase().trim();
    if (code.length !== 4) return toast(this, 'Le code fait 4 lettres', '#ff8a8a');
    this.sock.emit('mp:join', { code, name: n, look: this.look, pid: this.pid }, (r) => {
      if (!r || !r.ok) return toast(this, (r && r.err) || 'Erreur', '#ff8a8a');
      this.phase = r.phase === 'lobby' ? 'lobby' : 'waiting';
      Audio.sfx(this, 'confirm', 0.7);
      this.render();
    });
  }

  async leave() {
    this.disconnect();
    await fadeOut(this);
    this.scene.start('Title');
  }

  // ---------------------------------------------------------------- lobby
  renderLobby() {
    const r = this.room;
    if (!r) return;
    this.heading(`Salon ${r.code}`, 'Partage ce code avec tes amis pour qu\'ils te rejoignent');
    const n = r.players.length;
    r.players.forEach((p, i) => {
      const x = W / 2 + ((i % 4) - (Math.min(4, n - Math.floor(i / 4) * 4) - 1) / 2) * 300;
      const y = 380 + Math.floor(i / 4) * 300;
      const c = this.put(portrait(this, 'mp', x, y, 170, { key: this.pkey(p.pid), label: p.name + (p.pid === this.pid ? ' (toi)' : ''), color: p.pid === r.host ? '#ffe66d' : '#ff8ce6' }));
      if (p.pid === r.host) this.put(this.add.image(x + 70, y - 80, 'ico_crown').setDisplaySize(56, 56));
      if (!p.connected) c.setAlpha(0.4);
      c.pid = p.pid;
    });
    this.lobbyCards = this.ui.filter((o) => o.pid);
    if (this.isHost()) {
      this.put(button(this, W / 2 - 330, 900, 600, 100, 'Lancer : Quiz Battle', () => this.sock.emit('mp:start', { mode: 'quiz' }), { sub: '12 questions, le plus rapide gagne' }));
      this.put(button(this, W / 2 + 330, 900, 600, 100, 'Lancer : Saison express', () => this.sock.emit('mp:start', { mode: 'saison' }), { style: 'btn2', sub: 'Quiz + scène + votes + éliminations' }));
    } else {
      this.put(text(this, W / 2, 900, 'En attente de l\'hôte…', { size: 36, weight: 800, ox: 0.5, oy: 0.5, color: '#ffd6f3' }));
    }
    this.reactBar(1010);
    this.put(button(this, 140, 1020, 200, 64, 'Quitter', () => this.leave(), { style: 'btn_off', size: 24 }));
  }

  reactBar(y) {
    REACT.forEach((ic, i) => {
      const b = this.put(this.add.image(W / 2 - 250 + i * 100, y, ic).setDisplaySize(70, 70).setInteractive({ useHandCursor: true }));
      b.on('pointerdown', () => { this.sock.emit('mp:react', { e: i }); this.tweens.add({ targets: b, scale: b.scale * 1.2, duration: 80, yoyo: true }); });
    });
  }

  showReaction(pid, e) {
    let x = W / 2;
    let y = 600;
    const card = (this.strip && this.strip[pid]) || (this.lobbyCards && this.lobbyCards.find((c) => c.pid === pid && c.scene));
    if (card) { x = card.x; y = card.y - 60; }
    const im = this.add.image(x, y, REACT[e]).setDisplaySize(80, 80).setDepth(500);
    this.tweens.add({ targets: im, y: y - 140, alpha: 0, duration: 1400, ease: 'Cubic.out', onComplete: () => im.destroy() });
    Audio.sfx(this, 'pluck', 0.4);
  }

  // left-side strip of players with score + answered marker
  playerStrip(onlyAlive = false) {
    const r = this.room;
    if (!r) return;
    this.strip = {};
    const list = r.players.filter((p) => !onlyAlive || p.alive || r.mode === 'quiz').slice(0, 8);
    list.forEach((p, i) => {
      const y = 280 + i * 92;
      const c = this.put(portrait(this, 'mp', 70, y, 64, { key: this.pkey(p.pid), color: p.pid === this.pid ? '#ffe66d' : '#8b5cff' }));
      const nm = this.put(text(this, 115, y - 14, p.name, { size: 22, weight: 800, oy: 0.5 }));
      const sc = this.put(text(this, 115, y + 14, (p.score || 0).toLocaleString('fr-FR'), { size: 20, weight: 600, oy: 0.5, color: '#ffe66d' }));
      const mk = this.put(text(this, 40, y - 30, '', { size: 26, ox: 0.5, oy: 0.5, color: '#7dffb0' }));
      if (!p.alive && r.mode === 'saison') { c.setAlpha(0.4); nm.setAlpha(0.5); }
      this.strip[p.pid] = { x: 70, y, c, sc, mk };
    });
  }

  refreshStrip() {
    if (!this.strip || !this.room) return;
    for (const p of this.room.players) if (this.strip[p.pid]) this.strip[p.pid].sc.setText((p.score || 0).toLocaleString('fr-FR'));
  }

  markAnswered(pid) {
    if (this.strip && this.strip[pid]) {
      this.strip[pid].mk.setText('✔');
      Audio.sfx(this, 'select', 0.25);
    }
  }

  // ---------------------------------------------------------------- phases
  renderIntro() {
    const d = this.phaseData;
    Audio.sfx(this, 'jingle_prime', 0.6);
    const t = this.put(text(this, W / 2, 470, d.title, { size: 100, weight: 900, font: 'Montserrat, Poppins', ox: 0.5, oy: 0.5, stroke: '#5a1e7a', strokeW: 12 }));
    this.put(text(this, W / 2, 590, d.sub || '', { size: 34, weight: 600, ox: 0.5, oy: 0.5, color: '#ffd6f3' }));
    t.setScale(0.5);
    this.tweens.add({ targets: t, scale: 1, duration: 600, ease: 'Back.out' });
    this.put(spotlights(this, 4, 2)[0]);
  }

  renderQuestion() {
    const d = this.phaseData;
    this.playerStrip(true);
    const me = this.me();
    const locked = this.room.mode === 'saison' && me && !me.alive;
    const q = { t: d.t, q: d.q, answers: d.answers };
    const left = Math.max(1, ((d.endsAt - this.offset) - Date.now()) / 1000);
    this.qid = d.qid;
    this.myChoice = -1;
    askQuestion(this, q, { duration: Math.min(d.duration, left), index: d.n, total: d.total, locked, onUi: (ui) => { this.qui = ui; } })
      .then((res) => {
        if (res.choice >= 0 && this.qid === d.qid && this.phase === 'question') {
          this.myChoice = res.choice;
          this.sock.emit('mp:answer', { qid: d.qid, choice: res.choice });
          Audio.sfx(this, 'confirm', 0.5);
        }
      });
    if (locked) this.put(text(this, W / 2, 900, 'Tu es éliminé·e : tu regardes la partie', { size: 28, weight: 600, ox: 0.5, oy: 0.5, color: '#cbb8ea' }));
  }

  renderReveal() {
    const d = this.phaseData;
    const prevUi = this.qui;
    this.qui = null;
    if (prevUi && prevUi.root.forceEnd) prevUi.root.forceEnd();
    this.clear();
    this.playerStrip(true);
    if (prevUi) {
      this.qui = prevUi;
      revealQ(this, prevUi, d.correct, this.myChoice);
    } else {
      this.put(text(this, W / 2, 400, 'Réponse', { size: 50, weight: 900, ox: 0.5, oy: 0.5 }));
    }
    for (const [pid, r] of Object.entries(d.results)) {
      const s = this.strip[pid];
      if (!s) continue;
      s.mk.setText(r.ok ? '✔' : '✖').setColor(r.ok ? '#7dffb0' : '#ff6b81');
      s.sc.setText((d.scores[pid] || 0).toLocaleString('fr-FR'));
      if (r.ok && r.pts) {
        const t = this.put(text(this, 300, s.y, `+${r.pts}`, { size: 26, weight: 900, oy: 0.5, color: '#7dffb0' }));
        this.tweens.add({ targets: t, x: 340, alpha: 0, delay: 1400, duration: 600 });
      }
    }
    const mine = d.results[this.pid];
    if (mine && mine.ok) burst(this, W / 2, 600, 0x7dffb0, 20, 300);
    if (d.fact) this.put(text(this, W / 2, 920, 'Le savais-tu ? ' + d.fact, { size: 26, weight: 400, ox: 0.5, oy: 0.5, align: 'center', wrap: 1300, color: '#fff3c4' }).setDepth(150));
  }

  renderPerf() {
    const d = this.phaseData;
    const me = this.me();
    if (!me || !me.alive || this.perfDoneFor === d.endsAt) {
      this.heading('Performance en cours…', `${d.title} · ${d.mode === 'danse' ? 'danse' : 'chant'}`);
      this.liveBoard();
      return;
    }
    this.perfDoneFor = d.endsAt;
    this.scene.launch('Rhythm', {
      song: d.song, mode: d.mode, level: d.level, context: 'mp', bg: 'prime', excerpt: d.excerpt, dancer: 'player', look: this.look,
      resultTitle: 'Ta performance', subtitle: 'Saison express · en direct',
      onProgress: (pr) => {
        if (this.sock) this.sock.emit('mp:perf_progress', pr);
        return (this.board || []).slice(0, 5).map((b, i) => `${i + 1}. ${b.name}  ${b.score.toLocaleString('fr-FR')}`).join('\n');
      },
      onFinish: (r) => { if (this.sock) this.sock.emit('mp:perf_done', { acc: r.acc, score: r.score }); },
      _done: () => { this.scene.wake(); },
    });
    this.scene.sleep();
  }

  liveBoard() {
    const draw = () => {
      if (this.phase !== 'perf' || !this.scene.isActive()) return;
      if (this.boardTxt) this.boardTxt.destroy();
      this.boardTxt = this.put(text(this, W / 2, 360, (this.board || []).map((b, i) => `${i + 1}. ${b.name} — ${b.score.toLocaleString('fr-FR')}`).join('\n') || 'Les élèves sont sur scène…', { size: 36, weight: 800, ox: 0.5, oy: 0, align: 'center', lineSpacing: 14 }));
      this.time.delayedCall(1500, draw);
    };
    draw();
  }

  renderResults() {
    const d = this.phaseData;
    this.heading('Résultats du prime', 'Quiz (45 %) + performance (55 %)');
    d.ranking.forEach((r, i) => {
      const y = 280 + i * 92;
      this.put(text(this, 560, y, `${i + 1}.`, { size: 40, weight: 900, oy: 0.5, color: i === 0 ? '#ffe66d' : '#ffffff' }));
      this.put(portrait(this, 'mp', 680, y, 72, { key: this.pkey(r.pid) }));
      this.put(text(this, 750, y, r.name, { size: 32, weight: 800, oy: 0.5, color: r.pid === this.pid ? '#ff8ce6' : '#ffffff' }));
      this.put(text(this, 1360, y, `${r.round}/100 · ${Math.round(r.acc * 100)} % justesse`, { size: 28, weight: 600, ox: 1, oy: 0.5, color: '#ffe66d' }));
    });
  }

  renderNominate() {
    const d = this.phaseData;
    Audio.sfx(this, 'sting_verdict', 0.8);
    this.cameras.main.shake(300, 0.005);
    this.heading('Les nommés', 'Les deux derniers du prime sont en danger…');
    d.nominees.forEach((pid, i) => {
      const x = W / 2 + (i ? 300 : -300);
      const c = this.put(portrait(this, 'mp', x, 520, 240, { key: this.pkey(pid), label: this.playerName(pid), color: '#ff3355', labelSize: 34 }));
      c.setScale(0);
      this.tweens.add({ targets: c, scale: 1, duration: 500, delay: i * 400, ease: 'Back.out' });
    });
  }

  renderVote() {
    const d = this.phaseData;
    const me = this.me();
    const iAmNominee = d.nominees.includes(this.pid);
    this.heading('Le vote', iAmNominee ? 'Les autres joueurs votent pour sauver l\'un de vous deux…' : 'Qui veux-tu sauver ?');
    d.nominees.forEach((pid, i) => {
      const x = W / 2 + (i ? 300 : -300);
      this.put(portrait(this, 'mp', x, 480, 220, { key: this.pkey(pid), label: this.playerName(pid), color: '#ff8ce6', labelSize: 32 }));
      if (!iAmNominee && me) {
        const b = this.put(button(this, x, 760, 380, 90, `Sauver ${this.playerName(pid)}`, () => {
          this.sock.emit('mp:vote', { target: pid });
          this.ui.filter((o) => o.isVoteBtn).forEach((o) => o.setEnabled(false));
          Audio.sfx(this, 'confirm', 0.6);
        }));
        b.isVoteBtn = true;
      }
    });
    this.timerText(900);
  }

  timerText(y) {
    const d = this.phaseData;
    const t = this.put(text(this, W / 2, y, '', { size: 34, weight: 800, ox: 0.5, oy: 0.5, color: '#ffe66d' }));
    const ev = this.time.addEvent({
      delay: 250, loop: true, callback: () => {
        if (!t.scene) { ev.remove(); return; }
        const left = Math.max(0, Math.ceil(((d.endsAt - this.offset) - Date.now()) / 1000));
        t.setText(`${left} s`);
      },
    });
  }

  renderElim() {
    const d = this.phaseData;
    this.heading('Le verdict', '');
    const ids = Object.keys(d.counts);
    ids.forEach((pid, i) => {
      const x = W / 2 + (i ? 300 : -300);
      const saved = pid === d.saved;
      const c = this.put(portrait(this, 'mp', x, 480, 230, { key: this.pkey(pid), label: this.playerName(pid), color: saved ? '#3ddc84' : '#666677', labelSize: 32 }));
      this.put(text(this, x, 680, `${d.counts[pid]} voix`, { size: 40, weight: 900, ox: 0.5, oy: 0.5, color: '#ffe66d' }));
      if (saved) { this.tweens.add({ targets: c, scale: 1.15, duration: 400, ease: 'Back.out' }); burst(this, x, 480, 0x7dffb0, 24, 300); } else this.tweens.add({ targets: c, alpha: 0.5, duration: 600 });
    });
    const msg = d.out === this.pid ? 'Tu es éliminé·e… mais tu peux encore voter !' : `${this.playerName(d.out)} quitte la saison.`;
    this.put(text(this, W / 2, 860, msg, { size: 40, weight: 900, ox: 0.5, oy: 0.5, color: d.out === this.pid ? '#ff8a8a' : '#ffffff' }));
    Audio.sfx(this, 'applause', 0.7);
  }

  renderWinner() {
    const d = this.phaseData;
    const isQuiz = this.phase === 'podium';
    const winPid = isQuiz ? (d.ranking[0] && d.ranking[0].pid) : d.pid;
    this.heading(isQuiz ? 'Podium du Quiz Battle' : 'Grand·e gagnant·e !', '');
    if (winPid) {
      this.put(portrait(this, 'mp', W / 2, 400, 260, { key: this.pkey(winPid), label: this.playerName(winPid), color: '#ffe66d', labelSize: 40 }));
      this.put(this.add.image(W / 2, 240, 'ico_crown').setDisplaySize(110, 110));
    }
    d.ranking.slice(0, 8).forEach((r, i) => {
      this.put(text(this, W / 2, 640 + i * 42, `${i + 1}. ${r.name} — ${r.score.toLocaleString('fr-FR')} pts`, { size: 28, weight: i === 0 ? 900 : 600, ox: 0.5, oy: 0.5, color: i === 0 ? '#ffe66d' : '#ffffff' }));
    });
    const cf = confetti(this);
    this.time.delayedCall(5000, () => cf.stop());
    this.put(cf);
    Audio.sfx(this, 'applause_big', 0.8);
    Audio.sfx(this, 'jingle_victoire', 0.7);
    if (this.isHost()) this.put(button(this, W / 2, 1010, 460, 84, 'Retour au salon', () => this.sock.emit('mp:lobby')));
    else this.put(text(this, W / 2, 1010, 'L\'hôte peut relancer une partie', { size: 26, weight: 400, ox: 0.5, oy: 0.5, color: '#cbb8ea' }));
  }
}
