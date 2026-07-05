import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";
import { useT } from "../i18n/I18nContext";
import { useStore } from "../state/store";
import { useMonitoring } from "../monitoring/useMonitoring";
import { WINDOWS, trailingRain, forwardRain, stepClock } from "../monitoring/windows";
import { bandOf } from "../monitoring/aggregate";
import type { RainStation, LevelStation, Gate, Area, Source } from "../monitoring/stations";
import DataTable, { type Column } from "../components/DataTable";
import ChartModal, { type ChartSeries } from "../components/ChartModal";
import StepControl from "../components/StepControl";
import DemoBadge from "../components/DemoBadge";
import Icon from "../components/Icon";

const TABS = [
  { key: "rainfall-actual", label: "monitor.rainfallActual" },
  { key: "rainfall-forecast", label: "monitor.rainfallForecast" },
  { key: "water-level", label: "monitor.waterLevel" },
  { key: "gates", label: "monitor.gates" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function Monitor() {
  const { tab } = useParams<{ tab: string }>();
  const nav = useNavigate();
  const t = useT();
  const data = useAppData();
  const mon = useMonitoring();
  const step = useStore((s) => s.currentStep);

  const active = (TABS.find((x) => x.key === tab)?.key ?? "water-level") as TabKey;

  const [source, setSource] = useState<Source | "all">("all");
  const [area, setArea] = useState<Area | "all">("all");
  const [chart, setChart] = useState<ChartSeries | null>(null);

  const filters = (
    <>
      <select value={source} onChange={(e) => setSource(e.target.value as Source | "all")}>
        <option value="all">{t("monitor.source")}: {t("monitor.all")}</option>
        <option value="SCADA">SCADA</option>
        <option value="SRHMC">SRHMC</option>
      </select>
      {active !== "gates" && (
        <select value={area} onChange={(e) => setArea(e.target.value as Area | "all")}>
          <option value="all">{t("monitor.area")}: {t("monitor.all")}</option>
          <option value="urban">{t("area.urban")}</option>
          <option value="city">{t("area.city")}</option>
        </select>
      )}
    </>
  );

  function matchRain(s: RainStation) {
    return (source === "all" || s.source === source) && (area === "all" || s.area === area);
  }
  function matchLevel(s: LevelStation) {
    return (source === "all" || s.source === source) && (area === "all" || s.area === area);
  }

  const title = t(TABS.find((x) => x.key === active)!.label);

  return (
    <div className="content-page">
      <div className="page-head">
        <h2>
          {t("nav.monitor")} / {title} <DemoBadge title />
        </h2>
        <StepControl />
      </div>

      <div className="subtabs">
        {TABS.map((x) => (
          <button
            key={x.key}
            className={x.key === active ? "active" : ""}
            onClick={() => nav(`/monitor/${x.key}`)}
          >
            {t(x.label)}
          </button>
        ))}
      </div>

      {(active === "rainfall-actual" || active === "rainfall-forecast") && (
        <RainTable
          rows={mon.rain.filter(matchRain)}
          step={step}
          forecast={active === "rainfall-forecast"}
          sim={data.simulation}
          toolbar={filters}
          onChart={setChart}
        />
      )}
      {active === "water-level" && (
        <LevelTable rows={mon.level.filter(matchLevel)} step={step} sim={data.simulation} toolbar={filters} onChart={setChart} />
      )}
      {active === "gates" && <GateTable rows={mon.gates} step={step} toolbar={filters} onChart={setChart} />}

      {chart && <ChartModal series={chart} onClose={() => setChart(null)} />}
    </div>
  );
}

// ------------------------------------------------------------- rainfall table

function RainTable({ rows, step, forecast, sim, toolbar, onChart }: {
  rows: RainStation[];
  step: number;
  forecast: boolean;
  sim: import("../types").Simulation;
  toolbar: React.ReactNode;
  onChart: (c: ChartSeries) => void;
}) {
  const t = useT();
  const columns = useMemo<Column<RainStation>[]>(() => {
    const base: Column<RainStation>[] = [
      { key: "id", label: t("col.stationId"), sortValue: (r) => r.id },
      { key: "name", label: t("col.stationName"), sortValue: (r) => r.name },
      { key: "source", label: t("col.source"), sortValue: (r) => r.source },
      { key: "area", label: t("col.area"), render: (r) => t(`area.${r.area}`) },
    ];
    const wins: Column<RainStation>[] = WINDOWS.map((w, wi) => ({
      key: w.key,
      label: w.label,
      align: "right",
      render: (r) => (forecast ? forwardRain(r.series, step) : trailingRain(r.series, step))[wi].toFixed(1),
    }));
    const tail: Column<RainStation>[] = [
      { key: "last", label: t("col.lastRecord"), align: "right", render: () => stepClock(sim, step) },
      {
        key: "chart",
        label: "",
        align: "center",
        render: (r) => (
          <button className="chart-btn" onClick={(e) => {
            e.stopPropagation();
            onChart({ title: `${r.id} — ${r.name}`, kind: "bar", unit: "mm/h", values: r.series });
          }}><Icon name="chart" size={15} /></button>
        ),
      },
    ];
    return [...base, ...wins, ...tail];
  }, [t, step, forecast, sim, onChart]);

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getKey={(r) => r.id}
      searchText={(r) => `${r.id} ${r.name}`}
      toolbar={toolbar}
    />
  );
}

// ------------------------------------------------------------- water-level table

function LevelTable({ rows, step, sim, toolbar, onChart }: {
  rows: LevelStation[];
  step: number;
  sim: import("../types").Simulation;
  toolbar: React.ReactNode;
  onChart: (c: ChartSeries) => void;
}) {
  const t = useT();
  const columns = useMemo<Column<LevelStation>[]>(() => [
    { key: "id", label: t("col.stationId"), sortValue: (r) => r.id },
    { key: "name", label: t("col.stationName"), sortValue: (r) => r.name },
    { key: "source", label: t("col.source"), sortValue: (r) => r.source },
    { key: "area", label: t("col.area"), render: (r) => t(`area.${r.area}`) },
    { key: "current", label: t("col.current"), align: "right", sortValue: (r) => r.levels[step] ?? 0, render: (r) => (r.levels[step] ?? 0).toFixed(2) },
    { key: "fmax", label: t("col.forecastMax"), align: "right", render: (r) => Math.max(...r.levels.slice(step)).toFixed(2) },
    { key: "peak", label: t("col.peakTime"), align: "right", render: (r) => {
        let mi = step; for (let i = step; i < r.levels.length; i++) if (r.levels[i] > r.levels[mi]) mi = i;
        const m = mi * sim.stepMinutes; return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      } },
    { key: "a1", label: t("col.alert1"), align: "right", render: (r) => r.alert1.toFixed(2) },
    { key: "a2", label: t("col.alert2"), align: "right", render: (r) => r.alert2.toFixed(2) },
    { key: "a3", label: t("col.alert3"), align: "right", render: (r) => r.alert3.toFixed(2) },
    { key: "last", label: t("col.lastRecord"), align: "right", render: () => stepClock(sim, step) },
    { key: "chart", label: "", align: "center", render: (r) => (
        <button className="chart-btn" onClick={(e) => { e.stopPropagation(); onChart({
          title: `${r.id} — ${r.name}`, kind: "line", unit: "m", values: r.levels,
          refLines: [
            { y: r.alert1, label: "A1", color: "#facc15" },
            { y: r.alert2, label: "A2", color: "#f59e0b" },
            { y: r.alert3, label: "A3", color: "#dc2626" },
          ],
        }); }}><Icon name="chart" size={15} /></button>
      ) },
  ], [t, step, sim, onChart]);

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getKey={(r) => r.id}
      searchText={(r) => `${r.id} ${r.name}`}
      toolbar={toolbar}
      rowClass={(r) => `band-${bandOf(r, step)}`}
    />
  );
}

