import type { Simulation } from "../types";

export interface RainWindow {
  key: string;
  minutes: number;
  label: string;
}

// FRMIS trailing/forward rainfall windows.
export const WINDOWS: RainWindow[] = [
  { key: "15m", minutes: 15, label: "15'" },
  { key: "60m", minutes: 60, label: "60'" },
  { key: "90m", minutes: 90, label: "90'" },
  { key: "2h", minutes: 120, label: "2h" },
  { key: "3h", minutes: 180, label: "3h" },
  { key: "6h", minutes: 360, label: "6h" },
  { key: "12h", minutes: 720, label: "12h" },
  { key: "24h", minutes: 1440, label: "24h" },
];

const STEP_MIN = 15;

/** mm accumulated over each trailing window ending at `step` (inclusive). */
export function trailingRain(series: number[], step: number): number[] {
  return WINDOWS.map((w) => {
    const n = Math.round(w.minutes / STEP_MIN);
    let mm = 0;
    for (let i = Math.max(0, step - n + 1); i <= step; i++) {
      mm += (series[i] ?? 0) * (STEP_MIN / 60); // intensity (mm/h) -> mm over the step
    }
    return Math.round(mm * 10) / 10;
  });
}

/** mm forecast to accumulate over each forward window starting after `step`. */
export function forwardRain(series: number[], step: number): number[] {
  return WINDOWS.map((w) => {
    const n = Math.round(w.minutes / STEP_MIN);
    let mm = 0;
    for (let i = step + 1; i <= step + n && i < series.length; i++) {
      mm += (series[i] ?? 0) * (STEP_MIN / 60);
    }
    return Math.round(mm * 10) / 10;
  });
}

/** Clock label for the "last recorded" column (reuses sim start = 00:00). */
export function stepClock(sim: Simulation, step: number): string {
  const minutes = step * sim.stepMinutes;
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
