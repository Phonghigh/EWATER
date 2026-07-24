# Follow-up (2026-07-24) — Draw the Vĩnh Long province boundary on the GIS map

**Date:** 2026-07-24 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Rendered the province admin boundary (a dashed purple outline + legend row) on
the GIS map — the data was already loaded but never drawn.

## 2. Where it fits
GIS map (Tab 2). The boundary gives the flood/drainage data a geographic frame
of reference (which province the network sits in).

## 3. The problem
Almost none — the interesting part was discovering there was **no data problem
to solve**: `loadData.ts` already fetches `province_boundaries_geojson` into
`data.provinceBoundary` (seeded from `shared/data/province-boundary.geojson`,
one MultiPolygon of the whole province). It simply had no map layer. So this was
a render-only change, not a data-sourcing one.

## 4. Concepts introduced
### Line layer over a (Multi)Polygon source = its outline
- **Plain definition:** a MapLibre `type: "line"` layer drawn from a polygon
  source renders the polygon's rings as lines — i.e. its border.
- **Why here:** the boundary is a filled admin area, but we only want the
  outline, so a line layer (dashed purple, zoom-scaled width) over the polygon
  source is exactly right — no separate line geometry needed.

## 5. How it was approached
Mirrored the existing `rivers` source+layer pattern in `GisMapCanvas.tsx`
(static geometry added once at mount). Draw order: above basemap/heatmap/rivers
but **below** the point markers, so the outline never covers a clickable node.
Colour `#7c3aed` (purple) chosen to stand apart from the blue rivers/flood and
the green/orange/red node severity — it reads as an administrative reference,
not another data layer. Added a matching legend row (dashed-line swatch) + i18n
key `gis.legend.provinceBoundary` (vi/en).

## 6. Where it got stuck (if anywhere)
No snags. Verified the source GeoJSON exists and is a real MultiPolygon (683
pts, spanning the province) before assuming the layer would show anything.

## 7. How to verify it yourself
```bash
node scripts/check-i18n.mjs
cd web && npx tsc --noEmit -p . && npx vite build
```
In the app (GIS tab): zoom out from the city-level default and the dashed purple
province outline appears; the legend lists "Ranh giới tỉnh".

## 8. Gotchas / things to remember
- The boundary spans the whole province, so at the city-level default zoom it's
  off-screen — you must zoom out to see it. (Don't mistake that for "not
  rendering.")
- `data.provinceBoundary` is static; added once at mount like `rivers`, not in a
  per-step effect.
- If a user toggle is ever wanted, add it to `GisLayerState`/`GisLayerPanel`;
  it's an always-on base reference for now.
