# Kỹ năng (Skill): Xây dựng Web App Sadoma Voices (Text-to-Speech Demo)

## 1. Giới thiệu
Đây là tài liệu hướng dẫn (Skill) để tái tạo lại ứng dụng **Sadoma Voices** - một bản sao giao diện demo Text-to-Speech (tương tự OpenAI.fm) nhưng được tích hợp chặt chẽ với API của **Unmixr**.

- **Công nghệ:** React.js, Vite, CSS thuần (Vanilla CSS).
- **Tính năng cốt lõi:**
  - Kết nối trực tiếp với API `unmixr.com`.
  - Tự động tải danh sách giọng đọc động (Dynamic Voice List) lên tới 1000 giọng.
  - Giao diện người dùng Dark Mode sang trọng, hiển thị chi tiết thẻ giọng đọc dạng Grid (Lưới) bao gồm Avatar, Giới tính, Nhãn chất lượng, Nhãn đa ngôn ngữ.
  - Bộ lọc giọng thông minh: Tìm kiếm bằng văn bản, Lọc theo giới tính (Nam/Nữ), Lọc theo ngôn ngữ (Tiếng Việt/Tiếng Anh).
  - Tùy chọn Vibe bằng Tiếng Việt kèm kịch bản mẫu, bao gồm tính năng tự viết kịch bản (Custom).

## 2. Cấu trúc thư mục (Project Structure)
Khi tạo lại dự án, hãy đảm bảo cấu trúc sau (sau khi chạy `npx create-vite@latest ./ -t react`):

```
├── index.html            # Đổi title thành "Sadoma Voices"
├── src/
│   ├── App.jsx           # Component chính, chứa State và Logic Fetch API Unmixr.
│   ├── index.css         # File CSS cốt lõi (chứa biến Dark Mode và layout Grid).
│   ├── constants.js      # Khai báo các mẫu VIBES bằng Tiếng Việt.
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

### Bước 2: Tích hợp API Unmixr
- **Endpoint lấy danh sách giọng:** `GET https://unmixr.com/api/v1/voice-list/?page_size=1000`
- **Mapping dữ liệu quan trọng:**
  Trong kết quả trả về của API Unmixr, cần map đúng các trường dữ liệu sau để hiển thị lên UI:
  - `id`: Lấy từ `uuid` (mã giọng thực tế để phát âm thanh).
  - `name`: Lấy từ `character`.
  - `language`: Dùng để phục vụ bộ lọc ngôn ngữ.
  - `avatar`: Lấy từ `avatar_url`.
  - `gender`: Dùng để phục vụ bộ lọc giới tính.
  - `quality`: Hiển thị nhãn chất lượng (ví dụ: HD, Premium).

### Bước 3: Giao diện (UI/UX)
- **Dark Mode:** Sử dụng bảng màu sau trong `:root`:
  ```css
  --bg-color: #121212;
  --card-bg: #1e1e1e;
  --text-primary: #e0e0e0;
  --text-secondary: #999999;
  --accent-color: #ff5500;
  --border-color: #333333;
  ```
- **Voice Grid Layout:** Thay vì cuộn ngang, sử dụng `display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));` để tạo trải nghiệm giống Dashboard quản lý giọng đọc.

## 4. Deploy (Lưu trữ)
- **GitHub:** Khởi tạo kho lưu trữ cục bộ và push lên kho của tài khoản (ví dụ: `quocminhai-hub/sadoma.voice`).
- **Vercel:** Đăng nhập Vercel, Import project từ GitHub. Vercel sẽ tự động nhận diện Vite React và build thành công.

## 5. Lưu ý quan trọng
- Luôn kiểm tra kỹ Object trả về từ Unmixr API vì có thể họ sẽ nâng cấp thay đổi khóa (như từ `id` sang `uuid` hoặc từ `name` sang `character`).
- Mặc định ứng dụng cung cấp API Key khởi tạo để test, nhưng trong thực tế người dùng có thể nhập đè Key khác của họ trên Header. 
- Xử lý mượt lỗi CORS bằng cách để Frontend fetch thẳng đến Unmixr (nếu Unmixr cho phép) hoặc thiết lập Proxy nếu cần khi chạy dev ở localhost.
