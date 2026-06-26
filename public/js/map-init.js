// js/map-init.js
function initMap(containerId) {
    const map = L.map(containerId).setView(CONFIG.MAP_CENTER, CONFIG.MAP_ZOOM);

    L.tileLayer(CONFIG.TILE_LAYER, {
        attribution: CONFIG.ATTRIBUTION
    }).addTo(map);
    // Option A: CartoDB (good for development)
    /*L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    });*/


    return map;
}

