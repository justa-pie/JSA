// ─── details-artist.js ───────────────────────────────────────────────────────

const params = new URLSearchParams(window.location.search);
const artistId = params.get("id");
const container = document.getElementById("artistDetailContent");

if (!artistId) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i><h3>Thiếu ID nghệ sĩ</h3><a href="index.html" class="btn btn-primary" style="margin-top:1rem">Về trang chủ</a></div>`;
} else {
    loadArtist();
}

let cachedSongs = null;
let cachedAlbums = null;

async function loadArtist() {
    try {
        const data = await fetchAPI("/artist/details/", { id: artistId });
        const a = data?.artist;
        if (!a) throw new Error("Không tìm thấy nghệ sĩ.");

        document.title = `${a.name} — Lyrix`;

        // Banner
        if (a.header_image_url) {
            const bannerEl = document.getElementById("artistBannerImg");
            if (bannerEl) {
                bannerEl.style.backgroundImage = `url('${a.header_image_url}')`;
                bannerEl.style.backgroundSize = "cover";
                bannerEl.style.backgroundPosition = "center top";
            }
        }

        const bio = stripHtml(a.description?.html || "");

        container.innerHTML = `
      <div class="artist-detail-header animate-slide-up">
        <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(124,58,237,0.06),transparent);pointer-events:none"></div>
        <img class="detail-cover artist-cover" src="${safeImg(a.image_url)}" alt="${a.name}" onerror="this.src='${safeImg()}'"/>
        <div class="detail-info" style="flex:1;min-width:0">
          <div style="margin-bottom:6px">
            ${a.is_verified ? '<span class="badge badge-brand"><i class="fa-solid fa-check"></i> Verified</span>' : ""}
            ${a.is_meme_verified ? '<span class="badge badge-hot" style="margin-left:6px"><i class="fa-solid fa-fire"></i> Meme Verified</span>' : ""}
          </div>
          <h1>${a.name}</h1>
          <div class="detail-meta" style="margin-top:8px">
            ${a.followers_count ? `<div class="meta-chip"><i class="fa-solid fa-users"></i> ${formatNumber(a.followers_count)} followers</div>` : ""}
            ${a.iq ? `<div class="meta-chip"><i class="fa-solid fa-star"></i> ${formatNumber(a.iq)} IQ</div>` : ""}
          </div>
          <div class="detail-actions">
            ${a.url ? `<a href="${a.url}" target="_blank" class="btn btn-primary btn-sm"><i class="fa-solid fa-arrow-up-right-from-square"></i> Xem trên Genius</a>` : ""}
            ${a.instagram_name ? `<a href="https://instagram.com/${a.instagram_name}" target="_blank" class="btn btn-ghost btn-sm"><i class="fa-brands fa-instagram"></i></a>` : ""}
            ${a.twitter_name ? `<a href="https://twitter.com/${a.twitter_name}"   target="_blank" class="btn btn-ghost btn-sm"><i class="fa-brands fa-twitter"></i></a>` : ""}
            ${a.facebook_name ? `<a href="https://facebook.com/${a.facebook_name}" target="_blank" class="btn btn-ghost btn-sm"><i class="fa-brands fa-facebook"></i></a>` : ""}
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="card animate-slide-up stagger-1" style="padding:1.25rem;margin-bottom:1.5rem">
        <div class="stats-bar">
          <div class="stat-item"><div class="stat-value">${formatNumber(a.followers_count)}</div><div class="stat-label">Followers</div></div>
          <div class="stat-item"><div class="stat-value">${formatNumber(a.iq)}</div><div class="stat-label">Genius IQ</div></div>
          <div class="stat-item"><div class="stat-value" id="songCountStat">—</div><div class="stat-label">Bài hát</div></div>
          <div class="stat-item"><div class="stat-value" id="albumCountStat">—</div><div class="stat-label">Albums</div></div>
        </div>
      </div>

      <!-- Two col -->
      <div class="two-column-layout animate-slide-up stagger-2">
        <div class="left-column">
          ${
              bio
                  ? `
          <h3 style="margin-bottom:.75rem"><i class="fa-solid fa-user-pen" style="color:var(--brand-light);margin-right:6px"></i>Tiểu sử</h3>
          <div class="lyrics-container" style="font-size:.875rem;line-height:1.8;color:var(--text-2)">${bio}</div>`
                  : ""
          }

          ${
              a.instagram_name || a.twitter_name || a.facebook_name
                  ? `
          <div style="margin-top:1.25rem">
            <div style="font-size:.72rem;color:var(--text-3);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:10px">Mạng xã hội</div>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${a.instagram_name ? `<a href="https://instagram.com/${a.instagram_name}" target="_blank" class="meta-chip" style="display:inline-flex;text-decoration:none;width:fit-content"><i class="fa-brands fa-instagram" style="color:#e1306c"></i> @${a.instagram_name}</a>` : ""}
              ${a.twitter_name ? `<a href="https://twitter.com/${a.twitter_name}"   target="_blank" class="meta-chip" style="display:inline-flex;text-decoration:none;width:fit-content"><i class="fa-brands fa-twitter" style="color:#1da1f2"></i> @${a.twitter_name}</a>` : ""}
              ${a.facebook_name ? `<a href="https://facebook.com/${a.facebook_name}" target="_blank" class="meta-chip" style="display:inline-flex;text-decoration:none;width:fit-content"><i class="fa-brands fa-facebook" style="color:#1877f2"></i> ${a.facebook_name}</a>` : ""}
            </div>
          </div>`
                  : ""
          }
        </div>

        <div class="right-column">
          <div class="artist-tabs">
            <button class="artist-tab active" id="tabSongs"  onclick="showTab('songs')"><i class="fa-solid fa-music"></i> Bài hát</button>
            <button class="artist-tab"        id="tabAlbums" onclick="showTab('albums')"><i class="fa-solid fa-compact-disc"></i> Albums</button>
          </div>
          <div id="artistTabContent">
            <div style="display:flex;flex-direction:column;gap:.5rem">
              ${Array(6).fill('<div class="skeleton" style="height:68px;border-radius:12px"></div>').join("")}
            </div>
          </div>
        </div>
      </div>`;

        loadSongs();
    } catch (err) {
        showError(err.message);
        container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Lỗi tải dữ liệu</h3><p>${err.message}</p></div>`;
    }
}

