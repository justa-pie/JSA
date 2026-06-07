/**
 * ai-panel.js — Lyrix AI Integration
 * Dùng chung cho tất cả trang. Load sau auth.js và navbar.js.
 *
 * Cách dùng:
 *   LyrixAI.analyze({ type, data, triggerEl })
 *   LyrixAI.initFloatingChat({ page, title, artist })
 */

const LyrixAI = (() => {
    // ── Config ────────────────────────────────────────────────────────────────
    // Đổi thành URL server khi deploy (ví dụ: https://your-server.com)
    const AI_BASE_URL = "http://localhost:5504";

    // ── Markdown renderer đơn giản ────────────────────────────────────────────
    function renderMarkdown(text) {
        return text
            .replace(/^## (.+)$/gm, '<h3 class="ai-heading">$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.+?)\*/g, "<em>$1</em>")
            .replace(/^→ (.+)$/gm, '<p class="ai-arrow">→ $1</p>')
            .replace(/^- (.+)$/gm, "<li>$1</li>")
            .replace(/(<li>[\s\S]+?<\/li>)/g, "<ul>$1</ul>")
            .replace(/<\/ul>\s*<ul>/g, "")
            .replace(/\n\n+/g, "</p><p>")
            .replace(/^(?!<[hupli])(.+)$/gm, (m) =>
                m.trim() ? `<p>${m}</p>` : "",
            )
            .replace(/<p><\/p>/g, "");
    }

    // ── Tạo panel slide-in ────────────────────────────────────────────────────
    function createPanel(title) {
        // Xóa panel cũ nếu có
        document.getElementById("lyrix-ai-panel")?.remove();

        const panel = document.createElement("div");
        panel.id = "lyrix-ai-panel";
        panel.className = "ai-panel";
        panel.innerHTML = `
      <div class="ai-panel-header">
        <span class="ai-panel-icon">✨</span>
        <span class="ai-panel-title">${title}</span>
        <button class="ai-panel-close" aria-label="Đóng">✕</button>
      </div>
      <div class="ai-panel-body">
        <div class="ai-panel-loading">
          <div class="ai-dots"><span></span><span></span><span></span></div>
          <p>AI đang phân tích...</p>
        </div>
        <div class="ai-panel-content" style="display:none"></div>
      </div>
    `;

        document.body.appendChild(panel);

        // Đóng panel
        panel.querySelector(".ai-panel-close").addEventListener("click", () => {
            panel.classList.remove("ai-panel--open");
            setTimeout(() => panel.remove(), 300);
        });

        // Mở animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => panel.classList.add("ai-panel--open"));
        });

        return panel;
    }

    // ── Hiển thị kết quả vào panel ────────────────────────────────────────────
    function showResult(panel, html) {
        const loading = panel.querySelector(".ai-panel-loading");
        const content = panel.querySelector(".ai-panel-content");
        loading.style.display = "none";
        content.style.display = "block";
        content.innerHTML = html;
    }

    function showError(panel, msg) {
        showResult(panel, `<p class="ai-error">⚠️ ${msg}</p>`);
    }

    // ── Gọi API ───────────────────────────────────────────────────────────────
    async function callAPI(endpoint, body) {
        const res = await fetch(`${AI_BASE_URL}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }

    // ── Tạo nút trigger AI ────────────────────────────────────────────────────
    function createAIButton(label, onClick) {
        const btn = document.createElement("button");
        btn.className = "btn-ai-trigger";
        btn.innerHTML = `<span class="btn-ai-icon">✨</span>${label}`;
        btn.addEventListener("click", onClick);
        return btn;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Phân tích lời bài hát
     * Dùng trên: details-song.html
     * @param {string} title  - Tên bài hát
     * @param {string} artist - Tên nghệ sĩ
     * @param {string} lyrics - Lời bài hát (plain text)
     * @param {HTMLElement} container - Nơi chèn nút trigger
     */
    function initLyricsAnalyze({ title, artist, lyrics, container }) {
        if (!container || !lyrics) return;

        const btn = createAIButton("Phân tích lời bài hát", async () => {
            const panel = createPanel("Phân tích lời bài hát");
            try {
                const data = await callAPI("/api/lyrics/analyze", {
                    title,
                    artist,
                    lyrics,
                });
                showResult(panel, renderMarkdown(data.answer));
            } catch {
                showError(
                    panel,
                    "Không thể kết nối AI. Hãy đảm bảo server đang chạy.",
                );
            }
        });

        container.appendChild(btn);
    }

    /**
     * Gợi ý bài hát tương tự
     * Dùng trên: details-song.html
     */
    function initSimilarSongs({ title, artist, tags, container }) {
        if (!container) return;

        const btn = createAIButton("Gợi ý bài hát tương tự", async () => {
            const panel = createPanel("Gợi ý bài hát tương tự");
            try {
                const data = await callAPI("/api/song/similar", {
                    title,
                    artist,
                    tags,
                });
                showResult(panel, renderMarkdown(data.answer));
            } catch {
                showError(panel, "Không thể kết nối AI.");
            }
        });

        container.appendChild(btn);
    }

    /**
     * Tóm tắt tiểu sử nghệ sĩ
     * Dùng trên: details-artist.html
     */
    function initArtistSummary({ name, bio, container }) {
        if (!container) return;

        const btn = createAIButton("Tóm tắt tiểu sử", async () => {
            const panel = createPanel(`Về ${name}`);
            try {
                const data = await callAPI("/api/artist/summary", {
                    name,
                    bio,
                });
                showResult(panel, renderMarkdown(data.answer));
            } catch {
                showError(panel, "Không thể kết nối AI.");
            }
        });

        container.appendChild(btn);
    }

    /**
     * Mô tả vibe album
     * Dùng trên: details-album.html
     */
    function initAlbumVibe({ title, artist, releaseDate, tracks, container }) {
        if (!container) return;

        const btn = createAIButton("Mô tả vibe album", async () => {
            const panel = createPanel(`Vibe của "${title}"`);
            try {
                const data = await callAPI("/api/album/vibe", {
                    title,
                    artist,
                    releaseDate,
                    tracks,
                });
                showResult(panel, renderMarkdown(data.answer));
            } catch {
                showError(panel, "Không thể kết nối AI.");
            }
        });

        container.appendChild(btn);
    }

    /**
     * Phân tích gu âm nhạc
     * Dùng trên: profile.html
     */
    function initTasteAnalysis({ favorites, history, container }) {
        if (!container) return;

        const btn = createAIButton("Phân tích gu âm nhạc của tôi", async () => {
            const panel = createPanel("Gu âm nhạc của bạn");
            try {
                const data = await callAPI("/api/profile/taste", {
                    favorites,
                    history,
                });
                showResult(panel, renderMarkdown(data.answer));
            } catch {
                showError(panel, "Không thể kết nối AI.");
            }
        });

        container.appendChild(btn);
    }

    /**
     * Floating chatbot — inject vào mọi trang qua navbar.js
     * @param {object} context - { page, title, artist }
     */
    function initFloatingChat(context = {}) {
        // Tránh tạo 2 lần
        if (document.getElementById("lyrix-chat-fab")) return;

        const fab = document.createElement("div");
        fab.id = "lyrix-chat-fab";
        fab.innerHTML = `
      <button class="chat-fab-btn" id="chatFabBtn" aria-label="Mở AI Chat">
        <span class="chat-fab-icon">💬</span>
        <span class="chat-fab-label">AI</span>
      </button>
      <div class="chat-window" id="chatWindow" aria-hidden="true">
        <div class="chat-window-header">
          <span>✨ Lyrix AI</span>
          <button class="chat-window-close" id="chatClose" aria-label="Đóng">✕</button>
        </div>
        <div class="chat-messages" id="chatMessages">
          <div class="chat-msg chat-msg--ai">
            Xin chào! Tôi là trợ lý AI của Lyrix 🎵 Hỏi tôi bất cứ điều gì về âm nhạc nhé!
          </div>
        </div>
        <form class="chat-input-row" id="chatForm">
          <input
            type="text"
            id="chatInput"
            placeholder="Hỏi về âm nhạc..."
            autocomplete="off"
          />
          <button type="submit" aria-label="Gửi">➤</button>
        </form>
      </div>
    `;

        document.body.appendChild(fab);

        const btn = document.getElementById("chatFabBtn");
        const window_ = document.getElementById("chatWindow");
        const closeBtn = document.getElementById("chatClose");
        const form = document.getElementById("chatForm");
        const input = document.getElementById("chatInput");
        const messages = document.getElementById("chatMessages");

        // Toggle chat window
        btn.addEventListener("click", () => {
            const isOpen = window_.classList.toggle("chat-window--open");
            window_.setAttribute("aria-hidden", !isOpen);
            if (isOpen) input.focus();
        });

        closeBtn.addEventListener("click", () => {
            window_.classList.remove("chat-window--open");
            window_.setAttribute("aria-hidden", "true");
        });

        // Gửi tin nhắn
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const msg = input.value.trim();
            if (!msg) return;

            // Hiện tin nhắn người dùng
            appendMsg(messages, msg, "user");
            input.value = "";
            input.disabled = true;

            // Typing indicator
            const typing = appendMsg(messages, "...", "ai typing");

            try {
                const data = await callAPI("/api/chat", {
                    message: msg,
                    context,
                });
                typing.remove();
                appendMsg(messages, data.answer, "ai");
            } catch {
                typing.remove();
                appendMsg(
                    messages,
                    "⚠️ Không thể kết nối AI. Hãy đảm bảo server đang chạy.",
                    "ai error",
                );
            } finally {
                input.disabled = false;
                input.focus();
            }
        });

        function appendMsg(container, text, type) {
            const div = document.createElement("div");
            div.className = `chat-msg chat-msg--${type.split(" ")[0]}`;
            if (type.includes("typing")) div.classList.add("chat-msg--typing");
            div.textContent = text;
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
            return div;
        }
    }

    // Public
    return {
        initLyricsAnalyze,
        initSimilarSongs,
        initArtistSummary,
        initAlbumVibe,
        initTasteAnalysis,
        initFloatingChat,
    };
})();
