// ─── profile.js ──────────────────────────────────────────────────────────────

let currentUser = null;
let currentTab = "favorites";
let profileData = {};

const AVATAR_MAX_PX = 300;
const PHOTO_MAX_PX = 900;
const PHOTO_QUALITY = 0.78;

// ─── Image resize helper ──────────────────────────────────────────────────────
function fileToBase64(file, maxPx, quality = 0.82) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
                let { width, height } = img;
                if (width > maxPx || height > maxPx) {
                    if (width > height) {
                        height = Math.round((height / width) * maxPx);
                        width = maxPx;
                    } else {
                        width = Math.round((width / height) * maxPx);
                        height = maxPx;
                    }
                }
                const c = document.createElement("canvas");
                c.width = width;
                c.height = height;
                c.getContext("2d").drawImage(img, 0, 0, width, height);
                resolve(c.toDataURL("image/jpeg", quality));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// ─── Auth gate ────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    const timeout = setTimeout(() => {
        window.location.href = "index.html";
    }, 3500);
    const checkAuth = setInterval(() => {
        if (typeof firebase === "undefined") return;
        clearInterval(checkAuth);
        clearTimeout(timeout);
        firebase.auth().onAuthStateChanged((user) => {
            if (!user) {
                window.location.href = "index.html";
                return;
            }
            currentUser = user;
            initProfile(user);
        });
    }, 100);
});

// ─── Init ─────────────────────────────────────────────────────────────────────
async function initProfile(user) {
    document.title = `${user.displayName || "Hồ sơ"} — Lyrix`;

    // Load Firestore profile
    try {
        const db = firebase.firestore();
        const ref = db.collection("users").doc(user.uid);
        const doc = await ref.get();

        if (doc.exists) {
            profileData = doc.data();
        } else {
            profileData = {
                displayName: user.displayName || "",
                email: user.email || "",
                role: "",
                bio: "",
                dob: "",
                phone: "",
                location: "",
                avatarUrl: user.photoURL || "",
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            };
            await ref.set(profileData);
        }

        // Merge auth info
        if (!profileData.avatarUrl && user.photoURL)
            profileData.avatarUrl = user.photoURL;
        if (!profileData.displayName && user.displayName)
            profileData.displayName = user.displayName;
    } catch {
        profileData = {
            displayName: user.displayName || "",
            email: user.email || "",
        };
    }

    renderHero();
    loadFavorites();
}

// ─── Render hero ──────────────────────────────────────────────────────────────
function renderHero() {
    // Avatar
    renderAvatar();

    // Text fields
    document.getElementById("profileName").textContent =
        profileData.displayName || currentUser.displayName || "Người dùng";
    document.getElementById("profileEmail").textContent =
        profileData.email || currentUser.email || "";
    document.getElementById("profileRole").textContent = profileData.role || "";
    document.getElementById("profileBio").textContent = profileData.bio || "";

    // Ngày tham gia
    const joined = document.getElementById("statJoined");
    let date = null;
    if (profileData.createdAt?.toDate) date = profileData.createdAt.toDate();
    else if (typeof profileData.createdAt === "string")
        date = new Date(profileData.createdAt);
    if (date && !isNaN(date)) {
        joined.textContent = date.toLocaleDateString("vi-VN", {
            month: "long",
            year: "numeric",
        });
    }

    // Info chips
    const chips = [];
    if (profileData.dob)
        chips.push(
            `<span class="info-chip"><i class="fa-solid fa-cake-candles"></i> ${formatDob(profileData.dob)}</span>`,
        );
    if (profileData.phone)
        chips.push(
            `<span class="info-chip"><i class="fa-solid fa-phone"></i> ${profileData.phone}</span>`,
        );
    if (profileData.location)
        chips.push(
            `<span class="info-chip"><i class="fa-solid fa-location-dot"></i> ${profileData.location}</span>`,
        );
    document.getElementById("profileInfoChips").innerHTML = chips.join("");
}

