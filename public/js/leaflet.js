/* eslint-disable */

// ----------------------------------------------
// Create the map and attach it to the #map
// ----------------------------------------------

export const displayMap = (locations) => {
  const map = L.map('map', { zoomControl: false });

  // ----------------------------------------------
  // Add a tile layer to add to our map
  // ----------------------------------------------

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(map);

  // ----------------------------------------------
  // Create icon using the image provided by Jonas
  // ----------------------------------------------

  const pin = L.icon({
    iconUrl: '../img/pin.png',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -50],
  });

  // ----------------------------------------------
  // Add locations to the map
  // ----------------------------------------------

  let group = [];

  locations.forEach((location) => {
    L.marker([location.coordinates[1], location.coordinates[0]], {
      icon: pin,
      title: location.description,
      alt: location.description,
    })
      .addTo(map)
      .bindPopup(`<p>Day ${location.day}: ${location.description}</p>`, {
        autoClose: false,
        className: 'map-popup',
      });

    group.push([location.coordinates[1], location.coordinates[0]]);
  });

  // ----------------------------------------------
  // Set map bounds to include current location
  // ----------------------------------------------

  const bounds = L.latLngBounds(group).pad(0.5);
  map.fitBounds(bounds);

  // Disable scroll on map
  map.scrollWheelZoom.disable();
};
