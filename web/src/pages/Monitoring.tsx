import { useParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import EmptyState from "../components/EmptyState";
import { useT } from "../i18n/I18nContext";

const SUB_TABS = [
  "overview", "rain", "waterLevel", "pumps", "gates",
  "camera", "radar", "waterQuality", "iotSensors",
] as const;

const SLUG: Record<(typeof SUB_TABS)[number], string> = {
  overview: "overview",
  rain: "rain",
  waterLevel: "water-level",
  pumps: "pumps",
  gates: "gates",
  camera: "camera",
  radar: "radar",
  waterQuality: "water-quality",
  iotSensors: "iot-sensors",
};

/** Real-time monitoring (Tab 3). This task (P3-01) builds the route shell
 *  + `PageHeader`'s 9 sub-tabs — each sub-tab's real content (station map,
 *  rainfall table, charts, alerts, etc.) lands in P3-02..P3-09 and replaces
 *  the `EmptyState` below for that specific tab. */
export default function Monitoring() {
  const t = useT();
  const { tab } = useParams<{ tab: string }>();
  const activeKey = SUB_TABS.find((k) => SLUG[k] === tab) ?? "overview";

  return (
    <div className="content-page2">
      <PageHeader
        title={t("nav.monitoring")}
        tabs={SUB_TABS.map((key) => ({ to: `/monitoring/${SLUG[key]}`, label: t(`mon.tab.${key}`) }))}
      />
      <EmptyState label={`${t("mon.buildingTab")} ${t(`mon.tab.${activeKey}`)}`} />
    </div>
  );
}
