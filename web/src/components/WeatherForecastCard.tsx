import { Link } from "react-router-dom";
import Icon from "./Icon";
import { useT } from "../i18n/I18nContext";
import type { RainForecast } from "../types";

const HOURLY_SLOTS = 6;
const WINDOWS_H = [3, 6, 12, 24];
const HEAVY_RAIN_MM = 5;

function intensityKey(mm: number): string {
  if (mm <= 0) return "dash.rainNone";
  if (mm < 1) return "dash.rainLight";
  if (mm < HEAVY_RAIN_MM) return "dash.rainModerate";
  return "dash.rainHeavy";
}

function hourLabel(iso: string): string {
  const t = iso.split("T")[1];
  return t ? t.slice(0, 5) : iso;
}

function windowSumMm(precipitation: number[], hours: number): number {
  return precipitation.slice(0, hours).reduce((sum, v) => sum + v, 0);
}

/** Weather-forecast card built from the real `rainForecast` series (P0-19,
 *  no mock JSON) — no temperature shown since it has no real source
 *  anywhere in this project (see tasks/backlog/phase-1.md P1-05 "Reality
 *  check"). "Xác suất mưa lớn" (mockup's fabricated 85% figure, no real
 *  probability model behind it) is replaced by a real, honestly-derived
 *  statistic with the same label: the share of the next 24h forecast to
 *  reach the "heavy rain" threshold (`HEAVY_RAIN_MM`), as a percentage —
 *  a real computed rate, not an invented forecast probability. Index 0
 *  (`generatedAt`) is treated as this series' own reference point, same
 *  placeholder pattern as P1-02/P1-03's `step = simulation.steps - 1` —
 *  there is no shared live "now" yet. */
export default function WeatherForecastCard({ rainForecast }: { rainForecast: RainForecast }) {
  const t = useT();
  const hours = Math.min(HOURLY_SLOTS, rainForecast.time.length);
  const next24h = rainForecast.precipitation.slice(0, 24);
  const heavyRainPct = next24h.length > 0
    ? Math.round((next24h.filter((v) => v >= HEAVY_RAIN_MM).length / next24h.length) * 100)
    : 0;

  return (
    <div className="dash-weather-card">
      <div className="dash-weather-card-head">
        <h3>{t("dash.weatherForecast")}</h3>
        <Link to="/forecast" className="dash-card-link-inline">{t("dash.viewFullForecast")}</Link>
      </div>

      <div className="dash-weather-strip">
        {Array.from({ length: hours }, (_, i) => {
          const mm = rainForecast.precipitation[i];
          const isFirst = i === 0;
          return (
            <div key={rainForecast.time[i]} className="dash-weather-slot">
              <span className="dash-weather-slot-time">{isFirst ? t("dash.now") : hourLabel(rainForecast.time[i])}</span>
              <Icon name="cloud-rain" size={22} className="dash-weather-slot-icon" />
              <span className="dash-weather-slot-mm">{mm.toFixed(1)} mm</span>
              <span className="dash-weather-slot-label">{t(intensityKey(mm))}</span>
            </div>
          );
        })}
      </div>

      <div className="dash-weather-bottom-row">
        <div className="dash-weather-windows-inline">
          <span className="dash-weather-windows-label">{t("dash.rainWindowsLabel")}</span>
          {WINDOWS_H.map((h, i) => (
            <span key={h}>
              {i > 0 && <span className="dash-weather-windows-sep">|</span>}
              {h}h: <strong>{windowSumMm(rainForecast.precipitation, h).toFixed(1)}</strong>
            </span>
          ))}
        </div>
        <div className="dash-weather-badge">
          <span className="dash-weather-badge-label">{t("dash.heavyRainProbability")}</span>{" "}
          <span className="dash-weather-badge-value">{heavyRainPct}%</span>
        </div>
      </div>
    </div>
  );
}
