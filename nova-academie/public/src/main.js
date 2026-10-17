import { G, W, H } from './core/state.js';
import { Boot } from './scenes/Boot.js';
import { Title } from './scenes/Title.js';
import { Creator } from './scenes/Creator.js';
import { Story } from './scenes/Story.js';
import { Planner } from './scenes/Planner.js';
import { Rhythm } from './scenes/Rhythm.js';
import { Quiz } from './scenes/Quiz.js';
import { Theatre } from './scenes/Theatre.js';
import { Souffle } from './scenes/Souffle.js';
import { Verdict } from './scenes/Verdict.js';
import { Pause } from './scenes/Pause.js';
import { Credits } from './scenes/Credits.js';
import { Multi } from './scenes/Multi.js';

async function start() {
  try {
    await Promise.race([
      Promise.all(['400 20px Poppins', '600 20px Poppins', '800 20px Poppins', '900 20px Montserrat', '20px Bebas', '20px Pacifico']
        .map((f) => document.fonts.load(f))),
      new Promise((r) => setTimeout(r, 4000)),
    ]);
  } catch (e) { /* fonts optional */ }
  G.game = new Phaser.Game({
    type: Phaser.WEBGL,
    parent: 'game',
    width: W,
    height: H,
    backgroundColor: '#0b0614',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    dom: { createContainer: true },
    audio: { disableWebAudio: false },
    input: { activePointers: 4 },
    render: { antialias: true, powerPreference: 'high-performance' },
    scene: [Boot, Title, Creator, Story, Planner, Rhythm, Quiz, Theatre, Souffle, Verdict, Credits, Multi, Pause],
  });
  window.NOVA = G;
}

start();
