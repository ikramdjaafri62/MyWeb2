// js/user.js
document.addEventListener('DOMContentLoaded', () => {
    const map = initMap('map');
    fetch("/places")
  .then(res => res.json())
  .then(places => {

    console.log("DATA FROM DB:", places);

    places.forEach(place => {

      L.marker([place.latitude, place.longitude])
        .addTo(map)
        .bindPopup(`
          <b>${place.name}</b><br>
          ${place.description}<br>
          <b>Type:</b> ${place.type}
        `);

    });

  })
  .catch(err => console.log("ERROR:", err));

    // 2. GeoJSON Upload Logic (From original snippet)
    const geojsonInput = document.getElementById('geojson-input');
    const opacitySlider = document.getElementById('opacity-slider');
    let geojsonLayer = null;

    geojsonInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const data = JSON.parse(event.target.result);
            if (geojsonLayer) map.removeLayer(geojsonLayer);
            
            geojsonLayer = L.geoJSON(data, {
                style: { opacity: parseFloat(opacitySlider.value) }
            }).addTo(map);
            map.fitBounds(geojsonLayer.getBounds());
        };
        reader.readAsText(file);
    });

    opacitySlider.addEventListener('input', (e) => {
        if (geojsonLayer) {
            geojsonLayer.setStyle({ opacity: parseFloat(e.target.value) });
        }
    });

const sosBtn = document.getElementById("sos-btn");

sosBtn.addEventListener("click", () => {

    if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition((position) => {

            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Notification
            alert(
              "🚨 SOS Activated!\n\n" +
              "Police: 1548\n" +
              "Civil Protection: 14\n\n" +
              "Latitude: " + lat + "\n" +
              "Longitude: " + lng
              );

            // Marker GPS
            L.marker([lat, lng])
                .addTo(map)
                .bindPopup(`
                 <b>🚨 SOS Location</b><br>
                 Latitude: ${lat}<br>
                 Longitude: ${lng}
                 `)
                .openPopup();

            // Zoom على المكان
            map.setView([lat, lng], 15);

        }, () => {

            alert("❌ Impossible d'obtenir votre position");

        });

    } else {

        alert("Geolocation not supported");

    }

});


});