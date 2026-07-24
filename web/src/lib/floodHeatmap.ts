import type { HeatmapLayerSpecification } from "@maplibre/maplibre-gl-style-spec";

/** Shared MapLibre heatmap paint definition for the real per-node flood
 *  fill data (834 manholes) — used by both the GIS map's full canvas
 *  (`GisMapCanvas.tsx`) and the Dashboard's small preview
 *  (`FloodMapPreview.tsx`) so the two stay visually consistent instead of
 *  drifting into two different flood visualizations. Blue-only color ramp,
 *  deliberately not the green/orange/red used for per-point severity
 *  elsewhere in the app — "how flooded is this area" and "how severe is
 *  this specific node" are different questions and shouldn't share a color
 *  language. See docs/learn-log/FOLLOWUP-2026-07-23-flood-heatmap.md. */
export function floodHeatmapPaint(floodColor: string, opacity: number): HeatmapLayerSpecification["paint"] {
  return {
    "heatmap-weight": ["interpolate", ["linear"], ["get", "fillWeight"], 0, 0, 1.3, 1],
    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 10, 1, 16, 3],
    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 14, 16, 45],
    "heatmap-color": [
      "interpolate", ["linear"], ["heatmap-density"],
      0, "rgba(59,130,246,0)",
      0.2, "rgba(191,219,254,0.55)",
      0.5, "rgba(96,165,250,0.75)",
      0.8, floodColor,
      1, "#1d4ed8",
    ],
    "heatmap-opacity": opacity,
  };
}
