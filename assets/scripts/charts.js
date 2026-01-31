// ===== API Configuration =====
const API_CONFIG = {
    host: 'genius-song-lyrics1.p.rapidapi.com',
    key: '268afb6dadmsh8966c28e919fb8cp147776jsnb2d41662650e',
    baseURL: 'https://genius-song-lyrics1.p.rapidapi.com'
};

// ===== State Management =====
let currentChart = 'songs';
let currentTimePeriod = 'day';

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

// ===== Navigation =====
function navigateToSong(songId) {
    window.location.href = `details-song.html?id=${songId}`;
}

function navigateToArtist(artistId) {
    window.location.href = `details-artist.html?id=${artistId}`;
}

function navigateToAlbum(albumId) {
    window.location.href = `details-album.html?id=${albumId}`;
}

// ===== Time Period Filter =====
function switchTimePeriod(period) {
    currentTimePeriod = period;
    
    // Update button states
    document.querySelectorAll('.time-period-filter button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-period="${period}"]`).classList.add('active');
    
    // Reload chart with new time period
    loadChart(currentChart);
}

// ===== Charts Functions =====
function switchChart(chart) {
    currentChart = chart;
    
    // Update button states
    document.querySelectorAll('.chart-tabs button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-chart="${chart}"]`).classList.add('active');
    
    // Load chart data
    loadChart(chart);
}

async function loadChart(type) {
    const container = document.getElementById('chartContent');
    showLoading('chartContent');
    
    let endpoint = '';
    if (type === 'songs') endpoint = '/chart/songs/';
    else if (type === 'artists') endpoint = '/chart/artists/';
    else if (type === 'albums') endpoint = '/chart/albums/';
    
    // Map time period to API parameter
    let timeType = 'all';
    if (currentTimePeriod === 'day') timeType = 'day';
    else if (currentTimePeriod === 'week') timeType = 'week';
    else if (currentTimePeriod === 'month') timeType = 'month';
    else if (currentTimePeriod === 'all') timeType = 'all_time';
    
    const params = type === 'songs' 
        ? { per_page: 20, page: 1, time_period: timeType, type: timeType } 
        : { per_page: 10, time_period: timeType };
    
    const data = await fetchAPI(endpoint, params);
    
    if (!data || !data.chart_items || data.chart_items.length === 0) {
        container.innerHTML = '<p style="color: white; text-align: center;">Không có dữ liệu</p>';
        return;
    }
    
    let html = '<div class="chart-list">';
    
    data.chart_items.forEach((chartItem, index) => {
        const item = chartItem.item;
        // Debug: log để xem cấu trúc dữ liệu
        console.log('Chart Item:', chartItem);
        
        // Thử nhiều cách lấy position
        const position = chartItem.chart_position || chartItem.position || (index + 1);
        
        let positionClass = '';
        if (position === 1) positionClass = 'top-1';
        else if (position === 2) positionClass = 'top-2';
        else if (position === 3) positionClass = 'top-3';
        
        if (type === 'songs') {
            html += `
                <div class="chart-item" onclick="navigateToSong(${item.id})">
                    <div class="chart-position ${positionClass}">
                        ${position}
                    </div>
                    <img src="${item.song_art_image_url || item.header_image_url}" alt="${item.title}" class="chart-image">
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
        } else if (type === 'artists') {
            html += `
                <div class="chart-item" onclick="navigateToArtist(${item.id})">
                    <div class="chart-position ${positionClass}">
                        ${position}
                    </div>
                    <img src="${item.image_url}" alt="${item.name}" class="chart-image artist">
                    <div class="chart-info">
                        <div class="chart-title">${item.name}</div>
                    </div>
                </div>
            `;
        } else if (type === 'albums') {
            html += `
                <div class="chart-item" onclick="navigateToAlbum(${item.id})">
                    <div class="chart-position ${positionClass}">
                        ${position}
                    </div>
                    <img src="${item.cover_art_url}" alt="${item.name}" class="chart-image">
                    <div class="chart-info">
                        <div class="chart-title">${item.name}</div>
                        <div class="chart-subtitle">${item.artist?.name || ''}</div>
                    </div>
                </div>
            `;
        }
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', function() {
    loadChart('songs');
});