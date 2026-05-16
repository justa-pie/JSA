// ─── Navbar: scroll effect + mobile toggle ─────────────────────────────────────
(function () {
    const navbar = document.getElementById("navbar");
    const toggle = document.getElementById("navToggle");
    const collapse = document.getElementById("navCollapse");

    // Scroll → add .scrolled class
    if (navbar) {
        window.addEventListener(
            "scroll",
            () => {
                navbar.classList.toggle("scrolled", window.scrollY > 20);
            },
            { passive: true },
        );
    }

    // Mobile toggle
    if (toggle && collapse) {
        toggle.addEventListener("click", () => {
            const open = collapse.classList.toggle("open");
            toggle.querySelector("i").className = open
                ? "fa-solid fa-xmark"
                : "fa-solid fa-bars";
        });

        // Close on link click
        collapse.querySelectorAll("a").forEach((a) => {
            a.addEventListener("click", () => {
                collapse.classList.remove("open");
                toggle.querySelector("i").className = "fa-solid fa-bars";
            });
        });

        // Close on outside click
        document.addEventListener("click", (e) => {
            if (!navbar.contains(e.target)) {
                collapse.classList.remove("open");
                toggle.querySelector("i").className = "fa-solid fa-bars";
            }
        });
    }
})();
