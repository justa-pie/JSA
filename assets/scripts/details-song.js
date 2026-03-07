// API CONFIGURATION
const API_CONFIG = {
    host: 'genius-song-lyrics1.p.rapidapi.com',
    key: 'f405287279msha2ee93f99d91b69p153223jsn9bccd2e5b5b4',
    baseURL: 'https://genius-song-lyrics1.p.rapidapi.com'
};

// UTILITY FUNCTIONS
async function fetchAPI(endpoint, params = {}) {
    const url = new URL(`${API_CONFIG.baseURL}${endpoint}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Host': API_CONFIG.host,
            'X-RapidAPI-Key': API_CONFIG.key
        }
    };
    
    try {
        console.log('🔗 Fetching:', url.toString());
        const response = await fetch(url, options);
        console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error Response:', errorText);
            
            if (response.status === 429) {
                throw new Error('API quota exceeded. Please upgrade your plan or wait for reset.');
            } else if (response.status === 401 || response.status === 403) {
                throw new Error('API authentication failed. Please check your API key.');
            } else {
                throw new Error(`API request failed with status ${response.status}`);
            }
        }
        
        const data = await response.json();
        console.log('✅ API Data:', data);
        return data;
    } catch (error) {
        console.error('❌ API Error:', error);
        return null;
    }
}

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function formatDuration(seconds) {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function showError(message) {
    return `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 40px; margin: 40px 0; text-align: center;">
            <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ef4444; margin-bottom: 20px;"></i>
            <h2 style="color: #fca5a5; font-weight: 700; margin-bottom: 15px;">Lỗi tải thông tin bài hát</h2>
            <p style="color: #fca5a5; font-size: 1.1rem;">${message}</p>
            <a href="index.html" class="btn-gradient" style="display: inline-block; margin-top: 20px; text-decoration: none;">
                <i class="fas fa-home"></i> Về trang chủ
            </a>
        </div>
    `;
}

// LYRICS FUNCTIONS
async function fetchLyrics(songId) {
    console.log('🎵 Fetching lyrics for song:', songId);
    const data = await fetchAPI('/song/lyrics/', { id: songId });
    
    if (!data || !data.lyrics) {
        console.warn('⚠️ No lyrics data received');
        return null;
    }
    
    console.log('✅ Lyrics fetched successfully');
    return data.lyrics;
}

// NAVIGATION FUNCTIONS
function navigateToArtist(artistId) {
    window.location.href = `details-artist.html?id=${artistId}`;
}

// RENDER FUNCTIONS
function renderSongHeader(song) {
    const imgUrl = song.song_art_image_url || song.header_image_url;
    const duration = song.duration || song.duration_ms ? formatDuration(song.duration || Math.floor(song.duration_ms / 1000)) : null;
    
    let statsHTML = '<div class="song-detail-stats">';
    
    if (song.release_date_for_display) {
        statsHTML += `
            <div class="stat-item">
                <div class="stat-value"><i class="fas fa-calendar"></i></div>
                <div class="stat-label">${song.release_date_for_display}</div>
            </div>
        `;
    }
    
    if (duration) {
        statsHTML += `
            <div class="stat-item">
                <div class="stat-value"><i class="fas fa-clock"></i></div>
                <div class="stat-label">${duration}</div>
            </div>
        `;
    }
    
    if (song.stats?.pageviews) {
        statsHTML += `
            <div class="stat-item">
                <div class="stat-value">${formatNumber(song.stats.pageviews)}</div>
                <div class="stat-label">Lượt xem</div>
            </div>
        `;
    }
    
    if (song.stats?.hot) {
        statsHTML += `
            <div class="stat-item">
                <span class="badge-hot"><i class="fas fa-fire"></i> TRENDING</span>
            </div>
        `;
    }
    
    statsHTML += '</div>';
    
    return `
        <div class="song-detail-header animate-slide-up">
            <img src="${imgUrl}" alt="${song.title}" class="song-detail-image">
            <h2 class="song-detail-title">${song.full_title || song.title || 'Chưa rõ tên'}</h2>
            <p class="song-detail-artist" onclick="navigateToArtist(${song.primary_artist?.id})" style="cursor: pointer;">
                <i class="fas fa-user"></i> ${song.primary_artist?.name || 'Nghệ sĩ chưa rõ'}
            </p>
            ${statsHTML}
        </div>
    `;
}

function renderLyrics(lyricsData) {
    const lyricsBody = lyricsData?.body || lyricsData?.lyrics?.body || null;
    if (!lyricsData || !lyricsBody) {
        return '';
    }
    
    let cleanLyrics = lyricsBody.html || lyricsBody.plain || '';
    
    if (cleanLyrics.includes('<')) {
        cleanLyrics = cleanLyrics.replace(/<br\s*\/?>/gi, '\n');
        cleanLyrics = cleanLyrics.replace(/<\/p>/gi, '\n\n');
        cleanLyrics = cleanLyrics.replace(/<[^>]*>/g, '');
        cleanLyrics = cleanLyrics
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
    }
    
    cleanLyrics = cleanLyrics.trim();
    
    return `
        <div class="lyrics-container animate-slide-up">
            <h3><i class="fas fa-music"></i> Lời bài hát</h3>
            <div class="lyrics-text" style="white-space: pre-wrap; line-height: 1.8; color: var(--text-primary);">${cleanLyrics}</div>
        </div>
    `;
}

function renderSongDescription(song) {
    let descText = null;
    
    if (song.description && song.description.plain) {
        descText = song.description.plain;
    } else if (song.description && song.description.html) {
        descText = song.description.html.replace(/<[^>]*>/g, '');
    } else if (typeof song.description === 'string' && song.description.length > 0) {
        descText = song.description;
    }
    
    if (!descText || descText.trim().length === 0) {
        return '';
    }
    
    return `
        <div class="lyrics-container animate-slide-up">
            <h3><i class="fas fa-info-circle"></i> Về bài hát</h3>
            <p style="line-height: 1.8; text-align: left; white-space: pre-wrap;">${descText}</p>
        </div>
    `;
}

function renderCredits(song) {
    const hasWriters = song.writer_artists && song.writer_artists.length > 0;
    const hasProducers = song.producer_artists && song.producer_artists.length > 0;
    const hasFeatured = song.featured_artists && song.featured_artists.length > 0;
    
    if (!hasWriters && !hasProducers && !hasFeatured) {
        return '';
    }
    
    let html = '<div class="credits-section animate-slide-up">';
    
    if (hasWriters) {
        html += '<h4><i class="fas fa-pen"></i> Nhạc sĩ</h4><div class="credits-grid">';
        song.writer_artists.forEach(artist => {
            const artistImg = artist.image_url || 'assets/images/placeholder.png';
            html += `
                <div class="credit-item" onclick="navigateToArtist(${artist.id})" style="cursor: pointer;">
                    <img src="${artistImg}" alt="${artist.name}" onerror="this.src='assets/images/placeholder.png'">
                    <div class="credit-name">${artist.name}</div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    if (hasProducers) {
        html += '<h4 style="margin-top: 20px;"><i class="fas fa-sliders-h"></i> Producer</h4><div class="credits-grid">';
        song.producer_artists.forEach(artist => {
            const artistImg = artist.image_url || 'assets/images/placeholder.png';
            html += `
                <div class="credit-item" onclick="navigateToArtist(${artist.id})" style="cursor: pointer;">
                    <img src="${artistImg}" alt="${artist.name}" onerror="this.src='assets/images/placeholder.png'">
                    <div class="credit-name">${artist.name}</div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    if (hasFeatured) {
        html += '<h4 style="margin-top: 20px;"><i class="fas fa-star"></i> Featured Artists</h4><div class="credits-grid">';
        song.featured_artists.forEach(artist => {
            const artistImg = artist.image_url || 'assets/images/placeholder.png';
            html += `
                <div class="credit-item" onclick="navigateToArtist(${artist.id})" style="cursor: pointer;">
                    <img src="${artistImg}" alt="${artist.name}" onerror="this.src='assets/images/placeholder.png'">
                    <div class="credit-name">${artist.name}</div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

// MAIN LOAD FUNCTION
async function loadSongDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const songId = urlParams.get('id');
    const contentContainer = document.getElementById('songContent');
    
    if (!songId) {
        contentContainer.innerHTML = showError('ID bài hát không hợp lệ. Vui lòng quay lại và thử lại.');
        return;
    }
    
    contentContainer.innerHTML = `
        <div class="loading">
            <div class="spinner-border text-light" role="status"></div>
            <p style="color: var(--text-secondary); margin-top: 20px;">Đang tải thông tin bài hát...</p>
        </div>
    `;
    
    const [details, lyricsData] = await Promise.all([
        fetchAPI('/song/details/', { id: songId }),
        fetchLyrics(songId)
    ]);
    
    if (!details || !details.song) {
        contentContainer.innerHTML = showError('Không thể tải thông tin bài hát. Bài hát có thể không tồn tại hoặc API đang gặp sự cố.');
        return;
    }
    
    const song = details.song;
    
    let html = '';
    
    html += renderSongHeader(song);
    
    html += '<div class="two-column-layout">';
    
    html += '<div class="left-column">';
    html += renderSongDescription(song);
    html += renderCredits(song);
    html += '</div>';
    
    html += '<div class="right-column">';
    if (lyricsData) {
        html += renderLyrics(lyricsData);
    }
    html += '</div>';
    
    html += '</div>';
    
    contentContainer.innerHTML = html;
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', loadSongDetails);

// MOBILE NAVBAR
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".navbar-nav .nav-link").forEach(link => {
        link.addEventListener("click", () => {
            const navCollapse = document.getElementById("navbarNav");
            if (navCollapse && navCollapse.classList.contains("show")) {
                const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
                if (bsCollapse) bsCollapse.hide();
            }
        });
    });
});