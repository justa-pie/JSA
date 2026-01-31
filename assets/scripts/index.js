// ===== API Configuration =====
const API_CONFIG = {
    host: 'genius-song-lyrics1.p.rapidapi.com',
    key: '268afb6dadmsh8966c28e919fb8cp147776jsnb2d41662650e', // Đảm bảo Key này còn hoạt động
    baseURL: 'https://genius-song-lyrics1.p.rapidapi.com'
};

let currentSearchMode = 'song'; 

// ===== Utility Functions =====
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

// ===== Mode Switching =====
window.setSearchMode = function(mode) {
    currentSearchMode = mode;
    document.querySelectorAll('.pill-item').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(`'${mode}'`)) btn.classList.add('active');
    });
    const input = document.getElementById('searchInput');
    input.placeholder = mode === 'song' ? "Nhập tên bài hát..." : "Tìm bài hát, nghệ sĩ, album...";
};

// ===== Search Logic =====
window.performSearch = async function() {
    const query = document.getElementById('searchInput').value.trim();
    const container = document.getElementById('searchResults');
    
    if (!query) return;

    // Hiển thị loading
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-light"></div></div>';

    if (currentSearchMode === 'song') {
        const data = await fetchAPI('/search', { q: query });
        if (data && data.hits) {
            displayListResults(data.hits.map(h => ({...h.result, type: 'song'})), container);
        } else {
            container.innerHTML = '<p class="text-center">Không tìm thấy kết quả.</p>';
        }
    } else {
        const data = await fetchAPI('/search/multi', { q: query });
        if (data && data.sections) {
            displayMultiResults(data.sections, container);
        }
    }
};

function createResultCard(type, id, title, subtitle, img) {
    const navFunc = type === 'song' ? 'navigateToSong' : (type === 'artist' ? 'navigateToArtist' : 'navigateToAlbum');
    const imgClass = type === 'artist' ? 'chart-image artist' : 'chart-image';
    
    return `
        <div class="chart-item animate-slide-up" onclick="${navFunc}(${id})" style="width: 100%; display: flex; align-items: center; margin-bottom: 10px;">
            <div class="chart-info" style="display: flex; align-items: center; width: 100%; gap: 15px;">
                <img src="${img}" class="${imgClass}" style="width: 50px; height: 50px; flex-shrink: 0;" onerror="this.src='https://via.placeholder.com/300'">
                <div style="flex-grow: 1; min-width: 0;">
                    <div class="chart-title" style="margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</div>
                    <div class="chart-subtitle" style="margin: 0;">${subtitle}</div>
                </div>
                <i class="fas fa-chevron-right" style="opacity: 0.2;"></i>
            </div>
        </div>
    `;
}

function displayListResults(results, container) {
    let html = '<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">';
    results.forEach(item => {
        html += createResultCard(item.type, item.id, item.title, item.artist_names, item.song_art_image_thumbnail_url);
    });
    html += '</div>';
    container.innerHTML = html;
}

function displayMultiResults(sections, container) {
    let html = `
        <div class="chart-tabs mt-4" style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px;">
            <button class="tab-btn active" data-tab-id="top" onclick="switchResultTab('top')">Tất cả</button>
            <button class="tab-btn" data-tab-id="song" onclick="switchResultTab('song')">Bài hát</button>
            <button class="tab-btn" data-tab-id="artist" onclick="switchResultTab('artist')">Nghệ sĩ</button>
            <button class="tab-btn" data-tab-id="album" onclick="switchResultTab('album')">Album</button>
        </div>
        <div class="tab-content mt-3">
    `;

    ['top', 'song', 'artist', 'album'].forEach(type => {
        const section = sections.find(s => s.type === type);
        const activeClass = type === 'top' ? 'active' : '';
        const displayStyle = type === 'top' ? 'flex' : 'none';

        html += `<div class="tab-content-item ${activeClass}" data-tab-content="${type}" style="display: ${displayStyle}; flex-direction: column; gap: 10px;">`;
        if (section && section.hits.length > 0) {
            section.hits.forEach(hit => {
                const res = hit.result;
                const title = res.title || res.name || res.full_title;
                const subtitle = res.artist_names || (hit.type === 'artist' ? 'Nghệ sĩ' : '');
                const img = res.song_art_image_thumbnail_url || res.image_url || res.cover_art_url;
                html += createResultCard(hit.type, res.id, title, subtitle, img);
            });
        } else {
            html += '<p class="text-center py-4">Không có dữ liệu</p>';
        }
        html += '</div>';
    });

    container.innerHTML = html + '</div>';
}

// ===== Global Helpers =====
window.switchResultTab = function(type) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-tab-id="${type}"]`)?.classList.add('active');
    document.querySelectorAll('.tab-content-item').forEach(c => c.style.display = 'none');
    const target = document.querySelector(`[data-tab-content="${type}"]`);
    if (target) target.style.display = 'flex';
};

window.navigateToSong = (id) => { window.location.href = `details-song.html?id=${id}`; };
window.navigateToArtist = (id) => { window.location.href = `details-artist.html?id=${id}`; };
window.navigateToAlbum = (id) => { window.location.href = `details-album.html?id=${id}`; };