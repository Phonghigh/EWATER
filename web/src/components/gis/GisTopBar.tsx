import Icon from "../Icon";
import GisSearchBox, { type StationHit } from "./GisSearchBox";
import { useI18n } from "../../i18n/I18nContext";
import { stepTimeLabel } from "../../lib/simTime";
import type { Simulation } from "../../types";

// Forecast-horizon presets, each an *absolute* offset in hours from the
// "hiện tại" baseline - not a cumulative jump from wherever `step`
// currently is. 0 = "Hiện tại" itself. Trimmed from 8 to 5 stops
// (2026-07-24 feedback): the +4h/+5h/+24h steps added choice-overload
// without adding decision value; Hiện tại / +1h / +3h / +6h / +12h covers
// the operational horizons operators actually jump between.
const HOUR_PRESETS = [0, 1, 3, 6, 12] as const;
const SPEEDS = [1, 2, 4] as const;

function clampStep(step: number, steps: number): number {
  return Math.max(0, Math.min(steps - 1, step));
}

export default function GisTopBar({
  simulation, step, onStepChange, baselineStep, playing, onTogglePlay, speed, onSpeedChange, stations, onSelectStation,
}: {
  simulation: Simulation;
  step: number;
  onStepChange: (step: number) => void;
  /** The step "Hiện tại" and every `+Nh` preset offset from — the real
   *  wall-clock time-of-day mapped onto the simulation's 24h cycle
   *  (`useCurrentSimStep`, computed by the caller so it can also seed the
   *  page's initial `step`). Passed in rather than computed here so
   *  clicking "Hiện tại" always reflects the time *at that moment*, not
   *  whatever it was when the page first mounted. Previously hardcoded
   *  to `0`/`steps - 1` here — both were placeholders that gave "Hiện tại"
   *  no real meaning; see docs/learn-log/FOLLOWUP-2026-07-23-live-now-time.md. */
  baselineStep: number;
  playing: boolean;
  onTogglePlay: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  /** Real station/culvert points for the search autocomplete (2026-07-24 follow-up). Picking
   *  one flies the map there via `onSelectStation`. No place-name/gazetteer
   *  search yet (no such data source), so muid is still the only search key. */
  stations: StationHit[];
  onSelectStation: (hit: StationHit) => void;
}) {
  const { t } = useI18n();
  const stepsPerHour = 60 / simulation.stepMinutes;

  function jumpToPreset(hours: number) {
    onStepChange(clampStep(baselineStep + Math.round(hours * stepsPerHour), simulation.steps));
  }

  const activePreset = (step - baselineStep) / stepsPerHour;

  return (
    <div className="gis-topbar">
      <GisSearchBox stations={stations} onSelect={onSelectStation} />

      <div className="gis-topbar-time">
        <span className="gis-topbar-time-label">{t("gis.time")}</span>
        <div className="gis-topbar-timeline">
          {HOUR_PRESETS.map((h) => (
            <button
              key={h}
              type="button"
              className={`gis-topbar-jump-btn${activePreset === h ? " active" : ""}`}
              onClick={() => jumpToPreset(h)}
            >
              {h === 0 ? t("gis.timeNow") : t(`gis.time.preset.h${h}`)}
            </button>
          ))}
        </div>
        {/* "Đang xem" clock is deliberately split off from the preset track
            (2026-07-24 feedback): the row read as one long ambiguous list of
            times. A left border + its own "Đang xem" label make clear this is
            the *current view state*, not another jump button. */}
        <div className="gis-topbar-clock-group">
          <span className="gis-topbar-clock-label">{t("gis.time.viewing")}</span>
          <span className="gis-topbar-clock">{stepTimeLabel(simulation.start, simulation.stepMinutes, step)}</span>
          <span className="gis-topbar-clock-caption">
            {step === baselineStep ? t("gis.time.liveLabel") : t("gis.time.simulatedLabel")}
          </span>
        </div>
      </div>

      <div className="gis-topbar-playback">
        <button
          type="button"
          className="gis-topbar-icon-btn"
          title={t("gis.stepBack")}
          onClick={() => onStepChange(clampStep(step - 1, simulation.steps))}
          disabled={step <= 0}
        >
          <Icon name="skip-previous" size={18} />
        </button>
        <button
          type="button"
          className="gis-topbar-icon-btn gis-topbar-icon-btn--primary"
          title={playing ? t("gis.pause") : t("gis.play")}
          onClick={onTogglePlay}
        >
          <Icon name={playing ? "pause" : "play"} size={18} />
          <span>{playing ? t("gis.pause") : t("gis.play")}</span>
        </button>
        <button
          type="button"
          className="gis-topbar-icon-btn"
          title={t("gis.stepForward")}
          onClick={() => onStepChange(clampStep(step + 1, simulation.steps))}
          disabled={step >= simulation.steps - 1}
        >
          <Icon name="skip-next" size={18} />
        </button>

        <span className="gis-topbar-speed-label">{t("gis.speed")}</span>
        <div className="gis-topbar-speed-group">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              className={`gis-topbar-speed-btn${s === speed ? " active" : ""}`}
              onClick={() => onSpeedChange(s)}
            >
              x{s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
