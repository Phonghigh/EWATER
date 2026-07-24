import { useEffect, useRef, useState, type ReactNode } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection } from "geojson";
import warningIconRaw from "@material-symbols/svg-400/outlined/warning.svg?raw";
import pumpIconRaw from "@material-symbols/svg-400/outlined/water_pump.svg?raw";
import gateIconRaw from "@material-symbols/svg-400/outlined/gate.svg?raw";
import trendUpIconRaw from "@material-symbols/svg-400/outlined/arrow_upward.svg?raw";
import trendDownIconRaw from "@material-symbols/svg-400/outlined/arrow_downward.svg?raw";
import trendFlatIconRaw from "@material-symbols/svg-400/outlined/trending_flat.svg?raw";
import Icon, { type IconName } from "../Icon";
import { useI18n } from "../../i18n/I18nContext";
import { classifyOutlet } from "../../data/dashboardService";
import { topWaterLevelNodes, activeFloodZoneCentroids } from "../../data/gisService";
import { polylineLengthM, polygonAreaM2 } from "../../lib/geo";
import { stepTimeLabel } from "../../lib/simTime";
import { floodHeatmapPaint } from "../../lib/floodHeatmap";
import type { AppData, MapStyleConfig } from "../../types";
import type { GisLayerState, BasemapKey } from "./GisLayerPanel";
import type { StationHit } from "./GisSearchBox";

type FillState = "ok" | "warn" | "surcharge";
type ToolMode = "select" | "pan" | "distance" | "area";

function fillState(fill: number, thresholds: MapStyleConfig["simThresholds"]): FillState {
  if (fill >= thresholds.surcharge) return "surcharge";
  if (fill >= thresholds.warn) return "warn";
  return "ok";
}

// Both `osm`/`satellite` raster layers are pre-added and this just toggles
// which one is visible, so switching basemaps never needs a full
// `map.setStyle()` (which would drop our custom sources/layers). The earlier
// non-functional "light"/"googleSatellite" options were removed (2026-07-24).
function resolveBasemapKey(basemap: BasemapKey): "osm" | "satellite" {
  return basemap === "satellite" ? "satellite" : "osm";
}

// Rasterizes a Material Symbols SVG (which has no `fill` attribute of its
// own — the app's DOM `Icon` component relies on CSS `fill: currentColor`
// to color it, which doesn't apply to a rasterized map image) into a white
// icon MapLibre can use as `icon-image`. Colored badge backgrounds are the
// existing `circle` layers underneath; this just draws the white glyph on
// top, so no canvas compositing is needed — 2 layers, same coordinates.
function loadIconImage(map: maplibregl.Map, id: string, rawSvg: string) {
  if (map.hasImage(id)) return;
  const whiteSvg = rawSvg.replace("<path ", '<path fill="#ffffff" ');
  const img = new Image(48, 48);
  img.onload = () => {
    if (!map.hasImage(id)) map.addImage(id, img);
  };
  img.src = `data:image/svg+xml;base64,${btoa(whiteSvg)}`;
}

const TOOLS: { mode: ToolMode; icon: IconName }[] = [
  { mode: "select", icon: "select" },
  { mode: "pan", icon: "pan" },
  { mode: "distance", icon: "ruler" },
  { mode: "area", icon: "area" },
];

/** The real interactive GIS map (P2-03) - MapLibre canvas filling all
 *  available space, no bordered chrome, with floating toolbar/corner
 *  buttons/legend directly over the canvas (same convention as
 *  `FloodMapPreview.tsx`, just interactive here). Only layers with a real
 *  data source are wired to the P2-02 checkboxes - `rainStation` and the
 *  whole "Dự báo & mô hình" group have no matching point/polygon geometry
 *  in Supabase yet (no per-station rain gauges, no predicted-flood-extent
 *  table), so those checkboxes exist and can be toggled but don't change
 *  anything on the map yet. That gap is inherited from P2-02, not new here. */
