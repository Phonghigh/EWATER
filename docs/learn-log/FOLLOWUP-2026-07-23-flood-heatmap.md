# Follow-up — Flood heatmap + water-level labels + cluster warnings on `/gis-map`

**Date:** 2026-07-23 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Replaced the GIS map's flat 2-polygon flood fill with a native MapLibre
`heatmap` layer driven by all 834 real manhole fill values, demoted the old
polygons to a thin reference outline, and added floating real water-level
labels (top 5 nodes) + warning-icon markers at active flood-cluster
centroids — all derived from data already loaded, no fabrication.

## 2. Where it fits
- Direct follow-up to the user's mockup comparison after P2-03/P2-04
  shipped: "raster đang gom pixel lại làm mất thông tin, không rõ chỗ nào
  đang ngập" (the flood layer's pixels are grouped together, losing
  information, unclear where's actually flooded).
- Builds on `web/src/data/gisService.ts` (P2-04) and `web/src/lib/geo.ts`
  (P2-03) rather than starting a new module.

## 3. The problem
`flood_zones` (the Supabase table backing the old flood layer) only ever
had 2 static convex-hull polygons per simulation run — a coarse
approximation computed once from clustering *ever-flooded* manholes, not a
true fine-grained flood-depth grid. Filling those 2 shapes with one flat
color inevitably looks blocky and uninformative next to the mockup's dense,
richly-varying blue wash. The real per-node detail (834 individual fill
ratios, one per manhole, changing every step) was already loaded into the
app (used for the `manholes-circle` layer) but never used for the *area*
visualization — only for point markers.

## 4. Concepts introduced

### A native heatmap layer as an honest way to visualize sparse point data densely
- **Plain definition:** MapLibre's `heatmap` layer type takes a set of
  weighted points and renders a smooth, GPU-interpolated density cloud —
  no server-side raster tileset, no new geometry table, just a different
  paint interpretation of point data the app already has.
- **Why it shows up here:** the real data *is* 834 discrete points, not a
  true continuous flood-depth raster — a heatmap is the technique that
  turns real point data into a dense-looking visualization *without*
  inventing values between the points that were never actually simulated.
  This is different from, say, generating a fake fine grid server-side,
  which would create the appearance of far more precision than the
  underlying simulation actually has.

### Two color languages must stay visually separate
- **Plain definition:** this app already uses green/orange/red to mean
  "how severe is this specific point" (manhole circles, legend). The new
  heatmap uses a blue-only ramp for "how much of this area is flooded" —
  deliberately not reusing green/orange/red, so a location can't be
  misread as "this whole area is at 🔴 danger level" when the heatmap is
  actually just answering a different question (density/extent, not
  per-point severity).

### Demoting a layer instead of deleting it
- **Plain definition:** `flood_zones`' 2 polygons still carry real
  information (roughly where the historically-flood-prone clusters are,
  and — via `severity[step]` — whether a cluster is active right now) even
  though they're too coarse to be the *primary* flood visualization
  anymore. Turned into a thin, fixed-opacity outline instead of removing
  them outright, and reused (via their centroids) to place the new warning
  markers — so the "coarse but real" data still earns its keep.
- **Why it shows up here:** demoting instead of deleting avoided throwing
  away a working, already-shipped layer just because a better one arrived
  — the outline still answers "roughly where's the flood-prone boundary,"
  which the heatmap alone doesn't draw crisply.

## 5. How it was approached
- Investigated methodically before writing any plan: this session had
  already fixed 2 real map bugs earlier today (blank canvas from a missing
  `style`, and dead click handlers on outlets) by comparing working vs.
  broken code side by side rather than guessing — same discipline applied
  here, first confirming (by reading `data-pipeline/generate_mock_sim.py`
  and the `flood_zones` migration) exactly what data existed before
  designing a fix, instead of assuming a richer dataset was available.
- Entered plan mode given the scope (5 distinct sub-changes touching a
  shipped, user-facing visualization) and asked 2 clarifying questions
  before writing code: whether to replace or keep the old polygon layer,
  and whether to scope this to the heatmap alone or include the labels/
  warning markers too — both answered by the user before implementation
  started, avoiding a redo.
- Reused existing formulas rather than inventing new ones:
  `topWaterLevelNodes()` is the same `invert + fill*(ground-invert)` level
  formula `dashboardService.maxWaterLevel` already established, just
  returning the top N instead of only the single highest;
  `activeFloodZoneCentroids()` shares its "is this zone active" filter
  with `floodStatsAtStep` via one extracted helper
  (`activeFloodZonesAtStep`) instead of duplicating that condition a
  second time.
- Labels/warning icons implemented as `maplibregl.Marker` (plain DOM
  elements), not a GeoJSON symbol layer with sprite icons — consistent
  with how the existing click popups already work (`maplibregl.Popup`,
  also DOM-based), and avoids needing a sprite sheet just for a handful of
  markers that change every step.

## 6. Where it got stuck (if anywhere)
No real snags — the main design risk (2 color languages colliding) was
caught during planning rather than after building, by explicitly deciding
the heatmap's color ramp before writing the paint expression rather than
defaulting to the same green/orange/red scheme already used elsewhere.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
node scripts/check-i18n.mjs
cd web && npm run build
```
Expected: all three clean, i18n key count unchanged at 109 (no new
translatable strings — labels show only numbers/muid). User-confirmed via
a live `npm run dev` session: the flood visualization now reads as a
detailed, loaned blue cloud instead of 2 flat polygons, comparable in
richness to the reference mockup; water-level labels and warning markers
appear/disappear correctly as the playback step changes.

## 8. Gotchas / things to remember
- The heatmap's `heatmap-opacity` is now what P2-04's "Độ trong suốt"
  slider controls — the old `flood-zones-fill` layer it originally
  targeted no longer exists (renamed `flood-zones-outline`, fixed
  opacity, not slider-controlled).
- `topWaterLevelNodes`/`activeFloodZoneCentroids` markers are recreated
  from scratch every time the step (or the manhole/outlet data effect's
  other dependencies) changes — don't try to animate/transition them
  smoothly without first switching to a diff-based update strategy.
- `manholes-circle`'s radius is now zoom-dependent (near-invisible below
  zoom ~12) — this is intentional decluttering, not a rendering bug, if a
  future check at low zoom seems to be "missing" the circle markers.
