import {
  resolveDeviceLocation,
  resolveManualLocation,
  saveLocation,
  loadSavedLocation,
} from "./location.js";
import { fetchWeatherForLocation } from "./weather.js";
import { buildRecommendationState } from "./recommendation.js";

const WEATHER_ICON_FILES = {
  sunny: "sunny-icon.png",
  "partly-cloudy": "partly-cloudy-icon.png",
  cloudy: "cloudy-icon.png",
  rain: "raining-icon.png",
  snow: "snow-icon.png",
};
const REMINDER_ICON_FILES = {
  umbrella: "umbrella-icon.png",
  sunscreen: "sunscreen-icon.png",
  hydration: "water-droplet-icon.png",
};

const el = (id) => document.getElementById(id);
const weatherBackground = el("weather-background");

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function populateParticles(container, className, count, { minDuration, maxDuration, minSize, maxSize }) {
  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");
    particle.className = className;
    particle.style.left = `${randomBetween(0, 100)}%`;
    particle.style.animationDuration = `${randomBetween(minDuration, maxDuration)}s`;
    particle.style.animationDelay = `-${randomBetween(0, maxDuration)}s`;
    const size = randomBetween(minSize, maxSize);
    if (className === "snow-flake") {
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
    }
    container.appendChild(particle);
  }
}

populateParticles(
  document.querySelector('[data-scene="rain"] .rain-layer'),
  "rain-drop",
  40,
  { minDuration: 0.6, maxDuration: 1.4, minSize: 0, maxSize: 0 }
);
populateParticles(
  document.querySelector('[data-scene="snow"] .snow-layer'),
  "snow-flake",
  35,
  { minDuration: 4, maxDuration: 9, minSize: 4, maxSize: 8 }
);

function setWeatherScene(weatherIcon) {
  weatherBackground.className = `scene-${weatherIcon}`;
  document.querySelectorAll(".scene").forEach((scene) => {
    scene.classList.toggle("active", scene.dataset.scene === weatherIcon);
  });
}
const locationToggle = el("location-toggle");
const dateToggle = el("date-toggle");
const locationNameEl = el("location-name");
const dateNameEl = el("date-name");
const controlsPanel = el("controls-panel");
const controlsDone = el("controls-done");
const manualInput = el("manual-location-input");
const manualSubmit = el("manual-location-submit");
const deviceLocationButton = el("use-device-location");
const dateChipRow = el("date-chip-row");
const statusMessage = el("status-message");
const mainScreen = el("main-screen");

let currentPeriods = null;
let currentLocation = null;
let currentDates = [];
let selectedDate = null;
let todayStr = null;

function setStatus(text) {
  statusMessage.textContent = text || "";
}

function openControls() {
  controlsPanel.hidden = false;
  locationToggle.setAttribute("aria-expanded", "true");
  dateToggle.setAttribute("aria-expanded", "true");
}

function closeControlsOnPhone() {
  // On laptop this is a no-op visually — CSS keeps the panel open regardless
  // of the hidden attribute (see styles.css), per R6.
  controlsPanel.hidden = true;
  locationToggle.setAttribute("aria-expanded", "false");
  dateToggle.setAttribute("aria-expanded", "false");
}

function formatDateLabel(dateStr, isToday) {
  if (isToday) return "Today";
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function renderDateChips() {
  dateChipRow.innerHTML = "";
  currentDates.forEach((dateStr) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "date-chip" + (dateStr === selectedDate ? " selected" : "");
    chip.textContent = formatDateLabel(dateStr, dateStr === todayStr);
    chip.addEventListener("click", () => {
      selectedDate = dateStr;
      renderDateChips();
      renderStateForSelectedDate();
      closeControlsOnPhone();
    });
    dateChipRow.appendChild(chip);
  });
}

