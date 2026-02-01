// ========================================
// API CONFIGURATION
// ========================================
const API_CONFIG = {
    host: 'genius-song-lyrics1.p.rapidapi.com',
    key: '65ecc62e44msh552bb8e1370b20bp1bc025jsne56e1cfa3325',
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
    const coverImg = album.cover_art_url || 'assets/images/placeholder.png';
    
    return `
        <div class="album-detail-header animate-slide-up">
            <img src="${coverImg}" alt="${album.name}" class="album-cover" onerror="this.src='assets/images/placeholder.png'">
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
 * Render description của album
 */
function renderAlbumDescription(album) {
    console.log('🔍 === SEARCHING FOR ALBUM DESCRIPTION ===');
    console.log('Album object keys:', Object.keys(album));
    
    // Log tất cả các field có thể chứa description
    const possibleFields = [
        'description', 'description_annotation', 'about', 'wiki_description',
        'bio', 'summary', 'overview', 'info'
    ];
    
    console.log('Checking fields:');
    possibleFields.forEach(field => {
        if (album[field]) {
            console.log(`  ✓ ${field}:`, typeof album[field], album[field]);
        } else {
            console.log(`  ✗ ${field}: not found`);
        }
    });
    
    let descText = null;
    
    // Check tất cả các cấu trúc có thể
    if (album.description?.plain) {
        descText = album.description.plain;
        console.log('✅ Using description.plain');
    } else if (album.description?.html) {
        descText = album.description.html.replace(/<[^>]*>/g, '');
        console.log('✅ Using description.html');
    } else if (album.description_annotation?.plain) {
        descText = album.description_annotation.plain;
        console.log('✅ Using description_annotation.plain');
    } else if (album.description_annotation?.html) {
        descText = album.description_annotation.html.replace(/<[^>]*>/g, '');
        console.log('✅ Using description_annotation.html');
    } else if (typeof album.description === 'string' && album.description.length > 0) {
        descText = album.description;
        console.log('✅ Using description (string)');
    } else if (album.about) {
        descText = typeof album.about === 'string' ? album.about : (album.about.plain || album.about.html?.replace(/<[^>]*>/g, ''));
        console.log('✅ Using about');
    } else if (album.wiki_description) {
        descText = typeof album.wiki_description === 'string' ? album.wiki_description : album.wiki_description.plain;
        console.log('✅ Using wiki_description');
    }
    
    if (!descText || descText.trim().length === 0) {
        console.warn('⚠️ === NO DESCRIPTION FOUND ===');
        console.log('ℹ️ API thường không cung cấp description cho albums. Đây là bình thường.');
        return ''; 
    }
    
    console.log('✅ === DESCRIPTION FOUND ===');
    return `
        <div class="lyrics-container animate-slide-up" style="margin-top: 30px;">
            <h3><i class="fas fa-info-circle"></i> Về album</h3>
            <p style="line-height: 1.8; text-align: left; white-space: pre-wrap;">${descText}</p>
        </div>
    `;
}

/**
 * Trích xuất danh sách tracks - DEBUG CỰC KỲ CHI TIẾT
 */
function extractTracks(albumData, tracksData) {
    console.log('🔍 === SEARCHING FOR TRACKS ===');
    console.log('albumData exists:', !!albumData);
    console.log('tracksData exists:', !!tracksData);
    
    if (albumData) {
        console.log('albumData keys:', Object.keys(albumData));
        if (albumData.album) {
            console.log('albumData.album keys:', Object.keys(albumData.album));
        }
    }
    
    if (tracksData) {
        console.log('tracksData keys:', Object.keys(tracksData));
    }
    
    let tracks = null;
    
    // Kiểm tra từng cấu trúc và LOG CHI TIẾT
    const structures = [
        { path: 'tracksData.tracks', getter: () => tracksData?.tracks },
        { path: 'albumData.album.tracks', getter: () => albumData?.album?.tracks },
        { path: 'albumData.album.song_performances', getter: () => albumData?.album?.song_performances },
        { path: 'albumData.album.track_appearances', getter: () => albumData?.album?.track_appearances },
        { path: 'albumData.album.songs', getter: () => albumData?.album?.songs },
        { path: 'albumData.album.performance_tracks', getter: () => albumData?.album?.performance_tracks },
        { path: 'tracksData.album.tracks', getter: () => tracksData?.album?.tracks }
    ];
    
    console.log('Checking structures:');
    structures.forEach(struct => {
        const data = struct.getter();
        if (data && Array.isArray(data)) {
            console.log(`  ✓ ${struct.path}: FOUND (${data.length} items)`);
            if (!tracks) {
                tracks = data;
                console.log(`  → Using ${struct.path}`);
                // Log sample item để xem cấu trúc
                if (data.length > 0) {
                    console.log('  → Sample item:', data[0]);
                    console.log('  → Sample item keys:', Object.keys(data[0]));
                }
            }
        } else {
            console.log(`  ✗ ${struct.path}: not found or not array`);
        }
    });
    
    if (!tracks) {
        console.warn('⚠️ === NO TRACKS FOUND IN ANY STRUCTURE ===');
        console.log('Full albumData:', albumData);
        console.log('Full tracksData:', tracksData);
        return null;
    }
    
    // Xử lý song_performances nếu đó là structure được dùng
    if (albumData?.album?.song_performances && tracks === albumData.album.song_performances) {
        console.log('🔄 Processing song_performances structure');
        tracks = tracks.map(perf => {
            console.log('Performance item:', perf);
            return {
                song: perf.song,
                number: perf.track_number || null
            };
        });
    }
    
    // Xử lý songs array nếu cần thêm track number
    if (albumData?.album?.songs && tracks === albumData.album.songs) {
        console.log('🔄 Processing songs structure (adding track numbers)');
        tracks = tracks.map((song, index) => ({
            number: index + 1,
            song: song
        }));
    }
    
    console.log('✅ === TRACKS EXTRACTED ===');
    console.log('Total tracks:', tracks.length);
    
    return tracks;
}

/**
 * Render danh sách tracks - LOG CHI TIẾT từng track
 */
function renderTracklist(tracks) {
    if (!tracks || tracks.length === 0) {
        return `
            <div class="empty-state" style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                <i class="fas fa-compact-disc" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.5;"></i>
                <h3 style="color: var(--text-primary); margin-bottom: 10px;">Không có danh sách bài hát</h3>
                <p>Album này chưa có thông tin về các bài hát trong API</p>
            </div>
        `;
    }
    
    console.log('🎵 === RENDERING TRACKS ===');
    
    let html = `
        <div class="tracklist animate-slide-up">
            <h3><i class="fas fa-list"></i> Danh sách bài hát (${tracks.length})</h3>
    `;
    
    tracks.forEach((track, index) => {
        console.log(`\n--- Track ${index + 1} ---`);
        console.log('Full track object:', track);
        console.log('Track keys:', Object.keys(track));
        
        // Xử lý nhiều cấu trúc track khác nhau
        const trackNumber = track.number || track.track_number || (index + 1);
        const song = track.song || track;
        
        console.log('Song object:', song);
        console.log('Song keys:', song ? Object.keys(song) : 'null');
        
        const songId = song?.id || song?.song_id || 0;
        const songTitle = song?.title || song?.name || song?.full_title || 'Chưa rõ tên';
        const artistName = song?.primary_artist?.name || song?.artist?.name || song?.artist_names || '';
        const imgUrl = song?.song_art_image_thumbnail_url || song?.song_art_image_url || song?.header_image_thumbnail_url || 'assets/images/placeholder.png';
        
        console.log('Extracted data:');
        console.log('  songId:', songId);
        console.log('  songTitle:', songTitle);
        console.log('  artistName:', artistName);
        console.log('  imgUrl:', imgUrl);
        
        html += `
            <div class="track-item" onclick="navigateToSong(${songId})">
                <div class="track-number">${trackNumber}</div>
                <img src="${imgUrl}" style="width: 45px; height: 45px; border-radius: 8px; object-fit: cover;" onerror="this.src='assets/images/placeholder.png'">
                <div class="track-title">
                    <strong>${songTitle}</strong>
                    ${artistName ? `<div style="font-size: 0.9rem; opacity: 0.8; color: var(--text-secondary);">${artistName}</div>` : ''}
                </div>
                <i class="fas fa-chevron-right" style="opacity: 0.3; margin-left: auto;"></i>
            </div>
        `;
    });
    
    html += '</div>';
    console.log('✅ === TRACKS RENDERED ===');
    
    return html;
}

// ========================================
// MAIN LOAD FUNCTION
// ========================================

async function loadAlbumDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const albumId = urlParams.get('id');
    const contentContainer = document.getElementById('albumContent');
    
    console.log('🚀 === LOADING ALBUM DETAILS ===');
    console.log('Album ID:', albumId);
    
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
    
    // Fetch dữ liệu song song
    const [albumData, tracksData] = await Promise.all([
        fetchAPI('/album/details/', { id: albumId }),
        fetchAPI('/album/tracks/', { id: albumId })
    ]);
    
    // Kiểm tra dữ liệu
    if (!albumData || !albumData.album) {
        contentContainer.innerHTML = showError('Không thể tải thông tin album. Album có thể không tồn tại hoặc API đang gặp sự cố.');
        return;
    }
    
    const album = albumData.album;
    console.log('📦 Album data loaded');
    
    // Trích xuất tracks từ nhiều cấu trúc có thể
    const tracks = extractTracks(albumData, tracksData);
    
    // Build HTML
    let html = '';
    
    // 1. Header
    html += renderAlbumHeader(album);
    
    // 2. Description (nếu có)
    html += renderAlbumDescription(album);
    
    // 3. Tracklist
    html += renderTracklist(tracks);
    
    // Render
    contentContainer.innerHTML = html;
    
    console.log('✅ === ALBUM DETAILS LOADED SUCCESSFULLY ===');
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', loadAlbumDetails);