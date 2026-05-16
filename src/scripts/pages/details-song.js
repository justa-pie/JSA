// ============================================================
//  DETAILS — Song
//  Requires: ../api/genius.js (fetchAPI, formatNumber)
// ============================================================

function formatDuration(seconds) {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function showError(message) {
    return `
        <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:40px;margin:40px 0;text-align:center;">
            <i class="fas fa-exclamation-triangle" style="font-size:4rem;color:#ef4444;margin-bottom:20px;"></i>
            <h2 style="color:#fca5a5;font-weight:700;margin-bottom:15px;">Lỗi tải thông tin bài hát</h2>
            <p style="color:#fca5a5;font-size:1.1rem;">${message}</p>
            <a href="index.html" class="btn-gradient" style="display:inline-block;margin-top:20px;text-decoration:none;">
                <i class="fas fa-home"></i> Về trang chủ
            </a>
        </div>`;
}

// NAVIGATION
function navigateToArtist(artistId) { window.location.href = `details-artist.html?id=${artistId}`; }

// LYRICS
async function fetchLyrics(songId) {
    const data = await fetchAPI('/song/lyrics/', { id: songId });
    return data?.lyrics || null;
}

// RENDER
function renderSongHeader(song) {
    const imgUrl = song.song_art_image_url || song.header_image_url;
    const duration = song.duration ? formatDuration(song.duration) : song.duration_ms ? formatDuration(Math.floor(song.duration_ms / 1000)) : null;

    let statsHTML = '<div class="song-detail-stats">';
    if (song.release_date_for_display) statsHTML += `<div class="stat-item"><div class="stat-value"><i class="fas fa-calendar"></i></div><div class="stat-label">${song.release_date_for_display}</div></div>`;
    if (duration) statsHTML += `<div class="stat-item"><div class="stat-value"><i class="fas fa-clock"></i></div><div class="stat-label">${duration}</div></div>`;
    if (song.stats?.pageviews) statsHTML += `<div class="stat-item"><div class="stat-value">${formatNumber(song.stats.pageviews)}</div><div class="stat-label">Lượt xem</div></div>`;
    if (song.stats?.hot) statsHTML += `<div class="stat-item"><span class="badge-hot"><i class="fas fa-fire"></i> TRENDING</span></div>`;
    statsHTML += '</div>';

    return `
        <div class="song-detail-header animate-slide-up">
            <img src="${imgUrl}" alt="${song.title}" class="song-detail-image">
            <h2 class="song-detail-title">${song.full_title || song.title || 'Chưa rõ tên'}</h2>
            <p class="song-detail-artist" onclick="navigateToArtist(${song.primary_artist?.id})" style="cursor:pointer;">
                <i class="fas fa-user"></i> ${song.primary_artist?.name || 'Nghệ sĩ chưa rõ'}
            </p>
            ${statsHTML}
        </div>`;
}

function renderLyrics(lyricsData) {
    const lyricsBody = lyricsData?.body || lyricsData?.lyrics?.body || null;
    if (!lyricsBody) return '';

    let cleanLyrics = lyricsBody.html || lyricsBody.plain || '';
    if (cleanLyrics.includes('<')) {
        cleanLyrics = cleanLyrics
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    }

    return `
        <div class="lyrics-container animate-slide-up">
            <h3><i class="fas fa-music"></i> Lời bài hát</h3>
            <div class="lyrics-text" style="white-space:pre-wrap;line-height:1.8;color:var(--text-primary);">${cleanLyrics.trim()}</div>
        </div>`;
}

function renderSongDescription(song) {
    let descText = song.description?.plain || (song.description?.html ? song.description.html.replace(/<[^>]*>/g, '') : null) || (typeof song.description === 'string' ? song.description : null);
    if (!descText?.trim()) return '';
    return `
        <div class="lyrics-container animate-slide-up">
            <h3><i class="fas fa-info-circle"></i> Về bài hát</h3>
            <p style="line-height:1.8;text-align:left;white-space:pre-wrap;">${descText}</p>
        </div>`;
}

function renderCredits(song) {
    const hasWriters   = song.writer_artists?.length > 0;
    const hasProducers = song.producer_artists?.length > 0;
    const hasFeatured  = song.featured_artists?.length > 0;
    if (!hasWriters && !hasProducers && !hasFeatured) return '';

    const renderGroup = (label, icon, artists) => {
        let h = `<h4 style="margin-top:20px;"><i class="${icon}"></i> ${label}</h4><div class="credits-grid">`;
        artists.forEach(a => {
            h += `<div class="credit-item" onclick="navigateToArtist(${a.id})" style="cursor:pointer;">
                <img src="${a.image_url || '../../assets/public/images/logo.webp'}" alt="${a.name}" onerror="this.src='../../assets/public/images/logo.webp'">
                <div class="credit-name">${a.name}</div>
            </div>`;
        });
        return h + '</div>';
    };

    let html = '<div class="credits-section animate-slide-up">';
    if (hasWriters)   html += renderGroup('Nhạc sĩ', 'fas fa-pen', song.writer_artists);
    if (hasProducers) html += renderGroup('Producer', 'fas fa-sliders-h', song.producer_artists);
    if (hasFeatured)  html += renderGroup('Featured Artists', 'fas fa-star', song.featured_artists);
    return html + '</div>';
}

// MAIN
async function loadSongDetails() {
    const songId = new URLSearchParams(window.location.search).get('id');
    const container = document.getElementById('songContent');

    if (!songId) { container.innerHTML = showError('ID bài hát không hợp lệ.'); return; }

    container.innerHTML = `<div class="loading"><div class="spinner-border text-light" role="status"></div><p style="color:var(--text-secondary);margin-top:20px;">Đang tải thông tin bài hát...</p></div>`;

    const [details, lyricsData] = await Promise.all([
        fetchAPI('/song/details/', { id: songId }),
        fetchLyrics(songId)
    ]);

    if (!details?.song) { container.innerHTML = showError('Không thể tải thông tin bài hát.'); return; }

    const song = details.song;
    let html = renderSongHeader(song);
    html += '<div class="two-column-layout">';
    html += '<div class="left-column">' + renderSongDescription(song) + renderCredits(song) + '</div>';
    html += '<div class="right-column">' + (lyricsData ? renderLyrics(lyricsData) : '') + '</div>';
    html += '</div>';

    container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', loadSongDetails);
