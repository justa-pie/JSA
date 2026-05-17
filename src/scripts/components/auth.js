// ─── auth.js — Firebase Authentication ───────────────────────────────────────
// Load AFTER firebase-app-compat.js, firebase-auth-compat.js

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyANhY8Ze06tNkGF2MQmujPY2gXsMgIYMG4",
    authDomain: "lyrix-b258b.firebaseapp.com",
    projectId: "lyrix-b258b",
    storageBucket: "lyrix-b258b.firebasestorage.app",
    messagingSenderId: "586165994873",
    appId: "1:586165994873:web:7a48b5181409abfe459ba8",
    measurementId: "G-DWKZ9NW50Q"
};

// Init Firebase (chỉ init 1 lần)
if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();

// ─── UI Elements ──────────────────────────────────────────────────────────────
const modalOverlay = document.getElementById("authModalOverlay");
const navLoginBtn = document.getElementById("navLoginBtn");
const navUserBtn = document.getElementById("navUserBtn");
const mobileLoginBtn = document.getElementById("mobileLoginBtn");

// ─── Open / Close modal ───────────────────────────────────────────────────────
window.openAuthModal = function (tab = "login") {
    modalOverlay?.classList.add("open");
    switchTab(tab);
    document.getElementById("loginEmail")?.focus();
};
window.closeAuthModal = function () {
    modalOverlay?.classList.remove("open");
    clearErrors();
};

// Close on overlay click
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
    if (wrap && !wrap.contains(e.target)) {
        document.getElementById("userDropdown")?.classList.remove("open");
    }
});

// ─── Auth state listener ──────────────────────────────────────────────────────
auth.onAuthStateChanged((user) => {
    if (user) {
        // Logged in
        if (navLoginBtn) navLoginBtn.style.display = "none";
        if (mobileLoginBtn) mobileLoginBtn.style.display = "none";
        if (navUserBtn) {
            navUserBtn.style.display = "flex";
            const initial = (user.displayName ||
                user.email ||
                "U")[0].toUpperCase();
            document.getElementById("navUserInitial").textContent = initial;
        }
        const ddName = document.getElementById("ddName");
        const ddEmail = document.getElementById("ddEmail");
        if (ddName) ddName.textContent = user.displayName || "Người dùng";
        if (ddEmail) ddEmail.textContent = user.email || "";
        closeAuthModal();
    } else {
        // Logged out
        if (navLoginBtn) navLoginBtn.style.display = "flex";
        if (mobileLoginBtn) mobileLoginBtn.style.display = "flex";
        if (navUserBtn) navUserBtn.style.display = "none";
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
        // Lưu user vào Firestore
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
        ); // merge: true → không ghi đè nếu đã tồn tại
}

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

// Enter key để submit
document.getElementById("loginPassword")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
});
document
    .getElementById("registerPassword")
    ?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleRegister();
    });
