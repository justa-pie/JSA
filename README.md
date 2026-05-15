# 🎵 Lyrix

> Web app tra cứu lời bài hát, thông tin nghệ sĩ và album — powered by **Genius Song Lyrics API** via RapidAPI.

---

## 📁 Cấu trúc thư mục

```
lyrix/
├── index.html                  # Trang chủ / tìm kiếm
├── assets/
│   ├── styles/
│   │   └── style.css           # Global stylesheet
│   ├── js/
│   │   ├── index.js            # Logic trang chủ + tìm kiếm
│   │   ├── charts.js           # Charts (top songs/artists/albums)
│   │   ├── details-song.js     # Chi tiết bài hát + lời nhạc
│   │   ├── details-artist.js   # Chi tiết nghệ sĩ + discography
│   │   ├── details-album.js    # Chi tiết album
│   │   └── navbar-auth.js      # Xử lý auth trên navbar
│   └── images/
│       └── pngtree-song-lyrics-icon-3d-png-image_16634818-2.webp
└── pages/
    ├── charts.html
    ├── details-song.html
    ├── details-artist.html
    └── details-album.html
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

API key và host được khai báo ở đầu mỗi file JS:

```javascript
const API_CONFIG = {
    host: 'genius-song-lyrics1.p.rapidapi.com',
    key: 'YOUR_RAPIDAPI_KEY_HERE',
    baseURL: 'https://genius-song-lyrics1.p.rapidapi.com'
};
```

> ⚠️ **Vibe coding note:** API key hiện đang hardcode trong từng file JS. Khi deploy production, hãy chuyển sang biến môi trường hoặc backend proxy để tránh lộ key.

---

## 🔌 Các Endpoint API đang dùng

### Search
| Endpoint | Dùng trong | Mô tả |
|---|---|---|
| `GET /search` | `index.js` | Tìm kiếm bài hát theo từ khóa |
| `GET /search/multi` | `index.js` | Tìm kiếm đa loại (song/artist/album) |

### Charts
| Endpoint | Dùng trong | Mô tả |
|---|---|---|
| `GET /chart/songs/` | `charts.js` | Top bài hát theo thời kỳ |
| `GET /chart/artists/` | `charts.js` | Top nghệ sĩ theo thời kỳ |
| `GET /chart/albums/` | `charts.js` | Top album theo thời kỳ |

### Details
| Endpoint | Dùng trong | Mô tả |
|---|---|---|
| `GET /song/details/` | `details-song.js` | Chi tiết bài hát |
| `GET /song/lyrics/` | `details-song.js` | Lời bài hát |
| `GET /artist/details/` | `details-artist.js` | Chi tiết nghệ sĩ |
| `GET /artist/songs/` | `details-artist.js` | Danh sách bài hát của nghệ sĩ |
| `GET /artist/albums/` | `details-artist.js` | Danh sách album của nghệ sĩ |
| `GET /album/details/` | `details-album.js` | Chi tiết album |

### Params phổ biến
```
id           → ID của song/artist/album (lấy từ kết quả search hoặc chart)
per_page     → Số item mỗi trang (default: 10–20)
page         → Trang (default: 1)
time_period  → day | week | month | all_time (dùng cho charts)
sort         → popularity | title (dùng cho artist/songs)
```

---

## 🧭 Luồng điều hướng

```
index.html
  ├── Search song        → pages/details-song.html?id={songId}
  ├── Search artist      → pages/details-artist.html?id={artistId}
  ├── Search album       → pages/details-album.html?id={albumId}
  └── → pages/charts.html
            ├── Top Songs  → pages/details-song.html?id={songId}
            ├── Top Artists → pages/details-artist.html?id={artistId}
            └── Top Albums  → pages/details-album.html?id={albumId}
```

---

## 🎨 Thiết kế & Màu sắc

```css
/* Màu nền chính */
background: #0d0b14;

/* Accent chính */
--accent-purple: /* purple gradient */

/* Text */
--text-primary: /* trắng */
--text-secondary: /* muted */
```

Theme tối hoàn toàn. Các class utility hay dùng:
- `.chart-item` — card item trong danh sách
- `.chart-image` / `.chart-image.artist` — thumbnail vuông / tròn
- `.badge-hot` — badge 🔥 HOT/TRENDING
- `.animate-slide-up` — animation vào
- `.btn-gradient` — nút gradient tím
- `.two-column-layout` / `.left-column` / `.right-column` — layout 2 cột chi tiết
- `.lyrics-container` — khung hiển thị lời bài hát / mô tả
- `.credits-section` / `.credits-grid` — phần credits nhạc sĩ/producer

---

## ⚡ Tính năng chính

- **Tìm kiếm** bài hát hoặc tìm kiếm đa loại (song + artist + album) với debounce 400ms
- **Charts** theo thời kỳ: Hôm nay / Tuần / Tháng / Mọi thời đại
- **Chi tiết bài hát:** artwork, lời nhạc, mô tả, thống kê view, credits (nhạc sĩ, producer, featured)
- **Chi tiết nghệ sĩ:** banner, avatar, tiểu sử, top songs, danh sách album với tab switching
- **Chi tiết album:** cover, năm phát hành, mô tả, link Genius
- **Top 3 ranking** được highlight với class `top-1`, `top-2`, `top-3`
- Responsive — mobile navbar tự đóng sau khi chọn

---

## 🚀 Chạy local

Dự án là **pure static HTML** — không cần build step.

```bash
# Dùng bất kỳ static server nào, ví dụ:
npx serve .
# hoặc
python -m http.server 8080
# hoặc Live Server extension trên VS Code
```

Sau đó mở `http://localhost:8080` trên trình duyệt.

> **Lưu ý:** Mở trực tiếp `index.html` bằng `file://` có thể gặp lỗi CORS với một số browser. Dùng local server để tránh vấn đề này.

---

## 🐛 Xử lý lỗi API

Hàm `fetchAPI()` ở mỗi file xử lý các status code phổ biến:

| Status | Nguyên nhân | Hành động |
|---|---|---|
| `429` | Vượt quota RapidAPI | Nâng plan hoặc chờ reset |
| `401/403` | Sai API key | Kiểm tra lại `API_CONFIG.key` |
| Khác | Lỗi network / server | Log ra console, hiển thị error UI |

---

## 🔮 Hướng phát triển

- [ ] Tách `API_CONFIG` ra file config riêng (`config.js`)
- [ ] Thêm local cache (localStorage) để giảm số lần gọi API
- [ ] Lazy loading ảnh với `loading="lazy"`
- [ ] Thêm tính năng yêu thích bài hát (lưu vào Firebase Firestore)
- [ ] Dark/light mode toggle
- [ ] Phân trang cho kết quả tìm kiếm
- [ ] SEO: cập nhật `<title>` và `<meta description>` theo nội dung trang

---

## 📄 License

MIT — Free to vibe, free to ship. 🚀
