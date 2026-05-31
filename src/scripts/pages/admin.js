// ═══════════════════════════════════════════════════════════════
// admin.js — Lyrix Admin Dashboard
// Đặt tại: src/scripts/pages/admin.js
// ═══════════════════════════════════════════════════════════════

// ── ❶ FIREBASE — dùng lại instance đã init bởi auth.js ────────
// admin.html load auth.js trước admin.js nên firebase đã sẵn sàng
// KHÔNG gọi firebase.initializeApp() lần 2 — sẽ bị lỗi trắng trang
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
    users: [], // enriched user objects
    playlists: [], // flat playlist list (all users)
    currentTab: "users",
    confirmCb: null,
};

// ── ❸ AUTH ──────────────────────────────────────────────────────
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
        // Nếu rules chặn read: vẫn cho vào nếu đã auth thành công
        // (hãy cập nhật Firestore rules để admin đọc được all users)
        console.warn("Could not verify role:", e.message);
    }

    // Vào được dashboard
    UI.hideAuthWall();
    const initials = (user.displayName || user.email || "A")
        .substring(0, 1)
        .toUpperCase();
    document.getElementById("sidebar-avatar").textContent = initials;
    document.getElementById("sidebar-name").textContent =
        user.displayName || user.email.split("@")[0];
    document.getElementById("sidebar-email").textContent = user.email;
    Admin.loadAll();
});

// ── ❹ ADMIN NAMESPACE ───────────────────────────────────────────
const Admin = {
    // ---------- AUTH ----------
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

    // ---------- LOAD ----------
    async loadAll() {
        await Promise.all([Admin.loadUsers(), Admin.loadPlaylists()]);
    },

    async loadUsers() {
        UI.setSkeletonRows("users-tbody", 7, 3);
        UI.setSkeletonRows("favhist-tbody", 4, 3);

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
                    return u;
                }),
            );

            State.users = enriched;

            // Stats
            const totalFavs = enriched.reduce((s, u) => s + u._favsCount, 0);
            const totalHist = enriched.reduce((s, u) => s + u._histCount, 0);
            document.getElementById("stat-users").textContent = enriched.length;
            document.getElementById("stat-favs").textContent = totalFavs;
            document.getElementById("stat-hist").textContent = totalHist;
            document.getElementById("badge-users").textContent =
                enriched.length;
            document.getElementById("users-count").textContent =
                enriched.length;
            document.getElementById("favhist-count").textContent =
                enriched.length;

            Render.users(State.users);
            Render.favHist(State.users);
        } catch (e) {
            UI.toast("Lỗi tải users: " + e.message, "error");
        }
    },

    async loadPlaylists() {
        try {
            const snap = await db.collection("users").get();
            State.playlists = [];

            for (const uDoc of snap.docs) {
                const plSnap = await db
                    .collection("users")
                    .doc(uDoc.id)
                    .collection("playlists")
                    .get();
                plSnap.docs.forEach((pl) => {
                    State.playlists.push({
                        ...pl.data(),
                        _id: pl.id,
                        _uid: uDoc.id,
                        _ownerName:
                            uDoc.data().displayName ||
                            uDoc.data().email ||
                            uDoc.id,
                        _ownerEmail: uDoc.data().email || "",
                    });
                });
            }

            document.getElementById("stat-pl").textContent =
                State.playlists.length;
            document.getElementById("badge-playlists").textContent =
                State.playlists.length;
            document.getElementById("playlists-count").textContent =
                State.playlists.length;
            Render.playlists(State.playlists);
        } catch (e) {
            UI.toast("Lỗi tải playlists: " + e.message, "error");
        }
    },

    // ---------- ACTIONS ----------
    blockUser(uid) {
        UI.confirm(
            "Block người dùng?",
            "Họ sẽ bị đánh dấu blocked. Có thể unblock sau.",
            async () => {
                try {
                    await db
                        .collection("users")
                        .doc(uid)
                        .update({ blocked: true });
                    UI.toast("Đã block người dùng.", "success");
                    await Admin.loadUsers();
                } catch (e) {
                    UI.toast(e.message, "error");
                }
            },
        );
    },

    async unblockUser(uid) {
        try {
            await db.collection("users").doc(uid).update({ blocked: false });
            UI.toast("Đã unblock người dùng.", "success");
            await Admin.loadUsers();
        } catch (e) {
            UI.toast(e.message, "error");
        }
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

    deletePlaylist(uid, plId, name) {
        UI.confirm(
            `Xoá playlist "${name}"?`,
            "Hành động này không thể hoàn tác.",
            async () => {
                try {
                    await db
                        .collection("users")
                        .doc(uid)
                        .collection("playlists")
                        .doc(plId)
                        .delete();
                    UI.toast("Đã xoá playlist.", "success");
                    await Admin.loadPlaylists();
                } catch (e) {
                    UI.toast(e.message, "error");
                }
            },
        );
    },

    // ---------- SORT & SEARCH ----------
    sortUsers(val) {
        const sorted = [...State.users];
        switch (val) {
            case "newest":
                sorted.sort(
                    (a, b) =>
                        (b.createdAt?.seconds || 0) -
                        (a.createdAt?.seconds || 0),
                );
                break;
            case "oldest":
                sorted.sort(
                    (a, b) =>
                        (a.createdAt?.seconds || 0) -
                        (b.createdAt?.seconds || 0),
                );
                break;
            case "name":
                sorted.sort((a, b) =>
                    (a.displayName || "").localeCompare(b.displayName || ""),
                );
                break;
            case "favs":
                sorted.sort((a, b) => b._favsCount - a._favsCount);
                break;
        }
        Render.users(sorted);
    },

    handleSearch() {
        const q = document
            .getElementById("search-input")
            .value.toLowerCase()
            .trim();
        if (!q) {
            Render.users(State.users);
            Render.favHist(State.users);
            Render.playlists(State.playlists);
            return;
        }
        const matchUser = (u) =>
            (u.displayName || "").toLowerCase().includes(q) ||
            (u.email || "").toLowerCase().includes(q) ||
            u.id.toLowerCase().includes(q);

        if (State.currentTab === "users")
            Render.users(State.users.filter(matchUser));
        if (State.currentTab === "favhist")
            Render.favHist(State.users.filter(matchUser));
        if (State.currentTab === "playlists")
            Render.playlists(
                State.playlists.filter(
                    (p) =>
                        (p.name || "").toLowerCase().includes(q) ||
                        (p._ownerName || "").toLowerCase().includes(q),
                ),
            );
    },

    // ---------- UI HELPERS ----------
    switchTab(tab) {
        State.currentTab = tab;
        document
            .querySelectorAll(".admin-tab-panel")
            .forEach((p) => p.classList.remove("active"));
        document
            .querySelectorAll(".admin-nav-item")
            .forEach((n) => n.classList.remove("active"));
        document.getElementById("tab-" + tab).classList.add("active");
        document
            .querySelector(`.admin-nav-item[data-tab="${tab}"]`)
            .classList.add("active");
        const titles = {
            users: "Quản lý người dùng",
            favhist: "Yêu thích & Lịch sử",
            playlists: "Quản lý Playlist",
        };
        document.getElementById("page-title").textContent = titles[tab] || "";
        document.getElementById("search-input").value = "";
        Admin.handleSearch();
    },

    toggleExpand(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = el.style.display === "none" ? "" : "none";
    },

    closeConfirm() {
        UI.closeConfirm();
    },
};

