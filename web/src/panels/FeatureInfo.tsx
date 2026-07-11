import {
  Line, LineChart, ReferenceLine, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import type { AppData } from "../types";
import { useStore } from "../state/store";
import { useT } from "../i18n/I18nContext";
import { traceNetwork } from "../network/trace";
import { stepLabel } from "../sim/simEngine";
import Icon from "../components/Icon";

const FIELD_LABEL_KEYS: Record<string, string> = {
  muid: "feature.id",
  invertLevel: "col.invert",
  groundLevel: "col.ground",
  diameter: "col.diameter",
  upLevel: "feature.upstreamInvert",
  downLevel: "feature.downstreamInvert",
  length: "col.length",
  slope: "col.slope",
  fromNode: "col.fromNode",
  toNode: "col.toNode",
  riverName: "col.river",
  topoId: "feature.topoId",
};

const KIND_TITLE_KEYS = {
  manhole: "feature.kind.manhole",
  link: "feature.kind.link",
  outlet: "feature.kind.outlet",
  river: "feature.kind.river",
};

export default function FeatureInfo({ data }: { data: AppData }) {
  const t = useT();
  const selection = useStore((s) => s.selection);
  const trace = useStore((s) => s.trace);
  const setTrace = useStore((s) => s.setTrace);
  const setSelection = useStore((s) => s.setSelection);
  const simMode = useStore((s) => s.simMode);
  const simStep = useStore((s) => s.simStep);

  if (!selection) return null;
  const { kind, muid, properties } = selection;

  const rows = Object.entries(properties)
    .filter(([k]) => FIELD_LABEL_KEYS[k])
    .map(([k, v]) => [t(FIELD_LABEL_KEYS[k]), formatValue(k, v)] as const);

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
        <h3>{t(KIND_TITLE_KEYS[kind])} {muid}</h3>
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
            <Icon name="up" size={14} /> {t("feature.traceUpstream")}
          </button>
          <button onClick={() => setTrace(traceNetwork(data.topology, data.links, muid, "downstream"))}>
            <Icon name="down" size={14} /> {t("feature.traceDownstream")}
          </button>
          {trace && <button onClick={() => setTrace(null)}>{t("feature.clear")}</button>}
        </div>
      )}
      {trace && (
        <p className="trace-summary">
          {t("feature.traceSummary")
            .replace("{dir}", trace.direction === "upstream" ? t("feature.upstream") : t("feature.downstream"))
            .replace("{pipes}", String(trace.links.length))
            .replace("{nodes}", String(trace.nodes.length - 1))
            .replace("{length}", String(trace.totalLength))}
        </p>
      )}
      {simMode && chartData && (
        <>
          <h4>{t("feature.waterLevelChart")} <span className="demo-badge">{t("app.demoBadge")}</span></h4>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <XAxis dataKey="t" tick={{ fontSize: 10 }} interval={23} />
              <YAxis tick={{ fontSize: 10 }} domain={[invert, Math.max(ground + 0.5, ground)]} />
              <Tooltip />
              <ReferenceLine y={ground} stroke="#dc2626" strokeDasharray="4 3" label={{ value: t("myArea.ground"), fontSize: 10 }} />
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
