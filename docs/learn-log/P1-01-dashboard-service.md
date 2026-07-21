# P1-01 — dashboardService aggregate

**Date:** 2026-07-20 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

**Addendum (2026-07-20, same day):** the "mock" framing below described the
data *source* (`shared/data/*.json`, bundled as static files), not
`dashboardService.ts`'s logic. That source has since been replaced: static
GIS data was migrated + imported into Supabase tables (real MIKE/SWMM data),
dynamic data (simulation/rain-forecast/tide/flood-zones) was imported as-is
(still demo content, per `PLAN.md` §8 — just no longer a bundled file), and
`P0-19` rewrote `web/src/loadData.ts` to query Supabase directly instead of
`fetch()`-ing static JSON. `dashboardService.ts` itself needed **zero
changes** — it only ever consumed the `AppData` shape, never cared where
`loadData.ts` got it from. That's the payoff of the pure-function design
described in §4 below: the "mock vs. real" swap happened entirely in one
file, one layer away. See `tasks/BLOCKERS.md` `REAL-DATA-01` for the full
migration trail and what's still unresolved (`node_id_crosswalk`, outlet
type, rainfall unit).

## 1. In one sentence
A pure data-aggregation module (`web/src/data/dashboardService.ts`) that turns the raw simulation dataset into the 6 headline numbers on the Dashboard tab (flood points, flooded routes, max rainfall, max water level, pump/gate activity) for a given simulation time-step, so the page components built next (P1-02..P1-06) only render, not compute.

## 2. Where it fits
- Phase 1 — Dashboard (Tab 1), the first task after Phase 0 finished the app shell/routing/auth.
- Before this task there was no data layer at all in the redesigned `web/src` — Phase 0 deleted the last one on purpose (see `P0-16`). After this task, the Dashboard page has real numbers to render instead of `<ComingSoon/>`.

## 3. The problem
The mockup (`doc/template/Demo.pdf - Page 1 of 17.png`) shows stats like "Mưa lớn nhất (24h)" attributed to a named station ("Trạm Vũng Liêm") and a clean "pump 6/11 active" count. The actual `shared/data/` files don't have that: `outlets.geojson` has no type field to tell pumps from gates, there's no per-station rainfall breakdown (just one area-average series), and there's no explicit "water level in meters" — only a sewer-pipe fill ratio (0 to 1.2). The real work was deciding *what each mockup number actually maps to* in data that doesn't have 1:1 fields for it, without inventing station names or asset types that don't exist.

## 4. Concepts introduced

### Surcharge ratio as flood depth
- **Plain definition:** `simulation.nodeFill` is a 0..1.2 ratio of how full a sewer pipe segment is; 1.0 means "exactly full" (`surcharge` threshold from `map-style.json`), and values above 1.0 mean the pipe can't hold any more and water is backing up above ground.
- **Why it shows up here:** to get a manhole's water level in meters, the formula `invertLevel + fill * (groundLevel - invertLevel)` naturally goes *above* `groundLevel` once `fill > 1.0` — which is exactly right physically (that's flood depth), not a bug to clamp away. Confirmed this by computing the max-level node against real data and seeing `levelM > groundLevel` at a storm-peak step, then updating the task spec's acceptance note instead of "fixing" the formula.

### Deterministic mock vs. random mock
- **Plain definition:** when a data field genuinely doesn't exist in the source (pump vs. gate type), a mock value should still be a fixed function of stable inputs (here: parity of the numeric part of `muid`), not `Math.random()` — otherwise the same outlet flips category every render/reload.
- **Why it shows up here:** `pumpsAndGates()` needs *some* way to split 44 untyped `outlets.geojson` features into two categories for the "6/11 pump" and "4/9 gate" stat cards. A parity split is arbitrary but stable and documented inline as a placeholder for Phase 6's real asset registry.

## 5. How it was approached
- Read the mockup image first, then checked what `shared/data/` actually contains (`manholes.geojson` properties, `simulation.json` structure, `map-style.json` thresholds) before writing any function — confirmed field names (`muid`, `invertLevel`, `groundLevel`, `fromNode`/`toNode`) by grepping sample features with a throwaway `node -e` script rather than guessing.
- Rejected inventing a per-station name for the rainfall stat (mockup says "Trạm Vũng Liêm") since no station identity exists anywhere in the current data model — the field is just the area-average total, undocumented station attribution would be a fabricated fact, not a mock.
- Wrote plain, framework-free functions (`floodPointCount`, `floodedRouteCount`, `maxRainfallMm`, `maxWaterLevel`, `pumpsAndGates`, `rainSeries`, `waterLevelSeries`) plus one aggregating `getDashboardOverview()`, all taking `AppData` + a step index — no React, no service-seam abstraction (that pattern was explicitly reversed in `P0-16`; every phase writes its data function fresh now).

## 6. Where it got stuck (if anywhere)
No real snags. The one thing that needed a second look: the spec I wrote for myself (`tasks/backlog/phase-1.md`) initially asserted `maxWaterLevel <= groundLevel` as an acceptance check — running it against real data proved that false at a storm-peak step, which turned out to be correct behavior (see §4), so I corrected the spec rather than the code.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
node scripts/check-i18n.mjs   # unaffected by this task, still checked
cd web && npm run build
```
Expected: all three clean. There's no UI yet to click through — sanity-checked the actual numbers with a throwaway `node -e` script against `shared/data/*.json` directly (see `tasks/backlog/phase-1.md` "Done when" notes for the real output: step 40 gives 120 flood points / 213 flooded routes vs. 0 at dry steps).

## 8. Gotchas / things to remember
- `pumpsAndGates()`'s pump/gate split and active/closed logic are placeholders keyed off `muid` parity and rainfall intensity — don't treat the resulting counts as ground truth when Phase 6 (`worksService`, `P6-01`) adds a real asset-type registry; replace this function's body then, not its callers' expectations.
- `maxWaterLevel` can legitimately exceed a node's `groundLevel` — don't "fix" that by clamping if it resurfaces; it's the intended flood-depth semantics once `fill > 1.0`.