// ── ❺ RENDER ────────────────────────────────────────────────────
const Render = {
    users(users) {
        const tb = document.getElementById("users-tbody");
        if (!users.length) {
            tb.innerHTML = `<tr><td colspan="7"><div class="admin-empty"><i class="fa-solid fa-users-slash"></i><span>Không có người dùng nào</span></div></td></tr>`;
            return;
        }
        tb.innerHTML = users
            .map((u) => {
                const blocked = u.blocked === true;
                const isAdmin = u.role === "admin";
                const initials = (u.displayName || u.email || "?")
                    .substring(0, 2)
                    .toUpperCase();
                const avatarHtml = u.avatarUrl
                    ? `<div class="admin-user-av"><img src="${u.avatarUrl}" onerror="this.parentElement.textContent='${initials}'" /></div>`
                    : `<div class="admin-user-av">${initials}</div>`;

                const expandId = `expand-${u.id}`;

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
            <span class="badge ${isAdmin ? "badge-brand" : "admin-badge-user"}">
              ${isAdmin ? '<i class="fa-solid fa-shield-halved"></i> admin' : "user"}
            </span>
          </td>
          <td class="admin-mono">${u._favsCount}</td>
          <td class="admin-mono">${u._histCount}</td>
          <td class="admin-mono">${u._plCount}</td>
          <td>
            <span class="badge ${blocked ? "admin-badge-blocked" : "badge-success"}">
              ${blocked ? "blocked" : "active"}
            </span>
          </td>
          <td>
            <div class="admin-action-btns">
              <button class="btn btn-ghost btn-sm" onclick="Admin.toggleExpand('${expandId}')">
                <i class="fa-solid fa-chevron-down"></i>
              </button>
              ${
                  !isAdmin
                      ? `
              <button class="btn btn-sm ${blocked ? "btn-outline" : "admin-btn-warn"}"
                onclick="${blocked ? `Admin.unblockUser('${u.id}')` : `Admin.blockUser('${u.id}')`}">
                ${blocked ? "Unblock" : "Block"}
              </button>
              <button class="btn btn-sm btn-danger" onclick="Admin.deleteUser('${u.id}','${esc(u.displayName || u.email || u.id)}')">
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
              </div>
              <div class="admin-sub-grid">
                <div class="admin-sub-section">
                  <div class="admin-sub-title">
                    <i class="fa-solid fa-heart" style="color:#f87171"></i>
                    Yêu thích (${u._favsCount})
                  </div>
                  ${Render._subItems(u._favDocs)}
                  ${u._favsCount > 5 ? `<div class="admin-sub-more">+${u._favsCount - 5} bài khác</div>` : ""}
                </div>
                <div class="admin-sub-section">
                  <div class="admin-sub-title">
                    <i class="fa-solid fa-clock-rotate-left" style="color:var(--accent)"></i>
                    Lịch sử (${u._histCount})
                  </div>
                  ${Render._subItems(u._histDocs)}
                  ${u._histCount > 5 ? `<div class="admin-sub-more">+${u._histCount - 5} mục khác</div>` : ""}
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

    favHist(users) {
        const tb = document.getElementById("favhist-tbody");
        if (!users.length) {
            tb.innerHTML = `<tr><td colspan="4"><div class="admin-empty"><i class="fa-solid fa-database"></i><span>Không có dữ liệu</span></div></td></tr>`;
            return;
        }
        tb.innerHTML = users
            .map((u) => {
                const initials = (u.displayName || u.email || "?")
                    .substring(0, 2)
                    .toUpperCase();
                return `
        <tr>
          <td>
            <div class="admin-user-cell">
              ${
                  u.avatarUrl
                      ? `<div class="admin-user-av"><img src="${u.avatarUrl}" /></div>`
                      : `<div class="admin-user-av">${initials}</div>`
              }
              <div>
                <div class="admin-user-name">${esc(u.displayName || "—")}</div>
                <div class="admin-user-email">${esc(u.email || u.id)}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="admin-fav-count">${u._favsCount}</span>
            <span class="admin-count-label">bài</span>
          </td>
          <td>
            <span class="admin-hist-count">${u._histCount}</span>
            <span class="admin-count-label">mục</span>
          </td>
          <td>
            <div class="admin-action-btns">
              <button class="btn btn-sm btn-danger"
                onclick="Admin.clearFavs('${u.id}','${esc(u.displayName || u.email || u.id)}')">
                <i class="fa-solid fa-heart-crack"></i> Xoá yêu thích
              </button>
              <button class="btn btn-sm btn-danger"
                onclick="Admin.clearHistory('${u.id}','${esc(u.displayName || u.email || u.id)}')">
                <i class="fa-solid fa-clock"></i> Xoá lịch sử
              </button>
            </div>
          </td>
        </tr>`;
            })
            .join("");
    },

    playlists(playlists) {
        const grid = document.getElementById("playlists-grid");
        if (!playlists.length) {
            grid.innerHTML = `<div class="admin-empty" style="grid-column:1/-1"><i class="fa-solid fa-music"></i><span>Không có playlist nào</span></div>`;
            return;
        }
        grid.innerHTML = playlists
            .map((pl) => {
                const songCount = Array.isArray(pl.songs) ? pl.songs.length : 0;
                const coverHtml = pl.coverUrl
                    ? `<img src="${pl.coverUrl}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="admin-pl-cover-fallback" style="display:none"><i class="fa-solid fa-music"></i></div>`
                    : `<div class="admin-pl-cover-fallback"><i class="fa-solid fa-music"></i></div>`;
                return `
        <div class="playlist-card">
          <div class="playlist-card-img">${coverHtml}</div>
          <div class="playlist-card-info">
            <div class="playlist-card-name">${esc(pl.name || "Untitled")}</div>
            <div class="playlist-card-meta">${songCount} bài · ${pl._id.substring(0, 8)}…</div>
            <div class="admin-pl-owner">
              <i class="fa-solid fa-user" style="font-size:.7rem"></i>
              ${esc(pl._ownerName)}
            </div>
            <button class="btn btn-sm btn-danger"
              style="width:100%;justify-content:center;margin-top:.6rem"
              onclick="Admin.deletePlaylist('${pl._uid}','${pl._id}','${esc(pl.name || "Untitled")}')">
              <i class="fa-solid fa-trash"></i> Xoá
            </button>
          </div>
        </div>`;
            })
            .join("");
    },
};

// ── ❻ UI HELPERS ────────────────────────────────────────────────
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
        const modal = document.getElementById("confirm-modal");
        modal.style.display = "flex";
        State.confirmCb = cb;
    },
    closeConfirm() {
        document.getElementById("confirm-modal").style.display = "none";
        State.confirmCb = null;
    },
};

document.getElementById("confirm-ok").addEventListener("click", () => {
    UI.closeConfirm();
    if (State.confirmCb) State.confirmCb();
});
document.getElementById("confirm-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) UI.closeConfirm();
});

// ── ❼ UTILS ─────────────────────────────────────────────────────
// ⚠️ Event listeners cho login phải đặt SAU khi Admin đã được khai báo
document.getElementById("btn-login").addEventListener("click", () => Admin.login());
document.getElementById("login-password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") Admin.login();
});

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
