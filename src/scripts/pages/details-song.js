const params = new URLSearchParams(window.location.search);
const songId = params.get("id");
const container = document.getElementById("songDetailContent");

if (!songId) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i><h3>Thiếu ID bài hát</h3><a href="../../index.html" class="btn btn-primary" style="margin-top:1rem">Về trang chủ</a></div>`;
} else {
    loadSong();
}

async function loadSong() {
    try {
        const [detailData, lyricsData] = await Promise.all([
            fetchCached(`song_detail_${songId}`, "/song/details/", {
                id: songId,
            }),
            fetchCached(`song_lyrics_${songId}`, "/song/lyrics/", {
                id: songId,
            }),
        ]);

        const s = detailData?.song;
        if (!s) throw new Error("Không tìm thấy bài hát.");

        document.title = `${s.title} — ${s.primary_artist?.name || ""} | Lyrix`;

        const lyricsRaw = lyricsData?.lyrics?.lyrics?.body?.html || "";
        const lyricsText = stripHtml(lyricsRaw) || "Lời bài hát chưa có sẵn.";

        const writers = s.writer_artists || [];
        const producers = s.producer_artists || [];
        const featured = s.featured_artists || [];

        const songMeta = {
            songId: s.id,
            title: s.title,
            artist: s.primary_artist?.name || "",
            artUrl: s.song_art_image_url || s.header_image_url || "",
        };
        firebase.auth().onAuthStateChanged((user) => {
            if (user && typeof addToHistory === "function") {
                addToHistory(songMeta);
            }
        });

        container.innerHTML = `
        <div class="song-detail-header animate-slide-up" id="songHeader">
            <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(124,58,237,0.08),transparent);pointer-events:none"></div>
            <img class="detail-cover" src="${safeImg(s.song_art_image_url || s.header_image_url)}" alt="${s.title}" onerror="this.src='${safeImg()}'"/>
            <div class="detail-info" style="flex:1;min-width:0">
            <div style="margin-bottom:6px">
                ${s.featured_video ? '<span class="badge badge-hot" style="margin-right:6px"><i class="fa-solid fa-video"></i> Video</span>' : ""}
                ${s.lyrics_state === "complete" ? '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Full lyrics</span>' : ""}
                ${s.stats?.hot ? '<span class="badge badge-hot" style="margin-left:4px"><i class="fa-solid fa-fire"></i> Hot</span>' : ""}
            </div>
            <h1 style="margin-bottom:4px">${s.title}</h1>
            <div class="artist-name" style="cursor:pointer"
                onclick="window.location.href='details-artist.html?id=${s.primary_artist?.id}'">
                ${s.primary_artist?.name || "Unknown Artist"}
            </div>
            <div class="detail-meta">
                ${s.release_date_for_display ? `<div class="meta-chip"><i class="fa-solid fa-calendar"></i> ${s.release_date_for_display}</div>` : ""}
                ${s.album ? `<div class="meta-chip" style="cursor:pointer" onclick="window.location.href='details-album.html?id=${s.album.id}'"><i class="fa-solid fa-compact-disc"></i> ${s.album.name}</div>` : ""}
                ${s.stats?.pageviews ? `<div class="meta-chip"><i class="fa-solid fa-eye"></i> ${formatNumber(s.stats.pageviews)} views</div>` : ""}
            </div>
            <div class="detail-actions">
                ${s.url ? `<a href="${s.url}" target="_blank" class="btn btn-primary btn-sm"><i class="fa-solid fa-arrow-up-right-from-square"></i> Xem trên Genius</a>` : ""}
                <button class="btn btn-fav btn-sm" id="favBtn" onclick="handleFavorite()">
                <i class="fa-regular fa-heart"></i> Yêu thích
                </button>
                <button class="btn btn-outline btn-sm" onclick="copyLyrics()"><i class="fa-solid fa-copy"></i> Sao chép lời</button>
                ${s.primary_artist?.id ? `<button class="btn btn-ghost btn-sm" onclick="window.location.href='details-artist.html?id=${s.primary_artist.id}'"><i class="fa-solid fa-user"></i> Nghệ sĩ</button>` : ""}
            </div>
            <div class="ai-buttons-row" id="aiButtonsRow"></div>
            </div>
        </div>

        <div id="preview-player-container" class="animate-slide-up stagger-1"></div>

        <div class="card animate-slide-up stagger-1" style="padding:1.25rem;margin-bottom:1.5rem">
            <div class="stats-bar">
            <div class="stat-item"><div class="stat-value">${formatNumber(s.stats?.pageviews)}</div><div class="stat-label">Lượt xem</div></div>
            <div class="stat-item"><div class="stat-value">${s.annotation_count ?? "—"}</div><div class="stat-label">Annotations</div></div>
            <div class="stat-item"><div class="stat-value">${s.pyongs_count ?? "—"}</div><div class="stat-label">Pyongs</div></div>
            <div class="stat-item"><div class="stat-value">${s.contributors_count ?? "—"}</div><div class="stat-label">Contributors</div></div>
            </div>
            ${
                s.stats?.pageviews
                    ? `<div style="margin-top:1rem">
            <div style="font-size:.72rem;color:var(--text-3);margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em;font-weight:600">Popularity</div>
            <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, Math.round((s.stats.pageviews / 10000000) * 100))}%"></div></div>
            </div>`
                    : ""
            }
        </div>

        <div class="two-column-layout animate-slide-up stagger-2">
            <div class="left-column">
            ${
                featured.length || writers.length || producers.length
                    ? `<div class="credits-section">
                ${
                    featured.length
                        ? `<div style="margin-bottom:1rem">
                <div style="font-size:.72rem;color:var(--text-3);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:8px">Featured</div>
                <div class="credits-grid">${featured.map((a) => `<div class="credit-item" style="cursor:pointer" onclick="window.location.href='details-artist.html?id=${a.id}'"><div class="credit-role">Featured</div><div class="credit-name">${a.name}</div></div>`).join("")}</div>
                </div>`
                        : ""
                }
                ${
                    writers.length
                        ? `<div style="margin-bottom:1rem">
                <div style="font-size:.72rem;color:var(--text-3);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:8px">Nhạc sĩ</div>
                <div class="credits-grid">${writers.map((a) => `<div class="credit-item" style="cursor:pointer" onclick="window.location.href='details-artist.html?id=${a.id}'"><div class="credit-role">Writer</div><div class="credit-name">${a.name}</div></div>`).join("")}</div>
                </div>`
                        : ""
                }
                ${
                    producers.length
                        ? `<div>
                <div style="font-size:.72rem;color:var(--text-3);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:8px">Producer</div>
                <div class="credits-grid">${producers.map((a) => `<div class="credit-item" style="cursor:pointer" onclick="window.location.href='details-artist.html?id=${a.id}'"><div class="credit-role">Producer</div><div class="credit-name">${a.name}</div></div>`).join("")}</div>
                </div>`
                        : ""
                }
            </div>`
                    : ""
            }

            ${
                s.album
                    ? `<div class="card" style="padding:1rem;margin-top:1.25rem;cursor:pointer" onclick="window.location.href='details-album.html?id=${s.album.id}'">
                <div style="font-size:.7rem;color:var(--text-3);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:10px">Album</div>
                <div style="display:flex;align-items:center;gap:.75rem">
                <img src="${safeImg(s.album.cover_art_url)}" style="width:52px;height:52px;border-radius:8px;object-fit:cover" onerror="this.src='${safeImg()}'"/>
                <div><div style="font-weight:600;font-size:.875rem">${s.album.name}</div><div style="font-size:.75rem;color:var(--text-3);margin-top:2px">${s.album.release_date_for_display || ""}</div></div>
                </div>
            </div>`
                    : ""
            }
            </div>

            <div class="right-column">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
                <h3 style="display:flex;align-items:center;gap:.5rem">
                <div class="waveform"><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div></div>
                Lời bài hát
                </h3>
                <button class="btn btn-ghost btn-sm" onclick="toggleLyricsSize()" id="lyricsToggle">
                <i class="fa-solid fa-expand"></i> Phóng to
                </button>
            </div>
            <div class="lyrics-container" id="lyricsBox" style="max-height:600px;overflow-y:auto">${lyricsText}</div>
            ${
                s.description?.html
                    ? `<div style="margin-top:1.5rem">
                <h3 style="margin-bottom:.75rem"><i class="fa-solid fa-circle-info" style="color:var(--brand-light);margin-right:6px"></i>Giới thiệu</h3>
                <div class="lyrics-container" style="font-size:.875rem;line-height:1.75;color:var(--text-2)">${stripHtml(s.description.html)}</div>
            </div>`
                    : ""
            }
            </div>
        </div>`;

        renderPreviewPlayer(s.title, s.primary_artist?.name || "");

        if (typeof LyrixAI !== "undefined") {
            const aiRow = document.getElementById("aiButtonsRow");

            LyrixAI.initLyricsAnalyze({
                title: s.title,
                artist: s.primary_artist?.name || "",
                lyrics: lyricsText,
                container: aiRow,
            });

            LyrixAI.initSimilarSongs({
                title: s.title,
                artist: s.primary_artist?.name || "",
                tags: s.tags?.join(", ") || "",
                container: aiRow,
            });

            LyrixAI.initFloatingChat({
                page: "Chi tiết bài hát",
                title: s.title,
                artist: s.primary_artist?.name || "",
            });
        }
        setTimeout(async () => {
            if (typeof checkFavorite === "function") {
                const isFav = await checkFavorite(s.id);
                updateFavBtn(isFav);
            }
        }, 600);

        window._currentSongMeta = songMeta;
    } catch (err) {
        showError(err.message);
        container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Lỗi tải dữ liệu</h3><p>${err.message}</p><a href="../../index.html" class="btn btn-primary" style="margin-top:1rem">Về trang chủ</a></div>`;
    }
}

