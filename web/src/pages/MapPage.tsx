import { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { useT } from "../i18n/I18nContext";
import { mapRegistry } from "../map/mapRegistry";
import MapView from "../map/MapView";
import LayerPanel from "../panels/LayerPanel";
import SearchBox from "../panels/SearchBox";
import FeatureInfo from "../panels/FeatureInfo";
import SimulationPanel from "../panels/SimulationPanel";
import Icon from "../components/Icon";

export default function MapPage() {
  const data = useAppData();
  const t = useT();
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div className="map-page">
      <div className="map-topbar">
        <SearchBox
          data={data}
          onFlyTo={(lngLat) => mapRegistry.current?.flyTo({ center: lngLat, zoom: 17 })}
        />
        <button className="about-btn" onClick={() => setShowAbout(true)}>
          <Icon name="info" size={15} /> {t("map.about")}
        </button>
      </div>
      <div className="map-main">
        <MapView data={data} />
        <LayerPanel config={data.config} />
        <FeatureInfo data={data} />
        <SimulationPanel data={data} />
      </div>
      {showAbout && (
        <div className="modal-backdrop" onClick={() => setShowAbout(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t("app.title")}</h2>
            <p>{t("app.subtitle")}</p>
            <p>{t("app.demoNote")}</p>
            <button onClick={() => setShowAbout(false)}>{t("common.close")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
