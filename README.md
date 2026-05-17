# 🎵 Lyrix

> Web app tra cứu lời bài hát, thông tin nghệ sĩ và album — powered by **Genius Song Lyrics API** via RapidAPI.

---

## 📁 Cấu trúc thư mục

```
lyrix/
├── assets/
│   └── public/
│       └── images/
│           └── logo.webp                   # Logo & favicon
│
├── src/
│   ├── pages/                              # Các trang HTML
│   │   ├── index.html                      # Trang chủ / tìm kiếm
│   │   ├── charts.html                     # Top charts
│   │   ├── details-song.html               # Chi tiết bài hát
│   │   ├── details-artist.html             # Chi tiết nghệ sĩ
│   │   └── details-album.html              # Chi tiết album
│   │
│   ├── scripts/                            # JavaScript
│   │   ├── api/
│   │   │   └── genius.js                   # API config + fetch + cache + helpers
│   │   ├── components/
│   │   │   ├── navbar.js                   # Mobile navbar + scroll effect
│   │   │   └── auth.js                     # Firebase Auth (login / register / Google)
│   │   └── pages/
│   │       ├── index.js                    # Logic trang chủ + tìm kiếm
│   │       ├── charts.js                   # Logic charts
│   │       ├── details-song.js             # Logic chi tiết bài hát
│   │       ├── details-artist.js           # Logic chi tiết nghệ sĩ
│   │       └── details-album.js            # Logic chi tiết album
│   │
│   └── styles/
│       └── main.css                        # Global stylesheet
│
├── firestore.rules                         # Firestore security rules
├── .editorconfig
├── .gitignore
└── README.md
```

---

