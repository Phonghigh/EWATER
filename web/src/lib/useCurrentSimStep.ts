import { useEffect, useState } from "react";
import { currentSimStep } from "./simTime";
import type { Simulation } from "../types";

const RECHECK_MS = 60_000; // minute-granularity is enough since stepMinutes is never sub-minute

/** Live-tracking "what step is real 'now'" — recomputed every minute so it
 *  keeps drifting forward with the real clock instead of freezing at
 *  whatever it was when the component mounted. Callers that need a
 *  manually-controllable step (e.g. `/gis-map`'s scrub/play controls) should
 *  only use this to *seed* their own local state, not bind to it directly,
 *  or user navigation would get overwritten every minute. */
export function useCurrentSimStep(simulation: Simulation): number {
  const [step, setStep] = useState(() => currentSimStep(simulation));

  useEffect(() => {
    const id = setInterval(() => setStep(currentSimStep(simulation)), RECHECK_MS);
    return () => clearInterval(id);
  }, [simulation]);

  return step;
}
