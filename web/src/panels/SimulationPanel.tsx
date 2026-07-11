import { useEffect, useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import type { AppData } from "../types";
import { useStore } from "../state/store";
import { useT } from "../i18n/I18nContext";
import { stepLabel, surchargedCount } from "../sim/simEngine";

export default function SimulationPanel({ data }: { data: AppData }) {
  const t = useT();
  const simMode = useStore((s) => s.simMode);
  const setSimMode = useStore((s) => s.setSimMode);
  const simStep = useStore((s) => s.simStep);
  const setSimStep = useStore((s) => s.setSimStep);
  const playing = useStore((s) => s.playing);
  const setPlaying = useStore((s) => s.setPlaying);
  const speed = useStore((s) => s.speed);
  const setSpeed = useStore((s) => s.setSpeed);

  const sim = data.simulation;

  // play loop
  useEffect(() => {
    if (!playing || !simMode) return;
    const id = window.setInterval(() => {
      const s = useStore.getState();
      const next = s.simStep + 1;
      if (next >= sim.steps) {
        s.setPlaying(false);
      } else {
        s.setSimStep(next);
      }
    }, 1000 / speed);
    return () => window.clearInterval(id);
  }, [playing, speed, simMode, sim.steps]);

  const rainData = useMemo(
    () => sim.rainfall.map((mm, i) => ({ i, t: stepLabel(sim, i), mm })),
    [sim],
  );

  if (!simMode) {
    return (
      <div className="sim-bar collapsed">
        <button className="sim-toggle" onClick={() => setSimMode(true)}>
          {t("sim.toggle")}
        </button>
      </div>
    );
  }

  const surcharged = surchargedCount(sim, simStep);

  return (
    <div className="sim-bar">
      <div className="sim-controls">
        <button className="sim-toggle active" onClick={() => setSimMode(false)}>{t("sim.exit")}</button>
        <button onClick={() => setPlaying(!playing)}>{playing ? "⏸" : "▶"}</button>
        <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
          <option value={2}>1×</option>
          <option value={4}>2×</option>
          <option value={12}>6×</option>
        </select>
        <input
          type="range"
          min={0}
          max={sim.steps - 1}
          value={simStep}
          onChange={(e) => setSimStep(Number(e.target.value))}
        />
        <span className="sim-clock">{stepLabel(sim, simStep)}</span>
        <span className="sim-stat">
          {t("sim.rain")} <b>{sim.rainfall[simStep]?.toFixed(1)} mm/h</b> · {t("sim.surcharged")} <b>{surcharged}</b>
        </span>
        <span className="demo-badge">{t("app.demoBadge")}</span>
      </div>
      <div className="sim-chart">
        <ResponsiveContainer width="100%" height={64}>
          <BarChart data={rainData} margin={{ top: 2, right: 8, bottom: 0, left: -24 }} barCategoryGap={0}>
            <XAxis dataKey="t" tick={{ fontSize: 9 }} interval={23} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip formatter={(v) => [`${v} mm/h`, t("sim.rain")]} />
            <Bar dataKey="mm" onClick={(d) => d && setSimStep((d as { i: number }).i)}>
              {rainData.map((d) => (
                <Cell key={d.i} fill={d.i === simStep ? "#1d4ed8" : "#93c5fd"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
