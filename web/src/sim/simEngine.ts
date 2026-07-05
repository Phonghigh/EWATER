import type { Simulation } from "../types";

/** "HH:MM" label for a timestep. */
export function stepLabel(sim: Simulation, step: number): string {
  const minutes = step * sim.stepMinutes;
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Count of surcharged manholes (fill > 1) at a timestep. */
export function surchargedCount(sim: Simulation, step: number): number {
  let n = 0;
  for (const series of Object.values(sim.nodeFill)) {
    if ((series[step] ?? 0) > 1) n++;
  }
  return n;
}
