// Automated full playthrough: solves every puzzle in order through the real interactables and devices.
// Usage: node tools/playtest.cjs [baseUrl]   (serve public/ first, e.g. python3 -m http.server 8123 -d public)
let pw;
try { pw = require(process.env.PW || 'playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const { chromium } = pw;
const base = process.argv[2] || 'http://localhost:8123/';
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 400, height: 225 } });
  const errors = [];
  page.on('pageerror', (e) => { errors.push(e.message); console.log('PAGEERROR', e.message, (e.stack || '').split('\n').slice(1, 3).join(' | ')); });
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) { errors.push(m.text()); console.log('ERR', m.text().slice(0, 200)); } });
  await page.goto(base);
  await page.waitForFunction(() => window.game && window.game.mode === 'title', null, { timeout: 240000 });
  await page.evaluate(() => {
    const g = window.game;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    setInterval(() => { if (g.ui.dialogOpen) g.ui.advance(); if (g.ui.noteOpen) g.ui.closeNote(); }, 40);
    window.T = {
      sleep,
      label: (d) => g.interact.label(d),
      find(sub) { return g.interact.list.find((d) => { const l = g.interact.label(d); return l && l.includes(sub); }); },
      async idle(max = 60000) { const t0 = Date.now(); while ((g.mode !== 'play' || g.ui.dialogOpen || g.ui.noteOpen) && Date.now() - t0 < max) await sleep(50); await sleep(100); },
      async use(sub) {
        await T.idle();
        const d = T.find(sub);
        if (!d) throw new Error('interactable not found: ' + sub);
        g.player.teleport(d.pos.x, Math.max(d.pos.y - 1.1, d.pos.y > 3 ? 4.55 : 0.1), d.pos.z + 0.01);
        g.interact.current = d;
        if (d.inspect) await g.enterInspect(d); else await d.use(g, d);
        await sleep(150);
        return d;
      },
      async inspect(sub) { await T.use(sub); await sleep(300); if (g.mode !== 'inspect') throw new Error('not in inspect: ' + sub); return g.clicker.items; },
      async click(pred, n = 1, dir = 1) {
        for (let i = 0; i < n; i++) {
          const it = typeof pred === 'number' ? g.clicker.items[pred] : g.clicker.items.find((x) => x.tip === pred);
          if (!it) throw new Error('clickable not found: ' + pred + ' among ' + g.clicker.items.map((x) => x.tip).join(','));
          await it.onClick(dir, it);
          await sleep(120);
        }
      },
      async flag(k, max = 60000) { const t0 = Date.now(); while (!g.state.flag(k) && Date.now() - t0 < max) await sleep(60); if (!g.state.flag(k)) throw new Error('flag never set: ' + k); },
      async back() { if (g.mode === 'inspect') g.exitInspect(); await T.idle(); },
    };
  });
  const run = async (name, code) => {
    const t0 = Date.now();
    const r = await page.evaluate(`(async () => { try { ${code}; return 'ok'; } catch (e) { return 'FAIL: ' + e.message; } })()`);
    const st = await page.evaluate(() => ({ inv: { ...game.state.s.inv }, b: game.state.s.biscuits, d: game.state.s.ducks.length, mode: game.mode, obj: document.getElementById('objective-text').textContent }));
    console.log(`${r === 'ok' ? '✔' : '✘'} ${name} (${((Date.now() - t0) / 1000).toFixed(1)}s) ${r === 'ok' ? '' : r} | inv=${JSON.stringify(st.inv)} biscuits=${st.b} ducks=${st.d} mode=${st.mode} | obj: ${st.obj}`);
    if (r !== 'ok') { await browser.close(); process.exit(1); }
  };
  await run('intro', `game.start(false); await T.sleep(1500); const t0 = Date.now(); while (game.mode !== 'play' && Date.now() - t0 < 120000) await T.sleep(100); game.player.teleport(0, 0.1, -22); await T.flag('intro_done', 180000); await T.idle()`);
  await run('suite: Gustave', `await T.use('biscuit sur l\\'oreiller'); await T.use('chatière'); await T.flag('gustave', 120000); await T.idle()`);
  await run('suite: shower', `await T.use('douche'); await T.flag('mirror', 20000)`);
  await run('suite: minibar 463', `await T.inspect('cadenas du minibar'); await T.click(0, 4); await T.click(1, 6); await T.click(2, 3); await T.flag('minibar'); await T.idle()`);
  await run('suite: loot minibar', `await T.use('biscuits du minibar'); await T.use('cuillère')`);
  await run('suite: safe 1479', `await T.use('penderie'); await T.sleep(300); await T.inspect('coffre-fort'); for (const k of ['1','4','7','9']) await T.click('Touche ' + k); await T.flag('safe'); await T.idle(); await T.use('étoile d\\'or'); await T.use('Clé de secours')`);
  await run('suite: exit', `await T.use('Porte de la suite'); await T.flag('suite_open')`);
  await run('hall: piano', `await T.inspect('piano'); for (const n of ['Sol','Mi','Do','Mi','Ré','Sol']) await T.click(n); await T.flag('piano'); await T.sleep(1500); await T.idle(); await T.use('Clé du hall'); await T.use('Porte principale'); await T.flag('hall_open')`);
  await run('garden: statues', `const turns = { dauphin: 2, tortue: 2, flamant: 1, lion: 3 }; const nm = { dauphin: 'du dauphin', tortue: 'de la tortue', flamant: 'du flamant', lion: 'du lion' }; for (const [k, n] of Object.entries(turns)) for (let i = 0; i < n; i++) await T.use('statue ' + nm[k]); await T.flag('fountain'); await T.idle(); await T.use('étoile au fond'); await T.flag('star2')`);
  await run('garden: pelican', `await T.use('cuillère au pélican'); await T.flag('got_sardine'); await T.idle()`);
  await run('garden: tomato', `await T.use('Cueillir une tomate'); await T.flag('got_tomato')`);
  await run('garden: net + pool key', `await T.inspect('cadenas de l\\'épuisette'); await T.click(1, 1); await T.click(2, 2); await T.flag('net_unlocked'); await T.idle(); await T.use('Prendre l\\'épuisette'); await T.use('Repêcher'); await T.flag('got_key_spa'); await T.idle()`);
  await run('spa: door + hammam 2-7-5', `await T.use('Porte du Spa'); await T.flag('spa_open'); await T.inspect('vannes du hammam'); await T.click(0, 2); await T.click(1, 7); await T.click(2, 5); await T.flag('hammam'); await T.idle()`);
  await run('spa: locker 9', `const p = T.use('Utiliser un casier'); await T.sleep(400); [...document.querySelectorAll('#pause-menu button')].find((b) => b.textContent === 'Casier 9').click(); await p; await T.flag('locker9'); await T.use('Clé du sauna'); await T.use('biscuits du casier 9')`);
  await run('spa: sauna (timed)', `await T.use('Déverrouiller le sauna'); await T.flag('sauna_open'); game.player.teleport(-20, 0.1, -36); await T.use('étoile d\\'or cachée'); await T.use('Clé du restaurant'); await T.idle(); if (!game.timers.sauna) throw new Error('sauna trap did not start'); await T.inspect('porte du sauna'); await T.click(0, 2); await T.click(1, 3); await T.click(2, 4); await T.flag('sauna_done'); await T.idle()`);
  await run('restaurant: VIP table', `await T.use('Porte du restaurant'); await T.flag('resto_open'); await T.inspect('table VIP'); const sw = async (a, b) => { await T.click(a); await T.click(b); }; await sw('Baron','Docteur'); await sw('Baron','Amiral'); await sw('Baron','Comtesse'); await T.flag('seating_ok'); await T.sleep(1500); await T.idle(); await T.use('Clé de la cuisine'); await T.use('Déverrouiller la cuisine'); await T.flag('kitchen_open')`);
  await run('kitchen: pantry', `await T.use('morceau de recette'); await T.use('Prendre un oignon'); await T.use('morceau de recette'); await T.use('biscuit du garde-manger')`);
  await run('kitchen: cold room (timed)', `game.player.teleport(21.5, 0.1, -32); await T.use('Ouvrir la chambre froide'); await T.sleep(800); game.player.teleport(21.5, 0.1, -37); await T.use('morceau de recette'); await T.use('Décrocher le rouget'); await T.idle(); if (!game.timers.cold) throw new Error('cold trap did not start'); await T.inspect('clavier d\\'urgence'); for (const k of ['5','2','6','3']) await T.click('Touche ' + k); await T.flag('cold_done'); await T.idle()`);
  await run('kitchen: bouillabaisse', `await T.inspect('grande marmite'); for (const n of ['Oignon','Tomate cœur-de-bœuf','Rouget','Sardine']) await T.click('Mettre : ' + n); for (let i = 0; i < 3; i++) await T.click('Remuer avec la louche'); await T.flag('soup'); await T.sleep(2000); await T.idle(); await T.use('Prendre l\\'étoile d\\'or'); await T.flag('star4')`);
  await run('office: 4 stars', `await T.use('Placer tes étoiles'); await T.flag('office_open', 20000); await T.idle()`);
  await run('office: trap + safe', `game.player.teleport(16, 4.6, -30); await T.sleep(1500); await T.idle(); if (!game.timers.office) throw new Error('office trap did not start'); await T.inspect('coffre-fort mural'); for (const s of ['poisson','feuille','coquillage','soleil']) await T.click(s); await T.flag('safe5'); await T.idle(); await T.use('Clé du bateau'); await T.use('5e étoile')`);
  await run('office: bookcase + slide', `await T.use('livre poussiéreux'); await T.flag('bookcase'); await T.idle(); await T.use('toboggan'); await T.flag('slid', 60000); await T.idle()`);
  await run('ducks', `const ds = game.interact.list.filter((d) => T.label(d) === 'Ramasser le canard doré'); for (const d of ds) { game.player.teleport(d.pos.x, d.pos.y > 3 ? 4.6 : 0.1, d.pos.z); await d.use(game, d); await T.sleep(100); } if (game.state.s.ducks.length !== 10) throw new Error('ducks: ' + game.state.s.ducks.length)`);
  await run('ending', `await T.use('grille du ponton'); await T.flag('escaped', 120000); await T.sleep(500); if (document.getElementById('screen-end').classList.contains('hidden')) throw new Error('no end screen')`);
  const s = await page.evaluate(() => ({ time: game.state.s.time, hints: game.state.s.hints, stamps: game.state.s.stamps, deaths: game.state.s.deaths, biscuitsLeft: game.state.s.biscuits, found: game.state.s.biscuitsFound.length }));
  console.log('summary', JSON.stringify(s), 'errors', errors.length);
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
