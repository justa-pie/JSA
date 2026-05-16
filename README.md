# 🎵 Lyrix

> Web app tra cứu lời bài hát, thông tin nghệ sĩ và album — powered by **Genius Song Lyrics API** via RapidAPI.

---

## 📁 Cấu trúc thư mục

```
lyrix/
├── assets/
│   └── public/
│       └── images/
│           └── logo.webp               # Logo & favicon
│
├── src/
│   ├── pages/                          # Các trang HTML
│   │   ├── index.html                  # Trang chủ / tìm kiếm
│   │   ├── charts.html                 # Top charts
│   │   ├── details-song.html           # Chi tiết bài hát
│   │   ├── details-artist.html         # Chi tiết nghệ sĩ
│   │   └── details-album.html          # Chi tiết album
│   │
│   ├── scripts/                        # JavaScript
│   │   ├── api/
│   │   │   └── genius.js               # API config + fetchAPI + formatNumber (dùng chung)
│   │   ├── components/
│   │   │   └── navbar.js               # Mobile navbar handler
│   │   └── pages/
│   │       ├── index.js                # Logic trang chủ + tìm kiếm
│   │       ├── charts.js               # Logic charts
│   │       ├── details-song.js         # Logic chi tiết bài hát
│   │       ├── details-artist.js       # Logic chi tiết nghệ sĩ
│   │       └── details-album.js        # Logic chi tiết album
│   │
│   └── styles/
│       └── main.css                    # Global stylesheet
│
├── .editorconfig
├── .gitignore
└── README.md
```

---