async function loadSongs() {
    if (cachedSongs) {
        renderSongs(cachedSongs);
        return;
    }
    try {
        // GET /artist/songs/ — sort: popularity, per_page: 20
        const data = await fetchAPI("/artist/songs/", {
            id: artistId,
            sort: "popularity",
            per_page: 20,
        });
        cachedSongs = data?.songs || [];
        const stat = document.getElementById("songCountStat");
        if (stat) stat.textContent = cachedSongs.length;
        renderSongs(cachedSongs);
    } catch (err) {
        document.getElementById("artistTabContent").innerHTML =
            `<div class="empty-state"><p>${err.message}</p></div>`;
    }
}

async function loadAlbums() {
    if (cachedAlbums) {
        renderAlbums(cachedAlbums);
        return;
    }
    try {
        // GET /artist/albums/ — per_page: 10
        const data = await fetchAPI("/artist/albums/", {
            id: artistId,
            per_page: 10,
        });
        cachedAlbums = data?.albums || [];
        const stat = document.getElementById("albumCountStat");
        if (stat) stat.textContent = cachedAlbums.length;
        renderAlbums(cachedAlbums);
    } catch (err) {
        document.getElementById("artistTabContent").innerHTML =
            `<div class="empty-state"><p>${err.message}</p></div>`;
    }
}

function renderSongs(songs) {
    if (!songs.length) {
        document.getElementById("artistTabContent").innerHTML =
            `<div class="empty-state"><i class="fa-solid fa-music"></i><p>Chưa có bài hát</p></div>`;
        return;
    }
    document.getElementById("artistTabContent").innerHTML = `
    <div style="display:flex;flex-direction:column;gap:.5rem">
      ${songs
          .map(
              (s, i) => `
      <div class="chart-item animate-slide-up" style="animation-delay:${Math.min(i, 10) * 0.04}s;cursor:pointer"
           onclick="window.location.href='details-song.html?id=${s.id}'">
        <span class="chart-position">${i + 1}</span>
        <img class="chart-image" src="${safeImg(s.song_art_image_url || s.header_image_url)}" alt="" onerror="this.src='${safeImg()}'"/>
        <div class="chart-info">
          <div class="chart-title">${s.title}</div>
          <div class="chart-sub">${s.release_date_components ? [s.release_date_components.year].filter(Boolean).join(" · ") : ""}</div>
        </div>
        <span class="chart-views"><i class="fa-solid fa-eye" style="font-size:10px;margin-right:3px"></i>${formatNumber(s.stats?.pageviews)}</span>
      </div>`,
          )
          .join("")}
    </div>`;
}

function renderAlbums(albums) {
    if (!albums.length) {
        document.getElementById("artistTabContent").innerHTML =
            `<div class="empty-state"><i class="fa-solid fa-compact-disc"></i><p>Chưa có album</p></div>`;
        return;
    }
    document.getElementById("artistTabContent").innerHTML = `
    <div style="display:flex;flex-direction:column;gap:.5rem">
      ${albums
          .map(
              (al, i) => `
      <div class="chart-item animate-slide-up" style="animation-delay:${Math.min(i, 10) * 0.04}s;cursor:pointer"
           onclick="window.location.href='details-album.html?id=${al.id}'">
        <span class="chart-position">${i + 1}</span>
        <img class="chart-image" src="${safeImg(al.cover_art_url)}" alt="" onerror="this.src='${safeImg()}'"/>
        <div class="chart-info">
          <div class="chart-title">${al.name}</div>
          <div class="chart-sub">${al.release_date_components?.year || ""}</div>
        </div>
      </div>`,
          )
          .join("")}
    </div>`;
}

window.showTab = function (tab) {
    document
        .getElementById("tabSongs")
        .classList.toggle("active", tab === "songs");
    document
        .getElementById("tabAlbums")
        .classList.toggle("active", tab === "albums");
    document.getElementById("artistTabContent").innerHTML =
        `<div style="display:flex;flex-direction:column;gap:.5rem">
    ${Array(4).fill('<div class="skeleton" style="height:68px;border-radius:12px"></div>').join("")}
  </div>`;
    if (tab === "songs") loadSongs();
    else loadAlbums();
};
