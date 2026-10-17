// Keyboard (AZERTY ZQSD + QWERTY WASD + arrows) and mouse look (pointer lock or drag).
export class Input {
  constructor(dom) {
    this.dom = dom;
    this.keys = new Set();
    this.pressed = new Set();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.wheel = 0;
    this.dragging = false;
    this.locked = false;
    this.enabled = true;
    this.lookEnabled = true;
    this.listeners = {};
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
      const k = this.code(e);
      if (!this.keys.has(k)) this.pressed.add(k);
      this.keys.add(k);
      if (['Space', 'ArrowUp', 'ArrowDown', 'Tab'].includes(k)) e.preventDefault();
      this.emit('key', k, e);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(this.code(e)));
    window.addEventListener('blur', () => this.keys.clear());
    dom.addEventListener('mousedown', (e) => {
      if (e.button === 0 || e.button === 2) this.dragging = true;
      this.emit('mousedown', e);
    });
    window.addEventListener('mouseup', () => { this.dragging = false; });
    window.addEventListener('mousemove', (e) => {
      if (this.locked || this.dragging) {
        this.mouseDX += e.movementX || 0;
        this.mouseDY += e.movementY || 0;
      }
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    dom.addEventListener('wheel', (e) => { this.wheel += Math.sign(e.deltaY); }, { passive: true });
    dom.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === dom;
      this.emit('lock', this.locked);
    });
    // touch: left half = move stick, right half = look
    this.touch = { move: null, look: null, mx: 0, my: 0 };
    dom.addEventListener('touchstart', (e) => {
      for (const t of e.changedTouches) {
        if (t.clientX < window.innerWidth / 2 && !this.touch.move) this.touch.move = { id: t.identifier, x: t.clientX, y: t.clientY };
        else if (!this.touch.look) this.touch.look = { id: t.identifier, x: t.clientX, y: t.clientY, t: performance.now() };
      }
    }, { passive: true });
    dom.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (this.touch.move && t.identifier === this.touch.move.id) {
          this.touch.mx = Math.max(-1, Math.min(1, (t.clientX - this.touch.move.x) / 60));
          this.touch.my = Math.max(-1, Math.min(1, (t.clientY - this.touch.move.y) / 60));
        } else if (this.touch.look && t.identifier === this.touch.look.id) {
          this.mouseDX += (t.clientX - this.touch.look.x) * 2;
          this.mouseDY += (t.clientY - this.touch.look.y) * 2;
          this.touch.look.x = t.clientX;
          this.touch.look.y = t.clientY;
        }
      }
    }, { passive: true });
    dom.addEventListener('touchend', (e) => {
      for (const t of e.changedTouches) {
        if (this.touch.move && t.identifier === this.touch.move.id) { this.touch.move = null; this.touch.mx = this.touch.my = 0; }
        if (this.touch.look && t.identifier === this.touch.look.id) {
          if (performance.now() - this.touch.look.t < 250) this.pressed.add('KeyE');
          this.touch.look = null;
        }
      }
    }, { passive: true });
  }

  code(e) {
    // Physical position for movement keys so both layouts work; letters for actions.
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) return e.code;
    if (e.key === 'z' || e.key === 'Z') return 'KeyW';
    if (e.key === 'q' || e.key === 'Q') return 'KeyA';
    return e.code;
  }

  on(ev, fn) { (this.listeners[ev] = this.listeners[ev] || []).push(fn); }
  emit(ev, ...a) { (this.listeners[ev] || []).forEach((f) => f(...a)); }

  down(k) { return this.enabled && this.keys.has(k); }

  hit(k) {
    if (!this.enabled) return false;
    if (this.pressed.has(k)) { this.pressed.delete(k); return true; }
    return false;
  }

  axis() {
    if (!this.enabled) return { x: 0, y: 0 };
    let x = 0;
    let y = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y -= 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    x += this.touch.mx;
    y -= this.touch.my;
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    return { x, y };
  }

  consumeMouse() {
    const d = { x: this.mouseDX, y: this.mouseDY, w: this.wheel };
    this.mouseDX = this.mouseDY = this.wheel = 0;
    return d;
  }

  endFrame() { this.pressed.clear(); }

  lock() {
    if (this.locked) return;
    try { const p = this.dom.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* not available */ }
  }

  unlock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }
}
