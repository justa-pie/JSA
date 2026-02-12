// ========================================
// API CONFIGURATION
// ========================================
const API_CONFIG = {
    host: 'genius-song-lyrics1.p.rapidapi.com',
    key: 'f405287279msha2ee93f99d91b69p153223jsn9bccd2e5b5b4',
    baseURL: 'https://genius-song-lyrics1.p.rapidapi.com'
};

// ========================================
// STATE MANAGEMENT
// ========================================
let currentChart = 'songs';
let currentTimePeriod = 'day';

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
        const response = await fetch(url, options);
        if (!response.ok) throw new Error('API request failed');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

/**
 * Format số lượng views
 */
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
}

/**
 * Hiển thị loading spinner
 */
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

// ========================================
// NAVIGATION FUNCTIONS
// ========================================

function navigateToSong(songId) {
    window.location.href = `details-song.html?id=${songId}`;
}

function navigateToArtist(artistId) {
    window.location.href = `details-artist.html?id=${artistId}`;
}

function navigateToAlbum(albumId) {
    window.location.href = `details-album.html?id=${albumId}`;
}

// ========================================
// FILTER FUNCTIONS
// ========================================

/**
 * Chuyển đổi time period filter
 */
function switchTimePeriod(period) {
    currentTimePeriod = period;
    
    // Update button states
    document.querySelectorAll('.time-period-filter button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-period="${period}"]`).classList.add('active');
    
    // Reload chart với time period mới
    loadChart(currentChart);
}

/**
 * Chuyển đổi chart type (songs/artists/albums)
 */
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

// ========================================
// CHART LOADING
// ========================================

/**
 * Load chart data theo type và time period
 */
async function loadChart(type) {
    const container = document.getElementById('chartContent');
    showLoading('chartContent');
    
    // Xác định endpoint
    let endpoint = '';
    if (type === 'songs') endpoint = '/chart/songs/';
    else if (type === 'artists') endpoint = '/chart/artists/';
    else if (type === 'albums') endpoint = '/chart/albums/';
    
    // Map time period sang API parameter
    let timeType = 'all';
    if (currentTimePeriod === 'day') timeType = 'day';
    else if (currentTimePeriod === 'week') timeType = 'week';
    else if (currentTimePeriod === 'month') timeType = 'month';
    else if (currentTimePeriod === 'all') timeType = 'all_time';
    
    // Parameters cho API
    const params = type === 'songs' 
        ? { per_page: 20, page: 1, time_period: timeType, type: timeType } 
        : { per_page: 10, time_period: timeType };
    
    // Fetch data
    const data = await fetchAPI(endpoint, params);
    
    // Kiểm tra data
    if (!data || !data.chart_items || data.chart_items.length === 0) {
        container.innerHTML = '<p style="color: white; text-align: center;">Không có dữ liệu</p>';
        return;
    }
    
    // Render chart
    renderChart(data.chart_items, type, container);
}

// ========================================
// CHART RENDERING
// ========================================

/**
 * Render chart items
 */
function renderChart(chartItems, type, container) {
    let html = '<div class="chart-list">';
    
    chartItems.forEach((chartItem, index) => {
        const item = chartItem.item;
        
        // Lấy position từ nhiều nguồn có thể
        const position = chartItem.chart_position || chartItem.position || (index + 1);
        
        // Xác định class cho top 3
        let positionClass = '';
        if (position === 1) positionClass = 'top-1';
        else if (position === 2) positionClass = 'top-2';
        else if (position === 3) positionClass = 'top-3';
        
        // Render theo type
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

/**
 * Render song item trong chart
 */
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

/**
 * Render artist item trong chart
 */
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

/**
 * Render album item trong chart
 */
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

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    loadChart('songs');
});