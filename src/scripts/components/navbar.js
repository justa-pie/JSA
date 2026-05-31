// ─── navbar.js — Scroll effect + mobile toggle + logo ────────────────────────
(function () {
    const navbar   = document.getElementById("navbar");
    const toggle   = document.getElementById("navToggle");
    const collapse = document.getElementById("navCollapse");

    // ── Logo: dùng ảnh thật thay vì icon SVG ─────────────────────────────────
    // Tự tính đúng path dù đang ở root (index.html) hay src/pages/*.html
    const inPages  = window.location.pathname.includes("/src/pages/");
    const logoPath = inPages
        ? "../../assets/public/images/logo.webp"
        : "assets/public/images/logo.webp";

    document.querySelectorAll(".logo-icon").forEach((el) => {
        // Thay thế bất kỳ nội dung cũ (emoji / SVG) bằng <img>
        el.innerHTML = "";
        el.style.cssText = "background:none;padding:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;";
        const img = document.createElement("img");
        img.src    = logoPath;
        img.alt    = "Lyrix";
        img.style.cssText = "width:32px;height:32px;object-fit:contain;border-radius:6px;";
        img.onerror = () => {
            // fallback nếu ảnh không load
            el.innerHTML = "♪";
            el.style.cssText = "";
        };
        el.appendChild(img);
    });

    // ── Scroll → add .scrolled ────────────────────────────────────────────────
    if (navbar) {
        window.addEventListener(
            "scroll",
            () => { navbar.classList.toggle("scrolled", window.scrollY > 20); },
            { passive: true },
        );
    }

    // ── Mobile toggle ─────────────────────────────────────────────────────────
    if (toggle && collapse) {
        toggle.addEventListener("click", () => {
            const open = collapse.classList.toggle("open");
            toggle.querySelector("i").className = open
                ? "fa-solid fa-xmark"
                : "fa-solid fa-bars";
        });

        collapse.querySelectorAll("a").forEach((a) => {
            a.addEventListener("click", () => {
                collapse.classList.remove("open");
                toggle.querySelector("i").className = "fa-solid fa-bars";
            });
        });

        document.addEventListener("click", (e) => {
            if (navbar && !navbar.contains(e.target)) {
                collapse.classList.remove("open");
                toggle.querySelector("i").className = "fa-solid fa-bars";
            }
        });
    }
})();
