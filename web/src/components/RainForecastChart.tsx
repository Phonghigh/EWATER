import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { useT } from "../i18n/I18nContext";

const WINDOWS_H = [1, 3, 6, 24];

function hourLabel(iso: string): string {
  const t = iso.split("T")[1];
  return t ? t.slice(0, 5) : iso;
}

/** Rain-forecast bar chart, real `rainForecast` series (P0-19). Window
 *  options (1H/3H/6H/24H) match the reference mockup's "Diễn biến mưa"
 *  toggle, read here as "how many hours of the real forecast to show"
 *  (forward-looking) rather than a historical rolling window — sliced from
 *  index 0, same "no live now" convention as the rest of the Dashboard. */
export default function RainForecastChart({ time, mm }: { time: string[]; mm: number[] }) {
  const t = useT();
  const [windowH, setWindowH] = useState(3);
  const n = Math.min(windowH, time.length);
  const series = time.slice(0, n).map((iso, i) => ({ label: hourLabel(iso), value: mm[i] }));

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
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} unit="mm" width={34} />
            <Tooltip formatter={(v: number) => [`${v.toFixed(1)} mm`, t("dash.rainForecastChart")]} />
            <Bar dataKey="value" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
