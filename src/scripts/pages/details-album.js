// ─── details-album.js ────────────────────────────────────────────────────────

const params = new URLSearchParams(window.location.search);
const albumId = params.get("id");
const container = document.getElementById("albumDetailContent");

if (!albumId) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i><h3>Thiếu ID album</h3><a href="index.html" class="btn btn-primary" style="margin-top:1rem">Về trang chủ</a></div>`;
} else {
    loadAlbum();
}

async function loadAlbum() {
    try {
        const data = await fetchAPI("/album/details/", { id: albumId });
        const al = data?.album;
        if (!al) throw new Error("Không tìm thấy album.");

        document.title = `${al.name} — ${al.artist?.name || ""} | Lyrix`;

        // tracks: mảng { number_in_album, song: { id, title, ... } }
        const tracks = al.tracks || [];
        const desc = stripHtml(al.description?.html || "");

        // Năm phát hành từ release_date_components
        const releaseYear = al.release_date_components
            ? `${al.release_date_components.year || ""}`
            : al.release_date_for_display || "";

        container.innerHTML = `
      <div class="song-detail-header animate-slide-up">
        <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(124,58,237,0.07),transparent);pointer-events:none"></div>
        <img class="detail-cover" src="${safeImg(al.cover_art_url)}" alt="${al.name}" onerror="this.src='${safeImg()}'"/>
        <div class="detail-info" style="flex:1;min-width:0">
          <div style="margin-bottom:6px"><span class="badge badge-brand"><i class="fa-solid fa-compact-disc"></i> Album</span></div>
          <h1>${al.name}</h1>
          <div class="artist-name" style="cursor:pointer;margin-top:4px"
               onclick="window.location.href='details-artist.html?id=${al.artist?.id}'">
            ${al.artist?.name || "Unknown Artist"}
          </div>
          <div class="detail-meta">
            ${releaseYear ? `<div class="meta-chip"><i class="fa-solid fa-calendar"></i> ${releaseYear}</div>` : ""}
            ${tracks.length ? `<div class="meta-chip"><i class="fa-solid fa-list-ol"></i> ${tracks.length} tracks</div>` : ""}
          </div>
          <div class="detail-actions">
            ${al.url ? `<a href="${al.url}" target="_blank" class="btn btn-primary btn-sm"><i class="fa-solid fa-arrow-up-right-from-square"></i> Xem trên Genius</a>` : ""}
            ${al.artist?.id ? `<button class="btn btn-outline btn-sm" onclick="window.location.href='details-artist.html?id=${al.artist.id}'"><i class="fa-solid fa-user"></i> Nghệ sĩ</button>` : ""}
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="card animate-slide-up stagger-1" style="padding:1.25rem;margin-bottom:1.5rem">
        <div class="stats-bar">
          <div class="stat-item"><div class="stat-value">${tracks.length || "—"}</div><div class="stat-label">Tracks</div></div>
          <div class="stat-item"><div class="stat-value">${releaseYear || "—"}</div><div class="stat-label">Phát hành</div></div>
          <div class="stat-item"><div class="stat-value">${al.artist?.name || "—"}</div><div class="stat-label">Nghệ sĩ</div></div>
        </div>
      </div>

      <!-- Layout -->
      <div class="two-column-layout animate-slide-up stagger-2">
        <div class="left-column">
          ${
              desc
                  ? `
          <h3 style="margin-bottom:.75rem"><i class="fa-solid fa-circle-info" style="color:var(--brand-light);margin-right:6px"></i>Giới thiệu</h3>
          <div class="lyrics-container" style="font-size:.875rem;line-height:1.8;color:var(--text-2)">${desc}</div>`
                  : ""
          }

          ${
              al.artist
                  ? `
          <div class="card" style="padding:1rem;margin-top:1.25rem;cursor:pointer" onclick="window.location.href='details-artist.html?id=${al.artist.id}'">
            <div style="font-size:.7rem;color:var(--text-3);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:10px">Nghệ sĩ</div>
            <div style="display:flex;align-items:center;gap:.75rem">
              <img src="${safeImg(al.artist.image_url)}" style="width:48px;height:48px;border-radius:50%;object-fit:cover" onerror="this.src='${safeImg()}'"/>
              <div>
                <div style="font-weight:600;font-size:.9rem">${al.artist.name}</div>
                ${al.artist.is_verified ? '<div style="font-size:.72rem;color:var(--brand-light);margin-top:2px"><i class="fa-solid fa-circle-check"></i> Verified</div>' : ""}
              </div>
            </div>
          </div>`
                  : ""
          }
        </div>

        <!-- Track list -->
        <div class="right-column">
          <h3 style="margin-bottom:1rem">
            <i class="fa-solid fa-list-ol" style="color:var(--brand-light);margin-right:6px"></i>Danh sách track
          </h3>
          ${
              tracks.length
                  ? `
          <div style="display:flex;flex-direction:column;gap:.5rem">
            ${tracks
                .map((t, i) => {
                    const s = t.song;
                    if (!s) return "";
                    const num = t.number_in_album || i + 1;
                    return `<div class="chart-item animate-slide-up" style="animation-delay:${Math.min(i, 15) * 0.04}s;cursor:pointer"
                onclick="window.location.href='details-song.html?id=${s.id}'">
                <span class="chart-position">${num}</span>
                <img class="chart-image" src="${safeImg(s.song_art_image_url || al.cover_art_url)}" alt="" onerror="this.src='${safeImg()}'"/>
                <div class="chart-info">
                  <div class="chart-title">${s.title}</div>
                  <div class="chart-sub">${s.primary_artist?.name || al.artist?.name || ""}${s.featured_artists?.length ? " ft. " + s.featured_artists.map((a) => a.name).join(", ") : ""}</div>
                </div>
                <span class="chart-views"><i class="fa-solid fa-eye" style="font-size:10px;margin-right:3px"></i>${formatNumber(s.stats?.pageviews)}</span>
              </div>`;
                })
                .join("")}
          </div>`
                  : `<div class="empty-state"><i class="fa-solid fa-compact-disc"></i><p>Không có thông tin track.</p></div>`
          }
        </div>
      </div>`;
    } catch (err) {
        showError(err.message);
        container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Lỗi tải dữ liệu</h3><p>${err.message}</p><a href="index.html" class="btn btn-primary" style="margin-top:1rem">Về trang chủ</a></div>`;
    }
}
