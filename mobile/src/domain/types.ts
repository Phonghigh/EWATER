import type { FeatureCollection } from "geojson";
import type { Status } from "./status";

export interface MapStyleConfig {
  center: [number, number];
  zoom: number;
  bounds: [[number, number], [number, number]];
  basemaps: Record<string, { name: string; tiles: string; attribution: string }>;
  colors: Record<string, string>;
  pipeDiameterBreaks: [number, number];
  simThresholds: { warn: number; surcharge: number };
}

export interface Simulation {
  stepMinutes: number;
  steps: number;
  start: string;
  rainfall: number[];
  nodeFill: Record<string, number[]>;
}

export interface MobileData {
  config: MapStyleConfig;
  manholes: FeatureCollection;
  boundary: FeatureCollection;
  provinceBoundary: FeatureCollection;
  rivers: FeatureCollection;
  floodZones: FeatureCollection;
  simulation: Simulation;
}

export type LocationPoint = [number, number];

export interface AreaStatus {
  status: Status;
  forecastMinutes: number | null;
  riskPercent: number;
  recommendation: string;
}
