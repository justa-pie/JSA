// ─── auth.js — Firebase Authentication ───────────────────────────────────────

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyANhY8Ze06tNkGF2MQmujPY2gXsMgIYMG4",
    authDomain: "lyrix-b258b.firebaseapp.com",
    projectId: "lyrix-b258b",
    storageBucket: "lyrix-b258b.firebasestorage.app",
    messagingSenderId: "586165994873",
    appId: "1:586165994873:web:7a48b5181409abfe459ba8",
    measurementId: "G-DWKZ9NW50Q",
};

if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();

// ─── localStorage cache helpers ───────────────────────────────────────────────
// Cache avatarUrl + role theo uid để dùng ngay khi load trang, không cần chờ Firestore
function cacheGet(uid, key) {
    return localStorage.getItem("lyrix_" + key + "_" + uid) || null;
}
function cacheSet(uid, key, val) {
    val
        ? localStorage.setItem("lyrix_" + key + "_" + uid, val)
        : localStorage.removeItem("lyrix_" + key + "_" + uid);
}
function cacheClear(uid) {
    localStorage.removeItem("lyrix_avatarUrl_" + uid);
    localStorage.removeItem("lyrix_role_" + uid);
}

// ─── NavBar bridge ────────────────────────────────────────────────────────────
// navbar.js có thể load trước hoặc sau auth.js tùy trang.
// Dùng queue để đảm bảo NavBar.ready() luôn được gọi đúng lúc.
window._navBarQueue = window._navBarQueue || null;
function callNavBar(user, role, avatarUrl) {
    if (window.NavBar && window.NavBar.ready) {
        window.NavBar.ready(user, role, avatarUrl);
    } else {
        // Lưu args, navbar.js sẽ flush khi init xong
        window._navBarQueue = { user, role, avatarUrl };
    }
}

// ─── UI Elements ──────────────────────────────────────────────────────────────
const modalOverlay = document.getElementById("authModalOverlay");
const navLoginBtn = document.getElementById("navLoginBtn");
const navUserBtn = document.getElementById("navUserBtn");
const mobileLoginBtn = document.getElementById("mobileLoginBtn");

// ─── Open / Close auth modal ──────────────────────────────────────────────────
window.openAuthModal = function (tab = "login") {
    modalOverlay?.classList.add("open");
    switchTab(tab);
    document.getElementById("loginEmail")?.focus();
};
window.closeAuthModal = function () {
    modalOverlay?.classList.remove("open");
    clearErrors();
};
modalOverlay?.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeAuthModal();
});

// ─── Tab switching ────────────────────────────────────────────────────────────
window.switchTab = function (tab) {
    document
        .querySelectorAll(".modal-tab")
        .forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    document.getElementById("loginForm").style.display =
        tab === "login" ? "block" : "none";
    document.getElementById("registerForm").style.display =
        tab === "register" ? "block" : "none";
    clearErrors();
};

// ─── User dropdown ────────────────────────────────────────────────────────────
window.toggleUserMenu = function () {
    document.getElementById("userDropdown")?.classList.toggle("open");
};
document.addEventListener("click", (e) => {
    const wrap = document.getElementById("userMenuWrap");
    if (wrap && !wrap.contains(e.target))
        document.getElementById("userDropdown")?.classList.remove("open");
});

// ─── Firestore realtime listener (thay thế one-shot get) ─────────────────────
// onSnapshot tự reconnect khi mạng phục hồi, không bị CORS-fail hoàn toàn
let _firestoreUnsub = null;

function subscribeUserDoc(user) {
    if (_firestoreUnsub) {
        _firestoreUnsub();
        _firestoreUnsub = null;
    }
    try {
        const db = firebase.firestore();
        _firestoreUnsub = db
            .collection("users")
            .doc(user.uid)
            .onSnapshot(
                (doc) => {
                    const data = doc.exists ? doc.data() : {};
                    const avatarUrl = data.avatarUrl || user.photoURL || null;
                    const role = data.role || "user";

                    // Cập nhật cache
                    cacheSet(user.uid, "avatarUrl", avatarUrl);
                    cacheSet(user.uid, "role", role);

                    // Cập nhật navbar (gọi lại nếu có thay đổi)
                    callNavBar(user, role, avatarUrl);
                },
                (err) => {
                    // CORS / offline → giữ nguyên cache, không làm gì thêm
                    console.warn(
                        "auth.js: Firestore snapshot error (thường do Safari local CORS)",
                        err.code,
                    );
                },
            );
    } catch (e) {
        console.warn("auth.js: Firestore subscribe failed", e.message);
    }
}

// ─── Auth state ───────────────────────────────────────────────────────────────
auth.onAuthStateChanged((user) => {
    if (user) {
        // ❶ Dùng cache ngay → navbar hiện avatar tức thì, không chờ network
        const cachedAvatar =
            cacheGet(user.uid, "avatarUrl") || user.photoURL || null;
        const cachedRole = cacheGet(user.uid, "role") || "user";
        callNavBar(user, cachedRole, cachedAvatar);
        closeAuthModal();

        // ❷ Subscribe Firestore realtime → cập nhật cache + navbar khi có dữ liệu mới
        subscribeUserDoc(user);
    } else {
        if (_firestoreUnsub) {
            _firestoreUnsub();
            _firestoreUnsub = null;
        }
        callNavBar(null, null, null);
    }
});