function updateFavBtn(isFav) {
    const btn = document.getElementById("favBtn");
    if (!btn) return;
    if (isFav) {
        btn.innerHTML =
            '<i class="fa-solid fa-heart" style="color:#f87171"></i> Đã yêu thích';
        btn.classList.add("btn-fav-active");
    } else {
        btn.innerHTML = '<i class="fa-regular fa-heart"></i> Yêu thích';
        btn.classList.remove("btn-fav-active");
    }
}

window.handleFavorite = async function () {
    const btn = document.getElementById("favBtn");
    if (!btn || !window._currentSongMeta) return;

    if (typeof firebase === "undefined" || !firebase.auth().currentUser) {
        openAuthModal("login");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';

    try {
        const added = await toggleFavorite(window._currentSongMeta);
        updateFavBtn(added);
        // Toast nhẹ
        const toast = document.createElement("div");
        toast.className = "error-toast";
        toast.style.cssText = `border-left:3px solid ${added ? "#f87171" : "var(--border)"}`;
        toast.innerHTML = added
            ? '<i class="fa-solid fa-heart" style="color:#f87171;margin-right:8px"></i>Đã thêm vào yêu thích'
            : '<i class="fa-regular fa-heart" style="margin-right:8px"></i>Đã bỏ khỏi yêu thích';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    } catch {
        btn.innerHTML = '<i class="fa-regular fa-heart"></i> Yêu thích';
    } finally {
        btn.disabled = false;
    }
};

window.copyLyrics = function () {
    const box = document.getElementById("lyricsBox");
    if (!box) return;
    navigator.clipboard.writeText(box.innerText).then(() => {
        const btn = document.querySelector('[onclick="copyLyrics()"]');
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Đã sao chép';
            setTimeout(
                () =>
                    (btn.innerHTML =
                        '<i class="fa-solid fa-copy"></i> Sao chép lời'),
                2000,
            );
        }
    });
};

