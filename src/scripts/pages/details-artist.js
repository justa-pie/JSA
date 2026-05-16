// ============================================================
//  DETAILS — Artist
//  Requires: ../api/genius.js (fetchAPI, formatNumber)
// ============================================================

function showError(message) {
    return `
        <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:40px;margin:40px 0;text-align:center;">
            <i class="fas fa-exclamation-triangle" style="font-size:4rem;color:#ef4444;margin-bottom:20px;"></i>
            <h2 style="color:#fca5a5;font-weight:700;margin-bottom:15px;">Lỗi tải thông tin nghệ sĩ</h2>
            <p style="color:#fca5a5;font-size:1.1rem;">${message}</p>
            <a href="index.html" class="btn-gradient" style="display:inline-block;margin-top:20px;text-decoration:none;">
                <i class="fas fa-home"></i> Về trang chủ
            </a>
        </div>`;
}

// NAVIGATION
function navigateToSong(songId)   { window.location.href = `details-song.html?id=${songId}`; }
function navigateToAlbum(albumId) { window.location.href = `details-album.html?id=${albumId}`; }

// TAB SWITCHING
function switchArtistTab(tab) {
    document.querySelectorAll('.artist-tabs button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick')?.includes(`'${tab}'`)) btn.classList.add('active');
    });
    document.querySelectorAll('.tab-content-item').forEach(c => c.classList.remove('active'));
    document.getElementById(tab === 'songs' ? 'artist-songs-tab' : 'artist-albums-tab').classList.add('active');
}

// RENDER
function renderArtistHeader(artist) {
    return `
        <div class="artist-detail-header animate-slide-up">
            <img src="${artist.header_image_url}" alt="${artist.name}" class="artist-banner">
            <img src="${artist.image_url}" alt="${artist.name}" class="artist-avatar">
            <h2 class="artist-name">${artist.name || 'Nghệ sĩ chưa rõ'}</h2>
            <div class="social-links">
                ${artist.facebook_name  ? `<a href="https://facebook.com/${artist.facebook_name}" target="_blank"><i class="fab fa-facebook"></i></a>` : ''}
                ${artist.instagram_name ? `<a href="https://instagram.com/${artist.instagram_name}" target="_blank"><i class="fab fa-instagram"></i></a>` : ''}
                ${artist.twitter_name   ? `<a href="https://twitter.com/${artist.twitter_name}" target="_blank"><i class="fab fa-twitter"></i></a>` : ''}
            </div>
        </div>`;
}

function renderArtistBio(artist) {
    let bioText = artist.description?.plain
        || (artist.description?.html ? artist.description.html.replace(/<[^>]*>/g, '') : null)
        || (typeof artist.description === 'string' && artist.description.length > 0 ? artist.description : null)
        || (artist.bio ? (typeof artist.bio === 'string' ? artist.bio : (artist.bio.plain || artist.bio.html?.replace(/<[^>]*>/g, ''))) : null);

    if (!bioText?.trim()) return '';
    return `
        <div class="lyrics-container animate-slide-up">
            <h3><i class="fas fa-info-circle"></i> Tiểu sử</h3>
            <p style="line-height:1.8;color:var(--text-primary);white-space:pre-wrap;">${bioText}</p>
        </div>`;
}

function renderSongsList(songs) {
    if (!songs?.length) return '<p style="color:var(--text-secondary);text-align:center;padding:40px;">Không tìm thấy bài hát</p>';
    let html = '<div class="chart-list">';
    songs.forEach((song, index) => {
        const pos = index + 1;
        const posClass = pos === 1 ? 'top-1' : pos === 2 ? 'top-2' : pos === 3 ? 'top-3' : '';
        html += `
            <div class="chart-item" onclick="navigateToSong(${song.id})">
                <div class="chart-position ${posClass}">${pos}</div>
                <img src="${song.song_art_image_thumbnail_url || song.song_art_image_url || ''}" class="chart-image" onerror="this.src='../../assets/public/images/logo.webp'">
                <div class="chart-info">
                    <div class="chart-title">${song.title || 'Chưa rõ tên'}</div>
                    <div class="chart-subtitle">${song.artist_names || ''}</div>
                </div>
                <div class="chart-stats">
                    ${song.stats?.pageviews ? `<div class="chart-views"><i class="fas fa-eye"></i> ${formatNumber(song.stats.pageviews)}</div>` : ''}
                    ${song.stats?.hot ? '<span class="badge-hot"><i class="fas fa-fire"></i> HOT</span>' : ''}
                </div>
            </div>`;
    });
    return html + '</div>';
}

function renderAlbumsList(albums) {
    if (!albums?.length) return '<p style="color:var(--text-secondary);text-align:center;padding:40px;">Không tìm thấy album</p>';
    let html = '<div class="chart-list">';
    albums.forEach((album, index) => {
        html += `
            <div class="chart-item" onclick="navigateToAlbum(${album.id})">
                <div class="chart-position" style="min-width:40px;font-size:1.2rem;">${index + 1}</div>
                <img src="${album.cover_art_url || ''}" class="chart-image" onerror="this.src='../../assets/public/images/logo.webp'">
                <div class="chart-info">
                    <div class="chart-title">${album.name || 'Chưa rõ tên'}</div>
                    <div class="chart-subtitle">${album.release_date_components?.year || ''}</div>
                </div>
                <i class="fas fa-chevron-right" style="opacity:0.2;margin-left:auto;"></i>
            </div>`;
    });
    return html + '</div>';
}

// MAIN
async function loadArtistDetails() {
    const artistId = new URLSearchParams(window.location.search).get('id');
    const container = document.getElementById('artistContent');

    if (!artistId) { container.innerHTML = showError('ID nghệ sĩ không hợp lệ.'); return; }

    container.innerHTML = `<div class="loading"><div class="spinner-border text-light" role="status"></div><p style="color:var(--text-secondary);margin-top:20px;">Đang tải thông tin nghệ sĩ...</p></div>`;

    const [details, songs, albums] = await Promise.all([
        fetchAPI('/artist/details/', { id: artistId }),
        fetchAPI('/artist/songs/', { id: artistId, sort: 'popularity', per_page: 20 }),
        fetchAPI('/artist/albums/', { id: artistId, per_page: 50 })
    ]);

    if (!details?.artist) { container.innerHTML = showError('Không thể tải thông tin nghệ sĩ.'); return; }

    const artist = details.artist;
    let html = renderArtistHeader(artist);
    html += '<div class="two-column-layout">';
    html += '<div class="left-column">' + renderArtistBio(artist) + '</div>';
    html += '<div class="right-column">';
    html += `
        <div class="artist-tabs animate-slide-up">
            <button class="active" onclick="switchArtistTab('songs')"><i class="fas fa-music"></i> Top ${songs?.songs?.length || 0} Bài hát</button>
            <button onclick="switchArtistTab('albums')"><i class="fas fa-compact-disc"></i> Albums - ${albums?.albums?.length || 0}</button>
        </div>`;
    html += '<div id="artist-songs-tab" class="tab-content-item active animate-slide-up">' + renderSongsList(songs?.songs) + '</div>';
    html += '<div id="artist-albums-tab" class="tab-content-item">' + renderAlbumsList(albums?.albums) + '</div>';
    html += '</div></div>';

    container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', loadArtistDetails);
