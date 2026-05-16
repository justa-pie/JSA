// ============================================================
//  DETAILS — Album
//  Requires: ../api/genius.js (fetchAPI, formatNumber)
// ============================================================

const PLACEHOLDER_IMG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM2NjdlZWEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM3NjRiYTIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0idXJsKCNnKSIvPjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iNjAiPvCfjrU8L3RleHQ+PC9zdmc+';

function showError(message) {
    return `
        <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:40px;margin:40px 0;text-align:center;">
            <i class="fas fa-exclamation-triangle" style="font-size:4rem;color:#ef4444;margin-bottom:20px;"></i>
            <h2 style="color:#fca5a5;font-weight:700;margin-bottom:15px;">Lỗi tải thông tin album</h2>
            <p style="color:#fca5a5;font-size:1.1rem;">${message}</p>
            <a href="index.html" class="btn-gradient" style="display:inline-block;margin-top:20px;text-decoration:none;">
                <i class="fas fa-home"></i> Về trang chủ
            </a>
        </div>`;
}

// NAVIGATION
function navigateToArtist(artistId) { window.location.href = `details-artist.html?id=${artistId}`; }

// RENDER
function renderAlbumHeader(album) {
    const coverImg = album.cover_art_url || PLACEHOLDER_IMG;
    return `
        <div class="album-detail-header animate-slide-up">
            <img src="${coverImg}" alt="${album.name}" class="album-cover" onerror="this.src='${PLACEHOLDER_IMG}'">
            <div class="album-info">
                <h2>${album.name || 'Album chưa rõ'}</h2>
                <p style="font-size:1.2rem;margin-bottom:10px;cursor:pointer;color:var(--text-secondary);" onclick="navigateToArtist(${album.artist?.id})">
                    <i class="fas fa-user"></i> ${album.artist?.name || 'Nghệ sĩ chưa rõ'}
                </p>
                ${album.release_date_components ? `<p style="color:var(--text-secondary);"><i class="fas fa-calendar"></i> ${album.release_date_components.day}/${album.release_date_components.month}/${album.release_date_components.year}</p>` : ''}
            </div>
        </div>`;
}

function renderAlbumDescription(album) {
    const descText = album.description_preview || album.description || null;
    if (!descText?.trim()) {
        return album.url ? `
            <div class="lyrics-container animate-slide-up" style="margin-top:30px;text-align:center;">
                <a href="${album.url}" target="_blank" class="btn-gradient" style="display:inline-flex;align-items:center;gap:10px;text-decoration:none;">
                    <i class="fas fa-external-link-alt"></i> Xem đầy đủ album trên Genius
                </a>
            </div>` : '';
    }
    return `
        <div class="lyrics-container animate-slide-up" style="margin-top:30px;">
            <h3><i class="fas fa-info-circle"></i> Về album</h3>
            <p style="line-height:1.8;text-align:left;white-space:pre-wrap;">${descText}</p>
            ${album.url ? `
                <div style="text-align:center;margin-top:25px;">
                    <a href="${album.url}" target="_blank" class="btn-gradient" style="display:inline-flex;align-items:center;gap:10px;text-decoration:none;">
                        <i class="fas fa-external-link-alt"></i> Xem đầy đủ album trên Genius
                    </a>
                </div>` : ''}
        </div>`;
}

// MAIN
async function loadAlbumDetails() {
    const albumId = new URLSearchParams(window.location.search).get('id');
    const container = document.getElementById('albumContent');

    if (!albumId) { container.innerHTML = showError('ID album không hợp lệ.'); return; }

    container.innerHTML = `<div class="loading"><div class="spinner-border text-light" role="status"></div><p style="color:var(--text-secondary);margin-top:20px;">Đang tải thông tin album...</p></div>`;

    const albumData = await fetchAPI('/album/details/', { id: albumId });

    if (!albumData?.album) { container.innerHTML = showError('Không thể tải thông tin album.'); return; }

    const album = albumData.album;
    container.innerHTML = renderAlbumHeader(album) + renderAlbumDescription(album);
}

document.addEventListener('DOMContentLoaded', loadAlbumDetails);
