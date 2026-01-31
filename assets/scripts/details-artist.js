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

function navigateToSong(songId) {
    window.location.href = `details-song.html?id=${songId}`;
}

function navigateToAlbum(albumId) {
    window.location.href = `details-album.html?id=${albumId}`;
}

function switchArtistTab(tab) {
    document.querySelectorAll('.artist-tabs button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    document.getElementById('artist-songs-tab').classList.remove('active');
    document.getElementById('artist-albums-tab').classList.remove('active');
    
    if (tab === 'songs') {
        document.getElementById('artist-songs-tab').classList.add('active');
    } else {
        document.getElementById('artist-albums-tab').classList.add('active');
    }
}

function showError(message) {
    return `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 40px; margin: 40px 0; text-align: center;">
            <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ef4444; margin-bottom: 20px;"></i>
            <h2 style="color: #fca5a5; font-weight: 700; margin-bottom: 15px;">Error Loading Artist</h2>
            <p style="color: #fca5a5; font-size: 1.1rem;">${message}</p>
            <a href="index.html" class="btn-gradient" style="display: inline-block; margin-top: 20px; text-decoration: none;">
                <i class="fas fa-home"></i> Back to Home
            </a>
        </div>
    `;
}

// ===== Load Artist Details =====
async function loadArtistDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const artistId = urlParams.get('id');
    
    const contentContainer = document.getElementById('artistContent');
    
    if (!artistId) {
        contentContainer.innerHTML = showError('Invalid artist ID. Please go back and try again.');
        return;
    }
    
    // Show loading
    contentContainer.innerHTML = `
        <div class="loading">
            <div class="spinner-border text-light" role="status"></div>
            <p style="color: var(--text-secondary); margin-top: 20px;">Loading artist details...</p>
        </div>
    `;
    
    const [details, songs, albums] = await Promise.all([
        fetchAPI('/artist/details/', { id: artistId }),
        fetchAPI('/artist/songs/', { id: artistId, sort: 'popularity', per_page: 20 }),
        fetchAPI('/artist/albums/', { id: artistId, per_page: 10 })
    ]);
    
    if (!details || !details.artist) {
        contentContainer.innerHTML = showError('Failed to load artist details. The artist may not exist or the API is unavailable.');
        return;
    }
    
    const artist = details.artist;
    const bannerImg = artist.header_image_url || '../assets/images/placeholder.png';
    const avatarImg = artist.image_url || '../assets/images/placeholder.png';
    
    let html = `
        <div class="artist-detail-header animate-slide-up">
            <img src="${bannerImg}" alt="${artist.name}" class="artist-banner" onerror="this.src='../assets/images/placeholder.png'">
            <img src="${avatarImg}" alt="${artist.name}" class="artist-avatar" onerror="this.src='../assets/images/placeholder.png'">
            <h2 class="artist-name">${artist.name || 'Unknown Artist'}</h2>
            
            <div class="social-links">
                ${artist.facebook_name ? `<a href="https://facebook.com/${artist.facebook_name}" target="_blank"><i class="fab fa-facebook"></i></a>` : ''}
                ${artist.instagram_name ? `<a href="https://instagram.com/${artist.instagram_name}" target="_blank"><i class="fab fa-instagram"></i></a>` : ''}
                ${artist.twitter_name ? `<a href="https://twitter.com/${artist.twitter_name}" target="_blank"><i class="fab fa-twitter"></i></a>` : ''}
            </div>
        </div>
    `;
    
    if (artist.description && artist.description.plain) {
        html += `
            <div class="artist-bio animate-slide-up">
                <h3><i class="fas fa-info-circle"></i> Tiểu sử</h3>
                <p style="margin-top: 15px;">${artist.description.plain}</p>
            </div>
        `;
    }
    
    // Tabs for songs and albums
    html += `
        <div class="artist-tabs animate-slide-up">
            <button class="active" onclick="switchArtistTab('songs')">
                <i class="fas fa-music"></i> Bài hát (${songs?.songs?.length || 0})
            </button>
            <button onclick="switchArtistTab('albums')">
                <i class="fas fa-compact-disc"></i> Albums (${albums?.albums?.length || 0})
            </button>
        </div>
    `;
    
    // Songs tab
    html += '<div id="artist-songs-tab" class="tab-content-item active animate-slide-up"><div class="results-grid">';
    if (songs && songs.songs && songs.songs.length > 0) {
        songs.songs.forEach(song => {
            const songImg = song.song_art_image_url || song.header_image_url || '../assets/images/placeholder.png';
            html += `
                <div class="result-card" onclick="navigateToSong(${song.id})">
                    <img src="${songImg}" alt="${song.title}" onerror="this.src='../assets/images/placeholder.png'">
                    <div class="result-card-body">
                        <div class="result-card-title">${song.title}</div>
                    </div>
                </div>
            `;
        });
    } else {
        html += '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">No songs found</p>';
    }
    html += '</div></div>';
    
    // Albums tab
    html += '<div id="artist-albums-tab" class="tab-content-item"><div class="results-grid">';
    if (albums && albums.albums && albums.albums.length > 0) {
        albums.albums.forEach(album => {
            const albumImg = album.cover_art_url || '../assets/images/placeholder.png';
            html += `
                <div class="result-card" onclick="navigateToAlbum(${album.id})">
                    <img src="${albumImg}" alt="${album.name}" onerror="this.src='../assets/images/placeholder.png'">
                    <div class="result-card-body">
                        <div class="result-card-title">${album.name}</div>
                    </div>
                </div>
            `;
        });
    } else {
        html += '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">No albums found</p>';
    }
    html += '</div></div>';
    
    contentContainer.innerHTML = html;
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', loadArtistDetails);