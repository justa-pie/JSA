// ========================================
// API CONFIGURATION
// ========================================
const API_CONFIG = {
    host: 'genius-song-lyrics1.p.rapidapi.com',
    key: '65ecc62e44msh552bb8e1370b20bp1bc025jsne56e1cfa3325',
    baseURL: 'https://genius-song-lyrics1.p.rapidapi.com'
};

// ========================================
// STATE MANAGEMENT
// ========================================
let currentSearchMode = 'song';

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Gọi API với endpoint và parameters
 */
async function fetchAPI(endpoint, params = {}) {
    const url = new URL(`${API_CONFIG.baseURL}${endpoint}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Host': API_CONFIG.host,
                'X-RapidAPI-Key': API_CONFIG.key
            }
        });
        
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return await response.json();
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

// ========================================
// MODE SWITCHING
// ========================================

window.setSearchMode = function(mode) {
    currentSearchMode = mode;
    
    // Update active state
    document.querySelectorAll('.pill-item').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(`'${mode}'`)) {
            btn.classList.add('active');
        }
    });
    
    // Update placeholder
    const input = document.getElementById('searchInput');
    input.placeholder = mode === 'song' 
        ? "Nhập tên bài hát..." 
        : "Tìm bài hát, nghệ sĩ, album...";
};

// ========================================
// SEARCH LOGIC
// ========================================

window.performSearch = async function() {
    const query = document.getElementById('searchInput').value.trim();
    const container = document.getElementById('searchResults');
    
    if (!query) return;

    // Hiển thị loading
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-light"></div></div>';

    if (currentSearchMode === 'song') {
        // Tìm kiếm chỉ bài hát
        const data = await fetchAPI('/search', { q: query });
        if (data && data.hits) {
            displayChartResults(data.hits.map(h => ({...h.result, type: 'song'})), container, 'Kết quả tìm kiếm');
        } else {
            container.innerHTML = '<p class="text-center" style="color: var(--text-secondary); padding: 40px;">Không tìm thấy kết quả.</p>';
        }
    } else {
        // Tìm kiếm nâng cao (tất cả) - ĐÃ SỬA: Bỏ tab "Tất cả"
        const data = await fetchAPI('/search/multi', { q: query });
        if (data && data.sections) {
            displayMultiResults(data.sections, container);
        } else {
            container.innerHTML = '<p class="text-center" style="color: var(--text-secondary); padding: 40px;">Không tìm thấy kết quả.</p>';
        }
    }
};

// ========================================
// DISPLAY FUNCTIONS
// ========================================

/**
 * Tạo item chart-style cho kết quả
 */
function createChartItem(type, id, title, subtitle, img, stats = {}) {
    const navFunc = type === 'song' ? 'navigateToSong' : (type === 'artist' ? 'navigateToArtist' : 'navigateToAlbum');
    const imgClass = type === 'artist' ? 'chart-image artist' : 'chart-image';
    
    return `
        <div class="chart-item animate-slide-up" onclick="${navFunc}(${id})">
            <img src="${img}" class="${imgClass}" onerror="this.src='assets/images/placeholder.png'">
            <div class="chart-info">
                <div class="chart-title">${title}</div>
                <div class="chart-subtitle">${subtitle}</div>
            </div>
            <div class="chart-stats">
                ${stats.views ? `<div class="chart-views"><i class="fas fa-eye"></i> ${formatNumber(stats.views)}</div>` : ''}
                ${stats.hot ? '<span class="badge-hot"><i class="fas fa-fire"></i> HOT</span>' : ''}
                ${!stats.views && !stats.hot ? '<i class="fas fa-chevron-right" style="opacity: 0.2;"></i>' : ''}
            </div>
        </div>
    `;
}

/**
 * Hiển thị kết quả dạng chart (cho search mode "song")
 */
function displayChartResults(results, container, title = '') {
    let html = '';
    
    if (title) {
        html += `<h3 style="color: var(--accent-purple); margin: 30px 0 20px 0; font-size: 1.5rem;"><i class="fas fa-search"></i> ${title}</h3>`;
    }
    
    html += '<div class="chart-list">';
    results.forEach(item => {
        const stats = {
            views: item.stats?.pageviews,
            hot: item.stats?.hot
        };
        html += createChartItem(
            item.type, 
            item.id, 
            item.title || item.name, 
            item.artist_names || item.primary_artist?.name || (item.type === 'artist' ? 'Nghệ sĩ' : ''),
            item.song_art_image_thumbnail_url || item.image_url || item.cover_art_url || 'assets/images/placeholder.png',
            stats
        );
    });
    html += '</div>';
    
    container.innerHTML = html;
}

/**
 * Hiển thị kết quả đa dạng với tabs - ĐÃ SỬA: Bỏ tab "Tất cả"
 */
function displayMultiResults(sections, container) {
    // Chỉ hiển thị 3 tabs: Bài hát, Nghệ sĩ, Album
    let html = `
        <div class="chart-tabs" style="display: flex; gap: 10px; overflow-x: auto; padding: 20px 0 10px 0; justify-content: center; flex-wrap: wrap;">
            <button class="tab-btn active" data-tab-id="song" onclick="switchResultTab('song')">
                <i class="fas fa-music"></i> Bài hát
            </button>
            <button class="tab-btn" data-tab-id="artist" onclick="switchResultTab('artist')">
                <i class="fas fa-user-music"></i> Nghệ sĩ
            </button>
            <button class="tab-btn" data-tab-id="album" onclick="switchResultTab('album')">
                <i class="fas fa-compact-disc"></i> Album
            </button>
        </div>
        <div class="tab-content">
    `;

    // Render 3 tabs: song, artist, album
    ['song', 'artist', 'album'].forEach((type, index) => {
        const section = sections.find(s => s.type === type);
        const activeClass = index === 0 ? 'active' : ''; // Tab đầu tiên (song) là active
        const displayStyle = index === 0 ? 'block' : 'none';

        html += `<div class="tab-content-item ${activeClass}" data-tab-content="${type}" style="display: ${displayStyle};">`;
        
        if (section && section.hits.length > 0) {
            html += '<div class="chart-list">';
            section.hits.forEach(hit => {
                const res = hit.result;
                const title = res.title || res.name || res.full_title;
                const subtitle = res.artist_names || (hit.type === 'artist' ? 'Nghệ sĩ' : '');
                const img = res.song_art_image_thumbnail_url || res.image_url || res.cover_art_url || 'assets/images/placeholder.png';
                const stats = {
                    views: res.stats?.pageviews,
                    hot: res.stats?.hot
                };
                html += createChartItem(hit.type, res.id, title, subtitle, img, stats);
            });
            html += '</div>';
        } else {
            html += '<p class="text-center py-5" style="color: var(--text-secondary);">Không có dữ liệu</p>';
        }
        
        html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
}

// ========================================
// TAB SWITCHING
// ========================================

window.switchResultTab = function(type) {
    // Update button states
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-tab-id="${type}"]`)?.classList.add('active');
    
    // Show/hide content
    document.querySelectorAll('.tab-content-item').forEach(c => c.style.display = 'none');
    const target = document.querySelector(`[data-tab-content="${type}"]`);
    if (target) target.style.display = 'block';
};

// ========================================
// NAVIGATION FUNCTIONS
// ========================================

window.navigateToSong = (id) => { 
    window.location.href = `details-song.html?id=${id}`; 
};

window.navigateToArtist = (id) => { 
    window.location.href = `details-artist.html?id=${id}`; 
};

window.navigateToAlbum = (id) => { 
    window.location.href = `details-album.html?id=${id}`; 
};