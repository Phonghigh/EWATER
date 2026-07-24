# P2-02 — GIS map "Lớp dữ liệu" panel

**Date:** 2026-07-23 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Added the left "Lớp dữ liệu" panel on `/gis-map` — 3 flat groups of
checkboxes/radio (real-time layers, forecast layers, basemap) holding local
UI state, no map wired to it yet.

## 2. Where it fits
- Second task of Phase 2 (Bản đồ GIS) in [tasks/INDEX.md](../../tasks/INDEX.md).
- After this task, `/gis-map` has a real left panel next to the top bar
  (P2-01) — toggling a checkbox/radio changes state you can inspect in
  React DevTools, but nothing visible changes yet since P2-03 (the actual
  MapLibre map) hasn't landed to read this state.

## 3. The problem
The user's simplified spec (2026-07-23, see `tasks/backlog/phase-2.md`)
asks for 4 basemap radio options: "Bản đồ nền sáng" (light, default), "Ảnh
vệ tinh" (satellite), "Google Satellite", "OpenStreetMap". Checking the real
config (`shared/config/map-style.json` → `config.basemaps`) turned up only
**2** actual tile sources: `osm` and `satellite` (Esri World Imagery). There
is no "light" vector basemap and no Google tile source (Google tiles need an
API key and ToS acceptance this project doesn't have) — building all 4 as if
they were equally real would mean either fabricating a Google tile URL or
quietly aliasing two different-sounding options to the same tiles.

## 4. Concepts introduced

### UI state can be honestly ahead of its data source
- **Plain definition:** it's fine to let the user select an option in the
  UI even when the thing that option controls doesn't have real data behind
  it yet — as long as that gap is documented at the point of selection, not
  hidden.
- **Why it shows up here:** this task's job is the panel's state and
  checkbox/radio behavior, not the map. Blocking on "we don't have Google
  tiles" would stall an unrelated task; instead, "light"/"googleSatellite"
  are real, selectable state values with an inline "(sắp có)" / "(coming
  soon)" marker, and a code comment flagging exactly what P2-03 has to
  resolve before selecting them does anything.

### Grouped checkbox state vs. exclusive radio state in one component
- **Plain definition:** the same panel holds two different state shapes —
  `Record<key, boolean>` for independently-togglable layers (checkboxes) and
  a single `BasemapKey` string for the mutually-exclusive basemap choice
  (radio, `name="gis-basemap"` groups them natively).
- **Why it shows up here:** conflating the two (e.g. modeling basemap as
  4 independent booleans) would let two basemaps be "selected" at once, or
  none — real basemap selection needs exactly one active value at all times.

## 5. How it was approached
- Kept layer/basemap state in `GisMap.tsx`, same pattern as P2-01's
  `step`/`playing`/`speed` — one `GisLayerState` object threaded down as a
  single controlled prop + `onChange`, not three separate `useState` calls
  in the child, so the parent can eventually pass this state to P2-03's map
  component without re-plumbing.
- Rejected reproducing the mockup's 2 sub-tabs ("Danh sách lớp"/"Nhóm lớp")
  and "Quản lý lớp" button — per the user's explicit 2026-07-23 decision,
  cut entirely rather than stubbed out.

## 6. Where it got stuck (if anywhere)
No real snags — the only judgment call was the basemap data-gap handling
above, resolved by "state now, tiles when P2-03 needs them" rather than
blocking this task on it.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
node scripts/check-i18n.mjs
cd web && npm run build
```
Expected: all three clean. Manually: `npm run dev`, open `/gis-map`, toggle
a few checkboxes/radios in the left panel — no visual change yet (expected,
map lands in P2-03), but React DevTools shows `layerState` updating.

## 8. Gotchas / things to remember
- `light` and `googleSatellite` basemap keys are selectable but inert —
  don't assume selecting them will render anything different once P2-03
  lands until that task actually adds tile sources for them (or a
  migration/config update supplies real ones).
- The panel's `state`/`onChange` shape (`GisLayerState`) is the contract
  P2-03 will consume to filter map layers — changing its shape later means
  updating both files together.
