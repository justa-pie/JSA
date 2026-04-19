// API CONFIGURATION
const API_CONFIG = {
    host: 'genius-song-lyrics1.p.rapidapi.com',
    key: 'f405287279msha2ee93f99d91b69p153223jsn9bccd2e5b5b4',
    baseURL: 'https://genius-song-lyrics1.p.rapidapi.com'
};

// STATE MANAGEMENT
let currentChart = 'songs';
let currentTimePeriod = 'day';

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
        const response = await fetch(url, options);
        if (!response.ok) throw new Error('API request failed');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
}

function showLoading(elementId) {
    const element = document.getElementById(elementId);
    element.innerHTML = `
        <div class="loading">
            <div class="spinner-border text-light" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
}

// NAVIGATION FUNCTIONS

function navigateToSong(songId) {
    window.location.href = `../pages/details-song.html?id=${songId}`;
}

function navigateToArtist(artistId) {
    window.location.href = `../pages/details-artist.html?id=${artistId}`;
}

function navigateToAlbum(albumId) {
    window.location.href = `../pages/details-album.html?id=${albumId}`;
}

// FILTER FUNCTIONS
function switchTimePeriod(period) {
    currentTimePeriod = period;
    document.querySelectorAll('.time-period-filter button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-period="${period}"]`).classList.add('active');
    loadChart(currentChart);
}

function switchChart(chart) {
    currentChart = chart;
    
    document.querySelectorAll('.chart-tabs button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-chart="${chart}"]`).classList.add('active');
    
    loadChart(chart);
}

// CHART LOADING
async function loadChart(type) {
    const container = document.getElementById('chartContent');
    showLoading('chartContent');
    
    let endpoint = '';
    if (type === 'songs') endpoint = '/chart/songs/';
    else if (type === 'artists') endpoint = '/chart/artists/';
    else if (type === 'albums') endpoint = '/chart/albums/';
    
    let timeType = 'all';
    if (currentTimePeriod === 'day') timeType = 'day';
    else if (currentTimePeriod === 'week') timeType = 'week';
    else if (currentTimePeriod === 'month') timeType = 'month';
    else if (currentTimePeriod === 'all') timeType = 'all_time';
    
    const params = type === 'songs' 
        ? { per_page: 20, page: 1, time_period: timeType } 
        : { per_page: 10, time_period: timeType };
    
    const data = await fetchAPI(endpoint, params);
    
    if (!data || !data.chart_items || data.chart_items.length === 0) {
        container.innerHTML = '<p style="color: white; text-align: center;">Không có dữ liệu</p>';
        return;
    }
    
    renderChart(data.chart_items, type, container);
}

// CHART RENDERING
function renderChart(chartItems, type, container) {
    let html = '<div class="chart-list">';
    
    chartItems.forEach((chartItem, index) => {
        const item = chartItem.item;
        
        const position = chartItem.chart_position || chartItem.position || (index + 1);
        
        let positionClass = '';
        if (position === 1) positionClass = 'top-1';
        else if (position === 2) positionClass = 'top-2';
        else if (position === 3) positionClass = 'top-3';
        
        if (type === 'songs') {
            html += renderSongItem(item, position, positionClass);
        } else if (type === 'artists') {
            html += renderArtistItem(item, position, positionClass);
        } else if (type === 'albums') {
            html += renderAlbumItem(item, position, positionClass);
        }
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function renderSongItem(item, position, positionClass) {
    return `
        <div class="chart-item" onclick="navigateToSong(${item.id})">
            <div class="chart-position ${positionClass}">${position}</div>
            <img src="${item.song_art_image_url || item.header_image_url}" alt="${item.title}" class="chart-image" onerror="this.src='assets/images/placeholder.png'">
            <div class="chart-info">
                <div class="chart-title">${item.title}</div>
                <div class="chart-subtitle">${item.primary_artist?.name || ''}</div>
            </div>
            <div class="chart-stats">
                <div class="chart-views"><i class="fas fa-eye"></i> ${formatNumber(item.stats?.pageviews || 0)}</div>
                ${item.stats?.hot ? '<span class="badge-hot"><i class="fas fa-fire"></i> HOT</span>' : ''}
            </div>
        </div>
    `;
}

function renderArtistItem(item, position, positionClass) {
    return `
        <div class="chart-item" onclick="navigateToArtist(${item.id})">
            <div class="chart-position ${positionClass}">${position}</div>
            <img src="${item.image_url}" alt="${item.name}" class="chart-image artist" onerror="this.src='assets/images/placeholder.png'">
            <div class="chart-info">
                <div class="chart-title">${item.name}</div>
            </div>
        </div>
    `;
}

function renderAlbumItem(item, position, positionClass) {
    return `
        <div class="chart-item" onclick="navigateToAlbum(${item.id})">
            <div class="chart-position ${positionClass}">${position}</div>
            <img src="${item.cover_art_url}" alt="${item.name}" class="chart-image" onerror="this.src='assets/images/placeholder.png'">
            <div class="chart-info">
                <div class="chart-title">${item.name}</div>
                <div class="chart-subtitle">${item.artist?.name || ''}</div>
            </div>
        </div>
    `;
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', function() {
    loadChart('songs');
});

// MOBILE NAVBAR
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