import {
  Line, LineChart, ReferenceLine, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import type { AppData } from "../types";
import { useStore } from "../state/store";
import { traceNetwork } from "../network/trace";
import { stepLabel } from "../sim/simEngine";
import Icon from "../components/Icon";

const FIELD_LABELS: Record<string, string> = {
  muid: "ID",
  invertLevel: "Invert level (m)",
  groundLevel: "Ground level (m)",
  diameter: "Diameter (m)",
  upLevel: "Upstream invert (m)",
  downLevel: "Downstream invert (m)",
  length: "Length (m)",
  slope: "Slope (‰)",
  fromNode: "From node",
  toNode: "To node",
  riverName: "River",
  topoId: "Topo ID",
};

const KIND_TITLES = { manhole: "Manhole", link: "Pipe", outlet: "Outlet", river: "River" };

export default function FeatureInfo({ data }: { data: AppData }) {
  const selection = useStore((s) => s.selection);
  const trace = useStore((s) => s.trace);
  const setTrace = useStore((s) => s.setTrace);
  const setSelection = useStore((s) => s.setSelection);
  const simMode = useStore((s) => s.simMode);
  const simStep = useStore((s) => s.simStep);

  if (!selection) return null;
  const { kind, muid, properties } = selection;

  const rows = Object.entries(properties)
    .filter(([k]) => FIELD_LABELS[k])
    .map(([k, v]) => [FIELD_LABELS[k], formatValue(k, v)] as const);

  const series = kind === "manhole" ? data.simulation.nodeFill[muid] : undefined;
  const invert = Number(properties.invertLevel ?? 0);
  const ground = Number(properties.groundLevel ?? 0);
  const chartData = series?.map((f, i) => ({
    t: stepLabel(data.simulation, i),
    level: Number((invert + f * (ground - invert)).toFixed(2)),
  }));

  return (
    <div className="panel feature-info">
      <div className="feature-info-header">
        <h3>{KIND_TITLES[kind]} {muid}</h3>
        <button className="close" onClick={() => setSelection(null)}>×</button>
      </div>
      <table>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}><td>{label}</td><td>{value}</td></tr>
          ))}
        </tbody>
      </table>
      {kind === "manhole" && (
        <div className="trace-buttons">
          <button onClick={() => setTrace(traceNetwork(data.topology, data.links, muid, "upstream"))}>
            <Icon name="up" size={14} /> Trace upstream
          </button>
          <button onClick={() => setTrace(traceNetwork(data.topology, data.links, muid, "downstream"))}>
            <Icon name="down" size={14} /> Trace downstream
          </button>
          {trace && <button onClick={() => setTrace(null)}>Clear</button>}
        </div>
      )}
      {trace && (
        <p className="trace-summary">
          {trace.direction === "upstream" ? "Upstream" : "Downstream"}: {trace.links.length} pipes,{" "}
          {trace.nodes.length - 1} nodes, {trace.totalLength} m total
        </p>
      )}
      {simMode && chartData && (
        <>
          <h4>Water level - 24 h storm <span className="demo-badge">DEMO DATA</span></h4>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <XAxis dataKey="t" tick={{ fontSize: 10 }} interval={23} />
              <YAxis tick={{ fontSize: 10 }} domain={[invert, Math.max(ground + 0.5, ground)]} />
              <Tooltip />
              <ReferenceLine y={ground} stroke="#dc2626" strokeDasharray="4 3" label={{ value: "ground", fontSize: 10 }} />
              <ReferenceLine x={stepLabel(data.simulation, simStep)} stroke="#64748b" />
              <Line type="monotone" dataKey="level" stroke="#2f6fb0" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

function formatValue(key: string, v: unknown): string {
  if (typeof v !== "number") return String(v ?? "-");
  if (key === "diameter") return `${(v * 1000).toFixed(0)} mm`;
  if (key === "slope") return v.toFixed(2);
  return v.toFixed(2);
}
