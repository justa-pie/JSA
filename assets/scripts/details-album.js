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

function navigateToArtist(artistId) {
    window.location.href = `details-artist.html?id=${artistId}`;
}

function showError(message) {
    return `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 40px; margin: 40px 0; text-align: center;">
            <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ef4444; margin-bottom: 20px;"></i>
            <h2 style="color: #fca5a5; font-weight: 700; margin-bottom: 15px;">Error Loading Album</h2>
            <p style="color: #fca5a5; font-size: 1.1rem;">${message}</p>
            <a href="index.html" class="btn-gradient" style="display: inline-block; margin-top: 20px; text-decoration: none;">
                <i class="fas fa-home"></i> Back to Home
            </a>
        </div>
    `;
}

// ===== Load Album Details =====
async function loadAlbumDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const albumId = urlParams.get('id');
    
    const contentContainer = document.getElementById('albumContent');
    
    if (!albumId) {
        contentContainer.innerHTML = showError('Invalid album ID. Please go back and try again.');
        return;
    }
    
    // Show loading
    contentContainer.innerHTML = `
        <div class="loading">
            <div class="spinner-border text-light" role="status"></div>
            <p style="color: var(--text-secondary); margin-top: 20px;">Loading album details...</p>
        </div>
    `;
    
    const data = await fetchAPI('/album/details/', { id: albumId });
    
    if (!data || !data.album) {
        contentContainer.innerHTML = showError('Failed to load album details. The album may not exist or the API is unavailable.');
        return;
    }
    
    const album = data.album;
    console.log('💿 Album data:', album);
    console.log('🎵 Tracks:', album.tracks);
    console.log('🎵 Track appearances:', album.track_appearances);
    
    const coverImg = album.cover_art_url || '../assets/images/placeholder.png';
    
    let html = `
        <div class="album-detail-header animate-slide-up">
            <img src="${coverImg}" alt="${album.name}" class="album-cover" onerror="this.src='../assets/images/placeholder.png'">
            <div class="album-info">
                <h2>${album.name || 'Unknown Album'}</h2>
                <p style="font-size: 1.2rem; margin-bottom: 10px; cursor: pointer; color: var(--text-secondary);" onclick="navigateToArtist(${album.artist?.id})">
                    <i class="fas fa-user"></i> ${album.artist?.name || 'Unknown Artist'}
                </p>
                ${album.release_date_components ? `
                    <p style="color: var(--text-secondary);"><i class="fas fa-calendar"></i> ${album.release_date_components.day}/${album.release_date_components.month}/${album.release_date_components.year}</p>
                ` : ''}
            </div>
        </div>
    `;
    
    // Try multiple structures for tracks
    let tracks = null;
    
    // Structure 1: album.tracks (array)
    if (album.tracks && Array.isArray(album.tracks) && album.tracks.length > 0) {
        tracks = album.tracks;
    }
    // Structure 2: album.track_appearances (array)
    else if (album.track_appearances && Array.isArray(album.track_appearances) && album.track_appearances.length > 0) {
        tracks = album.track_appearances;
    }
    // Structure 3: album.songs (array)
    else if (album.songs && Array.isArray(album.songs) && album.songs.length > 0) {
        tracks = album.songs.map((song, index) => ({
            number: index + 1,
            song: song
        }));
    }
    
    if (tracks && tracks.length > 0) {
        html += `
            <div class="tracklist animate-slide-up">
                <h3><i class="fas fa-list"></i> Danh sách bài hát (${tracks.length})</h3>
        `;
        
        tracks.forEach((track, index) => {
            // Handle different track structures
            const trackNumber = track.number || (index + 1);
            const song = track.song || track;
            const songId = song.id || song.song_id;
            const songTitle = song.title || song.name || 'Unknown Title';
            const artistName = song.primary_artist?.name || song.artist?.name || '';
            
            html += `
                <div class="track-item" onclick="navigateToSong(${songId})">
                    <div class="track-number">${trackNumber}</div>
                    <div class="track-title">
                        <strong>${songTitle}</strong>
                        ${artistName ? `<div style="font-size: 0.9rem; opacity: 0.8; color: var(--text-secondary);">${artistName}</div>` : ''}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    } else {
        console.warn('⚠️ No tracks found in album data');
        html += `
            <div class="empty-state">
                <i class="fas fa-compact-disc" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.5;"></i>
                <h3>No Tracks Available</h3>
                <p>This album doesn't have track information in the API</p>
            </div>
        `;
    }
    
    contentContainer.innerHTML = html;
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', loadAlbumDetails);