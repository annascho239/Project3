// Weather fetching: NOAA/NWS gridpoint lookup, forecast periods, and raw
// gridpoint data (for feels-like and sky-cover, used by the recommendation
// engine's sunscreen proxy rule — see spec.md R11). No User-Agent header is
// set here: browsers forbid scripts from overriding it, but verified directly
// that NOAA/NWS accepts any normal browser User-Agent string (only a truly
// empty one is rejected), so this is a non-issue in practice.

const NWS_BASE = "https://api.weather.gov";

function celsiusToFahrenheit(c) {
  return (c * 9) / 5 + 32;
}

// Parses a simple ISO 8601 duration (NWS uses forms like "PT1H", "P1DT6H").
function parseISODuration(duration) {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/.exec(duration);
  if (!match) return 0;
  const [, days, hours, minutes] = match;
  return (
    (Number(days) || 0) * 86400000 +
    (Number(hours) || 0) * 3600000 +
    (Number(minutes) || 0) * 60000
  );
}

// Finds the value in a NWS time-series ({values: [{validTime, value}]}) whose
// interval contains targetTime, falling back to the nearest preceding entry.
function findValueAt(series, targetIso) {
  if (!series || !series.values || series.values.length === 0) return null;
  const target = new Date(targetIso).getTime();
  let fallback = null;

  for (const entry of series.values) {
    const [startStr, durationStr] = entry.validTime.split("/");
    const start = new Date(startStr).getTime();
    const end = start + parseISODuration(durationStr);
    if (target >= start && target < end) {
      return entry.value;
    }
    if (start <= target) {
      fallback = entry.value;
    }
  }
  return fallback;
}

// Fetches and enriches every forecast period for a location. Does not decide
// which period maps to which of the user's 7 selectable days — that mapping
// (preferring the daytime period, with a fallback for "today" after sunset)
// belongs to the recommendation engine, kept separate from data fetching.
export async function fetchWeatherForLocation(lat, lon) {
  const pointsResponse = await fetch(`${NWS_BASE}/points/${lat},${lon}`);
  if (!pointsResponse.ok) {
    throw { type: "service_error" };
  }
  const points = await pointsResponse.json();
  const { gridId, gridX, gridY, forecast: forecastUrl } = points.properties;
  const rel = points.properties.relativeLocation.properties;
  const locationName = `${rel.city}, ${rel.state}`;

  const [forecastResponse, gridResponse] = await Promise.all([
    fetch(forecastUrl),
    fetch(`${NWS_BASE}/gridpoints/${gridId}/${gridX},${gridY}`),
  ]);
  if (!forecastResponse.ok || !gridResponse.ok) {
    throw { type: "service_error" };
  }

  const forecastData = await forecastResponse.json();
  const gridData = await gridResponse.json();
  const grid = gridData.properties;

  const periods = forecastData.properties.periods.map((period) => {
    const feelsLikeC = findValueAt(grid.apparentTemperature, period.startTime);
    const skyCover = findValueAt(grid.skyCover, period.startTime);
    return {
      ...period,
      feelsLike: feelsLikeC === null ? null : Math.round(celsiusToFahrenheit(feelsLikeC)),
      skyCover, // percent, 0-100; used as the sunscreen-reminder proxy (no UV index available)
    };
  });

  return { locationName, periods };
}
