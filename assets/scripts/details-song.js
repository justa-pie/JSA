// ========================================
// API CONFIGURATION
// ========================================
const API_CONFIG = {
    host: 'genius-song-lyrics1.p.rapidapi.com',
    key: 'f405287279msha2ee93f99d91b69p153223jsn9bccd2e5b5b4',
    baseURL: 'https://genius-song-lyrics1.p.rapidapi.com'
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Gọi API với endpoint và parameters
 */
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

/**
 * Format số lượng views
 */
function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

/**
 * Format thời lượng từ giây sang phút:giây
 */
function formatDuration(seconds) {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Hiển thị thông báo lỗi
 */
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

// ========================================
// LYRICS FUNCTIONS
// ========================================

/**
 * Fetch lyrics từ API
 */
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

// ========================================
// NAVIGATION FUNCTIONS
// ========================================

function navigateToArtist(artistId) {
    window.location.href = `details-artist.html?id=${artistId}`;
}

// ========================================
// RENDER FUNCTIONS
// ========================================

/**
 * Render header của bài hát
 */
function renderSongHeader(song) {
    const imgUrl = song.song_art_image_url || song.header_image_url || 'assets/images/placeholder.png';
    const duration = song.duration || song.duration_ms ? formatDuration(song.duration || Math.floor(song.duration_ms / 1000)) : null;
    
    let statsHTML = '<div class="song-detail-stats">';
    
    // Release date
    if (song.release_date_for_display) {
        statsHTML += `
            <div class="stat-item">
                <div class="stat-value"><i class="fas fa-calendar"></i></div>
                <div class="stat-label">${song.release_date_for_display}</div>
            </div>
        `;
    }
    
    // Duration
    if (duration) {
        statsHTML += `
            <div class="stat-item">
                <div class="stat-value"><i class="fas fa-clock"></i></div>
                <div class="stat-label">${duration}</div>
            </div>
        `;
    }
    
    // Page views
    if (song.stats?.pageviews) {
        statsHTML += `
            <div class="stat-item">
                <div class="stat-value">${formatNumber(song.stats.pageviews)}</div>
                <div class="stat-label">Lượt xem</div>
            </div>
        `;
    }
    
    // Hot badge
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
            <img src="${imgUrl}" alt="${song.title}" class="song-detail-image" onerror="this.src='assets/images/placeholder.png'">
            <h2 class="song-detail-title">${song.full_title || song.title || 'Chưa rõ tên'}</h2>
            <p class="song-detail-artist" onclick="navigateToArtist(${song.primary_artist?.id})" style="cursor: pointer;">
                <i class="fas fa-user"></i> ${song.primary_artist?.name || 'Nghệ sĩ chưa rõ'}
            </p>
            ${statsHTML}
        </div>
    `;
}

/**
 * Render lyrics của bài hát
 */
function renderLyrics(lyricsData) {
    if (!lyricsData || !lyricsData.lyrics || !lyricsData.lyrics.body) {
        return '';
    }
    
    const lyricsBody = lyricsData.lyrics.body;
    
    // Xử lý lyrics - loại bỏ HTML tags và giữ nguyên xuống dòng
    let cleanLyrics = lyricsBody.html || lyricsBody.plain || '';
    
    // Nếu là HTML, convert sang plain text nhưng giữ nguyên format
    if (cleanLyrics.includes('<')) {
        // Chuyển <br> thành xuống dòng
        cleanLyrics = cleanLyrics.replace(/<br\s*\/?>/gi, '\n');
        // Chuyển </p> thành xuống dòng đôi
        cleanLyrics = cleanLyrics.replace(/<\/p>/gi, '\n\n');
        // Loại bỏ tất cả HTML tags còn lại
        cleanLyrics = cleanLyrics.replace(/<[^>]*>/g, '');
        // Decode HTML entities
        cleanLyrics = cleanLyrics
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
    }
    
    // Loại bỏ khoảng trắng thừa nhưng giữ nguyên xuống dòng
    cleanLyrics = cleanLyrics.trim();
    
    return `
        <div class="lyrics-container animate-slide-up">
            <h3><i class="fas fa-music"></i> Lời bài hát</h3>
            <div class="lyrics-text" style="white-space: pre-wrap; line-height: 1.8; color: var(--text-primary);">${cleanLyrics}</div>
        </div>
    `;
}

/**
 * Render description/about của bài hát
 */
function renderSongDescription(song) {
    // Kiểm tra nhiều cấu trúc description
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

/**
 * Render credits (writers, producers, featured artists)
 */
function renderCredits(song) {
    const hasWriters = song.writer_artists && song.writer_artists.length > 0;
    const hasProducers = song.producer_artists && song.producer_artists.length > 0;
    const hasFeatured = song.featured_artists && song.featured_artists.length > 0;
    
    if (!hasWriters && !hasProducers && !hasFeatured) {
        return '';
    }
    
    let html = '<div class="credits-section animate-slide-up">';
    
    // Writers
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
    
    // Producers
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
    
    // Featured Artists
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

// ========================================
// MAIN LOAD FUNCTION
// ========================================

async function loadSongDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const songId = urlParams.get('id');
    const contentContainer = document.getElementById('songContent');
    
    // Kiểm tra ID hợp lệ
    if (!songId) {
        contentContainer.innerHTML = showError('ID bài hát không hợp lệ. Vui lòng quay lại và thử lại.');
        return;
    }
    
    // Hiển thị loading
    contentContainer.innerHTML = `
        <div class="loading">
            <div class="spinner-border text-light" role="status"></div>
            <p style="color: var(--text-secondary); margin-top: 20px;">Đang tải thông tin bài hát...</p>
        </div>
    `;
    
    // Fetch song details và lyrics song song
    const [details, lyricsData] = await Promise.all([
        fetchAPI('/song/details/', { id: songId }),
        fetchLyrics(songId)
    ]);
    
    // Kiểm tra dữ liệu
    if (!details || !details.song) {
        contentContainer.innerHTML = showError('Không thể tải thông tin bài hát. Bài hát có thể không tồn tại hoặc API đang gặp sự cố.');
        return;
    }
    
    const song = details.song;
    
    // Build HTML với layout mới
    let html = '';
    
    // 1. Header (image, title, artist, stats)
    html += renderSongHeader(song);
    
    // 2. Two-column layout: Left (Tiểu sử + Credits) | Right (Lyrics)
    html += '<div class="two-column-layout">';
    
    // Left column: Tiểu sử + Credits
    html += '<div class="left-column">';
    html += renderSongDescription(song); // Tiểu sử ở trên
    html += renderCredits(song); // Credits ở dưới
    html += '</div>';
    
    // Right column: Lyrics
    html += '<div class="right-column">';
    if (lyricsData) {
        html += renderLyrics(lyricsData);
    }
    html += '</div>';
    
    html += '</div>'; // Close two-column-layout
    
    // Render
    contentContainer.innerHTML = html;
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', loadSongDetails);