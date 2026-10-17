// Shared helpers for areas: pickups, collectibles, readable notes, locked doors, inspect shots.
import * as THREE from 'three';
import { ITEMS, duck, biscuit } from './items.js';

export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// camera shot for a close-up: look at `pos`, camera placed along `normal` (pointing towards the viewer)
export function shotAt(pos, normal, dist = 0.7, up = 0.12) {
  const p = new THREE.Vector3(...pos);
  const n = new THREE.Vector3(...normal).normalize();
  return { cam: p.clone().addScaledVector(n, dist).add(new THREE.Vector3(0, up, 0)), look: p };
}

// world item that goes into the inventory
export function pickup(game, { id, item, n = 1, obj, pos, label, flag, r = 1.6, text, onTake, visible, dy }) {
  const f = flag || 'got_' + id;
  if (obj) obj.userData.dynamic = true;
  const def = game.interact.add({
    pos, r, obj, dy,
    label: label || `Prendre : ${ITEMS[item].name}`,
    visible: () => !game.state.flag(f) && (!visible || visible()),
    use: (g) => {
      g.state.set(f);
      if (obj) { g.fx.sparkle(obj.getWorldPosition(new THREE.Vector3()), 0xffffff, 14); obj.visible = false; }
      g.player.gesture('pick-up', 0.7);
      g.audio.sfx('pickup', 0.6);
      g.give(item, n, { text });
      if (onTake) onTake(g);
      g.story.refresh();
    },
  });
  game.story.onApply(() => { if (game.state.flag(f) && obj) obj.visible = false; });
  return def;
}

// golden duck collectible (10 in the game)
export function duckSpot(game, b, id, x, y, z, rot = 0) {
  const d = duck(0xffcf3a, 1.3);
  d.position.set(x, y, z);
  d.rotation.y = rot;
  d.userData.dynamic = true;
  b.root.add(d);
  const base = y;
  game.updaters.push((dt, t) => { if (d.visible) { d.position.y = base + Math.abs(Math.sin(t * 2 + x)) * 0.03; } });
  game.interact.add({
    pos: [x, y + 0.15, z], r: 1.5, obj: d, dy: 3,
    label: 'Ramasser le canard doré',
    visible: () => !game.state.s.ducks.includes(id),
    use: (g) => { d.visible = false; g.player.gesture('pick-up', 0.7); g.addDuck(id, d.position.clone()); },
  });
  game.story.onApply(() => { if (game.state.s.ducks.includes(id)) d.visible = false; });
  return d;
}

// biscuits for Gustave (the hint currency)
export function biscuitSpot(game, b, id, x, y, z, n = 1, label = null) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) { const c = biscuit(); c.position.set(i * 0.05, i * 0.024, i * 0.03); c.rotation.y = i; g.add(c); }
  g.position.set(x, y, z);
  g.userData.dynamic = true;
  b.root.add(g);
  game.interact.add({
    pos: [x, y + 0.1, z], r: 1.5, obj: g, dy: 3,
    label: label || (n > 1 ? `Prendre les ${n} biscuits` : 'Prendre le biscuit'),
    visible: () => !game.state.s.biscuitsFound.includes(id),
    use: (gm) => { g.visible = false; gm.player.gesture('pick-up', 0.7); gm.addBiscuits(n, id); },
  });
  game.story.onApply(() => { if (game.state.s.biscuitsFound.includes(id)) g.visible = false; });
  return g;
}

// something to read: opens a paper note, and records a clue in the journal
export function readable(game, { pos, label = 'Lire', title, html, clue, obj, r = 1.6, onRead, visible, dy }) {
  return game.interact.add({
    pos, r, obj, label, visible, dy,
    use: async (g) => {
      if (clue) g.state.clue(clue);
      g.audio.sfx('book_flip', 0.5);
      await g.ui.note(title, typeof html === 'function' ? html(g) : html);
      if (onRead) onRead(g);
    },
  });
}

// door locked until `flag` is set; unlocking with `key` (consumed) sets the flag. Once unlocked it opens and stays open.
export function lockedDoor(game, door, { flag, key, consume = true, label = 'Porte', locked, unlockText, onOpen, pos, canUnlock }) {
  const p = pos || [door.center.x, door.center.y, door.center.z];
  const def = game.interact.add({
    pos: p, r: 1.9,
    label: () => (game.state.flag(flag) ? null : (key && game.has(key) ? `Déverrouiller : ${label}` : label)),
    use: async (g) => {
      if (key && g.has(key) && (!canUnlock || canUnlock(g))) {
        if (consume) g.take(key);
        g.audio.sfx('keys', 0.7);
        g.audio.sfx('metal_latch', 0.6);
        g.state.set(flag);
        door.setOpen(true);
        if (unlockText) g.ui.toast(unlockText, { icon: g.icons.items[key] });
        if (onOpen) await onOpen(g);
        g.story.refresh();
        g.save();
        return;
      }
      g.audio.sfx('metal_tap', 0.5);
      door.pivot.rotation.y = door.baseRot + 0.03;
      setTimeout(() => { door.pivot.rotation.y = door.baseRot + door.angle; }, 120);
      if (typeof locked === 'function') await locked(g);
      else if (locked) await g.say(Array.isArray(locked) ? locked : [{ who: 'player', text: locked }]);
    },
  });
  game.story.onApply(() => { if (game.state.flag(flag)) door.setOpen(true, true); });
  return def;
}

// simple open/close door with no lock
export function freeDoor(game, door, label = 'la porte') {
  game.interact.add({
    pos: [door.center.x, door.center.y, door.center.z], r: 1.7,
    label: () => (door.open ? `Fermer ${label}` : `Ouvrir ${label}`),
    use: () => door.setOpen(!door.open),
  });
}

// flag a whole object as dynamic (excluded from static merging)
export function dyn(o) { o.userData.dynamic = true; return o; }

// spin a group towards a target Y rotation smoothly
export function spinner(game, obj, speed = 8) {
  obj.userData.targetRot = obj.rotation.y;
  game.updaters.push((dt) => {
    const t = obj.userData.targetRot;
    if (Math.abs(obj.rotation.y - t) > 0.001) obj.rotation.y += (t - obj.rotation.y) * (1 - Math.exp(-dt * speed));
  });
  return obj;
}
