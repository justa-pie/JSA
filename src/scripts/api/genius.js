// ─── Lyrix — API Config ───────────────────────────────────────────────────────
const API_CONFIG = {
    host: "genius-song-lyrics1.p.rapidapi.com",
    key: "d8b5ad0bfamsh1a6737bb873d9ffp15e9c7jsn4978c505d48a",
    baseURL: "https://genius-song-lyrics1.p.rapidapi.com",
};

// ─── Core fetch ───────────────────────────────────────────────────────────────
async function fetchAPI(endpoint, params = {}) {
    const url = new URL(API_CONFIG.baseURL + endpoint);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "")
            url.searchParams.append(k, v);
    });

    const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
            "x-rapidapi-host": API_CONFIG.host,
            "x-rapidapi-key": API_CONFIG.key,
        },
    });

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
    // SVG placeholder
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
