// Music (crossfaded BGM) and sound effects.
import { G } from './state.js';
import { need, musicAsset } from './assets.js';

export const Audio = {
  current: null,
  currentId: null,
  token: 0,

  async music(scene, id, { loop = true, volume = 1, fade = 900 } = {}) {
    if (this.currentId === id && this.current && this.current.isPlaying) return this.current;
    const tok = ++this.token;
    await need(scene, [musicAsset(id)]);
    if (tok !== this.token) return null;
    const old = this.current;
    if (old) this.fadeOut(scene, old, fade);
    const snd = scene.sound.add('mus_' + id, { loop, volume: 0 });
    snd.baseVolume = volume;
    snd.play();
    scene.tweens.add({ targets: snd, volume: volume * G.settings.music, duration: fade });
    this.current = snd;
    this.currentId = id;
    return snd;
  },

  fadeOut(scene, snd, fade = 700) {
    if (!snd) return;
    try {
      scene.tweens.add({
        targets: snd, volume: 0, duration: fade,
        onComplete: () => { snd.stop(); snd.destroy(); },
      });
    } catch (e) {
      snd.stop();
    }
  },

  stop(scene, fade = 700) {
    this.token++;
    if (this.current) this.fadeOut(scene, this.current, fade);
    this.current = null;
    this.currentId = null;
  },

  duck(scene, amount = 0.35, ms = 400) {
    if (!this.current) return;
    scene.tweens.add({ targets: this.current, volume: this.current.baseVolume * G.settings.music * amount, duration: ms });
  },

  unduck(scene, ms = 600) {
    if (!this.current) return;
    scene.tweens.add({ targets: this.current, volume: this.current.baseVolume * G.settings.music, duration: ms });
  },

  refreshVolume() {
    if (this.current) this.current.setVolume(this.current.baseVolume * G.settings.music);
  },

  sfx(scene, key, volume = 1, rate = 1) {
    if (!scene.cache.audio.exists(key)) return;
    scene.sound.play(key, { volume: volume * G.settings.sfx, rate });
  },
};
