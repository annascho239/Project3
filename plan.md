# Implementation Plan

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose of this file: Turn the approved specification into an ordered, trackable build and verification plan.

## Instructions for the Developer

Set priorities, review the checklist, verify results rather than relying only on the Agent's report, and keep the project documents current as the work changes. Expect the build to take many rounds of testing and fixing; record material changes under Revisions.

To begin planning, open the project repository in a fresh chat and enter:

`Read ./plan.md and help me create the Project 3 implementation plan.`

After approving the plan, open the project repository in a fresh chat and enter:

`Read ./plan.md and help me implement the approved Project 3 plan in working checkpoints.`

## Instructions for the Agent

Read `AGENTS.md`, `brief.md`, `research.md`, `spec.md`, and this file, then inspect the relevant project files. Propose concrete tasks and checks without expanding the approved scope.

During implementation, follow the approved plan in working checkpoints and keep it current. Never mark approvals or items requiring Developer verification complete on the Developer's behalf.

## Approach

**Structure:** A static single-page app — plain HTML/CSS/JS, no build step or framework — pushed directly to GitHub Pages. Two screens (Main, Information) rendered/toggled client-side; no server or database.

**Data flow:**
1. Resolve location → device geolocation (`getCurrentPosition()`) or manual city/ZIP entry resolved to coordinates via the Open-Meteo Geocoding API.
2. Resolve coordinates → NOAA/NWS gridpoint (`/points/{lat},{lon}`), then fetch both the `/forecast` endpoint (temperature, precip probability, wind, condition text) and the raw `/gridpoints/.../` endpoint (`skyCover`, for the sunscreen proxy) for the 7-day window.
3. Compute one recommendation state per (location, date) from that weather data: outfit (upper/lower/footwear via deterministic seeded selection + temperature/precip rules), weather icon, written recommendation text, and reminders (umbrella/sunscreen/hydration via their threshold rules, each with a seeded wording variation).
4. Render the Main screen entirely from that one state object; persist only the most recent resolved location to `localStorage`.
5. On request, composite the character + outfit + weather into a shareable card image (Canvas API).

**Dependencies:** browser Geolocation API, NOAA/NWS API, Open-Meteo Geocoding API, `localStorage`, Canvas API — all verified free/no-key/CORS-enabled directly against live endpoints during research and spec work, so no API keys ever need to exist client-side.

**Task order:** assets first (longest lead time, start in parallel with everything else) → location resolution → weather fetching → recommendation engine (rules + deterministic variation) → Main screen rendering → in-place loading/error/permission states → Information screen → share feature → responsive/accessibility pass → deploy and iterate in small tested checkpoints throughout, not as one final step.

**Main risks:**
- NOAA/NWS's `/forecast` periods are split into 12-hour day/night segments, not single daily records — need to decide during the location/weather task how each of the 7 selectable days maps to a period (likely: use the daytime period for display and rule evaluation).
- Hand-drawn asset production (18 pieces) is likely the longest pole in the one-week build window — start immediately and in parallel with the technical tasks below, not after them.
- Geocoding edge cases: ambiguous city names (multiple US cities sharing a name) or invalid ZIPs need a clear error message, not a silent wrong-location result.
- Browser geolocation permission UX varies (some browsers remember a denial permanently across sessions) — needs testing across at least two browsers, not just one.
- The bright/saturated palette chosen in research still needs actual hex values picked and contrast-tested (WCAG 4.5:1) before the UI is built, not after.

## Checklist

### Approvals

- [x] Research approved
- [x] Specification approved
- [x] Plan approved

### Build

