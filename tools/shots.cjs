// Headless screenshots: node tools/shots.cjs <outdir> [shotsJSON]
// shots: [{name, pos:[x,y,z], look:[x,y,z]} | {name, player:[x,y,z,facing], wait}]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const out = process.argv[2] || 'shots';
const shots = JSON.parse(process.argv[3] || '[]');
const fs = require('fs');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: +(process.env.W || 960), height: +(process.env.H || 540) } });
  const logs = [];
  page.on('console', (m) => { if (m.type() !== 'debug') logs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message + '\n' + e.stack));
  const t0 = Date.now();
  await page.goto('http://localhost:8123/' + (process.env.Q || ''));
  try {
    await page.waitForFunction(() => window.game && window.game.mode === 'title', null, { timeout: 180000 });
  } catch (e) { console.log(logs.join('\n')); await page.screenshot({ path: out + '/fail.png' }); await browser.close(); process.exit(1); }
  console.log('boot ms', Date.now() - t0);
  if (process.env.TITLE) { await page.waitForTimeout(1500); await page.screenshot({ path: out + '/title.png' }); }
  if (process.env.SCRIPT) await page.evaluate((s) => { (0, eval)(s); return 1; }, fs.readFileSync(process.env.SCRIPT, 'utf8'));
  else await page.evaluate(() => { game.start(false); return 1; });
  await page.waitForTimeout(2500);
  for (const s of shots) {
    await page.evaluate((s) => {
      const g = window.game;
      if (s.eval) (0, eval)(s.eval);
      if (s.player) { g.mode = 'play'; g.rig.follow(true); g.player.teleport(...s.player); g.rig.yaw = (s.player[3] ?? 0) + Math.PI; if (s.pitch !== undefined) g.rig.pitch = s.pitch; if (s.dist) g.rig.targetDist = g.rig.dist = s.dist; }
      if (s.pos) { g.mode = 'cut'; g.rig.mode = 'shot'; g.rig.shot = null; g.rig.cam.position.set(...s.pos); g.rig.cam.lookAt(...s.look); if (s.fov) { g.rig.cam.fov = s.fov; g.rig.cam.updateProjectionMatrix(); } }
      return 1;
    }, s);
    await page.waitForTimeout(s.wait || 900);
    await page.screenshot({ path: `${out}/${s.name}.png`, timeout: 180000 });
  }
  const fps = await page.evaluate(() => new Promise((r) => { let n = 0; const t = performance.now(); const f = () => { n++; if (performance.now() - t < 2000) requestAnimationFrame(f); else r(n / 2); }; requestAnimationFrame(f); }));
  const info = await page.evaluate(() => new Promise((res) => { const r = window.game.renderer.r; r.info.autoReset = false; r.info.reset(); requestAnimationFrame(() => { const o = { calls: r.info.render.calls, tris: r.info.render.triangles, geos: r.info.memory.geometries, tex: r.info.memory.textures, stats: window.game.stats }; r.info.autoReset = true; res(o); }); }));
  console.log('fps', fps, JSON.stringify(info));
  console.log(logs.slice(0, 40).join('\n'));
  await browser.close();
})();
