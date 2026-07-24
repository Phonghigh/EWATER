import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useT } from "../../i18n/I18nContext";
import type { FeatureCollection } from "geojson";
import { RAIN_BUCKETS, rainColor, type RainTableRow } from "../../data/monitoringService";
import type { MapStyleConfig, RainStation } from "../../types";

const TREND_GLYPH: Record<string, string> = { up: "↑", down: "↓", flat: "−" };

/** Bản đồ trạm quan trắc — MapLibre gọn. Marker DOM tô màu theo lượng mưa 24h,
 *  liên kết 2 chiều với bảng: click marker → chọn trạm, hover → highlight hàng
 *  + popup mini (10′/1h/24h + xu hướng). Trạm offline có viền đỏ nhấp nháy.
 *  Chọn trạm (từ bảng/banner) làm bản đồ bay tới qua `flyNonce`. */
export default function MonitoringStationMap({
  stations,
  rain24h,
  config,
  provinceBoundary,
  rows = [],
  selectedCode = null,
  hoveredCode = null,
  onSelectStation,
  onHoverStation,
  flyNonce = 0,
}: {
  stations: RainStation[];
  rain24h: Map<string, number>;
  config: MapStyleConfig;
  provinceBoundary: FeatureCollection;
  rows?: RainTableRow[];
  selectedCode?: string | null;
  hoveredCode?: string | null;
  onSelectStation?: (code: string) => void;
  onHoverStation?: (code: string | null) => void;
  flyNonce?: number;
}) {
  const t = useT();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const elByCodeRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);

  // Refs giữ giá trị mới nhất cho các handler DOM gắn 1 lần lúc dựng marker
  // (tránh stale closure mà không phải dựng lại marker khi callback/rows đổi).
  const rowsRef = useRef<RainTableRow[]>(rows);
  const onSelectRef = useRef(onSelectStation);
  const onHoverRef = useRef(onHoverStation);
  const labelsRef = useRef({ r10min: "", r1h: "", r24h: "", trend: "" });
  rowsRef.current = rows;
  onSelectRef.current = onSelectStation;
  onHoverRef.current = onHoverStation;
  labelsRef.current = {
    r10min: t("mon.col.r10min"), r1h: t("mon.col.r1h"),
    r24h: t("mon.col.r24h"), trend: t("mon.col.trend"),
  };

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

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(el);

    map.on("load", () => {
      map.addSource("basemap-osm", {
        type: "raster", tiles: [config.basemaps.osm.tiles], tileSize: 256, attribution: config.basemaps.osm.attribution,
      });
      map.addLayer({ id: "basemap-osm", type: "raster", source: "basemap-osm" });

      // Ranh giới tỉnh Vĩnh Long — thuộc tính bắt buộc trên mọi bản đồ của app
      // (đồng bộ với /gis-map). Đường tím nét đứt, tĩnh nên thêm 1 lần lúc load;
      // marker là DOM element nên luôn nằm trên, không bị đường này che.
      map.addSource("province-boundary", { type: "geojson", data: provinceBoundary });
      map.addLayer({
        id: "province-boundary-line", type: "line", source: "province-boundary",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#7c3aed",
          "line-width": ["interpolate", ["linear"], ["zoom"], 8, 1.5, 12, 2.5, 16, 3.5],
          "line-dasharray": [3, 2],
          "line-opacity": 0.9,
        },
      });
    });

    return () => {
      resizeObserver.disconnect();
      hoverPopupRef.current?.remove();
      hoverPopupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [config]);

  // (Re)build station markers when rainfall (step) changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    elByCodeRef.current.clear();

    const popup = hoverPopupRef.current
      ?? (hoverPopupRef.current = new maplibregl.Popup({
        closeButton: false, closeOnClick: false, className: "mon-hover-popup", offset: 18, maxWidth: "220px",
      }));

    markersRef.current = stations.map((s) => {
      const mm = rain24h.get(s.code) ?? 0;
      const offline = s.status !== "online";
      const elm = document.createElement("div");
      elm.className = `mon-marker${offline ? " mon-marker--offline" : ""}`;
      elm.style.background = rainColor(mm);
      elm.textContent = String(Math.round(mm));
      elm.title = `${s.name}: ${mm.toFixed(1)} mm`;
      elByCodeRef.current.set(s.code, elm);

      elm.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRef.current?.(s.code);
      });
      elm.addEventListener("mouseenter", () => {
        onHoverRef.current?.(s.code);
        const r = rowsRef.current.find((x) => x.code === s.code);
        if (r && mapRef.current) {
          const L = labelsRef.current;
          const g = TREND_GLYPH[r.trend] ?? "−";
          popup
            .setLngLat([s.lng, s.lat])
            .setHTML(
              `<div class="mon-hover-card">
                 <div class="mon-hover-title">${r.name}</div>
                 <div class="mon-hover-grid">
                   <span>${L.r10min}</span><b>${r.r10min.toFixed(1)} mm</b>
                   <span>${L.r1h}</span><b>${r.r1h.toFixed(1)} mm</b>
                   <span>${L.r24h}</span><b>${r.r24h.toFixed(1)} mm</b>
                   <span>${L.trend}</span><b class="mon-trend--${r.trend}">${g}</b>
                 </div>
               </div>`,
            )
            .addTo(mapRef.current);
        }
      });
      elm.addEventListener("mouseleave", () => {
        onHoverRef.current?.(null);
        popup.remove();
      });

      return new maplibregl.Marker({ element: elm }).setLngLat([s.lng, s.lat]).addTo(map);
    });
  }, [stations, rain24h]);

  // Highlight + fly khi selection/hover đổi — KHÔNG dựng lại marker.
  useEffect(() => {
    for (const [code, elm] of elByCodeRef.current) {
      elm.classList.toggle("mon-marker--active", code === selectedCode);
      elm.classList.toggle("mon-marker--hover", code === hoveredCode);
    }
    const map = mapRef.current;
    if (map && selectedCode) {
      const s = stations.find((x) => x.code === selectedCode);
      if (s) map.flyTo({ center: [s.lng, s.lat], zoom: Math.max(map.getZoom(), 13.5), duration: 700 });
    }
  }, [selectedCode, hoveredCode, flyNonce, stations]);

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
        <span className="mon-map-legend-item">
          <span className="mon-map-legend-line" />
          {t("gis.legend.provinceBoundary")}
        </span>
      </div>
    </div>
  );
}
