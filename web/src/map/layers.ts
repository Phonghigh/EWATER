import type { Map as MLMap, StyleSpecification, ExpressionSpecification } from "maplibre-gl";
import type { AppData, LayerKey, MapStyleConfig } from "../types";

/** Base style containing every basemap as a raster source; visibility toggled later. */
export function buildBaseStyle(config: MapStyleConfig, active: string): StyleSpecification {
  const sources: StyleSpecification["sources"] = {};
  const layers: StyleSpecification["layers"] = [];
  for (const [key, bm] of Object.entries(config.basemaps)) {
    sources[`basemap-${key}`] = {
      type: "raster",
      tiles: [bm.tiles],
      tileSize: 256,
      attribution: bm.attribution,
    };
    layers.push({
      id: `basemap-${key}`,
      type: "raster",
      source: `basemap-${key}`,
      layout: { visibility: key === active ? "visible" : "none" },
    });
  }
  return { version: 8, sources, layers };
}

/** Map our logical layer keys to concrete style layer ids. */
export const LAYER_IDS: Record<LayerKey, string[]> = {
  catchment: ["catchment-fill"],
  boundary: ["boundary-casing", "boundary-line"],
  province: ["province-boundary-casing", "province-boundary-line"],
  rivers: ["rivers-casing", "rivers-line"],
  flood: ["flood-fill"],
  links: ["links-line"],
  manholes: ["manholes-circle"],
  outlets: ["outlets-circle"],
};

export const CLICKABLE = ["manholes-circle", "outlets-circle", "links-line", "rivers-line"];

export function pipeColorNormal(c: MapStyleConfig): ExpressionSpecification {
  const [b1, b2] = c.pipeDiameterBreaks;
  return [
    "step", ["coalesce", ["get", "diameter"], 0],
    c.colors.pipeSmall, b1, c.colors.pipeMedium, b2, c.colors.pipeLarge,
  ];
}

function fillColor(c: MapStyleConfig): ExpressionSpecification {
  const t = c.simThresholds;
  return [
    "interpolate", ["linear"], ["coalesce", ["feature-state", "fill"], 0],
    0, c.colors.simOk,
    t.warn, c.colors.simWarn,
    t.surcharge, c.colors.simSurcharge,
  ];
}

export function pipeColorSim(c: MapStyleConfig): ExpressionSpecification {
  return fillColor(c);
}

export function manholeColorNormal(c: MapStyleConfig): ExpressionSpecification {
  return [
    "case",
    ["boolean", ["feature-state", "traceUp"], false], c.colors.traceUp,
    ["boolean", ["feature-state", "traceDown"], false], c.colors.traceDown,
    ["boolean", ["feature-state", "selected"], false], c.colors.highlight,
    c.colors.manhole,
  ] as ExpressionSpecification;
}

export function manholeColorSim(c: MapStyleConfig): ExpressionSpecification {
  return fillColor(c);
}

export function linkColorWithTrace(c: MapStyleConfig, sim: boolean): ExpressionSpecification {
  return [
    "case",
    ["boolean", ["feature-state", "traceUp"], false], c.colors.traceUp,
    ["boolean", ["feature-state", "traceDown"], false], c.colors.traceDown,
    ["boolean", ["feature-state", "selected"], false], c.colors.highlight,
    sim ? pipeColorSim(c) : pipeColorNormal(c),
  ] as ExpressionSpecification;
}

export function addDataLayers(map: MLMap, data: AppData): void {
  const c = data.config;

  map.addSource("catchment", { type: "geojson", data: data.catchment });
  map.addSource("boundary", { type: "geojson", data: data.boundary });
  map.addSource("province-boundary", { type: "geojson", data: data.provinceBoundary });
  map.addSource("rivers", { type: "geojson", data: data.rivers });
  map.addSource("flood", { type: "geojson", data: data.floodZones, promoteId: "zone" });
  map.addSource("links", { type: "geojson", data: data.links, promoteId: "muid" });
  map.addSource("manholes", { type: "geojson", data: data.manholes, promoteId: "muid" });
  map.addSource("outlets", { type: "geojson", data: data.outlets, promoteId: "muid" });

  map.addLayer({
    id: "catchment-fill", type: "fill", source: "catchment",
    layout: { visibility: "none" },
    paint: { "fill-color": c.colors.catchmentFill, "fill-outline-color": c.colors.boundary },
  });
  map.addLayer({
    id: "boundary-casing", type: "line", source: "boundary",
    paint: { "line-color": "#ffffff", "line-width": 5, "line-opacity": 0.85 },
  });
  map.addLayer({
    id: "boundary-line", type: "line", source: "boundary",
    paint: { "line-color": c.colors.boundary, "line-width": 2.5, "line-dasharray": [4, 2] },
  });
  map.addLayer({
    id: "province-boundary-casing", type: "line", source: "province-boundary",
    paint: { "line-color": "#ffffff", "line-width": 6, "line-opacity": 0.9 },
  });
  map.addLayer({
    id: "province-boundary-line", type: "line", source: "province-boundary",
    paint: { "line-color": c.colors.provinceBoundary, "line-width": 3, "line-dasharray": [3, 1.5, 0.5, 1.5] },
  });
  map.addLayer({
    id: "rivers-casing", type: "line", source: "rivers",
    paint: { "line-color": c.colors.riverCasing, "line-width": 3.5, "line-opacity": 0.5 },
  });
  map.addLayer({
    id: "rivers-line", type: "line", source: "rivers",
    paint: { "line-color": c.colors.river, "line-width": 2 },
  });
  map.addLayer({
    id: "flood-fill", type: "fill", source: "flood",
    layout: { visibility: "none" },
    paint: {
      "fill-color": c.colors.flood,
      "fill-opacity": ["*", 0.55, ["coalesce", ["feature-state", "severity"], 0]],
    },
  });
  map.addLayer({
    id: "links-line", type: "line", source: "links",
    paint: {
      "line-color": linkColorWithTrace(c, false),
      "line-width": [
        "interpolate", ["linear"], ["zoom"],
        12, ["step", ["coalesce", ["get", "diameter"], 0], 1, c.pipeDiameterBreaks[0], 1.5, c.pipeDiameterBreaks[1], 2.5],
        16, ["step", ["coalesce", ["get", "diameter"], 0], 2.5, c.pipeDiameterBreaks[0], 4, c.pipeDiameterBreaks[1], 6],
      ],
    },
  });
  map.addLayer({
    id: "manholes-circle", type: "circle", source: "manholes",
    paint: {
      "circle-color": manholeColorNormal(c),
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 2, 15, 4.5, 18, 8],
      "circle-stroke-color": c.colors.manholeStroke,
      "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 12, 0.3, 16, 1.2],
    },
  });
  map.addLayer({
    id: "outlets-circle", type: "circle", source: "outlets",
    paint: {
      "circle-color": c.colors.outlet,
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 3.5, 16, 8],
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1.5,
    },
  });
}
