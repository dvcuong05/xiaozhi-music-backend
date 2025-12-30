# VN News MCP Server

MCP Server để lấy tin tức mới nhất từ các trang báo uy tín Việt Nam, kết nối tới Xiaozhi API qua WebSocket.

## Giới thiệu

Server này sử dụng giao thức Model Context Protocol (MCP) để cung cấp tin tức từ các trang báo hàng đầu Việt Nam như VnExpress, Tuổi Trẻ, Thanh Niên, Dân Trí, v.v. Server tự động kết nối tới Xiaozhi API qua WebSocket để cung cấp dữ liệu.

## Kiến trúc

```
Railway (Deploy) → MCP Server → WebSocket → wss://api.xiaozhi.me/mcp/ (Xiaozhi API)
                       ↓
                  Vietnamese News
                  (8 nguồn tin)
```

## Các nguồn tin tức được hỗ trợ

- **VnExpress** - Tin tức thời sự, kinh doanh, giải trí, thể thao
- **Tuổi Trẻ** - Tin tức xã hội, kinh tế, văn hóa, giáo dục
- **Thanh Niên** - Tin tức thời sự, kinh tế, pháp luật, văn hóa
- **Dân Trí** - Tin tức tổng hợp về mọi lĩnh vực
- **Zing News** - Tin tức giải trí, công nghệ, đời sống
- **VietNamNet** - Tin tức thời sự, kinh tế, xã hội
- **24h.com.vn** - Tin tức cập nhật 24/7
- **CafeF** - Tin tức kinh tế, chứng khoán, bất động sản

## Cài đặt

```bash
# Clone repository
git clone <your-repo-url>
cd xiaozhi-music-backend

# Cài đặt dependencies (yêu cầu Node.js >= 18.0.0)
npm install

# Build project
npm run build
```

## Sử dụng

### Deploy lên Railway

1. **Push code lên GitHub/GitLab**
2. **Kết nối Railway với repository**
3. **Thêm Environment Variable trong Railway Dashboard**:
   ```
   XIAOZHI_TOKEN=your_token_here
   ```
4. Railway sẽ tự động:
   - Build Docker image
   - Deploy và chạy server
   - Kết nối tới Xiaozhi API qua WebSocket
   - Tự động restart nếu bị disconnect

### Chạy local (Development)

```bash
# Copy .env.example sang .env
cp .env.example .env

# Chỉnh sửa .env với token của bạn
# XIAOZHI_TOKEN=your_token_here

# Cài đặt dependencies
npm install

# Build và chạy
npm run dev
```

### Endpoint WebSocket

Server sẽ tự động kết nối tới:
```
wss://api.xiaozhi.me/mcp/?token=YOUR_TOKEN
```

## Cấu trúc dự án

```
xiaozhi-music-backend/
├── src/
│   ├── tools/           # Các tools lấy tin từ từng trang báo
│   │   transports/      # WebSocket transport
│   │   └── websocket.ts
│   ├── utils/           # Các utility functions
│   │   ├── http.ts
│   │   ├── rss.ts
│   │   ├── logger.ts
│   │   ├── cache.ts
│   │   ├── dayjs.ts
│   │   └── index.ts
│   ├── types.ts         # Type definitions
│   └── index.ts         # Entry point
├── dist/                # Compiled JavaScript
├── .env.example         # Environment variables template
├── Dockerfile           # Docker configuration
├── railway.toml         # Railway deployment config
├── package.json
├── tsconfig.json
└── README_MCP.md
```

## Quy trình hoạt động

1. **Server khởi động** trên Railway
2. **Kết nối WebSocket** tới `wss://api.xiaozhi.me/mcp/?token=...`
3. **Đăng ký 8 tools** với Xiaozhi API
4. **Chờ requests** từ Xiaozhi
5. **Xử lý requests**:
   - Lấy tin tức từ các trang báo VN qua RSS
   - Trả kết quả về Xiaozhi API qua WebSocket
6. **Auto-reconnect** nếu mất kết nối │   ├── dayjs.ts
│   │   └── index.ts
│   ├── types.ts         # Type definitions
### Bắt buộc:
- `XIAOZHI_TOKEN` - Token để xác thực với Xiaozhi API

### Tùy chọn:
- `XIAOZHI_WS_URL` - WebSocket URL (mặc định: `wss://api.xiaozhi.me/mcp/`)
- `VN_NEWS_HIDDEN_FIELDS` - Các trường muốn ẩn (ví dụ: `cover,description`)
- `NODE_ENV` - Môi trường (development/production)

### Cấu hình trong Railway

Vào Railway Dashboard → Variables → Add Variable:
```
XIAOZHI_TOKEN=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...
```
├── package.json
├── tsconfig.json
└── README.md
```

## Development

```bash
# Build và chạy
npm run dev
```

## Biến môi trường

- `VN_NEWS_HIDDEN_FIELDS` - Các trường muốn ẩn trong kết quả (ví dụ: `cover,description`)
- `NODE_ENV` - Môi trường (development/production)

## Tools có sẵn

| Tool Name | Mô tả |
|-----------|-------|
| get-vnexpress-news | Lấy tin từ VnExpress |
| get-tuoitre-news | Lấy tin từ Tuổi Trẻ |
| get-thanhnien-news | Lấy tin từ Thanh Niên |
| get-dantri-news | Lấy tin từ Dân Trí |
| get-zingnews-news | Lấy tin từ Zing News |
| get-vietnamnet-news | Lấy tin từ VietNamNet |
| get-24h-news | Lấy tin từ 24h.com.vn |
| get-cafef-news | Lấy tin từ CafeF |

## License

MIT
