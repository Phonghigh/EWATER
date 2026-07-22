import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection } from "geojson";
import type { AppData, MapStyleConfig } from "../types";
import { useT } from "../i18n/I18nContext";

type FillState = "ok" | "warn" | "surcharge";

function fillState(fill: number, thresholds: MapStyleConfig["simThresholds"]): FillState {
  if (fill >= thresholds.surcharge) return "surcharge";
  if (fill >= thresholds.warn) return "warn";
  return "ok";
}

/** Non-interactive MapLibre preview of the current flood state (manholes
 *  colored by fill severity + flood-zone shading). This is a Dashboard
 *  thumbnail, not the real map — the full interactive GIS map (toolbar,
 *  layers panel, minimap) is P2-03's scope, built from scratch there; this
 *  component must not grow toward duplicating it. */
export default function FloodMapPreview({ data, step }: { data: AppData; step: number }) {
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
        return { ...f, properties: { ...f.properties, fillState: fillState(fill, config.simThresholds) } };
      }),
    };

    const map = new maplibregl.Map({
      container: el,
      interactive: false,
      center: config.center,
      zoom: config.zoom,
      style: {
        version: 8,
        sources: {
          basemap: { type: "raster", tiles: [basemap.tiles], tileSize: 256, attribution: basemap.attribution },
        },
        layers: [{ id: "basemap", type: "raster", source: "basemap" }],
      },
    });

    map.on("load", () => {
      map.addSource("flood-zones", { type: "geojson", data: data.floodZones });
      map.addLayer({
        id: "flood-zones-fill",
        type: "fill",
        source: "flood-zones",
        paint: { "fill-color": config.colors.flood, "fill-opacity": 0.35 },
      });

      map.addSource("rivers", { type: "geojson", data: data.rivers });
      map.addLayer({
        id: "rivers-line",
        type: "line",
        source: "rivers",
        paint: { "line-color": config.colors.river, "line-width": 2 },
      });

      map.addSource("manholes", { type: "geojson", data: manholesWithFill as FeatureCollection });
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

    return () => map.remove();
  }, [data, step]);

  return (
    <div className="dash-map-card">
      <div className="dash-map-card-head">
        <h3>{t("dash.currentFloodMap")}</h3>
        <Link to="/gis-map" className="dash-map-card-link">{t("dash.viewFullMap")}</Link>
      </div>
      <div ref={containerRef} className="dash-map-card-canvas" />
    </div>
  );
}
