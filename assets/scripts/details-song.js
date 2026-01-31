// ===== API Configuration =====
const API_CONFIG = {
    host: 'genius-song-lyrics1.p.rapidapi.com',
    key: '268afb6dadmsh8966c28e919fb8cp147776jsnb2d41662650e',
    baseURL: 'https://genius-song-lyrics1.p.rapidapi.com'
};

// ===== Utility Functions =====
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

function navigateToArtist(artistId) {
    window.location.href = `details-artist.html?id=${artistId}`;
}

function showError(message) {
    return `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 40px; margin: 40px 0; text-align: center;">
            <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ef4444; margin-bottom: 20px;"></i>
            <h2 style="color: #fca5a5; font-weight: 700; margin-bottom: 15px;">Error Loading Song</h2>
            <p style="color: #fca5a5; font-size: 1.1rem;">${message}</p>
            <a href="index.html" class="btn-gradient" style="display: inline-block; margin-top: 20px; text-decoration: none;">
                <i class="fas fa-home"></i> Back to Home
            </a>
        </div>
    `;
}

// ===== Load Song Details =====
async function loadSongDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const songId = urlParams.get('id');
    
    const contentContainer = document.getElementById('songContent');
    
    if (!songId) {
        contentContainer.innerHTML = showError('Invalid song ID. Please go back and try again.');
        return;
    }
    
    // Show loading
    contentContainer.innerHTML = `
        <div class="loading">
            <div class="spinner-border text-light" role="status"></div>
            <p style="color: var(--text-secondary); margin-top: 20px;">Loading song details...</p>
        </div>
    `;
    
    // Fetch song details and lyrics in parallel
    const [details, lyrics] = await Promise.all([
        fetchAPI('/song/details/', { id: songId }),
        fetchAPI('/song/lyrics/', { id: songId })
    ]);
    
    if (!details || !details.song) {
        contentContainer.innerHTML = showError('Failed to load song details. The song may not exist or the API is unavailable.');
        return;
    }
    
    const song = details.song;
    const imgUrl = song.song_art_image_url || song.header_image_url || '../assets/images/placeholder.png';
    
    let html = `
        <div class="song-detail-header animate-slide-up">
            <img src="${imgUrl}" alt="${song.title}" class="song-detail-image" onerror="this.src='../assets/images/placeholder.png'">
            <h2 class="song-detail-title">${song.full_title || song.title || 'Unknown Title'}</h2>
            <p class="song-detail-artist" onclick="navigateToArtist(${song.primary_artist?.id})" style="cursor: pointer;">
                <i class="fas fa-user"></i> ${song.primary_artist?.name || 'Unknown Artist'}
            </p>
            
            <div class="song-detail-stats">
                ${song.release_date_for_display ? `
                    <div class="stat-item">
                        <div class="stat-value"><i class="fas fa-calendar"></i></div>
                        <div class="stat-label">${song.release_date_for_display}</div>
                    </div>
                ` : ''}
                ${song.stats?.pageviews ? `
                    <div class="stat-item">
                        <div class="stat-value">${formatNumber(song.stats.pageviews)}</div>
                        <div class="stat-label">Views</div>
                    </div>
                ` : ''}
                ${song.stats?.hot ? `
                    <div class="stat-item">
                        <span class="badge-hot"><i class="fas fa-fire"></i> TRENDING</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Debug lyrics structure
    console.log('🎵 Lyrics Response:', lyrics);
    
    // Lyrics Section - TRY MULTIPLE STRUCTURES
    let lyricsText = null;
    
    if (lyrics) {
        // Try structure 1: lyrics.lyrics.lyrics.body.plain
        if (lyrics.lyrics?.lyrics?.body?.plain) {
            lyricsText = lyrics.lyrics.lyrics.body.plain;
        }
        // Try structure 2: lyrics.lyrics.plain
        else if (lyrics.lyrics?.plain) {
            lyricsText = lyrics.lyrics.plain;
        }
        // Try structure 3: lyrics.plain
        else if (lyrics.plain) {
            lyricsText = lyrics.plain;
        }
        // Try structure 4: lyrics.lyrics (direct text)
        else if (typeof lyrics.lyrics === 'string') {
            lyricsText = lyrics.lyrics;
        }
    }
    
    if (lyricsText) {
        html += `
            <div class="lyrics-container animate-slide-up">
                <h3><i class="fas fa-align-left"></i> Lời bài hát</h3>
                <div class="lyrics-text">${lyricsText}</div>
            </div>
        `;
    } else {
        console.warn('⚠️ Lyrics not found in response');
        html += `
            <div class="lyrics-container animate-slide-up">
                <h3><i class="fas fa-align-left"></i> Lời bài hát</h3>
                <p style="text-align: center; color: var(--text-secondary); padding: 30px;">
                    <i class="fas fa-music-slash" style="font-size: 3rem; margin-bottom: 15px; display: block;"></i>
                    Lời bài hát chưa có sẵn
                </p>
            </div>
        `;
    }
    
    // Credits Section
    if (song.writer_artists || song.producer_artists || song.featured_artists) {
        html += '<div class="credits-section animate-slide-up">';
        
        if (song.writer_artists && song.writer_artists.length > 0) {
            html += '<h4><i class="fas fa-pen"></i> Nhạc sĩ</h4><div class="credits-grid">';
            song.writer_artists.forEach(artist => {
                const artistImg = artist.image_url || '../assets/images/placeholder.png';
                html += `
                    <div class="credit-item" onclick="navigateToArtist(${artist.id})" style="cursor: pointer;">
                        <img src="${artistImg}" alt="${artist.name}" onerror="this.src='../assets/images/placeholder.png'">
                        <div class="credit-name">${artist.name}</div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        if (song.producer_artists && song.producer_artists.length > 0) {
            html += '<h4 style="margin-top: 20px;"><i class="fas fa-sliders-h"></i> Producer</h4><div class="credits-grid">';
            song.producer_artists.forEach(artist => {
                const artistImg = artist.image_url || '../assets/images/placeholder.png';
                html += `
                    <div class="credit-item" onclick="navigateToArtist(${artist.id})" style="cursor: pointer;">
                        <img src="${artistImg}" alt="${artist.name}" onerror="this.src='../assets/images/placeholder.png'">
                        <div class="credit-name">${artist.name}</div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        if (song.featured_artists && song.featured_artists.length > 0) {
            html += '<h4 style="margin-top: 20px;"><i class="fas fa-star"></i> Featured Artists</h4><div class="credits-grid">';
            song.featured_artists.forEach(artist => {
                const artistImg = artist.image_url || '../assets/images/placeholder.png';
                html += `
                    <div class="credit-item" onclick="navigateToArtist(${artist.id})" style="cursor: pointer;">
                        <img src="${artistImg}" alt="${artist.name}" onerror="this.src='../assets/images/placeholder.png'">
                        <div class="credit-name">${artist.name}</div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        html += '</div>';
    }
    
    // Description
    if (song.description && song.description.plain) {
        html += `
            <div class="lyrics-container animate-slide-up" style="margin-top: 30px;">
                <h3><i class="fas fa-info-circle"></i> Về bài hát</h3>
                <p style="line-height: 1.8; text-align: left;">${song.description.plain}</p>
            </div>
        `;
    }
    
    contentContainer.innerHTML = html;
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', loadSongDetails);