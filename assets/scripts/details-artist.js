// ========================================
// API CONFIGURATION
// ========================================
const API_CONFIG = {
    host: 'genius-song-lyrics1.p.rapidapi.com',
    key: '3dc5636b7amsh5e270d52d86cf8ap1509d6jsn2aacc81b2040',
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
 * Hiển thị thông báo lỗi
 */
function showError(message) {
    return `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 40px; margin: 40px 0; text-align: center;">
            <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ef4444; margin-bottom: 20px;"></i>
            <h2 style="color: #fca5a5; font-weight: 700; margin-bottom: 15px;">Lỗi tải thông tin nghệ sĩ</h2>
            <p style="color: #fca5a5; font-size: 1.1rem;">${message}</p>
            <a href="index.html" class="btn-gradient" style="display: inline-block; margin-top: 20px; text-decoration: none;">
                <i class="fas fa-home"></i> Về trang chủ
            </a>
        </div>
    `;
}

// ========================================
// NAVIGATION FUNCTIONS
// ========================================

function navigateToSong(songId) {
    window.location.href = `details-song.html?id=${songId}`;
}

function navigateToAlbum(albumId) {
    window.location.href = `details-album.html?id=${albumId}`;
}

// ========================================
// TAB SWITCHING
// ========================================

function switchArtistTab(tab) {
    // Cập nhật active state cho buttons
    document.querySelectorAll('.artist-tabs button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Ẩn tất cả tab content
    document.querySelectorAll('.tab-content-item').forEach(content => {
        content.classList.remove('active');
    });
    
    // Hiển thị tab được chọn
    if (tab === 'songs') {
        document.getElementById('artist-songs-tab').classList.add('active');
    } else {
        document.getElementById('artist-albums-tab').classList.add('active');
    }
}

// ========================================
// RENDER FUNCTIONS
// ========================================

/**
 * Render header của artist
 */
function renderArtistHeader(artist) {
    const bannerImg = artist.header_image_url || 'assets/images/placeholder.png';
    const avatarImg = artist.image_url || 'assets/images/placeholder.png';
    
    return `
        <div class="artist-detail-header animate-slide-up">
            <img src="${bannerImg}" alt="${artist.name}" class="artist-banner" onerror="this.src='assets/images/placeholder.png'">
            <img src="${avatarImg}" alt="${artist.name}" class="artist-avatar" onerror="this.src='assets/images/placeholder.png'">
            <h2 class="artist-name">${artist.name || 'Nghệ sĩ chưa rõ'}</h2>
            
            <div class="social-links">
                ${artist.facebook_name ? `<a href="https://facebook.com/${artist.facebook_name}" target="_blank"><i class="fab fa-facebook"></i></a>` : ''}
                ${artist.instagram_name ? `<a href="https://instagram.com/${artist.instagram_name}" target="_blank"><i class="fab fa-instagram"></i></a>` : ''}
                ${artist.twitter_name ? `<a href="https://twitter.com/${artist.twitter_name}" target="_blank"><i class="fab fa-twitter"></i></a>` : ''}
            </div>
        </div>
    `;
}

/**
 * Render tiểu sử nghệ sĩ - ĐÃ SỬA: Không dùng sidebar, dùng container bình thường
 */
function renderArtistBio(artist) {
    // Kiểm tra nhiều cấu trúc có thể có của description
    let bioText = null;
    
    // Cấu trúc 1: artist.description.plain
    if (artist.description && artist.description.plain) {
        bioText = artist.description.plain;
        console.log('✅ Found description.plain');
    }
    // Cấu trúc 2: artist.description.html (loại bỏ HTML tags)
    else if (artist.description && artist.description.html) {
        bioText = artist.description.html.replace(/<[^>]*>/g, '');
        console.log('✅ Found description.html');
    }
    // Cấu trúc 3: artist.description là string trực tiếp
    else if (typeof artist.description === 'string' && artist.description.length > 0) {
        bioText = artist.description;
        console.log('✅ Found description as string');
    }
    // Cấu trúc 4: artist.bio
    else if (artist.bio) {
        bioText = typeof artist.bio === 'string' ? artist.bio : (artist.bio.plain || artist.bio.html?.replace(/<[^>]*>/g, ''));
        console.log('✅ Found bio');
    }
    
    if (!bioText || bioText.trim().length === 0) {
        console.warn('⚠️ No bio/description found');
        console.log('Artist data:', artist);
        return ''; // Không hiển thị gì nếu không có bio
    }
    
    // ĐÃ SỬA: Không dùng grid layout, dùng container bình thường
    return `
        <div class="lyrics-container animate-slide-up" style="margin: 30px auto;">
            <h3><i class="fas fa-info-circle"></i> Tiểu sử</h3>
            <p style="line-height: 1.8; color: var(--text-primary); white-space: pre-wrap;">${bioText}</p>
        </div>
    `;
}

/**
 * Render danh sách bài hát
 */
function renderSongsList(songs) {
    if (!songs || songs.length === 0) {
        return '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Không tìm thấy bài hát</p>';
    }
    
    let html = '<div class="chart-list">';
    
    songs.forEach((song, index) => {
        const songImg = song.song_art_image_thumbnail_url || song.song_art_image_url || 'assets/images/placeholder.png';
        const position = index + 1;
        let positionClass = '';
        
        if (position === 1) positionClass = 'top-1';
        else if (position === 2) positionClass = 'top-2';
        else if (position === 3) positionClass = 'top-3';
        
        html += `
            <div class="chart-item" onclick="navigateToSong(${song.id})">
                <div class="chart-position ${positionClass}">${position}</div>
                <img src="${songImg}" class="chart-image" onerror="this.src='assets/images/placeholder.png'">
                <div class="chart-info">
                    <div class="chart-title">${song.title || 'Chưa rõ tên'}</div>
                    <div class="chart-subtitle">${song.artist_names || ''}</div>
                </div>
                <div class="chart-stats">
                    ${song.stats?.pageviews ? `<div class="chart-views"><i class="fas fa-eye"></i> ${formatNumber(song.stats.pageviews)}</div>` : ''}
                    ${song.stats?.hot ? '<span class="badge-hot"><i class="fas fa-fire"></i> HOT</span>' : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

/**
 * Render danh sách albums
 */
function renderAlbumsList(albums) {
    if (!albums || albums.length === 0) {
        return '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Không tìm thấy album</p>';
    }
    
    let html = '<div class="chart-list">';
    
    albums.forEach((album, index) => {
        const albumImg = album.cover_art_url || 'assets/images/placeholder.png';
        const position = index + 1;
        
        html += `
            <div class="chart-item" onclick="navigateToAlbum(${album.id})">
                <div class="chart-position" style="min-width: 40px; font-size: 1.2rem;">${position}</div>
                <img src="${albumImg}" class="chart-image" onerror="this.src='assets/images/placeholder.png'">
                <div class="chart-info">
                    <div class="chart-title">${album.name || 'Chưa rõ tên'}</div>
                    <div class="chart-subtitle">${album.release_date_components?.year || ''}</div>
                </div>
                <i class="fas fa-chevron-right" style="opacity: 0.2; margin-left: auto;"></i>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// ========================================
// MAIN LOAD FUNCTION
// ========================================

async function loadArtistDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const artistId = urlParams.get('id');
    const contentContainer = document.getElementById('artistContent');
    
    // Kiểm tra ID hợp lệ
    if (!artistId) {
        contentContainer.innerHTML = showError('ID nghệ sĩ không hợp lệ. Vui lòng quay lại và thử lại.');
        return;
    }
    
    // Hiển thị loading
    contentContainer.innerHTML = `
        <div class="loading">
            <div class="spinner-border text-light" role="status"></div>
            <p style="color: var(--text-secondary); margin-top: 20px;">Đang tải thông tin nghệ sĩ...</p>
        </div>
    `;
    
    // Fetch dữ liệu song song
    const [details, songs, albums] = await Promise.all([
        fetchAPI('/artist/details/', { id: artistId }),
        fetchAPI('/artist/songs/', { id: artistId, sort: 'popularity', per_page: 20 }),
        fetchAPI('/artist/albums/', { id: artistId, per_page: 50 })
    ]);
    
    // Kiểm tra dữ liệu
    if (!details || !details.artist) {
        contentContainer.innerHTML = showError('Không thể tải thông tin nghệ sĩ. Nghệ sĩ có thể không tồn tại hoặc API đang gặp sự cố.');
        return;
    }
    
    const artist = details.artist;
    
    // Build HTML - ĐÃ SỬA: Layout đơn giản hơn, không dùng grid
    let html = '';
    
    // 1. Header
    html += renderArtistHeader(artist);
    
    // 2. Biography (nếu có) - không dùng sidebar
    html += renderArtistBio(artist);
    
    // 3. Tabs
    html += `
        <div class="artist-tabs animate-slide-up">
            <button class="active" onclick="switchArtistTab('songs')">
                <i class="fas fa-music"></i> Top ${songs?.songs?.length || 0} Bài hát
            </button>
            <button onclick="switchArtistTab('albums')">
                <i class="fas fa-compact-disc"></i> Albums - ${albums?.albums?.length || 0}
            </button>
        </div>
    `;
    
    // 4. Songs tab
    html += '<div id="artist-songs-tab" class="tab-content-item active animate-slide-up">';
    html += renderSongsList(songs?.songs);
    html += '</div>';
    
    // 5. Albums tab
    html += '<div id="artist-albums-tab" class="tab-content-item">';
    html += renderAlbumsList(albums?.albums);
    html += '</div>';
    
    // Render
    contentContainer.innerHTML = html;
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', loadArtistDetails);