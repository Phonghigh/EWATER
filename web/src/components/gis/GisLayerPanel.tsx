import Icon, { type IconName } from "../Icon";
import { useI18n } from "../../i18n/I18nContext";

export type RealtimeLayerKey = "rainStation" | "waterLevel" | "pumpStation" | "gate";
export type ForecastLayerKey = "rainForecast" | "waterLevelForecast" | "floodForecast";
export type BasemapKey = "light" | "satellite" | "googleSatellite" | "osm";

const REALTIME_LAYERS: RealtimeLayerKey[] = ["rainStation", "waterLevel", "pumpStation", "gate"];
// Same glyphs already used elsewhere for these exact concepts (weather chip,
// water-level stat card, pump/gate map markers) — reused for visual
// consistency, not a new icon set invented for this panel.
const REALTIME_ICONS: Record<RealtimeLayerKey, IconName> = {
  rainStation: "cloud-rain", waterLevel: "droplet", pumpStation: "pump", gate: "gate",
};
const FORECAST_LAYERS: ForecastLayerKey[] = ["rainForecast", "waterLevelForecast", "floodForecast"];

// Which basemap options actually have a configured tile source today (see
// `shared/config/map-style.json` → `config.basemaps`, only `osm`/`satellite`
// exist). "light" and "googleSatellite" are kept as real, selectable radio
// options per the approved Phase-2 spec (2026-07-23 note in
// tasks/backlog/phase-2.md) but have no tile source yet - P2-03 (the real
// map) must resolve that gap before switching to them does anything
// visible. Not fabricating a Google tile URL here (usage requires an API
// key/ToS agreement this project doesn't have) or a placeholder "light"
// style - selecting the state is honest, rendering it is P2-03's job.
const BASEMAPS_WITHOUT_TILE_SOURCE: BasemapKey[] = ["light", "googleSatellite"];
const BASEMAPS: BasemapKey[] = ["light", "satellite", "googleSatellite", "osm"];

export interface GisLayerState {
  realtime: Record<RealtimeLayerKey, boolean>;
  forecast: Record<ForecastLayerKey, boolean>;
  basemap: BasemapKey;
}

export const DEFAULT_GIS_LAYER_STATE: GisLayerState = {
  realtime: { rainStation: true, waterLevel: true, pumpStation: true, gate: true },
  forecast: { rainForecast: true, waterLevelForecast: true, floodForecast: true },
  basemap: "light",
};

/** Left "Lớp dữ liệu" panel - 3 flat groups (no sub-tabs, no bookmark, no
 *  "Quản lý lớp" button; cut from the original mockup per the 2026-07-23
 *  user decision recorded in tasks/backlog/phase-2.md). Purely UI + local
 *  state here - wiring checkbox/radio state into real map layers is
 *  P2-03's job, since the map itself doesn't exist yet. */
export default function GisLayerPanel({
  state, onChange,
}: {
  state: GisLayerState;
  onChange: (next: GisLayerState) => void;
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
            <span>
              {t(`gis.basemap.${key}`)}
              {BASEMAPS_WITHOUT_TILE_SOURCE.includes(key) && (
                <span className="gis-layer-row-note">{t("gis.comingSoonInline")}</span>
              )}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