## 🌐 Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Frontend | Vanilla HTML + CSS + JavaScript |
| UI Framework | Bootstrap 5.3 |
| Icons | Font Awesome 6.4 |
| Font | Google Fonts (Black Ops One, DM Sans) |
| API | [Genius Song Lyrics API](https://rapidapi.com/Glavier/api/genius-song-lyrics1) — RapidAPI |
| Auth (optional) | Firebase Auth + Firestore |

---

## 🔑 API Configuration

Toàn bộ config API được tập trung tại **một file duy nhất**: `src/scripts/api/genius.js`

```javascript
const API_CONFIG = {
    host: 'genius-song-lyrics1.p.rapidapi.com',
    key: 'YOUR_RAPIDAPI_KEY_HERE',
    baseURL: 'https://genius-song-lyrics1.p.rapidapi.com'
};
```

> ⚠️ **Lưu ý bảo mật:** API key hiện đang hardcode. Khi deploy production, hãy chuyển sang backend proxy để tránh lộ key ra client.

File này cung cấp 3 utility dùng chung cho tất cả page scripts:
- `fetchAPI(endpoint, params)` — wrapper gọi API có xử lý lỗi
- `formatNumber(num)` — format số thành dạng `1.2K`, `3.4M`
- `API_CONFIG` — host, key, baseURL

---

## 🔌 Các Endpoint API đang dùng

### Search
| Endpoint | File | Mô tả |
|---|---|---|
| `GET /search` | `index.js` | Tìm kiếm bài hát theo từ khóa |
| `GET /search/multi` | `index.js` | Tìm kiếm đa loại (song / artist / album) |

### Charts
| Endpoint | File | Mô tả |
|---|---|---|
| `GET /chart/songs/` | `charts.js` | Top bài hát theo thời kỳ |
| `GET /chart/artists/` | `charts.js` | Top nghệ sĩ theo thời kỳ |
| `GET /chart/albums/` | `charts.js` | Top album theo thời kỳ |

### Details
| Endpoint | File | Mô tả |
|---|---|---|
| `GET /song/details/` | `details-song.js` | Chi tiết bài hát |
| `GET /song/lyrics/` | `details-song.js` | Lời bài hát |
| `GET /artist/details/` | `details-artist.js` | Chi tiết nghệ sĩ |
| `GET /artist/songs/` | `details-artist.js` | Danh sách bài hát của nghệ sĩ |
| `GET /artist/albums/` | `details-artist.js` | Danh sách album của nghệ sĩ |
| `GET /album/details/` | `details-album.js` | Chi tiết album |

### Params phổ biến
```
id           → ID của song / artist / album
per_page     → Số item mỗi trang (10–20)
page         → Trang (default: 1)
time_period  → day | week | month | all_time
sort         → popularity | title
```

---

## 🧭 Luồng điều hướng

```
src/pages/index.html
  ├── Tìm bài hát      → details-song.html?id={songId}
  ├── Tìm nghệ sĩ      → details-artist.html?id={artistId}
  ├── Tìm album        → details-album.html?id={albumId}
  └── → charts.html
          ├── Top Songs   → details-song.html?id={songId}
          ├── Top Artists → details-artist.html?id={artistId}
          └── Top Albums  → details-album.html?id={albumId}
```

Tất cả các trang nằm cùng thư mục `src/pages/` nên điều hướng dùng relative path đơn giản:
```javascript
window.location.href = `details-song.html?id=${id}`;
```

---

## 📦 Thứ tự load script trong HTML

Mỗi file HTML load script theo đúng thứ tự sau:

```html
<!-- 1. Bootstrap -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<!-- 2. Firebase (nếu dùng auth) -->
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js"></script>

<!-- 3. API helper — PHẢI load trước page scripts -->
<script src="../scripts/api/genius.js"></script>

<!-- 4. Page logic -->
<script src="../scripts/pages/[tên-page].js"></script>

<!-- 5. Navbar component — load sau cùng -->
<script src="../scripts/components/navbar.js"></script>
```

> `genius.js` bắt buộc phải load **trước** các page script vì chúng phụ thuộc vào `fetchAPI` và `formatNumber`.

---

## 🎨 CSS Utilities hay dùng

| Class | Mô tả |
|---|---|
| `.chart-item` | Card item trong danh sách |
| `.chart-image` | Thumbnail vuông |
| `.chart-image.artist` | Thumbnail tròn (cho nghệ sĩ) |
| `.chart-position` | Số thứ hạng |
| `.top-1` `.top-2` `.top-3` | Highlight top 3 |
| `.badge-hot` | Badge 🔥 HOT / TRENDING |
| `.animate-slide-up` | Animation fade in từ dưới lên |
| `.btn-gradient` | Nút gradient tím |
| `.two-column-layout` | Layout 2 cột trang detail |
| `.left-column` `.right-column` | Cột trái / phải trong layout detail |
| `.lyrics-container` | Khung lời bài hát / mô tả / tiểu sử |
| `.credits-section` `.credits-grid` | Phần credits nhạc sĩ / producer |
| `.song-detail-header` | Header trang chi tiết bài hát |
| `.artist-detail-header` | Header trang chi tiết nghệ sĩ |
| `.artist-tabs` | Tab Songs / Albums trong trang nghệ sĩ |

---

## ⚡ Tính năng

- **Tìm kiếm bài hát** với debounce 400ms, không spam API
- **Tìm kiếm đa loại** (song + artist + album) với tab switching
- **Top Charts** lọc theo: Hôm nay / Tuần / Tháng / Mọi thời đại
- **Chi tiết bài hát:** artwork, lời nhạc, thống kê view, credits (nhạc sĩ, producer, featured)
- **Chi tiết nghệ sĩ:** banner, avatar, tiểu sử, top songs, danh sách album
- **Chi tiết album:** cover, năm phát hành, mô tả, link Genius
- **Top 3 ranking** highlight bằng class `top-1`, `top-2`, `top-3`
- Responsive mobile, navbar tự đóng sau khi chọn link

---

## 🚀 Chạy local

Dự án là **pure static HTML** — không cần build hay cài package.

```bash
# Dùng bất kỳ static server nào:
npx serve .

# hoặc
python -m http.server 8080

# hoặc Live Server extension trên VS Code (recommended)
```

Sau đó truy cập `http://localhost:8080/src/pages/index.html`

> **Lưu ý:** Không mở file trực tiếp bằng `file://` — một số browser chặn fetch request do CORS. Luôn dùng local server.

---

## 🐛 Xử lý lỗi API

`fetchAPI()` trong `genius.js` xử lý tập trung các lỗi:

| HTTP Status | Nguyên nhân | Xử lý |
|---|---|---|
| `429` | Vượt quota RapidAPI | Báo lỗi, gợi ý nâng plan |
| `401` / `403` | Sai hoặc hết hạn API key | Báo lỗi xác thực |
| Khác | Lỗi network / server | Log console, hiển thị UI lỗi |

---

## 🔮 Hướng phát triển

- [ ] Tách API key ra file `.env` hoặc dùng backend proxy
- [ ] Cache kết quả vào `sessionStorage` để giảm số lần gọi API
- [ ] Cập nhật `<title>` động theo nội dung trang (SEO)
- [ ] Thêm tính năng yêu thích lưu vào Firebase Firestore
- [ ] Phân trang cho kết quả tìm kiếm
- [ ] Skeleton loading thay cho spinner

---

## 📄 License

MIT — Free to vibe, free to ship. 🚀
