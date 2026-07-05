import {
  Line, LineChart, Bar, BarChart, ReferenceLine, ResponsiveContainer,
  Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useAppData } from "../context/AppDataContext";
import { useStore } from "../state/store";
import { stepLabel } from "../sim/simEngine";
import DemoBadge from "./DemoBadge";

export interface ChartSeries {
  title: string;
  kind: "line" | "bar";
  unit: string;
  values: number[]; // per-step
  refLines?: { y: number; label: string; color: string }[];
}

export default function ChartModal({ series, onClose }: {
  series: ChartSeries;
  onClose: () => void;
}) {
  const data = useAppData();
  const sim = data.simulation;
  const step = useStore((s) => s.currentStep);
  const chartData = series.values.map((v, i) => ({ t: stepLabel(sim, i), v: Math.round(v * 100) / 100 }));
  const nowLabel = stepLabel(sim, step);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal chart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chart-modal-head">
          <h3>
            {series.title} <DemoBadge />
          </h3>
          <button className="close" onClick={onClose}>×</button>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          {series.kind === "line" ? (
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
              <XAxis dataKey="t" tick={{ fontSize: 10 }} interval={7} />
              <YAxis tick={{ fontSize: 10 }} unit={series.unit} />
              <Tooltip formatter={(v) => [`${v} ${series.unit}`, ""]} />
              <ReferenceLine x={nowLabel} stroke="#1d4ed8" strokeDasharray="4 3" />
              {series.refLines?.map((r) => (
                <ReferenceLine key={r.label} y={r.y} stroke={r.color} strokeDasharray="4 3"
                  label={{ value: r.label, fontSize: 10, fill: r.color }} />
              ))}
              <Line type="monotone" dataKey="v" stroke="#2f6fb0" dot={false} strokeWidth={2} />
            </LineChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
              <XAxis dataKey="t" tick={{ fontSize: 10 }} interval={7} />
              <YAxis tick={{ fontSize: 10 }} unit={series.unit} />
              <Tooltip formatter={(v) => [`${v} ${series.unit}`, ""]} />
              <ReferenceLine x={nowLabel} stroke="#1d4ed8" strokeDasharray="4 3" />
              <Bar dataKey="v" fill="#60a5fa" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
