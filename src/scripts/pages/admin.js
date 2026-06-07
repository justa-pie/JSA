// ═══════════════════════════════════════════════════════════════
// admin.js — Lyrix Admin Dashboard
// Thứ tự: Firebase → State → UI → Render → Chart → Admin → Auth
// ═══════════════════════════════════════════════════════════════

// ── ❶ FIREBASE ─────────────────────────────────────────────────
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
const db = firebase.firestore();

// ── ❷ STATE ─────────────────────────────────────────────────────
const State = {
    users: [],
    currentTab: "users",
    confirmCb: null,
    chartPeriod: "month",
    filters: { role: "all", sort: "newest" },
};

// ── ❸ UI HELPERS — khai báo SỚM để auth callback dùng được ──────
const UI = {
    showAuthWall() {
        document.getElementById("auth-wall").style.display = "flex";
        document.getElementById("admin-app").style.display = "none";
    },
    hideAuthWall() {
        document.getElementById("auth-wall").style.display = "none";
        document.getElementById("admin-app").style.display = "flex";
    },
    setSkeletonRows(tbodyId, cols, rows = 3) {
        const tb = document.getElementById(tbodyId);
        if (!tb) return;
        tb.innerHTML = Array.from(
            { length: rows },
            () =>
                `<tr><td colspan="${cols}" class="admin-loading-cell">
              <div class="skeleton" style="height:13px;width:${45 + Math.random() * 40}%;margin:.75rem auto"></div>
            </td></tr>`,
        ).join("");
    },
    _toastTimer: null,
    toast(msg, type = "success") {
        const t = document.getElementById("admin-toast");
        if (!t) return;
        t.textContent = msg;
        t.className = `admin-toast show admin-toast-${type}`;
        clearTimeout(UI._toastTimer);
        UI._toastTimer = setTimeout(() => {
            t.className = "admin-toast";
        }, 3200);
    },
    confirm(title, msg, cb) {
        document.getElementById("confirm-title").textContent = title;
        document.getElementById("confirm-msg").textContent = msg;
        document.getElementById("confirm-modal").style.display = "flex";
        State.confirmCb = cb;
    },
    closeConfirm() {
        document.getElementById("confirm-modal").style.display = "none";
        State.confirmCb = null;
    },
};

