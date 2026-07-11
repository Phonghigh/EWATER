import { Link } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";
import { useT } from "../i18n/I18nContext";
import { useStore } from "../state/store";
import { useMonitoring } from "../monitoring/useMonitoring";
import { levelBands, gatePumpStatus, floodSummary, BANDS, BAND_COLORS, type Band } from "../monitoring/aggregate";
import { trailingRain } from "../monitoring/windows";
import { Card, StatCard, DonutCard, StatusBarCard } from "../components/Cards";
import StepControl from "../components/StepControl";
import DemoBadge from "../components/DemoBadge";
import RainTideChart from "../components/RainTideChart";
import type { Area } from "../monitoring/stations";

const BAND_LABEL: Record<Band, string> = {
  below1: "dash.band.below1",
  "1to2": "dash.band.1to2",
  "2to3": "dash.band.2to3",
  above3: "dash.band.above3",
};

export default function Dashboard() {
  const data = useAppData();
  const t = useT();
  const mon = useMonitoring();
  const step = useStore((s) => s.currentStep);

  const donut = (area: Area) => {
    const b = levelBands(mon.level, step, area);
    return BANDS.map((band) => ({ name: t(BAND_LABEL[band]), value: b[band], color: BAND_COLORS[band] }));
  };

  const gp = gatePumpStatus(mon.gates, step);
  const flood = floodSummary(data, step);
  const rainNow = data.simulation.rainfall[step] ?? 0;
  const rain24 = trailingRain(data.simulation.rainfall, data.simulation.steps - 1)[7];

  const barData = [
    { name: t("dash.gate"), active: gp.gateActive, inactive: gp.gateInactive },
    { name: t("dash.pump"), active: gp.pumpActive, inactive: gp.pumpInactive },
  ];

  // main-river levels: sample first few gates' river levels as "main river" gauges
  const rivers = mon.gates.filter((g) => g.type === "gate").slice(0, 5);

  return (
    <div className="content-page dashboard">
      <div className="page-head">
        <h2>{t("dash.title")} <DemoBadge title /></h2>
        <StepControl />
      </div>

      <div className="dash-grid">
        <Card title={t("dash.waterUrban")}>
          <DonutCard data={donut("urban")} />
        </Card>
        <Card title={t("dash.waterCity")}>
          <DonutCard data={donut("city")} />
        </Card>
        <Card title={t("dash.gatePump")}>
          <StatusBarCard data={barData} activeLabel={t("dash.active")} inactiveLabel={t("dash.inactive")} />
        </Card>

        <Card title={t("dash.rainCity")} className="span-tall">
          <div className="stat-row">
            <StatCard label={t("dash.rainNow")} value={rainNow.toFixed(1)} unit="mm/h" tone={rainNow > 30 ? "bad" : rainNow > 10 ? "warn" : "ok"} />
            <StatCard label={t("dash.rain24h")} value={rain24.toFixed(0)} unit="mm" />
          </div>
        </Card>
        <Card title={t("dash.floodCity")} className="span-tall">
          <div className="stat-row">
            <StatCard label={t("dash.floodedArea")} value={flood.areaKm2.toFixed(2)} unit="km²" tone={flood.areaKm2 > 0 ? "warn" : "ok"} />
            <StatCard label={t("dash.affectedZones")} value={flood.affectedZones} />
            <StatCard label={t("dash.surcharged")} value={flood.surcharged} tone={flood.surcharged > 0 ? "bad" : "ok"} />
          </div>
        </Card>

        <Card title={t("dash.mainRiver")} className="span-wide">
          <table className="mini-table">
            <thead>
              <tr><th>{t("col.code")}</th><th>{t("col.name")}</th><th className="align-right">{t("col.riverLevel")}</th><th className="align-right">{t("col.cityLevel")}</th></tr>
            </thead>
            <tbody>
              {rivers.map((g) => (
                <tr key={g.id}>
                  <td>{g.id}</td><td>{g.name}</td>
                  <td className="align-right">{g.riverLevel[step].toFixed(2)}</td>
                  <td className="align-right">{g.cityLevel[step].toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title={t("dash.rainTide")} className="span-wide">
          <RainTideChart />
        </Card>

        <Card title={t("dash.links")}>
          <div className="quick-links">
            <Link to="/monitor/water-level">→ {t("monitor.waterLevel")}</Link>
            <Link to="/monitor/rainfall-actual">→ {t("monitor.rainfallActual")}</Link>
            <Link to="/monitor/gates">→ {t("monitor.gates")}</Link>
            <Link to="/map">→ {t("nav.map")}</Link>
            <Link to="/report">→ {t("nav.report")}</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
