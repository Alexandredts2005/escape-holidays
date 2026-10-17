// Minimal production server for Escape Holidays (static files, no dependencies). Usage: PORT=8080 node server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, 'public');
const PORT = process.env.PORT || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
};
const COMPRESS = new Set(['.html', '.js', '.css', '.json', '.svg', '.gltf', '.txt']);

const OPEN = process.argv.includes('--open');
const URL_ = `http://localhost:${PORT}`;
const openBrowser = () => {
  const cmd = process.platform === 'win32' ? `start "" "${URL_}"` : process.platform === 'darwin' ? `open "${URL_}"` : `xdg-open "${URL_}"`;
  require('child_process').exec(cmd, () => {});
};

const server = http.createServer((req, res) => {
  let url;
  try { url = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { res.writeHead(400); res.end(); return; }
  if (url.endsWith('/')) url += 'index.html';
  const file = path.normalize(path.join(ROOT, url));
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); return; }
    const ext = path.extname(file).toLowerCase();
    const headers = { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400' };
    const gz = COMPRESS.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
    if (gz) headers['Content-Encoding'] = 'gzip'; else headers['Content-Length'] = st.size;
    res.writeHead(200, headers);
    if (req.method === 'HEAD') { res.end(); return; }
    const stream = fs.createReadStream(file);
    (gz ? stream.pipe(zlib.createGzip()) : stream).pipe(res);
  });
});
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    // already running (launcher clicked twice?): just show the game
    console.log(`Le jeu tourne déjà sur ${URL_}`);
    if (OPEN) openBrowser();
    setTimeout(() => process.exit(0), 1500);
  } else { console.error('Impossible de démarrer le serveur :', e.message); process.exitCode = 1; }
});
// the browser is opened only once the server really listens (no "connection refused")
server.listen(PORT, () => {
  console.log(`Escape Holidays : ${URL_}  (garde cette fenêtre ouverte pendant que tu joues)`);
  if (OPEN) openBrowser();
});
