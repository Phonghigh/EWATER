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
 *  had little to show. (The left "Lớp dữ liệu" panel took the opposite path
 *  on 2026-07-24 - re-docked as a flex sibling that deliberately pushes the
 *  map - because it carries enough content to justify the width, unlike this
 *  read-only info panel.)
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
  data, step,
}: {
  data: AppData;
  step: number;
}) {
  const { t } = useI18n();
  const stats = floodStatsAtStep(data, step);

  // The flood-layer opacity slider was removed (2026-07-24 feedback): it didn't
  // match the panel's purpose and wasn't needed — the heatmap stays at its
  // fixed default. This panel is now purely the live flood statistics.
  return (
    <div className="gis-right-panel">
      <div className="gis-right-section">
        <h3 className="gis-right-panel-title">{t("gis.right.statsTitle")}</h3>
        <div className="gis-right-stat-row"><span>{t("gis.right.floodArea")}</span><strong>{formatArea(stats.areaM2)}</strong></div>
        <div className="gis-right-stat-row"><span>{t("gis.right.avgDepth")}</span><strong>{stats.avgDepthM.toFixed(2)} m</strong></div>
        <div className="gis-right-stat-row gis-right-stat-row--highlight"><span>{t("gis.right.maxDepth")}</span><strong>{stats.maxDepthM.toFixed(2)} m</strong></div>
      </div>
    </div>
  );
}
