import { Link } from "react-router-dom";
import Icon from "./Icon";
import { useT } from "../i18n/I18nContext";
import type { RainForecast } from "../types";

const HOURLY_SLOTS = 6;
const WINDOWS_H = [3, 6, 12, 24];

function intensityKey(mm: number): string {
  if (mm <= 0) return "dash.rainNone";
  if (mm < 1) return "dash.rainLight";
  if (mm < 5) return "dash.rainModerate";
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
 *  no mock JSON) — no temperature/probability shown since neither has a
 *  real source anywhere in this project (see tasks/backlog/phase-1.md
 *  P1-05 "Reality check"). Index 0 (`generatedAt`) is treated as this
 *  series' own reference point, same placeholder pattern as P1-02/P1-03's
 *  `step = simulation.steps - 1` — there is no shared live "now" yet. */
export default function WeatherForecastCard({ rainForecast }: { rainForecast: RainForecast }) {
  const t = useT();
  const hours = Math.min(HOURLY_SLOTS, rainForecast.time.length);
  const rainyHoursIn24h = rainForecast.precipitation.slice(0, 24).filter((v) => v > 0).length;
  const totalHoursIn24h = Math.min(24, rainForecast.precipitation.length);

  return (
    <div className="dash-weather-card">
      <div className="dash-weather-card-head">
        <h3>{t("dash.weatherForecast")}</h3>
        <Link to="/forecast" className="dash-map-card-link">{t("dash.viewFullForecast")}</Link>
      </div>

      <div className="dash-weather-strip">
        {Array.from({ length: hours }, (_, i) => {
          const mm = rainForecast.precipitation[i];
          return (
            <div key={rainForecast.time[i]} className="dash-weather-slot">
              <span className="dash-weather-slot-time">{hourLabel(rainForecast.time[i])}</span>
              <Icon name="cloud-rain" size={20} />
              <span className="dash-weather-slot-mm">{mm.toFixed(1)} mm</span>
              <span className="dash-weather-slot-label">{t(intensityKey(mm))}</span>
            </div>
          );
        })}
      </div>

      <div className="dash-weather-windows">
        {WINDOWS_H.map((h) => (
          <div key={h} className="dash-weather-window">
            <span className="dash-weather-window-h">{h}h</span>
            <span className="dash-weather-window-mm">{windowSumMm(rainForecast.precipitation, h).toFixed(1)} mm</span>
          </div>
        ))}
      </div>

      <div className="dash-weather-summary">
        {t("dash.rainyHours")} {rainyHoursIn24h}/{totalHoursIn24h}
      </div>
    </div>
  );
}
