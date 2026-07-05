import type { AppData } from "../types";
import type { Gate, LevelStation, Area } from "./stations";

export type Band = "below1" | "1to2" | "2to3" | "above3";
export const BANDS: Band[] = ["below1", "1to2", "2to3", "above3"];
export const BAND_COLORS: Record<Band, string> = {
  below1: "#22c55e",
  "1to2": "#facc15",
  "2to3": "#f59e0b",
  above3: "#dc2626",
};

export function bandOf(s: LevelStation, step: number): Band {
  const lv = s.levels[step] ?? s.invert;
  if (lv >= s.alert3) return "above3";
  if (lv >= s.alert2) return "2to3";
  if (lv >= s.alert1) return "1to2";
  return "below1";
}

/** Counts per alert band, optionally filtered to an area. */
export function levelBands(
  stations: LevelStation[],
  step: number,
  area?: Area,
): Record<Band, number> {
  const out: Record<Band, number> = { below1: 0, "1to2": 0, "2to3": 0, above3: 0 };
  for (const s of stations) {
    if (area && s.area !== area) continue;
    out[bandOf(s, step)]++;
  }
  return out;
}

export interface GatePumpStatus {
  gateActive: number;
  gateInactive: number;
  pumpActive: number;
  pumpInactive: number;
}

export function gatePumpStatus(gates: Gate[], step: number): GatePumpStatus {
  const out: GatePumpStatus = { gateActive: 0, gateInactive: 0, pumpActive: 0, pumpInactive: 0 };
  for (const g of gates) {
    const active = g.status[step] === "OPEN";
    if (g.type === "gate") active ? out.gateActive++ : out.gateInactive++;
    else active ? out.pumpActive++ : out.pumpInactive++;
  }
  return out;
}

// -------- flooded area from flood-zone polygons weighted by severity --------

function ringAreaM2(ring: number[][]): number {
  if (ring.length < 3) return 0;
  const latAvg = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const mPerLat = 110574;
  const mPerLng = 111320 * Math.cos((latAvg * Math.PI) / 180);
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0] * mPerLng, yi = ring[i][1] * mPerLat;
    const xj = ring[j][0] * mPerLng, yj = ring[j][1] * mPerLat;
    a += xj * yi - xi * yj;
  }
  return Math.abs(a) / 2;
}

export interface FloodSummary {
  areaKm2: number;
  affectedZones: number;
  surcharged: number;
}

export function floodSummary(data: AppData, step: number): FloodSummary {
  let areaM2 = 0;
  let affected = 0;
  for (const f of data.floodZones.features) {
    const p = f.properties as { severity: number[] };
    const sev = p.severity[step] ?? 0;
    if (sev <= 0) continue;
    affected++;
    const g = f.geometry;
    if (g.type === "Polygon") areaM2 += ringAreaM2(g.coordinates[0]) * sev;
  }
  let surcharged = 0;
  for (const series of Object.values(data.simulation.nodeFill)) {
    if ((series[step] ?? 0) > 1) surcharged++;
  }
  return {
    areaKm2: Math.round((areaM2 / 1e6) * 100) / 100,
    affectedZones: affected,
    surcharged,
  };
}