function formatDob(dob) {
    if (!dob) return "";
    const d = new Date(dob);
    if (isNaN(d)) return dob;
    return d.toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function renderAvatar() {
    const el = document.getElementById("profileAvatar");
    if (!el) return;
    const src = profileData.avatarUrl || currentUser?.photoURL || "";
    if (src) {
        el.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" referrerpolicy="no-referrer"/>`;
    } else {
        el.textContent = (profileData.displayName ||
            currentUser?.displayName ||
            "U")[0].toUpperCase();
    }
    // Sync navbar qua NavBar.ready
    if (window.NavBar && currentUser) {
        NavBar.ready(currentUser, profileData.role || "user", src || null);
    }
}

window.handleAvatarChange = async function (e) {
    const file = e.target.files[0];
    if (!file || !currentUser) return;
    if (file.size > 3 * 1024 * 1024) {
        showToast("Ảnh tối đa 3MB", "error");
        return;
    }
    showToast("Đang xử lý ảnh…");
    try {
        const base64 = await fileToBase64(file, AVATAR_MAX_PX, 0.85);
        await firebase
            .firestore()
            .collection("users")
            .doc(currentUser.uid)
            .set({ avatarUrl: base64 }, { merge: true });
        profileData.avatarUrl = base64;
        // Cập nhật localStorage cache → các trang khác dùng được ngay
        if (currentUser)
            localStorage.setItem("lyrix_avatarUrl_" + currentUser.uid, base64);
        renderAvatar();
        showToast("Đã cập nhật ảnh đại diện", "success");
    } catch {
        showToast("Lỗi cập nhật ảnh", "error");
    }
};

// ─── Edit profile modal ───────────────────────────────────────────────────────
window.openEditModal = function () {
    document.getElementById("editName").value =
        profileData.displayName || currentUser?.displayName || "";
    document.getElementById("editRole").value = profileData.role || "";
    document.getElementById("editBio").value = profileData.bio || "";
    document.getElementById("editDob").value = profileData.dob || "";
    document.getElementById("editPhone").value = profileData.phone || "";
    document.getElementById("editLocation").value = profileData.location || "";
    document.getElementById("editError").classList.remove("show");
    document.getElementById("editModalOverlay").classList.add("open");
    setTimeout(() => document.getElementById("editName").focus(), 100);
};
window.closeEditModal = function () {
    document.getElementById("editModalOverlay").classList.remove("open");
};
document.getElementById("editModalOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "editModalOverlay") closeEditModal();
});

