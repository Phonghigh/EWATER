import { useEffect, useRef } from "react";
import maplibregl, { Map as MLMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { AppData } from "../types";
import { buildBaseStyle } from "./layers";

/** Standalone map for picking a single point (e.g. citizen's home location).
 *  Deliberately independent of the shared store/mapRegistry used by MapView -
 *  it only shows the base tiles + city boundary and never touches the main map's state. */
export default function PickLocationMap({ data, value, onPick }: {
  data: AppData;
  value?: [number, number] | null;
  onPick: (lngLat: [number, number]) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markerRef = useRef<Marker | null>(null);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current!,
      style: buildBaseStyle(data.config, "osm"),
      center: value ?? data.config.center,
      zoom: value ? 16 : data.config.zoom,
      maxBounds: [
        [data.config.bounds[0][0] - 0.2, data.config.bounds[0][1] - 0.2],
        [data.config.bounds[1][0] + 0.2, data.config.bounds[1][1] + 0.2],
      ],
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      map.addSource("boundary", { type: "geojson", data: data.boundary });
      map.addLayer({
        id: "boundary-casing", type: "line", source: "boundary",
        paint: { "line-color": "#ffffff", "line-width": 5, "line-opacity": 0.85 },
      });
      map.addLayer({
        id: "boundary-line", type: "line", source: "boundary",
        paint: { "line-color": data.config.colors.boundary, "line-width": 2.5, "line-dasharray": [4, 2] },
      });
    });

    map.on("click", (e) => {
      onPick([e.lngLat.lng, e.lngLat.lat]);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ color: "#dc2626" });
    }
    markerRef.current.setLngLat(value).addTo(map);
  }, [value]);

  return <div ref={containerRef} className="pick-map" />;
}
