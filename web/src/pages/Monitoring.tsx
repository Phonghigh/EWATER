import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/layout/PageHeader";
import EmptyState from "../components/EmptyState";
import { useT } from "../i18n/I18nContext";
import { useAppData } from "../context/AppDataContext";
import {
  currentMonitoringStep, monStepLabel, rainTableRows, rain24hByStation,
  topRainStations, hourlyDistribution, culvertRows, monSituation,
} from "../data/monitoringService";
import MonitoringStationMap from "../components/monitoring/MonitoringStationMap";
import MonSituationBanner from "../components/monitoring/MonSituationBanner";
import RainTable from "../components/monitoring/RainTable";
import CulvertTable from "../components/monitoring/CulvertTable";
import RainTrendChart from "../components/monitoring/RainTrendChart";
import TopRainChart from "../components/monitoring/TopRainChart";
import HourlyDistributionChart from "../components/monitoring/HourlyDistributionChart";

/** Tab 3 — Quan trắc thời gian thực. Redesign "data → situation" (2026-07-24):
 *  situation banner + linked interaction (bảng ↔ bản đồ ↔ biểu đồ xoay quanh 1
 *  trạm được chọn) + auto-refresh 60s thật (bước hiện tại neo đồng hồ thực nên
 *  phút thực trôi thì dữ liệu tiến). Charts gom vào mục "Phân tích chi tiết"
 *  mở khi cần để bản đồ + bảng chiếm viewport đầu. */
export default function Monitoring() {
  const t = useT();
  const data = useAppData();
  const { rainStations, culverts, config } = data;

  // Auto-refresh thật: đọc lại đồng hồ mỗi 60s → bước hiện tại tiến theo giờ thực.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const step = currentMonitoringStep(now);

  // Selection dùng chung cho linked interaction (bảng ↔ bản đồ ↔ biểu đồ).
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [flyNonce, setFlyNonce] = useState(0);

  const rows = useMemo(() => rainTableRows(rainStations, step), [rainStations, step]);
  const rain24h = useMemo(() => rain24hByStation(rainStations, step), [rainStations, step]);
  const top = useMemo(() => topRainStations(rainStations, step, 10), [rainStations, step]);
  const featured = useMemo(() => rainStations.slice(0, 3), [rainStations]);
  const dist = useMemo(() => hourlyDistribution(rainStations, featured), [rainStations, featured]);
  const culvRows = useMemo(() => culvertRows(culverts, step), [culverts, step]);
  const situation = useMemo(() => monSituation(rows), [rows]);

  const [chartsOpen, setChartsOpen] = useState(false);

  /** Chọn/bỏ chọn 1 trạm (bảng + marker), luôn re-fly khi chọn. */
  function handleSelect(code: string) {
    setSelectedCode((prev) => (prev === code ? null : code));
    setFlyNonce((n) => n + 1);
  }
  /** Luôn chọn + bay tới (dùng cho "Xem ngay" của banner). */
  function focusStation(code: string) {
    setSelectedCode(code);
    setFlyNonce((n) => n + 1);
  }

  const updatedChip = (
    <span className="mon-freshness">
      <span className="mon-freshness-dot" aria-hidden="true" />
      {t("mon.live.updated")}{" "}
      {now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );

  if (rainStations.length === 0) {
    return (
      <div className="content-page2">
        <PageHeader title={t("nav.monitoring")} right={<span className="mon-updated">{t("mon.updatedAt")}: <strong>{monStepLabel(step)}</strong></span>} />
        <EmptyState label={t("mon.empty")} />
      </div>
    );
  }

  return (
    <div className="content-page2">
      <div className="mon-map-overlay-wrap">
        <MonitoringStationMap
          stations={rainStations}
          rain24h={rain24h}
          config={config}
          provinceBoundary={data.provinceBoundary}
          selectedCode={selectedCode}
          hoveredCode={hoveredCode}
          onSelectStation={handleSelect}
          onHoverStation={setHoveredCode}
          flyNonce={flyNonce}
          rows={rows}
        />

        {/* Overlay nổi trên map: banner tình huống (trên) + freshness + bảng. */}
        <MonSituationBanner situation={situation} onViewNow={focusStation} />
        {updatedChip}

        <div className="mon-overlay-stack">
          <div className="mon-overlay-panel">
            <div className="mon-overlay-panel-head">{t("mon.rainTable.title")}</div>
            <RainTable
              rows={rows}
              selectedCode={selectedCode}
              hoveredCode={hoveredCode}
              onSelect={handleSelect}
              onHover={setHoveredCode}
            />
          </div>
          <div className="mon-overlay-panel">
            <div className="mon-overlay-panel-head">{t("mon.culvertTable.title")}</div>
            <CulvertTable rows={culvRows} />
          </div>
        </div>

        {/* Toggle "Phân tích" nổi ở đáy map (giống /gis-map). */}
        <button
          type="button"
          className={`mon-charts-toggle${chartsOpen ? " open" : ""}`}
          onClick={() => setChartsOpen((v) => !v)}
          aria-expanded={chartsOpen}
        >
          <span className="mon-charts-toggle-caret" aria-hidden="true">▾</span>
          {t(chartsOpen ? "mon.charts.collapse" : "mon.charts.expand")}
        </button>
      </div>

      {chartsOpen && (
        <div className="mon-row-charts">
          <RainTrendChart stations={rainStations} step={step} focusCode={selectedCode} />
          <TopRainChart items={top} />
          <HourlyDistributionChart series={dist} />
        </div>
      )}
    </div>
  );
}
