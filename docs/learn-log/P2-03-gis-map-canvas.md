# P2-03 — GIS map: real interactive MapLibre canvas + floating tools

**Date:** 2026-07-23 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Built the real, interactive `/gis-map` MapLibre canvas — a 6-tool floating
toolbar (select/pan/zoom/measure-distance/measure-area), a 2-button
top-right corner (export-map mock, real fullscreen), and a flood-severity
legend — all floating over a chrome-free map, wired to P2-02's layer
checkboxes wherever real data supports it.

## 2. Where it fits
- Third task of Phase 2 in [tasks/INDEX.md](../../tasks/INDEX.md).
- `/gis-map` finally has a real, navigable map (pan/zoom/click a manhole for
  a popup) instead of `FloodMapPreview`'s static, non-interactive thumbnail
  or P2-01/P2-02's `EmptyState` placeholder.

## 3. The problem
Two real gaps had to be resolved honestly rather than papered over:
1. **Basemap**: the spec asks for 4 basemap choices, but `config.basemaps`
   only has 2 real tile sources (`osm`, `satellite` — see P2-02's report).
   Now that there's an actual map to render, "just leave it inert" (P2-02's
   answer) isn't good enough — something has to paint when any of the 4 is
   selected.
2. **Layer checkboxes without matching geometry**: `rainStation` and the
   whole "Dự báo & mô hình" group (rain/water-level/flood forecast) have no
   real point/polygon Supabase table — no per-station rain gauges, no
   predicted-flood-extent geometry.

## 4. Concepts introduced

### Pre-adding both raster layers, toggling visibility instead of swapping style
- **Plain definition:** MapLibre's `map.setStyle()` — the "normal" way to
  change basemaps — tears down and rebuilds the whole style, which would
  also wipe every custom source/layer this component adds (flood zones,
  manholes, measurement lines). Instead, both `basemap-osm` and
  `basemap-satellite` raster layers are added once at load time, and
  switching basemaps just flips `visibility` between them.
- **Why it shows up here:** avoids a much more complex "re-add everything
  after every basemap change" `on('load')` dance, and doubles as the
  resolution for gap #1 above — `resolveBasemapKey()` maps all 4 UI choices
  onto whichever of the 2 real layers is the closer match (`light`→`osm`,
  `googleSatellite`→`satellite`) instead of fabricating a third tile source.

### Client-side geometry math instead of a mapping library
- **Plain definition:** "measure distance" sums haversine (great-circle)
  distances between consecutive clicked points; "measure area" projects the
  clicked [lng, lat] points onto a small local flat plane (equirectangular,
  centered on the polygon's own latitude) and runs the standard shoelace
  formula.
- **Why it shows up here:** adding `maplibre-gl-draw` or `turf` for 2
  formulas would be a new dependency for something ~15 lines of math can do
  at the accuracy this demo needs (city-block scale, not continental) — see
  the new `web/src/lib/geo.ts`.

### A layer checkbox can exist honestly with nothing behind it yet
- **Plain definition:** same principle P2-02 established for the basemap
  gap, now applied to point/polygon layers — `rainStation` and the 3
  forecast checkboxes toggle real React state (inherited from P2-02) but
  the map component doesn't render anything for them, documented inline
  rather than silently ignored.
- **Why it shows up here:** building fake rain-gauge markers or a
  fabricated "predicted flood extent" polygon would look like real data at
  a glance — worse than an honestly-inert checkbox.

## 5. How it was approached
- Reused the exact fill-severity color/threshold logic from
  `FloodMapPreview.tsx` (`fillState()`, `config.simThresholds`,
  `config.colors.sim{Ok,Warn,Surcharge}`) for both the manhole markers and
  the new legend — one 3-state color scheme across the whole app, not a
  second freshly-invented one. The legend's title also had to change from
  the literal mockup wording "Chú giải độ sâu ngập (m)" (a fine-grained
  meter-depth scale) to "Chú giải mức độ ngập" (severity levels) because the
  real `flood_zones` schema only carries 2 flat polygons with no per-depth
  bucket data (checked `web/supabase/migrations/20260720111710_network_gis_schema.sql`)
  — see [tasks/backlog/phase-2.md](../../tasks/backlog/phase-2.md) P2-03 for
  the note this deviation is recorded against.
- Extracted `classifyOutlet()` out of `dashboardService.ts` (previously
  inlined in `pumpsAndGates()`) so the map's pump/gate marker split uses the
  exact same deterministic muid-parity rule as the Dashboard's pump/gate
  stat cards — one definition of "which outlets are pumps," not two that
  could drift apart.
- `floodOpacity` is a prop with a default (`0.35`, matching
  `FloodMapPreview`'s constant) — a small forward-compatible seam for
  P2-04's opacity slider, not built ahead of need: P2-04's own spec already
  requires exactly this control, so naming the prop now avoids re-touching
  this component's internals later.

## 6. Where it got stuck (if anywhere)
No real snags. The basemap/tile-source and forecast-layer gaps were
anticipated from P2-02's report before writing any code, so the design
(pre-added dual raster layers, inert-but-real forecast checkboxes) was
decided upfront rather than discovered mid-implementation.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
node scripts/check-i18n.mjs
cd web && npm run build
```
Expected: all three clean. Manually: `npm run dev`, open `/gis-map` —
pan/zoom the map, click a manhole dot (popup with muid + severity), toggle
the ruler/area-measure tools and click a few points (badge shows live
distance/km or area/ha), toggle basemap radios in the left panel (osm ↔
satellite imagery actually swap; light/Google Satellite fall back to one of
the two), click "Toàn màn hình" (real browser fullscreen), click "Xuất bản
đồ" (transient "demo" toast, no file downloads).

## 8. Gotchas / things to remember
- `rainStation` and the 3 `gis.layer.groupForecast` checkboxes are wired in
  `GisLayerPanel` (P2-02) but this component renders nothing for them —
  don't assume they're broken if toggling them does nothing on the map.
- `resolveBasemapKey()` means 2 of the 4 basemap radio labels currently
  paint the *same* tiles as their real counterpart (`light`→same as `osm`,
  `googleSatellite`→same as `satellite`) — if a future task adds a real
  distinct tile source for either, update this function, not just the radio
  label.
- Measurement state (`measurePoints`) resets whenever the active tool
  button is clicked (even re-clicking the same tool) — there's no separate
  "clear" control by design (kept to the spec's tool list, nothing extra).
