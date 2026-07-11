import type { AppData } from "./types";

async function json<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to load ${url}: ${r.status}`);
  return r.json();
}

export async function loadAppData(): Promise<AppData> {
  const [
    config, manholes, links, outlets, catchment,
    boundary, provinceBoundary, rivers, floodZones, topology, simulation,
    rainForecast, tide,
  ] = await Promise.all([
    json<AppData["config"]>("/config/map-style.json"),
    json<AppData["manholes"]>("/data/manholes.geojson"),
    json<AppData["links"]>("/data/links.geojson"),
    json<AppData["outlets"]>("/data/outlets.geojson"),
    json<AppData["catchment"]>("/data/catchment.geojson"),
    json<AppData["boundary"]>("/data/boundary.geojson"),
    json<AppData["provinceBoundary"]>("/data/province-boundary.geojson"),
    json<AppData["rivers"]>("/data/rivers.geojson"),
    json<AppData["floodZones"]>("/data/flood-zones.geojson"),
    json<AppData["topology"]>("/data/topology.json"),
    json<AppData["simulation"]>("/data/simulation.json"),
    json<AppData["rainForecast"]>("/data/rain-forecast.json"),
    json<AppData["tide"]>("/data/tide-demo.json"),
  ]);
  return {
    config, manholes, links, outlets, catchment, boundary, provinceBoundary, rivers, floodZones,
    topology, simulation, rainForecast, tide,
  };
}
