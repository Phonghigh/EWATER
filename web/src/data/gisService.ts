import type { AppData } from "../types";
import { polygonAreaM2, polygonCentroid } from "../lib/geo";

const SURCHARGE = 1.0; // keep in sync with dashboardService.ts's SURCHARGE

export interface FloodStats {
  areaM2: number;
  avgDepthM: number;
  maxDepthM: number;
}

/** A `flood_zones` polygon whose per-step `severity` (0..1, precomputed by
 *  `data-pipeline/generate_mock_sim.py`) is > 0 at the given step — i.e.
 *  actually contributing to flooding right now, not just historically
 *  flood-prone. Shared by `floodStatsAtStep` (area sum) and
 *  `activeFloodZoneCentroids` (marker placement) so both read the exact
 *  same "is this zone active" rule instead of two copies that could drift. */
function activeFloodZonesAtStep(data: AppData, step: number): [number, number][][] {
  const zones: [number, number][][] = [];
  for (const f of data.floodZones.features) {
    const severitySeries = f.properties?.severity as number[] | undefined;
    const severity = severitySeries?.[step] ?? 0;
    if (severity <= 0) continue;
    if (f.geometry.type === "Polygon") {
      zones.push(f.geometry.coordinates[0] as [number, number][]);
    }
  }
  return zones;
}

/**
 * "Thống kê ngập hiện tại" for the GIS map's right panel (P2-04) - every
 * number here is derived from real Supabase data, no fabricated figures:
 * - `areaM2`: sum of active `flood_zones` polygon areas at the current step.
 * - `avgDepthM`/`maxDepthM`: same "surcharge ratio as flood depth above
 *   ground" interpretation `dashboardService.ts`'s `maxWaterLevel` already
 *   uses (`(fill - 1) * (groundLevel - invertLevel)`), averaged/maxed over
 *   every manhole currently at/above the surcharge threshold - not a
 *   second, differently-invented depth metric.
 */
export function floodStatsAtStep(data: AppData, step: number): FloodStats {
  const areaM2 = activeFloodZonesAtStep(data, step).reduce((sum, outer) => sum + polygonAreaM2(outer), 0);

  let sumDepth = 0;
  let count = 0;
  let maxDepth = 0;
  for (const f of data.manholes.features) {
    const muid = String(f.properties?.muid);
    const fill = data.simulation.nodeFill[muid]?.[step] ?? 0;
    if (fill < SURCHARGE) continue;
    const invert = Number(f.properties?.invertLevel ?? 0);
    const ground = Number(f.properties?.groundLevel ?? 0);
    const depth = (fill - SURCHARGE) * (ground - invert);
    sumDepth += depth;
    count += 1;
    if (depth > maxDepth) maxDepth = depth;
  }
  return { areaM2, avgDepthM: count > 0 ? sumDepth / count : 0, maxDepthM: maxDepth };
}

/** Centroid of every `flood_zones` polygon currently active at `step` — for
 *  placing a warning marker per flooded cluster on the GIS map (P2-03
 *  follow-up). Empty at dry steps, matches `floodStatsAtStep`'s notion of
 *  "active" exactly (shared helper above). */
export function activeFloodZoneCentroids(data: AppData, step: number): [number, number][] {
  return activeFloodZonesAtStep(data, step).map(polygonCentroid);
}

export interface WaterLevelNode {
  muid: string;
  levelM: number;
  lng: number;
  lat: number;
}

/** Top-N manholes by current water level (P2-03 follow-up's floating
 *  labels) — same `invert + fill*(ground-invert)` formula as
 *  `dashboardService.ts`'s `maxWaterLevel`, just kept for the N highest
 *  instead of only the single highest. No station names invented: the
 *  label is the real `muid`, since the source data has no per-node display
 *  name (same "REAL-DATA-01" gap noted since P1-01). */
export function topWaterLevelNodes(data: AppData, step: number, n = 5): WaterLevelNode[] {
  const nodes: WaterLevelNode[] = data.manholes.features.map((f) => {
    const muid = String(f.properties?.muid);
    const invert = Number(f.properties?.invertLevel ?? 0);
    const ground = Number(f.properties?.groundLevel ?? 0);
    const fill = data.simulation.nodeFill[muid]?.[step] ?? 0;
    const levelM = invert + fill * (ground - invert);
    const [lng, lat] = f.geometry.type === "Point" ? (f.geometry.coordinates as [number, number]) : [0, 0];
    return { muid, levelM, lng, lat };
  });
  return nodes.sort((a, b) => b.levelM - a.levelM).slice(0, n);
}
