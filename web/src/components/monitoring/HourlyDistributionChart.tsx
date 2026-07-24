import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useT } from "../../i18n/I18nContext";
import { HOUR_BUCKETS, type DistributionSeries } from "../../data/monitoringService";

const COLORS = ["#1e40af", "#16a34a", "#f97316", "#7c3aed"];

/** Phân bố mưa theo khung giờ (24h): 1 biểu đồ cột gộp — Tổng (TB) + tối đa 3
 *  trạm đại diện. Trục dọc mm, trục ngang 8 khung 3 giờ. */
export default function HourlyDistributionChart({ series }: { series: DistributionSeries[] }) {
  const t = useT();
  const named = series.map((s) => ({ ...s, name: s.key === "total" ? t("mon.dist.total") : s.name }));

  const data = HOUR_BUCKETS.map((bucket, b) => {
    const row: Record<string, number | string> = { bucket };
    for (const s of named) row[s.name] = s.values[b];
    return row;
  });

  return (
    <div className="dash-chart-card mon-chart-card">
      <div className="dash-weather-card-head">
        <h3>{t("mon.dist.title")}</h3>
      </div>
      <div className="mon-chart-canvas mon-chart-canvas--tall">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} unit="mm" width={38} />
            <Tooltip formatter={(v: number) => `${v.toFixed(1)} mm`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {named.map((s, i) => (
              <Bar key={s.key} dataKey={s.name} fill={COLORS[i % COLORS.length]} radius={[2, 2, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
