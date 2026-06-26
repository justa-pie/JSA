# 🎵 Lyrix

> Web app tra cứu lời bài hát, thông tin nghệ sĩ và album, có trợ lý AI đi kèm — powered by **Genius Song Lyrics API** + **Google Gemini**.

🔗 **Live:** Frontend trên GitHub Pages, backend (Gemini proxy) trên Vercel.

---

# 📖 Phần 1 — Giới thiệu sản phẩm (cho người dùng)

## Lyrix là gì?

Lyrix là một web app nghe-tra-cứu nhạc: tìm bài hát, xem lời, đọc tiểu sử nghệ sĩ, khám phá album — và giờ có thêm một **trợ lý AI** giúp phân tích, gợi ý và trò chuyện về âm nhạc ngay trên trang.

## ✨ Tính năng chính

### Tìm kiếm & khám phá
- **Tìm kiếm đa loại** — gõ tên bài hát / nghệ sĩ / album, có dropdown gợi ý trực tiếp khi gõ (debounce 350ms)
- **Top Charts** — bảng xếp hạng bài hát, nghệ sĩ, album nổi bật; lọc theo thời kỳ (hôm nay / tuần / tháng / mọi thời đại)
- **Trang chi tiết bài hát** — ảnh bìa, lời bài hát đầy đủ, mức độ phổ biến, danh sách credits (nhạc sĩ, producer...)
- **Trang chi tiết nghệ sĩ** — ảnh bìa, avatar, tiểu sử, liên kết mạng xã hội, tab Bài hát / Album
- **Trang chi tiết album** — ảnh bìa, danh sách tracklist, thông tin nghệ sĩ
- **Huy hiệu Top 3** (vàng/bạc/đồng) và nhãn 🔥 HOT cho bài hát nổi bật

### Trợ lý AI 🪄
Có mặt trên các trang chi tiết bài hát, nghệ sĩ, album, và trang cá nhân:
- **Phân tích lời bài hát** — chủ đề, cảm xúc, ý nghĩa, hình ảnh ẩn dụ, phong cách viết
- **Tóm tắt tiểu sử nghệ sĩ** — giới thiệu ngắn gọn, điểm nổi bật, phong cách âm nhạc
- **Mô tả vibe album** — không khí tổng thể, "màu sắc" cảm xúc, gợi ý hoàn cảnh nghe
- **Gợi ý bài hát tương tự** — 5 gợi ý kèm lý do
- **Phân tích gu âm nhạc cá nhân** (trang Profile) — dựa trên danh sách yêu thích và lịch sử nghe
- **Chatbot nổi (floating chat)** — góc dưới màn hình, có thể hỏi bất kỳ điều gì về âm nhạc; chatbot "biết" bạn đang xem bài/nghệ sĩ/album nào để trả lời sát ngữ cảnh hơn
- Nội dung AI hiện dần theo kiểu gõ chữ (streaming), không phải chờ rồi hiện hết một lúc

> Trợ lý AI **không xuất hiện** ở trang chủ và trang quản trị — chỉ có ở các trang chi tiết và trang cá nhân.

### Tài khoản & cá nhân hoá
- Đăng ký / đăng nhập bằng **Email-mật khẩu** hoặc **Google**
- **Trang cá nhân**: chỉnh sửa tên, chức danh, tiểu sử, ngày sinh, SĐT, địa điểm
- Upload **ảnh đại diện** và **ảnh bìa** trang cá nhân
- **Yêu thích** — lưu bài hát bằng nút ❤️, xem lại và xoá bất cứ lúc nào
- **Lịch sử xem** — tự động ghi lại các bài hát đã xem
- **Playlist** — tạo, sửa, xoá, đặt tên và ảnh bìa riêng
- **Album ảnh cá nhân** — upload và quản lý ảnh

