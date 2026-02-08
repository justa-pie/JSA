// ========================================
// API CONFIGURATION
// ========================================
const API_CONFIG = {
    host: 'genius-song-lyrics1.p.rapidapi.com',
    key: '65ecc62e44msh552bb8e1370b20bp1bc025jsne56e1cfa3325',
    baseURL: 'https://genius-song-lyrics1.p.rapidapi.com'
};

// Placeholder image - simple gradient with music icon
const PLACEHOLDER_IMG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM2NjdlZWEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM3NjRiYTIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0idXJsKCNnKSIvPjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iNjAiPvCfjrU8L3RleHQ+PC9zdmc+';

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
        console.log('✅ API Data received');
        return data;
    } catch (error) {
        console.error('❌ API Error:', error);
        return null;
    }
}

/**
 * Hiển thị thông báo lỗi
 */
function showError(message) {
    return `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 40px; margin: 40px 0; text-align: center;">
            <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ef4444; margin-bottom: 20px;"></i>
            <h2 style="color: #fca5a5; font-weight: 700; margin-bottom: 15px;">Lỗi tải thông tin album</h2>
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

function navigateToArtist(artistId) {
    window.location.href = `details-artist.html?id=${artistId}`;
}

// ========================================
// RENDER FUNCTIONS
// ========================================

/**
 * Render header của album
 */
function renderAlbumHeader(album) {
    const coverImg = album.cover_art_url || PLACEHOLDER_IMG;
    
    return `
        <div class="album-detail-header animate-slide-up">
            <img src="${coverImg}" alt="${album.name}" class="album-cover" onerror="this.src='${PLACEHOLDER_IMG}'">
            <div class="album-info">
                <h2>${album.name || 'Album chưa rõ'}</h2>
                <p style="font-size: 1.2rem; margin-bottom: 10px; cursor: pointer; color: var(--text-secondary);" onclick="navigateToArtist(${album.artist?.id})">
                    <i class="fas fa-user"></i> ${album.artist?.name || 'Nghệ sĩ chưa rõ'}
                </p>
                ${album.release_date_components ? `
                    <p style="color: var(--text-secondary);"><i class="fas fa-calendar"></i> ${album.release_date_components.day}/${album.release_date_components.month}/${album.release_date_components.year}</p>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Render description của album với nút link duy nhất
 */
function renderAlbumDescription(album) {
    console.log('🔍 Checking for album description');
    
    // Ưu tiên description_preview từ API
    let descText = album.description_preview || album.description || null;
    
    if (!descText || descText.trim().length === 0) {
        console.log('⚠️ No description available');
        // Nếu không có description, chỉ hiển thị nút link
        return album.url ? `
            <div class="lyrics-container animate-slide-up" style="margin-top: 30px; text-align: center;">
                <a href="${album.url}" target="_blank" class="btn-gradient" style="display: inline-flex; align-items: center; gap: 10px; text-decoration: none;">
                    <i class="fas fa-external-link-alt"></i>
                    Xem đầy đủ album trên Genius
                </a>
            </div>
        ` : '';
    }
    
    console.log('✅ Description found');
    return `
        <div class="lyrics-container animate-slide-up" style="margin-top: 30px;">
            <h3><i class="fas fa-info-circle"></i> Về album</h3>
            <p style="line-height: 1.8; text-align: left; white-space: pre-wrap;">${descText}</p>
            ${album.url ? `
                <div style="text-align: center; margin-top: 25px;">
                    <a href="${album.url}" target="_blank" class="btn-gradient" style="display: inline-flex; align-items: center; gap: 10px; text-decoration: none;">
                        <i class="fas fa-external-link-alt"></i>
                        Xem đầy đủ album trên Genius
                    </a>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Bỏ function renderNoTracks - không cần nữa
 */

// ========================================
// MAIN LOAD FUNCTION
// ========================================

async function loadAlbumDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const albumId = urlParams.get('id');
    const contentContainer = document.getElementById('albumContent');
    
    console.log('🚀 Loading album details for ID:', albumId);
    
    // Kiểm tra ID hợp lệ
    if (!albumId) {
        contentContainer.innerHTML = showError('ID album không hợp lệ. Vui lòng quay lại và thử lại.');
        return;
    }
    
    // Hiển thị loading
    contentContainer.innerHTML = `
        <div class="loading">
            <div class="spinner-border text-light" role="status"></div>
            <p style="color: var(--text-secondary); margin-top: 20px;">Đang tải thông tin album...</p>
        </div>
    `;
    
    // Fetch album data
    const albumData = await fetchAPI('/album/details/', { id: albumId });
    
    // Kiểm tra dữ liệu
    if (!albumData || !albumData.album) {
        contentContainer.innerHTML = showError('Không thể tải thông tin album. Album có thể không tồn tại hoặc API đang gặp sự cố.');
        return;
    }
    
    const album = albumData.album;
    console.log('📦 Album data loaded:', album.name);
    
    // Build HTML - layout đồng bộ với artist và song
    let html = '';
    
    // 1. Header (cover, title, artist, release date)
    html += renderAlbumHeader(album);
    
    // 2. Description + nút Genius (nếu có)
    html += renderAlbumDescription(album);
    
    // Render
    contentContainer.innerHTML = html;
    
    console.log('✅ Album details loaded successfully');
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', loadAlbumDetails);