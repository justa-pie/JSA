// ─── Firebase Configuration ───────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyANhY8Ze06tNkGF2MQmujPY2gXsMgIYMG4",
    authDomain: "lyrix-b258b.firebaseapp.com",
    projectId: "lyrix-b258b",
    storageBucket: "lyrix-b258b.firebasestorage.app",
    messagingSenderId: "586165994873",
    appId: "1:586165994873:web:7a48b5181409abfe459ba8",
    measurementId: "G-DWKZ9NW50Q",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ─── Auth State Management ────────────────────────────────────────────
let currentUser = null;

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    console.log("[v0] Auth state changed:", user?.email || "No user");
    
    // Update navbar based on auth state
    updateNavbarAuth();
});

// ─── Navbar Auth Management ────────────────────────────────────────────
function updateNavbarAuth() {
    const authBtn = document.getElementById("navAuthBtn");
    if (!authBtn) return;

    if (currentUser) {
        authBtn.innerHTML = `
            <i class="fa-solid fa-user-check"></i> 
            <span id="userNameDisplay">${currentUser.displayName || currentUser.email.split("@")[0]}</span>
        `;
        authBtn.onclick = showUserMenu;
    } else {
        authBtn.innerHTML = `<i class="fa-solid fa-user"></i> Đăng nhập`;
        authBtn.onclick = () => (window.location.href = "login.html");
    }
}

// ─── User Menu ────────────────────────────────────────────────────────
function showUserMenu() {
    const existingMenu = document.getElementById("userMenu");
    if (existingMenu) {
        existingMenu.remove();
        return;
    }

    const menu = document.createElement("div");
    menu.id = "userMenu";
    menu.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        background: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 0.75rem;
        z-index: 2000;
        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        min-width: 200px;
    `;
    menu.innerHTML = `
        <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); font-size: 0.85rem; color: var(--text-2);">
            ${currentUser.email}
        </div>
        <button onclick="window.location.href='profile.html'" style="width: 100%; padding: 0.6rem 1rem; text-align: left; background: none; border: none; color: var(--text-1); cursor: pointer; font-size: 0.9rem;">
            <i class="fa-solid fa-user-pen" style="margin-right: 8px; color: var(--brand-light)"></i> Hồ sơ
        </button>
        <button onclick="window.location.href='favorites.html'" style="width: 100%; padding: 0.6rem 1rem; text-align: left; background: none; border: none; color: var(--text-1); cursor: pointer; font-size: 0.9rem;">
            <i class="fa-solid fa-heart" style="margin-right: 8px; color: var(--accent-pink)"></i> Yêu thích
        </button>
        <button onclick="logoutUser()" style="width: 100%; padding: 0.6rem 1rem; text-align: left; background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.9rem; border-top: 1px solid var(--border);">
            <i class="fa-solid fa-sign-out-alt" style="margin-right: 8px;"></i> Đăng xuất
        </button>
    `;
    document.body.appendChild(menu);

    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener("click", (e) => {
            if (!menu.contains(e.target) && !document.getElementById("navAuthBtn").contains(e.target)) {
                menu.remove();
            }
        }, { once: true });
    }, 0);
}

// ─── Logout ───────────────────────────────────────────────────────────
window.logoutUser = async function () {
    try {
        await signOut(auth);
        localStorage.removeItem("userEmail");
        window.location.href = "index.html";
    } catch (err) {
        console.error("[v0] Logout error:", err);
    }
};

// ─── Export Current User ──────────────────────────────────────────────
export function getCurrentUser() {
    return currentUser;
}

// ─── Auth Check ──────────────────────────────────────────────────────
export function requireAuth() {
    if (!currentUser) {
        window.location.href = "login.html";
        return false;
    }
    return true;
}
