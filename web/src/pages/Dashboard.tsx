import PageHeader from "../components/layout/PageHeader";
import Icon, { type IconName } from "../components/Icon";
import FloodMapPreview from "../components/FloodMapPreview";
import WeatherForecastCard from "../components/WeatherForecastCard";
import ForecastChartsRow from "../components/ForecastChartsRow";
import { useAppData } from "../context/AppDataContext";
import { useT } from "../i18n/I18nContext";
import { getDashboardOverview } from "../data/dashboardService";

/** Time-of-day label for a simulation step (start + step * stepMinutes). */
function stepTimeLabel(start: string, stepMinutes: number, step: number): string {
  const totalMin = (start ? parseInt(start.split(":")[0], 10) * 60 + parseInt(start.split(":")[1], 10) : 0) + step * stepMinutes;
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function StatCard({ icon, label, value, unit, sub }: {
  icon: IconName;
  label: string;
  value: string;
  unit?: string;
  sub: string;
}) {
  return (
    <div className="dash-card">
      <div className="dash-card-icon"><Icon name={icon} size={22} /></div>
      <div className="dash-card-body">
        <div className="dash-card-label">{label}</div>
        <div className="dash-card-value">{value}{unit && <span className="dash-card-unit">{unit}</span>}</div>
        <div className="dash-card-sub">{sub}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const t = useT();
  const data = useAppData();

  // No shared playback/step control exists yet (that's P2-01's job). Until
  // then "current" is the last available simulation step — the most recent
  // real data point, not a fabricated one.
  const step = data.simulation.steps - 1;
  const overview = getDashboardOverview(data, step);
  const updatedAt = stepTimeLabel(data.simulation.start, data.simulation.stepMinutes, step);

  function deltaLabel(delta: number): string {
    if (delta === 0) return t("dash.deltaNone");
    const sign = delta > 0 ? "▲" : "▼";
    return `${sign} ${Math.abs(delta)} ${t("dash.deltaMore")}`;
  }

  return (
    <div className="content-page2">
      <PageHeader title={t("nav.dashboard")} />

      <div className="dash-summary-bar">
        <h1 className="dash-summary-heading">{t("dash.heading")}</h1>
        <span className="dash-summary-updated">{t("dash.updatedAt")} {updatedAt}</span>
      </div>

      <div className="dash-card-grid">
        <StatCard
          icon="alert-triangle"
          label={t("dash.floodPoints")}
          value={String(overview.floodPointCount)}
          sub={deltaLabel(overview.floodPointDelta)}
        />
        <StatCard
          icon="route"
          label={t("dash.floodedRoutes")}
          value={String(overview.floodedRouteCount)}
          sub={deltaLabel(overview.floodedRouteDelta)}
        />
        <StatCard
          icon="cloud-rain"
          label={t("dash.maxRainfall")}
          value={overview.maxRainfallMm.toFixed(1)}
          unit="mm"
          sub={t("dash.maxRainfall.sub")}
        />
        <StatCard
          icon="droplet"
          label={t("dash.maxWaterLevel")}
          value={overview.maxWaterLevel.levelM.toFixed(2)}
          unit="m"
          sub={`${t("dash.maxWaterLevel.sub")} ${overview.maxWaterLevel.muid}`}
        />
        <StatCard
          icon="pump"
          label={t("dash.activePumps")}
          value={`${overview.pumpsAndGates.activePumpCount} / ${overview.pumpsAndGates.totalPumpCount}`}
          sub={t("dash.activePumps.sub")}
        />
        <StatCard
          icon="gate"
          label={t("dash.closedGates")}
          value={`${overview.pumpsAndGates.closedGateCount} / ${overview.pumpsAndGates.totalGateCount}`}
          sub={t("dash.closedGates.sub")}
        />
      </div>

      <div className="dash-row-2col">
        <FloodMapPreview data={data} step={step} />
        <WeatherForecastCard rainForecast={data.rainForecast} />
      </div>

      <ForecastChartsRow
        rainTime={data.rainForecast.time}
        rainMm={data.rainForecast.precipitation}
        tideTime={data.tide.time}
        tideM={data.tide.levelM}
      />
    </div>
  );
}
