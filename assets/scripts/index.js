// ===== API Configuration =====
const API_CONFIG = {
    host: 'genius-song-lyrics1.p.rapidapi.com',
    key: '268afb6dadmsh8966c28e919fb8cp147776jsnb2d41662650e',
    baseURL: 'https://genius-song-lyrics1.p.rapidapi.com'
};

// ===== State Management =====
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
    
    // Cập nhật giao diện Pills
    document.querySelectorAll('.pill-item').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(`'${mode}'`)) {
            btn.classList.add('active');
        }
    });

    const input = document.getElementById('searchInput');
    input.placeholder = mode === 'song' ? "Tìm nhanh tên bài hát..." : "Tìm tất cả nghệ sĩ, album, bài hát...";
    document.getElementById('searchResults').innerHTML = '';
};

// ===== Search Core =====
window.performSearch = async function() {
    const query = document.getElementById('searchInput').value.trim();
    const container = document.getElementById('searchResults');

    if (!query) return;

    container.innerHTML = `<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>`;

    if (currentSearchMode === 'song') {
        const data = await fetchAPI('/search/', { q: query, per_page: 12 });
        if (!data || !data.hits) {
            container.innerHTML = '<p class="text-center">Lỗi kết nối API.</p>';
            return;
        }
        renderResults(data.hits.map(h => ({...h.result, _type: 'song'})), container);
    } else {
        const data = await fetchAPI('/search/multi/', { q: query, per_page: 5 });
        if (!data || !data.sections) {
            container.innerHTML = '<p class="text-center">Dữ liệu Advanced không khả dụng.</p>';
            return;
        }
        renderAdvanced(data, container);
    }
};

// ===== Render Logic =====

function renderResults(items, container) {
    if (items.length === 0) {
        container.innerHTML = '<p class="text-center">Không tìm thấy kết quả.</p>';
        return;
    }
    let html = '<div class="results-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; padding: 20px 0;">';
    items.forEach(item => {
        html += createCard(item);
    });
    html += '</div>';
    container.innerHTML = html;
}

function renderAdvanced(data, container) {
    const validSections = data.sections.filter(s => s.hits && s.hits.length > 0);
    
    let tabsHtml = '<div class="result-tabs" style="display: flex; justify-content: center; gap: 10px; margin: 20px 0; flex-wrap: wrap;">';
    let contentHtml = '<div>';

    validSections.forEach((section, index) => {
        const isActive = index === 0 ? 'active' : '';
        const display = index === 0 ? 'grid' : 'none';
        
        tabsHtml += `<button class="tab-btn ${isActive}" onclick="switchResultTab('${section.type}')" data-tab-id="${section.type}">${section.type.toUpperCase()}</button>`;
        
        contentHtml += `<div class="tab-content-item" data-tab-content="${section.type}" style="display: ${display}; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px;">`;
        section.hits.forEach(hit => {
            // Ép kiểu để hàm createCard nhận diện đúng loại dựa trên section
            const item = hit.result;
            if (!item._type) item._type = section.type === 'top_hit' ? hit.index : section.type;
            contentHtml += createCard(item);
        });
        contentHtml += '</div>';
    });

    container.innerHTML = tabsHtml + '</div>' + contentHtml + '</div>';
}

function createCard(item) {
    const id = item.id;
    const type = item._type || 'song'; // Mặc định là bài hát
    const title = item.title || item.name || 'Unknown';
    const subtitle = item.primary_artist?.name || item.artist_names || (type === 'artist' ? 'Artist' : '');
    const img = item.song_art_image_thumbnail_url || item.image_url || item.cover_art_thumbnail_url;

    // QUAN TRỌNG: Đây là logic điều hướng dựa trên loại dữ liệu
    let navFunc = 'navigateToSong';
    if (type === 'artist') navFunc = 'navigateToArtist';
    if (type === 'album') navFunc = 'navigateToAlbum';

    return `
        <div class="result-card" onclick="${navFunc}(${id})" style="cursor: pointer; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 15px; text-align: center;">
            <img src="${img}" style="width: 100%; aspect-ratio: 1/1; object-fit: cover; border-radius: ${type === 'artist' ? '50%' : '12px'}; margin-bottom: 10px;" onerror="this.src='https://via.placeholder.com/300'">
            <div style="font-weight: bold; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</div>
            <div style="font-size: 0.8rem; color: #9ca3af;">${subtitle}</div>
        </div>
    `;
}

// ===== Global Helpers =====

window.switchResultTab = function(type) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-tab-id="${type}"]`)?.classList.add('active');
    document.querySelectorAll('.tab-content-item').forEach(c => c.style.display = 'none');
    document.querySelector(`[data-tab-content="${type}"]`).style.display = 'grid';
};

window.navigateToSong = (id) => { window.location.href = `details-song.html?id=${id}`; };
window.navigateToArtist = (id) => { window.location.href = `details-artist.html?id=${id}`; };
window.navigateToAlbum = (id) => { window.location.href = `details-album.html?id=${id}`; };

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
});