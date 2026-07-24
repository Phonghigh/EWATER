import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LabelList } from "recharts";
import { useT } from "../../i18n/I18nContext";
import type { TopRainItem } from "../../data/monitoringService";

/** Top 10 trạm mưa 24h — thanh ngang, giá trị mm nhãn trực tiếp trên thanh. */
export default function TopRainChart({ items }: { items: TopRainItem[] }) {
  const t = useT();
  return (
    <div className="dash-chart-card mon-chart-card">
      <div className="dash-weather-card-head">
        <h3>{t("mon.top.title")}</h3>
      </div>
      <div className="mon-chart-canvas mon-chart-canvas--tall">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items} layout="vertical" margin={{ top: 4, right: 34, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} unit="mm" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={104} />
            <Tooltip formatter={(v: number) => [`${v.toFixed(1)} mm`, t("mon.col.r24h")]} />
            <Bar dataKey="mm" fill="#2563eb" radius={[0, 3, 3, 0]}>
              <LabelList dataKey="mm" position="right" formatter={(v: number) => v.toFixed(1)} style={{ fontSize: 10, fill: "#475569" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
