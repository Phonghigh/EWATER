import type { FeatureCollection } from "geojson";
import type { MapStyleConfig, LocationPoint } from "../domain/types";
import { NOW_STEP } from "../domain/nowStep";
import { strings } from "../domain/i18n";

/** Embed JSON safely inside an inline <script> tag (guards against a stray "</script"). */
function embed(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/** Precompute this timestep's severity per zone so the page never needs the full time series. */
function withSeverityNow(floodZones: FeatureCollection): FeatureCollection {
  return {
    ...floodZones,
    features: floodZones.features.map((f) => {
      const props = f.properties as Record<string, unknown>;
      const severity = (props.severity as number[] | undefined) ?? [];
      return {
        ...f,
        properties: { zone: props.zone, severityNow: severity[NOW_STEP] ?? 0 },
      };
    }),
  } as FeatureCollection;
}

export function buildMapHtml(data: {
  config: MapStyleConfig;
  boundary: FeatureCollection;
  provinceBoundary: FeatureCollection;
  rivers: FeatureCollection;
  floodZones: FeatureCollection;
  initialCenter: LocationPoint;
}): string {
  const config = data.config;
  const floodZones = withSeverityNow(data.floodZones);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    #error {
      display: none; position: absolute; inset: 0; align-items: center; justify-content: center;
      text-align: center; padding: 24px; font: 14px -apple-system, Roboto, sans-serif; color: #64748b;
      background: #f8fafc;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="error">${strings.mapLoadError}</div>
  <script src="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.js"></script>
  <script>
    var CONFIG = ${embed(config)};
    var BOUNDARY = ${embed(data.boundary)};
    var PROVINCE = ${embed(data.provinceBoundary)};
    var RIVERS = ${embed(data.rivers)};
    var FLOOD = ${embed(floodZones)};
    var INITIAL_CENTER = ${embed(data.initialCenter)};

    function severityColor(v) {
      var t = CONFIG.simThresholds;
      if (v >= t.surcharge) return CONFIG.colors.simSurcharge;
      if (v >= t.warn) return CONFIG.colors.simWarn;
      return CONFIG.colors.simOk;
    }

    function showError() {
      document.getElementById("error").style.display = "flex";
    }

    var loadTimeout = setTimeout(showError, 12000);

    try {
      var map = new maplibregl.Map({
        container: "map",
        style: {
          version: 8,
          sources: {
            basemap: { type: "raster", tiles: [CONFIG.basemaps.osm.tiles], tileSize: 256 },
          },
          layers: [{ id: "basemap", type: "raster", source: "basemap" }],
        },
        center: INITIAL_CENTER,
        zoom: 17,
        attributionControl: false,
      });

      map.on("error", showError);

      map.on("load", function () {
        clearTimeout(loadTimeout);

        map.addSource("boundary", { type: "geojson", data: BOUNDARY });
        map.addLayer({
          id: "boundary-casing", type: "line", source: "boundary",
          paint: { "line-color": "#ffffff", "line-width": 5, "line-opacity": 0.85 },
        });
        map.addLayer({
          id: "boundary-line", type: "line", source: "boundary",
          paint: { "line-color": CONFIG.colors.boundary, "line-width": 2.5, "line-dasharray": [4, 2] },
        });

        map.addSource("province", { type: "geojson", data: PROVINCE });
        map.addLayer({
          id: "province-casing", type: "line", source: "province",
          paint: { "line-color": "#ffffff", "line-width": 6, "line-opacity": 0.9 },
        });
        map.addLayer({
          id: "province-line", type: "line", source: "province",
          paint: { "line-color": CONFIG.colors.provinceBoundary, "line-width": 3, "line-dasharray": [3, 1.5, 0.5, 1.5] },
        });

        map.addSource("rivers", { type: "geojson", data: RIVERS });
        map.addLayer({
          id: "rivers-line", type: "line", source: "rivers",
          paint: { "line-color": CONFIG.colors.river, "line-width": 1.2, "line-opacity": 0.9 },
        });

        var floodColors = FLOOD.features.map(function (f) {
          return [f.properties.zone, severityColor(f.properties.severityNow)];
        });
        var matchExpr = ["match", ["get", "zone"]];
        floodColors.forEach(function (pair) { matchExpr.push(pair[0], pair[1]); });
        matchExpr.push(CONFIG.colors.simOk);

        map.addSource("flood", { type: "geojson", data: FLOOD });
        map.addLayer({
          id: "flood-fill", type: "fill", source: "flood",
          paint: { "fill-color": matchExpr, "fill-opacity": 0.45 },
        });

        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: "ready" }));
      });

      var moveScheduled = false;
      function postCenter() {
        var c = map.getCenter();
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: "center", lngLat: [c.lng, c.lat] })
        );
      }
      map.on("move", function () {
        if (moveScheduled) return;
        moveScheduled = true;
        requestAnimationFrame(function () { moveScheduled = false; postCenter(); });
      });
      map.on("moveend", postCenter);

      function handleMessage(raw) {
        var msg;
        try { msg = JSON.parse(raw); } catch (e) { return; }
        if (msg.type === "flyTo" && msg.lngLat) {
          map.flyTo({ center: msg.lngLat, duration: 600 });
        }
      }

      document.addEventListener("message", function (e) { handleMessage(e.data); });
      window.addEventListener("message", function (e) { handleMessage(e.data); });
    } catch (e) {
      showError();
    }
  </script>
</body>
</html>`;
}
