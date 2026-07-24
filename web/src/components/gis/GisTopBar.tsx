import Icon from "../Icon";
import { useI18n } from "../../i18n/I18nContext";
import { stepTimeLabel } from "../../lib/simTime";
import type { Simulation } from "../../types";

// Forecast-horizon presets, each an *absolute* offset in hours from the
// "hiện tại" baseline - not a cumulative jump from wherever `step`
// currently is. 0 = "Hiện tại" itself.
const HOUR_PRESETS = [0, 1, 3, 4, 5, 6, 12, 24] as const;
const SPEEDS = [1, 2, 4] as const;

function clampStep(step: number, steps: number): number {
  return Math.max(0, Math.min(steps - 1, step));
}

export default function GisTopBar({
  simulation, step, onStepChange, baselineStep, playing, onTogglePlay, speed, onSpeedChange,
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
}) {
  const { t } = useI18n();
  const stepsPerHour = 60 / simulation.stepMinutes;

  function jumpToPreset(hours: number) {
    onStepChange(clampStep(baselineStep + Math.round(hours * stepsPerHour), simulation.steps));
  }

  const activePreset = (step - baselineStep) / stepsPerHour;

  return (
    <div className="gis-topbar">
      <div className="gis-topbar-search">
        <Icon name="search" size={18} />
        <input type="text" placeholder={t("gis.searchPlaceholder")} />
      </div>

      <div className="gis-topbar-time">
        <span className="gis-topbar-time-label">{t("gis.time")}</span>
        {HOUR_PRESETS.map((h) => (
          <button
            key={h}
            type="button"
            className={`gis-topbar-jump-btn${activePreset === h ? " active" : ""}`}
            onClick={() => jumpToPreset(h)}
          >
            {h === 0 ? t("gis.timeNow") : `+${h}h`}
          </button>
        ))}
        <span className="gis-topbar-clock">{stepTimeLabel(simulation.start, simulation.stepMinutes, step)}</span>
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