## 🌐 Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Frontend | Vanilla HTML + CSS + JavaScript |
| Icons | Font Awesome 6.4 |
| Font | Google Fonts (Be Vietnam Pro + Inter) |
| API | [Genius Song Lyrics API](https://rapidapi.com/Glavier/api/genius-song-lyrics1) — RapidAPI |
| Auth | Firebase Authentication (Email/Password + Google) |
| Database | Firebase Firestore |

---

## 🔑 API Configuration

Toàn bộ config tập trung tại `src/scripts/api/genius.js`:

```javascript
const API_CONFIG = {
  host:    'genius-song-lyrics1.p.rapidapi.com',
  key:     'YOUR_RAPIDAPI_KEY_HERE',
  baseURL: 'https://genius-song-lyrics1.p.rapidapi.com'
};
```

> ⚠️ **Lưu ý:** `per_page` tối đa API chấp nhận là **5**. `page` luôn để **1**.

> ⚠️ **Bảo mật:** API key đang hardcode. Khi deploy production, dùng backend proxy để tránh lộ key.

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

---

## 🔌 Endpoints API đang dùng

### Search
| Endpoint | Params | Mô tả |
|---|---|---|
| `GET /search/multi/` | `q`, `per_page=5`, `page=1` | Tìm kiếm đa loại (song / artist / album) |

> Response shape: `{ sections: [ { type: 'song'|'artist'|'album'|'top_hit'|'lyric', hits: [] } ] }`

### Charts
| Endpoint | Params | Mô tả |
|---|---|---|
| `GET /chart/songs/` | `per_page`, `page`, `type=all` | Top bài hát |
| `GET /chart/artists/` | `per_page` | Top nghệ sĩ |
| `GET /chart/albums/` | `per_page`, `time_period` | Top album |

### Details
| Endpoint | Params | Mô tả |
|---|---|---|
| `GET /song/details/` | `id` | Chi tiết bài hát + credits |
| `GET /song/lyrics/` | `id` | Lời bài hát |
| `GET /artist/details/` | `id` | Thông tin nghệ sĩ |
| `GET /artist/songs/` | `id`, `sort=popularity`, `per_page=20` | Bài hát của nghệ sĩ |
| `GET /artist/albums/` | `id`, `per_page=10` | Album của nghệ sĩ |
| `GET /album/details/` | `id` | Chi tiết album + tracklist |

---

## 🔐 Firebase Setup

### 1. Authentication
Bật tại Firebase Console → Authentication → Sign-in method:
- ✅ Email/Password
- ✅ Google

### 2. Firestore
Tạo database, sau đó vào Rules và paste nội dung `firestore.rules`.

Rules cho phép:
- User chỉ đọc/ghi document của chính mình
- Không ai xóa được user
- Chỉ update được `displayName`, `photoURL`, `lastLogin`
- Mọi collection khác đều bị từ chối

### 3. Config trong `auth.js`
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

```html
<!-- 1. Firebase — PHẢI load trước auth.js -->
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js"></script>

<!-- 2. API helper — PHẢI load trước page scripts -->
<script src="../scripts/api/genius.js"></script>

<!-- 3. Page logic -->
<script src="../scripts/pages/[tên-page].js"></script>

<!-- 4. Auth + Navbar — load sau cùng -->
<script src="../scripts/components/auth.js"></script>
<script src="../scripts/components/navbar.js"></script>
```

---

## 🧭 Luồng điều hướng

```
index.html
  ├── Tìm bài hát      → details-song.html?id={songId}
  ├── Tìm nghệ sĩ      → details-artist.html?id={artistId}
  ├── Tìm album        → details-album.html?id={albumId}
  └── → charts.html
          ├── Top Songs   → details-song.html?id={songId}
          ├── Top Artists → details-artist.html?id={artistId}
          └── Top Albums  → details-album.html?id={albumId}
```

---

## 🎨 CSS Utilities

| Class | Mô tả |
|---|---|
| `.chart-item` | Card item trong danh sách |
| `.chart-image` | Thumbnail vuông |
| `.chart-image.artist` | Thumbnail tròn (nghệ sĩ) |
| `.chart-position` | Số thứ hạng |
| `.top-1` `.top-2` `.top-3` | Highlight top 3 (vàng/bạc/đồng) |
| `.badge-hot` | Badge HOT |
| `.badge-brand` | Badge tím Verified |
| `.animate-slide-up` | Animation fade in từ dưới lên |
| `.skeleton` | Skeleton loading animation |
| `.two-column-layout` | Layout 2 cột trang detail |
| `.left-column` `.right-column` | Cột trái / phải |
| `.lyrics-container` | Khung lời bài hát / tiểu sử |
| `.credits-section` `.credits-grid` | Credits nhạc sĩ / producer |
| `.song-detail-header` | Header trang chi tiết bài hát |
| `.artist-detail-header` | Header trang chi tiết nghệ sĩ |
| `.artist-tabs` | Tab Songs / Albums trang nghệ sĩ |
| `.modal-overlay` | Auth modal overlay |
| `.navbar-avatar` | Avatar user trên navbar |
| `.user-dropdown` | Dropdown menu user |

---

## ⚡ Tính năng

- **Tìm kiếm đa loại** (song + artist + album) với debounce 350ms, tab switching
- **Dropdown preview** hiện ngay khi gõ, chỉ gọi API 1 lần nhờ cache chung
- **Session cache** — mọi API call đều cache 30 phút, tránh tốn quota
- **Top Charts** lọc theo loại (songs/artists/albums) và thời kỳ (hôm nay/tuần/tháng/all time)
- **Chi tiết bài hát:** artwork, lời nhạc, popularity bar, credits (writer/producer/featured)
- **Chi tiết nghệ sĩ:** banner, avatar, tiểu sử, social links, tab songs/albums có cache
- **Chi tiết album:** cover, tracklist, artist card
- **Top 3** highlight trophy vàng/bạc/đồng
- **HOT badge** cho bài hát đang tăng trưởng (`stats.hot === true`)
- **Firebase Auth:** đăng nhập Email/Password + Google, lưu user vào Firestore
- **Skeleton loading** trên tất cả các trang
- **Responsive mobile** — navbar collapse, layout 1 cột

---

## 🚀 Chạy local

Dự án là **pure static HTML** — không cần build hay cài package.

```bash
# Live Server (VS Code extension) — recommended
# Hoặc:
npx serve .
# Hoặc:
python -m http.server 8080
```

Truy cập: `http://localhost:8080/src/pages/index.html`

> **Lưu ý:** Không mở file trực tiếp bằng `file://` — browser chặn fetch do CORS.

---

## 🐛 Xử lý lỗi API

| HTTP Status | Nguyên nhân | Xử lý |
|---|---|---|
| `429` | Vượt quota RapidAPI (free: ~100 req/ngày) | Toast lỗi |
| `401/403` | API key sai hoặc hết hạn | Toast lỗi |
| Khác | Lỗi network / server | Toast lỗi |

> **Tip:** `per_page` tối đa là 5. Nếu truyền cao hơn sẽ nhận lỗi invalid params.

---

## 🔮 Hướng phát triển

- [x] Cache sessionStorage giảm số lần gọi API
- [x] Skeleton loading thay cho spinner
- [x] Firebase Auth (Email/Password + Google)
- [x] Lưu user vào Firestore
- [x] Firestore security rules
- [ ] Tính năng yêu thích lưu vào Firestore
- [ ] Tách API key ra backend proxy
- [ ] Cập nhật `<title>` động theo nội dung trang
- [ ] Phân trang kết quả tìm kiếm

---

## 📄 License

MIT — Free to vibe, free to ship. 🚀