// ------------------------------------------------------------- gate table

function GateTable({ rows, step, toolbar, onChart }: {
  rows: Gate[];
  step: number;
  toolbar: React.ReactNode;
  onChart: (c: ChartSeries) => void;
}) {
  const t = useT();
  const columns = useMemo<Column<Gate>[]>(() => [
    { key: "id", label: t("col.code"), sortValue: (r) => r.id },
    { key: "name", label: t("col.name"), sortValue: (r) => r.name },
    { key: "type", label: t("col.type"), render: (r) => (r.type === "gate" ? t("dash.gate") : t("dash.pump")) },
    { key: "status", label: t("col.gateStatus"), align: "center", render: (r) => {
        const open = r.status[step] === "OPEN";
        return <span className={`status-pill ${open ? "open" : "closed"}`}>{open ? t("gate.open") : t("gate.closed")}</span>;
      } },
    { key: "city", label: t("col.cityLevel"), align: "right", render: (r) => r.cityLevel[step].toFixed(2) },
    { key: "river", label: t("col.riverLevel"), align: "right", render: (r) => r.riverLevel[step].toFixed(2) },
    { key: "chart", label: "", align: "center", render: (r) => (
        <button className="chart-btn" onClick={(e) => { e.stopPropagation(); onChart({
          title: `${r.id} — ${r.name}`, kind: "line", unit: "m", values: r.riverLevel,
        }); }}><Icon name="chart" size={15} /></button>
      ) },
  ], [t, step, onChart]);

  return (
    <DataTable columns={columns} rows={rows} getKey={(r) => r.id} searchText={(r) => `${r.id} ${r.name}`} toolbar={toolbar} />
  );
}