### Quản trị (Admin Dashboard)
Dành riêng cho tài khoản có quyền `admin`, không hiển thị với người dùng thường:
- Danh sách toàn bộ người dùng, kèm số liệu yêu thích / lịch sử / playlist của từng người
- Tìm kiếm và bộ lọc nâng cao (tên, email, ngày tham gia, số lượng yêu thích tối thiểu, vai trò, sắp xếp)
- Xem chi tiết từng người dùng (UID, bio, danh sách yêu thích / lịch sử / playlist mở rộng)
- Xoá người dùng, xoá toàn bộ yêu thích hoặc lịch sử của một người dùng
- Biểu đồ thống kê người dùng mới theo ngày / tuần / tháng / năm
- Thống kê nhanh: tổng người dùng, tổng yêu thích, tổng lượt xem lịch sử, tổng playlist

## 🧭 Sơ đồ điều hướng

```
index.html (Trang chủ — không có AI)
  ├── Tìm bài hát      → details-song.html?id={songId}      [có AI]
  ├── Tìm nghệ sĩ      → details-artist.html?id={artistId}  [có AI]
  ├── Tìm album        → details-album.html?id={albumId}    [có AI]
  └── → charts.html (Top Charts)
              ├── Top Songs   → details-song.html
              ├── Top Artists → details-artist.html
              └── Top Albums  → details-album.html

Navbar (mọi trang) → profile.html (Trang cá nhân) [có AI]
Chỉ admin           → admin.html (Quản trị — không có AI)
```

---

# 🛠️ Phần 2 — Tài liệu kỹ thuật (cho vibe coding / dev)

## 📁 Cấu trúc thư mục

```
JSA/
├── assets/
│   └── public/
│       └── images/
│           └── logo.webp                   # Logo & favicon
│
├── src/
│   ├── pages/                              # Các trang HTML
│   │   ├── charts.html                     # Top charts
│   │   ├── details-song.html               # Chi tiết bài hát [AI]
│   │   ├── details-artist.html             # Chi tiết nghệ sĩ [AI]
│   │   ├── details-album.html              # Chi tiết album [AI]
│   │   ├── profile.html                    # Trang cá nhân người dùng [AI]
│   │   └── admin.html                      # Trang quản trị (chỉ role=admin)
│   │
│   ├── scripts/                            # JavaScript
│   │   ├── api/
│   │   │   └── genius.js                   # API config + fetch + cache + helpers
│   │   ├── components/
│   │   │   ├── navbar.js                   # Mobile navbar + scroll effect
│   │   │   ├── auth.js                     # Firebase Auth + favorites + history helpers
│   │   │   └── ai-panel.js                 # AI panel + floating chatbot (SSE streaming)
│   │   └── pages/
│   │       ├── index.js                    # Logic trang chủ + tìm kiếm
│   │       ├── charts.js                   # Logic charts
│   │       ├── details-song.js             # Logic chi tiết bài hát + yêu thích + AI
│   │       ├── details-artist.js           # Logic chi tiết nghệ sĩ + AI
│   │       ├── details-album.js            # Logic chi tiết album + AI
│   │       ├── profile.js                  # Logic trang cá nhân + AI
│   │       └── admin.js                    # Logic trang quản trị
│   │
│   └── styles/
│       └── main.css                        # Global stylesheet (gồm cả AI panel + admin)
│
├── server/                                 # Backend Gemini proxy (deploy Vercel)
│   └── server.js                           # Express app — Genius proxy + Gemini SSE endpoints
│
├── index.html                              # Trang chủ / tìm kiếm (root để GitHub Pages deploy)
├── firestore.rules                         # Firestore security rules
├── .env                                    # API keys (không commit)
├── .editorconfig
├── .gitignore
└── README.md
```

> ⚠️ Cấu trúc thư mục `server/` ở trên là gợi ý tổ chức — kiểm tra lại đường dẫn thật trong repo nếu khác.

---

