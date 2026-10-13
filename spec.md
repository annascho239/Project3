# Technical Specification

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose of this file: Turn the approved research, project brief, and hand-drawn screen designs into testable requirements.

## Instructions for the Developer

Make and approve the product decisions, draw every proposed screen, provide the drawings to the Agent, and keep this file current as the intended result changes.

To begin, open the project repository in a fresh chat and enter:

`Read ./spec.md and help me begin the Project 3 specification.`

## Instructions for the Agent

Read `AGENTS.md`, `brief.md`, `research.md`, and this file. Review the screen drawings the Developer provides. Ask one focused question at a time, surface gaps and trade-offs without inventing requirements, and keep the specification concise and testable.

## Goal

Help a US college student quickly know how to dress for the day's weather — current or up to 7 days out — so they're not caught under- or overdressed, via a character whose outfit, weather icon, written recommendation, and reminders all reflect one recommendation state for the selected location and date.

User story (from `research.md`):

> As a college student, I want to quickly know how to dress for the day's weather, so that I'm not caught under- or overdressed.

## Screen designs

Draw every proposed screen by hand, in both phone and laptop layouts, on paper, a tablet, a whiteboard, or another hand-drawing surface. Save photos or exports in `reference/`, provide them to the Agent, and link them here. Use the drawings to define layout, hierarchy, controls, navigation, and important interaction states.

**Main screen**
- [Phone — default state](reference/Untitled_Artwork-1.png): header bar (location, date), character with current outfit in a card alongside temperature/condition/"feels like" and a written recommendation sentence, Reminders row below (umbrella/sunscreen/hydration).
- [Phone — loading state](reference/Untitled_Artwork-3.png): header stays, "Loading forecast..." label, skeleton placeholders for the character card and recommendation/reminders.
- [Phone — error/missing data state](reference/Untitled_Artwork-4.png): "Forecast unavailable" message explaining the failure, a "Try again" button, and a bulleted list of what the user can do (check connection, retry, choose another day).
- [Phone — location permission denied state](reference/Untitled_Artwork-5.png): "Location access is off" message, manual city/ZIP entry field, submit button, and a one-line privacy note ("Location is only used to get nearby weather"). This manual-entry component is the same one used from the controls-expanded screen below (not a separate input) — it's just surfaced automatically when permission is denied.
- [Phone — controls expanded state](reference/Untitled_Artwork-6.png): tapping location or date on the header opens this panel — editable location name + Update button, a 7-day chip picker ("choose a day, next 7"), selected-day readout, and a "Forecast selected day" / Done action.
- [Laptop — default state](reference/Untitled_Artwork-7.png): header bar spans full width (location, date, weather/outfit label); below it, a side-by-side layout — character/outfit card on the left, weather + written recommendation on the right, with Reminders in its own card beneath that. Uses the wider screen instead of copying the phone's stacked layout.
- **Laptop — controls**: no separate expand/collapse panel. Location field, the 7-day picker, and an update control sit directly inline in the header row, since laptop width has room for all of it at once (header bar in the laptop drawing shows the location/date slots; the inline controls fill that same space rather than opening a panel).
- **Share button**: top-right corner of the main screen header (both phone and laptop). Tapping it generates a shareable card containing the character, its current outfit, and the day's weather — described by the Developer rather than sketched separately.

**Information screen**
- [Phone](reference/Untitled_Artwork-2.png): header bar, "About / How recommendations work" heading, stacked rows — Creator, Weather Source, Method, Privacy, Art/licenses — with a Back control.
- [Laptop](reference/Untitled_Artwork-8.png): same header bar, a 2-column card grid (Creator / Weather Data on one row, Method / Privacy on the next, Art + Licenses spanning the bottom), Back control top-right.

Loading, error, and location-denied states were only sketched for phone — the same in-place behavior applies on laptop within its wider layout, since the states themselves don't change between layouts, only the surrounding spacing does.

## Requirements

Translate every fixed brief requirement and the selected research-driven feature into a testable requirement. Define the chosen behavior, content, controls, current and forecast data, responsive layout, accessibility, error handling, privacy, credits, and deployment. The main screen should make clear the location, date, units, data source, and whether conditions are current or forecast. Include an acceptance check for each requirement.

### Weather data

