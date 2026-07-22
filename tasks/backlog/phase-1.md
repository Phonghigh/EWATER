# Phase 1 — Dashboard (Tab 1)

Mockup reference: `doc/template/Demo.pdf - Page 1 of 17.png` ("TAB 1. DASHBOARD -
TỔNG QUAN"). Layout top→bottom: 6 stat-cards → (map card + dự báo thời tiết
panel) → (chart "Dự báo mưa" + chart "Dự báo mực nước").

**Update 2026-07-22 (thu gọn scope Dashboard):** người dùng quyết định bỏ 3
khối khỏi Dashboard so với mockup gốc: card "Cảnh báo đang hoạt động" (P1-04,
đã hủy), khối "Khuyến nghị của AI", và khối "Tóm tắt ảnh hưởng" (cả hai vốn
nằm trong P1-06). Hai chart còn lại trong P1-06 đổi tên theo mockup gốc:
"Diễn biến mưa" → **"Dự báo mưa"**, "Diễn biến mực nước" → **"Dự báo mực
nước"**. Xem `tasks/INDEX.md` Phase 1 cho backlog cập nhật.

**Update 2026-07-20 (P0-17/18/19):** `shared/data/*.json` is no longer what
the running app reads — it's now only the seed source for
`data-pipeline/import_static_data.py`/`import_dynamic_data.py`, which push it
into Supabase. `web/src/loadData.ts` queries Supabase directly (views
`network_nodes_geojson` etc. + `simulation_runs`/`simulation_node_fill`/
`rain_forecasts`/`tide_scenarios` tables). The gaps described below (no
per-station identity, no pump/gate type, etc.) are unchanged — they're
properties of the underlying data, not of where it's stored — see
`tasks/BLOCKERS.md` `REAL-DATA-01` for the up-to-date state.

Data reality check (done during P1-01): `shared/data/` has no per-station
identity, no pump/gate type field on `outlets.geojson`, and no explicit "water
level in meters" series — only sewer-node fill ratio (`simulation.nodeFill`,
0..1.2, thresholds `warn:0.7`/`surcharge:1.0` from `map-style.json`) and a
single area-average `rainfall`/`rainForecast` series. Every field in this
phase is derived from what actually exists in `shared/data/`; nothing invents
station names or asset types the source data doesn't have. Pump/gate active
counts are a documented deterministic simplification (see P1-01 notes), not
random mock — later Phase 6 (`worksService`) will replace it with a real
per-asset registry if one gets added to `shared/data/`.

---

### P1-01 — dashboardService aggregate

**Objective.** A pure data function that turns `AppData` + a simulation step
index into the 6 headline dashboard numbers (flood points, flooded routes,
max rainfall, max water level, pump/gate activity) plus the small time series
the two charts need, so `P1-02`, `P1-03`, `P1-05`, `P1-06` only have to
render, not compute (P1-04 cancelled — see 2026-07-22 update above).

**Depends on.** none.

**Touches.** `web/src/data/dashboardService.ts` (new).

**Steps.**
1. Create `web/src/data/dashboardService.ts`, no framework imports — plain
   functions over `AppData` (`web/src/types.ts`) and a `stepIndex: number`.
2. `floodPointCount(step)` — count `manholes` whose
   `simulation.nodeFill[muid][step] >= simThresholds.surcharge`.
3. `floodedRouteCount(step)` — count `links` whose `fromNode` or `toNode`
   fill at `step` is `>= surcharge` (a route is "flooded" if either end node
   is surcharged).
4. Delta vs 06:00 — `simulation.start` is `"00:00"`, `stepMinutes` is 15, so
   06:00 = step 24. Return `current - countAt(24)` when `step >= 24`, else 0
   (no negative-time comparison).
5. `maxRainfallMm(step)` — sum of `simulation.rainfall[step-95..step]`
   (trailing 24h = 96 × 15-min steps, clamped at 0) — this is the "Mưa lớn
   nhất (24h)" stat; no per-station breakdown exists so it's the single
   area-average total, not attributed to a station name.
6. `maxWaterLevel(step)` — for each manhole, water level (m) =
   `invertLevel + fill(step) * (groundLevel - invertLevel)`; return the max
   value and its `muid` (no display name yet — Phase 3 sub-tab may add one).
