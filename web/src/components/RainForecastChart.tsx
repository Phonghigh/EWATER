import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { useT } from "../i18n/I18nContext";

const WINDOWS_H = [6, 12, 24, 48];

function hourLabel(iso: string): string {
  const t = iso.split("T")[1];
  return t ? t.slice(0, 5) : iso;
}

/** Rain-forecast bar chart, real `rainForecast` series (P0-19). The source
 *  series is hourly (`stepHours: 1`) — the reference mockup's 1H/3H/6H/24H
 *  toggle would show 1/3/6 bars for its first three options, which reads as
 *  broken rather than a trend (same call already made for the water-level
 *  chart's window set, see docs/learn-log/P1-06-forecast-charts.md §5).
 *  Window options here read as "how many hours of the real forecast to
 *  show" (forward-looking), sliced from index 0, same "no live now"
 *  convention as the rest of the Dashboard. */
export default function RainForecastChart({ time, mm }: { time: string[]; mm: number[] }) {
  const t = useT();
  const [windowH, setWindowH] = useState(12);
  const n = Math.min(windowH, time.length);
  const series = time.slice(0, n).map((iso, i) => ({ label: hourLabel(iso), value: mm[i] }));
  // This card lives in the narrow 1/4-width side column, not a full-width
  // chart — even 12 labels overlap into an unreadable smear there. Cap to
  // ~6 evenly-spaced labels regardless of how many bars are shown.
  const MAX_LABELS = 6;
  const tickInterval = n <= MAX_LABELS ? 0 : Math.ceil(n / MAX_LABELS) - 1;

  return (
    <div className="dash-chart-card">
      <div className="dash-weather-card-head">
        <h3>{t("dash.rainForecastChart")}</h3>
        <div className="dash-chart-toggle">
          {WINDOWS_H.map((h) => (
            <button
              key={h}
              type="button"
              className={`dash-chart-toggle-btn${h === windowH ? " active" : ""}`}
              onClick={() => setWindowH(h)}
            >
              {h}H
            </button>
          ))}
        </div>
      </div>
      <div className="dash-chart-canvas">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={tickInterval} />
            <YAxis tick={{ fontSize: 12 }} unit="mm" width={38} />
            <Tooltip formatter={(v: number) => [`${v.toFixed(1)} mm`, t("dash.rainForecastChart")]} />
            <Bar dataKey="value" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
