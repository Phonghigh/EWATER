import { useState } from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { useT } from "../i18n/I18nContext";

const WINDOWS_H = [6, 12, 24, 72];

function hourLabel(iso: string): string {
  const t = iso.split("T")[1];
  return t ? t.slice(0, 5) : iso;
}

/** Water-level (tide) forecast line chart, real `tide.levelM` series
 *  (P0-19) — synthetic in origin but a real Supabase row, not a
 *  client-fabricated number (see tasks/backlog/phase-1.md P1-06 "Reality
 *  check"). Window options (6H/12H/24H/72H) match the reference mockup's
 *  "Diễn biến mực nước" toggle exactly, and both fit cleanly since the
 *  source series is 72 real hourly points — 72H is the full series. */
export default function WaterLevelForecastChart({ time, levelM }: { time: string[]; levelM: number[] }) {
  const t = useT();
  const [windowH, setWindowH] = useState(24);
  const n = Math.min(windowH, time.length);
  const series = time.slice(0, n).map((iso, i) => ({ label: hourLabel(iso), value: levelM[i] }));

  return (
    <div className="dash-chart-card">
      <div className="dash-weather-card-head">
        <h3>{t("dash.waterLevelForecastChart")}</h3>
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
          <LineChart data={series} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} unit="m" width={34} domain={["auto", "auto"]} />
            <Tooltip formatter={(v: number) => [`${v.toFixed(2)} m`, t("dash.waterLevelForecastChart")]} />
            <Line type="monotone" dataKey="value" stroke="#0e7490" strokeWidth={2} dot={{ r: 2.5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
