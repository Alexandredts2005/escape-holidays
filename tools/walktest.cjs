// Walkability test: steers the real character controller (W key + camera yaw) along the main routes
// and reports any spot where the player gets stuck. Usage: node tools/walktest.cjs [baseUrl]
let pw;
try { pw = require(process.env.PW || 'playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const base = process.argv[2] || 'http://localhost:8123/';
const ROUTES = {
  'ponton → hall (intro)': { intro: true, start: [0, 0.4, 70], pts: [[0, 47], [0, 30], [0, 10], [0, -1], [3.5, -3], [3.7, -8.5], [1.2, -14.5], [0, -16.5], [0, -19.5]] },
  'plage': { start: [0, 0.2, 30], pts: [[-14, 33], [-30, 30], [-46, 36], [-20, 26], [10, 30], [20, 33], [42, 34], [8, 25], [0, 20]] },
  'hall → escalier → suite → balcon': { start: [0, 0.1, -19.5], pts: [[3.2, -24], [5.2, -27.6], [6.7, -28.2], [6.7, -36.6], [6, -38], [-8, -38], [-16, -38], [-16, -35], [-16, -30], [-14, -22], [-16, -17.5], [-16, -15]] },
  'suite → escalier → hall (descente)': { start: [-16, 4.6, -30], pts: [[-16, -35], [-16, -38], [-6, -38], [6.7, -37.8], [6.7, -36.4], [6.7, -28.4], [5, -26], [0, -20]] },
  'couloir → bureau': { start: [-8, 4.6, -38], pts: [[8, -38], [16, -38], [16, -35], [16, -30], [12, -26], [20, -20]] },
  'jardin ouest → potager': { start: [0, 0.1, -3], pts: [[-11, -8], [-20, -8], [-30, -10], [-38, -16], [-46, -22.5], [-36, -2], [-33, 1], [-25, 8], [-20, 10]] },
  'jardin est → piscine → bar': { start: [0, 0.1, -3], pts: [[11, -8], [20, -8], [27, -9], [29.6, -14.5], [29.6, -19.5], [29, -25.5], [41, -25.5], [46.4, -24], [46.4, -15], [51, -17], [46.4, -9.6], [30, -9.6]] },
  'hall → spa': { start: [0, 0.1, -20], pts: [[-6, -26], [-10, -26], [-12, -24], [-12, -30], [-15, -20], [-20, -20], [-15, -20], [-15, -28], [-20, -28], [-15, -28], [-15, -36], [-19, -36]] },
  'hall → restaurant → cuisine': { start: [0, 0.1, -20], pts: [[6, -21], [10, -21], [14, -18], [20, -24], [20, -27], [20, -30], [12, -31], [12, -36.4], [10, -37.5], [12, -31], [21.5, -32], [21.5, -37]] },
};
(async () => {
  const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit'] });
  const page = await browser.newPage({ viewport: { width: 320, height: 180 } });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await page.goto(base);
  await page.waitForFunction(() => window.game && window.game.mode === 'title', null, { timeout: 240000 });
  let fails = 0;
  for (const [name, r] of Object.entries(ROUTES)) {
    const res = await page.evaluate(async (r) => {
      const g = window.game;
      const st = g.state;
      g.started = true;
      st.reset();
      if (!r.intro) for (const f of ['intro_done', 'suite_open', 'hall_open', 'spa_open', 'resto_open', 'kitchen_open', 'office_open', 'sauna_open', 'balcony_open', 'cold_done']) st.set(f);
      g.ui.screen('screen-title', false);
      g.story.apply();
      if (!r.intro) { for (const id of ['suite', 'spa', 'resto', 'kitchen', 'office', 'sauna', 'bath', 'pantry', 'cold', 'main_l', 'main_r', 'vestiaire', 'hammam']) if (g.doors[id]) g.doors[id].setOpen(true, true); }
      g.mode = 'play';
      g.rig.follow(true);
      g.player.teleport(...r.start, Math.PI);
      const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
      const out = [];
      for (const [tx, tz] of r.pts) {
        let best = 1e9; let stuckT = 0; let last = performance.now();
        while (true) {
          const p = g.player.position;
          const dx = tx - p.x; const dz = tz - p.z;
          const d = Math.hypot(dx, dz);
          if (d < 0.6) break;
          // forward = (-sin(yaw), -cos(yaw)) → yaw towards the target
          g.rig.yaw = Math.atan2(-dx, -dz);
          g.input.keys.add('KeyW');
          await sleep(60);
          const now = performance.now();
          if (d < best - 0.05) { best = d; stuckT = 0; } else stuckT += now - last;
          last = now;
          if (stuckT > 4000) { out.push({ stuck: [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2)], target: [tx, tz] }); g.player.teleport(tx, p.y + 0.3, tz); break; }
        }
      }
      g.input.keys.delete('KeyW');
      return out;
    }, r);
    if (res.length) fails += res.length;
    console.log(`${res.length ? '✘' : '✔'} ${name}${res.length ? '  ' + JSON.stringify(res) : ''}`);
  }
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
