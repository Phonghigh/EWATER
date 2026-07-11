import type { LayerKey, MapStyleConfig } from "../types";
import { useStore } from "../state/store";
import { useT } from "../i18n/I18nContext";

const LABELS: { key: LayerKey; labelKey: string; swatchKey: string; shape: "line" | "dot" | "area" }[] = [
  { key: "manholes", labelKey: "map.layer.manholes", swatchKey: "manhole", shape: "dot" },
  { key: "links", labelKey: "map.layer.pipes", swatchKey: "pipeMedium", shape: "line" },
  { key: "outlets", labelKey: "map.layer.outlets", swatchKey: "outlet", shape: "dot" },
  { key: "rivers", labelKey: "map.layer.rivers", swatchKey: "river", shape: "line" },
  { key: "boundary", labelKey: "map.layer.boundary", swatchKey: "boundary", shape: "line" },
  { key: "province", labelKey: "map.layer.province", swatchKey: "provinceBoundary", shape: "line" },
  { key: "catchment", labelKey: "map.layer.catchment", swatchKey: "boundary", shape: "area" },
  { key: "flood", labelKey: "map.layer.flood", swatchKey: "flood", shape: "area" },
];

export default function LayerPanel({ config }: { config: MapStyleConfig }) {
  const t = useT();
  const layers = useStore((s) => s.layers);
  const toggleLayer = useStore((s) => s.toggleLayer);
  const simMode = useStore((s) => s.simMode);
  const basemap = useStore((s) => s.basemap);
  const setBasemap = useStore((s) => s.setBasemap);

  return (
    <div className="panel layer-panel">
      <h3>{t("map.layers")}</h3>
      {LABELS.map(({ key, labelKey, swatchKey, shape }) => (
        <label key={key} className={`layer-row ${key === "flood" && !simMode ? "disabled" : ""}`}>
          <input
            type="checkbox"
            checked={layers[key]}
            onChange={() => toggleLayer(key)}
            disabled={key === "flood" && !simMode}
          />
          <span className={`swatch swatch-${shape}`} style={{ background: config.colors[swatchKey] }} />
          {t(labelKey)}
        </label>
      ))}
      <h3>{t("map.basemap")}</h3>
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
          <h3>{t("map.legendFill")}</h3>
          <div className="legend-gradient">
            <span style={{ background: config.colors.simOk }} /> {t("map.legend.ok")}
            <span style={{ background: config.colors.simWarn }} /> {t("map.legend.high")}
            <span style={{ background: config.colors.simSurcharge }} /> {t("map.legend.surcharged")}
          </div>
        </>
      )}
    </div>
  );
}
