# Phase 1 — Dashboard (Tab 1)

Mockup reference: `doc/template/Demo.pdf - Page 1 of 17.png` ("TAB 1. DASHBOARD -
TỔNG QUAN"). Layout top→bottom: 6 stat-cards → (map card + cảnh báo/dự báo
thời tiết panel) → (mưa chart + mực nước chart + khuyến nghị AI + tóm tắt ảnh
hưởng).

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
the two charts need, so `P1-02`..`P1-06` only have to render, not compute.

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

**Notes.** No map/charts/side-panels here — those are P1-03..P1-06. The
`step = steps - 1` choice is the one build decision worth a learn-log entry:
why "last step" and not a fixed demo step, and what changes once P2-01 adds
real playback.