1. **R1 — Live provider.** Current and forecast conditions come from the NOAA/NWS API (`api.weather.gov`), called directly from the browser (verified CORS-enabled in research). No other weather source is used.
   *Acceptance check:* opening the network inspector while loading the app shows only requests to `api.weather.gov`.
2. **R2 — Units.** Temperatures display in Fahrenheit (°F), matching US convention and the NOAA/NWS data's native units.
   *Acceptance check:* every displayed temperature is suffixed with °F.
3. **R3 — Forecast range.** Users can select today or any of the next 6 days (7 days total), matching NOAA/NWS's maximum range.
   *Acceptance check:* the date picker offers exactly 7 selectable days (today + 6 ahead) and no more.

### Location and date

4. **R4 — Location input methods.** Users can set location via device geolocation (one-time `getCurrentPosition()` lookup) or manual city/ZIP entry. The same manual-entry component is used both proactively (controls-expanded panel) and reactively (shown automatically when location permission is denied). Manual entry is resolved to coordinates by routing 5-digit input to the Zippopotam.us ZIP API and everything else to the Open-Meteo Geocoding API (both free, no key, CORS-verified) before being passed to NOAA/NWS — geocoding lookups only, not a second weather data source, so this doesn't conflict with R1's one-weather-provider rule.
   *Acceptance check:* granting location permission populates the header with a resolved location name; denying it instead shows the manual-entry fallback; typing a valid city/ZIP and submitting also populates the header.
5. **R5 — Persisted location.** Only the single most recently resolved location is saved on-device (e.g. `localStorage`); no history/favorites list, no server-side account.
   *Acceptance check:* set a location, reload the page — the same location loads automatically with no new prompt; set a second location — only the second one persists after another reload.
6. **R6 — Date/location controls, responsive.** On phone, tapping location or date opens the controls-expanded panel (editable location field + Update, 7-day chip picker, Done). On laptop, the same controls sit inline in the header row with no expand/collapse step.
   *Acceptance check:* at phone width, the panel only appears after a tap and closes on Done; at laptop width, the location field and day picker are visible and usable without any extra click.
7. **R7 — Header clarity.** The main screen header always shows the current location name, the selected date (or "Today"), and whether the displayed conditions are current or forecast.
   *Acceptance check:* selecting a future date changes a visible label (e.g. the date itself, or a "forecast" tag) distinguishing it from "Today."

### Main screen content and recommendation state

8. **R8 — Single recommendation state.** For a given location + date + live weather data, one recommendation state object drives the character's outfit (upper/lower/footwear), the weather icon, the written recommendation sentence, and the reminders shown — all four always agree with each other.
   *Acceptance check:* for any selected date, the outfit, icon, text, and reminders never contradict each other (e.g. a rain icon never appears without the umbrella reminder, per R11).
9. **R9 — Outfit categories.** The character's outfit always includes one upper, one lower, and one footwear piece, each with 3 possible variations (9 pieces total). Each piece has an eligible temperature range that overlaps its neighbors' (e.g. cold: below 60°F, mild: 45-85°F, warm: above 70°F), and the piece shown is chosen independently at random *among whichever pieces are eligible at the current feels-like temperature* per category (see R12/R13) — never a piece implausible for the weather (e.g. a puffer coat on a 95°F day), but with real variety whenever the temperature falls in an overlap zone.
   *Acceptance check:* no outfit piece ever appears outside its eligible range for the day's feels-like temperature; across the 7 available dates, at least two different variations appear in at least one category when temperatures fall within an overlap zone.
10. **R10 — Weather icon set.** One of 5 icons (sunny, partly cloudy, cloudy, rain, snow) displays based on the NOAA/NWS condition code for the selected date, alongside the numeric temperature and "feels like" value.
    *Acceptance check:* a sunny-coded forecast shows the sunny icon; a rain-coded forecast shows the rain icon (manually verified against at least 2 differing real forecasts).