// ── ❹ RENDER ────────────────────────────────────────────────────
const Render = {
    users(users) {
        const tb = document.getElementById("users-tbody");
        if (!users.length) {
            tb.innerHTML = `<tr><td colspan="7"><div class="admin-empty">
              <i class="fa-solid fa-users-slash"></i>
              <span>Không tìm thấy người dùng nào</span>
            </div></td></tr>`;
            return;
        }
        tb.innerHTML = users
            .map((u) => {
                const isAdminU = u.role === "admin";
                const initials = (u.displayName || u.email || "?")
                    .substring(0, 2)
                    .toUpperCase();
                const avatarHtml = u.avatarUrl
                    ? `<div class="admin-user-av"><img src="${u.avatarUrl}" onerror="this.parentElement.textContent='${initials}'" /></div>`
                    : `<div class="admin-user-av">${initials}</div>`;
                const expandId = `expand-${u.id}`;
                const joinDate = u.createdAt?.seconds
                    ? new Date(u.createdAt.seconds * 1000).toLocaleDateString(
                          "vi-VN",
                      )
                    : "—";

                return `
      <tr>
        <td>
          <div class="admin-user-cell">
            ${avatarHtml}
            <div>
              <div class="admin-user-name">${esc(u.displayName || "—")}</div>
              <div class="admin-user-email">${esc(u.email || u.id)}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="badge ${isAdminU ? "badge-brand" : "admin-badge-user"}">
            ${isAdminU ? '<i class="fa-solid fa-shield-halved"></i> admin' : "user"}
          </span>
        </td>
        <td>
          <span class="admin-mono" style="color:#f87171;font-weight:600">${u._favsCount}</span>
          <span style="font-size:.7rem;color:var(--text-3)"> bài</span>
        </td>
        <td>
          <span class="admin-mono" style="color:var(--accent);font-weight:600">${u._histCount}</span>
          <span style="font-size:.7rem;color:var(--text-3)"> mục</span>
        </td>
        <td>
          <span class="admin-mono" style="color:#4ade80;font-weight:600">${u._plCount}</span>
          <span style="font-size:.7rem;color:var(--text-3)"> playlist</span>
        </td>
        <td style="font-size:.78rem;color:var(--text-3)">${joinDate}</td>
        <td>
          <div class="admin-action-btns">
            <button class="btn btn-ghost btn-sm admin-expand-btn"
              onclick="Admin.toggleExpand('${expandId}')">
              <i class="fa-solid fa-chevron-down" style="transition:transform .2s"></i>
            </button>
            ${
                !isAdminU
                    ? `
            <button class="btn btn-sm btn-danger"
              onclick="Admin.deleteUser('${u.id}','${esc(u.displayName || u.email || u.id)}')">
              <i class="fa-solid fa-trash"></i>
            </button>`
                    : ""
            }
          </div>
        </td>
      </tr>
      <tr id="${expandId}" class="admin-expand-row" style="display:none">
        <td colspan="7">
          <div class="admin-expand-inner">
            <div class="admin-uid-row">
              <span style="color:var(--text-3);font-size:.75rem">UID:</span>
              <code class="admin-uid">${u.id}</code>
              ${u.bio ? `<span style="color:var(--text-3);font-size:.75rem;margin-left:.75rem">Bio: ${esc(u.bio)}</span>` : ""}
            </div>
            <div class="admin-sub-grid" style="grid-template-columns:1fr 1fr 1fr">
              <div>
                <div class="admin-sub-title">
                  <i class="fa-solid fa-heart" style="color:#f87171"></i>
                  Yêu thích (${u._favsCount})
                  ${
                      u._favsCount
                          ? `<button class="btn btn-sm btn-danger" style="margin-left:auto;padding:2px 8px;font-size:.7rem"
                    onclick="Admin.clearFavs('${u.id}','${esc(u.displayName || u.email || u.id)}')">Xoá tất cả</button>`
                          : ""
                  }
                </div>
                ${Render._subItems(u._favDocs)}
                ${u._favsCount > 5 ? `<div class="admin-sub-more">+${u._favsCount - 5} bài khác</div>` : ""}
              </div>
              <div>
                <div class="admin-sub-title">
                  <i class="fa-solid fa-clock-rotate-left" style="color:var(--accent)"></i>
                  Lịch sử (${u._histCount})
                  ${
                      u._histCount
                          ? `<button class="btn btn-sm btn-danger" style="margin-left:auto;padding:2px 8px;font-size:.7rem"
                    onclick="Admin.clearHistory('${u.id}','${esc(u.displayName || u.email || u.id)}')">Xoá tất cả</button>`
                          : ""
                  }
                </div>
                ${Render._subItems(u._histDocs)}
                ${u._histCount > 5 ? `<div class="admin-sub-more">+${u._histCount - 5} mục khác</div>` : ""}
              </div>
              <div>
                <div class="admin-sub-title">
                  <i class="fa-solid fa-music" style="color:#4ade80"></i>
                  Playlist (${u._plCount})
                </div>
                ${Render._subPlaylists(u._plDocs)}
                ${u._plCount > 5 ? `<div class="admin-sub-more">+${u._plCount - 5} playlist khác</div>` : ""}
              </div>
            </div>
          </div>
        </td>
      </tr>`;
            })
            .join("");
    },

    _subItems(docs) {
        if (!docs.length)
            return `<div class="admin-sub-empty">Chưa có dữ liệu</div>`;
        return docs
            .slice(0, 5)
            .map(
                (d) => `
      <div class="admin-sub-item">
        ${
            d.coverArt
                ? `<img src="${d.coverArt}" class="admin-sub-thumb" />`
                : `<div class="admin-sub-thumb admin-sub-thumb-placeholder"><i class="fa-solid fa-music"></i></div>`
        }
        <div class="admin-sub-item-info">
          <div class="admin-sub-item-name">${esc(d.title || d.songId || "?")}</div>
          <div class="admin-sub-item-meta">${esc(d.artist || "")}</div>
        </div>
      </div>`,
            )
            .join("");
    },

    _subPlaylists(docs) {
        if (!docs.length)
            return `<div class="admin-sub-empty">Chưa có playlist</div>`;
        return docs
            .slice(0, 5)
            .map(
                (d) => `
      <div class="admin-sub-item">
        ${
            d.coverUrl
                ? `<img src="${d.coverUrl}" class="admin-sub-thumb" style="border-radius:4px" />`
                : `<div class="admin-sub-thumb admin-sub-thumb-placeholder"><i class="fa-solid fa-music"></i></div>`
        }
        <div class="admin-sub-item-info">
          <div class="admin-sub-item-name">${esc(d.name || "Untitled")}</div>
          <div class="admin-sub-item-meta">${Array.isArray(d.songs) ? d.songs.length : 0} bài</div>
        </div>
      </div>`,
            )
            .join("");
    },
};

