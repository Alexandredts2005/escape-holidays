'use strict';
// NOVA Académie — static web server + real-time multiplayer (Socket.IO).
const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { RoomManager } = require('./rooms');

const PORT = Number(process.env.PORT || 3000);
const PUBLIC = path.join(__dirname, '..', 'public');

const quiz = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'data', 'quiz.json'), 'utf8'));
const songs = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'assets', 'music', 'charts', 'index.json'), 'utf8'));

const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.get('/health', (req, res) => res.json({ ok: true, rooms: rooms.count(), uptime: Math.round(process.uptime()) }));
app.use('/assets', express.static(path.join(PUBLIC, 'assets'), { maxAge: '7d', immutable: false }));
app.use(express.static(PUBLIC, { maxAge: '1h' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*' },
  maxHttpBufferSize: 1e5,
  pingInterval: 20000,
  pingTimeout: 20000,
});

const rooms = new RoomManager(io, { quiz, songs });

io.on('connection', (socket) => {
  rooms.attach(socket);
});

server.listen(PORT, () => {
  console.log(`[nova] http://localhost:${PORT}  (${quiz.length} questions, ${songs.length} titres)`);
});

function shutdown() {
  console.log('[nova] shutting down');
  io.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
