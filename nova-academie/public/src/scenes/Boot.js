// Preloads the always-needed assets (FX, UI, SFX, data) with a loading screen.
import { G, W, H } from '../core/state.js';
import { THEATRE } from '../data/theatre.js';

const FX = ['glow', 'dot', 'star', 'confetti', 'beam', 'vignette', 'floorglow', 'crowd0', 'crowd1', 'ring', 'trail', 'panel', 'panel_light',
  'btn', 'btn2', 'btn_off', 'btn_ok', 'btn_bad', 'logo', 'circle', 'circle_inv',
  'gem_pink', 'gem_cyan', 'gem_gold', 'gem_violet', 'gem_green', 'gem_white',
  'arrow_pink', 'arrow_cyan', 'arrow_gold', 'arrow_violet', 'arrow_grey',
  'ico_voix', 'ico_danse', 'ico_scene', 'ico_culture', 'ico_pop', 'ico_forme', 'ico_star', 'ico_lock', 'ico_check', 'ico_crown', 'ico_mic', 'ico_vote'];
const SFX = ['click', 'hover', 'confirm', 'wrong', 'correct', 'select', 'open', 'close', 'tick', 'sparkle', 'pluck', 'drop', 'whoosh', 'question',
  'bong', 'toggle', 'jingle_win', 'jingle_good', 'jingle_fail', 'hit_drama', 'hit_drama2', 'jingle_fun', 'jingle_quiz', 'hit_reveal', 'jingle_oops', 'jingle_bravo'];
const ONESHOT = ['applause', 'applause_big', 'applause_small', 'jingle_prime', 'jingle_victoire', 'jingle_elimine', 'sting_verdict'];

export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const bar = this.add.rectangle(W / 2 - 400, H / 2 + 60, 2, 16, 0xff5cb4).setOrigin(0, 0.5);
    this.add.rectangle(W / 2, H / 2 + 60, 804, 22).setStrokeStyle(2, 0xff8ce6, 0.7);
    const t = this.add.text(W / 2, H / 2 - 20, 'NOVA Académie', { fontFamily: 'Montserrat, Poppins', fontSize: '72px', fontStyle: '900', color: '#ffffff' }).setOrigin(0.5);
    const sub = this.add.text(W / 2, H / 2 + 120, 'Chargement…', { fontFamily: 'Poppins', fontSize: '26px', color: '#ffb3e6' }).setOrigin(0.5);
    this.load.on('progress', (v) => { bar.width = 800 * v; sub.setText(`Chargement… ${Math.round(v * 100)} %`); });
    FX.forEach((k) => this.load.image(k, `assets/fx/${k}.png`));
    SFX.forEach((k) => this.load.audio(k, `assets/sfx/${k}.mp3`));
    ONESHOT.forEach((k) => this.load.audio(k, [`assets/music/${k}.ogg`, `assets/music/${k}.mp3`]));
    this.load.json('cast', 'data/cast.json');
    this.load.json('sprites', 'data/sprites.json');
    this.load.json('quiz', 'data/quiz.json');
    this.load.json('songs', 'assets/music/charts/index.json');
    this.load.image('bg_chateau_nuit', 'assets/bg/chateau_nuit.jpg');
    void t;
  }

  create() {
    G.cast = this.cache.json.get('cast');
    G.sprites = this.cache.json.get('sprites');
    G.quiz = this.cache.json.get('quiz');
    G.songs = this.cache.json.get('songs');
    G.theatre = THEATRE;
    const el = document.getElementById('boot');
    if (el) el.remove();
    this.scene.start('Title');
  }
}
