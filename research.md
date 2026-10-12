# Research

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose of this file: Research your context of use, references, weather guidance, technical options, and choices that will guide the specification.

## Instructions for the Developer

Judge sources and recommendations, make the consequential decisions, and keep this file current as the work develops.

To begin, open the project repository in a fresh chat and enter:

`Read ./research.md and help me begin Project 3 research.`

## Instructions for the Agent

Read `AGENTS.md`, `brief.md`, and this file. Ask one focused question at a time. Help investigate and compare options without deciding for the Developer. Verify sources directly and keep this file concise.

## Context of use

As a US college student, I'd check this app in three main moments: during my morning routine at home before leaving, on the go mid-day when deciding whether to grab a jacket before an afternoon class, and the evening before to plan tomorrow's outfit. My main need across all three is avoiding being under- or overdressed for the weather — I don't want to be caught cold, overheated, or soaked. No unusual device, connectivity, or accessibility constraints assumed (standard phone or laptop, normal campus/home wifi).

## User story

> As a college student, I want to quickly know how to dress for the day's weather, so that I'm not caught under- or overdressed.

## References

Collect 5–10 reference images from relevant products and interfaces. Save each image in `reference/`, identify its source, and record a brief observation about what is useful, ineffective, or relevant to this project. Reference images are examples only; do not use them in the app.

1. **Carrot Weather** — `reference/Screenshot 2026-10-03 at 2.25.01 PM.png`
   Sidebar of saved locations, current conditions with a snarky written line, hourly temperature graph, daily forecast list, radar map.
   Observation: The timing that correlates to the hourly/daily forecast is useful, as is the locations list (Favorites/Recents), and UV index display.

2. **Yahoo Weather** — `reference/Screenshot 2026-10-03 at 2.25.35 PM.png`
   Full-bleed photo background matching location/conditions, dark overlay UI, "RealFeel" temp, minute-by-minute rain countdown, 10-day scroll list, radar map.
   Observation: Likes the big hero image paired with location + weather, and the "RealFeel" temperature display.

3. **Weather Fit: Wearing Smart** — `reference/Screenshot 2026-10-03 at 2.26.00 PM.png`
   Full-scene illustrated character dressed for the weather in a park/city backdrop; home-screen widgets show different avatars per city, each dressed for that city's temp/conditions.
   Observation: Likes the illustration style of the characters and how the outfit visibly correlates to the weather shown alongside it.

4. **WeatherStyle: AI Outfit Guide** — `reference/Screenshot 2026-10-03 at 2.26.22 PM.png`
   Day-selector strip, "AI Assistant" prompt field for context, itemized outfit breakdown by category (outer/upper/lower/shoes/accessories), multiple named outfit options per day, character illustration matching the selected outfit.
   Observation: Likes how outfits are broken down by category/part (outer, upper, lower, shoes, accessories).

5. **Cladwell** — `reference/Screenshot 2026-10-03 at 2.26.48 PM.png`
   Style-quiz onboarding (pick the outfit that feels most "you" from flat-lay photo options), daily outfit screen with current temp/conditions, flat-lay of recommended items, Recommended/Favorites tabs, "Choose Outfit" action.
   Observation: Likes that it uses real photographic images, and that it offers multiple outfit options for the user to choose from rather than a single prescribed outfit.

6. **Finch** — `reference/Screenshot 2026-10-03 at 2.27.55 PM.png`
   Daily checklist of self-care goals with icons and checkmarks, goal-detail/reminder settings screen (time, notify toggle, repeat, times per day), streak/history calendar view.
   Observation: Likes the rounded-corner UI style and the calendar/streak view.

## Weather and technical evidence

Record each useful source, what it supports, and important limitations. Research the weather variables, apparel guidance, reminders, accessibility, privacy, artwork, weather providers, and technical options needed for informed decisions.

### Weather providers (verified directly against each provider's own docs, not aggregator blogs)

