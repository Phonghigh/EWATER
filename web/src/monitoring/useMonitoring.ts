import { useMemo } from "react";
import { useAppData } from "../context/AppDataContext";
import { useI18n } from "../i18n/I18nContext";
import { buildMonitoring, type Monitoring } from "./stations";

/** Memoised synthetic station registries derived from the loaded AppData. */
export function useMonitoring(): Monitoring {
  const data = useAppData();
  const { lang, t } = useI18n();
  return useMemo(() => buildMonitoring(data, t), [data, lang, t]);
}
