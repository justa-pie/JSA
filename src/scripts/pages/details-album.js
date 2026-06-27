const params = new URLSearchParams(window.location.search);
const albumId = params.get("id");
const container = document.getElementById("albumDetailContent");

if (!albumId) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i><h3>Thiếu ID album</h3><a href="../../index.html" class="btn btn-primary" style="margin-top:1rem">Về trang chủ</a></div>`;
} else {
    loadAlbum();
}

async function fetchItunesTracks(albumName, artistName) {
    try {
        const cacheKey = `itunes_tracks_${albumName}_${artistName}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);

        const q = encodeURIComponent(`${albumName} ${artistName}`);
        const searchRes = await fetch(
            `https://itunes.apple.com/search?term=${q}&entity=album&limit=3`
        );
        const searchData = await searchRes.json();
        const match =
            searchData.results?.find(
                (r) =>
                    r.wrapperType === "collection" &&
                    r.collectionName?.toLowerCase().includes(albumName.toLowerCase())
            ) || searchData.results?.[0];

        if (!match?.collectionId) return [];

        // Bước 2: lookup tracklist
        const lookupRes = await fetch(
            `https://itunes.apple.com/lookup?id=${match.collectionId}&entity=song`
        );
        const lookupData = await lookupRes.json();

        const tracks = lookupData.results
            ?.filter((r) => r.wrapperType === "track" && r.kind === "song")
            .map((r) => ({
                trackNumber: r.trackNumber,
                trackName: r.trackName,
                artistName: r.artistName,
                durationMs: r.trackTimeMillis,
                previewUrl: r.previewUrl,
                artworkUrl: r.artworkUrl100,
                itunesId: r.trackId,
            })) || [];

        sessionStorage.setItem(cacheKey, JSON.stringify(tracks));
        return tracks;
    } catch (e) {
        console.warn("iTunes tracklist fetch failed:", e);
        return [];
    }
}

function formatDuration(ms) {
    if (!ms) return "";
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
    return `${m}:${s}`;
}

function renderGeniusTracks(tracks, al) {
    return `<div style="display:flex;flex-direction:column;gap:.5rem">
        ${tracks.map((t, i) => {
            const s = t.song;
            if (!s) return "";
            return `<div class="chart-item animate-slide-up" style="animation-delay:${Math.min(i, 15) * 0.04}s;cursor:pointer" onclick="window.location.href='details-song.html?id=${s.id}'">
                <span class="chart-position">${t.number_in_album || i + 1}</span>
                <img class="chart-image" src="${safeImg(s.song_art_image_url || al.cover_art_url)}" alt="" onerror="this.src='${safeImg()}'"/>
                <div class="chart-info">
                    <div class="chart-title">${s.title}</div>
                    <div class="chart-sub">${s.primary_artist?.name || al.artist?.name || ""}${s.featured_artists?.length ? " ft. " + s.featured_artists.map((a) => a.name).join(", ") : ""}</div>
                </div>
                <span class="chart-views"><i class="fa-solid fa-eye" style="font-size:10px;margin-right:3px"></i>${formatNumber(s.stats?.pageviews)}</span>
            </div>`;
        }).join("")}
    </div>`;
}

function renderItunesTracks(tracks, al) {
    if (!tracks.length) {
        return `<div class="empty-state"><i class="fa-solid fa-compact-disc"></i><p>Không có thông tin track.</p></div>`;
    }
    return `<div style="display:flex;flex-direction:column;gap:.5rem">
        ${tracks.map((t, i) => {
            const art = t.artworkUrl || safeImg(al.cover_art_url);
            const dur = formatDuration(t.durationMs);
            return `<div class="chart-item animate-slide-up" style="animation-delay:${Math.min(i, 15) * 0.04}s;cursor:pointer" onclick="navigateToSong('${encodeURIComponent(t.trackName)}', '${encodeURIComponent(t.artistName || al.artist?.name || "")}', this)">
                <span class="chart-position">${t.trackNumber || i + 1}</span>
                <img class="chart-image" src="${art}" alt="" onerror="this.src='${safeImg()}'"/>
                <div class="chart-info">
                    <div class="chart-title">${t.trackName}</div>
                    <div class="chart-sub">${t.artistName || al.artist?.name || ""}</div>
                </div>
                <span class="chart-views" style="white-space:nowrap">${dur ? `<i class="fa-regular fa-clock" style="font-size:10px;margin-right:3px"></i>${dur}` : ""}</span>
            </div>`;
        }).join("")}
    </div>`;
}