## 🌐 Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Frontend | Vanilla HTML + CSS + JavaScript |
| Icons | Font Awesome 6.4 (đã thay thế toàn bộ emoji icon) |
| Font | Google Fonts (Be Vietnam Pro + Inter) |
| API nhạc | [Genius Song Lyrics API](https://rapidapi.com/Glavier/api/genius-song-lyrics1) — RapidAPI, gọi qua backend proxy |
| AI | Google Gemini API (`@google/genai`), streaming qua SSE |
| Auth | Firebase Authentication (Email/Password + Google OAuth) |
| Database | Firebase Firestore |
| Frontend hosting | GitHub Pages |
| Backend hosting | Vercel (Node.js/Express) |

### Vì sao có backend?

Ban đầu Lyrix là dự án **thuần static** (chỉ GitHub Pages, gọi thẳng RapidAPI từ trình duyệt). Khi tích hợp Gemini, cần một nơi giữ `GEMINI_API_KEY` và `RAPIDAPI_KEY` an toàn (không lộ ra client), nên đã thêm một backend Node.js/Express nhỏ, deploy trên Vercel, đóng vai trò:
1. **Proxy cho Genius API** — frontend gọi `/genius?endpoint=...` thay vì gọi RapidAPI trực tiếp, key không lộ ra client.
2. **Proxy + streaming cho Gemini API** — các endpoint `/api/...` nhận request từ frontend, gọi Gemini, rồi stream kết quả về qua Server-Sent Events (SSE).

---

## 🔑 Cấu hình API

### Genius API (qua backend proxy)
Trước đây frontend gọi RapidAPI trực tiếp tại `src/scripts/api/genius.js`. Hiện tại nên gọi qua backend (`/genius?endpoint=...`) để giấu key — kiểm tra `genius.js` xem đã trỏ qua proxy hay còn gọi trực tiếp RapidAPI để cập nhật cho khớp.

> ⚠️ **Lưu ý:** `per_page` tối đa API Genius chấp nhận là **5**. `page` luôn để **1**.

File `genius.js` cung cấp các utility dùng chung:

| Hàm | Mô tả |
|---|---|
| `fetchAPI(endpoint, params)` | Gọi API, xử lý lỗi HTTP |
| `fetchCached(key, endpoint, params)` | Gọi API có cache sessionStorage (TTL 30 phút) |
| `sessionGet(key)` | Đọc cache |
| `sessionSet(key, data)` | Ghi cache |
| `formatNumber(num)` | Format số → `1.2K`, `3.4M` |
| `safeImg(src)` | Trả ảnh hoặc SVG placeholder |
| `stripHtml(html)` | Chuyển HTML → plain text |
| `showError(msg)` | Hiện toast lỗi |

### Gemini API (backend, `server.js`)

```javascript
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
```

> ⚠️ **Quan trọng:** key Gemini phải lấy từ **Google AI Studio** (bắt đầu bằng `AIza`), **không** dùng OAuth token từ Google Cloud Console — sẽ gây lỗi 401.

> ⚠️ Model hiện đang cấu hình trong `server.js` là `gemini-3.5-flash`. Nếu gặp lỗi quota hoặc tên model không hợp lệ, kiểm tra danh sách model khả dụng trong Google AI Studio và đổi sang một model còn hạn mức (ví dụ `gemini-1.5-flash` làm fallback khi project chính hết quota free tier).

### Biến môi trường backend (`.env` trên server)

```
GEMINI_API_KEY=AIza...
RAPIDAPI_KEY=...
PORT=3000
```

---

## 🔌 Endpoints

### Genius (qua backend proxy `/genius`)

| Endpoint gốc | Params | Mô tả |
|---|---|---|
| `GET /search/multi/` | `q`, `per_page=5`, `page=1` | Tìm kiếm đa loại (song / artist / album) |
| `GET /chart/songs/` | `per_page`, `page`, `type=all` | Top bài hát |
| `GET /chart/artists/` | `per_page` | Top nghệ sĩ |
| `GET /chart/albums/` | `per_page`, `time_period` | Top album |
| `GET /song/details/` | `id` | Chi tiết bài hát + credits |
| `GET /song/lyrics/` | `id` | Lời bài hát |
| `GET /artist/details/` | `id` | Thông tin nghệ sĩ |
| `GET /artist/songs/` | `id`, `sort=popularity`, `per_page=20` | Bài hát của nghệ sĩ |
| `GET /artist/albums/` | `id`, `per_page=10` | Album của nghệ sĩ |
| `GET /album/details/` | `id` | Chi tiết album + tracklist |

> Response shape search: `{ sections: [ { type: 'song'|'artist'|'album'|'top_hit'|'lyric', hits: [] } ] }`

Frontend gọi dạng: `GET {BACKEND_URL}/genius?endpoint=/chart/songs/&per_page=20`

### Gemini AI (backend `/api/...`, tất cả đều stream qua SSE)

| Endpoint | Method | Body | Dùng ở trang |
|---|---|---|---|
| `/api/lyrics/analyze` | POST | `{ title, artist, lyrics }` | details-song.html |
| `/api/artist/summary` | POST | `{ name, bio }` | details-artist.html |
| `/api/album/vibe` | POST | `{ title, artist, releaseDate, tracks[] }` | details-album.html |
| `/api/song/similar` | POST | `{ title, artist, tags }` | details-song.html |
| `/api/profile/taste` | POST | `{ favorites[], history[] }` | profile.html |
| `/api/chat` | POST | `{ message, context: { title, artist, page } }` | floating chatbot (mọi trang có AI) |

**Format SSE event:**
```
data: {"chunk": "đoạn text..."}\n\n
...
data: {"done": true}\n\n
```
hoặc khi lỗi:
```
data: {"error": "Gemini API thất bại."}\n\n
```

---

## 🤖 Kiến trúc AI Panel (`ai-panel.js`)

File `src/scripts/components/ai-panel.js` (IIFE module `LyrixAI`) cung cấp:

| Hàm public | Mô tả |
|---|---|
| `initLyricsAnalyze({ title, artist, lyrics, container })` | Gắn nút "Phân tích lời bài hát" |
| `initSimilarSongs({ title, artist, tags, container })` | Gắn nút "Gợi ý bài hát tương tự" |
| `initArtistSummary({ name, bio, container })` | Gắn nút "Tóm tắt tiểu sử" |
| `initAlbumVibe({ title, artist, releaseDate, tracks, container })` | Gắn nút "Mô tả vibe album" |
| `initTasteAnalysis({ favorites, history, container })` | Gắn nút "Phân tích gu âm nhạc" (profile) |
| `initFloatingChat(context)` | Khởi tạo nút chat nổi (FAB) + cửa sổ chat, dùng `context` để AI biết đang ở trang nào |

**Cơ chế hoạt động:**
- Mỗi nút AI khi bấm sẽ mở một **panel slide-in** (`createPanel`), gọi `streamToPanel()` tới backend, nội dung markdown được parse thủ công (`renderMarkdown`) và render dần theo từng chunk nhận được — không chờ toàn bộ response.
- Chatbot nổi dùng `streamToChat()` — render plain text dần, có hiệu ứng con trỏ nhấp nháy trong lúc đang stream (class `chat-msg--streaming`).
- Toàn bộ nút trigger dùng Font Awesome (`createAIButton`), không còn icon emoji.

### URL backend (auto-detect local vs production)

```javascript
const AI_BASE_URL = "https://lyrix-backend.vercel.app";
```

Khi phát triển local, đổi giá trị này (hoặc dùng pattern auto-detect theo `location.hostname`) để trỏ về `http://localhost:3000` thay vì domain Vercel production.

> Pattern khuyến nghị: kiểm tra `location.hostname === "localhost" || location.hostname === "127.0.0.1"` để tự động chọn backend local hay production, tránh phải sửa tay mỗi lần deploy.

---

## 🔐 Firebase Setup

### 1. Authentication
Bật tại Firebase Console → Authentication → Sign-in method:
- ✅ Email/Password
- ✅ Google

Thêm domain vào Authorized domains: `localhost`, `127.0.0.1`, và domain GitHub Pages của bạn.

### 2. Firestore
Tạo database, sau đó vào Rules và paste nội dung `firestore.rules`.

Rules hiện tại cho phép:
- User chỉ đọc/ghi document của chính mình
- Không ai xóa được document user (trừ admin qua dashboard, vốn cũng thao tác trên chính Firestore với quyền account admin)
- Subcollection `favorites`, `history`, `playlists`, `photos` — chỉ owner mới read/write/delete
- Có thể update các field: `displayName`, `photoURL`, `lastLogin`, `role`, `bio`, `dob`, `phone`, `location`, `avatarUrl`, `coverUrl`

### 3. Phân quyền Admin

Trang `admin.html` kiểm tra field `role` trên document `users/{uid}`:
- Nếu `role !== "admin"` → tự động đăng xuất và hiện thông báo "Tài khoản không có quyền admin"
- Set quyền admin bằng cách chỉnh field `role: "admin"` trực tiếp trên Firestore Console cho user cần cấp quyền

### 4. Config trong `auth.js` / `admin.js`
```javascript
const FIREBASE_CONFIG = {
  apiKey:            "...",
  authDomain:        "...",
  projectId:         "...",
  storageBucket:     "...",
  messagingSenderId: "...",
  appId:             "..."
};
```
Lấy config tại Firebase Console → Project Settings → Your apps → Web app.

---

## 📦 Thứ tự load script trong HTML

### Các trang có AI (details-song, details-artist, details-album, profile)

```html
<!-- 1. Firebase — PHẢI load trước auth.js -->
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js"></script>

<!-- 2. API helper — PHẢI load trước page scripts -->
<script src="../scripts/api/genius.js"></script>

<!-- 3. AI panel — PHẢI load trước page scripts dùng LyrixAI -->
<script src="../scripts/components/ai-panel.js"></script>

<!-- 4. Page logic -->
<script src="../scripts/pages/[tên-page].js"></script>

<!-- 5. Auth + Navbar — load sau cùng -->
<script src="../scripts/components/auth.js"></script>
<script src="../scripts/components/navbar.js"></script>
```

### `index.html` và `admin.html` — KHÔNG load `ai-panel.js`

Hai trang này được loại trừ khỏi tích hợp AI có chủ đích. `index.html` ở root dùng path `src/scripts/...` thay vì `../scripts/...`.

---

## 🧠 Bài học & nguyên tắc quan trọng

- **Firestore `onSnapshot` thay vì `get()` cho các đọc dữ liệu nhạy cảm với auth**: `get()` từng gây lỗi CORS trên Safari làm vỡ hiển thị avatar trên navbar; `onSnapshot` xử lý reconnect tốt hơn và tránh lỗi fatal.
- **Race condition với auth state**: mọi lần đọc Firestore phụ thuộc user phải nằm trong callback `onAuthStateChanged`, không dùng `setTimeout` để né lỗi permission.
- **Vercel cho phép đặt tên project trước khi deploy** → biết trước URL production → áp dụng pattern auto-detect theo `location.hostname` để frontend tự chuyển giữa backend local/production mà không cần sửa tay.
- **Gemini API key phải bắt đầu bằng `AIza`** — lấy từ Google AI Studio, không phải Google Cloud Console (token OAuth sẽ gây lỗi 401).
- **z-index và overflow stacking** là nguồn lỗi lặp lại trên trang profile (ví dụ avatar đè lên nút đổi ảnh bìa) — cần layer z-index rõ ràng và cấu trúc wrapper cẩn thận.
- **Quản lý path tĩnh**: `index.html` ở root, các trang khác nằm dưới `src/pages/` → độ sâu path khác nhau, phải xử lý nhất quán trong mọi file HTML/JS khi tham chiếu asset hoặc script.
- **Quota Gemini free tier có giới hạn** trên mỗi Google Cloud project — khi hết quota, cần tạo project mới hoặc chuyển sang model nhẹ hơn (`gemini-1.5-flash`) làm phương án dự phòng.

---

## 🚀 Chạy local

### Frontend (static)

```bash
# Live Server (VS Code extension) — recommended
# Hoặc:
npx serve .
# Hoặc:
python -m http.server 8080
```

Truy cập: `http://127.0.0.1:5500/JSA/index.html`

> **Lưu ý:** Không mở file trực tiếp bằng `file://` — browser chặn fetch do CORS.

### Backend (Gemini + Genius proxy)

```bash
cd server
npm install
# Tạo file .env với GEMINI_API_KEY và RAPIDAPI_KEY
npm start
```

Mặc định chạy tại `http://localhost:3000`. Nhớ trỏ `AI_BASE_URL` trong `ai-panel.js` (hoặc pattern auto-detect) về địa chỉ này khi test local.

---

## 🌍 Deploy

### Frontend → GitHub Pages
1. Push code lên GitHub repository
2. Vào Settings → Pages → Source: `main` branch, `/ (root)`
3. Truy cập `https://{username}.github.io/{repo}/`

`index.html` đặt ở root để GitHub Pages tự nhận làm entry point.

### Backend → Vercel
1. Import repo (hoặc thư mục `server/`) vào Vercel
2. Đặt tên project trước — URL production có dạng `https://{project-name}.vercel.app`, biết trước để cập nhật vào frontend
3. Khai báo Environment Variables trên Vercel: `GEMINI_API_KEY`, `RAPIDAPI_KEY`
4. Deploy, sau đó cập nhật `AI_BASE_URL` trong `ai-panel.js` thành URL Vercel thật (hiện đang trỏ `https://lyrix-backend.vercel.app`)
5. CORS trên backend đã mở `Access-Control-Allow-Origin: *` để GitHub Pages gọi vào được

---

## 🐛 Xử lý lỗi API

| HTTP Status | Nguyên nhân | Xử lý |
|---|---|---|
| `429` | Vượt quota RapidAPI (free: ~100 req/ngày) hoặc quota Gemini free tier | Toast lỗi / panel báo lỗi |
| `401/403` | API key sai, hết hạn, hoặc dùng nhầm loại key (OAuth thay vì AI Studio key) | Toast lỗi |
| Lỗi kết nối AI trong panel/chat | Backend Vercel chưa chạy hoặc `AI_BASE_URL` sai | "Không thể kết nối AI. Hãy đảm bảo server đang chạy." |
| Khác | Lỗi network / server | Toast lỗi |

> **Tip:** `per_page` Genius tối đa là 5. Nếu truyền cao hơn sẽ nhận lỗi invalid params.

Lỗi CORS Firestore trên Safari local (`firestore.googleapis.com due to access control checks`) là bình thường khi chạy `127.0.0.1` với `get()` — đã khắc phục phần lớn bằng cách chuyển sang `onSnapshot` cho các đọc nhạy cảm với auth; phần còn lại tự hết khi deploy lên domain thật.

---

## 🔮 Hướng phát triển

- [x] Cache sessionStorage giảm số lần gọi API
- [x] Skeleton loading thay cho spinner
- [x] Firebase Auth (Email/Password + Google)
- [x] Lưu user vào Firestore
- [x] Firestore security rules
- [x] Tính năng yêu thích lưu vào Firestore
- [x] Lịch sử xem tự động
- [x] Trang cá nhân (avatar, cover, bio, playlist, ảnh)
- [x] Dynamic `<title>` theo nội dung trang
- [x] Deploy GitHub Pages
- [x] Tách API key ra backend proxy (Express + Vercel)
- [x] Tích hợp Gemini AI — phân tích lyrics, tóm tắt nghệ sĩ, vibe album, gợi ý bài hát, phân tích gu nhạc, chatbot nổi
- [x] Streaming AI response qua SSE
- [x] Trang quản trị (admin dashboard) với thống kê, quản lý user, biểu đồ
- [ ] Phân trang kết quả tìm kiếm
- [ ] Tính năng thêm bài hát vào playlist từ trang chi tiết
- [ ] Rate limiting / cache cho các endpoint Gemini để tiết kiệm quota

---

## 📄 License

MIT — Free to vibe, free to ship. 🚀
