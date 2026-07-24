import Icon, { type IconName } from "../components/Icon";
import FloodMapPreview from "../components/FloodMapPreview";
import WeatherForecastCard from "../components/WeatherForecastCard";
import RainForecastChart from "../components/RainForecastChart";
import WaterLevelForecastChart from "../components/WaterLevelForecastChart";
import { useAppData } from "../context/AppDataContext";
import { useI18n } from "../i18n/I18nContext";
import { getDashboardOverview } from "../data/dashboardService";
import { stepTimeLabel } from "../lib/simTime";
import { useCurrentSimStep } from "../lib/useCurrentSimStep";

/** Today's real calendar date, localized to the active UI language - moved
 *  here from the global TopBar (see TopBar.tsx) to match the reference
 *  mockup's layout, where date/weather sits under the page title, not in
 *  the persistent shell chrome. Still a static mock 26°C - no live weather
 *  API wired (out of scope for this redesign, see tasks/backlog/phase-0.md
 *  P0-08). */
function todayLabel(lang: string): string {
  const locale = lang === "en" ? "en-US" : "vi-VN";
  return new Date().toLocaleDateString(locale, { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
}

type Tone = "red" | "orange" | "blue" | "cyan" | "teal" | "green";

// Temporary fixed display values for "max water level"/"max rainfall",
// overriding `dashboardService`'s computed area-average/no-station-identity
// numbers (see docs/learn-log/P1-01-dashboard-service.md - no per-station
// rain data exists in this project's real source). Explicit user request
// (2026-07-22) to show a specific station reading instead, ahead of a real
// per-station data source landing - revisit once one does.
const DEMO_MAX_WATER_LEVEL_M = 1.42;
const DEMO_MAX_RAINFALL_MM = 132;

function StatCard({ icon, tone, label, value, unit, sub, secondary, valueTone, disabled }: {
  icon: IconName;
  tone: Tone;
  label: string;
  value: string;
  unit?: string;
  sub: string;
  /** De-emphasized styling for supporting KPIs (rain/pumps/gates) so the
   *  primary ones (flood points/routes/water level) win the first glance -
   *  government-GIS review: fewer things competing for attention. */
  secondary?: boolean;
  /** Color the number itself for count-based safety indicators (0 = safe,
   *  >0 = danger) so the reading doesn't require parsing the sub-label. */
  valueTone?: "safe" | "danger";
  /** Card isn't backed by trustworthy data yet - show a locked "coming
   *  soon" placeholder instead of `value`/`sub` rather than a number that
   *  looks real but isn't (same "don't fabricate" stance as elsewhere in
   *  this dashboard, e.g. dashboardService's documented placeholders). */
  disabled?: boolean;
}) {
  return (
    <div className={`dash-card${secondary ? " dash-card--secondary" : ""}${disabled ? " dash-card--disabled" : ""}`}>
      <div className={`dash-card-icon dash-card-icon--${tone}`}>
        <Icon name={disabled ? "lock" : icon} size={22} />
      </div>
      <div className="dash-card-body">
        <div className="dash-card-label">{label}</div>
        {disabled ? (
          <div className="dash-card-comingsoon">{sub}</div>
        ) : (
          <>
            <div className={`dash-card-value${valueTone ? ` dash-card-value--${valueTone}` : ""}`}>
              {value}{unit && <span className="dash-card-unit">{unit}</span>}
            </div>
            <div className="dash-card-sub">{sub}</div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t, lang } = useI18n();
  const data = useAppData();

  // Real wall-clock time-of-day mapped onto the simulation's fixed 24h
  // cycle (2026-07-23 follow-up) — replaces the old `steps - 1` placeholder
  // that always showed the storm's peak/final state regardless of when the
  // page was actually opened. Live-updating (recomputed every minute).
  const step = useCurrentSimStep(data.simulation);
  const overview = getDashboardOverview(data, step);
  const updatedAt = stepTimeLabel(data.simulation.start, data.simulation.stepMinutes, step);

  function deltaLabel(delta: number): string {
    if (delta === 0) return t("dash.deltaNone");
    const sign = delta > 0 ? "▲" : "▼";
    return `${sign} ${Math.abs(delta)} ${t("dash.deltaMore")}`;
  }

  return (
    <div className="content-page2">
      <div className="dash-summary-bar">
        <h2 className="dash-summary-heading">{t("dash.heading")}</h2>
        <div className="dash-summary-right">
          <div className="dash-summary-date-weather">
            <span className="dash-summary-date">{todayLabel(lang)}</span>
            <span className="dash-summary-weather">
              <Icon name="cloud-rain" size={16} />
              <span>26°C</span>
            </span>
          </div>
          <span className="dash-summary-updated">{t("dash.updatedAt")} {updatedAt}</span>
        </div>
      </div>

      <div className="dash-card-grid">
        <StatCard
          icon="alert-triangle"
          tone="red"
          label={t("dash.floodPoints")}
          value={String(overview.floodPointCount)}
          sub={deltaLabel(overview.floodPointDelta)}
          valueTone={overview.floodPointCount > 0 ? "danger" : "safe"}
        />
        <StatCard
          icon="route"
          tone="orange"
          label={t("dash.floodedRoutes")}
          value={String(overview.floodedRouteCount)}
          sub={t("dash.comingSoonShort")}
          disabled
        />
        <StatCard
          icon="droplet"
          tone="cyan"
          label={t("dash.maxWaterLevel")}
          value={DEMO_MAX_WATER_LEVEL_M.toFixed(2)}
          unit="m"
          sub={t("dash.maxWaterLevel.sub")}
        />
        <StatCard
          icon="cloud-rain"
          tone="blue"
          label={t("dash.maxRainfall")}
          value={String(DEMO_MAX_RAINFALL_MM)}
          unit="mm"
          sub={t("dash.maxRainfall.sub")}
          secondary
        />
        <StatCard
          icon="pump"
          tone="teal"
          label={t("dash.activePumps")}
          value={`${overview.pumpsAndGates.activePumpCount} / ${overview.pumpsAndGates.totalPumpCount}`}
          sub={t("dash.activePumps.sub")}
          secondary
        />
        <StatCard
          icon="gate"
          tone="green"
          label={t("dash.closedGates")}
          value={`${overview.pumpsAndGates.closedGateCount} / ${overview.pumpsAndGates.totalGateCount}`}
          sub={t("dash.closedGates.sub")}
          secondary
        />
      </div>

      {/* Map-dominant layout: the flood map gets 3/4 of the width (as large
          as the layout can give it), the remaining 1/4 stacks the 3 smaller
          panels - weather summary + the 2 forecast charts - instead of the
          old 2-col-row-then-full-width-row layout. */}
      <div className="dash-main-row">
        <div className="dash-map-col">
          <FloodMapPreview data={data} step={step} updatedAt={updatedAt} />
        </div>
        <div className="dash-side-col">
          <WeatherForecastCard rainForecast={data.rainForecast} />
          <RainForecastChart time={data.rainForecast.time} mm={data.rainForecast.precipitation} />
          <WaterLevelForecastChart time={data.tide.time} levelM={data.tide.levelM} />
        </div>
      </div>
    </div>
  );
}
