# P3 — Quan trắc thời gian thực (single-tab redesign)

**Date:** 2026-07-24 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Built Tab 3 as a single monitoring page (station map + rainfall table + culvert
water-level table + rain-trend/top-10/hourly-distribution charts), backed by
**newly seeded synthetic per-station data in Supabase**.

## 2. Where it fits
Phase 3 in [tasks/INDEX.md](../../tasks/INDEX.md) (revised: 9 sub-tabs → 1 page,
5 component groups). After this task the app has a working real-time-monitoring
screen; before, `/monitoring/*` was a `ComingSoon` stub.

## 3. The problem
The revised spec asks for named rain stations with 10-min/hourly/daily readings,
named culverts with river-vs-inside levels + gate open/closed, a top-10 ranking,
and a per-station hourly distribution. **None of that data existed in Supabase** —
only one city-wide hourly rain series, one 15-min sim series, one tide curve, and
unnamed `muid` nodes. So the real work was *creating a data source* the project's
"data-in-DB, never mock JSON in the frontend" rule would accept, then deriving six
different views from it.

## 4. Concepts introduced

### Array-per-row time series (`numeric[]`) vs. normalized readings
- **Plain definition:** store a whole time series as one Postgres array column on
  the entity row, instead of one table row per (entity, timestamp).
- **Why here:** mirrors the existing `simulation_node_fill.fill_series numeric[]`
  pattern — one query loads all stations, no thousands of rows, timestamps implied
  by index × 10-min from a 00:00 origin. `rain_stations.rain_10min`,
  `culverts.{river,inside,gate}_series` all follow this.

### "Current step" anchoring (no live clock in the data)
- **Plain definition:** the data spans exactly one 24h day with no calendar date,
  so real wall-clock hour:minute maps onto a fixed step index.
- **Why here:** same convention as `currentSimStep` ([simTime.ts](../../web/src/lib/simTime.ts)),
  but at 10-min resolution — `currentMonitoringStep()` in
  [monitoringService.ts](../../web/src/data/monitoringService.ts). Trailing windows
  (10p/1h/3h/6h/24h) wrap modulo 144, so "24h ago" folds back onto the same day.

### Graceful degradation for additive data
- **Plain definition:** a new data source that isn't deployed yet should leave the
  rest of the app working, not crash it.
- **Why here:** `loadAppData()` fetches everything up front; if the new views don't
  exist (migration/seed not applied), `loadRainStations`/`loadCulverts` catch the
  error and return `[]` (Monitoring shows its empty state) instead of throwing and
  bricking every page — unlike the fail-fast core loaders.

### recharts multi-series (lines + grouped bars)
- **Plain definition:** one `<Line>`/`<Bar>` per data key renders multiple series
  on a shared axis.
- **Why here:** first multi-series charts in the app — the rain-trend line chart
  ( ≤5 selectable stations) and the grouped hourly-distribution bar (Tổng + 3
  stations). Prior charts ([RainForecastChart](../../web/src/components/RainForecastChart.tsx))
  were single-series; the toggle/`MAX_LABELS` idiom was reused.

### MapLibre DOM markers (no glyph setup)
- **Plain definition:** attach an HTML element per point via `maplibregl.Marker`
  instead of a `symbol` text layer.
- **Why here:** the station map needs a colored circle + mm number per station;
  DOM markers avoid MapLibre's glyph/font stack for text labels. Reused the
  init + `ResizeObserver` + basemap-visibility-toggle pattern from
  [GisMapCanvas.tsx](../../web/src/components/gis/GisMapCanvas.tsx), not the whole
  (GIS-coupled) component.

## 5. How it was approached
- **Data strategy** (user decision): seed synthetic data into Supabase (Option A)
  over frontend-derivation or real-only. New migration
  `20260724120000_monitoring_stations.sql`, generator `generate_monitoring_data.py`
  (seeded `Random(42)`: 3 rain stations [Trạm Mỹ Thuận / Trạm 1 / Trạm 2] with a
  gamma hyetograph per station normalised to a target 24h total so the ranking
  differs; 8 culverts [Ngã Cậy, Cà Dâm, Ông Thẩm, Tân Hữu, Kinh Cụt, Cầu Lầu,
  Cầu Kè, Long Thạnh] with a tidal river series + linear-reservoir inside series;
  gate closes when river > inside + margin), and `import_dynamic_data.py` extension.
- **Typed client:** hand-added the two tables + two views to
  [database.types.ts](../../web/src/lib/database.types.ts) (no live DB to regenerate
  from) so `supabase.from("rain_stations_geojson")` type-checks.
- **Derivations** centralised in `monitoringService.ts`; components are presentational.
- **Names as proper nouns:** station/culvert names (địa danh) are the same in VI/EN;
  only column headers, status/gate labels go through `mon.*` i18n keys.

## 6. Where it got stuck
- **Windows console cp1252** couldn't `print()` Vietnamese from the generator →
  switched log lines to ASCII (`ensure_ascii=False` still keeps the JSON files
  correct). No other real snags.

## 7. How to verify it yourself
```bash
cd data-pipeline && python generate_monitoring_data.py   # regenerates the JSON
cd ../web && npx tsc --noEmit && npm run build
node ../scripts/check-i18n.mjs
```
Expected: generator prints "15 stations", "10 culverts"; tsc/build clean;
i18n "OK - 163 keys, vi/en in sync". Then (user, needs creds): apply the migration
+ `SUPABASE_ACCESS_TOKEN=… python import_dynamic_data.py --project-ref <ref>`, then
`npm run dev` and sweep LangToggle on `/monitoring`.

## 8. Gotchas / things to remember
- The page shows its **empty state** until the migration + importer run on the live
  Supabase project — the code degrades gracefully, it does not auto-seed.
- The "Mưa 10 phút / 15p mỗi step" spec was reconciled to the actual 10-min sensor
  cadence; "Mưa ngày" shows 6×4h blocks because the demo only holds 24h of data.
- Rain-bucket colors (`RAIN_BUCKETS`) are shared by the map markers and the legend —
  change them in one place ([monitoringService.ts](../../web/src/data/monitoringService.ts)).
- If you add fields to `rain_stations`/`culverts`, update the migration, the `*_geojson`
  view, `database.types.ts`, the loader mapping, and the `RainStation`/`Culvert` types.
