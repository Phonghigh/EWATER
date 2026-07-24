# FOLLOWUP-2026-07-24 — Monitoring: "data dashboard → situation dashboard" + linked interaction

**Date:** 2026-07-24 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Rebuilt the Quan trắc (Monitoring) tab so it *presents the situation*, not just
data: an always-on green/red **situation banner**, **linked interaction**
(table ↔ map ↔ chart all revolve around one selected station), a real 60-second
auto-refresh, marker hover popups, offline alerting, and per-station rain trend
arrows.

## 2. Where it fits
Tab 3 (Monitoring). Answers the operator's 4 questions in ~5 seconds — *what's
happening / where / how bad / what do I do* — instead of forcing them to scan a
map + two tables + three charts and reassemble the picture mentally. Mirrors the
exception-driven treatment already shipped on the GIS tab (`GisSituationBanner`).

## 3. The problem
The page rendered five independent widgets with no shared state, so the eye had
to jump map → table → chart → map and stitch the data together by hand. The core
work was **connecting** those widgets around a single selection, and doing it
without the map rebuilding its markers on every hover.

## 4. Concepts introduced

### Linked interaction / brushing (lift state up)
- **Plain definition:** one shared "selected item" lives in the parent; every
  view reads it, so highlighting in one view highlights the same item everywhere.
- **Why here:** the centerpiece of the feedback. `selectedCode` / `hoveredCode`
  live in [Monitoring.tsx](../../web/src/pages/Monitoring.tsx); the table, map,
  and trend chart all receive them as props. Click a row → the marker highlights
  + map flies + the chart's line for that station thickens while the others dim.
  Hover a marker → the table row highlights (two-way). This is the standard
  GIS/SCADA "brushing" pattern.

### Force-a-fly without a state *value* change (`flyNonce`)
- **Plain definition:** a counter you bump purely to re-trigger an effect, even
  when the meaningful value (the selected code) is unchanged.
- **Why here:** clicking "Xem ngay" or re-selecting the same worst station must
  re-fly the map. If the effect keyed only on `selectedCode`, re-selecting the
  same code is a no-op. Bumping `flyNonce` each select makes the fly effect run
  again.

### Honest auto-refresh from a clock-anchored step
- **Plain definition:** the "current step" is derived from the wall clock
  (`currentMonitoringStep(now)`), so re-reading the clock genuinely advances the
  data — it is not a fake ticking animation.
- **Why here:** a 60s `setInterval` calls `setNow(new Date())`; because every
  `useMemo` already keys on `step`, the whole page recomputes with no extra data
  wiring. The freshness chip is therefore truthful.

### CSS-remount flash via React `key`
- **Plain definition:** giving an element a `key` equal to its value makes React
  unmount+remount it when the value changes, replaying any mount animation once.
- **Why here:** `<span key={r.r10min} className="mon-cell-v">` — when a cell's
  number changes on refresh, the span remounts and the `mon-flash` keyframe runs
  a single time. Unchanged cells keep their key → no flash. No prev-value
  bookkeeping needed.

### Stale-closure-safe DOM handlers (refs)
- **Plain definition:** event listeners attached once (at marker build) read
  mutable `useRef`s instead of captured props, so they always see fresh values
  without re-attaching.
- **Why here:** markers rebuild only when data changes; their click/hover
  handlers read `rowsRef` / `onSelectRef` / `onHoverRef` so selection callbacks
  and popup content stay current without rebuilding markers on every render.

## 5. How it was approached
- **Reused the GIS precedents wholesale:** `GisSituationBanner` structure →
  `MonSituationBanner` (but *always* rendered, green + red, since a rain page
  wants a steady "all clear" too, unlike the GIS banner that only appears on
  trouble); the GIS hover-popup pattern (reusable `maplibregl.Popup`,
  `pointer-events:none`, raw-HTML content) → `.mon-hover-popup`; the marker
  severity + `prefers-reduced-motion` discipline.
- **Situation logic** is one pure helper `monSituation(rows)` in
  [monitoringService.ts](../../web/src/data/monitoringService.ts) — alert iff any
  24h rain ≥ 100mm (the ">100" `RAIN_BUCKET`) or any station offline. No new
  culvert-danger threshold was invented (explicit scope decision).
- **Dropped Search & Filter** (points 10–11): with only 3 stations they add UI
  weight for no payoff — confirmed with the user.
- Marker rebuild effect stays keyed on `[stations, rain24h]`; a **separate**
  effect keyed on `[selectedCode, hoveredCode, flyNonce]` toggles classes + flies
  — so highlighting never rebuilds the DOM markers (avoids popup flicker / lost
  listeners).

## 6. Where it got stuck (if anywhere)
No real snags. One deliberate simplification: the "status dot" from the plan
became an offline-only blinking `::after` dot + red ring rather than a dot on
every marker — the rain-bucket fill color already encodes severity, so a dot on
healthy markers would be noise.

## 7. How to verify it yourself
```bash
node scripts/check-i18n.mjs
cd web && npx tsc --noEmit -p . && npx vite build
```
Expected: `i18n check OK`, tsc silent, `✓ built`. In the app (Monitoring tab):
banner green normally / red on heavy rain or offline; click a table row → marker
highlights + map flies + chart line emphasizes; hover a marker → row highlights +
mini popup; trend column shows ↑/↓/−; "Phân tích chi tiết" reveals the charts;
freshness chip ticks. Toggle 🇻🇳/🇬🇧 on all new strings.

## 8. Gotchas / things to remember
- The 60s refresh only *visibly* changes data every 10 real minutes (data
  granularity is 10-min steps); the freshness time updates each minute regardless.
- `monSituation`'s heavy-rain threshold (`HEAVY_RAIN_24H_MM = 100`) is tied to the
  red `RAIN_BUCKET`; change both together if the scale changes.
- MapLibre popups are raw HTML (no React) — popup content is a template string
  built from `rowsRef`, and i18n labels are captured via `labelsRef` so a language
  toggle mid-hover still reads correctly.
- The value-flash relies on React reusing rows by `key={r.code}`; if the row key
  ever changes, every cell will flash on each render.
