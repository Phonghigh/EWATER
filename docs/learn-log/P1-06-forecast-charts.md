# P1-06 — 2 card chart dưới: "Dự báo mưa" + "Dự báo mực nước"

**Date:** 2026-07-22 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Added two `recharts`-based chart cards to the Dashboard — a rain-forecast
bar chart and a water-level-forecast line chart — each with its own
24H/48H/72H window toggle, both driven by real Supabase-backed series
already loaded in `AppData`.

## 2. Where it fits
- Phase 1 (Dashboard, Tab 1) in [tasks/INDEX.md](../../tasks/INDEX.md), the
  last card task before P1-07's i18n sweep closes the phase.
- Completes the Dashboard's real-data build-out: P1-02 (headline numbers),
  P1-03 (map), P1-05 (weather summary), and now P1-06 (trend charts).

## 3. The problem
The original mockup's two bottom charts were named "Diễn biến mưa"/"Diễn
biến mực nước" ("rainfall/water-level *history*") and showed a per-station
historical comparison — but there's no per-station rainfall data anywhere in
this project (documented back in P1-01), so that shape was never buildable
honestly. The 2026-07-22 backlog update (see `tasks/INDEX.md`) renamed both
to "Dự báo" (*forecast*) instead, which reframes the problem: these charts
now map cleanly onto two real forward-looking series that already exist in
`AppData` — `rainForecast` and `tide` — rather than a historical comparison
that would need data the project doesn't have.

## 4. Concepts introduced

### Reusing a "dead" dependency instead of adding a new one
- **Plain definition:** `recharts` was a project dependency from before the
  P0-16 full-codebase cleanup, kept in `package.json` but unused since then
  (same fate as `maplibre-gl`, reactivated in P1-03).
- **Why it shows up here:** before writing any chart code, it's worth
  checking whether the tooling already exists rather than reaching for a new
  library — `package.json` is itself a source of truth for "what's already
  approved to depend on."

### Treating documented-synthetic data as real for UI purposes
- **Plain definition:** `tide-demo.json`'s source `note` field says outright
  this is *synthetic* semi-diurnal tide data ("no tide station exists this
  far up the Mekong tributary system"), not a real gauge reading. A pending
  migration drops that `note` column from the DB — but only because the app
  never reads/displays it, not because the data stopped being "demo."
- **Why it shows up here:** the chart still treats `tide.levelM` as real
  numbers pulled from a real Supabase table (no client-side fabrication),
  same as every other series in this project (the whole `shared/data/*`
  corpus is demo content by design — see `tasks/ROUTINE.md`'s data policy).
  The distinction that matters for this task is "real query vs. invented
  number," not "synthetic origin vs. real-world origin" — both `rainForecast`
  and `tide` pass the former bar even though their content is demo/synthetic.

## 5. How it was approached
- Considered per-chart bespoke components — rejected in favor of one shared
  `ForecastChartsRow.tsx` with a generic `buildSeries()`/`WindowToggle`
  since both charts need identical windowing logic (slice from index 0 for
  `24H`/`48H`/`72H`) and only differ in chart type (bar vs. line) and units.
- Window options changed from the mockup's `1H`/`3H`/`6H`/`24H` (rain) and
  `6H`/`12H`/`24H`/`72H` (tide) to a single shared `24H`/`48H`/`72H` set —
  both source series are exactly 72 hourly points, so `1H`/`3H`/`6H` windows
  would show 1-6 bars, which reads as broken rather than useful. Sized the
  toggle to what the real data can actually show.
- Toggle buttons reuse the visual language already established by
  `.page-subtab2` (small pill buttons, active state = filled accent) rather
  than inventing a new control style — same instinct as reusing `recharts`
  itself.

## 6. Where it got stuck (if anywhere)
No real snags. Cross-checked both series' real ranges before trusting the
charts would show visible variation: rainfall peaks at 5.0mm somewhere in
the 72h window, tide ranges `0.985m`–`1.415m` — both non-flat, so the charts
have something real to show rather than a flat line that would look broken.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
node scripts/check-i18n.mjs   # run from repo root
cd web && npm run build
cd web && npm run dev         # visit /, scroll to the 2 charts below the
                               # map/weather row, click 24H/48H/72H on each
                               # independently
```
Expected: all three commands clean; both charts render visibly varying
bars/line (not flat); each chart's window toggle only affects that chart.

## 8. Gotchas / things to remember
- Both charts share the same `24H`/`48H`/`72H` window set specifically
  because both source series are 72 hourly points — if a future phase swaps
  in a longer/shorter real forecast source, revisit the window sizes to
  match, don't just keep these numbers as a hardcoded default.
- `recharts` joining the bundle again (alongside `maplibre-gl` from P1-03)
  pushes the chunk-size warning further (now ~1.6MB / 445KB gzip) — same
  follow-up noted in P1-03: worth a code-splitting pass once more phases
  need these libraries, not something to fix piecemeal per task.
