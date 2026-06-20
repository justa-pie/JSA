// ─── index.js ────────────────────────────────────────────────────────────────

const searchInput = document.getElementById("searchInput");
const searchClear = document.getElementById("searchClear");
const searchDropdown = document.getElementById("searchDropdown");
const searchWrapper = document.getElementById("searchWrapper");
const searchResultsSection = document.getElementById("searchResultsSection");
const searchResultsTitle = document.getElementById("searchResultsTitle");
const searchResultsContent = document.getElementById("searchResultsContent");
const trendingList = document.getElementById("trendingList");
const artistsList = document.getElementById("artistsList");

let debounceTimer = null;
let currentTab = "songs";
let lastResults = { song: [], artist: [], album: [] };

// ─── Dropdown helpers ─────────────────────────────────────────────────────────
function openDropdown() {
    searchDropdown.classList.add("open");
}
function closeDropdown() {
    searchDropdown.classList.remove("open");
}

// ─── Quick tags ───────────────────────────────────────────────────────────────
document.querySelectorAll(".hero-tag").forEach((tag) => {
    tag.addEventListener("click", () => {
        searchInput.value = tag.dataset.q;
        triggerSearch(tag.dataset.q);
    });
});
window.searchByTag = (q) => {
    searchInput.value = q;
    triggerSearch(q);
    searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
};

// ─── Input events ─────────────────────────────────────────────────────────────
searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim();
    searchClear.style.display = q ? "flex" : "none";
    clearTimeout(debounceTimer);
    if (!q) {
        closeDropdown();
        hideResults();
        return;
    }
    // Đang gõ từ khoá mới: ẩn luôn kết quả search trước đó (nếu có) để
    // dropdown preview không bị chồng lên trên nó.
    hideResults();
    debounceTimer = setTimeout(() => fetchDropdown(q), 350);
});

searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        clearTimeout(debounceTimer);
        const q = searchInput.value.trim();
        if (q) triggerSearch(q);
    }
    if (e.key === "Escape") closeDropdown();
});

searchClear.addEventListener("click", () => {
    searchInput.value = "";
    searchClear.style.display = "none";
    closeDropdown();
    hideResults();
    searchInput.focus();
});

document.addEventListener("click", (e) => {
    if (!searchWrapper?.contains(e.target)) closeDropdown();
});

// ─── Dropdown: cache key riêng, per_page nhỏ ─────────────────────────────────
async function fetchDropdown(q) {
    try {
        // Dùng chung cache key với full search để tiết kiệm quota
        const data = await fetchCached(`search_${q}`, "/search/multi/", {
            q,
            per_page: 5,
            page: 1,
        });
        const sections = data?.sections || [];

        const topHit = sections.find((s) => s.type === "top_hit");
        const songSec = sections.find((s) => s.type === "song");

        const hits = [...(topHit?.hits || []), ...(songSec?.hits || [])]
            .filter((h) => h.type === "song")
            .filter(
                (h, i, arr) =>
                    arr.findIndex((x) => x.result?.id === h.result?.id) === i,
            )
            .slice(0, 5);

        if (!hits.length) {
            closeDropdown();
            return;
        }

        searchDropdown.innerHTML = hits
            .map((h) => {
                const r = h.result;
                return `<div class="search-dropdown-item" onclick="triggerSearch('${searchInput.value.trim().replace(/'/g, "\\'")}')">
        <img src="${safeImg(r.song_art_image_url || r.song_art_image_thumbnail_url)}" onerror="this.src='${safeImg()}'"/>
        <div style="min-width:0;flex:1">
            <div class="search-dropdown-type">Bài hát</div>
            <div class="search-dropdown-name">${r.title}</div>
            <div style="font-size:.72rem;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.primary_artist?.name || ""}</div>
        </div>
            <div style="font-size:.75rem;color:var(--text-3);flex-shrink:0;margin-left:.5rem">${formatNumber(r.stats?.pageviews)}</div>
        </div>`;
            })
            .join("");

        searchDropdown.innerHTML += `
        <div class="search-dropdown-item" style="justify-content:center;color:var(--brand-light);font-weight:600;font-size:.85rem"
            onclick="triggerSearch('${q.replace(/'/g, "\\'")}')">
            Xem tất cả kết quả <i class="fa-solid fa-arrow-right" style="font-size:11px;margin-left:4px"></i>
        </div>`;
        openDropdown();
    } catch {
        closeDropdown();
    }
}

