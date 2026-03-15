const socket = io();

// ─── DOM Elementleri ───
const loginScreen  = document.getElementById('loginScreen');
const chatScreen   = document.getElementById('chatScreen');
const nickInput    = document.getElementById('nickInput');
const joinBtn      = document.getElementById('joinBtn');
const loginError   = document.getElementById('loginError');
const messagesEl   = document.getElementById('messages');
const msgInput     = document.getElementById('msgInput');
const sendBtn      = document.getElementById('sendBtn');
const leaveBtn     = document.getElementById('leaveBtn');
const userList     = document.getElementById('userList');
const userCount    = document.getElementById('userCount');
const myNickBadge  = document.getElementById('myNickBadge');

let myNick  = '';
let myColor = '';

// ─── Giriş ───
joinBtn.addEventListener('click', handleJoin);
nickInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleJoin();
});

function handleJoin() {
  const nick = nickInput.value.trim();
  loginError.textContent = '';

  if (!nick) {
    loginError.textContent = 'Takma ad boş olamaz';
    return;
  }
  if (nick.length < 2) {
    loginError.textContent = 'En az 2 karakter gir';
    return;
  }

  joinBtn.disabled = true;
  joinBtn.textContent = 'bağlanıyor...';
  socket.emit('join', nick);
}

socket.on('joined', ({ nick, color }) => {
  myNick  = nick;
  myColor = color;
  myNickBadge.textContent = nick;

  loginScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');

  joinBtn.disabled = false;
  joinBtn.textContent = 'odaya gir';
  msgInput.focus();
});

socket.on('error', (msg) => {
  loginError.textContent = msg;
  joinBtn.disabled = false;
  joinBtn.textContent = 'odaya gir';
});

// ─── Mesaj Gönderme ───
sendBtn.addEventListener('click', sendMessage);
msgInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

msgInput.addEventListener('input', () => {
  msgInput.style.height = 'auto';
  msgInput.style.height = Math.min(msgInput.scrollHeight, 120) + 'px';
});

function sendMessage() {
  const text = msgInput.value.trim();
  if (!text || !myNick) return;
  socket.emit('message', text);
  msgInput.value = '';
  msgInput.style.height = 'auto';
  msgInput.focus();
}

// ─── Mesaj Alma ───
socket.on('message', (msg) => {
  const isOwn = msg.nick === myNick;
  appendMessage(msg, isOwn ? 'own' : 'other');
});

socket.on('system', (text) => {
  appendSystemMsg(text);
});

function appendMessage({ nick, color, text, time }, type) {
  const div = document.createElement('div');
  div.className = `msg ${type}`;

  const t = new Date(time);
  const hh = t.getHours().toString().padStart(2, '0');
  const mm = t.getMinutes().toString().padStart(2, '0');

  div.innerHTML = `
    <div class="msg-meta">
      <span class="nick" style="color:${color}">${escHtml(nick)}</span>
      <span class="ts">${hh}:${mm}</span>
    </div>
    <div class="bubble">${escHtml(text)}</div>
  `;

  messagesEl.appendChild(div);
  scrollToBottom();
}

function appendSystemMsg(text) {
  const div = document.createElement('div');
  div.className = 'msg system';
  div.innerHTML = `<div class="bubble">${escHtml(text)}</div>`;
  messagesEl.appendChild(div);
  scrollToBottom();
}

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ─── Kullanıcı Listesi ───
socket.on('users', (users) => {
  userCount.textContent = users.length;
  userList.innerHTML = '';
  users.forEach(u => {
    const li = document.createElement('li');
    li.className = 'user-item';
    li.innerHTML = `
      <span class="user-dot" style="background:${u.color}"></span>
      <span style="color:${u.color === myColor && u.nick === myNick ? 'var(--accent)' : 'var(--text)'}">
        ${escHtml(u.nick)}${u.nick === myNick ? ' (sen)' : ''}
      </span>
    `;
    userList.appendChild(li);
  });
});

// ─── Ayrılma ───
leaveBtn.addEventListener('click', () => {
  socket.disconnect();
  chatScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  messagesEl.innerHTML = '';
  nickInput.value = '';
  myNick = '';
  myColor = '';
  socket.connect();
});

// ─── Bağlantı Kopması ───
socket.on('disconnect', () => {
  if (myNick) {
    appendSystemMsg('Sunucu bağlantısı kesildi. Yeniden bağlanılıyor...');
  }
});

socket.on('connect', () => {
  if (myNick) {
    appendSystemMsg('Yeniden bağlandı.');
  }
});

// ─── Yardımcı ───
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