11. **R11 — Reminders.** Umbrella, sunscreen, and hydration reminders each appear only when conditions warrant them, each with 3 possible wording variations:
    - *Umbrella*: precipitation probability above a defined threshold.
    - *Sunscreen*: verified directly against the live NOAA/NWS API that it returns **no UV index field** (checked both the `/forecast` and raw `/gridpoints` endpoints) — and pulling UV from a second provider would violate the brief's one-provider requirement. So this reminder instead triggers on **low sky cover during daytime** (e.g. `skyCover` < 40% while `isDaytime` is true), a real proxy for sun exposure built entirely from NOAA/NWS's own data. The Information screen's method disclosure (R14) must describe this honestly as a sky-cover-based method, not claim a true UV index.
    - *Hydration*: temperature above a defined threshold.
    *Acceptance check:* a forecast period with low sky cover and daytime=true shows the sunscreen reminder; an overcast or nighttime period does not.

### Content variation

12. **R12 — Independent random selection.** Each outfit category and each shown reminder independently selects one of its 3 variations at random, so near-identical forecasts don't always look identical.
    *Acceptance check:* two different dates with very similar temperature/conditions can still show different variations in at least one category.
13. **R13 — Deterministic consistency.** The variation for a given (location, date, category) is computed from a deterministic hash/seed, not stored — so returning to a previously viewed date, including after a full page reload, always reproduces the same variations.
    *Acceptance check:* view a date, note the outfit/reminders shown, reload the page, re-select the same date — identical variations appear.

### Information screen

14. **R14 — Required disclosures.** The Information screen states: the creator's name, the weather data source (NOAA/NWS) with a link, the recommendation method/thresholds used (including that the sunscreen reminder is based on sky cover + daytime, not a true UV index, since NOAA/NWS doesn't provide one), privacy practices (location is stored only on-device, only the most recent location is kept, and the weather provider receives the coordinates sent in each request), and art credits (all 18 assets — character, outfit pieces, weather icons, reminder icons — are original hand-drawn artwork by the Developer; no third-party/licensed assets are used).
    *Acceptance check:* every one of those five items is present and readable on the Information screen, on both phone and laptop.

### Error handling

15. **R15 — Loading state.** While a forecast request is in flight, the main screen shows a "Loading forecast..." label with skeleton placeholders instead of stale or blank content.
    *Acceptance check:* throttling the network in dev tools shows the loading state before content appears.
16. **R16 — Service error / missing data.** If the NOAA/NWS request fails or returns incomplete data, the main screen shows a clear "Forecast unavailable" message, a Try Again action, and guidance (check connection, retry, choose another day) — never a blank or broken screen.
    *Acceptance check:* simulating a failed request (e.g. blocking the API domain in dev tools) shows this state, and Try Again re-attempts the request.
17. **R17 — Location permission denied.** Denying the browser's location prompt shows the manual-entry fallback (R4) with a one-line privacy explanation, never a silent failure.
    *Acceptance check:* denying the permission prompt in-browser shows this screen immediately.

### Responsive layout and accessibility

18. **R18 — Responsive layouts.** Phone layout stacks content vertically and is operable one-handed (primary controls reachable in the lower two-thirds of the screen); laptop layout uses a side-by-side arrangement (per the laptop drawings) rather than a stretched copy of the phone layout.
    *Acceptance check:* resizing the browser from phone to laptop width changes the arrangement (stacked → side-by-side), not just the scale.
19. **R19 — Contrast.** All text meets WCAG 2.2 contrast minimums: ≥4.5:1 for normal text, ≥3:1 for large text (18pt+/14pt+ bold).
    *Acceptance check:* run an automated contrast checker (e.g. browser dev tools accessibility panel) against the bright/saturated palette; no failures on visible text.
20. **R20 — Touch targets.** All interactive controls (buttons, date chips, share button) are at least 24×24 CSS pixels, per WCAG 2.2's Target Size (Minimum).
    *Acceptance check:* inspect each control's rendered bounding box in dev tools; none fall below 24×24px.
21. **R21 — Keyboard and screen reader support.** All interactive elements have a visible focus indicator and a text alternative (alt text/ARIA label) when non-text (icons, character image).
    *Acceptance check:* tab through the app using only the keyboard — every control shows a visible focus ring and is operable; a screen reader announces a label for every icon-only control.

### Privacy

22. **R22 — Location use disclosure and minimal collection.** The app requests location permission only when needed for a forecast lookup, uses a one-time coordinate lookup (not continuous tracking), and explains why it's needed before or at the permission prompt.
    *Acceptance check:* the Information screen's privacy section matches this behavior; the browser's permission prompt appears only after the user initiates location use (not on page load without context).

