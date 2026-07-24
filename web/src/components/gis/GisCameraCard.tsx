import EmptyState from "../EmptyState";
import { useT } from "../../i18n/I18nContext";

/** "Camera trực tiếp" block for the GIS map's bottom panel (P2-05) - a
 *  placeholder, not a fake video feed. No camera asset registry or stream
 *  source exists yet (Phase 6's "Công trình & Vận hành" is where a real
 *  camera list would come from), so this deliberately doesn't render a
 *  static image or canvas that could be mistaken for a live feed. */
export default function GisCameraCard() {
  const t = useT();
  return (
    <div className="dash-chart-card gis-camera-card">
      <div className="dash-weather-card-head">
        <h3>{t("gis.camera.title")}</h3>
      </div>
      <EmptyState label={t("gis.camera.comingSoon")} />
    </div>
  );
}
