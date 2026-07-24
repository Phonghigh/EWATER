import { useEffect, useState } from "react";
import Icon from "../Icon";
import { useI18n } from "../../i18n/I18nContext";
import { manholeStateCounts, topWaterLevelNodes } from "../../data/gisService";
import type { AppData } from "../../types";
import type { StationHit } from "./GisSearchBox";

/** Exception-driven "situation banner" (2026-07-24 feedback): floats over the
 *  top-center of the GIS map and only appears when the system detects
 *  something the operator should act on — here, ≥1 manhole at the surcharge
 *  (critical) threshold. Rather than making the operator scan the map, the
 *  dashboard announces the problem and offers a one-click jump to the worst
 *  point ("Xem ngay" flies to the deepest node via the existing `flyTarget`
 *  mechanism in GisMap.tsx). Dismissible; re-appears when the critical set
 *  changes (the dismiss key is the count, so a new critical count re-shows). */
export default function GisSituationBanner({
  data, step, onViewNow,
}: {
  data: AppData;
  step: number;
  /** Fly the map to a point — reuses the top-bar search's `flyTarget` path. */
  onViewNow: (hit: StationHit) => void;
}) {
  const { t } = useI18n();
  const critical = manholeStateCounts(data, step).surcharge;
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);

  // Re-show the banner whenever the critical count changes (e.g. the storm
  // worsens a step later) even if the user dismissed the previous state.
  useEffect(() => {
    setDismissedAt(null);
  }, [critical]);

  if (critical <= 0 || dismissedAt === critical) return null;

  function viewNow() {
    const worst = topWaterLevelNodes(data, step, 1)[0];
    if (worst) onViewNow({ id: worst.muid, type: "station", lng: worst.lng, lat: worst.lat });
  }

  return (
    <div className="gis-situation-banner" role="alert">
      <Icon name="alert-triangle" size={18} />
      <span className="gis-situation-banner-text">
        {t("gis.banner.floodPoints").replace("{n}", String(critical))}
      </span>
      <button type="button" className="gis-situation-banner-action" onClick={viewNow}>
        {t("gis.banner.viewNow")}
      </button>
      <button
        type="button"
        className="gis-situation-banner-close"
        title={t("gis.banner.dismiss")}
        aria-label={t("gis.banner.dismiss")}
        onClick={() => setDismissedAt(critical)}
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
