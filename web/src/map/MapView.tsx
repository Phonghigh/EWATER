import { useEffect, useRef } from "react";
import maplibregl, { Map as MLMap, MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { AppData, LayerKey, Selection } from "../types";
import { useStore } from "../state/store";
import { mapRegistry } from "./mapRegistry";
import {
  addDataLayers, buildBaseStyle, CLICKABLE, LAYER_IDS,
  linkColorWithTrace, manholeColorNormal, manholeColorSim,
} from "./layers";

const KIND_BY_LAYER: Record<string, Selection["kind"]> = {
  "manholes-circle": "manhole",
  "outlets-circle": "outlet",
  "links-line": "link",
  "rivers-line": "river",
};

export default function MapView({ data }: { data: AppData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const readyRef = useRef(false);

  const layers = useStore((s) => s.layers);
  const basemap = useStore((s) => s.basemap);
  const simMode = useStore((s) => s.simMode);
  const simStep = useStore((s) => s.simStep);
  const trace = useStore((s) => s.trace);
  const selection = useStore((s) => s.selection);

  // ------------------------------------------------------------ map creation
  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current!,
      style: buildBaseStyle(data.config, useStore.getState().basemap),
      center: data.config.center,
      zoom: data.config.zoom,
      maxBounds: [
        [data.config.bounds[0][0] - 0.2, data.config.bounds[0][1] - 0.2],
        [data.config.bounds[1][0] + 0.2, data.config.bounds[1][1] + 0.2],
      ],
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }));
    map.on("load", () => {
      addDataLayers(map, data);
      applyVisibility(map, useStore.getState().layers, useStore.getState().simMode);
      readyRef.current = true;
    });

    const onClick = (e: MapMouseEvent) => {
      const feats = map.queryRenderedFeatures(e.point, { layers: CLICKABLE });
      const f = feats[0];
      if (!f) {
        useStore.getState().setSelection(null);
        return;
      }
      const kind = KIND_BY_LAYER[f.layer.id];
      const props = f.properties as Record<string, unknown>;
      useStore.getState().setSelection({
        kind,
        muid: String(props.muid ?? props.riverName ?? ""),
        properties: props,
      });
    };
    map.on("click", onClick);
    map.on("mousemove", (e) => {
      const feats = map.queryRenderedFeatures(e.point, { layers: CLICKABLE });
      map.getCanvas().style.cursor = feats.length ? "pointer" : "";
    });

    mapRef.current = map;
    mapRegistry.current = map;
    return () => {
      readyRef.current = false;
      mapRegistry.current = null;
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // --------------------------------------------------------------- basemap
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    for (const key of Object.keys(data.config.basemaps)) {
      map.setLayoutProperty(`basemap-${key}`, "visibility", key === basemap ? "visible" : "none");
    }
  }, [basemap, data]);

  // ------------------------------------------------------------- visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    applyVisibility(map, layers, simMode);
  }, [layers, simMode]);

  // --------------------------------------------------------- sim mode paint
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const c = data.config;
    map.setPaintProperty(
      "manholes-circle", "circle-color",
      simMode ? manholeColorSim(c) : manholeColorNormal(c),
    );
    map.setPaintProperty("links-line", "line-color", linkColorWithTrace(c, simMode));
    if (!simMode) clearSimStates(map, data);
  }, [simMode, data]);

  // ------------------------------------------------------- sim step states
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !simMode) return;
    applySimStep(map, data, simStep);
  }, [simStep, simMode, data]);

  // ------------------------------------------------------ selection + trace
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    map.removeFeatureState({ source: "manholes" });
    map.removeFeatureState({ source: "links" });
    if (selection && (selection.kind === "manhole" || selection.kind === "link")) {
      const source = selection.kind === "manhole" ? "manholes" : "links";
      map.setFeatureState({ source, id: selection.muid }, { selected: true });
    }
    if (trace) {
      const key = trace.direction === "upstream" ? "traceUp" : "traceDown";
      for (const n of trace.nodes) {
        map.setFeatureState({ source: "manholes", id: n }, { [key]: true });
      }
      for (const l of trace.links) {
        map.setFeatureState({ source: "links", id: l }, { [key]: true });
      }
    }
    // removeFeatureState also cleared sim fills - reapply them
    if (simMode) applySimStep(map, data, useStore.getState().simStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, trace]);

  return <div ref={containerRef} className="map-container" />;
}

function applyVisibility(map: MLMap, layers: Record<LayerKey, boolean>, simMode: boolean) {
  for (const [key, ids] of Object.entries(LAYER_IDS) as [LayerKey, string[]][]) {
    let visible = layers[key];
    if (key === "flood") visible = visible && simMode;
    for (const id of ids) {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
      }
    }
  }
}

function applySimStep(map: MLMap, data: AppData, step: number) {
  const { nodeFill } = data.simulation;
  for (const [muid, series] of Object.entries(nodeFill)) {
    map.setFeatureState({ source: "manholes", id: muid }, { fill: series[step] ?? 0 });
  }
  for (const [linkId, [a, b]] of Object.entries(data.topology.linkNodes)) {
    const fa = nodeFill[a]?.[step];
    const fb = nodeFill[b]?.[step];
    const vals = [fa, fb].filter((v): v is number => v !== undefined);
    const fill = vals.length ? Math.min(vals.reduce((s, v) => s + v, 0) / vals.length, 1) : 0;
    map.setFeatureState({ source: "links", id: linkId }, { fill });
  }
  for (const f of data.floodZones.features) {
    const p = f.properties as { zone: number; severity: number[] };
    map.setFeatureState({ source: "flood", id: p.zone }, { severity: p.severity[step] ?? 0 });
  }
}

function clearSimStates(map: MLMap, data: AppData) {
  map.removeFeatureState({ source: "flood" });
  // keep selection/trace states on manholes/links; only drop fill values
  for (const muid of Object.keys(data.simulation.nodeFill)) {
    map.setFeatureState({ source: "manholes", id: muid }, { fill: 0 });
  }
  for (const linkId of Object.keys(data.topology.linkNodes)) {
    map.setFeatureState({ source: "links", id: linkId }, { fill: 0 });
  }
}
