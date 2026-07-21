import type { AppData } from "../types";

const SIX_AM_STEP = 24; // simulation.start = "00:00", stepMinutes = 15 -> 06:00 = step 24
const TRAILING_24H_STEPS = 96; // 24h / 15min
const GATE_CLOSE_RAIN_MM = 10;
const SURCHARGE = 1.0;

function manholeMuids(data: AppData): string[] {
  return data.manholes.features.map((f) => String(f.properties?.muid));
}

function fillAt(data: AppData, muid: string, step: number): number {
  return data.simulation.nodeFill[muid]?.[step] ?? 0;
}

export function floodPointCount(data: AppData, step: number): number {
  return manholeMuids(data).filter((muid) => fillAt(data, muid, step) >= SURCHARGE).length;
}

export function floodedRouteCount(data: AppData, step: number): number {
  return data.links.features.filter((f) => {
    const from = String(f.properties?.fromNode);
    const to = String(f.properties?.toNode);
    return fillAt(data, from, step) >= SURCHARGE || fillAt(data, to, step) >= SURCHARGE;
  }).length;
}

export function floodPointDelta(data: AppData, step: number): number {
  if (step < SIX_AM_STEP) return 0;
  return floodPointCount(data, step) - floodPointCount(data, SIX_AM_STEP);
}

export function floodedRouteDelta(data: AppData, step: number): number {
  if (step < SIX_AM_STEP) return 0;
  return floodedRouteCount(data, step) - floodedRouteCount(data, SIX_AM_STEP);
}

/** Trailing 24h accumulated rainfall (area-average — source has no per-station breakdown). */
export function maxRainfallMm(data: AppData, step: number): number {
  const from = Math.max(0, step - TRAILING_24H_STEPS + 1);
  return data.simulation.rainfall.slice(from, step + 1).reduce((sum, v) => sum + v, 0);
}

export interface NodeWaterLevel {
  muid: string;
  levelM: number;
}

/** Water level (m) at a manhole = invert + fill ratio * (ground - invert). */
export function maxWaterLevel(data: AppData, step: number): NodeWaterLevel {
  let best: NodeWaterLevel = { muid: "", levelM: -Infinity };
  for (const f of data.manholes.features) {
    const muid = String(f.properties?.muid);
    const invert = Number(f.properties?.invertLevel ?? 0);
    const ground = Number(f.properties?.groundLevel ?? 0);
    const levelM = invert + fillAt(data, muid, step) * (ground - invert);
    if (levelM > best.levelM) best = { muid, levelM };
  }
  return best;
}

export interface PumpsAndGates {
  activePumpCount: number;
  totalPumpCount: number;
  closedGateCount: number;
  totalGateCount: number;
}

/**
 * `outlets.geojson` has no asset-type field, so pumps vs. gates is a
 * deterministic placeholder split (odd numeric muid -> pump, even -> gate)
 * until a real asset registry exists (see tasks/INDEX.md P6-01). Active/closed
 * state is likewise a simplified function of current rainfall intensity, not
 * real telemetry.
 */
export function pumpsAndGates(data: AppData, step: number): PumpsAndGates {
  const rainNow = data.simulation.rainfall[step] ?? 0;
  let totalPumpCount = 0;
  let totalGateCount = 0;
  for (const f of data.outlets.features) {
    const n = parseInt(String(f.properties?.muid).replace(/\D/g, ""), 10) || 0;
    if (n % 2 === 1) totalPumpCount += 1;
    else totalGateCount += 1;
  }
  const activePumpCount = rainNow > 0 ? totalPumpCount : 0;
  const closedGateCount = rainNow > GATE_CLOSE_RAIN_MM ? totalGateCount : 0;
  return { activePumpCount, totalPumpCount, closedGateCount, totalGateCount };
}

/** Trailing window slice of the rainfall series ending at `step` (inclusive). */
export function rainSeries(data: AppData, step: number, windowSteps: number): number[] {
  const from = Math.max(0, step - windowSteps + 1);
  return data.simulation.rainfall.slice(from, step + 1);
}

/** Trailing window of a representative node's derived water level (the current max-level node). */
export function waterLevelSeries(data: AppData, step: number, windowSteps: number): number[] {
  const { muid } = maxWaterLevel(data, step);
  const f = data.manholes.features.find((feat) => String(feat.properties?.muid) === muid);
  const invert = Number(f?.properties?.invertLevel ?? 0);
  const ground = Number(f?.properties?.groundLevel ?? 0);
  const from = Math.max(0, step - windowSteps + 1);
  const out: number[] = [];
  for (let s = from; s <= step; s++) {
    out.push(invert + fillAt(data, muid, s) * (ground - invert));
  }
  return out;
}

export interface DashboardOverview {
  floodPointCount: number;
  floodPointDelta: number;
  floodedRouteCount: number;
  floodedRouteDelta: number;
  maxRainfallMm: number;
  maxWaterLevel: NodeWaterLevel;
  pumpsAndGates: PumpsAndGates;
}

export function getDashboardOverview(data: AppData, step: number): DashboardOverview {
  return {
    floodPointCount: floodPointCount(data, step),
    floodPointDelta: floodPointDelta(data, step),
    floodedRouteCount: floodedRouteCount(data, step),
    floodedRouteDelta: floodedRouteDelta(data, step),
    maxRainfallMm: maxRainfallMm(data, step),
    maxWaterLevel: maxWaterLevel(data, step),
    pumpsAndGates: pumpsAndGates(data, step),
  };
}
