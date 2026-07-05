import { useMemo, useState } from "react";
import {
  Bar, BarChart, Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useAppData } from "../context/AppDataContext";
import { useT } from "../i18n/I18nContext";
import { useMonitoring } from "../monitoring/useMonitoring";
import { stepLabel } from "../sim/simEngine";
import { downloadCsv } from "../components/csv";
import DemoBadge from "../components/DemoBadge";
import Icon from "../components/Icon";
import { bandOf } from "../monitoring/aggregate";

type ReportType = "rainfall" | "waterLevel" | "gates" | "flood";

export default function Report() {
  const data = useAppData();
  const t = useT();
  const mon = useMonitoring();
  const sim = data.simulation;
  const lastStep = sim.steps - 1;

  const [type, setType] = useState<ReportType>("rainfall");
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(lastStep);
  const [applied, setApplied] = useState<{ type: ReportType; from: number; to: number } | null>({
    type: "rainfall", from: 0, to: lastStep,
  });

  const report = useMemo(() => (applied ? buildReport(applied, mon, sim) : null), [applied, mon, sim]);

  function exportCsv() {
    if (!report) return;
    downloadCsv(`report-${applied!.type}.csv`, report.headers, report.rows);
  }

  return (
    <div className="content-page report">
      <div className="page-head">
        <h2>{t("report.title")} <DemoBadge title /></h2>
      </div>

      <div className="report-controls">
        <label>
          {t("report.type")}
          <select value={type} onChange={(e) => setType(e.target.value as ReportType)}>
            <option value="rainfall">{t("report.type.rainfall")}</option>
            <option value="waterLevel">{t("report.type.waterLevel")}</option>
            <option value="gates">{t("report.type.gates")}</option>
            <option value="flood">{t("report.type.flood")}</option>
          </select>
        </label>
        <label>
          {t("report.from")}
          <select value={from} onChange={(e) => setFrom(Number(e.target.value))}>
            {Array.from({ length: sim.steps }, (_, i) => <option key={i} value={i}>{stepLabel(sim, i)}</option>)}
          </select>
        </label>
        <label>
          {t("report.to")}
          <select value={to} onChange={(e) => setTo(Number(e.target.value))}>
            {Array.from({ length: sim.steps }, (_, i) => <option key={i} value={i}>{stepLabel(sim, i)}</option>)}
          </select>
        </label>
        <button className="csv-btn" onClick={() => setApplied({ type, from: Math.min(from, to), to: Math.max(from, to) })}>
          {t("report.generate")}
        </button>
        <button className="csv-btn" onClick={exportCsv}><Icon name="download" size={14} /> {t("report.exportCsv")}</button>
        <button className="csv-btn" onClick={() => window.print()}><Icon name="print" size={14} /> {t("report.print")}</button>
      </div>

      {report && (
        <>
          <div className="report-summary">{report.summary}</div>
          {report.chart && (
            <div className="report-chart">
              <ResponsiveContainer width="100%" height={240}>
                {report.chart.kind === "line" ? (
                  <LineChart data={report.chart.data} margin={{ top: 8, right: 16, left: -10, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                    <XAxis dataKey="t" tick={{ fontSize: 10 }} interval={7} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="v" stroke="#2f6fb0" dot={false} strokeWidth={2} />
                  </LineChart>
                ) : (
                  <BarChart data={report.chart.data} margin={{ top: 8, right: 16, left: -10, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                    <XAxis dataKey="t" tick={{ fontSize: 10 }} interval={7} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="v" fill="#60a5fa" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
          <div className="dt-scroll">
            <table className="dt-table">
              <thead><tr>{report.headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {report.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

interface BuiltReport {
  summary: string;
  headers: string[];
  rows: (string | number)[][];
  chart?: { kind: "line" | "bar"; data: { t: string; v: number }[] };
}

function buildReport(
  a: { type: ReportType; from: number; to: number },
  mon: import("../monitoring/stations").Monitoring,
  sim: import("../types").Simulation,
): BuiltReport {
  const range = <T,>(arr: T[]) => arr.slice(a.from, a.to + 1);
  const labels = (i: number) => stepLabel(sim, a.from + i);

  if (a.type === "rainfall") {
    const rainfall = range(sim.rainfall);
    const totalmm = rainfall.reduce((s, v) => s + v * 0.25, 0);
    const peak = Math.max(...rainfall);
    return {
      summary: `Rainfall ${stepLabel(sim, a.from)}–${stepLabel(sim, a.to)}: total ${totalmm.toFixed(1)} mm, peak intensity ${peak.toFixed(1)} mm/h.`,
      headers: ["Time", "Intensity (mm/h)", "Cumulative (mm)"],
      rows: rainfall.map((v, i) => {
        const cum = rainfall.slice(0, i + 1).reduce((s, x) => s + x * 0.25, 0);
        return [labels(i), v.toFixed(1), cum.toFixed(1)];
      }),
      chart: { kind: "bar", data: rainfall.map((v, i) => ({ t: labels(i), v: Math.round(v * 10) / 10 })) },
    };
  }

  if (a.type === "waterLevel") {
    const rows = mon.level.map((s) => {
      const seg = s.levels.slice(a.from, a.to + 1);
      const max = Math.max(...seg);
      let exceed = 0;
      for (let i = a.from; i <= a.to; i++) if (bandOf(s, i) === "above3") exceed++;
      return [s.id, s.name, max.toFixed(2), s.alert3.toFixed(2), `${exceed} × 15'`];
    });
    const nExceed = rows.filter((r) => r[4] !== "0 × 15'").length;
    return {
      summary: `Water-level exceedances ${stepLabel(sim, a.from)}–${stepLabel(sim, a.to)}: ${nExceed} of ${mon.level.length} stations exceeded alert 3.`,
      headers: ["Station", "Name", "Max level (m)", "Alert 3 (m)", "Time above A3"],
      rows,
    };
  }

  if (a.type === "gates") {
    const rows = mon.gates.map((g) => {
      let closed = 0;
      for (let i = a.from; i <= a.to; i++) if (g.status[i] === "CLOSED") closed++;
      return [g.id, g.name, g.type, `${closed} × 15'`, g.status[a.to]];
    });
    return {
      summary: `Gate/pump operations ${stepLabel(sim, a.from)}–${stepLabel(sim, a.to)}: ${mon.gates.length} structures.`,
      headers: ["Code", "Name", "Type", "Time closed", "Final state"],
      rows,
    };
  }

  // flood event
  const surchargeSeries = range(
    Array.from({ length: sim.steps }, (_, i) => {
      let n = 0;
      for (const s of Object.values(sim.nodeFill)) if ((s[i] ?? 0) > 1) n++;
      return n;
    }),
  );
  const peakSur = Math.max(...surchargeSeries);
  return {
    summary: `Flood event ${stepLabel(sim, a.from)}–${stepLabel(sim, a.to)}: peak ${peakSur} surcharged manholes.`,
    headers: ["Time", "Surcharged manholes"],
    rows: surchargeSeries.map((v, i) => [labels(i), v]),
    chart: { kind: "line", data: surchargeSeries.map((v, i) => ({ t: labels(i), v })) },
  };
}
