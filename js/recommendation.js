// Recommendation engine: combines a location's forecast periods with
// deterministic seeded variation selection and threshold rules into one
// recommendation state object (spec.md "Recommendation state and data flow").
//
// Outfit art variation is fully independent-random per category (not
// temperature-banded) — see spec.md's Revisions entry for why: temperature
// mapping each band to exactly one piece would make two similar-temperature
// days always show the identical outfit, failing R12's variety requirement.
// Temperature/conditions instead drive the written text and reminders.

const UMBRELLA_WORDINGS = [
  "Bring an umbrella — rain's likely today.",
  "Pack an umbrella just in case.",
  "Rain's in the forecast — grab an umbrella before you head out.",
];
const SUNSCREEN_WORDINGS = [
  "Clear skies ahead — put on sunscreen.",
  "Sun's out — don't forget sunscreen.",
  "Mostly clear today, so sunscreen is a good idea.",
];
const HYDRATION_WORDINGS = [
  "It's warm out — stay hydrated.",
  "Heat's up today, so keep drinking water.",
  "Warm day ahead — bring a water bottle.",
];

const UMBRELLA_PRECIP_THRESHOLD = 40; // percent
const SUNSCREEN_SKY_COVER_THRESHOLD = 40; // percent (low cover = more sun exposure)
const HYDRATION_TEMP_THRESHOLD = 80; // °F

// FNV-1a — simple, fast, deterministic string hash (no crypto needed; we only
// need a stable pseudo-random index, not security).
function hashString(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function seededIndex(seedParts, modulo) {
  return hashString(seedParts.join("|")) % modulo;
}

function pickOutfitVariation(locationName, dateStr, category) {
  const variations = ["cold", "mild", "warm"]; // asset-name suffixes, not temperature bands here
  const index = seededIndex([locationName, dateStr, category], variations.length);
  return variations[index];
}

function pickWording(locationName, dateStr, reminderType, wordings) {
  const index = seededIndex([locationName, dateStr, reminderType], wordings.length);
  return wordings[index];
}

// Finds the period for a given calendar date (YYYY-MM-DD), preferring the
// daytime period; falls back to whatever single period exists (e.g. "Tonight"
// for today after sunset has already passed).
export function getPeriodForDate(periods, dateStr) {
  const matches = periods.filter((p) => p.startTime.slice(0, 10) === dateStr);
  if (matches.length === 0) return null;
  return matches.find((p) => p.isDaytime) || matches[0];
}

const ICON_CODE_MAP = {
  skc: "sunny",
  clear: "sunny",
  few: "partly-cloudy",
  sct: "partly-cloudy",
  bkn: "cloudy",
  ovc: "cloudy",
  fog: "cloudy",
  rain: "rain",
  rain_showers: "rain",
  rain_showers_hi: "rain",
  tsra: "rain",
  tsra_sct: "rain",
  tsra_hi: "rain",
  rain_sleet: "rain",
  fzra: "rain",
  rain_fzra: "rain",
  sleet: "rain",
  snow: "snow",
  rain_snow: "snow",
  snow_sleet: "snow",
  blizzard: "snow",
};

function mapWeatherIcon(period) {
  const match = /\/icons\/land\/(?:day|night)\/([a-z_]+)/.exec(period.icon || "");
  if (match && ICON_CODE_MAP[match[1]]) {
    return ICON_CODE_MAP[match[1]];
  }
  // Fallback: keyword-match the human-readable forecast text.
  const text = (period.shortForecast || "").toLowerCase();
  if (text.includes("snow") || text.includes("blizzard")) return "snow";
  if (text.includes("rain") || text.includes("shower") || text.includes("storm")) return "rain";
  if (text.includes("overcast") || text.includes("mostly cloudy") || text.includes("fog")) return "cloudy";
  if (text.includes("cloud")) return "partly-cloudy";
  return "sunny";
}

function buildRecommendationText(period) {
  const feelsLike = period.feelsLike ?? period.temperature;
  let advice;
  if (feelsLike < 50) {
    advice = "Bundle up — it's chilly out there.";
  } else if (feelsLike <= 75) {
    advice = "A light layer should keep you comfortable.";
  } else {
    advice = "Dress light — it's warm today.";
  }
  return `Feels like ${feelsLike}°F and ${(period.shortForecast || "").toLowerCase()}. ${advice}`;
}

function buildReminders(locationName, dateStr, period) {
  const reminders = [];
  const precipChance = period.probabilityOfPrecipitation?.value ?? 0;
  const feelsLike = period.feelsLike ?? period.temperature;

  if (precipChance >= UMBRELLA_PRECIP_THRESHOLD) {
    reminders.push({
      type: "umbrella",
      wording: pickWording(locationName, dateStr, "umbrella", UMBRELLA_WORDINGS),
    });
  }
  if (period.isDaytime && period.skyCover !== null && period.skyCover < SUNSCREEN_SKY_COVER_THRESHOLD) {
    reminders.push({
      type: "sunscreen",
      wording: pickWording(locationName, dateStr, "sunscreen", SUNSCREEN_WORDINGS),
    });
  }
  if (feelsLike >= HYDRATION_TEMP_THRESHOLD) {
    reminders.push({
      type: "hydration",
      wording: pickWording(locationName, dateStr, "hydration", HYDRATION_WORDINGS),
    });
  }
  return reminders;
}

// Builds the single recommendation state object for one (location, date).
// Returns null if no forecast period covers that date (e.g. past the 7-day window).
export function buildRecommendationState(locationName, dateStr, periods, todayStr) {
  const period = getPeriodForDate(periods, dateStr);
  if (!period) return null;

  return {
    locationName,
    date: dateStr,
    isToday: dateStr === todayStr,
    temperature: period.temperature,
    feelsLike: period.feelsLike ?? period.temperature,
    shortForecast: period.shortForecast,
    weatherIcon: mapWeatherIcon(period),
    outfit: {
      upper: pickOutfitVariation(locationName, dateStr, "upper"),
      lower: pickOutfitVariation(locationName, dateStr, "lower"),
      footwear: pickOutfitVariation(locationName, dateStr, "footwear"),
    },
    recommendationText: buildRecommendationText(period),
    reminders: buildReminders(locationName, dateStr, period),
  };
}
