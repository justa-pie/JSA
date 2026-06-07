import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️  Thiếu GEMINI_API_KEY trong file .env");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(express.json());
app.use(express.static("public"));

// Cho phép Lyrix (GitHub Pages hoặc localhost khác port) gọi vào
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
});

// ── Helper gọi Gemini ─────────────────────────────────────────────────────────
async function ask(prompt) {
    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
    });
    return response.text?.trim() || "Không có kết quả.";
}

// ── 1. Phân tích lời bài hát ──────────────────────────────────────────────────
// POST /api/lyrics/analyze
// Body: { title, artist, lyrics }
app.post("/api/lyrics/analyze", async (req, res) => {
    try {
        const { title, artist, lyrics } = req.body;
        if (!lyrics) return res.status(400).json({ error: "Thiếu lyrics." });

        const prompt = `
Bạn là chuyên gia phân tích âm nhạc. Hãy phân tích bài hát sau bằng tiếng Việt.

Bài hát: "${title}" - ${artist}
Lời bài hát:
${lyrics}

Hãy phân tích theo cấu trúc sau (dùng markdown):
## 🎭 Chủ đề & cảm xúc
(Bài hát nói về điều gì? Cảm xúc chủ đạo là gì?)

## 📖 Ý nghĩa & thông điệp
(Thông điệp sâu xa tác giả muốn truyền tải)

## ✨ Hình ảnh & ẩn dụ nổi bật
(Những hình ảnh thơ ca, phép ẩn dụ hay nhất trong bài)

## 🎵 Phong cách âm nhạc
(Nhận xét về ngôn từ, nhịp điệu, cách viết lời)

Giữ phân tích ngắn gọn, súc tích, dễ hiểu.
`.trim();

        const answer = await ask(prompt);
        res.json({ answer });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gemini API thất bại." });
    }
});

// ── 2. Tóm tắt tiểu sử nghệ sĩ ───────────────────────────────────────────────
// POST /api/artist/summary
// Body: { name, bio }
app.post("/api/artist/summary", async (req, res) => {
    try {
        const { name, bio } = req.body;
        if (!name) return res.status(400).json({ error: "Thiếu tên nghệ sĩ." });

        const prompt = `
Bạn là chuyên gia âm nhạc. Hãy tóm tắt thông tin về nghệ sĩ "${name}" bằng tiếng Việt.

${bio ? `Tiểu sử gốc:\n${bio}\n` : ""}

Viết tóm tắt theo cấu trúc (dùng markdown):
## 🎤 Về ${name}
(2-3 câu giới thiệu ngắn gọn, súc tích nhất về nghệ sĩ)

## 🏆 Điểm nổi bật
(3-4 bullet points về thành tựu, phong cách đặc trưng)

## 🎶 Phong cách âm nhạc
(Mô tả âm nhạc của họ để người nghe mới có thể hình dung)

Ngắn gọn, thân thiện, dễ đọc.
`.trim();

        const answer = await ask(prompt);
        res.json({ answer });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gemini API thất bại." });
    }
});

// ── 3. Mô tả vibe album ───────────────────────────────────────────────────────
// POST /api/album/vibe
// Body: { title, artist, releaseDate, tracks }
app.post("/api/album/vibe", async (req, res) => {
    try {
        const { title, artist, releaseDate, tracks } = req.body;
        if (!title) return res.status(400).json({ error: "Thiếu tên album." });

        const trackList = Array.isArray(tracks)
            ? tracks.map((t, i) => `${i + 1}. ${t}`).join("\n")
            : "";

        const prompt = `
Bạn là chuyên gia âm nhạc. Hãy mô tả "vibe" của album sau bằng tiếng Việt.

Album: "${title}" - ${artist}${releaseDate ? ` (${releaseDate})` : ""}
${trackList ? `\nDanh sách bài hát:\n${trackList}` : ""}

Viết theo cấu trúc (dùng markdown):
## 💿 Vibe tổng thể
(Mô tả cảm giác, không khí chung của album bằng 2-3 câu)

## 🎨 Màu sắc & cảm xúc
(Nếu album này là một màu sắc hoặc thời điểm trong ngày, nó sẽ là gì? Giải thích)

## 🎧 Nghe khi nào?
(Hoàn cảnh lý tưởng để nghe album này)

## ⭐ Điểm nhấn
(Điều làm album này đặc biệt so với các album khác)

Viết sáng tạo, hấp dẫn, như một bài review âm nhạc thật sự.
`.trim();

        const answer = await ask(prompt);
        res.json({ answer });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gemini API thất bại." });
    }
});

