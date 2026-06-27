# Lyrix — Tổng hợp Codebase

> File này ghi lại toàn bộ code, luồng xử lý, và các pattern quan trọng của dự án Lyrix.
> Dùng làm tài liệu tham chiếu khi cần debug, mở rộng, hoặc hỏi AI về bất kỳ phần nào.

---

## Mục lục

1. [Cấu trúc dự án](#1-cấu-trúc-dự-án)
2. [genius.js — API helper & cache](#2-geniusjs--api-helper--cache)
3. [server.js — Backend Express + Gemini](#3-serverjs--backend-express--gemini)
4. [ai-panel.js — Module LyrixAI (IIFE)](#4-ai-paneljs--module-lyrixai-iife)
5. [auth.js — Firebase Auth](#5-authjs--firebase-auth)
6. [navbar.js — Loader + Navbar inject](#6-navbarjs--loader--navbar-inject)
7. [index.js — Trang chủ + Tìm kiếm](#7-indexjs--trang-chủ--tìm-kiếm)
8. [details-song.js — Chi tiết bài hát](#8-details-songjs--chi-tiết-bài-hát)
9. [details-artist.js — Chi tiết nghệ sĩ](#9-details-artistjs--chi-tiết-nghệ-sĩ)
10. [details-album.js — Chi tiết album](#10-details-albumjs--chi-tiết-album)
11. [charts.js — Top Charts](#11-chartsjs--top-charts)
12. [profile.js — Trang cá nhân](#12-profilejs--trang-cá-nhân)
13. [admin.js — Admin Dashboard](#13-adminjs--admin-dashboard)
14. [Luồng xử lý quan trọng](#14-luồng-xử-lý-quan-trọng)
15. [Patterns & gotchas](#15-patterns--gotchas)

---

## 1. Cấu trúc dự án

```
JSA/
├── index.html                          ← Entry point GitHub Pages (root)
├── assets/public/images/logo.webp
├── src/
│   ├── pages/
│   │   ├── charts.html
│   │   ├── details-song.html
│   │   ├── details-artist.html
│   │   ├── details-album.html
│   │   ├── profile.html
│   │   └── admin.html
│   ├── scripts/
│   │   ├── api/genius.js               ← fetchAPI, fetchCached, helpers
│   │   ├── components/
│   │   │   ├── navbar.js               ← Loader + Navbar inject + auth bridge
│   │   │   ├── auth.js                 ← Firebase Auth + Firestore helpers
│   │   │   └── ai-panel.js             ← LyrixAI IIFE module
│   │   └── pages/
│   │       ├── index.js
│   │       ├── charts.js
│   │       ├── details-song.js
│   │       ├── details-artist.js
│   │       ├── details-album.js
│   │       ├── profile.js
│   │       └── admin.js
│   └── styles/main.css
└── server/
    ├── server.js                       ← Express backend (deploy Vercel)
    ├── package.json
    └── vercel.json
```

**Quy tắc path:**
- `index.html` ở root → dùng `src/scripts/...` và `src/pages/...`
- Các trang trong `src/pages/` → dùng `../../` để trỏ về root, `../scripts/...` cho scripts

**Thứ tự load script (trang có AI):**
```html
<script> Firebase (app + auth + firestore) </script>
<script> genius.js </script>
<script> ai-panel.js </script>        <!-- trước page script -->
<script> details-song.js </script>    <!-- page script cuối -->
<script> auth.js </script>
<script> navbar.js </script>
```

---

## 2. genius.js — API helper & cache

**Vị trí:** `src/scripts/api/genius.js`  
**Scope:** Global (không module) — các hàm dùng được ở mọi page script.

### Config

```javascript
const PROXY_BASE = "https://lyrix-backend.vercel.app";
```

### fetchAPI(endpoint, params)

Gọi backend proxy `/genius?endpoint=...`, ném lỗi nếu HTTP không OK.

```javascript
async function fetchAPI(endpoint, params = {}) {
    const url = new URL(PROXY_BASE + "/genius");
    url.searchParams.append("endpoint", endpoint);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "")
            url.searchParams.append(k, v);
    });

    const res = await fetch(url.toString());
    const text = await res.text();

    if (!res.ok) {
        if (res.status === 429) throw new Error("Vượt quota API. Thử lại sau.");
        if (res.status === 401 || res.status === 403)
            throw new Error("API key sai hoặc hết hạn.");
        throw new Error(`HTTP ${res.status}`);
    }
    return JSON.parse(text);
}
```

### fetchCached(cacheKey, endpoint, params)

Wrapper của `fetchAPI` với sessionStorage TTL 30 phút.

```javascript
const CACHE_TTL = 30 * 60 * 1000;

async function fetchCached(cacheKey, endpoint, params = {}) {
    const cached = sessionGet(cacheKey);
    if (cached) return cached;
    const data = await fetchAPI(endpoint, params);
    sessionSet(cacheKey, data);
    return data;
}

function sessionSet(key, data) {
    sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
}

function sessionGet(key) {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(key); return null; }
    return data;
}
```

### Utility helpers

```javascript
// Format số: 1200 → "1.2K", 3400000 → "3.4M"
function formatNumber(num) { ... }

// Trả ảnh hoặc SVG placeholder (♪ icon)
function safeImg(src) { ... }

// HTML → plain text (xử lý <br>, </p>, entities)
function stripHtml(html) { ... }

// Toast lỗi (tự xoá sau 5s)
function showError(msg) { ... }
```

### Cache key conventions

| Trang | Key pattern |
|---|---|
| Tìm kiếm dropdown/full | `search_${q}` |
| Chi tiết bài hát | `song_detail_${id}`, `song_lyrics_${id}` |
| Chi tiết nghệ sĩ | `artist_detail_${id}`, `artist_songs_${id}`, `artist_albums_${id}` |
| Chi tiết album | `album_detail_${id}` |
| Charts | `chart_${type}_${timePeriod}` |
| Trending trang chủ | `lyrix_trending`, `lyrix_artists` |
| iTunes track lookup | `itunes_tracks_${name}_${artist}` |
| Genius ID lookup từ iTunes track | `genius_id_${title}_${artist}` |

---

## 3. server.js — Backend Express + Gemini

**Vị trí:** `server/server.js`  
**Runtime:** Node.js ESM (`"type": "module"`)  
**Deploy:** Vercel — `https://lyrix-backend.vercel.app`

### Setup

```javascript
import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();
const app = express();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(express.json());
app.use((req, res, next) => {   // CORS mở hoàn toàn cho GitHub Pages
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
});

export default app;   // Vercel yêu cầu export default
```

### Genius Proxy — GET /genius

```javascript
app.get("/genius", async (req, res) => {
    const { endpoint, ...params } = req.query;
    const url = new URL("https://genius-song-lyrics1.p.rapidapi.com" + endpoint);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));

    const apiRes = await fetch(url.toString(), {
        headers: {
            "x-rapidapi-host": "genius-song-lyrics1.p.rapidapi.com",
            "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        },
    });
    res.json(JSON.parse(await apiRes.text()));
});
```

### streamToSSE(res, prompt) — Helper dùng chung

```javascript
async function streamToSSE(res, prompt) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await ai.models.generateContentStream({
        model: "gemini-3.5-flash",
        contents: prompt,
    });

    for await (const chunk of stream) {
        const text = chunk.text;
        if (text) res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
}
```

**SSE format:**
```
data: {"chunk": "đoạn text..."}\n\n
data: {"chunk": "tiếp theo..."}\n\n
data: {"done": true}\n\n
// hoặc lỗi:
data: {"error": "Gemini API thất bại."}\n\n
```

### Các AI endpoints

| Method | Path | Body | Trang gọi |
|---|---|---|---|
| POST | `/api/lyrics/analyze` | `{ title, artist, lyrics }` | details-song |
| POST | `/api/artist/summary` | `{ name, bio }` | details-artist |
| POST | `/api/album/vibe` | `{ title, artist, releaseDate, tracks[] }` | details-album |
| POST | `/api/song/similar` | `{ title, artist, tags }` | details-song |
| POST | `/api/profile/taste` | `{ favorites[], history[] }` | profile |
| POST | `/api/chat` | `{ message, context: {title, artist, page} }` | chatbot (mọi trang AI) |

### vercel.json

```json
{
    "version": 2,
    "builds": [{ "src": "server.js", "use": "@vercel/node" }],
    "routes": [
        { "src": "/genius(.*)", "dest": "server.js" },
        { "src": "/api/(.*)", "dest": "server.js" }
    ]
}
```

---

## 4. ai-panel.js — Module LyrixAI (IIFE)

**Vị trí:** `src/scripts/components/ai-panel.js`  
**Pattern:** IIFE trả về object public API → `window.LyrixAI`

```javascript
const LyrixAI = (() => {
    const AI_BASE_URL = "https://lyrix-backend.vercel.app";
    // ... private functions ...
    return { initLyricsAnalyze, initSimilarSongs, initArtistSummary,
             initAlbumVibe, initTasteAnalysis, initFloatingChat };
})();
```

### renderMarkdown(text)

Parser markdown thủ công — chạy client-side, không dùng thư viện:

```javascript
function renderMarkdown(text) {
    return text
        .replace(/^## (.+)$/gm, '<h3 class="ai-heading">$1</h3>')
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/^→ (.+)$/gm, '<p class="ai-arrow">→ $1</p>')
        .replace(/^- (.+)$/gm, "<li>$1</li>")
        .replace(/(<li>[\s\S]+?<\/li>)/g, "<ul>$1</ul>")
        .replace(/<\/ul>\s*<ul>/g, "")    // gộp các <ul> liền kề
        .replace(/\n\n+/g, "</p><p>")
        .replace(/^(?!<[hupli])(.+)$/gm, m => m.trim() ? `<p>${m}</p>` : "")
        .replace(/<p><\/p>/g, "");
}
```

### createPanel(title)

Tạo slide-in panel, append vào body, tự xoá khi đóng:

```javascript
function createPanel(title) {
    document.getElementById("lyrix-ai-panel")?.remove();  // chỉ 1 panel tại 1 thời điểm
    const panel = document.createElement("div");
    panel.id = "lyrix-ai-panel";
    panel.className = "ai-panel";
    // ... innerHTML với header + loading dots + content div
    document.body.appendChild(panel);
    // Double rAF để trigger CSS transition
    requestAnimationFrame(() => {
        requestAnimationFrame(() => panel.classList.add("ai-panel--open"));
    });
    return panel;
}
```

### streamToPanel(endpoint, body, panel) — SSE → Panel

```javascript
async function streamToPanel(endpoint, body, panel) {
    const res = await fetch(`${AI_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const content = startStream(panel);   // ẩn loading dots, hiện content div
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let rawText = "";
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop();   // giữ lại phần chưa hoàn chỉnh

        for (const event of events) {
            const line = event.trim();
            if (!line.startsWith("data:")) continue;
            const json = JSON.parse(line.slice(5).trim());

            if (json.chunk) {
                rawText += json.chunk;
                content.innerHTML = renderMarkdown(rawText);  // re-render toàn bộ mỗi chunk
                panel.querySelector(".ai-panel-body").scrollTop = 99999;
            }
        }
    }
}
```

### streamToChat(endpoint, body, msgEl) — SSE → Chat bubble

Tương tự `streamToPanel` nhưng render plain text (không markdown) vào một DOM element:

```javascript
async function streamToChat(endpoint, body, msgEl) {
    // ... setup reader tương tự ...
    msgEl.textContent = "";
    // mỗi chunk: fullText += json.chunk; msgEl.textContent = fullText;
}
```

### Public API — cách gọi từ page scripts

```javascript
// details-song.js
LyrixAI.initLyricsAnalyze({ title, artist, lyrics, container: aiRow });
LyrixAI.initSimilarSongs({ title, artist, tags, container: aiRow });
LyrixAI.initFloatingChat({ page: "Chi tiết bài hát", title, artist });

// details-artist.js
LyrixAI.initArtistSummary({ name, bio, container: aiRow });
LyrixAI.initFloatingChat({ page: "Chi tiết nghệ sĩ", title: a.name, artist: a.name });

// details-album.js
LyrixAI.initAlbumVibe({ title, artist, releaseDate, tracks: [...], container: aiRow });
LyrixAI.initFloatingChat({ page: "Chi tiết album", title, artist });

// profile.js
LyrixAI.initTasteAnalysis({ favorites: [...], history: [...], container });
LyrixAI.initFloatingChat({ page: "Trang cá nhân", title: displayName, artist: "" });
```

### Floating Chatbot

```javascript
function initFloatingChat(context = {}) {
    if (document.getElementById("lyrix-chat-fab")) return;  // guard chống init 2 lần
    // Tạo FAB button + chat window
    // form.addEventListener("submit") → appendMsg user → appendMsg AI (streaming)
    // streamToChat("/api/chat", { message, context }, aiMsg)
    // context = { title, artist, page } → server dùng để viết system prompt sát ngữ cảnh
}
```

Chat bubble trạng thái streaming có class `chat-msg--streaming` (dùng để CSS hiện cursor nhấp nháy).

---

## 5. auth.js — Firebase Auth

**Vị trí:** `src/scripts/components/auth.js`

### Firebase config

```javascript
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyANhY8Ze06tNkGF2MQmujPY2gXsMgIYMG4",
    authDomain: "lyrix-b258b.firebaseapp.com",
    projectId: "lyrix-b258b",
    storageBucket: "lyrix-b258b.firebasestorage.app",
    messagingSenderId: "586165994873",
    appId: "1:586165994873:web:7a48b5181409abfe459ba8",
};
if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();
```

### localStorage cache (avatar + role)

Tránh phải chờ Firestore mỗi lần load trang:

```javascript
function cacheGet(uid, key) {
    return localStorage.getItem("lyrix_" + key + "_" + uid) || null;
}
function cacheSet(uid, key, val) {
    val ? localStorage.setItem(...) : localStorage.removeItem(...);
}
function cacheClear(uid) {
    localStorage.removeItem("lyrix_avatarUrl_" + uid);
    localStorage.removeItem("lyrix_role_" + uid);
}
```

### NavBar bridge — auth.js ↔ navbar.js

```javascript
// auth.js gọi hàm này sau khi resolve user
function callNavBar(user, role, avatarUrl) {
    if (window.NavBar && window.NavBar.ready) {
        window.NavBar.ready(user, role, avatarUrl);
    } else {
        // navbar.js chưa load xong → queue lại
        window._navBarQueue = { user, role, avatarUrl };
    }
}

// navbar.js flush queue ở cuối init:
if (window._navBarQueue) {
    const q = window._navBarQueue;
    window._navBarQueue = null;
    window.NavBar.ready(q.user, q.role, q.avatarUrl);
}
```

### onAuthStateChanged flow

```javascript
auth.onAuthStateChanged((user) => {
    if (user) {
        // ❶ Dùng cache ngay → navbar update tức thì
        const cachedAvatar = cacheGet(user.uid, "avatarUrl") || user.photoURL;
        const cachedRole = cacheGet(user.uid, "role") || "user";
        callNavBar(user, cachedRole, cachedAvatar);
        closeAuthModal();

        // ❷ Subscribe Firestore realtime → cập nhật cache + navbar khi có data mới
        subscribeUserDoc(user);
    } else {
        callNavBar(null, null, null);
    }
});
```

### subscribeUserDoc — Firestore onSnapshot

```javascript
function subscribeUserDoc(user) {
    _firestoreUnsub = db.collection("users").doc(user.uid)
        .onSnapshot((doc) => {
            const data = doc.exists ? doc.data() : {};
            const avatarUrl = data.avatarUrl || user.photoURL || null;
            const role = data.role || "user";
            cacheSet(user.uid, "avatarUrl", avatarUrl);
            cacheSet(user.uid, "role", role);
            callNavBar(user, role, avatarUrl);
        }, (err) => {
            // CORS/offline → giữ cache, không crash
        });
}
```

### saveUserToFirestore(user, displayName)

Gọi khi register hoặc Google Sign In. Dùng `merge: true` → không ghi đè dữ liệu cũ:

```javascript
async function saveUserToFirestore(user, displayName) {
    await db.collection("users").doc(user.uid).set({
        uid: user.uid,
        displayName: displayName || user.displayName || "",
        email: user.email,
        photoURL: user.photoURL || "",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        // LƯU Ý: role KHÔNG được set ở đây
        // → role: "user" phải được thêm thủ công vào Firestore nếu cần phân quyền
    }, { merge: true });
}
```

> ⚠️ **Gotcha:** `role: "user"` không được write tại đây. Nếu admin dashboard dựa vào `role` để lọc, cần thêm `role: "user"` vào `saveUserToFirestore` hoặc set thủ công trên Firestore Console.

### toggleFavorite / checkFavorite / addToHistory

Expose ra `window.*` để page scripts gọi được:

```javascript
window.toggleFavorite = async function(songData) {
    // songData: { songId, title, artist, artUrl }
    const ref = db.collection("users").doc(uid).collection("favorites").doc(String(songData.songId));
    const snap = await ref.get();
    if (snap.exists) { await ref.delete(); return false; }
    else { await ref.set({ ...songData, savedAt: serverTimestamp() }); return true; }
};

window.checkFavorite = async function(songId) {
    // return true/false
};

window.addToHistory = async function(songData) {
    await db.collection("users").doc(uid).collection("history").doc(String(songData.songId))
        .set({ ...songData, viewedAt: serverTimestamp() }, { merge: true });
};
```

---

## 6. navbar.js — Loader + Navbar inject

**Vị trí:** `src/scripts/components/navbar.js`  
**Pattern:** IIFE tự chạy.

### Loader

Inject `#page-loader` vào đầu body ngay khi script load. `NavBar.hideLoader()` được gọi bởi auth.js sau khi resolve user.

### Navbar inject

Tự inject `<nav id="navbar">` nếu chưa tồn tại. Admin page tự có navbar riêng nên không inject đè.

```javascript
const inPages = window.location.pathname.includes("/src/pages/");
const root = inPages ? "../../" : "";
const pagesDir = inPages ? "" : "src/pages/";
```

### NavBar.ready(user, role, avatarUrl)

Được auth.js gọi sau khi resolve user. Cập nhật UI navbar:
- `user !== null` → ẩn login button, hiện avatar button
- `role === "admin"` → thêm link "Dashboard" vào navbar
- `avatarUrl` → hiện ảnh, không có → hiện initial letter

### Fallback loader timeout

```javascript
setTimeout(() => {
    if (document.getElementById("page-loader")) NavBar.hideLoader();
}, 5000);
```

---

## 7. index.js — Trang chủ + Tìm kiếm

**Vị trí:** `src/scripts/pages/index.js`

### Search flow

```
User gõ
  → input event → clearTimeout → debounceTimer = setTimeout(fetchDropdown, 350ms)
  → fetchDropdown(q) → fetchCached("search_${q}", /search/multi/, {per_page:5})
  → render dropdown (top 5 songs, preview)

User nhấn Enter / click "Xem tất cả"
  → triggerSearch(q)
  → clearTimeout(debounceTimer)     ← tránh race condition
  → closeDropdown() + showSkeleton()
  → fetchCached("search_${q}", ...)  ← dùng chung cache key với dropdown
  → parse sections → lastResults = { song:[], artist:[], album:[] }
  → renderResults(currentTab)
```

### Dedupe top_hit

```javascript
const topSec = sections.find(s => s.type === "top_hit");
topSec?.hits.forEach(h => {
    const bucket = lastResults[h.type];  // h.type = "song" | "artist" | "album"
    if (!bucket.some(x => x.result?.id === h.result?.id))
        bucket.unshift(h);   // thêm vào đầu nếu chưa có
});
```

### Tab switching

```javascript
const TAB_KEY = { songs: "song", artists: "artist", albums: "album" };
// currentTab ("songs"/"artists"/"albums") → lookup trong lastResults[TAB_KEY[tab]]
```

### Trending & Top Artists

```javascript
// Dùng fetchAPI thẳng (không fetchCached) nhưng cache thủ công bằng sessionGet/Set
const cached = sessionGet("lyrix_trending");
const items = cached || (await fetchAPI("/chart/songs/", { per_page: 8, page: 1, type: "all" }))?.chart_items || [];
if (!cached && items.length) sessionSet("lyrix_trending", items);
```

---

## 8. details-song.js — Chi tiết bài hát

**Vị trí:** `src/scripts/pages/details-song.js`

### Parallel fetch

```javascript
const [detailData, lyricsData] = await Promise.all([
    fetchCached(`song_detail_${songId}`, "/song/details/", { id: songId }),
    fetchCached(`song_lyrics_${songId}`, "/song/lyrics/", { id: songId }),
]);
```

### Lyrics extraction

```javascript
const lyricsRaw = lyricsData?.lyrics?.lyrics?.body?.html || "";
const lyricsText = stripHtml(lyricsRaw) || "Lời bài hát chưa có sẵn.";
```

### Ghi lịch sử — auth-gated

```javascript
firebase.auth().onAuthStateChanged((user) => {
    if (user && typeof addToHistory === "function") {
        addToHistory(songMeta);
    }
});
// KHÔNG dùng setTimeout vì race condition với auth state
```

### Favorite button flow

```javascript
// Sau khi render xong, kiểm tra trạng thái yêu thích
setTimeout(async () => {
    if (typeof checkFavorite === "function") {
        const isFav = await checkFavorite(s.id);
        updateFavBtn(isFav);
    }
}, 600);  // delay để chắc auth.js đã resolve

// handleFavorite → toggleFavorite → updateFavBtn(added) + toast
window._currentSongMeta = songMeta;   // lưu để handleFavorite truy cập
```

### iTunes Preview Player

```javascript
// 1. Fetch preview URL từ iTunes Search API (không cần key, CORS-ok)
async function fetchItunesPreview(songTitle, artistName) {
    const q = encodeURIComponent(`${songTitle} ${artistName}`);
    const res = await fetch(`https://itunes.apple.com/search?term=${q}&media=music&entity=song&limit=5`);
    const data = await res.json();
    const match = data.results.find(r => r.artistName.toLowerCase().includes(artistName.toLowerCase()))
                  || data.results[0];
    return match.previewUrl || null;
}

// 2. Render player với <audio> element
// Controls: play/pause, progress bar click-to-seek, volume slider, volume icon toggle mute
// Events: timeupdate → fill width + time display; ended → reset UI
```

### AI integration

```javascript
if (typeof LyrixAI !== "undefined") {
    const aiRow = document.getElementById("aiButtonsRow");
    LyrixAI.initLyricsAnalyze({ title, artist, lyrics: lyricsText, container: aiRow });
    LyrixAI.initSimilarSongs({ title, artist, tags: s.tags?.join(", ") || "", container: aiRow });
    LyrixAI.initFloatingChat({ page: "Chi tiết bài hát", title, artist });
}
```

---

## 9. details-artist.js — Chi tiết nghệ sĩ

**Vị trí:** `src/scripts/pages/details-artist.js`

### Tab Songs/Albums — lazy load

```javascript
let cachedSongs = null;
let cachedAlbums = null;

async function loadSongs() {
    if (cachedSongs) { renderSongs(cachedSongs); return; }
    const data = await fetchCached(`artist_songs_${artistId}`, "/artist/songs/",
        { id: artistId, sort: "popularity", per_page: 20 });
    cachedSongs = data?.songs || [];
    renderSongs(cachedSongs);
}

window.showTab = function(tab) {
    // Toggle active class trên tab buttons
    // Show skeleton → load data
    if (tab === "songs") loadSongs();
    else loadAlbums();
};
```

### Banner image

```javascript
// API trả về header_image_url cho banner
if (a.header_image_url) {
    bannerEl.style.backgroundImage = `url('${a.header_image_url}')`;
}
// CSS overlay: linear-gradient(to bottom, transparent 40%, var(--surface) 100%)
// → làm mờ dần xuống dưới để text đọc được
```

---

## 10. details-album.js — Chi tiết album

**Vị trí:** `src/scripts/pages/details-album.js`

### Genius tracks vs iTunes fallback

```javascript
const geniusTracks = al.tracks || [];

if (geniusTracks.length) {
    // Render Genius tracks → click thẳng đến details-song.html?id=...
    renderGeniusTracks(geniusTracks, al);
} else {
    // Genius không có tracklist → fetch iTunes
    fetchItunesTracks(al.name, al.artist?.name).then(itunesTracks => {
        renderItunesTracks(itunesTracks, al);
        // Update AI với track names từ iTunes
    });
}
```

### iTunes track flow (2 bước)

```javascript
async function fetchItunesTracks(albumName, artistName) {
    // Bước 1: search album → lấy collectionId
    const searchRes = await fetch(`https://itunes.apple.com/search?term=${q}&entity=album&limit=3`);
    const match = searchData.results.find(r => r.collectionName.includes(albumName));

    // Bước 2: lookup tracklist từ collectionId
    const lookupRes = await fetch(`https://itunes.apple.com/lookup?id=${match.collectionId}&entity=song`);
    return lookupRes.results.filter(r => r.wrapperType === "track" && r.kind === "song")
        .map(r => ({ trackNumber, trackName, durationMs, previewUrl, artworkUrl }));
}
```

### navigateToSong — khi click iTunes track

```javascript
window.navigateToSong = async function(encodedTitle, encodedArtist, el) {
    // Search Genius để lấy ID
    const data = await fetchAPI("/search/multi/", { q: `${title} ${artist}`, per_page: 5 });
    const hit = data.sections.find(s => s.type === "song")?.hits[0]?.result;
    if (hit?.id) {
        sessionStorage.setItem(`genius_id_${title}_${artist}`, hit.id);
        window.location.href = `details-song.html?id=${hit.id}`;
    } else {
        // Fallback → trang chủ search
        window.location.href = `../../index.html?q=${encodeURIComponent(title + " " + artist)}`;
    }
};
```

---

## 11. charts.js — Top Charts

**Vị trí:** `src/scripts/pages/charts.js`

### State

```javascript
let chartType = "songs";    // "songs" | "artists" | "albums"
let timePeriod = "day";     // "day" | "week" | "month" | "all_time"
```

### loadChart()

```javascript
async function loadChart() {
    showSkeleton();
    const endpointMap = {
        songs: "/chart/songs/",
        artists: "/chart/artists/",
        albums: "/chart/albums/",
    };
    const params = { per_page: 20, page: 1 };
    if (chartType !== "artists") params.time_period = timePeriod;
    if (chartType === "songs") params.type = "all";
    // artists không hỗ trợ time_period → bỏ qua

    const data = await fetchCached(`chart_${chartType}_${timePeriod}`, endpoint, params);
    const items = data?.chart_items || [];
    // render items...
}
```

### Trophy icons

```javascript
const trophy =
    pos === 1 ? '<i class="fa-solid fa-trophy" style="color:#fbbf24"></i>'  // vàng
  : pos === 2 ? '<i class="fa-solid fa-trophy" style="color:#94a3b8"></i>'  // bạc
  : pos === 3 ? '<i class="fa-solid fa-trophy" style="color:#cd7c2f"></i>'  // đồng
  : pos;
```

---

## 12. profile.js — Trang cá nhân

**Vị trí:** `src/scripts/pages/profile.js`

### Auth gate

```javascript
document.addEventListener("DOMContentLoaded", () => {
    const timeout = setTimeout(() => window.location.href = "index.html", 3500);
    const checkAuth = setInterval(() => {
        if (typeof firebase === "undefined") return;
        clearInterval(checkAuth);
        clearTimeout(timeout);
        firebase.auth().onAuthStateChanged(user => {
            if (!user) { window.location.href = "index.html"; return; }
            currentUser = user;
            initProfile(user);
        });
    }, 100);
});
```

### Image resize — fileToBase64

Resize ảnh về maxPx trước khi lưu Firestore (tiết kiệm dung lượng):

```javascript
function fileToBase64(file, maxPx, quality = 0.82) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                // Tính toán scale giữ tỉ lệ
                if (width > maxPx || height > maxPx) {
                    if (width > height) { height = Math.round(height/width*maxPx); width = maxPx; }
                    else { width = Math.round(width/height*maxPx); height = maxPx; }
                }
                const canvas = document.createElement("canvas");
                canvas.width = width; canvas.height = height;
                canvas.getContext("2d").drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", quality));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Constants:
const AVATAR_MAX_PX = 300;   // avatar nhỏ
const PHOTO_MAX_PX = 900;    // ảnh album lớn hơn
const PHOTO_QUALITY = 0.78;
```

### Tabs: favorites / history / playlists / photos

```javascript
let currentTab = "favorites";

// Mỗi tab có hàm load riêng:
// loadFavorites() → db.collection("users").doc(uid).collection("favorites")
//   .orderBy("savedAt", "desc").get()
// loadHistory() → collection("history").orderBy("viewedAt", "desc")
// loadPlaylists() → collection("playlists").orderBy("createdAt", "desc")
// loadPhotos() → collection("photos").orderBy("uploadedAt", "desc")
```

### Avatar sync với navbar

```javascript
function renderAvatar() {
    // ... render avatar vào #profileAvatar ...
    if (window.NavBar && currentUser) {
        NavBar.ready(currentUser, profileData.role || "user", avatarUrl || null);
    }
}
```

### AI Taste Analysis

```javascript
LyrixAI.initTasteAnalysis({
    favorites: favoritesArray.slice(0, 20),  // max 20 items gửi lên
    history: historyArray.slice(0, 20),
    container: aiContainer,
});
```

---

## 13. admin.js — Admin Dashboard

**Vị trí:** `src/scripts/pages/admin.js`

### Role check

```javascript
firebase.auth().onAuthStateChanged(async user => {
    if (!user) { redirect(); return; }
    const doc = await db.collection("users").doc(user.uid).get();
    if (doc.data()?.role !== "admin") {
        await auth.signOut();
        showMessage("Tài khoản không có quyền admin");
        redirect();
    }
});
```

### Fetch all users + subcollections

```javascript
// Lấy toàn bộ users
const usersSnap = await db.collection("users").get();

// Với mỗi user: đếm số favorites, history, playlists
const [favSnap, histSnap, playSnap] = await Promise.all([
    db.collection("users").doc(uid).collection("favorites").get(),
    db.collection("users").doc(uid).collection("history").get(),
    db.collection("users").doc(uid).collection("playlists").get(),
]);
```

### Chart — User signups theo ngày

```javascript
// Dùng Canvas API (Chart.js hoặc vẽ tay) để vẽ biểu đồ
// Data: nhóm users theo createdAt (ngày/tuần/tháng/năm)
```

### Delete operations

```javascript
// Xoá user: xoá document trong "users" collection
// Xoá favorites: batch delete toàn bộ docs trong subcollection
// Firestore không hỗ trợ xoá collection trực tiếp → phải query rồi batch delete từng doc
const batch = db.batch();
snap.docs.forEach(doc => batch.delete(doc.ref));
await batch.commit();
```

---

## 14. Luồng xử lý quan trọng

### A. Page load → Navbar + Auth resolve

```
HTML parse
  → Firebase scripts load
  → genius.js load (global functions available)
  → ai-panel.js load (LyrixAI available)
  → page script load (bắt đầu fetch data)
  → auth.js load
      → firebase.initializeApp()
      → onAuthStateChanged fires
          → ❶ callNavBar(user, cachedRole, cachedAvatar)  [từ localStorage]
          → ❷ subscribeUserDoc(user)                      [Firestore realtime]
  → navbar.js load
      → inject loader + navbar vào DOM
      → kiểm tra window._navBarQueue → flush nếu có
      → NavBar.ready() → cập nhật UI, hideLoader()
```

### B. SSE Streaming flow

```
Frontend                          Backend (Vercel)                    Gemini
   │                                     │                               │
   │─── POST /api/lyrics/analyze ───────>│                               │
   │    { title, artist, lyrics }        │── generateContentStream() ──>│
   │                                     │                               │
   │<── Content-Type: text/event-stream ─│                               │
   │<── data: {"chunk":"Chủ đề"}\n\n ───│<── chunk ─────────────────────│
   │    [render markdown live]           │                               │
   │<── data: {"chunk":" & cảm"}\n\n ───│<── chunk ─────────────────────│
   │    [re-render toàn bộ rawText]      │                               │
   │<── data: {"done":true}\n\n ─────────│<── stream end ─────────────────│
   │                                     │                               │
```

**Client đọc SSE:**
```javascript
const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = "";

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop();   // ← phần chưa hoàn chỉnh
    for (const event of events) {
        // parse "data: {...}" → json.chunk
    }
}
```

### C. Search với debounce

```
keystroke
  → clearTimeout(debounceTimer)
  → [nếu Enter] clearTimeout lại + triggerSearch ngay (không chờ debounce)
  → [nếu gõ bình thường] debounceTimer = setTimeout(fetchDropdown, 350)

350ms trôi qua mà không có keystroke mới
  → fetchDropdown(q)
  → fetchCached("search_${q}", /search/multi/, {per_page:5})
  → render dropdown

triggerSearch(q)
  → closeDropdown()
  → hideResults()          ← ẩn kết quả cũ ngay
  → showSkeletonResults()
  → fetchCached("search_${q}", ...)   ← SAME cache key → cache HIT nếu dropdown đã fetch
  → renderResults(currentTab)
```

### D. Favorites toggle

```
click ❤️
  → handleFavorite()
  → kiểm tra firebase.auth().currentUser
      → null: openAuthModal("login")
      → có user: btn.disabled = true + spinner
          → toggleFavorite(songMeta)
              → ref.get() → exists ? ref.delete() : ref.set()
              → return true (added) / false (removed)
          → updateFavBtn(added)
          → toast notification
          → btn.disabled = false
```

### E. iTunes Preview Player

```
renderPreviewPlayer(title, artist)
  → hiện skeleton
  → fetchItunesPreview(title, artist)
      → iTunes Search API (CORS-ok, no key)
      → tìm match theo artistName
      → return previewUrl hoặc null
  → null: hiện "Không tìm thấy bản nghe thử"
  → có URL: render <audio> + custom player UI
      → play/pause button
      → progress bar (click-to-seek)
      → volume slider + mute toggle
```

---

## 15. Patterns & gotchas

### API — Genius limits

```javascript
// per_page tối đa là 5 — truyền cao hơn → lỗi
fetchAPI("/search/multi/", { q, per_page: 5, page: 1 })

// Response shape search — KHÔNG có wrapper "response":
// { sections: [ { type: "song"|"artist"|"album"|"top_hit"|"lyric", hits: [] } ] }

// section.type là singular: "song" (không phải "songs"), "artist", "album"
```

### Firebase

```javascript
// Dùng onSnapshot thay vì get() cho các read nhạy cảm với auth
// → tránh CORS fail trên Safari local

// onAuthStateChanged phải wrap mọi Firestore read phụ thuộc user
// → KHÔNG dùng setTimeout để né permission error

// Không init Firebase 2 lần:
if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
```

### Gemini API key

```
✅ Lấy từ Google AI Studio → bắt đầu bằng "AIza..."
❌ Không dùng OAuth token từ Google Cloud Console → lỗi 401
```

### Path depth

```javascript
// index.html (root) → dùng:
"src/pages/details-song.html"
"src/scripts/api/genius.js"

// src/pages/*.html → dùng:
"details-song.html"          // cùng thư mục
"../../index.html"           // về root
"../scripts/api/genius.js"   // lên 1 cấp
"../../assets/..."           // về root rồi vào assets
```

### z-index / stacking context

```javascript
// Khi một child element (dropdown, panel) cần float lên trên wrapper có overflow:hidden
// → KHÔNG giải quyết bằng cách hạ z-index wrapper (antipattern)
// → Tách cấu trúc: element cần float ra ngoài wrapper overflow:hidden

// Ví dụ profile page: cover image clip và cover action buttons tách thành 2 lớp
// .profile-cover-clip: overflow:hidden (chỉ clip ảnh)
// .profile-cover-actions: nằm NGOÀI clip → button không bị cắt
```

### Double rAF cho CSS transition

```javascript
// Đảm bảo element đã vào DOM trước khi thêm class trigger transition
requestAnimationFrame(() => {
    requestAnimationFrame(() => panel.classList.add("ai-panel--open"));
});
```

### Deployment verification

```
Sau khi push → verify tại raw.githubusercontent.com/{user}/{repo}/{branch}/{path}
Trước khi debug browser behavior → luôn kiểm tra file live trên GitHub
Browser cache (đặc biệt Safari disk cache) hay giữ version cũ
→ Dùng private/incognito tab để bypass
```

### Quota protection

```javascript
// sessionStorage cache TTL 30 phút → giảm số lần gọi RapidAPI (free: ~100 req/ngày)
// Trending + Artists trang chủ: dùng sessionGet/Set thủ công thay vì fetchCached
// Charts: cache key = `chart_${type}_${timePeriod}` → mỗi combo lưu riêng
```
