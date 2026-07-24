import { useMemo } from "react";
import PageHeader from "../components/layout/PageHeader";
import EmptyState from "../components/EmptyState";
import { useT } from "../i18n/I18nContext";
import { useAppData } from "../context/AppDataContext";
import {
  currentMonitoringStep, monStepLabel, rainTableRows, rain24hByStation,
  topRainStations, hourlyDistribution, culvertRows,
} from "../data/monitoringService";
import MonitoringStationMap from "../components/monitoring/MonitoringStationMap";
import RainTable from "../components/monitoring/RainTable";
import CulvertTable from "../components/monitoring/CulvertTable";
import RainTrendChart from "../components/monitoring/RainTrendChart";
import TopRainChart from "../components/monitoring/TopRainChart";
import HourlyDistributionChart from "../components/monitoring/HourlyDistributionChart";

/** Tab 3 — Quan trắc thời gian thực. Redesign single-tab (Phase 3): 1 trang gồm
 *  5 nhóm — bản đồ trạm, bảng mưa thực đo, bảng mực nước cống, biểu đồ diễn biến
 *  mưa, top-10 + phân bố theo khung giờ. Dữ liệu quan trắc là synthetic seeded
 *  trong Supabase (xem monitoringService.ts). "Hiện tại" neo theo đồng hồ thực. */
export default function Monitoring() {
  const t = useT();
  const data = useAppData();
  const { rainStations, culverts, config } = data;

  const step = useMemo(() => currentMonitoringStep(), []);

  const rows = useMemo(() => rainTableRows(rainStations, step), [rainStations, step]);
  const rain24h = useMemo(() => rain24hByStation(rainStations, step), [rainStations, step]);
  const top = useMemo(() => topRainStations(rainStations, step, 10), [rainStations, step]);
  const featured = useMemo(() => rainStations.slice(0, 3), [rainStations]);
  const dist = useMemo(() => hourlyDistribution(rainStations, featured), [rainStations, featured]);
  const culvRows = useMemo(() => culvertRows(culverts, step), [culverts, step]);

  const updated = (
    <span className="mon-updated">
      {t("mon.updatedAt")}: <strong>{monStepLabel(step)}</strong>
    </span>
  );

  if (rainStations.length === 0) {
    return (
      <div className="content-page2">
        <PageHeader title={t("nav.monitoring")} right={updated} />
        <EmptyState label={t("mon.empty")} />
      </div>
    );
  }

  return (
    <div className="content-page2">
      <PageHeader title={t("nav.monitoring")} right={updated} />

      <div className="mon-row-top">
        <div className="dash-chart-card mon-panel">
          <div className="dash-weather-card-head">
            <h3>{t("mon.map.title")}</h3>
          </div>
          <MonitoringStationMap stations={rainStations} rain24h={rain24h} config={config} />
        </div>

        <div className="mon-side-stack">
          <div className="dash-chart-card mon-panel">
            <div className="dash-weather-card-head">
              <h3>{t("mon.rainTable.title")}</h3>
            </div>
            <RainTable rows={rows} />
          </div>
          <div className="dash-chart-card mon-panel">
            <div className="dash-weather-card-head">
              <h3>{t("mon.culvertTable.title")}</h3>
            </div>
            <CulvertTable rows={culvRows} />
          </div>
        </div>
      </div>

      <div className="mon-row-charts">
        <RainTrendChart stations={rainStations} step={step} />
        <TopRainChart items={top} />
        <HourlyDistributionChart series={dist} />
      </div>
    </div>
  );
}
