import {
  resolveDeviceLocation,
  resolveManualLocation,
  saveLocation,
  loadSavedLocation,
} from "./location.js";
import { fetchWeatherForLocation } from "./weather.js";
import { buildRecommendationState } from "./recommendation.js";

const statusEl = document.getElementById("location-status");
const weatherEl = document.getElementById("weather-status");
const deviceButton = document.getElementById("use-device-location");
const manualForm = document.getElementById("manual-location-form");
const manualInput = document.getElementById("manual-location-input");

function renderLocation(location) {
  statusEl.textContent = `Location: ${location.name || "(resolving name...)"} (${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}) — via ${location.source}`;
}

function renderError(type) {
  const messages = {
    denied: "Location access is off. Enter a city or ZIP instead.",
    unavailable: "Location isn't available on this device/browser.",
    empty: "Type a city or ZIP code first.",
    not_found: "Couldn't find that city or ZIP. Try another.",
    service_error: "The weather or location service failed. Try again.",
  };
  statusEl.textContent = messages[type] || "Something went wrong.";
}

async function loadWeatherFor(location) {
  weatherEl.textContent = "Loading forecast...";
  try {
    const { locationName, periods } = await fetchWeatherForLocation(location.lat, location.lon);
    location.name = locationName;
    saveLocation(location);
    renderLocation(location);

    const next6 = periods.slice(0, 6).map((p) =>
      `${p.name}: ${p.temperature}°${p.temperatureUnit}, feels ${p.feelsLike ?? "?"}°F, ` +
      `sky cover ${p.skyCover ?? "?"}%, precip ${p.probabilityOfPrecipitation?.value ?? 0}%, ${p.shortForecast}`
    );

    const todayStr = periods[0].startTime.slice(0, 10);
    const dates = [...new Set(periods.map((p) => p.startTime.slice(0, 10)))].slice(0, 7);
    const stateLines = dates.map((dateStr) => {
      const state = buildRecommendationState(locationName, dateStr, periods, todayStr);
      if (!state) return `${dateStr}: no forecast period available`;
      const reminderText = state.reminders.length
        ? state.reminders.map((r) => `${r.type} (${r.wording})`).join("; ")
        : "none";
      return `${state.date}${state.isToday ? " (today)" : ""} — ${state.weatherIcon}, ${state.temperature}°F/feels ${state.feelsLike}°F — ` +
        `outfit: upper-${state.outfit.upper}/lower-${state.outfit.lower}/footwear-${state.outfit.footwear} — ` +
        `"${state.recommendationText}" — reminders: ${reminderText}`;
    });

    weatherEl.innerHTML =
      "<strong>Next periods (raw):</strong><br>" + next6.join("<br>") +
      "<br><br><strong>Recommendation state per day:</strong><br>" + stateLines.join("<br><br>");
  } catch (err) {
    renderError(err.type || "service_error");
    weatherEl.textContent = "";
  }
}

deviceButton.addEventListener("click", async () => {
  statusEl.textContent = "Requesting device location...";
  try {
    const location = await resolveDeviceLocation();
    saveLocation(location);
    renderLocation(location);
    loadWeatherFor(location);
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
    loadWeatherFor(location);
  } catch (err) {
    renderError(err.type);
  }
});

const saved = loadSavedLocation();
if (saved) {
  renderLocation(saved);
  loadWeatherFor(saved);
}
