import { useMemo } from "react";
import { useAppData } from "../context/AppDataContext";
import { buildMonitoring, type Monitoring } from "./stations";

/** Memoised synthetic station registries derived from the loaded AppData. */
export function useMonitoring(): Monitoring {
  const data = useAppData();
  return useMemo(() => buildMonitoring(data), [data]);
}
