import type { Status } from "./status";
import { strings } from "./i18n";

/** Fill ratio (~0-1, can exceed 1 when surcharged) as a whole-number risk index (0-100), not a true flood probability. */
export function computeRiskPercent(fill: number): number {
  return Math.round(Math.min(1, Math.max(0, fill)) * 100);
}

export function recommendationFor(status: Status): string {
  return strings.recommendation[status];
}