window.navigateToSong = async function(encodedTitle, encodedArtist, el) {
    const title = decodeURIComponent(encodedTitle);
    const artist = decodeURIComponent(encodedArtist);

    el.style.opacity = "0.6";
    el.style.pointerEvents = "none";

    try {
        const cacheKey = `genius_id_${title}_${artist}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            window.location.href = `details-song.html?id=${cached}`;
            return;
        }

        const data = await fetchAPI("/search/multi/", {
            q: `${title} ${artist}`,
            per_page: 5,
            page: 1,
        });

        const songSection = data?.sections?.find((s) => s.type === "song");
        const hit = songSection?.hits?.[0]?.result;

        if (hit?.id) {
            sessionStorage.setItem(cacheKey, hit.id);
            window.location.href = `details-song.html?id=${hit.id}`;
        } else {
            window.location.href = `../../index.html?q=${encodeURIComponent(title + " " + artist)}`;
        }
    } catch (e) {
        el.style.opacity = "";
        el.style.pointerEvents = "";
        showError("Không thể tìm bài hát. Thử lại sau.");
    }
};

async function loadAlbum() {
    try {
        const data = await fetchCached(
            `album_detail_${albumId}`,
            "/album/details/",
            { id: albumId },
        );
        const al = data?.album;
        if (!al) throw new Error("Không tìm thấy album.");

        document.title = `${al.name} — ${al.artist?.name || ""} | Lyrix`;

        const geniusTracks = al.tracks || [];
        const desc = stripHtml(al.description?.html || "");
        const releaseYear =
            al.release_date_components?.year ||
            al.release_date_for_display ||
            "";

        container.innerHTML = `
        <div class="song-detail-header animate-slide-up">
            <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(124,58,237,0.07),transparent);pointer-events:none"></div>
            <img class="detail-cover" src="${safeImg(al.cover_art_url)}" alt="${al.name}" onerror="this.src='${safeImg()}'"/>
            <div class="detail-info" style="flex:1;min-width:0">
            <div style="margin-bottom:6px"><span class="badge badge-brand"><i class="fa-solid fa-compact-disc"></i> Album</span></div>
            <h1>${al.name}</h1>
            <div class="artist-name" style="cursor:pointer;margin-top:4px" onclick="window.location.href='details-artist.html?id=${al.artist?.id}'">${al.artist?.name || "Unknown Artist"}</div>
            <div class="detail-meta">
                ${releaseYear ? `<div class="meta-chip"><i class="fa-solid fa-calendar"></i> ${releaseYear}</div>` : ""}
                <div class="meta-chip" id="trackCountChip"><i class="fa-solid fa-list-ol"></i> <span id="trackCountVal">${geniusTracks.length || "..."}</span> tracks</div>
            </div>
            <div class="detail-actions">
                ${al.url ? `<a href="${al.url}" target="_blank" class="btn btn-primary btn-sm"><i class="fa-solid fa-arrow-up-right-from-square"></i> Xem trên Genius</a>` : ""}
                ${al.artist?.id ? `<button class="btn btn-outline btn-sm" onclick="window.location.href='details-artist.html?id=${al.artist.id}'"><i class="fa-solid fa-user"></i> Nghệ sĩ</button>` : ""}
            </div>
            <div class="ai-buttons-row" id="aiButtonsRow"></div>
            </div>
        </div>

        <div class="card animate-slide-up stagger-1" style="padding:1.25rem;margin-bottom:1.5rem">
            <div class="stats-bar">
            <div class="stat-item"><div class="stat-value" id="statsTrackCount">${geniusTracks.length || "—"}</div><div class="stat-label">Tracks</div></div>
            <div class="stat-item"><div class="stat-value">${releaseYear || "—"}</div><div class="stat-label">Phát hành</div></div>
            <div class="stat-item"><div class="stat-value">${al.artist?.name || "—"}</div><div class="stat-label">Nghệ sĩ</div></div>
            </div>
        </div>

        <div class="two-column-layout animate-slide-up stagger-2">
            <div class="left-column">
            ${desc ? `<h3 style="margin-bottom:.75rem"><i class="fa-solid fa-circle-info" style="color:var(--brand-light);margin-right:6px"></i>Giới thiệu</h3>
            <div class="lyrics-container" style="font-size:.875rem;line-height:1.8;color:var(--text-2)">${desc}</div>` : ""}
            ${al.artist ? `
            <div class="card" style="padding:1rem;margin-top:1.25rem;cursor:pointer" onclick="window.location.href='details-artist.html?id=${al.artist.id}'">
                <div style="font-size:.7rem;color:var(--text-3);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:10px">Nghệ sĩ</div>
                <div style="display:flex;align-items:center;gap:.75rem">
                <img src="${safeImg(al.artist.image_url)}" style="width:48px;height:48px;border-radius:50%;object-fit:cover" onerror="this.src='${safeImg()}'"/>
                <div><div style="font-weight:600;font-size:.9rem">${al.artist.name}</div>${al.artist.is_verified ? '<div style="font-size:.72rem;color:var(--brand-light);margin-top:2px"><i class="fa-solid fa-circle-check"></i> Verified</div>' : ""}</div>
                </div>
            </div>` : ""}
            </div>
            <div class="right-column">
            <h3 style="margin-bottom:1rem"><i class="fa-solid fa-list-ol" style="color:var(--brand-light);margin-right:6px"></i>Danh sách track</h3>
            <div id="tracklistContainer">
                ${geniusTracks.length
                    ? renderGeniusTracks(geniusTracks, al)
                    : `<div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin"></i><p>Đang tải tracklist...</p></div>`
                }
            </div>
            </div>
        </div>`;

        if (!geniusTracks.length) {
            fetchItunesTracks(al.name, al.artist?.name || "").then((itunesTracks) => {
                const tc = document.getElementById("tracklistContainer");
                if (tc) tc.innerHTML = renderItunesTracks(itunesTracks, al);

                const count = itunesTracks.length;
                if (count) {
                    const v = document.getElementById("trackCountVal");
                    const s = document.getElementById("statsTrackCount");
                    if (v) v.textContent = count;
                    if (s) s.textContent = count;
                }

                if (typeof LyrixAI !== "undefined") {
                    const aiRow = document.getElementById("aiButtonsRow");
                    if (aiRow && !aiRow.hasChildNodes()) {
                        LyrixAI.initAlbumVibe({
                            title: al.name,
                            artist: al.artist?.name || "",
                            releaseDate: releaseYear,
                            tracks: itunesTracks.map((t) => t.trackName),
                            container: aiRow,
                        });
                    }
                }
            });
        }

        if (typeof LyrixAI !== "undefined") {
            const aiRow = document.getElementById("aiButtonsRow");

            if (geniusTracks.length) {
                LyrixAI.initAlbumVibe({
                    title: al.name,
                    artist: al.artist?.name || "",
                    releaseDate: releaseYear,
                    tracks: geniusTracks.map((t) => t.song?.title).filter(Boolean),
                    container: aiRow,
                });
            }

            LyrixAI.initFloatingChat({
                page: "Chi tiết album",
                title: al.name,
                artist: al.artist?.name || "",
            });
        }
    } catch (err) {
        showError(err.message);
        container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Lỗi tải dữ liệu</h3><p>${err.message}</p><a href="../../index.html" class="btn btn-primary" style="margin-top:1rem">Về trang chủ</a></div>`;
    }
}
