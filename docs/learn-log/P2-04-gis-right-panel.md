# P2-04 — GIS map right panel: opacity, flood stats, minimap

**Date:** 2026-07-23 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Added the right panel on `/gis-map`: a flood-zone opacity slider wired live
to the map canvas, 3 real step-derived flood stats (area/avg depth/max
depth), and a static reference minimap — no "Công cụ phân tích" block.

## 2. Where it fits
- Fourth task of Phase 2 in [tasks/INDEX.md](../../tasks/INDEX.md).
- `/gis-map` now has all 3 columns from the mockup (minus the cut pieces):
  layer panel (P2-02) — map (P2-03) — right panel (P2-04). The map's
  flood-zone layer is finally controllable from the UI instead of a fixed
  constant.

## 3. The problem
The mockup's "Thống kê ngập hiện tại" (Diện tích ngập/Độ sâu TB/Độ sâu lớn
nhất) needed real numbers, but `flood_zones` (the only Supabase table
shaped like "flood extent") stores just 2 static polygons with a per-step
`severity` array (0..1, a normalized "how flooded" score — not literal
square meters or depth). There's no column that's directly "area in m²" or
"depth in meters" for a zone. The numbers had to be *derived* rather than
read off a column, using the same honesty standard as
`dashboardService.ts`'s existing derived numbers.

## 4. Concepts introduced

### Deriving flood-zone area from geometry + a step-gated severity flag
- **Plain definition:** "Diện tích ngập" isn't a stored number — it's the
  sum of each `flood_zones` polygon's real area (via the `polygonAreaM2()`
  helper from P2-03), counted only for zones whose `severity[step] > 0`
  (i.e., actually contributing to flooding at the current step, not just
  historically flood-prone).
- **Why it shows up here:** the polygon's *shape* is static across the
  whole simulation run (built once from a convex hull of ever-flooded
  manholes), but whether it's *currently* flooded varies by step — using
  the static shape without the severity gate would show the same area at
  every step, including dry ones.

### Reusing an existing depth interpretation for a new metric
- **Plain definition:** "Độ sâu TB"/"Độ sâu lớn nhất" reuse the exact
  `(fill - 1) * (groundLevel - invertLevel)` formula `dashboardService.ts`'s
  `maxWaterLevel` already established as "flood depth above ground when
  fill exceeds 1.0" — averaged/maxed here over every currently-surcharged
  manhole instead of just the single worst one.
- **Why it shows up here:** inventing a second, different depth formula for
  this panel (even one that "looks similar") would create 2 sources of
  truth for the same physical concept — reusing the interpretation, not
  just copying code, keeps the app internally consistent.

### A live-controlled paint property vs. a static default
- **Plain definition:** `GisMapCanvas`'s `floodOpacity` prop (added in
  P2-03 with a default value, anticipating this exact task) is now driven
  by real `useState` in `GisMap.tsx` instead of always using its default —
  the slider's `onChange` flows straight into a `setPaintProperty` call
  already wired in P2-03's effect.
- **Why it shows up here:** confirms the "name the prop now, wire it when
  the consumer lands" seam from P2-03's report actually paid off — no
  changes needed inside `GisMapCanvas` itself, only its caller.

## 5. How it was approached
- New `web/src/data/gisService.ts` (not added to `dashboardService.ts`)
  since this is GIS-map-specific math, following the same "each phase gets
  its own service file when it actually needs one" pattern as
  `dashboardService.ts` for Phase 1.
- Minimap: a second, small, non-interactive MapLibre instance (same
  `interactive: false` pattern as `FloodMapPreview.tsx`) showing a fixed
  rectangle over `config.bounds` — **not** a live-synced viewport indicator
  of the main map's current pan/zoom, which would require the 2 separate
  MapLibre instances to share viewport state. Documented as a known
  simplification rather than silently pretending it's live.
- Confirmed no "Công cụ phân tích" block was rebuilt — the 2 measurement
  tools already live in P2-03's map toolbar; the rest of the mockup's
  analysis tools (elevation pick, cross-section profile, zone stats export)
  are cut per the 2026-07-23 decision, not stubbed as "coming soon."

## 6. Where it got stuck (if anywhere)
No real snags — the area/depth formulas were derivable directly from
already-understood data (P2-03's `polygonAreaM2`, `dashboardService.ts`'s
existing depth interpretation), so no new investigation was needed.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
node scripts/check-i18n.mjs
cd web && npm run build
```
Expected: all three clean. Manually: `npm run dev`, open `/gis-map`, drag
the opacity slider in the right panel — the flood-zone fill on the map
visibly fades in/out live; the 3 stat numbers should read 0 at a dry step
and non-zero during the storm peak (cross-check against P1-01's known
step-40-peak numbers if in doubt).

## 8. Gotchas / things to remember
- The minimap's rectangle is a fixed `config.bounds` box, not the real map's
  live viewport — don't read it as "where the main map is currently
  looking."
- `floodStatsAtStep`'s area number only counts zones with `severity[step] >
  0` — a zone that was flooded earlier in the run but isn't at the current
  step contributes 0, even though its polygon still exists in the data.