### Deployment and credits

23. **R23 — Public HTTPS deployment.** The app deploys to GitHub Pages at a public HTTPS URL.
    *Acceptance check:* the deployed URL loads over `https://` with no certificate warning, from a device not used during development.

### Additional feature — shareable outfit card

24. **R24 — Share button.** A share button sits in the top-right corner of the main screen header (phone and laptop).
    *Acceptance check:* the button is visible and reachable in that position at both widths.
25. **R25 — Shareable card content.** Tapping the share button generates a card image containing the character (with its current outfit), and the day's weather.
    *Acceptance check:* the generated card visibly includes all three elements and reflects the currently selected date's recommendation state (R8).

## Recommendation state and data flow

Define the weather inputs, recommendation categories, coded rules, and shared state. Weather values must come from the provider, and rules must follow the weather guidance cited in `research.md`. The selected location, date, and live weather data must produce one recommendation state that drives every visual and written output.

**Inputs** (per selected location + date, from NOAA/NWS): temperature, "feels like" temperature, short forecast condition text/code, precipitation probability, wind speed, and UV index (if available from the provider; see note below).

**Recommendation state shape:**
```
{
  locationName, date, isToday,
  temperature, feelsLike, conditionCode,   // raw inputs, for display
  weatherIcon,                              // one of 5, derived from conditionCode
  outfit: { upper, lower, footwear },       // each one of 3 variations
  recommendationText,                       // written sentence
  reminders: [ { type, wording } ]          // 0-3 of umbrella/sunscreen/hydration, each with 1 of 3 wordings
}
```
This single object is computed once per (location, date, weather data) and used to render the character, weather icon, recommendation text, and reminders — never computed separately per UI element (satisfies R8).

