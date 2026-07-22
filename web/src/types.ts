import type { FeatureCollection } from "geojson";

export interface MapStyleConfig {
  center: [number, number]; //[lng, lat]
  zoom: number; // percentage (0-100)
  bounds: [[number, number], [number, number]]; // [[lng, lat], [lng, lat]] -> limmit area of map view
  basemaps: Record< // list of basemaps, key = name, value = {name, tiles, attribution} example: OpenStreetMap
    string,
    { 
      name: string;
      tiles: string; 
      attribution: string 
    }
  >;
  colors: Record<string, string>;  // color palette, key = name, value = hex color code
  pipeDiameterBreaks: number[]; // sorted breakpoints (m), N breakpoints -> N+1 style buckets; admin-configurable
  simThresholds: { warn: number; surcharge: number }; // thresholds for simulation fill ratio, warn = 0.8, surcharge = 1.0
}

//explain in docs/explain/topology.md
export interface Topology {
  downstream: Record<string, { link: string; node: string }[]>;
  upstream: Record<string, { link: string; node: string }[]>;
  linkNodes: Record<string, [string, string]>;
}

export interface Simulation {
  stepMinutes: number; // minutes per step
  steps: number; // total number of steps in the simulation
  start: string; // ISO 8601 timestamp of the simulation start time
  rainfall: number[]; // rainfall (mm) per step, length = steps
  nodeFill: Record<string, number[]>; // fill ratio (0-1) per step for each node, key = node_muid, value = array of length = steps
}

export interface RainForecast {
  source: string; // source of the forecast data, e.g Open-Meteo
  latitude: number; // latitude of the forecast location
  longitude: number; // longitude of the forecast location
  generatedAt: string; // ISO 8601 timestamp of when the forecast was generated
  stepHours: number; // hours per step
  time: string[]; // timestamps for each step
  precipitation: number[]; // predicted precipitation (mm) for each step
}

export interface TideForecast {
  periodHours: number; // hours per step
  baselineM: number; // baseline water level (m)
  amplitudeM: number; // amplitude of the tide (m)
  seed: number; // random seed used for tide simulation
  generatedAt: string; // ISO 8601 timestamp of when the tide forecast was generated
  time: string[]; // timestamps for each step
  levelM: number[]; // predicted water level (m) for each step
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
  tide: TideForecast;
}