// ─── Login ────────────────────────────────────────────────────────────────────
window.handleLogin = async function () {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const errEl = document.getElementById("loginError");
    if (!email || !password) {
        showError(errEl, "Vui lòng điền đầy đủ thông tin.");
        return;
    }
    try {
        setLoading("loginBtn", true);
        await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
        showError(errEl, parseFirebaseError(err.code));
    } finally {
        setLoading("loginBtn", false);
    }
};

// ─── Register ─────────────────────────────────────────────────────────────────
window.handleRegister = async function () {
    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const errEl = document.getElementById("registerError");
    if (!name || !email || !password) {
        showError(errEl, "Vui lòng điền đầy đủ thông tin.");
        return;
    }
    if (password.length < 6) {
        showError(errEl, "Mật khẩu ít nhất 6 ký tự.");
        return;
    }
    try {
        setLoading("registerBtn", true);
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName: name });
        await saveUserToFirestore(cred.user, name);
    } catch (err) {
        showError(errEl, parseFirebaseError(err.code));
    } finally {
        setLoading("registerBtn", false);
    }
};

// ─── Google Sign In ───────────────────────────────────────────────────────────
window.handleGoogle = async function () {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const cred = await auth.signInWithPopup(provider);
        await saveUserToFirestore(cred.user, cred.user.displayName);
    } catch (err) {
        const errEl =
            document.getElementById("loginError") ||
            document.getElementById("registerError");
        showError(errEl, parseFirebaseError(err.code));
    }
};

// ─── Sign Out ─────────────────────────────────────────────────────────────────
window.signOut = async function () {
    document.getElementById("userDropdown")?.classList.remove("open");
    const user = auth.currentUser;
    if (user) cacheClear(user.uid);
    await auth.signOut();
};

// ─── Save user to Firestore ───────────────────────────────────────────────────
async function saveUserToFirestore(user, displayName) {
    if (typeof firebase === "undefined" || !firebase.firestore) return;
    const db = firebase.firestore();
    await db
        .collection("users")
        .doc(user.uid)
        .set(
            {
                uid: user.uid,
                displayName: displayName || user.displayName || "",
                email: user.email,
                photoURL: user.photoURL || "",
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
        );
}

// ─── Favorites helper ─────────────────────────────────────────────────────────
window.toggleFavorite = async function (songData) {
    const user = auth.currentUser;
    if (!user) {
        openAuthModal("login");
        return false;
    }
    const db = firebase.firestore();
    const ref = db
        .collection("users")
        .doc(user.uid)
        .collection("favorites")
        .doc(String(songData.songId));
    const snap = await ref.get();
    if (snap.exists) {
        await ref.delete();
        return false;
    } else {
        await ref.set({
            ...songData,
            savedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        return true;
    }
};

window.checkFavorite = async function (songId) {
    const user = auth.currentUser;
    if (!user) return false;
    const db = firebase.firestore();
    const snap = await db
        .collection("users")
        .doc(user.uid)
        .collection("favorites")
        .doc(String(songId))
        .get();
    return snap.exists;
};

// ─── History helper ───────────────────────────────────────────────────────────
window.addToHistory = async function (songData) {
    const user = auth.currentUser;
    if (!user) return;
    const db = firebase.firestore();
    await db
        .collection("users")
        .doc(user.uid)
        .collection("history")
        .doc(String(songData.songId))
        .set(
            {
                ...songData,
                viewedAt: firebase.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
        );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function showError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
}
function clearErrors() {
    document
        .querySelectorAll(".form-error")
        .forEach((e) => e.classList.remove("show"));
}
function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.innerHTML = loading
        ? '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang xử lý...'
        : btn.dataset.label;
}
function parseFirebaseError(code) {
    const map = {
        "auth/user-not-found": "Email không tồn tại.",
        "auth/wrong-password": "Mật khẩu không đúng.",
        "auth/email-already-in-use": "Email này đã được sử dụng.",
        "auth/invalid-email": "Email không hợp lệ.",
        "auth/weak-password": "Mật khẩu quá yếu.",
        "auth/too-many-requests": "Quá nhiều lần thử. Vui lòng thử lại sau.",
        "auth/popup-closed-by-user": "Đã hủy đăng nhập Google.",
        "auth/network-request-failed": "Lỗi kết nối mạng.",
        "auth/invalid-credential": "Email hoặc mật khẩu không đúng.",
    };
    return map[code] || "Có lỗi xảy ra. Vui lòng thử lại.";
}

document.getElementById("loginPassword")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
});
document
    .getElementById("registerPassword")
    ?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleRegister();
    });