| Provider | Cost / key | US coverage | Forecast range | Notes |
|---|---|---|---|---|
| [NOAA National Weather Service API](https://www.weather.gov/documentation/services-web-api) | Free, no API key (just a User-Agent header) | US only, ~2.5km grid resolution | 7-day (12-hour periods) + hourly | Official US government source; no stated rate limit beyond "generous... for typical use"; US-only is a non-issue since the brief only requires US locations |
| [Open-Meteo](https://open-meteo.com/en/pricing) | Free, no API key | Global | Multi-day forecast + historical (paid tiers add more) | Free tier is non-commercial only (CC BY 4.0, attribution required); generous rate limits (10,000 calls/day) |
| OpenWeatherMap | Free tier requires API key | Global | Varies by plan | 1,000 calls/day free tier per third-party comparisons (not independently verified against OpenWeatherMap's own docs yet) |

### Accessibility

- [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/?versions=2.2) (W3C, verified directly):
  - **1.4.3 Contrast (Minimum), AA**: text contrast ratio ≥ 4.5:1 (≥ 3:1 for text 18pt+/14pt+ bold).
  - **2.5.8 Target Size (Minimum), AA**: pointer targets ≥ 24×24 CSS pixels (with exceptions for spacing, inline text, essential elements, etc. — see [full criterion](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)).
  - **2.4.7 Focus Visible, AA**: keyboard focus indicator must be visible.
  - **1.1.1 Non-text Content, A**: images/icons need text alternatives (alt text/ARIA labels).
  - Apple's Human Interface Guidelines recommend a larger 44×44pt minimum tap target on iOS — a long-stable, well-known figure, not independently re-verified this session since the live HIG page is JS-rendered and didn't return fetchable content.

### Privacy practices (device location)

- [MDN Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) (verified directly):
  - Only available over HTTPS (secure context) — relevant since the brief requires HTTPS deployment anyway.
  - Browser requires explicit user permission via a prompt before any location access; permission can be granted/denied/session-based depending on the browser.
  - Exposes latitude, longitude, altitude, accuracy, and (with `watchPosition()`) speed/heading — this app only needs a one-time coordinate lookup (`getCurrentPosition()`), not continuous tracking.
  - Best practice: explain *why* location is needed before prompting, disclose how it's used/stored, and collect the minimum necessary.
- Relevant to our privacy disclosure (info screen): the brief requires saving only the most recent location on-device (implies client-side storage like `localStorage`, not a server-side account/database), and whichever weather provider is chosen will receive the coordinates sent to it as part of the API request — both points should be stated plainly on the info screen.

### Apparel/sun-safety guidance

- [EPA UV Index Scale](https://www.epa.gov/sunsafety/uv-index-scale-0): official 3-tier guidance — 1-2 Low (no protection needed), 3-7 Moderate to High (seek shade late morning–mid-afternoon, SPF 15+ broad-spectrum sunscreen, hat, sunglasses), 8+ Very High to Extreme (same protections, more urgently). Also documents the "shadow rule" (shadow shorter than you = higher UV exposure) as a simple rule of thumb.

### Artwork approach

- **Original (hand-drawn/illustrated by Developer)**: full ownership and copyright, full creative control over style, but highest time cost — each outfit variation × category must be drawn individually (based on references, apps like Weather Fit use a consistent illustrated-avatar style we liked).
- **AI-generated**: fast to produce many variations, but per the [US Copyright Office](https://www.copyright.gov/ai/) (verified directly, Mar 2023 policy statement + 2025 AI Report, and the *Zarya of the Dawn* and *Théâtre D'opéra Spatial* registration decisions): works that are purely AI-generated, with no meaningful human creative modification, **cannot be copyrighted**. A human would need to meaningfully edit/arrange AI output to claim any copyright over it — relevant since the brief asks the info screen to disclose art credits/licenses.
- **Appropriately licensed (icon packs/stock art)**: fastest for generic elements like weather icons. E.g. [Font Awesome](https://github.com/FortAwesome/Font-Awesome/blob/6.x/LICENSE.txt) icons are CC BY 4.0 (free, attribution required); [The Noun Project](https://help.thenounproject.com/hc/en-us/articles/200509798-What-licenses-do-you-offer-for-icons) icons are CC BY (attribution) or a small paid fee removes the attribution requirement. Less practical for the character/outfit art specifically, since a consistent custom character across many outfit variations is unlikely to exist pre-made and licensable as a set.
- The brief's workflow: once recommendation categories are chosen, estimate total art needed (character + 3 outfit variations × category + weather icons + reminder icons), then pick the approach(es) based on that volume — likely a mix (e.g., licensed icon set for weather/reminder icons, original or AI-assisted-but-human-edited art for the character/outfits). This is still pending the recommendation-category decision below.

## Decisions

Record the selected weather provider, forecast range, recommendation categories and rules, screen structure, visual direction, artwork approach (original, AI-generated, or appropriately licensed), deployment method, and one additional feature justified by the research. Briefly explain important trade-offs.

Once the recommendation categories are chosen, estimate the art needed: the character, three outfit variations per category, weather icons, and reminder icons. Use that estimate to choose the artwork approach.

### Recommendation categories

Upper, lower, footwear (3 categories), 3 variations each = 9 outfit pieces. Outerwear and accessories were considered (seen in the WeatherStyle reference) but left out to keep art scope manageable for the one-week research/spec phase.

### Reminders

Umbrella, sunscreen, hydration — the three examples named directly in the brief, each needing 3 wording variations.

### Weather icon set

Basic set of 5: sunny, partly cloudy, cloudy, rain, snow.

### Art production approach

Layered/swappable pieces on one base character body (composited in code), rather than a fully redrawn character per outfit combination. Standard technique seen in the Weather Fit reference; keeps art scope to individual pieces instead of 27+ full-body combinations.

### Art estimate

18 total assets: 1 base character + 9 outfit pieces (3 categories × 3 variations) + 5 weather icons + 3 reminder icons.

### Artwork approach

- **All 18 assets** (character, outfit pieces, weather icons, reminder icons): original, hand-drawn by the Developer. Full ownership/copyright, consistent illustrated style across every asset, no third-party license to track or disclose. (Originally planned as a mix — hand-drawn character/outfits plus a licensed CC BY icon pack for weather/reminder icons — but the Developer hand-drew everything during the build instead; see spec.md's Revisions.)

### Weather provider

**NOAA/NWS API**. No API key required — important since the app deploys to GitHub Pages (static hosting, no backend), where any client-side API key would be publicly visible in the browser's network requests. NOAA/NWS is also official US government data, free with no stated rate limit, and covers exactly the US-only location scope the brief requires (its global competitors offer more coverage than needed, and Open-Meteo's free tier is non-commercial-only).

### Forecast range

Full 7 days (today + 6 days ahead), matching NOAA/NWS's maximum range. Gives the most planning flexibility across all three contexts of use (morning, mid-day, evening-before) at no extra provider cost.

### Screen structure

2 screens:
- **Main screen**: location + date controls in a compact header bar (always visible, no extra navigation step), character with outfit, weather icon, written recommendation, and reminders all driven by one recommendation state. Loading, missing-data, service-error, and denied-permission states are shown in-place on this screen rather than as separate screens.
- **Information screen**: reached via an icon/button from the main screen. Identifies the creator, weather-data source, recommendation methods/sources, privacy practices, and art credits/licenses, per the brief.

### Visual direction

- **Illustration style**: flat, rounded, cartoonish — simple flat-color vector character and UI with soft rounded corners throughout (cards, buttons, icons). Matches the Weather Fit character style and Finch's rounded UI from the references, reads as friendly/playful, and is the most feasible style to draw consistently across 18 hand-drawn assets.
- **Color palette**: bright, saturated, energetic (in the spirit of Carrot Weather's blue or Finch's teal/green) rather than soft/pastel — reads clearly as playful for the college-student brand, and saturated colors have more room to hit WCAG contrast ratios than pastels.
- **Light/dark mode**: light mode only, to keep palette/contrast verification scoped to the one-week research/spec timeline.

### Additional feature

**Shareable outfit card.** Generates a shareable snapshot (image) of the day's character, outfit, and weather, which a student can post or send. This is the strongest fit for the brief's own framing — the project exists as part of the client's "social-engagement campaign" for a new clothing brand — so a feature that puts the branded character in front of other people (not just the app's own user) directly serves that stated marketing goal, more so than a retention-only feature like a streak counter.

### Deployment method

**GitHub Pages.** Verified directly:
- Static hosting only (no server-side code/database) — fits since the app is pure browser-based with no backend needed.
- Served over HTTPS automatically (free Let's Encrypt cert), satisfying the brief's HTTPS requirement with no extra setup; custom domains also supported if ever wanted.
- Repository/site size capped at 1GB, ~100GB/month bandwidth (soft limit) — far more than a prototype with 18 small illustrated assets needs.
- Tested the NOAA/NWS API directly with a cross-origin request (`curl -H "Origin: https://example.github.io"`) and confirmed it returns `access-control-allow-origin: *`, so the static site can call the weather API directly from browser JavaScript with no proxy or server needed — important to confirm before committing, since GitHub Pages can't run a backend to work around a CORS restriction if one existed.

## Revisions

Record new evidence or changed decisions and explain why they changed.

- **2026-10-12 (during the build):** Artwork approach changed from "hand-drawn character/outfits + licensed icon pack for weather/reminder icons" to all 18 assets being original hand-drawn artwork by the Developer. See spec.md's Revisions for detail.

## Approval

The Developer reviews the sources and decisions, corrects this file, and explicitly approves it before specification begins.

## Saving the transcript

After the Developer approves the research, ask them to enter `save transcript`. When directed, save the complete conversation as `transcripts/research-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.
