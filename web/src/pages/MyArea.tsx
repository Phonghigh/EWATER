import { useMemo, useState } from "react";
import {
  Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";
import { useT } from "../i18n/I18nContext";
import { useStore } from "../state/store";
import { nearestManhole } from "../network/nearest";
import { stepLabel } from "../sim/simEngine";
import { Card, StatCard } from "../components/Cards";
import DemoBadge from "../components/DemoBadge";
import PickLocationMap from "../map/PickLocationMap";

type Status = "ok" | "warn" | "bad";

export default function MyArea() {
  const data = useAppData();
  const t = useT();
  const { profile, updateHomeLocation } = useAuth();
  const step = useStore((s) => s.currentStep);
  const [picking, setPicking] = useState(false);

  const home: [number, number] | null =
    profile?.home_lng != null && profile?.home_lat != null ? [profile.home_lng, profile.home_lat] : null;

  const nearestId = useMemo(() => (home ? nearestManhole(data.manholes, home) : null), [home, data]);

  const manholeProps = useMemo(() => {
    if (!nearestId) return null;
    const f = data.manholes.features.find((ft) => String((ft.properties as Record<string, unknown>).muid) === nearestId);
    return (f?.properties as Record<string, unknown>) ?? null;
  }, [nearestId, data]);

  const series = nearestId ? data.simulation.nodeFill[nearestId] : undefined;
  const thresholds = data.config.simThresholds;

  const currentFill = series?.[step] ?? 0;
  const status: Status = currentFill >= thresholds.surcharge ? "bad" : currentFill >= thresholds.warn ? "warn" : "ok";
  const statusLabel = t(`myArea.status.${status}`);

  const forecastText = useMemo(() => {
    if (!series) return "";
    for (let i = step + 1; i < series.length; i++) {
      if (series[i] >= thresholds.surcharge) {
        const minutes = (i - step) * data.simulation.stepMinutes;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const dur = hours > 0 ? `${hours}h${mins > 0 ? mins : ""}` : `${mins} ${t("myArea.minutes")}`;
        return t("myArea.forecastFlood").replace("{time}", dur);
      }
    }
    return t("myArea.forecastNone");
  }, [series, step, thresholds, data.simulation.stepMinutes, t]);

  const invert = Number(manholeProps?.invertLevel ?? 0);
  const ground = Number(manholeProps?.groundLevel ?? 0);
  const chartData = series?.map((f, i) => ({
    t: stepLabel(data.simulation, i),
    level: Number((invert + f * (ground - invert)).toFixed(2)),
  }));

  function handlePick(lngLat: [number, number]) {
    updateHomeLocation(lngLat[0], lngLat[1]);
    setPicking(false);
  }

  return (
    <div className="content-page my-area">
      <div className="page-head">
        <h2>{t("myArea.title")} <DemoBadge title /></h2>
      </div>

      {(!home || picking) ? (
        <Card title={t("myArea.pickPrompt")}>
          <PickLocationMap data={data} value={home} onPick={handlePick} />
        </Card>
      ) : (
        <>
          <div className="dash-grid">
            <Card title={t("myArea.statusTitle")} className={`my-area-status status-${status}`}>
              <div className="stat-row">
                <StatCard label={t("myArea.currentStatus")} value={statusLabel} tone={status} />
              </div>
              <p className="my-area-forecast">{forecastText}</p>
            </Card>

            <Card title={t("myArea.chartTitle")} className="span-wide">
              {chartData && (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <XAxis dataKey="t" tick={{ fontSize: 10 }} interval={23} />
                    <YAxis tick={{ fontSize: 10 }} domain={[invert, Math.max(ground + 0.5, ground)]} />
                    <Tooltip />
                    <ReferenceLine y={ground} stroke="#dc2626" strokeDasharray="4 3" label={{ value: t("myArea.ground"), fontSize: 10 }} />
                    <ReferenceLine x={stepLabel(data.simulation, step)} stroke="#64748b" />
                    <Line type="monotone" dataKey="level" stroke="#2f6fb0" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          <button className="change-location-btn" onClick={() => setPicking(true)}>
            {t("myArea.changeLocation")}
          </button>
        </>
      )}
    </div>
  );
}
