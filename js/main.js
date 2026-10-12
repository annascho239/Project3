import {
  resolveDeviceLocation,
  resolveManualLocation,
  saveLocation,
  loadSavedLocation,
} from "./location.js";

const statusEl = document.getElementById("location-status");
const deviceButton = document.getElementById("use-device-location");
const manualForm = document.getElementById("manual-location-form");
const manualInput = document.getElementById("manual-location-input");

function renderLocation(location) {
  statusEl.textContent = `Location: ${location.name || "(name pending)"} (${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}) — via ${location.source}`;
}

function renderError(type) {
  const messages = {
    denied: "Location access is off. Enter a city or ZIP instead.",
    unavailable: "Location isn't available on this device/browser.",
    empty: "Type a city or ZIP code first.",
    not_found: "Couldn't find that city or ZIP. Try another.",
    service_error: "The location service failed. Try again.",
  };
  statusEl.textContent = messages[type] || "Something went wrong.";
}

deviceButton.addEventListener("click", async () => {
  statusEl.textContent = "Requesting device location...";
  try {
    const location = await resolveDeviceLocation();
    saveLocation(location);
    renderLocation(location);
  } catch (err) {
    renderError(err.type);
  }
});

manualForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusEl.textContent = "Looking up location...";
  try {
    const location = await resolveManualLocation(manualInput.value);
    saveLocation(location);
    renderLocation(location);
  } catch (err) {
    renderError(err.type);
  }
});

const saved = loadSavedLocation();
if (saved) {
  renderLocation(saved);
}
