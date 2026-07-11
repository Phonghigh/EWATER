export type Status = "ok" | "warn" | "bad";

export interface Thresholds {
  warn: number;
  surcharge: number;
}

export function computeStatus(fill: number, thresholds: Thresholds): Status {
  return fill >= thresholds.surcharge ? "bad" : fill >= thresholds.warn ? "warn" : "ok";
}

/** Minutes until the series first crosses the surcharge threshold after `step`, or null if it never does. */
export function computeForecastMinutes(
  series: number[],
  step: number,
  thresholds: Thresholds,
  stepMinutes: number,
): number | null {
  for (let i = step + 1; i < series.length; i++) {
    if (series[i] >= thresholds.surcharge) return (i - step) * stepMinutes;
  }
  return null;
}
