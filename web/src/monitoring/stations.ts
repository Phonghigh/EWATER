import type { AppData } from "../types";
import { seededFrom, hashStr } from "./rng";

// --------------------------------------------------------------- types

export type Area = "urban" | "city";
export type Source = "SCADA" | "SRHMC";

export interface RainStation {
  id: string;
  name: string;
  source: Source;
  area: Area;
  lng: number;
  lat: number;
  series: number[]; // per-step rainfall intensity (mm/h), length = sim.steps
}

export interface LevelStation {
  id: string;
  name: string;
  source: Source;
  area: Area;
  manholeId: string;
  lng: number;
  lat: number;
  invert: number;
  ground: number;
  alert1: number;
  alert2: number;
  alert3: number;
  levels: number[]; // per-step water level (m)
}

export type GateType = "gate" | "pump";

export interface Gate {
  id: string;
  name: string;
  type: GateType;
  lng: number;
  lat: number;
  status: ("OPEN" | "CLOSED")[]; // per-step
  cityLevel: number[];
  riverLevel: number[];
  gateLevel: number[];
}

// ----------------------------------------------------------- name pool

const NAMES = [
  "Cầu Lộ", "Cái Cá", "Kênh Cụt", "Cầu Đôi", "Rạch Long Hồ", "Phường 1", "Phường 2",
  "Phường 4", "Phường 5", "Phường 8", "Cầu Thiềng Đức", "Rạch Ông Me", "Mậu Thân",
  "Trưng Nữ Vương", "Nguyễn Huệ", "Hưng Đạo Vương", "Phạm Thái Bường", "Cầu Kè",
  "Long Châu", "Tân Ngãi", "Trường An", "Tân Hòa", "Cái Sơn", "Bà Bộ", "Cầu Vồng",
  "Rạch Bần", "Chợ Vĩnh Long", "Bến Xe", "Cầu Khoa", "Rạch Cái Đôi", "Long Thắng",
  "Cống Ranh", "Mỹ Thuận", "Ba Càng", "An Bình", "Đình Khao",
];

function pickName(i: number): string {
  return NAMES[i % NAMES.length];
}

function sourceFor(id: string): Source {
  return hashStr(id) % 2 === 0 ? "SCADA" : "SRHMC";
}

/** Urban core = within ~1.6 km of the configured map centre; else city-wide. */
function areaFor(lng: number, lat: number, center: [number, number]): Area {
  const dx = lng - center[0];
  const dy = lat - center[1];
  return Math.sqrt(dx * dx + dy * dy) < 0.018 ? "urban" : "city";
}

/** Evenly spaced sample of indices [0..n) of size `count`. */
function sampleIndices(n: number, count: number): number[] {
  if (count >= n) return Array.from({ length: n }, (_, i) => i);
  const out: number[] = [];
  const stride = n / count;
  for (let i = 0; i < count; i++) out.push(Math.floor(i * stride));
  return out;
}

function coordsOf(f: GeoJSON.Feature): [number, number] {
  const g = f.geometry;
  if (g.type === "Point") return g.coordinates as [number, number];
  if (g.type === "LineString") return g.coordinates[0] as [number, number];
  return [0, 0];
}

// ------------------------------------------------------------- builders

const N_RAIN = 17;
const N_LEVEL = 22;
const N_GATES = 12;
const N_PUMPS = 2;

export function buildRainStations(data: AppData): RainStation[] {
  const center = data.config.center;
  const base = data.simulation.rainfall;
  const feats = data.manholes.features;
  const idx = sampleIndices(feats.length, N_RAIN);
  return idx.map((fi, i) => {
    const id = `VL-ENV${String(i + 1).padStart(2, "0")}-RF`;
    const [lng, lat] = coordsOf(feats[fi]);
    const rng = seededFrom(id);
    const factor = 0.55 + rng() * 0.9; // 0.55 - 1.45
    const lag = Math.floor(rng() * 4); // 0 - 3 steps
    const series = base.map((_, t) => {
      const v = (base[t - lag] ?? 0) * factor;
      return Math.round(v * 10) / 10;
    });
    return { id, name: pickName(i), source: sourceFor(id), area: areaFor(lng, lat, center), lng, lat, series };
  });
}

export function buildLevelStations(data: AppData): LevelStation[] {
  const center = data.config.center;
  const feats = data.manholes.features;
  const idx = sampleIndices(feats.length, N_LEVEL);
  const out: LevelStation[] = [];
  let n = 0;
  for (const fi of idx) {
    const f = feats[fi];
    const p = f.properties as { muid: string; invertLevel: number; groundLevel: number };
    const fill = data.simulation.nodeFill[p.muid];
    if (!fill) continue;
    n++;
    const id = `VL-ENV${String(n).padStart(2, "0")}-H`;
    const [lng, lat] = coordsOf(f);
    const invert = p.invertLevel;
    const ground = p.groundLevel;
    const levels = fill.map((fr) => Math.round((invert + fr * (ground - invert)) * 100) / 100);
    out.push({
      id,
      name: pickName(n + 6),
      source: sourceFor(id),
      area: areaFor(lng, lat, center),
      manholeId: p.muid,
      lng,
      lat,
      invert,
      ground,
      alert1: Math.round((ground - 0.6) * 100) / 100,
      alert2: Math.round((ground - 0.3) * 100) / 100,
      alert3: ground,
      levels,
    });
  }
  return out;
}

export function buildGates(data: AppData): Gate[] {
  const feats = data.outlets.features;
  const steps = data.simulation.steps;
  const rain = data.simulation.rainfall;
  const rainMax = Math.max(...rain, 1);
  const idx = sampleIndices(feats.length, N_GATES + N_PUMPS);
  return idx.map((fi, i) => {
    const type: GateType = i < N_GATES ? "gate" : "pump";
    const seq = type === "gate" ? i + 1 : i - N_GATES + 1;
    const id =
      type === "gate"
        ? `VL-WCS-GL${String(seq).padStart(2, "0")}`
        : `VL-PS-${String(seq).padStart(2, "0")}`;
    const name = type === "gate" ? `WCS ${pickName(i)}` : `Trạm bơm ${pickName(i)}`;
    const [lng, lat] = coordsOf(feats[fi]);
    const rng = seededFrom(id);
    const phase = rng() * 0.4; // per-gate river-level offset
    const status: ("OPEN" | "CLOSED")[] = [];
    const cityLevel: number[] = [];
    const riverLevel: number[] = [];
    const gateLevel: number[] = [];
    for (let t = 0; t < steps; t++) {
      const load = rain[t] / rainMax; // 0..1 storm envelope
      const river = Math.round((1.1 + load * 1.3 + phase) * 100) / 100;
      const city = Math.round((0.8 + load * 1.1) * 100) / 100;
      // Gates close when the river rises above the city side (tidal backflow prevention).
      // Pumps activate under load; treat "active" as OPEN.
      const closed = type === "gate" ? river > city + 0.15 : load < 0.25;
      status.push(closed ? "CLOSED" : "OPEN");
      riverLevel.push(river);
      cityLevel.push(city);
      gateLevel.push(Math.round((Math.min(city, river) - 0.2) * 100) / 100);
    }
    return { id, name, type, lng, lat, status, cityLevel, riverLevel, gateLevel };
  });
}

export interface Monitoring {
  rain: RainStation[];
  level: LevelStation[];
  gates: Gate[];
}

export function buildMonitoring(data: AppData): Monitoring {
  return {
    rain: buildRainStations(data),
    level: buildLevelStations(data),
    gates: buildGates(data),
  };
}
