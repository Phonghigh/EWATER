import { useI18n } from "../../i18n/I18nContext";
import { floodStatsAtStep } from "../../data/gisService";
import type { AppData } from "../../types";

function formatArea(m2: number): string {
  return m2 >= 1_000_000 ? `${(m2 / 1_000_000).toFixed(2)} km²` : `${(m2 / 10_000).toFixed(2)} ha`;
}

/** Right info panel of `/gis-map` (P2-04) - "Thông tin lớp đang chọn"
 *  (opacity slider for the flood-zone layer) + "Thống kê ngập hiện tại" (3
 *  real, step-derived numbers). No "Công cụ phân tích" block - the 2
 *  measurement tools it would have offered already live in P2-03's map
 *  toolbar, the rest of the mockup's analysis tools (elevation pick, cross-
 *  section profile, zone stats, data export) are cut per the 2026-07-23
 *  user decision. The minimap (added in an earlier 2026-07-23 follow-up)
 *  was removed in a later follow-up the same day - the user asked for it
 *  outright instead of fixing its viewport-tracking behavior.
 *
 *  Rendered as a `children` of `GisMapCanvas` (see `GisMap.tsx`) and floats
 *  over the map's top-right corner via its own `position: absolute` (2026-
 *  07-23 follow-up, 3rd round) - it used to be a flex sibling of the map in
 *  `.gis-body`, which meant it always ate width from the map even when it
 *  had little to show. The mirror of `.gis-layer-overlay` on the opposite
 *  corner.
 *
 *  Each section is its own bordered card (2026-07-23 follow-up) rather than
 *  one tall card wrapping all sections - back when this was a flex sibling
 *  of the map, the single card stretched to match the map's height (flex
 *  row default `align-items: stretch`), leaving visible empty space below
 *  since the sections' real content never filled that height. Auto-height
 *  cards side-step the issue; now moot for height (floating, no stretch
 *  pressure) but kept since separate cards still read better floating over
 *  map imagery than one large translucent block would. */
export default function GisRightPanel({
  data, step, floodOpacity, onFloodOpacityChange,
}: {
  data: AppData;
  step: number;
  floodOpacity: number;
  onFloodOpacityChange: (v: number) => void;
}) {
  const { t } = useI18n();
  const stats = floodStatsAtStep(data, step);
  const opacityPct = Math.round(floodOpacity * 100);

  return (
    <div className="gis-right-panel">
      <div className="gis-right-card">
        <h4 className="gis-right-section-title">{t("gis.right.selectedLayer")}</h4>
        <div className="gis-right-layer-name">{t("gis.legend.floodZone")}</div>
        <div className="gis-right-opacity-row">
          <span>{t("gis.right.opacity")}</span>
          <input
            type="range" min={0} max={100} value={opacityPct}
            onChange={(e) => onFloodOpacityChange(Number(e.target.value) / 100)}
          />
          <span className="gis-right-opacity-value">{opacityPct}%</span>
        </div>
      </div>

      <div className="gis-right-card">
        <h4 className="gis-right-section-title">{t("gis.right.statsTitle")}</h4>
        <div className="gis-right-stat-row"><span>{t("gis.right.floodArea")}</span><strong>{formatArea(stats.areaM2)}</strong></div>
        <div className="gis-right-stat-row"><span>{t("gis.right.avgDepth")}</span><strong>{stats.avgDepthM.toFixed(2)} m</strong></div>
        <div className="gis-right-stat-row"><span>{t("gis.right.maxDepth")}</span><strong>{stats.maxDepthM.toFixed(2)} m</strong></div>
      </div>
    </div>
  );
}