export default function GisMapCanvas({
  data, step, layerState, floodOpacity = 0.35, children, focusMode = false, onToggleFocusMode, onFocusStation, flyTarget,
}: {
  data: AppData;
  step: number;
  layerState: GisLayerState;
  floodOpacity?: number;
  /** Station picked in the top-bar search box (2026-07-24 follow-up) —
   *  a change here flies the map to that point + opens a labeled popup. Kept
   *  prop-driven (an effect keyed on it) rather than an imperative ref handle,
   *  matching every other map mutation in this component. */
  flyTarget?: StationHit | null;
  /** Rendered inside `.gis-canvas-wrapper` alongside the built-in floating
   *  controls (tools, corner buttons, legend) - lets a caller float extra
   *  UI (the "Lớp dữ liệu" panel + its toggle, as of the 2026-07-23
   *  follow-up) directly over the map without it competing for row width
   *  in the parent layout. */
  children?: ReactNode;
  /** Focus Mode (P2-19) - whether the caller (`GisMap.tsx`) currently has it
   *  on, so this corner button reflects/toggles the *page*-level state
   *  (hiding the layer/right panels + bottom row lives outside this
   *  component's own DOM, so the state itself has to live in `GisMap.tsx`). */
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
  /** "Theo dõi trạm này" popup button (P2-15/P2-19) - only manhole popups
   *  offer it, since that's the only point layer with a water-level trend
   *  worth focusing on. */
  onFocusStation?: () => void;
}) {
  const { t } = useI18n();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  // DOM-based `Marker`s (water-level labels, cluster warning icons) aren't
  // GeoJSON-source-driven like the other layers — they're plain divs added
  // directly to the map, so keeping the current instances in refs is what
  // lets each step update remove the old ones before adding new ones.
  const waterLevelMarkersRef = useRef<maplibregl.Marker[]>([]);
  const warningMarkersRef = useRef<maplibregl.Marker[]>([]);

  const [mode, setMode] = useState<ToolMode>("select");
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [exportToast, setExportToast] = useState(false);

  // The init effect below only runs once (mount) and registers its click/
  // hover handlers there too — without refs, those handlers would keep
  // using the `t`/`mode` values captured at that first render (a stale
  // closure), e.g. popups staying in the old language after `LangToggle`,
  // or hover-cursor logic not seeing later tool-mode changes.
  const tRef = useRef(t);
  tRef.current = t;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  // Same stale-closure guard for the popup trend calc (needs the *current*
  // step, not whatever it was at mount) and the "Theo dõi trạm này" button
  // (needs the latest `onFocusStation` callback identity).
  const stepRef = useRef(step);
  stepRef.current = step;
  const onFocusStationRef = useRef(onFocusStation);
  onFocusStationRef.current = onFocusStation;
  const dataRef = useRef(data);
  dataRef.current = data;

  // Init map once.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { config } = data;

    const map = new maplibregl.Map({
      container: el,
      center: config.center,
      zoom: config.zoom,
      attributionControl: false,
      // A bare/empty style — every real source and layer (basemap rasters,
      // flood zones, rivers, manholes, outlets) is added in the `load`
      // handler below. Omitting `style` entirely means the map has nothing
      // to load, so `load` never fires and nothing (not even a
      // `ResizeObserver`-triggered `resize()`) works — MapLibre throws
      // "There is no style added to the map."
      style: { version: 8, sources: {}, layers: [] },
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    mapRef.current = map;

    // MapLibre measures the container's size once, at construction time. In
    // a flex layout like this page's (`.gis-body` -> `.gis-canvas-wrapper`),
    // the container can still be 0x0 at that exact moment even though it
    // visually resizes to its correct size a moment
    // later — the WebGL canvas then stays permanently blank until something
    // calls `map.resize()`. A `ResizeObserver` catches every subsequent size
    // change (initial layout settling, sidebar/panel toggles, window
    // resize) and keeps the map in sync, instead of relying on one lucky
    // synchronous measurement.
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(el);

    map.on("load", () => {
      map.addSource("basemap-osm", {
        type: "raster", tiles: [config.basemaps.osm.tiles], tileSize: 256, attribution: config.basemaps.osm.attribution,
      });
      map.addLayer({ id: "basemap-osm", type: "raster", source: "basemap-osm" });
      map.addSource("basemap-satellite", {
        type: "raster", tiles: [config.basemaps.satellite.tiles], tileSize: 256, attribution: config.basemaps.satellite.attribution,
      });
      map.addLayer({ id: "basemap-satellite", type: "raster", source: "basemap-satellite", layout: { visibility: "none" } });

      // `manholes` source declared here (empty; real data + `fillWeight`
      // arrive via the data effect below) so the heatmap layer — which
      // reads it — can be added right after.
      map.addSource("manholes", { type: "geojson", data: { type: "FeatureCollection", features: [] } });

      // Detailed flood visualization (replaces a flat 2-polygon fill —
      // see docs/learn-log/FOLLOWUP-2026-07-23-flood-heatmap.md): a native
      // MapLibre heatmap over the real per-node fill ratio of all 834
      // manholes, not a fabricated raster. Blue-toned ramp (not the
      // green/orange/red used for point severity elsewhere) so "how
      // flooded is this area" and "how severe is this specific node"
      // stay visually distinct languages. The old `flood_zones` 2-polygon
      // shape was briefly kept as a thin reference outline on top of this,
      // but its convex-hull edges cut confusingly across streets with no
      // legend explaining what they were — removed per user feedback
      // (2026-07-23), the heatmap alone is clearer. `flood_zones` data is
      // still used (client-side only, not as a map layer) for the warning
      // markers' cluster centroids below.
      map.addLayer({
        id: "flood-heatmap", type: "heatmap", source: "manholes",
        paint: floodHeatmapPaint(config.colors.flood, floodOpacity),
      });

      map.addSource("rivers", { type: "geojson", data: data.rivers });
      map.addLayer({
        id: "rivers-line", type: "line", source: "rivers",
        paint: { "line-color": config.colors.river, "line-width": 2 },
      });

      // Circle radius grows with zoom instead of a fixed 3px — at the
      // full-extent zoom the heatmap above already communicates "where is
      // it flooded"; individual node dots only need to stand out once the
      // user has zoomed in far enough to want to click one (matches the
      // reference mockup, which shows the heat cloud but not hundreds of
      // discrete station dots at city-wide zoom).
      map.addLayer({
        id: "manholes-circle", type: "circle", source: "manholes",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 0, 14, 2, 17, 4],
          "circle-color": ["match", ["get", "fillState"], "surcharge", config.colors.simSurcharge, "warn", config.colors.simWarn, config.colors.simOk],
          "circle-stroke-width": 1, "circle-stroke-color": "#fff",
        },
      });

      map.addSource("outlets", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "outlets-pump", type: "circle", source: "outlets", filter: ["==", ["get", "assetType"], "pump"],
        paint: { "circle-radius": 10, "circle-color": "#0f766e", "circle-stroke-width": 1, "circle-stroke-color": "#fff" },
      });
      map.addLayer({
        id: "outlets-gate", type: "circle", source: "outlets", filter: ["==", ["get", "assetType"], "gate"],
        paint: { "circle-radius": 10, "circle-color": "#16a34a", "circle-stroke-width": 1, "circle-stroke-color": "#fff" },
      });
      // White pump/gate glyphs on top of the colored circle badges above —
      // 2 symbol layers sharing the same `outlets` source/filters, not a
      // replacement for the circles (which still carry the color coding).
      loadIconImage(map, "icon-pump", pumpIconRaw);
      loadIconImage(map, "icon-gate", gateIconRaw);
      map.addLayer({
        id: "outlets-pump-icon", type: "symbol", source: "outlets", filter: ["==", ["get", "assetType"], "pump"],
        layout: { "icon-image": "icon-pump", "icon-size": 0.3, "icon-allow-overlap": true },
      });
      map.addLayer({
        id: "outlets-gate-icon", type: "symbol", source: "outlets", filter: ["==", ["get", "assetType"], "gate"],
        layout: { "icon-image": "icon-gate", "icon-size": 0.3, "icon-allow-overlap": true },
      });

      map.addSource("measure-line", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} } });
      map.addLayer({ id: "measure-line", type: "line", source: "measure-line", paint: { "line-color": "#f59e0b", "line-width": 2, "line-dasharray": [2, 1] } });
      map.addSource("measure-area", { type: "geojson", data: { type: "Feature", geometry: { type: "Polygon", coordinates: [[]] }, properties: {} } });
      map.addLayer({ id: "measure-area-fill", type: "fill", source: "measure-area", paint: { "fill-color": "#f59e0b", "fill-opacity": 0.2 } });
      map.addLayer({ id: "measure-area-line", type: "line", source: "measure-area", paint: { "line-color": "#f59e0b", "line-width": 2 } });

      // "Chọn": click a marker to see its details — deliberately minimal
      // (a native popup: muid + severity/asset type), not the full info
      // panel that's P2-04's job. Wired for all 3 point layers (manholes,
      // pump outlets, gate outlets) — previously only manholes had a click
      // handler at all, so pump/gate markers were fully inert.
      const severityLabel = (state: string) =>
        state === "surcharge" ? tRef.current("gis.legend.surcharge")
          : state === "warn" ? tRef.current("gis.legend.warn")
          : tRef.current("gis.legend.ok");

      function showPopup(e: maplibregl.MapLayerMouseEvent, html: string) {
        const popup = new maplibregl.Popup().setLngLat(e.lngLat).setHTML(html).addTo(map);
        // Popups render raw HTML (no React), so the "Theo dõi trạm này"
        // button's click handler has to be wired up imperatively after the
        // element exists in the DOM, same as any other MapLibre popup
        // customization — `onFocusStationRef` avoids a stale callback if
        // `onFocusStation` changes identity between renders.
        popup.getElement()?.querySelector("#gis-popup-focus-btn")?.addEventListener("click", () => {
          onFocusStationRef.current?.();
        });
      }

      // Real trend, not a fabricated one: compares the same fill ratio the
      // heatmap/circle color already use, at the current step vs. the step
      // right before it (no previous step at step 0 -> "stable").
      function waterLevelTrend(muid: string): "up" | "down" | "stable" {
        const step = stepRef.current;
        if (step <= 0) return "stable";
        const series = dataRef.current.simulation.nodeFill[muid];
        const now = series?.[step] ?? 0;
        const prev = series?.[step - 1] ?? now;
        const delta = now - prev;
        if (delta > 0.01) return "up";
        if (delta < -0.01) return "down";
        return "stable";
      }
      const trendIcon = { up: trendUpIconRaw, down: trendDownIconRaw, stable: trendFlatIconRaw };
      const trendLabelKey = { up: "gis.popup.trendUp", down: "gis.popup.trendDown", stable: "gis.popup.trendStable" } as const;

      map.on("click", "manholes-circle", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const props = f.properties ?? {};
        const muid = String(props.muid);
        const invert = Number(props.invertLevel ?? 0);
        const ground = Number(props.groundLevel ?? 0);
        const fillWeight = Number(props.fillWeight ?? 0);
        const levelM = invert + fillWeight * (ground - invert);
        const trend = waterLevelTrend(muid);
        showPopup(e, `
          <div class="gis-popup">
            <div class="gis-popup-title">${tRef.current("gis.layer.waterLevel")}: ${muid}</div>
            <div class="gis-popup-row"><span>${tRef.current("gis.popup.status")}</span><strong class="gis-popup-badge gis-popup-badge--${props.fillState}">${severityLabel(String(props.fillState))}</strong></div>
            <div class="gis-popup-row"><span>${tRef.current("gis.popup.value")}</span><strong>${levelM.toFixed(2)} m</strong></div>
            <div class="gis-popup-row"><span>${tRef.current("gis.popup.trend")}</span><span class="gis-popup-row-icon">${trendIcon[trend]} ${tRef.current(trendLabelKey[trend])}</span></div>
            <div class="gis-popup-updated">${tRef.current("gis.popup.updatedAt")}: ${stepTimeLabel(dataRef.current.simulation.start, dataRef.current.simulation.stepMinutes, stepRef.current)}</div>
            <button type="button" id="gis-popup-focus-btn" class="gis-popup-focus-btn">${tRef.current("gis.popup.focusStation")}</button>
          </div>
        `);
      });
      map.on("click", "outlets-pump", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const props = f.properties ?? {};
        showPopup(e, `
          <div class="gis-popup">
            <div class="gis-popup-title">${tRef.current("gis.layer.pumpStation")}: ${props.muid}</div>
            <div class="gis-popup-updated">${tRef.current("gis.popup.updatedAt")}: ${stepTimeLabel(dataRef.current.simulation.start, dataRef.current.simulation.stepMinutes, stepRef.current)}</div>
          </div>
        `);
      });
      map.on("click", "outlets-gate", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const props = f.properties ?? {};
        showPopup(e, `
          <div class="gis-popup">
            <div class="gis-popup-title">${tRef.current("gis.layer.gate")}: ${props.muid}</div>
            <div class="gis-popup-updated">${tRef.current("gis.popup.updatedAt")}: ${stepTimeLabel(dataRef.current.simulation.start, dataRef.current.simulation.stepMinutes, stepRef.current)}</div>
          </div>
        `);
      });

      // Pointer cursor on hover over any clickable marker, only while the
      // "Chọn" tool is active (in pan/measure modes the cursor already
      // communicates that mode — see the tool-mode effect below).
      for (const layerId of ["manholes-circle", "outlets-pump", "outlets-gate"]) {
        map.on("mouseenter", layerId, () => {
          if (modeRef.current === "select") map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layerId, () => {
          if (modeRef.current === "select") map.getCanvas().style.cursor = "";
        });
      }

    });

    return () => {
      resizeObserver.disconnect();
      for (const m of waterLevelMarkersRef.current) m.remove();
      for (const m of warningMarkersRef.current) m.remove();
      waterLevelMarkersRef.current = [];
      warningMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Basemap toggle.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const resolved = resolveBasemapKey(layerState.basemap);
    const apply = () => {
      if (!map.getLayer("basemap-osm")) return;
      map.setLayoutProperty("basemap-osm", "visibility", resolved === "osm" ? "visible" : "none");
      map.setLayoutProperty("basemap-satellite", "visibility", resolved === "satellite" ? "visible" : "none");
    };
    if (map.isStyleLoaded()) apply(); else map.once("load", apply);
  }, [layerState.basemap]);

  // Fly to the station picked in the search box + open a labeled popup. The
  // type label reuses the layer/search strings so the popup stays bilingual
  // (`tRef.current`, not a mount-time capture).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyTarget) return;
    const typeKey = flyTarget.type === "pump" ? "gis.layer.pumpStation"
      : flyTarget.type === "gate" ? "gis.layer.gate"
      : "gis.search.typeStation";
    const apply = () => {
      map.flyTo({ center: [flyTarget.lng, flyTarget.lat], zoom: 16 });
      new maplibregl.Popup()
        .setLngLat([flyTarget.lng, flyTarget.lat])
        .setHTML(`<div class="gis-popup"><div class="gis-popup-title">${tRef.current(typeKey)}: ${flyTarget.id}</div></div>`)
        .addTo(map);
    };
    if (map.isStyleLoaded()) apply(); else map.once("load", apply);
  }, [flyTarget]);

  // Manhole/outlet data + visibility per step and per P2-02 checkbox state.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const { config } = data;
    const apply = () => {
      const manholeSrc = map.getSource("manholes") as maplibregl.GeoJSONSource | undefined;
      if (manholeSrc) {
        const withFill = {
          ...data.manholes,
          features: data.manholes.features.map((f) => {
            const muid = String(f.properties?.muid);
            const fill = data.simulation.nodeFill[muid]?.[step] ?? 0;
            // `fillWeight` (raw number) feeds the heatmap's weight
            // expression; `fillState` (category string) still drives the
            // per-node circle color via its `match` expression — two
            // different consumers of the same underlying fill value.
            return { ...f, properties: { ...f.properties, fillState: fillState(fill, config.simThresholds), fillWeight: fill } };
          }),
        };
        manholeSrc.setData(withFill as FeatureCollection);
      }
      if (map.getLayer("manholes-circle")) {
        map.setLayoutProperty("manholes-circle", "visibility", layerState.realtime.waterLevel ? "visible" : "none");
      }
      // The heatmap always draws from the same real fill data regardless
      // of the "Mực nước" checkbox above (it represents flood extent, not
      // the per-node marker layer) — only its P2-04 opacity slider
      // controls visibility, handled in the floodOpacity effect below.

      const outletSrc = map.getSource("outlets") as maplibregl.GeoJSONSource | undefined;
      if (outletSrc) {
        const withType = {
          ...data.outlets,
          features: data.outlets.features.map((f) => ({ ...f, properties: { ...f.properties, assetType: classifyOutlet(f.properties?.muid) } })),
        };
        outletSrc.setData(withType as FeatureCollection);
      }
      for (const id of ["outlets-pump", "outlets-pump-icon"]) {
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", layerState.realtime.pumpStation ? "visible" : "none");
      }
      for (const id of ["outlets-gate", "outlets-gate-icon"]) {
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", layerState.realtime.gate ? "visible" : "none");
      }

      // Floating water-level labels for the top-5 highest nodes right now
      // (real muid + real computed level, no invented station names) and
      // a warning-triangle marker per currently-active flood cluster.
      // Plain DOM `Marker`s, not a GeoJSON layer — rebuilt every step
      // since which nodes/zones qualify changes as the storm moves.
      for (const m of waterLevelMarkersRef.current) m.remove();
      waterLevelMarkersRef.current = topWaterLevelNodes(data, step, 5).map((node) => {
        const el = document.createElement("div");
        el.className = "gis-water-level-label";
        el.textContent = `${node.muid} · ${node.levelM.toFixed(2)} m`;
        return new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([node.lng, node.lat]).addTo(map);
      });

      for (const m of warningMarkersRef.current) m.remove();
      warningMarkersRef.current = activeFloodZoneCentroids(data, step).map((centroid) => {
        const el = document.createElement("div");
        el.className = "gis-warning-marker";
        el.innerHTML = warningIconRaw;
        return new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat(centroid).addTo(map);
      });
    };
    if (map.isStyleLoaded()) apply(); else map.once("load", apply);
  }, [data, step, layerState.realtime.waterLevel, layerState.realtime.pumpStation, layerState.realtime.gate]);

  // Flood heatmap opacity — controlled by P2-04's "Độ trong suốt" slider.
  // Originally controlled the flat `flood-zones-fill` layer; now controls
  // the heatmap that replaced it (see the flood-heatmap follow-up), same
  // slider, same prop, just a different target layer underneath.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      if (map.getLayer("flood-heatmap")) map.setPaintProperty("flood-heatmap", "heatmap-opacity", floodOpacity);
    };
    if (map.isStyleLoaded()) apply(); else map.once("load", apply);
  }, [floodOpacity]);

  // Measurement drawing.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const lineSrc = map.getSource("measure-line") as maplibregl.GeoJSONSource | undefined;
      lineSrc?.setData({ type: "Feature", geometry: { type: "LineString", coordinates: measurePoints }, properties: {} });
      const areaSrc = map.getSource("measure-area") as maplibregl.GeoJSONSource | undefined;
      const ring = measurePoints.length >= 3 ? [...measurePoints, measurePoints[0]] : [];
      areaSrc?.setData({ type: "Feature", geometry: { type: "Polygon", coordinates: [ring] }, properties: {} });
    };
    if (map.isStyleLoaded()) apply(); else map.once("load", apply);
  }, [measurePoints]);

  // Click-to-measure + cursor per active tool.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const canvas = map.getCanvas();
    canvas.style.cursor = mode === "distance" || mode === "area" ? "crosshair" : mode === "pan" ? "grab" : "";

    if (mode !== "distance" && mode !== "area") return;
    const onClick = (e: maplibregl.MapMouseEvent) => {
      setMeasurePoints((pts) => [...pts, [e.lngLat.lng, e.lngLat.lat]]);
    };
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [mode]);

  function selectTool(next: ToolMode) {
    setMode(next);
    setMeasurePoints([]);
  }

  function toggleFullscreen() {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function exportMap() {
    setExportToast(true);
    setTimeout(() => setExportToast(false), 2200);
  }

  const distanceM = mode === "distance" ? polylineLengthM(measurePoints) : 0;
  const areaM2 = mode === "area" ? polygonAreaM2(measurePoints) : 0;

  return (
    <div ref={wrapperRef} className="gis-canvas-wrapper">
      <div ref={containerRef} className="gis-canvas" />

      {children}

      <div className="gis-canvas-tools">
        {TOOLS.map(({ mode: m, icon }) => (
          <button
            key={m}
            type="button"
            className={`gis-canvas-tool-btn${mode === m ? " active" : ""}`}
            title={t(`gis.tool.${m}`)}
            onClick={() => selectTool(m)}
          >
            <Icon name={icon} size={22} />
          </button>
        ))}
        <div className="gis-canvas-tool-sep" />
        <button type="button" className="gis-canvas-tool-btn" title={t("gis.tool.zoomIn")} onClick={() => mapRef.current?.zoomIn()}>
          <Icon name="zoom-in" size={22} />
        </button>
        <button type="button" className="gis-canvas-tool-btn" title={t("gis.tool.zoomOut")} onClick={() => mapRef.current?.zoomOut()}>
          <Icon name="zoom-out" size={22} />
        </button>
      </div>

      <div className="gis-canvas-corner">
        {onToggleFocusMode && (
          <button
            type="button"
            className={`gis-canvas-corner-btn gis-focus-toggle-btn${focusMode ? " active" : ""}`}
            title={focusMode ? t("gis.focusMode.exit") : t("gis.focusMode.enter")}
            onClick={onToggleFocusMode}
          >
            <Icon name="focus" size={16} />
            <span>{focusMode ? t("gis.focusMode.exit") : t("gis.focusMode.enter")}</span>
          </button>
        )}
        <button type="button" className="gis-canvas-corner-btn" title={t("gis.exportMap")} onClick={exportMap}>
          <Icon name="download" size={16} />
          <span>{t("gis.exportMap")}</span>
        </button>
        <button type="button" className="gis-canvas-corner-btn" title={t("gis.fullscreen")} onClick={toggleFullscreen}>
          <Icon name={fullscreen ? "fullscreen-exit" : "fullscreen"} size={16} />
          <span>{fullscreen ? t("gis.exitFullscreen") : t("gis.fullscreen")}</span>
        </button>
      </div>

      {exportToast && <div className="gis-canvas-toast">{t("gis.exportMapMock")}</div>}

      {(mode === "distance" || mode === "area") && measurePoints.length > 0 && (
        <div className="gis-canvas-measure-badge">
          {mode === "distance"
            ? `${t("gis.tool.distance")}: ${distanceM < 1000 ? `${distanceM.toFixed(0)} m` : `${(distanceM / 1000).toFixed(2)} km`}`
            : `${t("gis.tool.area")}: ${areaM2 < 10000 ? `${areaM2.toFixed(0)} m²` : `${(areaM2 / 10000).toFixed(2)} ha`}`}
        </div>
      )}

      <div className="gis-canvas-legend">
        <h4>{t("gis.legend.title")}</h4>
        {/* Percentages come straight from `config.simThresholds` — the
            exact same values `fillState()` uses to color the manhole
            markers, not a second hardcoded copy that could drift out of
            sync with what's actually being colored. */}
        <div className="gis-canvas-legend-row">
          <span className="gis-canvas-legend-swatch gis-canvas-legend-swatch--circle" style={{ background: data.config.colors.simOk }} />
          {t("gis.legend.ok")} <span className="gis-canvas-legend-range">(&lt; {Math.round(data.config.simThresholds.warn * 100)}%)</span>
        </div>
        <div className="gis-canvas-legend-row">
          <span className="gis-canvas-legend-swatch gis-canvas-legend-swatch--circle" style={{ background: data.config.colors.simWarn }} />
          {t("gis.legend.warn")} <span className="gis-canvas-legend-range">({Math.round(data.config.simThresholds.warn * 100)}–{Math.round(data.config.simThresholds.surcharge * 100)}%)</span>
        </div>
        <div className="gis-canvas-legend-row">
          <span className="gis-canvas-legend-swatch gis-canvas-legend-swatch--circle" style={{ background: data.config.colors.simSurcharge }} />
          {t("gis.legend.surcharge")} <span className="gis-canvas-legend-range">(&ge; {Math.round(data.config.simThresholds.surcharge * 100)}%)</span>
        </div>
        <div className="gis-canvas-legend-row"><span className="gis-canvas-legend-swatch gis-canvas-legend-swatch--diamond" style={{ background: data.config.colors.flood, opacity: floodOpacity }} />{t("gis.legend.floodZone")}</div>
      </div>
    </div>
  );
}