// ── ❺ CHART ─────────────────────────────────────────────────────
const Chart = {
    updateMiniStats() {
        const now = new Date();
        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
        );
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        const count = (from) =>
            State.users.filter((u) => {
                if (!u.createdAt?.seconds) return false;
                return new Date(u.createdAt.seconds * 1000) >= from;
            }).length;
        const el = (id, v) => {
            const e = document.getElementById(id);
            if (e) e.textContent = v;
        };
        el("ana-today", count(today));
        el("ana-week", count(weekAgo));
        el("ana-month", count(monthAgo));
    },

    render() {
        Chart.updateMiniStats();
        const data = Chart._buildData(State.chartPeriod);
        Chart._draw(data);
    },

    _buildData(period) {
        const now = new Date();
        const result = [];
        if (period === "day") {
            for (let i = 13; i >= 0; i--) {
                const d = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate() - i,
                );
                result.push({
                    label: `${d.getDate()}/${d.getMonth() + 1}`,
                    count: State.users.filter((u) => {
                        if (!u.createdAt?.seconds) return false;
                        const ud = new Date(u.createdAt.seconds * 1000);
                        return (
                            ud.getFullYear() === d.getFullYear() &&
                            ud.getMonth() === d.getMonth() &&
                            ud.getDate() === d.getDate()
                        );
                    }).length,
                });
            }
        } else if (period === "week") {
            for (let i = 11; i >= 0; i--) {
                const end = new Date(now);
                end.setDate(end.getDate() - i * 7);
                const start = new Date(end);
                start.setDate(start.getDate() - 6);
                result.push({
                    label: `T${start.getDate()}/${start.getMonth() + 1}`,
                    count: State.users.filter((u) => {
                        if (!u.createdAt?.seconds) return false;
                        const ud = new Date(u.createdAt.seconds * 1000);
                        return ud >= start && ud <= end;
                    }).length,
                });
            }
        } else if (period === "month") {
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                result.push({
                    label: `Th${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`,
                    count: State.users.filter((u) => {
                        if (!u.createdAt?.seconds) return false;
                        const ud = new Date(u.createdAt.seconds * 1000);
                        return (
                            ud.getFullYear() === d.getFullYear() &&
                            ud.getMonth() === d.getMonth()
                        );
                    }).length,
                });
            }
        } else {
            for (let i = 4; i >= 0; i--) {
                const yr = now.getFullYear() - i;
                result.push({
                    label: `${yr}`,
                    count: State.users.filter((u) => {
                        if (!u.createdAt?.seconds) return false;
                        return (
                            new Date(
                                u.createdAt.seconds * 1000,
                            ).getFullYear() === yr
                        );
                    }).length,
                });
            }
        }
        return result;
    },

    _draw(data) {
        const canvas = document.getElementById("chart-canvas");
        if (!canvas) return;
        const container = canvas.parentElement;
        canvas.width = container.offsetWidth || 800;
        canvas.height = container.offsetHeight || 260;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const W = canvas.width,
            H = canvas.height;
        const padL = 48,
            padR = 24,
            padT = 20,
            padB = 40;
        const chartW = W - padL - padR,
            chartH = H - padT - padB;
        const yMax = Math.max(...data.map((d) => d.count), 1);
        const step = Math.ceil(yMax / 4) || 1;
        const yMaxR = step * 4;

        ctx.font = "11px Inter, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const val = step * i;
            const y = padT + chartH - (val / yMaxR) * chartH;
            ctx.beginPath();
            ctx.moveTo(padL, y);
            ctx.lineTo(padL + chartW, y);
            ctx.stroke();
            ctx.fillText(val, 0, y + 4);
        }

        const barW = (chartW / data.length) * 0.55;
        const barGap = chartW / data.length;

        data.forEach((d, i) => {
            const x = padL + i * barGap + (barGap - barW) / 2;
            const bh = (d.count / yMaxR) * chartH;
            const y = padT + chartH - bh;
            const r = Math.min(5, barW / 2, bh || 0.1);
            const grad = ctx.createLinearGradient(0, y, 0, padT + chartH);
            grad.addColorStop(0, "rgba(124,58,237,0.85)");
            grad.addColorStop(1, "rgba(124,58,237,0.15)");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + barW - r, y);
            ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
            ctx.lineTo(x + barW, padT + chartH);
            ctx.lineTo(x, padT + chartH);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            ctx.fill();
            if (d.count > 0) {
                ctx.fillStyle = "rgba(255,255,255,0.8)";
                ctx.font = "bold 11px Inter, sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(d.count, x + barW / 2, y - 5);
            }
            ctx.fillStyle = "rgba(255,255,255,0.4)";
            ctx.font = "10px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(d.label, x + barW / 2, H - 10);
        });

        ctx.beginPath();
        ctx.strokeStyle = "rgba(168,85,247,0.7)";
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        data.forEach((d, i) => {
            const x = padL + i * barGap + barGap / 2;
            const y = padT + chartH - (d.count / yMaxR) * chartH;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();

        data.forEach((d, i) => {
            const x = padL + i * barGap + barGap / 2;
            const y = padT + chartH - (d.count / yMaxR) * chartH;
            ctx.beginPath();
            ctx.arc(x, y, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = "#a855f7";
            ctx.fill();
            ctx.strokeStyle = "#1a1a2e";
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });
    },
};

// ── ❻ ADMIN ──────────────────────────────────────────────────────
const Admin = {
    async login() {
        const email = document.getElementById("login-email").value.trim();
        const pass = document.getElementById("login-password").value;
        const errEl = document.getElementById("auth-error");
        errEl.style.display = "none";
        if (!email || !pass) return;
        try {
            await auth.signInWithEmailAndPassword(email, pass);
        } catch (e) {
            errEl.style.display = "block";
        }
    },

    async logout() {
        await auth.signOut();
        UI.showAuthWall();
    },

    async loadAll() {
        await Admin.loadUsers();
    },

    async loadUsers() {
        UI.setSkeletonRows("users-tbody", 7, 5);
        try {
            const snap = await db.collection("users").get();
            const enriched = await Promise.all(
                snap.docs.map(async (doc) => {
                    const u = { id: doc.id, ...doc.data() };
                    const [favsSnap, histSnap, plSnap] = await Promise.all([
                        db
                            .collection("users")
                            .doc(u.id)
                            .collection("favorites")
                            .get(),
                        db
                            .collection("users")
                            .doc(u.id)
                            .collection("history")
                            .get(),
                        db
                            .collection("users")
                            .doc(u.id)
                            .collection("playlists")
                            .get(),
                    ]);
                    u._favsCount = favsSnap.size;
                    u._histCount = histSnap.size;
                    u._plCount = plSnap.size;
                    u._favDocs = favsSnap.docs.map((d) => d.data());
                    u._histDocs = histSnap.docs.map((d) => d.data());
                    u._plDocs = plSnap.docs.map((d) => d.data());
                    return u;
                }),
            );

            State.users = enriched;

            const totalFavs = enriched.reduce((s, u) => s + u._favsCount, 0);
            const totalHist = enriched.reduce((s, u) => s + u._histCount, 0);
            const totalPl = enriched.reduce((s, u) => s + u._plCount, 0);
            const el = (id, v) => {
                const e = document.getElementById(id);
                if (e) e.textContent = v;
            };
            el("stat-users", enriched.length);
            el("stat-favs", totalFavs);
            el("stat-hist", totalHist);
            el("stat-pl", totalPl);
            el("badge-users", enriched.length);

            Admin.applyFilters();
            Chart.render();
        } catch (e) {
            UI.toast("Lỗi tải users: " + e.message, "error");
        }
    },

    applyFilters() {
        const q = (document.getElementById("search-input")?.value || "")
            .toLowerCase()
            .trim();
        const fName = (document.getElementById("flt-name")?.value || "")
            .toLowerCase()
            .trim();
        const fEmail = (document.getElementById("flt-email")?.value || "")
            .toLowerCase()
            .trim();
        const fDateFrom = document.getElementById("flt-date-from")?.value || "";
        const fDateTo = document.getElementById("flt-date-to")?.value || "";
        const fMinFavs =
            parseInt(document.getElementById("flt-min-favs")?.value || "0") ||
            0;
        const sort =
            document.getElementById("adrop-sort")?.dataset.val || "newest";

        let list = [...State.users];

        if (q)
            list = list.filter(
                (u) =>
                    (u.displayName || "").toLowerCase().includes(q) ||
                    (u.email || "").toLowerCase().includes(q) ||
                    u.id.toLowerCase().includes(q),
            );
        if (fName)
            list = list.filter((u) =>
                (u.displayName || "").toLowerCase().includes(fName),
            );
        if (fEmail)
            list = list.filter((u) =>
                (u.email || "").toLowerCase().includes(fEmail),
            );
        if (fMinFavs > 0) list = list.filter((u) => u._favsCount >= fMinFavs);
        if (fDateFrom) {
            const from = new Date(fDateFrom);
            list = list.filter(
                (u) =>
                    u.createdAt?.seconds &&
                    new Date(u.createdAt.seconds * 1000) >= from,
            );
        }
        if (fDateTo) {
            const to = new Date(fDateTo);
            to.setHours(23, 59, 59, 999);
            list = list.filter(
                (u) =>
                    u.createdAt?.seconds &&
                    new Date(u.createdAt.seconds * 1000) <= to,
            );
        }
        if (State.filters.role !== "all")
            list = list.filter(
                (u) => (u.role || "user") === State.filters.role,
            );

        switch (sort) {
            case "newest":
                list.sort(
                    (a, b) =>
                        (b.createdAt?.seconds || 0) -
                        (a.createdAt?.seconds || 0),
                );
                break;
            case "oldest":
                list.sort(
                    (a, b) =>
                        (a.createdAt?.seconds || 0) -
                        (b.createdAt?.seconds || 0),
                );
                break;
            case "name":
                list.sort((a, b) =>
                    (a.displayName || "").localeCompare(b.displayName || ""),
                );
                break;
            case "favs":
                list.sort((a, b) => b._favsCount - a._favsCount);
                break;
            case "hist":
                list.sort((a, b) => b._histCount - a._histCount);
                break;
            case "pl":
                list.sort((a, b) => b._plCount - a._plCount);
                break;
        }

        const badge = document.getElementById("filter-result-badge");
        if (badge) badge.textContent = list.length;
        Render.users(list);
    },

    clearFilters() {
        [
            "flt-name",
            "flt-email",
            "flt-date-from",
            "flt-date-to",
            "flt-min-favs",
        ].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
        Admin.setDrop("adrop-sort", "newest", "Mới tham gia nhất");
        document
            .querySelectorAll("#filter-role .admin-chip")
            .forEach((b, i) => b.classList.toggle("active", i === 0));
        State.filters.role = "all";
        const si = document.getElementById("search-input");
        if (si) si.value = "";
        Admin.applyFilters();
    },

    deleteUser(uid, name) {
        UI.confirm(
            `Xoá "${name}"?`,
            "Xoá Firestore document. Firebase Auth record giữ nguyên.",
            async () => {
                try {
                    await db.collection("users").doc(uid).delete();
                    UI.toast("Đã xoá user.", "success");
                    await Admin.loadUsers();
                } catch (e) {
                    UI.toast(e.message, "error");
                }
            },
        );
    },

    clearFavs(uid, name) {
        UI.confirm(
            `Xoá toàn bộ yêu thích của "${name}"?`,
            "Hành động này không thể hoàn tác.",
            async () => {
                try {
                    const snap = await db
                        .collection("users")
                        .doc(uid)
                        .collection("favorites")
                        .get();
                    const batch = db.batch();
                    snap.docs.forEach((d) => batch.delete(d.ref));
                    await batch.commit();
                    UI.toast("Đã xoá yêu thích.", "success");
                    await Admin.loadUsers();
                } catch (e) {
                    UI.toast(e.message, "error");
                }
            },
        );
    },

    clearHistory(uid, name) {
        UI.confirm(
            `Xoá toàn bộ lịch sử của "${name}"?`,
            "Hành động này không thể hoàn tác.",
            async () => {
                try {
                    const snap = await db
                        .collection("users")
                        .doc(uid)
                        .collection("history")
                        .get();
                    const batch = db.batch();
                    snap.docs.forEach((d) => batch.delete(d.ref));
                    await batch.commit();
                    UI.toast("Đã xoá lịch sử.", "success");
                    await Admin.loadUsers();
                } catch (e) {
                    UI.toast(e.message, "error");
                }
            },
        );
    },

    toggleExpand(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const open = el.style.display !== "none";
        el.style.display = open ? "none" : "";
        const btn = document.querySelector(
            `[onclick="Admin.toggleExpand('${id}')"] i`,
        );
        if (btn) btn.style.transform = open ? "" : "rotate(180deg)";
    },

    toggleFilterPanel() {
        const panel = document.getElementById("filter-panel");
        const btn = document.getElementById("btn-filter-toggle");
        if (!panel) return;
        const open = panel.style.display !== "none";
        panel.style.display = open ? "none" : "block";
        btn?.classList.toggle("active", !open);
    },

    toggleDrop(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const isOpen = el.classList.contains("open");
        document
            .querySelectorAll(".adrop.open")
            .forEach((d) => d.classList.remove("open"));
        if (!isOpen) el.classList.add("open");
    },

    setDrop(id, val, label) {
        const el = document.getElementById(id);
        if (!el) return;
        el.dataset.val = val;
        el.querySelector(".adrop-label").textContent = label;
        el.querySelectorAll(".adrop-item").forEach((i) =>
            i.classList.toggle("active", i.dataset.val === val),
        );
    },

    closeConfirm() {
        UI.closeConfirm();
    },
};

// ── ❼ AUTH STATE — đứng SAU khi UI/Render/Admin đã khai báo ─────
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        UI.showAuthWall();
        return;
    }

    try {
        const doc = await db.collection("users").doc(user.uid).get();
        const data = doc.exists ? doc.data() : {};
        if (data.role !== "admin") {
            UI.toast("Tài khoản không có quyền admin.", "error");
            await auth.signOut();
            UI.showAuthWall();
            return;
        }
    } catch (e) {
        console.warn("Could not verify role:", e.message);
    }

    UI.hideAuthWall();

    // Load avatar từ Firestore
    try {
        const uDoc = await db.collection("users").doc(user.uid).get();
        const uData = uDoc.exists ? uDoc.data() : {};
        const avatarEl = document.getElementById("sidebar-avatar");
        if (avatarEl) {
            const src = uData.avatarUrl || user.photoURL || "";
            if (src) {
                avatarEl.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" referrerpolicy="no-referrer" />`;
            } else {
                avatarEl.textContent = (user.displayName || user.email || "A")
                    .substring(0, 1)
                    .toUpperCase();
            }
        }
    } catch {
        const avatarEl = document.getElementById("sidebar-avatar");
        if (avatarEl)
            avatarEl.textContent = (user.displayName || user.email || "A")
                .substring(0, 1)
                .toUpperCase();
    }

    const setEl = (id, v) => {
        const e = document.getElementById(id);
        if (e) e.textContent = v;
    };
    setEl("sidebar-name", user.displayName || user.email.split("@")[0]);
    setEl("sidebar-email", user.email);

    // Sync navbar dropdown header + avatar
    setEl("ddName", user.displayName || "Admin");
    setEl("ddEmail", user.email || "");
    const navUserBtn = document.getElementById("navUserBtn");
    if (navUserBtn) navUserBtn.style.display = "flex";
    // Navbar avatar — dùng lại avatarEl đã load ở trên
    try {
        const uDoc2 = await db.collection("users").doc(user.uid).get();
        const src2 = uDoc2.exists
            ? uDoc2.data().avatarUrl || user.photoURL || ""
            : user.photoURL || "";
        const navInit = document.getElementById("navUserInitial");
        if (navInit) {
            if (src2)
                navInit.innerHTML = `<img src="${src2}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" referrerpolicy="no-referrer" />`;
            else
                navInit.textContent = (user.displayName || user.email || "A")
                    .substring(0, 1)
                    .toUpperCase();
        }
    } catch {
        /* ignore */
    }

    Admin.loadAll();
});