// ── 4. Gợi ý bài hát tương tự ────────────────────────────────────────────────
// POST /api/song/similar
// Body: { title, artist, tags }
app.post("/api/song/similar", async (req, res) => {
    try {
        const { title, artist, tags } = req.body;
        if (!title)
            return res.status(400).json({ error: "Thiếu tên bài hát." });

        const prompt = `
Bạn là chuyên gia âm nhạc. Hãy gợi ý các bài hát tương tự bằng tiếng Việt.

Bài hát gốc: "${title}" - ${artist}
${tags ? `Tags/thể loại: ${tags}` : ""}

Gợi ý 5 bài hát tương tự theo format (dùng markdown):
## 🎵 Bạn có thể thích

Với mỗi bài:
**[Tên bài hát]** - [Nghệ sĩ]
→ *[1 câu giải thích tại sao tương tự]*

Chọn các bài hát thực sự tồn tại, đa dạng nghệ sĩ.
`.trim();

        const answer = await ask(prompt);
        res.json({ answer });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gemini API thất bại." });
    }
});

// ── 5. Phân tích gu âm nhạc (profile) ────────────────────────────────────────
// POST /api/profile/taste
// Body: { favorites: [{title, artist}], history: [{title, artist}] }
app.post("/api/profile/taste", async (req, res) => {
    try {
        const { favorites = [], history = [] } = req.body;
        if (!favorites.length && !history.length) {
            return res
                .status(400)
                .json({ error: "Chưa có dữ liệu nghe nhạc." });
        }

        const favList = favorites
            .slice(0, 20)
            .map((s) => `- "${s.title}" - ${s.artist}`)
            .join("\n");
        const histList = history
            .slice(0, 20)
            .map((s) => `- "${s.title}" - ${s.artist}`)
            .join("\n");

        const prompt = `
Bạn là chuyên gia tâm lý âm nhạc. Hãy phân tích gu nghe nhạc của người dùng bằng tiếng Việt.

${favList ? `Bài hát yêu thích:\n${favList}\n` : ""}
${histList ? `Lịch sử nghe gần đây:\n${histList}` : ""}

Phân tích theo cấu trúc (dùng markdown):
## 🎭 Gu âm nhạc của bạn
(Mô tả tổng quan về sở thích âm nhạc dựa trên dữ liệu)

## 🎨 Các thể loại bạn yêu thích
(Phân tích thể loại, phong cách âm nhạc)

## 💡 Khám phá tiếp theo
(3-4 nghệ sĩ hoặc thể loại bạn nên thử dựa trên gu hiện tại)

## 🌟 Nhận xét thú vị
(1-2 nhận xét thú vị, bất ngờ về gu âm nhạc của họ)

Viết theo phong cách thân thiện, vui vẻ, như người bạn hiểu nhạc.
`.trim();

        const answer = await ask(prompt);
        res.json({ answer });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gemini API thất bại." });
    }
});

// ── 6. Chatbot chung (floating) ───────────────────────────────────────────────
// POST /api/chat
// Body: { message, context: { page, title, artist } }
app.post("/api/chat", async (req, res) => {
    try {
        const { message, context = {} } = req.body;
        if (!message) return res.status(400).json({ error: "Thiếu tin nhắn." });

        const contextStr = context.title
            ? `Người dùng đang xem: "${context.title}"${context.artist ? ` - ${context.artist}` : ""} trên trang ${context.page || "Lyrix"}.`
            : `Người dùng đang dùng ứng dụng nghe nhạc Lyrix.`;

        const prompt = `
Bạn là trợ lý AI của ứng dụng âm nhạc Lyrix. Trả lời bằng tiếng Việt.
${contextStr}

Hãy trả lời câu hỏi của người dùng về âm nhạc, bài hát, nghệ sĩ, hoặc hỗ trợ sử dụng app.
Nếu câu hỏi không liên quan đến âm nhạc, hãy nhẹ nhàng hướng về chủ đề âm nhạc.
Trả lời ngắn gọn, thân thiện, dùng emoji phù hợp.

Câu hỏi: ${message}
`.trim();

        const answer = await ask(prompt);
        res.json({ answer });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gemini API thất bại." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Lyrix AI Server chạy tại http://localhost:${PORT}`);
});