7. `pumpsAndGates(step)` — **documented simplification**: split
   `outlets.geojson` features by parity of the numeric part of `muid`
   (odd → pump, even → gate) since the source has no type field. "Active"
   pump = `simulation.rainfall[step] > 0`; "closed" gate = same rainfall
   value above a fixed 10mm/step threshold. Comment in the code must say this
   is a placeholder until a real asset-type registry exists (P6-01).
8. `rainSeries(step, windowSteps)` / `waterLevelSeries(step, windowSteps)` —
   slice `simulation.rainfall` / a chosen representative node's fill-derived
   level for the two bottom charts, for whatever trailing window P1-06 asks
   for (1h/3h/6h/24h buttons in the mock — just expose a windowed slice
   function, let the component pick the window).
9. Export one `getDashboardOverview(data: AppData, step: number)` that
   bundles 2–7 into a single typed object for P1-02..P1-05 to consume.

**Done when.**
- `cd web && npx tsc --noEmit` clean.
- No i18n strings touched by this task (pure data, no UI) — `check-i18n.mjs`
  unaffected, run anyway to confirm still clean.
- `npm run build` clean.
- Manual sanity: log `getDashboardOverview(data, 40)` in a throwaway script
  or via `node`-evaluated JSON fixtures and confirm counts are non-negative
  and deltas are integers. Note: `maxWaterLevel` can legitimately exceed
  `groundLevel` when `fill > 1.0` — `nodeFill` ranges up to 1.2 in the source
  data, and values above the 1.0 surcharge threshold represent water rising
  *above* ground (flood depth), so `level > ground` is the intended
  semantics, not a bug. Verified against real `shared/data/`: step 40 (storm
  peak, rainfall 30.73mm) gives 120 flood points / 213 flooded routes vs. 0
  at steps 0/24/60/96 (dry), which tracks the rainfall hydrograph shape.

**Notes.** This task only adds the service file — no page changes, so no
learn-log-worthy UI concept, but the "derive from raw shared/data, mock only
what's structurally undeliverable, document the mock inline" pattern is worth
recording since it recurs in every remaining phase's `-01` task.

---

### P1-02 — Header + 6 stat-card

**Objective.** First real page: `web/src/pages/Dashboard.tsx` replaces the
`ComingSoon` placeholder at `/`. Renders the existing `PageHeader` (unchanged
pattern — title `nav.dashboard`), a summary bar (heading + "last updated"
time), and the 6 headline stat-cards from the mockup (`doc/template/Demo.pdf
- Page 1 of 17.png` top strip): Điểm ngập hiện tại, Tuyến đường ngập, Mưa lớn
nhất (24h), Mực nước cao nhất, Trạm bơm hoạt động, Cổng đang đóng.

**Depends on.** P1-01, P0-13.

**Touches.** `web/src/pages/Dashboard.tsx` (new), `web/src/App.tsx` (swap `/`
route), `web/src/components/Icon.tsx` (+3 icons: `route`, `droplet`, `pump`),
`web/src/i18n/strings.ts` (+`dash.*`), `web/src/styles.css` (+`.dash-*`
stat-card grid).

**Steps.**
1. `getDashboardOverview(data, step)` from P1-01 needs a `step`. There is no
   shared playback/step control yet (that's P2-01's job, `store.currentStep`
   doesn't exist). Until then, Dashboard uses `data.simulation.steps - 1` (the
   last available simulation step) as "current" — the most recent real data
   point, not a fabricated one. Comment this inline as a placeholder to be
   replaced once P2-01 introduces a shared step source.
2. Card 1 "Điểm ngập hiện tại" — `floodPointCount`, sub-label shows
   `floodPointDelta` as "▲/▼ N điểm so với 06:00" (or a neutral "không đổi"
   at 0) — real delta from `dashboardService`, not the mock's fixed "6 điểm".
3. Card 2 "Tuyến đường ngập" — `floodedRouteCount` / `floodedRouteDelta`, same
   pattern.
4. Card 3 "Mưa lớn nhất (24h)" — `maxRainfallMm`, one decimal, unit "mm".
   Mock shows a fake per-station attribution ("Trạm Vũng Liêm"); source data
   has no per-station rainfall (see phase-1.md intro + P1-01 notes) so this
   card's sub-label instead says "trung bình khu vực" (area average) — no
   invented station name.
5. Card 4 "Mực nước cao nhất" — `maxWaterLevel.levelM` (2 decimals, "m").
   Mock shows a fake location name ("Sông Tiền (Cầu Mỹ Thuận)"); real data
   only has a manhole `muid`, no display name yet, so sub-label shows the
   `muid` directly (e.g. "Nút {muid}") instead of inventing a river/bridge
   name.
