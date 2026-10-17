// Audio: WebAudio sound effects (buffers), streamed music with crossfade, positional ambience.
export class Audio {
  constructor() {
    this.ctx = null;
    this.buffers = new Map();
    this.loading = new Map();
    this.vol = { master: 0.9, music: 0.55, sfx: 0.8 };
    this.music = null;
    this.musicName = null;
    this.ambients = [];
    try {
      const saved = JSON.parse(localStorage.getItem('eh_audio') || 'null');
      if (saved) Object.assign(this.vol, saved);
    } catch (e) { /* ignore */ }
  }

  unlock() {
    if (!this.ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      this.ctx = new C();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.vol.master;
      this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.vol.sfx;
      this.sfxBus.connect(this.master);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.music && this.music.paused && this.wantMusic) this.music.play().catch(() => {});
  }

  saveVol() {
    try { localStorage.setItem('eh_audio', JSON.stringify(this.vol)); } catch (e) { /* ignore */ }
    if (this.master) this.master.gain.value = this.vol.master;
    if (this.sfxBus) this.sfxBus.gain.value = this.vol.sfx;
    if (this.music) this.music.volume = this.vol.music * this.vol.master * (this.music.base || 1);
    this.ambients.forEach((a) => a.update && a.update());
  }

  async buffer(name) {
    if (this.buffers.has(name)) return this.buffers.get(name);
    if (this.loading.has(name)) return this.loading.get(name);
    const p = (async () => {
      try {
        const res = await fetch(`assets/sfx/${name}.mp3`);
        const arr = await res.arrayBuffer();
        const buf = await new Promise((ok, ko) => this.ctx.decodeAudioData(arr, ok, ko));
        this.buffers.set(name, buf);
        return buf;
      } catch (e) {
        return null;
      }
    })();
    this.loading.set(name, p);
    return p;
  }

  preload(names) {
    if (!this.ctx) return Promise.resolve();
    return Promise.all(names.map((n) => this.buffer(n)));
  }

  sfx(name, vol = 1, rate = 1, pan = 0) {
    if (!this.ctx) return;
    const b = this.buffers.get(name);
    if (!b) { this.buffer(name); return; }
    const src = this.ctx.createBufferSource();
    src.buffer = b;
    src.playbackRate.value = rate;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    let node = src.connect(g);
    if (pan && this.ctx.createStereoPanner) {
      const p = this.ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      node = node.connect(p);
    }
    node.connect(this.sfxBus);
    src.start();
  }

  // Synthesised piano-ish note (used by the lobby piano, the music box and the cuckoo)
  tone(freq, dur = 1.2, vol = 0.35, type = 'piano') {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const out = this.ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    out.connect(this.sfxBus);
    const parts = type === 'box' ? [[1, 1, 'sine'], [4, 0.3, 'sine'], [6.1, 0.08, 'sine']] : type === 'bird' ? [[1, 1, 'sine'], [2, 0.15, 'triangle']] : [[1, 1, 'triangle'], [2, 0.35, 'sine'], [3, 0.12, 'sine'], [0.5, 0.15, 'sine']];
    for (const [mul, amp, wave] of parts) {
      const o = this.ctx.createOscillator();
      o.type = wave;
      o.frequency.value = freq * mul;
      if (type === 'bird') { o.frequency.setValueAtTime(freq * mul * 1.04, t); o.frequency.exponentialRampToValueAtTime(freq * mul, t + 0.08); }
      const g = this.ctx.createGain();
      g.gain.value = amp;
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
  }

  // Positional one-shot: volume falls off with distance from listener
  sfxAt(name, pos, listener, vol = 1, range = 14, rate = 1) {
    if (!listener) return this.sfx(name, vol, rate);
    const d = pos.distanceTo(listener.position);
    if (d > range) return;
    const v = vol * Math.pow(1 - d / range, 1.6);
    this.sfx(name, v, rate);
  }

  playMusic(name, fade = 1.6, base = 1) {
    if (this.musicName === name) return;
    this.musicName = name;
    this.wantMusic = true;
    const old = this.music;
    if (old) this.fadeEl(old, 0, fade, true);
    if (!name) { this.music = null; return; }
    const el = new window.Audio();
    const canOgg = el.canPlayType('audio/ogg; codecs="vorbis"');
    el.src = `assets/music/${name}.${canOgg ? 'ogg' : 'mp3'}`;
    el.loop = true;
    el.base = base;
    el.volume = 0;
    el.play().catch(() => {});
    this.music = el;
    this.fadeEl(el, this.vol.music * this.vol.master * base, fade);
  }

  fadeEl(el, to, dur, stop = false) {
    const from = el.volume;
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / (dur * 1000));
      el.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k < 1) requestAnimationFrame(step);
      else if (stop) { el.pause(); el.src = ''; }
    };
    step();
  }

  duck(on) {
    if (!this.music) return;
    this.fadeEl(this.music, this.vol.music * this.vol.master * (this.music.base || 1) * (on ? 0.35 : 1), 0.4);
  }

  // Looping ambience attached to a world point (sea, fountain...). Call updateAmbient each frame.
  ambient(name, pos, range = 20, vol = 0.6) {
    const el = new window.Audio();
    const canOgg = el.canPlayType('audio/ogg; codecs="vorbis"');
    el.src = `assets/music/${name}.${canOgg ? 'ogg' : 'mp3'}`;
    el.loop = true;
    el.volume = 0;
    const a = { el, pos, range, vol, playing: false };
    this.ambients.push(a);
    return a;
  }

  updateAmbient(listener) {
    for (const a of this.ambients) {
      const d = a.pos ? a.pos.distanceTo(listener) : 0;
      const k = a.pos ? Math.max(0, 1 - d / a.range) : 1;
      const v = a.vol * k * k * this.vol.sfx * this.vol.master;
      if (v > 0.002 && !a.playing) { a.el.play().catch(() => {}); a.playing = true; }
      if (v <= 0.002 && a.playing) { a.el.pause(); a.playing = false; }
      a.el.volume = Math.min(1, v);
    }
  }
}