**Coded rules (thresholds, per `research.md`'s weather/sun-safety evidence):**
- *Outfit selection* — each of upper/lower/footwear has 3 pieces with overlapping eligible temperature ranges (cold: below 60°F, mild: 45-85°F, warm: above 70°F); the deterministic seed (R12/R13) picks randomly only among whichever pieces are eligible at the day's feels-like temperature, never an implausible one. Temperature also drives the written recommendation text and reminders below.
- *Umbrella reminder* — shown when precipitation probability exceeds a defined threshold (e.g. ≥40%).
- *Sunscreen reminder* — shown when `skyCover` is low (e.g. <40%) during daytime. Verified directly against live NOAA/NWS responses that no UV index field exists on either the `/forecast` or raw `/gridpoints` endpoints, so this sky-cover + daytime proxy is used instead (see R11).
- *Hydration reminder* — shown when temperature exceeds a defined threshold (e.g. ≥80°F).
- Exact temperature/precipitation/sky-cover threshold numbers are implementation details to be tuned during the build/verification phase in `plan.md`, not fixed here — the rule categories and data sources are fixed now.

## Content variation

- Each outfit category (upper, lower, footwear) has exactly 3 pre-defined variations; each reminder type (umbrella, sunscreen, hydration) has exactly 3 pre-defined wording variations. See R9/R11.
- Selection is independent per category/reminder: the upper's variation choice doesn't influence the lower's, etc. (R12).
- Selection is deterministic, not stored: computed from a seed derived from (location, date, category/reminder-type), so the same date always recomputes the same variations — including after a full page reload, with no persisted record of "what was chosen" (R13). This directly satisfies the brief's "returning to a previously selected date shows the same variations" requirement without any storage growth.

## Assets

| Asset | Appears in | Format | Source | Credit/license |
|---|---|---|---|---|
| Base character body | Main screen | PNG (transparent) | Original, hand-drawn by Developer | Full ownership |
| Upper piece × 3 | Main screen (layered on character) | PNG (transparent) | Original, hand-drawn by Developer | Full ownership |
| Lower piece × 3 | Main screen (layered on character) | PNG (transparent) | Original, hand-drawn by Developer | Full ownership |
| Footwear piece × 3 | Main screen (layered on character) | PNG (transparent) | Original, hand-drawn by Developer | Full ownership |
| Weather icons × 5 (sunny, partly cloudy, cloudy, rain, snow) | Main screen | PNG (transparent) | Original, hand-drawn by Developer | Full ownership |
| Reminder icons × 3 (umbrella, sunscreen, hydration) | Main screen reminders row | PNG (transparent) | Original, hand-drawn by Developer | Full ownership |
| Share-card background/layout | Generated share image | Canvas/image composite | Original, composited from the above assets | Full ownership |

18 original assets total (1 character + 9 outfit pieces + 5 weather icons + 3 reminder icons), per the art estimate in `research.md`. All hand-drawn by the Developer, not a licensed icon pack as originally considered — see Revisions.

## Out of scope

Record features intentionally excluded from this project.

- Outerwear and accessories as separate outfit categories (only upper, lower, footwear are covered — see `research.md`).
- Dark mode (light mode only).
- Saved/favorite locations or location history (only the single most recent location persists).
- User accounts or server-side storage of any kind.
- Weather providers other than NOAA/NWS, and non-US locations.
- Expanded weather icon set (only the basic 5: sunny, partly cloudy, cloudy, rain, snow).
- A dedicated full-screen takeover for errors/permission-denied (handled in-place on the main screen instead).

## Revisions

After implementation or testing, record requirement changes and the evidence that prompted them. Update the screen drawings when a material layout or interaction changes.

- **2026-10-04 (during planning):** R4 was missing how manual city/ZIP entry resolves to coordinates. Verified directly that NOAA/NWS only accepts lat/lon, that OpenStreetMap Nominatim lacks CORS support (unusable from static GitHub Pages hosting), and that the Open-Meteo Geocoding API is free, no-key, and CORS-enabled for both city and ZIP lookups. Added this to R4 as the geocoding mechanism.
- **2026-10-12 (during the recommendation-engine build task):** Found R9 and R12 contradicted each other — R9's "mapped to one of the 3 variations" by temperature band meant two similar-temperature days would always show the identical outfit piece per category, failing R12's acceptance check that similar forecasts can still show different variations. Initially resolved per the brief's original intent (variety, not strict temperature-matching) by making outfit art selection fully independent-random per category.
- **2026-10-12 (same day, after testing the built Main screen):** Fully random selection looked wrong in practice — a puffer coat (the "cold" upper piece) could appear on a 95°F day, since the fix above dropped temperature-plausibility entirely. Refined to overlapping eligible-temperature ranges per piece (cold below 60°F, mild 45-85°F, warm above 70°F): random choice happens only among pieces eligible at the day's feels-like temperature, which keeps the art always plausible while still giving variety whenever the temperature falls in an overlap zone. Updated R9 and the Recommendation state section's outfit-selection rule accordingly.
- **2026-10-12 (same day, found via manual testing with ZIP 80016):** R4's original Open-Meteo-only geocoding (decided during planning) failed on a real ZIP — Open-Meteo's `country=US` filter isn't actually reliable for raw ZIP queries, matching "80016" against a French postal code instead of Aurora, CO, despite working fine for city names. The planning-phase verification only tested one ZIP (78701) and happened to succeed, which masked this. Fixed by routing 5-digit input to Zippopotam.us (free, no key, CORS-verified, purpose-built for ZIP lookups) and city names to Open-Meteo. Updated R4 accordingly.
- **2026-10-12 (building the Information screen):** `research.md`'s Artwork approach and `spec.md`'s original Assets table planned weather/reminder icons as a licensed CC BY icon pack (e.g. Font Awesome), with only the character/outfit art as original. In practice, the Developer hand-drew all 18 assets, including the weather and reminder icons, in a consistent style. Updated the Assets table and R14 to credit everything as original Developer artwork with no third-party licenses involved.
- **2026-10-12 (usability-testing improvement):** Three peer sessions surfaced a finding (`plan.md`'s Usability testing section): one tester said the app "only gave her male outfits." Investigated which asset actually caused this before redrawing anything — the base character body has no hair or facial features at all, so the likely source was `lower-warm.png`, a swim-trunks/boxer-short style with a drawstring that reads specifically as men's swimwear. Redrew it as plain athletic shorts with no drawstring, same canvas/alignment. Verified it renders correctly layered on the character locally. The old version is kept as `lower-warm-old.png` for reference, not used by the app.

## Approval

The Developer reviews and explicitly approves this specification and its screen designs before planning begins.

## Saving the transcript

After the Developer approves the specification, ask them to enter `save transcript`. When directed, save the complete conversation as `transcripts/spec-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.
