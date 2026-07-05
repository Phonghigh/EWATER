import type { LayerKey, MapStyleConfig } from "../types";
import { useStore } from "../state/store";

const LABELS: { key: LayerKey; label: string; swatchKey: string; shape: "line" | "dot" | "area" }[] = [
  { key: "manholes", label: "Manholes", swatchKey: "manhole", shape: "dot" },
  { key: "links", label: "Pipes", swatchKey: "pipeMedium", shape: "line" },
  { key: "outlets", label: "Outlets", swatchKey: "outlet", shape: "dot" },
  { key: "rivers", label: "Rivers & canals", swatchKey: "river", shape: "line" },
  { key: "boundary", label: "City boundary", swatchKey: "boundary", shape: "line" },
  { key: "catchment", label: "Catchment", swatchKey: "boundary", shape: "area" },
  { key: "flood", label: "Flood zones (sim)", swatchKey: "flood", shape: "area" },
];

export default function LayerPanel({ config }: { config: MapStyleConfig }) {
  const layers = useStore((s) => s.layers);
  const toggleLayer = useStore((s) => s.toggleLayer);
  const simMode = useStore((s) => s.simMode);
  const basemap = useStore((s) => s.basemap);
  const setBasemap = useStore((s) => s.setBasemap);

  return (
    <div className="panel layer-panel">
      <h3>Layers</h3>
      {LABELS.map(({ key, label, swatchKey, shape }) => (
        <label key={key} className={`layer-row ${key === "flood" && !simMode ? "disabled" : ""}`}>
          <input
            type="checkbox"
            checked={layers[key]}
            onChange={() => toggleLayer(key)}
            disabled={key === "flood" && !simMode}
          />
          <span className={`swatch swatch-${shape}`} style={{ background: config.colors[swatchKey] }} />
          {label}
        </label>
      ))}
      <h3>Basemap</h3>
      <div className="basemap-row">
        {Object.entries(config.basemaps).map(([key, bm]) => (
          <button
            key={key}
            className={basemap === key ? "active" : ""}
            onClick={() => setBasemap(key)}
          >
            {bm.name}
          </button>
        ))}
      </div>
      {simMode && (
        <>
          <h3>Legend - fill level</h3>
          <div className="legend-gradient">
            <span style={{ background: config.colors.simOk }} /> OK
            <span style={{ background: config.colors.simWarn }} /> High
            <span style={{ background: config.colors.simSurcharge }} /> Surcharged
          </div>
        </>
      )}
    </div>
  );
}