// ─── Full search: cache key riêng "_full", per_page: 15 ──────────────────────
window.triggerSearch = async function (q) {
    clearTimeout(debounceTimer);
    closeDropdown();
    searchInput.blur();

    searchResultsSection.style.display = "block";
    searchResultsTitle.textContent = `Kết quả cho "${q}"`;
    currentTab = "songs";
    updateTabUI();
    showSkeletonResults();
    lastResults = { song: [], artist: [], album: [] };

    requestAnimationFrame(() => {
        searchResultsSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    });

    try {
        // Dùng chung cache key — cùng per_page: 5
        const data = await fetchCached(`search_${q}`, "/search/multi/", {
            q,
            per_page: 5,
            page: 1,
        });
        const sections = data?.sections || [];

        // Map từng section type vào đúng bucket
        sections.forEach((sec) => {
            if (sec.type === "song") lastResults.song = sec.hits || [];
            else if (sec.type === "artist") lastResults.artist = sec.hits || [];
            else if (sec.type === "album") lastResults.album = sec.hits || [];
        });

        // top_hit: bổ sung vào bucket tương ứng (dedupe theo id)
        const topSec = sections.find((s) => s.type === "top_hit");
        if (topSec?.hits) {
            topSec.hits.forEach((h) => {
                // h.type = 'song' | 'artist' | 'album'
                const bucket = lastResults[h.type];
                if (!bucket) return;
                if (!bucket.some((x) => x.result?.id === h.result?.id))
                    bucket.unshift(h);
            });
        }

        renderResults("songs");
    } catch (err) {
        showError(err.message);
        searchResultsContent.innerHTML = `<div class="empty-state">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <h3>Lỗi tìm kiếm</h3><p>${err.message}</p>
    </div>`;
    }
};

function hideResults() {
    searchResultsSection.style.display = "none";
    lastResults = { song: [], artist: [], album: [] };
}

function showSkeletonResults() {
    searchResultsContent.innerHTML = `<div style="display:flex;flex-direction:column;gap:.5rem">
    ${Array(6)
        .fill(
            `<div class="chart-item">
      <div class="skeleton" style="width:52px;height:52px;border-radius:8px;flex-shrink:0"></div>
      <div style="flex:1;display:flex;flex-direction:column;gap:6px">
        <div class="skeleton" style="height:14px;width:55%"></div>
        <div class="skeleton" style="height:12px;width:35%"></div>
      </div></div>`,
        )
        .join("")}
  </div>`;
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TAB_KEY = { songs: "song", artists: "artist", albums: "album" };

document.querySelectorAll("#searchTabs .tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        currentTab = btn.dataset.tab;
        updateTabUI();
        renderResults(currentTab);
    });
});

function updateTabUI() {
    document
        .querySelectorAll("#searchTabs .tab-btn")
        .forEach((b) =>
            b.classList.toggle("active", b.dataset.tab === currentTab),
        );
}

function renderResults(tab) {
    const hits = lastResults[TAB_KEY[tab]] || [];

    if (!hits.length) {
        searchResultsContent.innerHTML = `<div class="empty-state">
      <i class="fa-solid fa-music"></i>
      <h3>Không có kết quả</h3>
      <p>Thử tab khác hoặc từ khoá khác.</p>
    </div>`;
        return;
    }

    const rows = hits
        .map((h, i) => {
            const r = h.result;
            if (!r) return "";
            const delay = `animation-delay:${Math.min(i, 10) * 0.04}s`;

            if (tab === "songs") {
                return `<div class="chart-item animate-slide-up" style="${delay};cursor:pointer"
        onclick="window.location.href='src/pages/details-song.html?id=${r.id}'">
        <span class="chart-position">${i + 1}</span>
        <img class="chart-image" src="${safeImg(r.song_art_image_url || r.song_art_image_thumbnail_url)}" alt="" onerror="this.src='${safeImg()}'"/>
        <div class="chart-info">
          <div class="chart-title">${r.title}</div>
          <div class="chart-sub">${r.primary_artist?.name || r.artist_names || ""}</div>
        </div>
        <span class="chart-views"><i class="fa-solid fa-eye" style="font-size:10px;margin-right:3px"></i>${formatNumber(r.stats?.pageviews)}</span>
      </div>`;
            }

            if (tab === "artists") {
                return `<div class="chart-item animate-slide-up" style="${delay};cursor:pointer"
        onclick="window.location.href='src/pages/details-artist.html?id=${r.id}'">
        <span class="chart-position">${i + 1}</span>
        <img class="chart-image artist" src="${safeImg(r.image_url)}" alt="" onerror="this.src='${safeImg()}'"/>
        <div class="chart-info">
          <div class="chart-title">${r.name}</div>
          <div class="chart-sub">${
              r.is_verified
                  ? '<i class="fa-solid fa-circle-check" style="color:var(--brand-light);font-size:10px;margin-right:3px"></i>Verified Artist'
                  : "Nghệ sĩ"
          }</div>
        </div>
        ${r.is_verified ? '<span class="badge badge-brand" style="flex-shrink:0"><i class="fa-solid fa-check"></i></span>' : ""}
      </div>`;
            }

            if (tab === "albums") {
                return `<div class="chart-item animate-slide-up" style="${delay};cursor:pointer"
        onclick="window.location.href='src/pages/details-album.html?id=${r.id}'">
        <span class="chart-position">${i + 1}</span>
        <img class="chart-image" src="${safeImg(r.cover_art_url || r.cover_art_thumbnail_url)}" alt="" onerror="this.src='${safeImg()}'"/>
        <div class="chart-info">
          <div class="chart-title">${r.name}</div>
          <div class="chart-sub">${r.artist?.name || ""}${r.release_date_components?.year ? " · " + r.release_date_components.year : ""}</div>
        </div>
      </div>`;
            }
            return "";
        })
        .join("");

    searchResultsContent.innerHTML = `<div style="display:flex;flex-direction:column;gap:.5rem">${rows}</div>`;
}

