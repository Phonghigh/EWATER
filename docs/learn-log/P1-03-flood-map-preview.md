# P1-03 — Card bản đồ ngập hiện tại + link `/gis-map`

**Date:** 2026-07-22 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Added a small, non-interactive MapLibre map card to the Dashboard showing
current flood zones and manholes colored by fill severity, with a link to
the (not-yet-built) full GIS map page.

## 2. Where it fits
- Phase 1 (Dashboard, Tab 1) in [tasks/INDEX.md](../../tasks/INDEX.md), third
  task, right after the header/stat-cards (P1-02).
- Before this task the Dashboard was numbers-only. Now it also shows *where*
  the flood points are, at a glance, without needing to visit the real map.

## 3. The problem
`maplibre-gl` has been a dependency since the original scaffold but was
fully deleted from the codebase in P0-16 (the "no pre-scaffolding" cleanup
back in Phase 0) — this task is its first real use in the redesign, so there
was no existing MapLibre setup code to adapt. The harder question wasn't
"how do I draw a map" but "how much map do I build here," given that Phase 2
(`P2-03`) is explicitly scoped to build the *real*, fully interactive GIS map
"from scratch." Building too much here would either duplicate that work or
box P2-03 into reusing a component that was never designed for toolbars,
layer panels, or playback.

## 4. Concepts introduced

### Scope boundary via a deliberate non-feature (`interactive: false`)
- **Plain definition:** MapLibre's `interactive: false` constructor option
  disables every built-in input handler (pan, zoom, rotate) in one flag,
  turning the map into a static, decorative render.
- **Why it shows up here:** it's the mechanism that keeps this component
  honestly a "preview thumbnail" rather than a competing implementation of
  the interactive map P2-03 owns. Without it, the natural next request would
  be "add zoom controls," "add a layers toggle" — each pulling this
  component toward duplicating P2-03's scope.

### Deriving map paint data from already-loaded client state, not a new query
- **Plain definition:** the manhole fill-severity color isn't a column in
  Supabase — it's computed per step from `data.simulation.nodeFill`, which
  `loadData.ts` already pulled into `AppData` client-side (P0-19). This
  component clones the manholes `FeatureCollection` once per render, adding
  a computed `fillState` property, and lets MapLibre's own `match` paint
  expression pick the color — no server round-trip, no duplicate simulation
  logic (reuses the same threshold semantics as `dashboardService.ts`).
- **Why it shows up here:** it's the same "derive from what's already loaded,
  don't invent a new data path" discipline used throughout Phase 0/1, applied
  to map paint instead of a stat number.

## 5. How it was approached
- Basemap: `config.basemaps[Object.keys(config.basemaps)[0]]` — `MapStyleConfig`
  has no explicit "default basemap" key, so the first entry is used. Flagged
  in the phase-1 spec as an assumption P2-03 will need to resolve properly
  (e.g. an admin-configurable default) when it builds the real layer-switcher.
- Considered querying Supabase again for a lighter, pre-filtered flood-only
  dataset — rejected: `AppData` already has everything needed in memory
  (`manholes`, `floodZones`, `rivers`, `config`), and a second network
  round-trip for the same data the Dashboard already loaded would be pure
  waste.
- The MapLibre instance is created inside a `useEffect` keyed on `[data, step]`
  and cleaned up via `map.remove()` on unmount/re-run — required to avoid
  leaking WebGL contexts, since React can re-run effects (StrictMode,
  fast refresh) and each `new maplibregl.Map(...)` allocates a real WebGL
  context that isn't garbage-collected automatically.

## 6. Where it got stuck (if anywhere)
No real snags. One thing double-checked: `MapStyleConfig.zoom` is commented
in `types.ts` as "percentage (0-100)" but the actual seeded value is `13.2`
— a normal MapLibre zoom level, not a percentage. Used the raw value as
MapLibre's `zoom` directly (which is what every consumer of this config will
have to do); the stale comment is a pre-existing minor inaccuracy in
`types.ts`, not something this task's data flow depends on being fixed.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
node scripts/check-i18n.mjs   # run from repo root
cd web && npm run build
cd web && npm run dev         # visit /, confirm the map tile renders with
                               # colored manhole dots + flood-zone shading,
                               # click "Xem chi tiết bản đồ →" -> /gis-map
```
Expected: all three commands clean; map card renders below the stat-cards;
the link navigates to `/gis-map` (shows `ComingSoon` until Phase 2 — expected).

## 8. Gotchas / things to remember
- Don't add interactive controls (zoom buttons, layer toggles, draw tools) to
  `FloodMapPreview` — that scope belongs to P2-03's from-scratch GIS map.
  If Dashboard ever needs more map interactivity, that's a sign P1-03's
  card should just deep-link harder into `/gis-map`, not grow itself.
- Adding `maplibre-gl` into the main bundle pushed the JS chunk from ~402KB
  to ~1.2MB (gzip ~116KB → ~337KB) — Vite now warns about chunk size. Not
  fixed in this task (out of scope for an atomic Dashboard-card task); worth
  a dynamic `import()`/code-splitting pass once P2-03 also needs MapLibre,
  so both call sites share one lazily-loaded chunk instead of bloating the
  initial page load twice.