async function fetchItunesPreview(songTitle, artistName) {
    try {
        const q = encodeURIComponent(`${songTitle} ${artistName}`);
        const res = await fetch(
            `https://itunes.apple.com/search?term=${q}&media=music&entity=song&limit=5`,
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.results?.length) return null;
        const match =
            data.results.find((r) =>
                r.artistName.toLowerCase().includes(artistName.toLowerCase()),
            ) || data.results[0];
        return match.previewUrl || null;
    } catch {
        return null;
    }
}

async function renderPreviewPlayer(songTitle, artistName) {
    const container = document.getElementById("preview-player-container");
    if (!container) return;

    container.innerHTML = `
        <div class="preview-player preview-loading">
            <div class="skeleton" style="width:38px;height:38px;border-radius:50%;flex-shrink:0"></div>
            <div style="flex:1;display:flex;flex-direction:column;gap:6px">
                <div class="skeleton" style="width:90px;height:9px;border-radius:4px"></div>
                <div class="skeleton" style="width:100%;height:4px;border-radius:2px"></div>
            </div>
        </div>`;

    const previewUrl = await fetchItunesPreview(songTitle, artistName);

    if (!previewUrl) {
        container.innerHTML = `
            <div class="preview-unavailable">
                <i class="fa-solid fa-headphones" style="font-size:14px"></i>
                <span>Không tìm thấy bản nghe thử cho bài này</span>
            </div>`;
        return;
    }

    container.innerHTML = `
        <div class="preview-player" id="previewPlayer">
            <button class="preview-play-btn" id="previewPlayBtn" aria-label="Phát / Dừng">
                <i class="fa-solid fa-play" id="previewIcon"></i>
            </button>
            <div class="preview-info">
                <span class="preview-label"><i class="fa-brands fa-apple" style="margin-right:4px"></i>Nghe thử · 30 giây</span>
                <div class="preview-progress-row">
                    <div class="preview-bar" id="previewBar">
                        <div class="preview-bar-fill" id="previewFill"></div>
                    </div>
                    <span class="preview-time" id="previewTime">0:00</span>
                </div>
            </div>
            <div class="preview-vol-wrap">
                <i class="fa-solid fa-volume-high preview-vol-icon" id="previewVolIcon"></i>
                <input type="range" class="preview-vol-input" id="previewVol" min="0" max="1" step="0.05" value="0.8">
            </div>
            <audio id="previewAudio" src="${previewUrl}" preload="none"></audio>
        </div>`;

    const audio = document.getElementById("previewAudio");
    const playBtn = document.getElementById("previewPlayBtn");
    const icon = document.getElementById("previewIcon");
    const fill = document.getElementById("previewFill");
    const timeEl = document.getElementById("previewTime");
    const volInput = document.getElementById("previewVol");
    const volIcon = document.getElementById("previewVolIcon");
    const player = document.getElementById("previewPlayer");

    audio.volume = 0.8;

    const fmt = (s) =>
        `${Math.floor(s / 60)}:${Math.floor(s % 60)
            .toString()
            .padStart(2, "0")}`;

    playBtn.addEventListener("click", () => {
        if (audio.paused) {
            audio.play();
            icon.className = "fa-solid fa-pause";
            player.classList.add("is-playing");
        } else {
            audio.pause();
            icon.className = "fa-solid fa-play";
            player.classList.remove("is-playing");
        }
    });

    audio.addEventListener("timeupdate", () => {
        if (!audio.duration) return;
        fill.style.width = (audio.currentTime / audio.duration) * 100 + "%";
        timeEl.textContent = fmt(audio.currentTime);
    });

    audio.addEventListener("ended", () => {
        icon.className = "fa-solid fa-play";
        fill.style.width = "0%";
        timeEl.textContent = "0:00";
        player.classList.remove("is-playing");
    });

    document
        .getElementById("previewBar")
        .addEventListener("click", function (e) {
            if (!audio.duration) return;
            const r = this.getBoundingClientRect();
            audio.currentTime =
                ((e.clientX - r.left) / r.width) * audio.duration;
        });

    volInput.addEventListener("input", () => {
        audio.volume = volInput.value;
        volIcon.className =
            audio.volume == 0
                ? "fa-solid fa-volume-xmark preview-vol-icon"
                : audio.volume < 0.5
                    ? "fa-solid fa-volume-low preview-vol-icon"
                    : "fa-solid fa-volume-high preview-vol-icon";
    });

    volIcon.addEventListener("click", () => {
        if (audio.volume > 0) {
            audio._prev = audio.volume;
            audio.volume = 0;
            volInput.value = 0;
            volIcon.className = "fa-solid fa-volume-xmark preview-vol-icon";
        } else {
            audio.volume = audio._prev || 0.8;
            volInput.value = audio.volume;
            volIcon.className = "fa-solid fa-volume-high preview-vol-icon";
        }
    });
}

let expanded = false;
window.toggleLyricsSize = function () {
    const box = document.getElementById("lyricsBox");
    const btn = document.getElementById("lyricsToggle");
    if (!box) return;
    expanded = !expanded;
    box.style.maxHeight = expanded ? "none" : "600px";
    btn.innerHTML = expanded
        ? '<i class="fa-solid fa-compress"></i> Thu gọn'
        : '<i class="fa-solid fa-expand"></i> Phóng to';
};
