// ─── navbar.js — Loader + Navbar inject + Scroll + Mobile toggle ──────────────
(function () {

    const inPages  = window.location.pathname.includes("/src/pages/");
    const root     = inPages ? "../../" : "";
    const pagesDir = inPages ? "" : "src/pages/";
    const logoSrc  = root + "assets/public/images/logo.webp";
    const pageName = window.location.pathname.split("/").pop().replace(".html","") || "index";

    // ── ❶ Loader ─────────────────────────────────────────────────────────────
    if (!document.getElementById("page-loader")) {
        const el = document.createElement("div");
        el.id    = "page-loader";
        el.innerHTML = `
            <div class="loader-logo">
                <img src="${logoSrc}" alt="Lyrix"
                    onerror="this.style.display='none'" />
            </div>
            <div class="loader-bar"><div class="loader-bar-fill"></div></div>`;
        document.body.prepend(el);
    }

    // ── ❷ Navbar inject (chỉ khi chưa có — admin.html tự có navbar) ──────────
    if (!document.getElementById("navbar")) {
        const chartsHref = inPages ? "charts.html" : "src/pages/charts.html";
        const nav        = document.createElement("nav");
        nav.id        = "navbar";
        nav.className = "navbar";
        nav.innerHTML = `
            <a class="navbar-brand" href="${root}index.html">
                <div class="logo-icon" id="navbar-logo-icon"></div>
                Lyrix
            </a>
            <div class="navbar-links" id="navbar-links">
                <a href="${root}index.html"
                   class="${pageName === "index" ? "active" : ""}">Khám phá</a>
                <a href="${chartsHref}"
                   class="${pageName === "charts" ? "active" : ""}">Charts</a>
            </div>
            <div class="navbar-actions">
                <button class="btn-nav btn-nav-primary" id="navLoginBtn"
                    onclick="openAuthModal()" style="display:none">
                    <i class="fa-solid fa-user"></i> Đăng nhập
                </button>
                <div style="position:relative" id="userMenuWrap">
                    <button class="navbar-avatar" id="navUserBtn"
                        onclick="toggleUserMenu()" style="display:none">
                        <span id="navUserInitial"></span>
                    </button>
                    <div class="user-dropdown" id="userDropdown">
                        <div class="user-dropdown-header">
                            <div class="user-dropdown-name"  id="ddName">—</div>
                            <div class="user-dropdown-email" id="ddEmail">—</div>
                        </div>
                        <div id="dropdown-items-slot"></div>
                        <button class="user-dropdown-item" onclick="signOut()">
                            <i class="fa-solid fa-right-from-bracket"></i> Đăng xuất
                        </button>
                    </div>
                </div>
            </div>
            <button class="navbar-toggler" id="navToggle" aria-label="Menu">
                <i class="fa-solid fa-bars"></i>
            </button>
            <div class="navbar-collapse" id="navCollapse">
                <a href="${root}index.html">Khám phá</a>
                <a href="${chartsHref}">Charts</a>
                <button class="user-dropdown-item" id="mobileLoginBtn"
                    onclick="openAuthModal()"
                    style="border-radius:8px;margin-top:4px;display:none">
                    <i class="fa-solid fa-user"></i> Đăng nhập
                </button>
            </div>`;

        const loader = document.getElementById("page-loader");
        loader ? loader.after(nav) : document.body.prepend(nav);
    }

    // ── ❸ Logo ────────────────────────────────────────────────────────────────
    document.querySelectorAll("#navbar-logo-icon, .logo-icon:not([data-logo-set])").forEach((el) => {
        el.dataset.logoSet = "1";
        el.innerHTML = "";
        el.style.cssText = "background:none;padding:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;flex-shrink:0";
        const img = document.createElement("img");
        img.src   = logoSrc;
        img.alt   = "Lyrix";
        img.style.cssText = "width:32px;height:32px;object-fit:contain;border-radius:6px";
        img.onerror = () => { el.textContent = "♪"; el.removeAttribute("style"); };
        el.appendChild(img);
    });

    // ── ❹ Scroll ─────────────────────────────────────────────────────────────
    const navbar = document.getElementById("navbar");
    if (navbar) {
        window.addEventListener("scroll",
            () => navbar.classList.toggle("scrolled", window.scrollY > 20),
            { passive: true }
        );
    }

    // ── ❺ Mobile toggle ───────────────────────────────────────────────────────
    const toggle   = document.getElementById("navToggle");
    const collapse = document.getElementById("navCollapse");
    if (toggle && collapse) {
        toggle.addEventListener("click", () => {
            const open = collapse.classList.toggle("open");
            const i    = toggle.querySelector("i");
            if (i) i.className = open ? "fa-solid fa-xmark" : "fa-solid fa-bars";
        });
        collapse.querySelectorAll("a").forEach((a) => {
            a.addEventListener("click", () => {
                collapse.classList.remove("open");
                const i = toggle.querySelector("i");
                if (i) i.className = "fa-solid fa-bars";
            });
        });
        document.addEventListener("click", (e) => {
            if (navbar && !navbar.contains(e.target)) {
                collapse.classList.remove("open");
                const i = toggle.querySelector("i");
                if (i) i.className = "fa-solid fa-bars";
            }
        });
    }

    // ── ❻ Dropdown toggle ────────────────────────────────────────────────────
    window.toggleUserMenu = function () {
        document.getElementById("userDropdown")?.classList.toggle("open");
    };
    document.addEventListener("click", (e) => {
        const wrap = document.getElementById("userMenuWrap");
        if (wrap && !wrap.contains(e.target))
            document.getElementById("userDropdown")?.classList.remove("open");
    });

    // ── ❼ NavBar.ready(user, role, avatarUrl) — auth.js gọi sau khi resolve ──
    window.NavBar = {
        ready(user, role, avatarUrl) {
            const loginBtn  = document.getElementById("navLoginBtn");
            const mobileBtn = document.getElementById("mobileLoginBtn");
            const userBtn   = document.getElementById("navUserBtn");
            const initial   = document.getElementById("navUserInitial");
            const ddName    = document.getElementById("ddName");
            const ddEmail   = document.getElementById("ddEmail");
            const slot      = document.getElementById("dropdown-items-slot");
            const navLinks  = document.getElementById("navbar-links");
            const collapse  = document.getElementById("navCollapse");

            if (user) {
                if (loginBtn)  loginBtn.style.display  = "none";
                if (mobileBtn) mobileBtn.style.display = "none";
                if (userBtn)   userBtn.style.display   = "flex";

                // Avatar
                if (initial) {
                    if (avatarUrl) {
                        initial.innerHTML = `<img src="${avatarUrl}"
                            style="width:100%;height:100%;object-fit:cover;border-radius:50%"
                            referrerpolicy="no-referrer"/>`;
                    } else {
                        initial.textContent = (user.displayName || user.email || "U")[0].toUpperCase();
                    }
                }

                if (ddName)  ddName.textContent  = user.displayName || "Người dùng";
                if (ddEmail) ddEmail.textContent = user.email || "";

                // Dropdown: Trang cá nhân (không có Dashboard — đã có trên navbar)
                if (slot) {
                    slot.innerHTML = "";
                    const profileBtn     = document.createElement("button");
                    profileBtn.className = "user-dropdown-item";
                    profileBtn.innerHTML = '<i class="fa-solid fa-user-circle"></i> Trang cá nhân';
                    profileBtn.onclick   = () => { window.location.href = pagesDir + "profile.html"; };
                    slot.appendChild(profileBtn);
                }

                // Link Dashboard trên navbar (chỉ chữ, không icon)
                if (role === "admin") {
                    if (navLinks && !navLinks.querySelector(".nav-admin-link")) {
                        const a = document.createElement("a");
                        a.href      = pagesDir + "admin.html";
                        a.className = "nav-admin-link" + (pageName === "admin" ? " active" : "");
                        a.textContent = "Dashboard";
                        navLinks.appendChild(a);
                    }
                    if (collapse && !collapse.querySelector(".nav-admin-link-mobile")) {
                        const a = document.createElement("a");
                        a.href      = pagesDir + "admin.html";
                        a.className = "nav-admin-link-mobile";
                        a.textContent = "Dashboard";
                        const mBtn = collapse.querySelector("#mobileLoginBtn");
                        mBtn ? collapse.insertBefore(a, mBtn) : collapse.appendChild(a);
                    }
                }
            } else {
                if (loginBtn)  loginBtn.style.display  = "flex";
                if (mobileBtn) mobileBtn.style.display = "flex";
                if (userBtn)   userBtn.style.display   = "none";
            }

            NavBar.hideLoader();
        },

        hideLoader() {
            const loader = document.getElementById("page-loader");
            if (!loader) return;
            loader.classList.add("loader-fade-out");
            setTimeout(() => loader.remove(), 500);
        },
    };

    // ── ❽ Flush pending NavBar.ready() call từ auth.js ─────────────────────────
    // auth.js có thể fire onAuthStateChanged trước khi navbar.js chạy xong
    if (window._navBarQueue) {
        const q = window._navBarQueue;
        window._navBarQueue = null;
        window.NavBar.ready(q.user, q.role, q.avatarUrl);
    }

    // Fallback: ẩn loader sau 5s nếu Firebase lỗi
    setTimeout(() => {
        if (document.getElementById("page-loader")) NavBar.hideLoader();
    }, 5000);

})();
