import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection } from "geojson";
import type { AppData, MapStyleConfig } from "../types";
import { useT } from "../i18n/I18nContext";
import { floodHeatmapPaint } from "../lib/floodHeatmap";

const PREVIEW_FLOOD_OPACITY = 0.6; // fixed — no opacity control on this small card, unlike P2-04's slider on the full map

type FillState = "ok" | "warn" | "surcharge";

function fillState(fill: number, thresholds: MapStyleConfig["simThresholds"]): FillState {
  if (fill >= thresholds.surcharge) return "surcharge";
  if (fill >= thresholds.warn) return "warn";
  return "ok";
}

/** Non-interactive MapLibre preview of the current flood state (manholes
 *  colored by fill severity + flood-zone shading). This is a Dashboard
 *  thumbnail, not the real map - the full interactive GIS map (toolbar,
 *  layers panel, minimap) is P2-03's scope, built from scratch there; this
 *  component must not grow toward duplicating it. */
export default function FloodMapPreview({ data, step, updatedAt }: { data: AppData; step: number; updatedAt: string }) {
  const t = useT();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const { config } = data;
    const basemapKey = Object.keys(config.basemaps)[0];
    const basemap = config.basemaps[basemapKey];

    const manholesWithFill = {
      ...data.manholes,
      features: data.manholes.features.map((f) => {
        const muid = String(f.properties?.muid);
        const fill = data.simulation.nodeFill[muid]?.[step] ?? 0;
        // `fillWeight` feeds the heatmap below; `fillState` still drives
        // the per-node circle color — same dual-purpose split as
        // GisMapCanvas.tsx's identical data effect.
        return { ...f, properties: { ...f.properties, fillState: fillState(fill, config.simThresholds), fillWeight: fill } };
      }),
    };

    const map = new maplibregl.Map({
      container: el,
      interactive: false,
      center: config.center,
      zoom: config.zoom,
      // Default attribution control sits bottom-right, the same corner as
      // our floating "view full map" chip - collides with it. Required
      // attribution (OSM's ODbL license) can't be dropped, so it's moved to
      // the opposite corner and collapsed to a compact "i" icon instead.
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          basemap: { type: "raster", tiles: [basemap.tiles], tileSize: 256, attribution: basemap.attribution },
        },
        layers: [{ id: "basemap", type: "raster", source: "basemap" }],
      },
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

    // See GisMapCanvas.tsx's identical fix for why this is needed: MapLibre
    // measures its container once at construction, and this card's flex
    // layout (`.dash-map-col`) can leave it 0x0 at that exact moment.
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(el);

    map.on("load", () => {
      // Same heatmap treatment as the full GIS map (P2-03 follow-up) —
      // was a flat `flood-zones-fill` polygon here, now shares
      // `floodHeatmapPaint()` so the Dashboard preview and `/gis-map`
      // don't show 2 different flood visualizations for the same data.
      map.addSource("manholes", { type: "geojson", data: manholesWithFill as FeatureCollection });
      map.addLayer({
        id: "flood-heatmap", type: "heatmap", source: "manholes",
        paint: floodHeatmapPaint(config.colors.flood, PREVIEW_FLOOD_OPACITY),
      });

      map.addSource("rivers", { type: "geojson", data: data.rivers });
      map.addLayer({
        id: "rivers-line",
        type: "line",
        source: "rivers",
        paint: { "line-color": config.colors.river, "line-width": 2 },
      });

      map.addLayer({
        id: "manholes-circle",
        type: "circle",
        source: "manholes",
        paint: {
          "circle-radius": 3,
          "circle-color": [
            "match", ["get", "fillState"],
            "surcharge", config.colors.simSurcharge,
            "warn", config.colors.simWarn,
            config.colors.simOk,
          ],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#fff",
        },
      });
    });

    return () => {
      resizeObserver.disconnect();
      map.remove();
    };
  }, [data, step]);

  // Map-first layout: no bordered header bar eating into the map's height -
  // the title and the "view full map" link float directly over the
  // full-bleed canvas instead, so the map itself gets as much of the card
  // as possible (per the government-GIS review's "map should dominate"
  // feedback, applied here - unlike the zoom/legend/layer controls, which
  // stay out of scope for this preview card, see P1-03's `interactive:
  // false` boundary note above).
  return (
    <div className="dash-map-card">
      <div ref={containerRef} className="dash-map-card-canvas" />
      <div className="dash-map-card-title-chip">
        <h3>{t("dash.currentFloodMap")}</h3>
        <span className="dash-map-card-title-time">({updatedAt})</span>
      </div>
      <Link to="/gis-map" className="dash-map-card-link">{t("dash.viewFullMap")}</Link>
    </div>
  );
}
