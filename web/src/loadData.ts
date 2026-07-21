import type { Feature, FeatureCollection } from "geojson";
import { supabase } from "./lib/supabaseClient";
import type { AppData, MapStyleConfig, Topology } from "./types";

async function loadConfig(): Promise<MapStyleConfig> {
  const { data, error } = await supabase.from("app_config").select("value").eq("key", "map-style").single();
  if (error) throw new Error(`Failed to load app_config map-style: ${error.message}`);
  return data.value as MapStyleConfig;
}

/** Rows from a `*_geojson` view always carry a `geom` GeoJSON column alongside plain properties. */
function toFeatureCollection(rows: Record<string, unknown>[]): FeatureCollection {
  const features: Feature[] = rows.map(({ geom, ...properties }) => ({
    type: "Feature",
    properties,
    geometry: geom as Feature["geometry"],
  }));
  return { type: "FeatureCollection", features };
}

/**
 * `topology.json` never became its own table - it's fully derivable from
 * `network_links.from_node_muid`/`to_node_muid` (see migration
 * 20260720111710_network_gis_schema.sql's comment), so it's computed here
 * client-side instead of fetched.
 */
function buildTopology(links: FeatureCollection): Topology {
  const downstream: Topology["downstream"] = {};
  const upstream: Topology["upstream"] = {};
  const linkNodes: Topology["linkNodes"] = {};
  for (const f of links.features) {
    const muid = String(f.properties?.muid);
    const from = String(f.properties?.fromNode);
    const to = String(f.properties?.toNode);
    linkNodes[muid] = [from, to];
    (downstream[from] ??= []).push({ link: muid, node: to });
    (upstream[to] ??= []).push({ link: muid, node: from });
  }
  return { downstream, upstream, linkNodes };
}

async function fetchGeojson(view: string, filter?: Record<string, string>): Promise<FeatureCollection> {
  let query = supabase.from(view).select("*");
  for (const [col, val] of Object.entries(filter ?? {})) query = query.eq(col, val);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to load ${view}: ${error.message}`);
  return toFeatureCollection(data ?? []);
}

async function loadSimulation(): Promise<AppData["simulation"]> {
  const { data: run, error: runError } = await supabase
    .from("simulation_runs").select("*").order("id", { ascending: false }).limit(1).single();
  if (runError) throw new Error(`Failed to load simulation_runs: ${runError.message}`);

  const { data: fillRows, error: fillError } = await supabase
    .from("simulation_node_fill").select("node_muid, fill_series").eq("run_id", run.id);
  if (fillError) throw new Error(`Failed to load simulation_node_fill: ${fillError.message}`);

  const nodeFill: Record<string, number[]> = {};
  for (const row of fillRows ?? []) nodeFill[row.node_muid] = row.fill_series as number[];

  return {
    stepMinutes: run.step_minutes,
    steps: run.steps,
    start: run.start_time,
    rainfall: run.rainfall as number[],
    nodeFill,
  };
}

async function loadRainForecast(): Promise<AppData["rainForecast"]> {
  const { data: forecast, error: forecastError } = await supabase
    .from("rain_forecasts").select("*").order("id", { ascending: false }).limit(1).single();
  if (forecastError) throw new Error(`Failed to load rain_forecasts: ${forecastError.message}`);

  const { data: points, error: pointsError } = await supabase
    .from("rain_forecast_points").select("ts, precipitation_mm")
    .eq("forecast_id", forecast.id).order("ts", { ascending: true });
  if (pointsError) throw new Error(`Failed to load rain_forecast_points: ${pointsError.message}`);

  return {
    source: forecast.source,
    latitude: forecast.latitude,
    longitude: forecast.longitude,
    generatedAt: forecast.generated_at,
    stepHours: forecast.step_hours,
    time: (points ?? []).map((p) => p.ts),
    precipitation: (points ?? []).map((p) => p.precipitation_mm),
  };
}

async function loadTide(): Promise<AppData["tide"]> {
  const { data: scenario, error: scenarioError } = await supabase
    .from("tide_scenarios").select("*").order("id", { ascending: false }).limit(1).single();
  if (scenarioError) throw new Error(`Failed to load tide_scenarios: ${scenarioError.message}`);

  const { data: levels, error: levelsError } = await supabase
    .from("tide_levels").select("ts, level_m")
    .eq("scenario_id", scenario.id).order("ts", { ascending: true });
  if (levelsError) throw new Error(`Failed to load tide_levels: ${levelsError.message}`);

  return {
    note: scenario.note,
    periodHours: scenario.period_hours,
    baselineM: scenario.baseline_m,
    amplitudeM: scenario.amplitude_m,
    seed: scenario.seed,
    generatedAt: scenario.generated_at,
    time: (levels ?? []).map((l) => l.ts),
    levelM: (levels ?? []).map((l) => l.level_m),
  };
}

export async function loadAppData(): Promise<AppData> {
  const [
    config, manholes, outlets, links, catchment, boundary, provinceBoundary,
    rivers, floodZones, simulation, rainForecast, tide,
  ] = await Promise.all([
    loadConfig(),
    fetchGeojson("network_nodes_geojson", { node_type: "manhole" }),
    fetchGeojson("network_nodes_geojson", { node_type: "outlet" }),
    fetchGeojson("network_links_geojson"),
    fetchGeojson("catchments_geojson"),
    fetchGeojson("drainage_boundary_geojson"),
    fetchGeojson("province_boundaries_geojson"),
    fetchGeojson("rivers_geojson"),
    fetchGeojson("flood_zones_geojson"),
    loadSimulation(),
    loadRainForecast(),
    loadTide(),
  ]);

  return {
    config, manholes, links, outlets, catchment, boundary, provinceBoundary, rivers, floodZones,
    topology: buildTopology(links),
    simulation, rainForecast, tide,
  };
}
