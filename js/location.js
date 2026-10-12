// Location resolution: device geolocation or manual city/ZIP entry (geocoded via
// Open-Meteo), plus persistence of only the single most recent location (spec R5).

const LOCATION_STORAGE_KEY = "weatherfit:location";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

// One-time coordinate lookup (not watchPosition) — spec R22, minimal location use.
export function resolveDeviceLocation() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject({ type: "unavailable" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          name: null, // resolved later from NOAA/NWS's relativeLocation, see weather.js
          source: "device",
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject({ type: "denied" });
        } else {
          // TIMEOUT or POSITION_UNAVAILABLE — e.g. no location fix available
          reject({ type: "unavailable" });
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000, // getCurrentPosition has no default timeout and can hang indefinitely otherwise
        maximumAge: 0,
      }
    );
  });
}

// Resolves a typed city name or ZIP code to coordinates via Open-Meteo Geocoding
// (free, no key, CORS-enabled — verified directly; spec R4). Takes the top US
// result; ambiguous city names across states aren't disambiguated in this pass.
export async function resolveManualLocation(query) {
  const trimmed = query.trim();
  if (!trimmed) {
    throw { type: "empty" };
  }

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(trimmed)}&count=5&country=US`;
  const response = await fetch(url);
  if (!response.ok) {
    throw { type: "service_error" };
  }

  const data = await response.json();
  const results = (data.results || []).filter((r) => r.country_code === "US");
  if (results.length === 0) {
    throw { type: "not_found" };
  }

  const top = results[0];
  return {
    lat: top.latitude,
    lon: top.longitude,
    name: top.admin1 ? `${top.name}, ${top.admin1}` : top.name,
    source: "manual",
  };
}

// Only the most recently resolved location is kept — no history/favorites (spec R5).
export function saveLocation(location) {
  localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
}

export function loadSavedLocation() {
  const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
