/**
 * ai-panel.js — Lyrix AI Integration
 * Streaming SSE + Font Awesome icons (không dùng emoji)
 */

const LyrixAI = (() => {
const AI_BASE_URL = "https://lyrix-backend.vercel.app";

  // ── Markdown renderer ─────────────────────────────────────────────────────
  function renderMarkdown(text) {
    return text
      .replace(/^## (.+)$/gm, '<h3 class="ai-heading">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^→ (.+)$/gm, '<p class="ai-arrow">→ $1</p>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]+?<\/li>)/g, '<ul>$1</ul>')
      .replace(/<\/ul>\s*<ul>/g, '')
      .replace(/\n\n+/g, '</p><p>')
      .replace(/^(?!<[hupli])(.+)$/gm, (m) => m.trim() ? `<p>${m}</p>` : '')
      .replace(/<p><\/p>/g, '');
  }

  // ── Tạo panel slide-in ────────────────────────────────────────────────────
  function createPanel(title) {
    document.getElementById('lyrix-ai-panel')?.remove();

    const panel = document.createElement('div');
    panel.id = 'lyrix-ai-panel';
    panel.className = 'ai-panel';
    panel.innerHTML = `
      <div class="ai-panel-header">
        <i class="fa-solid fa-wand-magic-sparkles ai-panel-icon"></i>
        <span class="ai-panel-title">${title}</span>
        <button class="ai-panel-close" aria-label="Đóng">
          <i class="fa-solid fa-xmark"></i>
        </button>
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

    panel.querySelector('.ai-panel-close').addEventListener('click', () => {
      panel.classList.remove('ai-panel--open');
      setTimeout(() => panel.remove(), 300);
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => panel.classList.add('ai-panel--open'));
    });

    return panel;
  }

  // ── Bắt đầu stream: ẩn loading, hiện content div ─────────────────────────
  function startStream(panel) {
    panel.querySelector('.ai-panel-loading').style.display = 'none';
    const content = panel.querySelector('.ai-panel-content');
    content.style.display = 'block';
    return content;
  }

  function showError(panel, msg) {
    const content = startStream(panel);
    content.innerHTML = `
      <p class="ai-error">
        <i class="fa-solid fa-triangle-exclamation"></i> ${msg}
      </p>`;
  }

  // ── Stream SSE từ server → render dần vào panel ───────────────────────────
  async function streamToPanel(endpoint, body, panel) {
    const res = await fetch(`${AI_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const content = startStream(panel);
    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let rawText   = '';
    let buffer    = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Tách từng SSE event (mỗi event kết thúc bằng \n\n)
      const events = buffer.split('\n\n');
      buffer = events.pop(); // phần chưa hoàn chỉnh giữ lại

      for (const event of events) {
        const line = event.trim();
        if (!line.startsWith('data:')) continue;

        try {
          const json = JSON.parse(line.slice(5).trim());

          if (json.error) {
            content.innerHTML = `
              <p class="ai-error">
                <i class="fa-solid fa-triangle-exclamation"></i> ${json.error}
              </p>`;
            return;
          }

          if (json.chunk) {
            rawText += json.chunk;
            // Render markdown từ toàn bộ text đã nhận — cập nhật live
            content.innerHTML = renderMarkdown(rawText);
            // Auto scroll theo nội dung
            panel.querySelector('.ai-panel-body').scrollTop = 99999;
          }
        } catch {
          // JSON parse lỗi — bỏ qua chunk này
        }
      }
    }
  }

  // ── Stream SSE cho chat (trả về plain text, không markdown) ──────────────
  async function streamToChat(endpoint, body, msgEl) {
    const res = await fetch(`${AI_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer    = '';
    let fullText  = '';

    msgEl.textContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop();

      for (const event of events) {
        const line = event.trim();
        if (!line.startsWith('data:')) continue;
        try {
          const json = JSON.parse(line.slice(5).trim());
          if (json.chunk) {
            fullText += json.chunk;
            msgEl.textContent = fullText;
            msgEl.parentElement.scrollTop = msgEl.parentElement.scrollHeight;
          }
        } catch { /* skip */ }
      }
    }
  }

  // ── Tạo nút trigger AI (Font Awesome icon) ───────────────────────────────
  function createAIButton(iconClass, label, onClick) {
    const btn = document.createElement('button');
    btn.className = 'btn-ai-trigger';
    btn.innerHTML = `<i class="${iconClass} btn-ai-icon"></i>${label}`;
    btn.addEventListener('click', onClick);
    return btn;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════════════════════

  function initLyricsAnalyze({ title, artist, lyrics, container }) {
    if (!container || !lyrics) return;
    const btn = createAIButton(
      'fa-solid fa-magnifying-glass',
      'Phân tích lời bài hát',
      async () => {
        const panel = createPanel('Phân tích lời bài hát');
        try {
          await streamToPanel('/api/lyrics/analyze', { title, artist, lyrics }, panel);
        } catch {
          showError(panel, 'Không thể kết nối AI. Hãy đảm bảo server đang chạy.');
        }
      }
    );
    container.appendChild(btn);
  }

  function initSimilarSongs({ title, artist, tags, container }) {
    if (!container) return;
    const btn = createAIButton(
      'fa-solid fa-music',
      'Gợi ý bài hát tương tự',
      async () => {
        const panel = createPanel('Gợi ý bài hát tương tự');
        try {
          await streamToPanel('/api/song/similar', { title, artist, tags }, panel);
        } catch {
          showError(panel, 'Không thể kết nối AI.');
        }
      }
    );
    container.appendChild(btn);
  }

  function initArtistSummary({ name, bio, container }) {
    if (!container) return;
    const btn = createAIButton(
      'fa-solid fa-user-pen',
      'Tóm tắt tiểu sử',
      async () => {
        const panel = createPanel(`Về ${name}`);
        try {
          await streamToPanel('/api/artist/summary', { name, bio }, panel);
        } catch {
          showError(panel, 'Không thể kết nối AI.');
        }
      }
    );
    container.appendChild(btn);
  }

  function initAlbumVibe({ title, artist, releaseDate, tracks, container }) {
    if (!container) return;
    const btn = createAIButton(
      'fa-solid fa-compact-disc',
      'Mô tả vibe album',
      async () => {
        const panel = createPanel(`Vibe của "${title}"`);
        try {
          await streamToPanel('/api/album/vibe', { title, artist, releaseDate, tracks }, panel);
        } catch {
          showError(panel, 'Không thể kết nối AI.');
        }
      }
    );
    container.appendChild(btn);
  }

  function initTasteAnalysis({ favorites, history, container }) {
    if (!container) return;
    const btn = createAIButton(
      'fa-solid fa-chart-simple',
      'Phân tích gu âm nhạc của tôi',
      async () => {
        const panel = createPanel('Gu âm nhạc của bạn');
        try {
          await streamToPanel('/api/profile/taste', { favorites, history }, panel);
        } catch {
          showError(panel, 'Không thể kết nối AI.');
        }
      }
    );
    container.appendChild(btn);
  }

  function initFloatingChat(context = {}) {
    if (document.getElementById('lyrix-chat-fab')) return;

    const fab = document.createElement('div');
    fab.id = 'lyrix-chat-fab';
    fab.innerHTML = `
      <button class="chat-fab-btn" id="chatFabBtn" aria-label="Mở AI Chat">
        <i class="fa-solid fa-comment-dots chat-fab-icon"></i>
        <span class="chat-fab-label">AI</span>
      </button>
      <div class="chat-window" id="chatWindow" aria-hidden="true">
        <div class="chat-window-header">
          <span><i class="fa-solid fa-wand-magic-sparkles" style="margin-right:6px"></i>Lyrix AI</span>
          <button class="chat-window-close" id="chatClose" aria-label="Đóng">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="chat-messages" id="chatMessages">
          <div class="chat-msg chat-msg--ai">
            <i class="fa-solid fa-music" style="margin-right:6px;color:var(--brand-light)"></i>
            Xin chào! Tôi là trợ lý AI của Lyrix. Hỏi tôi bất cứ điều gì về âm nhạc nhé!
          </div>
        </div>
        <form class="chat-input-row" id="chatForm">
          <input
            type="text"
            id="chatInput"
            placeholder="Hỏi về âm nhạc..."
            autocomplete="off"
          />
          <button type="submit" aria-label="Gửi">
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(fab);

    const fabBtn   = document.getElementById('chatFabBtn');
    const window_  = document.getElementById('chatWindow');
    const closeBtn = document.getElementById('chatClose');
    const form     = document.getElementById('chatForm');
    const input    = document.getElementById('chatInput');
    const messages = document.getElementById('chatMessages');

    fabBtn.addEventListener('click', () => {
      const isOpen = window_.classList.toggle('chat-window--open');
      window_.setAttribute('aria-hidden', !isOpen);
      if (isOpen) input.focus();
    });

    closeBtn.addEventListener('click', () => {
      window_.classList.remove('chat-window--open');
      window_.setAttribute('aria-hidden', 'true');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = input.value.trim();
      if (!msg) return;

      appendMsg(messages, msg, 'user');
      input.value    = '';
      input.disabled = true;
      form.querySelector('button[type="submit"]').disabled = true;

      // Tạo bubble AI trống — stream sẽ điền vào
      const aiMsg = appendMsg(messages, '', 'ai streaming');

      try {
        await streamToChat('/api/chat', { message: msg, context }, aiMsg);
        aiMsg.classList.remove('chat-msg--streaming');
      } catch {
        aiMsg.textContent = 'Không thể kết nối AI. Hãy đảm bảo server đang chạy.';
        aiMsg.classList.add('chat-msg--error');
      } finally {
        input.disabled = false;
        form.querySelector('button[type="submit"]').disabled = false;
        input.focus();
      }
    });

    function appendMsg(container, text, type) {
      const div = document.createElement('div');
      div.className = `chat-msg chat-msg--${type.split(' ')[0]}`;
      if (type.includes('streaming')) div.classList.add('chat-msg--streaming');
      div.textContent = text;
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
      return div;
    }
  }

  return {
    initLyricsAnalyze,
    initSimilarSongs,
    initArtistSummary,
    initAlbumVibe,
    initTasteAnalysis,
    initFloatingChat,
  };
})();