// ─── Trending ─────────────────────────────────────────────────────────────────
async function loadTrending() {
    try {
        const cached = sessionGet("lyrix_trending");
        const items =
            cached ||
            (
                await fetchAPI("/chart/songs/", {
                    per_page: 8,
                    page: 1,
                    type: "all",
                })
            )?.chart_items ||
            [];
        if (!cached && items.length) sessionSet("lyrix_trending", items);

        if (!items.length) {
            trendingList.innerHTML =
                '<div class="empty-state"><i class="fa-solid fa-music"></i><p>Không có dữ liệu</p></div>';
            return;
        }
        trendingList.innerHTML = `<div style="display:flex;flex-direction:column;gap:.5rem">
        ${items
            .map((c, i) => {
                const s = c.item;
                if (!s) return "";
                const cls = i < 3 ? `top-${i + 1}` : "";
                const trophy =
                    i === 0
                        ? '<i class="fa-solid fa-trophy" style="color:#fbbf24;font-size:13px"></i>'
                        : i === 1
                          ? '<i class="fa-solid fa-trophy" style="color:#94a3b8;font-size:13px"></i>'
                          : i === 2
                            ? '<i class="fa-solid fa-trophy" style="color:#cd7c2f;font-size:13px"></i>'
                            : i + 1;
                return `<div class="chart-item ${cls} animate-slide-up" style="animation-delay:${i * 0.05}s;cursor:pointer"
            onclick="window.location.href='src/pages/details-song.html?id=${s.id}'">
            <span class="chart-position">${trophy}</span>
            <img class="chart-image" src="${safeImg(s.song_art_image_url || s.header_image_url)}" alt="" onerror="this.src='${safeImg()}'"/>
            <div class="chart-info">
                <div class="chart-title">${s.title}</div>
                <div class="chart-sub">${s.primary_artist?.name || ""}</div>
            </div>
            <div class="chart-stats">
                <span class="chart-views"><i class="fa-solid fa-eye" style="font-size:10px;margin-right:3px"></i>${formatNumber(s.stats?.pageviews)}</span>
                ${s.stats?.hot ? '<span class="badge badge-hot" style="font-size:.65rem;padding:2px 6px">HOT</span>' : ""}
            </div>
            </div>`;
            })
            .join("")}
    </div>`;
    } catch (err) {
        trendingList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>${err.message}</p></div>`;
    }
}

// ─── Top Artists ──────────────────────────────────────────────────────────────
async function loadArtists() {
    try {
        const cached = sessionGet("lyrix_artists");
        const items =
            cached ||
            (await fetchAPI("/chart/artists/", { per_page: 6 }))?.chart_items ||
            [];
        if (!cached && items.length) sessionSet("lyrix_artists", items);

        if (!items.length) {
            artistsList.innerHTML =
                '<div class="empty-state"><i class="fa-solid fa-user"></i><p>Không có dữ liệu</p></div>';
            return;
        }
        artistsList.innerHTML = `<div style="display:flex;flex-direction:column;gap:.5rem">
      ${items
          .map((c, i) => {
              const a = c.item;
              if (!a) return "";
              return `<div class="chart-item animate-slide-up" style="animation-delay:${i * 0.05}s;cursor:pointer"
          onclick="window.location.href='src/pages/details-artist.html?id=${a.id}'">
          <span class="chart-position">${i + 1}</span>
          <img class="chart-image artist" src="${safeImg(a.image_url)}" alt="" onerror="this.src='${safeImg()}'"/>
          <div class="chart-info">
            <div class="chart-title">${a.name}</div>
            <div class="chart-sub">${
                a.is_verified
                    ? '<i class="fa-solid fa-circle-check" style="color:var(--brand-light);font-size:10px;margin-right:3px"></i>Verified'
                    : "Nghệ sĩ"
            }</div>
          </div>
        </div>`;
          })
          .join("")}
    </div>`;
    } catch (err) {
        artistsList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>${err.message}</p></div>`;
    }
}

loadTrending();
loadArtists();