function renderRecommendationState(state) {
  mainScreen.hidden = false;
  setWeatherScene(state.weatherIcon);
  locationNameEl.textContent = state.locationName;
  dateNameEl.textContent = formatDateLabel(state.date, state.isToday);

  el("layer-upper").src = `assets/character/upper-${state.outfit.upper}.png`;
  el("layer-upper").alt = `${state.outfit.upper} upper layer`;
  el("layer-lower").src = `assets/character/lower-${state.outfit.lower}.png`;
  el("layer-lower").alt = `${state.outfit.lower} lower layer`;
  el("layer-footwear").src = `assets/character/footwear-${state.outfit.footwear}.png`;
  el("layer-footwear").alt = `${state.outfit.footwear} footwear`;

  el("weather-icon-img").src = `assets/weather-icons/${WEATHER_ICON_FILES[state.weatherIcon]}`;
  el("weather-icon-img").alt = state.shortForecast;
  el("temperature-display").textContent = `${state.temperature}°F`;
  el("feels-like-display").textContent = `Feels like ${state.feelsLike}°F`;
  el("recommendation-text").textContent = state.recommendationText;

  const remindersList = el("reminders-list");
  remindersList.innerHTML = "";
  if (state.reminders.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No reminders today.";
    remindersList.appendChild(li);
  } else {
    state.reminders.forEach((reminder) => {
      const li = document.createElement("li");
      const icon = document.createElement("img");
      icon.src = `assets/reminder-icons/${REMINDER_ICON_FILES[reminder.type]}`;
      icon.alt = reminder.type;
      icon.width = 24;
      icon.height = 24;
      const text = document.createElement("span");
      text.textContent = " " + reminder.wording;
      li.appendChild(icon);
      li.appendChild(text);
      remindersList.appendChild(li);
    });
  }
}

function renderStateForSelectedDate() {
  const state = buildRecommendationState(currentLocation.name, selectedDate, currentPeriods, todayStr);
  if (!state) {
    setStatus("No forecast available for that date.");
    return;
  }
  setStatus("");
  renderRecommendationState(state);
}

async function loadWeatherFor(location) {
  setStatus("Loading forecast...");
  mainScreen.hidden = true;
  try {
    const { locationName, periods } = await fetchWeatherForLocation(location.lat, location.lon);
    location.name = locationName;
    saveLocation(location);
    currentLocation = location;
    currentPeriods = periods;
    todayStr = periods[0].startTime.slice(0, 10);
    currentDates = [...new Set(periods.map((p) => p.startTime.slice(0, 10)))].slice(0, 7);
    selectedDate = todayStr;
    renderDateChips();
    renderStateForSelectedDate();
    closeControlsOnPhone();
  } catch (err) {
    handleError(err?.type || "service_error");
  }
}

function handleError(type) {
  const messages = {
    denied: "Location access is off. Enter a city or ZIP below.",
    unavailable: "Location isn't available on this device/browser.",
    empty: "Type a city or ZIP code first.",
    not_found: "Couldn't find that city or ZIP. Try another.",
    service_error: "The weather or location service failed. Try again.",
  };
  setStatus(messages[type] || "Something went wrong.");
  if (type === "denied" || type === "not_found" || type === "empty") {
    openControls();
  }
}

locationToggle.addEventListener("click", () => {
  if (controlsPanel.hidden) openControls();
  else closeControlsOnPhone();
});
dateToggle.addEventListener("click", () => {
  if (controlsPanel.hidden) openControls();
  else closeControlsOnPhone();
});
async function submitManualLocation() {
  setStatus("Looking up location...");
  const location = await resolveManualLocation(manualInput.value);
  await loadWeatherFor(location);
}

controlsDone.addEventListener("click", async () => {
  // Typing a location and clicking Done (instead of Update) should still
  // apply it, not silently discard it — found via testing with a real ZIP.
  if (manualInput.value.trim()) {
    try {
      await submitManualLocation();
    } catch (err) {
      handleError(err.type); // keeps the panel open on failure, per handleError
      return;
    }
  }
  closeControlsOnPhone();
});

deviceLocationButton.addEventListener("click", async () => {
  setStatus("Requesting device location...");
  try {
    const location = await resolveDeviceLocation();
    await loadWeatherFor(location);
  } catch (err) {
    handleError(err.type);
  }
});

manualSubmit.addEventListener("click", async () => {
  try {
    await submitManualLocation();
  } catch (err) {
    handleError(err.type);
  }
});

const saved = loadSavedLocation();
if (saved) {
  loadWeatherFor(saved);
} else {
  mainScreen.hidden = true;
  openControls();
  setStatus("Set a location to see today's recommendation.");
}