6. Card 5 "Trạm bơm hoạt động" — `activePumpCount / totalPumpCount`.
7. Card 6 "Cổng đang đóng" — `closedGateCount / totalGateCount`.
8. Icons: reuse `alert-triangle` (card 1), `cloud-rain` (card 3); add `route`
   (card 2), `droplet` (card 4), `pump` (card 5); reuse `gate` (card 6).
9. `App.tsx`: replace the `/` route's `<ComingSoon title={t("nav.dashboard")}
   />` with `<Dashboard />`.
10. All new copy through `dash.*` i18n keys in both `vi`/`en` blocks.

**Done when.**
- `cd web && npx tsc --noEmit` clean.
- `node scripts/check-i18n.mjs` clean (no vi/en mismatch).
- `cd web && npm run build` clean.
- Manual check via `npm run dev`: `/` (guest and signed-in) shows the 6 cards
  with non-negative real numbers pulled from Supabase (not zeros/placeholders
  except where a count is legitimately 0), `LangToggle` flips every card's
  labels with nothing left in the other language.

**Notes.** No map/charts/side-panels here — those are P1-03, P1-05, P1-06
(P1-04 cancelled). The
`step = steps - 1` choice is the one build decision worth a learn-log entry:
why "last step" and not a fixed demo step, and what changes once P2-01 adds
real playback.

---

### P1-03 — Card bản đồ ngập hiện tại + link `/gis-map`

**Objective.** A compact, non-interactive MapLibre preview on the Dashboard
showing the current flood picture (flood zones + manholes colored by fill
severity), with a button that navigates to `/gis-map` (still `ComingSoon`
until Phase 2 lands — the link itself is what this task must get right, not
the destination page).

**Depends on.** P1-02.

**Touches.** `web/src/components/FloodMapPreview.tsx` (new),
`web/src/pages/Dashboard.tsx`, `web/src/i18n/strings.ts`, `web/src/styles.css`.

**Steps.**
1. `maplibre-gl` is already a dependency (kept through the P0-16 cleanup) but
   unused since then — this is its first real use in the redesign. Import
   `maplibre-gl/dist/maplibre-gl.css` once, in this component.
2. `FloodMapPreview` takes `data: AppData` and `step: number` as props (no
   new Supabase query — `AppData` already carries `manholes`, `floodZones`,
   `rivers`, `boundary`, `config` client-side, from P0-19). Build the map in a
   `useEffect` keyed on a ref div: raster basemap from
   `config.basemaps[Object.keys(config.basemaps)[0]]` (no explicit "default"
   basemap key in `MapStyleConfig`, so first entry — same assumption P2-03
   will need to resolve for real, flagged there), centered on `config.center`
   at `config.zoom`.
3. **Non-interactive by design**: construct with `interactive: false`. This
   is a preview thumbnail, not the real map — P2-03 ("dựng mới bằng MapLibre
   GL... toolbar đo/vẽ, minimap") owns the full interactive experience from
   scratch; this component must not grow toward duplicating that scope.
4. Layers: `floodZones` as a fill layer (`config.colors.flood`, low opacity)
   on a GeoJSON source built once; `rivers` as a thin line layer
   (`config.colors.river`); manholes as a circle layer whose paint color is a
   `match` expression driven by a `fillState` property this component
   computes per-feature at the given `step` (`"ok"`/`"warn"`/`"surcharge"`
   from `config.simThresholds`, colors `config.colors.simOk/simWarn/
   simSurcharge`) — computed once via a cloned `FeatureCollection`, not a
   live Supabase query (fill data is already in `data.simulation.nodeFill`
   client-side).
5. Card chrome: title (`dash.currentFloodMap`), the map div (fixed height,
   e.g. 320px), and a button/link (`dash.viewFullMap`, "Xem chi tiết bản đồ
   →") using React Router's `Link` to `/gis-map`.
6. Dashboard.tsx: render `<FloodMapPreview data={data} step={step} />` below
   the stat-card grid, reusing the same `step` P1-02 already computes
   (`simulation.steps - 1` placeholder).
7. Clean up the MapLibre instance (`map.remove()`) in the `useEffect`'s
   cleanup function — required to avoid leaking WebGL contexts across
   re-renders/navigation.

**Done when.**
- `cd web && npx tsc --noEmit` clean.
- `node scripts/check-i18n.mjs` clean.
- `cd web && npm run build` clean.
- Manual check via `npm run dev`: `/` shows a rendered map tile with visible
  manhole dots and flood-zone shading; clicking "Xem chi tiết bản đồ →"
  navigates to `/gis-map` (which shows `ComingSoon` until Phase 2 — expected,
  not a bug in this task).

**Notes.** This is the first MapLibre usage since the P0-16 full-codebase
deletion — worth a learn-log entry on why the map is deliberately
non-interactive here (scope boundary with P2-03) and how the per-step
`fillState` coloring is computed client-side from data already in `AppData`
rather than a new query.

---

### P1-05 — Card "Dự báo thời tiết"

**Objective.** A weather-forecast card using the real `data.rainForecast`
series already in `AppData` (`rain_forecasts`/`rain_forecast_points` via
P0-19) — an hourly rain strip + real cumulative rainfall windows — instead of
the mockup's fabricated temperature-per-hour strip and invented "85% xác
suất mưa lớn" figure, neither of which has a real data source anywhere in
this project.

**Depends on.** P1-02.

**Touches.** `web/src/components/WeatherForecastCard.tsx` (new),
`web/src/pages/Dashboard.tsx`, `web/src/i18n/strings.ts`, `web/src/styles.css`.

**Reality check.** `RainForecast` (`web/src/types.ts`) has `time: string[]`
(absolute ISO timestamps) + `precipitation: number[]` (mm) + `stepHours`, and
nothing else — no temperature, no textual condition, no probability. The
seed data is a static 72-hour demo snapshot generated 2026-07-10 (see
`shared/data/rain-forecast.json`), so its timestamps don't line up with any
live "now" — same situation as `dashboardService`'s simulation step (P1-02
notes): there is no shared "current time" concept yet. Treat index `0`
(`generatedAt`) as the forecast's own reference point and slice forward from
there, exactly like `step = simulation.steps - 1` is P1-02/P1-03's stand-in
for "current" until a real live-time source exists — don't try to align this
array to wall-clock `now`, it structurally can't.

**Steps.**
1. `WeatherForecastCard` takes `rainForecast: RainForecast` as a prop.
2. Hourly strip: slice `time`/`precipitation` indices `0..5` (6 hours).
   Format each timestamp to `HH:mm`. Classify each value into an intensity
   label via fixed thresholds (deterministic function of the real value, not
   invented per P1-01's "deterministic vs random mock" pattern):
   `0` → `dash.rainNone`, `<1` → `dash.rainLight`, `<5` → `dash.rainModerate`,
   `>=5` → `dash.rainHeavy`. Reuse the existing `cloud-rain` icon — no new
   per-condition icon set needed for this card.
3. Cumulative windows: real sums of `precipitation[0..N-1]` for `N = 3, 6,
   12, 24` (clamped to array length), rendered as "3h / 6h / 12h / 24h: X mm"
   — this directly replaces the mockup's real rain-window row, which already
   matched this shape.
4. Real derived summary line replacing the mockup's fabricated probability:
   count of hours with `precipitation > 0` in the first 24 entries, shown as
   "N/24 giờ có mưa" — an honest, computed number instead of an invented
   percentage.
5. No temperature anywhere on this card — not a gap, a deliberate omission
   (no real source exists; inventing per-hour temperatures would violate the
   pattern every prior Phase-1 task has held to).
6. Card footer link (`dash.viewFullForecast`, "Xem dự báo chi tiết →") to
   `/forecast` (Phase 4, still `ComingSoon`).
7. Wire into `Dashboard.tsx` next to/below `FloodMapPreview`, passing
   `data.rainForecast`.

**Done when.**
- `cd web && npx tsc --noEmit` clean.
- `node scripts/check-i18n.mjs` clean.
- `cd web && npm run build` clean.
- Manual check via `npm run dev`: `/` shows the hourly strip + 4 rain-window
  totals + the real "N/24 giờ có mưa" line, all matching a manual sum over
  `shared/data/rain-forecast.json`'s first entries; `LangToggle` flips every
  label.

**Notes.** The "mock is fine" latitude in the `INDEX.md` line's *done*
criterion ("render theo mock") is used here only for the parts with no real
source (no icon-per-condition art, no temperature) — the numeric content
itself comes from real Supabase-backed data like every other Phase 1 card,
consistent with the phase's running "derive from real data, document what's
structurally unavailable" discipline (see P1-01/P1-02/P1-03 notes).
