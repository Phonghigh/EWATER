import Icon, { type IconName } from "../Icon";
import { useI18n } from "../../i18n/I18nContext";

export type RealtimeLayerKey = "rainStation" | "waterLevel" | "pumpStation" | "gate";
export type ForecastLayerKey = "rainForecast" | "waterLevelForecast" | "floodForecast";
export type BasemapKey = "satellite" | "osm";

const REALTIME_LAYERS: RealtimeLayerKey[] = ["rainStation", "waterLevel", "pumpStation", "gate"];
// Same glyphs already used elsewhere for these exact concepts (weather chip,
// water-level stat card, pump/gate map markers) — reused for visual
// consistency, not a new icon set invented for this panel.
const REALTIME_ICONS: Record<RealtimeLayerKey, IconName> = {
  rainStation: "cloud-rain", waterLevel: "droplet", pumpStation: "pump", gate: "gate",
};
const FORECAST_LAYERS: ForecastLayerKey[] = ["rainForecast", "waterLevelForecast", "floodForecast"];

// Only the two basemaps with a real, configured tile source (see
// `shared/config/map-style.json` → `config.basemaps`). The earlier "light"
// and "googleSatellite" options had no tile source and were labeled "(sắp
// có)"; they were dropped (2026-07-24 user decision) rather than kept as
// non-functional clutter that confused older operators.
const BASEMAPS: BasemapKey[] = ["osm", "satellite"];

export interface GisLayerState {
  realtime: Record<RealtimeLayerKey, boolean>;
  forecast: Record<ForecastLayerKey, boolean>;
  basemap: BasemapKey;
}

export const DEFAULT_GIS_LAYER_STATE: GisLayerState = {
  realtime: { rainStation: true, waterLevel: true, pumpStation: true, gate: true },
  forecast: { rainForecast: true, waterLevelForecast: true, floodForecast: true },
  basemap: "osm",
};

/** Left "Lớp dữ liệu" panel - 3 flat groups (no sub-tabs, no bookmark, no
 *  "Quản lý lớp" button; cut from the original mockup per the 2026-07-23
 *  user decision recorded in tasks/backlog/phase-2.md).
 *
 *  Docked (2026-07-24 follow-up): rendered as a flex sibling of the map in
 *  `.gis-body`, so opening it *pushes the map narrower* instead of floating
 *  over it - the user found the old translucent overlay (which covered the
 *  map and scrolled despite few options) inconvenient. Its own header carries
 *  the title + a close button, since a docked panel needs an in-panel way to
 *  dismiss it (the floating open-button on the map only exists while closed). */
export default function GisLayerPanel({
  state, onChange, onClose,
}: {
  state: GisLayerState;
  onChange: (next: GisLayerState) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();

  function toggleRealtime(key: RealtimeLayerKey) {
    onChange({ ...state, realtime: { ...state.realtime, [key]: !state.realtime[key] } });
  }
  function toggleForecast(key: ForecastLayerKey) {
    onChange({ ...state, forecast: { ...state.forecast, [key]: !state.forecast[key] } });
  }
  function selectBasemap(key: BasemapKey) {
    onChange({ ...state, basemap: key });
  }

  return (
    <div className="gis-layer-panel">
      <div className="gis-layer-panel-head">
        <span className="gis-layer-panel-title">
          <Icon name="layers" size={16} />
          {t("gis.layer.panelTitle")}
        </span>
        <button type="button" className="gis-layer-panel-close" title={t("gis.layer.hidePanel")} onClick={onClose}>
          <Icon name="chevron-left" size={18} />
        </button>
      </div>

      <div className="gis-layer-group">
        <h4 className="gis-layer-group-title">
          <Icon name="monitor" size={14} className="gis-layer-group-title-icon" />
          {t("gis.layer.groupRealtime")}
        </h4>
        {REALTIME_LAYERS.map((key) => (
          <label key={key} className="gis-layer-row">
            <input type="checkbox" checked={state.realtime[key]} onChange={() => toggleRealtime(key)} />
            <Icon name={REALTIME_ICONS[key]} size={15} className="gis-layer-row-icon" />
            <span>{t(`gis.layer.${key}`)}</span>
          </label>
        ))}
      </div>

      <div className="gis-layer-group">
        <h4 className="gis-layer-group-title">
          <Icon name="sliders" size={14} className="gis-layer-group-title-icon" />
          {t("gis.layer.groupForecast")}
        </h4>
        {FORECAST_LAYERS.map((key) => (
          <label key={key} className="gis-layer-row">
            <input type="checkbox" checked={state.forecast[key]} onChange={() => toggleForecast(key)} />
            <span>{t(`gis.layer.${key}`)}</span>
          </label>
        ))}
      </div>

      <div className="gis-layer-group">
        <h4 className="gis-layer-group-title">
          <Icon name="map" size={14} className="gis-layer-group-title-icon" />
          {t("gis.layer.groupBasemap")}
        </h4>
        {BASEMAPS.map((key) => (
          <label key={key} className="gis-layer-row">
            <input type="radio" name="gis-basemap" checked={state.basemap === key} onChange={() => selectBasemap(key)} />
            <span className={`gis-basemap-swatch gis-basemap-swatch--${key}`} />
            <span>{t(`gis.basemap.${key}`)}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
