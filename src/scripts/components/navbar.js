// ============================================================
//  NAVBAR — Mobile collapse handler + Auth
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
    // Đóng navbar mobile sau khi click link
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            const navCollapse = document.getElementById('navbarNav');
            if (navCollapse && navCollapse.classList.contains('show')) {
                const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
                if (bsCollapse) bsCollapse.hide();
            }
        });
    });
});
