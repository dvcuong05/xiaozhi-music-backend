# Xiaozhi Music Backend - Railway

Backend service sử dụng **Invidious API** để search và extract audio URL từ YouTube.

✅ **KHÔNG CẦN cookies** - an toàn, không lộ thông tin cá nhân  
✅ **KHÔNG CẦN yt-dlp** - chỉ dùng Node.js  
✅ **Public repo OK** - không có thông tin nhạy cảm

## 🚀 Quick Deploy

### Railway CLI:
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

### GitHub Deploy:
1. Push code lên GitHub
2. Railway dashboard → New Project → Deploy from GitHub
3. Chọn repo này
4. Auto deploy!

## 📡 API Endpoints

### GET /
Health check

### GET /search?q={query}
Search YouTube và trả về audio stream URL

**Parameters:**
- `q` (required): Tên bài hát hoặc query search
- `format` (optional): `worstaudio` (default), `bestaudio`

**Response:**
```json
{
  "success": true,
  "title": "Song Title",
  "url": "https://...",
  "format": "audio/mp4",
  "source": "youtube",
  "quality": "worstaudio"
}
```

## 🧪 Test Local

```bash
npm install
npm start

# Test
curl "http://localhost:3000/search?q=son+tung+mtp"
```

## 📝 Môi trường

- Node.js 18+
- yt-dlp (installed via Docker)
- Express.js

## 🔗 Integration với ESP32

Sau khi deploy, lấy URL (ví dụ: `https://xiaozhi-music.up.railway.app`) và config trong ESP32:

```cpp
// main/mcp_server.cc
MusicStreamer streamer("https://your-app.up.railway.app");
```

Xem hướng dẫn đầy đủ tại [DEPLOY_GUIDE.md](../DEPLOY_GUIDE.md)
