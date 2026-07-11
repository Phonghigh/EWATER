import { useAppData } from "../context/AppDataContext";
import { useStore } from "../state/store";
import { useT } from "../i18n/I18nContext";
import { stepLabel } from "../sim/simEngine";
import DemoBadge from "./DemoBadge";

/** Shared "now" cursor over the 24h synthetic storm, used by Dashboard/Monitor/Report. */
export default function StepControl() {
  const data = useAppData();
  const t = useT();
  const step = useStore((s) => s.currentStep);
  const setStep = useStore((s) => s.setCurrentStep);
  const sim = data.simulation;

  return (
    <div className="step-control">
      <span className="step-label">{t("dash.now")}:</span>
      <strong className="step-clock">{stepLabel(sim, step)}</strong>
      <input
        type="range"
        min={0}
        max={sim.steps - 1}
        value={step}
        onChange={(e) => setStep(Number(e.target.value))}
      />
      <span className="step-day">{t("dash.stormLabel")}</span>
      <DemoBadge title />
    </div>
  );
}
