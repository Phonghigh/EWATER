import { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useT } from "../../i18n/I18nContext";
import type { RainStation } from "../../types";
import { rainTrend, type RainGranularity } from "../../data/monitoringService";

const COLORS = ["#2563eb", "#16a34a", "#f97316", "#dc2626", "#7c3aed"];
const MAX_SELECTED = 5;

const GRANS: { key: RainGranularity; labelKey: string }[] = [
  { key: "min10", labelKey: "mon.trend.min10" },
  { key: "hour", labelKey: "mon.trend.hour" },
  { key: "day", labelKey: "mon.trend.day" },
];

/** Biểu đồ diễn biến mưa đa trạm. Toggle 10 phút/giờ/ngày, chọn tối đa 5 trạm
 *  (mặc định 5 trạm đầu). Trục dọc mm, trục ngang tối đa 6 mốc tính từ hiện tại. */
export default function RainTrendChart({ stations, step }: { stations: RainStation[]; step: number }) {
  const t = useT();
  const [gran, setGran] = useState<RainGranularity>("min10");
  const [selected, setSelected] = useState<string[]>(() => stations.slice(0, MAX_SELECTED).map((s) => s.code));

  const selectedStations = useMemo(
    () => stations.filter((s) => selected.includes(s.code)),
    [stations, selected],
  );
  const { data } = useMemo(() => rainTrend(selectedStations, gran, step), [selectedStations, gran, step]);

  function toggleStation(code: string) {
    setSelected((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code);
      if (prev.length >= MAX_SELECTED) return prev;
      return [...prev, code];
    });
  }

  return (
    <div className="dash-chart-card mon-chart-card">
      <div className="dash-weather-card-head">
        <h3>{t("mon.trend.title")}</h3>
        <div className="dash-chart-toggle">
          {GRANS.map((g) => (
            <button
              key={g.key}
              type="button"
              className={`dash-chart-toggle-btn${g.key === gran ? " active" : ""}`}
              onClick={() => setGran(g.key)}
            >
              {t(g.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="mon-trend-picker" role="group" aria-label={t("mon.trend.selectStations")}>
        {/* <span className="mon-trend-picker-hint">{t("mon.trend.selectStations")}</span> */}
        {stations.map((s) => {
          const on = selected.includes(s.code);
          const full = !on && selected.length >= MAX_SELECTED;
          return (
            <button
              key={s.code}
              type="button"
              className={`mon-chip${on ? " active" : ""}`}
              disabled={full}
              onClick={() => toggleStation(s.code)}
              aria-pressed={on}
            >
              {s.name}
            </button>
          );
        })}
      </div>

      <div className="mon-chart-canvas mon-chart-canvas--tall">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="mm" width={38} />
            <Tooltip formatter={(v: number) => `${v.toFixed(1)} mm`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {selectedStations.map((s, i) => (
              <Line
                key={s.code}
                type="monotone"
                dataKey={s.name}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 2.5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