- [x] Create or source the assets listed in `spec.md` (1 character + 9 outfit pieces + 5 weather icons + 3 reminder icons), starting early and continuing in parallel with the tasks below
- [x] Scaffold a static site skeleton (index.html, css/, js/, assets/) and deploy it to a public GitHub Pages URL immediately, so the deployment pipeline is proven before complexity is added
- [x] Build location resolution: device geolocation with manual city/ZIP fallback (ZIP via Zippopotam.us, city names via Open-Meteo Geocoding — revised from an Open-Meteo-only approach after it failed on a real ZIP), persisting only the most recent resolved location to `localStorage`
- [x] Build weather fetching: NOAA/NWS gridpoint lookup → `/forecast` + raw `/gridpoints` data for the 7-day window, with a resolved approach for mapping day/night periods to each selectable day
- [x] Build the recommendation engine: deterministic seeded variation selection (within overlapping plausible-temperature ranges, revised after a puffer coat showed up on a 95°F day) plus the outfit/reminder threshold rules from `spec.md`, producing one recommendation state object per (location, date)
- [x] Build the Main screen: responsive header (location/date, inline on laptop, expandable panel on phone), character layering renderer, weather icon/temperature/feels-like display, recommendation text, reminders row — all driven by the one recommendation state, plus an animated weather-matched background
- [x] Build in-place loading, service-error, and location-permission-denied states on the Main screen, with a retry action for service errors (implemented, not yet live-tested against a real network failure)
- [x] Build the Information screen (phone and laptop layouts) with all five required disclosures
- [x] Build the share button and shareable card generation (Canvas composite of character, outfit, and weather)
- [x] Pick final palette hex values and verify WCAG contrast (4.5:1) before/while styling, not after
- [x] Use the approved screen drawings to guide layout and interaction work
- [x] Keep one recommendation state driving every visual and written output
- [x] Test and fix each checkpoint against the specification before starting the next
- [x] Commit meaningful working checkpoints
- [x] Deploy to a public HTTPS URL (live at https://annascho239.github.io/Project3/, verified serving all files and NOAA/NWS CORS working from that exact origin)

### Verify and revise

- [ ] Check every specification requirement
- [ ] Test multiple locations, current and forecast dates, recommendation categories, outfit and reminder variations, and failure states
- [ ] Verify that eligible outfit and reminder variations are selected independently rather than as fixed pairs
- [ ] Verify that returning to a previously selected date shows the same variations
- [ ] Test the deployed app, independently of the local version, on a real phone and a laptop, including both screens, accessibility, and one-handed controls
- [ ] Prepare the usability test below
- [ ] Test with three peers and record each session
- [ ] Add the chosen improvement to this checklist, and update `spec.md` if the intended result changes
- [ ] Implement, verify, and redeploy at least one meaningful revision

### Deliver

- [ ] Confirm all brief deliverables, sources, privacy information, and asset credits
- [ ] Save all chat transcripts
- [ ] Complete the debrief

## Usability testing

Before testing, record the purpose, a few realistic tasks, non-leading prompts, and a consistent note format. For each session, use a non-identifying label and record the task, what the tester did or said, successes, barriers or questions, and possible changes. Keep observations separate from interpretations. After all three sessions, summarize the strongest findings and the improvement they support.

**Purpose:** Check whether a first-time user can get and understand a weather-based outfit recommendation for their own location, change location/date without confusion, and find the required disclosures — surfacing friction before calling the deployed app done.

**Tasks (non-leading prompts — describe the goal, not the control to use):**
1. "Open the app and figure out what to wear today." (tests default-location flow, main screen clarity)
2. "Now find out what you'd wear later this week, a few days out." (tests date selection/forecast range)
3. "Imagine you're somewhere else in the US — change the location to a different city." (tests manual entry fallback)
4. "Find out where the weather information comes from, and how your location is used." (tests Information screen discoverability)
5. "Share today's outfit with someone." (tests the share feature)

**Note format (per session, labeled Tester A/B/C):** for each task — what the tester did/said, whether they succeeded, any barrier or question they voiced, and a possible change suggested by that friction. Keep what was observed (actions, quotes) separate from interpretation (why it might have happened).

**After all three sessions:** summarize the strongest recurring finding and the one improvement it supports, then add that improvement to the Build checklist above and update `spec.md` if the intended result changes.

## Revisions

Record material plan changes and why they were made.

## Saving transcripts

At the end of planning, ask the Developer to enter `save transcript`. When directed, save the complete conversation as `transcripts/plan-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.

At the end of every implementation chat, ask the Developer to enter `save transcript`. When directed, save the complete conversation as `transcripts/build-YYYY-MM-DD_HHMMSS.md` using the same formatting.
