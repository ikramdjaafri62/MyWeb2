document.addEventListener('DOMContentLoaded', () => {
    const map = initMap('map');
    let marker = null;

    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        document.getElementById('lat').value = lat.toFixed(6);
        document.getElementById('lng').value = lng.toFixed(6);

        if (marker) {
            map.removeLayer(marker);
        }
        marker = L.marker([lat, lng]).addTo(map);
    });

    const form = document.getElementById('place-form');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const newPlace = {
            name: document.getElementById('name').value,
            description: document.getElementById('description').value,
            latitude: parseFloat(document.getElementById('lat').value),
            longitude: parseFloat(document.getElementById('lng').value),
            type: document.getElementById('type').value
        };

        // 🔹 Get the token from localStorage
        const token = localStorage.getItem("token");

        fetch("/add-place", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token // 🔹 SEND THE TOKEN HERE
            },
            body: JSON.stringify(newPlace)
        })
        .then(res => {
            // 🔹 If server rejects the token (expired or fake)
            if (res.status === 401 || res.status === 403) {
                alert("Session expired or unauthorized. Please login again.");
                localStorage.clear();
                window.location.replace("login.html");
                return null; 
            }
            return res.json();
        })
        .then(data => {
            if (!data) return; // If redirected above, stop here
            
            console.log("Server response:", data);
            if (data.message) { 
                alert("✅ Place added successfully!");
                form.reset();
                if (marker) {
                    map.removeLayer(marker);
                    marker = null;
                }
            } else {
                alert("❌ Error: " + (data.error || "Unknown error"));
            }
        })
        .catch(err => {
            console.error("❌ Error:", err);
            alert("Error adding place");
        });
    });
});