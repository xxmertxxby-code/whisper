const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

// Statik dosyaları sun (public/ varsa oradan, yoksa kök dizinden)
const fs = require('fs');
const staticPath = fs.existsSync(path.join(__dirname, 'public'))
  ? path.join(__dirname, 'public')
  : __dirname;
app.use(express.static(staticPath));

// Aktif kullanıcılar: socketId -> { nick, color }
const users = new Map();

// Renk havuzu
const COLORS = [
  '#7c6af7','#4ade80','#f472b6','#fb923c',
  '#38bdf8','#a3e635','#fbbf24','#f87171'
];
let colorIndex = 0;

function getNextColor() {
  const c = COLORS[colorIndex % COLORS.length];
  colorIndex++;
  return c;
}

// Çevrimiçi kullanıcı listesini döndür
function getOnlineUsers() {
  return Array.from(users.values()).map(u => ({ nick: u.nick, color: u.color }));
}

io.on('connection', (socket) => {
  console.log(`[+] Bağlantı: ${socket.id}`);

  // Kullanıcı odaya katıldığında
  socket.on('join', (nick) => {
    // Boş veya çok uzun nick engelle
    if (!nick || nick.trim().length < 1 || nick.trim().length > 20) {
      socket.emit('error', 'Geçersiz takma ad (1-20 karakter)');
      return;
    }

    // Aynı nick kullanılıyor mu kontrol et
    const trimmed = nick.trim();
    const nickTaken = Array.from(users.values()).some(u => u.nick === trimmed);
    if (nickTaken) {
      socket.emit('error', 'Bu takma ad kullanılıyor, başka bir tane seç');
      return;
    }

    const user = { nick: trimmed, color: getNextColor() };
    users.set(socket.id, user);

    // Kullanıcıya kendi bilgilerini gönder
    socket.emit('joined', { nick: user.nick, color: user.color });

    // Herkese katılım bildirimi
    io.emit('system', `${user.nick} odaya katıldı`);

    // Güncel kullanıcı listesini yayınla
    io.emit('users', getOnlineUsers());

    console.log(`[join] ${user.nick} (${socket.id})`);
  });

  // Mesaj geldiğinde
  socket.on('message', (text) => {
    const user = users.get(socket.id);
    if (!user) return;

    // Boş veya çok uzun mesaj engelle
    if (!text || text.trim().length < 1 || text.trim().length > 500) return;

    const msg = {
      id: uuidv4(),
      nick: user.nick,
      color: user.color,
      text: text.trim(),
      time: new Date().toISOString()
    };

    // Herkese yayınla (göndereni de dahil et)
    io.emit('message', msg);
    console.log(`[msg] ${user.nick}: ${msg.text.substring(0, 50)}`);
  });

  // Bağlantı kesildiğinde
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      io.emit('system', `${user.nick} odadan ayrıldı`);
      io.emit('users', getOnlineUsers());
      console.log(`[-] ${user.nick} ayrıldı (${socket.id})`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`✓ Whisper çalışıyor → http://localhost:${PORT}`);
});
