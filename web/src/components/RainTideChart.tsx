import {
  Bar, ComposedChart, Legend, Line, ResponsiveContainer,
  Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useAppData } from "../context/AppDataContext";
import { useT } from "../i18n/I18nContext";

export function formatTick(iso: string) {
  const [datePart, timePart] = iso.split("T");
  return `${datePart.slice(8, 10)}/${timePart}`;
}

export default function RainTideChart({ from = 0, to }: { from?: number; to?: number }) {
  const data = useAppData();
  const t = useT();
  const { time, precipitation } = data.rainForecast;
  const { levelM } = data.tide;
  const end = to ?? time.length - 1;

  const chartData = time.slice(from, end + 1).map((iso, i) => ({
    t: formatTick(iso),
    rain: precipitation[from + i],
    tide: levelM[from + i],
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
          <XAxis dataKey="t" tick={{ fontSize: 10 }} interval={5} />
          <YAxis yAxisId="rain" tick={{ fontSize: 10 }} unit="mm/h" />
          <YAxis yAxisId="tide" orientation="right" tick={{ fontSize: 10 }} unit="m" />
          <Tooltip />
          <Legend iconType="square" />
          <Bar yAxisId="rain" dataKey="rain" name={t("dash.rainTideRainLabel")} fill="#60a5fa" />
          <Line yAxisId="tide" dataKey="tide" name={t("dash.rainTideLabel")}
            stroke="#2f9e6f" dot={false} strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="chart-caption">{t("dash.rainTideCaption")}</p>
    </div>
  );
}
