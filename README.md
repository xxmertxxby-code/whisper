# whisper — anonim sohbet

Kimlik yok, kayıt yok, geçmiş yok.

## Kurulum

### 1. Bağımlılıkları yükle
```bash
npm install
```

### 2. Başlat
```bash
npm start
```

Geliştirme modunda (otomatik yenileme):
```bash
npm run dev
```

### 3. Tarayıcıda aç
```
http://localhost:3000
```

---

## Proje Yapısı

```
whisper/
├── server.js          # Express + Socket.io backend
├── package.json
└── public/
    ├── index.html     # Ana sayfa
    ├── css/
    │   └── style.css  # Stiller
    └── js/
        └── chat.js    # İstemci kodu
```

---

## Özellikler

- Anonim giriş (sadece takma ad)
- Gerçek zamanlı mesajlaşma (Socket.io)
- Çevrimiçi kullanıcı listesi (sidebar)
- Aynı takma ad kullanımını engeller
- Bağlantı kopunca otomatik yeniden bağlanma
- XSS koruması (HTML escape)
- Mesaj uzunluk sınırı (500 karakter)
- Mobil uyumlu tasarım

---

## Notlar

- Mesajlar **hiçbir yerde saklanmaz** — sunucu belleğinde tutulmaz, yeni katılanlar önceki mesajları göremez
- Kullanıcı bilgileri yalnızca aktif bağlantı süresince tutulur
- Sunucu yeniden başlatılınca tüm oturumlar sıfırlanır

---

## Geliştirme Fikirleri

| Özellik | Nasıl Eklenebilir |
|---|---|
| Mesaj geçmişi | SQLite ile son N mesajı sakla |
| Birden fazla oda | socket.join(room) ile oda sistemi |
| Özel mesaj | socket.to(socketId).emit() |
| Küfür filtresi | bad-words paketi |
| Mesaj limiti | Rate limiting middleware |
| HTTPS | nginx reverse proxy + certbot |
