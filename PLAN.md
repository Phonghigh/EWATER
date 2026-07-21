# EWATER - Vĩnh Long Drainage Network Demo

**Interactive map demo (web + mobile) of the Vĩnh Long city stormwater/drainage network, with animated mock flood-simulation results.**

| | |
|---|---|
| Purpose | Public demo - view/inspect network + mock flood simulation |
| Source data | MIKE URBAN/MIKE+ shapefile export, `D:\EWATER\SHP` (WGS84 UTM 48N) |
| Platforms | Web (React + MapLibre GL JS) and Mobile (React Native / Expo) |
| Backend | **None** - static GeoJSON files, no database, no auth |
| UI language | English |
| Est. effort | 6–7 working days |

---

## 1. Source data inventory

| Layer | Geometry | Features | Key attributes | App usage |
|---|---|---|---|---|
| `Manholes` | Point | 834 | MUID, InvertLeve, GroundLeve, Diameter, X, Y | Nodes; sim water levels |
| `Links` | Polyline | 844 | MUID, UpLevel_C, DwLevel_C, Length_C, Slope_C, Diameter, FROMNODE, TONODE | Pipes; topology; sim fill ratio |
| `Outlets` | Point | 44 | MUID (O-prefix), InvertLeve, GroundLeve | Discharge points |
| `Catchment_VL` | Polygon | 1 | - | Catchment boundary overlay |
| `Catchment_QH` | Polygon | 1 | - | **Skipped** (near-duplicate of Catchment_VL) |
| `RanhTpVL` | Polyline | 1 | - | City boundary line |
| `SongM11VL` | Polyline | 43 | RiverName, TopoID, length | River/canal network |

Facts that shape the design:

- `FROMNODE`/`TONODE` on Links reference Manhole MUIDs → a real **directed network graph** → upstream/downstream tracing is feasible client-side.
- Total ~1,700 features over a ~7 × 5 km area → GeoJSON is well under 2 MB → **no vector tiles, no GIS server needed**.
- CRS is `EPSG:32648` (WGS84 UTM 48N) → one-time reprojection to `EPSG:4326` in the pipeline.
- No simulation results exist in the source → the demo uses **synthetic but physically plausible** results generated from the real invert/ground elevations (clearly labeled "demo data" in the UI).

## 2. Architecture

```
D:\EWATER\
├── PLAN.md                  ← this document
├── README.md                ← how to run everything
├── SHP\                     ← source shapefiles (read-only input)
├── data-pipeline\           ← Python: SHP → GeoJSON + mock results (run once)
│   ├── requirements.txt
│   ├── convert_shp.py       ← reproject + clean attributes → GeoJSON
│   ├── build_topology.py    ← node/link graph index
│   └── generate_mock_sim.py ← 24 h storm event synthetic results
├── shared\                  ← single source of truth consumed by BOTH apps
│   ├── data\                ← generated GeoJSON + topology + simulation JSON
│   └── config\
│       └── map-style.json   ← layer colors, widths, thresholds (one place)
├── web\                     ← React 18 + TypeScript + Vite + MapLibre GL JS
└── mobile\                  ← Expo + React Native, MapLibre GL JS via WebView
```

**Data flow:** `SHP → (pipeline, offline, once) → shared/data/*.json → copied/symlinked into web/public/data and mobile/assets/data at build time.` No runtime server; the web app deploys as a static site (Netlify / Vercel / GitHub Pages), the mobile app bundles the data inside the binary.

### Why these choices

- **MapLibre GL JS** - free, no API token, vector rendering, same styling model on web and mobile (`@maplibre/maplibre-react-native`), so one shared style config drives both.
- **Basemaps** - OSM raster tiles (default) + Esri World Imagery (satellite toggle). Both free for demo use.
- **Vite** - fast dev server, trivial static build.
- **Expo** - easiest RN workflow; MapLibre native module requires an **Expo dev build** (`expo prebuild` / EAS), not Expo Go - documented in README.

## 3. Data pipeline (Phase 1)

