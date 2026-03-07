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

// NAVIGATION FUNCTIONS
function navigateToSong(songId) {
    window.location.href = `details-song.html?id=${songId}`;
}

function navigateToAlbum(albumId) {
    window.location.href = `details-album.html?id=${albumId}`;
}

// TAB SWITCHING
function switchArtistTab(tab) {
    // Update button states dựa vào tham số tab, không dùng event.target
    document.querySelectorAll('.artist-tabs button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick')?.includes(`'${tab}'`)) {
            btn.classList.add('active');
        }
    });
    
    document.querySelectorAll('.tab-content-item').forEach(content => {
        content.classList.remove('active');
    });
    
    if (tab === 'songs') {
        document.getElementById('artist-songs-tab').classList.add('active');
    } else {
        document.getElementById('artist-albums-tab').classList.add('active');
    }
}

// RENDER FUNCTIONS
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

function renderArtistBio(artist) {
    let bioText = null;
    
    if (artist.description && artist.description.plain) {
        bioText = artist.description.plain;
        console.log('✅ Found description.plain');
    }
    else if (artist.description && artist.description.html) {
        bioText = artist.description.html.replace(/<[^>]*>/g, '');
        console.log('✅ Found description.html');
    }
    else if (typeof artist.description === 'string' && artist.description.length > 0) {
        bioText = artist.description;
        console.log('✅ Found description as string');
    }
    else if (artist.bio) {
        bioText = typeof artist.bio === 'string' ? artist.bio : (artist.bio.plain || artist.bio.html?.replace(/<[^>]*>/g, ''));
        console.log('✅ Found bio');
    }
    
    if (!bioText || bioText.trim().length === 0) {
        console.warn('⚠️ No bio/description found');
        console.log('Artist data:', artist);
        return '';
    }
    
    return `
        <div class="lyrics-container animate-slide-up">
            <h3><i class="fas fa-info-circle"></i> Tiểu sử</h3>
            <p style="line-height: 1.8; color: var(--text-primary); white-space: pre-wrap;">${bioText}</p>
        </div>
    `;
}

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

// MAIN LOAD FUNCTION

async function loadArtistDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const artistId = urlParams.get('id');
    const contentContainer = document.getElementById('artistContent');
    
    if (!artistId) {
        contentContainer.innerHTML = showError('ID nghệ sĩ không hợp lệ. Vui lòng quay lại và thử lại.');
        return;
    }
    
    contentContainer.innerHTML = `
        <div class="loading">
            <div class="spinner-border text-light" role="status"></div>
            <p style="color: var(--text-secondary); margin-top: 20px;">Đang tải thông tin nghệ sĩ...</p>
        </div>
    `;
    
    const [details, songs, albums] = await Promise.all([
        fetchAPI('/artist/details/', { id: artistId }),
        fetchAPI('/artist/songs/', { id: artistId, sort: 'popularity', per_page: 20 }),
        fetchAPI('/artist/albums/', { id: artistId, per_page: 50 })
    ]);
    
    if (!details || !details.artist) {
        contentContainer.innerHTML = showError('Không thể tải thông tin nghệ sĩ. Nghệ sĩ có thể không tồn tại hoặc API đang gặp sự cố.');
        return;
    }
    
    const artist = details.artist;
    
    let html = '';
    
    html += renderArtistHeader(artist);
    
    html += '<div class="two-column-layout">';
    
    html += '<div class="left-column">';
    html += renderArtistBio(artist);
    html += '</div>';
    
    html += '<div class="right-column">';
    
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
    
    html += '<div id="artist-songs-tab" class="tab-content-item active animate-slide-up">';
    html += renderSongsList(songs?.songs);
    html += '</div>';
    
    html += '<div id="artist-albums-tab" class="tab-content-item">';
    html += renderAlbumsList(albums?.albums);
    html += '</div>';
    
    html += '</div>';
    html += '</div>';
    
    contentContainer.innerHTML = html;
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', loadArtistDetails);

// ========================================
// MOBILE NAVBAR — tự đóng sau khi click
// ========================================
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