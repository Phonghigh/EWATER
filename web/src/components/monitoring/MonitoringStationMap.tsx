import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useT } from "../../i18n/I18nContext";
import { RAIN_BUCKETS, rainColor } from "../../data/monitoringService";
import type { MapStyleConfig, RainStation } from "../../types";

/** Bản đồ trạm quan trắc — MapLibre gọn, tái dùng khuôn khởi tạo + ResizeObserver
 *  của GisMapCanvas nhưng KHÔNG phụ thuộc layerState/sim của GIS. Marker DOM tô
 *  màu theo lượng mưa 24h (thang RAIN_BUCKETS) + nhãn mm, tránh phải nạp glyph.
 *  Chỉ dùng nền Streets (OSM) — không có toggle lớp dữ liệu. */
export default function MonitoringStationMap({
  stations,
  rain24h,
  config,
}: {
  stations: RainStation[];
  rain24h: Map<string, number>;
  config: MapStyleConfig;
}) {
  const t = useT();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Init map once.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const map = new maplibregl.Map({
      container: el,
      center: config.center,
      zoom: config.zoom,
      attributionControl: false,
      style: { version: 8, sources: {}, layers: [] },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    mapRef.current = map;

    // Same 0×0-in-flex-layout guard as GisMapCanvas: keep the canvas sized.
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(el);

    map.on("load", () => {
      map.addSource("basemap-osm", {
        type: "raster", tiles: [config.basemaps.osm.tiles], tileSize: 256, attribution: config.basemaps.osm.attribution,
      });
      map.addLayer({ id: "basemap-osm", type: "raster", source: "basemap-osm" });
    });

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [config]);

  // (Re)build station markers when rainfall (step) changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = stations.map((s) => {
      const mm = rain24h.get(s.code) ?? 0;
      const elm = document.createElement("div");
      elm.className = "mon-marker";
      elm.style.background = rainColor(mm);
      elm.textContent = String(Math.round(mm));
      elm.title = `${s.name}: ${mm.toFixed(1)} mm`;
      return new maplibregl.Marker({ element: elm }).setLngLat([s.lng, s.lat]).addTo(map);
    });
  }, [stations, rain24h]);

  return (
    <div className="mon-map-card">
      <div ref={containerRef} className="mon-map-canvas" />
      <div className="mon-map-legend">
        <span className="mon-map-legend-title">{t("mon.map.legend")}</span>
        {RAIN_BUCKETS.map((b) => (
          <span key={b.label} className="mon-map-legend-item">
            <span className="mon-map-legend-swatch" style={{ background: b.color }} />
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
