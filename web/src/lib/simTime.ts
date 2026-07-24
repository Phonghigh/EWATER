import type { Simulation } from "../types";

/** Time-of-day label for a simulation step (start + step * stepMinutes).
 *  `start` is only "HH:MM" in the source data (no real calendar date), so
 *  this only ever returns a clock time, never a date. */
export function stepTimeLabel(start: string, stepMinutes: number, step: number): string {
  const totalMin = (start ? parseInt(start.split(":")[0], 10) * 60 + parseInt(start.split(":")[1], 10) : 0) + step * stepMinutes;
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Maps the real wall-clock time-of-day onto the simulation's fixed 24h
 *  cycle (`simulation.start` + `stepMinutes` × index) — the closest step
 *  whose clock label matches the current hour:minute. This is genuinely
 *  "now," not another placeholder: the simulation array has no calendar
 *  date, but it does span exactly one full day, so today's real
 *  hour:minute always lands on a real, already-simulated step. `now` is
 *  injectable (defaults to `new Date()`) so this stays testable and so
 *  `useCurrentSimStep` can re-derive it on each periodic check. */
export function currentSimStep(simulation: Simulation, now: Date = new Date()): number {
  const [startH, startM] = simulation.start.split(":").map((s) => parseInt(s, 10) || 0);
  const startMin = startH * 60 + startM;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const stepIndex = Math.round((((nowMin - startMin) % 1440 + 1440) % 1440) / simulation.stepMinutes);
  return Math.max(0, Math.min(simulation.steps - 1, stepIndex));
}