window.saveProfile = async function () {
    const name = document.getElementById("editName").value.trim();
    const errEl = document.getElementById("editError");
    const btn = document.getElementById("saveEditBtn");
    if (!name) {
        errEl.textContent = "Tên không được để trống.";
        errEl.classList.add("show");
        return;
    }
    try {
        btn.disabled = true;
        btn.innerHTML =
            '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang lưu...';
        const updates = {
            displayName: name,
            role: document.getElementById("editRole").value.trim(),
            bio: document.getElementById("editBio").value.trim(),
            dob: document.getElementById("editDob").value,
            phone: document.getElementById("editPhone").value.trim(),
            location: document.getElementById("editLocation").value.trim(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        };
        await currentUser.updateProfile({ displayName: name });
        await firebase
            .firestore()
            .collection("users")
            .doc(currentUser.uid)
            .set(updates, { merge: true });
        Object.assign(profileData, updates);
        renderHero();
        // Sync navbar
        const ddName = document.getElementById("ddName");
        if (ddName) ddName.textContent = name;
        closeEditModal();
        showToast("Đã cập nhật hồ sơ", "success");
    } catch {
        errEl.textContent = "Có lỗi xảy ra. Thử lại sau.";
        errEl.classList.add("show");
    } finally {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.label;
    }
};

// ─── Tab switching ────────────────────────────────────────────────────────────
window.switchProfileTab = function (tab) {
    currentTab = tab;
    ["favorites", "history", "playlists", "photos"].forEach((t) => {
        document
            .getElementById("tab_" + t)
            ?.classList.toggle("active", t === tab);
    });
    document.getElementById("profileTabContent").innerHTML =
        `<div style="display:flex;flex-direction:column;gap:.5rem">
            ${Array(4).fill('<div class="skeleton" style="height:72px;border-radius:12px"></div>').join("")}
        </div>`;
    if (tab === "favorites") loadFavorites();
    else if (tab === "history") loadHistory();
    else if (tab === "playlists") loadPlaylists();
    else if (tab === "photos") loadPhotos();
};

// ─── Favorites ────────────────────────────────────────────────────────────────
async function loadFavorites() {
    if (!currentUser) return;
    try {
        const snap = await firebase
            .firestore()
            .collection("users")
            .doc(currentUser.uid)
            .collection("favorites")
            .orderBy("savedAt", "desc")
            .limit(50)
            .get();
        const items = snap.docs.map((d) => d.data());
        document.getElementById("statFavorites").textContent = items.length;
        if (!items.length) {
            renderEmpty("favorites");
            return;
        }
        document.getElementById("profileTabContent").innerHTML =
            `<div style="display:flex;flex-direction:column;gap:.5rem">
                ${items.map((s, i) => renderSongRow(s, i, "favorites")).join("")}
            </div>`;
    } catch {
        renderError("Không tải được danh sách yêu thích.");
    }
}

// ─── History ──────────────────────────────────────────────────────────────────
async function loadHistory() {
    if (!currentUser) return;
    try {
        const snap = await firebase
            .firestore()
            .collection("users")
            .doc(currentUser.uid)
            .collection("history")
            .orderBy("viewedAt", "desc")
            .limit(50)
            .get();
        const items = snap.docs.map((d) => d.data());
        document.getElementById("statHistory").textContent = items.length;
        if (!items.length) {
            renderEmpty("history");
            return;
        }
        document.getElementById("profileTabContent").innerHTML =
            `<div style="display:flex;flex-direction:column;gap:.5rem">
                ${items.map((s, i) => renderSongRow(s, i, "history")).join("")}
            </div>`;
    } catch {
        renderError("Không tải được lịch sử xem.");
    }
}

// ─── Playlists ────────────────────────────────────────────────────────────────
async function loadPlaylists() {
    if (!currentUser) return;
    try {
        const snap = await firebase
            .firestore()
            .collection("users")
            .doc(currentUser.uid)
            .collection("playlists")
            .orderBy("createdAt", "desc")
            .limit(30)
            .get();
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        document.getElementById("statPlaylists").textContent = items.length;
        const el = document.getElementById("profileTabContent");
        if (!items.length) {
            el.innerHTML = `<div class="empty-state">
                <i class="fa-solid fa-list-music" style="color:var(--text-3);font-size:2rem;margin-bottom:.75rem"></i>
                <h3>Chưa có playlist nào</h3>
                <p style="color:var(--text-3);font-size:.85rem;margin-top:.5rem">Tạo playlist để lưu những bài hát yêu thích</p>
                <button class="btn btn-primary btn-sm" style="margin-top:1.25rem" onclick="openCreatePlaylist()">
                    <i class="fa-solid fa-plus"></i> Tạo playlist
                </button>
            </div>`;
            return;
        }
        el.innerHTML = `
            <div style="display:flex;justify-content:flex-end;margin-bottom:.75rem">
                <button class="btn btn-primary btn-sm" onclick="openCreatePlaylist()">
                    <i class="fa-solid fa-plus"></i> Tạo playlist mới
                </button>
            </div>
            <div class="playlist-grid">
                ${items.map((p, i) => renderPlaylistCard(p, i)).join("")}
            </div>`;
    } catch {
        renderError("Không tải được danh sách playlist.");
    }
}

function renderPlaylistCard(p, i) {
    const PH = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='120' height='120' fill='%23242429'/><text x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-size='40' fill='%2371717a'>♪</text></svg>`;
    return `<div class="playlist-card animate-slide-up" style="animation-delay:${Math.min(i, 8) * 0.05}s">
        <div class="playlist-card-img">
            <img src="${p.coverUrl || PH}" alt="${p.name}" onerror="this.src='${PH}'"/>
            <div class="playlist-card-overlay"><i class="fa-solid fa-play"></i></div>
        </div>
        <div class="playlist-card-info">
            <div class="playlist-card-name">${p.name}</div>
            <div class="playlist-card-meta">${p.songCount || 0} bài hát</div>
        </div>
        <button class="playlist-card-edit" title="Chỉnh sửa"
            onclick="openEditPlaylist('${p.id}','${esc(p.name)}','${p.coverUrl || ""}')">
            <i class="fa-solid fa-ellipsis"></i>
        </button>
    </div>`;
}

// ─── Photos (from MeetMe) ─────────────────────────────────────────────────────
async function loadPhotos() {
    if (!currentUser) return;
    const el = document.getElementById("profileTabContent");
    try {
        const snap = await firebase
            .firestore()
            .collection("users")
            .doc(currentUser.uid)
            .collection("photos")
            .orderBy("createdAt", "desc")
            .limit(30)
            .get();
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        if (!items.length) {
            el.innerHTML = `<div class="empty-state">
                <i class="fa-regular fa-images" style="color:var(--text-3);font-size:2rem;margin-bottom:.75rem"></i>
                <h3>Chưa có ảnh nào</h3>
                <p style="color:var(--text-3);font-size:.85rem;margin-top:.5rem">Upload ảnh để lưu vào hồ sơ của bạn</p>
                <label class="btn btn-primary btn-sm" style="margin-top:1.25rem;cursor:pointer">
                    <i class="fa-solid fa-cloud-arrow-up"></i> Upload ảnh
                    <input type="file" accept="image/*" style="display:none" onchange="handlePhotoUpload(event)"/>
                </label>
            </div>`;
            return;
        }

        el.innerHTML = `
            <div style="display:flex;justify-content:flex-end;margin-bottom:.75rem">
                <label class="btn btn-primary btn-sm" style="cursor:pointer">
                    <i class="fa-solid fa-cloud-arrow-up"></i> Upload ảnh
                    <input type="file" accept="image/*" style="display:none" onchange="handlePhotoUpload(event)"/>
                </label>
            </div>
            <div class="photo-grid">
                ${items
                    .map(
                        (p, i) => `
                    <div class="photo-item animate-slide-up" style="animation-delay:${Math.min(i, 9) * 0.04}s">
                        <img src="${p.base64}" alt="photo" loading="lazy"/>
                        <button class="photo-delete" onclick="deletePhoto('${p.id}',this)" title="Xoá ảnh">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>`,
                    )
                    .join("")}
            </div>`;
    } catch {
        renderError("Không tải được ảnh.");
    }
}

window.handlePhotoUpload = async function (e) {
    const file = e.target.files[0];
    if (!file || !currentUser) return;
    if (file.size > 5 * 1024 * 1024) {
        showToast("Ảnh tối đa 5MB", "error");
        return;
    }
    showToast("Đang xử lý ảnh…");
    try {
        const base64 = await fileToBase64(file, PHOTO_MAX_PX, PHOTO_QUALITY);
        await firebase
            .firestore()
            .collection("users")
            .doc(currentUser.uid)
            .collection("photos")
            .add({ base64, createdAt: Date.now() });
        showToast("Đã thêm ảnh", "success");
        loadPhotos();
    } catch {
        showToast("Lỗi upload ảnh", "error");
    }
};

window.deletePhoto = async function (photoId, btn) {
    if (!confirm("Xoá ảnh này?")) return;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
    try {
        await firebase
            .firestore()
            .collection("users")
            .doc(currentUser.uid)
            .collection("photos")
            .doc(photoId)
            .delete();
        showToast("Đã xoá ảnh", "success");
        loadPhotos();
    } catch {
        showToast("Không xoá được, thử lại.", "error");
    }
};

// ─── Playlist modal ───────────────────────────────────────────────────────────
window.openCreatePlaylist = function () {
    document.getElementById("plModalTitle").textContent = "Tạo playlist mới";
    document.getElementById("plName").value = "";
    document.getElementById("plCoverPreview").style.display = "none";
    document.getElementById("plCoverPlaceholder").style.display = "flex";
    document.getElementById("plError").classList.remove("show");
    document.getElementById("savePlBtn").dataset.mode = "create";
    document.getElementById("savePlBtn").dataset.plId = "";
    document.getElementById("deletePlBtn").style.display = "none";
    document.getElementById("plModalOverlay").classList.add("open");
    window._plCoverDataUrl = null;
    setTimeout(() => document.getElementById("plName").focus(), 100);
};

window.openEditPlaylist = function (plId, name, coverUrl) {
    document.getElementById("plModalTitle").textContent = "Chỉnh sửa playlist";
    document.getElementById("plName").value = name;
    const prev = document.getElementById("plCoverPreview");
    if (coverUrl) {
        prev.src = coverUrl;
        prev.style.display = "block";
        document.getElementById("plCoverPlaceholder").style.display = "none";
    } else {
        prev.style.display = "none";
        document.getElementById("plCoverPlaceholder").style.display = "flex";
    }
    document.getElementById("plError").classList.remove("show");
    document.getElementById("savePlBtn").dataset.mode = "edit";
    document.getElementById("savePlBtn").dataset.plId = plId;
    document.getElementById("deletePlBtn").style.display = "inline-flex";
    document.getElementById("plModalOverlay").classList.add("open");
    window._plCoverDataUrl = coverUrl || null;
};

window.closePlModal = function () {
    document.getElementById("plModalOverlay").classList.remove("open");
};
document.getElementById("plModalOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "plModalOverlay") closePlModal();
});

window.handlePlCoverChange = async function (e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        showToast("Ảnh tối đa 2MB", "error");
        return;
    }
    const base64 = await fileToBase64(file, 400, 0.85);
    window._plCoverDataUrl = base64;
    const prev = document.getElementById("plCoverPreview");
    prev.src = base64;
    prev.style.display = "block";
    document.getElementById("plCoverPlaceholder").style.display = "none";
};

window.savePlaylist = async function () {
    const btn = document.getElementById("savePlBtn");
    const name = document.getElementById("plName").value.trim();
    const errEl = document.getElementById("plError");
    const mode = btn.dataset.mode;
    const plId = btn.dataset.plId;
    if (!name) {
        errEl.textContent = "Tên playlist không được để trống.";
        errEl.classList.add("show");
        return;
    }
    try {
        btn.disabled = true;
        btn.innerHTML =
            '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang lưu...';
        const col = firebase
            .firestore()
            .collection("users")
            .doc(currentUser.uid)
            .collection("playlists");
        const data = {
            name,
            coverUrl: window._plCoverDataUrl || "",
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };
        if (mode === "create") {
            await col.add({
                ...data,
                songCount: 0,
                songs: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
            showToast("Đã tạo playlist", "success");
        } else {
            await col.doc(plId).set(data, { merge: true });
            showToast("Đã cập nhật playlist", "success");
        }
        closePlModal();
        loadPlaylists();
    } catch {
        errEl.textContent = "Có lỗi xảy ra.";
        errEl.classList.add("show");
    } finally {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.label;
    }
};

window.deletePlaylist = async function (plId) {
    if (!plId || !confirm("Xoá playlist này?")) return;
    try {
        await firebase
            .firestore()
            .collection("users")
            .doc(currentUser.uid)
            .collection("playlists")
            .doc(plId)
            .delete();
        closePlModal();
        showToast("Đã xoá playlist", "success");
        loadPlaylists();
    } catch {
        showToast("Không xoá được.", "error");
    }
};

// ─── Remove favorite / history ────────────────────────────────────────────────
window.removeFavorite = async function (songId, btn) {
    btn.innerHTML =
        '<i class="fa-solid fa-circle-notch fa-spin" style="font-size:13px"></i>';
    try {
        await firebase
            .firestore()
            .collection("users")
            .doc(currentUser.uid)
            .collection("favorites")
            .doc(String(songId))
            .delete();
        removeRow(btn, "statFavorites", "favorites");
    } catch {
        showToast("Không xoá được.", "error");
    }
};
window.removeHistory = async function (songId, btn) {
    btn.innerHTML =
        '<i class="fa-solid fa-circle-notch fa-spin" style="font-size:13px"></i>';
    try {
        await firebase
            .firestore()
            .collection("users")
            .doc(currentUser.uid)
            .collection("history")
            .doc(String(songId))
            .delete();
        removeRow(btn, "statHistory", "history");
    } catch {
        showToast("Không xoá được.", "error");
    }
};
function removeRow(btn, statId, emptyType) {
    const row = btn.closest(".chart-item");
    Object.assign(row.style, {
        opacity: "0",
        transform: "translateX(20px)",
        transition: "all .25s ease",
    });
    setTimeout(() => {
        row.remove();
        const count = document.querySelectorAll(
            "#profileTabContent .chart-item",
        ).length;
        document.getElementById(statId).textContent = count;
        if (!count) renderEmpty(emptyType);
    }, 250);
}

// ─── Render helpers ───────────────────────────────────────────────────────────
const PH = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='52' height='52'><rect width='52' height='52' fill='%23242429'/><text x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-size='20' fill='%2371717a'>♪</text></svg>`;

function renderSongRow(s, i, type) {
    const ts =
        type === "favorites"
            ? s.savedAt?.toMillis?.() || null
            : s.viewedAt?.toMillis?.() || null;
    return `<div class="chart-item animate-slide-up" style="animation-delay:${Math.min(i, 10) * 0.04}s;cursor:pointer"
        onclick="window.location.href='details-song.html?id=${s.songId}'">
        <img class="chart-image" src="${s.artUrl || PH}" alt="" onerror="this.src='${PH}'"/>
        <div class="chart-info">
            <div class="chart-title">${s.title || "—"}</div>
            <div class="chart-sub">${s.artist || ""}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0">
            <span style="font-size:.7rem;color:var(--text-3)">${ts ? formatRelativeTime(ts) : ""}</span>
            ${
                type === "favorites"
                    ? `<button class="btn-fav-remove" onclick="event.stopPropagation();removeFavorite('${s.songId}',this)">
                    <i class="fa-solid fa-heart" style="color:#f87171;font-size:13px"></i></button>`
                    : `<button class="btn-fav-remove" onclick="event.stopPropagation();removeHistory('${s.songId}',this)">
                    <i class="fa-solid fa-xmark" style="font-size:13px;color:var(--text-3)"></i></button>`
            }
        </div>
    </div>`;
}

function renderEmpty(type) {
    const map = {
        favorites: {
            icon: "fa-heart",
            text: "Chưa có bài hát yêu thích",
            sub: "Nhấn ❤️ trên trang chi tiết bài hát để lưu",
        },
        history: {
            icon: "fa-clock-rotate-left",
            text: "Chưa có lịch sử xem",
            sub: "Lịch sử sẽ tự động ghi lại khi bạn xem bài hát",
        },
    };
    const m = map[type] || map.favorites;
    document.getElementById("profileTabContent").innerHTML =
        `<div class="empty-state">
            <i class="fa-solid ${m.icon}" style="color:var(--text-3);font-size:2rem;margin-bottom:.75rem"></i>
            <h3>${m.text}</h3>
            <p style="color:var(--text-3);font-size:.85rem;margin-top:.5rem">${m.sub}</p>
            <a href="index.html" class="btn btn-outline btn-sm" style="margin-top:1.25rem">Khám phá nhạc</a>
        </div>`;
}
function renderError(msg) {
    document.getElementById("profileTabContent").innerHTML =
        `<div class="empty-state">
            <i class="fa-solid fa-triangle-exclamation" style="color:#f87171;font-size:2rem;margin-bottom:.75rem"></i>
            <h3>${msg}</h3>
        </div>`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function esc(str) {
    return (str || "").replace(/'/g, "&#39;").replace(/"/g, "&quot;");
}
function formatRelativeTime(ts) {
    if (!ts) return "";
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Vừa xong";
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d} ngày trước`;
    return new Date(ts).toLocaleDateString("vi-VN");
}
function showToast(msg, type = "success") {
    const el = document.createElement("div");
    el.className = "error-toast";
    el.style.cssText = `border-left:3px solid ${type === "success" ? "#4ade80" : "#f87171"}`;
    el.innerHTML = `<i class="fa-solid ${type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}"
        style="color:${type === "success" ? "#4ade80" : "#f87171"};margin-right:8px"></i>${msg}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

// ─── Override switchProfileTab để sync stat boxes và tab buttons mới ─────────
window.switchProfileTab = function (tab) {
    currentTab = tab;

    // Tab buttons
    ["favorites", "history", "playlists", "photos"].forEach((t) => {
        document
            .getElementById("tab_" + t)
            ?.classList.toggle("active", t === tab);
    });

    // Stat boxes
    ["favorites", "history", "playlists", "photos"].forEach((t) => {
        document
            .getElementById("statBox_" + t)
            ?.classList.toggle("active", t === tab);
    });

    document.getElementById("profileTabContent").innerHTML =
        `<div style="display:flex;flex-direction:column;gap:.5rem">
            ${Array(4).fill('<div class="skeleton" style="height:72px;border-radius:12px"></div>').join("")}
        </div>`;

    if (tab === "favorites") loadFavorites();
    else if (tab === "history") loadHistory();
    else if (tab === "playlists") loadPlaylists();
    else if (tab === "photos") loadPhotos();
};

// ─── Cover image ──────────────────────────────────────────────────────────────
window.handleCoverChange = async function (e) {
    const file = e.target.files[0];
    if (!file || !currentUser) return;
    if (file.size > 3 * 1024 * 1024) {
        showToast("Ảnh tối đa 3MB", "error");
        return;
    }
    showToast("Đang xử lý ảnh bìa…");
    try {
        const base64 = await fileToBase64(file, 1200, 0.82);
        await firebase
            .firestore()
            .collection("users")
            .doc(currentUser.uid)
            .set({ coverUrl: base64 }, { merge: true });
        profileData.coverUrl = base64;
        const cover = document.getElementById("profileCover");
        if (cover) {
            cover.style.backgroundImage = `url('${base64}')`;
            cover.style.backgroundSize = "cover";
            cover.style.backgroundPosition = "center";
        }
        showToast("Đã cập nhật ảnh bìa", "success");
    } catch {
        showToast("Lỗi cập nhật ảnh bìa", "error");
    }
};

// ─── Patch renderHero để dùng class mới ──────────────────────────────────────
const _origRenderHero = typeof renderHero === "function" ? renderHero : null;
function renderHero() {
    const el = document.getElementById("profileAvatar");
    if (el) {
        const src = profileData.avatarUrl || currentUser?.photoURL || "";
        if (src)
            el.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" referrerpolicy="no-referrer"/>`;
        else
            el.textContent = (profileData.displayName ||
                currentUser?.displayName ||
                "U")[0].toUpperCase();
        const navEl = document.getElementById("navUserInitial");
        if (navEl) {
            if (src)
                navEl.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" referrerpolicy="no-referrer"/>`;
            else
                navEl.textContent = (profileData.displayName ||
                    "U")[0].toUpperCase();
        }
    }

    // Cover
    if (profileData.coverUrl) {
        const cover = document.getElementById("profileCover");
        if (cover) {
            cover.style.backgroundImage = `url('${profileData.coverUrl}')`;
            cover.style.backgroundSize = "cover";
            cover.style.backgroundPosition = "center";
        }
    }

    const setEl = (id, val) => {
        const e = document.getElementById(id);
        if (e) e.textContent = val || "";
    };
    setEl(
        "profileName",
        profileData.displayName || currentUser?.displayName || "Người dùng",
    );
    setEl("profileRole", profileData.role || "");
    setEl("profileEmail", profileData.email || currentUser?.email || "");
    setEl("profileBio", profileData.bio || "");
    document.title = `${profileData.displayName || "Hồ sơ"} — Lyrix`;

    // Joined date
    const joined = document.getElementById("statJoined");
    if (joined) {
        let date = null;
        if (profileData.createdAt?.toDate)
            date = profileData.createdAt.toDate();
        else if (typeof profileData.createdAt === "string")
            date = new Date(profileData.createdAt);
        if (date && !isNaN(date))
            joined.textContent = date.toLocaleDateString("vi-VN", {
                month: "short",
                year: "numeric",
            });
    }

    // Info chips
    const chips = [];
    if (profileData.dob)
        chips.push(
            `<span class="profile-chip"><i class="fa-solid fa-cake-candles" style="color:var(--brand-light)"></i> ${formatDob(profileData.dob)}</span>`,
        );
    if (profileData.phone)
        chips.push(
            `<span class="profile-chip"><i class="fa-solid fa-phone" style="color:var(--brand-light)"></i> ${profileData.phone}</span>`,
        );
    if (profileData.location)
        chips.push(
            `<span class="profile-chip"><i class="fa-solid fa-location-dot" style="color:var(--brand-light)"></i> ${profileData.location}</span>`,
        );
    const chipsEl = document.getElementById("profileInfoChips");
    if (chipsEl) chipsEl.innerHTML = chips.join("");
}
