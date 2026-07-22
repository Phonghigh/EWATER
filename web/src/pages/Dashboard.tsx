import Icon, { type IconName } from "../components/Icon";
import FloodMapPreview from "../components/FloodMapPreview";
import WeatherForecastCard from "../components/WeatherForecastCard";
import RainForecastChart from "../components/RainForecastChart";
import WaterLevelForecastChart from "../components/WaterLevelForecastChart";
import { useAppData } from "../context/AppDataContext";
import { useI18n } from "../i18n/I18nContext";
import { getDashboardOverview } from "../data/dashboardService";

/** Time-of-day label for a simulation step (start + step * stepMinutes). */
function stepTimeLabel(start: string, stepMinutes: number, step: number): string {
  const totalMin = (start ? parseInt(start.split(":")[0], 10) * 60 + parseInt(start.split(":")[1], 10) : 0) + step * stepMinutes;
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Today's real calendar date, localized to the active UI language — moved
 *  here from the global TopBar (see TopBar.tsx) to match the reference
 *  mockup's layout, where date/weather sits under the page title, not in
 *  the persistent shell chrome. Still a static mock 26°C — no live weather
 *  API wired (out of scope for this redesign, see tasks/backlog/phase-0.md
 *  P0-08). */
function todayLabel(lang: string): string {
  const locale = lang === "en" ? "en-US" : "vi-VN";
  return new Date().toLocaleDateString(locale, { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
}

type Tone = "red" | "orange" | "blue" | "cyan" | "teal" | "green";

function StatCard({ icon, tone, label, value, unit, sub, secondary, valueTone, disabled }: {
  icon: IconName;
  tone: Tone;
  label: string;
  value: string;
  unit?: string;
  sub: string;
  /** De-emphasized styling for supporting KPIs (rain/pumps/gates) so the
   *  primary ones (flood points/routes/water level) win the first glance —
   *  government-GIS review: fewer things competing for attention. */
  secondary?: boolean;
  /** Color the number itself for count-based safety indicators (0 = safe,
   *  >0 = danger) so the reading doesn't require parsing the sub-label. */
  valueTone?: "safe" | "danger";
  /** Card isn't backed by trustworthy data yet — show a locked "coming
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
          value={overview.maxWaterLevel.levelM.toFixed(2)}
          unit="m"
          sub={`${t("dash.maxWaterLevel.sub")} ${overview.maxWaterLevel.muid}`}
        />
        <StatCard
          icon="cloud-rain"
          tone="blue"
          label={t("dash.maxRainfall")}
          value={overview.maxRainfallMm.toFixed(1)}
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
          panels — weather summary + the 2 forecast charts — instead of the
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
