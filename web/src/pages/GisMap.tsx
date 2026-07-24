import { useEffect, useRef, useState } from "react";
import Icon from "../components/Icon";
import GisTopBar from "../components/gis/GisTopBar";
import GisLayerPanel, { DEFAULT_GIS_LAYER_STATE, type GisLayerState } from "../components/gis/GisLayerPanel";
import GisMapCanvas from "../components/gis/GisMapCanvas";
import GisRightPanel from "../components/gis/GisRightPanel";
import GisCameraCard from "../components/gis/GisCameraCard";
import RainForecastChart from "../components/RainForecastChart";
import WaterLevelForecastChart from "../components/WaterLevelForecastChart";
import { useAppData } from "../context/AppDataContext";
import { useT } from "../i18n/I18nContext";
import { useCurrentSimStep } from "../lib/useCurrentSimStep";

const DEFAULT_FLOOD_OPACITY = 0.35;

/** GIS flood map (Tab 2). P2-01 built the top toolbar + step/playback
 *  state; P2-02 added the left "Lớp dữ liệu" panel + its own local
 *  layer/basemap state; P2-03 added the real interactive MapLibre map;
 *  P2-04 added the right panel (flood-layer opacity + stats); P2-05 adds
 *  the bottom panel - reuses Dashboard's rain/water-level charts (P1-06)
 *  instead of the mockup's 3-tab biểu đồ/trạm/công trình panel (2026-07-23
 *  decision, see tasks/backlog/phase-2.md P2-05), plus a camera coming-soon
 *  placeholder. No `PageHeader`/page title on this page - the sidebar's
 *  active "Bản đồ GIS" nav item already names it, and a repeated title just
 *  ate vertical space the map should get instead (2026-07-23 follow-up).
 *  Both the left layer panel and the right info/stats panel now render as
 *  `GisMapCanvas`'s `children` - floating overlays anchored to opposite
 *  corners of the map canvas - instead of flex siblings in `.gis-body`, so
 *  `GisMapCanvas` always gets the full row width regardless of what's open
 *  (2026-07-23 follow-up, 3rd round). No shared `store.currentStep` exists
 *  (removed with `state/store.ts` in P0-16) - this page owns its own state
 *  until a real cross-page need for sharing it shows up. */
export default function GisMap() {
  const t = useT();
  const data = useAppData();
  const { simulation } = data;

  // Real wall-clock time-of-day mapped onto the simulation's 24h cycle
  // (2026-07-23 follow-up) — always live (recomputed every minute), used
  // both to seed the initial `step` below and as the "Hiện tại" baseline
  // passed to `GisTopBar` (so clicking "Hiện tại" later reflects the time
  // at that moment, not whatever it was on mount).
  const liveNowStep = useCurrentSimStep(simulation);
  const [step, setStep] = useState(liveNowStep);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [layerState, setLayerState] = useState<GisLayerState>(DEFAULT_GIS_LAYER_STATE);
  // Left "Lớp dữ liệu" panel starts hidden and now floats *over* the map
  // instead of sharing the row with it (2026-07-23 follow-up, 2nd round) -
  // the map gets full width whether the panel is open or closed.
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [floodOpacity, setFloodOpacity] = useState(DEFAULT_FLOOD_OPACITY);
  // User-toggleable collapse for the bottom analytics row (P2-18, feedback
  // #12) - separate from the >1100px responsive breakpoint already in
  // styles.css, which only kicks in for narrow viewports.
  const [bottomCollapsed, setBottomCollapsed] = useState(false);
  // Focus Mode (P2-19, feedback #15) - hides layer/right panels + bottom row
  // so the map gets ~90-95% of the viewport; doesn't touch `bottomCollapsed`
  // so exiting focus mode restores whatever the user's manual bottom-row
  // preference was.
  const [focusMode, setFocusMode] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(() => {
      setStep((s) => {
        if (s >= simulation.steps - 1) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 1000 / speed);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, speed, simulation.steps]);

  // Search groundwork (P2-20, feedback #3) - real station/culvert muids
  // only, no place-name autocomplete (no gazetteer data source exists).
  const stationIds = [...data.manholes.features, ...data.outlets.features]
    .map((f) => String(f.properties?.muid))
    .filter(Boolean);

  return (
    <div
      className={`content-page2${focusMode ? " gis-focus-mode" : ""}${(bottomCollapsed || focusMode) ? " gis-bottom-collapsed" : ""}`}
    >
      <GisTopBar
        simulation={simulation}
        step={step}
        onStepChange={setStep}
        baselineStep={liveNowStep}
        playing={playing}
        onTogglePlay={() => setPlaying((p) => !p)}
        speed={speed}
        onSpeedChange={setSpeed}
        stationIds={stationIds}
      />
      <div className="gis-body">
        <GisMapCanvas
          data={data}
          step={step}
          layerState={layerState}
          floodOpacity={floodOpacity}
          focusMode={focusMode}
          onToggleFocusMode={() => setFocusMode((v) => !v)}
          onFocusStation={() => setFocusMode(true)}
        >
          {!focusMode && (
            <div className="gis-layer-overlay">
              {showLayerPanel && <GisLayerPanel state={layerState} onChange={setLayerState} />}
              <button
                type="button"
                className="gis-layer-toggle-btn"
                title={t(showLayerPanel ? "gis.layer.hidePanel" : "gis.layer.showPanel")}
                onClick={() => setShowLayerPanel((v) => !v)}
              >
                <Icon name={showLayerPanel ? "chevron-left" : "layers"} size={18} />
              </button>
            </div>
          )}
          {!focusMode && (
            <GisRightPanel data={data} step={step} floodOpacity={floodOpacity} onFloodOpacityChange={setFloodOpacity} />
          )}
        </GisMapCanvas>
      </div>
      {!focusMode && (
        <div className="gis-bottom-toggle-row">
          <button type="button" className="gis-bottom-toggle-btn" onClick={() => setBottomCollapsed((v) => !v)}>
            <Icon name={bottomCollapsed ? "chevron-left" : "chevron-right"} size={14} />
            <span>{t(bottomCollapsed ? "gis.bottomPanel.expand" : "gis.bottomPanel.collapse")}</span>
          </button>
        </div>
      )}
      {!focusMode && !bottomCollapsed && (
        <div className="gis-bottom-row">
          <RainForecastChart time={data.rainForecast.time} mm={data.rainForecast.precipitation} />
          <WaterLevelForecastChart time={data.tide.time} levelM={data.tide.levelM} />
          <GisCameraCard />
        </div>
      )}
    </div>
  );
}
