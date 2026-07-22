import { useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";
import { useT } from "../i18n/I18nContext";

const WINDOWS_H = [24, 48, 72];

function hourLabel(iso: string): string {
  const t = iso.split("T")[1];
  return t ? t.slice(0, 5) : iso;
}

interface Point { label: string; value: number }

function buildSeries(time: string[], values: number[], windowH: number): Point[] {
  const n = Math.min(windowH, time.length);
  return time.slice(0, n).map((iso, i) => ({ label: hourLabel(iso), value: values[i] }));
}

function WindowToggle({ value, onChange }: { value: number; onChange: (h: number) => void }) {
  return (
    <div className="dash-chart-toggle">
      {WINDOWS_H.map((h) => (
        <button
          key={h}
          type="button"
          className={`dash-chart-toggle-btn${h === value ? " active" : ""}`}
          onClick={() => onChange(h)}
        >
          {h}H
        </button>
      ))}
    </div>
  );
}

/** Two forecast chart cards (rain + water level), both driven by real,
 *  Supabase-backed 72-hour series already in `AppData` (P0-19) — no mock
 *  JSON, no new query. `tide` is documented synthetic demo data at the
 *  source (see tasks/backlog/phase-1.md P1-06 "Reality check") but is a
 *  real table value, not fabricated client-side. Window options match what
 *  the static snapshot actually spans (24H/48H/72H, sliced from index 0 —
 *  same "no live now" convention as P1-05), not the mockup's 1H/3H/6H. */
export default function ForecastChartsRow({
  rainTime, rainMm, tideTime, tideM,
}: {
  rainTime: string[]; rainMm: number[]; tideTime: string[]; tideM: number[];
}) {
  const t = useT();
  const [rainWindow, setRainWindow] = useState(24);
  const [tideWindow, setTideWindow] = useState(24);

  const rainSeries = buildSeries(rainTime, rainMm, rainWindow);
  const tideSeries = buildSeries(tideTime, tideM, tideWindow);

  return (
    <div className="dash-row-2col">
      <div className="dash-chart-card">
        <div className="dash-weather-card-head">
          <h3>{t("dash.rainForecastChart")}</h3>
          <WindowToggle value={rainWindow} onChange={setRainWindow} />
        </div>
        <div className="dash-chart-canvas">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rainSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} unit="mm" width={40} />
              <Tooltip formatter={(v: number) => [`${v.toFixed(1)} mm`, t("dash.rainForecastChart")]} />
              <Bar dataKey="value" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dash-chart-card">
        <div className="dash-weather-card-head">
          <h3>{t("dash.waterLevelForecastChart")}</h3>
          <WindowToggle value={tideWindow} onChange={setTideWindow} />
        </div>
        <div className="dash-chart-canvas">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tideSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} unit="m" width={40} domain={["auto", "auto"]} />
              <Tooltip formatter={(v: number) => [`${v.toFixed(2)} m`, t("dash.waterLevelForecastChart")]} />
              <Line type="monotone" dataKey="value" stroke="#0e7490" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
