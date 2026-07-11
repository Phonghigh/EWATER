import type { FeatureCollection } from "geojson";

export interface MapStyleConfig {
  center: [number, number];
  zoom: number;
  bounds: [[number, number], [number, number]];
  basemaps: Record<string, { name: string; tiles: string; attribution: string }>;
  colors: Record<string, string>;
  pipeDiameterBreaks: [number, number];
  simThresholds: { warn: number; surcharge: number };
}

export interface Topology {
  downstream: Record<string, { link: string; node: string }[]>;
  upstream: Record<string, { link: string; node: string }[]>;
  linkNodes: Record<string, [string, string]>;
}

export interface Simulation {
  stepMinutes: number;
  steps: number;
  start: string;
  rainfall: number[];
  nodeFill: Record<string, number[]>;
}

export interface RainForecast {
  source: string;
  latitude: number;
  longitude: number;
  generatedAt: string;
  stepHours: number;
  time: string[];
  precipitation: number[];
}

export interface TideDemo {
  note: string;
  periodHours: number;
  baselineM: number;
  amplitudeM: number;
  seed: number;
  generatedAt: string;
  time: string[];
  levelM: number[];
}

export interface AppData {
  config: MapStyleConfig;
  manholes: FeatureCollection;
  links: FeatureCollection;
  outlets: FeatureCollection;
  catchment: FeatureCollection;
  boundary: FeatureCollection;
  provinceBoundary: FeatureCollection;
  rivers: FeatureCollection;
  floodZones: FeatureCollection;
  topology: Topology;
  simulation: Simulation;
  rainForecast: RainForecast;
  tide: TideDemo;
}

export type LayerKey =
  | "manholes"
  | "links"
  | "outlets"
  | "rivers"
  | "boundary"
  | "province"
  | "catchment"
  | "flood";

export interface Selection {
  kind: "manhole" | "link" | "outlet" | "river";
  muid: string;
  properties: Record<string, unknown>;
}

export interface TraceResult {
  direction: "upstream" | "downstream";
  nodes: string[];
  links: string[];
  totalLength: number;
}
