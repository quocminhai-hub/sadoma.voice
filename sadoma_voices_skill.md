# Kỹ năng (Skill): Xây dựng Web App Sadoma Voices (Text-to-Speech Demo)

## 1. Giới thiệu
Đây là tài liệu hướng dẫn (Skill) để tái tạo lại ứng dụng **Sadoma Voices** - một bản sao giao diện demo Text-to-Speech (tương tự OpenAI.fm) nhưng được tích hợp chặt chẽ với API của **Unmixr**.

- **Công nghệ:** React.js, Vite, CSS thuần (Vanilla CSS).
- **Tính năng cốt lõi:**
  - Kết nối trực tiếp với API `unmixr.com` qua Vercel Serverless Function (để bypass CORS).
  - Tự động tải danh sách giọng đọc động (Dynamic Voice List) lên tới 1000 giọng.
  - Giao diện người dùng Dark Mode sang trọng, hiển thị chi tiết thẻ giọng đọc dạng Grid (Lưới) bao gồm Avatar, Giới tính, Nhãn chất lượng, Nhãn đa ngôn ngữ.
  - Bộ lọc giọng thông minh: Tìm kiếm bằng văn bản, Lọc theo giới tính (Nam/Nữ), Lọc theo ngôn ngữ (Tiếng Việt/Tiếng Anh).
  - Tùy chọn Vibe bằng Tiếng Việt kèm kịch bản mẫu, bao gồm tính năng tự viết kịch bản (Custom).

## 2. Cấu trúc thư mục (Project Structure)
Khi tạo lại dự án, hãy đảm bảo cấu trúc sau (sau khi chạy `npx create-vite@latest ./ -t react`):

```
├── api/
│   └── proxy.js          # (QUAN TRỌNG) Vercel Serverless Proxy xử lý CORS.
├── index.html            # Đổi title thành "Sadoma Voices"
├── vite.config.js        # Cấu hình proxy cho môi trường Dev (localhost).
├── src/
│   ├── App.jsx           # Component chính, chứa State và Logic Fetch API qua proxy.
│   ├── index.css         # File CSS cốt lõi (chứa biến Dark Mode và layout Grid).
│   ├── constants.js      # Khai báo các mẫu VIBES bằng Tiếng Việt.
│   ├── services/
│   │   └── openai.js     # Hàm gọi API /short-tts qua proxy.
│   ├── components/
│   │   ├── Header.jsx         # Chứa Logo, mô tả và Input nhập API Key.
│   │   ├── VoiceSelector.jsx  # Hiển thị lưới thẻ giọng đọc (Voice Cards).
│   │   ├── VibeSelector.jsx   # Chọn phong cách đọc (Kể chuyện, Đấu giá, Phát thanh...).
│   │   ├── ScriptEditor.jsx   # Khung văn bản cho phép chỉnh sửa kịch bản.
│   │   └── FooterAction.jsx   # Chứa nút PLAY gọi API và phát âm thanh.
```

## 3. Quy trình Triển khai (Workflow)

### Bước 1: Khởi tạo dự án
```bash
npx create-vite@latest ./ -t react
npm install
npm install lucide-react
```

### Bước 2: Tích hợp Proxy (Bypass CORS & Deploy Vercel an toàn)
**Tuyệt đối không gọi thẳng API Unmixr từ trình duyệt để tránh lỗi CORS.** Đừng dùng `vercel.json` vì dễ xung đột với tính năng SPA mặc định của Vite trên Vercel. Hãy dùng **Vercel Serverless Function** truyền tham số qua URL query.

**Tạo file `api/proxy.js` ở thư mục gốc:**
```javascript
export default async function handler(req, res) {
  let targetPath = req.query.url;
  
  if (!targetPath) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  // Khôi phục lại query string (ví dụ: page_size=1000)
  const queryParams = new URLSearchParams(req.query);
  queryParams.delete('url');
  const qs = queryParams.toString();
  
  let targetUrl = 'https://unmixr.com/api' + targetPath;
  if (qs) {
    targetUrl += (targetPath.includes('?') ? '&' : '?') + qs;
  }

  try {
    const options = {
      method: req.method,
      headers: {}
    };

    if (req.headers.authorization) options.headers['Authorization'] = req.headers.authorization;
    if (req.headers['content-type']) options.headers['Content-Type'] = req.headers['content-type'];
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, options);
    const contentType = response.headers.get('content-type') || '';
    
    res.setHeader('Content-Type', contentType);
    
    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const buffer = await response.arrayBuffer();
      res.status(response.status).send(Buffer.from(buffer));
    }
  } catch (err) {
    res.status(500).json({ error: err.message, targetUrl });
  }
}
```

**Cấu hình Vite Proxy (cho lúc code ở máy tính):**
Thêm vào `vite.config.js`:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/proxy': {
        target: 'https://unmixr.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy/, '/api')
      }
    }
  }
})
```

### Bước 3: Fetch Data trên React Component
Mọi cuộc gọi API trên React bắt buộc truyền tham số `?url=/v1/...` vào đường dẫn gốc `/api/proxy`.

- Lấy danh sách giọng (`App.jsx`):
  `fetch('/api/proxy?url=/v1/voice-list/?page_size=1000')`
- Sinh âm thanh (`openai.js`):
  `fetch('/api/proxy?url=/v1/short-tts/')`

**Mapping dữ liệu (Voice List):**
  - `id`: Lấy từ `uuid` (mã giọng thực tế để phát âm thanh).
  - `name`: Lấy từ `character`.
  - `language`: Dùng để lọc ngôn ngữ.
  - `avatar`: Lấy từ `avatar_url`.
  - `gender`: Lọc giới tính (`Male`/`Female`).
  - `quality`: Hiển thị nhãn chất lượng (`Premium`, `Standard`...).

### Bước 4: Giao diện (UI/UX)
- **Dark Mode:** Sử dụng bảng màu sau trong `:root`:
  ```css
  --bg-color: #121212;
  --card-bg: #1e1e1e;
  --text-primary: #e0e0e0;
  --text-secondary: #999999;
  --accent-color: #ff5500;
  --border-color: #333333;
  ```
- **Voice Grid Layout:** Thay vì cuộn ngang, sử dụng `display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));` để tạo trải nghiệm giống Dashboard chuyên nghiệp.

## 4. Deploy (Lưu trữ)
- **GitHub:** Khởi tạo kho lưu trữ cục bộ và push lên kho của tài khoản.
- **Vercel:** Đăng nhập Vercel, Import project từ GitHub. Vercel sẽ tự động build Vite React. Thư mục `api/` sẽ được Vercel tự động nhận dạng là Serverless Function mà không cần bất kỳ file `vercel.json` nào.

## 5. Cảnh báo (Gotchas)
- **Cẩn thận khi parse URL trên Vercel:** Biến `req.url` trong môi trường Serverless của Vercel thường bị cắt bỏ đi các phần path đằng sau và gộp vào `req.query`. Do đó, truyền `?url=` như trong Bước 2 là cách duy nhất đảm bảo Vercel bảo toàn 100% path động.
- Trả về âm thanh từ proxy: Chú ý `response.arrayBuffer()` khi content-type không phải là JSON (để truyền file MP3 thô nguyên vẹn).
