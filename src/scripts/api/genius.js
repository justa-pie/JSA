// ─── Lyrix — API Config ───────────────────────────────────────────────────────
// API key được giữ bí mật ở backend (Vercel).
// Frontend chỉ gọi proxy /genius?endpoint=...
const PROXY_BASE = "https://lyrix-dusky.vercel.app";

// ─── Core fetch (qua proxy Vercel) ───────────────────────────────────────────
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

    try {
        return JSON.parse(text);
    } catch {
        throw new Error("Response không hợp lệ.");
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatNumber(num) {
    if (!num || isNaN(num)) return "—";
    num = parseInt(num, 10);
    if (num >= 1_000_000)
        return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return num.toString();
}

function safeImg(src) {
    if (src && src.startsWith("http")) return src;
    return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='52' height='52'><rect width='52' height='52' fill='%23242429'/><text x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-size='20' fill='%2371717a'>♪</text></svg>`;
}

function showError(msg) {
    const el = document.createElement("div");
    el.className = "error-toast";
    el.innerHTML = `<i class="fa-solid fa-circle-exclamation" style="color:#f87171;margin-right:8px"></i>${msg}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5000);
}

function stripHtml(html) {
    if (!html) return "";
    return html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ")
        .trim();
}

// ─── Session Cache (tiết kiệm quota) ─────────────────────────────────────────
const CACHE_TTL = 30 * 60 * 1000;

function sessionSet(key, data) {
    try {
        sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
    } catch {}
}

function sessionGet(key) {
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const { ts, data } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL) {
            sessionStorage.removeItem(key);
            return null;
        }
        return data;
    } catch {
        return null;
    }
}

async function fetchCached(cacheKey, endpoint, params = {}) {
    const cached = sessionGet(cacheKey);
    if (cached) {
        console.log("[Cache HIT]", cacheKey);
        return cached;
    }
    console.log("[Cache MISS]", cacheKey, "→ fetching API");
    const data = await fetchAPI(endpoint, params);
    sessionSet(cacheKey, data);
    return data;
}
