# Kimi Proxy

Proxy server chạy trên Termux, chuyển Kimi AI Web thành API.

## Cài đặt

### 1. Clone repo
\```bash
pkg install git nodejs
git clone https://github.com/m93519925-netizen/kimi-proxy.git
cd kimi-proxy
npm install
\```

### 2. Lấy AUTH_TOKEN từ Chrome
1. Vào kimi.com và đăng nhập
2. F12 → Network → gửi tin nhắn
3. Tìm request `Chat`
4. Tab Headers → copy giá trị `authorization` (bỏ phần "Bearer ")

### 3. Tạo file .env
\```bash
cp .env.example .env
nano .env
\```

### 4. Chạy server
\```bash
node server.js
\```

### 5. Expose bằng zrok
\```bash
zrok share public http://localhost:3000
\```

## Test
\```bash
curl -X POST "https://your-zrok-url/proxy" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Xin chào!"}'
\```

## Lưu ý
- AUTH_TOKEN là JWT, sống khoảng 30 ngày (xem `exp` trong token)
- Khi hết hạn, đăng nhập lại kimi.com và lấy token mới