### 3.1 `convert_shp.py`
- Read each shapefile with `pyshp`, reproject UTM 48N → WGS84 with `pyproj`.
- Rename truncated DBF fields to clean camelCase:
  `InvertLeve→invertLevel, GroundLeve→groundLevel, UpLevel_C→upLevel, DwLevel_C→downLevel, Length_C→length, Slope_C→slope, FROMNODE→fromNode, TONODE→toNode`.
- Drop internal fields (`OBJECTID`, `SHAPE_Leng`, `FID_*`, raw `UpLevel/DwLevel/Length` - the `_C` corrected values are kept).
- Coordinates rounded to 6 decimals (~10 cm) to keep files small.
- Output: `shared/data/{manholes,links,outlets,catchment,boundary,rivers}.geojson`.

### 3.2 `build_topology.py`
- Build adjacency maps from Links: `downstream[node] = [(linkId, toNode)...]`, `upstream[node] = [(linkId, fromNode)...]`.
- Output `shared/data/topology.json` → enables client-side BFS trace (highlight all upstream/downstream pipes+manholes from a clicked node).

### 3.3 `generate_mock_sim.py` - synthetic 24 h storm
- **Timeline:** 97 steps × 15 min (00:00–24:00).
- **Rainfall hyetograph:** gamma-shaped storm peaking at hour 7–8 (mm/h series, shown as a chart in the UI).
- **Manhole water level:** `level(t) = invert + depth_max_i · f(t)` where `f(t)` follows the storm with lag/attenuation noise per node (seeded RNG → deterministic). `depth_max_i` scaled so ~15 % of manholes surcharge (level ≥ ground level) around the peak - those drive the flood zones.
- **Pipe fill ratio:** mean of endpoint node fill fractions, clamped 0–1.
- **Flood zones:** cluster the surcharging manholes (grid-based), emit one polygon per cluster (convex hull + buffer) with a per-timestep `severity` 0–1 series; the app animates opacity/visibility from severity.
- Output: `shared/data/simulation.json` (compact arrays, 2-decimal values) + `shared/data/flood-zones.geojson`.

**Acceptance:** all outputs valid GeoJSON/JSON; manholes land on Vĩnh Long in a web map sanity-check; simulation shows a clear rise-peak-recede pattern; total data < 5 MB.

## 4. Web app (Phase 2)

Stack: React 18, TypeScript, Vite, `maplibre-gl`, `zustand` (small global state), `recharts` (level chart). No CSS framework - hand-rolled CSS for full control of the map UI.

### Screens & components
```
src/
├── main.tsx / App.tsx           app shell: map + panels
├── map/
│   ├── MapView.tsx              MapLibre init, basemap switcher, layer mounting
│   ├── layers.ts                add/update GeoJSON sources & styled layers
│   └── popup.tsx                feature click → attribute popup
├── panels/
│   ├── LayerPanel.tsx           layer toggles + legend
│   ├── SearchBox.tsx            find by MUID → flyTo + highlight
│   ├── FeatureInfo.tsx          selected feature details + trace buttons
│   └── SimulationPanel.tsx      play/pause, time slider, rainfall chart,
│                                selected-manhole level chart
├── sim/
│   ├── simEngine.ts             load simulation.json, timestep interpolation
│   └── simStyling.ts            per-timestep feature-state updates
├── network/
│   └── trace.ts                 BFS over topology.json (up/downstream)
└── state/store.ts               zustand: layers, selection, sim time, mode
```

### Feature spec
| Feature | Detail |
|---|---|
| Base map | OSM default, satellite toggle, scale bar, zoom to extent button |
| Network layers | Pipes: line width+color by diameter class (<0.6 / 0.6–1.0 / ≥1.0 m). Manholes: circles, radius by zoom. Outlets: distinct triangle/symbol. Rivers: blue casing. Boundary/catchment: dashed outline. |
| Popups | Click any feature → attributes table (levels in m, diameter in mm, slope ‰, length m) |
| Search | MUID search with prefix matching across manholes/links/outlets, flyTo + pulse highlight |
| Network trace | From selected manhole: "Trace upstream / downstream" → highlight path (feature-state), show count + total pipe length; clear button |
| Simulation mode | Toggle switches styling to sim mode: manholes colored by fill % (green→amber→red, red = surcharged), pipes by fill ratio, flood polygons fade in by severity. Time slider + play (4×/16× speed). Rainfall bar chart with time cursor. Selecting a manhole shows its level-vs-time line chart with ground-level reference line. "DEMO DATA" badge always visible in sim mode. |
| About panel | Dataset description, disclaimer that results are synthetic |