// ── ❽ EVENT LISTENERS ───────────────────────────────────────────
document
    .getElementById("btn-login")
    .addEventListener("click", () => Admin.login());
document.getElementById("login-password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") Admin.login();
});
document.getElementById("confirm-ok").addEventListener("click", () => {
    UI.closeConfirm();
    if (State.confirmCb) State.confirmCb();
});
document.getElementById("confirm-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) UI.closeConfirm();
});

// Role chips
document.getElementById("filter-role")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".admin-chip");
    if (!btn) return;
    document
        .querySelectorAll("#filter-role .admin-chip")
        .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    State.filters.role = btn.dataset.val;
    Admin.applyFilters();
});

// Period tabs
document.getElementById("period-tabs")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".admin-period-btn");
    if (!btn) return;
    document
        .querySelectorAll(".admin-period-btn")
        .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    State.chartPeriod = btn.dataset.period;
    Chart.render();
});

window.addEventListener("resize", () => Chart.render());

// Adrop
document.addEventListener("click", (e) => {
    if (!e.target.closest(".adrop")) {
        document
            .querySelectorAll(".adrop.open")
            .forEach((d) => d.classList.remove("open"));
    }
    const item = e.target.closest(".adrop-item");
    if (item) {
        const drop = item.closest(".adrop");
        drop.querySelectorAll(".adrop-item").forEach((i) =>
            i.classList.remove("active"),
        );
        item.classList.add("active");
        drop.dataset.val = item.dataset.val;
        drop.querySelector(".adrop-label").textContent =
            item.textContent.trim();
        drop.classList.remove("open");
        Admin.applyFilters();
    }
});

// ── ❾ UTILS ─────────────────────────────────────────────────────
function esc(str) {
    return String(str || "").replace(
        /[&<>"']/g,
        (c) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            })[c],
    );
}
