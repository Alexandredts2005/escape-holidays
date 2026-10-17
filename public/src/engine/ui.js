// DOM user interface: HUD, prompts, dialogue, notes, toasts, menus, timers.
const $ = (id) => document.getElementById(id);

export class UI {
  constructor(game) {
    this.game = game;
    this.portraits = {};
    this.dialogOpen = false;
    this.noteOpen = false;
    this.speed = 42;
    document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => this.closeScreens()));
    $('note').addEventListener('click', () => this.closeNote());
    $('dialog').addEventListener('click', () => this.advance());
    $('inspect-back').addEventListener('click', () => this.game.exitInspect());
  }

  show(id, on = true) { $(id).classList.toggle('hidden', !on); }

  hud(on) { this.show('hud', on); }

  objective(text) {
    $('objective-text').textContent = text;
    const o = $('objective');
    o.style.animation = 'none';
    void o.offsetWidth;
    o.style.animation = 'bump .6s';
  }

  prompt(text, key = 'E') {
    const p = $('prompt');
    if (!text) { p.classList.add('hidden'); this.lastPrompt = null; return; }
    if (this.lastPrompt === text + key) return;
    this.lastPrompt = text + key;
    p.querySelector('kbd').textContent = key;
    p.querySelector('span').textContent = text;
    p.classList.remove('hidden');
  }

  crosshair(on) { this.show('crosshair', on); }

  counters({ biscuits, ducks, time }) {
    if (biscuits !== undefined) { const b = $('c-biscuit').querySelector('b'); if (b.textContent !== String(biscuits)) { b.textContent = biscuits; this.bump('c-biscuit'); } }
    if (ducks !== undefined) { const b = $('c-duck').querySelector('b'); const t = `${ducks}/10`; if (b.textContent !== t) { b.textContent = t; this.bump('c-duck'); } }
    if (time !== undefined) $('c-time').querySelector('b').textContent = time;
  }

  bump(id) {
    const e = $(id);
    e.classList.remove('bump');
    void e.offsetWidth;
    e.classList.add('bump');
  }

  toast(text, { icon = null, cls = '' } = {}) {
    const t = document.createElement('div');
    t.className = 'toast ' + cls;
    if (icon) { const im = document.createElement('img'); im.src = icon; t.appendChild(im); }
    const s = document.createElement('span');
    s.innerHTML = text;
    t.appendChild(s);
    $('toasts').appendChild(t);
    setTimeout(() => t.remove(), 4200);
  }

  inventory(items, icons) {
    const inv = $('inventory');
    inv.innerHTML = '';
    for (const it of items) {
      const d = document.createElement('div');
      d.className = 'slot' + (it.isNew ? ' new' : '');
      const im = document.createElement('img');
      im.src = icons[it.id] || '';
      d.appendChild(im);
      if (it.count > 1) { const c = document.createElement('span'); c.className = 'count'; c.textContent = '×' + it.count; d.appendChild(c); }
      const tip = document.createElement('span');
      tip.className = 'tip';
      tip.textContent = it.name;
      d.appendChild(tip);
      d.addEventListener('click', () => this.game.inspectItem(it.id));
      inv.appendChild(d);
      it.isNew = false;
    }
  }

  // ------------------------------------------------------------------ dialogue
  dialog(lines) {
    return new Promise((resolve) => {
      this.dialogOpen = true;
      this.lines = lines.slice();
      this.dialogDone = resolve;
      this.show('dialog', true);
      this.game.audio.duck(true);
      this.nextLine();
    });
  }

  nextLine() {
    const ln = this.lines.shift();
    if (!ln) {
      this.show('dialog', false);
      this.dialogOpen = false;
      this.speaker = null;
      this.game.audio.duck(false);
      const d = this.dialogDone;
      this.dialogDone = null;
      if (d) d();
      return;
    }
    const who = ln.who || '';
    this.speaker = who;
    const p = this.portraits[ln.portrait || who];
    $('dialog-portrait').style.backgroundImage = p ? `url(${p})` : 'none';
    $('dialog-portrait').style.display = p ? 'block' : 'none';
    $('dialog-name').textContent = ln.name || who;
    this.full = ln.text;
    this.typed = 0;
    $('dialog-text').innerHTML = '';
    clearInterval(this.typeTimer);
    if (ln.sfx) this.game.audio.sfx(ln.sfx, 0.7);
    this.typeTimer = setInterval(() => {
      this.typed += 2;
      $('dialog-text').innerHTML = this.full.slice(0, this.typed);
      if (this.typed % 6 === 0 && ln.blip !== false) this.game.audio.sfx('tick', 0.08, 1.6 + Math.random() * 0.3);
      if (this.typed >= this.full.length) clearInterval(this.typeTimer);
    }, 1000 / this.speed);
  }

  advance() {
    if (!this.dialogOpen) return false;
    if (this.typed < this.full.length) {
      this.typed = this.full.length;
      clearInterval(this.typeTimer);
      $('dialog-text').innerHTML = this.full;
    } else this.nextLine();
    return true;
  }

  // ------------------------------------------------------------------ notes
  note(title, html) {
    return new Promise((resolve) => {
      this.noteOpen = true;
      $('note-title').textContent = title;
      $('note-text').innerHTML = html;
      this.show('note', true);
      this.noteDone = resolve;
      this.game.audio.sfx('book_open', 0.6);
    });
  }

  closeNote() {
    if (!this.noteOpen) return false;
    this.noteOpen = false;
    this.show('note', false);
    this.game.audio.sfx('book_close', 0.5);
    const d = this.noteDone;
    this.noteDone = null;
    if (d) d();
    return true;
  }

  subtitle(html, dur = 4) {
    const s = $('subtitle');
    s.innerHTML = html;
    s.classList.remove('hidden');
    clearTimeout(this.subT);
    this.subT = setTimeout(() => s.classList.add('hidden'), dur * 1000);
  }

  fade(on, ms = 600) {
    $('fade').style.transitionDuration = ms + 'ms';
    $('fade').classList.toggle('on', on);
    return new Promise((r) => setTimeout(r, ms));
  }

  timer(label, secs) {
    if (label === null) { this.show('timer', false); return; }
    this.show('timer', true);
    $('timer-label').textContent = label;
    const m = Math.floor(Math.max(0, secs) / 60);
    const s = Math.floor(Math.max(0, secs) % 60);
    $('timer-value').textContent = `${m}:${String(s).padStart(2, '0')}`;
    $('timer').classList.toggle('danger', secs < 30);
  }

  inspectBar(title) {
    if (title === null) { this.show('inspect-bar', false); return; }
    $('inspect-title').textContent = title;
    this.show('inspect-bar', true);
  }

  // ------------------------------------------------------------------ screens / menus
  menu(containerId, items) {
    const c = $(containerId);
    c.innerHTML = '';
    for (const it of items) {
      if (!it) continue;
      const b = document.createElement('button');
      b.innerHTML = it.label + (it.sub ? `<small>${it.sub}</small>` : '');
      if (it.cls) b.className = it.cls;
      b.addEventListener('click', () => { this.game.audio.unlock(); this.game.audio.sfx('click', 0.6); it.fn(); });
      c.appendChild(b);
    }
  }

  screen(id, on = true) {
    this.show(id, on);
    this.game.onScreenChange();
  }

  closeScreens() {
    ['screen-journal', 'screen-wardrobe', 'screen-options'].forEach((s) => this.show(s, false));
    if (this.returnTo) { const r = this.returnTo; this.returnTo = null; this.show(r, true); }
    this.game.onScreenChange();
  }

  anyScreen() {
    return [...document.querySelectorAll('.screen')].some((e) => !e.classList.contains('hidden'));
  }

  loading(pct, text) {
    $('load-fill').style.width = Math.round(pct * 100) + '%';
    if (text) $('load-text').textContent = text;
  }
}