**Acceptance:** loads in <3 s on broadband; all layers toggle; trace works on any manhole; sim animates smoothly at 97 steps; runs from `npm run build` output on a static host.

## 5. Mobile app (Phase 3)

Redesigned (2026-07) as a **citizen flood-warning app**, not a network-inspection tool: it answers "is my area flooding," "what does the flood map look like," and "how many minutes until it floods" — nothing else. Expo (TypeScript). Map is a `WebView` embedding MapLibre GL JS (loaded from CDN) instead of `@maplibre/maplibre-react-native`, so it runs directly in Expo Go with **no native dev build required**.

- Status screen: GPS auto-detected location (persisted, refreshable, with manual pick-on-map override) → nearest manhole → current status (ok/warn/bad) + minutes-to-flood forecast, at one fixed "now" timestep (`src/domain/nowStep.ts`) — no simulation scrubber.
- Map screen: same flood-zone GeoJSON as web, colored discrete red/amber/green by current severity; no pipe/manhole layers (kept legible for non-technical users).
- Data bundled via `assets/data/*.json` (copied by `npm run sync-data`), same `shared/config/map-style.json` thresholds/colors as web.
- Domain logic (`nearestManhole`, status/forecast calc) ported from `web/src/network/nearest.ts` and `web/src/pages/MyArea.tsx`.

**Acceptance:** runs via `npx expo start` in Expo Go (no `expo prebuild`/EAS build needed); status + map screens agree on flood status color for the same location.

## 6. Polish & delivery (Phase 4)

- Consistent branding (name, colors, icon), English throughout, metric units.
- README: regenerate data, run web dev/build, run mobile dev build, deploy notes.
- Manual QA checklist pass on Chrome, Firefox, Android.

## 7. Timeline

| Day | Work |
|---|---|
| 1 | Phase 1 - pipeline, all data generated & validated |
| 2–3 | Web: map, layers, popups, search |
| 4 | Web: trace + simulation mode |
| 5–6 | Mobile app |
| 7 | Polish, docs, deploy |

## 8. Risks / notes

- **Mock ≠ real results** - UI badges everything as demo data; when real MIKE `.res1d` results arrive, only `generate_mock_sim.py` is replaced, apps unchanged.
- **49** links (not 10 as originally estimated — recounted 2026-07-20 while importing into Supabase, see `data-pipeline/import_static_data.py` output) reference `fromNode`/`toNode` values that don't exist in `manholes.geojson`/`outlets.geojson` (5 of the 49 have completely empty from/to fields — corrupted rows, not just dangling references) - trace treats unknown nodes as terminals; these 49 links were excluded from the `network_links` Supabase import (kept in the demo GeoJSON as-is).
- MapLibre RN needs a dev build - allow time for the first Android build (~15 min EAS or local Android SDK).
- OSM tile usage policy is fine for a demo; for production swap in a commercial/vector tile provider.

## 9. Web redesign in progress (2026-07-20 →)

`web/src` is being rebuilt on top of the foundation above into a 9-page
"Urban Flood Digital Twin Platform" sidebar UI (Dashboard, Bản đồ GIS, Quan
trắc thời gian thực, Dự báo, What-if Analysis, Công trình & Vận hành, Thiệt
hại & Tác động, Báo cáo, Quản trị hệ thống) with a 3-tier access model
(Khách/Cơ quan/Admin replacing the old citizen/authority/leadership + `/my-area`
setup) and a swappable mock/real `web/src/data/` service layer. Stack stays
React + MapLibre + Supabase — no new framework introduced. Note this
supersedes §4–5 above wherever they describe the old FRMIS-style page
structure (Portal/MyArea/Dashboard/Monitor/MapPage/Report/Database) and the
old citizen `/my-area` mobile-linked flow; §1–3 (data pipeline, shared data)
are unaffected. Tracked as an atomic task backlog in [tasks/](tasks/) — see
[tasks/README.md](tasks/README.md) and [tasks/INDEX.md](tasks/INDEX.md) for
current status.
