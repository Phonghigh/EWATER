# EWATER - Vĩnh Long Drainage Network Demo

Interactive map demo (web + mobile) of the Vĩnh Long city stormwater drainage network
(834 manholes, 844 pipes, 44 outlets, rivers, catchment) exported from a MIKE URBAN model,
with an animated **synthetic** 24-hour storm flood simulation.

See [PLAN.md](PLAN.md) for the full architecture and feature plan.

```
SHP/            source shapefiles (input, WGS84 UTM 48N)
data-pipeline/  Python: SHP → GeoJSON + topology + mock simulation
shared/         generated data + style config (single source for both apps)
web/            React + Vite + MapLibre GL JS
mobile/         Expo (React Native) + MapLibre
```

## 1. Regenerate data (only when SHP files change)

```powershell
pip install -r data-pipeline/requirements.txt
python data-pipeline/convert_shp.py
python data-pipeline/build_topology.py
python data-pipeline/generate_mock_sim.py
```

Outputs land in `shared/data/`. Both apps copy from there automatically
(`predev`/`prebuild` hooks in web, `sync-data` script in mobile).

## 2. Web app

```powershell
cd web
npm install
npm run dev       # http://localhost:5173
npm run build     # static site in web/dist - deploy anywhere (Netlify/Vercel/Pages)
```

Features: layer toggles + legend, basemap switcher (OSM/satellite), click popups with
engineering attributes, MUID search, upstream/downstream network trace, and a flood
simulation mode with time slider, rainfall chart, and per-manhole water-level charts.

## 3. Mobile app

The MapLibre native module is **not supported in Expo Go** - use a dev build:

```powershell
cd mobile
npm install
npm run android   # requires Android SDK; runs expo prebuild + build + launch
# or: npx eas build --profile development --platform android
```

Features: same map/layers, tap-to-inspect bottom sheet, simulation slider, GPS locate-me.

## Notes

- All simulation results are **synthetic demo data** (deterministic, seeded), derived
  from the real invert/ground elevations - not hydraulic model output. Replace
  `data-pipeline/generate_mock_sim.py` with a real MIKE result converter when available.
- No backend: everything is static files; the web app deploys as a plain static site.
- Shared styling (colors, thresholds, basemaps) lives in `shared/config/map-style.json`.
