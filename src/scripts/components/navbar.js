// ============================================================
//  GENIUS API — Centralized config & fetch helper
//  Dùng chung cho tất cả các page script
// ============================================================

const API_CONFIG = {
    host: 'genius-song-lyrics1.p.rapidapi.com',
    key: 'f405287279msha2ee93f99d91b69p153223jsn9bccd2e5b5b4',
    baseURL: 'https://genius-song-lyrics1.p.rapidapi.com'
};

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

            if (response.status === 429) throw new Error('API quota exceeded. Please upgrade your plan or wait for reset.');
            if (response.status === 401 || response.status === 403) throw new Error('API authentication failed. Please check your API key.');
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ API Data received');
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
